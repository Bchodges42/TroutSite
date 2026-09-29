# WATAUGA LAKE (Watauga Reservoir) — Evidence Repair Log

- Water: Watauga Lake / Watauga Reservoir (TVA storage impoundment of the Watauga River, 6,430–6,432 ac), Carter County TN (extends into Johnson County), Region 4
- Ledger verdict under test: `year-round-trout` (YR flag, no months)
- Sibling waters explicitly excluded: Watauga River tailwater below Wilbur Dam (resolved separately, Mar–Sep + Nov–Dec + brood Oct under 2022–27 Wilbur plan); Wilbur Lake (separate log)
- Research-only pass; retrieval date for all sources: 2026-09-25
- Standards applied: schedule rows = planned evidence (dated; lake vs tailwater strictly separated); completed = destination-level; year-round requires continuous stocking OR agency-documented holdover/refuge; single catches = leads

---

## 1. TWRA 2026 Planned Trout Stocking Schedule (JSON, 616 rows)

- Title: "Trout Stocking (2026)" planned-schedule datatable
- Org: Tennessee Wildlife Resources Agency (TWRA)
- Publication: 2026 stocking-year table (live page last verified 2026-09-25)
- Observation: planned rows for 2026
- Retrieval: 2026-09-25
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json
- Fields: REGION, COUNTY, LOCATION, TYPE, STOCKING DAY, STOCKING WEEK, STOCKING MONTHS, SPECIES
- Watauga/Wilbur rows found (complete): exactly ONE of 616 —
  - Row 342: Region 4 | Carter/Washington | "Wilbur Tailwater / Watauga River" | Tailwater | MONTHS M,A,M,J,J,A,S (Mar–Sep) | Rainbow Trout → binds to the TAILWATER, not the lake
- Lake rows: NONE. No "Watauga Reservoir/Lake" planned row anywhere in 2026.
- Cross-check of TYPE distribution: TYPE="Reservoir" rows number only 3 of 616 — Dale Hollow Reservoir (A, Brown), Calderwood Reservoir (N,D, Rainbow), Chilhowee Reservoir (F,N,D, Rainbow). The 2026 planned table omits ALL winter reservoir stockings (Watauga, South Holston, Fort Patrick Henry, Wilbur) — a schedule-coverage gap, not evidence against the lake program.
- Type + confidence: planned schedule; HIGH confidence in extraction (full JSON parsed)
- Establishes: separation of tailwater row from lake; absence of 2026 lake plan row
- Does NOT establish: absence of lake stocking program (see completed feeds + program handouts)

## 2. TWRA ArcGIS Feature Layer — TWRA_Trout_Stocking_Locations

- Org: TWRA (ArcGIS Online hosted, services3.arcgis.com/PWXNAH2YKmZY7lBq)
- Observation: live layer (layer 0 "Trout_MASTER_Project"); retrieved 2026-09-25
- URL (query used): https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0/query?where=UPPER(StreamName)+LIKE+%27%25WATAUGA%25%27+OR+UPPER(StreamName)+LIKE+%27%25WILBUR%25%27&outFields=*&f=json
- All WATAUGA-bound rows (StreamName = "Watauga Reservoir"), 4 of the 19 Watauga/Wilbur rows — the LAKE, Program = "Reservoir", WaterClass = "reservoir", Species = rainbow_brown, NumStocked blank (bulk winter loads):
  1. Site: (none) — 36.32091176, -82.11705411
  2. Site: "Campbell Rd." — 36.31487959, -81.99596946
  3. Site: "Lakeshore Marina" — 36.32107588, -82.06611281 (Mgmt: Marina)
  4. Site: "Rat Branch boat ramp" — 36.30470812, -82.11894375 (Mgmt: USFS)
