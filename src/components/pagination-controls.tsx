"use client";

import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "~/components/ui/pagination";

interface PaginationControlsProps {
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
}

export function PaginationControls({
	currentPage,
	totalPages,
	onPageChange,
}: PaginationControlsProps) {
	if (totalPages <= 1) return null;

	const getVisiblePages = () => {
		const pages: (number | "ellipsis")[] = [];
		const showEllipsisStart = currentPage > 3;
		const showEllipsisEnd = currentPage < totalPages - 2;

		if (totalPages <= 7) {
			return Array.from({ length: totalPages }, (_, i) => i + 1);
		}

		pages.push(1);

		if (showEllipsisStart) {
			pages.push("ellipsis");
		}

		const start = Math.max(2, currentPage - 1);
		const end = Math.min(totalPages - 1, currentPage + 1);

		for (let i = start; i <= end; i++) {
			if (!pages.includes(i)) {
				pages.push(i);
			}
		}

		if (showEllipsisEnd) {
			pages.push("ellipsis");
		}

		if (!pages.includes(totalPages)) {
			pages.push(totalPages);
		}

		return pages;
	};

	const visiblePages = getVisiblePages();

	return (
		<Pagination className="mt-6">
			<PaginationContent>
				<PaginationItem>
					<PaginationPrevious
						onClick={() => onPageChange(currentPage - 1)}
						aria-disabled={currentPage === 1}
						className={
							currentPage === 1
								? "pointer-events-none opacity-50"
								: "cursor-pointer"
						}
					/>
				</PaginationItem>

				{visiblePages.map((page, index) =>
					page === "ellipsis" ? (
						<PaginationItem key={index < 3 ? "ellipsis-start" : "ellipsis-end"}>
							<PaginationEllipsis />
						</PaginationItem>
					) : (
						<PaginationItem key={page}>
							<PaginationLink
								onClick={() => onPageChange(page)}
								isActive={currentPage === page}
								className="cursor-pointer"
							>
								{page}
							</PaginationLink>
						</PaginationItem>
					),
				)}

				<PaginationItem>
					<PaginationNext
						onClick={() => onPageChange(currentPage + 1)}
						aria-disabled={currentPage === totalPages}
						className={
							currentPage === totalPages
								? "pointer-events-none opacity-50"
								: "cursor-pointer"
						}
					/>
				</PaginationItem>
			</PaginationContent>
		</Pagination>
	);
}
