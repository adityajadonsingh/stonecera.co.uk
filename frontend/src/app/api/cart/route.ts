// FILE: frontend/src/app/api/cart/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(): Promise<NextResponse> {
  const STRAPI = (process.env.STRAPI_API_URL ?? "http://localhost:1337").replace(/\/+$/, "");
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const res = await fetch(`${STRAPI}/api/cart`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const json = (await res.json()) as unknown;
      return NextResponse.json(json, { status: res.status });
    }

    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "text/plain" } });
  } catch (error: unknown) {
    console.error("GET /api/cart error:", error);
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}