# ADR 0009 — Hydrography identity and deterministic selectable traces

- Status: Accepted
- Date: 2026-09-16
- Owners: Role 1 (contracts), Role 4 (content/atlas)

## Context

The catalog previously identified a water primarily by display name and the atlas
could join same-named reaches through geometry heuristics. That made forks and
county-qualified waters vulnerable to accidental merges, synthetic bridges, and
stale trace metadata.

## Decision

Add the optional `hydroIdentity` field to `StreamSchema`. It contains one or more
eight-digit GNIS identifiers and HUC8 identifiers, plus optional county and
receiving-water qualifiers. Line waters (`river`, `creek`, `tailrace`, `spring`)
must provide it; still-water records may omit it. Values preserve leading zeros
and reject duplicates.

Store selectable line-water trace recipes in
`apps/web/atlas-sources/selectable-water-traces.json`. Recipes contain permanent
identifier seeds and reviewed boundary/name-transition rules, but do not duplicate
the YAML identity. The trace builder reads committed raw NHD graphs, uses directed
endpoint topology (and usable hydroseq/downstream values when present), welds only
ordinary joins within 15 m, and preserves disconnected components as separate
parts. It never creates synthetic connectors, side branches, or cross-country
bridges. Permanent and NHDPlus provenance remain separate, and length, bounds, and
vertex metrics are recomputed after deterministic simplification.

`audit-water-identities.mjs` is part of normal content validation. It verifies
catalog/recipe/atlas coverage, raw-reach ownership and identity agreement,
topology/order, coordinate and simplification invariants, the weld ceiling, and
builder determinism. Repeated raw NHD names are warnings requiring review, not
implicit merge permission.

The contract package advances additively from `contracts-v2.1.0` to
`contracts-v2.2.0`; no existing export is removed.

## Consequences

Identity is explicit and searchable independently of presentation names. Genuine
source gaps remain visible and are audited as gaps. Adding a new selectable line
water now requires both canonical identity data and a deterministic trace recipe.
