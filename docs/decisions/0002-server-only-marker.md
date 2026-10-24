# ADR-0002: `server-only` marker package

**Status**: ACCEPTED · **Date**: 2026-10-24 · **Deciders**: owner (Saveliy)

## Context

The client/server boundary now has a physical split (`src/lib` pure,
`src/server` IO), but nothing *enforces* it at build time. A client
component importing `@/server/auth` (cookies) or `@/server/ibkr` would
fail cryptically or bundle server code. Constitution VII requires an
ADR for every new runtime dependency.

## Decision

Adopt `server-only` (React first-party, zero runtime code — it only
throws when a bundler resolves it into a client graph) at the top of
`src/server/auth.ts` and `src/server/ibkr/client.ts`.

## Consequences

- Client imports of those modules fail at build time with a clear error.
- `src/server/db/*` stays unmarked for now: `scripts/seed.ts` and
  `scripts/backup.ts` import the singleton under plain `tsx`, where
  `server-only` throws (no `react-server` condition). The marker lands
  there when flex-import reorganizes the scripts' entry conditions.
- Cost: 1 dependency, ~40 bytes, no transitive packages.
