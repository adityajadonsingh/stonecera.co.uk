import { cookies } from "next/headers";
import type { AppUser } from "@/lib/types";

export async function getCurrentUser(): Promise<AppUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  const STRAPI = (
    process.env.STRAPI_API_URL ?? "http://localhost:1337"
  ).replace(/\/+$/, "");
  try {
    const res = await fetch(`${STRAPI}/api/user-details/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as AppUser;
    return data;
  } catch {
    return null;
  }
}
