# Research log — Harpeth River, Franklin reach (Williamson County, TN)
Internal classification research. Retrieval date for all sources: 2026-09-24 unless noted.
Scope: Franklin-area main stem only (roughly Fivemile Creek confluence 35.886,-86.837 upstream to Mack Hatcher/35.94,-86.87). The Eastern Flank winter trout program is treated as its own reach record. Separate from Harpeth headwaters and Cheatham Dam tailwater.

---

## A. Broad fish community surveys of the Franklin reach

### A1. Fiss, Frank (TWRA). "Fish community assessment of the Harpeth River before and after a habitat restoration project in Franklin, Tennessee." December 2015. Submitted to Southeast Aquatic Resources Partnership and Harpeth River Watershed Association. [VERIFIED — full PDF read]
- URL (held copy): harpethconservancy.org PDF (local copy C:\Users\Benjamin\Projects\trout-evidence-repair-20260922\tmp\harpeth-2015-ibi.pdf, verified identical title/header text). Live search for the exact harpethconservancy.org URL failed (site search-engine opaque); document text confirms authenticity ("Submitted to the Southeast Aquatic Resources Partnership and Harpeth River Watershed Association, December 2015, By Frank Fiss, Tennessee Wildlife Resources Agency").
- Observation dates: 2008 (Below Dam 22 May; Reservoir 11 Jun), 2010 (Pinkerton 16 Jun; Below Dam 15 Jun; Reservoir 9 Jun; Fivemile 23 Jun), 2015 (Pinkerton 11 Aug; Below Dam 23 Jun; Reservoir 16 Jul; Fivemile 1 Sep).
- Sites (all Franklin main stem; Table 1):
  - Pinkerton Park 35.92099,-86.86500
  - Below Dam (Lewisburg Pike dam) 35.90954,-86.85777
  - Reservoir (impoundment above dam) 35.90930,-86.85569
  - Fivemile Creek confluence 35.88615,-86.83700
  - NOTE: the Reservoir/Below Dam coordinates are essentially AT the Eastern Flank stocking point (35.90939,-86.85580) — the survey sites bracket the stocked reach.
- Methods: seine + backpack electrofishing, IBI following Saylor/TVA (1995); sampled all riffle/run/pool "until no new species were collected"; boat electrofishing for Reservoir site (7 x 10-min transects 2010; 11 in 2008). Gauge referenced: USGS Harpeth River at Franklin 03432350.
- Table 6: 59 species. Total individuals per site-year 324-669; 28-39 species per site-year.
- Smallmouth (Micropterus dolomieu): PRESENT, low abundance, multiple sites/years, incl. young-of-year (row "Micropterus dolomieu smallmouth bass 1 1 yoy 2 5"). Also spotted bass and largemouth bass listed.
- Trout (Salmo/Oncorhynchus/Salvelinus): NONE. No trout row in the 59-species list; grep of full text for trout/salmo/oncorhynchus finds nothing.
- Also documents dam removal + habitat restoration "completed in 2012" (cites Madison and Compton 2013); Table 1 9 a.m. water temps at these sites 17-29 C (max 29 C, Reservoir, Jun 2010; 27-28 C at Pinkerton/Fivemile in June) — reach-specific summer warmth.
- Source type: full community survey, method-documented, exhaustive-until-no-new-species. Confidence: HIGH.
- Supports: (1) smallmouth present and reproducing (yoy) in Franklin reach 2008-2015 at low abundance; (2) no trout population in the Franklin reach through summer 2015. Does NOT establish absence of the winter-stocked fishery: all samples were May-Sep, outside the Dec-Mar stocking window, and 2015 predates (or at best coincides with the very start of) the Eastern Flank winter program. It IS meaningful evidence against year-round trout/holdover through 2015.
- Limits: non-detection in a single (pre-program) period; seasons exclude winter.

## B. Agency datasets — Eastern Flank winter trout program (reach-specific)

### B1. TWRA 2026 trout stocking schedule JSON (live, machine-readable) [VERIFIED]
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json
- 616 rows. Eastern Flank rows (Region 2, Williamson, "Harpeth River at Eastern Flank Battle Park", TYPE=Winter, Rainbow Trout): 1/23/2026; 2/20/2026; TBD 12/2026. Month pattern = Dec, Jan, Feb (some seasons add Mar). No other Franklin/Harpeth/Williamson destination in the schedule (Cowan City Park is Franklin County, a different place).
- Source type: stocking schedule = PLANNED, not completed. Confidence: HIGH for planning.

