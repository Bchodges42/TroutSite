# Site-improvement implementation — 2026-09-30 (branch `feat/site-improvement-20260930`)

Implementation of `SITE-IMPROVEMENT-PLAN-2026-09-30.md`, executed as a subagent
fleet on a fresh clone at canon `origin/main @ 14a92bc`. **Not merged to main,
not deployed** — per AGENTS.md, main moves only by the owner. Pushed to GitHub
for review/finish-off.

## FINAL STATE (tip `d8c393b`)

After the first push (`36aaef2`), the audit-remediation branch
`codex/audit-remediation-20260929` (F01–F48) was **merged into this line**
(`de6c5b3`; one conflict — App.tsx, resolved to the remediation's lazy-route
structure with the new routes re-added), and the three remaining handoff items
were implemented by a second fleet:

| Commit | Scope |
|---|---|
| `b9c55b7` | **Gauge-history API (ADR 0014)** — `/v1/gauge-history/{gaugeId}.json` emitted from `gauge_readings_raw` in `snapshots/build.ts` (dedupe per timestamp, newest `fetched_at` wins per metric, 90-day floor, per-gauge prune); contracts v2.5.0 `GaugeHistorySchema` + `ENDPOINTS.gaugeHistory`; web schema re-pointed — **the charts feature is now live end-to-end** |
| `6f59cd9` | **Corrections service (ADR 0015)** — `POST /v1/corrections` (strict same-origin, 16 KiB cap, per-IP sliding-window limits 5/h+20/d, honeypot silent-discard, duplicate clustering, email never persisted) + `GET /v1/corrections/status/:code` (hash-only receipts, Crockford `XXXXX-XXXXX-XXXXX`) + moderator review surface (separate `CORRECTIONS_MODERATOR_TOKEN`, fail-closed 503, audit trail) + `/corrections/review` page (token per session, never stored). Both env vars unset ⇒ feature 503s and the web stays honest. **Needs the owner's security review before production** |
| `245555e` | **Offline pack builder** — `packBuilder.ts` (water/trip pack plans: catalog, conditions, releases-if-tailrace, hatch, geometry, optional terrain) + `packCache.ts` (Cache-Storage `trout-packs-v1` pinning, per-section verified readiness, quota handling, shared-asset-safe removal) + Download/Verify/Remove UI on Trips, My Waters cards, and a Settings "Downloaded packs" section. Personal data proven untouchable by test |
| `d8c393b` | Integration sweep — remediation-era test-file type repairs (tree is now `tsc --noEmit` clean across contracts/api/web), ComparePage stable memo inputs, bundle-split gate updated for the 5 new routes, lint errors cleared |

Gates at final push: **contracts 206 (+coverage gate) · api 365 · web 673 ·
content 19 · marketing 31 · admin 33**, `pnpm -r lint` 0 errors (remaining
warnings pre-exist on the remediation branch in its own map files),
`pnpm -r build` green incl. size budget + bundle-split gate. One known
load-flake: `infra-alert-transitions` times out only under full-suite parallel
load; 12/12 in isolation (remediation-era behavior, not touched here).

## Remaining (honest)

1. **Corrections security review** (owner) before enabling the env vars in
   production — ADR 0015 is the review artifact. Durable abuse-ledger table
   (cross-restart rate-limit metadata) deliberately deferred.
2. **SW fetch fallback for `trout-packs-v1`** (generateSW → injectManifest
   swap): today pinned JSON serves offline via `fetchSnapshot`'s cache-recovery
   tier and terrain via the existing CacheFirst route; the precise
   implementation note for the SW swap is in the PACKS lane report. Only a
   real-browser airplane-mode restart test can prove the full loop.
3. Corrections purge cron hook: `purgeExpiredCorrections(db, now)` exported,
   not wired into cron (scheduler files are infra ops).
4. Not started (plan-gated): watchlist alerts (privacy/ops design review),
   owner dashboard, verified-access records (needs field-verified pilots),
   shop widgets, third Vaul snap point (usability review).

## Verification for a reviewer

```
git fetch origin feat/site-improvement-20260930
pnpm install && pnpm -r build && pnpm -r test
```
