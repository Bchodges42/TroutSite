# East Fork Shoal Creek (Lawrence County, TN) — Trout-Stocking Evidence Research Log

Water: East Fork Shoal Creek, Lawrence County, TN — GNIS 1302998, ~5.8 km tributary of Shoal Creek flowing through Lawrenceburg (joins the main stem in/near town). NHD flowlines confirmed in Lawrence envelope (HUC 06030005, Lower Elk). THIS LOG COVERS THE FORK ITSELF (the scheduled water); main-stem Shoal Creek evidence is in low-confidence/shoal-creek.md.
Research date: 2026-09-25 (all retrievals this date, unless noted as prior-pass).
Task: give the fork its own verdict. Catalog months [12,1,2] are SUSPECT for this water. Verify the fork's schedule rows (sites "Park" and "Water Plant") per year 2003–2026.

## IDENTITY / COORDINATES

- TWRA ArcGIS stocking-site layer (TWRA_Trout_Stocking_Locations, 730 sites; local dump completion/arcgis_all.json, originally services3.arcgis.com/PWXNAH2YKmZY7lBq/.../TWRA_Trout_Stocking_Locations/FeatureServer/0/query, retrieved 2026-09-24/25):
  - OBJECTID 589: Site_Name "Park", StreamName "East Fork Shoal Creek", Lawrence, Lawrenceburg, StockingProgram "Spring", WaterClass "stream", Species "rainbow", NumStocked 1000, Management "County", 35.230797, -87.329459.
  - OBJECTID 590: Site_Name "Water Plant", StreamName "East Fork Shoal Creek", Lawrence, Lawrenceburg, "Spring", rainbow, 1000, "County", 35.243482, -87.346371. ("Water Plant" = municipal water-plant reach, 0.71 km SE of courthouse; "Park" 1.55 km — generic TWRA site names; nearest OSM park to 589 = Veteran's Park, LEAD not confirmed.)
- NHD (hydro.nationalmap.gov/arcgis/rest/services/nhd/MapServer/4, retrieved 2026-09-25): East Fork Shoal Creek GNIS 1302998 in Lawrence County envelope; separate from main-stem Shoal Creek (GNIS 153439) and West Fork (GNIS 1274189). No Shoal-named stream exists in Dickson County (prior pass verified) — county attribution is Lawrence only.
- 2026 live schedule rows carry no site split (destination-level "East Fork Shoal Creek"); the fork's two sites are only distinguishable in the ArcGIS layer.

## A. SCHEDULE EVIDENCE (planned rows) — months by year

Method: local PDF cache (completion/scheds/) of Wayback/state.tn.us captures; grid extraction with pdfplumber word coordinates mapping each X/● mark to the week-of column and month header (script completion/grid3.py). Weeks are "week of" Sundays; event occurs within 5 days after. Week-day numbers below are the printed week-of day numbers.

| Year | Source (capture) | Rows | Months supported |
|---|---|---|---|
| 2003 | sched03.pdf (state.tn.us, capt 20030404161556) | 4 X's (prior pass: 1 Feb wk + 3 spring) | Feb + Mar–May |
| 2004 | sched04.pdf | 4 X's (X positions ≈ wks 2/29, 3/21, 4/18, 5/2-30 band) | Feb–May |
| 2005 | sched05.pdf | wks 3/20, 4/17, 5/8, 5/29 | Mar–May |
| 2006 | sched06.pdf | wks 3/19, 4/16, 5/7, 5/28 | Mar–May |
| 2007 | sched07.pdf | wks 2/18, 3/18, 4/15, 5/6, 5/27 (5) | Feb–May |
| 2008 | sched08.pdf | wks 2/17, 3/16, 4/13, 5/4, 5/25 (5) | Feb–May |
| 2009 | sched09.pdf + sched09b.pdf | wks 2/15, 3/15, 4/12, 5/3, 5/24 (5) | Feb–May |
| 2010 | sched10.pdf | wks 3/14, 4/11, 5/16, 6/6 (4) | Mar–Jun |
| 2011 | sched11.pdf | wks 3/13, 4/10, 5/15, 6/5 (4) | Mar–Jun |
| 2012 | sched12.pdf | wks 3/11, 4/8, 5/13, 6/3 (4) | Mar–Jun |
| 2013 | sched13.pdf | wks 3/10, 4/7, 5/12, 6/2 (4) | Mar–Jun |
| 2014 | sched14b.pdf | wks 3/9, 4/6, 5/11, 6/1 (4) | Mar–Jun |
| 2015 | sched15b.pdf | wks 3/8, 4/5, 5/10, 5/31 (4) | Mar–May |
| 2016 | sched2016.pdf ("2016 TWRA Tentative") | wks 3/13, 4/10, 5/15, 6/5 (4) | Mar–Jun |
| 2017 | sched2017.pdf ("2017 TWRA Streams Trout Stocking Schedule") | wks 3/12, 4/9, 5/14, 6/4 (4) | Mar–Jun |
| 2018 | ts2018.pdf / sched2018.pdf ("Trout Stocking (2018)") | 4 ● (wks ≈ 3/11, 3/4-18, 4/15, 5/6) | Mar–May |
| 2019 | ts2019.pdf / ts2019b.pdf ("Trout Stocking (2019)") | 4 ● (wks ≈ 2/10, 3/10, 4/14, 5/5) | Feb–May |
| 2020 | cp-20180717180317.pdf & cp-20190109035923.pdf (both replay "Trout Stocking (2020)" — replay trap; prior pass also used capture 20200424033427 of Trout-Stocking-Schedule-Complete.pdf) | 4 ● (wks ≈ 2/9, 3/8, 4/12, 5/31) | Feb–May |
| 2021 | cp-20210119123626.pdf & cp-20210820055911.pdf ("Trout Stocking (2021)") | 4 ● (wks ≈ 3/14, 4/11, 5/16, 6/6) | Mar–Jun |
| 2022 | cp-20220221215138.pdf & cp-20220519194927.pdf ("Trout Stocking (2022)") | 5 ● (wks ≈ 2/20, 3/13, 3/27, 4/17, 5/15) | Feb–May |
| 2023 | cp-20230220040610.pdf ("Trout Stocking (2023)") | 5 ● (wks ≈ 2/19, 3/12, 3/26, 4/16, 5/7) | Feb–May |
| 2024 | cp-20240219225857.pdf & cp-20240520075643.pdf ("Trout Stocking (2024)") | 5 ● (wks ≈ 2/18, 2/25, 3/10, 4/14, 5/5) | Feb–May |
| 2025 | cp-20250208215445.pdf, cp-20250320072447.pdf, cp-20250902003710.pdf ("Trout Stocking (2025)") | 5 ● (wks ≈ 2/9, 2/16, 3/2, 4/13, 5/4) | Feb–May |
| 2026 | Live schedule JSON | weeks of 2/15, 3/8, 3/22, 5/10, 5/31 (5) | Feb–May |

A1. TWRA live 2026 Trout Stocking Schedule JSON (tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json; cached copy completion/trout_2026_live.json, retrieved 2026-09-25). 616 rows. Verbatim Lawrence rows: {"REGION":"2","COUNTY":"Lawrence","LOCATION":"East Fork Shoal Creek","TYPE":"Seasonal","STOCKING WEEK":"2/15/2026"|"3/8/2026"|"03/22/2026"|"5/10/2026"|"5/31/2026","SPECIES":"Rainbow Trout"}. TYPE field literally "Seasonal". No December or January row in any year's annual schedule.
- Type: official current schedule. Confidence: HIGH. Establishes: 2026 planned seasonal stocking Feb–May on the fork.

A2. TWRA ArcGIS layer (same retrieval as above): both fork sites StockingProgram="Spring", rainbow, 1000 each, County management (verbatim fields above). Confidence: HIGH (agency site master). Establishes: program-level (not schedule-level) Spring designation for the two fork sites.

## B. WINTER-PROGRAM EVENTS (the only Dec–Jan evidence ever)

B1. "Tennessee-winter-trout-stocking-report.pdf" updated 03/08/2018 (2017-18 season; Wayback capture 20180712194049; positional extraction). January 2018 section: "3 Wednesday East Fork Shoal Creek Lawrenceburg". ONE January event; no December event.
B2. "Winter Trout Stocking (2018-2019)" report (winter-trout-stocking-report.pdf, captures 20181013005431/20190412221001; local winter_trout_2018.pdf, positional extraction): "1/2/2019 Wednesday East Fork Shoal Creek Lawrenceburg Lawrence". ONE January event.
B3. "Winter Trout Stocking (2019-2020)" report (capture 20191023163741; local winter_trout_2019.pdf) and matching winter-trout-schedule.pdf (capture 20200809113424): "1/8/2020 Wednesday East Fork Shoal Creek Lawrenceburg Lawrence". ONE January event. Note: the 2020-21 winter schedule (capture 20210513061048) has NO East Fork Shoal Creek row; the 2024-25 winter schedule (TWRA-Winter-Trout-Schedule.pdf capture 20241120115437) has none either — the fork dropped out of the winter program after 2019-20.
- Type: official event-level winter docs. Confidence: HIGH for the three dated January events; establishes that Jan stocking happened in exactly 2018, 2019, 2020 seasons, never December.

## C. COMPLETED / DESTINATION-LEVEL FEEDS

C1. "Coldwater Stocking" list updated 11-16-2018 (local cw_stocking_2019.pdf; agency last-stocking list for 2018): "East Fork Shoal Creek 6/6/2018" — a completed JUNE 2018 event (late-season tail of the spring program). Confidence HIGH (official).
C2. "Coldwater Trout Stocking Schedule updated as of 5/3/2023" (local cw2023may.pdf): "2 East Fork Shoal Creek 04/11/2023" — completed April 2023. HIGH.
C3. "Coldwater Trout Stocking Schedule updated as of 5/17/2022" (cw2022may.pdf): NO East Fork Shoal Creek row as of mid-May 2022 (spring 2022 events not in this partial feed; the 2022 annual schedule did list 5 weeks — treat completion as unverified for 2022).
C4. Completed stocking feed, June-2024 capture (completion/completed2024.json; Wayback 20240607134309 of the on-page datatable): {"Region":"2","Destination":"East Fork Shoal Creek","Stocking Date":" 05/14/2024"} — completed May 2024. HIGH.
C5. "Trout Stocking Report updated as of 3/21/2025" (scheds/stockreport-202503.pdf): "2 East Fork Shoal Creek 03/13/2025" — completed March 2025. HIGH.
C6. Trout_Stocking-Report "updated as of 9/27/2024" (stocking-report-2024.pdf): no Shoal row (summer/fall gap, as expected for a Feb–May water). Consistent.

## D. INDEPENDENT OBSERVATIONS

D1. iNaturalist Oncorhynchus mykiss, 3 km of fork site 590 (35.2435,-87.3464), API query 2026-09-25: 15 results — all are the Davy Crockett State Park (main-stem) observations of May 2023 / May 2025 / May 2026 already logged in low-confidence/shoal-creek.md; the DCSP point lies within 3 km of the fork's water-plant site. ZERO trout observations on the fork's own town reach (Park/Water Plant sites). The one 2021-04-18 "Bradley Cove" obs (74399219) is on the main-stem park reach. GBIF mirror of the same box: 0 records inside a tight fork-only bbox (-87.36..-87.32, 35.22..35.26).
- Type: crowd observations. Confidence: MEDIUM-HIGH for absence on the fork reach (sampling bias caveat).

## E. SEARCHES RUN (2026-09-25)

1-2. Grid extraction of 24 cached annual schedules 2003–2009 (sched03–09b), 2010–2017 (sched10–15b, sched2016, sched2017), 2018–2025 (ts2018/sched2018, ts2019/ts2019b, cp-20180717180317, cp-20190109035923, cp-20210119123626, cp-20210820055911, cp-20220221215138(.x), cp-20220519194927, cp-20230220040610, cp-20240219225857, cp-20240520075643, cp-20250208215445, cp-20250320072447, cp-20250902003710) via pdfplumber coordinate mapping (grid3.py).
3. Live 2026 schedule JSON (cached) — all "Shoal" rows extracted.
4. TWRA ArcGIS layer dump — County=Lawrence rows.
5-7. Winter docs: winter_report_2016-18.pdf (capture 20180712194049), winter_trout_2018.pdf (positional), winter_trout_2019.pdf (fetched from capture 20191023163741), winter_sched_2020aug/2020-21/2024-25 — EFSC winter events and absence-after-2020 established.
8-10. Coldwater completed lists: cw_stocking_2019.pdf, cw2022may.pdf, cw2023may.pdf, cw2024may.pdf, cw2024aug.pdf; stockreport-202412/202503; stocking-report-2024; completed2024.json; stockings-live page (wordcloud only — pairing unreliable, not used).
11. Wayback CDX: winter-trout-stocking-report.pdf, winter-trout-schedule.pdf (+utm variants), TWRA-Winter-Trout-Schedule.pdf, Coldwater-Trout_Stocking-Schedule.pdf; tn.gov documents prefix sweep for winter/cold files.
12. iNaturalist API (2 queries: sites 589 & 590 at 3 km); GBIF API (fork bbox).
13. WebSearch "Lawrenceburg TN 'East Fork Shoal Creek' park water plant" → tn.gov stocking page option list, TopoZone/AnyPlace America Lawrence County stream listings (identity only).
Unproductive: sched16.pdf/sched17.pdf are HTML error pages, not PDFs (2016/2017 recovered instead via sched2016/sched2017.pdf); pypdf visitor coordinates unusable (switched to pdfplumber).

## VERDICT

- Species: Rainbow Trout only, all years.
- Type: seasonal put-and-take, TWRA TYPE="Seasonal" / StockingProgram="Spring". Confidence: HIGH.
- Months actually supported: **February–May** (core Feb/Mar–May; some years a June tail 2010–2018 and one completed 6/6/2018 event; January winter-program events ONLY in 2018, 2019, 2020 seasons; NEVER December).
- Scheduled EVERY year 2003–2026 (24 consecutive annual schedules located) — the prior pass's "2009–2017 gap" and "2021–2023 gap" are both closed by the local PDF cache (sched09–17 and cp-2021/2022/2023 all contain the row).
- Contradictions with prior pass (low-confidence/shoal-creek.md): (a) "documentation gaps 2009-2017" — wrong, all those schedules are in the cache and contain the row; (b) "2021-2023 no located row (2022 coldwater schedule omits Lawrence)" — conflates the winter "Coldwater" doc (which indeed omits the fork) with the ANNUAL "Trout Stocking" schedule (which includes it, 4-5 weeks Feb–May, in 2021, 2022, 2023); (c) 2018/2019 capture timestamps replay 2020 content — the "2018/2019" rows in the prior log A4/A5 came from replay-trapped captures; true 2018/2019 rows are ts2018/ts2019 (still 4 spring weeks; conclusion unchanged).
- Not established: completion receipts for 2026 weeks; which Lawrenceburg park the "Park" site is; any December stocking ever; any reproduction/year-round trout; trout observations on the fork's own reach (all iNat trout within 3 km are main-stem DCSP fish).

## RECOMMENDATION

Classify East Fork Shoal Creek (Lawrence) as **seasonal-stocked with months [2,3,4,5]** (February–May; late-April/May events are regular, some years extend to early June). Replace the catalog's [12,1,2]: December is unsupported in every year 2003–2026, and January is supported only by single winter-program events in the 2017-18, 2018-19, and 2019-20 seasons (dated 1/3/2018, 1/2/2019, 1/8/2020) — the fork has not appeared in the winter program since. If the catalog wants a single defensible window: Feb–May (Type "Seasonal").
