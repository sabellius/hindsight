# Hindsight — Personal Trading Journal

A local-first, privacy-focused day trading journal app for analyzing trades,
visualizing P&L, and building a repeatable edge. Built with Next.js 16, SQLite,
and shadcn/ui.

## Context

- **Owner**: Saveliy Shiryaev — full-stack developer, Israeli citizen
- **Broker**: IBKR (non-US entity, PDT rule does not apply)
- **Capital**: $27,000
- **Position type**: Long only (cash account, no short selling)
- **Risk rules**: 1% max risk per trade ($270), 3% max daily loss ($810),
  $5–$100 stock price range, factor risk only
- **Trading hours (IST)**: US market opens 4:30 PM, closes 11:00 PM Israel time.
  Peak window: first 2 hours (4:30–6:30 PM)
- **This is a personal tool AND a portfolio project**

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript, Turbopack) |
| ORM | Drizzle ORM |
| Database | SQLite (via better-sqlite3) |
| UI | shadcn/ui (Base UI, not Radix) + Tailwind CSS v4 |
| Charts | Recharts (analytics) + Lightweight Charts (price charts) |
| Testing | Vitest + @testing-library/react + @vitest/coverage-v8 |
| Linting | Biome 2.x |
| Package manager | pnpm |
| IBKR Integration | Client Portal Web API (local gateway, REST) |
| Fonts | Inter (sans) + JetBrains Mono (monospace) |

## Commands

- `pnpm dev` — Start dev server (Turbopack)
- `pnpm build` — Production build
- `pnpm lint` — Biome check
- `pnpm format` — Biome format --write
- `pnpm seed` — Seed DB with sample data (15 trades, 3 strategies, 2 accounts)
- `pnpm backup` — Backup DB to `data/backups/`
- `pnpm test` — Run Vitest
- `pnpm test:watch` — Run Vitest in watch mode
- `pnpm test:coverage` — Run Vitest with v8 coverage report

## Project Structure (current)

```
src/
  app/
    layout.tsx              — Root layout, fetches accounts, passes to AppShell
    page.tsx                — Dashboard with live DB queries + equity curve
    trades/
      page.tsx              — Trade list (sortable)
      new/page.tsx          — Add trade form
      [id]/page.tsx         — Trade detail/edit/delete
    analytics/
      page.tsx              — 8 chart types + date range filter
    sessions/
      page.tsx              — Session list with daily P&L + scorecard
      new/page.tsx          — New session form
      [id]/page.tsx         — Session detail with auto-stats + edit
    settings/
      page.tsx              — Accounts, IBKR status, risk params
    api/
      trades/route.ts       — POST new trade
      trades/[id]/route.ts  — PATCH/DELETE trade
      sessions/route.ts     — POST new session
      sessions/[id]/route.ts — PATCH/DELETE session
      accounts/switch/route.ts — POST set active account cookie
      ibkr/status/route.ts  — GET IBKR connection status
  components/
    ui/                     — shadcn/ui components (Base UI based)
    layout/
      app-shell.tsx         — Client wrapper: sidebar + main content
      sidebar.tsx           — Collapsible sidebar with nav + account switcher
      account-switcher.tsx  — Client component dropdown for switching accounts
    trades/
      trade-list-table.tsx  — Client component, sortable trade table
      trade-detail.tsx      — Client component, view/edit/delete with grades
      trade-form.tsx        — Client component, trade entry form
      today-trades-table.tsx — Client component, dashboard trade rows with nav
    sessions/
      session-form.tsx      — Client component, guided session review form
    analytics/
      analytics-charts.tsx  — Client component, 8 Recharts charts
      equity-curve-chart.tsx — Client component, reusable equity curve
  lib/
    db/
      index.ts              — Drizzle client singleton
      schema.ts             — All 8 table definitions (incl. executions)
      computed.ts           — computeTradeMetrics() + computeTradeMetricsFromExecutions()
      computed.test.ts      — 17 Vitest tests for computed metrics
    ibkr/
      client.ts             — IBKR Client Portal API wrapper (stub)
    analytics.ts            — Data aggregation for all chart types
    auth.ts                 — getActiveAccountId() cookie helper
    constants.ts            — Alpaca/Yahoo API URLs and user agent
    time.ts                 — UTC timestamp conversion helpers
    utils.ts
scripts/
  seed.ts                   — Seeds 2 accounts, 3 strategies, 15 trades + 30 executions
```

## Database Schema

```sql
accounts: id, name, type (live/paper), broker, created_at

trades: id, account_id (FK), ticker, side, strategy_id (FK), entry_time,
        exit_time, entry_price, exit_price, quantity, stop_loss, target,
        commission, profit_loss, profit_loss_percent, risk_multiple,
        conviction, process_grade, notes, ibkr_order_id, created_at

executions: id, trade_id (FK, cascade delete), side (buy/sell), price,
            quantity, timestamp, commission, created_at

strategies: id, account_id (FK), name, description, rules

sessions: id, account_id (FK), date, pre_market_plan, market_condition,
          mood, energy, daily_grade, followed_risk_rules,
          waited_for_setups, no_forced_trades, hit_daily_target,
          review_notes

tags: id, trade_id (FK), name

settings: key, value
```

