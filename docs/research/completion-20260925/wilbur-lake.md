# WILBUR LAKE (Wilbur Reservoir) — Evidence Repair Log

- Water: Wilbur Lake / Wilbur Reservoir (~72-acre TVA impoundment between Watauga Dam and Wilbur Dam, Watauga River Mi 34), Carter County TN, Region 4
- Ledger verdict under test: `seasonal-stocked-trout`, months [3,4,5,6,7]
- Sibling waters excluded: Watauga River tailwater below Wilbur Dam (resolved: Mar–Sep + Nov–Dec + brood Oct); Watauga Lake (separate log)
- Research-only pass; retrieval date for all sources: 2026-09-25

---

## 1. TWRA ArcGIS Feature Layer — TWRA_Trout_Stocking_Locations (re-verification)

- Org: TWRA; live layer; retrieved 2026-09-25
- Query: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0/query?where=UPPER(StreamName)+LIKE+%27%25WILBUR%25%27&outFields=*&f=json
- The three LAKE rows (StreamName = "Wilbur Reservoir", WaterClass = "reservoir", StockingProgram = "Tailwater", Species = rainbow, Mgmt = TVA) — matches prior pass rows 713–715:
  1. Site "Wilbur Dam" — NumStocked 250 — 36.34122222, -82.12641667
  2. Site "Access Area / Picnic Area" — NumStocked 250 — 36.33758333, -82.12150000
  3. Site "Campground Area 3" — NumStocked 500 — 36.33355556, -82.12647222
  → 1,000 rainbow/event into the lake's access sites, under the Tailwater program label
- The other 15 Wilbur-name rows: 12 "Wilbur Tailwater" stream rows (WaterClass "stream": Blevins Bend, Hunter Bridge, Siam Bridge, New/Old Hwy 19E bridges, Hwy 400 bridge, Herb Hodge Rd bridge, 5 unnamed points) + n/a for the lake. Strict lake/stream separation maintained.
- Note: DelayedHarvestSeason = None, DayClosure = None on Wilbur Dam site; HoursOpen sunrise–sunset; fishing pier = Yes.
- Type + confidence: agency GIS; HIGH
- Establishes: lake receives its own rainbow events (1,000/event) at three lake access sites; program label "Tailwater" binds these lake sites to the Wilbur tailwater program (same allocation stream as the river)
- Does NOT establish: months

## 2. TWRA Tailwater Trout Stocking handout (tailwater-stocking-schedule.pdf, 2020) — THE binding month row

- Org: TWRA; publication ~2020 (Wayback snapshot 2020-07-24); retrieval 2026-09-25
- URL: https://web.archive.org/web/20200724025911/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/tailwater-stocking-schedule.pdf
- VERBATIM Region IV rows (the prior pass cited "Feb–May"; the actual 2020 text says Feb–Jun):
  - "Watauga River | Wilbur Dam | Rainbow Trout | **March through September** | Special Trout Regulations" → the TAILWATER (sibling water; matches 2022–27 plan Mar–Sep and 2026 JSON row 342)
  - "Wilbur Reservoir | Watauga Dam | Rainbow Trout | **February through June** | Statewide Regulations" → the LAKE (the small impoundment below Watauga Dam), stocked under STATEWIDE regulations (no quality zone inside the lake)
  - Footnote: "* Seasonal Fishery - only productive during stocked months" (applies to starred rivers: Duck, Stones, Ocoee — not to Wilbur rows, which are unstarred)
  - Intro: "TWRA stocks fingerling and adult trout into coldwater tailwaters below dams to provide fishing opportunities. In many tailwaters trout fishing can be good year-round."
- Type + confidence: agency planned program schedule; HIGH
- Establishes: the LAKE's own agency stocking window = February through June, rainbow trout — and its separate identity from the Mar–Sep river row
- Contradiction with ledger: ledger months [3,4,5,6,7] (Mar–Jul) are shifted +1 month vs the 2020 agency window (Feb–Jun)

## 3. Completed destination-level feeds (three independent windows)

1. Coldwater Trout Stocking Schedule PDF, updated 2/18/2022 (Wayback 2022-02-21): https://web.archive.org/web/20220221220911/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Coldwater-Trout_Stocking-Schedule.pdf
   - "4 Wilbur [02/11/2022]" — completed February event, destination "Wilbur" (vs "Wilbur TW" named separately where the river is meant — see (2) and (3), where TW is suffixed). Feb event matches the Feb–Jun window.
