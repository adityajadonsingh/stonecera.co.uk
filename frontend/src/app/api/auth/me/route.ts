// FILE: frontend/src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const STRAPI = process.env.STRAPI_API_URL ?? "http://localhost:1337";

  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const url = new URL("/api/user-details/me", STRAPI).toString();

    const upstream = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const contentType = upstream.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      const text = await upstream.text();
      return new NextResponse(text, { status: upstream.status, headers: { "Content-Type": "text/plain" } });
    }

    const json = (await upstream.json()) as unknown;

    // ensure we return an object or null
    if (!isRecord(json) && json !== null) {
      return NextResponse.json({ user: null }, { status: 500 });
    }

    // return the normalized object (id, username, email, userDetails)
    return NextResponse.json(json as Record<string, unknown> | null, { status: upstream.status });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    console.error("[/api/auth/me] ERROR:", error);
    return NextResponse.json({ error: message, user: null }, { status: 500 });
  }
}