### B2. TWRA "TWRA_Trout_Stocking_Locations" FeatureServer (live query 2026-09-24; matches 2026-09-22 capture already in hand)
- Service: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer (item "Trout Stocking Locations in Tennessee", id 3ec5c58f99de4de5951f32b76b462623, item created ~Apr 2026).
- Eastern Flank record (OBJECTID 661): Site_Name "Eastern Flank"; StreamName "Harpeth River"; Region 2; WILLIAMSON; City Franklin; 35.909392758,-86.855798006; StockingProgram=Winter; WaterClass=stream; Species=rainbow; NumStocked=4850; Management=City; DailyPermitRequired=No; DelayedHarvestSeason=None.
- Source type: regulatory/program label + planned numbers. Not evidence of holdover or reproduction.

### B3. StockedTrout2016 (ArcGIS public copy of TWRA data, layer "StockedTroutMar2016") [KEY EARLY EVIDENCE]
- Item: c5c5bf5ac8bc44938bc71d66ffff30eb, owner lynnbarrett, "TWRA stocked trout locations for Winter, Spring and Summer", item created 2016-03-18; features uploaded 2017-04-17 (CreationDate field).
- URL queried: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/StockedTrout2016/FeatureServer/0
- Eastern Flank record (OBJECTID 2089): Site_Name "Eastern Flank"; Harpeth River; Region 2; WILLIAMSON; Franklin; Winter; rainbow; NumStocked 4850; lat_long 35.909392758,-86.855798006 — identical coordinates/program/species to the current layer.
- The layer has 42 winter-program sites statewide, 18 in Region 2 (incl. Cowan City Park, McCutcheon Creek, Nice Mill, Shelby Bottoms, Marrowbone Lake, J. Percy Priest TW...).
- Interpretation (with caution): a TWRA trout-stocking-locations snapshot dated March 2016 already includes Eastern Flank as a Winter rainbow site (4,850). The March 2016 date sits at the end of winter 2015-16, so the program was almost certainly running by winter 2015-16. Limits: feature CreationDate is 2017 (upload date); the "Mar2016" layer name + item creation date are the provenance anchors. Confidence: MEDIUM-HIGH for "in place by winter 2015-16".
- Companion layer StockedTroutMay2017 (item c5511586d22e49858dd670df49353dd1, sneary1_myUTK, 61 destinations) has NO Eastern Flank/Harpeth/Williamson rows — consistent with a winter-only program absent from the summer put-and-take list.

### B4. Wayback: TWRA "Winter Trout Stocking" report PDFs (the old annual winter schedule) [VERIFIED]
- winter-trout-stocking-report.pdf captures: https://web.archive.org/web/20181013005431/... ; .../20190111071527/... ; .../20200126081311/... (CDX also shows Apr 2019, Oct 2019 captures).
- 2018-2019 season PDF (linked from Jan 2019 capture of tn.gov/twra/fishing/trout-information-stockings.html): "Winter Trout Stocking (2018-2019)". Eastern Flank rows: 12/5/2018 (Wed); 1/25/2019 (Fri); 2/15/2019 (Thu); plus 3/15/2019 listed in the March section. (pdftotext -layout shifts TOWN/COUNTY columns on some rows — location+date pairs are unambiguous.)
- 2019-2020 season PDF (captured 2020-01-26): Eastern Flank rows: 12/20/2019 (Fri); 1/29/2020 (Fri); 2/27/2020 (Thu).
- Source type: stocking schedule (planned). Confidence: HIGH that the program ran those seasons with Dec-Mar pattern.
- Earlier seasons: no archived winter schedule found before Oct 2018 (earliest capture). Winter 2016-17 and 2017-18 seasons could not be confirmed or excluded from Wayback. UNRESOLVED GAP.

### B5. TWRA "Coldwater Trout Stocking Schedule" PDF, updated 2/18/2022 [VERIFIED]
- URL: https://web.archive.org/web/20220221220911/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Coldwater-Trout_Stocking-Schedule.pdf
- Region 2 winter destinations include "Harpeth River" — date 02/11/2022. (Destination listed generically; the only Region 2 winter Harpeth destination is Eastern Flank.)
- Confidence: MEDIUM-HIGH (generic name inference) — documents program continuity through winter 2021-22.

