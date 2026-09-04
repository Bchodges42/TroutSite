# Atlas Validation Report

Pipeline: real Census TIGER/Line 2024 + USGS NHDPlus HR (see `docs/atlas-sources.md`).
Gate: `node apps/web/scripts/validate-atlas.mjs` (must PASS; exits non-zero on failure).

## Summary

| Check | Result |
|-------|--------|
| Input streams | 92 |
| Rivers features | 92/92 resolved (91 pre White Oak fix; `white-oak-creek` resolved via WHITEOAK→WHITE OAK normalization) |
| Geometry families | 89 `MultiLineString`, 3 `MultiPolygon` (wide-water AREAWATER fallbacks) |
| WGS84 / lon-lat order | PASS (EPSG:4326, `coordinateOrder: longitude,latitude`, TN clip enforced) |
| Structural/coordinate errors | 0 (validator PASS) |
| Duplicate ids | 0 |
| Managed tailwaters | `boone-tailwater`, `ft-patrick-henry-tailwater`, `parksville-tailwater` reuse parent-river geometry (same water, recorded — not invented) |
| NHD dedup | NHD parts duplicating TIGER coverage dropped per-part (e.g. East Fork Stones: 15 NHD parts deduped, 11 TIGER parts kept) |

## Geometry rules (enforced in `merge-rivers.mjs`)

- CRS: WGS84 (lon, lat) — MapLibre GL JS native.
- Separate source parts stay separate; never concatenated into artificial connectors.
- Whole-part rejection on malformed/out-of-Tennessee coordinates (never delete an
  interior point in a way that creates a connector).
- TIGER LINEARWATER preferred; NHD fills gaps only; AREAWATER polygons only for
  wide main stems missing from LINEARWATER.

## Per-feature properties

`id, name, regionId, gaugeIds, bounds, labelAnchor, source, crs, coordinateOrder,
partCount, vertexCount`.

## Tennessee boundary / context

- Census cartographic boundaries, slimmed by `build-atlas-context.mjs`
  (same geometry, `{name, state}` props, 4dp coordinates, compact JSON).
- Places: 71 city/town/water centroids, zoom-gated in the client
  (cities always, towns z≥7, water z≥7.5).

## How to revalidate

```bash
node apps/web/scripts/validate-atlas.mjs
# context byte-check
node apps/web/scripts/build-atlas-context.mjs && git status --short apps/web/public/atlas/
```
