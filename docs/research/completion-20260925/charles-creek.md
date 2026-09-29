# Research log: Charles Creek (Warren County, McMinnville, TN)

- Water: **Charles Creek** — small direct tributary of the lower Collins River north/northwest of McMinnville (Caney Fork drainage). TWRA schedule name: **"Charles Creek"** (Region 3, Warren County). Not related to any other-state Charles Creek; the only "Charles Creek" rows in the entire 616-row 2026 TWRA dataset are these Warren County rows.
- Ledger state at start: seasonal-stocked-trout, no months pinned.
- All retrievals: 2026-09-25 (archives inherited from this project's 2026-09-24/25 passes). Research only; no agency contact.
- Method note: identical grid method to barren-fork-river.md — exact PDF coordinates + Sunday-sequence validation of the week columns; dx (mark-center to column-center) printed for audit. Charles Creek's marks were extracted from the same grids as the Barren Fork rows, and the two waters' weeks match in every extracted year (same Region 3 spring truck runs).

## 1. LIVE 2026 TWRA schedule JSON (primary, high confidence)

- Title: Trout Information & Stockings — 2026 schedule data table (616 rows); Org: TWRA
- Observation date: current 2026 season; retrieved 2026-09-24/25
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json (tn.gov blocks plain curl; browser-context fetch)
- Rows (all TYPE "Seasonal", SPECIES "Rainbow Trout", Region 3, County Warren — the only Charles Creek rows statewide):
  - `{Charles Creek, STOCKING WEEK 3/15/2026}`
  - `{Charles Creek, STOCKING WEEK 3/22/2026}`
  - `{Charles Creek, STOCKING WEEK 5/10/2026}`
- Establishes: 2026 planned spring-only stocking; months March (×2) and May. (mywaterlevel.com mirror of the same dataset omits this water — incomplete render, noted, not relied on.)

## 2. TWRA ArcGIS stocking-site table (primary, high confidence)

- Service: TWRA_Trout_Stocking_Locations ("Trout_MASTER_Project"); retrieved 2026-09-25
- URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0/query?where=UPPER(StreamName)+LIKE+'%25CHARLES%25'
- This water — OBJECTID 565:
  - Site_Name: **Frances Ferry (S1)**; StreamName: **Charles Creek**
  - LATITUDE 35.71772591400003, LONGITUDE -85.75958466699996; Region 3, County WARREN, City McMinnville
  - StockingProgram **Spring**; WaterClass stream; Species rainbow; NumStocked **0** (blank in master); Management **Private Land**; HoursOpen "Contact Region 3"; DelayedHarvestSeason empty; GlobalID 463ad4d7-d33f-4204-844b-d90e30ba1613
- Establishes: one official record, Spring program only, private-land bridge/ford access (Frances Ferry), coordinates.

## 3. StockedTrout2016 ArcGIS layer (primary; bridges the 2016–2017 schedule gap; richer site list)

- Service: StockedTrout2016 / "StockedTroutMar2016" (CreationDate 2017-04-17, collector W. Collier); retrieved 2026-09-25
- URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/StockedTrout2016/FeatureServer/0/query (StreamName LIKE %CHARLES%)
- THREE sites, all StockingProgram **"Spring Streams"**, Species rainbow, Management Private Land, County WARREN, City Mcminnville:
  - OBJECTID 4840 **Frances Ferry (S1)** — gravel pull-off <25 spaces (no coords in layer)
  - OBJECTID 4704 **Old Smithville Hwy Bridge Crossing (S2)** — 35.723990031 / -85.79182513, NumStocked 400
  - OBJECTID 4668 **Yager Rd. Bridge Crossing (S3)** — 35.7314639960001 / -85.813852904, NumStocked 400
- Establishes: ~800 rainbows/yr across three private-land bridge sites as of the 2016-era inventory; Spring Streams designation bridges 2016/2017.

## 4. Archived TWRA schedule PDFs 2003–2015, state.tn.us era (primary, high confidence)

Base: https://web.archive.org/web/{TIMESTAMP}/http://www.state.tn.us/twra/fish/StreamRiver/stockedtrout/schedYY.pdf (captures as listed in barren-fork-river.md §4). Row "Charles Creek", Warren Co. Coordinate-extracted week-of Sundays:

| Year | Charles Creek weeks (week of) | Months |
|---|---|---|
| 2003 | Mar 16, Apr 13, May 4 (dx ≤3.8) | Mar–May |
| 2004 | Mar 14, Apr 11, May 2 (dx 0.0) | Mar–May |
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

- Weeks identical to the Barren Fork River (main stem) row in every year — same runs.
- Earlier interpretations (prior pass character-alignment; an intermediate 2010 read of "Jun 27") are superseded: exact mark-to-column distances and the validated Sunday sequence put every Charles Creek mark in March–May. There is no July week in 2009/2013/2015 for this water (that reading was column drift; it also does not exist for the sibling rows in the same grids).
- 2011/2012 grid-years: the water IS listed with 3 spring weeks (the prior pass's "zero weeks" note applied to a mis-parsed neighbor row).

## 5. Archived TWRA schedule PDFs 2018–2025, tn.gov era (primary, high confidence)

Bullet grids, md5-checked (2019-20 == 2020 capture, d8beba5575041fd222125779f063a5c5; all other captures distinct):

| Year | Capture (web.archive.org/web/{ts}/https://www.tn.gov/content/dam/tn/twra/documents/...) | Weeks (week of) | Months |
|---|---|---|---|
| 2018 | 20180717180317 .../2018-Trout-Stocking-Schedule.pdf | Mar 18, Apr 15, May 13 (dx 0.0) | Mar–May |
| 2019 | 20190412221005 .../2019-Trout-Stocking-Schedule.pdf | Mar 17, Apr 14, May 12 (dx 0.0) | Mar–May |
| 2020 | 20200424033427 .../fishing/trout/Trout-Stocking-Schedule-Complete.pdf | Mar 15, Apr 12, May 10 | Mar–May |
| 2021 | 20210217082110 (same Complete URL) | Mar 21, Apr 18, May 16 | Mar–May |
| 2022 | 20220226183421 (same Complete URL) | Mar 20, Apr 17, May 15 | Mar–May |
| 2023 | 20230226083143 (same Complete URL) | Mar 19, Apr 16, May 14 | Mar–May |
| 2024 | 20240222201650 (+ 20241205181943 identical) | Mar 17, Apr 14, May 12 (dx 0.0) | Mar–May |
| 2025 | 20250320072447 (same Complete URL) | Mar 16, Apr 13, May 11 (dx 0.0) | Mar–May |

- Calibration: same extraction reproduces the prior pass's independently-derived prong weeks exactly for 2018/2019/2021–2025.
- eregulations.com mirror (https://www.eregulations.com/assets/docs/resources/TN/Trout_Stocking.pdf — the garbled "TENTATIVE ... 2023" render, md5 09ab755a7a2ba0e91ac7703e48783ee1): Charles Creek row present; layout is rotated/split and county labels garbled, so marks were not cleanly re-extracted this pass; prior pass verified spring-only marks in this file for the sibling rows. Archived TWRA PDFs remain primary.
- 2016–2017: no archived schedule PDF (gap); bridged by section 3.
- Establishes: 21 schedule years with 3 spring weeks each + 2026; months = **March, April, May**. **No February or June–December week in any checked year (2003–2026).**

## 6. Completed-release records (destination-level)

a) TWRA "Coldwater Stocking" report, run 11-16-2018 (file cw_stocking_2019.txt; URL family https://www.tn.gov/content/dam/tn/twra/documents/Cold%20Water%20Stocking.pdf): **"Charles Creek 5/16/2018"** — a completed 2018 spring release; the November run date confirms nothing later in 2018.
b) "Coldwater Trout Stocking Schedule" updated 5/17/2022: **Charles Creek 05/10/2022**.
c) Updated 5/3/2023: **Charles Creek 04/18/2023**.
d) Updated 5/17/2024: **Charles Creek 05/15/2024**; independently, archived recently-stocked feed 2024-06-07: `{Region 3, Destination "Charles Creek", Stocking Date 05/15/2024}` (https://web.archive.org/web/20240607134309/https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_panel_348017491_c/content/tn_complex_datatable.exceldriven.json).
(URL family for b–d: https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Coldwater-Trout_Stocking-Schedule.pdf.)
e) Winter-program contradiction tests: Feb editions of the same Coldwater Trout Stocking Schedule (Feb 2022 capture 20220221220911; Feb 2023/2024 editions) contain **no Charles Creek entry**; Aug/Nov 2022–2024 editions contain **no Charles Creek entry** (grep 0 hits); TWRA 2025-26 winter-program announcement (tn.gov/twra/news/2025/11/26/) names no Warren County water. **No completed winter release in any checked year.**
f) Live completed feed, retrieved 2026-09-24 (URL https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable.exceldriven.json): rolling Aug–Sep 2026 window only; Charles Creek absent because the window rolled past May 2026 — weak evidence, note only.

