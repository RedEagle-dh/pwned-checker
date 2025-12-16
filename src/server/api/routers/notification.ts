import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const notificationRouter = createTRPCRouter({
	list: publicProcedure
		.input(
			z.object({
				unreadOnly: z.boolean().default(false),
				limit: z.number().min(1).max(100).default(20),
			}),
		)
		.query(async ({ ctx, input }) => {
			return ctx.db.notification.findMany({
				where: input.unreadOnly ? { isRead: false } : undefined,
				include: {
					email: {
						select: { address: true },
					},
				},
				orderBy: { sentAt: "desc" },
				take: input.limit,
			});
		}),

	unreadCount: publicProcedure.query(async ({ ctx }) => {
		return ctx.db.notification.count({
			where: { isRead: false },
		});
	}),

	markRead: publicProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			return ctx.db.notification.update({
				where: { id: input.id },
				data: { isRead: true },
			});
		}),

	markAllRead: publicProcedure.mutation(async ({ ctx }) => {
		return ctx.db.notification.updateMany({
			where: { isRead: false },
			data: { isRead: true },
		});
	}),
});
