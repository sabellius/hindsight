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
| UI | shadcn/ui + Tailwind CSS v4 |
| Charts | Recharts (analytics) + Lightweight Charts (price charts) |
| Linting | Biome 2.x |
| Package manager | pnpm |
| IBKR Integration | Client Portal Web API (local gateway, REST) |

## Commands

- `pnpm dev` — Start dev server (Turbopack)
- `pnpm build` — Production build
- `pnpm lint` — Biome check
- `pnpm format` — Biome format --write

## Project Structure (target)

```
src/
  app/
    layout.tsx          — Root layout with sidebar
    page.tsx            — Dashboard landing
    trades/
      page.tsx          — Trade list
      new/page.tsx      — Add trade form
      [id]/page.tsx     — Trade detail/edit
    analytics/
      page.tsx          — Charts and metrics
    sessions/
      page.tsx          — Daily session journal
    settings/
      page.tsx          — IBKR connection, preferences
  components/
    ui/                 — shadcn/ui components
    layout/             — Sidebar, header, nav
    trades/             — Trade-specific components
    analytics/          — Chart components
  lib/
    db/
      index.ts          — Drizzle client
      schema.ts         — All table definitions
    ibkr/
      client.ts         — IBKR Client Portal API wrapper
      mapper.ts         — IBKR fields → app schema
    utils.ts
  types/
```

## Database Schema

```sql
trades: id, ticker, side, strategy_id, entry_time, exit_time,
        entry_price, exit_price, quantity, stop_loss, target,
        commission, pnl, pnl_pct, r_multiple, conviction,
        process_grade, notes, ibkr_order_id, created_at

strategies: id, name, description, rules

sessions: id, date, pre_market_plan, market_condition,
          mood, energy, review_notes

trade_screenshots: id, trade_id, type (entry/exit), filepath

tags: id, trade_id, name
```

## Phases

### Phase 0 — Spreadsheet Template (parallel to Phase 1)
Create an xlsx trading journal template with columns matching the DB schema
1:1. Sheets: Trades Log, Strategies Reference, Daily Session Notes. User starts
journaling immediately; data imports into the app later via CSV upload.

- [ ] Create xlsx template in repo at `templates/trading-journal.xlsx`
- [ ] Columns match `trades` table schema exactly for easy import

### Phase 1 — Foundation
- [x] Scaffold Next.js project with biome, pnpm, turbopack
- [ ] Install and configure Drizzle ORM + better-sqlite3
- [ ] Set up shadcn/ui + Tailwind + dark theme
- [ ] Define DB schema in `src/lib/db/schema.ts`
- [ ] Run initial DB migration
- [ ] Build app shell (sidebar nav, dashboard layout, responsive)
- [ ] IBKR Client Portal API integration (connect, fetch trades, map to schema)
- [ ] Backup script (copy SQLite + screenshots to encrypted storage)

### Phase 2 — Trade Journal (CRUD)
- [ ] Trade entry/edit/delete form
- [ ] Fields: ticker, side, entry/exit datetime & price, quantity, stop, target,
      commission, P&L ($, %, R-multiple), strategy tag, conviction grade (A/B/C),
      process quality, notes
- [ ] Trade list view with sort, filter, search
- [ ] Screenshot upload (stored locally, referenced by path)
- [ ] CSV/XLSX import (ingests Phase 0 spreadsheet data)

### Phase 3 — Analytics Dashboard
- [ ] Equity curve (cumulative P&L over time — Recharts)
- [ ] Metric cards: win rate, profit factor, avg winner/loser, R-multiple,
      max drawdown
- [ ] Breakdowns: by strategy, day-of-week, time-of-day, ticker
- [ ] Streak tracker (consecutive wins/losses)
- [ ] Date range picker for all views

### Phase 4 — Review & Reflection
- [ ] Daily session journal: pre-market plan, market conditions, mood/energy
- [ ] Post-trade review prompts: "Followed plan?", "Would I do differently?"
- [ ] Weekly auto-review: aggregated stats + session notes for the week
- [ ] Process quality tagging (separate decision quality from outcome)

### Phase 5 — Polish
- [ ] Open positions tracker (live via IBKR API)
- [ ] Portfolio allocation / sector exposure
- [ ] Export to CSV/PDF
- [ ] PWA manifest (installable in browser, offline-capable)
- [ ] Mobile-responsive layout refinements

## IBKR Client Portal Integration Notes

- IBKR Client Portal Web API runs a local gateway (Java app)
- Gateway URL: `https://localhost:5000` (default)
- Authentication: session-based, requires periodic re-auth
- Key endpoints:
  - GET `/iserver/account/trades` — open trades
  - GET `/iserver/account/orders` — orders
  - Use `/portfolio/{accountId}/positions` for position tracking
- All API calls go through Next.js API routes (server-side) to avoid CORS
  and keep credentials off the client

## Conventions

- No comments in code unless explicitly asked
- Use `src/` directory structure
- Biome for linting and formatting (not ESLint)
- pnpm for package management
- SQLite database stored at project root as `hindsight.db`
- Screenshots stored in `data/screenshots/` at project root
- Both `data/` and `hindsight.db` should be gitignored
