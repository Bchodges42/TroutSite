# Salt Lick Creek (Macon County, TN — Region 2) — Seasonal Trout Stocking Research Log

Research date: 2026-09-25 (all retrievals this date). Scope: internal classification research ONLY; no agency/business/author/angler contacted; no files written outside the named notes file; no git writes.

Identity: stocked water is the Macon County Salt Lick Creek (Region 2), NOT the Salt Lick Creek campground arm of Cordell Hull Reservoir operated by the US Army Corps (Jackson/Smith counties), NOT the Salt Lick Creek at Bumpus Mills (Cumberland River, Stewart/Houston counties). TWRA GIS stocking sites: OBJECTID 6 (36.59090, -85.88047) and OBJECTID 7 (36.61353, -85.88560), both "Salt Lick Creek", County MACON, City null — i.e., upper Macon County between Red Boiling Springs and Lafayette. USGS gauge 03312259 "SALT LICK CREEK BELOW RED BOILING SPRINGS, TN" (36.55188, -85.85711; drainage 14.5 sq mi) sits on the same creek; it flows south past Lafayette and empties into Cordell Hull Lake (Cumberland River system). Geography verdict for the map: stocked reach = upper Macon County segment (KY line area down toward Lafayette); mouth = Cordell Hull Lake (verify: task note said "flows to the Cumberland above Cordell Hull? verify" — it empties INTO Cordell Hull Lake, which is the Cumberland impoundment; the Bumpus Mills association is a different namesake creek).

Ledger under test: seasonal, months [12,1,2]. **Months hypothesis is WRONG.** Verdict below: March–April spring program; no winter (Nov/Dec/Jan/Feb) rows in any year 2003–2026; not in the Winter Trout Stocking Program lists (grep of winter_trout_2018.txt = 0 hits; 2026 JSON Winter rows = none for Salt Lick).

---

## SOURCES

### 1. TWRA 2026 Trout Stocking Schedule JSON (live dataset, 616 rows)
- Org: Tennessee Wildlife Resources Agency (TWRA). Publication: live 2026 schedule page dataset. Observation dates: 2026 schedule weeks. Retrieved 2026-09-25 (cache: trout_2026_live.json; tn.gov blocks plain curl — retrieved via browser-context/jina path).
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json
- Fields: REGION 2 | COUNTY Macon | LOCATION Salt Lick Creek | TYPE Seasonal | STOCKING WEEK 3/1/2026 and 03/22/2026 | SPECIES Rainbow Trout.
- Type/confidence: agency-primary current schedule; HIGH.
- Establishes: 2026 Seasonal (spring) program, two week-of dates, both March; rainbow only.

