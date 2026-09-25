# McCutcheon Creek (Spring Hill, Maury/Williamson County, TN) — Trout-Stocking Evidence Research Log

Water: McCutcheon Creek, Spring Hill, TN (stream straddling the Maury/Williamson county line; USGS monitoring station on it; Duck River tributary).
Research date: 2026-09-25 (all retrievals this date unless noted).
Task: KNOWN that Maury County's only trout records geocode to McCutcheon Creek's winter program (city-pond context). CHASE: schedule months per year (Dec–Feb or wider?), GIS site coords, verdict.

## IDENTITY / COORDINATES

- TWRA ArcGIS stocking-site layer (TWRA_Trout_Stocking_Locations; local dump completion/arcgis_all.json, retrieved 2026-09-24/25): OBJECTID 652 — Site_Name "Mccutcheon Creek", StreamName "Mccutcheon Creek", County MAURY, City "Spring Hill", StockingProgram "Winter", WaterClass "stream", Species "rainbow", NumStocked 1450, Management "City", lat 35.732253916, lon -86.924202465.
- NHD (hydro.nationalmap.gov/arcgis/rest/services/nhd/MapServer/4, envelope -87.05..-86.75 / 35.60..35.90, retrieved 2026-09-25): McCutcheon Creek GNIS 1293235, 8 reachcodes 060400030012xx (HUC 06040003, Duck River basin), total ~9.5 km, near Spring Hill. (A same-named GNIS 631865 creek exists out-of-state — do not confuse.)
- USGS (waterservices.usgs.gov, retrieved 2026-09-25): 03599970 "MCCUTCHEON CREEK NEAR SPRING HILL, TN" (35.72785, -86.92445, HUC 06040003) — 0.49 km SW of the TWRA site; also tributary monitoring site 035999689 (1.35 sq mi). Gauge = stream monitor, not a biological station.
- City context: the creek runs through Spring Hill city parkland (Duplex Rd/SR-396 corridor; iNat observations geolocate to "SR-396 E" and "Kedron Rd", Spring Hill); Management="City" in TWRA's layer. No "city pond": TWRA's own WaterClass is "stream"; the pond named in some catalog contexts is not in any TWRA doc found.

## A. SCHEDULE / PROGRAM EVIDENCE (planned) — months by year

The McCutcheon Creek program belongs to TWRA's WINTER trout program. It NEVER appears in the annual "Trout Stocking" schedules (Feb–Oct seasonal grid; verified absent from every cached annual 2003–2025 by text search) — it appears in winter program documents.

| Season | Source | Events (dated) | Months supported |
|---|---|---|---|
| 2015-16 | The Tennessean "Outdoors calendar: Trout stocking resumes Friday" (Jan 6, 2016; snippet via WebSearch) | "Jan. 22. TWRA winter trout stocking in McCutcheon Creek in Spring Hill" | Jan |
| 2016-17 | The Tennessean (Feb 27, 2017; snippet via WebSearch): "Winter trout stocking Thursday in Springfield, Friday in Spring Hill" | Spring Hill (McCutcheon) late Feb | Feb |
| 2017-18 | Tennessee-winter-trout-stocking-report.pdf, updated 03/08/2018 (Wayback capture 20180712194049; positional extraction) | 12/8/2017; 1/19/2018; 2/16→2/21/2018 (rescheduled, high water); 3/16/2018 | Dec–Mar |
| 2018-19 | Winter Trout Stocking (2018-2019) report (winter-trout-stocking-report.pdf captures 20181013005431/20190412221001; positional extraction) | 12/7/2018; 1/18/2019; 2/15/2019; 3/15/2019 | Dec–Mar |
| 2019-20 | Winter Trout Stocking (2019-2020) report (capture 20191023163741) + winter-trout-schedule.pdf (capture 20200809113424) | 12/13/2019; 1/24/2020 (rescheduled 1/28/2020); 2/21/2020; 3/13/2020 | Dec–Mar |
| 2020-21 | Winter Trout Stocking (2020-2021) schedule (winter-trout-schedule.pdf capture 20210513061048, utm-govdelivery variant) | 12/18/2020; 1/22/2021; 2/19/2021 "Canceled (added to March Stocking)"; 3/12/2021 | Dec–Mar |
| 2021-22 | "Coldwater Trout Stocking Schedule updated 2/18/2022" (Coldwater-Trout_Stocking-Schedule.pdf capture 20220221220911; local ts2022cold.txt) | "2 McCutcheon Creek 01/26/2022" | Jan (doc as of mid-Feb; full-season list not archived) |
| 2022-23 | GAP at row level. Program-level: Chattanoogan.com "2022-23 TWRA Winter Trout Stocking Program Underway" (Dec 8, 2022; ~75,000 rainbow, 40+ waters statewide); no archived schedule page/PDF with McCutcheon row located | — | Dec–Mar presumed, unproven |
| 2023-24 | GAP at row level (Dec-2023 capture of tn.gov/twra/fishing/trout-information-stockings/ (20231214083319) lacks the JS-loaded table; no winter PDF archived) | — | unproven |
| 2024-25 | TWRA-Winter-Trout-Schedule.pdf (capture 20241120115437) | 12/20/2024; 1/24/2025; 2/21/2025; (3/2025 March events on later pages) | Dec–Mar |
| 2025-26 | Live 2026 schedule JSON | "STOCKING DAY": 1/23/2026; 2/20/2026; "TBD 12/2026"; TYPE "Winter" | Dec(–tbd), Jan, Feb (+Mar per program) |

