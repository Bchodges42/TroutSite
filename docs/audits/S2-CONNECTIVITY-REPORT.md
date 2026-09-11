# CONNECTIVITY AUDIT — pre-fix state at base 6d0befe (Session 2, 2026-09-08)

Statewide audit of canonical `apps/web/public/atlas/rivers.geojson` before the Session 2 geometry fixes.
Working scripts were in apps/web/.atlas-src/audit-s2/ (gitignored). Coordinates lat,lon.

# CONNECTIVITY-REPORT — river/lake connectivity audit (trout-s2)

Date: 2026-09-08 · Working tree: `C:\Users\Benjamin\Projects\trout-s2` (clone; untouched sibling repo excluded)

Data: `apps/web/public/atlas/rivers.geojson` (147 features: 35 river, 56 creek, 38 lake, 12 tailrace, 5 pond, 1 spring;
104 MultiLineString line features, 43 polygon features). Note: `public/atlas/lakes.geojson` is an empty FeatureCollection —
all lakes (incl. every lake named below) are Polygon/MultiPolygon features inside `rivers.geojson`.

## Method

Scripts (all read-only over the geojson): `.atlas-src/audit-s2/lib.mjs`, `audit-connectivity.mjs`, `render-report.mjs`; raw
outputs in `.atlas-src/audit-s2/out/*.json`. Reproduce with `cd apps/web && node .atlas-src/audit-s2/audit-connectivity.mjs && node .atlas-src/audit-s2/render-report.mjs`.

- **Graph per line feature.** Parts = LineStrings of the MultiLineString. Two parts are unioned when (a) an endpoint of one
  lies within tolerance of any geometry (vertex or segment) of the other, or (b) any vertex of one part lies within
  tolerance of any geometry of another part (T-junctions). Chunks = connected groups of parts (union-find).
- **Tolerances reported:** `touch` = 5 m (true shared/noded vertices — how the feature actually renders), `250m`, `1km`
  (0.01°). Distances are haversine / point-to-segment in meters.
- **Dangling end** = part endpoint whose distance to every OTHER part of the same feature is > tolerance (an open end of
  its chunk). For the named waters each dangling end is matched against every other feature in the file (lines AND lake
  polygons; endpoints inside a lake polygon count as connected, distance 0, marked INSIDE).
- **Chunk gaps** = closest vertex pair between two chunks of the same feature, with both coordinates.
- **Named-lake proximity** = per line feature, min distance of its ENDPOINTS to the polygon rings (exterior + holes);
  ≤250 m or inside = **connect**, 250 m–1 km = **near-miss**. Features whose closest endpoint is >2 km are omitted.
- **Pair closest approaches** = min point-to-segment distance both directions between the two features (true closest
  approach, not just vertex-to-vertex).

---

## 1. Global per-feature chunk analysis (all 104 line features)

Features with >1 chunk at exact touch: **62** · at 250 m: **32** · at 1 km: **18**.
Many parts are un-noded (they abut within a few meters without shared coordinates), so `touch > 1` is common and only
cosmetic; the actionable fragmentation is the 250 m / 1 km columns.

| id | parts | chunks@touch | chunks@250m | chunks@1km | dangling ends@250m |
|---|---|---|---|---|---|
| clear-creek-obed | 15 | 5 | 4 | 3 | 4 |
| tennessee-river | 10 | 6 | 3 | 3 | 6 |
| elk-river-lower | 36 | 3 | 3 | 3 | 11 |
| sinking-creek-wilson | 6 | 3 | 3 | 3 | 7 |
| cane-creek | 60 | 4 | 3 | 2 | 11 |
| salt-lick-creek | 51 | 3 | 3 | 2 | 21 |
| buffalo-river | 103 | 6 | 2 | 2 | 20 |
| wolf-river-west-tennessee | 60 | 4 | 2 | 2 | 20 |
| richardson-byrd-creek | 7 | 3 | 2 | 2 | 5 |
| hiwassee-river | 5 | 2 | 2 | 2 | 4 |
| horse-creek-greene | 5 | 2 | 2 | 2 | 4 |
| hurricane-creek | 38 | 2 | 2 | 2 | 8 |
| indian-creek-claiborne | 6 | 2 | 2 | 2 | 4 |
| mill-creek-overton | 30 | 2 | 2 | 2 | 8 |
| mississippi-river | 5 | 2 | 2 | 2 | 7 |
| north-fork-holston-river | 2 | 2 | 2 | 2 | 4 |
| sulfur-fork-creek | 30 | 2 | 2 | 2 | 9 |
| watauga-river | 2 | 2 | 2 | 2 | 4 |
| citico-creek | 14 | 12 | 4 | 1 | 7 |
| doe-river | 8 | 7 | 4 | 1 | 8 |
| north-chickamauga-creek | 17 | 6 | 3 | 1 | 9 |
| gap-creek-claiborne | 7 | 5 | 3 | 1 | 6 |
| gulf-fork-big-creek | 7 | 5 | 2 | 1 | 5 |
| brush-creek-cocke | 4 | 4 | 2 | 1 | 3 |
| cumberland-river | 161 | 4 | 2 | 1 | 41 |
| forge-creek-johnson | 23 | 4 | 2 | 1 | 3 |
| mossy-creek-jefferson | 9 | 3 | 2 | 1 | 4 |
| parksville-tailwater | 14 | 3 | 2 | 1 | 4 |
| wolf-river-fentress | 3 | 3 | 2 | 1 | 4 |
| doe-creek-johnson | 4 | 2 | 2 | 1 | 4 |
| french-broad-river | 8 | 2 | 2 | 1 | 4 |
| greasy-creek-polk | 2 | 2 | 2 | 1 | 4 |
| laurel-creek-johnson | 18 | 6 | 1 | 1 | 1 |
| cosby-creek | 4 | 4 | 1 | 1 | 2 |
| little-pigeon-river | 17 | 4 | 1 | 1 | 3 |
| little-river | 28 | 4 | 1 | 1 | 2 |
| new-river | 10 | 4 | 1 | 1 | 2 |
| obion-river | 34 | 4 | 1 | 1 | 6 |
| daddys-creek | 7 | 3 | 1 | 1 | 2 |
| elk-river | 64 | 3 | 1 | 1 | 11 |
| harpeth-river | 69 | 3 | 1 | 1 | 18 |
| hatchie-river | 57 | 3 | 1 | 1 | 16 |
| laurel-fork-carter | 3 | 3 | 1 | 1 | 2 |
| leconte-creek | 8 | 3 | 1 | 1 | 2 |
| nolichucky-river | 14 | 3 | 1 | 1 | 2 |
| tellico-river | 6 | 3 | 1 | 1 | 2 |
| west-prong-little-pigeon | 17 | 3 | 1 | 1 | 2 |
| caney-fork-upper | 29 | 2 | 1 | 1 | 14 |
| clear-fork | 2 | 2 | 1 | 1 | 2 |
| collins-river | 28 | 2 | 1 | 1 | 12 |
| duck-river-lower | 99 | 2 | 1 | 1 | 16 |
| east-fork-shoal-creek | 6 | 2 | 1 | 1 | 5 |
| holston-river | 7 | 2 | 1 | 1 | 2 |
| little-sequatchie-river | 2 | 2 | 1 | 1 | 2 |
| obed-river | 5 | 2 | 1 | 1 | 2 |
| puncheon-camp-creek | 2 | 2 | 1 | 1 | 2 |
| reedy-creek | 2 | 2 | 1 | 1 | 2 |
| shoal-creek | 51 | 2 | 1 | 1 | 15 |
| south-fork-cumberland | 5 | 2 | 1 | 1 | 2 |
| south-holston-river | 2 | 2 | 1 | 1 | 2 |
| upper-roan-creek | 4 | 2 | 1 | 1 | 2 |
| white-oak-creek | 34 | 2 | 1 | 1 | 14 |
| barren-fork-river | 14 | 1 | 1 | 1 | 9 |
| beaverdam-creek | 1 | 1 | 1 | 1 | 2 |
| big-rock-creek | 17 | 1 | 1 | 1 | 6 |
| boiling-fork-creek | 6 | 1 | 1 | 1 | 8 |
| boone-tailwater | 1 | 1 | 1 | 1 | 2 |
| buffalo-creek-grainger | 1 | 1 | 1 | 1 | 2 |
| calfkiller-river | 14 | 1 | 1 | 1 | 7 |
| caney-fork-river | 2 | 1 | 1 | 1 | 2 |
| charles-creek | 14 | 1 | 1 | 1 | 5 |
| clinch-river | 1 | 1 | 1 | 1 | 2 |
| duck-river-tailwater | 27 | 1 | 1 | 1 | 7 |
| east-fork-stones-river | 29 | 1 | 1 | 1 | 13 |
| emory-river | 4 | 1 | 1 | 1 | 2 |
| fletchers-fork | 10 | 1 | 1 | 1 | 5 |
| ft-patrick-henry-tailwater | 1 | 1 | 1 | 1 | 2 |
| goforth-creek | 1 | 1 | 1 | 1 | 2 |
| little-buffalo-river | 3 | 1 | 1 | 1 | 4 |
| little-tennessee-river | 1 | 1 | 1 | 1 | 2 |
| little-west-fork-creek | 23 | 1 | 1 | 1 | 8 |
| mccutcheon-creek | 7 | 1 | 1 | 1 | 5 |
| middle-prong-little-pigeon | 4 | 1 | 1 | 1 | 2 |
| north-prong-barren-fork | 2 | 1 | 1 | 1 | 3 |
| obey-river | 11 | 1 | 1 | 1 | 5 |
| ocoee-river | 1 | 1 | 1 | 1 | 2 |
| pigeon-river | 6 | 1 | 1 | 1 | 1 |
| pine-creek-dekalb | 16 | 1 | 1 | 1 | 5 |
| piney-river-rhea | 1 | 1 | 1 | 1 | 2 |
| powell-river | 4 | 1 | 1 | 1 | 2 |
| red-river-clarksville | 20 | 1 | 1 | 1 | 8 |
| roaring-fork | 1 | 1 | 1 | 1 | 2 |
| rocky-river | 10 | 1 | 1 | 1 | 7 |
| sequatchie-river | 7 | 1 | 1 | 1 | 2 |
| spring-creek-polk | 4 | 1 | 1 | 1 | 2 |
| standing-rock-creek | 4 | 1 | 1 | 1 | 5 |
| station-creek | 5 | 1 | 1 | 1 | 0 |
| stones-river | 1 | 1 | 1 | 1 | 2 |
| stoney-creek-carter | 1 | 1 | 1 | 1 | 2 |
| trail-fork-big-creek | 1 | 1 | 1 | 1 | 2 |
| tumbling-creek | 3 | 1 | 1 | 1 | 2 |
| upper-hills-creek | 10 | 1 | 1 | 1 | 2 |
| watauga-river-wilbur-reach | 5 | 1 | 1 | 1 | 1 |
| west-fork-stones-river | 14 | 1 | 1 | 1 | 9 |

