# Site-improvement implementation — 2026-09-30 (branch `feat/site-improvement-20260930`)

Implementation of `SITE-IMPROVEMENT-PLAN-2026-09-30.md`, executed as a subagent
fleet on a fresh clone at canon `origin/main @ 14a92bc`. **Not merged to main,
not deployed** — per AGENTS.md, main moves only by the owner. Pushed to GitHub
for review/finish-off.

## Shipped (9 commits, all gates green)

| Commit | Scope |
|---|---|
| `c027602` | Foundation: Dexie v2 additive stores (savedWaters, waterGroups, trips, downloadManifests, photos; logbook v2 optional fields) + `lib/waterOverview.ts` presentation model + ADR 0012/0013 |
| `978883a` | Richer private logbook: editing, photos (compressed, EXIF-stripped), filters/search, honest summaries (blank trips ≠ zero catch), export v2 + v1/v2 import, full backup |
| `4e91ea8` | Forgiving search: reviewed abbreviation map, tiered ranking, restrained typo matching (first-letter anchored), county/type disambiguation, explicit scope widening, never silently selects |
| `0506435` | My Waters: saves + private groups, shared-feed condition cards, retired-id history, offline-first |
| `454f633` | Compare waters: ≤3 waters, URL-shareable, desktop columns / mobile cards, unassessed stays unassessed, no cross-river ranking |
| `b01570e` | Water Overview card on inspector + detail (one composed model, per-metric ages), ReleasesPanel (TVA schedules, DST-correct), routes/nav wiring |
| `a45169e…` (fixup) | Deterministic manifest tie-break |
| wave-B commits | Trips planner (`/trips`, ?waters= handoff, record→logbook), gauge-history charts (web side, hidden until data exists; ADR 0014 = API handoff), corrections workflow (form + receipt status + ADR 0015 = API handoff), `/trips` + `/corrections` routes, "Prepare trip" + "Suggest a correction" entry points |

Gates at final push: **web 545/545** (+170 new tests), tsc clean, `pnpm -r build`
green, size-budget OK. Contracts/api/admin/marketing untouched.

## Deliberate lease discipline (audit-remediation campaign F01–F48)

The remediation ledger's file leases were honored except where integration
required a **minimal additive touch** — flagged here for the remediation
coordinator's merges:

- `App.tsx` (W3-E): 4 route imports + 4 route lines.
- `AppShell.tsx` (W3-C): 3 icon imports, 3 moreLinks entries, nothing else.
- `RiverSearch.tsx` — NOT in the lease table; extended in place (keyboard/ARIA preserved; `fieldwork.test.tsx` untouched, 20/20).
- `RiverDrawer.tsx` + `StreamDetailPage.tsx` — insert-only edits (VIEWS lane diff: +31/0 and +26/0; later +1 releases section, +1 gauge-history section, +1 corrections link — all additive, no restructuring).
- `test/mobile-detail.test.tsx` — 2 ambiguous-text waits re-scoped (the overview card legitimately repeats the water name); no assertions weakened.
- NOT touched: FishabilityCard.tsx, fishability.ts, waterDecision.ts (consumed only), solar.ts, settings.tsx, RiverMapPage.tsx, TennesseeMap.tsx, useRiverMapData.ts, index.css, snapshots.ts, atlasAvailability.ts, contracts/**, apps/api/**, apps/admin/**, apps/marketing/**, infra/**, e2e/**.

## Remaining work (the finish-off list)

1. **Gauge history API** (per ADR 0014): emit `/v1/gauge-history/{gaugeId}.json`
   from `gauge_readings_raw` in `snapshots/build.ts` (W2-A lease), move
   `GaugeHistorySchema` into contracts + `ENDPOINTS.gaugeHistory`. The web
   section self-enables on first 200 — zero further web work.
2. **Corrections API** (per ADR 0015): `POST /v1/corrections` +
   `GET /v1/corrections/status/:code`, receipt hash-only storage, moderation
   queue + review surface, rate limits, retention. Web form/status UI is
   complete and honest about the not-yet-shipped transport. Needs the
   security review the owner flagged (this is the un-deferred security wave).
3. **Offline pack builder**: SW pinning is W1-D lease territory; Dexie
   manifests + readiness are live. "Download" buttons intentionally absent.
4. **Watchlist alerts** — not started; plan gates it on a privacy/ops design
   review (phase 5). Owner dashboard, verified-access records, shop widgets —
   not started (admin/portal/content leases; access records need field-verified
   pilot data).
5. Third Vaul snap point (polish 2) — deliberately not added; plan requires a
   usability review first, and RiverMapPage.tsx is W3-B-leased.
6. Product verification: real-Edge journey checks (IAB cannot render the WebGL
   map) on `?river=`, `/my-waters`, `/compare`, `/trips`, `/corrections`,
   drawer overview, releases panel on a tailwater; both themes + 390px.

## Verification for a reviewer

```
git fetch origin feat/site-improvement-20260930
pnpm install && pnpm -r build && pnpm --filter @trout/web test
```
