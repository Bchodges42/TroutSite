# Standing Rock Creek (Stewart County, TN) — trout-evidence research log

Water: **Standing Rock Creek** — small tributary of the Cumberland River (Kentucky Lake embayment), Stewart County, TN, near The Trace/Fort Henry Rd area between Dover and Land Between the Lakes. Ledger tag under test: "seasonal-stocked, months [12,1,2] SUSPECT", county guessed "Pickett/Fentress?".
Reach/coordinates: TWRA stocking site **36.43676, -87.99849** (OBJECTID 416, "Standing Rock Creek Spring Trout Site"); ledger NHD anchor -87.9983, 36.4367 (HUC 06040005, snap 2 m, NHD name "Standing Rock Creek"). GBIF lot on a tributary at 36.431, -87.956.
Retrieval date for all sources: **2026-09-25** (Wayback snapshots dated individually). Research only; no contact; no catalog edits.

**RECOMMENDATION (bottom line): seasonal (spring) — months ≈ FEBRUARY–APRIL, occasionally into early May; ledger months [12,1,2] are WRONG; county Pickett/Fentress is WRONG — the water is in STEWART County (TWRA Region 1, "Seasonal" program). December–January–February stocking is contradicted in every year with retrievable evidence (2010–2013 planned; 2018, 2022, 2023, 2024, 2026 completed/planned), and TWRA explicitly cancelled late-season stockings in 2010 because water temperature already exceeded 70 °F on May 28 — physically incompatible with a Dec–Feb season. Confidence: HIGH.**

---

## A. Sources

### A1. TWRA 2026 Trout Stocking Schedule JSON — 2026 plan: FEBRUARY + MARCH weeks
- Org: TWRA; URL https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json (616 rows; parsed 2026-09-25 via browser-context/jina-style fetch; plain curl blocked).
- Row verbatim: REGION 1, COUNTY **Stewart**, LOCATION "Standing Rock Creek", TYPE "Seasonal", STOCKING DAY "", STOCKING WEEK **"2/22/2026", "3/22/2026", "03/29/2026"**, SPECIES "Rainbow Trout" (3 rows).
- Establishes: 2026 planned season = late Feb + Mar (weeks of 2/22–3/29). Confidence: HIGH.

### A2. TWRA Tentative Trout Stocking Schedule grids (Wayback PDFs, local cache scheds/) — 2010–2015
Captured from tn.gov/twra/fish/StreamRiver/stockedtrout/schedNN.pdf (2010: 20100529052023; 2011: 20110411171330; 2012: 20120418153139; 2013: 20130110160747; 2014: 20140412203121; 2015: 20150412203401); retrieved 2026-09-25.
- **2010 (sched10)**: "Stewart Standing Rock Creek" — 3 X-marks in the FEBRUARY–APRIL week-of columns (weeks ~mid-Feb, mid-Mar, mid-Apr; whole grid runs Feb–Oct). "Houston Whiteoak Creek" (sister site) marked one week earlier.
- **2011 (sched11)**: identical pattern — 3 X, Feb/Mar/Apr window.
- **2012 (sched12)**: X's shifted ~1 week later (mid-Feb→early-May window; last X near the Apr 29/May columns).
- **2013 (sched13)**: same as 2012.
- **2014 (sched14b)**: row present, **NO X marks** — Standing Rock Creek not scheduled (Hurricane/Cane Creek rows stocked, so the grid itself is populated).
- **2015 (sched15b)**: row present, **NO X marks** — not scheduled in 2015 either.
- Establishes: spring (Feb–Apr) program 2010–2013; two dormant years 2014–2015. Confidence: HIGH (proportional-font column alignment for exact weeks is MEDIUM; month-level attribution is robust).

