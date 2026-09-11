# Lane results — GEOMETRY (hydrography, geometry provenance, generated map indexes)

- Repo: `C:\Users\Benjamin\Projects\trout-geometry` (clone of `trout-fieldwork-20260904`)
- **BASE_SHA: `5648ccca5c2b6f6fb1cba95b8ae2d421a1e07c9e`** (`5648ccc`, "docs: B15 resolved — all 42 reference waterbodies delivered and merged"), clean tree at start
- Date: 2026-09-04 · Full evidence: [`docs/GEO-CONTINUITY-AUDIT.md`](../GEO-CONTINUITY-AUDIT.md)
- Subagent audits were unavailable in this session (model provider not configured); the lane lead ran the Stones, Sinking, and statewide audits directly with read-only scripts. Only the lane lead edited shared geometry/index files.

## Commit

Single commit on `main` (see `git log -1` in the repo): geometry + tests + scripts + docs, exactly the ownership list below.

## Changed feature IDs and sources

34 of 128 features changed in `apps/web/public/atlas/rivers.geojson`:

| id | change | geometry source (primary) |
| --- | --- | --- |
| `stones-river` | +19 NHD corridor reaches: centerline now runs East/West Fork confluence → J. Percy Priest pool → dam; 1 chunk | `nhd-hr` (USGS NHDPlus HR fcode 55800 "Stones River" artificial paths; 20 corridor nhdplusids live-verified 2026-09-04) + committed TIGER tailwater |
| `sinking-creek-wilson` | kept GNIS 01270380 (Lebanon/Don Fox, TWRA-stocked); removed GNIS 01303641 creek (14 parts) + Rutherford fragment (1 part); 3 chunks → 1; type spring→creek; anchor onto stocked reach | `nhd-hr` (10/11 kept parts coordinate-exact NHD GNIS 01270380; cross-checked against TWRA Trout Stocking Locations feature layer) |
| `duck-river-lower` | −14 shared parts; ends at Shelbyville gauge 03598000 | `tiger-linear` (dedupe only) |
| `elk-river-lower` | −2 shared parts; ends at Prospect gauge 03584600 | `tiger-linear` (dedupe only) |
| `boone-tailwater`, `ft-patrick-henry-tailwater` | −3 shared parts, assigned at Fort Patrick Henry Dam | `nhd-hr`/`tiger-linear` (dedupe only) |
| `clear-fork` | −2 foreign Clear Creek reaches (NHD GNIS 01305953 evidence) + 5 self-dups; 3→2 chunks | `nhd-hr` (dedupe only) |
| `clear-creek-obed`, `charles-creek`, `duck-river-tailwater`, `elk-river`, `emory-river`, `obed-river`, `red-river-clarksville`, `rocky-river`, `wolf-river-fentress` | self-duplicate parts removed (−11 total) | unchanged sources (dedupe only) |
| `shelby-farms-lake`, `cameron-brown-lake`, `yale-road-park-lake`, `johnson-park-lake`, `valentine-park-pond`, `covington-fbc-pond`, `milan-city-pond`, `union-city-reelfoot-pond` | invalid MultiPolygon nesting repaired (depth 3→4); zero coordinate changes | `aerial-trace` (unchanged) |
| `lake-graham`, `center-hill-lake`, `chickamauga-lake`, `douglas-lake`, `fort-loudoun-lake`, `kentucky-lake`, `norris-lake`, `old-hickory-lake`, `south-holston-lake`, `tims-ford-lake` | `labelAnchor` moved inside the polygon (was reference-image approximate location, up to 1.95 km outside) | `census-areawater` (unchanged) |

`apps/web/src/features/map/riverIndex.json`: regenerated from the approved geometry (128 entries, exact parity, sorted).

## Files changed (ownership)

- `apps/web/public/atlas/rivers.geojson` ✅ owned
- `apps/web/public/atlas/lakes.geojson` — inspected, **no change needed** (clean; no passive/interactive duplicates)
- `apps/web/src/features/map/riverIndex.json` ✅ owned
- `apps/web/scripts/atlas-reach-gates.mjs` ✅ owned (stones gate widened; duck-lower/elk-lower gates tightened, with provenance)
- `apps/web/scripts/audit-river-continuity.mjs` ✅ owned (stale sinking-creek allowlist entry removed)
- `apps/web/scripts/fix-stones-sinking-continuity.mjs` ✅ new one-shot fix record
- `apps/web/test/geometry-continuity.test.ts` ✅ new (16 tests)
- `docs/GEO-CONTINUITY-AUDIT.md`, `docs/WATERBODY-IMPLEMENTATION-CHECKLIST.md`, `docs/lane-results/geometry.md` ✅ owned

No UI components, CSS, condition logic, APIs, content records, filters, application layouts, `apps/web/src/features/map/*.tsx`, `mapStyle.ts`, `apps/api/**`, `packages/**`, existing tests, manifests, or `BACKEND-ISSUES.md` were touched (verified via `git status`).

## Tests

- `pnpm --filter @trout/web test` — **105/105 pass** (89 pre-existing + 16 new geometry-continuity tests)
- New suite covers: Stones system connectivity (forks meet at the confluence; centerline continues through the reservoir to the dam; tailwater touches the lake), Sinking Creek regression (1 component, 0 max separation, no fused-fragment longitudes, stocked-reach anchor), full-file contract validation (ids, types, nesting depth, finite coordinates, bounds, anchors, duplicate parts, jumps, riverIndex parity)
- `node scripts/audit-river-continuity.mjs` — **PASS** (0 unexpected multi-chunk; sinking now single-chunk and off the allowlist)
- `node scripts/validate-atlas.mjs` — **PASS** (zero structural/coordinate errors)
- `pnpm --filter @trout/web typecheck` — clean
- `pnpm --filter @trout/web build` — green, size budget OK (dist 5.16 MB / 25 MB)
- Baseline was verified green before edits (after building workspace packages `@trout/contracts`, `@trout/ui`, `@trout/content` — required in a fresh clone; not a repo defect)

## UNRESOLVED (flagged, not fabricated)

1. **`clear-fork`** still 2 chunks with a documented un-fillable gap (NHD carries only the middle band; no connectable unnamed chain in public sources).
2. **Catalog `waterbodyType: spring`** on `packages/content/streams/tn/sinking-creek-wilson.yaml` still contradicts the geometry contract enum — content-lane follow-up (the geometry feature now carries `creek`; the UI reads type from the catalog, so display is unchanged).
3. **`docs/CONTINUITY-AUDIT.md`** (prior lane's file, not in this lane's ownership) needs regeneration by its owner — its sinking-creek row is resolved and `clear-fork` is now 2 chunks; CI passes regardless.
4. **Caney Fork full reference extent** — checklist row remains `PENDING_GEOMETRY` (extent verification belongs to the inventory/catalog gate, not re-litigated here).

## Rendering/interaction readiness (Session 4 handoff)

Every catalog line now has a coherent single-chunk (or documented-multipart)
centerline suitable for the broad base-water casing + narrower condition
line treatment: no accidental gaps, no double-drawn segments, anchors on the
water, `bounds`/`labelAnchor` in `riverIndex.json` in exact parity. The
Stones corridor centerline runs over the `j-percy-priest-lake` polygon by
design (line-over-polygon hit priority is the documented layering rule).
Styling itself was not implemented — Session 4 owns it.
