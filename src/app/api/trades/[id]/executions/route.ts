import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { addExecution } from "@/server/db/add-execution";
import { recomputeTradeMetrics } from "@/server/db/recompute";
import { executions } from "@/server/db/schema";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const tradeId = Number(id);
  const formData = await request.formData();

  addExecution(db, tradeId, {
    side: formData.get("side") as "buy" | "sell",
    price: Number(formData.get("price")),
    quantity: Number(formData.get("quantity")),
    timestamp: new Date(formData.get("timestamp") as string),
    commission: Number(formData.get("commission") ?? 0),
  });

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

  recomputeTradeMetrics(db, tradeId);
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

  recomputeTradeMetrics(db, tradeId);
  return NextResponse.json({ ok: true });
}