### Where chunks fail to join (every feature with >1 chunk at 250 m or 1 km)

Closest vertex pair across each chunk boundary. "d" = gap distance.

| id | tol | chunks | d | from (lat,lon) | to (lat,lon) |
|---|---|---|---|---|---|
| clear-creek-obed | 250m | 4 | 15.80 km | 36.15982, -84.97225 | 36.08921, -85.12496 |
| clear-creek-obed | 250m | 4 | 14.70 km | 36.08921, -85.12496 | 36.16080, -84.98714 |
| clear-creek-obed | 250m | 4 | 1.36 km | 36.15982, -84.97225 | 36.16070, -84.98739 |
| clear-creek-obed | 250m | 4 | 793 m | 36.08932, -85.12639 | 36.09640, -85.12497 |
| clear-creek-obed | 250m | 4 | 467 m | 36.15982, -84.97225 | 36.15922, -84.97739 |
| clear-creek-obed | 250m | 4 | 24 m | 36.16070, -84.98739 | 36.16080, -84.98714 |
| clear-creek-obed | 1km | 3 | 1.36 km | 36.15982, -84.97225 | 36.16070, -84.98739 |
| clear-creek-obed | 1km | 3 | 467 m | 36.15982, -84.97225 | 36.15922, -84.97739 |
| clear-creek-obed | 1km | 3 | 24 m | 36.16070, -84.98739 | 36.16080, -84.98714 |
| tennessee-river | 250m | 3 | 278.85 km | 35.02302, -85.68724 | 36.65665, -88.06673 |
| tennessee-river | 250m | 3 | 211.19 km | 35.00888, -85.69621 | 35.40706, -87.97276 |
| tennessee-river | 250m | 3 | 16.99 km | 36.50394, -88.04515 | 36.65665, -88.06673 |
| tennessee-river | 1km | 3 | 278.85 km | 35.02302, -85.68724 | 36.65665, -88.06673 |
| tennessee-river | 1km | 3 | 211.19 km | 35.00888, -85.69621 | 35.40706, -87.97276 |
| tennessee-river | 1km | 3 | 16.99 km | 36.50394, -88.04515 | 36.65665, -88.06673 |
| elk-river-lower | 250m | 3 | 19.32 km | 34.90234, -87.04524 | 35.03003, -86.90045 |
| elk-river-lower | 250m | 3 | 1.66 km | 35.01581, -86.90622 | 35.03003, -86.90045 |
| elk-river-lower | 250m | 3 | 1.24 km | 34.91756, -87.06027 | 34.90637, -87.05914 |
| elk-river-lower | 1km | 3 | 19.32 km | 34.90234, -87.04524 | 35.03003, -86.90045 |
| elk-river-lower | 1km | 3 | 1.66 km | 35.01581, -86.90622 | 35.03003, -86.90045 |
| elk-river-lower | 1km | 3 | 1.24 km | 34.91756, -87.06027 | 34.90637, -87.05914 |
| sinking-creek-wilson | 250m | 3 | 22.63 km | 36.12474, -86.30179 | 36.04648, -86.53417 |
| sinking-creek-wilson | 250m | 3 | 11.70 km | 36.10429, -86.42521 | 36.04648, -86.53417 |
| sinking-creek-wilson | 250m | 3 | 3.56 km | 36.13361, -86.30201 | 36.13339, -86.34164 |
| sinking-creek-wilson | 1km | 3 | 22.63 km | 36.12474, -86.30179 | 36.04648, -86.53417 |
| sinking-creek-wilson | 1km | 3 | 11.70 km | 36.10429, -86.42521 | 36.04648, -86.53417 |
| sinking-creek-wilson | 1km | 3 | 3.56 km | 36.13361, -86.30201 | 36.13339, -86.34164 |
| cane-creek | 250m | 3 | 202.65 km | 35.53539, -85.37347 | 35.61990, -87.61050 |
| cane-creek | 250m | 3 | 197.43 km | 35.81170, -85.44135 | 35.61990, -87.61050 |
| cane-creek | 250m | 3 | 542 m | 35.62624, -85.32712 | 35.62491, -85.32136 |
| cane-creek | 1km | 2 | 197.43 km | 35.81170, -85.44135 | 35.61990, -87.61050 |
| salt-lick-creek | 250m | 3 | 23.01 km | 36.40183, -85.84486 | 36.60827, -85.87768 |
| salt-lick-creek | 250m | 3 | 9.15 km | 36.48268, -85.86700 | 36.40183, -85.84486 |
| salt-lick-creek | 250m | 3 | 350 m | 36.60736, -85.88144 | 36.60827, -85.87768 |
| salt-lick-creek | 1km | 2 | 9.15 km | 36.48268, -85.86700 | 36.40183, -85.84486 |
| buffalo-river | 250m | 2 | 3.06 km | 35.39115, -87.36069 | 35.36421, -87.36835 |
| buffalo-river | 1km | 2 | 3.06 km | 35.39115, -87.36069 | 35.36421, -87.36835 |
| wolf-river-west-tennessee | 250m | 2 | 17.08 km | 34.95382, -89.19540 | 34.95172, -89.00823 |
| wolf-river-west-tennessee | 1km | 2 | 17.08 km | 34.95382, -89.19540 | 34.95172, -89.00823 |
| richardson-byrd-creek | 250m | 2 | 2.47 km | 36.49130, -83.13640 | 36.47382, -83.15355 |
| richardson-byrd-creek | 1km | 2 | 2.47 km | 36.49130, -83.13640 | 36.47382, -83.15355 |
| hiwassee-river | 250m | 2 | 1.14 km | 35.18265, -84.29596 | 35.17254, -84.29859 |
| hiwassee-river | 1km | 2 | 1.14 km | 35.18265, -84.29596 | 35.17254, -84.29859 |
| horse-creek-greene | 250m | 2 | 28.83 km | 36.42401, -82.65708 | 36.16325, -82.66317 |
| horse-creek-greene | 1km | 2 | 28.83 km | 36.42401, -82.65708 | 36.16325, -82.66317 |
| hurricane-creek | 250m | 2 | 34.41 km | 36.34721, -87.81607 | 36.10529, -87.57527 |
| hurricane-creek | 1km | 2 | 34.41 km | 36.34721, -87.81607 | 36.10529, -87.57527 |
| indian-creek-claiborne | 250m | 2 | 24.97 km | 36.55694, -83.60638 | 36.38269, -83.42906 |
| indian-creek-claiborne | 1km | 2 | 24.97 km | 36.55694, -83.60638 | 36.38269, -83.42906 |
| mill-creek-overton | 250m | 2 | 18.69 km | 36.44754, -85.36833 | 36.30261, -85.47573 |
| mill-creek-overton | 1km | 2 | 18.69 km | 36.44754, -85.36833 | 36.30261, -85.47573 |
| mississippi-river | 250m | 2 | 2.62 km | 36.47422, -89.49356 | 36.46858, -89.52200 |
| mississippi-river | 1km | 2 | 2.62 km | 36.47422, -89.49356 | 36.46858, -89.52200 |
| north-fork-holston-river | 250m | 2 | 1.09 km | 36.62057, -82.51339 | 36.62030, -82.50117 |
| north-fork-holston-river | 1km | 2 | 1.09 km | 36.62057, -82.51339 | 36.62030, -82.50117 |
| sulfur-fork-creek | 250m | 2 | 32.88 km | 36.42808, -86.69459 | 36.56659, -86.36919 |
| sulfur-fork-creek | 1km | 2 | 32.88 km | 36.42808, -86.69459 | 36.56659, -86.36919 |
| watauga-river | 250m | 2 | 1.24 km | 36.34116, -82.12636 | 36.32994, -82.12635 |
| watauga-river | 1km | 2 | 1.24 km | 36.34116, -82.12636 | 36.32994, -82.12635 |
| citico-creek | 250m | 4 | 5.52 km | 35.45115, -84.11929 | 35.40944, -84.08582 |
| citico-creek | 250m | 4 | 3.53 km | 35.42383, -84.09907 | 35.45115, -84.11929 |
| citico-creek | 250m | 4 | 2.66 km | 35.42634, -84.10672 | 35.40944, -84.08582 |
| citico-creek | 250m | 4 | 783 m | 35.45412, -84.11775 | 35.45023, -84.11053 |
| citico-creek | 250m | 4 | 747 m | 35.42383, -84.09907 | 35.42634, -84.10672 |
| citico-creek | 250m | 4 | 698 m | 35.41494, -84.08960 | 35.40944, -84.08582 |
| doe-river | 250m | 4 | 11.13 km | 36.17174, -82.07970 | 36.25013, -82.15750 |
| doe-river | 250m | 4 | 10.20 km | 36.19205, -82.06919 | 36.25013, -82.15750 |
| doe-river | 250m | 4 | 2.98 km | 36.19834, -82.07402 | 36.17174, -82.07970 |
| doe-river | 250m | 4 | 867 m | 36.17952, -82.07844 | 36.17174, -82.07970 |
| doe-river | 250m | 4 | 592 m | 36.19702, -82.06673 | 36.19205, -82.06919 |
| doe-river | 250m | 4 | 452 m | 36.24814, -82.15310 | 36.25013, -82.15750 |
| north-chickamauga-creek | 250m | 3 | 1.09 km | 35.19297, -85.23650 | 35.18350, -85.23990 |
| north-chickamauga-creek | 250m | 3 | 522 m | 35.19297, -85.23650 | 35.18996, -85.24092 |
| north-chickamauga-creek | 250m | 3 | 270 m | 35.18594, -85.23980 | 35.18350, -85.23990 |
| gap-creek-claiborne | 250m | 3 | 940 m | 36.53894, -83.69245 | 36.54182, -83.68256 |
| gap-creek-claiborne | 250m | 3 | 333 m | 36.53894, -83.69245 | 36.54092, -83.68965 |
| gap-creek-claiborne | 250m | 3 | 332 m | 36.54151, -83.68626 | 36.54182, -83.68256 |
| gulf-fork-big-creek | 250m | 2 | 683 m | 35.81426, -83.02439 | 35.81225, -83.03155 |
| brush-creek-cocke | 250m | 2 | 252 m | 35.94634, -82.93328 | 35.94859, -82.93371 |
| cumberland-river | 250m | 2 | 298 m | 36.58403, -85.50374 | 36.58594, -85.50139 |
| forge-creek-johnson | 250m | 2 | 304 m | 36.44150, -81.77006 | 36.44000, -81.77290 |
| mossy-creek-jefferson | 250m | 2 | 447 m | 36.13170, -83.50600 | 36.12852, -83.50907 |
| parksville-tailwater | 250m | 2 | 543 m | 35.14820, -84.69321 | 35.15310, -84.69360 |
| wolf-river-fentress | 250m | 2 | 665 m | 36.62793, -85.18545 | 36.62325, -85.19012 |
| doe-creek-johnson | 250m | 2 | 340 m | 36.45740, -81.87483 | 36.45953, -81.87207 |
| french-broad-river | 250m | 2 | 972 m | 35.93981, -82.91953 | 35.94159, -82.90897 |
| greasy-creek-polk | 250m | 2 | 336 m | 35.12524, -84.54552 | 35.12539, -84.54183 |

