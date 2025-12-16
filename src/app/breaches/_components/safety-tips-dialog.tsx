"use client";

import { IconShieldCheck } from "@tabler/icons-react";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import { getSafetyTips } from "~/lib/safety-tips";

interface SafetyTipsDialogProps {
	breachName: string;
	dataClasses: string[];
}

export function SafetyTipsDialog({
	breachName,
	dataClasses,
}: SafetyTipsDialogProps) {
	const tips = getSafetyTips(dataClasses);

	return (
		<Dialog>
			<DialogTrigger
				render={
					<Button variant="outline" size="sm">
						<IconShieldCheck className="size-4 mr-1" />
						Safety Tips
					</Button>
				}
			/>
			<DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>What to do after this breach</DialogTitle>
					<DialogDescription>
						Recommended actions based on the data exposed in the {breachName}{" "}
						breach.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{tips.map((tipGroup) => (
						<div key={tipGroup.category}>
							<h4 className="font-medium text-sm mb-2">{tipGroup.category}</h4>
							<ul className="space-y-1.5">
								{tipGroup.tips.map((tip) => (
									<li
										key={tip}
										className="text-sm text-muted-foreground flex items-start gap-2"
									>
										<span className="text-primary mt-1">•</span>
										<span>{tip}</span>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>

				<DialogFooter showCloseButton />
			</DialogContent>
		</Dialog>
	);
}
