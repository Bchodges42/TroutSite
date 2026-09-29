# Little Harpeth River — Trout Evidence Research Log
Water: Little Harpeth River, 16.3-mi Harpeth River tributary rising near Clovercroft, Williamson County TN, flowing N-NW through Brentwood (Williamson Co.), then W-NW through the western edge of Edwin Warner Park (Davidson Co., Nashville), joining the main Harpeth near Bellevue. SAME-NAME RISK handled throughout: this is a distinct stream from the main Harpeth ("Big Harpeth"), whose Franklin reaches (Pinkerton Park / Eastern Flank Battle Park) carry all documented Harpeth-system trout stockings.
Research date: 2026-09-24. Internal classification research only; no agency/business/author contact.

## Reach definition
- **Flow path (NHD 1:100k flowlines, GNIS_NAME='Little Harpeth River', 22 segments)**: southernmost vertex 35.9387, -86.7542 (headwaters, Clovercroft area); northernmost/westernmost vertices ~36.054, -86.922/-86.929 (mouth at main Harpeth, Bellevue area). Mid-course passes Edwin Warner Park on the park's western edge (WPNC brochure text; Wikipedia). Course between Brentwood country-club reach and Warner Park via Granny White Pike / Moores Lane / McGavock Rd crossings (TDEC station names below).
- **Confluence**: main Harpeth near Bellevue, Davidson County (Wikipedia; NHD endpoints). River-mile ~1.9 station exists as USCE "Little Harpeth River Mile 1.9" (WQP).
- **Position vs. Eastern Flank stocking reach (35.9094, -86.8558)**: confluence is DOWNSTREAM — ~16.5 km straight-line and roughly 20 river miles down the main stem. Escapee plausibility: winter-stocked rainbows drifting downstream from Eastern Flank could physically reach the mouth, and cold-season upstream movement into the lower fork is possible; the fork is a small, sun-warmed urban/suburban stream (limestone-bedrock reach described by WPNC as "very productive" but warm in summer), so no permanent holdover or reproduction is plausible — at most transient winter individuals.

## Sources

### S1. TWRA Trout Stocking Locations (ArcGIS FeatureServer master layer)
- Org: TWRA, services3.arcgis.com/PWXNAH2YKmZY7lBq.
- Retrieval: 2026-09-24 (layer query + statewide LIKE sweeps).
- URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0
- Findings: `UPPER(StreamName) LIKE '%HARPETH%'` returns exactly ONE feature: **Eastern Flank / Harpeth River / Region 2 / WILLIAMSON / Franklin / Winter / rainbow** (35.9094, -86.8558). Statewide LITTLE%/WEST% sweep returns no Little Harpeth row. Williamson County returns the same single feature.
- Type + confidence: Programmatic absence, high.
- Establishes: No TWRA stocking site on the Little Harpeth; the entire Harpeth-system program is the main-stem Eastern Flank site. The Eastern Flank program never transfers to the forks.

### S2. TWRA 2026 Trout Stocking Schedule JSON (616 rows)
- Org: TWRA. Retrieval: 2026-09-24 (browser-context UA; plain curl blocked).
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json
- Findings: 3 Harpeth rows, all "Harpeth River at Eastern Flank Battle Park", Winter, Rainbow Trout (1/23/2026, 2/20/2026, TBD 12/2026). **Zero Little Harpeth rows; zero Williamson rows other than Eastern Flank.**
- Type + confidence: Programmatic absence, high.

