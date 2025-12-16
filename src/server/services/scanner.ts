import type { ScanFrequency } from "~/generated/prisma";
import { db } from "~/server/db";
import { sendBreachAlert, sendScanSummary } from "./email-sender";
import {
	type BatchStrategy,
	type BreachData,
	checkEmailBreaches,
	delay,
	getBatchStrategy,
	HIBPError,
} from "./hibp";

interface ScanResult {
	emailsScanned: number;
	newBreaches: number;
	errors: string[];
}

interface PendingBreachEmail {
	id: string;
	name: string;
	title: string | null;
	domain: string | null;
	breachDate: Date | null;
	dataClasses: string[];
	pwnCount: number | null;
}

function shouldScanEmail(
	lastScannedAt: Date | null,
	frequency: ScanFrequency,
): boolean {
	if (!lastScannedAt) return true;

	const now = new Date();
	const diffMs = now.getTime() - lastScannedAt.getTime();
	const diffDays = diffMs / (1000 * 60 * 60 * 24);

	switch (frequency) {
		case "DAILY":
			return diffDays >= 1;
		case "WEEKLY":
			return diffDays >= 7;
		case "MONTHLY":
			return diffDays >= 30;
		default:
			return true;
	}
}

async function processEmailBreaches(
	emailId: string,
	breaches: BreachData[],
): Promise<{ newBreachCount: number; pendingEmails: PendingBreachEmail[] }> {
	let newBreachCount = 0;
	const pendingEmails: PendingBreachEmail[] = [];

	for (const breach of breaches) {
		const existing = await db.breach.findUnique({
			where: {
				emailId_name: {
					emailId,
					name: breach.Name,
				},
			},
		});

		if (!existing) {
			const created = await db.breach.create({
				data: {
					emailId,
					name: breach.Name,
					title: breach.Title,
					domain: breach.Domain,
					breachDate: breach.BreachDate ? new Date(breach.BreachDate) : null,
					addedDate: breach.AddedDate ? new Date(breach.AddedDate) : null,
					pwnCount: breach.PwnCount,
					description: breach.Description,
					dataClasses: breach.DataClasses,
					isVerified: breach.IsVerified,
				},
			});

			await db.notification.create({
				data: {
					emailId,
					type: "NEW_BREACH",
					message: `New breach detected: ${breach.Title || breach.Name} - Exposed data: ${breach.DataClasses.join(", ")}`,
				},
			});

			pendingEmails.push({
				id: created.id,
				name: breach.Name,
				title: breach.Title,
				domain: breach.Domain,
				breachDate: breach.BreachDate ? new Date(breach.BreachDate) : null,
				dataClasses: breach.DataClasses,
				pwnCount: breach.PwnCount,
			});

			newBreachCount++;
		}
	}

	return { newBreachCount, pendingEmails };
}

async function sendPendingBreachEmails(
	emailAddress: string,
	pendingBreaches: PendingBreachEmail[],
): Promise<void> {
	if (pendingBreaches.length === 0) return;

	try {
		await sendBreachAlert({
			emailAddress,
			breaches: pendingBreaches.map((b) => ({
				name: b.name,
				title: b.title ?? b.name,
				domain: b.domain ?? "",
				breachDate: b.breachDate?.toISOString().split("T")[0] ?? null,
				dataClasses: b.dataClasses,
				pwnCount: b.pwnCount,
			})),
		});

		// Mark all breaches as email sent
		await db.breach.updateMany({
			where: {
				id: { in: pendingBreaches.map((b) => b.id) },
			},
			data: {
				emailSentAt: new Date(),
			},
		});
	} catch (error) {
		console.error(
			`Failed to send breach alert email for ${emailAddress}:`,
			error,
		);
		// Don't set emailSentAt - will retry on next scan
	}
}

async function retryPendingEmails(): Promise<number> {
	// Find all breaches that haven't had their email sent yet
	const pendingBreaches = await db.breach.findMany({
		where: {
			emailSentAt: null,
		},
		include: {
			email: {
				select: { address: true },
			},
		},
	});

	if (pendingBreaches.length === 0) return 0;

	// Group by email address
	const groupedByEmail = pendingBreaches.reduce(
		(acc, breach) => {
			const address = breach.email.address;
			if (!acc[address]) {
				acc[address] = [];
			}
			acc[address].push(breach);
			return acc;
		},
		{} as Record<string, typeof pendingBreaches>,
	);

	let sentCount = 0;

	for (const [emailAddress, breaches] of Object.entries(groupedByEmail)) {
		const pendingEmails: PendingBreachEmail[] = breaches.map((b) => ({
			id: b.id,
			name: b.name,
			title: b.title,
			domain: b.domain,
			breachDate: b.breachDate,
			dataClasses: b.dataClasses,
			pwnCount: b.pwnCount,
		}));

		await sendPendingBreachEmails(emailAddress, pendingEmails);
		sentCount += pendingEmails.length;
	}

	return sentCount;
}

