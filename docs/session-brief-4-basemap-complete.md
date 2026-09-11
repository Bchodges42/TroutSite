# Session Brief 4 — Complete Basemap Feature (Ink + Topo, one vertical slice)

_Role: frontend + geospatial. **Wave 2 — starts after Wave 1 (Sessions 1–3)
hands off.** Nothing ships dormant: this session delivers the switcher UI, the
Ink variant, the Topo data pipeline, and the Topo client wiring as ONE working
feature. Details live in `docs/remaining-changes-implementation-guide.md` (the
"master guide"), Task 6e — execute its Phase A and Phase B end to end, in that
order. Read master guide §0 (Ground rules) first._

## Mission

Users get a basemap switcher with three fully-local options — Paper (default),
Ink night, and real USGS-3DEP Topo — zero third-party runtime requests
(satellite was explicitly rejected by the owner). The Topo entry appears only
when `/atlas/topo/manifest.json` resolves; that is graceful capability
detection, not deferred work — this session ships both halves.

## Wave-2 protocol

- Runs after Wave 1; recommended order is Session 5 (E2E hardening) **before**
  this session, but either order works — **just not simultaneously**: the e2e
  globalSetup and this session's gate both write `apps/web/dist` and reload
  pm2. One build pipeline at a time.
- You own the build during your gate: `pnpm --filter @trout/web build && pm2
  reload trout-api --update-env`, manual checks at `http://127.0.0.1:8787/`.
- Browser use: you (the main agent) drive Browser Use for the three-variant
  manual checks. Your subagents cannot — their returned work is verified by
  you in the browser, never by them.

## Critical rules

- Never reset/checkout/stash/discard the working tree — it now contains Wave-1
  work. Touch only your ownership list.
