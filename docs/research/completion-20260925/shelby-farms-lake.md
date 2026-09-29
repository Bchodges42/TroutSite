# Shelby Farms — which lake gets the trout? (Memphis, Shelby County, TN) — mixed-verdict evidence log

Retrieval date for all live sources: 2026-09-25. Research-only pass.

## Water identity — LAKE-IDENTITY RESOLUTION (task's central question)
- TWRA schedule name: "Shelby Farms" (no lake qualifier, 2017-18 → 2026).
- TWRA ArcGIS layer: Site_Name "Shelby Farms", StreamName "Shelby Farms Lake" — **OBJECTID 677, 35.139206, -89.833708** (Region 1, SHELBY, City=Memphis; Winter; pond; rainbow; NumStocked=2,000; Management=City).
- Reverse geocode of the TWRA pin (OSM Nominatim, 2026-09-25): lands on "North Pine Lake Drive" — the park road along the stocked water; **the pin sits between OSM water features, ~110 m from the centroid of the "Hyde Lake" relation (OSM way/relation center 35.13823, -89.83327)**, ~90 m from an unnamed pond at 35.13971, -89.83386 (north edge of Hyde Lake basin / boat-launch side).
- Other named OSM lakes inside the park bbox: Pine Lake (35.14539, -89.83066), Mayor Lake (35.14267, -89.83760), Chickasaw Lake (35.14581, -89.83907), Beaver Lake (35.14137, -89.82108), Spring Lake (35.15387, -89.86093), Penal Farm Lake No. 4 (35.15902, -89.86662). **No "Jones Pond" exists in OSM/Nominatim within the park** (two name queries returned nothing).
- **Resolution: the stocked water is HYDE LAKE** (the lake enlarged in the Shelby Farms Park redesign; Wikipedia: "boating in an enlarged Hyde Lake, formerly known as Patriot Lake"). The prior-pass "Jones Pond" hypothesis is unsupported by any dataset this pass; the prior-pass note that warmwater evidence described "the park's other lakes" now re-anchors: the park's own fishing assets are named for Hyde Lake (below).

## Source 1 — 2026 Trout Stocking Schedule JSON (planned)
- org: TWRA; live fetch 2026-09-25 (616 rows); URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json
- {"REGION":"1","COUNTY":"Shelby","LOCATION":"Shelby Farms","TYPE":"Winter","STOCKING DAY":"1/13/2026","SPECIES":"Rainbow Trout"}
- {"REGION":"1","COUNTY":"Shelby","LOCATION":"Shelby Farms","TYPE":"Winter","STOCKING DAY":"TBD 12/2026","SPECIES":"Rainbow Trout"}
- 2026 JSON months: {1, 12}. Identical rows in prior captures. 2026 regs booklet lists "Shelby Farms" among Region 1 winter trout waters.

## Source 2 — Winter Trout Stocking "Stocking Dates 2017/2018" page (planned)
- local capture winter_report_2016-18.txt ("Updated 03/08/2018"), read 2026-09-25.
- "5 Tuesday Shelby Farms Memphis" (Dec 5, 2017); "9 Tuesday Shelby Farms Memphis" (Jan 9, 2018). Months {12,1}. First documented season on file (absent from 2008-09 launch).

## Source 3 — Winter schedules 2018-19 through 2024-25 (planned)
- 2018-19 (winter_trout_2018.txt): "12/5/2018 Wednesday Shelby Farms" (Dec; row city "Bradford/Carroll" is column bleed); "1/9/2019 Wednesday Shelby Farms" (Jan). Months {12,1}.
- 2019-20 (winter_trout_2019.txt / winter_sched_2020aug.pdf, clean): "12/10/2019 Tuesday Shelby Farms Memphis Shelby"; "1/14/2020 Tuesday Shelby Farms Memphis Shelby".
- 2020-21 (winter_sched_2020-21.pdf): "12/8/2020 Tuesday Shelby Farms Memphis Shelby"; "1/12/2021 Tuesday Shelby Farms Memphis Shelby — 2/23/2021" (annotated additional date).
- 2024-25 (winter_sched_2024-25.pdf): "12/10/2024 Tuesday Shelby Farms Memphis Shelby"; "1/14/2025 Tuesday Shelby Farms" (Jan columns shifted).
- 2021-2023 seasons: gap (Complete.pdf captures carry no winter rows; md5 replay groups documented in beech-lake.md Source 5).

