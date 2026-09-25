# Big Bigby Creek (Maury/Lewis Co., TN) — Duck River basin — Evidence Log

- Compiled: 2026-09-24 (retrieval date for all sources)
- Ledger status entering: unresolved (no trout program/survey/dated record)
- Method: desktop research only (TWRA schedule JSON + ArcGIS, USGS NAS, GBIF, iDigBio, iNaturalist, WQP, NHD/GNIS, web). No contact with agencies/businesses/authors/anglers. Wayback Machine was offline during this pass (noted where it blocked a lane).

## Reach definition

- **Official GNIS name: "Big Bigby Creek"** (GNIS lists it in Lewis AND Maury counties; there is **no plain "Bigby Creek" in TN GNIS**). Locally, the main stem is often called "Bigby Creek" and its upper reaches "Big Bigby"; a 1954 USNM collection label reads "bigby creek, above pollution, near mount pleasant" (loose usage, same stream system). **Little Bigby Creek is a separate stream** (19.6 mi NHD length; joins the Duck at the west edge of Columbia; also East Fork Little Bigby, 5.5 mi). This three-way name collision is the main reach-match risk for any "Bigby Creek" record.
- **Length:** NHD large-scale flowlines: Big Bigby Creek 84 segments totaling **26.0 mi**; West Fork Big Bigby Creek **7.9 mi** (USGS NHD, hydro.nationalmap.gov/arcgis/rest/services/nhd/MapServer/6, query gnis_name).
- **Confluence:** joins the **Duck River in the Williamsport area at the Maury/Hickman line** (~Duck RM 109): verified two independent ways — (a) NHD small-scale geometry northernmost point (35.6516 N, -87.2469 W) sits inside a bbox where Big Bigby and Duck River segments intersect together; (b) USGS/WQP paired gage stations **USGS-03600440 "DUCK RIVER ABOVE BIG BIGBY CREEK NEAR RM109"** (35.6520, -87.2459) and **USGS-03601510 "DUCK RIVER BELOW BIG BIGBY CREEK NEAR RM109"**. An OSUM museum record labels a site "0.5 mi above [mouth of] sugar fork… / big bigby creek 0.5 mi above duck river, 2.8 mi SSW of Williamsport" (1981) — same geography.
- Course: rises near the Lewis/Maury line SW of Hampshire (S extent ~35.4508 N, -87.307 W), flows N/NE past Sandy Hook, Mount Pleasant (RM ~16.3), Needmore, Cross Bridges (RM ~4.7–5), to the Duck near Williamsport. Drainage at Mount Pleasant ≈ 26 sq mi (USGS 03601000).

## Sources (per source: fields, type, confidence, establishes/not)

### 1. TWRA 2026 trout stocking schedule (JSON, 616 rows)
- Title/org: TWRA 2026 Trout Stocking Schedule, tn.gov. Publication: current (2026). Observation dates: stocking dates 1/2026–12/2026. Retrieved 2026-09-24.
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json
- Fields: **No Maury row except McCutcheon Creek (rainbow, Winter: 1/23, 2/20, TBD 12/2026). No Lewis rows. No "Bigby" or "Swan" rows anywhere.** Neighboring program waters: Williamson (Harpeth R. @ Eastern Flank), Marshall (Big Rock Greenway), Hickman (Cane Creek, Mill Creek — seasonal rainbows), Lawrence (East Fork Shoal Cr., Little Buffalo R.).
- Does TWRA stock anything in the Duck basin? **Yes, exactly two programs:** (1) **McCutcheon Creek, Spring Hill, Maury Co.** (winter rainbow program — in the Rutherford Creek HUC10, ~25 mi NE of the Big Bigby mouth); (2) **Duck River tailwater below Normandy Dam** (Coffee/Bedford; "Normandy TW / Duck River", rainbow, months J/F/M/N/D; ArcGIS site rows "Dement Bridge / Second Bridge / Normandy Dam / Three Forks Bridge" — all Bedford Co.). **Nothing on the Duck mainstem in Maury/Lewis, nothing on Big Bigby.**
- Type: schedule. Confidence: high. Establishes: no 2026 program on this water; not by itself proof of no historical stocking.

