# Tumbling Creek (Polk County, TN) — stocking-month evidence log

Research date: 2026-09-25. Internal classification research only; no agency/business/author contact.
Catalog entry under repair: months [12,1,2] (SUSPECT). Region 3 (Cherokee NF, Ducktown/Ocoee South district). Seasonal-stocked creek. GBIF holds a 2005 AUM rainbow voucher (stocked or holdover/wild).

## Water identification

- Stream: Tumbling Creek, Polk County (City field "Ducktown"), Cherokee NF, near Ocoee Lake #3 / Big Frog area; Tumbling Creek Campground (USFS, 8 sites) sits on it; extends toward the GA line (Fannin Co.).
- TWRA program: Region 3 "Spring" seasonal rainbow program (300/site). Trout Management Plan 2017–2027 additionally names Tumbling Creek (with Turtletown Creek) as one of the few streams also receiving BROWN trout.
- Distinct from: (a) Humphreys County "Tumbling Creek" (Region 1, separate schedule rows — a row-bleed hazard in grid decoding, resolved here by row-scoping); (b) Unicoi County Tumbling Creek (Nolichucky drainage, wild-table row in r4-2018 Appendix A — NOT this water); (c) Virginia's Big Tumbling Creek (Clinch Mountain WMA); (d) neighboring Turtletown Creek (its own Polk stocking row + Turtletown Creek WMA) — keep separate.

## Primary sources (per source detail)

### S1. TWRA ArcGIS feature service (LIVE, verified 2026-09-25)
- Service: TWRA_Trout_Stocking_Locations (TWRA_GIS item 3ec5c58f99de4de5951f32b76b462623). Fields: Region=3, County=POLK, StockingProgram="Spring", Species="rainbow", NumStocked=300/site, Management="USFS".
- Sites (lon, lat):
  - Tumbling Creek Trail (S1): -84.46495, 35.02227
  - Tumbling Creek Trail (S2): -84.46530, 35.02017
  - Tumbling Creek Campground (S3): -84.46623, 35.01684
  (OBJECTIDs 434, 455, 456; local arcgis_all.json)
- Establishes: stocked reach = ~0.6 km around the trail + campground (35.0168–35.0223 N); program Spring; rainbow.

### S2. Planned schedules, archived PDFs (geometric decode; row-scoped; see goforth-creek.md method note)
Tumbling (Polk) rows differ from Goforth/Greasy: usually every-other-week (half the feeds) through 2020, then 7 feeds 2021–2023, then 3 feeds 2024–2026:
- 2010 (sched10): MAR 28, APR 25, MAY 23 (+1 right-side mark ambiguous) → MARCH–MAY.
- 2011 (sched11): FEB 27, MAR 27, APR 24, MAY 22 → FEBRUARY–MAY.
- 2012 (sched12): MAR 25, APR 22, MAY 20, JUN 17 → MARCH–JUNE.
- 2013 (sched13): MAR 24, APR 21, MAY 19 → MARCH–MAY.
- 2014 (sched14b): (MAR 16?) APR 27, MAY 25, JUN ~22 → MARCH–JUNE.
- 2015 (sched15b): MAR 1, APR 26, MAY 24, JUN ~21/28 → MARCH–JUNE.
- 2016–2017: GAP (no archived schedules).
- 2018 (sched2018): FEB 25, MAR 25, APR 22, MAY 20 → FEBRUARY–MAY.
- 2019 (sched2019/9b): FEB 24, MAR 24, APR 21, MAY 19 → FEBRUARY–MAY.
- 2020 (cp replay-trap cluster): FEB 23, MAR 22, APR 19, MAY 17 → FEBRUARY–MAY.
- 2021 (cp-20210119/0820/1230, row y=341.3): FEB 28, MAR 14, MAR 28, APR 11, APR 25, MAY 9, MAY 23 (7 feeds) → FEBRUARY–MAY. (Earlier naive decodes bleeding Humphreys rows are corrected; Humphreys 2021 = FEB 28/APR 4/APR 25 only.)
- 2022 (cp-20220221/0519, row y=334.3): FEB 27, MAR 13, MAR 27, APR 10, APR 24, MAY 8, MAY 22 → FEBRUARY–MAY.
- 2023 (cp-2023 x3, row y=334.2): FEB 26, MAR 12, MAR 26, APR 9, APR 23, MAY 7, MAY 21 → FEBRUARY–MAY.
- 2024 (cp-2024 x4, row y=334.2, bullets dx 0.0–0.1): MAR 3, MAR 31, APR 28 → MARCH–APRIL.
- 2025 (cp-2025 x4): MAR 2, MAR 30, APR 27 → MARCH–APRIL.

