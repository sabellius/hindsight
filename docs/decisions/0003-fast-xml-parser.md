# ADR-0003: `fast-xml-parser` for Flex XML parsing

**Status**: ACCEPTED · **Date**: 2026-10-24 · **Deciders**: owner (Saveliy)

## Context

flex-import reads IBKR Flex Query XML exports (spec `specs/flex-import`).
Constitution VII requires an ADR for every new runtime dependency, and the
plan gates this one (G1, approved). The parser is a money-adjacent path:
every imported fill and cash row flows through it, so correctness and
maintenance risk matter more than size.

## Decision

Adopt `fast-xml-parser` ^5.11.2. Evidence: ~47M weekly downloads on npm,
actively maintained, ships its own TypeScript types. Containment: the sole
import site will be `src/server/flex/parser.ts`, behind a typed wrapper —
no other module may import it (later slice pins that in review).

## Cost

8 packages in the install tree, verified with `pnpm why` after install:

| Package | Version | Role |
|---|---|---|
| `fast-xml-parser` | 5.11.2 | itself |
| `@nodable/entities` | 3.1.0 | same-author split |
| `fast-xml-builder` | 1.3.1 | same-author split |
| `is-unsafe` | 2.0.2 | same-author split |
| `path-expression-matcher` | 1.6.2 | same-author split |
| `strnum` | 2.5.1 | same-author split |
| `xml-naming` | 0.3.0 | same-author split |
| `anynum` | 1.0.1 | transitive via `strnum` |

## Rejected alternatives

- **Hand-rolled parser** — XML correctness traps (entity edge cases,
  namespaces, encoding) we would own forever.
- **saxes** — dormant, and its state-machine API means wrapping logic we
  would own.
- **xml2js** — dormant, 2 open CVEs.
- **@xmldom/xmldom** — DOM model is the wrong shape for streaming
  attribute records into typed rows.
