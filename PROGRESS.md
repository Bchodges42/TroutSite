4e54c36

# STILLWATER lane — running status

Base: trout-stillwater@4e54c36 (integrated branch: Fieldwork UI + corrected
geometry + species catalog). Scope: still-water (lake/pond/reservoir)
polygons for the waterbody expansion — new geometry files per the CODEX lane's
waterbody contract (docs/waterbody-inventory.json +
docs/WATERBODY-GEOMETRY-CONTRACT.md in trout-fieldwork-20260904, pending),
apps/web/scripts tooling, docs/STILLWATER-COVERAGE.md. No UI/package file
edits; existing line geometry untouched; the 13 twra-winter-ponds IDs stay
stable (point → polygon upgrades staged in this clone).

## Status log

- [x] Setup: clone at 4e54c36, `pnpm install` green.
- [ ] `@trout/contracts` + `@trout/ui` builds.
- [x] Context read: 13 twra-winter-ponds anchors identified in
  `apps/web/public/atlas/rivers.geojson` (all Point, regionId tn-west,
  properties.id stable: shelby-farms-lake, cameron-brown-lake,
  edmund-orgill-lake, yale-road-park-lake, johnson-park-lake,
  valentine-park-pond, covington-fbc-pond, martin-city-pond,
  milan-city-pond, paris-city-park-lake, beech-lake, lake-graham,
  union-city-reelfoot-pond). Curated metadata in
  `packages/content/data/west-tn-ponds.json`. Existing major-lake polygons:
  `apps/web/public/atlas/lakes.geojson` (24 MultiPolygon lakes, TIGER
  AREAWATER provenance via build-lakes.mjs).
- [x] NHD access pattern confirmed: USGS NHDPlus HR MapServer
  (hydro.nationalmap.gov), layer 9 = NHDWaterbody, layer 8 = NHDArea
  (polygon layers; fetch-nhd-targets.mjs already uses layer 3 flowlines).
  Waterbody fcodes observed live: 39004/39009 Lake/Pond (many unnamed small
  park ponds present). Public domain.

## Phase A (DONE)

- [x] Scout per-water NHD polygon coverage for the 13 anchors → cached in
  apps/web/.atlas-src/stillwater/scout (service responses + summary.json);
  findings written to docs/STILLWATER-COVERAGE.md (identity verification via
  NHD names, OSM/Overpass centers, Wikipedia/TWRA research).
- [x] Extraction tooling: apps/web/scripts/fetch-stillwater-nhd.mjs
  (scout/extract modes, deterministic picks, TN clip, contract shape) and
  trace-stillwater.mjs (last-resort Esri-imagery digitizer with preview
  overlay) + build-stillwater.mjs (integrates extracts into rivers.geojson,
  promotes reference lakes).

## Phase B (DONE)

- [x] CODEX gate docs read (published 2026-09-04 in
  trout-fieldwork-20260904/docs): contract = rivers.geojson placement,
  space-delimited `source` string, required boolean `approximate`.
  Scope: 13 anchor upgrades + pickwick-lake (missing-polygon); 14 exists-ok
  reference lakes promoted from lakes.geojson per coordinator (B15).
- [x] NHD polygons integrated: beech-lake (named), lake-graham (verified
  unnamed nhdplusid 20000700115945), edmund-orgill-lake (Casper Lake),
  martin-city-pond, pickwick-lake (TN-clipped 139 km² reservoir).
- [x] Aerial traces integrated (approximate=true, source
  "aerial-trace twra-winter-ponds", preview-verified): shelby-farms-lake
  (Jones Pond), johnson-park-lake (W.C. Johnson Park, Collierville — the old
  downtown-Memphis anchor was ~20 km off), yale-road-park-lake,
  cameron-brown-lake, milan-city-pond, valentine-park-pond,
  covington-fbc-pond (FBC campus lake, 2105 TN-59), union-city-reelfoot-pond
  (pond alongside W Reelfoot Ave at the former packing plant).
- [x] paris-city-park-lake: NHD Green Acres Lake (aka Williams Lake) at full
  resolution; identity follow-up documented (Paris City Park alias).
- [x] 14 reference lakes promoted lakes.geojson → rivers.geojson (source
  census-areawater, approximate=false, inventory names); removed from the
  passive file (9 non-reference lakes remain passive).
- [x] riverIndex.json regenerated (120 entries, 0 point anchors).
- [x] Verify: validate-atlas PASS; typecheck green; 88/88 tests; build +
  size budget OK (dist 5.03 MB).
- [x] docs/STILLWATER-COVERAGE.md written (per-water table, identity
  evidence, checklist-format rows for transplant, handoff notes).

## Commits (this lane)

- waterbody(still): NHD-sourced polygons for beech/graham/orgill/martin
  lakes + pickwick-lake (+ fetch-stillwater-nhd/trace-stillwater/
  build-stillwater tooling)
- waterbody(still): traced polygons replace remaining 6 winter-pond Points
- waterbody(still): final three winter-pond polygons (paris, covington,
  union-city)
- waterbody(still): promote 14 reference lakes to interactive geometry
- waterbody(still): paris-city-park-lake at full NHD resolution
- waterbody(still): contract property sweep on still-water features
- docs: STILLWATER-COVERAGE.md (per-water coverage + checklist rows)

## Handoff / remaining (none blocking merge of geometry)

1. Catalog lane: YAML + streams.json + checklist transplant (rows in
   docs/STILLWATER-COVERAGE.md); confirm paris alias question.
2. Line lane: 92 line features still need contract `waterbodyType` +
   `approximate` (out of this lane's scope).
3. Optional trace polish noted in coverage doc (sub-z13 details only).

## Notes / decisions

- Staged per-water geojson live in apps/web/.atlas-src/stillwater/extract
  (git-ignored intermediates; reproducible from the committed scripts +
  scout cache). The committed deliverable is rivers.geojson per contract §3.
- Trace vertex lists + preview PNGs in .atlas-src/stillwater/trace; method
  documented in docs/STILLWATER-COVERAGE.md.
- lakes.geojson keeps non-reference lakes (boone, patrick-henry, great falls,
  normandy, parksville, reelfoot, woods) passive.

---

# Integrated lane progress (prior lanes, kept for reference)

Per-lane progress notes from merged lanes (GEO, SPECIES, TOPO). See COORDINATION.md in trout-backend for the full picture.
