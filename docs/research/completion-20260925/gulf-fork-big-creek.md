# Gulf Fork Big Creek (Cocke County, TN) — seasonal months + program history

Retrieval date for all sources: 2026-09-25 (archive captures retrieved earlier by same project passes; noted per source). Research only; no agency contacted.

Known-good water (GIS sites #1–7 at Hartford, Spring program, rainbow; 2024 archive row 05/20/2024). This log pins the exact months and years.
**Conclusion up front: Gulf Fork Big Creek is stocked on week-of Sundays from late February through May in every retrieved year 2003–2026 (February opener in 11 of 24 years; otherwise first week of March). No December or January event exists in any year. Recommend classification seasonal, months Feb (late), Mar, Apr, May — or Mar, Apr, May if the ledger only takes full months. Confidence: high.**

---

## The water and its reach
- Gulf Fork (a.k.a. Gulf Fork of Big Creek) is the western fork of Big Creek above Hartford, Cocke County; the stocked reach runs up Gulf Mountain Rd (Ball Road/FR corridor) toward the Cherokee NF boundary, Hartford TN.
- Stocked reach: 7 named TWRA points "#1"–"#7 - End" at 35.8127–35.8549 N, −83.0401 to −83.1076 W; management = USFS at #1, Private Land #2–#7; StockingProgram = **Spring**; species = rainbow; access "Contact Region 4" (much of the reach is private-land permission water).
- Distinct from: mainstem Big Creek (Cocke/Hartford), Trail Fork Big Creek (separate ledger row), and the Polk County "Big Creek" in the old R1–R3 grids.

## Sources

### S1. TWRA 2026 Trout Stocking Schedule (state datatable JSON, 616 rows)
- Org: TWRA. URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json (fetched via browser-context proxy). Local: `schedule2026-jina.txt` (2026-09-24 13:26 GMT), `trout_2026_live.json` (2026-09-22). **Re-fetched live 2026-09-25 — identical.**
- Fields: REGION 4 | COUNTY Cocke | LOCATION "Gulf Fork Big Creek" | TYPE **"Seasonal"** | SPECIES "Rainbow Trout".
- Rows (STOCKING WEEK, Sundays): 2/22, 3/15, 4/5, 4/26, 5/17 — five rows, Feb 22–May 17.
- Establishes: 2026 plan; Seasonal; rainbow only. High confidence.

### S2. TWRA printed 2026 regulations stocking table (`scheds/ereg_tn_2026.pdf`, p.2)
- Word-coordinate decode of the rotated grid ("Big Cocke Creek Fork Gulf" column): 7 bullet marks distributed Mar–mid-June in the printed Thursday-week table (Mar 12, 26; Apr 9, 23; May 7, 21; +1 June week). Months Mar–May core match S1; the printed table shows one extra early/mid-June week that the operational 2026 JSON does not carry — minor contradiction, JSON governs.
- Establishes: 2026 spring program corroborated in print. Medium-high confidence (grid alignment ±1 week row).

### S3. TWRA archived grid schedules 2003–2017 (PDFs, geometric decode)
- Files: `scheds/sched03.pdf` … sched13, sched14b, sched15b, sched2016, sched2017 (sched14/sched15 are empty Wayback captures; sched16/17.pdf are JS shells). Sunday week-of columns calibrated against each year's calendar; X marks mapped by coordinates.
- Gulf Fork Big Creek rows:
  | Year | Dates | Months | Marks |
  |---|---|---|---|
  | 2003 | Mar 2,16,30; Apr 13,27; May 11,25 | Mar–May | 7 |
  | 2004 | Feb 29; Mar 14,28; Apr 11,25; May 9,23 | Feb–May | 8 |
  | 2005 | Feb 27; Mar 13,27; Apr 10,24; May 8,22 | Feb–May | 8 |
  | 2006 | Mar 5,19; Apr 2,16,30; May 14,28 | Mar–May | 8 |
  | 2007 | Mar 4,18; Apr 1,15,29; May 13,27 | Mar–May | 8 |
  | 2008 | Mar 2,16,30; Apr 13,27; May 11,25 | Mar–May | 8 |
  | 2009 | Mar 1,15,29; Apr 12,26; May 10,24 | Mar–May | 8 |
  | 2010 | Feb 28; Mar 14,28; Apr 11,25; May 23 | Feb–May | 7 |
  | 2011 | Feb 27; Mar 13,27; Apr 10,24; May 8,22 | Feb–May | 8 |
  | 2012 | Feb 26; Mar 11,25; Apr 8,22; May 6,20 | Feb–May | 8 |
  | 2013 | Feb 24; Mar 10,24; Apr 7,21; May 5,19 | Feb–May | 8 |
  | 2014 | Mar 16,30; Apr 13,27; May 11,25 | Mar–May | 7 |
  | 2015 | Mar 1,15,29; Apr 12,26; May 10,24 | Mar–May | 7 |
  | 2016 | Mar 6,20; Apr 3,17; May 1,15,29 | Mar–May | 8 |
  | 2017 | Mar 5,19; Apr 2,16,30; May 14,28 | Mar–May | 8 |
- Establishes: 15 fully-parsed years, 7–8 events/yr, Feb(last wk)–May; never Dec/Jan. High confidence.

### S4. TWRA "Trout Stocking (year)" Complete schedules 2018–2025 (PDFs, same decode)
- Files/URLs: Complete.pdf family via Wayback; local `scheds/ts2018.pdf`, `ts2019.pdf`, `cp-2020…cp-2025` series (same captures described in brush-creek-cocke.md S4, including the md5 replay trap: cp-20180717/20190109/20191030/20200124 all md5 `d8beba55…` = "Trout Stocking (2020)").
  | Year | Gulf Fork Big Creek dates | Months | Marks |
  |---|---|---|---|
  | 2018 | Mar 4,18; Apr 1,15,29; May 13,27 | Mar–May | 7 |
  | 2019 | Mar 3,17,31; Apr 14,28; May 12,26 | Mar–May | 8 |
  | 2020 | Mar 1,15,29; Apr 12,26; May 10,24 | Mar–May | 7 |
  | 2021 | Mar 7,21; Apr 4,18; May 2,16,30 | Mar–May | 7 |
  | 2022 | Feb 27; Mar 13,27; Apr 10,24; May 8,22 | Feb–May | 7 |
  | 2023 | Feb 26; Mar 12,26; Apr 9,23; May 7,21 | Feb–May | 7 |
  | 2024 | Feb 25; Mar 10,24; Apr 7,21; May 5,19 | Feb–May | 7 |
  | 2025 | Feb 23; Mar 16; Apr 6,27; May 18 | Feb–May | 5 |
- Establishes: 2018–2025; program trimmed from ~7 to 5 events in 2025. High confidence.

### S5. Completed feeds (destination-level)
- (a) 2022: `cw2022may.pdf` (updated 5/17/2022): **4 Gulf Fork Big Creek 05/11/2022**.
- (b) 2023: `cw2023may.pdf` (updated 5/3/2023): **4 Gulf Fork Big Creek 04/27/2023**.
- (c) 2024: `cw2024may.pdf` (updated 5/17/2024): **4 Gulf Fork Big Creek 05/07/2024**; Wayback 2024-06-07 completed JSON (`completed2024.txt`): **"Gulf Fork Big Creek", Region 4, 05/20/2024** — two May executions visible across the two snapshot windows (executing the Apr 21 and May 5 week-of rows; the 06/07 capture is the committed archive cited in the ledger).
- (d) Sept 2026 live completed feed (`completed2026-jina.txt`, published 2026-09-24): window 8/25–9/18/2026, 10 rows — **no Gulf Fork** (season over; rolling-window, not a negative). Summer/fall reports (sr2024 9/27/2024, stockreport-202412, stockreport-202509 8/29/2025) — no rows (same effect).
- Establishes: destination-level executions 2022–2024, all April/May. High confidence.

### S6. TWRA ArcGIS stocking-locations layer
- https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0/query (local `arcgis_all.json`, 730 features; re-verified 2026-09-25): 7 points, OBJECTIDs 405 (#1), 404 (#2), 403 (#3), 801 (#4), 264 (#5), 148 (#6), 406 (#7 - End); County COCKE, City Hartford, StockingProgram **Spring**, Species rainbow, WaterClass stream; Management: #1 USFS, #2–#7 Private Land; SunriseSunset No; HoursOpen "Contact Region 4"; #1 and #3 gravel parking, others null/dirt.
- Sites/coords (lat, lon): #1 35.81266,−83.04008 (USFS); #2 35.81415,−83.04102; #3 35.83053,−83.05720; #4 35.82117,−83.08344; #5 35.84305,−83.09849; #6 35.85055,−83.10115; #7 End 35.85489,−83.10757.
- Establishes: destination-level program metadata, Spring only, private-land reach. High confidence.

### S7. TWRA Region IV coldwater reports — survey + wild-strain context
- `scheds/r4-2018.txt` (R4-2018 report): qualitative survey table — **Gulf Fork Big Creek, French Broad, Cocke, Private** — four points 35.82385/−83.09162, 35.83037/−83.05730, 35.82064/−83.04665, 35.81805/−83.04191, surveyed **May-2007, species present RBT/BNT** (stocked rainbows plus browns present at survey).
- Appendix Table A-1 (quantitative wild trout samples 1991–2018): **Gulf Fork Big Creek — 1993, 2004, 2008 — RBT/BNT — 3 samples**; tributaries: Deep Gap Creek (State Forest, 2005, RBT), Laurel Creek (State Forest, 2013, RBT), **M. Prong Gulf Creek (1991, BKT)**, **Brown Gap Creek (1991, BKT)**.
- r4-2019/2020b/2021c/2023: Gulf Fork tributaries (Deep Gap, Brown Gap, Middle Prong Gulf Creek) hold the **unique French Broad-watershed strain of native Brook Trout** and served as the donor/broodstock source for the Trail Fork restoration (41 BKT collected Sept 2019/2020 → Tellico Hatchery; 9 broodstock released to Trail Fork 2021; 18 adults + 52 age-0 translocated Sept 2022).
- EBTJV project page (https://easternbrooktrout.org/projects/2021-projects/improving-connectivity-for-reintroduced-native-brook-trout-in-trail-fork-of-big-creek-cocke-county-tn, fetched 2026-09-25): "Native brook trout exist in Wolf Creek and Gulf Fork, both carrying a unique strain of NBT only found in the French Broad Watershed."
- Establishes: the wild brook population is in Gulf Fork TRIBUTARIES (headwaters, above the stocked reach); the main fork's own fishery is stocked RBT (+ documented browns), sampled May (2007) with fish present. The seasonal rainbow program on the main fork is unaffected. Medium-high confidence.

## Months supported, by year
| Year | Months with rows | Evidence |
|---|---|---|
| 2003 | Mar, Apr, May | sched03 (high) |
| 2004 | Feb 29, Mar, Apr, May | sched04 (high) |
| 2005 | Feb 27, Mar, Apr, May | sched05 (high) |
| 2006–2009 | Mar, Apr, May | sched06–09 (high) |
| 2010–2013 | Feb (last wk), Mar, Apr, May | sched10–13 (high) |
| 2014–2015 | Mar, Apr, May | sched14b, 15b (high) |
| 2016–2017 | Mar, Apr, May | sched2016/2017 (high) |
| 2018–2021 | Mar, Apr, May | ts2018/19, cp-2020/2021 (high) |
| 2022–2024 | Feb (last wk), Mar, Apr, May | cp-2022/2023/2024 (high) |
| 2025 | Feb 23, Mar 16, Apr, May (5 events) | cp-2025 (high) |
| 2026 | Feb 22, Mar 15, Apr, May (5 events) | 2026 JSON + regs (high) |

Never stocked: Dec, Jan in any of 24 parsed years. Feb: last-Sunday opener in 2004, 2005, 2010, 2011, 2012, 2013, 2022, 2023, 2024, 2025, 2026. Latest row ever: May 31 week (2016); executions recorded through May 20 (2024).

## Contradictions and gaps
- 2026 printed regs show a 7th June-week bullet absent from the live JSON — the JSON (operational, retrieved 2026-09-25) governs; flag as presentation drift, not a program change.
- 2018/2019 "cp-" Wayback names are 2020 replays (md5 `d8beba55…`); 2018/2019 values rest on ts2018/ts2019 (which are internally consistent with adjacent years).
- Browns (BNT) documented at May-2007 survey — species field for the ledger should remain rainbow (program species), with brown presence a survey observation.
- Private-land reach: public legality depends on landowner permission ("Contact Region 4"); GIS flags it.
- No fall/winter rows in any source; no contradiction to the seasonal verdict found.

## Searches run (Gulf Fork Big Creek)
1. WebSearch: "Gulf Fork" Big Creek Hartford Tennessee trout stocking access — rate-limited; no direct hits.
2. WebSearch: EBTJV / easternbrooktrout "Trail Fork"/Gulf Fork — surfaced EBTJV project + French Broad strain.
3. WebFetch: https://easternbrooktrout.org/?s=Trail+Fork — located 2021 project page.
4. WebFetch: EBTJV project detail page — "Native brook trout exist in Wolf Creek and Gulf Fork…" quote.
5. Local mining: sched03–2017 grids (15 years).
6. Local mining: ts2018/19 + cp-2020…2025 grids (8 years) + md5 replay audit.
7. Local mining: completed feeds cw2022may/2023may/2024may + Wayback 20240607 JSON + Sept-2026 live + sr2024/202412/202509 negatives.
8. Local mining: arcgis_all.json sites #1–#7 with coords; storymap_data.json (no Gulf Fork rows — Soddy Creek Gulf only, distinct water).
9. Local mining: r4-2018 survey table (May-2007, RBT/BNT, 4 coord points) + Table A-1 (1993/2004/2008 samples; tributary BKT) + r4-2019/2020b/2021c/2023 donor-strain narratives.
10. 2026 JSON live re-fetch (2026-09-25) — identical 5 rows.
11. Unproductive: twsched-* files (tailwaters); st-201x StockedTrout captures (JS shells, no stream lists); twra_trout_json_2024.json (Wayback error page).

## Recommendation
- **Classify Gulf Fork Big Creek as seasonal, months Feb (last week), Mar, Apr, May** (equivalently Mar–May if full months only). 24 fully-parsed schedule years (2003–2026) show 5–8 week-of events/yr always inside late-Feb → May; TYPE="Seasonal"; ArcGIS program="Spring"; species rainbow; destination-level executions 05/11/2022, 04/27/2023, 05/07/2024 and 05/20/2024; the 2024 archive row ("Gulf Fork Big Creek 05/20/2024") is a spring execution, fully consistent.
- Keep the row distinct from mainstem Big Creek and Trail Fork Big Creek; note the 2025–2026 trim to 5 events and the private-land permission reach (#2–#7).
- The wild unique-strain brook trout live in the headwater tributaries (Brown Gap, Middle Prong Gulf, Deep Gap), not the stocked fork — do not let that justify a year-round or wild-fishery tag on this row.
- Confidence: high.
