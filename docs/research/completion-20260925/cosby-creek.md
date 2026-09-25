# Cosby Creek (Cocke County, TN) — year-round flag audit
Retrieval date for all sources: 2026-09-25. Research only; no agency contacted.

Ledger verdict under test: `year-round-trout`, YR flag, no months.
**Conclusion up front: year-round does NOT survive. TWRA types Cosby Creek "Seasonal" and has stocked it biweekly March–June (occasionally touching Jul 1–4) in every retrieved year 2010–2026. There is no fall stocking and no winter stocking in any retrieved year. No agency holdover/reproduction documentation for the stocked reach. The upper creek inside GSMNP is a wild brook/rainbow fishery (NPS, no stocking since 1975). Recommend re-class: seasonal (stocked reach), months Mar, Apr, May, Jun; park reach = wild year-round NPS fishery if the ledger covers the whole creek.**

---

## The water and its reaches
- Cosby Creek drains the north side of GSMNP (Cocke Co.), flows north through the Cosby community (SR-32/35 corridor) to the Pigeon River.
- **Park reach (upstream of boundary, ~35.76 N):** wild rainbows below Cosby Campground, wild brook trout above; NPS manages; unstocked since 1975.
- **Stocked reach (below the park boundary, Cosby community, OUTSIDE park):** 12 TWRA access points at 35.788–35.873 N, −83.225 to −83.249 W; management = "Private Land"; StockingProgram = **Spring**; species = rainbow.
- ArcGIS: OBJECTIDs 302–313, `TWRA_Trout_Stocking_Locations/FeatureServer/0`, Region 4, Cocke/Cosby.
- Not on TWRA's wild-trout special-regulations list.

## Sources

### S1. TWRA 2026 Trout Stocking Schedule (state datatable JSON, 616 rows)
- Org: TWRA. URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json (local `tmp/research/completion/schedule2026-jina.txt`)
- Fields: REGION 4 | COUNTY Cocke | LOCATION "Cosby Creek" | TYPE **"Seasonal"** | SPECIES "Rainbow Trout".
- Rows (week-of Sundays, 2026): 3/1, 3/15, 3/29, 4/12, 4/26, 5/10, 5/24, 6/7, 6/21 — 9 rows, Mar 1–Jun 21 biweekly. No fall/winter rows.
- Establishes: 2026 plan; Seasonal type. All "Cosby" rows are Cocke.

### S2. TWRA archived grid schedules 2010, 2018–2021 (PDF, word-coordinate mapping)
- Files/URLs: sched10.pdf (state.tn.us, local `raw/`); ts2018.pdf, ts2019b.pdf (`completion/scheds/`); schedcomplete_2020.pdf (`raw/`); 2021 Complete: https://web.archive.org/web/20211009224615if_/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Trout-Stocking-Schedule-Complete.pdf
- Cosby Creek rows (week-of Sundays):
  | Year | Season | Dates | Count |
  |---|---|---|---|
  | 2010 | Spring | Mar 7, 21; Apr 4, 18; May 2, 16, 30; Jun 13, 27 | 9 |
  | 2018 | Spring | Mar 11, 25; Apr 8, 22; May 6, 20; Jun 3, 17; Jul 1 | 9 |
  | 2019 | Spring | Mar 10, 24; Apr 7, 21; May 5, 19; Jun 2, 16, 30 | 9 |
  | 2020 | Spring | Mar 8, 22; Apr 5, 19; May 3, 17, 31; Jun 14, 28 | 9 |
  | 2021 | Spring | Mar 14, 28; Apr 11, 25; May 9, 23; Jun 6, 20; Jul 4 | 9 |
- Establishes: five fully-parsed years, all Mar–Jun/early-Jul only; no fall/winter marks. Confidence high.
- Note: 2011–2013 grids show 9 marks/year (same count; column mapping degraded in text layer — pattern assumed same). 2014–2017 not retrieved (dead captures).

### S3. TWRA Complete schedules 2023, 2024, 2025 (Wayback captures, same method)
- URLs: web.archive.org/web/20230220040610, /20240222194223, /20250320072447 — same `.../fishing/trout/Trout-Stocking-Schedule-Complete.pdf` (md5s 3a748e6b…, c3cfa00d…, fecd884c…; distinct files, no replay collision among the three retrieved).
- Cosby Creek rows: 2023 Mar 5–Jun 25 (9); 2024 Mar 3–Jun 23 (9); 2025 Mar 2–Jun 22 (9). Confidence high.

