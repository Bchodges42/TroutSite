# GREAT FALLS LAKE / GREAT FALLS RESERVOIR (Rock Island State Park; Warren / White / Van Buren counties) — warmwater evidence log

Ledger water: `warmwater-focus` (Caney Fork / Collins River confluence impoundment above Great Falls Dam, TVA, completed 1916). Sibling discipline: caney-fork-river.md = tailwater below CENTER HILL Dam; this is the separate TVA impoundment at Rock Island. All retrievals: 2026-09-25. Research only.

## A. Verdict summary (recommendation)

- **Classification: WARMWATER (confirmed). Confidence: HIGH.**
- TWRA's own reservoir page documents a black bass / spotted bass / crappie / bluegill fishery (plus musky in the Collins River arm), with TWRA electrofishing, seining and roving-creel survey history — and even a failed 2011–2014 blacknose-crappie stocking experiment (a warmwater stocking program). Zero trout: no trout row/site/schedule entry anywhere, and the lake is not on TWRA's reservoir-trout list.

## B. Identity and fishery (dated sources)

1. **TWRA "Great Falls Reservoir" page** — https://www.tn.gov/twra/fishing/where-to-fish/cumberland-plateau-r3/great-falls-reservoir.html (retrieved 2026-09-25 via r.jina.ai; cached `jina_twra_gf.html.txt`; text internally dates to 2011–2019 survey references):
   - "Great Falls is a small reservoir (**2,110 surface acres**)... Great Falls Dam was completed in **1916**... this reservoir on the Caney Fork River... continues to offer opportunities for many local anglers seeking **black bass and crappie** fishing endeavors among other species."
   - "located upstream and adjacent to Center Hill Reservoir and is within **Warren, White, and Van Buren counties**." (Ledger said Warren/White — add Van Buren.)
   - "The extreme upper tributaries of the reservoir (i.e., **Collins River**) provide anglers with excellent opportunities for landing a **musky**."
   - Species sections with survey data: Largemouth (mean harvested 1.92 lb; 15-in MLL "established in 2011 at Great Falls"); Spotted bass (genetic integrity study April 2019 — "no Alabama bass genes"); Crappie (white crappie dominant; mean 0.91 lb; **BNC stocked 2011–2014, evaluated 2014, establishment failed**); Bluegill (1.76 sunfish/hr creel).
   - "Spring electrofishing and mid-summer seining surveys help TWRA monitor gamefish populations at Great Falls." TVA summer pool 800 ft; 15-in LMB regs etc.
2. **Tennessee State Parks — Rock Island State Park** (tnstateparks.com/parks/rock-island, archived snapshot 2023-06-10, cached `wb_rockisland.html`; live page 403s to fetchers): "Rock Island State Park is an **883-acre park located on the headwaters of Center Hill Lake at the confluence of the Caney Fork, Collins, and Rocky Rivers**"; park activities list includes Fishing and Paddling; gorge alerts reference TVA Great Falls Dam releases (park alert text references 2023 water releases — observation date context).
3. **Wikipedia "Great Falls Dam (Tennessee)"** (fetched 2026-09-25): "impounds the 1,830-acre Great Falls Lake, and its tailwaters feed into Center Hill Lake"; completed late 1916; only TVA dam outside the Tennessee River watershed.
4. **TWRA 2026-27 guide regs table** (`reg26TNAB.pdf`, effective Aug 1 2026): the adjacent Caney Fork headwater reach (Rock Island SP ramp upstream to Great Falls Dam) carries black bass/walleye/rock bass regs and the Jan 1–Apr 30 single-hook restriction (walleye run) — see caney-fork-upper.md/center-hill-lake.md. Great Falls Reservoir falls under Region 3 reservoir regs (15-in LMB noted on the TWRA page).

## C. Zero trout — verified absence

