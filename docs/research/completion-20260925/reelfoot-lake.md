# Reelfoot Lake (Lake/Obion counties, TN) — Evidence Completion Log

- Ledger verdict at start: `warmwater-focus` (verify/strengthen)
- Research date: 2026-09-25 | Mode: internal classification research, read-only
- Note: no prior capture `twra-fishery-reelfoot-lake.html` exists in docs/research/2026-09-22-fishery-opportunities/captures/ (directory not present in project); TWRA page fetched live instead.

## Identity

- Tennessee's largest NATURAL lake (10,427 acres), formed by the 1811-12 New Madrid earthquakes; Lake + Obion counties TN (plus Fulton Co., KY); ~68% is 3 ft deep or less; four basins linked by boat ditches; cypress-stump shallow lake managed by TWRA with USFWS overlap. TWRA "Where to Fish," West Tennessee Region 1.
- Famous crappie/bluegill/catfish lake with a living COMMERCIAL fishery (the one TN water where commercial harvest persists, under TWRA contract).

## Sources

### S1. TWRA Reelfoot Lake "Where to Fish" page (LIVE)
- Title: Reelfoot Lake | Org: TWRA
- URL: https://www.tn.gov/twra/fishing/where-to-fish/west-tennessee-r1/reelfoot-lake.html
- Publication: undated agency page; retrieved 2026-09-25
- Fields: Crappie (white + black) "premier fishery," white crappie most harvested, 10-yr harvest avg >3/4 lb; 10-in min, creel listed 20/day combined (body text elsewhere 30). Bluegill "among the state's best," ~0.45 lb avg over ten years, peak full moons May-July; trolling-motor-only spawning zones (Rat Island Shore, Eagle Nest Timber, Air Park). Largemouth (low density, 15-in min since 1996). Channel catfish historically >400 lb/acre estimate, trotline/jug fishery, no creel limit under 34 in. Also yellow bass, spotted bass, paddlefish season Apr 24-May 31, redear. Preservation Permit required. TROUT: no mention anywhere (species list, regs, tips).
- Type: agency lake profile. Confidence: high.
- Establishes: warmwater identity (crappie/bluegill/catfish + commercial-era trotline fishery) and trout ABSENCE from the agency's full fishery description.

### S2. 2026 TWRA trout stocking schedule JSON (616 rows, LIVE capture on file)
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json ; retrieved 2026-09-25 (local capture trout_2026_live.json in this directory)
- Fields: only "Reelfoot" matches are 2 rows for "Union City Reelfoot Packing Site" (Obion Co.), TYPE Winter, rainbow trout, 1/14/2026 + TBD 12/2026 — an upland CITY pond at a former packing plant in Union City ~30 mi from the lake, NOT Reelfoot Lake (fully documented in sibling log union-city-reelfoot-pond.md, incl. ArcGIS pin 36.41471,-89.06252, WaterClass=pond, Management=City). Zero rows for Reelfoot Lake itself.
- Type: planned schedule. Confidence: high.
- Establishes: the lake is not part of the 2026 trout stocking program; the same-name winter pond must stay distinct in the ledger.

### S3. Dated warmwater source #1 — national destination profile (Jan 8, 2026)
- "FISHING TOWNS: Legendary Reelfoot Lake offers the crappie and bluegill experience of a lifetime," Major League Fishing (Bass Pro Tour / Bill Dance Signature Lakes series), Jan 8, 2026; by Mitchell Forde (uncredited on archived copy). Archived: https://web.archive.org/web/20260208080816/https://majorleaguefishing.com/bass-pro-tour/fishing-towns-legendary-reelfoot-lake-offers-the-crappie-and-bluegill-experience-of-a-lifetime/
- Fields: "15,000-acre gem of a panfish fishery" near Hornbeak (Obion Co.); "the mother lode" for crappie and bluegill; Bill Dance: "the crappie or bluegill experience of a lifetime." Catfish referenced as part of the lake's reputation.
- Type: dated national fishing-media profile. Confidence: high.
- Establishes: 2026-dated recognition of Reelfoot as a warmwater panfish destination; zero trout content.

### S4. Dated warmwater source #2 — commercial fishery regulation action (Feb 2025)
- Tennessee Fish and Wildlife Commission February 2025 meeting (reported by Smith County Insider, Feb 24, 2025): Reelfoot Lake commercial net rule changed for the 2025-26 season — six 7-in-mesh + six 6-in-mesh nets per fisherman, transitioning to all 7-in mesh; Reelfoot is the sole TN water with contract commercial fishing (TN Admin Register framework, Dec 2000: commercial harvest prohibited statewide "except from Reelfoot Lake under contract with TWRA"). Context via Paris Post-Intelligencer (parispi.net), Jan 17, 2025 TFWC preview.
- Type: dated commission/news coverage of an active commercial fishery. Confidence: medium-high (meeting coverage, not fetched full-text for mesh table).
- Establishes: the commercial (catfish/rough-fish) fishery history and present — a uniquely warmwater institution; no trout component possible under net-mesh regs.

## Contradictions
- None. Only ledger nuance: the winter-trout "Union City Reelfoot Packing Site" pond shares the Reelfoot name but is a separate Obion County city pond.

## Searches run (6)
1. TWRA Reelfoot Lake fishing crappie bluegill catfish tn.gov where to fish
2. Reelfoot Lake crappie fishing news 2025 TWRA fishery bluegill catfish
3. majorleaguefishing.com Reelfoot Lake Tennessee crappie destination how to fish (+ Wayback CDX url=*reelfoot* on majorleaguefishing.com)
4. Reelfoot Lake commercial fishery history TWRA catfish gill nets
5. Tennessee Fish and Wildlife Commission 2025 Reelfoot Lake commercial fishing nets crappie regulations news
6. DuckDuckGo HTML mirror retry for MLF slug (rate-limited; resolved via CDX)

## Recommendation
CONFIRM `warmwater-focus` for Reelfoot Lake, confidence high. Agency profile + 2026-dated national coverage document a crappie/bluegill/catfish (and contract commercial) warmwater fishery; zero trout rows in the 2026 schedule for the lake and zero trout content in any source. Keep the Union City Reelfoot Packing Site pond as its own row.