### 2. TWRA ArcGIS trout stocking locations (master layer)
- Org: TWRA (services3.arcgis.com/PWXNAH2YKmZY7lBq). Retrieved 2026-09-24.
- URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/ArcGIS/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0
- Query `County='MAURY' OR County='LEWIS'`: **1 row total** — Mccutcheon Creek (Spring Hill, Region 2, Winter, rainbow, stream). Query `StreamName LIKE '%BIGBY%'` (and '%SWAN%', '%DUCK%'): **0 Bigby rows; 0 Swan rows; 4 Duck rows, all BEDFORD** (Normandy TW sites).
- Type: program GIS (authoritative master "Trout_MASTER_Project"). Confidence: high. Establishes: no trout stocking location on Big Bigby Creek in TWRA's current master layer.

### 3. USGS NAS (Nonindigenous Aquatic Species) occurrence API
- Org: USGS. Retrieved 2026-09-24. URL: https://nas.er.usgs.gov/api/v2/occurrence/search?state=TN&county=Maury&group=Fishes
- Maury Co. fishes (9 records): silver carp (2016, Duck R. at Columbia), grass carp (2019, Duck R. in Columbia), Luxilus coccogenis (1993, Duck R.), and **4 rainbow trout (Oncorhynchus mykiss) records dated 2021-01-23, HUC10 "Rutherford Creek", source iNaturalist** — i.e., the first winter of the McCutcheon Creek stocking program area, **not Big Bigby** (Big Bigby lies in Catheys Creek–Duck River / other HUC10s to the SW).
- Lewis Co. fishes: 2 records (Clupeidae, Catostomidae), **0 salmonids**; `species=mykiss/trutta/fontinalis` county queries: Maury 4/0/0, Lewis 0/0/0.
- Type: database (curated occurrence). Confidence: medium-high. Establishes: only trout occurrence in Maury Co. on record ties to the McCutcheon program; none on Big Bigby.

### 4. Museum collections via iDigBio (APSU, YPM, AUM, UMMZ, USNM, OSUM, INHS, MCZ, ANSP, CM, FMNH…)
- Org: iDigBio aggregation of vouchered collections. Retrieved 2026-09-24. URL: https://search.idigbio.org/v2/search/records/?rq={"locality":"Bigby","stateprovince":"Tennessee"} (451 Bigby records; 64 sites in Maury/Lewis)
- Dated, method-documented fish collections ON Big Bigby Creek proper and West Fork (survey-grade; most are full locality sets from collecting trips):
  - **1928-06-27 UMMZ** "near pleasant hill" (12 spp) — incl. Fundulus catenatus, Clinostomus funduloides, Cottus carolinae, Noturus exilis.
  - **1937-05 UMMZ** Stockard Branch / Dog Creek (incl. Cyprinella whipplei; Etheostoma luteovinctum).
  - **1954-10-20 USNM** "bigby creek, above pollution, near mount pleasant": Noturus elegans, N. exilis (label documents 1950s pollution awareness — Mt Pleasant acetate-plant era, predecessor issue of the later Zeneca/Celanese assessments).
  - **1989-08-21 AUM** at US43/Sandy Hook (18 spp incl. Micropterus dolomieu, M. punctulatus, Ambloplites rupestris, Lepomis spp.).
  - **1990-07-22 AUM** at US43/Sandy Hook (19 spp incl. Pomoxis annularis, M. dolomieu, M. punctulatus).
  - **1992-05-21 APSU** at Canaan (Cottus carolinae, Etheostoma flavum, E. rufilineatum, Fundulus catenatus) + **1992-07-23 APSU** at West Fork junction, Lewis Co. (16 spp incl. E. striatulum, Noturus exilis, Hybopsis amblops).
  - **1978-03-19 INHS** trib. W of Mount Joy (6 Etheostoma spp. + Fundulus catenatus); **1985 INHS** West Fork (Lewis).
  - **2001-05-02 & 2023-03-09 YPM** at Mount Joy Rd. below small dam (15 spp incl. Ichthyomyzon castaneus, Gambusia affinis).
  - **2008-06-15 YPM** West Fork at West Fork Rd/Mt Joy Rd, Lewis Co. (19 spp); **2014-06-25 YPM** same site (19 spp incl. Micropterus punctulatus, Erimystax dissimilis); **2015-05-23 YPM** (9 spp); **2022-07-19 YPM** at Hwy 99/412 (10 spp incl. Nothonotus rufilineatus); **2023-05-02 YPM** West Fork at Webb Williams Rd (Etheostoma striatulum).
  - Non-fish vouchers (mussels incl. Unio bigbyensis/Lampsilis fasciola, snails Elimia/Lithasia, crayfish Orconectes/Faxonius spp., 1969 USNM ostracods) confirm continuous sampling 1921–2023.
