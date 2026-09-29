# Fletchers Fork (`fletchers-fork`) — completion research log

Water: Fletchers Fork, Fort Campbell Military Reservation (Montgomery Co., TN side / Christian Co., KY side). Catalog months were [12,1,2] (suspect). Research date: 2026-09-25. Research only; no agency contact.

## HEADLINE VERDICT
- **Prior ledger association with FORT CAMPBELL is CORRECT.** Fletchers Fork is a small stream entirely within the federal Fort Campbell reservation; it is NOT a TWRA winter-program water.
- Stocking is a **cooperative federal-post program**: Fort Campbell Fish & Wildlife (federal, CAM Reg 200-4) coordinates; **KDFWR (Kentucky) stocks the KY-side reach (incl. Fletchers Fork) in Feb and Apr** (rainbow + brown trout); **TWRA stocks the TN-side reaches (Little West Fork sites) Feb–Aug** under the schedule line "Fort Campbell Streams."
- **Catalog [12,1,2] is WRONG.** Recommend seasonal with months **[2,4] for the Fletchers Fork reach itself (KDFWR events)**; the umbrella "Fort Campbell Streams" program runs **Feb–Aug**. Species: rainbow AND brown.
- Type: Seasonal put-and-take on a federal reservation (access permit required). Confidence: HIGH.

## Sources (retrieval 2026-09-25 unless noted)

1. **KDFWR "Yearly Trout Stocking Archive"** — Kentucky Dept of Fish & Wildlife Resources, https://fw.ky.gov/Fish/Pages/trout_archive.aspx (archive covers Sep 2025–Aug 2026; retrieved 2026-09-25):
   - Feb 12, 2026 — Fort Campbell (Fletchers Fork Creek), Christian County — 240 rainbow
   - Apr 7, 2026 — Fort Campbell Fletchers Fork — 240 rainbow + 750 brown
   Establishes: KY-side agency stocking, Feb + Apr 2026, rainbow + brown.
2. **Fort Campbell iSportsman — Fishing page** (federal reservation portal), https://ftcampbell.isportsman.net/Fishing.aspx, retrieved 2026-09-25. 2026 trout stocking schedule: Feb 12 (KDFWR, 1200 rainbows: 101st Airborne Div Bridge 240, East End Rd 240, Mabry Rd 480, Three Bridges 240); Apr 7 (KDFWR, 4450 rainbow+brown: incl. **Fletchers Fork: 750 brown + 240 rainbow**); Jun 25, Jul 22, Aug 26 2026 (**from TWRA**, ~1000–1024 rainbows each at Mabry Rd / Pumphouse Rd / Three Bridges / 101st Airborne Rd Bridge). Notes: "stocking event will happen within five days after the date listed"; rules per **CAM Regulation 200-4**; contact Fort Campbell Fish & Wildlife Office, DPW Conservation Branch, (270) 798-9824. Establishes: program months Feb, Apr, Jun, Jul, Aug (2026); Fletchers Fork itself stocked by KDFWR in Feb/Apr; TWRA's own events are at the Little West Fork sites.
3. **TWRA trout regulations (2026, eRegulations mirror)** — local copy `tmp\research\data\ereg_troutregs_2026.html` (retrieved 2026-09-25, prior pass); also https://www.tn.gov/twra/fishing-regs/trout-regulations.html. "Fort Campbell Military Reservation — Several streams on Fort Campbell Military Reservation including Dry Creek, **Little West Fork and Fletcher's Fork** are stocked with **rainbow and brown trout**. Special fishing regulations apply and a **Post Fishing Permit** is required… Community Recreation Division… Fort Campbell, KY 42223… https://ftcampbell.isportsman.net/Permits.aspx". Establishes: TWRA itself attributes the streams to the federal post program.
4. **TWRA 2026 stocking schedule JSON** (`data\sched2026.json`, tn.gov URL in hurricane-creek log): "REGION 2, COUNTY Montgomery, LOCATION **Fort Campbell Streams**, TYPE Seasonal, weeks 2/15, 4/19, 5/17, 6/21, 7/12, 8/23/2026, Rainbow Trout." Fletchers Fork is not named individually in TWRA schedules — it is one of the unnamed "Fort Campbell Streams."
5. **Historical TWRA schedules 2005–2025** (same corpus as hurricane-creek log): "Fort Campbell Streams" row present every scheduled year with 6–7 events spanning **Mar–Aug (2005–2015)** and **Feb–Aug (2018–2025)** (e.g., 2010: Mar 14–Aug 15; 2014: Mar 9–Aug 10; 2015: Feb 15–Aug 2; 2019: Feb 3–Aug 25; 2021: Feb 7–Aug 29; 2023: Feb 5–Aug 27; 2025: Feb 2–Aug 24). NEVER on winter (Nov–Feb) program lists (`winter-trout-stocking-report.pdf` 2018-10/2019-01 captures).
6. **Completed feeds**: Jan-2018 tn.gov completed table (Wayback 20180112212428): "Ft. Campbell 7/18/2017" (Region 2). Coldwater completed reports: 7/18/2017 (Apr-2018 capture), **1/2/2019**, 3/15/2018 & 3/15/2019 (2019 page captures, adjacent-pairing), **8/28/2019** (Jan-2020 capture). Sept-2026 live completed feed (tn.gov exceldriven `tn_complex_datatable.exceldriven.json`): "Region 2, Ft. Campbell, 08/28/2026". 2024 archive (window Apr–Jun 2024, md5 b8b2072e… exact replay of `completed_20240607b.json`): absent (no FC event in window). Establishes: completions in Jan, Mar, Jul, Aug across years — multi-month program.
7. **TWRA ArcGIS stocking locations** (`raw\arcgis_troutloc.json`, retrieved 2026-09-25): OBJECTID 12, Site_Name "Fletchers Fork", StreamName "Fletchers Fork", Region 2, County MONTGOMERY, **36.574112, -87.511810**, StockingProgram "Spring", WaterClass stream, Species rainbow, **Management "Other"** (i.e., not TWRA-managed land — the post). Reach: the fork drains southward through the reservation; KY-side reach mapped by KDFWR (below).
8. **KDFWR trout stream classification 2026** — https://fw.ky.gov/Fish/Documents/Currenttroutstreamclassification.pdf (surfaced via search 2026-09-25): Fletcher's Fork = **2.4-mile Class II (high quality) trout stream** (Christian Co., Fort Campbell).
9. **CAM Regulation 200-4 (Fort Campbell hunting/fishing)** — cited by iSportsman and TWRA regs; access point "Fletcher's Fork Creek at Boiling Springs Road (Areas 2 and 6)" (surfaced via search 2026-09-25).
10. **TWRA Facebook post** (surfaced 2026-09-25): "Fort Campbell streams stocked with over one thousand rainbow trout…" — confirms TWRA performs/cooperates on post stocking events; also notes an event in which Fletchers Fork received 0 fish (area shut down for military use).