*(Features with `chunks@touch > 1` but 1 chunk at 250 m are un-noded but visually continuous; their largest part-to-part
gap is < 250 m and they are not listed above. The extreme cases in this audit — `cane-creek` 202.65 km,
`tennessee-river` 278.85 km, `mississippi-river` — are the documented deliberate multi-water id / mainstem-detour cases
already allowlisted in the repo auditor.)*

---

## 2. Named waters — detailed findings

Per named line water: chunk counts, chunk gaps, and EVERY dangling end at 250 m and 1 km with the nearest other water
in the whole file (any line feature or lake polygon). **GAP** = nearest other water is >100 m away.

### obey-river — Obey River (Dale Hollow tailwater) (tailrace, 11 parts)

Chunks: touch **1** · 250 m **1** (sizes 11) · 1 km **1** (sizes 11)

- (no intra-feature chunk gaps at 250 m / 1 km)

Dangling ends @250m (5):

| endpoint (lat,lon) | to own other parts | nearest other water | d | foot on that water |
|---|---|---|---|---|
| 36.55821, -85.49930 | 408 m | cumberland-river **GAP** | 727 m | (36.56468, -85.50078) |
| 36.55528, -85.51250 | >6km | cumberland-river | 0 m | (36.55528, -85.51250) |
| 36.52614, -85.47944 | 593 m | dale-hollow-lake **GAP** | 1.68 km | (36.51973, -85.46240) |
| 36.54309, -85.47234 | 1.31 km | dale-hollow-lake **GAP** | 1.96 km | (36.53915, -85.45094) |
| 36.53211, -85.47361 | 677 m | dale-hollow-lake **GAP** | 1.46 km | (36.52844, -85.45791) |

Dangling ends @1km (1):

| endpoint (lat,lon) | to own other parts | nearest other water | d | foot on that water |
|---|---|---|---|---|
| 36.55528, -85.51250 | >6km | cumberland-river | 0 m | (36.55528, -85.51250) |

### wolf-river-fentress — Wolf River (Fentress County headwaters) (creek, 3 parts)

Chunks: touch **3** · 250 m **2** (sizes 2, 1) · 1 km **1** (sizes 3)

- chunk gap @250 m: 665 m — (36.62793, -85.18545) → (36.62325, -85.19012)

Dangling ends @250m (4):

| endpoint (lat,lon) | to own other parts | nearest other water | d | foot on that water |
|---|---|---|---|---|
| 36.52619, -84.90099 | >6km | **GAP: none within ~6km** | — | — |
| 36.62793, -85.18545 | >6km | dale-hollow-lake | 68 m | (36.62759, -85.18608) |
| 36.62325, -85.19012 | >6km | dale-hollow-lake | 85 m | (36.62317, -85.18918) |
| 36.62077, -85.18993 | >6km | dale-hollow-lake | 40 m | (36.62074, -85.18949) |

Dangling ends @1km (1):

| endpoint (lat,lon) | to own other parts | nearest other water | d | foot on that water |
|---|---|---|---|---|
| 36.52619, -84.90099 | >6km | **GAP: none within ~6km** | — | — |

### mill-creek-overton — Mill Creek (Overton County) (creek, 30 parts)

Chunks: touch **2** · 250 m **2** (sizes 28, 2) · 1 km **2** (sizes 28, 2)

- chunk gap @250 m: 18.69 km — (36.44754, -85.36833) → (36.30261, -85.47573)
- chunk gap @1 km: 18.69 km — (36.44754, -85.36833) → (36.30261, -85.47573)

Dangling ends @250m (8):

| endpoint (lat,lon) | to own other parts | nearest other water | d | foot on that water |
|---|---|---|---|---|
| 36.48960, -85.46552 | >6km | dale-hollow-lake **GAP** | 2.37 km | (36.50910, -85.45445) |
| 36.48998, -85.50219 | >6km | cumberland-river **GAP** | 4.24 km | (36.51545, -85.53766) |
| 36.48909, -85.56630 | 359 m | cumberland-river | 0 m | (36.48909, -85.56630) |
| 36.47049, -85.41827 | 404 m | dale-hollow-lake **GAP** | 3.61 km | (36.49735, -85.39529) |
| 36.30261, -85.47573 | >6km | **GAP: none within ~6km** | — | — |
| 36.46903, -85.38337 | >6km | dale-hollow-lake **GAP** | 2.72 km | (36.49366, -85.38323) |
| 36.24003, -85.47813 | >6km | **GAP: none within ~6km** | — | — |
| 36.49363, -85.55057 | >6km | cumberland-river **GAP** | 1.38 km | (36.48964, -85.56517) |

Dangling ends @1km (4):

| endpoint (lat,lon) | to own other parts | nearest other water | d | foot on that water |
|---|---|---|---|---|
| 36.48960, -85.46552 | 1.03 km | dale-hollow-lake **GAP** | 2.37 km | (36.50910, -85.45445) |
| 36.30261, -85.47573 | >6km | **GAP: none within ~6km** | — | — |
| 36.46903, -85.38337 | >6km | dale-hollow-lake **GAP** | 2.72 km | (36.49366, -85.38323) |
| 36.24003, -85.47813 | 2.17 km | **GAP: none within ~6km** | — | — |

### cumberland-river — Cumberland River (river, 161 parts)

Chunks: touch **4** · 250 m **2** (sizes 160, 1) · 1 km **1** (sizes 161)

- chunk gap @250 m: 298 m — (36.58403, -85.50374) → (36.58594, -85.50139)

Dangling ends @250m (41):

| endpoint (lat,lon) | to own other parts | nearest other water | d | foot on that water |
|---|---|---|---|---|
| 36.66974, -87.90373 | >6km | lake-barkley | 0 m | (36.66974, -87.90373) |
| 36.78539, -87.97848 | >6km | lake-barkley | 0 m | (36.78539, -87.97848) |
| 36.43994, -87.70333 | >6km | lake-barkley | 42 m | (36.44022, -87.70302) |
| 36.60594, -87.90470 | >6km | lake-barkley | 0 m | (36.60594, -87.90470) |
| 36.49325, -87.85014 | >6km | lake-barkley | 0 m | (36.49325, -87.85014) |
| 36.41563, -87.66496 | 337 m | lake-barkley | 0 m | (36.41563, -87.66496) |
| 36.49631, -87.81931 | >6km | lake-barkley | 0 m | (36.49631, -87.81931) |
| 36.40121, -87.66153 | >6km | lake-barkley | 0 m | (36.40121, -87.66153) |
| 36.41962, -87.58805 | >6km | lake-barkley | 78 m | (36.42032, -87.58820) |
| 36.31173, -87.17045 | >6km | harpeth-river **GAP** | 1.82 km | (36.30480, -87.15209) |
| 36.49186, -87.42464 | >6km | red-river-clarksville **GAP** | 6.96 km | (36.53825, -87.37201) |
| 36.29695, -87.12501 | >6km | harpeth-river **GAP** | 1.14 km | (36.29014, -87.13452) |
| 36.24889, -87.05786 | 282 m | **GAP: none within ~6km** | — | — |
| 36.33208, -86.45978 | >6km | old-hickory-lake | 0 m | (36.33208, -86.45978) |
| 36.31140, -86.35027 | >6km | old-hickory-lake | 0 m | (36.31140, -86.35027) |
| 36.37607, -86.21532 | >6km | old-hickory-lake | 0 m | (36.37607, -86.21532) |
| 36.33633, -86.20649 | 2.55 km | old-hickory-lake | 0 m | (36.33633, -86.20649) |
| 36.34639, -86.12152 | >6km | old-hickory-lake | 0 m | (36.34639, -86.12152) |
| 36.30783, -85.75606 | >6km | caney-fork-river **GAP** | 14.98 km | (36.24540, -85.90410) |
| 36.63583, -85.49204 | >6km | dale-hollow-lake **GAP** | 7.81 km | (36.58244, -85.43473) |
| 36.38438, -85.64183 | >6km | **GAP: none within ~6km** | — | — |
| 36.47024, -85.59858 | >6km | mill-creek-overton **GAP** | 3.56 km | (36.48909, -85.56630) |
| 36.49459, -85.59307 | >6km | mill-creek-overton **GAP** | 2.47 km | (36.48909, -85.56630) |
| 36.48909, -85.56630 | >6km | mill-creek-overton | 0 m | (36.48909, -85.56630) |
| 36.50370, -85.57106 | 251 m | mill-creek-overton **GAP** | 1.21 km | (36.49678, -85.56061) |
| 36.67344, -85.53804 | 510 m | **GAP: none within ~6km** | — | — |
| 36.73714, -85.46454 | 334 m | dale-hollow-lake **GAP** | 12.24 km | (36.68318, -85.34481) |
| 36.76570, -85.39448 | 275 m | **GAP: none within ~6km** | — | — |
| 36.74553, -85.36279 | >6km | dale-hollow-lake **GAP** | 7.08 km | (36.68318, -85.34481) |
| 36.75816, -85.36014 | 782 m | dale-hollow-lake **GAP** | 8.40 km | (36.68318, -85.34481) |
| 36.68043, -85.51698 | 354 m | dale-hollow-lake **GAP** | 12.52 km | (36.61386, -85.40362) |
| 36.67971, -85.51190 | 329 m | dale-hollow-lake **GAP** | 12.09 km | (36.62271, -85.39637) |
| 36.58561, -85.50045 | 342 m | obey-river **GAP** | 2.67 km | (36.56160, -85.49724) |
| 36.58594, -85.50139 | 298 m | obey-river **GAP** | 2.72 km | (36.56160, -85.49724) |
| 36.51456, -85.58052 | 484 m | mill-creek-overton **GAP** | 2.62 km | (36.49953, -85.55783) |
| 36.53755, -87.40366 | 343 m | red-river-clarksville **GAP** | 2.83 km | (36.53825, -87.37201) |
| 36.50005, -87.30752 | 297 m | red-river-clarksville **GAP** | 3.01 km | (36.52441, -87.32263) |
| 36.52918, -87.41336 | 319 m | red-river-clarksville **GAP** | 3.83 km | (36.53825, -87.37201) |
| 36.50249, -87.32891 | 342 m | red-river-clarksville **GAP** | 2.36 km | (36.52364, -87.33282) |
| 36.50436, -87.33915 | 408 m | red-river-clarksville **GAP** | 2.21 km | (36.52364, -87.33282) |
| 36.49282, -87.32934 | 263 m | red-river-clarksville **GAP** | 3.42 km | (36.52364, -87.33282) |

