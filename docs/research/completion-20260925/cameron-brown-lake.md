# Cameron Brown Lake (Germantown, Shelby County, TN) — evidence log

Retrieval date for all live sources: 2026-09-25. Research-only pass.

## Water identity
- TWRA schedule name: "Cameron Brown Lake" (2017-18 through 2026, unchanged).
- TWRA ArcGIS locations layer: Site_Name "Cameron Brown Park", StreamName "Cameron Brown Park Lake" — **OBJECTID 670, 35.100164399, -89.773985905** (Region 1, SHELBY, City=Germantown; StockingProgram=Winter; WaterClass=pond; Species=rainbow; NumStocked=2,500; Management=City).
- City lake in Cameron Brown Park, City of Germantown (Shelby County), TN. The 2026 regs booklet (ereg_tn_2026, local capture) lists "Cameron Brown Lake — Germantown" among Region 1 winter trout waters.

## Source 1 — 2026 Trout Stocking Schedule JSON (planned)
- org: TWRA; live fetch 2026-09-25 (616 rows); URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json
- {"REGION":"1","COUNTY":"Shelby","LOCATION":"Cameron Brown Lake","TYPE":"Winter","STOCKING DAY":"1/13/2026","SPECIES":"Rainbow Trout"}
- {"REGION":"1","COUNTY":"Shelby","LOCATION":"Cameron Brown Lake","TYPE":"Winter","STOCKING DAY":"TBD 12/2026","SPECIES":"Rainbow Trout"}
- 2026 JSON months: {1, 12}. Identical rows in prior captures trout_2026_live.json / schedule2026-jina.txt.

## Source 2 — 2008-09 program launch schedule (planned) — ORIGINAL PARTICIPANT
- org: TWRA news release "TWRA Winter Rainbow Trout Stocking Program Resumes", 12/4/2008; live fetch 2026-09-25: https://www.tn.gov/news/2008/12/4/twra-winter-rainbow-trout-stocking-program-resumes.html
- "Dec. 16 Tuesday Cameron Brown Lake Germantown" and "Jan. 20 Tuesday Cameron Brown Lake Germantown".
- Cameron Brown is one of the FEW waters in the winter program's first season (2008-09) and the only one of these seven documented in year 1 of the program.

## Source 3 — Winter Trout Stocking "Stocking Dates 2017/2018" page (planned)
- local capture winter_report_2016-18.pdf/txt ("Updated 03/08/2018"), read 2026-09-25.
- "5 Tuesday Cameron Brown Lake Germantown" (Dec 5, 2017); "9 Tuesday Cameron Brown Lake Germantown" (Jan 9, 2018). Months {12,1}.

## Source 4 — Winter schedules 2018-19 through 2024-25 (planned)
- 2018-19 (winter_trout_2018.txt): "12/4/2018 Tuesday Cameron Brown Lake" (Dec); "1/8/2019 Tuesday Cameron Brown Lake Collierville Shelby" (Jan) — city/county columns scrambled in this extraction ("Collierville" is bleed from the adjacent Johnson Park row); water + dates reliable. Months {12,1}.
- 2019-20 (winter_trout_2019.txt, clean): "12/10/2019 Tuesday Cameron Brown Lake Germantown Shelby"; "1/14/2020 Tuesday Cameron Brown Lake Germantown Shelby". Months {12,1}.
- 2020-21 (winter_sched_2020-21.pdf): "12/8/2020 Tuesday Cameron Brown Lake Germantown Shelby"; "1/12/2021 Tuesday Cameron Brown Lake Germantown Shelby". Months {12,1}.
- 2024-25 (winter_sched_2024-25.pdf): "12/10/2024 Tuesday Cameron Brown Lake Germantown Shelby"; "1/14/2025 Tuesday Cameron Brown Lake" (Jan city column shifted in extraction). Months {12,1}.
- 2021-2023 seasons not covered this pass: the md5-deduped 2021-2025 Wayback "Complete.pdf" captures (cp-*) contain no winter-program rows (replay-trap groups documented in beech-lake.md Source 5). Gap documented.

## Source 5 — Completed feeds (destination-level)
- 2024 archive completed feed (completed2024.json): window 05-06/2024, Regions 2-4 only — no Region 1 winter rows. Dec-3-2024 report capture: no Region 1 rows. Live completed JSON 2026-09-25: 10 tailwater rows (08-09/2026) only. Jan 2026 completion UNCONFIRMED at destination level. Gap documented (rolling feed never covers the winter pond window in any available capture).

## Source 6 — WARMWATER leg
- Germantown municipal site (germantown-tn.gov) returns 403 to non-browser fetch this session (probed 2026-09-25); Wayback CDX for the park page returned a 404 capture (2025-05-16) and a pickleball page only; no species-level warmwater source obtained.
- GBIF (live API 2026-09-25): 0 fish occurrences within ~2 km of pin. WebSearch backend rate-limited this session (429s, unusable).
- No warmwater evidence in any TWRA dataset this pass (ArcGIS row is Winter-program only).
- Type (as evidenced): city park pond managed as a winter put-and-take trout water. Warmwater leg UNDOCUMENTED this pass.

## Verdict
- **SEASONAL-STOCKED** (winter put-and-take). Months documented: **{12, 1}**, every season 2008-09 (launch), 2017-18, 2018-19, 2019-20, 2020-21, 2024-25, 2026 — the longest documented continuity of the seven; no November/February/March rows observed (catalog [11,12,1,2,3] overstated for this water on current evidence).
- Confidence: high (identity; trout cadence). Warmwater leg: not established — if the catalog carries a warmwater/bass claim for this pond it is unsupported by sources retrieved this pass.
- Establishes: program participant since 2008-09; City of Germantown management; 2,500/yr (ArcGIS NumStocked); Dec-Jan cadence. Does NOT establish: warmwater fishery; Nov/Feb/Mar months.

## Contradictions
- 2018-19 extraction city column ("Collierville") vs. all other sources ("Germantown") — extraction bleed, resolved.
- Task prompt's premise "city lake winter program" confirmed; no identity conflicts found.

## Searches / fetches run
2026 JSON x5, ArcGIS x2, 2008 release x3, winter PDFs x6, completed feeds x3, GBIF x7 (per-pond queries), germantown-tn.gov probes x2 + CDX x2, WebSearch x2 (rate-limited).

## Recommendation
Classify **seasonal-stocked**, months 12 and 1; keep identity "Cameron Brown Lake / Cameron Brown Park, Germantown" (OBJECTID 670, 35.10016, -89.77399); drop any Nov/Feb/Mar catalog months unless a source surfaces; warmwater claim should not be attached to this pond without new evidence.
