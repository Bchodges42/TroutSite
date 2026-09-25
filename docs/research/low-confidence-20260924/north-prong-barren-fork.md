# Research log: North Prong Barren Fork River (Warren County, TN)

- Water: North Prong Barren Fork River — TWRA-stocked upper prong of the Barren Fork, Collins River drainage near McMinnville. TWRA schedule name: **"N Barren Fork Creek"**; TWRA site table name: **"North Prong Barren Fork River"**.
- Ledger state at start: seasonal-stocked-trout (2026 spring weeks 3/22 and 4/26, rainbow); catalog Dec/Jan/Feb winter claim suspected contradicted.
- SAME-NAME RISK tracked: main Barren Fork River (McMinnville, also spring-stocked) is a DIFFERENT stocked water; Barren Fork, KY is unrelated.
- All retrievals: 2026-09-24. This is schedule/program research only; no agency contact.
- Method note: archived schedule PDFs are weekly grids ("WEEK OF", dates are Sundays; event happens within 5 days after). X/bullet marks were mapped to month columns by character-position alignment of month labels and week-date numbers (pdftotext -layout / PyMuPDF coordinates). Week dates below are the schedule's "week of" Sundays.

---

## 1. LIVE 2026 TWRA schedule JSON (primary, high confidence)

- Title: Trout Information & Stockings — 2026 schedule data table (616 rows)
- Org: Tennessee Wildlife Resources Agency (TWRA), Region 3 Warren County rows
- Observation date: current 2026 season data; retrieved 2026-09-24
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json (tn.gov blocks plain curl; fetched with browser User-Agent)
- Rows for this water:
  - `{REGION 3, COUNTY Warren, LOCATION "N Barren Fork Creek", TYPE "Seasonal", STOCKING WEEK 3/22/2026, SPECIES Rainbow Trout}`
  - `{REGION 3, Warren, "N Barren Fork Creek", Seasonal, week 4/26/2026, Rainbow Trout}`
- Same-name rows (different water, kept separate): `"Barren Fork River"` Warren — Seasonal weeks 3/15, 3/22, 5/10/2026 (3 rows).
- TYPE taxonomy on page: Winter / Seasonal / Delayed Harvest / Tailwater / Reservoir / Weekly. **All 9 Warren County rows are TYPE "Seasonal"; zero "Winter" rows for Warren County in 2026.**
- Establishes: 2026 spring-only planned stocking for N Barren Fork Creek; no winter program.

## 2. TWRA ArcGIS stocking-site table (primary, high confidence)

- Service: TWRA_Trout_Stocking_Locations (feature layer "Trout_MASTER_Project"), services3.arcgis.com org PWXNAH2YKmZY7lBq; retrieved 2026-09-24
- URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0/query?where=UPPER(StreamName) LIKE '%BARREN%'
- This water — OBJECTID 426:
  - Site_Name: **Petigap Rd. Bridge Crossing (S1)**; StreamName: **North Prong Barren Fork River**
  - LATITUDE 35.69765471100004, LONGITUDE -85.95595626399995 (display lat_long 35.69766, -85.95596)
  - Region 3, County WARREN, City Mcminnville; StockingProgram **Spring**; WaterClass stream; Species rainbow; NumStocked 800; Management **Private Land**; HoursOpen "Contact Region 3"; DelayedHarvestSeason/DayClosure: empty; GlobalID aefa18f1-a676-43c8-876f-d0e4e2a60089
- Same-name comparison site — OBJECTID 425: Pepper Branch Park (S1), Barren Fork River, 35.67398963900007 / -85.77670344499995, McMinnville, Spring, rainbow, 1700, Management City, GlobalID a16ccd21-d99b-46cb-ab65-6fd8b4992c31
- Establishes: official site-level record naming the water "North Prong Barren Fork River"; program = Spring only; single access (Petigap Rd bridge) on private land; coordinates.

## 3. StockedTrout2016 ArcGIS layer (primary, fills 2016–17 gap, high confidence)

