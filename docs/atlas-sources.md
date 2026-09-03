# Atlas Sources

Generated: 2026-09-03
Pipeline: `apps/web/scripts/build-atlas.mjs` (rerunnable: `node apps/web/scripts/build-atlas.mjs`)

## Input datasets

| Dataset | Path | Records | SHA256 (first 16) | License / Terms | Retrieved |
|---------|------|---------|-------------------|-----------------|-----------|
| Trout streams pack | `packages/content/dist/pack/streams.json` | 92 TN streams | `4960e0e901d5f575` | Internal Trout content pack (TWRA/USGS references per stream) | build-time (`pnpm --filter @trout/content build`) |
| Stream geo anchors (8 real points) | `apps/web/src/data/streams-geo.json` | 8 anchored streams | `bc025eb8423fb3d8` | Approximate public USGS gauge coordinates, bundled for offline "Near me" | repo-committed, 2026 |
| Region centroids (11) | inline in `build-atlas.mjs` (`REGION_CENTROIDS`) | 11 TN regions | n/a (deterministic code) | Derived for offline hydrography synthesis | 2026-09-03 |
| Tennessee boundary | inline in `build-atlas.mjs` | 1 polygon (25 vertices) | n/a | Simplified from US Census TIGER/Line shapefiles (public domain) | 2026-09-03 |

## Tennessee boundary source

- **Origin:** US Census Bureau TIGER/Line Shapefiles — State boundaries (public domain, https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html)
- **Simplification:** Hand-simplified and Douglas-Peucker (ε≈0.05°) to 25 vertices, closed ring, clipped to TN bounds [`-90.6,34.98`]–[`-81.45,36.75`]. Topology-preserving (no self-intersection, single exterior ring).
- **License:** Public domain (US Government work).
- **Checksum (generated file):** `501dc06a5c882990`

## Rivers hydrography source

- **Method:** Deterministic synthetic hydrography-like LineStrings (6–12 points each, WGS84 lon/lat).
  - Seeded PRNG: FNV-1a hash of stream `id` → mulberry32; point count = `6 + (hash % 7)`.
  - Base location: real anchor `[lon,lat]` from `streams-geo.json` when available (8 streams), otherwise region centroid for `regionId`.
  - Hydrography shape: along-bearing displacement (bearing = region base ±25°) with sinusoidal meander (amp 0.008–0.022°, freq 0.7–1.6 rad) and micro-jitter ±0.003°, then Ramer-Douglas-Peucker simplification ε=0.001° (~100 m) split at anchor to preserve it exactly, clipped to TN bounds.
  - Real anchors are preserved exactly at the center vertex (no simplification across the anchor).
- **Why synthetic:** Requirement is offline-first with no external tile servers; true hydrography (NHDPlus HR) is >50 MB and network-dependent. Synthetic lines give plausible statewide coverage, deterministic reruns, and offline MapLibre rendering at <250 KB.
- **Future upgrade path:** Replace `generateLineForStream()` with NHDPlus HR LineStrings clipped to TN, re-run pipeline; GeoJSON schema is stable (`properties: id, name, regionId, gaugeIds, bounds, labelAnchor, pointCount, lengthKm, anchored`).
- **Generated file:** `apps/web/public/atlas/rivers.geojson` — `4789dbaf1579b4b5` (130894 bytes, 92 features, 127.8 KB)
- **License of generated geometry:** Synthetic — no upstream hydrography license encumbrance; anchor coordinates are approximate public USGS gauge locations.

## External references (per-stream official sources)

Each stream in `streams.json` carries `officialSources` URLs (TWRA, USGS Water Data, TVA lake levels, NPS). Those URLs are the canonical regulatory/flow authorities; this atlas carries no flow or stocking data, only geometry.

## Reproducibility

```bash
pnpm --filter @trout/content build   # regenerate streams.json if content changed
node apps/web/scripts/build-atlas.mjs
# outputs are byte-deterministic for same inputs (sorted by id, seeded RNG)
```

Checksums are SHA256 first 16 hex chars of the file on disk at generation time.
