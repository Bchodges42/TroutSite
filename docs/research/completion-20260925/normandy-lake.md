# Normandy Lake (Normandy Reservoir), Coffee/Bedford County, TN — Evidence Log

Water: TVA Normandy Reservoir impounding the Duck River (dam at Bedford Co.; most of lake Coffee Co.)
Ledger verdict under test: `warmwater-focus` — goal: verify/strengthen with dated sources
Retrieval date for all sources: 2026-09-25

## Verdict summary

- **Warmwater CONFIRMED.** TWRA's own reservoir page lists only warmwater species (black bass, crappie, catfish, white bass, walleye, sunfish) and management actions (annual blacknose black crappie + walleye fingerling stockings from Normandy Hatchery); no trout fishery or trout stocking is mentioned. Trout context belongs entirely to the sibling tailwater reach below the dam (see duck-river-tailwater.md).

## Per-source findings

### S1. TWRA "where to fish" — Normandy Reservoir page
- Org: TWRA; live page retrieved 2026-09-25 (undated, current web copy)
- URL: https://www.tn.gov/twra/fishing/where-to-fish/middle-tennessee-r2/normandy-reservoir.html
- Fields: 3,048-acre impoundment, south-central TN, mostly Coffee County; TVA-owned/operated, dam completed 1976; full pool 875 ft MSL, winter pool 864 ft
- Species/regs verbatim: Black Bass 5/day combination; Largemouth 15-in min; Smallmouth 18-in min; Spotted no limit; Crappie (all species) 15/day, 10-in min; Catfish no creel limit ≤34 in, one >34 in/day; White Bass 15/day; Walleye 5/day, 16-in min; Rock Bass 20/day; Redear 20/day; Bluegill/Warmouth no limits
- Management: 35 TWRA fish attractor sites (GPS downloadable); "Normandy Hatchery stocks Blacknose Black Crappie fingerlings annually"; walleye fingerlings stocked annually (~16 in by age 1); effort shares: black bass ~60%, crappie ~25%, walleye and catfish ~5% each
- Trout: none mentioned. Type: agency narrative + management. Confidence: HIGH.
- Establishes: warmwater species suite, annual warmwater stocking program (crappie/walleye), walleye-specific 16-in rule. Does NOT establish: any trout component.

### S2. TWRA ArcGIS services directory (context)
- Org: TWRA (services3.arcgis.com org PWXNAH2YKmZY7lBq); retrieved 2026-09-25
- URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services?f=json
- Relevance: TWRA trout layers (Tailwater_Trout, TWRA_Trout_Stocking_Locations) contain NO Normandy Lake/reservoir rows — the only Duck/Normandy trout entries are the tailwater access sites below the dam (StockingProgram "Tailwater", WaterClass "stream"). Lake Graham etc. are separate impoundments.
- Type: negative/structural evidence. Confidence: HIGH.
- Establishes: no lake trout stocking location exists in TWRA's trout location service.

### S3. Bettoli creel survey, Normandy Dam tailwater (TWRA Fisheries Report 01-43, Sept 2001)
- URL: https://duckriveragency.org/_assets_/plugins/Annotated%20Bibliography/NormandyTW2000CreelSurvey.pdf (text via r.jina.ai reader)
- Lake-relevant finding: the tailwater creel recorded 609 non-trout fish vs 312 trout, bluegill-dominated; Bettoli urged TWRA not to ignore the warmwater fishery. Confirms the same reach that holds winter trout is warmwater-dominated, and by extension the reservoir above is a warmwater system.
- Type: agency research (dated 2000/2001). Confidence: HIGH (aged but structural).

### S4. Secondary angler references (leads only, not establishment)
- aa-fishing.com "Normandy Lake, TN": largemouth/smallmouth/spotted bass, channel+flathead catfish, black+white crappie, walleye (retrieved 2026-09-25 via search; https://www.aa-fishing.com). Confidence: LOW-MEDIUM (commercial site).
- Omnia Fishing "How to Fish Normandy Lake" (Aug 17, 2026): season-by-season warmwater patterns, "duck river portion" headwaters. URL: https://www.omniafishing.com. Confidence: LOW.
- Both list zero trout for the lake proper; one garbled search snippet ("trout on Normandy Lake in spring") conflates the tailwater — noted as a known conflation risk.

### S5. TVA dam facts (as relayed via TWRA page S1 + multiple search snippets)
- Dam completed 1976 by TVA on the Duck River; non-power dam (flood control/water supply/recreation; no hydropower turbines — corroborated verbatim by the TWRA StoryMap, see tailwater log). TVA's own lake page (tva.com/environment/lake-management/normandy) was not directly retrievable (403/404; archive.org rate-limited 2026-09-25) — TVA acreage claims in search summaries (e.g., "17,000 acres") are unreliable; use TWRA's 3,048 acres.
- Type: background. Confidence: MEDIUM-HIGH (via TWRA page).

## Contradictions and notes
1. No source contradicts `warmwater-focus`. The only trout association is the downstream tailwater reach (a separate water in the ledger).
2. Lake size varies by source (TWRA 3,048 ac; search summaries 3,124 ac); county attribution differs (TWRA "mostly Coffee"; dam at Bedford line) — cosmetic, not verdict-relevant.
3. "Walleye sustained by stocking" claims are consistent across TWRA page and search summaries; no dated walleye stocking report was opened (gap).

## Searches run (5 distinct, lake)
1. Normandy Lake Tennessee TWRA fishing bass crappie walleye reservoir
2. Normandy Reservoir Tennessee TWRA fish report largemouth crappie walleye stocking
3. "Normandy Reservoir" OR "Normandy Lake" Tennessee TVA dam 1976 warmwater fishery walleye
4. Normandy Reservoir TWRA blacknose crappie walleye stocking hatchery annual
5. "Normandy Reservoir" TVA Duck River 1976 acres shoreline flood control non-power
(Plus direct open of the TWRA Normandy Reservoir where-to-fish page and the ArcGIS services directory.)

## Recommendation
- Keep `warmwater-focus` for Normandy Lake. Now anchored to the dated, current TWRA reservoir page (species list + annual crappie/walleye stocking + no trout mention) and the negative result in TWRA's trout location services. Any trout rows on this water in the ledger should be re-pointed to the sibling tailwater entry.
