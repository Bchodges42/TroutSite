# Duck River Tailwater (Normandy Dam tailwater), Bedford County, TN — Evidence Log

Water: Duck River below Normandy Dam (dam → Three Forks Bridge), Bedford/Coffee county line, TN
Ledger verdict under test: `seasonal-stocked-trout`, months [11,12,1,2,3,4,5,6] (Nov–Jun), YR FLAG SET (internally suspicious)
Retrieval date for all sources: 2026-09-25 (feeds captured 2026-09-24 UTC)

## Verdict summary

- Seasonal-stocked verdict CONFIRMED (put-and-take rainbow fishery).
- **YR FLAG FAILS — clear it.** Stocking is never continuous: published seasons are Nov–Jun (2018–2021, current webmap), Nov–Apr (2023–2025 PDFs), J,F,M,N,D (2026 JSON). More decisively, agency research (Bettoli/TWRA Fisheries Report 01-43) documents acute-lethal late-summer tailwater temperatures (27 C by late August; "few rainbow trout holdover from one year to the next") and explicitly recommends the river be "managed as a seasonal rather than year-round trout fishery."
- Ledger months [11,12,1,2,3,4,5,6] match the current TWRA webmap page ("November through June") but overstate recent practice: 2023–2025 schedules say Nov–Apr and the 2026 schedule says Jan–Mar + Nov–Dec.

## Per-source findings

### S1. TWRA ArcGIS Feature Service "Tailwater_Trout" (layer "TailwaterRiver")
- Org: Tennessee Wildlife Resources Agency (services3.arcgis.com org PWXNAH2YKmZY7lBq); undated live service (current as of retrieval 2026-09-25)
- URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/Tailwater_Trout/FeatureServer/0/query?where=1%3D1&outFields=*&f=pjson&returnGeometry=false
- Fields (Duck row, verbatim): OBJECTID 33 | Name "Duck River" | Species "rainbow" | Season "November through June" | Dam "Normandy Dam" | Shape__Length 47,459.66 ft (= 8.99 stream miles)
- Type: planned/schedule-layer evidence (agency webmap). Confidence: HIGH (matches KNOWN ledger row exactly).
- Establishes: rainbow trout only; published season Nov–Jun; reach length 47,460 ft. Does NOT establish: monthly stocking dates, fish numbers, holdover, year-round presence.

### S2. TWRA "Trout Fishing & Stockings" 2026 schedule JSON (planned)
- Org: TWRA; Published Time Thu, 24 Sep 2026 13:26:07 GMT (captured via r.jina.ai browser-context, local file schedule2026-jina.txt / trout_2026_live.json)
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json
- Row verbatim: REGION 2 | COUNTY "Coffee/Bedford" | LOCATION "Normandy TW / Duck River" | TYPE "Tailwater" | STOCKING DAY "" | STOCKING WEEK "" | STOCKING MONTHS "J, F, M, N, D" | SPECIES "Rainbow Trout"
- Type: planned schedule, destination-level. Confidence: HIGH.
- Establishes: 2026 planned stocking months = January, February, March, November, December (5 months; month-only, no dates). CONTRADICTS the ArcGIS "November through June" and the ledger's Nov–Jun: no Apr–Jun or Oct months planned for 2026.

### S3. TWRA Tailwater Trout Stocking Schedule PDFs (planned, archived captures 2018–2025)
- Org: TWRA; capture dates from wayback filenames (local copies in tmp/research/completion/scheds/ and root); text via pdftotext
- URLs (representative live form): https://www.tn.gov/content/dam/tn/twra/documents/Tailwater-Stocking-Schedule.pdf (captured e.g. web.archive.org/web/2018*, 2021, 2023–2025 snapshots; local: twsched-2018, tailwater-stocking-schedule-2020, twsched-20211124063518, twsched-20230224, twsched-20241204004432, twsched-20250902003646)
- Duck row by capture (verbatim, all "Duck River* | Normandy Dam | Rainbow Trout | <season> | Statewide Regulations"):
  - 2018 (twsched-2018): November through June
  - 2020 (tailwater-stocking-schedule-2020): November through June
  - 2021-11-24 (twsched-20211124063518): November through June
  - 2023-02-24 (twsched-20230224): November through APRIL
  - 2024-12-04 (twsched-20241204004432): November through APRIL
  - 2025-09-02 (twsched-20250902003646): November through APRIL
