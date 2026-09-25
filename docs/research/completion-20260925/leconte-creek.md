# LeConte Creek (Gatlinburg, Sevier County, TN) — evidence log

- Ledger verdict under test: `year-round-trout`, YR flag, no months
- Retrieval date for all sources: 2026-09-25
- Scope: classification research ONLY; no agency/author contact; no edits to docs/
- Spellings tracked: LeConte / Leconte / Le Conte (TWRA feeds use "Leconte Creek"; GSMNP literature "LeConte" and "Le Conte")
- Reaches: (1) CITY reach — Painter(–Glenstone Lodge) Branch → West Prong Little Pigeon (general stream) plus children's stream Glenstone Lodge–Mynatt Park→Park Boundary; (2) PARK reach — inside GSMNP (wild fish; never stocked by TWRA/city)

## Water / reach description

- Small tributary joining the West Prong Little Pigeon River in north Gatlinburg; originates in GSMNP (drainage off Mt. LeConte side). TWRA GIS: one stocking site, "Leconte Creek", Gatlinburg, 35.701615, −83.51363 (Species: rainbow; WaterClass: stream; StockingProgram field: "Spring") — https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0/query (local: raw/arcgis_troutloc.json; queried 2026-09-25).
- HUC12 060101070201 = "Le Conte Creek" (NAS record; see S7).

## Sources

### S1. TWRA Story Map — "Gatlinburg Area Streams" (the load-bearing official statement for LeConte)
- Org: TWRA Trout Stocking story map (JSON embedded in trout page). Retrieved 2026-09-25 (completion/storymap_data.json).
- Key quotes:
  - "Roaring Fork, **Leconte Creek**, Dudley Creek: These three smaller streams in Gatlinburg all originate in the Great Smoky Mountain National Park before flowing into Gatlinburg... These three streams are **all stocked** from their confluences with West Prong Little Pigeon to the national park boundary."
  - "**Leconte Creek is designated as a kids' stream** from Glenstone Lodge upstream through Mynatt Park to the national park boundary."
  - Section-level fields: "**Stocking: Year-Round**"; "Species Caught: Rainbow Trout."
  - Seasonal narrative (applies to the Gatlinburg Area Streams group): Jan–Mar delayed harvest with city stocking 16–24-inch fish; Apr–Jun 12–14-inch fish + tournaments; Jul–Sep "stocking will still take place every Thursday" with reduced numbers Aug–Sep (Spur excluded from stocking in summer); Oct–Dec stocking resumes/increases, larger fish in Nov "in preparation for delayed harvest."
- Type + confidence: OFFICIAL management description; high confidence.
- Establishes: LeConte Creek IS stocked (city program, from mouth to park boundary), within a group TWRA labels year-round. This is the primary basis for treating LeConte as continuously stocked despite having almost no standalone schedule rows.
- Does NOT establish: month-by-month dates for LeConte alone (group-level statement).

### S2. TWRA trout regulations page — "Gatlinburg Trout Fishing" (live 2026 + 2024/2025 captures)
- Org: TWRA. https://www.tn.gov/twra/fishing-regs/trout-regulations.html#gatlinburg (fetched 2026-09-25); captures: raw/twra_page_20240930210409.html, raw/twra_page_20250324085906.html.
- Quotes: four designated streams include "**Leconte Creek from Painter Branch to West Prong Little Pigeon River**" (general stream) and "**Leconte Creek from Painters Branch upstream to Park Boundary**" (children's stream); "Fishing is permitted **year-round**, except on Thursday..."; Dec 1–Mar 31 no-harvest/no-bait; Apr 1–Nov 30 creel 5 (2 in children's streams); Gatlinburg permit required; weekly Thursday closure for stocking.
- Type + confidence: OFFICIAL regulation text; high confidence.
- Establishes: LeConte Creek city reach is a designated, permit-managed stream in a year-round fishery; Thursday closure = weekly stocking signal for the group.

