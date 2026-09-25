# Hiwassee River (Appalachia Dam tailwater), Polk County, TN — Year-Round Trout Classification Research Log

Research date: 2026-09-25 (single session). Scope: internal classification research ONLY; no agencies/businesses/authors/anglers contacted; no files outside the named notes file(s) were written; no git writes.

Water: Hiwassee River tailwater, Appalachia (Apalachia) Dam/Apalachia Powerhouse → Polk County, TN. Ledger: `year-round-trout`; catalog months [10,11,12,1..7]; mapped season "October through July" (TWRA Tailwater_Trout FeatureServer); YR flag set. Sibling discipline verified: Hiwassee LAKE (NC) absent from TN data; "Hiwassee Lake (443 ac)" alias of Ocoee No. 3 refuted in prior passes (Apalachia Reservoir is ~440 ha = ~1,087 ac per Luisi & Bettoli 2001 and ~1,070 ac per TVA — a different water from Parksville/Ocoee No. 1). Parksville Dam and upper Ocoee are separate rows in all TWRA datasets used here.

---

## 1. TWRA ArcGIS (services3.arcgis.com/PWXNAH2YKmZY7lBq) — retrieved 2026-09-25 via REST query

### 1a. Tailwater_Trout (layer 0, "TailwaterRiver") — planned/curated tailwater catalog
- URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/ArcGIS/rest/services/Tailwater_Trout/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=json
- Observation date: dataset as served 2026-09-25. Fields: Name, Species, Season, Dam.
- Hiwassee row (verbatim): `Hiwassee River | Species: rainbow, brown, brook | Season: "October through July" | Dam: Appalachia Dam`
- Geometry: 348-vertex polyline, bbox lon −84.6574→−84.2957, lat 35.167→35.2434 (Powerhouse reach down to ~Hwy 411).
- Cross-check rows (context): Obey Jan–Dec; Caney Fork Mar–Dec; South Holston Mar–Sep; Clinch Mar–Aug; Watauga Mar–Jul; SF Holston/Boone "January,March, April, and December"; Ocoee (Parksville Dam) Mar–May. The Oct–Jul window is uniquely Hiwassee+Caney-ish; only Obey/SFHolston(SH)/Elk span 12 months.
- Establishes: the catalog's "October through July" mapping is a real TWRA GIS field, not an inference. Species includes brook (see contradiction C3).
- Does NOT establish: actual monthly completions; year-round.

### 1b. TWRA_Trout_Stocking_Locations (layer 0, "Trout_MASTER_Project") — stocking site master
- URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/ArcGIS/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0/query?where=UPPER(StreamName)%20LIKE%20%27%25HIWASSEE%25%27&outFields=*&f=json
- 9 Hiwassee rows, ALL Region 3, Polk County, StockingProgram "Tailwater", WaterClass "stream":
  - Powerhouse Boat Ramp 35.18111,−84.44479 (brook_brown_rainbow; USFS)
  - Big Bend Recreation Area 35.20037,−84.46690 (brook_brown_rainbow; USFS)
  - Fox's Cabin 35.19151,−84.44750 (brook_brown_rainbow; USFS)
  - Railroad Trestle 35.18784,−84.49716 (brook_brown_rainbow; USFS)
  - (unnamed) 35.19762,−84.46114 (brook_brown_rainbow; USFS)
  - Taylor's Island 35.22516,−84.53131 (brook_brown_rainbow; USFS)
  - Picnic Area 35.22126,−84.52052 (brook_brown_rainbow; USFS)
  - Hwy 411 Bridge 35.23981,−84.56352 (rainbow only)
  - Hiwassee State Park 35.23314,−84.55015 (rainbow only; TDEC)
