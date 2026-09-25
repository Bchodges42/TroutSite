# Forge Creek (Johnson County, TN) — Evidence Repair Research Log

Water: Forge Creek, Johnson County, TN — small tributary of Roan Creek (Watauga River watershed), flowing NE of Mountain City along Forge Rd/Forge Creek Circle (Laurel Branch–Bulldog Creek area), roughly 36.442–36.467 N, −81.770 to −81.733 W.
Ledger verdict under test: seasonal-stocked with catalog months **[12,1,2] (Dec–Feb)** — SUSPECT (contradicts Region 4 pattern).
2024 archive completion under test: **"Forge Creek 06/04/2024"** (June, outside Dec–Feb).
Research date: 2026-09-25 (all retrievals this date unless noted). Research ONLY; no agencies/businesses contacted.

---

## 1. Water identity / disambiguation (CLOSED)

- **No other "Forge Creek" exists in TWRA's trout datasets.** The 2026 exceldriven JSON contains exactly one Forge Creek row-set: **REGION "4", COUNTY "Johnson"** — 4 rows, TYPE **"Seasonal"**, SPECIES "Rainbow Trout", weeks 3/8, 4/5, 5/3, 5/31/2026. (Note: Pigeon Forge / Sevier County "Forge Creek Rd" noise in web searches is a different, unstocked context; the trout program's Forge Creek is only this Johnson County stream. The "Coldwater Stocking 11-16-2018" Region 4 completion list places Forge Creek among Region 4 destinations.)
  - URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json (browser-context fetch; tn.gov blocks plain curl)
- **TWRA ArcGIS "TWRA_Trout_Stocking_Locations"** (live REST query, 730 features): 10 Forge Creek sites, all **County=JOHNSON, City=Mountain City, StockingProgram="Spring", Species=rainbow, DelayedHarvestSeason=None**, 20 RB each (~200 per event):
  - S1 Forge Rd 5-Ton Bridge (36.44217, −81.77022); S2 Site #2 (36.44772, −81.76400); S3 Brown Rd Mailbox #324 (36.45056, −81.76325); S4 Brown Rd Mailbox #118 (36.45208, −81.76036); S5 Nelson Chapel Baptist Church (36.45242, −81.75833); S6 Forge Rd #315 Mailbox (36.45464, −81.75833); S7 Forge Cr Circle #152 Mailbox (36.46492, −81.74211); S8 Forge Cr Circle (36.46411, −81.73844); S9 Forge Cr Circle Concrete Bridge (36.46450, −81.73483); S10 Forge Cr Circle & Hwy 167 Int. (36.46728, −81.73317). All private-land.
  - Program distribution over all 730 sites: Spring 597, Winter 54, Tailwater 60, Reservoir 19 — **no Forge Creek Winter sites**.
  - URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=json
- **TWRA GIS access sheet "Forge Creek & Roan Creek"** (Wayback 20110411174302 of tn.gov/twra/gis/troutpdf/ForgeCreekandRoanCreek.pdf, produced by TWRA GIS 12/28/2010): "Forge Creek & Roan Creek Stocked Trout Program" — stocked reach along Forge Rd/Forge Creek Circle NE of Mountain City; tributaries mapped (Vought Creek, Egger Branch, Laurel Branch, MCEwen Branch, Woodward Branch…). Legend = "Trout Stream or Lake … Stocking Site" (standard spring category, not "Winter Trout Stream or Lake").
- **Watershed/character (agency)**: Table A-1 of the R4 2018 report lists "Forge Creek — Watauga [watershed] — Johnson — Private — 1993 — RBT/BKT — 2" (quantitatively sampled 1993, wild Rainbow + Brook/Brown trout). R4 2010 report: Woodward Branch, "a tributary of upper Forge Creek" (Hubert Taylor Rd site, 36.47442, −81.72249, 2,800 ft, sampled 15 Jun 2010) held a wild rainbow trout population.

## 2. Month-by-month planned stocking record, 2003–2026 (primary evidence)

Method: identical geometric parse as the Doe/Beaverdam logs (pymupdf word coordinates; header day-tokens solved as consecutive Sundays of the grid year — all marks below are valid Sundays; "within five days after" rule stated in every grid). Johnson rows carry county labels in-grid ("Johnson Forge Creek").

