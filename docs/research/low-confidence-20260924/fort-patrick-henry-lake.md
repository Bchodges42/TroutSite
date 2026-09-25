# Fort Patrick Henry Lake (Kingsport, Sullivan County, TN) — Trout Classification Research Log

Water: Fort Patrick Henry Lake (~860–895 ac TVA run-of-river reservoir, South Fork Holston River, Sullivan County; Fort Patrick Henry Dam USGS 03487010, 36.49816 / -82.50904)
Research date (retrieval date for ALL live sources): 2026-09-24
Researcher: ZCode subagent (read-only pass; no agency/business/angler contact)
Lake-vs-tailwater rule applied: Fort Patrick Henry TAILWATER (SFHR below FPH Dam, toward the Holston) is a separate stocked water. Boone TAILWATER (0.6 mi below Boone Dam) discharges into the UPPER arm of FPH Lake and is itself a separate stocked water that is part of the reservoir's inflow.

Geographic anchors used throughout:
- FPH Dam (west/lake outlet): 36.49816, -82.50904
- FPH Lake reservoir stocking site "no site name": 36.50125, -82.48471 (north shore, lower-mid lake, ~2 km above dam)
- FPH Lake reservoir stocking site "Warrior's Path State Park": 36.49123, -82.48097 (south shore, upper arm near park)
- FPH Tailwater sites (separate water): 36.50215/-82.51584, 36.51077/-82.53674, 36.52989/-82.55446
- Boone Tailwater site (inflow at head of FPH Lake): 36.46115, -82.46054 (just below Boone Dam, ~36.4616/-82.4604)

---

## A. AGENCY DATASETS — CURRENT

### A1. TWRA ArcGIS Feature Service "TWRA_Trout_Stocking_Locations"
- Title: TWRA Trout Stocking Locations (locations/infrastructure layer, not a dated calendar)
- Org: Tennessee Wildlife Resources Agency (hosted services3.arcgis.com/PWXNAH2YKmZY7lBq — same org as StockedTrout2016 item, owner "lynnbarrett", accessInformation "Tracy Porter")
- Publication date: current live layer; retrieval 2026-09-24
- URL (query used): https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0/query?where=StreamName LIKE '%Patrick Henry%'&outFields=*&f=json
- Fields per row: OBJECTID, LATITUDE, LONGITUDE, Site_Name, StreamName, Region, County, City, StockingProgram (domain: Spring/Winter/Reservoir/Tailwater), WaterClass, Species (domain: rainbow / Brook / rainbow_brown / brook_brown_rainbow), NumStocked, Management, access fields, lat_long
- Rows found (5 total for "Patrick Henry"):
  1. OBJECTID 720 — "Ft. Patrick Henry Tailwater", StockingProgram=Tailwater, WaterClass=stream, Species=rainbow_brown, Management=TVA, 36.502150/-82.515845 [TAILWATER]
  2. OBJECTID 721 — "Ft. Patrick Henry Tailwater", Tailwater, stream, rainbow_brown, 36.510775/-82.536742 [TAILWATER]
  3. OBJECTID 722 — "Ft. Patrick Henry Tailwater", Tailwater, stream, Species=rainbow, 36.529886/-82.554464 [TAILWATER]
  4. OBJECTID 769 — StreamName "Ft. Patrick Henry Reservoir", NO Site_Name, StockingProgram=Reservoir, WaterClass=reservoir, Species=rainbow_brown, Region 4, Sullivan, Kingsport, 36.501251/-82.484711 [LAKE — lower-mid lake, north shore]
  5. OBJECTID 776 — Site_Name "Warrior's Path State Park", StreamName "Ft. Patrick Henry Reservoir", StockingProgram=Reservoir, WaterClass=reservoir, Species=rainbow_brown, Management=Other, 36.491231/-82.480967 [LAKE — upper arm at the state park]
- NumStocked: null on all rows (layer carries no counts, no dates)
- Source type: agency GIS (official), confidence HIGH for program/site existence; NOT a calendar
- Establishes: two standing reservoir-program stocking sites ON THE LAKE, species coded rainbow+brown, current as of 2026-09-24. Does NOT establish: months, counts, completed releases, holdover.

