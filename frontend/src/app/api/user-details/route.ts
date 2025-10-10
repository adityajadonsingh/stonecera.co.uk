// FILE: frontend/src/app/api/user-details/route.ts
import { NextRequest, NextResponse } from "next/server";

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const STRAPI = (process.env.STRAPI_API_URL ?? "http://localhost:1337").replace(/\/+$/, "");
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = (await req.json()) as unknown;
    if (!isRecord(body)) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const upstream = await fetch(`${STRAPI}/api/user-details/me`, {
      method: "POST",
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
    return new NextResponse(text, { status: upstream.status, headers: { "Content-Type": "text/plain" } });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error("[/api/user-details] ERROR:", error);
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}