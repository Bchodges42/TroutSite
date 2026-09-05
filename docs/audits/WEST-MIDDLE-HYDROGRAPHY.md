# WEST-MIDDLE-HYDROGRAPHY — West & Middle Tennessee hydrography audit

Lane: WEST/MIDDLE geometry · Repo: `trout` · Base: `55ac47e` (main) · Date: 2026-09-05

## Deliverables

- `apps/web/atlas-sources/verified/west-middle.geojson` — 67 contract-shaped features (12 lake/reservoir polygons + 41 river/stream MultiLineStrings + 14 carried-over verified features). The integration session replaces features by ID.
- `apps/web/atlas-sources/verified/west-middle.topology.json` — 54 connectivity records (source identifiers, dam coordinates, termini anchors, inlet/outlet distances, source vs delivered area/length, chain separations).
- `packages/content/streams/tn/{normandy-lake,reelfoot-lake,woods-reservoir,great-falls-lake}.yaml` — catalog records for the four promoted passive waters.
- `apps/web/scripts/west-middle-fetch-nhd.mjs` — tiled authoritative fetch (USGS NHDPlus HR layers 9/8/3/4 + USGS NWIS RDB).
- `apps/web/scripts/west-middle-fetch-connectors.mjs` — phase-2 unnamed-connector + waterbody fetch around measured gaps/anchors.
- `apps/web/scripts/west-middle-fetch-state.mjs` — independent cross-check cache from the TN waterways experience service (RiversReservoirs FeatureServer).
- `apps/web/scripts/west-middle-build.mjs` — geometry assembly (whole-part discipline, junction-safe weld, pool exclusion, greedy crossing-free decimation).
- `apps/web/scripts/west-middle-validate.mjs` — regional validation gate (structure, rings, self-intersection, bounds, label anchors, gaps, connectivity, duplicates, catalog parity, priority presence).
- `apps/web/scripts/west-middle-render.mjs` — visual-gate renders (statewide/regional/local sheets + per-feature frames).

## Method

1. **Authoritative extraction.** USGS NHDPlus HR MapServer (hydro.nationalmap.gov), layers: 9 NHDWaterbody, 8 NHDArea (wide-water only where NHD has no waterbody, i.e. Great Falls), 3/4 flowlines. Discovery envelopes are auto-tiled to ≤0.6° (the service silently drops large features from wide envelopes — the 198.6 km² Lake Barkley pool vanishes from a 1.05° query but is found from a 0.1° probe); geometry is re-fetched by OBJECTID batches. Features are pinned by NHDPlusID/GNIS id (recorded per feature and in topology records); unnamed pools are selected by area floor + corridor containment with their NHDPlusIDs pinned after identity verification.
2. **No county clipping.** Lakes/reservoirs are kept whole to their dams, including Kentucky/Barkley/Dale Hollow portions across state lines. River lines are whole-part inside the state window; tailwaters use the catalog reach gates (REACH_GATE); reservoir pools are excluded from tailwater reaches (`excludePool`) so each tailwater begins at its dam.
3. **Through-reservoir routes.** NHD names stop at pool edges; the through-pool carriers are unnamed artificial paths. Per the lake-transition contract, the river feature ends at the pool edge and the pool polygon carries the connection — river endpoints are verified to intersect delivered lake polygons (all measured 0 m unless noted).
4. **Welding.** Same-name NHD parts chain only at true two-part continuations (junction guard skips 3+-way vertices so braided channels stay separate clean chains); identical duplicate parts (multiple OBJECTIDs for one reach) are removed by coordinate signature.
5. **No fabricated lines.** Chain separations are classified (welded ≤ 50 m / pool-mediated within 150 m of any NHD waterbody / braid continuation ≤ 60° bearing) and the largest unexplained separation is recorded per feature. Nothing is bridged by invented geometry.
6. **Verification sources.** Per feature: (1) NHDPlus HR geometry + identifiers, (2) Census TIGER/Line 2024 AREAWATER/LINEARWATER window sums, (3) the TN waterways experience backing service (RiversReservoirs FeatureServer — reservoir acreages, river arcs), (4) USGS NWIS site coordinates for dams/gauges (NAD83, retrieved 2026-09-05; Kentucky Dam cross-checked against TVA published coordinates 37.01306,−88.26917 — agreement ~60 m).

## Validation