### S4. Completed-stocking feeds (destination-level)
- (a) Completed JSON, Wayback 20240607 capture: "Cosby Creek", Region 4, Stocking Date **05/28/2024** (executed).
- (b) 2022 coldwater snapshots (Wayback): Feb 18 2022 winter list — Cosby Creek ABSENT; May 19 2022 — "4 Cosby Creek 05/03/2022"; Jun 29 2022 — "4 Cosby Creek 05/24/2022"; Aug 19 2022 — ABSENT (summer gap).
- (c) Live Sept 2026 completed feed (published 9/24/2026): Cosby Creek not in rolling window (season over). Jumbled live-page datatable pairs "Cosby Creek … 03/22/2026" (execution of the mid-March wave; single-catch lead, jumbled layout).
- Establishes: spring executions 2022/2024; absence from winter and midsummer lists. Confidence high.

### S5. News: spring 2025 conclusion (search-surfaced lead)
- Jefferson County Post, June 24, 2025 headline surfaced twice in web search: "TWRA concluded its spring trout stocking in Cosby Creek (Cocke County) on Monday, June 23, 2025." Article page not retrievable in this pass (search index only; direct URL not obtained). Consistent with the 6/22/2025 week-of row (Mon 6/23 within 5 days).
- Establishes (medium confidence): 2025 spring season ran through late June, then stopped.

### S6. TWRA Region IV trout reports — wild fishery documentation
- 2007 Region IV Trout Report (`raw/r4_2007.txt`; also 2009/2010/2011/2013): Table B-1 "Streams sampled qualitatively during 1991-2007 to determine the presence of wild trout" lists **Cosby Creek (5 samples, French Broad/Pigeon watershed group)** — i.e., TWRA's own wild-trout documentation for the creek; also quotes Shields (1950): Indian Camp Creek (Cosby Creek tributary, park-boundary stream) "some carryover of stocked fish" and heavy fishing load — 1950s context only, not the modern stocked reach.
- 2018 Region IV report (`completion/scheds/r4-2018.txt`): brook trout translocation source options include "GSMNP streams (e.g., Cosby Creek) with cooperation from the NPS" — Cosby Creek's in-park population is a recognized wild brook trout stock.
- Establishes: agency-documented wild trout (brook, and wild rainbow per Indian Camp work) in the creek system; the wild fishery is in/above the park boundary; no agency statement of holdover/reproduction in the stocked (below-park) reach. Confidence high for wild-in-park; absent for holdover-below-park.

### S7. NPS GSMNP fishing page
- https://www.nps.gov/grsm/planyourvisit/fishing.htm (fetched 2026-09-25): "The National Park historically stocked non-native trout for recreation until 1975…"; "Fishing is permitted year-round…"; Cosby Creek not mentioned by name. Establishes: in-park reach unstocked since 1975; year-round open season (NPS). Confidence high.

### S8. Angler/guide sources on reaches (secondary)
- Coastal Angler Magazine, "Fly Fishing Cosby Creek (GSMNP)": https://coastalanglermag.com/fly-fishing-cosby-creek-tennessee-gsmnp (fetched 2026-09-25) — brook trout "as low as just below the Cosby Campground"; below campground mostly (wild) rainbows; "all trout … are wild, streambred trout"; the stream "is stocked just outside of the park."
- Perfect Fly Store and Fly Fishing Smoky Mountains (search results): rainbows + brook below campground, brook above; trout catchable "all but the coldest winter days" (angler claim, in-park wild fish).
- Establishes: two-segment structure (wild in-park; stocked just outside). Confidence medium (secondary).
- GBIF/iNaturalist (bbox 35.74–35.90 N, −83.28–−83.18 W): O. mykiss observations 2014–2026 incl. "2015-06-28 Cosby Creek" and "2021-06-14 Cosby Park Rd" (iNat). Context only.

### S9. TWRA trout regulations page
- https://www.tn.gov/twra/fishing-regs/trout-regulations.html (fetched 2026-09-25): Cosby Creek NOT listed (no wild-trout special regs, no delayed harvest). Statewide trout rules apply. Confidence high.

### S10. TWRA ArcGIS stocking layer (live query)
- https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0/query (fetched 2026-09-25, where County IN ('Blount','Cocke')): 12 Cosby Creek points, StockingProgram "Spring", species rainbow, management Private Land, Cocke/Cosby.
- Establishes: destination-level program metadata; Spring only. Confidence high.

