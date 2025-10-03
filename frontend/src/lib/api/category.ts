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