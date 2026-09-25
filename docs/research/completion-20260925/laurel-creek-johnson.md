# Laurel Creek (Johnson County, TN) — Evidence Repair Research Log

Water: Laurel Creek, Johnson County, TN — rises at Laurel Bloomery (NE Johnson County, near the VA line), flows north through the Iron Mountain / CNF (Jefferson NF) section along Hwy 91/Hawkins Rd, crosses into Washington County VA and joins Beaverdam Creek at Damascus VA (S.F. Holston drainage). Sites 36.556–36.611 N, −81.770 to −81.751 W.
Ledger verdict under test: seasonal-stocked with catalog months **[12,1,2] (Dec–Feb)** — SUSPECT (contradicts Region 4 pattern).
2024 archive completion under test: **"Laurel Creek 05/30/2024"** (May, outside Dec–Feb).
Research date: 2026-09-25 (all retrievals this date unless noted). Research ONLY; no agencies/businesses contacted.

---

## 1. Water identity / disambiguation (SAME-NAME RISK CLOSED)

Four "Laurel" waters collide in TN trout contexts. Resolution:
- **Laurel Fork, CARTER County** — separate water, separate ledger entry (already done; laurel-fork-carter.md). TWRA treats it as a distinct destination: in the 2024 completed feed both "Laurel Creek 05/30/2024" and "Laurel Fork 05/28/2024" appear as separate Region 4 rows; in the 3/21/2025 completion report both appear ("Laurel Creek 03/17/2025 | 4 | Laurel Fork 03/17/2025"); in the schedule grids "Carter Laurel Fork" is a different row from "Johnson Laurel Creek".
- **Laurel Creek, VAN BUREN County** (Bone Cave Rd) — Region 3, own grid row ("VanBuren Laurel Creek", 3 events/yr Mar–May) — excluded by county in all parses; never confused in feeds.
- **Laurel Fork, CAMPBELL County** — separate ArcGIS row (Spring program).
- **TARGET: Laurel Creek, JOHNSON County** — the only "Laurel Creek" with REGION 4/Johnson in the 2026 dataset.
- **TWRA 2026 stocking schedule JSON** (live): "Laurel Creek" rows are **REGION "4", COUNTY "Johnson"** — 5 rows, TYPE **"Seasonal"**, SPECIES "Rainbow Trout", weeks 3/1, 3/29, 4/26, 5/24, 6/21/2026.
  - URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json (browser-context fetch)
- **TWRA ArcGIS layer** (730 features): 12 Laurel Creek sites, all **County=JOHNSON, City=Laurel Bloomery, StockingProgram="Spring", Species=rainbow, DH=None**, 20 RB each (~240/event): S1 Above Jefferson Nat Forest Sign (36.61114, −81.75375, USFS); S2 Site#2 (36.60839, −81.75339, USFS); S3 Site#3 (36.60139, −81.75067, USFS); S4 Site#4 (36.59596, −81.75472, USFS); S5 Site#5 (36.59420, −81.75339, USFS); S6 Robert Roark Rd (36.59242, −81.75480, county); S7 Wooden Bridge (36.58995, −81.75511); S8 Site#8 (36.58733, −81.75335); S9 Mailbox #8485 (36.58210, −81.75238); S10 Waters Rd Bridge (36.57688, −81.75731); S11 Site#11 (36.56492, −81.76087); S12 Laurel Cr Sign (36.55636, −81.76967). **No Winter-program sites.**
  - URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=json
- **Geography (agency)**: R4 2010 report — "Laurel Creek is located in Johnson County, just across the Iron Mountains from Beaverdam Creek. It flows northeast into Virginia where it is joined by Beaverdam Creek (in Damascus) and becomes a major tributary to the South Fork Holston River. The 3.1-km segment from the state line upstream lies within the CNF." Monitoring site 36.60163/−81.75058 (2022) and 36.58580/−81.75177 (2019), S.F. Holston watershed. Gentry Creek is "a tributary of Laurel Creek in Johnson County" (R4 2018). Third-party corroboration: Abingdon Outdoors (4/20/2012) and Perfect Fly Store both describe Laurel Bloomery → Damascus via SR-91.
- **GIS access sheet "Beaverdam Creek (lower) and Laurel Creek (Johnson Co)"** (Wayback 20110411174202): "Beaverdam Creek (downstream section) and Laurel Creek — Stocked Trout Program", stocking sites marked along the creek from the CNF section downstream toward the state line; standard "Trout Stream or Lake" legend (not winter).

