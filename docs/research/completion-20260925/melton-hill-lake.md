# Melton Hill Lake (Melton Hill Reservoir, Clinch River) — Evidence Completion Log

- Ledger verdict at start: `warmwater-focus` (verify/strengthen); note flagged "the only regular muskie stocking in TN?" and "trout from Norris TW wash into Melton Hill — is there any trout FISHERY documented in the lake?"
- Research date: 2026-09-25 | Mode: internal classification research, read-only (no docs/ edits, no git writes, no parties contacted)

## Identity

- TVA impoundment of the Clinch River near Oak Ridge; Melton Hill Dam at 35.8852,-84.3003 (OSM Nominatim, retrieved 2026-09-25). ~5,690 surface acres; extends ~38–57 miles up the Clinch toward Clinton (Anderson/Roane/Loudon/Knox counties); TWRA "Where to Fish," East Tennessee Region 4.
- TWRA characterizes it as "a cool water reservoir with relatively low productivity" — cold Norris Dam releases suppress largemouth/bluegill productivity, but guarantee summer dissolved oxygen for smallmouth, striped bass, and musky.

## Sources

### S1. TWRA Melton Hill Reservoir "Where to Fish" page (committed capture + LIVE re-check)
- Title: "Melton Hill Reservoir in Tennessee | Bank and Boat Fishing Opportunities" | Org: TWRA (no byline)
- URL: https://www.tn.gov/twra/fishing/where-to-fish/east-tennessee-r4/melton-hill-reservoir.html
- Publication: undated agency page; capture in docs/research/2026-09-22-fishery-opportunities/captures/twra-fishery-melton-hill-lake.html; re-fetched LIVE 2026-09-25 (content matches capture).
- Fields: "What you can catch" = Black Bass (LMB/SMB/spotted, LMB most abundant), Striped Bass, Musky, Crappie — NO trout section. Regulations list: LMB 14-in MLL, SMB 18-in MLL, crappie 15/day 10-in, sauger 10/day, walleye 5/day 16-in, striped/hybrid 2/day with 32–42-in PLR, muskellunge 1/day 50-in MLL, paddlefish, sunfish. Striped bass: "not intentionally stocked but remain in the reservoir due to fish stocked into Norris Reservoir, making their way downstream"; former state record 63+ lb from Bull Run Steam Plant, Feb 1998. Musky: "Musky have been stocked by the TWRA since 1998"; "no natural reproduction has been documented"; "The current state record Musky came from Melton Hill Reservoir."
- WASHDOWN NUANCE (verbatim): the regulations list carries a generic trout line — "Trout: Seven (7) per day, no length limit" — but the page documents NO trout fishery, no trout stocking, and no trout species section for the lake itself. Presence ≠ fishery.
- Type: agency reservoir profile. Confidence: high.
- Establishes: warmwater/coolwater program identity (musky trophy program, striped bass, black bass, crappie, sauger/walleye) and the ABSENCE of any managed trout fishery in the lake.

