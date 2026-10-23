import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { addExecution } from "@/lib/db/add-execution";
import { recomputeTrade } from "@/lib/db/recompute";
import { executions } from "@/lib/db/schema";

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

  recomputeTrade(tradeId);
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

  recomputeTrade(tradeId);
  return NextResponse.json({ ok: true });
}