Dangling ends @1km (14):

| endpoint (lat,lon) | to own other parts | nearest other water | d | foot on that water |
|---|---|---|---|---|
| 36.78539, -87.97848 | >6km | lake-barkley | 0 m | (36.78539, -87.97848) |
| 36.43994, -87.70333 | 1.08 km | lake-barkley | 42 m | (36.44022, -87.70302) |
| 36.40121, -87.66153 | 1.29 km | lake-barkley | 0 m | (36.40121, -87.66153) |
| 36.31173, -87.17045 | >6km | harpeth-river **GAP** | 1.82 km | (36.30480, -87.15209) |
| 36.49186, -87.42464 | 1.11 km | red-river-clarksville **GAP** | 6.96 km | (36.53825, -87.37201) |
| 36.29695, -87.12501 | >6km | harpeth-river **GAP** | 1.14 km | (36.29014, -87.13452) |
| 36.33208, -86.45978 | >6km | old-hickory-lake | 0 m | (36.33208, -86.45978) |
| 36.37607, -86.21532 | 1.09 km | old-hickory-lake | 0 m | (36.37607, -86.21532) |
| 36.33633, -86.20649 | 1.54 km | old-hickory-lake | 0 m | (36.33633, -86.20649) |
| 36.34639, -86.12152 | >6km | old-hickory-lake | 0 m | (36.34639, -86.12152) |
| 36.30783, -85.75606 | 1.11 km | caney-fork-river **GAP** | 14.98 km | (36.24540, -85.90410) |
| 36.63583, -85.49204 | 1.05 km | dale-hollow-lake **GAP** | 7.81 km | (36.58244, -85.43473) |
| 36.47024, -85.59858 | 1.04 km | mill-creek-overton **GAP** | 3.56 km | (36.48909, -85.56630) |
| 36.74553, -85.36279 | 1.20 km | dale-hollow-lake **GAP** | 7.08 km | (36.68318, -85.34481) |

### elk-river — Elk River (Tims Ford tailwater) (tailrace, 64 parts)

Chunks: touch **3** · 250 m **1** (sizes 64) · 1 km **1** (sizes 64)

- (no intra-feature chunk gaps at 250 m / 1 km)

Dangling ends @250m (11):

| endpoint (lat,lon) | to own other parts | nearest other water | d | foot on that water |
|---|---|---|---|---|
| 35.09340, -86.74726 | 289 m | **GAP: none within ~6km** | — | — |
| 35.13549, -86.52614 | 266 m | **GAP: none within ~6km** | — | — |
| 35.12102, -86.61010 | 425 m | **GAP: none within ~6km** | — | — |
| 35.14078, -86.48325 | 410 m | **GAP: none within ~6km** | — | — |
| 35.14948, -86.51122 | 373 m | **GAP: none within ~6km** | — | — |
| 35.14280, -86.44452 | 358 m | **GAP: none within ~6km** | — | — |
| 35.14995, -86.31681 | 295 m | tims-ford-lake **GAP** | 6.17 km | (35.19718, -86.28064) |
| 35.19238, -86.28066 | >6km | tims-ford-lake **GAP** | 526 m | (35.19709, -86.27987) |
| 35.01070, -86.93959 | >6km | elk-river-lower | 0 m | (35.01070, -86.93959) |
| 35.13677, -86.43467 | >6km | **GAP: none within ~6km** | — | — |
| 35.12380, -86.53426 | 335 m | **GAP: none within ~6km** | — | — |

Dangling ends @1km (1):

| endpoint (lat,lon) | to own other parts | nearest other water | d | foot on that water |
|---|---|---|---|---|
| 35.19238, -86.28066 | >6km | tims-ford-lake **GAP** | 526 m | (35.19709, -86.27987) |

### elk-river-lower — Elk River (Prospect to state line) (river, 36 parts)

Chunks: touch **3** · 250 m **3** (sizes 34, 1, 1) · 1 km **3** (sizes 34, 1, 1)

- chunk gap @250 m: 19.32 km — (34.90234, -87.04524) → (35.03003, -86.90045)
- chunk gap @250 m: 1.66 km — (35.01581, -86.90622) → (35.03003, -86.90045)
- chunk gap @250 m: 1.24 km — (34.91756, -87.06027) → (34.90637, -87.05914)
- chunk gap @1 km: 19.32 km — (34.90234, -87.04524) → (35.03003, -86.90045)
- chunk gap @1 km: 1.66 km — (35.01581, -86.90622) → (35.03003, -86.90045)
- chunk gap @1 km: 1.24 km — (34.91756, -87.06027) → (34.90637, -87.05914)

Dangling ends @250m (11):

| endpoint (lat,lon) | to own other parts | nearest other water | d | foot on that water |
|---|---|---|---|---|
| 34.97211, -87.00952 | 536 m | elk-river **GAP** | 4.53 km | (35.00488, -86.97967) |
| 34.94708, -87.04177 | >6km | east-fork-shoal-creek **GAP** | 8.24 km | (35.00463, -87.09921) |
| 35.01595, -86.90830 | >6km | elk-river | 0 m | (35.01595, -86.90830) |
| 34.90637, -87.05914 | >6km | **GAP: none within ~6km** | — | — |
| 34.90234, -87.04524 | >6km | **GAP: none within ~6km** | — | — |
| 35.03907, -86.90144 | >6km | elk-river | 0 m | (35.03907, -86.90144) |
| 35.03003, -86.90045 | >6km | elk-river | 0 m | (35.03003, -86.90045) |
| 34.92722, -87.04241 | 348 m | **GAP: none within ~6km** | — | — |
| 34.91756, -87.06027 | >6km | **GAP: none within ~6km** | — | — |
| 35.01070, -86.93959 | >6km | elk-river | 0 m | (35.01070, -86.93959) |
| 34.93950, -87.03753 | 312 m | **GAP: none within ~6km** | — | — |

Dangling ends @1km (6):

| endpoint (lat,lon) | to own other parts | nearest other water | d | foot on that water |
|---|---|---|---|---|
| 35.01595, -86.90830 | >6km | elk-river | 0 m | (35.01595, -86.90830) |
| 34.90637, -87.05914 | 1.24 km | **GAP: none within ~6km** | — | — |
| 34.90234, -87.04524 | >6km | **GAP: none within ~6km** | — | — |
| 35.03907, -86.90144 | 2.61 km | elk-river | 0 m | (35.03907, -86.90144) |
| 35.03003, -86.90045 | 1.66 km | elk-river | 0 m | (35.03003, -86.90045) |
| 34.91756, -87.06027 | 1.24 km | **GAP: none within ~6km** | — | — |

### tellico-river — Tellico River (river, 6 parts)

Chunks: touch **3** · 250 m **1** (sizes 6) · 1 km **1** (sizes 6)

- (no intra-feature chunk gaps at 250 m / 1 km)

Dangling ends @250m (2):

| endpoint (lat,lon) | to own other parts | nearest other water | d | foot on that water |
|---|---|---|---|---|
| 35.30265, -84.11822 | >6km | tennessee-river **GAP** | 50.43 km | (35.73138, -84.30910) |
| 35.43414, -84.26190 | >6km | tellico-lake **GAP** | 2.68 km | (35.45818, -84.25832) |

Dangling ends @1km (2):

| endpoint (lat,lon) | to own other parts | nearest other water | d | foot on that water |
|---|---|---|---|---|
| 35.30265, -84.11822 | >6km | tennessee-river **GAP** | 50.43 km | (35.73138, -84.30910) |
| 35.43414, -84.26190 | >6km | tellico-lake **GAP** | 2.68 km | (35.45818, -84.25832) |

### little-sequatchie-river — Little Sequatchie River (creek, 2 parts)

Chunks: touch **2** · 250 m **1** (sizes 2) · 1 km **1** (sizes 2)

- (no intra-feature chunk gaps at 250 m / 1 km)

Dangling ends @250m (2):

| endpoint (lat,lon) | to own other parts | nearest other water | d | foot on that water |
|---|---|---|---|---|
| 35.30214, -85.64447 | >6km | tennessee-river **GAP** | 27.78 km | (35.07279, -85.51984) |
| 35.08891, -85.57764 | >6km | sequatchie-river | 0 m | (35.08891, -85.57764) |

Dangling ends @1km (2):

| endpoint (lat,lon) | to own other parts | nearest other water | d | foot on that water |
|---|---|---|---|---|
| 35.30214, -85.64447 | >6km | tennessee-river **GAP** | 27.78 km | (35.07279, -85.51984) |
| 35.08891, -85.57764 | >6km | sequatchie-river | 0 m | (35.08891, -85.57764) |

### sequatchie-river — Sequatchie River (headwaters) (river, 7 parts)

Chunks: touch **1** · 250 m **1** (sizes 7) · 1 km **1** (sizes 7)

- (no intra-feature chunk gaps at 250 m / 1 km)

Dangling ends @250m (2):

| endpoint (lat,lon) | to own other parts | nearest other water | d | foot on that water |
|---|---|---|---|---|
| 35.82245, -84.97827 | >6km | daddys-creek **GAP** | 2.23 km | (35.84052, -84.98930) |
| 35.02551, -85.63734 | >6km | tennessee-river | 0 m | (35.02551, -85.63734) |

Dangling ends @1km (2):

| endpoint (lat,lon) | to own other parts | nearest other water | d | foot on that water |
|---|---|---|---|---|
| 35.82245, -84.97827 | >6km | daddys-creek **GAP** | 2.23 km | (35.84052, -84.98930) |
| 35.02551, -85.63734 | >6km | tennessee-river | 0 m | (35.02551, -85.63734) |

### collins-river — Collins River (river, 28 parts)

Chunks: touch **2** · 250 m **1** (sizes 28) · 1 km **1** (sizes 28)

- (no intra-feature chunk gaps at 250 m / 1 km)

Dangling ends @250m (12):

| endpoint (lat,lon) | to own other parts | nearest other water | d | foot on that water |
|---|---|---|---|---|
| 35.69661, -85.72172 | 556 m | great-falls-lake | 0 m | (35.69661, -85.72172) |
| 35.80107, -85.62027 | >6km | caney-fork-upper | 0 m | (35.80107, -85.62027) |
| 35.45412, -85.62365 | >6km | tennessee-river **GAP** | 41.82 km | (35.11991, -85.40847) |
| 35.39628, -85.58069 | >6km | tennessee-river **GAP** | 34.34 km | (35.11991, -85.40847) |
| 35.67943, -85.72482 | >6km | great-falls-lake | 0 m | (35.67943, -85.72482) |
| 35.67434, -85.69287 | 318 m | great-falls-lake | 0 m | (35.67434, -85.69287) |
| 35.62507, -85.68945 | 440 m | great-falls-lake | 0 m | (35.62507, -85.68945) |
| 35.55255, -85.69345 | >6km | great-falls-lake | 0 m | (35.55255, -85.69345) |
| 35.64333, -85.70374 | >6km | great-falls-lake | 0 m | (35.64333, -85.70374) |
| 35.53638, -85.69036 | >6km | great-falls-lake | 0 m | (35.53638, -85.69036) |
| 35.53632, -85.69069 | >6km | great-falls-lake | 0 m | (35.53632, -85.69069) |
| 35.62507, -85.68345 | 468 m | great-falls-lake | 0 m | (35.62507, -85.68345) |

