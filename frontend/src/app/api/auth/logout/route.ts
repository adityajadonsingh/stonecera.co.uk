// FILE: frontend/src/app/api/auth/logout/route.ts
import { NextResponse } from "next/server";

export async function POST(): Promise<NextResponse> {
  const cookie = `token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax;`;
  return NextResponse.json(
    { ok: true },
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": cookie,
      },
    }
  );
}