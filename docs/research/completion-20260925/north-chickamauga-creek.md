# North Chickamauga Creek (Hamilton County, TN) — `mixed` verdict audit, months unpinned
Retrieval date for all sources: 2026-09-25 (local files in `tmp/research/` all carry 2026-09-25 mtimes). Research only; no agency contacted.

Ledger verdict under test: `mixed`, no months pinned.
**Conclusion up front: MIXED SURVIVES — both legs are evidenced at this named creek by agency and on-the-water sources. Trout leg: TWRA has rowed "N. Chickamauga Creek" in 22 retrieved schedule years (2003, 2010–2013, 2018–2026), always a cold-season put-and-take: late-Feb→May every year, plus a fall row every year 2021–2026 (October; November 1 in 2026). Winter (Dec–Jan) stocking: never, in any retrieved year. Warmwater leg: strong — state-park fishing page (smallmouth bass, redeye, sunfish + periodically stocked trout downstream of the Blue Hole), Conservancy trout-fishing page (bass and bream throughout the lower reaches), angler forum (largemouth/bream/large trout below Thrasher Pike), iNat assemblage. The specific "redhorse" fishery is NOT evidenced (no Moxostoma record found anywhere) — downgrade that wording to the documented smallmouth/bream warmwater fishery. If months must be pinned for the trout leg: [2,3,4,5] + fall [10] (2026 fall row sits in November). Name traps: the 2010–2013 schedules misfile the creek under Polk, Monroe, and Marion counties; "South Chickamauga Creek" is a different water; and the TWRA forecasts storymap's only "North Chickamauga" text is a USGS gauge reference for Big Soddy Creek, not a forecast entry for this creek.**

---

## The water and its reach
- North Chickamauga Creek drains the Walden Ridge gorge (North Chickamauga Creek Gorge State Park, Soddy-Daisy/Hamilton Co.) and flows ~15 miles to the Tennessee River (Chickamauga Reservoir) at Chattanooga.
- **Stocked reach (TWRA ArcGIS layer, 1 point, OBJECTID 419):** "Thrasher Pike Bridge Crossing (S1)", StreamName "North Chickamauga Creek", County HAMILTON, City Soddy-Daisy, `StockingProgram = Spring`, Species rainbow, Management TWRA, **35.21115, −85.21512**. Park-stocked reach per Tennessee State Parks: "downstream of the Blue Hole" (in the gorge). Conservancy: trout water "upstream from Dayton Pike"; warmwater "throughout the lower reaches."
- 2026 Hamilton Co. trout waters for contrast: Big Soddy Creek (Delayed Harvest Feb + Seasonal Mar–Apr), Dickert Pond / Camp Jordan (Winter, Jan 7 + Feb 4), Lake Junior (Winter, Jan 7 + Feb 4) — the Hamilton **Winter** program is ponds only; N. Chickamauga Creek is NOT in it.

## Sources

### S1. TWRA 2026 Trout Stocking Schedule (state datatable JSON, 616 rows; fetched 2026-09-25)
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json (local `completion/trout_2026_live.json`)
- Rows — Region 3 | Hamilton | **"N. Chickamauga Creek"** | TYPE **Seasonal** | Rainbow Trout; STOCKING WEEK (week-of Sundays): **2/22/2026, 3/22/2026, 4/19/2026, 11/1/2026**.
- Establishes: 2026 plan; months Feb, Mar, Apr, Nov; the 2026 fall slot moved to November (Oct in 2021–2025). Confidence high.

