# MAP PROMINENCE — TIER DECISION PACKAGE

Lane: map-prominence · 2026-09-16 · branch `feat/map-prominence` (@ 07d83bb + abf6442)
Status: **PROPOSED — nothing catalog-visible applied.** Machine-applicable manifest: `notes/apply-manifest.json`. Evidence base: `notes/signals.json` (148/149 wave-ledger waters matched, all high-confidence) + `docs/research/SPECIES-CLASSIFICATION.md` + `notes/candidates.py` (first-paint simulator, mirrors `labelPolicy.ts`).

## The complaint, quantified

Current featured set = 38. In trout mode (the site default) at statewide zoom:

- **17 of 38 featured have species UNSET** — every big reservoir renders as a dim grey shape with no name (labelPolicy denied labels to non-trout waters before the featured check). This is the "Watts Bar problem". *(Fixed in code on this branch, abf6442 — see below; still needs the manifest for the species truth.)*
- **tn-east-smokies — the state's most iconic wild-trout region — opened with ZERO statewide labels.**
- Warmwater giants (Mississippi, Tennessee, Kentucky Lake, Obed, Buffalo, French Broad…) sat featured in a trout-first site with no per-region prominence rule anywhere.

## Proposed rule (replaces "vibes")

**featured (statewide first paint)** — a water qualifies iff:

| Rule | Test | Source of truth |
|---|---|---|
| **R1** Signature trout tailwater | `species: trout` + `fishery: tailwater` | catalog + wave-1 ledger (TWRA stocking citations) |
| **R2** Major trout lake | on TWRA's nine-trout-reservoir list / state trout plan | wave ledgers + SPECIES-CLASSIFICATION |
| **R3** Grand-region anchor | minimal set so West/Middle/East never open empty; prefer year-round + strongest stocking evidence + most-fished | signals.json |

**standard** = everything else regularly fished (stocked creeks, tailwater reaches, warmwater majors). **reference** = pocket waters — **unchanged (16)**.

## Candidate A — "Trout-pure" (recommended): 38 → 21 featured

11 tailwaters (R1) + 6 trout lakes (R2) + 4 anchors (R3). One commit: `tierChanges` + `speciesFills` land together (see sequencing note).

**PROMOTED to featured (7)**

| Water | From | Why |
|---|---|---|
| harpeth-river | standard | Nashville anchor: >70,000 trout stocked, urban winter fishery (TWRA) |
| little-river | standard | Smokies anchor: dated TWRA stocking row + park trout corridor; titles Nov–Mar (catalog yr:false) |
| piney-river-rhea | standard | Plateau anchor: Delayed-Harvest, year-round, TWRA regs row |
| shelby-farms-lake | reference | West anchor: TWRA West-TN winter program, documented 1/13/2026 stocking; titles Nov–Mar |
| chilhowee-lake | standard | Nine-trout-reservoir list, annual rainbow stocking |
| calderwood-lake | standard | Nine-trout-reservoir list (state trout plan) |
| fort-patrick-henry-lake | standard | Nine-trout-reservoir list, brown/rainbow, year-round trout regs |

**DEMOTED to standard (24)** — all warmwater majors; each gets a cited `species: warmwater` fill (below):

boone-lake, buffalo-river, center-hill-lake, cherokee-lake, chickamauga-lake, cumberland-river, douglas-lake, duck-river-lower, duck-river-mouth†, fort-loudoun-lake, french-broad-river, j-percy-priest-lake, kentucky-lake, lake-barkley, mississippi-river, norris-lake, obed-river, old-hickory-lake, pickwick-lake, reelfoot-lake, tellico-lake‡, tennessee-river, tims-ford-lake, watts-bar-lake

† duck-river-mouth has no ledger/classification row — demoted, species stays unset (honesty). ‡ tellico keeps `species: trout` but reach-limited (upper arm below Chilhowee Dam, ~4,500 RB/yr); featured only in candidate B.

