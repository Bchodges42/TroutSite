# Laurel Fork (Carter County, TN) — Evidence Log

Retrieval date: 2026-09-25 (all retrievals this date unless noted). Research only; no contact with any agency/author.

## Identity disambiguation (critical)

Three Tennessee "Laurel Forks" were separated in this pass:

1. **Laurel Fork, Carter County (this water)** — tributary to the Doe/Watauga rivers near Hampton; Dennis Cove Recreation Area, AT crossing, Laurel Fork gorge/falls; stocking sites on USFS land (Watauga Ranger District, Cherokee NF). TWRA Region 4. All Region-4 schedule rows checked against the COUNTY column = "Carter".
2. Laurel Fork, Campbell County — separate seasonal Region 4 water (2026 schedule: only weeks of 3/1 and 3/29; 2025 Complete grid: Feb 23–Jun 1 + Oct 26). Never confused with Carter rows; county column always checked.
3. Laurel Fork, Fentress/Scott (Big South Fork tributary, Region 3/TDEC-designated) — different water, already covered elsewhere; never appears in Region 4 grids or the Region 4 coldwater reports used below.

## Sources

### S1. TWRA 2026 trout stocking schedule JSON (live, retrieved via page-data endpoint)
- Org: Tennessee Wildlife Resources Agency (tn.gov). Observation window: 2026 season. Retrieved 2026-09-25.
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json (616 rows; fields REGION, COUNTY, LOCATION, TYPE, STOCKING DAY, STOCKING WEEK, STOCKING MONTHS, SPECIES)
- Fields (Carter rows): `REGION 4, COUNTY Carter, LOCATION "Laurel Fork ", TYPE Seasonal, SPECIES Rainbow Trout`; STOCKING WEEK = 3/1, 3/15, 3/29, 4/12, 4/26, 5/10, 5/24, 6/7 (biweekly Mar–early Jun). STOCKING MONTHS empty.
- Establishes: 2026 planned stocking = March–June only. TYPE "Seasonal". Not year-round stocking.
- (Same file: Campbell Co. Laurel Fork rows 3/1 & 3/29 only — separate water; Doe River rows under Carter listed in doe-river.md.)

### S2. Archived TWRA schedule grids sched03–sched15 (state.tn.us, via Wayback Machine)
- Org: TWRA (published annually ~Feb of each year). Captures: 2003-04-04 (sched03), 2004-02-10 (sched04), 2005-11-24 (sched05), 2006-06-04 (sched06), 2007-02-27 (sched07), 2008-09-09 (sched08), 2009-04-18 (sched09), 2010-03-26 (sched10), 2011-01-11 (sched11), 2012-04-18 (sched12), 2013-01-10 (sched13), 2014-04-12 (sched14), 2015-03-19 (sched15). Retrieved 2026-09-25.
- URLs (pattern): http://web.archive.org/web/<ts>/http://www.state.tn.us/twra/fish/StreamRiver/stockedtrout/schedNN.pdf
- Method: PDFs parsed by word coordinates (pdfplumber); week-of-date columns Feb–Oct mapped to months; multi-X runs expanded. All rows taken from the COUNTY="Carter" line.
- **Months-by-year table — Carter County Laurel Fork (planned stocking weeks):**

