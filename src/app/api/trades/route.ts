import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { trades } from "@/lib/db/schema";
import { computeTradeMetrics } from "@/lib/db/computed";

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  const entryPrice = Number(formData.get("entryPrice"));
  const exitPrice = Number(formData.get("exitPrice"));
  const quantity = Number(formData.get("quantity"));
  const commission = Number(formData.get("commission") ?? 0);
  const stopLoss = formData.get("stopLoss")
    ? Number(formData.get("stopLoss"))
    : null;

  const { profitLoss, profitLossPercent, riskMultiple } =
    computeTradeMetrics({
      entryPrice,
      exitPrice,
      quantity,
      commission,
      stopLoss,
    });

  const result = await db
    .insert(trades)
    .values({
      accountId: Number(formData.get("accountId")),
      ticker: formData.get("ticker") as string,
      side: "long",
      entryTime: new Date(formData.get("entryTime") as string),
      exitTime: new Date(formData.get("exitTime") as string),
      entryPrice,
      exitPrice,
      quantity,
      stopLoss,
      target: formData.get("target")
        ? Number(formData.get("target"))
        : null,
      commission,
      profitLoss,
      profitLossPercent,
      riskMultiple,
      conviction: (formData.get("conviction") as "A" | "B" | "C") ?? null,
      processGrade: (formData.get("processGrade") as "A" | "B" | "C") ?? null,
      notes: (formData.get("notes") as string) || null,
    })
    .returning({ id: trades.id });

  return NextResponse.json({ id: result[0].id });
}
