// @vitest-environment node
import { eq, sql } from "drizzle-orm";
import { expect } from "vitest";
import { addExecution } from "@/server/db/add-execution";
import { accounts, executions, trades } from "@/server/db/schema";
import { test } from "@/testing/fixtures";

const entryTime = new Date("2026-01-05T15:30:00Z");
const exitTime = new Date("2026-01-05T16:30:00Z");

test("adds execution and recomputes stored metrics in one commit", ({ db }) => {
  const [account] = db
    .insert(accounts)
    .values({ name: "Test account", type: "live" })
    .returning()
    .all();
  const [trade] = db
    .insert(trades)
    .values({
      accountId: account.id,
      ticker: "AAPL",
      side: "long",
      entryTime,
      exitTime,
      entryPrice: 100,
      exitPrice: 100,
      quantity: 10,
      commission: 0,
      stopLoss: 98,
      profitLoss: 0,
      profitLossPercent: 0,
      riskMultiple: null,
    })
    .returning()
    .all();
  db.insert(executions)
    .values({
      tradeId: trade.id,
      side: "buy",
      price: 100,
      quantity: 10,
      commission: 0,
      timestamp: entryTime,
    })
    .run();

  addExecution(db, trade.id, {
    side: "sell",
    price: 105,
    quantity: 10,
    commission: 0,
    timestamp: exitTime,
  });

  const updated = db.select().from(trades).where(eq(trades.id, trade.id)).get();
  expect(updated?.profitLoss).toBe(50);
  expect(updated?.riskMultiple).toBe(2.5);
  expect(
    db.select().from(executions).where(eq(executions.tradeId, trade.id)).all(),
  ).toHaveLength(2);
});

test("rolls the execution back when the metric update fails", ({ db }) => {
  const [account] = db
    .insert(accounts)
    .values({ name: "Test account", type: "live" })
    .returning()
    .all();
  const [trade] = db
    .insert(trades)
    .values({
      accountId: account.id,
      ticker: "AAPL",
      side: "long",
      entryTime,
      exitTime,
      entryPrice: 100,
      exitPrice: 100,
      quantity: 10,
      commission: 0,
      stopLoss: 98,
      profitLoss: 0,
      profitLossPercent: 0,
      riskMultiple: null,
    })
    .returning()
    .all();
  db.insert(executions)
    .values({
      tradeId: trade.id,
      side: "buy",
      price: 100,
      quantity: 10,
      commission: 0,
      timestamp: entryTime,
    })
    .run();

  db.run(
    sql`CREATE TRIGGER reject_marker_profit BEFORE UPDATE ON trades WHEN NEW.profit_loss = 50 BEGIN SELECT RAISE(ABORT, 'marker profit'); END`,
  );

  expect(() =>
    addExecution(db, trade.id, {
      side: "sell",
      price: 105,
      quantity: 10,
      commission: 0,
      timestamp: exitTime,
    }),
  ).toThrow();

  expect(
    db.select().from(executions).where(eq(executions.tradeId, trade.id)).all(),
  ).toHaveLength(1);
  const unchanged = db
    .select()
    .from(trades)
    .where(eq(trades.id, trade.id))
    .get();
  expect(unchanged?.profitLoss).toBe(0);
});