| Year | Schedule source (Wayback capture) | Forge Creek stocking weeks (week-of Sundays) | Months supported |
|---|---|---|---|
| 2003 | sched03.pdf, 20030404161556 | Mar 9, Apr 6, May 4, Jun 1 (4, monthly) | **Mar, Apr, May, Jun** |
| 2004 | sched04.pdf, 20040210011352 | Mar 7, Apr 4, May 2, May 30 (4) | **Mar, Apr, May** (+May 30 week → Jun 4 window) |
| 2005 | sched05.pdf, 20051124124935 | Mar 6, Apr 3, May 1, May 29 (4) | **Mar, Apr, May** (+May 29 → Jun 3 window) |
| 2006 (early ed.) | sched06.pdf, 20060604223344 | Mar 5, Apr 2, Apr 30, May 28 (4) | **Mar, Apr, May** (+May 28 → Jun 2 window) |
| 2006 (revised ed.) | eRegulations mirror Trout_Stocking.pdf (solves to 2006; different dates) | **Feb 12**, Mar 12, Apr 9, May 7, Jun 4, **Jul 2** (6) | Feb + Mar–Jun (+Jul 2 week → Jul 7 window) — a documented mid-season revision with a wider envelope |
| 2007 | sched07.pdf, 20070227143540 | Mar 4, Apr 1, Apr 29, May 27 (4) | **Mar, Apr, May** (+May 27 → Jun 1 window) |
| 2008 | sched08.pdf, 20080909205030 | Mar 2, Mar 30, Apr 27, May 25 (4) | **Mar, Apr, May** |
| 2009 | sched09.pdf, 20090418095714 | Mar 8, Apr 5, May 3, May 31 (4) | **Mar, Apr, May** (+May 31 → Jun 5 window) |
| 2010 | sched10.pdf, 20100326100325 | Mar 7, Apr 4, May 2, May 30 (4) | **Mar, Apr, May** (+May 30 → Jun 4 window) |
| 2011 | sched11.pdf, 20110111175732 | Mar 6, Apr 3, May 1, May 29 (4) | **Mar, Apr, May** (+May 29 → Jun 3 window) |
| 2012 | sched12.pdf, 20120418154111 | Mar 4, Apr 1, Apr 29, May 27 (4) | **Mar, Apr, May** (+May 27 → Jun 1 window) |
| 2013 | sched13.pdf, 20140112202401 | Mar 3, Mar 31, Apr 28, May 26 (4) | **Mar, Apr, May** (+May 26 → May 31 window) |
| 2014 | sched14.pdf, 20140412202632 | Mar 9, Apr 6, May 4, Jun 1 (4) | **Mar, Apr, May, Jun** |
| 2015 | sched15.pdf, 20150319003402 | Mar 8, Apr 5, May 3, May 31 (4) | **Mar, Apr, May** (+May 31 → Jun 5 window) |
| 2016–2017 | **NOT FOUND** (no archived grid; same gap as Beaverdam/Doe passes) | — covered by agency prose (R4 reports describe the Region 4 adult-RBT program as current) | (Mar–Jun per program) |
| 2018 | 2018-Trout-Stocking-Schedule.pdf, 20180717180317 | Mar 11, Apr 8, May 6, Jun 3, **Jul 1** (5) | **Mar, Apr, May, Jun** (+Jul 1 week) |
| 2019 | 2019-Trout-Stocking-Schedule.pdf, 20190109035923 | Mar 10, Apr 7, May 5, Jun 2, **Jun 30** (5) | **Mar, Apr, May, Jun** (+Jun 30 week → Jul 5 window) |
| 2020 | Trout-Stocking-Schedule-Complete.pdf, 20200424033427 | Mar 8, Apr 5, May 3, May 31, **Jun 28** (5) | **Mar, Apr, May, Jun** (+Jun 28 week → Jul 3 window) |
| 2021 | Complete.pdf, 20210119123626 (revision 20210820 identical rows) | Mar 14, Apr 11, May 9, Jun 6, **Jul 4** (5) | **Mar, Apr, May, Jun** (+Jul 4 week) |
| 2022 | Complete.pdf, 20220221215138 (revision 20220519194927 identical rows) | Mar 13, Apr 10, May 8, Jun 5, **Jul 3** (5) | **Mar, Apr, May, Jun** (+Jul 3 week) |
| 2023 | Complete.pdf, 20230219191239 | **Feb 12**, Mar 12, Apr 9, May 7, Jun 4, **Jul 2** (6) | Feb + **Mar, Apr, May, Jun** (+Jul 2 week) — verified on-row (marks share the row's y-center exactly; neighbors separate) |
| 2024 | Complete.pdf, 20240219225857 | **Feb 11**, Mar 10, Apr 7, May 5, Jun 2, **Jun 30** (6) | Feb + **Mar, Apr, May, Jun** (+Jun 30 week) — verified on-row |
| 2025 | Complete.pdf, 20250208215445 (revision 20250902003710 identical rows) | Mar 9, Apr 6, May 4, Jun 1 (4) | **Mar, Apr, May, Jun** |
| 2026 | Live exceldriven JSON | 3/8, 4/5, 5/3, 5/31 (4, ~monthly; TYPE="Seasonal") | **Mar, Apr, May** (+May 31 → Jun 5 window) |

- **Zero planned Forge Creek stockings in December or January in any archived schedule 2003–2026.** February events exist in exactly 2 of 21 scheduled years (2023: Feb 12; 2024: Feb 11) plus the revised-2006 edition — a tail of the winter-to-spring transition, never a Dec–Feb program.
- Same-year revision pairs (2021 Jan/Aug; 2022 Feb/May; 2025 Feb/Sep; distinct md5s) show **identical Forge Creek rows** — no replay-trap effect.
- Winter/coldwater programs checked and **exclude Forge Creek**: wintertrout.pdf (2013/14), winter_trout_2018.pdf, winter-trout-schedule.pdf (2019/20), Coldwater-Trout_Stocking-Schedule.pdf (2022), TWRA-Winter-Trout-Schedule.pdf (2024/25) — Johnson County's only winter water is Ralph Stout Park pond.

## 3. Completed (destination-level) stocking evidence

- **"Coldwater Stocking" completion report dated 11-16-2018** (tn.gov/content/dam/tn/twra/documents/Cold-Water-Stocking.pdf): Region 4 completions include **"Forge Creek 7/3/2018"** (Tuesday after planned week-of Jul 1, 2018 — exactly the "within five days" window ✓; also "Doe Creek 7/19/2018", "Laurel Creek 6/25/2018"). **No Dec–Feb Forge Creek completion.**
- **June-2024 completed feed JSON** (Wayback capture 20240607134309, digest TQTTIQB25JD3Y7KHHYJS4USO3SVZWWGO; body retrieved and decoded in memory 2026-09-25): `{"Region":"4","Destination":"Forge Creek","Stocking Date":" 06/04/2024"}` — the archive row under test. 06/04/2024 (Tue) = within 5 days after planned week-of **Jun 2, 2024** ✓ (2024 grid: Feb 11, Mar 10, Apr 7, May 5, Jun 2, Jun 30).
- **Trout Stocking Report, updated 3/21/2025** (capture 20250322191030), Region 4 table row: **"Forge Creek | 03/10/2025 | 4"** = Monday after week-of Sun Mar 9, 2025 (first 2025 event) ✓ spring.
- **Trout Stocking Report PDFs updated 9/27/2024 (capture 20240927221436), 11/8/2024 (20241111215005), and 8/29/2025 (20250902003641)**: **no Forge Creek** rows — windows fall outside the Mar–Jul season.
- **Live page 2026-09-25** (report updated 9/21/2026): **no Forge Creek** completions.

## 4. Agency program statements

- No dedicated Forge Creek account exists in the R4 coldwater reports (absence noted — it is one of the smaller waters in the 34/36-stream adult-RBT program). Program-level statements that cover it:
  - R4 2017/2018/2020/2021/2023 reports: "TWRA provides or supplements trout fisheries in **34 (later 36) such streams in Region IV by annually stocking hatchery-produced (adult) Rainbow Trout**" — Forge Creek appears in the program's stream lists and the 2026 schedule.
  - **TWRA "Stocked Trout Water Designations"** (gis/troutmap, 2011 capture): spring-start seasonal stocking definition ("starting in the spring of each year… best fishing from the first stocking until midsummer") — the category Forge Creek's GIS sheet uses.
  - **Trout Management Plan 2006–2016** (Fiss & Habera): small-stream put-and-take program framing (O'Bara & Eggleton 1995 small-scale put-and-take evaluations cited).

## 5. Holdover / reproduction

- **Wild trout presence: documented (historical).** 1993 quantitative sampling recorded wild Rainbow and Brown Trout (R4 2018 Table A-1); wild rainbows in Woodward Branch (upper Forge Creek tributary) 2010. **No dedicated account, no annual monitoring station, no agency holdover statement — absence noted.** The creek is managed purely as a small seasonal put-and-take water (~200 fish/month, private-land sites).
- No reproduction/holdover claim survives for Forge Creek at destination level beyond the general "excellent wild trout populations" class statement that TWRA applies to named example streams (Beaverdam, Doe Creek, Laurel Fork, Doe River — Forge Creek NOT among the named examples).

## 6. Species & type

- Species: catchable **Rainbow Trout** only (2026 JSON; ArcGIS Species=rainbow, 20/site; Fishbrain: Rainbow trout the only reported species, 14 catches, coords 36.469/−81.732 matching the upper sites).
- Type: **Seasonal (monthly spring put-and-take)**. Confidence: **HIGH** for the seasonal verdict (21/23 years of planned grids + 2026 JSON + completed evidence + ArcGIS Spring flags); **MEDIUM-HIGH** for exact month-envelope edges (Feb events in 2023/2024 and Jul tail weeks 2018–2023 are real planned events, but single-month appearances).

## 7. Contradictions found

1. Catalog months **[12,1,2] vs. all primary evidence**: 21 planned grids + 2026 JSON + completions (Jun 2018, Jun 2024, Mar 2025) show a Mar–Jun (occasionally late-Feb/early-Jul edge) program. **No December or January Forge Creek stocking exists in any source.**
2. The 2023/2024 February events (Feb 11–12) are the closest thing to a "winter" stocking — two years out of 23; they immediately precede the monthly Mar–Jul sequence and never constitute a winter program. The revised-2006 edition (Feb 12–Jul 2 monthly) shows TWRA has occasionally run this water on a wider envelope, still never reaching Dec–Jan.
3. Forge Creek's completion dates (7/3/2018; 06/04/2024; 03/10/2025) pair exactly with planned week-of Sundays — planned vs completed evidence is mutually consistent.
4. 2016–2017 planned grids not archived (residual gap, covered by program statements).

## 8. Searches run (distinct queries; ⚠ = unproductive/rate-limited)

1. WebSearch: "Forge Creek" Johnson County Tennessee trout stocking — Fishbrain Forge Creek page + tn.gov/eregulations mirrors surfaced ✓
2. WebSearch: TWRA trout stocking Forge Creek Watauga basin Johnson County TN ⚠ (429)
3. WebSearch: TWRA trout stocking schedule Forge Creek Tennessee — tn.gov stockings page + eregulations.com/assets/docs/resources/TN/Trout_Stocking.pdf mirror ✓
4. WebSearch: "Forge Creek" Tennessee fishing rainbow trout Fishbrain Mountain City — Fishbrain page confirmed (rainbow only, 14 catches) ✓
5. WebSearch: "Forge Creek" Tennessee "Trade" OR "Shouns" OR "Roan Creek" trout fishing ⚠ (429)
6. WebSearch: "Forge Creek" Tennessee trout winter OR December OR "year-round" stocked ⚠ (429; no winter-stock evidence anywhere)
7. WebSearch: "Forge Creek" "Mountain City" Tennessee fishing ⚠ (429)
8. WebSearch: Forge Creek Tennessee trout fishing Johnson County stream ⚠ (429, one junk result set)
9. WebFetch (mirror searches): Bing quoted-phrase (engine ignored quotes) ⚠; DDG lite (bot challenge) ⚠; Mojeek (403) ⚠
10. Opened: fishbrain.com/fishing-waters/xLd-DcaM/forge-creek (species/coords/catches)
11. Opened: eregulations.com Trout_Stocking.pdf mirror (revised-2006 grid; geometrically solved)
12. Opened: tn.gov live stockings page 2026-09-25 (no Forge Creek completions in 9/21/2026 report)
13. Wayback CDX probes: sched03–15 captures; troutpdf access sheets; June-2024 feed (2016/2017 grids empty ⚠)

## 9. Recommendation

**KILL [12,1,2] — reclassify Forge Creek as seasonal, stocked March–June.**

- Pin months **[3,4,5,6]**. Monthly cadence (4–6 events/yr) across 2003–2026. Documented envelope edges: **February first events in 2023 (Feb 12) and 2024 (Feb 11)** and **early-July tail weeks in 2018–2023 (+revised 2006)**; most years are strictly Mar–Jun with completions (Jun 4 2024; Jul 3 2018) inside the +5-day windows. If the project's month field records every planned-event month observed, use [2,3,4,5,6,7] with a note; the accurate seasonal summary is **March–June**.
- Species: Rainbow Trout (~200/event, 10 private-land sites along Forge Rd/Forge Creek Circle).
- Completed "Forge Creek 06/04/2024" is consistent (week-of Jun 2 + 2 days) — keep as destination-level spring evidence.
- Confidence: planned-schedule evidence HIGH; completed evidence HIGH; agency program statement MEDIUM (no dedicated account; covered by the Region 4 program description and GIS sheet).
