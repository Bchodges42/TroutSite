# Middle Fork Obion River — evidence log

Water: Middle Fork Obion River, northwest Tennessee (Obion River system fork; headwaters Henry County, channelized course west through Weakley County; HUC-8 08010203 with the Rutherford Fork).
Ledger at start: limited / warmwater-focus — TWRA manages Obion rivers/tributaries under the West TN crappie rule (30/day, no length limit); no trout survey/release/observation found.
Research pass: 2026-09-24 (all retrievals this date). Research only; no fieldwork, no contacts.

## (1) Trout stocking / occurrence — expected none; CONFIRMED none found

### S1. TWRA 2026 trout stocking schedule (official JSON)
- Title/org: "Trout Information — Stockings" data table, Tennessee Wildlife Resources Agency.
- Publication/observation dates: 2026 schedule; stocking dates 1/8/2026–2/27/2026 and TBD 12/2026 entries.
- Retrieval date: 2026-09-24.
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json
- Fields: 616 rows; REGION/COUNTY/LOCATION/TYPE/STOCKING DAY/SPECIES. Region 1 = 42 rows.
- Species: Rainbow Trout only, in Region 1.
- Middle Fork finding: zero rows for "Middle Fork", "Obion River" (stream), Weakley/Henry-stream sites. Region 1 West TN trout sites are city park ponds/lakes (Shelby: Cameron Brown, Edmund-Orgill, W.C. Johnson, Shelby Farms, Yale Road, Davies Plantation; Tipton: Munford, Valentine, Covington FBC; Carroll: McKenzie; Gibson: Milan City Pond; Weakley: Martin City Pond; Obion Co.: Union City Reelfoot Packing Site; Henry: Paris City Park; Madison: Lake Graham; Henderson: Beech Lake) plus Perry/Houston/Humphreys/Stewart spring creeks (Cane Creek, Hurricane Creek, White Oak Creek, Standing Rock Creek). None is the Middle Fork.
- SAME-NAME RISK resolved: the only "Rutherford" rows are Rutherford COUNTY, Region 2 (Nice Mill; W. Fork Stones River–Manson Pike Trailhead) — unrelated to Rutherford Fork Obion River.
- Type: regulatory/program record (absence of stocking program). Confidence: high.
- Establishes: no TWRA trout stocking program touch on the Middle Fork in the current schedule. Does not prove historical absence pre-2026 (see S3).

### S2. TWRA ArcGIS FeatureServer "TWRA_Trout_Stocking_Locations" (current)
- Org: TWRA (services3.arcgis.com/PWXNAH2YKmZY7lBq).
- Retrieval date: 2026-09-24.
- URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0/query?where=Region%3D%271%27&outFields=*&returnGeometry=false&f=json
- Fields: 23 Region 1 features; WaterClass pond/reservoir except Perry/Houston/Humphreys/Stewart streams; Species=rainbow.
- Middle Fork finding: no feature on any Obion-system stream.
- Type: program record. Confidence: high. Establishes: current stocking site universe excludes the fork.

### S3. TWRA ArcGIS "StockedTroutMar2016" (historical layer)
- Org: TWRA. Layer created Mar 2016 (CreationDate epoch 1492459087216).
- Retrieval date: 2026-09-24.
- URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/StockedTrout2016/FeatureServer/0/query?where=1%3D1&outFields=*&returnGeometry=false&f=json
- Fields: 796 stocked-trout sites statewide; 25 in Region 1; NumStocked given for ponds.
- Middle Fork finding: only Obion-system row is "OBION — Union City Reelfoot Packing Site (pond)". No Middle Fork row. Same park-pond pattern as 2026.
- Type: program record (historical). Confidence: high (back to 2016 only). Establishes: no trout stocking site on the fork as of 2016 either.

### S4. GBIF occurrence search — Salmonidae in West TN bbox
- Org: GBIF Secretariat. Retrieval date: 2026-09-24.
- URLs:
  - match: https://api.gbif.org/v1/species/match?name=Salmonidae (usageKey 8615)
  - search: https://api.gbif.org/v1/occurrence/search?taxonKey=8615&decimalLatitude=35.6,36.6&decimalLongitude=-89.6,-88.4&limit=5 (count = 0)
  - coverage: https://api.gbif.org/v1/occurrence/search?decimalLatitude=35.6,36.6&decimalLongitude=-89.6,-88.4&limit=1 (count = 760,583; top result Lepomis gulosus)