### S2. 2026 TWRA trout stocking schedule JSON (616 rows, local snapshot `trout_2026_live.json` + live re-check)
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json ; retrieved 2026-09-25 (live fetch truncated mid-file; full 616-row local snapshot cross-checked).
- Fields: ZERO rows for Melton Hill (or Bull Run Creek trout rows) — no lake trout program in 2026. The Clinch corridor's only trout row is "Norris Tailwater / Clinch River," Anderson Co., TYPE "Tailwater," Rainbow + Brown, months M,A,M,J,J,A,S — a separate water (the clinch-river ledger row), upstream of Melton Hill at Norris Dam.
- TWRA ArcGIS TWRA_Trout_Stocking_Locations layer (services3.arcgis.com/PWXNAH2YKmZY7lBq, REST query, retrieved 2026-09-25): 0 features matching "MELTON"; the 4 "Norris" features are all StreamName "Norris Tailwater," WaterClass "stream," StockingProgram "Tailwater" (Massengill Bridge, Miller's Island, Peach Orchard access, Clear Creek) — no stocking site exists on Melton Hill.
- Type: planned schedule + agency site master. Confidence: high.
- Establishes: Melton Hill is not in the 2026 trout stocking program; the only trout water in its inflow is the Norris tailwater.

### S3. Trout washdown into the lake — third-party (LEAD, not a fishery)
- Title: "Fishing at Melton Hill Lake, Tennessee" | Org: uslakes.info (lake guide site, no author)
- URL: https://meltonhill.uslakes.info/fishing/ ; retrieved 2026-09-25 (undated page).
- Fields: "Trout fishing in the Norris tailwater is among the best in the state. Soon after the state record brown was caught in the Norris tailwater, one exceeding 27 lbs. was taken from the upper lake proper." Good trout fishing runs "from Norris Dam to Hines Creek." Lists brown/rainbow trout among lake species but frames trout as the Norris-tailwater fishery.
- GBIF occurrence check (api.gbif.org, retrieved 2026-09-25): bounding box 35.88–36.12 N, 84.40–84.18 W (Clinton reach through Melton Hill Dam) = 0 records for Oncorhynchus mykiss, Salmo trutta, Salvelinus fontinalis. The trout-occupied corridor (95 Salmo trutta / 9 O. mykiss records in the Norris box) clusters at 36.21–36.22, -84.07/-84.09 — at Norris Dam (36.2243,-84.0919 per Nominatim), i.e., the tailwater, NOT Melton Hill.
- Type: undated third-party guide + occurrence database. Confidence: low-medium (washdown into the upper lake is documented by a single 27-lb-brown anecdote; no trout records georeferenced in the lake box).
- Establishes: occasional washdown capture from the tailwater (presence) — does NOT establish a lake trout fishery.

### S4. Dated warmwater source #1 — musky fishery (2024/2025, guide industry)
- "Tennessee Musky Stocking" | Org: tnmusky.com (Tennessee Musky guide service) | Published Feb 17, 2024; https://www.tnmusky.com/post/tennessee-musky-stocking ; retrieved 2026-09-25.
- Fields: "The TWRA stocks muskies in Melton Hill every year." State record musky "43 pounds, 14 ounces, caught in 2017" (Melton Hill). ALSO documents musky stockings elsewhere: Great Falls (since 1976; stocking ended after natural reproduction confirmed) and Parksville Lake (since 2017, ~600 fish/yr).
- "Melton Hill Musky Fishing: Top Q&A for 2025" | Author: Steven Paul (musky guide) | Org: tennesseemuskyfishing.com | Published Mar 5, 2025 (updated Mar 17, 2025); https://www.tennesseemuskyfishing.com/post/melton-hill-musky-fishing-q-a-2025 ; retrieved 2026-09-25.
- Fields: natural reproduction "isn't confirmed" officially — "TWRA biologists base this on data, not anecdotal reports"; 50-inch harvest floor "ensures it remains a trophy-class fishery."
- Type: dated specialist-guides. Confidence: medium (consistent with S1 agency language).
- Establishes: an actively stocked, trophy-managed musky program — and ANSWERS the ledger note: Melton Hill is TN's premier REGULAR musky-stocking water, but not literally the only one (Great Falls historic; Parksville since 2017; TWRA/USFS river stockings per TWRA social media).

### S5. Dated warmwater source #2 — striped bass records/fishery
- "Tennessee's Two Best Striper Fisheries" | Org: Game & Fish (gameandfishmag.com) | Published Oct 4, 2010; https://www.gameandfishmag.com/editorial/fishing_stripers-hybrids-fishing_tn_aa054902a/191744 ; retrieved 2026-09-25.
- Fields: "In 1998, Knoxville resident Willis Marsh pulled a then-state-record 63.12-pound rockfish from Melton Hill Lake"; "in 1988, Gary Helms set a former world record for landlocked stripers, 60 pounds, while fishing at the Bull Run Steam Plant"; winter steam-plant warm-discharge fishery described by guides. (Its "five stripers per acre" stocking line describes TN striper fisheries generally; for Melton Hill specifically TWRA says stripers are NOT stocked there — they wash down from Norris, S1.)
- Corroboration: BestFishingInAmerica TN striper profile (https://www.bestfishinginamerica.com/tennessee-striper-fishing.html, retrieved 2026-09-25, undated): Melton Hill "has produced former state record stripers over 60 pounds"; Bull Run discharge draws big stripers in cold months.
- Type: dated outdoor media. Confidence: high (matches S1 agency record reference).
- Establishes: nationally notable striped-bass fishery sustained by Norris-stocking washdown + thermal refuge.

## Contradictions
- C1: Ledger hint "only regular muskie stocking in TN?" — contradicted: tnmusky (2024) documents Great Falls (1976–) and Parksville (2017–, ~600/yr) stockings plus TWRA/USFS river stockings. Melton Hill remains the flagship continuous program; classify as "premier/primary," not "only."
- C2: Generic "Trout: Seven (7) per day" regulation line on the TWRA page vs. no trout species section, no trout stocking row, no GBIF trout records in the lake box. Resolved as: statewide-default regs language; presence ≠ fishery.

## Searches run (7)
1. WebSearch: TWRA muskie stocking program Melton Hill Clinch River Tennessee muskellunge (hit: TWRA page, tnmusky, tennesseemuskyfishing)
2. WebSearch: Melton Hill state record musky 50 inch Tennessee record muskellunge (rate-limited; record details recovered via S4/S5)
3. WebSearch: Melton Hill Lake striped bass record Bull Run steam plant news (rate-limited; recovered via DDG + Game & Fish)
4. DDG: "Melton Hill" lake trout fishing Clinch River stocked washdown / "Melton Hill Reservoir trout fishing" (hit: uslakes 27-lb brown, whackingfatties auto-report)
5. DDG: Melton Hill Lake striped bass state record Bull Run (hit: Game & Fish 2010, lasr.net, exploreoakridge)
6. DDG: Melton Hill musky fishing 2025 news Tennessee (hit: tennesseemuskyfishing Q&A 2025, tnmusky fall article)
7. Direct fetches: live TWRA page; uslakes fishing page; Game & Fish article; GBIF API box queries; ArcGIS REST.

## Recommendation
CONFIRM `warmwater-focus` for Melton Hill Lake, confidence high. Agency profile documents a musky (stocked since 1998, 50-in trophy floor, 2017 state record 43-14), striped bass (washdown from Norris; 63-lb former state record), black bass, crappie, sauger/walleye fishery with NO trout component; the 2026 trout schedule and TWRA GIS contain no trout row/site for the lake. Washdown note: a generic statewide trout regulation line and a single 27-lb-brown upper-lake anecdote show occasional tailwater-origin trout — presence, not a fishery; keep the clinch-river (Norris Tailwater) row strictly separate.
