# Spec: flex-import

**Branch**: `HND-58-flex-import` · **Created**: 2026-10-24 · **Status**: Draft

**What**: A CLI command imports a downloaded IBKR Flex Query XML file —
executions with commissions, and cash transactions (dividends, withholding,
interest, deposits/withdrawals, fees) — into the Hindsight ledger, exactly
as the broker reported them.
**Why**: Everything downstream (fx-rates, the tax engine, honest analytics)
needs broker-true data; a tax year cannot be hand-entered.

## Stories

| # | Story | Done when | P |
|---|---|---|---|
| 1 | Import a Flex file's executions | one file imports; the trades list shows trades derived from the fills; the command reports counts (imported / skipped / flagged) | P1 |
| 2 | Re-import is a no-op | same file twice → zero new rows; overlapping file → only new records added | P1 |
| 3 | Cash transactions land as facts | dividend + withholding + deposit in a fixture → signed rows with currency, visible for review | P2 |
| 4 | Fidelity: fractional and multi-currency | 0.3712 shares and a EUR commission stored verbatim — no rounding, currency kept per amount | P3 |
| 5 | Import history is inspectable | each import records a batch with counts; flagged records show their reason and raw fields | P4 |

## Rules

1. Offline: importing never touches the network
2. Ingested numbers are stored bit-for-bit — no rounding at import
3. Unknown or ambiguous records are flagged for review, never guessed
4. Existing manual trades are never modified by an import
5. Every file is atomic: all rows commit or none do
6. The raw file is kept on disk so any import can be replayed
7. Imported fills group into trades only where grouping is unambiguous;
   ungrouped fills are flagged, not dropped
8. Every amount carries its currency from the file; nothing assumes USD

## Decisions I need from you

| # | Question | Options | My rec |
|---|---|---|---|
| D1 | v1 section scope | Trades + Cash Transactions only / also Corporate Actions + Transfers | Trades + Cash only — corporate actions are rare, complex, and tax-engine-relevant later; they'll be flagged if present, deferred as a feature |
| D2 | Where imports run | CLI script only (`pnpm import:flex <file>`) / also a Settings-page upload | CLI only for v1 — upload UI is a separate slice once the engine is proven |
| D3 | Broker account mapping | auto-create missing accounts from the file / fail if account unknown | auto-create — one owner, IBKR account ids are stable; visible in the batch record |

## Done when

- [ ] A real tax year of Flex exports imports cleanly (your files)
- [ ] Re-importing any file is a no-op
- [ ] Counts match IBKR's own figures for one month, sampled
- [ ] Flagged records are reviewable with reasons
- [ ] Gate green; money-path modules at 100% branch

## Assumptions

- Flex exports come as XML from Client Portal (Activity Flex Query,
  Trades + Cash Transactions sections, XML format)
- One IBKR account id in the files; multi-account comes later
- The schema gains currency + fractional-quantity support in this feature
  (migration gates live in the plan)
