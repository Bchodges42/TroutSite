# Wolf River (Fentress County) — trout-evidence research log

Water: Wolf River, Fentress County TN (Cumberland Plateau). Rises in Fentress County, flows N through Pall Mall (Sgt. Alvin C. York State Historic Park) into Pickett County, and enters the **Obey River arm of Dale Hollow Reservoir** (HUC-8 05130105 "Obey"; GNIS 00507027/01282319; USGS gauge 03416000 "Wolf River near Pall Mall").

**GEOGRAPHIC CORRECTION to the tasking:** the tasking asserts this Wolf flows "into the New River/Big South Fork system." That is wrong. The New River/BSF watershed is HUC 05130104 (South Fork Cumberland), a separate drainage east of the Wolf; the prior New River pass (tmp/research/nine-water/new-river.md, A9/A10) confirms all its gauges and NAS records sit in 05130104, while the Wolf's gauge 03416000 and the TWRA Dale Hollow rule reach sit in 05130105. A 1939 museum collection label calls the Rotten Fork "headwaters of Wolf River, N of Jamestown; **Obey River system**" (GBIF, below). Repo docs/GEO-AUDIT.md line 137 (TIGER/NHD) and docs/reports/stage1-session-b.md ("feeds Dale Hollow Reservoir (Obey River system)") already corrected this. The BSF/New River prior passes are therefore context-only; the Wolf was never among their sampled tributaries (they sampled Indian Fork, Smoky Creek, Beech Fork, Straight Fork, Buffalo, Brimstone, Black Wolf, Bear Creek — none in 05130105).

Retrieval date for all sources: **2026-09-25** unless noted. No agency/business/author/angler contact. No catalog/ledger edits. Research only.

**RECOMMENDATION (bottom line): the `mixed` verdict HOLDS — upgrade confidence.**
- **Trout leg: spring put-and-take rainbow trout, exactly THREE events per year, one each in MARCH, APRIL, and MAY** — decoded directly from TWRA's own schedule grids for 2003–2011, 2014–2015, 2018–2026 (19 years; 2012–2013 medium-confidence), plus a completed May-16-2024 release and the current GIS "Spring" program label. No DH, no winter, no summer trout program, no holdover/reproduction evidence.
- **Warmwater leg: agency-documented smallmouth fishery** — TWRA's species-rule reach "Wolf River South Ford Road Bridge downstream into Dale Hollow Reservoir" (2/day, 16–21 in PLR) + "anglers often report catching spotted bass in the upper portions of the Wolf River" + museum-vouchered smallmouth/spotted bass on the Wolf 1939–2011.
- Exact trout months: **March, April, May** (events in the weeks of the second Sundays of each month in recent years; e.g., 2026 = 3/8, 4/12, 5/10).

---

## A. Agency / operational sources

### A1. TWRA 2026 trout stocking schedule JSON (planned evidence; verified twice)
- Title: Trout Stocking Schedule datatable (exceldriven JSON, 616 rows)
- Org: TWRA. Observation period: 2026 season. Retrieved 2026-09-25 (live WebFetch) — and identically present in the prior-pass captures `tmp/research/data/sched2026.json` and `tmp/research/completion/trout_2026_live.json` (616 rows each).
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json
- Wolf rows (all three, verbatim fields): `{"REGION":"3","COUNTY":"Fentress","LOCATION":"Wolf River","TYPE":"Seasonal","STOCKING DAY":"","STOCKING WEEK":"3/8/2026","STOCKING MONTHS":"","SPECIES":"Rainbow Trout"}`; identical for **4/12/2026** and **5/10/2026**. No Region 1 / Shelby "Wolf River" rows exist in the 2026 JSON (Memphis-area waters are Cameron Brown Lake, Edmund-Orgill, Johnson Park Lake, Shelby Farms, Yale Road Park) — no conflation risk this cycle.
- Fields: county join = Fentress; TYPE=Seasonal (not "Delayed Harvest", not "Winter", not "Weekly"); species Rainbow Trout; 3 "week of" dates (Sundays; the schedule page states events happen "within five days after the date listed").
- Type: agency operational schedule (planned). Confidence: HIGH. Establishes: 2026 months = March, April, May; Seasonal program. Does not establish: completion (see A2/A3), holdover.