2. Completed-feed JSON, Wayback snapshot 2024-06-07: https://web.archive.org/web/20240607134309/https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_panel_348017491_c/content/tn_complex_datatable.exceldriven.json
   - "4 | Wilbur | 05/28/2024" AND "4 | Wilbur TW | 05/31/2024" — two distinct destinations in the same window: the lake ("Wilbur", 05/28) and the river ("Wilbur TW", 05/31). May lake event sits inside Feb–Jun; also inside the ledger's [3–7].
3. Trout_Stocking-Report.pdf (archived 2024-09-27): https://web.archive.org/web/20240927221436/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Trout_Stocking-Report.pdf — tail row "4 Wilbur TW 09/05/2024" (river, September — outside any lake window; river runs Mar–Sep).
4. Live completed feed (retrieved 2026-09-25): https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable.exceldriven.json — "4 Wilbur TW 09/03/2026" (river); no lake row in the live window (expected outside Feb–Jun).
- Type + confidence: completed destination-level; HIGH for the Feb 2022 and May 2024 lake events
- Establishes: destination "Wilbur" (lake) is stocked as a distinct destination from "Wilbur TW"; observed lake events land in February and May — consistent with Feb–Jun; no observed lake event in July in any window

## 4. Habera et al. management plans (2015–2020 and 2022–2027) — reservoir text check

- 2022–2027: "Wilbur Tailwater Trout Fishery Management Plan 2022-2027" (Jim W. Habera, Sally J. Petre, Bart D. Carter, Carl Williams; TWRA, February 2022). Live URL: https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Wilbur-Tailwater-Trout-Fishery-Management-Plan.pdf
- 2015–2020: "Wilbur_Tailwater_Trout_Fishery_2015-2020.pdf" (TWRA; Wayback 2020-09-30): https://web.archive.org/web/20200930133256/https://www.tn.gov/content/dam/tn/twra/documents/fishing/Wilbur_Tailwater_Trout_Fishery_2015-2020.pdf
- Findings (both plans): the plans' scope is the TAILWATER. The lake appears only in BACKGROUND: "Wilbur Dam, at Watauga River Mile (WRM) 34, impounds a small reservoir (~72 acres) about 3 mi. downstream of Watauga Dam." Neither plan describes a lake stocking program, lake months, or lake objectives. 2.3 Stocking (2022 plan): 40,000 adult 9–10-in rainbow/yr tailwater; brown stocking ended 2015; fingerling rainbow discontinued 2021; ENFH retired brood rainbows (2,100/yr, ~half below Blevins Bend Aug–Oct) — all river.
- Type + confidence: agency plans; HIGH (full text searched)
- Establishes: lake acreage (~72 ac) and TVA/TWRA context; confirms plans do NOT govern the lake
- Does NOT establish: lake months — the plans are silent on the lake program
- Note: the GIS "Tailwater" program label on the 3 lake sites is the mechanism by which the lake receives river-program fish; the 2020 handout is the only document that gives the lake its own month window.

## 5. TMP 2017–2027 (statewide plan) — Wilbur on the nine-reservoir list

- Same STMP as sibling log (retrieval 2026-09-25; Wayback URL there)
- VERBATIM: nine reservoirs list INCLUDES "Wilbur" (Dale Hollow, Parksville, South Holston, Wilbur, Watauga, Fort Patrick Henry, Calderwood, Chilhowee, Tellico); criterion: "Only reservoirs that maintain a year-round supply of cold, well-oxygenated water can support trout fisheries."
- CONTRADICTION with the Reservoir Trout Stocking handout: the 2018/2020 handout's Region IV reservoir stocking list = Fort Patrick Henry, South Holston, Tellico (upper), Watauga — WILBUR IS ABSENT. Reconciliation: Wilbur's trout are not stocked under the winter "Reservoir" program; they are stocked under the Tailwater program (GIS label; handout row "Wilbur Reservoir | Watauga Dam | Feb–Jun"), which is why Wilbur appears on the STMP nine-reservoir list (fishery support) but not the winter reservoir-stocking list (program administration). This dual treatment is the key to the ledger question: the lake is a tailwater-program water with its own Feb–Jun window.
- TVA corroboration: "The Grand Old Dam" (tva.com story; Wayback 2020-08-12): https://web.archive.org/web/20200812041503/https://www.tva.com/about-tva/our-history/built-for-the-people/the-grand-old-dam — "Today, Wilbur is a popular spot for fishing enthusiasts... The primary game fish are trout... Rainbow trout are stocked on an annual basis and thrive in the cold, clear water, which has good dissolved oxygen levels." (annual rainbow stocking + cold, well-oxygenated habitat — supports some carryover, but no agency statement of a year-round fishery for the small lake)

