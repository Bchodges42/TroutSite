# Atlas Validation Report

Generated: 2026-09-03 (pipeline rerun: `node apps/web/scripts/build-atlas.mjs`)

## Summary

| Check | Result |
|-------|--------|
| Input streams | 92 (expected 92) |
| Rivers features | 92 (expected 92) |
| Anchored streams (real coordinate preserved) | 8 / 8 anchors mapped |
| Point count per LineString | min 5, max 12 (spec 6–12 before simplification, ≥2 after) |
| All geometries valid LineString | PASS |
| WGS84 lon/lat bounds | all coords within TN bounds [-90.6,34.98]–[-81.45,36.75]: PASS |
| Tennessee boundary | 1 Polygon, 25 vertices, closed ring: PASS |
| Duplicate ids | PASS (0 duplicates) |
| rivers.geojson size | 130894 bytes (127.8 KB) |
| tn-boundary.geojson size | 2282 bytes (2.2 KB) |
| Total atlas size | 133176 bytes (130.1 KB) |
| rivers.geojson checksum | `4789dbaf1579b4b5` |
| tn-boundary checksum | `501dc06a5c882990` |

## Geometry details

- CRS: WGS84 (lon, lat) — MapLibre GL JS native.
- Per-feature properties: `id, name, regionId, gaugeIds, bounds [[minLon,minLat],[maxLon,maxLat]], labelAnchor [lon,lat], pointCount, lengthKm, anchored`.
- Simplification: Ramer-Douglas-Peucker ε=0.001° (~100 m), split at anchor to preserve real coordinates exactly (topology-preserving, no self-intersection for LineStrings).
- Clipping: all vertices clamped to TN bounds; no feature crosses outside.
- Determinism: seeded PRNG (FNV-1a → mulberry32) per stream id; sorted by id; reruns produce identical bytes for same inputs.

## Anchored streams

- `caney-fork-river` → `caney-fork-river` [anchor preserved] bounds [[-85.9970249994177,35.9798793006988],[-85.53178967769344,36.101143849422364]]
- `clinch-river` → `clinch-river` [anchor preserved] bounds [[-84.14150510293503,36.19324757921478],[-83.65000871912135,36.24624433901257]]
- `duck-river-tailwater` → `duck-river` [anchor preserved] bounds [[-86.4646406293549,35.28786366710618],[-85.74910900807639,35.63763923996514]]
- `elk-river` → `elk-river` [anchor preserved] bounds [[-86.36456388047017,35.059226184960124],[-85.80311733405487,35.23221819059115]]
- `ft-patrick-henry-tailwater` → `holston-river` [anchor preserved] bounds [[-83.70525354854155,36.03916746117894],[-83.1342564698373,36.13319549489865]]
- `hiwassee-river` → `hiwassee-river` [anchor preserved] bounds [[-84.90297495688607,35],[-83.99111760819086,35.12369921260021]]
- `south-holston-river` → `south-holston-river` [anchor preserved] bounds [[-82.59867544483234,36.486647055273444],[-81.48564846248792,36.5992910864135]]
- `watauga-river` → `watauga-river` [anchor preserved] bounds [[-82.31671046984629,36.23007752048661],[-82.06732594450355,36.555609527664814]]

Unanchored streams use region centroids (see `REGION_CENTROIDS` in build-atlas.mjs) with deterministic jitter.

## Tennessee boundary

- Vertices: 25
- Closed: yes
- Simplified from US Census TIGER/Line (public domain) — see `docs/atlas-sources.md`.

## Size budget impact

- Atlas precached via `vite.shared.ts` glob `atlas/**` (see below).
- Total atlas 130.1 KB counts toward the 25 MB precache limit in `apps/web/scripts/size-budget.mjs` (checked post-build).
- Current dist size must be verified with `pnpm --filter @trout/web build` after this pipeline.

## How to revalidate

```bash
node apps/web/scripts/build-atlas.mjs
# check outputs
ls -lh apps/web/public/atlas/
# verify 92 features
node -e "console.log(JSON.parse(require('fs').readFileSync('apps/web/public/atlas/rivers.geojson','utf8')).features.length)"
```
