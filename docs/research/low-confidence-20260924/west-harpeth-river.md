# West Harpeth River — Trout Evidence Research Log
Water: West Harpeth River, principal Harpeth fork draining much of southern and western Williamson County TN; joins the main Harpeth a few miles NW of Franklin at the historic "Meeting of the Waters" plantation site. SAME-NAME RISK handled: distinct from the main Harpeth, whose Franklin reaches (Pinkerton Park / Eastern Flank Battle Park) carry all documented Harpeth-system trout stockings; also distinct from the South Harpeth River (Cheatham/Davidson/west Williamson).
Research date: 2026-09-24. Internal classification research only; no agency/business/author contact.

## Reach definition
- **Flow path (NHD 1:100k flowlines, GNIS_NAME='West Harpeth River', 23 segments)**: southernmost/easternmost vertex 35.7956, -86.8414 (headwaters, College Grove / southern Williamson area); flows NW past Bethesda–Arno country; mouth at northernmost vertex ~35.9259, -86.9666, where it meets the main Harpeth NW of Franklin. TDEC station names corroborate: WHARP022.4WI "u/s Critz Lane & Hwy 431" (upper), WHARP020.2WI "0.7 mi u/s Hwy 31 BR", WHARP017.7WI "West Harpeth Rd", WHARP009.7WI "Old Hwy 96 overpass", WHARP000.3WI "Del Rio Pike" (mouth reach).
- **Confluence**: main Harpeth NW of Franklin, Williamson County — near the antebellum "Meeting of the Waters" plantation (Wikipedia, Harpeth River article: "a few miles northwest of Franklin is the mouth of one of the Harpeth's main tributaries, the West Harpeth, which drains much of the southern portion of Williamson County").
- **Position vs. Eastern Flank stocking reach (35.9094, -86.8558)**: the mouth is DOWNSTREAM of the stocking site by roughly 10 km straight-line (a few main-stem river miles). Escapee plausibility: downstream drift of winter-stocked rainbows passes the mouth within days-to-weeks of stocking; ascent into the fork is physically possible in winter. But the West Harpeth is a warm, shallow, nutrient-rich Western Highland Rim-margin stream with no cold-water refuge; any trout would be transient winter individuals, never a population. The fork is UPSTREAM-side of nothing — it receives no hatchery operation, transfer truck route, or TWRA site of its own.

## Sources

### S1. TWRA Trout Stocking Locations (ArcGIS FeatureServer master layer)
- Org: TWRA, services3.arcgis.com/PWXNAH2YKmZY7lBq.
- Retrieval: 2026-09-24 (layer queries + statewide sweeps).
- URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0
- Findings: `UPPER(StreamName) LIKE '%HARPETH%'` → exactly ONE feature (Eastern Flank, main stem). Statewide LITTLE%/WEST% sweep: no "West Harpeth" row anywhere. Williamson County: same single Eastern Flank feature.
- Type + confidence: Programmatic absence, high.
- Establishes: No TWRA trout stocking site on the West Harpeth; the Eastern Flank program never transfers to the forks.

### S2. TWRA 2026 Trout Stocking Schedule JSON (616 rows)
- Org: TWRA. Retrieval: 2026-09-24 (browser-context UA).
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json
- Findings: All 3 Williamson County rows = "Harpeth River at Eastern Flank Battle Park" (Winter, Rainbow Trout). **Zero West Harpeth rows.**
- Type + confidence: Programmatic absence, high.

### S3. TDEC monitoring (WQP) — the fork's agency record
- Org: TDEC (legacy TDECWPC strings + TDECWR_WQX). Retrieval 2026-09-24 (county station list US:47:187, 940 stations; per-station Result pulls).
- Stations ON the West Harpeth: TDECWPC-WHARP000.3WI (Del Rio Pike — 286 results, 2001/2002/2006/2007), WHARP009.7WI (Old Hwy 96 — 245 results, 2001–2007), WHARP017.7WI (West Harpeth Rd — 245 results, 2001–2007), WHARP020.2WI, WHARP022.4WI (upper reach, thin/no digitized data); TDECWR_WQX-TNW000006775 "West Harpeth River" — 14 results, 2001, **RBP2 High-G habitat assessment protocol** (epifaunal substrate, embeddedness, bank stability, riparian zone, sediment deposition, channel alteration, velocity/depth).
- Method/count: ambient chemistry suites (temperature, DO, pH, specific conductance, fecal coliform/E. coli, nutrients, TSS, flow) 2001–2007 at 3+ mainstem stations, plus one method-documented RBP2 habitat assessment (2001). **No fish taxa anywhere in the portal for the fork** (WQP biological lane = benthic/habitat only, per ledger; confirmed).
- Type + confidence: Method-documented agency monitoring under a warm-wadeable-stream program omitting fish = limited negative evidence; moderate weight. Dated (2001–2007).
- URLs: https://www.waterqualitydata.us/data/Result/search?siteid=TDECWR_WQX-TNW000006775&mimeType=csv ; https://www.waterqualitydata.us/data/Result/search?siteid=TDECWPC-WHARP000.3WI&mimeType=csv

