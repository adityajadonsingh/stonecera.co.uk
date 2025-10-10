// FILE: frontend/src/app/api/user-details/upload/route.ts
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

    // Get FormData from client (expect field name "files")
    const formData = await req.formData();

    const upstream = await fetch(`${STRAPI}/api/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        // Do NOT set Content-Type; allow fetch to set the multipart boundary
      },
      body: formData as unknown as BodyInit,
    });

    const contentType = upstream.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      const text = await upstream.text();
      return new NextResponse(text, { status: upstream.status, headers: { "Content-Type": "text/plain" } });
    }

    const json = (await upstream.json()) as unknown;

    // Normalize first uploaded file for simpler client usage
    // Strapi /upload typically returns an array of file objects
    let fileRecord: unknown = null;
    if (Array.isArray(json) && json.length > 0) fileRecord = json[0];
    else if (isRecord(json) && Array.isArray((json as Record<string, unknown>).data ?? [])) {
      const data = (json as Record<string, unknown>).data as unknown[];
      fileRecord = data[0] ?? null;
    } else {
      fileRecord = json;
    }

    if (!isRecord(fileRecord)) {
      return NextResponse.json({ error: "Unexpected upload response" }, { status: 500 });
    }

    // read id/url from common shapes
    const id = (fileRecord as any).id ?? (fileRecord as any).data?.id ?? null;
    const url = (fileRecord as any).url ?? (fileRecord as any).attributes?.url ?? null;
    const name = (fileRecord as any).name ?? (fileRecord as any).attributes?.name ?? null;

    // make URL absolute if needed (frontend can prefix with NEXT_PUBLIC_STRAPI_API_URL if needed)
    return NextResponse.json({ id, url, name }, { status: upstream.status });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error("[/api/user-details/upload] ERROR:", error);
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}