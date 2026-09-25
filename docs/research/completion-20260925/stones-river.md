# stones-river.md — Stones River main stem, Davidson County (J. Percy Priest tailwater / lower river)

Ledger verdict under test: `seasonal-stocked-trout`, months [12,1,2,3]
Research pass: 2026-09-25 (all retrieval dates 2026-09-25 unless noted). Internal classification research only.

## 1. Identity / reach / coordinates

- Water: Stones River main stem below J. Percy Priest Dam, Nashville, Davidson County, TN (Region 2).
- TWRA GIS stocking-site row (TWRA_Trout_Stocking_Locations FeatureServer, OBJECTID 660): Site_Name "J. Percy Priest Tailwater", StreamName "Stones River", 36.15857505, -86.61937753, Nashville, Davidson, StockingProgram "Winter", WaterClass "stream", Species "rainbow", NumStocked 14000, Management "USACE". Same row (frozen) in StockedTrout2016 layer, CollectorName "J. Percy Priest Tailwater", CreationDate 2017-04 (epoch 1492459087216).
  URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/ArcGIS/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0/query?where=1%3D1&outFields=*&f=json
- Tailwater_Trout FeatureServer, OBJECTID 7: Name "Stones River", Species "rainbow", Season "December through March", Dam "J Percy Priest Dam", Shape__Length 35,941.6 ft (6.8 mi). Polyline (29 vertices, WGS84): dam end (-86.61910, 36.15606) → downstream end (-86.66325, 36.19256). The downstream end coincides with the Stones River–Cumberland River confluence (USGS station 03430250 "Cumberland River at Stones River near Hermitage", 36.19167, -86.66528). I.e., the stocked reach = the ENTIRE free-flowing tailwater from the dam to the Cumberland confluence (~6.8 river miles).
  URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/ArcGIS/rest/services/Tailwater_Trout/FeatureServer/0/query?where=OBJECTID%3D7&outFields=*&returnGeometry=true&outSR=4326&f=json
- USACE mile markers on the tailwater (WQP Station search, Davidson Co.): USACOEND-3JPP10019 "Stones River Mile 6.4" (36.1608, -86.6214) … USACOEND-3JPP10023 "Mile 1.8" (36.1717, -86.6592) — miles count down to the Cumberland.
- USGS-03430100 "Stones River below J Percy Priest Dam, TN" (36.15826, -86.62012); USGS-03430200 "at US Hwy 70 near Donelson" (36.18644, -86.63278); TDECWPC-STONE003.9DA; TDECWR_WQX-TNW000006040/6041/6042.
  URL: https://www.waterqualitydata.us/data/Station/search?statecode=US%3A47&countycode=US%3A47%3A037&mimeType=csv

## 2. Source-by-source evidence

### 2.1 TWRA 2026 trout stocking schedule JSON (planned, 2026) — retrieval 2026-09-25
- File: tn_complex_datatable_1990410459.exceldriven.json (616 rows; local copy `tmp/research/completion/trout_2026_live.json`).
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json
- Rows (REGION 2, Davidson, "J. Percy Priest TW / Stones River", TYPE Winter, Rainbow Trout): STOCKING DAY 1/9/2026; 02/13/2026; TBD 12/2026.
- Fields: planned date-level events. Months supported for 2026: 12, 1, 2. NO March row.
- Establishes: winter program stocking at the named water in 2026 in Dec/Jan/Feb. Type: agency, HIGH.

### 2.2 TWRA Tailwater Trout Stocking schedule PDF (planned, multi-year Wayback/local captures)
Per-capture rows for "Stones River*  J. Percy Priest Dam  Rainbow Trout …":
| Capture | Season window stated | File |
|---|---|---|
| (undated, ~2017) | December through March | scheds/tailwater-sched.txt |
| 2018 (twsched-2018) | December through March | scheds/twsched-2018.txt |
| 2020 | December through March | tailwater-stocking-schedule-2020.txt |
| 2021-11-24 | December through March | scheds/twsched-20211124063518.txt |
| 2023-02-24 | December through FEBRUARY | scheds/twsched-20230224.txt |
| 2024-12-04 | December through FEBRUARY | scheds/twsched-20241204004432.txt |
| 2025-09-02 | December through FEBRUARY | scheds/twsched-20250902003646.txt |
- URLs (Wayback pattern): https://web.archive.org/web/20211124063518/https://www.tn.gov/twra/fishing/trout-information-stockings.html (page → linked tailwater PDF); local pdftotext copies in tmp/research/completion/scheds/.
- FOOTNOTE in every capture: "* Seasonal Fishery - only productive during stocked months." — TWRA's own classification of the Stones tailwater as a SEASONAL fishery (agency holdover statement).
- CONTRADICTION: TWRA's PDF table narrowed Stones from "Dec–Mar" (through Nov 2021 capture) to "Dec–Feb" (Feb 2023 capture onward), while its HTML page, ArcGIS layer and eRegulations still say "Dec–Mar".
- Type: agency, HIGH (planned months per season).