Dangling ends @1km (4):

| endpoint (lat,lon) | to own other parts | nearest other water | d | foot on that water |
|---|---|---|---|---|
| 35.80107, -85.62027 | >6km | caney-fork-upper | 0 m | (35.80107, -85.62027) |
| 35.45412, -85.62365 | >6km | tennessee-river **GAP** | 41.82 km | (35.11991, -85.40847) |
| 35.39628, -85.58069 | >6km | tennessee-river **GAP** | 34.34 km | (35.11991, -85.40847) |
| 35.67943, -85.72482 | >6km | great-falls-lake | 0 m | (35.67943, -85.72482) |

### duck-river-lower — Duck River (Shelbyville to Columbia) (river, 99 parts)

Chunks: touch **2** · 250 m **1** (sizes 99) · 1 km **1** (sizes 99)

- (no intra-feature chunk gaps at 250 m / 1 km)

Dangling ends @250m (16):

| endpoint (lat,lon) | to own other parts | nearest other water | d | foot on that water |
|---|---|---|---|---|
| 35.56133, -86.92949 | >6km | **GAP: none within ~6km** | — | — |
| 35.60856, -86.88739 | >6km | **GAP: none within ~6km** | — | — |
| 35.54860, -86.58916 | >6km | **GAP: none within ~6km** | — | — |
| 35.61708, -86.81348 | >6km | big-rock-creek **GAP** | 5.66 km | (35.57654, -86.77536) |
| 35.64094, -87.05834 | >6km | **GAP: none within ~6km** | — | — |
| 35.64043, -87.07389 | 362 m | **GAP: none within ~6km** | — | — |
| 35.53789, -86.56446 | >6km | **GAP: none within ~6km** | — | — |
| 35.56492, -86.90570 | >6km | **GAP: none within ~6km** | — | — |
| 35.57440, -86.91319 | 380 m | **GAP: none within ~6km** | — | — |
| 35.53998, -86.54657 | 351 m | duck-river-tailwater **GAP** | 8.86 km | (35.47747, -86.48535) |
| 35.53724, -86.52639 | 426 m | duck-river-tailwater **GAP** | 7.58 km | (35.47747, -86.48535) |
| 35.48198, -86.49840 | >6km | duck-river-tailwater **GAP** | 1.17 km | (35.47175, -86.49505) |
| 35.46565, -86.48464 | 359 m | duck-river-tailwater | 0 m | (35.46565, -86.48464) |
| 35.47358, -86.50524 | 252 m | duck-river-tailwater **GAP** | 805 m | (35.46853, -86.49884) |
| 35.46806, -86.49939 | 266 m | duck-river-tailwater | 0 m | (35.46806, -86.49939) |
| 35.62839, -87.01153 | 254 m | **GAP: none within ~6km** | — | — |

Dangling ends @1km (3):

| endpoint (lat,lon) | to own other parts | nearest other water | d | foot on that water |
|---|---|---|---|---|
| 35.56133, -86.92949 | >6km | **GAP: none within ~6km** | — | — |
| 35.61708, -86.81348 | 1.30 km | big-rock-creek **GAP** | 5.66 km | (35.57654, -86.77536) |
| 35.53789, -86.56446 | >6km | **GAP: none within ~6km** | — | — |

### duck-river-tailwater — Duck River (Normandy tailwater) (tailrace, 27 parts)

Chunks: touch **1** · 250 m **1** (sizes 27) · 1 km **1** (sizes 27)

- (no intra-feature chunk gaps at 250 m / 1 km)

Dangling ends @250m (7):

| endpoint (lat,lon) | to own other parts | nearest other water | d | foot on that water |
|---|---|---|---|---|
| 35.47048, -86.30527 | >6km | normandy-lake **GAP** | 5.17 km | (35.47124, -86.24822) |
| 35.46514, -86.24670 | >6km | normandy-lake | 28 m | (35.46539, -86.24670) |
| 35.47985, -86.28010 | >6km | normandy-lake **GAP** | 3.04 km | (35.47124, -86.24822) |
| 35.46565, -86.48464 | 359 m | duck-river-lower | 0 m | (35.46565, -86.48464) |
| 35.46806, -86.49939 | >6km | duck-river-lower | 0 m | (35.46806, -86.49939) |
| 35.46915, -86.43046 | >6km | duck-river-lower | 0 m | (35.46915, -86.43046) |
| 35.46873, -86.43030 | >6km | duck-river-lower | 0 m | (35.46873, -86.43030) |

Dangling ends @1km (2):

| endpoint (lat,lon) | to own other parts | nearest other water | d | foot on that water |
|---|---|---|---|---|
| 35.46514, -86.24670 | 1.26 km | normandy-lake | 28 m | (35.46539, -86.24670) |
| 35.46873, -86.43030 | 1.04 km | duck-river-lower | 0 m | (35.46873, -86.43030) |

### caney-fork-river — Caney Fork River (Center Hill tailwater) (tailrace, 2 parts)

Chunks: touch **1** · 250 m **1** (sizes 2) · 1 km **1** (sizes 2)

- (no intra-feature chunk gaps at 250 m / 1 km)

Dangling ends @250m (2):

| endpoint (lat,lon) | to own other parts | nearest other water | d | foot on that water |
|---|---|---|---|---|
| 36.09794, -85.82628 | >6km | caney-fork-upper | 0 m | (36.09794, -85.82628) |
| 36.23962, -85.94173 | >6km | cumberland-river | 0 m | (36.23962, -85.94173) |

Dangling ends @1km (2):

| endpoint (lat,lon) | to own other parts | nearest other water | d | foot on that water |
|---|---|---|---|---|
| 36.09794, -85.82628 | >6km | caney-fork-upper | 0 m | (36.09794, -85.82628) |
| 36.23962, -85.94173 | >6km | cumberland-river | 0 m | (36.23962, -85.94173) |

### caney-fork-upper — Caney Fork River (above Center Hill Lake) (river, 29 parts)

Chunks: touch **2** · 250 m **1** (sizes 29) · 1 km **1** (sizes 29)

- (no intra-feature chunk gaps at 250 m / 1 km)

Dangling ends @250m (14):

| endpoint (lat,lon) | to own other parts | nearest other water | d | foot on that water |
|---|---|---|---|---|
| 36.04325, -85.78696 | >6km | center-hill-lake | 0 m | (36.04325, -85.78696) |
| 36.09794, -85.82628 | >6km | caney-fork-river | 0 m | (36.09794, -85.82628) |
| 35.79141, -85.52416 | >6km | calfkiller-river **GAP** | 5.07 km | (35.81974, -85.47996) |
| 35.80648, -85.49793 | >6km | calfkiller-river **GAP** | 2.19 km | (35.81974, -85.47996) |
| 35.81918, -85.44519 | >6km | cane-creek **GAP** | 734 m | (35.81492, -85.43896) |
| 35.89682, -85.19411 | 359 m | tennessee-river **GAP** | 44.34 km | (35.68589, -84.77695) |
| 36.00240, -85.18302 | >6km | tennessee-river **GAP** | 49.68 km | (35.75621, -84.72298) |
| 35.98823, -85.15941 | 294 m | obed-river **GAP** | 8.61 km | (35.92698, -85.10041) |
| 35.94372, -85.18061 | 349 m | tennessee-river **GAP** | 46.13 km | (35.70156, -84.76508) |
| 35.93319, -85.17666 | 349 m | tennessee-river **GAP** | 45.16 km | (35.70156, -84.76508) |
| 36.03560, -85.17591 | 268 m | clear-creek-obed **GAP** | 3.24 km | (36.06432, -85.16873) |
| 35.97993, -85.16349 | 255 m | obed-river **GAP** | 8.14 km | (35.91849, -85.11365) |
| 36.02079, -85.19119 | 315 m | clear-creek-obed **GAP** | 5.22 km | (36.06432, -85.16873) |
| 35.97939, -85.17096 | 270 m | obed-river **GAP** | 8.49 km | (35.91849, -85.11365) |

Dangling ends @1km (4):

| endpoint (lat,lon) | to own other parts | nearest other water | d | foot on that water |
|---|---|---|---|---|
| 36.04325, -85.78696 | >6km | center-hill-lake | 0 m | (36.04325, -85.78696) |
| 36.09794, -85.82628 | >6km | caney-fork-river | 0 m | (36.09794, -85.82628) |
| 35.79141, -85.52416 | >6km | calfkiller-river **GAP** | 5.07 km | (35.81974, -85.47996) |
| 35.80648, -85.49793 | 1.06 km | calfkiller-river **GAP** | 2.19 km | (35.81974, -85.47996) |

### horse-creek-greene — Horse Creek (Greene County) (creek, 5 parts)

Chunks: touch **2** · 250 m **2** (sizes 4, 1) · 1 km **2** (sizes 4, 1)

- chunk gap @250 m: 28.83 km — (36.42401, -82.65708) → (36.16325, -82.66317)
- chunk gap @1 km: 28.83 km — (36.42401, -82.65708) → (36.16325, -82.66317)

Dangling ends @250m (4):

| endpoint (lat,lon) | to own other parts | nearest other water | d | foot on that water |
|---|---|---|---|---|
| 36.42401, -82.65708 | >6km | cherokee-lake **GAP** | 8.39 km | (36.49774, -82.67955) |
| 36.52910, -82.56139 | >6km | ft-patrick-henry-tailwater | 12 m | (36.52902, -82.56149) |
| 36.06826, -82.63314 | >6km | nolichucky-river **GAP** | 10.19 km | (36.15172, -82.58510) |
| 36.16436, -82.71084 | >6km | nolichucky-river | 0 m | (36.16436, -82.71084) |

Dangling ends @1km (4):

| endpoint (lat,lon) | to own other parts | nearest other water | d | foot on that water |
|---|---|---|---|---|
| 36.42401, -82.65708 | >6km | cherokee-lake **GAP** | 8.39 km | (36.49774, -82.67955) |
| 36.52910, -82.56139 | >6km | ft-patrick-henry-tailwater | 12 m | (36.52902, -82.56149) |
| 36.06826, -82.63314 | >6km | nolichucky-river **GAP** | 10.19 km | (36.15172, -82.58510) |
| 36.16436, -82.71084 | >6km | nolichucky-river | 0 m | (36.16436, -82.71084) |

### brush-creek-cocke — Brush Creek (Cocke County) (creek, 4 parts)

