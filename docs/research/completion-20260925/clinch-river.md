# Research Completion Log — Clinch River (Norris Dam tailwater), Anderson County, TN

- **Ledger row under test:** `year-round-trout` water; TWRA tailwater program rainbow/brown/brook; mapped season "March through August" (Tailwater_Trout FeatureServer); catalog months [3..8]; YR flag set.
- **Research date:** 2026-09-25 (all retrievals this date unless noted). Research-only pass; no agency/business contact.
- **Core question:** does the year-round (YR) label survive the Sep–Feb gap between mapped stocking months? Answer: **YES — YR survives on documented holdover + TWRA's own year-round characterization, NOT on continuous stocking.** The mapped window itself is contradicted (September is a documented stocked month in both current and 2010-era official TWRA sources).

---

## 1. Source-by-source record

### 1.1 TWRA ArcGIS Feature Services (services3.arcgis.com/PWXNAH2YKmZY7lBq)
- **Title/org:** TWRA Trout Stocking Locations + Tailwater_Trout FeatureServers (TWRA GIS).
- **Publication date:** live service; retrieved 2026-09-25.
- **URL:** https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/Tailwater_Trout/FeatureServer/0/query ; .../TWRA_Trout_Stocking_Locations/FeatureServer/0/query
- **Fields observed (Tailwater_Trout, OBJECTID 19):** Name=Clinch River; Species="rainbow, brown, brook"; Season="March through August"; Dam=Norris Dam; Shape__Length=80,692 m (line reach).
- **Stocking sites (TWRA_Trout_Stocking_Locations, all StreamName=Norris Tailwater, Region 4, Anderson Co., StockingProgram=Tailwater, Species=brook_brown_rainbow):**
  - Massengill Bridge — 36.20728663, -84.10901618 (OBJECTID 723)
  - Miller's Island — 36.20422119, -84.08853634 (724; managed TVA, 24-hr)
  - Peach Orchard access — 36.19060271, -84.11931558 (731)
  - Clear Creek — 36.21205274, -84.07441350 (750; TVA, 24-hr)
- **Local cache:** `_work/clinch_tailwater_trout.json`, `_work/clinch_stock_locs_all.json` (730 rows paged).
- **Establishes:** reach identity, species list (incl. brook), 4 named stocking destinations with coordinates, mapped season string "March through August".
- **Does NOT establish:** that stocking stops after August (contradicted below).

### 1.2 TWRA 2026 Trout Stocking Schedule JSON (live)
- **Title/org:** TWRA trout stockings page embedded datatable (tn.gov AEM).
- **Observation date:** live Sept 2026; retrieved 2026-09-25.
- **URL:** https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json (616 rows; local `_work/twra2026.json` copy byte-equal)
- **Clinch row (planned schedule):** REGION 4 / Anderson / "Norris Tailwater / Clinch River" / TYPE=Tailwater / **STOCKING MONTHS = "M, A, M, J, J, A, S"** (= Mar, Apr, May, Jun, Jul, Aug, **Sep**) / Species = Rainbow, Brown Trout. No stocking-day/week fields for tailwaters (destination-level program).
- **Establishes:** the CURRENT official planned stocking window is **March–September** — one month longer than the mapped Mar–Aug. PLANNED evidence for months 3–9.

### 1.3 Completed-release feed — 2024-06-07 committed archive (Wayback)
- **URL:** http://web.archive.org/web/20240607134309if_/https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_panel_348017491_c/content/tn_complex_datatable.exceldriven.json?_=1717767789374
- **Fields:** Region / Destination / Stocking Date (54 rows, rolling window). **Norris TW row: "Norris TW — 05/21/2024"** (only Clinch row; completed, destination-level).
- **Establishes:** a dated COMPLETED May 2024 release. Local cache `_work/clinch_completed_2024.json`.

