# Hindsight — Implementation Plan

## Phase 1 — Foundation

### Step 1.1: Drizzle ORM + SQLite Setup

**Goal:** Database layer working with all tables defined.

**Tasks:**
- Install `drizzle-orm`, `better-sqlite3`, `drizzle-kit`
- Create `src/lib/db/schema.ts` with all table definitions (trades, strategies, sessions, trade_screenshots, tags)
- Create `src/lib/db/index.ts` with Drizzle client singleton
- Configure `drizzle.config.ts` at project root
- Run initial migration to create `hindsight.db`
- Add `hindsight.db` and `data/` to `.gitignore`

**Verify:** `pnpm drizzle-kit push` creates the database file with all tables.

---

### Step 1.2: Dark Theme + Design Tokens

**Goal:** CSS custom properties and base theme matching the design spec.

**Tasks:**
- Set up CSS custom properties in `src/app/globals.css` for all design tokens (colors, spacing, typography, radii)
- Configure Tailwind v4 to use CSS variables via `@theme`
- Set dark mode as default and only theme
- Base body styles: background `#0c0c0c`, foreground `#e5e5e5`, system font stack

**Verify:** Dev server shows dark background with correct colors on a test page.

---

### Step 1.3: App Shell — Collapsible Sidebar + Layout

**Goal:** Root layout with working sidebar navigation.

**Tasks:**
- Install shadcn/ui components needed for shell: `sheet`, `tooltip`, `separator`
- Install `lucide-react` for icons
- Create `src/components/layout/sidebar.tsx` — collapsible sidebar with 5 nav items (Dashboard, Trades, Analytics, Sessions, Settings)
- Create `src/components/layout/app-shell.tsx` — wraps sidebar + main content area
- Update `src/app/layout.tsx` to use AppShell
- Sidebar state (collapsed/expanded) stored in localStorage
- Active nav item highlighted based on current route

**Verify:** All 5 routes render the sidebar. Collapsing works and persists on refresh.

---

### Step 1.4: Dashboard Page (Shell Only)

**Goal:** Dashboard page with placeholder sections matching the balanced split layout.

**Tasks:**
- Create `src/app/page.tsx` (dashboard) with two-column grid layout
- Left column: placeholder metric cards (2x2 grid) + placeholder equity curve
- Right column: placeholder trades table ("No trades yet" empty state)
- Install shadcn `card`, `table`, `badge` components
- Metric cards with correct typography scale from design spec

**Verify:** Dashboard renders with correct layout proportions (~45/55 split) and dark theme.

---

### Step 1.5: Trade List Page

**Goal:** `/trades` page with trade table, sort, and empty state.

**Tasks:**
- Create `src/app/trades/page.tsx`
- Trade table columns: ticker, side, entry price, exit price, quantity, P&L ($), R-multiple, time
- Profit/loss row highlighting (green/red background)
- P&L and R-multiple text in semantic colors
- Empty state: "No trades yet. Add your first trade."
- Sort by column headers (click to toggle asc/desc)
- Server component, reads from SQLite

**Verify:** Trade list renders. Sorting works. Empty state shows when no data.

---

### Step 1.6: Add Trade Form

**Goal:** `/trades/new` page with full trade entry form.

**Tasks:**
- Create `src/app/trades/new/page.tsx`
- Install shadcn `input`, `select`, `textarea`, `label`, `button`, `calendar` components
- Form fields: ticker, side (long only for v1), entry time, exit time, entry price, exit price, quantity, stop loss, target, commission, strategy (dropdown from strategies table), conviction (A/B/C), process grade (A/B/C), notes
- P&L ($, %), R-multiple calculated automatically from inputs
- Form submission inserts into SQLite via server action
- Redirect to trade detail page after save

**Verify:** Fill out form, submit, trade appears in trade list with correct calculated values.

---

### Step 1.7: Trade Detail + Edit Page

**Goal:** `/trades/[id]` page showing full trade detail, editable.

**Tasks:**
- Create `src/app/trades/[id]/page.tsx`
- Layout matching design spec: header → price grid → risk grid → grades → notes → screenshots
- Edit mode: click "Edit" to make fields editable, "Save" to persist
- Screenshot upload area (file input, save to `data/screenshots/`, store path in DB)
- Delete trade with confirmation dialog

