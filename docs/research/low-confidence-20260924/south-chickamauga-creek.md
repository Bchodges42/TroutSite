# South Chickamauga Creek — TENNESSEE reach (Hamilton County / Chattanooga) — Trout-Stocking Evidence Research Log

Water: South Chickamauga Creek, TENNESSEE reach only — major greenway waterway entering Chickamauga Reservoir ~1 km above Chickamauga Dam, Chattanooga, Hamilton County. The creek RISES IN NORTH GEORGIA (Catoosa/Walker counties); this log's call is scoped to the TN reach from the TN/GA state-line crossing (~34.988 N) to the mouth. Distinct from North Chickamauga Creek (Soddy-Daisy; a stocked TWRA water) and from Chickamauga Reservoir/River.
Research date: 2026-09-24 (all retrieval dates = 2026-09-24).
Ledger state: unresolved — no trout program/survey/dated record on the TN reach.
Researcher constraint: research only; no agency/business contact; no writes except this file.

## HEADLINE

NO trout evidence of any kind binds to the TENNESSEE reach in any lane checked: zero TWRA schedule rows (2026 live JSON; archived 2003, 2018, 2019, 2020 schedules), zero sites in TWRA's master stocking-site layer, zero salmonids in 1,148 iNaturalist fish observations (972 TN-side, 113 taxa), zero salmonids in GBIF/museum records (the creek's museum fish lots are all GA-side), zero salmonids in WQP/TDEC records, and no trout in angler-platform species lists (which are uniformly warmwater). Every "Chattanooga-area trout" media item binds to a DIFFERENT water: North Chickamauga Creek (conservancy/TWRA partnership), Big Soddy Creek, or winter park PONDS (Lake Junior; Jack Dickert Pond at Camp Jordan Park — a pond on East Ridge, near but not on the creek). The TN reach is a richly documented WARMWATER stream.

## REACH DEFINITION (TN)

- Crosses from GA (Catoosa County) into TN at the ~34.988 N line: TDEC stations TDECWR_WQX-TNW000007646 "South Chickamauga Creek" 34.9884, -85.1762 and TNW000005446 34.9972, -85.1845 bracket the crossing (WQP station search, 2026-09-24).
- Flows N through Hamilton County (East Brainerd, Silverdale/Bonny Oaks corridor, greenway to Camp Jordan in East Ridge and north to Tennessee Riverpark), into the Chickamauga Reservoir embayment just upstream of Chickamauga Dam. Most-downstream TDEC station TNW000005443 at 35.0883, -85.2681 (Chickamauga Dam is ~35.0865, -85.2829). GBIF/iNat 2016 turtle locality "confluence of South Chickamauga Creek and Tennessee River at River Point Park" corroborates the mouth.
- USGS continuous gauge 03567550 "South Chickamauga Creek near Shepherd, TN" anchors the mid-reach (surfaced in search; not fetched).
- GA reach (Ringgold/Graysville, GA-2 corridor) explicitly EXCLUDED from the call below; GA-side evidence is flagged where it appears.

## SOURCE-BY-SOURCE LOG

### A. Agency stocking program evidence (highest weight)

A1. TWRA live 2026 Trout Stocking Schedule JSON (616 rows)
- Org: TWRA. Retrieved 2026-09-24 via curl + browser UA (plain curl intermittently fails with TLS errors; Chrome UA succeeded).
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json
- Fields: REGION, COUNTY, LOCATION, TYPE, STOCKING DAY, STOCKING WEEK, STOCKING MONTHS, SPECIES.
- Hamilton County rows (17, verbatim locations): "Big Soddy Creek" (9 rows: Delayed Harvest 02/08, 2/22, 10/25, 11/29/2026; Seasonal 3/8, 3/22 x2, 4/19, 4/26/2026 — different water, Soddy-Daisy); "Dickert Pond / Camp Jordan" (Winter, 1/7/2026 and 2/4/2026, rainbow — POND, East Ridge, immediately adjacent to the South Chickamauga Creek greenway corridor); "Lake Junior" (Winter, 1/7 + 2/4/2026, rainbow — POND, Chattanooga); "N. Chickamauga Creek" (Seasonal rainbow 2/22, 3/22, 4/19, 11/1/2026 — DIFFERENT WATER, identity trap).
- ZERO "South Chickamauga Creek" rows anywhere in the 616-row file. Layer-wide "chickamauga" name match = only N. Chickamauga Creek (4 rows).
- Type: official current-year schedule. Confidence: HIGH. Establishes: no 2026 stocking on the TN reach. Does not establish: pre-2026 history (covered by A3-A4).

