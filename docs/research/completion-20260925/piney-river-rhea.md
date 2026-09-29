# Piney River (Rhea County) — completion-log evidence repair

- **Ledger verdict under test:** `seasonal-stocked-trout`, YR flag set, no months.
- **Research date:** 2026-09-25 (all retrievals this date unless noted).
- **Water identity:** Piney River, Rhea County, TN; TWRA Region 3; Spring City area; rises on the Cumberland Plateau, flows through Piney Falls State Natural Area (TDEC), enters Watts Bar Reservoir (Tennessee River RM 533) near Spring City (USGS NAS locality text). Same-name disambiguation: NOT Piney River (Hickman Co — resolved separately, do-not-redo flag respected); NOT "Coops Creek" (Sequatchie Co — adjacent schedule row); NOT Piney Creek (Marion Co); NOT Sequatchie River near Crossville (a 1954 GBIF specimen at 35.782,−85.019 carries locality "Sequatchie River, 11 mi S of Crossville" — different water, excluded). Stocking sites (TWRA ArcGIS layer): "Piney Falls State Natural Area (S1)" 35.71507,−84.87960 and "(S2)" 35.71224,−84.88116, Spring City, NumStocked 2000, Management TDEC, Species rainbow.

## Sources consulted (per-source detail)

### S1. TWRA 2026 tentative trout stocking schedule (live JSON, 616 rows)
- Org TWRA; live 2026 schedule. Retrieved 2026-09-25 (cached `data/sched2026.json`; duplicate cache `_work/sched2026_live.json`, `_work/twra2026.json`).
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json
- Piney River rows: REGION 3, COUNTY Rhea, LOCATION "Piney River", SPECIES "Rainbow Trout":
  - TYPE "Seasonal": 2/22/2026, 3/22/2026, 4/19/2026 (three spring Sundays).
  - TYPE "Delayed Harvest": 10/25/2026.
- **Establishes:** planned 2026 = 3 spring weeks + 1 fall DH week. Note the DH TYPE label persisted into the live Sept-2026 feed even though the DH regulation was removed in Jan 2026 (see S6) — contradiction flagged in C1.

### S2. TWRA "Coldwater Trout Stocking Schedule" snapshots (cached `data/cw/cw_*.txt`)
- Org TWRA; snapshots 2022–2024, retrieved (cached) 2026-09-25.
- Piney rows (Region 3): 05/10/2022 (upd Aug 2022), 04/12/2023 (upd May 2023), 05/01/2024 (upd May 17, 2024).
- **Establishes:** spring completions 2022–2024 (destination-level). No Piney completion row in any cached snapshot outside spring.

### S3. Archived TWRA tentative schedules 2003–2015 (cached `data/schedpdf/sched03–15.pdf/.txt`)
- Org TWRA (state.tn.us via Wayback). Rows "Piney Creek"/"Piney River", Region 3 block; county Rhea shown explicitly 2004, 2010–2012; blank-county continuation rows elsewhere. pdfplumber char-level column mapping + visual verification for 2003 and 2015 (`tight_s03piney.png`, `tight_s15piney.png`).
  | Year | Marks | Months |
  |---|---|---|
  | 2003 | 2 | Mar 9, Apr 13 (visual) |
  | 2004 | 2 | Mar, Apr (visual; county Rhea explicit) |
  | 2005 | 2 | Mar 6, Apr 10 |
  | 2006 | 2 | Mar 5, Apr 9 |
  | 2007 | 2 | Mar 4, Apr 8 |
  | 2008 | 2 | Mar 2, Apr 6 |
  | 2009 | 2 | Mar 1, Apr 5 |
  | 2010 | 3 | Mar 14(?), Apr 11, May 9 |
  | 2011 | 3 | Mar, Apr, May |
  | 2012 | 3 | Apr 8, May 6 (+1 Mar) |
  | 2013 | 2 | Apr 7, May 5 (clinch_sched13) |
  | 2014 | 3 | Mar 2, Apr 6, May 4 |
  | 2015 | 4 | Mar 1, Apr 5, May 3 + one mark in the LAST (late-October) column (visual; name row now "Piney River") |
