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
| Census TIGER/Line 2024 ROADS (TN, per-county) | `.atlas-src/roads/` zips → `.atlas-src/roadshp/` (from `fetch-roads.mjs`) | 95 county files, 364,836 features | Public domain (US Government work, 17 U.S.C. § 105) |

## Reproduce (deterministic)

```bash
node apps/web/scripts/fetch-roads.mjs [--check]   # one-time Census downloads (-> .atlas-src/, git-ignored)
node apps/web/scripts/build-roads.mjs             # clip + weld + LOD + simplify (-> apps/web/public/atlas/roads-*)
node apps/web/scripts/validate-roads.mjs          # structural gate (must PASS)
```

## Build method

- **LOD classes (by TIGER MTFCC):**
  - `major` — S1100 (primary), S1200 (secondary): interstates, US and state
    highways. Complete.
  - `mid` — S1400 (local/city roads) **chains of at least 3,200 m** plus all
    S1630 (ramps) and S1640 (service drives).
  - `minor` — S1500 (vehicular trails — dirt/4WD access routes), S1820, S1830.
    Complete.
  - **Dropped outright (40,656 features):** S1730 alleys, S1740 private service
    roads (gated logging roads — 25,057 features, the bulk), S1750 private
    driveways, S1780 parking-lot roads, S1710 walkways. Non-through vehicular
    context; kept out of the size gate.
- **The S1400 coverage decision (the one that matters):** TIGER stores local
  streets as single per-block/cul-de-sac edges — 296,412 edges statewide with
  almost no weldable adjacency (75% of street-name groups are single-edge), so
  feature count ≈ edge count and no simplification can bring full local-street
  fabric under ~40 MB. This layer therefore keeps only S1400 chains ≥ 3,200 m
  (rural through-roads — the access context an angling basemap needs) and
  leaves dense urban block fabric out of scope. The threshold is the settled
  rung of the size ladder below; lower it and re-run `build-roads.mjs` if a
  future budget wants more coverage (each halving roughly doubles the mid
  file).
- **Tennessee clip:** whole-part rejection against
  `public/atlas/tn-boundary.geojson` (single closed ring) dilated by a 1 km
  tolerance — any part with a vertex outside ring+buffer is dropped whole
  (never delete an interior point). Same discipline as the river lane's
  whole-part Tennessee filter. Measured: 0 of 324,180 kept parts rejected —
  TIGER county ROADS sit fully inside the published cartographic boundary.
- **Welding:** segments are grouped by (MTFCC, FULLNAME) and chained where
  endpoints coincide exactly after 5-decimal rounding (~1 m). Only existing
  TIGER endpoints are joined — no coordinates are invented. Three walk rules
  keep chains honest (each added after a measured defect during the 2026-09 roads
  lane — see git history):
  straightest continuation at forks (greedy pick zigzagged between parallel
  carriageways), refusal of sharp reversals that land back on the chain's own
  corridor (forced reverse-carriageway steps created out-and-back paths), and
  pair-preserving reversal of flat coordinate arrays (`Array.reverse` swaps
  every `[x,y]` pair into `[y,x]`).
