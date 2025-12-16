"use client";

import { IconMail, IconShieldCheck } from "@tabler/icons-react";
import { useState } from "react";
import { toast } from "sonner";
import { PaginationControls } from "~/components/pagination-controls";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import type { BreachStatus } from "~/generated/prisma";
import { RISK_CONFIG, type RiskLevel } from "~/lib/risk-scoring";
import { cn } from "~/lib/utils";
import { api, type RouterOutputs } from "~/trpc/react";
import { SafetyTipsDialog } from "./safety-tips-dialog";

type Breach = RouterOutputs["breach"]["list"]["breaches"][0];

function formatDate(date: Date | string | null): string {
	if (!date) return "Unknown";
	const d = new Date(date);
	return d.toLocaleDateString("en-US", {
		month: "long",
		day: "numeric",
		year: "numeric",
	});
}

function formatNumber(num: number | null): string {
	if (!num) return "Unknown";
	return num.toLocaleString();
}

function stripHtml(html: string): string {
	return html.replace(/<[^>]*>/g, "");
}

function RiskBadge({ riskLevel }: { riskLevel: RiskLevel }) {
	const config = RISK_CONFIG[riskLevel];
	return <Badge variant={config.variant}>{config.label} Risk</Badge>;
}

function StatusBadge({ status }: { status: BreachStatus }) {
	switch (status) {
		case "ACTIVE":
			return <Badge variant="destructive">Active</Badge>;
		case "ACKNOWLEDGED":
			return <Badge variant="warning">Acknowledged</Badge>;
		case "RESOLVED":
			return <Badge variant="success">Resolved</Badge>;
		default:
			return null;
	}
}

const STATUS_TABS: { value: BreachStatus | "all"; label: string }[] = [
	{ value: "all", label: "All" },
	{ value: "ACTIVE", label: "Active" },
	{ value: "ACKNOWLEDGED", label: "Acknowledged" },
	{ value: "RESOLVED", label: "Resolved" },
];

function BreachCard({ breach }: { breach: Breach }) {
	const utils = api.useUtils();

	const updateStatus = api.breach.updateStatus.useMutation({
		onSuccess: (_, variables) => {
			void utils.breach.list.invalidate();
			const statusMessages: Record<BreachStatus, string> = {
				ACTIVE: "Breach reopened",
				ACKNOWLEDGED: "Breach marked as acknowledged",
				RESOLVED: "Breach marked as resolved",
			};
			toast.success(statusMessages[variables.status]);
		},
		onError: () => {
			toast.error("Failed to update breach status");
		},
	});

	const handleStatusChange = (newStatus: BreachStatus) => {
		updateStatus.mutate({ breachId: breach.id, status: newStatus });
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex items-start justify-between">
					<div>
						<CardTitle className="flex items-center gap-2 flex-wrap">
							{breach.title ?? breach.name}
							<RiskBadge riskLevel={breach.riskLevel} />
							<StatusBadge status={breach.status} />
							{breach.isVerified && (
								<Badge variant="outline" className="text-xs">
									Verified
								</Badge>
							)}
						</CardTitle>
						<CardDescription className="mt-1">
							{breach.domain && breach.domain}
						</CardDescription>
					</div>
					<div className="text-right text-sm text-muted-foreground">
						<p>Breach: {formatDate(breach.breachDate)}</p>
						<p className="text-xs">Found: {formatDate(breach.discoveredAt)}</p>
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{breach.description && (
					<p className="text-sm text-muted-foreground">
						{stripHtml(breach.description)}
					</p>
				)}
				<div>
					<p className="text-sm font-medium mb-2">Exposed Data</p>
					<div className="flex flex-wrap gap-1">
						{breach.dataClasses.map((dc) => (
							<Badge key={dc} variant="secondary">
								{dc}
							</Badge>
						))}
					</div>
				</div>
				{breach.pwnCount && (
					<p className="text-sm text-muted-foreground">
						{formatNumber(breach.pwnCount)} accounts affected
					</p>
				)}
			</CardContent>
			<CardFooter className="border-t pt-4 gap-2">
				<SafetyTipsDialog
					breachName={breach.title ?? breach.name}
					dataClasses={breach.dataClasses}
				/>
				<div className="flex-1" />
				{breach.status === "ACTIVE" && (
					<Button
						variant="outline"
						size="sm"
						onClick={() => handleStatusChange("ACKNOWLEDGED")}
						disabled={updateStatus.isPending}
					>
						Mark Acknowledged
					</Button>
				)}
				{(breach.status === "ACTIVE" || breach.status === "ACKNOWLEDGED") && (
					<Button
						variant="default"
						size="sm"
						onClick={() => handleStatusChange("RESOLVED")}
						disabled={updateStatus.isPending}
					>
						Mark Resolved
					</Button>
				)}
				{breach.status === "RESOLVED" && (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => handleStatusChange("ACTIVE")}
						disabled={updateStatus.isPending}
					>
						Reopen
					</Button>
				)}
			</CardFooter>
		</Card>
	);
}

