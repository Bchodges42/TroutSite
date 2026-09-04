# GEO-AUDIT — river geometry & reach-association audit (B13)

Lane: GEO · Repo: `trout-geo` · Base: `9182429` (trout-backend@9182429) · Date: 2026-09-04

## Scope and method

Audited **all 105 features** in `apps/web/public/atlas/rivers.geojson` (92 catalog streams
+ 13 `tn-west` point anchors) against:

- the frozen catalog (`apps/web/public/v1/streams.json`, 92 entries — **stale**, missing the
  13 tn-west waters added in da80558; the authoritative stream set is
  `packages/content/dist/pack/streams.json`, 105 entries), and
- the gauge-anchor file `apps/web/src/data/streams-geo.json` (legacy, 8 fixture-era entries), and
- authoritative geometry fetched fresh for this audit:
  **Census TIGER/Line 2024** LINEARWATER + AREAWATER, all 95 TN counties (public domain), and
  **USGS NHDPlus HR** named flowlines via `fetch-nhd-targets.mjs` (public domain), and
  **USGS monitoring-location coordinates** for all 51 catalog gauges, waterservices.usgs.gov
  site service, NAD83, retrieved 2026-09-04 (public domain).

Verdict classes: `ok` · `fragment` (real water, truncated/stub extent) · `duplicate`
(identical geometry reused across distinct ids) · `misjoined` (wrong or over-wide reach
joined to the id) · `missing` (no line geometry at all) · `point-anchor` (tn-west ponds,
POINT by design — coordinates audited for county plausibility only).

## Root cause

TIGER/Line names large rivers only sparsely. Statewide, TIGER 2024 LINEARWATER carries
exactly **one** named "Clinch Riv" segment (Hancock Co, *upstream* of Norris Lake), **one**
7-point "South Fork Holston Riv" segment (Sullivan Co), and "Watauga Riv" only as one
segment *inside Watauga Lake*. Name-matching alone therefore collapsed catalog tailwaters
onto stray fragments or duplicated one fragment across three ids, while the true reaches
have no TIGER name at all. Where the catalog denotes a managed reach (a named dam
downstream) or a gauge-bracketed reach, the pipeline now bounds the reach explicitly
(`apps/web/scripts/atlas-reach-gates.mjs`) and takes centerlines from NHDPlus HR, which
carries complete named flowlines. Gates use whole-part discipline (a part is kept only
entirely inside the window) — no interior coordinate is ever deleted, and nothing is
fabricated; every bound cites a USGS site or a Census reservoir footprint.

## Deliverable table

Bboxes are `[minLon minLat maxLon maxLat]` at 4dp; "baseline -> corrected" shows the change.


