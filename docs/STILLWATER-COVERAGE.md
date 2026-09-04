# STILLWATER coverage — West TN anchors + reference lakes

Geometry production record for the still-water (lake/pond/reservoir) rows of
`waterbody-inventory.json` (trout-fieldwork-20260904). Geometry lives in
`apps/web/public/atlas/rivers.geojson` per the contract; this document records
per-water source decisions, identity verification, and the checklist-format
rows for transplant into `WATERBODY-IMPLEMENTATION-CHECKLIST.md`.

Base: trout-stillwater@4e54c36. Sources, in contract priority order:
1. existing repo atlas data (`lakes.geojson` Census AREAWATER),
2. NHD waterbody polygons (USGS NHDPlus HR MapServer, layers 9 NHDWaterbody +
   8 NHDArea, public domain),
3. other license-compatible hydrography (none needed),
4. manual trace from Esri World Imagery (last resort, `approximate: true`).

Tooling (committed): `apps/web/scripts/fetch-stillwater-nhd.mjs` (scout /
extract, deterministic `pick` by nhdplusid, TN clip, contract shape),
`trace-stillwater.mjs` (imagery mosaic + graticule, vertex digitizing,
preview-verified overlay), `build-stillwater.mjs` (contract integration into
rivers.geojson + lake promotion). Intermediates in
`apps/web/.atlas-src/stillwater/` (scout cache, extract staging, trace
mosaics/vertices/previews — git-ignored; rivers.geojson is the deliverable).

## The 13 twra-winter-ponds anchors (Point → Polygon, same IDs)

