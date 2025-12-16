import { Suspense } from "react";
import { api, HydrateClient } from "~/trpc/server";
import { DashboardClient } from "./_components/dashboard-client";
import { DashboardSkeleton } from "./_components/dashboard-skeleton";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
	void api.breach.stats.prefetch();
	void api.scan.status.prefetch();

	return (
		<HydrateClient>
			<Suspense fallback={<DashboardSkeleton />}>
				<DashboardClient />
			</Suspense>
		</HydrateClient>
	);
}
