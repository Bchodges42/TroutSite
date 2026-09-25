# Big Soddy Creek (Hamilton County) — Seasonal Stocked Trout Evidence Log

Water: Big Soddy Creek, Hamilton County, TN (TWRA Region 3), Soddy-Daisy; stocked reach = the "Big Soddy Creek Gulf" reach upstream of Back Valley Road.
Ledger verdict under test: `seasonal-stocked-trout` (months unpinned). Research date: 2026-09-25. Research only; no agency contact.

## Water identification / reach

- Creek rises on Walden's Ridge near Flat Top Mountain, flows ~20 mi to Chickamauga Lake (Soddy-Daisy). Stocked/DH reach = ~1+ mile in the City of Soddy-Daisy's Big Soddy Creek Gulf Wilderness Area (Back Valley Rd corridor), also contiguous with Cumberland Trail State Park water upstream.
- TWRA master stocking layer put-points (5 sites, all "Site 1–5", Management=City):
  - Site 1: 35.300304, −85.172105; Site 2: 35.300190, −85.176654; Site 3: 35.303299, −85.182072; Site 4: 35.301922, −85.169478; Site 5: 35.301618, −85.166623
- DH regulatory boundary: "Upstream of Back Valley Road" (TWRA trout regulations, retrieved 2026-09-25).

## 1. Sources

### 1.1 TWRA 2026 Trout Stocking Schedule JSON (planned)
- Title: 2026 stocking schedule datatable JSON, TWRA. Retrieved 2026-09-25 (cache `data/sched2026.json`, 616 rows; duplicate `completion/trout_2026_live.json`).
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json
- 9 rows for Big Soddy Creek (Region 3, Hamilton, SPECIES=Rainbow Trout):
  - TYPE=Delayed Harvest: weeks of 02/08/2026, 02/22/2026, 10/25/2026, 11/29/2026
  - TYPE=Seasonal: weeks of 03/08/2026, 03/22/2026 (×2 rows), 04/19/2026, 04/26/2026
- Month buckets: Feb 2 (DH), Mar 3 (Seasonal), Apr 2 (Seasonal), Oct 1 (DH), Nov 1 (DH).
- Type: planned. Confidence: high. Establishes: current-year plan = DH stockings Feb + Oct/Nov and spring "Seasonal" stockings Mar/Apr; rainbow trout only.

### 1.2 TWRA trout regulations page (tn.gov, live, retrieved 2026-09-25)
- URL: https://www.tn.gov/twra/fishing-regs/trout-regulations.html
- "Delayed Harvest Areas ... Big Soddy Creek: Upstream of Back Valley Road. Catch-and-release season Nov. 1 - Feb 28." Artificial lures only; bait prohibited during the C&R season. (Full official DH list: Big Soddy Creek, Buffalo Creek, Doe River, Hiwassee River, Acorn Lake, Paint Creek, Piney River, Tellico River.)
- Type: regulation. Confidence: high. Establishes: Big Soddy Creek is an official Delayed-Harvest water; C&R window Nov 1–Feb 28 (start recently moved from Oct 1 — see 1.10/1.12). Stocking occurs to support this season (fall pre-season + in-season Feb), then open harvest Mar 1.

### 1.3 TWRA yearly stocking pages 2022–2025 (`data/complete/complete_20*.pdf/txt`; tn.gov captures, md5s distinct except noted)
- Layout rows (grep + offset decode of DH markers against month header):
  - complete_2022a and 2022b (two captures, one document?): "Hamilton Big Soddy Creek DH DH" — markers ≈ Feb + Sep/Oct. (2019-20==2020 md5 d8beba… replay trap did NOT affect 2022a/b: 6228d37e… vs 9c75adf3… distinct.)
  - complete_2023a: "DH DH" ≈ Feb + Oct.
  - complete_2024a/2024b: "DH DH" ≈ Feb + Aug/Sep (offset decode noisy at right edge; conservative read = winter + fall).
  - complete_2025a/2025b/2025d: "DH DH DH" ≈ Jan/Feb cluster + fall.
- 2019-20/2020/2021a/2021b pages: Big Soddy Creek ABSENT (grep count 0). sched03–15 (2003–2015) and the 2018 schedule: absent (no "soddy" match anywhere).
- Type: planned. Confidence: high for presence/absence of the row; medium for the exact marker months (offset decoding on the DH markers is noisier than the old X-grids; markers are reliably "1–3 DH stockings per year, one late-winter + one/two fall").
- Establishes: program ran 2022–2025 as DH-first (1–3 DH stockings/yr); water NOT in TWRA schedules before ~2022 in any cached capture.

