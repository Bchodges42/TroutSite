# Boone Tailwater (South Fork Holston River below Boone Dam), Sullivan County — Year-Round Classification Research Log

**Water:** Boone TW — the ~0.66-mile tailwater reach below Boone Dam (SFH RM 18.6), at the upper end of Fort Patrick Henry Reservoir; TWRA manages it together with the upper FPH Reservoir arm (stocking unit "Boone"). Sullivan County (dam reach), TN.
**Ledger:** `year-round-trout`; catalog months [12, 3, 4]; Tailwater_Trout FeatureServer row (OBJECTID 37) Season = "January, March, April, and December".
**Research date (retrieval):** 2026-09-25
**Scope discipline:** Research only. No edits under docs/, no git writes, no external contacts. Prior repair pass fixed Boone species citations (USGS-station citations removed) — not re-litigated here; this pass is the STOCKING CALENDAR + holdover question. FPH LAKE row was resolved separately by a sibling and is referenced only where the same source covers both waters.
**Local file cache:** `tmp\research\completion\boone-fph-plan-2019-2024.pdf` (+ extracted text `.txt`), `tmp\research\completion\scheds\` (twsched-2018/2020/2021/2023/2025 PDFs, r4-2018/2019/2020b/2021c/2023 reports, ts2018/2019, sched10-13, stocking-report-2024.pdf, completed2024.txt), `schedule2026-jina.txt`, `completed2026-jina.txt`, `stockings-live-raw.html`.

---

## 1. REACH DEFINITION / COORDINATES

| Item | Value | Source |
|---|---|---|
| Tailwater length | ~0.6 mi (~1 km; GIS polyline 3,466 ft) — "A short (~0.6 mi.) tailwater exists downstream of Boone Dam at the upper end of Ft. Patrick Henry Reservoir" | Boone/FPH plan 2019-2024 p.1; R4-2018 report |
| GIS reach polyline | Tailwater_Trout OBJECTID 37: (36.4486, -82.4422) → (36.4408, -82.4377); Shape__Length 3,466 ft | TWRA ArcGIS Tailwater_Trout, live query 2026-09-25 |
| Dam | Boone Dam, SFH RM 18.6, 3 autoventing turbines; completed 1952; impounds 4,400-ac Boone Reservoir (SFH + Watauga arms) | plan p.1; R4-2018 |
| Stocking site row | TWRA_Trout_Stocking_Locations OBJECTID 749, Site_Name blank, StreamName **"Boone Tailwater"**, 36.4611, -82.4605, Sullivan, Program=Tailwater, Species=rainbow_brown, WaterClass=stream — located in the upper FPH Reservoir reach between Boone Dam and Louis Milhorn Bridge (i.e., the unit actually stocked under the "Boone TW" destination) | live query 2026-09-25 |
| Special-reg boundary | "Fort Patrick Henry Reservoir: **Boone Dam downstream to Louis Milhorn Bridge** on Beulah Church Drive" — the Boone tailwater is the upstream anchor of this regulated reach | TWRA stockings page (archived 2024-09-30/2024-12-08/2025-01-14); eregulations.com 2026-27 Region 4 |
| Monitoring | 4 boat-electrofishing stations, "Dam to Hwy. 75", sampled each MARCH (900 s each, 1.0 h) since 2009 "to assess carry-over trout populations before stocking begins" | R4-2023 Table 12; plan p.4 |
| NOT this water | Trout_MASTER rows 725-728, 730, 732-736 (Osceola Island weir, Emmett Bridge, Hickory Tree Bridge, Webb Bridge, Weaver Pike Bridge, Big Springs Rd, Riverside Rd, etc.) = **South Holston tailwater / S.Holston–SFH confluence corridor** sites (36.466-36.527, -82.09 to -82.24) — upstream of Boone Reservoir pool, associated with the S. Holston TW program (Mar-Sep rainbow fingerlings) | live queries 2026-09-25; 2026 schedule JSON |

---

## 2. SOURCE-BY-SOURCE FINDINGS

### S1. TWRA 2026 planned trout stocking schedule (live JSON, 616 rows)
- **Title/org:** "2026 Trout Stocking Schedule", TWRA (tn.gov exceldriven datatable).
- **Pub/obs date:** current 2026 cycle; retrieved 2026-09-25.
- **URL:** https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json (tn.gov blocks plain curl; fetched via r.jina.ai proxy; saved `schedule2026-jina.txt`).
- **Fields:** REGION, COUNTY, LOCATION, TYPE, STOCKING DAY, STOCKING WEEK, STOCKING MONTHS, SPECIES.
- **Row (only one):** Region 4 | Sullivan/Washington | **"Boone TW / S. Fork Holston River"** | TYPE Tailwater | STOCKING MONTHS **"M, A, N, D"** (= March, April, November, December) | Rainbow, Brown Trout. No dated rows (STOCKING DAY/WEEK empty) — tailwater events are month-window only ("Tailwater and Reservoir stocking dates are variable throughout the months indicated").
- **Type:** planned. **Confidence:** high. **Establishes:** 2026 planned months = Mar, Apr, Nov, Dec. **Does NOT establish** Jan–Feb or May–Oct stocking; contradicts the GIS row's "January".

### S2. TWRA "Tailwater Trout Stocking" schedule PDF — 2018, 2020, 2021 captures (row-aligned via pdfplumber)
- **Title/org:** TWRA tailwater stocking handbill: "Trout are stocked routinely during the following months… In many tailwaters trout fishing can be good year-round."
- **Retrieval 2026-09-25; URLs (Wayback id_):**
  - 2018-07-17 capture: https://web.archive.org/web/20180717180321id_/https://www.tn.gov/content/dam/tn/twra/documents/Tailwater-Stocking-Schedule.pdf
  - 2020-07-24 capture (document also cited at 20200724030046 on the plan URL page): https://web.archive.org/web/20200724025911id_/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/tailwater-stocking-schedule.pdf
  - 2021-11-24 capture: https://web.archive.org/web/20211124063518id_/ (same path)
- **Region IV rows in all three:** **"South Fork Holston River | Boone Dam | Brook, Brown, and Rainbow | January, March, April, December | Statewide Regulations"** (FPH row: Jan, Mar, Apr; S. Holston: Mar-Sep; Wilbur: Mar-Sep; Norris: Mar-Aug+Dec; Cherokee: Nov-Apr).
- **Type:** official TWRA publication (planned months), 2018 → Nov 2021 unchanged. **Confidence:** high. **Establishes:** the GIS Season string "January, March, April, and December" is a verbatim stale copy of the 2018-2021 handbill — the source of the bizarre split-months. **Does NOT establish** the current calendar (see S3, S4).

### S3. TWRA tailwater schedule PDF — 2023 and 2025 captures (current-generation handbill)
- **URLs (Wayback id_):** 2023-02-24 capture https://web.archive.org/web/20230224043127id_/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/tailwater-stocking-schedule.pdf ; 2025-09-02 capture https://web.archive.org/web/20250902003646id_/ (same path). Identical content (168,887 bytes both).
- **Boone row:** **"South Fork Holston River | Boone Dam | Brook, Brown, Cutthroat, and Rainbow | March, April, December | Statewide Regulations."**
- **Change vs 2021:** January dropped; **Cutthroat Trout added**; Nov absent. (Live 2026 page counterpart, S4, upgrades Boone to "Special Trout Regulations" — regs changed again ~2024-2026.)
- **Type:** official publication. **Confidence:** high. **Establishes:** 2023-2025 official months = Mar, Apr, Dec.

### S4. TWRA live stockings page — "Tailwater Trout Stocking Information" section (Sept 2026 live)
- **URL:** https://www.tn.gov/twra/fishing/trout-information-stockings (raw HTML via r.jina.ai; saved `stockings-live-raw.html`; retrieved 2026-09-25; page states report updated 9/21/2026).
- **Boone line:** "Boone Dam, South Fork Holston River - **Brook, Brown, Cutthroat, Rainbow - March, April, December - Special Trout Regulations**."
- **Contradiction within the same TWRA page:** the S1 JSON table says **M, A, N, D** (includes November) while this static paragraph says Mar, Apr, Dec (no November). Both are live on 2026-09-25.
- **Type:** official. **Confidence:** high. **Establishes:** current core = Mar/Apr/Dec, November claimed only by the JSON table.

### S5. "Management Plan for the Boone and Fort Patrick Henry Tailwater Trout Fisheries 2019-2024" — Habera, Petre & Carter, TWRA, December 2018 (42 pp) — CORNERSTONE
- **URL:** https://web.archive.org/web/20200724030046id_/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Boone-Fort-Patrick-Tailwater-plan_2019-2024.pdf (local: `boone-fph-plan-2019-2024.pdf`).
- **Publication date:** December 2018. **Observation window covered:** 1950s-2018 + plan term 2019-2024.
- **Stocking calendar (plan p.29, §4.1):** "Recent annual stocking allocations have been **9,000 adult Rainbow Trout (4,000 in March and 5,000 in December) and 10-20,000 Brown Trout (April)**… Recommended annual Boone tailwater trout stocking rates for 2019-2024 are: 10,000 adult Rainbow Trout; 7,500 fingerling Rainbow Trout; 10,000 sub-adult Brown Trout; 2,000 adult Brook Trout (depending upon availability). **Stocking dates will remain as listed above, with fingerling Rainbow Trout stocked during August.**"
- → Plan-term months: **March, April, August (fingerlings), December** (+ episodic brook). August = a May-Nov month the GIS/handbill never showed.
- **History (§2.1, §3.1.4):** sporadic fingerling RB/brown pre-1978; after 1978 put-and-take adult RB; **no browns stocked 1956-2008**; browns (6-8 in) and fingerling RB added 2008 after the 2008 electrofishing survey found a good RB population with large well-conditioned fish. Stocking unit 1990-2018 = "Ft. Patrick Henry Reservoir (including Boone tailwater)": 1990-2007 adult RB only (~9,700/yr avg); 2008-2017 adult RB ~8,600/yr + fingerling RB ~10,000/yr when stocked (first 2008) + browns ~14,000/yr; 2014-2018 total ~38,600 trout/yr.
- **Holdover/reproduction evidence:** 2008 survey — several RB ≥18 in, Wr ≥120, and **natural reproduction (2-3 in RB) at base flow**; browns present = migrants from S. Holston/Wilbur; annual March sampling explicitly assesses **carry-over before stocking**; brook trout captured ≥1 yr post-stocking (mean Wr 119; a 20.3-in, 4.3-lb brook in 2014 would have been the state record); browns to 28.8 in, RB to 26.3 in; a 14-in **Lake Trout** in 2011 (downstream migrant). 2013 angler survey (Black 2014): 5,450 trout caught on the FPH Reservoir+Boone TW unit, 0.8 fish/h.
- **Regulations then:** statewide trout regs (7 creel, no size limit).
- **Type:** agency management plan. **Confidence:** high. **Establishes:** monthly program design for 2019-2024 (Mar/Apr/Aug/Dec), stocking-rate history to 2018, strong carry-over. **Does NOT establish** year-round stocking.

### S6. Region IV Coldwater Streams reports (TWRA Fisheries Reports): 2018 (No.?), 2019, 2020, 2021 (No.?), 2023 (No. 23-05)
- **URLs (Wayback id_, retrieved 2026-09-25):**
  - 2018: https://web.archive.org/web/20220804000418id_/http://www.tn.gov/content/dam/tn/twra/documents/fishing//trout/Coldwater-Trout-Report-R4-2018.pdf (168 pp)
  - 2019: https://web.archive.org/web/20220804073046id_/http://www.tn.gov/content/dam/tn/twra/documents/fishing//trout/Coldwater-Trout-Report-R4-2019.pdf (91 pp)
  - 2020: https://web.archive.org/web/20221122160308id_/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Coldwater-Trout-Report-R4-2020.pdf (77 pp)
  - 2021: https://web.archive.org/web/20221122160327id_/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Coldwater-Trout-Report-R4-2021.pdf (79 pp)
  - 2023: https://web.archive.org/web/20230820041714id_/https://www.tn.gov/content/dam/tn/twra/documents/fishing//trout/Coldwater-Trout-Report-R4-2023.pdf (69 pp; Fisheries Report 23-05)
- **Year-by-year Boone stocking totals (reports):** 2019 = 10,000 adult RB + 7,500 fingerling RB (left-pelvic-clipped) + 5,000 subadult BT + 3,500 brook. 2020 = 10,000 + 7,600 + 5,000 + 3,000 brook; report notes "predominance of 229-254 mm fish from the **February 2020 stockings**" (i.e., the winter event actually landed in Feb that year). 2021 = **14,400 adult RB** (plan 10,000 + 4,400 extra), 7,500 fingerling, 10,000 BT, **2,600 adult Cutthroat (Snake River fine-spotted) — "Cutthroat Trout were stocked in the Boone tailwater in December 2021"** (first TN cutthroat stocking since the 1960s). 2022 = 10,000 + 7,500 + 5,000; no cutts available; **"currently scheduled to be stocked during fall 2023."** 2023 sample: cutts from the Dec 2021 stocking had grown 229-279 mm → 432-483 mm (carry-over + growth across two years).
- **Monitoring (all editions):** March sampling = "overwintering trout populations present before stocking begins"; Boone since 2009; 2018 sample 110 trout incl. **48 brook (2017-stocking carry-over)**; 2019 browns to 635 mm; RSD-18 (RB) exceeded 40 by 2023; mean Wr >100 (RB ~99-109, BT ~115-118); "Six Region IV tailwater trout fisheries (Norris, Cherokee, Wilbur, Ft. Patrick Henry, Boone, South Holston) are currently monitored annually… Cold, hypolimnetic releases from five TVA dams… **also support year-round trout fisheries in the tailwaters downstream**" (fishery framing, not stocking).
- **Type:** agency annual reports (observed stockings + monitoring). **Confidence:** high. **Establishes:** documented stocking events every year 2018-2023; off-calendar events (Feb 2020, Dec 2021, fall 2023); multi-year carry-over and growth; agency "year-round fishery" language.

### S7. Completed-release feeds (TWRA "Trout Stocking Locations Report", rolling ~4-week windows)
- **Live Sept 2026 feed JSON:** https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable.exceldriven.json (via r.jina.ai; report updated 9/21/2026; 10 rows, Aug 27-Sep 18, 2026). **NO "Boone TW" row** (verified; FPH TW row exists — see FPH log). Region 4 rows: Buffalo Creek 8/27, Leconte Creek 9/1, Wilbur TW 9/3, Norris TW 8/25, West Prong Little Pigeon 9/17.
- **2024 archive JSON (2024-06-07 capture):** https://web.archive.org/web/20240607134309id_/https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_panel_348017491_c/content/tn_complex_datatable.exceldriven.json (54 rows, May 6-Jun 4, 2024) — **no Boone row**.
- **2024-09-27 report PDF:** https://web.archive.org/web/20240927221436id_/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Trout_Stocking-Report.pdf — rows 8/29-9/26/2024, **no Boone** (S. Holston TW 9/9, Wilbur TW 9/5 stocked).
- **2022 winter feed PDF ("Coldwater Trout Stocking Schedule, updated 2/18/2022"):** https://web.archive.org/web/20220221220911id_/ (same path) — rows 1/21-2/18/2022; Region 4: Cherokee TW 2/15, South Holston 1/26, Wilbur 2/11, etc.; **no Boone** despite the then-published January month.
- **Type:** destination-level completed records. **Confidence:** high for what they contain; **absence is weak evidence** (each feed covers only ~4 weeks and TWRA reports destination, not species/counts). **Establishes:** no Boone completion observed in Jan-Feb 2022, May-Jun 2024, Aug-Sep 2024, or Aug-Sep 2026 windows.

### S8. Public catch records — cutthroat (state-record evidence of multi-year carry-over)
- **Search-result press coverage (krcrtv.com et al., 2023-07-28):** 10-year-old Palmer Tipton caught the TN state-record cutthroat trout, **4 lb 12 oz, in the tailwater downstream from Boone Dam (July 2023)**, from TWRA's 2021 release of 2,550 cutthroats. Current TWRA records list cutthroat 6 lb 9 oz from "Fort Patrick Henry (Boone tailwater)". URL: https://krcrtv.com (story syndicated widely; located via WebSearch 2026-09-25).
- **Type:** public catch records (completed-origin fish, ~19-20 months post-stocking). **Confidence:** medium-high (press; consistent with TWRA electrofishing in S6). **Establishes:** Dec 2021-stocked fish survived ~2 years and grew to record size in the Boone TW — strong carry-over evidence across all seasons.

### S9. Regulations (current program, special regs)
- **TWRA stockings page (archived 2024-09-30 / 2024-12-08 / 2025-01-14):** "Fort Patrick Henry Reservoir: **Boone Dam downstream to Louis Milhorn Bridge** on Beulah Church Drive. **16-22 inch PLR for rainbow and brown trout.** Seven (7) trout creel limit (all species in combination), only one (1) trout may be greater than 22 inches." (Boone tailwater = upstream anchor of this reach.)
- **eregulations.com 2026-27 TN fishing regs, Region 4 (retrieved 2026-09-25):** same FPH Reservoir reg; also "Boone (Reservoir): Trout 7/day, 16-22 in PLR, one over 22; … reservoir from dam upstream to Hwy 390 Bridge at Bluff City on South Fork Holston arm." URL: https://eregulations.com/tennessee/fishing/region-4/
- **Live 2026 tailwater paragraph (S4):** Boone = "Special Trout Regulations" (vs "Statewide" in 2018-2021 handbills) — regs were upgraded between 2021 and 2024, matching the plan's stated option to add size limits.
- **Third-party conflict:** doubledfly.com/tailwaters/boone-tailwater says "no protected slot" for Boone — contradicted by TWRA's own regs text; TWRA controls.
- **Type:** official regs. **Confidence:** high.

### S10. Seasonal fishery guides (secondary corroboration)
- **doubledfly.com Boone Tailwater page (retrieved 2026-09-25):** "spring-and-December schedule… December stockings refresh the reach for winter"; four species RB/BT/brook/cutthroat; "fishes year-round on cold releases"; dam-base TVA recreation area reopened 2022. URL: https://doubledfly.com/tailwaters/boone-tailwater
- **Type:** commercial guide. **Confidence:** low-medium. **Establishes (corroboration only):** perceived Mar/Apr + Dec rhythm and year-round fishing.

### S11. Biodiversity occurrence data (GBIF / USGS NAS / iNaturalist)
- **USGS NAS via GBIF (dataset d6cc311c…, TWRA fish data through MARIS/BISON):** 65 Salmo trutta records in the Boone-unit bounding box (36.42-36.52, -82.47 to -82.13), one per year 1999-2007 (all dated Jan 1 = NAS placeholder for unknown date), status/pathway "stocked" (specimen viewer: HUC10 "Fort Patrick Henry Lake-South Fork Holston River", HUC12 "Kendrick Creek-South Fork Holston River", "stocked for sport", source "Tennessee Wildlife Resources Agency Fish Data via MARIS"; e.g., https://nas.er.usgs.gov/queries/SpecimenViewer.aspx?SpecimenID=607239). **Caveat:** these coordinates are the S.Holston-SFH confluence corridor (above Boone pool), not the 0.66-mi tailwater; they document annual brown trout stocking in the system pre-2008 but the month is a placeholder (Jan 1) — cannot establish January.
- **iNaturalist (research-grade) in the same corridor:** brown trout 2024-04-07 (36.4947,-82.1739), 2024-10-12 ×2 (36.4707/-82.2392, 36.4720/-82.2435, Bluff City), 2025-09-18 (36.4992,-82.1601, Bullock Hollow Rd); rainbow 2024-08-23 (36.4948,-82.1821, "South Fork Holston River, Bristol"). All are in the upper SFH arm / S.Holston confluence corridor — most plausibly S.Holston-tailwater-origin fish (wild browns/stocked RB drift down from the SH), per the plan's own migrant-brown interpretation. **No GBIF/iNat/NAS records within the actual 0.66-mi Boone tailwater polygon.**
- **Type:** occurrence data. **Confidence:** low-medium for stocking-calendar purposes (single catches = leads). **Establishes:** trout present in the Boone unit corridor in Apr/Aug/Sep/Oct 2024-2025; does NOT attribute them to the Boone TW program.

---

## 3. MONTHS-BY-YEAR STOCKING TABLE — BOONE TAILWATER (2003-2026)

Legend: bold = documented stocking month(s) for that year; (parenthetical) = off-window event documented; [brackets] = month claimed by a published schedule for that year but no event-level confirmation; "annual, months n/a" = stocking documented, months not archived.

| Year | Documented months | Notes/source |
|---|---|---|
| 2003-2007 | annual, months n/a | adult RB ~9,700/yr avg to the FPH Reservoir+Boone TW unit (plan Fig. 3-7); NAS "stocked" brown records each year (Jan-1 placeholder dates) |
| 2008 | annual (browns+fingerlings added) | plan §2.1/§3.1.4 |
| 2009-2017 | annual, months n/a; overwinter carry-over each March | R4 reports; plan Fig. 3-7 |
| 2018 | [Jan, Mar, Apr, Dec] | first published tailwater handbill (2018 capture); 2018 sample: 48 brook carry-overs |
| 2019 | [Jan, Mar, Apr, Dec]; 10,000 RB + 7,500 fgn + 5,000 BT + 3,500 brook | R4-2019; 2021 handbill |
| 2020 | **Feb** (+[Jan,] Mar, Apr, Dec); 10,000 + 7,600 + 5,000 + 3,000 | R4-2020 ("February 2020 stockings") |
| 2021 | **Dec** (cutthroat) (+Mar, Apr; +Jan per handbill); 14,400 + 7,500 + 10,000 + 2,600 cutts | R4-2021 |
| 2022 | [Mar, Apr, Dec] (Jan dropped from handbill by Feb 2023); 10,000 + 7,500 + 5,000 | R4-2023; 2023 handbill; no Boone row in Jan-Feb 2022 completed feed |
| 2023 | [Mar, Apr, Dec] + cutthroat "fall 2023" scheduled | R4-2023; handbill 2/2023 & 9/2025 |
| 2024 | [Mar, Apr, Dec] | handbill (9/2025 capture); no Boone completions in May-Jun or Aug-Sep 2024 feeds |
| 2025 | [Mar, Apr, Dec] | handbill 9/2025 |
| 2026 | [Mar, Apr, Nov, Dec] (JSON) / [Mar, Apr, Dec] (live paragraph) | schedule JSON + live page 9/21/2026; no Boone row in Aug-Sep 2026 completed feed |

**Window summary:** No May-Oct stocking has ever been documented except plan-term **August fingerlings** (2019-2024) and the **fall-2023 cutthroat** event; **January** was published 2018-2021 but dropped by 2023 (and no January completion was ever observed); **November** appears only in the 2026 JSON. Continuous months across the whole 2003-2026 record: **March, April, December**.

## 4. SPECIES
Rainbow (core, put-and-take + put-and-grow), Brown (sub-adults since 2008; migrants pre-2008), Brook (episodic adults: 2009, 2012, 2014, 2017, 2018, 2019, 2020; carry-over + growth documented), **Cutthroat** (Dec 2021, fall 2023 per schedule; Snake River fine-spotted; state-record fish produced), plus one Lake Trout (2011, migrant; not stocked). GIS/ledger species list (rainbow, brown, brook) is missing cutthroat — note for the species-citation owner (do not edit here).

## 5. TYPE + CONFIDENCE / ESTABLISHES VS NOT
- Published handbills (S2/S3/S4): planned months — high confidence, establishes the official calendar per era.
- Plan + R4 reports (S5/S6): observed stockings + monitoring — high confidence, establishes events and carry-over.
- Completed feeds (S7): destination-level completions — high confidence for rows present; absence weak (rolling windows).
- Press/records (S8), guides (S10), biodiversity data (S11): corroborating; medium/low.

## 6. CONTRADICTIONS
1. GIS Tailwater_Trout OBJECTID 37 "January, March, April, and December" = verbatim 2018-2021 handbill text; January no longer appears in any source after Nov 2021 (dropped by Feb 2023) — GIS is stale by ~3-5 years.
2. TWRA contradicts itself in Sept 2026: JSON table says M, A, **N**, D; static paragraph says Mar, Apr, Dec (no Nov).
3. Ledger months [12,3,4] omit April (a core month in every source) and assert December+Jan+Mar+Apr mixture; April is actually the strongest month (brown trout allocations).
4. 2020 handbill said January but the winter 2020 event landed in **February** (R4-2020), and no January completion appears in the Jan-Feb 2022 feed — published winter months are approximate.
5. "Year-round trout fishing" banner + R4 "year-round trout fisheries" = fishery framing (cold water + carry-over), not a stocking calendar.
6. doubledfly claims no protected slot on Boone — contradicted by TWRA regs (16-22 in PLR via FPH Reservoir rule).
7. Ledger/row species list lacks Cutthroat (stocked since 2021).

## 7. SEARCHES RUN (Boone; incl. unproductive)
1. WebSearch `"Boone tailwater" trout stocking TWRA schedule` → TCTU cutthroat lead. 2. WebSearch `Boone Dam tailwater trout fishing SFH stocking` → rate-limited, unproductive. 3. WebSearch `TWRA Boone FPH tailwater trout mgmt plan 2025` → **no successor plan found** (as of Jan 2025 page, 2019-2024 still listed). 4. WebSearch `tctu.org Boone cutthroat five species` → timed out. 5. WebSearch `"Fort Patrick Henry" tailwater trout stocking months` → mywaterlevel/doubledfly leads. 6. WebSearch `Kingsport "Boone Dam" tailwater cutthroat 2021/2023` → record-fish press. 7. WebSearch `Palmer Tipton TN record cutthroat Boone Dam` → krcrtv URL. 8. WebSearch `TN CFRU FPH rainbow PIT thesis` → no standalone thesis (research summarized in R4 reports). 9-11. DuckDuckGo html/lite + Bing `"Boone tailwater" cutthroat` → all blocked/generic (unproductive). 12. TCTU site search `?s=Boone` via jina → site search nonfunctional (unproductive). 13. ArcGIS: StreamName LIKE HOLSTON; 14. ArcGIS: bbox 36.44-36.56/-82.26--82.10; 15. ArcGIS: PATRICK/BOONE/FORK name search (found rows 720-722, 729, 749, 769, 776); 16. ArcGIS Tailwater_Trout OBJECTID 37/14 + geometry. 17. Wayback CDX tn.gov trout stocking pages; 18. CDX tailwater-stocking-schedule.pdf; 19. CDX Coldwater-Trout-Report-*; 20. CDX exceldriven JSONs; 21. CDX 2018 Tailwater-Stocking-Schedule.pdf. 22. 2026 schedule JSON fetch+filter. 23. Live completed feed JSON. 24. 2024-06 completed feed JSON. 25. 2022 winter feed PDF. 26. 2024-09 report PDF. 27-31. Tailwater handbills 2018/2020/2021/2023/2025. 32. sched10-13 (2010-2013) — **unproductive: no Sullivan tailwater rows in pre-2018 tentative schedules**. 33. ts2018/ts2019 stream schedules — no tailwater rows (unproductive). 34. Plan PDF extraction. 35-39. R4 2018/2019/2020/2021/2023 extraction. 40. Archived stockings pages 2018/2024-09/2024-12/2025-01. 41. Live page + tailwater paragraph. 42. GBIF species×box queries (rainbow/brown/brook/laker/cutthroat). 43. NAS specimen viewer + API. 44. iNat API corridor search. 45. eregulations Region 4 + trout pages (trout page 404 — unproductive). 46. doubledfly Boone/FPH pages. 47. mywaterlevel mirror (unproductive — no TN water detail). 48. piscamaps homepage (unproductive). 49. WebFetch tctu.org homepage (unproductive). 50. Live tailwater-stocking-schedule.pdf URL → 404 (months moved into page/JSON).

## 8. RECOMMENDATION
**Year-round-trout verdict does NOT survive as a stocking claim → downgrade to seasonal-stocked.**
- True documented stocking months (2003-2026): **March, April, December** (continuous across all eras); **January** existed only in the 2018-2021 published window (never confirmed by a completion; dropped by Feb 2023); **November** appears once, in the 2026 JSON table; **August** fingerlings and episodic **fall (Sep-Nov) cutthroat** events were documented in the 2019-2024 plan term. May-July: nothing except the one-off **July is FPH's event, not Boone's** — for Boone, no May-Jul event is documented anywhere.
- Suggested corrected fields: months = [3, 4, 12] (core, all-era) or [3, 4, 11, 12] if following the 2026 JSON; program = "seasonal put-grow/put-take tailwater (RB adult+fingerling, BT sub-adult, episodic brook & cutthroat); ~10,000-14,400 adult RB + 7,500 fingerling RB + 5,000-10,000 BT per year"; regs = 16-22 in PLR (via FPH Reservoir rule), 7 creel, one >22 in.
- Keep a holdover flag: year-round FISHING is real and agency-documented (cold hypolimnetic releases; annual pre-stocking carry-over electrofishing since 2009; 2-year growth of Dec 2021 cutthroats to state-record size; natural RB reproduction observed 2008; Kendrick Creek wild component downstream). The row should say seasonal-stocked with documented year-round carry-over — not "year-round stocking".