### S3. "Fishes of the Warner Parks" — Warner Park Nature Center brochure (the ledger's requested Metro Parks source)
- Org: Warner Park Nature Center, Metro Parks Nashville (7311 Hwy 100), list "compiled by Nature Center staff and Tennessee Wildlife Resources Agency (TWRA)"; distributed via Warner Parks' ArcGIS Online org (melkins@warnerparks.org), item title "Brochure: Fish, WPNC 2018".
- Publication date: 2018 (item metadata); text undated internally.
- Retrieval: 2026-09-24. Direct file: https://www.arcgis.com/sharing/rest/content/items/a1c9bfcfa1a44b22a08b04ff955fb718/data (item page: https://www.arcgis.com/home/item.html?id=a1c9bfcfa1a44b22a08b04ff955fb718)
- Reach: "The Warner Parks contain two main bodies of permanent water, the Little Harpeth River and Willow Pond. The Little Harpeth is on the western edge of Edwin Warner Park."
- Species found: 32 taxa, all warmwater/coolwater — longnose gar, gizzard shad, central stoneroller, goldfish, common carp, blotched chub, bigeye chub, bluntnose minnow, rosefin shiner, northern hogsucker, golden redhorse, black redhorse, yellow bullhead, slender madtom, northern studfish, blackspotted topminnow, mosquitofish, banded sculpin, rock bass, green/bluegill/longear/redear sunfish, smallmouth/largemouth/spotted bass, white crappie, Cumberland snubnose darter, redline darter, greenside darter, spottail darter, freshwater drum.
- Species omitted: **no trout of any kind.**
- Method/count: staff+TWRA compiled park species list (no per-taxon counts); explicitly notes "TWRA also conducts surveys of the fish populations in the Little Harpeth River."
- Type + confidence: Broad, method-documented (agency-partnered) species list omitting trout for the exact park reach = meaningful NEGATIVE evidence, weighted, moderate-high.
- Establishes: The Edwin Warner reach's documented fish community is warmwater through 2018, compiled with the same TWRA Region 2 program that runs the main-stem stocking — trout absent from their own joint list.

### S4. iNaturalist corridor species list (channel-filtered)
- Org: iNaturalist. Retrieval: 2026-09-24 (API, taxon Actinopterygii 47178, bbox 35.935–36.06 / -86.935–-86.75, 400 georeferenced fish observations; kept those within ~1.2 km of NHD channel vertices).
- Findings: **277 fish observations on the Little Harpeth corridor, 2013-08-27 through 2026-08-02, ~45 named taxa** — incl. Ambloplites rupestris x28, Lepomis megalotis x47, L. macrochirus x21, Micropterus dolomieu x11, M. nigricans x3, M. punctulatus x1, 10+ darter taxa (Etheostoma atripinne/derivativum/flabellare/blennioides/caeruleum/crossopterum/flavum, Nothonotus rufilineatus/microlepidus), banded sculpin x4, Noturus exilis x4, Fundulus cryptocatenatus x6. Observations span winter months (e.g., 2024-12-21, 2025-01-16/17, 2026-02-20).
- Species omitted: **zero Salmonidae in 277 corridor observations over 13 years.** (One Acipenseridae observation 2021-04-18 — likely misID/escapee, not trout; noted for completeness.)
- Type + confidence: Weighted negative, moderate-high (large multi-year sample incl. winter, but observation effort is angler/naturalist-driven, not a designed survey).
- Query: https://api.inaturalist.org/v1/observations?nelat=36.06&nelng=-86.75&swlat=35.935&swlng=-86.935&taxon_id=47178&geo=true

### S5. GBIF / iDigBio / USGS NAS (museum & occurrence lanes)
- GBIF trout (taxonKey 5204019 O. mykiss, 8215487 S. trutta, 2351271 S. fontinalis) in corridor bbox 35.97–36.09 / -86.97–-86.78: **0 each**; all-fish GBIF occurrences in the corridor bbox: **0** (digitization gap — iNat-derived GBIF fish records exist only for the main-stem Franklin point). Retrieval 2026-09-24.
- iDigBio: geopoint/bbox fish queries failed after repeated 400/500 errors; locality "Little Harpeth" exact = 0. Lane exhausted at API level (gap, not evidence).
- USGS NAS county=Williamson: 7 records (water-cress 1997, goldfish 1999, Corbicula x3, warpaint shiner 1992, tilapia 2025) — **no Salmonidae.** https://nas.er.usgs.gov/api/v2/occurrence/search?state=TN&county=Williamson
- Type + confidence: Coverage gap + weak negative, moderate.

