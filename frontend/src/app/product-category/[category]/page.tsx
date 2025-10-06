import Filters from "@/components/category/Filter";
import Pagination from "@/components/category/Pagination";
import ProductGrid from "@/components/product/ProductGrid";
import ProductsPerPageSelector from "@/components/product/ProductsPerPageSelector";
import { getCategoryBySlug } from "@/lib/api/category";
import { notFound, redirect } from "next/navigation";

export default async function CategoryPage(props: {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { category } = await props.params;
  const searchParams = await props.searchParams;

  // Determine current page
  const page = parseInt(searchParams.page || "1", 10);
  if (page === 1 && searchParams.page) {
    redirect(`/product-category/${category}`);
  }

  // Number of products per page (default 10)
  const limit = parseInt(searchParams.limit || "12", 10);
  const offset = (page - 1) * limit;

  // Fetch category data
  const categoryData = await getCategoryBySlug(category, {
    ...Object.fromEntries(Object.entries(searchParams)),
    limit,
    offset,
  });

  if (!categoryData.name) return notFound();

  const totalProducts = categoryData.totalProducts || 0;
  const totalPages = Math.ceil(totalProducts / limit);

  const safeFilterCounts = categoryData.filterCounts ?? {
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
        {page > 1 && <meta name="robots" content="noindex, follow" />}
      </head>

      <h1 className="text-center text-3xl font-bold mt-10 mb-8">
        {categoryData.name}
      </h1>

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <Filters
              currentFilters={searchParams}
              categorySlug={category}
              filterCounts={safeFilterCounts}
            />
          </div>

          {/* Products + Pagination */}
          <div className="lg:col-span-3">
            {/* ✅ Products‑per‑page dropdown */}
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
