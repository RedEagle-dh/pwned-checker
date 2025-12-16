import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";

export function BreachesSkeleton() {
	return (
		<div className="container mx-auto py-8 px-4">
			<div className="mb-6">
				<Skeleton className="h-9 w-48 mb-2" />
				<Skeleton className="h-5 w-80" />
			</div>

			<div className="flex gap-6">
				{/* Sidebar Skeleton */}
				<div className="w-72 shrink-0 border-r pr-4">
					<Skeleton className="h-4 w-32 mb-3" />
					<div className="space-y-1">
						{[1, 2, 3, 4].map((i) => (
							<div
								key={i}
								className="flex items-center gap-3 px-3 py-2 rounded-lg"
							>
								<Skeleton className="size-4 rounded" />
								<Skeleton className="h-4 flex-1" />
								<Skeleton className="h-5 w-6 rounded-full" />
							</div>
						))}
					</div>
				</div>

				{/* Main Content Skeleton */}
				<div className="flex-1 min-w-0">
					<div className="flex items-center justify-between mb-4">
						<Skeleton className="h-6 w-48" />
						<div className="flex gap-2">
							{[1, 2, 3, 4].map((i) => (
								<Skeleton key={i} className="h-8 w-24 rounded-md" />
							))}
						</div>
					</div>

					<div className="space-y-4">
						{[1, 2, 3].map((i) => (
							<Card key={i}>
								<CardHeader>
									<div className="flex items-start justify-between">
										<div>
											<Skeleton className="h-6 w-48 mb-2" />
											<Skeleton className="h-4 w-32" />
										</div>
										<div className="text-right">
											<Skeleton className="h-4 w-32 mb-1" />
											<Skeleton className="h-3 w-24" />
										</div>
									</div>
								</CardHeader>
								<CardContent className="space-y-4">
									<Skeleton className="h-16 w-full" />
									<div>
										<Skeleton className="h-4 w-24 mb-2" />
										<div className="flex flex-wrap gap-1">
											{[1, 2, 3, 4].map((j) => (
												<Skeleton key={j} className="h-5 w-20 rounded-full" />
											))}
										</div>
									</div>
									<Skeleton className="h-4 w-48" />
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
