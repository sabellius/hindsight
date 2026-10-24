# Plan: flex-import

**Spec**: `specs/flex-import/spec.md` · **Created**: 2026-10-24 · **Status**: Draft

## Approach

An offline parser turns a Flex export into typed trade and cash records; a planning pass dedupes them against the ledger and prior imports; one importer writes the whole file atomically — trades from unambiguously grouped fills, cash rows, flags for everything unrecognized — recording one batch per file. First the schema gains fractional quantities and per-amount currency in a single widening migration, plus new tables for cash rows, batches, and flags. A thin CLI command wires the three stages together, archives the raw file for replay, and prints counts; the settings page gains a read-only import-history card. Everything below the CLI is pure and tested against sanitized fixtures derived from the owner's real exports.

## Gates [NEEDS-APPROVAL]

| # | Gate | Cost | My rec |
|---|---|---|---|
| G1 | New runtime dependency: `fast-xml-parser` ^5.11.2 (ADR-0003) | 8 install-tree packages; one typed wrapper site | Approve — hand-rolled XML is riskier |
| G2 | Destructive-class migration: widen quantity columns; add currencies + import tables | Includes `trades.quantity` (not yet ruled) — same ritual, commit | Approve — widening only, no drops |

- **G1**: the 8 packages are itself + 6 same-author splits + 1 transitive (`strnum`); the sole import site is the typed parser wrapper.
- **G2**: one generated table-rebuild (`pnpm backup` → rehearse on a DB copy → `pnpm db:migrate`) widens `executions.quantity` and `trades.quantity` to real, adds currency columns + three new tables; the owner hasn't ruled on `trades.quantity` — it rides the same rebuild and commit either way.

## Constitution check

| Principle | Verdict | Note |
|---|---|---|
| I. Local-first, private | ✅ | Fully offline; no new network egress |
| II. Ledger is the product | ✅ | Imports only add rows; manual trades untouched |
| III. Tax figures auditable | ✅ | Bit-for-bit amounts + currency; no tax figures computed here |
| IV. Type safety | ✅ | No `any`; dependency hidden behind one typed wrapper (G1) |
| V. Test-first | ✅ | Every step red-green; money-path modules pinned 100% branch |
| VI. Schema discipline | ⚠️ | Table-rebuild migration is destructive-class → G2 |
| VII. Dependency discipline | ⚠️ | `fast-xml-parser` needs ADR-0003 → G1 |

## Steps

| # | Step (one line: verb + what) | Where | Serves |
|---|---|---|---|
| 1 | Write ADR-0003; add `fast-xml-parser` | `docs/decisions/0003-fast-xml-parser.md` | G1 |
| 2 | Sanitize owner's raw exports: mask ids, keep amounts — *blocked on owner exports* | `scripts/sanitize-flex.ts` | Rules 2, 8 |
| 3 | Widen quantities to real; add currency columns + three tables | `src/server/db/schema.ts` | Rules 2, 8; Story 4; G2 |
| 4 | Model Flex record types; round-trip numeric strings verbatim | `src/server/flex/types.ts` | Rules 2, 8 |
| 5 | Parse trade + cash sections; flag unknown elements | `src/server/flex/parser.ts` | Rules 1, 3; Story 1 |
| 6 | Group unambiguous fills into trades; flag loners | `src/server/flex/trade-grouping.ts` | Rule 7 |
| 7 | Dedupe against ledger + prior batches; leave manual trades untouched | `src/server/flex/plan-import.ts` | Rules 4, 7; Story 2 |
| 8 | Import file atomically; auto-create accounts; write batch counts | `src/server/flex/import.ts` | Rules 3–5, 8; D3; Stories 1, 3 |
| 9 | Wire CLI: parse, plan, import, archive raw file, print counts | `scripts/import-flex.ts` | Rule 6; Story 1 |
| 10 | Query batches + flags; render read-only settings card | `src/server/import-history.ts` + `src/app/settings/page.tsx` | Story 5 |
| 11 | Owner validates real tax year: re-import no-op, sampled counts | owner-run | Done-when |

## Risks

- Real exports are an owner dependency → step 2 and final validation wait; everything else proceeds on the documented format and is re-verified on fixtures
- Flex format variance across statement versions → unknown elements flagged, never guessed (Rule 3); fixtures pin the real format
- Fractional quantities drifting into display rounding → stored verbatim (Rule 2); only `src/lib/format.ts` rounds, at render
- Table-rebuild touching the live ledger → backup + rehearsal on a copy first (G2); widening only, no drops
- better-sqlite3 async-transaction trap → importer uses sync callbacks only, per `src/server/db/AGENTS.md`
- Short / sell-before-buy fills don't fit the long-only side enum → flagged with reason; short support is a future slice
