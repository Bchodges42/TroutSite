# MAP PROMINENCE — TIER DECISION PACKAGE (rev 2, post-review)

Lane: map-prominence · 2026-09-16 · branch `feat/map-prominence` (@ 07d83bb + abf6442 + rev-2 docs)
Status: **PROPOSED — nothing catalog-visible applied.** Machine-applicable manifest: `notes/apply-manifest.json` (rev 2). Evidence: `notes/signals.json` (148/149 wave-ledger waters matched, all high-confidence) + `docs/research/SPECIES-CLASSIFICATION.md` + `notes/candidates.py`. Rev 2 incorporates an independent reviewer pass (sim rerun verified line-for-line; 5 findings, all addressed — see §Review).

## The complaint, quantified

Current featured set = 38. In trout mode (the site default) at statewide zoom:

- **17 of 38 featured have species UNSET** — every big reservoir renders as a dim grey shape with no name (labelPolicy denied labels to non-trout waters before the featured check). *(Fixed in code on this branch, abf6442; species truth still needs the manifest.)*
- **tn-east-smokies — the state's most iconic wild-trout region — opened with ZERO statewide labels.**
- Warmwater giants (Mississippi, Tennessee, Kentucky Lake, Obed, Buffalo, French Broad…) sat featured in a trout-first site with no per-region prominence rule anywhere.

## Proposed rule (replaces "vibes")

**featured (statewide first paint)** — a water qualifies iff:

| Rule | Test | Source of truth |
|---|---|---|
| **R1** Signature trout tailwater | `species: trout` + `fishery: tailwater` | catalog + wave-1 ledger (TWRA stocking citations) |
| **R2** Major trout lake | TWRA nine-trout-reservoir list / state trout plan | wave ledgers + SPECIES-CLASSIFICATION |
| **R3** Region anchor | minimal set; every one of the **12 catalog regionIds** must CONTAIN a featured trout anchor; anchors prefer year-round windows + strongest stocking evidence | signals.json |

**standard** = everything else regularly fished. **reference** = pocket waters, minus shelby-farms (promoted; 16 → 15).

## Candidate A — "Trout-pure" (recommended): 38 → 22 featured

11 tailwaters (R1) + 6 trout lakes (R2) + 5 region anchors (R3). One commit: `tierChanges` + `speciesFills` land together (§Sequencing).

**PROMOTED to featured (8)**

| Water | From | Why |
|---|---|---|
| west-prong-little-pigeon | standard | **Smokies anchor, titles YEAR-ROUND**: West Prong through the Gatlinburg corridor; GSMNP trout + pulse stocking. Ledger caveat: trout attribution is park-level (conservative), YAML documents the stocking |
| holston-river | standard | **Pigeon/French Broad anchor** (was missing entirely in rev 1): Holston below Cherokee Dam, TWRA brown/rainbow stocking Nov–Apr (cited ledger row) |
| harpeth-river | standard | Nashville anchor: winter program, Eastern Flank Battle Park row; ">70,000 trout" is the program-wide figure; titles Dec–Feb |
| piney-river-rhea | standard | Plateau anchor: Delayed-Harvest, year-round, TWRA regs row |
| shelby-farms-lake | reference | West anchor: TWRA West-TN winter program, documented 1/13/2026 stocking; titles Nov–Mar |
| chilhowee-lake | standard | Nine-trout-reservoir list, annual rainbow stocking |
| calderwood-lake | standard | Nine-trout-reservoir list (state trout plan) |
| fort-patrick-henry-lake | standard | Nine-trout-reservoir list, brown/rainbow, year-round trout regs |

**DEMOTED to standard (24)** — all warmwater majors; 17 get a cited `species: warmwater` fill (6 are already warmwater in YAML — recorded as no-ops; see §Species fills):

boone-lake, buffalo-river, center-hill-lake*, cherokee-lake*, chickamauga-lake, cumberland-river, douglas-lake, duck-river-lower, duck-river-mouth†, fort-loudoun-lake, french-broad-river*, j-percy-priest-lake, kentucky-lake, lake-barkley, mississippi-river, norris-lake*, obed-river*, old-hickory-lake, pickwick-lake, reelfoot-lake, tellico-lake‡, tennessee-river, tims-ford-lake*, watts-bar-lake

