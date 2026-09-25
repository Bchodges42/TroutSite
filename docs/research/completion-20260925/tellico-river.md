# Tellico River (upper river, Tellico Plains → Cherokee NF), Monroe County, TN — Year-Round Trout Classification Research Log

Research date: 2026-09-25 (single session). Scope: internal classification research ONLY; no agencies/businesses/authors/anglers contacted; no files outside the named notes files were written; no git writes.

Water: Tellico River main stem, Tellico Plains upstream into Cherokee NF (Tellico Ranger District), Monroe County, TN. Ledger: `year-round-trout`; YR flag set; no months pinned. Sibling discipline: this log covers the RIVER main stem only. TELlico LAKE (Tellico/Tellico Reservoir, impounded by Tellico Dam on the Little Tennessee) is covered in tellico-lake.md; its ArcGIS rows ("Tellico Reservoir" ×2 Region 4, "Tellico (upper)" Region 3, StockingProgram "Reservoir", lat 35.547–35.556) sit ~0.2° north of the river stocking corridor (river sites lat 35.26–35.34) and were kept strictly separate. Tributary programs (Citico Creek, North River, Bald River, Sycamore Creek, Green Cove Pond) appear as separate waters/rows in every TWRA dataset used here and are treated only as context.

---

## 1. TWRA ArcGIS (services3.arcgis.com/PWXNAH2YKmZY7lBq) — retrieved 2026-09-25 via REST query
- URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/ArcGIS/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0/query?where=UPPER(StreamName)%20LIKE%20%27%25TELLICO%25%27&outFields=*&outSR=4326&f=json (local cache `_tellico_arcgis.json`)
- 98 features matched "TELLICO": 95 × StreamName "Tellico River" (the river), 2 × "Tellico Reservoir" + 1 × "Tellico" (site "Tellico (upper)") = the LAKE rows (see sibling log).
- Tellico River rows (verbatim fields): Region "3", County "MONROE", StockingProgram "Spring", WaterClass "stream", Species "rainbow_brown" (80 rows), "rainbow" (16, the upper/tributary-junction sites), "brook_brown_rainbow" (2); Management "USFS" (88), "USFWS" (2, incl. Baby Falls), blank (5). DayClosure: "Thursday and Friday". DelayedHarvestSeason: "Catch-and-release season is Oct. 1 - Feb. 28". DailyPermitRequired: "Tellico-Citico Permit required Mar 1- Aug 15".
- Named sites (coords): Tellico Hatchery Visitor Parking Lot 35.28790,-84.09746; Governor's Hole 35.26138,-84.08243; Sourwood Bridge 35.29280,-84.11125; Green Cove Store 35.29727,-84.11483; Long Hole 35.30835,-84.12149; Panther Branch 35.32196,-84.14384; North River (site at confluence) 35.32852,-84.14551; Cow Camp Bridge 35.32229,-84.16817; Baby Falls 35.32665,-84.17638; Bald River 35.32471,-84.17768; Turkey Creek 35.34045,-84.19154; Kayak Bridge 35.33146,-84.18459; ~80 unnamed corridor points. Reach: river corridor lon −84.1915 → −84.0660 (riverside lower end near Tellico Plains), lat 35.261–35.340.
- Type: agency site master (program structure). Confidence: high. Establishes: program geometry (Turkey Creek/Green Cove upstream to NC line), species mix as-recorded (rainbow+brown), DH season Oct 1–Feb 28, permit season Mar 1–Aug 15, Thu/Fri closure. Does NOT establish months.

## 2. 2026 planned schedule (live tn.gov JSON, 616 rows) — retrieved 2026-09-25
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json (byte-copy cached by sibling pass as `data/sched2026.json`)
- 32 Tellico River rows (all Region 3, Monroe, TYPE/LOCATION as below, SPECIES "Rainbow Trout" on every row):
  - TYPE "Delayed Harvest": weeks of 02/08, 2/22, 9/27, 10/11, 10/25, 11/8, 11/22, 12/6 (2026)
  - TYPE "Seasonal": weekly 3/1 through 8/9 (Mar 1, 8, 15, 22, 29, Apr 5…Aug 9 — 23 weekly rows)
