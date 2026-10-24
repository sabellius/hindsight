import { Factory } from "fishery";
import type { executions } from "@/server/db/schema";

type ExecutionInsert = typeof executions.$inferInsert;

export const executionFactory = Factory.define<ExecutionInsert>(
  ({ sequence }) => ({
    tradeId: sequence,
    side: "buy",
    price: 100,
    quantity: 10,
    timestamp: new Date("2026-01-05T15:30:00Z"),
    commission: 0,
    currency: "USD",
    commissionCurrency: "USD",
    createdAt: new Date("2026-01-05T15:30:00Z"),
  }),
);
