# Parksville Lake (Parksville Reservoir / Ocoee Lake No. 1) — Evidence Completion Log

- Ledger verdict at start: `year-round-trout`, YR flag, no months pinned
- Research date: 2026-09-25 (all retrievals this date unless noted)
- Mode: internal classification research, read-only (no agency/business/author contact)
- County: Polk | TWRA Region 3 (schedule/GIS) — note TWRA's trout page labels it "Region II" in one list (see Contradictions)

## Identity

- Names: Parksville Lake = Parksville Reservoir = Ocoee Lake No. 1 = "Ocoee Lake #1". TWRA GIS Site_Name literally "Parksville Reservoir (Ocoee Lake #1)".
- 1,930 surface acres, Polk County, SE Tennessee; impoundment created 1911 by Tennessee Electric Power Co. via Ocoee Dam #1; TVA acquired 1939 (TWRA reservoir page).
- Coordinates (TWRA trout stocking GIS, reservoir rows): 35.10240, -84.63364 (Site "Parksville Reservoir (Ocoee Lake #1)"); second unnamed reservoir point 35.11248, -84.58831; tailwater site "Parksville Dam / Parksville Lake Tailwater" 35.09573, -84.65144. (2016 layer reservoir row: 35.09887, -84.63244.)
- Separately tracked in ledger: the TAILWATER below Parksville Dam (Ocoee River) resolved rainbow Mar–May; this log covers the RESERVOIR.

## Sources

### S1. TWRA "Trout Fishing & Stockings in Tennessee" page (LIVE, current)
- Title: Trout Fishing & Stockings in Tennessee | Org: TWRA (tn.gov)
- Publication: undated page; "Trout Stocking Locations Report" stated updated as of 9/21/2026; 2026 schedule embedded
- Observation dates: 2026 season content; retrieved 2026-09-25
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings.html
- Fields relevant to the reservoir trout program:
  - Reservoir list section, verbatim rows: "Region II, Dale Hollow, - Rainbow"; "Region II, Parksville - Rainbow"; "Region IV, Calderwood - Brook, Brown and Rainbow"; "Region IV, Chilhowee - Rainbow"; "Region IV, Fort Patrick Henry - Brown and Rainbow"; "Region IV, South Holston - Lake and Rainbow"; "Region IV, Tellico (Upper) - Rainbow"; "Region IV, Watauga - Lake and Rainbow". Page intro states TWRA stocks these reservoirs "to provide year-round trout fishing opportunities."
  - Tailwater list, Region III: "Ocoee Dam #1 - Parksville, Ocoee River - Rainbow - March through May - Statewide Regulations."
  - Note on schedule semantics: "Tailwater and Reservoir stocking dates are variable throughout the months indicated."
- Type: agency program statement (reservoir list + purpose statement). Confidence: high (live agency source).
- Establishes: (1) Parksville Reservoir is currently on TWRA's published reservoir trout stocking list (Rainbow); (2) agency-documented purpose = year-round trout fishing opportunity; (3) the tailwater row is separate (Mar–May).
- Does NOT establish: specific months for reservoir stockings (reservoir list carries no month fields).

### S2. Trout Management Plan for Tennessee 2017–2027 (TMP)
- Title/author/org: "TWRA Fisheries Report No. 17-10", edited by James W. Habera, TWRA; October 2017
- Retrieved 2026-09-25 from Wayback snapshot 20180803011947 of the TWRA-hosted PDF (current in-page link on S1)
- URLs: live https://www.tn.gov/content/dam/tn/twra/documents/fishing/Tennessee-Trout-Management-Plan-2017-2027.pdf ; archived copy used: https://web.archive.org/web/20180803011947if_/https://www.tn.gov/content/dam/tn/twra/documents/fisheries/trout/Trout%20Management%20Plan%20for%20Tennessee%202017-2027.pdf
- Fields (verbatim extracts):
  - "Only reservoirs that maintain a year-round supply of cold, well-oxygenated water can support trout fisheries."
  - "Tennessee has nine reservoirs that currently support trout fisheries: Dale Hollow, Parksville, South Holston, Wilbur, Watauga, Fort Patrick Henry, Calderwood, Chilhowee, and Tellico (~62,400 acres total)."
  - "…these attempts [tributary spawning] are largely unsuccessful and stocking is required to maintain reservoir fisheries. Trout are stocked during the winter to assure that surface water temperatures are cold enough for their survival."
