# Accuracy campaign — implementation plan (2026-09-13)

**This document is the implementing model's entire brief.** It was synthesized from three
audit reports (branches `campaign-a`, `campaign-b`, `campaign-c` — files
`docs/reports/2026-09-13-audit-{a-ground-truth,b-water-sources,c-species-science}.md`,
all audited at base `b44b4fe`). Every load-bearing fact below was verified by those
sessions with `path:line` evidence or timestamped live probes; the reports remain in-tree
(E0 below) for deeper evidence. Work phase by phase in order; each phase ends green,
committed, and pushed.

## 0. Opening directive

- Trout is the offline-first, privacy-first Tennessee fishing-conditions PWA at
  trout.tntechclimb.com. Canonical repo: `git@github.com:Bchodges42/TroutSite.git`.
- Read and obey `AGENTS.md` (session/branch/push/collision/production rules) and
  `docs/EXECUTION-PLAN.md` §1–2 (file-ownership split A/B/C, push cadence, integration
  rules). Fresh clone, branch off fetched `origin/main` (verify the tip with
  `git ls-remote origin main` — it has moved since `b44b4fe`), `git config user.name
  "Bhodges42"`, push after every task group with checks green (`pnpm -r test &&
  pnpm -r build` minimum; branch CI green before the next group).
- Never merge to `main`, never deploy, never touch the production host or
  trout.tntechclimb.com, never read/quote secrets (`backups/push-url.txt`). Stop and
  report unattributed changes (AGENTS.md rule 6).
- If you spawn subagents, run them on `glm-5.3-flash` (or the cheapest available), never
  on the parent model; verify every subagent lead yourself before it enters code or YAML.
- **Architecture invariants you must not break:** read path is static snapshots
  (`/v1/*`, `/content/*`, rebuilt hourly by the `gauges` job); the browser makes zero
  third-party requests (all provider fetches are server-side in `apps/api`);
  deterministic client-side scoring; additive contracts changes only via ADR + tag bump
  (`packages/contracts/README.md`); every authored fact cites a source; unknown stays
  visibly unknown — never guessed, never fabricated.
- Owner policy (DECIDED 2026-09-12, `docs/KNOWN-ISSUES.md`): per-species fishability
  (warmwater first-class); site-wide species mode default Trout re-filtering/re-wording
  every surface; evidence feed owner-facing + marketing methodology page only;
  stockingRecent consumed by default; public report photos. Genuine policy conflicts
  surface as `OWNER DECISION REQUIRED` boxes (§12) — implement the stated safe default
  and flag; do not invent your own policy.

**E0 (first task):** merge the three evidence branches so the reports are in your tree:
`git merge origin/campaign-a origin/campaign-b origin/campaign-c` (docs-only additions;
if `origin/main` has moved past `b44b4fe`, expect no conflicts — each branch adds only
its own report file). Reference them as `audit-a/b/c §n` throughout.

## 1. Verified baseline (audit-a/b/c, at `b44b4fe`, 2026-09-13/14 UTC)

- **Catalog:** 148 waters (35 river · 57 creek · 38 lake · 12 tailrace · 5 pond ·
  1 spring); ID sets identical across `packages/content/streams/tn/*.yaml`,
  `apps/web/public/atlas/rivers.geojson`, `apps/web/src/features/map/riverIndex.json`.
  Broad `species`: 103 trout / 8 warmwater / 37 absent. 39 waters carry 196 typed
  `targetSpecies` tags. `yearRound`: 19 true / 72 false / 57 absent. `stockingProgram`:
  94. 92 waters carry one `idealFlow` range each (56 empty) with **no provenance field
  in the schema** (`packages/contracts/src/schemas/stream.ts:5-12`).
- **Sources (live-probed by audit-b 2026-09-13T23:45Z–09-14T00:30Z):** 10 waters LIVE
  flow+temp · 26 PARTIAL (flow/stage only) · 15 lakes LEVEL-only · 97 NO GAUGE WIRING.
  Of 50 configured USGS sites: 12 absent from the IV catalog, 2 historical-only,
  1 died 2026-08 (`03539800`), only 34 return current flow, only 8 have live temperature.
  TVA is healthy (22 configured ids + 43-location catalog; **no temperature field
  exists**; requires browser UA + `Accept: application/json`, else HTML). USACE A2W
  healthy (12/12 TSIDs; empty-body-on-unknown-TSID; catalog under-reports). NWS sound
  except KTYS null pressure / KNQA 2 h lag. TWRA grids live (616 + 13 rows; CDN Age up
  to days — trust `Last-Modified`).
