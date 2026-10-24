import type { AppDatabase } from "@/server/db";
import { recomputeTradeMetrics } from "@/server/db/recompute";
import { executions } from "@/server/db/schema";

type ExecutionInput = {
  side: "buy" | "sell";
  price: number;
  quantity: number;
  commission: number;
  timestamp: Date;
};

export function addExecution(
  database: Pick<AppDatabase, "insert" | "transaction">,
  tradeId: number,
  execution: ExecutionInput,
) {
  database.transaction((tx) => {
    tx.insert(executions)
      .values({ tradeId, ...execution })
      .run();
    recomputeTradeMetrics(tx, tradeId);
  });
}
