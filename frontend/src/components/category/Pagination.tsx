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

    // Remove previous "page" if present
    params.delete("page");

    const qs = params.toString();

    // ✅  build proper URL based on page number
    let targetUrl = "";
    if (page === 1) {
      targetUrl = `/product-category/${category}${qs ? `?${qs}` : ""}`;
    } else {
      targetUrl = `/product-category/${category}/page/${page}${qs ? `?${qs}` : ""}`;
    }

    router.push(targetUrl);
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