## 7. Holdover / fishery evidence

- NONE water-specific. No Fishbrain page exists for this Charles Creek (search returned only a Mississippi namesake); no piscamaps index hit surfaced in search, but the direct page https://piscamaps.com/us/tennessee/rivers/charles-creek/ exists: "Anglers here mostly fish for rainbow trout", "Charles Creek holds rainbow trout" (TWRA-derived profile, no dates/months; gauge shown is the Collins River near McMinnville).
- GBIF (taxon 2493601) and iNaturalist searches around 35.72/-85.78 surface no Charles Creek trout observations (the two McMinnville iNat rainbows of 2018-06-04 and 2025-06-07 sit at the Pepper Branch Park/Barren Fork site, not Charles Creek).
- Federal Register 90 FR 28701 (doc. 2025-12009, published 2025-07-01; Barrens darter proposed rule): "Charles Creek, a direct tributary to the lower Collins River, is impaired by Escherichia coli (E. coli) along its entire length"; "In Charles Creek, the Barrens darter's known range consists of a single, linear, 1-mi (1.6 km) reach in the creek's mainstem" — establishes the stream is small (single 1-mile darter reach), perennial, and ecologically sensitive; no mention of trout or stocking.
- Yager (general store/post office town "on Charles Creek, four miles northwest of McMinnville") and Charles Creek Church Rd corroborate geography (frameshifts.wordpress.com; movoto listings).

