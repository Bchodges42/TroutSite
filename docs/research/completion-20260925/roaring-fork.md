# Roaring Fork (Gatlinburg), Sevier County, TN — Year-Round Trout Classification Research Log

Research date: 2026-09-25 (single session). Scope: internal classification research ONLY; no agencies/businesses/authors/anglers contacted; only this notes file written; no git writes.

Water: Roaring Fork, Gatlinburg, Sevier County, TN — a small mountain creek rising in Great Smoky Mountains NP, flowing through the city of Gatlinburg to the West Prong Little Pigeon River. Ledger verdict `year-round-trout`, YR flag, no months. TWRA stocking layer has one row at 35.7169, −83.4983 (Spring tag, rainbow).

PARK-BOUNDARY DISCIPLINE (the core of this water): the park's Roaring Fork (Roaring Fork Motor Nature Trail reach) is INSIDE GSMNP and holds wild rainbows/brooks — NPS ended park stocking in 1975 ("The National Park historically stocked non-native trout for recreation until 1975, when it was deemed inconsistent with NPS policies", nps.gov/grsm/planyourvisit/fishing.htm, retrieved 2026-09-25). The STOCKED reach is the CITY reach only: "Roaring Fork from the Park Boundary to West Prong Little Pigeon River" (TWRA page) / "from National Park Boundary downstream to West Prong Little Pigeon River" (city page). Park reach ≠ stocked reach for classification; the ledger row must map to the lower city reach.

SAME-NAME RISK (checked): other TN "Roaring Forks" exist — Roaring Fork Creek, Greene County (Nolichucky drainage, TDEC dataviewers) and a Roaring Fork of Little River (Blount County). The TWRA row is uniquely the Gatlinburg water: County "SEVIER", City "Gatlinburg", coords 35.71688/−83.49827, Management "City", DailyPermitRequired "Yes". No confusion with any stocked-Sevier-creek set (Gatlinburg complex = WPLP + Dudley + Roaring Fork + Leconte; Pigeon Forge waters are separate W. Prong rows).

---

## 1. TWRA 2026 planned stocking schedule (live tn.gov JSON) — retrieved 2026-09-25 (byte-cache 2026-09-24)
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json (616 rows)
- Destination `Gatlinburg Streams` (Region 4, Sevier): **52 weekly rows, 1/1/2026–12/24/2026, Rainbow Trout — all 12 months.** TYPE "Delayed Harvest" for 1/1–3/19 and 12/3–12/24; TYPE "Weekly" for 3/26–11/26. (No separate "Roaring Fork" schedule row; Roaring Fork is a component stream of this destination per §2–§4.)
- Type: planned. Confidence: high. **2026 months supported: all 12.**

## 2. TWRA StoryMap "Trout Fishing Forecasts" — TWRA (storymaps.arcgis.com/stories/dbb92bdf718f4fd7839bf4b08fb82747; published 2021-04-08, updated 2026-05-04; retrieved 2026-09-25; data cached by sibling pass as storymap_data.json)
- "Gatlinburg Area Streams" section: "West Prong Little Pigeon River … flows into the city limits of Gatlinburg where it is stocked … Gatlinburg stocks the WPLP for approximately 5 miles downstream to Gnatty Branch confluence." And: "**Roaring Fork, Leconte Creek, Dudley Creek:** These three smaller streams in Gatlinburg all originate in the Great Smoky Mountain National Park before flowing into Gatlinburg … **These three streams are all stocked from their confluences with West Prong Little Pigeon to the national park boundary.** Leconte Creek is designated as a kids' stream…"
- Fields on the same section: "**Stocking: Year-Round**"; "Species Caught: Rainbow Trout"; "Regulations: Gatlinburg Permit is required year-round." Forecast quarters describe continuous every-Thursday stocking: Jan–Mar DH with 16"–24"+ fish; Apr–Jun 12"–14" average; Jul–Sep "stocking will still take place every Thursday" with reduced numbers Aug–Sep (Spur section skipped midsummer); Oct–Dec larger fish resume, DH preparation.
- Establishes: TWRA's own current statement that Roaring Fork is stocked (city reach) YEAR-ROUND, weekly Thursdays, rainbow. Confidence: high (agency, current, water-specific).

