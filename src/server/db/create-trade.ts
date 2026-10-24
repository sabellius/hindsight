import { computeTradeMetrics } from "@/lib/computed";
import type { AppDatabase } from "@/server/db";
import { executions, trades } from "@/server/db/schema";

type CreateTradeInput = {
  accountId: number;
  ticker: string;
  entryTime: Date;
  exitTime: Date;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  stopLoss: number | null;
  target: number | null;
  commission: number;
  conviction: "A" | "B" | "C" | null;
  processGrade: "A" | "B" | "C" | null;
  notes: string | null;
};

export function createTradeWithExecutions(
  database: AppDatabase,
  input: CreateTradeInput,
): number {
  const { profitLoss, profitLossPercent, riskMultiple } = computeTradeMetrics({
    entryPrice: input.entryPrice,
    exitPrice: input.exitPrice,
    quantity: input.quantity,
    commission: input.commission,
    stopLoss: input.stopLoss,
  });

  return database.transaction((tx) => {
    const [trade] = tx
      .insert(trades)
      .values({
        accountId: input.accountId,
        ticker: input.ticker,
        side: "long",
        entryTime: input.entryTime,
        exitTime: input.exitTime,
        entryPrice: input.entryPrice,
        exitPrice: input.exitPrice,
        quantity: input.quantity,
        stopLoss: input.stopLoss,
        target: input.target,
        commission: input.commission,
        profitLoss,
        profitLossPercent,
        riskMultiple,
        conviction: input.conviction,
        processGrade: input.processGrade,
        notes: input.notes,
      })
      .returning()
      .all();

    tx.insert(executions)
      .values([
        {
          tradeId: trade.id,
          side: "buy",
          price: input.entryPrice,
          quantity: input.quantity,
          timestamp: input.entryTime,
          commission: 0,
        },
        {
          tradeId: trade.id,
          side: "sell",
          price: input.exitPrice,
          quantity: input.quantity,
          timestamp: input.exitTime,
          commission: input.commission,
        },
      ])
      .run();

    return trade.id;
  });
}
