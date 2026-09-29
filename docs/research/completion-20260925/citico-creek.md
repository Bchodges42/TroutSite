# Citico Creek (Monroe County) — Seasonal Stocked Trout Evidence Log

Water: Citico Creek, Monroe County, TN (TWRA Region 3; master GIS layer shows one stray "Region 4" row).
Ledger verdict under test: `seasonal-stocked-trout` (months unpinned). Research date: 2026-09-25. Research only; no agency contact.

## Water identification / reach

- Stocked reach = LOWER Citico Creek in the Cherokee NF outside the Citico Creek Wilderness, along FR 35 (Citico Creek Road), Monroe County. TWRA master stocking layer places 15 put-points between ~35.405–35.431 N, −84.079–−84.110 W.
- Permit/regulatory reach (Tellico-Citico Permit Area) = "Citico Creek from its confluence with Little Citico Creek upstream to the confluence of North and South Forks of Citico Creek" (TWRA trout regulations, retrieved 2026-09-25). Upper watershed = wild/native trout (kept separate; see §7).
- Representative stocking-site coordinates (TWRA Trout_MASTER_Project FeatureServer):
  - OBJECTID 475 "Iron Bridge" (USFS): 35.424003, −84.099162
  - OBJECTID 446 (Reg 3, Monroe): 35.404978, −84.078572
  - OBJECTID 410: 35.408950, −84.085683 (lowest put-point cluster)

## 1. Sources

### 1.1 TWRA 2026 Trout Stocking Schedule JSON (planned)
- Title: "Trout Fishing & Stockings in Tennessee — 2026 stocking schedule (Excel-driven datatable JSON)", TN Wildlife Resources Agency.
- Publication date: current season (2026). Observation dates: the schedule rows themselves. Retrieved: 2026-09-25 (cached by same-day prior pass, `data/sched2026.json`, 616 rows; identical copy `completion/trout_2026_live.json`).
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json
- Fields: REGION=3, COUNTY=Monroe, LOCATION=Citico Creek, TYPE=Seasonal, SPECIES=Rainbow Trout, STOCKING WEEK for 22 consecutive weeks:
  2/22, 3/1, 3/8, 3/15, 3/22, 3/29, 4/5, 4/12, 4/19, 4/26, 5/3, 5/10, 5/17, 5/24, 5/31, 6/7, 6/14, 6/21, 6/28, 7/5, 7/12, 7/19 (all /2026).
- Month buckets: Feb 1 wk, Mar 5, Apr 4, May 5, Jun 4, Jul 3.
- Type: planned. Confidence: high. Establishes: 2026 plan = weekly stocking Feb–Jul, rainbow trout, "Seasonal" program type.

### 1.2 TWRA live page "Trout Fishing & Stockings in Tennessee" (Sept 2026 capture)
- Title: Trout Fishing & Stockings in Tennessee (tn.gov). Capture: 2026-09-25 (prior pass, `completion/stockings-live-raw.html`).
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings.html
- "Citico Creek" appears in the destination picker (active stocking destination). A reader-mode text jumble mixes destination names with unrelated dates ("Citico Creek TBD 11/2026...") — ATTRIBUTION UNRELIABLE (word-salad of a JS table); recorded as unusable lead only.
- Type: corroborating. Confidence: low (destination list) / discarded (jumble).

### 1.3 Archived TWRA schedules 2003–2015 (Wayback captures of state.tn.us sched03–15.pdf; cached `data/schedpdf/`)
- Title: "TWRA Tentative Trout Stocking Schedule" (annual). "Week of" dates; stocking event occurs within five days after the date listed.
- Retrieved (cache): 2026-09-25; original captures via Wayback Machine of state.tn.us URLs.
- Citico row by year, with X-grid decoded by character-offset mapping to week-of columns (per-page pdftotext −layout):

