# Brush Creek (Cocke County, TN) — seasonal months audit ([12,1,2] catalog suspect)

Retrieval date for all sources: 2026-09-25 (archive captures retrieved earlier by same project passes; noted per source). Research only; no agency contacted.

Ledger verdict under test: catalog months **[12,1,2]** (Dec/Jan/Feb).
**Conclusion up front: [12,1,2] is WRONG. Brush Creek (Cocke, Del Rio) is a TWRA Seasonal spring stream stocked with catchable Rainbow Trout on 2–5 week-of dates running late Feb/early Mar through May in every retrieved year 2003–2026. There is no December or January stocking in any retrieved year, and February appears only as a last-Sunday start (Feb 29, 2004). Recommend re-class: seasonal, months Mar, Apr, May (rare late-Feb opener; May absent in 2012–2014). Confidence: high.**

---

## The water and its reach
- Brush Creek rises on Paint Mountain near the Greene–Cocke line (~2,335 ft), flows SW along Forest Road 209 (Brush Creek Road) and enters the French Broad River upstream of Del Rio, Cocke County (Bald Mountains, Cherokee National Forest). Lower stocked reach is entirely in Cocke County.
- Stocked reach: 12 named TWRA access points ("First Pull Off On Left S12" down to "Lower Bridge S1") at 35.9444–35.9601 N, −82.9335 to −82.9355 W; management = USFS (CNF); StockingProgram = **Spring**; species = rainbow; 20–30 fish/site.
- One Region-4 Brush Creek exists in TWRA data (Hawkins County has no Brush Creek; the grids show "Cocke Brush Creek" and separately "Hawkins Big Creek"), so the destination row is unambiguous.

## Sources

### S1. TWRA 2026 Trout Stocking Schedule (state datatable JSON, 616 rows)
- Org: TWRA. URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json (tn.gov blocks plain curl; fetched via browser-context proxy). Local: `tmp/research/completion/schedule2026-jina.txt` (retrieved 2026-09-24 13:26 GMT) and `trout_2026_live.json` (prior pass 2026-09-22). **Re-fetched live 2026-09-25 in this pass — identical 616 rows.**
- Fields: REGION 4 | COUNTY Cocke | LOCATION "Brush Creek" | TYPE **"Seasonal"** | SPECIES "Rainbow Trout".
- Rows (STOCKING WEEK, Sundays): 3/8, 3/22, 4/5, 4/19, 5/3 — five rows, Mar 8–May 3. No fall/winter rows.
- Establishes: 2026 plan; Seasonal type; rainbow only. High confidence.

### S2. TWRA printed 2026 regulations stocking table (`scheds/ereg_tn_2026.pdf`, p.2)
- Org: TWRA (2026 Tennessee fishing regulations). Word-coordinate decode of the rotated grid (stream columns are stacked vertical headers; bullets per week row).
- Brush Creek column: 5 marks in Mar, Apr, May (printed table uses Thursday-dated week rows: Mar 12, Apr 9/23-week, May 7/21-week cluster). Same Mar–May core as S1; 2026 corroborated in print.
- Establishes: independent printed 2026 confirmation. High confidence on months.

