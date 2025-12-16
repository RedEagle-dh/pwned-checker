import { getDecryptedApiKeys, getRpmLimit } from "~/server/services/settings";

const HIBP_BASE_URL = "https://haveibeenpwned.com/api/v3";
const USER_AGENT = "PwnedChecker/1.0";

export interface BreachData {
	Name: string;
	Title: string;
	Domain: string;
	BreachDate: string;
	AddedDate: string;
	ModifiedDate: string;
	PwnCount: number;
	Description: string;
	DataClasses: string[];
	IsVerified: boolean;
	IsFabricated: boolean;
	IsSensitive: boolean;
	IsRetired: boolean;
	IsSpamList: boolean;
	IsMalware: boolean;
	IsSubscriptionFree: boolean;
	LogoPath: string;
}

export class HIBPError extends Error {
	constructor(
		message: string,
		public statusCode: number,
		public retryAfter?: number,
	) {
		super(message);
		this.name = "HIBPError";
	}
}

async function getHibpApiKey(): Promise<string> {
	const { hibpApiKey } = await getDecryptedApiKeys();
	if (!hibpApiKey) {
		throw new HIBPError("HIBP API key not configured", 401);
	}
	return hibpApiKey;
}

export async function checkEmailBreaches(email: string): Promise<BreachData[]> {
	const apiKey = await getHibpApiKey();

	const response = await fetch(
		`${HIBP_BASE_URL}/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`,
		{
			headers: {
				"hibp-api-key": apiKey,
				"user-agent": USER_AGENT,
			},
		},
	);

	if (response.status === 404) {
		return [];
	}

	if (response.status === 429) {
		const retryAfter = parseInt(
			response.headers.get("retry-after") ?? "60",
			10,
		);
		throw new HIBPError("Rate limit exceeded", 429, retryAfter);
	}

	if (response.status === 401) {
		throw new HIBPError("Invalid API key", 401);
	}

	if (response.status === 403) {
		throw new HIBPError("Forbidden - missing user agent or blocked", 403);
	}

	if (!response.ok) {
		throw new HIBPError(`HIBP API error: ${response.status}`, response.status);
	}

	return response.json() as Promise<BreachData[]>;
}

export function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// Calculate delay between requests based on RPM
export async function getRateLimitDelay(): Promise<number> {
	const rpm = await getRpmLimit();
	// Calculate delay: 60000ms / RPM = ms between requests
	return Math.ceil(60000 / rpm);
}

export interface BatchStrategy {
	batchSize: number;
	delayBetweenBatches: number; // ms - time to wait between batches
	delayBetweenRequests: number; // ms - time between individual requests
}

// Calculate batch processing strategy based on RPM and total emails
export async function getBatchStrategy(
	totalEmails: number,
): Promise<BatchStrategy> {
	const rpm = await getRpmLimit();

	// Delay between individual requests within a batch
	// Add a small buffer (10%) to avoid hitting rate limits
	const delayBetweenRequests = Math.ceil((60000 / rpm) * 1.1);

	// If we have fewer emails than RPM, process them all in one batch
	if (totalEmails <= rpm) {
		return {
			batchSize: totalEmails,
			delayBetweenBatches: 0,
			delayBetweenRequests,
		};
	}

	// Process in batches of RPM size with 1 minute between batches
	return {
		batchSize: rpm,
		delayBetweenBatches: 60000, // Wait 1 minute between batches
		delayBetweenRequests,
	};
}

// Legacy export for backwards compatibility (will be removed)
export const RATE_LIMIT_DELAY_MS = 6000;
