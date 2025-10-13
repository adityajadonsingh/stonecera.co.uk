// FILE: frontend/src/app/api/cart/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const STRAPI = (process.env.STRAPI_API_URL ?? "http://localhost:1337").replace(/\/+$/, "");
  try {
    const params = await context.params;
    const id = params.id;

    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = (await req.json()) as Record<string, unknown>;

    const upstream = await fetch(`${STRAPI}/api/cart/${encodeURIComponent(String(id))}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const contentType = upstream.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const json = (await upstream.json()) as unknown;
      return NextResponse.json(json, { status: upstream.status });
    }

    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error("PUT /api/cart/[id] error:", error);
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const STRAPI = (process.env.STRAPI_API_URL ?? "http://localhost:1337").replace(/\/+$/, "");
  try {
    const params = await context.params;
    const id = params.id;

    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const upstream = await fetch(`${STRAPI}/api/cart/${encodeURIComponent(String(id))}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const contentType = upstream.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const json = (await upstream.json().catch(() => ({ ok: true }))) as unknown;
      return NextResponse.json(json, { status: upstream.status });
    }

    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error("DELETE /api/cart/[id] error:", error);
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}