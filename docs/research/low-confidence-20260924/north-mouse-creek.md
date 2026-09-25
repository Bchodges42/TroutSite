# North Mouse Creek — Trout Evidence Research Log
Water: North Mouse Creek, McMinn County (headwaters) → Bradley County (lower reach), TN; Hiwassee River basin (HUC 06020002); NOT the same water as Little North Mouse Creek or East Fork North Mouse Creek (separate GNIS streams), NOT "Mouse Creek" the unincorporated McMinn County community on US-411, NOT Fishbrain's "Mouse Creek" (Grandview, Missouri — a different state's water).
Research date: 2026-09-24. Internal classification research only; no agency/business/author/angler contact. Retrievals by ZCode.

## Reach definition
- **Flow path**: rises near Old Acme Mill NW of Niota (USGS-03566115, 35.5501, -84.5738, DA 4.83 sq mi; East Fork joins from the Sweetwater side, USGS-03566117), flows W past Athens' east side (USGS-03566127 at SR-30, 35.4606, -84.6402, DA 35 sq mi; USGS-03566128, DA 42.1 sq mi), then S past Riceville (USGS-03566129, 35.3906, -84.7083, DA 51), Sanford (USGS-03566132/-138, 35.357, -84.735), and Calhoun (USGS-03566140, 35.3329, -84.7661, DA 73.2) to the mouth.
- **Mouth**: Hiwassee River arm of Chickamauga Reservoir just NW of Charleston — last gage USGS-03566142 "North Mouse Creek near Charleston" (35.3265, -84.7838, DA 75.1 sq mi); How's Your River mouth point 35.3278, -84.7895, elevation 678 ft (vs 1,137 ft at source). How's Your River lists 1 access site, "North Mouse Creek (Boat Ramp)" — a float/boat-ramp fishery profile, not a wade-trout profile.
- **Gradient (thermal context)**: 0.22% (11.6 ft/mi), 459 ft drop over ~40 mi (How's Your River, updated 2025-12-26) — a low-gradient, warm, slack-ish valley creek for its lower half; thermally incompatible with a coldwater fishery.
- **TDEC monitoring stations on the creek**: TDECWPC-NMOUS024.3MM (35.4472, -84.6561), NMOUS024.8MM (35.4497, -84.6525), NMOUS025.2MM (35.4510, -84.6000) plus Little North Mouse stations LNMOU000.1MM/002.4MM/003.6MM.

## Sources

### S1. TWRA Trout Stocking Locations (ArcGIS FeatureServer, current full layer)
- Org: TWRA, services3.arcgis.com/PWXNAH2YKmZY7lBq.
- Retrieval: 2026-09-24, query `StreamName/Site_Name like %MOUSE%` → **features: [] (zero rows)**; earlier same-day county queries returned zero Bradley County features.
- Type + confidence: Programmatic absence, high confidence.
- Establishes: No "Mouse" water of any kind appears in TWRA's current trout stocking location layer. Does not by itself rule out decades-old stocking.

### S2. TWRA 2026 Trout Stocking Schedule JSON (616 rows)
- Org: TWRA tn.gov data table.
- Retrieval: 2026-09-24 (browser-context fetch; plain curl blocked by tn.gov).
- Findings: **No rows containing "Mouse", "Bradley", "McMinn-North-Mouse".** Region 3 McMinn entry = Athens City Park Pond only (Winter Rainbow Trout, 1/8 + 2/18/2026) — a POND; any McMinn/Bradley-area "trout report" should be attributed there or to Hamilton County waters (Big Soddy Creek delayed-harvest/seasonal; Dickert Pond/Camp Jordan + Lake Junior winter ponds; N. Chickamauga Creek) — all outside this creek's basin.
- Type + confidence: Programmatic absence, high.
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json

### S3. USGS NAS occurrence exports — Bradley (15 records) and McMinn (9 records)
- Retrieval: 2026-09-24, https://nas.er.usgs.gov/api/v2/occurrence/search?state=TN&county=Bradley and .../county=McMinn.
- Findings: **No Salmonidae in either county; zero records referencing Mouse Creek in either county.** Nearest records are clam (Corbicula) surveys on the Hiwassee/Rogers/Spring Creek/Conasauga drainages (1965–2010) and fish records in the Conasauga drainage (S Bradley). Decades of in-county collecting with no salmonid and no Mouse Creek entry.
- Type + confidence: Coverage gap + weak negative, moderate.
- Establishes: No nonindigenous-salmonid or any trout-adjacent record; targeted historical sampling occurred in these counties without surfacing trout.

### S4. WQP (waterqualitydata.us) — monitoring history on the creek
- Org: USGS (NWIS gages), TDEC (TDECWPC legacy + TDECWR_WQX).
- Retrieval: 2026-09-24, Station search HUC 06020002 (1,351 rows) + Result searches by siteid (mimeType=csv; JSON endpoint 406s).
- Findings:
  - 11 USGS stations along the mainstem (Niota→Charleston, above); Result query for the three lower gages (03566129/-140/-142) returns **0 rows** (discontinued crest-stage/flow gages; no WQP data).
  - TDECWPC-NMOUS024.3MM: 732 results 1999–2008; NMOUS024.8MM 129 (1999); NMOUS025.2MM 243 (2003–2006); LNMOU stations 1999–2006 — combined 2,320 rows at North/South Mouse TDEC stations, **water chemistry only** (DO, pH, nutrients, metals, E. coli). **Zero biological taxa rows, zero fish, zero tissue results.**
  - Tissue lane (county-wide pull, 3,612 rows Bradley+McMinn): all tissue stations are on the Hiwassee River/Chickamauga Reservoir (e.g., TDECWR_WQX-TNW000002958 Hiwassee River 35.3271, -84.8264; TNW000002970 35.2736, -84.7536), taxa = channel/largemouth/blue catfish, largemouth/spotted bass, carp, paddlefish, stripers, snapping turtle — **warmwater assemblage; no Mouse Creek tissue station**.
- Method/count: method-documented 305(b)-style chemistry monitoring, 10 consecutive years (1999–2008) on the mainstem near Athens; no fish assemblage data in the portal.
- Type + confidence: Method-documented monitoring omitting fish = limited negative evidence (chemistry program, not a fish survey), moderate weight.
- Establishes: Long official monitoring presence as a wadeable warm stream; no trout-era program. Does NOT establish the fish community.

### S5. GBIF — museum/aggregated occurrence search
- Retrieval: 2026-09-24, https://api.gbif.org/v1/occurrence/search?taxonKey=204 (Actinopterygii) &decimalLatitude=35.10,35.60&decimalLongitude=-84.95,-84.55 → **total = 0**; Salmonidae (taxonKey 971) in wider box 35.0,35.7/-85.0,-84.4 → **total = 0**.
- Type + confidence: Coverage gap (digitization), high confidence in the gap itself.

### S6. iNaturalist
- Retrieval: 2026-09-24, https://api.inaturalist.org/v1/observations?taxon_name=Salmonidae&swlat=35.05&swlng=-85.0&nelat=35.65&nelng=-84.5 → **total_results = 0**; q="Mouse Creek" + Actinopterygii → 0.
- Type + confidence: Weighted negative, moderate (salmonids are conspicuous when present; community coverage of these creeks is thin).

### S7. Fishbrain water page "North Mouse Creek" (Athens, TN) — LEDGER LEAD RESOLVED
- URL: https://fishbrain.com/fishing-waters/0DKzL62K/north-mouse-creek (retrieved 2026-09-24 via curl; page SSR HTML in _work/fb_north-mouse-creek.html).
- Fields: Athens TN; centroid 35.4570, -84.6438; "It is most popular for fishing **Largemouth bass, Bluegill, and Black crappie**" (the only water-specific species statement); **no public dated catch reports on the page (zero "caughtAt" records)**.
- The page's embedded species index includes "Brown trout" (species id qluM92F5) and "Rainbow trout" — **CONTROL RESULT: the identical 20-species index (including Red drum, a marine fish) appears on every Fishbrain water page tested, including "Mouse Creek, Grandview, MO" (https://fishbrain.com/fishing-waters/slW3cA6P/mouse-creek), Little North Mouse Creek, East Fork North Mouse Creek, and South Mouse Creek.** It is Fishbrain's site-wide species-filter boilerplate, not per-water catch data.
- Interpretation: the ledger's "single community-app brown-trout entry" is, in its original public context, an item in this boilerplate species index on the water's Fishbrain page — **not a dated, geolocated community catch**. Downgraded from "uncorroborated lead" to "attributable to app boilerplate".
- Type + confidence: LEAD (downgraded; boilerplate attribution), very low confidence.

### S8. Companion Fishbrain pages (warmwater context, same control)
- Little North Mouse Creek (https://fishbrain.com/fishing-waters/m6sW-WDT/little-north-mouse-creek, Athens): "Largemouth bass, Creek chub, Rock bass".
- East Fork North Mouse Creek (https://fishbrain.com/fishing-waters/2BiZZdOb/east-fork-north-mouse-creek, Sweetwater): top species "Striped shiner".
- Type: community-app warmwater species lists, low-moderate confidence (app aggregation, undated).

### S9. How's Your River profile
- URL: https://www.howsyourriver.com/water_bodies/north-mouse-creek (retrieved 2026-09-24; page states "Updated Dec 26, 2025").
- Fields: TN North Mouse Creek 35.3278, -84.7895; length 40 mi; elevation 1,137 ft → 678 ft; slope 0.22% (11.6 ft/mi); drainage 93 sq mi; stream order 5; avg flow 164 cfs; 1 access site (boat ramp); WQP-linked.
- Type: infrastructure/hydrology documentation (no species). Establishes reach geometry and low gradient; the boat-ramp access profile fits a warmwater float fishery.

### S10. Same-name / adjacent-name controls
- Fishbrain "Mouse Creek" = Grandview, MISSOURI (38.889, -94.454) — different state, S7 control.
- "Mouse Creek" (McMinn Co.) = an unincorporated community on US-411 (Wikipedia has no article; search-page stub retrieved 2026-09-24) — a place, not the water.
- Little North Mouse Creek and East Fork North Mouse Creek = separate GNIS streams (USGS-03566121…125; -03566117); confusions among these collapse onto the same warmwater basin.

## Searches run (incl. unproductive)
1. WebSearch fishbrain "North Mouse Creek" brown trout — backend 429 rate-limit storm; one partial result surfaced Fishbrain Little North Mouse Creek page.
2. WebSearch fishbrain.com "North Mouse Creek" fishing — productive (OnWater page, forum, fishangler South Mouse surfaced).
3. DDG lite `site:fishbrain.com "mouse creek"` — productive (4 exact water-page URLs).
4. DDG lite fishbrain "north mouse creek" (second form) — 0 results.
5. WebSearch "North Mouse Creek" trout/stocked — 429s, then model filler asserted "Meigs/McMinn near Ten Mile & Evensville… known locally as a trout water… historically stocked by TWRA" — DISPROVEN by S1/S2 and by geography (wrong counties/communities); logged as AI-filler.
6. WebFetch https://fishbrain.com/fishing-waters/us/tn/north-mouse-creek — 404 (wrong slug; real slug is ID-keyed 0DKzL62K).
7. WebFetch onwaterapp.com fishing page — 403; curl with browser UA on https://www.onwaterapp.com/us/tennessee/water/north-mouse-creek-w1 — 200 but client-rendered, no static species content. Weak.
8. DDG lite onwaterapp north mouse — productive (fishbox + howsyourriver + onwater URLs).
9. fishbox.com spot page (https://fishbox.com/spot/united-states/tennessee/north-mouse-creek-1640431) — template shell, no species (client-rendered). Unproductive.
10. Wayback CDX for TDEC Hiwassee watershed plan PDFs — repeated empty responses; lane exhausted (tn.gov blocks plain curl; same as candies-creek pass).
11. WebSearch TDEC "Mouse Creek" biorecon/305(b) — partial: TDEC watershed-plan framework pages + City of Cleveland stormwater (South Mouse only). No creek-specific biorecon score retrieved.
12. curl howsyourriver North Mouse pages — productive (S9).
13. curl Wikipedia "Mouse Creek, Tennessee" — no article (sister-project stub). Same-name control only.
14. USGS NAS API Bradley + McMinn — productive (S3).
15. WQP station + result + tissue pulls — productive (S4).

## Contradictions
- Search-engine AI summaries twice asserted trout status ("known locally as one of the area's trout waters… historically included in TWRA's trout stocking program"; "occasional stocked trout in cooler months" for the Cleveland greenway creek). Authoritative TWRA datasets (S1, S2) show zero stocking on any Mouse water and zero Bradley County stocking at all; wrong-county geography in the first filler. Resolved in favor of primary data.
- Ledger "community-app brown trout entry" resolved to Fishbrain site-wide boilerplate species index (S7), present verbatim on an unrelated Missouri creek page — not evidence of occurrence.

## Recommendation: WARMWATER-FOCUS
Reasoning: (a) No TWRA trout stocking site on any "Mouse" water and no Bradley County trout program in the current layer or 2026 schedule; McMinn's only stocked water is Athens City Park Pond (a pond) — pond hits must be attributed there; (b) mouth is the warm Hiwassee-arm backwater near Charleston and the lower ~25 stream miles run at 0.22% gradient — thermally incompatible with a trout fishery; (c) zero salmonid records across USGS NAS (two counties), GBIF, and iNat despite decades of county-scale sampling and 10 consecutive years of TDEC mainstem monitoring; (d) the only water-specific community-app species signal is Largemouth bass/Bluegill/Black crappie (plus Creek chub/Rock bass on the Little North Mouse and Redeye bass on South Mouse) — a warmwater list; (e) the brown-trout lead, traced to its original public context, is Fishbrain boilerplate, not a catch. Not "trout"; not "seasonal-stocked" (absent from both TWRA datasets; nearest seasonal streams are Big Soddy/N Chickamauga in Hamilton Co and the Hiwassee tailwater in Polk Co). Residual uncertainty: no fish-community survey of the creek itself was located (WQP has chemistry only; TDEC biorecon fish/benthic results not in the portal; GBIF digitization absent; TWRA Region 3 stream files not online), and the search backend's rate-limiting prevented an exhaustive sweep of 1970s–80s paper-era surveys — "warmwater-focus" rests on programmatic, thermal, and negative-record grounds.
