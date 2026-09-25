# East Fork Obey River (Fentress → Overton → Clay Cos., TN) — trout-evidence research log

Water: **East Fork Obey River** — Cumberland Plateau stream, headwaters in Fentress County (confluence of Officer and Garrison branches near Anderson, TN), flowing NW through Overton County (Alpine area) to join the West Fork Obey to form the main Obey River above Dale Hollow Lake (Clay Co.). Ledger verdict under test: **warmwater-focus**. Sibling discipline: main Obey (Dale Hollow tailwater) and West Fork Obey researched separately; this log covers the East Fork only.
Reach/coordinates: USGS NAS map-derived point **36.450344, -85.121622** (Pickett Co., HUC8 05130105 "Obey", HUC10 0513010503 "Big Eagle Creek-Obey River", HUC12 051301050301 "Franklin Creek-Obey River"); GBIF 2006 lot at TN Hwy 52 bridge over East Fork Obey, **36.416, -85.027** (Fentress Co., WSW of Jamestown). TWRA regulated reach: "Compton boat ramp upstream to Hwy. 52 bridge."
Retrieval date for all sources: **2026-09-25**. Research only; no agency/business/author/angler contact; no catalog edits.

**RECOMMENDATION (bottom line): warmwater-focus — CONFIRMED.** No trout stocking is planned or recorded on the East Fork in any TWRA dataset checked (2009–2026 schedules, ArcGIS stocking layers, 2026 schedule JSON). The only trout record anywhere is a single 1939 literature occurrence of brown trout (Kuhne 1939, TN Dept. of Conservation, via USGS NAS) — a lead, 87 years old, not a fishery. TWRA's own Dale Hollow page documents the East Fork as a **walleye spawning-run stream** (late Feb–early Mar) with a Jan 1–Apr 15 single-hook zone. Identity note: **no "Pineville" reach exists on the East Fork Obey** in any source checked — the named anchors are Anderson/Allardt/Jamestown (Fentress), Alpine (Overton), and Compton boat ramp / Hwy 52 bridge (regulation reach). Confidence: HIGH.

---

## A. Sources

### A1. USGS Nonindigenous Aquatic Species (NAS/MARIS) — Brown Trout 1939 record — LEAD, not a fishery
- Org: U.S. Geological Survey (NAS API v2), full record retrieved 2026-09-25 via https://nas.er.usgs.gov/api/v2/occurrence/search?state=TN&county=Pickett
- Fields: **Salmo trutta (Brown Trout), Pickett County, locality "East Fork Obey River", year 1939, month null, recordType "Literature", status "established", 36.450344/-85.121622 (map-derived), HUC12 Franklin Creek-Obey River**. Reference: Kuhne, E.R. (1939) *A guide to the fishes of Tennessee and the Mid-south*, Tennessee Department of Conservation, Nashville.
- Observation date 1939 (pre-TWRA era; part of the statewide 1939 brown-trout literature inventory — Fentress Co. has the parallel "South Fork Cumberland tributary, 1939" record).
- Establishes: a single dated trout **occurrence** (1939 literature). Does NOT establish: modern presence, stocking, or a fishery; "established" is NAS's historic literature-based status flag. Weighted per standards: single catch/literature record = lead. Confidence in the record itself: HIGH (primary citation); confidence it represents current status: LOW.

### A2. TWRA stocking schedules 2009–2026 — ZERO East Fork rows statewide
- (a) TWRA Tentative Trout Stocking Schedule grids 2010–2015 (Wayback PDFs sched10–sched15, local cache tmp/research/completion/scheds/, captured from tn.gov/twra/fish/StreamRiver/stockedtrout/schedNN.pdf; retrieval 2026-09-25): full statewide grids checked line-by-line — **no "East Fork Obey" row in any year** (only the Region 3 "Obey" tailwater rows absent too; the only Obey-adjacent rows are Dale Hollow-arm waters not on the East Fork).
- (b) TWRA "Trout Stocking (2018)–(2025)" schedule PDFs (ts2018, ts2019, ts2019b, sched2018, cp-2018…cp-2025 captures, same local cache; Wayback digests cross-checked by md5): **no East Fork Obey row**.
- (c) TWRA 2026 Trout Stocking Schedule JSON (616 rows; https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json, parsed 2026-09-25): **no East Fork Obey row** (only "Dale Hollow TW / Obey River", Clay Co., Tailwater).
- Establishes: no planned trout stocking on the East Fork in any published schedule era. Broad omission in a statewide planned-stockings dataset = weighted negative. Confidence: HIGH.