### S4. iNaturalist corridor (channel-filtered)
- Org: iNaturalist. Retrieval 2026-09-24 (API, Actinopterygii 47178, bbox 35.79–35.935 / -86.99–-86.83; distance-filtered to ~1.2 km of NHD channel vertices).
- Findings: **only 4 fish observations on the West Harpeth corridor**: Etheostoma luteovinctum (redband darter) 2024-05-02; Luxilus chrysocephalus 2024-12-22; Lythrurus fasciolaris 2021-05-31; Lepomis megalotis 2026-06-06. All warmwater; **zero Salmonidae**. (The wider bbox holds 139 fish obs, but most belong to the main Harpeth/Big East Fork — excluded by channel filter; iNat coverage of this rural fork is sparse, so the negative is WEAK.)
- Type + confidence: Weighted negative, low-moderate (coverage gap dominates).
- Query: https://api.inaturalist.org/v1/observations?nelat=35.935&nelng=-86.83&swlat=35.79&swlng=-86.99&taxon_id=47178&geo=true

### S5. GBIF / USGS NAS (museum & occurrence lanes)
- GBIF trout (taxonKeys 5204019 / 8215487 / 2351271) in corridor bbox 35.80–36.03 / -87.20–-86.82: rainbow = 2 (both iNat 2026 at the MAIN-STEM Eastern Flank point, 35.9098/-86.8576 and 35.9104/-86.859 — not the fork), brown = 0, brook = 0. Retrieval 2026-09-24.
- USGS NAS county=Williamson: 7 records, none Salmonidae. https://nas.er.usgs.gov/api/v2/occurrence/search?state=TN&county=Williamson
- iDigBio: geopoint lane exhausted at API level (400/500 errors); gap, not evidence.
- Type + confidence: Weak negative + coverage gap, moderate.

