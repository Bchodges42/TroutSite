# CHILHOWEE LAKE (Chilhowee Reservoir) — evidence log

Ledger verdict under test: `year-round-trout` (YR flag, no months pinned)
Blount/Monroe counties, TN; Little Tennessee River impoundment immediately downstream of Calderwood, Tapoco Hydroelectric Project (FERC No. 2169). Dam completed 1957; 1,747 acres (TWRA; Wikipedia/TVA say ~1,734 acres); "cool-water reservoir," bordered by GSMNP and Cherokee NF. Owner: built/owned by Alcoa (Tapoco/APGI); now operated by Brookfield Smoky Mountain Hydropower.
Retrieval date for all sources: 2026-09-25. Research only; no contact made with any agency/author.

## Reach / coordinates
- Chilhowee Dam: 35.54556, -84.05028 (Wikipedia geo tag; USGS elevation 874 ft MSL). Note: some secondary sources place the dam near 35.573, -84.008; the Wikipedia geo tag is used here.
- TWRA GIS stocking-site points (4 rows): 35.55671, -84.01139; 35.50858, -84.00521; 35.52452, -83.99362; 35.55550, -83.99861.
- Reach: reservoir from Calderwood Dam tailwater (Tallassee, TN) down to Chilhowee Dam; backwater of the Little Tennessee; upstream of Tellico Reservoir.

## SOURCES

### 1. TWRA 2026 Trout Stocking Schedule (dataset JSON, 616 rows)
- Org: Tennessee Wildlife Resources Agency. 2026 schedule; retrieved 2026-09-25 (direct curl).
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json
- Fields verbatim: `{"REGION":"4","COUNTY":"Blount/Monroe","LOCATION":"Chilhowee Reservoir","TYPE":"Reservoir","STOCKING DAY":"","STOCKING WEEK":"","STOCKING MONTHS":"F, N, D","SPECIES":"Rainbow Trout"}`
- Season/calendar: February + November + December (winter months only; no day/week pinned).
- Species: Rainbow Trout.
- Type/confidence: planned schedule row, agency-primary; HIGH (raw JSON grep, exact single hit).
- Establishes: TWRA-planned stocking in 2026; winter-only stocking. Does NOT establish year-round stocking.

### 2. TWRA Trout Management Plan 2017–2027 (Fisheries Report No. 17-10, ed. James W. Habera, Oct 2017)
- Org: TWRA. Retrieved 2026-09-25 (PDF, pdftotext).
- URL: https://www.tn.gov/content/dam/tn/twra/documents/fishing/Tennessee-Trout-Management-Plan-2017-2027.pdf
- Verbatim (nine-reservoir criterion — includes Chilhowee): "Only reservoirs that maintain a year-round supply of cold, well-oxygenated water can support trout fisheries. Tennessee has nine reservoirs that currently support trout fisheries: Dale Hollow, Parksville, South Holston, Wilbur, Watauga, Fort Patrick Henry, Calderwood, Chilhowee, and Tellico (~62,400 acres total). Some reservoir trout attempt to spawn in tributaries, but these attempts are largely unsuccessful and stocking is required to maintain reservoir fisheries. Trout are stocked during the winter to assure that surface water temperatures are cold enough for their survival."
- Verbatim (lake trout): "Lake Trout (S. namaycush) are stocked in Watauga, South Holston, and Chilhowee reservoirs (about 150,000 6-inch fish annually) and provide a unique opportunity not only for Tennessee anglers, but for those throughout the Southeast as well."
- Cited NCWRC survey covering Chilhowee: Yow et al. 2002, "Creel surveys of Santeetlah, Cheoah, Calderwood, and Chilhowee reservoirs, 1998–1999," NCWRC F-24.
- Type/confidence: agency plan; HIGH.
- Establishes: Chilhowee on the year-round cold-water nine-reservoir list; 2017-era lake-trout stocking program; no natural reproduction (stocking-dependent).

### 3. TWRA "Chilhowee Reservoir" where-to-fish page
- Org: TWRA. Live 2026; retrieved 2026-09-25.
- URL: https://www.tn.gov/twra/fishing/where-to-fish/east-tennessee-r4/chilhowee-reservoir.html
- Verbatim: "The TWRA stocks trout on a regular basis."; "Trout are stocked on an annual basis and thrive in the cool, clear water."; "The cool water and good dissolved oxygen levels create an ideal habitat for these popular game fish."; "Lake Trout have been stocked in the past, but not recently, so anglers should not expect to catch a Lake Trout."; regs: "There is no size limit on trout and the daily creel limit is seven trout in any combination, except only two can be Lake Trout."; 1,747 acres; dam completed 1957 impounding the Little Tennessee; "When surface temps exceed 70°F, trout hold suspended or below 20 feet near the bottom" (thermal-refuge behavior documented).
- Type/confidence: agency-primary, current; HIGH.
- Establishes: current, regular/annual TWRA stocking; cool well-oxygenated water; lake trout program DISCONTINUED (past, not recent); summer deep-water trout refuge.

