# Waterbody implementation checklist

Current integration checkpoint for every row in `waterbody-inventory.json`. `PASS` is intentionally withheld until catalog, canonical interactive geometry, labels, pointer/touch interaction, zooms, and both themes have been verified together in the merged build.

| Inventory waterbody                   | Feature ID                  | Geometry source now                | Verification state | Remaining gate                                                |
| ------------------------------------- | --------------------------- | ---------------------------------- | ------------------ | ------------------------------------------------------------- |
| Mississippi River                     | `mississippi-river`         | not supplied                       | PENDING_GEOMETRY   | catalog + line + full UI QA                                   |
| Obion River                           | `obion-river`               | not supplied                       | PENDING_GEOMETRY   | catalog + line + full UI QA                                   |
| Hatchie River                         | `hatchie-river`             | not supplied                       | PENDING_GEOMETRY   | catalog + line + full UI QA                                   |
| Wolf River                            | `wolf-river-west-tennessee` | not supplied                       | PENDING_GEOMETRY   | catalog + West Tennessee line + full UI QA                    |
| Tennessee River                       | `tennessee-river`           | not supplied                       | PENDING_GEOMETRY   | one canonical main-stem feature + full UI QA                  |
| Cumberland River                      | `cumberland-river`          | not supplied                       | PENDING_GEOMETRY   | catalog + main-stem line + full UI QA                         |
| Duck River                            | `duck-river-lower`          | TIGER Linear + NHD HR, reach-gated | PENDING_GEOMETRY   | extend/verify to the reference corridor, then full UI QA; gate-overlap dedupe applied 2026-09-04 (see GEO-CONTINUITY-AUDIT.md) |
| Buffalo River                         | `buffalo-river`             | not supplied                       | PENDING_GEOMETRY   | catalog + main-river line + full UI QA                        |
| Caney Fork River                      | `caney-fork-river`          | NHD HR + curated corridor fix      | PENDING_GEOMETRY   | verify full reference extent, then full UI QA                 |
| Elk River                             | `elk-river`                 | TIGER Linear + NHD HR, reach-gated | PENDING_GEOMETRY   | reconcile continuous reference corridor, then full UI QA      |
| Sequatchie River                      | `sequatchie-river`          | TIGER Linear headwaters            | PENDING_GEOMETRY   | extend/verify valley extent, then full UI QA                  |
| Hiwassee River                        | `hiwassee-river`            | NHD HR                             | PENDING_GEOMETRY   | verify full reference extent, then full UI QA                 |
| Clinch River                          | `clinch-river`              | NHD HR, reach-gated                | PENDING_GEOMETRY   | verify full reference extent, then full UI QA                 |
| Holston River                         | `holston-river`             | not supplied                       | PENDING_GEOMETRY   | catalog + main-stem line + full UI QA                         |
| Lake Barkley                          | `lake-barkley`              | Census AREAWATER MultiPolygon      | PENDING_CATALOG    | provenance confirmation + catalog promotion + full UI QA      |
| Kentucky Lake                         | `kentucky-lake`             | Census AREAWATER MultiPolygon      | PENDING_CATALOG    | provenance confirmation + catalog promotion + full UI QA      |
| Old Hickory Lake                      | `old-hickory-lake`          | Census AREAWATER MultiPolygon      | PENDING_CATALOG    | provenance confirmation + catalog promotion + full UI QA      |
| J. Percy Priest Lake                  | `j-percy-priest-lake`       | Census AREAWATER MultiPolygon      | PENDING_CATALOG    | provenance confirmation + catalog promotion + full UI QA      |
| Tims Ford Lake                        | `tims-ford-lake`            | Census AREAWATER MultiPolygon      | PENDING_CATALOG    | provenance confirmation + catalog promotion + full UI QA      |
| Pickwick Lake                         | `pickwick-lake`             | not supplied                       | PENDING_GEOMETRY   | authoritative polygon + catalog + full UI QA                  |
| Center Hill Lake                      | `center-hill-lake`          | Census AREAWATER MultiPolygon      | PENDING_CATALOG    | authoritative/NHD provenance + catalog promotion + full UI QA |
| Dale Hollow Lake                      | `dale-hollow-lake`          | Census AREAWATER MultiPolygon      | PENDING_CATALOG    | provenance confirmation + catalog promotion + full UI QA      |
| Watts Bar Lake                        | `watts-bar-lake`            | Census AREAWATER MultiPolygon      | PENDING_CATALOG    | provenance confirmation + catalog promotion + full UI QA      |
| Chickamauga Lake                      | `chickamauga-lake`          | Census AREAWATER MultiPolygon      | PENDING_CATALOG    | provenance confirmation + catalog promotion + full UI QA      |
| Norris Lake                           | `norris-lake`               | Census AREAWATER MultiPolygon      | PENDING_CATALOG    | provenance confirmation + catalog promotion + full UI QA      |
| Fort Loudoun Lake                     | `fort-loudoun-lake`         | Census AREAWATER MultiPolygon      | PENDING_CATALOG    | provenance confirmation + catalog promotion + full UI QA      |
| Cherokee Lake                         | `cherokee-lake`             | Census AREAWATER MultiPolygon      | PENDING_CATALOG    | provenance confirmation + catalog promotion + full UI QA      |
| Douglas Lake                          | `douglas-lake`              | Census AREAWATER MultiPolygon      | PENDING_CATALOG    | provenance confirmation + catalog promotion + full UI QA      |
| South Holston Lake                    | `south-holston-lake`        | Census AREAWATER MultiPolygon      | PENDING_CATALOG    | provenance confirmation + catalog promotion + full UI QA      |
| Shelby Farms Lake                     | `shelby-farms-lake`         | aerial-trace polygon (approximate) | PENDING_GEOMETRY   | full UI QA (point→polygon replacement landed; MultiPolygon nesting fixed 2026-09-04) |
| Cameron Brown Lake                    | `cameron-brown-lake`        | aerial-trace polygon (approximate) | PENDING_GEOMETRY   | full UI QA (point→polygon replacement landed; nesting fixed 2026-09-04) |
| Edmund-Orgill Park Lake               | `edmund-orgill-lake`        | NHD HR polygon                     | PENDING_GEOMETRY   | full UI QA (point→polygon replacement landed)                 |
| Yale Road Park Lake                   | `yale-road-park-lake`       | aerial-trace polygon (approximate) | PENDING_GEOMETRY   | full UI QA (point→polygon replacement landed; nesting fixed 2026-09-04) |
| Johnson Park Lake                     | `johnson-park-lake`         | aerial-trace polygon (approximate) | PENDING_GEOMETRY   | full UI QA (point→polygon replacement landed; nesting fixed 2026-09-04) |
| Valentine Park Pond                   | `valentine-park-pond`       | aerial-trace polygon (approximate) | PENDING_GEOMETRY   | full UI QA (point→polygon replacement landed; nesting fixed 2026-09-04) |
| Covington First Baptist Church Pond   | `covington-fbc-pond`        | aerial-trace polygon (approximate) | PENDING_GEOMETRY   | full UI QA (point→polygon replacement landed; nesting fixed 2026-09-04) |
| Martin City Pond                      | `martin-city-pond`          | NHD HR polygon                     | PENDING_GEOMETRY   | full UI QA (point→polygon replacement landed)                 |
| Milan City Pond                       | `milan-city-pond`           | aerial-trace polygon (approximate) | PENDING_GEOMETRY   | full UI QA (point→polygon replacement landed; nesting fixed 2026-09-04) |
| Paris City Park Lake                  | `paris-city-park-lake`      | NHD HR polygon                     | PENDING_GEOMETRY   | full UI QA (point→polygon replacement landed)                 |
| Beech Lake                            | `beech-lake`                | NHD HR polygon                     | PENDING_GEOMETRY   | full UI QA (point→polygon replacement landed)                 |
| Lake Graham                           | `lake-graham`               | NHD HR polygon                     | PENDING_GEOMETRY   | full UI QA (label anchor moved inside polygon 2026-09-04)     |
| Union City Reelfoot Packing Site Pond | `union-city-reelfoot-pond`  | aerial-trace polygon (approximate) | PENDING_GEOMETRY   | full UI QA (point→polygon replacement landed; nesting fixed 2026-09-04) |

