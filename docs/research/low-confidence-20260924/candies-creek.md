# Candies Creek — Trout Evidence Research Log
Water: Candies Creek (GNIS original/variant name "Candy's Creek"/"Candy Creek", after Henry Candy, a Cherokee man — same water, NOT a distinct stream), Bradley County TN, Hiwassee River basin (HUC 06020002), tributary to the Hiwassee arm / Chickamauga Reservoir backwater.
Research date: 2026-09-24. Internal classification research only; no agency/business/author contact. Retrievals by ZCode.

## Reach definition
- **Flow path**: heads in south Cleveland area (TDEC legacy station TDECWPC-CANDI033.1BR, 35.0782, -84.9669), flows NNE ~15 air miles through the Hopewell / Black Fox community (USGS-03566208 "Candies Creek at Black Fox") and past Eureka Rd (USGS-035662553 "Candies Cr nr Eureka", 35.2762, -84.8424) to the mouth.
- **Mouth**: Candies Creek Embayment of the Chickamauga Reservoir (Hiwassee arm), just SW of Charleston, TN — TDEC reservoir-classified stations TDECWR_WQX-TNW000000870 (35.3272, -84.8468) and TNW000000871 (35.3230, -84.8420); corroborated by NAS 1988 locality "Candies Creek Embayment ... WNW of Charleston, [Charleston Quad]".
- **Scoping note**: "Candies Creek" stations in WQP include mainstem + unnamed tributaries (TDECWR_WQX-TNW000000881..884, TNW000007025, TNW000007269, Lick Branch TNW000003610). Candies Creek Ridge is the upland between Candies and Mouse Creek — not a water.

## Sources

### S1. TWRA Trout Stocking Locations (ArcGIS FeatureServer layer, current full dump)
- Org: Tennessee Wildlife Resources Agency (TWRA), hosted at services3.arcgis.com/PWXNAH2YKmZY7lBq.
- Retrieval: 2026-09-24, query `.../FeatureServer/0/query?where=1%3D1&outFields=...&resultRecordCount=2000` (730 rows), plus county-specific queries.
- Fields: Site_Name, StreamName, County, WaterClass (stream/pond/reservoir), StockingProgram, Species, Management.
- Findings: **Zero features with County='Bradley'** (county query returns empty). Full-dump text scan for Candies/Candy/Chestu/Hiwassee finds only Hiwassee River tailwater sites, all in Polk County (Powerhouse Boat Ramp, Big Bend, Fox's Cabin, Railroad Trestle, Hwy 411 Bridge, Hiwassee State Park, Taylor's Island, Picnic Area). **No "Candies" or "Candy" water anywhere in the layer.**
- Type + confidence: Programmatic absence, high confidence (authoritative current layer).
- Establishes: No active/current TWRA trout stocking site on Candies Creek or anywhere in Bradley County. Does not by itself rule out historical stocking.
- URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0/query?where=County%3D%27Bradley%27&outFields=*&f=json