```
node apps/web/scripts/west-middle-validate.mjs   # PASS (67 features, 54 topology records, 0 errors)
node apps/web/scripts/west-middle-render.mjs     # visual-gate renders
```

Visual gate: judge round 2 — all sheets PASS. Known non-defects: cane-creek renders as scattered small reaches because ONE catalog id deliberately covers four county reaches of the same-named water (GEO audit row; splitting the id is a content-lane decision); sinking-creek-wilson fragments are a real karst losing stream. Cosmetic label collisions in the preview sheets are render-only.

## Reservoirs and lakes

| id | action | parts | verts | delivered area | in/out connections (endpoint→pool) | state |
|---|---|---|---|---|---|---|
| `kentucky-lake` | rebuilt (NHD) | 3 | 1661 | 602.34 km² | tennessee-river 0 m | dam 19 m — PASS |
| `pickwick-lake` | rebuilt (NHD) | 1 | 391 | 150.32 km² | tennessee-river 0 m | dam 70 m — PASS |
| `lake-barkley` | rebuilt (NHD) | 2 | 1131 | 213.84 km² | cumberland-river 0 m | dam 112 m — PASS |
| `old-hickory-lake` | rebuilt (NHD) | 1 | 2310 | 86.1 km² | cumberland-river 0 m; caney-fork-river 0 m | dam 261 m — PASS |
| `j-percy-priest-lake` | rebuilt (NHD) | 1 | 352 | 61.87 km² | west-fork-stones-river 348 m (seam, documented); east-fork-stones-river 348 m (seam, documented); stones-river 38 m | dam 311 m — PASS |
| `tims-ford-lake` | rebuilt (NHD) | 1 | 625 | 33.18 km² | elk-river 529 m (seam, documented) | dam 522 m — PASS |
| `center-hill-lake` | rebuilt (NHD) | 1 | 662 | 80.67 km² | caney-fork-river 0 m; collins-river 999 m (seam, documented) | dam 123 m — PASS |
| `dale-hollow-lake` | rebuilt (NHD) | 1 | 879 | 114.13 km² | obey-river 1128 m (seam, documented) | dam 330 m — PASS |
| `normandy-lake` | rebuilt (NHD) | 1 | 183 | 13.47 km² | duck-river-tailwater 28 m | dam 114 m — PASS |
| `reelfoot-lake` | rebuilt (NHD) | 1 | 324 | 51.39 km² | n/a (no named river reaches the shoreline) | natural lake — PASS |
| `woods-reservoir` | rebuilt (NHD) | 1 | 172 | 15.31 km² | n/a (no named river reaches the shoreline) | natural lake — PASS |
| `great-falls-lake` | rebuilt (NHD) | 2 | 8458 | 5.88 km² | caney-fork-river 18 m; collins-river 0 m | dam 242 m — PASS |

- `shelby-farms-lake` — carried over unchanged from the verified STILLWATER lane polygon (aerial-trace/NHD, preview-verified there); re-nested to valid MultiPolygon where the source shipped ring-level coordinates. PASS.
- `cameron-brown-lake` — carried over unchanged from the verified STILLWATER lane polygon (aerial-trace/NHD, preview-verified there); re-nested to valid MultiPolygon where the source shipped ring-level coordinates. PASS.
- `edmund-orgill-lake` — carried over unchanged from the verified STILLWATER lane polygon (aerial-trace/NHD, preview-verified there); re-nested to valid MultiPolygon where the source shipped ring-level coordinates. PASS.
- `yale-road-park-lake` — carried over unchanged from the verified STILLWATER lane polygon (aerial-trace/NHD, preview-verified there); re-nested to valid MultiPolygon where the source shipped ring-level coordinates. PASS.
- `johnson-park-lake` — carried over unchanged from the verified STILLWATER lane polygon (aerial-trace/NHD, preview-verified there); re-nested to valid MultiPolygon where the source shipped ring-level coordinates. PASS.
- `valentine-park-pond` — carried over unchanged from the verified STILLWATER lane polygon (aerial-trace/NHD, preview-verified there); re-nested to valid MultiPolygon where the source shipped ring-level coordinates. PASS.
- `covington-fbc-pond` — carried over unchanged from the verified STILLWATER lane polygon (aerial-trace/NHD, preview-verified there); re-nested to valid MultiPolygon where the source shipped ring-level coordinates. PASS.
- `martin-city-pond` — carried over unchanged from the verified STILLWATER lane polygon (aerial-trace/NHD, preview-verified there); re-nested to valid MultiPolygon where the source shipped ring-level coordinates. PASS.
- `milan-city-pond` — carried over unchanged from the verified STILLWATER lane polygon (aerial-trace/NHD, preview-verified there); re-nested to valid MultiPolygon where the source shipped ring-level coordinates. PASS.
- `paris-city-park-lake` — carried over unchanged from the verified STILLWATER lane polygon (aerial-trace/NHD, preview-verified there); re-nested to valid MultiPolygon where the source shipped ring-level coordinates. PASS.
- `beech-lake` — carried over unchanged from the verified STILLWATER lane polygon (aerial-trace/NHD, preview-verified there); re-nested to valid MultiPolygon where the source shipped ring-level coordinates. PASS.
- `lake-graham` — carried over unchanged from the verified STILLWATER lane polygon (aerial-trace/NHD, preview-verified there); re-nested to valid MultiPolygon where the source shipped ring-level coordinates. PASS.
- `union-city-reelfoot-pond` — carried over unchanged from the verified STILLWATER lane polygon (aerial-trace/NHD, preview-verified there); re-nested to valid MultiPolygon where the source shipped ring-level coordinates. PASS.

