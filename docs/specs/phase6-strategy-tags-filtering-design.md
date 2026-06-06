# Phase 6 — Strategy & Tag System Design

## Overview

Phase 6 closes the biggest gap in the app: strategies exist in the DB but are never
assigned in the UI, the `tags` table has no UI, and there is no way to search or
filter trades. This phase adds strategy assignment, custom trade tags, and a
full filter bar on the trade list — all server-rendered with client interactivity.

Approach: **Minimal schema**. No new tables or migrations. The existing `strategies`
table, `strategyId` FK on trades, and `tags` table already support everything needed.

## 6.1 — Strategy Assignment

### Trade Form (`components/trades/trade-form.tsx`)

- Add a `strategies` prop: `{ id: number; name: string }[]`
- Add a `<Select name="strategyId">` dropdown with options from the prop
- Default option: "No strategy" (value: empty string, saved as `null`)
- The parent page (`app/trades/new/page.tsx`) fetches strategies for the active
  account via Drizzle and passes them down

### Trade Detail Edit Mode (`components/trades/trade-detail.tsx`)

- Add `strategyId` to the `Trade` type
- Add the same strategy `<Select>` to the edit form
- Pass the strategies list as a prop from `app/trades/[id]/page.tsx`

### Trade List Table (`components/trades/trade-list-table.tsx`)

- Add `strategyName: string | null` to the `Trade` type
- Add a "Strategy" column between "Side" and "Entry", showing strategy name or "—"

### Server Query (`app/trades/page.tsx`)

- Join `strategies` table to get strategy name for each trade:
  ```ts
  db.select({
    ...trades,
    strategyName: strategies.name,
  })
  .from(trades)
  .leftJoin(strategies, eq(trades.strategyId, strategies.id))
  .where(eq(trades.accountId, accountId))
  ```

### API Routes

- `POST /api/trades` (`app/api/trades/route.ts`): Accept `strategyId` from form data.
  Save as `Number(formData.get("strategyId")) || null`
- `PATCH /api/trades/[id]/route.ts`: Accept `strategyId` in the same way

### Analytics (`lib/analytics.ts`)

- Update `groupByStrategy()` input type to include `strategyName: string | null`
  on each trade. Instead of hardcoding "Unassigned", use
  `trade.strategyName ?? "Unassigned"` as the grouping key.
  The function signature changes from `(typeof trades.$inferSelect)[]`
  to an extended type that includes the joined field.
- The `getAnalyticsData()` function needs to join strategies in its query too

### Seed Script

- Verify existing seed data already assigns `strategyId` to sample trades
  (it does — 3 strategies are seeded, trades reference them)

## 6.2 — Custom Tags on Trades

### Tag Input Component (`components/trades/tag-input.tsx`)

New client component:
- Props: `tradeId: number`, `initialTags: { id: number; name: string }[]`,
  `suggestions: string[]`
- Renders existing tags as removable pills (click X to remove)
- Text input with autocomplete dropdown from `suggestions`
- Enter key or comma adds the tag
- Calls API on add/remove, optimistic UI update

### Trade Detail Page (`components/trades/trade-detail.tsx`)

- Add `tags: { id: number; name: string }[]` to the `Trade` type or as a separate prop
- Render `<TagInput>` below the notes section in view mode
- Server page fetches tags for the trade: `db.select().from(tags).where(eq(tags.tradeId, tradeId))`

### Trade List Table

- Add `tags: string[]` to the `Trade` type
- Show tags as small pills in a dedicated "Tags" column after "Date"
- Keep compact — just the tag names as small pills, no click actions on the list page

### API Routes

New endpoints:

- `POST /api/trades/[id]/tags` — accepts `{ name: string }`, inserts into `tags` table,
  returns `{ id, name }`
- `DELETE /api/trades/[id]/tags/[tagId]` — deletes the tag row (cascade already handled
  by FK but explicit delete for single tag)
- `GET /api/tags/suggest?accountId=X` — returns `{ suggestions: string[] }` of distinct
  tag names used in the account

### Analytics

New `groupByTag()` function in `lib/analytics.ts`:
- Input: trade list with tags joined (each trade has a `tags: string[]`)
- Output: `{ name: string; totalPnL: number; winRate: number; count: number }[]`
- Aggregates P&L and win rate per tag across all trades that have that tag
- Display as a new card in analytics page — simple table with columns:
  Tag, Trades, Win Rate, P&L

