# Big Swan Creek (Lewis/Hickman Co., TN) — Duck River basin — Evidence Log

- Compiled: 2026-09-24 (retrieval date for all sources)
- Ledger status entering: unresolved (no trout program/survey/dated record)
- Method: desktop research only (TWRA schedule JSON + ArcGIS, USGS NAS, iDigBio, GBIF, iNaturalist, WQP, NHD/GNIS, web). No contact with agencies/businesses/authors/anglers. Wayback offline this pass (blocked the TDEC biorecon-PDF lane).

## Reach definition (and county correction)

- **County association in the ledger needs correction: Big Swan Creek is Lewis + Hickman (headwaters near the Lawrence line), NOT Lewis/Maury.** GNIS lists Big Swan Creek in Lawrence, Lewis, and Hickman counties.
- **Length:** NHD large-scale flowlines: **133 segments totaling 34.5 mi**, plus "Big Swan Pond Slough" (5 segs, 2.0 mi) at the lowland mouth area. USGS gage drainage 38.7 sq mi at Gordensburg (03601852).
- **Course / confluence:** rises in southern Lewis Co. (TSRA's 140-acre Big Swan Headwaters Preserve protects headwater falls), flows NNE through Gordensburg (upper TDEC station RM 21.3) to a mouth on the **Duck River in Hickman County** — NHD northernmost point **(35.7705 N, -87.4116 W)**, ~4.5 mi SSE of Centerville; near the paired USGS gage 03601900 "Big Swan Creek near Centerville" (35.7576, -87.4017). TDEC stations run RM 21.3 → RM 3.7 (BSWAN003.7HI).
- **Little Swan Creek (Lewis Co.) is a TRIBUTARY of Big Swan**, not a separate Duck tributary: it enters at Big Swan RM ~17.8 (paired TDEC stations TDECWPC-BSWAN017.8LE / LSWAN000.1LE at 35.592, -87.448); an APSU 2013 field label reads "little swan creek to big swan creek to duck river at Lawson Rd."
- **Name-collision check:** TN GNIS Swan Creeks elsewhere: Marshall Co. (Duck tributary near Lewisburg — a real in-basin collision), Lincoln Co. (Elk tributary), Hancock Co. (Powell/Clinch system); **none in Humphreys Co.** (GNIS query returned zero Swan features there). Out-of-state Swan Creeks are numerous; the TARCOG "Swan Creek Watershed Management Plan" is Limestone Co., AL — a different basin entirely. Any "Swan Creek" trout/fishing citation must be reach-matched (Marshall-Co. Duck-tributary Swan Creek is the likeliest confusion source for Duck-basin notes).

## Sources

### 1. TWRA 2026 trout stocking schedule (JSON)
- Org: TWRA. Retrieved 2026-09-24. URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json
- **No Lewis County rows at all; no "Swan" rows statewide.** In-basin program waters remain Normandy TW/Duck River (Coffee/Bedford rainbows, J/F/M/N/D) and McCutcheon Creek (Maury, winter rainbows). Type: schedule. Confidence: high. Establishes: no current program on this water.

### 2. TWRA ArcGIS trout stocking locations (master layer)
- URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/ArcGIS/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0 (retrieved 2026-09-24)
- `County='LEWIS'`: **0 sites.** `StreamName LIKE '%SWAN%'`: **0 rows** (statewide). `'%DUCK%'`: 4 rows, all Bedford (Normandy TW). Type: program GIS. Confidence: high. Establishes: no trout stocking site anywhere named Swan Creek, and none in Lewis Co.

### 3. USGS NAS occurrence API
- URL: https://nas.er.usgs.gov/api/v2/occurrence/search?state=TN&county=Lewis&group=Fishes (retrieved 2026-09-24)
- Lewis Co.: 2 fish records total (Clupeidae, Catostomidae); **0 salmonids** (mykiss/trutta/fontinalis all 0). Type: database. Confidence: medium-high. Establishes: no trout occurrence on record for the county.

### 4. Museum collections via iDigBio (APSU, YPM, UMMZ, USNM, UA, AUM, NCSM)
- URL: https://search.idigbio.org/v2/search/records/?rq={"locality":"swan","stateprovince":"Tennessee"} (1,420 'Swan' TN records; 26 fish-collection sites on Big Swan/Little Swan/Swan Creek in Lewis/Hickman/Maury/Lawrence) — retrieved 2026-09-24
- Dated vouchered collections ON Big Swan Creek proper:
  - **1937-05-11 UMMZ** "swan creek, maps 50 NW/SW/SE" (Nocomis effusus, Notropis volucellus, Phenacobius uranops).
  - **1976-06-03 YPM** "just below Hwy 99, 1st bridge going east" (Percina apina — Duck-basin endemic described 2010; earliest vouchered Big Swan record of it).
  - **1982-11-05 APSU** "swan creek, 0.2 mi E Gordonsburg" (10 spp incl. Noturus elegans, Etheostoma rufilineatum, Lythrurus ardens).
  - **1992-07-23 APSU** at Hwy 99 bridge, Lewis Co. (**14 spp**: Campostoma oligolepis, Cottus carolinae, Cyprinella galactura, Etheostoma caeruleum/flabellare/flavum/rufilineatum, Lythrurus ardens/lirus, Notropis leuciodus/telescopus, Noturus elegans…).
  - **1992-11-01 APSU** at Hwy 50 bridge, ~3 mi SE Centerville, Hickman (7 spp incl. Clinostomus funduloides).
  - **2003-05-28 YPM** at **River Mile 1.1**, 5.2 km ESE of Centerville (14 spp incl. Ichthyomyzon castaneus, Erimystax dissimilis/insignis, Nothonotus rufilineatus, Cyprinella spiloptera, Lepomis macrochirus).
  - **2008-05-07 & 2008-06-10 YPM** Perry Bend Rd / off 412-99 at Natchez (incl. lamprey, Nocomis effusus).
  - **2010/2015 APSU** off 2nd bridge on Big Swan Creek Rd (6 spp incl. Nocomis effusus, Lythrurus lirus).
  - **2015-06-04, 2016-04-26, 2017-03-23 YPM** — repeated targeted Percina apina survey sites upstream of US 412 and at Perry Bend Rd.
  - **2022-07-19 YPM** "swan creek at Hwy 50" Hickman (Cottus carolinae, **Nothonotus aquali** [state-listed paleback darter], N. rufilineatus).
- Aggregate **40 fish species, 1937–2022; ZERO salmonids.** Assemblage = clear, high-quality warmwater Rim-stream community incl. three Duck-basin endemic/specialty darters (Percina apina, Nothonotus aquali, N. rufilineatus) and four madtom species.
- Type: survey (vouchered, method-documented collections; repeated trips at fixed sites incl. an RM-referenced downstream site). Confidence: high. **Weighted negative evidence against any trout occurrence.**

### 5. GBIF
- https://api.gbif.org/v1/occurrence/search?taxonKey=204&decimalLatitude=35.44,35.79&decimalLongitude=-87.48,-87.30 → **0 fish records** (also `waterBody=*Swan*`+Tennessee = 0). Museum data not mirrored here → coverage gap, not absence evidence. Type: database. Establishes nothing.

### 6. iNaturalist
- https://api.inaturalist.org/v1/observations?swlat=35.44&swlng=-87.48&nelat=35.79&nelng=-87.30&taxon_id=47178
- **345 fish observations, 2004-05-10 → 2026-07-31**, ~29 taxa: Rosyside Dace 18, Saffron Darter 15, Fantail Darter 14, Egg-mimic Darter 5, Redline Darter 3, Duck Darter 4, **Smallmouth Bass**, **Rock Bass**, Banded Sculpin, Telescope Shiner, Bigeye Shiner/Chub, Mountain Shiner, Banded/Blenny/Stripetail/Greenside/Golden darters… **No trout observations.** Type: crowdsourced (dated, photo-vouchered). Confidence: medium. Consistent with museum assemblage.

### 7. WQP (waterqualitydata.us) stations & results
- https://www.waterqualitydata.us/data/Station/search?countryCode=US&mimeType=csv&bBox=-87.48,35.44,-87.30,35.79 (103 stations; 40 Swan-named)
- ON Big Swan: **TDECWPC-BSWAN003.7HI / 005.7HI / 014.7HI / 017.8LE / 021.3LS** and **TDECWR_WQX-TNW000000707–714**, TNW000008004 (35.7517, -87.4181, near mouth); tributary stations (Faucette Hollow, Smoky Hollow). USGS gages 03601836/1838/1846/1848/1852 (Gordensburg area) and **03601900** (near Centerville). NPS (11NPSWRD_WQX) stations on Little Swan in the Natchez Trace corridor.
- Result checks: `sampleMedia=Biological Tissue` at all five BSWAN stations → **no tissue results; monitoring is water chemistry** (with TDEC benthic-biorecon program implied by "ECO"-series stations nearby, e.g., TDECWPC-ECO71F28 on Little Swan). No fish-list or fish-tissue record in WQP. Type: regulatory monitoring metadata. Confidence: high.

### 8. Regulatory labels (scenic river / ETW)
- **"Swan Creek Scenic River" (TDEC Scenic Rivers): Hickman County, ~15.8 miles designated; designated a Class II Pastoral River Area on May 5, 2026** (2026 scenic-rivers act, HB1510, which also designated new Class II segments of Duck tributaries). tn.gov page located via web search 2026-09-24 ("Swan Creek Scenic River", tn.gov — direct fetch attempt of the scenic-rivers index 404'd; title/quick-facts verified via two independent search hits).
- TDEC rulemaking filing text lists **"Big Swan Creek, Mile 0.0 to Origin"** with flags including State Scenic River / Exceptional Tennessee Waters columns (X-marks) — i.e., the full reach carries ETW-grade protection (found via web search of tn.gov rule filings). Note: ETW status is typically based on documented high biointegrity of the warmwater community.
- Type: regulatory labels. Confidence: high (scenic river, 2026), medium (ETW column flags, search-snippet level). Establishes: high-value warmwater status; no trout implication.

### 9. Local/documentation (dated warmwater use)
- **Fishbrain: Big Swan Creek (Tennessee) — 112 logged catches** (with recent additions); earlier search snippet lists smallmouth bass, rock bass, largemouth bass as the fish of record. Type: local crowdsourced (platform-dated). Confidence: low-medium. Supports active warmwater fishery; no trout reports surfaced.
- **TSRA Big Swan Headwaters Preserve** (Lewis Co., ~140 ac; public hike event April 30, 2022) — headwaters protection org documentation; supports clear-water habitat reputation. Type: local/org. Confidence: medium.
- OnWater app listing ("Lewis and Hickman counties… remarkably clear waters") — generic app content; low.
- Facebook Tennessee Kayak Anglers thread ("tips for fishing Big Swan Creek in Hickman County") — existence noted via search only; not accessed (contact/ scraping avoided). LEAD only.

## Contradictions / cautions
- Ledger county error (Lewis/Maury → actually Lewis/Hickman) must be fixed in any writeup; mouth is in Hickman Co.
- "Swan Creek" citations are high-risk: Marshall Co. Swan Creek is another Duck tributary (in-basin confusion), plus Lincoln/Hancock TN and out-of-state namesakes; Little Swan Creek is this creek's own tributary and has its own record trail (NPS monitoring, APSU/YPM sites).
- 2026 scenic-river designation means some older "Swan Creek" regulatory text may use variant segment names.

## Searches run (incl. unproductive)
1. WebSearch `"Big Swan Creek" Tennessee fish OR biorecon OR TDEC OR watershed Lewis Maury` → OnWater, USGS 03601900/Gordensburg, Fishbrain, TDEC scenic river, TSRA preserve, TTU-cited Lower Duck plan (productive).
2. WebSearch TDEC biorecon/IBI Duck 1996-97 "Big Swan" → rate-limited/no direct PDFs (unproductive).
3. WebSearch `"Swan Creek" scenic river TDEC 15.8 miles OR 303(d)` → Swan Creek Scenic River (Class II, 5/5/2026) + rule-filing ETW text (productive).
4. WebSearch `"Big Swan Creek" OR "Big Bigby" fishing report fishbrain OR smallmouth OR float` → Fishbrain 112 catches; kayak thread (productive).
5. WebFetch fishbrain.com Big Swan page → 404 (unproductive; stats kept from search snippet).
6. WebFetch tn.gov scenic-rivers index URL guess → 404 (page not directly located this pass).
7. API/queries: TWRA ArcGIS (2); NAS (5); iDigBio (2 passes, 1,420 records screened); GBIF (2, 0 hits); iNat (5 incl. date-range queries); WQP (station + 6 result queries); NHD (5, incl. timeouts); GNIS (4, incl. Humphreys check — zero).
8. Wayback CDX for TDEC Duck-basin biorecon PDFs → **Internet Archive offline** (blocked lane).

## Recommendation: **warmwater-focus**
Reasoning: (a) Zero trout program/stocking anywhere in Lewis Co. or on any "Swan" water in TWRA's schedule and master stocking layer. (b) Zero salmonid occurrence in NAS, GBIF, iNat (2004–2026), or 85 years of vouchered museum collections (1937–2022) spanning six fixed sites from RM 1.1 to RM 19.8 and both counties — broad, repeated, method-documented negative evidence. (c) The documented community is an exceptionally intact warmwater assemblage (three Duck-basin endemic/specialist darters, madtoms, sculpin), matching the stream's new Class II Scenic River (2026) and ETW labels — categorically not trout water. (d) The active local fishery is smallmouth/rock bass panfish-style creek fishing. Gaps: TWRA Region 2 internal files; TDEC biorecon fish tables (Wayback offline); Fishbrain full species table not directly fetchable.
