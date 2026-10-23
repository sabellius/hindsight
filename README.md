# Hindsight

A local-first day trading journal. Log trades and executions, review your
sessions, and analyze performance. Everything lives in a SQLite file on your
machine.

## Why

TraderSync, Tradervue, and Edgewonk are subscription services that host your
trading history on their servers. Hindsight has no account system and nothing
leaves your machine. Back the database up with `pnpm backup` and you own the
whole thing.

It doubles as a portfolio project.

## Features

- **Trade journal**: full CRUD on an executions-based model. Scale in and out;
  P&L, percent return, and risk multiple recompute from the fills.
- **Analytics**: equity curve plus 8 chart types (P&L by ticker, strategy,
  weekday, and time of day) with date range filtering.
- **Sessions**: daily journal with pre-market plan, market condition, mood and
  energy, and a process scorecard.
- **Price charts**: candlestick charts with entry and exit markers, generated
  from the Alpaca Markets API.
- **Risk guardrails**: 1% max risk per trade and 3% max daily loss, shown
  against your account in the UI.
- **IBKR Client Portal**: connection status only for now.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack, RSC) |
| Database | SQLite via better-sqlite3 + Drizzle ORM |
| UI | shadcn/ui (Base UI) + Tailwind CSS v4 |
| Charts | Recharts (analytics) + Lightweight Charts (price) |
| Testing | Vitest + Testing Library, 90% coverage floor |
| Lint | Biome |

## Getting started

```bash
pnpm install
pnpm seed        # optional: sample data (2 accounts, 3 strategies, 15 trades)
pnpm dev
```

The database is created at the project root (`hindsight.db`). No environment
variables are needed unless you want live price charts: put
`ALPACA_API_KEY` and `ALPACA_SECRET_KEY` in `.env.local`.

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Dev server |
| `pnpm build` | Production build |
| `pnpm lint` | Biome check |
| `pnpm typecheck` | TypeScript check |
| `pnpm test` | Vitest run |
| `pnpm test:coverage` | Coverage report (90% per-file thresholds) |
| `pnpm seed` | Seed sample data |
| `pnpm backup` | Backup database to `data/backups/` |

## Testing

Coverage floors (90% per-file) are enforced in CI, which runs lint,
typecheck, and tests on every push and pull request.

## License

[MIT](LICENSE)