### S2. TWRA archived grid schedules (PDF; word-coordinate decode this pass; decoder validated exactly against the prior pass's Cosby Creek dates)
| Year | Week-of dates | County column | File |
|---|---|---|---|
| 2003 | Mar 9, Apr 13, May 4 | Hamilton | `_work/sched03.pdf` |
| 2010 | Mar 28, Apr 11, May 9 | **Polk** (error) | `scheds/sched10.pdf` |
| 2011 | Mar 27, Apr 10, May 8 | **Monroe** (error) | `scheds/sched11.pdf` |
| 2012 | Mar 26, Apr 8, May 6 | **Marion** (error) | `scheds/sched12.pdf` |
| 2013 | Mar 24, Apr 7, May 5 | **Marion** (error) | `scheds/sched13.pdf` |
| 2014–2017 | not retrievable (empty/corrupt PDFs; Wayback offline this pass; prior pass also dead) | — | gap |
| 2018 | Mar 4, Apr 8, May 6 | Hamilton | `scheds/ts2018.pdf` |
| 2019 | Mar 3, Apr 7, May 5 | Hamilton | `scheds/ts2019.pdf`, `ts2019b.pdf` |
| 2020 | Mar 1, Apr 5, May 3 | Hamilton | `data/complete/complete_2020.pdf` |
| 2021 | Mar 7, Apr 11, May 9, **Oct 24** | Hamilton | `complete_2021a/b.pdf` |
| 2022 | Mar 6, Apr 10, May 8, **Oct 2** | Hamilton | `complete_2022a/b.pdf` |
| 2023 | **Feb 26**, Apr 2, Apr 30, **Oct 15** | Hamilton | `complete_2023a.pdf` |
| 2024 | **Feb 25**, Mar 31, Apr 28, **Oct 27** | Hamilton | `complete_2024a/b.pdf` |
| 2025 | **Feb 23**, Mar 30, Apr 27, **Oct 26** | Hamilton | `complete_2025a/b/d.pdf` |
- Establishes: spring window in every retrieved year; late-Feb tail added 2023–2025; fall row every year 2021–2025; never Dec–Jan; never summer. The Polk/Monroe/Marion county labels 2010–2013 are county-column errors for the same named stream (name-trap note). Confidence high for decoded years.

### S3. TWRA ArcGIS Trout Stocking Locations layer (`raw/arcgis_troutloc.json`, captured 2026-09-25)
- One Hamilton point (above): Thrasher Pike Bridge Crossing, program **Spring**, rainbow, TWRA management. Note: GIS program label ("Spring") understates the schedule's fall rows 2021–2026.

### S4. Completed-stocking feeds (destination-level; checked 2026-09-25)
- (a) 2024 archived feed (`_work/clinch_completed_2024.json`, 54 rows, window 05/06–06/04/2024): no N. Chickamauga row.
- (b) Live Sept 2026 feed (`_work/completed_live.json`, 10 rows, 08/28–09/03/2026): none (window off-season).
- (c) Jumbled live-page wordcloud (`completion/stockings-live.html.txt`): fragment "…Shelby Bottoms 5/24/2026 10/11/2026 **2/22/2026** … N. Chickamauga Creek …" — scrambled layout; the 2/22/2026 date matches the creek's scheduled week. Recorded as a **single-catch lead** only (same caveat class as the Cosby log's jumbled datatable).
- (d) Angler-side execution corroboration: iNat rainbow trout at Jones Gap Rd, Soddy-Daisy on **2026-02-06** (x5) and 2026-04-07; and 2019-05-27 at 8516 Dayton Pike (see S8). The Feb 6 obs precede the 2/22/2026 week — plausibly Big Soddy DH activity or early execution; lead only, not attributed.
- Establishes: executed-row evidence is thin; the schedule record (S2) carries the trout leg. Confidence: medium overall.

### S5. North Chickamauga Creek Conservancy — "Trout Fishing" page (northchick.org/adventure/trout-fishing; fetched 2026-09-25)
- Fields: "In partnership with the Tennessee Wildlife Resources Agency, NCCC volunteers have begun stocking the North Chickamauga Creek" (rainbow trout, gorge area); "species of bass and bream can be caught throughout the lower reaches of the creek"; the Highway 27→Tennessee River stretch "holds water (and fish) all year"; "the best time to fish for trout upstream from Dayton Pike would be from **November to May** when the creek typically holds flow."
- Establishes: Conservancy+TWRA stocking partnership (the prior pass's claim, reconfirmed today); a stated Nov–May trout window (wider than TWRA's rowed Feb–May+fall); the warmwater lower-reach fishery. Confidence high for the partnership claim; the Nov–May window is advice, not a schedule.
- Note: the conservancy homepage and events page (also fetched 2026-09-25) contain no fishing/stocking content; no 2025–26 derby/event page found — prior "holds events" claim not reconfirmed this pass.

