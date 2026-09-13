# F3 evidence pass 2 — TWRA where-to-fish pages (Stage 4)

Per-water evidence from TWRA's individual "where to fish" pages (fetched
2026-09-13). Each authored water gets `targetSpecies` + a sourced note sentence
+ a `TWRA — <page>` officialSources entry. Conventions:

- "spotted bass / Alabama bass / Kentucky bass" → contract key `spotted-bass`.
- Generic "Catfish" (TWRA's reservoir shorthand for the catfish family) maps to
  `channel-catfish`, the contract's only catfish key; pages naming
  "channel/blue/flat catfish" map directly. Documented here per F2's
  cited-or-flagged rule.
- Hybrid striped bass ("Cherokee bass") alone does NOT author `striped-bass`;
  every page listing hybrids also lists true striped bass except Woods (neither).
- Species outside the frozen enum (walleye, sauger, white/yellow bass, muskie,
  paddlefish, trout, sunfish variants) never author keys — recorded here only.

| water | keys authored | page |
|---|---|---|
| cherokee-lake | largemouth, smallmouth, spotted, striped, crappie, bluegill, catfish | east-tennessee-r4/cherokee-reservoir.html |
| watts-bar-lake | largemouth, smallmouth, spotted, striped, crappie, bluegill, catfish | cumberland-plateau-r3/watts-bar-reservoir.html |
| chickamauga-lake | largemouth, smallmouth, spotted, striped, crappie, bluegill, catfish | cumberland-plateau-r3/chickamauga-reservoir.html |
| norris-lake | largemouth, smallmouth, spotted, striped, crappie, bluegill, catfish | east-tennessee-r4/norris-reservoir.html |
| tims-ford-lake | largemouth, smallmouth, spotted, striped, crappie, bluegill, catfish | middle-tennessee-r2/tims-ford-reservoir.html |
| kentucky-lake | largemouth, smallmouth, spotted, striped, crappie, bluegill, catfish | west-tennessee-r1/kentucky-reservoir.html |
| pickwick-lake | largemouth, smallmouth, spotted, striped, crappie, bluegill, catfish | west-tennessee-r1/pickwick-reservoir.html |
| lake-barkley | largemouth, smallmouth, spotted, striped, crappie, bluegill, catfish | west-tennessee-r1/barkley-reservoir.html |
| old-hickory-lake | largemouth, smallmouth, spotted, striped, crappie, bluegill, catfish | middle-tennessee-r2/old-hickory-reservoir.html |
| j-percy-priest-lake | largemouth, smallmouth, spotted, striped, crappie, bluegill, catfish | middle-tennessee-r2/percy-priest-reservoir.html |
| douglas-lake | largemouth, smallmouth, spotted, striped, crappie, bluegill, catfish | east-tennessee-r4/douglas-reservoir.html |
| fort-loudoun-lake | largemouth, smallmouth, spotted, striped, crappie, bluegill, catfish | east-tennessee-r4/fort-loudoun-reservoir.html |
| melton-hill-lake | largemouth, smallmouth, spotted, striped, crappie, bluegill, catfish | east-tennessee-r4/melton-hill-reservoir.html |
| tellico-lake | largemouth, smallmouth, spotted, striped, crappie, bluegill, catfish | east-tennessee-r4/tellico-reservoir.html |
| boone-lake | largemouth, smallmouth, spotted, striped, crappie, bluegill, catfish | east-tennessee-r4/boone-lake.html |
| fort-patrick-henry-lake | largemouth, smallmouth, spotted, striped, crappie, bluegill, catfish | east-tennessee-r4/fort-patrick-henry.html |
| south-holston-lake | largemouth, smallmouth, spotted, crappie, bluegill, catfish | east-tennessee-r4/south-holston-reservoir.html (no striped bass on page) |
| watauga-lake | largemouth, smallmouth, spotted, crappie, bluegill, catfish | east-tennessee-r4/watauga-reservoir.html (no striped bass on page) |
| chilhowee-lake | largemouth, smallmouth, spotted, crappie, bluegill, catfish | east-tennessee-r4/chilhowee-reservoir.html (no striped bass on page) |
| calderwood-lake | largemouth, smallmouth, crappie, bluegill, catfish | east-tennessee-r4/calderwood-lake.html (no spotted/striped) |
| center-hill-lake | largemouth, smallmouth, spotted, crappie, bluegill, catfish | cumberland-plateau-r3/center-hill-reservoir.html (no striped bass on page) |
| dale-hollow-lake | largemouth, smallmouth, spotted, crappie, bluegill, catfish | cumberland-plateau-r3/dale-hollow-reservoir.html (no striped bass on page) |
| nickajack-lake | largemouth, smallmouth, spotted, striped, crappie, bluegill, catfish | cumberland-plateau-r3/nickajack-reservoir.html |
| parksville-lake | largemouth, spotted, crappie, bluegill | cumberland-plateau-r3/parksville-reservoir.html (no smallmouth/striped/catfish on page) |
| great-falls-lake | largemouth, smallmouth, spotted, crappie, bluegill, catfish | cumberland-plateau-r3/great-falls-reservoir.html (no striped bass on page) |
| normandy-lake | largemouth, smallmouth, spotted, crappie, bluegill, catfish | middle-tennessee-r2/normandy-reservoir.html (no striped bass on page) |
| woods-reservoir | largemouth, smallmouth, spotted, crappie, bluegill, catfish | middle-tennessee-r2/woods-reservoir.html (no striped bass on page) |
| duck-river-lower | largemouth, smallmouth, spotted, catfish | middle-tennessee-r2/duck-river.html ("Panfish" generic — bluegill not authored) |
| lake-graham | largemouth, crappie, bluegill, catfish | west-tennessee-r1/lake-graham.html (page: "blue & channel catfish") |

## NEEDS-SOURCE — researched, no page/key evidence found (2026-09-13)

- little-tennessee-river — no TWRA where-to-fish page; assemblage evidence
  needed from TWRA Region 4 streams guidance before keys can be authored.
- north-fork-holston-river — TWRA page absent; the renowned smallmouth
  reputation on the catalog note is attributed to the Virginia reach. Needs a
  TWRA/TVA source naming smallmouth for the TENNESSEE reach.
- french-broad-river, watauga-river-wilbur-reach — tailwater program inferences
  are trout-only; no game-species (enum) evidence found.
- holston-river, nolichucky-river, powell-river, buffalo-river, obion-river,
  hatchie-river, wolf-river-west-tennessee, elk-river-lower, cumberland-river,
  red-river-clarksville, new-river, ocoee-river, and the remaining small
  creeks/ponds from the Stage 3 unset list — no individual TWRA where-to-fish
  page exists; need TWRA region streams guidance or species-specific stocking
  rows (T1-7 unresolved-alias workstream feeds this).
