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
      <p className="text-center text-gray-400 italic mt-10">
        No products found for this category.
      </p>
    );
  }

  return (
    <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 my-8">
      {products.map(({ product, variation, priceBeforeDiscount }) => {
        const hasDiscount =
          priceBeforeDiscount &&
          (priceBeforeDiscount.Per_m2 > variation.Per_m2 ||
            priceBeforeDiscount.Price > variation.Price);

        const discountPercent =
          product.productDiscount && product.productDiscount > 0
            ? product.productDiscount
            : product.categoryDiscount && product.categoryDiscount > 0
            ? product.categoryDiscount
            : 0;

        return (
          <Link
            href={`/product/${product.slug}/`}
            key={product.slug}
            className="relative border border-gray-700 rounded-md p-3 bg-black hover:border-gray-500 transition-colors duration-200"
          >
            {/* Discount Badge */}
            {hasDiscount && discountPercent > 0 && (
              <div className="absolute top-2 left-2 z-30 bg-yellow-500 text-black text-xs font-semibold px-2 py-1 rounded">
                {discountPercent}% OFF
              </div>
            )}

            {/* Product Image */}
            <div className="relative aspect-square mb-3 overflow-hidden rounded">
              {product.images?.[0]?.url ? (
                <Image
                  src={
                    process.env.NEXT_PUBLIC_MEDIA_URL + product.images[0].url
                  }
                  alt={product.images[0].alt || product.name}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="bg-gray-800 w-full h-full flex items-center justify-center text-sm text-gray-500">
                  No image
                </div>
              )}
            </div>

            {/* Product Name */}
            <h3 className="font-semibold text-sm md:text-base text-white line-clamp-2 min-h-[3rem]">
              {product.name}
            </h3>

            {/* Pricing */}
            <div className="mt-2 text-sm">
              {/* Per m² */}
              <div className="mt-1">
                <span className="text-gray-400 font-medium">Per m²</span>
                {hasDiscount && (
                  <span className="line-through ml-1 text-gray-500">
                    £{priceBeforeDiscount?.Per_m2}
                  </span>
                )}
                <span className="ml-2 font-bold text-yellow-400">
                  £{variation.Per_m2}
                </span>
              </div>

              {/* Per Pack */}
              <div className="mt-1">
                <span className="text-gray-400 font-medium">Per Pack</span>
                {hasDiscount && (
                  <span className="line-through ml-1 text-gray-500">
                    £{priceBeforeDiscount?.Price}
                  </span>
                )}
                <span className="ml-2 font-bold text-yellow-400">
                  £{variation.Price}
                </span>
              </div>
            </div>

            {/* Stock Info */}
            {variation?.Stock !== undefined && (
              <p
                className={`text-xs mt-2 ${
                  variation.Stock > 0
                    ? "text-green-400"
                    : "text-red-500"
                }`}
              >
                {variation.Stock > 0 ? "In Stock" : "Out of Stock"}
              </p>
            )}
          </Link>
        );
      })}
    </section>
  );
}