# GEO lane progress

Base commit for CONTINUITY lane: db2555b (GEO lane final HEAD; `git log --oneline -3`
recorded at lane start: db2555b geo(audit): final lane status / 8c3c9b4 / a6ecdd4).
Base commit for GEO lane: 9182429ac67a514a609bb7b0554192dabd985e8e (trout-backend@9182429).

## CONTINUITY lane — Final status: DONE (2026-09-04)

- [done] Setup: node_modules present from GEO lane; base HEAD db2555b recorded.
- [done] `apps/web/scripts/audit-river-continuity.mjs` (new): reproduces the chunk
  counting (endpoint-to-endpoint haversine, 1 km stitch), emits the per-stream
  report to docs/CONTINUITY-AUDIT.md, exits non-zero on unexpected multi-chunk
  line rivers. Run FIRST: baseline committed as docs/CONTINUITY-AUDIT.md with the
  before column (a9322ae) — 27 of 92 line rivers multi-chunk, matching the
  user-verified total (elk measures 9 vs the report's 7 under the stricter
  endpoint haversine; all other confirmed counts reproduce exactly).
- [done] 18 new per-stream NHDPlus HR corridor fetch targets
  (fetch-nhd-targets.mjs: harpeth, collins, clear-fork, sulfur-fork, emory,
  hurricane-houston, sinking-wilson, daddys, efork-shoal, indian-claiborne,
  laurel-johnson, new-river-scott, n-chickamauga, obed, sequatchie, fletchers,
  horse-greene + name-less fbb-braid) — all fetched 2026-09-04 with retry/backoff;
  no outstanding 504s.
- [done] NHD takes for the new files plus previously fetched-but-untapped
  coverage: powell "Powell River", byrd-creek "Byrd Creek", "Piney River" (lower
  Piney main stem), "Sulphur Fork Creek" + "Sulphur Fork Red River".
- [done] Continuity-aware source selection in merge-rivers.mjs: per stream pick
  the most continuous REAL source set (TIGER+NHD blend / undeduplicated full
  union / NHD-only / TIGER-only), switching only for a strictly lower chunk
  count while still covering the base extent (0.05 deg/side) — logged as
  `sel:...` in the feature source tag.
- [done] watauga-river reach gate widened (maxLon -82.125 -> -82.11, provenance
  in atlas-reach-gates.mjs): old edge rejected the two NHD Wilbur-dam-pool
  connectors and split the tailwater.
- [done] close-residual-gaps.mjs (new pipeline step, runs after merge-rivers):
  joins chunk endpoints across residual gaps <= 1 km, logging every join to
  .atlas-src/out/residual-joins.json. This run logged 0 joins — every residual
  gap is > 1 km and was documented, never bridged (no straight-line fabrication).
- [done] rivers.geojson regenerated through the full pipeline in order:
  fetch-nhd-targets -> match-rivers-tiger -> merge-rivers -> close-residual-gaps
  -> fix-caney-fork -> merge-west-tn-points (last) -> validate-atlas.
- [done] Result: 16 of the 27 fragmented streams are fully continuous (1 chunk):
  barren-fork-river, collins-river, daddys-creek, duck-river-tailwater, elk-river,
  emory-river, fletchers-fork, french-broad-river, harpeth-river,
  laurel-creek-johnson, new-river, north-chickamauga-creek, obed-river,
  powell-river, sequatchie-river, watauga-river. The harpeth gap the user saw
  (-87.04,36.08) is closed with the real NHD Harpeth River flowline (217 parts).
- [done] 10 streams keep 2-3 chunks, each probe-verified un-fillable from public
  sources (>1 km holes, no NHD reach, no TIGER segment; corridor chain tests
  documented in docs/CONTINUITY-AUDIT.md) and allowlisted LEFT-OPEN:
  clear-fork, horse-creek-greene, sinking-creek-wilson, east-fork-shoal-creek,
  hurricane-creek, indian-creek-claiborne, mill-creek-overton, piney-river-rhea,
  richardson-byrd-creek, sulfur-fork-creek. Each still gained substantial real
  geometry (e.g. hurricane 10 -> 115 parts, sulfur-fork 10 -> 85, clear-fork
  15 -> 92).
- [done] cane-creek stays allowlisted DELIBERATE (docs/GEO-AUDIT.md): one catalog
  id covering two same-named Cane Creeks; gained NHD Hickman-band water (33 -> 60
  parts, 4 -> 3 chunks = one per county water).
- [done] 13 twra-winter-ponds Point anchors verified byte-identical through the
  full pipeline (snapshot diff before/after).
- [done] Verify on the final tree: audit-river-continuity PASS (0 unexpected
  multi-chunk streams), validate-atlas PASS (105 features), @trout/web typecheck
  PASS, test 74/74, build + size budget OK (5.57 MB / 25 MB).

