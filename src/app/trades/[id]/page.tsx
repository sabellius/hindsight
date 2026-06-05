import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { trades } from "@/lib/db/schema";
import { notFound } from "next/navigation";
import { TradeDetail } from "@/components/trades/trade-detail";

export default async function TradeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trade = await db
    .select()
    .from(trades)
    .where(eq(trades.id, Number(id)))
    .get();

  if (!trade) notFound();

  const serialized = {
    ...trade,
    entryTime: trade.entryTime.getTime(),
    exitTime: trade.exitTime.getTime(),
  };

  return <TradeDetail trade={serialized} />;
}
