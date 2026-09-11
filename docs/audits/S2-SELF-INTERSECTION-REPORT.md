# SELF-INTERSECTION AUDIT — pre-fix state at base 6d0befe (Session 2, 2026-09-08)

Statewide audit of canonical `apps/web/public/atlas/rivers.geojson` before the Session 2 geometry fixes.
Working scripts were in apps/web/.atlas-src/audit-s2/ (gitignored). Coordinates lat,lon.

# River Geometry Self-Intersection Audit — statewide `rivers.geojson`

- Generated: 2026-09-08 — working copy: `C:\Users\Benjamin\Projects\trout-s2` (clone; the sibling `trout` checkout was not touched)
- Data audited: `apps/web/public/atlas/rivers.geojson` (147 features, 104 line features, 1,694 LineString parts, 29,249 vertices, WGS84 lon/lat)
- Cross-check file: `apps/web/atlas-sources/verified/west-middle.geojson` (duck features only)

## 1. Method

Detector: `apps/web/.atlas-src/audit-s2/detect-self-intersections.mjs` (Node, no deps; runs statewide in ~0.25 s).

- Segments are bucketed into a 600 m uniform spatial grid (local equirectangular frame); each grid cell enumerates its segment pairs (adjacent segments of the same part, `|i-j| <= 1`, are excluded; identical pairs deduplicated).
- **Crossing**: two non-adjacent segments intersect with strictly opposing orientation signs (interior-interior), or a **T-cross**: the intersection point is interior to one segment while the other path's adjacent vertices straddle that segment's line (true pass-through). Intersection points are clustered at 12 m into single crossing events; coordinates reported are cluster centroids (6 dp).
- **Ignored**: near-degenerate touches — intersection with no pass-through (shared weld endpoints, < 1 m contact). These are counted per feature as `sharedEndpointTouches`.
- **Sustained anti-parallel overlap**: non-adjacent segments with opposing direction (dot(uA,uB) < −0.8, i.e. within ~37° of exactly reversed) and separation < 30 m, chained into connected corridor runs; runs with projected span > 500 m are reported. Same-part pairs with vertex-index gap <= 6 are excluded (hairpin turns).
- **Duplicate overlay** (informational): non-adjacent same-direction segments (< 5 m apart) overlapping > 50 m — duplicated path / duplicated parts.
- Inter-part crossings (a part crossing a *different* part of the same feature) are reported separately from intra-part crossings. Cross-feature crossings between different features are out of scope per the tasking.

## 2. Statewide summary

- **104** line features audited; **39** contain at least one self-crossing; **167** crossing events statewide.
- 284 sustained anti-parallel overlap runs (> 500 m) and 669 duplicate-overlay segment groups were also found.
- 55 line features are clean (no crossings, no overlap runs).

Legend: `x` = crossing events, `intra` = within one part, `inter` = between parts of the same feature, `runs` = sustained anti-parallel corridors, `dups` = duplicate-overlay groups.

| Feature | Parts | Verts | x | intra | inter | runs | dups |
|---|---:|---:|---:|---:|---:|---:|---:|
| `cane-creek` | 60 | 799 | 18 | 0 | 18 | 0 | 3 |
| `wolf-river-west-tennessee` | 60 | 886 | 16 | 15 | 1 | 14 | 35 |
| `calfkiller-river` | 14 | 376 | 12 | 12 | 0 | 10 | 28 |
| `duck-river-lower` | 99 | 768 | 10 | 7 | 3 | 19 | 35 |
| `hurricane-creek` | 38 | 376 | 10 | 7 | 3 | 9 | 9 |
| `harpeth-river` | 69 | 854 | 9 | 4 | 5 | 13 | 30 |
| `hatchie-river` | 57 | 1648 | 9 | 9 | 0 | 9 | 41 |
| `pine-creek-dekalb` | 16 | 208 | 7 | 7 | 0 | 4 | 5 |
| `cumberland-river` | 161 | 1406 | 6 | 6 | 0 | 34 | 0 |
| `red-river-clarksville` | 20 | 430 | 6 | 6 | 0 | 10 | 48 |
| `east-fork-stones-river` | 29 | 404 | 6 | 6 | 0 | 8 | 34 |
| `little-west-fork-creek` | 23 | 221 | 6 | 5 | 1 | 8 | 9 |
| `caney-fork-upper` | 29 | 582 | 5 | 5 | 0 | 7 | 11 |
| `mill-creek-overton` | 30 | 290 | 4 | 4 | 0 | 4 | 18 |
| `buffalo-river` | 103 | 1072 | 3 | 2 | 1 | 15 | 7 |
| `elk-river` | 64 | 635 | 3 | 3 | 0 | 12 | 7 |
| `obion-river` | 34 | 467 | 3 | 2 | 1 | 6 | 12 |
| `upper-hills-creek` | 10 | 98 | 3 | 3 | 0 | 2 | 7 |
| `collins-river` | 28 | 453 | 2 | 1 | 1 | 15 | 16 |
| `duck-river-tailwater` | 27 | 243 | 2 | 1 | 1 | 8 | 3 |
| `salt-lick-creek` | 51 | 377 | 2 | 2 | 0 | 8 | 19 |
| `shoal-creek` | 51 | 450 | 2 | 1 | 1 | 8 | 11 |
| `rocky-river` | 10 | 270 | 2 | 2 | 0 | 5 | 9 |
| `big-rock-creek` | 17 | 277 | 2 | 2 | 0 | 4 | 24 |
| `white-oak-creek` | 34 | 310 | 2 | 2 | 0 | 4 | 2 |
| `holston-river` | 7 | 492 | 2 | 1 | 1 | 0 | 0 |
| `laurel-creek-johnson` | 18 | 98 | 2 | 0 | 2 | 0 | 0 |
| `nolichucky-river` | 14 | 474 | 2 | 1 | 1 | 0 | 0 |
| `barren-fork-river` | 14 | 202 | 1 | 1 | 0 | 11 | 1 |
| `elk-river-lower` | 36 | 175 | 1 | 1 | 0 | 6 | 2 |
| `west-fork-stones-river` | 14 | 271 | 1 | 1 | 0 | 5 | 16 |
| `fletchers-fork` | 10 | 129 | 1 | 1 | 0 | 3 | 0 |
| `charles-creek` | 14 | 166 | 1 | 1 | 0 | 1 | 0 |
| `standing-rock-creek` | 4 | 107 | 1 | 1 | 0 | 1 | 0 |
| `little-river` | 28 | 436 | 1 | 0 | 1 | 0 | 6 |
| `new-river` | 10 | 346 | 1 | 0 | 1 | 0 | 0 |
| `north-prong-barren-fork` | 2 | 35 | 1 | 1 | 0 | 0 | 0 |
| `obed-river` | 5 | 289 | 1 | 0 | 1 | 0 | 0 |
| `pigeon-river` | 6 | 114 | 1 | 0 | 1 | 0 | 0 |
| `sulfur-fork-creek` | 30 | 437 | 0 | 0 | 0 | 6 | 3 |
| `mississippi-river` | 5 | 292 | 0 | 0 | 0 | 3 | 0 |
| `obey-river` | 11 | 66 | 0 | 0 | 0 | 3 | 2 |
| `boiling-fork-creek` | 6 | 164 | 0 | 0 | 0 | 2 | 0 |
| `north-chickamauga-creek` | 17 | 398 | 0 | 0 | 0 | 2 | 0 |
| `little-buffalo-river` | 3 | 118 | 0 | 0 | 0 | 1 | 0 |
| `little-pigeon-river` | 17 | 286 | 0 | 0 | 0 | 1 | 0 |
| `mccutcheon-creek` | 7 | 103 | 0 | 0 | 0 | 1 | 0 |
| `middle-prong-little-pigeon` | 4 | 50 | 0 | 0 | 0 | 1 | 0 |
| `sinking-creek-wilson` | 6 | 116 | 0 | 0 | 0 | 1 | 0 |

## 3. Per-crossing coordinates (every feature with >= 1 crossing)

Coordinates are `lat, lon` (6 dp) of the clustered crossing event. `pairs` lists the intersecting segments as `partA[segStart,segEnd] x partB[segStart,segEnd]` (0-based vertex indices within the part).

### `cane-creek` — 18 crossings (0 intra-part / 18 inter-part)

| # | lat, lon | scope | pairs |
|---|---|---|---|
| 1 | 35.664814, -87.700785 | inter-part | `p2[63,64]` x `p52[0,1]` (crossing) |
| 2 | 35.668011, -87.699458 | inter-part | `p2[67,68]` x `p50[0,1]` (crossing) |
| 3 | 35.660412, -87.699404 | inter-part | `p2[60,61]` x `p37[0,1]` (crossing) |
| 4 | 35.666538, -87.699131 | inter-part | `p2[65,66]` x `p50[0,1]` (crossing) |
| 5 | 35.660606, -87.698048 | inter-part | `p2[60,61]` x `p32[0,1]` (crossing) |
| 6 | 35.659653, -87.692303 | inter-part | `p2[58,59]` x `p42[0,1]` (crossing) |
| 7 | 35.659537, -87.691313 | inter-part | `p2[57,58]` x `p42[0,1]` (crossing) |
| 8 | 35.660338, -87.689384 | inter-part | `p2[56,57]` x `p53[2,3]` (crossing) |
| 9 | 35.660892, -87.688315 | inter-part | `p2[55,56]` x `p53[2,3]` (crossing) |
| 10 | 35.660022, -87.681371 | inter-part | `p2[52,53]` x `p53[0,1]` (crossing) |
| 11 | 35.655634, -87.674569 | inter-part | `p2[49,50]` x `p49[1,2]` (crossing) |
| 12 | 35.657861, -87.670331 | inter-part | `p2[44,45]` x `p33[1,2]` (crossing) |
| 13 | 35.649478, -87.665948 | inter-part | `p2[35,36]` x `p40[0,1]` (crossing) |
| 14 | 35.644214, -87.652564 | inter-part | `p2[25,26]` x `p35[1,2]` (crossing) |
| 15 | 35.643610, -87.652171 | inter-part | `p2[24,25]` x `p35[1,2]` (crossing) |
| 16 | 35.643682, -87.650222 | inter-part | `p2[23,24]` x `p35[0,1]` (crossing) |
| 17 | 35.641795, -87.643178 | inter-part | `p2[18,19]` x `p55[0,1]` (crossing) |
| 18 | 35.641453, -87.640289 | inter-part | `p2[16,17]` x `p58[2,3]` (crossing) |