### S3. TWRA archived grid schedules 2003–2017 (PDFs, word-coordinate/rotated-grid decode)
- Files: `tmp/research/completion/scheds/sched03.pdf` (state.tn.us 2003 Tentative Trout Stocking Schedule), sched04–sched13, sched14b, sched15b, sched2016, sched2017. (sched14.pdf/sched15.pdf are empty Wayback captures; sched14b/15b are the good copies. sched16/17.pdf are unrelated JS shells.)
- Decode method: PyMuPDF word boxes mapped in display space; day-number header line matched against the year's week-of sequence (all grid dates are Sundays through 2017); X marks assigned to nearest row/column. Prior agents' warning (pdftotext -layout scrambles the X grid) confirmed and solved geometrically.
- Brush Creek rows (week-of Sundays):
  | Year | Dates | Months | Marks |
  |---|---|---|---|
  | 2003 | Mar 2,16,30; Apr 13,27 | Mar,Apr | 5 |
  | 2004 | Feb 29; Mar 14,28; Apr 11,25 | Feb,Mar,Apr | 5 |
  | 2005 | Mar 6,20; Apr 3,17; May 1 | Mar,Apr,May | 5 |
  | 2006 | Mar 12,26; Apr 9,23; May 7 | Mar–May | 5 |
  | 2007 | Mar 11,25; Apr 8,22; May 6 | Mar–May | 5 |
  | 2008 | Mar 9,23; Apr 6,20; May 4 | Mar–May | 5 |
  | 2009 | Mar 8,22; Apr 5,19; May 3 | Mar–May | 5 |
  | 2010 | Mar 21; Apr 18; May 16,30 | Mar–May | 4 |
  | 2011 | Mar 6,20; Apr 3,17; May 1 | Mar–May | 5 |
  | 2012 | Mar 4,18; Apr 1,15,29 | Mar,Apr | 5 |
  | 2013 | Mar 3,17,31; Apr 14,28 | Mar,Apr | 5 |
  | 2014 | Mar 23; Apr 20 | Mar,Apr | 2 |
  | 2015 | Mar 8,22; Apr 5,19; May 3 | Mar–May | 5 |
  | 2016 | Mar 13,27; Apr 10,24; May 8 | Mar–May | 5 |
  | 2017 | Mar 12,26; Apr 9,23; May 7 | Mar–May | 5 |
- Establishes: 15 fully-parsed years; never Dec–Jan; February only as Feb 29, 2004 opener. High confidence.

### S4. TWRA "Trout Stocking (year)" Complete schedules 2018–2025 (PDFs, same decode)
- Files/URLs (all `https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Trout-Stocking-Schedule-Complete.pdf` or predecessor, via Wayback; local `scheds/ts2018.pdf`, `ts2019.pdf`, `cp-20200124101438.pdf`, `cp-20210119123626.pdf` (+20210820, 20211230), `cp-20220221215138.pdf` (+20220519), `cp-20230220040610.pdf` (+20230523, 20231126), `cp-20240219225857.pdf` (+20240520, 20240927, 20241223), `cp-20250208215445.pdf` (+20250320, 20250624, 20250902)):
  | Year | Brush Creek dates | Months | Marks |
  |---|---|---|---|
  | 2018 | Mar 11,25; Apr 8,22; May 6 | Mar–May | 5 |
  | 2019 | Mar 10,24; Apr 7,21; May 5 | Mar–May | 5 |
  | 2020 | Mar 8,22; Apr 5,19; May 3 | Mar–May | 5 |
  | 2021 | Mar 14,28; Apr 11,25; May 9 | Mar–May | 5 |
  | 2022 | Mar 13,27; Apr 10,24; May 8 | Mar–May | 5 |
  | 2023 | Mar 12,26; Apr 9,23; May 7 | Mar–May | 5 |
  | 2024 | Mar 10,24; Apr 7,21; May 5 | Mar–May | 5 |
  | 2025 | Mar 9,23; Apr 6,20; May 4 | Mar–May | 5 |
- **Replay trap (md5), as instructed:** `cp-20180717180317.pdf` = `cp-20190109035923.pdf` = `cp-20191030002119.pdf` = `cp-20200124101438.pdf`, md5 `d8beba5575041fd222125779f063a5c5` — all four are the SAME file and the title reads **"Trout Stocking (2020)"**; the 2018/2019-dated names are replays and were not used for 2018/2019 (those years come from ts2018/ts2019). Within-year duplicate md5s (expected replays): 20210820=20211230 `41e350cc…`; 20230220=20230523=20231126 `3a748e6b…`; 20240520=20240927=20241223 `852e3117…`. Distinct files with identical decoded rows: 2021 (0e5c3434 vs 41e350cc), 2022 (6228d37e vs 9c75adf3), 2024 (c3cfa00d vs 852e3117), 2025 (321048d5 / fecd884c / 9d346c2c / 8b67aac0 — four distinct files, same schedule).
- `twra_trout_json_2024.json` is a Wayback error page (dead capture; discarded). `twsched-*` files are TAILWATER schedules (not this water). r4-2017/2018… large PDFs are the Region IV reports (see S7).
- Establishes: 2018–2025 wall of Mar–May only. High confidence.

