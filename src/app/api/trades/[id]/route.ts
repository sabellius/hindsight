import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { trades } from "@/lib/db/schema";
import { computeTradeMetrics } from "@/lib/db/computed";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const formData = await request.formData();

  const entryPrice = Number(formData.get("entryPrice"));
  const exitPrice = Number(formData.get("exitPrice"));
  const quantity = Number(formData.get("quantity"));
  const commission = Number(formData.get("commission") ?? 0);
  const stopLoss = formData.get("stopLoss")
    ? Number(formData.get("stopLoss"))
    : null;

  const { profitLoss, profitLossPercent, riskMultiple } =
    computeTradeMetrics({ entryPrice, exitPrice, quantity, commission, stopLoss });

  await db
    .update(trades)
    .set({
      entryPrice,
      exitPrice,
      quantity,
      commission,
      stopLoss,
      target: formData.get("target") ? Number(formData.get("target")) : null,
      profitLoss,
      profitLossPercent,
      riskMultiple,
      conviction: (formData.get("conviction") as "A" | "B" | "C") ?? null,
      notes: (formData.get("notes") as string) || null,
    })
    .where(eq(trades.id, Number(id)));

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await db.delete(trades).where(eq(trades.id, Number(id)));
  return NextResponse.json({ ok: true });
}
