# Little Sequatchie River (Marion County, TN — Region 3) — Seasonal Trout Stocking Research Log

Research date: 2026-09-25 (all retrievals this date). Scope: internal classification research ONLY; no agency/business/author/angler contacted; only the named notes file written; no git writes.

Identity and stocked reach: Region 3 stream in **Marion County** in every dataset. TWRA ArcGIS: OBJECTID 445, Site_Name "Camp Glancey (S2)", StreamName "Little Sequatchie River", County MARION, City "Sequatchie", 35.13825, -85.59850, StockingProgram "Spring", WaterClass "stream", Species "rainbow", NumStocked 2000, HoursOpen "24 Hours". Camp Glancey is the former Girl Scout camp (est. 1928, 27 acres donated by Glancey Sherman) between Jasper and Whitwell, near the town of Sequatchie — i.e., the stocked site is on the LOWER Little Sequatchie near its confluence with the Sequatchie River (the Little Sequatchie joins the main river near Sequatchie; CTFP notes it joins "around mile 8" of the main river). The "(S2)" suffix implies an S1 site exists but only S2 is present in the layer export.

Ledger under test: seasonal, months [12,1,2]. **Months hypothesis is WRONG** — same spring program as its parent river. Verdict: seasonal **March–May** (3 events/yr, 2003–2026), completed-level May 2024.

---

## SOURCES

### 1. TWRA 2026 Trout Stocking Schedule JSON (live, 616 rows)
- Org: TWRA. Retrieved 2026-09-25 (cache trout_2026_live.json).
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json
- Fields: REGION 3 | COUNTY Marion | LOCATION Little Sequatchie River | TYPE Seasonal | STOCKING WEEK 3/15/2026, 3/22/2026, 5/10/2026 | SPECIES Rainbow Trout.
- Type/confidence: agency-primary; HIGH.

### 2. TWRA Tentative Trout Stocking Schedules 2003–2015 (via Wayback)
- Org: TWRA. Annual week-of grids; event within 5 days after each Sunday. Retrieved 2026-09-25 (sched03/05–09b downloaded from Wayback; sched10–15b local).
- URL pattern: https://web.archive.org/web/<ts>id_/http://www.state.tn.us/twra/fish/StreamRiver/stockedtrout/sched{03..15}.pdf
- Fields — Little Sequatchie River (Marion Co.) week-of dates:
  - 2003: Mar 9, Apr 13, May 4 | 2004: Mar 14, Apr 18, May 16 | 2005: Mar 6, Apr 10, May 1 | 2006: Mar 5, Apr 9, Apr 30 | 2007: Mar 4, Apr 8, Apr 29 | 2008: Mar 2, Apr 6, Apr 27 | 2009: Mar 1, Apr 5, Apr 26 | 2010: Mar 21, Apr 18, May 16 | 2011: Mar 20, Apr 17, May 15 | 2012: Mar 18, Apr 15, May 13 | 2013: Mar 17, Apr 14, May 12 | 2014: Mar 16, Apr 13, May 11 | 2015: Mar 15, Apr 12, May 10.
- Type/confidence: agency-primary planned; HIGH. Establishes: three events/yr, mid-March start, mid-April + early-mid May follow-ups (2006–2009 third event fell late April instead of May).

### 3. TWRA "Trout Stocking (YYYY)" schedules 2018–2025 (tn.gov captures)
- Retrieved 2026-09-25 (local cp-* captures; MD5 replay trap documented in salt-lick-creek.md §3 — 2018/2019 captures replay the 2020 file; one file used per year).
- Fields — Little Sequatchie River week-of dates: 2018 Mar 18/Apr 15/May 13; 2019 Mar 17/Apr 14/May 12; 2020 Mar 15/Apr 12/May 10; 2021 Mar 21/Apr 18/May 16; 2022 Mar 20/Apr 17/May 15; 2023 Mar 19/Apr 16/May 14; 2024 Mar 17/Apr 14/May 12; 2025 Mar 16/Apr 13/May 11.
- Type/confidence: agency-primary planned; HIGH.

