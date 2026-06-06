import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { trades } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const formData = await request.formData();

  await db
    .update(trades)
    .set({
      stopLoss: formData.get("stopLoss")
        ? Number(formData.get("stopLoss"))
        : null,
      target: formData.get("target")
        ? Number(formData.get("target"))
        : null,
      conviction: (formData.get("conviction") as "A" | "B" | "C") ?? null,
      processGrade: (formData.get("processGrade") as "A" | "B" | "C") ?? null,
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