- 2016 snapshot of the same master ("StockedTrout2016" / "StockedTroutMar2016" layer) adds Paddy Bridge 35.22518,−84.64624 (rainbow; rainbow-only species) and carries `DelayedHarvestSeason: "Oct 1 to last day of Feb"` on all USFS Reliance-area sites, "None" at Hwy 411/Paddy/State Park. Collector W. Collier; creation 2017-04 (epoch 1492459087).
- Reach/coordinates: tailwater program sites run Powerhouse (≈RM 53.6 / HiRM 86) down to Paddy Bridge (−84.646); rainbow-only at the three warmest downstream sites.
- Confidence: high (agency master). Establishes program structure, region (3), county, species mix as-recorded. Does not establish months.

## 2. 2026 planned schedule (live tn.gov JSON) — retrieved 2026-09-25
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json (616 rows; tn.gov blocks plain curl — fetched via browser-context WebFetch; byte-copy cached by sibling pass in `_work/twra2026.json`)
- Hiwassee rows (verbatim, Region 3, Polk):
  1. `Apalachia TW / Hiwassee River*` — TYPE "Tailwater" — STOCKING MONTHS `M, A, M, J, J, A` — SPECIES "Rainbow, Brown Trout"
  2. `Apalachia TW / Hiwassee River*` — TYPE "Delayed Harvest" — STOCKING MONTHS `F, O, N` — SPECIES "Rainbow Trout"
- Page caveat (Aug-2026 Wayback capture 20260811222723): "any stocking event could be postponed or cancelled due to unforeseen problems such as adverse weather or warm water temperatures. Tailwater and Reservoir stocking dates are variable throughout the months indicated."
- Type: planned. Confidence: high. Establishes: for 2026, TWRA plans Hiwassee tailwater stockings March–August + DH stockings Feb/Oct/Nov. **September, December, January have NO planned stocking of either type.** This CONTRADICTS the GIS "October through July" window (see C1).

## 3. Archived published schedules — month-by-month table

Sources: Wayback Machine captures of state.tn.us and tn.gov (all retrieved 2026-09-25).

| Year(s) (schedule) | Source (capture) | Hiwassee window as published | Months supported | Notes |
|---|---|---|---|---|
| 1999 (actual cohort record) | Luisi & Bettoli 2001, FR 01-13 (Wayback 20100529121922) | 4 monthly rainbow cohorts stocked 14 Jan–22 Jul 1999; browns 31 Mar–1 Apr 1999 | Jan,Feb,Mar,Apr,May,Jun,Jul stocked; **Aug–Sep stockings existed and were recommended for elimination/reduction** ("Eliminate or severely reduce the number of trout stocked in late summer (August – September), and initiate winter stockings earlier (November or December)") | Report also implies winter (Nov–Dec) stockings were LATE in 1999, i.e., Jan started the year with no carryover stockings until mid-Jan |
| 2000–2004 (management statement) | Young & Fiss, Hiwassee Mgmt Plan 2005–2010 (Wayback 20100529121902) | "The section of the Hiwassee River from the powerhouse downstream to Reliance is stocked with trout **year-round**… The lower section from Reliance to Paddy Bridge is too warm in the summer months and is only stocked in the spring." Practice since 2000: "stocked up to twice a month **year-round**, rather than large stockings once a month in the spring" | All 12 months for Powerhouse→Reliance reach (planned/managerial); Hwy 411 Mar–May; Paddy Mar–Apr only | The ONLY agency document found asserting year-round stocking; superseded in print by 2018+ schedules |
| 2003–2015 | Tentative Trout Stocking Schedules sched03–sched15.pdf (Wayback 20030404161556 … 20150319003402) | **Hiwassee ABSENT** — these Feb–Oct week-grids list small streams/put-and-take waters only (Polk rows = Big/Lost Creeks, Goforth, Greasy, Spring, Tumbling, Turtletown, McCamy Lake) | None (no row) | Tailwater stockings were planned/announced separately; no archived tailwater month schedule found for 2003–2017 |
| 2016 | StockedTrout2016 GIS (above) | No month column; DelayedHarvestSeason "Oct 1 to last day of Feb" on upper sites | Oct(1)–Feb for DH season structure | — |
| 2018–2021 | Tailwater-Stocking-Schedule.pdf, /documents/ captures 20180717180321, 20180802231842, 20190415052112 + /fishing/trout/ captures 20200930133127, 20211230204855 — **all captures Jul 2018→Dec 2021 byte-identical (Wayback digest 5OO3V4EEC45QA5OATUQ4ZEZQBDOSZEMR; local md5 dd06b8baddf59ef3e3290eeafe5f3e51)** | Table row: `Hiwassee River | Appalachia Dam | Brook, Brown, and Rainbow | **October through June** | Special Trout Regulations` | Oct,Nov,Dec,Jan,Feb,Mar,Apr,May,Jun | Aug–Sep unstocked on paper |
| 2022–2025 | Tailwater-Stocking-Schedule.pdf, captures 20220221215141 (digest SXC7NNI…), 20230220040628, 20240725212010, 20250716092619 (digest 7NSKGD6N… **byte-identical Feb 2023→Jul 2025**; local md5 05f69634b56eaead132aee876b37eaf7 / ef31fcaadabe34dfea8d2065585708e8 — content rows identical) | Row: `Hiwassee River | Appalachia Dam | Brook, Brown, Cutthroat, and Rainbow | **October through July** | Special Trout Regulations` | Oct–Jul | Matches GIS row. Cutthroat added 2022 |
| 2026 | live schedule JSON (§2) | Tailwater `M,A,M,J,J,A` + DH `F,O,N` | Mar–Aug + Feb/Oct/Nov | Sep, Dec, Jan dark; **August stocked on paper for the first time since the 1990s record** |