- Service: StockedTrout2016 / layer "StockedTroutMar2016" (CreationDate 2017-04-17, collector W. Collier)
- URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/StockedTrout2016/FeatureServer/0 (query StreamName LIKE BARREN); retrieved 2026-09-24
- OBJECTID 4654: Petigap Rd. Bridge Crossing (S1), **North Prong Barren Fork River**, 35.697654711 / -85.955956264, StockingProgram **"Spring Streams"**, rainbow, 800, Private Land, GlobalID 02c7881d-f431-49f4-837e-46859847a9bc
- Establishes: same water/site in the 2016-era site inventory as a Spring Streams water — bridges the missing 2016/2017 schedule years at site level.

## 4. Archived TWRA schedule PDFs 2003–2015, state.tn.us era (primary, high confidence)

All at base https://web.archive.org/web/{TIMESTAMP}/http://www.state.tn.us/twra/fish/StreamRiver/stockedtrout/schedYY.pdf ; retrieved 2026-09-24. Row: "N Barren Fork Creek" (2004 prints "North Barren Fork Creek"), Region 3, Warren County. Main "Barren Fork River" row noted for same-name separation.

| Year | Capture | N Barren Fork weeks (week of) | Months |
|---|---|---|---|
| 2003 | 20030404161556 | Mar 23, Apr 27, May 25 | Mar–May |
| 2004 | 20040210011352 | Feb 1, Mar 7, Mar 21, Apr 11 | Feb–Apr (one late-winter week) |
| 2005 | 20051124124935 | Mar 20, Apr 17, May 15 | Mar–May |
| 2006 | 20060604223344 | Mar 19, Apr 23, May 21 | Mar–May |
| 2007 | 20070227143540 | Mar 18, Apr 22 | Mar–Apr |
| 2008 | 20080909205030 | Mar 16, Apr 20 | Mar–Apr |
| 2009 | 20090418095714 | Mar 15, Apr 19, Jul 12 | Mar–Apr + July bonus |
| 2010 | 20100326100325 | Mar 14, Apr 18, May 30 | Mar–May |
| 2011 | 20110111175732 | listed, ZERO weeks | not stocked per schedule |
| 2012 | 20120418154111 | listed, ZERO weeks | not stocked per schedule |
| 2013 | 20140112202401 | Mar 3, Apr 7, Jul 14 | Mar–Apr + July bonus |
| 2014 | 20140412202632 | Mar 9, Apr 13, May 18 | Mar–May |
| 2015 | 20150319003402 | Mar 8, Apr 12, Jul 12 | Mar–Apr + July bonus |

(Same-name check: "Barren Fork River" row present most years with its own spring weeks — e.g., 2018 Mar 18/Apr 8/May 13 — a separate stocked water throughout.)

## 5. Archived TWRA schedule PDFs 2018–2025, tn.gov era (primary, high confidence)

Layout switched to bullet (●) marks; positions extracted via PyMuPDF. All "Trout-Stocking-Schedule-Complete.pdf" captures carry a title line naming the year (verified per capture).

