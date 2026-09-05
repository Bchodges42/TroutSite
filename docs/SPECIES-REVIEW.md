# Species applicability review (B08) — Tennessee stream catalog

Lane: SPECIES · Base: trout-backend @ `9182429` · Date: 2026-09-04
Scope touched: `packages/content/streams/tn/*.yaml` (105 files) + this doc. Nothing else.

## Outcome

| Classification | Count | Notes |
|---|---|---|
| `species: trout` | 98 | 85 newly authored + 13 West TN winter ponds/lakes (already set, untouched) |
| `species: warmwater` | 0 | see "The warmwater hypothesis, reviewed" — the real catalog refuted every warmwater call |
| *unset* (thin/conflicting evidence) | 7 | listed under "Thin evidence / conflicts — left UNSET" |

Every file parses against `StreamSchema` (`species` enum `trout | warmwater`, optional) with zero
failures; every entry keeps its TWRA source URL (`tn.gov/twra/...` on all 105).

## Method and evidence hierarchy

1. The working hypothesis for warmwater classification lives in
   `apps/web/scripts/generate-fixtures.mjs` (`WARMWATER_IDS`, 20 ids, plus the warmwater
   `EXTRA_NOTES` lines). That file's own header says it is "a first editorial pass … refine
   classifications here as field knowledge improves" — i.e. a hypothesis, not fact.
2. Each hypothesis entry was cross-checked against the catalog YAML's own `notes` text
   (authored from the TWRA stocking dataset) and its `stockingProgram` flag. B08's fix guidance
   is "do not infer from names or fixture IDs", so where the fixture hypothesis and the sourced
   catalog note disagreed, the **catalog note won** and the disagreement is recorded below.
3. Where the catalog note itself carries mixed evidence (trout in one season/reach, warmwater in
   another), or where no species evidence exists at all, `species` was left **UNSET** rather than
   guessed. The two-value enum cannot honestly express "warmwater river with a Dec–Feb put-and-take
   trout season", and guessing either way misleads anglers in the opposite season.
4. All remaining waters whose notes affirm trout stocking or wild trout populations were set to
   `species: trout`. Seasonality stays in the notes (they already carry "winter-stocked",
   "December–February", "best March–May" phrasing); the `species` field answers applicability,
   the notes answer "when".

## The warmwater hypothesis, reviewed entry by entry

All 20 `WARMWATER_IDS` are in the catalog. In **every** case the catalog note affirms a trout
fishery (stocked or wild) — 14 unambiguously, 6 with mixed/thin evidence. Result: 14 overridden
to `trout`, 6 left UNSET, 0 confirmed warmwater.

### Overridden to `trout` (14) — catalog note contradicts the warmwater hypothesis

| id | Catalog note (quoted) | Fixture hypothesis (EXTRA_NOTES) |
|---|---|---|
| stones-river | "TWRA's winter trout program reaches the Nashville metro here — urban rainbows from roughly December through February." | "largemouth, smallmouth, and panfish around the impoundments" |
| west-fork-stones-river | "Murfreesboro's winter-trout water — TWRA-stocked rainbows in an urban greenway setting, December–February." | "Warmwater creek above the impoundments; bass and sunfish only." |
| red-river-clarksville | "TWRA winter-stocked reaches near Clarksville." | "largemouth, spotted bass, and sunfish." |
| sulfur-fork-creek | "TWRA winter-stocked Robertson County creek." | (no note; warmwater by set membership only) |
| elk-river-lower | "Wider, warmer Elk below the tailwater with TWRA winter rainbow stocking in Lincoln County reaches." | "Warms below the trout water — smallmouth and roughfish country to the state line." |
| powell-river | "A wild-trout Highland Rim/ridge-and-valley river holding naturally reproducing rainbow and brown trout in its upper reaches." | "Classic spotted and smallmouth bass flow; a few cool headwater reaches see occasional trout." |
| buffalo-creek-grainger | "TWRA spring-stocked Grainger County creek." | "Warmwater creek — bass and sunfish only." |
| mossy-creek-jefferson | "A newer addition to TWRA's winter trout program (Jefferson County)." | "Warmwater creek near Jefferson City; bass and panfish." |
| brush-creek-cocke | "TWRA spring-stocked Cocke County creek in the Big Creek corridor." | "Warmwater creek between the French Broad and Pigeon corridors." |
| obed-river | "self-sustaining rainbow, brown, and brook trout in clean riffles" (stocking flag `false` by design) | "Wild, scenic smallmouth water through the Obed Wild & Scenic River corridor." |
| daddys-creek | "a wild-trout plateau creek with gorge water in the Obed system." | "Smallmouth boulder water in the Obed system; skip it for trout." |
| clear-creek-obed | "Wild rainbows and the famous Lilly Bridge gorge in the Obed Wild & Scenic River." | "Clear Fork system smallmouth and sunfish creek." |
| piney-river-rhea | "TWRA spring-stocked Cumberland Plateau stream in the Spring City corridor." | "Famous smallmouth float stream on the Cumberland Plateau." |
| sequatchie-river | "TWRA spring-stocks the Sequatchie Valley headwaters in Cumberland County." | "Headwater smallmouth stream; the valley run stays warm year-round." |

