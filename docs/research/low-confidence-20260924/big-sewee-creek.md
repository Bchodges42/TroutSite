# Big Sewee Creek — Trout Evidence Research Log
Water: Big Sewee Creek ("Sewee Creek" on USGS/TDEC mainstem stations; headwaters in Rhea County, lower ~12 river miles in Meigs County; HUC 06020001). Same-name risk documented below: **Big Sewee Creek (mainstem, Meigs/Rhea)** vs **Little Sewee Creek** (separate NE sub-basin stream, own USGS gages 03543290/03543300 and TDEC stations LSEWE000.8ME / TNW000003880) vs **South Fork Little Sewee Creek** (USGS 03543290). A historical spelling variant "Big Suee Creek" appears on 1936 museum mussel labels (GBIF locality "[Big] Suee Creek", verified as Big Sewee by NCSM cross-labeling).
Research date: 2026-09-24. Internal classification research only; no agency/business/author contact.

## Reach definition
- **Flow path**: heads in Rhea County; TDEC river-mile station BSEWE015.9ME at 35.6060, -84.6752 marks upper mainstem; flows SE through Meigs County past Decatur's north side. USGS gage 03543500 "Sewee Creek near Decatur" at 35.5813, -84.7481, drainage area 117 sq mi. Lower stations TDECWPC-SEWEE006.1ME (rm 6.1, 35.5761, -84.7494) and TNW000008539 (35.5956, -84.7155).
- **Mouth**: Tennessee River / Watts Bar Reservoir in the Hiwassee-mouth embayment area at the community of Sewee (public access 119 Howard Hornsby Ln, 35.57849, -84.79350, per Travel Meigs County). Sources phrase the terminus variously as "Tennessee River (Watts Bar arm)" or "near the Hiwassee River mouth"; both describe the same embayment zone where the Hiwassee joins the Tennessee between Meigs and Rhea counties. Sewee Creek itself is a direct Watts Bar tributary, not a Hiwassee headwater.
- **Tributary separation**: Little Sewee Creek drains a parallel sub-basin east of the mainstem and joins near the lower Sewee reach; trout-program claims must be checked against the mainstem name "Sewee"/"Big Sewee" only.

## Sources

### S1. TWRA Trout Stocking Locations — ArcGIS FeatureServer (live 2026 layer)
- Org: TWRA, services3.arcgis.com/PWXNAH2YKmZY7lBq, layer TWRA_Trout_Stocking_Locations/FeatureServer/0 (schema name "Trout_MASTER_Project", 730 rows total).
- Retrieval: 2026-09-24.
- Query: `WHERE UPPER(StreamName) LIKE '%SEWEE%'` → **0 features**. County cross-check `UPPER(County) IN ('RHEA','MEIGS','HAMILTON')` → 11 rows: Rhea = Piney River (Piney Falls SNA, TDEC-managed, Spring, rainbow, 3 site rows); Hamilton = North Chickamauga Creek, Big Soddy Creek (5 sites, delayed-harvest Oct–Feb), Lake Junior pond (Winter), Jack Dickert Pond (Winter). **Meigs County has ZERO rows in the entire layer.**
- Fields: Site_Name, StreamName, Region, County, StockingProgram (Winter/Spring/Seasonal), WaterClass, Species, NumStocked, Management, DelayedHarvestSeason...
- Type + confidence: Programmatic absence, high.
- Establishes: No trout stocking site on Sewee Creek in the current (2026) feed; the nearest stocked waters are Piney River (Rhea) and North Chickamauga/Big Soddy creeks (Hamilton).
- URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0/query

### S2. TWRA 2026 live stocking schedule JSON (the live feed behind tn.gov "Trout Fishing & Stockings")
- Org: TWRA. Retrieval: 2026-09-24.
- Query: full dump (616 data rows, fields REGION/COUNTY/LOCATION/TYPE/STOCKING DAY/STOCKING WEEK/SPECIES), regex `sewe|\bsale\b` over every row → **0 hits**. Rhea rows = Piney River only (Seasonal 2/22, 3/22, 4/19/2026 + Delayed Harvest 10/25/2026, rainbow). No Meigs County rows found.
- Type + confidence: Programmatic absence, high. This is the citable 2026 row-level absence the ledger sought.
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json

