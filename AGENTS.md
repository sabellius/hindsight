# Hindsight — Personal Trading Journal

Local-first, privacy-focused day trading journal: analyze trades, visualize
P&L, build a repeatable edge. Personal tool AND portfolio project — code
quality is a feature.

## Gotchas

- shadcn/ui is **Base UI, not Radix**: `render` prop (not `asChild`),
  `delay` (not `delayDuration`)
- Lint/format is **Biome**, not ESLint; LSP is enabled — skip manual
  `pnpm lint` / `pnpm format` unless asked
- Two chart libs: **Recharts** for analytics, **Lightweight Charts** for
  price candles — don't mix
- Package manager is **pnpm**. IBKR integration is a status-only stub;
  all broker calls go through API routes, never the client

## Gate & Commands

Merge gate: `pnpm lint && pnpm typecheck && pnpm test:coverage && pnpm build` —
the pre-push hook and CI run the exact same four commands.
All scripts live in `package.json`. Schema migrations: `pnpm db:generate
--name=<kebab-intent>` — never omit `--name`.

## Area Rules (read before working there)

- `src/server/db/AGENTS.md` — schema truth, migrations, sync-transaction trap
- `src/testing/AGENTS.md` — test harness, DB fixtures, flake rules
- Structure and relationships: ask codegraph (`codegraph
  explore|query|node|context`, or the MCP server in `.pi/mcp.json`) —
  prefer it over file-tree walks

## Tickets & Git (YouTrack `HND`)

- No ticket, no code. One ticket = one branch = one worktree at
  `~/dev/worktrees/HND-<n>-<slug>`, created from `main`; never commit to
  `main` directly
- Ticket format: **Problem → Fix → Example → Done when**, one screen max,
  plain words, real numbers in the Example (see HND-29); Fix states
  direction only — design lives in the spec or the code; if the bug can't
  be shown as a failing test, add a one-line Repro under Problem
- Merge from the main checkout with `git merge --no-ff`, dependency
  order, atomic commits
- Commit trailer `Refs: HND-<n>` on the last line; ticket states move in
  YouTrack manually — commit messages never auto-resolve

## Conventions

- No comments unless explicitly asked; no abbreviations in names
  (`profitLoss`, not `pnl`)
- Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`,
  `refactor:`); brief, specific; no AI markers (no `Co-Authored-By`, no
  "Generated with", no robot emoji); commit per logical unit
- Every change ships with tests; bug fixes start with a reproducing test
- Derived values (`profitLoss`, `riskMultiple`, …) are computed from
  fills — never hand-stored
- Docs change in the same commit as the code they describe; never
  duplicate machine-checkable facts (counts, file lists, schemas) —
  point to the source of truth
