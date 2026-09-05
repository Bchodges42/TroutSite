# Roads Sources (B12 — contextual cartography)

Canonical pipeline: real Census TIGER/Line 2024 **All Roads** (ROADS layer,
per-county shapefiles) — public domain. Context basemap only, not navigation:
roads are welded same-name chains, LOD-classed, RDP-simplified, and ship fully
locally (same-origin, zero third-party requests, same privacy spec as the rest
of the atlas).

## License verdict (recorded BEFORE any build — 2026-09-04)

**VERDICT: PROCEED — public-domain source confirmed.**

- **Chosen source:** U.S. Census Bureau TIGER/Line 2024, ROADS ("All Roads")
  layer. Works of the U.S. Federal Government are not copyrightable
  (17 U.S.C. § 105); the Census Bureau distributes TIGER/Line free of charge
  and third parties (EPA, USDA, state data portals) republish TIGER derivatives
  as public domain. This is the same verdict the atlas already relies on for
  its water geometry (`docs/atlas-sources.md`: TIGER LINEARWATER/AREAWATER
  "Public domain (US Government work)"), so the roads layer introduces **no new
  license obligations**. No attribution is legally required; the map still
  carries a courtesy attribution ("Roads: US Census TIGER" — see the handoff
  below). One non-copyright restriction honored: the Census name/trademark is
  not used in any way that implies endorsement.
- **Product page:** https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html
  (TIGER/Line Shapefiles, 2024 vintage).
- **Direct fetch URLs** (what `fetch-roads.mjs` downloads, 95 files):
  `https://www2.census.gov/geo/tiger/TIGER2024/ROADS/tl_2024_47NNN_roads.zip`
  for TN county FIPS `47001..47189` (odd numbers). Each zip carries a full
  shapefile set (`.shp/.shx/.dbf/.prj`).
- **Rejected: OpenStreetMap.** OSM's planet/extract data is licensed under the
  Open Database License (ODbL 1.0): it requires visible attribution **and**
  share-alike on derived databases. Share-alike exceeds the owner's bar
  (approval was conditional on public-domain/CC0, "no terms beyond a simple
  attribution"), so OSM is excluded from this layer in any form — including as
  a fallback if TIGER proved too sparse. **Sparseness finding: none.** The
  TIGER 2024 ROADS layer covers all 95 TN counties with every public through
  road plus local streets, alleys, service drives, and trails (MTFCC S-codes),
  which is ample for a z≤11 context basemap.
- **CC0 alternative considered, not needed:** no CC0 road source of comparable
  completeness exists for Tennessee; TIGER already satisfies the gate.

## Input datasets

| Dataset | Path | Records | License / Terms |
|---------|------|---------|-----------------|
| Census TIGER/Line 2024 ROADS (TN, per-county) | `.atlas-src/roads/` zips → `.atlas-src/roadshp/` (from `fetch-roads.mjs`) | 95 county files | Public domain (US Government work, 17 U.S.C. § 105) |

## Reproduce (deterministic)

```bash
node apps/web/scripts/fetch-roads.mjs [--check]   # one-time Census downloads (-> .atlas-src/, git-ignored)
node apps/web/scripts/build-roads.mjs             # clip + weld + LOD + simplify (-> apps/web/public/atlas/roads-*)
node apps/web/scripts/validate-roads.mjs          # structural gate (must PASS)
```

## Build method

- **LOD classes (by TIGER MTFCC):**
  - `major` — S1100 (primary), S1200 (secondary): interstates, US and state
    highways.
  - `mid` — S1400 (local streets/city roads), S1630 (ramps), S1640 (service
    drives).
  - `minor` — everything else (S1500 vehicular trails, S1710/S1730/S1740
    walkways/pedestrian trails/stairways, S1750 alleys, S1780 parking-lot
    roads, S1800 private roads).
- **Tennessee clip:** whole-part rejection against
  `public/atlas/tn-boundary.geojson` (single closed ring) dilated by a 1 km
  tolerance — any part with a vertex outside ring+buffer is dropped whole
  (never delete an interior point). Same discipline as the river lane's
  whole-part Tennessee filter. TIGER county files are inherently TN-only, so
  the clip is belt-and-suspenders against the cartographic boundary's
  generalization (border-road vertices can sit a few hundred meters outside
  the published ring).
- **Welding:** segments are grouped by (MTFCC, FULLNAME) and chained where
  endpoints coincide exactly after 5-decimal rounding (~1 m). Only existing
  TIGER endpoints are joined — no coordinates are invented. Welding cuts
  per-feature JSON overhead (the dominant byte cost at TIGER's per-block edge
  granularity) and keeps road names labelable over their full length.
- **Simplification:** per-LOD Douglas–Peucker with endpoints preserved, then
  coordinate rounding per LOD. Tolerances escalate coarsest-LOD-first until
  the size gate is met (settled values are pinned in `roads-manifest.json`).

## Size (final build)

See `apps/web/public/atlas/roads-manifest.json` — per-file byte/feature/vertex
counts, bbox, settled RDP tolerances, and coordinate precision. Totals are
reproduced in the section below once the build settles.

## Integration handoff for Session A (UI lane owns `mapStyle.ts`)

Filled in below once the final build settles — file names, LOD property
values, zoom gates, bytes, and the attribution string.

## Precache budget decision

`public/atlas/roads*` ships into `dist/`. Whether it stays inside the 25 MB
precache gate or is excluded as runtime-cached (topo-style) is decided and
documented below after the first real build.
