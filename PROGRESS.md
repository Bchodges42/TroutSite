Base commit: 826e5cb (codex/trout-fieldwork-20260904)
Session: B — catalog & content corrections (2026-09-04)

## Summary

Six commits on top of the integrated tree; content pack, fixtures, and served
snapshots all regenerated; every gate green (content validate/build/test 11/11,
web typecheck/test 122/122, web build + size budget OK). No files touched under
`apps/web/src`, map styles, or `e2e/`.

## Commit list

| commit | subject |
|---|---|
| `186d41c` | content(tn-west): author honest hatch chart for the winter put-and-take region |
| `ae09f77` | content(duck): point Normandy tailwater gauge below the dam (B13 follow-up) |
| `2874208` | content(species): apply owner decisions 2026-09-04 (B08) |
| `2902c93` | content(docs): bookkeeping — paris alias resolved, duck/elk fragmentation rows done |
| `457d688` | content(fixtures): overlay pack catalog fields so fixtures:generate runs clean |
| `62c5768` | content(fixtures): regenerate demo fixtures from the corrected catalog |

## Task 1 — tn-west region + hatch chart

The premise was partially stale: `regions.ts` already registered `tn-west`
(12 regions) with a `hatchCharts: false` escape hatch, and the stream
regionId-vs-registry cross-check already exists (`scripts/lib.ts:225-226`).
What was missing was the chart. Shipped `hatch/tn/tn-west.yaml` (12 months):
cold months carry the stillwater staples of freshly stocked small lakes
(midges, scuds, sowbugs, leeches, aquatic worms — the same fare the
tn-middle-nashville winter-program chart carries); warm months (Apr–Oct) list
only permanent pond residents at abundance 1, because the stocked fish do not
hold over summer and no trout guidance exists for that season. Provenance in
the file header. With a chart shipped, the `hatchCharts` flag,
`CHARTLESS_REGIONS`, and the validator/test carve-outs were retired — all 12
launch regions now require and ship 12-month coverage (validate prints
"12 regions × 12 months"; the pack-wide regionId check passes).

## Task 2 — Duck River gauge evidence (B13)

Old gauge `03596000` "Duck River below Manchester, TN" is ABOVE Normandy Dam.
Swap target: `03597860` "Duck River at Shelbyville, TN".

Evidence, all from USGS NWIS (waterservices.usgs.gov site/IV/DV services,
queried live 2026-09-04):

| site | name | lat/lon | drainage | position vs dam |
|---|---|---|---|---|
| 03596000 | DUCK RIVER BELOW MANCHESTER, TN | 35.47094 / −86.12164 | 107 mi² | east (UPSTREAM) of the dam |
| 03596460 | NORMANDY LAKE (LK) | 35.46535 / −86.24860 | 195 mi² | the reservoir |
| 03596470 | DUCK RIVER ABOVE NORMANDY, TN | 35.46091 / −86.24527 | 196 mi² | reservoir inlet |
| 03596500 | DUCK RIVER AT NORMANDY, TN | 35.45730 / −86.25694 | 208 mi² | just below dam — but NO current IV/DV data (checked: zero series in last 3 days, any parameter) |
| **03597860** | **DUCK RIVER AT SHELBYVILLE, TN** | **35.48293 / −86.46258** | **425 mi²** | **west (DOWNSTREAM) of the dam; LIVE: 6 IV series in last 3 days + daily-value discharge (provisional ~174 cfs, 2026-08-28..09-03)** |

Dam position: Normandy Lake's west edge (TIGER AREAWATER, per GEO-AUDIT) is at
lon ≈ −86.248, matching USGS lake site 03596460 (−86.24860). 03597860 sits at
lon −86.4626, well west (downstream) of the dam at the tailwater reach's lower
end (GEO lane's own geometry gate lon −86.50..−86.24). The closer below-dam
gauges (03596500/03596510/03596520) are historical — no current flow data — so
03597860 is the nearest REPORTING gauge below the dam. Sharing it with
duck-river-lower is intentional (it bounds that reach's upstream end too).
Stale fixture row 03596000 removed from `packages/content/data/verified-gauges.json`.

## Task 3 — species decisions (owner rulings 2026-09-04)

- harpeth-river → `species: warmwater` + December stocking stated in the note.
- little-pigeon-river → `species: trout`, `stockingProgram: true`, note
  rewritten per owner confirmation (2026-09-04); TWRA sources + gauge kept.
- duck-river-tailwater → note sharpened to year-round stocking (owner
  confirmation 2026-09-04).
- Everything else stays UNSET: 5 thin-evidence waters + 23 waterbody stubs.
- `docs/SPECIES-REVIEW.md` gained "Owner decisions (2026-09-04)" with the
  rulings, the leave-unset list, and a clearly-marked RECOMMENDATIONS-ONLY
  decision menu for the 23 stubs. `BACKEND-ISSUES.md` B08 status updated.

## Task 4 — bookkeeping

- paris-city-park-lake alias confirmed consistent (catalog name = TWRA site
  name; mapped polygon = Green Acres Lake aka Williams Lake; Eiffel Tower Park
  pond is a different secondary water); catalog note now carries the alias;
  STILLWATER-COVERAGE handoff row 1 + checklist row marked resolved.
- waterbody-inventory.json: Duck River and Elk River rows marked `exists-ok`
  with DONE verdicts citing the CONTINUITY-AUDIT before/after table
  (duck-river-tailwater 3→1 chunks; elk-river 9→1 chunks).

## Fixture / snapshot regeneration

- The species-drift generator gap was already fixed by a prior lane (the
  generator overlays pack species/notes). But `fixtures:generate` FAILED at
  base 826e5cb for an unrelated pre-existing reason: 22 atlas extras had no
  `regionId` prop and pickwick-lake's geometry said `waterbodyType: reservoir`
  (not in the contract enum). Fixed by extending the pack overlay to the
  pack-validated identity fields (regionId, waterbodyType, stockingProgram,
  gaugeIds) — commit `457d688`. 128 streams validate cleanly.
- Regenerated: `apps/web/fixtures/data` (committed, `62c5768`) and the
  gitignored served snapshot `apps/web/public/v1/` (streams.json from the pack
  + new `hatch/tn-west/` 12 month files + refreshed hatch dirs). Verified in
  the served snapshot: harpeth `species: warmwater`; little-pigeon
  `species: trout` + `stockingProgram: true`; duck-river-tailwater gauge
  `03597860`; paris note carries the alias; 28 waters remain species-unset
  (5 thin-evidence + 23 stubs).

## Verification (final state)

- `pnpm --filter @trout/content validate` → OK — 103 taxa, 155 patterns,
  **12 regions × 12 months**, 128 streams, 23 shops. Warnings: 87 (all
  documented-ungauged gauge notices).
- `pnpm --filter @trout/content build` → OK (1.00 MB of 20 MB budget).
- `pnpm --filter @trout/content test` → 11/11.
- `pnpm --filter @trout/web typecheck` → clean.
- `pnpm --filter @trout/web test` → 122/122 (14 files).
- `pnpm --filter @trout/web build` → OK + size budget (5.22 MB / 25 MB).
- `fixtures:generate` → clean, all files validated against @trout/contracts.
- Note for the next session: fresh clones must `pnpm --filter @trout/contracts
  build && pnpm --filter @trout/ui build` before the web gates; the baseline
  "failures" on a fresh checkout were only unbuilt workspace deps.
