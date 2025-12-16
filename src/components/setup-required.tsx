import { IconSettings } from "@tabler/icons-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";

interface SetupRequiredProps {
	title?: string;
	description?: string;
}

export function SetupRequired({
	title = "Setup Required",
	description = "Please configure your API keys before using this feature.",
}: SetupRequiredProps) {
	return (
		<div className="container mx-auto py-8 px-4">
			<Card className="max-w-md mx-auto">
				<CardHeader className="text-center">
					<div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
						<IconSettings className="size-6 text-muted-foreground" />
					</div>
					<CardTitle>{title}</CardTitle>
					<CardDescription>{description}</CardDescription>
				</CardHeader>
				<CardContent className="text-center">
					<p className="text-sm text-muted-foreground mb-4">
						You need to configure your HIBP API key and Resend API key to enable
						breach scanning and email notifications.
					</p>
					<Button render={<Link href="/settings" />}>Go to Settings</Button>
				</CardContent>
			</Card>
		</div>
	);
}