- Fields: bbox covers Henry/Weakley/Gibson/Obion/Carroll counties (the whole fork system).
- Type: aggregated dataset absence (non-detection ≠ literal absence). Confidence: moderate (coverage proven by 760k records; zero Salmonidae).
- Establishes (weighted): no trout occurrence records aggregated by GBIF anywhere in the counties' bbox.

### S5. iNaturalist — Salmonidae in same bbox
- Org: iNaturalist (California Academy of Sciences / Nat Geo). Retrieval date: 2026-09-24.
- URLs:
  - https://api.inaturalist.org/v1/taxa?q=salmonidae (taxon id 47520)
  - https://api.inaturalist.org/v1/observations?taxon_id=47520&swlat=35.6&swlng=-89.6&nelat=36.6&nelng=-88.4&per_page=0 → total 0
  - coverage: same query taxon_id=47178 (Actinopterygii) → 971 observations
- Type: citizen-science absence. Confidence: moderate. Establishes (weighted): no iNat trout observations in the fork counties; ~1k fish observations show observers are present.

### S6. WQP — no fish data of any kind on the fork
- Org: EPA Water Quality Exchange (TDECWR_WQX + USGS). Retrieval date: 2026-09-24.
- URL: https://www.waterqualitydata.us/data/Station/search?huc=08010203&mimeType=csv (also Result searches, see log notes)
- Fields: HUC-8 08010203 stations include legacy USGS gages "MIDDLE FORK OBION RIVER NEAR COMO/GLEASON/NR DRESDEN/NEAR SIDONIA" (USGS-07024700/-07024705/-07024720/-07024790) plus modern TDECWR_WQX River/Stream sites (incl. "MIDDLE FORK OBION RIVER (CANAL)" HWY 190 near Gleason; "ETHERAGE LEVEE RD NEAR SHARON").
- Result searches: characteristicType=Biological for HUC 08010203 = 0 rows; Biological/Tissue at the three gage sites = 0 rows. WQP carries chemistry only here — cannot establish fish presence or absence.
- Type: context (data-coverage proof), not fish evidence. Confidence: high about the emptiness itself.

## (2) Broad fish survey / species list (the weighted negative)