### A3. TWRA ArcGIS stocking-location layers — no East Fork feature
- TWRA Trout Stocking Locations FeatureServer (730-row local dump tmp/research/completion/arcgis_all.json, re-queried 2026-09-25; live service under https://services3.arcgis.com/PWXNAH2YKmZY7lBq/): the ONLY Obey feature is OBJECTID 754 "Dale Hollow Dam Recreation Area", StreamName "Obey River", Clay Co., Tailwater. No East Fork Obey point/line in Tailwater_Trout (13 rows) or stocking-locations layers.
- Establishes: TWRA maps no trout-stocking destination on the East Fork. Confidence: HIGH.

### A4. TWRA "Dale Hollow Reservoir" where-to-fish page — East Fork documented as a WALLEYE-run stream
- Org: Tennessee Wildlife Resources Agency; page https://www.tn.gov/twra/fishing/where-to-fish/cumberland-plateau-r3/dale-hollow-reservoir.html (retrieved 2026-09-25; page is the current R3 Cumberland Plateau unit).
- Verbatim: "January 1–April 15: On the east fork of the Obey from Compton boat ramp upstream to Hwy. 52 bridge, anglers are restricted to the use of one (1) hook having a single point, or one (1) lure with a single hook with one (1) point." and "**Walleye begin making their spawning run up the East Fork of the Obey River in late February and early March.**" Trout content on the page concerns the reservoir ("Rainbow trout are typically stocked annually into Dale Hollow Reservoir during the wintertime") and the tailwater — none for the East Fork.
- Establishes: dated agency documentation of the East Fork fishery as a walleye (warmwater/coolwater) seasonal run, with a Jan 1–Apr 15 gear restriction. Note: the Jan–Apr one-hook window is a plausible source of winter-months contamination in ledger rows, but it is a GEAR restriction, not a stocking season. Confidence: HIGH.

### A5. GBIF-mediated museum lots — no fish lots from the East Fork itself
- GBIF occurrence search q="East Fork Obey" (300 records scanned, https://api.gbif.org/v1/occurrence/search, retrieved 2026-09-25): 292 Tennessee records — **zero Actinopterygii**. Lot types: 1976 mollusks ("East Fork Obey River, W of Jamestown", Fentress Co.), 2006 vascular plant (TN-52 bridge, 36.416/-85.027), freshwater mussels/snails (Riverton, "East Fork Obey Riv."). The nearest fish lot in the basin is the 1975 West Fork Obey *Etheostoma* lot (sibling log's Obey-darter material) — different branch.
- Establishes: no museum fish lots recorded from the East Fork in GBIF-indexed collections (absence of records, not survey-negative evidence). Confidence: MEDIUM (GBIF coverage incomplete).

### A6. iNaturalist — zero trout observations
- iNat API v1 (retrieved 2026-09-25): Salmonidae observations by name "East Fork Obey" and within 8 km of 36.45/-85.12: **total_results = 0**.
- Establishes: no community-science trout observation. Lead-tier negative only. Confidence: LOW-MEDIUM.

### A7. Corroborating geography/identity sources
- Cumberland River Basin org waterway page, https://cumberlandriverbasin.org/waterway/east-fork-obey-river/ (retrieved 2026-09-25): "East Fork Obey River … originates at the confluence of the Officer and Garrison branches near Anderson, TN" (Cumberland basin authority's basin encyclopedia).
- Anyplace America GNIS gazetteer entry "East Fork Obey River, Fentress County" (aka East Fork Obey's River), https://www.anyplaceamerica.com/directory/tn/fentress-county-47049/streams/east-fork-obey-river-1303447/ (retrieved 2026-09-25).
- Riverfacts #13135 (10-mi class III–V+ whitewater section, Fentress Co.) and #13136 (37-mi TN-85 bridge to Dale Hollow Lake, class I–II), https://riverfacts.com/rivers/13135.html (retrieved 2026-09-25) — gradient-driven cold-ish headwaters, warmwater lower river; neither lists trout.
- How's Your River (TDEC-monitoring aggregator) East Fork Obey page, https://www.howsyourriver.com/water_bodies/east-fork-obey-river (retrieved 2026-09-25) — monitoring/access hub, no trout program.
- Identity conclusion: East Fork Obey = Fentress→Overton→Clay branch joining West Fork to form the main Obey above Dale Hollow Lake. **"Pineville" association: NOT FOUND** on this stream in any gazetteer, regulation, or access source checked; nearest named regulation anchors are Compton boat ramp and the Hwy 52 bridge. Do not conflate with the main Obey (tailwater, Clay Co.) or Pineville (a different community elsewhere in TN/KY).

---

## MONTHS-BY-YEAR TABLE (trout stocking — East Fork Obey)
| Year | Planned | Completed | Note |
|---|---|---|---|
| 2003–2009 | no record retrievable (pre-2010 TWRA site not archived) | none | coverage gap, not absence evidence; no trout program known |
| 2010–2015 | absent from statewide grids | none | sched10–15 line-checked |
| 2016–2017 | absent (site-transition era; ts/cp PDFs) | none | |
| 2018–2025 | absent | none | cp/ts captures |
| 2026 | absent | none | 616-row JSON |
| 1939 | — | 1 literature brown-trout occurrence (Kuhne) | lead only |

**Verdict months: none — not a trout water in any year 2003–2026.**

## Contradictions
- Ledger "warmwater-focus" vs 1939 NAS "established" brown trout flag: resolved by reading the record's own basis (1939 literature, single inventory entry).
- Jan 1–Apr 15 single-hook season could be misread as a winter stocking season: it is a walleye-spawn gear restriction on a warmwater run.

## Searches run (≥8)
1. WebSearch "East Fork Obey River TWRA access area fishing Overton County"
2. WebSearch "Pineville" "East Fork Obey" Tennessee
3. GBIF q="East Fork Obey" (300-record scan)
4. GBIF fish-class filter on East Fork Obey results
5. GBIF q=Etheostoma obeyense (basin context)
6. USGS NAS county=Pickett (+ full-record JSON) and Fentress/Overton/Clay sweeps
7. WebFetch TWRA Dale Hollow Reservoir where-to-fish page (verbatim regulation quotes)
8. web_reader How's Your River East Fork Obey page
9. Cumberland River Basin org waterway page
10. TWRA schedule corpus greps 2009–2026 + ArcGIS 730-row layer scan + 2026 JSON parse
11. iNaturalist API name + 8-km-radius Salmonidae queries

## Recommendation
**Warmwater-focus CONFIRMED (HIGH confidence).** No stocking months to enter; months field should be empty/none. Keep identity anchors: Fentress/Overton counties; NAS point 36.450344,-85.121622; Hwy 52 bridge 36.416,-85.027; reject "Pineville" as an East Fork reach name.
