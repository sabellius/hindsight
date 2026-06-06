import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { trades, executions } from "@/lib/db/schema";
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
  const entryTime = new Date(formData.get("entryTime") as string);
  const exitTime = new Date(formData.get("exitTime") as string);

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
      entryTime,
      exitTime,
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

  const tradeId = result[0].id;

  await db.insert(executions).values([
    {
      tradeId,
      side: "buy",
      price: entryPrice,
      quantity,
      timestamp: entryTime,
      commission: 0,
    },
    {
      tradeId,
      side: "sell",
      price: exitPrice,
      quantity,
      timestamp: exitTime,
      commission,
    },
  ]);

  return NextResponse.json({ id: tradeId });
}
