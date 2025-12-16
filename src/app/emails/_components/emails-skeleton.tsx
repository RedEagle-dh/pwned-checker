import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";

export function EmailsSkeleton() {
	return (
		<div className="container mx-auto py-8 px-4">
			<div className="mb-8">
				<Skeleton className="h-9 w-56 mb-2" />
				<Skeleton className="h-5 w-80" />
			</div>

			<Card className="mb-8">
				<CardHeader>
					<CardTitle>Add Email</CardTitle>
					<CardDescription>
						Add a new email address to monitor for data breaches
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col sm:flex-row gap-3">
						<Skeleton className="h-10 flex-1" />
						<Skeleton className="h-10 w-full sm:w-32" />
						<Skeleton className="h-10 w-full sm:w-28" />
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Monitored Emails</CardTitle>
					<CardDescription>
						<Skeleton className="h-4 w-40" />
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Email Address</TableHead>
								<TableHead>Frequency</TableHead>
								<TableHead>Breaches</TableHead>
								<TableHead>Last Scanned</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{[1, 2, 3].map((i) => (
								<TableRow key={i}>
									<TableCell>
										<Skeleton className="h-5 w-48" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-6 w-20" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-6 w-8" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-5 w-24" />
									</TableCell>
									<TableCell className="text-right">
										<div className="flex items-center justify-end gap-2">
											<Skeleton className="h-8 w-14" />
											<Skeleton className="h-8 w-16" />
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}
