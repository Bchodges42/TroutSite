# Senior code audit remediation — F01–F48, September 29–30, 2026

**Every finding F01–F48 from [`2026-09-29-senior-code-audit.md`](2026-09-29-senior-code-audit.md)
now carries a fix on branch `codex/audit-remediation-20260929` (head `e79db6d`,
54+ commits ahead of `main` @ `14a92bc`, ~180 files, +26k/−2.5k).** Work ran in
waves with 4–5 concurrent workers in isolated clones (file-leased), the
coordinator integrating and gating each wave; Wave 4 ran five independent
verification reviewers against the original audit failure scenarios. Nothing was
merged to `main`, nothing was deployed, and no production system was touched.

## How to read this report

- Per-finding fix descriptions live in `docs/KNOWN-ISSUES.md` (the worklist —
  all 48 marked `[x]` with one-line mechanisms and lane attribution).
- Status vocabulary below: **fixed + verified** = the independent Wave 4
  reviewer re-ran the audit's original failure scenario against the integrated
  head and confirmed the new behavior.

## Wave summary

| Wave | Scope | Findings | Result |
|---|---|---|---|
| 1 | urgent integrity + test foundation | F01 F02 F03 F10 F19 F29 F32 F34 F41 F46 F47 | fixed; integrated `00bda5f` |
| 2 | data publication + source integrity | F05 F06 F14 F15 F16 F21 F22 F23 F24 F33 F35 F36 F37 F38 F48 | fixed; integrated `6e47601` |
| 3 (coordinator) | solar/dates/prefs/prerender/a11y basics | F09 F11 F12 F13 F26 F30 F39 | fixed; integrated `5ece1a3` |
| 3 (fleet) | freshness, maps, marketing truth | F04 F07 F08 F17 F18 F20 F25 F27 F28 F31 F40 F42 F43 F44 F45 | fixed; integrated `11b2901` |
| 4 | independent verification (5 reviewers) | all 48 | all verified; 1 residual found + fixed |
| 4 repair | e2e suite + residuals | — | 107/107 green; F45 popup residual fixed @ `e79db6d` |

## Flagship fixes (the ship-stoppers)

- **F01 (P1)** — gauge readings now carry additive per-metric `metricTimes`;
  the Water Data parser drops parameters >3 h stale instead of merging them
  under the newest timestamp; `scoreFishability` freshness keys off
  `metricTimes.tempC`. A working flow sensor can no longer renew a dead
  temperature sensor, end to end through ingestion→SQLite→snapshot→scorer.
- **F02 (P1)** — `POST /v1/portal/reports` publishes ONLY
  `v1/reports/recent.json` (via the same `publishReportFeed` the scheduled
  build uses — byte-identical); acceptance is durable and separate from feed
  publication (201 + `feed.published` truth); optional `Idempotency-Key`
  header replays the stored report (migration 018 partial UNIQUE index); the
  admin client sends a stable per-draft key. Publishing a shop report can no
  longer erase species assessments catalog-wide.

## Verification evidence (Wave 4)

- **Reviewer A (API/data, 13 findings):** all PASS — standalone probes
  importing built dists with the audit's exact inputs (F01 probe, DST mixed
  offsets, whole-tree byte-compare around a report POST, failed-build
  generation atomicity, archival policy, NWS quantitative-value object,
  station coordinates, 4-concurrent fan-out ceiling measured, never-run job
  health).
- **Reviewer B (infra, 5 findings):** all PASS — real scripts in sandboxes
  with stubbed notifiers/pnpm: alert transition matrix (first-failure pages,
  dedupe, failure-after-green re-pages), watchdog one-degradation/no-false-
  recovery, rollback command sequence byte-matches the ordinary deploy and
  never claims success on failed rebuilds, fault-injected renames leave the
  good tree intact, feeds task follows the WinSW/schtasks pattern under the
  deploy-stamp guard.
- **Reviewer C (web/offline/map/a11y, 21 findings):** 20 PASS with real
  Chromium evidence — 320px scrollWidth 320 (audit: 378), storage-throw map
  render, Daybreak contrast 14.3:1/6.1:1 (audit: 1.13/2.17), zoom-button
  elementFromPoint on the button (audit: legend wrapper), explicit
  species=trout override, delayed-response repaint, Solar EOT matching an
  independent NOAA derivation to 0.000 min. **1 FAIL → fixed:** touch tap on a
  gauge popup flash-closed via MapLibre's `closeOnClick` default — overlay
  popups now `closeOnClick:false` with browser before/after evidence and a
  source-level regression pin.
