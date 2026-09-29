# West Prong Little Pigeon River (Gatlinburg / Pigeon Forge), Sevier County, TN — evidence log

- Ledger verdict under test: `year-round-trout`, YR flag, no months
- Retrieval date for all sources: 2026-09-25
- Scope: classification research ONLY; no agency/author contact; no edits to docs/
- Destinations covered: "West Prong Little Pigeon River (Gatlinburg)", "W. Prong Little Pigeon R. (Pigeon Forge)", "Gatlinburg Streams" (special-permit umbrella for the city's four streams, incl. the Gatlinburg reach of the W Prong)

## Water / reach description

- West Prong Little Pigeon River (WPLP) rises in GSMNP (Chimney Tops; Walker Camp Prong + Road Prong), flows ~9 mi along US 441 into Gatlinburg, then through the city ("The Spur") toward Pigeon Forge. TWRA story map: Gatlinburg stocks "approximately 5 miles downstream to Gnatty Branch confluence" (incl. the Spur right-of-way). Pigeon Forge reach is a separate TWRA destination with its own GIS sites.
- TWRA GIS stocking sites (TWRA_Trout_Stocking_Locations, FeatureServer/0, queried 2026-09-25):
  - Pigeon Forge cluster (9 rows, 35.783–35.807 N, −83.548 to −83.577 W): Old Mill Bridge (35.788478, −83.554278), Jake Thomas Bridge (35.795952, −83.560875), Behind Blake Jones Go-Kart track (35.798947, −83.565968), Wears Valley Rd. Bridge (35.805682, −83.574202), plus 5 unnamed.
  - Gatlinburg cluster (12 rows, 35.713668–35.762275 N, −83.510 to −83.524 W), within city permit water (Park Boundary → Gnatty Branch).
  - All rows: StockingProgram "Spring", Species "rainbow", WaterClass "stream".
- Source: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=json (local copy: raw/arcgis_troutloc.json)

## Sources

### S1. TWRA 2026 Trout Stocking Schedule (JSON datatable, live)
- Org: Tennessee Wildlife Resources Agency (tn.gov). Publication: 2026 schedule year; retrieved 2026-09-25.
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json (local: raw/sched2026.json; 616 rows)
- Fields: REGION, COUNTY, LOCATION, TYPE, STOCKING DAY / STOCKING WEEK, SPECIES.
- Rows (Sevier Co.):
  - "Gatlinburg Streams" (TYPE Delayed Harvest 1/1–3/19 and 12/3–12/24; TYPE Weekly 3/26–11/26): 52 weekly rows, **every month Jan–Dec 2026**, Rainbow Trout.
  - "W. Prong Little Pigeon R. (Pigeon Forge)" (Seasonal, biweekly): weeks of 1/4, 2/15, 3/1, 3/15, 3/29, 4/12, 4/26, 5/10, 5/24, 10/25 (2026) → months Jan, Feb, Mar, Apr, May, Oct. No Jun–Sep, no Nov–Dec.
  - "Mid. Prong Little Pigeon River" (sibling, not this ledger water): 2/15–5/24 + 10/25–11/8.
- Type + confidence: PLANNED schedule; high confidence (official, machine-readable).
- Establishes: planned stocking of the Gatlinburg city reach every month of 2026 (weekly); Pigeon Forge reach Jan–May + Oct only. Note: schedule dates are Sundays, event within 5 days.

### S2. TWRA "Complete Trout Stocking Schedule" PDFs, 2018–2025 (Wayback/tn.gov captures; decoded by column position)
- Org: TWRA. Captures saved by prior passes in data/complete/ and raw/; re-decoded 2026-09-25 with pdfplumber (script reconstructs Sunday dates from first column). Day-mismatch=0 for all tables used except where noted.
- Per-year Sevier rows (months with markers; DH = delayed-harvest week, ● = scheduled stocking week):

| Year | W. Prong LR (Pigeon Forge) | Gatlinburg Streams (first listed 2022) | Mid. Prong (sibling) |
|---|---|---|---|
| 2018 | Feb 25, Mar 11/25, Apr 8/22, May 6/20, Jun 3, Sep 30, Oct 14/28 (11 wks) | — (not in schedule) | Feb 25–Jul 15 + Sep 30–Oct 28 |
| 2019 | Feb 24–Jun 2 + Sep 29, Oct 13/27 | — | Feb–Jul + Sep/Oct |
| 2020 | Feb 23–May 31 + Oct 11/25 | — | Feb–Jul + Oct |
| 2021 | Feb 28–Jun 6 + Oct 10/24 | — | Feb–Jul + Oct |
| 2022 | Feb 20–May 29 + Oct 9/23 | DH Feb 6/20, Mar 6/20 + weekly Apr 3–Oct 23 | Feb–Jul + Oct |
| 2023 | Feb 19–May 28 + Oct 8/22 | DH Feb 5/19, Mar 5/19 + weekly Apr 2–Oct 22 | Feb–Jul + Oct |
| 2024a (early) | Feb 18–May 26 + Oct 6/20 | DH Feb 4–Mar 31 + weekly Apr 7–Jun 2 + Oct 6–Nov 17 + DH Nov 24 | Feb–Jul + Oct |
| 2024b (revised) | unchanged | DH Feb 4–Mar 31 + Oct 6–Nov 17 + DH Nov 24; Apr 7–Jun 2 weeks replaced by footnote "NO STOCKINGS DUE TO HATCHERY RENOVATION" | unchanged |
| 2025 (a/b/d identical) | Jan 19, Feb 16, Mar 2/16/30, Apr 13/27, May 11/25, Oct 12/26, Nov 16, Dec 21 | DH weekly Jan 5–Mar 30 + weekly Apr 6–Nov 23 + DH Nov 30–Dec 28 = **all 12 months** | Feb–Jul + Oct |
| 2026 | (see S1) Jan–May + Oct | (see S1) all 12 months | Feb–Jun + Oct/Nov |

- Type + confidence: PLANNED schedules; high confidence (official PDFs; column decode cross-checked).
- Establishes: Pigeon Forge destination = seasonal (roughly Feb/Mar–Jun + Oct; Jan and Nov–Dec only from 2025). Gatlinburg Streams umbrella = Feb–Oct weekly from 2022, plus winter DH weeks; full 12-month coverage from 2025. The 2024 mid-summer cancellation (city hatchery renovation) is annotated on the Gatlinburg row itself.
- Contradiction note: 2024a vs 2024b — April–June 2024 Gatlinburg weeks cancelled by hatchery renovation (see S8/S9).

### S3. TWRA Tentative Trout Stocking Schedules 2003–2015 (state.tn.us sched03–15.pdf via Wayback)
- Org: TWRA. Retrieved 2026-09-25 from prior-pass local copies (data/schedpdf/); re-decoded with pdfplumber.
- Findings: For Sevier County, every year 2003–2015 lists ONLY "Mid. Prong Pigeon River" (biweekly Feb/Mar–Aug + Sep/Oct). **No "West Prong", no Gatlinburg, no LeConte rows** in any 2003–2015 schedule. (sched04 month decode mis-aligned; row present, X's span ~May–Nov. sched10/11/14 tables decoded with month headers missing — same biweekly Mar–Oct pattern.)
- 2016–2017: not captured (Wayback fetches returned error pages) — gap.
- Type + confidence: PLANNED schedules (absence evidence); high confidence for absence in this series.
- Establishes: TWRA did not publish a WPLP (Gatlinburg or Pigeon Forge) schedule destination 2003–2015, even though the city program was operating (see S8) and an unofficial "West Prong (Gatlinburg)" completed destination existed by 2018 (S5). Not establishing absence of stocking — the city program was municipal, and the printed schedule also omits the Sevier rows entirely in the 2023 printed version (raw/ereg_trout_stocking.pdf has no Sevier rows; the online "complete" schedule has them) — i.e., these special-permit city waters were handled outside the printed statewide schedule.

### S4. TWRA live completed-stocking feed (Sept 2026) + 2024 archive (destination-level COMPLETED)
- Org: TWRA trout page JSON feeds. Retrieved 2026-09-25.
- Live feed (raw/completed_live_2026.json): Region 4 — "Leconte Creek" 09/01/2026; **"West Prong Little Pigeon River (Gatlinburg)" 09/17/2026**. (Same page capture: raw/twra_live_2026.html.)
- 2024 archive (data/committed2024.json): Region 4 — "West Prong Little Pigeon River (Pigeon Forge)" 05/31/2024 (only 2024 W-Prong-family entry in that archive snapshot; the feed records the most recent event per destination, not a full annual log).
- Type + confidence: COMPLETED; high confidence for the dates shown.
- Establishes: both destination names are live TWRA stocking destinations in Sept 2026.

### S5. Region 4 coldwater reports / quarterly completed tables, 2022–2024 (TWRA)
- Org: TWRA coldwater stocking reports (cw_2022feb/may/aug/nov, cw_2023feb/may/aug/nov, cw_2024feb/may; cwsched_2022). Retrieved 2026-09-25 from local copies; format "DESTINATION date region next-destination".
- COMPLETED entries (Region 4):
  - West Prong LP River (Gatlinburg): winter listing Feb 2022 (date blank); 05/12/2022; 06/16/2022; 08/11/2022; 10/20/2022; **02/08/2023 (winter)**; 08/10/2023; (May/Nov 2023 listed, no date); **02/08/2024 (winter)**.
  - West Prong LP River (Pigeon Forge): 05/05/2022; 06/01/2022; 10/26/2022; (2023/2024 listed, no date).
  - Context destinations stocked same weeks in Gatlinburg: Roaring Fork 05/16/2022, 08/11/2022; Dudley Creek 02/08/2023, 10/20/2023; Leconte Creek (see LeConte log).
- Type + confidence: COMPLETED; high confidence.
- Establishes: TWRA trucks the Gatlinburg reach in summer AND mid-winter (Feb 8, 2023; Feb 8, 2024), i.e., cold-month stocking is documented at destination level, not just planned.
- Caveat: date/destination pairing read from flattened text; column order verified on each file (destination followed by its date); pairing unambiguous for the dated rows above.

### S6. Wayback captures of the TWRA trout page — "recently stocked" lists (Dec 2018–Jan 2020, Dec 2024–Jan 2025)
- Org: TWRA (captured by Internet Archive). Retrieved 2026-09-25 from local copies.
- twra_page_20190112223300.html: "West Prong Little Pigeon River (Gatlinburg)" appears among recently-stocked waters; nearest date chip 12/12/2018 (also "Roaring Fork 12/3/2018"). 
- twra_page_20200124221849.html: "(Gatlinburg)" destination near chips 12/12/2019 and 12/18/2019.
- twra_page_20200424011138.html: "(Pigeon Forge)" near 4/13/2020; "(Gatlinburg)" near 3/17–3/30/2020.
- tw-20241208155225.html: "(Gatlinburg)" among chips 11/15–11/26/2024; "Leconte Creek" next to 12/03/2024.
- tw-20250114154240.html: "(Gatlinburg)" near 12/18/2024, 12/26/2024, 01/06/2025.
- Type + confidence: COMPLETED-ish (recent-stocking chips); MEDIUM confidence — the old page rendered names and dates as separately-positioned elements, so exact name↔date pairing is not machine-recoverable from flattened HTML. Used as corroborating month-of-year evidence (December stockings of the Gatlinburg reach in 2018, 2019, 2024, 2025 window), not as standalone proof.
- Establishes (weakly but consistently): the Gatlinburg reach has been stocked in DECEMBER repeatedly since at least 2018.

### S7. TWRA Story Map — "Gatlinburg Area Streams" (stocking narrative)
- Org: TWRA (Trout Stocking story map). Retrieved 2026-09-25 (completion/storymap_data.json; live JSON embedded in trout page).
- Key quotes:
  - "West Prong Little Pigeon River: ...flows along US 441 northbound for approximately 9 miles before flowing into the city limits of Gatlinburg where it is stocked with thousands of rainbow trout each year. Gatlinburg stocks the WPLP for approximately 5 miles downstream to Gnatty Branch confluence."
  - "**Stocking: Year-Round**" (section-level field for Gatlinburg Area Streams).
  - "Species Caught: Rainbow Trout."
  - "(January - March): Gatlinburg waters are under delayed harvest ... the City of Gatlinburg stocks fish in the 16"-20" average size range along with several 20'-24" fish..."
  - "(July - September): ...the Spur between Gatlinburg and Pigeon Forge will not be stocked due to higher water temperatures. Although stocking will still take place every Thursday, in August and September stocking numbers will be reduced..."
  - "(October - December): ...stocking of more and larger fish to resume. In November, Gatlinburg Trout Facility begins to increase the number of large [fish] stocked... in preparation for delayed harvest."
  - Wild fish context: upper WPLP (in-park) "heavily populated with a mix of wild Rainbow Trout and native Brook Trout."
- Type + confidence: OFFICIAL management description; high confidence.
- Establishes: (a) TWRA's own description says stocking is YEAR-ROUND for the Gatlinburg area streams incl. the WPLP city reach; (b) monthly cadence Jan–Dec (weekly Thursdays; reduced but not stopped Aug–Sep; larger fish Nov–Mar); (c) the ONE seasonal exception — the Spur (Pigeon Forge side) is NOT stocked Jul–Sep; (d) documented oversize carry-over stock (16–24 in) entering winter = strong holdover dynamic.

### S8. City of Gatlinburg — Trout Facility page (Wayback snapshot 2025-06-22)
- Org: City of Gatlinburg. https://www.gatlinburgtn.gov/page/trout-farm via http://web.archive.org/web/20250622043854/... Retrieved 2026-09-25 (raw/wb_troutfarm.html).
- Key quotes: "Herbert Holt Park is the home of Gatlinburg's Trout Rearing Facility, which is Tennessee's only municipal trout farm. The facility is managed to maintain a trout fishery, specifically rainbow trout, within the city limits of Gatlinburg. Fish reared at the facility are transported, in loads ranging from 350 to 500 lbs. per stocking, and deposited into the West Prong of the Little Pigeon River every Thursday (no fishing is allowed on Thursday)." ... "All fish must be released between December 1 and March 31." ... tributaries included in city fishable waters: "Roaring Fork Creek, and LeConte Creek"; children's stream at Mynatt Park on LeConte Creek.
- Type + confidence: OFFICIAL municipal program description; high confidence.
- Establishes: weekly (Thursday) municipal stocking into the WPLP — the city program is the year-round engine; Dec 1–Mar 31 mandatory release (winter fishery maintained without harvest).

### S9. WATE 6 On Your Side (Knoxville) — Gregory Raucoules, "Trout stocking of Little Pigeon River paused for renovations to Gatlinburg trout facility", published 2024-04-23.
- URL: https://www.wate.com/news/sevier-county-news/trout-stocking-of-little-pigeon-river-paused-for-renovations-to-gatlinburg-trout-facility/ (also linked from TWRA's own page, Sept 2024 capture). Retrieved 2026-09-25.
- Facts: city trout farm (Herbert Holt Park) full renovation began Apr 2024; raceways date to 1981 (city program origin); stocking paused; completion targeted October 2024; "Fish reared at the facility are usually deposited in to the West Prong of the Little Pigeon River every Thursday."
- TWRA page note (Sept 2024 capture): "The City of Gatlinburg's Trout Hatchery is undergoing renovations and will not be stocking trout until renovations are complete. Stockings are planned to continue in November."
- Type + confidence: LOCAL MEDIA + official note; high confidence.
- Establishes: the 2024 Apr–Oct pause (matches schedule footnote in S2); resumption by Nov 2024; program running since 1981.
- Contradiction: a tourism page (auntbugs.com, via search snippet, page now 404) says the program "began in 1980" with a 2005 trout-farm upgrade; WATE/TWRA imply 1981 raceway origin. Minor; unresolved (1980 vs 1981).

### S10. TWRA trout regulations page — "Gatlinburg Trout Fishing" section (2025 capture + live 2026 fetch)
- Org: TWRA. https://www.tn.gov/twra/fishing-regs/trout-regulations.html#gatlinburg (live, fetched 2026-09-25); 2025-03 capture: raw/twra_page_20250324085906.html.
- Key quotes: "TWRA and the City of Gatlinburg offer a variety of trout fishing opportunities in four (4) streams. All streams are closed on Thursday each week and a Gatlinburg permit is required." General streams include "West Prong Little Pigeon River from Park Boundary to Gnatty Branch." "Fishing is permitted year-round, except on Thursday... From December 1 through March 31 (all streams): Possession of any trout shall be prohibited... From April 1 through November 30: General Streams: the creel limit is five (5) trout per day."
- Footnotes in schedules: "**G Closed to fishing on Thursdays and special permit or Sportsmans License is required."
- Type + confidence: OFFICIAL regulation text; high confidence.
- Establishes: the special-permit framework that makes the Gatlinburg reach a managed year-round put-and-take fishery; the Thursday-closure = weekly stocking signal.

### S11. Tennessee Trout Management Plan 2017–2027 (TWRA)
- Local: data/reports/Tennessee-Trout-Management-Plan-2017-2027.pdf / raw/tmp_plan.txt. Retrieved 2026-09-25.
- Quotes: "Delayed harvest (DH) areas ... were first introduced in Tennessee in Gatlinburg (four streams) during 1997"; "the City of Gatlinburg's small hatchery ... produces about 10,000 pounds of Rainbow Trout annually for a few streams within the city"; "Buffalo Springs provides 6-inch Rainbow Trout to the City of Gatlinburg's hatchery to be grown out and stocked in Gatlinburg streams."
- Type + confidence: OFFICIAL plan; high confidence.
- Establishes: program depth (municipal hatchery + TWRA fingerling supply) and that winter-oriented DH management in Gatlinburg dates to 1997.

### S12. Third-party corroboration (low-medium confidence)
- doubledfly.com "Gatlinburg — West Prong Fly Fishing": "Stocked & wild rainbow and brown trout · Best: Year-round" (accessed via search snippet 2026-09-25). Establishes: fishery-level year-round reputation + holdover browns; LEAD only.
- stockingmap.com (search snippet): "West Prong Little Pigeon River (Gatlinburg) is stocked year-round, with a winter program December–March" — aggregator; LOW confidence, no primary data shown.
- iNaturalist (API query 2026-09-25, raw/inat_gatlinburg_omykiss.json): 7 research-grade Oncorhynchus mykiss within 3 km of 35.72,-83.51: 2021-03-21, 2024-03-14, 2024-03-25, 2024-07-07, 2025-12-16 (River Rd, Gatlinburg — mid-December), 2026-04-23, 2026-05-02. Establishes: presence of rainbow trout in the city reach in December–July; single observations = LEADS, not proof of stocking month.
- TWRA Facebook video (via search snippet, unverified): trout stocked in Pigeon Forge "for the first time in over two decades," every two weeks through June, pausing in warm water, resuming October. Consistent with S2 pattern (PF destination appears from the 2018 schedule; absent 2003–2015). LEAD only.

## Months-by-year stocking table (per destination; X = scheduled weeks documented, C = completed record)

| Year | W Prong (Pigeon Forge) | W Prong (Gatlinburg) / "Gatlinburg Streams" | Combined months covered |
|---|---|---|---|
| 2003–2015 | none in TWRA schedules | none in TWRA schedules (city program running since 1981, weekly, undated) | city program only (months not documented) |
| 2016–2017 | gap (sources not captured) | gap | — |
| 2018 | F M A M J S O | (destination in live feed; Dec chip 12/12/2018) | F M A M J S O + Dec(lead) |
| 2019 | F M A M J S O | Dec chip 12/12/2019 | F M A M J S O + Dec(lead) |
| 2020 | F M A M O | Mar–Apr chips (ambiguous) | F M A M O |
| 2021 | F M A M J O | — | F M A M J O |
| 2022 | F M A M O | C: Jan/Feb winter listing, May 12, Jun 16, Aug 11, Oct 20; umbrella: DH F M + weekly A–O | F–O (8 consecutive months) |
| 2023 | F M A M O | C: Feb 8 (winter), Aug 10; umbrella DH F M + weekly A–O | F–O (8 consecutive months) |
| 2024 | F M A M O | C: Feb 8 (winter); umbrella DH F M, Apr–Jun cancelled (hatchery renovation), O–N + Nov 24 DH; city paused Apr–Oct, resumed Nov; Dec chips | F M A M O N D (pause Jun–Sep) |
| 2025 | J F M A M O N D | umbrella: J F M A M J J A S O N D (DH Jan–Mar + Nov 30–Dec 28) | **all 12** |
| 2026 | J F M A M O | umbrella: all 12 weekly (rows 1/1–12/24); C: Sep 17 | **all 12** |

## Species
- Rainbow Trout (all schedule rows and all completed feeds; city rears rainbow only — story map "Species Caught: Rainbow Trout"). Wild rainbow + native brook trout in the in-park headwaters (story map; GSMNP). Brown trout: holdover/wild reports in the city/lower reach (doubledfly.com — lead). No brown/brook stocking records for this destination.

## Analysis

- (a) Do the destinations together cover all 12 months? YES in 2025 and 2026 by published weekly schedules ("Gatlinburg Streams" Jan–Dec; Pigeon Forge adds Jan/Feb and Oct–Dec). In 2022–2024 the combined coverage was Feb–Oct (+ Nov/Dec 2024); January is documented only from 2025 onward (Jan 19, 2025; Jan 4, 2026) — before that, January was covered only by the city's continuous Thursday program and the 1997–present winter DH fishery, not by dated records.
- (b) The city program: real, large, weekly (350–500 lbs every Thursday into the WPLP; ~10,000 lbs/yr produced at Tennessee's only municipal trout farm, started 1981, TWRA-supplied fingerlings), explicitly described by TWRA as "Stocking: Year-Round," with Dec 1–Mar 31 mandatory release. "Gatlinburg trout season" in the popular sense = the Dec 1–Mar 31 catch-and-release period within a year-round fishery (not a closed season).
- (c) Holdover/reproduction: documented holdover dynamics (16–24-inch DH fish carried Nov–Mar; Dec iNat record; anglers report holdovers). Reproduction is documented in the IN-PARK reach (wild rainbow + brook), not in the stocked city reach; city-reach fishery is hatchery-dependent.
- (d) Verdict: year-round survives via combined continuous stocking — TWRA's own story map states it, the 2025–2026 schedules prove every month, completed records prove winter events (Feb 2022 listing, 2/8/2023, 2/8/2024, Nov–Dec 2024/Jan 2025 chips, Sep 2026), and the municipal program runs weekly year-round. The Pigeon Forge sub-reach alone would be SEASONAL (Jan–May + Oct; no Jun–Sep due to warm water).

## Contradictions / caveats
1. 2024 Apr–Jun Gatlinburg weeks cancelled ("NO STOCKINGS DUE TO HATCHERY RENOVATION", complete_2024b) and city stocking paused Apr–Oct 2024 — a real gap in an otherwise continuous record; resumed Nov 2024.
2. Jul–Sep: the Spur/Pigeon Forge side is intentionally not stocked (warm water) — year-round applies to the Gatlinburg city reach; PF reach is seasonal.
3. Dec 2018/2019/2024/Jan 2025 "recently stocked" chips have ambiguous name↔date pairing (old page layout) — corroborating only.
4. Program start: 1980 (tourism page snippet) vs 1981 (WATE raceway origin) — minor, unresolved.
5. 2016–2017 schedules not captured — gap in the schedule series.
6. 2003–2015 absence of W-Prong rows in TWRA schedules is NOT evidence of no stocking (printed statewide schedule also omitted all Sevier special-permit waters in later years, e.g., 2023 printed version has zero Sevier rows).

## Searches run (2026-09-25)
Productive: (1) City of Gatlinburg trout hatchery Herbert Holt Park; (2) gatlinburg.com year-round Thursday stocking; (3) Gatlinburg trout season catch-release December March permit; (4) WATE trout-stocking pause renovation (found via TWRA link); (5) Pigeon Forge greenway trout stocking; (6) TWRA Pigeon Forge "first time in decades"; (7) West Prong holdover brown trout year-round (doubledfly); (8) Gatlinburg trout tournament; (9) TWRA "Gatlinburg Streams" delayed harvest 2022 (rate-limited but same primary data in hand); (10) gatlinburgtn.gov fishing page snippets (Thursday closure, C&R Dec 1–Mar 31).
Unproductive / rate-limited: "Mountain Press" Sevier trout stocking (2 variants); WATE query variants x4 (429s); stockingmap.com page (404); auntbugs.com page (404, snippet only); Wayback CDX for gatlinburgtn.gov/page/fishing (no captures).
Offline/primary-source passes (not web searches): 2026 JSON; 2018–2025 schedule PDFs; 2003–2015 schedules; completed feeds 2018–2026; ArcGIS layer; story map; trout management plan; iNat API.

## Recommendation
- KEEP `year-round-trout` (YR) for West Prong Little Pigeon River. Continuous stocking is documented and official ("Stocking: Year-Round" story map; weekly municipal stockings; 2025–2026 schedules covering every month; completed winter events). Confidence: HIGH for 2022–2026; MODERATE for 2018–2021 (seasonal schedules Feb–Oct + Dec chips + city program); LOW/negative for 2003–2015 as far as dated TWRA evidence goes (city program continuity is the only support).
- Optional annotation: the Pigeon Forge reach (separate destination) is seasonal (Jan–May + Oct 2026 pattern; Jul–Sep excluded for warm water); year-round status rests on the Gatlinburg city reach.