| Year | Capture | URL (web.archive.org/web/{ts}/https://www.tn.gov/content/dam/tn/twra/documents/...) | N Barren Fork weeks | Months |
|---|---|---|---|---|
| 2018 | 20180717180317 | .../2018-Trout-Stocking-Schedule.pdf | Mar 4, Apr 1, Apr 29 | Mar–Apr |
| 2019 | 20190412221005 | .../2019-Trout-Stocking-Schedule.pdf | ~Mar 3, Mar 31, Apr 28 | Mar–Apr |
| 2020 | 20200424033427 | .../fishing/trout/Trout-Stocking-Schedule-Complete.pdf | Feb 23 or Mar 1 (boundary column), Mar 22, Apr 19 | late Feb/Mar–Apr |
| 2021 | 20210217082110 | .../fishing/trout/Trout-Stocking-Schedule-Complete.pdf | Mar 7, Apr 4, May 2 | Mar–May |
| 2022 | 20220226183421 | (same Complete URL) | Mar 6, Apr 3, May 1 | Mar–May |
| 2023 | 20230226083143 | (same Complete URL) | Mar 5, Apr 2, Apr 30 | Mar–Apr |
| 2024 | 20240222201650 | (same Complete URL) | Mar 3, Mar 31, Apr 28 | Mar–Apr |
| 2024 (Dec re-capture) | 20241205181943 | (same Complete URL) | identical to Feb 2024 capture — no winter weeks added | Mar–Apr |
| 2025 | 20250320072447 | (same Complete URL) | Mar 2, Mar 30, Apr 27 | Mar–Apr |

- 2016–2017: no archived schedule PDF located (gap); bridged by StockedTrout2016 site layer (section 3).
- Establishes: 23 consecutive schedule appearances (2003–2015, 2018–2025) plus 2026; months = **March–May core, occasionally one February week (2004) or July bonus weeks (2009/2013/2015), never December/January**.

## 6. Independent mirror of 2023 schedule (secondary corroboration, medium-high confidence)

- eregulations.com hosted PDF "TENTATIVE TROUT STOCKING SCHEDULE FOR 2023"; retrieved 2026-09-24
- URL: https://www.eregulations.com/assets/docs/resources/TN/Trout_Stocking.pdf
- Shows "N Barren Fork Creek" with 3 spring week marks (Mar/Apr). CAVEAT: this render's COUNTY column is garbled for some rows (prints Campbell/Carter/Blount against Region 3 streams); stream rows and week marks are usable, county labels are not. Corroborates section 5's 2023 row; archived TWRA PDF remains primary.

## 7. Completed-release records (destination-level)

a) TWRA "Coldwater Stocking" reports (run dates printed on document):
- Run 06-01-2018 (capture 20180803012203) and same data in run 11-30-2018 (capture 20190109074711): URL https://web.archive.org/web/20180803012203/https://www.tn.gov/content/dam/tn/twra/documents/Cold%20Water%20Stocking.pdf — Region 3: **"North Barren Fork Creek — 5/16/2018"** (and Barren Fork River 4/18/2018). Establishes a completed 2018 release; the Nov 30, 2018 re-run showing the same last-stocked date confirms no summer/fall 2018 stocking.
- Run 04-22-2020 (capture 20200424033438): URL https://web.archive.org/web/20200424033438/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Cold-Water-Stocking.pdf — Region 3: **"North Barren Fork Creek — 3/31/2020"** (Barren Fork River 4/15/2020). Establishes completed 2020 spring release.

b) Recently-stocked feed, archived 2024-06-07 (54 destinations):
- URL: https://web.archive.org/web/20240607134309/https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_panel_348017491_c/content/tn_complex_datatable.exceldriven.json?_=1717767789374
- Only Barren row: `{Region 3, "Barren Fork River", Stocking Date 05/15/2024}` — the MAIN river. **No "N Barren Fork Creek" row** in that feed window (2026 and 2024 schedules show the prong stocked 2–3×/yr vs main 3×; feed is a point-in-time snapshot, absence is weak evidence, note only).

c) Winter-program destination lists (contradiction test):
- "Coldwater Trout Stocking Schedule" updated 2/18/2022 (capture 20220221220911): https://web.archive.org/web/20220221220911/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Coldwater-Trout_Stocking-Schedule.pdf — Jan–Feb 2022 city-park/tailwater list (Billy Dunlap, Marrowbone, Dale Hollow TW...). **No Barren Fork entries of any name.**
- The two "Coldwater Stocking" reports above: the only Barren dates are Mar–May (spring), never Dec–Feb.
- Note: the prompt's "winter-trout-stocking-report.pdf" captures (20181013005431 / 20200126081311) were not resolvable to that exact filename; the equivalent winter-program artifacts found and checked are the 2018/2019/2020 Coldwater Stocking reports and the Feb 2022 winter list. None include this water as a winter destination.

## 8. Holdover / fishery evidence beyond stocking weeks

- NONE found. No agency survey, management plan, or statement about the North Prong specifically (it never appears in Region 4 coldwater reports; Region 3 coldwater report PDFs on Wayback cover R4 waters).
- PiscaMaps water page lists "North Prong Barren Fork River" as a separate nearby water with rainbow trout among species (derived from TWRA data; no stocking dates): https://piscamaps.com/us/tennessee/rivers/barren-fork-river
- Middle Tennessee Fly Fishers club page covers only the MAIN Barren Fork (species: rainbow trout, bream, catfish, smallmouth bass; wading at the dam in town; no stocking months; no North Prong mention): https://www.middletennesseeflyfishers.org/barren-fork-river.html
- No dated angler catch reports for the North Prong surfaced (forums/YouTube/Fishbrain searches rate-limited or empty). Site-level "Private Land / Contact Region 3" access implies minimal public fishery.
- The catalog's Dec/Jan/Feb claim therefore has NO completed-release, schedule, or winter-program support in any year 2003–2026.

