# Executions-Based Trade Model

## Problem

The current `trades` table stores a single flat entry/exit per trade. This doesn't support:
- Scaling into a position (multiple entries)
- Partial exits (selling portions at different prices)
- Future IBKR import where broker fills come as individual executions

## Research

**Tradervue** uses an explicit execution model: a "trade" is a group of executions with P&L. Auto-groups on import, manual merge/split to adjust.

**Edgewonk** uses flat fields showing averages computed from individual entries/exits. Scaling popup manages the individual parts under the hood. P/L is the total across all exits.

Both platforms use executions as the source of truth and derive trade-level metrics from them.

## Decision: Uniform Executions Model

Every trade always has executions. No dual-mode logic. Flat fields on `trades` are denormalized cache, always recomputed from executions.

**Why uniform (not mixed):**
- One code path — no `if (hasExecutions)` branching in computed.ts, forms, analytics, chart loader
- Future-proof for IBKR — broker fills ARE executions, import = dump fills
- Edgewonk proved the UX works — flat fields (averages) + scaling popup model
- Migration is trivial — 15 seed trades, no production data

## Schema Changes

### New Table: `executions`

```sql
executions: id, trade_id (FK → trades, cascade delete), side (buy/sell),
            price (real, not null), quantity (integer, not null),
            timestamp (integer, timestamp_ms, not null),
            commission (real, not null, default 0),
            created_at (integer, timestamp_ms, not null)
```

### Existing `trades` Table

Flat fields remain as denormalized cache, recomputed on every write:

- `entryPrice` → weighted average of buy executions
- `exitPrice` → weighted average of sell executions
- `entryTime` → earliest buy execution timestamp
- `exitTime` → latest sell execution timestamp
- `quantity` → total shares from buy executions (or sell, whichever is smaller — they should match for closed trades)
- `commission` → sum of all execution commissions
- `profitLoss`, `profitLossPercent`, `riskMultiple` → computed from the above

No columns are removed. No columns are renamed. The `trades` table is append-only compatible.

## Computed Metrics

Replace `computeTradeMetrics()` with `computeTradeMetricsFromExecutions()`:

```ts
type Execution = {
  side: "buy" | "sell";
  price: number;
  quantity: number;
  commission: number;
  timestamp: number;
};

function computeTradeMetricsFromExecutions(
  executions: Execution[],
  stopLoss: number | null,
) {
  const buys = executions.filter(e => e.side === "buy");
  const sells = executions.filter(e => e.side === "sell");

  const totalBuyQty = buys.reduce((s, e) => s + e.quantity, 0);
  const totalSellQty = sells.reduce((s, e) => s + e.quantity, 0);
  const totalCommission = executions.reduce((s, e) => s + e.commission, 0);

  const entryPrice = weightedAverage(buys);   // qty-weighted avg buy price
  const exitPrice = weightedAverage(sells);    // qty-weighted avg sell price
  const quantity = totalBuyQty;                // or totalSellQty for closed trades
  const entryTime = Math.min(...buys.map(e => e.timestamp));
  const exitTime = Math.max(...sells.map(e => e.timestamp));

  const profitLoss = (exitPrice - entryPrice) * quantity - totalCommission;
  const profitLossPercent = ((exitPrice - entryPrice) / entryPrice) * 100;
  const riskMultiple = stopLoss && stopLoss !== entryPrice
    ? (exitPrice - entryPrice) / (entryPrice - stopLoss)
    : null;

  return {
    entryPrice, exitPrice, quantity, entryTime, exitTime,
    commission: totalCommission,
    profitLoss, profitLossPercent, riskMultiple,
  };
}
```

The existing `computeTradeMetrics()` is kept for backward compat during migration and removed once all trades have executions.

## API Changes

### `POST /api/trades` (create trade)

Current: reads flat fields from form, computes metrics, inserts trade.

New:
1. Read flat fields from form (entry/exit price, qty, times)
2. Insert trade row with flat fields
3. Generate 2 executions: one buy, one sell
4. Recompute and update trade flat fields from executions (ensures consistency from day 1)

This keeps the form unchanged for simple trades.

### `POST /api/trades/:id/executions` (add execution/leg)

New endpoint:
1. Insert execution row (side, price, quantity, timestamp, commission)
2. Recompute all trade flat fields from all executions
3. Update trade row