**KEPT (14):** the 11 R1 tailwaters + dale-hollow-lake*, south-holston-lake, watauga-lake.
*dale-hollow is flagged: on the nine-reservoir list + trout regs, but in-lake stocking row absent — the Obey tailwater is the real trout reach. Strike it from R2 if you disagree; the region stays anchored by obey-river.

## Candidate B — "A + geographic spine": 24 featured

A **plus** tennessee-river, mississippi-river, tellico-lake stay featured, rendered as **dim subordinate context** in trout mode (never trout-styled, labeled "Warmwater"). Requires flipping `FEATURED_WARMWATER_CONTEXT = true` in `waterDecision.ts` (one line, already coded, default off). Pick B if you want the two big rivers orienting the first paint; pick A if trout mode should show trout water only.

## First paint, trout mode, statewide zoom (z≈5.7)

| View | West | Middle | East |
|---|---|---|---|
| **Today (branch, before manifest)** | — | 4 titled + 7 dim lakes | 3 titled + 5 dim lakes |
| **A end-state, Sept** | — | caney-fork, obey, dale-hollow-lake, elk, piney-river-rhea | south-holston-river, south-holston-lake, watauga-river |
| **A end-state, Nov (winter program)** | shelby-farms | + duck-river-tw | + hiwassee, little-river, calderwood, chilhowee, FPH-lake, watauga-lake |
| **B end-state, Sept** | mississippi + tennessee (dim) | same as A | same as A |

Per-region guarantee after the manifest: **all 12 catalog regions contain at least one featured trout anchor** (tn-west titles seasonally — its only trout fishery is the winter program; off-season it dims by your 2026-09-10 dim-not-hide rule, honestly).

## Species fills (manifest section — 23 waters, cited)

All 24 demoted except duck-river-mouth get `species: warmwater`, sourced from SPECIES-CLASSIFICATION.md (TWRA where-to-fish pages, stocking-schedule absence, Trout Mgmt Plan) and the wave ledgers (obed-river, pigeon-river: warmwater, zero salmonid evidence). Effect: in trout mode these leave the map entirely (the 2026-09-07 campaign rule for plain warmwater); in all-fish mode they render properly bronze + named. Full citations per water in `notes/apply-manifest.json`.

## Code already on this branch (gated, committed abf6442)

1. **Subordinate labels for featured anchors** (fixes "dim unlabeled grey" the moment species truth is unavailable): `labelPolicy.labelDecision()` returns hidden/subordinate/titled; featured non-trout anchors keep a dim dashed small label in trout mode with honest "Warmwater/Unverified" words; selection restores full prominence. `FEATURED_ANCHOR_SUBORDINATE_LABELS = true`.
2. **`FEATURED_WARMWATER_CONTEXT = false`** — candidate B's dim-context visibility rule, ready but off.

Gates green: validate:content ✓ · content tests 19/19 ✓ · web tests 355/355 (17 label-policy, updated deliberately) ✓ · pnpm -r build ✓.

## Sequencing (important)

Tier changes + species fills must land in the **same commit**. Tiers alone make the demoted lakes worse than today (still dim, now unlabeled AND demoted); fills alone hide the lakes while they're still featured. One apply, then rebuild the atlas.

## Decision points for you

1. **A or B** (geographic spine yes/no).
2. **dale-hollow-lake**: keep featured (regs + nine-list) or strike (no in-lake stocking row)?
3. **clinch-river season window** ends in August — intentional? It stops titling in Sept.
4. **All-fish mode**: demoted majors will title from z=9.5 like today's standard waters. If you want them statewide-labeled in all-fish mode, say so — one-line policy change, deliberately not applied.
5. **little-pigeon-river**: catalog claims TWRA-stocked Sevierville reach; wave-3 ledger could NOT confirm. Needs a ruling; the anchor went to little-river meanwhile.

## Sources

Wave ledgers `docs/research/2026-09-15-wave-ledgers/` (149 blocks, 1,221 URL citations) · `docs/research/SPECIES-CLASSIFICATION.md` · TWRA stocking schedule JSON (via ledgers) · simulator: `notes/candidates.py`, raw output `notes/sim-output.txt`.
