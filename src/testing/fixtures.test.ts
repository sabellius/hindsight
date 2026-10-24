import { expect } from "vitest";
import { accounts, trades } from "@/server/db/schema";
import { test } from "./fixtures";

test("inserts are visible within the test", async ({ db }) => {
  await db.insert(accounts).values({ id: 1, name: "Live Account" });
  await db.insert(trades).values({
    accountId: 1,
    ticker: "NVDA",
    entryTime: new Date("2026-09-03T14:30:00Z"),
    exitTime: new Date("2026-09-03T15:30:00Z"),
    entryPrice: 100,
    exitPrice: 105,
    quantity: 10,
  });

  const tradeRows = await db.select().from(trades);
  expect(tradeRows).toHaveLength(1);
  expect(tradeRows[0].ticker).toBe("NVDA");
  expect(tradeRows[0].entryPrice).toBe(100);
});

test("each test gets a fresh database", async ({ db }) => {
  expect(await db.select().from(trades)).toHaveLength(0);
  expect(await db.select().from(accounts)).toHaveLength(0);
});

test("synchronous transactions roll back atomically", ({ db }) => {
  db.insert(accounts).values({ id: 1, name: "Live Account" }).run();

  expect(() =>
    db.transaction((tx) => {
      tx.insert(accounts).values({ id: 2, name: "Paper Account" }).run();
      tx.rollback();
    }),
  ).toThrow();

  const rows = db.select().from(accounts).all();
  expect(rows).toHaveLength(1);
});