### B6. TWRA Trout Fishing Forecasts StoryMap [UNPRODUCTIVE for this water]
- Item: dbb92bdf718f4fd7839bf4b08fb82747, "Trout Fishing Forecasts", owner Region5Fisheries, created 2021-04, modified ~2026-05. Full data JSON fetched and searched: ZERO occurrences of "Eastern Flank", "Harpeth", "Franklin", "Williamson". Content = tailwater forecasts (Hiwassee, Boone, Center Hill, Cherokee, Dale Hollow, etc.) + 2 tours (both East TN).
- Establishes nothing about Eastern Flank; TWRA's forecast product does not cover the winter program.

### B7. June 2024 archived stocking JSON (54 summer destinations) [CONSISTENT NEGATIVE]
- https://web.archive.org/web/20240607134309/.../tn_complex_datatable.exceldriven.json — 54 unique destinations May-Jun 2024; no Eastern Flank/Harpeth/Franklin. Confirms Eastern Flank is winter-only, not on the summer put-and-take list.

## C. Occurrence databases

### C1. GBIF [VERIFIED, decisive on this reach]
- Queries: api.gbif.org/v1/occurrence/search with bbox lat 35.85-35.95 / lon -86.90--86.80 (Franklin reach), and a wider Williamson-Harpeth box 35.80-35.98 / -87.10--86.72.
- Oncorhynchus mykiss: exactly 2 records in the wide box, both HUMAN_OBSERVATION, USGS Nonindigenous Aquatic Species dataset (50c9509d-22c7-4a22-a47d-8c48425ef4a7), Jan 2026, at 35.9098,-86.8576 and 35.9104,-86.8590 — the Eastern Flank stocking site, in stocking season.
- Salmo trutta: 0. Salvelinus fontinalis: 0. No museum/traditional-collection trout specimens anywhere in the Williamson Harpeth box.
- Micropterus dolomieu: 4 records (all NAS human observations): Mar 2021 x2 (~35.938,-86.889 and 35.930,-86.895 — upstream Franklin/Mack Hatcher area), Jun 2026 (35.8785,-86.8146 — downstream reach), Jul 2026 (35.9299,-86.8734 — upstream reach).
- Source type: occurrence aggregate. Confidence: HIGH for "no historical trout voucher record".

### C2. iNaturalist [VERIFIED]
- api.inaturalist.org observations, same Franklin bbox, quality=any.
- Rainbow trout: 2 research-grade, 2026-01-23 and 2026-01-25, "Lewisburg Pike, Franklin, TN" (= Eastern Flank reach; 1/23 is the scheduled 2026 stocking day). Angler photographs of fresh-stocked fish.
- Brown trout 0; brook trout 0; Salmonidae 0 (other).
- Smallmouth bass: 4 research-grade: 2026-07-30 "Third Ave N, Franklin" (downtown reach, summer); 2026-06-25 "Harpeth River, Franklin"; 2021-03-07 x2 ("Tennessee, US" and "Rizer Point Dr, Franklin" — upstream reach).
- Supports: trout present at stocked reach in winter only (as stocked); smallmouth present in multiple reaches/seasons incl. downtown Franklin summer 2026.

## D. Community / local knowledge

### D1. Tennessean (Nashville), "Outdoors calendar: Trout stocking resumes Friday," Jan 6, 2016
- URL: https://www.tennessean.com/story/life/shore-rivers/2016/01/06/outdoors-calendar-trout-stocking-resumes-friday/78377706/ (paywalled HTTP 402; not archived in Wayback).
- Search snippet: "TWRA winter trout stocking in Harpeth River in Franklin. 8:30 a.m.-12:30 p.m." (calendar item).
- Establishes: TWRA winter stocking of the Harpeth at Franklin was publicized as ongoing in Jan 2016 (winter 2015-16) — corroborates B3. Not independently readable; treat as MEDIUM confidence corroboration.

