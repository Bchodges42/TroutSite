# Sequatchie River (Region 3 — stocked reach at Cumberland County headwaters, Melvine) — Seasonal Trout Stocking Research Log

Research date: 2026-09-25 (all retrievals this date). Scope: internal classification research ONLY; no agency/business/author/angler contacted; only the named notes file written; no git writes.

Identity and stocked reach: every year's schedule row names the COUNTY as **Cumberland** (2003–2026; verified position-aware in all 23 schedule PDFs + 2026 JSON), and the TWRA ArcGIS layer places all Sequatchie River stocking sites in **CUMBERLAND County, city Melvine**: OBJECTID 437 "1St Old Hwy 28 Bridge Crossing (S1)" 35.77139, -85.01824; OBJECTID 569 "Old Hwy 28 Pull-Off (S2)" 35.77326, -85.01743; OBJECTID 436 "Old Hwy 28 Pull-Off (S3)" 35.77580, -85.01698; OBJECTID 430 "2Nd Old Highway 28 Bridge Crossing (S5)" 35.78586, -85.01492; StockingProgram "Spring", Species "rainbow", Management "Private Land" (S1/S2/S3), "Contact Region 3". This is the river's karst emergence at Head of Sequatchie (Devilstep Hollow), ON Old Hwy 28 — i.e., the stocked reach is the **Cumberland County headwaters near Melvine, NOT the Dunlap (Sequatchie Co.) main stem and NOT the lower river to the Tennessee at Chatmire/Jasper (Marion Co.)**. GBIF occurrence 1954 "Sequatchie River, 11 mi S of Crossville, Hwy 28; Tennessee River drain" (35.78222, -85.01906; RM & DM Bailey) sits inside the stocked reach.

Ledger under test: seasonal, no months. Verdict: seasonal **March–May** (3 events/yr, every scheduled year 2003–2026).

---

## SOURCES

### 1. TWRA 2026 Trout Stocking Schedule JSON (live, 616 rows)
- Org: TWRA. Retrieved 2026-09-25 (cache trout_2026_live.json).
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json
- Fields: REGION 3 | COUNTY Cumberland | LOCATION Sequatchie River | TYPE Seasonal | STOCKING WEEK 3/22/2026, 3/29/2026, 5/17/2026 | SPECIES Rainbow Trout.
- Type/confidence: agency-primary; HIGH. Establishes 2026 March–May window (3 events).

### 2. TWRA Tentative Trout Stocking Schedules 2003–2015 (via Wayback)
- Org: TWRA. Annual week-of grids ("stocking event will happen within five days after the date listed"). Retrieved 2026-09-25 (sched03, sched05–09b downloaded from Wayback id_ URLs; sched10–15b local).
- URL pattern: https://web.archive.org/web/<ts>id_/http://www.state.tn.us/twra/fish/StreamRiver/stockedtrout/sched{03..15}.pdf
- Fields — Sequatchie River (Cumberland Co.) week-of dates:
  - 2003: Mar 16, Apr 6, May 4 | 2004: Mar 21 (single event; only gap-year outlier) | 2005: Mar 13, Apr 3, May 1 | 2006: Mar 12, Apr 2, Apr 30 | 2007: Mar 11, Apr 1, Apr 29 | 2008: Mar 9, Mar 30, Apr 27 | 2009: Mar 8, Mar 29, Apr 26 | 2010: Mar 28, Apr 25, May 23 | 2011: Mar 27, Apr 24, May 22 | 2012: Mar 25, Apr 22, May 20 | 2013: Mar 24, Apr 21, May 19 | 2014: Mar 23, Apr 20, May 18 | 2015: Mar 22, Apr 19, May 17.
- Type/confidence: agency-primary planned; HIGH.

### 3. TWRA "Trout Stocking (YYYY)" schedules 2018–2025 (tn.gov captures; MD5 replay trap documented)
- Retrieved 2026-09-25 (local cp-* captures; sched2018/sched2019 local).
- Replay trap: cp-2018/2019/2020 captures all identical md5 d8beba55 (content = 2020); use one file per year: 2020 cp-20200124; 2021 cp-20210820 (cp-20211230 dup 41e350cc); 2022 cp-20220221+cp-20220519; 2023 cp-20230220 (3 dups, 3a748e6b); 2024 cp-20240219 + cp-20240520 (852e3117 dups); 2025 cp-20250208/0320/0902 distinct; cp-20250624 corrupt.
- Fields — Sequatchie River (Cumberland Co.) week-of dates: 2018 Mar 25/Apr 22/May 20; 2019 Mar 24/Apr 21/May 19; 2020 Mar 22/Apr 19/May 17; 2021 Mar 28/Apr 25/May 23; 2022 Mar 27/Apr 24/May 22; 2023 Mar 26/Apr 23/May 21; 2024 Mar 24/Apr 21/May 19; 2025 Mar 23/Apr 20/May 18.
- Type/confidence: agency-primary planned; HIGH.