### `wolf-river-west-tennessee` — 16 crossings (15 intra-part / 1 inter-part)

| # | lat, lon | scope | pairs |
|---|---|---|---|
| 1 | 35.190208, -89.984464 | intra-part | `p18[4,5]` x `p18[24,25]` (crossing) |
| 2 | 35.063194, -89.576527 | intra-part | `p31[11,12]` x `p31[22,23]` (crossing) |
| 3 | 35.063056, -89.575985 | intra-part | `p31[9,10]` x `p31[11,12]` (crossing) |
| 4 | 35.061751, -89.570845 | intra-part | `p31[11,12]` x `p31[19,20]` (crossing) |
| 5 | 35.060915, -89.567554 | intra-part | `p31[11,12]` x `p31[16,17]` (crossing) |
| 6 | 35.060451, -89.565728 | intra-part | `p31[11,12]` x `p31[14,15]` (crossing) |
| 7 | 35.059563, -89.555699 | inter-part | `p17[1,2]` x `p53[8,9]` (crossing) |
| 8 | 35.057042, -89.547057 | intra-part | `p14[1,2]` x `p14[5,6]` (crossing) |
| 9 | 35.054823, -89.538481 | intra-part | `p26[2,3]` x `p26[5,6]` (crossing)<br>`p26[5,6]` x `p26[7,8]` (crossing) |
| 10 | 35.059010, -89.506023 | intra-part | `p12[19,20]` x `p12[36,37]` (crossing) |
| 11 | 35.070819, -89.485783 | intra-part | `p0[28,29]` x `p0[36,37]` (crossing) |
| 12 | 35.069687, -89.478772 | intra-part | `p0[28,29]` x `p0[31,32]` (crossing) |
| 13 | 35.069530, -89.477804 | intra-part | `p0[28,29]` x `p0[30,31]` (crossing) |
| 14 | 35.069566, -89.477008 | intra-part | `p0[21,22]` x `p0[29,30]` (crossing) |
| 15 | 35.071013, -89.468178 | intra-part | `p0[11,12]` x `p0[18,19]` (crossing) |
| 16 | 35.026279, -89.326504 | intra-part | `p30[37,38]` x `p30[41,42]` (crossing) |

Sustained anti-parallel overlap runs (14):

| # | lat, lon | span (m) | mean sep (m) | parts / vertex ranges |
|---|---|---:|---:|---|
| 1 | 35.070349, -89.478601 | 3045 | 6 | part 0[11..29] |
| 2 | 35.200510, -89.921734 | 745 | 0 | part 1[20..21], part 10[1..2] |
| 3 | 35.117410, -89.815214 | 567 | 0 | part 5[0..1], part 6[8..9] |
| 4 | 35.110788, -89.789339 | 619 | 0 | part 6[1..2], part 7[155..156] |
| 5 | 35.062164, -89.572496 | 1891 | 6.6 | part 7[4..5], part 31[0..12] |
| 6 | 35.182569, -90.057437 | 705 | 0 | part 9[0..1], part 16[23..24] |
| 7 | 35.193166, -89.937474 | 691 | 0 | part 10[9..10], part 18[22..23] |
| 8 | 35.062627, -89.500694 | 1949 | 0 | part 12[6..20] |
| 9 | 35.038502, -89.268043 | 1278 | 14.4 | part 13[3..5], part 33[0..1] |
| 10 | 35.035045, -89.293451 | 4636 | 15.4 | part 30[2..13] |
| 11 | 35.056270, -89.548943 | 765 | 0 | part 14[8..9], part 44[0..1] |
| 12 | 35.061053, -89.556538 | 506 | 0 | part 17[2..5] |
| 13 | 35.190716, -89.978115 | 5279 | 28.7 | part 18[2..4] |
| 14 | 35.000996, -89.250185 | 4043 | 0 | part 35[11..12], part 36[0..1] |

### `calfkiller-river` — 12 crossings (12 intra-part / 0 inter-part)

| # | lat, lon | scope | pairs |
|---|---|---|---|
| 1 | 35.990436, -85.392586 | intra-part | `p5[2,3]` x `p5[4,5]` (crossing)<br>`p5[4,5]` x `p5[7,8]` (crossing) |
| 2 | 35.989700, -85.390362 | intra-part | `p5[4,5]` x `p5[6,7]` (crossing) |
| 3 | 35.993275, -85.379552 | intra-part | `p6[14,15]` x `p6[26,27]` (crossing) |
| 4 | 35.994553, -85.378525 | intra-part | `p6[14,15]` x `p6[24,25]` (crossing) |
| 5 | 35.996728, -85.377399 | intra-part | `p6[6,7]` x `p6[21,22]` (crossing) |
| 6 | 35.996669, -85.376825 | intra-part | `p6[14,15]` x `p6[21,22]` (crossing) |
| 7 | 35.997768, -85.375942 | intra-part | `p6[14,15]` x `p6[19,20]` (crossing) |
| 8 | 36.013227, -85.355552 | intra-part | `p0[34,35]` x `p0[36,37]` (crossing) |
| 9 | 36.014766, -85.347629 | intra-part | `p0[13,14]` x `p0[25,26]` (crossing) |
| 10 | 36.020614, -85.337477 | intra-part | `p0[13,14]` x `p0[21,22]` (crossing) |
| 11 | 36.023936, -85.331710 | intra-part | `p0[13,14]` x `p0[16,17]` (crossing) |
| 12 | 36.057234, -85.326711 | intra-part | `p4[9,10]` x `p4[12,13]` (crossing) |

Sustained anti-parallel overlap runs (10):

| # | lat, lon | span (m) | mean sep (m) | parts / vertex ranges |
|---|---|---:|---:|---|
| 1 | 36.026582, -85.329617 | 625 | 0 | part 0[1..2], part 3[25..26] |
| 2 | 36.015844, -85.345252 | 2443 | 3.4 | part 0[13..14] |
| 3 | 36.012189, -85.359504 | 724 | 0 | part 0[34..35] |
| 4 | 35.991304, -85.381281 | 2029 | 0 | part 6[0..31], part 12[0..1] |
| 5 | 36.052955, -85.330874 | 626 | 0 | part 3[2..5] |
| 6 | 36.040120, -85.329259 | 653 | 0 | part 3[11..13] |
| 7 | 36.036279, -85.332346 | 505 | 0 | part 3[13..15] |
| 8 | 36.031874, -85.333536 | 698 | 0 | part 3[18..19] |
| 9 | 35.982624, -85.397783 | 549 | 0 | part 5[20..22] |
| 10 | 35.985288, -85.408290 | 868 | 0 | part 5[24..26] |

### `duck-river-lower` — 10 crossings (7 intra-part / 3 inter-part)

| # | lat, lon | scope | pairs |
|---|---|---|---|
| 1 | 35.640939, -87.058186 | intra-part | `p5[0,1]` x `p5[4,5]` (crossing) |
| 2 | 35.640937, -87.058035 | intra-part | `p5[0,1]` x `p5[2,3]` (crossing) |
| 3 | 35.645993, -87.041850 | intra-part | `p13[0,1]` x `p13[2,3]` (crossing) |
| 4 | 35.587343, -86.980475 | intra-part | `p1[44,45]` x `p1[48,49]` (crossing) |
| 5 | 35.568287, -86.897563 | intra-part | `p9[1,2]` x `p9[3,4]` (crossing) |
| 6 | 35.561026, -86.895386 | inter-part | `p6[2,3]` x `p60[0,1]` (crossing) |
| 7 | 35.599250, -86.870201 | intra-part | `p62[2,3]` x `p62[4,5]` (crossing) |
| 8 | 35.481069, -86.517260 | inter-part | `p18[18,19]` x `p28[2,3]` (crossing) |
| 9 | 35.486135, -86.499593 | intra-part | `p18[8,9]` x `p18[11,12]` (crossing) |
| 10 | 35.476319, -86.476649 | inter-part | `p25[14,15]` x `p29[1,2]` (crossing) |

Sustained anti-parallel overlap runs (19):

| # | lat, lon | span (m) | mean sep (m) | parts / vertex ranges |
|---|---|---:|---:|---|
| 1 | 35.597060, -86.969051 | 1136 | 0 | part 0[3..4], part 1[57..58] |
| 2 | 35.569795, -86.907641 | 2273 | 0 | part 1[5..6], part 9[3..6], part 6[4..5] |
| 3 | 35.568992, -86.918161 | 2227 | 0 | part 1[6..7], part 9[6..7] |
| 4 | 35.619722, -86.816715 | 1557 | 0 | part 3[119..122] |
| 5 | 35.619874, -86.823826 | 550 | 0 | part 3[125..126] |
| 6 | 35.609146, -86.824308 | 627 | 0 | part 3[129..130], part 10[0..1] |
| 7 | 35.607759, -86.830890 | 1063 | 0 | part 4[9..22], part 10[1..2] |
| 8 | 35.630135, -86.862472 | 501 | 0 | part 4[39..40], part 73[0..1] |
| 9 | 35.618104, -86.873794 | 2032 | 0 | part 4[44..45] |
| 10 | 35.537404, -86.553591 | 1269 | 0 | part 8[1..2], part 11[4..5] |
| 11 | 35.645424, -87.039786 | 554 | 0 | part 13[1..2], part 14[3..4] |
| 12 | 35.534302, -86.528820 | 709 | 0 | part 16[0..1], part 23[6..7] |
| 13 | 35.511097, -86.542222 | 674 | 16.2 | part 17[4..5] |
| 14 | 35.482534, -86.516468 | 585 | 7 | part 18[16..18], part 28[1..7] |
| 15 | 35.473976, -86.463509 | 1391 | 0 | part 19[4..5], part 25[1..2] |
| 16 | 35.472558, -86.463876 | 766 | 0 | part 19[5..6], part 25[2..3] |
| 17 | 35.457403, -86.452052 | 1143 | 0 | part 21[10..14] |
| 18 | 35.499683, -86.531164 | 546 | 0 | part 24[4..5], part 30[7..8] |
| 19 | 35.470472, -86.430576 | 681 | 0 | part 31[2..3], part 34[1..2] |