### S6. TDEC monitoring (WQP)
- Retrieval 2026-09-24 (county station list US:47:187; per-station Result pulls).
- Stations ON the Little Harpeth: TDECWPC-LHARP008.2WI (Granny White Pike d/s 100'), LHARP008.5WI (McGavock Rd), LHARP013.8WI (Moores Lane u/s) — legacy TDECWPC strings; LHARP008.5 has 96 digitized results (2006–2007 chemistry incl. water temperature, DO, fecal coliform); LHARP008.2/013.8 exist but 0 digitized results. Plus USCE "Little Harpeth River Mile 1.9."
- Method/count: legacy ambient chemistry, not a fish survey; no fish taxa in portal.
- Type + confidence: Weak negative (documents TDEC treating the fork as a warm wadeable stream), moderate.
- URL: https://www.waterqualitydata.us/data/Result/search?siteid=TDECWPC-LHARP008.5WI&mimeType=csv

### S7. The trout claim hunt (rumor sources)
- **TNDeer forum thread "Harpeth River" (posted 2010-12-06)**: search-surfaced snippet: "winter stocked trout, plenty of bream. Little Harpeth (Edwin Warner Park) produced some decent fish from time to time. Fished once or twice in ..." Site: tndeer.com (thread-level URL not retrievable this pass; direct fetches blocked by bot protection). Retrieval of snippet: 2026-09-24.
  - Interpretation: this is the closest thing found to the ledger's "rumored Little Harpeth trout" — an angler calling the Edwin Warner reach a "winter stocked trout" stream. It claims STOCKED fish, not a wild population. It contradicts S1/S2 (Little Harpeth never a TWRA stocking site; the winter program's Franklin releases were/are main-stem Pinkerton/Eastern Flank). Most plausible readings: misattribution of main-stem stockings, or memory of the pre-2005-era program, or unlicensed releases. Single angler, undated catch detail.
  - Type + confidence: LEAD (single-source angler claim), low. Does NOT establish trout occurrence; establishes only that a 2010 angler believed the stream held stocked trout.
