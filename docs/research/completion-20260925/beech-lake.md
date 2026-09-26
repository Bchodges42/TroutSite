# Beech Lake (Lexington, Henderson County, TN) — mixed-verdict evidence log

Retrieval date for all live sources: 2026-09-25. Research-only pass.

## Water identity
- TWRA schedule name: "Beech Lake" (2017-18 through 2026, unchanged). TWRA ArcGIS locations layer: Site_Name "Beech Lake", StreamName "Beech Lake".
- TWRA ArcGIS pin: **OBJECTID 679, 35.66138718, -88.41224668** (Region 1, HENDERSON, City=Lexington; StockingProgram=Winter; WaterClass=pond; Species=rainbow; NumStocked=1,500; Management=County). Matches the prior-pass OBJECTID 679 note.
- Real-world identity: TVA-built impoundment OF the Beech River (Beech River Watershed Development Authority six-lake system, constructed by TVA in the 1960s; BRWDA is a state agency created 1961; six lakes, 3,000 ac surface total). TWRA layer's WaterClass="pond" understates it (a multi-hundred-acre reservoir); not corrected in TWRA data.
- Wikipedia "Beech River": the Beech River and all eight major tributaries are impounded by mid-20th-century TVA Beech River Project dams, "purely for purposes of flood control and recreation".

## Source 1 — 2026 Trout Stocking Schedule JSON (planned)
- org: TWRA; live fetch 2026-09-25 (3 attempts, 616 rows each); URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json
- {"REGION":"1","COUNTY":"Henderson","LOCATION":"Beech Lake","TYPE":"Winter","STOCKING DAY":"1/14/2026","SPECIES":"Rainbow Trout"}
- {"REGION":"1","COUNTY":"Henderson","LOCATION":"Beech Lake","TYPE":"Winter","STOCKING DAY":"TBD 12/2026","SPECIES":"Rainbow Trout"}
- 2026 JSON months: {1, 12}. Identical rows in prior-pass captures trout_2026_live.json and schedule2026-jina.txt.
- 2026 regs booklet (ereg_tn_2026, local capture) lists Beech Lake among Region 1 winter trout waters (city column scrambled in text extraction; Lexington county column verified via schedule).

## Source 2 — Winter Trout Stocking "Stocking Dates 2017/2018" page (planned)
- org: TWRA; local capture winter_report_2016-18.pdf / winter_report_2016-18.txt (page footer "Updated 03/08/2018"), read 2026-09-25.
- December, 2017: "12 Tuesday Beech Lake Lexington". January, 2018: "10 Wednesday Beech Lake Lexington".
- Months observed 2017-18: {12, 1}. No Feb/Mar 2018 row.

## Source 3 — Winter Trout Stocking 2018-19 PDF (planned)
- org: TWRA; local capture winter_trout_2018.pdf/txt (2018-19 season), read 2026-09-25.
- "12/5/2018 Wednesday Beech Lake" and "1/9/2019 Wednesday Beech Lake" (city/county columns scrambled in extraction — "Clarksville/Lincoln", "Paris/Henry" are bleed from parallel region columns; Lexington/Henderson confirmed in the 2019-20 document).
- Months 2018-19: {12, 1}.

## Source 4 — Winter schedules 2019-20 and 2020-21 PDFs (planned)
- winter_trout_2019.txt and winter_sched_2020aug.pdf (both 2019-20 season): "12/17/2019 Tuesday Beech Lake" and "1/15/2020 Wednesday Beech Lake" (city col bleed "Munford"/"Milan"; county "Henderson" in winter_trout_2019.txt).
- winter_sched_2020-21.pdf (2020-21 season): "12/15/2020 Tuesday Beech Lake" and "1/13/2021 Wednesday Beech Lake ... 3/5/2021" — the 2020-21 document annotates an additional 3/5/2021 date.
- Months: 2019-20 {12,1}; 2020-21 {12,1,3}.

## Source 5 — Winter schedule 2024-25 PDF (planned)
- winter_sched_2024-25.pdf: "12/17/2024 Tuesday Beech Lake" and "1/15/2025 Wednesday Beech Lake" (Jan city/county columns shifted in extraction; water+dates reliable). No Feb/Mar 2025 row.
- 2021-2023 seasons: NOT covered this pass — the Wayback "Complete.pdf" (coldwater) captures for 2021-2025 (cp-2021…cp-2025, md5-deduped this session) contain no winter-program rows at all (md5 groups: 2018/2019/2020 captures identical; 2021-05=2021-12; 2023-02=2023-05=2023-11; 2024-05=2024-09=2024-12). Prior pass noted a 2021 guide showing 5+ year continuity (not re-fetched this session). Gap documented.