### A2. TWRA 2026 Trout Stocking Schedule (JSON behind live page)
- Title: "2026 Trout Stocking Schedule" datatable JSON (616 rows verified locally)
- Org: TWRA, tn.gov; retrieval 2026-09-24 via r.jina.ai text proxy (tn.gov blocks plain curl)
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json
- Columns: REGION, COUNTY, LOCATION, TYPE, STOCKING DAY, STOCKING WEEK, STOCKING MONTHS, SPECIES
- Ft. Patrick Henry rows: EXACTLY ONE —
  {"REGION":"4","COUNTY":"Sullivan","LOCATION":"Ft. Patrick Henry TW / S. Fork Holston River","TYPE":"Tailwater","STOCKING MONTHS":"M, A, D","SPECIES":"Rainbow, Brown Trout"} [TAILWATER]
- LAKE rows: NONE. No row for "Ft. Patrick Henry Reservoir", no "Warrior", no other Kingsport/Sullivan row.
- Reservoir-TYPE rows in the whole 2026 table (3 only): Dale Hollow Reservoir (Clay) — months "A" (April), Brown Trout; Calderwood Reservoir (Blount/Monroe) — "N, D" (Nov, Dec), Rainbow; Chilhowee Reservoir — "F, N, D" (Feb, Nov, Dec), Rainbow. (Sibling reservoirs of the same program publish winter-ish months; FPH publishes none.)
- Page prose above the table (same page, retrieved 2026-09-24): "Any stocking event could be postponed or cancelled due to unforeseen problems such as adverse weather or warm water temperatures. Tailwater and Reservoir stocking dates are variable throughout the months indicated."
- Source type: agency schedule (official), confidence HIGH
- Establishes: the 2026 PUBLISHED calendar contains no dated row for the LAKE; the tailwater row proves the tailwater fishery, not the lake.

