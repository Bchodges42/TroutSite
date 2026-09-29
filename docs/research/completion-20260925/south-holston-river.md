# Research Log — South Holston River (South Holston Dam tailwater), Sullivan County, TN

Ledger water: `year-round-trout` — TWRA tailwater program rainbow; mapped season "March through September" (Tailwater_Trout FeatureServer); catalog months [3..9]; YR flag set.
Research date (retrieval for all sources): **2026-09-25**. Research ONLY; no writes outside this log; no contact with any agency/business/author.

Core question: does year-round evidence EXIST for the Oct–Feb window left unmapped by the Mar–Sep stocking window? Per owner's policy: year-round via continuous stocking OR documented holdover/reproduction (agency data preferred); holdover evidence must never downgrade.

---

## 1. Dataset rows (verified this pass)

### 1.1 TWRA Tailwater_Trout FeatureServer (mapped row)
- Title/org: TWRA Trout Water map layers, ArcGIS FeatureServer (services3.arcgis.com/PWXNAH2YKmZY7lBq)
- Retrieval: 2026-09-25 (ArcGIS REST query, live)
- URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/Tailwater_Trout/FeatureServer/0/query?where=1%3D1&outFields=*&returnGeometry=false&f=json
- Row (OBJECTID 38): Name "South Fork Holston River" | Dam "South Holston Dam" | Species "rainbow" | Season "March through September" | Shape__Length 105,797.7 ft (~20.0 mi; note TWRA plans document the tailwater reach as ~13.7 mi dam-to-Boone — feature geometry likely includes reservoir-interface meander; minor contradiction, does not affect months/species).
- Sibling rows (excluded, different waters): OBJECTID 37 Boone Dam tailwater (Jan, Mar, Apr, Dec); OBJECTID 14 Fort Patrick Henry (Mar–Apr); OBJECTID 36 Cherokee Dam Holston River (Nov–Apr); OBJECTID 21 Watauga/Wilbur (Mar–Jul).

### 1.2 TWRA_Trout_Stocking_Locations (stocking sites)
- Retrieval: 2026-09-25 (ArcGIS REST query, live)
- URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0/query?where=UPPER(StreamName)+LIKE+'%25HOLSTON%25'&outFields=*&returnGeometry=false&f=json
- 11 tailwater rows, all: StreamName "South Holston Tailwater" (one "S. Fork Holston River"), Region 4, County SULLIVAN, Species "rainbow", StockingProgram "Tailwater", WaterClass "stream". Sites + coordinates (lat, lon):
  - South Holston Dam — 36.52307, -82.09061
  - S, Holston Dam Rd. — 36.52255, -82.10198
  - Emmett Bridge — 36.52662, -82.11269
  - Osceola Island weir — 36.52434, -82.10955
  - Hickory Tree Bridge — 36.51584, -82.13614
  - Riverside Rd. — 36.49477, -82.19094
  - Big Springs Rd. — 36.49168, -82.19448
  - Webb Bridge — 36.48667, -82.19540
  - Weaver Pike Bridge — 36.48546, -82.20011
  - (2 unnamed) 36.49765, -82.16139; 36.46590, -82.23459
- 3 additional rows are "South Holston Reservoir" (Hwy 421 boat ramp, Lakeview Marina, +1) — SIBLING WATER (lake row handled by another agent), excluded here.

### 1.3 2026 live stocking schedule JSON (616 rows)
- Retrieval: 2026-09-25 (file `twra2026.json` in shared `_work`, verified live feed copy)
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json (tn.gov blocks plain curl; browser-context fetch)
- Row: REGION 4 | Sullivan | "S. Holston TW / S. Fork Holston River" | Tailwater | STOCKING MONTHS "M, A, M, J, J, A, S" (Mar, Apr, May, Jun, Jul, Aug, Sep) | Rainbow Trout. No day/week values (tailwaters listed by month only).
- Confirms current mapped window Mar–Sep, species rainbow only.

