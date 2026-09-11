# Trout — match the hatch & stream conditions, offline

Offline-first, privacy-first web tool for trout anglers: **match the hatch** offline (bug ID key →
fly suggestions), live **USGS stream conditions** with fishability scores, state **stocking
schedules** (TX/OK/AR), and **attributed fly-shop reports**. Free, no accounts, no location
tracking.

Positioning: Fishbrain = community. TroutRoutes = navigation/land. **Trout = the on-the-water
decision tool** that works with no signal and doesn't want your data.

## Status — Phase 0 (Foundation, ROLE 1) ✅

Repo skeleton, frozen contracts (`contracts-v1.0.0`), UI tokens/primitives, api seed path, infra,
CI, and docs are in place. Phases 1–2 (roles 2–6) build on top. See `docs/ASSUMPTIONS.md` for every
decision/deviation made so far.

## Repository layout & ownership (§5 — never edit another role's files)

| Path | Purpose | Owner |
|---|---|---|
| `packages/contracts` | Zod schemas, `ENDPOINTS`, `scoreConditions`, `matchHatch` — **frozen** | ROLE 1 |
| `packages/ui` | Design tokens + base primitives (shell) | ROLE 1 shell; 2/4/5 add |
| `packages/content` | YAML content pack + validate/build scripts | ROLE 4 |
| `apps/web` | React 18 + Vite 5 PWA (Workbox, Dexie, Tailwind) | ROLE 2 |
| `apps/api` | Fastify + better-sqlite3 + scrapers + cron + snapshots | ROLE 3 |
| `apps/admin` | Shop portal SPA (token auth) | ROLE 4 |
| `apps/marketing` | Astro programmatic-SEO site | ROLE 5 |
| `e2e` | Playwright (offline + online flows) | ROLE 5 |
| `infra` | cloudflared, pm2, `deploy.sh`, `backup.sh`, RUNBOOK | ROLE 1 |
| `docs` | ADRs, ASSUMPTIONS, BACKLOG | shared |

## Quickstart (Windows / Git Bash)

```bash
pnpm install            # pnpm 9 + Node >= 20
pnpm -r lint            # ESLint (flat config) across packages
pnpm -r test            # Vitest — contracts runs with an enforced >=90% coverage gate
pnpm -r build           # builds contracts/ui dist + app bundles (api dist, web/admin vite, astro)
pnpm --filter api seed  # migrations + seed from packages/content YAML (succeeds while empty)
pnpm dev                # all dev servers in parallel (web :5173, admin :5174, api :8787, astro :4321)
```

API health: `curl http://127.0.0.1:8787/healthz` → `{"ok":true}`. The SQLite database lives at
`apps/api/data/trout.db` (gitignored).

> Note: run `pnpm -r build` (or `pnpm --filter @trout/contracts build`) before using the api seed
> CLI directly — runtime imports resolve the built `@trout/contracts` dist.

## Contracts (frozen — `packages/contracts`)

Consumed by every role; additively changeable only via ADR + tag bump:

- **Schemas/types:** `Stream`, `GaugeReading`, `ConditionSnapshot`, `ConditionScore`, `StockingEvent`,
  `BugTaxon`, `FlyPattern`, `HatchChart`, `Shop`, `ShopReport`, `BugObservation` (+ `*Schema` Zod
  validators and shared primitives).
- **`ENDPOINTS`** — the frozen endpoint map (GET snapshot routes + the single POST portal route +
  `/healthz`).
- **Pure functions:** `scoreConditions(stream, readings)` → `{ value: 0–100, reasons: string[] }`;
  `matchHatch(observation, charts, taxa)` → `RankedTaxon[]` — deterministic, no AI, run client-side
  so they work offline.

See `packages/contracts/README.md` for the exact export list and semantics.

## Deployment

Laptop + Git Bash + pm2 + cloudflared tunnel. First-time setup, routine deploy
(`bash infra/deploy.sh`), reboot recovery (§12 #10), backups, and hygiene live in
[`infra/RUNBOOK.md`](infra/RUNBOOK.md).

## CI

`.github/workflows/ci.yml` runs on **windows-latest**: install → lint → content-validate → test
(coverage gate) → build. **Remote pending:** no GitHub remote was provided at Phase-0 exit; once
`git remote add origin … && git push -u origin main` happens, Actions runs the same gates.

## Core rules (short form — full text in the plan docs)

1. Offline-first; 2. privacy by architecture (no accounts, no location leaves the device);
3. static-first read path; 4. free base usage (monetization inert in v1); 5. attribution culture
(every fact cites `sources:`); 6. small v1: TX/OK/AR only, no lakes/maps/social.
Out-of-scope ideas go to `docs/BACKLOG.md` — don't build them.