Pattern: the hypothesis classified these as warmwater from general river reputation, but the
catalog exists *because* TWRA stocks trout in them (spring program or winter put-and-take), or
because they carry documented wild trout populations. These waters are seasonal trout water;
`species: trout` with the seasonal phrasing already in their notes is the honest encoding.

### Thin evidence / conflicts — left UNSET (7)

| id | Evidence (quoted) | Why unset |
|---|---|---|
| harpeth-river | "Mostly a warmwater river, but TWRA's winter program stocks Williamson County reaches near Franklin. … summer water is smallmouth country." (`stockingProgram: true`). Fixture: "…not a trout fishery." | Genuine mixed fishery: warmwater base with a real Dec–Feb trout program. `warmwater` would erase the stocked trout season; `trout` would imply year-round trout water. Both sources also disagree with each other. |
| duck-river-lower | "Below Shelbyville the Duck trends warm and its fishery shifts — trout linger in the upper reaches seasonally. Conservative flag; verify current TWRA stocking before planning a trout trip here." (`stockingProgram: false`) | Note itself says "verify before planning a trout trip"; no affirmative stocking claim. Fixture claims smallmouth/spotted bass. |
| nolichucky-river | "clear and cold in spring, warm by August. TWRA's stocking dataset does not currently list it; upstream reaches hold scattered wild fish." (`stockingProgram: false`) | Seasonally shifting; only "scattered wild fish" upstream, reach undefined. Fixture claims smallmouth river. |
| little-pigeon-river | "Below the park the river warms and the trout fishery thins out; the upper park reaches hold wild fish. TWRA's stocking dataset does not currently list this reach — flag is set conservatively; verify locally." (`stockingProgram: false`; entry is the *Sevierville reach*) | The cataloged reach is the warming, thinning one; wild trout belong to the uncataloged park forks. Reach-dependent mix. |
| emory-river | "wild trout in the upper reaches, smallmouth downstream." (`stockingProgram: false`) | Explicitly split fishery in one note; entry does not say which reach it scores. |
| clear-fork | "The New River system's wild branch near the Big South Fork boundary. Remote gorges; conserve your wading to stable flows." (`stockingProgram: false`; only a TWRA regulations source, no stocking source) | "Wild branch" names no species; no trout word, no stocking claim. Fixture claims "Big South Fork smallmouth water; scenic and warm in summer." Thinnest note in the catalog. |
| ocoee-river | "the Copperhill reach above Parksville Lake runs cold in spring. TWRA's stocking dataset lists Parksville Lake itself rather than this reach — set conservatively." (`stockingProgram: false`) | No trout or stocking claim for this reach at all; "runs cold" is temperature, not a fishery. |

UI note: until B08's "unknown state" work, `useRiverMapData.ts` treats unset species as trout for
display defaults. That is a UI decision outside this lane's scope; the data now distinguishes
"known trout" (98) from "unknown/mixed" (7) so the UI can act on it.

## Judgment calls within the trout set

- **Winter put-and-take waters scored as `trout`, not `warmwater`** (stones-river,
  west-fork-stones-river, red-river-clarksville, sulfur-fork-creek, big-rock-creek,
  boiling-fork-creek, mccutcheon-creek, sinking-creek-wilson, mossy-creek-jefferson,
  elk-river-lower, + the 13 West TN ponds). These hold trout only in the cold months; the enum's
  `trout` value plus the notes' "winter-stocked"/"December–February" phrasing is the honest pair.
  The flow model naturally scores them Poor in summer (temperature), which matches reality.
- **new-river** → trout. Note never says "trout": "an under-the-radar wild brown fishery" on an
  "Acid-buffered plateau freestone" — "brown" is unambiguous trout shorthand in this corpus.