A2. TWRA ArcGIS feature layer TWRA_Trout_Stocking_Locations (master site layer, ~730 sites; drives TWRA trout map)
- Org: TWRA. Retrieved 2026-09-24. Query endpoint (read-only GET): https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0/query
- County='HAMILTON' rows (8): Thrasher Pike Bridge Crossing (S1), North Chickamauga Creek, Spring, stream, rainbow, Soddy Daisy (35.21116, -85.21512); Big Soddy Creek Sites 1-5, Spring, rainbow (35.166-35.303, -85.172 to -85.183); Lake Junior, Winter, pond, rainbow, Chattanooga (35.09066, -85.2225); Camp Jordan Park / Jack Dickert Pond, Winter, pond, rainbow, East Ridge (34.99902, -85.19696).
- Site_Name/StreamName LIKE '%Chickamauga%' layer-wide: ONLY the North Chickamauga Creek site. NO South Chickamauga Creek site exists anywhere in the layer.
- Type: official site master. Confidence: HIGH. Establishes: the TN reach is not a TWRA trout site in any program. Note: Camp Jordan's Jack Dickert Pond (34.99902, -85.19696) is a stocked POND on the greenway corridor — any "trout at Camp Jordan" observation binds to the pond, not the creek.

A3. Archived TWRA schedules (Wayback captures, retrieved 2026-09-24; pypdf extraction)
- 2003 Tentative Schedule: http://web.archive.org/web/20030404161556/http://www.state.tn.us/twra/fish/StreamRiver/stockedtrout/sched03.pdf — Hamilton row: "N Chickamauga Creek XX X". No South Chickamauga, no Soddy.
- 2018 schedule: https://web.archive.org/web/20180717180317/https://www.tn.gov/content/dam/tn/twra/documents/2018-Trout-Stocking-Schedule.pdf — Hamilton row: "N Chickamauga Creek ● ● ●".
- 2019 schedule: https://web.archive.org/web/20190109035923/https://www.tn.gov/content/dam/tn/twra/documents/2019-Trout-Stocking-Schedule.pdf — "N Chickamauga Creek ● ● ●".
- 2020 Complete schedule: https://web.archive.org/web/20200424033427/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Trout-Stocking-Schedule-Complete.pdf — "N Chickamauga Creek ● ● ●".
- Grep across all four for Hamilton|McMinn|Chickamauga|Oostanaula|Athens|Soddy: only "N Chickamauga Creek" rows. Type: archived official annual schedules. Confidence: HIGH. Establishes: no South Chickamauga Creek schedule row in 2003, 2018, 2019, or 2020 (plus none in 2026; years not checked are gaps, not positives).

### B. Fish surveys / species lists (weighted negative evidence)

B1. iNaturalist fish observations, TN-reach bounding box (34.97-35.13 N, -85.30 to -85.05)
- Org: iNaturalist community. Retrieved 2026-09-24 via https://api.inaturalist.org/v1/observations?taxon_id=47178 (ray-finned fishes) + bbox, quality_grade=any, full pagination. 1,148 observations total.
- TN-side (lat >= 34.988): 972 observations, 113 taxa. Top: Lepomis macrochirus 184, L. auritus 120, L. cyanellus 104, Lepomis sp. 52, Luxilus chrysocephalus 41, Micropterus nigricans 40, Ambloplites rupestris 39, Nothonotus rufilineatus 17, L. microlophus 17, Semotilus atromaculatus 12, Etheostoma simoterum 11, Cyprinella galactura 10, Campostoma oligolepis 10, Morone mississippiensis 9, Hypentelium nigricans 9, Aplodinotus grunniens 9, Noturus eleutherus 8, Etheostoma caeruleum 8, Etheostoma duryi 5, Cottus carolinae 5, Micropterus dolomieu 4 / punctulatus 4, Coccotis coccogenis 3, Perca flavescens 3... Observed dates run to 2026-09-23 (Pogonichthyinae, Chattanooga; Actinopterygii, Bonny Oaks Dr).
- SALMONIDS: ZERO (no Oncorhynchus, Salmo, or Salvelinus anywhere in the envelope, TN or GA side).
- Mouth/reservoir context (excluded from in-creek list): Huso fulvescens (lake sturgeon) 7 casual obs at -85.21 to -85.29 longitudes = Tennessee River channel/reservoir (stocked population), not the creek; Polyodon spathula (Linden Hall Rd, casual); Morone saxatilis at King's Point (35.1023, -85.2301 = river, research grade, 2021) — reservoir fish at/near the confluence.
- GA-side flag: 176 obs / 48 taxa below lat 34.988 are EXCLUDED — including the "graysville pedestrian bridge" cluster (27 obs; 34.9775, -85.1447 = Graysville, GA) and "1789 Graysville Rd, Ringgold, GA".
- Type: crowdsourced photo observations; broad method (community-scale, multi-year, current through 2026). Confidence: MEDIUM-HIGH as negative evidence (heavy observation pressure on a public greenway creek would be expected to surface stocked trout). Establishes: no documented trout occurrence on the TN reach despite dense documentation of everything else that swims there.

