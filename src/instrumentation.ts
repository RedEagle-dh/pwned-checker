export async function register() {
	// Only run on the server
	if (process.env.NEXT_RUNTIME === "nodejs") {
		const { initCronJobs } = await import("~/cron/scheduler");
		initCronJobs();
	}
}
