# Doe Creek (Johnson County, TN) — Evidence Repair Research Log

Water: Doe Creek, Johnson County, TN — large spring-fed tributary of Watauga Reservoir (Watauga River watershed), flowing through the Doe Valley community NE of Mountain City (SR-67/US-421 corridor), roughly 36.383–36.449 N, −81.958 to −81.899 W.
Ledger verdict under test: seasonal-stocked with catalog months **[12,1,2] (Dec–Feb)** — SUSPECT (contradicts Region 4 pattern).
2024 archive completion under test: **"Doe Creek 06/04/2024"** (June, outside Dec–Feb).
Research date: 2026-09-25 (all retrievals this date unless noted). Research ONLY; no agencies/businesses contacted.

---

## 1. Water identity / disambiguation (CLOSED — distinct from Doe River)

- **NOT Doe River (Carter County).** Both appear as separate Region 4 rows in TWRA's own datasets. The June-2024 completed feed lists "Doe Creek 06/04/2024" and "Doe River 05/28/2024" as distinct destinations; the 2026 schedule grid lists "Doe Creek" under Johnson and "Doe River" under Carter; the R4 2018 report has separate accounts (2.3 Doe Creek / 2.4 Doe River).
- **TWRA 2026 stocking schedule JSON** (live, tn.gov): the single "Doe Creek" location row set is **REGION "4", COUNTY "Johnson"** — 7 rows, TYPE **"Seasonal"**, SPECIES "Rainbow Trout", weeks 3/8, 3/22, 4/5, 4/19, 5/3, 5/17, 5/31/2026. STOCKING MONTHS field empty (planned weekly rows carry the season). No other Doe Creek anywhere in the 616-row dataset.
  - URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json (retrieved via browser-context fetch; tn.gov blocks plain curl)
- **TWRA ArcGIS "TWRA_Trout_Stocking_Locations"** (live REST query, all 730 features): 11 Doe Creek sites, all **County=JOHNSON, City=Doe Valley, StockingProgram="Spring", Species=rainbow, DelayedHarvestSeason=None**, ~20–30 fish/site (~220–230 per event):
  - S1 Doe Cr Fishing Access Area (36.38314, −81.95808, 30 RB, USFS); S2 Richard Lacy Rd (36.38372, −81.96136, 20, private); S3 Br below Little Doe Baptist Ch (36.38615, −81.96627, 20, private); S5 Doeville Rd Mailbox #330 (36.38939, −81.96833, 20, private); S6 Old Hwy 67 Bridge (36.39992, −81.96792, 20, private); S7 Old Hwy 67 Barn (36.40786, −81.96250, 20, private); S8 Gravel Rd (36.41267, −81.95847, 20, private); S10 Timothy Branch Rd 3-Ton Bridge (36.41892, −81.95122, 20, private); S11 Old Stage Rd (36.42344, −81.94539, 20, private); S15 Lunceford Ln (36.44086, −81.90714, 20, private); S16 Bethany Baptist Church Bridge (36.44919, −81.89922, 20, private).
  - Program distribution over all 730 sites: Spring 597, Winter 54, Tailwater 60, Reservoir 19. Johnson County's only Winter-program site is Ralph Stout Park pond — **no Doe Creek Winter sites**.
  - URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=json
- **TWRA GIS access sheet "Doe Creek"** (Wayback 2011-04-11 capture of tn.gov/twra/gis/troutpdf/DoeCreek.pdf; earlier 2006 edition Doe_Creek.pdf): "Doe Creek Stocked Trout Program" map — stocked reach along SR-67 through Doe Valley from the Steel Creek/Old Stage area down toward Watauga Lake; legend categories "Trout Stream or Lake … Stocking Site" (not "Winter Trout Stream or Lake").
- **Reach description (agency)**: "Doe Creek is a large spring-fed tributary to Watauga Reservoir in Johnson County. It flows through privately-owned land…" (R4 2018 report); long-term monitoring station on Hwy 67 at 36.42709 N, −81.93725 W, elev 2,210 ft, ending at the old dam below Lowe Spring (important cold-water source; Mountain City withdrew 0.5 MGD from the spring since 2002). 2003 creel: highest trout catch/harvest among five Region IV streams studied (Habera et al. 2004).

## 2. Month-by-month planned stocking record, 2003–2026 (primary evidence)