## Architecture Notes

- **Server Components by default** — pages fetch data via Drizzle, pass serializable primitives to client components
- **Client components only for interactivity** — `onClick`, `useRouter`, state management
- **Minimize RSC boundary serialization** — only pass fields the client needs
- **Account selection via cookie** — `hindsight-account-id` cookie, read server-side by `getActiveAccountId()`
- **Derived fields computed in app layer** — `profitLoss`, `profitLossPercent`, `riskMultiple` computed by `computeTradeMetrics()`, not DB generated columns
- **shadcn/ui uses Base UI** — `@base-ui/react`, not Radix. Different API (`render` prop instead of `asChild`, `delay` instead of `delayDuration`)
- **Timestamps are milliseconds** — `entry_time` / `exit_time` stored as ms Unix timestamps (Date.getTime()), Drizzle mode is `timestamp_ms`

## Phases

See `docs/specs/ROADMAP.md` for the full prioritized roadmap with competitive analysis.

### Completed

- [x] Phase 1 — Foundation (scaffold, DB, app shell, seed, backup, IBKR stub)
- [x] Phase 2 — Trade Journal CRUD (entry/edit/delete, executions model, computed metrics)
- [x] Phase 3 — Analytics Dashboard (equity curve, 8 chart types, date range filter)
- [x] Phase 4 — Sessions (daily journal, process scorecard, daily grade)
- [x] Executions-based trade model (scaling in/out, recomputed flat fields)
- [x] Test suite (58 tests, 100% branch coverage, 90% per-file thresholds)

### Phase 6 — Strategy & Tag System

- [ ] Strategy assignment in trade form + analytics lookup (replace "Unassigned")
- [ ] Custom tags on trades with P&L breakdown by tag
- [ ] Trade search and filtering (ticker, date, strategy, tag, P&L range)

### Phase 7 — Discipline & Behavior Tracking

- [ ] Mistake/behavior tags per trade with P&L impact analysis
- [ ] Efficiency / discipline score (per-trade rule adherence)
- [ ] Exit analysis (did price hit target/stop after exit?)

### Phase 8 — Reports & Review Automation

- [ ] Weekly auto-review (aggregated stats + session notes)
- [ ] Monthly performance report (month-over-month trends)
- [ ] Tiltmeter (discipline streaks overlaid on equity curve)

### Phase 9 — Import, Export & Integration

- [ ] CSV export
- [ ] IBKR auto-import (fill grouping, dedup)
- [ ] Open positions tracker (live via IBKR API)

### Phase 10 — Polish

- [ ] Mobile-responsive layout refinements
- [ ] PWA manifest
- [ ] Strategy CRUD management page
- [ ] Trading diary / notebook (passed-on trades)
- [ ] Onboarding flow

## Testing

- **Framework**: Vitest + jsdom + @testing-library/react + @testing-library/user-event
- **Coverage provider**: @vitest/coverage-v8
- **Config**: `vitest.config.ts` with `@/` path alias, 90% per-file thresholds
- **Setup**: `vitest.setup.ts` imports jest-dom matchers
- **Current coverage**: 58 tests, 100% branch coverage across `computed.ts`, `analytics.ts`, `time.ts`, `utils.ts`
- **Commands**: `pnpm test` | `pnpm test:watch` | `pnpm test:coverage`
- **Rule**: Every new function, API route, and UI component must have tests before merging. Coverage thresholds must pass (`pnpm test:coverage`).

## IBKR Client Portal Integration Notes

- IBKR Client Portal Web API runs a local gateway (Java app)
- Gateway URL: `https://localhost:5000` (default)
- Authentication: session-based, requires periodic re-auth
- Key endpoints:
  - GET `/iserver/auth/status` — auth status
  - GET `/iserver/account/trades` — open trades
  - GET `/iserver/account/orders` — orders
  - GET `/portfolio/{accountId}/positions` — position tracking
- All API calls go through Next.js API routes (server-side) to avoid CORS
  and keep credentials off the client
- **Current status**: stub only — `src/lib/ibkr/client.ts` has wrapper functions,
  `/api/ibkr/status` checks connection. Not yet integrated with trade sync.

## Conventions

- No comments in code unless explicitly asked
- Use `src/` directory structure
- Biome for linting and formatting (not ESLint)
- pnpm for package management
- SQLite database stored at project root as `hindsight.db`
- Both `data/` and `hindsight.db` should be gitignored
- No abbreviations in variable/column names (e.g. `profitLoss` not `pnl`)
- Commit after each logical unit of work — never dump everything in one commit
- LSP is enabled — skip manual `pnpm lint` / `pnpm format` calls unless asked