- Months with planned 2026 stocking: **Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec — 11 months; only January is dark.**
- Type: planned. Confidence: high. Note: SPECIES column lists only "Rainbow Trout" in 2026 rows; the program's browns/albino rainbows (story map, §5) are not itemized in the JSON.

## 3. Archived published schedules — month-by-month table (all retrieved 2026-09-25; X/•/DH marks decoded from PDF glyph coordinates against grid column borders, spot-verified visually on rendered page images)

| Schedule year | Source (cache / Wayback era) | Tellico River row as decoded | Months supported | Notes |
|---|---|---|---|---|
| 2003 | schedpdf/sched03.pdf (2003 Tentative Trout Stocking Schedule, state.tn.us era) | weekly X Mar 16–Aug 24 (24 wks) + single X Sep 28 | Mar–Sep | footnote **: closed Thu/Fri, daily permit |
| 2004 | sched04.pdf | weekly Mar 7–Aug 29 (24) + single Sep 26 | Mar–Sep | — |
| 2005 | sched05.pdf | weekly Mar 13–Aug 28 (25) + single Oct 2 | Mar–Aug, Oct | Sep dark |
| 2006 | sched06.pdf | weekly Mar 12–Aug (26 marks) + single Oct 1 | Mar–Aug, Oct | — |
| 2007 | sched07.pdf | weekly Mar 11–… (26 marks) ending Sep 30 | Mar–Sep | — |
| 2008 | sched08.pdf | weekly Mar 16–… (25 marks) ending Sep 28 | Mar–Sep | — |
| 2009 | sched09.pdf | weekly Mar 15–Aug 23 (24) | Mar–Aug | — |
| 2010 | sched10.pdf (tabloid grid) | weekly Mar 7–Aug (~22–29) (25) | Mar–Aug | Citico/GCP end same week |
| 2011 | sched11.pdf | weekly Apr 10–Aug/Sep (25) | Apr–Aug(–Sep) | first mark Apr 10 |
| 2012 | sched12.pdf | weekly Mar 11–Aug 26 | Mar–Aug | — |
| 2014 | sched14.pdf | weekly Apr 20–Oct 5 (25) | Apr–Oct | Tellico runs 8 wks past Citico/GCP |
| 2015 | sched15.pdf | 25 marks decoded by coordinates (text layer lost them): Mar 15–Aug 30 | Mar–Aug | — |
| 2013, 2016–2017 | no archived grid found in local cache or CDX listing | — | — | GAP |
| 2018 | reports/2018-Trout-Stocking-Schedule.pdf (first web-grid era) | 26 • Apr 1–Oct 21 + "DH" label on row (**DH) | Apr–Oct | DH stock listed but uncolored |
| 2019–2020 | complete/complete_2019-20.pdf & complete_2020.pdf ("Trout Stocking (2020)", byte-same grid) | weekly • Mar 1–Aug 30 (23) + DH Oct 4 | Mar–Aug, Oct | verified visually incl. header |
| 2021 | complete_2021a (mid-season capture, early marks cleared) & 2021b (full) | weekly Mar 7–Aug 29 + DH ~Oct 3 | Mar–Aug, Oct | 2021a starts Mar 21 (pre-capture clears past weeks) |
| 2022 | complete_2022a/b | weekly Apr 20–Sep 14 (22) + DH (Oct) | Apr–Sep, Oct | — |
| 2023 | complete_2023a (capture Oct 2023) + eregulations "Tentative Trout Stocking Schedule for 2023" PDF | Mar 19–Aug 13 + DH Oct 22 (2023a); full-season PDF: 21 • Mar–Aug + DH early Oct | Mar–Aug, Oct | Green Cove Pond "CLOSED FOR RENOVATIONS" |
| 2024 | complete_2024a/b ("Trout Stocking (2024)") | weekly • Mar 3–Aug 25 + DH Oct 6 | Mar–Aug, Oct | verified visually against header; Feb dark |
| 2025 | complete_2025a/b/d ("Trout Stocking (2025)") | DH Feb 16; weekly • Mar 16–Aug 10 (22); DH Oct 19, Nov 2, Nov 16, Nov 30, Dec 14, Dec 28 | Feb, Mar–Aug, Oct–Dec | Sep + Jan dark |
| 2026 | live schedule JSON (§2) | DH Feb 8/22; Seasonal weekly Mar 1–Aug 9; DH Sep 27–Dec 6 | Feb–Dec (no Jan) | 11 months planned |

