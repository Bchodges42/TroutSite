# Nolichucky River main stem (Tennessee) — trout classification research log

Water: Nolichucky River main stem, NC line through Erwin gorge → Davy Crockett Birthplace SP → Douglas Lake (Unicoi/Washington/Greene/Cocke/Hamblen counties, TN). Sibling kept distinct: Davy Crockett Lake impoundment(s); NC headwaters excluded; tributary trout waters excluded.
Retrieval date for all sources: 2026-09-24. Method: Wayback PDF harvest + full-text grep of the complete TWRA Region IV report series, live TWRA ArcGIS stocking layers, live 2026 TWRA stocking schedule JSON (616 rows), USGS NAS / GBIF / iNaturalist coordinate queries bucketed by distance-to-main-stem against the NHD Nolichucky flowline, plus targeted web/community searches.

---

## A. AGENCY REPORT SERIES (TWRA Region IV, full series text-mined)

Local PDFs + extracted text: `C:\Users\Benjamin\Projects\trout-evidence-repair-20260922\tmp\pdf\` (ww-*.pdf/.txt = warmwater; cw-*.pdf/.txt = coldwater).

### A1. TWRA "2017 Region IV Warmwater Streams and Rivers Fisheries Report" (TWRA Fisheries Report No. 19-03; Petre, Williams, Habera, Carter)
- Publication: 2017 (report year 2017); observation dates: surveys June 21–Aug 22, 2017.
- URL (Wayback, captured 2020-01-26): https://web.archive.org/web/20200126014829if_/https://www.tn.gov/content/dam/tn/twra/documents/region-iv-reports/Warmwater-Streams-Report-2017.pdf
- Inventory: https://digitalcommons.memphis.edu/govpubs-tn-wra-region-iv-stream-reports (item 6); direct PDF via viewcontent.cgi blocked by Cloudflare for curl.
- Nolichucky chapter pp. 37–43. Survey: 9 boat-electrofishing sites between RM 27.9 and RM 99.1 (site table with lat/long, e.g. site 31 RM 99.1 = 36.09449, -82.42855; site 26 RM 82.9 = 36.18831, -82.51960; site 8 RM 27.9 = 36.09707, -83.05132). Summer water temps 22.9–26.6 C.
- KEY PASSAGE (p. 43, Discussion): "The Nolichucky River provides angler with the opportunity to catch all species of black bass, and Rock Bass, Muskellunge, Channel Catfish, Flathead Catfish and other sunfish. **During the winter months, the upper reaches of the Nolichucky are stocked with Rainbow Trout from the U.S. Fish and Wildlife Service hatchery in Erwin.** This provides additional recreational opportunities for winter anglers frequenting the river."
- Species in CPUE Table 11 (target species only: SMB/Spotted/Largemouth/Rock Bass — 92.37 SMB/hr at RM 99.1 site); no trout in any table (summer sampling).
- Also documents: SMB 13–17 in protected slot (PLR) since March 2008; musky program continued (stock 203–254 mm at 27–40/mile).
- Type: agency report (primary). Confidence: high. ESTABLISHES: agency-documented WINTER rainbow trout stocking of the upper main stem from Erwin NFH. Does NOT establish: TWRA-scheduled program rows, exact stocking reach, dates/numbers, current (post-2017) status.

### A2. TWRA "2011 Region IV Warmwater Streams and Rivers Fisheries Report"
- Publication: 2011/2012; observation dates: 2011 surveys (3-year rotation year).
- URL (Wayback, captured 2020-01-26): https://web.archive.org/web/20200126014656if_/https://www.tn.gov/content/dam/tn/twra/documents/region-iv-reports/Warmwater-Streams-Report-2011.pdf
- Nolichucky chapter (p. ~51, Discussion): verbatim same statement: "During the winter months the upper reaches of the Nolichucky are stocked with rainbow trout from the U.S. Fish and Wildlife Service hatchery in Erwin."
- Type: agency report (primary). Confidence: high. ESTABLISHES: the winter RT stocking statement is repeated across two separate survey-cycle reports (2011, 2017) — i.e., a standing practice, not a one-off mention. Contradiction: none between them.

### A3. TWRA Warmwater reports 1986–2010, 2012–2016 (series, Wayback folder listing)
- Folder CDX listing (all captured 2020-01-26): Warmwater-Streams-Report-1986-87.pdf … Warmwater-Streams-Report-2017.pdf.
- Checked full text: 2009, 2010, 2012, 2013, 2014, 2015, 2016 (+1990/1995/2000/2005 spot checks). ZERO trout/stocking references in any Nolichucky chapter outside the 2011/2017 survey-year discussions. 2009 chapter documents the MUSKY program (~3,300 musky stocked 1988–2006; 2009 releases of ~325 NC + ~4,260 Indiana musky above/immediately below Davy Crockett Dam and RM 10.2–50.3) — warmwater context, no trout.
- Non-survey-year reports contain only tributary IBI table rows (Sweetwater Creek, Burnett Creek, Jockey Creek, South Indian Creek, Big Creek, Martin Creek, etc.).
- Type: agency reports (primary). Confidence: high. ESTABLISHES: the winter-trout statement appears ONLY in survey-year (2011, 2017) reports; not a continuously documented scheduled program in this series.

### A4. TWRA Region IV Coldwater/Trout reports 2018, 2019, 2020, 2021, 2023 (and 2017)
- URLs (Wayback):
  - 2018 (168 pp): https://web.archive.org/web/20220804000418id_/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Coldwater-Trout-Report-R4-2018.pdf
  - 2019: https://web.archive.org/web/2024id_/http://www.tn.gov/content/dam/tn/twra/documents/fishing//trout/Coldwater-Trout-Report-R4-2019.pdf
  - 2020 (77 pp): https://web.archive.org/web/20220813222906id_/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Coldwater-Trout-Report-R4-2020.pdf
  - 2021: https://web.archive.org/web/2024id_/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Coldwater-Trout-Report-R4-2021.pdf
  - 2023: https://web.archive.org/web/2024id_/https://www.tn.gov/content/dam/tn/twra/documents/fishing//trout/Coldwater-Trout-Report-R4-2023.pdf
- Full-text result: ALL Nolichucky mentions are headwater-TRIBUTARY native Brook Trout restoration (Tier 1/2): Phillips Hollow (76 BKT translocated from N. Toe River NC system, Sept 2019), Devil Fork, Jennings Creek, Horse Creek, Right Prong Rock Creek, Upper Granny Lewis Creek, plus tributary wild trout chapters (Briar Creek — 4.7 km BKT water, Washington Co; Rocky Fork — wild RT "excellent" middle/lower; South Indian Creek). NO main-stem trout program, NO put-and-take Nolichucky stocking rows anywhere in the coldwater series.
- Erwin NFH mentions (2019–2023): retired brood Rainbow Trout (18 in., 1,929 in 2020; 1,834 in 2021; 1,630 in 2022) documented as stocked in the WILBUR TAILWATER (Doe River) — NOT the Nolichucky — in these reports.
- The claimed prior-pass finding "a Region IV report even proposing a new trout program there [main stem]" was NOT FOUND in any of the 2018–2023 coldwater reports, the 2017 Trout Management Plan, or the warmwater series. Closest true statements are the warmwater 2011/2017 winter-stocking notes. Contradiction/lead resolution: the "proposed new program" appears to be a prior-pass misread of the tributary BKT restoration tables (Jennings Creek/Horse Creek "TBD" proposals are headwater tributaries).
- Type: agency reports (primary). Confidence: high. ESTABLISHES: TWRA coldwater program has never listed the main stem; tributary discipline confirmed (Phillips Hollow, Jennings Cr, etc. stay tributary).

### A5. Tennessee Trout Management Plan 2017–2027 (TWRA)
- URL (Wayback): https://web.archive.org/web/2024id_/https://www.tn.gov/content/dam/tn/twra/documents/fisheries/trout/Trout%20Management%20Plan%20for%20Tennessee%202017-2027.pdf
- 12 Nolichucky mentions: all brook-trout restoration in Nolichucky-basin headwater tributaries (Phillips Hollow, Devil Fork, Jennings Creek, Horse Creek, Granny Lewis, Right Prong Rock Cr). One passage notes NC Nolichucky-basin donor streams and whirling-disease screening for egg/fish transfers. No main-stem trout program proposed.
- Type: agency plan (primary). Confidence: high. ESTABLISHES: no planned 2017–2027 main-stem trout program.

## B. STOCKING DATA (live, retrieved 2026-09-24)

### B1. TWRA 2026 trout stocking schedule JSON (616 rows)
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json
- tn.gov blocks plain curl and WebFetch (ECONNRESET); fetched via r.jina.ai text proxy (raw JSON parsed). Fields: REGION, COUNTY, LOCATION, TYPE, STOCKING DAY, STOCKING WEEK, STOCKING MONTHS, SPECIES.
- RESULT: 0 rows containing "Nolichucky". Types present: Seasonal 436, Winter 95, Weekly 36, Delayed Harvest 34, Tailwater 12, Reservoir 3. County counts: Unicoi 40, Greene 25, Cocke 24, Hamblen 6, Washington 0.
- CRITICAL nearby rows (all tributaries, NOT main stem): Unicoi — **Clark Creek (Seasonal, Rainbow Trout, 6+ rows)**, South Indian Creek sites, Fishery Park Pond; Greene — Paint Creek USFS campground sites, Horse Creek sites, Dillard Ponds; Cocke — Cosby Creek, Gulf Fork/Trail Fork Big Creek, Brush Creek; Hamblen — Panther Creek.
- Type: agency live data (primary). Confidence: high. ESTABLISHES: no TWRA-scheduled 2026 trout stocking of the main stem. Explains iNat tributary observations (Clark Creek is itself stocked).

### B2. TWRA ArcGIS "TWRA_Trout_Stocking_Locations" (FeatureServer, org PWXNAH2YKmZY7lBq)
- Query: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0/query
- Site_Name/StreamName/City/County LIKE '%Nolichucky%' → 0 hits (all four fields). Programs in layer: Reservoir, Spring, Winter, Tailwater. Winter program = 54 sites statewide, none on Nolichucky. Four-county query = 152 points, all tributary/pond sites (Washington Co: single "Reservoir" site, rainbow_brown — not the river).
- Companion layer StockedTrout2016 (796 rows): 0 Nolichucky/Erwin rows.
- Type: agency live GIS (primary). Confidence: high. ESTABLISHES: current scheduled stocking maps do not include the river.

### B3. USFWS Erwin National Fish Hatchery — DATED completed release (photographic, agency-published)
- Wikimedia Commons file: "USFWS employee stocks retired broodstock trout Nolichucky River 14 March 2022.png"
  - URL: https://commons.wikimedia.org/wiki/File:USFWS_employee_stocks_retired_broodstock_trout_Nolichucky_River_14_March_2022.png (source: https://www.fws.gov/media/david-stockingjpg )
  - Description: "A United States Fish and Wildlife Service employee stocks retired broodstock trout from the Erwin National Fish Hatchery in the Nolichucky River." DateTimeOriginal: 14 March 2022. Public domain. Observation date = 2022-03-14. Winter/early-spring timing — consistent with the TWRA 2011/2017 "winter months" statements.
- Companion Commons file: "Fisherman rainbow trout Nolichucky River.png" — "Vietnam War veteran James Duncan holds up a rainbow trout (Oncorhynchus mykiss) he caught in the Nolichucky River, **a site stocked by the Erwin National Fish Hatchery**." (undated; source https://www.fws.gov/media/veteran-rbtjpg ).
- Type: agency-published photographic record (primary). Confidence: high for occurrence of a completed 2022 release; medium for exact location along the river (river-level, no coordinates in metadata).
- ESTABLISHES: a dated, completed main-stem trout release by USFWS as recently as March 2022. Does NOT establish: program continuity after Helene (Sept 2024), numbers, or exact reach (hatchery is at 520 Federal Hatchery Rd, Erwin, on the river).

## C. BROAD FISH SURVEYS (weighted negative evidence)

### C1. Gotwald, H.S. 2016. "Impacts of Land Use Disturbance on Fish and Aquatic Macroinvertebrate Assemblages in the Nolichucky River Watershed." MS thesis, University of Tennessee, Knoxville (advisor J.B. Alford; USGS WRRA project 2014TN103B). 169 pp.
- Page: https://trace.tennessee.edu/entities/publication/25ce3ac9-42ae-4846-9fcc-b83731326337 (handle https://trace.tennessee.edu/handle/20.500.14382/40139 ); PDF bitstream: https://trace.tennessee.edu/bitstreams/6cc9ea48-be05-48f6-a642-6cb81fd19604/download
- 18 sites sampled in summers 2014 and 2015 along the TN main stem AND tributaries; fish IBI + benthics; full assemblage tables (sunfish/black bass/sucker/darter metrics).
- RESULT: **zero occurrences of "trout" anywhere in the 169 pp** (case-insensitive grep).
- Type: academic survey, method-documented, full species tables. Confidence: high (as a survey); interpretation: WEIGHTED NEGATIVE only — summer-window sampling cannot detect a winter-stocked fishery; main-stem summer absence is expected regardless.
- Published derivative: "Associations Between Fish and Benthic Macroinvertebrate Biotic Integrity and Non-Point Source Pollution Estimates in the Nolichucky River Watershed" (2019, ResearchGate).

### C2. TWRA 2017 Nolichucky CPUE survey (see A1) and 1998 Carter et al. survey (31 sites RM 7.6–99.1, referenced in A1/A2)
- Summer boat electrofishing, target-species reporting; no trout recorded in any table. Same seasonal caveat. Bivens 1988 earlier baseline also warmwater-focused.
- ESTABLISHES (weighted): no summer trout presence documented by agency surveys; consistent with put-and-take winter fishery that "warms out by May."

### C3. TDEC data
- WQP Station searches (TDECWR_WQX, bbox -83.35,35.95,-82.25,36.25; also county-parameterized) returned 0 usable biological stations via API on this date (endpoint behaved inconsistently; known from ledger that TDEC "Biological" data here are benthic-only). TDEC FY2018-19 SWMAR references a fish IBI site "Nolichucky River U/S [Conway Bridge]"; species list not retrievable in this pass (PDF not located before cutoff).
- Not established either way from TDEC primary data this pass. GAP.

## D. COORDINATE-BACKED COMMUNITY RECORDS (iNat / NAS / GBIF) — all TRIBUTARY after georeferencing

Method: NHD flowline "Nolichucky River" (hydro.nationalmap.gov MapServer 4, GNIS_NAME='NOLICHUCKY RIVER', 198 features) downloaded; great-circle distance from each record computed. Flowline validated: Davy Crockett Birthplace SP 233 m, 2017 TWRA site 25 within ~100 m, Erwin downtown 2.7 km (river passes N of town).

### D1. iNaturalist (research grade unless noted), Oncorhynchus mykiss
- 281089679 — 2025-05-14 — 36.12688,-82.53491 (acc 7 m), "Cherokee National Forest, Erwin" — user frozenflip — **7 m-accurate point sits on CLARK CREEK (tributary), 4.0 km from main stem** (NHD envelope check: Clark Creek/South Fork Sill Branch/Devil Fork). Clark Creek = TWRA "Seasonal" RT stocked water (see B1).
- 333746917 — 2026-01-05 — 36.12634,-82.53685 — same user/area — **Clark Creek (tributary), 3.9 km**.
- 322326762 — 2025-06-21 — 36.15034,-82.41817, "N Industrial Dr, Erwin" — hodgekids — **North Indian Creek (tributary), 1.6 km**.
- 266804459 — 2025-03-24 — 36.13901,-82.53010 — cynthall — 3.6 km (tributary, "Golden trout?" caption = aquarium-type color, unvetted).
- 347922467 — 2025-02-08 — 36.03813,-82.50534 — max_o_halloran — 8.7 km (Flag Pond-area tributary).
- Remaining 30+ RT obs in the box: Rocky Fork/South Indian Creek (Flag Pond cluster 36.04–36.06, -82.55–-82.59), Paint Creek (Greene), Mars Hill/Laurel/Marshall NC, Newport (French Broad side). Closest TN main-stem approach by ANY trout: S. fontinalis obs 359533603 (2026-05-05, braydenpaulk) 36.17789,-82.52740 = 528 m (gorge-wall tributary mouth; brook trout ecologically implausible on main stem).
- CONCLUSION: **zero coordinate-backed community trout observations on the TN main stem.** URL pattern: https://www.inaturalist.org/observations/<id>

### D2. USGS NAS (nonindigenous aquatic species), county searches, group=Fishes
- https://nas.er.usgs.gov/api/v2/occurrence/search?state=TN&county=<County>&group=Fishes
- Washington: Salmo trutta 36.26,-82.36 (2007, "stocked") 10.6 km from main stem; S. trutta 36.3929,-82.32189 (2015) 24.1 km (Boone-side). Unicoi: S. trutta 1995/2003/1994 "stocked" (HUC12 Lower South Indian Creek / North Indian Creek — tributary stocking era); RT 2025-2026 = iNat mirrors above. Greene: S. trutta "stocked" 1992–2004 at 35.96–35.97,-82.82–82.86 (Paint/Camp Creek headwaters); RT 2019 "Cherokee NF, Greeneville" 35.98749,-82.79755 (Paint Cr, 10.6 km). Cocke: S. trutta "stocked" 1997–2004 (35.82–35.92,-83.0x — Big/Cosby Creek area).
- Status fields: "stocked" (agency/MARIS-era records), tributary-localized. Confidence: high that they are not main stem.

### D3. GBIF (mirrors iNat + museums)
- https://api.gbif.org/v1/occurrence/search?scientificName=...&decimalLatitude=35.95,36.25&decimalLongitude=-83.30,-82.25&country=US
- O. mykiss 43, S. trutta 39, S. fontinalis 10 in box; TN occurrences all match D1/D2 (incl. one 2025 "South Indian Creek with Nolichucky" record — tributary). No museum record on the TN main stem.

## E. COMMUNITY / ANGLING EVIDENCE

### E1. Trophy Water Guide Service — "Nolichucky River Fishing" guide page
- URL: https://trophywaterguideservice.com/nolichucky-river-fishing (retrieved 2026-09-24)
- Smallmouth = "bread and butter" (12–16 in typical); **rainbow and brown trout in the upper sections near the NC border / Erwin gorge "cooler water," best spring and fall; anglers targeting trout in the upper river need the additional trout permit**. No stocking mention.
- Type: commercial guide. Confidence: medium. ESTABLISHES: a real, guide-marketed seasonal trout component in the upper main stem (community corroboration of A1/A2).

### E2. Troutline.co — Nolichucky River fishing report page
- URL: https://troutline.co/tennessee/nolichucky-river (retrieved 2026-09-24)
- "First a smallmouth river, second a whitewater river, and only third — in the cold months, and only up top — a trout river." Trout = "entirely put-and-take stockers": "**TWRA stocks rainbows here through the cool months off the Erwin National Fish Hatchery**, roughly January through April (9–13 in)"; reach Chestoa→Embreeville; "warms out of trout tolerance by roughly May." Notes no TWRA data feed connected (aggregator text — treat numbers with caution).
- Type: aggregator/community. Confidence: low-medium (authorship unclear, possibly AI-assisted), but fully consistent with agency primary sources.

### E3. Facebook (Erwin community group) — rainbow trout stocking gratitude post
- https://www.facebook.com/groups/527183346162446/posts/930847745796002 — "...lucky we are to have rainbow trout stocked [in] ... Hiwassee, Tellico and Nolichucky Rivers, South Indian Creek, Wilbur Reservoir and a few Veteran's and Kid's fishing events..."
- Type: community anecdote. Confidence: low-medium. Corroborates local awareness of RT stocking in the river.

### E4. NC context (excluded from classification, noted for boundary): NCWRC 2003 wildlife update lists "Avery County: Nolichucky River (not trout waters)". NC headwaters stay out per discipline.

## F. CONTEXT / CAVEATS

- Hurricane Helene (Sept 2024): catastrophic flooding of the Nolichucky valley (Erwin); sediment scour and fish-kill concerns documented into 2025 (thedispatch.com 2024-10-24; backcountryhunters.org; Mitchell County NC minutes Aug 2025; 2025 TWRA Wildlife Diversity Annual Report "showing signs of resilience"). Current (2025–2026) status of the winter stocking practice is NOT documented in anything found — post-Helene gap.
- Regulations: SMB PLR 13–17 in (since March 2008) ENKA-era special regulation incl. Davy Crockett Lake = managed warmwater fishery evidence, not trout evidence (per standards). Trout permit requirement for the stocked upper reach (E1/E2) implies the fishery is regulated as stocked-trout water when active.
- Two different "Davy Crockett Lake" waters exist (Erwin/Cherokee NF lake vs the Birthplace SP main-stem impoundment near Limestone); both kept out of main-stem determination; the SP impoundment follows the river's regulation.
- Erwin NFH (est. 1894) produces 16–20M trout eggs/yr (rainbow strains + brook); its documented 2020–2022 retired-broodstock allocations in TWRA coldwater reports went to Wilbur tailwater — the Nolichucky releases are a separate USFWS action (B3).

## SEARCHES RUN (distinct; ✓ = productive, ✗ = unproductive/blocked)
1. ✓ Nolichucky River trout stocking Tennessee (web)
2. ✓ Erwin hatchery Nolichucky River rainbow trout winter stocking (web)
3. ✓ Wikimedia Commons "rainbow trout" "Nolichucky River" image (web → Commons API hit)
4. ✓ "Erwin National Fish Hatchery" Nolichucky River stocking trout (web; partial 429s)
5. ✓ TDEC biorecon Nolichucky River fish species IBI (web)
6. ✗ "Nolichucky" "Conway Bridge" fish IBI TDEC (web; no direct hit)
7. ✗ fishbrain Nolichucky River trout catches (web; 429 rate-limited)
8. ✗ Nolichucky River trout fishing youtube Erwin gorge (web; 429 rate-limited)
9. ✓ fly fishing Nolichucky gorge winter rainbow trout Erwin video (web)
10. ✓ "Nolichucky" delayed harvest OR "trout permit" OR "stocked" reddit (web; no reddit hits — noted)
11. ✓ Davy Crockett Lake Erwin Tennessee trout fishing (web)
12. ✓ Nolichucky River smallmouth Embreeville fishing report (web)
13. ✓ Cherokee National Forest Nolichucky River fishing trout Unicoi (web)
14. ✓ Hurricane Helene Nolichucky River fish kill trout recovery (web)
15. ✓ "Nolichucky" fish survey species list TVA OR academic OR Etnier (web)
16. ✓ Tennessee surface water monitoring assessment report Nolichucky fish IBI site PDF (web)
17. ✓ Gotwald thesis Nolichucky watershed fish IBI (web, timed out then recovered)
18. ✓ "Impacts of Land Use..." Nolichucky thesis (web)
19. ✓ "Nolichucky" muskellunge stocking Tennessee musky program (web)
20. ✓ Erwin National Fish Hatchery visit fishing local waters stocked Nolichucky (web)
Plus API/database queries: Wayback CDX (region-iv-reports folder; twra documents prefix), 13 warmwater + 5 coldwater + 1 plan PDFs full-text mined, ArcGIS (4 field queries + 4-county + winter-program + StockedTrout2016 ×2 batches), 2026 schedule JSON (616 rows parsed), NAS (4 counties), GBIF (3 species), iNat (3 taxa × box query + 16 obs detail fetches), NHD flowline + 3 envelope identifications, WQP (2 attempts, unproductive), r.jina.ai proxy (1).

## RECOMMENDATION: **seasonal-stocked** (winter/early-spring put-and-take rainbow trout in the upper main stem), with a documented-data caveat.

Reasoning:
1. Primary agency text: TWRA's own Region IV warmwater reports state in two independent survey cycles (2011, 2017) that "during the winter months, the upper reaches of the Nolichucky are stocked with Rainbow Trout from the U.S. Fish and Wildlife Service hatchery in Erwin."
2. Dated completed release: USFWS photo documents retired broodstock trout from ENFH stocked in the Nolichucky River on 2022-03-14 (agency-published, public domain), plus an agency caption calling the river "a site stocked by the Erwin National Fish Hatchery."
3. Independent community convergence: guide page (rainbow + brown in the cold upper gorge, trout permit required), aggregator (Jan–Apr ENFH stockers, warms out by May), local Facebook post.
4. Against "trout": zero TWRA schedule rows/ArcGIS sites ever naming the river (616-row 2026 schedule = 0), zero coldwater-report program rows, zero coordinate-backed wild or stocked trout observations on the main stem in iNat/NAS/GBIF (all resolve to stocked tributaries such as Clark Creek), and zero trout in two broad method-documented fish surveys with main-stem sites (Gotwald 2016: 18 sites; TWRA 2017: 9 sites) — both summer-window, so this negative is weighted, not absolute.
5. Against "warmwater-focus" as sole label: it would discard a repeatedly agency-documented seasonal fishery; against "unresolved": the two-source-type convergence (agency text + agency photo + community) clears the bar. Seasonal-stocked with main-stem trout present only in the cold months is the faithful label.
6. Key gap / likely record holder for closing it: post-Helene (Sept 2024) status of the ENFH winter release; TWRA Region IV Fisheries (Bart Carter, regional supervisor, Morristown) and USFWS Erwin NFH (423-743-4712) hold the stocking ledgers; TWRA TADS stocking records and the annual TWRA fishing forecast would confirm continuation. Secondary gap: TDEC FY2018-19 SWMAR main-stem fish IBI species list (Conway Bridge site).
