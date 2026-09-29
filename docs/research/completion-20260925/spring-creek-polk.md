# Spring Creek (Polk County, TN) — stocking-month evidence log

Research date: 2026-09-25. Internal classification research only; no agency/business/author contact.
Catalog entry under repair: months [12,1,2] (SUSPECT). Region 3 (Cherokee NF, Ocoee/Hiwassee district). Seasonal-stocked creek WITH genuine late-fall additions since 2022 — but still NO Dec/Jan.

## Water identification

- Stream: Spring Creek, Polk County (City field "Benton"), Cherokee NF, flows past Spring Creek Road (FS NFSR 27 corridor; Ocoee/Hiwassee Ranger District office sits at 404 Spring Creek Rd, Delano) toward the Hiwassee/Reliance area. Six stocking sites along Spring Creek Rd incl. two campgrounds.
- TWRA program: Region 3 "Spring" seasonal rainbow program; since 2022 also 1–2 fall feeds (Oct and/or Nov) on this creek only among the Polk four — the likely seed of any "winter" misclassification.
- Distinct from: Spring Creek in the North Toe River system (mentioned in Region 4 wild tables — different drainage/state context), Spring Creek (Rhea) rows in old transposed grids, and Spring City waters. The stocked Spring Creek here is Polk/Region 3.

## Primary sources (per source detail)

### S1. TWRA ArcGIS feature service (LIVE, verified 2026-09-25)
- Service: TWRA_Trout_Stocking_Locations (TWRA_GIS item 3ec5c58f99de4de5951f32b76b462623). Fields: Region=3, County=POLK, StockingProgram="Spring", Species="rainbow", NumStocked=275/site, Management="USFS".
- Sites (lon, lat):
  - Spring Creek Campground #1 (S1): -84.51367, 35.22045
  - Spring Creek Rd. Pull-Off (S2): -84.51298, 35.22401
  - Spring Creek Rd. Pull-Off (S3): -84.50799, 35.22363
  - Spring Creek Rd. Pull-Off (S4): -84.49892, 35.22342
  - Spring Creek Campground #3 (S5): -84.49597, 35.23025
  - Spring Creek Rd. Bridge Crossing (S6): -84.48426, 35.23674
  (OBJECTIDs 440, 450–455 region; local arcgis_all.json)
- Establishes: stocked reach = ~4 km of Spring Creek Rd corridor (35.220–35.237 N); program Spring; rainbow.

### S2. Planned schedules, archived PDFs (geometric decode; row-scoped; see goforth-creek.md method note)
Spring Creek 2010–2021 matched Goforth/Greasy row-for-row; fall additions begin 2022:
- 2010 (sched10): MAR 14/28, APR 11/25, MAY 9/23, JUN 27 → MARCH–JUNE.
- 2011 (sched11): FEB 27, MAR 13/27, APR 10/24, MAY 8/22, JUN 26 → FEBRUARY–JUNE.
- 2012 (sched12): MAR 11/25, APR 8/22, MAY 6/20, JUN 17, JUL 22 → MARCH–JULY.
- 2013 (sched13): MAR 10/24, APR 7/21, MAY 5/19 → MARCH–MAY.
- 2014 (sched14b): MAR 2/16, APR 13/27, MAY 11/25, JUN ~22 → MARCH–JUNE.
- 2015 (sched15b): MAR 1/15, APR 12/26, MAY 10/24, JUN ~21/28 → MARCH–JUNE.
- 2016–2017: GAP (not archived).
- 2018 (sched2018): FEB 25, MAR 11/25, APR 8/22, MAY 6/20 → FEBRUARY–MAY.
- 2019 (sched2019/9b): FEB 24, MAR 10/24, APR 7/21, MAY 5/19 → FEBRUARY–MAY.
- 2020 (cp replay-trap cluster): FEB 23, MAR 8/22, APR 5/19, MAY 3/17 → FEBRUARY–MAY.
- 2021 (cp-2021 x3): FEB 28, MAR 14/28, APR 11/25, MAY 9/23 → FEBRUARY–MAY.
- 2022 (cp-20220221/0519, row y=326.6): MAR 13, APR 10, MAY 8 + OCT 23 → MARCH–MAY + OCTOBER (fall feed begins; note: no Feb mark 2022).
- 2023 (cp-2023 x3): MAR 12, APR 9, MAY 7 + OCT 22 → MARCH–MAY + OCTOBER.
- 2024 (cp-2024 x4, row y=326.5, dx 0.0–0.1): FEB 4, MAR 3, MAR 31, APR 28 + OCT 20, NOV 17 → FEBRUARY, MARCH, APRIL + OCTOBER, NOVEMBER.
- 2025 (cp-2025 x4): FEB 2, MAR 2, MAR 30, APR 27 + NOV 2, NOV 30 → FEBRUARY, MARCH, APRIL + NOVEMBER.