### 1.4 Completed-release feed — live Sept 2026
- **URL:** https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable.exceldriven.json (endpoint discovered in live page HTML 2026-09-25; local `_work/clinch_live_completed.json`)
- **Norris TW row: "Norris TW — 08/25/2026"** — a COMPLETED **August** release. Feed's 10 rows span 08/28–09/03 2026 (rolling window).
- **Establishes:** completed stocking in August 2026 (destination-level).

### 1.5 TWRA "Tailwater Trout" page (old tn.gov CMS; captures 2010-05-29 → 2015-04-12)
- **URL:** http://web.archive.org/web/20100529052424/http://tn.gov/twra/fish/StreamRiver/tailtrout/tailtrout.html (capture list 2010–2015 all identical table; local `_work/clinch_tailtrout_page.html`)
- **Verbatim table row:** "Clinch River | Norris Dam | rainbow trout, brown trout, brook trout | **March through September**".
- **Verbatim narrative:** "These fisheries are maintained by stocking adult trout from spring through fall with most of the fish being stocked during the spring and summer… **most of our tailwaters hold trout year-round, so fish is good anytime.** The trout fishing in the tailwaters below in red ink are only good during the stocked periods due to warm water temperatures at other times." (Clinch not in the warm-water "red ink" group; warm-limited waters were e.g. Ocoee/Parksville, Cherokee, Ft. Patrick Henry.)
- **Establishes:** official TWRA season Mar–**Sep** through the 2003–2015 site era; official "holds trout year-round" characterization.

### 1.6 Management Plan for the Norris Tailwater Trout Fishery 2002–2006 (Habera, Bivens, Carter; TWRA, Apr 24 2002)
- **URL:** http://web.archive.org/web/20100529121953/http://tn.gov/twra/fish/StreamRiver/tailtrout/Norris.pdf (local `_work/clinch_norris_old.pdf/.txt`)
- **Stocking actions:** 36,000 catchable (9–13 in) rainbow/yr; 160,000 4-in rainbow **each spring** + ≥100,000 rainbow fingerlings; 20,000 8-in brown **each spring** + ≥100,000 brown fingerlings annually through 2005.
- **Monitoring:** 12 stations sampled **at night in late February** "to provide an assessment of the overwintering trout populations each year before stocking begins"; mean CPUE 161 fish/h (2000–2002); Nov 1994 two-station night sample averaged 69 fish/h.
- **Clear Creek:** closed Dec 1–Mar 31 (rainbows spawn there each winter).
- **Establishes:** spring-peak stocking design; annual overwintering assessment; winter reproducing rainbows.

### 1.7 "Management of the Clinch River Trout Fishery" (TWRA, 2007; plan-input summary)
- **URL:** http://web.archive.org/web/20100529052418/http://tn.gov/twra/fish/StreamRiver/tailtrout/clinch_trout_07.pdf (local `_work/clinch_trout07.pdf/.txt`)
- **Findings:** Feb/Mar electrofishing every year 1996–2007 (evaluation "continued into February 2007"); browns always dominant in >18-in class (trophy reputation); abundance >7-in weakly related to number stocked — flow-driven; didymo colonized 2004–2005.
- **Establishes:** winter-sampled standing population; brown-trout trophy characterization; Feb sampling continuity.

### 1.8 Management Plan 2008–2013 (TWRA; incl. PLR adoption)
- **URL:** http://web.archive.org/web/20100530133501/http://tn.gov/twra/fish/StreamRiver/tailtrout/Norris%20TW%20mgt%20plan%2008%20final.pdf (local `_work/clinch_plan08.pdf/.txt`)
- **Regulation:** 14–20 in PLR all trout, creel 7 with one >20 in, Norris Dam → Hwy 61 Bridge incl. tributaries; public input Sep–Oct 2007; TWRC approval Oct 2007; **effective 1 March 2008**.
- **Stocking:** 37,000 adult (9–12 in) rainbow/yr; 160,000 4-in rainbow **each spring**; ≥20,000 6–7 in brown **each spring** + up to 20,000 brown fingerlings **in the fall** as available; ~20,000 5–6 in brook **each spring**; Eagle Bend supplemental fingerlings discontinued.
- **Creel history:** surveys 1996, 2001 (Mar–Oct), 2005 (Apr–Oct) — Bettoli series; 22,000–26,000 trips/yr.
- **Establishes:** current regulation; spring/fall stocking timing; the fall (Sep–Nov window) brown-fingerling option.