## 3. City of Gatlinburg — Fishing page (gatlinburgtn.gov/page/fishing; platform publish date 2023-07-27; retrieved live 2026-09-25)
- URL: https://www.gatlinburgtn.gov/page/fishing
- Designated "General Streams": "West Prong Little Pigeon River from National Park Boundary downstream to Gnatty Branch…; Dudley Creek from National Park Boundary downstream to West Prong Little Pigeon River…; **Roaring Fork from National Park Boundary downstream to West Prong Little Pigeon River.**; LeConte Creek from Painter's Branch downstream to West Prong Little Pigeon River." Children's Streams listed separately (WPLP at Herbert Holt Park; Dudley; LeConte at Mynatt Park).
- Facility: "The City of Gatlinburg operates a Trout Rearing Facility, which is located at Herbert Holt Park … the only municipally-owned trout facility in the State of Tennessee … managed to maintain a trout fishery, specifically rainbow trout. Fish … 350 to 500 pounds, per stocking, are deposited into the West Prong of the Little Pigeon River **every Thursday**, which as a result is the only day that fishing is not allowed in Gatlinburg-managed streams and rivers."
- Seasonal regs: "Catch and Release Season: December 1 through March 31 … ALL fish caught must be released"; Thursday closure year-round.
- Establishes: designated stocked reach of Roaring Fork (city reach), weekly year-round stocking regime, species. Facility narrative names WPLP as the deposition water; Roaring Fork's own stockings are covered by TWRA (§2, §5, §6) and the 4-stream designation.

