// FILE: frontend/src/app/api/user-details/upload/route.ts
import { NextRequest, NextResponse } from "next/server";

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

function toNumber(x: unknown): number | null {
  if (typeof x === "number" && Number.isFinite(x)) return x;
  if (typeof x === "string" && x.trim() !== "" && !Number.isNaN(Number(x))) return Number(x);
  return null;
}

function toString(x: unknown): string | null {
  return typeof x === "string" && x.trim() !== "" ? x : null;
}

function extractFileRecord(json: unknown): Record<string, unknown> | null {
  if (Array.isArray(json) && json.length > 0 && isRecord(json[0])) return json[0];
  if (!isRecord(json)) return null;
  const data = json.data;
  if (Array.isArray(data) && data.length > 0 && isRecord(data[0])) return data[0] as Record<string, unknown>;
  if (isRecord(data)) return data as Record<string, unknown>;
  return json as Record<string, unknown>;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const STRAPI = process.env.STRAPI_API_URL;
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Expect FormData from client (field name "files")
    const formData = await req.formData();

    const upstream = await fetch(`${STRAPI}/api/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        // DO NOT set Content-Type; let fetch set multipart boundary
      },
      body: formData,
    });

    const contentType = upstream.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      const text = await upstream.text();
      return new NextResponse(text, { status: upstream.status, headers: { "Content-Type": "text/plain" } });
    }

    const json = (await upstream.json()) as unknown;
    const fileRecord = extractFileRecord(json);
    if (!fileRecord) {
      return NextResponse.json({ error: "Unexpected upload response" }, { status: 500 });
    }

    // --- Safe extraction of id/url/name using guards + bracket access ---
    // dataField may be undefined/unknown -> guard with isRecord before using
    const idCandidates: unknown[] = [];

    if (Object.prototype.hasOwnProperty.call(fileRecord, "id")) {
      idCandidates.push(fileRecord["id"]);
    }

    const dataField = fileRecord["data"];
    if (isRecord(dataField)) {
      if (Object.prototype.hasOwnProperty.call(dataField, "id")) {
        idCandidates.push(dataField["id"]);
      }
      const dfAttrs = dataField["attributes"];
      if (isRecord(dfAttrs) && Object.prototype.hasOwnProperty.call(dfAttrs, "id")) {
        idCandidates.push(dfAttrs["id"]);
      }
    }

    const fileAttrs = fileRecord["attributes"];
    if (isRecord(fileAttrs) && Object.prototype.hasOwnProperty.call(fileAttrs, "id")) {
      idCandidates.push(fileAttrs["id"]);
    }

    let id: number | null = null;
    for (const cand of idCandidates) {
      const n = toNumber(cand);
      if (n !== null) {
        id = n;
        break;
      }
    }

    // URL candidates
    const urlCandidates: unknown[] = [];
    if (Object.prototype.hasOwnProperty.call(fileRecord, "url")) urlCandidates.push(fileRecord["url"]);
    if (isRecord(fileAttrs) && Object.prototype.hasOwnProperty.call(fileAttrs, "url")) urlCandidates.push(fileAttrs["url"]);
    if (isRecord(dataField)) {
      if (Object.prototype.hasOwnProperty.call(dataField, "url")) urlCandidates.push(dataField["url"]);
      const dfAttrs = dataField["attributes"];
      if (isRecord(dfAttrs) && Object.prototype.hasOwnProperty.call(dfAttrs, "url")) urlCandidates.push(dfAttrs["url"]);
    }

    let url: string | null = null;
    for (const cand of urlCandidates) {
      const s = toString(cand);
      if (s !== null) {
        url = s;
        break;
      }
    }

    // Name candidates
    const nameCandidates: unknown[] = [];
    if (Object.prototype.hasOwnProperty.call(fileRecord, "name")) nameCandidates.push(fileRecord["name"]);
    if (isRecord(fileAttrs) && Object.prototype.hasOwnProperty.call(fileAttrs, "name")) nameCandidates.push(fileAttrs["name"]);
    if (isRecord(dataField)) {
      if (Object.prototype.hasOwnProperty.call(dataField, "name")) nameCandidates.push(dataField["name"]);
      const dfAttrs = dataField["attributes"];
      if (isRecord(dfAttrs) && Object.prototype.hasOwnProperty.call(dfAttrs, "name")) nameCandidates.push(dfAttrs["name"]);
    }

    let name: string | null = null;
    for (const cand of nameCandidates) {
      const s = toString(cand);
      if (s !== null) {
        name = s;
        break;
      }
    }

    return NextResponse.json({ id, url, name }, { status: upstream.status });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error("[/api/user-details/upload] ERROR:", error);
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}