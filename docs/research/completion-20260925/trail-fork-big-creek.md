# Trail Fork Big Creek (Cocke County, TN) — seasonal months + 2025 survey chase

Retrieval date for all sources: 2026-09-25 (archive captures retrieved earlier by same project passes; noted per source). Research only; no agency contacted.

Known: 2024 archive "Trail Fork Big Creek 05/20/2024"; StockedTrout2016 confirms the row; owner reported a 2025 survey that could not be found.
**Conclusion up front: Trail Fork Big Creek's stocked (lower, private-land) reach is a TWRA Seasonal spring rainbow water — week-of Sundays late Feb → May in every retrieved year 2003–2026, identical to Gulf Fork Big Creek. No December/January event in any year. The owner's "2025 survey" is most plausibly TWRA's Upper Trail Fork Brook Trout restoration monitoring (electrofishing surveys 2020–2022 documented; "another survey will be completed in 2023"), but NO 2023/2024/2025 survey result is published anywhere retrievable: the Region IV Coldwater Streams report series stops at the 2022 field season (R4-2023.pdf); R4-2024/2025/2026 are 404 on tn.gov and absent from Wayback; TN-AFS newsletters after Winter 2021 are not retrievable (bot wall; archive captures truncated at 1 MiB). Recommend seasonal, months Feb (late), Mar, Apr, May; flag the survey result as a records-request gap. Confidence: high (months), documented-gap (survey).**

---

## The water and its two reaches (critical distinction)
- **Stocked reach (this ledger row):** lower Trail Fork along Trail Fork Big Creek Rd (Walnut Mountain/ Del Rio area), Cocke County — 6 TWRA points "#1"–"#6 - End", 35.8703–35.8955 N, −83.0022 to −83.0094 W, management = Private Land, Spring program, rainbow.
- **Restoration reach (NOT this row):** upper Trail Fork (CNF/private inholdings), 3.5-km zone between ~2,680′ and 3,190′ elevation above a double waterfall at 35.83382 N, −82.96238 W (natural barrier), where TWRA/USFS/TU/TNC removed Rainbow Trout 2018–2020 and reintroduced native Brook Trout 2021–2022.
- 2003 grid context: the schedules list "Cocke Trail Fork Big Creek" (this water) separately from "Hawkins Big Creek" and "Polk Big Creek"; no ambiguity.

## Sources

### S1. TWRA 2026 Trout Stocking Schedule (state datatable JSON, 616 rows)
- Org: TWRA. URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json (browser-context fetch). Local: `schedule2026-jina.txt` (2026-09-24), `trout_2026_live.json` (2026-09-22). **Re-fetched live 2026-09-25 — identical.**
- Fields: REGION 4 | COUNTY Cocke | LOCATION "Trail Fork Big Creek" | TYPE **"Seasonal"** | SPECIES "Rainbow Trout".
- Rows (STOCKING WEEK, Sundays): 2/22, 3/15, 4/5, 4/26, 5/17 — five rows, Feb 22–May 17; still stocked in 2026.
- Establishes: 2026 plan; Seasonal; rainbow; program persists alongside the upstream brook restoration. High confidence.

### S2. TWRA printed 2026 regulations stocking table (`scheds/ereg_tn_2026.pdf`, p.2)
- Word-coordinate decode ("Big Cocke Creek Fork Trail" column): 7 bullets Mar → mid-June (Thursday-week printed rows; same drift as Gulf Fork column). Mar–May core matches S1; the June bullet is absent from the operational JSON — presentation drift, JSON governs.
- Establishes: printed 2026 corroboration. Medium-high confidence.

