import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";

export function SettingsSkeleton() {
	return (
		<div className="container mx-auto py-8 px-4">
			<div className="mb-8">
				<Skeleton className="h-9 w-32 mb-2" />
				<Skeleton className="h-5 w-64" />
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				{/* API Keys Card */}
				<Card>
					<CardHeader>
						<Skeleton className="h-6 w-32 mb-2" />
						<Skeleton className="h-4 w-64" />
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-10 w-full" />
						</div>
						<div className="space-y-2">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-10 w-full" />
						</div>
						<div className="space-y-2">
							<Skeleton className="h-4 w-32" />
							<Skeleton className="h-10 w-full" />
						</div>
						<Skeleton className="h-10 w-24" />
					</CardContent>
				</Card>

				{/* Subscription Status Card */}
				<Card>
					<CardHeader>
						<Skeleton className="h-6 w-48 mb-2" />
						<Skeleton className="h-4 w-64" />
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							{[1, 2, 3, 4].map((i) => (
								<div key={i} className="space-y-1">
									<Skeleton className="h-3 w-20" />
									<Skeleton className="h-5 w-24" />
								</div>
							))}
						</div>
						<Skeleton className="h-10 w-40" />
					</CardContent>
				</Card>

				{/* Schedule Card */}
				<Card className="lg:col-span-2">
					<CardHeader>
						<Skeleton className="h-6 w-32 mb-2" />
						<Skeleton className="h-4 w-80" />
					</CardHeader>
					<CardContent>
						<div className="grid gap-6 md:grid-cols-3">
							{[1, 2, 3].map((i) => (
								<div key={i} className="space-y-4">
									<Skeleton className="h-5 w-24" />
									<div className="space-y-2">
										<Skeleton className="h-4 w-16" />
										<Skeleton className="h-10 w-full" />
									</div>
									<div className="space-y-2">
										<Skeleton className="h-4 w-16" />
										<Skeleton className="h-10 w-full" />
									</div>
								</div>
							))}
						</div>
						<Skeleton className="h-10 w-32 mt-6" />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
