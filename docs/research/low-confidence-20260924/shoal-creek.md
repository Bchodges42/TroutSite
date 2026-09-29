# Shoal Creek (Lawrence County, TN) — Trout-Stocking Evidence Research Log

Water: Shoal Creek, Lawrence County, TN (spring-fed stream through Lawrenceburg; USGS gauge network on main stem, downstream "Iron City" area).
Research date: 2026-09-24 (all retrieval dates = 2026-09-24).
Task: resolve CONFLICTING evidence — catalog claims a TWRA spring trout-stocking program; a prior pass claimed "TWRA verified 2026 schedule has ZERO Shoal Creek rows (only 'Shoal' row = East Fork Shoal Creek, Dickson County)" while newspapers describe historical winter plants at Lawrenceburg parks.
Researcher constraint: research only; no agency/business contact; no writes except this file.

## HEADLINE RESOLUTION OF THE CONFLICT

The prior pass's negative finding is REFUTED on both of its claims:

1. "Only Shoal row is East Fork Shoal Creek, Dickson County" — WRONG COUNTY. East Fork Shoal Creek is a GNIS-distinct 5.8 km tributary IN LAWRENCE COUNTY, running through Lawrenceburg, joining Shoal Creek main stem in town. There is NO Shoal-named NHD flowline anywhere in the Dickson County test envelope (checked; see Geography). Dickson County's 2026 winter trout rows are J.D. Buckner Park and Acorn Lake (Montgomery Bell SP) — no Shoal name in Dickson.
2. "Zero Shoal Creek rows in the 2026 schedule" — WRONG. The live 2026 TWRA schedule JSON (616 rows) contains 5 Lawrence County rows for "East Fork Shoal Creek" (Seasonal, rainbow, weeks of 2/15, 3/8, 3/22, 5/10, 5/31/2026), and TWRA's ArcGIS site layer contains a MAIN-STEM "Shoal Creek" site at Davy Crockett State Park (Spring program, rainbow).

Dated paper trail for East Fork Shoal Creek, Lawrence County: 2003, 2004, 2005, 2006, 2007, 2008, 2018, 2019, 2020 (Complete schedule + Cold-Water doc), 2018-19 winter report (1/2/2019 event), 2019-20 winter report (1/8/2020 event), 2024 (on-page JSON, 5/14/2024 event), 2026 (5 seasonal weeks). Documentation gaps: 2009-2017 schedules not located online (2015 has only a newspaper calendar item); 2021-2023 no located row (a 2/18/2022 coldwater schedule omits Lawrence entirely).

Main-stem Shoal Creek: never appears as a schedule row in any year checked (2003-2008, 2018-2020, 2022, 2024, 2026). Its only agency evidence is the site-level ArcGIS row at Davy Crockett State Park (Spring, rainbow) — corroborated by research-grade iNaturalist rainbow trout at the park in June 2023, May 2025, May 2026 (133 m from the TWRA site point). The catalog's "spring trout-stocking program" phrasing matches TWRA's own StockingProgram="Spring" field verbatim.

Classification-relevant nuance: the fishery is a SEASONAL (late-winter/spring) put-and-take rainbow fishery on (a) the East Fork Shoal Creek town reach in Lawrenceburg (schedules 2003-2026) and (b) plausibly the main-stem park reach at David Crockett SP (site layer + observations). No evidence of year-round or reproducing trout; no wild-trout-stream listing (2015 wild-trout-streams page has no Shoal entry). Warmwater assemblage (smallmouth, rock bass, diverse darters) dominates the system.

## SOURCE-BY-SOURCE LOG

### A. Agency program / schedule evidence (highest weight)

