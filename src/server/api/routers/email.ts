import { z } from "zod";
import { ScanFrequency } from "~/generated/prisma";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const emailRouter = createTRPCRouter({
	list: publicProcedure
		.input(
			z
				.object({
					page: z.number().min(1).default(1),
					limit: z.number().min(1).max(100).default(10),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const page = input?.page ?? 1;
			const limit = input?.limit ?? 10;
			const skip = (page - 1) * limit;

			const [emails, totalCount] = await Promise.all([
				ctx.db.email.findMany({
					include: {
						_count: {
							select: { breaches: true },
						},
					},
					orderBy: { createdAt: "desc" },
					skip,
					take: limit,
				}),
				ctx.db.email.count(),
			]);

			return {
				emails: emails.map((email) => ({
					...email,
					breachCount: email._count.breaches,
				})),
				totalCount,
				totalPages: Math.ceil(totalCount / limit),
				currentPage: page,
			};
		}),

	getById: publicProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			return ctx.db.email.findUnique({
				where: { id: input.id },
				include: {
					breaches: {
						orderBy: { discoveredAt: "desc" },
					},
				},
			});
		}),

	create: publicProcedure
		.input(
			z.object({
				address: z.string().email(),
				scanFrequency: z.nativeEnum(ScanFrequency).default("DAILY"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return ctx.db.email.create({
				data: {
					address: input.address.toLowerCase(),
					scanFrequency: input.scanFrequency,
				},
			});
		}),

	update: publicProcedure
		.input(
			z.object({
				id: z.string(),
				scanFrequency: z.nativeEnum(ScanFrequency),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return ctx.db.email.update({
				where: { id: input.id },
				data: { scanFrequency: input.scanFrequency },
			});
		}),

	delete: publicProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			return ctx.db.email.delete({
				where: { id: input.id },
			});
		}),
});