## 2. Month-by-month planned stocking record, 2003–2026 (primary evidence)

Method: identical geometric parse (pymupdf; header day-tokens solved as consecutive Sundays; every mark below is a valid Sunday; "within five days after" rule). "Johnson Laurel Creek" rows only (Van Buren row and Carter Laurel Fork excluded).

| Year | Schedule source (Wayback capture) | Laurel Creek stocking weeks (week-of Sundays) | Months supported |
|---|---|---|---|
| 2003 | sched03.pdf, 20030404161556 | Mar 2, 16, 30, Apr 13, 27, May 11, 25, Jun 8, 22 (9, biweekly) | **Mar, Apr, May, Jun** |
| 2004 | sched04.pdf, 20040210011352 | **Feb 29**, Mar 14, 28, Apr 11, 25, May 9, 23, Jun 6, 20 (9) | **Feb, Mar, Apr, May, Jun** |
| 2005 | sched05.pdf, 20051124124935 | **Feb 27**, Mar 13, 27, Apr 10, 24, May 8, 22, Jun 5, 19 (9) | **Feb, Mar, Apr, May, Jun** |
| 2006 | sched06.pdf, 20060604223344 | **Feb 26**, Mar 12, 26, Apr 9, 23, May 7, 21, Jun 4, 18 (9) | **Feb, Mar, Apr, May, Jun** |
| 2007 | sched07.pdf, 20070227143540 | **Feb 25**, Mar 11, 25, Apr 8, 22, May 6, 20, Jun 3, 17 (9) | **Feb, Mar, Apr, May, Jun** |
| 2008 | sched08.pdf, 20080909205030 | Mar 9, 23, Apr 6, 20, May 4, 18, Jun 1, 15, 29 (9) | **Mar, Apr, May, Jun** |
| 2009 | sched09.pdf, 20090418095714 | Mar 1, 15, 29, Apr 12, 26, May 10, 24, Jun 7, 21 (9) | **Mar, Apr, May, Jun** |
| 2010 | sched10.pdf, 20100326100325 | **Feb 28**, Mar 14, 28, Apr 11, 25, May 9, 23, Jun 6, 20 (9) | **Feb, Mar, Apr, May, Jun** |
| 2011 | sched11.pdf, 20110111175732 | **Feb 27**, Mar 13, 27, Apr 10, 24, May 8, 22, Jun 5, 19 (9) | **Feb, Mar, Apr, May, Jun** |
| 2012 | sched12.pdf, 20120418154111 | **Feb 26**, Mar 11, 25, Apr 8, 22, May 6, 20, Jun 3, 17 (9) | **Feb, Mar, Apr, May, Jun** |
| 2013 | sched13.pdf, 20140112202401 | **Feb 24**, Mar 10, 24, Apr 7, 21, May 5, 19, Jun 2, 16 (9) | **Feb, Mar, Apr, May, Jun** |
| 2014 | sched14.pdf, 20140412202632 | Mar 2, 16, 30, Apr 13, 27, May 11, 25, Jun 8, 22 (9) | **Mar, Apr, May, Jun** |
| 2015 | sched15.pdf, 20150319003402 | Mar 1, 15, 29, Apr 12, 26, May 10, 24, Jun 7, 21 (9) | **Mar, Apr, May, Jun** |
| 2016–2017 | **NOT FOUND** (no archived grid; same gap as Beaverdam/Doe/Forge passes) | — covered by agency prose (R4 2019 report: "the current level of stocking with catchable-size Rainbow Trout", program ongoing) | (Mar–Jun per program) |
| 2018 | 2018-Trout-Stocking-Schedule.pdf, 20180717180317 | Mar 4, 18, Apr 1, 15, 29, May 13, 27, Jun 10, 24 (9) | **Mar, Apr, May, Jun** |
| 2019 | 2019-Trout-Stocking-Schedule.pdf, 20190109035923 | Mar 3, 17, 31, Apr 14, 28, May 12, 26, Jun 9, 23 (9) | **Mar, Apr, May, Jun** |
| 2020 | Trout-Stocking-Schedule-Complete.pdf, 20200424033427 | Mar 1, 15, 29, Apr 12, 26, May 10, 24, Jun 7, 21 (9) | **Mar, Apr, May, Jun** |
| 2021 | Complete.pdf, 20210119123626 (revision 20210820 identical rows) | Mar 7, 21, Apr 4, 18, May 2, 16, 30, Jun 13, 27 (9) | **Mar, Apr, May, Jun** |
| 2022 | Complete.pdf, 20220221215138 (revision 20220519194927 identical rows) | Mar 6, 20, Apr 3, 17, May 1, 15, 29, Jun 12, 26 (9) | **Mar, Apr, May, Jun** |
| 2023 | Complete.pdf, 20230219191239 | Mar 5, 19, Apr 2, 16, 30, May 14, 28, Jun 11, 25 (9) | **Mar, Apr, May, Jun** |
| 2024 | Complete.pdf, 20240219225857 | Mar 3, 17, 31, Apr 14, 28, May 12, 26, Jun 9, 23 (9) | **Mar, Apr, May, Jun** |
| 2025 | Complete.pdf, 20250208215445 (revision 20250902003710 identical rows) | Mar 2, 16, 30, Apr 13, 27, May 11, 25, Jun 8, 22 (9) | **Mar, Apr, May, Jun** |
| 2026 | Live exceldriven JSON | 3/1, 3/29, 4/26, 5/24, 6/21 (5, ~monthly; TYPE="Seasonal") | **Mar, Apr, May, Jun** |

