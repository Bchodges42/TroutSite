# Mississippi River — TENNESSEE boundary reach — trout evidence research log

Water: Mississippi River, Tennessee side (Shelby, Tipton, Lauderdale, Dyer, Lake counties).
Reach anchors (from NAS locality fields, river miles upstream of the Ohio confluence): Shelby Co RM 725.5 (Treasure Island oxbow/McKellar Lake), RM 730 (Lake McKellar), RM 743 (vicinity Memphis); Dyer Co RM 838.7 (Caruthersville bridge); Lake Co RM 846.5–870 (Blaker Towhead, Island 14, Tiptonville). Approx. RM 715–885, centerline ~35.15 N, -90.05 W (Memphis).
Research date: 2026-09-24. All retrievals this date unless noted. Internal classification research ONLY.
Ledger state under test: "limited / warmwater-focus" with a community-app TROUT lead (fishbrain-trout-lead).

Questions: (1) credible trout occurrence on the TN reach (Fishbrain lead context)? (2) agency fish-community surveys of the TN main stem with full species lists — any Salmonidae? (3) any stocking program near West TN? (4) warmwater/sport-fish documentation.

---

## SOURCES

### S1. USGS Nonindigenous Aquatic Species (NAS) database, API v2 occurrence export, Tennessee
- Org: USGS (nas.er.usgs.gov). Retrieval: 2026-09-24, https://nas.er.usgs.gov/api/v2/occurrence/search?state=TN
- Fields used: scientificName, family, genus, state, county, locality, decimalLatitude/Longitude, HUC8/10, year, status, recordType, comments, references.
- Volume: 3,158 TN records (API ignores taxa param; filtered locally).
- KEY NEGATIVE: 783 Salmonidae records TN-wide (Oncorhynchus mykiss, Salmo trutta, Salvelinus fontinalis, S. namaycush) — ZERO in Shelby, Tipton, Lauderdale, Dyer, or Lake counties. All TN salmonids are Middle/East TN (Cumberland, Tennessee drainages, tailwaters, Tellico, Dale Hollow, Watauga, etc.). Example statuses: stocked/established 1939–1992 records.
- Boundary-county records (n=156): ALL invasive/nuisance taxa (common carp 50, silver carp 21, black carp 25+, grass carp 18, bighead carp 7, zebra mussel, corbicula, nutria, plants); includes many records with explicit main-stem Mississippi River localities (RM numbers above), 1975–2026. Confirms intensive main-stem fish sampling effort in the reach with no salmonid ever recorded.
- Active monitoring: black carp (Mylopharyngodon piceus) records "Mississippi River, Main channel border," Lake Co, YEAR 2026 (10 records, Literature) — an ongoing main-stem removal/monitoring program was capturing/processing fish in this reach in 2026 with no salmonids.
- Oddball: Osmerus mordax (rainbow smelt, Osmeridae — coldwater Salmoniformes, NOT Salmonidae), locality "Mississippi River," 35.715856, -89.936142 (Lower Mississippi–Memphis HUC8 centroid), yr 1978, status "established"; NAS comment: "May have spread through the Missouri to the Mississippi from stockings in North Dakota in 1971. Or may be from Lake Michigan via the Illinois River. No adults ever collected." Record key 42992. Underlying literature includes Etnier & Starnes 1993 (The Fishes of Tennessee). Verdict: attributed-to-main-stem coldwater curiosity, self-flagged as unconfirmed (no adults ever collected). Not a trout; does not establish trout.
- Underlying literature anchor: Etnier, D.A. & W.C. Starnes. 1993. The Fishes of Tennessee. Univ. Tennessee Press, 681 pp. (cited by NAS for MS River goldfish/grass carp/smelt records) — the authoritative TN fauna reference whose Mississippi River fauna is large-river warmwater.
- Type: dataset (agency, curated literature + specimens). Confidence: high (negative).
- Establishes: weighted, method-backed negative for Salmonidae in the five boundary counties; establishes ongoing 2026 main-stem monitoring; does NOT establish absence (non-detection).

