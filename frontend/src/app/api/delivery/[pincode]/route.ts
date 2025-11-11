// FILE: frontend/src/app/api/delivery/[pincode]/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ pincode: string }> }
): Promise<NextResponse> {
  const { pincode } = await context.params;

  if (!pincode) {
    return NextResponse.json({ error: "Missing pincode" }, { status: 400 });
  }

  const url = `https://pincode.stonecera.co.uk/api/delivery/${encodeURIComponent(pincode)}`;

  try {
    const res = await fetch(url, { next: { revalidate: 60 * 60 } }); // cache 1 hour
    if (!res.ok) {
      const text = await res.text().catch(() => "Upstream error");
      return new NextResponse(text, {
        status: res.status,
        headers: { "Content-Type": "text/plain" },
      });
    }

    const json = await res.json();
    return NextResponse.json(json, { status: 200 });
  } catch (err: unknown) {
    console.error("[/api/delivery] fetch error:", err);
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