- **Zero planned Laurel Creek stockings in December or January in any archived schedule 2003–2026.** Latest first-of-season week: Feb 24 (2013); latest season week: Jun 25 (2006).
- Late-February first weeks in **8 of 21 scheduled years** (2004–2007, 2010–2013) — same pattern as Beaverdam Creek (biweekly, one biweekly cycle offset from Doe Creek).
- Same-year revision pairs (2021 Jan/Aug; 2022 Feb/May; 2025 Feb/Sep; distinct md5s) show **identical Laurel Creek rows** — no replay-trap effect.
- Winter/coldwater programs checked and **exclude Laurel Creek**: wintertrout.pdf (2013/14), winter_trout_2018.pdf, winter-trout-schedule.pdf (2019/20), Coldwater-Trout_Stocking-Schedule.pdf (2022), TWRA-Winter-Trout-Schedule.pdf (2024/25).

## 3. Completed (destination-level) stocking evidence

- **"Coldwater Stocking" completion report dated 11-16-2018** (tn.gov/content/dam/tn/twra/documents/Cold-Water-Stocking.pdf): Region 4 completions include **"Laurel Creek 6/25/2018"** (Monday after planned week-of Jun 24, 2018 ✓; "Laurel Fork 6/26/2018" listed separately — disambiguation ✓). **No Dec–Feb Laurel Creek completion.**
- **June-2024 completed feed JSON** (Wayback capture 20240607134309, digest TQTTIQB25JD3Y7KHHYJS4USO3SVZWWGO; gzipped body retrieved/decoded in memory 2026-09-25): `{"Region":"4","Destination":"Laurel Creek","Stocking Date":" 05/30/2024"}` — the archive row under test. 05/30/2024 (Thu) = within 5 days after planned week-of **May 26, 2024** ✓ (2024 grid: Mar 3 … May 26, Jun 9, Jun 23; 8th of 9 events). "Laurel Fork 05/28/2024" listed separately.
- **Trout Stocking Report, updated 3/21/2025** (capture 20250322191030), Region 4 table row: **"Laurel Creek | 03/17/2025 | 4"** (with "Laurel Fork | 03/17/2025" adjacent) = within 5 days after week-of Sun Mar 16, 2025 (2nd 2025 event) ✓ spring.
- **Trout Stocking Report PDFs updated 9/27/2024 (20240927221436), 11/8/2024 (20241111215005), 8/29/2025 (20250902003641)**: **no Laurel Creek** rows (outside season windows).
- **Live page 2026-09-25** (report updated 9/21/2026): **no Laurel Creek** completions.

