# Cane Creek (Hickman / Perry counties) — stocking-season research log

- Log date: 2026-09-25 (all web retrievals this date unless noted)
- Classification target: seasonal trout water ("Cane Creek" listed under BOTH Perry and Hickman counties in TWRA schedules)
- Scope note: this is the Duck-basin (Buffalo-sub-basin) Cane Creek of Hickman/Perry counties — NOT Van Buren/Bledsoe "Cane Creek (Fall Creek Falls)" waters, NOT Putnam "Cane Creek Park" lake, NOT the 2012-13 Warren County Cane Creek, NOT Hickman County KY.

## 1. Identity and coordinates

**TWRA stocking sites (TWRA ArcGIS trout-stocking-locations layer, attributes + geometry; local capture arcgis_troutloc.json, inspected 2026-09-25):**

| OBJECTID | Site_Name | StreamName | Region | County | Program | Species | Lat | Lon |
|---|---|---|---|---|---|---|---|---|
| 11 | Cane Creek | Cane Creek | 2 | HICKMAN | Spring | rainbow | 35.63310 | -87.62310 |
| 15 | Cane Creek | Cane Creek | 2 | HICKMAN | Spring | rainbow | 35.64818 | -87.66041 |
| 411 | Cane Creek Middle | Cane Creek | 1 | PERRY | Spring | rainbow | 35.70411 | -87.75583 |
| 412 | Cane Creek Downstream | Cane Creek | 1 | PERRY | Spring | rainbow | 35.70830 | -87.77453 |

One continuous stream: rises in eastern/central Hickman County, flows W/NW, crossing into Perry County to the Buffalo River. Continuity is shown by the INHS fish-collection station between the county's TWRA sites: "Cane Creek, 1 mi WNW Pleasantville, Hwy. 100 bridge (35.6768, -87.71044)" (Hickman Co; Illinois Natural History Survey fish records, surfaced via web search 2026-09-25), and by the mouth position below the Perry sites.

