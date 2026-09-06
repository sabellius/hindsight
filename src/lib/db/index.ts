import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

export function createDb(databasePath: string) {
  const sqlite = new Database(databasePath);
  return drizzle(sqlite, { schema });
}

export const db = createDb("hindsight.db");
