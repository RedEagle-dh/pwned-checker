"use client";

import { IconChevronRight } from "@tabler/icons-react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { RISK_CONFIG, type RiskLevel } from "~/lib/risk-scoring";
import { api } from "~/trpc/react";

function RiskBadge({ riskLevel }: { riskLevel: RiskLevel }) {
	const config = RISK_CONFIG[riskLevel];
	return <Badge variant={config.variant}>{config.label}</Badge>;
}

function formatDate(date: Date | string | null): string {
	if (!date) return "Never";
	const d = new Date(date);
	return d.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function StatCard({
	title,
	value,
	description,
}: {
	title: string;
	value: string | number;
	description?: string;
}) {
	return (
		<Card>
			<CardHeader className="pb-2">
				<CardDescription>{title}</CardDescription>
				<CardTitle className="text-3xl">{value}</CardTitle>
			</CardHeader>
			{description && (
				<CardContent>
					<p className="text-xs text-muted-foreground">{description}</p>
				</CardContent>
			)}
		</Card>
	);
}

export function DashboardClient() {
	const [stats] = api.breach.stats.useSuspenseQuery();
	const [scanStatus] = api.scan.status.useSuspenseQuery();
	const utils = api.useUtils();
	const triggerScan = api.scan.trigger.useMutation({
		onSuccess: () => {
			void utils.breach.stats.invalidate();
			void utils.scan.status.invalidate();
			toast.success("Scan started for all emails");
		},
		onError: () => {
			toast.error("Failed to start scan");
		},
	});

	return (
		<div className="container mx-auto py-8 px-4">
			<div className="flex items-center justify-between mb-8">
				<div>
					<h1 className="text-3xl font-bold">Dashboard</h1>
					<p className="text-muted-foreground mt-1">
						Monitor your email addresses for data breaches
					</p>
				</div>
				<Button
					onClick={() => triggerScan.mutate({})}
					disabled={triggerScan.isPending || scanStatus.isRunning}
				>
					{triggerScan.isPending || scanStatus.isRunning
						? "Scanning..."
						: "Scan Now"}
				</Button>
			</div>

			<div className="grid gap-4 md:grid-cols-4 mb-8">
				<StatCard title="Monitored Emails" value={stats.totalEmails} />
				<StatCard title="Total Breaches" value={stats.totalBreaches} />
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Risk Breakdown</CardDescription>
					</CardHeader>
					<CardContent className="space-y-1">
						<div className="flex items-center justify-between text-sm">
							<Badge variant="destructive">Critical</Badge>
							<span className="font-medium">
								{stats.riskDistribution.critical}
							</span>
						</div>
						<div className="flex items-center justify-between text-sm">
							<Badge variant="warning">High</Badge>
							<span className="font-medium">{stats.riskDistribution.high}</span>
						</div>
						<div className="flex items-center justify-between text-sm">
							<Badge variant="secondary">Medium</Badge>
							<span className="font-medium">
								{stats.riskDistribution.medium}
							</span>
						</div>
						<div className="flex items-center justify-between text-sm">
							<Badge variant="outline">Low</Badge>
							<span className="font-medium">{stats.riskDistribution.low}</span>
						</div>
					</CardContent>
				</Card>
				<StatCard
					title="Last Scan"
					value={
						stats.lastScan ? formatDate(stats.lastScan.completedAt) : "Never"
					}
					description={
						stats.lastScan
							? `${stats.lastScan.emailsScanned} emails scanned, ${stats.lastScan.newBreaches} new breaches`
							: undefined
					}
				/>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Recent Breaches</CardTitle>
						<CardDescription>
							Latest breaches discovered for your monitored emails
						</CardDescription>
					</CardHeader>
					<CardContent>
						{stats.recentBreaches.length === 0 ? (
							<p className="text-muted-foreground text-sm py-4 text-center">
								No breaches detected yet
							</p>
						) : (
							<div className="space-y-3">
								{stats.recentBreaches.map((breach) => (
									<div
										key={breach.id}
										className="flex items-start justify-between p-3 rounded-lg border bg-card"
									>
										<div className="space-y-1">
											<div className="flex items-center gap-2">
												<span className="font-medium">
													{breach.title ?? breach.name}
												</span>
												<RiskBadge riskLevel={breach.riskLevel} />
												{breach.isVerified && (
													<Badge variant="outline" className="text-xs">
														Verified
													</Badge>
												)}
											</div>
											<p className="text-sm text-muted-foreground">
												{breach.email.address}
											</p>
											<div className="flex flex-wrap gap-1 mt-1">
												{breach.dataClasses.slice(0, 3).map((dc) => (
													<Badge
														key={dc}
														variant="secondary"
														className="text-xs"
													>
														{dc}
													</Badge>
												))}
												{breach.dataClasses.length > 3 && (
													<Badge variant="secondary" className="text-xs">
														+{breach.dataClasses.length - 3} more
													</Badge>
												)}
											</div>
										</div>
										<span className="text-xs text-muted-foreground">
											{formatDate(breach.discoveredAt)}
										</span>
									</div>
								))}
							</div>
						)}
						{stats.recentBreaches.length > 0 && (
							<div className="mt-4 text-center">
								<Link href="/breaches">
									<Button variant="outline" size="sm">
										View All Breaches
									</Button>
								</Link>
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Quick Actions</CardTitle>
						<CardDescription>Manage your email monitoring</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<Link href="/emails" className="block">
							<div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
								<div>
									<p className="font-medium">Manage Emails</p>
									<p className="text-sm text-muted-foreground">
										Add or remove email addresses to monitor
									</p>
								</div>
								<IconChevronRight className="size-5 text-muted-foreground" />
							</div>
						</Link>
						<Link href="/breaches" className="block">
							<div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
								<div>
									<p className="font-medium">View All Breaches</p>
									<p className="text-sm text-muted-foreground">
										See detailed breach history for all emails
									</p>
								</div>
								<IconChevronRight className="size-5 text-muted-foreground" />
							</div>
						</Link>
						{scanStatus.lastCompletedScan && (
							<div className="p-3 rounded-lg border bg-muted/30">
								<p className="text-sm font-medium">Last Scan Summary</p>
								<p className="text-xs text-muted-foreground mt-1">
									Scanned {scanStatus.lastCompletedScan.emailsScanned} emails,
									found {scanStatus.lastCompletedScan.newBreaches} new breaches
								</p>
								{scanStatus.lastCompletedScan.errors && (
									<p className="text-xs text-destructive mt-1">
										Some errors occurred during scan
									</p>
								)}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