### S6. Tennessee State Parks — North Chickamauga Creek Gorge fishing page (tnstateparks.com/parks/north-chickamauga/fishing; fetched 2026-09-25)
- Fields: "a great place for experienced anglers to challenge themselves to snag **rainbow trout, smallmouth bass, redeye, sunfish and more**. **Rainbow trout is periodically stocked downstream of the Blue Hole.** All catches are subject to TWRA Rules & Regulations."
- Establishes: state-agency documentation of BOTH legs at the named creek (stocked trout in the gorge; warmwater sportfish). Confidence high.

### S7. Chattanooga Fishing Forum — "Can you fish at the North Chickamauga Creek Gorge State Park" (thread Jan 18–28, 2025; fetched 2026-09-25)
- Fields: TWRA "stocked trout at Thrasher Pike … or at least used to"; below the Thrasher Pike bridge the creek holds "a lot of fish," including "some large trout," largemouth bass, bream; upper gorge "will dry up starting in late spring" but water is "cool year round" near the Pocket.
- Establishes: angler corroboration of the Thrasher Pike stocking reach and warmwater catches; seasonal-flow caveat for the gorge. Confidence medium (secondary).

### S8. iNaturalist API (queried 2026-09-25)
- 4 km around Thrasher Pike (35.211, −85.215): 37 fish observations — **smallmouth bass x11** (M. dolomieu x6, M. nigricans x5), redbreast sunfish x3, bluegill x3, rock bass x2, logperch x3, **rainbow trout x2** (2019-05-27 "8516 Dayton Pike, Soddy Daisy"; 2024-04-03 Soddy Daisy — both spring, post-stocking weeks), northern hogsucker 2022-08-28 "Mile Straight", crappie, green sunfish.
- 8 km wider window: 126 fish obs incl. rainbow trout x7 (5 on 2026-02-06 at Jones Gap Rd — see S4d), gilt darter x5, spotted bass. **No Moxostoma (true redhorse) records in either window.**
- Establishes: warmwater assemblage at the creek (smallmouth-strong) and trout presence timed to the stocking season. Confidence medium-high (citizen science, spatially filtered).

### S9. Secondary/other
- PiscaMaps "North Chickamauga Creek" (fetched 2026-09-25; species attributed to "TWRA and Tennessee fishery data"): Rainbow Trout, Smallmouth Bass, Largemouth Bass, Spotted Bass, Walleye, Black/White Crappie, Bluegill, Channel Catfish, Common Carp; "smallmouth-strong with a walleye run." Confidence medium (aggregator).
- Chattanooga Times Free Press, Mar 27, 2011 (search-surfaced snippet, page not opened): "North Chickamauga Creek: Hamilton County's streams are stocked with rainbow trout in early spring … most stocked trout are fished out by summer." Corroborates the early-spring pattern for 2011. Confidence medium (snippet).
- TWRA Trout Fishing Forecasts storymap (`completion/storymap_data.json`, fetched 2026-09-25): **no forecast entry for North Chickamauga Creek itself**; its Big Soddy Creek entry cites the "USGS flow gauge on North Chickamauga Creek near Big Soddy Creek" (03566535) only as a flow reference — do not cite it as N-Chick trout documentation.
- NAS (Hamilton Co., queried 2026-09-25): no salmonid records; only reservoir warmwater/pelagic records — unproductive for this creek.
- "South Chickamauga Creek" (separate water, GA/TN line; own ledger row exists) — excluded from all counts.

## Months-by-year stocking table (trout leg)
| Year | Months with rows | Notes |
|---|---|---|
| 2003 | Mar, Apr, May | Hamilton |
| 2010–2013 | Mar, Apr, May | county-column errors (Polk/Monroe/Marion) |
| 2014–2017 | not retrievable | dead captures; Wayback offline 2026-09-25 |
| 2018–2020 | Mar, Apr, May | |
| 2021–2022 | Mar, Apr, May, Oct | fall row appears |
| 2023–2025 | Feb, Mar, Apr, Oct | spring start moves to late Feb |
| 2026 | Feb, Mar, Apr, Nov | fall row moves to Nov 1 |

Never rowed: Jun–Sep, Dec, Jan — in any retrieved year. Months supported overall: **Feb (2023–2026), Mar, Apr, May, Oct (2021–2025), Nov (2026)**.

