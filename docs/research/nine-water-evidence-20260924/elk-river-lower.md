# Elk River — main stem, Prospect (Giles Co., TN) to TN–AL state line — trout/warmwater evidence log

Research date: 2026-09-24 (single pass; all retrieval dates = 2026-09-24 unless noted).
Scope: RESEARCH ONLY. No agency/business/angler contact. No catalog/website/ledger edits.
Kept STRICTLY separate from (a) Tims Ford tailwater immediately below Tims Ford Dam, (b) Fayetteville city ponds (Stone Bridge Park Pond — out of scope).

## 0. Reach definition and geography (verified this pass; corrects several task assumptions)

- **Tims Ford Dam is at (35.1969, -86.2786)** — Wikipedia "Tims Ford Lake" geocoordinate 35.19694; -86.27861 (retrieved 2026-09-24, https://en.wikipedia.org/wiki/Tims_Ford_Dam and https://en.wikipedia.org/wiki/Elk_River_(Tennessee_River_tributary)). The task's three "Elk River in Lincoln County" trout sites all sit within the upper ~14 river miles of the TAILWATER, flowing S/SW from the dam:
  - HWY 50 (35.1917, -86.2807) = TN-50 bridge at the dam (TWRA story map: "Highway 50 Bridge at the dam").
  - Farris Creek (35.1635, -86.3188) = ~9 river miles below dam.
  - Old Dam Ford (35.1239, -86.3324) = ~13.8 river miles below dam (OnWater lists Elk RM 119.2; "Dam Mile 13.8").
- **Elk River river miles:** dam ≈ RM 133 (Tennessee River Valley GeoTourism); Old Dam Ford ≈ RM 119.2; mouth at Wheeler Lake, AL (34.7614, -87.2656) per Wikipedia. The assigned reach (Prospect → state line) is the LOWEST few miles: **USGS gauge 03584600 "ELK RIVER AT PROSPECT, TN" (35.01424, -86.99466)** sits ~1.5 mi north of the line. Elkton is upstream of Prospect (USGS 03583270 at 35.0473, -86.8881). The reach passes Giles/Lincoln county line; crosses into Limestone Co., AL just south of Prospect/US-31 corridor.
- **Gauge ID corrections:** task's "03599000" is NOT the Elk (it is Big Rock Creek at Lewisburg, Duck River basin — USGS NWIS site query 2026-09-24). Correct Elk gauges: 03582000 (above Fayetteville), 03582400 (at Fayetteville), 03582500 (near Fayetteville), 03582630 (at Harms — the Harms Mill site), 03582690 (near Coldwater), 03583254 (at Morrell Mill), 03583270 (at Elkton), 03584500 (near Prospect), 03584600 (at Prospect), 03584601 (RR bridge at Prospect). HUCs: Upper Elk 06030003 (down to ~Elkton), Lower Elk 06030004 (Richland Creek side + Prospect→line). Task's "HUC 06030004" is right for the lowermost reach.
- I-65 crosses the Elk in Giles County just upstream of Elkton (Wikipedia, Elk River article: "It then crosses into Giles County, where it is bridged by CSX Transportation and Interstate 65 before flowing just south of Elkton, Tennessee, where it is bridged by U.S. Route 31"). Significance: TWRA's special brown-trout regulation reach "Tims Ford Dam to I-65 bridge" therefore spans nearly the whole lower main stem (Fayetteville → just above Elkton), but NOT the Prospect→state-line segment itself.

## 1. Trout stocking program evidence (TWRA)

### S1. TWRA_Trout_Stocking_Locations ArcGIS FeatureServer (re-queried 2026-09-24)
URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0/query?where=1%3D1&outFields=*&f=json
Full dump = 730 site features (mapped sites, not events). Elk-related rows:
- OBJECTID 653 "Old Dam Ford", Elk River, Region 2, LINCOLN Co., **StockingProgram "Winter"**, waterclass stream, Species "rainbow", NumStocked null, Management "TVA", lat_long 35.12393869,-86.332387036.
- OBJECTID 705 "HWY 50", Elk River, Region 2, LINCOLN, "Tailwater", brook_brown_rainbow, TVA, 35.191652575,-86.280740373.
- OBJECTID 706 "Farris Creek", Elk River, Region 2, LINCOLN, "Tailwater", brook_brown_rainbow, TVA, 35.163476811,-86.318785163.
- OBJECTID 663 "Stone Bridge Park", Stone Bridge Park Pond, LINCOLN, City of Fayetteville, "Winter", pond, rainbow, 600, 35.1447,-86.5691 (OUT OF SCOPE — city pond, not river).
Type: agency dataset (site-level). Confidence: high for what it says (sites + program label); it does NOT prove events occurred. **No stocking site exists anywhere on the Prospect→state-line main stem.**

### S2. TWRA "Tailwater_Trout" FeatureServer (retrieved 2026-09-24)
URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/Tailwater_Trout/FeatureServer/0/query?where=Name%3D%27Elk%20River%27&outFields=*&f=json
Row: Name "Elk River", Species "rainbow, brown, brook", Season "March through December", Dam "Tims Ford Dam". Line geometry: FIRST point (35.12327,-86.36029) [south end, ~2–3 mi below Farris Creek / above Old Dam Ford], LAST point (35.19705,-86.27957) [at the dam]. 176 vertices; Shape__Length 95171.7 (feet ≈ 18 mi of digitized channel).
Establishes: TWRA's own mapped trout water = dam → ~3 mi below Farris Creek ONLY. Everything downstream, incl. all of the assigned reach, is outside it.

### S3. TWRA Trout Fishing Forecasts (ArcGIS StoryMap) (retrieved 2026-09-24)
URL (redirect target of https://www.tn.gov/twra/fishing/trout-fishing-forecasts.html): https://storymaps.arcgis.com/stories/dbb92bdf718f4fd7839bf4b08fb82747
Underlying item data: https://www.arcgis.com/sharing/rest/content/items/dbb92bdf718f4fd7839bf4b08fb82747/data?f=json
Verbatim (Elk section "Tims Ford Tailwater (Elk River)"): "The Elk has only two public access points: Highway 50 Bridge at the dam and Farris Creek Bridge 9 miles downstream. Floating from the dam to Farris Creek takes all day but you'll be able to beat the crowds. **A third site a few miles further down, Old Dam Ford, has trout only in the winter.** Some anglers will launch at Farris Creek and take out at Old Dam Ford because the first 3 miles are still in trout water. Either paddle through the last 2 miles or **fish for smallmouth bass**."
Type: agency narrative. Establishes: (a) Old Dam Ford is on the TAILWATER and is a WINTER-only trout site (completed winter stockings implied as ongoing program practice); (b) below the trout line TWRA's own guidance says fish for SMALLMOUTH BASS. Webmap "Tailwater Trout Fishing Forecasts" (item 88816468379947f99fd6ab3d7ae5709e) embeds the same Tailwater_Trout + Stocking layers.

### S4. eRegulations.com Tennessee trout regulations page (2026-27 season; retrieved 2026-09-24)
URL: https://www.eregulations.com/tennessee/fishing/trout-regulations
Verbatim rows: Tailwater table: "Elk River | Tims Ford Dam | Rainbow, Brown, Cutthroat, & Brook | March through December". Special regs: "Elk River: Tims Ford Dam to I-65 bridge, including tributaries — Brown Trout: 20 inch minimum length limit, One (1) per day. Total daily creel limit of all trout species in combination is seven (7) trout."
Establishes: (a) stocking program = tailwater March–December (plus winter at Old Dam Ford per S1/S3); (b) a REGULATORY trout-water label extends dam → I-65 bridge (≈ to just above Elkton). Regulatory label ≠ presence (standard); no stocking site or program below HWY 50 except Old Dam Ford winter.

### S5. StockedTrout2016 FeatureServer (retrieved 2026-09-24)
URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/StockedTrout2016/FeatureServer/0/query?where=1%3D1&outFields=*&f=json
Same three Elk rows (collector "J. Spaulding"), Old Dam Ford already "Winter"/rainbow in the 2016 vintage → winter stocking at Old Dam Ford is not new (≥2016).
Note: the same service also contains a DIFFERENT "Elk River" (Carter Co., Poga, Region 4 spring streams) — a namesake; do not confuse.

### S6. TWRA current stocking schedule — machine-readable JSON behind the "Trout Stocking Schedule" tables (fetched 2026-09-24)
Sources (discovered in page config of https://www.tn.gov/twra/fishing/trout-information-stockings.html):
- https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json — 616 rows, cols REGION/COUNTY/LOCATION/TYPE/STOCKING DAY/STOCKING WEEK/STOCKING MONTHS/SPECIES.
- https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable.exceldriven.json — 10 upcoming events (incl. "Region 2 | Tims Ford TW | 09/10/2026").
Key rows (verbatim):
- {"REGION":"2","COUNTY":"Franklin/Moore","LOCATION":"Tims Ford TW / Elk River","TYPE":"Tailwater","STOCKING MONTHS":"M, A, M, J, J, A, S, O, N, D","SPECIES":"Rainbow, Brown Trout"} — NOTE: NO winter months in the tailwater row for 2025-26.
- {"REGION":"2","COUNTY":"Lincoln","LOCATION":"Stone Bridge Park","TYPE":"Winter","STOCKING DAY":"2/5/2026","SPECIES":"Rainbow Trout"} and a second row "TBD 12/2026" — the city pond (out of scope) is the ONLY Lincoln County WINTER entry.
- **95 TYPE="Winter" rows total; NONE is "Old Dam Ford" or any Elk River river site.** "Old Dam Ford" (0 hits in the JSON; 0 hits in page HTML) is absent from the current published schedule.
- Wayback CDX: winter-program news releases 2016-17 → 2025-26 exist (e.g. /twra/news/2019/12/3/2019-20-twra-winter-trout-stocking-underway.html, snapshot 20200126003842: "more than 40 locations... with emphasis in Region I and Region II... ~90,000 rainbow trout"). Archived 2019-20 page links only to the generic stockings page; per-season location lists live in the schedule table (now S6 JSON). 2024/12/13 release URL now 404 live.
CONTRADICTION (flag): site layer (S1: StockingProgram "Winter" since the 2016 dataset S5) + story map (S3: "has trout only in the winter") say Old Dam Ford is a winter trout site, but the current published 2025-26 winter schedule lists NO Old Dam Ford event/date. Completed winter stockings at Old Dam Ford therefore remain PLAUSIBLE BUT UNVERIFIED from public sources; TSAS/TWRA Region 2 event logs hold the settling record.
- TSAS export (1990–2016 coldwater) remains login-gated (prior pass) — records-request target, not used here.

## 2. Community/survey evidence (warmwater; support AGAINST trout in reach)

### S7. Spaulding, J. & M. Rogers. 2020. "Smallmouth Bass Population Characteristics and Minimum Length Limit Evaluation in Two Tennessee Rivers." J. Southeastern Assoc. Fish and Wildlife Agencies 7:33–40.
Journal page: https://seafwa.org/journal/2020/smallmouth-bass-population-characteristics-and-minimum-length-limit-evaluation-two
PDF: https://seafwa.org/sites/default/files/journal-articles/J7_04_Spaulding%20and%20Rogers%2033-40.pdf (as cited on journal page)
Sampling: boat electrofishing, May–June 2018; Elk River + Richland Creek (Elk's major tributary); smallmouth ages 2–9 (Elk), 1–11 (Richland); 74 Elk fish aged; growth/mortality/relative weight reported. Specific Elk sample river-miles not stated on landing page (PDF not text-extracted this pass — GAP).
Type: targeted single-species population study (TWRA-affiliated authors). Supports: active warmwater gamefish management of the Elk main stem; trout not part of that fishery. Does NOT by itself exclude trout (smallmouth-focused; other species not reported in abstract).

### S8. USFWS Harm's Mill Dam Removal project page (retrieved 2026-09-24)
URL: https://www.fws.gov/project/harms-mill-dam-removal
Harm's Mill Dam = "the only major barrier on the mainstem" Elk River, Lincoln Co. TN (i.e., ON the lower main stem west of Fayetteville — USGS gauge 03582630 "ELK RIVER AT HARMS" 35.1456,-86.6583). Page cites "46 species of greatest conservation need... including 19 [species of concern]" plus "139 other fish species" in the Elk River; primary species round hickorynut mussel (Obovaria subrotunda); $500k NFPP; TWRA project lead. Removal executed Oct 2025 (corroborated by WKRN 2025-10-13, TNC blog 2025-11-19, tn.gov news 2026-04-29, WPLN 2025-10-20).
Type: agency project page; species counts sourced from TWRA/NatureServe-type data. Supports: the lower Elk main stem is managed/discussed purely as a warmwater + imperiled-species river (46 SGCN + 139 other fish; NO trout mentioned anywhere in project materials). No species list published on the page.

### S9. USFWS Biological Opinion, Harms Mill Dam Removal (2022-0071594; signed 2023-09-12; 70 pp) — PRIOR PASS IN HAND; reconfirmed via search
Search snippets (2026-09-24): formal consultation initiated 2023-07-18 with USACE; boulder darter (Etheostoma wapiti) current distribution incl. "the lower 2.1 miles of Richland Creek" and mainstem Elk from Wells Creek downstream into Alabama. No trout inventory. (Full PDF on fws.gov — direct object URL not yet pinned this pass.)

### S10. WPLN (Nashville Public Radio), 2025-10-20: "Shock conservation: Keeping the boulder darter out of harm's way..." (headline per search snippet)
Biologists electrofished at Harms Mill Dam ahead of the Oct–Nov 2025 removal to relocate boulder daters. Targeted capture (not a community list). On-reach activity 2025. URL pending precise slug.

UPDATE (URL confirmed): https://wpln.org/post/shock-conservation-keeping-the-boulder-darter-out-of-harms-way/ — Tasha A.F. Lemley, 2025-10-20. Conservation Fisheries (Andrew Zimmerman) + TWRA electrofished federally endangered boulder daters ahead of removal; "removed boulder darters will be bred and then returned once the Elk River flow has returned to normal"; removal reconnects "more than 1,100 miles of stream"; "19 federally protected species" in the river per article. No trout mentioned.

### S11–S13. Occurrence databases (queried 2026-09-24)
- **USGS NAS (Nonindigenous Aquatic Species) API v2** (https://nas.er.usgs.gov/api/v2/occurrence/search?state=TN&limit=5000; 3,158 TN records screened): NO Salmonidae records in Lincoln or Giles counties. BUT one literature record: **Oncorhynchus mykiss, "Elk River, Fayetteville, TN", Lincoln Co., 1992-08-15, status "stocked", HUC12 Lees Creek–Elk River (060300030706), coords 35.143494,-86.567287 (map-derived, "Accurate"), source = Boschung, H.T. 1992. Catalog of freshwater and marine fishes of Alabama.** Type: single literature-derived record. Per standards this is a LEAD ONLY: could reflect tailwater/stocking context, an AL-catalog transcription, or a small historic put-and-take at Fayetteville; no voucher, no corroboration found. County-level 1939 Kuhne records ("Franklin Co. established"; "Moore Co. stocked") are upstream counties, out of reach.
- **iNaturalist API** (bbox 34.95–35.35N, -87.6–-86.05): 23 rainbow trout observations, ALL on the tailwater (Belvidere/Farris Creek 35.1608,-86.3198; Vanzant Bend Rd = HWY 50 35.190–35.191,-86.281; Estill Springs above dam) or off-reach (David Crockett SP, Shoal Creek drainage, stocked pond; one research-grade 2025-08-05 record at 35.0166,-86.39 obs 338972098 ≈ 15 km from the main stem — not on the Elk; likely pond/released). ZERO trout observations on the Prospect→line main stem. Brown trout: 1 obs (HWY 50 tailwater). Brook: 1 (HWY 50).
- **GBIF** (API, screened all TN Oncorhynchus mykiss 451, Salmo trutta 82, Salvelinus fontinalis records within lon -87.7..-86.0/lat 34.85..35.45): matches cluster ONLY at tailwater (HWY 50/Farris Creek) + off-reach sites; one 2026 Salmo trutta at 35.1899,-86.2813 (tailwater). GBIF locality="Elk River" + stateProvince=Tennessee + Actinopterygii: 0 records (museum collections of the Elk not in GBIF — GAP).
- **Sanity checks:** smallmouth Micropterus dolomiu iNat bbox = 20 obs (sparse, mostly off-river); GBIF/iNat coverage of the reach is thin — non-detection here is weak alone, but the TWRA/ArcGIS + agency materials carry the question.

### S15. TVA — Tims Ford reservoir/tailwater pages + USGS 03580750 (retrieved 2026-09-24 via search snippets; tva.com)
- TVA Tims Ford page (https://www.tva.com/.../tims-ford): "TVA monitors water temperatures in the Elk River closely so that it can adjust the operation of Tims Ford Dam to protect a wide diversity of aquatic life." TVA "hot/cold" release operations manage downstream temperatures FOR the endangered boulder dater / warmwater community — i.e., coldwater is deliberately NOT extended far downstream (On The Fly South: warmwater management to protect darters near Fayetteville limits the cold water; trout water ≈ 12 mi).
- USGS realtime station 03580750 "Elk River below Tims Ford Dam" monitors temperature (waterdata.usgs.gov).
- Establishes the physical mechanism: winter-cold/coldwater trout habitat effectively ends in the upper tailwater; the Prospect→line reach (~100 river miles below the dam) is seasonally warm — warmwater habitat.
- TVA "Preserving Life on the Elk River" story (tva.com) — boulder dater conservation; not fetched in full (JS-heavy).

## 3. Water-quality / monitoring stations on the reach (no trout data)### S14. EPA Water Quality Portal (waterqualitydata.us), queried 2026-09-24
- HUC 06030003 stations incl. USGS gauges listed in §0; TDEC stations ON the main stem: TDECWR_WQX-TNW000002169 (35.1502,-86.649, near Harms), TNW000009043 (35.1308,-86.6651), TNW000002168 (35.099,-86.7424, near Coldwater), TNW000008635 (35.046,-86.8897, at Elkton), legacy TDECWPC-ELK064.0LI (35.099,-86.7424).
- Result queries with characteristicType=Biological at those stations: 0 fish results (only chlorophyll-a at legacy station). WQP "bio" portal endpoint: 404 (retired/moved). TDEC fish-community (IBI) data are NOT in WQP — TDEC report PDFs remain the public route (unfetched this pass).
- HUC 06030004 (Lower Elk): USGS-03584500 "ELK RIVER NEAR PROSPECT", USGS-03584600/03584601 at Prospect; EPA NARS sites only on the AL side (out of reach); ADEM ELKL stations AL only.

## 4. Contradictions / clarifications found
- **Old Dam Ford winter status:** site layer (S1) + story map (S3) tag it "Winter"/"trout only in the winter", but the current 2025-26 published schedule JSON (S6) contains NO Old Dam Ford row (only tailwater rows for "Tims Ford TW / Elk River", Mar–Dec, and the Stone Bridge Park city pond). Treat "winter stocking occurs at Old Dam Ford" as program-intent evidence, not a verified completed event for recent seasons.
- Task hint "gauge 03599000 Elk River near Prospect" is WRONG (03599000 = Big Rock Creek at Lewisburg, Duck basin). Correct: 03584600 "ELK RIVER AT PROSPECT" (35.0142,-86.9947).
- Task hint "HUC 06030004" is right only for the lowermost segment (Prospect→line + Richland side); most of the lower main stem (Fayetteville→Elkton) is 06030003.
- On The Fly South article places "TN Highway 50 bridge 0.3 mile below the dam" and "Old Dam Ford 14 miles below the dam ... below the end of year-round trout water" — CONSISTENT with TWRA data once the dam coordinate (35.1969,-86.2786) is used; earlier coordinate-based guess that the dam was at -86.37 was wrong.
- TWRA county label "LINCOLN" on all three tailwater sites is consistent: the tailwater flows SW from the dam into Lincoln Co. toward Fayetteville; all sites remain in the tailwater corridor, NOT near Fayetteville city or downstream.
- NAS 1992 "Elk River, Fayetteville, TN" rainbow record (status "stocked") vs absence of any TWRA stocking site at Fayetteville: unresolved single-record lead (could be tailwater context mapped oddly, or historic local stocking; Boschung 1992 is an Alabama catalog, so the record's TN locality treatment is secondhand).

## 5. What this reach IS, per every agency source found
Warmwater + imperiled-species river: boulder dater (Etheostoma wapiti) mainstem, 46 SGCN + 139 other fish species (FWS), smallmouth bass fishery (TWRA/JSEAFWA), US-31/I-65 paddling corridor (Elk River Blueway), Harm's Mill dam removal 2025 for fish passage. TWRA's own trout narrative directs anglers to smallmouth below the trout line. No trout stocking site, no trout survey, no fish-community list including trout, no credible observation on the Prospect→state-line main stem.

## 9. Searches run (2026-09-24) — WebSearch queries + direct API/fetch lanes
Productive:
1. "Old Dam Ford" Elk River Tennessee fishing → boat ramp RM 119.2, tailwater access.
2. TWRA winter trout stocking schedule Tennessee waters list → 2025-26 news exists; eRegulations schedule.
3. Elk River tailwater trout Tims Ford Dam miles downstream Highway 50 Kelso → ~15 mi trout water; Kelso hub (NOTE: Kelso articles conflate HWY 50-at-dam with Kelso area; verify distance claims — on-the-fly south says 12 mi, geo-tourism 15 mi).
4. TWRA "winter trout" stocking "Old Dam Ford" — (rate-limited, superseded by S3 story map quote).
5. boulder dater Etheostoma wapiti Elk River survey five-year review USFWS → 5-yr reviews 2006/2017/2023; CFI+TVA surveys.
6. TDEC Elk River watershed biological monitoring fish species 06030002 → 303(d) lists; TTU smallmouth study surfaced.
7. Bettoli/Spaulding smallmouth Elk River Richland Creek → S7 paper.
8. "boulder darter" "5-Year Review" pdf → ECOS + S3 bucket docs.
9. Fishbrain "Elk River" Tennessee species → Taft TN water page: rainbow trout (7), smallmouth (5), largemouth (5) — see GAP note.
10. "Elk River" Tennessee fishing report Fayetteville/Elkton/Prospect → warmwater reports; striped bass/catfish/largemouth mentions.
11. "Smallmouth Bass Population Characteristics" Spaulding → journal page + PDF located.
12. "Harms Mill" biological opinion fws.gov → BO confirmed (2023-09-12, 70 pp).
13. TWRA winter trout 2025-2026 list locations → tn.gov news Dec 31 2025; NewsChannel 9 schedule article.
14. wpln boulder dater Harms Mill electrofishing → S10 story (Oct 20, 2025).
15. "Dam's Removal Provides Great Benefits for Elk River" → tn.gov news (Apr 29, 2026) + WKRN (Oct 13, 2025) + TNC (Nov 19, 2025).
16. "Old Dam Ford" trout stocking winter → geo-tourism access list (Old Dam Ford, Edde Bend Rd, Shiloh Bridge, Stump Shoals) + story-map "trout only in the winter" snippet.
17. Spaulding Rogers JSEAFWA volume → vol 7:33-40 (2020).
Direct API/lane fetches: TWRA ArcGIS services list; TWRA_Trout_Stocking_Locations full dump; Tailwater_Trout geometry; StockedTrout2016; BoatAccessMay2018 (no Elk rows returned); USGS NWIS site queries (03599000, 03584600, county scans 47055/47103, bbox scan); GBIF (trout 3 spp + Actinopterygii locality="Elk River"); iNaturalist bbox (trout + M. dolomiu); USGS NAS API (TN full pull, Lincoln/Giles filter); WQP Station (HUC 06030003/4) + Result probes; ArcGIS StoryMap item data + webmaps; Wayback CDX (twra trout pages; winter-trout news 2016–2025; r-winter-trout-stocking.html); Wikipedia Elk River + Tims Ford Dam/Lake pages; eRegulations trout-regulations (2 targeted fetches); FWS project page; TWRA fishing.html link extraction; tn.gov/twra/fishing/trout-information-stockings.html.
Unproductive / blocked:
18. DuckDuckGo HTML search (bot-walled — no results).
19. Bing RSS with site: operator (irrelevant results).
20. WebFetch nas.er.usgs.gov/api/ docs (403).
21. Wayback CDX first attempt (504) — retried OK.
22. GBIF museum locality "Elk River" TN fish — 0 records (collections GAP).
23. WQP bio portal /bio/Station — 404 (endpoint moved).
24. TDEC fish data via WQP — none (characteristicType=Biological empty at reach stations).
25. ECOS species page scraping (JS-rendered; species profile content not extractable).
26. seafwa.005.neoreef.com legacy PDF host (link rot; PDF retrieved via seafwa.org page listing only; PDF text not extracted this pass).
27. tn.gov schedule JSON discovered and fetched (two exceldriven.json feeds) — DECISIVE for current winter-program contents (see S6).
28. TVA Elk/Tims Ford tailwater monitoring search — tva.com temperature-management statements (S15); USGS 03580750 located.
29. tennesseerivervalleygeotourism.org "Trout Fishing on the Elk River" exact-URL probes — 404s; article known only via search snippets (access list incl. Old Dam Ford/Edde Bend/Shiloh Bridge/Stump Shoals; "trout hold ~15 mi").
30. fishbrain.com Elk River "Taft, TN" water page — direct URLs 404 / app-gated; snippet evidence only: rainbow trout (7 catches), smallmouth (5), largemouth (5) on the "Elk River — Taft" water (Taft is SE Lincoln Co. near the line). Fishbrain water polygons are large; pins unverifiable without the app — LEAD ONLY, flagged INTERNAL RESEARCH, never for production/display.
31. "Old Dam Ford" winter completed-stocking news search — no dated completed-stocking record found publicly (schedule JSON shows no 2025-26 Old Dam Ford row).

## Remaining gaps (who likely holds the settling record)
- **TWRA Region 2 / TSAS** coldwater stocking export (1990–2016) + winter-program event logs: would settle whether/when completed winter stockings occurred at Old Dam Ford (and whether any Fayetteville-area river stocking ever happened). Records request to TWRA Fisheries (Region 2, Nashville) via TSAS data.
- **TWRA story map "Old Dam Ford" forecast text** (S3) is the current program statement; annual winter schedules on tn.gov/twra news (2016-17 → 2025-26) list specific sites each season — confirm Elk/Old Dam Ford row appears in a given season's list.
- **TDEC** Elk River watershed monitoring/biorecon or 305(b) fish lists (TDEC DWR, Nashville) — would provide a full species list for the reach if any fish IBI stations exist.
- **USFWS BO PDF** (full text) — may contain reach-scale species enumeration from 2021–2023 surveys.
- Fishbrain water page "Elk River — Taft, TN" shows rainbow trout catches — needs manual verification of pin locations (likely tailwater; Fishbrain waters span large polygons). INTERNAL RESEARCH ONLY.

## RECOMMENDATION
**Warmwater-focus** for the Prospect→state-line main stem (with the upstream Fayetteville→Elkton corridor likewise warmwater-managed, subject only to a nominal regulatory brown-trout rule to the I-65 bridge). Grounds: (1) no TWRA trout stocking site exists below the tailwater (all 3 sites within upper ~14 RM; Old Dam Ford = winter-only tailwater site); (2) TWRA's own tailwater trout line and story map end the trout water miles above Old Dam Ford and direct anglers to smallmouth below; (3) the reach's agency profile (Harm's Mill BO + Oct 2025 dam removal, dater surveys by CFI/TWRA/TVA, "46 SGCN + 139 other fish species") is entirely warmwater with zero trout mentions; (4) occurrence databases (iNat/GBIF/NAS) show trout only on the tailwater, none on the reach; (5) TVA deliberately constrains cold releases to protect the downstream warmwater/SGCN community; (6) only counter-evidence anywhere is a single 1992 literature "stocked" rainbow record at Fayetteville (NAS/Boschung), the regulatory label to I-65, and unresolvable Fishbrain pin data — all insufficient under the evidence standards.
Classification for the map: **warmwater**. If the catalog tracks trout-program metadata, record: "Tims Ford tailwater trout program (dam→~RM 119; Old Dam Ford winter-only per TWRA site layer/story map, though absent from the current published winter schedule); NO trout program on the Prospect→state-line main stem; special brown-trout regulation nominally applies Tims Ford Dam to I-65 bridge."
