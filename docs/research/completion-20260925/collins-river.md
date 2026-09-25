# COLLINS RIVER (Warren/Grundy counties; McMinnville) — seasonal-stocked trout water evidence log

Ledger entry: verdict "seasonal-stocked", months not pinned. 2024 archive row "Collins River 05/15/2024" (May).
All retrievals below: 2026-09-25 (America/Chicago). Research-only pass; local caches re-decoded, live web sources opened where cited.

## A. Verdict summary (recommendation)

- **Classification: Seasonal-stocked (TWRA Region 3 "Spring" stocking program). Confidence: HIGH.**
- **Recommended months: MARCH, APRIL, MAY** (three planned "week of" stockings per year).
  - March: supported in **every** evidenced year 2003–2026 (23/23 grids + 2026 JSON).
  - April: supported in every evidenced year **2003–2025** (22/22); **not** in the 2026 live schedule (weeks jump from 3/22 to 5/10).
  - May: supported in 2010–2026 (17 years); in 2003–2007 the third event fell in the last week of April; in 2008–2009 the second fell in late March and the third in mid-April (no May event).
- **Species: Rainbow Trout** (2026 JSON SPECIES; GIS "rainbow"; NAS history consistent). The scrambled static render of the live page shows an unattributable "Rainbow, Brown Trout" species cell near the Collins row — do not treat as evidence (see I.6).
- **Completed feeds:** completed dates on record are 04/12/2023 and 05/15/2024 (plus the 2024 feed's 05/15 as the last executed 2024 event). No completed record in any non-spring month, any year.
- **Holdover:** no agency statement found; the guide literature describes the fishery as "fresh stocked rainbows… best… behind the stockings," i.e., put-and-take. Treat any carry-over as UNVERIFIED.

## B. Current (2026) schedule — planned evidence

### B1. TWRA 2026 Trout Stocking Schedule datatable JSON (live; 616 rows)
- Title/author/org: "2026 Trout Stocking Schedule" datatable, TWRA (tn.gov CMS).
- Retrieval date: 2026-09-25 (r.jina.ai proxy; tn.gov resets direct curl) and prior direct capture 2026-09-24 (`trout_2026_live.json`, 616 rows — identical rows).
- Direct URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json
- Fields: REGION=3; COUNTY=**Grundy**; LOCATION=Collins River; TYPE=Seasonal; STOCKING DAY=(empty); STOCKING WEEK=**3/1/2026, 3/22/2026, 5/10/2026**; STOCKING MONTHS=(empty); SPECIES=Rainbow Trout.
- Establishes: 2026 planned weeks = weeks of Sun 3/1, Sun 3/22 (both March) and Sun 5/10 (May). April is skipped in 2026 (third event moved to early May relative to 2025's Mar/Apr/May pattern).
- Corroboration: mywaterlevel.com aggregation of the 2026 TWRA schedule ("140 waters across 71 counties", July–August window description) surfaced via search; underlying data is the same JSON.

## C. Historical week-grid schedules, 2003–2015 (planned evidence; "week of" Sundays)

"TWRA TENTATIVE TROUT STOCKING SCHEDULE" PDFs, org TWRA, published each Jan–Mar; cached `tmp/research/data/schedpdf/sched03–15.pdf` (sched13 in `tmp/research/completion/scheds/`); Wayback originals e.g. https://web.archive.org/web/20030404161556/http://www.state.tn.us/twra/fish/StreamRiver/stockedtrout/sched03.pdf (CDX captures 2003-04-04 → 2015-03-19, `_work/cdx_twra0315.txt`).
Re-decoded 2026-09-25 by rotation-corrected PyMuPDF coordinate extraction (X marks → nearest day column; month from monotonic week sequence; method validated by vector-cell containment (2006) and rendered-image reading (2003, 2006, 2008)).

Row: COUNTY "Grundy" (visually confirmed "Grundy Collins River"), STREAM "Collins River". 3 planned weeks/year:

| Year | Week 1 | Week 2 | Week 3 | Months established |
|---|---|---|---|---|
| 2003 | Mar 9 | Apr 6 | Apr 27 | Mar, Apr |
| 2004 | Mar 7 | Apr 4 | Apr 25 | Mar, Apr |
| 2005 | Mar 6 | Apr 3 | Apr 24 | Mar, Apr |
| 2006 | Mar 5 | Apr 2 | Apr 23 | Mar, Apr |
| 2007 | Mar 4 | Apr 1 | Apr 22 | Mar, Apr |
| 2008 | Mar 2 | Mar 30 | Apr 20 | Mar, Apr |
| 2009 | Mar 1 | Mar 29 | Apr 19 | Mar, Apr |
| 2010 | Mar 7 | Apr 11 | May 16 | Mar, Apr, May |
| 2011 | Mar 6 | Apr 10 | May 15 | Mar, Apr, May |
| 2012 | Mar 4 | Apr 8 | May 13 | Mar, Apr, May |
| 2013 | Mar 3 | Apr 7 | May 12 | Mar, Apr, May |
| 2014 | Mar 2 | Apr 6 | May 11 | Mar, Apr, May |
| 2015 | Mar 1 | Apr 5 | May 10 | Mar, Apr, May |

Note the county label column in these rotated grids mis-assigns across rows under pdftotext (e.g., "Marion/Overton/Polk Collins River" artifacts); the rendered page and coordinate extraction both show **Grundy**.

## D. 2016–2017: NOT LOCATED (documented gap)

- No sched16/sched17 captures: state.tn.us stockedtrout path CDX EMPTY; tn.gov/assets CDX has only sched15.pdf (2015-07-13); tn.gov/twra/article/stocked-trout captures end 2016-01-13, and the 2016-01-08 capture still linked the 2015 PDFs.
- Generic agency statement from that capture: ~80 streams and small lakes stocked with ~325,000 trout "between February and October" — program-level only.
- Gap bounded by 2015 (Mar 1 / Apr 5 / May 10) and 2018 (Mar 4 / Apr 8 / May 13) — identical Mar/Apr/May pattern.

## E. 2018–2025 "Trout Stocking (YEAR)" schedule captures (planned evidence)

Org TWRA (PDF metadata author: Brandon Simcox, TWRA). Cached `tmp/research/data/complete/complete_*.pdf`, `tmp/research/completion/scheds/ts2018/2019.pdf`. Preamble: dates are Sundays; event within five days after. Re-decoded 2026-09-25 (coordinate method, '●' marks).

- 2018 (PDF created 2018-03-05): **Mar 4, Apr 8, May 13**
- 2019: **Mar 3, Apr 7, May 12**
- 2020 (complete_2019-20 ≡ complete_2020, md5 d8beba5575041fd222125779f063a5c5 — replay duplicate): **Mar 1, Apr 5, May 10**
- 2021 (complete_2021a created 2020-10-19; complete_2021b): **Mar 7, Apr 11, May 16**
- 2022 (complete_2022a/b): **Mar 6, Apr 10, May 15**
- 2023 (complete_2023a): **Mar 5, Apr 9, May 14**
- 2024 (complete_2024a/b): **Mar 3, Apr 7, May 12**
- 2025 (complete_2025a/b/c/d; c/d created 2025-03-31; full-year Jan–Dec grid): **Mar 2, Apr 6, May 11**
- Months established per year: **March + April + May, 2018–2025** (8/8 years).
- Direct URL pattern: tn.gov TWRA "Trout Stocking" page (current: https://www.tn.gov/twra/fishing/trout-information-stockings); PDFs link per-water to https://twra.maps.arcgis.com/apps/webappviewer/index.html?id=99260b5ae08f4eb386946f08e1f18d3f

## F. Completed (destination-level) evidence

1. **Coldwater Trout Stocking Schedule quarterly PDFs** (org TWRA; cached `tmp/research/data/cw/cw_*.txt`):
   - cw_2023may, "updated as of 5/3/2023": Collins River **04/12/2023** (planned week Apr 9 ✓).
   - cw_2024may, "updated as of May 17, 2024": Collins River **05/15/2024** (planned week May 12 ✓).
   - cw_2022may ("Updated: 5/17/2022"): **no Collins row** — the quarterly list of executed/upcoming spring dates omits Collins (its late-April/May event post-dated the 5/17 update or was not yet logged); absence is a data gap, not evidence of no stocking.
   - Winter (Feb), summer (Aug), fall (Nov) quarterlies for 2022/2023/2024: **no Collins row in any** — no documented stocking outside spring.
2. **Completed-feed datatable archives** (tn.gov `tn_complex_datatable.exceldriven.json`, fields Region/Destination/"Stocking Date"):
   - Archive captured 2024-06-07 (`completed_20240607b.json`, 54 destinations): Region 3, Collins River, **05/15/2024** (the ledger's 2024 archive row; last executed 2024 event).
   - Live feed retrieved 2026-09-25 (r.jina.ai) and 2026-09-24 cache: **no Collins row** — rolling window (10 rows, currently tailwaters/reservoir events only); September absence is consistent with spring-only execution.
- Establishes (destination-level completion): 2023 and 2024 spring stockings executed. No completed record for any non-spring month.

## G. Reaches / stocking sites (GIS)

- **TWRA ArcGIS "Trout Stocking Locations" layer** (730 features; cached `tmp/research/raw/arcgis_troutloc.json`; mirrored `_work/clinch_stock_locs_all.json`; viewer id=99260b5ae08f4eb386946f08e1f18d3f):
  - OBJECTID 420 — "Hwy 56 Bridge Crossing (S2)", StreamName Collins River, Region 3, **County GRUNDY**, City Beersheba Springs, StockingProgram "**Spring**", WaterClass stream, Species "**rainbow**", Management "Private Land". Coordinates **35.51809, −85.67405**.
  - OBJECTID 566 — (unnamed site), Collins River, GRUNDY, Beersheba Springs, "Spring", "rainbow", Management TWRA, HoursOpen "Contact Region 3". Coordinates **35.52861, −85.69459**.
- Both sites are on the **upper Collins in Grundy County** (Beersheba Springs/Hwy 56 corridor), ~15 river-miles upstream of McMinnville — matching the schedule's "Grundy" county label and the guide literature ("modest, seasonal put-and-take fishery limited to the cool, spring-fed upper reach in Grundy County"). No Warren County site appears in the GIS layer, despite the ledger's "Warren/Grundy" reach note.
- 2025 schedule PDF (complete_2025d) carries per-water arcg.is short links adjacent to the Collins row (arcg.is/19anWj, 0brv4G, H5LvG, 1mDWGW + viewer-extent links) pointing to the same GIS system.

## H. Holdover / character — what exists and what does not

- **No TWRA/agency holdover statement located** for the Collins (cached TWRA coldwater reports 2015–2017, Trout Management Plan 2017–2027, 2024 stocking report: zero mentions; targeted web searches: nothing agency-authored).
- **Double D Fly Co. river guide** (https://doubledfly.com/freestones/collins-river, author Harlan Beckett, post dated Aug 6, © 2026; retrieved 2026-09-25): "A cool, spring-fed plateau freestone"; "There is no dam on the Collins to read; its flow is rain, snowmelt, and the cold seep of limestone springs" (~67 mi, Palmer/Savage Gulf → McMinnville → mouth at Rock Island/Great Falls Lake); trout fishing is "fresh stocked rainbows in cold, clear, small water, best in the cool months and behind the stockings" and "TWRA stocks rainbow trout seasonally" in the upper Grundy reach; **no holdover claim**; lower river is smallmouth/redeye/muskie water.
- Regulations context (search-surfaced TWRA "Statewide Fishing Regulation Exceptions"): Collins River named among tributaries above Center Hill Dam. Historical note: USGS NAS record — *Oncorhynchus mykiss*, Collins River, Grundy Co., **1939-11-08**, status "stocked", recordType "Literature" (`data/nas_rbow.json`) — trout presence documented since 1939, itself labeled stocked.
- Citizen-science: iNaturalist Oncorhynchus mykiss inside the Collins bbox (35.25–35.65, −85.95 to −85.35), retrieved 2026-09-25: 1 record, at Grundy Lake #4, Tracy City (2026-03-18) — a separate winter-stocked pond, **not** the river. GBIF "collins river" US query: no salmonid records in the watershed bbox.
- Bottom line: spring-fed upper river makes carry-over conceivable, but **no agency documentation**; guide language points to put-and-take "behind the stockings."

## I. Contradictions and traps encountered

1. Ledger reach "Warren/Grundy": schedules and 2026 JSON say **Grundy** (2003–2026, every source); GIS sites both in Grundy (Beersheba Springs). Warren County (McMinnville) is the downstream smallmouth/muskie water — no trout stocking site found there. Recommend labeling the stocked reach Grundy (upper Collins).
2. 2026 JSON skips April (weeks 3/1, 3/22, 5/10) vs Mar/Apr/May in all other evidenced years 2010–2025 and Mar/Apr(-only) 2003–2009.
3. Static server-render of the live tn.gov page interleaves two datatables with absolutely-positioned cells; the fragment "Collins River 4/2/2026 Rainbow, Brown Trout" cannot be attributed to Collins (the "4/2/2026" is not a Sunday week-of; 4/2/2026 is a Thursday; species cell likely belongs to Greasy Creek's row). Not evidence — cite the JSONs.
4. complete_2019-20.pdf ≡ complete_2020.pdf (md5 d8beba5575041fd222125779f063a5c5) — replay duplicate; count once.
5. cw_2022may (updated 5/17/2022) omits Collins entirely while listing 30+ other Region 3 waters — a quarterly-file gap; do not read as "no 2022 stocking."
6. pdftotext county-label drift on the rotated grids ("Marion Collins River" etc.) — only coordinate-level extraction is trustworthy.
7. 2016/2017 schedules not captured anywhere (Wayback paths exhausted) — gap, bounded by identical 2015/2018 patterns.

## J. Searches run (attempted 2026-09-25; several queries hit provider rate limits)

1. WebSearch: "Collins River" trout stocking TWRA schedule McMinnville Grundy — partial results (mywaterlevel.com 2026 aggregation; doubledfly Collins guide; e-regulations guide).
2. WebSearch: "Collins River" trout Beersheba Springs OR "Hwy 56" stocking rainbow — rate-limited; retry with variants returned onwaterapp.com Payne Branch page noting TWRA "regular stocking efforts throughout the spring season" on Collins; tennesseeflyfishers.org Caney Fork page (parent system stocking).
3. WebSearch: doubledfly.com Collins River guide locator — rate-limited (page then fetched directly).
4. WebSearch: "Collins River" OR "Calfkiller River" trout holdover variants — rate-limited; only an unrelated Beaverdam Creek holdover blog surfaced.
5. WebSearch: site:tn.gov Calfkiller OR "Collins River" trout stocking — TDEC 305(b) Collins River watershed (TN05130107) docs; fish-tissue monitoring (Collins RM 21.5).
6. WebSearch: TWRA 2016/2017 trout stocking schedule — TWRA newsroom 2006 winter-trout release; geodata.tn.gov trout map (updated 9/23/2026); no 2016/2017 schedule.
7. Direct fetches (WebFetch/curl): doubledfly.com/freestones/collins-river (captured, section H); mywaterlevel.com and eregulations trout-stocking URL guesses (404); Wayback 2016-01-08 stocked-trout page; Wayback CDX queries (sched16 path, tn.gov/assets sched.*, stocked-trout capture list).
8. r.jina.ai fetches: live 2026 schedule JSON; live completed-feed JSON (parsed above).
9. API queries: GBIF occurrence search "collins river" (US) — no salmonids in watershed; iNaturalist O. mykiss bbox query — 1 record at Grundy Lake #4 (not the river).
10. Local-corpus greps (research caches): TWRA coldwater reports 2015–2017, Trout Management Plan 2017–2027, 2024 stocking report, NAS dataset, e-regulations caches — zero Collins trout-program mentions outside the schedules/feeds/GIS already logged.

## K. Recommendation

Classify **seasonal-stocked**, months **March–May** (rainbow trout), stocked reach = upper Collins River in **Grundy County** (Beersheba Springs / Hwy 56 sites; 35.518,−85.674 and 35.529,−85.695). March 23/23 evidenced years; May 17/23; April 22/23 (absent only in the 2026 live slate). Completed-feed proof points: 2023-04-12, 2024-05-15. Do not mark the water for October–February. Holdover: put-and-take per guide literature; no agency holdover statement — annotate as "spring-fed upper river; put-and-take; no agency holdover documentation."
