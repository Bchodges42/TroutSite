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

## Phase A

- [ ] Scout per-water NHD polygon coverage for the 13 anchors + known still
      waters → docs/STILLWATER-COVERAGE.md.
- [ ] Extraction tooling: fetch-stillwater-nhd.mjs (name + envelope →
      NHD waterbody polygons, TN clip, contract-shaped GeoJSON).

## Phase B (blocked on CODEX docs: waterbody-inventory.json +
## WATERBODY-GEOMETRY-CONTRACT.md — polling)

- [ ] Polygons for every inventory entry typed lake/pond/reservoir.
- [ ] Verify: validate-atlas.mjs, typecheck, tests, build.
- [ ] Commits (waterbody(still): ...).

---

# Integrated lane progress (prior lanes, kept for reference)

Per-lane progress notes from merged lanes (GEO, SPECIES, TOPO). See COORDINATION.md in trout-backend for the full picture.
