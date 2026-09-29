# Research log — FALLING WATER RIVER (Putnam/White/DeKalb Co., TN; Cookeville → Burgess Falls SP gorge → Center Hill Lake)

Water: Falling Water River (46.8 mi; rises W of Monterey, Putnam Co.; HUC10 0513010807 "Falling Water River" with HUC12s Upper/Middle/Lower FWR + Cane Creek + Taylor Creek; empties into Center Hill Lake). Ledger state entering pass: limited / warmwater-focus (bank-and-pier bass/bream at Burgess Falls SP reach). OPEN QUESTION: any trout, esp. upstream of Burgess Falls gorge near Cookeville.
Retrieval date for all sources: 2026-09-24 (America/Chicago). Research only; no agency/business contact made.

## A. Trout stocking lane (Q1)

### A1. TWRA Trout Stocking Locations — live ArcGIS FeatureServer (TWRA open data)
- Title/org: "TWRA_Trout_Stocking_Locations", TWRA ArcGIS Online org (services3.arcgis.com/PWXNAH2YKmZY7lBq).
- URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/ArcGIS/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0/query
- Retrieved 2026-09-24 (curl, JSON). Fields: Site_Name, StreamName, Region, County, City, StockingProgram (Spring/Winter/Reservoir/Tailwater), WaterClass, Species, NumStocked, Management, hours/access fields.
- Queries run:
  - `County='PUTNAM'` → 2 features: (1) Cane Creek Park / Cane Creek Lake, Cookeville, 36.16233, -85.54191 — pond, Winter program, rainbow, 5000 cap, Management=City; (2) Happy Hollow / Caney Fork River, Buffalo Valley, 36.13161, -85.80726 — stream, Tailwater, brook_brown_rainbow, Management=TWRA. **No Falling Water River site.**
  - `County='WHITE'` → 1: Calfkiller River "S2" (Spring, rainbow, Private Land). `County='JACKSON'` → 0. `County='DEKALB'` → 4: Pine Creek x2 (private), Caney Fork tailwater x2 (Long Branch + Buffalo Valley rec areas, USACE).
  - `UPPER(StreamName) LIKE '%FALLING%'` (statewide) → **0 features**. Neither Falling Water River (Putnam) nor Falling Water Creek (Rhea) appears anywhere in the TWRA trout-site inventory.