- Type: planned schedule, destination-level per publication year. Confidence: HIGH.
- Establishes: season was lengthened to Nov–Jun by 2018, then SHORTENED to Nov–Apr sometime between 2021-11 and 2023-02. No capture found for 2019–2020 and 2022 grid rows (cp-*/small-stream grids exclude tailwaters by design; noted gap).

### S4. Archived TWRA tailtrout.html web page (planned, 2010–2015 era)
- Org: TWRA; snapshots retrieved 2026-09-25 from Wayback Machine
- URLs: https://web.archive.org/web/20100529052424/http://tn.gov/twra/fish/StreamRiver/tailtrout/tailtrout.html ; .../20130110152939/... ; .../20150412195242/... (CDX listed snapshots 2010–2015; page gone by 2018, 404)
- Duck row (all three snapshots, verbatim): "Duck River (below Normandy Dam) — Rainbow, Brown — March through June, November through December". General notes: figures reference ~2001 (1.3M trout stocked in tailwaters in 2001); "most of our tailwaters hold trout year-round"; TWRA does not publish exact tailwater stocking dates.
- Type: planned schedule (era ~2001–2015). Confidence: HIGH.
- Establishes: earlier published season Mar–Jun + Nov–Dec with rainbow AND brown trout (6 months, both species). CONTRADICTS later rainbow-only Nov–Jun: brown trout discontinued in this fishery at some point between 2015 and 2018 captures.

### S5. Bettoli, P.W. — Normandy Dam Tailwater creel survey (completed/agency research)
- Author: Phillip W. Bettoli, Tennessee Cooperative Fishery Research Unit, Tennessee Tech; TWRA Fisheries Report 01-43, September 2001; submitted to W.C. Reeves, TWRA Chief of Fisheries
- Observation period: roving creel survey May 1 – Oct 31, 2000, Normandy Dam to Three Forks Bridge (15 river km); plus 1998 electrofishing
- URL (hosted by Duck River Watershed Education Center/"duckriveragency.org" annotated bibliography): https://duckriveragency.org/_assets_/plugins/Annotated%20Bibliography/NormandyTW2000CreelSurvey.pdf (valid PDF, verified live 200 OK; no text layer — extracted via r.jina.ai reader, content below from that rendering)
- Fields: catchable rainbow trout; 52,951 stocked Feb–Dec 2000 (35,954 during survey window); 20,089 angler-hours, ~9,000 trips; 12,411 rainbows caught, 8,085 harvested (22% of fish stocked); catch rate 0.84/hr May → 0.34/hr September; "a put-and-take fishery"
- Key quotes: 1998 electrofishing "revealed that few rainbow trout holdover from one year to the next"; "water temperatures by late August were acutely lethal (i.e., 27 C)" and stayed above 22 C until mid-October; Sept–Oct 2000 dam temperatures "the highest recorded in any Tennessee tailwater managed for trout"; recommends curtailing stockings after July 4 and resuming no earlier than October; manage "as a seasonal rather than year-round trout fishery"; also documented a substantial warmwater fishery (609 non-trout creeled vs 312 trout; bluegill dominated)
- Type: completed + agency study. Confidence: HIGH (primary agency report).
- Establishes: NO meaningful holdover through Jul–Oct in this reach; year-round trout presence is contradicted by agency data. Also supplies the sibling-water warmwater context.

### S6. TWRA "Trout Stocking Report" (completed stockings)
- Org: TWRA; PDFs "Trout Stocking Report, updated as of …" (local captures scheds/stockreport-202412.pdf, stockreport-202503.pdf, stockreport-202509.pdf, stocking-report-2024 [9/27/2024]; rolling recent-window lists)
- URLs (live form): https://www.tn.gov/twra/fishing/trout-information-stockings.html (report links)
- Duck rows found: "2  Normandy TW  03/20/2025" (report updated as of 03/2025) — destination-level COMPLETED stocking, March 2025. NO Normandy/Duck rows in reports updated 9/27/2024, 12/3/2024, 09/2025 (late-summer/fall 2024 within Nov–Apr season start not shown; 09/2025 off-season).
- Type: completed, destination-level. Confidence: HIGH for the March 2025 event.

