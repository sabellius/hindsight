import { eq } from "drizzle-orm";
import { type createDb, db } from "@/lib/db";
import {
  computeTradeMetrics,
  computeTradeMetricsFromExecutions,
} from "@/lib/db/computed";
import { executions, trades } from "@/lib/db/schema";

type Database = ReturnType<typeof createDb>;

export function recomputeTradeMetrics(database: Database, tradeId: number) {
  const trade = database
    .select()
    .from(trades)
    .where(eq(trades.id, tradeId))
    .get();
  if (!trade) return;

  const fills = database
    .select()
    .from(executions)
    .where(eq(executions.tradeId, tradeId))
    .all();

  const metrics =
    fills.length > 0
      ? computeTradeMetricsFromExecutions(
          fills.map((e) => ({
            side: e.side as "buy" | "sell",
            price: e.price,
            quantity: e.quantity,
            commission: e.commission,
            timestamp: e.timestamp.getTime(),
          })),
          trade.stopLoss,
        )
      : computeTradeMetrics({
          entryPrice: trade.entryPrice,
          exitPrice: trade.exitPrice,
          quantity: trade.quantity,
          commission: trade.commission,
          stopLoss: trade.stopLoss,
        });

  database
    .update(trades)
    .set({
      profitLoss: metrics.profitLoss,
      profitLossPercent: metrics.profitLossPercent,
      riskMultiple: metrics.riskMultiple,
    })
    .where(eq(trades.id, tradeId))
    .run();
}

export function recomputeTrade(tradeId: number) {
  recomputeTradeMetrics(db, tradeId);
}
