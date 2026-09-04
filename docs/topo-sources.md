# Topo Sources

Canonical pipeline: real USGS 3DEP 1 arc-second DEMs via The National Map
(public domain). No synthetic terrain anywhere — contours and hillshade are
generated at build time from federal elevation data and ship fully locally
(zero third-party requests, same privacy spec as the rest of the atlas).

## What ships

All under `apps/web/public/atlas/topo/`:

- `contours-band0.geojson` — 100 m contours (statewide zooms). GeoJSON
  FeatureCollections, per-feature `{ H: <elevation m> }`, lon/lat at 5 decimal
  places, RDP-simplified (~0.0004° or coarser to fit budget). **B14: clipped
  to the real Tennessee boundary + ~3 km buffer** (see below) — pieces are
  closed rings where the contour closes inland, open arcs where it runs into
  the clip; both serialize as LineString / MultiLineString.
- `contours-band1.geojson` — 50 m contours (mid zooms).
- `contours-band2.geojson` — 20 m contours (high zoom only).
- `hillshade/{z}/{x}/{y}.webp` — **B14: transparent shadow-only relief**,
  256×256 RGBA WebP (lossless), zooms 7–11, only tiles intersecting the
  masked TN clip. RGB is black; alpha carries shadow depth only — 0 wherever
  illumination is neutral or lit, up to 235 in the deepest shadow. Blends
  cleanly onto a dark ground with no visible tile footprint.
- `manifest.json` — band/hillshade inventory (`generated`, per-band
  `file/intervalM/bytes/features`, hillshade `pattern/minZoom/maxZoom/tiles/
  bytes/encoding/maxAlpha/lossless`, mask provenance `source/bufferM`,
  top-level `minZoom/maxZoom/bytes`). The client probes it once; only when it
  resolves does the Topo entry appear in the basemap switcher.

Sizes (B14 rebuild, 2026-09): contours **11.67 MiB** (target ≤ 12 MB),
hillshade **12.83 MiB** across 531 tiles (target ≤ 60 MB) — **24.50 MiB
total** topo, all runtime-cached. Delta vs the pre-B14 assets: bands
−0.11 MiB, hillshade +7.32 MiB (alpha plane + lossless encode, 30% fewer
tiles), total +7.46 MiB — details in the B14 section below.

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

## B14 state clip + shadow-only alpha (2026-09 rebuild)

Both changes came out of the fieldwork report: the opaque grayscale hillshade
could not blend onto a dark ground (it rendered as a light rectangle), and the
contour bands carried acquisition-extent edges along the DEM rectangle that
rendered as a straight border in East TN at z8–9.

**State clip (both layers).** Before anything is derived, every working-grid
cell outside the real Tennessee boundary — `public/atlas/tn-boundary.geojson`,
a single closed 1,689-point ring — dilated by **3 km** is forced to NoData:

- The ring is rasterized with a scanline even-odd fill at working-grid
  resolution, then dilated with a separable morphological max-filter
  (per-row horizontal radius from the local meters-per-cell, fixed vertical
  radius). The metric is rectangular/Chebyshev: nominal 3 km reach, ≈ 4.2 km
  at the diagonals — inside the ~2–5 km buffer the task allowed. No polygon
  buffering or line-clipping library was added (no new dependencies).
- Masked cells behave exactly like DEM voids (NoData), so the existing
  gap-aware contour machinery applies: rings hugging the mask edge for ≥85%
  of their vertices are dropped, and surviving rings get **sustained
  (≥10-vertex, ~0.6 km) edge-hugging runs split off** — only the interior
  arcs are kept. That split is what removes the boundary-tracing closure
  segments the old rectangular acquisition edges came from. This rebuild cut
  1,015,240 boundary-tracing vertices and dropped 810 edge-hugging rings.
- Verified: all 579,822 contour coordinates sit within the TN bbox + 4 km
  (measured max reach outside the state ring: 4,156 m — buffer diagonal);
  the old rectangle edges (−90.6 / −81.45 / 36.75) no longer carry any
  contour geometry.
- Hillshade validity inherits the same mask (outside = transparent), so tiles
  over neighboring states are never written; kept tiles stay ≥90% covered by
  the masked mosaic, and signal-free tiles (zero shadow anywhere) are skipped.

**Shadow-only alpha (hillshade).** Shading math is unchanged (azimuth 315°,
altitude 45°, per-row cos-corrected gradients). The encoding changed from
grayscale-with-no-alpha to RGBA:

- Flat-ground illumination is shade 180/255 (√2/2). Pixels within ±2 of that
  are neutral → alpha 0. Shadow depth `s = (180 − 2 − shade)/180` maps to
  `alpha = 235 · s^0.8`; lit slopes (shade > 180) are transparent too.
- RGB is exactly black everywhere. Tiles are **lossless WebP**: at this
  content (constant black + a smooth alpha ramp) lossless costs the same
  bytes as lossy, and lossy dequantization was bleeding RGB=1 into fully
  transparent pixels. `manifest.hillshade` pins `encoding: "shadow-alpha"`,
  `maxAlpha: 235`, `lossless: true` (checked by `validate-topo.mjs`, which
  also requires `hasAlpha: true` on every tile and decodes a per-zoom spot
  sample for black-RGB + real alpha).
- The client keeps full control of relief strength via layer opacity; the
  asset leaves 20/255 alpha headroom at the deepest shadows.

**Before → after (bytes, exact):**

| Group | Before (9182429) | After (B14) | Δ |
|-------|------------------|-------------|---|
| contours-band0 | 4,198,230 | 4,209,952 | +0.3% |
| contours-band1 | 3,012,742 | 3,085,903 | +2.4% |
| contours-band2 | 5,143,434 | 4,943,996 | −3.9% |
| bands total | 12,354,406 (11.78 MiB) | 12,239,851 (11.67 MiB) | −0.9% |
| hillshade | 5,514,538 B / 767 tiles | 13,452,156 B / 531 tiles | +144% / −236 tiles |
| **topo total** | **17,869,380 (17.04 MiB)** | **25,692,007 (24.50 MiB)** | **+43.8%** |

Band sizes moved both ways because the state clip removed ~29% of the grid:
the 12 MB pressure is lower, so the escalation landed at **finer** RDP
tolerances than the pre-B14 build (band 0 0.00157° vs 0.0024°, band 1
0.00407° vs 0.00596°, band 2 0.00581° vs 0.008°) — fewer kilometers of
contour, but smoother. The hillshade growth is the alpha plane itself
(+lossless): still 21% of its 60 MB target, and 30% fewer tiles since the
masked-out neighborhoods are never written.

## Size targets vs actuals

| Group | Target | Fail limit (+20%) | Actual (B14) |
|-------|--------|--------------------|--------|
| Contour bands 0–2 | ≤ 12 MB | > 14.4 MB | **11.67 MiB** (4.01 + 2.94 + 4.71) |
| Hillshade z7–11 | ≤ 60 MB | > 72 MB | **12.83 MiB** (531 tiles: z8 4 · z9 17 · z10 92 · z11 418) |

At the guide's ~0.0004° RDP tolerance the bands measured 27.4 / 67.9 MB
(state-clipped; pre-B14 it was ≈164 MB over the full rectangle) — far past any
target. To honor the binding 12 MB size gate the builder escalates per-band
RDP tolerance (bands 1/2 first, band 0 last), each time re-building contours
from the raw grid at the coarser tolerance. B14 build settled at
band 0 → 0.00157°, band 1 → 0.00407°, band 2 → 0.00581° (all finer than the
pre-B14 0.0024 / 0.00596 / 0.008 because the clip shrank the contour mass).
The escalation is reported in the build summary; a future rebuild with a
larger budget would buy smoother high-zoom contours. z7 hillshade is empty by
the coverage/signal rules (8 candidates: slivers or signal-free); the client's
hillshade fades in from z8 regardless.

`validate-topo.mjs` warns between target and fail limit, fails beyond it, and
additionally gates: manifest-vs-reality byte/feature/tile counts, contour
coordinates inside the clip (+0.01°), elevation multiples per band, WebP magic
bytes on every tile, hillshade zooms 7–11 within web-mercator ranges, and the
B14 contract — `hillshade.encoding = "shadow-alpha"`, `maxAlpha = 235`,
`mask = { tn-boundary, bufferM 3000 }`, `hasAlpha: true` on all 531 tiles
(header metadata), plus a decoded per-zoom spot sample that must be
black-RGB with real shadow alpha.

## sharp on Windows (outcome)

`sharp@^0.35.4` installed clean via pnpm from its prebuilt Windows binary
(bundled libvips 8.18.6) — no build tools, no PNG fallback needed. It encoded
all 531 B14 hillshade WebP tiles (lossless RGBA shadow-alpha) with zero encode
failures; lossless was size-neutral here versus the lossy draft (see B14
section) and guarantees the zero-RGB contract the validator pins.
