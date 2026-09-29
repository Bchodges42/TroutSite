# Watauga River (Wilbur Dam tailwater), Carter County — Year-Round Classification Research Log

**Water:** Watauga River below Wilbur Dam ("Wilbur Tailwater"), Carter/Washington counties, TN
**Ledger:** `year-round-trout` — TWRA tailwater program rainbow; mapped season "March through December"; catalog months [3..12]; YR flag set
**Research date (retrieval):** 2026-09-25
**Scope discipline:** This pass covers ONLY the riverine tailwater below Wilbur Dam (dam → Boone Reservoir). Wilbur LAKE (between dams) and Watauga LAKE (above Watauga Dam) are sibling rows; the dam-to-lake reach was covered by another agent and is skipped. NO edits to docs/, no git writes, no external contacts.
**Local file cache:** `tmp\research\_work\watauga\` (all PDFs/HTML cited below were saved there 2026-09-25).

---

## 1. REACH DEFINITION / COORDINATES

| Item | Value | Source |
|---|---|---|
| Tailwater start | Wilbur Dam, 36.3413, -82.1263 (Watauga RM 34 / rkm 55) | 2022 Wilbur plan; Bettoli 2003 |
| Tailwater end | Boone Reservoir headwaters, ~16 mi (26 km) below dam, near town of Watauga | 2022 plan; Bettoli 2003 (rkm 55→29) |
| Quality Zone (special regs) | Smalling Bridge → CSX RR Bridge (4.2 km; original 1989 boundary to Hwy 400 Bridge, moved to CSX 2003) | 2022 plan p.3; TWRA 2020 tailwater schedule |
| Monitoring stations | 12 (est. 1999) + Station 10.5 (added 2010), electrofished each MARCH before stocking begins | 2022 plan; R4 2010 report |
| TWRA stocking sites in reach (ArcGIS TWRA_Trout_Stocking_Locations, 12 "Wilbur Tailwater" stream rows, WaterClass=stream, Program=Tailwater, Species=rainbow) | Siam Bridge 36.35108,-82.15463; Hunter Bridge 36.36807,-82.16839; New Hwy 19E 36.35487,-82.20712; Old Hwy 19E 36.35638,-82.22332; Blevins Bend 36.33406,-82.27044; Hwy 400 bridge 36.36957,-82.29813; Herb Hodge Rd 36.38413,-82.3198; + 5 unnamed | live query 2026-09-25 |
| Sibling-lake rows (NOT this water) | "Wilbur Dam" 36.34123,-82.12642 / "Access Area" 36.33759,-82.1215 / "Campground Area 3" 36.33356,-82.12648 — StreamName **Wilbur Reservoir**, WaterClass **reservoir** (the "Wilbur TW" destination = LAKE) | same layer, OBJECTIDs 713-715 |

---

## 2. SOURCE-BY-SOURCE FINDINGS

### S1. TWRA 2026 planned trout stocking schedule (live JSON)
- **Title/org:** "2026 Trout Stocking Schedule", Tennessee Wildlife Resources Agency (tn.gov trout stockings page datatable).
- **Pub/obs date:** current 2026 cycle; retrieved 2026-09-25.
- **URL:** https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json (616 rows; fetch with browser User-Agent — plain curl is reset).
- **Fields:** REGION, COUNTY, LOCATION, TYPE, STOCKING DAY, STOCKING WEEK, STOCKING MONTHS, SPECIES.
- **Row (only one for this water):** Region 4 | Carter/Washington | **"Wilbur Tailwater / Watauga River"** | TYPE **Tailwater** | STOCKING MONTHS **"M, A, M, J, J, A, S"** (=Mar,Apr,May,Jun,Jul,Aug,Sep; 7 months) | Rainbow Trout.
- **Adjacent Carter rows (context):** Doe River, Laurel Fork, Stony Creek (Seasonal, Mar–Jun weeks, rainbow); Doe River DH 10/4/2026. NO Jan/Feb events for any Carter water in the 2026 plan; the lake rows (Watauga/Wilbur Reservoir) are not in this JSON.
- **Type:** planned. **Confidence:** high. **Establishes:** planned Mar–Sep 2026 (7 months). Does NOT establish Oct–Feb or any Jan–Feb stocking.

### S2. TWRA "Tailwater Trout Stocking" handbill (Wayback, captured 2020-07-24)
- **Title/org:** TWRA tailwater stocking schedule PDF ("Tailwater Trout Stocking… Trout are stocked routinely during the following months").
- **URL:** https://web.archive.org/web/202007024025911/ → original https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/tailwater-stocking-schedule.pdf (capture 20200724025911).
- **Positional table extraction (pdfplumber) — Region IV rows:**
  - **Watauga River | Wilbur Dam | Rainbow Trout | "March through September" | Special Trout Regulations**
  - **Wilbur Reservoir | Watauga Dam | Rainbow Trout | "February through June" | Statewide Regulations** ← sibling LAKE (note: prior pass recorded the 2010/2020 schedule as lake "Feb–May"; this 2020 capture reads **Feb–Jun**).
  - (others: Clinch Mar–Aug+Dec; Holston/Cherokee Nov–Apr; SFH/Boone Jan,Mar,Apr,Dec; SFH/FPH Jan,Mar,Apr; SFH/South Holston Mar–Sep)
- **Page banner:** "In many tailwaters trout fishing can be good year-round."
- **Type:** official TWRA publication (planned months). **Confidence:** high. **Establishes:** circa-2020 official tailwater plan = **Mar–Sep** for the river; official TWRA framing that tailwater fishing "can be good year-round" (i.e., beyond stocked months).

### S3. Wilbur Tailwater Trout Fishery Management Plan 2022-2027 (Habera, Petre, Carter & Williams; TWRA, Feb 2022) — CORNERSTONE
- **URL (live):** https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Wilbur-Tailwater-Trout-Fishery-Management-Plan.pdf (30 pp; saved as wilbur_plan.pdf).
- **Key extracts:**
  - **Stocking through 2019 (rates "until 2020"):** adult rainbows "stocked throughout the tailwater during **March-September**": Mar 6,000 / Apr 6,000 / May 6,000 / Jun 6,000 / Jul 6,000 / Aug 6,000 / Sep 4,000 = 40,000. **No Oct–Feb.**
  - **From 2020, maintained 2022-2027:** Mar 6,000 / Apr 6,000 / May 6,000 / Jun 4,000 / Jul 4,000 / Aug 4,000 / Sep 4,000 + **Nov 3,000 + Dec 3,000** (June–August below-Blevins events shifted to November/December to avoid Striped Bass predation) = 40,000. **No October adult events; no Jan–Feb.**
  - **ENFH retired brood rainbow trout** (2,100/yr, 17-18 in, added 2020): "About half … stocked below Blevins Bend … **during August-October**" → **October** receives stocked fish.
  - Brown Trout stocking **discontinued tailwater-wide in 2015** to manage for a **wild Brown Trout fishery** (Habera et al. 2016); fingerling rainbow (50,000/yr since 2004) **discontinued 2021**; brook trout (adult+fingerling, ~63,000/yr) stocked **2001-2008**, discontinued (Damer & Bettoli 2008).
  - **Reproduction:** "there appears to be substantial natural reproduction as well"; July 2019 — 30 wild age-0 rainbows <100 mm in shoals near **Siam Bridge and Hunter Bridge**; Objective 1: fingerling suspension is a test — mean CPUE ≥42 fish/h by 2024 "would indicate adequate natural reproduction."
  - **Holdover:** "13 boat electrofishing stations … in **March each year** to provide an assessment of **carry-over trout populations** … before stocking begins"; total CPUE avg 242 fish/h (2017-21); Bettoli (1999) 200-day survival of stocked adult rainbows 17-27%, browns 46%.
  - **Temperature:** loggers deployed 27 Aug–10 Nov 2021 at Lovers Lane (RM 26.0) and Wagner Rd/Hwy 400 (RM 17.5): **no days >21°C**; anglers' summer-2021 concern not borne out. Wilbur Dam: 4 units, 2,680 cfs total; only the 1,766-cfs unit currently operational; **107 cfs minimum flow by spilling**; TVA DO target 6.0 mg/L met via Watauga Dam turbine venting (Scott et al. 1996).
  - **Regs history:** QZ est. **1989** (14-in min, 2-fish, artificials only; lower boundary moved to CSX bridge 2003); outside QZ 7-trout limit; M. cerebralis first TN detection 2017 (confirmed 2018; histology 2019, Ksepka et al. 2020); wild-trout-as-bait restriction eff. 3/1/2020.
  - **Creels:** 1998, 2002, 2006 (each **March–October only**), 2013, 2016, 2018, 2020; 2020: 16,998 trips / 93,320 h; rainbow harvest 34,000.
- **Type:** agency management plan (planned + monitoring). **Confidence:** high. **Establishes:** monthly stocking regime 2010-2027 by year-block; Oct–Dec stocking 2020+; Jan–Feb never stocked; wild (reproducing) brown and rainbow populations; year-round cold regime; trophy-section regs history.

### S4. Management Plan for the Wilbur Tailwater Trout Fishery 2004-2008 (Hawk, Habera, Bivens & Carter; TWRA, 25 Nov 2003) — the "2003 plan"
- **URL:** https://web.archive.org/web/20100529122000/http://tn.gov/twra/fish/StreamRiver/tailtrout/Wilbur.pdf (27 pp).
- **Key extracts:** February **2000 fish kill** (North American Corp. fire) destroyed trout in 10-16 km below Elizabethton incl. QZ; aggressive restoration stocking began within weeks, "complete by 2005" (per R4 2010). Stocking history: 1999 = 144,000 rainbows + 19,000 browns; 2000 ≈ 250,000 total (incl. 102,000 fingerling rainbows, 36,000 browns, 32,000 catchables); **2002: 40,000 brook fingerlings released in December** (early release of 2003 crop) — a documented **December** event; 2000-2002 avg 287,000/yr. Recommended from 2004: 40,000 catchable + 50,000 fingerling rainbows + 20,000 browns. "Some natural reproduction, particularly by brown trout (Banks and Bettoli 2000); these wild browns are genetically similar to the Plymouth Rock strain." Bettoli (1999) overwinter capacity 122 kg/ha. March electrofishing of overwintering population. QZ amendment effective 3/1/2003, re-proclaimed April 2003.
- **Type:** agency plan. **Confidence:** high. **Establishes:** 2003-era stocking composition/season (Mar–Sep adults + fingerlings; Dec 2002 brook event); natural reproduction acknowledgment; fish-kill reset.

### S5. Bettoli 2003 — "Survey of the Trout Fishery in the Watauga River, March–October 2002" (TWRA Fisheries Report 03-05, Feb 2003; TTU TCFRU)
- **URL:** https://web.archive.org/web/20100530133508/http://tn.gov/twra/fish/StreamRiver/tailtrout/2002%20-%20Watauga%20River.pdf (26 pp).
- **Key extracts:** creel 1 Mar–31 Oct 2002 (no winter coverage); 2002 stocking = 54,812 catchable + 179,047 fingerling rainbows, 17,562 catchable browns, 174,166 brook; "Some natural reproduction by rainbow trout and brown trout occurs (Bettoli 1999). Although water quality and discharge patterns are conducive to spawning, the substrate is heavily armored…" (Banks & Bettoli 2000); holdover: "up to 10% of the harvest represented fish that were **holdovers** from previous years"; 1991 minimum flow 107 cfs (1 h pulse/4 h); hub baffles 1991; river managed for trout 26 rkm; QZ est. **1988** per Bivens et al. 1997 (minor discrepancy with 2022 plan's 1989); rainbow size distribution "reflected … rainbow trout stocked throughout the year" (ambiguous phrasing; survey window Mar–Oct).
- **Type:** university/agency creel survey (observed). **Confidence:** high. **Establishes:** 2002 stocking volume + Mar–Oct creel frame; holdover; reproduction (literature-backed).

### S6. Bettoli 2007 — "Surveys of the Trout Fisheries in the Watauga River and South Fork Holston River, March–October 2006" (TWRA FR 07-07, Aug 2007)
- **URL:** https://web.archive.org/web/20100529121908/http://tn.gov/twra/fish/StreamRiver/tailtrout/Watauga%20and%20S.%20Hoston%20Creel%20Survey%202006.pdf (43 pp).
- **Key extracts:** 2006 stocking = 40,181 adult + 50,000 fingerling rainbows, 14,010 adult browns, 68,924 brook fingerlings; "Rainbow trout and brown trout **reproduce** in the Watauga River, **especially brown trout** (Holbrook and Bettoli 2006); … the river must be stocked to maintain fishable populations"; fish-kill recovery complete by 2006; TVA met minimum flow via continuous 225-cfs small turbine; same Mar 1–Oct 31 creel frame.
- **Type:** creel survey. **Confidence:** high. **Establishes:** 2006 stocking composition; reproduction statement.

### S7. Holbrook & Bettoli 2006 — "Spawning Habitat, Length at Maturity, and Fecundity of Brown Trout in Tennessee Tailwaters" (TWRA FR 06-11, Oct 2006) — REPRODUCTION CORNERSTONE
- **URL:** https://web.archive.org/web/20100530133443/http://tn.gov/twra/fish/StreamRiver/tailtrout/BrownTroutReproduction2006.pdf (46 pp).
- **Key extracts (Watauga reach rkm 55→27, 16 sites, 2005 field season):**
  - **Age-0 brown trout (n=255) collected at 9 of 16 sites**, catch up to 90 fish/h (WA-7); present at upper 8 sites (rkm 55-43) + lowermost rkm 26 → documented in-reach brown recruitment.
  - 16 potential spawning sites (most of 4 tailwaters studied); spawners mature at ~255 mm; fecundity lowest of the 4 rivers.
  - **"Coordinated releases from Watauga Dam (4.8 km upstream) and Wilbur Dam provide cold, hypolimnetic water that is suitable for brown trout survival and reproduction from rkm 55 to rkm 29."**
  - **Spawning season Oct–Dec at 6.1–8.9°C; Watauga temps fell within that range during fall/early winter**, and discharges "skewed towards low flows throughout the winter" (favorable incubation Jan–Feb). Redd leveling by peaking flows noted (Banks & Bettoli 2000).
- **Type:** university/agency research (observed). **Confidence:** high. **Establishes:** Oct–Feb life-cycle activity (spawning Oct-Dec; incubation/emergence Dec-Feb) physically supported by the year-round cold-release regime; direct age-0 evidence 2005.

### S8. TWRA Region IV Trout/Coldwater Fisheries Reports (Wayback set)
| Report (data year) | URL (Wayback capture) | Wilbur-relevant facts |
|---|---|---|
| Region 4 2010 (FR 11-01) | 20110711182552 of `tn.gov/twra/fish/StreamRiver/tailtrout/Region%204%202010%20Trout%20Fisheris%20Report.pdf` | 2010 stocking **94,000** (89,000 rainbow = 50k fingerling + 40k catchable; 5,000 browns below Hwy 400); brook discontinued 2009 (0.1-4.4% 100-d survival); browns 66-78% of electrofishing since 2001; "substantial natural reproduction, particularly by brown trout (Banks and Bettoli 2000; Holbrook and Bettoli 2006)"; wild-brown objective upper half; overwinter capacity 122 kg/ha "second only to SF Holston"; March sampling; no sampling 2008-09 (insufficient reservoir water) |
| R4 2017 (FR 18-?) | 20220813205505 | (parse failed — corrupted capture) |
| R4 2018 | 20220804000418 | 2018: **41,000 adult rainbows**; brown CPUE lower half 49 fish/h met 2015-2020 plan objective; Sept 2018 low-flow survey: 6 Striped Bass + several >508-mm browns below Blevins reach; 2018 creel whirling-disease awareness 60% |
| R4 2019 | 20220804073046 | 2019: **42,000 adult rainbows**; brown CPUE record 242 fish/h (upper stations 400/h); ≥457-mm CPUE 8/h (all browns); **30 age-0 wild rainbows collected July 2019** (WD screening negative); suggests testing whether Wilbur rainbow spawners use **Stony Creek Dec–Mar** |
| R4 2020 | 20220813222906 | (parse failed — corrupted capture) |
| R4 2021 | 20220813221805 | (parse failed — corrupted capture) |
| R4 2023 (covers 2022-23) | 20230820041714 | 2022: 505 trout (73% brown, max 680 mm); 2023: 425 (74% brown); rainbow CPUE 57 fish/h 2022-23 **exceeds 42 objective → wild rainbow reproduction sustaining fishery with no fingerlings since 2021**; **1,630 ENFH brood (avg 18 in) stocked 2022** below Blevins; adult rate **raised to 47,000 in 2023, extra 7,000 in June-September**; no fingerlings 2022-23 |
- **Type:** agency annual reports (observed). **Confidence:** high. **Establishes:** annual stocking totals 2010, 2018-2023; continuous reproduction/holdover record; management trajectory to wild fish.

### S9. Management Plan for the Wilbur Tailwater Trout Fishery 2015-2020 (Habera, Bivens & Carter; TWRA) — identical MD5 across 2018-07-17 and 2020-09-30 captures (replay verified)
- **URL:** https://web.archive.org/web/20180717180552/https://www.tn.gov/content/dam/tn/twra/documents/Wilbur_Tailwater_Trout_Fishery_2015-2020.pdf (19 pp).
- **Key extracts:** 12 stations sampled each March for "overwintering trout populations before stocking begins"; browns stocked 15-20k/yr through 2014 (39,000 extra in 2013; 5,000 in 2010); goal: wild brown fishery upper half → led to ending brown stocking in 2015; Bettoli 1999 survival figures restated.
- **Type:** agency plan. **Confidence:** high. **Establishes:** 2015-2019 regime continuity (Mar–Sep per S3 table "until 2020").

### S10. TWRA ArcGIS Online layers (live queries 2026-09-25)
- **Tailwater_Trout/FeatureServer/0** (13 polylines): **{"Name":"Watauga River","Species":"rainbow","Season":"March through July","Dam":"Wilbur Dam","Shape__Length":98,417 m}** — OBJECTID 21.
  - **Wayback pbf capture 2024-04-16** (20240416202613, gzip-decoded strings) shows the SAME "Watauga River / March through July / Wilbur Dam" row → the layer has said "March through **July**" since at least April 2024.
  - The two "March through December" rows in the same table are **Caney Fork** and **Elk** rivers — likely source of the prior pass's "March through December" reading for Watauga (misattribution).
  - URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/Tailwater_Trout/FeatureServer/0/query?where=1%3D1&outFields=*&f=json
- **TWRA_Trout_Stocking_Locations/FeatureServer/0**: 12 "Wilbur Tailwater" stream rows (reach) + 3 "Wilbur Reservoir" reservoir rows (lake; StockingProgram "Tailwater", NumStocked 250/250/500) — see Section 1.
- **StockedTrout2016/FeatureServer/0**: same 12 stream rows + 3 reservoir rows present in the April-2017-dated master (CreationDate 1492459087216) → the reach's site infrastructure existed in 2016.
- **Tailwater_Reservoirs/FeatureServer/0**: "Wilbur Reservoir | Season: Winter, Spring, Summer | rainbow" (LAKE polygon — sibling).
- **Type:** live agency GIS (planned/season labels + site registry). **Confidence:** high (values), medium (currency of "Season" strings). **Establishes:** reach site network; the live layer's Mar–Jul label; **contradicts both the catalog's [3..12] and the plan's Nov–Dec events** (layer strings are coarsely maintained — South Holston shows "March through September", matching its schedule, but Wilbur's string does not reflect the Nov–Dec events the 2022 plan says began 2020).

### S11. Completed-stocking live feed (destination-level)
- **2026 feed:** https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable.exceldriven.json (cols Region/Destination/Stocking Date; only 10 most-recent rows retained) → **"4 | Wilbur TW | 09/03/2026"**. Destination "Wilbur TW" = Wilbur Reservoir lake rows (S1 sibling discipline). **No tailwater-reach completed records in feed.**
- **2024 snapshot** (Wayback 20240927221436, `Trout_Stocking-Report.pdf`): **"4 Wilbur TW 09/05/2024"** — same lake destination.
- **Type:** completed (destination-level). **Confidence:** high. **Establishes:** lake-side completed stockings only; the reach has no date-level public completed record in these feeds (consistent with the tailwater program's Mar–Sep bulk events being unreported at date level).

### S12. Winter (coldwater) program lists — Jan/Feb test
- **"Coldwater Trout Stocking Schedule, Updated 2/18/2022"** (saved by prior pass as `sched2022cw.pdf`; matches Wayback capture 20220221220911 of `Coldwater-Trout_Stocking-Schedule.pdf`): Region 4 rows include "4 Cherokee TW 02/15/2022", "4 Dale Hollow TW 02/04/2022", "4 South Holston 01/26/2022", **"4 Watauga 01/25/2022"**, **"4 Wilbur 02/11/2022"**. Under TWRA destination vocabulary (Wilbur TW = lake; Watauga = Watauga Reservoir), these are **sibling-lake** winter events, not river-reach stockings. No "Wilbur Tailwater"/"Watauga River" row appears.
- **TWRA Winter Trout Schedule 2024-25** (Wayback 20241120115437): **no Carter County rows at all** → no Jan/Feb 2024-25 stocking of any Carter water.
- **2010-2013 and 2018-2020 stream schedules** (sched10-13.pdf, 2018/2019 official schedules, Complete.pdf 2020 capture): **Carter County lists only Doe River (DH), Elk River, Laurel Fork, Stony Creek — NO Watauga/Wilbur row** → the reach was never part of the seasonal stream schedule; it is stocked under the separate tailwater program (S2/S3).
- **Type:** planned/completed mix. **Confidence:** high. **Establishes:** NO Jan–Feb river-reach stocking found in any year 2003–2026; Jan–Feb events exist only for the sibling lakes.

### S13. TVA Wilbur Dam page (Wayback 2020-07-02)
- **URL:** https://web.archive.org/web/20200702135820/https://www.tva.com/energy/our-power-system/hydroelectric/wilbur-dam
- Dam 1912 (TVA acq. 1945), 76 ft, 375 ft, 4 units, 11 MW; "Even in the dog days of summer, Wilbur remains cool"; tailwater promoted for trout fishing. Live page 403/JS-blocked 2026-09-25.
- **Temperature regime (authoritative peer sources):** cold hypolimnetic releases suitable for trout survival AND reproduction rkm 55-29 (S7); spawning-range temps Oct–Dec (S7); zero >21°C days Aug–Nov 2021 at two stations (S3); 107-cfs minimum flow since 1991 + hub baffles/venting for DO ≥6 mg/L (S3, S5); historic DO "usually not below 4.0 mg/L" pre-improvement years (S5).
- **Type:** operator/agency. **Confidence:** high. **Establishes:** year-round cold-release regime (Q3 answered YES).

### S14. GBIF / NAS / iNaturalist occurrence lanes (leads)
- GBIF polygon (36.25-36.50N, -82.45--81.90W): Salmo trutta 194 occurrences, months recorded in 10 calendar months (Jan dominant: 172 records are USGS Nonindigenous Aquatic Species rows 1991-2007; plus Mar, Apr, May, Jun, Aug, Sep, Oct, Nov, Dec; Feb absent in this pull; 1 iNat 2024). O. mykiss 15 occurrences incl. Jan, Nov, Dec. **Leads only** — not stocking evidence; corroborates year-round presence/observation activity.
- **WJHL 3/11/2025 article ("43,000 rainbows/yr tailwater"): NOT re-located** (search engines rate-limited/blocked; wjhl.com site search JS-rendered). Prior pass verified it; treat as prior-pass-held context, not independently re-verified this pass.

---

## 3. MONTHS-BY-YEAR STOCKING TABLE (river reach below Wilbur Dam)

Legend: S=planned/actual agency-stated; ●=stocked; ○=no stocking planned/known; (n)=months added by special programs. Years without a row: no year-specific document located (regime follows the governing plan/schedule of its block).

| Year(s) | J | F | M | A | M | J | J | A | S | O | N | D | Governing evidence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2003 | ○ | ○ | ● | ● | ● | ● | ● | ● | ● | ○ | ○ | ○ | 2003 plan block (40k catchable + fingerlings + browns); Dec 2002 brook event shows Dec releases possible but one-off |
| 2004-2008 | ○ | ○ | ● | ● | ● | ● | ● | ● | ● | ○ | ○ | ○ | 2004-08 plan rec: 40k catchable + 50k fingerling RB + 20k browns; no cold-month rows anywhere |
| 2009 | ○ | ○ | ● | ● | ● | ● | ● | ● | ● | ○ | ○ | ○ | brook ended after 2008 season (R4 2010: "discontinued in 2009") |
| 2010 | ○ | ○ | ● | ● | ● | ● | ● | ● | ● | ○ | ○ | ○ | 94,000 total (R4 2010); 2009-2014 plan regime |
| 2011-2014 | ○ | ○ | ● | ● | ● | ● | ● | ● | ● | ○ | ○ | ○ | same block; browns 5k-39k/yr (2015-20 plan) |
| 2015-2019 | ○ | ○ | ● | ● | ● | ● | ● | ● | ● | ○ | ○ | ○ | 2015-20 plan + 2022 plan "until 2020: Mar-Sep" monthly table; brown stocking ENDED 2015 |
| 2020-2021 | ○ | ○ | ● | ● | ● | ● | ● | ●(b) | ● | ●(b) | ● | ● | 2022 plan Nov/Dec shift "beginning in 2020" + ENFH brood Aug-Oct; fingerlings end 2021; (b)=ENFH brood fish |
| 2022 | ○ | ○ | ● | ● | ● | ● | ● | ●(b) | ● | ●(b) | ● | ● | 2022 plan maintained; R4 2023: 1,630 brood 2022 |
| 2023-2027 | ○ | ○ | ● | ● | ● | ●● | ●● | ●●(b) | ●● | ●(b) | ● | ● | 47,000/yr from 2023 (extra 7k Jun-Sep); 2026 schedule JSON Mar-Sep (7 mo) + plan-mandated N,D + brood A-O |
| **Jan-Feb, ALL years** | ○ | ○ | | | | | | | | | | | **Never stocked in the reach 2003-2026 in any schedule, plan, report, or feed located** |

Note on 2026: the schedule JSON's 7 months (S1) is an UNDERSTATEMENT of the operative plan — the 2022 plan (S3) maintains Nov+Dec 3,000-fish events and Aug-Oct brood allocations "during 2022-2027," and R4 2023 confirms the 47k Jun-Sep enhancement. Oct coverage 2020+ rests on the ENFH brood allocation (Aug-Oct); 2003-2019 October had NO planned stocking.

---

## 4. OCT-FEB GAP COVERAGE (holdover / reproduction)

- **October:** stocked 2020+ (ENFH brood, below Blevins). Pre-2020: unstocked but famous big-brown month (spawning run begins); brown spawn window opens (S7).
- **November:** stocked 2020+ (3,000 adult rainbows below Blevins Bend). Wild brown spawn peak (Oct-Dec, 6.1-8.9°C documented in-reach).
- **December:** stocked 2020+ (3,000 adults) + one-off Dec 2002 brook release; egg incubation underway.
- **January-February:** NEVER stocked. Covered by: (1) **holdover** — March pre-stocking electrofishing every year since 1999 documents carry-over populations (2022 plan); 122 kg/ha overwinter capacity "second only to SF Holston" (Bettoli 1999 via R4 2010); 17-27% 200-day stocked-rainbow survival and 46% brown survival (Bettoli 1999); 10% of 2002 creel harvest were holdovers (S5); total CPUE 242 fish/h pre-stocking samples. (2) **reproduction** — self-sustaining wild brown population (no stocking since 2015, abundance INCREASED; age-0 browns at 9/16 sites 2005; eggs incubating Jan-Feb in verified 6-9°C winter water); wild rainbow reproduction demonstrated by the 2021-2024 fingerling suspension experiment passing its CPUE objective (57 vs ≥42 fish/h, R4 2023) + age-0 rainbows at Siam/Hunter shoals 2019. (3) **year-round cold regime** (S13). TWRA's own tailwater handbill: "In many tailwaters trout fishing can be good year-round" (S2).
- **Angling-culture corroboration (leads):** guides fish the reach year-round (ashevilleflyfishingco.com "Trophy Section … just downstream from Wilbur Dam"; wataugariverguides.com winter nymphing); 2026 regional report notes SF Holston (NOT Watauga) spawning closures Nov-Jan — Watauga has no closure, open all winter.

---

## 5. CONTRADICTIONS REGISTER

1. **Catalog months [3..12] vs live Tailwater_Trout "March through July" (2024-04-16 capture + 2026-09-25 live).** The layer string predates and postdates any plausible "Mar–Dec" reading; the two Mar–Dec rows in that table are Caney Fork and Elk. Prior pass's "March through December" for Watauga is probably a row misattribution. However the plan-level truth (Nov-Dec events 2020+, brood Oct) actually RE-ESTABLISHES Mar-Dec coverage on stronger documents than the layer string. → Catalog [3..12] survives, but its cited layer source should be corrected to the management plans.
2. **2026 schedule JSON (Mar–Sep) vs 2022 plan (Mar–Sep + Nov + Dec + brood Aug–Oct).** The JSON row omits the plan-mandated N/D events; the plan says "This schedule will be maintained during 2022-2027." Planned-evidence-only readers would wrongly conclude no Nov/Dec stocking.
3. **QZ establishment year:** 1988 (Bettoli 2003, citing Bivens et al. 1997) vs 1989 (2022 plan).
4. **Lake sibling season:** prior pass "Wilbur Reservoir Feb–May" (2010/2020 schedules) vs 2020-07 capture "February through June"; polygon layer says "Winter, Spring, Summer." Sibling-row owner should re-verify.
5. **Winter-list naming:** "Watauga"/"Wilbur" (2022 winter list) are lake destinations; sibling discipline must not read them as river events. (Contrast: "Cherokee TW"/"Dale Hollow TW" rows ARE river tailwaters with TW suffix.)
6. **R4 2017/2020/2021 PDFs:** Wayback captures corrupted (parse failures) — data years 2017, 2020, 2021 rest on other documents (2018/2019/2023 reports + 2022 plan).

---

## 6. SEARCHES RUN (2026-09-25; U = unproductive)

1. W: "Wilbur Dam tailwater Watauga River trout stocking schedule TWRA" — confirmed tn.gov seasons (Mar–Dec legend text; Mar–Jul lake rows).
2. W: TWRA "coldwater trout stocking" winter schedule region 4 — winter program exists (Dec-Mar), eRegulations note.
3. W: Bettoli 1999 creel "Watauga River" "Wilbur Dam" FR 99-41 — citations only; no full text online (report not archived).
4. W: Watauga tailwater brown trout spawning run fall winter Elizabethton trophy — guide corroboration (U for agency data).
5. W (timeout) + 6-7. WJHL trout stocking Watauga 2025 (x2) — U (article not re-found).
8-16. DDG-HTML: wjhl site:, Banks&Bettoli 00-19, Damer&Bettoli 2008, year-round winter fishing, TVA cold releases, spawning closure, Habera 2009-14, "Wilbur TW", weir — ALL U (captcha wall; note: no weir exists at Wilbur per all agency docs).
17-19. Bing-HTML x3 — U (JS shell, no organic results).
20. W: Wilbur Dam cold water releases temperature trout hypolimnetic TVA — S7/S13 confirmations + SEAFWA/AFS context.
21. Wayback CDX: tn.gov twra stockedtrout/tailtrout dir — found 10+ primary PDFs (S2, S4-S9).
22. Wayback CDX: content/dam/tn/twra/documents — found R4 2017-2023, schedules, 2015-2020 plan, winter schedules, stocking report.
23. Wayback CDX: Tailwater_Trout FeatureServer captures — 2024-04-16 pbf decoded.
24. GBIF polygon queries (Salmo trutta, O. mykiss; + NAS dataset drill-down) — Section S14.
25. GBIF January-record characterization (NAS 1991-2007) — S14.
26. wjhl.com direct site search fetch — U (JS-rendered).
U-lane summary: WJHL re-verification, Banks & Bettoli 00-19 full text, Damer & Bettoli 08-03 full text, Habera 2009-2014 Wilbur plan full text — all unresolved (either blocked or not archived).

---

## 7. VERDICT & RECOMMENDATION

**Does `year-round-trout` survive? YES — but re-based on plan-level evidence, not the map layer.**

- **Mar–Dec is genuinely supported for the current era:** stocking March–September (all years), November + December (2020+, 3,000 fish each, plan-mandated through 2027), August–October ENFH brood (2020+). For 2003-2019 the stocked months were Mar–Sep only, so catalog months [3..12] are anachronistic for those years but correct from 2020 forward.
- **Oct–Feb gap:** Oct, Nov, Dec are now (2020+) directly stocked; January–February have never been stocked in the reach, and are covered by strong, repeatedly documented holdover (annual March carry-over sampling; 200-day survival; 122 kg/ha winter capacity) and reproduction (self-sustaining wild browns — stocking ended 2015 yet abundance rose; age-0 browns 2005; wild rainbow CPUE objective passed 2022-23 after fingerling suspension) inside a verified year-round cold-release regime. Under the stated standard (continuous stocking OR documented holdover/reproduction across gap months), **the YR flag is defensible**.
- **Recommended ledger treatment:** keep `year-round-trout` with months [3..12] for the current era (2020+), citing S3 (2022 plan monthly tables) + S7 (reproduction) + S13 (temperature) as the basis; treat Mar–Sep as the conservative stocked-months core for pre-2020 years; DO NOT cite the Tailwater_Trout layer's "March through July" as season authority (stale/coarse string; contradicted by plans); correct the prior pass's "March through December" layer reading (rows are Caney/Elk). Destination discipline: "Wilbur TW" completed rows (09/03/2026; 09/05/2024) = LAKE (sibling), not this river; Jan-Feb "Watauga"/"Wilbur" winter events = lakes (siblings).
- **Key gap:** no date-level completed stocking record for the river reach itself (tailwater program publishes none); WJHL 2025 figure (43k/yr) not independently re-retrieved. **Record holder for the classification:** TWRA Wilbur Tailwater Trout Fishery Management Plan 2022-2027 (Feb 2022, live tn.gov URL) — monthly stocking tables 2010-2027, reproduction objective/results, temperature loggers.
