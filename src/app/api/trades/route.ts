import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createTradeWithExecutions } from "@/lib/db/create-trade";

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  const tradeId = createTradeWithExecutions(db, {
    accountId: Number(formData.get("accountId")),
    ticker: formData.get("ticker") as string,
    entryTime: new Date(formData.get("entryTime") as string),
    exitTime: new Date(formData.get("exitTime") as string),
    entryPrice: Number(formData.get("entryPrice")),
    exitPrice: Number(formData.get("exitPrice")),
    quantity: Number(formData.get("quantity")),
    stopLoss: formData.get("stopLoss")
      ? Number(formData.get("stopLoss"))
      : null,
    target: formData.get("target") ? Number(formData.get("target")) : null,
    commission: Number(formData.get("commission") ?? 0),
    conviction: (formData.get("conviction") as "A" | "B" | "C") ?? null,
    processGrade: (formData.get("processGrade") as "A" | "B" | "C") ?? null,
    notes: (formData.get("notes") as string) || null,
  });

  return NextResponse.json({ id: tradeId });
}
