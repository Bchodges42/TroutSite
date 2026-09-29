# Fort Patrick Henry Tailwater (South Fork Holston River below Fort Patrick Henry Dam), Sullivan County — Year-Round Classification Research Log

**Water:** FPH TW — South Fork Holston River from Fort Patrick Henry Dam (within Kingsport) downstream to the Holston River confluence; TWRA's managed/stocked trout water is the upper ~2.9 mi (4.7 km) of this reach ("Wesley Road corridor"). Sullivan County, TN.
**Ledger:** `year-round-trout`; catalog months [3, 4]; Tailwater_Trout FeatureServer row (OBJECTID 14) Season = "March and April".
**Research date (retrieval):** 2026-09-25
**Scope discipline:** Research only; no edits under docs/; no git writes; no external contacts. The FPH **LAKE** row (reservoir stocking, Warrior's Path etc.) was resolved by a sibling — referenced only where the same source covers both waters and never conflated. Species citations were fixed in an earlier pass — not re-litigated. This pass = stocking calendar + the 09/03/2026 completion + holdover.
**Local file cache:** `tmp\research\completion\boone-fph-plan-2019-2024.pdf` (+ `.txt`), `tmp\research\completion\scheds\` (twsched-2018/2020/2021/2023/2025, r4-2018/2019/2020b/2021c/2023, ts2022cold, stocking-report-2024.pdf), `schedule2026-jina.txt`, `completed2026-jina.txt`, `completed2024.txt`, `stockings-live-raw.html`, `tw-20240930210409.html`, `tw-20250114154240.html`.

---

## 1. REACH DEFINITION / COORDINATES

| Item | Value | Source |
|---|---|---|
| Dam | Fort Patrick Henry Dam (1953), run-of-river, 2 units, 895-ac (362-ha) FPH Reservoir; no on-site DO enhancement (improved indirectly by Boone Dam autoventing turbines); TVA minimum flow 400 cfs via 1-hr turbine pulses; dam = SFH RM per TWRA monitoring "Dam to SFH RM 7.3" | plan §2.2 p.2-3; R4-2018 |
| GIS reach polyline | Tailwater_Trout OBJECTID 14: (36.4983, -82.5087) → (36.5507, -82.5820); Shape__Length 33,711 ft (~6.4 mi), 60 vertices | TWRA ArcGIS Tailwater_Trout, live query 2026-09-25 |
| Managed trout water | "The **upper 4.7 km (2.9 mi.)** of the Ft. Patrick Henry tailwater is managed as a put-and-take and put-and-grow trout fishery" | R4-2018 §3.2.4 |
| Stocking site rows | TWRA_Trout_Stocking_Locations OBJECTIDs 720 (36.5022, -82.5158, TVA, rainbow_brown), 721 (36.5108, -82.5367, rainbow_brown), 722 (36.5299, -82.5545, rainbow) — StreamName "Ft. Patrick Henry Tailwater", Sullivan, Program=Tailwater, WaterClass=stream | live query 2026-09-25 |
| Tributary/spawning | **Kendrick Creek** joins the tailwater ~station 3; wild rainbow fingerlings documented in its run (see S6) | R4-2021 Fig. 5-23; R4-2023 |
| Monitoring | 4 boat-electrofishing stations, "Dam to SFH RM 7.3", each MARCH (900 s each) since 2002, "to assess carry-over trout populations before stocking begins" | R4-2023 Table 12 |
| Regulations | Statewide trout regs (7 creel, no size limit) — distinct from the 16-22 in PLR that applies UPSTREAM (FPH Reservoir, Boone Dam → Louis Milhorn Bridge) | tailwater handbills 2018-2026; live page 2026; eregulations 2026-27 |
| NOT this water | "Ft. Patrick Henry Reservoir" rows 769 (36.5013,-82.4847) / 776 (Warrior's Path SP) = sibling lake row (late-fall/winter reservoir program); row 729 "S. Fork Holston River" (36.4977,-82.1614) is the S.Holston–SFH confluence corridor near Bluff City (Boone-unit/SH tailwater context), NOT the FPH tailwater despite the generic name | live queries 2026-09-25; sibling FPH-lake log |

---

## 2. SOURCE-BY-SOURCE FINDINGS

### S1. TWRA 2026 planned trout stocking schedule (live JSON, 616 rows)
- **Title/org:** "2026 Trout Stocking Schedule", TWRA. **Pub/obs:** 2026 cycle; retrieved 2026-09-25.
- **URL:** https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json (fetched via r.jina.ai; saved `schedule2026-jina.txt`).
- **Row:** Region 4 | Sullivan | **"Ft. Patrick Henry TW / S. Fork Holston River"** | TYPE Tailwater | STOCKING MONTHS **"M, A, D"** (= March, April, December) | Rainbow, Brown Trout. No dated rows (tailwater dates "variable throughout the months indicated").
- **Type:** planned. **Confidence:** high. **Establishes:** 2026 planned months = Mar, Apr, **Dec** — the JSON itself already contradicts the GIS row's two-month window.

### S2. TWRA "Tailwater Trout Stocking" schedule PDFs — 2018, 2020, 2021, 2023, 2025 captures (row-aligned)
- **Retrieval 2026-09-25. URLs (Wayback id_):**
  - 2018-07-17: https://web.archive.org/web/20180717180321id_/https://www.tn.gov/content/dam/tn/twra/documents/Tailwater-Stocking-Schedule.pdf
  - 2020-07-24: https://web.archive.org/web/20200724025911id_/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/tailwater-stocking-schedule.pdf
  - 2021-11-24: https://web.archive.org/web/20211124063518id_/ (same path)
  - 2023-02-24: https://web.archive.org/web/20230224043127id_/ (same path)
  - 2025-09-02: https://web.archive.org/web/20250902003646id_/ (same path)
- **FPH row, 2018/2020/2021 captures:** "South Fork Holston River | Fort Patrick Henry Dam | Brown and Rainbow Trout | **January, March and April** | Statewide Regulations."
- **FPH row, 2023/2025 captures:** "South Fork Holston River | Fort Patrick Henry Dam | Brown and Rainbow Trout | **March and April** | Statewide Regulations."
- **Banner:** "In many tailwaters trout fishing can be good year-round."
- **Type:** official TWRA publications. **Confidence:** high. **Establishes:** the GIS "March and April" is the 2023-2025-era text; January existed 2018-Nov 2021 and was dropped; December appears only in the 2026 JSON.

### S3. TWRA live stockings page (Sept 2026) — both tables disagree
- **URL:** https://www.tn.gov/twra/fishing/trout-information-stockings (raw HTML via r.jina.ai; page updated 9/21/2026; retrieved 2026-09-25).
- **Tailwater paragraph:** "Fort Patrick Henry Dam, South Fork Holston River - **Brown, Rainbow - March and April - Statewide Regulations**."
- **Same page's JSON table (S1):** "M, A, **D**". TWRA's live page thus shows Mar/Apr in prose and Mar/Apr/Dec in the searchable table simultaneously.
- **Type:** official. **Confidence:** high. **Establishes:** current core Mar-Apr, with a December claim in the dataset.

### S4. THE 09/03/2026 COMPLETION (the dated contradiction, chased)
- **Live completed feed JSON ("Trout Stocking Locations Report", updated 9/21/2026):** https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable.exceldriven.json (via r.jina.ai; saved `completed2026-jina.txt`). Full Region 4 contents: Buffalo Creek 08/27, **Ft. Patrick Henry TW 09/03/2026**, Leconte Creek 09/01, Norris TW 08/25, West Prong Little Pigeon (Gatlinburg) 09/17, Wilbur TW 09/03. Region 2/3: Ft. Campbell 8/28, Tims Ford TW 9/10, Center Hill TW 9/11, Dale Hollow TW 9/18.
- **Read:** a destination-level completed stocking on **September 3, 2026** — outside every published FPH window (Mar-Apr; Mar-Apr-Jan; Mar-Apr-Dec). Same date as the Wilbur TW completion (Wilbur's published months end in September, so Wilbur's fits; FPH's does not).
- **Most plausible explanations (flagged, not proven):** (a) a slipped **August fingerling** event — the 2019-2024 plan and R4 reports specify a fingerling RB run around August (plan: "fingerling Rainbow Trout stocked during August"; annual fingerling allocations 7,500-8,000 through 2023), and Sept 3 is the tail of an August window; (b) an unscheduled supplemental adult event (precedent exists: July 2021, S6); (c) a completion-report date lagging the on-water date. TWRA's caveat "any stocking event could be postponed… Tailwater stocking dates are variable throughout the months indicated" covers (a)-(c).
- **What it does and does not establish:** it refutes a strict two-month (Mar-Apr) stocking season; it does NOT establish a year-round program (no May, June, July, October, February completions in any window captured across 2022/2024/2026; and a single September event in six years of retrievable feeds is not a calendar).
- **Type:** completed, destination-level. **Confidence:** high that the event was reported; medium on interpretation.

### S5. "Management Plan for the Boone and Fort Patrick Henry Tailwater Trout Fisheries 2019-2024" — Habera, Petre & Carter, TWRA, December 2018 — CORNERSTONE
- **URL:** https://web.archive.org/web/20200724030046id_/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Boone-Fort-Patrick-Tailwater-plan_2019-2024.pdf
- **Stocking calendar (§4.2, p.31-32):** "Recent annual stocking allocations have been **10,500 adult Rainbow Trout (5,500 in March and 5,000 in April), 7,500 fingerling Rainbow Trout (March), and 20-25,000 Brown Trout (January and April)**… Recommended annual Ft. Patrick Henry tailwater trout stocking rates for 2019-2024 are: 10,000 adult Rainbow Trout; 7,500 fingerling Rainbow Trout; 10,000 sub-adult Brown Trout. **Stocking dates will remain as listed above, with fingerling Rainbow Trout stocked during August.**"
- → Plan-term months: **January (browns), March (adults+fingerlings), April (adults+browns), August (fingerlings)**.
- **History (§2.2, §3.2.4):** stocked since **1955** (fingerling RB + BT); since 1978 put-and-take/put-and-grow with **annual** adult+fingerling RB; sub-adult browns added **1996**; browns 14,500/yr since 2002; 10,000/yr 2002-2011 vs 20,000/yr since 2012 (plan cuts back to 10,000); 1990-2018 series (Fig. 3-14) includes fingerling RB spikes (49,000 in 2003; 44,000 in 2007).
- **Holdover/reproduction:** 1995 TVA noted a "considerable" RB fishery with "unusually plump" fish and probable natural reproduction "probably from Kendrick Creek, a tailwater tributary"; annual March pre-stocking carry-over sampling since 2002 (mean total CPUE 75 fish/h, range 33-113); RB RSD-18 mean 15, >20 since 2015; 13 RB ≥22 in captured 2008-2018 (most in Region 4); browns to 29 in/10 lb; brook trout NOT stocked (one 2013, 13 transients in 2018 "likely from the Boone tailwater upstream"); 2017 angler tip → large browns may hold downstream of monitoring stations in late winter.
- **Angler use:** 2013 creel (Black 2014) — FPH Reservoir unit incl. Boone TW: 6,783 h trout pressure; 5,450 trout caught; 1,704 harvested.
- **Regulations then:** statewide trout regs.
- **Type:** agency plan. **Confidence:** high. **Establishes:** designed Jan/Apr/Mar(+Aug) calendar; annual carry-over; Kendrick Creek reproduction. **Does NOT establish** year-round stocking.

### S6. Region IV Coldwater Streams reports 2018, 2019, 2020, 2021, 2023 (TWRA Fisheries Reports)
- **URLs (Wayback id_, retrieved 2026-09-25):** 2018 capture 20220804000418; 2019 capture 20220804073046; 2020 capture 20221122160308; 2021 capture 20221122160327; 2023 capture 20230820041714 (paths under tn.gov/content/dam/tn/twra/documents/fishing//trout/ or /trout/ as in Boone log S6).
- **Year-by-year FPH stocking totals:** 2019 = 9,900 adult RB + 8,000 fingerling RB (adipose-clipped) + 5,100 subadult BT; TN CFRU research project began Aug 2019. 2020 = 10,500 + 7,900 + 5,000. 2021 = **18,700 adult RB, 8,000 fingerling, 10,000 BT — including "an additional 8,700 adult Rainbow Trout… stocked during JULY 2021 because of the lack of fish present for the research project and angler complaints about low catch rates"** (all RB fin-clipped). 2022 = 9,500 adult RB + 8,000 fingerling + 5,000 BT (R4-2023; note: R4-2021's 2021 totals differ from R4-2023's restatement of 2021 — 9,500/8,000/5,000 vs 18,700/8,000/10,000; the July event explains the adult discrepancy, the BT figure remains inconsistent between reports). 2023 = no stocking total stated beyond "2022 stocking rates were consistent with the plan"; March 2023 sample only 14 trout.
- **Research (TN CFRU, 2019-2022, summarized R4-2021/2023):** the FPH RB population is **primarily supported by stocked adults**; stocked fingerlings infrequently captured and disappeared by ~200 mm (did not recruit); **naturally reproduced RB fingerlings observed in Kendrick Creek** (wild component); PIT-tagged adult-stocked RB grow 26.0-27.7 mm/month (>1 in/month); "annual fingerling Rainbow Trout stocking may be eliminated in 2024."
- **Monitoring/condition:** catch lowest-on-record 2021 (11 fish; CPUE 11 fish/h); slight improvement 2022-2023 (19, 14 trout) but RB CPUE far below the 75 fish/h long-term mean; RB >20 in present 2022 and 2023 (carry-over of large fish); largest brown to date 735 mm (28.9 in) in 2018; Wr ~112-125.
- **Type:** agency annual reports. **Confidence:** high. **Establishes:** stocked every year 2018-2022; documented **July 2021** mid-summer event; carry-over + wild Kendrick Creek reproduction; abundance collapse when stocking/fish density dipped.

### S7. Completed-release feeds (2022, 2024 ×2, 2026)
- **2026 live:** FPH TW **09/03/2026** (see S4). **2022 winter feed ("Coldwater Trout Stocking Schedule, updated 2/18/2022"):** https://web.archive.org/web/20220221220911id_/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Coldwater-Trout_Stocking-Schedule.pdf — Region 4 rows: Cherokee TW 2/15, South Holston 1/26, Wilbur 2/11, Fishery Park Pond 2/11, Pistol Creek 2/10, Gatlinburg 2/9, Nolichucky 1/24, Fountain City 1/21 — **no FPH TW row**, despite January being a published month then (consistent with January having lapsed in practice). **2024-06-07 feed JSON** (54 rows, May 6-Jun 4 2024) and **2024-09-27 report PDF** (rows 8/29-9/26 2024): **no FPH TW row** (URLs in Boone log S7). June 2024 absence is expected (not a published month); the Jan-Feb 2022 and Aug-Sep 2024 absences bear on any claimed cold/late-season program.
- **Type:** completed, destination-level. **Confidence:** high for rows present; absence weak (rolling windows) except where it tests a specific claimed month (January).

### S8. Regulations (current program)
- **Tailwater handbills 2018-2025 + live 2026 paragraph:** FPH TW = **Statewide Regulations** (7 trout creel, any combination; no size limit; lake-trout cap irrelevant here).
- **eregulations.com 2026-27 Region 4:** the **16-22 in PLR (RB+BT), 7 creel, one >22 in** applies to "Fort Patrick Henry Reservoir: from Boone Dam downstream to Louis Milhorn Bridge on Beulah Church Drive" — i.e., the reservoir ABOVE the dam (and the Boone tailwater), not this tailwater. URL: https://eregulations.com/tennessee/fishing/region-4/
- **Access (plan Objective 4):** public access essentially confined to the right-descending bank along the **Wesley Road corridor**; proposed expansion behind the Fort Henry Drive Wal-Mart with Kingsport Parks & Rec.
- **Type:** official. **Confidence:** high.

### S9. Third-party corroboration (guides/mirrors)
- **doubledfly.com/tailwaters/fort-patrick-henry (retrieved 2026-09-25):** "TWRA stocks the reach with rainbow and brook trout on a **spring schedule, in March and April**"; "Best: early spring behind the March-April stockings & the cold months; **thin in summer**"; "fresh and holdover stocked fish in the cool months"; ~8 mi from dam through Kingsport past Long Island to the North Fork confluence; coolest holding at the dam base. (Minor error: brook trout are not stocked — TWRA documents them only as upstream transients.)
- **mywaterlevel.com / piscamaps mirrors:** no water-level detail retrievable (unproductive).
- **Type:** commercial guide/mirror. **Confidence:** low-medium. **Establishes:** angler-facing consensus = Mar-Apr cool-season fishery.

### S10. Biodiversity occurrence data (GBIF / USGS NAS / iNaturalist)
- **GBIF (USGS NAS/MARIS dataset = TWRA fish data):** 12 Salmo trutta records in the FPH TW box (36.48-36.57, -82.60 to -82.49) at 36.49,-82.51 and 36.50,-82.52, one per year **2000-2007** (2/yr some years), HUC10 "Fort Patrick Henry Lake-South Fork Holston River", pathway/status "stocked for sport / stocked", source "TWRA Fish Data via MARIS" (e.g., SpecimenID 607239). All carry month=1/day=1 **placeholder** dates — they document annual brown-trout stocking 2000-2007 but cannot establish January specifically.
- **iNaturalist (via API + GBIF):** **zero** salmonid observations in the FPH TW box. (Research-grade trout iNat records in Sullivan County sit in the upper SFH/S.Holston confluence corridor — Boone-unit/SH context, documented in the Boone log.)
- **Type:** occurrence data. **Confidence:** medium (NAS = agency-derived stocking records; dates placeholders). **Establishes:** program continuity ~2000-2007; no month-level or post-2007 signal.

### S11. Prior completed-history probes (context)
- The plan (§3.2.4) and R4 reports establish that 2003-2017 stockings happened annually, but **no published month calendar exists before the 2018 handbill**; pre-2018 tentative stream schedules (2010-2013 sched PDFs) contain no Sullivan tailwater rows at all (tailwaters excluded from the public stream schedule).

---

## 3. MONTHS-BY-YEAR STOCKING TABLE — FPH TAILWATER (2003-2026)

Legend: bold = documented event; [brackets] = published window for that year; "annual, months n/a" = stocking documented, months not archived.

| Year | Documented months | Notes/source |
|---|---|---|
| 2003-2007 | annual, months n/a | adult+fingerling RB (annual since 1978) + browns (since 1996); 49,000 fingerlings 2003; 44,000 2007 (plan Fig. 3-14); NAS "stocked" brown records each year 2000-2007 (placeholder dates) |
| 2008-2017 | annual, months n/a; March carry-over sampling each year | browns 10,000/yr 2002-2011 → 20,000/yr 2012+; RB RSD-18 >20 from 2015 |
| 2018 | [Jan, Mar, Apr] | first tailwater handbill (2018 capture); 2018 sample 45 trout; 13 brook transients; 28.9-in brown |
| 2019 | [Jan, Mar, Apr]; 9,900 + 8,000 + 5,100 | R4-2019; CFRU project begins Aug 2019 |
| 2020 | [Jan, Mar, Apr]; 10,500 + 7,900 + 5,000 | R4-2020 |
| 2021 | [Jan, Mar, Apr] + **JULY supplemental (+8,700 adult RB)**; totals 18,700 + 8,000 + 10,000 | R4-2021; abundance collapse (11 fish) triggered the summer event |
| 2022 | [Mar, Apr] (Jan dropped by Feb 2023 handbill); 9,500 + 8,000 + 5,000 | R4-2023; handbill 2/2023; NO row in Jan-Feb 2022 completed feed (January absent in practice) |
| 2023 | [Mar, Apr]; March sample 14 trout; fingerling elimination floated for 2024 | R4-2023; handbill 2/2023 & 9/2025 |
| 2024 | [Mar, Apr] | handbill 9/2025; no FPH TW completions in May-Jun 2024 or Aug-Sep 2024 feeds |
| 2025 | [Mar, Apr] | handbill 9/2025 |
| 2026 | [Mar, Apr, Dec] (JSON) / [Mar, Apr] (live paragraph); **completed 09/03/2026** | schedule JSON + live page 9/21/2026 + completed feed |

**Window summary:** Continuous documented months across 2003-2026 = **March, April** (every era, every source). **January** was published 2018-Nov 2021 (and implied by the plan's brown allocations) but disappears from published windows by Feb 2023 and from completions (Jan-Feb 2022 feed). **August** fingerlings were program design 2019-2024 (plan §4.2; R4 reports' ~8,000/yr fingerling runs) — a published May-Nov month the GIS row never showed. **July 2021** and **September 2026** are documented off-window events. No February, May, June, or October event appears in any retrievable source.

## 4. SPECIES
Rainbow (core: adults put-and-take + fingerlings put-and-grow) and Brown (sub-adults since 1996) — matching GIS. Brook trout: NOT stocked (2013 single, 2018 ×13 = transients from Boone upstream) — doubledfly's "rainbow and brook stocked" is wrong. Cutthroat: not stocked here (Boone only; one 12.6-in transient captured 2013 is brook, not cutthroat — no cutthroat records for FPH in any TWRA source).

## 5. TYPE + CONFIDENCE / ESTABLISHES VS NOT
- Handbills (S2/S3): planned months, high confidence — establish official calendar per era and its changes.
- Plan + R4 reports (S5/S6): observed stockings, monitoring, research — high confidence; the only sources documenting actual events (incl. July 2021) and carry-over.
- Completed feeds (S4/S7): destination-level completions — high confidence for the 09/03/2026 event; weak for absences except January testing.
- Regs (S8): high. Guides (S9): corroboration. NAS/GBIF/iNat (S10): medium/low (placeholder dates; zero modern records).

## 6. CONTRADICTIONS
1. **Two-month GIS window vs every other source:** "March and April" matches only the 2023-2025 handbill; the same handbill carried January through Nov 2021, and the 2026 JSON adds December. The GIS row is stale and internally inconsistent with the sibling-era handbills.
2. **TWRA self-contradiction (Sept 2026):** JSON table "M, A, D" vs static paragraph "March and April" on the same live page.
3. **The 09/03/2026 completion** lies outside every published FPH window in any era — disproves a strict Mar-Apr reading, but is a single event, not a season.
4. **July 2021 supplemental** (+8,700 adult RB) is documented by TWRA itself as a response to low fish/angler complaints — proof the "calendar" bends in practice.
5. **R4-2021 vs R4-2023** disagree on 2021 totals (18,700/8,000/10,000 vs 9,500/8,000/5,000).
6. Ledger "year-round-trout" vs agency reality: TWRA's year-round language ("trout fishing can be good year-round"; R4 "year-round trout fisheries" listing FPH) describes the fishery supported by cold releases and carry-over — doubledfly's angler consensus is a "cool-season fishery… thin in summer" for this run-of-river tailwater (least cold of the Region 4 tailwaters: no hypolimnetic withdrawal of its own).
7. NAS dates (Jan 1 placeholders) cannot support January-specific claims despite surfacing as "January" in GBIF.

## 7. SEARCHES RUN (FPH; incl. unproductive)
Shared campaign with the Boone log (sources S1-S7, S10 cover both waters). FPH-specific queries: 1. WebSearch `"Fort Patrick Henry" tailwater trout stocking months Tennessee`. 2. WebSearch `TN CFRU Fort Patrick Henry rainbow PIT fingerling thesis` (no standalone thesis — unproductive). 3. WebFetch doubledfly FPH page. 4. WebFetch doubledfly Boone page (pairwise comparison). 5. WebFetch piscamaps (unproductive). 6. WebFetch mywaterlevel.com and /stocking/ (unproductive mirror). 7. WebFetch eregulations trout page (404 — unproductive) then Region 4 page (PLR boundary confirmed). 8. WebFetch tctu.org homepage (unproductive). 9. jina fetch of live tn.gov stockings page + raw HTML; 10. jina fetch of completed-report JSON (tn_complex_datatable.exceldriven.json). 11. Wayback CDX for stockings pages 2024-2026 + 2018 page; 12. CDX tailwater-stocking-schedule.pdf + 2018 Tailwater-Stocking-Schedule.pdf; 13. CDX Coldwater-Trout-Report-R4-2017…2023 (2017/2020/2021 first captures truncated at 1 MB — retried successfully via 2022-11 captures; R4-2022 not archived — gap). 14. 2026 schedule JSON parse (all 12 tailwater rows listed). 15. Live completed feed JSON parse (all 10 rows). 16. 2024-06 feed JSON; 17. 2022 winter feed PDF; 18. 2024-09 report PDF. 19. Handbill row-aligned extraction 2018/2020/2021/2023/2025. 20. ArcGIS: Site_Name/StreamName PATRICK/BOONE/FORK query; 21. ArcGIS bbox query; 22. Tailwater_Trout OBJECTID 14 geometry. 23. GBIF species×box queries (rainbow 0, brown 12, brook 0, laker 0, cutthroat 0). 24. NAS specimen viewer SpecimenID 607239 + NAS API (state query returned 0 — unproductive param set). 25. iNat API box search (0 records). 26. Live tailwater-stocking-schedule.pdf URL → 404 (unproductive; superseded by page/JSON). 27. WebSearch `Kingsport "Boone Dam" tailwater cutthroat 2021 OR 2023` and `Palmer Tipton record` (Boone-side but same-system press; no FPH-specific news found — unproductive for FPH).

## 8. RECOMMENDATION
**Year-round-trout verdict does NOT survive → downgrade to seasonal-stocked with exact months.**
- True documented stocking months (2003-2026): **March and April** (continuous, all-era core — adult RB 5,000-5,500 each month, browns in April); **January** published 2018-Nov 2021 (brown allocations) but dropped by Feb 2023 with no January completion ever observed; **August** fingerlings were program design 2019-2024; documented **off-window events: July 2021 (+8,700 adult RB)** and **September 3, 2026 (completed feed)**. Nothing in February, May, June, or October in any source.
- The September 2026 completion should be recorded as a dated supplemental/shifted event (best hypothesis: slipped August fingerling run or an unscheduled adult put — precedent July 2021), not as proof of a fall season.
- Suggested corrected fields: months = **[3, 4]** retained as the seasonal window is real, BUT the row must stop asserting year-round stocking; optionally note "+ Jan (through ~2021), Aug fingerlings (plan term), Dec (2026 schedule table), sporadic summer/fall supplementals (7/2021, 9/2026)". Program: ~10,000 adult RB + 7,500 fingerling RB (fingerling phase possibly ended 2024 per CFRU recommendation) + 10,000 sub-adult BT per year; statewide regs (7 creel, no size); Wesley Rd corridor access.
- Holdover flag: genuine but thin — March pre-stocking carry-over sampling since 2002, PIT-tagged adults surviving/growing >1 in/month, wild Kendrick Creek rainbow fingerlings, trophy browns; yet abundance collapses without stocking (2021: 11 fish sampled, lowest ever), and the tailwater is the region's least-cold (run-of-river), with angler consensus "thin in summer". Seasonal-stocked + documented holdover, not year-round.