| Year | Weeks X'd (week-of Sundays) | Months supported |
|---|---|---|
| 2003 (sched03) | Mar 23, Apr 2/9/16/23/30, May 6/13/20/27, Jun 4/11/18/25, Jul 1/8/15/22 (weekly, 18) | Mar–Jul |
| 2004 (sched04) | Mar 22/29, Apr 7/14/21/28, May 4/11/18/25, Jun 2/9/16/23/30, Jul 6/13/20 (weekly, 18) | Mar–Jul |
| 2005 (sched05) | Feb 20/27, Mar 6/13/20/27, Apr 3/10/17/24, May 1/8/15/22/29, Jun 5/12/19 (weekly, 18) | Feb–Jun |
| 2006 (sched06) | Mar 5/12/19/26, Apr 2/9/16/23/30, May 7/14/21/28, Jun 4/11/18/25, Jul 2 (weekly, 18) | Mar–Jul |
| 2007 (sched07) | Mar 4/11/18/25, Apr 1/8/15/22/29, May 6/13/20/27, Jun 3/10/17/24, Jul 1 (weekly, 18) | Mar–Jul |
| 2008 (sched08) | Mar 2/9/16/23/30, Apr 6/13/20/27, May 4/11/18/25, Jun 1/8/15/22/29 (weekly, 18) | Mar–Jun |
| 2009 (sched09) | Apr 1/15/29, May 12/26, Jun 10/24, Jul 7/21 (biweekly, 9) | Apr–Jul |
| 2010 (sched10) | Feb 28, Mar 14/28, Apr 11/25, May 9/23, Jun 6/20 (biweekly, 9) | Feb–Jun |
| 2011 (sched11) | Feb 27, Mar 13/27, Apr 10/24, May 8/22, Jun 5/19 (biweekly, 9) | Feb–Jun |
| 2012 (sched12) | Feb 26, Mar 11/25, Apr 8/22, May 6/20, Jun 3/17 (biweekly, 9) | Feb–Jun |
| 2013 (sched13) | Feb 24, Mar 10/24, Apr 7/21, May 5/19, Jun 2/16 (biweekly, 9) | Feb–Jun |
| 2014 (sched14) | Apr 2/16/30, May 13/27, Jun 11/25, Jul 8/22 (biweekly, 9) | Apr–Jul |
| 2015 (sched15) | Apr 1/15/29, May 12/26, Jun 10/24, Jul 7/21 (biweekly, 9) | Apr–Jul |

- Establishes: stocked every year 2003–2015 in a Feb–Jul window only; never Aug–Jan. No Dec/Jan/Feb rows exist anywhere in the grids (grids end at October).
- Caveat: these are published PLANS (planned evidence), not completion records.

### S3. TWRA "Trout-Stocking-Schedule-Complete.pdf", 2020 season (Wayback capture 2020-04-24)
- Org: TWRA. URL: https://web.archive.org/web/20200424033427/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Trout-Stocking-Schedule-Complete.pdf (md5 d8beba5575041fd222125779f063a5c5). Retrieved 2026-09-25.
- Fields: Carter "Laurel Fork" row: dots at weeks Mar 1, Mar 15, Mar 29, Apr 12, Apr 26, May 10, May 24, Jun 21 (biweekly, Mar–Jun); no DH marker. (Carter "Doe River" row same weeks + "DH" marker week of Oct 25.)
- Note (replay trap confirmed): Oct-2025 and Nov-2025 captures of the same-named file are identical to each other (md5 8b67aac021440085b97e855f78037779) and different from the 2020 file — the 2025 capture is the "Trout Stocking (2025)" season grid, decoded in doe-river.md.
- Establishes: 2020 season Mar–Jun biweekly.

### S4. TWRA "Trout Stocking (2025)" grid — Trout-Stocking-Schedule-Complete.pdf (Wayback captures 2025-10-01 / 2025-11-25, identical md5)
- URL: https://web.archive.org/web/20251001063025/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Trout-Stocking-Schedule-Complete.pdf. Retrieved 2026-09-25.
- Fields: Carter "Laurel Fork" row: dots Mar 2, Mar 16, Mar 30, Apr 13, Apr 27, May 11, May 25, Jun 8 (+Jun 22) — biweekly Mar–Jun; no DH marker.
- Establishes: 2025 season Mar–Jun biweekly; Jan–Dec grid contains NO Nov/Dec/Jan dots for this water.

### S5. Completed stocking feed, June 2024 archive (Wayback capture 2024-06-07)
- Org: TWRA trout-information-stockings page, completed-stockings datatable JSON. URL: https://web.archive.org/web/20240607134309/https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_panel_348017491_c/content/tn_complex_datatable.exceldriven.json (54 rows; fields Region, Destination, Stocking Date). Retrieved 2026-09-25.
- Fields: `{Region: 4, Destination: "Laurel Fork", Stocking Date: 05/28/2024}` (same feed: Doe River 05/28/2024, Doe Creek 06/04/2024 Johnson, Laurel Creek 05/30/2024).
- County not carried in this feed. Verification that "Laurel Fork" = Carter: (a) same-date 05/28 completed row for "Doe River" (Carter-only name in Region 4) indicates a Carter County truck run; (b) the Campbell Co. Laurel Fork season is a 2-trip early-spring (Mar) program, inconsistent with a 5/28 completion; (c) Carter Laurel Fork's published window runs into June. Confidence: moderately high (not certain).
- Establishes: completed stocking late May 2024 (destination-level, Region 4).