### A3. TWRA "Trout Stocking (2018)–(2025)" schedule PDFs — row present every year 2018–2025
- Wayback captures of the trout-information-stockings schedule PDF, local cache scheds/ (ts2018/ts2019/ts2019b/sched2018; cp-2018…cp-2025 series), retrieved 2026-09-25. "Stewart Standing Rock Creek" appears as a Region 1 destination in every year captured. **md5 replay analysis (as required):** distinct PDFs per season with documented replays — 0e5c3434 (2021-01-19) vs 41e350cc (2021-08-20 = 2021-12-30 replay); 6228d37e (2022-02-21) vs 9c75adf3 (2022-05-19); 3a748e6b (2023-02-20 = 2023-05-23 = 2023-11-26 replay); c3cfa00d (2024-02-19) vs 852e3117 (2024-05-20 = 2024-09-27 = 2024-12-23 replay); 2025 has four distinct digests (321048d5 02-08, fecd884c 03-20, 9d346c2c 06-24, 8b67aac0 09-02); one shared digest d8beba55 covers the 2018-07-17/2019-01-09/2019-10-30/2020-01-24 captures (extracted text carries a "Trout Stocking (2020)" title — provenance caveat noted, treat as one artifact). Caveat: in these post-2017 PDFs the X-marks are not in the text layer, so month attribution for 2018–2025 rests on completed releases (A4) and the 2026 JSON (A1), both of which are spring.
- Establishes: continuous presence as a Region 1 seasonal destination 2018–2025. Confidence: HIGH (presence), MEDIUM (exact months within those years).

### A4. TWRA Coldwater Trout Stocking Schedule (completed "last stocked" reports) — dated spring stockings
- (a) "Coldwater Stocking" report cached as cw_stocking_2019.txt (report current early 2019; retrieved 2026-09-25): "Standing Rock Creek **4/25/2018**" (Region 1; Whiteoak Creek same date).
- (b) "Coldwater Trout Stocking Schedule, Updated: 5/17/2022" (scheds/cw2022may.pdf, pdftotext -layout): "1 Standing Rock Creek **05/16/2022**" (and Whiteoak Creek 04/20/2022).
- (c) cw2023may.pdf: "Standing Rock Creek **04/25/2023**". (d) cw2024may.pdf: "Standing Rock Creek **04/23/2024**".
- Establishes (destination-level completed): APRIL 2018, MAY 2022, APRIL 2023, APRIL 2024. Zero completed records in Dec/Jan/Feb in any captured report. Confidence: HIGH.

### A5. TWRA Stocked Trout page, Wayback capture 2010-05-29 — 2010 season: delayed then CANCELLED for heat
- "Tennessee Wildlife Resources Agency - Stocked Trout" page, http://tn.gov/twra/fish/StreamRiver/stockedtrout/stockedtrout.html, capture 20100529052103 (id_ raw), retrieved 2026-09-25. Verbatim: "Whiteoak Creek (Houston Co.) and **Standing Rock Creek (Stewart Co.)** has been delayed from the week of May 2 to the week of May 9 due to high creek elevations and flooding." and "…stockings have been **cancelled for 2010 due to water temperatures in excess of 70 degrees F. (posted May 28, 2010)**".
- Establishes: (i) agency-level county attribution "Stewart Co."; (ii) season runs until water hits 70 °F by late May — a put-and-take coldwater season that CANNOT extend into Dec–Feb on this stream. Confidence: HIGH.

### A6. TWRA GIS per-creek stocked-trout map (2010) — stocking site on the Stewart Co. creek
- "Stocked Trout Program — Standing Rock Creek", produced by TWRA GIS 12/10/2010, http://www.tn.gov/twra/gis/troutpdf/StandingRockCreek.pdf, capture 20110411173807 (retrieved 2026-09-25): map shows STEWART county, Hwy 49/The Trace/Fort Henry Rd area, Kentucky Lake to the west, with a "Stocking Site" marker on the creek.
- TWRA ArcGIS Stocking Locations row OBJECTID 416 (730-row dump re-verified 2026-09-25): "Standing Rock Creek Spring Trout Site", **STEWART**, Region 1, StockingProgram "Spring", stream, Species "rainbow", 36.43676/-87.99849.
- Establishes: identity + program type "Spring". Confidence: HIGH.