### S2. GBIF occurrence search — Salmonidae over the river corridor
- Retrieval 2026-09-24: https://api.gbif.org/v1/occurrence/search?taxonKey=8615&decimalLatitude=34.5,36.8&decimalLongitude=-90.6,-89.0&limit=300 (taxonKey 8615 = Salmonidae; bbox spans the TN reach + adjacent AR/MO/MS counties).
- Result: count = 1. Oncorhynchus mykiss, GBIF key 2465245034, 34.858776, -89.737493, Marshall Co (Byhalia), MISSISSIPPI, 2019-10-02, iNaturalist research-grade, CC BY-NC, recordedBy ktm198, verbatim "Byhalia Creek Farms Rd E, Byhalia, MS, US."
- That point is ~40 km SSE of Memphis, several km off-river (river is near -90.1 longitude there) — an inland farm-road locality, not the river corridor proper.
- Type: aggregator dataset. Confidence: high as to what exists; the single record is NOT on the water.
- Establishes: no Salmonidae georeferenced to the TN reach or its banks in GBIF.

### S3. iNaturalist observations — Salmonidae in the same corridor bbox
- Retrieval 2026-09-24: https://api.inaturalist.org/v1/observations?taxon_id=47520&nelat=36.8&nelng=-89.0&swlat=34.5&swlng=-90.6&per_page=50 (47520 = Salmonidae). Total 3:
  1. Obs 380800279 — Oncorhynchus mykiss — 2026-07-10 — "Bass Pro Dr, Memphis, TN" — (-90.05210, 35.15542) — quality CASUAL — identifications by loveydovey (Oncorhynchus), salvelinusfan27 & vbnt (O. mykiss). No description.
  2. Obs 345801632 — O. mykiss — 2026-03-28 — "Bass Pro Dr, Memphis, TN" — (-90.05210, 35.15543) — CASUAL — id by kieran_stone.
  3. Obs 36245492 — O. mykiss — 2019-10-02 (created 2019-12-01) — Byhalia, Marshall Co., MS — RESEARCH grade — confirming IDs from uconnbirdfish, wearleybird, thebirdnerd, chickeroni, notopteridae; no photo exposed via API; no description.
- Context for the two Memphis records: Bass Pro Dr = Bass Pro Shops at the Pyramid, downtown Memphis (~200 m from the river). The Pyramid store operates large aquarium exhibits; the same address yields casual iNat records of Morone saxatilis (striped bass) (obs 380197242 2026-07-10, 280661362 2025-05-12, 270478122) — i.e., these are aquarium display fish carrying Memphis geotags.
- Type: community observations. Confidence: high that these are the ONLY corridor trout observations; low/zero as evidence of river-occurring trout (casual grade, exhibit context).
- Establishes: the dominant local mechanism for community-app "trout at Memphis" geotags = aquarium exhibit fish; plus an inland stocked/pond-trout precedent at Byhalia (region has winter put-and-take trout in MS ponds, see S11).