---

## 2. Stocking schedules & completed releases (month-by-month)

### 2.1 TWRA South Holston Tailwater Trout Fishery Management Plan 2022-2027 (PRIMARY)
- Title/org: "South Holston Tailwater Trout Fishery Management Plan 2022-2027", TWRA; prepared by Jim W. Habera, Sally J. Petre, Bart D. Carter, Carl Williams; published February 2022.
- Observation window: annual monitoring 1997–2021; stocking rates 2003–2021.
- Retrieval: 2026-09-25 via Wayback capture 2022-03-02.
- URL (live): https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/South-Holston-Tailwater-Trout-Fishery-Management-Plan.pdf | archive: https://web.archive.org/web/20220302052908/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/South-Holston-Tailwater-Trout-Fishery-Management-Plan.pdf
- Fields (verbatim quotes):
  - Goal: "Continue providing a high-quality, largely self-sustaining trout fishery which provides a variety of angling opportunities."
  - "Currently, 47,000 adult (9-10 inch) Rainbow Trout are stocked annually in the South Holston tailwater (March-September)."
  - "Brown Trout stocking was discontinued in 2003 as part of the shift to a management focus on wild fish."
  - "Fingerling (~4 inch) Rainbow Trout stocking was reduced from 100,000 to 50,000 fish in 2004… fingerling Rainbow Trout stocking was discontinued in 2021…"
  - "No Brown Trout have been stocked in the South Holston tailwater since 2003 because of the excellent wild Brown Trout fishery that has developed."
  - Monitoring: "TWRA monitors the South Holston tailwater trout fishery at 12 boat electrofishing stations … in March each year to provide an assessment of carry-over trout populations … before stocking begins." (CARRY-OVER = holdover, agency-documented.)
  - Reproduction: "Efforts to collect age-0 (fingerling) Rainbow Trout … produced 60 Rainbow Trout ≤100 mm at three sites throughout the South Holston tailwater in July 2018. Because no fingerling Rainbow Trout had been stocked at that point in 2018, those fish must have been the result of natural reproduction--which may now be more substantial than previously understood."
  - Browns = "80-90% of the total electrofishing catch each year since 2009"; total CPUE avg 300 fish/h.
  - Bettoli et al. (1999): "substantial natural reproduction (particularly by Brown Trout) and an overwintering biomass (80% Brown Trout) of 170-232 kg/ha." Meerbeek & Bettoli (2005): "overwintering Brown Trout biomass of 207 kg/ha during 2003-2004 (highest among all Tennessee tailwaters)."
  - Mork (2011): large brown trout "use the reservoir in winter."
- Type: agency management plan (stocking plan + monitoring) — **planned** stocking (Mar–Sep annually) + **direct holdover/reproduction** documentation. Confidence: HIGH.

### 2.2 Management Plan for the South Holston Tailwater Trout Fishery 2015-2020 (PRIMARY, history)
- Title/org: TWRA; prepared by Jim W. Habera, Rick D. Bivens, Bart D. Carter; March 2015.
- Retrieval: 2026-09-25 via Wayback capture 2020-09-30.
- URL (archive): https://web.archive.org/web/20200930133246/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/South-Holston-Tailwater-Trout-Fishery_2015-2020.pdf
- Fields:
  - "Natural reproduction by brown trout had become so successful by 2003 that stocking of this species was discontinued and management shifted to featuring the wild brown trout fishery."
  - Redds: "Bettoli et al. (1999) later documented numerous trout redds during December 1997 and January 1998 and a subsequent study (Banks and Bettoli 2000) during 1998-2000 identified trout spawning at seven distinct spawning sites throughout the tailwater. Spawning activity peaked in mid to late December…"
  - Recruitment: "Successful recruitment of wild brown trout was documented in 1997, when 55% of all overwintering trout were wild age-1 browns…"
  - TVA observed "brown trout spawning below the labyrinth weir shortly after its installation (1991)" and "collected gravid female brown trout throughout the tailwater during its 1993-1994 sampling."
  - Stocking: adult RBT allocation 47,000/yr 2009-2014 (actual avg 47,000, range 37,000–56,000); fingerling RBT 50,000/yr from 2004, NONE in 2008 ("no fingerlings were available from Dale Hollow National Fish Hatchery"); browns stocked through 2003. Figure 6 series 1990–2014.
  - Monitoring in March each year = "assessment of the overwintering trout populations before stocking begins" (holdover).
  - No sample in 2008 "because of inadequate flows" (contradiction to note for CPUE series, not stocking).
