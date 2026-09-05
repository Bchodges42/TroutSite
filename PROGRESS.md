# Integrated lane progress

Per-lane progress notes from merged lanes (GEO, SPECIES, TOPO). See COORDINATION.md in trout-backend for the full picture.


# TOPO lane — running status (B14)

Base: trout-backend@9182429 (`9182429ac67a514a609bb7b0554192dabd985e8e`).
Scope: B14 at the asset layer — transparent shadow-only hillshade + contour
clip to the real TN boundary (+small buffer). Only
`apps/web/public/atlas/topo/**`, `apps/web/scripts/build-topo.mjs`,
`validate-topo.mjs`, `docs/topo-sources.md`, this file. No UI files touched
(`mapStyle.ts` / TennesseeMap masks stay until the integration lane swaps).

## Status log

- [x] Setup: `pnpm install`, `@trout/contracts build`, `@trout/ui build` — green.
- [x] DEM cache staged: `apps/web/.atlas-src/dem/` was empty in the fresh clone
  (git-ignored). Copied the 30 staged 1" TIFFs (1.60 GB) **read-only** out of
  `C:\Users\Benjamin\Projects\trout` (same canonical USGS 3DEP set; source
  checkout untouched). No network fetch needed.
- [x] Baseline ("before") sizes recorded from committed assets:
  band0 4,198,230 B · band1 3,012,742 B · band2 5,143,434 B (bands
  12,354,406 B ≈ 11.78 MiB) · hillshade 5,514,538 B / 767 tiles ·
  topo total 17,869,380 B ≈ 17.04 MiB.
- [x] Boundary check: `public/atlas/tn-boundary.geojson` = 1 feature, Polygon,
  single closed ring of 1,689 pts, bbox (−90.30971, 34.98297)–(−81.64690,
  36.67812). Clip-rect edges sit up to ~20 km outside it (east: −81.45 vs
  −81.647) — that rectangle is what rendered as the z8–9 contour border.
- [x] **No new npm dependencies.** Implemented as a raster pipeline in
  build-topo.mjs: scanline even-odd fill of the boundary ring + separable
  morphological dilation (nominal 3 km; rectangular metric ⇒ ≈4.2 km diagonal)
  → outside cells forced to NoData before anything is derived. Contour rings
  get sustained (≥10-vertex) edge-hugging runs split off; only interior arcs
  are kept, so no boundary-tracing segments survive.
- [x] Hillshade regenerated: RGBA **lossless** WebP, black RGB, alpha =
  `235 · s^0.8` where `s` is shadow depth below flat-ground shade (180/255,
  ±2 dead zone); neutral/lit/outside → fully transparent. Same tile schema,
  naming, zooms 7–11, azimuth 315°/altitude 45° math.
- [x] Bug caught by standalone logic tests before the asset rebuild: the
  dilation window was backward-only (buffer would shift west). Fixed to a
  centered window (`bw[c] ∪ bw[c+rx]`).
