// FILE: frontend/src/app/api/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const STRAPI = process.env.STRAPI_API_URL ?? "";
  try {
    const token = req.cookies.get("token")?.value;

    const body = (await req.json()) as unknown;
    if (!isRecord(body)) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

    // Prepare payload for Strapi "order" content-type (adjust fields to your schema)
    const payload = {
        user: token ? { /* you can send user id or let Strapi resolve via token */ } : null,
        items: body.items ?? [],
        shipping: body.shipping ?? {},
        totals: body.totals ?? {},
        status: "pending",  
    };

    const upstream = await fetch(`${STRAPI.replace(/\/$/, "")}/api/orders/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    const contentType = upstream.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      const txt = await upstream.text();
      return new NextResponse(txt, { status: upstream.status });
    }
    const json = await upstream.json();
    return NextResponse.json(json, { status: upstream.status });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[/api/checkout] ERROR:", err);
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}