import { notFound, redirect } from "next/navigation";
import { getCategoryBySlug } from "@/lib/api/category";
import Filters from "@/components/category/Filter";
import ProductGrid from "@/components/product/ProductGrid";
import Pagination from "@/components/category/Pagination";
import ProductsPerPageSelector from "@/components/product/ProductsPerPageSelector";

export default async function CategoryPaginatedPage(props: {
  params: Promise<{ category: string; page: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { category, page: pageParam } = await props.params;
  const searchParams = await props.searchParams;

  const page = parseInt(pageParam || "1", 10);
  // grab limit from query, default to 10
  const limit = parseInt(searchParams.limit || "12", 10);
  const offset = (page - 1) * limit;

  if (page === 1) redirect(`/product-category/${category}`);

  const categoryData = await getCategoryBySlug(category, {
    ...Object.fromEntries(Object.entries(searchParams)),
    limit,
    offset,
  });

  if (!categoryData.name) return notFound();
  const totalProducts = categoryData.totalProducts || 0;
  const totalPages = Math.ceil(totalProducts / limit);

  const filterCounts = categoryData.filterCounts ?? {
    price: {},
    colorTone: {},
    finish: {},
    thickness: {},
    size: {},
    pcs: {},
    packSize: {},
  };

  return (
    <>
      <head>
        <meta name="robots" content="noindex, follow" />
      </head>

      <div className="container mx-auto px-4">
        <h1 className="text-center text-3xl font-bold mt-10 mb-8">
          {categoryData.name}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Filters
              currentFilters={searchParams}
              categorySlug={category}
              filterCounts={filterCounts}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Products‑per‑page dropdown */}
            <div className="flex justify-end mb-4">
              <ProductsPerPageSelector
                currentLimit={limit}
                currentFilters={searchParams}
                categorySlug={category}
                currentPage={page}
              />
            </div>

            <ProductGrid products={categoryData.products} />

            <Pagination
              totalPages={totalPages}
              currentPage={page}
              category={category}
              currentFilters={searchParams}
            />
          </div>
        </div>
      </div>
    </>
  );
}