### S3. TWRA archived grid schedules 2003–2017 (PDFs, geometric decode)
- Files: `scheds/sched03.pdf`…sched13, sched14b, sched15b, sched2016, sched2017 (sched14/15 empty Wayback captures; sched16/17.pdf JS shells; decode method as in brush-creek-cocke.md S3).
- Trail Fork Big Creek rows — **identical dates to Gulf Fork Big Creek in every year**:
  2003 Mar 2,16,30/Apr 13,27/May 11,25 (7); 2004 Feb 29 + Mar 14,28 + Apr 11,25 + May 9,23 (8); 2005 Feb 27 + Mar 13,27 + Apr 10,24 + May 8,22 (8); 2006 Mar 5,19 + Apr 2,16,30 + May 14,28 (8); 2007 Mar 4,18 + Apr 1,15,29 + May 13,27 (8); 2008 Mar 2,16,30 + Apr 13,27 + May 11,25 (8); 2009 Mar 1,15,29 + Apr 12,26 + May 10,24 (8); 2010 Feb 28 + Mar 14,28 + Apr 11,25 + May 23 (7); 2011 Feb 27 + Mar 13,27 + Apr 10,24 + May 8,22 (8); 2012 Feb 26 + Mar 11,25 + Apr 8,22 + May 6,20 (8); 2013 Feb 24 + Mar 10,24 + Apr 7,21 + May 5,19 (8); 2014 Mar 16,30 + Apr 13,27 + May 11,25 (7); 2015 Mar 1,15,29 + Apr 12,26 + May 10,24 (7); 2016 Mar 6,20 + Apr 3,17 + May 1,15,29 (8); 2017 Mar 5,19 + Apr 2,16,30 + May 14,28 (8).
- **2016 confirmation:** sched2016 carries the Trail Fork row (Mar 6,20; Apr 3,17; May 1,15,29) — the local `stocked-trout-2016.html` ("Stocked Trout — TN.Gov") is a JS shell whose schedule link is sched15.pdf, so the 2016 grid itself is the confirming artifact.
- Establishes: 15 fully-parsed years; Feb(last wk)–May; never Dec/Jan. High confidence.

### S4. TWRA "Trout Stocking (year)" Complete schedules 2018–2025 (PDFs, same decode)
- Files: `ts2018.pdf`, `ts2019.pdf`, `cp-2020…cp-2025` series (same captures/md5 replay trap as brush-creek-cocke.md S4 — cp-2018xx/2019xx names are 2020 replays, md5 `d8beba55…`).
  | Year | Trail Fork Big Creek dates | Months | Marks |
  |---|---|---|---|
  | 2018 | Mar 4,18; Apr 1,15,29; May 13,27 | Mar–May | 7 |
  | 2019 | Mar 3,17,31; Apr 14,28; May 12,26 | Mar–May | 8 |
  | 2020 | Mar 1,15,29; Apr 12,26; May 10,24 | Mar–May | 7 |
  | 2021 | Mar 7,21; Apr 4,18; May 2,16,30 | Mar–May | 7 |
  | 2022 | Feb 27; Mar 13,27; Apr 10,24; May 8,22 | Feb–May | 7 |
  | 2023 | Feb 26; Mar 12,26; Apr 9,23; May 7,21 | Feb–May | 7 |
  | 2024 | Feb 25; Mar 10,24; Apr 7,21; May 5,19 | Feb–May | 7 |
  | 2025 | Feb 23; Mar 16; Apr 6,27; May 18 | Feb–May | 5 |
- Establishes: 2018–2025; 2025 trim to 5 events. High confidence.

### S5. Completed feeds (destination-level)
- (a) 2022: `cw2022may.pdf` (updated 5/17/2022): **4 Trail Fork Big Creek 05/11/2022**.
- (b) 2023: `cw2023may.pdf` (updated 5/3/2023): **4 Trail Fork Big Creek 04/27/2023**.
- (c) 2024: `cw2024may.pdf` (updated 5/17/2024): **4 Trail Fork Big Creek 05/07/2024**; Wayback 2024-06-07 completed JSON (`completed2024.txt`): **"Trail Fork Big Creek", Region 4, 05/20/2024** — the committed archive row; two May executions across snapshot windows (executing Apr 21 and May 5 week-of rows).
- (d) Sept 2026 live completed feed (`completed2026-jina.txt`, published 2026-09-24): 10 rows, window 8/25–9/18/2026 — **no Trail Fork** (season over; rolling window, not a negative). sr2024 (9/27/2024), stockreport-202412 (12/3/2024), stockreport-202509 (8/29/2025): no rows (same effect).
- Establishes: executions 2022, 2023, 2024 — all April/May. High confidence.

