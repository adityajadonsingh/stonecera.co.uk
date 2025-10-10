// FILE: frontend/src/app/api/cart/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  const STRAPI = (process.env.STRAPI_API_URL ?? "http://localhost:1337").replace(/\/+$/, "");
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = (await req.json()) as Record<string, unknown>;
    const res = await fetch(`${STRAPI}/api/cart/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });

    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const json = (await res.json()) as unknown;
      return NextResponse.json(json, { status: res.status });
    }
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "text/plain" } });
  } catch (error: unknown) {
    console.error("PUT /api/cart/[id] error:", error);
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  const STRAPI = (process.env.STRAPI_API_URL ?? "http://localhost:1337").replace(/\/+$/, "");
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const res = await fetch(`${STRAPI}/api/cart/${params.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const json = (await res.json().catch(() => ({ ok: true }))) as unknown;
      return NextResponse.json(json, { status: res.status });
    }
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "text/plain" } });
  } catch (error: unknown) {
    console.error("DELETE /api/cart/[id] error:", error);
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}