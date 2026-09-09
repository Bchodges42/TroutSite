# SESSION 2 — map verification + cartography (2026-09-08) — base commit 6d0befe (rebased onto ea87fd8)

Base: `origin/main` = `6d0befe`; rebased onto `ea87fd8` (Session 1's integration) before final gates.
Clone: `C:\Users\Benjamin\Projects\trout-s2`. Scope: 7 confirmed current-geometry defects, first-pass
verify-vs-fix, flow-direction arrows, full-state QA view, mode-aware labels, legend final state.
All geometry fixes are generator scripts over NHDPlus HR takes (gitignored `.atlas-src` caches,
retrieved 2026-09-08); region artifacts + topology updated together, then integrate-verified-atlas.

## Verdict table (final)

| # | Item | Verdict | Commit (post-rebase sha) | Notes |
|---|---|---|---|---|
| T1.1 | Collins River duplication | NOT-PRESENT at base (verified) | geo(integrate) | Existed in defect-era `6a44063`; dropped by conformance pass `a954d51`. Canonical == west-middle (sha `bc3a08ba…`), 28 parts, 0 overlap pairs ≥2km/150m. Judged visually: single corridor. |
| T1.2 | Duck River self-crossings | FIXED | geo(west) | Root cause: same 60 NHD comids in BOTH Duck features + out-of-order welds. One 355-reach level-path chain (VAA hydroseq order) split at Columbia/Shelbyville/Normandy Dam pins. lower 99→1 part (241.94→140.15 km), tailwater 27→1 (43.28 km); 0 crossings/dupes. |
| T1.3 | Mill Creek + Cumberland + Obey confluence | FIXED (source overturned the audit) | geo(west) | Feature had unioned TWO different NHD "Mill Creek" level paths (24001400004894 Overton = the stocked water; 24001400012888 a different creek ~20km S). True mouth: 0m ON the Cumberland ~36.4919,-85.5642 (VAA network identity). 1 part / 32.89 km, hole gone. NOTE for content lane: `mill-creek-overton.yaml` gauge 03539778 is actually Clear Creek at Lilly Bridge. |
| T1.4 | Obey River → Dale Hollow Lake | FIXED | geo(west) | `excludePool` had dropped the dam-face reach. Upstream end now 0m from the pool (was 936m); downstream 2m on Cumberland at Celina. |
| T1.5 | Woods Reservoir ↔ Elk ↔ Tims Ford | FIXED (one documented gap) | geo(west), geo(west) elk | VAA walk: Woods sits on Bradley Creek (level path 25000200006220) → new bradley-creek feature (0m through-pool) + catalog YAML; Elk↔Tims Ford dam-face 453m→0m. Elk lower's 1248m "network gap" was a FETCH-ENVELOPE artifact — take widened, now one chain 40.15km across the TN/AL line. Open: ~6km uncataloged NHD Elk arm Bradley-junction→Tims Ford pool (content-lane decision). |
| T1.6 | Tellico River/Lake area creeks | FIXED | geo(east) | tellico-river: one GNIS identity, 165 reaches → 1 chain 60.87km, lower end inside the pool via 55800 artificial paths (was 1.46km short, tiger-linear). citico-creek: 12 fragments → 1 chain 29.2km, mouth 4m to little-tennessee. Creek inventory of bbox+0.2° otherwise clean. |
| T1.7 | Great Falls Lake orphan polygon | FIXED | geo(west) | Orphan part = shattered decimation artifact of NHDPlusID 24001400139760 (matches no real NHD polygon); kept faithful 24001400139538 (2→1 parts, 5.85 km²). |
| T2.1 | Norris fragmentation (G1) | VERIFIED-FIXED | — | 2 parts = exactly the 2 NHD GNIS 01269832 polygons (94.23 + 1.25 km², bbox parity, 0–1m vertex match); lake gate OK 99.7 km² (window 90–100). Judged visually. |
| T2.2 | Caney Fork split (G2) | VERIFIED-FIXED | — | upper ends inside Center Hill (5m), tailwater exits dam face (66m), chain connected end-to-end to the Cumberland. Judged visually. |
| T2.3 | Horse Creek gaps | FIXED | geo(east) | First pass had fused the Greene County creek with an unrelated Washington County same-named creek (too-wide envelope). County-scoped take → 1 chain 17.88km (96% of source), mouth 6m to Nolichucky. |
| T2.4 | Brush Creek sprawl | FIXED | geo(east) | Verified broken TIGER (4 fragments in a 0.7×2.6km strip). NHD true system = 6.75km chain, mouth 2m to French Broad. |
| T2.5 | Little Sequatchie → Sequatchie → Nickajack | VERIFIED-FIXED | — | 0m exact shared vertex (35.08891,-85.57764); sequatchie→nickajack pool-margin 2682m (documented gate, OK). Judged visually. |
| T2.6 | Wolf River ↔ Dale Hollow | FIXED | geo(east) | First pass trimmed at the pool margin. NHD full named Wolf = 1 chain 63.67km (98% of source), downstream end INSIDE dale-hollow-lake via artificial paths. True headwater terminus documented (continuation is different-named tributaries ≥425m away). |
| T3 | Flow-direction arrows on selection | SHIPPED + judged | map(flow), map(qa) | `flowOrientation.json` derived from verified topology edges → dam anchors → lake in/out → 50m confluence graph (never vertex order, never hand-assigned): 54 high + 16 medium confident waters, 35 honest unoriented. Arrows only on selection, per-theme, unknown-safe. docs/flow-orientation.md. |
| T4 | Full-state waterways view + QA mode | SHIPPED + judged | map(qa) | `?all=1` all-waterways toggle (roads-toggle pattern); `?qa=1` internal QA: client-side dangling/fragment/self-x/duplicate audit (361ms cached), red overlay + grouped panel, click-to-fly. |
| T5 | Mode-aware label hierarchy | SHIPPED + judged | map(labels,legend) | Trout mode titles only catalog-trout waters (major statewide; warmwater/unknown stay corridor-only); all-fish adds major waters of any species. Judged: Memphis Wolf untitled in trout mode, titled in all-fish; Tennessee/Mississippi/Reelfoot untitled in trout mode. |
| T6 | Legend final state | SHIPPED + judged | map(labels,legend) | Condition rows kept when assessed readings exist; else fishery-type grouping (Tailwater/Wild trout/Stocked/Other). Prefers Session-1 canonical `fishery` attribute (101/148), derivation only for uncovered waters. Legend judged in both themes (assessed state; the no-assessment state is unit-tested — fixtures carry assessments). |

## Gates (final, after rebase onto ea87fd8)

- validate-atlas PASS (148 features) · west-middle-validate PASS · validate-east-southeast PASS (0/0)
- continuity audit 40 unexpected multi-chunk (baseline 44; duck/tailwater/horse/elk-lower left the list)
- self-x + duplicate detectors: 0 findings on every touched water statewide
- pnpm --filter @trout/web typecheck clean · 234/234 tests (181 baseline + 53 new) · build 10.46MB ≤ 25MB
- fixtures:generate clean (148 streams, schema-validated) · integrate cross-checks catalog/geometry OK
- Visual gate: 38 dev-server captures (headless Chromium), 2 judge passes — 38/38 after Elk fix; both themes

## Notes for next sessions

- `?qa=1` audit is client-side over shipped geometry; its self-x/fragment counts use looser
  thresholds than the build-time detectors — expect more rows than docs/audits/S2-*.
- Candidate new waters from Session 1's capture (Cherokee TW, paint-creek, ~35 more) need
  fetch keys + takes before their geometry exists — listed, not added.
- The legend's fishery-type state shows only when the live feed has zero assessments; on the
  current fixtures it stays in condition-rows state (covered by unit tests instead).
- mill-creek-overton gauge evidence is wrong in the catalog (see T1.3) — content lane.

---

# SESSION 1 — integration + data pipeline (2026-09-08) — base commit 6d0befe

Base: `origin/main` = `6d0befe` (recovery push 2026-09-08). Clone: `C:\Users\Benjamin\Projects\trout-s1`.
Scope: live-host pipeline recovery, hatch content pack, TVA/USACE gauges, catalog attributes, stocking window/sort.

## Result (landed on main + deployed to the laptop pipeline 2026-09-08 ~19:49 — deploy all green)

- `pipe(infra)` — snapshot-sync fallback (`infra/sync-snapshots.sh`, rsync-or-scp + atomic swap +
  public URL verification, `--dry-run`/`--local` test seams), RUNBOOK §8, `docs/SESSION1-HOST-RECOVERY.md`
  (paste-onto-host checklist).
- `pipe(gauges)` — **TVA + USACE readings now drive conditions scoring**: `usace-provider.ts`
  (working endpoint is `water.usace.army.mil/cda/reporting/providers/lrn/timeseries` — rivergages.mvr
  does NOT carry Nashville District; CDA /timeseries still 501), `conditionsBridge.ts` writes
  `tva:{id}`/`usace:{id}` rows into `gauge_readings_raw` (scorer unchanged — it was already
  source-agnostic), NWIS guards skip non-numeric ids, 13 tailwater YAMLs wired, `USACE_MONITORS`
  registry + coverage docs regenerated. Newly assessable waters: clinch, boone-tw, ft-patrick-henry-tw,
  south-holston, obey, parksville-tw (+hiwassee flow); redundancy for watauga/caney/stones/elk/duck/ocoee.
  `usace:CORT1` registered but deliberately NOT wired into cumberland-river (multi-dam mainstem would
  mis-score — matches monitors.ts doctrine).
- `content(catalog)` — canonical `fishery` (wild|stocked|tailwater; 101/147) + `yearRound` (91/147)
  added to StreamSchema + YAML, evidence-driven from a fresh 2026-09-08 TWRA capture (136 sites w/
  month seasonality), USFS Cherokee NF, ArcGIS storymap, norrik (dead site; used as corroboration only).
  Species flips: calderwood/chilhowee/dale-hollow-lake → trout (TWRA stocks them); norris/cherokee/
  center-hill/tims-ford/south-holston lakes → warmwater (trout water is the named tailwater row).
  Owner-decision list in `docs/SPECIES-REVIEW.md` § 2026-09-08. Candidate new waters (Cherokee TW,
  paint-creek, bald/north-river, green-cove-pond + ~35 more) need Session-2 geometry — listed, not added.
- `pipe(hatch)` — root cause of "content pack not found": `pipelineConfig` resolved repo paths from
  `process.cwd()`; pm2 runs cwd=REPO_ROOT so the cron looked at `<two up>/packages/content` (outside
  the repo). Now anchored at the module file (cwd-independent) + `TROUT_CONTENT_DIR` added to pm2
  API_ENV + regression tests from both cwds. Proven end-to-end in a fresh clone: seed → snapshots
  reports `contentPack:true, hatchCharts:144`. NOTE for host: `pm2 reload` does not re-read ecosystem
  env — after pulling, `pm2 delete trout-api trout-cron && pm2 start infra/pm2/ecosystem.config.cjs`.
- `pipe(stocking)` — `v1/stocking/{state}-recent.json`: 3-month rolling window, recency-first
  (newest-first; upcoming scheduled rows stay in-window), `ENDPOINTS.stockingRecent` + web
  snapshotUrls helper. Full-history file unchanged; UI consumption left to Session 3's redesign.
  Verified live against real TWRA data: 170/623 rows in-window.
- `pipe(test)` — web's published-feed stockingMatch test skips honestly on fresh clones
  (public/v1/** is a gitignored deploy artifact).

Gates: typecheck clean · api 140/140 · contracts 97/97 · content 11/11 · web 181/181 ·
content validate/build OK (147 streams) · web build + size budget OK (10.52 MB / 25 MB).

## Still open — host deploy (owner action required)

The live host (`trout.tntechclimb.com`) is NOT reachable from this laptop (no SSH keys/config, no
cloudflared service locally) and has REGRESSED past the findings: `/healthz` → `ok:false`
("conditions feed has not been generated"), `/v1/streams` → 503, everything under `/v1/*` +
`/content/*` → 404. The API process answers; the snapshot trees are GONE (worse than the recorded
"frozen feed" state). Landed on branch `s1-integration` in the shared repo (push to checked-out main is refused; fast-forward it from the shared tree: `git merge --ff-only s1-integration`). Fix path is fully packaged: run `docs/SESSION1-HOST-RECOVERY.md` on the host
(deploy with the new loud-fail gates, restore cron), or from this laptop `infra/sync-snapshots.sh`
(RUNBOOK §8) once `TROUT_SYNC_HOST` exists. Laptop pipeline is healthy (hourly gauges, 33/146
assessed, 623 stocking rows; UA lives in repo-root `.env`).

---

# ROADS lane (B12) — base commit 826e5cb

Base: trout-fieldwork-20260904@826e5cb (branch codex/trout-fieldwork-20260904).
Clone: C:\Users\Benjamin\Projects\trout-roads. Scope: B12 roads / contextual
cartography — TIGER 2024 All Roads → public/atlas/roads*, fetch/build/validate
scripts, docs/roads-sources.md. License gate: PROCEED (public domain), see
docs/roads-sources.md. NOT touched: apps/web/src/**, e2e/**, packages/**
(other lanes own them).

## Status log

- [x] Setup: clone at 826e5cb, snapshots public/v1 + public/content copied,
  `pnpm install` green, workspace packages built, baseline green
  (typecheck OK, 122/122 tests, build + size budget OK, dist 5.21 MB).
- [x] License verdict documented BEFORE build: TIGER 2024 public domain
  (17 U.S.C. § 105); OSM rejected (ODbL share-alike) — docs/roads-sources.md.
- [x] Fetch: 95/95 TIGER 2024 ROADS county zips (105 MB) → .atlas-src/roadshp
  (364,836 features; fetch-roads.mjs mirrors fetch-atlas-sources.mjs).
- [x] Build (build-roads.mjs): TN whole-part clip against tn-boundary + 1 km
  (0 rejections), non-through classes dropped (40,656: alleys/private service
  roads/driveways/parking/walkways), endpoint-exact welding with
  straightest-continuation + anti-double-back corridor guard, per-(MTFCC,name)
  MultiLineString collapse, RDP ladder settled at rung 3 (major 0.0005°,
  mid 0.0016° with S1400 chains ≥ 3200 m, minor 0.0025°).
- [x] Assets: public/atlas/roads-{major,mid,minor}.geojson + roads-manifest.json
  = 11,840 features / 158,048 verts / 4,606,657 bytes (4.39 MiB ≤ 6 MB aim).
- [x] validate-roads.mjs: PASS (geometry, MTFCC-per-LOD whitelist, bounds
  +eps, lon/lat order, manifest-vs-reality, size gate).
- [x] Full gate green: typecheck OK, 122/122 tests, build OK; size-budget OK —
  dist 9.61 MB vs 25 MB gate (roads precached via existing `atlas/*` glob; NO
  size-budget.mjs exclusion needed — decision documented in roads-sources.md).

## Commits (this lane)

- roads(license): TIGER 2024 public-domain verdict (OSM/ODbL rejected),
  fetch tooling, progress base 826e5cb
- roads(build): TIGER ROADS → LOD road atlas (clip/weld/collapse/simplify
  tooling + roads-major/mid/minor.geojson + roads-manifest.json)
- roads(validate): structural gate + docs/roads-sources.md build results and
  Session A integration handoff + progress

## Notes / decisions

- Per-feature property contract is deliberately minimal ({mtfcc, name?}) with
  file-level provenance in roads-manifest.json — rivers-style per-feature
  source/crs/coordinateOrder fields would cost ~90 B × ~300k source features
  (see roads-sources.md "Property conventions"). No per-feature ids.
- The S1400 coverage decision (chains ≥ 3200 m only) is the size ladder's
  settled rung; lower `minChainM` in build-roads.mjs and re-run for more
  coverage (each halving ≈ doubles the mid file). All weld/walk defects found
  during the lane are documented in roads-sources.md "Build method" with
  their measured signatures.
- Long straight roads (E Shelby Dr, delta section-line roads, straight
  interstate reaches) collapse to few-vertex chords within tolerance —
  verified: every >10 km output chord has 3–52 m true deviation vs 56 m tol.
- Scope kept: no apps/web/src/**, no e2e/**, no packages/** touched.

---

# Session B — catalog & content corrections (2026-09-04)

Base commit: 826e5cb (codex/trout-fieldwork-20260904)

## Summary

Six commits on top of the integrated tree; content pack, fixtures, and served
snapshots all regenerated; every gate green (content validate/build/test 11/11,
web typecheck/test 122/122, web build + size budget OK). No files touched under
`apps/web/src`, map styles, or `e2e/`.

## Commit list

| commit | subject |
|---|---|
| `186d41c` | content(tn-west): author honest hatch chart for the winter put-and-take region |
| `ae09f77` | content(duck): point Normandy tailwater gauge below the dam (B13 follow-up) |
| `2874208` | content(species): apply owner decisions 2026-09-04 (B08) |
| `2902c93` | content(docs): bookkeeping — paris alias resolved, duck/elk fragmentation rows done |
| `457d688` | content(fixtures): overlay pack catalog fields so fixtures:generate runs clean |
| `62c5768` | content(fixtures): regenerate demo fixtures from the corrected catalog |

## Task 1 — tn-west region + hatch chart

The premise was partially stale: `regions.ts` already registered `tn-west`
(12 regions) with a `hatchCharts: false` escape hatch, and the stream
regionId-vs-registry cross-check already exists (`scripts/lib.ts:225-226`).
What was missing was the chart. Shipped `hatch/tn/tn-west.yaml` (12 months):
cold months carry the stillwater staples of freshly stocked small lakes
(midges, scuds, sowbugs, leeches, aquatic worms — the same fare the
tn-middle-nashville winter-program chart carries); warm months (Apr–Oct) list
only permanent pond residents at abundance 1, because the stocked fish do not
hold over summer and no trout guidance exists for that season. Provenance in
the file header. With a chart shipped, the `hatchCharts` flag,
`CHARTLESS_REGIONS`, and the validator/test carve-outs were retired — all 12
launch regions now require and ship 12-month coverage (validate prints
"12 regions × 12 months"; the pack-wide regionId check passes).

## Task 2 — Duck River gauge evidence (B13)

Old gauge `03596000` "Duck River below Manchester, TN" is ABOVE Normandy Dam.
Swap target: `03597860` "Duck River at Shelbyville, TN".

Evidence, all from USGS NWIS (waterservices.usgs.gov site/IV/DV services,
queried live 2026-09-04):

| site | name | lat/lon | drainage | position vs dam |
|---|---|---|---|---|
| 03596000 | DUCK RIVER BELOW MANCHESTER, TN | 35.47094 / −86.12164 | 107 mi² | east (UPSTREAM) of the dam |
| 03596460 | NORMANDY LAKE (LK) | 35.46535 / −86.24860 | 195 mi² | the reservoir |
| 03596470 | DUCK RIVER ABOVE NORMANDY, TN | 35.46091 / −86.24527 | 196 mi² | reservoir inlet |
| 03596500 | DUCK RIVER AT NORMANDY, TN | 35.45730 / −86.25694 | 208 mi² | just below dam — but NO current IV/DV data (checked: zero series in last 3 days, any parameter) |
| **03597860** | **DUCK RIVER AT SHELBYVILLE, TN** | **35.48293 / −86.46258** | **425 mi²** | **west (DOWNSTREAM) of the dam; LIVE: 6 IV series in last 3 days + daily-value discharge (provisional ~174 cfs, 2026-08-28..09-03)** |

Dam position: Normandy Lake's west edge (TIGER AREAWATER, per GEO-AUDIT) is at
lon ≈ −86.248, matching USGS lake site 03596460 (−86.24860). 03597860 sits at
lon −86.4626, well west (downstream) of the dam at the tailwater reach's lower
end (GEO lane's own geometry gate lon −86.50..−86.24). The closer below-dam
gauges (03596500/03596510/03596520) are historical — no current flow data — so
03597860 is the nearest REPORTING gauge below the dam. Sharing it with
duck-river-lower is intentional (it bounds that reach's upstream end too).
Stale fixture row 03596000 removed from `packages/content/data/verified-gauges.json`.

## Task 3 — species decisions (owner rulings 2026-09-04)

- harpeth-river → `species: warmwater` + December stocking stated in the note.
- little-pigeon-river → `species: trout`, `stockingProgram: true`, note
  rewritten per owner confirmation (2026-09-04); TWRA sources + gauge kept.
- duck-river-tailwater → note sharpened to year-round stocking (owner
  confirmation 2026-09-04).
- Everything else stays UNSET: 5 thin-evidence waters + 23 waterbody stubs.
- `docs/SPECIES-REVIEW.md` gained "Owner decisions (2026-09-04)" with the
  rulings, the leave-unset list, and a clearly-marked RECOMMENDATIONS-ONLY
  decision menu for the 23 stubs. `BACKEND-ISSUES.md` B08 status updated.

## Task 4 — bookkeeping

- paris-city-park-lake alias confirmed consistent (catalog name = TWRA site
  name; mapped polygon = Green Acres Lake aka Williams Lake; Eiffel Tower Park
  pond is a different secondary water); catalog note now carries the alias;
  STILLWATER-COVERAGE handoff row 1 + checklist row marked resolved.
- waterbody-inventory.json: Duck River and Elk River rows marked `exists-ok`
  with DONE verdicts citing the CONTINUITY-AUDIT before/after table
  (duck-river-tailwater 3→1 chunks; elk-river 9→1 chunks).

## Fixture / snapshot regeneration

- The species-drift generator gap was already fixed by a prior lane (the
  generator overlays pack species/notes). But `fixtures:generate` FAILED at
  base 826e5cb for an unrelated pre-existing reason: 22 atlas extras had no
  `regionId` prop and pickwick-lake's geometry said `waterbodyType: reservoir`
  (not in the contract enum). Fixed by extending the pack overlay to the
  pack-validated identity fields (regionId, waterbodyType, stockingProgram,
  gaugeIds) — commit `457d688`. 128 streams validate cleanly.
- Regenerated: `apps/web/fixtures/data` (committed, `62c5768`) and the
  gitignored served snapshot `apps/web/public/v1/` (streams.json from the pack
  + new `hatch/tn-west/` 12 month files + refreshed hatch dirs). Verified in
  the served snapshot: harpeth `species: warmwater`; little-pigeon
  `species: trout` + `stockingProgram: true`; duck-river-tailwater gauge
  `03597860`; paris note carries the alias; 28 waters remain species-unset
  (5 thin-evidence + 23 stubs).

## Verification (final state)

- `pnpm --filter @trout/content validate` → OK — 103 taxa, 155 patterns,
  **12 regions × 12 months**, 128 streams, 23 shops. Warnings: 87 (all
  documented-ungauged gauge notices).
- `pnpm --filter @trout/content build` → OK (1.00 MB of 20 MB budget).
- `pnpm --filter @trout/content test` → 11/11.
- `pnpm --filter @trout/web typecheck` → clean.
- `pnpm --filter @trout/web test` → 122/122 (14 files).
- `pnpm --filter @trout/web build` → OK + size budget (5.22 MB / 25 MB).
- `fixtures:generate` → clean, all files validated against @trout/contracts.
- Note for the next session: fresh clones must `pnpm --filter @trout/contracts
  build && pnpm --filter @trout/ui build` before the web gates; the baseline
  "failures" on a fresh checkout were only unbuilt workspace deps.

---

# Session A round 2 — roads toggle, terrain fix, Stones reconnection (2026-09-05)

- Roads: Layers-panel toggle, default off (?roads=1). Availability still from
  roads-manifest.json; rendering is the user's choice.
- Terrain (B14 follow-up): the TOPO build skips fully-masked tiles, and the dev
  server's SPA fallback answered those missing .webp requests with index.html —
  MapLibre decode errors, no relief. scripts/fill-topo-tiles.mjs pads the grid
  with 490 transparent tiles (matching the alpha/lossless delivery format) to
  the hillshade request bounds; terrain renders, zero console errors.
- Stones (B13 follow-up): fetched NHD take for the corridor; welded East Fork
  (86 segs -> 1 chain), West Fork (65 -> 1), and the Stones main stem (dam joint
  bridged at ~9 m; degenerate fragment dropped). Forks now meet at 0 m and the
  main stem runs confluence -> Percy Priest Lake -> dam -> Cumberland mouth.
  riverIndex regenerated; validate-atlas + continuity audit PASS.
- Verified by vision: stones-fixed.png (corridor), stones-confluence.png
  (forks joining), terrain-fixed-1440.png (relief + contours).
