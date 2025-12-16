import { Suspense } from "react";
import { api, HydrateClient } from "~/trpc/server";
import { EmailsClient } from "./_components/emails-client";
import { EmailsSkeleton } from "./_components/emails-skeleton";

export const dynamic = "force-dynamic";

export default async function EmailsPage() {
	void api.email.list.prefetch();

	return (
		<HydrateClient>
			<Suspense fallback={<EmailsSkeleton />}>
				<EmailsClient />
			</Suspense>
		</HydrateClient>
	);
}
