# Atlas Sources

Canonical pipeline: real Census TIGER/Line 2024 + USGS NHDPlus HR geometry
(both public domain). No synthetic coordinates anywhere. Selectable line-water
identity is authored in the stream YAML and trace topology is recorded separately
from the geometry artifact.

## Reproduce (deterministic)

```bash
pnpm --filter @trout/content build        # regenerate streams.json if content changed
node apps/web/scripts/fetch-atlas-sources.mjs   # one-time Census downloads (-> .atlas-src/, git-ignored)
node apps/web/scripts/build-atlas-context-sources.mjs  # context intermediates: boundary/counties/states/places
node apps/web/scripts/fetch-nhd-targets.mjs     # one-time USGS NHDPlus HR fetches (-> .atlas-src/nhd/)
node apps/web/scripts/match-rivers-tiger.mjs    # historical source-matching intermediate (-> .atlas-src/out/)
node apps/web/scripts/merge-rivers.mjs          # assemble public/atlas/rivers.geojson (continuity-aware source selection)
node apps/web/scripts/close-residual-gaps.mjs   # join residual chunk gaps <= 1 km (logged to .atlas-src/out/residual-joins.json)
node apps/web/scripts/fix-caney-fork.mjs        # rebuild caney-fork-river from the NHD corridor
node apps/web/scripts/build-atlas-context.mjs   # slim + publish context files
node apps/web/scripts/merge-west-tn-points.mjs  # ALWAYS run last: restore the 13 point anchors (idempotent)
# B15 waterbody expansion (optional, append-only):
ONLY=<id> node apps/web/scripts/build-missing-rivers.mjs  # or no ONLY for all 8 missing-line rivers
node apps/web/scripts/audit-selectable-rivers.mjs # compare the catalog with local statewide TIGER names
node apps/web/scripts/build-selectable-river-additions.mjs # append curated exact-GNIS additions
node apps/web/scripts/regenerate-river-index.mjs # refresh camera/label bounds and zoom tiers
node apps/web/scripts/validate-atlas.mjs        # structural gate (must PASS)
node apps/web/scripts/audit-river-continuity.mjs # continuity/gap gate (must PASS)
node apps/web/scripts/audit-water-identities.mjs # identity/topology/trace gate (must PASS)
```

`apps/web/scripts/build-atlas.mjs` is the RETIRED synthetic generator and must
not be run — it would overwrite the real atlas with jitter geometry.

## Input datasets

| Dataset                                                              | Path                                                      | Records                           | License / Terms                                               |
| -------------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------- |
| Selectable-water catalog                                             | `packages/content/streams/tn/*.yaml`                      | 190 TN waters                     | Internal Trout content pack (TWRA/USGS references per stream) |
| Census TIGER/Line 2024 LINEARWATER (TN, per-county)                  | `.atlas-src/shp/` (from `fetch-atlas-sources.mjs`)        | 95 county files                   | Public domain (US Government work)                            |
| Census TIGER/Line 2024 AREAWATER (TN, per-county)                    | `.atlas-src/awshp/`                                       | 95 county files                   | Public domain                                                 |
| Census cartographic boundaries (county 5m, state 5m, TN places 500k) | `.atlas-src/*.zip`                                        | 95 counties, 50 states, TN places | Public domain                                                 |
| USGS NHDPlus HR named reaches                                        | `.atlas-src/nhd/*.geojson` (from `fetch-nhd-targets.mjs`) | targeted waters                   | Public domain (USGS)                                          |

## Rivers hydrography

- **Historical source method:** per-stream match of TIGER LINEARWATER segments by normalized name
  (TIGER abbreviations expanded: `R/CRK/FRK/FK/BR`, `SULFUR→SULPHUR`,
  `WHITEOAK→WHITE OAK`), county discipline from content-catalog county hints,
  region windows to discard far same-named waters. USGS NHDPlus HR fills gaps
  where TIGER omits or fragments a reach; NHD parts duplicating TIGER coverage
  (>50% vertex overlap) are dropped (`nhd-dedup-N` in the source tag).
- **Geometry rules:** separate source parts stay separate — never concatenated
  into artificial connector lines. Whole-part rejection on malformed or
  out-of-Tennessee coordinates (never delete an interior point).
