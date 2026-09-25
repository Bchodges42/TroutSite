# Valentine Park pond / "Munford City Park" (Tipton County, TN) — mixed-verdict evidence log

Retrieval date for all live sources: 2026-09-25. Research-only pass.

## Water identity — COUNTY CORRECTION CONFIRMED, plus a dual-name record
- **Valentine Park (a.k.a. Valentine Regional Park), Munford, TIPTON County — NOT Shelby County.** The prior ledger correction is upheld by TWRA's own 2018-19 winter schedule ("Valentine Park ... Munford ... Tipton") and the 2026 schedule ("Valentine Park", County Tipton).
- Physical site: Valentine Park's lake — official city page (munford.com/valentine-park, fetched 2026-09-25): "Valentine Park offers two playgrounds, a picnic pavilion, restroom facilities, soccer fields, two 18-hole Disc Golf courses, **a stocked lake**, and nature trails." Third-party address: 1020 Beaver Rd, Munford (Yelp/MapQuest via search). OSM/Nominatim: "Valentine Regional Park" centroid 35.46365, -89.80061; concessions stand on Aaron Fultz Parkway 35.46329, -89.80769.
- **TWRA dual naming:** TWRA's 2026 ArcGIS locations layer calls the site "**Munford City Park**" (TIPTON, Munford, pond, Management=City, pin 35.46480289, -89.80496287) and has NO "Valentine" feature; that pin falls inside Valentine Regional Park (between the OSM park centroid and its concessions stand). The same "Munford City Park" name is used in TWRA's winter 2008-09 news release and in the 2025-01-14 completed-feeds capture.
- **Decisive exclusion:** the City of Munford has a genuinely separate "City Park" at 101 College Street (munford.com/city-park, fetched 2026-09-25) whose amenities are a gazebo, walking track, toddler playground and open space — **no pond/lake**. Therefore the TWRA "Munford City Park" label is a loose name for the stocked lake at Valentine Park; the trout site is ONE water.

## Source 1 — 2026 Trout Stocking Schedule JSON (planned)
- org: TWRA; live fetch 2026-09-25, 616 rows; URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json
- {"REGION":"1","COUNTY":"Tipton","LOCATION":"Valentine Park","TYPE":"Winter","STOCKING DAY":"1/15/2026","SPECIES":"Rainbow Trout"}
- {"REGION":"1","COUNTY":"Tipton","LOCATION":"Valentine Park","TYPE":"Winter","STOCKING DAY":"TBD 12/2026","SPECIES":"Rainbow Trout"}
- 2026 JSON months on file: {1, 12}.

## Source 2 — Winter Trout Stocking (2018-2019) PDF (planned)
- org: TWRA; local capture winter_trout_2018.pdf (prior pass), read 2026-09-25.
- Region I rows: DECEMBER 2018 — Valentine Park, 12/5/2018, Munford, Tipton. JANUARY 2019 — Valentine Park, 1/10/2019, Munford, Tipton. Feb/Mar 2019 Region I: none.
- Months observed 2018-19: {12, 1}.

## Source 3 — TWRA news release winter 2008-09
- "TWRA Winter Rainbow Trout Stocking Program Resumes", TWRA, 2008-12-04: https://www.tn.gov/news/2008/12/4/twra-winter-rainbow-trout-stocking-program-resumes.html — "**Munford City Park** (Munford): Dec. 18 [2008] + Jan. 22 [2009]." Establishes: the Munford pond in the program at least since winter 2008-09 (under the loose name).

## Source 4 — Completed feeds
- Wayback capture 2025-01-14 (tw-20250114154240.html, prior pass): completed table lists "**Munford City Park**" in the 12/18/2024–01/06/2025 week group. Establishes: destination-level completed winter stocking, 2024-25 season.
- Capture 2024-12-08 (tw-20241208155225.html): Munford/Valentine absent (partial window).
- Live completed JSON 2026-09-25: 10 tailwater rows only (window); Jan 2026 completion unconfirmed (no Wayback snapshot near Feb 2026 — gap documented).

## Source 5 — WARMWATER leg (moderate)
- Official: munford.com/valentine-park — "a stocked lake" (city-maintained lake; species not stated).
- Third-party: BringFido listing "Emily's Bark Park at Valentine Park" describing fishing opportunities at the park (search summary, 2026-09-25).
- No TWRA warmwater-stocking rows for the pond; no species list found (searches rate-limited late in session).
- Establishes: city-maintained stocked lake = a warmwater park fishery; species-level evidence thin.

## Contradictions
- Name: "Valentine Park" (2018-19 + 2026 schedules) vs "Munford City Park" (2008 release, 2025 completed feeds, 2026 locations layer) — resolved as one site (see identity; the real City Park has no pond).
- County: task prompt relayed a prior "Valentine Park = Shelby County" claim — FALSE for this water; all TWRA rows say Tipton. (Shelby County has its own Valentine-named toponyms but none in TWRA trout data.)

## Searches run (~9): schedule JSON x3, 2018-19 PDF, completed captures, ArcGIS x2, munford.com x2, Nominatim x2, web searches x3.
GBIF/iNat: skipped (non-load-bearing).

## Type + confidence + recommendation
- **Type: mixed (winter trout put-and-take on a city "stocked lake"), confidence MEDIUM-HIGH** (trout leg primary TWRA back to 2008-09 incl. a 2024-25 completed row; warmwater leg official but species-free).
- Mixed verdict SURVIVES. Ledger corrections: (1) county = Tipton (not Shelby) — upheld; (2) canonical identity = "Valentine Park (stocked lake), Munford, Tipton County", TWRA alias "Munford City Park"; use pin 35.46480, -89.80496 (inside Valentine Regional Park). Months observed: {12,1}.
