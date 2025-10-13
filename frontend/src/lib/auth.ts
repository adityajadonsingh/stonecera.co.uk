// src/lib/auth.ts
import { cookies } from "next/headers";

const STRAPI = process.env.STRAPI_API_URL;

export async function getCurrentUser() {
  try {
    // await the cookies() promise before using .get()
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;

    const res = await fetch(`${STRAPI}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!res.ok) return null;
    return res.json();
  } catch (err) {
    console.error("getCurrentUser error:", err);
    return null;
  }
}