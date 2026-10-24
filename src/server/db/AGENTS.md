# Database Rules

- `src/server/db/schema.ts` is the handwritten source of truth and the query
  API; `drizzle/*.sql` is generated history. A schema change and its
  generated migration land in the same commit. Never edit generated SQL
  beyond journal-conflict resolution.
- Migration order lives in `drizzle/meta/_journal.json`, not filenames;
  two branches each generating a migration requires manual journal
  reconciliation (renumber the younger side).
- **Table-rebuild migrations can silently cascade-delete child rows**: the
  migrator runs each migration inside one transaction, where the generated
  `PRAGMA foreign_keys=OFF` guard is a no-op (better-sqlite3 defaults
  foreign_keys=ON), so `DROP TABLE` fires `ON DELETE CASCADE` on rebuilt
  children. Fresh in-memory test databases cannot catch this — rehearse
  generated table rebuilds on a copy of the real ledger, and prefer the
  FK-drop/re-add pattern (drop child FK references in one migration,
  rebuild the parent, restore FKs in the next) over a single rebuild.
- **better-sqlite3 transactions are synchronous-only**: async callbacks
  throw. Use sync callbacks with sync terminators (`.run()`, `.all()`,
  `.get()`); `await db.transaction(async ...)` does not apply to this driver.
- Timestamps are ms Unix; Drizzle mode `timestamp_ms`.
- Metrics derive from fills in `computed.ts` — `computeTradeMetrics`
  (flat fields) and `computeTradeMetricsFromExecutions` (fills, canonical).

Fresh setup: `pnpm db:migrate && pnpm seed`.
