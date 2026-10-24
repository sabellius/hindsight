# Hindsight Constitution

The non-negotiable rules of Hindsight, a local-first personal trading
journal that also computes the owner's Israeli tax figures from the trade
ledger. Every other document elaborates these rules; none may contradict
them. Conflicts resolve downward: the constitution wins and the other
document is fixed. The owner is the final authority on every merge.

## Principles

### I. Local-first, private by default
The owner's trading data never leaves this machine except through explicit
owner action. No accounts, no cloud sync, no telemetry, no crash reporting.
Any new network egress requires an ADR in docs/decisions/ cited by the
change that adds it.

### II. The ledger is the product
Executions and imported broker records are immutable facts. Derived values
— P&L, percentages, R-multiples, analytics, tax figures — are always
recomputed from the facts, never hand-edited into the ledger. Corrections
happen through explicit, reviewable reconciliation (re-import, superseding
entries), never silent edits.

### III. Tax figures are auditable by construction
Every tax figure must be reproducible from three inputs: the fills, the
dated FX rates (Bank of Israel representative rates), and the version of
the tax rules that produced it. Tax rates, thresholds, and rule parameters
are versioned configuration data — never hardcoded constants. Tax exports
are line-by-line detail for human review (the owner and his accountant).
The app computes and documents; it never files.

### IV. Type safety is code quality
No `any` (Biome enforces). Wrong library types get a small typed wrapper.
Names say what something is (`profitLoss`, not `pnl`). Strictest typing
where money and correctness live.

### V. Test-first, always
All production code is built red-green-refactor: failing test first, then
the smallest code that passes. A bug fix starts with a test that reproduces
the bug. Tests are deterministic: no real clock, no machine time zone, no
network. Money-path libraries target 100% branch coverage; floors live in
vitest.config.ts.

### VI. Schema discipline
src/server/db/schema.ts is the handwritten source of truth; drizzle/*.sql is
generated history. A schema change and its generated migration land in the
same commit. Never hand-edit generated SQL beyond journal-conflict
resolution. Migrations that rename, drop, or destructively rewrite data
are [NEEDS-APPROVAL] by definition — the ledger holds the owner's real
trading history.

### VII. Dependency discipline
No new runtime dependency without an ADR in docs/decisions/; the change
that adds it cites the ADR. Dependencies are decisions, not conveniences.

## Amendments
Amendments happen in the open, as commits to this file — visible diffs,
dated, explained in the commit message. Tax-rule versions (principle III)
are configuration data required by the tax engine, independent of this
document's own history.
