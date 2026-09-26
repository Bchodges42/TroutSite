# BUFFALO RIVER (the Middle/West TN State Scenic River — Lawrence / Lewis / Wayne / Perry / Humphreys counties; Duck River tributary) — warmwater evidence log

Ledger water: `warmwater-focus` ("the state scenic river with free-flowing smallmouth/panfish"). Identity discipline: this is the 125-mile Buffalo River, longest unimpounded river in Middle Tennessee. NOT Grainger Co. Buffalo Creek (sibling, trout-stocked) and NOT the stocked "Little Buffalo River" (Lawrence Co.). **Ledger geography correction below — the ledger's "Tennessee River tributary through Wayne/Lawrence/Hardin/McNairy" is wrong on both counts.** All retrievals: 2026-09-25. Research only.

## A. Identity correction (high-confidence, multi-source)

1. **Wikipedia "Buffalo River (Tennessee)"** (full article fetched 2026-09-25, `wiki_buffalo_raw.txt`): infobox — source "Confluence of North and South Forks in **northern Lawrence County**" (35.3891, −87.2912); mouth "confluence with the **Duck River in Humphreys County**" (35.9956, −87.8392); progression "Lawrence / Lewis / Wayne / Perry / Humphreys"; length **125 miles**; basin 763 sq mi; USGS gauge 03604000 (Flat Woods); river system Tennessee River basin **via the Duck**. Summary: "longest unimpounded river in Middle Tennessee... The Buffalo is the **largest tributary of the Duck River**."
2. **TDEC Tennessee State Scenic Rivers GIS layer** (services5.arcgis.com/bPacKTm9cauMXVfn, queried 2026-09-25, cached `scenic_all.json`): "Buffalo Scenic River" — **Class II Pastoral River Area, 15.7 GIS miles, "The entire river, except that portion which lies within Wayne, Perry, Humphreys and Lewis counties"** (i.e., the designated segment is the Lawrence County headwater portion; the non-designated counties are Wayne/Perry/Humphreys/Lewis). PAGE field points to the (currently 404) na-sr-buffalo page; TDEC system page: tn.gov/environment/natural-areas/tn-scenic-rivers.html ("more than 850 miles of 24 rivers"; data updated Jan/Jul).
3. **TWRA "AllAccessSites"/"Fishing_Sites"/"Paddling_Access_Sites" layers** (services3.arcgis.com/PWXNAH2YKmZY7lBq, queried 2026-09-25): Buffalo River sites in **LEWIS** Co. (Metal Ford, NPS/Natchez Trace Parkway fishing site), **PERRY** Co. (HWY 412 at Buffalo River — TDOT/TWRA/"Park and Float" fishing site; SR 13 canoe launch — TWRA-managed paddling access). Counties match the Duck-tributary Buffalo; **no Hardin or McNairy County Buffalo River sites exist in TWRA's access data**.
4. **Middle Tennessee Fly Fishers river guide** (middletennesseeflyfishers.org/buffalo-river.html, fetched 2026-09-25, cached `mtff_buffalo.html`; page carries the club's 2026 outing calendar): "The Buffalo River is the longest un-impounded river in middle Tennessee and the **longest tributary of the Duck River**. It meanders 125 miles... nearly 85 species of fish... Personal craft can be launched from the TWRA access point along the river below the headwaters in Henryville [Lawrence Co.]... Species: Bream, Catfish, **Small Mouth Bass**... Small Mouth: April/May best."
5. **Correct ledger label**: "Buffalo River (Lawrence/Lewis/Wayne/Perry/Humphreys; Duck River tributary; TN State Scenic River)". "Tennessee River tributary" is true only in the ancestral sense (Duck → Tennessee); **Hardin and McNairy counties should be removed**. NOT the Duck River itself (distinct water; Duck has its own TWRA page and a Normandy tailwater trout fishery).

## B. Warmwater fishery evidence (dated)

1. MTFF guide (above, 2026 page): smallmouth the signature species ("April/May best Smallmouth Fishing"), bream, catfish; ~85 fish species; TWRA + NPS access points named.
2. **iNaturalist API** (queried 2026-09-25): Micropterus dolomieu in Buffalo bbox 35.33–36.02N / −87.90 to −87.22W = **39 records**, recent through 2026 (2026-07-03; 2026-06-25 "Hinson Springs Rd, Lobelville" [Perry Co., on the Buffalo]; 2026-05-14 Waynesboro [Wayne Co.]; 2025/2024 records) — dated on-water smallmouth documentation along the mainstem corridor.
3. **Search-surfaced fishery pages (leads)**: tennesseeonthefly.com/buffalo-river (guided smallmouth drift-boat floats, ~125 mi); bonescanoeandcampground.com and crazyhorsecanoe.com (Lobelville float outfitting); YouTube 3-day Waynesboro smallmouth trip; Reddit 135-mi canoe trip report. Middle Tennessee Fly Fishers lists the Buffalo among club waters.
4. TWRA scenic-river/agency management context: the river is free-flowing (no dams) — Class II Pastoral scenic designation; TWRA-managed access (SR 13 canoe launch; Hwy 412 site with "Park and Float").

## C. Zero trout — verified absence (dated)

1. **2026 schedule JSON** (616 rows): ZERO mainstem "Buffalo River" rows. The only Buffalo-named rows are "**Little Buffalo River**, Lawrence, Seasonal, weeks 3/8, 3/22, 5/10, 5/31/2026, Rainbow" — a separate, smaller Lawrence Co. stream (identity trap; likely its own ledger row).
2. **2003–2015 tent schedules** (grids; county column drifts but every "Little Buffalo River" row is the Lawrence water): zero mainstem Buffalo rows; **2018–2025 full schedules**: "Lawrence Little Buffalo River" only; Grainger "Buffalo Creek(DH)" only (sibling).
3. **Completed/committed feeds**: completed 2024-06-07 archive + committed_live 2026 ("Little Buffalo River 05/14/2024"; "Buffalo Creek 08/27/2026"; "Center Hill TW 09/11/2026") — no mainstem Buffalo. **Coldwater quarterlies 2021–2024**: only Little Buffalo (12/2/2021) and Buffalo Creek (10/28/2021).
4. **GIS stocking layer** (730 sites): the only "Buffalo River" sites are the 4 Little Buffalo River sites (Lawrence, StockingProgram "Spring", rainbow, 35.35–35.40 / −87.50 to −87.51). Zero mainstem sites.
5. **Citizen science**: iNaturalist Salmonidae in the Buffalo bbox: **0 records**; GBIF Salmonidae same bbox: **count 0** (queried 2026-09-25).
6. Designation itself is a free-flowing-river protection (TDEC Class II "Pastoral"; scenic-river classes protect free-flowing, unpolluted condition) — consistent with an unstocked, unimpounded warmwater river.

## D. Contradictions and traps

1. **Ledger county/basin error** (documented in section A): Wayne/Lawrence correct-ish; Hardin/McNairy WRONG; "Tennessee River tributary" should read "Duck River tributary (largest)". Humphreys and Lewis belong in the county list.
2. **Little Buffalo River** (Lawrence; TWRA spring rainbow stockings, 2003–2026 continuous) vs **Buffalo River** mainstem (zero stockings) — the single biggest misclassification risk on this water. The stocked water flows into the Buffalo near the headwaters; do not let its rows be attributed to the mainstem.
3. **Buffalo Creek (Grainger Co.)** — sibling trout water in East TN; unrelated despite the name.
4. TDEC scenic layer YEAR field = −63158400000 ms epoch (≈ 1968-01-01 placeholder — the Scenic Rivers Act year). The Buffalo's actual designation date (1970s amendment) was not independently verified this session (Internet Archive offline; TDEC list page 404) — mark designation date UNVERIFIED; the designation itself is verified by the live TDEC layer.
5. A search-engine fallback summary repeated a bogus course ("Humphreys, Lewis, Wayne and Perry... joining the Duck") that garbled county order — rely on the Wikipedia infobox coordinates + TDEC layer + TWRA access counties instead.

## E. Searches run (2026-09-25; rate-limits noted)

1. WebSearch: "Buffalo River" Tennessee "State Scenic River" smallmouth free-flowing — 429 x5, fallback text (contained Duck-River claim contradicting the ledger, triggering the identity check).
2. WebSearch: geodata.tn.gov "tn-scenic-rivers" dataset ArcGIS — 429 x3 (resolved via geodata v3 API).
3. WebSearch: "Buffalo River" Tennessee smallmouth bass float Duck River tributary canoe — success: MTFF, Tennessee on the Fly, Bones/Crazy Horse (Lobelville), YouTube/Reddit trip reports.
4. WebSearch: "Conasauga River" stocked trout (identity-trap cross-check session) — n/a here.
5. Mirrors: DDG html (challenge), Bing (JS wall), Mojeek (blocked), Google-via-jina (consent wall) — direct fetch strategy adopted instead.
6. Fetches: Wikipedia article source; TDEC tn-scenic-rivers.html + geodata dataset discovery + FeatureServer query; TWRA ArcGIS services list + AllAccessSites/Fishing_Sites/Paddling_Access_Sites queries; MTFF buffalo-river.html; Justia/FindLaw statute attempts (blocked/404 — designation date left unverified).
7. API: iNaturalist (Micropterus dolomieu bbox = 39; Salmonidae = 0), GBIF (Salmonidae = 0).
8. Local corpus: 2026 JSON, sched03–15, complete_2018–2025, completed/committed feeds, coldwater quarterlies, stockedtrout 2012-13 winter list, arcgis_all.json — all greps in section C; sibling logs buffalo-creek-grainger.md and duck-river-*.md for identity boundaries.

## F. Recommendation

Classify **warmwater** (high confidence): free-flowing 125-mi State Scenic River (Class II Pastoral, 15.7 designated mi), signature smallmouth/bream/catfish fishery with TWRA and NPS access; ZERO mainstem trout stocking in any TWRA dataset 2003–2026 and zero salmonid citizen-science records. **Amend the ledger geography**: counties Lawrence/Lewis/Wayne/Perry/Humphreys; "Duck River tributary" (not direct Tennessee River tributary; drop Hardin/McNairy). Keep "Little Buffalo River (Lawrence)" as a separate seasonal-stocked trout row and Grainger "Buffalo Creek" separate.