### S7. TWRA completed-stockings JSON feeds (2024 archive + live 2026-09)
- Org: TWRA; (a) committed archive captured 2024-06-07: https://web.archive.org/web/20240607134309/https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable.exceldriven.json (window 05/06–06/04/2024); (b) live capture Thu 24 Sep 2026 13:07:53 GMT: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable.exceldriven.json (window Aug–Sep 2026)
- Duck rows: NONE in either window. Consistent with (post-2023) Nov–Apr season — May–Jun 2024 and Aug–Sep 2026 are outside it. (Under the older Nov–Jun season, May–Jun 2024 would have been in-season; absence supports the shortened season.)
- Type: completed feeds; negative evidence. Confidence: MEDIUM-HIGH (feeds are rolling windows, not full-year ledgers).

### S8. TWRA where-to-fish page "Duck River" (current narrative)
- Org: TWRA; live page retrieved 2026-09-25
- URL: https://www.tn.gov/twra/fishing/where-to-fish/middle-tennessee-r2/duck-river.html
- Verbatim: "the Normandy tailwater section of the Duck River from the dam downstream to Three Forks Bridge is stocked annually with Rainbow Trout from November through June"; "Water temperatures usually warm above the 70 °F mark during the remaining months exceeding the upper limit for trout survival"; trout creel "7 trout per day with no size restriction" (statewide regs)
- Type: agency narrative (planned/management). Confidence: HIGH.
- Establishes: current official season statement Nov–Jun AND agency statement that summer months exceed trout survival limits — the direct YR-flag killer.

### S9. TWRA ArcGIS "TWRA_Trout_Stocking_Locations" (access points)
- Org: TWRA; live query 2026-09-25
- URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0/query?where=StreamName+LIKE+%27%25Duck%25%27&outFields=*&f=pjson&returnGeometry=false
- Rows (all Region 2, Bedford, StockingProgram "Tailwater", WaterClass "stream", Species "rainbow"): Normandy Dam (35.4638, -86.2465); Second Bridge (35.4577, -86.2575); Dement Bridge (35.4665, -86.2947); Three Forks Bridge (35.4800, -86.3250); 24-hr access at all four
- Type: location/infrastructure layer. Confidence: HIGH.
- Establishes: reach coordinates; stocking program label "Tailwater"; 4 named access sites.

### S10. TWRA StoryMap "Tennessee Trout Waters" (narrative)
- Org: TWRA; item dbb92bdf718f4fd7839bf4b08fb82747; undated (n.d.), retrieved from https://storymaps.arcgis.com/stories/dbb92bdf718f4fd7839bf4b08fb82747 (data via arcgis sharing API; local storymap_data.json)
- Duck section quotes: "the river is only suitable for trout 8 months out of the year"; "good catches of 10"-14" Rainbow Trout in the first 9 miles"; "Several hundred trout are stocked here"; statewide regs 7/day; "no hydropower turbines in Normandy Dam" (sluice/flood-gate releases only)
- Type: agency narrative. Confidence: MEDIUM-HIGH (undated).
- Establishes: suitability window (8 months ≈ Nov–Jun), ~9-mile reach, modest stocking volume ("several hundred"), no hydropower (stable cold releases near dam in season). NOTE: the "8 months" phrase is plausibly the origin of the ledger's 8-month [11..6] window AND the erroneous YR flag.

### S11. Occurrence/citizen-science leads (single catches — NOT establishment)
- iNaturalist API (retrieved 2026-09-25): 2 Oncorhynchus mykiss observations within 25 km of the tailwater; nearest id 71928496, observed 2021-03-08, user jonathonhulan, 35.4962/-86.5364 (in-season month, near Manchester reach). URL: https://api.inaturalist.org/v1/observations?taxon_name=Oncorhynchus%20mykiss&lat=35.46&lng=-86.27&radius=25
- GBIF (retrieved 2026-09-25): 451 O. mykiss records Bedford County TN (mostly iNat mirrors, incl. 2026-01-05 image). URL: https://api.gbif.org/v1/occurrence/search?scientificName=Oncorhynchus%20mykiss&country=US&stateProvince=Tennessee&county=Bedford
- USGS NAS (retrieved 2026-09-25): no rainbow/brown trout records in the Duck drainage or Bedford/Coffee counties. URL: https://nas.er.usgs.gov/api/v2/occurrence/search?speciesID=2640&state=TN
- All are in-season (winter/spring) angler finds downstream of stocking points; none establish reproduction or off-season survival. Type: leads. Confidence: LOW (as establishment evidence).

## Months-by-year stocking table (Duck River / Normandy TW)

