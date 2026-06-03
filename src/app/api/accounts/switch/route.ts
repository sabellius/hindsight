import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { accountId } = await request.json();
  const response = NextResponse.json({ ok: true });
  response.cookies.set("hindsight-account-id", String(accountId), {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}