## 4. Agency program statements

- **Region IV 2010 Trout Fisheries Report** (capture 20110711182552), §2.2.8 Laurel Creek Study Area — the definitive account: "**Management of this stream includes a put-and-take fishery for rainbow trout. About 4,100 catchable rainbow trout are stocked each year during March–June.** Unlike most of Beaverdam Creek, Laurel Creek and its tributaries are subject to general, statewide trout angling regulations (7-fish creel, no bait/size restrictions)." Also: Shields (1950) found it "carried more large trout than Beaverdam Creek despite heavy fishing pressure, but natural reproduction was poor, especially for brown trout"; Bivens & Williams (1990) found "good populations of wild rainbow and brown trout with adequate reproduction"; 1993/1994 quantitative samples excellent (brown trout standing crop >100 kg/ha at the Atchison Branch site); station near Elliot Branch added to long-term monitoring in 2001.
- **R4 2019 report**: "Laurel Creek supports an **excellent wild trout fishery** that is comparable to the one present in nearby Beaverdam Creek. While future management… should maintain and feature wild trout, the current level of stocking with catchable-size Rainbow Trout is not incompatible with wild trout management… but should not be expanded in scope or scale." Site 2 sampled 4 Sep 2019 (36.58580/−81.75177, USFS, 2,280 ft).
- **R4 2023 report (2022 field season)**: Laurel Creek Site 1 sampled 21 Sep 2022 (36.60163/−81.75058); "Trout abundances at Site 1… were lower than for any previous survey year" but with age-0 RBT (41 caught) and age-0 BNT (7) present.
- **R4 2017 report (Fisheries Report 18-01)**: Laurel Creek in the quantitative-sampling inventory (S.F. Holston, Johnson, CNF; samples 1993–94, 01–02, 04, 07, 10, 13, 16; RBT/BNT).
- **TWRA "Stocked Trout Water Designations"** (2011): spring-start seasonal stocking category — the category on Laurel Creek's GIS sheet.

## 5. Holdover / reproduction

- **Natural reproduction: DOCUMENTED.** "Excellent wild trout fishery… comparable to Beaverdam Creek" (R4 2019); wild RBT + BNT with adequate reproduction (Bivens & Williams 1990); >100 kg/ha wild brown biomass (1994); age-0 RBT and BNT in the 2022 sample = continued in-stream recruitment; native Brook Trout in 6 tributaries (5 of native southern-Appalachian heritage — Strange & Habera 1997); Gentry Creek tributary holds wild RBT/BNT with native brook trout headwaters.
- **Holdover**: no agency statement (absence noted). Third-party Perfect Fly Store page claims rainbow and brown "wild and stocked with holdovers" (commercial source, low confidence) — consistent with the cold CNF headwaters but not agency-documented.

## 6. Species & type

- Species: catchable **Rainbow Trout** (~4,100/yr per 2010 account; ~240/event across 12 sites currently); wild residents: Rainbow, Brown (lower creek), Brook (tributaries).
- Type: **Seasonal (biweekly→monthly spring put-and-take over an excellent wild fishery)**. Confidence: **HIGH** (21/23 years planned grids + 2026 JSON + completed evidence + a dedicated agency account naming March–June).

## 7. Contradictions found