## 6.3 — Trade Search & Filtering

### Filter Bar (`components/trades/trade-filter-bar.tsx`)

New client component at top of `/trades` page:
- **Ticker**: text input, filters by case-insensitive partial match
- **Date range**: from/to date inputs (`type="date"`)
- **Strategy**: dropdown populated from strategies for account
- **Tag**: dropdown populated from account's distinct tags
- **Result**: toggle group — All / Winners / Losers
- **Clear all**: button that resets all filters

All filter state is stored in URL search params. Changing any filter updates the URL
via `router.push()` with the new params. The server component reads params and filters.

### URL Params Schema

```
?ticker=NVDA
&from=2026-01-01
&to=2026-06-01
&strategy=2
&tag=breakout
&result=winners
&sort=entryTime
&dir=desc
```

All params optional. Missing params = no filter for that dimension.

### Server-Side Filtering (`app/trades/page.tsx`)

The server query dynamically builds `where` conditions:

```ts
const conditions = [eq(trades.accountId, accountId)];

if (ticker) conditions.push(like(trades.ticker, `%${ticker}%`));
if (from) conditions.push(gte(trades.entryTime, new Date(from).getTime()));
if (to) conditions.push(lte(trades.entryTime, new Date(to).getTime()));
if (strategyId) conditions.push(eq(trades.strategyId, strategyId));
if (result === "winners") conditions.push(gt(trades.profitLoss, 0));
if (result === "losers") conditions.push(lt(trades.profitLoss, 0));

// Tag filter: subquery
if (tag) {
  conditions.push(
    inArray(trades.id, db.select({ id: tags.tradeId }).from(tags).where(eq(tags.name, tag)))
  );
}
```

### Error Handling

- Invalid param values are silently ignored (fallback to unfiltered)
- Empty results show a "No trades match your filters" message with a clear button
- XSS-safe: all values go through Drizzle parameterized queries, never raw SQL

## Testing

### `lib/analytics.ts`

- Test `groupByStrategy()` with trades that have real strategy names
- Test `groupByTag()` with tagged and untagged trades
- Verify "Unassigned" group for trades without strategy

### API Routes

- Strategy assignment: POST trade with strategyId, verify saved
- Strategy update: PATCH trade with new strategyId, verify updated
- Tag CRUD: POST tag, verify created; DELETE tag, verify removed
- Tag suggestions: verify returns distinct names for account

### UI Components

- Trade form: strategy dropdown renders strategies, sends strategyId
- Tag input: adds/removes tags, shows autocomplete suggestions
- Filter bar: updates URL params on change, clear button resets all
- Trade list: shows strategy name, tag pills

## File Changes Summary

**Modified files:**
- `src/app/trades/new/page.tsx` — fetch strategies, pass to form
- `src/app/trades/[id]/page.tsx` — fetch strategies + tags, pass to detail
- `src/app/trades/page.tsx` — server-side filtering with URL params, join strategies + tags
- `src/app/api/trades/route.ts` — accept strategyId
- `src/app/api/trades/[id]/route.ts` — accept strategyId
- `src/components/trades/trade-form.tsx` — add strategy dropdown
- `src/components/trades/trade-detail.tsx` — add strategy dropdown to edit, tag input to view
- `src/components/trades/trade-list-table.tsx` — add strategy column, tag pills
- `src/lib/analytics.ts` — update groupByStrategy, add groupByTag
- `src/app/analytics/page.tsx` — add tag breakdown card
- `scripts/seed.ts` — verify strategy assignments

**New files:**
- `src/components/trades/tag-input.tsx` — tag pill input with autocomplete
- `src/components/trades/trade-filter-bar.tsx` — filter bar with URL-driven state
- `src/app/api/trades/[id]/tags/route.ts` — POST (add tag)
- `src/app/api/trades/[id]/tags/[tagId]/route.ts` — DELETE (remove tag)
- `src/app/api/tags/suggest/route.ts` — GET (autocomplete suggestions)
- `src/lib/analytics.test.ts` — tests for groupByStrategy and groupByTag