A1. TWRA live 2026 Trout Stocking Schedule JSON (tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json; cached completion/trout_2026_live.json, retrieved 2026-09-25). Verbatim: {"REGION":"2","COUNTY":"Maury","LOCATION":"McCutcheon Creek","TYPE":"Winter","STOCKING DAY":"1/23/2026"|"2/20/2026"|"TBD 12/2026","SPECIES":"Rainbow Trout"}. Maury County's ONLY rows in the entire 616-row schedule. Confidence HIGH (agency primary, current). Establishes: McCutcheon Creek is Maury County's sole scheduled trout water, TYPE Winter, rainbow, Dec-Feb days.

## B. COMPLETED / DESTINATION-LEVEL FEEDS

B1. "Coldwater Stocking" list updated 11-16-2018 (local cw_stocking_2019.pdf): "McCutcheon Creek 3/16/2018" — last stocking of the 2017-18 season, matching the report row (completed). HIGH.
B2. "Trout Stocking Report updated as of 3/21/2025" (scheds/stockreport-202503.pdf): "2 McCutcheon Creek 02/24/2025" — completed Feb 2025 event. HIGH.
B3. Dec-2024 live winter page (tw-20241208155225.html, capture 20241208155225) and Jan-2025 capture (tw-20250114154240.html) contain "McCutcheon Creek" adjacent to 12/26/2024-class dates in the flattened aggregation; pairing unreliable — not used as evidence (the authoritative 12/20/2024 date comes from B-schedule PDF).
B4. Live Sept-2026 stockings page (stockings-live-raw.html, retrieved 2026-09-25) lists "McCutcheon Creek" among destination options and in the wordcloud near "11/29/2026"; table is JS-loaded, pairing unreliable — not used.

## C. INDEPENDENT OBSERVATIONS

