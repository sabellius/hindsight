# Roadmap

Ratified 2026-10-23 by the owner. Sequence: import broker truth, make it
shekel-true, make it tax-true, then sharpen the edge. Governed by the
[constitution](../.specify/memory/constitution.md); tickets live in
YouTrack (`HND`).

| # | Feature | Done when | Ticket |
|---|---|---|---|
| 1 | flex-import | a real tax year of Flex exports imports clean; re-import is a no-op | HND-58 |
| 2 | fx-rates | any execution converts to ₪ with its transaction-date Bank of Israel rate, offline | HND-59 |
| 3 | tax-engine | one real year's export survives the accountant's review | HND-60 |
| 4 | analytics-v2 | the weekly review answers "where is my edge leaking" from broker-true data | HND-61 |

2 depends on 1; 3 depends on 2; 4 reads the same ledger and can parallel.
Deferred: algo-lens — parked until the bot trades paper and the tax
classification question is settled with a CPA.

Lane rules: features this size run through spec-kit (`/speckit.specify` →
`/speckit.plan` → `/speckit.tasks`, owner-format templates); small fixes
are Lane-1 — ticket + reproducing test + fix, no ceremony.
