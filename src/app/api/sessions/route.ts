import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  await db.insert(sessions).values({
    accountId: Number(formData.get("accountId")),
    date: formData.get("date") as string,
    preMarketPlan: (formData.get("preMarketPlan") as string) || null,
    marketCondition: (formData.get("marketCondition") as "trending" | "choppy" | "volatile") || null,
    mood: formData.get("mood") ? Number(formData.get("mood")) : null,
    energy: formData.get("energy") ? Number(formData.get("energy")) : null,
    dailyGrade: (formData.get("dailyGrade") as "A" | "B" | "C" | "D" | "F") || null,
    followedRiskRules: formData.get("followedRiskRules") === "1",
    waitedForSetups: formData.get("waitedForSetups") === "1",
    noForcedTrades: formData.get("noForcedTrades") === "1",
    hitDailyTarget: formData.get("hitDailyTarget") === "1",
    reviewNotes: (formData.get("reviewNotes") as string) || null,
  });

  return NextResponse.json({ ok: true });
}
