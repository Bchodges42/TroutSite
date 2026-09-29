# Research Completion Log — Holston River (Cherokee Dam tailwater), Jefferson County, TN

- Water: Holston River below Cherokee Dam ("Cherokee Tailwater" / "Cherokee TW"), TWRA Region 4 (Morristown)
- Ledger verdict under test: `year-round-trout` with catalog months [11,12,1,2,3,4] and YR flag set
- Research date: 2026-09-25 (all retrievals this date unless noted)
- Mode: internal classification research, owner's map; no agencies/businesses/authors contacted; no edits outside this notes file
- Sibling discipline kept: Cherokee Lake (reservoir) separate; Holston main stem above dam separate; South Fork Holston waters (Boone / Ft. Patrick Henry / South Holston TWs) kept separate in every grep ("Holston" hits are ambiguous by default)

## 1. Reach / coordinates

- Catalog line: 102,083 ft (≈19.3 mi) — matches the managed reach "upper 30 km (18.8 mi) of the Cherokee tailwater, from the dam downstream to the vicinity of Nance Ferry" (TWRA Region 4 reports). TWRA monitoring stations (2010 report, Table 3-3): 12 stations, river miles 51.8 → 39.5, coordinates 36.153–36.180 N, −83.504 to −83.602 W (Joppa quadrangle), HUC 06010104-3,4; counties Grainger/Jefferson.
- TWRA Trout MASTER stocking-locations point: "Hwy. 92 / Cherokee Dam", StreamName "Cherokee Tailwater", 36.16792, −83.50391, Jefferson County, StockingProgram "Tailwater", species rainbow_brown, management TWRA, sunrise-to-sunset access.
- 2026 schedule row county: "Jefferson/Grainger".

## 2. Source-by-source evidence

### S1. TWRA ArcGIS FeatureServer — Tailwater_Trout (live, retrieved 2026-09-25)
- URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/Tailwater_Trout/FeatureServer/0/query?where=1%3D1&outFields=*&f=json
- Org: Tennessee Wildlife Resources Agency (hosted ArcGIS Online). Publication date: current live layer. Retrieval: 2026-09-25.
- Holston row (OBJECTID 36): `Name: Holston River | Species: rainbow, brown | Season: November through April | Dam: Cherokee Dam | Shape__Length: 102083.5 ft`
- Sibling rows confirm separation: SF Holston @ Ft. Patrick Henry (March–April), @ Boone (Jan, Mar, Apr, Dec), @ South Holston (March–September) — all DIFFERENT waters.
- Type: agency catalog (planned). Confidence: high. Establishes: the six-month Nov–Apr seasonal window in the CURRENT official layer; the six-month window cannot be continuous year-round stocking.

### S2. TWRA ArcGIS FeatureServer — TWRA_Trout_Stocking_Locations (Trout_MASTER_Project) (live, retrieved 2026-09-25)
- URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0/query
- Cherokee Tailwater site row (OBJECTID 719) as in §1 above. Only ONE Cherokee TW access point in the layer. County neighbors (Mossy Creek winter program, Jefferson Co.) correctly separate.
- Type: agency catalog (access/site inventory). Confidence: high. Establishes: active tailwater stocking-program site designation; coordinates.

### S3. TWRA 2026 trout stocking schedule JSON (live, retrieved 2026-09-25)
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json (tn.gov blocks plain curl; fetched with browser User-Agent)
- 616 rows. Row: `REGION 4 | COUNTY Jefferson/Grainger | LOCATION "Cherokee TW / Holston River" | TYPE Tailwater | STOCKING MONTHS "J, F, M, A, N, D" | SPECIES Rainbow, Brown Trout`
- Type: agency plan (planned, month-level). Confidence: high. Establishes: the 2026 stocking window is Jan, Feb, Mar, Apr, Nov, Dec — no May–Oct. Program active for 2026.

