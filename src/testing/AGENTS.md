# Testing Rules

- Per-test fresh in-memory DB: `import { test } from "@/testing/fixtures"`
  — the `db` fixture builds a migrated SQLite per test (isolation by
  disposal). DB tests add `// @vitest-environment node` at the top.
- Test data comes from factories, never bulk seeds.
- No real clock, no machine time zone, no network — deterministic only.
- Coverage floors (90% per-file): `vitest.config.ts`, enforced by CI.
- Test-first for `src/lib`: failing test before implementation.