### 1.4 TWRA Coldwater (Region) quarterly reports — completed stockings (`data/cw/cw_*.txt`)
- cw_2022may: "3 Big Soddy Creek 05/12/2022". cw_2024may: "3 Big Soddy Creek 05/01/2024".
- No Soddy rows in cw_2022feb/2023feb/2024feb or the aug files (their fall-DH completions simply were not in these captured quarters' tables).
- Type: completed. Confidence: high. Establishes: spring completions in early May 2022 and May 2024 (put-and-take outside the DH C&R window).

### 1.5 Completed-stockings archive 2024 (`completion/completed2024.txt`, Wayback of TWRA completed feed)
- Coverage 05/06–06/04/2024 only; NO Soddy row. NOT a contradiction: the 05/01/2024 completion (cw_2024may) predates the capture window. Negative check explained.

### 1.6 Completed stockings live feed, September 2026 (`completion/completed2026-jina.txt`, feed published 2026-09-24)
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable.exceldriven.json
- 10 recent rows (Aug–Sep 2026); Big Soddy Creek absent — consistent: next scheduled DH weeks are 10/25 and 11/29/2026. Negative check, not contradiction.

### 1.7 TWRA "Trout Fishing Forecasts" story map (`data/storymap.json`; https://storymaps.arcgis.com/stories/dbb92bdf718f4fd7839bf4b08fb82747)
- Node "Catch Trout at Big Soddy Creek Gulf" (title/caption) with full text: "Big Soddy Creek originates on Walden's Ridge near Flat Top Mountain and flows nearly 20 miles ... TWRA has partnered with the City of Soddy Daisy to create a new trout fishery in Big Soddy Creek. Soddy Daisy owns and manages Big Soddy Creek Gulf Wilderness Area. There is a well-developed trail that parallels Big Soddy Creek for over one mile... two large parking areas off Back Valley Road and easy access from Highway 111. **The water is not cold enough to support trout year-round but should provide 7-8 months of excellent trout fishing.** Public access is excellent for bank or wade fishing."
- Companion flow node: USGS gauge on North Chickamauga Creek as flow reference; wading difficult above 250–300 cfs.
- Type: official TWRA program description. Confidence: high. Establishes: (a) put-and-take fishery by design; (b) TWRA's own statement that the water cannot hold trout year-round → seasonal verdict; (c) 7–8 months of intended fishing season (consistent with fall-through-early-summer stocking + DH window).

### 1.8 TWRA ArcGIS master stocking layer (live query 2026-09-25)
- URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=json
- 5 Big Soddy Creek sites; StockingProgram="Spring"; Species="rainbow"; Management="City"; DelayedHarvestSeason="Oct 1 to last day of Feb"; DailyPermitRequired="No".
- Type: destination-level. Confidence: high. Establishes dual program (spring stockings + DH season) as of the 2025-era layer; the "Oct 1" DH start shown here was superseded by the current Nov 1 regs (1.2) — layer slightly stale on that field.

### 1.9 Species records (iNaturalist / GBIF / NAS)
- iNaturalist API bbox (35.293–35.31 N, −85.19–−85.16 W), Oncorhynchus mykiss: 6 records — 2026-02-06 ×4 ("Jones Gap Rd, Soddy Daisy"), 2026-04-07 ("Jones Gap Rd"), 2026-04-10 (Hamilton Co). Salmo trutta 0; Salvelinus fontinalis 0.
  - Feb 6, 2026 observations: trout present BEFORE the 2/8/2026 DH week → fish carrying over from the fall 2025 DH stocking (consistent with DH design: stocked fall, C&R through Feb).
  - Apr 7/10, 2026: consistent with the Mar/Apr "Seasonal" weeks (3/8–4/26).
  - Matches prior-pass lead "iNat trout record at Big Soddy Creek (Jones Gap Rd)".
- GBIF: 0 records in the same bbox (iNat records not GBIF-mediated/open) — gap, not contradiction.
- USGS NAS: API v2 queries returned 0/error (non-productive).
- Type: observation-level corroboration. Confidence: medium-high (geo-verified, species-verified).

### 1.10 Third-party / press
- Chattanooga Times Free Press, "Beat cabin fever..." 2023-11-06 (https://www.timesfreepress.com/news/2023/nov/06/beat-cabin-fever-winter-delayed-harvest-tfp/; fetched 2026-09-25, partial paywall): TWRA "stocked hundreds of trout into Big Soddy Creek for the delayed harvest (DH) season" that fall; fish "scattered to settle into holes and runs across more than a mile of clear, cold creek"; rainbow trout; fall stockings coincide with cold November rains. Type: journalism on completed event. Confidence: high. Establishes: fall (November) 2023 DH completion.
- Piscamaps listing (via search): "TWRA trout-stocked water. Delayed-harvest ... section. It runs roughly 1 mile" — corroborates reach length. Doubledfly (guide, via search): winter/DH destination near Chattanooga. Confidence: low-medium (commercial).
- TFWC 2025/2026 regulation cycle (via search snippets, smithcountyinsider/henrycountynow): DH start on Big Soddy Creek moved Oct 1 → Nov 1. Corroborated independently by the live regs page (Nov 1) vs the 2025-era GIS layer (Oct 1). Confidence: high for the change having occurred; medium for which meeting minute.
- Live tn.gov "Trout Fishing & Stockings" page (2026-09-25 capture): "Big Soddy Creek" in destination picker; reader-mode date jumble unusable for attribution (though an orphan "M, A, N, D"-style month-letter string in the same jumble is suggestive of Mar/Apr + Nov/Dec months, attribution cannot be proven — discarded).

### 1.11 Negative checks
- Winter trout program files (winter_trout_2018.pdf; Tennessee-winter-trout-stocking-report.txt): no Soddy (its DH is separate from the "Winter Trout" program).
- TWRA Trout Management Plan 2017–2027 (cached text): no Soddy mention (program post-dates the plan text or is too minor for the plan).
- Coldwater-Hatchery-Report-2016 / coldwater fisheries reports 2016–2017: no Soddy (consistent with pre-2022 absence).

## 2. Months-by-year stocking table (consolidated)

| Year | Listed in TWRA schedule? | Months supported | Evidence grade |
|---|---|---|---|
| 2003–2015 | No (absent from sched03–12, 14, 15) | — | high (absence) |
| 2016–2017 | not captured this pass | — | — |
| 2018 | No (2018 schedule) | — | high (absence) |
| 2019–2021 | No (yearly pages) | — | high (absence) |
| 2022 | Yes | DH ≈ Feb + fall (markers); spring completion 05/12/2022 | planned medium + completed high |
| 2023 | Yes | DH ≈ Feb + Oct (markers); fall completion Nov (CTFP) | planned medium + completed high |
| 2024 | Yes | DH ≈ Feb + fall (markers); spring completion 05/01/2024 | planned medium + completed high |
| 2025 | Yes | DH ×3 ≈ late winter + fall (markers) | planned medium |
| 2026 | Yes | Feb (DH, 2 wks), Mar (Seasonal, 3 wks), Apr (Seasonal, 2 wks), Oct (DH), Nov (DH) | planned, high |

## 3. Holdover / year-round test

- TWRA's own story map: "The water is not cold enough to support trout year-round but should provide 7-8 months of excellent trout fishing" — explicit NO year-round. DH C&R window (Nov 1–Feb 28) is a catch-and-release preservation of stocked fall fish, not evidence of a self-sustaining/holdover-breeding population; freestone warm-summer hydrology (USGS N. Chickamauga gauge reference) supports seasonal character. No creel/survey evidence of over-summer survival found; iNat records cease after April (none May–Oct).

## 4. Contradictions

- DH season start: ArcGIS layer field "Oct 1 to last day of Feb" vs live regs "Nov. 1 - Feb 28" — regulation change (Oct→Nov start, 2025/2026 cycle); live regs govern. Affects the interpretation of the 10/25/2026 DH stocking week (pre-season stocking for a Nov 1 opener).
- 2026 spring "Seasonal" weeks run Mar–Apr, while the two captured spring completions landed May 1 (2024) / May 12 (2022) — the spring put-and-take window has drifted earlier; treat spring months as Mar–May across years, Mar–Apr in the current plan.
- Guide-site characterization ("late fall through winter" stocking, piscamaps/doubledfly summaries) understates the documented spring (Seasonal) component; official JSON + completions govern.

## 5. Searches run (Big Soddy)

Productive: (1) "Big Soddy Creek" delayed harvest stocking Soddy-Daisy; (2) TWRA DH list Oct/Nov–Feb (found live regs page); (3) CTFP Nov 2023 DH article search + direct fetch; (4) TFWC Oct→Nov 1 DH change search (snippet + regs corroboration); (5) live tn.gov trout regs fetch and DH-list extraction; (6) 2026 schedule JSON; (7) complete_2022–2025 pages + DH-marker decode + md5s; (8) cw_2022may/cw_2024may completions; (9) storymap "Big Soddy Creek Gulf" node; (10) ArcGIS master layer (5 sites, DelayedHarvestSeason field); (11) iNat bbox queries (6 rainbow records); (12) 2018 + 2019–2021 + sched03–15 absence checks; (13) winter-trout negative check; (14) GBIF (0); (15) live stockings page capture (destination picker).
Unproductive/rate-limited: "Big Soddy Creek holdover summer rainbow" search (429s — TWRA storymap statement supersedes); TFWC minute direct fetch (not attempted beyond snippets); USGS NAS API (0/error); sched13/2016/2017 pages not captured.

## 6. Recommendation

CONFIRM `seasonal-stocked-trout` (with a Delayed-Harvest backbone), months pinned: **October–November (fall DH stocking), February (winter DH stocking), and March–April spring "Seasonal" stockings in the current plan (spring completions documented in early May 2022/2024)**. Compact label for the ledger: "stocked Feb (DH), Mar–Apr (seasonal; completions to early May in 2022/2024), Oct–Nov (DH)". No year-round/holdover claim — TWRA states the water cannot support trout year-round (7–8 months of fishery). DH regulation (not stocking) runs Nov 1–Feb 28, artificial only.

## 7. Gaps

- Numeric stocking totals per event (fish counts) not found in captured reports.
- 2016–2017 schedules uncaptured (first appearance in TWRA schedules pinned only to "by 2022").
- Exact 2022–2025 DH marker months rest on offset-decoded markers (medium confidence); no fall-month completion document captured for Soddy other than CTFP Nov 2023.
- GBIF/NAS provide no independent occurrence record; iNat is the sole species-record base.
