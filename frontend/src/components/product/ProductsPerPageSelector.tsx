"use client";

import { useRouter } from "next/navigation";

interface SelectorProps {
  currentLimit: number;
  currentFilters: Record<string, string>;
  categorySlug: string;
  currentPage: number;
}

const options = [12, 24, 36];

export default function ProductsPerPageSelector({
  currentLimit,
  currentFilters,
  categorySlug,
  currentPage,
}: SelectorProps) {
  const router = useRouter();

  const handleChange = (value: string) => {
    const params = new URLSearchParams(currentFilters);

    // ✅ if new value is default (12), remove "limit" entirely
    if (value === "12") params.delete("limit");
    else params.set("limit", value);

    // Whenever limit changes, reset to page 1
    params.delete("page");

    const queryString = params.toString();
    const targetUrl = queryString
      ? `/product-category/${categorySlug}?${queryString}`
      : `/product-category/${categorySlug}`;

    router.push(targetUrl);
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="perPage" className="text-sm font-medium">
        Products per page:
      </label>
      <select
        id="perPage"
        className="border border-gray-300 rounded-md px-2 py-1 text-sm"
        value={currentLimit}
        onChange={(e) => handleChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}