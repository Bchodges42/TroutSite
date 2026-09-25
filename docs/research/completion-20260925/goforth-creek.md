# Goforth Creek (Polk County, TN) — stocking-month evidence log

Research date: 2026-09-25. Internal classification research only; no agency/business/author contact.
Catalog entry under repair: months [12,1,2] (SUSPECT). Region 3 (Cherokee NF, Ocoee corridor). Seasonal-stocked creek.

## Water identification

- Stream: Goforth Creek, Ocoee River drainage, Polk County (City field "Ducktown"), Cherokee NF, Ocoee/Hiwassee Ranger District. Flows into the Ocoee across from the Ocoee Whitewater Center (US-64/Ocoee Scenic Byway gorge); access via Goforth Creek Rd / FS Rd 77.
- TWRA program: Region 3 "Spring" seasonal small-stream rainbow program. NOT a winter-program water in any documented year.
- Distinct from: any other "Goforth" waters — the 2011–2013 schedule grids show only ONE stocked Goforth Creek (Polk block; county labels in those transposed grids sit beside, not on, each row).

## Primary sources (per source detail)

### S1. TWRA ArcGIS feature service (LIVE, verified 2026-09-25)
- Title: "Trout Stocking Locations in Tennessee"; Owner: TWRA_GIS; item id 3ec5c58f99de4de5951f32b76b462623; service modified Sept 2026.
- URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0 (query County='POLK' AND StreamName LIKE '%Goforth%'); portal item: https://www.arcgis.com/sharing/rest/content/items/3ec5c58f99de4de5951f32b76b462623
- Fields: Site_Name, StreamName, Region=3, County=POLK, StockingProgram="Spring", WaterClass="stream", Species="rainbow", NumStocked=450, Management="USFS".
- Sites (WGS84 lon/lat from service geometry):
  - Goforth Creek Trail (S1): -84.51489, 35.08650
  - Goforth Creek Trail (S2): -84.51316, 35.08945
  - Goforth Creek Trail (S3): -84.50844, 35.09145
- Local dump: arcgis_all.json (OBJECTIDs 432, 433, 447).
- Establishes: stocked reach = the three trail/road sites in the lower 1 km of the creek near the Whitewater Center; program = Spring; species = rainbow. Does NOT establish months by itself (field says "Spring" only).

