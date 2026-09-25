# Loosahatchie River — West TN (Fayette/Tipton/Shelby; much of channel officially "Loosahatchie River Canal") — trout evidence research log

Water: Loosahatchie River, HUC8 08010209 (TDEC 2026 303(d) workbook sheet name "08010209 (Loosahatchie)"). Rises western Hardeman County; W through Fayette and Shelby Counties; mouth at Mississippi River N of Frayser (Loosahatchie Bar). Mainstem assessment units named "Loosahatchie River" throughout; the mapped lower/channelized watercourse is also carried by FEMA as "Loosahatchie River Drainage Canal" and by TDEC as monitoring site name "Loosahatchie River Canal."
Research date: 2026-09-24 (all retrievals this date unless noted). Internal classification research ONLY.
Ledger state under test: "limited / warmwater-focus" (TWRA West TN crappie rule documents a managed fishery). No trout survey/release/observation on file.

Questions: (1) any trout stocking/occurrence ever? (2) fish surveys/species lists with no Salmonidae? (3) dated warmwater documentation beyond the crappie rule? (4) canalization extent / reach definition.

---

## SOURCES

### S1. USGS Nonindigenous Aquatic Species (NAS) database, API v2 occurrence export, Tennessee
- Org: USGS (nas.er.usgs.gov). Retrieval 2026-09-24: https://nas.er.usgs.gov/api/v2/occurrence/search?state=TN (3,158 TN records; filtered locally by county).
- Coverage proof: 74 records in the three boundary counties Shelby/Fayette/Tipton, 1972–2026, mixed specimen/literature/agency types, including FISH families Cyprinidae (51), Catostomidae (1), Channidae (1), Cichlidae (1) — i.e., the watershed has been repeatedly fished/sampled for the NAS record. Family breakdown otherwise: invasive plants, nutria, zebra mussel, corbicula, etc.
- SALMONIDAE: ZERO records in Shelby, Fayette, or Tipton counties (TN-wide salmonid records, 783, are all Middle/East TN — consistent with mississippi-river.md S1).
- LOOSAHATCHIE-SPECIFIC fish records (all "Literature," underlying source "Tennessee Wildlife Resources Agency Fish Data via MARIS" / BISON, ref keys 26400/26408 — i.e., TWRA fish collection data ON the Loosahatchie):
  - Cyprinus carpio (common carp), Shelby, 1999, established — locality "Loosahatchie River" (2 records).
  - Ctenopharyngodon idella (grass carp), Shelby, 1999, status "stocked" — locality "Loosahatchie River" (biocontrol stocking, not trout).
  - Hypophthalmichthys molitrix (silver carp), Shelby, 2006 (1) and 2008 (2), unknown — locality "Loosahatchie River."
- Method: agency collections/database. Type: dataset (curated literature + specimens). Confidence: high (negative for Salmonidae; positive dated warmwater/invasive occurrences 1999–2008 on the named water).
- Establishes: TWRA-collected fish on the Loosahatchie 1999–2008 with no salmonid; does NOT establish absence (non-detection ≠ literal absence).

### S2. GBIF + iNaturalist — Salmonidae over the Loosahatchie corridor
- GBIF retrieval 2026-09-24: https://api.gbif.org/v1/occurrence/search?taxonKey=8615&decimalLatitude=34.9,35.5&decimalLongitude=-90.3,-89.3&limit=50 (taxonKey 8615 = Salmonidae; bbox spans the whole corridor incl. Fayette/Tipton/Shelby). Result: count = 0.
- iNaturalist retrieval 2026-09-24: https://api.inaturalist.org/v1/observations?taxon_id=47520&nelat=35.5&nelng=-89.3&swlat=34.9&swlng=-90.3 (47520 = Salmonidae). Total 2, both CASUAL, both "Bass Pro Dr, Memphis, TN" (Bass Pro Shops at the Pyramid aquarium exhibits, ~35.1554, -90.0521): obs 380800279 (2026-07-10) and obs 345801632 (2026-03-28). Neither is on the Loosahatchie; same mechanism documented in mississippi-river.md S3.
- Type: aggregator/community datasets. Confidence: high. Establishes: no georeferenced trout on or near the Loosahatchie in community/aggregator data.