### S6. Live completed feed, September 2026 (live JSON)
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable.exceldriven.json — 10 rows, dates 08/25/2026–09/18/2026. NO Doe or Laurel rows (seasons complete). Retrieved 2026-09-25 via WebFetch (tn.gov blocks plain curl).

### S7. TWRA Region IV Coldwater Trout Report 2018 (contains the water-specific chapter)
- Org: TWRA, Region 4 fisheries. Report covers 2018 field season; published ~2018/2019. Wayback capture 2022-08-13. Retrieved 2026-09-25.
- URL: https://web.archive.org/web/20220813205505/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Coldwater-Trout-Report-R4-2017.pdf is the 2017 file (truncated 1 MiB on Wayback; NOT usable) — the 2018 report capture used: https://web.archive.org/web/20220804000418/http://www.tn.gov/content/dam/tn/twra/documents/fishing//trout/Coldwater-Trout-Report-R4-2018.pdf
- Key statements (verbatim excerpts):
  - "Laurel Fork flows through a mountainous, forested watershed (mostly within the CNF) in Carter County and is a tributary to the Doe and Watauga rivers."
  - "**Laurel Fork is one of the few Tennessee streams where wild Brown Trout dominate.** The upper portion of Laurel Fork and nine of its tributaries currently support Brook Trout." (only Leonard Branch brook population confirmed of formerly six)
  - "Agency records indicate Brown Trout were first stocked in Laurel Fork in 1951 and heavily during the 1950s and 1960s... Management as a put-and-take Rainbow Trout fishery continued until 1988, when wild trout regulations were established on the upper portion of the stream... **Stocking was discontinued except in the Dennis Cove area, where about 3,700 adult Rainbow Trout are stocked March-June each year.**"
  - "Laurel Fork was included in the wild trout streams placed under more biologically-based angling regulations in 2013 (five-fish creel, no minimum size limit)."
  - "Abundance, growth, production, and movement of wild Brown and Brook Trout in upper Laurel Fork were documented by Strange et al. (2000)." — explicit agency-documented PRODUCTION (reproduction).
  - 2018 monitoring: Station 1 (36.25611 N, -82.10306 W, Watauga Dam quad, ~2,660 ft) and Station 2 (36.23972 N, -82.08056 W); wild Brown Trout dominate; "no Rainbow Trout found since 2000" at Station 2; all year classes represented.
  - Standing statement (also in 2019, 2020, 2023 editions): "Some stocked streams (e.g., Beaverdam Creek, Doe Creek, Laurel Fork, and Doe River) do support **excellent wild trout populations** as well, but the moderate stocking rates employed are considered to pose no population-level problems for the resident fish (Meyer et al. 2012)."
- Establishes: stocking program = ~3,700 rainbows/yr, March–June, Dennis Cove area ONLY; wild brown/brook (and formerly rainbow) reproduction documented by the agency. Observation dates: electrofishing 5 and 14 September 2018.

### S8. TWRA Region IV Coldwater Trout Reports 2019, 2020, 2021, 2023 (same standing statement; 2021 samples Laurel Fork)
- URLs (Wayback): .../20220804073046/...Coldwater-Trout-Report-R4-2019.pdf ; .../20210820060301/...2020_Region4_Coldwater_Trout_%20Report.pdf (2020 edition) ; .../20220813221805/...Coldwater-Trout-Report-R4-2021.pdf (truncated at 1 MiB; 79 pages recovered via pymupdf) ; .../20230820041714/...Coldwater-Trout-Report-R4-2023.pdf (2022 field season). Retrieved 2026-09-25.
- 2021 edition: "Doe Creek, Laurel Fork, and Beaverdam Creek were quantitatively sampled during the 2021 field season (June–October). Most wild trout monitoring streams are now sampled on a rotational basis (every third year)." "only Station 2 was sampled in Laurel Fork."
- 2023 edition (2022 season): Laurel Fork not in rotation that year; standing "excellent wild trout populations" statement repeated (36 Region 4 stocked streams).
- Establishes: multi-year agency monitoring of a WILD (self-sustaining) population; the Mar–Jun Dennis Cove stocking program unchanged in scope.

