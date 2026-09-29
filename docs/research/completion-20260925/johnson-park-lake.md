# Johnson Park Lake (W.C. Johnson Park, Collierville, Shelby County, TN) — evidence log

Retrieval date for all live sources: 2026-09-25. Research-only pass.

## Water identity — LOCATION VERIFICATION (task asked "Jackson? Madison Co")
- **The 2026 schedule row "Johnson Park Lake" is NOT in Jackson/Madison County.** Every TWRA dataset this pass places it in Shelby County:
  - 2026 JSON: REGION 1, COUNTY "Shelby".
  - ArcGIS layer: Site_Name "Wc Johnson Park", StreamName "Wc Johnson Park Lake" — **OBJECTID 672, 35.082520792, -89.670482026** (Region 1, SHELBY, City=Collierville; Winter; pond; rainbow; NumStocked=2,000; Management=City).
  - Winter schedules 2019-20 and 2017-18: "Johnson Park Lake — Collierville".
- The water is the lake in **W.C. Johnson Park, Town of Collierville, TN**. Jackson (Madison Co.) has no "Johnson Park Lake" in any TWRA winter dataset; the Jackson winter pond is "Lake Graham" (different water). Identity correction should be propagated to the catalog.

## Source 1 — 2026 Trout Stocking Schedule JSON (planned)
- org: TWRA; live fetch 2026-09-25 (616 rows); URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json
- {"REGION":"1","COUNTY":"Shelby","LOCATION":"Johnson Park Lake","TYPE":"Winter","STOCKING DAY":"1/15/2026","SPECIES":"Rainbow Trout"}
- {"REGION":"1","COUNTY":"Shelby","LOCATION":"Johnson Park Lake","TYPE":"Winter","STOCKING DAY":"TBD 12/2026","SPECIES":"Rainbow Trout"}
- 2026 JSON months: {1, 12}. Identical rows in prior captures.

## Source 2 — 2008-09 program launch (probable original participant under a different name)
- org: TWRA news release 12/4/2008 (live fetch 2026-09-25, URL in beech-lake.md Source 6): "Dec. 16 Tuesday Collierville City Park Collierville" and "Jan. 21 Wednesday Collierville City Park Collierville".
- W.C. Johnson Park is Collierville's major community park with the town's fishing lake; "Collierville City Park" is the natural antecedent name for what the schedules later call "Johnson Park Lake". Confidence: MEDIUM (name linkage inferred, not documented by a source stating it).

## Source 3 — Winter Trout Stocking "Stocking Dates 2017/2018" page (planned)
- local capture winter_report_2016-18.txt ("Updated 03/08/2018"), read 2026-09-25.
- "5 Tuesday Johnson Park Lake Collierville" (Dec 5, 2017); "9 Tuesday Johnson Park Lake Collierville" (Jan 9, 2018). Months {12,1}.

## Source 4 — Winter schedules 2018-19 through 2024-25 (planned)
- 2018-19 (winter_trout_2018.txt): "12/5/2018 Wednesday Johnson Park Lake" (Dec; city col bleed "McKenzie"); "1/9/2019 Wednesday Johnson Park Lake McKenzie Carroll" (Jan; bleed). Months {12,1}.
- 2019-20 (winter_trout_2019.txt, clean): "12/10/2019 Tuesday Johnson Park Lake Collierville Shelby"; "1/14/2020 Tuesday Johnson Park Lake Collierville Shelby".
- 2020-21 (winter_sched_2020-21.pdf): "12/10/2020 Thursday Johnson Park Lake [city bleed 'Bartlett'] Shelby"; "1/14/2021 Thursday Johnson Park Lake ... 2/24/2021" (annotated additional date).
- 2024-25 (winter_sched_2024-25.pdf): "12/12/2024 Thursday Johnson Park Lake [bleed 'Bartlett'] Shelby"; "1/16/2025 Thursday Johnson Park Lake" (Jan columns shifted).
- 2021-2023 seasons: gap (Complete.pdf captures contain no winter rows; see beech-lake.md Source 5).

## Source 5 — Completed feeds (destination-level)
- All available completed-feed captures (2024 archive, Dec-2024 report, live 2026-09-25) contain no Region 1 winter rows — the rolling feed never spans the winter window in available captures. Jan 2026 completion UNCONFIRMED at destination level. Gap documented.

## Source 6 — WARMWATER leg
- Collierville municipal site (colliervilletn.gov) 403 to non-browser fetch; Wayback CDX returned no captured park page for "johnson" (domain-filtered query, 2016-2026).
- GBIF live 2026-09-25: 0 fish occurrences within ~2 km of pin. WebSearch rate-limited this session.
- No warmwater evidence in any TWRA dataset (ArcGIS row Winter-only). Type (as evidenced): town park lake managed as winter put-and-take trout water. Warmwater leg UNDOCUMENTED this pass.

## Verdict
- **SEASONAL-STOCKED.** Months documented **{12, 1}** (plus a single annotated 2/24/2021 follow-up in 2020-21); seasons: 2008-09 (as "Collierville City Park", medium confidence), 2017-18, 2018-19, 2019-20, 2020-21, 2024-25, 2026. No Nov/Feb/Mar regular months observed.
- Confidence: high (location correction + cadence); medium (2008-09 name linkage).
- Establishes: Collierville (not Jackson) city park lake; Dec-Jan cadence; 2,000/yr (ArcGIS). Does NOT establish: warmwater fishery; exact first-year identity under the modern name.

## Contradictions
- Task premise "(Jackson? Madison Co)" contradicted by all TWRA datasets — corrected above.
- ereg_tn_2026 extraction shows "Johnson Park Lake — Millington" (column bleed); resolved against schedule + ArcGIS (Collierville).

## Searches / fetches run
2026 JSON x5, ArcGIS x2, 2008 release x3, winter PDFs x6, completed feeds x3, GBIF x7, colliervilletn.gov probe + CDX x2, WebSearch x1 (rate-limited).

## Recommendation
Classify **seasonal-stocked**, months 12 and 1. Catalog identity fix: "Johnson Park Lake = W.C. Johnson Park Lake, Collierville, Shelby County (35.08252, -89.67048, OBJECTID 672)" — remove any Jackson/Madison association.