### S3. TWRA 2026 trout stocking schedule (JSON endpoint, server-side fetch)
- Source: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json (tn.gov blocks plain curl; retrieved 2026-09-24 via server-side fetch of the rendered table).
- West TN rows (all winter put-and-take RAINBOW TROUT, pond class): Shelby Co — Cameron Brown Lake (Germantown, 1/13/2026), Edmund-Orgill Park (1/13/2026), Johnson Park Lake (1/15/2026), Shelby Farms (1/13/2026), Yale Road Park (1/15/2026); Tipton Co — Covington First Baptist Church Pond (NEW, 1/15/2026), Valentine Park (1/15/2026); Obion — Union City Reelfoot Packing Site; Weakley — Martin City Pond; Madison — Lake Graham. Fayette, Lauderdale, Dyer, Haywood: no rows.
- LOOSAHATCHIE: no row anywhere in the schedule; Nonconnah: none (verified for both waters in one pass).
- Type: agency schedule (scheduled ≠ completed ≠ holdover). Confidence: high. Establishes: zero trout stocking on the Loosahatchie ever scheduled in 2026; all West TN trout are city-park ponds.

### S4. TWRA ArcGIS stocking layers (current + 2016 historical)
- Retrieval 2026-09-24: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0/query (where=1=1, 730 features) and .../StockedTrout2016/FeatureServer/0/query (796 features).
- Fields: Site_Name, StreamName, Region, County, City, StockingProgram, WaterClass, Species, NumStocked, Management.
- West TN features (11 current): Munford City Park Pond (Tipton, 2,000 rainbow); Cameron Brown Park Lake (Shelby, 2,500); Yale Road Park Lake (Shelby, 1,000); WC Johnson Park Lake (Shelby, 2,000); Edmund-Orgill Park Pond (Shelby, 2,000); Shelby Farms Lake (Shelby, 2,000); Davies Plantation Park Lake (Shelby, 1,000); First Baptist Church Covington Pond (Tipton) — ALL Winter/pond/rainbow. 2016 historical layer: same pond set, no river/canal sites.
- No feature named or located on the Loosahatchie River / Canal in either layer. No brown trout anywhere in the West TN set (species = rainbow only).
- Type: agency GIS layers (current + historical snapshot). Confidence: high. Establishes: decade-scale (2016→2026) continuity of "West TN trout = park ponds only"; nothing ever on the canal.

### S5. TWRA trout regulations (2026-27, eRegulations page full-text scan)
- Source: https://www.eregulations.com/tennessee/fishing/trout-regulations (retrieved 2026-09-24; page text scraped and keyword-scanned). Hits: Loosahatchie 0, Nonconnah 0, Shelby 0, Tipton 0, Fayette 0.
- Establishes: no managed/regulated trout water on the Loosahatchie or anywhere in its counties.

### S6. TWRA warmwater regulation block — crappie rule (re-verified, dated 2026-27)
- Source: https://www.eregulations.com/tennessee/fishing/exceptions-to-statewide-regulations (retrieved 2026-09-24).
- Quoted block: "Forked Deer, Hatchie, Loosahatchie, Obion and Wolf Rivers (includes tributaries)" — "Crappie: 30 per day, no length limit." Trout not mentioned anywhere in the block.
- Interpretation: a dedicated, named, grouped regulation for exactly this river = the fishery is defined and managed as WARMWATER (crappie). Regulatory block ≠ presence proof by itself, but combined with S1/S8 it is the management-side documentation of a crappie fishery. (Note: a Facebook-circulated summary citing "crappie 50/day" for the Hatchie/Loosahatchie group is an older version; current text is 30/day.)
- Type: regulation (official), current season. Confidence: high. Establishes: managed-warmwater documentation (ledger anchor re-verified with exact quote).