### 2. TWRA Tentative Trout Stocking Schedules 2003–2015 (state.tn.us, via Wayback Machine)
- Org: TWRA. Publication: annual "TENTATIVE TROUT STOCKING SCHEDULE" PDFs, one per year (week-of Sunday grid; event within 5 days after). Observation dates: each schedule year. Retrieved 2026-09-25 via Wayback (sched03 fetched from https://web.archive.org/web/20030404161556id_/http://www.state.tn.us/twra/fish/StreamRiver/stockedtrout/sched03.pdf; sched05–09b similarly; sched10–15b were already on disk).
- URLs (pattern): https://web.archive.org/web/<ts>id_/http://www.state.tn.us/twra/fish/StreamRiver/stockedtrout/sched{03..15}.pdf
- Fields (position-aware extraction; county column = Macon every year): Salt Lick Creek week-of marks:
  - 2003: Mar 16, Apr 27
  - 2004: Apr 4, May 2, May 30, Jun 27 (4 events; outlier year — later season, Apr–Jun)
  - 2005: Mar 13, Apr 24 | 2006: Mar 12, Apr 23 | 2007: Mar 11, Apr 22 | 2008: Mar 9, Apr 20 | 2009: Mar 8, Apr 19
  - 2010: Mar 7, Apr 4 | 2011: Mar 6, Apr 3 | 2012: Mar 4, Apr 1
  - 2013: Mar 3, Mar 31 | 2014: Mar 2, Mar 30 | 2015: Mar 1, Mar 29
- Type/confidence: agency-primary planned; HIGH.
- Establishes: unbroken 2003–2015 planned spring stocking, 2 events/yr (except 2004's 4), always first Sunday of March onward; second event Mar 29–Apr 27.
- Contradiction noted: none internally; 2004's later grid is the only deviation.

### 3. TWRA "Trout Stocking (YYYY)" annual schedules 2018–2025 (tn.gov, via Wayback + local captures)
- Org: TWRA. Publication: yearly schedule PDFs ("The dates listed are all Sundays… within five days after"). Observation dates: each schedule year. Retrieved 2026-09-25 (local cp-* captures; sched2018/sched2019 PDFs local).
- URLs (pattern): tn.gov Trout Stocking Complete schedule; Wayback captures cp-20180717180317 … cp-20250902003710.
- Replay trap (MD5 verified): cp-20180717180317 = cp-20190109035923 = cp-20191030002119 = cp-20200124101438 (md5 d8beba55…, all content "Trout Stocking (2020)" — the 2018/2019 captures replayed the 2020 file). Distinct files used per year: 2020 = cp-20200124; 2021 = cp-20210820 (cp-20211230 duplicate md5 41e350cc; cp-20210119 same-year variant); 2022 = cp-20220221/cp-20220519; 2023 = cp-20230220 (three 2023 captures identical md5 3a748e6b); 2024 = cp-20240219 + cp-20240520 (852e3117 dup set); 2025 = cp-20250208/cp-20250320/cp-20250902 (distinct). cp-20250624190651 corrupt (no /Root).
- Fields — Salt Lick Creek (Macon) week-of dates:
  - 2018: Mar 4, Apr 1 | 2019: Mar 3, Mar 31 | 2020: Mar 1, Mar 29 | 2021: Mar 7, Apr 4 | 2022: Mar 6, Apr 3 | 2023: Mar 5, Apr 2 | 2024: Mar 3, Mar 31 | 2025: Mar 2, Mar 30
- Type/confidence: agency-primary planned; HIGH.
- Establishes: 2018–2025 identical pattern (two events; first = first Sunday of March; second = Mar 29–Apr 4).

### 4. Years 2016 and 2017 — GAP (documented negative)
- Wayback CDX: no capture of state.tn.us sched16.pdf/sched17.pdf (local sched16/sched17 attempts are "has not archived" pages); tn.gov-era schedule PDFs for 2016–2017 not archived (CDX 2016–2018 shows only 302 migration stubs for tn.gov/twra PDF paths). Search runs documented below.
- Establishes: nothing; gap between 2015 and 2018.

### 5. TWRA Trout Stocking Report, updated 3/21/2025 (completed feed)
- Org: TWRA. Publication: 2025-03-21. Observation dates: stocking completions Feb–Mar 2025. Retrieved 2026-09-25 (local scheds/stockreport-202503.pdf).
- URL: tn.gov "Trout Stocking Report" PDF (Wayback/local capture).
- Fields: Region 2 | Destination Salt Lick Creek | Stocking Date 03/05/2025 (two date rows printed, both 03/05/2025).
- Type/confidence: agency-primary completed, destination-level; HIGH.
- Establishes: March 2025 completion — matches week-of Mar 2, 2025 (within 5 days). Strongest completed-level month evidence: MARCH.
- Negative: no Salt Lick rows in completed feeds 2024-06-07 archive (May window only), 12/3/2024, 8/29/2025, or live 2026-09-24 feed (10-row rolling window) — expected, since spring events fall outside those windows.

### 6. TWRA ArcGIS Trout Stocking Locations layer
- Org: TWRA (services3.arcgis.com FeatureServer, cache arcgis_all.json). Retrieved 2026-09-25.
- URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/ArcGIS/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0/query
- Fields: OBJECTID 6 & 7 | Site_Name/StreamName "Salt Lick Creek" | Region 2 | County MACON | StockingProgram "Spring" | WaterClass "stream" | Species "rainbow" | DelayedHarvestSeason "None".
- Type/confidence: agency site master; HIGH for identity/program class.
- Establishes: identity (Macon Co), Spring program class, rainbow trout, 2 access sites. Does NOT itself establish months (schedule grids above do).

### 7. USGS monitoring location 03312259 (geography)
- Org: USGS. Observation: continuous gauge. Retrieved 2026-09-25 via https://waterdata.usgs.gov/monitoring-location/03312259
- Fields: "SALT LICK CREEK BELOW RED BOILING SPRINGS, TN", Macon County, 36.5519, -85.8571, drainage 14.5 mi².
- Establishes: namesake stream geography (upper Macon Co). Corroborated by search: creek rises near Red Boiling Springs, flows past Lafayette into Cordell Hull Lake (Cumberland system) (recreation.gov Salt Lick Creek Campground page = the Cordell Hull arm, distinct downstream segment).

---

## MONTHS-BY-YEAR TABLE (planned week-of → month supported)

| Year | Week-of events | Months supported | Evidence class |
|---|---|---|---|
| 2003 | Mar 16, Apr 27 | Mar, Apr | planned (sched03) |
| 2004 | Apr 4, May 2, May 30, Jun 27 | Apr, May, Jun | planned (sched04; outlier) |
| 2005 | Mar 13, Apr 24 | Mar, Apr | planned |
| 2006 | Mar 12, Apr 23 | Mar, Apr | planned |
| 2007 | Mar 11, Apr 22 | Mar, Apr | planned |
| 2008 | Mar 9, Apr 20 | Mar, Apr | planned |
| 2009 | Mar 8, Apr 19 | Mar, Apr | planned |
| 2010 | Mar 7, Apr 4 | Mar, Apr | planned |
| 2011 | Mar 6, Apr 3 | Mar, Apr | planned |
| 2012 | Mar 4, Apr 1 | Mar, Apr | planned |
| 2013 | Mar 3, Mar 31 | Mar (2nd lands Mar 31–Apr 5) | planned |
| 2014 | Mar 2, Mar 30 | Mar | planned |
| 2015 | Mar 1, Mar 29 | Mar | planned |
| 2016 | — | GAP (no archived schedule) | — |
| 2017 | — | GAP (no archived schedule) | — |
| 2018 | Mar 4, Apr 1 | Mar, Apr | planned |
| 2019 | Mar 3, Mar 31 | Mar | planned |
| 2020 | Mar 1, Mar 29 | Mar | planned |
| 2021 | Mar 7, Apr 4 | Mar, Apr | planned |
| 2022 | Mar 6, Apr 3 | Mar, Apr | planned |
| 2023 | Mar 5, Apr 2 | Mar, Apr | planned |
| 2024 | Mar 3, Mar 31 | Mar | planned |
| 2025 | Mar 2, Mar 30; completed 03/05/2025 | Mar | planned + completed |
| 2026 | Mar 1, Mar 22 | Mar | planned (live JSON) |

Species: Rainbow Trout (2026 JSON; GIS "rainbow"). Type: Seasonal (2026 JSON TYPE field). No Delayed Harvest. Winter program: never listed (0 hits in winter program files/rows, all years checked).

## Verdict / recommendation
- Ledger months [12,1,2] are NOT supported by any year 2003–2026. In 23 yearly observations there is not one December–February event.
- Supported months: **March (every year) and April (roughly half of years)**; 2004 outlier added May–June.
- Recommendation: classify seasonal with months **[3,4]** (March–April). Keep identity anchored to Macon County (GIS sites 36.591/-85.880 and 36.614/-85.886); mouth = Cordell Hull Lake (Cumberland R. system). Confidence: HIGH for months [3,4]; note 2016–2017 gap and 2004 outlier.

## Contradictions
- Original ledger [12,1,2] contradicted by 23 years of schedule grids + completed 03/05/2025 — resolve to [3,4].
- Namesake confusion: Cordell Hull "Salt Lick Creek Campground" (Jackson/Smith) and Bumpus Mills-area Salt Lick Creek are different waters; stocked water is Macon Co per every schedule row and both GIS sites.

## Searches run (2026-09-25)
1. "Salt Lick Creek" Macon County Tennessee trout stocking TWRA — found eRegulations guide naming "Salt Lick Creek in Macon County" as stocked water.
2. "Salt Lick Creek" Tennessee Macon Lafayette stream flows into — USGS gauge + Cordell Hull mouth.
3. "Salt Lick Creek" trout stocking "March" OR "spring" Tennessee 2025 OR 2026 — rate-limited (429).
4. reddit TennesseeFishing "Salt Lick Creek" trout — rate-limited (429).
5. "Salt Lick Creek" trout fishing Tennessee stocked rainbow — weak (KY/PA namesakes); negative.
6. "Salt Lick Creek" "Red Boiling Springs" OR "Lafayette" trout TWRA stocking schedule — stockingmap.com, TNDeer schedule links.
7. TWRA "Region 2" trout stocking program spring Macon County Salt Lick — eRegulations guide confirmation (partial 429).
8. "Salt Lick Creek" Tennessee trout 2026 schedule stockingmap — TWRA live page + winter schedule PDF; PA namesake flagged.
9. Underlying opens: USGS 03312259 (fetch), Fishbrain Salt Lick Creek page (lower warmwater segment, no trout — negative), recreation.gov Cordell Hull campground (namesake disambiguation), Wayback CDX for sched03–15 + tn.gov 2016–2018.
10. Local primary sweeps: grep across all schedule/completed/winter text files (winter program = 0 hits for Salt Lick in winter_trout_2018.txt and 2026 Winter rows).
