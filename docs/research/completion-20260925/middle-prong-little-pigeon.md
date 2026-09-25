# Middle Prong Little Pigeon River (Pittman Center → Sevierville), Sevier County, TN — Year-Round Trout Classification Research Log

Research date: 2026-09-25 (single session). Scope: internal classification research ONLY; no agencies/businesses/authors/anglers contacted; only this notes file written; no git writes.

Water: Middle Prong Little Pigeon River, Sevier County, TN. TWRA stocked reach runs OUTSIDE Great Smoky Mountains NP, from the Pittman Center area (just downstream of the park boundary at Greenbrier/Emerts Cove) northeast to the Sevierville area (confluence with West Prong). Ledger verdict `year-round-trout`, YR flag, no months. ~16 TWRA GIS stocking sites claimed; 15 verified (below). Prior Doosey-thesis pass documented TWRA stocking Middle Prong Pittman Center→Bird Creek (TWRA 1999 citation).

PARK-BOUNDARY DISCIPLINE: the GSMNP "Greenbrier" reach of this same stream is WILD trout water (NPS ended park stocking in 1975 — see sibling log). The TWRA-stocked reach is the non-park reach only (Pittman Center → Sevierville). All TWRA GIS rows sit at 35.742–35.840 N, i.e., outside the park.

---

## 1. TWRA 2026 planned stocking schedule (live tn.gov JSON) — retrieved 2026-09-25 (byte-cache from 2026-09-24 sibling pass, `tmp/research/completion/trout_2026_live.json`)
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json (616 rows; tn.gov blocks plain curl — browser-context fetch)
- Rows for `Mid. Prong Little Pigeon River` (Region 4, Sevier): **10 rows, TYPE "Seasonal", Rainbow Trout**, biweekly:
  - Spring block: 2/15, 3/1, 3/15, 3/29, 4/12, 4/26, 5/10, 5/24 (2026)
  - Fall block: 10/25, 11/8 (2026)
- Fields: REGION 4 | COUNTY Sevier | TYPE Seasonal | SPECIES Rainbow Trout. No DH season, no day-closure.
- Type: planned. Confidence: high. **2026 months supported: Feb, Mar, Apr, May, Oct, Nov. NO planned stocking Jul–Sep, Dec, Jan.** TYPE field itself says "Seasonal."

## 2. TWRA ArcGIS — TWRA_Trout_Stocking_Locations FeatureServer (layer 0 "Trout_MASTER_Project") — queried 2026-09-25 via REST
- URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/ArcGIS/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0/query?where=UPPER(StreamName)%20LIKE%20%27%25PIGEON%25%27&outFields=*&outSR=4326&f=json
- **15 rows** named `Middle Prong Little Pigeon River` (ledger said ~16; count verified at 15): OBJECTIDs 342–354 (13 sites, City "Pittman Center", lat 35.7423→35.8183), 362 (City "Sevierville", 35.83980, −83.48908), 617 (county null, 35.74633, −83.41630). All: Region 4, WaterClass "stream", StockingProgram "**Spring**", Species "rainbow", no DelayedHarvestSeason, no DayClosure.
- Reach/coordinates: Pittman Center cluster spans Webb Creek–Bird Creek–Hills Creek vicinity up to ~35.818/−83.443 (near Emerts Cove covered bridge); single downstream site near Sevierville.
- Establishes: stocked reach structure, region/county, species as-recorded. Does NOT establish months. The 'Spring' program tag is carried on nearly every stream row statewide in this master (e.g., Little Buffalo River, Little River/Townsend) — it is a weak/legacy field, not evidence of spring-only stocking.

## 3. TWRA GIS stocking map "Middle Prong Pigeon River" (tn.gov/twra/gis/troutpdf) — Wayback captures 20100529120411 and 20110411174322, retrieved 2026-09-25
- URL: http://tn.gov/twra/gis/troutpdf/Middle_Prong_Pigeon_River.pdf and http://www.tn.gov/twra/gis/troutpdf/MiddleProngPigeonRiver.pdf
- 1-page map, SEVIER county, stocking-point markers along Little Pigeon "Middle Prong" at Pittman Center; tributaries labeled incl. **Bird Creek**, Webb Creek, Hills Creek; towns Pittman Center/Sevierville/Gatlinburg.
- Type: curated map (ca. 2010–2011). Establishes: the stocked reach and the Bird Creek reference in the prior pass. No months.

## 4. Archived Tentative Trout Stocking Schedules (state.tn.us via Wayback; retrieved 2026-09-25) — month-by-month
Sources: sched03–sched15.pdf captures + tn.gov ts2018/ts2019/ts2019b.pdf (local cache). Grid = Feb–Oct week columns; row `Mid. Prong Pigeon River` / `Mid. Prong Little Pigeon River`. Dates read from PDF text coordinates (PyMuPDF); pre-2010 pages are 90°-rotated text with ±1-week drift — month spans are solid, exact dates approximate for 2003–2009.