1. Catalog months **[12,1,2] vs. all primary evidence**: 23 years of grids, the 2026 dataset, ArcGIS Spring flags, and completions (Jun 2018; May 2024; Mar 2025) — **no Dec/Jan stocking ever**. February first-weeks (8 of 21 years) are the season's leading edge, never a winter program.
2. Same-name risk (Laurel Fork Carter; Van Buren Laurel Creek; Campbell Laurel Fork) — resolved at dataset level; the archive row "Laurel Creek 05/30/2024" is the Johnson County water (Region 4, and TWRA lists Laurel Fork separately in the same feeds).
3. Historic Shields (1950) "natural reproduction was poor" vs modern "excellent wild trout fishery" — a recovery narrative, not a stocking-season contradiction.
4. 2016–2017 planned grids not archived (residual gap covered by R4 program prose).
5. The 11-16-2018 completion list is titled "Coldwater Stocking" (TWRA's name for its trout-completions panel, winter program included) — yet its Laurel Creek row is a JUNE completion; the title does not make the creek a winter water.

## 8. Searches run (distinct queries; ⚠ = unproductive/rate-limited)

1. WebFetch mirror-search (Bing): "Laurel Creek" "Laurel Bloomery" Tennessee trout ⚠ (engine ignored quotes; junk results)
2. WebSearch: "Laurel Bloomery" Tennessee trout fishing Laurel Creek — Fish Trails RV Park + landsearch.com ✓
3. WebSearch: Fish Trails RV Park Laurel Bloomery stocked trout fishing creek — roverpass listing ✓ (private pay-to-fish stocked water on Laurel Creek — local amenity, not TWRA)
4. WebSearch: Laurel Creek Damascus Virginia Beaverdam Creek confluence Johnson County Tennessee — Federal Register 1988 ("Beaver Dam Creek… at confluence with Laurel Creek") ✓
5. WebSearch: Habera 2003 creel survey five streams Beaverdam "Laurel Creek" "Doe Creek" Stony Creek (joint) — R4-2020 on ResearchGate ✓ partial
6. WebSearch: "Laurel Creek" Johnson County Tennessee trout stream fishing Gentry Creek ⚠ (429-heavy, junk)
7. WebSearch: "Laurel Creek" Tennessee wild brown trout rainbow "state line" OR Damascus fishing — perfectflystore + savequitfish ✓
8. WebSearch: perfectflystore "Laurel Creek" Tennessee fly fishing season winter spring — page located ✓
9. WebSearch: "Laurel Creek" Tennessee trout "year-round" OR December OR winter stocked fishing — no winter-stock evidence anywhere ✓ (absence finding)
10. WebSearch: fishbrain "Laurel Creek" Tennessee trout Laurel Bloomery Damascus — no TN page indexed ⚠ (Fishbrain has Laurel Lake VA instead)
11. Opened: perfectflystore.com/your-streams/fly-fishing-laurel-creek-tennessee (year-round season text; "spring is the best time"; holdover claim; © 2013 James Marsh)
12. Opened: abingdonoutdoors.com/2012/04/20/tennessee-laurel-creek (Eric Thiessen, 4/20/2012; Laurel Bloomery→Damascus; TN wild trout, VA stocks)
13. Opened: live tn.gov page (9/21/2026 report — no Laurel Creek completions)
14. Wayback CDX probes: sched03–15; BeaverdamCreekLowerandLaurelCreek.pdf; June-2024 feed (2016/2017 grids empty ⚠)

## 9. Recommendation

**KILL [12,1,2] — reclassify Laurel Creek as seasonal, stocked March–June (late-Feb starts in 8 of 21 scheduled years).**

- Pin months **[3,4,5,6]**, noting the documented **late-February first stocking week in 2004–2007 and 2010–2013** (Feb 24–29) — if the project's month field records every planned-event month observed, use **[2,3,4,5,6]** with the Feb-start note (identical treatment to Beaverdam Creek's recommendation). Accurate seasonal summary: **March–June, sometimes starting late February**.
- Species: Rainbow Trout (catchable, ~4,100/yr agency figure 2010; ~240/event across 12 sites currently); excellent wild RBT/BNT fishery + native brook trout tributaries — include a wild-fish component note (documented reproduction, age-0 in 2022).
- Completed "Laurel Creek 05/30/2024" is consistent (week-of May 26 + 4 days) — keep as destination-level spring evidence.
- Confidence: planned-schedule evidence HIGH (21 of 23 years primary grids); completed evidence HIGH; agency program statement HIGH (dedicated 2010 account names March–June and the put-and-take design).