### A2. Completed-stocking feed, 2024 committed archive (destination-level completed evidence)
- File: `tmp/research/data/committed2024.json` (prior-pass capture of the TWRA completed-stockings datatable endpoint `.../tn_complex_datatable.exceldriven.json`). Row verbatim: `{"Region":"3","Destination":"Wolf River","Stocking Date":" 05/16/2024"}`.
- Cross-check: 2024 schedule grid week = May 12 (complete_2024a/b PDF decode, A4); release executed 05/16/2024 = "within five days" ✓.
- Type: agency completed record. Confidence: HIGH. Establishes: at least one Wolf River trout release COMPLETED (May 2024). Same 2024 feed contains Region 3 Dale Hollow TW 05/31/2024 (tailwater, different destination — kept separate).

### A3. Completed-stocking feed, LIVE (retrieved 2026-09-25)
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable.exceldriven.json
- 10 rows, dates 08/28/2026–09/17/2026; **zero Wolf rows** — consistent with a spring-only program (the fall/winter window has no Wolf destination).
- Type: agency completed record (current). Confidence: HIGH (negative scope: fall only).

### A4. Yearly schedule grids, decoded month-by-month (planned evidence, 2003–2026)
Sources: TWRA "TWRA TENTATIVE TROUT STOCKING SCHEDULE" PDFs 2003–2015 (`tmp/research/data/schedpdf/sched03–15.pdf`, sched13 in `tmp/research/completion/scheds/`; Wayback originals e.g. web.archive.org/web/20030404161556/http://www.state.tn.us/twra/fish/StreamRiver/stockedtrout/sched03.pdf) and TWRA "Trout Stocking (YEAR)" pages 2018–2025 (`tmp/research/data/complete/complete_*.pdf`, `tmp/research/completion/scheds/ts2018/2019.pdf`). All retrieved in prior passes; re-decoded 2026-09-25 by coordinate extraction (pdftotext column mapping for the sched-era; PyMuPDF word-coordinate mapping of the '●'/'X' marks onto the month/day header for 2004–2026).

| Year | Wolf River marks (month → week) | Method / confidence |
|---|---|---|
| 2003 | March, April, May (3 X's; cols 57/76/90) | pdftotext column map; HIGH |
| 2004 | March 21, April 25, May 23 | PyMuPDF X + header; HIGH |
| 2005 | March, April, May (3 X's; cols 58/74/88 — same geometry as 2006/08/09) | HIGH |
| 2006 | March, April, May (57/73/87) | HIGH |
| 2007 | March, April, May (58/74/88) | HIGH |
| 2008 | March, April, May (57/73/87) | HIGH |
| 2009 | March, April, May (57/73/90; "WEEK OF" Mondays) | HIGH |
| 2010 | March 14, April 18, May 16 | PyMuPDF; HIGH |
| 2011 | March 13, April 17, May 15 | PyMuPDF; HIGH |
| 2012 | March, April, May | rotation-corrected (page /Rotate 90) column decode; MEDIUM-HIGH (raw pdftotext row is empty; marks visible only after rotation transform) |
| 2013 | March, April, May | same as 2012; MEDIUM-HIGH |
| 2014 | March 9, April 13, May 11 | PyMuPDF; HIGH |
| 2015 | March 8, April 12, May 10 | PyMuPDF; HIGH |
| 2016 | — (sched16 = Wayback "not archived" 404 stub) | GAP |
| 2017 | — (sched17 = Wayback 404 stub) | GAP |
| 2018 | March 11, April 15, May 13 | PyMuPDF dots; HIGH |
| 2019 | March 10, April 14, May 12 (two captures agree) | PyMuPDF dots; HIGH |
| 2020 | March 8, April 26, May 10 (wider gaps — COVID-era spacing) | PyMuPDF dots; HIGH |
| 2021 | March 14, April 18, May 16 (a+b agree) | HIGH |
| 2022 | March 13, April 17, May 15 (a+b agree) | HIGH |
| 2023 | March 12, April 16, May 14 | HIGH |
| 2024 | March 10, April 14, May 12 (a+b agree); completed 5/16/2024 (A2) | HIGH |
| 2025 | March 9, April 13, May 11 (a/b/c/d captures agree) | HIGH |
| 2026 | weeks 3/8, 4/12, 5/10 (A1 JSON) | HIGH |

**Zero marks in any non-spring month in any year.** Exactly three events per year, one per month March–May, in every decodable year.
- County-attribution note: the pdftotext sched-era txts misalign the county column (Wolf River appears variously beside "Overton/Marion/Pickett/Monroe/Fentress" — a known row-shift artifact of prior passes). The water ROW's own X marks are what matters; TWRA's county for the trout destination is Fentress (A1 JSON + A5 GIS).
- Contradiction check: none. All 19 decoded years agree.

### A5. TWRA Trout Stocking Locations GIS (FeatureServer; live query)
- URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/ArcGIS/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=json (retrieved 2026-09-25; 730 features)
- Wolf River features (3, all Fentress / Pall Mall, StockingProgram="Spring", WaterClass=stream, Species=rainbow, NumStocked=750):
  - S1 "York Farm And Mill State Park" — 36.54228, -84.96164 (Management: TDEC)
  - S2 "Wolf River Loop Bridge Crossing" — 36.53548, -84.95218 (Management: TDEC)
  - S3 "Delk Creek Rd. Bridge Crossing" — 36.53254, -84.94254 (Management: Private Land)
  - DelayedHarvestSeason: null on all three (no DH).
- Type: agency operational GIS. Confidence: HIGH. Establishes: program season literally named "Spring"; the three stocked sites cluster on ~1.5 km of river at Pall Mall (the S1–S3 reach). Supports reach discipline (below).

### A6. TWRA fishing regulation exceptions page (species rule = warmwater leg, agency)
- URL: https://www.tn.gov/twra/fishing-regs/fishing-regulation-exceptions.html (retrieved 2026-09-25)
- Verbatim: "**Wolf River South Ford Road Bridge downstream into Dale Hollow Reservoir. • Smallmouth Bass: Two (2) per day, 16–21 inch PLR** (one under 16 inches and one (1) over 21 inches). (PLR) Protected Length Range."
- Note: the same page's "Forked Deer, Hatchie, Loosahatchie, Obion, and Wolf Rivers (includes tributaries)" crappie entry is the WEST Tennessee Wolf — different water, not this one.
- Type: agency regulation. Confidence: HIGH. Establishes: TWRA manages a smallmouth bass fishery ON the Wolf (rule reach runs from South Ford Rd bridge DOWNSTREAM to Dale Hollow — i.e., the lower/mouth reach, downstream of the Pall Mall trout sites).

### A7. TWRA Dale Hollow Reservoir where-to-fish page (Region 3; agency assessment)
- URL: https://www.tn.gov/twra/fishing/where-to-fish/cumberland-plateau-r3/dale-hollow-reservoir.html (retrieved 2026-09-25)
- Verbatim excerpts: "Smallmouth Bass: Two (2) per day, 16–21 inch PLR. … **Includes Wolf River upstream to South Ford Road bridge.**" … "**Recently, anglers often report catching spotted bass in the upper portions of the Wolf River.** Tactics that work for smallmouth bass will be equally effective for spotted bass…" … Dale Hollow "has long been home to the famous state and world record smallmouth bass caught in 1955" (D.L. Hayes, 11 lb 15 oz); roving creel surveys show above-average SMB catch rates.
- Type: agency assessment/guidance. Confidence: HIGH. Establishes: (a) the Wolf is inside Dale Hollow's black-bass management unit; (b) spotted bass occur in the upper Wolf (i.e., near the stocked reach); (c) reservoir-scale smallmouth fishery context. There is NO dedicated Region 3 "Wolf River" where-to-fish page (Region 3 index lists only reservoirs).

### A8. Tennessee State Parks — Sgt. Alvin C. York State Historic Park (state agency; Pall Mall)
- URL: https://tnstateparks.com/parks/sgt-alvin-c-york (retrieved 2026-09-25)
- Verbatim: "Fishing at Sgt. Alvin C. York — **The Wolf River offers canoe, kayak, and bank fishing for large mouth bass, catfish, bluegill, and bream, and is stocked with trout March, April, and May. A trout stamp is required.**"
- Type: state agency (TDEC) park guidance. Confidence: HIGH for months (independent corroboration of the schedule decode); the species list is warmwater (largemouth/catfish/bluegill) on the park reach.

### A9. TWRA Tennessee Trout Management Plan 2017–2027 (negative for holdover/reproduction statements)
- URL: https://www.tn.gov/content/dam/tn/twra/documents/fishing/Tennessee-Trout-Management-Plan-2017-2027.pdf (retrieved 2026-09-25; 60 pp, full text via PyMuPDF)
- **Zero mentions of "Wolf", "Fentress", or "Pall Mall."** Program text distinguishes wild (self-sustaining, no stocking) populations from stocked fisheries; no per-stream carry-over/reproduction claims for seasonal waters.
- Type: agency plan. Confidence: HIGH as a negative — the Wolf's program is run as routine seasonal put-and-take with no wild-trout or special-management designation.

### A10. USGS NAS occurrence search, HUC 05130105 (Obey/Wolf drainage)
- URL: https://nas.er.usgs.gov/api/v2/occurrence/search?huc8=05130105&limit=500 (retrieved 2026-09-25; 62 records)
- Salmonidae: rainbow trout — Dale Hollow Reservoir (stocked), tailrace (stocked / "locally established"); brown trout — East Fork Obey River ("established", 1939 & later), Cumberland R. below Dale Hollow (stocked); lake trout — Dale Hollow (stocked/failed). **No Salmonidae locality is the Wolf River itself.** Micropterus: 0 records (native — out of NAS scope).
- Type: federal occurrence database. Confidence: HIGH (narrow). Supports: no self-sustaining trout population documented in the Wolf; adjacent East Fork Obey brown trout is a different stream.

### A11. Federal Register — critical habitat on the wild Wolf reach
- Fluted Kidneyshell & Slabside Pearlymussel critical habitat (endangered mussels): final rule 2013-09-26, https://www.federalregister.gov/documents/2013/09/26/2013-23357/… ; proposed 2012-10-04 (2012-24019). Unit "Wolf River and Town Branch, Pickett and Fentress Counties, Tennessee … includes **41.0 rkm (25.5 rmi) of the Wolf River**" (located via WebSearch hit on govinfo.gov).
- Type: federal regulatory habitat designation. Confidence: HIGH for what it says. Supports reach discipline: the Wolf main stem below the Pall Mall stocking sites is high-quality wild riverine habitat (listed mussels) — not a trout-program reach.

## B. Museum / community-science occurrence sources (species science)

### B1. GBIF preserved specimens — Micropterus on the Wolf itself
- API: https://api.gbif.org/v1/occurrence/search?scientificName=…&decimalLatitude=36.25,36.72&decimalLongitude=-85.15,-84.55 (retrieved 2026-09-25). PRESERVED_SPECIMEN records:
  - **Micropterus dolomieu** (smallmouth): "Wolf River, below mouth of Holbert Creek, just N of Red Mill Schoolhouse" (36.5545,-85.0343, 1939); "Wolf River, below ford and dam at Miller's Chapel, NW of Byrdstown" (36.6050,-85.1429, 1939); "Wolf River and lower 100 m of Town Branch at TN 295 … NNE center of Byrdstown" (36.5833,-85.1181, 2011); plus tributaries Caney Creek (1939) and "Rotten Fork, **headwaters of Wolf River, N of Jamestown; Obey River system**" (36.5655,-84.9421, 1939).
  - **Micropterus punctulatus** (spotted bass): same 1939 Miller's Chapel site; "Wolf River, at Backbone Ford, NE of Byrdstown" (1939); "Wolf River, at mouth of Town Branch … NE of Byrdstown" (1980); TN 295 site (2011).
- Salmonidae in the same bounding box: rainbow trout only at Pickett SP lake area (2014 obs / 1938 Thompsons Creek specimen) and Kentucky-side BSF Rock Creek — **zero trout specimens from the Wolf River itself**; Salmo trutta records are East Fork Obey / South Fork Cumberland drainage, not the Wolf.
- Type: museum occurrence records (GBIF-mediated). Confidence: HIGH. Establishes: a smallmouth+spotted-bass fishery on the Wolf documented 1939→2011; the "Obey River system" label; no historical trout.

### B2. iNaturalist (bounding box 36.25–36.70 N, -85.15–-84.55)
- API: https://api.inaturalist.org/v1/observations?taxon_name=…&swlat=36.25&swlng=-85.15&nelat=36.70&nelng=-84.55 (retrieved 2026-09-25)
- Oncorhynchus mykiss: 3 obs, none on the Wolf (2× Pickett CCC SP, 2014 — stocked-lake context; 1× Daniel Boone NF, KY). Micropterus dolomieu: 10 obs — Jamestown/Robbins/Oneida/Clear Fork/Scott Co, **none georeferenced on the Wolf**. M. punctulatus: 1 (Oneida).
- Type: community science. Confidence: MEDIUM. Single catches = leads only; adds nothing decisive beyond A7/B1.

### B3. Angling corroboration (lead-grade, no contact)
- WebSearch hit (2026-09-25): Facebook group post describing a float of the Wolf: "As I float smallmouth, spotted bass, and rainbow trout are continued being caught… portage amongst logjams" (facebook.com/groups/628107197328378). GoFentress.com Dale Hollow/Fentress fishing guide describes the county's smallmouth fishery and notes the Wolf's gorge reaches. Anecdotal only; consistent with mixed classification; logged as lead, not evidence.

## C. Reach discipline (stocked vs wild vs mouth)
1. **Stocked trout reach (Fentress Co., Pall Mall):** S1 York Farm & Mill State Park → S2 Wolf River Loop Bridge → S3 Delk Creek Rd Bridge (36.5325–36.5423 N, -84.9616–-84.9425 W; ~1.5 km; USGS 03416000 Wolf R near Pall Mall at Pall Mall). Spring rainbow, ~750/site (A5). Park reach (A8) overlaps S1.
2. **Wild main-stem/gorge reach (Pickett/Fentress):** 25.5 mi critical-habitat unit for fluted kidneyshell/slabside pearlymussel (A11) — no trout program; wild warmwater/critical habitat. This is the "Wild River" character referenced by anglers; not stocked.
3. **Lower reach/mouth:** South Ford Road Bridge → Dale Hollow Reservoir — TWRA's special smallmouth rule reach (A6/A7); reservoir-context SMB fishery (world-record SMB water). Dale Hollow TW and Dale Hollow Reservoir are SEPARATE stocking destinations in the 2024 completed feed — do not merge with "Wolf River."
4. **BSF/New River: out of basin** (see header correction). No reach of this Wolf touches 05130104.

## D. Holdover / reproduction
- No agency statement exists (negative: A9 plan has no Wolf text; A10 NAS shows no established Salmonidae in the Wolf; B1 no trout specimens; TWRA completed feeds show only spring releases). The fishery is put-and-take on cold headwater flow; "trout stamp required" (A8) implies normal harvest regs. Classify trout leg as stocked/put-and-take, NOT wild, NOT DH, NOT year-round.

## E. Contradictions and data hygiene
1. Tasking geography (BSF/New River) contradicted by HUC/gauge/museum evidence — corrected above.
2. sched-era county misalignment (artifact) — superseded by JSON/GIS county = Fentress.
3. 2012/2013 grid decode required rotation-corrected coordinates (page /Rotate 90); medium-high confidence; all 19 other years unanimous.
4. 2016/2017: sched16/sched17 are Wayback 404 stubs — no schedule capture found; tn.gov-era pages for those years not located. Gap only (the surrounding years bracket them).
5. Live completed feed only exposes the last ~3 weeks; historical completion beyond the 2024 archive snapshot was not retrievable.
6. Memphis Wolf River rows: none in the 2026 JSON; the regs-page West-TN "Wolf River" crappie exception is a different water — kept separate throughout.

## F. Searches run (2026-09-25; unproductive noted)
1. WebSearch: `"Wolf River" Pall Mall trout stocking Tennessee Fentress` — partial (rate limits mid-run).
2. WebSearch: `TWRA "Wolf River" smallmouth bass "South Ford" OR "16-21" regulation` — 429 rate-limited (superseded by direct fetch A6/A7).
3. WebSearch: `TWRA Region 3 coldwater trout report Wolf River Fentress rainbow` — 429 (no R3 coldwater report found; R3 publishes reservoir where-to-fish pages instead).
4. DDG HTML: `Wolf River Fentress Tennessee trout stocking Pall Mall TWRA` — blocked (JS challenge).
5. DDG HTML: `Wolf River Tennessee smallmouth bass fishing Pall Mall Dale Hollow` — blocked.
6. DDG HTML: `TWRA "Region 3" coldwater trout report PDF` — blocked.
7. Bing: `Wolf River Fentress County trout stocking Pall Mall TWRA` — degraded/generic results.
8. Bing: `Wolf River Tennessee smallmouth bass fishing Pall Mall` — degraded.
9. Bing: `TWRA Region III trout report Wolf River Fentress` — degraded.
10. Bing: `Sgt Alvin C York State Park Wolf River fishing trout` — degraded.
11. WebSearch: `Wolf River Tennessee trout stocking schedule Fentress County` — OK (govinfo FR hit → A11).
12. WebSearch: `"Wolf River" Tennessee smallmouth bass fishing Fentress Pickett fly fishing` — OK (angling leads B3; regs guide).
13. WebSearch: `Sgt Alvin C York State Park Wolf River fishing trout Pall Mall` — OK (park page → A8).
14. WebSearch: `Sgt. Alvin C. York State Historic Park trout fishing Wolf River Tennessee` — OK (verbatim quote A8).
15. WebSearch: `TWRA "Seasonal" trout stocking program Tennessee streams put-and-take catchable rainbow March` — OK (program structure context).
16. WebSearch: `"Wolf River" Tennessee "delayed harvest" OR "trout stocking" TWRA` (sub-query of 11) — negative for DH on the Wolf.
17. Dataset queries (API, not search): TWRA ArcGIS FeatureServer (A5); NAS huc8=05130105 (A10); GBIF ×7 (bbox species); iNaturalist ×4 (bbox species); Federal Register API ×1; Wayback CDX ×~15 (intermittent outage; recovered only 404 stubs for sched16/17).
Unproductive/inconclusive: Region 3 coldwater trout report (no such public R3 doc found — R4 series exists), tnstateparks direct curl (hung; replaced by WebSearch hit), sched16/17 captures (never archived).

## G. Recommendation
- **Verdict: `mixed` HOLDS — both legs evidenced at THIS water; upgrade confidence from medium to high.**
- Trout: **spring put-and-take rainbow; months = March, April, May** (three events/year; 2026 weeks 3/8, 4/12, 5/10; example completed event 5/16/2024). Not DH (DelayHarvest null, TYPE=Seasonal), not year-round (no non-spring rows in any year; live fall feed has no Wolf).
- Warmwater: strong — TWRA species-rule reach + spotted-bass statement + 72 years of museum vouchers (smallmouth & spotted bass).
- Ledger hygiene: keep name "Wolf River" (Fentress) distinct from wolf-river-west-tennessee; keep Dale Hollow TW/Reservoir and Pickett Lake as separate destinations; note the Dale Hollow (Obey) outlet — NOT Big South Fork/New River.
- Remaining gaps: 2016–2017 schedule captures; pre-2024 completed-stocking archives; no R3 coldwater report and no Wolf-specific TWRA fish-community survey located (the warmwater leg rests on regs + guidance + vouchers, which is sufficient).