| Year | Row present | Marking pattern (as decoded) | Months supported |
|---|---|---|---|
| 2003 | yes (rotated grid) | 13 biweekly marks, Mar–Aug + 1–2 fall marks (Sep/Oct) | Mar–Sep(±Oct) |
| 2004 | yes | 13 biweekly marks Feb 29–Aug 22; no fall block | Feb–Aug |
| 2005 | yes | 13 biweekly marks Feb 27–Aug 31 + Sep 21 | Feb–Sep |
| 2006 | yes | 13 biweekly marks Feb 26–Aug + Sep 20 | Feb–Sep |
| 2007 | yes | 13 biweekly marks Feb 25–Aug + Sep 19 | Feb–Sep |
| 2008 | yes | 13 biweekly marks Feb 24–Aug 27 + Sep 17 | Feb–Sep |
| 2009 | yes | biweekly Feb 22–Aug + Oct 11, Oct 25 | Feb–Aug, Oct |
| 2010 | yes (sched10.pdf p2) | biweekly Feb 21–Jul 11 + Sep 3, Oct 17, Oct 31 | Feb–Jul, Sep, Oct |
| 2011 | yes (sched11.pdf p3) | biweekly Feb 20–Jul 10 + Sep 2, Oct 16, Oct 30 | Feb–Jul, Sep, Oct |
| 2012 | yes (sched12.pdf p2) | biweekly Feb 19–Jul 1 + Sep 30, Oct 14, Oct 28 | Feb–Jul, Sep, Oct |
| 2013 | yes (sched13.pdf p2) | biweekly Feb 17–Jun 30 + Sep 29, Oct 13, Oct 27 | Feb–Jun, Sep, Oct |
| 2014 | yes (sched14.pdf, Wayback 20140412202632) | biweekly Feb 23–Jul 13 + Sep 28, Oct 12, Oct 26 | Feb–Jul, Sep, Oct |
| 2015 | yes (sched15.pdf, Wayback 20150319003402) | biweekly Feb 22–Jul 12 + Sep 27, Oct 11, Oct 25 | Feb–Jul, Sep, Oct |
| 2016–2017 | **no archived schedule found** (sched16/17 captures are error stubs) | — | gap |
| 2018 | yes (ts2018.pdf) | 14 biweekly marks Feb 25–Aug 28; no fall block | Feb–Aug |
| 2019 | yes (ts2019.pdf, ts2019b.pdf) | 14 biweekly marks Feb 24–Aug 27; no fall block | Feb–Aug |
| 2020–2025 | no planned rows recovered (schedule moved to web/JSON; no captures) | completions only (below) | gap |
| 2026 | live JSON (§1) | Seasonal biweekly Feb 15–May 24 + Oct 25, Nov 8 | Feb–May, Oct–Nov |

Schedule-window verdict: across every recovered planned document 2003–2026, **no year plans 12-month stocking. December–January are dark in every document; Jul–Sep dark in all except 2003–2019 grids that end Jul–Aug.** Typical cadence: biweekly Feb–Jul/Aug plus a Sep–Oct (or Oct–Nov) fall block; 2004/2018/2019 had no fall block. NEVER a winter (Dec–Jan) row.

## 5. Completed (destination-level) stocking evidence
- tn.gov completed-feed JSON, Wayback 20240607134309 (`tn_panel_348017491_c/content/tn_complex_datatable.exceldriven.json`): `{"Region":"4","Destination":"Middle Prong Pigeon River","Stocking Date":" 05/28/2024"}` — May 2024 completion. Same row in sibling-pass 2024 archive (`completed2024.txt`, "Middle Prong Pigeon River 05/28/2024").
- TWRA "Trout Stocking Report updated as of 9/27/2024" (local cache scheds/stocking-report-2024.pdf): Middle Prong ABSENT from the Aug–Sep 2024 completion list (consistent with a Feb–May/Oct–Nov program).
- Live completed feed 2026-09-24 (sibling cache `completed2026-jina.txt`, ~30-day window): NO Middle Prong entries (fall block had not started; consistent with 10/25 start).
- Type: destination-level completions. Establishes: program is real and executed (May 2024). Does not establish additional months beyond schedule.

## 6. Prior-pass citation re-verified: Doosey thesis
- Doosey, M.H. 2001. *Fishes of the Little Pigeon River system, Sevier County, Tennessee.* Unpublished M.S. Thesis, University of Tennessee, Knoxville, 204 pp. (citation surfaced via voljournals.utk.edu in search; full text not retrieved this pass).
- Prior pass: thesis documents TWRA stocking the Middle Prong at Pittman Center down to Bird Creek (TWRA 1999 citation). Consistent with §3 map (Bird Creek labeled) and §2 site cluster. Historical continuity of the same stocked reach since at least the 1990s.