A1. TWRA live 2026 Trout Stocking Schedule JSON (datatable behind tn.gov/twra/fishing/trout-information-stockings)
- Org: Tennessee Wildlife Resources Agency (TWRA). Retrieved 2026-09-24 via curl with browser UA (plain curl intermittently blocked; tn.gov 200 with Chrome UA).
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json
- Fields: REGION, COUNTY, LOCATION, TYPE, STOCKING DAY, STOCKING WEEK, STOCKING MONTHS, SPECIES. 616 rows.
- Lawrence County rows (verbatim):
  - {"REGION":"2","COUNTY":"Lawrence","LOCATION":"East Fork Shoal Creek","TYPE":"Seasonal","STOCKING WEEK":"2/15/2026","SPECIES":"Rainbow Trout"}
  - same, "3/8/2026"; "03/22/2026"; "5/10/2026"; "5/31/2026" (5 rows)
  - Little Buffalo River (Lawrence), Seasonal, rainbow: 3/8, 03/22, 5/10, 5/31/2026 (4 rows; different water — Little Buffalo River, NOT Shoal Creek)
- Dickson County rows: Acorn Lake (Montgomery Bell SP), Delayed Harvest, week 12/6/2026; J.D. Buckner Park, Winter, 2/12/2026 and TBD 12/2026. NO Shoal name in Dickson.
- NO main-stem "Shoal Creek" row in 2026 (only the 5 East Fork Shoal Creek rows contain "Shoal").
- Type: official current schedule. Confidence: HIGH (agency primary, current year). Establishes: current-year (2026) seasonal rainbow stocking of East Fork Shoal Creek, Lawrence County. Does not establish: main-stem Shoal Creek stocking; whether listed weeks were completed.

A2. TWRA ArcGIS feature layer TWRA_Trout_Stocking_Locations (Trout_MASTER_Project, ~730 sites)
- Org: TWRA. Retrieved 2026-09-24. Query endpoints (read-only GET):
  https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0/query
