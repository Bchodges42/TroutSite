# Stage 1 — Session B report (build & content)

Base SHA: `80cd2cad916608c9dddcfcef0f98be3b10591c46` (origin/main, session-b branch)

## Status

- [x] SETUP — clone/config/push
- [x] STEP 0 — baseline (install, seed, ingest, snapshots)
- [x] STEP 1 — T1-5 POSIX hatch-chart build
- [x] STEP 2 — T0-4 size-budget redesign
- [x] STEP 3 — T1-8 prerender fixture fallback
- [x] STEP 4 — T1-11 atlas/topo manifest regeneration
- [x] STEP 5 — T1-7 wolf-river-fentress.yaml correction
- [x] FINAL verification
- [x] OVERFLOW — F2 species-reference research (draft)

## Per-item evidence

### SETUP / STEP 0 — baseline

- Working clone: `~/Projects/trout-session-b` (the Downloads export is NOT a git repo;
  per AGENTS.md it must never be `git init`ed). Branch `session-b` = `origin/main` =
  `80cd2ca`, clean tree. `git config user.name Bhodges42` set; branch pushed.
- **T2-46 bit this clone (Session A's item, NOT fixed here — noted):** the clone's
  tracked `node_modules` and `apps/web/node_modules` were absolute symlinks into
  `/Users/ben/Downloads/TroutSite-main`. `pnpm install` "succeeded" in <1s against
  them, and web tests/vite build resolved packages from the Downloads workspace.
  I deleted the two symlinks locally (left the `D` entries **unstaged** — untracking
  is T2-46, Session A) and ran a real `CI=1 pnpm install --prefer-offline`.
- Baseline: seed 148 streams / 23 shops; ingest ok (623 stocking items); snapshots ok
  with the expected reds: `hatchCharts:0` (T1-5) and `content pack not found`.
- `pnpm -r build` expected red at web size-budget (T0-4) — not re-run as a gate yet.

### STEP 1 — T1-5: POSIX hatch-chart build

- `packages/content/scripts/build.ts`: the file map was written via
  `join(OUT, name.replaceAll('/', '\\'))` — on POSIX this produced literal-backslash
  filenames (unreadable at `hatch/<region>/<month>.json`), so downstream snapshots
  reported `hatchCharts:0`. Fixed to `join(OUT, ...name.split('/'))`.
- Added a build self-check: after writing, assert all 12 regions × 12 months
  (144 files) exist and are readable at their intended paths; the build exits 1
  listing every missing file otherwise. The prior broken join would fail this check
  on POSIX.
- Evidence:
  - `pnpm --filter @trout/content build` → `[content] self-check: 144 hatch chart
    files readable`, 151 files, 1.04 MB; `find …/pack/hatch -name '*.json' | wc -l`
    = 144; zero backslash-named files remain.
  - Re-ran `pnpm --filter api snapshots` → `"hatchCharts":144, "contentPack":true`,
    no warnings.
  - Gates: `pnpm validate:content` OK (103 taxa, 12×12 months, 148 streams);
    `pnpm --filter @trout/content test` 11/11; `pnpm --filter @trout/web test`
    25 files / 251 tests passed (after the real install above); web build gated with
    `vite build` (exit 0) per the pre-STEP-2 cadence.

### STEP 2 — T0-4: size-budget redesign (install-time semantics)

- `apps/web/scripts/size-budget.mjs` rewritten. The old script counted the whole
  `dist/` (minus `atlas/topo`) against a 25 MB gate — 67.08 MB measured — while the
  service worker only precaches ~10 MB. New semantics:
  - **Install-time set (HARD GATE ≤ 25 MB):** parsed from the generated Workbox
    precache manifest inlined in `dist/sw.js` (`precacheAndRoute([...])` — extracted
    by bracket balance, since the minified call carries a trailing options object
    and unquoted object keys, so it is not JSON), plus `sw.js` itself. Every
    manifest entry must exist on disk or the build fails (stale-manifest guard).
  - **On-demand / runtime-cached set (reported, not gated):** everything else in
    `dist/`, aggregated per top-level directory; topo keeps its 100 MB warn line.
  - Doc-comment at the top of the script documents the new semantics.
- Unit tests: `apps/web/scripts/size-budget.test.mjs` (node:test — see note below),
  10 tests over fixture file lists/manifests: manifest parse (incl. real minified
  shape with options object), budget split (manifest + sw.js = install),
  pass/fail/warn judgment, per-directory aggregation.
- Measured on this build: **install-time 10.80 MB / 25 MB budget (OK)**; on-demand
  82.26 MB (atlas/ 80.52 MB, img/ 1.23 MB, v1/ 0.49 MB) — reported, not gated.
- Gates: `pnpm --filter @trout/web build` now passes FULLY (tsc → copy-pack-fallback
  → vite build → size-budget OK); validate:content OK; content tests 11/11; web
  tests 25 files / 251 tests green.
- **Note for Sessions A/C (out of my slice):** web's vitest include is
  `test/**/*.test.{ts,tsx}` (vite.shared.ts, Session C) and `apps/web/package.json`
  is outside my ownership, so the size-budget unit test runs standalone via
  `node --test apps/web/scripts/size-budget.test.mjs` and is NOT picked up by
  `pnpm --filter @trout/web test`. Proposed wiring (either one):
  - Session C: extend vitest `include` with `scripts/**/*.test.mjs`, or
  - Session A CI step: `- run: node --test apps/web/scripts/size-budget.test.mjs`
    (and/or a package.json script `test:scripts`).

### STEP 3 — T1-8: prerender fixture fallback

- `apps/web/scripts/prerender.mjs`:
  - New `--allow-fixtures` flag. Every data feed that falls back to
    `fixtures/**` is recorded; if any did and the flag is absent, prerender
    exits 1 with a clear error naming the feeds and how to generate real
    snapshots (or pass the flag for fixture-flavor builds).
  - With the flag, a warning lists the fixture-backed feeds, and the /stocking
    page built from fixtures says "sample data / NOT live TWRA data" — never
    "reported releases".
  - Honest unavailability: with zero stocking rows, /stocking renders a
    "data currently unavailable" page instead of silently disappearing.
  - datePrecision wording carried into all generated stocking copy (per-water
    "Recent stocking" lists and the /stocking page): day → "reported released
    YYYY-MM-DD"; week → "scheduled for the week of …"; month → "scheduled for
    <Month Year>" (verified in real output: 9 "scheduled for March 2027" etc.).
  - Real-snapshot run: 556 route pages, 148 waters, 12 regions × charts.
- Regression tests: `apps/web/scripts/prerender.test.mjs` (node:test; hides
  `public/v1` + `public/content`, restores in finally, re-renders real data
  afterwards): (1) no snapshots + no flag → exit 1 with "refusing to publish
  fixture data" + "--allow-fixtures" in stderr; (2) with the flag → exit 0,
  /stocking page contains no "reported releases" and says sample data. 2/2 green.
- **Note (out of my slice):** `e2e/global-setup.mjs` is not in my ownership and
  does not currently run prerender; if it ever does (fixture flavor), it must
  call `node scripts/prerender.mjs --allow-fixtures`. Same wiring note as STEP 2
  for adding the node:test files to CI (Session A).

### STEP 4 — T1-11: regenerate atlas/topo metadata from final artifacts

- New `apps/web/scripts/rebuild-manifests.mjs` (regenerates metadata from what is
  on disk instead of rerunning network-bound builders):
  - rivers.geojson: recomputed every feature's `vertexCount` (+ `bounds` where
    drifted) from delivered geometry — 3 features corrected (duck-river-tailwater
    268→267, indian-creek-claiborne 507→506, little-buffalo-river 239→238).
  - topo: decoded every hillshade tile's alpha plane and removed the 490
    fully-transparent tiles that carried no shadow signal (the "manifest 531 vs
    1,021 files" gap was exactly these); regenerated manifest tiles/bytes/band
    byte counts and the top-level total (531 tiles · 12.83 MB hillshade ·
    11.67 MB bands · 24.50 MB total). Pinned contract fields preserved.
- Command outputs (all five green):
  - `validate-atlas.mjs` → `PASS (zero structural/coordinate/geometry-integrity errors)` (148 features)
  - `validate-topo.mjs` → `validate-topo: PASS`
  - `validate-roads.mjs` → `PASS (structure, bounds, provenance, manifest agreement, size gate)`
  - `validate-east-southeast.mjs` → `east-southeast validation: PASS` (48 features · 18 lakes · 30 reaches)
  - `west-middle-validate.mjs` → `west-middle-validate: PASS` (1 documented NHD-seam WARN, unchanged)
- Artifact deltas committed under `apps/web/public/atlas/**` (my slice):
  rivers.geojson properties, topo manifest.json, 490 deleted empty tiles.
- Gates after regeneration: full web build + size-budget OK (on-demand atlas/
  shrank accordingly), web tests 25/251 green, content gates green.

### STEP 5 — T1-7 (content half): wolf-river-fentress.yaml correction

- `packages/content/streams/tn/wolf-river-fentress.yaml`: notes no longer call
  the Fentress Wolf "Memphis-bound" (the West Tennessee Wolf River conflation).
  Rewritten per TWRA: the Fentress Wolf River feeds Dale Hollow Reservoir (Obey
  River system, Upper Cumberland), explicitly disambiguated from the
  Memphis-bound West TN Wolf. Added TWRA's Dale Hollow Reservoir page as first
  officialSource: https://www.tn.gov/twra/fishing/where-to-fish/cumberland-plateau-r3/dale-hollow-reservoir.html
- Regression test added in `packages/content/test/content.test.ts` (12/12 green):
  notes must mention Dale Hollow, must NOT match /Memphis-bound/, and
  officialSources must cite the TWRA Dale Hollow page. Matcher half of T1-7
  (stockingMatch.ts county disambiguation) is Session C's — untouched here.
- Gates: content build + validate OK, content tests 12/12, web 25/251, full web
  build + size-budget OK.

## Verification summary

STEP 1: all gates green (details above).
STEP 2: size-budget unit tests 10/10; full `pnpm --filter @trout/web build` green
(install-time 10.80 MB of 25 MB); all cadence gates green.
STEP 3: prerender regression tests 2/2; real prerender 556 pages; all cadence
gates green (content 11/11, web 251/251, full web build + size-budget OK).
STEP 4: all five asset validators PASS; all cadence gates green.
STEP 5: content test 12/12 incl. the new T1-7 regression; all gates green.

## Final agent verification (pass/fail, run 2026-09-12 on session-b @ e4fd4f1+)

1. **PASS** — content build on this POSIX machine leaves 144 readable chart files
   at correct paths (`self-check: 144 hatch chart files readable`;
   `find …/pack/hatch -name '*.json' | wc -l` = 144; snapshots ingest then
   reports `hatchCharts:144`).
2. **PASS** — size-budget unit test 10/10; budgeted build green (install-time
   SW precache 10.80 MB of 25 MB; on-demand 82.26 MB reported, not gated).
3. **PASS** — prerender without snapshots and without the flag exits 1 with
   "refusing to publish fixture data" + the --allow-fixtures hint.
4. **PASS** — prerender with the flag: /stocking contains no "reported
   releases" wording on fixture data and says "sample data / NOT live TWRA data".
5. **PASS** — all five asset validators green on regenerated manifests:
   validate-atlas, validate-topo, validate-roads, validate-east-southeast,
   west-middle-validate (1 pre-existing documented NHD-seam WARN only).
6. **PASS** — full gates green: validate:content OK; content tests 12/12;
   web tests 25 files / 251 tests; `pnpm --filter @trout/web build` (tsc →
   copy-pack-fallback → vite build → size-budget) exit 0.

## Overflow — F2 species-reference research (Stage-2 draft started)

- `packages/content/research/f2-species-reference.md` (evidence notes) and
  `f2-species-reference.yaml` (draft, `schema: draft/.../0`) for all seven
  species (largemouth, smallmouth, spotted, crappie, bluegill, channel catfish,
  striped bass): comfort bands, spawn windows, flow-trend preference, pressure
  sensitivity. NOT wired into builds — the loader only reads bugs/streams/
  patterns/shops/hatch dirs, confirmed by validate:content + tests staying green
  with the draft present.
- Verified citations landed: crappie spawn (TWRA Watts Bar page), smallmouth
  spawn + feeding temps (Little River Outfitters), largemouth optimum (In-
  Fisherman) + bass spawn windows (FishUSA), channel catfish spawn (CatfishNow),
  bluegill spawn (MU Extension g9473).
- Honestly pending (flagged `citationStatus: pending`, must not ship): spotted
  bass bands, striped bass everything (needs TWRA/primary citation for the
  ≤72°F preference + tailwater-refuge summer stress), all lethal/avoidance
  temps, and every flow-trend/pressure value (heuristic-grade; pressure stays
  F12-adjacent low-confidence). Gap list in the notes file.

## Blockers

None. Note for Session A: T2-46 absolute `node_modules` symlinks reproduced here —
clone-local workaround applied (real install), deletions left unstaged.