### 2.3 eRegulations Tennessee (current book, 2026-27) — retrieved 2026-09-25
- URL: https://www.eregulations.com/tennessee/fishing/trout-regulations
- Row: "Stones River | J. Percy Priest Dam | Rainbow | December through March*" with footnote "*Seasonal fishery – only productive during stocked months."
- Region 2 page (https://www.eregulations.com/tennessee/fishing/region-2): no trout rows (negative; reservoir regs only; Percy Priest boundary note "Includes Stones River up to J. Percy Priest Dam").
- Type: agency regs book, HIGH. Establishes official Dec–Mar wording + seasonal-fishery footnote.

### 2.4 TWRA live stockings page (captured Sept 2026) — local `stockings-live-raw.html`, `stockings-live.html.txt`
- Tailwater section: "Tailwater Trout Stocking Information … Region II … J. Percy Priest Dam, Stones River - Rainbow - December through March - Statewide Regulations". (Also the generic line "In many tailwaters, trout fishing can be good year-round" — generic, not Stones-specific.)
- Live page URL: https://www.tn.gov/twra/fishing/trout-information-stockings.html
- Type: agency, HIGH for wording; adds no event-level data.

### 2.5 Winter Program (November–March) schedules — TWRA news releases, Wayback
All retrieved 2026-09-25 via https://web.archive.org/web/<ts>/https://www.tn.gov/twra/news/<slug>.html ; local copies news_*.html / news2_*.html in $HOME.

| Season (release) | J. Percy Priest Tailwater planned stocking dates | Months supported |
|---|---|---|
| 2012-13 (state.tn.us "stockedtrout 2012-13" page, updated 1-8-2013; https://web.archive.org/web/20130110154309/http://www.state.tn.us/twra/fish/StreamRiver/stockedtrout/stockedtrout%202012-13.html) | Nov 30 2012; Jan 4 2013; Feb 1 2013; Mar 1 2013 | 11,12,1,2,3 |
| 2013-14 (state.tn.us wintertrout.pdf, updated 12/04/13; https://web.archive.org/web/20140112202400/http://www.state.tn.us/twra/fish/StreamRiver/stockedtrout/wintertrout.pdf) | Dec 11 2013; Jan 3 2014; Jan 31 2014; Feb 28 2014 | 12,1,2 |
| 2014-15, 2015-16 | no schedule recovered (gap) | — |
| 2016-17 (news 2016/12/7 + 2017/1/5) | Dec 2 2016; Jan 6 2017; Jan 27 2017; Feb 24 2017 | 12,1,2 |
| 2017-18 (news 2017/11/28 + 2018/1/5) | Dec 1 2017; Jan 5 2018; Jan 26 2018; Feb 23 2018 | 12,1,2 |
| 2018-19 (news 2018/11/21 + winter_trout_2018.pdf) | Nov 30 2018; Jan 25 2019; Feb 22 2019 | 11,1,2 |
| 2019-20 (news 2019/12/3 + 2020/1/2) | Dec 31 2019; Jan 31 2020; Feb 28 2020 | 12,1,2 |
| 2020-21 | schedule rows not in recovered releases (gap) | — |
| 2021-22 (TWRA "Coldwater Trout Stocking Schedule", updated 2/18/2022; local scheds/ts2022cold.txt) | NO J. PERCY PRIEST ROW (while Normandy TW and Tims Ford TW rows present) | negative row / anomaly |
| 2026 (2026 JSON, §2.1) | Jan 9, Feb 13, TBD Dec 2026 | 12,1,2 |

Note: 2016-17 release column-salvage — city fields jumble in layout mode but "J. Percy Priest Tailwater Nashville" rows are unambiguous.

### 2.6 Completed-level records
- TWRA "Coldwater Stocking" report snapshot dated 11-16-2018 (local scheds/cw_stocking_2019.txt; Wayback of state.tn.us coldwater report): "J. Percy Priest TW — 2/23/2018" (Region 2). Completed event, Feb 2018. HIGH.
- TWRA Trout Stocking Report (completed, rolling ~monthly): June 7 2024 archived JSON (https://web.archive.org/web/20240607134309/…/tn_complex_datatable.exceldriven.json) — 54 rows, NO Stones rows (summer window; expected). Sept 2024 PDF (scheds/stocking-report-2024.txt, updated 9/27/2024) — no Stones (expected). Live Sept 2026 completed feed (completed2026-jina.txt) — no Stones (expected). These negatives are consistent with a winter-only program but do NOT themselves evidence winter events.
- Winter-window completed captures exist (2019-01-14, 2019-04-24, 2024-12-08, 2025-01-14 pages) and DO list "J. Percy Priest TW" among destinations (e.g., 2019 captures show "J. Percy Priest TW … 12/11/2018 / 3/7/2018"; 2024-25 captures list the destination), but those pages render the table via AJAX and Wayback did not archive the JSON, so destination→date pairing is scrambled. Counts as destination-level completed evidence only.

### 2.7 Holdover / summer evidence
- Agency statement (strongest): eRegulations + tailwater PDF footnote — "* Seasonal Fishery - only productive during stocked months." Direct TWRA statement that the fishery is NOT productive outside stocked months.
- iNaturalist API (2026-09-25): Oncorhynchus mykiss within 10 km of (36.17, -86.64): only 2 records, both Cumberland-side (Shelby Park 2021-03-16 id 71392219; East Nashville 2023-03-15 id 151274863). Within 7 km of the tailwater center (36.165, -86.63): ZERO. No community-science record of summer trout in the tailwater.
- USGS 03430100 (below dam): no temperature parameter published (negative).
- Fishbrain-derived summary via WebSearch: the Stones tailwater area is fished mainly for largemouth/smallmouth/bluegill — warmwater identity outside the trout window (low-confidence, aggregator).
- No agency creel/electrofishing document on tailwater trout survival located — gap.

## 3. Months-by-year stocking table (planned unless noted)
| Season | PP TW months | Evidence tier |
|---|---|---|
| 2012-13 | 11,12,1,2,3 | planned, agency, HIGH (March: Mar 1 2013) |
| 2013-14 | 12,1,2 | planned, HIGH |
| 2014-15 / 2015-16 | not recovered | GAP |
| 2016-17 | 12,1,2 | planned, HIGH |
| 2017-18 | 12,1,2 | planned, HIGH |
| 2018-19 | 11,1,2 | planned, HIGH |
| 2019-20 | 12,1,2 | planned, HIGH |
| 2020-21 | not recovered | GAP |
| 2021-22 | (no row in completed/planned coldwater table) | anomaly |
| 2022-23→2025-26 | Dec–Feb (PDF wording); no event-level rows recovered | planned wording, HIGH |
| 2026 | 12,1,2 | planned dates, HIGH |
| 2018 (completed) | 2 (2/23/2018) | completed, HIGH |

Species every year: rainbow trout only (all surfaces). Numbers: 14,000/year (GIS NumStocked); "approximately 2,000" per event at the sister site per TWRA's Jim Pipas (WKRN, sister-site corroboration).

## 4. Contradictions
1. "December through March" (ArcGIS Tailwater_Trout [live], eRegulations 2026-27, TWRA live HTML 2026, tailwater PDFs ≤2021) vs "December through February" (tailwater PDFs 2023-02, 2024-12, 2025-09).
2. No actual March event documented since Mar 1, 2013 for the main stem; 2026 dates are Dec/Jan/Feb only.
3. TWRA HTML boilerplate "In many tailwaters, trout fishing can be good year-round" vs Stones-specific footnote "Seasonal Fishery – only productive during stocked months" (Stones carries the asterisk; the year-round line is generic).
4. 2021-22 coldwater table omits Percy Priest TW (and Nice Mill) while listing other Region 2 tailwaters — unexplained single-year omission.

## 5. Verdict
- `seasonal-stocked-trout` STANDS. The water is a rainbow-trout, winter-program tailwater; TWRA itself stamps it "Seasonal Fishery – only productive during stocked months"; no holdover record exists anywhere (iNat zero; agency footnote negative).
- Months: Dec–Feb are high-confidence in every recovered year (2012-13→2026). March is the weak leg for the MAIN STEM: it appears in official month-range wording (still "Dec–Mar" on 4 live/official surfaces) and in one planned event (3/1/2013), but the TWRA tailwater PDF has said Dec–Feb since 2023 and no March event is documented after 2013 (main stem). November appears in 2012-13, 2018-19 plans (pre-window edge).
- RECOMMENDATION: keep verdict `seasonal-stocked-trout`. Keep months [12,1,2] at high confidence; retain month 3 ONLY as low-confidence/legacy (official wording) or drop to [12,1,2] — preferred: months [12,1,2] + note that official range text still reads "December through March*". Do not extend into summer on holdover speculation.

## 6. Searches run (2026-09-25; incl. unproductive)
1. WebSearch "TWRA 'J. Percy Priest' tailwater trout stocking Stones River rainbow winter" — BLOCKED (429).
2. WebSearch "'Percy Priest' tailwater trout fishing Stones River summer holdover survival" — BLOCKED (429).
3. WebSearch "Stones River below Percy Priest Dam trout fly fishing report" — timed out.
4. WebSearch "Tennessee eRegulations 'Stones River' trout 'December through March' Region II" — partial (rate limits), led to eRegulations pages.
5. WebSearch "Stones River below Percy Priest Dam fishing bass tailwater Nashville access" — OK: TWRA bank access (West Jefferson Pike/Hwy 266, Percy Priest WMA); Fishbrain: bass/bluegill identity.
6. WebSearch "TWRA winter trout stocking program Tennessee 'Percy Priest' OR 'Nice Mill' 2020 OR 2021 OR 2022 news" — partial: Tennessean "Midstate outdoors calendar" (Jan 2016) lists Nice Mill winter stocking; Patreon report asks "Are there still stocked trout at Nice Mill in Smyrna?" (Jan 6, yr n/s).
7. WebSearch "Stones River Nashville trout fishing winter greenway stocked rainbow" — OK: Chattanoogan 2010-11-29 "Winter Trout Stocking Dates Announced" (88,000 rainbows, Dec–Mar) [snippet only].
8. WebSearch "chattanoogan.com 'Winter Trout Stocking' TWRA 2010 dates announced" — snippet only; article URL not exposed.
9. WebFetch chattanoogan.com guessed article URL — wrong article (crime story); negative.
10. WebFetch chattanoogan.com site-search URL — 404; negative.
11. WebFetch eregulations.com/tennessee/fishing — nav page; → trout-regulations link.
12. WebFetch eregulations.com/tennessee/fishing/trout — 404; negative.
13. WebFetch eregulations.com/tennessee/fishing/trout-regulations — CONFIRMED "December through March*" + seasonal footnote.
14. WebFetch eregulations.com/tennessee/fishing/region-2 — no trout rows; negative.
15. ArcGIS: TWRA_Trout_Stocking_Locations query (Percy Priest row); Tailwater_Trout OBJECTID 7 + geometry; StockedTrout2016 frozen rows; services directory — all OK.
16. 2026 schedule JSON parse (3 Percy Priest rows) — OK.
17. Wayback news releases 2012-13→2024-25 (11 pages fetched/parsed) — OK; 2021+ releases contain no inline schedules (negative).
18. Wayback winter-window completed-report captures (2019-01-14, 2019-04-24) — destination listed, date mapping scrambled (AJAX JSON not archived) — partial.
19. Wayback June-2024 completed JSON — no Stones rows (summer window; expected-negative).
20. USGS waterservices: 03430100 exists; no 00010 temp series — negative.
21. iNaturalist API rainbow @tailwater (r=10 km, r=7 km) — zero on tailwater — negative.
22. WQP Station search Davidson — USACE/USGS/TDEC stations listed; supports reach mapping.
23. Retried Wayback CDX intermittently — "Temporarily Offline" periods noted (2026-09-25).
