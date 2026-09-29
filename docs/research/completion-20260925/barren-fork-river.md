# Research log: Barren Fork River, main stem (Warren County, McMinnville, TN)

- Water: **Barren Fork River** — main stem through McMinnville; 23.4-mi tributary of the Collins River (Caney Fork drainage). TWRA schedule name: **"Barren Fork River"** (Region 3, Warren County). STRICTLY separate water from "N Barren Fork Creek" (= North Prong Barren Fork, Petigap Rd — resolved separately, spring-only) — both rows coexist in the same Warren County schedule blocks every year.
- Ledger state at start: seasonal-stocked-trout, no months pinned.
- All retrievals: 2026-09-25 (files inherited from this project's 2026-09-24/25 passes). Research only; no agency contact.
- Method note: archived schedule PDFs are weekly grids ("WEEK OF" Sundays; event within 5 days after). Column identity was fixed by exact PDF word/char coordinates (PyMuPDF rawdict) + Sunday-sequence validation (first column anchored to nearest month label; each next column +7 days; every column's day-of-month must match the sequence). Mark-to-column distances (dx) are printed so readings can be audited. This corrects the prior pass's pdftotext character-column alignment, which was systematically biased ~1 column right for the 2003–2015 state.tn.us-era files (the 2018–2025 bullet files re-extract identically to the prior pass — used as calibration).

## 1. LIVE 2026 TWRA schedule JSON (primary, high confidence)

- Title: Trout Information & Stockings — 2026 schedule data table (616 rows); Org: TWRA
- Observation date: current 2026 season; retrieved 2026-09-24/25
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json (tn.gov blocks plain curl; browser-context fetch)
- Rows for this water (all TYPE "Seasonal", SPECIES "Rainbow Trout", Region 3, County Warren):
  - `{Barren Fork River, STOCKING WEEK 3/15/2026}`
  - `{Barren Fork River, STOCKING WEEK 3/22/2026}`
  - `{Barren Fork River, STOCKING WEEK 5/10/2026}`
- All 9 Warren County rows are TYPE "Seasonal"; zero "Winter" rows for Warren County in 2026.
- Independent mirror: mywaterlevel.com/stocking/tennessee/ ("Tennessee Trout Stocking Schedule 2026") shows the identical three weeks for Barren Fork River (Warren County), Rainbow Trout. (Mirror omits the Charles Creek and N Barren Fork Creek rows — incomplete render, noted, not relied on.)
- Establishes: 2026 planned spring-only stocking; months March (×2) and May.

## 2. TWRA ArcGIS stocking-site table (primary, high confidence)

- Service: TWRA_Trout_Stocking_Locations ("Trout_MASTER_Project"), services3.arcgis.com org PWXNAH2YKmZY7lBq; retrieved 2026-09-24
- URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0/query?where=UPPER(StreamName)+LIKE+'%25BARREN%25'
- This water — OBJECTID 425:
  - Site_Name: **Pepper Branch Park (S1)**; StreamName: **Barren Fork River**
  - LATITUDE 35.67398963900007, LONGITUDE -85.77670344499995; Region 3, County WARREN, City Mcminnville
  - StockingProgram **Spring**; WaterClass stream; Species rainbow; NumStocked **1700**; Management **City**; HoursOpen "Contact Region 3"; DelayedHarvestSeason empty; GlobalID a16ccd21-d99b-46cb-ab65-6fd8b4992c31
- Same-name separation confirmed: OBJECTID 426 = North Prong Barren Fork River (Petigap Rd) is a different row/water.
- Establishes: one official public site (city park in McMinnville); program = Spring only; coordinates.

## 3. StockedTrout2016 ArcGIS layer (primary; bridges the 2016–2017 schedule gap)

- Service: StockedTrout2016 / "StockedTroutMar2016" (CreationDate 2017-04-17, collector W. Collier); retrieved 2026-09-25
- URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/StockedTrout2016/FeatureServer/0/query (StreamName LIKE %BARREN%)
- OBJECTID 4653: Pepper Branch Park (S1), Barren Fork River, 35.6739896390001 / -85.776703445, Region 3, WARREN, StockingProgram **"Spring Streams"**, rainbow, 1700, Management City, HourAccess24 "Yes", gravel parking >25 spaces.
- Establishes: the main stem was in the 2016-era site inventory as a Spring Streams water — bridges the missing 2016/2017 schedule PDFs at site level.

## 4. Archived TWRA schedule PDFs 2003–2015, state.tn.us era (primary, high confidence)

Base: https://web.archive.org/web/{TIMESTAMP}/http://www.state.tn.us/twra/fish/StreamRiver/stockedtrout/schedYY.pdf ; captures inherited from this project (2003=20030404161556, 2004=20040210011352, 2005=20051124124935, 2006=20060604223344, 2007=20070227143540, 2008=20080909205030, 2009=20090418095714, 2010=20100326100325, 2011=20110111175732, 2012=20120418154111, 2013=20140112202401, 2014=20140412202632, 2015=20150319003402). Row "Barren Fork River", Warren Co. Week-of Sundays below are coordinate-extracted (dx = max distance mark-center to column-center; sequence validated for every year):

| Year | Barren Fork River weeks (week of) | Months |
|---|---|---|
| 2003 | row not located in capture (Charles Creek & N Barren Fork rows = Mar 16, Apr 13, May 4) | (Mar–May by sibling rows) |
| 2004 | row not in Feb-2004 capture (Charles & N Barren rows = Mar 14, Apr 11, May 2, dx 0.0) | (Mar–May by sibling rows) |
| 2005 | Mar 13, Apr 10, May 1 (dx ≤3.8) | Mar–May |
| 2006 | Mar 12, Apr 9, Apr 30 | Mar–Apr |
| 2007 | Mar 11, Apr 8, Apr 29 | Mar–Apr |
| 2008 | Mar 9, Apr 6, Apr 27 | Mar–Apr |
| 2009 | Mar 8, Apr 5, Apr 26 | Mar–Apr |
| 2010 | Mar 21, Apr 18, May 16 (dx 3.3) | Mar–May |
| 2011 | Mar 20, Apr 17, May 15 (dx 3.1) | Mar–May |
| 2012 | Mar 18, Apr 15, May 13 (dx 1.9) | Mar–May |
| 2013 | Mar 17, Apr 14, May 12 (dx 1.9) | Mar–May |
| 2014 | Mar 16, Apr 13, May 11 (dx 3.3) | Mar–May |
| 2015 | Mar 15, Apr 12, May 10 (dx 1.5) | Mar–May |

- Weeks are identical to the Charles Creek row in every year from 2005 on (see charles-creek.md) — the two waters ride the same Region 3 spring runs.
- Correction vs prior pass: prior same-name note read 2018 main-fork weeks as "Mar 18, Apr 8, May 13"; exact geometry gives **Mar 18, Apr 15, May 13** (dx 0.0). The prior character-alignment of the 2003–2015 grids was one column right of true; months verdicts are unaffected.

## 5. Archived TWRA schedule PDFs 2018–2025, tn.gov era (primary, high confidence)

Bullet-grid captures of Trout-Stocking-Schedule-Complete.pdf and friends; md5 checked to defeat replay (2019-20 capture == 2020 capture, md5 d8beba5575041fd222125779f063a5c5 — same document; 2021a≠2021b; 2022a≠2022b; 2024a≠2024b; 2025a/b/c/d all distinct).

| Year | Capture (web.archive.org/web/{ts}/https://www.tn.gov/content/dam/tn/twra/documents/...) | Weeks (week of) | Months |
|---|---|---|---|
| 2018 | 20180717180317 .../2018-Trout-Stocking-Schedule.pdf | Mar 18, Apr 15, May 13 (dx 0.0) | Mar–May |
| 2019 | 20190412221005 .../2019-Trout-Stocking-Schedule.pdf | Mar 17, Apr 14, May 12 (dx 0.0) | Mar–May |
| 2020 | 20200424033427 .../fishing/trout/Trout-Stocking-Schedule-Complete.pdf | Mar 15, Apr 12, May 10 | Mar–May |
| 2021 | 20210217082110 (same Complete URL) | Mar 21, Apr 18, May 16 | Mar–May |
| 2022 | 20220226183421 (same Complete URL) | Mar 20, Apr 17, May 15 | Mar–May |
| 2023 | 20230226083143 (same Complete URL) | Mar 19, Apr 16, May 14 | Mar–May |
| 2024 | 20240222201650 + 20241205181943 (identical marks in both) | Mar 17, Apr 14, May 12 (dx 0.0) | Mar–May |
| 2025 | 20250320072447 (same Complete URL) | Mar 16, Apr 13, May 11 (dx 0.0) | Mar–May |

- Calibration: this method reproduces the prior pass's prong readings exactly for 2018, 2019, 2021, 2022, 2023, 2024, 2025 (e.g., 2024 prong Mar 3/Mar 31/Apr 28) — the same extraction that yields the main-fork rows above.
- 2016–2017: no archived schedule PDF (gap); bridged by section 3.
- Establishes: 21 schedule appearances with weeks (2005–2015, 2018–2025) + 2026 JSON; months = **March, April, May** every year (2 weeks in some Marches in 2026; third week lands in late April in 2006–2009). **No February, June–December week in any year.**

## 6. Completed-release records (destination-level)

a) TWRA "Coldwater Stocking" reports (Region 3 lines; run dates printed on document):
- Run 11-16-2018 (file cw_stocking_2019.txt; URL family https://www.tn.gov/content/dam/tn/twra/documents/Cold%20Water%20Stocking.pdf , Wayback captures e.g. 20180803012203 and 20190109074711): **"Barren Fork River 4/18/2018"**. Establishes a completed 2018 spring release; the Nov run showing the same last-stocked date confirms no summer/fall 2018 stocking.
- Run 04-22-2020 (capture 20200424033438, .../fishing/trout/Cold-Water-Stocking.pdf): **"Barren Fork River 4/15/2020"** (inherited from prior pass of this project; verified there against the archived PDF).
- "Coldwater Trout Stocking Schedule" updated 5/17/2022: **Barren Fork River 04/28/2022**.
- Updated 5/3/2023: **Barren Fork River 04/18/2023**.
- Updated 5/17/2024: **Barren Fork River 05/15/2024**.
- (URL family for the 2022–2024 lists: https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Coldwater-Trout_Stocking-Schedule.pdf — Feb editions are the winter lists; Feb 2022 capture 20220221220911 contains **no Barren Fork entry of any name**.)

b) Recently-stocked feed, archived 2024-06-07: `{Region 3, "Barren Fork River", Stocking Date 05/15/2024}` — https://web.archive.org/web/20240607134309/https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_panel_348017491_c/content/tn_complex_datatable.exceldriven.json?_=1717767789374

c) Live completed feed, retrieved 2026-09-24 (URL https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable.exceldriven.json): only 10 rolling entries (Aug–Sep 2026 tailwater/park stockings) — Barren Fork absent because the window rolled past May 2026; absence is weak evidence, note only.

d) Winter-program tests (contradiction checks): Feb 2022 winter destination list (capture 20220221220911) — no Barren Fork entries; TWRA news "TWRA begins 2025-26 winter trout stocking program" (tn.gov/twra/news/2025/11/26/...) names no Warren County water among its 40+ locations. **No completed December–February release of this water exists in any checked year.**

