# Stage 3 — Session B report (F3: catalog targetSpecies authoring)

Base SHA: `877cd39dd521034fe83942eb624e8fb340f51999` (origin/main; branch `session-b-stage3`)

## Status

- [x] SETUP — branch/report/push
- [x] F3 analysis — which waters have evidence for the seven contract keys
- [x] F3 authoring batches (2 batches, 10 waters)
- [x] FINISH — **F3 complete — 10 waters authored, 138 unset**

## Per-item evidence

### The contract reality vs the mapping brief (read this first)

The Stage 3 brief anticipated ~80 authored waters from the mapping's "evidenced"
bucket. That bucket evidences **trout stocking programs** (rainbow/brown trout
TWRA rows), and ADR 0007 froze `targetSpecies` to the **seven warmwater game
species** — trout are deliberately not keys (the trout program already lives in
`species`/`fishery`/`stockingProgram` and the untouched trout score). Re-running
the evidence analysis against the enum:

- **0** of the 148 waters have resolved TWRA stocking rows naming any of the
  seven keys (checked every `stockingEvidence` entry in the merged mapping).
- The sanctioned evidence that DOES reach the seven keys is exactly the two
  kinds KNOWN-ISSUES F3 named ("species-adjacent notes"): catalog notes naming
  species, and special-regulation items applying to a water that name a species.

Per the brief's own rule — "evidence-based only … when in doubt, leave
targetSpecies unset on trout waters and note it" — I authored every water with
real evidence for an enum key and left the rest unset, each with a recorded
reason and a follow-up path below.

### Evidence-trail gate (shipped before authoring)

`packages/content/test/content.test.ts` gains an F3 gate: every water carrying
`targetSpecies` must have per-key evidence — the species (or its folk name,
e.g. bream→bluegill) must appear in the water's own `notes` OR in a
special-regulations item from `fishing-information.json` that `appliesTo` the
water. Keys must stay inside the frozen contract enum, and the program-type
`species` field is asserted untouched. The gate constrains whatever is authored
without mandating a count, so the branch is green at every commit and any
future uncited authoring fails CI.

### BATCH 1 — note-evidenced (5 waters, pushed @ 383af18)

| water | targetSpecies | evidence |
|---|---|---|
| caney-fork-upper | smallmouth-bass, bluegill | note: "Warmwater water: smallmouth and bream country" |
| emory-river | smallmouth-bass | note: "wild trout in the upper reaches, smallmouth downstream" |
| harpeth-river | smallmouth-bass | note: "summer water is smallmouth country" |
| reelfoot-lake | crappie, bluegill | note: "Tennessee's premier crappie and bluegill water" |
| tennessee-river | smallmouth-bass | note: "the moving reaches are smallmouth water" |

Each water's `officialSources` (TWRA pages / USGS) already carry the source for
the note prose; the notes themselves are the capture evidence.

### BATCH 2 — regulation-evidenced (5 waters, pushed @ 8e7e322)