### `hurricane-creek` — 10 crossings (7 intra-part / 3 inter-part)

| # | lat, lon | scope | pairs |
|---|---|---|---|
| 1 | 35.969197, -87.815947 | intra-part | `p6[21,22]` x `p6[37,38]` (crossing) |
| 2 | 35.982031, -87.815550 | intra-part | `p6[44,45]` x `p6[49,50]` (crossing) |
| 3 | 35.980906, -87.815439 | intra-part | `p6[44,45]` x `p6[48,49]` (crossing) |
| 4 | 35.966857, -87.790532 | intra-part | `p6[2,3]` x `p6[4,5]` (crossing) |
| 5 | 35.975983, -87.772588 | inter-part | `p4[17,18]` x `p26[1,2]` (crossing) |
| 6 | 35.984404, -87.759225 | intra-part | `p4[8,9]` x `p4[10,11]` (crossing) |
| 7 | 35.997978, -87.745704 | intra-part | `p3[109,110]` x `p3[111,112]` (crossing) |
| 8 | 35.997382, -87.745434 | inter-part | `p3[96,97]` x `p25[6,7]` (crossing) |
| 9 | 35.998407, -87.738738 | inter-part | `p3[96,97]` x `p25[3,4]` (crossing) |
| 10 | 35.998731, -87.736623 | intra-part | `p3[96,97]` x `p3[98,99]` (crossing) |

Sustained anti-parallel overlap runs (9):

| # | lat, lon | span (m) | mean sep (m) | parts / vertex ranges |
|---|---|---:|---:|---|
| 1 | 36.345844, -87.848662 | 543 | 0 | part 0[16..18], part 35[2..3] |
| 2 | 36.341304, -87.886898 | 656 | 0 | part 2[0..1], part 5[7..8] |
| 3 | 35.998043, -87.741052 | 1079 | 4.2 | part 3[96..97], part 25[2..8] |
| 4 | 35.997476, -87.743204 | 812 | 0 | part 3[109..110], part 25[4..5] |
| 5 | 35.997057, -87.751927 | 579 | 0 | part 3[107..108], part 4[3..6] |
| 6 | 35.996613, -87.752213 | 972 | 0 | part 3[108..109], part 4[4..7] |
| 7 | 35.972614, -87.782148 | 652 | 0 | part 27[1..2] |
| 8 | 35.964602, -87.804722 | 2023 | 0 | part 6[13..15] |
| 9 | 35.983021, -87.815634 | 1241 | 0 | part 6[45..46] |

### `harpeth-river` — 9 crossings (4 intra-part / 5 inter-part)

| # | lat, lon | scope | pairs |
|---|---|---|---|
| 1 | 36.104587, -87.125462 | intra-part | `p59[3,4]` x `p59[8,9]` (crossing) |
| 2 | 36.169420, -87.120742 | inter-part | `p2[28,29]` x `p50[0,1]` (crossing) |
| 3 | 36.152452, -87.119400 | intra-part | `p2[14,15]` x `p2[19,20]` (crossing) |
| 4 | 36.117304, -87.110367 | inter-part | `p18[1,2]` x `p18[3,4]` (crossing)<br>`p5[4,5]` x `p18[1,2]` (crossing) |
| 5 | 36.134022, -87.107415 | inter-part | `p1[3,4]` x `p5[12,13]` (crossing) |
| 6 | 36.140346, -87.107320 | intra-part | `p1[24,25]` x `p1[27,28]` (crossing) |
| 7 | 36.130810, -87.103443 | inter-part | `p5[12,13]` x `p11[1,2]` (crossing) |
| 8 | 36.096116, -87.061925 | inter-part | `p3[314,315]` x `p24[1,2]` (crossing) |
| 9 | 36.090896, -87.036245 | intra-part | `p3[301,302]` x `p3[304,305]` (crossing) |

Sustained anti-parallel overlap runs (13):

| # | lat, lon | span (m) | mean sep (m) | parts / vertex ranges |
|---|---|---:|---:|---|
| 1 | 36.181187, -87.151870 | 1096 | 0 | part 0[1..2], part 4[5..6] |
| 2 | 36.133412, -87.107721 | 787 | 0 | part 1[3..4], part 11[2..3] |
| 3 | 36.138049, -87.114595 | 3199 | 0 | part 1[15..25] |
| 4 | 36.135729, -87.124878 | 1083 | 0 | part 1[23..24] |
| 5 | 36.167439, -87.105436 | 800 | 0 | part 41[1..2], part 68[0..1] |
| 6 | 36.161792, -87.141117 | 537 | 0 | part 2[32..33] |
| 7 | 36.095206, -87.062777 | 718 | 0 | part 6[5..6], part 15[3..5], part 24[1..2] |
| 8 | 36.172307, -87.159848 | 557 | 0 | part 4[1..2], part 10[13..22] |
| 9 | 36.111935, -87.127471 | 850 | 0 | part 5[0..1], part 59[6..7] |
| 10 | 36.117720, -87.109463 | 1303 | 5.6 | part 5[3..8], part 18[3..4], part 56[0..1] |
| 11 | 36.111203, -87.076421 | 551 | 0 | part 6[29..30] |
| 12 | 36.113518, -87.085141 | 601 | 0 | part 6[37..38], part 7[1..2] |
| 13 | 36.109982, -87.097002 | 800 | 0 | part 8[3..4], part 39[0..1] |

### `hatchie-river` — 9 crossings (9 intra-part / 0 inter-part)

| # | lat, lon | scope | pairs |
|---|---|---|---|
| 1 | 35.638758, -89.792665 | intra-part | `p7[41,42]` x `p7[61,62]` (crossing) |
| 2 | 35.642008, -89.771717 | intra-part | `p7[42,43]` x `p7[47,48]` (crossing) |
| 3 | 35.642144, -89.770529 | intra-part | `p7[28,29]` x `p7[42,43]` (crossing)<br>`p7[42,43]` x `p7[46,47]` (crossing) |
| 4 | 35.517785, -89.337853 | intra-part | `p5[3,4]` x `p5[8,9]` (crossing) |
| 5 | 35.513491, -89.328103 | intra-part | `p2[22,23]` x `p2[28,29]` (crossing) |
| 6 | 35.522178, -89.243535 | intra-part | `p18[4,5]` x `p18[6,7]` (crossing) |
| 7 | 35.515673, -89.236536 | intra-part | `p9[217,218]` x `p9[220,221]` (crossing)<br>`p9[220,221]` x `p9[222,223]` (crossing) |
| 8 | 35.212809, -88.920805 | intra-part | `p8[88,89]` x `p8[91,92]` (crossing) |
| 9 | 35.079359, -88.796826 | intra-part | `p22[1,2]` x `p22[3,4]` (crossing) |

Sustained anti-parallel overlap runs (9):

| # | lat, lon | span (m) | mean sep (m) | parts / vertex ranges |
|---|---|---:|---:|---|
| 1 | 35.514513, -89.330262 | 1307 | 8.7 | part 2[11..23], part 5[7..8] |
| 2 | 35.516811, -89.333874 | 733 | 0 | part 5[6..7], part 53[6..7] |
| 3 | 35.522416, -89.290138 | 666 | 0 | part 3[2..3], part 4[3..4] |
| 4 | 35.515652, -89.354513 | 508 | 0 | part 34[0..1], part 36[6..7] |
| 5 | 35.640492, -89.785513 | 2699 | 0 | part 7[42..43] |
| 6 | 35.625681, -89.812117 | 1142 | 0 | part 7[74..88] |
| 7 | 35.519029, -89.242267 | 1592 | 0 | part 9[220..221], part 18[9..10] |
| 8 | 35.530840, -89.279390 | 877 | 0 | part 18[36..40] |
| 9 | 35.513309, -89.359796 | 718 | 0 | part 36[5..6], part 54[0..1] |

### `pine-creek-dekalb` — 7 crossings (7 intra-part / 0 inter-part)

| # | lat, lon | scope | pairs |
|---|---|---|---|
| 1 | 35.905590, -85.776507 | intra-part | `p0[6,7]` x `p0[8,9]` (crossing) |
| 2 | 35.907403, -85.770398 | intra-part | `p5[0,1]` x `p5[5,6]` (crossing) |
| 3 | 35.907737, -85.768111 | intra-part | `p5[1,2]` x `p5[8,9]` (crossing) |
| 4 | 35.908789, -85.768097 | intra-part | `p5[1,2]` x `p5[9,10]` (crossing) |
| 5 | 35.910393, -85.768017 | intra-part | `p5[4,5]` x `p5[10,11]` (crossing) |
| 6 | 35.910833, -85.767546 | intra-part | `p5[4,5]` x `p5[11,12]` (crossing) |
| 7 | 35.908613, -85.731805 | intra-part | `p2[1,2]` x `p2[5,6]` (crossing) |

Sustained anti-parallel overlap runs (4):

| # | lat, lon | span (m) | mean sep (m) | parts / vertex ranges |
|---|---|---:|---:|---|
| 1 | 35.907533, -85.771279 | 553 | 0 | part 0[17..18], part 5[0..1] |
| 2 | 35.911326, -85.766893 | 850 | 0 | part 5[4..5] |
| 3 | 35.911070, -85.754701 | 676 | 0 | part 5[22..23] |
| 4 | 35.911199, -85.754911 | 870 | 0 | part 5[23..24] |

### `cumberland-river` — 6 crossings (6 intra-part / 0 inter-part)

| # | lat, lon | scope | pairs |
|---|---|---|---|
| 1 | 36.501620, -87.805640 | intra-part | `p8[0,1]` x `p8[3,4]` (crossing) |
| 2 | 36.509769, -87.416679 | intra-part | `p13[0,1]` x `p13[3,4]` (crossing) |
| 3 | 36.484272, -87.347246 | intra-part | `p18[23,24]` x `p18[26,27]` (crossing)<br>`p18[23,24]` x `p18[25,26]` (crossing) |
| 4 | 36.507083, -85.574474 | intra-part | `p85[1,2]` x `p85[3,4]` (crossing) |
| 5 | 36.563769, -85.509610 | intra-part | `p86[2,3]` x `p86[4,5]` (crossing) |
| 6 | 36.736650, -85.490210 | intra-part | `p48[1,2]` x `p48[5,6]` (crossing) |