## Source 6 — 2008-09 program launch (history bound)
- org: TWRA news release "TWRA Winter Rainbow Trout Stocking Program Resumes", 12/4/2008; live fetch 2026-09-25: https://www.tn.gov/news/2008/12/4/twra-winter-rainbow-trout-stocking-program-resumes.html
- Full 2008-09 schedule listed: no Beech Lake. Program quote (Henegar): trout "will not survive as the water temperatures begin to rise in spring and early summer" — put-and-take design.
- 2003-2015 annual schedules (sched05-09 PDFs extracted this session; sched10-15b txt) contain no winter-program pond rows and no Beech Lake trout rows → earliest documented TWRA row this pass: 12/2017. Start year between 2009 and 2017; prior-pass 2021 guide indicates 5+ years continuity by 2021.

## Source 7 — Completed feeds (destination-level)
- 2024 archive completed feed (completed2024.json): window 05-06/2024 only, Regions 2-4 — no Region 1 winter rows. Dec-3-2024 report capture (stockreport-202412.txt): no Region 1 rows yet (first 2024-25 Region 1 stocking 12/10/2024).
- Live completed JSON 2026-09-25 (tn_complex_datatable.exceldriven.json): 10 rows, 08-09/2026 tailwater only. Jan 2026 completion for Beech Lake UNCONFIRMED at destination level. Gap documented.

## Source 8 — WARMWATER leg
- BRWDA lakes site (archived 2023 capture of brwdalakes.com): Beech Lake is one of six BRWDA lakes; TVA-constructed 1960s; facilities for "outdoor recreation... water supply... flood protection"; "open to fishing".
- BRWDA activities page (archived 2022-08-17): 2023 event calendar includes "West TN Highschool Bass Nation" (April) at Beech Lake — organized bass fishing on this water.
- Wikipedia "Beech River": TVA Beech River Project dams for flood control and recreation.
- GBIF (live API 2026-09-25): 0 fish occurrences within ~2 km of pin (thin, as expected for ponds).
- Type: reservoir with year-round warmwater recreational fishery + winter put-and-take trout.

## Verdict
- **MIXED.** Warmwater leg: documented (BRWDA fishing access; bass-tournament activity; TVA flood-control/recreation reservoir). Trout leg: winter put-and-take, documented 2017-18 → 2026 across 7+ seasons (gap 2021-2023), months **{12, 1}** (+3/2021 makeup once; catalog [11,12,1,2,3] NOT observed — no November or February rows found; March only as 2021 makeup).
- Confidence: high (identity + trout cadence); medium (warmwater leg — no species list fetched; TVA page Cloudflare-blocked, BRWDA site 404 live).
- Establishes: winter trout season Dec-Jan; county-managed; 1,500/yr (ArcGIS NumStocked). Does NOT establish: Nov/Feb/Mar as regular trout months; exact program start year (2009-2017 open).

## Contradictions
- TWRA ArcGIS WaterClass "pond" vs. actual reservoir status (cosmetic, noted).
- 2018-19/2019-20 text extractions show wrong cities/counties for Beech rows (column bleed) — resolved against 2017-18 page and 2019-20 txt showing Lexington/Henderson.

## Searches / fetches run (Beech portion of shared sweeps)
WebSearch x4 (rate-limited, discarded), tn.gov 2008 release x3, 2026 JSON x5, winter PDF extractions x5, cp-* md5 x1, completed feeds x3, GBIF x7, ArcGIS x2, Wikipedia Beech River x1, tva.com x4 (blocked), lexingtontn.gov x3, brwdalakes.com via Wayback x3.

## Recommendation
Classify **mixed** — warmwater year-round fishery (bass) + stocked-winter trout with months 12 and 1 (makeup March 2021 single instance). Identity: TVA/BRWDA impoundment of the Beech River at Lexington; keep OBJECTID 679 pin (35.66139, -88.41225); correct "pond" classification to reservoir in catalog prose.
