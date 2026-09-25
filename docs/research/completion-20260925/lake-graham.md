# Lake Graham (Madison County, TN) — mixed-verdict evidence log

Retrieval date for all live sources: 2026-09-25. Research-only pass; no agency/business contact.

## Water identity
- **Lake Graham**, ~500-acre TWRA-owned reservoir ~9 mi east of Jackson, Madison County, TN, on Cotton Grove Road. Distinct from any Jackson city park pond (no such pond appears in the same datasets).
- TWRA ArcGIS pin: 35.62994310, -88.72506601 (WaterClass=reservoir; Management=TWRA; Region 1).
- TDEC dam permit listed with TWRA as permittee, Madison County (search-result reference, not fetched).

## Source 1 — 2026 Trout Stocking Schedule JSON (planned evidence)
- Title: 2026 Trout Stocking Schedule (datatable); org: TWRA (tn.gov).
- Observation date: live fetch 2026-09-25, 108,620 bytes, 616 rows. Identical rows in prior-pass capture `trout_2026_live.json` (~2026-09-22).
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json
- Fields (REGION/COUNTY/LOCATION/TYPE/STOCKING DAY/STOCKING WEEK/STOCKING MONTHS/SPECIES):
  - {"REGION":"1","COUNTY":"Madison","LOCATION":"Lake Graham","TYPE":"Winter","STOCKING DAY":"1/8/2026","SPECIES":"Rainbow Trout"}
  - {"REGION":"1","COUNTY":"Madison","LOCATION":"Lake Graham","TYPE":"Winter","STOCKING DAY":"TBD 12/2026","SPECIES":"Rainbow Trout"}
- 2026 JSON months on file: {1, 12}. Establishes: planned winter rainbow stocking in 2026 at this destination. Not: completion of the Jan 2026 event (planned dates only; completed table no longer holds the winter window).

## Source 2 — Winter Trout Stocking (2018-2019) schedule PDF (planned evidence)
- Title: "Winter Trout Stocking (2018-2019)"; org: TWRA; season 2018-19. Local capture: `winter_trout_2018.pdf` (prior pass). Retrieval date 2026-09-25 (read from corpus).
- Region I rows (pdf column lists align in parallel order; pdftotext -layout drifts on TOWN/COUNTY, plain-order alignment verified):
  - NOVEMBER 2018: Lake Graham, 11/30/2018 Friday, Jackson, Madison.
  - JANUARY 2019: Lake Graham, 1/8/2019 Tuesday, Jackson, Madison.
  - FEBRUARY 2019: Region I — "No Winter Program Stockings this Month". MARCH 2019: same.
- Months observed 2018-19: {11, 1}. Establishes: recurring program membership at this named destination in a prior season.

## Source 3 — TWRA news release, program winter 2008-09 (planned evidence)
- Title: "TWRA Winter Rainbow Trout Stocking Program Resumes"; org: TWRA newsroom; published 2008-12-04.
- URL: https://www.tn.gov/news/2008/12/4/twra-winter-rainbow-trout-stocking-program-resumes.html
- Lake Graham (Jackson): stocking dates Dec. 10 [2008] and Jan. 20 [2009]; statewide release >82,000 rainbow trout Dec–Mar, ~10-in rainbows, creel 7.
- Establishes: Lake Graham in the winter rainbow program at least since winter 2008-09. Program era "starts ~2003" not verifiable this pass (Wayback CDX/page fetches returned "Temporarily Offline"/504 all session; sched03-08 PDFs unreachable; the local sched09-17.pdf corpus contains no winter-program listings at all — control names McKenzie/Paris City/Beech Lake also absent, so those PDFs are tailwater/seasonal documents, not negatives about this pond).

## Source 4 — Completed feeds (destination-level completion)
- 4a. Live completed-feeds JSON (tn_complex_datatable.exceldriven.json on the same page), fetched 2026-09-25: 779 bytes, 10 rows, all 8/25/2026–9/18/2026 tailwater/seasonal. No winter rows — window scrolled off. Establishes: nothing about 2026 winter completion; characterizes current window.
- 4b. Wayback capture 2024-12-08 (tw-20241208155225.html, prior pass): completed table includes Lake Graham among Nov–Dec 2024 completed destinations. Establishes: destination-level completed winter stocking, 2024-25 season (exact row/date pairing limited by page flattening).
- 4c. Wayback capture 2025-01-14 (tw-20250114154240.html, prior pass): completed table again includes Lake Graham (12/18/2024–01/06/2025 week group). Establishes: two separate completed appearances in the 2024-25 winter.
- 4d. `completed2024.json` (gzip, prior pass): 54 rows, window 5/14/2024–5/31/2024 only; no winter ponds (May window; not a negative).

## Source 5 — WARMWATER leg (strong)
- 5a. TWRA lake page "Lake Graham in Tennessee — Fishing" (tn.gov/twra/fishing/where-to-fish/west-tennessee-r1/lake-graham.html; fetched 2026-09-25): ~500 acres; TWRA Family Fishing Lake; species line: "Largemouth bass - crappie - bluegill - redear sunfish - blue & channel catfish"; lake-specific regs for bass/bluegill/redear/crappie/catfish AND trout (7/day); boat ramp + fishing pier. Establishes: year-round warmwater fishery managed by TWRA at the same water.
- 5b. TWRA Warmwater Stockings datatable (tn_complex_datatable_2031984048.exceldriven.json on tn.gov/twra/fishing/warmwater-stockings.html; live fetch 2026-09-25, 96,256 bytes): Lake Graham rows — Black Crappie 9/11/2023 (25,198); Blue Catfish 2/22/2023 (7,336), 2/27/2023 (5,220), 7/31/2023 (6,007), 8/21/2023 (6,530); Black Crappie 10/24/2024 (16,812); Bluegill 9/9/2024 (101,877); Blue Catfish 5/28/2025 (5,040), 6/10/2025 (6,216), 6/30/2025 (1,296), 7/17/2025 (4,802), 7/21/2025 (4,608); Bluegill 10/22/2025 (43,418 + 9,240), 10/31/2025 (72,391); Redear Sunfish 10/26/2025 (93,937). Establishes: active TWRA warmwater stocking program at this exact water, 2023–2025.

## Contradictions
- A noisy web-search summary claimed "Lake Graham is not a trout stocking water" — contradicted by TWRA's own 2026 schedule, 2018-19 schedule, 2008 release, completed feeds, and the lake page's own trout regulation. Disregarded.
- One third-party lake was named "Lake Graham" in Fishbrain caches near Luray/other states — no bearing on identity; TWRA datasets are unambiguous.

## Searches run (~8): live schedule JSON x3 (2 connection resets), completed JSON x3, ArcGIS queries x2, tn.gov lake page, warmwater datatables x2, news release, web searches x3 (1 rate-limited).
GBIF/iNat: skipped as non-load-bearing (thin for ponds per plan).

## Type + confidence + recommendation
- **Type: mixed (winter-stocked trout + TWRA warmwater lake). Confidence: HIGH — both legs primary TWRA evidence.**
- Mixed verdict SURVIVES. No identity or county correction needed. Seasonal-stocked trout months observed: {11,12,1} (Nov 2018; Dec 2008, Dec 2024 completed, TBD Dec 2026; Jan 2009, Jan 2019, Jan 2026).