- **Aggregate ≈ 35 fish species across 1928–2023; ZERO salmonids on any reach, any decade.** Assemblage = classic warm/cool Western Highland Rim stream (darters, suckers, minnows, madtoms, sunfishes, smallmouth/spotted bass, sculpin).
- Type: survey (vouchered collection records; multiple method-documented trips). Confidence: high (multi-decade, multi-institution, upstream-to-downstream coverage incl. Lewis Co. headwater reach and Maury mainstem). **Weighted negative evidence: a broad, repeatedly repeated method-documented survey record omitting trout.**
- Note: "big bigby creek at us highway 43" 2016-12-05 record is Elimia (snail), not fish — no trout implied either way.

### 5. GBIF
- URL: https://api.gbif.org/v1/occurrence/search?taxonKey=204&decimalLatitude=35.44,35.68&decimalLongitude=-87.35,-87.05
- **0 fish records in the corridor** (also 0 for `waterBody=*Bigby*`, US). GBIF does not mirror APSU/YPM TN fish collections for this area → **coverage gap, NOT evidence of absence.** Type: database query. Confidence: n/a. Establishes nothing either way.

### 6. iNaturalist
- URL: https://api.inaturalist.org/v1/observations?swlat=35.44&swlng=-87.35&nelat=35.68&nelng=-87.05&taxon_id=47178 (Actinopterygii)
- **124 fish observations, 2017-06-13 → 2026-03-20**, ~30 taxa (Saffron Darter 23, Rainbow Darter 10, Fringed Darter 6, Duck Darter 6, Striped Shiner 6, spotted bass, Northern Studfish, Slackwater Darter, etc.). **No trout observations.** Type: crowdsourced (dated, photo-vouchered). Confidence: medium. Supports warmwater assemblage; single catches treated as LEADS only; no salmonid leads at all.

### 7. WQP (waterqualitydata.us) — TDEC/USGS stations & results
- URL: https://www.waterqualitydata.us/data/Station/search?countryCode=US&mimeType=csv&bBox=-87.35,35.44,-87.05,35.68 (208 stations; 53 Bigby-named)
- TDEC station families ON the creek: **TDECWPC-BBIGB004.7MY / 008.5 / 008.7 / 011.1 / 014.0 / 014.8 / 016.3** (RM 4.7–16.3) and **TDECWR_WQX-TNW000000148–157**, plus TNW000008053 (35.6498, -87.2422, near the mouth) and TNW000008404; West Fork: WFBB005.4LE/WFBBI005.4LS, TNW000006699/6700. USGS historic gages: 03600500 (Sandy Hook), 03601000 (near Mt Pleasant), 03601040/1050/1080/1098/1100/1170/1400/1500.
- Result checks (737 results at BBIGB008.5MY; per-station `sampleMedia=Biological Tissue` queries at all 7 listed stations): **all water chemistry; NO biological-tissue (fish-contaminant) results anywhere on the creek** — so the "TDEC tissue species" lane is empty (type distinct: chemistry-only monitoring).
- The TN Comptroller/TDEC "Evaluation of Regional Dissolved Oxygen Patterns" lists DO stations on Big Bigby (BBIGB008.5MY, 014.0MY, 016.3MY) — chemistry context only (found via web search; comptroller.aem.tn.extglb.tn.gov).
- Type: regulatory monitoring metadata. Confidence: high. Establishes: heavy agency presence, chemistry-focused; no fish-tissue record; biological macroinvertebrate (benthic) programs implied by 303(d) siltation listing but no public fish list located (TDEC biorecon PDFs not retrievable this pass — Wayback offline).