- Type: agency management plan (documented refuge/holdover rationale + program list). Confidence: high.
- Establishes: Parksville among the nine reservoir trout waters; agency-documented cold-water-refuge physics as the basis of reservoir trout fisheries; stocking (not natural reproduction) maintains them.
- Does NOT establish: annual numbers specific to Parksville (Parksville named once in the plan body).

### S3. TWRA_GIS "Trout Stocking Locations in Tennessee" (official ArcGIS Feature Service)
- Org: TWRA (owner TWRA_GIS), item https://www.arcgis.com/home/item.html?id=3ec5c58f99de4de5951f32b76b462623
- Service: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0 ; layer "Trout_MASTER_Project"; snippet: "This service maps trout stocking locations throughout Tennessee…"
- Created 2026-04-06, last modified 2026-07-27 (UTC from item timestamps) = current 2026 stocking-season layer; retrieved 2026-09-25
- Fields (Parksville rows; layer fields: Site_Name, StreamName, Region, County, City, StockingProgram, WaterClass, Species, NumStocked, Management, LATITUDE, LONGITUDE, …):
  1. Site_Name "Parksville Reservoir (Ocoee Lake #1)", StreamName "Parksville Reservoir", Region 3, POLK, City Benton, StockingProgram "Spring", WaterClass "reservoir", Species "rainbow", NumStocked 3000, Management "USFS", lat 35.10240178500004, lon -84.63364308599995
  2. Site_Name null, StreamName "Parksville Reservoir", POLK, StockingProgram "Spring", WaterClass "reservoir", Species "rainbow", NumStocked null, lat 35.11247762700003, lon -84.58831497499995
  3. Site_Name "Parksville Dam", StreamName "Parksville Lake Tailwater", POLK, StockingProgram "Tailwater", WaterClass "stream", Species "rainbow", NumStocked 1650, Management "TVA", lat 35.0957304, lon -84.651443854
- Program structure in layer: 19 "Reservoir"-program reservoir rows (Watauga/S. Holston/Ft. Patrick Henry/Chilhowee/Calderwood/Tellico/Dale Hollow; rainbow or rainbow_brown), 3 "Spring" reservoir rows (Pickett Lake, Parksville x2), 1 "Winter" reservoir row (Lake Graham).
- Type: agency stocking-location GIS (destination-level). Confidence: high (official TWRA_GIS owner, current season).
- Establishes: the RESERVOIR remains an active trout stocking destination in the current (2026) agency layer — rainbow, reservoir-class, Spring program, ~3,000 fish, USFS-management area — distinct from the tailwater rows.
- Does NOT establish: year-round stocking cadence (Spring label only).

### S4. ArcGIS "StockedTrout2016" Feature Service (2016 season layer)
- Owner lynnbarrett (TWRA GIS contractor account), item https://www.arcgis.com/home/item.html?id=c5c5bf5ac8bc44938bc71d66ffff30eb
- Service: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/StockedTrout2016/FeatureServer/0 ; snippet "TWRA stocked trout locations for Winter, Spring and Summer"; created 2016-03-18, modified 2017-04-17; retrieved 2026-09-25
- Fields (Parksville/Ocoee matches of 796 features):
  1. Site_Name "Parksville Reservoir (Ocoee Lake #1)", StreamName "Parksville Reservoir", Region 3, POLK, City Benton, StockingProgram "Reservoir", WaterClass "reservoir", Species "rainbow", NumStocked 3000, Management "USFS", lat 35.0988687510001, lon -84.632436092
  2. Site_Name "Parksville Dam", StreamName "Parksville Lake Tailwater", POLK, Tailwater/stream, rainbow, 1650, TVA
  3. Site_Name null, StreamName "Parksville Reservoir", POLK, Reservoir/reservoir, rainbow (no coords)
- Type: agency GIS (destination-level, 2016). Confidence: high for the 2016 season.
- Establishes: reservoir rainbow stocking at Parksville documented for the 2016 season ("Reservoir" program), alongside the tailwater row — the 2016 "spring-rainbow GIS sites" from the prior pass, confirmed and quantified (3,000).
- Does NOT establish: continuity 2016→2026 (S3 shows the program persists in 2026).