Chunks: touch **4** · 250 m **2** (sizes 3, 1) · 1 km **1** (sizes 4)

- chunk gap @250 m: 252 m — (35.94634, -82.93328) → (35.94859, -82.93371)

Dangling ends @250m (3):

| endpoint (lat,lon) | to own other parts | nearest other water | d | foot on that water |
|---|---|---|---|---|
| 35.94063, -82.92924 | >6km | french-broad-river | 41 m | (35.94033, -82.92897) |
| 35.94634, -82.93328 | 252 m | french-broad-river **GAP** | 766 m | (35.94051, -82.92868) |
| 35.94859, -82.93371 | 252 m | french-broad-river **GAP** | 1.00 km | (35.94051, -82.92868) |

Dangling ends @1km (0):

| endpoint (lat,lon) | to own other parts | nearest other water | d | foot on that water |
|---|---|---|---|---|

### south-fork-cumberland — South Fork Cumberland River (river, 5 parts)

Chunks: touch **2** · 250 m **1** (sizes 5) · 1 km **1** (sizes 5)

- (no intra-feature chunk gaps at 250 m / 1 km)

Dangling ends @250m (2):

| endpoint (lat,lon) | to own other parts | nearest other water | d | foot on that water |
|---|---|---|---|---|
| 36.42430, -84.62359 | >6km | new-river | 0 m | (36.42430, -84.62359) |
| 36.59846, -84.60536 | >6km | **GAP: none within ~6km** | — | — |

Dangling ends @1km (1):

| endpoint (lat,lon) | to own other parts | nearest other water | d | foot on that water |
|---|---|---|---|---|
| 36.42430, -84.62359 | >6km | new-river | 0 m | (36.42430, -84.62359) |

---

## 3. Named lakes — which lines connect / near-miss

Per named lake: every line feature whose closest endpoint is within 2 km of the polygon boundary. `d(minEnd)` = closest
endpoint distance (INSIDE = endpoint within the polygon). Connect = ≤250 m or inside; near-miss = 250 m–1 km.

### dale-hollow-lake — Dale Hollow Lake (14 rings)

| line feature | d(minEnd) | at | connect ends ≤250m | near-miss ends 250m–1km |
|---|---|---|---|---|
| wolf-river-fentress | 40 m | (36.62077, -85.18993) | 3 | 0 |
| obey-river | 1.13 km | (36.52557, -85.47270) | 0 | 0 |

- wolf-river-fentress: connect (36.62793, -85.18545) d=68 m · connect (36.62325, -85.19012) d=85 m · connect (36.62077, -85.18993) d=40 m

### woods-reservoir — Woods Reservoir (8 rings)

**No line feature comes within 2 km of this polygon** — nothing connects to it.

### tims-ford-lake — Tims Ford Lake (8 rings)

| line feature | d(minEnd) | at | connect ends ≤250m | near-miss ends 250m–1km |
|---|---|---|---|---|
| boiling-fork-creek | 12 m | (35.19964, -86.11713) | 1 | 0 |
| elk-river | 526 m | (35.19238, -86.28066) | 0 | 1 |

- boiling-fork-creek: connect (35.19964, -86.11713) d=12 m
- elk-river: near-miss (35.19238, -86.28066) d=526 m

### tellico-lake — Tellico Lake (22 rings)

| line feature | d(minEnd) | at | connect ends ≤250m | near-miss ends 250m–1km |
|---|---|---|---|---|
| little-tennessee-river | 4 m | (35.77790, -84.25977) | 1 | 0 |
| citico-creek | 726 m | (35.53386, -84.10465) | 0 | 1 |

- little-tennessee-river: connect (35.77790, -84.25977) d=4 m
- citico-creek: near-miss (35.53386, -84.10465) d=726 m

### great-falls-lake — Great Falls Lake (14 rings)

| line feature | d(minEnd) | at | connect ends ≤250m | near-miss ends 250m–1km |
|---|---|---|---|---|
| barren-fork-river | 0 (INSIDE) | (35.65611, -85.83814) | 26 | 2 |
| charles-creek | 0 (INSIDE) | (35.73483, -85.84269) | 21 | 0 |
| collins-river | 0 (INSIDE) | (35.69661, -85.72172) | 40 | 5 |
| upper-hills-creek | 0 (INSIDE) | (35.56950, -85.66981) | 19 | 0 |
| calfkiller-river | 10 m | (35.96438, -85.41271) | 1 | 1 |
| caney-fork-upper | 20 m | (35.82921, -85.30720) | 2 | 0 |
| north-prong-barren-fork | 24 m | (35.68068, -85.94259) | 1 | 0 |

- barren-fork-river: connect (35.65611, -85.83814) d=INSIDE · connect (35.69403, -85.72700) d=INSIDE · connect (35.65927, -85.85470) d=INSIDE · connect (35.66175, -85.83535) d=INSIDE · connect (35.66157, -85.87498) d=INSIDE · connect (35.65746, -85.86248) d=INSIDE · connect (35.67899, -85.94018) d=INSIDE · connect (35.67172, -85.93078) d=INSIDE · near-miss (35.67818, -85.93330) d=292 m · near-miss (35.67621, -85.93046) d=409 m
- charles-creek: connect (35.73483, -85.84269) d=INSIDE · connect (35.72979, -85.81099) d=INSIDE · connect (35.71887, -85.74124) d=INSIDE · connect (35.73305, -85.82607) d=INSIDE · connect (35.73236, -85.81741) d=INSIDE · connect (35.71988, -85.75137) d=INSIDE · connect (35.71998, -85.75094) d=INSIDE · connect (35.73355, -85.82825) d=0 m
- collins-river: connect (35.69661, -85.72172) d=INSIDE · connect (35.80107, -85.62027) d=111 m · connect (35.67943, -85.72482) d=INSIDE · connect (35.69403, -85.72700) d=INSIDE · connect (35.71887, -85.74124) d=INSIDE · connect (35.71921, -85.74112) d=INSIDE · connect (35.67434, -85.69287) d=INSIDE · connect (35.67464, -85.70552) d=INSIDE · near-miss (35.52525, -85.67979) d=408 m · near-miss (35.52374, -85.67778) d=652 m · near-miss (35.52375, -85.67799) d=637 m · near-miss (35.52575, -85.68045) d=327 m · near-miss (35.52581, -85.68072) d=303 m
- upper-hills-creek: connect (35.56950, -85.66981) d=INSIDE · connect (35.57061, -85.70031) d=INSIDE · connect (35.56834, -85.66309) d=INSIDE · connect (35.56834, -85.66309) d=INSIDE · connect (35.56315, -85.65589) d=INSIDE · connect (35.56703, -85.66123) d=0 m · connect (35.56247, -85.65592) d=36 m · connect (35.56423, -85.65655) d=INSIDE
- calfkiller-river: connect (35.96438, -85.41271) d=10 m · near-miss (35.95807, -85.41679) d=701 m
- caney-fork-upper: connect (35.82921, -85.30720) d=20 m · connect (35.82932, -85.30723) d=31 m
- north-prong-barren-fork: connect (35.68068, -85.94259) d=24 m

### norris-lake — Norris Lake (44 rings)

| line feature | d(minEnd) | at | connect ends ≤250m | near-miss ends 250m–1km |
|---|---|---|---|---|
| powell-river | 0 (INSIDE) | (36.29603, -84.02491) | 1 | 0 |
| puncheon-camp-creek | 0 (INSIDE) | (36.35047, -83.52028) | 1 | 0 |
| indian-creek-claiborne | 16 m | (36.38269, -83.42906) | 1 | 0 |
| clinch-river | 41 m | (36.22386, -84.09247) | 1 | 0 |

- powell-river: connect (36.29603, -84.02491) d=INSIDE
- puncheon-camp-creek: connect (36.35047, -83.52028) d=INSIDE
- indian-creek-claiborne: connect (36.38269, -83.42906) d=16 m
- clinch-river: connect (36.22386, -84.09247) d=41 m

### center-hill-lake — Center Hill Lake (3 rings)

| line feature | d(minEnd) | at | connect ends ≤250m | near-miss ends 250m–1km |
|---|---|---|---|---|
| caney-fork-upper | 0 (INSIDE) | (36.04325, -85.78696) | 3 | 0 |
| pine-creek-dekalb | 0 (INSIDE) | (35.91041, -85.72108) | 3 | 6 |
| caney-fork-river | 66 m | (36.09794, -85.82628) | 1 | 0 |
| collins-river | 998 m | (35.80107, -85.62027) | 0 | 1 |

- caney-fork-upper: connect (36.04325, -85.78696) d=INSIDE · connect (36.09794, -85.82628) d=66 m · connect (36.04972, -85.77404) d=INSIDE
- pine-creek-dekalb: connect (35.91041, -85.72108) d=INSIDE · connect (35.90781, -85.71517) d=INSIDE · connect (35.91050, -85.71185) d=INSIDE · near-miss (35.90915, -85.73721) d=600 m · near-miss (35.91050, -85.73761) d=666 m · near-miss (35.91054, -85.73768) d=675 m · near-miss (35.91050, -85.73761) d=666 m · near-miss (35.91056, -85.73752) d=661 m · near-miss (35.91050, -85.73761) d=666 m
- caney-fork-river: connect (36.09794, -85.82628) d=66 m
- collins-river: near-miss (35.80107, -85.62027) d=998 m

---

## 4. Specific questions (closest approaches are true point-to-segment minima)

### (a) Does obey-river reach dale-hollow-lake?

- Closest approach: **936 m** — on obey-river (36.52246, -85.47230) ↔ on dale-hollow-lake (36.51973, -85.46240)

**No.** The closest approach is **936 m** — from a mid-segment vertex of the Obey tailwater at (36.52246, -85.47230) to
the lake polygon at (36.51973, -85.46240). The Obey’s own upstream-most endpoint (36.52614, -85.47944) is 1.68 km from
the lake boundary. Context: `obey-river` is catalogued as the *Dale Hollow tailwater*, i.e. the dam face sits between
the two geometries, but the tailwater polyline stops ~0.9–1.7 km short of the pool polygon. Downstream, the tailwater’s
end at (36.55528, -85.51250) lies exactly on the Cumberland River (0 m).

### (b) Does wolf-river-fentress reach dale-hollow-lake, south-fork-cumberland, or obey-river?

- wolf ↔ dale-hollow-lake: **40 m** — on wolf-river-fentress (36.62077, -85.18993) ↔ on dale-hollow-lake (36.62074, -85.18949)
- wolf ↔ south-fork-cumberland: **20.80 km** — on wolf-river-fentress (36.52619, -84.90099) ↔ on south-fork-cumberland (36.55672, -84.67146)
- wolf ↔ obey-river: **26.07 km** — on wolf-river-fentress (36.62077, -85.18993) ↔ on obey-river (36.53936, -85.46382)