- Type: agency plan, historical stocking + reproduction data. Confidence: HIGH.

### 2.3 Tailwater Trout Stocking schedule page (2018, archived)
- Title/org: TWRA "Tailwater Trout Stocking" (Tailwater-Stocking-Schedule.pdf).
- Retrieval: 2026-09-25 via Wayback capture 2018-07-17.
- URL: https://web.archive.org/web/20180717180321/https://www.tn.gov/content/dam/tn/twra/documents/Tailwater-Stocking-Schedule.pdf
- Fields: Row "South Fork Holston River | South Holston Dam | Rainbow Trout | **March through September** | Special Trout Regulations." Preamble: "In many tailwaters trout fishing can be good year-round." Regs block: 16–22 in PLR all trout; 7 creel, one >22 in; "Closed to all fishing Nov 1 - Jan 31" at (1) Hickory Tree Bridge upstream to Bottom Creek confluence; (2) Boy's Island (below Weaver Pike Bridge) upstream to first island above Webb Road Bridge.
- Type: agency planned schedule. Confidence: HIGH. Establishes Mar–Sep planned window 2018.

### 2.4 TWRA "Coldwater Stocking" completed-release reports (Region roll-ups)
Each lists the MOST RECENT completed stocking date per water (rolling window). All retrieved 2026-09-25 from Wayback.

| Source (capture) | URL | SOHO row | Meaning |
|---|---|---|---|
| Coldwater Stocking, dated 11-16-2018 | https://web.archive.org/web/20190109074155/https://www.tn.gov/content/dam/tn/twra/documents/cw_stocking.pdf | "South Holston 5/15/2018"; "**South Holston TW 9/21/2018**" | Tailwater stocked September 2018 (completed). "South Holston" without TW = reservoir (sibling). |
| Coldwater Stocking, dated 04-22-2020 | https://web.archive.org/web/20200424033438/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Cold-Water-Stocking.pdf | "South Holston 12/30/2019" (reservoir); "**South Holston TW 3/25/2020**" | Tailwater stocked March 2020 (completed). |
| Coldwater Trout Stocking Schedule, updated 2/18/2022 | https://web.archive.org/web/20220221220911/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Coldwater-Trout_Stocking-Schedule.pdf | "4 South Holston 01/26/2022" | Region 4 winter-program destination. NO "TW" suffix; winter list also shows "Watauga"/"Wilbur" (lakes) without TW, while Cherokee TW appears with TW. Most likely South Holston RESERVOIR (sibling water) — NOT counted for the tailwater; flagged ambiguous. |
| Trout Stocking Report, updated 9/27/2024 | https://web.archive.org/web/20240927221436/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Trout_Stocking-Report.pdf | "**4 South Holston TW 09/09/2024**" | Tailwater stocked September 9, 2024 (completed). |
| Trout Stocking Report, updated 11/8/2024 | https://web.archive.org/web/20241111215005/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Trout_Stocking-Report.pdf | absent | No Oct–Nov tailwater release (consistent with program ending Sep). |
| Trout Stocking Report, updated 12/20/24 | https://web.archive.org/web/20241224212948/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Trout_Stocking-Report.pdf | absent | No December tailwater release. |
| Trout Stocking Report, updated 2/8/2025 | https://web.archive.org/web/20250208155418/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Trout_Stocking-Report.pdf | absent | No January–February tailwater release. |
| Trout Stocking Report, updated 3/21/2025 | https://web.archive.org/web/20250322191030/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Trout_Stocking-Report.pdf | absent | No early-March tailwater release yet. |
| Trout Stocking Report, updated 8/29/2025 | https://web.archive.org/web/20250902003641/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Trout_Stocking-Report.pdf | "**4 South Holston TW 08/27/2025**" | Tailwater stocked August 27, 2025 (completed). |
- Type: agency completed releases (destination-level). Confidence: HIGH. The rolling-window reports confirm the Oct–Feb gap in the stocking record for winter 2024–25 and corroborate Mar–Sep operations for 2018, 2020, 2024, 2025.
- Reconciliation note: parent context cited "South Holston TW 05/30/2024" from a 2024 archive. Earliest Wayback capture of Trout_Stocking-Report.pdf is 2024-09-27 (shows 09/09/2024). A May 30, 2024 release is plausible (in-window) but NOT independently verifiable this pass; 09/09/2024 is the verified completed 2024 release.