### S3. TWRA 2026 stocking schedule JSON — NO standalone LeConte rows; year-round umbrella
- Org: TWRA. https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json (raw/sched2026.json, 616 rows; retrieved 2026-09-25).
- Findings: string search for LeConte/Leconte/Le Conte across all 616 rows returns ZERO rows. The Sevier group is carried as "Gatlinburg Streams" — 52 weekly rows Jan 1–Dec 24, 2026 (TYPE "Delayed Harvest" Jan 1–Mar 19 and Dec 3–24; "Weekly" Mar 26–Nov 26), Rainbow Trout. Per S1/S2, that umbrella destination is the city's four streams incl. LeConte Creek (GIS layer carries a LeConte site; completed feeds name Leconte Creek separately when it is stocked alone).
- Also checked: 2026 JSON has no "W. Prong (Gatlinburg)" schedule row either — that destination appears only in completed feeds, confirming the umbrella pattern: the city streams are scheduled under one name and reported completed under several.
- Type + confidence: PLANNED (umbrella); high confidence that the umbrella is year-round; MEDIUM-HIGH confidence that it includes LeConte (per S1 + S6 GIS site).
- Establishes: planned weekly stocking of the Gatlinburg stream group every month of 2026; no standalone LeConte scheduling.

### S4. Completed stocking records naming LeConte Creek (destination-level COMPLETED)
- (a) Live completed feed, Sept 2026 (raw/completed_live_2026.json, retrieved 2026-09-25): Region 4, "Leconte Creek", **09/01/2026**.
- (b) Region 4 coldwater quarterly reports (TWRA; retrieved 2026-09-25 from local copies; format "DESTINATION date"):
  - 06/13/2022 (cw_2022jun capture 06/29/2022)
  - 08/11/2022 (cw_2022aug)
  - **02/08/2023 (winter)** (cw_2023feb)
  - 04/17/2023 (cw_2023may)
  - 08/10/2023 (cw_2023aug)
  - listed without date, Nov 2023 report (cw_2023nov)
  - (May 2023 and Feb 2024 reports: LeConte not listed)
- (c) Wayback live-page chips: tw-20241208155225.html — "Leconte Creek" appears among recently-stocked waters adjacent to the 12/03/2024 chip (**December 2024, winter**). MEDIUM confidence (name↔date pairing ambiguous on the old layout).
- Type + confidence: COMPLETED; high confidence for dated rows, medium for the 12/2024 chip.
- Establishes: standalone TWRA-completed stockings of LeConte Creek in Jun, Aug (2022); Feb (winter), Apr, Aug, (Nov) (2023); Dec 2024; Sep 2026 — i.e., every season including mid-winter.
- Months with a standalone completed record: Feb, Apr, Jun, Aug, Sep, Nov(listed), Dec. No standalone record for Jan, Mar, May, Jul, Oct — for those months, coverage runs through the "Gatlinburg Streams" umbrella (S3) and the city weekly program (S5).