## Months-by-year table (Fletchers Fork = within "Fort Campbell Streams" line)
| Years | Program months (schedule) | Fletchers Fork reach directly documented |
|---|---|---|
| 2005–2015 | Mar–Aug, 6 events/yr ( umbrella row) | not named individually |
| 2018–2020 | Feb–Aug, ~7 events/yr | not named |
| 2021–2025 | Feb–Aug, 7–8 events/yr | not named |
| 2026 | Feb 15, Apr 19, May 17, Jun 21, Jul 12, Aug 23 (TWRA schedule); iSportsman: Feb 12, Apr 7 (KDFWR incl. **Fletchers Fork**), Jun 25, Jul 22, Aug 26 (TWRA events) | **Feb 12 (240 RB), Apr 7 (240 RB + 750 BN)** |
| Completions | 7/18/2017, 3/15/2018, 1/2/2019, 3/15/2019, 8/28/2019, 8/28/2026 | — |

## Species
Rainbow Trout (all programs) + **Brown Trout** (KDFWR Apr stockings at Fletchers Fork and Little West Fork; TWRA regs "rainbow and brown trout").

## Contradictions / caveats
- Catalog [12,1,2] contradicted: no December/January program evidence (one 1/2/2019 completion exists at post level, but that is the umbrella program, not Fletchers Fork).
- TWRA schedule rows for "Fort Campbell Streams" must be **attributed to the cooperative federal-post program** (Post Fishing Permit; post land), not to a TWRA public-water program; TN-side events (Jun–Aug 2026) were TWRA-run, KY-side (Feb/Apr) KDFWR-run.
- iSportsman 2026 lists no May TWRA event while the TWRA schedule has week of 5/17 — minor divergence between TWRA plan and post notice.
- Access restricted (military reservation); one documented zero-fish event due to training shutdown.

## Searches / lookups run (≥8)
1. WebFetch KDFWR trout archive 2. WebFetch ftcampbell.isportsman.net (home) 3. WebFetch iSportsman Fishing.aspx 4. WebSearch `"Fletchers Fork" OR "Fletcher's Fork" Fort Campbell trout fishing` (KDFWR classification, CAM Reg 200-4, TWRA FB) 5. WebFetch iSportsman News.aspx (404) 6. TWRA 2026 schedule JSON (umbrella row) 7. Historical schedules 2005–2025 + winter programs (absence) 8. Completed feeds 2017–2026 9. ArcGIS row 10. TWRA regs text.

## Recommendation
Seasonal federal-program water. Months: **[2,4] for Fletchers Fork reach (KDFWR)**; umbrella "Fort Campbell Streams" **Feb–Aug**. Species rainbow + brown. Identity: reservation stream, Montgomery Co. TN / Christian Co. KY; site 36.574112,-87.511810; access Boiling Springs Rd; Post Fishing Permit + state license required; do NOT count as TWRA winter program.