| Year | Listed as | Planned "week of" stockings | Months supported |
|---|---|---|---|
| 2003 | Monroe Citico Creek** | continuous run Mar 30 → May 25 (weekly) | Mar, Apr, May |
| 2004 | Monroe Citico Creek** | Mar 21, Apr 18, May 23 | Mar, Apr, May |
| 2005 | Monroe Citico Creek** | Mar 20 → May 22 (weekly) | Mar, Apr, May |
| 2006 | Monroe Citico Creek** | Mar 19 → May 21 (weekly) | Mar, Apr, May |
| 2007 | Monroe Citico Creek** | Mar 18 → May 20 (weekly) | Mar, Apr, May |
| 2008 | Monroe Citico Creek** | Mar 23 → May 25 (weekly) | Mar, Apr, May |
| 2009 | Monroe Citico Creek** | Mar 29 → May 24 (weekly) | Mar, Apr, May |
| 2010 | Monroe Citico Creek** | Mar 21 → May 23 (weekly) | Mar, Apr, May |
| 2011 | **Polk** Citico Creek** | row present, NO week-marks | none decodable |
| 2012 | Polk Citico Creek** | row present, NO week-marks | none decodable |
| 2013 | (sched13 not captured) | — | gap |
| 2014 | Polk Citico Creek** | row present, NO week-marks | none decodable |
| 2015 | Polk Citico Creek** | row present, NO week-marks | none decodable |

- Notes: (a) `**` footnote = permit water: "From March 15 through September 15, water is closed to fishing on Thursdays and Fridays ... daily permit required" (2003 text; 2011 wording "except the day of State and Federal holidays"). This is a REGULATION footnote, not a stocking-months statement. (b) The county switch Monroe→Polk 2011–2015 is a TWRA table error (Citico Creek is entirely in Monroe County); same water. (c) Absence of week-marks 2011–2015 is consistent across independent extractions (prior-pass .txt, my per-page re-extraction) while other waters in the same tables (e.g., Polk Town Creek, Green Cove Pond) retain X marks — i.e., TWRA listed the water but stopped publishing per-week grid dates for it. Confidence in the Mar–May pattern 2003–2010: high. Confidence that 2011–2015 rows carry no decodable months: medium-high.

### 1.4 TWRA yearly stocking pages 2018–2025 (tn.gov "Trout Stocking (20XX)" PDFs; cached `data/complete/`, `data/reports/`)
- 2018-Trout-Stocking-Schedule.pdf (reports/): "Monroe Citico Creek**" listed, NO week-marks (while "Monroe Tellico River**DH" appears). Months: none decodable. Type: planned. Confidence: medium-high (absence consistent across captures).
- complete_2019-20.pdf / complete_2020.pdf (md5 identical: d8beba5575041fd222125779f063a5c5 — replay trap confirmed; one document, two capture timestamps): "Monroe Citico Creek*", no dates.
- complete_2021a/b, 2022a/b, 2023a, 2024a/b, 2025a/b/c/d (md5s all distinct except 2019-20==2020): Citico listed each year, no per-week dates.
- Establishes: Citico remained an official stocked water every year 2018–2025; monthly granularity not published in these pages.

### 1.5 Completed-stockings archive 2024 (Wayback of TWRA completed feed; cached `completion/completed2024.txt`)
- Fields: Region 3, Destination "Citico Creek", Stocking Date 05/23/2024.
- Coverage window of that capture: 54 rows, 05/06–06/04/2024 only (partial live-feed snapshot).
- Type: completed. Confidence: high. Establishes: May 2024 completion.

### 1.6 TWRA Coldwater (Region) quarterly reports with completed stocking tables (`data/cw/cw_*.txt`)
- cw_2022may: "3 Citico Creek 04/26/2022". cw_2022aug: "3 Citico Creek 07/28/2022".
- cw_2023may: "3 Citico Creek 04/06/2023".
- cw_2024may: "3 Citico Creek 05/09/2024". cw_2024aug: "3 Citico Creek 07/17/2024".
- Type: completed. Confidence: high. Establishes: completions in Apr, May, Jul 2022–2024.

### 1.7 Completed stockings live feed, September 2026 (`completion/completed2026-jina.txt`, feed published 2026-09-24)
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable.exceldriven.json
- 10 recent rows (Aug–Sep 2026); Citico Creek NOT among them. Consistent with the seasonal pattern (2026 season ended with 7/19 week; next season Feb 2027). Negative check, not contradiction.

### 1.8 TWRA trout regulations page (tn.gov, live, retrieved 2026-09-25)
- URL: https://www.tn.gov/twra/fishing-regs/trout-regulations.html
- Tellico-Citico Permit Areas: "Tellico River from its confluence with Turkey Creek upstream to the TN-NC state line and Citico Creek from its confluence with Little Citico Creek upstream to the confluence of North and South Forks... Tellico-Citico Permit required from March 1 through Aug. 15. Closed on Thursday and Friday during the period March 1 through Aug. 15... From Aug. 16 through the last day of February, fishing is allowed every day, and Tellico-Citico Permit is not required. Daily creel limit of seven (7) trout, with no size limit."
- Delayed Harvest Areas list: Big Soddy Creek, Buffalo Creek, Doe River, Hiwassee River, Acorn Lake, Paint Creek, Piney River, Tellico River (above North River mouth). **Citico Creek is NOT a delayed-harvest water.**
- Type: regulation (defines the managed Mar 1–Aug 15 permit season that historically brackets the stocking season). Confidence: high.