### 4. eRegulations (TWRA annual guide) — Region 4 reservoir regulations, 2026 edition
- Org: TWRA guide. Retrieved 2026-09-25.
- URL: https://www.eregulations.com/tennessee/fishing/region-4/
- Verbatim: "Chilhowee ... Trout: Seven (7) per day, no length limit, only two (2) may be lake trout. Yellow Perch: 15 per day..." (lake-trout creel sub-limit retained).
- Type/confidence: HIGH for regs. The retained 2-laker allowance is now legacy wording given the TWRA page's "not recently" statement.

### 5. TWRA ArcGIS "Trout Stocking Locations in Tennessee" (FeatureServer)
- Org: TWRA_GIS. Retrieved 2026-09-25 (REST query).
- URLs: https://www.arcgis.com/sharing/rest/content/items/3ec5c58f99de4de5951f32b76b462623?f=json ; https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0
- Rows verbatim (4 Chilhowee hits): OBJECTID 766: StreamName "Chilhowee Reservoir", Region 4, County BLOUNT, StockingProgram "Reservoir", Species "rainbow", 35.55671/-84.01139, 24 Hours; OBJECTID 778: species "rainbow", 35.50858/-84.00521; OBJECTID 780: 35.52452/-83.99362 (species blank); OBJECTID 781: species "rainbow", 35.55550/-83.99861.
- Type/confidence: agency GIS; HIGH.
- Establishes: mapped "Reservoir" stocking program points, rainbow trout, on Chilhowee.

### 6. Wayback Machine capture of TWRA stockings page, 2024-12-08
- Org: TWRA (Internet Archive capture). Retrieved 2026-09-25.
- URL: http://web.archive.org/web/20241208155225/https://www.tn.gov/twra/fishing/trout-information-stockings.html
- Verbatim fragment: "Chilhowee 11/14/2024" (Region 4 stocking-date list).
- Type/confidence: archived agency schedule; HIGH.
- Establishes: continuity — Chilhowee stocked Nov 2024; scheduled F/N/D 2026.

### 7. WATE (ABC Knoxville), 2026-02-10 (author Gregory Raucoules; updated 2026-02-12)
- URL: https://www.wate.com/news/tennessee/when-does-twra-start-spring-trout-stocking-in-east-tennessee/
- Verbatim: "Chilhowee Lake, Calderwood Lake, and upper part of Tellico Lake are among the state reservoirs TWRA stocks to provide year-round trout fishing opportunities."
- Type/confidence: media paraphrase of TWRA program; MEDIUM-HIGH.
- Establishes: current framing of Chilhowee as a TWRA year-round trout water.

### 8. TWRA Trout Management Plan 2017–2027 — lake-trout contradiction (see #3)
- TMP 2017: lakers stocked in Chilhowee (~150,000 6-inch fish annually into Watauga/SH/Chilhowee combined).
- TWRA page 2026: "Lake Trout have been stocked in the past, but not recently, so anglers should not expect to catch a Lake Trout."
- Resolution: the Chilhowee laker program ended between 2017 and 2026. 2026 schedule row (Rainbow only) corroborates. Log the laker claim as HISTORICAL (2017-era), not current.

### 9. Negative checks
- NAS (USGS) TN Salvelinus namaycush records (6 total): Dale Hollow x2, Watauga Reservoir/River, Clinch tailwater, Carter Co. — NONE in Blount/Monroe; no independent Chilhowee laker voucher. https://nas.er.usgs.gov/api/v2/occurrence/search?genus=Salvelinus&species=namaycush&state=TN (2026-09-25).
- GBIF (box 35.50–35.70, −84.15–−83.88): rainbow trout only — 1978 "Little Tennessee River below Chilhowee Dam" (TVA/UT); no lakers/brook in box. LOW-MEDIUM (historic).
- iNaturalist: 0 trout obs within 12 km (API, 2026-09-25).
- eRegulations state records: no Chilhowee entries, no TN lake-trout record (0 hits). Rumored Calderwood record laker does not extend to Chilhowee either.
- Chilhowee is NOT named for a NCWRC stocking share (unlike Calderwood); no NC-side program found (NC portion none — reservoir lies wholly in TN; NCWRC stocks Cheoah Lake upstream instead).