Sustained anti-parallel overlap runs (34):

| # | lat, lon | span (m) | mean sep (m) | parts / vertex ranges |
|---|---|---:|---:|---|
| 1 | 36.664297, -87.901603 | 969 | 0 | part 0[0..1], part 3[19..20] |
| 2 | 36.435464, -87.693561 | 1855 | 0 | part 1[0..1], part 5[6..7] |
| 3 | 36.500078, -87.809641 | 1948 | 2.1 | part 2[0..2], part 8[0..1] |
| 4 | 36.600864, -87.905106 | 1247 | 0 | part 3[0..1], part 4[20..21] |
| 5 | 36.491597, -87.841469 | 1474 | 0 | part 4[0..1], part 7[1..2] |
| 6 | 36.411632, -87.664317 | 1108 | 0 | part 5[0..1], part 9[2..3] |
| 7 | 36.493028, -87.828105 | 2513 | 0 | part 7[0..1], part 8[5..6] |
| 8 | 36.397597, -87.649743 | 2032 | 0 | part 9[0..1], part 10[10..11] |
| 9 | 36.423159, -87.579226 | 1669 | 0 | part 10[0..1], part 12[31..32] |
| 10 | 36.305448, -87.153047 | 752 | 0 | part 11[2..3], part 14[6..7] |
| 11 | 36.500247, -87.331014 | 562 | 0 | part 137[0..1], part 157[0..1] |
| 12 | 36.484818, -87.347271 | 1375 | 0 | part 11[54..55], part 18[23..24] |
| 13 | 36.501861, -87.416560 | 1200 | 0 | part 12[2..3], part 13[4..5] |
| 14 | 36.519611, -87.415339 | 1739 | 0 | part 13[2..3], part 17[2..3] |
| 15 | 36.284674, -87.094688 | 1771 | 0 | part 14[2..3], part 16[10..11] |
| 16 | 36.527900, -87.410215 | 1190 | 0 | part 17[1..2], part 18[27..28] |
| 17 | 36.536321, -87.397715 | 1249 | 0 | part 18[0..1], part 20[0..1] |
| 18 | 36.314577, -86.343954 | 1556 | 0 | part 21[0..1], part 22[43..44] |
| 19 | 36.367441, -86.209849 | 1522 | 0 | part 22[1..2], part 23[6..7] |
| 20 | 36.325841, -86.196598 | 1608 | 0 | part 23[1..2], part 24[21..22] |
| 21 | 36.344369, -86.108693 | 2250 | 0 | part 24[0..1], part 25[171..172] |
| 22 | 36.652020, -85.488108 | 1142 | 0 | part 26[2..3], part 34[11..12] |
| 23 | 36.516363, -85.543223 | 1100 | 0 | part 26[37..38], part 32[1..2] |
| 24 | 36.389764, -85.640592 | 1356 | 0 | part 27[0..1], part 28[32..33] |
| 25 | 36.475917, -85.604052 | 1105 | 0 | part 28[0..1], part 29[8..9] |
| 26 | 36.490742, -85.589789 | 804 | 0 | part 29[0..1], part 30[9..10] |
| 27 | 36.495382, -85.572375 | 1683 | 0 | part 30[1..2], part 32[13..14] |
| 28 | 36.506553, -85.574837 | 512 | 0 | part 85[1..2], part 123[1..2] |
| 29 | 36.675710, -85.543350 | 1126 | 0 | part 34[0..1], part 35[61..62] |
| 30 | 36.725935, -85.453562 | 1628 | 0 | part 35[2..3], part 36[23..24] |
| 31 | 36.763382, -85.392573 | 682 | 0 | part 36[0..1], part 37[10..11] |
| 32 | 36.752821, -85.353760 | 512 | 0 | part 37[2..3], part 38[1..2] |
| 33 | 36.570110, -85.507833 | 764 | 0 | part 86[1..2], part 115[1..2] |
| 34 | 36.501475, -87.335396 | 681 | 0 | part 137[1..2], part 158[1..2] |

### `red-river-clarksville` — 6 crossings (6 intra-part / 0 inter-part)

| # | lat, lon | scope | pairs |
|---|---|---|---|
| 1 | 36.603435, -87.020439 | intra-part | `p1[14,15]` x `p1[18,19]` (crossing)<br>`p1[18,19]` x `p1[31,32]` (crossing) |
| 2 | 36.634088, -86.999630 | intra-part | `p2[52,53]` x `p2[56,57]` (crossing) |
| 3 | 36.635649, -86.979910 | intra-part | `p2[17,18]` x `p2[21,22]` (crossing) |
| 4 | 36.671643, -86.940444 | intra-part | `p6[3,4]` x `p6[8,9]` (crossing)<br>`p6[8,9]` x `p6[11,12]` (crossing) |
| 5 | 36.684458, -86.934282 | intra-part | `p0[40,41]` x `p0[44,45]` (crossing) |
| 6 | 36.690027, -86.914904 | intra-part | `p0[15,16]` x `p0[23,24]` (crossing) |

Sustained anti-parallel overlap runs (10):

| # | lat, lon | span (m) | mean sep (m) | parts / vertex ranges |
|---|---|---:|---:|---|
| 1 | 36.689639, -86.892593 | 674 | 0 | part 0[0..1], part 5[18..19] |
| 2 | 36.688316, -86.910745 | 2006 | 0 | part 0[6..16] |
| 3 | 36.680301, -86.932635 | 1283 | 0 | part 0[40..41] |
| 4 | 36.603528, -87.026267 | 3444 | 1.2 | part 1[3..19] |
| 5 | 36.656661, -86.967405 | 1243 | 0 | part 6[23..26] |
| 6 | 36.630453, -87.002184 | 2804 | 0 | part 2[43..53], part 3[0..1] |
| 7 | 36.543678, -87.342015 | 694 | 0 | part 4[2..3], part 7[2..3] |
| 8 | 36.670955, -86.941829 | 2993 | 0 | part 6[0..2] |
| 9 | 36.665685, -86.963342 | 596 | 0 | part 6[7..18] |
| 10 | 36.661975, -86.968836 | 1294 | 0 | part 6[18..22] |

### `east-fork-stones-river` — 6 crossings (6 intra-part / 0 inter-part)

| # | lat, lon | scope | pairs |
|---|---|---|---|
| 1 | 35.982170, -86.450207 | intra-part | `p1[21,22]` x `p1[23,24]` (crossing) |
| 2 | 35.983468, -86.450022 | intra-part | `p1[21,22]` x `p1[32,33]` (crossing) |
| 3 | 35.982055, -86.449920 | intra-part | `p1[23,24]` x `p1[33,34]` (crossing) |
| 4 | 35.915778, -86.325891 | intra-part | `p0[67,68]` x `p0[69,70]` (crossing) |
| 5 | 35.923228, -86.315251 | intra-part | `p0[51,52]` x `p0[54,55]` (crossing) |
| 6 | 35.923197, -86.315116 | intra-part | `p0[54,55]` x `p0[59,60]` (crossing) |

Sustained anti-parallel overlap runs (8):

| # | lat, lon | span (m) | mean sep (m) | parts / vertex ranges |
|---|---|---:|---:|---|
| 1 | 35.907273, -86.288652 | 2968 | 0 | part 0[16..17] |
| 2 | 35.923901, -86.318176 | 1744 | 0 | part 0[54..55], part 22[0..1] |
| 3 | 35.977408, -86.417878 | 687 | 0 | part 1[2..3], part 3[7..8] |
| 4 | 35.980324, -86.445630 | 2333 | 6.9 | part 1[14..24] |
| 5 | 35.950977, -86.390511 | 505 | 0 | part 2[0..1], part 19[0..1] |
| 6 | 35.959558, -86.386040 | 619 | 0 | part 21[2..3], part 27[1..2] |
| 7 | 35.969112, -86.412285 | 801 | 0 | part 3[2..3], part 11[0..1] |
| 8 | 35.969415, -86.414747 | 722 | 0 | part 3[3..4], part 11[1..2] |

### `little-west-fork-creek` — 6 crossings (5 intra-part / 1 inter-part)

| # | lat, lon | scope | pairs |
|---|---|---|---|
| 1 | 36.608319, -87.450860 | inter-part | `p3[1,2]` x `p20[0,1]` (crossing) |
| 2 | 36.602560, -87.394333 | intra-part | `p1[14,15]` x `p1[20,21]` (crossing) |
| 3 | 36.600963, -87.390329 | intra-part | `p1[9,10]` x `p1[14,15]` (crossing) |
| 4 | 36.600910, -87.390196 | intra-part | `p1[14,15]` x `p1[26,27]` (crossing) |
| 5 | 36.593579, -87.379147 | intra-part | `p1[48,49]` x `p1[55,56]` (crossing) |
| 6 | 36.590757, -87.370152 | intra-part | `p1[51,52]` x `p1[62,63]` (crossing) |

Sustained anti-parallel overlap runs (8):

| # | lat, lon | span (m) | mean sep (m) | parts / vertex ranges |
|---|---|---:|---:|---|
| 1 | 36.600310, -87.388623 | 1692 | 0 | part 1[14..15] |
| 2 | 36.585676, -87.370157 | 586 | 0 | part 1[64..67] |
| 3 | 36.582388, -87.369355 | 798 | 0 | part 1[71..72], part 5[2..3] |
| 4 | 36.598612, -87.412220 | 1466 | 0 | part 2[3..8] |
| 5 | 36.609403, -87.455817 | 1285 | 0 | part 3[0..1], part 6[0..1], part 10[4..5], part 4[5..6] |
| 6 | 36.611662, -87.472141 | 1444 | 0 | part 4[2..3], part 7[4..5] |
| 7 | 36.611618, -87.473107 | 1131 | 0 | part 4[3..4], part 7[5..6] |
| 8 | 36.610658, -87.465807 | 742 | 0 | part 4[1..2] |

### `caney-fork-upper` — 5 crossings (5 intra-part / 0 inter-part)