Schedule-window verdict: **every archived plan 2003–2026 stocks the Tellico in a Mar/Apr–Aug(–Sep) weekly block plus a fall DH component (Oct, from 2018 explicitly labeled DH); from 2025 the DH block extends into Dec and starts in Feb.** No year plans a January stocking. Continuous 12-month stocking is found in NO document; but 9–11 months of planned stocking per year is the norm since 2018, and the DH C&R season (Oct 1–Feb 28) keeps the fishery open through the unstocked months on carryover fish.

## 4. Completed (destination-level) stocking evidence
- 2024-06-07 archive (54 completed rows, window 5/6–6/4/2024): `{"Region": "3", "Destination": "Tellico River", "Stocking Date": " 05/30/2024"}` — high confidence (local `committed2024.json`).
- TWRA Coldwater Trout Stocking Schedule PDFs (cached `cw/*.txt`, all Region 3 "Tellico River" rows): 04/19/2022 and 07/28/2022 (cw_2022may, cw_2022aug); 04/06/2023 (cw_2023may); 10/19/2023 ×2 dates (cw_2023nov, the DH stock); 05/16/2024 (cw_2024may); 07/25/2024 (cw_2024aug). **Same cw_2022may also lists a separate Region 3 destination "Tellico" stocked 04/22/2022** — distinct from "Tellico River"; this is the reservoir destination (see tellico-lake.md).
- Aug/Sep 2025 Trout_Stocking-Report (Wayback capture 20250902003641, quoted in sibling hiwassee log): "**Tellico 7/31**" — bare destination name; probably the river (adjacent Citico Creek 7/31), but unresolvable from the excerpt; flagged.
- Live feed (tn.gov rendered 2026-09-25, report updated 9/21/2026; local `committed_live.json` + `stockings_page.html`): 10 completion rows, **no Tellico row**; the page's program list includes "Tellico River" and (separately) "Region IV, Tellico (Upper) - Rainbow".
- Verdict: completed rows document river stockings in **Apr, May, Jul, Oct** across 2022–2025; completed record is sparse relative to the weekly plan (only snapshots archived), so absence elsewhere is not evidence of absence.

## 5. Regulation structure (C&R trophy reach question)
- TWRA Trout Regulations (tn.gov/twra/fishing-regs/trout-regulations.html; mirror eregulations.com/tennessee/fishing/trout-regulations, retrieved 2026-09-25): Delayed Harvest Area = "**Tellico River: Mouth of North River upstream to the Tennessee-North Carolina state line**"; "**Catch-and-release season is Oct. 1–Feb. 28**"; artificial lures only, bait prohibited, harvest/possession prohibited during the season. Tellico-Citico Permit waters = "Tellico River from its confluence with Turkey Creek upstream to the TN-NC state line"; permit required Mar 1–Aug 15; closed Thursday and Friday Mar 1–Aug 15 (holidays excepted); Aug 16–last day of February open daily with no permit; 7 trout/day, no length limit; one rod; sunrise-to-sunset hours.
- TWRA Trout Story Map ("Trout Fishing Forecasts", storymaps.arcgis.com; cached `storymap.json`, retrieved 2026-09-25), Tellico block: "TWRA intensively manages 13 miles of the Tellico River located within the Cherokee National Forest… The area from Turkey Creek upstream to the TN/NC state line is heavily stocked weekly with quality and trophy Rainbow Trout, Albino Rainbow Trout and Brown Trout from March through July. Tellico Hatchery stocks up to 120 locations in this 13 mile stretch of river every week during the season. In addition, the portion of the river from North River upstream to the TN/NC state line is managed under a catch and release regulation from October 1 until the end of February. During this delayed harvest season, this section of the river is stocked with numerous trophy Rainbow and Brown Trout." Quick-facts card: "**Stocking: October through July (excellent year-round fishing depending on elevation)**"; "Creel limit: 7 trout per day March 1 until September 30, catch and release only October 1–end February."
- **There is NO separate trophy/C&R section**: the only catch-and-release reach is the DH (North River mouth → state line, Oct 1–Feb 28). "Trophy" appears only as a size class of DH-stocked fish.
- Permit detail: Tellico-Citico daily permit (Type 098), ~$3.50–$6.50 depending on source/year (search results; FOX 17 proposed increase to $8.00).

