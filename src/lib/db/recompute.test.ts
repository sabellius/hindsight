// @vitest-environment node
import { eq } from "drizzle-orm";
import { expect } from "vitest";
import { recomputeTradeMetrics } from "@/lib/db/recompute";
import { accounts, executions, trades } from "@/lib/db/schema";
import { test } from "@/testing/fixtures";

test("recomputes stored metrics from executions after a stop edit", ({
  db,
}) => {
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
      entryTime: new Date("2026-01-05T15:30:00Z"),
      exitTime: new Date("2026-01-05T16:30:00Z"),
      entryPrice: 100,
      exitPrice: 105,
      quantity: 100,
      commission: 0,
      stopLoss: 100,
      profitLoss: 0,
      profitLossPercent: 0,
      riskMultiple: null,
    })
    .returning()
    .all();

  db.insert(executions)
    .values([
      {
        tradeId: trade.id,
        side: "buy",
        price: 100,
        quantity: 100,
        commission: 0,
        timestamp: new Date("2026-01-05T15:30:00Z"),
      },
      {
        tradeId: trade.id,
        side: "sell",
        price: 105,
        quantity: 100,
        commission: 0,
        timestamp: new Date("2026-01-05T16:30:00Z"),
      },
    ])
    .run();

  db.update(trades).set({ stopLoss: 98 }).where(eq(trades.id, trade.id)).run();

  recomputeTradeMetrics(db, trade.id);

  const updated = db.select().from(trades).where(eq(trades.id, trade.id)).get();
  expect(updated?.riskMultiple).toBe(2.5);
  expect(updated?.profitLoss).toBe(500);
});

test("recomputes from flat fields when a trade has no executions", ({ db }) => {
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
      entryTime: new Date("2026-01-05T15:30:00Z"),
      exitTime: new Date("2026-01-05T16:30:00Z"),
      entryPrice: 100,
      exitPrice: 105,
      quantity: 10,
      commission: 0,
      stopLoss: 100,
      profitLoss: 0,
      profitLossPercent: 0,
      riskMultiple: null,
    })
    .returning()
    .all();

  db.update(trades).set({ stopLoss: 98 }).where(eq(trades.id, trade.id)).run();

  recomputeTradeMetrics(db, trade.id);

  const updated = db.select().from(trades).where(eq(trades.id, trade.id)).get();
  expect(updated?.riskMultiple).toBe(2.5);
  expect(updated?.profitLoss).toBe(50);
});

test("open trade stores null metrics, never fake losses", ({ db }) => {
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
      entryTime: new Date("2026-01-05T15:30:00Z"),
      exitTime: new Date("2026-01-05T16:30:00Z"),
      entryPrice: 100,
      exitPrice: 0,
      quantity: 50,
      commission: 1,
      stopLoss: 98,
      profitLoss: -5001,
      profitLossPercent: -100,
      riskMultiple: -50.01,
    })
    .returning()
    .all();

  db.insert(executions)
    .values({
      tradeId: trade.id,
      side: "buy",
      price: 100,
      quantity: 50,
      commission: 1,
      timestamp: new Date("2026-01-05T15:30:00Z"),
    })
    .run();

  recomputeTradeMetrics(db, trade.id);

  const updated = db.select().from(trades).where(eq(trades.id, trade.id)).get();
  expect(updated?.profitLoss).toBeNull();
  expect(updated?.profitLossPercent).toBeNull();
  expect(updated?.riskMultiple).toBeNull();
});
