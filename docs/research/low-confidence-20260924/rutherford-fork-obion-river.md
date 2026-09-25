# Rutherford Fork Obion River — evidence log

Water: Rutherford Fork Obion River, northwest Tennessee (Obion River system fork; rises in Carroll County uplands, flows north/northwest through Gibson County past Milan, Bradford, the town of Rutherford and Kenton; HUC-8 08010203, shared with the Middle Fork Obion).
Ledger at start: limited / warmwater-focus — TWRA manages Obion rivers/tributaries under the West TN crappie rule (30/day, no length limit); no trout survey/release/observation found.
Research pass: 2026-09-24 (all retrievals this date). Research only; no fieldwork, no contacts.

## SAME-NAME RISKS (explicit disambiguation)
- Rutherford COUNTY (Region 2, Murfreesboro area): TWRA trout sites "Nice Mill" and "W. Fork Stones River – Manson Pike Trailhead" appear in the 2026 trout schedule — these are the ONLY "Rutherford" trout rows statewide and belong to Rutherford County, not the Rutherford Fork.
- Town of Rutherford (Gibson Co.): USGS gage "RUTHERFORD FK OBION RIVER AT RUTHERFORD, TN" (USGS-07025050) and WQP station of the same name refer to the fork at the town.
- South Fork Obion River: WQP station "SOUTH FORK OBION RIVER NEAR RUTHERFORD, TN" (HUC 08010203) is the South Fork passing near the town of Rutherford — not the Rutherford Fork.
- "Rutherford Fork of the Obion River" Wikipedia search hit redirects to the main "Obion River" article (no standalone trout content anywhere).

## (1) Trout stocking / occurrence — expected none; CONFIRMED none found

### S1. TWRA 2026 trout stocking schedule (official JSON)
- Title/org: "Trout Information — Stockings" data table, Tennessee Wildlife Resources Agency.
- Publication/observation dates: 2026 schedule (stocking days 1/2026 through TBD 12/2026).
- Retrieval date: 2026-09-24.
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json
- Fields: 616 rows; Region 1 = 42 rows, all Rainbow Trout at city park ponds/lakes or Perry/Houston/Humphreys/Stewart spring creeks.
- Rutherford Fork finding: zero rows. Closest sites: Milan City Pond (Gibson Co., 1/14/2026 + TBD 12/2026) — a city park pond, not the fork; Union City Reelfoot Packing Site (Obion Co. pond). The only "Rutherford" rows are Rutherford County Region 2 sites (Nice Mill 1/16 & 2/13/2026; W. Fork Stones River 2/4 & 2/27/2026) — different water, different county, different region.
- Type: regulatory/program record (absence of stocking program). Confidence: high. Establishes: no current stocking.

### S2. TWRA ArcGIS "TWRA_Trout_Stocking_Locations" (current) and "StockedTroutMar2016" (historical)
- Org: TWRA (services3.arcgis.com/PWXNAH2YKmZY7lBq). Retrieval date: 2026-09-24.
- URLs:
  - https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0/query?where=Region%3D%271%27&outFields=*&returnGeometry=false&f=json (23 Region 1 features, 2016 layer)
  - https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/StockedTrout2016/FeatureServer/0/query?where=1%3D1&outFields=*&returnGeometry=false&f=json (796 statewide; 25 Region 1)
- Rutherford Fork finding: no feature on the fork in either layer; Gibson Co. trout site = Milan City Park pond only. Type: program records. Confidence: high (back to 2016). Establishes: no trout stocking site on the fork in the current program or the 2016 snapshot.