- **dale-hollow-lake: 40 m — falls short of touching, but inside the 250 m connect band.** The Wolf River’s western
  endpoint (36.62077, -85.18993) stops 40 m short of the lake’s Wolf River arm polygon edge (foot 36.62074, -85.18949).
  Two more Wolf endpoints are 68 m (36.62793, -85.18545) and 85 m (36.62325, -85.19012) away. So under the ≤250 m
  lake-proximity rule Wolf "connects", but the geometries do not share a point — a 40 m sliver on the map.
- **south-fork-cumberland: no — 20.80 km** (nearest approaches (36.52619, -84.90099) ↔ (36.55672, -84.67146)).
- **obey-river: no — 26.07 km.**
- Wolf’s eastern headwater terminus (36.52619, -84.90099) has **no water of any kind within ~6 km**.

### (c) Do woods-reservoir, elk-river and tims-ford-lake touch?

- woods-reservoir ↔ elk-river: **20.29 km** — on woods-reservoir (35.29570, -86.09516) ↔ on elk-river (35.19301, -86.28034)
- elk-river ↔ tims-ford-lake: **453 m** — on elk-river (35.19301, -86.28034) ↔ on tims-ford-lake (35.19707, -86.27966)
- woods-reservoir ↔ tims-ford-lake: **2.55 km** — on woods-reservoir (35.29570, -86.09516) ↔ on tims-ford-lake (35.27566, -86.10904)

- **woods-reservoir ↔ elk-river: NO — 20.29 km apart.** The Elk River is absent from the corridor entirely: no feature
  upstream of the Tims Ford tailwater exists, and **nothing in the file touches Woods Reservoir at all** — its nearest
  line water is `boiling-fork-creek` at 10.72 km (on Woods Reservoir: (35.29330, -86.08900); on Boiling Fork:
  (35.19964, -86.11713)). Woods Reservoir is an isolated island in the network.
- **elk-river ↔ tims-ford-lake: near-miss — 453 m.** The tailwater’s upstream vertex (35.19301, -86.28034) vs lake
  boundary (35.19707, -86.27966); the tailwater’s first endpoint (35.19238, -86.28066) is 526 m from the boundary.
  This is the Tims Ford dam face gap.
- **woods-reservoir ↔ tims-ford-lake: NO — 2.55 km** ((35.29570, -86.09516) ↔ (35.27566, -86.10904)).

### (d) Does little-sequatchie-river reach sequatchie-river?

- Closest approach: **0 m** — on little-sequatchie-river (35.08891, -85.57764) ↔ on sequatchie-river (35.08891, -85.57764)

**Yes — exact shared vertex, 0 m** at **(35.08891, -85.57764)**: the Little Sequatchie’s downstream endpoint coincides
coordinate-for-coordinate with a Sequatchie River vertex. The Little Sequatchie’s upstream end (35.30214, -85.64447) is
a bare headwater terminus (nearest other water ~28 km). The Sequatchie’s own mouth ends exactly on the Tennessee
River at (35.02551, -85.63734).

### (e) Does tellico-river reach tellico-lake? What else is in the tellico area?

- tellico-river ↔ tellico-lake: **1.46 km** — on tellico-river (35.35784, -84.27526) ↔ on tellico-lake (35.34692, -84.28427)

**No — 1.46 km gap.** Closest approach: on the river (35.35784, -84.27526) ↔ on the lake (35.34692, -84.28427). The
river’s downstream endpoint (35.43414, -84.26190) is 2.68 km from the lake. (Vertex-to-vertex min is 1463 m — the
closest approach is endpoint-to-edge, 1461 m; both round to 1.46 km.)

Line features with any vertex inside bbox(tellico-lake) expanded by 0.2° (bbox lon [-84.4913, -83.8497], lat [35.1454, 35.9814]):

| feature | to tellico-lake | at (on feature) | to tellico-river | chunks@250m | verdict |
|---|---|---|---|---|---|
| citico-creek | 699 m | (35.53341, -84.10379) | 9.51 km | 12 | near-miss 699 m — does NOT connect; itself 12 fragments at 250 m |
| clinch-river | 10.77 km | (35.87541, -84.28338) | 48.82 km | 1 | no (10.77 km, different drainage) |
| emory-river | 23.89 km | (35.88926, -84.48881) | 54.29 km | 1 | no (23.89 km) |
| hiwassee-river | 17.71 km | (35.18548, -84.29960) | 17.85 km | 2 | no (17.71 km) |
| holston-river | 40.74 km | (35.96135, -83.85026) | n/a | 2 | no (40.74 km) |
| little-river | 25.57 km | (35.87711, -83.98644) | 49.87 km | 4 | no (25.57 km) |
| little-tennessee-river | 1 m | (35.54589, -84.04992) | 16.23 km | 1 | CONNECTED (1 m) |
| spring-creek-polk | 11.57 km | (35.26882, -84.37741) | 13.33 km | 1 | no (11.57 km) |
| tellico-river | 1.46 km | (35.35784, -84.27526) | 0 m | 3 | near-miss 1.46 km — does NOT connect |
| tennessee-river | 529 m | (35.75904, -84.27487) | 33.05 km | 6 | near-miss 529 m (main stem past the lake mouth) |

Only `little-tennessee-river` actually joins the lake (1 m at (35.54589, -84.04992); its other end continues to the
FoPH tailwater at (35.77790, -84.25977), 4 m off the lake — the Little Tennessee IS the lake’s main arm).
`citico-creek` is the notable near-miss: its mouth endpoint (35.53386, -84.10465) hangs 699 m off the lake and the
creek itself is in 12 pieces at 250 m (largest internal gap 5.52 km, (35.45115, -84.11929) → (35.40944, -84.08582)).
`tellico-river` is internally continuous at 250 m (parts sit 19–57 m apart) but dies 1.46 km short of the lake.

### (f) Where does mill-creek-overton end relative to cumberland-river and obey-river?

- mill ↔ cumberland-river: **0 m** — on mill-creek-overton (36.48964, -85.56517) ↔ on cumberland-river (36.48964, -85.56517)
- mill ↔ obey-river: **3.68 km** — on mill-creek-overton (36.48960, -85.46552) ↔ on obey-river (36.52246, -85.47230)
- obey ↔ cumberland-river: **0 m** — on obey-river (36.55519, -85.51216) ↔ on cumberland-river (36.55519, -85.51216)

- **To the Cumberland: 0 m — touching.** Mill Creek’s lower chunk ends exactly on the Cumberland at its endpoint
  (36.48909, -85.56630), and a second vertex (36.48964, -85.56517) is also coincident with the Cumberland line.
- **To the Obey: 3.68 km.** Mill Creek’s dangling end that faces the Obey valley, (36.48960, -85.46552), is 3.68 km
  from the Obey tailwater at (36.52246, -85.47230). The two do not meet.
- **Three-way confluence area:** the Obey mouth joins the Cumberland exactly at (36.55528, -85.51250) (0 m). Mill
  Creek’s Cumberland landing (36.48909, -85.56630) is 8.79 km of straight-line distance downstream (NW) of the Obey
  mouth — i.e. Mill Creek currently *bypasses* the Obey and lands directly in the Cumberland, while its second
  north-eastern fragment end (36.48998, -85.50219) floats 4.24 km from the Cumberland.
- **Internal state:** mill-creek-overton is **2 chunks even at 1 km** — the documented 18.69 km hole
  (36.44754, -85.36833) → (36.30261, -85.47573) (repo allowlist says 18.77 km with its endpoint-only method).
  Headwater termini at (36.24003, -85.47813) and (36.30261, -85.47573) have no neighbouring water.

### (g) caney-fork-river vs caney-fork-upper: connection through center-hill-lake?

`center-hill-lake` **exists** (Polygon, 3 rings, bbox lon [-85.8806, -85.5994], lat [35.8045, 36.0985]).

- caney-fork-upper ↔ center-hill-lake: **5 m** — on caney-fork-upper (35.81689, -85.64278) ↔ on center-hill-lake (35.81694, -85.64276)
- caney-fork-river ↔ center-hill-lake: **66 m** — on caney-fork-river (36.09794, -85.82628) ↔ on center-hill-lake (36.09756, -85.82572)
- caney-fork-upper ↔ caney-fork-river: **0 m** — on caney-fork-upper (36.09794, -85.82628) ↔ on caney-fork-river (36.09794, -85.82628)

- **caney-fork-upper reaches the lake: YES — it ends INSIDE the polygon.** Endpoint (36.04325, -85.78696) is inside
  the lake (3 endpoints inside/≤250 m: also (36.04972, -85.77404) INSIDE and (36.09794, -85.82628) 66 m). The closest
  boundary approach is 5 m at (35.81689, -85.64278) ↔ (35.81694, -85.64276).
- **caney-fork-river exits the lake: near-touch — 66 m.** The tailwater’s upstream end (36.09794, -85.82628) sits 66 m
  off the lake boundary (foot 36.09756, -85.82572).
- **The two Caney Forks also touch each other directly: 0 m, shared vertex (36.09794, -85.82628)** (that point is
  simultaneously the upper river’s vertex and the tailwater’s endpoint — the Center Hill dam face).
- So the chain **caney-fork-upper → (inside) center-hill-lake → (66 m) caney-fork-river → (0 m) cumberland-river at
  (36.23962, -85.94173)** is connected end-to-end; the only fix-worthy sliver is the 66 m dam-face gap and the
  caney-fork-upper internal un-noded break (2 chunks at exact touch, joined at 250 m).

---

## 5. Summary table

