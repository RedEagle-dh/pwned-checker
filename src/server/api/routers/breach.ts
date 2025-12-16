import { z } from "zod";
import type { BreachStatus } from "~/generated/prisma";
import { calculateRiskLevel } from "~/lib/risk-scoring";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const breachStatusSchema = z.enum(["ACTIVE", "ACKNOWLEDGED", "RESOLVED"]);

export const breachRouter = createTRPCRouter({
	list: publicProcedure
		.input(
			z.object({
				emailId: z.string().optional(),
				status: breachStatusSchema.optional(),
				page: z.number().min(1).default(1),
				limit: z.number().min(1).max(100).default(10),
			}),
		)
		.query(async ({ ctx, input }) => {
			const page = input.page;
			const limit = input.limit;
			const skip = (page - 1) * limit;

			const whereClause: {
				emailId?: string;
				status?: BreachStatus;
			} = {};
			if (input.emailId) whereClause.emailId = input.emailId;
			if (input.status) whereClause.status = input.status;

			const [breaches, totalCount] = await Promise.all([
				ctx.db.breach.findMany({
					where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
					include: {
						email: {
							select: { address: true },
						},
					},
					orderBy: { discoveredAt: "desc" },
					skip,
					take: limit,
				}),
				ctx.db.breach.count({
					where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
				}),
			]);

			const breachesWithRisk = breaches.map((breach) => ({
				...breach,
				riskLevel: calculateRiskLevel(breach.dataClasses),
			}));

			return {
				breaches: breachesWithRisk,
				totalCount,
				totalPages: Math.ceil(totalCount / limit),
				currentPage: page,
			};
		}),

	getByEmail: publicProcedure
		.input(z.object({ emailId: z.string() }))
		.query(async ({ ctx, input }) => {
			const breaches = await ctx.db.breach.findMany({
				where: { emailId: input.emailId },
				orderBy: { discoveredAt: "desc" },
			});
			return breaches.map((breach) => ({
				...breach,
				riskLevel: calculateRiskLevel(breach.dataClasses),
			}));
		}),

	stats: publicProcedure.query(async ({ ctx }) => {
		const [
			totalEmails,
			totalBreaches,
			recentBreaches,
			allBreaches,
			lastScan,
			statusCounts,
		] = await Promise.all([
			ctx.db.email.count(),
			ctx.db.breach.count(),
			ctx.db.breach.findMany({
				take: 5,
				orderBy: { discoveredAt: "desc" },
				include: {
					email: {
						select: { address: true },
					},
				},
			}),
			ctx.db.breach.findMany({
				select: { dataClasses: true },
			}),
			ctx.db.scanLog.findFirst({
				where: { status: "COMPLETED" },
				orderBy: { completedAt: "desc" },
			}),
			ctx.db.breach.groupBy({
				by: ["status"],
				_count: { status: true },
			}),
		]);

		// Calculate risk distribution
		const riskDistribution = {
			critical: 0,
			high: 0,
			medium: 0,
			low: 0,
		};

		for (const breach of allBreaches) {
			const riskLevel = calculateRiskLevel(breach.dataClasses);
			riskDistribution[riskLevel]++;
		}

		// Add risk level to recent breaches
		const recentBreachesWithRisk = recentBreaches.map((breach) => ({
			...breach,
			riskLevel: calculateRiskLevel(breach.dataClasses),
		}));

		// Format status counts
		const statusDistribution = {
			active: 0,
			acknowledged: 0,
			resolved: 0,
		};
		for (const item of statusCounts) {
			statusDistribution[
				item.status.toLowerCase() as keyof typeof statusDistribution
			] = item._count.status;
		}

		return {
			totalEmails,
			totalBreaches,
			recentBreaches: recentBreachesWithRisk,
			riskDistribution,
			statusDistribution,
			lastScan,
		};
	}),

	// Update breach status
	updateStatus: publicProcedure
		.input(
			z.object({
				breachId: z.string(),
				status: breachStatusSchema,
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return ctx.db.breach.update({
				where: { id: input.breachId },
				data: { status: input.status },
			});
		}),
});