- `apps/web/public/atlas/rivers.geojson` and the four context files: frozen
  (Session 1's outputs). Topo data lives under `public/atlas/topo/` only.
- Never add `topo/**` to `precacheGlobPatterns` — topo is runtime
  `CacheFirst` only; precache stays ~153 entries and the 25 MB gate unchanged.
- Condition colors (moss/amber/clay) are identical in every variant — the
  legend stays truthful. Only ground/line/label tones change.
- DEM downloads are build-time data acquisition into git-ignored
  `.atlas-src/dem/` (same pattern as `fetch-atlas-sources.mjs`), never runtime
  traffic.
- Do not commit (gated in Session 6).

## Scope — master guide Task 6e, both phases in order

**Phase A (style + UI, ship-able first):**
1. `mapTokens.ts` — add `atlasNight` (guide Step A1).
2. `mapStyle.ts` — parameterize `atlasStyle(variant)`, swap ground tones to
   `t.x` (Step A2). ⚠️ Wave-1 Session 3 added `$type` filters
   (`LINES_ONLY`/`POLYS_ONLY`) to the layer stack — your parameterization must
   keep them intact.
3. `TennesseeMap.tsx` — `basemap` prop, `setStyle` without remount,
   feature-state re-application, `data-basemap` attribute (Step A3).
4. `RiverMapPage.tsx` — state + control button after `MapModeControl`,
   localStorage + `?basemap=` deep link (Step A4).
5. `index.css` — night `.atlas-place` labels (Step A5).
6. Pass Phase A acceptance (Step A6) before starting Phase B.

**Phase B (Topo data + wiring):**
1. `scripts/fetch-tn-dem.mjs` — The National Map API for TN tiles →
   `.atlas-src/dem/`. ⚠️ Verify the `datasets=` slug against
   `https://tnmaccess.nationalmap.gov/api/v1/datasets` first — the master
   guide's URL contains a suspicious double-space encoding; trust the API.
2. `scripts/build-topo.mjs` — devDeps `geotiff`, `proj4`, `d3-contour`,
   `sharp` → `public/atlas/topo/`: contour bands (100/50/20 m, ≤ 12 MB total),
   hillshade z7–11 WebP (≤ 60 MB), `manifest.json` (guide Phase B step 2).
3. Client wiring (guide Phase B step 3): manifest probe in
   `RiverMapPage`/`TennesseeMap`; 'Topo' switcher entry only on probe success;
   `atlasStyle('topo')` raster hillshade + contour lines **beneath all river
   layers**; rivers/selection/halos unchanged.
4. `vite.shared.ts` — the `/^\/atlas\/topo\//` CacheFirst runtimeCaching entry
   exactly as the guide shows.
5. `scripts/size-budget.mjs` — separate `topo (runtime-cached…)` line, warn
   > 100 MB; main gate behavior unchanged.
6. `scripts/validate-topo.mjs` — TN-clip + size-target + manifest checks
   (reuse the CLIP constant from `validate-atlas.mjs`).
7. `docs/topo-sources.md` (new) — provenance, commands, sizes.

## File ownership (hard boundary)

**May touch:** `apps/web/src/features/map/{mapTokens,mapStyle,TennesseeMap,RiverMapPage}.tsx/.ts`,
`apps/web/src/index.css`, `apps/web/vite.shared.ts`,
`apps/web/scripts/{fetch-tn-dem,build-topo,validate-topo}.mjs` (new),
`apps/web/scripts/size-budget.mjs`, `apps/web/public/atlas/topo/**` (generated),
`apps/web/.atlas-src/dem/**` (cache), `apps/web/package.json` + root
`pnpm-lock.yaml` (devDeps only), `docs/topo-sources.md` (new).

**Must NOT touch:** `AppShell.tsx`, `MapLegend.tsx`, `RiverDrawer.tsx`,
`riverMapSelectors.ts` (Wave-1 outputs, stable); `apps/web/scripts/{build-atlas,
build-atlas-context-sources,fetch-atlas-sources}.mjs` and
`docs/atlas-*.md` (Session 1); `public/atlas/{rivers.geojson,places.json,
tn-*.geojson,states-context.geojson}`; all `e2e/**`; root `package.json`
(Session 5's alias); `e2e/playwright.config.ts`.

## Working style — subagents (glm-5.3-flash)

Small fixes stay in the main chat: the `vite.shared.ts` caching block and the
size-budget tweak are a few lines each — do them yourself, along with the
one-time devDeps install (do that before spawning any agent that imports the
packages). The big tasks go to subagents, whole:

- **You (main chat):** devDeps install; SW caching block; size-budget line;
  coordination; the manual three-variant checks; review of every returned
  diff; the session gate.
- **Agent A — Phase A (Ink + switcher), start immediately:** the whole
  vertical slice — `atlasNight` tokens, `atlasStyle(variant)`
  parameterization (keep Session 3's `$type` filters), the `basemap` prop +
  `setStyle` handling, the switcher control + persistence, night label CSS,
  and Phase A acceptance.
- **Agent B — DEM fetch, start immediately (longest wall-clock):**
  `fetch-tn-dem.mjs`, the download, coverage check.
- **Agent C — topo builder:** `build-topo.mjs` + manifest; starts against the
  documented DEM layout, tests once B's data lands.
- **Agent D — validator + docs:** `validate-topo.mjs` +
  `docs/topo-sources.md`; tests after C produces output.

A and B are disjoint from everything else; C and D overlap only in that they
test after upstream data exists. These agents are the same model as you: give
each the master-guide section, its file list, and its acceptance lines — then
let it investigate and build. Don't pre-chew steps or hover; review diffs at
the end.

## Session gate (run in the main thread)

```bash
cd /c/Users/Benjamin/Projects/trout/apps/web
pnpm typecheck && pnpm test               # green
node scripts/fetch-tn-dem.mjs --check     # "dem sources: complete" (idempotent)
node scripts/build-topo.mjs              # bands + tiles + manifest written
node scripts/validate-topo.mjs           # PASS
node scripts/validate-atlas.mjs          # still PASS
pnpm build                                # green; precache STILL ~153 entries;
                                         # separate topo line printed
du -sh public/atlas/topo                  # record the number
cd ../..
git status --short                        # only ownership-list files
git diff --stat apps/web/src/features/map/RiverDrawer.tsx apps/web/src/features/map/riverMapSelectors.ts apps/web/public/atlas/rivers.geojson   # EMPTY
```

Manual at `http://127.0.0.1:8787/`: cycle Paper → Ink → Topo and back — Ink:
dark ground, condition colors legible, selection orange, light place labels;
Topo: contours + hillshade visible z8+, rivers still the visual lead; reload
persists; `?basemap=ink` and `?basemap=topo` deep links; offline (devtools →
offline) after viewing Topo: tiles render from SW cache; EFS still 37 · Poor
· 19.3 cfs; wide water still wash+shore (Session 3's fix intact through your
`setStyle` re-application — check `/?river=hiwassee-river` in all three
variants).

## Handoff to Session 6

Report: topo bytes (contours + hillshade) and per-zoom tile counts; the
verified TNM dataset slug; sharp-on-Windows outcome (or PNG fallback + size
delta); confirmation that `setStyle` re-application preserves Session 3's
wide-water filters and colors; any variant where labels need tuning.

## Stop conditions

- TNM API schema/URL drift after one verified correction → stop, report.
- Contour/hillshade targets exceeded by >20% → stop with numbers; no silent
  target-raising or bloat.
- `sharp` native install fails → try PNG once, then stop and report the
  trade-off.
- DEM coverage gaps over TN → stop, list gaps; never interpolate elevation.
- Phase A acceptance cannot pass without changing Good/Fair/Poor hues → stop
  and report; the legend contract wins.
