# Topo Sources

Canonical pipeline: real USGS 3DEP 1 arc-second DEMs via The National Map
(public domain). No synthetic terrain anywhere — contours and hillshade are
generated at build time from federal elevation data and ship fully locally
(zero third-party requests, same privacy spec as the rest of the atlas).

## What ships

All under `apps/web/public/atlas/topo/`:

- `contours-band0.geojson` — 100 m contours (statewide zooms). GeoJSON
  FeatureCollections, per-feature `{ H: <elevation m> }`, lon/lat at 5 decimal
  places, RDP-simplified (~0.0004°).
- `contours-band1.geojson` — 50 m contours (mid zooms).
- `contours-band2.geojson` — 20 m contours (high zoom only).
- `hillshade/{z}/{x}/{y}.webp` — grayscale hillshade tiles (azimuth 315°,
  altitude 45° shading of the DEM), zooms 7–11, only tiles intersecting the TN
  clip.
- `manifest.json` — band/hillshade inventory (`generated`, per-band
  `file/intervalM/bytes/features`, hillshade `pattern/minZoom/maxZoom/tiles/
  bytes`, top-level `minZoom/maxZoom/bytes`). The client probes it once;
  only when it resolves does the Topo entry appear in the basemap switcher.

Sizes: contours **11.78 MB** (target ≤ 12 MB), hillshade **5.51 MB** across
767 tiles (target ≤ 60 MB) — **17.04 MB total** topo, all runtime-cached.

Delivery: **runtime-cached CacheFirst (`topo-cache`), never precached** —
`topo/**` is excluded from `precacheGlobPatterns` and must never count against
the install budget or the 25 MB dist gate (size budget prints it on its own
line).

## Reproduce (deterministic)

```bash
node apps/web/scripts/fetch-tn-dem.mjs --check   # offline cache check — all 30 tiles present, non-empty, TIFF magic OK (no network)
node apps/web/scripts/fetch-tn-dem.mjs           # one-time USGS DEM downloads (-> apps/web/.atlas-src/dem/, git-ignored)
node apps/web/scripts/build-topo.mjs             # contours + hillshade + manifest (-> apps/web/public/atlas/topo/)
node apps/web/scripts/validate-topo.mjs          # structural gate (must PASS)
node apps/web/scripts/validate-atlas.mjs         # run in the same breath (guide step 6)
```

`fetch-tn-dem.mjs` skips files that already exist (curl `-fL --retry 3`,
same pattern as `fetch-atlas-sources.mjs`).

## Data source + license

USGS 3DEP (3D Elevation Program) elevation via The National Map (TNM). USGS
federal data is public domain (US Government work) — no attribution required,
no usage restrictions.

- **TNM products API — VERIFIED working query (2026-09):**
  `https://tnmaccess.nationalmap.gov/api/v1/products?datasets=National%20Elevation%20Dataset%20(NED)&state=TN`
  The dataset tag on TNM is `National Elevation Dataset (NED)`. The guide's
  original slug `datasets=3DEP Products  1/3 arc-second` is dead — it returns
  0 results; do not resurrect it.
- **Direct staged URLs (what `fetch-tn-dem.mjs` actually fetches):**
  `https://prd-tnm.s3.amazonaws.com/StagedProducts/Elevation/1/TIFF/current/n{lat}w{lon}/USGS_1_n{lat}w{lon}.tif`
  where `{lat}` is the 2-digit degrees-north row (`n35`–`n37`; the name is the
  block's north edge) and `{lon}` the
  3-digit zero-padded degrees-west column (`w082`–`w091`).

## 1 arc-second vs 1/3 arc-second

The guide specified 1/3 arc-second 3DEP; the build uses **1 arc-second**
instead, verified by size:

| Source | Per-tile size | TN grid total |
|--------|---------------|----------------|
| 1/3 arc-second | 474 MB (HEAD-checked) | ~13 GB |
| **1 arc-second (shipped)** | ~57 MB | ~1.7 GB (30 tiles) |

At the shipped zoom range (z7–11, ~60 m working grid after aggregation) the
1″ source is indistinguishable in the final tiles, at ~1/8 the download.

## DEM tile grid (`apps/web/.atlas-src/dem/`, git-ignored)

Rows n35–n37 × columns w082–w091 cover the TN clip
(-90.6, 34.98 → -81.45, 36.75). Tile names give the **north** edge of the
block (`n36` spans lat 35–36, verified via the API's n35w082 bbox and by
decoding the GeoTIFFs), not the SW corner — an initial n34–n36 fetch was
corrected to n35–n37 and the unusable n34 tiles (lat 33–34, below the clip)
were deleted. Total 1,717,180,364 bytes (1.60 GB), 30/30 present, zero gaps;
per-tile MB (first fetch run of each tile):

| Row \ Col | w082 | w083 | w084 | w085 | w086 | w087 | w088 | w089 | w090 | w091 |
|-----------|------|------|------|------|------|------|------|------|------|------|
| n35       | 55.9 | 53.8 | 54.9 | 55.0 | 54.5 | 53.4 | 54.6 | 56.8 | 56.4 | 52.2 |
| n36       | 54.9 | 54.9 | 55.3 | 55.1 | 54.3 | 54.2 | 57.4 | 56.2 | 53.9 | 49.4 |
| n37       | 54.7 | 55.9 | 56.2 | 56.3 | 56.5 | 55.1 | 55.7 | 54.1 | 49.1 | 51.4 |

## Working grid

- DEM cells are aggregated **2×2 (mean)** to a ~60 m working grid before
  contour extraction and hillshade shading — halves the memory and smooths
  1″ sensor noise without visible loss at z ≤ 11.
- Cell spacing is **cos-corrected** per row (one arc-second of longitude
  shrinks with latitude), so contours don't stretch northward across the
  state.

## Size targets vs actuals

| Group | Target | Fail limit (+20%) | Actual |
|-------|--------|--------------------|--------|
| Contour bands 0–2 | ≤ 12 MB | > 14.4 MB | **11.78 MB** (4.00 + 2.87 + 4.91) |
| Hillshade z7–11 | ≤ 60 MB | > 72 MB | **5.51 MB** (767 tiles: z8 6 · z9 24 · z10 125 · z11 612) |

At the guide's ~0.0004° RDP tolerance the bands measured 19.9 / 41.1 / 102.5 MB
(≈164 MB total) — far past any target. To honor the binding 12 MB size gate the
builder escalates per-band RDP tolerance (bands 1/2 first, band 0 last), each
time re-building contours from the raw grid at the coarser tolerance:
band 0 → 0.0024°, band 1 → 0.00596°, band 2 → 0.008°. The escalation is
reported in the build summary; a future rebuild with a larger budget would buy
smoother high-zoom contours. z7 hillshade is empty by the ≥90%-coverage rule
(all ten z7 candidates are border slivers); the client's hillshade fades in
from z8 regardless.

`validate-topo.mjs` warns between target and fail limit, fails beyond it, and
additionally gates: manifest-vs-reality byte/feature/tile counts, contour
coordinates inside the clip (+0.01°), elevation multiples per band, WebP magic
bytes on every tile, hillshade zooms 7–11 within web-mercator ranges.

## sharp on Windows (outcome)

`sharp@^0.35.4` installed clean via pnpm from its prebuilt Windows binary
(bundled libvips 8.18.6) — no build tools, no PNG fallback needed. It encoded
all 767 hillshade WebP tiles (lossy, quality 75, grayscale) with zero encode
failures.