- Method/type: agency site inventory (the dataset behind TWRA's public trout-stocking dashboard). Confidence: HIGH (direct agency GIS).
- Establishes: No TWRA trout stocking site exists on the Falling Water River main stem or anywhere in Putnam outside the two sites above. Does NOT by itself prove zero undocumented/private releases.
- Traps flagged: "Cane Creek" (Putnam) row = city pond at Cane Creek Park, a different water from the FWR main stem (Cane Creek joins FWR *below* Burgess Falls — see C3); "Happy Hollow" = Caney Fork tailwater, not FWR.

### A2. TWRA trout stocking schedule page (human page) — 2025 snapshot via Wayback
- Title/org: "Trout Information & Stockings", TWRA (tn.gov).
- URL: http://web.archive.org/web/20250324085906/https://www.tn.gov/twra/fishing/trout-information-stockings/ (snapshot 2025-03-24; retrieved 2026-09-24).
- Content checked: "2024-2025 Winter Trout Stocking" + "2025 Trout Stocking" tables (waterbody lists by date block).
- Findings: text search = 0 hits for "Falling Water", "Putnam", "Burgess", "Cookeville", "Cane Creek Park", "Happy Hollow". "Caney Fork" appears once (tailwater catch-and-release regulation text). "Cane Creek" hits = east TN creek + "Cane Creek (Fall Creek Falls STP)" — neither is Putnam.
- Type: agency schedule (schedules ≠ completed, and this is a 2025 snapshot). Confidence: MEDIUM-HIGH as corroboration of A1.
- Establishes: 2024-25 winter + 2025 spring schedules contained no Falling Water River water (and no Putnam site at all).

### A3. TWRA 2026 schedule JSON (exceldriven datatable) — NOT RETRIEVABLE
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json
- Attempts 2026-09-24: plain curl (blocked), browser-UA curl (conn reset), WebFetch x2 (ECONNRESET), web_reader (500 network error), Wayback (JSON path not archived). LIVE page also blocked to all fetchers.
- Status: documented inaccessible this pass; live ArcGIS layer (A1) is the underlying site inventory for the same program, so the negative stands on A1+A2. Not completed: row-level 2026 confirmation.

## B. Survey / species-list lane (Q2)

### B1. USGS Nonindigenous Aquatic Species (NAS) v2 API — Putnam & Jackson counties
- Org: USGS NAS (nas.er.usgs.gov), MARIS/BISON-fed.
- URLs: https://nas.er.usgs.gov/api/v2/occurrence/search?state=TN&county=Putnam ; .../county=Jackson
- Retrieved 2026-09-24 (curl, JSON). Local data copies: fwr_data/nas_putnam.json, nas_jackson.json.
- Putnam (12 records): Threadfin shad 1975 (Center Hill Res.); **Micropterus coosae (Redeye Bass s.l.) "upper part of Falling Water River," 1993, status established, 36.1336, -85.4311 (map-derived, approximate), ref: Etnier & Starnes 1993, The Fishes of Tennessee**; brittle waternymph 1993; **Salmo trutta (Brown Trout) "stocked" x6 (2000, 2001, 2005, 2006, 2007, 2008), each "[No locality description provided by MARIS]," coords 36.13-36.14 / -85.8, HUC10=Caney Fork River 0513010809, HUC12=Center Hill Lake 051301080905 or Indian Creek 051301080904, source "TWRA Fish Data via BISON/MARIS"**; Corbicula fluminea 2010 "Falling Water River, Burgess Falls Dam"; alligatorweed 2022; Brazilian waterweed 2024.
- **Watershed trap resolved:** all 6 Putnam Brown Trout records geocode to the Caney Fork River / Center Hill HUCs (lon ≈ -85.8), i.e., Center Hill tailwater stockings, NOT the Falling Water River HUC (0513010807). No trout record is assigned to any Falling Water HUC.
- Jackson (2 records): Redeye bass (Roaring River, 1952); water-cress 1997. No trout.
- Type: agency-curated occurrence database (literature/agency-fed). Confidence: HIGH for what it contains; MEDIUM for absence (county-level, not reach-level).
- Establishes: The only trout rows in Putnam county-level data are tailwater stockings in a different watershed; only named FWR fish record is warmwater redeye bass in the upper river.

### B2. iDigBio / university fish-collection (TU = Univ. Tennessee, Etnier collection) vouchered samples
- URL: POST https://search.idigbio.org/v2/search/records/ with rq recordset=4fecde59-9f59-44eb-ab6f-4a50b4ed85cf, locality fulltext "falling water". Retrieved 2026-09-24. Local copy: idigbio_tu_fwr.json.
- FWR-relevant specimens (site "falling water cr., trib. of caney fork r., on secondary road 1.6 mi. from rt. 142, 7.2 mi. s of cookeville", White Co.): Lepomis macrochirus, Micropterus salmoides, Notropis telescopus, Rhinichthys atratulus — a multi-species site sample with **no Salmonidae**. Also Dorosoma petenense "caney hollow beach, falling water section, Center Hill resv." (Putnam). Other "falling creek/river" hits are VA/KS/etc. (excluded).
- Second query: rq {family: Salmonidae, county: Putnam, stateprovince: Tennessee} → **itemCount: 0**. Local copy: idigbio_salmon_putnam.json.
- Type: museum-vouchered occurrence (method-documented collections). Confidence: HIGH per record; MEDIUM for the negative (the UT collection holds few FWR samples, ca. 1970s era).
- Establishes: Weighted NEGATIVE — a full-assemblage site sample on the river with no trout; zero trout vouchers county-wide in digitized collections.

### B3. GBIF occurrence search (incl. iNaturalist-mediated records)
- URL: https://api.gbif.org/v1/occurrence/search?taxonKey={8215487 Salmo trutta | 5204019 Oncorhynchus mykiss | 2351271 Salvelinus fontinalis}&decimalLatitude=35.9,36.45&decimalLongitude=-86.05,-85.2
- Retrieved 2026-09-24. Local copies: gbif_*.json outputs inline.
- Findings: 67 brown / 9 rainbow / 4 brook records in the box; **every one clusters at lon -85.78 to -85.95** (Caney Fork tailwater below Center Hill Dam and Rock Island area), dominated by MARIS "stocked" rows and iNat research-grade angler photos 2013-2025. **Zero trout east of -85.65**, i.e., none anywhere in the Falling Water River corridor (Burgess Falls is -85.59; Cookeville -85.50; Monterey -85.28).
- Type: aggregated occurrence database. Confidence: HIGH.
- Establishes: the nearest trout populations are tailwater fishery fish in the adjacent Caney Fork valley, separated from the FWR corridor by Center Hill Lake and its headwater embayments.

### B4. iNaturalist (API) — corridor bounding boxes
- URLs: https://api.inaturalist.org/v1/observations?taxon_id=47520 (Salmonidae) nelat=36.35 nelng=-85.25 swlat=35.95 swlng=-85.75 → **total_results: 0**.
  - taxon 47178 (Actinopterygii) Burgess Falls SP bbox (36.02-36.08 N, -85.66 to -85.58): 27 obs — Micropterus dolomieu, Moxostoma/Carpiodes/Minytrema, Etheostoma blennioides/caeruleum, Cyprinella galactura, Campostoma oligolepis, Lepomis cyanellus, Gambusia affinis, Catostomus commersonii, Aplodinotus grunniens, Cyprinus carpio (incl. 2026-09-19 smallmouth at park; several obs "Cane Creek, Baxter"/"Window Cliffs" = below-falls Cane Creek). **No salmonids.**
  - taxon 47178 upper-river/Cookeville bbox (36.05-36.30 N, -85.62 to -85.30): 193 obs — **Micropterus coosae is #1 (17 obs)**, plus bluegill, smallmouth, spotted bass, Etheostoma spectabile/lawrencei/caeruleum/etnieri/olivaceum, Fundulus, Hypentelium, Cottus carolinae, Nothonotus sanguifluus, Cyprinella galactura etc. **No salmonids.**
- Type: community science (research-grade + casual). Confidence: MEDIUM-HIGH for absence (heavy local observation pressure in Cookeville area).
- Establishes: strong weighted negative + independent corroboration of the Etnier & Starnes upper-river redeye bass record.

### B5. EPA Water Quality eXchange (WQP) — TDEC/USGS stations on FWR
- URLs: https://www.waterqualitydata.us/data/Station/search?mimeType=csv&statecode=US:47&countycode=US:47:141 ; Result/search for TDECWPC-FWATE008.7PU, TDECWPC-FWATE031.6PU, TDECWR_WQX-TNW000002554, and a multi-station Biological-type query (siteid list of FWATE005.2/008.7/010.5/028.4/031.6/038.3/046.1PU + TNW000002553-561).
- Retrieved 2026-09-24. Local copies: wqp_stations_putnam.csv, wqp_all_316.csv, wqp_bio_2554.csv (header-only), wqp_bio_all.csv (empty).
- Stations on the river: USGS-03422800 (FWR nr Algood, 36.14395, -85.42081); USGS-03423150 (FWR at Burgess Falls Dam, 36.04451, -85.59303); TDECWPC-FWATE005.2PU ("upstream from Cookeville boat dock, downstream from Peter Cave Branch"), FWATE008.7PU ("riffle area 100 yards upstream from Burgess Falls", 36.0439, -85.5961), FWATE010.5PU (hwy bridge above falls), FWATE028.4PU (Bob Barnett Rd under Pigeon Roost), FWATE031.6PU (Watson Rd d/s City Lake), FWATE038.3PU (Poplar Grove/Adams Acres), FWATE046.1PU (0.25 mi u/s Monterey STP); TDECWR_WQX-TNW000002553..2561 (same reaches incl. Burgess Falls Reservoir); USACOEND-3CEN20039 (Center Hill Lake FWR mile 10.0).
- Results content: FWATE031.6PU holds only 2004 water chemistry (DO, pH, cond., TSS, nutrients, metals — 33 rows, CharacteristicType None). TNW000002554 Biological query → 0 rows; multi-station Biological query → 0 rows. Consistent with ledger expectation: WQP "Biological" would be benthic-only, and in fact **no biological or tissue results are published in WQP for any FWR station**; certainly no fish.
- Type: agency monitoring data warehouse. Confidence: HIGH for what is published.
- Establishes: no trout (and no fish) data in the federal WQP warehouse for the river; documents that TDEC physical monitoring exists at 8 reaches incl. one 100 yd above Burgess Falls.

### B6. TDEC Caney Fork River Watershed Water Quality Management Plan (Revised 2003 DRAFT)
- Title/org: "Caney Fork River Watershed — Chapters 2/4/5/6/Appendices", TDEC Division of Water Pollution Control, 2003 (revised).
- URL (Wayback): http://web.archive.org/web/20180803112416/https://www.tn.gov/content/dam/tn/environment/water/watershed-management/wqm-plans/wr-ws_watershed-plan-caney-2003.pdf (254 pp.; retrieved 2026-09-24). Local copy: caney_2003.pdf. Mirror noted: comptroller.aem.tn.extglb.tn.gov hosts similar TDEC plans.
- Fields/pages: p.29-30 (NRI table — "Falling Water River. Clear, scenic stream: Burgess Falls"; attributes incl. FISH/WILDLIFE/GEOLOGIC); p.32 (monitoring site matrix); p.53-55 (HUC-10/12 characterization — 0513010807 = Upper/Middle/Lower Falling Water River + Cane Creek + Taylor Creek HUC12s); p.153 (Ch.5: USACE Nashville District **Feasibility Study for an aquatic ecosystem restoration project at Burgess Falls State Natural Area** — stabilize Burgess Falls Dam "to extend its function as a sediment control point"; dam has trapped extensive sediment); p.173/176 (voluntary restoration needs — bank vegetation on "upper portions of Falling Water River"; urban runoff to Pigeon Roost/FWR); p.186 (Table 6-6: Monterey WWTP discharges to unnamed ditch → FWR mile 46.1; **segment TN05130108045_3000, FWR, 11.2 mi, 1st on 303(d) list 1990, Fish & Aquatic Life NON-SUPPORTING; causes: nutrients/biological indicators, low DO; source: municipal point source**); p.233-238 (Appendix III: FWR segments _1000 8.8 mi [partial support, organic enrichment/low DO + siltation], _2000 21.3 mi, _3000 23.4 mi [habitat alteration, partial]); p.244 (station map legend: FALLI008.7PU "FWR @ RM 8.7", FALLI005.2PU "@ RM 5.2", FWATE010.5PU, FALLINGWATR46.1 "@ RM 46.1"); p.246-250 (NPDES/ASRA/AOW tables).
- Species content: **no fish species list, no trout mention anywhere**; impairment causes are classic warmwater stressors (siltation, nutrients, DO, habitat alteration). No coldwater-use designation appears for any FWR segment (Caney Fork tailwater coldwater standard is discussed only below Center Hill Dam).
- Type: agency watershed assessment/plan (TDEC 305(b)-derived). Confidence: HIGH.
- Establishes: TDEC's assessed profile of the river (through 2003) is entirely warmwater; documents biorecon-era station IDs (RM 5.2, 8.7, 10.5, 46.1) whose underlying benthic sheets are not in WQP — candidate record holders for any full taxa lists.

### B7. Academic lane (Crossref + search)
- Crossref query "Falling Water River Tennessee": two GSA Abstracts with Programs — "Evaluating Effect of Land Usage on the Water Quality in Falling Water River Watershed, Cookeville Tennessee" (2019) and "Relationship between Human Activities and Changes in Water Chemistry: A case study of Falling Water River watershed, Cookeville" (2025). Both water-chemistry; no fish. A ResearchGate-indexed periphyton/phosphorus study referencing FWR + Pigeon Roost Creek surfaced in search results but full citation not retrievable this pass (rate limits).
- repository.tntech.edu: DNS failed (ENOTFOUND) — TTU theses lane unfinished. Historical note: the definitive FWR fish record in the literature remains Etnier & Starnes (1993) via B1.

## C. Burgess Falls as zoological barrier (Q3)

### C1. TDEC Burgess Falls State Natural Area brochure/page (archived)
- URL: http://web.archive.org/web/20140412211850/http://www.tn.gov/environment/natural-areas/natural-areas/burgess/na_burgess.pdf (+ page snapshot 20131012203456). Retrieved 2026-09-24.
- Text: the river drops over three waterfalls; the last "plunges more than 130 feet into the gorge"; bluffs of Mississippian Fort Payne Formation cherty limestone above Ordovician-Devonian units. (Page "trout" hits are trout-lily, a plant.)
- Establishes: physical geometry (≥130-ft vertical plunge + gorge). **No fish-passage or fish-assemblage statement** — the explicit agency statement requested does not appear in public SNA text.

### C2. Garver (engineering) — Burgess Falls Dam rehabilitation project page
- URL: https://garverusa.com/markets/development/projects/safety-issue. Retrieved 2026-09-24 (WebFetch).
- Facts: dam built 1921-22 by City of Cookeville (hydropower to 1944); 340 ft long, ~40 ft tall concrete gravity gravity structure immediately upstream of the falls; 1996 sluice-gate drawdown attempt abandoned (wetland harm + sediment flush risk to Center Hill Lake); USACE found safety deficiencies; Garver 1999 report, 2007-2010s fix ($1.4M, 34 post-tensioned anchors + grout curtain) to meet TN Safe Dam Standards **while retaining the dam and its sediment**.
- Establishes: the dam (40 ft) sits at the lip of the gorge above the ≥130-ft falls — a retained vertical barrier complex; river flow passes through sluice/dam crest directly into the falls. No fish discussion on page.

### C3. Wikipedia — Falling Water River; Burgess Falls State Park (fetched 2026-09-24)
- URLs: https://en.wikipedia.org/wiki/Falling_Water_River (WebFetch summary). Course: rises W of Monterey; Putnam-White-DeKalb; through City Lake and Burgess Falls Lake; into Center Hill Lake. Three falls below the dam, largest 136 ft. **Cane Creek joins the Falling Water River below the falls**; Window Cliffs SNA is on Cane Creek; Fancher Falls (80 ft) on Taylor Creek. No fish/fishing/barrier text.
- Establishes: (a) gorge sequence dam→3 cascades→Center Hill embayment; (b) the stocked Cane Creek Park pond sits hydrologically downstream of the gorge (separate tributary mouth reach), reinforcing the name-trap treatment.

### C4. Cumberland River Basin org — "Burgess Falls State Park" page
- URL: https://cumberlandriverbasin.org/start-here/burgess-falls-state-park/ (retrieved 2026-09-24 via WebFetch).
- Text: four waterfalls cascading over 250 ft total, main plunge "more than 130 ft"; anglers catch "largemouth and smallmouth bass, as well as bream"; "best fishing in the park is located below the dam main waterfall and at the park's fishing pier"; no boat access. **No trout mentioned.**
- Type: watershed NGO descriptive page. Confidence: MEDIUM.
- Establishes: the documented fishery is strictly the below-dam/piers reach and warmwater — matches ledger.

## D. Community evidence (Q4)

### D1. Fishbrain — Falling Water River water page
- URL: https://fishbrain.com/fishing-waters/9Q-6M9kA/falling-water-river (retrieved 2026-09-24 via WebFetch).
- Content: top species **Redeye bass (9 members), Rock bass (9), Smallmouth bass (7)**; recent catches incl. largemouth 15 in/2 lb (@toscano-joshua), rock bass 6 in (@YouTubeBassinTN), smallmouth 8 in (@YouTubeBassinTN). **No trout species listed for this water.** Related page: https://fishbrain.com/fishing-waters/vvkdQJpG/burgess-falls-lake (largemouth, bluegill, black crappie).
- Type: community catch log (commercial app). Confidence: MEDIUM-HIGH for absence (well-fished water).
- Establishes: community one-catch rule — the common local catches are bass/sunfish; nobody reports trout on the main stem. NOTE local-slang caution: "redeye" can mean rock bass; here both are reported separately.

### D2. Search-result summaries (regional platforms)
- PiscaMaps: FWR targeted for smallmouth/largemouth/spotted bass; walleye on record (via search summary 2026-09-24). onWater: LMB/SMB/bluegill/redear/rock bass/white crappie for the area (fetch of onwaterapp.com returned 403 — summary only).
- TWRA Region 3 trout note (chattanoogan.com, Dec 2004): Cane Creek Park, Cookeville — 10-12 in rainbows stocked, creel 7/day (Putnam's trout water, not FWR).
- UCBJ (Dec 2019): TWRA released ~2,000 rainbow trout into Cane Creek Park's 56-acre lake (Dec 11; follow-up Jan 22). Facebook (Feb 3, 2024): winter restock ~1,500 trout at Cane Creek Park. Reddit r/Fishing "Cane Creek Park Cookeville TN" (bass on senko).
- These confirm the ONLY established trout experience near Cookeville is the put-and-take park pond, and that local anglers' trout expectations route to Cane Creek Park or the Caney Fork tailwater — never the Falling Water River.

### D3. YouTube lane — unproductive
- Targeted searches (see log §E) found no dedicated videos for fishing the Falling Water River; the only Fishbrain informant tied to FWR (@YouTubeBassinTN) has no indexable channel hits. Falls/gorge video content is sightseeing/kayak, not catch reports.

## E. Searches run 2026-09-24 (WebSearch topics; + API/DB queries), incl. unproductive

WebSearch distinct queries (productive=P, unproductive/empty=U):
1. Falling Water River Tennessee fish species survey (P-partial) 2. Burgess Falls State Park fishing bass (P-partial) 3. TDEC biorecon "Falling Water River" Putnam County (+2 variants) (P-weak) 4. "Falling Water River" trout Tennessee (P: no trout hits) 5. Burgess Falls "fish" barrier/upstream species gorge (+3 variants) (U) 6. "Cane Creek" Putnam County trout stocking Cane Creek Park winter (P: name trap quantified) 7. "Tennessee Angler Recognition Program" "Falling Water"/"Burgess Falls" (U for FWR) 8. Burgess Falls OR Falling Water River fishing youtube bass (P: Fishbrain refs) 9. USACE Burgess Falls aquatic ecosystem restoration feasibility (+3 variants) (U-P: only via watershed plan) 10. reddit/forum Cookeville trout Caney Fork/Cane Creek (+2 variants) (P) 11. youtube Burgess Falls Tennessee fishing Falling Water River (U) 12. "Falling Water River" Tennessee smallmouth redeye fishing (P: Fishbrain/PiscaMaps/OnWater) 13. "Falling Water Creek" Rhea County fishing trout (U: junk results; distinct water confirmed different) 14. "Window Cliffs"/"Cane Creek" Putnam fish survey TTU/TWRA (P-partial; no survey found) 15. "Burgess Falls" dam fish passage/removal barrier (P: Garver, TNC dam-barrier context) 16. "Burgess Falls" dam sluice 1996 Garver (+3 variants) (P: Garver URL + TDEC park plan PDF ref) 17. "Falling Water River" TDEC 305(b)/303(d) aquatic life 2024/2022 (+5 variants, mostly rate-limited) (P-weak) 18. "Falling Water River" algal/phosphorus Pigeon Roost study (+4 variants) (U-P: ResearchGate hit, citation unrecovered) 19. Cane Creek Park Cookeville winter trout 2025/2026 (+3 variants, rate-limited) (U: covered by older sources) 20. "YouTubeBassinTN"/site:youtube.com Falling Water River (U).
API/database queries (all productive): TWRA ArcGIS services list; TWRA_Trout_Stocking_Locations (Putnam/White/Jackson/DeKalb + statewide '%FALLING%' streamname); USGS NAS v2 (Putnam, Jackson); GBIF species-match x3 + occurrence x3; iNaturalist taxa x2 + observations (Salmonidae corridor, Actinopterygii Burgess bbox, Actinopterygii upper-river bbox); WQP station CSV (Putnam) + Result queries x4; iDigBio x3 (fulltext, TU recordset, Salmonidae-Putnam); Crossref; Google Books; Wikipedia API x2; Wayback availability/CDX x5; archive fetches (TWRA 2025 page, Caney Fork 2003 plan, na_burgess.pdf/html, TWRA-JSON attempts).
Blocked/failed lanes: tn.gov direct (curl+WebFetch+web_reader all blocked); TWRA 2026 schedule JSON (A3); web_reader rate-limited on Wikipedia/TDEC; DuckDuckGo HTML endpoint (bot-block); repository.tntech.edu (DNS); onwaterapp.com (403); Garver old URL (404, superseded); comptroller mirror (not exercised for Burgess SNA); EPA ATTAINS (API key required).

## F. Contradictions and cautions
- NAS Putnam "Brown Trout stocked" rows could superficially be read as Putnam trout; resolved as Caney Fork tailwater by HUC fields (B1). Similar-looking GBIF MARIS rows geocode identically (B3).
- Local slang "redeye" (rock bass) vs true Redeye Bass: both present; iNat research-grade Micropterus coosae (17 obs) + Etnier & Starnes citation support the true species in the upper river.
- Summarizer-side claims during searches that FWR is "a recognized trout fishery" or that TWRA stocks Falling Water Creek (Rhea) are unsupported and were discarded; the TWRA site layer (A1) contradicts both.
- schedules ≠ completed: A2 is a 2025 snapshot; A3 (2026 rows) unverified — but A1 (live site inventory) is program-level and contains no FWR site.
- TDEC SNA brochure "trout lily" is a plant; not fish evidence.

## G. Recommendation
**warmwater-focus** (upgrade from "limited / warmwater-focus"; do NOT classify trout or seasonal-stocked).
Reasoning: (1) TWRA's live trout-site inventory contains no Falling Water River site statewide, and archived 2025 schedules list no Putnam site at all; the county's only trout is the Cane Creek Park city pond (below-falls tributary lake) plus Caney Fork tailwater access — different waters (A1-A3). (2) Every occurrence system with reach resolution — NAS ( watershed-resolved), GBIF, iNat, iDigBio — returns zero salmonids in the FWR corridor, while tailwater trout cluster just 10-15 km west beyond Center Hill Lake (B1-B4). (3) The method-documented negative evidence is real: a vouchered UT full-assemblage site sample (1970s) lists four warmwater species with no trout; TDEC's assessed reaches (RM 5.2/8.7/10.5/46.1) carry only warmwater impairment causes and no coldwater use; iNat's 220 fish observations across the corridor are all warmwater (B2, B4, B5, B6). (4) The gorge is a physical barrier complex (≥130-ft plunge + retained 40-ft dam at its lip), and the documented park fishery is bass/bream below the dam (C1-C4, D-lane). "Trout" would require a one-catch anecdote; none was found (Fishbrain explicitly lists no trout). "Seasonal-stocked" has no schedule basis whatsoever.

Key remaining gap: no reach-level TWRA/TDEC *fish-community* survey document for the FWR main stem was obtainable online (TWRA Region 3 stream files are not web-published; TDEC biorecon benthic sheets not in WQP). Likely record holders: (a) TWRA Region 3 (Cookeville office) stream fish sampling files; (b) TDEC DWR biological quarter benthic/taxa sheets for FALLI008.7PU (riffle 100 yd above Burgess Falls) and FALLI005.2PU; (c) USACE Nashville District Burgess Falls SNA aquatic ecosystem restoration Feasibility Study (cited in TDEC 2003 plan p.153) — its existing-condition aquatic sections would name the fish assemblage directly.
