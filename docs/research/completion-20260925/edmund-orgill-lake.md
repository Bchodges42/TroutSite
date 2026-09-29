# Edmund-Orgill Park Pond (Millington, Shelby County, TN) — evidence log

Retrieval date for all live sources: 2026-09-25. Research-only pass.

## Water identity — LOCATION CORRECTION (task said "Memphis/Bartlett")
- The pond is in **Edmund Orgill Park, City of Millington, Shelby County** — NOT Memphis and NOT Bartlett:
  - ArcGIS layer: Site_Name "Edmund-Orgill Park", StreamName "Edmund-Orgill Park Pond" — **OBJECTID 676, 35.372389, -89.832517** (Region 1, SHELBY, City=**Millington**; Winter; pond; rainbow; NumStocked=2,000; Management=City).
  - Clean winter schedules (2019-20, 2020-21, 2024-25 Dec block, 2017-18 page) all print "Edmund-Orgill Park — Millington — Shelby".
- (Edmund Orgill was a Memphis mayor; the park is Millington's regional park — likely source of the "Memphis" confusion.)

## Source 1 — 2026 Trout Stocking Schedule JSON (planned)
- org: TWRA; live fetch 2026-09-25 (616 rows); URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json
- {"REGION":"1","COUNTY":"Shelby","LOCATION":"Edmund-Orgill Park","TYPE":"Winter","STOCKING DAY":"1/13/2026","SPECIES":"Rainbow Trout"}
- {"REGION":"1","COUNTY":"Shelby","LOCATION":"Edmund-Orgill Park","TYPE":"Winter","STOCKING DAY":"TBD 12/2026","SPECIES":"Rainbow Trout"}
- 2026 JSON months: {1, 12}. Identical rows in prior captures. 2026 regs booklet lists "Edmund-Orgill Park" among Region 1 winter trout waters (city column in that extraction is bleed).

## Source 2 — Winter Trout Stocking "Stocking Dates 2017/2018" page (planned)
- local capture winter_report_2016-18.txt ("Updated 03/08/2018"), read 2026-09-25.
- "5 Tuesday Edmund-Orgill Park Millington" (Dec 5, 2017); "9 Tuesday Edmund-Orgill Park Millington" (Jan 9, 2018). Months {12,1}.

## Source 3 — Winter schedules 2018-19 through 2024-25 (planned)
- 2018-19 (winter_trout_2018.txt): "12/4/2018 Tuesday Edmund-Orgill Park" (Dec; row city "Memphis" is column bleed); "1/8/2019 Tuesday Edmund-Orgill Park Memphis Shelby" (Jan; bleed). Months {12,1}.
- 2019-20 (winter_sched_2020aug.pdf, clean layout): "12/10/2019 Tuesday Edmund-Orgill Park Millington Shelby — **Canceled due to construction**"; "1/14/2020 Tuesday Edmund-Orgill Park Millington Shelby".
- 2020-21 (winter_sched_2020-21.pdf): "12/8/2020 Tuesday Edmund-Orgill Park Millington Shelby"; "1/12/2021 Tuesday Edmund-Orgill Park Millington Shelby — 2/23/2021" (annotated additional date).
- 2024-25 (winter_sched_2024-25.pdf): "12/10/2024 Tuesday Edmund-Orgill Park Millington Shelby"; "1/14/2025 Tuesday Edmund-Orgill Park" (Jan columns shifted).
- 2021-2023 seasons: gap (Complete.pdf captures contain no winter rows; md5 replay groups documented in beech-lake.md).

## Source 4 — 2008-09 launch and deep history
- 2008-09 launch schedule (TWRA release 12/4/2008, live fetch): NO Edmund-Orgill row (participants: Cameron Brown, Collierville City Park, Bartlett City Park Lakes (2), Munford, etc.). Absent from 2017-18 page predecessors? Present from the 2017-18 page onward in corpus; start year between 2009 and 2017, unresolved this pass.

## Source 5 — Completed feeds (destination-level)
- 2024 archive (completed2024.json): 05-06/2024 window only, no Region 1. Dec-3-2024 report: no Region 1 rows. Live completed JSON 2026-09-25: tailwater rows only. Destination-level completion UNCONFIRMED. Gap documented.

## Source 6 — WARMWATER leg
- Millington municipal site homepage reachable (200) but the Orgill park page URL 404'd and no fishing/species text was extracted this pass; Wayback CDX (millingtontn.gov × "orgill") returned nothing; GBIF live 2026-09-25: 0 fish occurrences within ~2 km; WebSearch rate-limited.
- No warmwater evidence in any TWRA dataset (ArcGIS row Winter-only). Type (as evidenced): city regional-park pond managed as winter put-and-take trout water. Warmwater leg UNDOCUMENTED this pass.

## Verdict
- **SEASONAL-STOCKED.** Months documented **{12, 1}** (+ annotated 2/23/2021 follow-up); seasons 2017-18, 2018-19, 2019-20 (Dec canceled — construction), 2020-21, 2024-25, 2026; start year 2009-2017 open.
- Confidence: high (identity correction + cadence). Warmwater: not established.
- Establishes: Millington location; City management; 2,000/yr (ArcGIS); Dec-Jan cadence; 2019 Dec construction cancellation. Does NOT establish: Memphis/Bartlett association (drop it); warmwater fishery; Nov/Feb/Mar months.

## Contradictions
- Task premise "Memphis/Bartlett" contradicted by ArcGIS + schedules (Millington) — corrected.
- 2018-19/2024-25 extractions show shifted city columns — resolved against clean-layout documents.

## Searches / fetches run
2026 JSON x5, ArcGIS x2, winter PDFs x6, 2008 release x3, completed feeds x3, millingtontn.gov x2 + CDX x1, GBIF x7, WebSearch x1 (rate-limited).

## Recommendation
Classify **seasonal-stocked**, months 12 and 1. Catalog identity fix: "Edmund-Orgill Park Pond, Millington, Shelby County (35.37239, -89.83252, OBJECTID 676)"; remove Memphis/Bartlett associations; retain the 2019 construction cancellation as a documented schedule disruption.