### `DELETE /api/trades/:id/executions/:eid` (remove execution)

New endpoint:
1. Delete execution row
2. Recompute trade flat fields
3. Update trade row

### `PATCH /api/trades/:id/executions/:eid` (edit execution)

New endpoint:
1. Update execution row
2. Recompute trade flat fields
3. Update trade row

### `PATCH /api/trades/:id` (edit trade metadata)

Unchanged — still updates metadata fields (ticker, strategy, stopLoss, target, conviction, processGrade, notes). No longer accepts flat price/qty fields — those are derived from executions.

If user needs to change entry price, they edit the execution, not the trade.

## UI Changes

### Trade Form (`trade-form.tsx`)

No changes for the initial create form. Simple trade = 2 executions auto-generated.

### Trade Detail (`trade-detail.tsx`)

Add an **"Executions"** section below the field cards showing a table:
| Time | Side | Price | Qty | Commission |
|------|------|-------|-----|------------|
| 16:35 | Buy | $131.20 | 100 | $1.00 |
| 17:15 | Buy | $132.40 | 50 | $1.00 |
| 18:00 | Sell | $135.00 | 100 | $1.00 |
| 18:05 | Sell | $135.80 | 50 | $1.00 |

Add **"Add Execution"** button that opens a small inline form (side, price, qty, time, commission).

Flat field cards (Entry, Exit, Qty) continue to show the averaged/total values as they do today. No visual change for those cards.

### Trade Edit Mode

The edit form no longer shows entryPrice, exitPrice, quantity fields. Those are managed via the executions table. Edit mode only shows: stopLoss, target, commission (total), conviction, processGrade, notes.

### Chart Loader

Currently fetches chart using `entryTime` / `exitTime` from the trade (which are now computed as earliest buy / latest sell). No change needed — the time range naturally covers all executions.

Future enhancement: mark each execution on the chart with buy/sell markers.

## Analytics Impact

**None.** Analytics queries only read from the `trades` table (profitLoss, profitLossPercent, riskMultiple, entryTime, ticker). Those fields continue to exist as denormalized cache. The analytics module doesn't need to know about executions.

## Migration

Migration script transforms existing flat trades:

```sql
-- For each existing trade, create 2 executions
INSERT INTO executions (trade_id, side, price, quantity, timestamp, commission, created_at)
SELECT id, 'buy', entry_price, quantity, entry_time, 0, strftime('%s','now')*1000
FROM trades;

INSERT INTO executions (trade_id, side, price, quantity, timestamp, commission, created_at)
SELECT id, 'sell', exit_price, quantity, exit_time, commission, 0, strftime('%s','now')*1000
FROM trades;
```

Then reassign commission to the sell execution (or split evenly). After migration, recompute all trade flat fields from executions to verify consistency.

## Seed Script Update

Update `scripts/seed.ts` to insert executions alongside trades. Each trade gets a buy + sell execution.

## Testing

- Add tests for `computeTradeMetricsFromExecutions()` covering:
  - Simple buy + sell (same as current behavior)
  - Multiple buys (scale in) + single sell
  - Single buy + multiple sells (partial exits)
  - Multiple buys + multiple sells
  - Commission totaling across executions

## Files Changed

| File | Change |
|------|--------|
| `src/lib/db/schema.ts` | Add `executions` table |
| `src/lib/db/computed.ts` | Add `computeTradeMetricsFromExecutions()` |
| `src/lib/db/computed.test.ts` | Add tests for new function |
| `src/app/api/trades/route.ts` | Generate executions on trade creation |
| `src/app/api/trades/[id]/route.ts` | Remove flat field editing, keep metadata |
| `src/app/api/trades/[id]/executions/route.ts` | New: CRUD for executions |
| `src/components/trades/trade-detail.tsx` | Add executions table + add execution form |
| `src/components/trades/trade-form.tsx` | No change (simple trade path unchanged) |
| `scripts/seed.ts` | Insert executions alongside trades |
| `scripts/migrate-executions.ts` | New: migration script for existing trades |

## Future (Phase 5+)

- **IBKR import**: dump fills as executions, auto-group by ticker + side change + time gap
- **Merge/split trades**: move executions between trades (Tradervue model)
- **Execution markers on chart**: mark each buy/sell on the price chart
- **Open position tracking**: trade with buys but no sells = open position