| # | lat, lon | scope | pairs |
|---|---|---|---|
| 1 | 35.928147, -85.190625 | intra-part | `p6[11,12]` x `p6[18,19]` (crossing) |
| 2 | 35.929779, -85.189541 | intra-part | `p6[11,12]` x `p6[16,17]` (crossing) |
| 3 | 35.923837, -85.187325 | intra-part | `p20[2,3]` x `p20[4,5]` (crossing) |
| 4 | 35.968702, -85.161251 | intra-part | `p12[5,6]` x `p12[16,17]` (crossing) |
| 5 | 35.969055, -85.161226 | intra-part | `p12[6,7]` x `p12[16,17]` (crossing) |

Sustained anti-parallel overlap runs (7):

| # | lat, lon | span (m) | mean sep (m) | parts / vertex ranges |
|---|---|---:|---:|---|
| 1 | 35.812673, -85.508175 | 980 | 0 | part 1[10..11], part 2[7..8] |
| 2 | 35.814111, -85.490998 | 708 | 0 | part 2[4..5], part 3[16..17] |
| 3 | 36.007317, -85.185226 | 623 | 0 | part 5[2..3], part 8[23..24] |
| 4 | 35.985505, -85.162148 | 1063 | 0 | part 5[16..17], part 12[13..14] |
| 5 | 35.929520, -85.189591 | 1501 | 0 | part 6[1..12] |
| 6 | 35.944103, -85.176826 | 652 | 0 | part 7[1..2], part 12[20..21] |
| 7 | 36.036023, -85.170606 | 792 | 10 | part 8[2..3], part 9[0..8] |

### `mill-creek-overton` — 4 crossings (4 intra-part / 0 inter-part)

| # | lat, lon | scope | pairs |
|---|---|---|---|
| 1 | 36.494965, -85.561973 | intra-part | `p1[4,5]` x `p1[8,9]` (crossing) |
| 2 | 36.480133, -85.467445 | intra-part | `p0[10,11]` x `p0[13,14]` (crossing)<br>`p0[13,14]` x `p0[21,22]` (crossing) |
| 3 | 36.476946, -85.440076 | intra-part | `p2[13,14]` x `p2[17,18]` (crossing) |
| 4 | 36.475594, -85.424699 | intra-part | `p2[5,6]` x `p2[7,8]` (crossing) |

Sustained anti-parallel overlap runs (4):

| # | lat, lon | span (m) | mean sep (m) | parts / vertex ranges |
|---|---|---:|---:|---|
| 1 | 36.481820, -85.467069 | 1536 | 2.9 | part 0[4..14] |
| 2 | 36.497610, -85.556336 | 597 | 0 | part 1[0..1], part 7[24..25] |
| 3 | 36.248072, -85.499555 | 551 | 0 | part 3[0..1], part 5[6..7] |
| 4 | 36.452893, -85.369172 | 3041 | 0 | part 4[5..6], part 8[10..11] |

### `buffalo-river` — 3 crossings (2 intra-part / 1 inter-part)

| # | lat, lon | scope | pairs |
|---|---|---|---|
| 1 | 35.453303, -87.552240 | intra-part | `p4[12,13]` x `p4[19,20]` (crossing) |
| 2 | 35.476294, -87.476568 | intra-part | `p5[0,1]` x `p5[4,5]` (T-cross) |
| 3 | 35.334874, -87.355596 | inter-part | `p52[4,5]` x `p55[2,3]` (crossing) |

Sustained anti-parallel overlap runs (15):

| # | lat, lon | span (m) | mean sep (m) | parts / vertex ranges |
|---|---|---:|---:|---|
| 1 | 35.912825, -87.843359 | 822 | 4.2 | part 1[100..102], part 35[2..3], part 47[0..1] |
| 2 | 35.459860, -87.462487 | 1052 | 0 | part 2[41..45] |
| 3 | 35.468570, -87.466789 | 904 | 0 | part 2[48..49], part 8[2..3] |
| 4 | 35.461413, -87.527922 | 758 | 0 | part 4[2..3], part 22[2..3] |
| 5 | 35.462296, -87.523240 | 504 | 0 | part 9[13..14], part 22[1..2] |
| 6 | 35.453889, -87.550448 | 746 | 0 | part 4[14..15] |
| 7 | 35.476466, -87.474741 | 633 | 0 | part 5[4..5], part 8[4..5] |
| 8 | 35.463409, -87.491766 | 895 | 0 | part 5[22..24], part 67[0..1], part 12[3..5] |
| 9 | 35.468301, -87.501381 | 526 | 0 | part 12[5..6], part 82[0..1] |
| 10 | 35.462125, -87.512620 | 1083 | 0 | part 9[8..9] |
| 11 | 35.401509, -87.325343 | 1055 | 0 | part 37[2..3], part 97[1..2] |
| 12 | 35.926468, -87.846115 | 1794 | 0 | part 38[0..2], part 95[0..1], part 49[5..6] |
| 13 | 35.313408, -87.371753 | 523 | 0 | part 41[1..2], part 48[1..2] |
| 14 | 35.397479, -87.304454 | 855 | 0 | part 51[0..1], part 101[0..1] |
| 15 | 35.398967, -87.309043 | 523 | 0 | part 56[0..1], part 98[1..2] |

### `elk-river` — 3 crossings (3 intra-part / 0 inter-part)

| # | lat, lon | scope | pairs |
|---|---|---|---|
| 1 | 35.134936, -86.515894 | intra-part | `p6[7,8]` x `p6[9,10]` (crossing) |
| 2 | 35.145235, -86.473457 | intra-part | `p5[6,7]` x `p5[9,10]` (crossing) |
| 3 | 35.159118, -86.471063 | intra-part | `p5[8,9]` x `p5[16,17]` (crossing) |

Sustained anti-parallel overlap runs (12):

| # | lat, lon | span (m) | mean sep (m) | parts / vertex ranges |
|---|---|---:|---:|---|
| 1 | 35.096401, -86.744598 | 1074 | 0 | part 1[0..1], part 3[93..94] |
| 2 | 35.134910, -86.528404 | 560 | 0 | part 2[2..3], part 12[1..2] |
| 3 | 35.134801, -86.528957 | 766 | 0 | part 2[3..4], part 12[2..3] |
| 4 | 35.124415, -86.608025 | 830 | 0 | part 3[0..1], part 8[10..11] |
| 5 | 35.007849, -86.949643 | 530 | 0 | part 4[1..2], part 13[1..2] |
| 6 | 35.140455, -86.460236 | 1149 | 15.8 | part 5[2..3], part 14[3..4] |
| 7 | 35.138373, -86.486869 | 600 | 0 | part 5[31..32], part 11[0..1] |
| 8 | 35.150235, -86.507417 | 678 | 0 | part 10[1..2], part 24[0..1] |
| 9 | 35.134087, -86.425571 | 559 | 0 | part 18[5..6], part 26[1..2] |
| 10 | 35.151952, -86.318649 | 521 | 0 | part 19[0..1], part 20[12..13] |
| 11 | 35.016974, -86.994561 | 690 | 0 | part 53[0..1], part 56[2..3] |
| 12 | 35.016528, -86.994947 | 518 | 0 | part 53[1..2], part 56[0..1] |

### `obion-river` — 3 crossings (2 intra-part / 1 inter-part)

| # | lat, lon | scope | pairs |
|---|---|---|---|
| 1 | 36.187776, -89.296120 | intra-part | `p33[0,1]` x `p33[2,3]` (crossing) |
| 2 | 36.195676, -89.270507 | intra-part | `p2[12,13]` x `p2[14,15]` (crossing) |
| 3 | 36.204208, -89.267018 | inter-part | `p2[6,7]` x `p15[1,2]` (crossing) |

Sustained anti-parallel overlap runs (6):

| # | lat, lon | span (m) | mean sep (m) | parts / vertex ranges |
|---|---|---:|---:|---|
| 1 | 36.230328, -88.965253 | 5248 | 11.7 | part 0[6..19], part 5[0..1] |
| 2 | 35.911149, -89.637206 | 2878 | 0 | part 1[128..129] |
| 3 | 36.187632, -89.296391 | 571 | 0 | part 30[1..2], part 33[2..3] |
| 4 | 36.188407, -89.296023 | 726 | 0 | part 30[2..3], part 32[2..3] |
| 5 | 36.193747, -89.298901 | 673 | 0 | part 2[23..25], part 31[5..6] |
| 6 | 36.276865, -89.023198 | 517 | 0 | part 4[0..1], part 5[10..11] |

### `upper-hills-creek` — 3 crossings (3 intra-part / 0 inter-part)

| # | lat, lon | scope | pairs |
|---|---|---|---|
| 1 | 35.570116, -85.689066 | intra-part | `p0[8,9]` x `p0[16,17]` (crossing) |
| 2 | 35.569890, -85.679262 | intra-part | `p0[16,17]` x `p0[23,24]` (crossing) |
| 3 | 35.569887, -85.679127 | intra-part | `p0[4,5]` x `p0[16,17]` (crossing) |

Sustained anti-parallel overlap runs (2):

| # | lat, lon | span (m) | mean sep (m) | parts / vertex ranges |
|---|---|---:|---:|---|
| 1 | 35.569888, -85.683519 | 3335 | 6.8 | part 0[1..17], part 9[1..2] |
| 2 | 35.567432, -85.661740 | 590 | 0 | part 1[1..2], part 2[5..14] |

### `collins-river` — 2 crossings (1 intra-part / 1 inter-part)

| # | lat, lon | scope | pairs |
|---|---|---|---|
| 1 | 35.525635, -85.681212 | inter-part | `p7[21,22]` x `p16[1,2]` (crossing) |
| 2 | 35.506054, -85.666591 | intra-part | `p1[42,43]` x `p1[45,46]` (crossing) |

Sustained anti-parallel overlap runs (15):