† duck-river-mouth: NO ledger block and NO classification row — demoted, species **stays unset**; no fill proposed (rev 1's manifest wrongly contained an uncited one; removed). ‡ tellico keeps `species: trout` — reach-limited (upper arm below Chilhowee Dam, ~4,500 RB/yr, Feb–Apr). \* already warmwater in YAML.

**KEPT (14):** the 11 R1 tailwaters + dale-hollow-lake*, south-holston-lake, watauga-lake.
*dale-hollow is flagged: on the nine-reservoir list + trout regs (7/day), but in-lake stocking row absent — the Obey tailwater is the real trout reach. Strike it from R2 if you disagree; obey-river keeps the region anchored. (Note: "Parksville" on the nine-list is satisfied by parksville-tailwater, already featured via R1 — the catalog has no Parksville lake entry.)

## Candidate B — "A + geographic spine": 22 → 25 featured

A **plus** tennessee-river, mississippi-river, tellico-lake stay featured, rendered as **dim subordinate context** in trout mode (never trout-styled, labeled "Warmwater"). Requires `FEATURED_WARMWATER_CONTEXT = true` in `waterDecision.ts` (one line, coded, default off). **The manifest ships B's full `tierChanges` list** — B must NOT be applied as "A's tiers + flag", because the context rule keys on `display: featured`; A's tiers would strand the three spine waters as standard and they'd be excluded (reviewer finding, fixed).

## First paint, trout mode, statewide zoom (z≈5.7)

**Grand regions:**

| View | West | Middle | East |
|---|---|---|---|
| **Today (branch, before manifest)** | — | 4 titled + 7 dim lakes | 3 titled + 5 dim lakes |
| **A end-state, Sept** | — | caney-fork, elk, obey, dale-hollow-lake, piney-river-rhea | south-holston-river, south-holston-lake, watauga-river, west-prong-little-pigeon |
| **A end-state, Nov (winter program)** | shelby-farms | + duck-river-tw | + hiwassee, holston-river, calderwood, chilhowee, FPH-lake, watauga-lake |
| **B end-state, Sept** | mississippi + tennessee (dim) | same as A | same as A |

**Per catalog regionId (candidate A; the honest month-by-month picture):**

| regionId | featured | titles Sept | titles Nov |
|---|---|---|---|
| tn-cumberland-plateau | piney-river-rhea | ✓ | ✓ |
| tn-east-clinch | clinch-river | — | — |
| tn-east-holston | 5 | SH-river, SH-lake | FPH-lake, SH-lake |
| tn-east-pigeon-frenchbroad | holston-river | — | ✓ |
| tn-east-smokies | 3 | west-prong-little-pigeon | + calderwood, chilhowee |
| tn-middle-caney-fork | caney-fork-river | ✓ | ✓ |
| tn-middle-duck-elk | elk-river, duck-river-tw | ✓ | ✓ |
| tn-middle-nashville | harpeth-river | — | — |
| tn-northeast-watauga | 2 | watauga-river | + watauga-lake |
| tn-se-hiwassee | 2 | — | hiwassee-river |
| tn-upper-cumberland | 2 | dale-hollow-lake, obey-river | ✓ |
| tn-west | shelby-farms-lake | — | ✓ |

Every regionId contains a featured trout anchor. Four are dark in September for reasons that are **real seasonality, disclosed, not vibes**: tn-east-clinch (clinch window Mar–Aug — your call to fix, which would open the region), tn-middle-nashville (winter program, Dec–Feb), tn-se-hiwassee (hiwassee window opens Oct), tn-west (winter program, Nov–Mar), plus tn-east-pigeon-frenchbroad until November (holston window Nov–Apr). In November, 9 of 12 regions title; the three dark ones (clinch, nashville, pigeon-frenchbroad) are all window-authored, not assignment gaps.

## Species fills (manifest section — 17 real changes, cited)

17 waters get `species: warmwater`, each cited from SPECIES-CLASSIFICATION.md (TWRA where-to-fish pages, stocking-schedule absence, Trout Mgmt Plan 2017-2027) or the wave-3 ledger (pigeon-river). 6 demoted waters are already warmwater in YAML — recorded as no-ops. Effect after apply: in trout mode these leave the map entirely (the 2026-09-07 plain-warmwater rule); in all-fish mode they render bronze + named. Full citations per water in `notes/apply-manifest.json`.

## Code already on this branch (gated, committed abf6442)

1. **Subordinate labels for featured anchors** — `labelPolicy.labelDecision()` returns hidden/subordinate/titled; featured non-trout anchors keep a dim dashed small label in trout mode with honest "Warmwater/Unverified" words; selection restores full prominence. `FEATURED_ANCHOR_SUBORDINATE_LABELS = true`.
2. **`FEATURED_WARMWATER_CONTEXT = false`** — candidate B's dim-context visibility rule, coded, off.

Gates green: validate:content ✓ · content tests 19/19 ✓ · web tests 355/355 (17 label-policy, updated deliberately) ✓ · pnpm -r build ✓. Screenshots: `notes/shot-trout-mode.png` (solid titles for in-season trout, dim dashed names for the majors) and `notes/shot-all-fish-mode.png` (everything full-strength).

## Sequencing (important, reviewer-verified)

Tier changes + species fills land in the **same commit**. Tiers alone: the 17 unset featured waters become standard+unknown → labels fully hidden, dim unlabeled corridors — strictly worse than today. Fills alone: featured + plain warmwater → excluded → the major lakes vanish while still catalog-featured. One apply, then rebuild the atlas.

## Decision points for you

1. **A or B** (geographic spine yes/no).
2. **dale-hollow-lake**: keep featured (regs + nine-list) or strike (no in-lake stocking row)?
3. **clinch-river window** Mar–Aug: if that window is wrong, fixing the seasonMonths opens the Clinch region most of the year — bigger win than any tier choice.
4. **All-fish mode**: demoted majors title from z=9.5 (today's standard behavior); tn-east-pigeon-frenchbroad and tn-west have no statewide label in all-fish mode either. One-line policy change if you want demoted majors statewide-labeled in all-fish mode — deliberately not applied.
5. **little-pigeon-river**: catalog claims TWRA-stocked Sevierville reach; wave-3 ledger could NOT confirm. Needs a ruling; the anchor went to west-prong-little-pigeon meanwhile.
6. Data-quality note: ledger row for little-river carries stockingDate 11/8/2026 (future-dated — scrape artifact).

## Review provenance

Rev 1 was independently stress-tested (sim rerun, justification spot-checks against ledgers, manifest diff against YAML, regression check). Findings → fixes: per-region guarantee was false (now tabled honestly + 2 anchors added: west-prong-little-pigeon, holston-river); uncited duck-river-mouth fill (removed, manifest + prose now agree); candidate B delta would have half-applied (B now ships full tierChanges); 6 no-op fills (now labeled); harpeth superlative unsupported (reworded); reference-count prose (fixed).

## Sources

Wave ledgers `docs/research/2026-09-15-wave-ledgers/` (149 blocks, 1,221 URL citations) · `docs/research/SPECIES-CLASSIFICATION.md` · TWRA stocking schedule JSON (via ledgers) · simulator `notes/candidates.py`, raw output `notes/sim-output.txt`.
