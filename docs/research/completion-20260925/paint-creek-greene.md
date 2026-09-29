# Paint Creek — Greene County, TN (Cherokee NF → Nolichucky River near Greystone)

Research date: 2026-09-25 (live retrievals dated 2026-09-25; Wayback captures dated individually).
Ledger verdict under test: `year-round-trout`, YR flag, NO months — SUSPECT. Known prior: 2024 archive shows "Paint Creek 06/03/2024" (JUNE completion, outside any winter window).

## Identity / coordinates
- Paint Creek rises in Cherokee NF (Greene Co.), runs NE past Paint Creek Campground (USFS, ~35.975, -82.845; **campground closed for 2026 season — road damage, per USFS page**) to the Nolichucky River near Greystone. TWRA splits it: **Wild Trout Water** upstream of the USFS campground (campground upstream to USFS boundary south of Hwy 70 near Munday Gap) and **Delayed Harvest water** from the campground downstream to the mouth.
- TWRA GIS stocking sites (TWRA_Trout_Stocking_Locations feature layer; local dump arcgis_all.json): 25 sites S1–S25 along the USFS corridor, StreamName "Paint Creek", County GREENE, Region 4, StockingProgram "Spring", Species rainbow, Management USFS. Coords span 35.9527/-82.8917 ("Last Bridge" S1) to 35.9782/-82.8425 ("Above USFS Campground" S25). Example: S1 = 35.95267, -82.89168.
- No year-round flag support found; DH reach carries Oct 1–Feb 28 catch-and-release regs.

## Regulatory frame (TWRA trout regulations page, tn.gov, fetched 2026-09-25)
- "Paint Creek: Paint Creek Campground downstream to the mouth at the French Broad River [sic — Nolichucky/French Broad system]. Catch-and-release season is **Oct. 1 – Feb. 28**"; artificial lures only during C&R.
- Wild Trout Streams list: "Paint Creek (USFS campground upstream to USFS boundary south of Hwy. 70 near Munday Gap, Greene Co.)" — 5/day creel, single-hook artificials.
- URL: https://www.tn.gov/twra/fishing-regs/trout-regulations.html

## Month-by-month planned stocking (TWRA schedule grids; "week of" Sundays, event within 5 days after)
All rows = planned evidence. Extraction method: positioned-text (PyMuPDF) decode of X/● marks against date columns; ±1-column ambiguity flagged where it occurs (edge "31/30" columns).

| Year | Source (all local archival copies unless noted) | Planned stockings | Months |
|---|---|---|---|
| 2003 | sched03.pdf (Wayback capture 2010052905...) | Feb 16, Mar 2, Mar 16, (Mar 30), Apr 13, (Apr 27), May 11, (May 25), Jun 8, Jun 22, **Sep 28** — biweekly Feb–Jun + one September mark | 2,3,4,5,6,9 |
| 2004 | sched04.pdf | Feb 15, Feb 29, Mar 14, Mar 28, Apr 11, Apr 25, May 9, May 23, Jun 6, Jun 20, **Sep 26** | 2,3,4,5,6,9 |
| 2005 | sched05.pdf | 11 marks: biweekly mid-Feb–Jun + **Sep 25** | 2,3,4,5,6,9 |
| 2006 | sched06.pdf | 11 marks: biweekly late Feb–Jun + **Sep 24** | 2,3,4,5,6,9 |
| 2007 | sched07.pdf | ~20 marks: near-weekly Feb–Jun(+Jul 1?) + **Sep 23** | 2,3,4,5,6,(7),9 |
| 2008 | sched08.pdf | biweekly Feb 24–Jun + **Sep 21** (+Jul 29 mark, ±1 col) | 2,3,4,5,6,9 |
| 2009 | sched09.pdf | Mar 8–Jun biweekly (10) + **Sep 27** (+Jul 28, ±1 col) | 3,4,5,6,9 |
| 2010 | sched10.pdf | Mar 7, Mar 21, Apr 4, Apr 18, May 2, May 16, May 30, Jun 13, Jun 27 | 3,4,5,6 |
| 2011 | sched11.pdf | Mar 6 … Jun 26 (9, biweekly) | 3,4,5,6 |
| 2012 | sched12.pdf | Mar 4 … Jun 17/24 (9, biweekly) | 3,4,5,6 |
| 2013 | wb/sched13.pdf (Wayback 20130110160747; fetched 2026-09-25) | Feb 24, Mar 10, Mar 24, Apr 7, Apr 21, May 5, May 19, Jun 2, Jun 16 (Sunday-validity check 9/9) | 2,3,4,5,6 |
| 2014 | sched14.pdf | Mar 9 … Jun 29 (9) | 3,4,5,6 |
| 2015 | sched15.pdf | Mar 8 … Jun 28 (9) | 3,4,5,6 |
| 2016–2017 | NOT FOUND in Wayback probes (2016/2017 schedule URLs; CDX hit IA outage) | — | gap |
| 2018 | wb/sched18.pdf = 2018-Trout-Stocking-Schedule.pdf (Wayback 20180717180317; fetched 2026-09-25) | Mar 11, Mar 25, Apr 8, Apr 22, May 6, May 20, Jun 3, Jun 17, Jul 1, **Sep 30** (10 marks) | 3,4,5,6,7,9 |
| 2019-20 | complete_2019-20.pdf | Mar 8 … Jun 28 (9, biweekly) + row flagged "DH" | 3,4,5,6 |
| 2020 | complete_2020.pdf (**byte-identical to 2019-20**, md5 d8beba5575041fd222125779f063a5c5 — replay) | same | 3,4,5,6 |
| 2021 | complete_2021a/b (distinct bytes: 0e5c34…, 41e350…) | Mar 14 … Jul 4 (9) | 3,4,5,6,7 |
| 2022 | complete_2022a/b (6228d3…, 9c75ad…) | Mar 13 … Jul 3 (9) | 3,4,5,6,7 |
| 2023 | complete_2023a.pdf (3a748e…) | Mar 12 … Jul 2 (9) | 3,4,5,6,7 |
| 2024 | complete_2024a/b (c3cfa0…, 852e31…) | Mar 10 … Jun 30 (9) | 3,4,5,6 |
| 2025 | complete_2025a–d (4 distinct md5s — 321048…, fecd88…, 9d346c…, 8b67aa…; identical content = re-publication, not replay) | Mar 9 … Jun 29 (9) | 3,4,5,6 |
| 2026 | LIVE tn.gov JSON (retrieved 2026-09-25; archived twin of 2024-06-07 capture also held) | TYPE "Seasonal": Mar 8, Mar 22, Apr 5, Apr 19, May 3, May 17, May 31, Jun 14, Jun 28; TYPE "Delayed Harvest": **week of Oct 4, 2026**; Species Rainbow Trout | 3,4,5,6,10 |

