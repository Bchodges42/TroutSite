# Fort Loudoun Lake (Fort Loudoun Reservoir, Tennessee River, Knoxville) — Evidence Completion Log

- Ledger verdict at start: `warmwater-focus` (verify/strengthen); note "zero trout" to confirm.
- Research date: 2026-09-25 | Mode: internal classification research, read-only (no docs/ edits, no git writes, no parties contacted)

## Identity

- TVA mainstem impoundment of the Tennessee River at Knoxville (dam completed 1943), Fort Loudoun Dam at 35.7914,-84.2428 (OSM Nominatim, retrieved 2026-09-25). 14,600 acres, ~360 miles of shoreline; extends ~55 miles upstream from the dam to the Holston–French Broad confluence ("forks of the river"); connects to Watts Bar via lock and to Tellico via canal. Knox/Blount/Loudon counties; TWRA Region 4.
- Mainstem navigation reservoir (only ~6 ft drawdown), fertile, year-round good dissolved oxygen.

## Sources

### S1. TWRA Fort Loudoun Reservoir "Where to Fish" page (committed capture)
- Title: "Fort Loudoun Reservoir in Tennessee | Bank and Boat Fishing Opportunities" | Org: TWRA (no byline)
- URL: https://www.tn.gov/twra/fishing/where-to-fish/east-tennessee-r4/fort-loudoun-reservoir.html
- Publication: undated agency page; capture in docs/research/2026-09-22-fishery-opportunities/captures/twra-fishery-fort-loudoun-lake.html; corroborated live via search snippet 2026-09-25.
- Fields: "The most commonly harvested fish are largemouth, smallmouth, and white bass. Bluegill, crappie, and catfish are also present in good numbers." "What you can catch" = Black Bass (LMB/SMB/spotted; "well known for its quality largemouth and smallmouth bass fishing... many high-profile tournaments have been held in the Knoxville area in recent years"), Crappie (white crappie majority, 10-in MLL/15 creel), Sauger ("forks of the river" late-winter/early-spring run at the Holston–French Broad confluence; 10/day, 15-in), Catfish ("state record 130-pound Blue Catfish was taken by commercial gear from Fort Loudoun in 1976"). Regulations: black bass 5/day 15-in; striped/hybrid 2/day 15-in; white bass 15/day; walleye 5/day 16-in; paddlefish; sunfish.
- TROUT: zero trout mentions anywhere on the page — no trout regulation line, no trout section, no stocking reference (unlike Melton Hill, which at least carries the generic statewide trout line).
- Type: agency reservoir profile. Confidence: high.
- Establishes: warmwater program identity (bass/crappie/sauger/walleye/catfish/striper) and trout ABSENCE from the agency's fishery description.