### S3. 2026 schedule JSON (LIVE) —Spring is the ONLY one of the four with 6 rows
- tn.gov exceldriven JSON (trout_2026_live.json, retrieved 2026-09-25), Region 3, Polk, TYPE="Seasonal", SPECIES="Rainbow Trout", STOCKING WEEK: 2/1/2026, 3/1/2026, 3/29/2026, 4/26/2026, 11/1/2026, 11/29/2026 → FEBRUARY, MARCH, APRIL, NOVEMBER.
- Corroborated by schedule2026-jina.txt (6 Spring Creek rows) and 2026 regs appendix ("REGION 3 Polk Spring Creek").

### S4. Completed feeds (destination-level) — the strongest single fact in this file
- "Trout Stocking Report, updated as of 12/3/2024" (stockreport-202412.txt from archived report PDF stockreport-202412.pdf): row "3 | Spring Creek | 11/18/2024" — a COMPLETED Region 3 feed into Spring Creek on 2024-11-18 (within 5 days of the planned Nov 17 week). ESTABLISHES November stocking actually happens.
- 2024 9/27/2024 report (sr2024.txt): no Spring Creek row (window effect).
- May–June 2024 completed JSON (completed2024.txt): no Spring Creek in window (last spring feed Apr 28) — consistent.
- Sept-2026 live completed JSON (completed2026-jina.txt, retrieved 2026-09-25): no Spring Creek row in the current rolling window (next scheduled feed = Nov 1, 2026 week) — consistent.

### S5. Regulation / program context
- 6amcity (Sept 2018) + NewsChannel9 (2018-09-24): Spring Creek named in the Polk four-creek group returned to statewide trout regulations in 2018 (end of stocking-era Friday closures).
- USFS Cherokee NF: "Spring Creek Road (NFSR 27) access interruption" alert visible on recreation page (retrieved 2026-09-25) — confirms road corridor management over the stocked reach.
- Fall-feed onset (2022) is a TWRA program change visible in the planned grids; it is the SAME seasonal program (TYPE="Seasonal" in 2026 JSON), not the separate "Winter Trout" city-pond program (winter_trout_2018.txt and 2013/14 + 2014/15 wintertrout.pdf lists contain NO Polk creeks; ts2022cold.txt 2022 coldwater list has no Polk creeks).

### S6. Wild/holdover context
- No quantitative wild sample in r4-2018 Appendix A for Spring Creek (Polk). USFS general statement (wild trout common above 1,000 ft) applies to headwaters.
- Keep the Spring Creek Rd stocked corridor separate from upstream forest headwaters.
- Holdover: Feb–May feeds (7/yr through 2021; 6/yr 2024–2026) support a long cold-season fishery WITHOUT Dec/Jan stocking.

## Months-by-year table (planned rows, Sunday week-of; [r] = fall addition row)

