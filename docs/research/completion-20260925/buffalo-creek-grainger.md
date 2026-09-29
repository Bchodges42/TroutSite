# Buffalo Creek (Grainger County) — completion-log evidence repair

- **Ledger verdict under test:** `seasonal-stocked-trout`, months [12,1,2], YR flag set (internally suspicious: winter window + year-round flag)
- **Research date:** 2026-09-25 (all retrievals this date unless noted)
- **Water identity:** Buffalo Creek, Grainger County, TN; Region 4 (TWRA); stocking reach at/near Rutledge. Same-name disambiguation: NOT Little Buffalo River (Lawrence Co, Region 2 — its rows co-occur in every feed and were kept separate); NOT the Buffalo River (Buffalo/Perry/Humphreys counties); NOT any other TN "Buffalo" water. All rows used below are county-tagged GRAINGER / Region 4 in the source. Coordinates of stocking sites (TWRA ArcGIS layer, 7 sites): 36.1992–36.2045 N, −83.5591 to −83.5556 W, City=Rutledge.

## Sources consulted (per-source detail)

### S1. TWRA 2026 tentative trout stocking schedule (live JSON, 616 rows)
- Title: "Trout Fishing & Stockings in Tennessee" datatable JSON; org: TWRA (tn.gov). Observation date: live 2026 schedule. Retrieved 2026-09-25 (cached prior pass `data/sched2026.json`, re-grepped).
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json
- Fields: REGION / COUNTY / LOCATION / TYPE / STOCKING DAY / STOCKING WEEK / STOCKING MONTHS / SPECIES.
- Buffalo Creek rows: REGION 4, COUNTY Grainger, LOCATION "Buffalo Creek", SPECIES "Rainbow Trout".
  - TYPE "Seasonal": 29 weekly rows, STOCKING WEEK 2/8/2026 → 8/23/2026 (every Sunday Feb 8, 15, 22, Mar 1, 8, 15, 22, 29, Apr 5, 12, 19, 26, May 3, 10, 17, 24, 31, Jun 7, 14, 21, 28, Jul 5, 12, 19, 26, Aug 2, 9, 16, 23).
  - TYPE "Delayed Harvest": 1 row, STOCKING WEEK 10/4/2026.
- **Establishes:** planned 2026 stocking = weekly Feb 8–Aug 23 + one fall DH week Oct 4. NO December/January rows.
- Not establishes: actual deliveries (planned only).

### S2. TWRA completed-stockings feeds
- (a) **2024 archive** (54 completed rows, window 5/6–6/4/2024; capture dated 2024-06-07; cached `data/committed2024.json`): `{"Region":"4","Destination":"Buffalo Creek","Stocking Date":" 05/30/2024"}`. Same feed also carries Region 2 "Little Buffalo River" 05/14/2024 (different water — disambiguation check).
- (b) **Live feed** (tn.gov stockings page, rendered 2026-09-25; cached `data/committed_live.json`): `{"Region":"4","Destination":"Buffalo Creek","Stocking Date":"08/27/2026"}`.
- URL (page): https://www.tn.gov/twra/fishing/trout-information-stockings.html
- **Establishes:** destination-level completions 5/30/2024 and 8/27/2026 — a MAY completion (outside ledger window) and an AUGUST completion. Confirms program far wider than Dec–Feb.

### S3. TWRA "Coldwater Trout Stocking Schedule" snapshots (tn.gov, cached `data/cw/cw_*.pdf/txt`)
- Org TWRA; each file headed "Coldwater Trout Stocking Schedule, updated <date>"; lists last completion per destination. Retrieved (cached) 2026-09-25; snapshots dated 2022–2024. Base URL: https://www.tn.gov/twra/fishing/coldwater-stockings.html (page variant; cached PDFs from prior pass).
- Buffalo Creek rows (Region 4): 05/13/2022 (upd 5/2022), 08/12/2022 (upd 8/2022), **11/09/2022 (upd 11/18/2022)**, 04/28/2023 (upd 5/2023), 08/17/2023 (upd 8/2023), **11/09/2023 (upd 11/2023)**, 05/10/2024 (upd 5/17/2024), 08/09/2024 (upd 8/2024). ("Buffalo Springs Fish Hatchery 08/17/2023" is a separate destination.)
- **Establishes:** completions in Feb–May, Jul–Aug, and NOVEMBER (fall DH deliveries 11/09/2022 and 11/09/2023). No Dec/Jan completions in any snapshot.