## Contradictions

1. Ledger "no months pinned": now pinned **March–May** — 21 schedule years with weeks + 2026 JSON + completed releases 5/16/2018, 5/10/2022, 4/18/2023, 5/15/2024 (all spring) + absence from every winter list checked.
2. Prior-pass-era character alignment would have moved some third weeks into May/July (e.g., a spurious "Jul 12" in 2009/2015, "Jun 27" in 2010); exact geometry (dx ≤3.8 pt, Sunday sequence validated) places all marks March–May.
3. The 2026 master site table lists NumStocked 0 for Frances Ferry while the 2016 inventory shows 400/site ×3 — the master row appears partly blank; program (Spring) agrees.
4. mywaterlevel mirror omits this water entirely (incomplete render of the primary JSON) — noted, not evidence of absence.

## Searches run (2026-09-25)

1. "Charles Creek" Warren County Tennessee trout stocking (rate-limited, no results)
2. "Charles Creek" McMinnville Tennessee fishing — surfaced USFWS Barrens darter rule (public-inspection.federalregister.gov)
3. "Charles Creek" Tennessee trout TWRA rainbow — no direct hits (tiny-water signal)
4. piscamaps Charles Creek Tennessee rainbow trout — no indexed hit, then direct page fetched
5. Barrens darter Charles Creek Warren County proposed endangered status assessment — federalregister.gov + govinfo
6. "Charles Creek" "Frances Ferry" OR "Yager" OR "Smithville Hwy" McMinnville — Yager-on-Charles-Creek history, Charles Creek Church Rd
7. fishbrain "Charles Creek" Tennessee Warren — no page exists
8. "Charles Creek" Tennessee Caney Fork Collins River tributary stream — danielhaston.com tributary list
9. "Charles Creek" Tennessee trout 2026 stocking week March May — tn.gov stockings page only
10. "Charles Creek" Warren County Tennessee darter survey stream size miles — piscamaps Charles Creek page surfaced; FR 90 FR 28701 confirmed
11. Fetches: piscamaps.com/us/tennessee/rivers/charles-creek/; federalregister.gov doc 2025-12009 via govinfo (FR-2025-07-01)
Dataset pulls: 2026 schedule JSON; 2026 + 2024-06-07 completed feeds; TWRA_Trout_Stocking_Locations + StockedTrout2016 ArcGIS queries; 15 archived schedule PDFs re-extracted (coordinate + Sunday-sequence validation); 6 completed-report editions.

## Recommendation

**seasonal-stocked-trout** — months supported by evidence: **March, April, May** (pattern: one mid-March, one mid-April, one mid-May week-of Sunday; 2026 = 3/15 + 3/22 + 5/10; identical weeks to the main Barren Fork River every year — same Region 3 spring runs). No February or June–December evidence in any year 2003–2026. Confidence: **high** for the schedule record (21 years, coordinate-validated), **medium-high** overall because there is no public catch record (no Fishbrain page, no iNat/GBIF observations), access is private-land bridge crossings (Frances Ferry S1; historically also Old Smithville Hwy S2 and Yager Rd S3), and the stream is small (1-mi darter reach, E. coli impaired). Not "unresolved": schedule + site + completed-release records are consistent across 24 years.
