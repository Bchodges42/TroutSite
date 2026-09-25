# Beaverdam Creek (Johnson County, TN) — Evidence Repair Research Log

Water: Beaverdam Creek, Johnson County, TN (Shady Valley → Backbone Rock gorge → S.F. Holston drainage, flows north into Virginia)
Ledger verdict under test: `year-round-trout` (YR flag set, no months pinned)
Research date: 2026-09-25 (all retrievals this date unless noted). Research ONLY; no agencies/businesses contacted.

---

## 1. Water identity / disambiguation (same-name risk CLOSED)

- **TWRA 2026 stocking schedule JSON** (live, tn.gov). Fields: REGION, COUNTY, LOCATION, TYPE, STOCKING DAY, STOCKING WEEK, STOCKING MONTHS, SPECIES. The single "Beaverdam Creek" location row set is **REGION "4", COUNTY "Johnson"** — 5 rows, TYPE "Seasonal", SPECIES "Rainbow Trout", weeks 3/1/2026, 3/29/2026, 4/26/2026, 5/24/2026, 6/21/2026. No Hamilton County Beaverdam appears anywhere in the trout dataset (Hamilton Co. trout waters in the same JSON are different names). Confirms the ledger's "Beaverdam Creek 05/30/2024" 2024-era Region 4 row = Johnson Co. water.
  - URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json (retrieved via browser-context fetch; tn.gov blocks plain curl)
- **TWRA ArcGIS FeatureServer "TWRA_Trout_Stocking_Locations"** (live REST query, all 730 features pulled): 9 Beaverdam Creek sites S1–S9, all **County=JOHNSON, City=Shady Valley, StockingProgram="Spring", Species=rainbow, DelayedHarvestSeason=None**:
  - USFS Campground S1 (36.59922, −81.81836, 50 RB); Backbone Rock Parking Lot S2 (36.59437, −81.81493, 50); Below Tank Hollow Rd S3 (36.59217, −81.81842, 50); Acra Cretsinger Rd S4 (36.55773, −81.88853, 25, private); Osie Rd Bridge S5 (36.55467, −81.89103, 25, private); Mcqueen Gap Rd S6 (36.55144, −81.89436, 20, private); Winchester Rd S7 (36.54369, −81.89756, 20, private); Blackwell Farm S8 (36.53437, −81.92149, 25, private); Hwy 421 – Shady Valley S9 (36.52086, −81.93175, 25, private). ≈240 catchable rainbow per stocking event across the reach.
  - Program distribution over all 730 sites: Spring 597, Winter 54, Tailwater 60, Reservoir 19. Johnson County's only Winter site is Ralph Stout Park (Mountain City pond). Beaverdam has none.
  - URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=json

## 2. Month-by-month planned stocking record (primary evidence)