### A3. TWRA "Trout Fishing & Stockings" live page prose
- Title: Trout Fishing & Stockings — https://www.tn.gov/twra/fishing/trout-information-stockings.html; retrieval 2026-09-24 (via r.jina.ai)
- Section "Reservoir Trout Stocking Information" (verbatim): "TWRA stocks the following reservoirs with trout to provide year-round trout fishing opportunities." List items include: "Region IV, Fort Patrick Henry - Brown and Rainbow" (siblings: Dale Hollow Rainbow; Parksville Rainbow; Calderwood Brook/Brown/Rainbow; Chilhowee Rainbow; South Holston Lake+Rainbow; Tellico (Upper) Rainbow; Watauga Lake+Rainbow).
- Tailwater section (separate list; for discipline, NOT the lake): "Fort Patrick Henry Dam, South Fork Holston River - Brown, Rainbow - March and April - Statewide Regulations". Also: "Boone Dam, South Fork Holston River - Brook, Brown, Cutthroat, Rainbow - March, April, December - Special Trout Regulations" (that is the Boone tailwater = FPH Lake's inflow).
- "Trout Stocking Locations Report" (bi-weekly completed-release feed, same page): recent entries include "Ft. Patrick Henry TW" (dated 09/10/2026 group) [TAILWATER]. No lake entry.
- Source type: agency prose (official), confidence HIGH
- Establishes: (a) agency NAMES Fort Patrick Henry reservoir in the current trout stocking program, species Brown + Rainbow; (b) agency FRAMES the reservoir program as providing "year-round trout fishing opportunities" — a program-level year-round label, with NO months published for FPH; (c) completed-release evidence exists for the TAILWATER only.
- Caution: "year-round fishing opportunities" is an angling-opportunity statement; do not conflate with continuous stocking.

---

## B. AGENCY DATASETS — ARCHIVED (Wayback Machine, all retrieved 2026-09-24)

### B1. StockedTrout2016 ArcGIS item (historical "StockedTroutMar2016" copy)
- Item: "StockedTrout2016", owner lynnbarrett, created 2016-03-18 (epoch 1458322215000), description "TWRA stocked trout locations for Winter, Spring and Summer"; single layer "StockedTroutMar2016"; features created in service 2017-04-17 (epoch 1492459087216); CollectorName "Bart Carter" (TWRA Region 4 biologist) on rows
- URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/StockedTrout2016/FeatureServer/0/query?where=1=1&f=json (796 rows)
- FPH-relevant rows:
  - OBJECTID 4327 — "Ft. Patrick Henry Reservoir", StockingProgram=Reservoir, WaterClass=reservoir, Species=rainbow_brown, NumStocked=null, 36.501251/-82.484711 [LAKE]
  - OBJECTID 4368 — Site_Name "Warrior's Path State Park", StreamName "Ft. Patrick Henry Reservoir", Reservoir program, rainbow_brown, 36.491231/-82.480967 [LAKE]
  - (plus 3 tailwater sites and the Boone Tailwater site, all tailwater program)
- Source type: agency-collected GIS snapshot (via AGOL item), confidence MEDIUM-HIGH (site-program rows; no dates/counts per row; item name implies March 2016 stocking season snapshot)
- Establishes: the lake carried the SAME two Reservoir-program rainbow+brown sites in the 2016-era snapshot as today — program continuity ~2016 to 2026. No months/counts.

### B2. StockedTroutMay2017 ArcGIS item
- Item "StockedTroutMay2017" (services1.arcgis.com/HLC8bAygObK4fhPW; AGOL item created 2024-03-19, feature EditDates 2017-03-07), 61 rows
- URL: https://services1.arcgis.com/HLC8bAygObK4fhPW/arcgis/rest/services/StockedTroutMay2017/FeatureServer/0/query?where=1=1&f=json
- FPH rows: ONLY the 3 Ft. Patrick Henry TAILWATER sites + Boone Tailwater site (NumStocked=0 placeholders). NO reservoir/lake row.
- Establishes: absence of lake sites in a spring (May 2017) completed-stocking snapshot — consistent with a cold-season reservoir stocking design. Negative evidence only; confidence MEDIUM.

### B3. "Coldwater Stocking" completed-release list (PDF, capture 2020-04-24 of page dated 04-22-2020)
- File: tn.gov/content/dam/tn/twra/documents/fishing/trout/Cold-Water-Stocking.pdf
- Wayback: https://web.archive.org/web/20200424033438id_/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Cold-Water-Stocking.pdf
- Fields: Region / WATER BODY / DATE (most recent completed stocking per water)
- Ft. Patrick Henry row: "Ft. Patrick Henry TW  4/14/2020" [TAILWATER — completed release]. NO lake row anywhere in the list.
- Source type: agency completed-release feed, confidence HIGH
- Establishes: destination-level completed evidence for the TAILWATER (Apr 2020). Lake absent from the completed-release feed in this window.

### B4. "Coldwater Trout Stocking Schedule" (capture 2022-02-21, doc updated 2/18/2022)
- File: tn.gov/content/dam/tn/twra/documents/fishing/trout/Coldwater-Trout_Stocking-Schedule.pdf
- Wayback: https://web.archive.org/web/20220221220911id_/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Coldwater-Trout_Stocking-Schedule.pdf
- Region/Destination/Stocking Date rows; Region 4 winter 2022 rows: Cherokee TW, Fishery Park Pond, Fountain City Lake, Nolichucky R., Pistol Creek, South Holston, Watauga, W. Prong Little Pigeon (Gatlinburg), Wilbur
- NO "Patrick Henry" row of any kind (lake OR tailwater)
- Establishes: neither lake nor tailwater appeared in the mid-winter 2022 completed-release list (tailwater program is M/A/D per 2026 — consistent).

### B5. TWRA "Trout Stocking" annual planned schedules 2018 and 2019 (captures 2018-07-17, 2019-01-09)
- Files: 2018-Trout-Stocking-Schedule.pdf, 2019-Trout-Stocking-Schedule.pdf (content/dam/tn/twra/documents/)
- Wayback: https://web.archive.org/web/20180717180317id_/https://www.tn.gov/content/dam/tn/twra/documents/2018-Trout-Stocking-Schedule.pdf and https://web.archive.org/web/20190109035923id_/https://www.tn.gov/content/dam/tn/twra/documents/2019-Trout-Stocking-Schedule.pdf
- Format: month-by-week grid, FEBRUARY–OCTOBER, streams/ponds/winter program; NO reservoir rows at all, NO tailwater rows, NO Patrick Henry
- Establishes: the published annual schedule in 2018–2019 did not cover reservoir program waters (handled separately); lake absent from planned calendar. Negative; confidence HIGH for absence.

### B6. Winter Trout Stocking reports 2018–2019 and 2019–2020 (captures 2019-01-11, 2020-01-26)
- File: tn.gov/content/dam/tn/twra/documents/Winter-Trout-Stocking-Report.pdf
- Wayback: https://web.archive.org/web/20190111071527id_/... and https://web.archive.org/web/20200126081311id_/...
- Fields: DATE/DAY/LOCATION/TOWN/COUNTY/RESCHEDULED by month Nov–Mar, Regions 1–4
- NO "Patrick Henry", NO "Warrior", NO "Kingsport" entries in either winter program
- Establishes: FPH LAKE is not part of the Winter trout program (which is separate from the Reservoir program). Confidence HIGH.

### B7. TWRA Region IV Coldwater Trout Reports (major source)
- B7a. Coldwater Trout Report R4 2018 (reporting year 2018; PDF capture 2022-08-04):
  https://web.archive.org/web/20220804000418id_/http://www.tn.gov/content/dam/tn/twra/documents/fishing//trout/Coldwater-Trout-Report-R4-2018.pdf
  - Cover photo caption: "A large (28.9 in., 10 lb.) Brown Trout from the Ft. Patrick Henry tailwater near Kingsport" [tailwater]
  - KEY PASSAGE (Introduction, reservoir program description): "Reservoirs that stratify during summer months but have habitat suitable for trout below depths normally occupied by warmwater species are termed 'two-story' fisheries... Seven two-story reservoirs in Region IV (Calderwood, Chilhowee, Tellico, Ft. Patrick Henry, South Holston, Wilbur, and Watauga) have such zones and create an additional trout resource. These reservoirs are stocked with adult Rainbow Trout during the late fall and winter when reservoir temperatures are uniformly cold and piscivorous warmwater predators are less active. Watauga and South Holston reservoirs are also annually stocked with sub-adult Brown Trout and Lake Trout..."
  - Also: "Cold, hypolimnetic releases from five TVA dams in Region IV (Norris, Ft. Patrick Henry, South Holston, Wilbur, and Boone) also support year-round trout fisheries in the tailwaters downstream." [tailwater framing]
  - Establishes: SEASON (late fall and winter) and SPECIES (adult Rainbow Trout) of the reservoir program stocking for FPH LAKE, program-level, c. 2018. Does NOT give per-year rows or counts for FPH.
- B7b. Coldwater Trout Report R4 2019 (capture 2022-08-04): https://web.archive.org/web/20220804073046id_/http://www.tn.gov/content/dam/tn/twra/documents/fishing//trout/Coldwater-Trout-Report-R4-2019.pdf — Patrick Henry mentions are all TAILWATER (electrofishing CPUE, plan objectives). Same two-story reservoir program text carried in introduction.
- B7c. Coldwater Trout Report R4 2023 (reporting year 2022; capture 2023-08-20): https://web.archive.org/web/20230820041714id_/https://www.tn.gov/content/dam/tn/twra/documents/fishing//trout/Coldwater-Trout-Report-R4-2023.pdf — "Ft. Patrick Henry (South Fork Holston River)" section = TAILWATER monitoring (4 stations, 19 trout in 2022; "stocked with 9,500 adult Rainbow Trout, 8,000 fingerling..." — tailwater numbers). Intro: "Just over half (52%) of all trout stocked in 2022 went to Region IV waters, with 41% of those fish used to support tailwater fisheries, 40% for reservoir fisheries, and 19% for smaller streams, ponds, winter trout program fisheries" (Roddy 2023) — confirms a substantial Region 4 RESERVOIR trout program exists, but the report names no FPH-lake stocking counts.
  (Note: R4-2017/2020/2021 captures exist at 20220813205505 / 20220813222906 / 20220813221805 but Wayback returned them truncated at exactly 1 MiB on every retry; text could not be extracted. Not expected to contain lake rows — sibling years do not.)
- Source type: agency technical reports, confidence HIGH

### B8. Boone and Fort Patrick Henry Tailwater Trout Fisheries Management Plan 2019–2024 (TWRA, Dec 2018; Jim W. Habera, Sally J. Petre, Bart D. Carter)
- File: tn.gov/content/dam/tn/twra/documents/fishing/trout/Boone-Fort-Patrick-Tailwater-plan_2019-2024.pdf
- Wayback: https://web.archive.org/web/20200724030046id_/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Boone-Fort-Patrick-Tailwater-plan_2019-2024.pdf
- Key passages (verbatim):
  - "A short (~0.6 mi.) tailwater exists downstream of Boone Dam at the upper end of Ft. Patrick Henry Reservoir." — COLD INPUT LOCATION: Boone TW enters the UPPER ARM of the lake.
  - "The Boone tailwater and Ft. Patrick Henry Reservoir provide coldwater habitat that TWRA stocked sporadically with fingerling Rainbow Trout and Brown Trout prior to 1978. After 1978, Ft. Patrick Henry Reservoir and the Boone tailwater were managed as a put-and-take fishery by stocking adult Rainbow Trout." — HISTORICAL LAKE STOCKING documented by agency (pre-1978 fingerling RB+BN; 1978 onward adult RB put-and-take, reservoir + tailwater).
  - Section 2.2: dam completed 1953; "impounds a small (895 acre) reservoir (Ft. Patrick Henry Reservoir) on the SFHR near Kingsport... operated by TVA as a 'run-of-the-river' reservoir (i.e., there is no long-term water storage)."
  - Boone tailwater electrofishing 2008: good rainbow population, 18-in fish, "Evidence of some natural reproduction by Rainbow Trout (2-3 in. fish)... at base flow in 2008" [Boone TW segment]; "A few Brown Trout were also present--most likely migrants from the South Holston or Wilbur tailwaters upstream, as none had been stocked since 1956." [context for brown occurrence without local stocking]
  - Reservoir stocking added to program: "sub-adult (6-8 in.) Brown Trout and fingerling Rainbow Trout were added to the Boone tailwater stocking program in 2008" [tailwater, 2008]
- Source type: agency management plan, confidence HIGH
- Establishes: (1) coldwater habitat in the reservoir (agency statement); (2) continuous put-and-take lake stocking since 1978 at program level (adult rainbow); (3) geography of the upper-arm cold input; (4) brown trout presence may be immigrant-driven.

---

## C. OCCURRENCE EVIDENCE (all queries run 2026-09-24)

### C1. USGS NAS (Nonindigenous Aquatic Species) API — Sullivan County, TN
- URL: https://nas.er.usgs.gov/api/v2/occurrence/search?state=TN&county=Sullivan
- Trout-relevant records:
  - Oncorhynchus mykiss (Rainbow Trout) — lat/lon 36.49839, -82.507668; locality "Fort Patrick Henry Reservoir [South Fork Holston River, NE corner of state]"; HUC10 "Fort Patrick Henry Lake-South Fork Holston River" (0601010207); date 2002-09-06; recordType "Personal communication"; status "stocked". COORDINATE VERDICT: ~100 m EAST (upstream) of FPH Dam → IN THE LAKE at the dam end. Warm-season (September) occurrence.
  - Salmo trutta (Brown Trout) ×9 — MARIS/Literature records 2000–2007, status "stocked", HUC10 "Fort Patrick Henry Lake-South Fork Holston River", coordinates rounded to 2 dp: 36.49/-82.51 (×3) and 36.5/-82.52 (×6). COORDINATE VERDICT: ambiguous — 36.49/-82.51 sits at the dam (lake or immediately below); 36.5/-82.52 is clearly BELOW the dam (tailwater side). Cannot resolve lake-vs-tailwater at this precision.
  - (Context: Salmo trutta ×7 in HUC10 Boone Lake 1999–2005; Ohrid trout failed intro, South Holston Lake 1997.)
- GBIF mirror: same MARIS records carry references http://nas.er.usgs.gov/queries/SpecimenViewer.aspx?SpecimenID=607239 / 607245; GBIF datasetKey d6cc311c-c5ab-4f23-9a20-10514f9eb9c4 (USGS NAS). GBIF search Oncorhynchus mykiss in lake bbox: 0 rows (NAS rainbow record is a GBIF "OCCURRENCE" but under slight different rounding — found via NAS directly).
- Source type: agency biodiversity database, confidence MEDIUM-HIGH (coordinate precision varies)
- Establishes: destination-level in-lake occurrence of Rainbow Trout (2002, September, "stocked" origin status) with an IN-LAKE coordinate; brown trout occurrence in the HUC10 but not resolvable to the lake polygon.

### C2. iNaturalist
- Queries: api.inaturalist.org/v1/observations?taxon_name={Oncorhynchus mykiss, Salmo trutta, Salvelinus fontinalis, Salmo salar}&lat=36.499&lng=-82.50&radius=6
- Result: 0 observations for ALL species within 6 km of the dam.
- Establishes: nothing (clean negative; iNat under-documents this water).

---

## D. COMMUNITY / LOCAL EVIDENCE

### D1. TWRA "Where to Fish — Fort Patrick Henry Reservoir" (lake's own TWRA page)
- URL: https://www.tn.gov/twra/fishing/where-to-fish/east-tennessee-r4/fort-patrick-henry.html; retrieval 2026-09-24
- Contains access/regulation info only; NO fishery description, NO stocking mention, NO trout fishery narrative (confirms ledger note). Only trout text is regulatory: "Trout (all species): Seven (7) per day; 16-22 inch PLR for Rainbow and Brown Trout, with only (1) over 22 inches in effect from Boone Dam downstream to Louis Milhorn Bridge on Beulah Church Drive."
- REACH NOTE (resolves the "one regulation block" flag): this single trout-regulation block spans Boone TW + FPH LAKE + FPH TAILWATER (Boone Dam → below FPH Dam). The lake IS inside a named trout regulation reach. The dam-area "March and April" prose (A3) is the tailwater program and must not be applied to the lake.

### D2. TWRA State Records page
- URL: https://www.tn.gov/twra/fishing/awards-fish-records-photos.html; retrieval 2026-09-24
- "Class: A Species: Cutthroat Trout Weight: 6 lbs., 9 oz. Waterbody: Ft. Patrick Henry Reservoir (Boone tailwater) Angler: Charles Donald Fulton Date: June 28, 2024" — a CLASS A STATE RECORD caught IN THE RESERVOIR at the Boone-tailwater arm, JUNE (warm season). Since TN's record cutthroat stood at 6 oz (Obey River) as of the May-2020 records PDF, this 2024 fish is that state record.
- Establishes: strong recent (2024) warm-season occurrence of a large trout (cutthroat, a Boone TW program species: "Brook, Brown, Cutthroat, Rainbow — March, April, December") in the reservoir's upper arm — de facto holdover/carry-over evidence at the upper arm. Agency-published, confidence HIGH.

### D3. Tennessee Angling Records PDF (dated May 15, 2020; capture 2020-07-24)
- https://web.archive.org/web/20200724030233id_/https://www.tn.gov/content/dam/tn/twra/documents/fishing/state-record/Tennessee-angling-records.pdf
- Brown record: 28 lb 12 oz, CLINCH RIVER, Greg Ensor, 1986. Rainbow: 18 lb 8 oz, Polk Co. pond. Cutthroat: 6 oz, Obey River. NO Fort Patrick Henry record in 2020.
- CONTRADICTS search-engine-summary claims of a "state record brown trout caught from Fort Patrick Henry Reservoir in 2002" — the official records PDF attributes the brown record to the Clinch River. The 2002-09-06 date instead matches the NAS in-lake RAINBOW record (C1). Do not use the brown-record claim.

### D4. Warriors' Path State Park (sits on the lake, upper arm)
- tnstateparks.com park page + fishing activity page (fetched 2026-09-24 with browser UA): park pages contain NO trout mention at all; fishing info is generic. (Site blocks most proxies; two fetch paths used.)
- TWRA ArcGIS places a reservoir-program stocking site AT the park (OBJECTID 776) — the agency, not the park, documents trout at the park shoreline.

### D5. YouTube (site search run 2026-09-24, query "fort patrick henry trout", ~20 videos parsed)
- Lake-proper videos are BASS/PANFISH-oriented: "Fishing Fort Patrick Henry Reservoir for FALL BASS-Kayak Fishing" (TheDadFish, 2023); "Flipping Docks with Jigs (Fort Patrick Henry Lake)" (Fuller's Fishing); "Fall Kayak Bass Fishing The Fort Patrick Henry Lake At Cooks Valley" (Champions Kayak Fishing); "Post spawn Fort Patrick Henry fishing" (D&R Outdoors); "Fort Patrick Henry summertime bluff jiggin for small mouth" (D&R Outdoors).
- Descriptions checked: "Fishing at Patrick Henry Reservior and Warriors Path State Park" (Appalachian Nick, https://youtu.be/HlZF9xvY82g): "Mostly getting sunfish, bluegill mostly, but also hooked into a Crappie at the pier." — no trout. Fall-bass kayak video: bass-only.
- Trout-named videos target the DAM/TAILWATER: "Fishing at Fort Patrick Henry Dam" (Knowlegs), "Fort Patrick Henry Dam" (Pat Attack 1988), "Exploring the Fort Patrick Henry Dam in Kingsport Tn!!"
- Establishes: community orientation at the lake proper is warmwater (bass/panfish); trout angling identity attaches to the dam/tailwater and (per the 2024 record) the upper arm. One-catch rule: NO verified community trout catch in the lake proper found (Fishbrain blocked — see G).

### D6. Reservoir/regulation context (secondary)
- eRegulations/TWRA Region 4 summaries (via search snippets; not independently fetched): Region 4 trout creel 7/day all species, 16–22 in PLR rainbow/brown — consistent with D1 verbatim text from the TWRA page (use D1 as citation).
- WebSearch summary (unverified, Fishbrain blocked): "anglers have logged 1,700+ rainbow trout catches in the area" — AREA-level, not lake-specific, URL not retrievable (fishbrain.com 403 via all fetch paths). Treat as unverifiable community signal, NOT evidence.

---

## E. SYNTHESIS AGAINST OWNER STANDARDS

1. Dated schedule rows for the LAKE: NONE in any source examined (2026 JSON; 2018, 2019 annual schedules; winter programs 2018–19 and 2019–20; completed-release feeds Apr 2020, Feb 2022, May 2024 partial, Sep 2026). Every dated "Patrick Henry" row found is the TAILWATER (2026: M, A, D rainbow+brown planned; completed 4/14/2020; completed 09/10/2026).
2. Program-level calendar for the LAKE (best available): Region IV Coldwater Report 2018 — seven two-story reservoirs (incl. Ft. Patrick Henry) "stocked with adult Rainbow Trout during the late fall and winter"; corroborated in 2026 by sibling-reservoir schedule rows with winter months (Chilhowee F/N/D, Calderwood N/D) while FPH's own months remain unpublished. Species: Rainbow documented at program level; Brown added on the current locations layer and live-page reservoir list ("Brown and Rainbow"); management plan documents adult-rainbow put-and-take on the reservoir since 1978.
3. Year-round test: continuous stocking — NOT shown (program-level evidence is seasonal: late fall/winter). Holdover/reproduction — no agency study of the lake proper; suggestive warm-season occurrences exist (NAS rainbow in lake, Sept 2002; state-record cutthroat in upper arm, June 2024; agency two-story design premised on cold zones). The agency's live page supplies a program-level "year-round trout fishing opportunities" LABEL for these reservoirs (retrieved 2026-09-24) but publishes no months for FPH.
4. Lake-vs-tailwater discipline: of 7 "Patrick Henry" evidence rows, 5 are tailwater (3 ArcGIS sites + 2026 schedule row + completed feeds). Lake-level evidence = 2 ArcGIS reservoir sites (2016 + current), the program descriptions, the NAS 2002 in-lake record, and the 2024 record cutthroat (upper arm).
5. Contradictions logged: (a) R4-2018 says reservoir program = adult Rainbow Trout only, vs live page/ArcGIS "Brown and Rainbow" for FPH; (b) agency "year-round opportunities" label vs seasonal (late fall/winter) stocking description — fishing-opportunity vs stocking-event, must not be conflated; (c) claimed 2002 state-record brown from FPH contradicted by official records PDF (Clinch River); NAS 2002-09-06 in-lake fish is labeled RAINBOW; (d) lake absent from every completed-release feed examined, though present as standing program sites — publication gap, not proof of absence.

## F. SEARCHES RUN (2026-09-24) — including unproductive lanes

WebSearch (web_search_prime, frequently 429-rate-limited):
1. "Fort Patrick Henry Lake trout stocking months TWRA" — partial results
2. "Warriors Path State Park trout stocking Kingsport fishing" — all attempts 429, unproductive
3. "\"Fort Patrick Henry\" lake trout fishing Kingsport rainbow brown" — Fishbrain/area claims, no firm URLs
4. "Fishbrain \"Fort Patrick Henry\" trout catches" — 429, unproductive
5. "youtube Fort Patrick Henry lake trout fishing Kingsport TN" — no direct video results
6. "TWRA Region 4 fishing report \"Patrick Henry\" reservoir trout" — surfaced TWRA where-to-fish + records pages
7. tn.gov-restricted: "\"Fort Patrick Henry Reservoir\" fishing TWRA tn.gov page" — exact where-to-fish URL + records mention
8. "Tennessee state record brown trout 2002 Fort Patrick Henry" — 429; model-supplied details UNVERIFIED and contradicted by official PDF (see D3)
Programmatic/other search lanes:
9. YouTube site search "fort patrick henry trout" — 20 titles parsed, 3 descriptions read (productive negative)
10. DuckDuckGo HTML (3 queries: stocking / fishbrain / Warriors pond) — blocked/empty, unproductive
11. Bing via WebFetch ("Fort Patrick Henry" lake trout stocking) — irrelevant results, unproductive
12. Fishbrain direct (2 URL guesses, curl + jina) — 403 CloudFront, unproductive
13. tnstateparks.com (park page + fishing activity page, curl browser-UA) — fetched; zero trout mentions
14. Wayback CDX: tn.gov/twra/fishing/*, content/dam/tn/twra/* (trout/coldwater/winter/record filters), winter PDF probes — productive
15. r.jina.ai fetches: live trout page, 2026 schedule JSON, fishing-management.html (404 — wrong path), records page, where-to-fish page, fishbrain (403), tnstateparks (403)
16. API queries: ArcGIS (locations layer ×2 queries; StockedTrout2016; StockedTroutMay2017), GBIF (3 species × bbox + dataset lookup), iNat (4 species × radius), NAS (Sullivan County)
Downloads grepped for "Patrick/Warrior/Kingsport": R4 2018, 2019, 2023 coldwater reports; Boone/FPH tailwater plan; 2018/2019 schedules; 2022 coldwater schedule; cold-water-stocking Apr 2020; winter reports 2018-19 & 2019-20; TN angling records May 2020. (R4 2017/2020/2021 PDFs = truncated Wayback captures, unreadable.)

## G. KEY GAP + LIKELY RECORD HOLDER

Gap: month-dated, per-year stocking rows (species/counts) for the RESERVOIR program at Fort Patrick Henry Lake. TWRA publishes none; the locations layer and prose list prove program membership only.
Likely record holder: TWRA Region 4 (Morristown) coldwater program and the annual TWRA hatchery/stocking reports (the "Roddy" annual hatchery reports cited in R4 reports contain destination-level production/stocking tables; Region 4 coldwater reports cite them). A FOIA-grade records request to TWRA Region 4 for FPH Reservoir trout stocking logs (2015–present) would resolve months/counts. (Not requested in this research-only pass.)

## H. RECOMMENDATION

**seasonal-stocked** (documented trout water; stocking is seasonal, not continuous).

Reasoning:
- Positive trout status: standing TWRA reservoir-program stocking sites ON the lake (rainbow+brown) in both the 2016 snapshot and the current layer; agency program description "stocked with adult Rainbow Trout during the late fall and winter" naming Ft. Patrick Henry (R4 2018 report); agency history of put-and-take stocking on the reservoir since 1978; lake sits inside the "Boone Dam downstream to Louis Milhorn Bridge" trout regulation reach; in-lake warm-season occurrence (NAS rainbow, Sept 2002, 36.49839/-82.507668) and a June 2024 state-record cutthroat from the reservoir's Boone-tailwater upper arm.
- Why not "trout" (year-round): under owner policy, year-round requires continuous stocking OR holdover/reproduction evidence. The stocking calendar is seasonal (late fall/winter; sibling reservoirs publish F/N/D-type months), and no agency holdover study exists for the lake proper; the "year-round trout fishing opportunities" phrase on the live page is a program label about angling opportunity, not dated continuous stocking. Holdover is suggested (Sept 2002; June 2024; two-story cold-zone design) but undocumented — per policy its absence never downgrades the water, but it also cannot elevate it.
- Why not "warmwater-focus": agency actively stocks and regulates it for trout; trout regulation block and program membership are current (2026).
- Why not "unresolved": species, program, sites, regulation reach, and occurrence are all documented; only the year-round dimension is limited.
- Upgrade path to "trout": if the owner accepts TWRA's own program-level "year-round trout fishing opportunities" statement as a qualifying agency year-round claim (cited in A3), or if Region 4 records show stockings outside Nov–Mar, reclassify as trout/year-round citing A3 + E.2 rows.