| Year(s) | Evidence | Months supported | Species |
|---|---|---|---|
| 2000 (completed) | Bettoli TWRA 01-43 | stocked Feb–Dec 2000 (52,951; put-and-take; late-summer stocking called wasteful) | rainbow |
| ~2001–2015 (published) | archived tailtrout.html 2010/2013/2015 | Mar, Apr, May, Jun, Nov, Dec | rainbow + brown |
| 2018–2021 (published) | schedule PDFs 2018, 2020, 2021-11 | Nov–Jun (Nov, Dec, Jan, Feb, Mar, Apr, May, Jun) | rainbow |
| 2023–2025 (published) | schedule PDFs 2023-02, 2024-12, 2025-09 | Nov–Apr | rainbow |
| 2025 (completed) | TWRA stock report | Mar 20, 2025 event (destination "Normandy TW") | rainbow |
| 2026 (planned) | schedule JSON 2026-09-24 | J, F, M, N, D (Jan, Feb, Mar, Nov, Dec) | rainbow |
| Jul–Oct any year | feeds/reports searched | NONE (no completed or planned rows; 2000 creel + where-to-fish page: temps lethal) | — |

## Contradictions and notes
1. Current ArcGIS + where-to-fish page say Nov–Jun; 2023–2025 PDFs say Nov–Apr; 2026 JSON says Jan–Mar+Nov–Dec. Agency is internally inconsistent; Nov–Jun is the defensible envelope, Nov–Apr the recent operational norm.
2. Brown trout listed 2001–2015 era, absent from all 2018+ sources.
3. 2000-era stocking ran Feb–Dec (documented as wasteful); modern program deliberately seasonal. Historical near-year-round practice does not support a YR flag today.
4. 2017 Tennessean mention of "winter trout stocking, Duck River at Riverside Dam, Columbia" is a DIFFERENT downstream site (Maury Co. winter program), not the Normandy TW — do not conflate.
5. Supposed "Duck River Trout Evaluation 2015-2019" PDF surfaced only in a search-summary snippet (unverifiable URL, tn.gov path 404s); disregarded. Trout Management Plan 2017-2027 PDF URL 404 + no wayback snapshot; 2006 plan (local) has no Duck section.
6. Completed-feed windows (May–Jun 2024; Aug–Sep 2026) contain no Duck rows — negative evidence consistent with seasonality, but windows are rolling, so absence alone is weak.

## Searches run (12 distinct, tailwater)
1. TWRA Duck River tailwater trout stocking Normandy Dam schedule
2. Duck River Normandy Dam tailwater trout holdover electrofishing creel survey TWRA
3. Tennessee trout management plan Duck River Normandy tailwater rainbow trout stocking annual
4. Bettoli Duck River trout Tennessee Tech tailwater study rainbow
5. "Normandy" tailwater Duck River trout 2026 stocking schedule "November"
6. TWRA tailwater trout electrofishing report Duck River Normandy survival summer temperature
7. iNaturalist rainbow trout Duck River Normandy Dam Bedford County Tennessee observation
8. "Duck River" "Normandy" tailwater trout put and take rainbow winter fishery anglers
9. "Normandy TW" OR "Normandy Tailwater" trout stocking 2025 completed TWRA report
10. Duck River Normandy tailwater brown trout stocking TWRA rainbow only
11. Duck River below Normandy Dam trout fishing report 2025 rainbow catch
12. Flintville trout hatchery Tennessee Normandy Duck River stocking Region 2 coldwater
(Plus direct opens: ArcGIS Tailwater_Trout + Trout_Stocking_Locations queries; 2026 schedule/completed JSONs; 2010/2013/2015 wayback tailtrout pages; where-to-fish page; Bettoli 01-43 via jina reader; GBIF/iNat/NAS APIs; local archive captures 2018–2025.)

## Recommendation
- Keep verdict `seasonal-stocked-trout`. **CLEAR the YR flag** — agency research (Bettoli 01-43: acutely lethal Aug temps, few holdovers, "manage as a seasonal rather than year-round fishery") plus the where-to-fish page (summer >70 F exceeds trout survival) affirmatively disprove Jul–Oct presence; stocking is not continuous in any documented year.
- Months: current official envelope is Nov–Jun (ArcGIS webmap + where-to-fish page). Note the operational narrowing: Nov–Apr (2023–2025 PDFs) and Jan–Mar+Nov–Dec (2026 JSON). If the owner's policy prefers the most recent published grid, months should shrink to [11,12,1,2,3]; keeping [11,12,1,2,3,4,5,6] matches the current agency webmap/page statement and requires no change, but the YR flag must go.