### 1.9 Clinch River Creel Survey Results, April–October 2005 (P. W. Bettoli, TWRA Fisheries Report 06-08, July 2006)
- **URL:** http://web.archive.org/web/20100530133514/http://tn.gov/twra/fish/StreamRiver/tailtrout/ClinchCreel2005.pdf (local `_work/clinch_creel2005.pdf/.txt`)
- **Findings:** pressure 82,331 h Apr–Oct 2005 ("one of the most heavily fished trout tailwaters"); **dated 2005 stockings:** brown fry 75,260 in **March 2005**; 33,431 large (180–200 mm) browns in **April 2005**; 33,000 adult rainbows; 362,153 fry/fingerling rainbows; total >½ million trout in 2005.
- **Establishes:** dated completed releases for March and April 2005; pressure scale. Does not cover Nov–Mar.

### 1.10 Region IV Trout Fisheries Report 2010 (TWRA Fisheries Report; Habera et al.)
- **URL:** http://web.archive.org/web/20110711182552/http://www.tn.gov/twra/fish/StreamRiver/tailtrout/Region%204%202010%20Trout%20Fisheris%20Report.pdf (local `_work/clinch_r4_2010.pdf/.txt`)
- **Norris chapter (3.2.1):** 12.5-mi fishery; 2010 sample **8 March 2010**, 387 trout; **overwinter biomass 112 kg/ha (80% rainbow / 20% brown; Bettoli & Bohm 1997)**; adult-rainbow return to creel 19%, survival <6% — fishery sustained by fingerlings; rainbow growth ~20 mm/month, brown 12 mm/month (Meerbeek & Bettoli 2005); weir 3.2 km below dam maintaining 200 cfs minimum flow since 1984; autoventing turbines (1995/96) hold DO ≈6 mg/L; 2005 pressure among highest of TN tailwaters.
- **Establishes:** quantitative OVERWINTER population/biomass documentation.

### 1.11 Management Plan 2014–2019 (Habera, Bivens, Carter; TWRA, October 2014)
- **URL:** http://web.archive.org/web/20180112212428/https://www.tn.gov/content/dam/tn/twra/documents/Norris_Tailwater_Trout_Fishery_2014-2019.pdf (also 2021 capture of `Norris-Tailwater-Trout-Fishery_2014-2019.pdf`; local `_work/clinch_Norris_Tailwater_Trout_Fishery_2014-2019.pdf/.txt`)
- **Core statements:** tailwater "managed as a year-round fishery" since the 1950–1970 Tennessee Game & Fish Commission era (citing Swink 1983, Progressive Fish-Culturist 45(2):67-71); annual late-Feb/early-Mar monitoring of "overwintering trout populations before stocking begins" (since 1996); long-term mean CPUE 151 fish/h (70% rainbow); PLR catch rate 81 fish/h in 2014; brook trout: 100,000 Bowden-strain fingerlings May 2007, then 32,800/yr at ~8 in; **2013 creel (Black 2014): ~20% of pressure, trips, catch AND harvest occurred during January–March and November–December 2013** (2001/2005 surveys lacked winter; 2013 did not); prescribed stocking 37k adult + 160k fingerling rainbow, 20k brown **each spring** (+fall fingerlings as available), 20k brook **each spring**; 2012: 57% of adult rainbows & all fingerlings from Dale Hollow NFH.
- **Establishes:** THE pivotal holdover evidence pair — winter angler catch/harvest (2013) + agency overwinter electrofishing; the year-round management lineage.

