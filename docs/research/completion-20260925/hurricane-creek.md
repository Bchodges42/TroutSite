# Hurricane Creek (`hurricane-creek`) — completion research log

Water: Hurricane Creek, Houston + Humphreys counties, TN (TWRA Region 1). Catalog months were [12,1,2] (suspect). Research date: 2026-09-25. Mode: research only; no agency contact.

## HEADLINE VERDICT
- **True program: Seasonal / "Spring" — 3 events per year in FEBRUARY–MARCH–APRIL, every year documented 2003–2026. Never December. Never January.** One extra May event documented in 2022.
- **Catalog [12,1,2] is WRONG.** Recommend seasonal with months **[2,3,4]**.
- **Identity: there are TWO different Hurricane Creecks stocked under the same schedule line** — a Houston County creek and a Humphreys County creek (Hurricane Mills / Loretta Lynn Ranch area). Treat as one catalog entry only if intended; county attribute must allow both.
- Type: Seasonal stream stocking (put-and-take rainbow). Confidence: HIGH (annual schedules 2003–2026 + completed feeds agree).

## Sources (retrieval date 2026-09-25 unless noted)

1. **TWRA 2026 Trout Stocking Schedule (exceldriven JSON)** — org: Tennessee Wildlife Resources Agency (tn.gov). Obs 2026; retrieved 2026-09-25 (live) and via prior-pass copy `tmp\research\data\sched2026.json` + project `twra_stocking.json` (retrieved 2026-09-22/25). URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json
   Fields: REGION 1; COUNTY Houston; LOCATION "Hurricane Creek"; TYPE "Seasonal"; STOCKING WEEK 2/22/2026, 3/22/2026, 03/29/2026; SPECIES Rainbow Trout. COUNTY Humphreys: 2/22/2026, 03/29/2026. Establishes: Feb–Mar 2026 planned (weeks are Sundays; event within 5 days).
2. **TWRA tentative trout stocking schedules sched03–sched15.pdf** — org TWRA, published each January 2003–2015, via Wayback Machine, original http://www.state.tn.us/twra/fish/StreamRiver/stockedtrout/sched03.pdf … sched15.pdf. Retrieved 2026-09-25 (local copies `tmp\research\_work\scheds0309\`, `tmp\research\completion\scheds\`). Fields per year (Houston + Humphreys rows, rainbow, 3 "week of" X marks in FEB/MAR/APR columns):
   - 2003: Houston "XX X", Humphreys "XX X" (two Feb weeks + one later week) — `_work\sched03.pdf.txt`
   - 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013: both counties 3 events Feb/Mar/Apr (verified by glyph-coordinate parse; e.g. 2010 Houston y=126 and Humphreys y=162 rects each carry 3 X marks; 2013 plain text "Houston Hurricane Creek X X X … Humphreys Hurricane Creek X X X")
   - 2014: Feb 23 / Mar 23 / Apr 20 (both counties); 2015: Feb 22 / Mar 22 / Apr 19 (both counties)
   - 2004: PDF captured but text grid garbled — rows exist; months not machine-readable (low confidence, same pattern presumed). Establishes: Feb–Apr every scheduled year 2003–2015.