### D2. Harpeth Conservancy fishing page [VERIFIED]
- URL: https://harpethconservancy.org/tn-rivers/how-to-enjoy-tn-rivers/fishing
- "over 85 fish species"; smallmouth bass described as the marquee/target species; largemouth, rock bass, bluegill, channel catfish also listed; Wall of Fame catches (2023) all warmwater (smallmouth 3 lb, gar 27", catfish 75 lb). NO mention of trout, stocking, or Eastern Flank anywhere on the page.
- Source type: watershed organization's complete species framing. Supports: trout are not part of the river's resident/characteristic fauna as framed by the river's own advocacy-scientific group.

### D3. YouTube (dates + titles + upload metadata via watch pages) [VERIFIED metadata]
- "Harpeth River Trout" (l7sJwGSaawo), uploaded 2012-03-23: "Catching a rainbow trout in the Harpeth river Tennessee." SINGLE CATCH REPORT, pre-program (Mar 2012), no reach given. LEAD ONLY — pre-dates Eastern Flank program; could plausibly relate to the old dam impoundment (pre-removal) or mislabeling.
- "Harpeth River Kayak Trout Fishing" (4zkfwJsTLTw), uploaded 2015-04-12: "Harpeth River just outside of Nashville, TN" — spring trout, reach likely Davidson Co (Bellevue/Narrows), NOT the Franklin reach.
- "Harpeth river trout fishing Epic trout action" (ljDoLY1YHAc), uploaded 2021-03-12 — March, i.e., tail of the winter stocking window; reach unstated in description. LEAD.
- "Harpeth River Trout Stocking/Massive Lightning Trout!!!" (y2g_hmE1aZw), uploaded 2026-01-29: "Fishing the Harpeth River on the stocking day" — firsthand video of catching fresh-stocked rainbows (incl. a "lightning" color-variant rainbow) in Jan 2026. Matches Eastern Flank program timing.
- "BEAUTIFUL TROUT LOCATION, FRANKLIN TENNESSEE!" (RghW89h3VIc), uploaded 2025-01-28 — Franklin, late Jan (stocking season), guide-promo content. LEAD/corroborating.
- General Harpeth fishing videos (2011-2026) overwhelmingly target bass (e.g., "july 2017 harpeth river wade fishing", "GIANT Bass on the Harpeth River", "Harpeth River Smallmouth Fishing Humbled Me" 2026).

### D4. Reddit r/flyfishing thread (Oct 2016), "Anybody Have Experience on the Harpeth River in TN?"
- URL: https://www.reddit.com/r/flyfishing/comments/5cgb35/ — content not retrievable (blocked; Wayback capture 20230605173224 contains no body). Search snippet only: mentions water "just east of I-65 and just downstream of Eastern Flank Battlefield Park" with smallmouth/largemouth. LOGGED, unverifiable detail.

### D5. tennesseefishingspots.com [VERIFIED]
- https://tennesseefishingspots.com/county/williamson/ — FAQ: bank fishing at "Eastern Flank Battlefield Park, Franklin (the winter trout stretch)"; lists Harpeth access at 35.90923,-86.85624 (= Eastern Flank) and Pinkerton Park (35.92195,-86.86251); smallmouth the featured Williamson species. Earlier search snippet from same domain: "Statewide trout rules apply to the Harpeth's winter stocking at Eastern Flank Battlefield Park: 7 trout per day, no minimum length."

### D6. Visit Franklin tourism blog, "9 Reasons Franklin is an Outdoor Lover's Dream Destination," Mar 6, 2024 [CONTRADICTION NOTE]
- https://visitfranklin.com/blog/9-reasons-franklin-is-an-outdoor-lovers-dream-destination/ (fetch blocked 403; search snippet) — claims guided Harpeth fishing "with Rainbow Trout stocked in winter, plus Brown and Brook Trout". The brown/brook claim is CONTRADICTED by every stocking record (rainbow only), GBIF (0 records) and iNaturalist (0 records). Regulatory/tourism overstatement; discount.

### D7. Fishbrain (public pages; internal research only; one-catch rule applied)
- https://fishbrain.com Franklin TN aggregate (search snippet): 18,153 largemouth, 4,408 bluegill, 2,951 smallmouth logged — trout not in top species. Individual Harpeth water page not retrievable (404/anti-bot). Aggregate used only as warmwater-dominance signal, not as a trout claim.

## E. Physical / historical context

### E1. Dam removal (Franklin lowhead dam, Lewisburg Pike)
- Removed 2012; condition of City of Franklin water-withdrawal permit (issued fall 2007); partners incl. TDEC, SARP, USFWS National Fish Passage Program, HRWA. Sources: Fiss 2015 (project completed 2012, cites Madison & Compton 2013); https://harpethconservancy.org/harpeth-conservancys-lowhead-dam-project-in-the-news ; https://www.hmdb.org/m.asp?m=138511 ; https://fishhabitat.org/waters-to-watch/detail/harpeth-river-tennessee-2012 . (The "2014?" date in the brief is wrong — it was 2012.)
- Establishes: pre-2012, the stocking reach was a warm impoundment behind a lowhead dam; post-2012 free-flowing. Improves reach-matching of Fiss's Before/After design.

### E2. Temperature
- Fiss 2015 Table 1 (reach-specific, 9 a.m.): 17-29 C across May-Sep 2008-2015; 29 C (84.2 F) at the Reservoir site (= stocking reach) Jun 2010; 27-28 C in June at Pinkerton/Fivemile.
- USGS 03432350 "Harpeth River at Franklin, TN" (35.92085,-86.86549; HUC 05130204) — NOTE: the brief's "03597500" is not a valid gauge ID; the Franklin gauge is 03432350. Sensor list includes water temperature but no retrievable temp series for Jul-Aug 2023/2024/2025 (0 values) — gauge temp record effectively unavailable online for recent summers.
- TDEC 2012 303(d) commentary: a "Total Maximum Daily Thermal Load study is needed" for the Harpeth watershed (via search of TDEC 305(b)/303(d) materials). Supports seasonally-limited thermal suitability.
- Limits: no online continuous recent summer temp record found for the exact stocking reach.

### E3. TDEC / Water Quality Portal [UNPRODUCTIVE for fish]
- WQP Station search (bbox -86.92,35.84,-86.78,35.96) returns TDEC stations on the Franklin reach (e.g., TDECWPC-HARPE084.4WI 35.9479,-86.8803; HARPE085.2WI; HARPE087.7DA 35.9236,-86.8612; HARPE092.4WI 35.8922,-86.8299; plus ~20 TDECWR_WQX Harpeth stations). But Biological/Result queries (county 47:187, assemblage Fish; and siteid-based) return ZERO rows — TDEC does not expose fish-community (biorecon/IBI) results through WQP.
- TDEC Harpeth watershed plan PDFs: direct tn.gov archive paths 404/timeout; domain-wide Wayback CDX queries timed out repeatedly; only an unrelated 2021 TMDL meeting-notes PDF surfaced. TDEC biorecon data on the Franklin reach remains UNRECOVERED (agency-side documents).

### E4. Older/academic
- Etnier & Starnes, The Fishes of Tennessee (1993): standard reference; no Harpeth-specific trout mention surfaced (Harpeth is a Cumberland tributary; the book would treat trout streams only in the East TN/Cumberland uplands). No dedicated pre-2008 Harpeth fish survey published online found. UTEIC (Etnier collection, est. 1965) would hold any 1970s-90s Harpeth voucher specimens; GBIF/VertNet show NO trout specimens from the Williamson Harpeth.
- 2009 Tennessee Water Resources Symposium proceedings (Proceedings2009.pdf, 148 pp., read via pypdf): Harpeth papers = TMDL watershed planning (Bolze/Gardner, HRWA) and impervious-area analysis (Cain/Peters) — NO fish species list. A species-inventory paper with smallmouth (p. 2A-13/2A-14) is for the Big South Fork of the Cumberland — MISLEADING SEARCH LEAD, discarded.

---

## Searches run (WebSearch + targeted API/CDX queries)
Productive:
1. WebSearch "Eastern Flank" trout stocking Harpeth River Franklin TWRA
2. WebSearch TWRA "Trout Fishing Forecasts" storymaps "Eastern Flank"
3. ArcGIS search "trout owner:TWRA_GIS" / "StockedTrout" -> StockedTrout2016, StockedTroutMay2017, current service
4. FeatureServer queries: StockedTroutMar2016 (42 winter sites; EF row), StockedTroutMay2017 (61 rows, no EF), current layer (EF row)
5. Live 2026 schedule JSON parse (616 rows; 3 EF rows)
6. Wayback CDX: trout-information-stockings (page, .html, _jcr_content JSON, winter PDFs); 4 winter page captures fetched + parsed
7. winter-trout-stocking-report.pdf 2018-10, 2019-01, 2020-01 captures (text-extracted; EF rows)
8. Coldwater-Trout_Stocking-Schedule.pdf 2022 (Region 2 "Harpeth River" 2/11/2022)
9. GBIF: O. mykiss, S. trutta, S. fontinalis, Salmonidae, M. dolomieu x 2 bbox sizes
10. iNaturalist API x 5 taxa, Franklin bbox
11. WQP Station + Biological/Result queries (negative result = logged finding)
12. USGS site + dv + iv queries (gauge ID resolved 03432350; temp record absent)
13. YouTube search "harpeth river trout franklin" + 5 watch-page metadata fetches
14. WebSearch Tennessean / Williamson Herald / fly shop / Fishbrain / dam removal / Etnier / TDEC temp queries (~12 wording variants)
15. WebFetch: harpethconservancy fishing page; tennesseefishingspots.com (+/county/williamson/); reddit (blocked); Tennessean (paywalled); visitfranklin (403); City of Franklin parks page (403)

Unproductive / dead ends (logged):
- TWRA StoryMap for Eastern Flank content (zero hits — tailwater-only product)
- WQP fish/biological results for TDEC Harpeth stations (no TDEC fish data in WQP)
- USGS 03432350 recent summer temperature series (no retrievable values 2023-2025)
- Reddit thread body (blocked; Wayback copy empty), Tennessean 2016 full text (paywalled, not archived), Visit Franklin full text (403), City of Franklin parks page (403)
- Wayback pre-Oct-2018 winter schedules (none archived); TDEC Harpeth watershed-plan PDF path probing (404/timeouts; domain CDX 504s)
- 2009 Symposium Harpeth fish lead (was actually Big South Fork)
- Etnier specimen databases (no Harpeth trout vouchers; GBIF/VertNet empty)

## Synthesis and recommendation

River-level claim (Franklin main stem):
- Broad, method-documented community surveys (Fiss 2015; 4 sites; 3 years; exhaustive protocol; 59-species list) sampled the stocked reach itself and OMIT trout entirely — meaningful evidence AGAINST any resident/established trout population, and against over-summer survival through 2015. All sampling was May-Sep (outside the winter stocking window), so it does not contradict the winter put-and-take fishery.
- Everything since (GBIF/NAS, iNaturalist, Fishbrain aggregate, Harpeth Conservancy framing, YouTube bass content) shows a warmwater fishery with trout appearing ONLY at the Eastern Flank reach in Dec-Mar.
- One 2012 single-catch rainbow video (pre-program) is a LEAD only.
- Summer temperatures at the stocking reach reached 29 C in Fiss's measurements; TDEC has flagged a thermal-load study need. Holdover is thermally implausible and unevidenced.

Eastern Flank program record (reach-specific):
- Winter rainbow program, reach = Harpeth River at Eastern Flank Battle Park (35.9094,-86.8558), Franklin, Williamson Co (Lewisburg Pike/Carnton-Mack Hatcher area); ~4,850 rainbows per winter per TWRA's location dataset; stocking months Dec-Feb (some seasons Mar): documented rows 12/5/2018, 1/25/2019, 2/15/2019, 3/15/2019, 12/20/2019, 1/29/2020, 2/27/2020, 2/11/2022, 1/23/2026, 2/20/2026, TBD 12/2026; earlier (2015-16, 2016-17, 2017-18) strongly indicated by the March 2016 TWRA dataset + Jan 2016 Tennessean item, but without row-level schedules. Completed-vs-planned: schedules verified; individual completed stockings corroborated by angler catch videos/observations on stocking days (Jan 2025, Jan 2026; iNat 1/23+1/25/2026).

RECOMMENDATION: **seasonal-stocked** for the Franklin reach — the Eastern Flank reach holds a TWRA winter (Dec-Mar) rainbow put-and-take fishery running since at least winter 2015-16 (likely exactly 2015-16), with no evidence of over-summer holdover, reproduction, brown or brook trout anywhere on the reach; the balance of the year and the rest of the Franklin reach is warmwater (smallmouth-led) fishing. "Trout stream" (resident) is contradicted by the surveys; "warmwater-only" is contradicted by a decade of verified winter stockings.

Key remaining gaps and who holds the settling record:
1. Definitive first-stocking year (2015-16 vs earlier) and completed-stocking receipts: TWRA Region 2 Fisheries office (Nashville) program files; also TWRA coldwater program coordinator.
2. Any post-2015 TWRA electrofishing check of the Eastern Flank fishery (survival/holdover data): TWRA Region 2 annual coldwater reports (not posted online for Region 2).
3. TDEC biorecon/IBI fish lists for Franklin-reach stations (pre-2008 context): TDEC Division of Water Resources monitoring files, not in WQP.
