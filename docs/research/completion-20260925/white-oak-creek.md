# White Oak Creek / Whiteoak Creek (Houston County, TN) — trout-evidence research log

Water: **Whiteoak Creek** — tributary of the Cumberland River (Kentucky Lake embayment) draining Houston County, TN (headwaters near Tennessee Ridge; mouth near the Houston/Stewart line). Ledger row under test: "white-oak-creek, months [12,1,2]", region tag tn-upper-cumberland; prior low-confidence pass saw TWRA spring stocking weeks 2/22–3/29/2026 in **Houston Co** and asked whether THAT creek is this ledger row.
Reach/coordinates: TWRA stocking site **36.25905, -87.87155** (OBJECTID 417, "White Oak Creek Spring Trout Site", on Whiteoak Rd); ledger NHD anchor **-87.704, 36.214** (unit 06040005, snap 1 m, NHD name "Whiteoak Creek" — the lower creek near its Cumberland River confluence). Museum lots at "Whiteoak Creek at New Hope along Whiteoak Road" (36.259, -87.840) and "at Whiteoak Road in Magnolia" (36.259, -87.871).
Retrieval date for all sources: **2026-09-25** (Wayback captures dated individually). Research only; no contact; no catalog edits.

**RECOMMENDATION (bottom line): IDENTITY RESOLVED — the ledger row IS the Houston County Whiteoak Creek** (the one the prior pass saw stocked 2/22–3/29/2026). The ledger's NHD anchor (HUC 06040005, "Whiteoak Creek", Houston Co.) and the TWRA rows describe the same stream; **there is no separately stocked "White Oak Creek" anywhere in the Upper Cumberland** — the only stocked Whiteoak in Tennessee's 2010–2026 schedules and in the ArcGIS stocking layer is the Houston Co. creek. **Months: seasonal (spring) ≈ FEBRUARY–APRIL, occasionally May — ledger [12,1,2] REJECTED** (completed stockings 2018-04-25, 2022-04-20, 2023-04-25, 2024-04-23, 2026-04-30; 2010 remainder cancelled 5/28/2010 for >70 °F water). Region tag: the creek is TWRA Region 1, Lower Cumberland basin (HUC 06040005), Houston Co. — the "tn-upper-cumberland" tag is a ledger-grouping error. Confidence: HIGH.

---

## A. Sources

### A1. Identity set — four independent sources agree on Houston Co.
- **TWRA ArcGIS Stocking Locations** (730-row dump re-verified 2026-09-25; service under https://services3.arcgis.com/PWXNAH2YKmZY7lBq/): OBJECTID 417 "White Oak Creek Spring Trout Site", StreamName "White Oak Creek", **HOUSTON**, Region 1, StockingProgram "Spring", stream, Species "rainbow", 36.25905/-87.87155. The ONLY White Oak/Whiteoak feature in the layer (statewide).
- **TWRA 2026 schedule JSON** (616 rows, parsed 2026-09-25; URL as in sibling logs): three rows REGION 1, COUNTY **Houston**, LOCATION "Whiteoak Creek", TYPE "Seasonal", STOCKING WEEK **2/22/2026, 3/22/2026, 03/29/2026**, "Rainbow Trout". No other Whiteoak/White Oak row statewide.
- **TWRA GIS per-creek map** "Stocked Trout Program — Whiteoak Creek", produced by TWRA GIS 12/10/2010, http://www.tn.gov/twra/gis/troutpdf/WhiteOakCreek.pdf, Wayback capture 20110411173807 (retrieved 2026-09-25): map labels HOUSTON (with MONTGOMERY/STEWART/HENRY context), "Whiteoak Hwd 5"/Tennessee Ridge area, "Stocking Site" marker on the creek.
- **Ledger NHD anchor** (data/nhd/derived/catalog-discovery.json, generated 2026-09-15): "white-oak-creek" anchor (-87.704, 36.214), unit 06040005, NHD name "Whiteoak Creek" — the lower reach of the same Houston Co. stream (the stocked site at -87.8716 is on the upper creek, same NHD name, same county).
- Establishes: single-water identity; the 2026 spring weeks belong to THIS row. Confidence: HIGH.

### A2. TWRA Tentative Trout Stocking Schedule grids (Wayback, local scheds/) — 2010–2015
- 2010 (sched10, capture 20100529052023): "Houston Whiteoak Creek" — 3 X-marks, FEBRUARY–APRIL window (weeks ~mid-Feb, mid-Mar, mid-Apr).
- 2011 (sched11): same — 3 X, Feb/Mar/Apr.
- 2012 (sched12), 2013 (sched13): X's at Feb/Mar/Apr (earlier positions than Standing Rock's row).
- 2014 (sched14b), 2015 (sched15b): row present, **NO X marks** — not scheduled those years.
- Establishes: spring-only program when scheduled, 2010–2013; dormant 2014–2015. Confidence: HIGH.