- **USGS deadline:** WaterServices decommissions **Q1 2027**; intentional
  degradation/blackouts allowed from **Aug 2026 onward** (official blog, fetched
  00:16:47Z). Replacement: `api.waterdata.usgs.gov` OGC-API (`/ogcapi/v0/collections/
  {continuous,latest-continuous}`); **API key required** beyond a few queries/hour
  (signup: api.waterdata.usgs.gov/signup). This migration cannot wait.
- **Scoring as-built:** legacy trout `scoreConditions` (no clock, trout temp wording)
  runs server-side for all 148; only the 48 gauge-configured waters can ever be
  assessed. v2 fishability (`scoreFishability`, thermal-only, 180-min absolute age
  gate) emits `/v1/fishability/{id}.json` for the 39 targetSpecies waters only.
  Activity = temperature + spawn-state + generic pressure transform
  (`50 − 10·ΔhPa`; every species' flow/pressure sensitivity is `needs-source`);
  `flow-trend` is contract-ready but unimplemented. Species enum = 7 warmwater keys,
  **no trout keys**.
- **Map:** extent-based title tiers (`labelPolicy.ts:19-25`: 0.3°/0.05°) → 54 statewide
  / 72 approach / 22 local; 9 creeks are statewide-tier by extent alone. Trout mode
  admits 141 (1 deemp `harpeth-river`, 7 excl). No authored display field exists.
- **Species mode propagation:** map/Browse/Conditions/settings/detail-focus-card done;
  NOT: `StockingPage.tsx:131` (settings bound to unused `_settings`), detail/drawer
  decision framing hardcoded `'trout'` (`StreamDetailPage.tsx:226-237`,
  `RiverDrawer.tsx:194,450`), marketing (no concept + overclaims: all 148 per-water
  pages titled "fly fishing"; descriptions promise fishability/ideal-flow on waters
  lacking them).
- **Worklist already verified done in code** (do not redo; tick the boxes in Phase 8):
  T1-6, T1-8, T1-9, T1-10, T1-15, T1-16, T1-17, T1-18, T1-19, T2-23, T2-24, T2-26,
  T2-27, T2-29, T2-30, T2-31, T2-32, T2-33, T2-34, T2-54.

## 2. Target semantics (what a number may claim)

Every surface must distinguish, and every score must carry machine-readable labels for:

| Concept | Meaning | Never may imply |
|---|---|---|
| `assessed` | measured inputs existed, within age gates | that fish will bite |
| `stale` | reading exists but past its age gate | freshness |
| `unassessed` | no usable input | a hidden score |
| `REGULATORY` season | TWRA/NPS/city regulation text | fish presence |
| `PROGRAMMATIC` window | stocking-schedule-derived only | a legal season |
| `measured / derived / heuristic / editorial` confidence (existing contract enum) | evidence strength for a displayed value | lab precision for heuristics |

Display copy rules: never "fish will bite"; activity wording stays "activity outlook";
heuristic rows say so; a lake never wears a river's temperature (audit-b F13: tailwater
temp is the release stream, never lake-representative).

## 3. Phase 1 — Honesty gates & data hygiene (owns: contracts, api, content-YAML, web)

Small, independent, shippable fixes; one commit each with its regression test.

