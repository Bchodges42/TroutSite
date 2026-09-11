# ADR 0006. Static read path: per-prefix mounts + SPA fallback (amends ADR 0004)

- **Status:** accepted
- **Date:** 2026-09-03
- **Decider:** ROLE 6 (integration), found during pm2 deploy verification (§12 #10)

## Context

ADR 0004 mounted `apps/web/public` and `apps/web/dist` as two `@fastify/static`
registrations, both with `prefix: '/'`. That was never exercised: e2e boots the API
with a temp snapshot dir and no dist dir (one mount skipped), and no Phase-1 role ran
the real pm2 ecosystem. The first `pm2 start` of `trout-api` crash-looped:

> `Method 'HEAD' already declared for route '/*' with constraints '{}'`

Two wildcard mounts collide in find-my-way. Production was broken at the seam.

## Decision

Each tree mounts at its own prefix in `apps/api/src/app.ts`:

- `GET /v1/streams` stays live (filtered `v1/streams.json`, `no-store`) — unchanged.
- `<snapshots>/v1` → prefix `/v1`; `<snapshots>/content` → prefix `/content`
  (`no-store`); each registered only when its directory exists (keeps e2e's
  pack-less temp env working).
- `<web-dist>` → prefix `/` (immutable assets, `no-cache` HTML), unchanged.
- New: an SPA fallback (`setNotFoundHandler`, only when the dist exists) serves
  `index.html` for unknown **non-API** paths so client-side routes (react-router)
  deep-link; `/v1/*` and `/content/*` stay 404 JSON (they are API surface).

## Consequences

- `trout-api` boots under pm2 and serves PWA + snapshots + portal routes on :8787
  (verified: `/`, `/conditions` → shell; `/v1/*`, `/content/*` → JSON; bad API
  paths → 404).
- Regression cover in `apps/api/test/app.test.ts` (dual-tree boot, per-URL serving,
  fallback vs API-404, live `/v1/streams` filter).
- No contract change (URLs identical); ADR 0004's one-origin read path stands.
