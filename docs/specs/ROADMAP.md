# Hindsight — Updated Roadmap (June 2026)

Based on competitive analysis of Edgewonk, TraderSync, and Tradervue.

## Completed

- Phase 1: Foundation (project scaffold, DB, app shell, seed, backup)
- Phase 2: Trade Journal CRUD (entry/edit/delete, executions model, computed metrics)
- Phase 3: Analytics Dashboard (equity curve, 8 chart types, date range filter)
- Phase 4: Sessions (daily journal, process scorecard, daily grade)
- Executions-based trade model (scaling in/out, recomputed flat fields)
- Test suite: 58 tests, 100% branch coverage on covered files, 90% thresholds

## Phase 6 — Strategy & Tag System

The biggest gap today. Strategies exist in the DB but are never assigned. Tags
table exists but has no UI. Without these, analytics shows "Unassigned" for
everything and you can't filter by behavior or setup.

### 6.1 Strategy Assignment in Trade Form

- Add strategy dropdown to `trade-form.tsx` (fetch strategies for active account)
- Add strategy dropdown to trade detail edit mode
- Update `POST /api/trades` to accept `strategyId`
- Update `PATCH /api/trades/:id` to accept `strategyId`
- Update `groupByStrategy()` in analytics to use actual `strategyId` + join
  strategies table for names instead of hardcoded "Unassigned"
- Update seed script: assign strategy IDs to sample trades (already has 3
  strategies, trades already reference them via `strategyId`)

### 6.2 Custom Tags on Trades

- `tags` table already exists: `id, trade_id (FK), name`
- Add tag input to trade detail (inline pill-style tags, type to add, click to remove)
- API endpoints: `POST /api/trades/[id]/tags`, `DELETE /api/trades/[id]/tags/[tagId]`
- Tag autocomplete from existing tags in the account
- Show tags on trade list as pills
- Analytics: P&L breakdown by tag (new chart or table)

### 6.3 Trade Search and Filtering

- Add filter bar to trade list page: ticker search, date range, strategy, tag,
  P&L range (winners/losers/all), side
- Server-side filtering via query params (Drizzle `where` clauses)
- URL-based filters so filter state persists on refresh
- Clear all filters button

### Testing

- `computed.ts`: verify strategy-aware analytics
- `analytics.ts`: test `groupByStrategy` with real strategy names, tag breakdowns
- API route tests: strategy assignment, tag CRUD, search/filter queries
- UI tests: trade form strategy dropdown, tag pills, filter bar

## Phase 7 — Discipline & Behavior Tracking

Edgewonk's differentiator. Makes psychology measurable by linking behavior tags
to P&L outcomes.

### 7.1 Mistake/Behavior Tags

- Extend tags system with a `category` field: `behavior`, `custom`, or `system`
- Predefined behavior tags (user can toggle on/off in settings):
  - Positive: "followed plan", "patient entry", "let winner run"
  - Negative: "chased entry", "FOMO", "premature exit", "revenge trade",
    "ignored stop", "oversized position"
- Per-trade: select which behaviors applied
- Analytics: P&L by behavior tag, showing the cost of each mistake type

### 7.2 Efficiency / Discipline Score

- Per-trade discipline score: did you follow your rules? (binary per rule)
- Rules defined per strategy (stored in `strategies.rules` or new
  `strategy_rules` table)
- Trade form: checklist of strategy rules, check which were followed
- Aggregate discipline % over time (daily, weekly, monthly)
- Show discipline score on session detail and weekly review

### 7.3 Exit Analysis

- After closing a trade, record: did price eventually hit your target? your stop?
  How far did it go in your direction after exit?
- Requires price data post-exit (Alpaca API, same as chart generation)
- Show on trade detail: "Price hit target 2 hours after exit" or "Stop would
  have been hit 15 min later"
- Aggregate: what % of premature exits would have been winners?
- New fields on `trades`: `postExitHigh`, `postExitLow`, `hitTargetAfterExit`,
  `hitStopAfterExit`

### Testing

- `computed.ts`: discipline score calculation
- `analytics.ts`: P&L by behavior tag, exit analysis aggregates
- API tests: behavior tag CRUD, exit analysis data storage
- Integration tests: full trade flow with tags + behaviors

## Phase 8 — Reports & Review Automation

### 8.1 Weekly Auto-Review

- Aggregate weekly stats: P&L, win rate, avg R, commission, trade count
- Top/bottom strategy, best/worst trade
- Discipline score trend vs P&L
- Auto-generate from trades + sessions for the week
- Show alongside session notes for context
- New page: `/analytics/weekly` or section in analytics

### 8.2 Monthly Performance Report

- Same as weekly but monthly scope
- Month-over-month comparison
- Key metric trends (win rate, profit factor, avg R over last 6 months)
- New chart type: monthly metric trend lines

### 8.3 Tiltmeter

- Visual overlay of discipline streaks on equity curve
- Color-code equity curve segments: green = disciplined, red = tilting
- Definition of "tilt": X consecutive rule breaks or Y loss in Z trades
  (configurable in settings)
- Show tilt periods highlighted on the equity curve chart

### Testing

- Analytics functions: weekly/monthly aggregation logic
- Tilt detection algorithm
- Report generation from sample data

## Phase 9 — Import, Export & Integration

### 9.1 CSV Export

- Export filtered trade list to CSV
- Export analytics summary to CSV
- Button on trade list and analytics pages

### 9.2 IBKR Auto-Import

- Poll IBKR Client Portal for fills on schedule or on-demand
- Auto-create executions from fills
- Auto-group fills into trades by ticker + time gap
- Dedup by `ibkr_order_id`
- Match imported trades to existing manual entries

### 9.3 Open Positions Tracker

- Live positions from IBKR API
- Show unrealized P&L alongside closed trade P&L
- Dashboard widget: open positions with current value

### Testing

- CSV export format validation
- IBKR import: fill grouping algorithm, dedup logic
- Mock IBKR gateway responses for integration tests

## Phase 10 — Polish

- Mobile-responsive layout refinements
- PWA manifest (installable, offline-capable)
- Portfolio allocation / sector exposure (if IBKR provides data)
- Trading diary / notebook (log passed-on trades, separate from sessions)
- Strategy CRUD management page (create/edit/delete strategies and their rules)
- Onboarding flow for new users

## Removed / Deprioritized

- ~~Screenshot upload~~ — replaced by Alpaca chart generation
- ~~Phase 0 xlsx template~~ — import will come via IBKR, not manual spreadsheet
- ~~Market replay / backtest~~ — out of scope (that's TraderSync's domain)
- ~~AI insights~~ — premature; can revisit as a rules-based "Edge Finder" later
