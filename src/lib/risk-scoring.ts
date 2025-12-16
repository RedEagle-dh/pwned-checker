export const RiskLevel = {
	CRITICAL: "critical",
	HIGH: "high",
	MEDIUM: "medium",
	LOW: "low",
} as const;

export type RiskLevel = (typeof RiskLevel)[keyof typeof RiskLevel];

// Data classes that indicate each risk level
// Order matters - we check from most severe to least
const CRITICAL_DATA_CLASSES = [
	"passwords",
	"credit cards",
	"credit card cvvs",
	"bank account numbers",
	"security questions and answers",
	"partial credit card data",
	"financial data",
];

const HIGH_DATA_CLASSES = [
	"phone numbers",
	"physical addresses",
	"social security numbers",
	"government issued ids",
	"passport numbers",
	"drivers licenses",
	"national ids",
	"tax identifiers",
	"dates of birth",
];

const MEDIUM_DATA_CLASSES = [
	"email addresses",
	"usernames",
	"ip addresses",
	"device information",
	"browser user agent details",
	"employers",
	"job titles",
];

// Everything else is LOW

export function calculateRiskLevel(dataClasses: string[]): RiskLevel {
	if (!dataClasses || dataClasses.length === 0) {
		return RiskLevel.LOW;
	}

	const normalized = dataClasses.map((dc) => dc.toLowerCase().trim());

	// Check for critical data classes
	for (const criticalClass of CRITICAL_DATA_CLASSES) {
		if (normalized.some((dc) => dc.includes(criticalClass))) {
			return RiskLevel.CRITICAL;
		}
	}

	// Check for high-risk data classes
	for (const highClass of HIGH_DATA_CLASSES) {
		if (normalized.some((dc) => dc.includes(highClass))) {
			return RiskLevel.HIGH;
		}
	}

	// Check for medium-risk data classes
	for (const mediumClass of MEDIUM_DATA_CLASSES) {
		if (normalized.some((dc) => dc.includes(mediumClass))) {
			return RiskLevel.MEDIUM;
		}
	}

	return RiskLevel.LOW;
}

export const RISK_CONFIG: Record<
	RiskLevel,
	{
		label: string;
		variant: "destructive" | "warning" | "secondary" | "outline";
	}
> = {
	critical: {
		label: "Critical",
		variant: "destructive",
	},
	high: {
		label: "High",
		variant: "warning",
	},
	medium: {
		label: "Medium",
		variant: "secondary",
	},
	low: {
		label: "Low",
		variant: "outline",
	},
};

export function getRiskConfig(riskLevel: RiskLevel) {
	return RISK_CONFIG[riskLevel];
}
