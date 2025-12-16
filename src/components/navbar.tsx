"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "~/lib/utils";

const NAV_ITEMS = [
	{ href: "/", label: "Dashboard" },
	{ href: "/emails", label: "Emails" },
	{ href: "/breaches", label: "Breaches" },
	{ href: "/settings", label: "Settings" },
];

function NavLink({
	href,
	isActive,
	children,
}: {
	href: string;
	isActive: boolean;
	children: React.ReactNode;
}) {
	return (
		<Link
			href={href}
			className={cn(
				"px-3 py-2 text-sm font-medium transition-colors",
				isActive
					? "text-foreground"
					: "text-muted-foreground hover:text-foreground",
			)}
		>
			{children}
		</Link>
	);
}

export function Navbar() {
	const pathname = usePathname();

	const isActive = (href: string) => {
		if (href === "/") {
			return pathname === "/";
		}
		return pathname.startsWith(href);
	};

	return (
		<header className="border-b">
			<div className="container mx-auto flex h-14 items-center px-4">
				<Link href="/" className="flex items-center gap-2 font-semibold">
					<Image src="/icon.svg" alt="Pwned Checker" width={20} height={20} />
					<span>Pwned Checker</span>
				</Link>
				<nav className="ml-8 flex items-center gap-1">
					{NAV_ITEMS.map((item) => (
						<NavLink
							key={item.href}
							href={item.href}
							isActive={isActive(item.href)}
						>
							{item.label}
						</NavLink>
					))}
				</nav>
			</div>
		</header>
	);
}
