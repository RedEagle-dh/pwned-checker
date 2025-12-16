import type { Settings } from "~/generated/prisma";
import { db } from "~/server/db";
import { decrypt } from "./encryption";

export async function getSettings(): Promise<Settings> {
	let settings = await db.settings.findUnique({
		where: { id: "singleton" },
	});

	if (!settings) {
		settings = await db.settings.create({
			data: { id: "singleton" },
		});
	}

	return settings;
}

export interface DecryptedApiKeys {
	hibpApiKey: string | null;
	resendApiKey: string | null;
	notificationEmail: string | null;
}

export async function getDecryptedApiKeys(): Promise<DecryptedApiKeys> {
	const settings = await getSettings();

	return {
		hibpApiKey: settings.hibpApiKeyEncrypted
			? decrypt(settings.hibpApiKeyEncrypted)
			: null,
		resendApiKey: settings.resendApiKeyEncrypted
			? decrypt(settings.resendApiKeyEncrypted)
			: null,
		notificationEmail: settings.notificationEmail,
	};
}

export interface ConfigurationStatus {
	isConfigured: boolean;
	hasHibpKey: boolean;
	hasResendKey: boolean;
	hasNotificationEmail: boolean;
}

export async function getConfigurationStatus(): Promise<ConfigurationStatus> {
	const settings = await db.settings.findUnique({
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
}

export interface ScheduleSettings {
	dailyScanHour: number;
	dailyScanMinute: number;
	weeklyScanDay: number;
	weeklyScanHour: number;
	weeklyScanMinute: number;
	monthlyScanDay: number;
	monthlyScanHour: number;
	monthlyScanMinute: number;
}

export async function getScheduleSettings(): Promise<ScheduleSettings> {
	const settings = await getSettings();

	return {
		dailyScanHour: settings.dailyScanHour,
		dailyScanMinute: settings.dailyScanMinute,
		weeklyScanDay: settings.weeklyScanDay,
		weeklyScanHour: settings.weeklyScanHour,
		weeklyScanMinute: settings.weeklyScanMinute,
		monthlyScanDay: settings.monthlyScanDay,
		monthlyScanHour: settings.monthlyScanHour,
		monthlyScanMinute: settings.monthlyScanMinute,
	};
}

export async function getRpmLimit(): Promise<number> {
	const settings = await getSettings();
	return settings.hibpRpm ?? 10; // Default to 10 RPM if not set
}