- **sinking-creek-wilson** → trout. "in TWRA's winter program" — in a trout-stocking catalog,
  "the winter program" is the winter *trout* program; no warmwater claim anywhere in the note.
- **french-broad-river** → trout (judgment). "Cold Douglas Dam releases support a quieter, fringe
  trout fishery near the dam; TWRA's stocking dataset does not currently list it — flag set
  conservatively." Affirmative cold-release trout fishery outweighs the missing dataset row; the
  "fringe" caveat stays in the note. A stricter reading would unset it; flagged for re-review if
  TWRA confirms.
- **pigeon-river** → trout (seasonal). "holds trout in cooler months; TWRA's stocking dataset does
  not currently list the TN reach — set conservatively, verify locally." The cool-month trout
  presence is affirmative and uncontested (fixture note agrees: "stocked with rainbow through
  spring").
- **east-fork-stones-river** → trout. "The upper East Fork holds a modest wild rainbow population
  well above the city" — wild trout affirmed even though TWRA stocks the West Fork instead. Also
  keeps the generator's map-QA assertions (`species: 'trout'`) valid.
- **Seasonal notes already present and sufficient.** Every water classified trout-with-a-season
  already says so in its notes ("winter-stocked", "December through February", "best March–May",
  "holds trout in cooler months"), so no note text was edited — only the `species` line was added.
  West TN pond notes already carry the model seasonal phrasing ("cold months only — the fish do
  not hold over summer").

## The 13 West TN waters — left untouched

`beech-lake`, `cameron-brown-lake`, `covington-fbc-pond`, `edmund-orgill-lake`,
`johnson-park-lake`, `lake-graham`, `martin-city-pond`, `milan-city-pond`,
`paris-city-park-lake`, `shelby-farms-lake`, `union-city-reelfoot-pond`, `valentine-park-pond`,
`yale-road-park-lake` already carried `species: trout` (commit `da80558`) with winter
put-and-take notes. Left as-is per task instruction.

## Fixture-generator finding (for the integration lane — outside this lane's scope)

`apps/web/scripts/generate-fixtures.mjs` at `9182429` **never reads the content YAML**. Fixture
`species` comes from `rivers.geojson` properties (`props.species ?? (warm ? 'warmwater' : 'trout')`),
and only the 13 West TN point anchors carry `species` in the geometry. Verified empirically:
after editing 85 YAMLs and re-running `fixtures:generate` (clean run, contract validation passed),
`fixtures/data/v1/streams` is unchanged — still 85 trout / 20 warmwater, byte-identical species.

Consequence: fixtures now disagree with the reviewed catalog for the 14 waters above (fixture
`warmwater` vs catalog `trout`) and for the 6 unset hypothesis waters. The generator's
`WARMWATER_IDS` set is refuted as written and should be reconciled in the same pass that makes
the generator source species from the content pack (`packages/content` streams), so catalog and
fixtures cannot drift. The warmwater `EXTRA_NOTES` lines for those ids need the same correction
(e.g. obed-river "smallmouth water" vs the catalog's "self-sustaining rainbow, brown, and brook
trout").

## Pre-existing failures (not from this change)

`pnpm --filter @trout/content validate` and `@trout/content test` fail at base `9182429` with
"hatch: no hatch chart file for region tn-west" (the West TN region landed in `da80558` without
hatch charts; 3 test failures, identical before and after this change — verified by stashing).
Web suite: typecheck, 74/74 tests, build + size budget all green.

## Owner decisions (2026-09-04)

Benjamin ruled on the thin-evidence waters. Applied exactly as ruled — nothing more. The two
waters in the "Thin evidence / conflicts — left UNSET" table above are now resolved; the other
five stay unset.

### Rulings applied (3)

| id | decision | what changed |
|---|---|---|
| harpeth-river | `species: warmwater` | Warm river with a real winter fishery: TWRA stocks the Williamson County reaches near Franklin each December. Note extended to state the December stocking explicitly. Catalog semantics are intentional — a warmwater water is never trout-scored by the UI; the stocking flag and the note carry the December fishery. |
| little-pigeon-river | `species: trout`, `stockingProgram: true` | Full trout stream stocked consistently (owner confirmation 2026-09-04, supplementing the TWRA dataset which does not list the reach). Conservative note rewritten; TWRA source URL and gauge 03470000 kept. |
| duck-river-tailwater | note sharpened (was already `species: trout`) | Note now states the tailwater is stocked year-round (owner confirmation 2026-09-04). |

### Leave UNSET (5 — owner could not confirm)

`duck-river-lower`, `nolichucky-river`, `emory-river`, `clear-fork`, `ocoee-river` — unchanged,
no data invented.

### Recommendation menu — the 23 waterbody-expansion waters

**These are RECOMMENDATIONS ONLY, a decision menu for Benjamin. None of it is applied data —
every listed water remains unset in the catalog until ruled on.** Evidence lines are the
fishery identities documented in this catalog plus public TWRA/TVA program structure; the
underlying stub notes carry no fishery evidence of their own ("Catalog stub pending detailed
review").

Big-reservoir rule of thumb: the trout water is the dam's tailwater, which this catalog already
covers as its own scored feature; the reservoirs themselves are warm/coolwater bass, crappie,
and striper fisheries. Recommend `warmwater` for all of them.

| id | recommendation | evidence (one line) |
|---|---|---|
| norris-lake | warmwater | Deep Clinch reservoir managed for black bass/striped bass/walleye; the trout water is the Clinch (Norris tailwater) the catalog already scores. |
| cherokee-lake | warmwater | Holston reservoir fishery is bass/crappie; the tailwater below Cherokee Dam is the separate stocked trout reach. |
| douglas-lake | warmwater | French Broad reservoir, bass/crappie; the catalog's french-broad-river note confines the cold-release trout fringe to the water near the dam. |
| fort-loudoun-lake | warmwater | Upper Tennessee main-stem reservoir; warmwater bass/crappie fishery, no trout program. |
| watts-bar-lake | warmwater | Tennessee main-stem reservoir; warmwater fishery, no trout program. |
| chickamauga-lake | warmwater | Tennessee main-stem reservoir famous for trophy largemouth; warmwater. |
| kentucky-lake | warmwater | Tennessee main-stem reservoir; nationally known crappie/bass fishery, warmwater. |
| pickwick-lake | warmwater | Tennessee main-stem reservoir; noted smallmouth fishery, warmwater. |
| center-hill-lake | warmwater | Caney Fork reservoir; the trout water is the Caney Fork tailwater below the dam, already cataloged. |
| dale-hollow-lake | warmwater | Obey River reservoir renowned for smallmouth bass; the trout water is the Obey tailwater, not the lake. |
| tims-ford-lake | warmwater | Elk River reservoir near Winchester (bass/crappie); the trout water is the Elk tailwater below the dam, already cataloged. |
| south-holston-lake | warmwater (confirm) | The cataloged trout fishery is the South Fork Holston tailwater below the dam; recommend confirming with TWRA whether the lake itself also receives trout before finalizing. |
| old-hickory-lake | warmwater | Cumberland main-stem reservoir; warmwater bass/crappie/striped bass fishery. |
| j-percy-priest-lake | warmwater | Stones River reservoir southeast of Nashville; warmwater bass/crappie/catfish fishery. |
| lake-barkley | warmwater | Cumberland main-stem reservoir at the Kentucky line; warmwater bass/crappie fishery. |
| cumberland-river | warmwater | The Nashville→Barkley main stem is warmwater; the Cumberland system's trout fishing lives in the stocked tailwaters (Caney Fork, Obey) the catalog already covers. |
| tennessee-river | warmwater | The main-stem river/reservoir chain is warmwater end to end; no trout program on the main stem. |
| mississippi-river | warmwater | Boundary river fishery (catfish/carp/bass); no trout fishery in the Tennessee reach. |
| hatchie-river | warmwater | Unchannelized West TN river; warmwater bass/panfish corridor, no trout stocking. |
| obion-river | warmwater | Northwest TN lowland river; warmwater fishery, no trout stocking. |
| wolf-river-west-tennessee | warmwater | Memphis-area lowland river (distinct from the Fentress County trout headwaters, wolf-river-fentress); warmwater. |
| buffalo-river | warmwater | Scenic north-flowing Duck tributary known as a smallmouth float stream; warmwater. |
| holston-river | warmwater | Main Holston below the N/S Fork confluence is warmwater; the trout tailwaters (South Holston, Boone, Ft. Patrick Henry) are separate catalog features. |

A `warmwater` ruling here means the UI never trout-scores these waters (species semantics above);
if any is confirmed to carry a real winter put-and-take program instead, it should be ruled
`trout` with a seasonal note like the West TN ponds.
