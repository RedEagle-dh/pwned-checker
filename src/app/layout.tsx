import "~/styles/globals.css";

import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import { Navbar } from "~/components/navbar";
import { Toaster } from "~/components/ui/sonner";
import { cn } from "~/lib/utils";
import { TRPCReactProvider } from "~/trpc/react";

const notoSans = Noto_Sans({
	subsets: ["latin"],
	variable: "--font-sans",
});

export const metadata: Metadata = {
	title: "Pwned Checker - Email Breach Monitor",
	description:
		"Monitor your email addresses for data breaches using Have I Been Pwned",
	appleWebApp: {
		title: "Pwned",
	},
};

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en" className={cn(notoSans.variable, "dark")}>
			<body className="min-h-screen bg-background font-sans antialiased">
				<TRPCReactProvider>
					<div className="flex min-h-screen flex-col">
						<Navbar />
						<main className="flex-1">{children}</main>
					</div>
					<Toaster richColors />
				</TRPCReactProvider>
			</body>
		</html>
	);
}