### 4. Years 2016, 2017 — GAP (documented negative)
- Wayback CDX: no sched16/sched17 capture; tn.gov-era 2016–2017 schedule PDFs not archived (302 migration stubs only).

### 5. Completed feed — 2024 archive (the ledger's "2024 archive May row" confirmed)
- Org: TWRA stockings dataset captured 2024-06-07 (local completed2024.json/txt). Observation date: 2024-05-14.
- Fields: Region 3 | Destination "Little Sequatchie River" | Stocking Date 05/14/2024.
- Type/confidence: agency-primary completed, destination-level; HIGH. Establishes May completion (matches week-of May 12, 2024 +2 days).
- Negative: no rows in 12/3/2024, 3/21/2025 (listed, blank as of 3/21 — Region 3 events had not yet occurred), 8/29/2025 reports; absent from live 2026-09-24 completed feed (10-row rolling window). Live page chip cloud shows "Little Sequatchie River … 3/8/2026 … 04/05/2026" — not cleanly attributable (interleaved chips); UNRESOLVED, not used.

### 6. TWRA ArcGIS Trout Stocking Locations layer
- Retrieved 2026-09-25 (arcgis_all.json). URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/ArcGIS/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0/query
- Fields: see identity block above. StockingProgram "Spring"; Species "rainbow"; NumStocked 2000.
- Type/confidence: agency site master; HIGH. Establishes identity (Marion Co., Camp Glancey reach), spring program class, rainbow, ~2,000-fish events.