## 7. Holdover / fishery evidence

- iNaturalist observation 287693201, **2025-06-07, Oncorhynchus mykiss, Frank G Clement Memorial Bridge / Pepper Branch Park, McMinnville** (coords -85.77647, 35.67346 = the stocking site): rainbow present ~4 weeks after the last 2025 schedule week (May 11) — brief post-season persistence, not a year-round fishery. Second observation 327522169, **2018-06-04**, same coords (last 2018 event 5/16/2018 per completed report).
- Fishbrain water page (fishbrain.com/fishing-waters/bo7Lfb58/barren-fork): 856 logged catches, top species bluegill/rock bass/largemouth — **zero logged trout catches**; no stocking/months info.
- Visit McMinnville tourism page (visitmcminnvilletn.com/places-to-play/outdoor-adventure/fishing-trophy-catches-mcminnville): access at Riverfront Park, Pepper Branch Park, Bridge Street ramp; "in the cooler months, keep an eye out for seasonal Rainbow Trout stockings" (tertiary; looser than the schedule record, consistent with spring).
- Middle Tennessee Fly Fishers (middletennesseeflyfishers.org/barren-fork-river.html): rainbow trout among species; wading at the dam in town; 6-mile float; no stocking months.
- No agency survey/management plan for this reach surfaced; no dated winter catch reports found.