| id | verdict | evidence (bbox) | correction applied / reason |
|---|---|---|---|
| barren-fork-river | ok | -85.9916 35.64 -85.727 35.6992 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| beaverdam-creek | ok | -81.9443 36.5006 -81.8044 36.6137 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| big-rock-creek | ok | -86.8296 35.3773 -86.7535 35.5764 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| boiling-fork-creek | ok | -86.0878 35.1547 -85.9605 35.1817 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| boone-tailwater | duplicate | -81.999 36.594 -81.999 36.594 P1/V2 -> -82.5137 36.4406 -82.4378 36.5084 P22/V68 | Same shared fragment (PARENT-reuse match collapsed to one segment). Corrected: Boone Dam -> Fort Patrick Henry Lake (NHD, lon gate -82.515..-82.43). |
| brush-creek-cocke | ok | -82.9356 35.9406 -82.9292 35.9642 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| buffalo-creek-grainger | ok | -83.5989 36.1921 -83.5549 36.2287 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| calfkiller-river | ok | -85.4901 35.8201 -85.3082 36.1056 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| cane-creek | misjoined | -87.789 35.535 -85.304 35.788 P30/V653 -> -87.7888 35.5354 -85.3038 35.8149 P33/V733 | Four same-named Cane Creeks (Bledsoe/Van Buren/Hickman/Perry) in ONE feature, bbox gap 2.44 deg. CONFIRMED but deliberate: the catalog note states the entry intentionally covers both stocked Cane Creeks. Geometry re-verified per water (+NHD in the Hickman band); splitting requires a catalog change owned by the content lane, not a geometry fix. |
| caney-fork-river | ok | -85.952 35.791 -85.155 36.249 P238/V783 -> -85.9516 35.7914 -85.1548 36.2487 P238/V783 | Rebuilt by the existing fix-caney-fork.mjs step (undocumented in docs/atlas-sources.md; added there). Bounds unchanged vs baseline. |
| charles-creek | ok | -85.9563 35.7154 -85.7412 35.8012 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| citico-creek | ok | -84.1257 35.394 -84.0745 35.5339 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| clear-creek-obed | ok | -85.1687 36.0643 -84.6983 36.1706 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| clear-fork | ok | -84.9078 36.091 -84.5582 36.564 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| clinch-river | fragment | -83.349 36.447 -83.256 36.499 P1/V58 -> -84.5338 35.8632 -84.0701 36.2516 P186/V492 | Baseline = the single named TIGER "Clinch Riv" segment (Hancock Co, NE of Norris Lake); region window (lat >= 36.0) excluded the tailwater. Corrected: dam-gated NHD Norris tailwater (maxLon -84.06 = USGS 03533000 below-Norris-Dam lon -84.0821). |
| collins-river | ok | -85.7419 35.4541 -85.6235 35.758 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| cosby-creek | ok | -83.2497 35.7335 -83.1823 35.8831 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| daddys-creek | ok | -85.0991 35.7501 -84.7656 36.0796 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| doe-creek-johnson | ok | -81.969 36.3817 -81.8625 36.4608 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| doe-river | ok | -82.2135 36.1711 -82.0667 36.3567 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| duck-river-lower | misjoined | -87.282 35.443 -86.081 35.7 P49/V956 -> -87.0595 35.4547 -86.4303 35.6463 P135/V599 | Baseline duplicated the whole mapped Duck incl. the tailwater and headwaters. Corrected: catalog reach "Shelbyville to Columbia" (gate lon -87.06..-86.42; USGS 03597860/03598000 -> 03599500). |
| duck-river-tailwater | misjoined | -87.282 35.443 -86.081 35.7 P49/V956 -> -86.4994 35.4432 -86.2414 35.4835 P30/V323 | Baseline spanned the whole mapped Duck (headwaters -> Columbia), incl. water above Normandy Dam. Corrected: Normandy Dam (TIGER AREAWATER lake west edge -86.2482) -> Shelbyville gauges 03597860/03598000 (gate lon -86.50..-86.24). |
| east-fork-shoal-creek | ok | -87.1646 35.0046 -87.0659 35.0899 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| east-fork-stones-river | ok | -86.442 35.81 -85.949 35.987 P11/V547 -> -86.4587 35.8102 -85.9493 35.9889 P13/V560 | Minor NHD/TIGER refresh delta (0.017 deg). |
| elk-river-lower | duplicate | -87.006 35.004 -85.834 35.358 P109/V1537 -> -87.0156 34.9999 -86.9934 35.0142 P7/V14 | Baseline identical to elk-river (whole river). Corrected: catalog reach "Prospect to state line" (gate lon -87.02..-86.99); NHD-only geometry. |
| elk-river | misjoined | -87.006 35.004 -85.834 35.358 P109/V1537 -> -86.9977 35.0042 -86.2803 35.1972 P114/V1081 | Baseline spanned headwaters (Elk above Tims Ford Lake) -> state line. Corrected: below Tims Ford Dam (USGS 03580750 lon -86.2811; lake west edge -86.2865) -> Prospect (USGS 03584600 lon -86.9947). |
| emory-river | ok | -84.6624 35.9595 -84.4465 36.1778 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| fletchers-fork | ok | -87.5231 36.5573 -87.4245 36.5993 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| forge-creek-johnson | fragment | -81.771 36.442 -81.758 36.453 P1/V14 -> -81.7856 36.4331 -81.7023 36.5206 P23/V83 | Baseline = 14-vertex stub. Corrected: full creek near Mountain City (TIGER + NHD). |
| french-broad-river | missing | -83.85 35.907 -82.898 36.025 P11/V1005 -> -83.8507 35.9078 -82.8995 36.0884 P243/V600 | Baseline was AREAWATER polygons only; NHD take absent (fetch envelope also stopped short of the Knoxville confluence). Corrected: NHD French Broad River centerlines, Tennessee-clipped. |
| ft-patrick-henry-tailwater | duplicate | -81.999 36.594 -81.999 36.594 P1/V2 -> -82.6119 36.4979 -82.5005 36.5507 P18/V56 | Same shared fragment. Corrected: Fort Patrick Henry Dam -> Kingsport confluence (NHD, lon gate -82.62..-82.50). |
| gap-creek-claiborne | ok | -83.6932 36.5116 -83.6644 36.5979 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| goforth-creek | ok | -84.515 35.0838 -84.4861 35.1081 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| greasy-creek-polk | ok | -84.5734 35.1174 -84.4884 35.1465 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| gulf-fork-big-creek | ok | -83.1092 35.8082 -83.0225 35.8751 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| harpeth-river | ok | -87.1942 35.7909 -86.6613 36.2497 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| hiwassee-river | missing | -84.837 35.167 -84.295 35.339 P6/V1082 -> -85.0109 35.167 -84.296 35.4127 P175/V441 | Baseline was AREAWATER polygons only; NHD take absent. Corrected: NHD Hiwassee River centerlines, Tennessee-clipped (drops NC flowlines). |
| horse-creek-greene | ok | -82.79 36.068 -82.633 36.322 P4/V144 -> -82.7896 36.0683 -82.6331 36.417 P5/V154 | Unchanged code path; fresh TIGER pull adds the lower reach to the Nolichucky confluence (-82.65/36.41). |
| hurricane-creek | ok | -87.928 35.96 -87.5646 36.3682 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| indian-creek-claiborne | ok | -83.6093 36.3833 -83.4074 36.5978 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| laurel-creek-johnson | ok | -81.8081 36.5223 -81.7499 36.6058 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| laurel-fork-carter | ok | -82.1746 36.2672 -82.1248 36.2889 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| leconte-creek | fragment | -83.523 35.686 -83.5 35.71 P2/V31 -> -83.5227 35.6572 -83.4475 35.7096 P8/V48 | Baseline stopped mid-creek (GNIS spells it "Le Conte Creek"; take map now covers all spellings). Corrected: TIGER + NHD extent. |
| little-buffalo-river | ok | -87.5477 35.3052 -87.466 35.452 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| little-pigeon-river | ok | -83.5941 35.7134 -83.3826 35.9316 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| little-river | ok | -83.9496 35.5788 -83.4831 35.8435 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| little-sequatchie-river | ok | -85.6448 35.0889 -85.5731 35.3021 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| little-west-fork-creek | ok | -87.511 36.5819 -87.3639 36.6202 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| mccutcheon-creek | ok | -86.9251 35.714 -86.9182 35.7885 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| middle-prong-little-pigeon | ok | -83.3827 35.6957 -83.3239 35.7088 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| mill-creek-overton | ok | -85.503 36.24 -85.352 36.474 P19/V105 -> -85.5506 36.24 -85.3524 36.5005 P55/V220 | Minor NHD refresh delta (bounds +/-0.05 deg) from the 2026-09-04 NHD extract. |
| mossy-creek-jefferson | fragment | -83.513 36.121 -83.474 36.129 P2/V31 -> -83.5129 36.0944 -83.4738 36.1598 P9/V56 | Baseline = 2 parts/31 verts; missing the lower creek. Corrected: TIGER + NHD extent down to the Holston confluence side. |
| new-river | ok | -84.5439 36.1236 -84.3211 36.4068 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| nolichucky-river | ok | -83.2464 36.0508 -82.4168 36.211 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| north-chickamauga-creek | ok | -85.3634 35.1079 -85.2068 35.2673 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| north-prong-barren-fork | ok | -85.9633 35.6807 -85.9426 35.719 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| obed-river | ok | -85.1147 35.9162 -84.6494 36.0989 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| obey-river | missing | -85.512 36.436 -85.114 36.582 P4/V830 -> -85.5125 36.5203 -85.145 36.6124 P96/V262 | Baseline was AREAWATER polygons only (no TIGER lines; fetch envelope had admitted KY connectors). Corrected: NHD Obey River centerlines, gated below Dale Hollow Dam (USGS 03417000 lat 36.5373), Tennessee-clipped. |
| ocoee-river | fragment | -84.694 35.073 -84.491 35.148 P3/V47 -> -84.6172 34.9922 -84.3805 35.1097 P77/V209 | Baseline = 3 sparse TIGER parts missing the Copperhill end. Corrected: TIGER + NHD gated to the catalog "upper, Copperhill reach" upstream of Parksville Lake (gate lon -84.62..-84.30; lake edges from TIGER AREAWATER). |
| parksville-tailwater | fragment | -84.694 35.073 -84.491 35.148 P3/V47 -> -84.6936 35.1269 -84.67 35.1899 P14/V43 | Baseline duplicated ocoee-river bbox (3 sparse parts over lake + gorge). Corrected: below Parksville Dam toward the Hiwassee confluence (gate lon -84.78..-84.67). |
| pigeon-river | ok | -83.2017 35.7751 -83.0994 36.0002 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| pine-creek-dekalb | ok | -85.8558 35.9025 -85.7497 35.9236 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| piney-river-rhea | ok | -85.0505 35.607 -84.7232 35.9083 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| powell-river | ok | -83.6912 36.4879 -83.3056 36.598 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| puncheon-camp-creek | ok | -83.544 36.3037 -83.5014 36.3505 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| red-river-clarksville | ok | -87.2369 36.5411 -87.1298 36.5733 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| reedy-creek | ok | -82.5772 36.5387 -82.2928 36.5957 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| richardson-byrd-creek | ok | -83.1883 36.4549 -83.1193 36.5373 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| roaring-fork | ok | -83.4687 35.6641 -83.4437 35.6951 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| rocky-river | ok | -85.6152 35.5334 -85.4712 35.7649 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| salt-lick-creek | ok | -85.9187 36.4868 -85.8439 36.625 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| sequatchie-river | ok | -85.0297 35.7463 -84.9779 35.8308 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| shoal-creek | ok | -87.5791 35.0035 -87.3056 35.2449 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| sinking-creek-wilson | ok | -86.5413 36.0326 -86.286 36.2205 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| south-fork-cumberland | ok | -84.6718 36.5 -84.6052 36.5988 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| south-holston-river | duplicate | -81.999 36.594 -81.999 36.594 P1/V2 -> -82.32 36.4641 -82.0907 36.5272 P55/V145 | Baseline identical 2-vertex TIGER fragment shared with boone-tailwater and ft-patrick-henry-tailwater. Corrected: South Holston Dam -> Boone Lake head (NHD, lon gate -82.32..-82.09; dams per USGS 03476500 / 03486810). |
| spring-creek-polk | ok | -84.5165 35.22 -84.3771 35.2774 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| standing-rock-creek | ok | -87.9999 36.4098 -87.8628 36.4377 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| station-creek | fragment | -83.626 36.596 -83.625 36.598 P1/V3 -> -83.626 36.5855 -83.6049 36.5984 P5/V20 | Baseline = 3-vertex ~100 m stub. Corrected: full Claiborne Co creek (TIGER exact match + NHD; strict county gate). |
| stones-river | ok | -86.667 36.156 -86.618 36.192 P3/V53 -> -86.6672 36.156 -86.6185 36.1922 P3/V53 | Verified complete: the baseline 3-part reach IS the full Percy-Priest-dam tailwater (dam at lat 36.153 = the NHD connector-chain gap; tailwater gauge USGS 03430200 inside it). The new minLat 36.153 reach gate keeps Percy Priest Lake connector paths out; net geometry unchanged. |
| stoney-creek-carter | ok | -82.1458 36.3797 -82.1275 36.3891 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| sulfur-fork-creek | ok | -87.116 36.428 -86.365 36.651 P8/V546 -> -87.1413 36.4281 -86.3645 36.6509 P10/V606 | Unchanged code path; fresh TIGER/Line 2024 pull adds the reach to the Red River mouth (matches USGS 03436100 Red River at Port Royal, -87.14/36.55). |
| tellico-river | ok | -84.2917 35.3026 -84.1182 35.4341 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| trail-fork-big-creek | ok | -83.1185 35.9001 -83.1026 35.9019 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| tumbling-creek | ok | -84.4889 34.9882 -84.4613 35.0237 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| upper-hills-creek | ok | -85.7003 35.5503 -85.6337 35.572 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| upper-roan-creek | ok | -81.882 36.38 -81.786 36.434 P23/V71 -> -81.9722 36.3482 -81.7856 36.4339 P61/V156 | NHD extract refresh: 23 -> 61 parts of the same TN reach (no VA water; boundary-clipped). |
| watauga-river | fragment | -81.936 36.287 -81.919 36.294 P1/V22 -> -82.422 36.3291 -82.1263 36.4481 P99/V270 | Baseline = one TIGER "Watauga Riv" segment inside the Watauga Lake arm (Johnson Co; upstream of the dam). Corrected: Wilbur-dam-gated NHD tailwater to the SF Holston confluence (maxLon -82.125 = USGS 03484000 below-Wilbur-Dam lon -82.1296). |
| west-fork-stones-river | ok | -86.482 35.648 -86.41 35.985 P28/V349 -> -86.4818 35.6479 -86.4099 35.9859 P51/V427 | Rounding-level refresh delta. |
| west-prong-little-pigeon | ok | -83.5935 35.6349 -83.4702 35.8744 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| white-oak-creek | ok | -87.8796 36.1478 -87.5556 36.2646 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| wolf-river-fentress | ok | -85.1403 36.5218 -84.901 36.6043 (unchanged) | Verified: TIGER/NHD match consistent with the catalog county/region; no action. |
| shelby-farms-lake | point-anchor | (-89.8327 35.1362 -89.8327 35.1362) | Coordinates verified county-plausible (West TN; provenance packages/content/data/west-tn-ponds.json: 8 OSM-Nominatim anchors + 5 town approximations). No line geometry by design; validator now accepts these Point features. |
| cameron-brown-lake | point-anchor | (-89.7723 35.1007 -89.7723 35.1007) | Coordinates verified county-plausible (West TN; provenance packages/content/data/west-tn-ponds.json: 8 OSM-Nominatim anchors + 5 town approximations). No line geometry by design; validator now accepts these Point features. |
| edmund-orgill-lake | point-anchor | (-89.833 35.3722 -89.833 35.3722) | Coordinates verified county-plausible (West TN; provenance packages/content/data/west-tn-ponds.json: 8 OSM-Nominatim anchors + 5 town approximations). No line geometry by design; validator now accepts these Point features. |
| yale-road-park-lake | point-anchor | (-89.8567 35.2167 -89.8567 35.2167) | Coordinates verified county-plausible (West TN; provenance packages/content/data/west-tn-ponds.json: 8 OSM-Nominatim anchors + 5 town approximations). No line geometry by design; validator now accepts these Point features. |
| johnson-park-lake | point-anchor | (-90.049 35.149 -90.049 35.149) | Coordinates verified county-plausible (West TN; provenance packages/content/data/west-tn-ponds.json: 8 OSM-Nominatim anchors + 5 town approximations). No line geometry by design; validator now accepts these Point features. |
| valentine-park-pond | point-anchor | (-89.8006 35.4637 -89.8006 35.4637) | Coordinates verified county-plausible (West TN; provenance packages/content/data/west-tn-ponds.json: 8 OSM-Nominatim anchors + 5 town approximations). No line geometry by design; validator now accepts these Point features. |
| covington-fbc-pond | point-anchor | (-89.6488 35.5562 -89.6488 35.5562) | Coordinates verified county-plausible (West TN; provenance packages/content/data/west-tn-ponds.json: 8 OSM-Nominatim anchors + 5 town approximations). No line geometry by design; validator now accepts these Point features. |
| martin-city-pond | point-anchor | (-88.8488 36.3098 -88.8488 36.3098) | Coordinates verified county-plausible (West TN; provenance packages/content/data/west-tn-ponds.json: 8 OSM-Nominatim anchors + 5 town approximations). No line geometry by design; validator now accepts these Point features. |
| milan-city-pond | point-anchor | (-88.7302 35.9217 -88.7302 35.9217) | Coordinates verified county-plausible (West TN; provenance packages/content/data/west-tn-ponds.json: 8 OSM-Nominatim anchors + 5 town approximations). No line geometry by design; validator now accepts these Point features. |
| paris-city-park-lake | point-anchor | (-88.31 36.302 -88.31 36.302) | Coordinates verified county-plausible (West TN; provenance packages/content/data/west-tn-ponds.json: 8 OSM-Nominatim anchors + 5 town approximations). No line geometry by design; validator now accepts these Point features. |
| beech-lake | point-anchor | (-88.4227 35.6847 -88.4227 35.6847) | Coordinates verified county-plausible (West TN; provenance packages/content/data/west-tn-ponds.json: 8 OSM-Nominatim anchors + 5 town approximations). No line geometry by design; validator now accepts these Point features. |
| lake-graham | point-anchor | (-88.835 35.614 -88.835 35.614) | Coordinates verified county-plausible (West TN; provenance packages/content/data/west-tn-ponds.json: 8 OSM-Nominatim anchors + 5 town approximations). No line geometry by design; validator now accepts these Point features. |
| union-city-reelfoot-pond | point-anchor | (-89.055 36.426 -89.055 36.426) | Coordinates verified county-plausible (West TN; provenance packages/content/data/west-tn-ponds.json: 8 OSM-Nominatim anchors + 5 town approximations). No line geometry by design; validator now accepts these Point features. |

