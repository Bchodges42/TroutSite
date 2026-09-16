# Wave-ledger diff vs catalog — owner decision boxes (Phase 1, report-only)

Generated 2026-09-15 from 148 roster waters (149 blocks / 148 unique slugs). The ledgers cover the original 148-water roster only — the 40 selectable-river-expansion additions and duck-river-mouth have no ledger sourcing yet.

## Verdict census

| Verdict bucket | Waters |
|---|---|
| agree-trout | 93 |
| catalog-unset (fill-gap) | 32 |
| CONFLICT strip-candidate | 8 |
| ledger-unclear | 7 |
| agree-none | 5 |
| CONFLICT claim-candidate | 3 |

## Season census

| Season bucket | Waters |
|---|---|
| both-unset | 63 |
| catalog-unset (fill-gap) | 59 |
| differ | 16 |
| match | 9 |
| ledger-unparsed | 1 |

## D1 — species-verdict conflicts (8 strip / 3 claim / 7 unclear)

Ledger sourcing vs the catalog species verdict. Strip candidates: catalog says trout, the ledgers document none/warmwater. Claim candidates: the reverse.

| Slug | Wave | Ledger class | Evidence lead |
|---|---|---|---|
| french-broad-river | 1 | none | Smallmouth 5/day, 18-in minimum (Hwy 168 to Douglas Dam); statewide bass/crappie/catfish rules otherwise / Source: https://www.tn.gov/twra/f |
| new-river | 2 | none | Statewide black bass rules apply (5 black bass/day any combination, no minimum length); no New River/Clear Fork exception exists on TWRA's e |
| obed-river | 2 | none | see ledger Species/Stocking lines |
| red-river-clarksville | 2 | none | no Red River exception listed on TWRA's exceptions page — statewide rules govern: black bass 5/day any combination, no minimum; crappie 15/d |
| clear-creek-obed | 3 | warmwater | Obed WSR park waters — current TN fishing license + rod and reel (NPS); statewide TWRA trout rules (7/day, no length limit) outside park; Cl |
| daddys-creek | 3 | warmwater | Obed WSR park waters — current TN fishing license + rod and reel (NPS); statewide TWRA trout rules (7/day, no length) outside park; not on T |
| reedy-creek | 3 | warmwater | see ledger Species/Stocking lines |
| roaring-fork | 3 | none-found | park-wide NPS rules — 5 fish combo, 7 in min trout/bass, single-hook artificials only, no bait/scent, year-round / Source: https://www.nps.g |

| Slug | Wave | Catalog verdict | Evidence lead |
|---|---|---|---|
| south-holston-lake | 1 | none | trout 7/day, only 2 may be Lake Trout; largemouth no length limit; smallmouth 15-in min; spotted no creel/length; crappie 15/day 10-in; wall |
| harpeth-river | 2 | none | Statewide warmwater — black bass 5/day any combination, no length limit; crappie 15/day, 10-in minimum; catfish no limit under 34 in, 1/day  |
| little-tennessee-river | 2 | none | Tellico Lake Chota Refuge Unit (Little Tennessee River Miles 26.0 upstream to 29.7) closed to all forms of use and trespass Nov 15–Feb 28 ex |

Ledger-unclear (manual read needed): nickajack-lake, ocoee-number-three-lake, parksville-lake, duck-river-lower, emory-river, powell-river, sequatchie-river

## Season windows — 16 differ / 59 catalog-unset fill-gaps

| Slug | Catalog seasonMonths | Ledger months (basis) |
|---|---|---|
| boone-tailwater | [3, 4, 12] | [2, 3, 4, 9, 12] (parsed) |
| clinch-river | [3, 4, 5, 6, 7, 8] | [3, 4, 5, 6, 7, 8, 9] (parsed) |
| ft-patrick-henry-tailwater | [3, 4] | [3, 4, 9] (parsed) |
| parksville-tailwater | [3, 4, 5] | [3, 4, 5, 6, 7, 8, 9, 10, 11, 12] (parsed) |
| beech-lake | [1, 2, 3, 11, 12] | [1, 2] (parsed) |
| cameron-brown-lake | [1, 2, 3, 11, 12] | [3] (parsed) |
| edmund-orgill-lake | [1, 2, 3, 11, 12] | [1, 2, 6, 12] (parsed) |
| johnson-park-lake | [1, 2, 3, 11, 12] | [1, 2, 8] (parsed) |
| lake-graham | [1, 2, 3, 11, 12] | [5] (parsed) |
| paris-city-park-lake | [1, 2, 3, 11, 12] | [1, 12] (parsed) |
| shelby-farms-lake | [1, 2, 3, 11, 12] | [1, 2, 12] (parsed) |
| yale-road-park-lake | [1, 2, 3, 11, 12] | [1, 2, 12] (parsed) |
| watauga-river-wilbur-reach | [3, 4, 5, 6, 7] | [3, 4, 5, 6, 7, 8] (parsed) |
| covington-fbc-pond | [1, 2, 3, 11, 12] | [11] (parsed) |
| martin-city-pond | [1, 2, 3, 11, 12] | [1, 2, 3, 12] (parsed) |
| valentine-park-pond | [1, 2, 3, 11, 12] | [1, 2, 12] (parsed) |

<details><summary>59 waters with catalog-unset seasonMonths (59 with ledger-derived windows)</summary>