### S4. Archived TWRA tentative schedules 2003–2015 (state.tn.us, via Wayback; cached `data/schedpdf/sched03–15.pdf/.txt`)
- Org: TWRA (state.tn.us). Titles "2003…2015 TWRA TENTATIVE TROUT STOCKING SCHEDULE"; columns = "WEEK OF" dates Feb–Oct. Retrieved from Wayback captures (prior passes; re-analyzed 2026-09-25). Originals: http://www.state.tn.us/twra/sched03.pdf … sched15.pdf (via web.archive.org).
- Method: pdfplumber char-level extraction of the Grainger/Buffalo row mapped to week columns, PLUS visual verification of rendered rows for 2003, 2004, 2005, 2015 (`data/_img/tight_s0*.png`, `tight_s1*.png`).
- Buffalo Creek row by year (Region 4 table; X = planned week; all Rainbow Trout):
  | Year | Marks | Span (months) |
  |---|---|---|
  | 2003 | 28 X, continuous weekly | Feb 16 – early Sep (visual) |
  | 2004 | ~28 X, continuous weekly | Feb – Sep (visual) |
  | 2005 | 29 X, continuous weekly | Feb 13 – Sep (visual) |
  | 2006 | 29 X weekly | Feb 12 – Aug 13+ |
  | 2007 | 29 X weekly | Feb 11 – Aug 12+ |
  | 2008 | 29 X weekly | Feb 10 – Aug 10+ |
  | 2009 | 29 X weekly | Feb 8 – Aug 9+ |
  | 2010 | 29 X weekly | Feb 14 – Aug 15+ |
  | 2011 | 29 X weekly | Feb 13 – Aug 21+ |
  | 2012 | 29 X weekly | Feb 12 – Aug 12+ |
  | 2013 | 29 X weekly | Feb 10 – Aug 11+ (clinch_sched13) |
  | 2014 | 29 X weekly | Feb 16 – Aug 10+ |
  | 2015 | 29 X weekly | Feb 15 – Aug 9+ |
  - (Sept columns present in template; the last weekly marks in several years fall in early Sep.)
- **Establishes:** Buffalo Creek was stocked essentially EVERY WEEK mid-February through August/September in every archived year 2003–2015. No Nov/Dec/Jan marks anywhere. 2016–2017 schedules NOT retrieved (gap).
- Note: adjacent row "Grainger Puncheon Camp Creek" also weekly; identity risk handled by row alignment.

### S5. TWRA schedules 2018–2020 (tn.gov PDFs, cached `_work/sched2018/19/20.pdf`)
- Titles "2018 TWRA STREAMS TROUT STOCKING SCHEDULE" etc.; "dates listed are all Sundays… event within five days after the date listed." Columns Feb–Oct. Retrieved 2026-09-25 (cached).
- 2018: row "Grainger Buffalo Creek^DH" — weekly dot-run Feb–Sep + fall DH cell (≈Sep 30).
- 2019: "Buffalo Creek^DH" weekly Feb 17–Sep 1 + DH cell Sep 29.
- 2020: "Buffalo Creek^DH" weekly Feb 16–Aug 30 + DH cell Sep 27.
- **Establishes:** DH superscript on the water name begins no later than the 2018 schedule; weekly Feb–Sep program continues.

### S6. TWRA "Complete" schedule captures 2020–2025 (tn.gov PDFs via Wayback; cached `_work/clinch_complete_*.pdf/.txt`)
- md5 check (replay-trap control): 2023-02-19 capture ≡ 2023-02-20 capture (identical md5 3a748e6b…, same file; counted once). 2025-06-24 capture was gzip-mislabeled, decompressed OK. Others unique.
- Extracted rows (dot cells = weekly events; "DH" cell = delayed-harvest stocking week):
  | Capture | Buffalo Creek row |
  |---|---|
  | 2020 | weekly dots Feb–Aug 30; DH cell Sep 27 |
  | 2021-01-19 / 2021-08-20 | weekly dots Feb 21–Sep 5 (29, VISUALLY verified `tight_c2021_buff.png`); DH cell Sep 26 |
  | 2022-02-21 / 2022-05-19 | weekly Feb 13–Aug 28; DH cell Sep 25 |
  | 2023-02-19/20 (dup) | weekly Feb 12–Aug 27; DH cell (late Sep) |
  | 2024-02-19 / 2024-05-20 | weekly Feb 11–Aug 25 (VISUALLY verified `tight_c2024_buff.png`); DH cell Sep 29 |
  | 2025-02-08 / 2025-03-20 / 2025-06-24 / 2025-09-02 | weekly Feb 9–Aug 24 (VISUALLY verified `tight_c2025_buff.png`); DH cell Sep 28 |