### S3. GBIF / iNaturalist — zero Salmonidae in the county bbox
- Orgs: GBIF; iNaturalist. Retrieval date: 2026-09-24.
- URLs:
  - https://api.gbif.org/v1/occurrence/search?taxonKey=8615&decimalLatitude=35.6,36.6&decimalLongitude=-89.6,-88.4&limit=5 → count 0 (Salmonidae usageKey 8615 verified via species/match)
  - coverage: same bbox, no taxon filter → 760,583 records (top hit Lepomis gulosus)
  - https://api.inaturalist.org/v1/observations?taxon_id=47520&swlat=35.6&swlng=-89.6&nelat=36.6&nelng=-88.4&per_page=0 → 0; Actinopterygii (47178) → 971 observations
- Type: aggregated/citizen-science absence (weighted; non-detection ≠ literal absence). Confidence: moderate. Establishes: no trout record of any origin in the bbox containing Gibson/Carroll counties.

### S4. WQP — chemistry-only on the fork; no fish or tissue data
- Org: EPA WQX (TDECWR_WQX + USGS). Retrieval date: 2026-09-24.
- URL: https://www.waterqualitydata.us/data/Station/search?huc=08010203&mimeType=csv
- Fields (fork stations): "RUTHERFORD FORK OBION RIVER NEAR MILAN, TN" (USGS-07024900), "NEAR BRADFORD, TN" (USGS-07025000), "NR DYER" (USGS-07025025), "AT RUTHERFORD, TN" (USGS-07025050), "NEAR HOWLEY, TN", "NEAR KENTON, TN (CE)", plus TDECWR sites "RUTHERFORD FORK OBION RIVER DRAINAGE CANAL" (Highway 89/Keaton Road bridge; HWY 89 U/S 150 yards) and "Unnamed tributary to the Rutherford Fork Obion River".
- Result searches: characteristicType=Biological for HUC 08010203 = 0 rows; Biological/Tissue at gage sites = 0 rows. WQP cannot establish fish presence or absence here (chemistry only).
- Type: context/data-coverage proof. Confidence: high about emptiness of biological data.

## (2) Broad fish survey / species list (the weighted negative)

