"use client";

import { useRouter } from "next/navigation";

interface PaginationProps {
  totalPages: number;
  currentPage: number;
  category: string;
  currentFilters: Record<string, string>;
}

export default function Pagination({
  totalPages,
  currentPage,
  category,
  currentFilters,
}: PaginationProps) {
  const router = useRouter();

  const handleNavigation = (page: number) => {
    const params = new URLSearchParams(currentFilters);
    params.set("page", String(page));
    router.push(`/product-category/${category}?${params.toString()}`);
  };

  if (totalPages <= 1) return null;

  return (
    <nav className="flex justify-center mt-8 gap-2">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          className={`px-3 py-1 border ${
            p === currentPage ? "bg-black text-white" : ""
          }`}
          onClick={() => handleNavigation(p)}
        >
          {p}
        </button>
      ))}
    </nav>
  );
}