## Current architecture verification

| Contract behavior                           | State            | Evidence                                                                            |
| ------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------- |
| Polygon base water below condition state    | PASS             | `rivers-water-base` precedes `rivers-water`                                         |
| Polygon hover/selected/dim/hidden treatment | PASS             | shared promoted-ID feature state and polygon shore/wash layers                      |
| Full-surface polygon pointer target         | PASS             | transparent `rivers-water-hit` fill                                                 |
| Forgiving narrow-water/touch edge           | PASS             | transparent 18 px polygon hit outline                                               |
| Existing water typography/collision         | PASS             | polygon catalog IDs use the same still-water label path as lakes/ponds              |
| Shared selection → fiche path               | PASS             | one ID callback for Point, line, Polygon, and MultiPolygon candidates               |
| Species/assessed filter exclusion           | PASS             | hidden IDs are removed before hit resolution                                        |
| Line crossing a lake remains selectable     | PASS             | nearest-hit priority favors a close centerline over polygon surface                 |
| Production NHD lake polygon end to end      | PENDING_CATALOG  | no NHD-attributed lake polygon with a matching catalog record is currently supplied |
| Production traced pond end to end           | PENDING_GEOMETRY | all 13 requested ponds/lakes remain Point placeholders                              |
| Existing creek line end to end              | PASS             | current catalog line architecture; `beaverdam-creek` is the contract example        |