- **Establishes:** unbroken weekly Feb–Sep program 2020–2025 plus a single fall DH stocking week (late Sep; executed in early Nov per S3 in 2022–2023).

### S7. TWRA trout regulation (2026-27), eRegulations.com "Trout Regulations" page
- Title: "Trout Regulations — Tennessee Fishing"; org: TWRA/eRegulations (JD State Formats); "Last Updated: September 15, 2026". Retrieved 2026-09-25.
- URL: https://www.eregulations.com/tennessee/fishing/trout-regulations
- Key text (verbatim): **"Delayed Harvest Areas — In the areas listed below, the harvest or possession of trout is prohibited during the catch-and-release season. During the catch-and-release season, only artificial lures are permitted and the use or possession of bait is prohibited."** — list includes: "Big Soddy Creek: upstream of Back Valley Road — Nov. 1–Feb. 28. **Buffalo Creek: Mill dam downstream to Buffalo Springs WMA boundary — Catch-and-release season Oct. 1–Jan. 31.** Doe River: Oct. 1–Feb. 28. Hiwassee River: Oct. 1–Feb. 28. Montgomery Bell SP Acorn Lake: Dec. 1–Mar. 31. Paint Creek: Oct. 1–Feb. 28. Tellico River: Oct. 1–Feb. 28."
- Same page, Special Trout Regulations: "**Buffalo Creek and tributaries within the WMA boundary (Grainger County):** From the mill dam upstream — closed year-round to all fishing; harvest/possession of bait-harvesting gear prohibited. **From the mill dam downstream — open to fishing year-round by rod and reel method only**; closed year-round to all harvest of bait."
- Changes table: 2026 changes list only Big Soddy (start moved to Nov 1) and Piney River (DH removed); **no change to Buffalo** — its DH (Oct 1–Jan 31) predates the 2026 cycle.
- **Establishes:** Buffalo Creek is an ACTIVE delayed-harvest water with a WINTER catch-and-release season Oct 1–Jan 31 (explains, and does not equal, winter stocking); the stream is legally open to fishing YEAR-ROUND below the mill dam.

### S8. Schedule legend (TWRA/eregulations stocking schedule PDF, cached `_work/ereg_trout_stocking.pdf` and 2018–2025 PDFs)
- Verbatim: "**DH** - Stream is subject to delayed harvest regulations. Check fishing guide for specific regulation dates." Also "The dates listed are all Sundays. The stocking event will happen within five days after the date listed."
- Establishes: reading of the ^DH superscript and planned-vs-executed slippage (Sep plan → Nov execution 2022–23).

### S9. TWRA ArcGIS stocking-locations layer (cached `_work/clinch_stock_locs_all.json`, 730 sites)
- Org TWRA (services*.arcgis.com). Retrieved (cached) 2026-09-25.
- Buffalo Creek: 7 sites, StreamName "Buffalo Creek", Region 4, County GRAINGER, City Rutledge, StockingProgram "Spring", WaterClass stream, Species "rainbow", Management TWRA. Coords above. **Field DelayedHarvestSeason = "None" on all Buffalo sites** (layer inconsistency vs S7 — the same field carries "Oct 1 to last day of Feb"-type text for Paint/Tellico/Big Soddy sites).
- Establishes: site coordinates/reach; contradicts (mildly) the DH designation — treat as layer field staleness, not evidence against DH.

### S10. Tennessee Trout Management Plan 2017–2027 (TWRA, cached `data/reports/`)
- Title: "Tennessee Trout Management Plan 2017-2027"; org TWRA. Retrieved (cached) 2026-09-25.
- Verbatim (p. DH section): "Delayed harvest (DH) areas … were first introduced in Tennessee in Gatlinburg (four streams) during 1997. Subsequently, TWRA also established DH areas on Paint Creek, Tellico River, Hiwassee River, and Piney River. The goal of TWRA's DH program is to provide additional fall and winter fishing opportunities with relatively few hatchery trout … lightly stocking streams in the fall and allowing catch-and-release angling until March… Resumption of harvest coincides with the beginning of traditional stocking season."
- Establishes: DH = fall stocking + winter C&R by design (management-intent holdover). Buffalo Creek NOT in the plan's DH list → Buffalo DH designation post-dates the 2017 plan text (fits first DH-labeled schedule row in 2018; exact proclamation not retrieved — Internet Archive offline on 2026-09-25).

