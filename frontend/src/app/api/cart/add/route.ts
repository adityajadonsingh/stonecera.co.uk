// FILE: frontend/src/app/api/cart/add/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { AddToCartBody } from "@/lib/types";

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

function isStringOrNumber(x: unknown): x is string | number {
  return typeof x === "string" || typeof x === "number";
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const STRAPI = process.env.STRAPI_API_URL;

  try {
    const bodyUnknown = (await req.json()) as unknown;

    if (!isRecord(bodyUnknown)) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const rawProduct = bodyUnknown.product;
    const rawVariation = (bodyUnknown.variation_id ?? bodyUnknown.variationId ?? bodyUnknown.variation) as unknown;
    const rawQuantity = bodyUnknown.quantity ?? 1;

    if (!isStringOrNumber(rawProduct) || !isStringOrNumber(rawVariation)) {
      return NextResponse.json({ error: "product and variation_id are required" }, { status: 400 });
    }

    const product: number | string = typeof rawProduct === "number" ? rawProduct : String(rawProduct);
    const variationIdNum = Number(rawVariation);
    if (Number.isNaN(variationIdNum)) {
      return NextResponse.json({ error: "variation_id must be a number" }, { status: 400 });
    }

    const quantityNum = Number(rawQuantity);
    const quantity = Number.isFinite(quantityNum) && quantityNum > 0 ? Math.floor(quantityNum) : 1;
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const payload: AddToCartBody = {
      product,
      variation_id: variationIdNum,
      quantity,
    };

    const upstream = await fetch(`${STRAPI}/api/cart/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
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
    console.error("[/api/cart/add] ERROR:", error);
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}