### S3. Archived TWRA "Tentative Trout Stocking Schedule" PDFs, 2003–2015 (13 annual documents, complete sweep)
- Org: TWRA (state.tn.us/twra/fish/StreamRiver/stockedtrout/), via Wayback Machine.
- Captures grepped (timestamp | file), all fetched 2026-09-24 and full-text extracted (pymupdf; each 1–2 pages, 3.7k–4.0k chars):
  - 20030404161556 sched03 (2003) · 20040210011352 sched04 (2004) · 20051124124935 sched05 (2005) · 20060604223344 sched06 (2006) · 20070227143540 sched07 (2007) · 20080909205030 sched08 (2008) · 20090418095714 sched09 (2009) · 20100326100325 sched10 (2010) · 20110111175732 sched11 (2011) · 20120418154111 sched12 (2012) · 20140112202401 sched13 (2013) · 20140412202632 sched14 (2014) · 20150319003402 sched15 (2015)
- Result: **NO "Sewee"/"Sewe" string in any of the 13 years; no "Sale" either.** Coverage validated: Hamilton County appears with "N Chickamauga Creek" and Rhea County appears with stocked streams in sched03/09/12/15, so the negative for Meigs/Rhea streams is meaningful, not a coverage artifact.
- Example URL: https://web.archive.org/web/20030404161556/http://www.state.tn.us/twra/fish/StreamRiver/stockedtrout/sched03.pdf
- Type + confidence: Programmatic absence across 13 consecutive program years, high. Per standard: each dated document = planned-program evidence for that year; absence in all = strong absence evidence (not proof no fish exist).

### S4. TWRA winter trout program documents
- (a) "Tentative Winter Trout Stocking Dates 2013/2014" (wintertrout.pdf, updated 12/04/13), capture 20140112202400, fetched 2026-09-24: 3 pages of Dec–Feb sites (Shelby Bottoms, Sulphur Fork, etc.) — **no Sewee, no Rhea/Meigs/Hamilton creek rows**. URL: https://web.archive.org/web/20140112202400/http://www.state.tn.us/twra/fish/StreamRiver/stockedtrout/wintertrout.pdf
- (b) stockedtrout 2012-13 HTML page (capture 20130110154309): winter program narrative + links; no Sewee. URL: https://web.archive.org/web/20130110154309/http://www.state.tn.us/twra/fish/StreamRiver/stockedtrout/stockedtrout%202012-13.html
- (c) 2024–2026 winter news coverage (Chattanoogan.com 12/3/2024, 12/31/2025; Fox Chattanooga 11/26/2025; Local3News/WTVC 12/2021 & 12/2023, surfaced via search 2026-09-24): Hamilton County winter sites = **Lake Junior and Camp Jordan pond only**; no Meigs/Rhea creek sites ever named.
- Type + confidence: Programmatic absence for the winter program specifically, high.

### S5. TWRA Trout Management Plan 2006 (Trout_Plan_06.pdf, 32 pp)
- Capture 20130110154309, fetched 2026-09-24, full text: **no "Sewee" anywhere; the only "Sale" hit is a literature citation author (Cada, Loar & M.J. Sale 1987)** — false positive. Hiwassee appears (program stream); Sewee does not.
- URL: https://web.archive.org/web/20130110154309/http://www.tn.gov/twra/fish/StreamRiver/Trout_Plan_06.pdf
- Type + confidence: Programmatic absence (planning document), moderate-high.

### S6. tn.gov-era schedule PDFs: 2018, 2019, and the 2020 "Complete" file replayed 2021–2025
- 2018-Trout-Stocking-Schedule.pdf (capture 20180717180317) and 2019-Trout-Stocking-Schedule.pdf (captures 20190109035923, 20190412221005), fetched 2026-09-24: **no Sewee/Sale; Hamilton "N Chickamauga Creek" and Rhea rows present.**
- Trout-Stocking-Schedule-Complete.pdf — all seven ledger captures (20200424033427, 20210217082110, 20220226183421, 20230226083143, 20240222201650, 20241205181943, 20250320072447) are **byte-identical (md5 a9f34ad75f89…)**: the 2020 schedule ("Trout Stocking (2020)", 1 page). NO Sewee/Sale. County rows: Hamilton → "N Chickamauga Creek"; Rhea → "Piney River DH" (delayed harvest). **No Meigs County row at all.** Caveat: 2021–2025 captures prove the static file was frozen at 2020; 2021–2025 program absence rests on the live feed (S1/S2) instead.
- URLs: https://web.archive.org/web/20180717180317/https://www.tn.gov/content/dam/tn/twra/documents/2018-Trout-Stocking-Schedule.pdf ; https://web.archive.org/web/20200424033427id_/https://www.tn.gov/content/dam/tn/twra/documents/Trout-Stocking-Schedule-Complete.pdf
- Gap: 2016/2017 schedules not archived under any tested name (2016/2017-Trout-Stocking-Schedule.pdf, sched16/sched17.pdf — availability API: none). Program-absence chain has a 2-year hole there.
- Type + confidence: Programmatic absence, high for 2018–2020; 2016–2017 unresolved (gap).