| id | water (inventory name) | NHD polygon? | geometry source | approx | identity verification |
| --- | --- | --- | --- | --- | --- |
| `shelby-farms-lake` | Shelby Farms Lake | no (unnamed park ponds only) | aerial-trace (18 verts) | true | TWRA stocks Jones Pond ([shelbyfarmspark.org/fishing](https://www.shelbyfarmspark.org/fishing)); pond traced directly across from the Shelby Farms Visitor Center (Jones Pond Pavilion site), verified on 2x z18 imagery |
| `cameron-brown-lake` | Cameron Brown Lake | no usable (nearest 0.004 km² 636 m off) | aerial-trace (23 verts) | true | OSM lake center 220 m from anchor; traced at z18, preview-verified |
| `edmund-orgill-lake` | Edmund-Orgill Park Lake | yes — "Casper Lake" (0.264 km²) | nhd-hr (36 verts) | false | Casper Lake is the 67-acre centerpiece of Edmund Orgill Park (Fishbrain/Rural Heritage Trust); NHD polygon contains the OSM park-lake center |
| `yale-road-park-lake` | Yale Road Park Lake | no (nearest ≥ 798 m, degenerate) | aerial-trace (27 verts) | true | OSM water center 61 m from anchor; traced at z18, preview-verified |
| `johnson-park-lake` | Johnson Park Lake | no (two tiny unnamed ponds, main lake absent) | aerial-trace (27 verts) | true | TWRA site = W.C. Johnson Park, 419 Johnson Park Dr, Collierville (TWRA schedule / tripadvisor); repo anchor sat ~20 km off at downtown Memphis — corrected; traced the park reservoir lake by Byhalia Rd, preview-verified |
| `valentine-park-pond` | Valentine Park Pond | degenerate (0.0005 km² speck) | aerial-trace (25 verts) | true | OSM pond center 560 m W of anchor; traced at z18 span-3, preview-verified |
| `covington-fbc-pond` | Covington First Baptist Church Pond | no (absent from NHD and OSM) | aerial-trace (18 verts) | true | First Baptist Church, 2105 TN-59, Covington — church lake hosts Daddy Bill's Fishing Rodeo (TWRA-listed event; church Facebook); campus lake located on z17 imagery N of the church building, preview-verified |
| `martin-city-pond` | Martin City Pond | yes (unnamed, 0.0235 km²) | nhd-hr (11 verts) | false | NHD polygon bbox contains the OSM Martin City Park pond center (225 m from anchor) |
| `milan-city-pond` | Milan City Pond | no usable (degenerate specks ≥ 384 m off) | aerial-trace (23 verts) | true | OSM Milan City Park lake center; traced at z18, preview-verified |
| `paris-city-park-lake` | Paris City Park Lake | yes — NHD "Green Acres Lake" (0.009 km²) | nhd-hr (13 verts) | false | Fishbrain/Natural Atlas: Green Acres Lake (aka Williams Lake), 120 Greenacres Dr, Paris — city-run public fishing lake, hosts the World's Biggest Fish Fry Jr. Fishing Rodeo; 850 m from the historic anchor. IDENTITY FOLLOW-UP: TWRA's site name is "Paris City Park"; a second Paris pond exists at Eiffel Tower Park. Local press (parispi.net) treats Eiffel Tower Park as the secondary site, so Green Acres is the best match for the TWRA-listed primary — catalog lane should confirm the alias |
| `beech-lake` | Beech Lake | yes — "Beech Lake" (3.21 km²) | nhd-hr (174 verts) | false | NHD polygon contains the OSM-named center; GNIS-named |
| `lake-graham` | Lake Graham | yes (unnamed in NHD, 1.57 km²) | nhd-hr (174 verts) | false | NHD never names it; nhdplusid 20000700115945 contains the Wikipedia point 35.6325,-88.72139 (TWRA Lake Graham, 9 mi E of Jackson on Cotton Grove Rd) |
| `union-city-reelfoot-pond` | Union City Reelfoot Packing Site Pond | no (absent from NHD and OSM) | aerial-trace (24 verts) | true | TWRA "Union City Reelfoot Packing Site" = pond alongside W Reelfoot Ave at the former Reelfoot Packing Co. plant (nwtntoday.com 2007 stocking report; city-leased for public fishing); pond identified on z17/z18 imagery beside the plant site, preview-verified |

Notes:

- The old `coordinateCertainty` flags (osm-nominatim / approx-town-anchor)
  described the Point anchors. Polygon `approximate` now describes geometry
  verifiability only; the legacy flags and fiche metadata (species,
  stockingProgram, notes, county, town) are retained on the features.
- NHDPlus HR waterbody FCodes used: 39000–39099 (lake/pond), 43600–43699
  (reservoir); swamp/marsh and stream/river area fcodes excluded.
- Service simplification caveat: `maxAllowableOffset` 0.0001° collapsed the
  Green Acres Lake polygon to a triangle — paris was re-fetched at mao=0
  (13 verts). Keep mao=0 for small waters on future runs.

## Pickwick Lake (inventory missing-polygon)

| id | geometry source | approx | verification |
| --- | --- | --- | --- |
| `pickwick-lake` | nhd-hr — named "Pickwick Lake" reservoir polygon (139.5 km², 300 verts after TN clip + decimation) | false | Single GNIS-named NHD waterbody; envelope covered the full reservoir (Wilson Dam AL → Pickwick Landing Dam TN); clipped to the Tennessee boundary ring (bounds −88.261,34.995…−88.165,35.090 — all in-state) |

## Reference lakes promoted (inventory exists-ok; coordinator B15)

Promoted from passive `lakes.geojson` (Census TIGER AREAWATER via
build-lakes.mjs) to contract-shaped interactive features and removed from the
passive file: lake-barkley (431 v), kentucky-lake (1728 v), old-hickory-lake
(205 v), j-percy-priest-lake (882 v), tims-ford-lake (907 v), center-hill-lake
(1472 v), dale-hollow-lake (966 v), watts-bar-lake (2169 v), chickamauga-lake
(1408 v), norris-lake (1370 v), fort-loudoun-lake (430 v), cherokee-lake
(2136 v), douglas-lake (1166 v), south-holston-lake (380 v) — all
`source: census-areawater`, `approximate: false`, inventory display names.
Non-reference lakes remain passive: boone-lake, great-falls-lake,
nickajack-lake, normandy-lake, parksville-lake, reelfoot-lake, tellico-lake,
watauga-lake, woods-reservoir.

## End state

- rivers.geojson: 120 features, 92 lines + 28 still-water polygons, **0 Point
  anchors remain**. validate-atlas: PASS. Web typecheck/tests (88)/build +
  size budget: green.
- Still-water features carry: id, name, waterbodyType, source (space-delimited,
  primary first), approximate (boolean), labelAnchor (visual centroid, inside
  polygon), bounds, partCount/vertexCount, crs/coordinateOrder; winter-pond
  features additionally retain regionId/gaugeIds/species/stockingProgram/
  notes/county/town/coordinateCertainty.

## Checklist rows (geometry production; transplant to WATERBODY-IMPLEMENTATION-CHECKLIST.md)

UI/label/pointer/touch/zoom/theme states are the CODEX lane's merged-build QA;
geometry-production rows below are complete.

```json
[
 {"featureId":"shelby-farms-lake","inventoryName":"Shelby Farms Lake","geometrySource":"aerial-trace","geometryState":"verified","verificationState":"PENDING_QA","notes":"Jones Pond trace, preview-verified; approximate=true"},
 {"featureId":"cameron-brown-lake","inventoryName":"Cameron Brown Lake","geometrySource":"aerial-trace","geometryState":"verified","verificationState":"PENDING_QA","notes":"contract reference-row traced pond; preview-verified"},
 {"featureId":"edmund-orgill-lake","inventoryName":"Edmund-Orgill Park Lake","geometrySource":"nhd-hr","geometryState":"verified","verificationState":"PENDING_QA","notes":"Casper Lake; identity confirmed"},
 {"featureId":"yale-road-park-lake","inventoryName":"Yale Road Park Lake","geometrySource":"aerial-trace","geometryState":"verified","verificationState":"PENDING_QA","notes":"preview-verified; approximate=true"},
 {"featureId":"johnson-park-lake","inventoryName":"Johnson Park Lake","geometrySource":"aerial-trace","geometryState":"verified","verificationState":"PENDING_QA","notes":"W.C. Johnson Park, Collierville; legacy anchor ~20 km off at downtown Memphis — labelAnchor now from polygon"},
 {"featureId":"valentine-park-pond","inventoryName":"Valentine Park Pond","geometrySource":"aerial-trace","geometryState":"verified","verificationState":"PENDING_QA","notes":"preview-verified; approximate=true"},
 {"featureId":"covington-fbc-pond","inventoryName":"Covington First Baptist Church Pond","geometrySource":"aerial-trace","geometryState":"verified","verificationState":"PENDING_QA","notes":"FBC campus lake at 2105 TN-59; approximate=true"},
 {"featureId":"martin-city-pond","inventoryName":"Martin City Pond","geometrySource":"nhd-hr","geometryState":"verified","verificationState":"PENDING_QA","notes":"unnamed NHD pond, bbox contains OSM center"},
 {"featureId":"milan-city-pond","inventoryName":"Milan City Pond","geometrySource":"aerial-trace","geometryState":"verified","verificationState":"PENDING_QA","notes":"preview-verified; approximate=true"},
 {"featureId":"paris-city-park-lake","inventoryName":"Paris City Park Lake","geometrySource":"nhd-hr","geometryState":"verified","verificationState":"PENDING_QA","notes":"Green Acres Lake (aka Williams Lake); confirm Paris City Park alias vs Eiffel Tower Park pond"},
 {"featureId":"beech-lake","inventoryName":"Beech Lake","geometrySource":"nhd-hr","geometryState":"verified","verificationState":"PENDING_QA","notes":"GNIS-named NHD waterbody"},
 {"featureId":"lake-graham","inventoryName":"Lake Graham","geometrySource":"nhd-hr","geometryState":"verified","verificationState":"PENDING_QA","notes":"unnamed NHD nhdplusid 20000700115945 verified via Wikipedia/TWRA location"},
 {"featureId":"union-city-reelfoot-pond","inventoryName":"Union City Reelfoot Packing Site Pond","geometrySource":"aerial-trace","geometryState":"verified","verificationState":"PENDING_QA","notes":"pond alongside W Reelfoot Ave at former plant; approximate=true"},
 {"featureId":"pickwick-lake","inventoryName":"Pickwick Lake","geometrySource":"nhd-hr","geometryState":"verified","verificationState":"PENDING_QA","notes":"GNIS-named reservoir, TN-clipped"},
 {"featureId":"lake-barkley","inventoryName":"Lake Barkley","geometrySource":"census-areawater","geometryState":"verified","verificationState":"PENDING_CATALOG","notes":"promoted from lakes.geojson"},
 {"featureId":"kentucky-lake","inventoryName":"Kentucky Lake","geometrySource":"census-areawater","geometryState":"verified","verificationState":"PENDING_CATALOG","notes":"promoted from lakes.geojson"},
 {"featureId":"old-hickory-lake","inventoryName":"Old Hickory Lake","geometrySource":"census-areawater","geometryState":"verified","verificationState":"PENDING_CATALOG","notes":"promoted from lakes.geojson"},
 {"featureId":"j-percy-priest-lake","inventoryName":"J. Percy Priest Lake","geometrySource":"census-areawater","geometryState":"verified","verificationState":"PENDING_CATALOG","notes":"promoted from lakes.geojson"},
 {"featureId":"tims-ford-lake","inventoryName":"Tims Ford Lake","geometrySource":"census-areawater","geometryState":"verified","verificationState":"PENDING_CATALOG","notes":"promoted from lakes.geojson"},
 {"featureId":"center-hill-lake","inventoryName":"Center Hill Lake","geometrySource":"census-areawater","geometryState":"verified","verificationState":"PENDING_CATALOG","notes":"contract acceptance example promoted"},
 {"featureId":"dale-hollow-lake","inventoryName":"Dale Hollow Lake","geometrySource":"census-areawater","geometryState":"verified","verificationState":"PENDING_CATALOG","notes":"promoted from lakes.geojson"},
 {"featureId":"watts-bar-lake","inventoryName":"Watts Bar Lake","geometrySource":"census-areawater","geometryState":"verified","verificationState":"PENDING_CATALOG","notes":"promoted from lakes.geojson"},
 {"featureId":"chickamauga-lake","inventoryName":"Chickamauga Lake","geometrySource":"census-areawater","geometryState":"verified","verificationState":"PENDING_CATALOG","notes":"promoted from lakes.geojson"},
 {"featureId":"norris-lake","inventoryName":"Norris Lake","geometrySource":"census-areawater","geometryState":"verified","verificationState":"PENDING_CATALOG","notes":"promoted from lakes.geojson"},
 {"featureId":"fort-loudoun-lake","inventoryName":"Fort Loudoun Lake","geometrySource":"census-areawater","geometryState":"verified","verificationState":"PENDING_CATALOG","notes":"promoted from lakes.geojson"},
 {"featureId":"cherokee-lake","inventoryName":"Cherokee Lake","geometrySource":"census-areawater","geometryState":"verified","verificationState":"PENDING_CATALOG","notes":"promoted from lakes.geojson"},
 {"featureId":"douglas-lake","inventoryName":"Douglas Lake","geometrySource":"census-areawater","geometryState":"verified","verificationState":"PENDING_CATALOG","notes":"promoted from lakes.geojson"},
 {"featureId":"south-holston-lake","inventoryName":"South Holston Lake","geometrySource":"census-areawater","geometryState":"verified","verificationState":"PENDING_CATALOG","notes":"promoted from lakes.geojson"}
]
```

## Remaining work / handoff

1. Catalog lane: YAML rows + streams.json + checklist transplant (rows above);
   confirm the `paris-city-park-lake` alias question (Paris City Park = Green
   Acres Lake vs Eiffel Tower Park pond).
2. Line lane: the 92 existing line features still lack the contract-required
   `waterbodyType` + `approximate` properties (out of this lane's scope —
   "do not edit existing line geometry").
3. Optional QA polish on traces (all preview-verified, approximate=true):
   johnson-park-lake includes the lakeside tree spit as water (sub-z13
   detail); cameron-brown-lake eastern flooded-timber edge simplified.
4. License note: traced geometry is first-party digitization over Esri World
   Imagery basemap tiles (attribution already shown in the app's basemap
   credits); NHD polygons are USGS public domain; Census AREAWATER is public
   domain. No OSM geometry was shipped (OSM used for identification only).
