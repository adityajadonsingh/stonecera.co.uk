"use client";

import Image from "next/image";
import Link from "next/link";
import type { CategoryProduct } from "@/lib/types";

interface ProductGridProps {
  products: CategoryProduct[];
}

export default function ProductGrid({ products }: ProductGridProps) {
  if (!products?.length) {
    return (
      <p className="text-center text-gray-500 italic mt-10">
        No products found for this category.
      </p>
    );
  }

  return (
    <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 my-8">
      {products.map(({ product, variation }) => (
        <Link
          href={`/product/${product.slug}`}
          key={product.slug}
          className="border rounded-md p-3 hover:shadow-md transition"
        >
          <div className="relative aspect-square mb-3">
            {product.images?.[0]?.url ? (
              <Image
                src={process.env.NEXT_PUBLIC_MEDIA_URL+product.images[0].url}
                alt={product.images[0].alt || product.name}
                fill
                className="object-cover rounded"
              />
            ) : (
              <div className="bg-gray-100 w-full h-full rounded flex items-center justify-center text-sm text-gray-400">
                No image
              </div>
            )}
          </div>

          <h3 className="font-semibold text-sm md:text-base">{product.name}</h3>

          <p className="text-gray-600 text-sm mt-1">
            {variation?.Price ? `£${variation.Price}` : "Contact for price"}
          </p>

          {variation?.Stock !== undefined && (
            <p
              className={`text-xs mt-1 ${
                variation.Stock > 0 ? "text-green-600" : "text-red-500"
              }`}
            >
              {variation.Stock > 0 ? "In Stock" : "Out of Stock"}
            </p>
          )}
        </Link>
      ))}
    </section>
  );
}