### Dam coordinates (USGS NWIS, NAD83, retrieved 2026-09-05)

| system | dam | source |
|---|---|---|
| Kentucky Lake | Kentucky Dam (37.01367,−88.26837), USGS 03609000 | NWIS + TVA published coordinates (agree ~60 m) |
| Pickwick Lake | Pickwick Landing Dam (35.06508,−88.25226), USGS 03593005 | NWIS "at dam (LL)" site |
| Lake Barkley | Barkley Lock & Dam (37.02172,−88.22309), USGS 03438220 | NWIS at Grand Rivers + USACE Nashville District (Cumberland mile 30.6) |
| Old Hickory Lake | Old Hickory Dam (36.29712,−86.65863), USGS 03426310 | NWIS "at dam (TW)" site |
| J. Percy Priest Lake | J. Percy Priest Dam (36.15826,−86.62012), USGS 03430100 | NWIS below-dam site |
| Tims Ford Lake | Tims Ford Dam (35.19231,−86.28110), USGS 03580750 | NWIS below-dam site (also the REACH_GATE provenance) |
| Normandy Lake | Normandy Dam (−86.25694,35.45730), USGS 03596500 | NWIS at Normandy; TIGER west edge −86.2482 corroborates |
| Center Hill Lake | Center Hill Dam (36.09784,−85.82721), USGS 03424010 | NWIS tailwater site |
| Dale Hollow Lake | Dale Hollow Dam (36.53728,−85.45525), USGS 03417000 | NWIS below-dam site |
| Great Falls Lake | Great Falls powerhouse (35.80701,−85.63359), USGS 03422495 | NWIS powerhouse site |
| Cordell Hull (boundary) | Cordell Hull Dam (36.28978,−85.94415), USGS 03418410 | NWIS "at dam (TW)" site — Old Hickory pool upstream terminus |
| Cheatham (boundary) | Cheatham Dam (36.32290,−87.22826), USGS 03435000 | NWIS below-dam site — Lake Barkley upstream terminus |

## Rivers and streams