### S3. 2026 schedule JSON (LIVE)
- tn.gov exceldriven JSON (trout_2026_live.json, retrieved 2026-09-25): Tumbling Creek, Region 3, Polk, TYPE="Seasonal", SPECIES="Rainbow Trout", STOCKING WEEK 3/1/2026, 3/29/2026, 4/26/2026 → MARCH (2), APRIL (1).
- Corroborated by schedule2026-jina.txt (3 rows) and 2026 regs appendix ("REGION 3 … Polk Tumbling Creek").

### S4. Completed feeds (destination-level)
- 2024 archive reports (9/27/2024 sr2024; 12/3/2024 stockreport): no Tumbling rows (spring feeds outside rolling windows).
- May–June 2024 completed JSON (completed2024.txt): no Tumbling in window (last 2024 feed Apr 28 week) — consistent.
- Sept-2026 live completed JSON (completed2026-jina.txt, retrieved 2026-09-25): no Tumbling (2026 season finished ~May) — consistent. No completed-feed contradiction with Mar–Apr.

### S5. Species beyond rainbow + voucher
- Trout Management Plan 2017–2027 (TWRA Fisheries Report 17-10, Oct 2017): "Brown Trout are also stocked in a few streams, such as Tumbling Creek and Turtletown Creek in Polk County." Establishes brown trout stocking component (timing not specified in schedules; the schedule grids track rainbow loads).
- GBIF occurrence 1024538068 (Auburn University Museum Fish Collection, PRESERVED_SPECIMEN): Oncorhynchus mykiss Walbaum, 1792; eventDate 2005-09-16; locality "Tumbling Creek, at Tumbling Creek Campground, 5.0 miles W of Ducktown", Polk County, TN. https://www.gbif.org/occurrence/1024538068 (API api.gbif.org/v1/occurrence/search, retrieved 2026-09-25).
  - Interpretation: rainbow trout present in the stocked reach mid-September 2005. 2005 schedule not archived (2003–2009 gap), so origin is ambiguous: holdover from a spring 2005 stocking OR fall 2005 event OR wild. Does NOT evidence December–January stocking.
- USFS Tumbling Creek Campground page (retrieved 2026-09-25): 8-site campground "along the banks of Tumbling Creek" near Ocoee #3 Lake — matches ArcGIS S3. https://www.fs.usda.gov/r08/cherokee/recreation/tumbling-creek-campground
- TWRA video feature "Trout Fishing Tennessee's Tumbling Creek" (YouTube 6DEn3hRNMiI) — promotes it as a stocked seasonal fishery.

### S6. Wild/holdover context (keep stocked reach separate)
- r4-2018 Appendix A wild-sampling table has NO row for Polk Tumbling Creek (the Tumbling row there is Unicoi Co., Nolichucky) — no documented quantitative wild sample for this water.
- Stocked reach = campground/trail corridor; upstream/headwater forest sections are non-stockContext (USFS: wild trout common in headwater streams).
- Holdover: 2021–2023 7-feed Feb–May programs plausibly carry fish into early summer; GBIF Sept voucher shows at least one fish surviving to September; still no basis for Dec/Jan.

## Months-by-year table (planned rows, Sunday week-of)

