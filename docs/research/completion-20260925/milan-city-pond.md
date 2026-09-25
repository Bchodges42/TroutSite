# Milan City Pond (Gibson County, TN) — mixed-verdict evidence log

Retrieval date for all live sources: 2026-09-25. Research-only pass.

## Water identity
- Pond in Milan City Park, City of Milan, Gibson County, TN. TWRA schedule name: "Milan City Pond" (2026) / "Milan City Pond" (2018-19). TWRA ArcGIS locations layer name: "Milan City Park" (pond).
- TWRA ArcGIS pin: 35.92381912, -88.72896482 (Region 1, GIBSON, Milan; WaterClass=pond; Management=City).
- Official city address: "Milan City Park: 7001 Ellington Drive, Milan, TN 38358" (cityofmilantn.com parks page, fetched 2026-09-25); 160-acre City Park.
- OSM/Nominatim: "Milan City Park" park polygons at 35.92169, -88.73020 and 35.91979, -88.73089 — TWRA pin sits at/adjacent the park (~300 m).
- **Identity correction (prior-pass note):** this is the Milan city-park pond in Gibson County per every TWRA dataset this pass (2026 schedule, 2018-19 schedule, ArcGIS layer). No "Rutherford Fork Obion" association appears in any TWRA stocking dataset; that earlier association is not supported and should be dropped.

## Source 1 — 2026 Trout Stocking Schedule JSON (planned)
- org: TWRA; live fetch 2026-09-25, 616 rows; URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json
- {"REGION":"1","COUNTY":"Gibson","LOCATION":"Milan City Pond","TYPE":"Winter","STOCKING DAY":"1/14/2026","SPECIES":"Rainbow Trout"}
- {"REGION":"1","COUNTY":"Gibson","LOCATION":"Milan City Pond","TYPE":"Winter","STOCKING DAY":"TBD 12/2026","SPECIES":"Rainbow Trout"}
- 2026 JSON months on file: {1, 12}. Rows also present, identical, in prior-pass captures trout_2026_live.json and schedule2026-jina.txt.

## Source 2 — Winter Trout Stocking (2018-2019) PDF (planned)
- org: TWRA; local capture winter_trout_2018.pdf (prior pass), read 2026-09-25.
- Region I rows (column lists align in parallel order): DECEMBER 2018 — Milan City Pond, 12/5/2018, Milan, Gibson. JANUARY 2019 — Milan City Pond, 1/9/2019, Milan, Gibson. Feb/Mar 2019 Region I: none.
- Months observed 2018-19: {12, 1}.

## Source 3 — Depth of history
- NOT in the TWRA winter 2008-09 news release (https://www.tn.gov/news/2008/12/4/twra-winter-rainbow-trout-stocking-program-resumes.html — Lake Graham, Martin City Pond, Union City-Reelfoot Packing Site, Munford City Park all listed; Milan absent). So Milan's program start falls between 2009 and 2018; with Wayback CDX/page fetches offline all session and the local sched09-17 PDF corpus containing no winter-program listings (tailwater/seasonal documents, control-verified), the start year cannot be pinned this pass. Documented as an open gap.

## Source 4 — Completed feeds
- Live completed JSON 2026-09-25: 10 rows, 8-9/2026 tailwater only (no winter rows in window).
- Wayback captures 2024-12-08 and 2025-01-14 (prior-pass tw-*.html): Milan City Pond absent from both captured completed tables (windows partial). Jan 2026 completion unconfirmed (no snapshot near Feb 2026). Gap documented.

## Source 5 — WARMWATER leg (thin)
- Official: cityofmilantn.com parks page confirms the 160-acre Milan City Park (7001 Ellington Drive) as the city's main park (pool, ball fields, trails, pavilion, campground). The page text fetched does not itself name the pond or fishing.
- Third-party (search summaries, 2026-09-25): ParkAdvisor visitor description of Milan City Park mentions "a small pond"; Yelp "lakes near Milan" lists none in town — city-park pond is the only named stillwater in town besides area lakes.
- No TWRA warmwater-stocking rows; no city species list found. Searches rate-limited partway (2 of 4 attempts 429).
- Establishes only weakly: a city-park pond fishery exists; no species-level warmwater evidence found within the timebox.

## Contradictions
- Prior-pass "Rutherford Fork Obion side" association — contradicted by all TWRA datasets (see identity correction above).
- Name variants: "Milan City Pond" (schedules) vs "Milan City Park" (locations layer) — same site per pin/address.

## Searches run (~8): schedule JSON x3, 2018-19 PDF, completed feeds, ArcGIS query, Nominatim x2, cityofmilantn.com fetch, web searches x4 (2 rate-limited).
GBIF/iNat: skipped (non-load-bearing).

## Type + confidence + recommendation
- **Type: mixed (winter trout put-and-take on a city-park pond), confidence MEDIUM** — trout leg primary TWRA (2018-19, 2026; start year open 2009-2018); warmwater leg is the weakest of the five (official park page without species wording; pond attested third-party).
- Mixed verdict SURVIVES on the current standard, but flag the warmwater leg as thin; if the ledger requires species-level warmwater evidence for city ponds, Milan (and Union City) would fall to "seasonal-stocked with months [12,1]".
- Keep "Milan City Pond (Milan City Park), Gibson County" — drop the Rutherford Fork Obion association.
