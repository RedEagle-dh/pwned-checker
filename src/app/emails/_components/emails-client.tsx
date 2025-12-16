"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PaginationControls } from "~/components/pagination-controls";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import type { ScanFrequency } from "~/generated/prisma";
import { api } from "~/trpc/react";

function formatDate(date: Date | string | null): string {
	if (!date) return "Never";
	const d = new Date(date);
	return d.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

function FrequencyBadge({ frequency }: { frequency: ScanFrequency }) {
	const colors: Record<ScanFrequency, "default" | "secondary" | "outline"> = {
		DAILY: "default",
		WEEKLY: "secondary",
		MONTHLY: "outline",
	};
	return <Badge variant={colors[frequency]}>{frequency.toLowerCase()}</Badge>;
}

export function EmailsClient() {
	const [newEmail, setNewEmail] = useState("");
	const [newFrequency, setNewFrequency] = useState<ScanFrequency>("DAILY");
	const [page, setPage] = useState(1);
	const utils = api.useUtils();

	const [emailData] = api.email.list.useSuspenseQuery({ page, limit: 10 });

	const createEmail = api.email.create.useMutation({
		onSuccess: () => {
			setNewEmail("");
			void utils.email.list.invalidate();
			toast.success("Email added to monitoring");
		},
		onError: (error) => {
			if (error.message.includes("Unique constraint")) {
				toast.error("Email already being monitored");
			} else {
				toast.error("Failed to add email");
			}
		},
	});

	const updateEmail = api.email.update.useMutation({
		onSuccess: () => {
			void utils.email.list.invalidate();
			toast.success("Scan frequency updated");
		},
		onError: () => {
			toast.error("Failed to update settings");
		},
	});

	const deleteEmail = api.email.delete.useMutation({
		onSuccess: () => {
			void utils.email.list.invalidate();
			toast.success("Email removed from monitoring");
		},
		onError: () => {
			toast.error("Failed to remove email");
		},
	});

	const scanEmail = api.scan.scanEmail.useMutation({
		onSuccess: () => {
			void utils.email.list.invalidate();
			toast.success("Scan complete");
		},
		onError: () => {
			toast.error("Scan failed");
		},
	});

	const handleAddEmail = (e: React.FormEvent) => {
		e.preventDefault();
		if (!newEmail.trim()) return;
		createEmail.mutate({
			address: newEmail.trim(),
			scanFrequency: newFrequency,
		});
	};

	return (
		<div className="container mx-auto py-8 px-4">
			<div className="mb-8">
				<h1 className="text-3xl font-bold">Email Management</h1>
				<p className="text-muted-foreground mt-1">
					Add and manage email addresses to monitor for breaches
				</p>
			</div>

			<Card className="mb-8">
				<CardHeader>
					<CardTitle>Add Email</CardTitle>
					<CardDescription>
						Add a new email address to monitor for data breaches
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={handleAddEmail}
						className="flex flex-col sm:flex-row gap-3"
					>
						<Input
							type="email"
							placeholder="email@example.com"
							value={newEmail}
							onChange={(e) => setNewEmail(e.target.value)}
							className="flex-1"
							required
						/>
						<Select
							value={newFrequency}
							onValueChange={(v) => setNewFrequency(v as ScanFrequency)}
						>
							<SelectTrigger className="w-full sm:w-32">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="DAILY">Daily</SelectItem>
								<SelectItem value="WEEKLY">Weekly</SelectItem>
								<SelectItem value="MONTHLY">Monthly</SelectItem>
							</SelectContent>
						</Select>
						<Button type="submit" disabled={createEmail.isPending}>
							{createEmail.isPending ? "Adding..." : "Add Email"}
						</Button>
					</form>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Monitored Emails</CardTitle>
					<CardDescription>
						{emailData.totalCount} email(s) being monitored
					</CardDescription>
				</CardHeader>
				<CardContent>
					{emailData.emails.length === 0 ? (
						<p className="text-muted-foreground text-sm py-8 text-center">
							No emails added yet. Add your first email above to start
							monitoring.
						</p>
					) : (
						<>
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
									{emailData.emails.map((email) => (
										<TableRow key={email.id}>
											<TableCell className="font-medium">
												{email.address}
											</TableCell>
											<TableCell>
												<Select
													value={email.scanFrequency}
													onValueChange={(v) =>
														updateEmail.mutate({
															id: email.id,
															scanFrequency: v as ScanFrequency,
														})
													}
												>
													<SelectTrigger className="w-28" size="sm">
														<FrequencyBadge frequency={email.scanFrequency} />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="DAILY">Daily</SelectItem>
														<SelectItem value="WEEKLY">Weekly</SelectItem>
														<SelectItem value="MONTHLY">Monthly</SelectItem>
													</SelectContent>
												</Select>
											</TableCell>
											<TableCell>
												{email.breachCount > 0 ? (
													<Badge variant="destructive">
														{email.breachCount}
													</Badge>
												) : (
													<Badge
														variant={
															email.lastScannedAt ? "success" : "secondary"
														}
													>
														0
													</Badge>
												)}
											</TableCell>
											<TableCell className="text-muted-foreground">
												{formatDate(email.lastScannedAt)}
											</TableCell>
											<TableCell className="text-right">
												<div className="flex items-center justify-end gap-2">
													<Button
														variant="ghost"
														size="sm"
														onClick={() =>
															scanEmail.mutate({ emailId: email.id })
														}
														disabled={scanEmail.isPending}
													>
														{scanEmail.isPending ? "..." : "Scan"}
													</Button>
													<AlertDialog>
														<AlertDialogTrigger
															render={
																<Button variant="destructive" size="sm">
																	Delete
																</Button>
															}
														/>
														<AlertDialogContent>
															<AlertDialogHeader>
																<AlertDialogTitle>
																	Delete Email
																</AlertDialogTitle>
																<AlertDialogDescription>
																	Are you sure you want to stop monitoring{" "}
																	<strong>{email.address}</strong>? This will
																	also delete all associated breach history.
																</AlertDialogDescription>
															</AlertDialogHeader>
															<AlertDialogFooter>
																<AlertDialogCancel>Cancel</AlertDialogCancel>
																<AlertDialogAction
																	variant="destructive"
																	onClick={() =>
																		deleteEmail.mutate({ id: email.id })
																	}
																>
																	Delete
																</AlertDialogAction>
															</AlertDialogFooter>
														</AlertDialogContent>
													</AlertDialog>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
							<PaginationControls
								currentPage={emailData.currentPage}
								totalPages={emailData.totalPages}
								onPageChange={setPage}
							/>
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