| # | lat, lon | span (m) | mean sep (m) | parts / vertex ranges |
|---|---|---:|---:|---|
| 1 | 35.444744, -85.611246 | 868 | 0 | part 1[2..3], part 2[36..37] |
| 2 | 35.508724, -85.667640 | 1297 | 0 | part 1[45..46], part 15[0..1] |
| 3 | 35.674992, -85.707289 | 849 | 0 | part 3[7..8], part 5[3..4] |
| 4 | 35.671549, -85.690305 | 907 | 0 | part 5[0..1], part 9[18..19] |
| 5 | 35.584495, -85.699692 | 1985 | 0 | part 6[7..8] |
| 6 | 35.610844, -85.697255 | 1652 | 0 | part 6[26..27] |
| 7 | 35.623405, -85.689350 | 1181 | 0 | part 6[42..45] |
| 8 | 35.618375, -85.685651 | 609 | 0 | part 6[45..47] |
| 9 | 35.622627, -85.680780 | 647 | 0 | part 6[50..51], part 11[3..4] |
| 10 | 35.526228, -85.683842 | 1812 | 0 | part 7[10..12] |
| 11 | 35.553081, -85.693284 | 562 | 0 | part 8[14..22] |
| 12 | 35.555536, -85.689259 | 631 | 0 | part 8[22..25] |
| 13 | 35.559044, -85.691833 | 869 | 0 | part 8[28..30] |
| 14 | 35.560868, -85.698801 | 882 | 0 | part 8[31..34] |
| 15 | 35.536696, -85.694023 | 1251 | 0 | part 10[10..11] |

### `duck-river-tailwater` — 2 crossings (1 intra-part / 1 inter-part)

| # | lat, lon | scope | pairs |
|---|---|---|---|
| 1 | 35.476319, -86.476649 | inter-part | `p10[14,15]` x `p13[1,2]` (crossing) |
| 2 | 35.465496, -86.413534 | intra-part | `p26[8,9]` x `p26[12,13]` (crossing) |

Sustained anti-parallel overlap runs (8):

| # | lat, lon | span (m) | mean sep (m) | parts / vertex ranges |
|---|---|---:|---:|---|
| 1 | 35.466494, -86.295157 | 821 | 0 | part 0[4..5], part 1[3..4] |
| 2 | 35.480190, -86.324255 | 525 | 0 | part 0[16..17], part 26[66..67] |
| 3 | 35.472241, -86.266227 | 787 | 0 | part 2[4..5], part 16[1..2] |
| 4 | 35.473976, -86.463509 | 1391 | 0 | part 4[4..5], part 10[1..2] |
| 5 | 35.472558, -86.463876 | 766 | 0 | part 4[5..6], part 10[2..3] |
| 6 | 35.457403, -86.452053 | 1144 | 0 | part 7[10..14] |
| 7 | 35.477918, -86.276261 | 692 | 0 | part 8[0..1], part 16[4..5] |
| 8 | 35.476053, -86.359269 | 9607 | 27.1 | part 26[60..62] |

### `salt-lick-creek` — 2 crossings (2 intra-part / 0 inter-part)

| # | lat, lon | scope | pairs |
|---|---|---|---|
| 1 | 36.608494, -85.892906 | intra-part | `p2[15,16]` x `p2[20,21]` (crossing) |
| 2 | 36.597073, -85.883613 | intra-part | `p15[28,29]` x `p15[30,31]` (crossing) |

Sustained anti-parallel overlap runs (8):

| # | lat, lon | span (m) | mean sep (m) | parts / vertex ranges |
|---|---|---:|---:|---|
| 1 | 36.588257, -85.879303 | 1065 | 0.4 | part 15[7..8], part 38[0..1] |
| 2 | 36.580953, -85.870326 | 977 | 0 | part 0[11..12] |
| 3 | 36.554217, -85.864915 | 569 | 0 | part 1[4..5], part 6[15..16] |
| 4 | 36.606212, -85.887767 | 1270 | 0 | part 2[7..8], part 8[6..7] |
| 5 | 36.628519, -85.909876 | 619 | 0 | part 10[20..21] |
| 6 | 36.528372, -85.851886 | 616 | 0 | part 7[5..6], part 40[2..3] |
| 7 | 36.501020, -85.847376 | 716 | 0 | part 9[1..2], part 12[8..9] |
| 8 | 36.601286, -85.878226 | 838 | 0 | part 16[2..3], part 41[2..3] |

### `shoal-creek` — 2 crossings (1 intra-part / 1 inter-part)

| # | lat, lon | scope | pairs |
|---|---|---|---|
| 1 | 35.093321, -87.527518 | inter-part | `p13[4,5]` x `p28[0,1]` (crossing) |
| 2 | 35.124519, -87.482956 | intra-part | `p21[3,4]` x `p21[5,6]` (crossing) |

Sustained anti-parallel overlap runs (8):

| # | lat, lon | span (m) | mean sep (m) | parts / vertex ranges |
|---|---|---:|---:|---|
| 1 | 35.070680, -87.557988 | 632 | 0 | part 0[4..7], part 11[12..13] |
| 2 | 35.058403, -87.564131 | 1072 | 0 | part 0[13..14], part 25[3..4] |
| 3 | 35.025536, -87.578888 | 789 | 0 | part 0[24..25] |
| 4 | 35.114710, -87.510408 | 545 | 0 | part 7[0..1], part 16[9..10] |
| 5 | 34.998951, -87.583967 | 755 | 0 | part 5[1..2], part 10[6..7] |
| 6 | 35.226868, -87.299742 | 540 | 0 | part 9[1..2], part 12[4..5] |
| 7 | 35.082198, -87.543608 | 1145 | 0 | part 11[1..2], part 13[11..12] |
| 8 | 35.119710, -87.508990 | 681 | 0 | part 16[2..3] |

### `rocky-river` — 2 crossings (2 intra-part / 0 inter-part)

| # | lat, lon | scope | pairs |
|---|---|---|---|
| 1 | 35.749001, -85.596226 | intra-part | `p4[8,9]` x `p4[39,40]` (crossing) |
| 2 | 35.714632, -85.577343 | intra-part | `p4[22,23]` x `p4[29,30]` (crossing) |

Sustained anti-parallel overlap runs (5):

| # | lat, lon | span (m) | mean sep (m) | parts / vertex ranges |
|---|---|---:|---:|---|
| 1 | 35.698669, -85.577804 | 845 | 0 | part 0[4..5] |
| 2 | 35.537775, -85.481173 | 944 | 0 | part 2[2..3], part 6[0..1] |
| 3 | 35.720902, -85.588900 | 2420 | 6 | part 3[3..9], part 4[1..31] |
| 4 | 35.721623, -85.589169 | 2258 | 27.9 | part 4[11..13] |
| 5 | 35.746467, -85.592782 | 3211 | 0 | part 4[10..11] |

### `big-rock-creek` — 2 crossings (2 intra-part / 0 inter-part)

| # | lat, lon | scope | pairs |
|---|---|---|---|
| 1 | 35.530160, -86.768691 | intra-part | `p1[20,21]` x `p1[24,25]` (crossing) |
| 2 | 35.527022, -86.768503 | intra-part | `p1[18,19]` x `p1[24,25]` (crossing) |

Sustained anti-parallel overlap runs (4):

| # | lat, lon | span (m) | mean sep (m) | parts / vertex ranges |
|---|---|---:|---:|---|
| 1 | 35.528271, -86.768422 | 3454 | 0.5 | part 1[24..25] |
| 2 | 35.472292, -86.776757 | 1256 | 0 | part 2[5..6] |
| 3 | 35.447462, -86.787348 | 1054 | 0 | part 5[9..16] |
| 4 | 35.483944, -86.762992 | 1589 | 0 | part 8[2..4], part 9[4..11] |

### `white-oak-creek` — 2 crossings (2 intra-part / 0 inter-part)

| # | lat, lon | scope | pairs |
|---|---|---|---|
| 1 | 36.251838, -87.812575 | intra-part | `p20[4,5]` x `p20[8,9]` (crossing) |
| 2 | 36.250487, -87.803644 | intra-part | `p8[15,16]` x `p8[18,19]` (crossing) |

Sustained anti-parallel overlap runs (4):

| # | lat, lon | span (m) | mean sep (m) | parts / vertex ranges |
|---|---|---:|---:|---|
| 1 | 36.226082, -87.772550 | 515 | 0 | part 0[3..4], part 9[7..11] |
| 2 | 36.251271, -87.805535 | 741 | 0 | part 8[20..21], part 20[2..3] |
| 3 | 36.149047, -87.578432 | 527 | 0 | part 16[0..1], part 18[10..11] |
| 4 | 36.228025, -87.737282 | 782 | 0 | part 25[0..1], part 33[0..1] |

### `holston-river` — 2 crossings (1 intra-part / 1 inter-part)

| # | lat, lon | scope | pairs |
|---|---|---|---|
| 1 | 36.175654, -83.512533 | inter-part | `p0[284,285]` x `p2[0,1]` (crossing) |
| 2 | 36.455635, -82.806629 | intra-part | `p0[71,72]` x `p0[73,74]` (crossing) |

### `laurel-creek-johnson` — 2 crossings (0 intra-part / 2 inter-part)

| # | lat, lon | scope | pairs |
|---|---|---|---|
| 1 | 36.522893, -81.807559 | inter-part | `p1[0,1]` x `p12[1,2]` (crossing) |
| 2 | 36.536523, -81.784549 | inter-part | `p1[13,14]` x `p13[1,2]` (crossing) |

### `nolichucky-river` — 2 crossings (1 intra-part / 1 inter-part)

| # | lat, lon | scope | pairs |
|---|---|---|---|
| 1 | 36.067427, -82.949038 | intra-part | `p0[289,290]` x `p0[291,292]` (crossing) |
| 2 | 36.196817, -82.499955 | inter-part | `p0[60,61]` x `p13[0,1]` (crossing) |

### `barren-fork-river` — 1 crossing (1 intra-part / 0 inter-part)

| # | lat, lon | scope | pairs |
|---|---|---|---|
| 1 | 35.676516, -85.908389 | intra-part | `p13[3,4]` x `p13[31,32]` (crossing) |

Sustained anti-parallel overlap runs (11):

