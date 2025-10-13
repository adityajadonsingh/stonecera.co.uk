// FILE: frontend/src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";

type RegisterRequestBody = {
  username?: string;
  email: string;
  password: string;
  [key: string]: unknown;
};

type JsonObject = Record<string, unknown>;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const base = process.env.STRAPI_API_URL;
  const endpoint = new URL("/api/auth/local/register", base).toString();

  try {
    const body = (await req.json()) as RegisterRequestBody;
    console.log("[auth/register] endpoint:", endpoint);

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const contentType = res.headers.get("content-type") ?? "";
    let parsed: string | JsonObject;
    if (contentType.includes("application/json")) {
      parsed = (await res.json()) as JsonObject;
    } else {
      parsed = await res.text();
    }

    console.log("[auth/register] upstream status:", res.status, "data:", parsed);

    if (!res.ok) {
      const bodyStr = typeof parsed === "string" ? parsed : JSON.stringify(parsed);
      return new NextResponse(bodyStr, {
        status: res.status,
        headers: {
          "Content-Type": contentType.includes("application/json") ? "application/json" : "text/plain",
        },
      });
    }

    if (typeof parsed === "object" && parsed !== null && "jwt" in parsed && typeof parsed.jwt === "string") {
      const token = parsed.jwt;
      const maxAge = 60 * 60 * 24 * 7; // 7 days
      const secure = process.env.NODE_ENV === "production";
      const cookie = `token=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax; ${secure ? "Secure;" : ""}`;

      const user = (parsed as JsonObject).user ?? null;
      return new NextResponse(JSON.stringify({ user }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Set-Cookie": cookie },
      });
    }

    // No jwt (email confirmation required etc.)
    return new NextResponse(typeof parsed === "string" ? parsed : JSON.stringify(parsed), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("[auth/register] ERROR:", error);
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}