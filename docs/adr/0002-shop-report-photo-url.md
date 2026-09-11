# ADR 0002. Additive `photoUrl` on shop reports (contracts-v1.0.1)

- **Status:** accepted
- **Date:** 2026-09-02
- **Decider:** ROLE 6 (integration), on the Role 3 / Role 4 seam

## Context

Role 4's portal composer sends an optional https `photoUrl` with `POST /v1/portal/reports`,
but the frozen `ShopReport` schema (contracts-v1.0.0) has no such field. §6 permits additive
changes with an ADR + tag bump; the alternative was to strip/reject the field at the API.

## Decision

Accept and pass through `photoUrl`:

- `ShopReportSchema` gains optional `photoUrl` (https-only URL) — tagged **contracts-v1.0.1**
  (`@trout/contracts` version 1.0.1). Nothing renamed or removed.
- `apps/api` validates the field (https, ≤ 2048 chars), persists it in the new additive
  `shop_reports.photo_url` column (migration 003), and emits it in
  `v1/reports/recent.json` when present.
- The public feed renders it only alongside the attribution block; absent = no photo.

## Consequences

- The composer's photo feature works end-to-end against the real API.
- Migration 003 must be applied (automatic on next api start/seed).
- Consumers built against contracts-v1.0.0 keep validating: the field is optional.

## Alternatives considered

- Reject the field at the API (`422`) — would disable a shipped Role 4 feature and force a
  composer change for zero privacy/size benefit.
- Accept but strip — dishonest surface: the portal would appear to accept photos that never
  reach the public feed.