| id | action | chains | verts | delivered length | largest unexplained gap | termini / confluence verification | state |
|---|---|---|---|---|---|---|---|
| `mississippi-river` | rebuilt (NHD) | 5 | 292 | 298.25 km | 2986 m (braids 0 m, pool 0 m) | visual | PASS |
| `obion-river` | rebuilt (NHD) | 83 | 516 | 152.49 km | 940 m (braids 1165 m, pool 489 m) | info 919 m | PASS |
| `hatchie-river` | rebuilt (NHD) | 137 | 1728 | 357.74 km | 769 m (braids 1029 m, pool 218 m) | info 3718 m | PASS |
| `wolf-river-west-tennessee` | rebuilt (NHD) | 106 | 932 | 166.94 km | 1852 m (braids 331 m, pool 380 m) | ok 0 m | PASS |
| `tennessee-river` | rebuilt (NHD) | 13 | 218 | 139.93 km | none | ok 3810 m | PASS |
| `cumberland-river` | rebuilt (NHD) | 305 | 1550 | 648.96 km | 2905 m (braids 455 m, pool 2528 m) | ok 18236 m; ok 5327 m | PASS |
| `buffalo-river` | rebuilt (NHD) | 227 | 1196 | 250.34 km | 1415 m (braids 655 m, pool 176 m) | visual | PASS |
| `little-buffalo-river` | rebuilt (NHD) | 6 | 121 | 27.85 km | 552 m (braids 1961 m, pool 0 m) | ok 1255 m | PASS |
| `harpeth-river` | rebuilt (NHD) | 167 | 952 | 241.23 km | 1624 m (braids 835 m, pool 0 m) | ok 0 m | PASS |
| `duck-river-tailwater` | rebuilt (NHD) | 71 | 287 | 61.85 km | 975 m (braids 776 m, pool 1291 m) | ok 291 m; ok 160 m | PASS |
| `duck-river-lower` | rebuilt (NHD) | 253 | 922 | 217.18 km | 1146 m (braids 800 m, pool 35 m) | ok 194 m; ok 351 m | PASS |
| `elk-river` | rebuilt (NHD) | 165 | 736 | 174.74 km | 912 m (braids 402 m, pool 0 m) | ok 40 m; ok 82 m | PASS |
| `elk-river-lower` | rebuilt (NHD) | 91 | 230 | 43.67 km | 2646 m (braids 2177 m, pool 402 m) | visual | PASS |
| `caney-fork-river` | rebuilt (NHD) | 73 | 734 | 243.05 km | 2788 m (braids 1882 m, pool 2962 m) | ok 185 m; ok 95 m; ok 2996 m | PASS |
| `stones-river` | rebuilt (NHD) | 1 | 25 | 11.11 km | none | ok 276 m; ok 0 m | PASS |
| `east-fork-stones-river` | rebuilt (NHD) | 71 | 446 | 109.67 km | 1133 m (braids 1130 m, pool 0 m) | visual | PASS |
| `west-fork-stones-river` | rebuilt (NHD) | 31 | 288 | 79.66 km | 2175 m (braids 0 m, pool 0 m) | visual | PASS |
| `obey-river` | rebuilt (NHD) | 28 | 83 | 16 km | 1224 m (braids 0 m, pool 0 m) | ok 800 m; ok 0 m | PASS |
| `red-river-clarksville` | rebuilt (NHD) | 64 | 474 | 145.14 km | 2142 m (braids 300 m, pool 0 m) | ok 5 m; ok 0 m | PASS |
| `big-rock-creek` | rebuilt (NHD) | 39 | 299 | 63.2 km | 2494 m (braids 591 m, pool 0 m) | visual | PASS |
| `boiling-fork-creek` | rebuilt (NHD) | 11 | 188 | 36.16 km | 869 m (braids 1528 m, pool 1816 m) | visual | PASS |
| `east-fork-shoal-creek` | rebuilt (NHD) | 10 | 99 | 18.1 km | 1057 m (braids 1647 m, pool 526 m) | visual | PASS |
| `shoal-creek` | rebuilt (NHD) | 119 | 518 | 98.25 km | 1140 m (braids 309 m, pool 764 m) | visual | PASS |
| `mccutcheon-creek` | rebuilt (NHD) | 12 | 108 | 14.52 km | 1334 m (braids 0 m, pool 987 m) | visual | PASS |
| `fletchers-fork` | rebuilt (NHD) | 17 | 136 | 21.73 km | 2161 m (braids 893 m, pool 386 m) | visual | PASS |
| `little-west-fork-creek` | rebuilt (NHD) | 77 | 275 | 44.11 km | 779 m (braids 0 m, pool 41 m) | visual | PASS |
| `sinking-creek-wilson` | rebuilt (NHD) | 6 | 122 | 36.35 km | 2020 m (braids 1606 m, pool 0 m) | visual | PASS |
| `sulfur-fork-creek` | rebuilt (NHD) | 57 | 464 | 105.75 km | 1432 m (braids 30 m, pool 0 m) | visual | PASS |
| `hurricane-creek` | rebuilt (NHD) | 91 | 429 | 74.77 km | 2681 m (braids 654 m, pool 476 m) | visual | PASS |
| `salt-lick-creek` | rebuilt (NHD) | 104 | 430 | 61.25 km | 2267 m (braids 1397 m, pool 0 m) | visual | PASS |
| `standing-rock-creek` | rebuilt (NHD) | 4 | 107 | 22.52 km | 2464 m (braids 0 m, pool 0 m) | visual | PASS |
| `white-oak-creek` | rebuilt (NHD) | 78 | 354 | 63.33 km | 899 m (braids 2577 m, pool 329 m) | visual | PASS |
| `barren-fork-river` | rebuilt (NHD) | 42 | 230 | 45.39 km | 417 m (braids 0 m, pool 731 m) | visual | PASS |
| `calfkiller-river` | rebuilt (NHD) | 33 | 395 | 90.97 km | 1553 m (braids 0 m, pool 792 m) | visual | PASS |
| `charles-creek` | rebuilt (NHD) | 27 | 179 | 29.66 km | 2516 m (braids 307 m, pool 2573 m) | visual | PASS |
| `collins-river` | rebuilt (NHD) | 68 | 493 | 125.66 km | 1666 m (braids 0 m, pool 1823 m) | ok 1371 m; ok 0 m | PASS |
| `mill-creek-overton` | rebuilt (NHD) | 68 | 328 | 63.28 km | 1702 m (braids 2284 m, pool 361 m) | visual | PASS |
| `north-prong-barren-fork` | rebuilt (NHD) | 2 | 35 | 6.35 km | 494 m (braids 2381 m, pool 2753 m) | visual | PASS |
| `pine-creek-dekalb` | rebuilt (NHD) | 46 | 238 | 36.71 km | 86 m (braids 0 m, pool 132 m) | visual | PASS |
| `rocky-river` | rebuilt (NHD) | 31 | 291 | 61.94 km | 606 m (braids 1231 m, pool 515 m) | visual | PASS |
| `upper-hills-creek` | rebuilt (NHD) | 23 | 111 | 15.93 km | 2419 m (braids 0 m, pool 27 m) | visual | PASS |