## Source 4 — 2008-09 launch (history bound)
- 2008-09 launch schedule (TWRA release 12/4/2008, live fetch): NO Shelby Farms row. Start year between 2009 and 2017. Note the Hyde Lake redesign (Patriot Lake enlargement) was a 2010s project — consistent with a post-redesign stocking start, but no source states the first year.

## Source 5 — Completed feeds (destination-level)
- 2024 archive (completed2024.json): 05-06/2024 window only, no Region 1 winter rows. Dec-3-2024 report: no Region 1 rows. Live completed JSON 2026-09-25: tailwater only. Jan 2026 completion UNCONFIRMED at destination level. Gap documented.

## Source 6 — WARMWATER leg (Hyde Lake-specific)
- shelbyfarmspark.org asset **"12_hyde_lake_fishing_map.jpg"** (Wayback capture 2019-06-03, http://www.shelbyfarmspark.org/assets/2397/12_hyde_lake_fishing_map.jpg) — the park publishes a Hyde Lake fishing map: Hyde Lake is the park's designated fishing lake.
- shelbyfarmspark.org asset **"fishing_flyer6.pdf"** (Wayback 2022-12-21): park fishing flyer (vector text layer only "WOLF RIVER"; map-based document).
- Wikipedia "Shelby Farms": lakes/wetlands habitat; 1977 Plough Park "included two fishing lakes"; Hyde Lake enlarged for boating in the redesign.
- GBIF live 2026-09-25: 0 fish occurrences within ~2 km (thin). WebSearch rate-limited this session.
- Prior-pass note ("warmwater evidence described the park's other lakes, not Jones Pond") is hereby superseded: the fishing assets retrieved this pass are Hyde Lake-named, so the warmwater leg attaches to the stocked water itself.
- Type: large urban-park lake with a warmwater recreational fishery (park-managed) + winter put-and-take trout.

## Verdict
- **MIXED.** Warmwater leg: documented (park fishing map/flyer for Hyde Lake). Trout leg: winter put-and-take documented 2017-18, 2018-19, 2019-20, 2020-21, 2024-25, 2026 — months **{12, 1}** (+ annotated 2/23/2021 follow-up). No Nov/Feb/Mar regular months.
- Confidence: high (Hyde Lake resolution via pin-to-OSM geometry + park assets); medium (program start year).
- Establishes: stocked water = Hyde Lake (TBD no lake qualifier in TWRA names); Dec-Jan cadence; 2,000/yr (ArcGIS). Does NOT establish: any "Jones Pond" existence; program start year.

## Contradictions
- TWRA StreamName "Shelby Farms Lake" vs. park's "Hyde Lake" naming — same water per geometry; catalog should carry both names.
- Prior-pass "Jones Pond" reference: no such named water found in OSM/Nominatim within the park — drop it.

## Searches / fetches run
2026 JSON x5, ArcGIS x2, winter PDFs x6, 2008 release x3, completed feeds x3, Nominatim x5, Overpass x4 (2 endpoints), Wikipedia Shelby Farms x1, shelbyfarmspark.org probes/CDX/flyer x4, GBIF x7, WebSearch x2 (rate-limited).

## Recommendation
Classify **mixed** — warmwater fishery (Hyde Lake, park-managed) + stocked-winter trout, months 12 and 1. Catalog identity: "Shelby Farms = Hyde Lake (formerly Patriot Lake), Shelby Farms Park, Memphis (TWRA pin 35.13921, -89.83371, OBJECTID 677)"; remove Jones Pond references.