### S5. City of Gatlinburg trout program (municipal)
- City Trout Facility page (Wayback 2025-06-22: web.archive.org/web/20250622043854/https://www.gatlinburgtn.gov/page/trout-farm; retrieved 2026-09-25): "Tennessee's only municipal trout farm... Fish reared at the facility are transported, in loads ranging from 350 to 500 lbs. per stocking, and deposited into the West Prong of the Little Pigeon River every Thursday"; LeConte Creek named among the city's fishable waters; "second 'children only' section of stream at Mynatt Park located along LeConte Creek... from the Great Smoky Mountains National Park Boundary... to approximately a quarter mile downstream from Mynatt Park"; "All fish must be released between December 1 and March 31."
- City fishing page (gatlinburgtn.gov/page/fishing, via search snippets 2026-09-25; page is JS-rendered): "Gatlinburg streams are closed to fishing every Thursday due to stocking. Seasonal Regulations. Catch and Release Season: December 1 through March 31."
- TWRA Trout Management Plan 2017–2027: Gatlinburg hatchery produces ~10,000 lb rainbow/yr for "a few streams within the city"; DH first introduced in Tennessee in Gatlinburg (four streams) in 1997.
- WATE 2024-04-23: city hatchery renovation paused stockings Apr–Oct 2024; resumed by Nov 2024 ("Stockings are planned to continue in November" — TWRA note).
- Type + confidence: OFFICIAL municipal + media; high confidence.
- Establishes: continuous weekly municipal stocking operation covering the city stream group (main stem Thursdays; children's waters incl. Mynatt Park stocked with "lots of fish" per program reports); the year-round winter fishery (C&R) that keeps fish present Dec–Mar.
- Caveat: the city's own text names the WPLP as the deposition water for the weekly loads; stocking of LeConte Creek specifically is asserted at group level (S1) and via children's-stream management, not with a city-published date list.

### S6. TWRA ArcGIS TWRA_Trout_Stocking_Locations layer
- 1 LeConte Creek row: 35.701615, −83.51363 (Gatlinburg; rainbow; stream). Confirms the creek is a mapped TWRA stocking site (one site; contrast ~21 sites for the WPLP family).
- Type: INFRASTRUCTURE metadata; high confidence.

### S7. Historical/wild-fish context (park reach + species)
- NAS (Nonindigenous Aquatic Species) record 1336358: Oncorhynchus mykiss, "Le Conte Creek- Central Point" (35.67472, −83.48691; HUC12 Le Conte Creek), 1999-09-27, "Rainbow trout removal method- Electrofishing", citing Kanno, Kulp & Moore 2016 ("Recovery of Native Brook Trout Populations Following the Eradication of Nonnative Rainbow Trout in Southern Appalachian Mountains Streams"). Establishes: the PARK reach held a reproducing nonnative rainbow population that GSMNP removed (electrofishing) to restore native brook trout; Richards et al. 2008 genotyped LeConte Creek brook trout. Confirms: wild salmonids persist above the park boundary; the city reach below is hatchery-supported.
- iNaturalist (API, 2026-09-25): 7 research-grade rainbow trout records within 3 km of Gatlinburg center (2021–2026), incl. River Rd, Gatlinburg, 2025-12-16 (mid-December, near the WPLP/LeConte confluence area). LEADS only, and the December record is on the river, not certainly the creek.

## Months-by-year stocking table (LeConte Creek)

| Year | Evidence | Months covered |
|---|---|---|
| 2003–2021 | No TWRA schedule or completed records for LeConte Creek (2003–2015 schedules: Sevier = Mid Prong only; city program operating but undated for LeConte) | none documented |
| 2022 | Completed: Jun 13, Aug 11 | Jun, Aug |
| 2023 | Completed: Feb 8 (winter), Apr 17, Aug 10; listed Nov (no date) | Feb, Apr, Aug, (Nov) |
| 2024 | Dec chip (12/03/2024); city program paused Apr–Oct (hatchery renovation), resumed Nov | Dec (+ group pause Apr–Oct) |
| 2025 | No standalone record; "Gatlinburg Streams" umbrella weekly Jan–Dec (umbrella incl. LeConte per S1/S2/S5) | Jan–Dec via umbrella |
| 2026 | Completed Sep 1; umbrella weekly Jan–Dec | Sep + Jan–Dec via umbrella |

## Species
- Rainbow Trout only in all stocking records (S4, S6; city rears rainbow). Wild brook trout in the park reach (Richards 2008; GSMNP restoration). No brown-trout stocking; occasional brown reports in adjacent WPLP only.

## Analysis

- (a) Month-by-month: as a standalone destination, LeConte Creek's dated record (2022–2026) covers Feb, Apr, Jun, Aug, Sep, Nov, Dec — never Jan, Mar, May, Jul, Oct. Year-round coverage therefore depends on (i) the "Gatlinburg Streams" umbrella scheduled weekly in all 12 months (2025, 2026) and the equivalent group coverage Feb–Oct in 2022–2024; and (ii) the city's weekly Thursday program + Dec–Mar catch-and-release fishery, which TWRA labels "Stocking: Year-Round" for the Gatlinburg Area Streams group that includes LeConte.
- (b) Winter proof: standalone winter completed records exist (Feb 8 2023; Dec 3 2024 chip) and the winter fishery (16–24-inch DH fish stocked group-wide, mandatory release Dec 1–Mar 31) keeps fish present.
- (c) Holdover/reproduction: no LeConte-specific holdover study; park-reach wild brook/rainbow (reproduction) is ABOVE the park boundary, outside the stocked reach. Small stream, heavy kid-fishing pressure → fish likely do not persist long; the year-round claim rests on stocking cadence, not on holdover.
- (d) Verdict: year-round-trout SURVIVES for the current era, but via the group/umbrella evidence rather than destination-level month coverage. Confidence: MEDIUM-HIGH (2025–2026), MEDIUM (2022–2024), LOW/none (2003–2021, no records).

## Contradictions / caveats
1. LeConte Creek has never had its own row in any TWRA schedule (2003–2026) — the ledger's year-round flag cannot be supported by schedule rows for this water by name.
2. Standalone completed records miss Jan, Mar, May, Jul, Oct entirely; those months are covered only by the umbrella + city program (interpretive step, flagged).
3. The old-page Dec 2024 chip has ambiguous name↔date pairing (used as corroboration only).
4. City stocking texts name the WPLP as the weekly deposition water; LeConte's stockings are documented at group level (S1) and via children's-stream management, plus the dated TWRA completed events.
5. 2024 Apr–Oct city-hatchery renovation paused the program (affects LeConte like all city streams).
6. Spelling variance (Leconte/LeConte/Le Conte) required multiple search variants; NAS uses "Le Conte Creek".

## Searches run (2026-09-25)
Productive: (1) "Gatlinburg" trout stocking "LeConte Creek" weekly stocking season; (2) Kanno Kulp Moore brook trout recovery eradication rainbow LeConte Creek; (3) Kulp Moore brook trout restoration LeConte Creek (partial — Richards 2008 genetics lead); (4) "Leconte Creek" TWRA trout stocking 2022 2023 Sevier (led to auntbugs/GSMNP context); (5) "Mynatt Park" LeConte Creek fishing trout kids stream (city page + Facebook stocking reports); (6) LeConte Creek Gatlinburg Mynatt Park variants (429 — retried successfully); (7) TWRA trout stocking LeConte Creek Sevier County 2023 (unproductive).
Unproductive / rate-limited: "Mountain Press" Gatlinburg LeConte (429); TWRA stocking report LeConte Creek Gatlinburg (429); Leconte Creek TWRA completed 2022/2023 (no direct hits).
Shared Gatlinburg-program searches (counted for coverage; listed in the W Prong log): city hatchery Herbert Holt; gatlinburg.com year-round Thursday; C&R Dec–Mar season; 2024 hatchery-renovation pause (x4 variants); Gatlinburg trout tournament; delayed-harvest-2022; Mountain Press Sevier; Pigeon Forge greenway (x3); holdover searches (x2).
Offline/primary passes: 2026 JSON (0 rows by name); schedules 2003–2015 (0 rows); completed feeds 2018–2026; ArcGIS layer (1 site); story map; trout management plan; NAS; iNat API.

## Recommendation
- KEEP `year-round-trout` (YR) for LeConte Creek, but annotate that the record is umbrella-based: "Gatlinburg Streams" (the city's four streams incl. LeConte) is scheduled every month (2025–2026) and TWRA's own story map says the group is stocked "Year-Round," with standalone completed winter events (2/8/2023; 12/2024) and a live 9/1/2026 completed record.
- Alternative if the standard requires destination-level months: downgrade to seasonal with months Feb, Apr, Jun, Aug, Sep, Nov, Dec (standalone records) — NOT recommended, because it would contradict TWRA's explicit group-level year-round stocking statement and the weekly city program.
- Gaps to close if a higher confidence grade is wanted: a city-published stocking log for LeConte/Mynatt Park (city posts stocking notices on its Trout Facility Facebook page); Jan/Mar/May/Jul/Oct standalone completed records (the TWRA completed feed reports the group under "Gatlinburg Streams" and rarely breaks out LeConte).
