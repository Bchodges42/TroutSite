# CALFKILLER RIVER (White/Putnam counties; Sparta) — seasonal-stocked trout water evidence log

Ledger entry: verdict "seasonal-stocked", months not pinned. 2024 archive row "Calfkiller River 05/21/2024" (May).
All retrievals below: 2026-09-25 (America/Chicago). Research-only pass; local caches re-decoded, live web sources opened where cited.

## A. Verdict summary (recommendation)

- **Classification: Seasonal-stocked (TWRA Region 3 "Spring" stocking program). Confidence: HIGH.**
- **Recommended months: MARCH, APRIL, MAY** (three planned "week of" stockings per year, one per month in most years).
  - March: supported in **every** evidenced year 2003–2026 (23/23 annual grids + 2026 JSON).
  - April: supported in every evidenced year **2003–2025** (22/22 grids); **not** in the 2026 live schedule (both 2026 weeks fall in March).
  - May: supported in 2003, 2004, 2005, and 2010–2025 (19 years); in 2006–2009 the third event fell in the last week of April; in 2026 no third event is listed.
  - If a conservative month set is required: **March–May**, noting late-April third events in 2006–2009 and the reduced 2026 slate (March only).
- **Species: Rainbow Trout** (2026 schedule JSON SPECIES field; GIS layer "rainbow"; consistent across all sources found).
- **Completed feeds:** every destination-level completed date on record falls between 04/12 and 05/21 (2022–2024). No winter/summer/fall completed record for this water exists in any cached quarterly file or feed.
- **Holdover:** NO agency statement found (see section H). The "spring-fed constancy" reputation is corroborated descriptively (spring-influenced freestone), but no TWRA document claims carry-over; an angler guide explicitly says the fishery thins as water warms and is "not a wild-trout restoration." Treat holdover as UNVERIFIED anecdote.

## B. Current (2026) schedule — planned evidence

### B1. TWRA 2026 Trout Stocking Schedule datatable JSON (live; 616 rows)
- Title/author/org: "2026 Trout Stocking Schedule" datatable, Tennessee Wildlife Resources Agency (tn.gov CMS).
- Publication date: current 2026 season posting (live at retrieval). Observation dates: STOCKING WEEK values are "week of" Sundays; event occurs within five days after (per page preamble).
- Retrieval date: 2026-09-25 (this pass, via r.jina.ai proxy because tn.gov resets direct curl); prior direct capture 2026-09-24 in `trout_2026_live.json` (616 rows, identical rows for this water).
- Direct URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json
- Fields: REGION=3; COUNTY=**Putnam**; LOCATION=Calfkiller River; TYPE=Seasonal; STOCKING DAY=(empty); STOCKING WEEK=3/22/2026 and 3/29/2026; STOCKING MONTHS=(empty); SPECIES=Rainbow Trout.
- Establishes: 2026 planned weeks = week of **Sun 3/22/2026** and week of **Sun 3/29/2026** → both March; species rainbow. TWO events only (reduced vs. the historic three).
- Contradiction: county labeled **Putnam** while the TWRA GIS stocking site (D2) is in **White** County (upper river near the White/Putnam line) — TWRA's own datasets disagree; the schedule has used "Putnam" at least since 2003.
- Secondary echo: doubledfly.com (H2) states the "2026 schedule lists March 22 and April 19" for the Calfkiller — neither matches the live JSON's 3/29 (revision or transcription error; the live JSON is authoritative and was double-verified).

## C. Historical week-grid schedules, 2003–2015 (planned evidence; "week of" Sundays)

All are "TWRA TENTATIVE TROUT STOCKING SCHEDULE" PDFs, org TWRA, published each Jan–Mar; retrieved in prior passes into `tmp/research/data/schedpdf/sched03–15.pdf` (sched13 in `tmp/research/completion/scheds/`); Wayback originals e.g. https://web.archive.org/web/20030404161556/http://www.state.tn.us/twra/fish/StreamRiver/stockedtrout/sched03.pdf (CDX path: state.tn.us/twra/fish/StreamRiver/stockedtrout/schedNN.pdf, captures 2003-04-04 through 2015-03-19 per `_work/cdx_twra0315.txt`).
Re-decoded 2026-09-25 by PyMuPDF word-coordinate extraction (rotation-corrected) mapping each X mark to the nearest day-number column, with month boundaries from monotonic week sequence; method validated by cell-boundary vector-line containment check (2006) and by rendered-image reading (2003).

