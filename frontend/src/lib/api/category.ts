import { Category } from "../types";

export async function getAllCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${process.env.API_URL!}/categories`, {
      next: { revalidate: process.env.REVALIDATE_TIME ? parseInt(process.env.REVALIDATE_TIME) : 60 },
    });

    if (!res.ok) {
      console.error("Error fetching categories:", res.status, res.statusText);
      return [];
    }

    return res.json();
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return [];
  }
}
export async function getCategoryBySlug(
  slug: string,
  params: Record<string, string | number | undefined> = {}
): Promise<Category> {
  try {
    // ✅ Convert every key/value into a safe string
    const cleanParams: Record<string, string> = {};
    for (const key in params) {
      const val = params[key];
      if (val !== undefined && val !== null) {
        cleanParams[key] = String(val);
      }
    }

    const query = new URLSearchParams(cleanParams).toString();
    const url = `${process.env.API_URL!}/category/${slug}${query ? `?${query}` : ""}`;

    const res = await fetch(url, {
      next: {
        revalidate: process.env.REVALIDATE_TIME
          ? parseInt(process.env.REVALIDATE_TIME)
          : 60,
      },
    });

    if (!res.ok) {
      console.error("Error fetching category data:", res.status, res.statusText);
      return {} as Category;
    }

    return res.json();
  } catch (error) {
    console.error("Failed to fetch category data:", error);
    return {} as Category;
  }
}