### 7. Geography
- Wikipedia "Sequatchie River" (retrieved 2026-09-25): "below Whitwell, near the small community of Sequatchie, it receives its main tributary, the Little Sequatchie River."
- Camp Glancey: "Abandoned Tennessee" (Facebook group post, retrieved 2026-09-25): camp between Jasper and Whitwell, Marion Co., est. 1928 on 27 donated acres, Girl Scout camp.
- Chattanooga Times Free Press "Angler's Paradise"/CityScope (surfaced in search, retrieved 2026-09-25): Little Sequatchie stocked annually with rainbow trout; access via Hwy 28 exit north of Dunlap; wading access points.
- OnWater app water page (search result, retrieved 2026-09-25): small picturesque stream, Marion/Grundy counties context (the river's upper course reaches toward Grundy; stocked reach is the Marion Co. lower river).
- Establishes: stocked reach = lower Little Sequatchie at Camp Glancey (35.138, -85.598), Marion Co., near the Sequatchie confluence.

### 8. Independent occurrence checks
- GBIF (Oncorhynchus mykiss box 35.05–35.25 / -85.7–-85.5; retrieved 2026-09-25): 0 records.
- iNaturalist (API, same box, retrieved 2026-09-25): 0 observations.
- Historic: US Commissioner of Fisheries report line "Sequatchie, Little Sequatchie River 3,000 9,000" (early-1900s federal stocking; surfaced via archive.org in search).

---

## MONTHS-BY-YEAR TABLE

| Year | Week-of events | Months supported | Class |
|---|---|---|---|
| 2003 | Mar 9, Apr 13, May 4 | Mar, Apr, May | planned |
| 2004 | Mar 14, Apr 18, May 16 | Mar, Apr, May | planned |
| 2005 | Mar 6, Apr 10, May 1 | Mar, Apr, May | planned |
| 2006 | Mar 5, Apr 9, Apr 30 | Mar, Apr | planned |
| 2007 | Mar 4, Apr 8, Apr 29 | Mar, Apr | planned |
| 2008 | Mar 2, Apr 6, Apr 27 | Mar, Apr | planned |
| 2009 | Mar 1, Apr 5, Apr 26 | Mar, Apr | planned |
| 2010 | Mar 21, Apr 18, May 16 | Mar, Apr, May | planned |
| 2011 | Mar 20, Apr 17, May 15 | Mar, Apr, May | planned |
| 2012 | Mar 18, Apr 15, May 13 | Mar, Apr, May | planned |
| 2013 | Mar 17, Apr 14, May 12 | Mar, Apr, May | planned |
| 2014 | Mar 16, Apr 13, May 11 | Mar, Apr, May | planned |
| 2015 | Mar 15, Apr 12, May 10 | Mar, Apr, May | planned |
| 2016 | — | GAP | — |
| 2017 | — | GAP | — |
| 2018 | Mar 18, Apr 15, May 13 | Mar, Apr, May | planned |
| 2019 | Mar 17, Apr 14, May 12 | Mar, Apr, May | planned |
| 2020 | Mar 15, Apr 12, May 10 | Mar, Apr, May | planned |
| 2021 | Mar 21, Apr 18, May 16 | Mar, Apr, May | planned |
| 2022 | Mar 20, Apr 17, May 15 | Mar, Apr, May | planned |
| 2023 | Mar 19, Apr 16, May 14 | Mar, Apr, May | planned |
| 2024 | Mar 17, Apr 14, May 12; completed 05/14/2024 | Mar, Apr, May | planned + completed |
| 2025 | Mar 16, Apr 13, May 11 | Mar, Apr, May | planned |
| 2026 | Mar 15, Mar 22, May 10 | Mar, May | planned (live JSON) |

Species: Rainbow Trout (2026 JSON; GIS). Type: Seasonal (2026 JSON TYPE); GIS StockingProgram "Spring". Winter program: never listed (0 hits, all winter files/rows checked).

## Verdict / recommendation
- Ledger months [12,1,2] are contradicted by every year of evidence (no Nov–Feb event in 22 scheduled years; completed event was May 14).
- Supported months: **[3,4,5] (March–May)** — three events/yr at ~4-week spacing starting mid-March (2006–2009: third event late April instead of May; 2026: two March events + May).
- Recommendation: classify seasonal with months **[3,4,5]**; anchor the stocked reach to Marion Co. at Camp Glancey (35.13825, -85.59850); keep distinct from the Sequatchie River (parent water, Cumberland Co. headwaters reach). Confidence HIGH.

## Contradictions
- Ledger [12,1,2] vs. 22 years of March–May schedules + May 2024 completion — resolve to [3,4,5].
- OnWater's Marion/Grundy county framing vs. TWRA's Marion-only sites — stocked reach is Marion Co. only.
- The 2024 archive "Little Sequatchie River 05/14/2024" row that motivated the [12,1,2] hypothesis is a MAY completion, consistent with the May event of the spring program — i.e., it never supported winter months.

## Searches run (2026-09-25)
1. "Camp Glancey" Sequatchie Tennessee Marion County — camp identity/location.
2. "Little Sequatchie River" trout TWRA stocking Marion — TWRA live page listing; eregulations Trout_Stocking.pdf; OnWater page.
3. "Little Sequatchie River" Tennessee fishing rainbow trout access — CTFP/CityScope coverage (one sub-query content-filtered 400, logged).
4. "Little Sequatchie" trout stocking "May" OR "March" 2024 TWRA report — TWRA page + schedule PDF corroboration.
5. "Little Sequatchie River" trout stocking access points wading Sequatchie County — content-filtered (400), logged.
6. GBIF API box query (35.05–35.25, -85.7–-85.5) — 0 records.
7. iNaturalist API box query — 0 observations.
8. Underlying opens: Wikipedia Sequatchie River (confluence geography), Camp Glancey history post, US Commissioner of Fisheries historic line (archive.org), eregulations TN Trout_Stocking.pdf.
9. Local primary sweeps: 23 schedule PDFs position-extracted; completed feeds (2024 archive hit; 12/2024, 3/2025, 8/2025, live 2026 negatives); winter program files (0 hits).
10. Wayback CDX 2016–2018 schedule queries (2016–2017 gap documented).
