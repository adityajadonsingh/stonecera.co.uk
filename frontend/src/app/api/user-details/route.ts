// FILE: frontend/src/app/api/user-details/route.ts
import { NextRequest, NextResponse } from "next/server";

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const STRAPI = process.env.STRAPI_API_URL;
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const upstream = await fetch(`${STRAPI}/api/user-details/redis`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    const contentType = upstream.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const json = await upstream.json();
      return NextResponse.json(json, { status: upstream.status });
    }

    const text = await upstream.text();
    return new NextResponse(text, { status: upstream.status, headers: { "Content-Type": "text/plain" } });
  } catch (error: unknown) {
    console.error("[/api/user-details] ERROR:", error);
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const STRAPI = process.env.STRAPI_API_URL ?? "";
  if (!STRAPI) {
    return NextResponse.json({ error: "Server configuration missing" }, { status: 500 });
  }

  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = (await req.json()) as unknown;
    if (!isRecord(body)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // This is the line to fix. It should point to your custom route.
    const upstreamUrl = `${STRAPI.replace(/\/$/, "")}/api/user-details/me`;

    const upstream = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const contentType = upstream.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      const txt = await upstream.text();
      return new NextResponse(txt, { status: upstream.status, headers: { "Content-Type": "text/plain" } });
    }

    const json = await upstream.json();
    return NextResponse.json(json, { status: upstream.status });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    console.error("[/api/user-details] ERROR:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const STRAPI = process.env.STRAPI_API_URL;
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // clear Redis cache
    const upstream = await fetch(`${STRAPI}/api/user-details/redis/clear`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const json = await upstream.json().catch(() => null);
    return NextResponse.json(json ?? { ok: true }, { status: upstream.status });
  } catch (error: unknown) {
    console.error("[/api/user-details/DELETE] ERROR:", error);
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}