### 1.12 Management Plan 2020–2025 (Habera, Petre, Carter, Williams; TWRA, July 2020)
- **URL:** http://web.archive.org/web/20210820060223/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/norris-tailwater-management-plan.pdf (local `_work/clinch_norris_plan.pdf/.txt`)
- **Content:** 12 stations fished "late February or March each year… assessment of carry-over trout populations before stocking begins"; objectives: PLR CPUE 56 fish/h, RSD-14 45, identify optimal fingerling rainbow rate, biosecurity; 2014–19 prescribed rates restated (197k rainbow, 20k brown, 20k brook); brook avg 12k/yr 2014–2019 (availability), Nov 2016 emergency stocking of 2017 rainbow fingerlings, Nov 2017 emergency stocking of 2018 brook allocation; Clear Creek closure now **Nov 1–Mar 31**; wild rainbow reproduction via Clear Creek (spawning each winter).
- **Establishes:** carry-over ("carry-over trout populations") as standing management concept; documented November stocking events (2016, 2017 emergency); current objectives.

### 1.13 Region IV Coldwater Streams reports 2017–2023 (TWRA)
- **URLs (Wayback; local `_work/clinch_r4_2017/2018/2019/2020/2021/2023.pdf/.txt`):**
  - 2017: web.archive.org/web/20230523161357/.../Coldwater-Trout-Report-R4-2017.pdf (sample 22 Feb 2017; 12 stations with river miles 79.7→69.5 and coordinates)
  - 2018: .../20220804000418/...R4-2018.pdf (2018 Norris sample; 28-in 8.6-lb brown pictured; new angler survey 2019)
  - 2019: .../20220804073046/...R4-2019.pdf (2019 sample: 330 trout; PLR CPUE ≈100 fish/h; brown 257–760 mm)
  - 2020: .../20240927174922/...R4-2020.pdf (allocations 197k RB + 20k BT + 20k brook; 2019 fingerlings cut to 111k, 2020 to 18k for marking; 2019 creel: 8,813 trips/26,729 h)
  - 2021: .../20220813221805/...R4-2021.pdf (2021: 40k brown allocation restored; 2020 creel 7,657 trips; brook stocked none since 2020)
  - 2023: .../20230820041714/...R4-2023.pdf (2022: 302 trout; 2023: 317; PLR CPUE 34 fish/h 2023; 2022 creel 6,481 trips/22,202 h, Black 2023; **TN CFRU 4-yr project complete: wild rainbows more abundant, survive and recruit better than stocked fingerlings — rainbow population "substantially supported by natural reproduction"**; no brook captured 2022–23; brown stocking 16–20k in 2018–20 then 40k/yr since 2021; 2023 creel underway, results 2024)
- **Recurring verbatim line (2017–2023):** hypolimnetic releases from five TVA dams "(Norris, Ft. Patrick Henry, South Holston, Wilbur, and Boone) also support **year-round trout fisheries** in the tailwaters downstream"; and sampling "each year in late February or March… to provide an assessment of the **overwintering trout populations** present before stocking begins." Caption (2023): "The 1998–2006 surveys covered only March–October" — i.e., 2013+ creels extended beyond that window.
- **Establishes:** continuous agency characterization of the fishery as year-round; annual overwintering evidence through 2023.

