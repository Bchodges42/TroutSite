# Integrated lane progress

This file holds per-lane progress notes merged into the integration branch.


Base commit: 9182429ac67a514a609bb7b0554192dabd985e8e (trout-backend@9182429)

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

## Commits (this lane, in order)

- a6de74f geo(audit): lane progress notes with baseline evidence
- 38df0e8 geo(fix): validate-atlas accepts twra-winter-ponds Point anchors
- f6fe001 geo(fix): pipeline reach gates + NHD takes for fragment/duplicate streams
- 2d3f48d geo(fix): regenerate rivers.geojson — verified reaches for 26 streams
- 6f6f4e6 geo(fix): streams-geo.json anchors rebuilt from USGS gauge locations
- a6ecdd4 geo(audit): GEO-AUDIT per-stream verdict table + pipeline docs
- 8c3c9b4 geo(fix): pipeline refinements used by the regenerated atlas (stones/ocoee gates, elk/duck takes, TN-boundary vertex test)

All verifications re-run on the final committed tree: validate-atlas PASS, typecheck PASS, 74/74 tests, build + size budget OK.

## Disclosed workarounds / upstream findings

- `pnpm --filter @trout/content build` FAILS at base: da80558 added region `tn-west` without `hatch/tn/tn-west.yaml`. Built the pack once with a temporary untracked shim hatch file, deleted immediately after; `git status` confirms no tracked packages/ change. Content lane must add the missing hatch chart.
- apps/web/public/v1/streams.json is stale (92 entries, missing the 13 tn-west waters) — serving lane.
- Catalog gauge 03596000 ("Duck River below Manchester") for duck-river-tailwater sits above Normandy Dam — content lane.
- apps/web/scripts/fix-caney-fork.mjs was missing from docs/atlas-sources.md — fixed here.
- stones-river: the baseline 3-part reach proved complete (dam-to-mouth tailwater); the new gate prevents Percy Priest Lake connector paths from joining it. Net geometry unchanged.
