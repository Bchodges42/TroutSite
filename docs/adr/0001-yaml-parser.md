# ADR 0001. YAML parser for the content pack + api seed

- **Status:** accepted
- **Date:** 2026-09-02
- **Decider:** ROLE 1

## Context

§4 pins the stack but names no YAML parser; `packages/content` (§7) stores all entities as YAML and
`apps/api`'s `pnpm --filter api seed` must parse that YAML at build/seed time. A parser must be
added as a dependency, and new runtime dependencies require an ADR.

## Decision

Use the [`yaml`](https://www.npmjs.com/package/yaml) package (v2) as the single YAML parser for both
`packages/content` validation/build tooling and the `apps/api` seed path.

## Consequences

- One YAML dependency shared across roles; no parsing dialect drift between content validation and
  seeding.
- `yaml` is maintained, spec-compliant, and pure JS (no native build on Windows).

## Alternatives considered

- `js-yaml` — popular but older maintenance cadence; slightly different multi-document behavior.
- JSON instead of YAML — rejected: §7 mandates YAML for content authoring ergonomics.
- TOML/JSON5 — rejected: not in the pinned plan.
