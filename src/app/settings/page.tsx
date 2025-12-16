import { Suspense } from "react";
import { api, HydrateClient } from "~/trpc/server";
import { SettingsClient } from "./_components/settings-client";
import { SettingsSkeleton } from "./_components/settings-skeleton";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
	void api.settings.get.prefetch();

	return (
		<HydrateClient>
			<Suspense fallback={<SettingsSkeleton />}>
				<SettingsClient />
			</Suspense>
		</HydrateClient>
	);
}