### S6. Dated warmwater documentation (fork-specific)
- **TNDeer forum thread "West Harpeth brown fish before work" (posted 2012-06-17)**: search-surfaced snippet: "Waded a portion of the West Harpeth river looking for carp. No luck on the carp yet, but I did manage to fool a very finicky smallmouth in a pool of water"; a later reply in the same thread: "Me and a buddy went last weekend I caught 12+ smallmouth several 2 lb + fish." Site: tndeer.com (thread-level URL not retrievable; direct fetches bot-blocked). Retrieval of snippets: 2026-09-24. Type: dated single-angler catch reports — LEAD for a smallmouth (+ carp) warmwater fishery; no trout mentioned.
- **Fishbrain "West Harpeth River fishing reports"** (Williamson County stream page; URL not directly retrievable this pass — slug probes 404): search-surfaced characterization "most popular for smallmouth and largemouth bass" with bluegill also listed; one search-AI snippet variant claimed "top species include smallmouth bass, brown trout, walleye." Type: aggregated angler logs — LEAD for warmwater; the "brown trout" fragment is a single unverified snippet (Fishbrain's algorithmic "species you can catch" lists routinely include nearby/junk entries; no user catch of trout surfaced). Low confidence; logged as a contradiction in S8.
- **theflyfishingforum.com "One day to fish near Nashville" (2017-02-20)**: search-surfaced: "the Harpeth is a great option for smallmouth... west of Nashville to Kingston Springs... good wade spots" — the thread's explicit reaches are main-stem; an earlier search summary paraphrased it as "Harpeth and West Harpeth" but the retrievable text supports main-stem Kingston Springs only. Context only; not counted as fork-specific documentation.
- **Harpeth Conservancy**: system-wide "more than 80 species of fish and 30 species of mussels" (https://harpethconservancy.org/harpeth-river/, retrieved 2026-09-24); smallmouth identified as the most-sought Harpeth species on their fishing page; **no fork-specific biota dataset found** on their science/restoration pages (only E. coli/TN Water Watch programming). Ledger's "fork-specific biota data" suggestion: unproductive this pass.
- **iNat corridor dated biota** (S4): reband darter 2024-05-02 etc. — small but dated warmwater indicators.

### S7. Program context
- Williamson Scene "FHP Special Report: Where do the trout come from?" (2013-03-20): Franklin winter program releases at Pinkerton Park (main stem), Flintville hatchery rainbows, hatchery manager: "You don't find these trout native to the areas." On The Fly South (Sept 2020): winter stocking "at predetermined locations" (Narrows reach). Both confirm the program is main-stem-only; neither mentions the West Harpeth.

## Searches run (incl. unproductive)
1. TWRA ArcGIS `%HARPETH%`, `LITTLE%/%WEST%` sweeps, county query — productive (absence).
2. TWRA 2026 schedule JSON — productive (absence).
3. WQP station list (statecode/countycode form succeeded after two failed encodings — first attempts 406/empty, unproductive) + 5 per-station result pulls — productive.
4. EPA ATTAINS assessment-unit queries for both forks — HTTP 401 (service now auth-gated; lane exhausted).
5. GBIF trout bbox — only main-stem iNat points; unproductive for the fork.
6. iNat corridor filter — productive but sparse (4 obs).
7. iDigBio — API errors; exhausted.
8. USGS NAS Williamson — 7 records, none trout.
9. WebSearch `"West Harpeth" smallmouth fishing report 2019-2021` — only aggregators (TWRA reports, Fishbrain, Fishidy, onWater, Windy); no dated thread surfaced beyond the 2012 TNDeer one.
10. WebSearch TNDeer thread dating — productive (2012-06-17 + catch detail).
11. WebSearch fishbrain West Harpeth species — produced the contradictory "brown trout" snippet; direct page 404 on 3 slug probes; unresolved at source level.
12. WebSearch theflyfishingforum 2017 thread — retrievable text supports main-stem only (unproductive for the fork).
13. Harpeth Conservancy site fetches (home, harpeth-river, science-restoration) — no fork biota data; unproductive.
14. NHD flowline geometry — productive (one 90 s timeout, retry with maxAllowableOffset succeeded).
15. Wikipedia Harpeth River article — productive (mouth position + Meeting of the Waters).
16. WebSearch TDEC 303(d)/biorecon fork queries — no fork-specific fish listing surfaced; segment-level detail lives in 305(b)/303(d) biennial PDFs (not retrieved — tn.gov PDF lane rate-limited; gap noted).

## Contradictions
- Fishbrain snippet "brown trout" among top species vs. zero trout in TWRA program data, NAS, GBIF, iNat corridor, and the Fishbrain page's own primary characterization (smallmouth/largemouth/bluegill). Treated as snippet-level noise/misID — recorded, not established.
- Search-AI summary "the Harpeth and Little Harpeth receive winter rainbow trout stockings" (TN.gov attribution) — disproven by primary TWRA data; discarded.
- 2017 fly-forum thread's "West Harpeth" attribution (in one search summary) vs. retrievable text (Kingston Springs, main stem) — resolved in favor of main-stem; not used as fork documentation.

## Recommendation: WARMWATER-FOCUS
Reasoning: (a) Zero fork rows in both authoritative TWRA datasets; the Eastern Flank program never transfers to the fork; (b) the fork's entire agency record — TDEC ambient chemistry 2001–2007 at 3+ stations plus a 2001 RBP2 habitat assessment — runs under a warm-wadeable-stream program with no trout involvement and no fish-assemblage records; (c) every occurrence lane (NAS, GBIF, iNat corridor, museum) holds zero salmonids for the fork; (d) the only trout fragment found anywhere is one unverified Fishbrain snippet contradicted by that page's own top-species data, while the dated documentation (TNDeer 2012 smallmouth/carp; Fishbrain smallmouth-largemouth-bluegill) is uniformly warmwater — matching the ledger's bass/panfish picture; (e) escapee plausibility is real but strictly transient (winter drift from Eastern Flank passes the mouth ~10 km downstream), thermally capped by a warm shallow stream with no holdover potential. Not "seasonal-stocked" — no TWRA site exists on this water; not "trout"/"unresolved" — no positive evidence at any weight and consistent multi-lane absence; residual gap is that no designed fish-community survey of the fork itself was located (ATTAINS gated, 303(d) PDF lane down, Harpeth Conservancy has no fork dataset online).