### S4. LMRCC — Fishing the Lower Mississippi River Initiative + Lower Mississippi River Fishing Guide v3 (2022)
- Org: Lower Mississippi River Conservation Committee (lmrcc.org). Retrieval 2026-09-24.
- Page: https://www.lmrcc.org/our-work/projects/fishing-the-lower-mississippi-river-initiative/ — guide covers main channel, side channels, floodplain lakes, chutes, Cairo IL to the Gulf; authored by angler Tommy Shropshire with a regional expert panel; illustrations Joseph R. Tomelleri; Walton Family Foundation support.
- PDF (11 MB): https://www.lmrcc.org/wp-content/uploads/2022/07/LMR-Fishing-Guide-Version3.pdf — downloaded and full-text scanned 2026-09-24.
- Species chapters (Contents): Black and White Crappie, Bluegill, Catfish, Common Carp, Freshwater Drum, Largemouth Bass, White Bass and Striped Bass, Live Bait, Other Species of Fish.
- "Other Species" illustrated list (pp. 72–73): Sauger and Walleye ("common in northern reaches"), Red Drum and Spotted Seatrout ("common in southern, salty reaches"), Alligator Gar, Shovelnose Sturgeon, Pallid Sturgeon, Paddlefish, Bigmouth Buffalo, Smallmouth Buffalo, Grass Carp, Bowfin, pickerel, Silver Carp, Redear Sunfish, Warmouth, American Eel, Yellow Bass, gars. States: "Up to 150 species of fish have been found in the Lower Mississippi River."
- SALMONIDAE: ABSENT — zero trout/salmon mention anywhere in 96+ pp. except: (a) tackle note "Many trout flies work well on Bluegill"; (b) "cypress trout" listed as a colloquial NAME for largemouth bass ("bass, bayou bass, bigmouth, bucketmouth, cypress trout, hog, lineside and mossback"); (c) Spotted Seatrout (Cynoscion nebulosus, a marine drum, not a salmonid) as a southern/brackish species.
- Also documented (striped bass section): "White Bass are native to the Mississippi River. Striped Bass and Hybrid Striped Bass have been stocked in the Mississippi River and in various tributaries"; MS River striped bass typical 4–8 lb, "rare reports exceeding 30 pounds"; white/striped/hybrid distinguished by tongue tooth patches.
- Type: method-documented regional guide vetted by biologists/anglers (not a survey). Confidence: medium-high.
- Establishes: a full-river, expert-vetted warmwater game-fish inventory omitting Salmonidae; and TWO local lay-name "trout" traps (cypress trout = largemouth; spotted seatrout = Gulf drum). Contradicts nothing.

### S5. USACE/WES ERDC Technical Report E-83-2 — Fishes of Selected Aquatic Habitats on the Lower Mississippi River
- Pennington, C.H., John A. Baker, Carolyn L. Bond. January 1983. U.S. Army Engineer Waterways Experiment Station, Vicksburg, MS. 96 pp.
- Retrieval 2026-09-24: https://hdl.handle.net/11681/4492 ; PDF: https://erdc-library.erdc.dren.mil/server/api/core/bitstreams/81b728f8-79fb-4ef8-e053-411ac80adeb3/content (downloaded, pdftotext scanned).
- Method/sites: 60-mile main-stem reach, river miles 506–566 (Greenville, MS — downstream of the TN reach; same unrestricted main-stem system). Gears: gill nets (150 ft x 8 ft, 6 panels 1–3.5 in), hoop nets, electroshocker, seines, minnow traps; habitats: dike fields, abandoned channel, natural banks, main-channel bend; multi-season (April–September 1979 sampling dates cited).
- Count: 14,537 fish, 5,482 lb, 57 species, 19 families (Table 2 and Part IV results). Dominants: gizzard shad (35.3% by number), river shiner, catfishes, river carpsucker.
- SALMONIDAE: ABSENT — full-text grep for trout/salmon/Salvelinus/Oncorhynchus/Salmo/coregon: zero hits.
- Type: peer-reviewable agency survey with full species list. Confidence: high (weighted negative, off-reach but main-stem).
- Establishes: massive multi-gear main-stem sampling effort with full species list omitting trout.
- Companion items in the ERDC library (same program, listed 2026-09-24): "Aquatic habitat studies on the Lower Mississippi River, RM 480–530, Report 5, Fish studies—pilot report" (1980, hdl 11681/3009); "Larval fish of selected aquatic habitats on the Lower Mississippi River" (1983, hdl 11681/4488); "Environmental effects of dikes and revetments on large riverine systems" (1986). No salmonids flagged in any.