| water | internally continuous? | connects to network? | key gap(s) |
|---|---|---|---|
| obey-river | yes (1 chunk @touch) | partial | dale-hollow-lake **near-miss 936 m** (36.52246,-85.47230 ↔ 36.51973,-85.46240); lower end ON cumberland-river 0 m; upper end 1.68 km off the lake |
| dale-hollow-lake | n/a (polygon) | near-miss / one 250m-band connect | wolf-river-fentress endpoints **40–85 m** (inside the 250 m band, no actual touch); obey-river **936 m**–1.13 km; cumberland-river 4.81 km |
| wolf-river-fentress | 1 chunk @1km (2 @250m, 665 m gap) | near-miss | dale-hollow-lake **40 m** (36.62077,-85.18993); headwater end (36.52619,-84.90099) has no water within ~6 km |
| mill-creek-overton | **no — 2 chunks @1km**, 18.69 km hole | partial | mouth ON cumberland-river 0 m (36.48909,-85.56630); **obey-river 3.68 km away** (36.48960,-85.46552 ↔ 36.52246,-85.47230) |
| cumberland-river | 1 chunk @1km (298 m gap @250m at 36.58403,-85.50374 → 36.58594,-85.50139) | yes | 0 m joins: obey-river (36.55528,-85.51250), caney-fork-river (36.23962,-85.94173), mill-creek-overton (36.48909,-85.56630); many ends land INSIDE lake-barkley / old-hickory-lake |
| woods-reservoir | n/a (polygon) | **no — isolated** | nearest line water = boiling-fork-creek **10.72 km**; elk-river 20.29 km; tims-ford-lake 2.56 km |
| elk-river | 1 chunk @250m (3 @touch) | near-miss | tims-ford-lake **453 m** (35.19301,-86.28034 ↔ 35.19707,-86.27966); lower end ON elk-river-lower 0 m (35.01595,-86.90830) |
| elk-river-lower | **no — 3 chunks @1km** | yes (at both ends) | own-chain break 1.24 km (34.91756,-87.06027 → 34.90637,-87.05914); 2 orphan parts at the north end touch elk-river 0 m (35.01595,-86.90830 / 35.03003,-86.90045 / 35.03907,-86.90144) but not their own feature |
| tims-ford-lake | n/a (polygon) | yes | boiling-fork-creek connect 12 m (35.19964,-86.11713); elk-river **near-miss 453 m** |
| tellico-river | yes @250m (3 @touch, parts 19–57 m apart) | no | **tellico-lake 1.46 km** (35.35784,-84.27526 ↔ 35.34692,-84.28427); headwater end (35.30265,-84.11822) no water within ~6 km |
| tellico-lake | n/a (polygon) | yes (one arm) | little-tennessee-river connect 1 m; **citico-creek near-miss 699 m**; **tellico-river near-miss 1.46 km** |
| little-sequatchie-river | yes @250m (2 @touch) | yes | sequatchie-river **0 m** exact shared vertex (35.08891,-85.57764) |
| sequatchie-river | yes (1 chunk @touch) | yes | mouth ON tennessee-river 0 m (35.02551,-85.63734); headwater end 2.23 km from daddys-creek |
| collins-river | yes @250m (2 @touch) | yes | INSIDE great-falls-lake (40 endpoints); touches caney-fork-upper 0 m (35.80107,-85.62027); 998 m near-miss to center-hill-lake |
| duck-river-lower | yes @250m (2 @touch) | yes | duck-river-tailwater **0 m** at 3 shared vertices (35.46565,-86.48464 / 35.46806,-86.49939 / 35.46915,-86.43046) |
| duck-river-tailwater | yes (1 chunk @touch) | yes | normandy-lake connect **28 m** (35.46514,-86.24670); duck-river-lower 0 m |
| great-falls-lake | n/a (polygon) | yes | barren-fork-river, charles-creek, collins-river, upper-hills-creek all INSIDE; caney-fork-upper 20 m; calfkiller-river 10 m |
| caney-fork-river | yes (1 chunk @touch) | yes | cumberland-river **0 m** (36.23962,-85.94173); caney-fork-upper **0 m** (36.09794,-85.82628); center-hill-lake **66 m near-miss** (dam face) |
| caney-fork-upper | yes @250m (2 @touch) | yes | ends INSIDE center-hill-lake (36.04325,-85.78696); collins-river 0 m; caney-fork-river 0 m |
| norris-lake | n/a (polygon) | yes | clinched at 41 m (clinch-river 36.22386,-84.09247), indian-creek-claiborne 16 m, powell-river + puncheon-camp-creek INSIDE |
| horse-creek-greene | **no — 2 chunks @1km**, 28.83 km hole | partial | nolichucky-river 0 m (36.16436,-82.71084); ft-patrick-henry-tailwater 12 m; ends at (36.42401,-82.65708) and (36.06826,-82.63314) float 8–10 km from anything |
| brush-creek-cocke | 1 chunk @1km (2 @250m, 252 m gap) | near-miss | french-broad-river **41 m** (35.94063,-82.92924) — near-miss, does not touch |
| south-fork-cumberland | yes @250m (2 @touch) | partial | new-river **0 m** (36.42430,-84.62359); upstream end (36.59846,-84.60536) no water within ~6 km; wolf-river-fentress is 20.80 km away |

---

## 6. Existing auditor (`scripts/audit-river-continuity.mjs`) — captured output

CLI: no args = CI check (exit non-zero on unexpected multi-chunk); `--write` regenerates `docs/CONTINUITY-AUDIT.md`.
Run in this working tree (2026-09-08):

```
line rivers: 104 (skipped non-line features: 43)
multi-chunk: 57  unexpected: 44  allowlisted: 13
  FAIL cumberland-river: 42 chunks / 161 parts  gaps<=233km
  FAIL duck-river-lower: 20 chunks / 99 parts  gaps<=56.55km
  ALLOW buffalo-river: 16 chunks / 103 parts  gaps<=75.97km
  FAIL nolichucky-river: 14 chunks / 14 parts  gaps<=68.02km
  FAIL harpeth-river: 13 chunks / 69 parts  gaps<=57.2km
  FAIL hatchie-river: 12 chunks / 57 parts  gaps<=103.67km
  FAIL wolf-river-west-tennessee: 12 chunks / 60 parts  gaps<=98.89km
  FAIL east-fork-stones-river: 11 chunks / 29 parts  gaps<=28.62km
  FAIL new-river: 10 chunks / 10 parts  gaps<=31.29km
  FAIL caney-fork-upper: 9 chunks / 29 parts  gaps<=54.96km
  FAIL collins-river: 9 chunks / 28 parts  gaps<=32.8km
  FAIL obion-river: 9 chunks / 34 parts  gaps<=67.69km
  ALLOW tennessee-river: 9 chunks / 10 parts  gaps<=282.56km
  FAIL red-river-clarksville: 8 chunks / 20 parts  gaps<=38.28km
  FAIL west-fork-stones-river: 8 chunks / 14 parts  gaps<=26.92km
  FAIL french-broad-river: 7 chunks / 8 parts  gaps<=84.32km
  ALLOW hurricane-creek: 7 chunks / 38 parts  gaps<=41.53km
  FAIL big-rock-creek: 6 chunks / 17 parts  gaps<=14.37km
  FAIL little-river: 6 chunks / 28 parts  gaps<=34.69km
  FAIL daddys-creek: 5 chunks / 7 parts  gaps<=23.5km
  FAIL elk-river: 5 chunks / 64 parts  gaps<=39.6km
  FAIL elk-river-lower: 5 chunks / 36 parts  gaps<=19.38km
  FAIL hiwassee-river: 5 chunks / 5 parts  gaps<=42.21km
  ALLOW horse-creek-greene: 5 chunks / 5 parts  gaps<=37.51km
  FAIL sequatchie-river: 5 chunks / 7 parts  gaps<=28.14km
  FAIL shoal-creek: 5 chunks / 51 parts  gaps<=30.54km
  ALLOW sulfur-fork-creek: 5 chunks / 30 parts  gaps<=42.32km
  FAIL calfkiller-river: 4 chunks / 14 parts  gaps<=11.07km
  FAIL duck-river-tailwater: 4 chunks / 27 parts  gaps<=12.67km
  ALLOW east-fork-shoal-creek: 4 chunks / 6 parts  gaps<=7.4km
  FAIL emory-river: 4 chunks / 4 parts  gaps<=20.33km
  FAIL holston-river: 4 chunks / 7 parts  gaps<=37.23km
  ALLOW mill-creek-overton: 4 chunks / 30 parts  gaps<=20.81km
  ALLOW mississippi-river: 4 chunks / 5 parts  gaps<=123.8km
  FAIL obed-river: 4 chunks / 5 parts  gaps<=23.83km
  FAIL pigeon-river: 4 chunks / 6 parts  gaps<=15.44km
  FAIL powell-river: 4 chunks / 4 parts  gaps<=22.96km
  ALLOW richardson-byrd-creek: 4 chunks / 7 parts  gaps<=5.86km
  FAIL rocky-river: 4 chunks / 10 parts  gaps<=11.79km
  ALLOW sinking-creek-wilson: 4 chunks / 6 parts  gaps<=27.3km
  FAIL south-fork-cumberland: 4 chunks / 5 parts  gaps<=6.7km
  FAIL upper-roan-creek: 4 chunks / 4 parts  gaps<=12.2km
  FAIL white-oak-creek: 4 chunks / 34 parts  gaps<=5.93km
  ALLOW cane-creek: 3 chunks / 60 parts  gaps<=201.26km
  FAIL little-west-fork-creek: 3 chunks / 23 parts  gaps<=2.66km
  FAIL barren-fork-river: 2 chunks / 14 parts  gaps<=2.26km
  FAIL boiling-fork-creek: 2 chunks / 6 parts  gaps<=1.53km
  FAIL caney-fork-river: 2 chunks / 2 parts  gaps<=2.69km
  FAIL charles-creek: 2 chunks / 14 parts  gaps<=1.31km
  ALLOW clear-fork: 2 chunks / 2 parts  gaps<=5.34km
  FAIL fletchers-fork: 2 chunks / 10 parts  gaps<=1.06km
  ALLOW indian-creek-claiborne: 2 chunks / 6 parts  gaps<=25.04km
  FAIL mccutcheon-creek: 2 chunks / 7 parts  gaps<=1.2km
  FAIL north-fork-holston-river: 2 chunks / 2 parts  gaps<=1.09km
  FAIL salt-lick-creek: 2 chunks / 51 parts  gaps<=9.21km
  FAIL south-holston-river: 2 chunks / 2 parts  gaps<=7.59km
  FAIL watauga-river: 2 chunks / 2 parts  gaps<=1.36km
FAIL: 44 unexpected multi-chunk stream(s)
```

**Interpretation.** The repo auditor stitches parts *endpoint-to-endpoint only* (haversine ≤1 km between first/last
coordinates). It therefore (1) misses every T-junction / shared-vertex join — a tributary part whose end lands on the
middle of another part reads as disconnected to it — and (2) currently exits 1 with 44 "unexpected" failures on this
tree, i.e. its expectation of a clean baseline does not match the committed geometry (its own allowlist covers only 13
of the 57 multi-chunk features it counts). This audit’s vertex-aware graph reduces the same file to 32 features with
true 250 m+ fragmentation (18 at 1 km) — the difference is precisely the endpoint-onto-segment joins the existing
script cannot see. Both agree on the big left-open holes (mill-creek-overton ~18.7 km, horse-creek-greene ~28.8 km,
sinking-creek-wilson, sulfur-fork-creek, cane-creek deliberate split, etc.).

## 7. Caveats

- "Connected" here = geometric proximity/overlap of committed geometry, not hydraulic correctness.
- Vertex-junction stitching at the 250 m / 1 km tolerances can merge parts that merely run parallel within tolerance;
  the `touch` (5 m) column is the conservative view and the per-pair numbers in sections 2–4 are the ground truth to
  fix against.
- Lake proximity is computed on part ENDPOINTS per the task; mid-line passes are captured in the pair measurements
  (e.g. elk-river passes 453 m from tims-ford-lake mid-line while its endpoint is 526 m away).
- Coordinates are printed as `(lat, lon)` throughout, matching the task convention; the geojson stores `[lon, lat]`.
