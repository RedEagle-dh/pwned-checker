import { Suspense } from "react";
import { api, HydrateClient } from "~/trpc/server";
import { BreachesClient } from "./_components/breaches-client";
import { BreachesSkeleton } from "./_components/breaches-skeleton";

export const dynamic = "force-dynamic";

export default async function BreachesPage() {
	void api.email.list.prefetch();
	void api.breach.list.prefetch({ limit: 50 });

	return (
		<HydrateClient>
			<Suspense fallback={<BreachesSkeleton />}>
				<BreachesClient />
			</Suspense>
		</HydrateClient>
	);
}