## Months supported, by year
| Year | Months with rows | Evidence |
|---|---|---|
| 2010 | Mar–Jun | sched10 grid (high) |
| 2011–2013 | Mar–Jun pattern (9 marks/yr; columns degraded) | sched11–13 (medium) |
| 2014–2017 | not retrieved | gap |
| 2018 | Mar–Jun (+Jul 1) | ts2018 (high) |
| 2019 | Mar–Jun | ts2019 (high) |
| 2020 | Mar–Jun | sched2020 (high) |
| 2021 | Mar–Jun (+Jul 4) | Complete 2021 (high) |
| 2022 | May (executed 5/3, 5/24); absent Feb & Aug lists | coldwater snapshots (high) |
| 2023 | Mar–Jun | Complete 2023 (high) |
| 2024 | Mar–Jun; executed 5/28 | Complete 2024 + completed feed (high) |
| 2025 | Mar–Jun; executed through 6/23 | Complete 2025 + JC Post lead (high/medium) |
| 2026 | Mar–Jun | 2026 JSON (high, TYPE=Seasonal) |

Never stocked: Aug–Feb in any retrieved year. Fall: never (0 rows in 9 fully-parsed years).

## Contradictions and gaps
- No fall or winter stocking found anywhere 2010–2026 — the year-round flag has no stocking basis at all.
- No holdover/reproduction documentation for the stocked reach (only 1950s "carryover" note for tributary Indian Camp Creek; stocked reach is warm-enough in summer that TWRA stops — no agency summer viability statement).
- 2014–2017 schedules missing (Wayback empties); 2011–2013 count-only. Neither can hide a fall/winter program against the 2010–2026 wall of seasonal evidence.
- In-park reach IS fishable year-round (NPS) and holds wild trout — if the ledger row intends the whole creek, the correct label is a wild year-round NPS fishery upstream + TWRA spring put-and-take downstream; not "year-round stocked trout."

## Searches run (Cosby Creek)
1. WebSearch: "Cosby Creek" Cocke County trout fishing stocked rainbow TWRA reports — schedule + JC Post headline.
2. WebSearch: "TWRA Concludes Spring Trout Stocking" Cosby Creek 2025 — headline re-surfaced; article not retrievable.
3. WebSearch: Cosby Creek TWRA trout stocking June 2025 Jefferson County Post — same lead.
4. WebSearch: "Cosby Creek" fishing trout year round winter holdover campground — angler sources (Perfect Fly, Fly Fishing Smoky Mountains, Coastal Angler); no agency holdover doc.
5. WebSearch: Cosby Creek trout stocking truck TU partner Cocke news 2023 2024 — unproductive.
6. WebSearch: TWRA Cosby Creek Fishing Forecast — no dedicated forecast page found.
7. WebSearch: TWRA 2025 schedule "Cosby Creek" (shared with LR) — tn.gov confirmation.
8. WebSearch: Cosby Creek 2026 rows (via dataset JSON, S1).
9. GBIF API Cosby bbox — 6 O. mykiss records (iNat mirrored).
10. iNaturalist API Cosby bbox — 4 records 2014–2025.
11. WebFetch: coastalanglermag Cosby Creek page (S8).
12. WebFetch: NPS fishing page (S7) — Cosby not mentioned.
13. WebFetch: tn.gov trout-regulations (S9).
14. Local-mining equivalents: 2026 JSON grep; scheds 2010–2025 grids; 2022 snapshots; 2007/2009/2010/2018 Region IV reports; ArcGIS query.
15. Unproductive: mywaterlevel.com (listing only), Piscamaps (species list only), Facebook forum posts (no dates).

## Recommendation
- **Re-class Cosby Creek from `year-round-trout` to seasonal.** TWRA's own 2026 TYPE = "Seasonal"; 9 fully-parsed years (2010, 2018–2021, 2023–2026) + 2022/2024 execution lists show a single biweekly **March–June** wave (occasionally spilling to Jul 1–4); zero fall and zero winter events in any retrieved year; ArcGIS program tag = "Spring"; species = rainbow only.
- Ledger months: **Mar, Apr, May, Jun** (note possible early-Jul execution week).
- If the ledger covers the whole creek, add a second, separate classification for the park reach: **wild brook/rainbow trout fishery, NPS-managed, year-round open season, no stocking since 1975** (2010 trout report Table B-1 wild sampling; 2018 report NPS-cooperation note; Coastal Angler reach description).
- Confidence: high for the seasonal verdict; the June 23, 2025 completion detail rests on a news headline (article not fetched).