### S7. TDEC 2026 Final 303(d) List — HUC8 08010209 sheet (fish-tissue collections = documented fish occurrence mechanism)
- Source: https://www.tn.gov/content/dam/tn/environment/water/watershed-planning/wr_wq_303d-2026-final.xlsx (retrieved 2026-09-24; workbook parsed locally; sheet "08010209 (Loosahatchie)", 178 rows).
- Loosahatchie River mainstem assessment units (all RIVER, impaired, 2026):
  - TN08010209001_1000, Shelby, 7.8 mi — nutrients; PHYSICAL SUBSTRATE HABITAT ALTERATIONS (CHANNELIZATION); sedimentation/siltation (CHANNELIZATION); E. coli; CHLORDANE, MERCURY, DIOXIN, ENDRIN, DIELDRIN, PCBs IN FISH TISSUE.
  - TN08010209002_1000, Shelby, 10.3 mi — sediment (channelization/development), habitat (channelization), nutrients, PCBs/dioxin/mercury/chlordane in fish tissue, E. coli.
  - TN08010209002_2000, Shelby, 8.2 mi — habitat/sediment (channelization), nutrients (PSD/urban/crop), E. coli.
  - TN08010209004_1000, Fayette/Shelby, 10 mi — sediment, habitat (channelization), LEAD, E. coli.
  - TN08010209007_1000, Fayette, 9.6 mi — habitat (channelization), E. coli.
  - TN08010209011_1000, Fayette, 5.8 mi — habitat (channelization).
  - TN08010209011_2000, Fayette/Hardeman, 14.1 mi — habitat (channelization), E. coli.
  - Mainstem impaired total ≈ 65.8 mi. Tributaries similarly channelization-cause-dominated (Todd Creek, Oliver Creek, Buckhead Creek, Hall Creek, Cypress Creek, Black Ankle Creek, Beaver Creek system, N Fork Creek, etc.).
- Interpretation: (a) CHANNELIZATION appears as an impairment SOURCE on essentially every mainstem AU = agency-confirmed canalized reach; (b) "…IN FISH TISSUE" causes mean TDEC collected fish on the Loosahatchie for contaminant tissue analysis (legacy chlordane/PCB agricultural/urban sediment signature) — documented fish occurrence, warmwater program, no salmonid ever reported; (c) Listing Clarification sheet: TDEC and City of Memphis MS4 chemical monitoring of this Loosahatchie segment 2002–2018 detected recurring chronic lead violations.
- No trout parameter, trout advisory, or coldwater listing anywhere.
- Type: official state assessment list (dated 2026 cycle). Confidence: high. Establishes: agency fish-collection documentation (fish tissue), urban/agricultural impairment profile, channelization confirmation; does NOT document trout.