1. **2026 schedule JSON** (616 rows, cached `trout_2026_live.json`, retrieved 2026-09-25): zero "Great Falls" rows of any type.
2. **Historical schedules 2003–2025** (sched03–15 grids; complete_2018–2025): zero "Great Falls" rows any year. Winter lists 2012-13/2021: none.
3. **Completed/committed feeds** (completed2024, committed2024, committed_live, cw quarterly 2022–2024): zero Great Falls entries.
4. **GIS stocking layer** (730 sites): zero Great Falls sites (nearest trout sites are the Collins River seasonal sites far upstream in Grundy Co. and the Caney tailwater below Center Hill Dam).
5. **TWRA reservoir-trout list** (live, 2026-09-25): Great Falls not among the 8 listed reservoirs.
6. **Citizen science**: iNaturalist Micropterus bbox 35.90–35.98N / −85.72 to −85.62W: 1 record (2020-08-06, largemouth, "Center Hill Lake" place label); Salmonidae GBIF bbox 35.85–36.05N / −85.85 to −85.60W (Great Falls + lower Caney): **count 0** (queried 2026-09-25).
7. Search-fallback text on one query speculated "striped bass and trout in the tailwater" for Great Falls — unattributed to any source; contradicts every dataset above. Note the gorge BELOW the dam is Center Hill Lake headwater water (warmwater walleye run, Jan–Apr single-hook regs); the nearest actual trout water is miles below Center Hill Dam.

## D. Contradictions and traps

1. "Great Falls Lake" (TVA impoundment, 1,830–2,110 acres above the dam) vs the Great Falls tailwater gorge (below the dam, Center Hill headwaters) vs "Blue Hole" swim holes — three waters sharing one park name. The trout-free impoundment is this ledger's water.
2. Wikipedia gives 1,830 acres; TWRA says 2,110 surface acres — cite TWRA for agency consistency; note both.
3. TWRA Great Falls page does not mention smallmouth bass explicitly (largemouth/spotted/black-bass-generic); musky documented only for the Collins River arm (Collins has its own ledger row for its Grundy-headwater trout program — the trout sites are far upstream, not in the lake).
4. Park page confluence wording ("headwaters of Center Hill Lake at the confluence of Caney Fork, Collins, and Rocky Rivers") matches rocky-river.md sibling finding (Rocky River mouth at Great Falls Lake).

## E. Searches run (2026-09-25; rate-limits noted)

1. WebSearch: "Great Falls Lake" Rock Island Tennessee fishing bass crappie — 429 x5, fallback text only.
2. WebSearch: "Great Falls" reservoir Rock Island Tennessee TVA fishing largemouth — 429 x5, fallback text only.
3. WebSearch: TWRA "Center Hill" reservoir fishery report (partial; surfaced the TWRA bank-fishing snippet for the adjacent lake).
4. r.jina.ai on tn.gov sitemap → located the official TWRA Great Falls Reservoir page (fetch success; primary source).
5. Wayback availability + fetch: tnstateparks.com/parks/rock-island (2023-06-10 snapshot; Internet Archive offline after this fetch).
6. WebFetch: tnstateparks.com live (403), TVA great-falls page via curl (JS challenge), tva.com via jina (not attempted after curl block).
7. Wikipedia REST fetches: Great Falls Dam, Rock Island State Park (success).
8. API: iNaturalist (Micropterus bbox), GBIF (Salmonidae bbox) — section C.
9. Local corpus: greps across 2026 JSON, sched03–15, complete_2018–2025, feeds, arcgis_all.json, records.html, coldwater quarterlies; rocky-river.md sibling (Great Falls Lake mouth context).

## F. Recommendation

Classify **warmwater** (high confidence): TWRA-documented black bass (largemouth/spotted), crappie (white dominant), bluegill, musky in the Collins arm, with warmwater survey/stocking history; zero trout program evidence in any TWRA dataset 2003–2026 and absent from the reservoir-trout list. County label for the lake: Warren/White/**Van Buren** (per TWRA); the park itself is Warren/White.