| # | lat, lon | span (m) | mean sep (m) | parts / vertex ranges |
|---|---|---:|---:|---|
| 1 | 35.660979, -85.836180 | 683 | 0 | part 0[2..3], part 1[16..17] |
| 2 | 35.657597, -85.861720 | 567 | 0 | part 1[1..2], part 2[7..8] |
| 3 | 35.665175, -85.879837 | 884 | 0 | part 4[2..3], part 13[14..15] |
| 4 | 35.676950, -85.936948 | 793 | 0 | part 3[4..7], part 9[1..2] |
| 5 | 35.671547, -85.927309 | 886 | 0 | part 3[10..11], part 6[2..3], part 11[0..1] |
| 6 | 35.671555, -85.928815 | 682 | 0 | part 3[11..12], part 6[3..4] |
| 7 | 35.676406, -85.917956 | 540 | 0 | part 6[7..11], part 13[30..31] |
| 8 | 35.671951, -85.902146 | 702 | 1.2 | part 7[0..2], part 13[6..26] |
| 9 | 35.675530, -85.907319 | 539 | 0 | part 13[3..4] |
| 10 | 35.669615, -85.898319 | 633 | 0 | part 13[8..10] |
| 11 | 35.667038, -85.893695 | 1099 | 0 | part 13[10..12] |

### `elk-river-lower` — 1 crossing (1 intra-part / 0 inter-part)

| # | lat, lon | scope | pairs |
|---|---|---|---|
| 1 | 35.014096, -86.997558 | intra-part | `p2[0,1]` x `p2[2,3]` (crossing) |

Sustained anti-parallel overlap runs (6):

| # | lat, lon | span (m) | mean sep (m) | parts / vertex ranges |
|---|---|---:|---:|---|
| 1 | 34.976851, -87.006078 | 1093 | 0 | part 0[3..4], part 2[22..23] |
| 2 | 34.974454, -87.006847 | 832 | 0 | part 0[4..5], part 2[23..24] |
| 3 | 34.947788, -87.041984 | 660 | 0 | part 0[13..14] |
| 4 | 34.934401, -87.041587 | 1568 | 0 | part 0[18..19], part 8[0..1], part 7[1..2] |
| 5 | 35.007849, -86.949643 | 531 | 0 | part 3[1..2], part 5[1..2] |
| 6 | 35.016920, -86.994634 | 721 | 0 | part 3[19..20], part 20[2..3] |

### `west-fork-stones-river` — 1 crossing (1 intra-part / 0 inter-part)

| # | lat, lon | scope | pairs |
|---|---|---|---|
| 1 | 35.852093, -86.424187 | intra-part | `p1[29,30]` x `p1[32,33]` (crossing)<br>`p1[32,33]` x `p1[39,40]` (crossing) |

Sustained anti-parallel overlap runs (5):

| # | lat, lon | span (m) | mean sep (m) | parts / vertex ranges |
|---|---|---:|---:|---|
| 1 | 35.692607, -86.477034 | 627 | 0 | part 0[13..14], part 4[1..2] |
| 2 | 35.693059, -86.477037 | 1810 | 0 | part 0[14..15], part 4[2..3] |
| 3 | 35.843067, -86.427991 | 2260 | 0 | part 1[22..24] |
| 4 | 35.889855, -86.430868 | 857 | 0 | part 1[61..64] |
| 5 | 35.908063, -86.429802 | 2995 | 0 | part 3[3..4] |

### `fletchers-fork` — 1 crossing (1 intra-part / 0 inter-part)

| # | lat, lon | scope | pairs |
|---|---|---|---|
| 1 | 36.551894, -87.530113 | intra-part | `p1[5,6]` x `p1[7,8]` (crossing) |

Sustained anti-parallel overlap runs (3):

| # | lat, lon | span (m) | mean sep (m) | parts / vertex ranges |
|---|---|---:|---:|---|
| 1 | 36.557679, -87.522991 | 527 | 0 | part 0[1..2], part 1[9..10] |
| 2 | 36.574126, -87.492751 | 512 | 0 | part 0[27..28], part 9[0..1] |
| 3 | 36.585153, -87.477854 | 669 | 0 | part 0[37..38], part 4[1..2] |

### `charles-creek` — 1 crossing (1 intra-part / 0 inter-part)

| # | lat, lon | scope | pairs |
|---|---|---|---|
| 1 | 35.784899, -85.933373 | intra-part | `p1[2,3]` x `p1[5,6]` (crossing) |

Sustained anti-parallel overlap runs (1):

| # | lat, lon | span (m) | mean sep (m) | parts / vertex ranges |
|---|---|---:|---:|---|
| 1 | 35.731120, -85.813684 | 820 | 0 | part 2[2..3], part 3[8..9] |

### `standing-rock-creek` — 1 crossing (1 intra-part / 0 inter-part)

| # | lat, lon | scope | pairs |
|---|---|---|---|
| 1 | 36.411908, -87.924717 | intra-part | `p1[1,2]` x `p1[5,6]` (crossing) |

Sustained anti-parallel overlap runs (1):

| # | lat, lon | span (m) | mean sep (m) | parts / vertex ranges |
|---|---|---:|---:|---|
| 1 | 36.412951, -87.892947 | 647 | 0 | part 2[1..2], part 3[14..15] |

### `little-river` — 1 crossing (0 intra-part / 1 inter-part)

| # | lat, lon | scope | pairs |
|---|---|---|---|
| 1 | 35.619536, -83.537926 | inter-part | `p4[32,33]` x `p20[1,2]` (crossing)<br>`p4[32,33]` x `p23[1,2]` (crossing)<br>`p4[32,33]` x `p26[1,2]` (crossing) |

### `new-river` — 1 crossing (0 intra-part / 1 inter-part)

| # | lat, lon | scope | pairs |
|---|---|---|---|
| 1 | 36.392137, -84.457640 | inter-part | `p0[237,238]` x `p9[0,1]` (crossing) |

### `north-prong-barren-fork` — 1 crossing (1 intra-part / 0 inter-part)

| # | lat, lon | scope | pairs |
|---|---|---|---|
| 1 | 35.698671, -85.955993 | intra-part | `p0[0,1]` x `p0[4,5]` (crossing) |

### `obed-river` — 1 crossing (0 intra-part / 1 inter-part)

| # | lat, lon | scope | pairs |
|---|---|---|---|
| 1 | 36.062189, -84.957661 | inter-part | `p0[148,149]` x `p3[0,1]` (crossing) |

### `pigeon-river` — 1 crossing (0 intra-part / 1 inter-part)

| # | lat, lon | scope | pairs |
|---|---|---|---|
| 1 | 35.813093, -83.144992 | inter-part | `p0[17,18]` x `p1[0,1]` (crossing) |

## 4. Deep dive — `duck-river-lower` and `duck-river-tailwater`

### 4.1 Verdict

The defect is an **out-of-order weld**: inside several concatenated parts the vertex sequence walks forward, **teleports backward** (a single step of 0.5–9.6 km against a median segment length of 0.08–0.4 km) and then **re-walks coordinates it has already used** (in several cases *exactly*, to full double precision). Where the re-issued pass rejoins or crosses the first pass, the polyline crosses itself. The same defect exists verbatim in `atlas-sources/verified/west-middle.geojson`: the Duck geometries there are **coordinate-identical** to `rivers.geojson` (only `gaugeIds`/`mergedFrom` properties differ), so **the west-middle rebuild produced the geometry and `rivers.geojson` carried it forward unchanged**. The west-middle topology file shows the root cause of the cross-feature duplication: `duck-river-lower` and `duck-river-tailwater` were assigned **the identical set of 60 NHD comids** (`25000102129737…25000102130816`, 100% overlap), which is why 7 whole parts exist in both features and why `duck-river-lower` reports `lengthKm: 241.94` for what is nominally a ~75 km reach.

### 4.2 `duck-river-lower` (Shelbyville to Columbia) — every crossing

99 parts / 768 vertices. 10 crossings (7 intra-part, 3 inter-part), 19 sustained anti-parallel overlap runs, 519 shared-endpoint touches ignored, 87 vertex revisits (retraces) across 17 parts, 2 teleport jumps (2.8 km and 0.6 km against median steps of 0.4 km and 0.09 km).

`lonF` is the position along the reach as a fraction of its longitude span (0 = Shelbyville/east head, 1 = Columbia/west mouth) — a robust locator for this west-flowing river. `@m` is the exact distance along the part to the crossing.

| # | lat, lon | lonF | crossing segments (0-based vertex indices) | kind | along part A | along part B |
|---|---|---:|---|---|---:|---:|
| 1 | 35.640939, -87.058186 | 0.025 | `p5[0,1]` x `p5[4,5]` | crossing | p5 @ 14 m | p5 @ 1507 m |
| 2 | 35.640937, -87.058035 | 0.025 | `p5[0,1]` x `p5[2,3]` | crossing | p5 @ 28 m | p5 @ 340 m |
| 3 | 35.645993, -87.041850 | 0.051 | `p13[0,1]` x `p13[2,3]` | crossing | p13 @ 26 m | p13 @ 272 m |
| 4 | 35.587343, -86.980475 | 0.173 | `p1[44,45]` x `p1[48,49]` | crossing | p1 @ 24664 m | p1 @ 26839 m |
| 5 | 35.568287, -86.897563 | 0.271 | `p9[1,2]` x `p9[3,4]` | crossing | p9 @ 868 m | p9 @ 1572 m |
| 6 | 35.561026, -86.895386 | 0.281 | `p6[2,3]` x `p60[0,1]` | crossing | p6 @ 224 m | p60 @ 5 m |
| 7 | 35.599250, -86.870201 | 0.326 | `p62[2,3]` x `p62[4,5]` | crossing | p62 @ 722 m | p62 @ 1307 m |
| 8 | 35.481069, -86.517260 | 0.880 | `p18[18,19]` x `p28[2,3]` | crossing | p18 @ 7169 m | p28 @ 174 m |
| 9 | 35.486135, -86.499593 | 0.899 | `p18[8,9]` x `p18[11,12]` | crossing | p18 @ 4004 m | p18 @ 4913 m |
| 10 | 35.476319, -86.476649 | 0.945 | `p25[14,15]` x `p29[1,2]` | crossing | p25 @ 4805 m | p29 @ 37 m |

### 4.3 Weld-jump analysis, crossing by crossing (lower)

Raw vertices from `rivers.geojson` (identical in `west-middle.geojson`):

