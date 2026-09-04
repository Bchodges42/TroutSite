# HANDOFF PROMPT — Complete the Trout Map Remediation

_Last audited: 2026-09-03 after the prior model hit its rate limit_

You are taking over an **unfinished, uncommitted** map remediation in:

`C:\Users\Benjamin\Projects\trout`

Branch: `main`, tracking `origin/main`.

Do not reset or discard the working tree. Inspect the diff before changing anything. Do not redesign the admin portal. Do not invent river geometry or condition data.

## Original goal

Fix the Map page for the selected **East Fork Stones River**. The map canvas size is not the problem; geography, selected-river presentation, responsive panel layout, controls, and viewport locking are.

Preserve these values exactly:

- East Fork Stones River
- Middle TN — Nashville
- Score: **37 · Poor · Running low**
- Flow: **19.3 cfs**
- Ideal range: **50–400 cfs**
- Temperature: **unavailable**
- Preserve its timestamp/missing-temperature state; do not edit underlying condition data.

Keep the warm cream/green/orange Field Notes Atlas design and privacy rules. No external runtime map tiles, fonts, telemetry, or analytics.

## Where the previous model stopped

The previous model:

1. Added real local geographic context:
   - `public/atlas/tn-boundary.geojson`
   - `public/atlas/states-context.geojson`
   - `public/atlas/tn-counties.geojson`
   - `public/atlas/places.json`
2. Replaced synthetic river output with an in-progress Census TIGER/Line 2024 + USGS NHDPlus HR pipeline.
3. Added separate desktop panel rendering via `RiverDrawer layout="panel"`.
4. Added selected/non-selected feature-state hierarchy and panel-aware `fitBounds` padding.
5. Added a retry on MapLibre `sourcedata` for selection deep links.
6. Added local city/town markers and moved zoom/attribution controls away from the desktop panel.
7. Added `e2e/web/atlas-verify.spec.ts` but did **not** complete a clean passing run.
8. Generated a corrected `public/atlas/rivers.geojson` with:
   - 91 unique features out of 92 catalog streams
   - 88 `MultiLineString`, 3 `MultiPolygon`
   - zero structural/coordinate validation errors in an ad-hoc Python validator
   - WGS84/EPSG:4326, `[longitude, latitude]`
   - separate source parts; no concatenation into artificial connector lines
9. Rebuilt and reloaded the local PM2 app.

The **last verified command** was:

```text
pnpm --filter @trout/web build
```

Result:

- TypeScript passed
- Vite production build passed
- PWA precache: 153 entries / 3587.48 KiB
- Size budget: **3.94 MB / 25 MB**
- `pm2 reload trout-api --update-env` succeeded

No current visual/browser acceptance run was completed after that build.

## Working tree state

Modified:

- `.gitignore`
- `apps/web/package.json`
- `apps/web/public/atlas/rivers.geojson`
- `apps/web/public/atlas/tn-boundary.geojson`
- `apps/web/src/features/map/RiverDrawer.tsx`
- `apps/web/src/features/map/RiverMapPage.tsx`
- `apps/web/src/features/map/TennesseeMap.tsx`
- `apps/web/src/features/map/mapStyle.ts`
- `apps/web/src/index.css`
- `pnpm-lock.yaml`

Untracked:

- `apps/web/public/atlas/places.json`
- `apps/web/public/atlas/states-context.geojson`
- `apps/web/public/atlas/tn-counties.geojson`
- `apps/web/scripts/fetch-nhd-targets.mjs`
- `apps/web/scripts/match-area-water.mjs`
- `apps/web/scripts/match-rivers-tiger.mjs`
- `apps/web/scripts/merge-rivers.mjs`
- `docs/map-page-remediation-brief-current.md`
- `e2e/web/atlas-verify.spec.ts`

`apps/web/.atlas-src/` is about 190 MB and is now ignored. Do not commit it.

## Critical issues to fix before claiming completion

### 1. Condition colors are currently broken

`TennesseeMap.tsx` mutates a private MapLibre field:

```ts
const feats = src?._data?.features;
```

MapLibre GL v6 stores URL-loaded GeoJSON as `{ url }`, later `{ geojson }`, not as `_data.features`. The code returns early, so `color`/`hatchColor` are not applied. It would also pass the wrong wrapper object back to `setData`.

**Required fix:** stop depending on `_data`. Prefer putting color/hatch color in feature-state and read it from feature-state expressions, or explicitly fetch/store a typed FeatureCollection and call the public `setData(FeatureCollection)` API. Verify Good/Fair/Poor colors visibly render.

### 2. Atlas generation is not reproducible from a clean clone

- `apps/web/scripts/build-atlas.mjs` is still the old synthetic generator. Running it will overwrite the new real atlas and regenerate stale docs.
- `docs/atlas-validation.md` and `docs/atlas-sources.md` still describe synthetic jitter/centroids and are false for the current output.
- `match-rivers-tiger.mjs` and `merge-rivers.mjs` require local `.atlas-src` downloads/extracted shapefiles, but no complete acquisition/orchestration command exists.
- `match-area-water.mjs` is a two-line truncated stub and must be deleted or implemented.
- `places.json` says it was generated with Mapshaper, but Mapshaper is not a pinned project dependency.
- The structural validator was an ad-hoc command, not a checked-in test/script.

**Required fix:** provide one deterministic documented command that acquires/pins official source URLs, extracts them, generates context + river data, validates output, and reproduces checked-in files. Alternatively, treat checked-in GeoJSON as the artifact and remove misleading/incomplete generators—but do not leave a synthetic overwrite path labeled canonical.

