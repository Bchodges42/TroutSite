# Mossy Creek (Jefferson County, TN) — `mixed` verdict audit, months [12,1,2]
Retrieval date for all sources: 2026-09-25 (local files in `tmp/research/` all carry 2026-09-25 mtimes). Research only; no agency contacted.

Ledger verdict under test: `mixed`, months [12,1,2].
**Conclusion up front: the TROUT leg is real but BRAND NEW — TWRA revived a winter urban-trout program on Mossy Creek in Jefferson City in November 2025 ("first time since the 1980s"), with 300 rainbow trout per event once each month in November, December, and January. The ledger months [12,1,2] are WRONG at both ends: February has no evidence anywhere, while November is documented by an executed 11/21/2025 stocking. Correct trout months = [11,12,1]. The WARMWATER leg survives only at lead grade (three citizen-science single catches + a foundation "fishing opportunities" mention); no agency warmwater sampling for this creek was found. MIXED survives formally, but if the ledger's warmwater claim is meant to be a fishery claim it is thin — flag it. The creek is also a double name trap: a second Mossy Creek exists in Hamilton County, and the famous Mossy Creek spring creek (VA, TU) pollutes search results.**

---

## The water and its reach
- Mossy Creek is a small spring-fed stream flowing through Jefferson City, Jefferson County (the city's original name was Mossy Creek), winding from the Carson-Newman University campus "before merging into Cherokee Lake, part of the Holston River system" (Float the Mossy). Newport Plain Talk (TWRA release): "a tributary of Cherokee Reservoir."
- **Stocked reach:** Carson-Newman campus section "behind the baseball stadium" (Plain Talk), public access at Walnut Avenue and Brookline Court (visitjeffersonco), event address "100 Davis St. Behind the Carson-Newman Baseball Fields, Jefferson City, TN 37760" (GoOutdoorsTennessee #61472).
- **Coordinates (TWRA ArcGIS stocking layer, 3 points, OBJECTIDs 702–704):** Old Andrew Johnson Hwy 36.12718, −83.48616; Walnut Ave 36.12302, −83.48369; Greenway 36.12178, −83.48153. All `StockingProgram = Winter`, `WaterClass = stream`, `Species = rainbow`, `Management = City`, City = Jefferson City.
- **Disambiguation:** (a) WQP has 20 monitoring stations on THIS Mossy Creek (Jefferson Co., code 089), e.g. "MOSSY CREEK AT OLD HWY 11E AT JEFFERSON CITY" 36.12703, −83.48629 — cluster matches the stocking points exactly; (b) a DIFFERENT "MOSSY CREEK" exists in Hamilton County (WQP station 35.26, −85.29) — not this water; (c) the famous Mossy Creek (Virginia) spring creek/TU chapter is unrelated but dominates naive web answers (the search tool's fallback answered with the VA fishery — discarded); (d) Jefferson County's only other trout water is Cherokee TW / Holston River (Jefferson/Grainger tailwater, 2026 months J,F,M,A,N,D) — a different water, not to be conflated.

## Sources

### S1. TWRA 2026 Trout Stocking Schedule (state datatable JSON, 616 rows; fetched 2026-09-25)
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json (local `completion/trout_2026_live.json`)
- Rows — Region 4 | Jefferson | **"Mossy Creek (NEW)"** | TYPE **Winter** | Rainbow Trout:
  - STOCKING DAY **1/14/2026** (dated)
  - STOCKING DAY **TBD 11/2026** (month-only plan)
  - STOCKING DAY **TBD 12/2026** (month-only plan)
- Establishes: 2026 planned winter program; TWRA itself flags the water as NEW. No other Jefferson stream rows (Cherokee TW is listed under Jefferson/Grainger Tailwater). Confidence high.

### S2. TWRA archived grid schedules 2003, 2010–2013, 2018–2025 (PDF; word-coordinate decode this pass)
- Files: `_work/sched03.pdf` (2003); `completion/scheds/sched10–13.pdf` (2010–2013); `ts2018/ts2019/ts2019b.pdf`; `data/complete/complete_2020.pdf` (2020); `complete_2021a/b.pdf` (2021); `complete_2022a/b.pdf`; `complete_2023a.pdf`; `complete_2024a/b.pdf`; `complete_2025a/b/d.pdf` (2018–2025).
- Result: **zero "Mossy" rows and zero Jefferson-county stream rows in every decoded year.** Decoder validated against the prior pass's Cosby Creek decode (exact date match). sched14–17.pdf (2014–2017) are empty/corrupt locally and Internet Archive was offline this pass (prior pass also found these captures dead).
- Establishes: no modern-era stocking of Mossy Creek through 2025 — consistent with the "(NEW)" label and the "since the 1980s" history. Confidence high (2014–2017 gap noted, but the wall of 2003–2013 + 2018–2025 empties plus the "first since 1980s" news record makes a hidden program implausible).

### S3. TWRA ArcGIS Trout Stocking Locations layer (live query captured 2026-09-25; `raw/arcgis_troutloc.json`)
- `services3.arcgis.com/.../TWRA_Trout_Stocking_Locations/FeatureServer/0` — 730 features; Jefferson/Hamilton rows listed above; 3 Mossy Creek points, program Winter, rainbow, City management.
- Establishes: destination-level program metadata agreeing with the 2026 schedule TYPE. Confidence high.

### S4. Newport Plain Talk — "Winter trout stocking features new Mossy Creek location" (published Nov 20, 2025; attributed to TWRA release)
- URL: https://www.newportplaintalk.com/article_d3fd9f80-0606-4402-a074-4b68fb0ee477.html (fetched 2026-09-25)
- Fields: "TWRA plans to stock 300 Rainbow Trout … into Mossy Creek once each month in November, December, and January." Fish raised at Buffalo Springs Hatchery (Rutledge). "For the first time since the 1980s, TWRA will stock Rainbow Trout into Mossy Creek, a tributary of Cherokee Reservoir." Partners: Jefferson County Tourism, Mossy Creek Outdoor Collective, Carson-Newman University, City of Jefferson City.
- Establishes (plan + announcement, one day before execution): months **Nov, Dec, Jan**; species; source hatchery; "new location" framing. Confidence high.

### S5. Carson-Newman University campus news — "Campus onlookers brave weather, find something fishy at Mossy Creek" (published Nov 21, 2025)
- URL: https://www.cn.edu/campus-onlookers-brave-weather-find-something-fishy-at-mossy-creek (fetched 2026-09-25)
- Fields: stocking **executed Friday, Nov. 21, 2025**, rainy morning; 300 trout released in November; "an additional 600 planned through December and January"; per TWRA the trout were raised at Buffalo Springs Hatchery; "Not since the 1980s has TWRA stocked Rainbow Trout into Mossy Creek."
- Establishes: **execution-level** evidence for Nov 2025. Confidence high.

### S6. Visit Jefferson County TN — "Mossy Creek Trout Stocking Returns After Decades" (published Dec 9, 2025)
- URL: https://visitjeffersoncountytn.com/mossy-creek-trout-stocking-returns-after-decades/ (fetched 2026-09-25)
- Fields: TWRA stocking "300 rainbow trout per event"; first delivery Nov 21; "additional scheduled dates December 17 and January 14"; "More stocking events will continue throughout the winter"; access Walnut Ave/Brookline Court; 7-trout daily limit; license + trout stamp (under-13 free).
- Establishes: dated Nov/Dec/Jan event calendar; Dec 17, 2025 and Jan 14, 2026 at plan level (this article does not confirm execution); winter-season framing. Confidence high for plan; medium for the Dec/Jan executions.

### S7. TWRA weekly fishing report page (tn.gov, page lastModified 24 Sep 2026; `data/weekly.html`)
- URL: https://www.tn.gov/twra/fishing/weekly-fishing-report.html
- Tennessee WildCast episode "Hidden Gems of Jefferson County: Douglas & Cherokee" (Jefferson County Tourism guests incl. Skylar Hamilton): "…growing opportunities like the **Mossy Creek urban trout project**."
- Establishes: TWRA's own site (Sept 2026) frames Mossy Creek as a growing **urban trout project**; agency awareness/continuity into 2026. Confidence high.

### S8. TWRA GoOutdoorsTennessee event #61472 — "Mossy Creek Trout Event" (Sat, March 21, 2026, 9:00 AM–1:00 PM)
- URL: https://license.gooutdoorstennessee.com/Event/ViewEvent.aspx?id=61472 (fetched 2026-09-25)
- Fields: location "100 Davis St. Behind the Carson-Newman Baseball Fields"; "Free for all ages and skill; come for fishing tips and tricks"; Host: Jefferson County Department of Tourism; partner TWRA; contact Matthew Cameron; license + trout stamp 13+.
- Establishes: an agency-registered community fishing event at the stocked reach in March 2026 (education event, not a documented stocking row). Confidence high.

### S9. Completed-stocking feeds (destination-level; checked 2026-09-25)
- (a) 2024 archive (`_work/clinch_completed_2024.json`, 54 rows, window 05/06–06/04/2024): no Mossy row (program did not exist).
- (b) Live Sept 2026 completed feed (`_work/completed_live.json`, 10 rows, window 08/28–09/03/2026): no Mossy row (window is off-season; consistent with a winter program, non-evidential either way).
- (c) Jumbled live-page wordcloud (`completion/stockings-live.html.txt`) pairs "Mossy Creek (NEW) 7/16/2026 5/21/2026 …" among scrambled fragments — unreliable layout; recorded as a **single-catch lead only**.
- Establishes: no clean executed row for Mossy Creek retrieved from any feed; execution evidence rests on S5 (Nov 21) and the dated plan in S4/S6. Confidence: medium.

### S10. Warmwater evidence (leads)
- iNaturalist API, 3 km around 36.124, −83.484 (queried 2026-09-25): only 5 fish-class observations; at Jefferson City: **bluegill Lepomis macrochirus 2024-07-24**, **largemouth bass Micropterus nigricans 2024-07-27**, **white bass Morone chrysops 2023-05-20** (plus two statewide misID sturgeon records, discarded). Single catches = leads. The white bass hints at Cherokee-Lake influence near the mouth.
- Mossy Creek Outdoor Collective (mossycreekfoundation.org/mossy-creek-outdoor-collective, © 2026, fetched 2026-09-25): works to "enhance trails, waterways, **fishing opportunities**, wildlife viewing areas, and public access to Mossy Creek." No species named.
- Float the Mossy (floatthemossy.com, fetched 2026-09-25): water trail from behind Carson-Newman to the Mossy Creek Wildlife Viewing Area takeout at Cherokee Lake; no fish species named.
- The Dyrt listing (search-surfaced snippet, page not opened): the creek "flows directly into Cherokee Lake and supports consistent fishing year-round" — unvetted campground-listing claim, lead only.
- TWRA's Trout Fishing Forecasts storymap (`completion/storymap_data.json`, fetched 2026-09-25): **no forecast entry for Mossy Creek** (nearest entries: Big Soddy Creek and the Cherokee/Holston waters).
- GBIF (bbox query) returned 0 fish records for the reach; NAS has only county-level Salmo trutta records (2003–2007, not water-specific, pre-program).
- Establishes: warmwater fish (sunfish/bass/white bass) present in or beside the creek at Jefferson City, 2023–2024, citizen-science grade; no agency warmwater survey of the creek found. Confidence: low-medium (leads).

### S11. Disambiguation datasets
- WQP Station search "Mossy Creek", Tennessee (queried 2026-09-25): 23 name-matching stations — 20 in Jefferson Co. (this creek), 1 labeled "MOSSY CREEK" in Hamilton Co. (35.26, −85.29), 1 elsewhere; documents the second, unrelated Mossy Creek.
- USGS gauge reference in TWRA storymap is for N. Chickamauga Creek near Big Soddy (03566535) — not this water.

## Months-by-year stocking table
| Year | Months with evidence | Evidence grade |
|---|---|---|
| 2003 | none | grid decoded (high) |
| 2010–2013 | none | grids decoded (high) |
| 2014–2017 | not retrievable (dead captures; Archive offline 2026-09-25) | gap |
| 2018–2025 schedules | none (zero Jefferson stream rows) | grids decoded (high) |
| 2025 | **Nov** (executed 11/21), **Dec** (planned 12/17) | S5 execution; S4/S6 plan |
| 2026 | **Jan** (day 1/14/2026 in TWRA schedule + tourism calendar), **Nov, Dec** (TBD 2026 plan rows) | S1 (high), S6 (plan) |
| Winter 2025-26 program statement | Nov, Dec, Jan monthly | S4/S5/S6 (high) |

**February: no evidence in any year.** The ledger's [12,1,2] is unsupported for month 2; month 11 is evidenced but absent from the ledger.

## Contradictions and gaps
- Ledger months [12,1,2] vs program definition "once each month in November, December, and January" (S4/S5/S6) — February contradicted by the program's own description; November missing from the ledger.
- Dec 17, 2025 / Jan 14, 2026 executions are dated plans (S6), not completed-feed rows; no clean executed feed row was retrievable for any Mossy event.
- 2014–2017 schedule PDFs unretrievable (empty/corrupt; Wayback offline during this pass) — cannot visually confirm emptiness, but the "first since the 1980s" reporting (S4/S5/S6) makes a hidden 2014–17 program untenable.
- Warmwater leg has no agency documentation (no TWRA sample, no forecast entry, no state/city fishing page naming species); it rests on three iNat single catches plus foundation/tourism phrasing.
- Prior-run caution confirmed: a search-engine fallback answered a Mossy Creek query with the Virginia Mossy Creek TU fishery (wrong state, wrong creek) — name trap recorded.

## Searches run (Mossy Creek)
1. WebSearch: "Mossy Creek" "Jefferson City" Tennessee trout stocking TWRA — rate-limited (429), unproductive.
2. DDG(html): "Mossy Creek" "Jefferson City" Tennessee trout stocking — productive (surfaced S6 + foundation, Float the Mossy, Dyrt, Historic District).
3. DDG: "Mossy Creek" Jefferson City TN fishing bass/bluegill/catfish/smallmouth — no results (unproductive).
4. DDG: "Mossy Creek" Tennessee creek −"Jefferson City" −Virginia trout stocked county — parse-empty (unproductive).
5. DDG: Mossy Creek Jefferson City fishing Cherokee Lake species — no results (unproductive).
6. DDG: Mossy Creek Foundation Jefferson City fishing Outdoor Collective — no results (unproductive); page fetched directly instead.
7. WebSearch: Mossy Creek Jefferson City "urban trout" / WildCast — productive (surfaced TWRA Facebook post, Carson-Newman S5, Plain Talk S4, GoOutdoors event S8).
8. WebSearch: GoOutdoorsTennessee "Mossy Creek Trout Event" — productive (S8 event page, date/address/host).
9. WebSearch: TWRA WildCast episode lookup — not directly located; TWRA weekly-report page (S7) mined from local capture instead.
10. WQP station search "Mossy Creek" TN — productive disambiguation (S11).
11. iNaturalist API (fish, 3 km, Jefferson City) — 5 obs, 3 usable warmwater leads (S10).
12. GBIF API bbox query — 0 records (unproductive).
13. NAS API (Jefferson Co.) — no water-specific salmonid/warmwater creek records (unproductive).
14. Fetch/open: visitjeffersoncountytn.com article (S6); 15. floatthemossy.com (S10); 16. mossycreekfoundation.org (S10); 17. newportplaintalk.com (S4); 18. cn.edu (S5); 19. license.gooutdoorstennessee.com event (S8).
20. Wayback attempts for sched14–17 + CDX check — offline/404 (unproductive; gap documented).
21. Local-corpus greps: "Mossy" across all archived schedule texts, completed feeds, storymap, weekly report (multiple operations; zero pre-2026 rows anywhere).

## Recommendation (per water)
- **Trout months: [11, 12, 1]** — Nov (executed 11/21/2025), Dec (planned 12/17/2025 + TBD 12/2026 row), Jan (1/14/2026). Drop February; add November. If the ledger pins months per-program rather than per-water, winter 2025-26 = N/D/J exactly.
- **Warmwater claim strength: weak/lead-grade.** Bluegill, largemouth, white bass iNat single catches (2023–24) + "fishing opportunities" foundation language + Dyrt listing snippet. No agency warmwater documentation for the creek.
- **Mixed verdict: survives formally** (both legs have at least named-water evidence), but if the ledger requires agency-grade evidence for the warmwater leg, re-class to a single-class **winter put-and-take trout water (new 2025 program, urban, Jefferson City)** with warmwater presence noted as incidental. Do not extend months to Feb on the strength of "throughout the winter" phrasing — the defined program is Nov/Dec/Jan.