### 2.5 Tentative stocking schedule grids, 2003 / 2018 / 2019 / 2020 (NEGATIVE finding)
- Files (shared `_work`, originally archived schedules; e.g., 2003: https://web.archive.org/web/*/tn.gov/content/dam/tn/twra/documents/*Trout*Stocking*): sched03.pdf, sched2018.pdf (https://web.archive.org/web/20180717180317/...2018-Trout-Stocking-Schedule.pdf), sched2019.pdf, sched2020.pdf (Trout-Stocking-Schedule-Complete.pdf capture 2020-04-24).
- These tentative grids list STREAM program waters only (Feb–Oct columns, X/● marks); **tailwaters are NOT listed** (no Sullivan/South Holston row in any of them). No SOHO row appears in the 2018/2019/2020 complete schedules either.
- Implication: month-by-month planned rows for SOHO do not exist in the stream grids; the tailwater program is documented by the tailwater schedule page (2.3), management plans, and the month-labeled 2026 JSON. Marked as an unproductive lane for per-month grid data 2003–2020.

### 2.6 Months-by-year stocking table (2003–2025)

Legend: P = planned (agency schedule/plan, Mar–Sep standing window); C = completed release dated in that month (destination-level); — = no evidence found; (–) = documented NO release (rolling-window report absent).

| Year | Mar | Apr | May | Jun | Jul | Aug | Sep | Oct–Feb | Basis |
|---|---|---|---|---|---|---|---|---|---|
| 2003 | P | P | P | P | P | P | P | — | Plan: browns discontinued 2003; RBT put-and-take/put-and-grow continues |
| 2004–2007 | P | P | P | P | P | P | P | — | Plan: 47k adult + 100k→50k fingerling RBT/yr, Mar–Sep |
| 2008 | P | P | P | P | P | P | P | — | Fingerlings unavailable (no 2008 electrofishing sample either) |
| 2009–2014 | P | P | P | P | P | P | P | — | Plan: 47,000 adult RBT (actual 37–56k) + 50,000 fingerling, Mar–Sep |
| 2015–2017 | P | P | P | P | P | P | P | — | Plan: 40,000 adult + 50,000 fingerling RBT/yr (R4 2017/2018 reports) |
| 2018 | P | P | P | P | P | P | **C(Sep 21)** | — | cw_stocking report; tailwater schedule |
| 2019 | P | P | P | P | P | P | P | — | Plan; R4 2019 report |
| 2020 | **C(Mar 25)** | P | P | P | P | P | P | — | Cold-Water-Stocking report (COVID spring — March release documented) |
| 2021 | P | P | P | P | P | P | P | — | Fingerling stocking suspended 2021; adults continue |
| 2022 | P | P | P | P | P | P | P | (Jan 26, 2022 "South Holston" winter row = reservoir, ambiguous) | R4 2023: 48,000 adult RBT stocked in 2022 |
| 2023 | P | P | P | P | P | P | P | — | R4 2023 report (no row-level dates) |
| 2024 | P | P | (C May 30 — unverified) | P | P | P | **C(Sep 9)** | (–) Oct–Dec, rolling reports absent | Trout_Stocking-Report |
| 2025 | P | P | P | P | P | **C(Aug 27)** | P | (–) Oct–Feb via Nov/Dec/Feb/Mar reports | Trout_Stocking-Report |

Bottom line: continuous ANNUAL stocking every year 2003–2025, always within Mar–Sep; zero verified Oct–Feb tailwater releases; the only off-season row (1/26/2022) most plausibly belongs to the sibling reservoir.

---

## 3. Holdover / reproduction evidence (agency, PRIMARY)

### 3.1 Region IV Coldwater Streams reports (TWRA Fisheries Reports)
All retrieved 2026-09-25 via Wayback (tn.gov originals removed/moved; capture list in CDX). Authors: Habera, Petre, Carter, Williams (TWRA).

- R4 2019 (Fisheries Report 20-03, pub. 2020): https://web.archive.org/web/20220804073046/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Coldwater-Trout-Report-R4-2019.pdf
- R4 2021 (pub. 2022): https://web.archive.org/web/20221122160327/https://www.tn.gov/content/dam/tn/twra/documents/fishing//trout/Coldwater-Trout-Report-R4-2021.pdf
- R4 2023 (Fisheries Report 23-05, pub. August 2023): https://web.archive.org/web/20230820041714/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Coldwater-Trout-Report-R4-2023.pdf
- Also captured: R4 2017, R4 2018, R4 2020 (URLs pattern .../Coldwater-Trout-Report-R4-YYYY.pdf; 2017 & 2021 also under fishing//trout// path). No R4 2022 (2023 report covers 2022+2023 data).

Key verbatim quotes (2019, 2021, and 2023 editions all carry the same two sentences):
- "**Cold, hypolimnetic releases from five Tennessee Valley Authority (TVA) dams in Region IV (Norris, Ft. Patrick Henry, South Holston, Wilbur, and Boone) also support year-round trout fisheries in the tailwaters downstream.**"
- "**Natural reproduction entirely supports the Brown Trout fisheries in the South Holston and Wilbur (Watauga River) tailwaters** and recent work has shown that natural reproduction by Rainbow Trout may be significant in those tailwaters, as well as in Norris tailwater."
- R4 2023 SOHO chapter (p. 56–57): 2022 stocking = 48,000 adult RBT; fingerling suspension "has so far had no negative effect" (RBT CPUE 57 fish/h > 36 objective); 733 trout (2022) and 556 (2023) in 12-station March samples; browns 82%/81% of catch; PLR catch 8 fish/h.
- R4 2021 SOHO chapter (p. 65): 2021 sample 680 trout, browns 89%; RBT CPUE 37 fish/h; brown age-1 fish at 178 mm (recruitment).
- Type: agency monitoring reports. Confidence: HIGH. These establish BOTH the year-round fishery (agency's own words) and total-reproduction support for browns + significant wild rainbow reproduction.

### 3.2 Statewide Trout Management Plan 2017-2027 (TWRA 2017)
- Retrieval: 2026-09-25 via Wayback capture 2018-07-17.
- URL: https://web.archive.org/web/20180717180426/https://www.tn.gov/content/dam/tn/twra/documents/Tennessee-Trout-Management-Plan-2017-2027.pdf
- Verbatim: "**Significant natural reproduction by Brown Trout occurs in the South Holston and Wilbur tailwaters, enabling TWRA to manage this species as a wild trout fishery in both tailwaters (no Brown Trout are stocked).**" Also: PLR 16–22 in; "Seasonal closures of spawning areas on the South Holston tailwater are also used to protect large spawning trout"; TVA weir/minimum-flow improvements "particularly South Holston, Cherokee, and Norris."
- Confidence: HIGH.

### 3.3 Special regulation history (slot limit + spawning sanctuaries)
- 1999: all snagging banned; Nov 1999 proposal → 2000: 16–22 in protected length range (PLR) entire tailwater; 2000: two spawning refuges closed to ALL fishing Nov 1–Jan 31 (Hickory Tree Bridge–Bottom Creek; Boy's Island–Webb Road Bridge islands). Sources: SOHO plans 2015 & 2022; Tailwater schedule 2018; current text verified 2026-09-25 at https://www.eregulations.com/tennessee/fishing/trout-regulations ("Nov. 1–Jan. 31: Closed to all fishing in the following areas…"; "16–22 inch PLR on all trout"; "Seven (7) trout creel limit, only one trout may be longer than 22 inches").
- Significance: regulations exist specifically to protect spawning (Nov–Jan) — agency acknowledgement of in-river reproduction spanning the unmapped months.
- Confidence: HIGH.

### 3.4 Supporting agency-cited studies
- Bettoli, Owens & Nemeth (1999), TWRA Fisheries Report 99-3 "Trout habitat, reproduction, survival, and growth in the South Fork of the Holston River": overwintering biomass 170–232 kg/ha (~80% browns, May 1997 232 kg/ha highest in TN); numerous redds Dec 1997–Jan 1998; 55% of overwintering trout wild age-1 browns in 1997; temps usually <68°F, never >71.6°F. (Full text not freely online — unproductive direct-retrieval lane; content verified through TWRA plans.)
- Banks & Bettoli (2000), TWRA FR 00-19: spawning at 7 sites 1998–2000, peak mid–late December.
- Meerbeek & Bettoli (2005), TWRA FR 05-05: overwintering brown biomass 207 kg/ha (2003-04).
- Mork (2011), TTU M.S. thesis: large browns use Boone Reservoir in winter/spring (movement/holdover).
- Ksepka et al. 2020 (J Fish Dis): whirling disease first detected in SOHO + Wilbur tailwaters 2017, confirmed 2018; bait restriction effective Mar 1 2020 (SOHO plan 2022).

---

## 4. TVA dam / weir / temperature regime

- SOHO plans (2015 & 2022) and R4 2017/2018 reports: TVA built an **aerating labyrinth weir at SFHRM 48.5, completed December 1991**, ~1.25–1.5 mi below the dam at Osceola Island, under the Reservoir Releases Improvement Program. Maintains **minimum flow 90 cfs**; recovers **40–50% of the oxygen deficit**; turbine pulsed 2x daily to hold weir pool; **turbine venting + hub baffles since 1992**; combined **DO target 6 ppm**. Bettoli et al. (1999): temperatures "usually below 68°F (20°C) and did not exceed 71.6°F (22°C)" downstream of the weir — cold water in every season.
- Limit case (contradiction watch): lower tailwater (Rockhold, SFHRM 37) "can temporarily exceed 70°F on a daily basis during extended periods of minimum flow" (June 2014 logger data; also June–July 2011) — TWRA/TVA mitigation via longer release pulses. This is a summer issue, NOT an Oct–Feb issue; it does not touch the year-round question.
- Corroboration: Wikipedia "South Holston Dam" (retrieved 2026-09-25, https://en.wikipedia.org/wiki/South_Holston_Dam): "In 1991, TVA built a weir dam, an aerating labyrinth weir, approximately 1.5 miles below the main dam, straddling the midsection of Osceola Island… oxygenates the water, which helps aquatic insects, vegetation, and fish—particularly bass and trout." Dam coordinates 36°31'24"N 82°5'20"W; TVA dam completed 1950 (valve closed Oct 21, 1950); single 38.5 MW unit. ORNL hydropower page: "Reregulation weir constructed by TVA below the South Holston Dam… both aerates water discharged from the dam…" (via search summary).
- TVA.com "Weir Science" story and dam page: **403/Cloudflare-blocked and not in Wayback under those slugs — unproductive lane**; weir facts instead grounded in TWRA agency documents (better for this purpose anyway).

## 5. Off-season corroboration (non-agency; dated observations)

- iNaturalist research-grade `Salmo trutta` observations in tailwater bounding box (36.40–36.60 N, 82.30–82.00 W), retrieved 2026-09-25 via https://api.inaturalist.org/v1/observations?taxon_name=Salmo%20trutta&nelat=36.60&nelng=-82.00&swlat=36.40&swlng=-82.30 (27 total): off-season records include **2024-02-04 Osceola Island**, **2021-12-14 Bristol**, **2024-11-03**, **2025-11-23 Holston View Dam Rd (Bristol)**, **2024-10-12 Sullivan Co**. In-window records: 2017-03-04/07, 2020-04-25, 2024-04-29 x4, etc.
- GBIF occurrence search (same bbox + month filters; api.gbif.org): Oct 2024 x2, Nov 2024 x1, Dec 2021 x1 (iNat mirrors, same evidence); plus ~109 MARIS records dated Jan 1 of 2006/2007 — MARIS "occurrence" rows with placeholder dates and no locality text: classified LEADS ONLY, not counted.
- Repeated dated off-season catches via angler media (winter BWO hatches, year-round fishery descriptions on guide/news sites) exist in volume but are un-dated/anecdotal; treated as background corroboration only, not records.

---

## 6. Searches run (2026-09-25)

Productive:
1. South Holston River tailwater trout stocking TWRA schedule
2. South Holston River brown trout reproduction spawning survey TWRA self-sustaining
3. "South Holston" tailwater trout fishery management plan TWRA report Bettross
4. TVA South Holston Dam weir fixed cone valve cold water temperature release project
5. tn.gov TWRA "South Holston" tailwater trout fishery management pdf
6. TWRA South Holston tailwater trout management plan
7. TVA "South Holston" weir dam oxygen trout fishery 1991 minimum flow
8. South Holston Dam weir construction year aeration oxygen TWRA tailwater fishery report
9. eregulations.com South Holston tailwater 16-22 inch protected slot spawning closure November January
10. South Holston River winter fly fishing January February brown trout spawning redds
11. Bettoli 1999 trout habitat reproduction survival growth South Fork Holston River (3 variants)
12. Tennessee state record brown trout South Holston (3 variants)
13. Mork 2011 "survival and movements of large brown trout" Tennessee Tech thesis Boone
14. "South Holston" tailwater "whirling disease" Myxobolus 2017 TWRA rainbow trout
15. South Holston tailwater story map creel survey 2022 2023 brown trout percent catch TWRA

Direct source retrievals (beyond search): ArcGIS queries (Tailwater_Trout; TWRA_Trout_Stocking_Locations), Wayback CDX sweeps of tn.gov TWRA document tree (schedules, coldwater reports, management plans, stocking reports), 20+ PDF downloads/extractions, GBIF API (7 queries incl. month slices), iNat API, Wikipedia API, eregulations fetch.

Unproductive / blocked lanes:
- tvca.com pages (TVA "Weir Science", South Holston Dam page): 403 Cloudflare; no Wayback captures under those slugs.
- 2003/2018/2019/2020 tentative schedule grids: tailwaters not listed (stream-program grids only) — no per-month SOHO rows obtainable there.
- Bettoli et al. 1999 full text: not freely available (cited via TWRA plans).
- State-record brown trout lane: no primary TWRA record page surfaced (search-engine claims of "26 lb 2013" unverified — discarded).
- ArcGIS StoryMaps SOHO creel product: not found.
- digitalcommons.memphis.edu search endpoint: 404; plan PDFs retrieved from tn.gov Wayback instead.
- WebSearch rate limits (MCP -429) hit intermittently; resolved by spacing and query variants.

## 7. Contradictions & caveats

1. Shape__Length of Tailwater_Trout feature (~20.0 mi) vs documented 13.7-mi reach (plans) — geometry discrepancy only.
2. "South Holston" vs "South Holston TW" destination naming: coldwater/winter program rows without "TW" are the RESERVOIR (sibling water). The 1/26/2022 winter row is therefore excluded from tailwater stocking evidence (flagged ambiguous, leaning reservoir).
3. Parent-context "South Holston TW 05/30/2024" (2024 archive) could not be re-verified; earliest archived report capture (9/27/2024) shows 09/09/2024. May 2024 release plausible/in-window but unverified.
4. 2022 management plan says 47,000 adult RBT "annually (March-September)" while R4 2023 reports 48,000 stocked in 2022 — trivial rounding/allocation difference, not a contradiction of months.
5. Summer lower-tailwater temperatures can exceed 70°F during extended minimum flow (2011, 2014) — a documented seasonal habitat caveat in the LOWER reach; does not bear on Oct–Feb year-round support.
6. No 2008 electrofishing sample (flows) and no R4 2022 report (folded into 2023) — monitoring gaps, not stocking gaps.

## 8. Recommendation

**KEEP the `year-round-trout` YR classification — it is evidence-supported, on a holdover/reproduction basis (with the stocking window correctly mapped as Mar–Sep).**

- Stocking-based year-round: NOT supported. Every agency source (2018 tailwater schedule; 2022-2027 plan; 2026 live schedule) fixes the hatchery program at **March–September**, and the rolling completed-release reports (Nov 2024–Mar 2025) show no Oct–Feb tailwater releases. Do not claim continuous stocking.
- Holdover/reproduction-based year-round: STRONGLY supported by agency data, which is the owner's preferred evidence class:
  1. TWRA Region IV Coldwater reports (2019, 2021, 2023, verbatim): cold hypolimnetic TVA releases at South Holston "support **year-round trout fisheries** in the tailwaters downstream," and "**natural reproduction entirely supports the Brown Trout fisheries** in the South Holston and Wilbur tailwaters," with wild rainbow reproduction "significant" (rainbow fingerling stocking suspended 2021 precisely because natural reproduction replaces it; RBT CPUE 57 fish/h > 36 objective through 2023).
  2. TWRA's own March monitoring is explicitly an "assessment of carry-over/overwintering trout populations before stocking begins" — agency-documented holdover, every year since 1999.
  3. Spawning/red(d) documentation: redds Dec 1997–Jan 1998; 7 spawning sites with mid–late-December peak (1998–2000); wild age-1 browns = 55% of overwintering trout in 1997; overwintering biomass 170–232 kg/ha, highest among TN tailwaters; Nov 1–Jan 31 fishing closures + 16–22 in PLR exist to protect that in-river spawning — i.e., agency-managed reproduction THROUGH the unmapped months.
  4. TVA's 1991 aerating labyrinth weir (90 cfs minimum flow, DO target 6 ppm, turbine venting) keeps releases cold (usually <68°F year-round per Bettoli 1999), enabling the year-round fishery TWRA describes.
  5. Dated off-season corroboration (leads class, consistent): iNat research-grade browns on Feb 4 2024 (Osceola Island), Dec 14 2021, Nov 3 2024, Nov 23 2025, Oct 12 2024.
- Confidence: HIGH (multiple independent agency primary documents + complete schedule chain 2018→2026 + completed releases 2018/2020/2024/2025).
- Suggested catalog note: species evidence = rainbow (stocked Mar–Sep, wild reproduction significant) + brown (fully self-sustaining, no stocking since 2003). Oct–Feb support = holdover/reproduction (agency-documented), not stocking.

Key gap: no agency source itemizes month-by-month releases for 2003–2017 (grids excluded tailwaters; reports are rolling "most recent" only). Record holder for this water's evidence file: TWRA South Holston Tailwater Trout Fishery Management Plan 2022-2027 (Habera et al., Feb 2022) + Region IV Coldwater Streams 2023 (Habera et al., Aug 2023).