| Year | Dec | Jan | Feb | Mar | Apr | May | Jun | Jul | Aug | Sep | Oct | Nov | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2010 | – | – | – | X X | X X | X X | X | – | – | – | – | – | sched10 |
| 2011 | – | – | X | X X | X X | X X | X | – | – | – | – | – | sched11 |
| 2012 | – | – | – | X X | X X | X X | X | X | – | – | – | – | sched12 |
| 2013 | – | – | – | X X | X X | X X | – | – | – | – | – | – | sched13 |
| 2014 | – | – | – | X X | X X | X X | X | – | – | – | – | – | sched14b |
| 2015 | – | – | – | X X | X X | X X | X | – | – | – | – | – | sched15b |
| 2016 | gap — no archived schedule | | | | | | | | | | | | CDX |
| 2017 | gap — no archived schedule | | | | | | | | | | | | CDX |
| 2018 | – | – | X | X X | X X | X X | – | – | – | – | – | – | sched2018 |
| 2019 | – | – | X | X X | X X | X X | – | – | – | – | – | – | sched2019/9b |
| 2020 | – | – | X | X X | X X | X X | – | – | – | – | – | – | cp replay-trap PDF |
| 2021 | – | – | X | X X | X X | X X | – | – | – | – | – | – | cp-2021 |
| 2022 | – | – | – | X | X | X | – | – | – | – | X | – | cp-2022 |
| 2023 | – | – | – | X | X | X | – | – | – | – | X | – | cp-2023 |
| 2024 | – | – | X | X X | X | – | – | – | – | – | X | X | cp-2024 |
| 2025 | – | – | X | X X | X | – | – | – | – | – | – | X X | cp-2025 |
| 2026 | – | – | X | X X | X | – | – | – | – | – | – | X X | live JSON |

Completed: Nov 18, 2024 feed CONFIRMED (destination-level).

## Species
- Rainbow trout only (rows + ArcGIS + 2026 regs appendix).

## Type & confidence
- Type: seasonal put-and-take rainbow stocking with recent late-fall supplements; NOT the TWRA "Winter Trout" program; NOT a Dec/Jan water.
- Months verdict: **catalog [12,1,2] KILLED — and now confidently replaced.** No December or January event in any documented year (2010–2026). True months: Mar–Jun (2010–2015); Feb–May (2018–2021); Mar–May + Oct (2022–2023); **Feb, Mar, Apr + Oct/Nov (2024–2026; 2026 = weeks of 2/1, 3/1, 3/29, 4/26, 11/1, 11/29)**. November verified by a completed feed (11/18/2024). February is real (4 yrs + 2026). Confidence: HIGH.
- Contradictions: the fall additions mean a simplistic "spring-only" label would be wrong for 2022+; likewise [12,1,2] is unsupported by every artifact. The ArcGIS "StockingProgram=Spring" label coexists with the Nov feeds (program name ≠ month range).

## Searches run (Spring Creek-specific)
1. WebSearch: "Spring Creek" Polk County Tennessee trout "Spring Creek Road" stocked campground Cherokee National Forest
2. WebSearch: Spring Creek Tennessee trout stocking Cherokee National Forest Polk County campground
3. WebSearch: "Spring Creek Road" Reliance Tennessee trout stream stocking TWRA
4. WebFetch: USFS Cherokee NF recreation opportunities + fishing pages (Spring Creek Rd NFSR 27 alert)
5. ArcGIS Online item search + live FeatureServer query (POLK/Spring — 6 sites)
6. GBIF occurrence searches (Spring Creek Polk filter — no voucher)
7. CDX: schedNN 03–17; trout-information-stockings; Trout_Map; rules 1660-4
8. Wayback fetches + geometric decode: sched10–15, sched2018/19, cp-2018–2025 (Spring rows; Oct/Nov bullet columns verified at dx 0.0)
9. Winter-program screens: wintertrout.pdf 2013-14/2014-15, winter_trout_2018, ts2022cold, Winter-Trout-Stocking-Schedule-2019-2020 — no Polk creek ever listed
10. Completed-feed archive + live: sr2024, stockreport-202412 (Spring Creek 11/18/2024), completed2024, completed2026-jina
11. 2026 regs appendix (ereg_tn_2026.txt) + 2026 schedule page capture
12. mywaterlevel.com mirror checks (index only)

## Recommendation
Classify Spring Creek (Polk) as **seasonal stocking: February, March, April + November (2024–2026 pattern; 2026 weeks of 2/1, 3/1, 3/29, 4/26, 11/1, 11/29; Nov verified by completed 11/18/2024 feed)**; historically Feb–May (2018–2021) and Mar–Jun (2010–2015), Oct add-on 2022–2023. Remove December and January. If the catalog forces one range: **February–April + November**.
