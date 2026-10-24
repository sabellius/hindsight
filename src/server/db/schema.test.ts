import { expect } from "vitest";
import type { AppDatabase } from "@/server/db";
import {
  accounts,
  cashTransactions,
  executions,
  importBatches,
  importFlags,
  trades,
} from "@/server/db/schema";
import {
  accountFactory,
  cashTransactionFactory,
  executionFactory,
  importBatchFactory,
  importFlagFactory,
  tradeFactory,
} from "@/testing/factories";
import { test } from "@/testing/fixtures";

const eventDate = new Date("2026-01-15T00:00:00Z");
const executionTime = new Date("2026-01-05T15:30:00Z");

type TableColumn = { name: string; type: string };

function declaredColumnType(
  db: AppDatabase,
  tableName: string,
  columnName: string,
) {
  const columns = db.$client
    .prepare(`PRAGMA table_info(${tableName})`)
    .all() as TableColumn[];
  return columns.find((column) => column.name === columnName)?.type;
}

function insertAccount(db: AppDatabase) {
  return db
    .insert(accounts)
    .values(accountFactory.build())
    .returning()
    .all()[0];
}

test("round-trips fractional quantity and EUR currencies bit-for-bit", ({
  db,
}) => {
  const account = insertAccount(db);

  const trade = db
    .insert(trades)
    .values(tradeFactory.build({ accountId: account.id, quantity: 0.3712 }))
    .returning()
    .all()[0];

  db.insert(executions)
    .values(
      executionFactory.build({
        tradeId: trade.id,
        quantity: 0.3712,
        currency: "EUR",
        commissionCurrency: "EUR",
      }),
    )
    .run();

  expect(trade.quantity).toBe(0.3712);
  const execution = db.select().from(executions).get();
  expect(execution?.quantity).toBe(0.3712);
  expect(execution?.currency).toBe("EUR");
  expect(execution?.commissionCurrency).toBe("EUR");
});

test("declares quantity columns with real storage", ({ db }) => {
  expect(declaredColumnType(db, "trades", "quantity")).toBe("real");
  expect(declaredColumnType(db, "executions", "quantity")).toBe("real");
});

test("defaults execution currencies to USD", ({ db }) => {
  const account = insertAccount(db);
  const trade = db
    .insert(trades)
    .values(tradeFactory.build({ accountId: account.id }))
    .returning()
    .all()[0];

  db.insert(executions)
    .values({
      tradeId: trade.id,
      side: "sell",
      price: 105.5,
      quantity: 0.5,
      commission: 0,
      timestamp: executionTime,
    })
    .run();

  const execution = db.select().from(executions).get();
  expect(execution?.currency).toBe("USD");
  expect(execution?.commissionCurrency).toBe("USD");
});

test("stores cash transactions with signed amounts and per-row currency", ({
  db,
}) => {
  const account = insertAccount(db);

  db.insert(cashTransactions)
    .values(
      cashTransactionFactory.build({
        accountId: account.id,
        type: "withholding tax",
        amount: -3.09,
        currency: "EUR",
      }),
    )
    .run();

  const cashTransaction = db.select().from(cashTransactions).get();
  expect(cashTransaction?.type).toBe("withholding tax");
  expect(cashTransaction?.amount).toBe(-3.09);
  expect(cashTransaction?.currency).toBe("EUR");
  expect(cashTransaction?.eventDate).toEqual(eventDate);
  expect(cashTransaction?.dedupeKey).toBe("cash-0");

  expect(() =>
    db
      .insert(cashTransactions)
      .values(
        cashTransactionFactory.build({
          accountId: account.id,
          dedupeKey: "cash-0",
        }),
      )
      .run(),
  ).toThrow();
});

test("stores import batches with counts and flags with raw fields", ({
  db,
}) => {
  const account = insertAccount(db);

  const batch = db
    .insert(importBatches)
    .values(importBatchFactory.build())
    .returning()
    .all()[0];
  expect(batch.importedCount).toBe(0);
  expect(batch.skippedCount).toBe(0);
  expect(batch.flaggedCount).toBe(0);

  const countedBatch = db
    .insert(importBatches)
    .values(
      importBatchFactory.build({
        fileName: "2025-tax-year.xml",
        rawFilePath: "exports/archive/2025-tax-year.xml",
        accountId: account.id,
        importedCount: 12,
        skippedCount: 3,
        flaggedCount: 2,
      }),
    )
    .returning()
    .all()[0];
  expect(countedBatch.accountId).toBe(account.id);
  expect(countedBatch.importedCount).toBe(12);
  expect(countedBatch.skippedCount).toBe(3);
  expect(countedBatch.flaggedCount).toBe(2);

  db.insert(importFlags)
    .values(
      importFlagFactory.build({
        batchId: countedBatch.id,
        reason: "unknown flex element",
        rawFields: JSON.stringify({ assetCategory: "CORP", ticker: "XYZ" }),
      }),
    )
    .run();

  const flag = db.select().from(importFlags).get();
  expect(flag?.batchId).toBe(countedBatch.id);
  expect(flag?.reason).toBe("unknown flex element");
  expect(JSON.parse(flag?.rawFields ?? "")).toEqual({
    assetCategory: "CORP",
    ticker: "XYZ",
  });
});