### 8. Regulatory / impairment labels
- **2016 draft 303(d) list: Big Bigby Creek (Maury Co., Duck River watershed) 1.17 mi impaired — "Loss of biological integrity due to siltation"** (warmwater Fish & Aquatic Life use). Type: regulatory label. Confidence: high (via NRC-hosted copy of TN 2016 draft 303(d), found by web search). Establishes warmwater FAL designated use; not a fish record.
- TDEC "Assessment of Big Bigby Creek, Receiving Stream of Zeneca Inc., Maury County" (~136 pp.) exists per web search — industrial-discharge assessment; not retrieved (Wayback offline; not on tn.gov index found this pass). LEAD only for further warmwater documentation.

### 9. Local/documentation (dated warmwater use)
- **Fishbrain** lists Big Bigby Creek as a fished water (appears in Fishbrain's Tennessee waters list adjacent to Little Swan/Big Swan entries; web search, 2026-09-24). No species list retrieved. Type: local crowdsourced. Confidence: low-medium. Single-water mention = LEAD only.
- riverable.com "Big Bigby Creek Fishing Report & Solunar Feeding Times" — generic app page (no observations). Confidence: very low.
- **TARP (TWRA Angler Recognition Program)**: one web-search summary claimed qualifying fish from Big Bigby Creek; a targeted follow-up search found **no verifiable TARP entry** (no species/size/date/URL). Treat as UNVERIFIED LEAD.
- Paddle/float outfits: none found on this creek.

## Contradictions / cautions
- Name risk: any "Bigby Creek" citation (incl. Columbia-town references) could mean this main stem, its upper "Big Bigby" reaches, or Little Bigby Creek — resolve per reach before use. GNIS contains only "Big/ Little/ West Fork Big Bigby".
- County risk: part of the stream (headwaters/West Fork) is in Lewis Co.; mouth is at the Maury/Hickman line — county-based records can be mislabeled.
- None of the datasets show any trout record for this water; the only Maury-Co trout occurrences (2021-01-23) are geocoded to the Rutherford Creek HUC10 (McCutcheon program).

## Searches run (incl. unproductive)
1. WebSearch `"Big Bigby Creek" Maury County fish OR biorecon OR TDEC OR watershed` → 303(d) + Zeneca assessment + comptroller DO stations (productive).
2. WebSearch TDEC biorecon Duck River 1996/97 fish IBI "Big Bigby"/"Big Swan" → no direct PDFs; TDEC 1990s watershed assessments not indexed (unproductive).
3. WebSearch `"Big Swan Creek" OR "Big Bigby" fishing report fishbrain OR smallmouth OR float` → Fishbrain/riverable/TARP leads (partly productive).
4. WebSearch TWRA TARP "Big Bigby Creek" → no verifiable entry (unproductive).
5. Wayback CDX for state.tn.us/tn.gov TDEC Duck watershed PDFs → **Internet Archive offline during pass** (blocked).
6. API/queries: TWRA schedule JSON; TWRA ArcGIS (2 queries); NAS (6 queries); GBIF (2 queries, 0 hits); iDigBio (2 queries, 451 records); iNat (3 queries); WQP (station + 8 result queries, incl. 2 invalid-parameter attempts; `characteristicType=Tissue` is not an enumerated value — use `sampleMedia=Biological Tissue`); NHD (5 queries incl. timeouts); GNIS (3 queries).
7. USGS NAS `/api/v2/species?...` and `/docs` paths 404 behind Cloudflare; working endpoint is `/api/v2/occurrence/search` (documented for reuse).

## Recommendation: **warmwater-focus**
Reasoning: (a) No trout program, stocking location, or occurrence record exists for this water in any dataset (2026 schedule; TWRA master stocking GIS; NAS 1937→2021 county records; GBIF; iNat 2017–2026; museum collections 1928–2023). (b) Repeated method-documented vouchered surveys across nine decades and both counties produce full species lists (~35 spp) with zero salmonids — weighted negative evidence. (c) The nearest in-basin trout programs (McCutcheon Creek winter rainbows; Normandy TW) are distinct waters ≥20 mi away, and Maury's only trout records geocode to the McCutcheon program area. (d) Habitat/warmwater assemblage and 303(d) warmwater FAL use are consistent with no trout management. Residual gaps: TWRA Region 2 internal survey files (not public), TDEC biorecon/305(b) fish tables (Wayback offline today), unverified TARP lead.