Schedule-window verdict: across every archived planned document 1999–2026, **no year plans continuous 12-month stocking. September is unstocked in every schedule-era document 2018–2026.** The catalog window Oct–Jul faithfully reproduces the 2022–2025 published schedule; the 2026 plan (Mar–Aug + F/O/N) has diverged from the GIS. The 2005-era "year-round" statement for the upper reach is real but has no current printed successor.

## 4. Completed (destination-level) stocking evidence

### 4a. 2024-06-07 archive
- URL: https://web.archive.org/web/20240607134309/https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_panel_348017491_c/content/tn_complex_datatable.exceldriven.json?_=1717767789374
- 54 completed rows, window 2024-05-06→2024-06-04. Hiwassee row verbatim: `{"Region": "3", "Destination": "Hiwassee River TW", "Stocking Date": " 05/28/2024"}`.
- Type: completed, destination-level. Establishes at least one late-May 2024 completion. Confidence: high.

### 4b. Trout_Stocking-Report.pdf series (completed, destination-level)
- Sept 2024 (capture 20240927221436, "updated as of 9/27/2024"): recent completions Ft. Campbell 8/29; Tims Ford TW 9/5; Center Hill TW 9/13; Dale Hollow TW 9/26; Buffalo Creek 8/30; South Holston TW 9/9; Wilbur TW 9/5. **No Hiwassee TW.** (Consistent with Hiwassee's last completion being 5/28/2024.)
- Aug/Sep 2025 (capture 20250902003641, "updated as of 8/29/2025"): Tims Ford TW 8/13; Center Hill TW 8/22; Citico Creek 7/31; Dale Hollow TW 8/22; Tellico 7/31; Norris TW 8/26; South Holston TW 8/27; Gatlinburg 8/27; Wilbur TW 8/28. **No Hiwassee TW.**
- Live feed (tn.gov page rendered 2026-09-25, report "updated 9/21/2026"): Dale Hollow TW 9/18/2026; Wilbur TW 9/1/2026; Center Hill TW 9/10/2026; Ft. Patrick Henry TW 8/25+8/28/2026; Gatlinburg 8/27/2026; Tims Ford TW 9/3/2026; Buffalo Creek 9/17/2026; Ft. Campbell 9/11/2026; Norris TW (date scrambled). **No Hiwassee/Apalachia row** — verifies the context's claim for the current feed.
- Verdict: in all three observed years (2024, 2025, 2026) sibling tailwaters completed stockings in Jul–Sep while the Hiwassee completed none; the 2026 PLAN's August tailwater window is so far unevidenced by completions (report as of 9/21/2026 shows no Aug-2026 Hiwassee completion). Contradiction C5.

## 5. Cold-release physics (Appalachia Dam) and temperature documentation

- TVA official page "Apalachia" (tva.com/energy/our-power-system/hydroelectric/apalachia; Wayback capture 20200702135829, retrieved 2026-09-25): "Apalachia Reservoir is a small, **deep, cool-water reservoir**… dam is 150 feet high… A **pipeline and tunnel system carries water from the reservoir 8.3 miles downriver to the powerhouse**… run-of-river… significant amount of rafting and fishing downstream." Establishes the physical basis for cool releases; no temperature numbers.
- Young & Fiss 2005 (Hiwassee Plan, TWRA; Wayback 20100529121902) — the definitive temperature documentation:
  - Generation mode: 18-ft-diameter tunnel connected to the dam **at a depth of about 58 feet**; powerhouse effluent rejoins the river at HiRM 53.6 near Smith Creek confluence; 440 ft head; avg monthly powerhouse discharge 2,140 cfs.
  - "Discharge from Apalachia Reservoir released at the powerhouse has created a section of river where water temperature is **too cold for many native fish populations and marginally cold enough for the survival of stocked trout**."
  - TWRA thermographs 2001–2002: powerhouse >19 C from May 9; >20 C in four July–August 2001 periods incl. a **19-hour period averaging 23.6 C** (during TVA hydropower maintenance, i.e., no-generation periods); Sept 2002 consistently >20 C at powerhouse AND Reliance; Hwy 411/Paddy "too warm for trout most of the time, especially after June 1"; Reliance approached the 24 C lethal threshold on days in mid-May/early June 2001.
  - "The current structure of Apalachia Dam and aqueduct provides **little opportunity to decrease the discharge temperature**" — cold strata at 75–101 ft lie below the aqueduct opening; using them would need oxygen supplementation.
  - TVA 1995 forebay data: strong July stratification, mixing by September.
  - Since 1991 TVA pulses one turbine 1 hr/4 hr = **200 cfs year-round minimum flow**, which "helps maintain cooler water temperatures throughout the summer months"; since 1995 (modified 2001 to weekends) full generation 11 am–7 pm Memorial Day–end of August for rafting.
  - Luisi & Bettoli 2001: "Water temperatures in the Hiwassee River commonly exceeded 21 C during late spring and summer 1999"; 20–25 C during the 1999 drought; "high water temperatures are a **chronic** problem on the river."
- News corroboration of the warm-tail side: WBIR (Oct 1, 2018) and Fox Chattanooga (Oct 2, 2018) — TWRA postponed the Oct 1 delayed-harvest stocking because the river ran **69–74 F** (TWRA stocking threshold <70 F); Local 3 News (Dec 1, 2021) "Warm waters of the Hiwassee River postpone trout stocking" — DH stocking still postponed as of Dec 1, 2021 for the same reason. (URLs via search snippets; article pages dead/404 for direct fetch — see unproductive lanes.)
- Angler lore check: multiple guide sources (Orvis fishing reports, RiverReports, Southeastern Anglers) claim ~50–55 F near the dam year-round. This is CONTRADICTED by every agency thermograph above. On the Fly South (Jimmy Jacobs, "Winter on the Hiwassee," Dec 2020) is more careful: "In August and September, temps rise and slow the bite."
- USGS gauge 03556400 (Hiwassee River at Apalachia Powerhouse, 35.18313,−84.43854): discharge-gauge only; **no water-temperature parameter** in IV or DV services (checked 2026-09-25). Physics verdict: deep (58-ft) tunnel withdrawal + 200-cfs pulsing minimum keep the UPPER reach cooler than a natural stream, but agency data show chronically sub-lethal-to-lethal summer temperatures; "cold all summer" is an overstatement for July–September, and even the DH stocking start (Oct 1) was twice delayed by >70 F water.

## 6. Holdover evidence and the fishery's fame between windows

- Luisi & Bettoli 2001 (TWRA Fisheries Report 01-13, June 2001; TTU/USGS TN Cooperative Fishery Research Unit; Wayback 20100529121922):
  - Holdover population (change-in-ratio, late winter): Jan 1999 ≈ 18,838 trout = **61/ha, ~20 kg/ha** (75% brown trout); Jan 2000 = 22/ha, 13 kg/ha — "**the lowest observed to date in any tailwater managed for trout in Tennessee**."
  - 200-day survival 1999: brown 12.7%; rainbow cohorts 3–4% (June cohort 3%, July 4%; January 4% but 54% harvested). Harvest of January rainbows was high — most rainbows leave the population within months either by angling or mortality.
  - Multi-year brown survival demonstrated: two 1995 TVA-stocked browns recaptured in summer 1999 at ~401 mm after five growing seasons.
  - Natural reproduction "did not contribute to trout standing crops."
  - Growth: browns grew 8 mm/month for ~100 days then ceased; growth "ceased from June through October" in the 1999 drought year.
- Bettoli 2005 (Survey of the Trout Fishery in the Hiwassee River, March–October 2004; TWRA Fisheries Report 05-11; Wayback 20100530133537):
  - 2004 stocking: 83,136 catchable rainbows, 14,071 6-in browns, ~15,000 fingerling browns (2003: 90,237 catchable rainbows, 22,201 catchable browns). Post-1999 strategy: "stock fewer fish, but at more frequent intervals… throughout much of the year appears to be a sound strategy."
  - Monthly effort/catch (Table 1): **August 2004: 5,374 angler-h, 5,118 rainbows caught, 2,334 harvested, CPUE 0.80; September: 1,819 h, 1,813 caught, 872 harvested, CPUE 0.95; October: 3,133 h, 3,215 caught, CPUE 1.23.** Season total 42,952 h; catch rate 1.34 trout/h — HIGHER than 1999 despite 21,000 fewer trout stocked. Documented Aug–Sep catch data — the fishery was real in the gap months, largely on short-residence stocked fish + browns.
  - "Destination fishery": 67% TN residents; out-of-state anglers from Georgia (17%) and 25 other states.
- Bettoli 1989 (Survey of the recreational fisheries in the Caney Fork, Elk, and Hiwassee Rivers, unpublished TWRA final report; cited in FR 05-11): mid-1980s creel "noted **low return rates** for trout stocked into the Hiwassee River" (gray literature; not recovered online).
- Young & Fiss 2005: "most freshly stocked rainbow trout are short-lived"; year-round spread stocking "allows for better use of trout by anglers"; browns >12 in prove multi-year survival; QZ "more effective at maintaining higher catch rates, than producing larger trout."
- Williams, G.G. 1997. "Response of holdover resident brown (Salmo trutta) and rainbow trout (Oncorhynchus mykiss) during changing thermal conditions of Summer in the Hiwassee River, Polk County, TN." TVA Water Management Clean Water Initiative, Norris, TN — cited in FR 01-13; the title itself is summer holdover evidence, but the report is unrecovered gray literature (lead, not evidence).
- Press/guide fame lane: On the Fly South (Dec 2020): "stocked with rainbow and brown trout annually from October to July. There are also some holdover trout in the river, so bigger fish turn up regularly"; winter trip "the angling can be very good," water temps/DO "ideal" that December. TU chapter essay (Monfort, 2002, hiwassee.tu.org): river "famous for" 4–5 lb brown trout. Orvis podcast "Secrets of Southern Tailwaters" with Hiwassee guide Tic (Otis) Smith (search-snippet level only; rate-limited).
- Holdover verdict: holdover trout EXIST (mostly browns), and Aug–Sep angling is documented (2004), but TWRA's own characterization is that holdover standing crop is the lowest among TN trout tailwaters — "documented holdover sustaining the fishery" is only weakly supported, and only for the upper reach.

## 7. Program specifics: species, counts, regulation history

- Species mix (contradiction C3): GIS master `brook_brown_rainbow` (rainbow-only at 3 downstream sites); Tailwater_Trout `rainbow, brown, brook`; published schedules 2018–2021 "Brook, Brown, and Rainbow"; 2022–2025 add **Cutthroat**; 2026 plan "Rainbow, Brown Trout" (tailwater) + "Rainbow Trout" (DH). No completed-release record or creel documents brook/cutthroat actually stocked into the tailwater; brook presence in the GIS rows is suspect (possibly trace). Historic stocking strains recorded in FR 01-13 Table 1 (Arlee, Erwin Arlee Backcross, Fish Lake Desmet, Plymouth Rock Domestic rainbows).
- Counts: 1990s ~100,000 catchable rainbows + 17,500 browns/yr (Luisi & Bettoli 2001); since 1995 Dale Hollow NFH produced 80,000–100,000 9-in rainbows for the Hiwassee (2005 plan: "Continue stocking 86,000 rainbow trout annually… up to 36,500 brown trout annually: 21,500 7-in + 15,000 3-in, powerhouse→Reliance"); 2003–2004 ~83–90k catchable rainbows + 14–22k browns (creel 2005).
- Regulation history (special-reg reach; the "trophy" reach):
  - 1986: Quality Zone (QZ) established between L&N railroad bridge at Reliance and Big Bend Parking Area — 14-in minimum, 2-trout creel, bait prohibited (Young & Fiss 2005; underlying thesis: Lindbom, R.D. 1992, "Special regulations increase angler success on the Hiwassee River Tennessee," M.S., Univ. of Tennessee — gray literature, unrecovered).
  - 2004: brown-trout protection — 14-in minimum, 2-fish creel, Powerhouse→Paddy Bridge; 2005: Reliance→Paddy reverted to statewide (too warm to matter) (Young & Fiss 2005).
  - Current published (Tailwater-Stocking-Schedule.pdf regs column, identical 2018→2025; tn.gov trout-regulations summary via search snippet): "Hiwassee River: Appalachian Powerhouse downstream to L&N Railroad Bridge. ● Mar 1 – Sep 30: 7 trout creel limit, only 2 may be Brown Trout. ● **Catch-and-release season is Oct 1 – last day of Feb.**" Plus "Quality Trout Fishing Area: 14-inch minimum length limit" (tn.gov). DH goal per TMP 2017–2027: light fall stocking, C&R until March, bait prohibited during C&R; Hiwassee listed as a DH area added since 2006.
  - "Two-fly" rule: NOT CONFIRMED as a Hiwassee-specific regulation. Closest hits: TN special-trout-regulation language allowing "one dropper fly having a single hook which is separated from a legal lure by a length of line" (TWRC rules, publications.tnsosfiles.com, 2011 capture — direct PDF fetch 403) and generic guide practice (dropper/two-fly rigs). Treat "two-fly trophy reach" phrasing as unverified folklore for this water; the verified special-reg content is creel/length/C&R season + bait prohibition.

## 8. Occurrence lanes (iNat / GBIF / NAS)
- iNaturalist API (radius 15 km @ 35.20,−84.47; retrieved 2026-09-25): Rainbow trout (Oncorhynchus mykiss) 21 obs, months Mar/Apr/May/Jul/Nov/Dec 2017–2026 (incl. 2026-03-29 "Hiwassee River, Reliance"); Brown trout (Salmo trutta) 5 obs — **Jul 2020/2024/2025 at Reliance**, Jan 2020, Mar 2023; Brook trout (Salvelinus fontinalis) 1 obs, Jul 12, 2020, "Hiwassee River, Reliance." No Aug–Sep observations. July trout photos at Reliance = mild corroboration of mid-summer presence (end of stocking window, so weak holdover evidence).
- GBIF occurrence search (Salmo trutta taxonKey, bbox 35.0–35.4/−84.7–−84.2): 0 results. NAS API (speciesID queries): only statewide TN records (e.g., Clinch River 1991–93 datasets); no Hiwassee tailwater rows. Both lanes unproductive.

## 9. Contradictions register
- C1. Window: Tailwater_Trout GIS "October through July" vs 2026 plan "M,A,M,J,J,A" (+F,O,N DH). Same agency, two windows; GIS likely lags the 2026 schedule revision.
- C2. 2005 plan "stocked… year-round" (powerhouse→Reliance, practice since 2000) vs every published schedule 2018–2026 (Oct–Jun/Oct–Jul/Mar–Aug+FON). Year-round stocking was real ~2000–2005 by agency statement; nothing current repeats it.
- C3. Species: GIS brook_brown_rainbow vs 2026 plan Rainbow/Brown vs 2022–2025 schedules incl. Cutthroat; no completed-record or creel confirmation of brook/cutthroat in the tailwater.
- C4. Guide lore "50–55 F year-round / cold all summer" vs TWRA thermographs (>20 C chronic, 23.6 C event, Reliance >20 C in Sept 2002) and Oct 2018/Oct 2021 DH-stocking postponements at 69–74 F.
- C5. Planned Aug 2026 Hiwassee tailwater stockings vs zero Hiwassee completions in Jul–Sep windows of the completed reports for 2024, 2025, and (as of 9/21/2026) 2026 — while sibling tailwaters (Center Hill, Dale Hollow, Tims Ford, Norris, South Holston, Wilbur) all completed Aug–Sep stockings in those years.

## 10. Searches run (≈20 distinct; including unproductive)
1. Hiwassee River tailwater trout stocking schedule TWRA Appalachia Dam — productive (context, GIS, schedules).
2. Hiwassee "two fly"/"two-fly" regulation trophy section — mostly negative; dropper-fly rule is generic TN special-reg language; no Hiwassee two-fly rule found.
3. Hiwassee August September tailwater year-round holdover — productive (On the Fly South; guide temp claims).
4. TVA Appalachia Dam release water temperature summer — rate-limited run; resolved via direct TVA/Wayback fetch instead.
5. TWRA Hiwassee delayed harvest 2013/2014/2015 announcement — no announcement found; DH predates window (added since 2006 per TMP).
6. eregulations.com TN Hiwassee DH catch-and-release 2026 — indirect; tn.gov regs snippet obtained instead.
7. "Hiwassee" trout "58 feet"/aqueduct/hypolimnion — productive leads (TVA page, Southeastern Anglers, USGS gauge).
8. TWRA Hiwassee electrofishing/creel Region 3 2008/2013/2019 — no post-2004 Hiwassee creel/electrofishing report indexed (gap).
9. "Hiwassee" trout stocking August/September forum 2020–2023 — productive indirectly (Local 3 2021 postponement; tn.gov Oct–Jul snippet).
10. Bettoli 1989 creel / Lindbom 1992 QZ — citations confirmed via FR 05-11/plan; originals unrecovered (gray literature).
11. "Warm waters of the Hiwassee River postpone trout stocking" exact-title — confirmed Local 3 Dec 1, 2021 + WBIR Oct 1 2018 + Fox Chattanooga Oct 2 2018 (69–74 F; <70 F threshold).
12. Orvis "Secrets of Southern Tailwaters" Tic Smith — rate-limited; snippet-level only.
13. Hiwassee "year-round" 50/55 degrees guide — rate-limited; guide claims captured via other snippets.
14. USGS NWIS queries (site 03556400 IV/DV/stat, param 00010) — unproductive: no temperature data.
15. iNaturalist API x3 (O. mykiss, S. trutta, S. fontinalis) — productive/mild.
16. GBIF API x2 (match + occurrence bbox) — unproductive (0 hits).
17. NAS API x2 — unproductive (statewide only).
18. Wayback CDX sweeps (state.tn.us/twra prefix 5,000-row; tn.gov pdf; content/dam trout; tnsosfiles rules; local3news) — productive (schedules, reports, TVA page).
19. Page captures: 2018/2019/Aug-2026 tn.gov stocking pages — productive (schedule links, caveats, live-feed verification).
20. TWRC rules 1660-1-11 proclamation PDF direct fetch — 403 (blocked); Wayback empty. Regulation text recovered via schedule PDF regs column instead.

Unproductive/dead lanes summary: USGS temperature; GBIF; NAS tailwater rows; Lindbom 1992 thesis; Williams 1997 TVA holdover report; Bettoli 1989 report; tnsosfiles proclamation PDFs; Local3news/WBIR/Fox article full texts; troutline.co and hiwassee.tu.org content pages; Region 3-specific post-2004 creel/electrofishing reports.

## 11. Recommendation (does year-round survive?)

**No — the year-round-trout classification does not survive on the evidence; recommend reclassifying to seasonal with the documented window, with a marginal-holdover annotation.**

- Continuous-stocking test: FAILS. No published schedule 2003–2026 shows 12-month stocking. The 2005 plan's "year-round" statement for the Powerhouse→Reliance reach is the only year-round stocking evidence and dates to ~2000–2005 practice; every published window since (2018–2021 Oct–Jun; 2022–2025 Oct–Jul; 2026 Mar–Aug + Feb/Oct/Nov DH) leaves months dark, and September is unstocked in ALL schedule-era years. December–January have had no planned tailwater stockings since at least 2018 (only DH C&R fishing with Oct/Nov/Feb stockings).
- Documented-holdover test: WEAK/FAILS as a "sustaining" claim. Holdover is documented (Bettoli: browns survive multiple years; 61/ha and 22/ha winter standing crops) but quantified by TWRA/TTU as the LOWEST of any Tennessee trout tailwater, with rainbow 200-day survival 3–4% and chronic summer temperatures of 20–24 C; TWRA itself postponed stockings in Oct 2018 and Oct 2021 because the water was still >70 F. What the evidence DOES support: real, documented Aug–Sep angling/catch (2004 creel) sustained by frequent in-season stockings (Jan–Jul) plus brown holdover — an extended-season fishery, not a holdover-sustained year-round one.
- Mapping: the catalog's Oct–Jul window (from Tailwater_Trout) faithfully reflects the 2022–2025 published schedule and should be kept as the seasonal window, with two annotations: (a) 2026 plan diverges (tailwater Mar–Aug + DH Feb/Oct/Nov; keep both on file, flag GIS row as stale); (b) the gap month September is unstocked in every archived year, and the 2005-era "year-round" claim should be recorded as historical (2000–2005) only.
- The YR flag should be cleared for the current era unless the ledger accepts historical-era evidence; if the ledger keeps a "marginal" tier, this water is the textbook case: physically plausible (deep cool releases, 200-cfs minimum), angling documented in Aug–Sep (2004), but agency-documented low holdover and warm-water stocking suspensions argue against "sustained year-round."
- Best single record to hold: Young & Fiss, "Management Plan for the Hiwassee River Trout Fishery, 2005–2010" (TWRA, Jan 2005) — it alone contains the year-round stocking statement, the temperature monitoring, the stocking counts, and the regulation history; paired with Luisi & Bettoli 2001 (holdover quantification) and the 2026 schedule JSON (current divergence).

## Appendix: key file paths (local cache)
- C:\Users\Benjamin\Projects\trout-evidence-repair-20260922\tmp\research\_work\hw_sched\ (FinalHiwasseeReport.pdf/.txt, HiwasseePlan.pdf/.txt, HiwasseeCreel2004.pdf/.txt, Trout_Plan_06.pdf, tmp2017.pdf/.txt, TennesseeTailwatersFinalReport.pdf, ValueTailwaterTrout.pdf, sched03–sched15.pdf/.txt, tw2018/2019/2020/2021/2022/2023.pdf, comp2020–2025.pdf, cw_r6_2019.pdf, report202409.pdf, report202509.pdf)
- C:\Users\Benjamin\Projects\trout-evidence-repair-20260922\tmp\research\_work\hw_tailwater.json, hw_locs.json, hw_releases_20240607.json, twra2026.json, hw_inat_*.json, usgs_hw_*.json, tva_apalachia.html, page2018/2019/2026.html, cdx_twra0315.txt, cdx_tngov_pdf.txt