### A3. TWRA "Trout Stocking (2018)–(2025)" schedule PDFs — row present 2018–2025
- ts2018/ts2019/ts2019b/sched2018 and cp-2018…cp-2025 Wayback captures (local cache; retrieved 2026-09-25): "Houston Whiteoak Creek" a Region 1 destination in every year. md5 replay analysis (shared digests = one artifact served across captures): d8beba55 {2018-07-17, 2019-01-09, 2019-10-30, 2020-01-24}; 2021: 0e5c3434 (01-19) and 41e350cc (08-20 = 12-30); 2022: 6228d37e (02-21) vs 9c75adf3 (05-19); 2023: 3a748e6b (02-20 = 05-23 = 11-26); 2024: c3cfa00d (02-19) vs 852e3117 (05-20 = 09-27 = 12-23); 2025: four distinct digests (321048d5, fecd884c, 9d346c2c, 8b67aac0). Caveat: post-2017 PDF X-marks absent from the text layer; months for these years carried by completed reports (A4) and the 2026 JSON.
- Establishes: continuous presence as a stocked destination. Confidence: HIGH (presence).

### A4. TWRA Coldwater Trout Stocking Schedule reports — dated COMPLETED stockings, all spring
- cw_stocking_2019.txt (report current early 2019): "Whiteoak Creek **4/25/2018**".
- cw2022may.pdf ("Updated: 5/17/2022"): "1 Whiteoak Creek **04/20/2022**".
- cw2023may.pdf: "Whiteoak Creek **04/25/2023**". cw2024may.pdf: "Whiteoak Creek **04/23/2024**".
- LIVE TWRA trout page, https://www.tn.gov/twra/fishing/trout-information-stockings.html, "Report updated as of 9/21/2026" (WebFetch 2026-09-25): flattened row "Whiteoak Creek **4/30/2026**" — an April 2026 completed/reported event.
- Establishes (destination-level): APRIL in 2018, 2022, 2023, 2024, 2026. Zero Dec–Feb completions in any captured report. Confidence: HIGH.

### A5. TWRA Stocked Trout page, capture 2010-05-29 — 2010 season extension and heat cancellation
- stockedtrout.html capture 20100529052103 (retrieved 2026-09-25), verbatim: "Whiteoak Creek (Houston Co.) and Standing Rock Creek (Stewart Co.) has been delayed from the week of May 2 to the week of May 9 due to high creek elevations and flooding." / "…cancelled for 2010 due to water temperatures in excess of 70 degrees F. (posted May 28, 2010)".
- Establishes: agency county attribution + spring-only thermal window. Confidence: HIGH.

