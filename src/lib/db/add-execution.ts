import type { AppDatabase } from "@/lib/db";
import { recomputeTradeMetrics } from "@/lib/db/recompute";
import { executions } from "@/lib/db/schema";

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