## Not correctable from public-domain sources (documented, not fabricated)

- `cane-creek` misjoin is **by design** — the catalog note ("TWRA lists both Upper Cane
  Creek (Bledsoe/Van Buren…) and Cane Creek (Hickman/Perry)…") makes one id cover four
  county reaches. The disconnected bbox (gap 2.44°) is inherent; splitting the id belongs
  to the content lane.
- Tailwater *downstream* endpoints are regulatory (TWRA), not derivable from NHD/TIGER.
  Where the catalog itself does not bracket a reach, this audit bounds only the provable
  upstream end (the dam) and documents the residual imprecision.
- 13 tn-west ponds: point anchors only (no NHD/TIGER linear water exists); coordinates
  re-verified county-plausible against their TWRA program towns.

## Upstream findings handed to other lanes

1. **Content pack build is broken at base** — `pnpm --filter @trout/content build` fails:
   da80558 added region `tn-west` (packages/content/scripts/regions.ts) but no
   `hatch/tn/tn-west.yaml`. Workaround used here (disclosed): built once with a temporary
   untracked shim hatch file, deleted afterward; no tracked `packages/` file changed.
2. **Served catalog is stale** — `apps/web/public/v1/streams.json` has 92 entries; the
   13 tn-west waters are absent from `/v1/streams` until the pack is rebuilt and snapshots
   regenerated (serving lane).
3. **Catalog gauge placement** — duck-river-tailwater lists USGS 03596000 ("Duck River
   below Manchester", 35.4709/-86.1216), which sits *above* Normandy Dam (lake west edge
   -86.2482). Content lane should re-point it (e.g. 03597860) or rename.
4. **Docs drift** — `docs/atlas-sources.md` omitted the required `fix-caney-fork.mjs`
   step (source tag `caney-fork-corridor-fix` on the shipped feature). Added to the
   pipeline list in this audit's reproduce section and in the docs update below.
5. **validate-atlas.mjs failed on the shipped baseline** — the 13 Point anchors added in
   da80558 were rejected as "unexpected geometry". Fixed in this lane (Point accepted
   only for `twra-winter-ponds`-tagged features).

## Reproduce

```bash
pnpm install && pnpm --filter @trout/contracts build && pnpm --filter @trout/ui build
pnpm --filter @trout/content build        # requires hatch/tn/tn-west.yaml upstream fix
node apps/web/scripts/fetch-atlas-sources.mjs          # Census TIGER/Line 2024 (95 counties)
node apps/web/scripts/build-atlas-context-sources.mjs  # boundary/counties intermediates
node apps/web/scripts/fetch-nhd-targets.mjs            # USGS NHDPlus HR extracts
node apps/web/scripts/match-rivers-tiger.mjs           # TIGER match + reach gates
node apps/web/scripts/merge-rivers.mjs                 # assemble lines/polygons + gates
node apps/web/scripts/fix-caney-fork.mjs               # caney-fork corridor rebuild
node apps/web/scripts/merge-west-tn-points.mjs         # ALWAYS last (idempotent)
node apps/web/scripts/validate-atlas.mjs               # must PASS
```

Gauge anchors for `apps/web/src/data/streams-geo.json`:
`https://waterservices.usgs.gov/nwis/site/?format=rdb&sites=<catalog gaugeIds>&siteOutput=expanded`
(NAD83 `dec_lat_va`/`dec_long_va`).

## Verification

- `node apps/web/scripts/validate-atlas.mjs` — **PASS** (105 features, 105 unique ids, zero
  structural/coordinate errors).
- `pnpm --filter @trout/web typecheck` / `test` (74 passed) / `build` incl. size budget — green.
- Post-rerun diff vs baseline: 26 of 105 features changed; every change is an intended
  correction (table above) or a verified data-refresh delta; 78 line features + 13 point
  anchors are unchanged; no stream regressed to UNRESOLVED.