### A6. Museum fish survey (GBIF) — warmwater assemblage, no trout, 2001–2002 lots
- GBIF occurrences "Whiteoak Creek at New Hope along Whiteoak Road" (2002) and "at Whiteoak Road in Magnolia" (2001), Houston Co. (https://api.gbif.org/v1/occurrence/search?q=%22Whiteoak%20Creek%20at%20New%20Hope%22, retrieved 2026-09-25). Species among the lots: **stripeshine shiner (Lythrurus fasciolaris), steelcolor shiner, telescope shiner, bigeye shiner, telescope/leuciodus shiners, redline darter, rainbow darter, spangled darter, banded darter, sable darter (E. blennius), saffron darter (E. flavum), tired darter (E. duryi), bluebreast darter, fantail darter, logperch, banded sculpin, golden redhorse, largemouth bass, longear sunfish, bluegill, lake chubsucker? (Morone mississippiensis = yellow bass), steelcolor shiner, rosyface shiner complex, creek chubsucker (Clinostomus funduloides = rosyside dace), stargrunt minnow (Fundulus catenatus), bigeye chub** — a diverse warmwater/Cumberland-lowland assemblage. **No Salmonidae.**
- Establishes: documented warmwater native fishery (weighted); trout exist only as stocked program fish. Confidence: HIGH for assemblage (museum-vouchered), years 2001–2002.

### A7. NAS / iNat — no trout records
- USGS NAS county=Houston (retrieved 2026-09-25): 3 records (alligatorweed, water-cress, whorled hydrilla) — **no trout**.
- iNaturalist Salmonidae by name "Whiteoak Creek" and within 8 km of 36.25/-87.84 (retrieved 2026-09-25): **0 observations**.
- Confidence: MEDIUM (absence-of-records).

---

## MONTHS-BY-YEAR STOCKING TABLE
| Year | Planned | Completed (dated) | Source |
|---|---|---|---|
| 2003–2009 | not retrievable (pre-2010-05 archive absent; CDX checked) | none | coverage gap only |
| 2010 | Feb–Apr grid; May-2 event → May 9 (flood); rest cancelled 5/28 (>70 °F) | partial | sched10 + stockedtrout.html |
| 2011 | Feb–Apr | — | sched11 |
| 2012–2013 | Feb–Apr | — | sched12/13 |
| 2014–2015 | NOT scheduled | — | sched14b/15b |
| 2016–2017 | site-transition era; not captured | — | CDX gap |
| 2018 | seasonal | **4/25/2018** | cw_stocking_2019 |
| 2019–2021 | seasonal (row present) | — | cp/ts captures |
| 2022 | seasonal | **4/20/2022** | cw2022may |
| 2023 | seasonal | **4/25/2023** | cw2023may |
| 2024 | seasonal | **4/23/2024** | cw2024may |
| 2025 | seasonal (row present) | — | cp-2025 |
| 2026 | weeks of **2/22, 3/22, 3/29** | **4/30/2026** (live page, flattened row) | 2026 JSON + live page |

## Species
Rainbow Trout (stocked). Native assemblage (2001–02 museum survey): see A6 — no salmonids.

## Contradictions
- Ledger months [12,1,2] vs all dated evidence (Feb–May): REJECTED. Likely contamination from Region 1 "Winter"-program rows (West TN lakes, Dec/Jan) — different program, different waters.
- Ledger region tag "tn-upper-cumberland" vs identity: this is the Houston Co. creek (TWRA Region 1, Lower Cumberland HUC 06040005); no Upper Cumberland White Oak Creek is stocked anywhere in the 2010–2026 record. The prior low-confidence pass's "Houston Co spring" observation was about THIS water, not a different one.
- Name variants: NHD "Whiteoak Creek" / ArcGIS "White Oak Creek" / JSON "Whiteoak Creek" — one water; watch for a false distinct-row split in the catalog.

## Searches run (≥8)
1. Local corpus grep (schedules, arcgis_all.json, feeds, reports) for "White Oak"/"Whiteoak"
2. 2026 schedule JSON parse for Whiteoak rows
3. sched10–15 grid extraction (month columns)
4. cp/ts 2018–2025 capture + md5 replay analysis
5. Coldwater completed reports 2018/2022/2023/2024
6. Wayback stockedtrout.html 2010 capture + GIS WhiteOakCreek.pdf (2011)
7. Wayback CDX sweeps (pre-2010 pages; 2016–2018 schedule PDFs)
8. GBIF "Whiteoak Creek at New Hope"/"Magnolia" museum lots (species list)
9. USGS NAS county=Houston
10. iNaturalist Salmonidae (name + radius)
11. WebFetch live tn.gov trout page (as-of 9/21/2026)
12. Ledger anchor check (catalog-discovery.json)

## Recommendation
**Seasonal stocking with exact months: FEBRUARY, MARCH, APRIL (May extensions documented 2010/2022); December–February NOT stocked. Identity = Houston Co. Whiteoak Creek (same water as the prior pass's 2026 spring observations); merge/alias "White Oak Creek" = "Whiteoak Creek"; correct region grouping to the Lower Cumberland/Houston Co. water it is. Confidence: HIGH.**