Row: COUNTY "Putnam" (2003–2013 grids; visually confirmed "Putnam Calfkiller River"), STREAM "Calfkiller River". 3 planned weeks/year:

| Year | Week 1 | Week 2 | Week 3 | Months established |
|---|---|---|---|---|
| 2003 | Mar 16 | Apr 6 | May 4 | Mar, Apr, May |
| 2004 | Mar 14 | Apr 4 | May 2 | Mar, Apr, May |
| 2005 | Mar 13 | Apr 3 | May 1 | Mar, Apr, May |
| 2006 | Mar 12 | Apr 2 | Apr 30 | Mar, Apr |
| 2007 | Mar 11 | Apr 1 | Apr 29 | Mar, Apr |
| 2008 | Mar 9 | Mar 30 | Apr 27 | Mar, Apr |
| 2009 | Mar 8 | Mar 29 | Apr 26 | Mar, Apr |
| 2010 | Mar 28 | Apr 25 | May 23 | Mar, Apr, May |
| 2011 | Mar 27 | Apr 24 | May 22 | Mar, Apr, May |
| 2012 | Mar 25 | Apr 22 | May 20 | Mar, Apr, May |
| 2013 | Mar 24 | Apr 21 | May 19 | Mar, Apr, May |
| 2014 | Mar 23 | Apr 20 | May 18 | Mar, Apr, May |
| 2015 | Mar 22 | Apr 19 | May 17 | Mar, Apr, May |

## D. 2016–2017: NOT LOCATED (documented gap)

- sched16.pdf / sched17.pdf not captured by Wayback under the state.tn.us stockedtrout path (CDX prefix query returned EMPTY; local `completion/scheds/sched16.pdf`/`sched17.pdf` are Wayback HTML error pages, not PDFs).
- No sched16/17 under tn.gov/assets (CDX: only sched15.pdf captured 2015-07-13).
- The tn.gov article "stocked-trout" (Wayback capture 2016-01-08) still linked the 2015 PDFs and states generically: "Each year 80 streams and small lakes are stocked" with ~325,000 trout "between February and October" — corroborates a spring-heavy seasonal program but not month-specific for this water.
- Gap is bounded: 2015 grid (Mar 22 / Apr 19 / May 17) and 2018 capture (Mar 25 / Apr 22 / May 20) are identical in pattern.

## E. 2018–2025 "Trout Stocking (YEAR)" schedule captures (planned evidence)

Org TWRA (PDF author metadata: Brandon Simcox, TWRA; Excel-produced). Cached 2018–2025 in `tmp/research/data/complete/complete_*.pdf` and `tmp/research/completion/scheds/ts2018/2019.pdf`; page title pattern "Trout Stocking (YEAR)". Page preamble: "The dates listed are all Sundays. The stocking event will happen within five days after the date listed." Re-decoded 2026-09-25 by the same coordinate method ('●' marks mapped onto day columns; month sequence from monotonic week dates).