### S11. iNaturalist (API, retrieved 2026-09-25; cached `data/inat_buffalo_grainger_fish.json`)
- Query: Salmonidae (taxon 47520) bbox 36.08–36.32 N, −83.75 to −83.40 W. 6 observations, all Oncorhynchus mykiss, all angler-adjacent: 2023-10-21 Game Farm Rd Rutledge (36.2054,−83.5555 — ON the stocking reach, DURING DH C&R season), 2024-08-22 (36.2021,−83.5556), 2025-05-18 Game Farm Rd, 2026-09-05 Tampico Rd (36.1953,−83.5446), 2026-07-03 Jefferson City edge, 2020-02-19 (36.2558,−83.4271 — off-reach, NE).
- Establishes: rainbow trout present at the reach in Oct/May/Aug/Sep (stocked-fish presence). NOT reproduction (no YOY/wild claims). Single catches = leads.

### S12. GBIF (API, retrieved 2026-09-25; cached `data/gbif_buffalo_grainger.json`)
- Salmonidae (key 8615) same bbox: the 6 iNat mirrors + **6 Salmo trutta (brown trout) OCCURRENCE records 2003–2007** at rounded coords 36.11–36.17 / −83.51 to −83.65, dataset d6cc311c-c5ab-4f23-9a20-10514f9eb9c4 (MARIS state-fish records; no recorder detail).
- Establishes: brown trout documented in the Buffalo Creek area 2003–2007 — schedules list only RAINBOW for Buffalo, so browns imply either mixed-program history or holdover/movement. Lead-level (rounded coords, no method metadata).

### S13. USGS NAS (API, retrieved 2026-09-25; cached `data/nas_grainger.json`)
- County=Grainger: 28 records, NO salmonids (Cherokee/Norris reservoir spp., clams, milfoil…).
- Establishes: no nonindigenous-trout record; neutral.

### S14. TWRA Region 4 Coldwater Reports (cached `_work/clinch_r4_2017–2023.pdf/txt`)
- Grepped for Buffalo/Piney: no Buffalo-specific narrative found in extracted text (report texts mostly tailwater-focused). Unproductive.

## Contradictions & traps found
1. Ledger months [12,1,2] vs evidence: NO scheduled or completed December/January stocking in ANY year 2003–2026. The Dec–Feb reading matches NO source; nearest real things: (a) weekly FEBRUARY start; (b) DH C&R season Oct 1–Jan 31 (a fishing regulation, not stocking); (c) TWRC Proc. 07-13 search snippet ("Buffalo Creek (Grainger County): Closed to all fishing…" — the WMA closure clause, adjacent lines concerning trout-fishing closures) — snippet-level only, document not retrievable (IA offline).
2. YR flag: only defensible as "open to fishing year-round" (S7) + DH-managed winter carryover (S7, S10). NOT year-round stocking.
3. ArcGIS layer DH field "None" vs schedule ^DH + regs (S9 vs S7) — layer field stale.
4. Planned DH week (late Sep) vs executed DH delivery (Nov 9, 2022/2023, S3 vs S6) — five-day-slippage legend + quarterly snapshot lag.
5. 2024 archive feed shows TWO May completions for the reach area (05/10 cw-snapshot; 05/30 feed) — weekly program, not a contradiction.
6. Same-name: Little Buffalo River (Lawrence) rows co-occur in feeds/schedules — kept separate by county/region.

## Months-by-year stocking table (planned weeks; all Rainbow Trout)
| Year | Jan | Feb | Mar | Apr | May | Jun | Jul | Aug | Sep | Oct | Nov | Dec |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2003–2015 (each yr) | – | W | W | W | W | W | W | W | (W some yrs) | – | – | – |
| 2016–2017 | – | – | – | – | – | – | – | – | – | – | – | – | (no schedule retrieved; gap) |
| 2018 | – | W | W | W | W | W | W | W | W | – | DH-D | – |
| 2019 | – | W | W | W | W | W | W | W | W+DHc | – | – | – |
| 2020 | – | W | W | W | W | W | W | W | DHc(9/27) | – | – | – |
| 2021 | – | W | W | W | W | W | W | W | W+DHc(9/26) | – | – | – |
| 2022 | – | W | W | W | W | W | W | W | DHc(9/25)→done 11/9 | – | done 11/9 | – |
| 2023 | – | W | W | W | W | W | W | W | DHc | – | done 11/9 | – |
| 2024 | – | W | W | W | W(done 5/30) | W | W | W(done 8/9) | DHc(9/29) | – | – | – |
| 2025 | – | W | W | W | W | W | W | W | DHc(9/28) | – | – | – |
| 2026 | – | W(from 2/8) | W | W | W | W | W | W(done 8/27) | – | DH w(10/4) | – | – |
W = weekly (every week of month); DHc = one DH stocking week (cell date); DH-D = DH delivery executed. Completions (S2/S3) confirm Feb–May, Jul–Nov deliveries.

