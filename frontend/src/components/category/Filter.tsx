"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { FilterCounts } from "@/lib/types";

interface FiltersProps {
  currentFilters: Record<string, string>;
  categorySlug: string;
  filterCounts: FilterCounts;
}

export default function Filters({
  currentFilters,
  categorySlug,
  filterCounts,
}: FiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Handles toggle of a filter (keeps all others in URL)
  const handleChange = (filterName: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const current = params.get(filterName);

    if (current === value) {
      params.delete(filterName);
    } else {
      params.set(filterName, value);
    }

    // Always reset "page" when filters change
    params.delete("page");

    // ✅ Build URL for base category (not pagination)
    const targetUrl = `/product-category/${categorySlug}${
      params.toString() ? `?${params.toString()}` : ""
    }`;

    // You can either use router.push + refresh (SPA)
    router.push(targetUrl, { scroll: false });
    // router.refresh();
    window.location.assign(targetUrl);
  };

  // Renders a UI section for any filter list
  const renderFilter = (
    title: string,
    fieldName: string,
    data: Record<string, number>
  ) => {
    const entries = Object.entries(data || {});
    if (entries.length === 0) return null;

    return (
      <section className="mb-4">
        <h3 className="font-semibold text-base mb-2">{title}:</h3>
        {entries.map(([name, count]) => {
          const checked = currentFilters[fieldName] === name;

          return (
            <label
              key={name}
              className={`flex items-center space-x-2 text-sm ${
                count === 0 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              <input
                type="checkbox"
                disabled={count === 0}
                checked={checked}
                onChange={() => handleChange(fieldName, name)}
                className="accent-black cursor-pointer"
              />
              <span>
                {title === "Price" && name.includes("-")
                  ? `£${name.replace("-", " - £")}`
                  : name}{" "}
                ({count})
              </span>
            </label>
          );
        })}
      </section>
    );
  };

  return (
    <aside className="mb-8 bg-black py-4 px-5">
      <h2 className="font-bold text-lg mb-4">Filters</h2>

      {renderFilter("Price", "price", filterCounts.price)}
      {renderFilter("Color & Tone", "colorTone", filterCounts.colorTone)}
      {renderFilter("Finish", "finish", filterCounts.finish)}
      {renderFilter("Thickness", "thickness", filterCounts.thickness)}
      {renderFilter("Size", "size", filterCounts.size)}
      {renderFilter("Pcs", "pcs", filterCounts.pcs)}
      {renderFilter("Pack Size", "packSize", filterCounts.packSize)}
    </aside>
  );
}