B2. GBIF / museum records
- Retrieved 2026-09-24 via https://api.gbif.org/v1/occurrence/search?q=%22South%20Chickamauga%22&country=US (300-record scan; 179 locality-bearing matches reviewed).
- Fish lots are GEORGIA-SIDE (flagged, excluded from TN call): UT/other 1975 lot "South Chickamauga Creek - Tennessee River" state=Georgia (Cottus carolinae, Luxilus chrysocephalus, Etheostoma caeruleum, E. simoterum; dataset d499aef2); Tulane 1980 lots "S. Chickamauga Cr. at Grayville below Mill Dam", "at GA 151 in Ringgold", "0.2 mi below Goodson Springs", "~1.5 mi below Hwy 41 via canoe" (state=Georgia; dataset 3633e0e7) — ~30 warmwater/creek species, incl. Micropterus dolomieu, M. punctulatus, Nocomis micropogon, Phenacobius uranops, Hybopsis amblops. One 1962 "Chickamauga Cr. at Graysville, just S of Chattanooga, TN" is also state=Georgia.
- TN-side creek records are non-fish: mussels Potamilus alatus and Cyclonaias tuberculata "South Chickamauga Creek" state=Tennessee (dataset a0551854, undated); 2016 turtle Graptemys ouachitensis / Pseudemys concinna at the River Point Park confluence (dataset 410461b6).
- Salmonids: ZERO in any state for any Chickamauga-named locality.
- Type: museum specimen records (method-documented, decades old, GA-weighted). Confidence: MEDIUM. Establishes: no museum trout record; the TN reach lacks its own museum fish series (gap, not proof).

B3. WQP / TDEC (TDECWR_WQX) station + result data
- Retrieved 2026-09-24 via https://www.waterqualitydata.us/data/Station/search?organization=TDECWR_WQX&bBox=-85.30,34.98,-85.05,35.12&mimeType=csv (78 stations; 10 creek-named) and Result/search for the 6 main-stem creek stations (TNW000005443/444/445/446, TNW000007646, TNW000008772).
- Creek-station results: 3,724 rows — Water 3,258 (chemistry, E. coli), Biological 256 (COUNT rows = benthic macroinvertebrate counts), Habitat 210. ZERO fish-taxa rows at creek stations; ZERO tissue fish on the creek. (Consistent with prior-pass note: TDEC "Biological" rows in WQP are benthic-only.)
- Bbox-wide TDEC fish-tissue species (river/reservoir stations incl. TNW000001128 etc., 1987-2026): Micropterus salmoides (406 rows), Ictalurus punctatus (356), Morone saxatilis (95), Minytrema melanops (36), Ictalurus furcatus (35) — warmwater targets of the statewide tissue-contaminant program; NO salmonids anywhere in the bbox.
- Type: agency monitoring data. Confidence: HIGH for absence of trout in TDEC datasets; MEDIUM as fish-community evidence (chemical/benthic program, not a fish survey).

B4. TVA
- TVA's Chickamauga-area monitoring surfaced is reservoir ecological-health ratings (fish + benthos at embayment sites, 2-year cycle, https://tva.com) and a 1990 Chickamauga Reservoir Embayment Study (UNT Digital Library) — reservoir program, no creek trout claim. TWRA's bi-annual Chickamauga Reservoir electrofishing (bass/crappie etc.) is the reservoir, not the creek. No TVA trout claim on the TN reach located.

### C. Dated warmwater documentation