## Completed (destination-level) rows
- Coldwater Trout Stocking Schedule (TWRA quarterly PDF/feeds): Paint Creek **05/10/2022** (cw_2022may); **04/24/2023** (cw_2023may); **10/23/2023** (cw_2023nov — fall DH); **05/06/2024** (cw_2024may).
- Committed/datatable feed (committed2024.json; archived datatable JSON 2024-06-07, wb/sched2024.json): "Region 4, Destination Paint Creek, Stocking Date **06/03/2024**" — last spring-season event, consistent with the Mar–Jun grid; NOT a winter/YR datapoint.
- TWRA social (fall 2023, via news summary): DH stocking of Paint Creek "to take place as scheduled" while other Greene-area fall stockings were postponed for low water.
- No completed row anywhere in Nov–Feb in 2003–2026.

## Wild-trout context (upstream)
- TWRA-designated Wild Trout Stream above the campground (see regs quote above) — agency-documented wild/reproducing component exists, but only on the upstream reach, distinct from the stocked reach below the campground.

## Interpretation / verdict
- The stocked (DH) reach receives ~9–11 planned events/yr: biweekly March–June (some years into July; 2003–2009 era also Feb and a September event; 2018 had Sep 30; 2023 completed Oct 23; 2026 plans Oct 4 as the DH opener).
- **No stocking November–February in any planned or completed record 2003–2026.** Winter trout schedules (2017-18, 2019-20, 2024-25) do not list Paint Creek.
- DH regs (Oct 1–Feb 28 C&R) mean trout are *present and legal to fish* through winter from the single October stocking, but the standard for year-round requires continuous stocking OR agency-documented holdover/reproduction on the stocked reach. Stocking is not continuous; holdover is plausible but NOT agency-documented; documented natural reproduction is upstream (wild-trout reach), not the stocked reach.
- **Verdict: seasonal-stocked-trout. Months [3,4,5,6] core, plus fall DH month [10] in 2023/2026 (Sep in 2003–2009, 2018 grids). YR flag FAILS. NO months removed.** Confidence: HIGH for month sets; the only soft spot is whether the Oct DH stocking recurred annually 2019–2022 (not evidenced; grids show no Oct marks those years — 2018 has Sep 30, 2026 has Oct 4, 2023 completed Oct 23).

## Contradictions
- Ledger `year-round-trout`/YR contradicted by 24 years of schedule grids + all completed feeds (stocking stops after June/July except one fall DH event; nothing Nov–Feb).
- The "06/03/2024" June completion is fully explained as the final spring event — it was misread as evidence of out-of-window stocking.

## Gaps
- 2016–2017 schedule documents not located (Wayback probes returned nothing/IA outage). No reason to expect a different pattern (2015 and 2018 bracket them).
- 2025–2026 completed (destination-level) rows for Paint Creek not present in local captures (quarterly Coldwater reports end Aug 2024 locally).

## Searches run (≥8)
1. WebSearch "Paint Creek Greene County Tennessee trout stocking TWRA"
2. WebSearch Paint Creek Tennessee Cherokee National Forest wild trout headwaters campground Nolichucky (surfaced USFS 2026 campground closure)
3. WebSearch TWRA "delayed harvest" trout waters October through February artificial lures (Oct 1–Mar 14 decal era; current regs page says Oct 1–Feb 28)
4. WebSearch "Paint Creek" Greeneville trout stocking October delayed harvest 2023 2024 news
5. WebSearch Paint Creek Tennessee delayed harvest trout stocking TWRA (TWRA early-October DH stocking video; fall-2023 "as scheduled" notice)
6. WebFetch https://www.tn.gov/twra/fishing-regs/trout-regulations.html (DH + wild-trout listings)
7. WebFetch LIVE 2026 stocking JSON https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json (retrieved 2026-09-25; matches local sched2026.json)
8. Wayback CDX queries + fetches: sched13.pdf (20130110160747), 2018-Trout-Stocking-Schedule.pdf (20180717180317), winter schedules (20180712194049, 20191026121825, 20241120115437), datatable JSON (20240607134309); md5 replay audit of complete_2019-20…2025d.
Plus: positioned-text extraction of 14 schedule PDFs (sched03–15, sched18, complete 2019–2025).

## Recommendation
- Change verdict to `seasonal-stocked-trout`, months **[3,4,5,6] + [10] (fall DH event, 2023/2026 evidenced)**; drop YR flag. Retain wild-trout annotation for the upstream reach.