The GSMNP special-regulations item (authority NPS, sourceId nps-gsmnp,
https://www.nps.gov/grsm/planyourvisit/fishing.htm — already in each water's
officialSources) applies to five Smokies waters and explicitly manages
smallmouth bass ("5 brook/rainbow/brown trout plus smallmouth bass combined per
day; … 7-inch minimum on trout and smallmouth") — management evidence, not
doubt: little-river, leconte-creek, middle-prong-little-pigeon,
west-prong-little-pigeon, cosby-creek → `targetSpecies: [smallmouth-bass]`.
Their trout scores are untouched (ADR 0007 keeps `scoreConditions` and the
program-type field exactly as they were).

### GATES (both batches)

`pnpm validate:content` OK · content tests 19/19 (incl. the new F3 gate) ·
`pnpm -r build` green (size-budget OK) — run per batch before each push.

## Verification

- Branch green end-to-end at every commit: validate:content (StreamSchema now
  contract-validates `targetSpecies` against the frozen enum), content 19/19,
  full workspace build.
- Authored total: **10 waters**; keys used: smallmouth-bass ×10, bluegill ×2,
  crappie ×1. No key without evidence was authored; zero `spotted-bass`,
  `channel-catfish`, `striped-bass`, `largemouth-bass` authorings (no evidence
  anywhere in the capture for those keys).

## Unset waters (138) — reasons + follow-up list

- **75 trout-program-evidenced** (the mapping's evidenced bucket): TWRA rows
  evidence rainbow/brown trout stockings only. Follow-up: none for F3 v1 —
  these are correctly carried by the trout program fields; targetSpecies stays
  absent unless a TWRA source names a game species for the water. List:
  barren-fork-river, beaverdam-creek, beech-lake, big-rock-creek,
  boone-tailwater, brush-creek-cocke, buffalo-creek-grainger, calfkiller-river,
  cameron-brown-lake, cane-creek, caney-fork-river, charles-creek, citico-creek,
  clinch-river, collins-river, covington-fbc-pond, dale-hollow-lake,
  doe-creek-johnson, doe-river, duck-river-tailwater, east-fork-shoal-creek,
  edmund-orgill-lake, elk-river, forge-creek-johnson, ft-patrick-henry-tailwater,
  gap-creek-claiborne, goforth-creek, greasy-creek-polk, gulf-fork-big-creek,
  hiwassee-river, horse-creek-greene, hurricane-creek, indian-creek-claiborne,
  johnson-park-lake, lake-graham, laurel-creek-johnson, laurel-fork-carter,
  little-buffalo-river, little-sequatchie-river, martin-city-pond,
  mccutcheon-creek, milan-city-pond, mill-creek-overton,
  mossy-creek-jefferson, north-chickamauga-creek, north-prong-barren-fork,
  obey-river, paris-city-park-lake, parksville-tailwater, pine-creek-dekalb,
  piney-river-rhea, puncheon-camp-creek, richardson-byrd-creek, rocky-river,
  salt-lick-creek, sequatchie-river, shelby-farms-lake, south-holston-river,
  spring-creek-polk, standing-rock-creek, station-creek, stones-river,
  stoney-creek-carter, sulfur-fork-creek, tellico-river, tumbling-creek,
  union-city-reelfoot-pond, upper-hills-creek, upper-roan-creek,
  valentine-park-pond, watauga-river, west-fork-stones-river, white-oak-creek,
  wolf-river-fentress, yale-road-park-lake.
- **2 tailwater program inferences** (trout keys; no resolved TWRA rows — the
  T1-7 unresolved-alias workstream is the blocker): french-broad-river,
  watauga-river-wilbur-reach.
- **6 warmwater program waters without species-level evidence** — the highest-
  value follow-up: one TWRA lake-page pass would likely evidence bass/crappie/
  catfish/striped-bass assemblages (KNOWN-ISSUES: "authored from TWRA
  evidence"): center-hill-lake, cherokee-lake, little-tennessee-river,
  norris-lake, south-holston-lake, tims-ford-lake.
- **54 no-evidence waters** (mapping needs-evidence bucket): species stays
  unknown per F3. Includes the major main-stem reservoirs (chickamauga-lake,
  watts-bar-lake, kentucky-lake, old-hickory-lake, …) whose TWRA pages name
  rich game-fish assemblages — the same lake-page pass covers them.
  Full list: boiling-fork-creek, boone-lake, bradley-creek, buffalo-river,
  calderwood-lake, chickamauga-lake, chilhowee-lake, clear-creek-obed,
  clear-fork, cumberland-river, daddys-creek, douglas-lake, duck-river-lower,
  east-fork-stones-river, elk-river-lower, fletchers-fork, fort-loudoun-lake,
  fort-patrick-henry-lake, great-falls-lake, hatchie-river, holston-river,
  j-percy-priest-lake, kentucky-lake, lake-barkley, little-pigeon-river,
  little-west-fork-creek, melton-hill-lake, mississippi-river, new-river,
  nickajack-lake, nolichucky-river, normandy-lake, obed-river, obion-river,
  ocoee-number-three-lake, ocoee-river, old-hickory-lake, parksville-lake,
  pickwick-lake, pigeon-river, powell-river, red-river-clarksville,
  reedy-creek, roaring-fork, shoal-creek, sinking-creek-wilson,
  south-fork-cumberland, tellico-lake, trail-fork-big-creek, watauga-lake,
  watts-bar-lake, wilbur-lake, wolf-river-west-tennessee, woods-reservoir.
- **1 flagged, deliberately not authored**: north-fork-holston-river — its note
  attributes the renowned smallmouth fishery to the **Virginia** water; the
  Tennessee reach is short and carries no species claim of its own. Authoring
  smallmouth-bass from a Virginia claim would be a guess. Follow-up: a
  TWRA-source for the TN reach.

## Blockers

None. (Scope note: the ~80-water expectation in the brief cannot be met with
the frozen enum — trout evidence cannot author warmwater keys. The honest
authoring set from the merged mapping + capture is the 10 above; the rest is
correctly unset with follow-ups.)
