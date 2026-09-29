# Sulfur Fork Creek (`sulfur-fork-creek`) — completion research log

Water: Sulphur Fork Creek (TWRA GIS spelling "Sulfur Fork Creek"; schedule spelling "Sulphur Fork Creek"; GNIS "Sulphur Fork Red River", GNIS 01648169), Springfield, Robertson County, TN (TWRA Region 2). Catalog months were [12,1,2] (suspect). Research date: 2026-09-25. Research only; no agency contact.

## HEADLINE VERDICT
- **Identity confirmed**: the stocked water is **Sulphur Fork Creek at the Springfield City Greenway, Springfield, Robertson County** — a Red River tributary (HUC 05130206), stocked by the **TWRA Winter program** (rainbow, ~1,500/event). NOT in Sumner County and NOT "Portland area" — the stocking site is Springfield (Robertson). Headwaters near the Robertson/Davidson line; mouth at the Red River near Port Royal (ledger GNIS/TDEC data).
- **Catalog months [12,1,2] are essentially CORRECT** — documented stockings: Nov 27, Dec 3–4, Jan 26/31, Feb 4–28, and one Mar 2 (2017 tail event). Recommend keeping **[12,1,2]** as core, optionally widening to [11,12,1,2] since Nov 27 (2018) and late-Nov schedule anchors exist.
- Type: Winter put-and-take stream. Confidence: HIGH (2022 + 2026 primary schedules; completions 2017–2019–2022).

## Sources (retrieval 2026-09-25 unless noted)

1. **TWRA 2026 stocking schedule JSON** (`data\sched2026.json`; URL in hurricane-creek log): "REGION 2, COUNTY Robertson, LOCATION **Sulphur Fork Creek**, TYPE Winter, STOCKING DAY 02/04/2026, 02/26/2026, TBD 12/2026, SPECIES Rainbow Trout." Establishes Feb + Dec(TBD) 2026.
2. **"Coldwater Trout Stocking Schedule, Updated 2/18/2022"** (`_work\sched2022cw.pdf.txt` / `raw\cwsched_2022.pdf`): Region 2 "**Sulphur Fork Creek 01/26/2022**." Establishes January event 2022.
3. **Winter Trout Stocking (2018-2019) schedule** — tn.gov `winter-trout-stocking-report.pdf`, Wayback 20181013005431 & 20190108232545: Sulphur Fork Creek (Springfield, Robertson) **11/27/2018**, **Jan 2019 Thursday (1/31/2019 by row adjacency)**, **2/28/2019**. Establishes Nov–Feb window with 3 events that season.
4. **Winter Trout Stocking (2019-2020) schedule** (same PDF, 2019-10/2020-01 captures): **12/3/2019 Sulphur Fork Creek** (Region II block). Establishes December 2019.
5. **"Coldwater Stocking" completed reports** — tn.gov `Cold-Water-Stocking.pdf`, Wayback captures 20180412194944, 20190109035938, 2020-01: completions **3/7/2018** (winter 2017-18 tail), Sulphur Fork listed in the Jan-2019 report (winter 2018-19 executed), **12/3/2019 completed** (Jan-2020 report).
6. **tn.gov completed-stocking table, Jan 2018 page capture** (Wayback 20180112212428): "**Sulphur Fork Creek 3/2/2017**" (Region 2). Establishes a March 2, 2017 completion (tail of winter 2016-17).
7. **TWRA ArcGIS stocking locations** (`raw\arcgis_troutloc.json`): two rows, both Site_Name "**Springfield City Greenway**", StreamName "**Sulfur Fork Creek**", Region 2, ROBERTSON, Springfield; **StockingProgram "Winter"**, WaterClass stream, Species rainbow, **NumStocked 1500**, Management "TWRA" (36.518528989,-86.881987532) and "City" (36.518731872,-86.881614635). Establishes site, program, quantity, joint TWRA/City management.
8. **Ledger identity data** (SOURCES-LEDGER-WAVE3-CREEKS.md, prior pass): GNIS name "**Sulphur Fork Red River**" (GNIS 01648169); Robertson County entire ~74 km course; HUC 05130206 (Red); mouth ≈ 36.5549,-87.1413 at the Red River; TDEC station SULPH000.1RN. Establishes official naming and watershed; TWRA's three spellings ("Sulfur Fork Creek" GIS / "Sulphur Fork Creek" schedule / "Sulphur Fork" TDEC).
9. **Smokey Barn News (Robertson County local outlet), "TWRA Begins Winter Trout Stocking Across Tennessee" (Nov 2024)** — surfaced via WebSearch 2026-09-25; direct fetch of guessed slug returned 404 (headline from search index): trout stocked **along the Springfield Greenway starting at the fairgrounds bridge and upstream**; rainbow trout; TWRA winter put-and-take program "roughly Nov–March." Establishes exact in-reach placement + seasonal framing. (Publication date Nov 2024 per search result.)
10. **Historical oddity (context only)**: an 1909 U.S. fish-commission distribution record lists 350 fish into "Sulphur Fork Creek" near Springfield (surfaced 2026-09-25 via WebSearch, archive.org) — a century of intermittent stocking history; not used for months.

