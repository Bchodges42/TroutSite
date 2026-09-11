# ADR 0004. Read path: Fastify serves the PWA dist + live snapshot files

- **Status:** accepted
- **Date:** 2026-09-02
- **Decider:** ROLE 6 (integration), on the static-serving seam

## Context

cloudflared maps the main domain → `:8787` (Fastify), but Fastify only served the portal
write routes + health. Nothing served `apps/web/dist` (the PWA), the regenerated snapshots,
or the marketing build; the commented ingress entries for admin (:8788) and marketing
(:8789) were unresolved.

## Decision

**One origin serves the whole read path** (PWA + snapshots):

- `GET /v1/streams` is answered **live** by Fastify from the regenerated `v1/streams.json`
  with optional `?state=` filtering — the one GET endpoint that cannot be a plain static
  file. `Cache-Control: no-store`.
- `@fastify/static` mounts `apps/web/public` (the snapshot tree: `/v1/**`, `/content/**`;
  `no-store`, because the service worker + Dexie are the offline layer) and `apps/web/dist`
  (the built PWA; immutable hashed assets, `no-cache` HTML).
- The **shop portal** (`apps/admin/dist`) and the **marketing site**
  (`apps/marketing/dist`) are served by a tiny zero-dependency static server
  (`infra/static-server.mjs`) as separate pm2 processes on :8788/:8789; the cloudflared
  ingress entries for them are completed. The portal build sets `VITE_API_BASE` to the
  main origin; the API allow-lists that origin via `PORTAL_ORIGINS` (`@fastify/cors`) —
  CORS exists only for the portal write surface, never for the read path.

## Consequences

- The PWA never makes a cross-origin request (privacy audit §12 #8 stays clean).
- Cron regenerates snapshots into `apps/web/public` and they are served immediately —
  no web rebuild is needed for fresh conditions (the `dist` copies of `v1/**` made at
  build time are shadowed by the `public` mount).
- `/v1/hatch/**` and `/content/**` ARE precached by the service worker (static between
  content deploys); conditions/stocking/shops/reports are runtime-cached only — so a
  production build must not precache all of `/v1/**` (handled in `apps/web/vite.shared.ts`).
- Cloudflare still caches at the edge per its own rules; `no-store` responses pass through
  uncached, which is correct for conditions but means hatch/content get their offline
  resilience from the service worker precache.

## Alternatives considered

- A separate static-server process for the web app too — rejected: same-origin snapshot
  fetches and the live `/v1/streams` route would then need an extra proxy hop on the main
  domain.
- `@fastify/static` for admin/marketing as extra mounts on :8787 — rejected: hostnames,
  not paths, separate the three apps in the ingress template; one process serving all
  three dists would blur the ownership boundaries the plan fixes.