### S4. Completed-release feed (live TWRA "Trout Stocking Report", retrieved 2026-09-25)
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable.exceldriven.json
- 10 rows, dates 08/28/2026–09/18/2026 (rolling recent-completions window). Region 4 completions in window: Buffalo Creek 08/27. NO Cherokee TW row.
- Archived equivalent: Wayback capture of 9/27/2024 "Trout Stocking Report" PDF (https://web.archive.org/web/20240927221436/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Trout_Stocking-Report.pdf) — 7 destinations 08/29–09/26/2024; Region 4: Buffalo Creek, South Holston TW, Wilbur TW — NO Cherokee TW.
- Interpretation: absence in Aug–Sep windows is EXPECTED under a Nov–Apr season (program demonstrably still running — other waters stocked). Does NOT show inactivity; shows off-season silence. Type: agency completed (destination-level). Confidence: high.

### S5. Wayback archived TWRA tailwater trout page (tailtrout.html), captured 2010-05-29
- URL: https://web.archive.org/web/20100529052424/http://tn.gov/twra/fish/StreamRiver/tailtrout/tailtrout.html
- Tailwater season table row: `Holston River | Cherokee Dam | rainbow trout brown trout | November through April` — identical window to 2026.
- Same table era note: "Each year TWRA biologist survey trout populations in tailwaters…"
- Type: agency schedule (planned, ~2010). Confidence: high. Establishes: the Nov–Apr window predates 2026 by ≥16 years; NOT a recent schedule change.

### S6. Wayback archived tailwater-stocking-schedule.pdf (2020 era), captured 2020-09-30
- URL: https://web.archive.org/web/20200930133127/https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/tailwater-stocking-schedule.pdf
- Table: `Holston River | Cherokee Dam | Brown and Rainbow Trout | November through April | Statewide Regulations`
- Header text: "In many tailwaters trout fishing can be good year-round. Trout are stocked routinely during the following months." Footnote "* Seasonal Fishery - only productive during stocked months" is attached to Duck River*, Stones River*, Ocoee River* — NOT to the Holston row.
- Type: agency schedule (planned, 2020). Confidence: high. Establishes: 2020 window = Nov–Apr. CONTRADICTION flagged: the generic "year-round" sentence is a tailwater-program-wide marketing line, not a Holston-specific claim; and TWRA's own asterisk system (used for other waters) was not applied to Holston despite the identical six-month shape of its window.

### S7. TWRA Region 4 Trout Fisheries Report 2010 (Habera, Bivens, Carter, Williams; published May 2011), retrieved 2026-09-25
- URL: https://web.archive.org/web/20110711182552/http://www.tn.gov/twra/fish/StreamRiver/tailtrout/Region%204%202010%20Trout%20Fisheris%20Report.pdf
- Cherokee (Holston River) chapter (report pp. 125–129):
  - History: "TWRA historically (although infrequently) stocked trout there" — 39,000 rainbow/brown/brook 1951–1955; fingerling browns 1974; fingerling rainbows 1993 (pre-improvement, "limited success"); "Beginning in 1995, trout stocking… became more consistent."
  - 2010: 52,000 adult RB + 7,000 BT; 5-yr avg (2006–2010) 51,000 adult RB + 14,000 BT (4–7 in).
  - 2008 policy: fingerling RB discontinued (low recruitment potential).
  - Management: dam → Nance Ferry "put-and-take and put-and-grow."
  - Thermal bottleneck: "late summer temperatures can remain above 21°C for weeks, creating a thermal 'bottleneck' that severely limits trout survival (i.e., carryover). Along with the relative scarcity of trout in October electrofishing surveys… the Cherokee tailwater provides marginal trout habitat during summer and early fall."
  - Temperature (2005–2010 avg): max >21°C near dam from last week of August through mid-October (~7 weeks); Blue Spring (13 km below dam) >21°C from mid-August; NO coldwater habitat (min >21°C) Aug 28–Sep 28 at Blue Spring; returns <21°C by mid-October.
  - Oct 2010 electrofishing: 11 trout (9 RB, 2 BT) total across 12 stations.
  - Marked cohort stocked April AND May 2009 (Habera et al. 2010b) — none recaptured Oct 2010.
  - Management recommendation (verbatim): "Most adult stocking should be conducted in the fall (beginning in November) and winter to maximize the potential for growth before water temperatures become limiting."
  - "While some trout are able to find thermal refugia… and survive through at least one summer — evident by the large (>500 mm) fish — most do not." "Even with the summer/fall thermal bottlenecks, angling opportunities are available during most months."
- Type: agency monitoring/report (observed). Confidence: high. Establishes: stocking magnitude, put-and-take character, severe summer carryover limit, November-start stocking policy.

### S8. TWRA Region 4 trout reports 2004, 2005, 2007, 2009, 2011, 2013 (twra4streams.org, archived 2013–2014), retrieved 2026-09-25
- URLs (Wayback):
  - 2004: https://web.archive.org/web/20130207191315/http://www.twra4streams.org/04troutreport.pdf
  - 2005: https://web.archive.org/web/20130207191311/http://www.twra4streams.org/2005trout.pdf
  - 2007: https://web.archive.org/web/20130207191309/http://www.twra4streams.org/2007trout.pdf
  - 2009: https://web.archive.org/web/20130207191324/http://www.twra4streams.org/2009trout.pdf
  - 2011: https://web.archive.org/web/20130207191330/http://www.twra4streams.org/2011troutweb.pdf
  - 2013: https://web.archive.org/web/20140412202905/http://www.twra4streams.org/2013R4trout.pdf
- Annual Cherokee totals (chapter "Cherokee tailwater received…"):
  - 2004: 226,000 total, incl. 152,000 fingerling RB + 30,000 BT; RB stocked annually since 1999 (avg 88,300 fingerling + 35,300 catchable/yr); BT fingerlings since 2001 (~35,900/yr)
  - 2005: 82,000 RB (63,000 fingerlings); 0 BT
  - 2007: 29,000 catchable RB + 67,000 fingerling RB + 18,000 BT
  - 2009: 99,000 adult RB + 9,000 BT (+ a 50,000 fingerling RB anomaly); 5-yr avg 41,000 adult RB + 11,000 BT
  - 2011: 49,000 adult RB + 10,000 BT
  - 2013: 30,500 adult RB + 22,000 BT; 5-yr avg 41,000 RB + 13,000 BT (159–214 mm)
  - 2013 recommendation (verbatim): "Most adult stocking should be conducted in the fall (beginning in November) and winter… No fish should be stocked during July through October because of water temperatures >21°C." Carryover month quantified: ~29 Aug–28 Sep without cold water; some fish survive a summer in refugia; "most do not."
  - Monitoring design (all years): all Region 4 tailwaters sampled late Feb/March EXCEPT Cherokee, "sampled in the fall (October), as trout survival over the summer is a more important issue for that fishery" — stations established 2003.
- Type: agency monitoring (observed). Confidence: high. Establishes: continuous annual stocking 1999–2013 inclusive; explicit July–October no-stocking rule; Oct/Nov–winter–spring stocking pattern; fall-sampled carryover question.

### S9. TWRA Coldwater Trout Reports R4 2018, 2019, 2020, 2023 (tn.gov, archived), retrieved 2026-09-25
- URLs (Wayback):
  - 2018: https://web.archive.org/web/20220804000418/http://www.tn.gov/content/dam/tn/twra/documents/fishing//trout/Coldwater-Trout-Report-R4-2018.pdf
  - 2019: https://web.archive.org/web/20220804073046/http://www.tn.gov/content/dam/tn/twra/documents/fishing//trout/Coldwater-Trout-Report-R4-2019.pdf
  - 2020: https://web.archive.org/web/20210820060301id_/https://www.tn.gov/content/dam/tn/twra/documents/fishing/2020_Region4_Coldwater_Trout_%20Report.pdf
  - 2023: https://web.archive.org/web/20230820041714/https://www.tn.gov/content/dam/tn/twra/documents/fishing//trout/Coldwater-Trout-Report-R4-2023.pdf
- Key Cherokee content:
  - 2018: sampled June AND October 2018. June CPUE 18 fish/h ≥178 mm (record); "subsequent October sample declined (as expected)." "…it is evident that some trout (both species) survive the September/October thermal bottleneck." No coldwater habitat 43 days near dam / 42 at Blue Spring. Stocking: 55,000 adult RB (239 mm) + 46,000 sub-adult BT (199 mm); 5-yr avg 29,000 RB + 29,000 BT. "Little correlation between… stocking rates during **October–May** (35,000–109,000) and subsequent fall electrofishing catch rates." Fishery now "managed primarily as a put-and-take… although some… survive beyond a year, providing a put-and-grow aspect."
  - 2019: June CPUE 15; October CPUE 1.5 fish/h (near record low); 2019 warmest water since 2003; no coldwater habitat 72 days near dam; <21°C not until first week of November. Stocking: 26,000 adult RB + 9,000 sub-adult BT; 5-yr avg 27,000 RB + 28,000 BT; same "October–May" stocking-season phrasing.
  - 2020: sampled June + October 2020; October CPUE 12.5 fish/h (highest since 2015); no coldwater habitat 41 days near dam. Program active.
  - 2023 report: Cherokee monitored annually; "sampled in both summer (June) and fall (late October/early November)… trout survival over the summer/early fall is the most important issue." 2022 stocking: 55,000 adult RB (229–254 mm) + 34,000 sub-adult BT (203–229 mm); 5-yr avg 40,000 RB + 26,000 BT. 2022 temps: max ≥21°C 50 days (27 Aug–15 Oct). "No fingerlings are stocked there, as few would survive the thermal bottleneck."
- Type: agency monitoring (observed). Confidence: high. Establishes: program active through at least 2023 reporting; stocking season phrased as October–May in the 2018–2019 reports (slightly wider than the Nov–Apr catalog line); June samples catch holdovers grown on spring stocking; "some survive… most do not" carryover model confirmed into the 2020s.

### S10. TWRA Coldwater-Trout_Stocking-Schedule.pdf — completed-stocking tables (Wayback captures), retrieved 2026-09-25
- URLs: 20220221220911 / 20220519195104 / 20220629093934 / 20220819214551 under https://www.tn.gov/content/dam/tn/twra/documents/fishing/trout/Coldwater-Trout_Stocking-Schedule.pdf
- Completed destinations with dates:
  - Updated 2/18/2022: `4 | Cherokee TW | 02/10/2022` (dated completed row, February 2022)
  - Updated 5/17/2022: Region 4 tailwaters stocked through late April–mid-May (Ft. Patrick Henry 4/21, Wilbur 4/26, Norris 5/09) — no Cherokee row listed in that rotation
  - Updated 6/17/2022 and 8/18/2022: no Cherokee row
- Type: agency completed (destination-level, dated). Confidence: high. Establishes: Cherokee TW stocked February 2022; silent June–Aug 2022.

### S11. Wayback captures of the trout-information-stockings page (2018–2025), retrieved 2026-09-25
- URLs: https://web.archive.org/web/20190112223300/https://www.tn.gov/twra/fishing/trout-information-stockings/ ; …/20200124221849/… ; …/20200424011138/… ; …/20241208155225/… ; …/20250324085906/… ; (Sept-2024 and Jan-2025 captures contain no Cherokee TW)
- "Recent stockings" destination lists include "Cherokee TW" at captures: Jan 2019 (winter 2018–19; nearby date 12/26/2018), Jan 2020 (1/14/2020), Apr 2020 (4/21/2020), Dec 2024 (dates 11/27–12/04/2024 nearby), Mar 2025 (03/04/2025 nearby). NOTE: the page pairs destinations and dates in separate columns; flattened text pairing is approximate — treat as destination-level completions in winter/early-spring windows, not exact-date evidence (except where a PDF gives exact dates, S10).
- Type: agency completed (destination-level). Confidence: medium (pairing ambiguity). Establishes: winter completions 2018–19, 2019–20, spring 2020, Nov–Dec 2024, Mar 2025; absence at Sept-2024 and Jan-2025 captures (off-season/rotation).

### S12. Tennessee Trout Management Plan 2017–2027 (TWRA), retrieved 2026-09-25
- URL: https://www.tn.gov/content/dam/tn/twra/documents/fishing/Tennessee-Trout-Management-Plan-2017-2027.pdf
- Verbatim: "The Cherokee and Apalachia tailwaters also have summer thermal bottlenecks (with water temperatures >70°F) and receive adult Rainbow and Brown Trout **during the fall and spring**."
- Cherokee = lightly-to-moderately fished (3,000–10,000 trips/yr); management plan for Cherokee "currently lacking" (strategy to develop one); recommends considering warmer-environment rainbow strains for Cherokee because of its thermal regime.
- Type: agency plan. Confidence: high. Establishes: statewide policy-level characterization of Cherokee stocking = fall + spring only.

### S13. Occurrence databases (retrieved 2026-09-25)
- GBIF (https://api.gbif.org/v1/occurrence/search, polygon 36.00–36.28N, −83.70 to −83.35W = tailwater reach):
  - Rainbow (Oncorhynchus mykiss): 4 records — 2023-10-21 (36.2054,−83.5554, iNat #232939894), 2025-05-18 (36.2040,−83.5560, iNat #346302797), 2026-07-03 (36.1727,−83.5103, iNat #379576252), 2026-09-05 (36.1953,−83.5446, iNat #397634131).
  - Brown (Salmo trutta): 11 records 2003–2007 at 36.11–36.17, −83.51 to −83.65 (no month precision; museum/agency-style occurrence rows) — presence in/near reach during the modern stocking era.
  - Type: third-party observations/occurrences. Confidence: low-medium. Establishes: single angler-observed trout in the reach in May, July, Sept, Oct — consistent with TWRA's documented limited refugial carryover ("single catches = leads", NOT evidence of a year-round managed fishery). No evidence of reproduction (no young-of-year records; TWRA states no significant natural reproduction and no fingerlings stocked).
- iNaturalist API: species-level spatial queries returned unfiltered results (API param misuse); used GBIF's iNat research-grade mirror instead (above). NAS (USGS nonindigenous): API species-ID lookup failed (ID space mismatch) — unproductive lane; GBIF museum rows stand in.

### S14. Angler-side corroboration (retrieved 2026-09-25)
- R&R Fly Fishing, "Fly Fishing in Tennessee: The Holston River below Cherokee Dam" (https://randrflyfishing.com/articles/fly-fishing-in-tennessee-the-holston-river-below-cherokee-dam): "This is essentially a winter and spring trout fishing spot though. Water temperatures in the summer are generally too warm for trout…"; caddis "builds through April… peaking in late April or early May"; upper reach near dam "a far more consistent trout fishery… due to much cooler water temperatures"; summer = smallmouth/carp.
- Trout Zone Anglers (Holston guide page, https://troutzoneanglers.com/tennessee-fly-fishing-guide/guide-trip-destinations/holston-river-fly-fishing-guide): by mid-to-late summer water too warm to target trout.
- Type: non-authoritative corroboration. Confidence: medium. Establishes: independent angler consensus matches the agency picture (seasonal winter/spring trout fishery with a dam-proximity cool-water extension).

## 3. Months-by-year stocking table (Holston / Cherokee TW only; SF Holston rows excluded)

Legend: SCHEDULE = planned window documented; NUM = annual total from Region 4 report; COMPLETED = dated destination-level completion(s) observed. Months actually evidenced per year are what the row shows; a blank in May–Oct means no evidence of stocking then (July–Oct explicitly prohibited from 2013 guidance onward).

| Year | Evidence | Months supported |
|---|---|---|
| 1951–1955 | S7: 39,000 total (infrequent) | irregular, historic only |
| 1974 | S7: fingerling BT | 1 (historic) |
| 1993 | S7: fingerling RB | 1 (historic) |
| 1995–1998 | S7/S8: consistent stocking begins (no monthly detail) | unknown, cold-season assumed |
| 1999–2003 | S8 (2004 report): RB annually since 1999; BT since 2001; no monthly detail | cold-season assumed (schedule-era table confirms Nov–Apr by 2010) |
| 2004 | S8: 226,000 total (152k FRB, 30k BT) | schedule Nov–Apr (no monthly detail) |
| 2005 | S8: 82,000 RB (63k FRB), 0 BT | Nov–Apr (assumed) |
| 2007 | S8: 29k catchable RB + 67k FRB + 18k BT | Nov–Apr (assumed) |
| 2008 | S7: fingerling RB policy ends | Nov–Apr |
| 2009 | S7: 99k adult RB + 9k BT; marked fish stocked Apr AND May | Nov–Apr + MAY (documented) |
| 2010 | S7: 52k adult RB + 7k BT; Oct CPUE 11 trout/12 stations | Nov–Apr |
| 2011 | S8: 49k adult RB + 10k BT | Nov–Apr |
| 2012 | (report year not archived; covered by 5-yr avgs) | Nov–Apr (avg-based) |
| 2013 | S8: 30.5k adult RB + 22k BT; NO stocking July–Oct policy | Nov–Apr (Jul–Oct banned) |
| 2014–2017 | S9: 5-yr avg 29k RB + 29k BT; season "October–May (35,000–109,000)" | Oct/Nov–Apr (+May possible) |
| 2018 | S9: 55k adult RB + 46k sub-adult BT; June CPUE 18 | Oct–May window |
| 2019 | S9: 26k adult RB + 9k BT; Oct CPUE 1.5 | Oct–May window; winter completed 1/2020 (S11) |
| 2020 | S9: sampled Jun+Oct; S11 completed Jan + Apr 2020 | Jan, Apr (+schedule Nov–Apr) |
| 2021 | S9 2021 report truncated in archive (gap) | schedule Nov–Apr (program active per 2023 report avgs) |
| 2022 | S10: COMPLETED 02/10/2022; S9(2023): 55k RB + 34k BT | Feb (dated); Nov–Apr |
| 2023 | S9 (2023 report): monitoring June + late Oct/early Nov | Nov–Apr (report covers 2022–23) |
| 2024 | S11: completed Nov–Dec 2024; S4: absent from Aug–Sep 2024 report | Nov, Dec (+schedule Jan–Apr) |
| 2025 | S11: completed Mar 2025; Jan-2025 capture absent | Mar (+Nov–Dec window) |
| 2026 | S3: plan J,F,M,A,N,D; S4: absent from live Aug–Sep 2026 completions | planned Nov–Apr |

Overall month coverage across 2003–2026: stocked months evidenced = Nov, Dec, Jan, Feb, Mar, Apr (+ May in 2009 and "October–May" phrasing for 2013–2019). Months NEVER evidenced for stocking: Jun, Jul, Aug, Sep, Oct (Oct sometimes as season-opener phrasing only). Summer trout presence = carryover only, explicitly limited ("most do not" survive; Oct CPUE 1.5–12.5 fish/h after summers vs June 15–18 fish/h).

## 4. Species
- Rainbow Trout (Oncorhynchus mykiss) — adults/catchables, annually since 1999 (current: ~27k–55k/yr).
- Brown Trout (Salmo trutta) — sub-adults/fingerlings, currently ~9k–46k/yr.
- Brook trout only in the historic 1951–55 loads. No fingerling rainbow stocking since 2008 (low recruitment). No documented natural reproduction contributing to the fishery (unlike South Holston/Wilbur).

## 5. Contradictions / tension points (stated honestly)
1. Tailwater_Trout GIS row + 2026 plan (Nov–Apr) vs 2018/2019 report phrasing "stocking rates during October–May" — the operational window has occasionally run Oct→May (May documented 2009; Oct-start hinted). Still never May–Oct; catalog months [11,12,1,2,3,4] are essentially correct, at worst off by one month at each end in some years.
2. 2020 schedule PDF: generic "In many tailwaters trout fishing can be good year-round" + no "* Seasonal Fishery" asterisk on the Holston row — superficial support for a YR reading, but the same PDF lists Holston's stocking as Nov–Apr only, and TWRA's asterisk system was applied to other (also-month-limited) waters inconsistently. The generic sentence refers to genuinely year-round tailwaters (e.g., South Holston/Watauga), not Cherokee.
3. "Angling opportunities available during most months" (2010/2013 reports) — true for a handful of refugial holdovers/large fish, but the same reports quantify the summer crash (Oct CPUE 1.5–5.5 fish/h; marginal summer habitat; warmwater species dominance). Angling presence ≠ stocked fishery year-round.
4. Completed feeds (Aug–Sep 2024, Aug–Sep 2026) show no Cherokee rows while other Region 4 waters were stocked — consistent with the seasonal window, not evidence of program death.
5. 2026 plan says stocking months J,F,M,A,N,D — no May — matching catalog months exactly.

## 6. Searches run (WebSearch top-level queries; several sub-queries were rate-limited 429 and are marked)
1. Cherokee Dam tailwater Holston River trout stocking TWRA schedule — ok
2. Holston River trout stocking November through April TWRA Cherokee tailwater — ok
3. TWRA "Region IV" trout fisheries report 2022 2023 Cherokee tailwater Holston electrofishing — partial (429s)
4. digitalcommons.memphis.edu TWRA Cherokee tailwater trout fishery management plan Holston — no Cherokee-specific doc found
5. "tn.gov" TWRA trout fisheries report pdf Cherokee tailwater electrofishing October — no direct PDF hits (led to CDX success instead)
6. TVA Cherokee Dam tailwater water temperature release summer trout survival Holston River — ok (angler corroboration)
7. "Cherokee tailwater"/"Holston River below Cherokee Dam" fly fishing caddis trout winter put-and-take — 429s
8. Holston River Cherokee tailwater trout holdover carryover October electrofishing survey Jefferson County — partial; surfaced TWRA StoryMap forecast + weekly report
9. Oncorhynchus mykiss Salmo trutta Holston River Jefferson County Tennessee iNaturalist — 429s, taxon pages only
10. TWRA trout stocking report Cherokee TW 2024 2025 completed November December — 429s (superseded by direct Wayback PDF evidence)
Plus direct fetches: ArcGIS services directory + 3 layer queries; 2026 schedule JSON; live completed feed; live stockings page; 15+ Wayback captures (CDX enumerations of tailtrout/*, stockedtrout/*, twra4streams.org, tn.gov content/dam trout dir); GBIF API (2 queries); iNat API (2 queries, one unproductive); NAS API (2 queries, unproductive); TVA release-temperature lane ultimately covered by TWRA's own hourly logger data (better source).

Unproductive lanes: digitalcommons.memphis.edu Cherokee-specific plan; USGS NAS API (ID mismatch); iNat direct API filtering; TVA waterdata for release temps (skipped after TWRA logger data found); StoryMap/weekly-report static scrape (JS-rendered, empty).

## 7. RECOMMENDATION

**The `year-round-trout` verdict does NOT survive. Downgrade Holston River (Cherokee Dam tailwater) to `seasonal-stocked`, window November–April.**

Basis:
- Every agency schedule surface across 16+ years — 2010 tailtrout table, 2020 tailwater PDF, the live Tailwater_Trout GIS row, and the 2026 plan (J,F,M,A,N,D) — states November through April. TWRA's 2013 management guidance bans stocking July–October outright and directs most stocking to fall/winter; the 2017–2027 statewide plan describes Cherokee stocking as "fall and spring."
- Annual stocking 1999–2023+ is continuous ACROSS YEARS but strictly seasonal WITHIN each year (~26k–226k fish/yr; program still active in 2024–2026 — completions Nov/Dec 2024, Mar 2025, Feb 2022 dated).
- The May–Oct gap is real and agency-documented: 4–10 weeks each summer with zero coldwater habitat (>21°C minimums, max 24–25°C), October electrofishing catch rates collapsing to 1.5–12.5 fish/h, warmwater-species dominance, and TWRA's own wording — put-and-take, "severely limits trout survival (i.e., carryover)," "most do not" survive summer. No reproduction; no fingerlings since 2008.
- The catalog months [11,12,1,2,3,4] are CORRECT; only the YR flag is wrong. (Optional refinement: some 2013–2019 evidence suggests an Oct-start/May-end tail in individual years, e.g., May 2009 mark cohort; if the schema supports it, note "occasionally May" — but do not let that widen the classification.)
- Keep the sibling boundary: nothing in the Cherokee row should inherit South Holston TW's genuinely longer season (Mar–Sep) or the SF Holston put-grow-take waters.

Key gap: no dated completed-stocking rows for 2014–2017 and 2021 (Wayback capture gaps; 2021 R4 report PDF truncated at 1 MB in archive). Record holder for the file: TWRA Coldwater-Trout_Stocking-Schedule.pdf (2/18/2022) with the dated "Cherokee TW | 02/10/2022" row, plus the 2010 Region 4 report's stocking history and thermal-bottleneck chapter.