- **Selectable trace method (current):** every line water has a `hydroIdentity`
  block in its canonical YAML (`gnisIds`, `huc8s`, optional county and
  receiving-water qualifiers). `build-selectable-water-traces.mjs` uses those
  identities against the committed raw NHD graphs, follows directed endpoint
  topology, and preserves disconnected components as separate parts. Endpoint
  welds are limited to ordinary source joins of at most 15 m; no synthetic
  connectors, side branches, or geometry bridges are emitted. Permanent
  identifiers and NHDPlus identifiers remain separate provenance fields.
- **Continuity (2026-09-04):** `merge-rivers.mjs` picks, per stream, the most
  continuous REAL source combination (TIGER+NHD blend vs NHD-only vs
  TIGER-only — fewest endpoint-stitched 1 km chunks; every candidate is real
  geometry, so no fabrication is involved; the chosen combination is logged in
  the source tag, e.g. `sel:tiger+nhd->nhd-hr`). `close-residual-gaps.mjs`
  then joins chunk endpoints across residual gaps of at most 1 km — and only
  where NHD/TIGER carry no intermediate segment (larger gaps are left open and
  documented in `docs/CONTINUITY-AUDIT.md`; each join is tagged `residual-join`
  in the feature's `source` and logged with its coordinates and gap size).
  The continuity gate `audit-river-continuity.mjs` fails CI when a line river
  renders as 2+ chunks unless the stream is allowlisted with a documented
  reason (deliberate catalog joins, or gaps un-fillable from public sources).
- **Wide water:** main stems missing from LINEARWATER fall back to TIGER
  AREAWATER polygons (`MultiPolygon`, `tiger-area` source).
- **Per-feature properties:** `id, name, regionId, gaugeIds, bounds, labelAnchor,
source, crs (EPSG:4326), coordinateOrder (longitude,latitude), partCount,
vertexCount`.
- **Managed reaches:** `boone-tailwater`, `ft-patrick-henry-tailwater`,
  `parksville-tailwater` reuse their parent river's real geometry (same water,
  different managed reach — recorded in `match-report.json` `parent`, not
  invented). Reach windows for tailwaters and catalog-bracketed reaches
  (Norris/Wilbur/South Holston/Boone/Fort Patrick Henry/Normandy/Tims Ford/
  Parksville/Dale Hollow/Percy Priest dams) live in
  `apps/web/scripts/atlas-reach-gates.mjs` with per-bound provenance (USGS
  monitoring-location coordinates, TIGER AREAWATER reservoir footprints);
  gates keep only source parts lying entirely inside the window. See
  `docs/GEO-AUDIT.md` for the 2026-09-04 audit that introduced them.
- **Tennessee-only:** NHDPlus HR is a national layer, so envelope fetches near
  state lines return out-of-state flowlines; `merge-rivers.mjs` keeps an NHD
  part only when every vertex is inside the Tennessee boundary polygon
  (whole-part rejection — never delete an interior point).
- **Resolved:** all 190/190 selectable waters carry verified official geometry.
  `white-oak-creek` is matched to TIGER LINEARWATER through the
  `WHITEOAK → WHITE OAK` entry in the `WORD` normalization map in
  `merge-rivers.mjs`; do not remove that mapping.
- **Generated file:** `apps/web/public/atlas/rivers.geojson` (190/190 resolved;
  147 selectable line waters and 43 still-water/anchor features).

## Historical B15 missing-line river lane (waterbody expansion, 2026-09-04)

The inventory (`docs/waterbody-inventory.json`, authoritative for ids and
names) listed 8 rivers with `geometryStatus: 'missing-line'`. At that point
these ids were NOT in the content catalog (the catalog lane owned
`packages/content`), so
`merge-rivers.mjs` — which iterates catalog streams — cannot emit them. The
new `build-missing-rivers.mjs` step APPENDS their features to
`rivers.geojson` instead: it never modifies an existing feature and is
idempotent (ids already present are skipped; `ONLY=<id>` runs one river).