### S7. USGS NAS county exports (Rhea, Meigs, Hamilton)
- Retrieval: 2026-09-24, https://nas.er.usgs.gov/api/v2/occurrence/search?state=TN&county=Meigs (also Rhea, Hamilton).
- Counts: Rhea 21, Meigs 38, Hamilton 79 records — **zero Salmonidae/Oncorhynchus/Salmo/Salvelinus in all three counties.** Meigs records are reservoir plankton/mollusks (Watts Bar) etc.
- Type + confidence: Coverage-gap + weak negative, moderate.

### S8. GBIF museum occurrence record (the fish-survey lane)
- Retrieval: 2026-09-24, https://api.gbif.org/v1/occurrence/search?q=Sewee&country=US&limit=300
- Tennessee (Meigs Co.) records:
  - **Auburn University Museum Fish Collection, collected 1981-04-08, "Trib. to Trib. to Sewee Creek, 2.9 air mi NE of Fairview"** — 14+ vouchered lots: Etheostoma rufilineatum, E. simoterum, E. jessiae, Percina caprodes, Cottus bairdii, Campostoma anomalum, Cyprinella galactura, C. spiloptera, Hypentelium nigricans, Luxilus chrysocephalus, Lepomis macrochirus, L. auritus, Gambusia affinis, Etheostoma (Coccotis) sp. **Method-documented seining/ichthyocide-style survey lot; complete warmwater list; NO Salmonidae.** (2nd-order tributary, not mainstem — noted.)
  - **NCSM Ichthyology, 1995-06-12, "[Big] Sewee Creek at Highway 68 bridge, ca. 7.9 air mi WNW Sweetwater" — Fundulus olivaceus** (mainstem mainstem sample, warmwater).
  - Unvouchered/historical: Etheostoma jessiae "Tennessee River, Big Sewee Creek" (no date); herps 1955-09-01 (Chelydra, Apalone, Big Sewee Creek 7.5 mi NE Decatur); mussels 1936-09-25 "Big Suee Creek" (Fusconaia barnesiana, Villosa vanuxemensis) and NCSM mollusks (Corbicula, Elimia teres) at Sewee Creek / Big Sewee at Hwy 58.
- Type + confidence: Meaningful NEGATIVE evidence for trout (dated, vouchered, method-documented fish surveys with full species lists omitting Salmonidae), moderate-high for the tributary lot, moderate for single-species mainstem lots.
- Establishes: 40+ years of museum collecting interest in the drainage, all warmwater.

### S9. iNaturalist
- Retrieval 2026-09-24, bounding box 35.52–35.66 N / -84.95..-84.74 W (tight to Sewee basin, excludes Hiwassee main channel): 19 fish observations, **0 trout**; taxa incl. Micropterus dolomieu/nigricans/punctulatus, Lepomis spp., Rhinichthys obtusus, Cottus, Percina caprodes, Cyprinella whipplei. Loose box (35.50–35.70/-84.95..-84.70, includes Watts Bar arm): 24 taxa, still 0 trout (reservoir species appear: Ictalurus punctatus/furcatus, Aplodinotus, Lepisosteus, lake sturgeon Huso fulvescens = TVA-stocked Hiwassee/Watts Bar program, not creek trout).
- Places autocomplete "Sewee": no iNat place. Type + confidence: Weighted negative, moderate (citizen-science density is modest).

### S10. WQP / TDEC monitoring (station + result profile)
- Note: WQP `/data/Station/search` and `/data/Result/search` return HTTP 406 for mimeType=json (even via POST and browser UA; also 406 through WebFetch) — **csv mimeType works**; all WQP pulls 2026-09-24 used csv.
- Stations (Meigs Co., all "Sewee"-named): TDECWPC-BSEWE015.9ME = TDECWR_WQX-TNW000000687 (Big Sewee, 35.6060,-84.6752); TDECWPC-SEWEE006.1ME = TNW000005512 (rm 6.1); TNW000005511 (35.5651,-84.7983); TNW000008539; TNW000008769 (at USGS gage); TNW000007019/07020 (tribs); Little Sewee: TDECWPC-LSEWE000.8ME = TNW000003880. USGS: 03543500, 03543300, 03543290.
- Results: TNW000000687 = **405 results, 2009–2024, 23 benthic macroinvertebrate taxa** (Ephemeridae, Chloroperlidae, Gomphidae, Hydropsychidae, Leptoceridae, Corydalidae, Oligochaeta...), no fish taxa, no fish tissue, no salmonids — TDEC has monitored Sewee as a warm wadeable stream for 15 years (benthic biorecon + chemistry) without any trout-related parameter. SEWEE006.1ME = 113 results 2008–2009 (legacy chemistry). TNW000005511 = 0 results.
- URLs: https://www.waterqualitydata.us/data/Result/search?siteid=TDECWR_WQX-TNW000000687&mimeType=csv ; https://www.waterqualitydata.us/data/Station/search?countrycode=US&statecode=US%3A47&countycode=US%3A47%3A121&mimeType=csv
- Type + confidence: Method-documented repeated biological monitoring omitting trout, moderate-high negative.

