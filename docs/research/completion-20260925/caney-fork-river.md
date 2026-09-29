# Research Log — Caney Fork River (Center Hill Dam tailwater), DeKalb County, TN

- Ledger water: `year-round-trout`; mapped season "March through December"; catalog months [3..12]; YR flag set.
- Sibling discipline: caney-fork-upper (warmwater ledger row) and Center Hill Lake are DIFFERENT waters — all evidence here is restricted to the tailwater reach below Center Hill Dam (dam to Cumberland River confluence near Carthage / South Carthage).
- Retrieval date for all sources: 2026-09-25. Today's date: 2026-09-25 (owner context says 2026-09-24/25; retrieval logged as 2026-09-25).
- Research only; no agencies/businesses/authors/anglers contacted; no writes outside the named notes file.

---

## A. Structured datasets (TWRA ArcGIS org PWXNAH2YKmZY7lBq = "Tennessee Wildlife Resources Agency")

### A1. Tailwater_Trout FeatureServer (layer 0 "TailwaterRiver")
- URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/ArcGIS/rest/services/Tailwater_Trout/FeatureServer/0
- Query: all 13 features, outFields=*, outSR=4326 (file: tmp/research/data/tailwater_trout_all.json)
- Fields: Name, Species, Season, Dam, Shape__Length.
- Caney row (OBJECTID 30): Name "Caney Fork River"; Species "rainbow, brown, brook"; Season "March through December"; Dam "Center Hill Dam"; polyline 199 vertices, first pt (-85.82506, 36.09817) just below the dam, last pt (-85.92458, 36.21204) toward the Cumberland confluence; length ~114.6 km (≈26 mi).
- Observation date: current layer (last schema/data edit 2026-06-24 epoch 1790270245235 on sibling layer); retrieved 2026-09-25.
- Source type: agency GIS layer (planned-program metadata). Confidence: high for what TWRA currently publishes as program months.
- Establishes: species mix RB/BN/BK; published season text "March through December"; tailwater reach geometry (not lake, not upper river).
- Does NOT establish: actual winter stocking events (metadata only).

### A2. TWRA_Trout_Stocking_Locations FeatureServer (layer 0 "Trout_MASTER_Project")
- URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/ArcGIS/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0
- Query: upper(StreamName) LIKE '%CANEY%' → 5 rows (file: trout_stocking_caney.json):
  1. Betty's Island (36.14774, -85.83923), Smith Co, Region 2, Tailwater, rainbow, 24-hr access
  2. Gordonsville Boat Ramp (36.18506, -85.90654), Smith Co, Region 2, Tailwater, rainbow
  3. Long Branch Recreation Area (36.10020, -85.83185), DeKalb Co, Region 3, Tailwater, rainbow, USACE-managed access
  4. Happy Hollow (36.13161, -85.80726), Putnam Co, Region 3, Tailwater, brook_brown_rainbow
  5. Buffalo Valley Recreation Area (36.10032, -85.82908), DeKalb Co, Region 3, Tailwater, brook_brown_rainbow, USACE
- All rows: StockingProgram "Tailwater"; WaterClass "stream"; DelayedHarvestSeason "None"; DayClosure "None".
- Note: DeKalb-County sites (Long Branch, Buffalo Valley Rec Area) are at the very head of the tailwater (river-mile 0–1.5, DeKalb/Putnam line); Happy Hollow is the classic put-in ~1.5 mi below the dam. The mapped "DeKalb County" water sits at the upstream end of a 26-mile reach whose stocking sites extend into Putnam/Smith counties.
- Establishes: named stocking sites + coords; program type Tailwater; no delayed-harvest reach on the Caney.

---

## B. Current (2026) planning documents — tn.gov