## 6. Negative findings / unproductive sources

- Region IV Coldwater Trout Reports 2017–2023 (Coldwater-Trout-Report-R4-2017/2018/2019/2020/2021/2023.pdf): tailwater + wild-stream surveys only. "Wilbur (Watauga River)" chapters cover the RIVER (12 monitoring stations, Quality Zone); the ~72-acre reservoir has no section. cw_r4_2021 text layer failed to extract (scanned pages) but TOC/structure of 2019/2023 confirm scope. No lake months here.
- 2018/2019/2020 "Trout Stocking Schedule" stream PDFs: Feb–Oct stream tables; zero Watauga/Wilbur/reservoir rows.
- 2026 planned JSON: no "Wilbur Reservoir"/lake row at all (only the combined "Wilbur Tailwater / Watauga River" river row, M,A,M,J,J,A,S). The lake's Feb–Jun program does not appear in the 2026 planned table — same coverage gap as Watauga Lake's winter rows.
- Prior-pass memory "TWRA's 2010/2020 tailwater schedules listed Feb–May": the 2020 document retrieved here actually reads "February through June" — the ledger's [3,4,5,6,7] cannot be traced to this row; if a 2010 document said Feb–May, it has not been re-located in this pass (2010-era PDFs not in the DAM CDX pull).
- Bettoli 1999 (creel survey, salmonids stocked into Watauga River below Wilbur Dam) and Damer & Bettoli 2008 (fate of brook trout stocked below Wilbur Dam): tailwater studies (river, not lake); cited in R4 2019 report references.
- Third-party leads only (NOT evidence): tennesseefishingspots.com (species list incl. lake trout in Wilbur Reservoir), tourcartercounty.com "Wilbur Lake hidden gem", fishbrain reports. Single catches/claims = leads.

## Searches run (Wilbur Lake; incl. unproductive)

1. TVA US Fish Wildlife Service trout stocking Watauga Wilbur reservoirs agreement — georgiatu.org Nov 2024 (Wilbur named among stocked reservoirs)
2. georgiatu.org "multi-agency agreement" Blue Ridge hatcheries trout Watauga Wilbur — homepage only; article URL 404
3. "georgiatu.org" multi-agency agreement Blue Ridge trout hatchery Watauga Wilbur — same
4. Georgia TU multi-agency agreement Blue Ridge mitigation hatcheries trout November 2024 — same
5. chattanoogan.com TVA partners fund trout stocking Tennessee Virginia waters 2015 "Wilbur" — noise
6. TVA partners fund trout stocking Tennessee Virginia Wilbur reservoir 2015 — noise
7. "TVA" trout stocking Wilbur 2015 Tennessee Virginia partnership fund — noise
8. chattanoogan.com TVA trout stocking tailwaters Wilbur — NE TN tourism only
9. "TVA" "partners" fund trout stocking 2015 Tennessee Virginia agencies Wilbur Dam — noise
10. "Wilbur Reservoir" Tennessee trout stocking rainbow Carter County TWRA — tennesseefishingspots species list (lead); eregulations pointer
11. "Wilbur Lake" OR "Wilbur Reservoir" Elizabethton Tennessee trout fishing rainbow holdover summer — rate-limited (429, no results returned)
12. Wilbur Lake Elizabethton TN trout fishing — rate-limited
13. Wilbur Reservoir Tennessee trout fishing — rate-limited
14. Wilbur Reservoir Tennessee trout fishing rainbow months best season — TVA "Grand Old Dam" article surfaced ("Rainbow trout are stocked on an annual basis... cold, clear water... good dissolved oxygen")
15. "Wilbur Reservoir" trout fishing Tennessee rainbow trout when to fish — tva.com "The Grand Old Dam" hit
16. Wilbur Reservoir trout fishing best time of year spring summer fall Tennessee — rate-limited
17. Habera Wilbur tailwater trout management plan 2022 TWRA stocking 40000 rainbow — ResearchGate secondary only
18. Habera Wilbur dam tailwater trout management plan TWRA 2022 — same
19. "Wilbur" tailwater trout management plan Tennessee "40,000" rainbow trout stocking — Scribd noise
20. Wilbur Reservoir tailwater trout fishery management plan TWRA 2022 — no direct hit (PDF retrieved directly instead)
21. Bettoli 1999 creel survey salmonids stocked "Watauga River below Wilbur Dam" fisheries report — citation confirmed; also surfaced "sampled stocked Salvelinus namaycush in Watauga Lake" (sibling log)
22. Bettoli 1999 verbatim citation search — SEAFWA brown trout trophy-regs paper pointer (tailwater)
23. georgiawildlife.com TVA FWS trout stocking Fort Patrick Henry South Holston Parksville Watauga Wilbur — georgiatu.org list re-confirmed ("Trout-stocked reservoirs in the plan include ... Watauga and Wilbur reservoirs")
24. "Wilbur Reservoir" OR "Wilbur Lake" Tennessee campground fishing pier trout "72 acres" — tourcartercounty.com lead; TWRA Watauga R4 page surfaced
25. (dataset work, not web search): ArcGIS 19-row pull; 2020 tailwater/reservoir schedule PDFs; 2022 coldwater completed schedule; 2024 completed-feed JSON + Sept 2024 report; live feed; both Wilbur plans full-text; R4 coldwater reports; 2018/2019/2020 stream schedules; 2026 JSON

