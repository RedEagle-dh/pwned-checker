export interface SafetyTip {
	category: string;
	tips: string[];
}

// Tips organized by category, mapped to data class patterns
const TIPS_BY_CATEGORY: {
	category: string;
	patterns: string[];
	tips: string[];
}[] = [
	{
		category: "Password Security",
		patterns: ["password"],
		tips: [
			"Change your password on any accounts where you used this password",
			"Enable two-factor authentication (2FA) wherever possible",
			"Use a password manager to generate and store unique passwords",
			"Never reuse passwords across multiple sites",
		],
	},
	{
		category: "Financial Protection",
		patterns: ["credit card", "financial", "payment", "bank account"],
		tips: [
			"Monitor your credit card and bank statements for suspicious activity",
			"Set up transaction alerts with your financial institutions",
			"Consider requesting a new card number from your bank",
			"Report any unauthorized transactions immediately",
		],
	},
	{
		category: "Identity Protection",
		patterns: ["social security", "national id", "government issued id"],
		tips: [
			"Consider placing a credit freeze with all three credit bureaus",
			"Place a fraud alert on your credit file",
			"Monitor your credit reports regularly for suspicious activity",
			"Be cautious of unsolicited contact claiming to be from government agencies",
		],
	},
	{
		category: "Phone Security",
		patterns: ["phone number"],
		tips: [
			"Be alert for phishing calls and suspicious SMS messages",
			"Don't trust caller ID - it can be spoofed",
			"Never give out personal information to unexpected callers",
			"Consider using call screening apps",
		],
	},
	{
		category: "Email Security",
		patterns: ["email address"],
		tips: [
			"Watch for phishing emails related to this breach",
			"Enable email filtering to catch suspicious messages",
			"Don't click links in unexpected emails - go directly to websites",
			"Consider using email aliases for different services",
		],
	},
	{
		category: "Physical Security",
		patterns: ["physical address", "address"],
		tips: [
			"Monitor for suspicious mail or packages",
			"Consider signing up for USPS Informed Delivery",
			"Be cautious of unexpected visitors claiming official business",
		],
	},
	{
		category: "Account Security",
		patterns: ["security question"],
		tips: [
			"Update security questions on your important accounts",
			"Use random answers that can't be guessed or researched",
			"Store security question answers in your password manager",
		],
	},
	{
		category: "Personal Information",
		patterns: ["date of birth", "dob", "birth date"],
		tips: [
			"Be cautious of accounts using your date of birth for verification",
			"Avoid sharing your birth date publicly on social media",
		],
	},
	{
		category: "Online Privacy",
		patterns: ["ip address"],
		tips: [
			"Consider using a VPN for additional privacy",
			"Be aware that your general location may be known",
		],
	},
];

// General tips that apply to all breaches
const GENERAL_TIPS: SafetyTip = {
	category: "General Recommendations",
	tips: [
		"Stay vigilant for targeted phishing attempts using your exposed information",
		"Review your account activity on the affected service",
		"Consider what other accounts might be at risk",
	],
};

/**
 * Get safety tips relevant to the exposed data classes in a breach
 */
export function getSafetyTips(dataClasses: string[]): SafetyTip[] {
	const normalizedDataClasses = dataClasses.map((dc) => dc.toLowerCase());
	const matchedCategories = new Set<string>();
	const result: SafetyTip[] = [];

	for (const tipGroup of TIPS_BY_CATEGORY) {
		// Check if any data class matches any pattern for this category
		const matches = tipGroup.patterns.some((pattern) =>
			normalizedDataClasses.some((dc) => dc.includes(pattern)),
		);

		if (matches && !matchedCategories.has(tipGroup.category)) {
			matchedCategories.add(tipGroup.category);
			result.push({
				category: tipGroup.category,
				tips: tipGroup.tips,
			});
		}
	}

	// Always add general tips at the end
	result.push(GENERAL_TIPS);

	return result;
}
