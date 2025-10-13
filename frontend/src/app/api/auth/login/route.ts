// frontend/app/api/auth/login/route.ts

import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const STRAPI = process.env.STRAPI_API_URL;

  try {
    const body = await req.json(); // { identifier, password }
    console.log("[auth/login] incoming body:", body);
    console.log("[auth/login] STRAPI:", STRAPI);

    const res = await fetch(`${STRAPI}/api/auth/local`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    console.log("[auth/login] upstream status:", res.status, "statusText:", res.statusText);

    const contentType = res.headers.get("content-type") || "";
    let data;
    if (contentType.includes("application/json")) {
      data = await res.json();
    } else {
      data = await res.text(); // read plain text / html for debugging
    }

    console.log("[auth/login] upstream response (parsed):", data);

    if (!res.ok) {
      // Return upstream body and status to client, and avoid throwing
      const bodyStr = typeof data === "string" ? data : JSON.stringify(data);
      return new Response(bodyStr, {
        status: res.status,
        headers: { "Content-Type": contentType.includes("application/json") ? "application/json" : "text/plain" },
      });
    }

    // success path: upstream JSON expected
    const token = data.jwt;
    const maxAge = 60 * 60 * 24 * 7; // 7 days
    const secure = process.env.NODE_ENV === "production";
    const cookie = `token=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax; ${secure ? "Secure;" : ""}`;

    return new Response(JSON.stringify({ user: data.user }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Set-Cookie": cookie },
    });
  } catch (err) {
    console.error("[auth/login] ERROR:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}