### S5. Dickinson 1973 — system-wide fish survey covering the Rutherford Fork (PRIMARY negative evidence)
- Title/author/org: "The fishes of the Obion River system", MS thesis, William Clark Dickinson, University of Tennessee, Knoxville. Issued 1973-08-01.
- Observation dates: fall 1971–summer 1973 (author's 77 of 183 collections) plus earlier investigators' records (E. S. Cobb, Tennessee Game and Fish Commission; D. A. Etnier; J. E. Deck; R. W. Bouchard; F. B. Cross 1965; Baker 1938–39).
- Retrieval date: 2026-09-24 (full PDF).
- URLs:
  - item: https://trace.tennessee.edu (DSpace item uuid dbaabb11-209e-496c-a8d2-28557e1e22e2; handle 20.500.14382/44717)
  - PDF: https://trace.tennessee.edu/server/api/core/bitstreams/6d5402ad-0b7e-498c-92c7-f30f450fa90b/content
- Method/count: "seining, chemical application, and to a small extent, hoop netting and gill netting"; 183 collections system-wide; "Of the 110 species presumed to exist in the system, 100 were verified by records."
- Rutherford Fork coverage (Table II): collection No. 164 "Buggy Branch of Rutherford Fork Obion River at county road 8037, Carroll Co." (Aug 5, 1972; Dickinson, Deck, Benedict); No. 165 "Rutherford Fork Obion River 1/2 mi. east of Kenton, Obion Co." (Jun 7, 1973); No. 166 "at bridge 1 air mi. north of Henderson County line, Carroll Co." (Jun 15, 1973); No. 168 "1.5 air mi. east of U.S. 70, Carroll Co." (Jun 15, 1973); No. 169 "at county road 8036, Carroll Co." (Jun 16, 1973); No. 170 "at county road 8179, Gibson Co." — seven collections across the headwaters (Carroll Co.), mid-reach (Gibson Co.) and lower reach (Kenton).
- Species found: digitized Table I reliably links Rutherford Fork collections to Notropis camurus (bullhead minnow; Nos. 164, 165, 166, 168, 169) and Hybognathus nuchalis (No. 170); the columnar table defeats complete automated pairing, but the system-wide assemblage (100 verified species: gars, bowfin-adjacent lowland forms, minnows/suckers, catfishes, pike/topminnow, sunfishes, basses, crappies, darters, drum) is entirely warmwater.
- Species omitted: Salmonidae — zero occurrences of "Salmo", "Oncorhynchus", "trout", "Salmonidae", "salmon" anywhere in the 89-page text.
- Type: broad method-documented survey with full species list omitting trout = meaningful NEGATIVE evidence (weighted). Confidence: high for the 1960s–1973 era. Establishes: no trout record in the system despite multi-method sampling that included the Rutherford Fork's headwaters and lower reach.

## (3) Dated warmwater documentation beyond the crappie rule

### S6. TWRA/eRegulations 2026 crappie exception (regulatory baseline)
- Org: TWRA via eRegulations. "Last Updated: September 15, 2026." Retrieval date: 2026-09-24.
- URL: https://www.eregulations.com/tennessee/fishing/exceptions-to-statewide-regulations
- Quote: "Crappie: 30 per day, no length limit" — "Forked Deer, Hatchie, Loosahatchie, Obion and Wolf Rivers (includes tributaries)". The Rutherford Fork is a named tributary of the Obion, hence under this rule. No trout rule for West TN streams on the page.
- Type: managed-warmwater documentation (regulatory). Confidence: high.

### S7. USGS gage network (dated agency monitoring of the reach)
- Org: USGS. Retrieval date: 2026-09-24.
- URL: https://waterservices.usgs.gov/nwis/site/?format=rdb&sites=07024900,07025000,07025025,07025050&siteOutput=expanded
- Fields: NEAR MILAN (35.9467/-88.7137, DA 110 sq mi) → NEAR BRADFORD (36.0609/-88.8890, DA 204) → NR DYER (36.0809/-88.9151, DA 215) → AT RUTHERFORD (36.1295/-88.9745, DA 238 sq mi). Also a Tennessee Water Resources Symposium paper (found via WebSearch snippet, img1.wsimg.com host) reports declining low-flow trends since 1980 for gages on the North, Middle, South, and Rutherford Forks.
- Type: long-term agency monitoring documenting a warmwater lowland stream; not fish-presence evidence. Confidence: high (gages), low (symposium paper, snippet-level).

### S8. Channelization literature
- BioOne (via WebSearch snippet, retrieval 2026-09-24): modeling study treating the "Rutherford Fork of the Obion" alongside the Hatchie River and Upper Wolf as a channelized/leveed West TN system (A. Simon geomorphology work; "incised channelized reach in the Obion River system"). Snippet-level only.
- WQP/TDEC station names "RUTHERFORD FORK OBION RIVER DRAINAGE CANAL" corroborate channelization of the reach.
- Type: habitat documentation. Confidence: moderate. Establishes: engineered, agricultural warmwater channel — habitat inconsistent with trout.

### S9. 2002 TDEC 305(b) report (snippet-level)
- WebSearch result (retrieval 2026-09-24): the 2002 305(b) Report (tn.gov) mentions the South Fork Obion watershed and the "South and Rutherford" forks in water-quality assessment context. Full document not fetched; treat as lead.

## (4) Reach definition

- Course/counties: rises in northern Carroll County uplands near the Henderson County line and U.S. 70 (thesis collections Nos. 166, 168, 169; Buggy Branch tributary No. 164), flows northwest through Gibson County — gaged near Milan (DA 110 sq mi), near Bradford (204), near Dyer (215), at the town of Rutherford (238 sq mi) — then northeast past Kenton (Obion/Gibson line; thesis No. 165 "1/2 mi east of Kenton, Obion Co."; WQP "NEAR KENTON (CE)"), converging with the other forks "near the Weakley-Obion County line" (Dickinson 1973, Ch. I: "Each of the four principal tributaries—the North, the Middle, the South, and the Rutherford Forks are approximately 50 river miles long"; main river "merges with the Forked Deer River about three miles east of the Mississippi River").
- Backwater/channelization: no impoundment backwater on the fork; reach is dredged — "RUTHERFORD FORK OBION RIVER DRAINAGE CANAL" TDECWR stations (Hwy 89/Keaton Rd) and the BioOne channelization literature; the drainage-canal naming applies to the Gibson County reaches.
- TWRA access: no access site on the fork (AllAccessSites Waterway LIKE %OBION% returned 6 features, all main-stem Obion or South Fork — incl. Highway 89 Boat Ramp on the South Fork; retrieval 2026-09-24, https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/AllAccessSites/FeatureServer/0/query?where=UPPER(Waterway)%20LIKE%20%27%25OBION%25%27&outFields=*&returnGeometry=false&f=json).
- Reach adopted for classification: entire fork, Carroll County headwaters (U.S. 70 area) to the Kenton reach ≈50 river miles, channelized warmwater run/canal habitat.

## Contradictions
- None substantive. onWater app lists the water with Largemouth Bass/Bluegill "among others" (WebSearch snippet); the direct page https://www.onwaterapp.com/us/tennessee/water/rutherford-fork-obion-river-w1 returned HTTP 403 on fetch attempt and https://piscamaps.com/us/tennessee/rivers/rutherford-fork-obion-river returned 404 — no trout content verified on either; logged as leads only.
- Rutherford County trout rows (Nice Mill, W. Fork Stones River) are the principal contamination risk for any keyword-based pass; they do not touch this fork.

## Searches run (retrievals 2026-09-24), incl. unproductive
Productive: WebSearch "Rutherford Fork Obion fishing/fish/trout" (no trout evidence; surfaced 2002 305(b) lead); WebSearch Fishbrain/onWater Rutherford Fork (warmwater-only snippets); TWRA 2026 stocking JSON; TWRA ArcGIS trout layers (current + 2016); TWRA ArcGIS AllAccessSites %OBION%; GBIF/iNat bbox queries (0 Salmonidae vs strong coverage); WQP station search HUC 08010203 (fork stations) + Biological/Tissue result searches (0 rows); USGS NWIS expanded site metadata; Trace DSpace API (thesis item + PDF); eRegulations statewide-limits and exceptions pages (crappie rule); Wikipedia Obion River.
Unproductive/exhausted: USGS NAS API v2 county endpoint (404, lane abandoned); EPA ATTAINS API (API key required); How's My Waterway API (routes do not exist); direct onWater fetch (403); PiscaMaps Rutherford page (404); Bing/DuckDuckGo HTML scraping (blocked/empty); NEPIS 1990 305(b) targeted search for a "Rutherford Fork" segment (rate-limited, not completed); TDEC 303(d) segment tables not retrieved.

## Recommendation
**warmwater-focus** (unchanged from ledger; confidence improved from limited).
Reasoning: (a) no trout stocking has ever been documented on the fork in TWRA program records (2026 schedule, current ArcGIS site universe, 2016 historical layer) — the nearest trout water is Milan City Pond, a put-and-take city park pond; (b) the Dickinson 1973 system survey sampled the fork's headwaters, mid-reach and Kenton reach with seines/chemicals/nets and recorded zero Salmonidae among 100 verified species; (c) GBIF and iNat hold zero trout records for the bounding box of its counties with strong warmwater coverage; (d) the reach is a channelized agricultural warmwater stream managed only under warmwater rules (crappie 30/day via the Obion "includes tributaries" clause). Gaps: no modern agency fish-community survey (TWRA Region 1 stream file or TDEC biorecon) was located; the 2002 305(b) mention and BioOne/Symposium items are snippet-level leads; Table I's columnar layout prevented a complete automated species-listing for the fork's collections.