- Fields: OBJECTID, LATITUDE, LONGITUDE, Site_Name, StreamName, Region, County, City, StockingProgram, WaterClass, Species, NumStocked, Management, ...
- Lawrence County rows (verbatim attributes):
  - OBJECTID 588: Site_Name "Davy Crockett State Park", StreamName "Shoal Creek" (MAIN STEM), Region 2, LAWRENCE, Lawrenceburg, StockingProgram "Spring", WaterClass "stream", Species "rainbow", NumStocked null, Management null, lat 35.263633684, lon -87.356564926, HoursOpen "Contact Region 2", Parking paved. GlobalID 46fe2a7f-38ec-432e-b4c3-e94cfdfec8bd.
  - OBJECTID 589: Site_Name "Park", StreamName "East Fork Shoal Creek", LAWRENCE, Lawrenceburg, "Spring", rainbow, NumStocked 1000, Management "County", lat 35.230797072, lon -87.329458823. (Reverse geocode: Hickory Heights, Lawrenceburg; nearest OSM park = Veteran's Park, ~151 m — site name is generic "Park"; likely the city park reach. LEAD, not confirmed.)
  - OBJECTID 590: Site_Name "Water Plant", StreamName "East Fork Shoal Creek", LAWRENCE, Lawrenceburg, "Spring", rainbow, NumStocked 1000, Management "County", lat 35.243481738, lon -87.346371012. (Clearview Heights; consistent with a municipal water-plant reach in town.)
- County=DICKSON rows: Acorn Lake (Spring, rainbow); J.D. Buckner Park (Winter, StreamName "New City Lake", 1300, Dickson). NO Shoal-named site in Dickson.
- Layer-wide LIKE '%SHOAL%' (Site_Name or StreamName): only Rocky Shoals (Rocky Fork, Unicoi), Paint Creek shoals site (Greene), and the three Lawrence rows above.
- Type: official site-level master layer (drives TWRA trout map). Confidence: HIGH for existence of a Spring rainbow program at these sites. Establishes: main-stem Shoal Creek at Davy Crockett SP is a TWRA spring rainbow stocking SITE in the current master layer. Limitation: site layer ≠ schedule; NumStocked null for the DCSP row.

A3. "2003 TWRA TENTATIVE TROUT STOCKING SCHEDULE" (sched03.pdf), state.tn.us era
- Capture: http://web.archive.org/web/20030404161556/http://www.state.tn.us/twra/fish/StreamRiver/stockedtrout/sched03.pdf (retrieved 2026-09-24)
- Grid header: weeks of FEBRUARY through OCTOBER. Region 2 rows verbatim: "Lawrence East Fork Shoal Creek X XXX" (1 February week + 3 spring weeks); "Lawrence Little Buffalo River X XXX".
- Type: archived official annual schedule. Confidence: HIGH. Establishes: planned spring-season stocking of East Fork Shoal Creek in 2003. Same row found in sched04 (capture 20040210011352), sched05 (20051124124935), sched06 (20060604223344), sched07 (20070227143540, "X X XXX"), sched08 (20080909205030, "X X XXX").
- NOTE: never a main-stem "Shoal Creek" row in any of these schedules.

A4. "2018-Trout-Stocking-Schedule.pdf"
- Capture: https://web.archive.org/web/20180717180317/https://www.tn.gov/content/dam/tn/twra/documents/2018-Trout-Stocking-Schedule.pdf — rows: "Lawrence East Fork Shoal Creek ● ● ● ●"; "Lawrence Little Buffalo River ● ● ● ●". 4 seasonal events. Confidence HIGH. (Retrieved 2026-09-24.)

A5. "2019-Trout-Stocking-Schedule.pdf"
- Capture: https://web.archive.org/web/20190109035923/https://www.tn.gov/content/dam/tn/twra/documents/2019-Trout-Stocking-Schedule.pdf — same two Lawrence rows. Confidence HIGH.

A6. "Trout-Stocking-Schedule-Complete.pdf" (2020, captured 2020-04-24)
- https://web.archive.org/web/20200424033427/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Trout-Stocking-Schedule-Complete.pdf — "Lawrence East Fork Shoal Creek ● ● ● ●". Confidence HIGH.
- Companion "Cold-Water-Stocking.pdf" (capture 20200424033438) also lists "East Fork Shoal Creek".

A7. TWRA "Winter Trout Stocking (2018-2019)" report (winter-trout-stocking-report.pdf)
- Capture (also end-of-season capture 20190412221001): https://web.archive.org/web/20181013005431/https://www.tn.gov/content/dam/tn/twra/documents/winter-trout-stocking-report.pdf
- Row verbatim: "1/2/2019 Wednesday East Fork Shoal Creek Lawrenceburg Lawrence" (winter-program event, Region 2 section).
- Type: official event-level winter schedule. Confidence HIGH. Establishes: dated January 2019 winter plant at East Fork Shoal Creek, Lawrenceburg.

A8. TWRA "Winter Trout Stocking (2019-2020)" report
- Capture: https://web.archive.org/web/20200126081311/ (raw via id_ modifier) — row verbatim: "1/8/2020 Wednesday East Fork Shoal Creek Lawrenceburg Lawrence". Confidence HIGH.

A9. On-page stocking datatable JSON, June 2024 capture
- https://web.archive.org/web/20240607134309/https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_panel_348017491_c/content/tn_complex_datatable.exceldriven.json?_=1717767789374
- 54 rows; Region 2 row: {"Region":"2","Destination":"East Fork Shoal Creek","Stocking Date":"05/14/2024"}. Confidence HIGH. Establishes: EFSC actively stocked May 2024.

A10. NEGATIVE / gap datapoints (all retrieved 2026-09-24 via Wayback; pypdf extraction):
- winter-trout-schedule.pdf capture 20200809113424 (2019-20 winter program, month-by-month, Regions 1-4): NO Shoal/Lawrence rows — even though report A8 shows a 1/8/2020 EFSC event (TWRA's winter "program" schedule vs "report" are different documents; EFSC was inconsistently listed).
- winter-trout-schedule.pdf captures 20210305100053 & 20210513061048 (2020-21 season): no Shoal/Lawrence.
- "Coldwater-Trout Stocking Schedule updated 2/18/2022" (capture 20220221220911): Region 2 lists 16 destinations (Billy Dunlap, Cowan, Don Fox, Harpeth, J D Buckner Lake, Kingston Springs, Lafayette, Marrowbone, McCutcheon, Normandy TW, Shelby Park, Stone Bridge, Sulphur Fork, Tims Ford TW, West Fork Stones, Woodland) — NO Lawrence/Shoal. Winter 2021-22 gap year for EFSC.
- TWRA-Winter-Trout-Schedule.pdf (capture 20241120115437; 2024-25 winter): no Shoal/Lawrence (Dec-Mar program only; EFSC events are Feb-May "Seasonal" so absence is expected but documents no winter event).
- Trout_Stocking-Report.pdf "updated as of 9/27/2024" (capture 20240927221436): no Shoal (summer/fall gap).
- article/stocked-trout (capture 20150712210618) and article/wild-trout-streams (capture 20150712210734): no water lists; Shoal Creek NOT listed as a wild trout stream. 2019-trout-fishing-guide.html (capture 20190412193737): no Shoal/Lawrence mention.
- r-winter-trout-stocking.html (capture 20180112193703, 2017-18 winter page): no Shoal/Lawrence rows in extractable text.

### B. News listings (secondary corroboration)

B1. The Tennessean, "Midstate outdoors calendar," Dec 23, 2015 — "TWRA winter trout stocking at East Fork Shoal Lake in Lawrenceburg. Call 731-253-9652 or visit reelfoottourism.com."
- Source surfaced via WebSearch (tennessean.com); exact article URL not retrievable before rate limits. Note "Shoal Lake" is the calendar writer's corruption of Shoal Creek/Lake; phone 731-253-9652 is a West TN TWRA-region contact (calendar boilerplate). Type: dated news listing. Confidence: MEDIUM (secondary, snippet-level). Establishes: local media advertised a winter trout stocking in Lawrenceburg in the 2015-16 season.

B2. Chattanoogan.com, "2018-19 TWRA Winter Trout Stocking Schedule Set" (Nov 2018) — snippet reproduces schedule rows including "2 Wed. East Fork Shoal Creek Lawrenceburg."
- Surfaced via WebSearch; exact article URL not located (site search/CDX attempts failed). Type: news reproduction of A7. Confidence: MEDIUM (corroboration of A7).

B3. WATE (Knoxville), Dec 8, 2022 — "Tennessee waters to be stocked with 75,000 rainbow trout" (statewide program context; no Lawrence-specific list retrieved; my URL guess 404'd). Context only.

### C. Dated trout observations (non-survey)

C1. iNaturalist research-grade Oncorhynchus mykiss observations, Lawrence County bounding box (35.05-35.55, -87.75..-87.15; API query, retrieved 2026-09-24). 18 rainbow obs total:
- 2026-05-20, 5 obs at David Crockett State Park (-87.35784, 35.26304): https://www.inaturalist.org/observations/364078311 (+364078103, 364076371, 364076084, 364075861). Distance to TWRA ArcGIS DCSP site: 133 m. Same day the observer also recorded Micropterus nigricans (364077896) and Ambloplites rupestris (364077596) at the same point.
- 2025-05-08, 8 obs same spot: https://www.inaturalist.org/observations/279596640 (+7 others), 133 m from TWRA site.
- 2023-06-11: https://www.inaturalist.org/observations/166938008 (-87.35631, 35.26386).
- 2021-04-18 "Bradley Cove" (day-use area of David Crockett SP): https://www.inaturalist.org/observations/74399219 (-87.34829, 35.24574), 2.1 km downstream of the site — same park reach.
- 2016-05-21 (6565243) and 2017-06-02 (6566175) at (-87.5128, 35.4000): this point coincides with TWRA's Little Buffalo River stocking sites (OBJECTID 1-5) — DIFFERENT WATER (Little Buffalo River, stocked with rainbow since 2003); do NOT count as Shoal Creek trout.
- Type: dated public observations. Confidence: MEDIUM-HIGH (research grade, precise coordinates). Establishes: live rainbow trout present on the Shoal Creek main-stem park reach in late spring (May-June) 2023, 2025, 2026 — consistent with spring stocking + cool water persistence in the state park reach (wooded canopy, spring-fed). Not a survey; persistence through summer not shown.

### D. Warmwater evidence (main stem and system)

D1. iNaturalist fish assemblage, same box (1,578 fish observations, taxon Actinopterygii; retrieved 2026-09-24): Micropterus dolomieu (smallmouth; 2026-09-02 at -87.5696,35.1029 upper Shoal Creek system; 2026-07-03 at -87.4255,35.4411), M. nigricans, Ambloplites rupestris (rock bass, incl. DCSP 2026-05-20), Lepomis megalotis/macrochirus/cyanellus/microlophus, Fundulus catenatus (northern studfish) at "Shoal Creek Trail, Lawrenceburg" (urban greenway reach), Cyprinella galactura, Luxilus chrysocephalus, 15+ darter taxa (Etheostoma caeruleum, E. planasaxatile, E. duryi, E. flavum, E. neopterum, E. blennius, E. obama, E. simoterum, E. zonale, E. flabellare, E. bison, Nothonotus rufilineatus, N. denoncourti, N. aquali, Percina campestria, P. caprodes, P. burtoni, P. apina), Cottus carolinae, Hypentelium nigricans, Noturus exilis, Moxostoma spp., Minytrema melanops, Phenacobius uranops, Nocomis micropogon, etc.
- Interpretation: a high-quality, clear, spring-fed warmwater/cold-coolwater assemblage with strong benthic insectivore diversity (excellent IBI-type community). This is the reach's ecological character; salmonids appear ONLY as the 18 stocked-rainbow obs above. No salmonid reproduction (no young-of-year/fry reports, no summer trout obs).
- Type: crowd observations, not a methodical survey. Confidence: MEDIUM. NO formal, method-documented TWRA/TDEC fish survey publication with a full species list for this reach was located online (gap; TDEC 305(b)/Elk-Shoal basin references exist for water quality only).

D2. USGS stations on Shoal Creek (waterservices.usgs.gov single bbox query, retrieved 2026-09-24; HUC 06030005):
- 03588000 "SHOAL CREEK AT LAWRENCEBURG, TN" (35.24452, -87.35057; long-term gauge)
- 03587500 "SHOAL C AB LITTLE SHOAL C, AT LAWRENCEBURG, TN" (35.23397, -87.33335)
- 03588210 "SHOAL CREEK BELOW LAWRENCEBURG, TN" (35.21536, -87.36307)
- 03588215 "SHOAL CREEK NEAR GRUNDY, TN" (35.19480, -87.38141) — closest station to the Iron City community (south Lawrence County); likely the catalog's "gauge at Iron City." Catalog should confirm which site number it means.
- These are stream gauges (stage/discharge), not biological stations.

### E. Geography / disambiguation (settles same-name risk)

E1. NHD (hydro.nationalmap.gov MapServer 4, envelope -87.75..-87.15 / 35.05..35.55, retrieved 2026-09-24): Shoal Creek (GNIS 153439, 55.1 km, main stem), East Fork Shoal Creek (GNIS 1302998, 5.8 km), West Fork Shoal Creek (GNIS 1274189, 5.4 km), Little Shoal Creek (GNIS 1291662, 18.3 km), Shoaly Branch (GNIS 1270144, 4.8 km). ALL in Lawrence County area, drainage HUC 06030005 (Lower Elk) to the Tennessee River.
E2. Dickson County test envelope (-87.55..-86.90 / 35.95..36.40): ZERO Shoal-named flowlines. "East Fork Shoal Creek, Dickson County" does not exist in NHD. The prior pass's disambiguation anchor was wrong; the only stocked Shoal-named water in TWRA data is Lawrence County's.
E3. David Crockett State Park is ON the Shoal Creek main stem — official park text (Wayback capture 20180712193325 of tnstateparks.com/parks/david-crockett): "Along the banks of Shoal Creek, in what is now his namesake park, he established a diversified industry consisting of a powdermill, a gristmill and a distillery." This refutes the working assumption in the tasking that DCSP "is on a different stream." Crockett's mill ruins/Crockett Falls are on Shoal Creek at the park.
E4. East Fork Shoal Creek stocking sites sit in town: "Water Plant" 0.71 km SE of the Lawrenceburg courthouse, "Park" 1.55 km; DCSP site 2.86 km WSW (computed haversine, 2026-09-24). The East Fork joins the main stem in/near town, so stocked fish on the fork are hydrologically connected to the main stem, but the SCHEDULED water is the fork, not the main stem.

### F. Program history context (secondary)

F1. TWRA winter trout program: statewide put-and-take rainbow program (~75,000-90,000 fish, Dec-Mar, 40+ waters; e.g., WATE 2022-12-08; TCAFS notes Region 1 success). Exact founding year not pinned from indexed sources; the state.tn.us "stockedtrout" schedule series shows East Fork Shoal Creek in the seasonal (Feb-spring) schedule continuously from at least 2003, with winter-program events appearing in 2018-19/2019-20 reports. Type: context. Confidence: MEDIUM.

## WHAT THE EVIDENCE ESTABLISHES vs NOT

- ESTABLISHED: TWRA has stocked East Fork Shoal Creek (Lawrenceburg, Lawrence Co) with rainbow trout under its seasonal/coldwater program across a 24-year span — documented years 2003, 2004, 2005, 2006, 2007, 2008, 2018, 2019 (incl. 1/2/2019 winter event), 2020 (incl. 1/8/2020 winter event), 2024 (5/14/2024), 2026 (5 seasonal weeks listed). TWRA's current site layer adds a main-stem Shoal Creek spring-rainbow site at Davy Crockett State Park; live rainbow trout were photographed there May-June 2023, 2025, 2026 (133 m from the site point).
- NOT ESTABLISHED: main-stem Shoal Creek schedule rows in ANY year (only the fork is scheduled); a completed-stocking receipt for the 2026 weeks; formal fish-survey documents for the reach; any reproducing/year-round trout population; stocking in years 2009-2017 (2015 newspaper ad implies 2015-16 season) and 2021-2023 (2022 coldwater schedule omitted Lawrence).
- CONTRADICTIONS: prior pass ("zero Shoal rows; only Shoal row = East Fork Shoal Creek, Dickson Co") is factually wrong on county and on the existence of current rows. Tasking assumption ("David Crockett State Park is on a different stream") is wrong. TWRA's own 2019-20 winter schedule omits EFSC while its 2019-20 winter report lists a 1/8/2020 EFSC event (internal doc inconsistency).

## SEARCHES RUN (2026-09-24)

Productive:
1. WebSearch "Lawrenceburg Tennessee Shoal Creek trout stocking TWRA" → tennesseefishingspots/Iron City lead; Tennessean 2015 lead
2. WebSearch "\"East Fork Shoal Creek\" Lawrenceburg trout stocking" → Tennessean Dec 23, 2015 calendar item
3. WebSearch "\"East Fork Shoal Creek\" trout TWRA Tennessee" → Chattanoogan 2018-19 schedule reproduction
4. WebSearch "TWRA winter trout stocking program began Tennessee... history" → WATE 2022 (75,000 trout), TCAFS program context
5-6. Direct agency mining: TWRA ArcGIS layer (fields, %SHOAL%, County=Lawrence, County=Dickson); live 2026 schedule JSON (retries until 200; full 616-row extraction)
7-18. Wayback PDF mining (pypdf via stdin): winter-trout-stocking-report 2018-19 (2 captures) and 2019-20; 2018 schedule; 2019 schedule; Cold-Water-Stocking.pdf; Trout-Stocking-Schedule-Complete.pdf; winter-trout-schedule 2020-08/2021-03/2021-05; Coldwater-Trout_Stocking-Schedule 2022-02; TWRA-Winter-Trout-Schedule 2024-11; Trout_Stocking-Report 2024-09; Trout_Map_Side1/Side2 2020; 2024-06 on-page JSON; sched03-sched08.pdf (state.tn.us era); stockedtrout.html 2003; r-winter-trout-stocking.html 2018; article/stocked-trout + article/wild-trout-streams 2015; tnstateparks DCSP capture
19-21. CDX sweeps: tn.gov/content/dam/tn/twra/documents/* (trout/sched/winter); tn.gov/twra/fishing/*; state.tn.us/twra/*; stockedtrout dir; tnstateparks DCSP
22-24. NHD queries (Lawrence envelope; Dickson envelope); USGS waterservices (bbox Iron City/Lawrenceburg); Nominatim reverse-geocode of 3 site points + park search
25-27. iNaturalist API: trout in box; fish assemblage in box; per-observation details (6 obs)
28. Distance computations (sites vs courthouse; iNat vs TWRA site)

Unproductive lanes (attempted, no usable return):
- WebSearch rate-limited (HTTP 429 repeatedly): TWRA winter trout Lawrenceburg history; David Crockett SP Shoal trout; Shoal Creek smallmouth Iron City; "East Fork Shoal Creek" Lawrence County stream; Lawrenceburg trout 2023-2025; chattanoogan URL hunt
- DuckDuckGo HTML + Lite via curl: bot-blocked, 0 results (East Fork Shoal Dickson; Lawrence County Advocate trout; tennesseefishingspots Iron City page; Shoal Creek trout forum/YouTube; winter trout history)
- Bing via curl: bot-blocked
- Reddit search JSON: blocked
- Chattanoogan exact article URL (guessed path) and Wayback CDX domain filter: no match
- WATE Dec 2022 article: direct URL guess 404
- Overpass park-name query near EFSC_Park site: syntax/encoding failures
- USGS waterservices multi-filter queries: application 400s (single-filter bbox query succeeded)
- tennesseefishingspots.com root scrape: 164 links, none Shoal/Iron City-named
- state.tn.us sched09-13 era: no captures found (documentation gap)

## RECOMMENDATION

Recommendation: **seasonal-stocked** (with a documented warmwater background), NOT "trout" and NOT "unresolved."

Reasoning: The catalog's core claim is CORRECT and now well-dated: TWRA runs a spring/seasonal ("StockingProgram":"Spring" in TWRA's own site layer; TYPE "Seasonal" in the 2026 schedule) put-and-take rainbow stocking on this water — on the East Fork Shoal Creek town reach (scheduled and current in 2026: 5 weeks 2/15-5/31/2026) and at the main-stem Davy Crockett State Park reach per TWRA's master site layer, corroborated by research-grade trout observations there in May 2023, May 2025, and May 2026. Years documented: 2003-2008 (annual schedules), 2018-2020 (schedules + dated winter events 1/2/2019 and 1/8/2020), 2024 (May 2024 event), 2026 (current). This is a cold-season put-and-take fishery, not a year-round trout stream: no wild-trout-stream status, no evidence of summer persistence or reproduction, and a rich warmwater assemblage (smallmouth, rock bass, 20+ darter/sucker spp.) characterizes the system. If the catalog row is specifically about the MAIN STEM below/right at the gauge, note that all scheduled rows name the East Fork; main-stem evidence is the DCSP site row + observations only.

Key gap and likely record holder: (a) 2009-2017 schedule PDFs (esp. whether stocking continued without interruption; the 2015 Tennessean ad implies yes for 2015-16) — likely holder: TWRA Region 2 Fisheries office / TWRA Fisheries Division annual reports (not archived online); (b) completion receipts for 2025/2026 EFSC and DCSP events and the actual number stocked at DCSP (NumStocked is null in the site layer) — holder: TWRA Region 2 trout coordinator / the stocking-report export behind the live datatable. Suggest correcting any "East Fork Shoal Creek = Dickson County" note anywhere in the catalog: that water does not exist in NHD; the stocked East Fork Shoal Creek is Lawrence County through Lawrenceburg (and it is a tributary of Shoal Creek, so catalog attribution to "Shoal Creek" is defensible for the town reach).