### S9. TWRA ArcGIS "Trout Stocking Locations in Tennessee" feature layer (live)
- Org: TWRA_GIS (item 3ec5c58f99de4de5951f32b76b462623). Service: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0 (730 features). Retrieved 2026-09-25.
- Carter Laurel Fork sites (5, all StockingProgram "Spring", Species rainbow, Management USFS, DelayedHarvestSeason "None"):
  - "Bridge At App Trail Parking Lot S1" 36.26378, -82.12264
  - "Bear Camp S2" 36.26319, -82.11983
  - "Laurel Fork Cabins & Lodge S3" 36.26100, -82.11631
  - "Above Cabins S4" 36.25761, -82.11603
  - "Bridge Below Campground S5" 36.25689, -82.11114
  (All in the Dennis Cove reach — matches the R4 report's "Dennis Cove area only" statement.)
- Establishes: current stocking reach = lower ~1 km at Dennis Cove; program = Spring only; species = rainbow.

### S10. Tennessee Trout Management Plan 2017–2027
- Org: TWRA. Wayback capture 2020-09-30: https://web.archive.org/web/20200930133205/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Tennessee-Trout-Management-Plan-2017-2027.pdf. Retrieved 2026-09-25.
- Does not name Laurel Fork individually; general wild trout program context only. Establishes nothing water-specific (checked to close the loop).

### S11. Third-party angling corroboration (leads, not agency)
- Double D Fly Co. "Laurel Fly Fishing — Small Water, East TN" (https://doubledfly.com/small-waters/laurel-fork; retrieved 2026-09-25): wild browns define the creek (fall spawn); rainbows "stocked in the lower section near Dennis Cove; streambred and wild above the cable crossing" (cable ~0.5 mi above Dennis Cove Rec. Area = wild/unstocked boundary, single-hook, 5/day); brook trout in headwaters. Observation dates not stated (field guide, post dated Aug 6).
- Perfect Fly Store (via search): "plenty of wild brown and rainbow trout. Native brook trout are found in its headwaters."
- Trout Unlimited Blue Lines event at Dennis Cove (Sept 21, 2025): tributaries hold native brook trout.
- Commercial Appeal (PressReader syndication, undated TWRA release): "Rainbow trout, averaging about 10 inches in length, will be stocked in Laurel Fork in March."
- GBIF: Carter County TN occurrence counts — Oncorhynchus mykiss 451, Salvelinus fontinalis 121 (county-level, not reach-level; retrieved 2026-09-25 via api.gbif.org). iNaturalist: no georeferenced trout observations within 8 km of Dennis Cove (sparse coverage — unproductive).

## Months-by-year summary (planned stocking, all sources combined)

| Year(s) | Months supported by evidence |
|---|---|
| 2003 | Mar, Apr, May, Jun, Jul (weekly) |
| 2004 | Mar–Jul (weekly) |
| 2005 | Feb, Mar, Apr, May, Jun (weekly) |
| 2006 | Mar–Jul (weekly) |
| 2007 | Mar–Jul (weekly) |
| 2008 | Mar–Jun (weekly) |
| 2009 | Apr–Jul (biweekly) |
| 2010–2013 | Feb–Jun (biweekly) |
| 2014, 2015 | Apr–Jul (biweekly) |
| 2016, 2017 | (gap — sched16/17 not captured in Wayback; no grid found) |
| 2018, 2019 | (annual PDFs exist but not parsed for these rows; no contradiction found — 2018 R4 report states Mar–Jun program) |
| 2020 | Mar–Jun (biweekly) |
| 2021–2024 | (no grid recovered; R4 reports and 2024 completed feed show program continuity) |
| 2025 | Mar–Jun (biweekly) |
| 2026 | Mar–Jun (biweekly, "Seasonal") |
| 2024 (completed) | May 28, 2024 completed row (S5) |

Species: Rainbow Trout (stocked, catchable); wild Brown Trout (dominant), wild Rainbow Trout above the cable crossing, Brook Trout (headwaters + tributaries).

## Contradictions
- Ledger "year-round-trout, YR flag, no months" vs. every schedule/grid 2003–2026 showing a strictly seasonal (Feb–Jul; currently Mar–Jun) stocking window. Stocking alone would make this `seasonal-stocked [3,4,5,6]`.
- Resolution: the ledger's own standard allows year-round via "agency-documented holdover/reproduction" — and TWRA documents a self-sustaining wild fishery extensively (S7/S8), including production studies (Strange et al. 2000) and the "excellent wild trout populations" standing statement repeated in the 2018/2019/2020/2023 reports. The upper stream has been under wild-trout regulations since 1988, and stocking there was deliberately discontinued.
- Minor: 2018 R4 text says Laurel Fork is "a tributary to the Doe and Watauga rivers" (geographic shorthand; it joins the Watauga arm of Watauga Reservoir via the Doe/Watauga confluence area at Hampton — no bearing on classification).

## Searches run (Laurel Fork; incl. unproductive)
1. WebSearch "TWRA trout stocking schedule Laurel Fork Carter County Tennessee" — found JCP Apr-2026 note (Carter waters incl. Laurel Fork stocked); rate-limit errors on first attempts.
2. WebSearch "Laurel Fork Dennis Cove trout stocking rainbow Cherokee National Forest" (+variants "…rainbow trout Tennessee", ""Laurel Fork" "Dennis Cove" trout fishing Cherokee National Forest") — onwaterapp listing, stockingmap.com.
3. WebSearch ""Laurel Fork" Carter County Tennessee wild brown trout Dennis Cove fishing" (+variants "Laurel Fork Tennessee Dennis Cove wild brown trout fishing", "Laurel Fork Creek Tennessee Dennis Cove fly fishing brown trout", "Laurel Fork Tennessee trout stream Dennis Cove access") — Perfect Fly Store, TU Blue Lines, Hiking Bill, Tenkara Angler.
4. WebSearch "Dennis Cove Laurel Fork Appalachian Trail trout fishing Hampton TN" — Tenkara Angler scouting article.
5. WebSearch ""Laurel Fork" Tennessee trout 2024 stocking TWRA completed" (+variants "Laurel Fork trout stocking Carter County Tennessee TWRA", "TWRA trout stocking report 2024 Laurel Fork") — PressReader/TWA March stocking blurb; Fishbrain noise (unproductive for 2024 completion).
6. WebSearch "TWRA trout stocking schedule Laurel Fork Doe River Carter County" — stockingmap.com Doe page surfaced.
7. WebFetch doubledfly.com and /small-waters/laurel-fork — wild/stocked cable-crossing detail.
8. Wayback CDX queries for state.tn.us/twra sched03–15 (productive) and sched16/sched17 (empty — unproductive gap).
9. Wayback probe of 2018–2025 tn.gov yearly schedule PDF patterns (2018/2019 hits; 2020–2025 404s except Complete.pdf naming).
10. CDX prefix dumps: tn.gov/twra/fishing*, content/dam/tn/twra* (found Complete.pdf, R4 reports, winter schedules).
11. ArcGIS item search + FeatureServer query (730 rows; 5 Carter Laurel Fork sites).
12. GBIF occurrence queries (county-level; brown trout 0 with this filter — sparse data, not negative evidence).
13. iNaturalist API queries at Dennis Cove (0 trout observations — unproductive).
14. Unproductive: scribd/osrs noise results; Fishbrain "Little Stony Creek" mis-hit; Villanova bulletin mis-hit.

## Recommendation
- **Verdict: year-round-trout SURVIVES, but only via the agency-documented wild-reproduction clause** (TWRA Region 4 reports 2018–2023: wild Brown Trout dominate; "excellent wild trout populations"; wild-trout regulations on the upper stream since 1988; stocking there discontinued). It is NOT year-round stocked.
- Set months = [3,4,5,6] (current program: ~3,700 rainbows, Dennis Cove, March–June biweekly; historical window Feb–Jul).
- If the ledger reserves `year-round-trout` for continuous stocking only, downgrade to `seasonal-stocked` months [3,4,5,6] and record the wild fishery in notes; do not leave YR with no months.
- Gaps: 2016–2017 grids and 2021–2024 full-season grids not recovered (Wayback lacks sched16/17 and yearly PDFs); 2024 "Laurel Fork" completed row cannot be county-verified from the feed itself (moderately high confidence Carter).