**Mouth / drainage:**
- Federal Register 78 FR 59556 (Sept 26, 2013), "Designation of Critical Habitat for the Fluted Kidneyshell and Slabside Pearlymussel; Final Rule" (USFWS; PDF https://www.fws.gov/sites/default/files/federal_register_document/2013-23357.pdf, retrieved 2026-09-25): "Unit FK24 and SP13 includes approximately 50 rkm (31 rmi) of the Buffalo River from its confluence with the Duck River in Humphreys County, TN, upstream to its confluence with Cane Creek in Perry County, TN." -> Cane Creek's mouth is a Buffalo River tributary mouth in Perry County (unit endpoint ~35.72298, -87.78718 per the rule coordinates surfaced in search). The Buffalo River is a Duck River tributary, so the "Duck-basin" umbrella (HUC 06040004) is correct at basin level, but the creek's immediate receiving water is the Buffalo River.
- Historical corroboration: "Introduction to the Resources of Tennessee" (Joseph Jones, 19th c.; via tnyesterday.com, retrieved 2026-09-25): eastern tributaries of the Buffalo include "Coon Creek, Brush Creek, Hurricane Creek, Short Creek, and Cane Creek, the last of which is by far the [largest]."

**Distinct same-named waters (all separate in TWRA data):** Van Buren "Cane Creek (lower)" + "Cane Creek (Fall Creek Falls State Park)" (Region 3, private-land sites S1-S3, Hwy 285/284); Bledsoe "Upper Cane Creek" (Hwy 284); Putnam "Cane Creek Lake" at Cane Creek Park, Cookeville (Winter program, city); Warren County Cane Creek (weekly put-and-take row in 2012-2013 schedules); Hickman County KY Cane Creek.

## 2. Schedule rows: which Cane Creek is which

Modern authoritative rows (2026 JSON, below) list TWO separate Cane Creek schedule rows relevant here: "Perry / Cane Creek" (Region 1) and "Hickman / Cane Creek" (Region 2), plus the separate Region 3 Van Buren rows. Older schedules list Perry-only (2003-2010); Hickman Cane Creek appears from 2011. Region labels for Hickman vary by year (Region 2 in 2011-2013 schedules; Region 1 in the 2018 schedule; Region 2 again in 2026 JSON) — county pairing is stable, region labels are not.

**2024-archive question resolved:** the completed-stocking feed capture (completed_2024.json, 54-row TWRA completed-feed JSON, pre-existing local capture, inspected 2026-09-25) contains "Cane Creek" only as Region 3 rows: `{"Region":"3","Destination":"Cane Creek","Stocking Date":" 05/21/2024"}` and `{"Region":"3","Destination":"Cane Creek (Fall Creek Falls STP)","Stocking Date":" 05/14/2024"}`. There is NO Region 2 Cane Creek row in that snapshot; the "Cane Creek 05/14/2024" item is the Fall Creek Falls STP water (Van Buren), a different water. The partial-year snapshot (ends ~May 21) also never reaches the Feb-Apr Hickman/Perry completions.

## 3. Month-by-year stocking table (planned weeks; "week of" Sundays, event within 5 days after)

Sources: statewide schedule PDFs decoded by coordinate extraction (bullets/X mapped to validated Sunday axes). Captures: sched03 (Wayback 20030404161556), sched04 (20040210011352), sched05 (20051124124935), sched06 (20060604223344), sched07 (20070227143540), sched08 (20080909205030), sched09 (20090418095714), sched10-13 (local PDFs), sched14 (Wayback 20140412202632), sched15 (Wayback 20150319003402), sched_2018/sched_2019/schedcomplete_2020/complete_20211009/complete_20230220040610/complete_20240222194223/complete_20250320072447 (local), sched2026.json (local capture of tn.gov exceldriven JSON, 616 rows). All Wayback URLs of form https://web.archive.org/web/<ts>id_/http://www.state.tn.us/twra/fish/StreamRiver/stockedtrout/schedNN.pdf. Inspection date 2026-09-25. Species: Rainbow Trout throughout.

| Year | Perry Cane Creek (weeks) | Hickman Cane Creek (weeks) | Months |
|---|---|---|---|
| 2003 | Mar 9, Mar 30, Apr 27 | (row absent) | Mar, Apr |
| 2004 | Mar 7, Mar 28, Apr 25 | (row absent) | Mar, Apr |
| 2005 | Mar 6, Mar 27, Apr 24 | (row absent) | Mar, Apr |
| 2006 | Mar 5, Mar 26, Apr 23 | (row absent) | Mar, Apr |
| 2007 | Mar 4, Mar 25, Apr 22 | (row absent) | Mar, Apr |
| 2008 | Mar 2, Mar 23, Apr 20 | (row absent) | Mar, Apr |
| 2009 | Mar 1, Mar 22, Apr 19 | (row absent) | Mar, Apr |
| 2010 | Feb 28, Mar 28, Apr 25 | (absent; Hickman's stocked stream that year was Mill Creek) | Feb, Mar, Apr |
| 2011 | Feb 27, Mar 27, Apr 24 | Feb 27, Mar 27, Apr 24 | Feb, Mar, Apr |
| 2012 | Mar 4, Apr 1, Apr 29 | Mar 4, Apr 1, Apr 29 | Mar, Apr |
| 2013 | Mar 3, Mar 31, Apr 28 | Mar 3, Mar 31, Apr 28 | Mar, Apr |
| 2014 | Feb 23, Mar 30, Apr 27 | Feb 23, Mar 30, Apr 27 | Feb, Mar, Apr |
| 2015 | Feb 22, Mar 29, Apr 26 | Feb 22, Mar 29, Apr 26 | Feb, Mar, Apr |
| 2016 | NOT RECOVERED (no Wayback capture of tn.gov 2016-Trout-Stocking-Schedule.pdf; state.tn.us sched16.pdf never archived) | NOT RECOVERED | — |
| 2017 | NOT RECOVERED (same) | NOT RECOVERED | — |
| 2018 | Feb 25, Apr 1, Apr 29 | Apr 1, Apr 29 | Feb, Apr |
| 2019 | Feb 24, Mar 31, Apr 28 | Mar 31, Apr 28 | Feb, Mar, Apr |
| 2020 | Mar 29, Apr 26 | Mar 29, Apr 26 | Mar, Apr |
| 2021 | Apr 4, May 2 | Feb 28, Apr 4, May 2 | Feb, Apr, May |
| 2022 | (no schedule capture; completed feed: Region 2 Cane Creek completed 04/22/2022 = Hickman) | same event | Apr |
| 2023 | Apr 2, Apr 30 | Feb 26, Apr 2, Apr 30 | Feb, Apr |
| 2024 | Mar 31, Apr 28 | Feb 25, Mar 31, Apr 28 | Feb, Mar, Apr |
| 2025 | Feb 23 (only dot) | Feb 23, Mar 30, Apr 27 | Feb, Mar, Apr |
| 2026 | wk of 2/22, 3/22, 4/26 (JSON: TYPE Seasonal, Rainbow) | wk of 2/22, 3/22, 4/26 (TYPE Seasonal, Rainbow) | Feb, Mar, Apr |

Winter-program negation: TWRA "Winter Trout Stocking" date lists for 2014/15 (Wayback 20150412201020 wintertrout.pdf) and 2017/18 (Wayback 20180112193704, tn.gov wintertrout.pdf, "Updated 01/03/2018") contain NO Cane Creek of Hickman/Perry (only "Cane Creek Park", Cookeville). Retrieved 2026-09-25.

## 4. Type and confidence

- Type: SEASONAL (spring) put-and-take; Rainbow Trout; ~3 events/yr, week-of Sundays Feb-Apr (occasionally reaching May in 2021).
- Verdict months: **March, April** in every recovered year; **February** in most years (2010, 2011, 2014, 2015, 2018, 2019, 2021(Hickman), 2023(Hickman), 2024, 2025, 2026); **May** only 2021. Recommended month set: [2,3,4].
- Confidence: HIGH for month pattern (21 of 24 years recovered, 2003-2026, all sources mutually consistent); MEDIUM on exact 2016-2017 detail (gap); HIGH on identity.

## 5. Completed (destination-level) evidence

- 2022 completed feeds (cw_20220519195104 "Updated: 5/17/2022"; cw_20220629093934 "Updated: 6/17/2022"; local captures, inspected 2026-09-25): "Region 2, Cane Creek, 04/22/2022" (= Hickman Cane Creek; Region 3 rows same dates are Van Buren's waters).
- 2024 completed feed (completed_2024.json): no Hickman/Perry row (partial snapshot; see section 2).
- iNaturalist (API query 2026-09-25): 0 Oncorhynchus mykiss observations within 12 km of the Perry/Hickman sites; GBIF (bbox query 2026-09-25): 0 records.

## 6. Contradictions

- Web-search summary claims (NewsChannel9 winter-schedule aggregation, 2025-26) listed "1/21/2026 Cane Creek" under winter stockings — that is Cane Creek Park, Cookeville (Putnam; 2026 JSON Winter row 1/21/2026), not this water.
- The 2024 "Cane Creek 05/14/2024" flag from the prior pass is attributable to the Region 3 Fall Creek Falls STP row (05/14) / R3 Cane Creek (05/21), per section 2.
- Region-label drift for the Hickman row (Region 2 vs Region 1 across years) noted; does not affect months.

## 7. Searches run (10)

1. "Cane Creek" Hickman County Tennessee trout stocking TWRA
2. topozone "Cane Creek" Perry County Tennessee stream topo map
3. Federal Register critical habitat "Cane Creek" Perry County Tennessee fluted kidneyshell unit FK24 Duck River
4. fluted kidneyshell critical habitat designation Federal Register Tennessee
5. "35.72298" OR "-87.78718" Cane Creek critical habitat
6. "Cane Creek" "Hickman County" Tennessee federalregister confluence Duck River mussel
7. "Cane Creek" "Hickman County" Tennessee topo map stream buffalo river OR duck river
8. Cane Creek Tennessee "Perry County" buffalo river trout TWRA stocked rainbow
9. "Cane Creek" Tennessee Hickman Perry "flows into the Buffalo" / "Cane Creek Road"
10. Cane Creek Pleasantville Tennessee Hwy 100 fish collection buffalo river watershed
(plus Wayback CDX queries and FWS PDF fetch, govinfo fetch, Wikipedia/INHS context)

## 8. Recommendation

Classify as one seasonal water "Cane Creek (Hickman/Perry)" — Seasonal, Rainbow, months [2,3,4] (Mar-Apr certain; Feb common; May exceptional). Keep the Van Buren/Fall Creek Falls, Bledsoe Upper, Putnam Park, and (historic) Warren rows as separate waters. Do not attach the 2024 R3 "Cane Creek 05/14/2024" completion to this water.