- **Search-engine AI summary asserting "the Harpeth and Little Harpeth receive winter rainbow trout stockings as part of the state program" (attributed to TN.gov)**: contradicted by primary TWRA data (S1/S2) — discarded as AI paraphrase error.
- **2007 Fun Times Guide piece "Fishing the Harpeth River in Middle Tennessee"** (brentwood.thefuntimesguide.com, 2007; article URL unresolved — probes 404): characterized by search summaries as describing TWRA's winter stocking "in waters ordinarily too warm for trout" — i.e., the main-stem Franklin program; no fork-specific claim surfaced. Context only.
- **On The Fly South, "Float Fishing on the Harpeth"** (Joe Shaffer, Sept 2020, https://ontheflysouth.com/float-fishing-on-the-harpeth/): winter stocking program on the Harpeth (Narrows/Kingston Springs reach); hatchery rainbows "at predetermined locations"; no fork mentions; no wild-trout claim. Context for program scope.
- **Williamson Scene / Franklin Home Page, "FHP Special Report: Where do the trout come from?"** (Kelly Gilfillan/Charles Pulliam, 2013-03-20, updated 2019-10-15; https://www.williamsonscene.com/franklin/community/fhp-special-report-where-do-the-trout-come-from/article_8099de6f-d547-54bb-9ce6-6b6f237c3d61.html): Franklin main-stem winter program (then Pinkerton Park, ~1,200/release, Flintville Hatchery stock, ~10 yrs old at publication); TWRA streams biologist Jim Pipas on purpose; hatchery manager Stacy Surgenor: "You don't find these trout native to the areas." **Program context: main-stem only; explicit non-native statement; no fork mention.**
- **NashvilleScene / Tennessean archives, Fly South shop lore pages**: no Little Harpeth trout article surfaced in this pass's searches (multiple query variants; several rate-limited). Lane partially exhausted — newspaper-archive deep searches not reachable.

### S8. Dated warmwater documentation (fork-specific)
- WPNC brochure (2018): 32-species warmwater list for the Edwin Warner reach (S3).
- iNat corridor: dated warmwater occurrences 2013–2026 (e.g., smallmouth 2014-08-03 and 2026-06-20; rock bass 2014-08-03 → 2026-04-17) (S4).
- nashvillemoms.com "Where to Take Kids Fishing in Nashville" (retrieval 2026-09-24): fishing spots along the Little Harpeth in Edwin Warner Park — bass/panfish framing. Type: context.

## Searches run (incl. unproductive)
1. WebSearch `"Little Harpeth" trout rainbow wild fly fishing` — surfaced program context only; no wild claim.
2. WebSearch `"Little Harpeth River" fish survey species Edwin Warner Park` — surfaced WPNC brochure + TWRA-survey mention (productive).
3. ArcGIS Online content search `"Little Harpeth"` / `"Warner Park" FISHES` — productive (WPNC brochure + WP Aquatic Resources service; the latter is stream/lake geometry layers, no fish attributes).
4. WebSearch TNDeer thread discovery (3 variants) — productive at snippet level; thread URL not retrievable; tndeer.com direct fetches blocked (Cloudflare/bot wall) — unproductive lane.
5. WebSearch Tennessean/NashvilleScene/Fly South lore — unproductive (no article surfaced; rate limits hit several queries).
6. brentwood.thefuntimesguide.com — homepage fetched; 2007 Harpeth article URL unresolved (4 slug probes 404); Marrowbone Lake trout article is a different water (unproductive for this water).
7. iNat trout radius queries (3 taxa x 2 centers) — 0 on the fork; the only nearby trout = 2 main-stem Eastern Flank obs (iNat 336153667/336153795, "Lewisburg Pike" geocode = stocking point).
8. GBIF trout + all-fish bbox — 0 (digitization gap).
9. iDigBio geopoint queries — API 400/500 ("maxdistance" term error); lane exhausted.
10. USGS NAS Williamson — 7 records, none trout.
11. WQP station list + LHARP result pulls — productive (legacy chemistry stations).
12. NHD flowline geometry (hydro.nationalmap.gov) — productive (reach pins; one 90 s timeout, retried with simplification).
13. Wikipedia Little Harpeth + Harpeth River — productive (reach/confluence).
14. Harpeth Conservancy site — no fork-specific biota data (system-wide "80+ species" page only).
15. WebSearch TWRA Region 2 "Little Harpeth" survey report — not publicly online (Jim Pipas is the Region 2 streams/trout biologist per TWRA contact page); gap noted.

## Contradictions
- TNDeer 2010 "winter stocked trout" at Edwin Warner vs. TWRA schedule/ArcGIS (no Little Harpeth site, ever, in available records) — unresolved in the angler's favor is impossible from records; treated as LEAD, low weight.
- Search-AI summaries claiming Little Harpeth stocking and Fishbrain-style "trout in top species" — contradicted by primary data; discarded.
- iNat "Lewisburg Pike" rainbow obs (2026-01-23/25) — coordinates sit at the Eastern Flank stocking point on the MAIN Harpeth, not on a fork; same-name-risk resolved geographically.

## Recommendation: WARMWATER-FOCUS (treat any trout claim as a transient main-stem escapee; no documented occurrence)
Reasoning: (a) Zero fork rows in both authoritative TWRA datasets — the Harpeth winter program is main-stem Eastern Flank only; (b) the only trout claim found (TNDeer 2010) is a single angler asserting STOCKED fish, directly contradicted by agency records, and the "wild rainbow" rumor remains unsourced after dedicated hunting; (c) the weighted negatives are unusually strong for an urban water: a 32-species WPNC+TWRA park list omitting trout (2018) plus 277 channel-filtered iNat fish observations 2013–2026 (including winter) with zero salmonids; (d) escapee plausibility exists but only as transient winter individuals ~20 river miles below the stocking site, with a warm summer thermal regime blocking holdover or reproduction. Not "seasonal-stocked" — no TWRA site exists on this water; not "trout" — no positive evidence; not fully "unresolved" — two independent weighted negatives plus programmatic absence settle the classification question even though the rumor's origin is now identified (2010 forum misattribution).