### 1.14 Winter stocking schedules (negative evidence for winter stocking at Norris)
- **Coldwater Trout Stocking Schedule, updated 2/18/2022** (Jan–Feb 2022 dates): web.archive.org/web/20220221220911/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Coldwater-Trout_Stocking-Schedule.pdf — Region 4 winter destinations: Cherokee TW, Fishery Park Pond, Fountain City Lake, Nolichucky R., Pistol Creek, South Holston, Watauga, West Prong Little Pigeon (Gatlinburg), Wilbur. **No Norris TW.** (Local `_work/clinch_coldwater_sched2022.txt`)
- **Trout Stocking Report as of 9/27/2024:** web.archive.org/web/20240927221436/... — recent Aug–Sep 2024 completed stockings, Region 4: Buffalo Creek 08/30, South Holston TW 09/09, Wilbur TW 09/05; **no Norris TW in that early-fall window** (its 2024 completed row was 05/21/2024, per §1.3).
- **"Trout Stocking (2020)… Complete.pdf" + 2021–2025 editions:** web.archive.org/web/20200424033427/... and one Wayback copy per distinct digest for 2021-01-19, 2021-08-20, 2022-02-21, 2022-05-19, 2023-02-19, 2023-02-20, 2024-02-19, 2024-05-20, 2025-02-08, 2025-03-20, 2025-06-24, 2025-09-02 (md5s all distinct, local `_work/clinch_complete_*.pdf`; the "byte-identical 2020 replay trap" was checked via CDX digests + local md5 — no replays among downloaded copies). **These are the STREAMS schedules (Feb–Oct pre-2019; Jan–Dec full-year from the 2025 edition, with winter DH stockings) — Norris TW has NO row in any year; tailwaters are excluded from the printed schedule and handled digitally.** 2018/2019 editions and the 2013 tentative schedule (`sched13.pdf`) likewise have no Norris row.
- **Establishes:** Norris is not part of the winter stocking program (Dec–Feb stockings go elsewhere); printed schedules never carried the tailwater.

### 1.15 Current regulation text (2026–27 season)
- **Source:** TWRA guide hosted at eregulations.com (search snippet quoted 2026-09-25): "Clinch River: Norris Dam downstream to Hwy. 61 bridge, including tributaries • 14–20 inch PLR on all trout • Seven (7) trout creel limit, only one [trout >20 in]." Consistent with plans 2008–2025.
- **Establishes:** the tailwater has ONE special-regulation reach (dam → Hwy 61). "County Line" and "Fraleys" appear in NO TWRA regulation, plan, or report 2002–2026 — treat as phantom/ledger-local names (closest real anchors: Hwy 61 bridge = downstream PLR boundary; "County Line" exists only as informal access references near county lines on the wider Clinch, e.g., Claiborne Co. line far upstream). A 1990s quality-zone (min size + reduced creel + gear) experiment failed and was rejected (Bettoli 2001 review).

### 1.16 Occurrence databases
- **USGS NAS (via NAS API and GBIF mirror d6cc311c-c5ab-4f23-9a20-10514f9eb9c4):** 98 Salmonidae records for Anderson County TN, incl. "Norris Reservoir tailwater" (1988) and annual MARIS collections 1999–2007; **Salmo trutta recorded in JANUARY at 10 stations spanning the tailwater (36.13–36.22 N, -84.08 to -84.12 W ≈ RM 69.5–79.7) in January 2005, 2006 and 2007** (92 January records).
- **GBIF:** Oncorhynchus mykiss human observations 2020, 2021, 2025, 2026 at Miller's Island/Clear Creek coordinates (36.213–36.220, -84.072 to -84.089); Salmo trutta 2020 & 2023 at 36.2197/-84.0885; 95 S. trutta records in bbox; no brook.
- **Establishes:** independent occurrence corroboration of trout present in the tailwater in mid-winter (Jan, multiple years) and at the named stocking sites in recent years.

### 1.17 Supporting literature (TTU/USGS TN CFRU; Bettoli series)
- Bettoli & Bohm 1997 (Fish. Rep. 97-39): first intensive study 1995–97, overwinter biomass 112 kg/ha, 19% creel return, fingerling-driven fishery.
- Bettinger & Bettoli 2000 (radio-telemetry, Fish. Rep. 00-14): adult-stocked trout make rapid long-range movements → poor survival.
- Banks & Bettoli 2000; Holbrook & Bettoli 2006: brown spawning in tailwater fails (substrate/flow/temperature) → no self-sustaining browns.
- Meerbeek & Bettoli 2005: brown growth 12 mm/month, survival in 5 tailwaters.
- Bettoli 2001 (Fish. Rep. 01-04): management-alternatives review → PLR chosen.
- Wolf (S. L.) et al. 2021, NAFM (Wiley, onlinelibrary.wiley.com/doi/10.1002/nafm.10635 — abstract partial via search): apparent weekly survival lowest first 2 weeks post-stocking (~91% autumn, ~75% spring cohorts) — TN CFRU marking project companion; final TWRA report pending as of 2023 R4 report. (Search snippet also: Clinch brown 200-d survival 43% (2003) vs 69% (1995) at lower stocking rates.)
- Swink 1983 (Prog. Fish-Cult. 45(2):67-71): documents 1950–1970 year-round management.
- Tarzwell 1939 (TANS Am. Fish. Soc. 68:228-233): rainbow stocked at dam completion 1936.

