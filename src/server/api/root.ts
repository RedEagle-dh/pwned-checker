import { breachRouter } from "~/server/api/routers/breach";
import { emailRouter } from "~/server/api/routers/email";
import { notificationRouter } from "~/server/api/routers/notification";
import { scanRouter } from "~/server/api/routers/scan";
import { settingsRouter } from "~/server/api/routers/settings";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

export const appRouter = createTRPCRouter({
	email: emailRouter,
	breach: breachRouter,
	notification: notificationRouter,
	scan: scanRouter,
	settings: settingsRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