C1. iNaturalist Oncorhynchus mykiss within 3 km of TWRA site (35.7323,-86.9242), API query 2026-09-25: total 16 — 9 observed 2020-12-19 and 7 observed 2021-01-23 (e.g., https://www.inaturalist.org/observations/68500771, 107177349), places "SR-396 E, Spring Hill" / "Kedron Rd". Research-grade; exact mid-winter dates right after the documented 12/18/2020 and 1/22/2021 plants. GBIF mirror (api.gbif.org, bbox -86.95..-86.90 / 35.71..35.76): 12 records (2020, 2021), all at ≈ -86.9242, 35.7322 = the TWRA site point.
- Type: dated public observations. Confidence: MEDIUM-HIGH. Establishes: live rainbows at the stocking site in Dec/Jan 2020-21. No summer observations (persistence not shown; expected for a put-and-take winter water).

## D. NEWS / SECONDARY

D1. The Tennessean outdoors calendars (Jan 6, 2016; Feb 27, 2017) — snippet-level (rate-limited, articles paywalled). Confidence MEDIUM.
D2. Williamson Scene "Trout are back in Harpeth River" (Oct 1, 2019, williamsonscene.com): angler "usually found casting closer to his Spring Hill home near McCutcheon Creek" — local fishery corroboration. Confidence MEDIUM.
D3. Experience Maury (experiencemaury.com/listing/mccutcheon-creek/, fetched 2026-09-25): "A small stream that offers seasonal trout fishing opportunities"; TWRA-managed; rainbow trout; stocked "during the colder months when water temperatures are suitable"; Spring Hill TN 37174. Confidence MEDIUM (tourism listing, undated page).
D4. Fishbrain (fishbrain.com, surfaced in search): McCutcheon Creek ~42 logged catches incl. rainbow trout, largemouth bass, bluegill; spans Maury/Williamson. Confidence LOW-MEDIUM (anglers' app).
D5. Restoration history (TN Environmental Council via search snippet): creek on 303(d) list by 2002, ~20-year restoration. Context only.

## E. SEARCHES RUN (2026-09-25)

1. WebSearch "McCutcheon Creek Spring Hill Tennessee trout stocking TWRA" → Fishbrain stats; Tennessean Feb 27 2017 lead
2. WebSearch "'McCutcheon Creek' Spring Hill trout fishing" → Williamson Scene Oct 2019
3. WebSearch "Spring Hill Tennessee city pond trout stocking McCutcheon Park" → Tennessean Jan 6 2016 calendar (Jan 22, 2016 event); Chattanoogan Jan 4 2018 lead
4. WebSearch "'McCutcheon Creek Nature Park' Spring Hill" → USGS-03599970; 303(d)/restoration context
5. WebSearch (2 attempts) Tennessean Feb-2017 article detail → rate-limited/paywalled, snippet only
6. iNaturalist API: trout within 3 km of site (2 queries: 16 obs; dates)
7. GBIF API: Oncorhynchus mykiss bbox (12 records at site point)
8. USGS waterservices: station 03599970 lookup + bbox station search
9. NHD MapServer 4: spatial query for McCutcheon Creek (GNIS 1293235)
10. Wayback CDX: winter-trout-stocking-report.pdf; winter-trout-schedule.pdf (3 captures); TWRA-Winter-Trout-Schedule.pdf; Coldwater-Trout_Stocking-Schedule.pdf; tn.gov winter/cold prefix sweep; trout-information-stockings page captures 2021-2026 (only 4 with status 200)
11. PDF pulls + positional extraction: winter_report_2016-18, winter_trout_2018, winter_trout_2019 (fetched), winter_sched_2020aug, winter_sched_2020-21, winter_sched_2024-25; ts2022cold; cw_stocking_2019; stockreport-202503
12. WebFetch experiencemaury.com listing
13. Cached: arcgis_all.json; trout_2026_live.json; tw-20241208155225.html; tw-20250114154240.html; tw-20231214.html (fetched, empty table); stockings-live-raw.html
Unproductive: NewsChannel9/WATE Chattanoogan Dec-2022 full schedule pages (URLs not retrievable); tw-20250324085906 page fetch (0 bytes); 2022-23 and 2023-24 row-level schedules not archived.

## VERDICT

- Species: Rainbow Trout only.
- Type: TWRA winter put-and-take (TYPE "Winter", StockingProgram "Winter", Management "City", NumStocked 1450). Confidence: HIGH.
- Months supported per season with row-level evidence: **December, January, February, March** (typically 3-4 events/season; March events documented 2018, 2019, 2020, 2021; February documented 2017, 2018, 2019, 2020, 2022(list date), 2025; December documented 2017, 2018, 2019, 2020, 2024; January documented 2016, 2018, 2019, 2020, 2021, 2022, 2026). Season-level gaps (row-level): 2022-23, 2023-24 (program confirmed statewide both winters; McCutcheon rows not archived).
- Contradictions: none with agency data. Note the site layer county is MAURY (city of Spring Hill straddles Maury/Williamson; the creek lies mostly in Maury at the site point). The "city pond" framing is not supported by TWRA docs — WaterClass is "stream"; if the catalog row is a pond, it is wrong, the water is the creek.
- Not established: whether the trout persist past spring (no warm-season observations; warmwater assemblage — bass/bluegill per Fishbrain — dominates the rest of the year); row-level 2022-23/2023-24 events.

## RECOMMENDATION

Classify McCutcheon Creek as **seasonal-stocked with months [12,1,2,3]** (December–March winter program; peak evidence Dec-Feb, March events documented 4 of the last 10 archived seasons). The catalog's [12,1,2] is close but should extend March or at minimum be labeled Dec–Feb "with occasional early-March events"; TWRA's own current TYPE is "Winter" and the 2026 rows are 1/23, 2/20 + TBD 12/2026. This is the sole trout water in Maury County per the 2026 schedule.