- 2018 (PDF created 2018-03-05): **Mar 25, Apr 22, May 20**
- 2019: **Mar 24, Apr 21, May 19**
- 2020 (complete_2019-20 and complete_2020 — identical files, md5 d8beba5575041fd222125779f063a5c5, replay duplicate): **Mar 22, Apr 19, May 17**
- 2021 (complete_2021a created 2020-10-19, mod 2020-12-22; complete_2021b): **Mar 28, Apr 25, May 23**
- 2022 (complete_2022a/b): **Mar 27, Apr 24, May 22**
- 2023 (complete_2023a): **Mar 26, Apr 23, May 21**
- 2024 (complete_2024a/b): **Mar 24, Apr 21, May 19**
- 2025 (complete_2025a/b/c/d; c created 2025-03-31; grids run Jan–Dec): **Mar 23, Apr 20, May 18**
- Direct URL pattern (Wayback/live): tn.gov/twra "Trout Stocking" page (current page: https://www.tn.gov/twra/fishing/trout-information-stockings); PDFs link per-water to the TWRA ArcGIS viewer https://twra.maps.arcgis.com/apps/webappviewer/index.html?id=99260b5ae08f4eb386946f08e1f18d3f
- Months established per year: **March + April + May, 2018–2025** (8/8 years).

## F. Completed (destination-level) evidence

1. **Coldwater Trout Stocking Schedule quarterly PDFs** (org TWRA; cached `tmp/research/data/cw/cw_*.txt`):
   - cw_2022may, "Updated: 5/17/2022": Calfkiller River **04/28/2022** (within planned week of 4/24/2022 +5 days window… actual planned week Apr 24, event 4/28 ✓).
   - cw_2023may, "updated as of 5/3/2023": Calfkiller River **04/26/2023** (planned week Apr 23 ✓).
   - cw_2024may, "updated as of May 17, 2024": Calfkiller River **04/25/2024** (planned week Apr 21 ✓).
   - Winter (Feb), summer (Aug), and fall (Nov) quarterly files for 2022, 2023, 2024 list **no Calfkiller row at all** — no stocking of this water outside the spring cycle is documented.
2. **Completed-feed datatable archives** (tn.gov datatable `tn_complex_datatable.exceldriven.json`, fields Region/Destination/"Stocking Date"):
   - Archive captured 2024-06-07 (`completed_20240607b.json`, 54 destinations = full spring cycle): Region 3, Calfkiller River, **05/21/2024** (the ledger's 2024 archive row; last executed 2024 event, within planned week of May 19 ✓).
   - Live feed retrieved 2026-09-25 (r.jina.ai) and 2026-09-24 cache: **no Calfkiller row** — the feed is a rolling recent-events window (currently 10 tailwater/pond rows); absence in September is consistent with a spring-only program, and proves nothing about spring execution.
- Establishes (destination-level completion): 2022, 2023, 2024 spring stockings executed, with **two** executed 2024 events on record (04/25 and 05/21). No completed record for any non-spring month, any year.

## G. Reach / stocking site (GIS)

- **TWRA ArcGIS "Trout Stocking Locations" feature layer** (730 features; cached `tmp/research/raw/arcgis_troutloc.json`; same layer mirrored in `_work/clinch_stock_locs_all.json`; public viewer id=99260b5ae08f4eb386946f08e1f18d3f; geodata.tn.gov lists the TWRA trout stocking map, updated 9/23/2026):
  - OBJECTID 567 — Site_Name "S2", StreamName "Calfkiller River", Region 3, **County WHITE**, City Sparta, StockingProgram "**Spring**", WaterClass stream, Species "**rainbow**", Management "Private Land", HoursOpen "Contact Region 3".
  - Coordinates: **36.0315, −85.3358** (upper Calfkiller near the White/Putnam line, upstream/northeast of Sparta).
- Establishes: one named stocking site on the upper river; program = Spring; access private (contact Region 3). The upper-river site corroborates the schedule's "Putnam" county label (upper river lies toward Putnam) while the GIS places the point in WHITE — the two TWRA sources disagree on the county label only.

## H. Holdover / spring-fed character — what exists and what does not

- **No TWRA/agency statement located** claiming trout hold over in the Calfkiller (searched: cached TWRA coldwater reports 2015–2017, Trout Management Plan 2017–2027, 2024 stocking report — zero mentions of the river; web searches for creel/coldwater/holdover — nothing agency-authored).
- Regulation-level agency mentions only: TWRA "Statewide Fishing Regulation Exceptions" lists Calfkiller River among tributaries above Center Hill Dam; 2024 regs summary notes the river is closed to fishing/seining upstream from the mill dam (Sparta). These establish it as managed water, not holdover.
- **Double D Fly Co. river guide** (doubledfly.com/freestones/calfkiller-river, author Harlan Beckett, post dated Aug 6, © 2026; retrieved 2026-09-25): spring-influenced freestone ("no controlling dam anywhere on it"); stocked rainbows are a "seasonal put-and-take fishery"; fish "arrive with the stockings, fish well while the water is cool, and thin out as the river warms"; "TWRA's cool-season stocking of the upper river is a fishing-opportunity program… not a wild-trout restoration." Explicitly makes NO holdover/wild-trout claim.
- Citizen-science: GBIF (api.gbif.org q=calfkiller, retrieved 2026-09-25) — 20 records, **zero salmonids** (minnows/darters/mollusks/herps, 1966–1968 vouchers + mussels). iNaturalist (api.inaturalist.org q=calfkiller, retrieved 2026-09-25) — 38 observations, **zero trout**.
- USGS/NOAA gauge "CALFKILLER RIVER BELOW SPARTA TN" (CAFT1) exists for conditions (via search result, ready.noaa.gov listing).
- Bottom line: the "spring-fed constancy" reputation is descriptive (spring-influenced karst freestone) and plausible for some carry-over, but **no agency holdover statement exists** — do not assert holdover.

## I. Contradictions and traps encountered

1. County label "Putnam" (schedules 2003, 2018–2021, 2026 JSON) vs GIS site in WHITE County — TWRA-internal inconsistency; water is the same (upper Calfkiller). Ledger's "White County, Sparta" matches the GIS.
2. 2026 JSON reduces the slate to two March weeks (no April/May week) vs three weeks Mar/Apr/May in every other evidenced year 2010–2025.
3. doubledfly.com quotes 2026 weeks as "March 22 and April 19"; live JSON says 3/22 and 3/29 — JSON verified twice (direct 9/24 + jina 9/25), guide is the outlier.
4. 2024 shows two executed events (04/25 via cw_2024may; 05/21 via completed feed) — not a contradiction, but the completed feed alone (05/21) understates the season.
5. complete_2019-20.pdf ≡ complete_2020.pdf (md5 d8beba5575041fd222125779f063a5c5) — replay duplicate; count 2019-20/2020 evidence once.
6. tn.gov live page also server-renders the datatables into static HTML with absolutely-positioned cells: the text order is scrambled ("Collins River 4/2/2026 Rainbow, Brown Trout" fragments cannot be attributed to any row) — do NOT cite the static render for row-level claims; cite the JSONs.
7. pdftotext of the rotated 2003–2015 grids mis-assigns county labels across rows (e.g. "Polk Collins River"); only coordinate-level extraction is trustworthy.
8. The old sched grids' X marks sit in cells for "week of" — a mark is planned-week evidence, not an execution date.

## J. Searches run (attempted 2026-09-25; several queries hit provider rate limits and were re-run/rounded out)

1. WebSearch: "Calfkiller River Tennessee trout stocking TWRA schedule" — partial results (eregulations TWRA guide; Fishbrain water listing; TN SOS proclamation).
2. WebSearch: "Calfkiller River spring-fed trout fishery Sparta Tennessee" — rate-limited (no results).
3. WebSearch: "Calfkiller River trout" — rate-limited.
4. WebSearch: "Calfkiller River" trout holdover OR wild trout OR spring-fed — rate-limited.
5. WebSearch: "Calfkiller River Tennessee wild rainbow trout spring creek" — provider content-filter block.
6. WebSearch: "Calfkiller River Tennessee fly fishing wild rainbow trout" — results: LandAndFarm listing (6 mi Calfkiller frontage, fly-fishing destination); Central Highlands Angler blog.
7. WebSearch: site:tn.gov Calfkiller OR "Collins River" trout stocking — results: TDEC 305(b) Collins/Caney watershed docs; fish-tissue monitoring.
8. WebSearch: "Calfkiller" trout creel survey OR "coldwater report" OR "region 3" TWRA — results: TWRA Statewide Fishing Regulation Exceptions (Calfkiller above Center Hill Dam; mill-dam closure); TNC bluemask darter restoration in Calfkiller.
9. WebSearch: "Calfkiller River trout stocking Sparta White County 2025" — results: NOAA CAFT1 gauge "Calfkiller River below Sparta"; southeasternoutdoors page (Calfkiller, Putnam/White counties).
10. WebSearch: TWRA "2016 trout stocking schedule" OR "2017..." — results: TWRA newsroom 2006 winter-trout release; geodata.tn.gov trout stocking map (updated 9/23/2026).
11. WebSearch: "Collins River" OR "Calfkiller River" trout holdover/harsh variants — rate-limited; only an unrelated Beaverdam Creek holdover blog surfaced (different water).
12. Bing fetch (search scraping): Calfkiller query — bot wall (unusable results).
13. DuckDuckGo HTML fetch: Calfkiller query — CAPTCHA wall.
14. GBIF API occurrence search q=calfkiller — 20 records, no salmonids.
15. iNaturalist API q=calfkiller — 38 observations, no trout.
16. Wayback CDX: state.tn.us .../sched16.pdf — EMPTY; tn.gov/assets .../sched.* — only sched15; tn.gov/twra/article/stocked-trout capture list (ends Jan 2016) + capture fetch.
17. r.jina.ai fetch of live 2026 schedule JSON and live completed-feed JSON (both parsed above).

## K. Recommendation

Classify **seasonal-stocked**, months **March–May** (rainbow trout). Date-confidence: March and May strongest (March 23/23 years; May 19/23 evidenced years), April strongly supported 2003–2025 but absent from the 2026 JSON. Do not mark the water for October–February. Completed-feed proof points: 2022-04-28, 2023-04-26, 2024-04-25, 2024-05-21 (all spring). Holdover: only anecdotal; no agency statement — annotate as "spring-influenced stream; put-and-take; no agency holdover documentation."
