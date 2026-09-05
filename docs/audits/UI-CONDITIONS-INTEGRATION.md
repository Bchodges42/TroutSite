# Audit — UI layers, condition scores, and the verified-geometry integration path

**Session:** lead frontend/map + condition-data integration engineering
**Base:** `main` @ `55ac47e` · **Branch:** `fix/ui-conditions-integration`
**Scope kept:** map control files, `apps/web/src/lib` cache code, `packages/contracts` schemas/tests, `apps/api` snapshot production, condition fixtures/tests, e2e, the regional-geometry integration script, and this document. Canonical geometry coordinates, `riverIndex.json` (regenerated only by the documented script), regional staging files, regional catalog YAMLs, and regional audit reports were not touched.

---

## 1. Root cause — Terrain/Roads toggles closed the Layers menu

`MapControlGroup` rendered the Layers popover (`.layer-picker`) as a **sibling** of the toolbar it ref-checks (`groupRef` = `.map-fab-group`), while the document-level `mousedown` handler closed the panel whenever the press target was outside `groupRef`. Every press **on the panel's own inputs** therefore counted as an outside press:

```
pointerdown/mousedown on the Terrain checkbox (inside .layer-picker, outside .map-fab-group)
→ document mousedown handler calls onLayersToggle()
→ React unmounts the panel during the mousedown bubble phase
→ mouseup/click land nowhere; the checkbox never receives `click`/`change`
→ menu closed, layer not activated, URL unchanged
```

Verified live with an event log before the fix: `pointerdown(cap, inPicker:true) → mousedown(cap, inPicker:true) → mousedown(bub, pickerOpen:false)` — no `click`, no `change`.

**Fix** (`MapControlGroup.tsx`): outside-press containment is now checked against a ref on the **wrapper** `.map-fab-wrap`, which contains both the toolbar and the popover; dismissal listens on `pointerdown` with a `mousedown` fallback (touch pens/taps outside are covered). Escape (deferred to `#app-menu`), button-toggle, and focus-return behavior are unchanged.

Verified in the live UI and by e2e: Terrain and Roads activate/deactivate **with the panel staying open**; the checkbox state tracks the active style; Escape and outside press close intentionally with focus returning to the Layers button; keyboard (Space) and touch activation work; rapid toggle runs leave URL and live MapLibre style in agreement.

### Availability probes

`RiverMapPage` previously fetched the two manifests and trusted their shape. `apps/web/src/lib/atlasAvailability.ts` now probes reality:

