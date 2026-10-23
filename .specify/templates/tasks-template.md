# Tasks: [FEATURE NAME]

**Input**: spec.md + plan.md
**Rule**: every `src/lib` change lands test-first — the failing-test task
sits immediately before its implementation task.

- [ ] T001 [test] Failing test for [X] in [path]
- [ ] T002 Implement [X] in [path]
- [ ] T003 [OWNER] [owner-only action]
- [ ] T004 …

## Order

[T001→T002 chain; note any independent tasks]

## Done

- [ ] All tasks checked
- [ ] Gate green: `pnpm typecheck && pnpm lint && pnpm test`
- [ ] Spec "Done when" verified