1. **Absolute-age gate on the conditions path** (audit-a NEW-1; untracked defect — a
   stopped sensor scores for up to 90 days wearing a fresh `fetchedAt`). In
   `apps/api/src/ingest/usgs.ts` `latestReadings()` (or `buildSnapshots`), drop any
   whole reading whose newest metric is older than `CONDITIONS_STALE_MINUTES = 180`
   (aligns with `READING_STALE_MINUTES` in contracts and the UI's 3 h "stale" chip).
   The old stamp must still be preserved on retained rows. Test: frozen-time stopped
   sensor (all metrics at T) → no score emitted once now − T > 180 min; partially dead
   gauge keeps live metrics (existing behavior).
2. **Value validation before scoring** (audit-b F4): reject discharge ≤ 0 (site
   `03430200` published −168 cfs); treat USGS sentinels (`-999999`, `Ice/Eqp/Ssn/Bkw/
   Flt` qualifiers) as missing; flag `03566535` Q=0.00-style all-zero rows behind a
   warning, not a score. Tests per rule.
3. **`latestValue` ordering** (NEW-5): parse timestamps before comparing
   (`usgs.ts:60-65`), plus a mixed-offset ordering test.
4. **Remove the CORT1 orphan fetch** (NEW-2): `apps/api/src/evidence/monitors.ts`
   maps CORT1 → `waterId: 'cumberland-river'` whose `gaugeIds` is empty, so the
   reading is fetched and never consumed. Drop the pipeline mapping (keep the
   coverage-only note in docs). Test: no fetch issued for unconfigured waters.
5. **Remove the dead lakes layer** (NEW-3): `apps/web/src/features/map/mapStyle.ts:96`
   mounts `lakes.geojson`, an empty FeatureCollection (lake polygons live in
   `rivers.geojson`). Remove the source + any QA references. Test: map builds without
   it; atlas QA unchanged.
6. **Fix stale "exactly one factor" comments** (NEW-4) in
   `apps/api/src/snapshots/fishability.ts:27-31` and `build.ts:213-218`.
7. **Refresh the coverage artifact** (OA-07): regenerate
   `docs/data-source-coverage.json` including `bradley-creek` (missing since
   2026-09-05) and fix the "51 ids" claim to 50. If the generator script can't run
   without live data, hand-correct + add a generation-date banner.
8. **Relabel `verified-gauges.json`** (OA-08): it is a static 2026-09-02 site catalog,
   not current health. Rename its semantics/copy (keep the file + shape; additive) and
   note in its header that parameter health comes only from live feed checks.
9. **Content YAML gauge re-anchoring** (audit-b I11, F2; `packages/content/streams/tn/`):
   - `obed-river`: replace dead `03539800` with `03538830` (Obed @ Adams Bridge —
     Q+S+T+DO verified live; upstream reach, note the ~20-river-mile qualification in
     `notes`).
   - `buffalo-river`: add `03604000` (Q+S+T live). `wolf-river-west-tennessee`: add
     `07031650` (Q+S live). `elk-river-lower`: add `03582000` (Q+S+T, upstream
     reach note).
   - Remove the 12 absent-from-IV IDs from `gaugeIds` where they are dead weight BUT
     keep any water that retains another live source wired (e.g. boone-tailwater keeps
     `tva:BOOT1`); waters left with zero sources (french-broad-river, boone-lake,
     fort-patrick-henry-lake, wilbur-lake, parksville-lake, douglas-lake-adjacent
     03468510, reedy-creek 03487602) simply become honestly unassessed until Phase 3
     mappings land. Record every removal in the YAML `sources:` provenance.
   - `duck-river-lower`: flag `03597860` stage (10.11 ft vs neighbor 2.60 ft — datum
     question) in notes; keep flow scoring, do not trust absolute stage in copy.
10. **KNOWN-ISSUES:** add items for NEW-1…NEW-6 (as you fix them, tick them), OA-01
    (absolute freshness = the Phase-1 age gate), OA-04 (tiers = Phase 4), OA-06
    (marketing = Phase 7), OA-07, OA-09 (idealFlow provenance field, Phase 6), OA-10
    (accepted design: 39 fishability files; others honestly absent — document only).

## 4. Phase 2 — USGS Water Data migration (owns: api; DEADLINE-DRIVEN)

Blackouts may begin any time; the old API dies Q1 2027. Do this before new features.

1. Sign up / wire the API key: server-side env (`apps/api` only; never shipped to the
   browser, never committed). Owner action required to obtain the key (§12) — build
   with a keyless dev fallback (few queries/hour) and a loud warning when the key is
   absent so production config can't silently degrade.
2. New client module `apps/api/src/ingest/usgs-waterdata.ts` implementing
   `api.waterdata.usgs.gov/ogcapi/v0/collections/{latest-continuous,continuous}`
   (parameters `monitoring_location_id=USGS-{id}`, `parameter_code`, approval status;
   one feature per observation; UTC timestamps). Keep `usgs.ts`'s retention,
   per-metric timestamps, and the Phase-1 gates intact — swap the fetch/parse layer
   only.
3. Dual-fixture strategy: keep existing NWIS-shaped fixtures for the old path's tests;
   add recorded Water Data responses (shapes per audit-b §USGS-modernization) for the
   new client. Feature-flag via env (`USGS_PROVIDER=legacy|waterdata`), default
   `waterdata` once fixtures pass; monitor via a canary site + `conditionsFeedHealth`.
4. Acceptance: `pnpm --filter api test` green with both fixture sets; live canary fetch
   logged once against the real endpoint (server-side, identified UA, rate-limited);
   runbook note in `infra/RUNBOOK.md` (docs edit) recording the cutover + rollback.

## 5. Phase 3 — Source expansion (owns: api + content YAML)

Everything here is server-side ingest; the browser still sees only snapshots.

1. **TVA release schedules** (audit-b I4 — new verified endpoint): add
   `generation-releases/{LocationID}` to the TVA provider (browser UA +
   `Accept: application/json`; comma-string numbers; per-dam CDT/EDT labels; empty `[]`
   is a valid state). Emit `v1/release-schedule/{waterId}.json` for the 12 configured
   TVA-dam tailwaters + Barkley (BARK2): today+tomorrow generator blocks with the
   source's own date precision. Parse and fixture-test Cordell Hull (`COHT1`) as well,
   but keep it coverage-only while the cumberland-river reach remains intentionally
   unwired (§12 decision 3). USACE dams (Center Hill, Dale Hollow, JPP) have **no
   reachable schedule** — those waters get an honest "schedule unavailable" state
   (owner escalates to Nashville District, §12).
2. **TVA forecasts** (I4): `predicted-data/{id}` → 3-day AverageInflow /
   MidnightElevation / AverageOutflow context rows (mixed string/number typing; no
   inflow for COHT1 day 1). Presentation-only context; never a score factor.
3. **TVA lake-catalog mapping** (the biggest unassessed-reduction lever): probe the
   43-location catalog (`/RestApi/locations`, verified) and map every still-unwired
   major lake — tellico-lake, boone-lake, watauga-lake, melton-hill-lake, and any other
   200-verified match — into `monitors.ts` + YAML `gaugeIds`. Mind the ID-space traps:
   TVA `COHT1` = USACE `CORT1`; TVA `CHPT1` = USACE `ASHT1`; Barkley = `BARK2`. Only
   wire what a live probe confirms. Expected outcome: ~5–8 more lakes gain
   level+discharge.
4. **Precipitation context** (I12): ingest 00045 where already-configured gauges
   publish it (9 sites today, 44 statewide available); emit a "recent rain" context
   note per water (F12's shipped compromise) using `precipitationLast3Hours`-style NWS
   fields only as region fallback. Context, never scored.
5. **Dissolved oxygen as constraint** (I12): ingest 00300 where live (6 configured
   sites + CORT1/CLAT1/03418420 candidates). Emit DO readings; flag below the Gold
   Book constraint floors (coldwater inst. min 2.0 / 7-day min ~5.0; warmwater ~4.0;
   digits to be re-pinned from the verified EPA Gold Book 1986 document at
   implementation time — the structure is verified, the columnar digits are a
   documented [LEAD]). Add the verified `usace-a2w` provider to the stable `SOURCES`
   registry while doing this work. Constraint note only, never a positive score input.
6. **Safety overlays (docs-grade, no scoring):** TDEC fish-advisory PDF (weekly
   ETag/Last-Modified watch; recipe in audit-b registry) → advisory badge on affected
   waters; TDEC DWR ArcGIS attainment (`browser UA + Referer: tdeconline.tn.gov/dwr/`)
   → optional "water quality status" context line. Store retrieval dates.
7. **Do NOT wire** (audit-b verified negatives): satellite SST (NaN/land-mask),
   `water.weather.gov` (NXDOMAIN), CWMS (500/501), lrn web + rivergages (TLS), TVA
   HTML pages (Cloudflare), TVA temperature (field does not exist), TN reservoir buoys
   (none found), EPA WQP as a live feed (D-grade periodic only — may serve as offline
   seasonal baseline data later; out of scope now).

## 6. Phase 4 — Display tiers & map reduction (owns: content YAML + web)

Goal: fewer, defensible titles; nothing deleted — every water stays cataloged,
selectable, searchable, and prerendered (all 148 SEO pages remain).

1. **Authored tier field:** add optional `display: featured | standard | reference` to
   `StreamSchema` (additive) + `validate:content` enum check. Semantics:
   - `featured` — auto-title at statewide AND approach zoom.
   - `standard` — auto-title at local zoom only.
   - `reference` — no auto-title (icon + hit target + search + deep link only).
   Replace the extent logic in `apps/web/src/features/map/labelPolicy.ts` (keep
   extent only as a tie-breaker for `standard` label placement). Update
   `MapLegend`/help copy. Out-of-season waters additionally lose auto-titles when the
   seasonal decision state says absent (existing T1-18/19 states, now consumed by
   labels).
2. **Assignments** (37 featured / 95 standard / 16 reference — audit-a inventory +
   audit-c §4.5 significance):
   - **featured (37):** the 12 tailwaters (`boone-tailwater, caney-fork-river,
     clinch-river, duck-river-tailwater, elk-river, french-broad-river,
     ft-patrick-henry-tailwater, hiwassee-river, obey-river, parksville-tailwater,
     south-holston-river, watauga-river`) · 19 major lakes (`norris-lake, cherokee-lake,
     douglas-lake, watts-bar-lake, fort-loudoun-lake, chickamauga-lake, old-hickory-lake,
     j-percy-priest-lake, tims-ford-lake, center-hill-lake, dale-hollow-lake,
     kentucky-lake, lake-barkley, south-holston-lake, pickwick-lake, tellico-lake,
     boone-lake, watauga-lake, reelfoot-lake`) · 6 rivers (`cumberland-river,
     tennessee-river, mississippi-river, duck-river-lower, buffalo-river, obed-river`).
   - **reference (16):** the 13 West-TN winter waters (`beech-lake, cameron-brown-lake,
     covington-fbc-pond, edmund-orgill-lake, johnson-park-lake, lake-graham,
     martin-city-pond, milan-city-pond, paris-city-park-lake, shelby-farms-lake,
     union-city-reelfoot-pond, valentine-park-pond, yale-road-park-lake`) +
     `wilbur-lake, ocoee-number-three-lake, sinking-creek-wilson`.
   - **standard (95):** everything else — all stocked trout creeks/rivers, wild
     streams (incl. the 9 formerly extent-promoted creeks: little-river, daddys-creek,
     clear-creek-obed, clear-fork, sulfur-fork-creek, little-west-fork-creek,
     white-oak-creek, reedy-creek, wolf-river-fentress), GSMNP park waters,
     small mountain lakes (chilhowee, calderwood, parksville, normandy, great-falls,
     woods, melton-hill), and the remaining rivers.
   Effect: statewide titles 54 → 37 (−32%); approach-tier titles 126 → 37 (−70%);
   reference waters drop out of label traffic entirely but remain fully functional.
3. **Hit-target/selection policy:** unchanged for featured/standard; reference waters
   remain tappable via their icon/corridor and searchable. Add a Browse-page tier
   facet ("Featured / All waters") and a map-help line explaining tiers.
4. Tests: labelPolicy unit tests over the real `riverIndex.json` (the missing
   regression audit-a flagged); snapshot of statewide/approach/local title counts
   (37/37/95 expectations baked in); a seasonal-suppression test (a `yearRound:false`
   trout water in July shows no auto-title).

## 7. Phase 5 — Species & season authoring (owns: content YAML + validators)

All evidence: audit-c §3–4 (typed ledger, retrieval-dated). Apply exactly; conflicts
are NOT silently resolvable (§12).

1. **Typed-tag corrections:** remove `targetSpecies: [smallmouth-bass]` from
   `cosby-creek, leconte-creek, middle-prong-little-pigeon, west-prong-little-pigeon`
   (schema-driven mislabel — NPS documents those waters as wild brook/rainbow/brown;
   audit-c D5). Keep `little-river`'s SMB (real REG basis: Rockford Dam upstream PLR).
2. **Species-evidence citations (the "no unverified tags" pipeline):** add optional
   per-water `speciesEvidence: [{species, kind, url, retrieved}]` to the schema
   (additive) and extend `validate:content` to REQUIRE an entry for every
   `targetSpecies` key within this phase. Backfill from audit-c §3.1 (28 TWRA
   where-to-fish pages), §3.2 (REG exceptions page), §3.3 (stocking page + plans).
   Waters with no defensible evidence (audit-c §3.5: bradley-creek, clear-fork,
   cumberland-river, emory-river, mississippi-river, ocoee-river, reelfoot-lake,
   tennessee-river, wilbur-lake, ocoee-number-three-lake, little-tennessee-river,
   caney-fork-upper, buffalo-river) get NO typed keys and stay honestly unknown.
3. **Confidence downgrades (apply as notes + low-confidence flags, not removals):**
   striped-bass on douglas/kentucky/pickwick/barkley/fort-loudoun/tellico/nickajack/
   fort-patrick-henry/j-percy-priest is reg-line or hybrid evidence (D6) — qualify in
   notes; spotted-bass everywhere = "spotted/Alabama bass complex" caveat (D8, TWRA's
   own genetics page); great-falls-lake SPB carries the page's own "small population"
   qualification; clinch-river note loses "self-sustaining" (D3 → "stocked
   brook/brown/rainbow under PLR regs"); Obed-system + Powell wild-trout claims get
   "reported locally; unverified by agency sources as of 2026-09-14" framing (D4) —
   the `species: trout` field stays (multiple independent reports) but is flagged for
   TWRA Region 3/4 confirmation (owner action).
4. **Conflicts with safe defaults** (owner boxes in §12): dale-hollow-lake → rainbow
   + note the snapshot conflict (D1); chilhowee-lake → live-list rainbow, plan text
   dated note (D2).
5. **Seasons — replace the hardcoded Nov–Mar window** (`waterDecision.ts:78-79`) with
   authored optional `seasonMonths: [..]` plus `seasonKind: regulatory | programmatic`
   per water. `seasonKind` is required whenever `seasonMonths` is present; the UI
   renders the machine value as the explicit `REGULATORY` or `PROGRAMMATIC` label:
   - Tailwater PROGRAMMATIC windows from the verified stocking list (audit-c §3.3):
     duck-river-tailwater Nov–Jun · elk-river Mar–Dec · stones-river Dec–Mar ·
     caney-fork Mar–Dec · hiwassee Oct–Jul · obey Jan–Dec · boone-tailwater
     Dec+Mar+Apr · ft-patrick-henry Mar–Apr · parksville Mar–May · clinch Mar–Aug ·
     south-holston Mar–Sep · watauga-river Mar–Dec (+ wilbur reach Mar–Jul).
   - West-TN winter ponds: PROGRAMMATIC winter windows per schedule; note that no
     regulation creates or closes them (D17).
   - `red-river-clarksville`: NO live stocking row found this window — mark the
     winter-trout note "program status unverified as of 2026-09-14"; no season window.
   - REGULATORY facts to author into notes/fishing.json: Hiwassee Mar 1–Sep 30 harvest
     + Oct 1–Feb 28 C&R; SF Holston two spawning-reach closures Nov 1–Jan 31; Tellico-
     Citico permit Mar 1–Aug 15 (+Thu/Fri closures); Buffalo Creek Grainger CLOSED
     year-round above the mill dam; Gatlinburg Thursday closures + Dec 1–Mar 31 C&R;
     Piney River DH removed 2026-27 (keep the existing dated-conflict handling, D19).
   - D18 guard: do not display Gatlinburg creel counts until the source text is re-pinned;
     only ship the verified Thursday closure and Dec 1–Mar 31 C&R facts in this phase.
   - Decision model: seasonal states derive from `seasonMonths` + current month; the
     chip copy names `seasonKind` ("Stocked Nov–Jun (program)" vs regulation text).
6. **Validators:** extend `validate:content` for `seasonMonths` (month names, ≤12),
   the `seasonMonths`/`seasonKind` required-pair and enum rules, the
   `speciesEvidence` requirement, and the D7 parser hazard rule — "Cherokee bass" must
   never tokenize as `spotted-bass` or `striped-bass` anywhere in tooling.

## 8. Phase 6 — Scoring updates (owns: contracts + api; ADR + tag bump where additive)

1. **Trout lens bands get real citations** (legacy `scoreConditions`, audit-c §5.1 —
   VT F&W verbatim + Hasnain + NDEP): optimal window 11–19 °C (brown 11.7–18.9 ∪
   rainbow 12.2–18.9), avoidance 19–24 (score-down reasons), lethal clamp ≥ 24–25.
   Replace the current 6–20/+10 constants; reasons copy cites the sources; the
   "dangerously warm — avoid stressing trout" wording stays for > lethal. Property
   tests on band edges. (Trout stays on the legacy path — the two-model split is the
   intended steady state, audit-a OA-03; do NOT migrate trout into v2 this campaign.)
2. **Warmwater comfort completions:** author largemouth optimal 25–30 °C (NDEP
   preferred modes 26.7/30.0, verified) into `species-reference.yaml` — this flips
   largemouth from partial to fully-assessed on monitored waters. Spotted/crappie/
   bluegill/channel-catfish optimals stay `needs-source` (their honest
   `assessed:false` rows persist — do NOT invent bands).
3. **Spawn anchors per audit-c §5.2 (replace weaker citations):** largemouth 20–24 °C
   labeled "TWRA Watts Bar 68–72 °F + TAMU 65–75 °F" (drop FishUSA as primary, D16);
   crappie 15.6–20 °C (TWRA Watts Bar, verified — newly scorable); smallmouth onset
   15.5 °C (MDC, verified); channel-catfish onset 23.9 °C (MDC 75 °F, verified —
   replaces CatfishNow, D12); bluegill onset ~23.3 °C labeled extension-grade (D13);
   striped-bass stays needs-source. Striped-bass reservoir rows: no squeeze scoring
   (no DO/depth sensors — audit-b F12); the Cherokee/TWRA stratification narrative
   ships as context text only.
4. **Pressure excluded from weighted activity** (audit-c D11 — controlled null result,
   VanderWeyst 2014 P=0.55): remove the `pressure-trend` component from
   `scoreActivity` emission; NWS pressure trend remains available as a context row on
   detail (labeled heuristic/context). Update `data-sources.astro` methodology text.
5. **Spawn-state numerics stay but are labeled** (D10): keep the shipped small weights;
   ensure `confidence: heuristic` + copy "heuristic estimate" wherever
   `spawnStateValue` contributes.
6. **flow-trend ships as CONTEXT, not score** (audit-c §5.3.3 — weakest factor family;
   only smallmouth nest-failure evidence exists, spawn-scoped): implement the
   contract-ready `flow-trend` as a derived context field (rising/falling/stable +
   magnitude from the gauge series, `derived` confidence) in snapshots; do not add it
   to the activity total. SMB spawn-scoped flow scoring is backlog, not this campaign.
7. **`idealFlow` provenance field** (OA-09): additive optional `idealFlowSource` on
   the range schema; fill `editorial` for the existing 92 (no provenance exists —
   D9); UI copy "typical range (editorial)". Legacy scoring semantics unchanged.
8. **Lake presentation:** lakes score on what they have — level + dam discharge +
   forecast/trend context (Phases 3); comfort `assessed:false` (no lake temperature
   exists anywhere — audit-b F12: any lake temp score today would be fabricated).
   Detail/drawer for lakes leads with level/level-trend/release context, never a
   temperature badge.

## 9. Phase 7 — Sitewide coherence & copy (owns: web + marketing)

1. **Species-mode completion (T1-22 residue):** `StockingPage` — consume the site-wide
   setting (delete the unused `_settings` binding, `StockingPage.tsx:131`): All-fish
   mode shows all TWRA species and re-words the header; Trout mode highlights trout
   events. Detail page + drawer — use the persisted mode, not hardcoded `'trout'`
   (`StreamDetailPage.tsx:226-237`, `RiverDrawer.tsx:194,450`) for decision framing
   while keeping catalog-species honesty wording. Marketing has no mode (static) —
   its fixes are accuracy fixes below.
2. **Marketing accuracy (OA-06):** per-water page titles/descriptions derive from the
   water's actual species (`"fly fishing"` only for trout waters; warmwater/unknown
   waters get "fishing"); feature promises ("fishability score, ideal flow ranges")
   render only when the built data actually has them (check fishability file /
   idealFlow at build time; both fixture and `MARKETING_DATA_DIR` modes). Kill any
   "blue ribbon" phrasing — TWRA's real label is "Quality Trout: Fishing Area"
   (watauga-river QTA only, D20).
3. **Copy truth passes:** staleness chip + score always agree with the Phase-1 age
   gate (a gated score shows "stale", never a fresh-looking number); lake pages show
   level/discharge context; Alabama-bass caveat appears wherever spotted-bass is
   displayed (one shared footnote component); "Cherokee bass" never appears as a
   species key.
4. Update `apps/marketing/src/pages/data-sources.astro` for: pressure exclusion +
   null-result citation, trout band sources, USGS migration note, release-schedule
   source, DO constraint floors.

## 10. Phase 8 — Tests, rollout, worklist closeout

1. **New regression tests** (audit-a §7 gaps + this plan's changes): absolute-age gate
   (frozen time) · negative/zero/sentinel discharge · mixed-offset `latestValue` ·
   orphan-fetch prevention · empty-artifact detector (no committed empty GeoJSON) ·
   title-tier counts over real `riverIndex.json` · seasonal label suppression ·
   species-mode propagation into Stocking/detail/drawer wording · marketing title
   truth per water type · validator rules (`speciesEvidence`, `seasonMonths`,
   "Cherokee bass") · TVA gen-releases/predicted-data parsers (comma strings, tz
   labels, empty `[]`) · USGS Water Data fixtures (new + legacy) · DO constraint
   floor · release-schedule snapshot emission.
2. **Gates per task group:** `pnpm -r lint && pnpm validate:content && pnpm -r test &&
   pnpm -r build`; e2e suite (`pnpm e2e`) before each phase close; privacy spec must
   stay green (all new fetches server-side only).
3. **Rollout:** integration branch per EXECUTION-PLAN §2 (full gates), then a release
   checkpoint merge + pipeline deploy; verify through the public edge with
   `bash infra/verify-site.sh --public` afterwards. Never hand-run deploys.
4. **KNOWN-ISSUES closeout:** tick the verified-done list in §1; tick each phase's
   items as merged; record the USGS deadline + USACE-schedule + TVA-access as owner
   actions (T3-class); append audit-b/c "do-not-implement" registers as accepted-
   limitation notes. Explicitly preserve the D14 no-unverified-trophy-rule decision,
   D15 Region-1-only crappie exception, D18 Gatlinburg creel-count hold, and the
   source negatives (satellite SST, CWMS, rivergages, lake temperature, pressure
   scoring).

## 11. Sequencing & rationale

Phase 1 first (cheap honesty wins, unblocks everything); Phase 2 second (deadline);
Phases 3–5 can interleave (different file slices — api vs content vs web; use the A/B/C
ownership split if running multiple sessions); Phase 6 depends on 3 (DO, flow-trend
data) and 5 (authored windows); Phase 7 depends on 4–6 (copy reflects final behavior);
Phase 8 last. If one session executes alone, run strictly in order.

## 12. Owner decision register (flag, implement the default, do not block)

| # | Decision | Safe default (implemented) |
|---|---|---|
| 1 | Add trout keys to the v2 `SpeciesKey` enum (would let GSMNP waters carry typed trout tags; audit-c D5) | Not this campaign — four mislabelled SMB tags are cleared; `little-river`'s REG-based SMB remains; enum stays 7 keys |
| 2 | Dale Hollow stocking composition: live TWRA list says Rainbow-only; repo snapshot says Brown (D1) | Rainbow + dated conflict note |
| 3 | Wire cumberland-river conditions from ASHT1/pool sensors (reach-representativeness question; prior policy rejected main-stem single-dam scoring) | Stay unwired; candidates recorded |
| 4 | USGS Water Data API key signup (needed before blackouts; credential) | Owner action — code ships with keyless dev fallback + warning |
| 5 | USACE Nashville release schedules (blocked upstream: CWMS 500, lrn TLS) | Owner requests a feed from the District; honest "unavailable" until then |
| 6 | TWRA Region 3/4 verification of Obed/Powell wild-trout claims (D4) | Unverified framing until agency word |
| 7 | Pressure-trend removal from weighted activity (null-result evidence) | Removed; context row remains |

## 13. Definition of done

- Every displayed water shows only claims its data supports (age-gated, labeled,
  cited); unknown is visible and honest everywhere.
- Statewide auto-titles reduced 54 → 37 with an authored, cited tier on every water;
  nothing deleted from catalog/search/SEO.
- Every `targetSpecies` tag carries a retrieval-dated evidence citation or is removed;
  the four GSMNP SMB mislabels are gone while `little-river`'s REG-based SMB remains;
  all audit-c D-register downgrades are applied.
- USGS fetches run on the Water Data API with key management before any blackout;
  TVA release schedules + forecasts + lake mappings shipped where probe-verified.
- Trout comfort bands cite agency sources; largemouth fully assessed; pressure out of
  the weighted score; flow-trend context shipped; lakes present level/discharge
  honestly with no fabricated temperature.
- All Phase-8 regression tests green in CI; worklist updated; reports merged; the
  owner-decision register answered with implemented defaults and visible flags.