**Verify:** View a trade with all fields. Edit and save changes. Delete a trade.

---

### Step 1.8: Analytics Page (Charts)

**Goal:** `/analytics` page with full dashboard of charts.

**Tasks:**
- Install `recharts`
- Create `src/app/analytics/page.tsx`
- Install shadcn `tabs` for date range picker (7D / 30D / All)
- Charts to build:
  1. Summary metric cards (win rate, profit factor, avg winner, avg loser)
  2. Equity curve (area chart, cumulative P&L over time)
  3. Win rate by strategy (horizontal bar chart)
  4. P&L by day of week (vertical bar chart, green/red)
  5. Hourly heatmap (custom grid, trades grouped by hour)
  6. R-multiple distribution (histogram)
  7. Streak tracker (visual dot grid: green/red per trade)
  8. Drawdown chart (area chart, inverted, red)
- All charts use green/red palette, dark background, muted grid lines

**Verify:** Analytics page renders all 8 chart types with sample data. Date range filter works.

---

### Step 1.9: Sessions Page

**Goal:** `/sessions` page with full guided review form per day.

**Tasks:**
- Create `src/app/sessions/page.tsx`
- Date picker at top to select/create session for a given date
- Form fields:
  - Market condition: tag-style toggle (Trending / Choppy / Volatile)
  - Mood: 1-5 rating scale (number boxes)
  - Energy: 1-5 rating scale (number boxes)
  - Daily grade: A-F selector
  - Pre-market plan: textarea
  - Post-market scorecard: yes/no checklist (followed risk, waited for setups, no forced trades, hit daily target)
  - Auto-stats: P&L, win rate, avg R, commission (read-only, computed from day's trades)
  - Review notes: textarea
- Save via server action, upsert by date

**Verify:** Create a session for today. Auto-stats populate from trades taken that day. Edit and save.

---

### Step 1.10: Settings Page

**Goal:** `/settings` page with IBKR connection config and preferences.

**Tasks:**
- Create `src/app/settings/page.tsx`
- IBKR Client Portal section: gateway URL input, test connection button, status indicator
- Preferences section: default strategy, default conviction, timezone display
- Store settings in SQLite (new `settings` table or key-value)

**Verify:** Save settings. Test connection button shows gateway status.

---

### Step 1.11: IBKR Client Portal Integration

**Goal:** Server-side API routes to fetch trades from IBKR gateway.

**Tasks:**
- Create `src/lib/ibkr/client.ts` — HTTP client for IBKR gateway (`https://localhost:5000`)
- Create `src/lib/ibkr/mapper.ts` — map IBKR fields to app schema
- Create API routes:
  - `src/app/api/ibkr/status/route.ts` — check gateway connection
  - `src/app/api/ibkr/trades/route.ts` — fetch today's executed trades
  - `src/app/api/ibkr/positions/route.ts` — fetch open positions
- All calls server-side (avoid CORS, keep credentials off client)
- Import trades into trades table with deduplication (by ibkr_order_id)

**Verify:** With IBKR gateway running, fetch trades and see them appear in the trade list.

---

### Step 1.12: Polish + Backup Script

**Goal:** Final cleanup and backup mechanism.

**Tasks:**
- Backup script (`scripts/backup.sh`): copy `hindsight.db` + `data/screenshots/` to timestamped archive
- Error boundaries on all pages
- Loading states (skeleton cards) for data-fetching pages
- Empty states for all list views
- Run `pnpm lint` and fix all issues
- Run `pnpm build` and verify production build works

**Verify:** Clean lint. Production build succeeds. Backup script creates archive.

---

## Execution Order

```
1.1 DB Setup
1.2 Theme Tokens
1.3 App Shell (sidebar + layout)
1.4 Dashboard (shell)
1.5 Trade List
1.6 Add Trade Form
1.7 Trade Detail + Edit
1.8 Analytics Charts
1.9 Sessions
1.10 Settings
1.11 IBKR Integration
1.12 Polish + Backup
```

Each step builds on the previous. Steps 1.2 and 1.1 can be done in parallel. Steps 1.5-1.7 are the core CRUD loop. Steps 1.8-1.10 are independent pages. Step 1.11 depends on 1.6 being done.
