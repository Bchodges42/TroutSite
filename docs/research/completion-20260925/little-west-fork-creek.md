# Little West Fork Creek (`little-west-fork-creek`) — completion research log

Water: Little West Fork Creek, Fort Campbell Military Reservation, Montgomery County, TN (KY line adjacent). Catalog months were [12,1,2] (suspect). Research date: 2026-09-25. Research only; no agency contact.

## HEADLINE VERDICT
- **Same Fort Campbell association as Fletchers Fork — CORRECT.** Little West Fork is the principal trout stream of the post's TN-side reaches (Pumphouse Rd, Mabry Rd, McNair Rd, Patrol Fence Rd access sites).
- Program: **cooperative federal-post program** — TWRA stocks the TN-side sites under schedule line "Fort Campbell Streams" (**Feb–Aug** seasonal; in 2026 TWRA ran the Jun 25 / Jul 22 / Aug 26 events), **KDFWR stocks the KY side (Feb 12 + Apr 7, 2026, incl. brown trout)**; access under CAM Reg 200-4 with Post Fishing Permit.
- **Catalog [12,1,2] is WRONG.** Recommend seasonal, months **[2,4,5,6,7,8]** (Feb–Aug umbrella; Feb/Apr KDFWR, Apr–Aug TWRA). Species: rainbow AND brown.
- Confidence: HIGH.

## Sources (retrieval 2026-09-25 unless noted)