## 7. Context / negative findings
- TWRA Region IV Coldwater Reports 2017–2023 (local caches): no Middle Prong (Little Pigeon) analysis. Caution: "Middle Prong Gulf Creek / Middle Prong of Gulf Creek" (r4-2019, r4-2023) is a DIFFERENT water (Gulf Fork of Big Creek, Cocke Co.) — discarded.
- Visit Sevierville (visitsevierville.com, via search): lower Little Pigeon "gets a tad too warm to sustain trout during the warmer" months — supports why Jul–Sep are unstocked at the downstream (Sevierville) end.
- GSMNP reach (Greenbrier; Emerts Cove covered bridge sits at the park edge, Pittman Center): wild trout water; NPS stocks nothing (see roaring-fork.md §7). The wild population inside the park is NOT a basis for classifying the stocked non-park reach.
- Holdover/reproduction basis for year-round: **none found.** No TWRA report, peer-reviewed study, or agency statement documents holdover or natural reproduction supporting a year-round fishery on the stocked reach. Negative searches (4 query variants) surfaced nothing water-specific.
- iNaturalist (api.inaturalist.org, queried 2026-09-25): 18 Oncorhynchus mykiss observations within 10 km of the Pittman Center site cluster (2025–2026, incl. Apr/Jun/Oct). Leads only — cannot distinguish stocked vs wild or park vs non-park reach.
- GBIF occurrence query (Pittman Center box): 0 results.
- Fishbrain water page (via search): lists the water with rainbow trout; Pittman Center 4.5 mi. Lead only.

## 8. Contradictions
- C1: Ledger `year-round-trout` + YR flag vs the 2026 schedule's own TYPE "Seasonal" and 10 biweekly rows confined to Feb–May + Oct–Nov. Resolved against year-round.
- C2: Every archived planned schedule 2003–2026 lacks Dec–Jan; most lack Jul–Sep. No year-round planning document exists for this water.
- C3: GIS 'Spring' StockingProgram tag vs actual multi-month schedules — tag is a near-universal default in the master layer; weak field, ignored for classification.
- C4: Fall block varies by era (Sep–Oct 2005–2015; none 2004/2018/2019; Oct–Nov 2026). Month list should reflect the CURRENT program (2026).
- C5: Same-name risk: "Middle Prong Gulf Creek" in r4 reports is a different water; "Middle Prong Pigeon River" (schedule/completions/map names) IS this water — verified by Region 4/Sevier fields and coordinates.

## 9. Searches run (unproductive noted)
1. `"Middle Prong Little Pigeon River" trout stocking TWRA` — search backend rate-limited (429 ×3 retries), unproductive.
2. `"Middle Prong Little Pigeon" trout stocking Pittman Center` — Fishbrain water page (rainbow trout; Pittman Center). 
3. `Emerts Cove Pittman Center trout fishing Middle Prong` — bridge/access context; local outfitter claims of "wild" trout conflate the park Greenbrier reach.
4. `Emerts Cove covered bridge Pittman Center Little Pigeon River fishing access` (variant) — TripAdvisor/SmokyMountains.com bridge pages.
5. `Doosey thesis Little Pigeon River Tennessee trout TWRA stocking history` — partial ( Abrams Creek hits).
6. `Doosey trout Little Pigeon River Tennessee thesis stocking` — 429.
7. `"Little Pigeon River" trout stocking history TWRA thesis University of Tennessee` — 429.
8. `"Doosey" "Little Pigeon River" trout thesis` — productive (UTK thesis citation, voljournals.utk.edu).
9. `"Fishes of the Little Pigeon River system, Sevier County, Tennessee" Doosey 2001` — productive (visitsevierville.com warmth context also surfaced).
10. `Middle Prong Little Pigeon holdover trout reproduction stocked winter survival` (×5 variants incl. 429s) — negative; no holdover/reproduction evidence.
11. `WATE Gatlinburg trout farm renovation stocking paused Little Pigeon River 2024` — productive (city-program pause; see sibling log).
12. `TWRA resumed trout stocking six-mile stretch West Prong Little Pigeon` — adjacent water (W. Prong); negative for MP.
13. `TWRA "Gatlinburg Streams" stocking schedule weekly rainbow` — sibling-water context.
14. GBIF API occurrence query (Middle Prong box) — 0 results.
15. iNaturalist API query (10 km around 35.77, −83.42) — 18 rainbow trout observations (leads only).
Plus direct opens: 2026 schedule JSON, ArcGIS FeatureServer queries (PIGEON/ROARING/LECONTE/GATLINBURG/EMERT/DUDLEY/BIRD CREEK patterns), sched03–15 Wayback PDFs, ts2018/2019/2019b, Middle_Prong_Pigeon_River.pdf GIS maps ×2, 2024 completed-feed JSON capture, stocking-report-2024.pdf, r4-2017/2018/2019/2020b/2021c/2023 reports, 2012-13 stockedtrout page.

## 10. Recommendation
**`year-round-trout` does NOT survive.** Every TWRA planned document 2003–2026 shows a seasonal put-and-take program; the 2026 schedule's own TYPE is "Seasonal" with biweekly Feb 15–May 24 + Oct 25–Nov 8; no holdover/reproduction basis found; the wild-fish reach is inside the park and is a different water segment. **Recommend `seasonal-trout`, months [2,3,4,5,10,11]** (current-program basis). A defensible alternative historical window is Feb–Jul + Sep–Oct (2005–2015 pattern), but classification should track the current program. Drop the YR flag. Gaps: 2016–2017 and 2020–2025 planned schedules not recovered (Web-era, not archived); completions are destination-level and sparse for this water.