### S2. TWRA 2026 Trout Stocking Schedule JSON (616-row data table)
- Org: TWRA tn.gov data table.
- Retrieval: 2026-09-24 (browser-context fetch).
- Fields: REGION, COUNTY, LOCATION, TYPE (Winter/Spring/Reservoir/Tailwater), STOCKING DAY, SPECIES.
- Findings: **No rows containing "Candies", "Candy", "Chestuee", "Chestua", or "Bradley".** Only Region 3 McMinn entry: "Athens City Park Pond" (Winter, Rainbow Trout, 1/8/2026 and 2/18/2026) — a POND, not a Hiwassee tributary. Region 3 counties present: Clay, Cumberland, DeKalb, Fentress, Grundy, Hamilton, Marion, McMinn, Monroe, Morgan, Overton, Pickett, Polk, Putnam, Rhea, Sequatchie, Van Buren, Warren (+ Region 4 East TN).
- Type + confidence: Programmatic absence, high.
- Establishes: Candies Creek is not on the current stocking schedule; Bradley County has no stocked water at all in 2026 (no Cleveland park pond program — any "Cleveland trout" chatter should be attributed to Hamilton County ponds e.g. Camp Jordan, East Ridge, or to McMinn's Athens City Park Pond).
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json

### S3. USGS NAS (Nonindigenous Aquatic Species) county occurrence export — Bradley
- Org: USGS Geological Survey / MARIS.
- Retrieval: 2026-09-24, API https://nas.er.usgs.gov/api/v2/occurrence/search?state=TN&county=Bradley
- Fields: 15 records total. **Salmonidae: none.** On-Creek records are Corbicula fluminea only: 1969 "Candies Creek, 1 km ESE of Eureka Rd/Old Eureka Rd intersection" and 1988 "Candies Creek Embayment ... WNW of Charleston (Charleston Quad)". Remaining records are Conasauga-drainage (south Bradley) or non-fish taxa.
- Method/count: museum/NAS aggregation, no fish-community survey on Candies Creek; clam records prove targeted in-stream collection occurred 1969 and 1988 without any trout record.
- Type + confidence: Coverage-gap + weak negative, moderate.
- Establishes: Decades of targeted sampling on this creek with zero salmonid record. Does not establish fish community composition.

### S4. WQP (waterqualitydata.us) — TDEC/USGS monitoring on Candies Creek
- Org: TDEC (TDECWPC legacy + TDECWR_WQX) and USGS; national Water Quality Portal.
- Retrieval: 2026-09-24, Station + Result searches (County US:47:011).
- Fields/findings:
  - USGS-03566250 "CANDIES CREEK NEAR CLEVELAND, TN": **4 results, year 1988 only — Stream flow (instantaneous), Temperature, Specific conductance.** This is the ledger's "single cool 1988 grab sample": a water-chemistry grab, not a biological sample.
  - TDECWPC-CANDI033.1BR: 45 results, 2007–2008 — standard 305(b) chemistry (DO, pH, E. coli, nutrients).
  - TDECWR_WQX-TNW000000875 (35.2016, -84.8947): 280 results, 2007/2010/2012/2013/2017 — chemistry + metals (incl. water-column mercury) + **RBP2 habitat assessment + benthic macroinvertebrate "Count" records**. Bio dates: 2007-08-30, 2007-09-19, 2010-08-31, 2013-06-27. Taxa are insects/mollusks/diatoms (Thienemanniella, Isonychia, Baetis, Stenonema, Elimia, Corbicula, Cocconeis, etc.). **No fish taxa.**
- Method/count: method-documented TDEC biorecon-style benthic + habitat surveys (RBP2) on the mainstem, multiple dates 2007–2017; **no fish assemblage sampling in the portal**.
- Type + confidence: Method-documented survey (benthic) omitting fish = limited negative evidence for trout management (TDEC treats it as a warm wadeable stream; benthic survey is not a fish survey), moderate weight.
- Establishes: Long official monitoring presence; no trout-era program. Does NOT establish the fish community.
- URLs: https://www.waterqualitydata.us/data/Station/search?countrycode=US&statecode=US%3A47&countycode=US%3A47%3A011&mimeType=csv ; https://www.waterqualitydata.us/data/Result/search?siteid=TDECWR_WQX-TNW000000875&mimeType=csv

### S5. GBIF occurrence search — Actinopterygii in creek bounding box
- Org: GBIF (museum/aggregator).
- Retrieval: 2026-09-24, https://api.gbif.org/v1/occurrence/search?taxonKey=204&decimalLatitude=35.10,35.35&decimalLongitude=-84.95,-84.60&limit=100
- Findings: **total = 0** ray-finned fish specimens anywhere in the Candies Creek bbox (incl. Cleveland). Coverage gap — the creek has no digitized museum fish collection.
- Type + confidence: Coverage gap (not absence evidence), high confidence in the gap itself.

### S6. iNaturalist — Salmonidae near Candies Creek
- Org: iNaturalist community.
- Retrieval: 2026-09-24, https://api.inaturalist.org/v1/observations?taxon_name=Salmonidae&swlat=35.10&swlng=-84.95&nelat=35.35&nelng=-84.60&per_page=30 → **total_results = 0**. Also text queries q="Candies Creek" + taxon Actinopterygii → 0.
- Type + confidence: Weighted negative, moderate (salmonids are conspicuous when present; creek-level iNat coverage is thin).

### S7. Same-name / spelling control
- "Candy's Creek" is the historical GNIS variant of this same water, named for Henry Candy; Hopewell community context (Wikipedia/Kiddle, retrieved via search 2026-09-24, https://en.wikipedia.org/wiki/Hopewell,_Bradley_County,_Tennessee). TWRA and NAS datasets contain no other TN "Candy/Candies" water → spelling variants collapse onto this creek. Candies Creek Ridge = upland, not a water.

### S8. Angler-app species leads (weak)
- OnWater app page "Candies Creek Fishing in Tennessee" lists Largemouth Bass and Blue Catfish for the creek (auto-generated app content, undated; retrieved via search 2026-09-24, https://www.onwaterapp.com). Type: LEAD, very low confidence — likely template output. Nearby Fishbrain "Westmore Pond" (Bradley Co) reports Largemouth/Bluegill/Smallmouth — a POND, attributed to pond, not the creek.

## Searches run (incl. unproductive)
1. WebSearch "Candies Creek Bradley County Tennessee trout stocking" — summary claimed "periodically stocked by TWRA"; DISPROVEN by S1/S2 (AI-filler). No primary hit.
2. TWRA ArcGIS county + full-dump queries — productive (absence).
3. TWRA 2026 schedule JSON — productive (absence).
4. USGS NAS Bradley — productive (Corbicula-only, no Salmonidae).
5. WQP Station search (monitoringLocationName=Candies — 0 rows; county fallback — 271 stations) — productive.
6. WQP Result searches at 4 Candies stations — productive (1988 grab identified; benthic-only bio).
7. WQP bio endpoint — 404 (unproductive path).
8. GBIF Actinopterygii bbox — 0 (coverage gap).
9. iNat Salmonidae bbox + name queries — 0.
10. Wayback CDX for TDEC Hiwassee watershed plan/biorecon PDFs — repeatedly rate-limited/empty; tn.gov WebFetch ECONNRESET. Lane exhausted without the 163-page TDEC Hiwassee WQMP PDF (which mentions Candies Creek re: construction stormwater; search snippet only).
11. WebSearch fishbrain "Candies Creek" — no direct Fishbrain creek page; Westmore Pond (pond attribution).
12. WebSearch "Cleveland Tennessee TWRA trout stocking park pond winter" — no Bradley pond in TWRA data; Chattanooga-area winter ponds are Hamilton Co (Camp Jordan).
13. WebSearch "Candy Creek" GNIS — variant = same water (S7).
14. TWRA Region 3 stream files — not publicly online; unproductive lane (noted as gap).

## Contradictions
- Search-engine AI summaries twice asserted TWRA stocks Candies Creek / Cleveland ponds; authoritative TWRA datasets (S1, S2) show zero Bradley County stocking. Resolved in favor of primary data.
- Ledger "single cool 1988 grab sample" clarified: 1988 USGS chemistry grab (flow/temp/conductance) at gage 03566250, not a fish sample; a separate 1988 NAS Corbicula record exists in the embayment.

## Recommendation: WARMWATER-FOCUS
Reasoning: (a) No TWRA trout stocking now or in the current location layer, and no Bradley County trout program exists at all (nearest stocked waters: Hiwassee tailwater in Polk Co; Athens City Park Pond — a pond; Hamilton Co winter ponds); (b) the creek's mouth is the warm Chickamauga Reservoir embayment, thermally incompatible with a trout fishery; (c) TDEC monitoring treats it as a warm wadeable stream (benthic/habitat program, no trout involvement); (d) zero salmonid records across NAS/GBIF/iNat despite 1969/1988 in-stream sampling. Residual uncertainty: no fish-community survey of the creek itself was located (WQP fish data absent, GBIF digitization absent, TWRA Region 3 stream files offline), so "warmwater-focus" rests on programmatic + thermal + negative-record grounds rather than a positive warmwater species list; the one angler-app species lead (S8) is unverified. Not "seasonal-stocked" (absent from both TWRA datasets; TWRA's winter program uses ponds, not this stream).