## Contradictions

1. Catalog winter (Dec–Feb) claim: CONTRADICTED by all 21 annual schedules checked (2003–2015, 2018–2025, 2026), the 2026 TYPE=Seasonal designation, zero Warren "Winter" rows, and winter-program destination lists without this water. Only exceptions inside the spring program: a Feb 1 week in 2004 and a boundary column in 2020 (Feb 23 vs Mar 1).
2. Same-name risk confirmed real and persistent: "Barren Fork River" is stocked separately every year (e.g., 2026 weeks 3/15, 3/22, 5/10 vs prong 3/22, 4/26; 2024 feed shows main stocked 5/15/2024). Any feed/mirror row named "Barren Fork River" must not be attributed to the North Prong. (KY Barren Fork unrelated — different state program.)
3. Minor: eregulations mirror garbles county labels; 2026 JSON has 3 main-river weeks vs the ledger's "spring" note — main and prong week counts differ most years.

## Searches run (2026-09-24)

Productive/partial:
1. "North Prong Barren Fork" trout — no relevant web results (tiny-water signal)
2. "Barren Fork" McMinnville trout stocking TWRA — tennesseefishingspots.com, doubledfly.com mentions (main river)
3. "North Barren Fork Creek" OR "North Prong Barren Fork" fishing Warren County — Wikipedia geography, piscamaps, onwaterapp
4. Petigap Road Barren Fork McMinnville — realty listings confirm Petigap Rd properties join the Barren Fork
5. youtube Barren Fork trout McMinnville Tennessee fishing — no prong videos
6. reddit "Barren Fork" trout Tennessee — tndeer.com thread (main-fork listing, undated)
7. "Barren Fork" Tennessee trout catch rainbow McMinnville 2023 — no dated catch reports
8. "Collins River" trout stocking McMinnville TWRA months — doubledfly Collins River page (no prong info)
9. "Barren Fork" Tennessee delayed harvest trout regulation — surfaced live tn.gov page snippet showing "N Barren Fork Creek" among destinations and TYPE list; no DH designation for this water in primary data (ArcGIS DelayedHarvestSeason empty)
10. TWRA trout stocking schedule 2026 "N Barren Fork" OR "Barren Fork River" week — TWRA magazine note "Winter Trout Stocking Begins" (program exists; no prong connection)

Rate-limited (429), unproductive attempts:
11. "North Prong Barren Fork" trout stocking Tennessee
12. "N Barren Fork" TWRA trout stocking schedule
13. TWRA winter trout stocking 2018-2019 list Tennessee parks
14. Fishbrain Barren Fork Tennessee trout catches
15. "Barren Fork" Kentucky trout stocking (disambiguation)

Dataset pulls (not searches): 2026 schedule JSON; TWRA_Trout_Stocking_Locations + StockedTrout2016 ArcGIS queries; Wayback CDX discovery + 13 state.tn.us schedule PDFs (2003–2015); 2018/2019 schedule PDFs; 8 captures of Trout-Stocking-Schedule-Complete.pdf (2020–2025 incl. Dec 2024); 3 Coldwater Stocking reports (2018×2, 2020); Feb 2022 winter list; archived recently-stocked JSON; eregulations 2023 mirror.

## Recommendation

**seasonal-stocked-trout** — months supported by evidence: **March, April, May** (core), with rare program-internal extensions: one February week (2004), a boundary late-Feb/early-Mar week (2020), and July bonus weeks (2009, 2013, 2015). Two schedule years (2011, 2012) list the water with zero weeks. **December and January are contradicted in every checked year (2003–2026).** Full "trout" (resident fishery) is not supported: no holdover/survey/catch evidence exists; access is a single private-land bridge crossing (Petigap Rd, 35.69766, -85.95596); program volume ~800 rainbows in 2–3 spring weeks. Not "unresolved": 21 schedule years + site records + completed releases (5/16/2018, 3/31/2020) are consistent. Keep strictly separate from main Barren Fork River rows.
