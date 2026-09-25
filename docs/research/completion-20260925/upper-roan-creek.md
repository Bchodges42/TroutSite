# Upper Roan Creek (Johnson County, TN) — Evidence Repair Research Log

Water: Upper Roan Creek, Johnson County, TN — upper/mainstem Roan Creek southwest of Mountain City; Roan Creek drains the Stone/Doe Mountain valley (source slopes of Snake Mountain near Trade, TN) and empties into the Watauga River arm of Watauga Lake. TWRA short name in 2006 GIS: "Roan Creek"; schedule name in every grid 2003–2026: "Upper Roan Creek".
Ledger claim under test: seasonal-stocked with catalog months `[12,1,2]` (SUSPECT — same Dec–Feb pattern proven wrong on other Region 4 creeks). 2024 archive carries completed row "Upper Roan Creek 05/21/2024" (a MAY completion).
Research date: 2026-09-25 (all live retrievals this date). Research ONLY; no agencies/businesses/anglers contacted.

---

## 1. Water identity / disambiguation

- **Wikipedia, "Roan Creek"** (retrieved 2026-09-25, https://en.wikipedia.org/wiki/Roan_Creek): Roan Creek "is a tributary of the Watauga River that rises near the border between" TN/NC; begins "along the slopes of Snake Mountain near Trade in Johnson County"; flows through Cherokee NF "in the valley between Stone Mountain and Doe Mountain"; "empties into the Watauga River at Watauga Lake". Establishes: Roan Creek = Watauga River tributary; NOT a Roan Mountain stream (Roan Mountain drains to Doe River/Roan Mountain Creek, a separate drainage). The "Roan Mountain flows?" hypothesis in the catalog is wrong — the name comes from the Roan Creek valley, not the bald.
  - Same-name risk noted: a third-party Facebook mention of "wild brook trout in Roan Creek (Doe River drainage, Sullivan County)" refers to a different water; all TWRA datasets (schedule grids 2003–2026, ArcGIS layer, GIS fact sheet) place Upper Roan Creek in Johnson County only.
- **TWRA 2026 stocking schedule JSON** (live tn.gov exceldriven datatable, 616 rows; retrieved 2026-09-25 via browser-context fetch; tn.gov blocks plain curl; local captures: `tmp/research/data/sched2026.json` md5 880350c17b1aa5183505023f5f96b0c9, `tmp/research/completion/trout_2026_live.json`): 4 rows, REGION "4", COUNTY "Johnson", LOCATION "Upper Roan Creek", TYPE **"Seasonal"**, SPECIES "Rainbow Trout", STOCKING WEEKs 3/22/2026, 4/19/2026, 5/17/2026, 6/14/2026. Fields: REGION, COUNTY, LOCATION, TYPE, STOCKING DAY, STOCKING WEEK, STOCKING MONTHS, SPECIES.
  - URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json
- **TWRA GIS fact sheet "Forge Creek & Roan Creek — Stocked Trout Program"** (TWRA GIS, "Produced by TWRA GIS (04/31/06 wmc)", PCAN #328796; Wayback capture 20100529120358; retrieved 2026-09-25): map shows Roan Creek and Forge Creek through Mountain City along US-421 (Doe Valley, Shady), "Stocking Site" symbols on Roan Creek, inset "Watauga" river system with Elizabethton/Watauga. Establishes TWRA's stocked reach is the upper creek near Mountain City (the modern "Upper Roan Creek"), Watauga basin.
  - URL: https://web.archive.org/web/20100529120358/http://tn.gov/twra/gis/troutpdf/Forge_Creek_and_Roan_Creek.pdf

## 2. TWRA ArcGIS stocking sites (coordinates)

**TWRA ArcGIS FeatureServer "TWRA_Trout_Stocking_Locations"** (live REST layer, 730 features; local capture `tmp/research/raw/arcgis_troutloc.json` md5 7b86d7002b9a2c5fda58636aefcb3cb3; query URL below; retrieved 2026-09-25 from the 2026-09-25 pull): 9 sites S1–S9, all County=JOHNSON, City=Mountain City, StockingProgram=**Spring**, WaterClass=stream, Species=rainbow, 20 fish/site (≈180 catchable rainbow per stocking event), Management=Private Land, DelayedHarvestSeason=None, no winter program. Reach runs ~7.5 river-miles S→N along the creek between 36.3617/−81.7564 and 36.4286/−81.7803:
- S1 Golf Course – Triplett Rd — 36.42858, −81.78028
- S2 Antioch Baptist Church — 36.42047, −81.76936
- S3 Culbertson Ln — 36.41269, −81.76661
- S4 Wallace Rd — 36.38403, −81.75833
- S5 Snyder Mill Rd — 36.38267, −81.76125
- S6 Fred Wallace Rd Bridge — 36.37989, −81.75997
- S7 Evergreen Baptist Church — 36.37675, −81.76050
- S8 Bulldog Rd Bridge — 36.37172, −81.75694
- S9 Volna Osborne Rd Bridge — 36.36167, −81.75642
  - URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=json

## 3. Month-by-month PLANNED stocking record (primary evidence)

Method: Wayback schedule PDFs parsed geometrically (pymupdf word coordinates after `remove_rotation()`; each grid's day-number header column sequence solved against that year's consecutive Sundays — the schedules themselves state "The dates listed are all Sundays… stocking event will happen within five days after the date listed"). The prior pass warned that naive `pdftotext -layout` column alignment is wrong for these grids; the geometric method maps every mark to a dated column with sub-tolerance matching (0 events unmatched in any year). 2003–2015 grids: region-4 pages with "X" marks; 2018–2025: "●" marks.

| Year | Schedule source (Wayback capture) | Upper Roan Creek stocking weeks (week-of Sundays) | Months supported |
|---|---|---|---|
| 2003 | sched03.pdf @ 20030404161556 | 2/23, 3/23, 4/20, 5/18 (4 monthly) | **Feb**, Mar, Apr, May |
| 2004 | sched04.pdf @ 20040210011352 | 2/22, 3/21, 4/18, 5/16 (4) | **Feb**, Mar, Apr, May |
| 2005 | sched05.pdf @ 20051124124935 | 2/20, 3/20, 4/17, 5/15 (4) | **Feb**, Mar, Apr, May |
| 2006 | sched06.pdf @ 20060604223344 | 3/19, 4/16, 5/14, 6/11 (4) | Mar, Apr, May, Jun |
| 2007 | sched07.pdf @ 20070227143540 | 3/18, 4/15, 5/13, 6/10 (4) | Mar, Apr, May, Jun |
| 2008 | sched08.pdf @ 20080909205030 | 3/16, 4/13, 5/11, 6/8 (4) | Mar, Apr, May, Jun |
| 2009 | sched09.pdf @ 20090418095714 | 3/22, 4/19, 5/17, 6/14 (4) | Mar, Apr, May, Jun |
| 2010 | sched10.pdf @ 20100326100325 | 3/21, 4/18, 5/16, 6/13 (4) | Mar, Apr, May, Jun |
| 2011 | sched11.pdf @ 20110111175732 | 3/20, 4/17, 5/15, 6/12 (4) | Mar, Apr, May, Jun |
| 2012 | sched12.pdf @ 20120418154111 | 3/18, 4/15, 5/13, 6/10 (4) | Mar, Apr, May, Jun |
| 2013 | sched13.pdf @ 20140112202401 | 3/17, 4/14, 5/12, 6/9 (4) | Mar, Apr, May, Jun |
| 2014 | sched14.pdf @ 20140412202632 | 3/23, 4/20, 5/18, 6/15 (4) | Mar, Apr, May, Jun |
| 2015 | sched15.pdf @ 20150319003402 | 3/22, 4/19, 5/17, 6/14 (4) | Mar, Apr, May, Jun |
| 2016 | NOT FOUND — Wayback CDX empty for sched16.pdf, 2016-Trout-Stocking-Schedule.pdf (also probed by prior Beaverdam pass) | — (gap; covered by program continuity) | — |
| 2017 | NOT FOUND — same probes empty | — (gap) | — |
| 2018 | 2018-Trout-Stocking-Schedule.pdf @ 20180717180317 | 3/25, 4/22, 5/20, 6/17 (4) | Mar, Apr, May, Jun |
| 2019 | 2019-Trout-Stocking-Schedule.pdf @ 20190109035923 | 3/24, 4/21, 5/19, 6/16 (4) | Mar, Apr, May, Jun |
| 2020 | Trout-Stocking-Schedule-Complete.pdf @ 20200424033427 | 3/22, 4/19, 5/17, 6/14 (4) | Mar, Apr, May, Jun |
| 2021 | Complete.pdf @ 20210119123626 (second capture 20210820055911, distinct digest, same row) | 3/28, 4/25, 5/23, 6/20 (4) | Mar, Apr, May, Jun |
| 2022 | Complete.pdf @ 20220221215138 & @ 20220519194927 (distinct digests, same row) | 3/27, 4/24, 5/22, 6/19 (4) | Mar, Apr, May, Jun |
| 2023 | Complete.pdf @ 20230219191239 | 3/26, 4/23, 5/21, 6/18 (4) | Mar, Apr, May, Jun |
| 2024 | Complete.pdf @ 20240219225857 & @ 20240520075643 (distinct digests, same row) | 3/24, 4/21, 5/19, 6/16 (4) | Mar, Apr, May, Jun |
| 2025 | Complete.pdf @ 20250208215445, @ 20250320072447, @ (web version "Trout Stocking (2025)", distinct digest), @ 20250902003710 — all four digest-distinct, all show 3/23, 4/20, 5/18, 6/15 | 3/23, 4/20, 5/18, 6/15 (4) | Mar, Apr, May, Jun |
| 2026 | Live exceldriven JSON (616 rows), TYPE "Seasonal" | 3/22, 4/19, 5/17, 6/14 (4) | Mar, Apr, May, Jun |

**Zero planned Upper Roan Creek stockings in December, January, July–November in any archived schedule 2003–2026 (21 scheduled years read; 4 monthly events every single year).** February appears only in 2003–2005. Local PDF md5s: sched03 1f4aec0d…, sched04 bc4da739…, sched05 6202a435…, sched06 f9ef66fa…, sched07 0412ec0b…, sched08 1eb660bd…, sched09 4f6e832d…, sched10 24e79144…, sched11 a92150a8…, sched12 e6bdf890…, sched13 2133ff8a…, sched14 443e890a…, sched15 ec44af71…; 2021–2025 Complete.pdf captures 9 distinct digests enumerated (replay-trap check passed — every capture's Upper Roan row identical Mar–Jun).

## 4. COMPLETED (destination-level) stocking evidence

- **"Coldwater Stocking" report dated 11-16-2018** (TWRA; full Jan–Nov 2018 completions; retrieved 2026-09-25 from prior-pass Wayback pull, `tmp/research/completion/cw_stocking_2019.pdf` md5 18ae5a512e286847754e96461508f752): "**Upper Roan Creek — 6/20/2018**" (Region 4). Within 5 days after scheduled week-of 6/17/2018. Spring-season completion.
- **"Coldwater Trout Stocking Schedule", updated 5/17/2022** (tn.gov PDF, Wayback capture 20220519195104, md5 matches local `data/cw/cw_2022may.pdf`; retrieved 2026-09-25): "**4 Upper Roan Creek — 04/25/2022**" (week-of 4/24/2022 +1 day).
  - URL: https://web.archive.org/web/20220519195104/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Coldwater-Trout_Stocking-Schedule.pdf
- **Same document, updated 5/3/2023** (capture 20230520021123, md5-matched): "**4 Upper Roan Creek — 04/26/2023**" (week-of 4/23/2023 +3 days).
- **Same document, 5/2024 revision** (capture 20240520075717, md5-matched): "**4 Upper Roan Creek — 04/25/2024**" (week-of 4/21/2024 +4 days).
- **Completed-stocking exceldriven feed, Wayback capture 20240607134309** (re-fetched live from Wayback 2026-09-25; URL below): "**4 Upper Roan Creek — 05/21/2024**" — the 2024 archive row named in the task; week-of 5/19/2024 +2 days. MAY completion, exactly on the spring program.
- **"Trout Stocking Report" updated 3/21/2025** (capture 20250322191030; retrieved 2026-09-25): no Upper Roan row in the Mar 13–21 window (first 2025 week = 3/23) — consistent; Stony Creek appears (see companion log).
- **Negative windows** — same "Trout Stocking Report" PDF: updated 9/27/2024 (capture 20240927221436), 11/8/2024 (capture 20241111215005), and the late-2025 revision (capture 20250902003641): **zero Upper Roan Creek completions** in any summer/fall window. Coldwater winter revisions (updated 2/18/2022 @ 20220221220911; 11/18/2022 @ 20221119230836; 2/17/2023 @ 20230219191256; 11/17/2023 @ 20231122001625; 2/2024 @ 20240219225901; 8/13/2024 @ 20240820014138): no Upper Roan Creek.
- **Live tn.gov page + feeds, 2026-09-25**: completed feed https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable.exceldriven.json ("Report updated as of 9/21/2026") lists only recent completions (Buffalo Creek, Leconte, W Prong Little Pigeon, tailwaters) — no Upper Roan (expected: season over). Page destination dropdown includes "Upper Roan Creek". The flattened page text also contains the string "Upper Roan Creek 5/10/2026", but the live completed report is absolutely-positioned and flattens column-order — 5/10/2026 does not match Upper Roan's planned week-of 5/17/2026 and is therefore NOT attributable to this water; excluded from evidence (flagged in §7).

Every verifiable completion (2018, 2022, 2023, 2024×2) lands within ≤5 days after a scheduled March–June week. **No completed Upper Roan Creek stocking is documented outside late February–June in any year.**

## 5. Holdover / reproduction (absence noted)

- TWRA Region IV trout fisheries reports 2017–2023 (Habera/Petre/Carter et al.; local text pulls of Fisheries Reports 18-01, 19-08, 21-05, 2022 & 2023 R4 reports): **zero mentions of Roan Creek or Upper Roan Creek** — no wild-population statements, no holdover surveys, no reproduction documentation. (Contrast Beaverdam Creek, which those reports discuss extensively.) The reports' "year-round trout fisheries" language applies only to TVA tailwaters (Norris, Ft. Patrick Henry, South Holston, Wilbur, Boone).
- Winter/coldwater program exclusions: TWRA "Winter Trout Stocking 2012/2013" tentative dates page (Wayback 20130110154309) lists only city ponds/W TN lakes/tailwaters — no Upper Roan; Coldwater-Trout_Stocking-Schedule.pdf winter revisions 2022–2024 (Feb/Nov captures) contain no Upper Roan; tailwater schedules 2018–2025 contain no Upper Roan.
- GBIF (API, bbox 36.35–36.44 N, −81.79–−81.75 W, retrieved 2026-09-25): species-filtered — Oncorhynchus mykiss 1 record (2021-07), Salvelinus fontinalis 1 (2023-05), Salmo trutta 0. Sparse; presence-in-summer leads only, not stocking or reproduction evidence.
- USGS NAS (API, TN/Johnson; 56 records): no "Roan" waterbody records — unproductive.
- Third-party (non-agency, low evidentiary weight): Double D Fly Co., "Roan & Doe Creek" (https://doubledfly.com/small-waters/roan-and-doe-creek, © 2026, posted Aug 6): "TWRA stocks the upper reaches of each (Upper Roan Creek and upper Doe Creek)"; "stocked rainbow trout (upper reaches)… put-and-take"; "No native brook-trout population is documented in either creek"; trout "held through the cool months" in the cool upper water (anglers' persistence impression, not agency data); lower reaches = warmwater (largemouth, spring walleye run Jan 1–Apr 30 with a single-hook rule on the lower reaches). Fishbrain "Roan Creek" (Johnson Co.): top user-reported species rainbow trout (14 catches), location 36°23′18.6″N 81°54′55.9″W near Butler/Mountain City.

## 6. Contradictions found

1. Catalog months `[12,1,2]` vs. **zero December/January planned events in 21 scheduled years (2003–2026)** and zero December/January completions or winter-program entries in every TWRA winter source checked. Catalog is wrong.
2. Catalog TYPE "Seasonal" is right, but the months are wrong: TWRA's own 2026 JSON TYPE="Seasonal" and ArcGIS StockingProgram="Spring"; 2006–2026 schedules all March–June.
3. 2024 archive "Upper Roan Creek 05/21/2024" (May) is fully consistent with the spring program — it contradicts Dec–Feb, not the seasonal verdict.
4. Early-era wrinkle: 2003–2005 grids start the season in late February (2/23, 2/22, 2/20) and end in May; from 2006 the window shifts to March–June. A "Feb–May 2003–2005 → Mar–Jun 2006–2026" description is exact; "Dec–Feb" fits no year.
5. Live-page flattened text "Upper Roan Creek 5/10/2026" mismatches the planned 5/17/2026 week (table-flattening artifact, excluded — see §4).

## 7. Searches run (distinct; ⚠ = unproductive)

1. WebSearch: "Upper Roan Creek" Tennessee trout stocking Johnson County ⚠ (search API 429 rate-limited)
2. WebSearch: "Roan Creek" Johnson County Tennessee Watauga River tributary Mountain City → Southeastern Naturalist 2008 (Doe Creek = tributary of Roan Creek, Watauga Reservoir/Watauga River)
3. WebSearch: "Upper Roan Creek" Tennessee → Wikipedia Roan Creek, Fishbrain, OnWater, DMRA campground
4. WebSearch: "Roan Creek" Johnson County walleye run Doe Creek fishing ⚠ partial (Watauga Lake walleye context only)
5. WebSearch: "Stony Creek"… winter/January queries (shared Region-4 context; see Stony log)
6. DuckDuckGo HTML mirror: "Upper Roan Creek" trout stocking ⚠ (blocked/empty)
7. DuckDuckGo HTML mirror: "Roan Creek" "Mountain City" trout ⚠ (blocked/empty)
8. Bing mirror: "Upper Roan Creek" trout stocking Tennessee ⚠ (ignored quotes)
9. Wayback CDX: sched03–sched15.pdf capture enumeration under state.tn.us/twra/fish/StreamRiver/stockedtrout/ (13 captures pinned)
10. Wayback CDX probes: sched16.pdf, sched17.pdf, 2016-/2017-Trout-Stocking-Schedule.pdf ⚠ (all empty — 2016/17 gap)
11. Wayback CDX: tn.gov/content/dam/tn/twra/documents/…Trout-Stocking-Schedule/Complete/Report/Coldwater families (captures pinned; digests md5-verified)
12. Wayback CDX: tn.gov/twra/gis/troutpdf/ folder (found Forge_Creek_and_Roan_Creek.pdf @ 20100529120358; fetched and parsed)
13. Wayback CDX prefix: trout-information-stockings/_jcr_content/ exceldriven JSON (one capture: 20240607134309; fetched live from Wayback and re-parsed)
14. Live fetch: 2026 exceldriven schedule JSON (616 rows) + completed feed + stockings page (dropdown + "updated as of 9/21/2026")
15. ArcGIS REST: TWRA_Trout_Stocking_Locations full-layer query (730 features; 9 Upper Roan sites extracted with coords)
16. USGS NAS API: TN/Johnson County occurrences ⚠ (no Roan waterbody records)
17. GBIF API: species-matched occurrence queries ×3 taxa + month extraction for the creek bbox
18. WebFetch: doubledfly.com small-waters index → /small-waters/roan-and-doe-creek
19. WebFetch: en.wikipedia.org/wiki/Roan_Creek
20. WebFetch: fishbrain.com/fishing-waters/k_T31iVL/roan-creek
21. WebFetch: hffbristol.com (High Country Fly Fisher) ⚠ (homepage; no Roan content)

## 8. Recommendation

**Kill catalog months [12,1,2]. Reclassify as seasonal with exact months March–June.**

- **Stocked fishery: strictly seasonal, March–June** (4 monthly week-of events every scheduled year 2006–2026; biweekly→monthly cadence; late-February starts documented only in 2003–2005). Species: catchable Rainbow Trout only (≈180/event across 9 sites, all Spring-program, private-land accesses). Suggested ledger string: `seasonal-trout (stocked Mar–Jun; some years late-Feb start 2003–2005)`.
- Type: `seasonal-trout`. Confidence **HIGH** — planned grids read geometrically for 21 of 23 years (2016–17 residual gap; covered by program continuity into the identical 2018–2026 pattern), 5 destination-level completions 2018–2024 all inside the window, all negative windows clean, TWRA TYPE="Seasonal"/StockingProgram="Spring", and no holdover/reproduction/agency-prose basis for any winter claim.
- Do not attribute the 2024 archive row ("…05/21/2024") to winter: it is a May completion of the June-cycle spring program.
