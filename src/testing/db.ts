import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { createDb } from "@/server/db";

export function createTestDb() {
  const db = createDb(":memory:");
  migrate(db, { migrationsFolder: "drizzle" });
  return db;
}