There are no `UNRESOLVED` location judgments. There are also no false `PASS` claims: geometry and catalog production remain pending exactly where shown.

## Geometry lane update — 2026-09-04 (`trout-geometry`, base `5648ccc`)

Continuity and contract repairs documented in [`GEO-CONTINUITY-AUDIT.md`](./GEO-CONTINUITY-AUDIT.md);
no verification state was flipped to `PASS` (the full-UI-QA gate is unchanged).

- **Stones River / J. Percy Priest**: `stones-river` now carries a real NHDPlus
  HR centerline from the East/West Fork confluence (−86.4587, 35.9859)
  through the reservoir corridor to the dam; both forks verified to meet at
  the confluence. `riverIndex.json` regenerated.
- **Sinking Creek (Wilson)**: three fused waters separated — the Lebanon /
  Don Fox Park creek (NHD GNIS 01270380, TWRA stocking layer cross-checked)
  kept; the GNIS 01303641 creek and the Rutherford County fragment removed.
  1 component, 0 separation. Feature `waterbodyType` corrected to `creek`
  (catalog YAML still says `spring` — content-lane follow-up).
- **Duplicate segments removed**: duck tailwater/lower (14 shared parts),
  elk/elk-lower (2), boone/FPH tailwaters (3, assigned at Fort Patrick
  Henry Dam), clear-fork/clear-creek-obed (2, NHD GNIS 01305953 evidence),
  19 self-duplicate parts across 10 features.
- **Contract fixes**: 8 TWRA-pond MultiPolygon nestings repaired (depth 3 →
  4, no coordinate changes); 10 lake `labelAnchor`s moved inside their
  polygons (they were reference-image approximate locations);
  `j-percy-priest-lake` polygon verified as the reservoir corridor body.
- **New regression suite**: `apps/web/test/geometry-continuity.test.ts`
  (16 tests) enforces the contract checks, Stones-system connectivity, the
  Sinking Creek component/separation regression, and zero shared parts
  between reach-paired features.
- Row cells above updated where geometry reality had drifted (the 13 winter
  waters are polygons today, not Points — the point→polygon replacement
  landed with B15; the rows keep `PENDING_GEOMETRY` only for the full UI QA
  gate).