- Distinct from 12 "Wilbur Tailwater" stream rows (WaterClass "stream") and 3 "Wilbur Reservoir" lake rows (see wilbur-lake.md)
- Type + confidence: agency GIS; HIGH
- Establishes: Watauga Lake has dedicated stocking access sites under Program="Reservoir" with a rainbow_brown species plan — binding is LAKE, not tailwater
- Does NOT establish: months (no month fields in layer)

## 3. Tennessee Trout Management Plan 2017–2027 (STMP)

- Title: "Tennessee Trout Management Plan 2017-2027"; authors: TWRA (Jim W. Habera et al.)
- Publication: 2017; retrieval 2026-09-25
- URL (live 404s; Wayback): http://web.archive.org/web/20250902003657/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Tennessee-Trout-Management-Plan-2017-2027.pdf
- VERBATIM (p. 10, "Reservoirs"):
  - "Only reservoirs that maintain a year-round supply of cold, well-oxygenated water can support trout fisheries. Tennessee has nine reservoirs that currently support trout fisheries: Dale Hollow, Parksville, South Holston, Wilbur, Watauga, Fort Patrick Henry, Calderwood, Chilhowee, and Tellico (~62,400 acres total)."
  - "Trout are stocked during the winter to assure that surface water temperatures are cold enough for their survival. Stocking later in winter (March vs. January) can help decrease mortality due to predation, especially by Walleye Sander vitreus (Ivasauskas and Bettoli 2010). Approximately 215,000 9-inch Rainbow Trout are stocked into Tennessee reservoirs annually."
  - "Lake Trout (S. namaycush) are stocked in Watauga, South Holston, and Chilhowee reservoirs (about 150,000 6-inch fish annually)..."
  - "Russell and Bettoli (2011) found that annual Lake Trout growth rates in Watauga and South Holston were high enough to suggest that neither system was being overstocked."
  - "Brown Trout are currently stocked in Watauga and South Holston reservoirs (25,000 trout/reservoir) to create new fisheries..."
  - "Most successful anglers catch trout in reservoirs by targeting them during summer when they are limited to deep-water habitat."
- Type + confidence: agency management plan; HIGH
- Establishes: (a) Watauga Lake named on the nine-reservoir list; (b) AGENCY criterion for that list = year-round cold, well-oxygenated water (deep cold TVA storage reservoir statement); (c) species program = Rainbow (winter 9-in) + Lake Trout (~150k 6-in/yr, statewide figure) + Brown (25,000/reservoir); (d) stocking season = WINTER (not continuous); (e) agency-documented summer deep-water fishery (holdover)
- Does NOT establish: exact per-event counts for Watauga alone; month list beyond "winter"

## 4. TWRA "Reservoir Trout Stocking" handout (Reservoir-Stocking-Schedule.pdf), 2018 and 2020 versions

- Org: TWRA; publication ~2018 (snapshot 2018-07-17) and ~2020 (snapshot 2020-07-24); retrieval 2026-09-25
- URLs:
  - 2020: https://web.archive.org/web/20200724025913/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/reservoir-stocking-schedule.pdf
  - 2018: https://web.archive.org/web/20180717180324/https://www.tn.gov/content/dam/tn/twra/documents/Reservoir-Stocking-Schedule.pdf
- VERBATIM (both versions): "TWRA stocks the following reservoirs with trout during the winter to provide year-round trout fishing opportunities."
  - Region IV rows: Fort Patrick Henry (Brown and Rainbow), South Holston (Brown, Lake, Rainbow), Tellico (upper) (Rainbow), **Watauga — Brown, Lake, and Rainbow**
  - (Region III: Dale Hollow, Parksville, Calderwood, Chilhowee)
  - "Statewide Regulations — Daily Limit: 7 trout ... (no more than 2 of which may be Lake Trout). Minimum Length Limit: none"
