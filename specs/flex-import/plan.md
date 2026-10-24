# Plan: flex-import

**Spec**: `specs/flex-import/spec.md` · **Created**: 2026-10-24 · **Status**: Draft

## Approach

A pure parser module turns a Flex XML file into typed record lists (executions,
cash transactions, unknown records); a planning step dedupes them against the
ledger and prior batches; and one importer service writes the whole file in a
single better-sqlite3 sync transaction — batch record, trades built from
unambiguously grouped fills, cash facts, flags for everything else. The schema
gains fractional quantities and per-amount currency in one table-rebuild
migration plus three new tables (`cash_transactions`, `import_batches`,
`flagged_records`). A tsx CLI (`pnpm import:flex <file>`) wires parser →
planner → importer, copies the raw file under `data/imports/`, and prints
imported / skipped / flagged counts. The settings page gains a read-only
import-history card backed by a small query service. Everything downstream of
the CLI is pure and tested against sanitized fixtures derived from the owner's
real exports.

## Gates [NEEDS-APPROVAL]

| # | Gate | What it costs | My rec |
|---||---|---|---|
| G1 | New runtime dependency: `fast-xml-parser` ^5.11.2 (ADR-0003) | 8 packages in the install tree (itself + 6 same-author first-party splits; `strnum` pulls 1 transitive). Single import site — wrapped only in `src/server/flex/parser.ts`, typed output, no config escape hatches | Approve — hand-rolled XML parsing is a larger correctness risk than 8 small packages; the wrapper keeps it swappable |
| G2 | Destructive-class migration (constitution VI): `executions.quantity` integer→real, currency columns on `executions`, new tables `cash_transactions` / `import_batches` / `flagged_records` | SQLite table-rebuild SQL (create `__new__`, copy, drop, rename) against the real ledger; `pnpm db:generate --name=flex-import` generates it. Required ritual: `pnpm backup`, rehearse on a copy of `hindsight.db`, only then `pnpm db:migrate` | Approve — no drop/rename of live columns, only type widening + additive tables; the backup + rehearsal makes the rebuild safe to run once |

## Constitution check

| Principle | Verdict | Note |
|---|---|---|
| I. Local-first, private | ✅ | Import is fully offline (Rule 1); no new network egress anywhere |
| II. Ledger is the product | ✅ | Imports only add rows; manual trades untouched (Rule 4); metrics still derived via `recomputeTradeMetrics` |
| III. Tax figures auditable | ✅ | Bit-for-bit amounts + per-amount currency (Rules 2, 8) give fx-rates/tax-engine exact inputs; no tax figures computed here |
| IV. Type safety | ✅ | No `any`; parser emits typed records; `fast-xml-parser` hidden behind one typed wrapper (G1) |
| V. Test-first | ✅ | Every production step below is red-green; fixtures deterministic; new money-path modules pinned at 100% branch in `vitest.config.ts` |
| VI. Schema discipline | ⚠️ | Handwritten `schema.ts` + generated migration in one commit; table-rebuild is destructive-class → gate G2 |
| VII. Dependency discipline | ⚠️ | `fast-xml-parser` needs ADR-0003 cited by the parser commit → gate G1 |

## Steps

1. **ADR-0003** `docs/decisions/0003-fast-xml-parser.md` + `pnpm add fast-xml-parser` — unlocks gate G1; cited by step 5's commit
2. **Fixtures + sanitizer**: `scripts/sanitize-flex.ts` (`pnpm sanitize:flex`) reads the owner's raw exports from `src/testing/fixtures/flex/raw/` (already gitignored) and writes sanitized fixtures to `src/testing/fixtures/flex/` — tickers shuffled, account ids/names masked, amounts preserved; served by spec Rules 2/8 fixtures — *blocked on owner providing real exports*
3. **Schema + migration**: edit `src/server/db/schema.ts` — `executions.quantity` → `real`, add `executions.currency` + `executions.commissionCurrency` (default `USD`), add `cash_transactions` (signed `amount` + `currency` + `dedupeKey` unique), `import_batches` (file name, raw path, imported/skipped/flagged counts), `flagged_records` (reason, raw fields JSON); `pnpm db:generate --name=flex-import` in the same commit; ritual per G2 (backup → rehearse on copy → migrate); update `src/testing/factories/` (execution overrides + `cash-transaction.ts`, `import-batch.ts`) and pin the new money-path modules in `vitest.config.ts` — Rules 2, 8; Story 4; gate G2
4. **Model the Flex statement shape**: pure types for Order/CashTransaction records in `src/server/flex/types.ts` with `types.test.ts` covering round-trips of numeric strings (`0.3712`, `EUR`) — Rules 2, 8
5. **Parser**: `src/server/flex/parser.test.ts` (sanitized fixtures: one trade file, one cash file, one file with an unknown section) → `src/server/flex/parser.ts` — the only `fast-xml-parser` import site; unknown/ambiguous sections → flagged records, never guessed — Rules 1, 3; Story 1; ADR-0003 cited
6. **Trade grouping**: `src/server/flex/trade-grouping.test.ts` (2 buys + 1 sell same symbol/time window → one trade; a lone sell → flagged) → `src/server/flex/trade-grouping.ts` — Rule 7
7. **Dedupe/plan**: `src/server/flex/plan-import.test.ts` (same file twice → empty plan; overlapping file → only new records; existing manual trade rows untouched) → `src/server/flex/plan-import.ts` — Rules 4, 7; Story 2
8. **Atomic importer**: `src/server/flex/import.test.ts` (all-rows-or-none on a mid-transaction failure; account auto-create from file; counts written to batch) → `src/server/flex/import.ts` — one sync `database.transaction` (better-sqlite3: sync callbacks, `.run()`/`.all()` terminators), inserts via existing seams `createTradeWithExecutions` / `recomputeTradeMetrics` — Rules 3–5, 8; D3; Stories 1, 3
9. **CLI**: `scripts/import-flex.ts` + `package.json` script `"import:flex": "tsx scripts/import-flex.ts"` — reads `<file>`, parses, plans, imports atomically, copies the raw file to `data/imports/<timestamp>-<name>.xml` (Rule 6), prints `imported / skipped / flagged` (Story 1); tested through the service layer, script stays a thin shell like `scripts/seed.ts`
10. **Import-history panel**: `src/server/import-history.ts` (batches + their flagged records with reasons and raw fields) with `import-history.test.ts`, then a read-only card in `src/app/settings/page.tsx` alongside the existing cards — Story 5
11. **Real-file validation** (owner-run, not code): a real tax year imports clean; re-import is a no-op; one month's counts sampled against IBKR's own figures — spec Done-when

## Risks

- Real Flex exports are an owner dependency — step 2 and the real-file pass cannot run until the owner drops exports into `src/testing/fixtures/flex/raw/`; everything else (schema, parser skeleton, services, CLI) proceeds on the documented format and is re-verified against fixtures once they exist
- Flex XML format variance across statement versions → parser flags unknown elements rather than guessing (Rule 3); fixtures come from the owner's actual files, pinning the real format
- Fractional `real` quantities drifting into display rounding → import stores verbatim (Rule 2); only `src/lib/format.ts` rounds, at render time
- Table-rebuild migration touching the owner's real ledger → `pnpm backup` + rehearsal on a DB copy before the live apply (gate G2); widening only, no column drops
- better-sqlite3 async-transaction trap → importer uses sync callbacks only, per `src/server/db/AGENTS.md`
- Short sells / sell-before-buy fills don't fit the long-only `trades.side` enum → flagged with reason, not dropped or guessed (Rule 7); short support is a future slice