| Year | Dec | Jan | Feb | Mar | Apr | May | Jun | Jul–Nov | Source |
|---|---|---|---|---|---|---|---|---|---|
| 2010 | – | – | – | X | X | X | (X?) | – | sched10 |
| 2011 | – | – | X | X | X | X | – | – | sched11 |
| 2012 | – | – | – | X | X | X | X | – | sched12 |
| 2013 | – | – | – | X | X | X | – | – | sched13 |
| 2014 | – | – | – | (X) | X | X | X | – | sched14b |
| 2015 | – | – | – | X | X | X | X | – | sched15b |
| 2016 | gap — no archived schedule | | | | | | | | CDX |
| 2017 | gap — no archived schedule | | | | | | | | CDX |
| 2018 | – | – | X | X | X | X | – | – | sched2018 |
| 2019 | – | – | X | X | X | X | – | – | sched2019/9b |
| 2020 | – | – | X | X | X | X | – | – | cp replay-trap PDF |
| 2021 | – | – | X | X X | X X | X X | – | – | cp-2021 |
| 2022 | – | – | X | X X | X X | X X | – | – | cp-2022 |
| 2023 | – | – | X | X X | X X | X X | – | – | cp-2023 |
| 2024 | – | – | – | X X | X | – | – | – | cp-2024 |
| 2025 | – | – | – | X X | X | – | – | – | cp-2025 |
| 2026 | – | – | – | X X | X | – | – | – | live JSON |

## Species
- Rainbow trout (scheduled + ArcGIS + 2026 JSON). Brown trout also reported stocked (Mgmt Plan 2017–2027). Wild rainbow/brown possible in headwaters (USFS general).

## Type & confidence
- Type: seasonal put-and-take rainbow stocking (+ small brown component per plan), Cherokee NF campground/trail reach.
- Months verdict: **catalog [12,1,2] KILLED.** No December/January planned or completed event in any documented year. Current (2024–2026): March–April, 3 feeds (2026: weeks of 3/1, 3/29, 4/26). Historical: Feb–May (2011, 2018–2023), Mar–Jun (2010–2015). Confidence HIGH for decoded years; GAP 2016–2017 + 2003–2009 (not archived); 2005 GBIF voucher is a single September fish of ambiguous origin — flagged, not month evidence.
- Contradictions: none between sources. Decoding hazards specific to this creek — Humphreys Tumbling row-bleed (fixed by row scoping; earlier naive column totals overcounted 2021/2024) and Unicoi Tumbling in wild tables (different county) — both documented and resolved.

## Searches run (Tumbling-specific)
1. WebSearch: "Tumbling Creek" Polk Ducktown Tennessee trout stocked campground brown TWRA fishing
2. WebSearch: Tumbling Creek campground Polk County Tennessee Cherokee National Group Camp (USFS campground page)
3. GBIF API: occurrence/search q="Tumbling Creek" country=US; scientificName=Oncorhynchus mykiss Tennessee 2005 (voucher 1024538068 found)
4. ArcGIS Online item search + live FeatureServer query (POLK/Tumbling — 3 sites)
5. CDX: schedNN 03–17; trout-information-stockings; Trout_Map; rules 1660-4
6. Wayback fetches + geometric decode: sched10–15, sched2018/19, cp-2018–2025 (Tumbling rows, Humphreys bleed corrected)
7. grep r4-2017/2018/2019/2020b/2021c/2023 wild tables (Unicoi Tumbling distinguished; no Polk row)
8. Trout Management Plan 2017–2027 extraction (brown-trout sentence)
9. USFS Cherokee NF pages (Tumbling Creek Campground)
10. TWRA YouTube feature discovery (search result)
11. 2026 regs appendix (ereg_tn_2026.txt) + 2026 schedule page capture + Sept-2026 live completed JSON
12. Local artifact greps: sr2024, stockreport-202412, completed2024 (no Tumbling rows in windows)

## Recommendation
Classify Tumbling Creek (Polk) as **seasonal spring stocking: March–April currently (3 feeds; 2026 weeks of ~Mar 1, Mar 29, Apr 26)**; Feb–May in 2011 and 2018–2023; Mar–Jun in 2010–2015. Note rainbow (+ minor brown) species component. Remove December and January. Month-range field: **March–April (current), February–May (multi-year norm)**.