### 4. Years 2016, 2017 — GAP (documented negative)
- Wayback CDX: sched16.pdf/sched17.pdf never captured ("has not archived"); tn.gov-era 2016–2017 schedule PDFs absent (only 302 migration stubs in CDX 2016–2018). Searches logged below.

### 5. Completed feed — 2024 archive
- Org: TWRA (stockings page dataset, captured 2024-06-07; local completed2024.json/txt). Observation date: 2024-05-21.
- Fields: Region 3 | Destination "Sequatchie River" | Stocking Date 05/21/2024.
- Type/confidence: agency-primary completed, destination-level; HIGH. Establishes May 2024 completion (matches week-of May 19, 2024).
- Negative: no Sequatchie River rows in 12/3/2024, 3/21/2025, 8/29/2025 reports or the live 2026-09-24 completed feed (10-row rolling window; spring events outside window). Live page chips (2026-09-24 capture) show "Sequatchie River 5/7/2026 4/9/2026" — dates NOT in the chips' week-of grid and not cleanly attributable (chip cloud interleaves destinations); flagged UNRESOLVED, not used as month evidence.

### 6. TWRA ArcGIS Trout Stocking Locations layer
- Retrieved 2026-09-25 (arcgis_all.json). URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/ArcGIS/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0/query
- Fields: 4 sites (S1, S2, S3, S5 — S4 not present in export) all StreamName "Sequatchie River", Region 3, County CUMBERLAND, City Melvine, StockingProgram "Spring", WaterClass "stream", Species "rainbow", NumStocked 0, Management "Private Land" (S1/S2/S3), HoursOpen "Contact Region 3".
- Type/confidence: agency site master; HIGH for reach identity.
- Establishes: stocked reach = Cumberland Co headwaters (Melvine, Old Hwy 28 S1–S5); no Dunlap or downstream sites exist in the layer. GIS "Spring" program class agrees with the schedule month verdict.

### 7. Geography: Head of Sequatchie / Melvine
- Wikipedia "Sequatchie River" (retrieved 2026-09-25): river "originates from several springs at or near Devilstep Hollow Cave" ("Head of the Sequatchie", Cumberland Trail SP), fed by Grassy Cove karst; flows through Pikeville (Bledsoe), Dunlap (Sequatchie Co.), receives Little Sequatchie near the town of Sequatchie (Marion Co.), mouths into Guntersville Lake (Tennessee River) near Jasper.
- Tennessee State Parks "Head of Sequatchie" (search result, retrieved 2026-09-25): the emergence site in Cumberland County.
- Melvine sits at the edge of Grassy Cove, SE Cumberland County — matching the S1–S5 sites at 35.77–35.79 N, -85.01–85.02 W.
- Establishes: stocked reach = first miles of the river at its Cumberland Co emergence along Old Hwy 28.

### 8. Historical corroboration
- GBIF occurrence (scientificName Oncorhynchus mykiss, box 35.7–35.9 / -85.1–-84.95; retrieved 2026-09-25): 1954 "Sequatchie River, 11 mi S of Crossville, Hwy 28; Tennessee River drain" (RM & DM Bailey) — inside the stocked reach; historic rainbow presence pre-dating the modern program.
- Archive.org "Report of the United States Commissioner of Fisheries" (surfaced in search, retrieved 2026-09-25): Tennessee table line "Sequatchie, Little Sequatchie River 3,000 9,000" — early-1900s federal stocking of both rivers (historical context only).
- iNaturalist (API box query, retrieved 2026-09-25): 2 rainbow obs in box, both Crossville-area (2026-05-10, 2023-06-17) — not reach-specific.

---

## MONTHS-BY-YEAR TABLE