## Months/season stocking table — Wilbur Lake

| Source | Type | Destination named | Species | Months/season |
|---|---|---|---|---|
| TWRA Tailwater Trout Stocking handout (2020) | planned program | "Wilbur Reservoir (below Watauga Dam)" | Rainbow Trout | **February through June**, Statewide regs |
| GIS layer (live 2026) | program structure | 3 lake sites (Wilbur Dam / Access Area / Campground Area 3) | rainbow, 250+250+500/event, program "Tailwater" | no months |
| Completed schedule 2/18/2022 | completed | "Wilbur" | (unspecified) | 02/11/2022 event (February) |
| Completed feed JSON (Jun 2024 snapshot) | completed | "Wilbur" (distinct from "Wilbur TW") | (unspecified) | 05/28/2024 event (May) |
| Completed feeds Sep 2024 / Sep 2026 / live | completed | "Wilbur TW" only (river) | rainbow | no lake rows outside spring windows |
| 2026 planned JSON | planned | no lake row (only river row Mar–Sep) | — | coverage gap |
| 2022-27 + 2015-20 plans | planned/narrative | reservoir in background only (~72 ac) | — | silent on lake |
| STMP 2017–2027 | narrative | "Wilbur" on nine-reservoir list | — | criterion = year-round cold water; stocking discussion is winter-reservoir (Watauga-bound) |

## Verdict + recommendation — Wilbur Lake

- Verdict: `seasonal-stocked-trout` HOLDS. There is no evidence of continuous stocking, and no agency claim of a year-round fishery for the small (~72 ac) lake (TVA praises the cold water but frames stocking as annual put-and-take rainbow; the STMP nine-list criterion is about fishery support, not stocking continuity). Seasonal classification is correct.
- Months: replace [3,4,5,6,7] with [2,3,4,5,6] (February through June) per the most recent agency program row (2020 handout: "Wilbur Reservoir | Watauga Dam | Rainbow | February through June"), corroborated by completed events on 02/11/2022 (Feb) and 05/28/2024 (May). No observed lake event in July; July has no support in any retrieved document. The prior-pass "Feb–May" recollection is superseded by the verbatim 2020 "February through June" row.
- Confidence: HIGH on seasonal classification; MEDIUM-HIGH on Feb–Jun exactness (single program document; events confirm Feb and May; Jun never directly observed in sampled windows but is inside the agency-stated window).
- Species: rainbow trout only (1,000/event across 3 lake sites, 9–10-in adults per program norms); statewide regulations (7/day, no size limit) inside the lake vs the Quality Zone on the river.
- Gaps: the lake's Feb–Jun row has not been re-issued on the live site (handout is 2018/2020 Wayback era); 2026 planned JSON omits the lake; no 2010 schedule re-located to test the "Feb–May" memory; Jun/Jul lake events unverified at destination level.
