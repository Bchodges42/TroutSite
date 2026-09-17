# Trout — match the hatch & stream conditions, offline

Offline-first, privacy-first web tool for trout anglers: **match the hatch** offline (bug
ID key → fly suggestions), live **USGS/TVA/USACE stream conditions** with fishability
scores, **TWRA stocking schedules**, attributed **fly-shop reports**, regulations, and a
full Tennessee river/lake atlas on a MapLibre map. Free, no accounts, no location
tracking. Live at **trout.tntechclimb.com**.

Positioning: Fishbrain = community. TroutRoutes = navigation/land. **Trout = the
on-the-water decision tool** that works with no signal and doesn't want your data.

## Status

Live in production (self-deploying, self-healing — see `infra/RUNBOOK.md` §9). The
catalog covers ~148 Tennessee waters (rivers, tailwaters, lakes, West-TN winter ponds);
conditions score from USGS + TVA + USACE gauges; hatch charts cover all 12 regions × 12
months; 555 routes are prerendered for SEO. Open items live in
[`docs/KNOWN-ISSUES.md`](docs/KNOWN-ISSUES.md); the doc map is
[`docs/INDEX.md`](docs/INDEX.md).

## Repository layout

| Path | Purpose |
|---|---|
| `packages/contracts` | Zod schemas, `ENDPOINTS`, `scoreConditions`, `matchHatch` — shared truth (additive changes only, via ADR + tag bump) |
| `packages/ui` | Design tokens + base primitives |
| `packages/content` | YAML/JSON content pack (streams, hatch charts, taxa, patterns, shops, regs, fish occurrences) + validate/build scripts |
| `apps/web` | React 18 + Vite 5 PWA (MapLibre, Workbox, Dexie, Tailwind) — the product |
| `apps/api` | Fastify + better-sqlite3: ingest jobs, snapshot builder, the only live routes |
| `apps/admin` | Shop portal SPA (HMAC token auth — see `apps/admin/TOKENS.md`) |
| `apps/marketing` | Astro programmatic-SEO site |
| `e2e` | Playwright (offline flows, privacy audit, portal vs real API, SEO) + Lighthouse |
| `infra` | deploy / watchdog / verify / backup scripts, static-server, pm2 config, RUNBOOK |
| `docs` | ADRs, data-source provenance, KNOWN-ISSUES, INDEX, review prompt |

## Quickstart

```bash
pnpm install                # pnpm 9 + Node >= 20
pnpm -r lint                # ESLint (flat config) across packages
pnpm -r test                # Vitest; contracts enforces a >=90% coverage gate
pnpm -r build               # contracts/ui dists + app bundles
pnpm --filter api seed      # SQLite migrations + seed from the content YAML
pnpm --filter api snapshots # generate apps/web/public/v1 + /content (gitignored artifacts)
pnpm dev                    # web :5173 · admin :5174 · api :8787 · marketing :4321
```

API health: `curl http://127.0.0.1:8787/healthz` → `{"ok":true}`. SQLite DB lives at
`apps/api/data/trout.db` (gitignored), snapshots in `apps/web/public/{v1,content}`
(gitignored, generated). Build `@trout/contracts` first (`pnpm -r build`) — runtime
imports resolve its built dist.

E2E (Playwright boots every server itself from built dists, including a temp API with a
minted portal token):

```bash
pnpm --filter @trout/e2e exec playwright install chromium
pnpm e2e
```

## Architecture invariants

- **Read path is static files.** `/v1/*` JSON snapshots are regenerated hourly by the
  data job; `/content/*` is the bundled content pack, including reviewed static fish
  occurrences. The one dynamic GET is `/v1/streams?state=`; the one write surface is
  `POST /v1/portal/reports` (HMAC shop token). ADRs 0004–0006 record why.
- **Offline layer** = Workbox service worker + Dexie in the browser. Snapshot routes are
  served `no-store` so HTTP caching can never masquerade as live data.
- **Privacy by architecture.** No accounts, no cookies, no analytics unless compiled in
  at build time (`VITE_CF_ANALYTICS_TOKEN`), no third-party requests, no location leaves
  the device. `e2e/web/privacy.spec.ts` enforces this on every shipped route.

## Contracts (`packages/contracts`)

Schemas: `Stream`, `GaugeReading`, `ConditionSnapshot`, `ConditionScore`, `StockingEvent`,
`SpeciesOccurrenceCatalog`, `BugTaxon`, `FlyPattern`, `HatchChart`, `Shop`, `ShopReport`, `BugObservation`. `ENDPOINTS`
is the frozen route map. Pure functions `scoreConditions` and `matchHatch` are
deterministic and run client-side so they work offline. Additive changes only, via ADR +
tag bump — see `packages/contracts/README.md`.

## Deployment & operations

Production is a separate headless Windows laptop (WinSW service `TroutSite`, schtasks
watchdog/refresh/autoupdate, Cloudflare tunnel) that self-deploys `main` hourly and
self-heals; dev machines use the pm2 stack. First-time setup, routine deploy, reboot
recovery, backups, and the self-healing loop: [`infra/RUNBOOK.md`](infra/RUNBOOK.md).
**Never hand-run deploys on the production host** unless the owner asks.

## CI

- `.github/workflows/ci.yml` — install → lint → content-validate → test (coverage gate)
  → build, on `windows-latest` (mirrors the deployment target).
- `.github/workflows/qa.yml` — the Playwright behavioral suite (offline cold start,
  privacy audit, portal, SEO) against fixture builds.

## Core rules

1. Offline-first; 2. privacy by architecture (no accounts, no location leaves the
device); 3. static-first read path; 4. free base usage (monetization inert in v1);
5. attribution culture (every fact cites `sources:`); 6. small v1 scope — Tennessee
only, no social. Out-of-scope ideas go to `docs/BACKLOG.md` — don't build them.

Agent sessions: `AGENTS.md` is binding. Full-review instructions (single session, all
dimensions): `docs/REVIEW-PROMPT.md`.