### 3. Real-source matching still needs review

- `white-oak-creek` is unresolved and intentionally absent. Do not fabricate it. Find a verifiable official geometry or clearly mark it unavailable on the map.
- East Fork Stones currently reports bounds `[-86.442141, 35.81021, -85.949346, 35.986857]`, 26 parts, 586 vertices, and sources `tiger-linear + nhd-hr`.
- `merge-rivers.mjs` combines TIGER and NHD parts for the same water. This can duplicate overlapping segments. Deduplicate or choose a preferred source per river while preserving disconnected parts as `MultiLineString`.
- Confirm managed/tailwater entries represent the intended reach, not an entire same-named river unless that is explicitly documented.
- Keep strict rejection of malformed/out-of-Tennessee coordinates and never delete an interior point in a way that creates a connector.

### 4. The E2E test is not canonical yet

`e2e/web/atlas-verify.spec.ts`:

- Hardcodes `http://127.0.0.1:8787`, while Playwright’s canonical web server/baseURL is `http://127.0.0.1:4173`.
- Manually launches Edge instead of using Playwright’s `page` fixture/project browser.
- Therefore its fixture build and tested server can diverge.
- The prior run was against the older invalid artifact: 1 passed, 2 failed.
- Two locator mistakes were corrected afterward (`role=option`; visible mobile dialog), but the suite was not rerun.

**Required fix:** rewrite it to use the normal `page` fixture and relative URLs. Split viewport cases if useful. Make it CI-safe and deterministic.

### 5. Existing screenshots are stale and failed visual acceptance

Existing files:

- `e2e/test-results/atlas-statewide.png`
- `e2e/test-results/atlas-selected-tablet.png`

They were captured before the corrected GeoJSON rewrite. They showed:

- almost no usable river network
- wrong apparent centering near Clarksville for East Fork Stones
- dense, always-on town labels
- a freshness badge/control partly hidden beneath the desktop panel
- insufficient condition color hierarchy

Do not cite these as verification. Generate fresh screenshots after fixes.

### 6. Places and controls need responsive cleanup

- All HTML place markers are always added; they have no zoom-based visibility or collision handling. Statewide view becomes cluttered.
- The right panel can cover/wedge the top-bar second row (`Live · now` was visibly clipped at 1024×768).
- Constrain/reflow/hide overlays when the panel is open.
- Confirm attribution and zoom controls remain visible and not pressed against a scrollbar.
- Basemap context currently consists of states, Tennessee, county lines, and place labels—no roads. Decide whether that meets orientation needs after fresh visual QA; if not, add only locally hosted, licensed context.

### 7. Viewport/scroll acceptance is not verified

`AppShell` still starts with `min-h-dvh`; the map route uses calculated heights. The requested browser-level overflow check has not passed yet.

Verify:

- document `scrollHeight <= clientHeight + 1`
- document `scrollWidth <= clientWidth + 1`
- desktop panel has exactly one scrolling body
- mobile retains peek/medium/full sheet behavior
- no hidden/nested tab scrollbar controls

### 8. No deployment/commit has been made for this remediation

The remediation is only in the local working tree. It has not been committed or pushed. Public `https://trout.tntechclimb.com` must not be described as fixed until deployed and read back. Ignore `inject.bundle.js` and `chrome-extension://invalid` messages; those are extension noise, not Trout errors.

## Focused implementation requirements

1. Preserve the selected river’s real condition values unchanged.
2. Make Tennessee/Middle Tennessee recognizable using only local assets.
3. Render valid real river paths without artificial jump segments.
4. Subdue surrounding rivers; make East Fork Stones orange and prominent with a restrained halo.
5. Fit the selected river into the map’s truly unobscured area. The left desktop nav is outside the canvas, so do not double-count its 240 px width; the current corrected left map padding is 32 px and right panel padding is 452 px.
6. Desktop inspector (`lg`) must start at the top of its host and use one scrolling body. Mobile alone uses the bottom sheet.
7. Prevent top controls from sliding under the open panel.
8. Keep search, Conditions/Hatches, month control, close, all five tabs, zoom, attribution, and river selection working.
9. Maintain 44 px touch targets and reduced-motion handling.
10. Preserve offline PWA behavior and no third-party runtime requests.

## Acceptance verification required

Freshly validate at:

- 1440×900
- 1024×768
- 390×844

For each relevant viewport, assert and visually inspect:

- Tennessee/county/place context is recognizable but not dominant.
- East Fork Stones is in the correct Middle Tennessee area and centered in exposed map space.
- Orange selected geometry is clearly visible.
- Non-selected waters are subdued.
- No artificial connector segments or duplicated spaghetti geometry.
- Desktop panel has no blank upper region.
- Only panel body scrolls; page does not.
- Mobile sheet is visible and functional.
- Search and selection work.
- Close button and all five tabs are reachable.
- Zoom and attribution controls clear the panel.
- No console/page errors, failed local assets, worker MIME errors, or third-party map requests.
- Values remain: 37 Poor, 19.3 cfs, ideal 50–400 cfs, temperature unavailable.

Then run:

```bash
pnpm --filter @trout/web typecheck
pnpm --filter @trout/web test
pnpm --filter @trout/web build
pnpm --filter @trout/e2e e2e -- --project=web
```

Check PWA precache entries and the 25 MB size budget. Only after all acceptance points pass should you commit/push/deploy—and only if the user explicitly asks you to publish.