Method: Wayback PDF captures parsed **geometrically** (pymupdf word coordinates, rotation handled; header day-tokens solved as consecutive Sundays against the grid year — every mark in the tables below resolves to a valid Sunday). Schedules state: "The dates listed are all Sundays. The stocking event will happen within five days after the date listed." Johnson County rows carry the county label directly in the grid ("Johnson Doe Creek"); Van Buren's separate "Laurel Creek" and Carter's "Laurel Fork"/"Doe River" rows were excluded by county.

| Year | Schedule source (Wayback capture) | Doe Creek stocking weeks (week-of Sundays) | Months supported |
|---|---|---|---|
| 2003 | sched03.pdf, 20030404161556 | Feb 23, Mar 9, 23, Apr 6, 20, May 4, 18, Jun 1, 15 (9, biweekly) | **Feb, Mar, Apr, May, Jun** |
| 2004 | sched04.pdf, 20040210011352 | Feb 22, Mar 7, 21, Apr 4, 18, May 2, 16, 30, Jun 13 (9) | **Feb, Mar, Apr, May, Jun** |
| 2005 | sched05.pdf, 20051124124935 | Feb 20, Mar 6, 20, Apr 3, 17, May 1, 15, 29, Jun 12 (9) | **Feb, Mar, Apr, May, Jun** |
| 2006 (early ed.) | sched06.pdf, 20060604223344 | Mar 5, 19, Apr 2, 16, 30, May 14, 28, Jun 11, 25 (9) | **Mar, Apr, May, Jun** |
| 2006 (revised ed.) | eRegulations mirror Trout_Stocking.pdf (solves to 2006; revised dates) | Mar 12, 26, Apr 9, 23, May 7, 21, Jun 4, 18 (8) | **Mar, Apr, May, Jun** |
| 2007 | sched07.pdf, 20070227143540 | Mar 4, 18, Apr 1, 15, 29, May 13, 27, Jun 10, 24 (9) | **Mar, Apr, May, Jun** |
| 2008 | sched08.pdf, 20080909205030 | Mar 2, 16, 30, Apr 13, 27, May 11, 25, Jun 8, 22 (9) | **Mar, Apr, May, Jun** |
| 2009 | sched09.pdf, 20090418095714 | Mar 8, 22, Apr 5, 19, May 3, 17, 31, Jun 14, 28 (9) | **Mar, Apr, May, Jun** |
| 2010 | sched10.pdf, 20100326100325 | Mar 7, 21, Apr 4, 18, May 2, 16, 30, Jun 13, 27 (9) | **Mar, Apr, May, Jun** |
| 2011 | sched11.pdf, 20110111175732 | Mar 6, 20, Apr 3, 17, May 1, 15, 29, Jun 12, 26 (9) | **Mar, Apr, May, Jun** |
| 2012 | sched12.pdf, 20120418154111 | Mar 4, 18, Apr 1, 15, 29, May 13, 27, Jun 10, 24 (9) | **Mar, Apr, May, Jun** |
| 2013 | sched13.pdf, 20140112202401 | Mar 3, 17, 31, Apr 14, 28, May 12, 26, Jun 9, 23 (9) | **Mar, Apr, May, Jun** |
| 2014 | sched14.pdf, 20140412202632 | Mar 9, 23, Apr 6, 20, May 4, 18, Jun 1, 15, 29 (9) | **Mar, Apr, May, Jun** |
| 2015 | sched15.pdf, 20150319003402 | Mar 8, 22, Apr 5, 19, May 3, 17, 31, Jun 14, 28 (9) | **Mar, Apr, May, Jun** |
| 2016–2017 | **NOT FOUND** (no archived grid; same gap as Beaverdam pass) | — covered by agency prose: R4 2017 report describes the current program as "Adult Rainbow Trout are also stocked during March–June (about 2,800/year)" | (Mar–Jun per agency) |
| 2018 | 2018-Trout-Stocking-Schedule.pdf, 20180717180317 | Mar 11, 25, Apr 8, 22, May 6, 20, Jun 3, 17, **Jul 1** (9) | **Mar, Apr, May, Jun** (+Jul 1 week, +5 d = Jul 6) |
| 2019 | 2019-Trout-Stocking-Schedule.pdf, 20190109035923 | Mar 10, 24, Apr 7, 21, May 5, 19, Jun 2, 16 (8) | **Mar, Apr, May, Jun** |
| 2020 | Trout-Stocking-Schedule-Complete.pdf, 20200424033427 | Mar 8, 22, Apr 5, 19, May 3, 17, 31, Jun 14 (8) | **Mar, Apr, May, Jun** |
| 2021 | Complete.pdf, 20210119123626 (revision 20210820 identical rows; distinct digests) | Mar 14, 28, Apr 11, 25, May 9, 23, Jun 6, 20 (8) | **Mar, Apr, May, Jun** |
| 2022 | Complete.pdf, 20220221215138 (revision 20220519194927 identical rows) | Mar 13, 27, Apr 10, 24, May 8, 22, Jun 5, 19 (8) | **Mar, Apr, May, Jun** |
| 2023 | Complete.pdf, 20230219191239 | Mar 12, 26, Apr 9, 23, May 7, 21, Jun 4, 18 (8) | **Mar, Apr, May, Jun** |
| 2024 | Complete.pdf, 20240219225857 | Mar 10, 24, Apr 7, 21, May 5, 19, Jun 2, 16 (8) | **Mar, Apr, May, Jun** |
| 2025 | Complete.pdf, 20250208215445 (revision 20250902003710 identical rows) | Mar 9, 23, Apr 6, 20, May 4, 18, Jun 1 (7) | **Mar, Apr, May, Jun** |
| 2026 | Live exceldriven JSON | 3/8, 3/22, 4/5, 4/19, 5/3, 5/17, 5/31 (7, biweekly; TYPE="Seasonal") | **Mar, Apr, May** (+May 31 week → Jun 5 window) |