| Year | Week-of events | Months supported | Class |
|---|---|---|---|
| 2003 | Mar 16, Apr 6, May 4 | Mar, Apr, May | planned |
| 2004 | Mar 21 | Mar | planned (1 event) |
| 2005 | Mar 13, Apr 3, May 1 | Mar, Apr, May | planned |
| 2006 | Mar 12, Apr 2, Apr 30 | Mar, Apr | planned |
| 2007 | Mar 11, Apr 1, Apr 29 | Mar, Apr | planned |
| 2008 | Mar 9, Mar 30, Apr 27 | Mar, Apr | planned |
| 2009 | Mar 8, Mar 29, Apr 26 | Mar, Apr | planned |
| 2010 | Mar 28, Apr 25, May 23 | Mar, Apr, May | planned |
| 2011 | Mar 27, Apr 24, May 22 | Mar, Apr, May | planned |
| 2012 | Mar 25, Apr 22, May 20 | Mar, Apr, May | planned |
| 2013 | Mar 24, Apr 21, May 19 | Mar, Apr, May | planned |
| 2014 | Mar 23, Apr 20, May 18 | Mar, Apr, May | planned |
| 2015 | Mar 22, Apr 19, May 17 | Mar, Apr, May | planned |
| 2016 | — | GAP | — |
| 2017 | — | GAP | — |
| 2018 | Mar 25, Apr 22, May 20 | Mar, Apr, May | planned |
| 2019 | Mar 24, Apr 21, May 19 | Mar, Apr, May | planned |
| 2020 | Mar 22, Apr 19, May 17 | Mar, Apr, May | planned |
| 2021 | Mar 28, Apr 25, May 23 | Mar, Apr, May | planned |
| 2022 | Mar 27, Apr 24, May 22 | Mar, Apr, May | planned |
| 2023 | Mar 26, Apr 23, May 21 | Mar, Apr, May | planned |
| 2024 | Mar 24, Apr 21, May 19; completed 05/21/2024 | Mar, Apr, May | planned + completed |
| 2025 | Mar 23, Apr 20, May 18 | Mar, Apr, May | planned |
| 2026 | Mar 22, Mar 29, May 17 | Mar, May | planned (live JSON) |

Species: Rainbow Trout (2026 JSON; GIS). Type: Seasonal (2026 JSON); GIS StockingProgram "Spring". Not in winter program (0 hits in winter files/rows, all years).

## Verdict / recommendation
- Months: **[3,4,5] (March–May)**, three events/yr, ~4-week spacing, first event first-second Sunday of March, last mid-to-late May. Supported by 22 scheduled years (2003–2025) + 2026 live schedule + completed 05/21/2024. 2004 (single March event) is the only thin year.
- Recommendation: classify seasonal, months [3,4,5]; anchor the stocked reach to the **Cumberland County headwaters at Melvine (Old Hwy 28 S1–S5, 35.771–35.786 N, -85.015–-85.018 W)** — not Dunlap. If the map draws the river to the Tennessee River confluence, label only the headwater reach as stocked. Confidence HIGH for months; HIGH for reach.

## Contradictions
- Chattanooga Times Free Press "Canoe the Sequatchie" blurb (surfaced in search) calls the Dunlap reach "stocked with rainbow and brown trout" — contradicts TWRA primary data (Cumberland Co reach only; rainbow only). TWRA primary wins; business copy flagged as unreliable.
- Task brief assumed the stocked water = "main river through Dunlap to the Tennessee at Chickamauga" — contradicted by county field in every schedule year and all GIS sites (Cumberland/Melvine). The lower river receives NO program rows.
- Brown trout: never listed for this water in any TWRA dataset reviewed.

## Searches run (2026-09-25)
1. "Sequatchie River" trout stocking TWRA — TWRA live page + eregulations schedule.
2. "Sequatchie River" trout stocking TWRA Melvine Cumberland — rate-limit partial; TWRA pages.
3. Melvine Tennessee Cumberland County Sequatchie River headwaters — Grassy Cove/Head of Sequatchie geography.
4. "Sequatchie River" trout fishing stocked rainbow Dunlap TWRA — CTFP Canoe the Sequatchie (contradiction flagged); archive.org US Commissioner of Fisheries historic line.
5. "Head of Sequatchie" OR "Devilstep Hollow" trout fishing Cumberland Trail — TN State Parks unit; Sierra Club/TennGreen acquisition context.
6. "Sequatchie River" "old highway 28" OR "Hwy 28" trout stocking put-in Cumberland County — Old Hwy 28 corridor access (partial 429s logged).
7. Wikipedia Sequatchie River (fetch — full course quote).
8. GBIF API box query (35.7–35.9, -85.1–-84.95) — 1954 Bailey record in reach.
9. iNaturalist API box query — 2 Crossville-area obs.
10. Local primary sweeps: all 23 schedule PDFs position-extracted; completed feeds 2024 archive + 12/2024 + 3/2025 + 8/2025 + live 2026; winter program files (0 hits); Wayback CDX for 2016–2018 (gap documented).