## 4. tn.gov trout-information-stockings page — "Gatlinburg Trout Fishing" section (Wayback captures 20240930210409, 20241208155225, 20250114154240; retrieved 2026-09-25)
- "TWRA and the City of Gatlinburg offer a variety of trout fishing opportunities in **four (4) streams. All streams are closed on Thursday each week** and a Gatlinburg permit is required."
- Permit waters: "West Prong Little Pigeon River from Park Boundary to Gnatty Branch …; Dudley Creek from Park Boundary to West Prong Little Pigeon River …; **Roaring Fork from the Park Boundary to West Prong Little Pigeon River.**; Leconte Creek from Painter Branch to West Prong Little Pigeon River." (Children's streams follow.)
- Establishes: TWRA+city joint program on exactly four streams incl. Roaring Fork; weekly-Thursday closure ⇒ weekly stocking; reach = park boundary down. Note: absent from the 2018 capture of the same page — section added between 2018 and 2024.

## 5. TWRA ArcGIS — TWRA_Trout_Stocking_Locations FeatureServer (layer 0) — queried 2026-09-25 via REST
- URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/ArcGIS/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0/query?where=UPPER(StreamName)%20LIKE%20%27%25ROARING%25%27&outFields=*&outSR=4326&f=json
- Single row (verbatim fields): OBJECTID 606 | StreamName "Roaring Fork" | Region "4" | County "SEVIER" | City "Gatlinburg" | StockingProgram "**Spring**" | WaterClass "stream" | Species "rainbow" | Management "**City**" | DayClosure "**Thursday**" | DailyPermitRequired "**Yes**" | DelayedHarvestSeason null | LAT 35.71687539 | LON −83.49826832.
- Point sits on the lower city reach (between the park boundary and the WPLP confluence; Gatlinburg city street grid). Sibling rows Leconte Creek (OBJECTID 605, 35.70162/−83.51363) and W. Prong Little Pigeon Gatlinburg sites (596–604, 607–609) carry identical City/Thursday/permit fields — the Gatlinburg complex is internally consistent.
- Field caveat: StockingProgram "Spring" appears on nearly every stream row statewide in this master (legacy/default value); it does NOT outweigh the Year-Round story-map statement, the 12-month 2026 schedule, or the cold/shoulder-season completions (§6). Confidence in the row: high; confidence in 'Spring' as a months claim: low.

## 6. Completed (destination-level) stocking evidence — month-by-month where recoverable
- Coldwater Trout Stocking Schedule, updated 2/18/2022 (local cache scheds/ts2022cold.pdf; tn.gov PDF): `4 | West Prong Little Pigeon River (Gatlinburg) | 02/09/2022` — **February 2022 TWRA stocking** of Gatlinburg waters.
- tn.gov page capture 2024-12-08 (wordcloud of recent completions): "…West Prong Little Pigeon River (Gatlinburg) 11/15/2024 11/18/2024 11/26/2024 11/22/2024 … **Roaring Fork** … Leconte Creek 12/03/2024 …" — Roaring Fork present in the recent-completion feed; WPLP-Gatlinburg completions 11/15–11/26/2024 (November).
- tn.gov page capture 2025-01-14 (wordcloud): "12/19/2024 Dale Hollow TW **Roaring Fork** Lake Graham … 01/06/2025 Center Hill TW … West Prong Little Pigeon River (Gatlinburg) …" — Roaring Fork in the completion feed around mid-December 2024; WPLP-Gatlinburg in early January 2025. (Wordcloud keyword pairing is positional/ambiguous — cite as destination-level presence, not exact dates.)
- Live completed feed 2026-09-24 (`completed2026-jina.txt`): Region 4 completions incl. "Leconte Creek" 09/01/2026 and "West Prong Little Pigeon River (Gatlinburg)" 09/17/2026. **No Roaring Fork row in this ~30-day window** (rotation may not have hit it that week; gap, not contradiction).
- Type: destination-level. Months evidenced by completions: Feb 2022; Nov 2024; Dec 2024; Jan 2025; Sep 2026 — i.e., deep into "off-season" quarters that a Spring-only program would not touch.

## 7. Historical documentation of the Roaring Fork designation
- state.tn.us "Stocked Trout" page, capture 20130110154309 (2012-13 winter page): "The following areas have **delayed harvest** regulations: Paint Creek (Greene County); Tellico River (Monroe County); **Gatlinburg Trout streams (Sevier County): West Prong [Little Pigeon] River, Dudley Creek, Roaring Fork, Leconte Creek.**" — TWRA DH designation of Roaring Fork since at least 2012–13. Winter-trout date list on the same page contains no Sevier waters (Gatlinburg handled separately by the city/DH program).
- TWRA Tentative Trout Schedules 2003–2019 (sched03–15, ts2018/2019/2019b): NO Gatlinburg or Roaring Fork row — the city program was not carried in the TWRA stream schedule in that era (only the Sevier `Mid. Prong` and `W. Prong (Pigeon Forge)` rows appear). The `Gatlinburg Streams` schedule destination is a recent addition (present in the 2026 JSON; 2020–2025 JSON captures not archived except the June-2024 completions file).
- City program history: WATE (Gregory Raucoules, "Trout stocking of Little Pigeon River paused for renovations to Gatlinburg Trout Facility," posted 2024-04-23, updated 2024-04-23): raceways "were in place when the City began its trout program in **1981**"; total renovation of the Herbert Holt Park facility Apr–Oct 2024; city "unable to stock trout in the river until renovations are complete." TWRA's Sept-2024 page capture adds: "Stockings are planned to continue in November" — and the Dec-2024 capture shows stocking resumed 11/15–11/26/2024.
- Region 4 Coldwater Report 2021 (TWRA; local cache r4-2021c.txt, citing Roddy 2022): ~1.3M trout produced annually at five TWRA, **one municipal (Gatlinburg)**, and two federal hatcheries; 49% of all TN trout go to Region IV waters. Context only.
- GSMNP contrast: NPS fishing page (nps.gov/grsm/planyourvisit/fishing.htm, retrieved 2026-09-25): park stocked "until 1975"; 2,000–4,000 wild trout/mile in many streams. The park's Roaring Fork (Motor Nature Trail reach) is wild rainbow/brook water — irrelevant to stocking classification except as the upstream boundary of the stocked reach.

## 8. Months-by-year stocking table (Roaring Fork, city reach)
| Year(s) | Evidence | Months supported |
|---|---|---|
| 1981–2002 | City program origin 1981 (WATE 2024); no month-level documents recovered | unknown (program exists) |
| 2003–2011 | No TWRA schedule row; no city archive recovered; city Thursday program operative (program history) | gap |
| 2012–2013 | TWRA DH designation of Gatlinburg streams incl. Roaring Fork (state.tn.us 2012-13 page) | fishing-season evidence only; months gap |
| 2014–2019 | No planned rows recovered (program not in TWRA schedule) | gap |
| 2020–2021 | No captures recovered | gap |
| 2022 | TWRA Coldwater schedule: WPLP (Gatlinburg) 02/09/2022 | Feb (complex-level) |
| 2023 | No captures recovered | gap |
| 2024 | Weekly Thursday program Jan–Apr (city page/storymap regime); **May–Oct gap — hatchery renovation** (WATE 4/23/2024; TWRA Sept-2024 note); resumed Nov (completions 11/15–11/26; Roaring Fork in feed) | Jan–Apr, Nov–Dec (Dec via wordcloud ~12/19) |
| 2025 | Completions 01/06/2025 (WPLP-G); Roaring Fork keyword in 12/19/2024–01/14/2025 window | Jan (complex-level); rest gap |
| 2026 | 52 weekly planned rows all 12 months (`Gatlinburg Streams`, DH Jan–Mar + Dec, Weekly Mar–Nov); Sept completions (WPLP-G 9/17, Leconte 9/1) | **all 12 months (planned, destination-level)** |

## 9. Contradictions
- C1: ArcGIS StockingProgram "Spring" vs Year-Round story map + 12-month 2026 schedule + Nov/Dec/Jan/Feb completions. Resolved against 'Spring' (near-universal default field; see §5).
- C2: C&R/DH window discrepancies: TWRA regulation page snippet says catch-and-release Oct 1–Feb 28; city page says Dec 1–Mar 31; story map says "delayed harvest … until April 1"; 2026 schedule applies DH type only Jan 1–Mar 19 + Dec 3–24. Regulatory framing only; none implies a stocking gap (Thursday stockings and closures run year-round in every source).
- C3: 2024 renovation pause (≈Apr/May–Oct 2024) is a documented interruption of the otherwise-weekly city program; resumed November 2024. Exception, not the rule; TWRA-side completions for the complex continued (05/28/2024 Middle Prong; 02/09/2022 Gatlinburg WPLR).
- C4: Jul–Sep: "Spur" reach skipped midsummer and numbers reduced Aug–Sep (story map) — reach-level nuance within a continuing weekly program; lower city reach (incl. Roaring Fork's short stocked reach) keeps receiving Thursday stockings.
- C5: Completion-feed keyword pairing for Roaring Fork (Nov 13 vs Dec 19, 2024) is positionally ambiguous (wordcloud, client-rendered page) — destination-level confidence only.
- C6: Facility narrative ("deposited into the West Prong…every Thursday") reads WPLP-only; the three tributaries' stockings are separately attested (story map §2; ArcGIS City/Thursday rows §5; completions at Leconte/Roaring Fork §6). Not a real conflict once sources are read together.

## 10. Searches run (unproductive noted)
1. `Roaring Fork Gatlinburg trout stocking TWRA city program` — tool timeout, unproductive.
2. `Gatlinburg trout stocking Thursday "Roaring Fork"/"LeConte"/"Dudley" city permit` — productive (Thursday stocking; park-boundary reach; permit; 350–500 lb).
3. `Great Smoky Mountains NP ended fish stocking 1975 Roaring Fork wild trout` — productive (NYT-derived 1975 context; park-wide policy) plus sub-query `Smokies "Roaring Fork" wild population GSMNP` (outfitter pages; park reach wild).
4. `"Roaring Fork" Gatlinburg "delayed harvest" trout December March` — productive (C&R Dec 1–Mar 31 city; TWRA reg page Oct 1–Feb 28 variant).
5. `Gatlinburg West Prong Little Pigeon delayed harvest trout season` (sub-query) — productive (TWRA reg text).
6. `"Roaring Fork" Tennessee stream -Gatlinburg … same name` — productive (Greene Co. Nolichucky Roaring Fork Creek; Blount Co. Roaring Fork of Little River; TDEC dataviewers).
7. `Gatlinburg trout tournament stocking pounds "Roaring Fork"/"West Prong" April` — degraded/rate-limited (5 attempts), unproductive.
8. `TWRA resumed trout stocking six-mile stretch West Prong Little Pigeon River WATE` — adjacent water (Pigeon Forge W. Prong); context only.
9. `TWRA "Gatlinburg Streams" stocking schedule weekly rainbow` — productive (thesmokies.com Thursday-year-round; city Trout Farm page).
10. iNaturalist API (`Oncorhynchus mykiss`, 5 km around 35.7169,−83.4983): 18 observations incl. city-reach (River Rd Gatlinburg 12/16/2025; WPLP Gatlinburg 6/17/2025). Leads only.
11. GBIF occurrence query — 0 in the tight box; not pursued further.
Plus direct opens: city fishing page (live), TWRA StoryMap, tn.gov captures 2018/2024×2/2025, ArcGIS FeatureServer queries, ts2022cold, 2012-13 stockedtrout page, 2024 completed-feed JSON, live Sept-2026 completed feed, NPS fishing page, WATE article.

## 11. Recommendation
**`year-round-trout` SURVIVES** for the stocked (city) reach of Roaring Fork — with documented caveats. Basis: TWRA's own "Stocking: Year-Round" statement naming Roaring Fork among the Gatlinburg streams "stocked from their confluences with West Prong Little Pigeon to the national park boundary" (StoryMap, updated 2026-05-04); the 2026 schedule's `Gatlinburg Streams` destination with 52 weekly rows in all 12 months; weekly-Thursday closures year-round (TWRA + city); and off-season completions (Feb 2022, Nov 2024, Dec 2024, Jan 2025, Sep 2026). Keep the YR flag with months [1–12]. REQUIRED qualifiers: (a) the classification applies to the CITY reach only — park-boundary downstream; the park reach is wild trout water (NPS, no stocking since 1975); (b) note the 2024 hatchery-renovation pause (≈May–Oct 2024) as a historical exception; (c) treat the ArcGIS 'Spring' tag as a legacy field, not a months claim. Gaps: no month-level planned records 2003–2025 (program was city-run and outside the TWRA schedule until recently); completion evidence is destination/complex-level with some keyword-pairing ambiguity; no Roaring Fork row in the Sept-2026 30-day feed window.
