import { NextResponse } from "next/server";
import { checkConnection } from "@/server/ibkr/client";

export async function GET() {
  const status = await checkConnection();
  return NextResponse.json(status);
}