- [x] First rebuild also exposed lossy-WebP dequantization bleeding RGB=1 into
  fully transparent pixels (validator's strict zero-RGB decode caught it).
  Switched tiles to lossless WebP — size-neutral here (constant black +
  smooth alpha), and the black-RGB contract now holds exactly.
- [x] Rebuild results (deterministic; 30/30 DEM tiles): bands 4.01 + 2.94 +
  4.71 MiB = **11.67 MiB** (−0.9% vs before; escalation landed FINER: band0
  RDP 0.00157°, band1 0.00407°, band2 0.00581°); 1,015,240 boundary-tracing
  vertices split off, 810 edge rings dropped. Hillshade **12.83 MiB / 531
  tiles** (+144% bytes = the alpha plane; −236 tiles = −30.8%, masked
  neighborhoods never written). **Total 24.50 MiB** (+43.8%), 21% of the
  60 MB hillshade target; topo stays runtime-cached, outside the budget gate.
- [x] Containment verified: all 579,822 contour coords within TN bbox + 4 km;
  max measured reach outside the state ring 4,156 m (= buffer diagonal); old
  rect edges (−90.6/−81.45/36.75) carry zero contour geometry.
- [x] `node apps/web/scripts/validate-topo.mjs` → **PASS** (531/531 tiles
  `hasAlpha:true`; per-zoom decode spot-checks black-RGB + real alpha;
  manifest pins `encoding:"shadow-alpha"`, `maxAlpha:235`, `lossless:true`,
  `mask:{tn-boundary,3000}`).
- [x] sharp metadata spot-check: 256×256 webp `hasAlpha:true`, channels 4,
  zero non-black pixels, e.g. hillshade/8/65/100.webp, 10/256/403.webp,
  11/511/808.webp. (B14's evidence tile 9/139/201.webp is intentionally gone —
  outside the masked state neighborhood now.)
- [x] `pnpm --filter @trout/web build` — green (580 modules, 5.25s); dist
  ships `atlas/topo/` (25.69 MB raw), size-budget OK: dist 4.97 MB vs 25 MB
  gate, topo excluded/runtime-cached as designed.
- [x] docs/topo-sources.md updated: B14 section (clip method + buffer, alpha
  curve, provenance), new actuals, before/after byte table.

## Notes / decisions

- Buffer chosen: **3 km** (task allowed ~2–5 km) — wide enough that genuine
  contours near the state line survive the gap/split rules, far short of the
  old acquisition rectangle edges.
- Bands got *finer* RDP tolerances than pre-B14 (clip removed ~29% of the
  grid, easing the 12 MB pressure) → smoother contours at essentially equal
  total band size.
- Hillshade byte growth is the alpha plane itself; client keeps relief
  strength control via layer opacity (20/255 alpha headroom left at the
  deepest shadows).
- UI files untouched — Codex's masking layers stay until the integration lane
  swaps assets and removes masks.

---

# FISHABILITY lane — running status

Base: `4e54c36` (integrated branch HEAD at lane start — same base as the
LINES/CATALOG/STILLWATER wave; no BASE_SHA was supplied with the lane brief).
Scope: pure month-aware trout-applicability + all-fish fishability decision
model. Only `apps/web/src/domain/fishability/**`,
`apps/web/test/fishability-model.test.ts`,
`apps/web/test/trout-applicability.test.ts`, `docs/FISHABILITY-MODEL.md`,
`docs/lane-results/fishability.md`, this file. Gitignored snapshot data
(`apps/web/public/v1`, `apps/web/public/content`) copied byte-identical from
the trout-stillwater checkout for build/test runtime only.

## Status log

- [x] Clone of trout-integration at `4e54c36`, branch `fishability/model`;
  `pnpm install`, `@trout/contracts` + `@trout/ui` builds, baseline
  typecheck + 88 unit tests green.
- [x] Read-only audit subagent: existing scoring (contracts
  `scoreConditions`, `readingFreshness`), test conventions, strict-TS
  flags, B08 status, vocabulary. `apps/web/src/domain` did not exist
  (created by this lane).
- [x] Model implemented: `evaluateWater` (deterministic, UTC-normalized
  time, no Date.now/network/React), `selectVisibleWaters`, named
  versioned config, MODEL_VERSION 1.0.0 + debug metadata.
- [x] Tests: trout-applicability + fishability-model (45 new tests).
  Every required brief scenario covered, including September old-winter-
  stocking, wild-in-September, tailwater year-round, stale-vs-current
  warmth, scheduled-vs-completed, zero CFS, all-fish never trout-condition,
  selected-but-filtered, timezone determinism.
- [x] typecheck / 133 tests / eslint (new files) / build + size budget —
  all green.
- [x] Adversarial biology subagent + test-overclaiming subagent (both
  read-only; no repo edits): fixes committed — sustained-warmth knob
  wired, date-precision grace ages, near-zero flow banding, near-cutoff
  phrasing, low-confidence wild wording/visibility, hemisphere-safe
  determinism vectors, boundary-style confidence assertions, filter
  non-mutation check.
- [x] Docs: `docs/FISHABILITY-MODEL.md` (decision table, config listing,
  10 validation-flagged biological assumptions, limitations),
  `docs/lane-results/fishability.md` (handoff).

## Commits (this lane, on `fishability/model`)

- `373fccb` fishability(model): pure month-aware trout-applicability +
  all-fish fishability decision model v1.0.0
- `9b4a16d` fishability(model): address adversarial bio + test-overclaiming
  reviews
- final docs commit — see `git log` / `docs/lane-results/fishability.md`