interface EmailWithBreachCount {
	id: string;
	address: string;
	breachCount: number;
}

function EmailSidebar({
	emails,
	selectedEmail,
	onSelectEmail,
}: {
	emails: EmailWithBreachCount[];
	selectedEmail: string;
	onSelectEmail: (emailId: string) => void;
}) {
	return (
		<div className="w-72 shrink-0 border-r pr-4">
			<h2 className="text-sm font-medium text-muted-foreground mb-3">
				Monitored Emails
			</h2>
			<div className="space-y-1">
				<button
					type="button"
					onClick={() => onSelectEmail("all")}
					className={cn(
						"w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-colors",
						selectedEmail === "all"
							? "bg-primary text-primary-foreground"
							: "hover:bg-muted",
					)}
				>
					<IconShieldCheck className="size-4 shrink-0" />
					<span className="flex-1 truncate">All Emails</span>
					<Badge
						variant={selectedEmail === "all" ? "secondary" : "destructive"}
						className="ml-auto"
					>
						{emails.reduce((sum, e) => sum + e.breachCount, 0)}
					</Badge>
				</button>
				{emails.map((email) => (
					<button
						key={email.id}
						type="button"
						onClick={() => onSelectEmail(email.id)}
						className={cn(
							"w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-colors",
							selectedEmail === email.id
								? "bg-primary text-primary-foreground"
								: "hover:bg-muted",
						)}
					>
						<IconMail className="size-4 shrink-0" />
						<span className="flex-1 truncate">{email.address}</span>
						{email.breachCount > 0 && (
							<Badge
								variant={
									selectedEmail === email.id ? "secondary" : "destructive"
								}
								className="ml-auto"
							>
								{email.breachCount}
							</Badge>
						)}
					</button>
				))}
			</div>
		</div>
	);
}

export function BreachesClient() {
	const [selectedEmail, setSelectedEmail] = useState<string>("all");
	const [selectedStatus, setSelectedStatus] = useState<BreachStatus | "all">(
		"all",
	);
	const [page, setPage] = useState(1);

	const [emailData] = api.email.list.useSuspenseQuery();
	const [breachData] = api.breach.list.useSuspenseQuery({
		emailId: selectedEmail === "all" ? undefined : selectedEmail,
		status: selectedStatus === "all" ? undefined : selectedStatus,
		page,
		limit: 10,
	});

	// Reset page when filters change
	const handleEmailSelect = (emailId: string) => {
		setSelectedEmail(emailId);
		setPage(1);
	};

	const handleStatusSelect = (status: BreachStatus | "all") => {
		setSelectedStatus(status);
		setPage(1);
	};

	const emailsWithBreachCount: EmailWithBreachCount[] = emailData.emails.map(
		(email) => ({
			id: email.id,
			address: email.address,
			breachCount: email.breachCount,
		}),
	);

	const selectedEmailAddress =
		selectedEmail === "all"
			? "All Emails"
			: emailData.emails.find((e) => e.id === selectedEmail)?.address;

	return (
		<div className="container mx-auto py-8 px-4">
			<div className="mb-6">
				<h1 className="text-3xl font-bold">Breach History</h1>
				<p className="text-muted-foreground mt-1">
					View all detected breaches for your monitored emails
				</p>
			</div>

			<div className="flex gap-6">
				{/* Sidebar */}
				<EmailSidebar
					emails={emailsWithBreachCount}
					selectedEmail={selectedEmail}
					onSelectEmail={handleEmailSelect}
				/>

				{/* Main Content */}
				<div className="flex-1 min-w-0">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-lg font-medium">{selectedEmailAddress}</h2>
						{/* Status Filter Tabs */}
						<div className="flex gap-2">
							{STATUS_TABS.map((tab) => (
								<Button
									key={tab.value}
									variant={selectedStatus === tab.value ? "default" : "outline"}
									size="sm"
									onClick={() => handleStatusSelect(tab.value)}
								>
									{tab.label}
								</Button>
							))}
						</div>
					</div>

					{breachData.breaches.length === 0 ? (
						<Card>
							<CardContent className="py-12 text-center">
								<IconShieldCheck className="mx-auto size-12 text-muted-foreground mb-4" />
								<h3 className="text-lg font-medium mb-2">No breaches found</h3>
								<p className="text-muted-foreground">
									{selectedStatus !== "all"
										? `No ${selectedStatus.toLowerCase()} breaches found.`
										: selectedEmail === "all"
											? "Great news! None of your monitored emails have been found in any known data breaches."
											: "This email hasn't been found in any known data breaches."}
								</p>
							</CardContent>
						</Card>
					) : (
						<>
							<div className="space-y-4">
								{breachData.breaches.map((breach) => (
									<BreachCard key={breach.id} breach={breach} />
								))}
							</div>
							<PaginationControls
								currentPage={breachData.currentPage}
								totalPages={breachData.totalPages}
								onPageChange={setPage}
							/>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
