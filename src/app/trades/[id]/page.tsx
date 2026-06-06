import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { trades, executions } from "@/lib/db/schema";
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

  const tradeExecutions = await db
    .select()
    .from(executions)
    .where(eq(executions.tradeId, trade.id));

  const serialized = {
    ...trade,
    entryTime: trade.entryTime.getTime(),
    exitTime: trade.exitTime.getTime(),
  };

  const serializedExecutions = tradeExecutions.map((e) => ({
    ...e,
    timestamp: e.timestamp.getTime(),
    createdAt: e.createdAt.getTime(),
  }));

  return (
    <TradeDetail trade={serialized} executions={serializedExecutions} />
  );
}