## Commits (CONTINUITY lane, in order)

- a9322ae continuity(audit): chunk-count audit script + before baseline (27 multi-chunk line rivers)
- f4cdcf2 continuity(fix): pipeline — 18 NHD corridor fetch targets, takes for untapped coverage, continuity-aware source selection, watauga dam-pool gate widen, residual-gap joiner
- 3ce644a continuity(fix): regenerate rivers.geojson — 16 more fragmented streams read as one continuous water from real NHD/TIGER reaches
- 67b1df5 continuity(audit): allowlist documented deliberate + left-open streams; final report 0 unexpected multi-chunk (16 fixed, 10 documented source gaps)

## Coordinator hand-off notes

- docs/waterbody-inventory.json is not in this repo (other lanes own it); the
  duck/elk pairs it lists as 'fragmented' verify as 1 chunk each in the repaired
  output (duck-river-tailwater 3 -> 1, duck-river-lower 1, elk-river 9 -> 1,
  elk-river-lower 1) — those rows can be marked done against
  docs/CONTINUITY-AUDIT.md's before/after table without redoing them.
- rivers.geojson grew ~584 KB -> ~636 KB (real NHD reaches, compact JSON); size budget green.

## GEO lane progress (previous lane, preserved below)

## Final status: DONE

- [done] Setup: pnpm install, @trout/contracts build, @trout/ui build — green (no network retry needed).
- [done] Context: BACKEND-ISSUES.md B13, COORDINATION.md, docs/atlas-sources.md, pipeline scripts.
- [done] Audit of all 105 rivers.geojson features (92 catalog streams + 13 tn-west point anchors) vs catalog, gauge anchors, TIGER 2024 and NHDPlus HR — verdict table in docs/GEO-AUDIT.md.
- [done] Census TIGER/Line 2024 (95 counties LINEARWATER+AREAWATER, 183 MB) + USGS NHDPlus HR (26 targets) + USGS gauge coordinates (51 sites, NAD83, 2026-09-04) fetched; all public domain.
- [done] Pipeline fixes: atlas-reach-gates.mjs (new, provenance-cited reach windows), fetch-nhd-targets.mjs (9 new targets, envelope fixes incl. 504 workaround), match-rivers-tiger.mjs (clinch window, strict counties, gates), merge-rivers.mjs (NHD takes for 16 streams, TN-boundary vertex test, gates on NHD+AREAWATER), validate-atlas.mjs (accept twra-winter-ponds Points — baseline validator FAILED on them).
- [done] rivers.geojson regenerated through the full pipeline (match -> merge -> fix-caney-fork -> merge-west-tn-points); validate-atlas PASSES; 26 of 105 features changed, each an intended correction or a verified data-refresh delta; zero regressions.
- [done] streams-geo.json rebuilt: 41 anchors, one per gauge-monitored stream, pinned to published USGS monitoring-location coordinates; dead keys removed; four provable offsets corrected.
- [done] Verify: validate-atlas PASS; @trout/web typecheck, test (74/74), build + size budget — all green.
- [done] docs/GEO-AUDIT.md + docs/atlas-sources.md pipeline-order fix (fix-caney-fork.mjs was undocumented).

## Commits (GEO lane, in order)

- a6de74f geo(audit): lane progress notes with baseline evidence
- 38df0e8 geo(fix): validate-atlas accepts twra-winter-ponds Point anchors
- f6fe001 geo(fix): pipeline reach gates + NHD takes for fragment/duplicate streams
- 2d3f48d geo(fix): regenerate rivers.geojson — verified reaches for 26 streams
- 6f6f4e6 geo(fix): streams-geo.json anchors rebuilt from USGS gauge locations
- a6ecdd4 geo(audit): GEO-AUDIT per-stream verdict table + pipeline docs
- 8c3c9b4 geo(fix): pipeline refinements used by the regenerated atlas (stones/ocoee gates, elk/duck takes, TN-boundary vertex test)
- db2555b geo(audit): final lane status

## Disclosed workarounds / upstream findings (GEO lane)

- `pnpm --filter @trout/content build` FAILS at base: da80558 added region `tn-west` without `hatch/tn/tn-west.yaml`. Built the pack once with a temporary untracked shim hatch file, deleted immediately after; `git status` confirms no tracked packages/ change. Content lane must add the missing hatch chart.
- apps/web/public/v1/streams.json is stale (92 entries, missing the 13 tn-west waters) — serving lane.
- Catalog gauge 03596000 ("Duck River below Manchester") for duck-river-tailwater sits above Normandy Dam — content lane.
- apps/web/scripts/fix-caney-fork.mjs was missing from docs/atlas-sources.md — fixed here.
- stones-river: the baseline 3-part reach proved complete (dam-to-mouth tailwater); the new gate prevents Percy Priest Lake connector paths from joining it. Net geometry unchanged.