### S2. 2026 TWRA trout stocking schedule JSON (616 rows) + ArcGIS layer
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json ; retrieved 2026-09-25 (live fetch + full local snapshot `trout_2026_live.json`).
- Fields: ZERO rows for Fort Loudoun / Loudoun (or any Knoxville-area lake row). Region 4 trout rows are streams/tailwaters only.
- TWRA ArcGIS TWRA_Trout_Stocking_Locations (REST, retrieved 2026-09-25): 0 features matching "LOUDOUN."
- Type: planned schedule + agency site master. Confidence: high.
- Establishes: no trout stocking program exists for the lake in 2026 (Little River and other tributaries that carry trout are separate waters outside the reservoir's stocked inventory).

### S3. Dated warmwater source #1 — 2019 Bassmaster Classic (national championship on this reservoir)
- "2019 GEICO Bassmaster Classic presented by DICK'S Sporting Goods — March 15-17, Tennessee River, Knoxville, TN" | Org: B.A.S.S./Bassmaster; https://www.bassmaster.com/tournament/2019-geico-bassmaster-classic-presented-by-dicks-sporting-goods/ ; retrieved 2026-09-25. Corroborated by Knoxville city announcement (knoxvilletn.gov, 2018) and BASSFIRST details piece ("For the first time in its 49-year history, the GEICO Bassmaster Classic... will be held on the Tennessee River out of Knoxville"; daily takeoffs from Volunteer Landing).
- Fields: the Classic — bass fishing's world championship — was contested Mar 15–17, 2019 on the Knoxville Tennessee River fishery, i.e., Fort Loudoun Reservoir's mainstem reach and its Holston/French Broad arms. (Jordan Lee won; the venue identity, not the winner, is the classification evidence.)
- Type: dated tournament record (2018 announcement + 2019 event). Confidence: high.
- Establishes: nationally recognized largemouth/smallmouth fishery on this specific reservoir, dated.

### S4. Dated warmwater source #2 — sauger run and general fishery (current guides/agency echo)
- TWRA page sauger section (S1): "Traditionally, Sauger fishing in Fort Loudoun reservoir takes place in the late winter and early spring in a section of the reservoir locally known as the 'forks of the river'... the confluence of the Holston and French Broad rivers that form the Tennessee River."
- OnWater Farragut summary (https://www.onwaterapp.com/us/tennessee/city/farragut-c1, retrieved 2026-09-25): "Forks of the River: The confluence of the Holston and French Broad rivers is excellent for sauger fishing in late winter and early spring."
- Islands.com Fort Loudoun feature (https://www.islands.com/1995342/fort-loudoun-lake-knoxville-tennessee-boating-fishing-water-sports/, retrieved 2026-09-25): "Late winter and early spring are the best times to fish for sauger at the confluence of the Holston River, French Broad River, and headwaters of Fort Loudoun."
- Type: agency profile + current third-party guides. Confidence: high (agency) / medium (guides).
- Establishes: the signature sauger/walleye winter run — a classic warmwater-coolwater mainstem fishery — is the lake's cold-season headliner, not trout.

### S5. GBIF occurrence check (washdown question)
- api.gbif.org box query 35.70–35.95 N, 84.35–83.80 W, retrieved 2026-09-25: Oncorhynchus mykiss total 2 — (a) 2021-02 iNaturalist research-grade at 35.7590,-83.9776 (French Broad arm upstream of Knoxville; single observation, tributary-influenced headwater reach); (b) 1939-12 specimen "Little River" 35.7261,-83.8182 (pre-dates the 1943 dam; tributary, not the reservoir). Salmo trutta 0; Salvelinus fontinalis 0.
- Type: occurrence database. Confidence: medium.
- Establishes: no trout presence pattern in the lake proper; the two rainbow hits are a single modern headwater-arm observation and a pre-impoundment tributary specimen — leads only, not a fishery.

## Contradictions
- None found. Auto-generated "fly fishing forecast" sites (whackingfatties-type) attach trout boilerplate to any waterbody and were treated as noise, not evidence.

## Searches run (6)
1. DDG: Fort Loudoun Lake fishing largemouth smallmouth sauger TWRA Knoxville (hit: TWRA page, fishn-buddy, fortloudoun.info)
2. DDG: Bassmaster Classic 2019 Knoxville Tennessee River bass tournament (hit: bassmaster.com, knoxvilletn.gov, outdoorsfirst)
3. DDG: Fort Loudoun Lake sauger run forks of the river Holston French Broad winter (hit: onwaterapp, islands.com, TWRA snippet)
4. DDG: Fort Loudoun Lake trout fishing Knoxville (returned no parseable results; trout absence verified via S1/S2/S5 instead)
5. WebSearch attempts during rate-limit windows (Bassmaster/Classic corroboration) + Bing via WebFetch (degraded results, unproductive)
6. Direct fetches: GBIF API box query; ArcGIS REST; 2026 schedule JSON.

## Recommendation
CONFIRM `warmwater-focus` for Fort Loudoun Lake, confidence high. The agency profile documents quality largemouth/smallmouth, crappie, the signature "forks of the river" sauger/walleye winter run, and a 130-lb blue catfish record — with ZERO trout mentions; the 2026 trout schedule and TWRA GIS have no lake row/site; GBIF shows no lake trout pattern (two tributary/pre-dam leads only). The 2019 Bassmaster Classic dates the reservoir's national-class warmwater reputation. No washdown fishery claim is warranted; keep Holston/French Broad tributary trout waters distinct.