- **Fetch:** `fetch-nhd-targets.mjs` gained 10 corridor targets (one or two
  per river, envelopes sized to each water's full Tennessee extent from the
  inventory's `approximateLocation` + `countyOrRegion`). Wide rivers split
  into two overlapping envelopes (tennessee-river, cumberland-river) to stay
  under the USGS processing window that 504'd the wide Clinch fetch; the
  overlap is safe because phase-2 geometry is fetched by OBJECTID, and
  duplicate features are deduped by NHD key at assembly. The mississippi
  envelope hugs the state line (`-90.35,34.98,-89.40,36.60`) so Arkansas/
  Mississippi water is never fetched. 2026-09-04 fetches: one 504
  (tennessee-river-east), cleared by the script's built-in backoff.
- **Assembly discipline** (mirrors `merge-rivers.mjs`): exact-GNIS-name takes
  (sibling forks — Little Buffalo, South/North Fork Obion, Rutherford Fork,
  South/North Fork Holston — stay out), whole-part Tennessee filter against
  `public/atlas/tn-boundary.geojson`, same CLIP rectangle and RDP 0.00012.
- **Welding:** unlike `merge-rivers.mjs`, parts whose endpoints coincide are
  welded into chains (exact match, or within 0.0005 deg ≈ 50 m — the NHD
  4dp-fetch jitter; real gaps are orders of magnitude larger). No coordinates
  are invented: welding only joins existing endpoints. This matters because
  Kentucky Lake / Cherokee Lake / Old Hickory reaches are chains of 2-vertex
  `55800` waterbody connectors that the contract forbids leaving fragmented
  ("connected reaches should not be split merely to simplify files").
- **Mississippi state-line corridor:** the feature is the mainstem ON the
  boundary only. An out-of-state vertex is allowed at most 4000 m beyond the
  boundary (measured 2026-09-04: 168/225 out-of-test mainstem vertices sit
  within 1 km; everything beyond 4 km is Kentucky water north of the slanting
  border or Mississippi water south of the SW corner) plus a hard
  `lat <= 36.51` cap (the KY line crosses the channel at ~36.50 per
  tn-boundary vertex -89.539,36.498). Only 'Mississippi River'-named
  flowlines are fetched, so Arkansas backwater lakes are never candidates.
- **Contract properties:** every feature carries `id` (= inventory
  `proposedFeatureId`, never renamed), `name` (= `normalizedName`),
  `waterbodyType: 'river'`, `source: ['nhd-hr']`, `approximate: false`,
  `labelAnchor` (middle vertex of the longest member), `bounds`,
  `crs`, `coordinateOrder`, `partCount`, `vertexCount`.
- **Results** (per river; 1 feature each, `nhd-hr`):

| id                        | members | verts | bbox [W S E N]                    | note                                                                                                                                                 |
| ------------------------- | ------- | ----- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| mississippi-river         | 2       | 278   | -90.3052 34.9860 -89.4180 36.5082 | state-line corridor; member 2 = Tiptonville bend (KY Bend exclave notch)                                                                             |
| obion-river               | 2       | 258   | -89.6527 35.9073 -88.9407 36.2819 | ~110 m NHD network gap at lat 35.988                                                                                                                 |
| hatchie-river             | 1       | 754   | -89.7039 35.2753 -88.9490 35.6519 | continuous headwaters-to-mouth                                                                                                                       |
| wolf-river-west-tennessee | 1       | 449   | -90.0620 35.0248 -89.2388 35.2025 | Fayette Co → Memphis mouth (distinct from wolf-river-fentress)                                                                                       |
| tennessee-river           | 3       | 1069  | -88.3182 35.0003 -83.8507 36.6722 | Knoxville→Nickajack; Pickwick→KY line; 4-v KY-line sliver. The Alabama detour between the TN reaches is genuine geography                            |
| cumberland-river          | 1       | 795   | -87.9056 36.1355 -85.5012 36.6631 | KY line (Clay Co) → KY line (Dover/Lake Barkley)                                                                                                     |
| buffalo-river             | 2       | 641   | -87.8647 35.3114 -87.2912 35.9963 | headwater member ends at lat 35.364; named flowline has no geometry 35.364-35.389 in this extract (verified: zero named features intersect the band) |
| holston-river             | 1       | 494   | -83.8578 35.9586 -82.6088 36.5479 | Kingsport → Knoxville confluence incl. Cherokee Lake connectors                                                                                      |

- **Historical generated file:** this 2026-09-04 append-only result was 113
  features (105 pre-existing + 8 appended). The current selectable atlas is
  rebuilt and published by the later trace pipeline described below.
- **Handoffs:** catalog YAML rows for the 8 ids = catalog lane; regenerate
  `apps/web/src/features/map/riverIndex.json` from the approved geometry =
  UI/integration lane (contract step 5; UI files untouched here).

## Statewide selectable-river expansion (2026-09-15)

The selectable/searchable source of truth is one validated YAML record per
water in `packages/content/streams/tn`. Geometry is joined by the same stable
id in `public/atlas/rivers.geojson`; `riverIndex.json` is generated from that
atlas for camera bounds, anchors, and label zoom policy.

`atlas-sources/selectable-river-additions.json` records the reproducible audit
decision for 40 additions. Inclusion requires a stable name plus an
unambiguous GNIS identity or tightly bounded reach, then combines basin role,
NHD order, mapped extent, access/recreation or fishing relevance, and regional
coverage. No single length cutoff is used, trout status is not required, and
generic short named creeks are not promoted automatically.

- Exact GNIS ids prevent same-name waters from being merged. In particular,
  `piney-river-hickman` is distinct from the existing Rhea County Piney River.
- All 40 additions now have canonical hydro identities and deterministic trace
  recipes. Their approved traces use committed raw NHD topology where available;
  the documented Conasauga identity exception retains its reviewed TIGER
  geometry when the raw extract has only the local Conasauga Creek identity.
- Four retained official NHD extents have documented source discontinuities in
  `CONTINUITY-AUDIT.md`; no synthetic lines bridge those gaps.
- `labelMinZoom` (7.5, 8.5, or 9.5) controls prominence independently of
  catalog membership. Every addition remains searchable/selectable at all
  times even when its label is suppressed at statewide zoom.
- Deliberately unresolved identities are recorded in the manifest: secondary
  same-name North/Middle Fork Forked Deer GNIS records, the Loosahatchie River
  Drainage Canal, and the out-of-state Tuscumbia River artifact.

## Selectable trace recipes and identity audit (2026-09-16)

`apps/web/atlas-sources/selectable-water-traces.json` is the deterministic review
recipe for the 147 selectable line waters. It contains source permanent-identifier
seeds, upstream/downstream boundaries, reviewed name transitions, shared-reach
allowances, and a short review note. It intentionally does not duplicate the
identity fields in the YAML catalog.

The normal content gate runs `audit-water-identities.mjs`. It checks one-to-one
catalog/recipe/atlas coverage, GNIS/HUC-to-raw-reach agreement, duplicate ownership,
directed route topology, finite coordinates, the 15 m weld ceiling,
simplification metadata, and two repeated builder fingerprints. Repeated NHD
names are reported for review rather than silently merged. Genuine source gaps
remain visible and are documented by the continuity audit.

`conasauga-river` is the documented source exception: its catalog identity is the
TIGER GNIS record while the committed raw NHD extract contains only the local
Conasauga Creek identity. The trace retains the reviewed TIGER geometry and the
exception is surfaced by the identity audit.

## Tennessee boundary / counties / states / places

- **Origin:** Census cartographic boundary files (public domain).
- **Published files are slimmed** by `build-atlas-context.mjs`: same geometry,
  trimmed properties (`{name, state}`), coordinates rounded to 4dp, compact JSON.
- **Intermediates:** `build-atlas-context-sources.mjs` generates
  `out/tn-boundary.geojson` (TN), `out/states-context.geojson` (8 bordering
  states), `out/tn-counties.geojson` (95 counties), and `out/places.json` from
  the cb_ 1:5m cartographic files — plain Node, deterministic, no mapshaper.
- **Places:** 71 curated labels from `cb_2024_47_place_500k` (six principal
  cities + 65 towns; label points are deterministic scanline interior points,
  4dp, self-checked for polygon containment); rendered zoom-gated (cities
  always, towns z≥7; a `water` kind is supported by the client but currently
  unused).

## External references (per-stream official sources)

Each stream in `streams.json` carries `officialSources` URLs (TWRA, USGS Water
Data, TVA lake levels, NPS). Those URLs are the canonical regulatory/flow
authorities; this atlas carries no flow or stocking data, only geometry.