```
cherokee-lake: [1, 2, 3, 4, 11, 12]
fort-patrick-henry-lake: [3, 4]
melton-hill-lake: [7]
wilbur-lake: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
barren-fork-river: [3, 4, 5]
calfkiller-river: [9]
collins-river: [4]
cumberland-river: [1, 2, 12]
east-fork-stones-river: [1, 2, 3, 12]
elk-river-lower: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
harpeth-river: [11]
holston-river: [1, 2, 3, 4, 11, 12]
obion-river: [6, 10]
pigeon-river: [3, 4]
tellico-river: [9]
west-fork-stones-river: [1, 2, 3, 12]
wolf-river-west-tennessee: [2, 11]
sinking-creek-wilson: [1, 2, 12]
beaverdam-creek: [3, 6]
big-rock-creek: [1, 2, 12]
boiling-fork-creek: [1, 2, 12]
buffalo-creek-grainger: [1, 10]
cane-creek: [2, 3, 4, 5, 10]
charles-creek: [3, 5]
citico-creek: [2, 7, 11]
doe-creek-johnson: [3, 5]
doe-river: [3, 6, 10]
east-fork-shoal-creek: [2, 3, 5]
fletchers-fork: [2, 4, 5, 6, 7, 8]
forge-creek-johnson: [3, 5]
gap-creek-claiborne: [2, 3, 4]
goforth-creek: [5]
horse-creek-greene: [3, 6]
hurricane-creek: [2, 3]
indian-creek-claiborne: [2, 4]
laurel-creek-johnson: [3, 6]
laurel-fork-carter: [3, 6]
little-buffalo-river: [3, 5]
little-river: [2, 3, 4, 5, 10, 11]
little-sequatchie-river: [3, 5]
little-west-fork-creek: [2, 4, 5, 6, 7, 8]
mccutcheon-creek: [1, 2, 11, 12]
mill-creek-overton: [3, 4]
mossy-creek-jefferson: [1, 11, 12]
north-chickamauga-creek: [2, 3, 4, 11]
north-prong-barren-fork: [3, 4]
pine-creek-dekalb: [2, 3]
richardson-byrd-creek: [2, 3, 4]
rocky-river: [3, 4, 5]
salt-lick-creek: [1, 3]
standing-rock-creek: [2, 3]
station-creek: [2, 3, 4]
stoney-creek-carter: [3, 4, 5]
sulfur-fork-creek: [2, 12]
tumbling-creek: [3, 4]
upper-hills-creek: [3]
upper-roan-creek: [3, 6]
white-oak-creek: [2, 3, 4]
wolf-river-fentress: [2, 3, 4, 5, 6, 7, 8, 9, 10]
```

</details>

## Gauge wiring — 4 unwire / 2 off-reach flags / 14 wire candidates (38 kept as-is)

Catalog-wired USGS IDs the ledgers contradict (absent from the ledger block, flagged off-reach, or a different water):

| Slug | Catalog IDs | Unwire (not in ledger) | Off-reach flags |
|---|---|---|---|
| elk-river | 03578000 | — | 03578000 |
| duck-river-lower | 03597860, 03598000, 03599500, 03598185, 03599240, 03599419 | 03599500, 03598185, 03599240, 03599419 | — |
| sequatchie-river | 03571000 | — | 03571000 |

<details><summary>14 wire candidates (ledger-verified ACTIVE on-reach, not wired in catalog — probe-before-wire still mandatory)</summary>

```
edmund-orgill-lake: +07030290
reelfoot-lake: +07026690
cumberland-river: +03431500
elk-river-lower: +03580750
mississippi-river: +07032000
watauga-river-wilbur-reach: +03486000
wolf-river-west-tennessee: +08010210
bradley-creek: +03578500, +03578390, +03578395, +03578467
clear-creek-obed: +03539750
west-prong-little-pigeon: +03469230
wolf-river-fentress: +03416000
```

</details>

## Regulations enrichment — 82 roster waters carry documented special regulations

Full text lives in the ledger blocks (Regulations lines with source URLs); feeds `notes` prefixes now or a future `regulations` field (D4).

## Decision boxes (refreshed with wave findings)

**Read these caveats first:**

1. **Unwire ≠ wrong.** "Unwire (not in ledger)" means the ledger block never mentions that station — it can be a true miswire (barren-fork 03421500) OR newer wiring the ledger pre-dates (duck-river-lower gained +3 gauges from the gauge-layer lane AFTER wave-2). Probe before touching either way.
2. **Unresolved ≠ refuted.** `south-fork-cumberland` and `powell-river` were honestly UNRESOLVED by the ledgers (temperature series too old); their strip rows reflect "agency text names no trout", not a disproof. Owner call.
3. **`east-fork-stones-river` keeps its owner ruling** (winter-stocked, 2026-09-10) — any audit/ledger strip noise loses.
4. **Ledger month windows are best-effort parses** of schedule prose; numeric stocking-event dates (e.g. "02/18/2026") can add noise months. Reconcile the differ table against the ledger text, not the parsed set alone.

- **D1 species verdicts** — walk the strip/claim tables; safe defaults: strip → `species: warmwater` + note citation; claim → `species: trout` + citation. `east-fork-stones-river` keeps its owner ruling (winter-stocked) regardless.
- **D2 display re-tier** — unchanged (authored campaign tiers stand; expansion waters ride `labelMinZoom`).
- **D3 non-enum species** — ledger species detail (rainbow/brown/brook/lake) stays in `notes`/research YAML; no enum extension.
- **D4 regulations/aliases** — `aliases` now exists in the contract (expansion merge); special-regs prose → `notes` prefixes or a future `regulations` field.
- **D5 season windows** — apply ledger-derived windows where the catalog is unset; reconcile the `differ` table row by row (month parsing is best-effort).
- **D6 identity/gauge fixes** — apply unwire/wire tables only after a live probe re-run (probe-before-wire mandatory; several ledger proposals are discontinued stations).