3. **TWRA "Trout Stocking (2018/2019/2020/2021/2022/2023/2024/2025)" schedule pages (Complete.pdf)** — tn.gov, annual; via Wayback (2020–2025 captures in `tmp\research\data\complete\`, `tmp\research\raw\`). Retrieved 2026-09-25. Marker-months parsed from PDF glyphs:
   - 2018: Feb 25 / Mar 25 / Apr 22 (both counties)
   - 2019: Feb 24 / Mar 24 / Apr 21
   - 2020: Feb 23 / Mar 22 / Apr 19
   - 2021: Feb 28 / Mar 28 / Apr 25
   - 2022: Feb 27 / Mar 27 / Apr 24
   - 2023: Feb 26 / Mar 26 / Apr 23
   - 2024: Feb 25 / Mar 24 / Apr 21
   - 2025: Feb 23 / Mar 23–30 / Apr 20–27 (4th event visible in updated captures)
   **MD5 replay check (replay trap):** `complete_2019-20.pdf`==`complete_2020.pdf` (d8beba55…); `complete_2021b.pdf`==`raw\complete_20211009.pdf` (41e350cc…); `complete_2023a.pdf`==`raw\complete_20230220040610.pdf` (3a748e6b…); `complete_2024a.pdf`==`raw\complete_20240222194223.pdf` (c3cfa009…); `complete_2025b.pdf`==`raw\complete_20250320072447.pdf` (fecd884c…). Unique year-contents otherwise: 2021a(0e5c3434…), 2022a(6228d37e…), 2022b(9c75adf3…), 2024b(852e3117…), 2025a(321048d5…), 2025c(9d346c2c…), 2025d(8b67aac0…). 2025c/2025d add an Apr 27 marker vs 2025a/b — content updated mid-season, not a pure replay.
4. **"Winter Trout Stocking (2018-2019)" and "(2019-2020)" schedule PDFs** — tn.gov `winter-trout-stocking-report.pdf`, Wayback 20181013005431 / 20190108232545. Hurricane Creek ABSENT from all winter (Nov–Feb) program tables. Establishes: Hurricane Creek is NOT a winter-program water.
5. **"Coldwater Stocking" completed-report PDFs** — tn.gov `Cold-Water-Stocking.pdf`, Wayback captures 20180412194944, 20190109035938, 2020-01 (`2020id_`). Retrieved 2026-09-25. Completed Region 1 rows: Hurricane Creek 3/28/2018 (Apr-2018 capture), 4/25/2018 + 4/25/2019 (Jan-2020 capture). Neighbors: Standing Rock/Whiteoak 4/24-25, Tumbling 4/25.
6. **Trout-information-stockings page completed table (Jan 2018 capture)** — tn.gov page via Wayback 20180112212428 (`_work\tis2018.html`). Region 1 completed: "Hurricane Creek 4/25/2017" (alongside Whiteoak/Standing Rock 4/25/2017). Establishes: April 2017 completed stocking.
7. **2019 captures of the same page** (Wayback 20190109030220, 20190412214809; `_work\tis_*.html`) — DataTable "wordcloud" flattens rows; Hurricane Creek completion adjacency ~Mar 2018 and ~Mar 2019 (weak positional pairing; treat as supportive only).
8. **"Coldwater Trout Stocking Schedule, Updated: 5/17/2022"** — tn.gov (`raw\cw_20220519195104.pdf`). Region 1: Hurricane Creek 05/05/2022. Establishes: one MAY event in 2022 (late spring extension).
9. **PressReader / Knoxville News Sentinel "LOCAL FOCUS" TWRA region report** — snippet retrieved 2026-09-25 via WebSearch: "HOUSTON COUNTY: Rainbow Trout, averaging about 10 inches…stocked as part of the 2026 trout stocking program in Hurricane Creek on Feb. 22…" Establishes: 2026 Feb 22, species/rainbow, ~10-in catchables.
10. **TWRA ArcGIS "TWRA_Trout_Stocking_Locations" FeatureServer** — query all (resultRecordCount=2000), copy `tmp\research\raw\arcgis_troutloc.json`, retrieved 2026-09-25 (prior pass 2026-09-25). Rows:
    - OBJECTID 413 "Hurricane Creek Trout Stocking Site", HOUSTON, Region 1, 36.336521436, -87.903450664, StockingProgram "Spring", WaterClass stream, Species rainbow, Management "TWRA"
    - OBJECTID 414 "Hurricane Creek (Optional - Limited Access)", HUMPHREYS, 35.976536249, -87.772733551, Management null
    - OBJECTID 415 "Hurricane Creek Upstream Spring Trout Site", HUMPHREYS, 35.999573917, -87.733116194, Management "TWRA"
    - OBJECTID 418 "Hurricane Creek Downstream Loretta Lynn'S", HUMPHREYS, 35.971308913, -87.780772303, Management "TWRA"
    The Houston site (~36.34, -87.90, Tennessee Ridge area) and the Humphreys sites (~35.97–36.00, -87.73…-87.78, Hurricane Mills/Loretta Lynn Ranch area) are ~35 km apart — **two distinct named creeks**.

## Months-by-year stocking table (planned unless noted)
| Year | Events (week-of) | Months |
|---|---|---|
| 2003 | Houston: Feb(×2)+1; Humphreys: Feb(×2)+1 | Feb, Mar/Apr |
| 2004 | rows present, grid unreadable | (Feb–Apr presumed, LOW) |
| 2005–2015 | 3 events/yr both counties | **Feb, Mar, Apr** |
| 2016 | no schedule capture found (gap) | — |
| 2017 | no schedule capture; completed 4/25 | (Apr completed) |
| 2018 | Feb 25 / Mar 25 / Apr 22; completed 3/28 + 4/25 | Feb–Apr |
| 2019 | Feb 24 / Mar 24 / Apr 21; completed 4/25 | Feb–Apr |
| 2020 | Feb 23 / Mar 22 / Apr 19 | Feb–Apr |
| 2021 | Feb 28 / Mar 28 / Apr 25 | Feb–Apr |
| 2022 | Feb 27 / Mar 27 / Apr 24 + completed 5/5 | Feb–May |
| 2023 | Feb 26 / Mar 26 / Apr 23 | Feb–Apr |
| 2024 | Feb 25 / Mar 24 / Apr 21 | Feb–Apr |
| 2025 | Feb 23 / Mar 23–30 / Apr 20–27 | Feb–Apr |
| 2026 | Houston 2/22, 3/22, 3/29; Humphreys 2/22, 3/29 | Feb–Mar |

## Species
Rainbow Trout only (all sources). No brown/brook evidence for these creeks.

## Completed feeds
- 2024 archive (`raw\completed_2024.json` == `completed_20240607b.json`, md5 b8b2072e… exact replay; window = late Apr–Jun 2024): Hurricane Creek absent — expected (program ends April).
- Sept-2026 live feed (`raw\completed_live_2026.json`): absent — expected.

## Contradictions / caveats
- Catalog [12,1,2] vs every observed schedule/completion: complete contradiction — program is Feb–Apr(spring), not Dec–Feb.
- 2004 PDF unreadable; 2016–2017 schedules not captured (2016 gap; 2017 proven only by completion).
- 2019-era completed-table pairings are positional-weak (flattened DataTable); 2017/2018/2019/2022 completions are the anchors.
- Prior -layout text artifacts suggested Humphreys absent 2010–2011; direct glyph geometry (sched10 y=126/y=162) disproves.

## Searches / lookups run (distinct ≥8)
1. WebSearch `"Hurricane Creek" trout stocking TWRA Houston County Tennessee` (rate-limited; retried) 2. WebSearch `"Hurricane Creek" Humphreys County trout rainbow stocking` (PressReader hit) 3. WebSearch `Hurricane Creek Tennessee Hurricane Mills Buffalo River tributary` (context) 4. Wayback CDX sched03–15 + downloads 5. grid parse sched10–15 6. glyph parse Complete 2020–2025 + md5 replay set 7. Cold-Water-Stocking.pdf captures (2018-04, 2019-01, 2020-01) 8. winter-trout-stocking-report.pdf captures (2018-10, 2019-01) 9. tis2018/tis2019 completed tables 10. 2026 exceldriven JSON + Sept-2026 completed feed 11. ArcGIS FeatureServer rows 12. 5/17/2022 spring coldwater update.

## Recommendation
Seasonal, **months [2,3,4]** (historically Feb–Apr; +May in 2022 only). Keep Region 1. Identity note: entry spans TWO homonymous creeks (Houston Co. and Humphreys Co.); coordinates list must carry both site clusters (Houston 36.3365,-87.9035; Humphreys 35.9713,-87.7808 / 35.9996,-87.7331 / 35.9765,-87.7727). Do NOT tag as winter program.