- **Feature model:** one feature per (MTFCC, FULLNAME) group per LOD —
  `LineString` when the group has one chain, `MultiLineString` otherwise (the
  repo's `partCount > 1` convention). This is pure byte surgery: same
  geometry, ~5× fewer JSON feature wrappers than per-chain features.
- **Simplification:** per-LOD Douglas–Peucker with endpoints preserved
  (major 0.0005°, mid 0.0016°, minor 0.0025°), then coordinate rounding
  (major 5dp, mid/minor 4dp). Long straight roads (delta section-line roads
  like E Shelby Dr, dead-straight interstate reaches) correctly collapse to
  few-vertex chords — verified: every >10 km chord in the output has a true
  source deviation of 3–52 m against the 56 m major tolerance.
- **Property conventions:** per-feature properties stay minimal
  (`{mtfcc, name?}`) — roads are uniform single-source geometry, so file-level
  provenance lives in `roads-manifest.json` (the topo manifest pattern).
  Repeating the rivers-style per-feature `source`/`crs`/`coordinateOrder`
  fields would add ~90 bytes × ~300k source features of pure convention text
  and sink the size gate. Per-feature `id`s are omitted for the same reason
  (no consumer addresses a road feature by id); `name` is omitted when empty.

## Size (final build)

Settled at ladder rung 3 of 4 (`mid ≥ 3200 m`); target ≤ 6 MB met with
headroom. Exact and pinned in `roads-manifest.json`:

| File | LOD | Bytes | Features | Vertices | RDP | Precision |
|------|-----|-------|----------|----------|-----|-----------|
| `roads-major.geojson` | major | 1,785,851 | 2,842 | 68,611 | 0.0005° | 5dp |
| `roads-mid.geojson` | mid | 2,651,753 | 8,686 | 82,733 | 0.0016° | 4dp |
| `roads-minor.geojson` | minor | 169,053 | 312 | 6,704 | 0.0025° | 4dp |
| **total** | | **4,606,657 (4.39 MiB)** | **11,840** | **158,048** | | |

Source funnel: 364,836 TIGER features → 324,180 kept segments (8.76 M raw
vertices) after the drop list → 287,101 welded chains → 11,840 features.
Ladder attempts (total bytes): base (mid ≥ 800 m) 11.22 MB → rung1 (≥ 1200 m)
8.52 MB → rung2 (≥ 2000 m) 6.11 MB → **rung3 (≥ 3200 m) 4.39 MB** ✓.

## Precache budget decision

**No `size-budget.mjs` change needed.** Roads sit directly in `atlas/`, so
vite.shared.ts's existing `atlas/*` precache pattern already ships them —
roads are offline on first install, no service-worker work for the UI lane.
Measured full build: dist went 5.21 MB → **9.61 MB against the 25 MB precache
gate** (topo still excluded and runtime-cached at 24.50 MB on its own line).
If a future rebuild with a lower mid threshold grows roads past the gate, the
topo-style exclusion (`atlas/roads*` as runtime-cached) is the documented
escape hatch — not needed at these sizes.

## Integration handoff for Session A (UI lane owns `mapStyle.ts`)

**Files (all same-origin, precached):**

| File | Content | Load | Recommended zoom gate |
|------|---------|------|-----------------------|
| `atlas/roads-major.geojson` | interstates + US/state highways (S1100/S1200) | eager with the basemap | from the app's min zoom (~5.3) |
| `atlas/roads-mid.geojson` | ramps (S1630), service drives (S1640), rural through-roads (S1400 ≥ 3.2 km) | eager or lazy | **z ≥ 10** |
| `atlas/roads-minor.geojson` | vehicular trails / dirt access (S1500) | lazy | **z ≥ 12** (app max is 13) |
| `atlas/roads-manifest.json` | provenance + byte/feature/bbox pins (validator reads it) | optional | — |

**Property contract (all features):** `mtfcc` (string, see table above),
`name` (string, present only for named roads — feed it to a symbol layer for
street labels at z ≥ 12). Geometry is `LineString` or `MultiLineString`
(one feature per (MTFCC, name) group; parts are disjoint chains). There are
**no per-feature ids** and no per-feature source/crs fields — provenance is
file-level. Features are sorted by `name`, then `mtfcc`; do not rely on
feature order for rendering priority.

**Styling:** one source + line layer per file (no class filters needed — the
file *is* the class). Suggested widths from the map token: `--map-road`
already exists in the theme — **no color decisions were made here**; width
hierarchy by mtfcc (S1100 widest, then S1200, S1400, S1500 hairline) with the
standard zoom-interpolated line widths works. `S1630`/`S1640` can share the
S1400 style or render a half-step lighter.

**Attribution:** add **`Roads: US Census TIGER`** to the map's attribution
control (courtesy credit — public domain requires none).

**Zoom-gate rationale:** the basemap runs z5.3–13. Highways carry statewide
orientation at every zoom; rural through-roads are noise below z10 (town
labels already render there); dirt trails only matter when scouting put-ins
at z12+. `roads-mid.geojson` (2.53 MB) is the heaviest source — if eager
loading of all three ever shows on first paint, defer `mid`+`minor` fetch
until first cross of their zoom gate (the topo manifest-probe pattern in
`mapStyle.ts` is the house style for this).

**Known characteristics (not bugs):** dead-straight long roads serialize as
few-vertex chords within the documented per-LOD tolerance (verified per
chord); I-40/I-24/I-75 carriageways are merged where TIGER names them
identically; unnamed local segments were dropped with the S1400 threshold
described above.

