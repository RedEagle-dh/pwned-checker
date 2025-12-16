import { z } from "zod";
import { ScanFrequency } from "~/generated/prisma";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { runScan, scanSingleEmail } from "~/server/services/scanner";

export const scanRouter = createTRPCRouter({
	trigger: publicProcedure
		.input(
			z.object({
				frequency: z.nativeEnum(ScanFrequency).optional(),
			}),
		)
		.mutation(async ({ input }) => {
			const result = await runScan(input.frequency);
			return result;
		}),

	scanEmail: publicProcedure
		.input(z.object({ emailId: z.string() }))
		.mutation(async ({ input }) => {
			const result = await scanSingleEmail(input.emailId);
			return result;
		}),

	status: publicProcedure.query(async ({ ctx }) => {
		const [runningScans, lastCompletedScan] = await Promise.all([
			ctx.db.scanLog.findMany({
				where: { status: "RUNNING" },
				orderBy: { startedAt: "desc" },
			}),
			ctx.db.scanLog.findFirst({
				where: { status: "COMPLETED" },
				orderBy: { completedAt: "desc" },
			}),
		]);

		return {
			isRunning: runningScans.length > 0,
			currentScan: runningScans[0] ?? null,
			lastCompletedScan,
		};
	}),

	logs: publicProcedure
		.input(
			z.object({
				limit: z.number().min(1).max(50).default(10),
			}),
		)
		.query(async ({ ctx, input }) => {
			return ctx.db.scanLog.findMany({
				orderBy: { startedAt: "desc" },
				take: input.limit,
			});
		}),
});
