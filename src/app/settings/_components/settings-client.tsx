"use client";

import { IconCheck, IconRefresh, IconX } from "@tabler/icons-react";
import { useState } from "react";
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
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { api } from "~/trpc/react";

const DAY_NAMES = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
];

function formatDate(date: Date | string | null): string {
	if (!date) return "Unknown";
	const d = new Date(date);
	return d.toLocaleDateString("en-US", {
		month: "long",
		day: "numeric",
		year: "numeric",
	});
}

function StatusIndicator({ configured }: { configured: boolean }) {
	return configured ? (
		<Badge variant="success" className="gap-1">
			<IconCheck className="size-3" />
			Configured
		</Badge>
	) : (
		<Badge variant="destructive" className="gap-1">
			<IconX className="size-3" />
			Not configured
		</Badge>
	);
}

export function SettingsClient() {
	const utils = api.useUtils();
	const [settings] = api.settings.get.useSuspenseQuery();

	// API Keys form state
	const [hibpApiKey, setHibpApiKey] = useState("");
	const [resendApiKey, setResendApiKey] = useState("");
	const [notificationEmail, setNotificationEmail] = useState(
		settings.notificationEmail ?? "",
	);

	// Schedule form state
	const [dailyHour, setDailyHour] = useState(settings.dailyScanHour);
	const [dailyMinute, setDailyMinute] = useState(settings.dailyScanMinute);
	const [weeklyDay, setWeeklyDay] = useState(settings.weeklyScanDay);
	const [weeklyHour, setWeeklyHour] = useState(settings.weeklyScanHour);
	const [weeklyMinute, setWeeklyMinute] = useState(settings.weeklyScanMinute);
	const [monthlyDay, setMonthlyDay] = useState(settings.monthlyScanDay);
	const [monthlyHour, setMonthlyHour] = useState(settings.monthlyScanHour);
	const [monthlyMinute, setMonthlyMinute] = useState(
		settings.monthlyScanMinute,
	);

	const updateApiKeys = api.settings.updateApiKeys.useMutation({
		onSuccess: () => {
			void utils.settings.get.invalidate();
			setHibpApiKey("");
			setResendApiKey("");
			toast.success("API keys saved");
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const updateSchedule = api.settings.updateSchedule.useMutation({
		onSuccess: () => {
			void utils.settings.get.invalidate();
			toast.success("Schedule updated");
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const refreshSubscription = api.settings.refreshSubscription.useMutation({
		onSuccess: () => {
			void utils.settings.get.invalidate();
			toast.success("Subscription status refreshed");
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const handleSaveApiKeys = (e: React.FormEvent) => {
		e.preventDefault();
		const data: {
			hibpApiKey?: string;
			resendApiKey?: string;
			notificationEmail?: string;
		} = {};

		if (hibpApiKey) data.hibpApiKey = hibpApiKey;
		if (resendApiKey) data.resendApiKey = resendApiKey;
		if (notificationEmail) data.notificationEmail = notificationEmail;

		if (Object.keys(data).length === 0) {
			toast.error("Please enter at least one value to update");
			return;
		}

		updateApiKeys.mutate(data);
	};

	const handleSaveSchedule = (e: React.FormEvent) => {
		e.preventDefault();
		updateSchedule.mutate({
			dailyScanHour: dailyHour,
			dailyScanMinute: dailyMinute,
			weeklyScanDay: weeklyDay,
			weeklyScanHour: weeklyHour,
			weeklyScanMinute: weeklyMinute,
			monthlyScanDay: monthlyDay,
			monthlyScanHour: monthlyHour,
			monthlyScanMinute: monthlyMinute,
		});
	};

	const hours = Array.from({ length: 24 }, (_, i) => i);
	const minutes = Array.from({ length: 60 }, (_, i) => i);
	const days = Array.from({ length: 28 }, (_, i) => i + 1);

	return (
		<div className="container mx-auto py-8 px-4">
			<div className="mb-8">
				<h1 className="text-3xl font-bold">Settings</h1>
				<p className="text-muted-foreground mt-1">
					Configure API keys, scan schedules, and view subscription status
				</p>
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				{/* API Keys Card */}
				<Card>
					<CardHeader>
						<CardTitle>API Keys</CardTitle>
						<CardDescription>
							Configure your HIBP and Resend API keys for breach scanning and
							notifications
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSaveApiKeys} className="space-y-4">
							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<Label htmlFor="hibpApiKey">HIBP API Key</Label>
									<StatusIndicator configured={settings.hasHibpApiKey} />
								</div>
								<Input
									id="hibpApiKey"
									type="password"
									placeholder={
										settings.hasHibpApiKey
											? "Enter new key to replace"
											: "Enter your HIBP API key"
									}
									value={hibpApiKey}
									onChange={(e) => setHibpApiKey(e.target.value)}
								/>
								<p className="text-xs text-muted-foreground">
									Get your API key from{" "}
									<a
										href="https://haveibeenpwned.com/API/Key"
										target="_blank"
										rel="noopener noreferrer"
										className="underline"
									>
										haveibeenpwned.com/API/Key
									</a>
								</p>
							</div>

							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<Label htmlFor="resendApiKey">Resend API Key</Label>
									<StatusIndicator configured={settings.hasResendApiKey} />
								</div>
								<Input
									id="resendApiKey"
									type="password"
									placeholder={
										settings.hasResendApiKey
											? "Enter new key to replace"
											: "Enter your Resend API key"
									}
									value={resendApiKey}
									onChange={(e) => setResendApiKey(e.target.value)}
								/>
								<p className="text-xs text-muted-foreground">
									Get your API key from{" "}
									<a
										href="https://resend.com/api-keys"
										target="_blank"
										rel="noopener noreferrer"
										className="underline"
									>
										resend.com/api-keys
									</a>
								</p>
							</div>

							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<Label htmlFor="notificationEmail">Notification Email</Label>
									<StatusIndicator configured={!!settings.notificationEmail} />
								</div>
								<Input
									id="notificationEmail"
									type="email"
									placeholder="Enter email for breach alerts"
									value={notificationEmail}
									onChange={(e) => setNotificationEmail(e.target.value)}
								/>
								<p className="text-xs text-muted-foreground">
									Breach alerts will be sent to this email address
								</p>
							</div>

							<Button type="submit" disabled={updateApiKeys.isPending}>
								{updateApiKeys.isPending ? "Saving..." : "Save"}
							</Button>
						</form>
					</CardContent>
				</Card>

				{/* Subscription Status Card */}
				<Card>
					<CardHeader>
						<CardTitle>HIBP Subscription Status</CardTitle>
						<CardDescription>
							Your Have I Been Pwned API subscription details
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{settings.hibpSubscriptionName ? (
							<>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<p className="text-xs text-muted-foreground">Plan</p>
										<p className="font-medium">
											{settings.hibpSubscriptionName}
										</p>
									</div>
									<div>
										<p className="text-xs text-muted-foreground">Rate Limit</p>
										<p className="font-medium">{settings.hibpRpm} RPM</p>
									</div>
									<div>
										<p className="text-xs text-muted-foreground">Valid Until</p>
										<p className="font-medium">
											{formatDate(settings.hibpSubscribedUntil)}
										</p>
									</div>
									<div>
										<p className="text-xs text-muted-foreground">
											Domain Search Max
										</p>
										<p className="font-medium">
											{settings.hibpDomainSearchMax?.toLocaleString() ?? "N/A"}
										</p>
									</div>
									<div className="col-span-2">
										<p className="text-xs text-muted-foreground">
											Stealer Logs Access
										</p>
										<p className="font-medium">
											{settings.hibpIncludesStealerLogs ? "Yes" : "No"}
										</p>
									</div>
									{settings.hibpDescription && (
										<div className="col-span-2">
											<p className="text-xs text-muted-foreground">
												Description
											</p>
											<p className="text-sm">{settings.hibpDescription}</p>
										</div>
									)}
								</div>
								{settings.hibpSubscriptionUpdatedAt && (
									<p className="text-xs text-muted-foreground">
										Last updated:{" "}
										{formatDate(settings.hibpSubscriptionUpdatedAt)}
									</p>
								)}
							</>
						) : (
							<p className="text-muted-foreground text-sm">
								{settings.hasHibpApiKey
									? "Click refresh to fetch your subscription status"
									: "Configure your HIBP API key first"}
							</p>
						)}

						<Button
							variant="outline"
							onClick={() => refreshSubscription.mutate()}
							disabled={
								refreshSubscription.isPending || !settings.hasHibpApiKey
							}
						>
							<IconRefresh
								className={`size-4 mr-2 ${refreshSubscription.isPending ? "animate-spin" : ""}`}
							/>
							{refreshSubscription.isPending
								? "Refreshing..."
								: "Refresh Status"}
						</Button>
					</CardContent>
				</Card>

				{/* Schedule Card */}
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle>Scan Schedule</CardTitle>
						<CardDescription>
							Configure when automatic breach scans run for each frequency type
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSaveSchedule}>
							<div className="grid gap-6 md:grid-cols-3">
								{/* Daily Schedule */}
								<div className="space-y-4">
									<h3 className="font-medium">Daily Scan</h3>
									<div className="grid grid-cols-2 gap-2">
										<div className="space-y-2">
											<Label>Hour</Label>
											<Select
												value={dailyHour.toString()}
												onValueChange={(v) =>
													v && setDailyHour(parseInt(v, 10))
												}
											>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{hours.map((h) => (
														<SelectItem key={h} value={h.toString()}>
															{h.toString().padStart(2, "0")}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<div className="space-y-2">
											<Label>Minute</Label>
											<Select
												value={dailyMinute.toString()}
												onValueChange={(v) =>
													v && setDailyMinute(parseInt(v, 10))
												}
											>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{minutes.map((m) => (
														<SelectItem key={m} value={m.toString()}>
															{m.toString().padStart(2, "0")}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									</div>
									<p className="text-xs text-muted-foreground">
										Runs every day at {dailyHour.toString().padStart(2, "0")}:
										{dailyMinute.toString().padStart(2, "0")}
									</p>
								</div>

								{/* Weekly Schedule */}
								<div className="space-y-4">
									<h3 className="font-medium">Weekly Scan</h3>
									<div className="space-y-2">
										<Label>Day</Label>
										<Select
											value={weeklyDay.toString()}
											onValueChange={(v) => v && setWeeklyDay(parseInt(v, 10))}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{DAY_NAMES.map((day, i) => (
													<SelectItem key={day} value={i.toString()}>
														{day}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="grid grid-cols-2 gap-2">
										<div className="space-y-2">
											<Label>Hour</Label>
											<Select
												value={weeklyHour.toString()}
												onValueChange={(v) =>
													v && setWeeklyHour(parseInt(v, 10))
												}
											>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{hours.map((h) => (
														<SelectItem key={h} value={h.toString()}>
															{h.toString().padStart(2, "0")}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<div className="space-y-2">
											<Label>Minute</Label>
											<Select
												value={weeklyMinute.toString()}
												onValueChange={(v) =>
													v && setWeeklyMinute(parseInt(v, 10))
												}
											>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{minutes.map((m) => (
														<SelectItem key={m} value={m.toString()}>
															{m.toString().padStart(2, "0")}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									</div>
									<p className="text-xs text-muted-foreground">
										Runs every {DAY_NAMES[weeklyDay]} at{" "}
										{weeklyHour.toString().padStart(2, "0")}:
										{weeklyMinute.toString().padStart(2, "0")}
									</p>
								</div>

								{/* Monthly Schedule */}
								<div className="space-y-4">
									<h3 className="font-medium">Monthly Scan</h3>
									<div className="space-y-2">
										<Label>Day of Month</Label>
										<Select
											value={monthlyDay.toString()}
											onValueChange={(v) => v && setMonthlyDay(parseInt(v, 10))}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{days.map((d) => (
													<SelectItem key={d} value={d.toString()}>
														{d}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="grid grid-cols-2 gap-2">
										<div className="space-y-2">
											<Label>Hour</Label>
											<Select
												value={monthlyHour.toString()}
												onValueChange={(v) =>
													v && setMonthlyHour(parseInt(v, 10))
												}
											>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{hours.map((h) => (
														<SelectItem key={h} value={h.toString()}>
															{h.toString().padStart(2, "0")}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<div className="space-y-2">
											<Label>Minute</Label>
											<Select
												value={monthlyMinute.toString()}
												onValueChange={(v) =>
													v && setMonthlyMinute(parseInt(v, 10))
												}
											>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{minutes.map((m) => (
														<SelectItem key={m} value={m.toString()}>
															{m.toString().padStart(2, "0")}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									</div>
									<p className="text-xs text-muted-foreground">
										Runs on day {monthlyDay} at{" "}
										{monthlyHour.toString().padStart(2, "0")}:
										{monthlyMinute.toString().padStart(2, "0")}
									</p>
								</div>
							</div>

							<Button
								type="submit"
								className="mt-6"
								disabled={updateSchedule.isPending}
							>
								{updateSchedule.isPending ? "Saving..." : "Save Schedule"}
							</Button>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
