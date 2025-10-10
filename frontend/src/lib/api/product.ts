// lib/api/product.ts

import { Product } from "../types";


export async function getProductBySlug(slug: string): Promise<Product> {
  try {
    const url = `${process.env.API_URL!}/product/${encodeURIComponent(slug)}`;
    const res = await fetch(url, {
      cache: "no-store", // server component should always fetch fresh product data
    });
    if (!res.ok) {
      console.error("Error fetching product:", res.status, res.statusText);
      return {} as Product;
    }
    return (await res.json()) as Product;
  } catch (err) {
    console.error("Failed to fetch product:", err);
    return {} as Product;
  }
}