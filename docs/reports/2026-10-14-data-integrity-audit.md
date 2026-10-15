# Data-integrity audit — 2026-10-14 (complete)

Owner brief: "The #1 problem on the site has been data integrity … the live data hasn't been
accurate." Four read-only audits against the live upstream feeds on 2026-10-14 (TVA/USACE,
TWRA stocking, USGS gauges, pipeline/ops), then fixes on branch
**`claude/data-integrity-20261014`** (cut from `origin/main` 14a92bc). Raw captures and the
scripts that ran the repo's parsers on them: `C:\Users\Benjamin\Projects\trout-audit-captures-20261014\`.
The 2026-10-14 captures are now regression fixtures under `apps/api/fixtures/{TVA,TN,USGS-WATERDATA}`.

Status legend: **Fixed** = on the branch with a regression test from real payloads (reaches
users only after the owner merges to `main`) · **Owner** = needs an owner decision/action ·
**Open** = not yet fixed. Worklist: [`../KNOWN-ISSUES.md`](../KNOWN-ISSUES.md) § Data integrity — 2026-10.

## 0. Site reachability (owner action)

`trout.tntechclimb.com` returns **NXDOMAIN** from public DNS (re-checked 2026-10-14 at session
start: `nslookup trout.tntechclimb.com 1.1.1.1` → non-existent domain), while `tntechclimb.com`
still resolves on Cloudflare. Restore the DNS record / Cloudflare Tunnel public hostname
(`infra/cloudflared/`, `infra/RUNBOOK.md`). **Owner.**

## 1. TVA / USACE dam data

| Sev | Finding | Status |
|---|---|---|
| **P0** | TVA writes `Midnight`/`Noon` in time labels; both parsers accepted only `<n> AM/PM`, so those blocks were silently dropped (Clinch NRST1 3→**0** rows — "no published schedule" while ~8,050 cfs released; SHDT1 6→2; HADT1 5→1; TMFT1 2→0). | **Fixed** `e782c29`: Noon=12:00, Midnight=00:00, end ≤ start rolls to next day ("Midnight - Midnight" = 24 h). Verified NRST1 3→3, SHDT1 6→6, HADT1 5→5, all 9 live payloads raw = parsed. A partial parse now publishes `unavailable` and counts a job error. |
| P1 | Same bug on observed data (Noon row skipped). | **Fixed** `e782c29`. |
| P1 | "Stage" mixed TVA/USACE tailwater **elevation** (827 ft MSL) with USGS gage height (~2 ft). | **Fixed** `e782c29`: elevations no longer stored as `heightFt` (raw kept in the audit payload). Publishing elevation as its own field is an owner/ADR choice. |
| P2 | "Observed discharge" source unlabeled; map drawer printed "USGS tva:HADT1". | **Fixed** `3800393` (agency label per gauge). Fixed per-water preference: **Owner** (DI-O4). |
| P2 | Old schedules render as current if the job stops. | **Fixed** `e782c29`: build withholds schedules retrieved > 3 h ago (status `unavailable`, real `retrievedAt` kept). |
| P2 | Failed `predicted-data` fetch hid valid release blocks. | **Fixed** `e782c29`: status from the release fetch only. |
| P3 | `tva:CEHT1`/`tva:DLHT1` readings nothing reads; observed "Midnight" 00:00 vs 24:00 and Nov 1 DST unverified. | **Open** (DI-26). |
| — | On `main` the PWA has **no** release-schedule UI; `ReleasesPanel`/`releaseTime.ts` exist only on the unpushed polish line, whose `parseBlockTime` needs the same fix before it merges. | **Owner** (DI-O6). |

## 2. TWRA stocking

| Sev | Finding | Status |
|---|---|---|
| P1 | Month windows used the FIRST listed month rolled forward → **23 events dated 2027** on `main` (Dale Hollow TW, listed every month, showed "January 2027" in October). | **Fixed** `ca97c82`: windows stay inside the page's schedule year (current/next listed month, else last). Evidence lane shares it. |
| P1 | Zero-row parse recorded as success. | **Fixed** `ca97c82`: zero rows or a > 50% drop fails the state, keeps stored rows. |
| P1 | Upsert-only storage: postponed rows at old + new dates, deleted rows forever. | **Fixed** `ca97c82`: schedule rows replaced per complete fetch; completed-report rows kept as history. |
| P1 | TWRA's **Locations Report** (74 rows, 70 distinct; Aug 4 – Oct 9) never shown; past schedule rows labelled "Reported completed". | **Fixed** `ca97c82` `97d3f77`: `StockingEvent.status` (`scheduled`/`reported`, contracts 2.5.0, **ADR 0012 proposed → Owner**); UI: "Stocked · TWRA report" only for report rows, "date passed" for past schedule rows. |
| P1 | Wrong-water matches (county ignored): Mill Creek/Hickman, Piney/Rhea, Laurel Creek/Van Buren, Laurel Fork/Campbell. | **Fixed** `97d3f77`: county agreement required; "Mill Creek (Standing Stone State Park)" now reaches `mill-creek-overton`. Content note on laurel-creek-johnson corrected. |
| P1 | Stocking chip showed the browser download time. | **Fixed** `97d3f77`: TWRA fetch time, "TWRA stale" after 2 days. |
| P2 | Two matchers disagree; API alias maps Cane Creek (Hickman/Perry) wrong; evidence job ignores county. | **Open** (DI-24). |
| P2 | "Week of" rows past on the Sunday. | **Fixed** `97d3f77` (Sunday + 5). |
| P2 | One failing grid failed the whole ingest; the two grids' raw captures overwrote each other. | **Fixed** `ca97c82`. |
| P3 | "Caroll" county typo; TWRA publishes no counts. | Typo normalized in the matcher; counts remain absent (UI never invents one). |