C1. Angler-platform species lists (all warmwater; retrieved 2026-09-24 via search snapshots — pages not individually fetched):
- PiscaMaps "Fishing at South Chickamauga Creek, Tennessee" (https://piscamaps.com): smallmouth bass, largemouth bass, spotted bass, walleye, black crappie, white crappie, bluegill, channel catfish, common carp. (CAUTION: an earlier search-engine summary garbled this into "walleye and rainbow trout are also caught" — the trout phrase traces to reservoir/TWRA context in the results page, not the PiscaMaps list; treated as NOT a creek trout claim.)
- OnWater app (https://www.onwaterapp.com): largemouth, smallmouth, bluegill, channel catfish, common carp, flathead catfish, green sunfish "and more" — warmwater.
- Fishbrain (https://fishbrain.com): most-reported catches rock bass, smallmouth bass, largemouth bass, bluegill, channel catfish — warmwater.
- Chattanooga Fishing Forum: "great for smalleys, cats, bluegill"; spring striped-bass runs up the creek (reservoir-run anecdote; LEAD only, undated thread).
- Type: unvetted angler content; single-source weight. Establishes: the angler-facing identity of the TN reach is uniformly warmwater.

C2. iNat dated warmwater obs on the greenway: observations through 2026-09-23 (e.g., Lepomis auritus research-grade Riverside Dr 2026-09-13; L. macrochirus King's Point 2026-09-19) — dated current documentation of a warmwater fishery.

### D. Contradictions / traps encountered (all resolved to OTHER waters)

- "N. Chickamauga Creek" 2026 seasonal stockings + northchick.org conservancy stocking page (https://www.northchick.org) + tnstateparks TWRA stocking event (Nov 6, 2025) + NewsChannel5 fall stocking item: ALL North Chickamauga Creek (Soddy-Daisy), a different water.
- Big Soddy Creek (DH + seasonal) — different water.
- Dickert Pond / Camp Jordan (East Ridge, 34.999, -85.197) and Lake Junior (35.091, -85.223): TWRA winter POND programs adjacent to the Chattanooga greenway network — any "trout in Chattanooga/greenway" claim likely belongs to these ponds.
- GA-reach content (museum lots, GA iNat cluster, Graysville GA): excluded per identity discipline.

## SEARCHES RUN (S-Chick; unproductive ones marked)

1. TWRA 2026 JSON fetch + Hamilton/name grep — productive (A1).
2. ArcGIS site layer County=HAMILTON + layer-wide LIKE Chickamauga — productive (A2).
3. Wayback schedules 2003/2018/2019/2020 text-extract grep — productive (A3).
4. WebSearch '"South Chickamauga Creek" trout stocking Tennessee' — all hits bind to N. Chick/Big Soddy/ponds.
5. WebSearch 'Chattanooga trout stocking park pond TWRA winter' — productive (pond attribution: Lake Junior, Camp Jordan, Athens pond).
6. GBIF q="South Chickamauga" country=US — productive; museum fish all GA-side.
7. GBIF polygon fish query (Actinopterygii taxonKey) — UNPRODUCTIVE/API-BROKEN: taxonKey 204 returned 0 against 601,507 all-taxa; class-key resolution via species/match failed (None) and species/search returned reindexed keys; not resolved. Mitigated by B1/B2 text search.
8. USGS NAS API v2 county queries (Hamilton) — UNPRODUCTIVE: endpoint 404s (site redesign); NAS county lane not covered.
9. iNat bbox fish scan + full pagination + TN/GA split + salmonid scan — productive (B1).
10. iNat targeted scans (Huso fulvescens, Morone saxatilis, Polyodon) — productive (mouth/reservoir context).
11. WQP station + result queries (bbox; creek-site tissue) — productive (B3).
12. Wayback CDX tn.gov/environment watershed-plan PDF filters (south chickamauga) — UNPRODUCTIVE (0 captures); TDEC watershed-plan PDF lane not completed (older plans live under state.tn.us paths not located this pass).
13. WebSearch 'TDEC "South Chickamauga Creek" biorecon fish species watershed plan' — surfaced chattanooga.gov watershed page, hamiltontn.gov monitoring page, UTC thesis; PDF not fetched (timebox).
14. WebSearch 'TVA "South Chickamauga Creek" monitoring fish OR benthic' — productive-negative (B4).
15. WebSearch piscamaps species list — productive (C1); direct page fetch 404'd (site structure); recorded via search snapshot.

## RECOMMENDATION: warmwater-focus (TN reach)

Reasoning: Every stocking lane (2026 schedule, master site layer, 2003/2018/2019/2020 archived schedules) is empty for the TN reach; the only Chickamauga-name trout program is North Chickamauga Creek; the only Chattanooga trout are winter pond plants (Lake Junior, Jack Dickert Pond). A broad, current, method-documented observation set (972 iNat fish obs, 113 taxa, through Sept 2026) omits trout entirely while documenting a diverse warmwater assemblage; TDEC data, museum records, and every angler platform agree (warmwater). GA-reach trout-country character does NOT transfer across the state line — the GA evidence stays GA. Residual gap: no pre-2003 TWRA schedule check and no dedicated TWRA electrofishing report for the creek; neither would plausibly support a trout call given the totality. If a catalog ever cites "Camp Jordan" or "Chattanooga" trout for this creek, re-attribute to the stocked ponds.