### S11. The "recurring secondary claim" — origin check
- WebSearch 2026-09-24 ("Sewee Creek trout stocking TWRA"): the only affirmative claim found is **fishing-app aggregator boilerplate** (OnWater app page, onwaterapp.com — "variety of fishing opportunities... some trout stocking activity by TWRA" per search snippet; no schedule row, no date, no citation). No TWRA/TDEC/news/forums source claims Sewee stocking. A search-summary aside claiming a "Scenic River designation" for Sewee was NOT substantiated by any primary source in the results (AI filler — unverified, do not use).
- Type: LEAD-grade claim with zero citable support. **Status after this sweep: killed at the citable-source level** — no Sewee row exists in any archived TWRA schedule year (2003–2015, 2018–2020), the winter-program documents, the 2006 Trout Management Plan, or the live 2026 feed.

## Contradictions
- None between primary sources. The only affirmative trout claim is app boilerplate contradicting every primary program document.
- Reach nuance: secondary sources split between "empties into Tennessee River/Watts Bar" and "near the Hiwassee mouth" — same embayment zone; no stocking consequence either way.

## Searches run (incl. unproductive)
1. ArcGIS LIKE '%SEWEE%' — productive (0 rows). 2. ArcGIS county RHEA/MEIGS/HAMILTON — productive (11 rows, no Meigs). 3. CDX state.tn.us stockedtrout listing — productive (13 captures + wintertrout + html). 4. **Initial pdftotext-stdin sweep — INVALID (tool cannot read stdin; textlen=0 for all) — redone with pymupdf; never cite the first run.** 5. sched03–15 sweep — productive (0/13, coverage validated). 6. sched03/09/12/15 coverage greps — productive. 7. wintertrout.pdf — productive (0 hits). 8. stockedtrout 2012-13 html — productive (link to Trout_Plan_06). 9. Trout_Plan_06.pdf — productive (0 stream hits; 1 false-positive "M.J. Sale" author). 10. tn.gov CDX filter queries — flaky (returned empty 4× before succeeding once); eventually productive. 11. Availability-API probes 2016/2017 + sched16/17 — unproductive (nothing archived; gap). 12. URL probing for 2020–2025 "Complete" file — productive after TDEC-letter path surfaced (WebSearch "Trout-Stocking-Complete.pdf"). 13. 2018/2019 + 2020–2025 Complete sweeps — productive (0 hits; replay caveat). 14. Live 2026 JSON — productive (0/616 rows). 15. NAS ×3 counties — productive (0 salmonids). 16. GBIF q=Sewee — productive (museum lots). 17. iNat places "Sewee" — unproductive (no place); bbox species_counts + obs — productive (0 trout). 18. WQP json — **failed lane (HTTP 406, json only; csv works)**. 19. WQP csv Meigs stations + results — productive. 20. WebSearch trout-claim origin — productive (boilerplate only). 21. WebSearch reach/mouth — productive. 22. WebSearch TDEC biorecon — productive (station ID).

## Recommendation: WARMWATER-FOCUS
Reasoning: (1) Program absence is now citable and sweeping — no "Sewee" row in any of 13 archived annual schedules (2003–2015), the 2018/2019/2020 schedules, the winter-program documents, the 2006 Trout Management Plan, the live ArcGIS layer (730 rows), or the 2026 live JSON (616 rows); Meigs County has zero rows in the live layer. (2) Method-documented fish surveys (Auburn 1981 tributary lot, 14+ taxa; NCSM 1995 mainstem) and 15 years of TDEC benthic monitoring (2009–2024) all characterize a warm wadeable stream with no salmonid component. (3) NAS has zero salmonid records in the county. (4) Habitat: 117-sq-mi, low-elevation (~695 ft at gage) warm stream in the Watts Bar/Hiwassee embayment zone — unsuitable for resident or put-and-take trout. A single old catch would remain a LEAD, but no dated trout record of any kind was found. The ledger's "recurring secondary claim" of a TWRA winter-program listing is not merely uncitable — it is affirmatively contradicted by every archived program document.