## Months-by-year stocking table (documented)
| Season | Dates documented | Months |
|---|---|---|
| 2016-17 | completed 3/2/2017 | (Jan–)Mar tail |
| 2017-18 | completed 3/7/2018 | winter, incl. Mar tail |
| 2018-19 | scheduled 11/27/2018, 1/31/2019, 2/28/2019 | **Nov, Jan, Feb** |
| 2019-20 | scheduled+completed 12/3/2019 | **Dec** |
| 2020-21 | not captured (gap) | — |
| 2021-22 | scheduled 1/26/2022 | **Jan** |
| 2022-23 … 2024-25 | not captured (Wayback gap; Smokey Barn confirms program continued Nov 2024) | Dec–Feb presumed (MED) |
| 2025-26 | 2026 schedule: 2/4/2026, 2/26/2026 (+ preceding Dec TBD not archived) | **Feb** (+Dec presumptive) |
| 2026-27 | TBD 12/2026 | **Dec** (planned) |

## Species
Rainbow Trout only (~1,500/event per GIS NumStocked).

## Completed feeds
- 2024 archive (Apr–Jun 2024 window; md5 b8b2072e… exact replay): absent — expected (program ends by Feb/Mar).
- Sept-2026 live feed: absent — expected (next event Dec 2026 TBD).

## Contradictions / caveats
- Catalog [12,1,2] holds; but 2018-19 shows a Nov 27 event and 2017/2018 tails ran into early March → consider [11,12,1,2,3] edges; core remains Dec–Feb.
- Prompt's "Portland area? Robertson/Sumner" is wrong: the stocked reach and all GIS rows are Springfield, Robertson County. Sumner has no stocked Sulphur Fork reach in any TWRA doc reviewed.
- Spelling inconsistency across TWRA systems ("Sulfur Fork Creek" vs "Sulphur Fork Creek" vs "Sulphur Fork") — catalog key `sulfur-fork-creek` matches GIS spelling; schedule matching must be case/spelling-tolerant.
- The 2022 layout extraction (`cwsched_2022.txt`) mis-pairs date columns; stream-order rendering pairs Sulphur Fork = 01/26/2022 (same conclusion either way: January 2022).
- A search-engine summary claimed a "1/29/2026" target for Sulphur Fork (2025-26 season) — NOT supported by the official 2026 exceldriven JSON (02/04 + 02/26 + TBD 12); discard.

## Searches / lookups run (≥8)
1. WebSearch `"Sulphur Fork" OR "Sulfur Fork" trout stocking Springfield Tennessee TWRA` (1909 record; Red River context) 2. WebSearch `Sulphur Fork Creek Springfield Tennessee trout rainbow winter stocking greenway` (Smokey Barn Nov 2024; claimed 1/29/2026 — discarded) 3. WebFetch smokeybarn.com slug (404) 4. Winter Trout Stocking 2018-19 schedule PDF (3 dates) 5. Winter Trout Stocking 2019-20 (12/3/2019) 6. Coldwater completed reports 2018/2019/2020 (3/7/2018, 12/3/2019) 7. Coldwater schedule 2/18/2022 (1/26/2022) 8. Jan-2018 completed table (3/2/2017) 9. 2026 exceldriven JSON (2/4, 2/26, TBD 12/2026) 10. ArcGIS rows (Springfield City Greenway ×2, 1500, TWRA/City) 11. Ledger GNIS/TDEC identity data.

## Recommendation
Winter-program water, months **[12,1,2]** (core), documented season window Nov–Mar across years — optionally widen to [11,12,1,2] with early-March tails noted. Species rainbow (~1,500). Site: Springfield City Greenway (two GIS points 36.518529,-86.881988 and 36.518732,-86.881615; fairgrounds-bridge upstream). County Robertson (Region 2); naming: display "Sulphur Fork Creek", note GNIS "Sulphur Fork Red River". Not Portland/Sumner.