### S7. Dickinson 1973 — system-wide fish survey (PRIMARY negative evidence)
- Title/author/org: "The fishes of the Obion River system", MS thesis, William Clark Dickinson, University of Tennessee, Knoxville (advisor lineage: D.A. Etnier). Issued 1973-08-01.
- Observation dates: survey fall 1971–summer 1973 (author's 77 of 183 collections) plus earlier records: F.B. Cross April 1965, Baker 1938–39, E.S. Cobb (Tennessee Game and Fish Commission), J.E. Deck (UTM), R.W. Bouchard, D.A. Etnier.
- Retrieval date: 2026-09-24 (full PDF).
- URLs:
  - item: https://trace.tennessee.edu/utk_gradthes/ (handle 20.500.14382/44717)
  - PDF: https://trace.tennessee.edu/server/api/core/bitstreams/6d5402ad-0b7e-498c-92c7-f30f450fa90b/content
- Method/count: "seining, chemical application, and to a small extent, hoop netting and gill netting"; 183 collections system-wide; "Of the 110 species presumed to exist in the system, 100 were verified by records."
- Middle Fork coverage: collection numbers 93–142 assigned to the Middle Fork (≈50 collections), including "Middle Fork Obion River at Tenn. 22, Weakley Co." (Aug 28, 1969), "10 mi. southwest of Paris, Henry Co." (Jul 7, 1970), "3.3 mi. southeast of Como, Henry Co." (Sep 15, 1971 — Cobb/TG&F), "4.25 mi. southwest of Como at bridge on county road 8019, Weakley Co." (Sep 14, 1971 — Cobb/TG&F), "Old channel of Middle Fork Obion River" (Nos. 107, 110).
- Species found on/around the fork (system and fork passages): chestnut lamprey (Middle Fork 1965, Henry Co.), spotted/shortnose/longnose gar (Thompson Creek of the Middle Fork), goldeye (2 specimens Middle Fork), central mudminnow, redhorses, buffalos, bullheads, madtoms, sunfishes/Lepomis, Micropterus (spotted/largemouth/smallmouth), crappies (white/black in main channels North Fork and Middle Fork), darters (slough, harlequin 1964 Cross collection at Tenn. 22 Weakley Co., etc.), freshwater drum (TG&F chemical surveys from Middle Fork).
- Species omitted: Salmonidae — zero occurrences of "Salmo", "Oncorhynchus", "trout", "Salmonidae", "salmon" in the full 89-page text.
- Type: broad method-documented survey with full species list omitting trout = meaningful NEGATIVE evidence (weighted). Confidence: high for 1971–1973-era absence of trout records in the system; non-detection ≠ literal absence.
- Establishes: the documented Obion-system fauna is warmwater; no trout record existed as of 1973 despite targeted multi-method sampling of the Middle Fork. Note: thesis also mentions fish "reportedly stocked in Carroll Lake" (TG&F-managed, Clear Creek headwaters, Carroll Co.) — a lake, not the fork.

### S8. PiscaMaps species list (tertiary, current)
- Org: PiscaMaps (fishing atlas). Retrieval date: 2026-09-24.
- URL: https://piscamaps.com/us/tennessee/rivers/middle-fork-obion-river
- Species: "Smallmouth Bass, Largemouth Bass, Spotted Bass, Walleye, Black Crappie, White Crappie, Bluegill, Channel Catfish, Common Carp"; page states "Rules verified 2026-09-01 against TWRA regulations"; attributes list to "TWRA and Tennessee fishery data".
- Trout omitted. Type: tertiary aggregator. Confidence: low (no underlying survey shown). Establishes: current public warmwater species profile only.

## (3) Dated warmwater documentation beyond the crappie rule

### S9. TWRA/eRegulations 2026 crappie exception (regulatory baseline)
- Org: TWRA via eRegulations (Outdoor Rulebooks). "Last Updated: September 15, 2026."
- Retrieval date: 2026-09-24.
- URL: https://www.eregulations.com/tennessee/fishing/exceptions-to-statewide-regulations
- Quote: "Crappie: 30 per day, no length limit" applying to "Forked Deer, Hatchie, Loosahatchie, Obion and Wolf Rivers (includes tributaries)". No trout rule for any West TN stream on the page.
- Type: managed-warmwater documentation (regulatory; not a presence record). Confidence: high.

### S10. EPA NEPIS — 1990 Tennessee 305(b) Report, Middle Fork segment
- Org: TDEC (then Tennessee Department of Health & Environment) via EPA NEPIS archive.
- Observation/publication: 1990 report; segment "TN08010203015" Middle Fork Obion (Weakley County) with sources "MUNICIPAL / CHANNELIZATION / NATURAL BANK MODIFICATION".
- Retrieval date: 2026-09-24 (via WebSearch snippet; full document not fetched).
- URL (host): https://nepis.epa.gov ("The Status of Water Quality in Tennessee 1990 305(b)").
- Type: dated agency use-assessment of the reach (aquatic-life use impairment from channelization). Confidence: moderate (snippet-level). Establishes: agency-managed aquatic resource, channelized habitat — trout-habitat-incompatible; no trout mention.

### S11. TDEC regional stream characterization (secondary corroboration)
- Org: TDEC / TN Comptroller mirror — "Regional Characterization of Streams in Tennessee"; figure of a "non-wadeable impaired site on the Middle Fork Obion River in the Southeastern Plains and Hills (65e)".
- Retrieval date: 2026-09-24 via WebSearch snippet (host: https://comptroller.aem.tn.extglb.tn.gov). Full doc not fetched.
- Type: agency ecoregion reference monitoring. Confidence: moderate (snippet-level).

## (4) Reach definition

- Course/counties: rises in Henry County uplands (gage USGS-07024700 "MIDDLE FORK OBION RIVER NEAR COMO, TENN", 36.2712/-88.5095, DA 67.6 sq mi); west through Weakley County — near Gleason (USGS-07024705, DA 87.5), near Dresden (USGS-07024720, DA 137), Sharon ("ETHERAGE LEVEE RD NEAR SHARON" TDECWR station), near Sidonia (USGS-07024790, DA 310 sq mi, 36.2065/-88.9390). Source: USGS NWIS expanded sites, retrieval 2026-09-24, https://waterservices.usgs.gov/nwis/site/?format=rdb&sites=07024700,07024705,07024720,07024790,07024790&siteOutput=expanded; and WQP station search (S6).
- Length/formation: "Each of the four principal tributaries—the North, the Middle, the South, and the Rutherford Forks are approximately 50 river miles long... The convergence of these forks near the Weakley-Obion County line forms the main river, which then continues through a valley about 50 miles long and merges with the Forked Deer River about three miles east of the Mississippi River" (Dickinson 1973, Ch. I; citing Tenn. State Planning Comm. 1936). Wikipedia (retrieval 2026-09-24, https://en.wikipedia.org/wiki/Obion_River) adds the fork confluences are "a few miles above the mouth of the Obion's discharge into the Mississippi River" (mouth at Dyer/Lauderdale line).
- Backwater/channelization: no impoundment backwater documented on the fork; the channel was dredged ("largely been subjected to channelization practices within the past 50 or 60 years" — Dickinson 1973; WQP station names "MIDDLE FORK OBION RIVER (CANAL)"; relic "Old channel of Middle Fork Obion River" collections Nos. 107/110). Levee-lake Number lakes on the old floodplain (e.g., "Middle Fork Obion Lake Number Two/Seven", Fishbrain/Lake-Link pages) are adjacent features, not the stream reach.
- TWRA access: no TWRA/county boat access site on the Middle Fork (AllAccessSites query Waterway LIKE %OBION% returned 6 sites, all main-stem Obion or South Fork; retrieval 2026-09-24, https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/AllAccessSites/FeatureServer/0/query?where=UPPER(Waterway)%20LIKE%20%27%25OBION%25%27&outFields=*&returnGeometry=false&f=json).
- Reach adopted for classification: entire fork from Henry County headwaters to the fork-convergence near the Weakley/Obion line (≈50 river miles), all channelized warmwater run/canal habitat.

## Contradictions
- None substantive. PiscaMaps includes Walleye — plausible (Dickinson reports goldeye/mooneye family waters; no walleye verified in thesis) but unverified tertiary claim; does not affect trout determination.
- onWater app page (https://www.onwaterapp.com/us/tennessee/water/middle-fork-obion-river-w1) returned HTTP 403 on fetch; content unverified — logged as lead only.
- Facebook group post (West TN Public Jet Boaters Club) "Fishing on Middle Fork Obion River in Sharon?" — undated local-angler interest; jet-boat use indicates sufficient depth for warmwater boating; not retrievable, lead only.

## Searches run (retrievals 2026-09-24), incl. unproductive
Productive: TWRA 2026 stocking JSON; TWRA ArcGIS trout locations (Region 1); TWRA ArcGIS StockedTroutMar2016; TWRA ArcGIS AllAccessSites %OBION%; GBIF species match + bbox occurrence (Salmonidae 0; total 760,583); iNat taxa + bbox observations (0 vs 971 fish); WQP station searches HUC 08010202/08010203/08010201/08010204/08010205/08010206; WQP Result searches Biological/Tissue (0 rows — unproductive for fish by design); USGS NWIS expanded sites; Trace DSpace API item + bitstream download (Dickinson 1973); WebSearch "Middle Fork Obion trout" (no trout evidence); WebSearch TDEC 305(b)/303(d) forks (found 1990 305(b) + regional characterization snippets); eRegulations statewide limits + exceptions pages; Wikipedia Obion River.
Unproductive/exhausted: USGS NAS API v2 county endpoint (404 — API paths changed; lane abandoned); EPA ATTAINS API (requires api.data.gov key); EPA How's My Waterway API guesses (route does not exist); TDEC 305(b)/303(d) tn.gov page URL (404; segment-level 303(d) tables not retrieved); Bing HTML scrape (0 parseable results); DuckDuckGo HTML/lite (bot challenge); direct thesis viewcontent.cgi URL (web-firewall/404; succeeded via DSpace API); ATTAINS/NEPIS full-document fetch not completed.

## Recommendation
**warmwater-focus** (unchanged from ledger; confidence improved from limited).
Reasoning: (a) No trout stocking program has ever targeted the fork in any TWRA record surfaced (2026 schedule, current ArcGIS site universe, 2016 historical layer) — West TN trout stocking is confined to park ponds and Perry/Houston/Humphreys/Stewart spring creeks; (b) the only broad, method-documented survey of the system (Dickinson 1973: 183 collections, 100 verified species, heavy Middle Fork coverage incl. TG&F chemical collections) records zero Salmonidae; (c) GBIF and iNat contain zero trout records for the county bbox against strong warmwater coverage; (d) the habitat is channelized, agricultural-lowland warmwater (1990 305(b) impairment for channelization), and TWRA's only stream-specific rule is the warmwater crappie exception. Residual gap: no modern TWRA Region 1 stream-fish survey or TDEC fish-community (biorecon) dataset was located for the fork, so "warmwater-focus" rests on the 1973 survey plus programmatic absence rather than a current agency species list.
