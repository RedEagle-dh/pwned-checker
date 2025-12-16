import cron, { type ScheduledTask } from "node-cron";
import { runScan } from "~/server/services/scanner";
import { getScheduleSettings } from "~/server/services/settings";

let dailyTask: ScheduledTask | null = null;
let weeklyTask: ScheduledTask | null = null;
let monthlyTask: ScheduledTask | null = null;
let isInitialized = false;

function buildCronExpression(
	minute: number,
	hour: number,
	dayOfMonth?: number,
	dayOfWeek?: number,
): string {
	// Cron format: minute hour day-of-month month day-of-week
	const dom = dayOfMonth ?? "*";
	const dow = dayOfWeek ?? "*";
	return `${minute} ${hour} ${dom} * ${dow}`;
}

function formatTime(hour: number, minute: number): string {
	return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

const DAY_NAMES = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
];

export async function initCronJobs() {
	if (isInitialized) {
		console.log("[Cron] Refreshing scheduled jobs...");
		// Stop existing tasks before recreating
		dailyTask?.stop();
		weeklyTask?.stop();
		monthlyTask?.stop();
	} else {
		console.log("[Cron] Initializing scheduled jobs...");
	}

	const schedule = await getScheduleSettings();

	// Daily scan
	const dailyCron = buildCronExpression(
		schedule.dailyScanMinute,
		schedule.dailyScanHour,
	);
	dailyTask = cron.schedule(dailyCron, async () => {
		console.log("[Cron] Running daily scan...");
		try {
			const result = await runScan("DAILY");
			console.log(
				`[Cron] Daily scan complete: ${result.emailsScanned} emails scanned, ${result.newBreaches} new breaches`,
			);
		} catch (error) {
			console.error("[Cron] Daily scan failed:", error);
		}
	});

	// Weekly scan
	const weeklyCron = buildCronExpression(
		schedule.weeklyScanMinute,
		schedule.weeklyScanHour,
		undefined,
		schedule.weeklyScanDay,
	);
	weeklyTask = cron.schedule(weeklyCron, async () => {
		console.log("[Cron] Running weekly scan...");
		try {
			const result = await runScan("WEEKLY");
			console.log(
				`[Cron] Weekly scan complete: ${result.emailsScanned} emails scanned, ${result.newBreaches} new breaches`,
			);
		} catch (error) {
			console.error("[Cron] Weekly scan failed:", error);
		}
	});

	// Monthly scan
	const monthlyCron = buildCronExpression(
		schedule.monthlyScanMinute,
		schedule.monthlyScanHour,
		schedule.monthlyScanDay,
	);
	monthlyTask = cron.schedule(monthlyCron, async () => {
		console.log("[Cron] Running monthly scan...");
		try {
			const result = await runScan("MONTHLY");
			console.log(
				`[Cron] Monthly scan complete: ${result.emailsScanned} emails scanned, ${result.newBreaches} new breaches`,
			);
		} catch (error) {
			console.error("[Cron] Monthly scan failed:", error);
		}
	});

	isInitialized = true;
	console.log("[Cron] Scheduled jobs initialized:");
	console.log(
		`  - Daily scan: ${formatTime(schedule.dailyScanHour, schedule.dailyScanMinute)} every day (${dailyCron})`,
	);
	console.log(
		`  - Weekly scan: ${formatTime(schedule.weeklyScanHour, schedule.weeklyScanMinute)} every ${DAY_NAMES[schedule.weeklyScanDay]} (${weeklyCron})`,
	);
	console.log(
		`  - Monthly scan: ${formatTime(schedule.monthlyScanHour, schedule.monthlyScanMinute)} on day ${schedule.monthlyScanDay} (${monthlyCron})`,
	);
}

// Export function to refresh schedules when settings change
export async function refreshCronJobs() {
	await initCronJobs();
}