### A7. GBIF / NAS / iNat — no trout in collections; native biota documented
- GBIF q="Standing Rock Creek" (retrieved 2026-09-25): 1966/1968 lots "Tributary of Standing Rock Creek, Kentucky Lake", Stewart Co. — **Eurycea cirrigera, Desmognathus conanti** (salamanders); no fish lots, no trout.
- USGS NAS county=Stewart (retrieved 2026-09-25): 64 records, **no trout** (CMS/reservoir species: striped bass, silver carp, zebra mussel, etc.).
- iNaturalist Salmonidae within 8 km of 36.43/-87.99 and by name: **0 observations** (retrieved 2026-09-25).
- Establishes: no trout occurrence records of any kind; the stocked rainbows are program fish (put-and-take). Weighted negative for self-sustaining presence. Confidence: MEDIUM-HIGH.

---

## MONTHS-BY-YEAR STOCKING TABLE
| Year | Planned months | Completed (dated) | Source |
|---|---|---|---|
| 2003–2009 | not retrievable (no pre-2010-05 archive of the stocked-trout pages; CDX checked) | none | coverage gap only |
| 2010 | 3 stockings Feb–Apr (grid); week-of-May-2 event delayed to May 9; remainder cancelled 5/28 (water >70 °F) | partial (cancelled) | sched10 + stockedtrout.html capture |
| 2011 | Feb–Apr (3 grid marks) | — | sched11 |
| 2012 | ~mid-Feb–early-May (3 marks, shifted late) | — | sched12 |
| 2013 | ~mid-Feb–early-May | — | sched13 |
| 2014 | NOT scheduled (row with no X) | — | sched14b |
| 2015 | NOT scheduled | — | sched15b |
| 2016–2017 | site-transition era; no schedule captured | — | CDX gap |
| 2018 | seasonal (row present) | **4/25/2018** | cw_stocking_2019 |
| 2019–2021 | seasonal (row present) | — | cp/ts captures (X-marks not in text layer) |
| 2022 | seasonal | **5/16/2022** | cw2022may (upd. 5/17/2022) |
| 2023 | seasonal | **4/25/2023** | cw2023may |
| 2024 | seasonal | **4/23/2024** | cw2024may |
| 2025 | seasonal (row present; 4 distinct PDF digests) | — | cp-2025 captures |
| 2026 | weeks of **2/22, 3/22, 3/29** | — | 2026 JSON |

## Species
Rainbow Trout (planned/stocked species in every source; ArcGIS "rainbow"; 2026 JSON "Rainbow Trout").

## Contradictions
- Ledger months [12,1,2] vs every dated source (Feb–Apr/May): ledger months REJECTED. Probable contamination source: TWRA Region 1 "Winter"-type rows (West TN city lakes, stocked 1/14/2026 + TBD 12/2026) share the region number but are a different program.
- Ledger county guess Pickett/Fentress vs agency sources (Stewart): county corrected to Stewart.
- Ledger region tag "tn-upper-cumberland" vs geography: the creek is in the Lower Cumberland (HUC 06040005), Stewart Co., Western Highland Rim/Kentucky Lake — NOT the Upper Cumberland plateau; the tag is a ledger-grouping error.

## Searches run (≥8)
1. Local corpus grep (schedules 2009–2026, arcgis_all.json, stockings feeds, reports) for "Standing Rock"
2. 2026 schedule JSON parse (browser-context)
3. sched10–15 full-grid extraction (month columns)
4. cp/ts 2018–2025 captures + md5 replay analysis
5. Coldwater completed reports 2018/2022/2023/2024 extraction
6. Wayback stockedtrout.html 2010-05-29 capture fetch + quote
7. Wayback TWRA GIS StandingRockCreek.pdf (2011 capture) fetch
8. Wayback CDX sweeps (stockedtrout dir; pre-2010 trout pages; 2016–2018 pdf search)
9. GBIF q="Standing Rock Creek"
10. USGS NAS county=Stewart
11. iNaturalist Salmonidae (name + 8-km radius)
12. WebFetch live tn.gov trout page ("Report updated as of 9/21/2026")

## Recommendation
**Seasonal stocking with exact months: FEBRUARY, MARCH, APRIL (documented extensions into May in 2010 and 2022); no stocking December–February. Correct county to Stewart; treat the "tn-upper-cumberland" region tag as a mis-grouping. Confidence: HIGH.**
