# Yale Road Park Lake (Bartlett, Shelby County, TN) — evidence log

Retrieval date for all live sources: 2026-09-25. Research-only pass.

## Water identity
- TWRA schedule name: "Yale Road Park" (2017-18 → 2026; schedule uses the park name, not "…Lake").
- TWRA ArcGIS locations layer: Site_Name "Yale Road Park", StreamName "Yale Road Park Lake" — **OBJECTID 671, 35.216861167, -89.855592893** (Region 1, SHELBY, City=Bartlett; StockingProgram=Winter; WaterClass=pond; Species=rainbow; NumStocked=1,000; Management=null [blank in layer]).
- City park lake on Yale Road in Bartlett (Shelby County), TN; TWRA lists the lake as a Bartlett water in every clean-layout document.

## Source 1 — 2026 Trout Stocking Schedule JSON (planned)
- org: TWRA; live fetch 2026-09-25 (616 rows); URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json
- {"REGION":"1","COUNTY":"Shelby","LOCATION":"Yale Road Park","TYPE":"Winter","STOCKING DAY":"1/15/2026","SPECIES":"Rainbow Trout"}
- {"REGION":"1","COUNTY":"Shelby","LOCATION":"Yale Road Park","TYPE":"Winter","STOCKING DAY":"TBD 12/2026","SPECIES":"Rainbow Trout"}
- 2026 JSON months: {1, 12}. Identical rows in prior captures. 2026 regs booklet lists "Yale Road Park" among Region 1 winter trout waters.

## Source 2 — 2008-09 program launch (probable original participant, collective naming)
- org: TWRA news release 12/4/2008 (live fetch 2026-09-25; URL in beech-lake.md Source 6): "Dec. 18 Thursday **Bartlett City Park Lakes (2)** Bartlett" and "Jan. 22 Thursday Bartlett City Park Lakes Bartlett".
- 2008-09 Bartlett had exactly two winter-program park lakes; by 2017-18 the Bartlett pair in the winter page is "Davies Plantation Park" + "Yale Road Park" (both printed as Bartlett). "Bartlett City Park Lakes (2)" plausibly = these two. Confidence: LOW-MEDIUM (collective name linkage inferred; no source states the mapping).

## Source 3 — Winter Trout Stocking "Stocking Dates 2017/2018" page (planned)
- local capture winter_report_2016-18.txt ("Updated 03/08/2018"), read 2026-09-25.
- "7 Thursday Yale Road Park Bartlett" (Dec 7, 2017); "11 Thursday Yale Road Park Bartlett" (Jan 11, 2018). Months {12,1}.

## Source 4 — Winter schedules 2018-19 through 2024-25 (planned)
- 2018-19 (winter_trout_2018.txt): "12/11/2018 Tuesday Yale Road Park" (Dec; row city "Lexington Tipton" is column bleed); "1/2/2019 Wednesday Yale Road Park Bartlett Tipton" (Jan; county bleed "Tipton"). Dates reliable; months {12,1}.
- 2019-20 (winter_trout_2019.txt, clean): "12/12/2019 Thursday Yale Road Park Bartlett Shelby"; "1/16/2020 Thursday Yale Road Park Bartlett Shelby".
- 2020-21 (winter_sched_2020-21.pdf): "12/10/2020 Thursday Yale Road Park Bartlett Shelby"; "1/14/2021 Thursday Yale Road Park Shelby — 2/24/2021" (annotated additional date).
- 2024-25 (winter_sched_2024-25.pdf): "12/12/2024 Thursday Yale Road Park Bartlett Shelby"; "1/16/2025 Thursday Yale Road Park" (Jan columns shifted).
- 2021-2023 seasons: gap (Complete.pdf captures carry no winter rows; see beech-lake.md Source 5).

## Source 5 — Completed feeds (destination-level)
- 2024 archive (completed2024.json): 05-06/2024 window only, no Region 1. Dec-3-2024 report: no Region 1 rows. Live completed JSON 2026-09-25: tailwater only. Destination-level completion UNCONFIRMED. Gap documented.

## Source 6 — WARMWATER leg
- Bartlett municipal site (cityofbartlett.org) homepage reachable (200) but the Yale Road Park page URL 404'd; Wayback CDX (cityofbartlett.org × "yale") returned only a 2024 road-detour document — no park/fish page captured; GBIF live 2026-09-25: 0 fish occurrences within ~2 km; WebSearch rate-limited this session.
- No warmwater evidence in any TWRA dataset (ArcGIS row Winter-only; Management field blank). Type (as evidenced): city park lake managed as winter put-and-take trout water. Warmwater leg UNDOCUMENTED this pass.

## Verdict
- **SEASONAL-STOCKED.** Months documented **{12, 1}** (+ annotated 2/24/2021 follow-up); seasons 2008-09 (as "Bartlett City Park Lakes (2)", low-medium confidence), 2017-18, 2018-19, 2019-20, 2020-21, 2024-25, 2026. No Nov/Feb/Mar regular months.
- Confidence: high (identity + cadence); low-medium (2008-09 linkage).
- Establishes: Bartlett location; Dec-Jan cadence; 1,000/yr (ArcGIS). Does NOT establish: warmwater fishery; exact 2008-09 name mapping; which of Bartlett's parks received the original stockings.

## Contradictions
- 2018-19 extraction shows "Yale Road Park — Lexington/Tipton" (column bleed) and a "1/2/2019" date not seen elsewhere — flagged; clean-layout 2019-20 document confirms Bartlett/Shelby.
- 2008-09 "Bartlett City Park Lakes (2)" vs. later per-park naming — same program, collective vs. individual naming.

## Searches / fetches run
2026 JSON x5, ArcGIS x2, winter PDFs x6, 2008 release x3, completed feeds x3, cityofbartlett.org x2 + CDX x2, GBIF x7, WebSearch x1 (rate-limited).

## Recommendation
Classify **seasonal-stocked**, months 12 and 1. Identity: "Yale Road Park Lake, Bartlett, Shelby County (35.21686, -89.85559, OBJECTID 671)"; note blank Management in the TWRA layer (City of Bartlett per schedule context); do not attach a warmwater claim without new evidence.