## 3. USGS gauges (re-run, completed)

| Sev | Finding | Status |
|---|---|---|
| P1 | The default OGC parser merged every parameter under the newest timestamp: Duck tailwater 03597860 published a **2012** temperature (21.4 °C, DISCONTINUED) as live; 03598000 a 2009 temperature; Harpeth/Franklin 03432350 2014 temp + DO. | **Fixed** `3a31883`: 3 h per-parameter gate (ported T1-6) + OGC long-form qualifiers. |
| P1 | Multi-gauge waters: newest timestamp wins per metric; flow and temperature can come from different sites. Harpeth: Bellevue 69.3 cfs scored "Good" while Franklin (catalog reach) read 10.6. | **Owner** (DI-O4: primary gauge per water). |
| P1 | Below-range flow still "Good": Hiwassee 480 vs 500 → 77; Daddys Creek 26.3 vs 30 → 81; Calfkiller 26 vs 30 → 71 — reason text says "water is low". | **Owner** (DI-O3: scorer policy). |
| P1 | Legacy WaterServices decommissioned 2027-02-22; evidence lane legacy-only, no fallback. | **Open** (DI-20). |
| P2 | Gauges without usable flow (Doe, Nolichucky -999999 "Rat" since 2024; Stones negative; dry N. Chickamauga shown as "No data"); waters without idealFlow score a flat 50. | **Open** (DI-22). |
| P2 | idealFlow ranges vs 3 years of daily means (obed median 33 vs 100–800; powell above range 62% of days; duck-river-tailwater never out of range). | **Open** (DI-21). |
| P2 | Gauge-to-reach mismatches (wolf-river-fentress, little-river, ocoee-river, caney, pigeon). `mill-creek-overton` already fixed on `main` (`gaugeIds: []`). | **Open** (DI-23); T3-50 closed. |
| P3 | Text-ordered timestamps; stale `gauges-tn.geojson`. | **Open** (DI-26). |

Units, sentinels (-999999) and timestamp normalization were verified correct.

## 4. Pipeline / operations (re-run, completed)

| Sev | Finding | Status |
|---|---|---|
| P0 | refresh-data (5 branches) and backup (3) wrote the new status before `trout_maybe_push` compared it → FAIL-SEED/SNAPSHOTS/VERIFY, REFUSED-SKEW/NOSTAMP and backup failures **never paged**. | **Fixed** `84acac3` (infra test fails on the old order). |
| P0 | Stocking ingested only by `deploy.sh` — its age was time-since-deploy. | **Fixed** `84acac3`: refresh-data reads TWRA when the last success is > 20 h old. |
| P1 | /healthz aged only seed/snapshots; ok-with-failed-sources looked healthy; a snapshots-only heal re-stamped hours-old readings. | **Fixed** `e8ab508`: degraded on ok-with-errors, gauges > 6 h, stocking > 48 h. |
| P1 | No check that published values match the sources. | **Fixed** `890eb10`: daily truth check (USGS, TVA, TWRA), pages on mismatch. Verified live end to end: 48 gauges, 13 schedules, 693 events — OK. |
| P2 | Conditions `fetchedAt` is build time; watchdog heal says "(fresh data)"; Conditions chip uses the newest reading across all waters; open tabs never refetch; shops/reports/hatch chips show download time; one bad DB row aborts the build mid-generation; no lock between refresh/watchdog/autoupdate; evidence + NWS pressure/rain jobs unscheduled in production. | **Open** (DI-25). Several have fixes stranded on the polish line (below). |

**Stranded on `claude/continuous-improvement-20261010` (not on `main`; per the pipeline audit):**
`cdb4421` F01/F34 per-metric times (overlaps DI-13 — on merge keep its `metricTimes`),
`2ab6847` F05 scheduled feeds + `EXPECTED_JOBS` (overlaps DI-12/DI-15), `3b8d9a4` F46/F47 alert
order (overlaps DI-11), `45bcac8` F21 atomic publish, `974aede` F23/F24, `bc49274` F22,
`3f6faaa`/`4acd26c`/`f468f26` NWS F48/F38/F37, `9ce5502` F35/F36 (overlaps DI-4), `f59a7fd` F14.

## Verification

`pnpm -r test` green on the branch (contracts 198, content 19, api 281, web 381 + 1 skipped;
`pnpm test:infra` 13). Baseline `main` had one failing web test (`stocking-discovery`, clock-
dependent fixtures aging out of the 90-day window) — fixed by pinning its clock.
