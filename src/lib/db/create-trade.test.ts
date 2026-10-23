// @vitest-environment node
import { eq, sql } from "drizzle-orm";
import { expect } from "vitest";
import { createTradeWithExecutions } from "@/lib/db/create-trade";
import { accounts, executions, trades } from "@/lib/db/schema";
import { test } from "@/testing/fixtures";

const entryTime = new Date("2026-01-05T15:30:00Z");
const exitTime = new Date("2026-01-05T16:30:00Z");

test("creates trade, executions, and metrics in one commit", ({ db }) => {
  const [account] = db
    .insert(accounts)
    .values({ name: "Test account", type: "live" })
    .returning()
    .all();

  const tradeId = createTradeWithExecutions(db, {
    accountId: account.id,
    ticker: "AAPL",
    entryTime,
    exitTime,
    entryPrice: 100,
    exitPrice: 105,
    quantity: 50,
    stopLoss: 98,
    target: null,
    commission: 1,
    conviction: null,
    processGrade: null,
    notes: null,
  });

  const trade = db.select().from(trades).where(eq(trades.id, tradeId)).get();
  expect(trade?.profitLoss).toBe(249);
  expect(trade?.profitLossPercent).toBe(5);
  expect(trade?.riskMultiple).toBe(2.5);

  const fills = db
    .select()
    .from(executions)
    .where(eq(executions.tradeId, tradeId))
    .all();
  expect(fills).toHaveLength(2);
  const buy = fills.find((f) => f.side === "buy");
  const sell = fills.find((f) => f.side === "sell");
  expect(buy?.price).toBe(100);
  expect(buy?.commission).toBe(0);
  expect(sell?.price).toBe(105);
  expect(sell?.commission).toBe(1);
});

test("rolls everything back when an execution insert fails", ({ db }) => {
  const [account] = db
    .insert(accounts)
    .values({ name: "Test account", type: "live" })
    .returning()
    .all();

  db.run(
    sql`CREATE TRIGGER reject_negative_price BEFORE INSERT ON executions WHEN NEW.price < 0 BEGIN SELECT RAISE(ABORT, 'negative price'); END`,
  );

  expect(() =>
    createTradeWithExecutions(db, {
      accountId: account.id,
      ticker: "AAPL",
      entryTime,
      exitTime,
      entryPrice: 100,
      exitPrice: -1,
      quantity: 50,
      stopLoss: 98,
      target: null,
      commission: 1,
      conviction: null,
      processGrade: null,
      notes: null,
    }),
  ).toThrow();

  expect(db.select().from(trades).all()).toHaveLength(0);
  expect(db.select().from(executions).all()).toHaveLength(0);
});