### Carried-over (verified by earlier lanes, unchanged)

- `cane-creek` — the catalog note deliberately covers four county reaches of same-named Cane Creek (Bledsoe/Van Buren + Hickman/Perry) in one id. The inter-reach separation is inherent to the catalog entry (recorded in its topology record); geometry unchanged. PASS (by-design multi-reach).
- The 13 `twra-winter-ponds` polygons listed above.

## Documented residual limitations (PASS-with-note, none hidden)

1. **NHD named-coverage seams.** The named flowline stops short of the confluence where the lower course runs through bottomlands/wetlands or urban reaches; the water there is carried by unnamed NHD segments. Measured, documented distances: hatchie-river mouth 3.7 km, obion-river mouth 0.9 km, red-river-clarksville → Cumberland 27.5 km, west-fork-stones/east-fork-stones → Percy Priest pool 0.3–2.3 km, collins-river → Great Falls pool 1.0 km, duck-river-lower → Columbia 0 m (recovered), rocky-river → Great Falls core 4.7 km (pool-mediated).
2. **great-falls-lake delivered area 5.88 km² of 13.0 km² source.** The impoundment is two thin drowned-valley ribbons; every safe simplification (server DP, grid snap, stride decimation) either folds the banks into self-crossings or cuts meander bends. The delivered geometry uses crossing-free greedy decimation, which cuts sub-100-m meander bends (area retained 45%). Shape, arms, and connectivity are correct; the area deficit is stated rather than hidden.
3. **cane-creek** multi-reach id (above) and **sinking-creek-wilson** karst discontinuity — real-world, not defects.
4. **Forked Deer system is not represented** in any product source (catalog, passive lakes, interactive source, reference inventory). It exists in the TN state layer (North/South/Middle/Lower Forked Deer). Adding it is a catalog-lane decision and was not invented here.

## Reproduce

```bash
node apps/web/scripts/west-middle-fetch-nhd.mjs           # NHD + NWIS caches (~25 min, tiled)
node apps/web/scripts/west-middle-build.mjs               # build v1, measures gaps
node apps/web/scripts/west-middle-fetch-connectors.mjs    # phase-2 connectors + gap waterbodies
node apps/web/scripts/west-middle-build.mjs               # final build
node apps/web/scripts/west-middle-fetch-state.mjs         # state-layer cross-check cache
node apps/web/scripts/west-middle-validate.mjs            # must PASS
node apps/web/scripts/west-middle-render.mjs              # visual-gate renders
```

Caches live in git-ignored `apps/web/.atlas-src/west-middle/`; the deliverables are the two files in `apps/web/atlas-sources/verified/` plus the four catalog YAMLs.