### S6. TWRA ArcGIS stocking-locations layer
- https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0/query (local `arcgis_all.json`, re-verified 2026-09-25): 6 points, OBJECTIDs 802 (#1), 153 (#2), 155 (#3), 156 (#4), 399 (#5), 398 (#6 - End, StreamName field "Trail Fork"); City Del Rio; StockingProgram **Spring**; Species rainbow; Management Private Land; SunriseSunset No; HoursOpen "Contact Region 4"; #1 dirt parking.
- Sites/coords (lat, lon): #1 35.87028,−83.00218; #2 [Toms Cr Rd Bridge] 35.87743,−83.00937; #3 [Bell Carrie Way Bridge] 35.88316,−83.00927; #4 [Shelley Rock Farm Bridge] 35.88496,−83.00704; #5 35.88604,−83.00446; #6 End 35.89554,−83.00363.
- Establishes: destination-level metadata for the stocked lower reach (all private land, permission water). High confidence.

### S7. Upper-fork Brook Trout restoration — TWRA Region IV Coldwater Streams reports
- Series: "Fisheries Report: Region IV Coldwater Streams", https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Coldwater-Trout-Report-R4-<year>.pdf (Wayback holds 2017–2023 editions; digitalcommons.memphis.edu mirrors through 2021). Local: `scheds/r4-2018.txt`, `r4-2019.txt`, `r4-2020b.txt`, `r4-2021c.txt`, `r4-2023.pdf/.txt` (2022 field season, created 2023-08-08 by TWRA biologist Sally Petre).
- Chronology (quoted/condensed):
  - **2018** (r4-2018, §2.10.5): upper Trail Fork "between 2,680′ and 3,190′" chosen for cooperative BKT restoration (TWRA/USFS/landowners); double waterfall at 35.83382 N, −82.96238 W = barrier; 519 Rainbow Trout (354 age-0) electrofished out of the 3.5-km zone in summer 2018.
  - **2019** (r4-2019, p.29): another 183 RBT removed (incl. 11 age-0); 41 native BKT collected Sept 2019 from Deep Gap Creek (5), Brown Gap Creek (20), Middle Prong Gulf Creek (21) — Gulf Fork tributaries, unique French Broad strain → Tellico Hatchery; spawning failed.
  - **2020** (r4-2020b, p.17): final pass captured only 2 adult RBT — "removal is complete"; still no BKT available.
  - **2021** (r4-2021c, p.17): 9 surviving broodstock BKT released upper Trail Fork + 27 translocated from Wolf Creek (12 adult, 15 age-0); double culvert (FR 3249 crossing) replaced with a bridge, funded by TU, TWRA, USFS, USFWS, The Nature Conservancy, Tennessee Wildlife Resources Foundation.
  - **2022** (r4-2023, p.20): electrofishing survey — **1 adult, 1 subadult, 79 age-0 Brook Trout** (natural reproduction confirmed); **12 adult Rainbow Trout captured and removed**; Sept: 18 adults + 52 age-0 BKT translocated to lower Trail Fork (Lemon Prong/Rattlesnake Branch confluence → new bridge, ~400 m); "**Another survey will be completed in 2023** to confirm complete removal of Rainbow Trout and assess Brook Trout abundance and distribution."
  - **Table A-1 (r4-2018):** Trail Fork Big Creek quantitatively sampled 1996 and 2001 (RBT); tributary Dry Fork 1994 (BKT/RBT) — pre-restoration wild-RBT documentation.
- **R4-2024 / R4-2025 / R4-2026 (the surveys the owner wants): NOT published.** Probed 2026-09-25: tn.gov paths for R4-2024/2025/2026 return 404 (via r.jina.ai browser-context); Wayback CDX has zero captures of those filenames; digitalcommons collection ends at Coldwater 2021; no web-indexed copy (WebSearch/DDG/Bing/Mojeek). The TN-AFS Winter 2021 Newsletter (units.fisheries.org, /uploads/sites/15/2022/01/TNAFS-Winter-2021-Newsletter.pdf) announced "We stocked Brook Trout into two new creeks this year — Trail Fork of Big Creek and Norton Creek" (search-index snippet; live site 403, Wayback capture truncated at 1 MiB); later newsletters (Winter 22-23 etc.) truncated in Wayback and unreadable.
- Establishes: rich agency documentation 2018–2022; the 2023 follow-up survey and any 2024/2025 survey are **unpublished publicly**. The owner's "2025 survey" could not be located and cannot be confirmed from open sources.

### S8. EBTJV (Eastern Brook Trout Joint Venture) project page
- https://easternbrooktrout.org/projects/2021-projects/improving-connectivity-for-reintroduced-native-brook-trout-in-trail-fork-of-big-creek-cocke-county-tn (fetched 2026-09-25): 2021 project "Restoring Brook Trout in the Bald Mountains of Tennessee"; partners TWRA, CNF, TU, TNC; "Trail Fork's historical population was extirpated and replaced with non-native rainbow trout"; components include the FS Rd 96 Wolf Creek crossing replacement; unique French Broad strain noted. Organization of record: Tennessee Wildlife Resources Foundation.
- Establishes: independent partner-side documentation of the project and its 2021 scope. High confidence (for the restoration, not the stocking row).

### S9. Secondary/angler echoes
- Piscamaps (search snippet, 2026-09-25): Trail Fork Big Creek ~1 mile listed water, "mostly rainbow trout" — matches the stocked reach.
- nhvalleyrealty.com listing, 726 Highway 107, Del Rio (search snippet): "Trail Fork Big Creek flows directly across the road… stocked monthly" — angler/realtor phrasing for the seasonal (biweekly-to-monthly) spring program.
- easttennesseefishing.com (2010 forum): access to Trail Fork via Walnut Bottoms / old Crescent railroad grade — upper-reach context.
- Establishes: no source anywhere claims winter or year-round stocking. Medium-low weight.

## Months supported, by year
| Year | Months with rows | Evidence |
|---|---|---|
| 2003 | Mar, Apr, May | sched03 (high) |
| 2004 | Feb 29, Mar, Apr, May | sched04 (high) |
| 2005 | Feb 27, Mar, Apr, May | sched05 (high) |
| 2006–2009 | Mar, Apr, May | sched06–09 (high) |
| 2010–2013 | Feb (last wk), Mar, Apr, May | sched10–13 (high) |
| 2014–2015 | Mar, Apr, May | sched14b, 15b (high) |
| 2016 (StockedTrout2016 era) | Mar, Apr, May | sched2016 (high) |
| 2017 | Mar, Apr, May | sched2017 (high) |
| 2018–2021 | Mar, Apr, May | ts2018/19, cp-2020/2021 (high) |
| 2022–2024 | Feb (last wk), Mar, Apr, May; executed 5/11/2022, 4/27/2023, 5/7 + 5/20/2024 | cp-2022–2024 + completed feeds (high) |
| 2025 | Feb 23, Mar 16, Apr, May (5 events) | cp-2025 (high) |
| 2026 | Feb 22, Mar 15, Apr, May (5 events) | 2026 JSON + regs (high) |

Never stocked: Dec, Jan in 24/24 parsed years. Upper-fork brook restoration activities (removals/releases) are not part of this row's rainbow program and never occurred Dec–Feb either.

## The owner's "2025 survey" — result of the chase
- Best-fit candidates: (a) the TWRA electrofishing survey promised for 2023 in r4-2023 ("confirm complete removal of RBT and assess BKT abundance/distribution") and any successors; (b) a routine R4 wild-trout rotation sample. 
- Status: **no 2023, 2024, 2025, or 2026 survey result for Trail Fork is publicly retrievable** — R4 report series unpublished after the 2022 field season (R4-2023.pdf is the last; R4-2024/25/26 = 404 live, absent from Wayback; not on ResearchGate/digitalcommons; TN-AFS newsletters 2023+ unreadable due to 1 MiB Wayback truncation + live bot wall). No news coverage found (Newport Plain Talk / Jefferson County Post etc. silent).
- Recommendation for the ledger: keep the stocking row as-is; add a note that program-adjacent restoration survey results 2023+ exist only inside TWRA Region IV (Morristown) and would require a records request — out of scope for this research-only pass.

## Contradictions and gaps
- 2026 printed regs carry a June-week bullet for this column that the live JSON lacks (presentation drift; JSON governs).
- Two May 2024 executions (05/07 in the 5/17 report window; 05/20 in the 6/7 archive window) are complementary snapshots, not duplicates — the 2024 season had 7 week-of rows.
- 2018/2019 cp-named Wayback files are 2020 replays (md5 `d8beba55…`) — 2018/2019 rest on ts2018/ts2019.
- Upper-fork restoration narrative (2018–2022) is sometimes conflated with this stocked row; they are different reaches and different species programs. The stocked lower reach kept its spring rainbow schedule without interruption (2018–2026 grids unbroken).
- Survey results 2023–2025: documented gap (see S7).

## Searches run (Trail Fork Big Creek)
1. WebSearch: TWRA Region IV trout report 2024 Trail Fork Big Creek brook trout — rate-limited; led to digitalcommons.
2. WebSearch: "Trail Fork" Big Creek Cocke County trout stocking TWRA — rate-limited.
3. WebFetch: https://digitalcommons.memphis.edu/govpubs-tn-wra-region-iv-stream-reports/ — series list (coldwater editions end at 2021).
4. WebSearch: TWRA "Region IV Coldwater Streams" 2023/2024 pdf — mirrors only (readkong/docslib for 2019/2020).
5. WebSearch: "Trail Fork" brook trout Sally Petre TWRA — surfaced TN-AFS Winter 2021 newsletter + ResearchGate R4-2017/2020.
6. WebSearch: easternbrooktrout OR EBTJV "Trail Fork" — EBTJV project page.
7. WebFetch: EBTJV ?s=Trail+Fork and the project detail page (2026-09-25).
8. WebSearch: TU magazine Cherokee NF Trail Fork culvert/bridge (tu.org article; direct slug 404, snippet retained).
9. WebSearch: TN-AFS newsletter 2023/2024/2025 "Trail Fork" update — none retrievable.
10. WebSearch: "Trail Fork" trout survey/electrofishing 2024/2025 Cocke — none; realtor "stocked monthly" echo only.
11. Wayback CDX probes: Coldwater-Trout-Report-R4-2022/2024/2025/2026.pdf (zero captures); live 404 re-check via r.jina.ai; units.fisheries.org newsletter PDFs (five captures identified, all ≈1 MiB-truncated; Winter 2021 fetched — unreadable beyond page structure; Winter 22-23 and 2020-21 text-extracted, no Trail Fork passage survives truncation).
12. Local mining: sched03–2017 + ts2018/19 + cp-2020…2025 grids (24 years); completed feeds (cw2022/23/24may, Wayback 20240607 JSON, Sept-2026 live, sr2024/202412/202509 negatives); arcgis_all.json 6 sites; r4-2018/2019/2020b/2021c/2023 narratives + Table A-1; scheds/stocked-trout-2016.html shell inspection; storymap_data.json (negative).
13. Unproductive: stocked-trout-2016/2017.html (JS shells, no stream text); st-201x captures (no stream lists); twra_trout_json_2024.json (Wayback error page); twsched-* (tailwaters).

## Recommendation
- **Classify Trail Fork Big Creek as seasonal, months Feb (last week), Mar, Apr, May** (Mar–May if full months only). Identical 24-year schedule history to Gulf Fork Big Creek; TYPE="Seasonal" (2026 JSON); ArcGIS program="Spring", species rainbow, 6 private-land points; destination-level executions 05/11/2022, 04/27/2023, 05/07/2024, 05/20/2024 (the 2024 archive row is a spring execution). StockedTrout2016-era confirmation = sched2016 grid row.
- Do not tag the row with the brook-trout restoration: that is the upper CNF reach above the 35.83382/−82.96238 waterfall, documented 2018–2022, with brook trout reproducing by 2022 (79 age-0) and residual rainbow removal ongoing — but its 2023+ survey results are unpublished; mark the owner's "2025 survey" as unverifiable from open sources and a records-request target (TWRA Region IV, Morristown).
- Confidence: high for the seasonal verdict and month set; the survey gap is a documented absence, not evidence of absence.