### S5. 2026 TWRA trout stocking schedule JSON (616 rows, LIVE)
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json (fetched via WebFetch and curl; retrieved 2026-09-25)
- Fields: REGION, COUNTY, LOCATION, SPECIES, STOCKING DAY, STOCKING MONTHS, STOCKING WEEK, TYPE
- Only matches for our waters: Parksville row = {"REGION":"3","COUNTY":"Polk","LOCATION":"Parksville(Ocoee #1) TW / Ocoee River","TYPE":"Tailwater","STOCKING MONTHS":"M, A, M","SPECIES":"Rainbow Trout"}. Chickamauga = 4 "N. Chickamauga Creek" seasonal rows (creek, not the lake). Nickajack = zero rows.
- Type: planned schedule. Confidence: high.
- Establishes: the weekly 2026 schedule covers the Parksville TAILWATER only; no Parksville Reservoir row, no months pinned for the reservoir. Confirms prior pass ("absent from 2026 schedule" — true for the weekly table, but the reservoir IS listed on the page's Reservoir list (S1) and in the GIS layer (S3)).
- Does NOT establish: absence of reservoir stockings (the weekly table is not where variable-date reservoir stockings appear; see S1 note "Tailwater and Reservoir stocking dates are variable").

### S6. TWRA Parksville Reservoir "Where to Fish" page (LIVE)
- URL: https://www.tn.gov/twra/fishing/where-to-fish/cumberland-plateau-r3/parksville-reservoir.html ; retrieved 2026-09-25
- Fields: 1,930 ac, Polk Co., Ocoee Dam #1 (1911), TVA 1939. Species: largemouth, Alabama bass, crappie, redear, bluegill, yellow perch, walleye, muskie. Stocking history: bluegill/redear first stocked 2007 (49,956 bluegill in 2018); black/blacknose crappie 2013–2018 then discontinued; walleye 2016–2019 (20,726/19,575/27,723/16,502 fingerlings); muskie 603 fingerlings fall 2017 + 1,000 in 2019. Trout: appears only in (a) the general sentence that the reservoir "has been stocked by TWRA with bluegill, redear sunfish, black crappie, muskie, walleye, and trout" and (b) regulations "Seven (7) per day, no length limit" trout creel. No trout stocking dates/numbers. Also: Alabama bass ~60% of black bass population; 2014 state-record Alabama bass (7 lb) from Parksville; new LMB regs proposed 2025.
- Type: agency reservoir management profile. Confidence: high.
- Establishes: warmwater management emphasis (current program detail is entirely warmwater: walleye/muskie/crappie/sunfish 2007–2019) + a trout creel regulation implying a managed trout fishery component + historical trout stocking acknowledged.
- Does NOT establish: trout stocking calendar; contradicts nothing but frames the reservoir as a two-story/warmwater-first fishery.

### S7. 2016-17 TWRA Winter Trout Stocking release (negative control)
- "2016-17 TWRA Winter Trout Stocking Underway", TWRA Newsroom, Wednesday, December 07, 2016, 09:29am
- URL (archived): https://web.archive.org/web/20190109072305if_/https://www.tn.gov/twra/news/2016/12/7/2016-17-twra-winter-trout-stocking-underway.html ; retrieved 2026-09-25
- Fields: ~90,000 rainbow trout Dec–Mar, "close to home" program; full waters list = city parks/ponds/small streams; NO Parksville (and no large-reservoir destinations).
- Type: agency news (planned schedule). Confidence: high.
- Establishes: Parksville reservoir trout stockings do NOT come via the winter close-to-home program (negative evidence for one hypothesized delivery channel).

### S8. Completed stockings report (LIVE JSON, as of 9/21/2026)
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable.exceldriven.json ; retrieved 2026-09-25
- Fields: 10 rows (Region, Destination, Stocking Date 8/25–9/18/2026): Ft. Campbell, Tims Ford TW, Center Hill TW, Dale Hollow TW, Buffalo Creek, Ft. Patrick Henry TW, Leconte Creek, Norris TW, West Prong Little Pigeon (Gatlinburg), Wilbur TW. No Parksville.
- Type: completed destination-level. Confidence: high.
- Establishes: late-summer completed stockings are tailwater/stream-phase; no reservoir trout reported at Parksville in this reporting window (consistent with spring reservoir phase). (Prior pass's completed2024 May table likewise had no Parksville.)

### S9. GBIF / iNaturalist (crowd observation lead check)
- GBIF occurrence API taxon 2351816 (Oncorhynchus mykiss) within 10 km of 35.10,-84.63: 0 records. iNaturalist same query: 0. Retrieved 2026-09-25.
- Establishes: nothing (absence of crowd records is not absence of fish). Logged as a null lead.

## Year-round claim test

Standard: year-round requires continuous stocking OR agency-documented holdover/refuge WITH an agency statement.

- Continuous stocking: NOT shown. Reservoir stockings documented as seasonal in agency GIS (Spring 2026, 3,000 rainbow; "Reservoir" program 2016); no reservoir row in the weekly 2026 schedule; winter close-to-home program excludes it.
- Agency-documented refuge + statement: YES, twice over —
  (a) TMP 2017–2027 (S2): Parksville is one of nine reservoirs where a "year-round supply of cold, well-oxygenated water" supports a put-and-take trout fishery maintained by stocking;
  (b) live TWRA trout page (S1): the reservoir list naming Parksville – Rainbow is introduced as stocked "to provide year-round trout fishing opportunities."
- Conclusion: the `year-round-trout` verdict SURVIVES on the refuge + agency-statement branch, not on continuous stocking. The fishery is a seasonal-stocking, year-round-presence (holdover/refuge) reservoir fishery; page-level emphasis (S6) is warmwater co-management (walleye/muskie), consistent with a two-story classification.

## Contradictions / tensions

1. S1's reservoir list labels Parksville "Region II" while schedule JSON/GIS place it in Region 3 (Polk County) — a TWRA page labeling inconsistency; the row itself (name + Rainbow) matches all other Parksville evidence.
2. S2 (TMP) says reservoir trout are stocked "during the winter"; 2026 GIS labels Parksville "Spring" (and 2016 layer used a separate "Reservoir" program label). Month labeling is inconsistent across agency sources → months remain unpinned; do not pin without a monthly agency row.
3. S6's detailed stocking narrative lists only warmwater programs (2007–2019) with trout mentioned only in summary — mild tension with an active trout program, resolved by S1/S3 (current-season GIS + list). No external contradiction found (no source says the reservoir trout program ended).

## Searches run (15; several returned 429 rate-limits and were retried in variant form)

1. TWRA trout stocking schedule Parksville Lake reservoir
2. "Ocoee Lake" OR "Parksville Lake" trout stocking history TWRA Polk County
3. TWRA "Parksville" trout stocking completed release rainbow
4. "Parksville Reservoir" trout stocking TWRA rainbow
5. "Trout Management Plan" Tennessee 2017-2027 reservoirs "Parksville" OR "Ocoee" nine reservoir list
6. TWRA Region 3 coldwater report Parksville Lake two-story trout
7. site:tn.gov twra Parksville reservoir fishing
8. TWRA completed trout stocking report "Parksville" 2015 OR 2016 OR 2017 reservoir
9. eregulations.com Tennessee trout stocking schedule Parksville reservoir winter rainbow
10. WATE spring trout stocking East Tennessee Parksville Reservoir November April rainbow
11. newunits.fisheries.org Tennessee "Parksville" OR "Dale Hollow" trout stocked
12. "trout management plan" tennessee TWRA "Parksville" reservoir rainbow stocked "Ocoee"
13. TWRA trout stocking sites arcgis rest services FeatureServer Tennessee
14. "Trout Management Plan for Tennessee" 2017 2027 pdf "reservoirs" TWRA
15. chattanoogan.com TWRA fishing report Parksville rainbow trout stockings

Plus non-search retrievals: ArcGIS Online item/REST queries (3 services), Wayback CDX + archived page/PDF pulls (2016-17 winter release, TMP PDF, 2018 schedule PDF attempt), live tn.gov JSON endpoints (schedule + completed), GBIF/iNat API queries.

## Recommendation

KEEP classification `year-round-trout` (YR flag) for Parksville Lake / Parksville Reservoir, confidence medium-high, with notes:
- Basis = agency statement (S1: reservoir list stocked "to provide year-round trout fishing opportunities"; Parksville – Rainbow) + TMP nine-reservoir coldwater-refuge documentation (S2), i.e., the holdover/refuge branch of the standard, NOT continuous stocking.
- Reservoir stocking months remain UNPINNED (ledger's current state is correct): agency sources show spring (2026 GIS "Spring", 3,000 rainbow; 2016 "Reservoir" program) and TMP describes winter stocking for the nine-reservoir program generally; schedule carries no reservoir row (tailwater row Mar–May is the separate ledger row).
- Do NOT re-class as warmwater: S6's warmwater emphasis is co-management; the current-year agency trout program documents the reservoir (S1, S3).
- Minor ledger hygiene: if the ledger stores the S1 reservoir-list row, record TWRA's "Region II" label verbatim as a page-level inconsistency.