1. **Fort Campbell iSportsman — Fishing page** (federal), https://ftcampbell.isportsman.net/Fishing.aspx, retrieved 2026-09-25. 2026 stocking dates: **Feb 12, 2026 (from KDFWR, 1200 rainbow)** — 101st Airborne Division Bridge 240, East End Rd 240, Mabry Rd 480, Three Bridges 240; **Apr 7, 2026 (from KDFWR, 4450, rainbow+brown)** — Mabry Rd 625 brown+240 rainbow, Woodlawn Bridge 625+240, East End Rd 625+240, Three Bridges 625+240, Fletchers Fork 750+240; **Jun 25 / Jul 22 / Aug 26, 2026 (from TWRA, ~1008–1024 rainbow each)** — Mabry Rd, **Pumphouse Road**, Three Bridges, 101st Airborne Road Bridge. All Mabry/Pumphouse/Three Bridges/101st Airborne sites are Little West Fork Creek access points. Establishes: months Feb–Aug 2026 and site names.
2. **TWRA 2026 schedule JSON** (`data\sched2026.json`): "REGION 2, Montgomery, **Fort Campbell Streams**, Seasonal, weeks 2/15, 4/19, 5/17, 6/21, 7/12, 8/23/2026, Rainbow Trout" — umbrella row under which Little West Fork is stocked.
3. **TWRA trout regulations 2026** (`data\ereg_troutregs_2026.html`; https://www.tn.gov/twra/fishing-regs/trout-regulations.html): "…including Dry Creek, **Little West Fork** and Fletcher's Fork are stocked with **rainbow and brown trout**… Post Fishing Permit is required… Fort Campbell, KY 42223… https://ftcampbell.isportsman.net/Permits.aspx".
4. **KDFWR Yearly Trout Stocking Archive**, https://fw.ky.gov/Fish/Pages/trout_archive.aspx: **Feb 12, 2026 — Fort Campbell (Little West Fork Creek), Christian County — 960 rainbow; Apr 7, 2026 — 960 rainbow + 2500 brown**. Establishes KY-side reach, species incl. brown.
5. **Historical TWRA schedules 2005–2025** (corpus detailed in hurricane-creek log): "Fort Campbell Streams" 6–8 events/yr, Mar–Aug (2005–2015), Feb–Aug (2018–2025). Winter-program lists (`winter-trout-stocking-report.pdf` 2018/2019 captures) never include it.
6. **Completed feeds**: Ft. Campbell completions 7/18/2017 (tn.gov Jan-2018 completed table, Wayback 20180112212428), 3/15/2018 & 3/15/2019 (2019 page captures), 1/2/2019 & 8/28/2019 (Coldwater completed reports), **8/28/2026 (Sept-2026 live completed feed, "Region 2, Ft. Campbell")**. 2024 archive (Apr–Jun window; md5 b8b2072e… exact replay): absent (no event in window). Months with completions: Jan, Mar, Jul, Aug.
7. **TWRA ArcGIS stocking locations** (`raw\arcgis_troutloc.json`): four sites, all StreamName "Little West Fork Creek", Region 2, MONTGOMERY, StockingProgram "Spring", Species rainbow, **Management "Other"** (post land), Hours "Contact Region 2":
   - OBJECTID 8 "Pumphouse" — 36.620128436, -87.506167047
   - OBJECTID 9 "Patrol Fence Road" — 36.607841384, -87.449715676
   - OBJECTID 10 "Mabry Rd" — 36.622217205, -87.513120435
   - OBJECTID 13 "McNair Rd." — 36.613110000, -87.495840000
   (iSportsman's "Three Bridges", "101st Airborne Division/Road Bridge", "East End Rd", "Woodlawn Bridge" are additional post access points not in the TWRA GIS extract.)
8. **CAM Regulation 200-4** (post fishing rules; cited by iSportsman + TWRA regs) — permit and access framework.
9. **TWRA Facebook post** (via search 2026-09-25): "Fort Campbell streams stocked with over one thousand rainbow trout" — public confirmation of TWRA-run post events.
10. **Identity/geography**: Little West Fork of the West Fork of the Red River? (Note: the stream is "Little West Fork" on the Fort Campbell reservation; do not confuse with West Fork Stones River (Rutherford/Davidson winter water) or West Fork Shoal Creek (Lawrence Co.) — those are separate catalog entries.)

## Months-by-year table (umbrella "Fort Campbell Streams")
| Years | Schedule months | Little West Fork documented |
|---|---|---|
| 2005–2015 | Mar–Aug (6/yr) | umbrella row only |
| 2018–2020 | Feb–Aug (~7/yr) | umbrella row |
| 2021–2025 | Feb–Aug (7–8/yr) | umbrella row |
| 2026 | TWRA: Feb 15–Aug 23; post: **Feb 12 (960 RB, KDFWR), Apr 7 (960 RB + 2500 BN, KDFWR), Jun 25, Jul 22, Aug 26 (TWRA, rainbow)** | named sites (Mabry/Pumphouse/etc.) |
| Completions | 7/18/2017, 3/15/2018, 1/2/2019, 3/15/2019, 8/28/2019, 8/28/2026 | post-level |

## Species
Rainbow Trout (all) + **Brown Trout** (KDFWR Apr 2026: 2500 at LWF; TWRA regs confirm both species on post streams).

## Contradictions / caveats
- Catalog [12,1,2] contradicted (program is Feb–Aug; zero December evidence).
- TWRA GIS StockingProgram field says "Spring" while the operative program runs through August — ArcGIS field is coarse; trust schedules + post notices.
- Management "Other" (not TWRA): attribute program rows to the federal post cooperative program; TN-side 2026 summer events were TWRA-executed.
- iSportsman lists no May 2026 event while TWRA schedule has week of 5/17 — divergence noted.
- Do not conflate with "West Fork Stones River" (a true TWRA winter water in the same region) — schedule rows are distinct.

## Searches / lookups run (≥8)
1. WebFetch iSportsman home 2. WebFetch iSportsman Fishing.aspx 3. WebFetch iSportsman News.aspx (404) 4. WebFetch KDFWR archive (LWF rows) 5. WebSearch `"Fletchers Fork" OR "Fletcher's Fork" Fort Campbell trout` (returns LWF context too) 6. WebSearch `TWRA winter trout stocking schedule news release` (absence of LWF in winter) 7. TWRA 2026 JSON + historical schedules 2005–2025 (umbrella rows) 8. Winter programs 2018-19/2019-20 (absence) 9. Completed feeds 2017–2026 10. ArcGIS 4 site rows 11. TWRA regs text.

## Recommendation
Seasonal federal cooperative program water: months **[2,4,6,7,8]** documented for named-site stockings in 2026 (program umbrella **Feb–Aug**). Species rainbow + brown. Coordinates: Pumphouse 36.6201,-87.5062; Mabry Rd 36.6222,-87.5131; McNair Rd 36.6131,-87.4958; Patrol Fence Rd 36.6078,-87.4497. Attribute to "Fort Campbell Streams (federal post program; TWRA + KDFWR executors)"; Post Fishing Permit required; NOT a TWRA winter water.
