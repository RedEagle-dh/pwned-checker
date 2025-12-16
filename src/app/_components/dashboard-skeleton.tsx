import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
} from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";

function StatCardSkeleton() {
	return (
		<Card>
			<CardHeader className="pb-2">
				<CardDescription>
					<Skeleton className="h-4 w-24" />
				</CardDescription>
				<Skeleton className="h-9 w-16" />
			</CardHeader>
		</Card>
	);
}

export function DashboardSkeleton() {
	return (
		<div className="container mx-auto py-8 px-4">
			<div className="flex items-center justify-between mb-8">
				<div>
					<Skeleton className="h-9 w-48 mb-2" />
					<Skeleton className="h-5 w-72" />
				</div>
				<Skeleton className="h-10 w-24" />
			</div>

			<div className="grid gap-4 md:grid-cols-3 mb-8">
				<StatCardSkeleton />
				<StatCardSkeleton />
				<StatCardSkeleton />
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<Card>
					<CardHeader>
						<Skeleton className="h-6 w-36 mb-2" />
						<Skeleton className="h-4 w-64" />
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{[1, 2, 3].map((i) => (
								<Skeleton key={i} className="h-20 w-full" />
							))}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<Skeleton className="h-6 w-32 mb-2" />
						<Skeleton className="h-4 w-48" />
					</CardHeader>
					<CardContent className="space-y-3">
						<Skeleton className="h-16 w-full" />
						<Skeleton className="h-16 w-full" />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