Method: Wayback PDF captures downloaded and parsed **geometrically** (pymupdf word coordinates; page rotation handled; each creek's marks mapped to week-of-Sunday header columns; calendar solved by matching the header day sequence to consecutive Sundays). Note: naive `pdftotext -layout` column alignment is WRONG for these grids (contiguous X runs compress N weekly columns into N characters); the geometric method is authoritative and was verified against known weekly fisheries (Citico, Rocky Fork).

| Year | Schedule source (Wayback) | Beaverdam Creek stocking weeks | Months supported |
|---|---|---|---|
| 2003 | sched03.pdf, capture 20030404161556 | **Weekly Feb 23 – Jun 22 (18 events)** | Feb, Mar, Apr, May, Jun |
| 2004 | sched04.pdf, capture 20040210011352 | Weekly Feb 22 – Jun 20 (17; gap ~May 30) | Feb, Mar, Apr, May, Jun |
| 2005 | sched05.pdf, capture 20051124124935 | Weekly Feb 20 – Jun 19 (18) | Feb, Mar, Apr, May, Jun |
| 2006 | sched06.pdf, capture 20060604223344 | Weekly Feb 26 – Jun 25 (18) | Feb, Mar, Apr, May, Jun |
| 2007 | sched07.pdf, capture 20070227143540 | Weekly Feb 25 – Jun 24 (18) | Feb, Mar, Apr, May, Jun |
| 2008 | sched08.pdf, capture 20080909205030 | Weekly Mar 2 – Jun 29 (18) | Mar, Apr, May, Jun |
| 2009 | sched09.pdf, capture 20090418095714 | Biweekly Mar 1 – Jun 21 (9) | Mar, Apr, May, Jun |
| 2010 | sched10.pdf, capture 20100326100325 | Biweekly Feb 28 – Jun 20 (9) | Feb, Mar, Apr, May, Jun |
| 2011 | sched11.pdf, capture 20110111175732 | Biweekly Feb 27 – Jun 19 (9) | Feb, Mar, Apr, May, Jun |
| 2012 | sched12.pdf, capture 20120418154111 | Biweekly Feb 26 – Jun 17 (9) | Feb, Mar, Apr, May, Jun |
| 2013 | sched13.pdf, capture 20140112202401 | Biweekly Feb 24 – Jun 16 (9) | Feb, Mar, Apr, May, Jun |
| 2014 | sched14.pdf, capture 20140412202632 | Biweekly Mar 2 – Jun 22 (9) | Mar, Apr, May, Jun |
| 2015 | sched15.pdf, capture 20150319003402 | Biweekly Mar 1 – Jun 21 (9) | Mar, Apr, May, Jun |
| 2016 | **NOT FOUND** (no Wayback capture located; CDX empty for sched16/2016 names) | — (gap; see §3 agency prose covering this period) | — |
| 2017 | **NOT FOUND** (same) | — (gap; same coverage) | — |
| 2018 | 2018-Trout-Stocking-Schedule.pdf, capture 20180717180317 | Biweekly Mar 4 – Jun 24 (9) | Mar, Apr, May, Jun |
| 2019 | 2019-Trout-Stocking-Schedule.pdf, capture 20190109035923 | Biweekly Mar 3 – Jun 23 (9) | Mar, Apr, May, Jun |
| 2020 | Trout-Stocking-Schedule-Complete.pdf, capture 20200424033427 | Biweekly Mar 1 – Jun 21 (9) | Mar, Apr, May, Jun |
| 2021 | Complete.pdf, capture 20210119123626 (verified distinct digest; also 20210820 capture identical content) | Biweekly Mar 7 – Jun 27 (9) | Mar, Apr, May, Jun |
| 2022 | Complete.pdf, captures 20220221215138 & 20220519194927 (distinct digests, same Beaverdam row) | Biweekly Mar 6 – Jun 26 (9) | Mar, Apr, May, Jun |
| 2023 | Complete.pdf, capture 20230219191239 | Biweekly Mar 5 – Jun 25 (9) | Mar, Apr, May, Jun |
| 2024 | Complete.pdf, capture 20240219225857 | Biweekly Mar 3 – Jun 23 (9) | Mar, Apr, May, Jun |
| 2025 | Complete.pdf, captures 20250208215445 & 20250902003710 | Biweekly Mar 2 – Jun 22 (9) | Mar, Apr, May, Jun |
| 2026 | Live exceldriven JSON (tn.gov, 616-row datatable) | 3/1, 3/29, 4/26, 5/24, 6/21 (5 events, ~monthly); **TYPE field = "Seasonal"** | Mar, Apr, May, Jun |

**Zero planned Beaverdam stockings in January, July, August, September, October, November, or December in any archived schedule 2003–2026.** The 2021–2025 Complete.pdf digest history was checked per capture (14 distinct digests) — no replay trap affected the Beaverdam rows (revisions verified as real; each period's Beaverdam row identical Mar–Jun pattern).

Winter/coldwater programs (which are where TWRA puts cold-season stockings) checked and **exclude Beaverdam**: wintertrout.pdf (2013/14, capture 20140112202400), winter-trout-schedule.pdf (2019/20, capture 20200809113424), TWRA-Winter-Trout-Schedule.pdf (2024/25, capture 20241120115437), Coldwater-Trout_Stocking-Schedule.pdf (updated 2/18/2022, capture 20220221220911; R4 winter waters = Cherokee/SHolston/Watauga/Wilbur TWs, Fishery Park Pond, Fountain City Lake, Pistol Creek, Nolichucky, W Prong Little Pigeon). All are city ponds + tailwaters.

## 3. Completed (destination-level) stocking evidence

- **Trout Stocking Report PDF, "updated as of 9/27/2024"** (capture 20240927221436): Region 4 completions Aug 30–Sep 26, 2024 = Buffalo Creek 8/30, South Holston TW 9/9, Wilbur TW 9/5. **No Beaverdam.**
- **Same report, updated 11/8/2024** (capture 20241111215005): Region 4 completions Oct–Nov = Calderwood, Dillard Ponds, Dudley Creek, Fishery Park Pond, Leconte Creek, Little River, Mid & W Prong Little Pigeon, Wilbur TW. **No Beaverdam.**
- **Same report, updated 3/21/2025** (capture 20250322191030): **"4 Beaverdam Creek 03/18/2025"** — spring completion (within-5-days after week-of Sunday 3/16... note 2025 schedule weeks were Mar 2, 16, 30...; 3/18 = Tuesday after week-of Mar 16). Exactly seasonal.
- **Same report, updated 8/29/2025** (capture 20250902003641): **no Beaverdam** (0 matches).
- **Live page, retrieved 2026-09-25**: "Trout Stocking Locations Report, updated as of 9/21/2026" — summer/fall completions are tailwaters (Dale Hollow, Wilbur, Center Hill, Ft. Patrick Henry, Norris, Tims Ford), Buffalo Creek 9/17, West Prong Little Pigeon (Gatlinburg) 8/25, Leconte Creek 8/27, Ft. Campbell. **No Beaverdam.**
- Context-provided "Beaverdam Creek 05/30/2024" completed row (June-2024 archive JSON, tn_panel_348017491_c node, capture 20240607134309): capture exists (CDX 200) but the body was not retrievable today (Wayback intermittently offline); the date is fully consistent with the 2024 planned week-of May 26 + ≤5 days. Corroborating spring completion.

## 4. Agency program statements (TWRA Region IV Coldwater/Trout Fisheries Reports)

- **Fisheries Report 18-01, Region IV Trout Fisheries Report 2017** (Habera, Petre, Carter; TWRA; capture 20220813205505; chunked download):
  - "Outside the special regulations section, **about 5,600 catchable Rainbow Trout are stocked each year during March–June**."
  - "**Brown Trout fingerlings have occasionally been stocked in upper Beaverdam Creek** (vicinity of Hwy. 421 crossing and upstream) to supplement the wild Brown Trout population… limited spawning habitat (Habera et al. 2006)."
  - In 1988 a 10-km special-regulation section (Tank Hollow Rd to Birch Branch, Cherokee NF) was established (229-mm min, 3-trout creel, single-hook artificial lures) "to emphasize the wild trout fishery. **Stocking was also discontinued within this area after 1988.**" In 2013 length limit removed, creel raised to 5.
  - "Beaverdam Creek is one of Tennessee's best-known wild trout streams. It originates in Johnson County's Iron Mountains and flows northeast into Virginia as part of the South Fork Holston drainage." Shields (1950): excellent Rainbow Trout water but "no reproduction (except in the tributaries)"; Bivens (1988), Bivens & Williams (1990) "documented excellent wild Rainbow Trout and Brown Trout populations." Brook Trout in >29 km of 12 Beaverdam tributaries, mostly native heritage.
  - Large (>400 mm) Brown Trout present in 20 of 26 annual surveys (all but one since 2003).
  - Recommendation: "current stocking program is compatible with wild trout management… **no expansion of the area or number of catchable trout currently stocked**." Annual monitoring at 2 stations since 1991.
- **Fisheries Report 19-08, Region IV Trout Fisheries Report 2018** (capture 20220804000418): repeats the 34-stream adult-rainbow program; "Some stocked streams (e.g., **Beaverdam Creek**, Doe Creek, Laurel Fork, Doe River) do support excellent wild trout populations as well." 2018: main-stem sampling missed (high flows) — first miss since 1991; 60 wild fingerling Rainbow Trout collected in July 2018 for whirling-disease screening (negative) — **agency-documented in-stream reproduction**. Region IV "year-round trout fisheries" language applied ONLY to TVA tailwaters (Norris, Ft. Patrick Henry, South Holston, Wilbur, Boone) — never to Beaverdam.
- **Fisheries Report (Region IV) 2019** (capture 20220804073046): "Beaverdam supports one of Tennessee's best wild trout fisheries… current stocking program is not incompatible… **no expansion**." 2019 sampling 27–28 Aug at Site 1 (36.59176, −81.81847, 2,160 ft, USFS, "Begins at Tank Hollow Rd near Backbone Rock") and Site 2 (36.56576, −81.87315, 2,440 ft, "Hwy. 133 mile marker 5 near Arnold Br").
- **2020_Region4_Coldwater_Trout_Report** (Fisheries Report 21-05; capture 20210820060301): same 34-stream/March–June program statement; brook translocation from Beaverdam tributaries.
- **Region IV report for 2022 field season** (capture 20230820041714): "Beaverdam Creek… still sampled annually"; stocked Rainbows visible in samples "dull coloration, eroded fins… >229 mm" but excluded from wild-fish analyses (i.e., stocked adults identifiable in the creek during/after the spring season). 2022 estimates include age-0 (≤90 mm) Rainbow and Brown Trout = **continued natural recruitment**.
- **Tennessee Trout Management Plan 2017–2027** (capture 20200930133205): Shields (1950/51) era water-quality degradation; today Beaverdam among recovered wild trout streams.

## 5. Biodiversity / occurrence sources (leads, not stocking evidence)

- **USGS NAS** (API, county=Johnson, TN; 56 records): Rainbow Trout "established" (Kettlefoot WMA); many Brown Trout MARIS records status "stocked", incl. "Beaverdam Creek at Backbone Rock at TN 133 (TJN 09-34)". URL: https://nas.er.usgs.gov/api/v2/occurrence/search?state=TN&county=Johnson
- **GBIF** (bounding box 36.48–36.64 N, −81.97–−81.76 W): O. mykiss — 2009-06-09 at 36.5936/−81.8154 (Beaverdam/Backbone Rock) and a 1940-06-24 museum record at 36.5636/−81.8795 (Shady Valley reach); S. trutta — 2023-10-04 at 36.5773/−81.8500 (inside the gorge) plus 2007 MARIS grid points; S. fontinalis — 2026-06-23 at 36.5542/−81.8510 (gorge). Confirms trout presence across multiple months/seasons (wild residents), not stocking events.
- **iNaturalist** (6 km of Backbone Rock, Salmonidae): 0 research-grade trout observations — unproductive.
- **Shady Valley character**: USGS gauge 03472600 "Beaverdam Creek at Shady Valley"; The Nature Conservancy preserves (cranberry bogs) on Beaverdam Creek frontage; valley-floor springs; TWRA sample elevations 2,160–2,440 ft. Coldwater character is real — and is exactly why the wild trout component persists year-round — but TWRA still confines catchable stocking to Mar–Jun (put-and-take over a wild fishery), consistent with marginal summer flows/temperature and angling-season tradition.

## 6. Contradictions found

1. Ledger `year-round-trout` vs. 23 years of TWRA planned schedules with **no non-spring stocking** (only tension resolved: the year-round attribute belongs to Region IV *tailwaters*, which TWRA reports explicitly single out).
2. TWRA's own 2026 dataset **TYPE = "Seasonal"** for Beaverdam (vs. other waters typed differently) and ArcGIS **StockingProgram = "Spring"**.
3. Completed reports for Sep 2024, Nov 2024, Aug 2025, Sep 2026: zero Beaverdam completions outside spring; completions 3/18/2025 and 5/30/2024 are spring weeks.
4. Historical wrinkle (not a contradiction of the verdict): stocking inside the special-regulation wild-trout section (Tank Hollow Rd → Birch Branch) was discontinued after 1988; the 9 current sites are outside/below that section, and occasional Brown Trout fingerling stockings occurred in the upper (Hwy 421/Shady Valley) reach.

## 7. Searches run (distinct queries; ⚠ = unproductive)

1. WebSearch: Beaverdam Creek Johnson County Tennessee trout stocking
2. WebSearch: "Beaverdam Creek" Shady Valley Tennessee TWRA trout
3. WebSearch: Beaverdam Creek Tennessee wild trout rainbow reproduction Habera monitoring ⚠ (rate-limited)
4. WebSearch: Perfect Fly Store Beaverdam Creek Tennessee fly fishing brown trout winter
5. WebSearch: Beaverdam Creek special regulations wild trout "Tank Hollow"/"Backbone Rock" creel limit
6. WebSearch: Shady Valley elevation springs cranberry bogs Beaverdam Creek headwaters
7. Wayback CDX: sched03–sched15.pdf capture lists (13 queries)
8. Wayback CDX: state.tn.us/twra/fish/StreamRiver/stockedtrout/* (full folder inventory; found sched06 + wintertrout.pdf)
9. Wayback CDX: tn.gov/twra/fishing/trout-information-stockings* (×2 forms)
10. Wayback CDX: tn.gov/content/dam/tn/twra prefix (found 2018/2019 schedules, R4 reports, Complete.pdf, winter schedules, management plan)
11. Wayback CDX: Complete.pdf digest history (14 distinct digests enumerated and sampled)
12. Wayback CDX: Trout_Stocking-Report.pdf digest history (10 captures)
13. Wayback CDX: exceldriven JSON captures (2024 completed feed located)
14. Wayback CDX probes for 2016/2017 schedule PDFs (sched16/17, 2016-/2017-Trout-Stocking-Schedule.pdf) ⚠ all empty
15. Live fetch: 2026 exceldriven JSON (tn.gov; 616-row datatable)
16. Live fetch: tn.gov trout-information-stockings page (Sept 2026 completed report contents)
17. Live fetch: retired Trout_Stocking-Report.pdf (404 live) and June-2024 feed JSON capture body ⚠ (Wayback offline window)
18. ArcGIS REST: TWRA_Trout_Stocking_Locations full layer query (730 features)
19. USGS NAS API: TN/Johnson occurrences (56 records)
20. GBIF API: species-match ×3 + bounding-box occurrence queries ×3
21. iNaturalist API: observations within 6 km of Backbone Rock ⚠ (0 trout records)
22. R4 2017 report re-fetch via HTTP range chunks (1 MiB transfer cap worked around)

## 8. Recommendation

**The `year-round-trout` verdict does NOT survive as a stocking claim — reclassify as seasonal-with-wild-resident component.**

- **Stocked fishery: strictly seasonal, late Feb/early Mar – late Jun.** Pin months **March–June** (with a documented late-February start in ~7 of 23 scheduled years: 2003, 2005–2007, 2010–2013; weekly through 2008, biweekly 2009–2025, ~monthly in 2026). Species: catchable Rainbow Trout (~5,600/yr at peak program description; ~240 per event across 9 sites currently); occasional Brown Trout fingerlings in the upper Shady Valley/Hwy 421 reach. Suggested ledger string: `seasonal-trout (stocked Mar–Jun; some years late Feb) + year-round wild trout presence`.
- **If the ledger's YR flag is defined by the project standard ("continuous stocking OR agency-documented holdover/reproduction")**, the reproduction prong IS met — TWRA documents an excellent wild Rainbow + Brown population with annual age-0 recruitment (monitored since 1991) and native Brook Trout in 12 tributaries (>29 km). A year-round *trout presence* claim is therefore defensible, but it must be labeled as **wild-fish presence, not year-round stocking**, and the Feb–Jun stocking window pinned either way.
- Confidence: planned-schedule evidence HIGH (geometric reads of primary agency grids, 21 of 23 years); completed-feed evidence HIGH (4 independent destination-level reports); agency program statements HIGH (5 primary reports); 2016–2017 planned grids a residual gap covered by agency prose (2017 & 2018 reports describe the Mar–Jun program as current).
