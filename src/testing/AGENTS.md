# Testing Rules

- Tests are colocated: `*.test.ts` next to the file under test
- Environment: node by default; component tests opt into jsdom per file
  with a `/** @vitest-environment jsdom */` pragma at the top
- Per-test fresh in-memory DB: `import { test } from "@/testing/fixtures"` —
  the `db` fixture (isolation by disposal)
- Factories: `src/testing/factories/` — one file per entity (fishery, no
  faker); explicit deterministic defaults; new tests build through factories
  and override only what the test varies; existing tests migrate when touched
- No real clock, no machine time zone, no network — deterministic only
- Coverage: money-path modules pinned at 100% branch, general floor 80%
  (`vitest.config.ts` — enforced by the pre-push gate and CI)
- Gate before merge/push: `pnpm lint && pnpm typecheck && pnpm test:coverage && pnpm build`
