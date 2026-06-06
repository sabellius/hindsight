import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { executions, trades } from "@/lib/db/schema";
import { computeTradeMetricsFromExecutions } from "@/lib/db/computed";
import { eq, and } from "drizzle-orm";

async function recomputeTrade(tradeId: number) {
  const allExecutions = await db
    .select()
    .from(executions)
    .where(eq(executions.tradeId, tradeId));

  const trade = await db
    .select({ stopLoss: trades.stopLoss })
    .from(trades)
    .where(eq(trades.id, tradeId))
    .get();

  if (!trade || allExecutions.length === 0) return;

  const metrics = computeTradeMetricsFromExecutions(
    allExecutions.map((e) => ({
      side: e.side as "buy" | "sell",
      price: e.price,
      quantity: e.quantity,
      commission: e.commission,
      timestamp: e.timestamp.getTime(),
    })),
    trade.stopLoss,
  );

  await db
    .update(trades)
    .set({
      entryPrice: metrics.entryPrice,
      exitPrice: metrics.exitPrice,
      quantity: metrics.quantity,
      entryTime: new Date(metrics.entryTime),
      exitTime: new Date(metrics.exitTime),
      commission: metrics.commission,
      profitLoss: metrics.profitLoss,
      profitLossPercent: metrics.profitLossPercent,
      riskMultiple: metrics.riskMultiple,
    })
    .where(eq(trades.id, tradeId));
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const tradeId = Number(id);
  const formData = await request.formData();

  await db.insert(executions).values({
    tradeId,
    side: formData.get("side") as "buy" | "sell",
    price: Number(formData.get("price")),
    quantity: Number(formData.get("quantity")),
    timestamp: new Date(formData.get("timestamp") as string),
    commission: Number(formData.get("commission") ?? 0),
  });

  await recomputeTrade(tradeId);
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const tradeId = Number(id);
  const formData = await request.formData();
  const executionId = Number(formData.get("executionId"));

  await db
    .update(executions)
    .set({
      side: formData.get("side") as "buy" | "sell",
      price: Number(formData.get("price")),
      quantity: Number(formData.get("quantity")),
      timestamp: new Date(formData.get("timestamp") as string),
      commission: Number(formData.get("commission") ?? 0),
    })
    .where(eq(executions.id, executionId));

  await recomputeTrade(tradeId);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const tradeId = Number(id);
  const formData = await request.formData();
  const executionId = Number(formData.get("executionId"));

  await db
    .delete(executions)
    .where(
      and(eq(executions.id, executionId), eq(executions.tradeId, tradeId)),
    );

  await recomputeTrade(tradeId);
  return NextResponse.json({ ok: true });
}