## 6. Holdover / natural reproduction (agency + research)
- TWRA story map (same block): "**The water is cold enough to support trout year-round at higher elevations. There is natural reproduction of wild Rainbow Trout and Brown Trout above the confluence of North River. These wild fish are generally less than 10\", however the wild Brown Trout can regularly exceed 16\".**" Species card: "Brown, Rainbow, Albino Rainbow and occasionally wild Brook Trout at higher elevations."
- Tennessee Trout Management Plan 2017–2027 (Habera et al., TWRA Fisheries Report 17-10, Oct 2017; cached `reports/Tennessee-Trout-Management-Plan-2017-2027.pdf`, retrieved 2026-09-25): Tellico River cited as a stream that "support[s] wild trout populations [and] are also stocked… extremely high fishing pressure, like Tellico River (Monroe County). Because survival of stocked trout is usually limited by summer water temperatures, harvest of trout in these waters is generally encouraged." Bates (1997) creel study: "95% of the trout stocked are harvested by anglers" in the Tellico. DH program: "TWRA also established DH areas on Paint Creek, Tellico River, Hiwassee River, and Piney River… fall and winter fishing." Tellico Hatchery rears 10–12-inch rainbows "stocked frequently into the Tellico River, Citico Creek, and Green Cove Pond"; Tellico-Citico permit funds the program.
- Bates, B.N. 1997, M.S. thesis, University of Tennessee, Knoxville ("A creel survey of the Tellico and North Rivers: comparisons between a stocked and a wild trout stream", trace.tennessee.edu/utk_gradthes, retrieved 2026-09-25 via search + full text): Tellico = intensively managed put-and-take receiving "between 60,000 and 100,000 catchable rainbow trout… weekly from late March through early September" (1995–96 study years); ~90–95% returned to creel within days → negligible holdover in the stocked reach; North River = the wild-trout comparison stream; "Tellico River also supports populations of naturally reproducing rainbow and brown trout" (per Strange & Habera 1995 cited therein), wild water extending roughly to the Bald River confluence.
- TWRA population sampling: 13-lb brown trout captured in a TWRA Tellico sample (R&R Fly Fishing, 2012-02-02, randrflyfishing.com) — trophy-class fish present in samples.
- GBIF occurrences (api.gbif.org, retrieved 2026-09-25): Oncorhynchus mykiss 26 records in the Tellico corridor (Monroe Co.; recent iNat-derived 2020–2026 records at 35.287/-84.094, 35.340/-84.191, 35.290/-84.086 etc.), Salmo trutta 2 records (2023 at 35.287/-84.184; 2026 at 35.319/-84.125) — all on the river corridor, none in the reservoir.
- NAS (nas_rbow.json cache): Monroe Co. records incl. "North River, Tellico Wildlife Management Area" (O. mykiss) and "North River" (S. trutta).
- Verdict: **documented wild reproduction above the North River confluence (TWRA's own statement) + DH carryover fish through winter** = the year-round fishery basis; the intensively stocked lower reach remains a seasonal put-and-take with summer survival limited by temperature.

## 7. Reach discipline (stocked main stem vs headwater tributaries)
- Stocked main stem: Turkey Creek (alt. storymap/GIS lower bounds) / Sourwood-Green Cove corridor up to the NC line — the 98-site master, weekly "up to 120 locations" (storymap), 126 sites every Thursday (Knox News 2017-07-09).
- DH reach overlays the upper main stem: North River mouth → state line (Oct 1–Feb 28).
- Separate waters (not this ledger row): Citico Creek (its own stocking row in every grid; permit shared); Green Cove Pond (own row, DH pond, closed for renovations 2022–2025, reopens Mar 1 2026 per TWRA Newsroom); North River & Bald River — "managed strictly as wild trout waters" (Game & Fish 2005; Bates 1997 comparison stream); Sycamore Creek & Rough Ridge Creek — wild trout stream regs (eregulations); Sycamore Creek brook restoration (TWRA/USFS/TU; LT-NFCP 2019: 2.8+4.0 km restored 2017–18; TMP §Brook Trout: Rainbow removal + native brook stocking at Tellico Hatchery).

## 8. Contradictions
- C1: Story-map quick card "Stocking: October through July" vs body text "March through July" weekly + DH stocking Oct–Feb vs schedule grids Mar–Aug/Sep. The card's "October through July" best matches combined program structure (Oct–Feb DH + Mar–Jul weekly), mirroring the tailwater-catalog phrasing habit seen on the Hiwassee row.
- C2: Southeastern Anglers (guide page): "The DH begins on October first and runs through the middle of March" — CONTRADICTS official Oct 1–Feb 28 (TWRA regs, GIS, story map). Coastal Angler similarly lists "Oct 1–March 14". Official date wins.
- C3: OnTheFlySouth ("The Terrific Tellico"): river "stocked year-round, every Thursday" — loose angler phrasing; weekly stocking runs Mar–Aug, not year-round.
- C4: 2026 JSON rows list SPECIES "Rainbow Trout" only; story map says rainbow + albino rainbow + brown. JSON species column is not exhaustive.
- C5: 1990s regime (Bates): catchable rainbows only, late March–early September, 60–100k/yr — browns/albinos and the DH component postdate the 1990s creel era; the modern program is broader than the one Bates measured.

## 9. Searches run (Tellico River)
Productive: (1) Tellico River TN trout stocking schedule DH Cherokee NF [tn.gov/fs.usda]; (3) TWRA trout story map Tellico ArcGIS; (4) Bates 1997 creel survey Tellico North River thesis; (5) Tellico River electrofishing wild brown reproduction; (7) Cherokee NF Tellico Ranger District fishing stocking; (8) Tellico DH Dec/Jan/Feb reports; (9) Tellico Aug warm-water stocking cancellations; (11) Tellico-Citico permit Type 098 cost; (12) Sycamore Creek brook restoration; (13) Tellico DH Feb/Mar harvest resumption; (14) Tellico albino rainbow 2016-17 schedules (Knox News 2017 weekly-Thursday hit).
Unproductive/rate-limited: (2) "Tellico River" DH Oct 1 C&R exact-phrase (429; completed later via direct fetch); (6) Tellico DH Oct 2025 trophy (no results); (10) Tellico stocking news 2024-25 (429).
Sources opened: TWRA ArcGIS REST; 2026 JSON; sched03–15/2018/2019-25 PDF grids (coordinate decode + visual verification); 2026 live feed + live stockings page caches; cw_2022–2024 coldwater reports; TMP 2017–2027; story map JSON; eregulations trout regulations; eregulations/TWRA 2023 Tentative Schedule PDF (eregulations.com/assets/docs/resources/TN/Trout_Stocking.pdf); Bates 1997 full text (trace.tennessee.edu/utk_gradthes); Hiwassee TU Tellico page; Game & Fish "Going Wild With Tennessee Trout" (2005); WVLT Tellico Hatchery visit (2023-06-02); Southeastern Anglers Tellico page; GBIF API; NAS cache; WATE (2026).

## 10. Recommendation (Tellico River)
**RETAIN `year-round-trout` — the ledger verdict survives** — but pin the stocking window and the basis:
- Planned stocking covers **Feb–Dec (11 months) in 2026** (DH Feb + Seasonal Mar–Aug + DH Sep–Dec); every archived plan 2003–2026 stocks ≥6 months centered Mar–Aug, with fall DH from Oct (explicitly since 2018, extended to Nov–Dec in 2025–2026). **January is the only month with no planned stocking in the modern era.**
- Year-round status rests on the standard's second limb: **documented holdover/reproduction** — TWRA's own statement that the water "is cold enough to support trout year-round at higher elevations" with "natural reproduction of wild Rainbow Trout and Brown Trout above the confluence of North River" (wild browns regularly >16"), plus DH carryovers carrying the C&R season (Oct 1–Feb 28) through the unstocked months. Recommended months pin (stocking program): **[2,3,4,5,6,7,8,9,10,11,12]** with January covered by the DH season/wild fish rather than stocking.
