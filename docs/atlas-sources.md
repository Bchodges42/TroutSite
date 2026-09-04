# Atlas Sources

Canonical pipeline: real Census TIGER/Line 2024 + USGS NHDPlus HR geometry
(both public domain). No synthetic coordinates anywhere.

## Reproduce (deterministic)

```bash
pnpm --filter @trout/content build        # regenerate streams.json if content changed
node apps/web/scripts/fetch-atlas-sources.mjs   # one-time Census downloads (-> .atlas-src/, git-ignored)
node apps/web/scripts/build-atlas-context-sources.mjs  # context intermediates: boundary/counties/states/places
node apps/web/scripts/fetch-nhd-targets.mjs     # one-time USGS NHDPlus HR fetches (-> .atlas-src/nhd/)
node apps/web/scripts/match-rivers-tiger.mjs    # match 92 streams to TIGER LINEARWATER (-> .atlas-src/out/)
node apps/web/scripts/merge-rivers.mjs          # assemble public/atlas/rivers.geojson (continuity-aware source selection)
node apps/web/scripts/close-residual-gaps.mjs   # join residual chunk gaps <= 1 km (logged to .atlas-src/out/residual-joins.json)
node apps/web/scripts/fix-caney-fork.mjs        # rebuild caney-fork-river from the NHD corridor
node apps/web/scripts/build-atlas-context.mjs   # slim + publish context files
node apps/web/scripts/merge-west-tn-points.mjs  # ALWAYS run last: restore the 13 point anchors (idempotent)
node apps/web/scripts/validate-atlas.mjs        # structural gate (must PASS)
node apps/web/scripts/audit-river-continuity.mjs # continuity gate: 0 unexpected multi-chunk line rivers (must PASS)
```

`apps/web/scripts/build-atlas.mjs` is the RETIRED synthetic generator and must
not be run — it would overwrite the real atlas with jitter geometry.

## Input datasets

| Dataset | Path | Records | License / Terms |
|---------|------|---------|-----------------|
| Trout streams pack | `packages/content/dist/pack/streams.json` | 92 TN streams | Internal Trout content pack (TWRA/USGS references per stream) |
| Census TIGER/Line 2024 LINEARWATER (TN, per-county) | `.atlas-src/shp/` (from `fetch-atlas-sources.mjs`) | 95 county files | Public domain (US Government work) |
| Census TIGER/Line 2024 AREAWATER (TN, per-county) | `.atlas-src/awshp/` | 95 county files | Public domain |
| Census cartographic boundaries (county 5m, state 5m, TN places 500k) | `.atlas-src/*.zip` | 95 counties, 50 states, TN places | Public domain |
| USGS NHDPlus HR named reaches | `.atlas-src/nhd/*.geojson` (from `fetch-nhd-targets.mjs`) | targeted waters | Public domain (USGS) |

## Rivers hydrography

- **Method:** per-stream match of TIGER LINEARWATER segments by normalized name
  (TIGER abbreviations expanded: `R/CRK/FRK/FK/BR`, `SULFUR→SULPHUR`,
  `WHITEOAK→WHITE OAK`), county discipline from content-catalog county hints,
  region windows to discard far same-named waters. USGS NHDPlus HR fills gaps
  where TIGER omits or fragments a reach; NHD parts duplicating TIGER coverage
  (>50% vertex overlap) are dropped (`nhd-dedup-N` in the source tag).
- **Geometry rules:** separate source parts stay separate — never concatenated
  into artificial connector lines. Whole-part rejection on malformed or
  out-of-Tennessee coordinates (never delete an interior point).
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
- **Resolved:** all 92/92 streams carry verified official geometry.
  `white-oak-creek` is matched to TIGER LINEARWATER through the
  `WHITEOAK → WHITE OAK` entry in the `WORD` normalization map in
  `merge-rivers.mjs`; do not remove that mapping.
- **Generated file:** `apps/web/public/atlas/rivers.geojson` (92/92 resolved).

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