- `/atlas/topo/manifest.json` — must parse as a manifest (bands + hillshade pattern/zooms); then **one real hillshade tile** (web-mercator tile under central Tennessee at the manifest's min zoom — formula cross-checked against the actual on-disk tile grid, e.g. `-89.5,36.6 @z10 → 10/257/399.webp`) must answer `HEAD`;
- `/atlas/roads-manifest.json` — must be well-formed and **every referenced road file** must answer `HEAD`;
- a manifest answered as HTML by the SPA fallback (missing file) or any failed probe disables the control instead of shipping a broken layer.

## 2. Root cause — the white/gray rectangle over East Tennessee in Nightfall

Layered causes, all addressed:

1. **Assets (already fixed pre-session):** the hillshade tiles on disk are shadow-only **alpha** WebP (VP8L, alpha bit verified per tile) clipped to TN+3 km — the raw material for the rectangle is gone.
2. **Stale runtime cache (the persistence mechanism):** the service worker's `topo-cache` is **CacheFirst with a 90-day TTL**, and the tile scheme `hillshade/{z}/{x}/{y}.webp` is content-blind. Browsers that cached the pre-alpha opaque tiles would keep being served them for 90 days. `invalidateStaleTopoCache()` (called by the terrain probe at map boot) compares the manifest's `generated` stamp with a stored one and **purges `topo-cache` when the asset build changes**.
3. **The theme workaround that hid valid terrain:** Nightfall set `reliefOpacity: 0` (hillshade `visibility: none`) because of the old opaque tiles. With verified alpha tiles + cache invalidation, Nightfall now renders terrain relief (`reliefOpacity: 0.45`) as subdued dark valley shading; Daybreak keeps 0.28.

Verified: statewide zoom, East Tennessee regional zoom, local zoom z9.8 (screenshots in this session's record), Daybreak + Nightfall, terrain on/off, roads on/off, theme changes while terrain is active. Contours, roads, counties, state boundary, water, and labels all remain legible; raster opacity stays ≤ 0.45; the e2e pixel spec asserts Nightfall ground inside East Tennessee is never a light-gray wash at local zoom.

## 3. Root cause — every water showed "Not assessed"

There was **no ID-join bug and no schema stripping**. The zod schemas parsed every snapshot file cleanly, and all current-era ID sets agree exactly. The failure was **stale data eras served through three disconnected production layers**:

| Layer | State before this session |
|---|---|
| `packages/content` YAML catalog | 128 waters, correct (species on 100, 23 lake + 5 pond) |
| `packages/content/dist/pack` (built pack) | **stale: 92 waters**, no lakes/ponds |
| `apps/api` SQLite DB | **stale: 92 waters**; migrations 004 (species) and 005 (stocking precision) **pending**; `streams.waterbody_type` CHECK from a pre-lake/pond revision of `001_init.sql` rejected `lake`/`pond` |
| `apps/web/public/v1/*` (what production/preview serves) | rewritten **hourly by the pm2 cron from the stale DB**: 92 legacy condition rows with `score.assessed` missing and 65 zeros |
| `apps/web/fixtures/data/v1/*` (dev fixtures) | 128 streams but only 72 condition snapshots, all assessed-positive |

Semantics of the legacy rows: `statusForScore(0, hasData, assessed===undefined)` → `no-data` → "Unassessed". With 65 of 92 rows legacy zeros and 36 waters missing entirely, most of the catalog presented as "Not assessed"; every *real* zero was indistinguishable from "cannot assess"; and none of the species decisions existed. The "128 streams / 105 conditions" earlier inspection matches the moment the fixture-era stream list (128) met an intermediate 105-row conditions file — e.g. the **leftover `trout-fieldwork-20260904` dev server still bound to port 5197** serves exactly that mix today. That server belongs to another checkout and was left untouched; the e2e port is now overridable (`FIELDWORK_PORT`) so this checkout's suite can run against its own preview.

**Fixes (the whole production chain):**

1. `packages/content` rebuilt → pack dist = 128 waters (validated).
2. **`apps/api/migrations/006_streams_waterbody_types.sql`** — rebuilds the legacy `streams` table with the current six-type CHECK (SQLite cannot ALTER a CHECK), preserving every row/column explicitly; 004+005 apply on top.
3. DB reseeded from the catalog: **128 streams, 100 with species**; `apps/api/dist` rebuilt.
4. Snapshot job re-run: `public/v1/streams.json` = **128 rows**, `public/v1/conditions/latest.json` = **128 rows — 31 `assessed:true` (4 of them real zeros ⇒ Poor), 97 `assessed:false`, 0 legacy**; species carried; zero orphan IDs. The hourly cron now regenerates from the migrated DB, so this state is self-sustaining (verified: cron log shows the old 92-row output at 13:05, the new DB was seeded at 13:17).
5. Demo fixture generator (`generate-fixtures.mjs`) extended with three semantic cases, all scored by the frozen `scoreConditions` model: **doe-river** (real clamped 0 → Poor, `assessed:true`), **obed-river** (temp-only readings → `assessed:false`), **collins-river** (in-range but ~10 h old → stale). Fixtures regenerated and schema-validated (73 snapshots; warmwater Harpeth deliberately has none).

**Preserved semantics (all covered by unit + e2e):** `assessed:true, value 0` ⇒ Poor · `assessed:false` ⇒ Unassessed (any numeric value) · no snapshot ⇒ Unassessed · stale assessment keeps its score and is *labeled* stale ("Stale · observed …", > 180 min reading age) · legacy positive scores without the field still score · legacy zero without the field stays Unassessed (never falsely Poor) · warmwater waters never wear a trout score · All-fish mode never relabels trout scores as a generic fishability (no fishability model exists; the field stays `undefined`).

## 4. Condition ID / count comparison (after the fix)

| Source | Rows | Assessed+ | Assessed− | Legacy | Duplicate IDs | Orphans |
|---|---|---|---|---|---|---|
| `packages/content/streams/tn/*.yaml` | 128 | — | — | — | 0 | 0 |
| `packages/content/dist/pack/streams.json` | 128 | — | — | — | 0 | 0 |
| `apps/web/public/atlas/rivers.geojson` | 128 | — | — | — | 0 | 0 |
| `apps/web/src/features/map/riverIndex.json` | 128 | — | — | — | 0 | 0 |
| `apps/web/public/v1/streams.json` | 128 | — | — | — | 0 | 0 |
| `apps/web/public/v1/conditions/latest.json` | 128 | 31 (4 real zeros) | 97 | 0 | 0 | 0 |
| `apps/web/fixtures/data/v1/streams` | 128 | — | — | — | 0 | 0 |
| `apps/web/fixtures/data/v1/conditions/latest.json` | 73 | 72 (+1 real zero) | 1 | 0 | 0 | 0 |

Cross-joins: catalog ⊅ geometry = ∅ · geometry ⊅ catalog = ∅ · catalog ⊅ riverIndex = ∅ · catalog ⊅ served streams = ∅ · condition IDs ⊅ stream IDs = ∅ · streams without snapshots = 55 in fixtures (lakes/ponds/warmwater/unplanned — by design), 97 `assessed:false` in production. No renamed or alias-mismatched IDs found in any current-era source.

## 5. Cache / service-worker changes

- **New:** `lib/atlasAvailability.ts#invalidateStaleTopoCache` — manifest-`generated`-keyed purge of the workbox `topo-cache` (CacheFirst) so rebuilt terrain assets replace stale opaque tiles. `vite.shared.ts` workbox config itself is unchanged.
- Snapshot serving (`NetworkFirst` for `/v1|/data`, no-store headers, Dexie fallback) was already correct and is unchanged; Dexie caches self-heal online because fresh network responses overwrite them.
- Verified the deployed cron/api pick up the migrated DB without restart (contracts + migrations read at process level; dist rebuilt for the next restart).

## 6. Style-swap state restoration

`TennesseeMap` now funnels every presentation update through a tokenized scheduler, split into two independent tokens:

- **swap token** — rapid Terrain/Roads/theme toggles: only the latest scheduled `setStyle` runs; pending swaps are cancelled by cleanup.
- **apply token** — after every style load/swap/props change, feature state is rewritten from `latest.current` for **all 128 features**: `selected`, `hover:false` (producer state is honestly reset after a swap; the next pointermove re-derives it), `dimmed:false`, `hidden`, `color`, `assessed`, `hatchActive`, `hatchColor`. The apply **re-arms on `idle` until `isStyleLoaded()` is real** (a diffed swap can skip `style.load`; a bare `idle` can fire early), capped at 30 re-arms.

Root-caused and fixed mid-session: the swap closure compared its token against the **apply** counter (copied from the earlier single-token version), so swaps silently aborted whenever the counters had diverged — Terrain activation worked in some page states and not others. Both guards now use `swapToken`; the apply path keeps `applyToken`.

Debug/verification seams added (dev-only or inert): `window.__troutMap` (dev), and the container dataset attributes `data-map-sources`, `data-map-layers`, `data-map-selected` — so tests assert the **live MapLibre style**, not the URL. Verified: condition colors, `assessed` state, selection, labels/markers, hit layers, and the active inspector selection survive terrain/roads/theme swaps; camera continuity is untouched.

## 7. Regional geometry integration

Script: **`apps/web/scripts/integrate-verified-atlas.mjs`** (pure functions exported for tests; CLI runnable directly).

**Post-merge command (from the repo root):**

```bash
node apps/web/scripts/integrate-verified-atlas.mjs [--dry-run]
```

Requires the built content pack first (`pnpm --filter @trout/content build`). It consumes `apps/web/atlas-sources/verified/west-middle.geojson` and/or `east-southeast.geojson` when present; with neither it prints and exits 0 without touching canonical files; `--dry-run` validates and reports without writing.

**Live validation evidence:** with both staging files present mid-authoring (67 + 28 features), `--dry-run` exits 1 with actionable violations and writes nothing — among them a **cross-file duplicate id** (`tennessee-river` staged in both files), **`waterbodyType: "reservoir"`** (not in the frozen contract enum; the catalog records these waters as `lake`), **eight features whose coordinates are Polygon-shaped but labeled `MultiPolygon`** (invalid GeoJSON nesting — rejected by the depth check, never misread as positions), **bounds that do not cover every coordinate** (`reelfoot-lake`, `mississippi-river`), and **four waters with no catalog record in the built pack yet** (`normandy-lake`, `reelfoot-lake`, `woods-reservoir`, `great-falls-lake` — their catalog YAMLs are staged but not yet merged/built). The staging sessions own these fixes; the script will pass once its inputs satisfy the contract.

Contract enforced (violations ⇒ exit ≠ 0, canonical files untouched):

- required properties `id`, `name`, `waterbodyType`, `source`, `approximate`, `labelAnchor`, `bounds`; kebab-case stable `id`; **matching catalog record** (id and waterbodyType; name mismatch warns, catalog name wins);
- geometry validity per class (lines for river/creek/tailrace; polygons or verified point anchors for lake/pond), non-empty coordinates, finite values, **longitude-first order** (swap detection from Tennessee magnitudes), **bounds covering every coordinate**, bounds sanity, TN-area sanity;
- **topology, not just valid GeoJSON:** polygon area / line length floors; area/length compared against staged `sourceAreaM2`/`sourceLengthM` (± declared tolerance) and against the canonical feature (loss warnings); label anchor inside its polygon / within 250 m of its line; **duplicate ids within and across staging files**; **duplicate NHD Permanent_Identifier / GNIS ids** across staging (format-validated where carried; NHD-sourced features without one warn); **unexplained line endpoints** (must meet another staged/canonical reach endpoint, a lake edge, a wide-water polygon edge, or the TN boundary buffer — `allowOpenEnds:true` documents genuine exceptions); **river↔lake crossings** (a reach may end at a lake edge, not pass through its interior — `throughLakeIds` declares verified exceptions); **lake↔dam and dam↔tailwater alignment** where `damAnchor`/`upstreamLakeId` metadata is declared;
- merge is **replace-by-stable-id** (never appends a second feature with a live id); deterministic id-sorted output; regenerated `riverIndex.json` (same derivation as `regenerate-river-index.mjs`);
- **duplicate-lake prevention:** a staged lake replaces the passive twin in `lakes.geojson` by id (removed and reported), so an interactive lake can never also render as a passive lake;
- prints before/after feature counts, replaced/appended ids, removed twins, and both coverage reports (catalog records without geometry; geometry ids without a catalog record).

**Condition applicability vs. continuity:** the merge replaces geometry per id and copies catalog identity only — a tailwater assessment can never be smeared across an adjacent lake or base-water corridor, because scores join by id and waterbodyType must match the catalog record. Geographic continuity fixes and assessment scope are deliberately independent.

## 8. Tests run and results

| Suite | Result |
|---|---|
| `pnpm --filter @trout/web typecheck` | green |
| `pnpm --filter @trout/web test` (vitest) | **161 passed** (incl. 13 control-group, 22 staging-validator, 11 availability, updated Nightfall-style) |
| `pnpm --filter @trout/web build` + size budget | green (9.56 MB / 25 MB, topo excluded) |
| `pnpm --filter @trout/contracts test` | **88 passed**, coverage gate met (incl. new `readingFreshness.test.ts`, corrected stale waterbodyType expectation) |
| `pnpm --filter @trout/api test` | **56 passed** (migration count updated for 006) |
| `pnpm e2e` fieldwork suite (`FIELDWORK_PORT=<port>`) | **42 passed** — 29 existing (incl. the East-TN-rectangle pixel spec) + 13 new (layers activation/keyboard/outside/reload/back-forward/theme/rapid toggles, Nightfall terrain pixels, style-state restoration, all six condition presentations, catalog-geometry join) |

New/updated test files: `apps/web/test/{map-control-group,atlas-integration,atlas-availability}.test.*`, `apps/web/test/fieldwork.test.tsx` (Nightfall expectation updated to the new reality), `packages/contracts/test/{readingFreshness,schemas}.test.ts`, `apps/api/test/migrations.test.ts` (count), `e2e/fieldwork/layers-conditions.spec.ts` (new), `e2e/fieldwork.config.ts` (port override).

## 9. Commits

See `git log fix/ui-conditions-integration ^main` — one commit per concern (layers fix + probes, terrain/cache, style-swap restoration, conditions data chain, fixtures, integration script, tests, this document).

## 10. Remaining issues (facts only, no speculation)

1. **Port 5197 is occupied by the `trout-fieldwork-20260904` checkout's dev server** serving a pre-integration tree (128 streams / 105-row legacy conditions). It belongs to another session's checkout and was left running; anything pointed at 5197 will keep seeing stale data. The fieldwork e2e port is now overridable via `FIELDWORK_PORT`.
2. **The pm2 `trout-api`/`trout-cron` processes predate the rebuilt `apps/api/dist`** — they work correctly today because migrations live on disk and `@trout/contracts` resolves to the workspace build, but they should be restarted (`pm2 restart trout-api trout-cron`) at the next deploy window to run the current dist.
3. **The 4 real-zero (Poor) assessments in production come from live gauge readings**; they will move as readings move. 97 of 128 waters are honestly `assessed:false` because their gauges returned no usable flow/stage in the current snapshot window.
4. **`terrainClip.json` is an orphan** (no importer); it was not referenced by any style code and was left in place.
5. **First-load watchdog:** on a cold dev-server transform the 15 s map watchdog can fire before the first `load` (the fallback's "Try loading the map again" recovers immediately). Production builds were not affected in any observed run. Left as-is; noted for the next UI pass.
6. **Regional staging files do not exist yet**; the integration script is verified by CLI smoke test + 21 unit tests against synthetic staging data, and must be re-run for real when the verified files land (command in §7).
