# ADR 0003. Shop portal token format: Role 4's expiring `v1.` scheme

- **Status:** accepted
- **Date:** 2026-09-02
- **Decider:** ROLE 6 (integration), on the Role 3 / Role 4 seam

## Context

Two incompatible stateless portal token formats shipped in Phase 1:

- Role 3 (`apps/api`): `t1.<b64url(shopId)>.<b64url(HMAC-SHA256(secret, shopId))>` —
  non-expiring, signature covers only the shopId.
- Role 4 (`apps/admin` + `apps/admin/TOKENS.md`): `v1.<shopId>.<iatMs>.<expMs>.<sig>` —
  expiring (1–366 days), signature covers the full payload, timing-safe verification with a
  documented order (structural → expiry → constant-time HMAC → shop lookup).

`GET /v1/portal/me` and `POST /v1/portal/reports` must accept exactly what the admin
mint-token CLI produces.

## Decision

Adopt **Role 4's expiring `v1.` format** as the single wire format. `apps/admin/TOKENS.md`
is the spec of record; `apps/api/src/portal/tokens.ts` now implements the same format and
verification order (mirrored, not imported — the API does not depend on the admin app).
The operator CLI is `pnpm --filter api token -- --shop=<id> [--days=<1-366>]`.

## Consequences

- Leaked tokens self-expire (default 30 days); revocation = `PORTAL_SECRET` rotation.
- Tokens minted with the old `t1.` scheme are invalid; none existed outside local
  verification (pre-launch), so there is no migration burden.
- Both implementations must stay byte-identical on the payload string — covered by the
  contract tests on each side (`apps/admin/test/contracts.test.ts`,
  `apps/api/test/portal.test.ts`).

## Alternatives considered

- Keep Role 3's non-expiring format — rejected: a leaked shop credential that never expires
  is the worse security posture, and the admin UI + docs already speak the `v1.` format.
- Dual-accept both formats during a transition window — rejected: two verification paths on
  the only write surface, for zero real-world need pre-launch.