### S5. Completed feeds (destination-level)
- (a) 2022: "Coldwater Trout Stocking Schedule, updated 5/17/2022" (`scheds/cw2022may.pdf`): **4 Brush Creek 05/10/2022** (executed).
- (b) 2023: "updated as of 5/3/2023" (`cw2023may.pdf`): **4 Brush Creek 04/24/2023**.
- (c) 2024: "updated May 17, 2024" (`cw2024may.pdf`): **4 Brush Creek 05/06/2024**; independently the Wayback 2024-06-07 capture of the TWRA completed-stockings JSON (`completed2024.txt`, from https://web.archive.org/web/20240607134309id_/https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_panel_348017491_c/content/tn_complex_datatable.exceldriven.json?_=1717767789374): **"Brush Creek", Region 4, 05/06/2024** — this is the committed capture the ledger flagged; a May execution row, consistent with the spring program (not a [12,1,2] program).
- (d) Sept 2026 live completed feed (published 2026-09-24, `completed2026-jina.txt`, node tn_complex_datatable.exceldriven.json): 10 rows, window 8/25–9/18/2026 — **no Brush Creek** (seasonal water dormant in window; consistent, not a negative). Summer/fall reports (sr2024 9/27/2024; stockreport-202412 12/3/2024; stockreport-202509 8/29/2025) likewise contain no Brush Creek rows (rolling-window effect).
- Establishes: destination-level executions 2022, 2023, 2024 — all April/May. High confidence.

### S6. TWRA ArcGIS stocking-locations layer
- https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0/query (local dump `arcgis_all.json`, 730 features, re-verified by prior pass 2026-09-25): 12 Brush Creek points, OBJECTIDs 122–132 + 260; County COCKE, City Del Rio, StockingProgram **Spring**, WaterClass stream, Species rainbow, Management USFS, NumStocked 20–30/site, sunrise-to-sunset access, gravel pull-offs.
- Sites/coords (lat, lon): S12 First Pull Off On Left 35.96006,−82.93553; S11 Second Pull Off On Left 35.95981,−82.93453; S10 Third Pull Off 35.95911,−82.93492; S9 First Bridge 35.95817,−82.93442; S8 Second Bridge 35.95753,−82.93389; S7 Fourth Pull Off On Right 35.95503,−82.93406; S6 Below Bridge 35.95397,−82.93506; S5 Fourth Bridge 35.95147,−82.93453; S4 Fifth Pull Off On Left 35.95100,−82.93472; S3 Below Fourth Bridge 35.94969,−82.93439; S2 Fifth Bridge 35.94817,−82.93350; S1 Lower Bridge 35.94436,−82.93350.
- Establishes: destination-level program metadata; Spring only. High confidence.

### S7. TWRA Region IV coldwater reports (wild-fishery context)
- `scheds/r4-2018.txt` ("Coldwater Trout Fishing 2018 Regional Report for Region 4", TWRA; R4-2018 series at https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Coldwater-Trout-Report-R4-2018.pdf): qualitative survey table lists **Brush Creek, French Broad, Cocke, CNF, 35.95817, −82.93442, surveyed Jun-2015, trout present: None** (i.e., no trout at the June check — after the May season, consistent with full put-and-take harvest/no summer holdover statement by omission). Brush Creek is NOT in Appendix Table A-1 quantitative wild-trout list (1991–2018) — no documented wild trout fishery.
- Establishes: no agency wild/holdover documentation for Brush Creek; absence of trout in a June survey fits a strict cool-season fishery. Medium-high confidence.

### S8. USFS Cherokee National Forest (managing forest)
- https://www.fs.usda.gov/r08/cherokee/recreation/opportunities (fetched 2026-09-25; page does not name Brush Creek). Search-indexed USFS fishing text ("rainbow trout averaging 8–12 inches are stocked in many streams typically between March and September") — generic CNF context only; TWRA's own schedules (Mar–May for this creek) govern.
- Establishes: CNF/Bald Mountains setting; no stream-specific months. Low weight.

### S9. Double D Fly Co. — "Brush Creek" small-water page
- https://doubledfly.com/small-waters/brush-creek (found via site search https://doubledfly.com/?s=Brush+Creek; fetched 2026-09-25): "Stocked put-and-take rainbows each spring. The 2026 schedule lists five stockings: March 8, March 22, April 5, April 19, and May 3." Also: rises on Paint Mountain near Greene–Cocke line, FR 209 roadside access, Houston Valley Campground upstream, "no verified wild trout or native brook trout population", "lower creek warms past trout tolerance by summer", statewide trout regs.
- Establishes (secondary, field-verified guide): independent echo of the exact 2026 Mar–May row set. Medium confidence (private site).

## Months supported, by year
| Year | Months with rows | Evidence |
|---|---|---|
| 2003 | Mar, Apr | sched03 (high) |
| 2004 | Feb 29, Mar, Apr | sched04 (high) |
| 2005–2011 | Mar, Apr, May (2010: 4 marks Mar–May) | sched05–11 (high) |
| 2012–2014 | Mar, Apr (2014: only 2 marks) | sched12, 13, 14b (high) |
| 2015–2017 | Mar, Apr, May | sched15b, sched2016, sched2017 (high) |
| 2018–2025 | Mar, Apr, May | ts2018/19, cp-2020…2025 (high) |
| 2026 | Mar, Apr, May (weeks 3/8–5/3) | 2026 JSON + regs PDF + DoubleDFly (high) |

Never stocked: Jun–Feb rows in any fully-parsed year (23 years). December and January: zero rows anywhere. February: one occurrence (Feb 29, 2004).

## Contradictions and gaps
- Catalog [12,1,2] has no support in any source; it likely reflects a winter-program mis-tag. The 05/06/2024 completed row is a **spring** execution, not winter.
- 2026 printed regs table uses Thursday-dated week rows (Feb 26…May 21) vs the live JSON's Sunday weeks — same Mar–May months; presentation differs.
- 2014 shows a reduced program (2 marks); 2010 shifted within Mar–May. No source shows any fall or winter event.
- Wild trout: none documented (not in Table A-1; Jun-2015 survey = None).

## Searches run (Brush Creek, Cocke)
1. WebSearch: "Brush Creek" Del Rio Tennessee trout fishing stocked TWRA Cherokee National Forest — USFS + DoubleDFly leads.
2. WebSearch: DoubleDFly "Brush Creek" fly fishing small water stocked — located the page.
3. WebSearch: doubledfly.com Brush Creek Tennessee — site identity.
4. WebFetch: https://doubledfly.com/?s=Brush+Creek — index hit /small-waters/brush-creek.
5. WebFetch: https://doubledfly.com/small-waters/brush-creek — full secondary confirmation (2026 five stockings Mar 8–May 3).
6. WebFetch: fs.usda.gov Cherokee fishing (redirect chain; /r08/cherokee/recreation/opportunities) — no stream names; generic context.
7. Local mining: sched03–sched2017 grids (15 years) geometric decode.
8. Local mining: ts2018/ts2019 + cp-2020…2025 Complete.pdf grids (8 more years).
9. Local mining: completed feeds cw2022may/cw2023may/cw2024may + Wayback 20240607 JSON + Sept-2026 live feed + sr2024/202412/202509 negatives.
10. Local mining: arcgis_all.json 12-site query; 2026 JSON live re-fetch; ereg_tn_2026.pdf printed grid; r4-2018 survey table + Appendix A-1 absence.
11. Unproductive: sched14.pdf/sched15.pdf (empty Wayback captures — use sched14b/sched15b); sched16/17.pdf (JS shells); twra_trout_json_2024.json (Wayback error page).

## Recommendation
- **Re-class Brush Creek (Cocke) from months [12,1,2] to seasonal, months Mar, Apr, May.** 23 fully-parsed schedule years (2003–2017, 2018–2025 grids; 2026 JSON + printed regs) show 2–5 week-of events always inside late-Feb(2004 only)/early-Mar → May; TYPE="Seasonal"; ArcGIS program="Spring"; species rainbow; executions confirmed May 10 2022, Apr 24 2023, May 6 2024; no trout at the Jun-2015 survey and no wild-trout record — a clean cool-season put-and-take reach on FR 209 in the Cherokee NF.
- If one month must be dropped for a shorter window: keep Mar, Apr, May anyway (May appears in 20 of 23 years; the 2012–2014 gap is historical).
- Confidence: high.