### S2. TWRA planned schedules, archived PDFs (decoded geometrically — glyph coordinates, NOT pdftotext columns)
Method: PyMuPDF word boxes; month headers + Sunday date-number columns; row-scoped marks (bullets '●' in 2018+ "Complete" PDFs; 'X' in 2010–2015 grids; transposed vertical grids 2011–2013). Marks mapped to nearest date column, tol ≤3 pt (≤7 pt where noted). Dates are Sundays; "stocking event happens within five days after the date listed."
- sched10.pdf (2010 Tentative, captured 2010-05-29, http://tn.gov/twra/fish/StreamRiver/stockedtrout/sched10.pdf via web.archive.org/web/20100529052023) — Goforth row (Polk block): MAR 14, MAR 28, APR 11, APR 25, MAY 9*, MAY 23, JUN 27 (*May 9 present in grid; one right-half mark drifts one column). 7 feeds → MARCH–JUNE.
- sched11.pdf (2011 Tentative, captured 2011-04-11, .../sched11.pdf via web.archive.org/web/20110411171330) — vertical grid, Goforth col x=429: FEB 27, MAR 13, MAR 27, APR 10, APR 24, MAY 8, MAY 22, JUN 26. 8 feeds → FEBRUARY–JUNE.
- sched12.pdf (2012, captured 2012-04-18) — vertical grid: MAR 11, MAR 25(26), APR 8, APR 22(25), MAY 6, MAY 20(22), JUN 17(20), JUL 22(24). 8 feeds → MARCH–JULY (day columns drift ±3 in this file; month spans solid).
- sched13.pdf (2013, captured 2013-01-10) — vertical grid: MAR 10, MAR 24, APR 7, APR 21(24), MAY 5, MAY 19. 6–7 feeds → MARCH–MAY.
- sched14b.pdf (2014, captured 2014-04-12) — MAR 2, MAR 16, APR 13, APR 27(30), MAY 11, MAY 25(27), JUN 22(25). 8 feeds → MARCH–JUNE.
- sched15b.pdf (2015, captured 2015-04-12) — MAR 1, MAR 15, APR 12, APR 26(29), MAY 10, MAY 24(26), JUN ~21-28(24). 7–8 feeds → MARCH–JUNE.
- 2016 and 2017: NO archived schedule found. sched16.pdf/sched17.pdf captures are empty stubs; no tn.gov/content/dam 2016/2017 stocking PDF in Wayback (CDX checked). GAP — documented.
- sched2018.pdf / ts2018.pdf (2018, https://www.tn.gov/content/dam/tn/twra/documents/2018-Trout-Stocking-Schedule.pdf via web.archive.org/web/20180412194955): FEB 25, MAR 11, MAR 25, APR 8, APR 22, MAY 6, MAY 20. 7 feeds → FEBRUARY–MAY.
- sched2019.pdf + sched2019b.pdf (2019 + revision; both identical months): FEB 24, MAR 10, MAR 24, APR 7, APR 21, MAY 5, MAY 19 → FEBRUARY–MAY.
- cp-20180717180317.pdf, cp-20190109035923.pdf, cp-20191030002119.pdf, cp-20200124101438.pdf — REPLAY TRAP: four different Wayback timestamps/URLs (2018-/2019-Trout-Stocking-Schedule.pdf, Trout-Stocking-Schedule-2019.pdf, Trout-Stocking-Schedule-Complete.pdf) all returned a byte-identical PDF (md5 d8beba5575041fd222125779f063a5c5). Printed header = FEB 2/9/16/23, MAR 1/8/15/22/29, APR 5/12/19/26, MAY 3/10/17/24/31 … = exact 2020 Sundays. Treated as the 2020 schedule: FEB 23, MAR 8, MAR 22, APR 5, APR 19, MAY 3, MAY 17 → FEBRUARY–MAY.
- cp-20210119123626.pdf / cp-20210820055911.pdf / cp-20211230204843.pdf (2021 Complete; md5s 0e5c34…, 41e350…): FEB 28, MAR 14, MAR 28, APR 11, APR 25, MAY 9, MAY 23 → FEBRUARY–MAY.
- cp-20220221215138.pdf / cp-20220519194927.pdf (2022; md5s 6228d3…, 9c75ad…): FEB 27, MAR 13, MAR 27, APR 10, APR 24, MAY 8, MAY 22. 7 feeds → FEBRUARY–MAY.
- cp-20230220040610.pdf / cp-20230523160930.pdf / cp-20231126164309.pdf (2023; md5 3a748e…): FEB 26, MAR 12, MAR 26, APR 9, APR 23, MAY 7, MAY 21 → FEBRUARY–MAY.
- cp-20240219225857.pdf / cp-20240520075643.pdf / cp-20240927132719.pdf / cp-20241223120856.pdf (2024; md5s c3cfa0…, 852e31…): row y=311.1 bullets at MAR 3, MAR 31, APR 28 (dx 0.0–0.1) → MARCH–APRIL (3 feeds).
- cp-20250208215445.pdf / cp-20250320072447.pdf / cp-20250624190651.pdf / cp-20250902003710.pdf (2025; md5s 321048…, fecd88…, 9d346c…, 8b67aa…): MAR 2, MAR 30, APR 27 → MARCH–APRIL (3 feeds; identical across all four captures).
- Local copies: scheds/ subfolder (this repo tmp/research/completion/scheds/).

### S3. 2026 schedule JSON (LIVE)
- Title: TWRA "Trout Stocking (2026)" datatable; URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json (tn.gov blocks curl; fetched in browser context; local copy trout_2026_live.json, 616 rows, retrieved 2026-09-25).
- Goforth Creek rows (Region 3, Polk, TYPE="Seasonal", SPECIES="Rainbow Trout", STOCKING WEEK): 3/1/2026, 3/29/2026, 4/26/2026 → MARCH (2), APRIL (1). No Dec/Jan/Feb rows.
- Corroborated by the printed 2026 guide appendix (ereg_tn_2026.pdf, "Polk Goforth Creek" under Region 3) and by 2026 schedule page capture (schedule2026-jina.txt: 3 Goforth rows).

### S4. Completed feeds (destination-level)
- 2024 archive: "Trout Stocking Report, updated as of 9/27/2024" (sr2024.txt) and 12/3/2024 report (stockreport-202412.txt) — NO Goforth entries (its spring feeds complete before the rolling report window; window shows tailwaters/winter waters). May–June 2024 completed-feed JSON capture (completed2024.txt/json, Wayback 20240607 capture family) — no Goforth in the visible rolling window (its last 2024 feed was Apr 28 week). Sept-2026 live completed JSON (completed2026-jina.txt, retrieved 2026-09-25, node tn_complex_datatable.exceldriven.json) — no Goforth (consistent: seasonal program finished by ~May 2026).
- Establishes: no completed-feed row contradicts the Mar–Apr window; absence is expected given rolling windows.

### S5. Regulation history (program context)
- 6amcity (T. Zimmerman), "New fishing proposals among announcements from wildlife resources commission", Sept 2018 — proposal to return Big Lost Creek, Goforth Creek, Spring Creek, and Greasy Creek + tributaries (Polk) to statewide trout regulations. https://6amcity.com (search snippet, retrieved 2026-09-25).
- NewsChannel9, "TFWC cracks down on live bait transport regulations", 2018-09-24 — same change effective with 2018 cycle; removes stocking-related special rules (historic Friday closures during stocking season). https://newschannel9.com (search snippet).
- Establishes: TWRA actively managed stocking access on this creek (stocking-season closures) until 2018; supports seasonal (spring) stocking cadence.

### S6. Wild/holdover context (keep stocked reach separate)
- TWRA Fisheries Report 18-xx (Region 4 trout report, r4-2018.pdf) Appendix A, Table A-1 "Wild trout streams sampled quantitatively during 1991-2018": "Goforth Creek — Ocoee — Polk — CNF — 1993 — RBT — 1" (one quantitative sample, 1993, rainbow). Establishes wild rainbow presence in the watershed; sample reach unknown (likely outside/above the 3 roadside stocking sites).
- USFS Cherokee NF fishing page (retrieved 2026-09-25): "Wild trout, rainbow, brown and native brookies are present in most of the mountain streams above 1000 feet"; stocked rainbows 8–12 in "typically between March and September". https://www.fs.usda.gov/r08/cherokee/recreation/opportunities/fishing
- Trout Management Plan for Tennessee 2017–2027 (TWRA Fisheries Report 17-10, Oct 2017; retrieved via Wayback 20180717180426): upper CNF wild-trout habitat context; sign language example "Stocked Trout Stream … Stocked Monthly March-May". Goforth not individually named.
- Holdover inference: 7-feed Feb–May programs (2018–2023) plausibly support fish into early summer; no evidence of TWRA stocking Dec/Jan.

## Months-by-year table (planned schedule rows, Sunday week-of)

| Year | Dec | Jan | Feb | Mar | Apr | May | Jun | Jul | Aug–Nov | Source |
|---|---|---|---|---|---|---|---|---|---|---|
| 2010 | – | – | – | X X | X X | X X | X | – | – | sched10 |
| 2011 | – | – | X | X X | X X | X X | X | – | – | sched11 |
| 2012 | – | – | – | X X | X X | X X | X | X | – | sched12 |
| 2013 | – | – | – | X X | X X | X X | – | – | – | sched13 |
| 2014 | – | – | – | X X | X X | X X | X | – | – | sched14b |
| 2015 | – | – | – | X X | X X | X X | X | – | – | sched15b |
| 2016 | gap — no archived schedule | | | | | | | | | CDX |
| 2017 | gap — no archived schedule | | | | | | | | | CDX |
| 2018 | – | – | X | X X | X X | X X | – | – | – | sched2018 |
| 2019 | – | – | X | X X | X X | X X | – | – | – | sched2019/9b |
| 2020 | – | – | X | X X | X X | X X | – | – | – | cp replay-trap PDF (2020 header) |
| 2021 | – | – | X | X X | X X | X X | – | – | – | cp-2021 |
| 2022 | – | – | X | X X | X X | X X | – | – | – | cp-2022 |
| 2023 | – | – | X | X X | X X | X X | – | – | – | cp-2023 |
| 2024 | – | – | – | X X | X | – | – | – | – | cp-2024 |
| 2025 | – | – | – | X X | X | – | – | – | – | cp-2025 |
| 2026 | – | – | – | X X | X | – | – | – | – | live JSON |

Completed feeds: none contradicting (rolling report windows only).

## Species
- Rainbow trout (all schedule rows + ArcGIS Species field + USFS description). Browns only as wild fish (Region 4 sampling; plan text). No DH/winter program entries.

## Type & confidence
- Type: seasonal put-and-take rainbow stocking, Cherokee NF roadside reach.
- Months verdict: **catalog [12,1,2] KILLED.** No December or January planned or completed event in any year 2010–2026. True pattern: Mar–Jun (2010–2015); Feb–May (2018–2023); Mar–Apr (2024–2026, 3 feeds ≈4 weeks apart). February only 2011 + 2018–2023. Confidence: HIGH for 2010–2015 and 2018–2026 (geometric decode, row-scoped, exact Sunday alignment verified 2021–2026); GAP 2016–2017 (not archived; pattern-adjacent years bracket them); 2003–2009 not archived under schedNN pattern (CDX empty) — verdict rests on 2010–2026 evidence.
- Contradictions: none between sources. The only [12,1,2]-adjacent fact is the ArcGIS program label "Spring" plus Spring-Creek-style Nov marks — Goforth has NO fall/winter marks. Wayback replay trap (4 timestamps → one 2020 PDF) resolved by md5 + printed-header Sundays.

## Searches run (Goforth-specific; shared infra queries also logged in sibling files)
1. WebSearch: "Goforth Creek" trout stocking Ocoee Whitewater Center Cherokee National Forest
2. WebSearch: Goforth Creek Ocoee River stocked trout fishing Tennessee
3. Bing/DDG html attempts (Goforth Creek trout stocked) — captcha-walled, noted
4. ArcGIS Online item search (trout stocking owner TWRA_GIS) + live FeatureServer query (POLK/Goforth)
5. GBIF occurrence search Oncorhynchus mykiss, Tennessee 2005 (Goforth filter — no Goforth voucher)
6. CDX: tn.gov/twra trout pages; schedNN.pdf 03–17; Trout_Map PDFs; trout-information-stockings subtree
7. Wayback fetches: sched10–15, sched2018/2019, cp-2018–2025, Trout_Map_Side1/2 (image-only), Mgmt Plan 2017-27
8. grep r4-2017/2018/2019/2020b/2021c/2023 (wild sample table)
9. WebSearch: TWRA 2018 regulation change Goforth Greasy Polk (6amcity, NewsChannel9)
10. USFS Cherokee NF fishing + recreation pages (WebFetch)
11. ereg_tn_2026.pdf extraction and search
12. tn.gov 2026 schedule JSON (browser-context) + Sept-2026 live completed JSON

## Recommendation
Classify Goforth Creek as **seasonal spring stocking: March–April in the current program (2024–2026: 3 feeds, weeks of ~Mar 1, ~Mar 29, ~Apr 26)**; historically extended Feb–May (2018–2023) and Mar–Jun (2010–2015). Remove December and January from the catalog entry. If a single month-range field is needed: **March–April (current), March–May (multi-year norm)**.