### 1.18 TVA context
- Re-regulation weir ~2 mi below Norris Dam (upgraded 1995); 200 cfs minimum flow since 1984; autoventing turbines 1995–96 (DO ≈6 mg/L) — from plans/R4 reports (§1.10–1.12). TVA water-data (gauge CCLT1, 36.2208/-84.0903, USGS 03533000) surfaced in web search as the public release/gauge reference. Context only; no month-specific stocking implication.

---

## 2. Months-by-year stocking table (evidence classes)

Planned (P) = schedule/plan row; Completed (C) = dated destination-level release; off-cycle = emergency/fall program stocking documented by TWRA.

| Year(s) | Jan | Feb | Mar | Apr | May | Jun | Jul | Aug | Sep | Oct | Nov | Dec |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1936–2001 | – | – | P (season Mar–era) | P | P | P | P | P | P (old TWRA page) | – | – | – |
| 2002–2005 | – | – | C 2005 (brown fry 75,260) | C 2005 (browns 33,431) | P | P | P | P | P | – | – | – |
| 2007 | – | – | P | P | C (100k brook fingerlings May 2007) | P | P | P | P | – | – | – |
| 2008–2015 | – | – | P (spring blocks: 160k RB fingerling, 20–37k RB adults, 20k BT, 20k brook) | P | P | P | P | P | P (old page Mar–Sep) | – | (fall BT fingerlings "as available") | – |
| 2016 | – | – | P | P | P | P | P | P | P | – | C (2017 RB fingerling allotment, emergency Nov 2016) | – |
| 2017 | – | – | P | P | P | P | P | P | P | – | C (2018 brook allocation, emergency Nov 2017) | – |
| 2018–2019 | – | – | P | P | P | P | P | P | P | – | (fall BT fingerling option) | – |
| 2020 | – | – | C (18k marked fingerlings, March 2020) | P | P | P | P | P | P | – | – | – |
| 2021–2023 | – | – | P | P | P | P | P | P | P | – | – | – |
| 2024 | – | – | P | P | **C 05/21/2024** | P | P | P | P | – | – | – |
| 2025 | – | – | P | P | P | P | P | P | P | – | – | – |
| 2026 | – | – | **P** ("M") | **P** | **P** | **P** | **P** | **P** + **C 08/25/2026** | **P** ("S") | – | – | – |

**Months each year's evidence supports:** Mapped/catalog = Mar–Aug. Current schedule (2026) + 2010-era TWRA page = **Mar–Sep**. Dated completed releases in hand: Mar, Apr, May, Aug (2005–2026 set). Nov: 2016 & 2017 (TWRA-documented emergency stockings). Dec–Feb: **no planned stocking, any year** (winter schedules exclude Norris TW).

## 3. Sep–Feb fishery persistence (holdover) — verdict
1. Agency overwinter monitoring since 1996: annual late-Feb/early-Mar night electrofishing of 12 stations explicitly to assess "overwintering/carry-over trout populations before stocking begins" — counts 302–387 trout per sample through 2010–2023; long-term mean CPUE 151 fish/h.
2. Overwinter biomass 112 kg/ha (Bettoli & Bohm 1997).
3. Winter angling with catch AND harvest: 2013 survey — ~20% of annual pressure/trips/catch/harvest in Nov–Dec + Jan–Mar (Black 2014); 2013+ creel series extended past the old Mar–Oct window.
4. Independent occurrence data: NAS Salmo trutta January collections 2005–2007 at 10 tailwater stations.
5. TWRA's own repeated characterization (2017–2023 R4 reports; 2003–2015 tailwater page): these tailwaters "support year-round trout fisheries" / "hold trout year-round."
6. Since 2019, substantial wild rainbow reproduction within the tailwater adds recruitment independent of stocking.
Conclusion: the Sep–Feb gap is bridged by holdover with unusually strong, multi-decade, agency-published documentation — among the strongest holdover records of any Tennessee tailwater.