- **Establishes:** pure spring (Mar–May, 2–4 weeks) stocking 2003–2014; first fall mark 2015 — consistent with the DH program arriving mid-2010s. 2016–2017 schedules not retrieved (gap).

### S4. TWRA schedules 2018–2020 (cached `_work/sched2018/19/20.pdf`)
- "2018 TWRA STREAMS TROUT STOCKING SCHEDULE" (columns Feb–Oct; Sundays; +5-day slippage legend).
  - 2018: row "Rhea Piney River^DH": 5 marks — Mar 18, Apr 8 + 2 unmapped + Oct 28 (fall).
  - 2019: "Piney River^DH": Mar 24, Apr 21, May 19 + DH cell Oct 27.
  - 2020: 4 marks (spring) + DH cell Oct 25.
- **Establishes:** DH-labeled row by 2018 with fall DH week late Oct.

### S5. TWRA "Complete" schedule captures 2021–2025 (cached `_work/clinch_complete_*.pdf/.txt`)
- md5 replay control: 2023-02-19 ≡ 2023-02-20 (identical, counted once); 2025-06-24 capture gzip-mislabeled, decompressed and used.
  | Capture | Piney River^DH row |
  |---|---|
  | 2021-01-19 / 08-20 | 3 dots Mar 7, Apr 11, May 9 + DH cell Oct 24 (VISUAL `tight_c2021_piney.png`) |
  | 2022-02-21 / 05-19 | 3 dots Mar 6, Apr 10, May(?) + DH cell Oct 23 |
  | 2023-02-19/20 (dup) | 3 dots Mar 5, Apr 9, May 7 + DH cell Oct 22 |
  | 2024-02-19 / 05-20 | 3 dots Feb 25, Mar 31, Apr 28 + DH cell Oct 27 (VISUAL `tight_c2024_piney.png`) |
  | 2025-02-08 / 03-20 / 06-24 / 09-02 | 4 dots Feb 23, Mar 23, Apr 20, May 18 + DH cell Oct 26 (VISUAL `tight_c2025_piney.png`) |
- **Establishes:** 3 spring weeks (Feb–May, sliding earlier into Feb by 2024) + one late-Oct DH week, every year 2021–2025.

### S6. TWRA trout regulation 2026-27 (eRegulations "Trout Regulations", retrieved 2026-09-25)
- URL: https://www.eregulations.com/tennessee/fishing/trout-regulations (page "Last Updated: September 15, 2026").
- Changes table (verbatim): "**Piney River, delayed harvest area — [2025 Previous] Listed as a delayed harvest area, catch-and-release Nov. 1–Feb. 28. [2026 New] Delayed harvest designation removed entirely; no longer listed on this page.**" (Also: Big Soddy Creek DH start moved Oct 1→Nov 1; no mention of Buffalo Creek changes.)
- Current Delayed Harvest Areas list (Big Soddy, Buffalo Creek, Doe, Hiwassee, Acorn Lake, Paint, Tellico): **Piney River absent.**
- **Establishes:** Piney-Rhea DH existed through the 2025-26 season with C&R Nov 1–end of Feb; REMOVED for 2026-27 (approved by TFWC Jan 8–9, 2026).

