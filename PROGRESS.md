## SESSION GEOMAP — statewide network map, on-demand per-cluster loading (2026-09-11)

Branch `geomap/statewide-network` (base `integration` @ 56135fd), clone
`/Users/ben/Downloads/TroutSite-network-map`. Replaces the single-region Caney Fork PROOF
(`network-caneyfork.geojson` + static `network` source/`network-minor` layer — both deleted)
with `networkClusters.ts`: on moveend at zoom ≥ 9.4 the loader fetches
`/atlas/network/manifest.json` (schema `trout/nhd-network/1`, SESSION A's contract), loads every
cluster whose padded bbox intersects the viewport (`addSource('network-<id>')` +
`addLayer('network-minor-<id>')` with the proof layer's exact paint, minzoom 9.6, inserted
before `rivers-casing` so catalog rivers paint on top), fetches each file once per page session,
and releases source+layer when a loaded cluster leaves the padded viewport at zoom ≥ 8.5.
Hover tooltip now iterates every active `network-minor-*` layer (creeks stay non-selectable —
never in the hit layers). A missing/invalid manifest disables the feature (fail-closed).
Note: `networkClusters.ts` belongs to the map feature dir, so when SESSION A's branch lands,
only the `public/atlas/network/**` data files merge from their lane; no code conflict expected
elsewhere.

- SESSION A's manifest was NOT on my base: developed against a hand-written 2-cluster mock
  (spatial split of the proof data, `atlas/network/{manifest,0513,0601}.geojson`) — **mock files
  deliberately left UNTRACKED** (data belongs to SESSION A's lane; do not commit from here).
- Verified: typecheck clean; web tests 248 pass / 1 pre-existing skip (239 baseline + 9 new
  manifest/intersection unit tests in `test/network-clusters.test.ts`); `pnpm --filter @trout/web
  build` + size budget OK (12.81/25 MB — dropping the 1.8 MB proof file shrinks precache;
  `atlas/*` precache is non-recursive so cluster files stay runtime-fetched).
- Browser evidence (DEV_FIXTURES=1, 1440×900): `?river=caney-fork-river` z10.5–11.6 creeks render
  (951/313 features) and hover shows names ("Mulherrin Creek", "Hogan Creek" screenshots); state
  z6 renders ZERO network features; hard reload @ z11.2 fetched ONLY `network/0513.geojson`
  (single-cluster on-demand); pan east z10 → 1,173 rendered; pan back → 1,331 with zero refetches
  (`fetchedOnce: true` seam); Memphis (no cluster) → both released, 0 rendered; `?all=1&species=all`
  works (1,081 rendered); fiche + flow arrows + lakes + desktop toolbar intact; layer order
  verified `network-minor-*` immediately beneath `rivers-casing`; creek-only click leaves
  selection/URL unchanged.

## Punch-list closeout (GEOVALID-2 consolidation, later on 2026-09-11)

Resolved during consolidation: parksville-tailwater (NHD name is Lake Ocoee — re-traced
19.38 km), little-tennessee-river (Chilhowee-to-mouth, 48.66 km), watauga-river-wilbur-reach
(3.84 km), stones-river, and the new-river|south-fork-cumberland + ocoee-river|parksville
duplicate-linework defects (gone once the over-traces were fixed). elk-river-lower's
engine-v2 up point was re-pinned to the Prospect channel node (the gauge coordinate was
>150 m off-graph; 14.6 km over-walk removed). Termini.json adopted the shipped reality for
all 105 flowing waters; suite verdict: PASS (0 FAIL, 10 REVIEW artpath chords), B13 19/19
FIXED, web 239/239 + typecheck clean, content validate OK.

Still open (next lanes): cross-unit stitching (tennessee-river 197 km partial, cumberland-river
108 km partial, ~24 km Ocoee-in-GA slice; 41 cross-unit waters end at unit edges), the 12
dropped lake references (content lane, FANOUT-REPORT §10), Forked Deer 08010206 upstream
(defective USGS product), and GEOCONV-0 review of the engine v2 upstream point/confluence
stops (scripts/nhd_trace.mjs — additive, documented).
# SESSION INTEGRATION (GEOVALID-2 follow-on) — all-lane consolidation dry-run (2026-09-11)

Scratch integration branch in `/Users/ben/Downloads/TroutSite-integration-dryrun` (owner-directed
consolidation review; push pending owner-provided GitHub remote). Merge chain, in order:

1. `geoconv/nhd-integration` (GEOFANOUT-1; engine + 59 HU8 units + catalog trace driver) — base.
   Closeout: GEOFANOUT-1's 321 uncommitted reach outputs committed with attribution (`9eeac21`).
2. + `geoconv/nhd-validate` (GEOVALID-2 suite + termini.json + review pack) — **1 conflict:
   PROGRESS.md** (both lanes prepended session entries; both kept).
3. + `harden/origin-host` (origin-host security: api hardening, static-server containment,
   RUNBOOK, HARDEN-AUDIT) — unrelated snapshot histories (b301570 vs 1300194 snapshot inits,
   trees near-identical; the older snapshot had node_modules committed, excluded).
   **13 conflicts, all mechanical**: take-theirs for harden's lane-exclusive files
   (apps/api/**, infra/**, .env.example), take-ours COORDINATION.md, PROGRESS.md stitched.
4. + `ui/search-and-themes` (Codex: header search + themes) — **clean, zero conflicts**
   (9 files: AppShell header search wiring, RiverSearch, ThemeProvider, themes.ts +265 —
   Riverstone/High contrast/Campfire + custom color overrides, SettingsPage controls, tests).

## Verification on the merged tree

- web: 239 passed / 1 skipped; typecheck clean; content pack: 11 passed; NHD suite tests: 29 passed.
- Catalog suite after termini-spec reconciliation (full trace-specs.json generated from
  termini.json, GEOFANOUT-1 driver re-run): 99/105 traces PASS, **B13 all FIXED**, bbox gate
  caught 2 real duplicate-linework over-traces (new-river|south-fork-cumberland,
  ocoee-river|parksville-tailwater).

## Punch list (integration lane, next session)

1. Dam-stop failures (lake artpath wbarea unresolved in some units): parksville-tailwater
   (138 km over-trace), little-tennessee-river (52 km — Fontana in NC), stones-river (4.4 km),
   watauga-river-wilbur-reach (56 km vs ~2.4 km stated). Fix stops → over-trace bbox
   duplicates disappear with them.
2. Continuity/cycle-guard waters: buffalo-river (157 m junction), hiwassee-river (96 m,
   cycle-guard; dam spec unreachable — NC impoundment, needs point/state-line spec in
   conventions v2), south-holston-river (72 m), pigeon-river (69 m), caney-fork-upper (55 m),
   little-tennessee-river (55 m).
3. 7 confluence targets not present as named in-unit edges (clear-fork, gulf-fork-big-creek,
   little-river, new-river, north-prong-barren-fork, piney-river-rhea, trail-fork-big-creek) —
   verify target gnis names per unit or flag hu8BoundaryReach with evidence.
4. cross-unit stitching (41 waters) remains a separate, explicitly approved step (§9).

# SESSION GEOFANOUT-1 — NHD fan-out: every TN-intersecting HU8 → JSONL + graph (2026-09-11)

Clone: `/Users/ben/Downloads/TroutSite-nhdfanout1` (own clone per AGENTS.md rule 1; announced
here — the only session bridge available is this file). Branch: `geoconv/nhd-fanout`,
**base commit `1300194`** (same base as GEOCONV-0), conventions doc + engine branch
`geoconv/nhd-engine` merged in as the first act (merge commit `4596764`).
Commit tag: `geofanout(...)`. **No origin remote exists anywhere on this host (TroutSite-main
is a plain snapshot without .git) — push DEFERRED pending owner-provided remote metadata,
same known blocker as GEOCONV-0.**
Precondition verified: `docs/NHD-CONVENTIONS.md` frozen by GEOCONV-0 present at merge;
reference HU8 06010207 B13 gate `reach-clinch-river.validate.json` verdict PASS.
Scope: `data/nhd/**`, `FANOUT-REPORT.md`, `PROGRESS.md` only — no engine or app changes.

TN-intersecting HU8 enumeration (authoritative): USGS WBD HU2 geodatabases 05/06/08,
WBDHU8 layer, `states LIKE '%TN%'` → **59 units** (58 remaining after 06010207).
List + per-unit results: see `FANOUT-REPORT.md`.

## Status log

- [x] Setup: clone, branch off `1300194`, merge `geoconv/nhd-engine`, B13 precondition check.
- [x] HU8 enumeration via WBD (05/06/08 × `states` field) → 59 TN-intersecting units.
- [x] Per-HU8 convert + graph build: 3 waves × 4 concurrent subagents (+1 re-validated
      rate-limit-lost batch). **58/59 ok**; 08010206 Forked Deer blocked by a defective
      USGS source product (2.1 MB zip, 419 flowlines, 202 all-unnamed waterbodies —
      evidence + remedies in FANOUT-REPORT.md §6); partial outputs removed `43c2eee`.
- [x] Independent main-session full-tree re-validation of every committed unit: zero
      problems (schema, single-part geometry, meta-vs-actual counts, graph endpoint
      integrity, edges == flowlines, 0 zero-length edges, 0 duplicate node coords,
      all dam bridges ≤ 100 m).
- [x] `data/nhd/hu8/index.json` (counts, byte sizes, named waters, timestamps, provenance).
- [x] Cross-unit waters: **41 waters share a gnis_id across ≥ 2 units** (Tennessee River 8
      units, Cumberland 6, Clinch 4, …) — full list in FANOUT-REPORT.md §4. **2,177 name
      strings span units but are mostly DIFFERENT waters (name collisions) — integration
      must match by gnis_id, never by name.**
- [x] FANOUT-REPORT.md reconciled (per-unit table, anomaly list, engine proposals for
      GEOCONV-0: zero-named-waterbodies converter crash, empty-VAA meta artifact,
      MultiLineString doc wording, size-tiered budgets, WBD enumeration recipe).
- [x] Gates: no packages changed → package lint/test scope empty; prettier --check clean
      on the files this lane authored. Scope proof: `git diff --name-only 1300194..HEAD`
      contains only `data/nhd/**`, `FANOUT-REPORT.md`, `PROGRESS.md`.
- [ ] **Push deferred** — no origin remote exists on this host; owner push required
      (FANOUT-REPORT.md §9 has the exact commands).

## Commits (this lane)

- `4596764` geofanout(setup): merge conventions doc + engine branch into fanout lane
- `4249016` geofanout(setup): announce lane, record base 1300194, WBD-derived 59-unit TN HU8 list
- `c0946b9` geofanout(hu8): convert + graph wave 1 — first 20 units
- `ebacc7b` geofanout(hu8): convert + graph wave 2 — 20 units
- `d8e30c4` geofanout(hu8): convert + graph wave 3 — 17 units PASS, 08010206 FAIL documented
- `43c2eee` geofanout(hu8): remove partial 08010206 outputs (defective upstream product)
- final: geofanout(report): index.json + FANOUT-REPORT.md + PROGRESS.md closeout

---
# SESSION GEOVALID-2 — regression gates + termini table + owner review pack (2026-09-11)

Base commit: `1300194` ("geoconv0(base)") — snapshot lane with **no remote**; merged the
conventions + engine branch `geoconv/nhd-engine` (tip `6e25818`, fast-forward) first per brief.
**Push is DEFERRED pending owner-provided remote metadata** (same known blocker as GEOCONV-0;
AGENTS.md rule 3 cannot run against a missing origin).
Clone: `/Users/ben/Downloads/TroutSite-nhdvalid2` (own clone, lane `geoconv/nhd-validate`;
announced here per AGENTS.md rule 1 — registration landed with this commit because no remote
exists to bridge through; TroutSite-main and TroutSite-nhdconv0 were not written to).
Branch: `geoconv/nhd-validate`. Commit tag: `geovalid(...)`.
Scope: `scripts/nhd-validate*`, `data/nhd/termini.json`,
`data/nhd/derived/validate/catalog-report.json` (suite output = regression evidence),
`docs/NHD-BEFORE-AFTER.md` + `docs/nhd-before-after/` (review-pack renders),
`tests/nhd-validate.test.mjs`, `PROGRESS.md`, `COORDINATION.md` (bridge row).
Not touched: `apps/web/**`, `packages/**` content, production assets — the flip is a later,
owner-approved lane.

## Status log

- [x] Setup: cloned the local `TroutSite-nhdconv0` repo (the only existing object store; the
      snapshot upstream has no `.git`), removed the local origin remote, branched
      `geoconv/nhd-validate` off `main` (`1300194`), merged `geoconv/nhd-engine`
      (fast-forward to `6e25818`; conventions doc + trace engine available immediately).
- [x] Catalog ground truth: 148 waters in `packages/content/streams/tn` (57 creek, 38 lake,
      35 river, 12 tailrace, 5 pond, 1 spring) with 1:1 features in `rivers.geojson`
      (105 flowing lines + 43 stillwater polygons). **The brief's "146 catalog waters" does
      not match any current count; the termini table covers all 148 (a superset of any
      146-subset).** Reconcile note recorded in `data/nhd/termini.json` meta.
- [x] Validation suite `scripts/nhd-validate.mjs` (+ pure checks in `scripts/nhd-validate-lib.mjs`,
      zero-dep) enforcing the six brief gates: (1) reach = one connected component (+ junction
      continuity ≤ 50 m via audit sidecars), (2) termini assertions vs `termini.json`
      (tailrace ⇒ `dam:*` up-spec and realized reason `dam`; non-tailwater down ends at
      mouth/confluence; HU8-boundary ends excused only via explicit `hu8BoundaryReach`),
      (3) bbox/linework uniqueness with a geometry-coincidence test (B13 Boone/SoHo class —
      fails only on ≥60% duplicated linework; adjacent tailwater-vs-reservoir extents are
      geography, not duplication), (4) multi-longitude disconnection (chord scan: FAIL > 20 km,
      REVIEW 2–20 km; measured max legitimate artpath chord 1.3 km), (5) length sanity vs
      stated river miles in YAML notes (±40/−30% band), (6) anchor snap ≤ 250 m per
      conventions §6.1. Coverage model: present reaches must PASS; waters without traced
      reaches are `pending` (listed, non-failing) until GEOFANOUT-1 lands; `--strict` turns
      pending into FAIL for the post-fan-out mode. Report:
      `data/nhd/derived/validate/catalog-report.json`. **Green: 0 FAIL, 0 REVIEW.**
- [x] Termini table `data/nhd/termini.json` (schema `trout/nhd-termini/1`, grammar =
      NHD-CONVENTIONS §6.2): all 148 waters — 105 flowing + 43 stillwater (null termini by
      design). Drafted by six subagent batches (25/25/25/25/25/23) from YAML + streams-geo
      anchors + asset labelAnchors, then reconciled and schema-validated (grammar, confidence
      enum, autoDerivable⇔high/high⇔humanReview consistency, tailrace⇒dam-spec). Result:
      30 auto-derivable, 75 with explicit human-review tokens, 12/12 tailraces with dam specs
      (11 dam targets are catalog lakes; `dam:Apalachia Lake` for hiwassee-river and
      `dam:Fontana Lake` for little-tennessee-river are NC reservoirs → low confidence +
      human review). Reconciliation decisions (obed/obey naming, boone-tailwater cross-YAML
      evidence, french-broad dam despite NC-entry sentence, town-split reaches left
      `reach-split-ambiguous` rather than hard-coding gauge point-specs) recorded in
      `reconciliationNotes`. clinch-river row `verified: true` from the committed reach.
- [x] Owner review pack `docs/NHD-BEFORE-AFTER.md` + 32 panels in `docs/nhd-before-after/`
      (all 12 tailwaters + 20 featured = stocked, gauge-anchored first): BEFORE = shipped
      linework, AFTER = NHD reach (clinch-river) or annotated pending-fan-out plan. Renderer
      `scripts/nhd-validate-pack.mjs` (zero-dep SVG + headless-Chrome PNG capture with an
      in-script PNG crop — headless window-size includes a UI band that clipped the footer;
      capture-tall-then-crop is deterministic). Visual gate (judge subagent) run 3×; final
      verdicts PASS on all sampled panels (clinch, boone, watauga, hiwassee, obey,
      french-broad, barren-fork, parksville).
- [x] B13 regression: the 19-water known-bad registry (docs/GEO-AUDIT.md non-ok rows) embedded
      in `nhd-validate-lib.mjs` with original defect signatures; suite verdict **19/19 FIXED**
      — duplicates: linework distinct everywhere; fragments/misjoins: bounds off the original
      signatures; missings: line geometry present (34–367 vertices). clinch-river additionally
      has a fully validated NHD reach. cane-creek FIXED under the documented GEO-AUDIT waiver
      (deliberate two-creek catalog entry; content-lane follow-up; the pipeline cannot
      reproduce the merge class).
- [x] Tests: `tests/nhd-validate.test.mjs` — 29 passing (`node --test tests/nhd-validate.test.mjs`),
      including a 148-file parse test and the termini-draft grammar test. Fix applied during
      testing: `parseStatedMiles` lookbehind (4-digit figures no longer mis-captured as 3-digit).
- [x] Gates: prettier --check clean on all touched files; suite green; visual gate green.
      Push deferred (no remote) — **owner action: provide the GitHub remote so both NHD lanes
      can push `geoconv/*` branches** (rule 3).

## Handoff notes for the consuming lanes

- GEOFANOUT-1: per unit, after `nhd_build_graph`/`nhd_snap_anchors`/`nhd_trace`, run
  `node scripts/nhd_validate.mjs` (goes strict per-reach automatically) and re-render the pack
  (`node scripts/nhd-validate-pack.mjs --png`); assign `hu8`/`hu8BoundaryReach` in termini.json;
  resolve the 75 human-review tokens (list in termini.json `humanReviewList`) before tracing
  those waters; hiwassee/little-tennessee dam names must be checked against the actual NHD
  waterbody tables of the NC-side units.
- Integration lane (flip): after fan-out + `--strict` green + owner approval via this pack,
  merge reach properties into `rivers.geojson` per conventions §9 and regenerate riverIndex.

# SESSION GEOCONV-0 — NHD trace engine spike + conventions freeze (2026-09-11)

Base commit: `1300194` ("geoconv0(base): snapshot init from TroutSite-main 2026-09-11") — snapshot arrived
WITHOUT .git and no remote exists in this clone, so the base commit is the snapshot-init commit itself.
**Push is DEFERRED pending owner-provided remote metadata** (AGENTS.md rule 3 cannot run against a missing
origin; re-run `git remote get-url origin` check when the owner supplies it).
Clone: `/Users/ben/Downloads/TroutSite-nhdconv0` (own clone, lane `geoconv/nhd-engine`; announced here per
AGENTS.md rule 1 — TroutSite-main is actively touched by another lane and was NOT written to).
Branch: `geoconv/nhd-engine`. Commit tag: `geoconv0(...)`.
Scope: `data/nhd/**`, `scripts/nhd_*`, `docs/NHD-CONVENTIONS.md`, `PROGRESS.md`. Not touched:
`packages/contracts`, `apps/web/src`, `apps/web/public`, other lanes' files.

## Status log

- [x] Setup: snapshot copied (48M, node_modules excluded), `git init`, base commit `1300194`,
      branch `geoconv/nhd-engine`. Foreign in-flight work observed in snapshot (docs/, e2e/,
      packages/ui dated 2026-09-10/11) — taken as immutable baseline, not built upon.
- [x] Preflight: `git remote get-url origin` → no remote (known snapshot condition) → push deferred,
      recorded here. GDAL 3.13.3 installed via brew (maintainer tool only, never a build/CI dep).

- [x] Reference HU8 identified + converted: 06010207 "Lower Clinch" (Norris Lake/Dam,
      Clinch tailwater, Melton Hill Lake, mouth at Kingston). Best Resolution product
      published 20231216, zip sha256 70580f6a...; converted via scripts/nhd_convert_gdb.sh
      (ogr2ogr, GeoJSONSeq RS=no, 6dp): 1,840 named flowlines (2.2MB) + 5,981 VAA rows
      (2.4MB) + 15 geometry-free waterbodies (2.4KB) + meta.json. Committed ec4f198.
- [x] Key data findings (drive the design, frozen in docs/NHD-CONVENTIONS.md):
      (1) the VAA table joins perfectly (1840/1840 pids) but ALL attribute columns are
      NULL in this product -> snapping + heuristics are primary, VAA recorded only;
      (2) flowdir==1 on every named feature -> geometry digitization is downstream;
      (3) FType 558 = Artificial Path (not 336 = Canal/Ditch);
      (4) NHDPoint has springs only, no dams -> dam termini detect via reservoir
      artpaths (wbarea -> named LakePond/Reservoir);
      (5) NHD leaves dams unmapped: Norris Dam gap measured 43.4m between the Norris
      Lake artpath end and the tailwater start -> narrow auditable dam-junction bridge
      (<=100m, lake-artpath endpoints only, 28 recorded in graph meta).
- [x] Engine (all zero-dep Node): nhd_lib.mjs, nhd_build_graph.mjs (endpoint-snap
      union-find @12m: 1,831 exact merges + 39 <=12m; 1,810 nodes; largest component
      1,756 edges; small components = genuine boundary fragments), nhd_snap_anchors.mjs
      (clinch-river ok 91.3m; emory-river far = gauge in neighboring HU8; 39 out-of-hu8),
      nhd_trace.mjs (termini specs dam:<name>/headwater/mouth/confluence/point; fork
      rule name-continuity -> longest-remaining-path DFS -> pid; 7 divergences logged
      on the Clinch; DP simplify 10->25->50m ladder + hard 80KB budget, actual 15.6KB),
      nhd_validate.mjs (B13 gate). Committed e1ecb96.
- [x] Clinch traced dam->mouth as ONE connected component: 184 edges, 125km, 595
      vertices, bounds [-84.5339,35.8632,-84.0752,36.2239]; upstream terminus 112m from
      geocoded Norris Dam; downstream terminus at the Kingston mouth; bbox disjoint from
      boone-tailwater + south-holston-river; all junction gaps 0m. B13 validation PASS
      (reach-clinch-river.validate.json committed). Bug found+fixed during validation:
      up-walk edges were emitted in walk orientation, producing a backtrack spur at the
      dam; now emitted stored-orientation (terminus-first output).
- [x] docs/NHD-CONVENTIONS.md written (schemas, tolerances, dam-bridge rule, trace CLI,
      budgets, B13 baseline, TIGER fallback policy, fan-out/audit/integration notes,
      reproducibility transcript). This file is the real lane deliverable.
- [x] Gates: prettier --check clean on scripts/nhd\_\*; no apps/web, packages/contracts,
      or apps/web/public changes (verified via git diff --name-only 1300194..HEAD).
      Push still deferred (no remote).


Base commit: `b301570` (user-supplied source snapshot; no upstream `.git` metadata or `origin` remote was present; local `origin/main` reference created for this isolated lane).

# SESSION HARDEN — origin host security (2026-09-11)

Clone: `/Users/ben/Downloads/TroutSite-harden-origin-host` (isolated lane).
Branch: `harden/origin-host`. Commit identity: `Bhodges42`.
Production status: **not live**. The owner must merge this branch and allow the
WinSW host's hourly self-deploy to ship it; all post-fix probes below are local.
The branch cannot be pushed from this workspace because the supplied snapshot has
no GitHub remote; no remote URL was invented.

## Hardening status

- [x] H1: optional `WATCHDOG_TOKEN` gates `/healthz` with a constant-time header
      comparison and generic 401; `/healthz` always sends `Cache-Control: no-store`.
- [x] H2: Fastify `onSend` security headers on all responses; CSP intentionally
      deferred because neither supplied web template contains a CSP meta tag.
- [x] H3: static-server final-path containment check, malformed-escape handling,
      GET/HEAD method allowlist, and traversal regression tests.
- [x] H4: Cloudflare rate-limit rule recorded as an owner action in `infra/RUNBOOK.md`.
- [x] New findings: generic portal auth errors, non-GET SPA fallback returning 200,
      direct `/v1/streams.json` exposure, and secondary-proxy transport-error
      disclosure fixed in code; full evidence is in `docs/HARDEN-AUDIT.md`.
- [ ] Owner actions: set `WATCHDOG_TOKEN` in WinSW/task environments and update
      `infra/watchdog.sh` / `infra/verify-site.sh`; create the Cloudflare rule;
      merge + self-deploy; remove/redact expired third-party JWTs in captured
      Tennessee fixtures and review their original history.

## Verification evidence

- Public before-fix probes on 2026-09-11: `/healthz` returned HTTP 200 with
  `conditions`/`jobs` telemetry and no `Cache-Control`; public responses lacked
  all five requested security headers; `POST /healthz` returned HTTP 200 SPA HTML;
  `/v1/streams.json` returned HTTP 200; missing and malformed portal auth returned
  different 401 bodies. Exact probes and responses: `docs/HARDEN-AUDIT.md`.
- Local after-fix API (`WATCHDOG_TOKEN=harden-local-token pnpm --filter api dev`):
  missing/wrong health token → `401 {"error":"unauthorized"}` plus all headers;
  correct token → `200` plus `Cache-Control: no-store`; `POST /healthz` → `405`
  with `Allow: GET, HEAD`; `/v1/streams` remains the contract route while
  `/v1/streams.json` → `404`.
- Local static-server before/after reproduction: base snapshot served
  `/%2e%2e%2fsecret.txt` and `/..%2fsecret.txt` as HTTP 200 with the outside
  file; hardened server returns HTTP 404 for both and for overlong nesting.
- Local secondary-origin proxy before/after reproduction: with the upstream
  unavailable, the base server returned `502 {"error":"portal API
  unreachable: connect ECONNREFUSED 127.0.0.1:1"}`; hardened server returns
  `502 {"error":"portal API unavailable"}` and logs transport detail only.
- `pnpm --filter api lint` — green.
- `pnpm --filter api test` — 21 files / 147 tests green.
- `pnpm --filter api build` — green.
- `pnpm -r test` — green across contracts (97), content (11), API (147),
  admin (19), and web (239 passed / 1 skipped).
- `pnpm -r lint` — the workspace gate remains blocked by the pre-existing
  unused `ButtonHTMLAttributes` import in `packages/ui` plus 48 pre-existing
  findings in `e2e/**` (browser globals, explicit `any`, and unused variables);
  those files and the UI package are outside this hardening lane.

# SESSION 3 — Product / UX / Growth (2026-09-08)

Base commit: `6d0befe` (origin/main, recovery push 2026-09-08).
Clone: `C:\Users\Benjamin\Projects\trout-s3` (own clone; shared tree never committed).
Scope: regulations UI, SEO infrastructure, hatch calendar, match-the-hatch imagery,
stocking page redesign, analytics. NOT touched: TennesseeMap/mapStyle/mapTokens
(Session 2 single-writer), geometry generators, ingest pipeline (Session 1).
Commit tags: `grow(...)` / `ux(...)`.

## Status log

- [x] Setup: clone at `6d0befe`, baseline gates (see below).
- [x] ux(hatch): expected-activity calendar — per-taxon 12-month strips with
      spans/peaks (`lib/hatchActivity.ts`, `useYearCharts`), activity-tinted
      month nav on chart pages, "expected {tier}" vocabulary everywhere, dead
      "Quiet month" state removed (pack fallback: taxa whose catalog season
      covers the month); map hatch halos light for ANY charted guidance
      (>=1, was >=2) + legend/help copy; drawer hatch outlook shows tier.
      HatchMonthControl: compass metaphor was already replaced by the month
      strip in a prior lane — no rework needed; recorded here as verified.
- [x] grow(regs): fishing-information pack expanded by subagent (18 items /
      24 waters; corrected Piney River DH removal effective 2026-08-01,
      Clear Creek name collision, Gatlinburg permit streams, Horse Creek
      rule; full docs/FISHING-INFORMATION-SOURCES.md) + Regulations page
      rebuilt data-driven on /content/fishing.json (structured answers,
      searchable per-water special regs, citations as text, license-only
      outbound CTA), regs card in RiverDrawer WaterTab + StreamDetailPage,
      menu position 3. fishing.json added to fixture generator.
- [x] grow(seo): build-time prerender (subagent prototype in throwaway
      trout-s3-proto, integrated) — `apps/web/scripts/prerender.mjs` emits
      555 route pages (147 waters, 12×12 charts, 103 taxa, 155 patterns,
      stocking, conditions, regulations) with per-route title/description/
      canonical/OG/JSON-LD + visible snapshot content, sitemap.xml (555
      URLs), robots.txt (noindex /logbook /settings). /fishing-info
      canonicalizes to /regulations; regs pages carry per-water rules from
      fishing.json; regions.ts regex fallback for Node 20 deploy hosts;
      deploy.sh runs prerender after the snapshot job. Verified by curl +
      browser (title swaps to client title after SPA boot; no hydration).
- [x] ux(hatch-key): discriminator drawings (DiscriminatorArt.tsx) at the
      tails/gills/shape steps — 2 vs 3 tails, lamellae/filaments/none,
      slender/robust — aria-hidden so button accessible names stay textual.
- [x] grow(imagery): subagent sourced 40 license-safe candidates
      (.atlas-src/imagery-candidates + PROVENANCE.csv, gitignored); 14
      visually approved by main session and shipped via
      scripts/intake-imagery.mjs (sharp, 960px/q78) to public/img/taxa;
      TaxonDetailPage renders photo + credit + license + source link
      (lib/taxonImages.ts, order/family keyed); committed provenance in
      docs/imagery-provenance.csv. Photos runtime-cached, NOT precached —
      line art remains the offline identity. .gitignore gained `.atlas-src/`.
- [x] ux(stocking): URL-driven sort (?sort= newest/oldest/water/county,
      un-countied rows sink) completing the recency-first redesign that
      already shipped (90-day default window, all-history, datePrecision
      honesty, search-first disclosure were in Chat A's scope-5 work).
- [x] grow(ops): Cloudflare Web Analytics as build-time opt-in —
      `analyticsBeaconPlugin` in vite.shared.ts injects the beacon ONLY when
      VITE_CF_ANALYTICS_TOKEN is set at build time (dev/fixtures/CI/privacy
      e2e builds contain zero analytics code — verified in dist); privacy
      page disclosure in the same change; token creation + WAF kill-switch
      (`hostname eq trout.tntechclimb.com` → Managed Challenge/Block; NOT
      applied) + ads-readiness checklist in docs/OPERATIONS-ANALYTICS.md.
      The token itself must be created in Benjamin's Cloudflare dashboard —
      the only remaining human step.

## Gates (final state)

- `pnpm --filter @trout/web typecheck` — clean.
- `pnpm --filter @trout/web test` — 183/183 (incl. rewritten fishing-info
  suite with fishing.json fetch mock, new stocking sort test).
- `pnpm --filter @trout/web build` + size budget — OK, 11.84 MB / 25 MB.
- `pnpm --filter @trout/web prerender` — 555 pages + sitemap + robots.
- e2e `--project=web` — 28/28 (three spec alignments: menu label
  "Regulations", regex button names after aria-hidden art, chart-page h1;
  fixture generator BWO corrected to 3 tails per the real pack — spec drift
  predating this session; honest score is 7/8, spec comment corrected).
- e2e `--project=marketing` — 14/14.
- Browser-verified (static-server on :58630, real snapshots): /regulations
  renders sections + per-water cards + filter; menu shows Regulations 3rd;
  /charts/tn-east-holston/5 shows activity summary, tinted month strip,
  year strips with span/peak labels; /hatch-key tails step shows the two
  drawings; /taxa/blue-winged-olive shows the Hexagenia photo + credit;
  /stocking?sort=location sorts and persists in URL; /regulations serves
  prerendered title/canonical then boots the SPA.

## Coordination notes

- Session 2 (map files untouched): halo intensity-by-abundance needs a
  mapStyle change (halo is a boolean feature-state today) — flagged as
  follow-up; stocking map-highlight remains the agreed stretch goal.
- Session 1: stocking UI built against the current contract (datePrecision
  honored); adapts trivially if their Task 5 contract changes land.
- Pre-existing issue found: e2e fixture BWO (tails 2) disagreed with the
  real pack (tails 3) — fixed in the fixture generator this session.
- Environment note: stockingMatch.test.ts reads public/v1 artifacts —
  fresh clones must generate snapshots (api seed+snapshots) or copy from
  the shared tree for that one test.

---

# SESSION 2 — map verification + cartography (2026-09-08) — base commit 6d0befe (rebased onto ea87fd8)

Base: `origin/main` = `6d0befe`; rebased onto `ea87fd8` (Session 1's integration) before final gates.
Clone: `C:\Users\Benjamin\Projects\trout-s2`. Scope: 7 confirmed current-geometry defects, first-pass
verify-vs-fix, flow-direction arrows, full-state QA view, mode-aware labels, legend final state.
All geometry fixes are generator scripts over NHDPlus HR takes (gitignored `.atlas-src` caches,
retrieved 2026-09-08); region artifacts + topology updated together, then integrate-verified-atlas.

## Verdict table (final)

| #    | Item                                       | Verdict                             | Commit (post-rebase sha) | Notes                                                                                                                                                                                                                                                                                                                                                                                   |
| ---- | ------------------------------------------ | ----------------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T1.1 | Collins River duplication                  | NOT-PRESENT at base (verified)      | geo(integrate)           | Existed in defect-era `6a44063`; dropped by conformance pass `a954d51`. Canonical == west-middle (sha `bc3a08ba…`), 28 parts, 0 overlap pairs ≥2km/150m. Judged visually: single corridor.                                                                                                                                                                                              |
| T1.2 | Duck River self-crossings                  | FIXED                               | geo(west)                | Root cause: same 60 NHD comids in BOTH Duck features + out-of-order welds. One 355-reach level-path chain (VAA hydroseq order) split at Columbia/Shelbyville/Normandy Dam pins. lower 99→1 part (241.94→140.15 km), tailwater 27→1 (43.28 km); 0 crossings/dupes.                                                                                                                       |
| T1.3 | Mill Creek + Cumberland + Obey confluence  | FIXED (source overturned the audit) | geo(west)                | Feature had unioned TWO different NHD "Mill Creek" level paths (24001400004894 Overton = the stocked water; 24001400012888 a different creek ~20km S). True mouth: 0m ON the Cumberland ~36.4919,-85.5642 (VAA network identity). 1 part / 32.89 km, hole gone. NOTE for content lane: `mill-creek-overton.yaml` gauge 03539778 is actually Clear Creek at Lilly Bridge.                |
| T1.4 | Obey River → Dale Hollow Lake              | FIXED                               | geo(west)                | `excludePool` had dropped the dam-face reach. Upstream end now 0m from the pool (was 936m); downstream 2m on Cumberland at Celina.                                                                                                                                                                                                                                                      |
| T1.5 | Woods Reservoir ↔ Elk ↔ Tims Ford        | FIXED (one documented gap)          | geo(west), geo(west) elk | VAA walk: Woods sits on Bradley Creek (level path 25000200006220) → new bradley-creek feature (0m through-pool) + catalog YAML; Elk↔Tims Ford dam-face 453m→0m. Elk lower's 1248m "network gap" was a FETCH-ENVELOPE artifact — take widened, now one chain 40.15km across the TN/AL line. Open: ~6km uncataloged NHD Elk arm Bradley-junction→Tims Ford pool (content-lane decision). |
| T1.6 | Tellico River/Lake area creeks             | FIXED                               | geo(east)                | tellico-river: one GNIS identity, 165 reaches → 1 chain 60.87km, lower end inside the pool via 55800 artificial paths (was 1.46km short, tiger-linear). citico-creek: 12 fragments → 1 chain 29.2km, mouth 4m to little-tennessee. Creek inventory of bbox+0.2° otherwise clean.                                                                                                        |
| T1.7 | Great Falls Lake orphan polygon            | FIXED                               | geo(west)                | Orphan part = shattered decimation artifact of NHDPlusID 24001400139760 (matches no real NHD polygon); kept faithful 24001400139538 (2→1 parts, 5.85 km²).                                                                                                                                                                                                                              |
| T2.1 | Norris fragmentation (G1)                  | VERIFIED-FIXED                      | —                        | 2 parts = exactly the 2 NHD GNIS 01269832 polygons (94.23 + 1.25 km², bbox parity, 0–1m vertex match); lake gate OK 99.7 km² (window 90–100). Judged visually.                                                                                                                                                                                                                          |
| T2.2 | Caney Fork split (G2)                      | VERIFIED-FIXED                      | —                        | upper ends inside Center Hill (5m), tailwater exits dam face (66m), chain connected end-to-end to the Cumberland. Judged visually.                                                                                                                                                                                                                                                      |
| T2.3 | Horse Creek gaps                           | FIXED                               | geo(east)                | First pass had fused the Greene County creek with an unrelated Washington County same-named creek (too-wide envelope). County-scoped take → 1 chain 17.88km (96% of source), mouth 6m to Nolichucky.                                                                                                                                                                                    |
| T2.4 | Brush Creek sprawl                         | FIXED                               | geo(east)                | Verified broken TIGER (4 fragments in a 0.7×2.6km strip). NHD true system = 6.75km chain, mouth 2m to French Broad.                                                                                                                                                                                                                                                                     |
| T2.5 | Little Sequatchie → Sequatchie → Nickajack | VERIFIED-FIXED                      | —                        | 0m exact shared vertex (35.08891,-85.57764); sequatchie→nickajack pool-margin 2682m (documented gate, OK). Judged visually.                                                                                                                                                                                                                                                             |
| T2.6 | Wolf River ↔ Dale Hollow                  | FIXED                               | geo(east)                | First pass trimmed at the pool margin. NHD full named Wolf = 1 chain 63.67km (98% of source), downstream end INSIDE dale-hollow-lake via artificial paths. True headwater terminus documented (continuation is different-named tributaries ≥425m away).                                                                                                                                 |
| T3   | Flow-direction arrows on selection         | SHIPPED + judged                    | map(flow), map(qa)       | `flowOrientation.json` derived from verified topology edges → dam anchors → lake in/out → 50m confluence graph (never vertex order, never hand-assigned): 54 high + 16 medium confident waters, 35 honest unoriented. Arrows only on selection, per-theme, unknown-safe. docs/flow-orientation.md.                                                                                      |
| T4   | Full-state waterways view + QA mode        | SHIPPED + judged                    | map(qa)                  | `?all=1` all-waterways toggle (roads-toggle pattern); `?qa=1` internal QA: client-side dangling/fragment/self-x/duplicate audit (361ms cached), red overlay + grouped panel, click-to-fly.                                                                                                                                                                                              |
| T5   | Mode-aware label hierarchy                 | SHIPPED + judged                    | map(labels,legend)       | Trout mode titles only catalog-trout waters (major statewide; warmwater/unknown stay corridor-only); all-fish adds major waters of any species. Judged: Memphis Wolf untitled in trout mode, titled in all-fish; Tennessee/Mississippi/Reelfoot untitled in trout mode.                                                                                                                 |
| T6   | Legend final state                         | SHIPPED + judged                    | map(labels,legend)       | Condition rows kept when assessed readings exist; else fishery-type grouping (Tailwater/Wild trout/Stocked/Other). Prefers Session-1 canonical `fishery` attribute (101/148), derivation only for uncovered waters. Legend judged in both themes (assessed state; the no-assessment state is unit-tested — fixtures carry assessments).                                                 |


## Gates (final, after rebase onto ea87fd8)

- validate-atlas PASS (148 features) · west-middle-validate PASS · validate-east-southeast PASS (0/0)
- continuity audit 40 unexpected multi-chunk (baseline 44; duck/tailwater/horse/elk-lower left the list)
- self-x + duplicate detectors: 0 findings on every touched water statewide
- pnpm --filter @trout/web typecheck clean · 234/234 tests (181 baseline + 53 new) · build 10.46MB ≤ 25MB
- fixtures:generate clean (148 streams, schema-validated) · integrate cross-checks catalog/geometry OK
- Visual gate: 38 dev-server captures (headless Chromium), 2 judge passes — 38/38 after Elk fix; both themes

## Notes for next sessions

- `?qa=1` audit is client-side over shipped geometry; its self-x/fragment counts use looser
  thresholds than the build-time detectors — expect more rows than docs/audits/S2-\*.

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
  (public/v1/\*\* is a gitignored deploy artifact).


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
cartography — TIGER 2024 All Roads → public/atlas/roads\*, fetch/build/validate
scripts, docs/roads-sources.md. License gate: PROCEED (public domain), see
docs/roads-sources.md. NOT touched: apps/web/src/**, e2e/**, packages/\*\*

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
- Scope kept: no apps/web/src/**, no e2e/**, no packages/\*\* touched.


---

# Session B — catalog & content corrections (2026-09-04)

Base commit: 826e5cb (codex/trout-fieldwork-20260904)

## Summary

Six commits on top of the integrated tree; content pack, fixtures, and served
snapshots all regenerated; every gate green (content validate/build/test 11/11,
web typecheck/test 122/122, web build + size budget OK). No files touched under
`apps/web/src`, map styles, or `e2e/`.

## Commit list

| commit    | subject                                                                             |
| --------- | ----------------------------------------------------------------------------------- |
| `186d41c` | content(tn-west): author honest hatch chart for the winter put-and-take region      |
| `ae09f77` | content(duck): point Normandy tailwater gauge below the dam (B13 follow-up)         |
| `2874208` | content(species): apply owner decisions 2026-09-04 (B08)                            |
| `2902c93` | content(docs): bookkeeping — paris alias resolved, duck/elk fragmentation rows done |
| `457d688` | content(fixtures): overlay pack catalog fields so fixtures:generate runs clean      |
| `62c5768` | content(fixtures): regenerate demo fixtures from the corrected catalog              |


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

| site         | name                              | lat/lon                  | drainage    | position vs dam                                                                                                                      |
| ------------ | --------------------------------- | ------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 03596000     | DUCK RIVER BELOW MANCHESTER, TN   | 35.47094 / −86.12164     | 107 mi²     | east (UPSTREAM) of the dam                                                                                                           |
| 03596460     | NORMANDY LAKE (LK)                | 35.46535 / −86.24860     | 195 mi²     | the reservoir                                                                                                                        |
| 03596470     | DUCK RIVER ABOVE NORMANDY, TN     | 35.46091 / −86.24527     | 196 mi²     | reservoir inlet                                                                                                                      |
| 03596500     | DUCK RIVER AT NORMANDY, TN        | 35.45730 / −86.25694     | 208 mi²     | just below dam — but NO current IV/DV data (checked: zero series in last 3 days, any parameter)                                      |

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
  - new `hatch/tn-west/` 12 month files + refreshed hatch dirs). Verified in
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

## Integration phase (2026-09-11, later — owner approved in-session)

Branch `geoconv/nhd-integration` (off `geoconv/nhd-fanout`). Policy (owner): swap every
catalog stream to a validated NHD trace; old linework only as fallback. Result: **105/105
catalog stream waters traced, validated, and shipped; 0 fallbacks**; lakes/ponds/points
unchanged. `rivers.geojson` = 1,998,062 B (≤2.0 MB gate); validate-atlas PASS; continuity
audit **0 unexpected multi-chunk** (baseline 40); typecheck clean; 239 web tests pass;
build + size budget OK (10.91/25 MB). Driver: `scripts/nhd_trace_catalog.mjs`; per-water
termini specs in `data/nhd/derived/trace-specs*.json`. Engine v2 addition (owner-approved,
flagged for GEOCONV-0): upstream `point:`/`confluence:` termini stops. Ceilings + dropped
throughLake slugs documented in FANOUT-REPORT.md §10. Commits: driver+specs `69b2833`,
assembled swap `6ed55ae`, docs closeout (this commit).