- Type + confidence: agency program handout; HIGH
- Establishes: explicit agency statement binding WINTER reservoir stocking to "year-round trout fishing opportunities," with Watauga listed for Brown + Lake + Rainbow. This is the strongest direct "year-round" formulation for the lake.
- Contradiction note: WILBUR is absent from this reservoir handout (Wilbur's trout flow through the Tailwater program — see wilbur-lake.md); Watauga's presence is unambiguous.

## 5. TWRA "Coldwater Trout Stocking Schedule" (completed destination table), updated 2/18/2022

- Org: TWRA; publication Feb 18, 2022; retrieval 2026-09-25 (Wayback)
- URL: https://web.archive.org/web/20220221220911/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Coldwater-Trout_Stocking-Schedule.pdf
- Region 4 rows (completed destination-level): "...4 South Holston [01/26/2022]; **4 Watauga [01/25/2022]**; 4 West Prong Little Pigeon River (Gatlinburg) [02/09/2022]; **4 Wilbur [02/11/2022]**"
- Type + confidence: completed destination-level feed; HIGH (dates read from raw-mode extraction)
- Establishes: destination "Watauga" (the reservoir, consistent with winter reservoir program; the tailwater destinations are separately named, e.g., "Wilbur TW") received a completed stocking on 01/25/2022 — mid-winter, matching the reservoir program

## 6. Completed feeds — 2024 archive and live window

- 2024 archive (Wayback snapshot 2024-06-07 of the stockings page feed, Region/Destination/Stocking Date): https://web.archive.org/web/20240607134309/https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_panel_348017491_c/content/tn_complex_datatable.exceldriven.json
  - Rolling window early-May→early-June 2024, 54 rows: contains "Wilbur 05/28/2024" and "Wilbur TW 05/31/2024"; NO "Watauga" destination (lake or TW) in that window — expected, since the lake program is winter
- Sept 2024 completed report PDF (snapshot 2024-09-27): https://web.archive.org/web/20240927221436/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Trout_Stocking-Report.pdf — Region 4 tail: "...4 Wilbur TW 09/05/2024"; no Watauga row (summer window again)
- Live feed (retrieved 2026-09-25): https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable.exceldriven.json — 10-row rolling window contains only "Wilbur TW 09/03/2026" for our waters; no Watauga
- Establishes: completed destination-level "Watauga" row exists in winter windows (Jan 2022); rolling windows sampled (May/Jun/Sep) show none — consistent with winter-only lake stocking; "none expected in rolling windows" prediction from ledger HOLDS for the sampled windows

## 7. TWRA "Where to Fish — East Tennessee Region 4: Watauga Reservoir" page

- Org: TWRA; page last modified 28 Jul 2026 (meta lastModified); retrieval 2026-09-25
- URL: https://www.tn.gov/twra/fishing/where-to-fish/east-tennessee-r4/watauga-reservoir.html
- VERBATIM (Trout section): "TWRA has stocked rainbow, brown, and lake trout in the reservoir. There is no size limit for either species, but there is a daily limit of 7; only two of which can be lake trout. Lake trout, a cousin of the native brook trout, is a non-native species selected for stocking because of the cold, well-oxygenated, habitat present. The best lake trout fishing takes place between Watauga Point and Butler Bridge."
  - Fishing Tips: "Rainbow and Brown Trout – Spring: Bank fish with corn or salmon eggs. Summer: Troll spoons in 30 to 50 feet of water." / "Lake Trout – Summer: Troll spoons in 90 to 120 feet of water."
  - Trout regulation: "Seven (7) per day, no length limit, only two (2) may be lake trout."
- Type + confidence: agency narrative; HIGH
- Establishes: (a) three-species stocked program in the LAKE; (b) agency "cold, well-oxygenated habitat" statement (the holdover refuge criterion); (c) summer deep-water fishery guidance (fish persist in-reservoir through summer = carryover); (d) lake-specific regulation (2-lake-trout cap) implying a sustained in-lake population
- Does NOT establish: stocking months

## 8. Russell & Bettoli 2011 — lake trout population attributes (corroboration)

- Title: "Population Attributes of Lake Trout in Tennessee Reservoirs" (K. Russell & P.W. Bettoli, Tennessee Cooperative Fishery Research Unit/TTU); gill-net sampling 2009–2010; published ~2011–2013 (JSTOR/Proceedings)
- Retrieval 2026-09-25 (search-level corroboration only; paywalled)
- Establishes: stocked Salvelinus namaycush sampled in Watauga Lake 2009–2010 with high growth rates (TMP cites it as "not overstocked") — independent confirmation of an ongoing multi-year lake program with surviving fish
- Does NOT establish: months

## 9. Negative findings / contradictions

- Region IV "Coldwater Trout Report" PDFs (2017–2023, e.g., Coldwater-Trout-Report-R4-2019.pdf, R4-2023.pdf — Wayback 2022-08 / 2023-08 snapshots): these are TAILWATER + wild-stream reports. Wilbur/Watauga appearances are "Wilbur (Watauga River)" tailwater sections and Watauga River watershed stream data; there is NO Watauga Reservoir section. The ledger's "Region 4 coldwater report reservoir text (two-story program?)" expectation is NOT met by these documents — the reservoir text lives in the STMP, the Reservoir Stocking handout, and the R4 where-to-fish page instead.
- 2026 planned JSON omits all winter reservoir rows (coverage gap in the planned table itself — 3 Reservoir-type rows only).
- "Continuous stocking" is NOT supported: STMP says reservoir trout are stocked in winter. The year-round verdict must rest on the agency holdover criterion (cold, well-oxygenated water + summer deep-water fishery), which both the STMP and the R4 page state explicitly.
- Unmatched prior-pass note: TMP also lists Wilbur among the nine reservoirs (see sibling log).

## Searches run (Watauga Lake; incl. unproductive)

1. TWRA "Watauga Reservoir" trout stocking year-round reservoir rainbow brown — led to STMP/ResearchGate pointers
2. TWRA "Region IV" OR "Region 4" coldwater report Watauga Reservoir trout cree — digitalcommons/StoryMap pointers, no direct PDF
3. TWRA "Coldwater" report Region 4 "Watauga Reservoir" site:web.archive.org OR tn.gov pdf — none; pivoted to CDX
4. site:web.archive.org TWRA Coldwater report Watauga Reservoir — none
5. web.archive.org TWRA Watauga Reservoir coldwater fishery report — none
6. "Watauga Lake" OR "Watauga Reservoir" trout stocking TWRA Tennessee rainbow brown lake trout — georgiawildlife/TVA-agreement hit
7. Watauga Reservoir trout stocking TWRA lake trout rainbow (refinement) — TWRA map pointer
8. TWRA trout stocking report Watauga Lake Tennessee (refinement) — duesouth reports only
9. "Watauga Lake" lake trout stocking Tennessee wildlife resources agency rainbow trout fishing (refinement) — triploid/kokanee history leads
10. TVA US Fish Wildlife Service trout stocking Watauga Wilbur reservoirs agreement — georgiatu.org Nov 26 2024 article
11. georgiatu.org "multi-agency agreement" Blue Ridge hatcheries trout Watauga Wilbur — homepage-only; article 404 on direct fetch
12. "georgiatu.org" multi-agency agreement Blue Ridge trout hatchery Watauga Wilbur — same
13. Georgia Trout Unlimited multi-agency agreement Blue Ridge mitigation hatcheries November 2024 — same
14. chattanoogan.com TVA partners fund trout stocking Tennessee Virginia waters 2015 "Wilbur" — unrelated noise
15. TVA partners fund trout stocking Tennessee Virginia Wilbur reservoir 2015 — noise
16. "TVA" trout stocking Wilbur 2015 Tennessee Virginia partnership fund — noise
17. chattanoogan.com TVA trout stocking tailwaters Wilbur — NE Tennessee tourism 2018 only
18. "TVA" "partners" fund trout stocking 2015 Tennessee Virginia agencies Wilbur Dam — noise
19. Russell Bettoli lake trout Watauga South Holston growth stocking evaluation — JSTOR "Population Attributes of Lake Trout in Tennessee Reservoirs" + "sampled stocked Salvelinus namaycush in Watauga Lake" confirmation
20. Bettoli 1999 creel survey salmonids stocked "Watauga River below Wilbur Dam" fisheries report — citation confirmed (tailwater, sibling water)
21. Watauga Lake Tennessee winter trout stocking January February "lake trout" TWRA reservoir — WGRV winter-program context; Region IV "sub-adult brown + lake trout annually" paraphrase
22. TWRA Watauga Reservoir trout stocking winter lake trout rainbow (refinement) — flyfishfinder tailwater note
23. TWRA "Watauga" lake trout stocking winter January February stocking report (refinement) — duesouth winter report only
24. georgiawildlife.com TVA FWS trout stocking "Fort Patrick Henry" "South Holston" Parksville Watauga Wilbur — georgiatu.org re-confirmed with reservoir list + "Once stocked, the..."
25. (dataset work, not web search): 2026 JSON grep, ArcGIS queries, Wayback CDX pulls of Reservoir-Stocking-Schedule 2018/2020, Coldwater-Trout_Stocking-Schedule 2022, Trout_Stocking-Report 2024, completed-feed JSONs, TWRA R4 page, STMP PDF, Wilbur 2015-2020 + 2022-2027 plans, R4 coldwater reports 2019/2021/2023

## Months/season stocking table — Watauga Lake

| Source | Type | Water named | Species | Months/season |
|---|---|---|---|---|
| STMP 2017–2027 p.10 | planned/narrative | Watauga (9-reservoir list) | Rainbow winter 9-in; Lake Trout ~150k 6-in/yr; Brown 25,000 | "stocked during the winter" (Jan–Mar implied; "March vs January" noted) |
| Reservoir Trout Stocking handout 2018 & 2020 | planned program | Watauga | Brown, Lake, Rainbow | "during the winter" |
| Coldwater Trout Stocking Schedule 2/18/2022 | completed | "Watauga" (destination) | (unspecified) | 01/25/2022 event (winter) |
| 2026 planned JSON | planned | (no lake row; only tailwater row Mar–Sep) | — | coverage gap |
| Completed feeds May–Jun 2024, Sep 2024, Sep 2026 | completed | none for lake | — | no lake events in sampled warm-season windows |
| R4 where-to-fish page (2026) | narrative | Watauga Reservoir | rainbow, brown, lake trout | spring/summer fishing guidance; no months |

## Verdict + recommendation — Watauga Lake

- Ledger verdict `year-round-trout` (YR flag) SURVIVES, but the justification must be restated: NOT continuous stocking. Year-round status rests on the agency-documented combination: (1) membership on the STMP nine-reservoir list whose stated criterion is a year-round cold, well-oxygenated water supply; (2) the Reservoir Stocking handout's explicit purpose clause — winter stocking "to provide year-round trout fishing opportunities" with Watauga named (Brown/Lake/Rainbow); (3) TWRA's R4 page documenting the cold, well-oxygenated habitat and a summer deep-water fishery (trolling 30–120 ft in summer) = carryover/holdover; (4) completed destination-level "Watauga" winter stocking (01/25/2022).
- Recommendation: keep YR flag; stock months should stay EMPTY (or, if a season must be recorded, record "winter reservoir stocking" as the stocking season, per STMP/handout, with the 2022 completed event in January). Do NOT attach the Mar–Sep tailwater months to the lake. The 2026 planned JSON has no lake row (gap in the planned table itself) — absence there is not evidence of program termination.
- Gaps: per-event numbers for Watauga lake (GIS NumStocked blank); no month-resolved agency text beyond "winter"; Russell & Bettoli 2011 full text unverified (paywalled); reservoir stocking handout not re-issued on the live site (2018/2020 Wayback only).