## 4. Species program specifics
- **Rainbow Trout (Oncorhynchus mykiss):** primary species (~70% of electrofishing CPUE; 62% of harvest 2013–2017); prescribed 37,000 adults (9–12 in) + 160,000 fingerlings (4–5 in)/yr (fingerlings cut to 111k/18k/88k/100k 2019–2023 for the TN CFRU marking study; suspension possible — wild fish now "substantially support" the population). Source: Dale Hollow NFH.
- **Brown Trout (Salmo trutta):** trophy reputation documented ("always more brown than rainbow >18 in"; 2018 sample 28-in 8.6-lb; 2019 29.9-in 8.9-lb); prescribed 20,000 (6–8 in) spring, raised to 40,000/yr since 2021 (was 16–20k 2018–20); optional fall fingerlings. No wild recruitment (spawning fails).
- **Brook Trout (Salvelinus fontinalis):** added 2007 (100k Bowden-strain fingerlings May 2007; then 32,800/yr at 8 in; prescribed 20k spring); none stocked since 2020, none captured 2022–23 — the minor brook fishery has lapsed (ArcGIS species list is now partly legacy).
- **Total:** ~237,000 trout/yr — highest stocking rate of any Tennessee tailwater.

## 5. Reach / coordinates
- Special-regulation reach: Norris Dam → Hwy 61 bridge (~12 mi / 12.5 mi), incl. tributaries (Clear Creek). GIS line length 80,692 m (FeatureServer; the line evidently extends toward/into Melton Hill Reservoir, consistent with the Clinch continuing into Melton Hill — separate ledger water).
- Monitoring stations RM 79.7 (36.22222, -84.09250) → RM 69.5 (36.14681, -84.11853) (2017 table).
- Stocking sites: Massengill Bridge 36.2073/-84.1090; Miller's Island 36.2042/-84.0885; Peach Orchard 36.1906/-84.1193; Clear Creek 36.2121/-84.0744.
- Ledger names "County Line" and "Fraleys": **not found in any TWRA source 2002–2026** — unsupported as regulation reaches or stocking sites.

## 6. Type + confidence
- **Type:** year-round-trout (tailwater, hatchery-supported with significant naturalized rainbow recruitment) — **confidence HIGH** for the YR classification; **MEDIUM-HIGH** for Mar–Sep as the stocked window (planned evidence current + historical); **HIGH** that Dec–Feb has no stocking (multiple official schedules).
- **Establishes YR:** §1.5, §1.11 (2013 winter creel), §1.12–1.13 (overwinter monitoring + "year-round trout fisheries"), §1.16 (January occurrence records).
- **Does not establish YR:** continuous stocking (explicitly false for Dec–Feb).

## 7. Contradictions
1. FeatureServer "March through August" vs 2026 schedule "…, S" (Sep) and 2010-era page "March through September" — **the GIS season string is one month short.**
2. YR flag vs months [3..8]: reconciled only via holdover evidence (present, and strong).
3. ArcGIS species list includes brook; TWRA stopped stocking brook after 2020 (none captured 2022–23).
4. 2002–06 plan: Clear Creek closed Dec 1–Mar 31; 2014–19 plan: Nov 1–Mar 31 (regulatory shift, minor).
5. "County Line / Fraleys" reaches: absent from all TWRA documents vs present in ledger row (phantom names).
6. Angler use: 24–26k trips (1996–2005) → 12,249 (2013) → 6,481 (2022) — fishery quality objectives still met, but pressure has declined materially (context, no bearing on YR).
7. 2019–2022 fingerling reductions + possible suspension: future stocking intensity may fall; YR then rests even more on wild rainbows + holdover.