### S8. Reach definition / canalization extent
- Wikipedia, "Loosahatchie River" (retrieved 2026-09-24, https://en.wikipedia.org/wiki/Loosahatchie_River): 64 mi (103 km) stream; rises western Hardeman County; W through Fayette (crossed by I-40 at Somerville — "the only unchannelized stretch of its midcourse"); mouth just N of Frayser at the Mississippi; "Nearly the entire river and its major tributaries have been channelized for agriculture, except near the head, the mouth, and a midcourse segment." Official name "Loosahatchie River"; no fish/fishing/trout content.
- FEMA flood insurance mapping for Shelby County references the "Loosahatchie River Drainage Canal" (FIRM panels 67P–69P per search-result summaries of shelbycountytn.gov/FEMA materials; panels not independently opened 2026-09-24).
- USDA SCS P.L.-566 program: "Wolf and Loosahatchie River Basins, Tenn." watershed-plan environmental statements (Federal Register notice, Feb 4, 1983, located via search of govinfo index; full FR text not opened). A 1973 Tennessee public act created a regional watershed authority for the Wolf and Loosahatchie Rivers (TCA Title 64 regional authorities; located via search).
- USACE Memphis District "Mississippi River Hatchie/Loosahatchie, MS River Mile 775–736, Tennessee and Arkansas, Ecosystem Restoration Feasibility Study": FR NOI 2022-11-04 (https://www.federalregister.gov/documents/2022/11/04/2022-24019/), withdrawn FR 2023-01-25 (https://www.federalregister.gov/documents/2023/01/25/2023-01456/). This anchors the mouth reach: the Loosahatchie confluence area defines the downstream end (RM ~736) of a mainline Mississippi side-channel restoration study.
- TDEC 303(d) 2026 CHANNELIZATION impairment-source rows (S7) = agency confirmation of canalized condition across the mainstem.
- Net reach statement: engineered drainage channel through essentially the whole Shelby County reach (carried as "Loosahatchie River Drainage Canal"/"Loosahatchie River Canal" in FEMA/TDEC naming); natural remnants near the Hardeman headwaters, a midcourse segment near the I-40/Somerville crossing, and the mouth vicinity.

### S9. Angling-platform community species lists (warmwater; no trout)
- Fishbrain, "Loosahatchie River Canal" water page (surfaced 2026-09-24 via search summary; page itself app-gated): top reported species "Largemouth bass, White crappie, Bluegill"; main page variant adds "channel catfish, largemouth bass, black crappie."
- PiscaMaps, "Loosahatchie River Canal, TN" (search summary 2026-09-24): "smallmouth bass, largemouth bass, spotted bass, walleye, black crappie, white crappie, bluegill, channel catfish, common carp" — species list partially gated; the smallmouth/walleye entries are suspect for a coastal-plain drainage canal (likely app boilerplate/misID; treat as weak).
- OnWater, "Loosahatchie River Drainage Canal" (search summary 2026-09-24): "bluegill sunfish, common carp, flathead catfish, green sunfish, sauger, shortnose gar, spotted bass."
- Cross-check: community lists are uniformly warmwater; NONE lists trout of any species.
- Type: community-app aggregations. Confidence: low-medium individually; corroborative in aggregate.

### S10. WQP / TDECWR_WQX biological monitoring
- EPA Water Quality Data Portal shows a TDECWR_WQX monitoring site at the "Loosahatchie River Canal" (Shelby Co) with biological counts and water chemistry 2012–2013 (surfaced in search results 2026-09-24). Direct WQP API retrieval failed (HTTP 406 non-browser agent; consistent with prior passes). Per prior verified passes, TDEC "Biological" data in WQP for these West TN waters are BENTHIC macroinvertebrate assemblages, not fish.
- Type: agency monitoring metadata (snippet-level verification only this pass). Confidence: medium. Establishes: TDEC biological monitoring activity on the canal 2012–2013; species list not obtained.

---

## Searches run (Loosahatchie)
Productive: TWRA 2026 stocking JSON (server-side fetch); TWRA ArcGIS Trout_Stocking_Locations + StockedTrout2016 queries; TWRA trout-regulations page full-text scan; eregulations exceptions page (crappie block quote); USGS NAS TN API export (county cut + Loosahatchie records + references); GBIF Salmonidae corridor bbox; iNaturalist Salmonidae corridor bbox; TDEC 2026 303(d) XLSX full parse (HUC8 08010209 sheet + clarifications); Federal Register API (Loosahatchie: 9 docs — Hatchie-Loosahatchie USACE NOI/withdrawal 2022-2023, FEMA BFE determinations 2011/2013, Millington DEIS 2006); Wikipedia reach page.
Unproductive/blocked: WQP data API (406 non-browser, both direct variants and IPv4); USGS NHD nationalmap services (name query timeout/parse fail, 2 attempts); Bing scraping (bot-served irrelevant results); DuckDuckGo HTML/lite (CAPTCHA / empty); Mojeek (empty); Ecosia (firewall page); Brave (bot-walled); WebSearch rate-limit 429s on most queries (partial results recovered on retries); WebFetch of fishbrain.com water-page URL guess (404 — Fishbrain water pages need exact slug+id).
Also noted, not independently opened: TN Dept of Health posted-streams page (Loosahatchie fish-consumption advisories, corroborated by S7 fish-tissue rows); USGS Quinones 1989 / Dolton 1990 flood studies (Dec 25, 1987 flood on the Loosahatchie — hydrology only).

## Recommendation
**warmwater-focus** (ledger position confirmed; drop "limited" qualifier weight toward "no trout evidence at all").
Reasoning: four independent agency lanes (2026 stocking schedule JSON, 2016+2026 ArcGIS stocking layers, 2026-27 trout regulations full-text scan, USGS NAS 3-county export) contain ZERO Loosahatchie trout records; TWRA fish collections on the river 1999–2008 (via MARIS) recorded invasive cyprinids only; TDEC fish-tissue monitoring documents fish collection programs on the water with no salmonid; the only corridor trout in GBIF/iNat are Bass Pro Pyramid aquarium exhibit fish with Memphis geotags. Warmwater documentation is now stronger than the ledger's crappie-rule anchor alone: named crappie regulation block (30/day, 2026-27), TWRA agency fish records 1999–2008, fish-tissue impairment rows, and three community-app species lists all warmwater. No credible pathway (stocking, escapement, holdover) exists for trout in a canalized, warm, turbid, E. coli/contaminant-impaired coastal-plain channel. Non-detection caveat applies, but the weighted negative is method-backed across agencies.