### B1. 2026 Trout Stocking Schedule JSON (616 rows)
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json
- Fetch: browser User-Agent (plain curl blocked); HTTP 200; retrieved 2026-09-25 (file: sched2026.json).
- Caney row (1 of 616): REGION 3; COUNTY "DeKalb/Smith"; LOCATION "Center Hill TW / Caney Fork River"; TYPE "Tailwater"; STOCKING MONTHS "M, A, M, J, J, A, S, O, N, D"; SPECIES "Rainbow, Brown Trout".
- Tailwater program comparison (12 rows): Dale Hollow TW/Obey = "J, F, M, A, M, J, J, A, S, O, N, D" (true year-round); Normandy/Duck = "J, F, M, N, D"; Cherokee/Holston = "J, F, M, A, N, D"; Caney = Mar–Dec (NO Jan, NO Feb).
- TYPE census: Seasonal 436, Winter 95, Weekly 36, Delayed Harvest 34, Tailwater 12, Reservoir 3 (Caney is not in the Winter or DH programs).
- Establishes (planned, year-dated 2026): 10-month window Mar–Dec; winter months absent from the current plan.

### B2. Live "Trout Fishing & Stockings" page text (2026)
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings.html (retrieved 2026-09-25; file stockings_page.html)
- Region III line: "Center Hill Dam, Caney Fork River - Rainbow, Brook, Brown, Cutthroat - March through December - Special Trout Regulations".
- Discrepancy noted: live page text adds Brook and Cutthroat vs JSON ("Rainbow, Brown Trout") and ArcGIS ("rainbow, brown, brook"). Cutthroat is new to the species list (cf. Boone TW cutthroat strains stocked 2023–24 per TWRA StoryMap).