## 8. Searches run (web/CDX/API; unproductive marked)
1. WebSearch: "Clinch River Tennessee tailwater trout stocking Norris Dam schedule" — UNPRODUCTIVE (tool rate-limited 429).
2. WebSearch: "Clinch River Norris tailwater 14-20 inch slot limit Hwy 61" — UNPRODUCTIVE (429).
3. WebSearch: TWRA 2026 regs Norris tailwater Clinch 14-20 PLR — SUCCESS (eregulations 2026-27 quote).
4. WebSearch: eregulations.com TN Clinch Norris Dam Hwy 61 PLR seven creel — SUCCESS (corroboration).
5. WebSearch: "Clinch River" "County Line" access/ramp — SUCCESS, no authoritative County Line reach (unproductive for ledger name).
6. WebSearch: "Fraleys"/"Fraley" Clinch River trout — SUCCESS, no such reach/outfitter (unproductive for ledger name).
7. WebSearch: TWRA "Statewide Creel Survey" Black Norris winter coverage — SUCCESS (Black series IDs: 2019=Rep. 20-07; statewide creel reports).
8. WebSearch: Clinch winter fishing report Jan/Feb BWO — SUCCESS (winter-fishable tailwater; LRO report archive; no single dated catch extracted).
9. WebSearch: Clinch September/fall brown fingerling stocking — PARTIAL (general stocking confirmation; no dated Sept release pre-2026).
10. WebSearch: Statewide creel 2021/2022 winter PDF — PARTIAL (no dedicated winter PDF).
11. WebSearch: Wolf 2021 exact title — PARTIAL (related records; 43%/69% brown 200-d survival snippet).
12. WebSearch: TVA Norris weir/200 cfs — PARTIAL (weir program confirmed; 200 cfs anchored in TWRA plans instead).
13–16. DuckDuckGo HTML ×2 and Bing ×2 (County Line, Fraleys) — UNPRODUCTIVE (bot-blocked/JS-only).
17. Wayback CDX enumerations (stockings page, contentFullWidth, exceldriven JSON, dam documents, tailtrout folder, stockedtrout folder, Complete.pdf digests) — PRODUCTIVE (all primary-doc discovery).
18. ArcGIS REST queries (Tailwater_Trout; TWRA_Trout_Stocking_Locations full 730-row page-through) — PRODUCTIVE.
19. tn.gov JSON fetches (2026 schedule; live completed feed; live page HTML) — PRODUCTIVE.
20. GBIF API (species × bbox; monthly counts) and USGS NAS API (Anderson Salmonidae) — PRODUCTIVE.
21. Crossref/Semantic Scholar lookups — PARTIAL (related Bettoli-series papers resolved; exact Wolf 2021 DOI unconfirmed).

## 9. Recommendation
**The year-round label SURVIVES — keep `year-round-trout`.** Basis: (a) TWRA's own repeated classification of the Norris tailwater as a year-round trout fishery (2017–2023 R4 reports; 2003–2015 tailwater page), (b) two decades of agency overwinter population monitoring (late-Feb/Mar electrofishing, 1996–2023, 300+ trout per recent sample), (c) winter angler catch and harvest (~20% of the 2013 annual total in Nov–Mar), and (d) independent January occurrence records (NAS 2005–2007). Do NOT justify YR by continuous stocking — Dec–Feb stocking is absent by design (winter program stocks other waters). Separately, **repair the mapped window: March–August should be March–September** (2026 schedule "M, A, M, J, J, A, S" and the 2003–2015 official "March through September"), which also closes the widest-gap problem by one month. Remove or flag "County Line" and "Fraleys" as unsupported reach names; the sole special regulation is the 14–20-in PLR reach from Norris Dam to the Hwy 61 bridge.