### 1.9 TWRA "Trout Fishing Forecasts" story map (`data/storymap.json`; https://storymaps.arcgis.com/stories/dbb92bdf718f4fd7839bf4b08fb82747)
- Citico appears only inside the Tellico block: "Tellico-Citico Permit Type 98 required March 1 through August 15"; "August 16 - last day of February fishing is allowed every day and Tellico-Citico Permit is not required." No Citico-specific stocking-months card. Confidence: high (for permit framing).

### 1.10 TWRA ArcGIS master stocking layer (live query 2026-09-25)
- URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=json
- 15 "Citico Creek" put-points ( Monroe; one row miscoded Region 4). StockingProgram="Spring", WaterClass=stream, Species="rainbow", DayClosure="Thursday and Friday", Management USFS/TWRA mix. No DelayedHarvestSeason value.
- Type: destination-level (confirms Spring program, rainbow, Thu/Fri closure on permit reach). Confidence: high.

### 1.11 Species-record databases
- iNaturalist API (bbox 35.398–35.44 N, −84.115–−84.07 W): Oncorhynchus mykiss total 4 — 2022-06-17 (×2, "Cherokee National Forest, Tellico Plains"), 2022-07-05 (Monroe Co), 2025-07-08. Salvelinus fontinalis 0; Salmo trutta 0 in stocked reach.
- GBIF (same bbox, iNat-mediated dataset 50c9509d): same 4 records, June–July observations.
- USGS NAS: API v2 queries returned 0/error (non-productive; no Citico-specific record obtained).
- Type: observation-level leads. Establishes: rainbow trout present in stocked reach in Jun–Jul of 2022 and 2025 — consistent with late-spring/summer stocking, not evidence of a year-round fishery.

