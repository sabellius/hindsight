# Tasks: flex-import

**Input**: spec.md + plan.md · **Status**: Draft
**Rule**: every production module lands test-first — the failing-test task
sits immediately before its implementation task.

### A · ADR + sanitizer (plan steps 1–2)

- [ ] T001 Write ADR-0003 `docs/decisions/0003-fast-xml-parser.md` and add `fast-xml-parser@^5.11.2` — one commit (G1, approved)
- [ ] T002 [OWNER] Place raw Flex exports in gitignored `exports/raw/`: the full tax year plus one full month for count sampling — unblocks T006 and T028
- [ ] T003 [test] Failing test for `src/server/flex/sanitize.ts`: masks account ids, keeps quantities/amounts/currencies verbatim
- [ ] T004 Implement `src/server/flex/sanitize.ts` + thin `scripts/sanitize-flex.ts` entry (`pnpm sanitize:flex`), add `exports/` to `.gitignore` — logic in `src/` because vitest only includes `src/**`
- [ ] T005 Commit hand-built sample fixture `src/server/flex/fixtures/sample.flex.xml` pinning the documented Flex format for early work
- [ ] T006 Run the sanitizer on owner exports (T002) → sanitized fixtures committed to `src/server/flex/fixtures/`; parser/grouping tests re-verified against them

### B · Schema + migration (plan step 3)

- [ ] T007 [test] Failing test in `src/server/db/schema.test.ts`: quantity `0.3712` + currency `EUR` round-trip bit-for-bit on trades/executions; `cashTransactions`, `importBatches`, `importFlags` tables exist
- [ ] T008 Widen `executions.quantity` + `trades.quantity` to `real`; add currency columns; add `cashTransactions`, `importBatches`, `importFlags` in `src/server/db/schema.ts`
- [ ] T009 `pnpm db:generate --name=flex-import-widening` — schema + generated migration in one commit (G2, approved; `trades.quantity` rides along either way)
- [ ] T010 G2 ritual: `pnpm backup` → rehearse migration on the DB copy → `pnpm db:migrate`; seeded ledger intact

### C · Types + parser (plan steps 4–5)

- [ ] T011 [test] Failing test for `src/server/flex/types.ts`: `FlexExecution` / `FlexCashTransaction` round-trip numeric strings verbatim (`"0.3712"`, `"1.2345"`), currency carried per amount
- [ ] T012 Implement `src/server/flex/types.ts` — strings preserved, no rounding at the type boundary
- [ ] T013 [test] Failing test for `src/server/flex/parser.ts`: Trades + CashTransactions parse from fixture; unknown element → flag record with raw fields; offline only
- [ ] T014 Implement `src/server/flex/parser.ts` — sole `fast-xml-parser` import site, behind the typed wrapper (ADR-0003)

### D · Grouping + dedupe + importer (plan steps 6–8)

- [ ] T015 [test] Failing test for `src/server/flex/trade-grouping.ts`: 2 buys + 2 sells same ticker → one trade; loner fill → flagged not dropped; sell-before-buy → flagged with reason
- [ ] T016 Implement `src/server/flex/trade-grouping.ts`
- [ ] T017 [test] Failing test for `src/server/flex/plan-import.ts`: identical re-plan → zero new records; overlapping window → only new records; manual trades untouched
- [ ] T018 Implement `src/server/flex/plan-import.ts`
- [ ] T019 [test] Failing test for `src/server/flex/import.ts`: mid-file failure rolls back everything; unknown IBKR account auto-created (D3); one batch row with imported/skipped/flagged counts; cash rows signed with currency
- [ ] T020 Implement `src/server/flex/import.ts` — sync-callback transaction only (`await db.transaction` throws on better-sqlite3)
- [ ] T021 Pin `src/server/flex/{parser,trade-grouping,plan-import,import}.ts` at 100% branch in `vitest.config.ts`

### E · CLI + history (plan steps 9–10)

- [ ] T022 [test] Failing test for `src/server/flex/run-import.ts`: `runImport(path)` → parse, plan, import, archive raw file to `exports/archive/`, return counts
- [ ] T023 Implement `src/server/flex/run-import.ts` + thin `scripts/import-flex.ts` entry (`pnpm import:flex <file>`, pattern of `scripts/seed.ts`)
- [ ] T024 [test] Failing test for `src/server/import-history.ts`: batches with counts; flags with reason + raw fields
- [ ] T025 Implement `src/server/import-history.ts`
- [ ] T026 [test] Failing jsdom test for `src/app/settings/import-history-card.tsx`: read-only batch counts + flagged reasons render
- [ ] T027 Mount the card in `src/app/settings/page.tsx` following the existing Card pattern

### F · Validation (plan step 11)

- [ ] T028 [OWNER] Final validation on the real ledger copy: import the tax year, re-import is a no-op, one month's counts sampled against IBKR's own figures, spec Done-when checked

## Order

- Main chain: T001 → T011–T014 (parser needs the dependency) → T015–T018 → T019–T021 → T022–T023 → T028
- Schema slice T007–T010 is independent of A/C/D until T019 (importer tests write the new tables); it must land before slice D
- Sanitizer slice T003–T005 runs parallel to everything; T006 (real fixtures) waits only on T002 [OWNER] — parser/grouping proceed on T005's sample and re-verify on T006
- Settings card T024–T027 hangs off the importer's table shape (T020), not off the CLI
- Only T006 and T028 block on the owner; every other task is unblocked once T001 lands

## Done

- [ ] All tasks checked
- [ ] Gate green: `pnpm lint && pnpm typecheck && pnpm test:coverage && pnpm build` (repo merge gate, pre-push + CI identical)
- [ ] Spec "Done when" verified: real tax year imports clean; re-import no-op; counts match IBKR for a sampled month; flags reviewable with reasons; money-path modules at 100% branch

## Proposed slice → YouTrack subticket mapping

| Slice | Subticket scope | Tasks | Merge order |
|---|---|---|---|
| 1 | ADR + sanitizer | T001–T006 | first (T001 unblocks 3; T006 waits on owner) |
| 2 | Schema + migration | T007–T010 | first, parallel with 1 (independent) |
| 3 | Types + parser | T011–T014 | after 1 (needs T001) |
| 4 | Grouping + dedupe + importer | T015–T021 | after 2 + 3 |
| 5 | CLI + history | T022–T027 | after 4 |
| — | Final validation | T028 | stays on the epic HND-58 (owner-run, no worktree) |
