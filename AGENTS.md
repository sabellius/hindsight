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
| Testing | Vitest + @testing-library/react |
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
- `pnpm backup` — Backup DB + screenshots to `data/backups/`
- `pnpm test` — Run Vitest
- `pnpm test:watch` — Run Vitest in watch mode

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
      schema.ts             — All 7 table definitions
      computed.ts           — computeTradeMetrics() helper
      computed.test.ts      — 6 Vitest tests for computed metrics
    ibkr/
      client.ts             — IBKR Client Portal API wrapper (stub)
    analytics.ts            — Data aggregation for all chart types
    auth.ts                 — getActiveAccountId() cookie helper
    utils.ts
scripts/
  seed.ts                   — Seeds 2 accounts, 3 strategies, 15 sample trades
  backup.ts                 — Backs up DB + screenshots, retains last 30
```

## Database Schema

```sql
accounts: id, name, type (live/paper), broker, created_at

trades: id, account_id (FK), ticker, side, strategy_id (FK), entry_time,
        exit_time, entry_price, exit_price, quantity, stop_loss, target,
        commission, profit_loss, profit_loss_percent, risk_multiple,
        conviction, process_grade, notes, ibkr_order_id, created_at

strategies: id, account_id (FK), name, description, rules

sessions: id, account_id (FK), date, pre_market_plan, market_condition,
          mood, energy, daily_grade, followed_risk_rules,
          waited_for_setups, no_forced_trades, hit_daily_target,
          review_notes

trade_screenshots: id, trade_id (FK), type (entry/exit), filepath

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

### Phase 0 — Spreadsheet Template (parallel to Phase 1)
- [ ] Create xlsx template in repo at `templates/trading-journal.xlsx`
- [ ] Columns match `trades` table schema exactly for easy import

### Phase 1 — Foundation
- [x] Scaffold Next.js project with biome, pnpm, turbopack
- [x] Install and configure Drizzle ORM + better-sqlite3
- [x] Set up shadcn/ui + Tailwind + dark theme
- [x] Define DB schema in `src/lib/db/schema.ts` (7 tables with multi-account)
- [x] Run initial DB migration
- [x] Build app shell (collapsible sidebar, account switcher, responsive)
- [x] Dashboard with live DB queries, metrics, equity curve
- [x] Seed script with realistic sample data (15 trades, 3 strategies)
- [x] Backup script (DB + screenshots, 30-day rotation)
- [x] IBKR Client Portal API wrapper (stub — client.ts + status endpoint)

### Phase 2 — Trade Journal (CRUD)
- [x] Trade entry/edit/delete form with computed metrics
- [x] Fields: ticker, side, entry/exit datetime & price, quantity, stop, target,
      commission, P&L ($, %, R-multiple), conviction grade (A/B/C),
      process quality, notes
- [x] Trade list view with client-side sort
- [ ] Screenshot upload (stored locally, referenced by path)
- [ ] CSV/XLSX import (ingests Phase 0 spreadsheet data)
- [ ] Search and filter on trade list

### Phase 3 — Analytics Dashboard
- [x] Equity curve (cumulative P&L over time — Recharts)
- [x] Metric cards: win rate, profit factor, avg winner/loser, R-multiple,
      max drawdown
- [x] Breakdowns: by strategy, day-of-week, time-of-day (hourly heatmap)
- [x] Risk multiple distribution
- [x] Streak tracker (consecutive wins/losses)
- [x] Date range filter (7D / 30D / All)
- [x] Drawdown chart

### Phase 4 — Review & Reflection
- [x] Daily session journal: pre-market plan, market conditions, mood/energy
- [x] Process scorecard: risk rules, waited for setups, no forced trades, hit target
- [x] Daily grade (A-F)
- [x] Session list with daily P&L and scorecard summary
- [x] Session detail with auto-computed daily stats
- [ ] Weekly auto-review: aggregated stats + session notes for the week
- [ ] Post-trade review prompts: "Followed plan?", "Would I do differently?"

### Phase 5 — Polish
- [ ] Open positions tracker (live via IBKR API)
- [ ] Portfolio allocation / sector exposure
- [ ] Export to CSV/PDF
- [ ] PWA manifest (installable in browser, offline-capable)
- [ ] Mobile-responsive layout refinements
- [ ] Strategy lookup in analytics (currently hardcoded "Unassigned")
- [ ] Add `strategy_id` assignment to trade form

## Testing

- **Framework**: Vitest + jsdom + @testing-library/react
- **Config**: `vitest.config.ts` with `@/` path alias
- **Setup**: `vitest.setup.ts` imports jest-dom matchers
- **Current coverage**: `src/lib/db/computed.ts` (6 tests)
- **Run**: `pnpm test` or `pnpm test:watch`

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
- Screenshots stored in `data/screenshots/` at project root
- Backups stored in `data/backups/` at project root
- Both `data/` and `hindsight.db` should be gitignored
- No abbreviations in variable/column names (e.g. `profitLoss` not `pnl`)
- Commit after each logical unit of work — never dump everything in one commit
- LSP is enabled — skip manual `pnpm lint` / `pnpm format` calls unless asked
