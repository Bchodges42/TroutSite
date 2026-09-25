# Stony Creek (Carter County, TN) — Evidence Repair Research Log

Water: Stony Creek (TWRA schedule spelling "Stony Creek"; community/local spelling often "Stoney Creek"), Carter County, TN — a Highway 91 valley freestone creek rising near the Cross Mountain/Iron Mountain divide (Cherokee NF headwaters, >3,800 ft) and falling southwest to join the Watauga River near Elizabethton (~1,555 ft). Known from prior passes via TWRA GIS site "Big Sandy Rd Bridge S24 (Stoney Creek)".
Ledger claim under test: seasonal-stocked with catalog months `[12,1,2]` (SUSPECT — same Dec–Feb pattern proven wrong on other Region 4 creeks).
Research date: 2026-09-25 (all live retrievals this date). Research ONLY; no agencies/businesses/anglers contacted.

---

## 1. Water identity / disambiguation

- **TWRA GIS fact sheet "Stony Creek — Stocked Trout Program"** (TWRA GIS, "Produced by TWRA GIS (04/31/06 wmc)", PCAN #328796; Wayback capture 20100529120628; fetched and parsed 2026-09-25): map labels Stony Creek, CARTER (county lines CARTER/SULLIVAN/JOHNSON/WASHINGTON shown), stocking-site names along the creek — Dry Hollow, Muddy Branch, Liberty Hollow, Grindstaff Hollow, Hurley Hollow, Estep, Hodge Branch, Blevins Hollow, Peters Hollow, Blue Springs, Willow Springs, Siam, Broadview, Trail, Panhandle — with "see 'Watauga River' map" at the downstream end (i.e., the creek joins the Watauga River system below the stocked reach). Establishes: TWRA stocked-trout program on this exact creek since at least 2006, Carter County, Watauga River tributary.
  - URL: https://web.archive.org/web/20100529120628/http://tn.gov/twra/gis/troutpdf/Stony_Creek.pdf
- **Same-name risks CLOSED:**
  - **Little Stony Creek** (above Watauga Lake, Carter Co.) is a DIFFERENT water: TWRA's own trout-regulations text (tn.gov trout-information-stockings page captures 20240930210409, 20241208155225, 20250114154240) lists "**Little Stony Creek** and its tributaries upstream of the confluence with Plot Branch (1.3 miles upstream of Hwy 321 crossing)" as special-regulation water (5-trout creel, single-hook artificials) — wild trout/native brook water, NOT the stocked Highway-91 creek. Double D Fly Co. states flatly: "Little Stony Creek is not the Highway 91 Stony Creek — that's a separate stream… Don't conflate the two."
  - Fishbrain hosts both "Little Stony Creek" (Carter Co.) and "Stony Creek" (nearby-waters list on the Roan Creek page, 49 logged catches) as separate entries.
- **TWRA 2026 stocking schedule JSON** (live tn.gov exceldriven datatable, 616 rows; retrieved 2026-09-25 via browser-context fetch; local capture `tmp/research/data/sched2026.json` md5 880350c17b1aa5183505023f5f96b0c9): 4 rows REGION "4", COUNTY "Carter", LOCATION **"Stony Creek"**, TYPE **"Seasonal"**, SPECIES "Rainbow Trout", STOCKING WEEKs 3/8/2026, 4/5/2026, 5/3/2026, 5/31/2026.
  - URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json

## 2. TWRA ArcGIS stocking sites (coordinates)

**TWRA ArcGIS FeatureServer "TWRA_Trout_Stocking_Locations"** (live REST layer, 730 features; local capture `tmp/research/raw/arcgis_troutloc.json` md5 7b86d7002b9a2c5fda58636aefcb3cb3; query URL below; retrieved 2026-09-25): **23 sites S1–S24 (S11 absent from the layer)**, all County=CARTER, StockingProgram=**Spring**, WaterClass=stream, Species=rainbow, 25 fish/site (≈575 catchable rainbow per stocking event), Management=Private Land, DelayedHarvestSeason=None, no winter program. Reach ~12.5 river-miles SE→NW from headwaters (36.4570,−82.0230) to the lower creek near Elizabethton (36.3705,−82.1556):
- S24 Big Sandy Rd Bridge — 36.45703, −82.02300
- S23 Old Man Kelseys Pond — 36.45483, −82.03000
- S22 Gordon Lewis Rd — 36.44906, −82.04203
- S21 Hodge Branch Rd Bridge — 36.44600, −82.04400
- S20 Estep Hollow Rd Bridge — 36.44144, −82.04589
- S19 Hurley Hollow Rd — 36.43742, −82.05031
- S18 Blevins Hollow Rd Bridge — 36.43414, −82.05336
- S17 Freezeland Circle Bridge — 36.42792, −82.05856
- S16 Grindstaff Hollow Bridge — 36.42094, −82.06664
- S15 Creekbank Rd — 36.41808, −82.07244
- S14 Liberty Hollow Bridge — 36.41350, −82.07906
- S13 Peters Hollow Bridge — 36.41111, −82.08164
- S12 Homer Hardin Bridge — 36.41181, −82.08483
- S10 Muddy Branch Rd Bridge — 36.40403, −82.09181
- S9 Rex Harrell Rd Bridge — 36.40208, −82.09819
- S8 Dry Hollow Rd Bridge — 36.39967, −82.10311
- S7 Blue Springs Rd Bridge — 36.39794, −82.10961
- S6 Earl Williams Rd Bridge — 36.39417, −82.11944
- S5 Price Rd – 10 Ton Bridge — 36.38800, −82.12833
- S4 Danner Rd – Holston View Bridge — 36.38319, −82.13539
- S3 Bill Lewis Rd Bridge — 36.38031, −82.14169
- S2 Iron Mtn Sporting Goods — 36.37597, −82.15458
- S1 Blue Springs Rd Bridge (lower) — 36.37053, −82.15564
  - URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=json

## 3. Month-by-month PLANNED stocking record (primary evidence)

Method: identical geometric grid parsing to the Upper Roan/Beaverdam passes (pymupdf word coordinates, rotation removed; header day-number sequence solved against that year's consecutive Sundays; "The dates listed are all Sundays… within five days after the date listed" per TWRA's own schedules; 0 unmatched marks every year).

| Year | Schedule source (Wayback capture) | Stony Creek stocking weeks (week-of Sundays) | Months supported |
|---|---|---|---|
| 2003 | sched03.pdf @ 20030404161556 | 3/2, 3/16, 3/30, 4/13, 4/27, 5/11, 5/25 (7 biweekly) | Mar, Apr, May |
| 2004 | sched04.pdf @ 20040210011352 | 2/29, 3/14, 3/28, 4/11, 4/25, 5/9, 5/23 (7) | **Feb**, Mar, Apr, May |
| 2005 | sched05.pdf @ 20051124124935 | 2/27, 3/13, 3/27, 4/10, 4/24, 5/8, 5/22 (7) | **Feb**, Mar, Apr, May |
| 2006 | sched06.pdf @ 20060604223344 | 3/12, 3/26, 4/9, 4/23, 5/7, 5/21, 6/4 (7) | Mar, Apr, May, Jun |
| 2007 | sched07.pdf @ 20070227143540 | 3/11, 3/25, 4/8, 4/22, 5/6, 5/20, 6/3 (7) | Mar, Apr, May, Jun |
| 2008 | sched08.pdf @ 20080909205030 | 3/9, 3/23, 4/6, 4/20, 5/4, 5/18, 6/1 (7) | Mar, Apr, May, Jun |
| 2009 | sched09.pdf @ 20090418095714 | 3/8, 3/22, 4/5, 4/19, 5/3, 5/17, 5/31 (7) | Mar, Apr, May |
| 2010 | sched10.pdf @ 20100326100325 | 3/7, 3/21, 4/4, 4/18, 5/2, 5/16, 5/30, 6/13, 6/27 (9) | Mar, Apr, May, Jun |
| 2011 | sched11.pdf @ 20110111175732 | 3/6, 3/20, 4/3, 4/17, 5/1, 5/15, 5/29, 6/12, 6/26 (9) | Mar, Apr, May, Jun |
| 2012 | sched12.pdf @ 20120418154111 | 3/4, 3/18, 4/1, 4/15, 4/29, 5/13, 5/27, 6/10, 6/24 (9) | Mar, Apr, May, Jun |
| 2013 | sched13.pdf @ 20140112202401 | 3/3, 3/17, 3/31, 4/14, 4/28, 5/12, 5/26, 6/9, 6/23 (9) | Mar, Apr, May, Jun |
| 2014 | sched14.pdf @ 20140412202632 | 3/9, 3/23, 4/6, 4/20, 5/4, 5/18, 6/1, 6/15, 6/29 (9) | Mar, Apr, May, Jun |
| 2015 | sched15.pdf @ 20150319003402 | 3/8, 3/22, 4/5, 4/19, 5/3, 5/17, 5/31, 6/14, 6/28 (9) | Mar, Apr, May, Jun |
| 2016 | NOT FOUND — Wayback CDX empty (sched16.pdf, 2016-Trout-Stocking-Schedule.pdf; also probed by prior pass) | — (gap; covered by program continuity) | — |
| 2017 | NOT FOUND — same probes empty | — (gap) | — |
| 2018 | 2018-Trout-Stocking-Schedule.pdf @ 20180717180317 | 3/11, 3/25, 4/8, 4/22, 5/6, 5/20, 6/3, 6/17, **7/1** (9) | Mar, Apr, May, Jun (+one Jul-1 week) |
| 2019 | 2019-Trout-Stocking-Schedule.pdf @ 20190109035923 | 3/10, 3/24, 4/7, 4/21, 5/5, 5/19, 6/2, 6/16 (8) | Mar, Apr, May, Jun |
| 2020 | Trout-Stocking-Schedule-Complete.pdf @ 20200424033427 | 3/8, 3/22, 4/5, 4/19, 5/3, 5/17, 5/31, 6/14 (8) | Mar, Apr, May, Jun |
| 2021 | Complete.pdf @ 20210119123626 (& 20210820055911, distinct digest, same row) | 3/14, 3/28, 4/11, 4/25, 5/9, 5/23, 6/6, 6/20 (8) | Mar, Apr, May, Jun |
| 2022 | Complete.pdf @ 20220221215138 & 20220519194927 (distinct digests) | 3/13, 3/27, 4/10, 4/24, 5/8, 5/22, 6/5, 6/19 (8) | Mar, Apr, May, Jun |
| 2023 | Complete.pdf @ 20230219191239 | 3/12, 3/26, 4/9, 4/23, 5/7, 5/21, 6/4, 6/18 (8) | Mar, Apr, May, Jun |
| 2024 | Complete.pdf @ 20240219225857 & 20240520075643 (distinct digests) | 3/10, 3/24, 4/7, 4/21, 5/5, 5/19, 6/2 (7) | Mar, Apr, May, Jun |
| 2025 | Complete.pdf @ 20250208215445, 20250320072447, (web "Trout Stocking (2025)"), 20250902003710 — 4 digest-distinct captures, all identical rows | 3/9, 3/23, 4/6, 4/20, 5/4, 5/18, 6/1 (7) | Mar, Apr, May, Jun |
| 2026 | Live exceldriven JSON, TYPE "Seasonal" | 3/8, 4/5, 5/3, 5/31 (4 monthly) | Mar, Apr, May (5/31 week runs into Jun) |

**Zero planned Stony Creek stockings in December or January in any archived schedule 2003–2026 (21 scheduled years).** February only in 2004–2005; 2003/2009 = Mar–May; one 7/1 week in 2018. Local PDF md5s: sched03 1f4aec0d…, sched04 bc4da739…, sched05 6202a435…, sched06 f9ef66fa…, sched07 0412ec0b…, sched08 1eb660bd…, sched09 4f6e832d…, sched10 24e79144…, sched11 a92150a8…, sched12 e6bdf890…, sched13 2133ff8a…, sched14 443e890a…, sched15 ec44af71…; 2021–2025 Complete.pdf captures 9 distinct digests (replay-trap check passed; all Stony rows identical Mar–Jun).

## 4. COMPLETED (destination-level) stocking evidence

- **"Coldwater Stocking" report dated 11-16-2018** (TWRA; Jan–Nov 2018 completions; retrieved 2026-09-25, `tmp/research/completion/cw_stocking_2019.pdf` md5 18ae5a512e286847754e96461508f752): "**Stony Creek — 7/3/2018**" (Region 4) = scheduled week-of 7/1/2018 +2 days.
- **"Coldwater Trout Stocking Schedule", updated 5/17/2022** (capture 20220519195104, md5-matched): "**4 Stony Creek — 05/11/2022**" (week-of 5/8/2022 +3).
- **Same document, updated 5/3/2023** (capture 20230520021123, md5-matched): "**4 Stony Creek — 04/27/2023**" (week-of 4/23/2023 +4).
- **Same document, 5/2024 revision** (capture 20240520075717, md5-matched): "**4 Stony Creek — 05/07/2024**" (week-of 5/5/2024 +2).
- **Completed-stocking exceldriven feed, Wayback capture 20240607134309** (re-fetched from Wayback 2026-09-25): "**4 Stony Creek — 06/04/2024**" (week-of 6/2/2024 +2).
- **"Trout Stocking Report" updated 3/21/2025** (capture 20250322191030; retrieved 2026-09-25): "**4 Stony Creek — 03/10/2025**" (week-of 3/9/2025 +1).
- **Negative windows** — "Trout Stocking Report" updated 9/27/2024 (@ 20240927221436), 11/8/2024 (@ 20241111215005), late-2025 revision (@ 20250902003641): **zero Stony Creek completions** (summer/fall). Coldwater winter revisions 2/2022, 11/2022, 2/2023, 11/2023, 2/2024, 8/2024: no Stony Creek.
- **Live tn.gov page + feeds 2026-09-25**: completed feed (updated as of 9/21/2026) has no Stony Creek (season over); destination dropdown lists "Stony Creek". The flattened page text shows "Stony Creek 04/19/2026", but the live completed report flattens absolute-positioned columns — 4/19/2026 does not match any planned 2026 Stony week (3/8, 4/5, 5/3, 5/31) and is NOT attributable to this water; excluded from evidence (flagged §7).

All verifiable completions (2018, 2022, 2023, 2024×2, 2025) land within ≤5 days after a scheduled March–early-July week. **No completed Stony Creek stocking documented outside February–early-July in any year; none at all in Dec–Jan.**

## 5. Holdover / reproduction (absence noted)

- TWRA Region IV trout reports 2017–2023 (local text pulls): **zero mentions of Stony Creek** — no holdover surveys, no reproduction documentation. Year-round language in those reports applies only to TVA tailwaters.
- Winter-program exclusions: "Winter Trout Stocking 2012/2013" tentative dates (Wayback 20130110154309) — city ponds/W TN/tailwaters only, no Stony Creek; Coldwater-Trout_Stocking-Schedule.pdf Feb/Nov revisions 2022–2024 — no Stony Creek; tailwater schedules 2018–2025 — no Stony Creek. (Stony Creek appears ONLY in the May/spring completion revisions.)
- GBIF (API, bbox 36.36–36.47 N, −82.17–−82.01 W, retrieved 2026-09-25): Salmo trutta 24 records, 18 dated **January** (1995–2007, dataset d6cc311c = state fish-atlas grid records, grid-rounded) — most cluster on the Watauga River grid cells (36.36, −82.15/−82.16), but two series sit at 36.41, −82.07 ON the Stony Creek drainage (Peters/Liberty Hollow reach) and one 2024-01 human observation at 36.3636, −82.0574 (Watauga River upstream of Watauga Lake, not the creek). January brown presence on the creek is plausible (wild/holdover browns; doubledfly: "wild rainbows & browns (upper)"; a 2015 angler report records fall-spawning browns moving up the creek) — but this is PRESENCE evidence, not stocking: TWRA never stocked Stony Creek in winter. O. mykiss 1 record (2013-01, grid-rounded); S. fontinalis 0 in the stocked reach (doubledfly: "no documented native brook-trout population in Stony Creek proper"; the native-brook water is Little Stony/Rough Ridge, a different stream).
- USGS NAS (API, TN/Carter; 151 records): no "Stony" waterbody records — unproductive.
- Third-party: Double D Fly Co. "Stony Creek" (https://doubledfly.com/small-waters/stony-creek, Harlan Beckett, posted Aug 6, © 2026): "A Highway 91 valley creek in northeastern Carter County… falls southwest… to join the Watauga River near Elizabethton"; "Stocking runs primarily in spring"; "put-and-grow hatchery fish, primarily a spring stocking"; "Stocked rainbows (lower) · wild rainbows & browns (upper) · lake-run rainbows & browns when the Watauga runs"; "no special slot or delayed-harvest scheme" (TWRA Region IV). PiscaMaps: "TWRA trout-stocked water", rainbow trout, statewide rules (rules "verified 2026-09-01"). Taylor Joyce Fly Fishing report (2015-03-14, upd. 2018-06-12): Watauga fish "swim up into it to feed"; fall spawning browns per commenter; winter section is fly advice only, no winter stocking claim.

## 6. Contradictions found

1. Catalog months `[12,1,2]` vs. **zero December/January planned events in 21 scheduled years (2003–2026)** and zero Dec/Jan completions or winter-program entries. Catalog is wrong.
2. 2026 JSON TYPE="Seasonal" + ArcGIS StockingProgram="Spring" confirm a spring program; the "Stoney Creek" spelling used in the catalog/locally does not exist in any TWRA dataset ("Stony Creek" everywhere in TWRA data; "Stoney" only in third-party usage).
3. Window-edge wrinkles, not contradictions of the verdict: February starts in 2004–2005 (2/29, 2/27); 2003 & 2009 seasons ended in May; a single 7/1/2018 week (completed 7/3/2018); 2024–2026 seasons now end in early June.
4. Live-page flattened text "Stony Creek 04/19/2026" mismatches planned 2026 weeks (artifact; excluded).
5. Little Stony Creek (special-regulation wild water) shares the name in TWRA regulations text — disambiguated above; the stocked program is on the main Highway-91 creek (S1–S24).

## 7. Searches run (distinct; ⚠ = unproductive)

1. WebSearch: "Stony Creek" Carter County Tennessee trout stocking Watauga → Fishbrain (Little Stony), hffbristol.com Top-12, doubledfly.com
2. WebSearch: "Stony Creek" OR "Stoney Creek" Elizabethton TN trout TWRA winter/January → taylorjoyceflyfishing.com 2015 report, piscamaps.com, tn.gov trout page
3. WebSearch: "Stony Creek" Tennessee Siam "Highway 91" Iron Mountain Cherokee NF trout ⚠ (noise + rate limits)
4. WebSearch: "Stoney Creek" Tennessee Elizabethton trout rainbow stocked ⚠ (429 rate-limited, no results)
5. DuckDuckGo HTML mirror + Bing mirror queries for both waters ⚠ (blocked / quotes ignored)
6. Wayback CDX: tn.gov/twra/gis/troutpdf/ folder search → Stony_Creek.pdf @ 20100529120628 (fetched, parsed)
7. Wayback CDX: sched03–15 capture enumeration (pinned all 13; empty probes for sched16/17, 2016-/2017-Trout-Stocking-Schedule.pdf)
8. Wayback CDX: Coldwater-Trout_Stocking-Schedule.pdf capture list (27 digest-distinct captures; 9 fetched/md5-matched to local files, incl. all May revisions)
9. Wayback fetch: Trout_Stocking-Report.pdf captures ×4 (9/27/24, 11/8/24, 3/21/25, 8/29/25-window) parsed in memory
10. Live fetch: 2026 schedule JSON, completed feed, stockings page (dropdown + updated-as-of)
11. ArcGIS REST: TWRA_Trout_Stocking_Locations full-layer query (23 Stony sites with coords)
12. USGS NAS API: TN/Carter County occurrences ⚠ (no Stony waterbody records)
13. GBIF API: species-matched occurrence queries ×3 taxa + January S. trutta coordinate extraction
14. WebFetch: doubledfly.com /small-waters/stony-creek
15. WebFetch: doubledfly.com /small-waters/little-stony-and-rough-ridge (disambiguation)
16. WebFetch: piscamaps.com/us/tennessee/rivers/stony-creek
17. WebFetch: taylorjoyceflyfishing.com/2015/03/14/stoney-creek-elizabethton-tn
18. WebFetch: hffbristol.com ⚠ (homepage; no Stony content; site covers Watauga/South Holston)
19. WebFetch: doubledfly.com/small-waters/ index (33 entries; located the dedicated pages)

## 8. Recommendation

**Kill catalog months [12,1,2]. Reclassify as seasonal with exact months March–June.**

- **Stocked fishery: strictly seasonal, March–June** (biweekly 2003–2018 cadence; 7–9 events/yr 2003–2018, 7–8 in 2019–2025, 4 monthly in 2026; seasons ran Mar–May in 2003/2009 and to a 7/1 week once in 2018; Feb starts only 2004–2005). Species: catchable Rainbow Trout only (≈575/event across 23 sites, all Spring-program, private-land accesses). Suggested ledger string: `seasonal-trout (stocked Mar–Jun; Feb starts 2004–2005; single Jul-1 week 2018)`.
- Type: `seasonal-trout`. Confidence **HIGH** — planned grids read geometrically for 21 of 23 years (2016–17 residual gap, bridged by identical 2015 and 2018 patterns), 6 destination-level completions 2018–2025 all inside the window, every winter/negative window clean, TWRA TYPE="Seasonal"/StockingProgram="Spring", and no agency holdover/reproduction basis for winter stocking (upper-creek wild rainbows/browns and Watauga lake-run fish are presence, not stocking).