### S6. Baker, J.A., K.J. Killgore, R.L. Kasul. 1991. "Aquatic Habitats and Fish Communities in the Lower Mississippi River." Reviews in Aquatic Sciences 3(4):313–356.
- Located via search (ResearchGate listing, https://www.researchgate.net — full text pay/registration-walled; LMRCC cited as a host). Not fully retrieved 2026-09-24.
- Synthesis of the WES/LMREP studies (including S5) across main channel, channel border, backwater, floodplain; ~120+ species catalogued river-wide; community is large-river warmwater (sturgeons, gars, catfishes, minnows, suckers, temperate basses, sunfishes, drum).
- Type: peer-reviewed synthesis. Confidence: high, but species-list verification of this exact document was NOT completed (gap).
- Establishes (secondary): the LMR fish community literature contains no trout; Salmonidae are nowhere part of this fauna.

### S7. TWRA Mississippi River regulation block (2026-27 official regs summary)
- Source: https://www.eregulations.com/tennessee/fishing/exceptions-to-statewide-regulations (Tennessee Fishing & Hunting Guide summary; circulated per guide masthead; retrieved 2026-09-24).
- Quoted block: "Mississippi River (includes adjacent sloughs, bayous, and all river runs and chutes, that are accessible by boat…": Black Bass 10/day, no length limit; Sunfish/Bream 50/day, no length limit; Catfish no creel limit, only one fish over 34 in per day; Crappie 50/day, no length limit; Striped Bass and Hybrid Striped Bass 6/day, no length limit; Sauger 6/day, no length limit; White Bass 30/day, no length limit. No rock-bass-specific line.
- Interpretation: a dedicated, species-by-species warmwater management block for exactly this reach — the fishery is defined and managed as warmwater (bass/crappie/catfish/temperate basses/sauger/sunfish). Regulatory block ≠ presence proof, but 7 managed warmwater groups with a 34-in catfish trophy clause equals long-standing documented warmwater fishery. NO trout regulation of any kind for the Mississippi River.
- Type: regulation (official). Confidence: high. Establishes: the warmwater management documentation (Q4) — strengthened and dated.

### S8. TWRA trout regulations (2026-27)
- Source: https://www.eregulations.com/tennessee/fishing/trout-regulations (retrieved 2026-09-24).
- Statewide: 7 trout/day combined, no minimum length (2 lake trout max). Delayed-harvest and special-regulation waters: Big Soddy Creek, Buffalo Creek (Grainger), Doe River, Hiwassee, Paint Creek, Tellico, Caney Fork, Elk, Clinch, Clear Creek, South Fork Holston, Fort Patrick Henry, Watauga, Horse Creek, Slickrock, Dillard Ponds, Gatlinburg, Tellico-Citico; wild trout streams mostly Monroe/Carter/Johnson/Greene-Unicoi; stocked tailwaters all Regions 2–4 (Duck, Elk, Stones, Caney Fork, Hiwassee, Obey, Ocoee, Clinch, Holston, SF Holston, Watauga).
- WEST TENNESSEE: nothing. SHELBY/TIPTON/LAUDERDLADE/DYER/LAKE: nothing. MISSISSIPPI RIVER: not mentioned anywhere.
- Type: regulation (official). Confidence: high. Establishes: no managed or regulated trout water on or near the TN reach.

### S9. TWRA trout stocking schedule (2026) — rendered page extraction
- Source: https://www.tn.gov/twra/fishing/trout-information-stockings.html (retrieved 2026-09-24 via browser-context fetch; tn.gov blocks plain curl; the 616-row schedule is an embedded widget whose underlying JSON endpoint is not exposed in static HTML — the row-count claim from the ledger could not be independently re-verified, but the rendered table was extracted).
- West Tennessee trout rows (all small put-and-take waters): Shelby Co — McCutcheon Creek, Shelby Farms, Edmond-Orgill Park, Valentine Park; Tipton Co — Hurricane Creek, Covington First Baptist Church Pond (NEW); adjacent Obion Co — Union City Reelfoot Packing Site. Lauderdale, Dyer, Lake counties: no trout rows. MISSISSIPPI RIVER: no trout rows anywhere.
- Tailwater/reservoir stocking (rainbow/brown/brook/cutthroat): all eastern/middle TN tailwaters (Norris/Clinch, Watauga, SF Holston, Dale Hollow/Obey, Caney Fork, Hiwassee, Ocoee, Duck, Stones, Tellico, Calderwood, Chilhowee, Tims Ford/Elk…).
- Type: agency schedule (scheduled ≠ completed ≠ holdover). Confidence: medium-high (rendered-page extraction; embedded JSON unparsed).
- Establishes (Q3): confirmed — no trout stocking anywhere near the TN reach main stem; West TN trout = urban winter ponds only, all >30 km from the river; nearest true tailwater trout fisheries >300 km east.

### S10. TWRA warmwater stocking report (2026 + 2023–25 archive)
- Source: https://www.tn.gov/twra/fishing/warmwater-stockings.html (retrieved 2026-09-24, rendered extraction).
- Entries: Florida Largemouth Bass (Cherokee, Watts Bar, Chickamauga…), Striped Bass (Nickajack, Tellico, Cherokee, Watts Bar, Douglas), White Bass x Striped Bass hybrid (Watts Bar, Ft Loudoun, Chickamauga), Sauger x Walleye hybrid, channel catfish, blue catfish, crappie, bluegill, walleye, lake sturgeon, alligator gar, muskellunge, etc.
- NO stocking into the Mississippi River proper; no Shelby/Tipton/Lauderdale/Dyer/Lake county entries. West TN waters that appear: Hatchie River, Obion River, Reelfoot, Beech Lake, Lake Graham, Herb Parsons, Bill Dance Lake — none the main stem; none trout.
- Type: agency report. Confidence: medium-high (rendered extraction). Establishes: TWRA stocks no trout (and no game fish at all) into the TN Mississippi River reach.

### S11. Mississippi-side regional trout context (escapee mechanism)
- Clarion Ledger, Dec 11, 2023 ("Catch rainbow trout in MS. Here's where when and how," https://www.clarionledger.com) and Mississippi Sportsman/MDWFP Facebook (Dec 2023): MDWFP stocked ~700–735 rainbow trout in Lake Lamar Bruce pond near Saltillo, MS (north MS), winter put-and-take, 3 trout/day limit.
- General put-and-take biology: coverage of winter trout programs (Rome News-Tribune via pressreader; TWRA Trout Management Plan 2017–2027, https://digitalcommons.memphis.edu) — trout "generally cannot survive in water temperatures consistently above 77 °F"; winter-stocked pond trout are not expected to survive summer; TWRA plan documents the winter pond program as put-and-take.
- Relevance: the region DOES contain ephemeral stocked rainbow trout (private ponds, MDWFP/TWRA winter ponds); a single off-river or flood-plain trout record is far likelier a winter-stocking escapee than a river resident. (Note: the Byhalia iNat fish, S3, fits a farm-pond context; Oct 2019 is post-summer, consistent with a holdover or fresh pond fish, unverifiable.)
- Type: news + agency program. Confidence: medium. Establishes: plausible escapee pool exists regionally; no pathway establishes river trout.

### S12. Local sport-fishery scene (warmwater documentation + misID context)
- Game & Fish magazine, Oct 4, 2010, "3 World-Class Trophy Catfish Rivers" (https://www.gameandfishmag.com): MS River trophy blue catfish scene; veteran MS River catfish guide James Patterson drifting wide sections in summer — the Memphis-reach charter scene is catfish-centric.
- TWRA maintains separate Mississippi River border-water records: a Mississippi River striped bass record (Bill Nelson, Sept 29, 2003) appears in state-record lists surfaced in search (forum.bigfishtackle.com listing; official TWRA state-record page https://www.tn.gov/twra/article/tennessee-state-fish-records was unreachable this session — ECONNRESET/404; weight unverified). Overall TN striped bass record 65 lb 6 oz from Cordell Hull (reservoir, not this reach).
- iNat control taxa in the corridor bbox (API, 2026-09-24): Morone present and well observed — yellow bass Morone mississippiensis repeatedly at Reelfoot Lake (Lake Co TN, 2020–2026, research grade), striped bass records at the Bass Pro Pyramid address (casual = exhibits), M. chrysops at Marked Tree AR. iNat Salmonidae total = 3 (S3). The warmwater fauna is citizen-documented in the same window where salmonids are absent.
- Commercial/monitoring context: Arkansas black carp bounty up to $1,000/month incl. bowfishers (Fox13 Memphis, July 2025); invasive-carp incentive paid to commercial fishers raised 10→15 c/lb on Kentucky/Barkley (Yahoo Finance, Jan 12, 2026) — an active regional commercial-removal economy on border waters; no trout ever reported in this harvest (carp-focused).
- Type: mixed news/forums/app data. Confidence: low-medium individually, corroborative in aggregate.

### S13. Fishbrain lead (fishbrain-trout-lead) — original-context search
- Attempts 2026-09-24: WebSearch (site:fishbrain.com trout Mississippi River Tennessee; "fishbrain" Memphis trout/rainbow) — no Fishbrain page surfacing a trout on the TN reach. Direct fetches https://fishbrain.com/fishing-report/Mississippi-River (404), https://fishbrain.com/search?query=… (404), https://fishbrain.com/fishing-waters/tennessee (404) — Fishbrain's water/catch pages are app/login-gated and not publicly retrievable here.
- Result: the ledger's community-app TROUT lead could NOT be traced to any public, dated, located original report (no claimant, no photo, no coordinates recoverable). Per standing rules it remains a LEAD ONLY, uncorroborated, internal research use only, never production/display.
- Prior probability assessment from S3: the two ONLY trout "observations" geotagged in Memphis in community data (2026) are Bass Pro Pyramid aquarium fish; the region's true trout population is winter pond put-and-take (S9, S11). A Fishbrain trout pin on the Memphis reach is most parsimoniously: (a) aquarium/display fish photo, (b) winter-stocked pond fish mislocated to the river, (c) lay misID ("cypress trout"/largemouth, spotted seatrout, or Morone confusion), or (d) coordinate error. A wild river trout would require a survival pathway that contradicts every surveyed species list (S1, S4, S5) and the thermal regime (S11).
- Type: internal lead, uncorroborated. Confidence: n/a. Establishes: nothing beyond the lead itself.

### S14. Thermal/limiting-factor note (gap logged)
- USGS NWIS: no water-temperature series retrievable for Mississippi River at Memphis gage 07032000 via dv/iv (parameterCd=00010 returned empty, 2026-09-24); WQP Shelby temperature pull returned 0 rows with the query used. Summer thermal claim therefore rests on secondary sources (S11: >77 °F trout survival limit vs. regional summer pond/river temperatures; agency put-and-take design itself is the agency acknowledgment). LMRCC guide (S4) treats the river throughout as warmwater fauna and places even spotted seatrout only in "southern, salty reaches."

---

## CONTRADICTIONS / CAVEATS
- NAS "Osmerus mordax — Mississippi River — established (1978)" (S1) is the only coldwater-family main-stem attribution and is self-doubting ("No adults ever collected"); it does not involve Salmonidae.
- Captain Experiences SERP snippet ("Rainbow trout trips on the Mississippi River," captainexperiences.com) refers to the UPPER Mississippi trout tailwater scene (MN/WI/IA); unverified in detail but geographically irrelevant to the TN reach. Logged as a misleading SERP hit.
- The 616-row TWRA schedule JSON was not directly parsed (embedded widget); substance confirmed via rendered table (S9). Similarly the Baker et al. 1991 full species table was not page-verified (S6). Both are logged gaps, neither plausibly reverses the conclusion.
- TWRA state-record page unreachable (ECONNRESET); Mississippi River striped bass record weight unverified (S12).

## SEARCHES RUN (2026-09-24; incl. unproductive / rate-limited)
Web queries (ZCode WebSearch; 429 rate-limiting frequent — queries marked [429] returned no usable results on at least one attempt):
1. Fishbrain trout Mississippi River Tennessee Memphis catch — unproductive [429 bursts]
2. "Mississippi River" trout Tennessee Shelby County fishing — unproductive [429]
3. trout Mississippi River Tennessee Memphis — unproductive [429]
4. Fishbrain trout "Mississippi River" Tennessee — unproductive [429]
5. site:fishbrain.com trout Mississippi River Tennessee — no fishbrain hits (onWater/huntfishsport/captainexperiences surfaced)
6. Baker Killgore Kasul fish communities Lower Mississippi River 1991 species list — productive (S6)
7. TWRA trout stocking schedule 2026 west Tennessee Memphis — productive (S9 direction)
8. "fishbrain" Memphis "Mississippi River" trout OR rainbow — unproductive (no fishbrain trout content)
9. MDWFP winter rainbow trout stocking north Mississippi pond — productive (S11)
10. Killgore ERDC lower Mississippi River fish community electrofishing species main channel report — productive (S5/S6)
11. Memphis Mississippi River fishing report striped bass catfish guide 2025 — unproductive [429]
12. black carp incentive program Mississippi River Tennessee commercial fishermen harvest — productive (S12)
13. Mississippi River Memphis catfish guide striped bass "Bill Dance" OR forum OR youtube — partially productive (S12)
14. "caught a trout" OR "rainbow trout" "Mississippi River" Memphis Tennessee angler — unproductive [429] (no anecdote found anywhere)
15. sauger run Mississippi River Memphis Tennessee fishing January — unproductive [429]
16. Mississippi River water temperature Memphis summer degrees — unproductive [429]
17. Etnier Starnes "Fishes of Tennessee" Mississippi River main channel species — productive (S1 anchor)
18. TWRA winter trout stocking "put and take" ponds do not survive summer Tennessee — productive (S11; TWRA Trout Mgmt Plan 2017–2027 surfaced)
19. striped bass "Mississippi River" Tennessee state record trophy catfish blue catfish Memphis — unproductive [429]
20. Tennessee state record striped bass Mississippi River pounds — partially productive (S12 caveat)
Dataset/retrieval operations: USGS NAS API export + local filtering; GBIF occurrence API (Salmonidae corridor; corrected param syntax after first attempt failed); iNat APIs (taxa 47520, Morone, obs details 36245492/380800279/345801632); ERDC DSpace search + PDF download/text scan; LMRCC site crawl + guide PDF download/scan; TWRA/eregulations page fetches; USGS NWIS dv+iv (empty) and WQP (empty) thermal attempts; Fishbrain direct fetches (404 x3); DuckDuckGo HTML mirror (CAPTCHA-blocked).

## RECOMMENDATION
**warmwater-focus** (maintain ledger classification; do not add a trout lane).

Reasoning: Four independent, method-documented evidence streams — the NAS historical database (0/783 TN salmonid records in the boundary counties despite explicit main-stem localities and active 2026 main-channel-border sampling), a 57-species 14,537-fish multi-gear main-stem survey (ERDC TR-E-83-2), the biologist-vetted full-river fishing guide (~150 species noted, zero salmonids), and GBIF/iNat corridor aggregation (3 trout geotags total: 2 aquarium-exhibit fish at Bass Pro Pyramid Memphis, 1 inland MS farm-pond fish) — all omit Salmonidae from this reach, while TWRA manages the reach through a 7-group warmwater regulation block and stocks nothing into the main stem. The single community-app trout lead is untraceable to any public original and sits in a landscape where every known local trout is an ephemeral winter put-and-take pond fish or an aquarium exhibit. trout / seasonal-stocked are both falsified: no water fits seasonal stocking (zero main-stem stocking; nearest tailwaters >300 km), and no credible occurrence exists to classify. Keep fishbrain-trout-lead as a LEAD with the aquarium/pond-escapee/misID ("cypress trout," spotted seatrout, Morone) explanations attached; one-catch rule applies hard.