### S7. DH removal — news corroboration
- Chattanoogan.com: "1st 2026 Commission Meeting Set For Jan. 8-9 In Dyersburg" (Jan 5, 2026) — Fisheries Division recommended "removing the delayed harvest regulation for trout on the Piney River" (search snippet); "TFWC Wraps Up First Commission Meeting Of 2026 In Dyersburg" (Jan 9, 2026) — "Among the changes is the removal of delayed harvest regulation for trout on the Piney River in Rhea County" (snippet; full-page fetch failed — article URL guess 404'd).
- RadioNWTN / Robertson County Source (Dec 19, 2025): public-comment period list included "Removing the delayed harvest regulation for trout on the Piney River (Rhea County)".
- 1450 WLAF (Jan 14, 2026): Commission approved 2026-27 fishing regulations.
- FOX Chattanooga, "Mark your calendar for winter trout fishing" (published Dec 5, 2023; fetched 2026-09-25): "**On Dec 12th, Rainbow Trout were stocked into the Piney River (Rhea County)**, Big Soddy Creek (Hamilton County), and North Chickamauga Creek… Piney River and Big Soddy Creek are Delayed Harvest Areas, catch-and-release with artificial lures only through the last day of February… TWRA plans to release approximately 75,000 rainbow trout… through March [2023-24 winter program]. Hatch Outfitters volunteers helped distribute fish."
- **Establishes:** exact proposal→approval→codification chain for the DH removal; and a ONE-TIME December 12, 2023 winter DH delivery (outside the scheduled Oct week — winter-program assist).

### S8. DH designation history
- Tennessee Trout Management Plan 2017–2027 (TWRA; cached): "…first introduced in Tennessee in Gatlinburg (four streams) during 1997. Subsequently, TWRA also established DH areas on Paint Creek, Tellico River, Hiwassee River, and **Piney River**. The goal … provide additional fall and winter fishing opportunities with relatively few hatchery trout … lightly stocking streams in the fall and allowing catch-and-release angling until March…"
- StockedTrout2016 layer (prior-pass result carried in briefing): Piney = "Delayed Harvest Nov 1 to last day of Feb" — pins designation to ≤2016; consistent with first fall stocking mark 2015 and DH-labeled rows 2018+.
- eRegulations 2010-era coverage (search snippet): Piney DH described "November through March" C&R (older phrasing of the Nov 1–Feb 28 season).
- **Establishes:** DH designated between the 2015 schedule (first fall mark) and 2016 layer; Nov 1–Feb 28 C&R season thereafter; removed Jan 2026. Exact TWRC proclamation not retrieved (IA offline).

### S9. TWRA ArcGIS stocking-locations layer (cached `_work/clinch_stock_locs_all.json`)
- Sites S1/S2 "Piney Falls State Natural Area", StreamName "Piney River", Region 3, RHEA, Spring City, StockingProgram "Spring", Species rainbow, NumStocked 2000/site, Management TDEC; DelayedHarvestSeason field null (layer does not carry DH text for Piney — same staleness pattern as Buffalo).
- Establishes: coordinates, site names, per-site quantity.

### S10. Community/biodiversity checks (holdover/reproduction)
- iNaturalist API (retrieved 2026-09-25, `data/inat_piney_rhea_fish.json`): Salmonidae in bbox 35.58–35.85 / −85.02 to −84.70: **0 observations.**
- GBIF API (same bbox): 1 record — Oncorhynchus mykiss PRESERVED_SPECIMEN 1954, 35.7822,−85.0191, "Fish RM & DM Bailey — Sequatchie River, 11 mi S of Crossville" = different water (excluded).
- USGS NAS county=Rhea: 21 records, NO salmonids; locality "Tennessee River (R.M. 533) at mouth of the Piney River near Spring City" (geography confirmation only).
- Fishbrain page fishbrain.com/fishing-waters/ICsJswT_/piney-river (fetched 2026-09-25): species reported = Smallmouth bass, Rock bass, Largemouth bass, Yellow perch; **no trout catches reported**; coords 35°42′09″N 84°54′14″W (~2.5 mi from Spring City).
- **Establishes:** no reproduction/holdover evidence; no community trout records (stocked trout confined to DH reach/season; mainstream fishery is warmwater).

## Contradictions & traps found
1. **C1 — DH removed but 2026 schedule still labels 10/25/2026 row TYPE "Delayed Harvest"** (S1 vs S6/S7). The stocking event appears to continue (fall DH-style week), but the C&R regulation (Nov 1–Feb 28) no longer applies after the 2026-27 regs took effect. Ledger must not treat the DH label as an active regulation for 2026+.
2. **C2 — no months in ledger:** evidence gives a precise spring window + fall DH week; ledger omission unforced.
3. **C3 — "year-round" YR flag:** no continuous stocking (2–5 events/yr); no holdover/reproduction documentation anywhere (S10). Does not survive.
4. **C4 — same-name noise:** 1954 GBIF "Piney bbox" specimen is actually Sequatchie River near Crossville; Fishbrain/Wolcott-CO "Piney River" trout reports are a different state. Hickman-Co Piney excluded per briefing.
5. **C5 — fall delivery slippage:** DH cell = planned week (late Oct); FOX reports an extra Dec 12, 2023 delivery — schedule rows alone undercount winter-program assists.
6. ArcGIS DelayedHarvestSeason field null for Piney sites while regs/layer text exist for other DH streams (same layer staleness as Buffalo).

## Months-by-year stocking table (planned weeks; all Rainbow Trout)
| Year | Feb | Mar | Apr | May | Jun–Sep | Oct | Nov | Dec |
|---|---|---|---|---|---|---|---|---|
| 2003 | – | W(3/9) | W(4/13) | – | – | – | – | – |
| 2004 | – | W | W | – | – | – | – | – |
| 2005 | – | W(3/6) | W(4/10) | – | – | – | – | – |
| 2006 | – | W(3/5) | W(4/9) | – | – | – | – | – |
| 2007 | – | W(3/4) | W(4/8) | – | – | – | – | – |
| 2008 | – | W(3/2) | W(4/6) | – | – | – | – | – |
| 2009 | – | W(3/1) | W(4/5) | – | – | – | – | – |
| 2010 | – | W | W | W | – | – | – | – |
| 2011 | – | W | W | W | – | – | – | – |
| 2012 | – | (W) | W(4/8) | W(5/6) | – | – | – | – |
| 2013 | – | – | W(4/7) | W(5/5) | – | – | – | – |
| 2014 | – | W(3/2) | W(4/6) | W(5/4) | – | – | – | – |
| 2015 | – | W(3/1) | W(4/5) | W(5/3) | – | W(late-Oct mark) | – | – |
| 2016–2017 | gap (no schedule retrieved; DH in force ≤2016 per 2016 layer) | | | | | | | |
| 2018 | – | W(3/18) | W(4/8) | – | – | W(10/28) | – | – |
| 2019 | – | W(3/24) | W(4/21) | W(5/19) | – | DH(10/27) | – | – |
| 2020 | – | W | W | W | – | DH(10/25) | – | – |
| 2021 | – | W(3/7) | W(4/11) | W(5/9) | – | DH(10/24) | – | – |
| 2022 | – | W(3/6) | W(4/10) | (5/10 done) | – | DH(10/23) | – | – |
| 2023 | – | W(3/5) | W(4/9) | W(5/7) | – | DH(10/22) | – | done 12/12/2023 (winter program) |
| 2024 | W(2/25) | W(3/31) | W(4/28) | – | – | DH(10/27) | – | – |
| 2025 | W(2/23) | W(3/23) | W(4/20) | W(5/18) | – | DH(10/26) | – | – |
| 2026 | W(2/22) | W(3/22) | W(4/19) | – | – | DH wk(10/25) | – | – |
Completions: 5/10/2022, 4/12/2023, 5/1/2024 (snapshots); 12/12/2023 (FOX). DH C&R fishing season (not stocking): Nov 1–end of Feb through 2025-26; removed for 2026-27.

## Verdict / recommendation
- **Verdict: seasonal-stocked-trout. Stocking months: [2,3,4,5] spring weeks (2–4 per year; March–May core, extending into February 2024–2026) + [10] one Delayed-Harvest week (2015–2026, late Oct) + a documented one-off December delivery (12/12/2023). Jun–Sep: nothing; Jan: nothing.**
- **Year-round does NOT survive.** 2–5 stocking events/year; zero holdover/reproduction evidence (no iNat trout, no GBIF on-water record, no NAS record, no trout reports on Fishbrain). The only winter element was the DH C&R season (Nov 1–Feb 28), a fishing regulation — and it was REMOVED effective 2026-27 (TFWC, Jan 8–9, 2026). YR flag should be cleared.
- Add DH annotation: "DH water ≤2016–2025 (C&R Nov 1–end of Feb; fall DH stocking late Oct); DH regulation removed Jan 2026 (2026-27 regs) while the fall stocking week continues in the 2026 schedule."
- Confidence: HIGH on spring months and fall DH week (15 schedule years + completions + visuals); MEDIUM on 2016–2017 (gap) and on the DH-designation exact year (2015–2016; proclamation not retrievable, Internet Archive offline 2026-09-25).
- Gaps: 2016–2017 schedule pages; the TWRC proclamation that designated Piney DH; the outcome question of whether the Oct 2026 DH-labeled stocking is actually re-labeled in TWRA's next schedule revision.

## Searches run (incl. unproductive)
1. WebSearch: TWRA DH waters "Buffalo Creek" Grainger "Piney River" Rhea — surfaced Chattanoogan Jan-2026 removal lead + Oct 1–Jan 31 Buffalo window.
2. WebSearch: TWRA "delayed harvest" Oct 1 Feb 28 artificial lures list — statewide DH text; Piney "historically Nov 1" lead.
3. WebSearch: Chattanoogan January 2026 TWRA remove delayed harvest Piney Rhea proposal — confirmed Chattanoogan articles (Jan 5, Jan 9, 2026).
4. WebSearch: TWRA delayed harvest removal Piney River Rhea Chattanoogan (retry) — full confirmation incl. eregulations 2026-27 "Removed delayed harvest regulation".
5. WebSearch: site:chattanoogan.com TWRA delayed harvest Piney River — got TFWC wrap-up article reference.
6. WebSearch: chattanoogan TFWC January 2026 proposals — Jan 5 preview confirmed.
7. WebSearch: eregulations.com tennessee trout fishing delayed harvest URL — path discovery.
8. WebSearch: site:eregulations.com tennessee trout delayed harvest — unproductive.
9. WebSearch: eregulations tennessee fishing trout regulations page — unproductive (rate-limited variants).
10. WebSearch: news.tn.gov TFWC January 2026 fishing changes — partial (1450 WLAF Jan 14, 2026 approval).
11. WebSearch: "Piney River" Spring City Rhea trout delayed harvest fishbrain — removal chain + FOX Dec 12 stocking lead.
12. WebSearch: Piney River Tennessee trout DH Rhea stocking (variant) — corroborating summaries.
13. WebSearch: site:fishbrain.com Piney River Tennessee — only Colorado namesake; unproductive for TN.
14. WebSearch: TWRA "delayed harvest" trout "Piney River" — RadioNWTN Dec 19, 2025 comment-period item (removal proposal list).
15. WebSearch: Piney Falls State Natural Area Spring City trout stocking TWRA TDEC — FOX Chattanooga winter-trout article + TWRA stocking page; no TDEC-stocking-in-SNA evidence.
16. WebFetch foxchattanooga.com winter-trout article — Dec 12, 2023 Piney stocking confirmed (published Dec 5, 2023).
17. WebFetch fishbrain Piney-Rhea page — species list, no trout.
18. iNat API bbox Salmonidae — zero.
19. GBIF API bbox Salmonidae — one excluded specimen.
20. NAS API county=Rhea — no trout.
Offline: cached 2003–2025 schedules (extracted+visuals), coldwater snapshots, trout plan, stocked-trout 2012-13 page (winter program list — no Piney), storymap (no Piney), proclamation XMLs (no match), Wayback CDX (IA offline 503/504 on 2026-09-25), DDG HTML (anomaly block), Bing HTML (noise).