## Contradictions

1. Ledger "no months pinned": now pinned **March–May** by 21 schedule years + 2026 JSON + completed dates 4/18/2018, 4/15/2020, 4/28/2022, 4/18/2023, 5/15/2024 (all spring) + zero winter entries.
2. Prior pass's character-column readings of the 2003–2015 grids (and its 2018 "Apr 8" same-name note) were one column right of true; corrected by coordinate extraction with sequence validation. Months verdicts unchanged except the third week sits in late April (not May) in 2006–2009.
3. mywaterlevel.com mirror omits 2 of 3 Warren waters (incomplete render) — its Barren Fork River rows do match the primary JSON.
4. Same-name risk (persistent): "N Barren Fork Creek" (North Prong) and "Charles Creek" rows sit adjacent to this water in the same grids and feeds; completed lists print "North Barren Fork Creek" separately — kept distinct throughout.

## Searches run (2026-09-25)

1. "Barren Fork River" McMinnville Tennessee trout stocking TWRA (rate-limited, no results)
2. "Barren Fork River" McMinnville trout fishing — surfaced visitmcminnvilletn.com, middletennesseeflyfishers.org, fishbrain.com, onwaterapp.com
3. Barren Fork River McMinnville fishing report rainbow trout 2025 — no dedicated report
4. "Pepper Branch Park" trout McMinnville (rate-limited)
5. "Barren Fork" Tennessee "winter trout" OR "trout stocking" McMinnville months — surfaced mywaterlevel.com mirror + TWRA 2025-26 winter program news
6. "Barren Fork" McMinnville fishing tennesseefishingspots OR doubledfly OR piscamaps — tennesseefishingspots.com (Riverfront Park pier), piscamaps Collins River page
7. youtube OR reddit Barren Fork River McMinnville trout fishing dam greenway — reddit r/kayakfishing thread (2014)
8. Barren Fork River watershed management plan McMinnville trout stocking Hickory Creek — no trout-stocking plan content
9. Fetches: middletennesseeflyfishers.org/barren-fork-river.html; visitmcminnvilletn.com trophy-fishing page; fishbrain.com Barren Fork page; mywaterlevel.com/stocking/tennessee/; tn.gov TWRA winter-program news
Dataset pulls: 2026 schedule JSON; 2026 completed feed; TWRA_Trout_Stocking_Locations + StockedTrout2016 ArcGIS queries; 15 archived schedule PDFs (2003–2015, 2018–2025) re-extracted with coordinate+sequence validation; 5 completed-report editions; 2024 archived recently-stocked feed.

## Recommendation

**seasonal-stocked-trout** — months supported by evidence: **March, April, May** (core pattern: one mid-March week, one mid-April week, one mid-May week; 2026 = 3/15 + 3/22 + 5/10; 2006–2009 third week fell in late April). No schedule year 2003–2026 and no completed-release record shows this water in February or June–December. Full "trout" (resident fishery) is not supported: zero logged trout catches on Fishbrain, only post-stocking June iNat sightings, ~1700 rainbows/yr in 3 spring weeks at one city-park site. Keep strictly separate from "N Barren Fork Creek" (North Prong) rows.