### B3. Completed-release feed (live, rolling window)
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable.exceldriven.json (path read out of page's data-config; older tn_panel_348017491_c path now 404)
- Retrieved 2026-09-25 (file committed_live.json): 10 most-recent destinations incl. {"Region": "3", "Destination": "Center Hill TW", "Stocking Date": "09/11/2026"}.
- Establishes (completed, destination-level): a Center Hill TW release on 09/11/2026 — inside Mar–Dec window, late-season.

### B4. TWRA "Trout Fishing Forecasts" StoryMap (live 2025/26 content)
- Item: https://storymaps.arcgis.com/stories/dbb92bdf718f4fd7839bf4b08fb82747 (JSON: https://www.arcgis.com/sharing/rest/content/items/dbb92bdf718f4fd7839bf4b08fb82747/data?f=json; retrieved 2026-09-25)
- Caney Fork section verbatim (node n-oROWU2): "The Center Hill Tailwater provides trout fishing opportunities for about 15 miles from the dam down to the stonewall access. However, the best year round fishing is in the upper 9 miles of the river. Although the water is cold enough to support trout year round, there isn't any natural reproduction in the river so the TWRA stocks Brown, Brook, and Rainbow trout throughout the year to provide a good place to fish. Many fish will hold over to the next year so the river supports a good population of large Brown Trout and currently holds the State Record for Brook Trout."
- Stocking line (Caney): "Stocking: March through December (year-round fishing)".
- Regulations node: 5-trout creel; Rainbow/Brook 14–20" PLR, 1 over 20"; Brown <24" released, 1 >24".
- Contrast within same StoryMap: Obey "Stocking: January through December (year-round fishing)"; Duck "(Seasonal Trout Fishing)". TWRA applies "year-round fishing" as an angling-opportunity label to several tailwaters stocked Mar–Sep (e.g., Wilbur, Clinch), i.e., the label ≠ continuous stocking.
- Notably, the Caney section has NO "Biologist Sampling Report (2026)" entry, while Hiwassee, Boone, Obey, Tims Ford, South Holston do — recent electrofishing results for the Caney are not published in this product.
- Establishes: TWRA's own current characterization — water cold enough year-round; no natural reproduction; holdover common; trophy browns; state-record brook; stocking Mar–Dec with "year-round fishing" label.

### B5. Current special regulation (2026-27 eRegulations)
- URL: https://www.eregulations.com/tennessee/fishing/trout-regulations (retrieved 2026-09-25)
- "Special Trout Regulations" → Caney Fork River, Center Hill Dam to Cumberland River, incl. tributaries: total creel 5 trout; Rainbow 14–20" PLR, only 1 >20"; Brook 14–20" PLR, only 1 >20"; Brown "One (1) per day, 24 inch minimum length limit." No closed season on the reach.
- Establishes: the "trophy" management is river-wide (no gear/catch-release section); not a "trophy section."

---

## C. Archived program documents (Wayback Machine) — months by year

### C1. TWRA tailwater program pages (state.tn.us/twra/fish/StreamRiver/tailtrout/tailtrout.html)
- Captures fetched: 20021015000936, 20060603135122, 20080506113523, 20100115022422, 20120113234317, 20140412222000 (files tailtrout_*.html).
- Caney rows verbatim:
  - 2002 capture (2001/02 schedule): "Caney Fork River Center Hill Dam rainbow trout brown trout March through December". Page also: "most of our tailwaters hold trout year-round, so fish is good anytime"; "In 2001 we stocked 1.3 million trout into tailwaters."
  - 2006: "March through December" (rainbow, brown).
  - 2008 (May 2008): "March through December", species now "rainbow trout brown trout brook trout" (brook added by 2008; Little River Outfitters Nov 2009 article confirms "TWRA began stocking brook trout" ~that era).
  - 2010 (Jan 2010), 2012 (Jan 2012), 2014 (Apr 2014): "March through December" (rainbow, brown, brook).
  - 2016/2017 redesign captures: menu page only (table retired; superseded by GIS layer).
- Source type: agency web page (planned program). Confidence: high. Establishes: Mar–Dec every observed year 2001–2014; species additions.

### C2. Tailwater-Stocking-Schedule.pdf (tn.gov), versions by digest/md5
- 2018 capture (via https://web.archive.org/web/20180714054547/...Tailwater-Stocking-Schedule.pdf): "Caney Fork River Center Hill Dam Brook, Brown, and Rainbow — March through January — Special Trout Regulations."
- 2020 capture (20200124234825id_, md5 dd06b8baddf59ef3e3290eeafe5f3e51): same "March through January".
- 2022a (20220221215141, md5 05f69634...): "March through August, November, December" (September and October dropped).
- 2022b (20220519195001, md5 ef31fcaadabe34dfea8d2065585708e8) = byte-identical to 2023 (Feb 2023), 2024 (Jul 2024, arrived gzip; md5 same after decompress), and 2025 (Feb 2025) captures, and CDX shows same digest through 20250902 — file unchanged May 2022 → Sep 2025. (The "byte-identical 2021–25 replay" warning is resolved: md5 equality reflects a genuinely static file, not a replay of 2020; the 2020 file md5 differs.)
- Establishes (planned): 2018–2020 era window was Mar–Jan (11 months incl. January, no Feb); 2022–2025 era window was Mar–Aug + Nov–Dec (10 months, Sep–Oct gap).
- 2018 file also lists the then-current special regs (5 creel; PLR 14–20 RB/BK; brown 24" min 1/day).

### C3. "Trout-Stocking-Schedule-Complete.pdf" (2019–2025) — NOT tailwater
- 13 captures downloaded (one per distinct CDX digest; md5 computed): 2019-20 and 2020 payloads byte-identical (md5 d8beba55...); 2021a (0e5c3434...), 2021b (41e350cc...), 2022a (6228d37e...), 2022b (9c75adf3...), 2023a (3a748e6b...), 2024a (c3cfa00d...), 2024b (852e3117...), 2025a (321048d5...), 2025b (fecd884c...), 2025d (8b67aac0...) all distinct. (2025c download was gzip-corrupt, discarded.)
- Content: titles "Trout Stocking (2020)"…"(2025)" — these cover the SEASONAL STREAM program only (Feb–Oct/Nov); no Caney Fork, no tailwaters in any year. Confirms the pre-2026 schedule PDFs never planned the Caney; tailwater months lived in C1/C2 documents.

### C4. Old stream schedules sched03–sched15 (state.tn.us era)
- Captures: 20030404161556 (03), 20040210011352 (04), 20051124124935 (05), 20060604223344 (06), 20070227143540 (07), 20080909205030 (08), 20090418095714 (09), 20100326100325 (10), 20110111175732 (11), 20120418154111 (12), 20140412202632 (14), 20150319003402 (15); sched13 capture was a redirect only.
- pdftotext -layout; NO "Caney", no "Center Hill", no tailwater rows in ANY year 2003–2015. Titles "TWRA TENTATIVE TROUT STOCKING SCHEDULE"; seasons Feb/Mar–Oct (2003) → later years similar. (DeKalb Co rows in 2003: Hurricane Creek, Salt Lick Creek — small streams, unrelated.)
- Establishes (negatively): the annual stream-schedule PDFs never included tailwaters, so absence of Caney rows there is expected and says nothing about the tailwater program.

### C5. Completed-release records (destination-level)
- Cold-Water-Stocking.pdf (updated 12-22-2021; capture 20211230204829): last stocking date per destination — "Center Hill TW 11/3/2021"; "Dale Hollow TW 12/10/2021"; "Tims Ford TW 11/2/2021". → Caney NOT stocked Dec 2021 (while Obey was).
- Coldwater-Trout_Stocking-Schedule.pdf captures ("Updated" dated sheets; actual dates):
  - 2022-02-18 sheet: winter events listed (Normandy TW 01/25/2022, Tims Ford TW 02/02/2022, Dale Hollow TW 02/11/2022) — NO Center Hill TW row (no Jan–Feb stocking).
  - May 2022: Center Hill TW 05/13/2022; Aug 2022: 08/04/2022; Nov 2022: 11/09/2022.
  - 2023: 04/20/2023 (May cap), 08/11/2023 (Aug cap); (Nov 2023 cap lists only Dale Hollow 10/27/2023 as latest TW event in that snapshot).
  - 2024: 05/03/2024 (May cap), 08/13/2024 (Aug cap).
- Archived committed feed (2024-06-07 capture): https://web.archive.org/web/20240607134309/.../tn_panel_348017491_c/content/tn_complex_datatable.exceldriven.json — 54 destinations incl. "Region 3, Center Hill TW, 05/30/2024".
- Live feed 2026-09-25: Center Hill TW 09/11/2026.
- Establishes (completed, dated): Caney releases cluster Mar/Apr–Nov in 2021–2026 observation windows; zero observed completions in Dec/Jan/Feb; strong contrast with Obey (Dale Hollow TW) winter events.

---

## D. Management plans and peer-reviewed/technical studies (holdover & reproduction evidence)

### D1. Management Plan for the Center Hill Tailwater Trout Fishery 2004–2009
- Fiss, F.C. & D.W. Young, TWRA, December 2003.
- URL (Wayback 2018 & 2020 captures, byte-identical digest WBSOAMG4TTKFQDML6KIWCBLXJ6I43SHP): https://web.archive.org/web/20180714054547/https://www.tn.gov/content/dam/tn/twra/documents/Center_Hill_Tailwater_Trout_Fishery_2004-2009.pdf (also live-captured 20211230204857)
- Key content:
  - Tailwater 26 mi dam→Cumberland R.; dam in DeKalb Co; Smith Fork trib at ~9 mi; 3 turbines ×3,500 cfs; seepage min flow 60–90 cfs; upper 5 mi dewatered between pulses.
  - Temperature: first 16 mi <18°C during generation; "remaining 5 to 10 miles can typically support trout provided generation is sufficient"; lethal limits brown 21°C, rainbow 25°C. DO deficits Sep–Nov (historically <2 ppm at dam; recovery up to 16 mi downstream).
  - Stocking history: TWRA/USFWS trout "annually...since the 1950's" (Parsons & Crossman 1956 cited elsewhere); 1990–2002 avg ~115,000 9-inch rainbows/yr, stocked 3,000–15,000/month; browns 17,000–70,000/yr; fall fingerling brown strategy since 1999 (per Devlin & Bettoli 1999).
  - Explicit stocking window statement: "Each year TWRA will stock 114,000 9-inch rainbow trout between March and December." Browns: "Most... stocked at 3-4 inches the fall and the remainder... in the spring" (6–8"). DO constraints Aug–Nov force downstream/cancelled events.
  - Holdover/reproduction: "Natural reproduction of trout in the Caney Fork River has been extremely rare, therefore stocking maintains the trout fisheries." TWRA winter electrofishing ANNUALLY in February (12 fixed sites, dam→Stonewall, night, Jan 20–Mar 10 window; protocol by TTU) — i.e., trout are present and sampled every winter; rainbows 8–16"; browns to 14+"; over-winter survival 1997 cohort: rainbows 2–8%, browns 17%; 1995 cohort 55–71% of rainbows harvested by fall.
  - Creel: 1995 (Bettoli & Xenakis 1996) and 1997 (Devlin & Bettoli 1999): ~21,000 trips/yr; catch 0.93 RB/hr + 0.17 BN/hr; harvest 0.59 trout/hr (2nd highest in state).
  - Growth: ~0.5 in/mo peaks; 8-inch browns reaching 19" in two years; tagged 9" rainbow recaptured at 24" after four years. Density 41–74 kg/ha (TTU 1996–97).
  - Regulation history: effective March 1, 2004 — brown trout 18-inch min, 2/day (rainbows unchanged 7/day). Earlier early-1990s "quality management zone" (artificials-only, Betty's Island area) proposed then abandoned after local opposition.
- Source type: agency management plan. Confidence: high. Establishes: Mar–Dec rainbow program in 2004–09; fall/spring brown strategy; no natural reproduction; annual February trout presence; regulation chronology.

### D2. Trout Management Plan for Tennessee 2017–2027 (Habera ed., TWRA Fisheries Report 17-10, Oct 2017)
- URL (Wayback 20200930133205 / 20211230204845): https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Tennessee-Trout-Management-Plan-2017-2027.pdf
- Center Hill tailwater content: among "heavily-fished" tailwaters 20,000–25,000 trips/yr; PLR 14–20" on Rainbow and Brook; "More restrictive regulations for Brown Trout in the Center Hill (24-inch minimum, limit of one)... recently established"; Brook Trout stocked into "Norris, Apalachia, Center Hill, Dale Hollow, and Tims Ford" tailwaters (up to 80,000/yr statewide); ~1 million trout/yr into tailwaters with Dale Hollow NFH; natural reproduction significant only South Holston/Wilbur (no Center Hill); "Operational improvements at Center Hill Dam by the USACE have also greatly improved water quality in the Caney Fork."
- Source type: agency plan. Confidence: high.

### D3. Trout Management Plan (2006) — Trout_Plan_06.pdf (TWRA, 2006)
- URL (Wayback 20060608172722): http://www.tn.gov/twra/fish/StreamRiver/Trout_Plan_06.pdf
- Center Hill: 18-inch brown min/2-fish limit "recently established" (2004); heavy use 20–25k trips; no mention of Center Hill natural reproduction (reproduction documented only SoHo/Wilbur/Norris); top-3 tailwater by economic value with Center Hill first (Williams & Bettoli 2003: $1.8M total value, net $64/trip; $8.8M statewide 2001).

### D4. Devlin, G.J. III & P.W. Bettoli. 1999. "Seasonal Fluctuations in Growth and Condition of Trout in a Southeastern Tailwater." Proc. SEAFWA 53:100–109.
- URL: https://seafwa.org/sites/default/files/journal-articles/DEVLIN-100-109.pdf (retrieved 2026-09-25)
- Caney Fork below Center Hill Dam; 1-year study 1997. Stocking scale: "annually stocking about 106,000 catchable (>200 mm) rainbow trout and 17,500 catchable brown trout... about 920 trout per hectare per year." "TWRA has stocked rainbow trout... into the Caney Fork River below Center Hill Dam since the early 1950s (Parsons and Crossman 1956)." 1997 angling effort 65,991 hours March–October.
- Winter evidence (direct): "Brown trout grew slower in summer and fall (8 mm and 10 g/month)... and faster (17 mm and 61 g/month) in winter." Rainbow stocked in summer lost 14% weight by fall; condition improved in late fall with DO improvement. → Trout not only present but growing fastest in winter.
- Also cites: Bettoli & Xenakis 1996 (fall 1995 DO frequently below lethal 2.5 mg/L).
- Companion citation (via ResearchGate snippets): Devlin & Bettoli 1999, "Creel survey and population dynamics of salmonids stocked into the Caney Fork River below Center Hill Dam," TWRA Fisheries Report 99-8.

### D5. "Movements and Mortality of Rainbow Trout Stocked into the Lower Caney Fork River" — TTU/TN Cooperative Fishery Research Unit, Fisheries Report 16-10, August 2016, submitted to TWRA.
- Found via search; full text only on ResearchGate (publication/337874886) which returns HTTP 403 to automated fetch. NOT fully reviewed — logged as a lead with exact citation. Subject (title): stocked rainbow survival/movement in the LOWER river, 2016-era.

### D6. State record (TWRA official records page)
- URL: https://www.tn.gov/twra/fishing/awards-fish-records-photos.html (retrieved 2026-09-25)
- "Brook 4 lbs., 12 oz. — Caney Fork River — Saŝa Krezić — April 1, 2016" (Tennessee state record brook trout, caught in the Caney Fork tailwater). Brown record = Clinch River 28-12 (1988); Rainbow record = Polk Co pond.
- Establishes: trophy-holdover capability (a >4-lb brook implies a stocked adult that held over and grew; brooks are stocked as adults here).

### D7. Regulation chronology (compiled from D1, B5, and Little River Outfitters article)
- https://littleriveroutfitters.com/littleriverjournal/nov09/twra/index.htm (Nov 2009): TWRC Fisheries Committee Oct 29, 2009 → adopted: 14–20" slot rainbow/brook, brown protected to 24", creel 7→5; effective March 2010. Bill Reeves quote: "one of the few places in the United States that will produce that size fish and a lot of them."
- Effective March 1, 2004: brown 18" min / 2-day (D1).
- 2026: 5 creel; RB/BK 14–20 PLR (1>20"); BN 24" min, 1/day (B5).

### D8. Habitat/water-quality program context
- USACE Center Hill Water Control Manual update (2024): Alternative 23 selected; new seasonal minimum continuous flow 250 cfs for the Caney Fork ecosystem (USACE news release https://www.lrd.usace.army.mil/News/News-Releases/Display/Article/3753884/); orifice gate reinstalled June 2024 to improve downstream DO/temperature. (The 2003 plan's VES/weir proposal was superseded by these operational changes.)
- Lake sturgeon reintroduction (TWRA/USFWS/USACE since 2000, Caney Fork a primary site; USACE Sustainable Rivers project for sturgeon spawning habitat) — context: the tailwater is an active multi-species coldwater-release program; not trout evidence per se.

---

## E. Occurrence databases (coordinates-checked to tailwater)

### E1. USGS NAS (rainbow trout, state=TN; 3,158 records)
- API: https://nas.er.usgs.gov/api/v2/occurrence/search?speciesID=2640&state=TN
- Near-tailwater (35.9–36.35N, -86.1 to -85.7W): 85 records, incl. "Caney Fork River system in DeKalb County" (1989, collected; 36.0952, -85.8252), "Center Hill Reservoir tailwaters" (1993, locally established; 36.0999, -85.8306), MARIS "stocked" cells 2000/2001/2007/2008 at 36.1,-85.83 / 36.13,-85.8 / 36.18,-85.9 (tailwater corridor).

### E2. iNaturalist (bbox 36.05–36.25N, -85.95 to -85.70W)
- Oncorhynchus mykiss: 8 observations 2013–2025 (months 03, 06, 07, 08, 09; sites Lancaster/Silver Point/Elmwood = tailwater reaches).
- Salmo trutta: 5 observations 2013–2025 (months 04, 06, 07).
- Single catches = leads only; no winter-month records (sparse sampling).

### E3. USGS gauge 03424500 "CANEY F BL CEN HILL DAM NR LANCASTER TENN"
- https://waterservices.usgs.gov/nwis/site/?format=rdb&sites=03424500 — 36.1045041, -85.8458186, drainage 2,183 sq mi. Gauge exists at the head of the tailwater (DeKalb/Smith line); no recent daily temperature record served (00010 unavailable via DV) — gauge lane only confirms reach identity/flows.

---

## F. Months-by-year verdict table — Caney Fork / Center Hill TW stocking program

| Year | Source (type) | Planned stocking months | Species (planned) | Winter (J/F) stocked? |
|------|---------------|-------------------------|-------------------|-----------------------|
| 2001–02 | tailtrout page capture 2002 (planned) | Mar–Dec | RB, BN | No |
| 2004–2009 | Center Hill plan (Dec 2003) (plan) | Mar–Dec (rainbows "between March and December"); browns fall + spring | RB, BN | No (Feb none; Jan none stated) |
| 2006 | tailtrout page 2006 (planned) | Mar–Dec | RB, BN | No |
| 2008–2014 | tailtrout pages 2008/2010/2012/2014 (planned) | Mar–Dec | RB, BN, BK (brook by 2008) | No |
| 2018 | Tailwater-Stocking-Schedule.pdf (planned) | Mar–January | RB, BN, BK | Jan YES (planned); Feb no |
| 2020 | same PDF, Jan 2020 capture (planned) | Mar–January | RB, BN, BK | Jan YES (planned); Feb no |
| 2022–2025 | same PDF series (md5-verified static May 2022→Sep 2025) (planned) | Mar–Aug + Nov–Dec | RB, BN, BK | No (Sep–Oct gap instead) |
| 2026 | schedule JSON + live page + ArcGIS + StoryMap (planned) | Mar–Dec (JSON "M,A,M,J,J,A,S,O,N,D") | RB, BN (JSON); + BK (+CT listed on live page) | No |
| Current ArcGIS layer | Tailwater_Trout (planned) | "March through December" | RB, BN, BK | No |

Completed releases observed (destination-level): 2021: …,11/03 (last); 2022: 05/13, 08/04, 11/09; 2023: 04/20, 08/11; 2024: 05/03, 05/30, 08/13; 2026: 09/11. ZERO completed releases observed in Dec, Jan, or Feb. Contrast: Obey/Dale Hollow TW completed 12/10/2021, 02/11/2022 (Jan–Dec program); Normandy TW 01/25/2022.

Winter trout presence (not stocking): TWRA February electrofishing (annual, 12 fixed sites, documented for 1997–2003 in D1; program described as ongoing in 2017 plan); browns grow fastest in winter (D4); StoryMap: "water is cold enough to support trout year round... Many fish will hold over to the next year" (B4).

---

## G. Contradictions and gaps

1. Mapped window (Mar–Dec) vs 2018–2020 published window (Mar–January): the 2018/2020 TWRA tailwater PDFs planned January stocking. If read literally, the water supported an 11-month stocked window then; no completed January release has been found in any completed-release record (feeds only reach back to ~2021 windows, so 2018–2020 January execution is unverifiable). 
2. 2022–2025 published window (Mar–Aug + Nov–Dec) vs mapped Mar–Dec: the 2022–2025 PDF omitted September–October, while 2026 and the ArcGIS layer include them. The mapped Mar–Dec matches the 2026/current published program; the Sep–Oct gap years are past-PDF state (possibly an editorialization of the DO-constrained period; completed releases show 08/04-08/13 events and a 09/11/2026 event bridging the "gap" in practice).
3. TWRA's own StoryMap says stocks "throughout the year" and labels the fishery "year-round fishing," while its own schedule line and JSON say Mar–Dec. TWRA applies "(year-round fishing)" labels even to tailwaters stocked only Mar–Sep (e.g., Wilbur, Clinch), so the label is an angling statement, not a stocking statement.
4. Species lists disagree across current sources: JSON "Rainbow, Brown"; ArcGIS "rainbow, brown, brook"; live page "Rainbow, Brook, Brown, Cutthroat." Brook is well established (2008 onward; state record). Cutthroat appearance in 2026 page text is new/unverified elsewhere.
5. Owner's dataset: stocking sites show Region 2 (Betty's Island, Gordonsville) and Region 3 (Happy Hollow, Long Branch, Buffalo Valley) co-ownership — no contradiction, just program complexity.
6. Recent Caney-specific electrofishing results are NOT published in the 2026 StoryMap (other tailwaters have 2025/26 reports) — the record holder for recent abundance data would be TWRA Region 2/3 fisheries biologists' internal February survey summaries (not online).
7. "Caney Fork delayed harvest Nov 1–Feb" claim seen in one AI-aggregated search result is FALSE for the Caney (official reg page + ArcGIS DelayedHarvestSeason=No/None; DH waters are Tellico, Hiwassee, Paint, Piney, Gatlinburg). Discarded.
8. FR 16-10 full text unobtainable (ResearchGate 403) — citation verified via two independent search snippets.

---

## H. Searches run (18 distinct queries; ≥20 attempts incl. rate-limit retries)

Productive:
1. Caney Fork River Center Hill Dam tailwater trout stocking schedule months
2. Bettoli Caney Fork trout creel survey 1995 1997 Tennessee Tech
3. Devlin Bettoli 1999 Caney Fork River trout Regulated Rivers
4. "Movements and Mortality of Rainbow Trout Stocked into the Lower Caney Fork River"
5. TWRA "Fisheries Report" Caney Fork rainbow trout 2016 movements mortality Center Hill
6. Caney Fork River brown trout 24 inch minimum regulation trophy 2010 TWRA
7. Bettoli Xenakis 1996 rainbow trout fishery Caney Fork Center Hill report
8. Caney Fork River winter fly fishing January February trout holdover generation schedule
9. Tennessee state record brown trout Caney Fork River
10. Dale Hollow National Fish Hatchery trout distribution Center Hill tailwater annual report
11. Caney Fork River 303d TDEC impaired trout stream DeKalb County
12. TWRA Caney Fork trout electrofishing February survey results CPUE brown trout 2015 2020
13. Center Hill Dam minimum flow weir bypass VES Caney Fork dissolved oxygen improvement project
14. "Parsons" "Crossman" 1956 trout stocking Caney Fork Tennessee early 1950s rainbow
15. Tennessee Comptroller Caney Fork watershed trout fishery guide trophy brown — UNPRODUCTIVE (only audit results; the watershed-health-guide mention could not be located)
16. "Caney Fork" OR "Center Hill" tailwater trout stocking totals 2022 2023 2024 rainbow brown brook numbers TWRA (partial: no annual totals by species; led to StoryMap/CanoeTheCaney figures)
17. "Caney Fork" delayed harvest trout Tennessee — yielded a FALSE DH claim (discarded after verification) plus official regs confirmation
18. "Center Hill" OR "Caney Fork" tailwater lake sturgeon reintroduction Tennessee stocking (context only)

Unproductive/rate-limited attempts: multiple 429 rate-limit failures across queries 2, 5, 6, 12–16 (retried with rephrasing until success); DuckDuckGo HTML/Bing scrapes returned no parseable results for FR 16-10 PDF; direct tn.gov path for FR 16-10 not found in CDX dump of tn.gov/content/dam/tn/twra/documents (39,060 rows, 2020–2026).

---

## I. Recommendation

**Recommendation: TROUT — keep the tailwater trout classification, and the year-round label SURVIVES, but only through the holdover branch of the year-round standard, not through documented continuous winter stocking.**

Reasoning:
1. This is unambiguously a stocked tailwater trout water: TWRA/USFWS releases since the early 1950s; current plan Mar–Dec, ~106k–115k catchable rainbows/yr + 17.5k–70k browns + adult brooks (and possibly cutthroat in 2026); three rainbow/brown/brook species on the current ArcGIS row; special trophy-style regulations river-wide.
2. Continuous stocking across ALL seasons is NOT documented. Every year's plan from 2001 to 2026 shows Mar–Dec (10 months) except 2018–2020 ("March through January") and 2022–2025 (Mar–Aug + Nov–Dec). No completed release in Dec/Jan/Feb appears in any completed-release record (2021–2026 coverage). The Obey River, 60 mi away, is the true Jan–Dec stocked year-round tailwater — the Caney is not that.
3. Holdover evidence is strong and agency-attested: TWRA's own current publication states the water "is cold enough to support trout year round," that "many fish will hold over to the next year," supporting "a good population of large Brown Trout"; winter electrofishing (every February, 1997–2003 documented, program continuing) finds trout every winter; brown trout GROW fastest in winter in this river (Devlin & Bettoli 1999); over-winter survival is modest (2–8% rainbows, 17% browns in 1997) but real; the state-record brook trout (4-12, 2016) came from this reach. Natural reproduction is absent, so abundance winters depend entirely on holdover — which TWRA affirms.
4. Under the owner's rule (continuous stocking alone defines year-round; holdover absence never downgrades), the stocking record alone would read "seasonal-stocked Mar–Dec" (not year-round). However the applicable standard for year-round is "continuous stocking OR holdover/reproduction evidence," and the holdover branch is satisfied with primary-source strength. The Mar–Dec mapped window is consistent with every current TWRA planning source and needs no repair; the 2018–2020 "through January" text and TWRA's informal "year-round fishing" phrasing are the only tensions, both flagged above.
5. NOT warmwater-focus: the sibling caney-fork-upper row is the warmwater water; this reach's coldwater identity is decisive. NOT unresolved: evidence is deep, dated, and agency-sourced.

Key gap: no agency record of an actual January–February trout release into the Center Hill TW in any year (the single item that would prove continuous winter stocking), and no online 2010s/2020s February electrofishing summary for this tailwater — those would sit with TWRA Region 2/3 fisheries files (and FR 16-10 full text for lower-river winter movements).
