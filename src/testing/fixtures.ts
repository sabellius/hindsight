import { test as baseTest } from "vitest";
import { createTestDb } from "./db";

export const test = baseTest.extend("db", async ({}, { onCleanup }) => {
  const db = createTestDb();
  onCleanup(() => {
    db.$client.close();
  });
  return db;
});