## Holdover / reproduction
- No reproduction evidence anywhere (no YOY, no wild-trout classification, no survey mention).
- DH program design = documented fall→winter carryover (S7 regs + S10 plan: "catch-and-release angling until March").
- Leads: iNat adult RBT on reach Oct 2023 (DH season), Aug 2024, May 2025, Sep 2026; GBIF/MARIS brown trout 2003–2007 (unstocked species in area schedules). Neither rises to documented holdover.

## Searches run (engine or API; incl. unproductive)
1. WebSearch: TWRA delayed harvest waters "Buffalo Creek" Grainger "Piney River" Rhea catch-release Oct/Feb — partially useful ( regs dates, DH list summary).
2. WebSearch: TWRA "delayed harvest" "Oct. 1" "Feb. 28" artificial lures list — useful (statewide DH text; Big Soddy/Doe River date changes).
3. WebSearch: "Buffalo Creek" Rutledge Tennessee trout stocking Grainger delayed harvest — weak (engine summary only).
4. WebSearch: TWRA 2018 new delayed harvest waters "Buffalo Creek" Grainger — rate-limited, unproductive.
5. WebSearch: Buffalo Creek Grainger County delayed harvest trout TWRA (retry) — surfaced eregulations guide text + Proc. 07-13 snippet lead.
6. WebSearch: TWRA 2018 adds new delayed harvest trout streams announcement — unproductive.
7. WebSearch: "Buffalo Creek" Grainger "delayed harvest" TWRA 2018 — rate-limited.
8. WebSearch: TWRC "Proc. No. 07-13" Buffalo Creek Grainger — lead only (snippet; PDF 403, IA offline).
9. WebSearch: "Proc. No. 07-13" proclamation variants — unproductive/rate-limited.
10. WebSearch: site:publications.tnsosfiles.com proclamation 07-13 — rate-limited.
11. WebSearch: news.tn.gov TFWC Jan 2026 fishing changes — partial (meeting approved 2026-27 regs).
12. WebSearch: TWRC 2017 trout DH changes Doe River Buffalo Creek — rate-limited ×4; one fallback summary (unverified) claims 2017 approval.
13. WebSearch: "Buffalo Springs" Grainger trout hatchery WMA mill dam — rate-limited; fallback irrelevant.
14. WebSearch: fishbrain "Buffalo Creek" Rutledge trout — rate-limited ×5, unproductive.
15. DDG HTML (curl): "Buffalo Creek" Rutledge trout "delayed harvest" — blocked (anomaly page).
16. Bing HTML (curl): same query — returned Buffalo NY noise, unproductive.
17. iNaturalist API bbox Salmonidae — productive (6 records).
18. GBIF API bbox Salmonidae — productive (MARIS browns).
19. USGS NAS API county=Grainger — neutral.
Plus offline mining: cached 2003–2025 schedule PDFs/JSON, coldwater reports, trout plan, stocked-trout 2012-13 page, storymap (no Buffalo), proclamation XMLs (no match).

## Recommendation
- **Verdict: seasonal-stocked-trout. Stocking months: February–August weekly (every year 2003–2026), September weekly in several years (2018, 2019, 2021; early-Sep marks in older templates), plus ONE fall Delayed-Harvest week scheduled late Sep–early Oct (2020–2026; executed 11/09 in 2022–2023). Realistic month set: [2,3,4,5,6,7,8] (+9 some years) with a fall DH event in 9/10.**
- Ledger months [12,1,2] are WRONG (no Dec/Jan stocking evidence in 24 years of schedules or any completion feed; only February is real, from the weekly Feb start).
- **Year-round stocking does NOT survive.** The YR flag should be dropped or re-explained: the stream is OPEN to fishing year-round below the mill dam (rod & reel only) and carries a DH catch-and-release season Oct 1–Jan 31 (winter fishery via carryover, by TWRA design). That is a year-round FISHERY note, not year-round stocking; no documented holdover/reproduction.
- Confidence: HIGH on months (continuous weekly evidence 2003–2026, plan + completion corroboration, visually verified rows). MEDIUM on the fall-DH execution timing (Sep-planned/Nov-done discrepancy) and on the 2016–2017 schedule gap and the exact DH-designation year (2017/18; proclamation not retrievable).
- Gaps: 2016–2017 schedules; Proc. 07-13 / 2017 proclamation text (IA offline 2026-09-25); MARIS brown-trout record provenance.
