# South Fork Forked Deer River (West Tennessee) — Trout-Occurrence Evidence Research Log

Water: South Fork Forked Deer River — the long southeastern fork of the Forked Deer system, running from the Chester County headwaters (Henderson area) through Pinson and Jackson (Madison County), then NW past Bells/Roberts (Crockett Co) to the lowlands near Gates/Chestnut Bluff (Lauderdale Co), approaching the Forked Deer main stem junction. Ledger state: limited / warmwater-focus (TWRA West Tennessee crappie rule, "includes tributaries"). No trout lead of any kind on this water. SAME-NAME RISK managed throughout: North Fork (HUC 08010204), Middle Fork (08010204), main stem (08010202), and South Fork (08010205) kept distinct; county-level trout hits attributed to impoundments, not the river.
Research date: 2026-09-24 (all retrieval dates = 2026-09-24).
Researcher constraint: research only; no agency/business/author/angler contact; no git writes; no writes except this file.

## GEOGRAPHY / REACH DEFINITION (Q4)

- USGS NWIS site file (waterservices.usgs.gov, retrieved 2026-09-24), main-stem gauges upstream→downstream: 07027300 SOUTH FORK FORKED DEER RIVER NEAR HENDERSON, TN — HUC 08010205, Chester Co (county_cd 023), 160 mi², 35.4490/−88.6045; 07027500 ... AT JACKSON, TN — Madison Co (113), 495 mi², altitude 330.76 ft, 35.5940/−88.8145; 07027800 ... NEAR GATES, TN — Lauderdale Co (097), 932 mi², 35.8176/−89.3559; 07028000 ... AT CHESTNUT BLUFF, TN — Lauderdale Co, 1003 mi², altitude 256.88 ft, 35.8620/−89.3478. Confidence HIGH (primary federal gauge network). Establishes: a single named fork rising in Chester Co and running through Madison to Lauderdale lowlands; the whole fork is HUC 08010205 (distinct from the North+Middle HUC 08010204).
- TDEC Final Version 2012 303(d) List (web.archive.org/web/20140412195733if_/http://www.tn.gov/environment/water/docs/wpc/2012-final-303d-list.pdf, "South Fork Forked Deer River Basin" pp. 147-150, text extracted 2026-09-24). Four main-stem segments bracket the course: "TN08010205 | 001-1000 | SOUTH FORK FORKED DEER RIVER | Lauderdale, Dyer | 15.6 mi" (lowest); "TN08010205 | 003-1000 | Crockett, Lauderdale | 6.8 mi"; "TN08010205 | 010-1000 | Haywood, Crockett | 13.2 mi"; "TN08010205 | 012-1000 | Crockett, Madison | 21.6 mi | Phosphorus (M) ... MS4 area ... Sand/Rock/Gravel Mining" (Jackson reach). Common causes: Loss of biological integrity due to siltation, Physical Substrate Habitat Alterations, E. coli. Confidence HIGH (official inventory). Establishes: official reach spans Madison/Crockett/Haywood/Lauderdale/Dyer counties — note the lower fork skirts the Haywood corner and Dyer County line before joining the system; the fork is channelized lowland river throughout.
- Fishbrain water-page anchor (see C4): 35.662284, −88.967086 — "located in Madison County ... also intersecting with Chester County."
- Wikipedia: NO article for "South Fork Forked Deer River" (fetch 2026-09-24, empty placeholder). NOAA tags the Jackson gauge JKNT1 (water.noaa.gov/gauges/JKNT1, search-surfaced 2026-09-24).

## QUESTION 1 — TROUT STOCKING / OCCURRENCE EVER: NO EVIDENCE; STRONG ABSENCE STACK (no community lead at all)

### Agency program evidence (highest weight)
A1. TWRA live 2026 Trout Stocking Schedule JSON (616 rows) — https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json (retrieved 2026-09-24): ZERO rows matching forked / deer / jackson / henderson-city / chester anywhere. Madison County's only rows: "Lake Graham" (Winter rainbow, 1/8/2026 + TBD 12/2026). Chester, Crockett, Haywood, Lauderdale, Dyer counties: 0 rows.
  - Jackson-Madison "park pond" check requested by the task: Madison County's TWRA trout water is NOT a city park pond — it is Lake Graham, TWRA's 575-acre state fishing lake ~10 mi N of Jackson (TWRA layer WaterClass = "reservoir", City=Jackson, NumStocked 3000 rainbow). Any community trout report "in Jackson" most plausibly belongs to Lake Graham (or McKenzie City Park pond in Carroll Co / Beech Lake in Henderson Co), never to the South Fork. Beech Lake (Henderson Co's trout site) drains to the Beech River / Kentucky Lake basin — a different drainage entirely.
  - Type: official current-year schedule. Confidence HIGH. Establishes: no 2026 planned trout release on any reach of the SF (or anywhere in Jackson).
A2. TWRA ArcGIS TWRA_Trout_Stocking_Locations (services3.arcgis.com/PWXNAH2YKmZY7lBq/.../TWRA_Trout_Stocking_Locations/FeatureServer/0, retrieved 2026-09-24): county IN (MADISON, CHESTER, CROCKETT, HAYWOOD, LAUDERDALE, DYER, GIBSON, HENDERSON, CARROLL) → 4 sites, ALL impoundments (Lake Graham reservoir; McKenzie City Park pond; Beech Lake pond; Milan City Park); ZERO on any stream. Statewide LIKE %FORKED%/%DEER% → 0 features. Confidence HIGH. Establishes: no trout stocking site on the SF (or any Forked Deer water) in the layer of record.
A3. TWRA historical layer StockedTrout2016 (796 rows dumped, retrieved 2026-09-24): ZERO forked/deer hits statewide; Madison row = Lake Graham (reservoir). Confidence HIGH. Establishes: same story in the 2016 historical layer.
A4. TWRA "Trout Management Plan for Tennessee 2017-2027" (full text extracted, retrieved 2026-09-24): ZERO "Forked" occurrences. Confidence HIGH. Establishes: the whole Forked Deer system sits outside every TWRA trout-program category.

### Independent occurrence datasets (weighted negatives)
A5. GBIF (api.gbif.org/v1/occurrence/search, retrieved 2026-09-24): Salmonidae (taxonKey 8615, EXACT match) in the SF corridor bbox (decimalLatitude 35.42,35.92; decimalLongitude −89.40,−88.55) = **0 occurrences**. Coverage proof, same bbox: any-taxon GBIF records = **199,321**; the corridor also holds dated TU museum fish lots on the SF system itself (B2). Confidence MEDIUM-HIGH (non-detection ≠ literal absence).
A6. iNaturalist (api.inaturalist.org, taxon 47520 = Salmonidae verified, retrieved 2026-09-24): SF bbox = **0 observations**. Coverage: 13,428 research-grade observations any taxon in the same bbox; Micropterus salmoides = 23 (real fish-observation coverage exists). Confidence MEDIUM.
A7. USGS NAS API — UNUSABLE (county/HUC filter params not honored; constant count=811 for every county/huc8 shape tried; retrieved 2026-09-24). NOT evidence either way.
A8. WQP — ActivityMediaName/sampleFraction params non-functional this pass (control: huc=08010205 ± "Biological Tissue" = 70,026 rows both). All tissue-media rows on HUC 08010205 found via characteristicName + client-side screen (Section C); none is a trout row. WQP "Biological" records on the SF are benthic macroinvertebrates + the NRSA fish files at B3 — no salmonids anywhere.

### Community lane
- Fishbrain "South Fork Forked Deer River" page (https://fishbrain.com/fishing-waters/E6j50GP0/south-fork-forked-deer-river, fetched directly 2026-09-24, HTTP 200): "14 catches | 14 Logged captures"; FAQ JSON-LD: "Largemouth bass — 4 members reported ...; Channel catfish — 1 ...; Eyetail bowfin — 2 members reported to have caught this fish." **Trout species list EMPTY — zero trout rows of any kind.** No trout lead exists on this water.
- Search-surfaced community context (LEADs only, non-citable, retrieved via search 2026-09-24): YouTube "Fishing The South Forked Deer River Here In Tennessee" (catfish in flooded water, Jackson area); Facebook group post "What fish can be caught at Fork Deere in south Jackson TN?" (answers describe warmwater catches). Nothing trout.

## QUESTION 2 — FISH SURVEYS / SPECIES LISTS

B1. EPA NRSA 2008-2009 fish assemblage, Finger Creek site NARS_WQX-FW08TN028 "Finger Creek" (35.500117, −88.637732, Chester Co) — a SOUTH FORK HEADWATERS tributary; station resolved via WQP Station/search 2026-09-24; WQP Result rows for the site (ActivityStartDate 2009) carry a mixed NRSA taxon table whose FISH component lists ~27 fish species, including: Centrarchus macropterus, Lepomis megalotis, L. miniatus, L. gulosus, L. cyanellus, L. marginatus, L. macrochirus, Micropterus salmoides, Percina sciera, Etheostoma swaini, E. cervus, E. parvipinne, E. chlorosomum, Esox americanus, E. niger, Fundulus olivaceus, Noturus phaeus, Lythrurus fumeus, L. umbratilis, Ameiurus natalis, Cyprinella camura, Erimyzon oblongus, Notemigonus crysoleucas, Semotilus atromaculatus, Aphredoderus sayanus, Lampetra aepyptera. **ZERO Salmonidae.** Type: federal probability survey, method-documented. Confidence HIGH on station/date/absence; MEDIUM on the fish-list completeness (taxa read from WQP result rows; a companion benthic table is mixed into the same station rows). This is exactly the "broad method-documented survey with full species list omitting trout" = meaningful NEGATIVE evidence standard.
B2. GBIF museum lots ON the SF system (TU/SFNRC datasets via q-search, retrieved 2026-09-24): "Swamp of the South Fork Forked Deer River, [ca. 23.4 km WNW center Jackson]" (Ameiurus natalis); "Brown Creek at TN Hwy198, 8 km E of Jackson (Forked Deer River)" (Fundulus olivaceus, Etheostoma lynceus, 2001-04-28); "Clarks Creek at Holly Springs Road, 8 km NE of Henderson (Forked Deer River)" (Centrarchus macropterus, 2002-04-17); "Spencer Creek, 2.5 mi NW of Luray" (C. macropterus, 1973). No salmonids in any record. Confidence MEDIUM-HIGH. Establishes: vouchered warmwater assemblage on SF tributaries, 1973-2002.
B3. Second NRSA site NARS_WQX-FW08RTNECO65E08 "Tributary to Harris Creek" (35.624799, −88.699039, Madison Co, 2009): fish component Etheostoma parvipinne + Semotilus atromaculatus only; small sample, no salmonids. (Harris Creek is a Jackson-area tributary; its SF-vs-Middle Fork attribution was not pinned this pass — recorded as system-tributary.)
B4. TDEC 303(d) 2012 (Geography): all four SF main-stem segments assessed "Loss of biological integrity due to siltation" — macroinvertebrate-based assessments at four reaches; no published fish lists.
B5. USGS NAS unusable (A7); iDigBio not re-run (unusable in prior passes); WQP "Biological" beyond B1-B3 is benthic-only per standing caveat.

## QUESTION 3 — DATED WARMWATER DOCUMENTATION BEYOND THE CRAPPIE RULE

C1. TDEC fish-tissue collections on the SF system (WQP, Mercury + client-side 'Tissue' screen; stations resolved 2026-09-24):
  - TDECWR_WQX-TNW000002417 "Finger Creek" (35.500117/−88.637732, Chester Co — SF headwaters tributary): Lepomis megalotis (longear sunfish) 0.158 mg/kg, 2018-07-19. Dated, species-identified fish collection on the SF headwaters. Confidence HIGH.
  - TDECWR_WQX-TNW000001909 "Duffy Lake" (35.7193/−89.3239, Lauderdale Co — a small natural/oxbow lake in the Forked Deer lowlands, NOT the river channel): Micropterus salmoides 0.28/0.22 mg/kg + Lepomis macrochirus 0.02/0.053 mg/kg, 2009-10-19. Lake, not river reach — warmwater basin context only.
  - SF MAIN-STEM tissue: none found — no 'Tissue' rows from any station the state labels "South Fork Forked Deer River" (unlike the NF, which has two). NOT established: species-level state fish collection on the SF main stem itself this pass. (Four 303(d)-assessed reaches imply benthic collections exist, but they are not fish data.)
C2. TWRA West Tennessee crappie rule (ledger-carried: "Forked Deer, Hatchie, Loosahatchie, Obion, and Wolf Rivers (includes tributaries) — Crappie: 30 per day, no length limit"): managed-warmwater documentation covering the SF. Confidence HIGH.
C3. TWRA-developed access ON the water (ArcGIS Boat_Launch_Sites, Waterway LIKE '%FORKED%', retrieved 2026-09-24): "Highway 54" — Waterway "South Fork Forked Deer River", HAYWOOD Co, Region 1 (the lower fork at the Haywood line, matching the 303(d) 010-1000 segment); "Spring Creek WMA" — Waterway "Forked deer", MADISON Co. Confidence HIGH. Establishes: TWRA signs boat-fishing access on the SF itself.
C4. Fishbrain aggregate (14 catches, largemouth/channel catfish/bowfin; page JSON-LD quoted above): community warmwater signal, LEAD-grade.
C5. Jackson Sun archive lane: WebSearch restricted to jacksonsun.com returned ZERO indexed hits for Forked Deer fishing (2026-09-24). Lane exhausted at the searchable index level; paywalled print archive not accessible. UNPRODUCTIVE.
C6. Adjacent-context warmwater (system-level, Middle Fork attribute — NOT this fork, recorded to prevent contamination): Middle Fork Bottoms State Park (tnstateparks.com) sells fishing on "Middle Fork Lake and the Forked Deer River — catfish and bass"; PiscaMaps "Forked Deer River, TN" lists bass/crappie/bluegill/channel catfish (aggregator).

## SAME-NAME / CONTAMINATION CHECKS
- Lake Graham (Madison trout site) = TWRA reservoir ~10 mi N of Jackson — an impoundment, not the SF; kept out of the river's classification.
- Beech Lake (Henderson trout site) = Beech River basin, different drainage.
- Middle Fork Bottoms SP / Middle Fork Forked Deer / "Forked Deer River" generic app pages = Middle Fork or main stem, excluded.
- NRSA0809-TN033 (chlordane tissue, Ictalurus punctatus 13.69, 2009-07-15) = "Obion River," Dyer Co — different basin, excluded.
- Reelfoot Lake tissue stations (TNW000005080/5083, 2020-21 crappie/catfish/largemouth) = Reelfoot basin, excluded.
- HUC 08010203 appears in NAS probe control only; correct fork HUCs are 08010204 (N+M) and 08010205 (S) per TDEC/USGS.

## BOTTOM LINE
No trout stocking row, stocking site (current or 2016), trout-plan mention, GBIF record, iNaturalist record, or community-app trout row exists for ANY reach of the South Fork Forked Deer River — the Fishbrain page's trout list is empty, so unlike the North Fork there is not even a lead. The only trout stocked anywhere near is Lake Graham (Madison Co TWRA reservoir) — attribute any local community trout hit there, never to the river. Positive warmwater documentation: NRSA 2009 fish assemblage (~27 species, zero salmonids) on SF headwaters tributary Finger Creek; TDEC tissue-collected longear sunfish (2018) on the same tributary; TWRA boat access ON the fork (Highway 54, Haywood Co); four 303(d)-assessed main-stem reaches; and a live 14-catch warmwater community record (largemouth/channel catfish/bowfin).

## RECOMMENDATION
**warmwater-focus** (evidence state: limited — unchanged headline; the NRSA species list and TWRA access now stand behind it if the ledger cites them). Trout call: ABSENT (weighted negative), all reaches, all seasons — stronger than the NF because there is no community lead to carry. Do NOT add seasonal-stocked: Lake Graham is a separate reservoir.

## SEARCHES RUN (2026-09-24; incl. unproductive)
1. WebSearch '"South Fork Forked Deer River" trout' — rate-limited (429×5); the single surviving result was unrelated (JBoss list). No trout evidence found or claimed.
2. WebSearch 'jacksonsun.com "Forked Deer" fishing crappie|catfish|bass' — ZERO jacksonsun.com hits; surfaced Fishbrain SF page, Middle Fork Bottoms SP, PiscaMaps, YouTube SF catfish video, Facebook south-Jackson post, NOAA JKNT1.
3. TWRA 2026 schedule JSON (616 rows) — 0 forked/deer/jackson rows; Madison = Lake Graham only (park-pond question answered: it is a TWRA reservoir).
4. ArcGIS TWRA_Trout_Stocking_Locations: county IN (9 counties) → 4 impoundments; statewide LIKE %FORKED%/%DEER% → 0.
5. ArcGIS StockedTrout2016 (796 rows) → 0 forked/deer; Lake Graham WaterClass=reservoir confirmed.
6. TWRA Trout Management Plan 2017-2027 full text → 0 "Forked".
7. USGS NWIS expanded records — 07027300/07027500/07027800/07028000 identities, HUC 08010205, drainages verified.
8. WQP/NWIS temperature: SF at Jackson max 27.5 °C (1988-08-15); near Gates 29.0 °C (1986-07-30) — matches prior batch4 record; warmwater thermal context.
9. GBIF bbox SF: Salmonidae 0; any-taxon coverage 199,321; q-searches — TU lots on SF tributaries, no salmonids.
10. iNat SF bbox: Salmonidae 0; coverage 13,428 research-grade; M. salmoides 23.
11. USGS NAS probes — filters not honored (constant 811). UNUSABLE.
12. WQP station search HUC 08010205 — part of the 1,009-station/141-DEER-station inventory; SF stations enumerated (Henderson→Pinson→Jackson→Bells/Roberts USGS series).
13. WQP tissue — Finger Creek 2018 longear sunfish; Duffy Lake 2009 largemouth/bluegill; no SF main-stem tissue stations; media-filter non-functionality documented by control test.
14. NRSA site resolution — FW08TN028 = Finger Creek (fish list extracted, zero salmonids); FW08RTNECO65E08 = Harris Creek trib.
15. EPA ATTAINS API — unauthorized (api.data.gov key required; DEMO_KEY refused). UNPRODUCTIVE; 303(d) PDF used instead.
16. TDEC 2012 303(d) List PDF (in-memory text extraction) — four SF segment rows + counties.
17. TWRA Boat_Launch_Sites LIKE %FORKED% → Highway 54 (SF, Haywood) + Spring Creek WMA (Madison).
18. TWRA RiverMiles LIKE %Forked% → 0 rows (unproductive; fork not mile-mapped).
19. Fishbrain SF page direct fetch (HTTP 200) — 14 catches, trout list empty, JSON-LD quoted.
20. Wikipedia "South Fork Forked Deer River" — no article. Unproductive.