### 1.12 Angler / third-party context
- Visit Monroe County ("stocked weekly by the state in season" — https://www.visitmonroetn.com/fishing; via search, 2026-09-25).
- Tennessee River Valley Geotourism "Fishing on Citico Creek" (https://tennesseerivervalleygeotourism.org/entries/fishing-on-citico-creek/9d8ab244-5f5a-4699-bf93-99b652770ea9) — page shell only on fetch; search summary carried the permit-season text. Confidence: low-medium.
- Tellico Outfitters stream report 8/14/25 (https://www.tellicooutfitters.com): "Citico daily permit will not be needed again until March 1st, 2026" (consistent with Aug 16–Feb permit-free window). Its "Delayed Harvest and catch and release regulations begin October 1st" refers to the Tellico/North River DH water, NOT Citico (Citico absent from the official DH list). Confidence: medium for permit timing; contradicts-nothing.
- Perfect Fly Store Citico page (via search): "trout can be caught on warm days during winter, though spring is best" — holdover/winter fishing as a lead only; Instagram angler report of 64 °F summer pocket water — consistent with warm, seasonal water.
- 2026 TN Coldwater Summit (tctu.org, Feb 7 2026): "Citico Creek Dam Removal partnership" — active change on the creek; does not affect months verdict; flagged as lead.
- tndeer.com 2025 (via search snippet): Bald River Falls bridge project had delayed some Citico stockings; "returned to normal stocking operations" — lead, unverified directly (search rate-limited).
- Facebook "TWRA Fish Stocking Schedule and Information" (via search): seasonal pattern, road-condition impacts — anecdotal.

### 1.13 Wild-trout context upstream (kept separate)
- Citico Creek Wilderness (Cherokee NF, above the stocked lower reach): native Southern Appalachian brook trout in headwater tributaries; wild rainbow (and some brown) trout in the middle/upper main stem (USFS/TWRA materials; Hellbender Press 2022-06-16 Tennessee Aquarium brook-trout releases; On the Fly South "North Citico Sojourn"; Tellico Outfitters "300+ miles of wild and native trout streams"). These wild populations are NOT the stocked-fish evidence and do not support a year-round stocked claim for the lower reach.

## 2. Months-by-year stocking table (consolidated)

| Year | Months supported | Evidence grade |
|---|---|---|
| 2003 | Mar, Apr, May (weekly Mar 30–May 25) | planned, high |
| 2004 | Mar, Apr, May (3 dates) | planned, high |
| 2005 | Mar, Apr, May (weekly) | planned, high |
| 2006 | Mar, Apr, May (weekly) | planned, high |
| 2007 | Mar, Apr, May (weekly) | planned, high |
| 2008 | Mar, Apr, May (weekly) | planned, high |
| 2009 | Mar, Apr, May (weekly) | planned, high |
| 2010 | Mar, Apr, May (weekly) | planned, high |
| 2011 | none published (water listed) | planned, medium-high |
| 2012 | none published | planned, medium-high |
| 2013 | gap (schedule not captured) | — |
| 2014 | none published | planned, medium-high |
| 2015 | none published | planned, medium-high |
| 2016–2017 | not captured this pass | — |
| 2018 | none published (water listed) | planned, medium-high |
| 2019 | none published | planned, medium-high |
| 2020 | none published | planned, medium-high |
| 2021 | none published | planned, medium-high |
| 2022 | Apr (completed 04/26), Jul (completed 07/28) | completed, high |
| 2023 | Apr (completed 04/06) | completed, high |
| 2024 | May (completed 05/09 and 05/23), Jul (completed 07/17) | completed, high |
| 2025 | none published at monthly granularity | — |
| 2026 | Feb–Jul (22 weekly "week of" dates 2/22–7/19) | planned, high |

## 3. Holdover / year-round test

- No year-round claim found in any TWRA source for the stocked reach; program type is "Seasonal" (2026 JSON) / "Spring" (master layer). Off-season (Aug 16–end Feb) is open daily without permit — the regulation anticipates fishing when stockings are NOT occurring. Winter catches are possible but the record base is single angler anecdotes (Perfect Fly Store) — lead grade only. No creel/survey document asserting holdover fishery quality was found this pass.

## 4. Contradictions

- None material. Minor: (a) master layer's stray "Region 4" row vs Region 3 in schedules/JSON (row-level typo); (b) Tellico Outfitters report loosely attributes "Delayed Harvest... begins October 1st" to the Citico area — official DH list excludes Citico (the DH reach is Tellico above North River); (c) 2011–2015 "Polk" county label vs Monroe (TWRA table error, same water).

## 5. Searches run (Citico)

Productive: (1) "Citico Creek" trout stocking TWRA schedule months; (2) "Citico Creek" delayed harvest (2019 DH-rule lead — actually the Tellico DH; treated as contradiction-resolved); (3) Citico Creek Wilderness brook/wild trout Cherokee NF; (4) Citico Creek holdover winter Tellico Plains (geotourism/perfectfly/visitmonroe); (5) USFS Cherokee NF Citico Tellico-Citico permit (TFWC 2016 record: older permit-free window "Sep 16–Mar 14" — historical reg change); (6) Citico Creek stocked weekly 2026 (Tellico Outfitters stream report, TUCTU summit, tndeer lead); (7) live tn.gov trout regs page fetch; (8) 2026 schedule JSON; (9) sched03–15 grid decode; (10) 2018–2025 complete pages + md5s; (11) cw quarterly completions; (12) 2024 completed archive; (13) Sept-2026 completed feed; (14) storymap JSON; (15) ArcGIS master layer query; (16) iNat API (bbox + text); (17) GBIF API.
Unproductive/rate-limited: USGS NAS v2 API (0/error); "Citico Creek Bald River Falls bridge 2025" (search 429s); geotourism page fetch (JS shell); twra_trout_json_2024.json cache (non-JSON error page); winter-trout files (no Citico — confirms not a winter-trout water).

## 6. Recommendation

CONFIRM `seasonal-stocked-trout`, months pinned: **February–July** for the current program (2026 weekly plan Feb 22–Jul 19; completions recorded Apr/May/Jul 2022–2024), **historically March–May** (2003–2010 weekly plans). If one label must cover the modern era: "stocked spring through early summer (Feb–Jul); core documented completions Apr–Jul; 2003–2010 plans ran Mar–May." No year-round or holdover-fishery claim is supported; keep upstream wilderness wild-trout populations out of this classification.

## 7. Gaps

- 2013, 2016, 2017 schedule pages not captured; 2025 monthly plan not published at monthly granularity (no X grid).
- No TWRA numeric stocking totals (fish/weight) for Citico in cached coldwater reports.
- NAS occurrence record not obtained (API quirk); USFS Cherokee NF fishing page not fetched directly (search-level only).