- **Reviewer D (portal/marketing, 9 findings):** all PASS — live proxy probes,
  idempotency over real network (one row, same key), shop-identity draft
  isolation, Astro Container harness score semantics (unassessed never a
  verdict; assessed 0 = Poor; 70/40), zero "Reported completed/reported
  released" strings in built dists, thrice-repeated byte-identical prerender
  with 356 distinct route bodies, 44px footer targets, honest newsletter
  states per HTTP status.
- **Reviewer E (gates/perf):** all gates PASS on the integrated head — build 0
  (install budget 12.48/25 MB), content validate (counts exactly the audit
  baseline: 60/30/34/54/12), units, infra, lint 0 errors, contracts coverage
  97.33/94.73/90.32 (≥ baseline), all geography gates including the repaired
  regional validator (48 features/18 lakes/30 reaches/0 errors), F31 bundle
  evidence (entry 2.09 MB→571 kB; MapLibre lazy 1.13 MB + 487 kB worker; 0
  uncovered SW precache entries).

## Browser suite

Final state: **107/107 Playwright tests pass** (retries=0, workers=2), including
the F25 zoom test restored from its Wave-1 `test.fixme` and the touch-polygon
specs. Three post-merge failures were diagnosed and fixed: fixture pack missing
tn-west hatch charts (F40×F28 interaction — the generator now emits all 12),
theme-swap assertions starved by the 5s web-assertion default (15s budget
matching the product's own load watchdog + a `triggerRepaint()` nudge at the
arming site), and camera-dependent pixel polls sampling a still-settling
camera (stability polling replaces fixed sleeps).

## Validation (final head `e79db6d`)

- `pnpm -r build` ✅ (size + bundle-split gates inside)
- `pnpm validate:content` ✅
- `pnpm -r test` ✅ — contracts 200, content 19, marketing 31, api 324,
  web 466+1 pre-existing skip, admin 33
- `pnpm test:infra` ✅ 18/18
- `pnpm -r lint` ✅ 0 errors
- Full Playwright suite ✅ 107/107 (retries=0)

(Audit baseline was 849 unit tests with 20 failing e2e cases and a red lint
gate.)

## Additive migrations

- `018_report_idempotency_key.sql` — nullable `shop_reports.idempotency_key` +
  partial UNIQUE (shop_id, idempotency_key). Old clients unaffected.
- `019_stream_shop_archival.sql` — nullable `archived_at` on streams/shops;
  removals soft-archive so report/token history stays referenced; snapshot
  selects filter archived rows.

## Operations implications

- New scheduled task on the Windows stack: `trout-refresh-feeds` (daily 06:00,
  SYSTEM) re-enters `refresh-data.sh` with `TROUT_REFRESH_FEEDS=1` to run
  stocking + evidence under the existing deploy-stamp guard; pressure ingestion
  now runs hourly inside the ordinary refresh. Dev pm2 cron keeps its own
  schedule — the stacks stay separate. Install via
  `infra/install-schedules.sh` on the next deploy window (owner action).
- Rollback behavior is stricter: a rollback whose rebuild fails now reports
  `ROLLBACK INCOMPLETE` instead of announcing success.
- Health can now report `degraded` for never-run or overdue expected jobs
  (gauges/pressure/snapshots hourly <24 h; stocking/evidence daily <48 h).
- Seeding removals soft-archive instead of leaving active ghosts; returning a
  YAML reactivates the water.
- Public gauge endpoint: >32-deep concurrent queue returns 503
  (`GaugeNowBusyError`) under pathological fan-out; normal traffic unchanged.

## Known residuals / follow-ups (non-blocking, documented by reviewers)

1. Windows api-test temp-dir cleanup can flake EPERM under full parallel
   suites (environmental; passes in isolation).
2. The F31 route split leaves Rollup's >500 kB warning for the lazy MapPage
   chunk (by design; precached).
3. `z7` hillshade tiles are declared by pipeline intent but never shipped;
   the map now stops requesting them (minzoom follows the real range at the
   raster-source level via F28's work) — an atlas-pipeline follow-up could
   either ship z7 or lower the declared floor.
4. Fishability all-fish coverage only fetches waters whose `targetSpecies`
   includes the focus species — a pre-existing indexing policy, surfaced by
   verification, worth a product look.
5. Marketing's honest unassessed score badge is verified but not exercised by
   today's fixtures (all fixture snapshots are assessed).

## Worker branches (all pushed)

`codex/audit-rem-w1a…w1e`, `w2a…w2e`, `w3a…w3e`, `codex/audit-rem-w3-coord`,
`codex/audit-rem-e2e-fix`, `codex/audit-rem-final-fix` — squashed into the
integration branch by wave; per-finding commit SHAs are in each merge commit's
message and the KNOWN-ISSUES entries.
