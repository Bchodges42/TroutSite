# Martin City Pond (Weakley County, TN) — mixed-verdict evidence log

Retrieval date for all live sources: 2026-09-25. Research-only pass.

## Water identity
- Pond at Martin's city park complex, Martin, Weakley County, TN. TWRA datasets call it "Martin City Pond" (schedules) / "Martin City Park" (ArcGIS locations layer); City of Martin calls the venue the Martin Recreational Complex (Rec Complex) and holds its youth fishing derby at the "Martin Rec Complex Pond".
- TWRA ArcGIS pin: 36.30897627, -88.85240229 (Region 1, WEAKLEY, Martin; WaterClass=pond; Management=City). OSM/Nominatim "Martin Recreational Complex" park centroid 36.30705, -88.84999 — same complex (~250 m).
- County confirmed Weakley (2026 schedule; 2018-19 schedule; ArcGIS). The task prompt's "Weakness?" is a typo; no discrepancy.

## Source 1 — 2026 Trout Stocking Schedule JSON (planned)
- org: TWRA; live fetch 2026-09-25 (616 rows); URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json
- {"REGION":"1","COUNTY":"Weakley","LOCATION":"Martin City Pond","TYPE":"Winter","STOCKING DAY":"1/14/2026","SPECIES":"Rainbow Trout"}
- {"REGION":"1","COUNTY":"Weakley","LOCATION":"Martin City Pond","TYPE":"Winter","STOCKING DAY":"TBD 12/2026","SPECIES":"Rainbow Trout"}
- 2026 JSON months on file: {1, 12}. Establishes: planned winter rainbow stocking 2026.

## Source 2 — Winter Trout Stocking (2018-2019) PDF (planned)
- org: TWRA; local capture winter_trout_2018.pdf (prior pass), read 2026-09-25.
- Region I rows: DECEMBER 2018 — Martin City Pond, 12/6/2018, Martin, Weakley. JANUARY 2019 — Martin City Pond, 1/10/2019, Martin, Weakley. Feb/Mar 2019 Region I: none ("No Winter Program Stockings").
- Months observed 2018-19: {12, 1}.

## Source 3 — TWRA news release winter 2008-09
- "TWRA Winter Rainbow Trout Stocking Program Resumes", TWRA, 2008-12-04: https://www.tn.gov/news/2008/12/4/twra-winter-rainbow-trout-stocking-program-resumes.html
- Martin City Pond (Martin): Dec. 17 [2008] + Jan. 21 [2009]. Establishes: program membership at least since winter 2008-09. Pre-2008 unverifiable this session (Wayback offline; local sched09-17 PDFs contain no winter-program listings — they are tailwater/seasonal documents, confirmed by control greps).

## Source 4 — Completed feeds
- Live completed JSON 2026-09-25 (tn_complex_datatable.exceldriven.json): 10 rows, 8-9/2026 tailwater only; no winter rows in window.
- Wayback captures 2024-12-08 and 2025-01-14 (prior-pass tw-*.html): Martin City Pond NOT present in either captured completed table (those windows show Lake Graham and Munford City Park among Region 1 ponds). Gap: Jan 2026 completion unconfirmed (no Wayback snapshot near Feb 2026; live table scrolled). Not evidence of absence — capture windows are partial.

## Source 5 — WARMWATER leg (moderate; tertiary-weighted)
- Fishbrain (via search summary, 2026-09-25): "Martin Recreational Complex" lake, Weakley County — most popular for largemouth bass, bluegill, and rainbow trout (9 rainbow catches logged). FishAngler: "Martin Recreation Center Pond," rainbow trout catches. PiscaMaps: "Martin City Park Pond," public fishing, night-fishing/boat notes.
- City of Martin: annual Martin Youth Fishing Derby at the Martin Rec Complex Pond, held each June in conjunction with TN Free Fishing Day (June 7, 2025 event listed on cityofmartin.net per search summary). Weakley County Press online editions (June 6, 2017 and June 5, 2018, via nwtntoday.com search, fetched 2026-09-25): annual fishing derby in Martin on free fishing day; 2017 article notes prior-year derby ("89 anglers caught a total of 115 fish" cited for 2017 in the 2018 edition context). Establishes: an actively managed, multi-species (warmwater-dominated) city pond fishery that also receives trout in winter.
- No TWRA warmwater-stocking rows for this pond (warmwater datatable grep negative) — city pond fishery is self-sustaining/locally managed; derby pond likely stocked by the city (not evidenced to species level this pass).

## Contradictions
- Naming only: "Martin City Pond" vs "Martin City Park" vs "Martin Rec Complex Pond" — same venue per county/city/pin agreement. No county or location conflict.

## Searches run (~7): schedule JSON x3, completed feeds, ArcGIS, Nominatim, web searches x4 (2 rate-limited), nwtntoday fetch, cityofmartin.net fetch (homepage only, no pond text — WooCommerce shell).
GBIF/iNat: skipped (non-load-bearing, thin for ponds).

## Type + confidence + recommendation
- **Type: mixed (winter trout put-and-take on a city warmwater pond). Confidence: MEDIUM-HIGH** — trout leg primary TWRA back to 2008-09; warmwater leg rests on angler platforms + city derby tradition rather than a TWRA species list.
- Mixed verdict SURVIVES. Canonical name: keep "Martin City Pond (Martin Recreational Complex)". Months observed: {12,1} (Dec 2008, Dec 2018, TBD Dec 2026; Jan 2009, Jan 2019, Jan 2026).
