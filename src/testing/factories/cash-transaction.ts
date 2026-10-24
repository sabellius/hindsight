import { Factory } from "fishery";
import type { cashTransactions } from "@/server/db/schema";

type CashTransactionInsert = typeof cashTransactions.$inferInsert;

export const cashTransactionFactory = Factory.define<CashTransactionInsert>(
  ({ sequence }) => ({
    accountId: sequence,
    type: "dividend",
    amount: 12.34,
    currency: "USD",
    eventDate: new Date("2026-01-15T00:00:00Z"),
    dedupeKey: `cash-${sequence}`,
    createdAt: new Date("2026-01-15T00:00:00Z"),
  }),
);