## Contradictions and gaps
- Fall stocking exists (Oct 2021–2025, Nov 2026) but the ArcGIS program label says only "Spring" — metadata lag, not a contradiction of the schedule record.
- Conservancy advice window "November to May" is broader than any rowed schedule (no Nov/Dec/Jan rows 2018–2025; 2026 has Nov 1). Treat the Conservancy window as fishery advice, not stocking months.
- Completed-feed execution rows: none cleanly retrieved for any year (windows checked never cover Feb–May or Oct); the jumbled wordcloud fragment and Feb 6, 2026 iNat photos are leads only.
- 2014–2017 schedules unretrievable this pass (prior pass concurs): 4-year visibility gap inside a 22-year record; given 2003–2013 and 2018–2026 are uniform, a hidden Dec–Jan program in 2014–17 is unlikely but unverified.
- The "redhorse fishery" component of the ledger's warmwater claim: unsupported. No Moxostoma record (iNat both windows, NAS Hamilton), no redhorse mention on the park page, Conservancy page, PiscaMaps list, or the forum thread. The documented sucker-family record is northern hogsucker (single iNat catch).
- 2003–2013 grids lack the late-Feb tail seen 2023–2026 — minor pattern shift, documented above.

## Searches run (North Chickamauga Creek)
1. WebSearch: "North Chickamauga" trout stocking TWRA Soddy-Daisy — partial (Fishbrain/Bass Bay marina pointers only).
2. WebSearch: North Chickamauga Creek Gorge State Park fishing smallmouth bass redhorse — productive (park fishing page, Conservancy trout page, forum thread, PiscaMaps).
3. WebSearch: "North Chickamauga Creek" redhorse OR smallmouth TWRA sampling report — no direct TWRA report found (unproductive for Region 3 sampling doc).
4. WebSearch: "North Chickamauga" creek "redhorse" fishing — no redhorse evidence (unproductive; ledger redhorse claim downgraded).
5. WebSearch: "North Chickamauga Creek Conservancy" stock trout rainbow news 2025 — no 2025 news item; surfaced TFP 2011 "stocked in early spring" snippet.
6. WebFetch: northchick.org homepage — no fishing/stocking content (negative result, recorded).
7. WebFetch: northchick.org/events — no fishing events (negative result).
8. WebFetch/open: northchick.org/adventure/trout-fishing — productive (S5).
9. Fetch: tnstateparks.com fishing page (direct curl; WebFetch 403'd) — productive (S6).
10. Fetch: chattanoogafishingforum.com thread — productive (S7).
11. Fetch: piscamaps.com creek page — productive (S9).
12. iNaturalist API: 8 km fish query — productive (S8).
13. iNaturalist API: 4 km fish query (Thrasher Pike) — productive (S8).
14. iNaturalist API: Moxostoma/Catostomidae check — none found (unproductive for redhorse).
15. NAS API Hamilton Co. — no salmonid/creek records (unproductive).
16. GBIF/iNat key resolution queries — iNat taxon 47178 located; GBIF match API failed (unproductive).
17. Local-corpus greps: "Chickamauga" across archived schedule texts 2003–2025, completed feeds, storymap, live page (multiple operations).
18. Wayback attempts for sched14–17 + CDX check — offline (unproductive; gap documented).

## Recommendation (per water)
- **Trout months: [2, 3, 4, 5] with a fall row — pin [10] for 2021–2025 and note [11] for 2026** (schedule-level: Feb 2023–2026 start, Mar–May core, Oct/Nov fall). Never Dec–Jan.
- **Warmwater claim strength: strong** — but phrase it as the documented fishery (smallmouth bass, redeye/rock bass, sunfish; largemouth and bream in the lower reaches; "smallmouth-strong with a walleye run" per aggregator data attributed to TWRA). **Drop "redhorse"** from the claim unless a future TWRA sample is produced.
- **Mixed verdict: SURVIVES.** Both legs are evidenced at the named creek by agency sources (TWRA schedules 22 years; Tennessee State Parks page; Conservancy page) and independent records (iNat, forum, 2011 TFP). This is the cleanest `mixed` in the ledger; pin the trout months and qualify the warmwater species list.