### 10. Ownership/history context
- Wikipedia "Chilhowee Dam" (retrieved 2026-09-25, https://en.wikipedia.org/wiki/Chilhowee_Dam): "Construction began in 1955 and was completed in 1957 to provide power for the operation of the Alcoa Aluminum plant... now owned and operated by Brookfield Smoky Mountain Hydropower. The dam's reservoir covers approximately 1,734 acres." (TWRA page says 1,747 acres — minor discrepancy, log both.)
- Tapoco Relicensing Settlement Agreement Package (FERC P-2169-020, April 2004; mirror https://ffj-online.org/wp-content/uploads/2015/01/Tapoco_2004_Alcoa.pdf): contains NO fish-stocking article for Chilhowee (all stocking provisions target Calderwood; Chilhowee articles cover reservoir levels OR-6, fishway FP-1 for the dam, benthic sampling BMR-1 in the tailwater). So any "Alcoa stocked Chilhowee" claim has NO FERC-filed support found; the documented stocker is TWRA (with federal-hatchery fish, incl. Erwin/Dale Hollow NFH lakers per TMP).
- Wikipedia "Calderwood Dam": dam ownership Alcoa/Tapoco subsidiary; TVA controls reservoir levels from Fontana — context for flow/cold-water management.

## Stocking season / calendar (synthesis)
- TWRA: Feb + Nov + Dec (2026 schedule "F, N, D"); Nov 2024 archived event. Winter-only strategy per TMP (stock when surface water is cold).
- Species 2026: Rainbow Trout only. Historically (2017): rainbow + lake trout (~150k lakers/year system-wide into Watauga/SH/Chilhowee). No brown or brook stocking documented for Chilhowee.
- Holdover: agency statements of cool well-oxygenated water and summer thermal refuge (trout hold >20 ft when surface >70°F); "stocking is required to maintain" (no reproduction); statewide trout season has no closed season.

## Year-round verdict analysis
- Criterion: TMP places Chilhowee on the nine-reservoir list defined by "a year-round supply of cold, well-oxygenated water"; TWRA page documents annual stocking and cool-water habitat; 2026 WATE paraphrases TWRA's year-round trout-fishing framing.
- What is NOT present: continuous 12-month stocking (winter months only) and any current lake-trout program.
- Standard applied: "year-round requires continuous stocking OR documented holdover/refuge with an agency/utility statement" — satisfied via agency-documented cold refugia + annual winter stocking + no closed season; NOT satisfied via continuous stocking.
- Recommendation: KEEP `year-round-trout`, with species corrected to Rainbow Trout (current) and lake trout marked historical/discontinued (pre-2026). If months are annotated, use "F, N, D" as stocking months only — the fishery's presence is year-round via holdover. Confidence: moderate-high; weaker than Calderwood on the private-funding angle (no FERC stocking article for Chilhowee) but equal on the TWRA program and TMP criterion.

## Searches run (Chilhowee track; incl. unproductive)
1. "Chilhowee Lake Tennessee trout stocking" — productive (TWRA page, WATE).
2. "TWRA 'trout management plan' 2017 2027 nine reservoirs 'year-round supply of cold'" — productive (located plan).
3. "TWRA statewide trout management plan 2017 2027" — productive (Clarksville Online comment-period notice, July 2017).
4. "'Tapoco' settlement OR license 'stocking' trout Calderwood Chilhowee Alcoa FERC 2169" — productive (ffj 229-page doc found).
5. "Tapoco FERC license trout stocking Calderwood Chilhowee" (retries) — rate-limited 429 (unproductive attempts).
6. "Chilhowee Reservoir lake trout fishing Tennessee 'lake trout' angler report" — negative (no angler laker reports; AA-Fishing rainbow-only page noted).
7. "Alcoa stocked Calderwood Chilhowee trout history Daily Times Maryville" — unproductive (no Daily Times article found).
8. "Alcoa trout stocking Calderwood Chilhowee history" retries — rate-limited/unproductive.
9. "'Fishing permitted year-round' Calderwood Reservoir proclamation Tennessee" — indirectly relevant (Calderwood-specific; not Chilhowee).
10. TWRA Chilhowee page fetch + verbatim extraction — highly productive.
11. TWRA 2026 schedule JSON download + grep — highly productive (row verbatim).
12. TMP PDF download + text extraction — highly productive.
13. FERC settlement PDF greps — productive (negative for Chilhowee stocking article; documented negative).
14. TWRA ArcGIS layer query — productive (4 rows).
15. Wayback 2024-12-08 capture — productive (11/14/2024 event).
16. eRegulations region-4 + trout-regulations + state-records — productive (regs; negative records).
17. GBIF/iNat/NAS queries — negative findings recorded.
18. Wikipedia Chilhowee/Calderwood dam pages — context (ownership, coords, acreage discrepancy).
19. ncpaws/NCWRC checks for a Chilhowee NC program — negative (reservoir is wholly TN; Cheoah Lake is the NC neighbor).
20. Bing/DDG HTML search attempts — blocked (unproductive).

## Contradictions summary
- TMP 2017 (lakers stocked in Chilhowee, ~150k/yr across three reservoirs) vs TWRA 2026 page ("stocked in the past, but not recently") vs 2026 schedule (Rainbow only): laker program discontinued; retain as historical note.
- Regs still provide a 2-lake-trout creel sub-limit at Chilhowee: legacy wording, not evidence of current lakers.
- WATE "year-round trout fishing" vs winter-only schedule months: reconciled by TMP winter-stocking + cold-refuge holdover model.
- Acreage 1,747 (TWRA) vs ~1,734 (Wikipedia/TVA): minor; cite TWRA for agency fields.
- County "Blount/Monroe" (TWRA JSON/prose) vs GIS layer "BLOUNT" only, and AA-Fishing's "Blount/Sevier" (tertiary error): use Blount/Monroe per TWRA.
