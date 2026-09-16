# Atlas Validation Report

Pipeline: real Census TIGER/Line 2024 + USGS NHDPlus HR (see `docs/atlas-sources.md`).
Gate: `node apps/web/scripts/validate-atlas.mjs` (must PASS; exits non-zero on failure).

## Summary

| Check | Result |
|-------|--------|
| Input streams | 190 |
| Atlas features | 190/190 resolved |
| Geometry families | 147 selectable line features, 43 still-water/anchor features |
| WGS84 / lon-lat order | PASS (EPSG:4326, `coordinateOrder: longitude,latitude`, TN clip enforced) |
| Structural/coordinate errors | 0 (validator PASS) |
| Duplicate ids | 0 |
| Managed tailwaters | `boone-tailwater`, `ft-patrick-henry-tailwater`, `parksville-tailwater` reuse parent-river geometry (same water, recorded — not invented) |
| NHD provenance | Selectable line traces retain separate permanent/NHDPlus identifier sets; current rebuilt traces are raw-NHD/topology derived |
| Identity/topology gate | `node apps/web/scripts/audit-water-identities.mjs` — PASS; no duplicate ownership, synthetic bridge, invalid coordinate, or nondeterministic trace findings |

## Geometry rules (enforced by the atlas and trace gates)

- CRS: WGS84 (lon, lat) — MapLibre GL JS native.
- Separate source parts stay separate; never concatenated into artificial connectors.
- Whole-part rejection on malformed/out-of-Tennessee coordinates (never delete an
  interior point in a way that creates a connector).
- TIGER LINEARWATER preferred; NHD fills gaps only; AREAWATER polygons only for
  wide main stems missing from LINEARWATER.
- Raw NHD trace rebuilds follow directed endpoint topology, weld ordinary joins
  only within 15 m, preserve real gaps as separate parts, and never insert
  synthetic connectors or side branches.

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
node apps/web/scripts/audit-water-identities.mjs
# context byte-check
node apps/web/scripts/build-atlas-context.mjs && git status --short apps/web/public/atlas/
```
