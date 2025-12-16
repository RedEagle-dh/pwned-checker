import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { encrypt } from "~/server/services/encryption";
import { getDecryptedApiKeys } from "~/server/services/settings";

const HIBP_USER_AGENT = "PwnedChecker/1.0";

export const settingsRouter = createTRPCRouter({
	get: publicProcedure.query(async ({ ctx }) => {
		let settings = await ctx.db.settings.findUnique({
			where: { id: "singleton" },
		});

		if (!settings) {
			settings = await ctx.db.settings.create({
				data: { id: "singleton" },
			});
		}

		// Return settings WITHOUT decrypted keys (show masked status only)
		return {
			...settings,
			hasHibpApiKey: !!settings.hibpApiKeyEncrypted,
			hasResendApiKey: !!settings.resendApiKeyEncrypted,
			// Don't expose encrypted values to client
			hibpApiKeyEncrypted: undefined,
			resendApiKeyEncrypted: undefined,
		};
	}),

	isConfigured: publicProcedure.query(async ({ ctx }) => {
		const settings = await ctx.db.settings.findUnique({
			where: { id: "singleton" },
		});

		const hasHibpKey = !!settings?.hibpApiKeyEncrypted;
		const hasResendKey = !!settings?.resendApiKeyEncrypted;
		const hasNotificationEmail = !!settings?.notificationEmail;

		return {
			isConfigured: hasHibpKey && hasResendKey && hasNotificationEmail,
			hasHibpKey,
			hasResendKey,
			hasNotificationEmail,
		};
	}),

	updateApiKeys: publicProcedure
		.input(
			z.object({
				hibpApiKey: z.string().min(1).optional(),
				resendApiKey: z.string().min(1).optional(),
				notificationEmail: z.string().email().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const data: {
				hibpApiKeyEncrypted?: string;
				resendApiKeyEncrypted?: string;
				notificationEmail?: string;
			} = {};

			if (input.hibpApiKey) {
				data.hibpApiKeyEncrypted = encrypt(input.hibpApiKey);
			}
			if (input.resendApiKey) {
				data.resendApiKeyEncrypted = encrypt(input.resendApiKey);
			}
			if (input.notificationEmail) {
				data.notificationEmail = input.notificationEmail;
			}

			const updated = await ctx.db.settings.upsert({
				where: { id: "singleton" },
				update: data,
				create: { id: "singleton", ...data },
			});

			return {
				...updated,
				hasHibpApiKey: !!updated.hibpApiKeyEncrypted,
				hasResendApiKey: !!updated.resendApiKeyEncrypted,
				hibpApiKeyEncrypted: undefined,
				resendApiKeyEncrypted: undefined,
			};
		}),

	updateSchedule: publicProcedure
		.input(
			z.object({
				dailyScanHour: z.number().min(0).max(23),
				dailyScanMinute: z.number().min(0).max(59),
				weeklyScanDay: z.number().min(0).max(6),
				weeklyScanHour: z.number().min(0).max(23),
				weeklyScanMinute: z.number().min(0).max(59),
				monthlyScanDay: z.number().min(1).max(28),
				monthlyScanHour: z.number().min(0).max(23),
				monthlyScanMinute: z.number().min(0).max(59),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return ctx.db.settings.update({
				where: { id: "singleton" },
				data: input,
			});
		}),

	refreshSubscription: publicProcedure.mutation(async ({ ctx }) => {
		const { hibpApiKey } = await getDecryptedApiKeys();
		if (!hibpApiKey) {
			throw new Error("HIBP API key not configured");
		}

		const response = await fetch(
			"https://haveibeenpwned.com/api/v3/subscription/status",
			{
				headers: {
					"hibp-api-key": hibpApiKey,
					"user-agent": HIBP_USER_AGENT,
				},
			},
		);

		if (!response.ok) {
			if (response.status === 401) {
				throw new Error("Invalid HIBP API key");
			}
			throw new Error(`Failed to fetch subscription: ${response.status}`);
		}

		const data = (await response.json()) as {
			SubscriptionName: string;
			Description: string;
			SubscribedUntil: string | null;
			Rpm: number;
			DomainSearchMaxBreachedAccounts: number;
			IncludesStealerLogs: boolean;
		};

		const updated = await ctx.db.settings.update({
			where: { id: "singleton" },
			data: {
				hibpSubscriptionName: data.SubscriptionName,
				hibpDescription: data.Description,
				hibpSubscribedUntil: data.SubscribedUntil
					? new Date(data.SubscribedUntil)
					: null,
				hibpRpm: data.Rpm,
				hibpDomainSearchMax: data.DomainSearchMaxBreachedAccounts,
				hibpIncludesStealerLogs: data.IncludesStealerLogs ?? false,
				hibpSubscriptionUpdatedAt: new Date(),
			},
		});

		return {
			...updated,
			hasHibpApiKey: !!updated.hibpApiKeyEncrypted,
			hasResendApiKey: !!updated.resendApiKeyEncrypted,
			hibpApiKeyEncrypted: undefined,
			resendApiKeyEncrypted: undefined,
		};
	}),

	clearApiKey: publicProcedure
		.input(
			z.object({
				key: z.enum(["hibp", "resend"]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const data =
				input.key === "hibp"
					? { hibpApiKeyEncrypted: null }
					: { resendApiKeyEncrypted: null };

			return ctx.db.settings.update({
				where: { id: "singleton" },
				data,
			});
		}),
});