**Crossing #1, #2 — part 5 (Columbia, lonF ~0.025).** Sequence `v0 [-87.058341,35.640941] -> v1 [-87.056318,35.640916] -> v2 [-87.058035,35.640921]`: the path steps ~200 m east then jumps back ~180 m west — a near-degenerate out-and-back spike that crosses itself twice (`p5[0,1] x p5[4,5]` at 35.640939,-87.058186 and `p5[0,1] x p5[2,3]` at 35.640937,-87.058035). It then teleports south (v4→v5, ~1.2 km against ~0.1 km median steps) and re-walks: `v6 [-87.061477,35.633448] == v9`, `v7 [-87.063021,35.632962] == v10`, `v8 [-87.069907,35.635225] == v12` — an exact 1.6 km retrace (v6..v8 re-emitted as v9..v12).

**Crossing #3 — part 13 (Columbia, lonF ~0.05).** `v0 [-87.04188,35.645762] -> v1 [-87.041843,35.646044] -> v2 [-87.040556,35.645766] -> v3 [-87.043626,35.646305] -> v4 [-87.051701,35.645664]`: a zigzag that reverses direction at v1 and again at v2; the long westward leg v2→v3 crosses the starting leg v0→v1 at 35.645993,-87.04185. (Part 13 also ends with a duplicated vertex, `v5 == v6`.)

**Crossing #4 — part 1, the largest single defect (reach around [-86.96..-86.99], lonF 0.14–0.17).** Raw sequence:

```
v33 [-86.985231,35.581085]
v34 [-86.98812 ,35.585158]  <-- pass 1 begins (v34..v44 walks NE to Columbia-ish bend)
...  v35..v43 ...
v44 [-86.964436,35.600142]  <-- end of pass 1
v45 [-86.986731,35.58235 ]  <-- TELEPORT 2,819 m backward (median step in this part: 396 m)
v46 [-86.98812 ,35.585158] == v34  <-- pass 2 re-walks the SAME coordinates
v47 [-86.988042,35.587857] == v35
...
v56 [-86.964436,35.600142] == v44  <-- exact 4.7 km retrace, then continues at v57
```

The teleport leg `p1[44,45]` crosses the re-issued pass at `p1[48,49]` → crossing at **35.587343,-86.980475**. The two passes also form a ~4.3 km overlay (both runs head the same direction, 0–200 m apart laterally; detected as 13 same-direction duplicate-overlay segment groups). Three further anti-parallel overlap runs (#1–#3 in §3) involve part 1's ends duplicating parts 0, 9 and 6. This single weld mistake accounts for the majority of the part-1 anomaly surface: revisits `v34..v44 == v46..v56` (11 chained revisit pairs).

**Crossing #5 — part 9 (mid-reach, ~[-86.90], lonF ~0.27).** `v3 [-86.893851,35.567728]` is followed by a **2.3 km teleport** to `v4 [-86.914508,35.570837]`, then `v5 [-86.908277,35.566155]`, `v6 == v4` — the path jumps back east, then re-walks. Crossing `p9[1,2] x p9[3,4]` at **35.568287,-86.897563** is the first pass crossing the teleport leg.

**Crossing #6 — parts 6 x 60 (inter-part, lonF ~0.28).** Part 60 is a 2-vertex micro-part `[-86.895364,35.560986] -> [-86.895458,35.561154]` whose end is welded exactly onto part 6 `v1`; its body lies across part 6's outgoing leg `p6[2,3]` → crossing at **35.561026,-86.895386**. A duplicated micro-fragment emitted on top of the main line.

**Crossing #7 — part 62 (Wartrace-side loop, ~[-86.87], lonF ~0.33).** `v2 [-86.867792,35.600669] -> v3 [-86.871051,35.598749] -> v4 [-86.870767,35.601184] -> v5 [-86.869496,35.596837]` — direction reversals at v3 and v4; legs `(2,3)` and `(4,5)` cross at **35.59925,-86.870201**.

**Crossings #8, #9 — part 18 (Shelbyville, lonF ~0.88–0.91).** `v8 [-86.505391,35.487992]` is followed by `v9 [-86.49568,35.484881] == v5` (teleport back ~1.0 km) and `v10 [-86.495659,35.48636] == v6`; the path then re-walks to `v13 == v8`. The teleport leg `p18[8,9]` crosses the retrace leg `p18[11,12]` at **35.486135,-86.499593** (#9). Separately the 2-vertex part 28 (`[-86.516507,35.481676]` duplicated as v2 and v6, with a spike) crosses part 18's end leg `p18[18,19]` at **35.481069,-86.51726** (#8, inter-part).

**Crossing #10 — parts 25 x 29 (inter-part, lonF ~0.94).** Part 25 walks `v14 [-86.476345,35.47624] -> v15 [-86.480066,35.477201] -> v16 == v15 -> v17 [-86.477322,35.476785]` — after a zero-length step it **reverses ~260 m back east**. Part 29 is `[-86.476345,35.47624] -> [-86.476435,35.47617] -> [-86.477322,35.476785]` — i.e. **part 29 re-emits part 25's v14 and v17 as a separate 2-segment piece**. The forward leg `p25[14,15]` crosses `p29[1,2]` at **35.476319,-86.476649**.

### 4.4 `duck-river-tailwater` (Normandy tailwater) — every crossing

27 parts / 243 vertices. Crossings:

| # | lat, lon | crossing segments | notes |
|---|---|---|---|
| 1 | 35.476319, -86.476649 | `p10[14,15]` x `p13[1,2]` | **Same defect, same coordinates as lower #10** — part 10 is the byte-identical copy of lower part 25, part 13 of lower part 29 |
| 2 | 35.465496, -86.413534 | `p26[8,9]` x `p26[12,13]` | see below |

**Part 26 (70 vertices) — a ~9.6 km out-and-back lollipop.** The part leaves `[-86.430458,35.469151]`, runs ~15 km east toward Normandy (`v63 [-86.332167,35.477612]`), and then a single **9.6 km teleport step (`v68 -> v69`, median step 327 m)** returns it to `[-86.430302,35.468726]` — 40 m from its own start. Nearer its head it also contains the classic weld retrace: `v7 [-86.41408,35.464594] -> v8 [-86.413045,35.465402] -> v9 [-86.430302,35.468726]` (2 km jump) `-> v10 [-86.424133,35.464257] -> v11 == v6 -> v12 == v7 -> v13` — the jump leg `p26[8,9]` crosses the re-walk leg `p26[12,13]` at **35.465496,-86.413534**.

Additionally, **part 26's path extends ~15 km east to the Normandy Dam area**, so this single part spans nearly the whole named scope of the tailwater and back — consistent with the shared-comid defect described in §4.5.

### 4.5 Parts duplicated between the two features (root cause)

Seven whole parts exist **in both features with 0 m offset** (same vertex count, same length, same coordinates):

| duck-river-lower part | verts | length (m) | duck-river-tailwater part |
|---|---:|---:|---|
| 19 | 8 | 2849 | 4 |
| 20 | 5 | 1143 | 6 |
| 21 | 22 | 6697 | 7 |
| 25 | 27 | 8065 | 10 |
| 29 | 4 | 136 | 13 |
| 33 | 6 | 844 | 17 |
| 37 | 4 | 199 | 19 |

These are the Shelbyville-area reaches (`lon -86.43..-86.55`). `west-middle.topology.json` assigns **exactly the same 60 NHD comids to both features** (100% set overlap), so the builder emitted reaches to each feature and some landed in both. This is why tailwater's crossings occur at identical coordinates to lower's, and why lower's `lengthKm` (241.94) is ~3x the nominal reach length.

### 4.6 Which builder produced it

- `apps/web/atlas-sources/verified/west-middle.geojson` duck features are **coordinate-identical** to `rivers.geojson` (only `gaugeIds` and `mergedFrom` properties differ; 56/56 comparable parts matched at 0 m offset).
- Therefore the self-intersections were **produced by the west-middle rebuild weld/segment-ordering step** and carried into `rivers.geojson` via `mergedFrom: atlas-sources/verified`. Fixing only `rivers.geojson` would be overwritten on the next rebuild — the fix belongs in the west-middle build (or a post-weld repair applied to both).

### 4.7 Fix guidance (for the repair script)

1. **Deduplicate the comid assignment**: remove the 7 duplicated parts from one feature (they belong to the tailwater reach geographically, but note lower needs its Shelbyville start — pick per NHD topology, not per feature name).
2. **Remove exact retraces**: for every part, drop the re-issued vertex run where `v[i+k] == v[j+k]` (2 m tolerance) and keep the *first* traversal; then delete the teleport leg that bridges the two passes (e.g. in lower part 1, delete `v45` and the re-run `v46..v56`, keeping `v34..v44` then continuing at `v57`).
3. **Re-weld the affected parts** so the downstream chain is monotonic westward; after surgery re-run `detect-self-intersections.mjs` — target: 0 crossings and 0 anti-parallel runs for both features.
4. Known-good exact coordinates of every crossing to verify against are tabulated in §3 and §4.2/§4.4.

## 5. Statewide observations (context)

- The retraced-weld pattern seen in the Duck is **not unique to it**: `hatchie-river` (9 crossings), `calfkiller-river` (12), `wolf-river-west-tennessee` (16), `cane-creek` (18 inter-part crossings from hand-digitized micro-parts cut across the mainstem), `big-rock-creek`, `pine-creek-dekalb`, `red-river-clarksville`, `little-west-fork-creek`, `hurricane-creek` and others show the same signature (exact vertex revisits inside single parts). A statewide pass of the fix from §4.7 is warranted.
- `mississippi-river` has no crossings but 3 anti-parallel runs (braided/looping channel sections); `sulfur-fork-creek` (6 runs), `cumberland-river` (34 runs) carry heavy sustained overlays worth a follow-up.
- Cross-feature implausible crossings (e.g. the lower/tailwater duplication) were **not** systematically audited per task scope, but the Duck case documents the mechanism.

## 6. Artifacts

- `detect-self-intersections.mjs` — detector (usage: `node detect-self-intersections.mjs <input.geojson> [out.json] [idFilter]`)
- `duck-deep-dive.mjs` — Duck weld/retrace/duplicate analysis (writes `duck-deep-dive.json`)
- `results-statewide.json` — full detector output for `rivers.geojson`
- `summary-statewide.json` — per-feature counts
- `build-report.mjs` — regenerates this report