- **Zero planned Doe Creek stockings in December, January, or February in any archived schedule 2003–2026.** Latest first-of-season week: Feb 23 (2003); latest season week: Jul 1 (2018 only).
- Same-year Complete.pdf revision pairs (2021 Jan vs Aug; 2022 Feb vs May; 2025 Feb vs Sep; 9 distinct md5s incl. 0e5c3434…, 41e350cc…, 6228d37e…, 9c75adf3…, 3a748e6b…, c3cfa00d…, 321048d5…, 8b67aac0…, d8beba55…) all show the **same Doe Creek rows** — no replay-trap effect on this water.
- Winter/coldwater programs checked and **exclude Doe Creek**: wintertrout.pdf (2013/14), winter-trout-schedule.pdf (2019/20), TWRA-Winter-Trout-Schedule.pdf (2024/25), Coldwater-Trout_Stocking-Schedule.pdf (2022), winter_trout_2018.pdf — all are city ponds + tailwaters (Ralph Stout Park is Johnson's only winter water).

## 3. Completed (destination-level) stocking evidence

- **Coldwater Stocking completion report, "Cold-Water-Stocking.pdf", dated 11-16-2018** (tn.gov/content/dam/tn/twra/documents/Cold-Water-Stocking.pdf): Region 4 completions include **"Doe Creek 7/19/2018"** (summer, after the planned Jul 1 week; also "Forge Creek 7/3/2018", "Laurel Creek 6/25/2018"). **No Doe Creek completion in any Dec–Feb month.**
- **Trout Stocking Report PDF, "updated as of 9/27/2024"** (capture 20240927221436) and **"updated 11/8/2024"** (capture 20241111215005): **no Doe Creek** rows (window covers Aug–Nov 2024 — season already over).
- **June-2024 completed feed JSON** (Wayback capture 20240607134309, digest TQTTIQB25JD3Y7KHHYJS4USO3SVZWWGO, application/json; gzipped body retrieved and decoded in memory 2026-09-25): `{"Region":"4","Destination":"Doe Creek","Stocking Date":" 06/04/2024"}` — the archive row under test. 06/04/2024 (Tue) = within 5 days after planned week-of **Jun 2, 2024** ✓ (2024 grid: Mar 10 … Jun 2, Jun 16). The same feed lists "Doe River 05/28/2024" separately (disambiguation ✓).
- **Trout Stocking Report, updated 3/21/2025** (capture 20250322191030), Region 4 completion table rows: **"Doe Creek | 03/10/2025 | 4"** = Monday after week-of Sun Mar 9, 2025 (first 2025 event) ✓ exactly seasonal spring.
- **Trout Stocking Report, updated 8/29/2025** (capture 20250902003641): **no Doe Creek** (0 matches).
- **Live page 2026-09-25** ("Trout Stocking Locations Report, updated as of 9/21/2026"): summer/fall completions are tailwaters + Buffalo Creek + Gatlinburg streams; **no Doe Creek**.
- (Minor limitation: the 3/24/2025 live-page capture's flattened HTML pairs dates to waters unreliably; the PDF tables above were used as authoritative.)

## 4. Agency program statements

- **Fisheries Report 18-01, Region IV Trout Fisheries Report 2017** (Habera, Petre, Carter, Williams; TWRA; Wayback capture 20220813205505): Doe Creek account — "Adult Rainbow Trout are also stocked during **March–June (about 2,800/year)**"; "The **seasonal hatchery-supported trout fishery** in Doe Creek is popular… management of this stream should feature the outstanding wild trout population… no expansion in scope or scale."
- **Region IV 2010 Trout Fisheries Report** (capture 20110711182552): Doe Creek account — "some large (>500 mm) rainbow trout still enter Doe Creek each winter from the lake. Adult rainbow trout are also stocked during **March–June (about 3,300/year)**…"; monitoring station (Hwy 67, 36.42709/−81.93725) sampled annually since 1993; wild RBT biomass ~100 kg/ha (1993, 1997, 2004–05).
- **R4 2018 report** (capture 20220804000418 family): "34 such streams in Region IV… annually stocking hatchery-produced (adult) Rainbow Trout. Some stocked streams (e.g., Beaverdam Creek, **Doe Creek**, Laurel Fork, and Doe River) do support excellent wild trout populations as well"; 2018 sampling 29 Aug; whirling-disease screening of 60 stream-born fingerlings (July 2018) negative.
- **R4 2020/2021/2023 reports** (cached): "36 streams… annually stocking… adult Rainbow Trout" (program statement); Doe Creek monitored 2020 (10 Sep), 2021 (7 Sep 2021, "population appears to be healthy"); Region IV "year-round trout fisheries" language applies ONLY to TVA tailwaters — never to Doe Creek.
- **Trout Management Plan for Tennessee 2006–2016** (Fiss & Habera, 4/3/2006; capture 20100529052530): Doe Creek listed among streams that "today… provide excellent wild trout fisheries"; water withdrawals affecting Doe Creek flagged as habitat threat.

## 5. Holdover / reproduction

- **Natural reproduction: DOCUMENTED.** Age-0 (≤90 mm) wild Rainbow Trout in annual monitoring samples (e.g., 2018: age-0 present; 2019: 11 age-0, est. pop. 11; 2021: 10–12 age-0); "one of Tennessee's finest populations of wild Rainbow Trout"; historical >100 kg/ha wild biomass. Trophy-era fall-spawning lake run (1954 egg plant) persisted into the 1970s; large >500 mm lake-run rainbows still enter **each winter** — winter trout *presence* (wild/lake-run), **not** winter stocking.
- **Holdover of stocked fish**: no agency statement found (absence noted); the "best fishing… until midsummer when water temperatures exceed 70 °F" framing in TWRA's Stocked Trout Water designation (below) implies marginal summer survival, as on other Region 4 creeks.

## 6. Category/TYPE framing (agency definition)

- **TWRA "Stocked Trout Water Designations"** (gis/troutmap, 2011 capture 20110411173855): "TWRA stocks rainbow trout into streams and small lakes **starting in the spring of each year**. Although fishing may be allowed year-round… the best fishing is from the first stocking until midsummer when water temperatures exceed 70 °F." Doe Creek's GIS sheet places it in exactly this category ("Trout Stream or Lake" + "Stocking Site"), **not** the "Winter Trout Stream or Lake" category.

## 7. Species & type

- Species: catchable **Rainbow Trout** only (2026 JSON SPECIES; ArcGIS Species=rainbow; agency accounts ~2,800–3,300/yr adult RBT). Wild residents: Rainbow Trout (excellent), occasional Brown Trout (2019 sample), Brook Trout in tributaries (e.g., Campbell Hollow area samples).
- Type: **Seasonal (spring program, put-and-take over a wild fishery)**. Confidence: **HIGH** (21/23 years of planned grids read geometrically + 2026 JSON + 5 completed-feed/report windows + 5 agency program statements + ArcGIS program flags).

## 8. Contradictions found

1. Catalog months **[12,1,2] vs. every primary source**: 23 years of planned grids, the 2026 dataset, ArcGIS Spring program flags, winter-program exclusions, and all completion evidence (Mar–Jul) — **no Dec–Feb stocking exists for Doe Creek**. The June-2024 archive completion (06/04/2024) itself falsifies a Dec–Feb window.
2. "Year-round fishing allowed" (statewide regs) ≠ year-round stocking — TWRA's own designation text warns against this conflation.
3. Winter trout presence (lake-run adults entering from Watauga Reservoir) could be misread as a winter fishery; agency text attributes it to wild/lake-run fish, not stocking.
4. 2018 has one planned early-July week (Jul 1) — the only month beyond Mar–Jun in 23 years.
5. 2016–2017 planned grids not archived; covered by the R4 2017 report's then-current Mar–Jun program statement (residual gap, same as Beaverdam pass).

## 9. Searches run (distinct queries; ⚠ = unproductive/rate-limited)

1. WebSearch: "Doe Creek" Johnson County Tennessee trout stocking TWRA ⚠ (429)
2. WebSearch: Doe Creek Doe Valley Tennessee rainbow trout fishing ⚠ (429)
3. WebSearch: Doe Creek Johnson County Tennessee trout fishing — Doe River conflation dominant; tndeer.com forum; piscamaps/onWater listings (thin footprint — itself a finding)
4. WebSearch: "Doe Creek" Tennessee "Rainbow Trout" Watauga Reservoir tributary spring-fed ⚠ (429)
5. WebSearch: "Doe Creek" Tennessee trout "Doe Valley" OR "Mountain City" fishing ⚠ (429)
6. WebSearch: "Doe Creek" Tennessee trout forum watauga "Johnson Co" OR "Doe Valley" stocking rainbow — surfaced mywaterlevel.com 2026 schedule mirror, Fort Campbell mirror of 2024 TN Fishing Guide ("Doe Creek, Old Cabin Private Road downstream to Roan"), TWRA Trout Mgmt Plan 2017–2027
7. WebSearch: Fishbrain "Doe Creek" Johnson County Tennessee rainbow trout fishing reports — no direct page indexed ⚠ (384-catch datum surfaced via Forge Creek page)
8. WebSearch: Habera 2003 creel survey five streams (joint Doe/Laurel; ResearchGate R4-2020 surfaced) ⚠ partial
9. WebSearch: "Doe Creek" Tennessee trout fishing access "Hwy 67" OR "Old Cabin" Roan ⚠ (429)
10. WebFetch (mirror search): Bing/DDG quoted-phrase queries for Doe Creek ⚠ (engine stripped quotes / bot challenge)
11. Opened: mywaterlevel.com/stocking/tennessee/ (2026 planned data mirror — Beaverdam weeks match live JSON exactly; Doe/Forge/Laurel below truncation point)
12. Opened: live tn.gov trout page (9/21/2026 report) — no Doe Creek completions
13. Wayback CDX queries: sched03–15 + 2018/2019/Complete.pdf + tn.gov troutpdf folder + June-2024 feed (multiple probes; 2016/2017 grids empty ⚠)

## 10. Recommendation

**KILL [12,1,2] — reclassify Doe Creek as seasonal, stocked March–June.**

- Pin months **[3,4,5,6]**. Biweekly (~8–9 events/yr) Mar–Jun across 2003–2026; documented **late-February first weeks in 2003–2005** (Feb 20/22/23) and a single early-July tail week in 2018 (Jul 1) — edge weeks, not a season extension. If the project's month field must capture every planned-event month ever observed, the outer envelope is [2,3,4,5,6] (+Jul 2018 once); the accurate seasonal summary is **March–June**.
- Species: Rainbow Trout (catchable, ~2,800–3,300/yr per agency accounts; ~220–230/event across 11 sites currently). Add wild-trout component note: documented natural reproduction (age-0 RBT, monitored since 1993) + winter lake-run adults — wild presence, not year-round stocking.
- Completed "Doe Creek 06/04/2024" is consistent (week-of Jun 2 + 2 days) — keep as destination-level spring evidence.
- Confidence: planned-schedule evidence HIGH (21 of 23 years primary grids); completed evidence HIGH (4 independent windows); agency program statements HIGH (Mar–Jun named in 2010/2017/2018 reports).
