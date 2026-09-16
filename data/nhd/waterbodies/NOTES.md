# NHD TN Waterbody Polygons — source, extract, match notes

Download date: 2026-09-16. Branch: `fix/atlas-geometry-regressions`.

## 1. Source chosen

USGS National Hydrography Dataset (NHD) **High Resolution** waterbody polygons served
from the official USGS National Map ArcGIS REST service — public domain ("Use
Constraints: None. All data are open and non-proprietary", per service metadata).

- Service/layer: `https://hydro.nationalmap.gov/arcgis/rest/services/nhd/MapServer/12`
  ("Waterbody - Large Scale" = high-resolution NHD `NHDWaterbody` polygon layer;
  fields PERMANENT_IDENTIFIER, GNIS_ID, GNIS_NAME, FTYPE, FCODE, AREASQKM, ...).
- Query used: `FTYPE IN (390,362) AND AREASQKM >= 0.05`, envelope
  `-90.31,34.98,-81.65,36.69` (TN + Kentucky Lake's KY extent), `f=geojson`,
  paged `resultOffset` with `orderByFields=OBJECTID` (required for paging) and
  `resultRecordCount=500` (>=1000 records/page returns HTTP 500 server-side).
- Downloaded by `node download-tn-waterbodies.mjs` (reproducible; raw pages in `raw/`).
- Result: `tn-waterbodies.geojson` — 1,205 features, 37.3 MB, EPSG:4326
  (longitude,latitude), coordinates rounded to 6 decimals (~0.1 m).

Bulk alternative (NOT used — 750 MB GeoPackage, needs GDAL/ogr to extract, no
GDAL/python on this machine):
`https://prd-tnm.s3.amazonaws.com/StagedProducts/Hydrography/NHD/State/GPKG/NHD_H_Tennessee_State_GPKG.zip`
(750,422,226 bytes; layer NHDWaterbody). Shapefile/FileGDB variants live under
`StagedProducts/Hydrography/NHD/State/{Shape,GDB}/`. TNM access API
(`tnmaccess.nationalmap.gov/api/v2/products`) returned HTTP 403 unauthenticated.

## 2. Property mapping (service field -> extract field)

| NHD service field       | tn-waterbodies.geojson |
|-------------------------|------------------------|
| PERMANENT_IDENTIFIER    | permanent_identifier   |
| GNIS_ID                 | gnis_id                |
| GNIS_NAME               | gnis_name              |
| FTYPE                   | ftype                  |
| FCODE                   | fcode                  |
| AREASQKM                | area_sqkm              |

## 3. Match table (extract-lake-polygons.mjs)

Method: gnis-key = catalog `gnisIds` or GNIS/PID parsed from rivers.geojson
`sourceIds` strings; multi-part lakes (Kentucky 3, Barkley 8, Reelfoot 3,
Chickamauga 2) mirror the parts the original catalog import had merged.

| catalogId            | NHD gnis_name                     | area_sqkm | vertices | parts | how       |
|----------------------|-----------------------------------|-----------|----------|-------|-----------|
| kentucky-lake        | Kentucky Lake                     | 478.21    | 62,320   | 3     | gnis-key  |
| lake-barkley         | Lake Barkley                      | 198.60    | 47,168   | 8     | gnis-key  |
| pickwick-lake        | Pickwick Lake                     | 139.49    | 23,603   | 1     | gnis-key  |
| dale-hollow-lake     | Dale Hollow Lake                  | 103.24    | 105,646  | 1     | gnis-key  |
| center-hill-lake     | Center Hill Lake                  | 69.88     | 40,858   | 1     | gnis-key  |
| reelfoot-lake        | Reading House Slough (Reelfoot waterbody, GNIS 01311842) | 44.29 | 13,011 | 3 | gnis-key |
| j-percy-priest-lake  | J Percy Priest Reservoir          | 56.80     | 11,803   | 1     | gnis-key  |
| chickamauga-lake     | Dallas Lake (Chickamauga impoundment, GNIS 01312639)     | 110.22 | 36,943 | 2 | gnis-key |
| watts-bar-lake       | Watts Bar Lake                    | 135.33    | 60,160   | 1     | pid/gnis-key |
| watts-bar-reservoir  | NO MATCH — slug does not exist; `watts-bar-lake` is the catalog id | — | — | — | — |
| great-falls-lake     | NO CONFIDENT MATCH — see below    | —         | —        | —     | —         |

Name quirks (all resolved by GNIS keys, aliases in script as fallback):
- Reelfoot Lake's main waterbody is named "Reading House Slough" in NHD (GNIS 01311842, one of the catalog's gnisIds).
- Chickamauga Lake is named "Dallas Lake" in NHD (GNIS 01312639; the catalog's own sourceIds already said so). Its 2nd part is Judd Slough, also present in catalog sourceIds.

### great-falls-lake — FAILED MATCH, details

Current NHD HR has **no polygon named Great Falls** anywhere in Tennessee
(verified against layer 12 Waterbody, layer 9 NHDArea: `GNIS_NAME LIKE '%Great
Falls%'` returns zero rows). Near the real lake (Rock Island / Caney Fork below
Center Hill Dam, ~-85.83, 35.97) NHD only has unnamed slivers (FCODE 39004,
area 0.0008–0.023 sqkm) plus the separate Center Hill Lake polygon. The
catalog's bounds (-85.94,35.53,-85.62,35.82, area 5.85) are poisoned by the
malformed 29x32 km polygon, so bbox containment cannot be used either. The
matcher therefore reports NO CONFIDENT MATCH rather than guessing. Options for
the main lane: leave great-falls-lake geometry flagged/broken, rebuild it from
the unnamed NHD slivers (poor), or use a non-NHD source for this one lake.

Sanity rule: any candidate whose bbox diagonal exceeds 4x the catalog bbox
diagonal is rejected (this is what kills the malformed-geometry class); for
great-falls-lake an override reference point (-85.83,35.97, 5 km radius,
area 0.05–6 sqkm) replaces the unusable catalog bounds.

## 4. matched-polygons.json spec

Array of entries; `role: primary | part` groups a lake's NHD polygons; one
NHD polygon per entry. `coordinates` is a FLAT array of rings
`[ [ [lon,lat], ... ], ... ]`, outer ring first within each polygon;
`polygonRingCounts[i]` = number of consecutive rings belonging to polygon i
(reconstruct MultiPolygon by chunking). Vertices are 6-decimal WGS84; only
non-finite vertices would ever be dropped (source had zero).

## 5. How the main lane should apply this (5 lines)

1. For each `matched-polygons.json` entry, find the rivers.geojson feature by
   `properties.id === entry.catalogId` and replace its `geometry.coordinates`
   with the entry's rings chunked by `polygonRingCounts` (outer ring first).
2. Set `properties.vertexCount` to the sum of ring lengths actually written and
   `properties.partCount` to `polygonRingCounts.length`; keep `crs` and
   `coordinateOrder` as EPSG:4326 / longitude,latitude.
3. Set `properties.areaSqKm` to the sum of entry `areaSqKm` for that catalogId
   and append entry `nhdPermanentIdentifier` values to `properties.sourceIds`;
   set `properties.gnisIds` from entry `gnisId` (strip nothing; keep as strings).
4. Sanitize by dropping ONLY non-finite coordinates — never drop finite
   vertices, do not simplify, smooth, or trim collinear points.
5. Do NOT touch unmatched features (great-falls-lake stays as-is this pass) and
   do not re-round or reorder coordinates.
