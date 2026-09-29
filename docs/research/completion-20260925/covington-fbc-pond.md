# Covington First Baptist Church Pond (Covington, Tipton County, TN) — evidence log

Retrieval date for all live sources: 2026-09-25. Research-only pass.

## Water identity
- TWRA 2026 schedule name: "Covington First Baptist Church Pond (NEW)" — the "(NEW)" suffix is part of the location string, marking first-year program waters.
- TWRA ArcGIS locations layer: Site_Name "First Baptist Church Covington", StreamName "First Baptist Church Covington Pond" — **OBJECTID 701, 35.536168, -89.635004** (Region 1, County=Tipton, City=Covington; StockingProgram=Winter; WaterClass=pond; Species=rainbow; NumStocked=null; Management="First Baptist Church Covington").
- A pond on the First Baptist Church campus at/near that coordinate, Covington, TN. Private-property access managed by the church (ArcGIS Management field names the church, not a government). No address published in TWRA data; coordinate is the authoritative location.
- 2026 regs booklet (ereg_tn_2026) does not show a Covington row in the Region 1 winter list excerpt extracted this pass (booklet may predate or omit it; not verified).

## Source 1 — 2026 Trout Stocking Schedule JSON (planned)
- org: TWRA; live fetch 2026-09-25 (616 rows); URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json
- {"REGION":"1","COUNTY":"Tipton","LOCATION":"Covington First Baptist Church Pond (NEW)","TYPE":"Winter","STOCKING DAY":"1/15/2026","SPECIES":"Rainbow Trout"}
- {"REGION":"1","COUNTY":"Tipton","LOCATION":"Covington First Baptist Church Pond (NEW)","TYPE":"Winter","STOCKING DAY":"TBD 12/2026","SPECIES":"Rainbow Trout"}
- 2026 JSON months: {1, 12}. Identical rows in prior captures trout_2026_live.json / schedule2026-jina.txt.

## Source 2 — Prior-season absence (2024-25 schedule)
- winter_sched_2024-25.pdf (local capture, extracted 2026-09-25): Region 1 December 2024 rows are Cameron Brown, Edmund-Orgill, Shelby Farms (12/10), Davies Plantation, Yale Road, Johnson Park Lake (12/12), Beech Lake (12/17). **No Covington/FBC row.** January 2025 likewise absent.
- Consistent with the "(NEW)" label: the 2025-26 season (Dec 2025 TBD row + 1/15/2026) is its first documented program year. No 2025-26 season PDF was available in corpus or captured this pass; the 2026 JSON is the earliest Covington document on file.

## Source 3 — 2008-09 launch and deep history
- 2008-09 launch schedule (TWRA release 12/4/2008, live fetch): no Covington entry.
- 2003-2015 annual schedules and 2017-18 / 2018-19 / 2019-20 / 2020-21 winter pages: no Covington row anywhere.
- Conclusion: program start = 2025-26 winter season (or at earliest late 2025). Confidence: high for absence in all checked documents.

## Source 4 — Completed feeds (destination-level)
- 2024 archive completed feed (completed2024.json): 05-06/2024 window, Regions 2-4 — nothing possible for this pond (predates program start).
- Live completed JSON 2026-09-25: 10 tailwater rows only. The 1/15/2026 stocking is UNCONFIRMED at destination level in all captures available this pass. Gap documented.

## Source 5 — WARMWATER leg
- None. fbccovington.org live fetch 2026-09-25 returned a JS-rendered page with no pond/fishing text extractable; no TWRA dataset carries a warmwater row for this pond; GBIF live 2026-09-25: 0 fish occurrences within ~2 km; WebSearch rate-limited this session.
- Type (as evidenced): small private church-campus pond operated as a winter put-and-take trout site. Warmwater leg UNDOCUMENTED/UNKNOWN — plausible for a year-round pond, but no source supports it.

## Verdict
- **SEASONAL-STOCKED** (winter put-and-take), months **{12, 1}** on current evidence (2026 plan only: 1/15/2026 + TBD 12/2026). Only ONE documented season; all history claims beyond 2025-26 are unsupported.
- Confidence: high (identity/coordinate; planned rows); low (actual completions — nothing destination-level on file).
- Establishes: location (OBJECTID 701), winter program membership 2025-26/2026, church-managed access. Does NOT establish: any pre-2026 stocking; warmwater fishery; public access terms.

## Contradictions
- None found. The 2024 archive destination list contains no Covington FBC row (consistent with "(NEW)"); if the catalog previously asserted older Covington stockings, those are unsupported.

## Searches / fetches run
2026 JSON x5, ArcGIS x2, winter PDFs x6, 2008 release x3, completed feeds x3, fbccovington.org x1, GBIF x7, WebSearch x1 (rate-limited).

## Recommendation
Classify **seasonal-stocked**, months 12 and 1, program year 2025-26 forward; identity "First Baptist Church Covington Pond, Covington, Tipton County (35.53617, -89.63500, OBJECTID 701, church-managed)"; treat all stocking history as beginning with the 2026 plan until a 2025-26 season document or completion row surfaces.
