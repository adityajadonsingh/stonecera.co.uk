// app/product/[slug]/page.tsx
import ImageGallery from "@/components/product/ImageGallery";
import VariationTable from "@/components/product/VariationTable";
import { getProductBySlug } from "@/lib/api/product";
import type { Product } from "@/lib/types";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type ParamsPromise = Promise<{ slug: string }>;
type SearchParamsPromise = Promise<Record<string, string>>;

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: ParamsPromise;
  searchParams?: SearchParamsPromise;
}): Promise<Metadata> {
  const { slug } = await params;
  // optionally await searchParams if you need them:
  // const resolvedSearch = searchParams ? await searchParams : {};
  const product = await getProductBySlug(slug);

  return {
    title: product?.name ?? "Product",
    description: product?.name ?? undefined,
  };
}

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: ParamsPromise;
  searchParams: SearchParamsPromise;
}) {
  // MUST await params/searchParams before using
  const { slug } = await params;
  const _search = await searchParams; // keep if you want to use query params later

  const product: Product = await getProductBySlug(slug);

  if (!product || !product.name) return notFound();

  const variations = product.variations ?? [];
  const fromPerM2 =
    variations.length > 0
      ? Math.min(...variations.map((v) => v.Per_m2 ?? Infinity))
      : undefined;

  return (
    <div className="px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT: gallery (5/12) */}
        <div className="col-span-1 lg:col-span-5">
          <ImageGallery images={product.images ?? []} />
        </div>

        {/* RIGHT: details (7/12) */}
        <div className="col-span-1 lg:col-span-7">
          <nav className="text-sm text-gray-500 mb-3">
            Home / {product.category?.name ?? "Category"} / {product.name}
          </nav>

          <h1 className="text-3xl font-semibold mb-2 text-gray-800">
            {product.name}
          </h1>

          <div className="text-lg text-amber-700 font-medium mb-6">
            From: {fromPerM2 ? `£${fromPerM2.toFixed(2)} /m²` : "—"}
          </div>

          <VariationTable
            productId={product.id}
            variations={variations}
            productDiscount={product.productDiscount}
            categoryDiscount={product.category?.categoryDiscount}
            priceBeforeDiscount={product.priceBeforeDiscount}
          />
        </div>
      </div>
    </div>
  );
}