async function processEmailWithRetry(
	email: { id: string; address: string },
	result: ScanResult,
	_strategy: BatchStrategy,
): Promise<void> {
	try {
		const breaches = await checkEmailBreaches(email.address);
		const { newBreachCount, pendingEmails } = await processEmailBreaches(
			email.id,
			breaches,
		);

		// Send email notification for new breaches
		await sendPendingBreachEmails(email.address, pendingEmails);

		result.newBreaches += newBreachCount;
		result.emailsScanned++;

		await db.email.update({
			where: { id: email.id },
			data: { lastScannedAt: new Date() },
		});
	} catch (error) {
		if (error instanceof HIBPError && error.statusCode === 429) {
			// Rate limited - wait and retry
			const waitTime = (error.retryAfter ?? 60) * 1000;
			console.log(
				`[Scan] Rate limited on ${email.address}, waiting ${waitTime}ms before retry...`,
			);
			await delay(waitTime);

			// Retry this email
			try {
				const breaches = await checkEmailBreaches(email.address);
				const { newBreachCount, pendingEmails } = await processEmailBreaches(
					email.id,
					breaches,
				);

				await sendPendingBreachEmails(email.address, pendingEmails);

				result.newBreaches += newBreachCount;
				result.emailsScanned++;

				await db.email.update({
					where: { id: email.id },
					data: { lastScannedAt: new Date() },
				});
			} catch (retryError) {
				const errorMsg = `Failed to scan ${email.address} after retry: ${retryError instanceof Error ? retryError.message : String(retryError)}`;
				result.errors.push(errorMsg);
				console.error(`[Scan] ${errorMsg}`);
			}
		} else {
			const errorMsg = `Failed to scan ${email.address}: ${error instanceof Error ? error.message : String(error)}`;
			result.errors.push(errorMsg);
			console.error(`[Scan] ${errorMsg}`);
		}
	}
}

export async function runScan(frequency?: ScanFrequency): Promise<ScanResult> {
	const scanLog = await db.scanLog.create({
		data: {
			status: "RUNNING",
		},
	});

	const result: ScanResult = {
		emailsScanned: 0,
		newBreaches: 0,
		errors: [],
	};

	try {
		// First, retry any pending email notifications from previous failed attempts
		await retryPendingEmails();

		const whereClause = frequency ? { scanFrequency: frequency } : {};
		const emails = await db.email.findMany({
			where: whereClause,
		});

		const emailsToScan = emails.filter((email) =>
			shouldScanEmail(email.lastScannedAt, email.scanFrequency),
		);

		if (emailsToScan.length === 0) {
			console.log("[Scan] No emails to scan");
			await db.scanLog.update({
				where: { id: scanLog.id },
				data: {
					status: "COMPLETED",
					completedAt: new Date(),
					emailsScanned: 0,
					newBreaches: 0,
				},
			});
			return result;
		}

		// Get batch strategy based on RPM and number of emails
		const strategy = await getBatchStrategy(emailsToScan.length);
		console.log(
			`[Scan] Processing ${emailsToScan.length} emails with strategy: ` +
				`batchSize=${strategy.batchSize}, delayBetweenRequests=${strategy.delayBetweenRequests}ms, ` +
				`delayBetweenBatches=${strategy.delayBetweenBatches}ms`,
		);

		// Process emails in batches
		for (
			let batchStart = 0;
			batchStart < emailsToScan.length;
			batchStart += strategy.batchSize
		) {
			const batchEnd = Math.min(
				batchStart + strategy.batchSize,
				emailsToScan.length,
			);
			const batch = emailsToScan.slice(batchStart, batchEnd);
			const batchNumber = Math.floor(batchStart / strategy.batchSize) + 1;
			const totalBatches = Math.ceil(emailsToScan.length / strategy.batchSize);

			console.log(
				`[Scan] Processing batch ${batchNumber}/${totalBatches} (${batch.length} emails)`,
			);

			// Process each email in the batch
			for (let i = 0; i < batch.length; i++) {
				const email = batch[i]!;

				await processEmailWithRetry(email, result, strategy);

				// Rate limiting: wait between requests (except for last email in batch)
				if (i < batch.length - 1) {
					await delay(strategy.delayBetweenRequests);
				}
			}

			// Wait between batches (except for last batch)
			if (batchEnd < emailsToScan.length && strategy.delayBetweenBatches > 0) {
				console.log(
					`[Scan] Batch ${batchNumber} complete, waiting ${strategy.delayBetweenBatches / 1000}s before next batch...`,
				);
				await delay(strategy.delayBetweenBatches);
			}
		}

		await db.scanLog.update({
			where: { id: scanLog.id },
			data: {
				status: "COMPLETED",
				completedAt: new Date(),
				emailsScanned: result.emailsScanned,
				newBreaches: result.newBreaches,
				errors: result.errors.length > 0 ? result.errors.join("\n") : null,
			},
		});

		// Send summary email if there were new breaches or errors
		if (result.newBreaches > 0 || result.errors.length > 0) {
			try {
				await sendScanSummary(
					result.emailsScanned,
					result.newBreaches,
					result.errors,
				);
			} catch (error) {
				console.error("[Scan] Failed to send scan summary email:", error);
			}
		}
	} catch (error) {
		await db.scanLog.update({
			where: { id: scanLog.id },
			data: {
				status: "FAILED",
				completedAt: new Date(),
				errors: error instanceof Error ? error.message : String(error),
			},
		});
		throw error;
	}

	return result;
}

export async function scanSingleEmail(emailId: string): Promise<{
	breachCount: number;
	newBreaches: number;
}> {
	const email = await db.email.findUnique({
		where: { id: emailId },
	});

	if (!email) {
		throw new Error("Email not found");
	}

	const breaches = await checkEmailBreaches(email.address);
	const { newBreachCount, pendingEmails } = await processEmailBreaches(
		email.id,
		breaches,
	);

	// Send email notification for new breaches
	await sendPendingBreachEmails(email.address, pendingEmails);

	await db.email.update({
		where: { id: email.id },
		data: { lastScannedAt: new Date() },
	});

	return {
		breachCount: breaches.length,
		newBreaches: newBreachCount,
	};
}
