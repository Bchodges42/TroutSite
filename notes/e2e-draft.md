# e2e draft — map hit-selection (fix/map-hit-selection)

Deliverable: `e2e/fieldwork/map-hit-selection.spec.ts` (drafted against unfixed `origin/main` @ 07d83bb).
Scope of edits: only `e2e/fieldwork/`. Apps/web source untouched.

## What the spec proves

1. **Canvas hit-selection → selection state.** Jumps the live map (z 10.5) over the Caney Fork
   centerline, computes a click pixel from the feature's real rendered geometry (ranked by the
   feature's `labelAnchor`, verified with the same ±5px `queryRenderedFeatures` box the app's
   `hit()` uses, and checked that the bare canvas — not a label/QA panel — is under the point),
   then asserts:
   - URL gains `river=caney-fork-river` and `tab=Water`
   - `role="dialog"` (drawer) with name /Caney Fork River/ becomes visible, heading "Caney Fork River"
   - `[data-testid="river-map"]` gets `data-map-selected="caney-fork-river"`
2. **Hover cursor.** Moving the mouse onto the same pixel sets the maplibre canvas inline
   `cursor: pointer` (asserted via `toHaveCSS`, which reads computed style).

Determinism: `page.emulateMedia({ reducedMotion: 'reduce' })` before goto (map style + fitBounds
duration honor it), camera via `jumpTo` + one `idle` wait, pixel search retries across an extra
`idle`, no screenshots, workers already serialized to 1 in the playwright config.

## How to run it

```bash
pnpm -r build                                                  # dists (config + globalSetup need them)
pnpm --filter @trout/e2e exec playwright install chromium      # once
pnpm --filter @trout/e2e exec playwright test --project=fieldwork -g "hit-selection\|centerline"
```

**Server URL is not env-configured.** `e2e/playwright.config.ts` hardcodes `PORTS.web = 4173`;
the `fieldwork` project gets `baseURL: http://127.0.0.1:4173`, and the config's `webServer` array
boots `pnpm --filter @trout/web preview --host 127.0.0.1 --port 4173` (plus marketing/admin/api
servers — all four start even for one project). `globalSetup` additionally rebuilds web as the
deterministic **fixture flavor** (`pnpm --filter @trout/web build:fixtures`), which is what serves
`/v1/streams` etc. Prod build ⇒ `qaDiagnostics()` (`import.meta.env.DEV || ?qa=1`) is satisfied
only by the `?qa=1` param — the spec always passes it.

## Selectors / params used, and where they come from

| Thing | Value | Source |
|---|---|---|
| qa handle | `window.__troutMap` (maplibre Map) | `apps/web/src/features/map/TennesseeMap.tsx` — assigned at map construction; re-exposed in `map.on('load')` when `qaDiagnostics()` (`?qa=1` in prod builds). Same seam as `e2e/fieldwork/map-quality.spec.ts` |
| ready signal | `[data-testid="river-map"][data-map-ready="1"]` | set on map `load` in TennesseeMap |
| selection URL param | **`river`** (not `water`) | `RiverMapPage.tsx` `selectedId = params.get('river')`; `setRiver` → `update({ river: id, tab: 'Water', atlas: null }, false)` → pushState |
| drawer | `section#river-inspector`, desktop `layout="panel"` → `role="dialog"`, `aria-label="${stream.name} details"`, `<h2>` = `waterIdentity(name).name` | `RiverDrawer.tsx` (loading/empty state says "River details", so the name matcher doubles as a data-loaded wait) |
| selection mirror | `data-map-selected="<id>"` on the river-map container | TennesseeMap `applyRef.current` |
| hit layers | `rivers-point-hit`, `rivers-water-hit`, `rivers-water-hit-outline`, `rivers-hit` | TennesseeMap `hit()` + `tierHitLayers`; tier widening from `catalogTierFilter` / `MAP_ZOOM_TIERS` in `mapStyle.ts` (z ≥ 9.0 = all tiers hittable ⇒ spec uses z 10.5) |
| caney-fork feature | id `caney-fork-river`, `labelAnchor [-85.8437, 36.1176]` (GeoJSON property!), `displayTier "featured"`, MultiLineString, 195 vertices | `apps/web/public/atlas/rivers.geojson`; `labelAnchor` mirrored as `anchor` in `apps/web/src/features/map/riverIndex.json` (drives `.river-map-label` markers via `map.project(river.anchor)`) |
| hover cursor | `map.getCanvas().style.cursor = id ? 'pointer' : ''` on `mousemove`; `mouseout` clears | TennesseeMap mousemove handler (~line 710–725) |
| other URL params | `?qa=1` also opens the geometry QA panel (top overlay) — the spec's `elementFromPoint` check skips occluded pixels; `month=4` pins in-season; `v=map-hit-selection` is an inert tag (existing specs use the same pattern) | `RiverMapPage.tsx` (`qaOn`, `validMonth`) |

## Assumptions the fixer must verify

1. **Fixture catalog contains `caney-fork-river`** with name "Caney Fork River (Center Hill tailwater)"
   (geojson + riverIndex agree). The dialog matcher is a tolerant /Caney Fork River/ regex, but if
   the fixture flavor renames it, adjust.
2. **`month=4` keeps Caney Fork in-season** in the fixture trout calendar. Offseason only dims the
   line (hit unaffected), but verify `visibleIds` never *excludes* the water in default trout mode
   (`settings.speciesMode ?? 'trout'` on a fresh context ⇒ trout mode).
3. **Default Desktop Chrome viewport (1280×720) stays desktop** (≥901px) so the drawer is the
   `role="dialog"` panel, not the vaul bottom sheet.
4. **One `idle` after `jumpTo` suffices** for z10.5 tiles; the pixel search retries twice across
   additional idles anyway.
5. The spec asserts `tab=Water` (capital W) — that's what `setRiver` writes.

## addImage/updateImage guard — unit test sketch

`maplibre-gl` in apps/web is **6.7.0**, and in v6 `map.addImage()` on an existing name does **not**
replace — it fires an `error` event and returns (verified in
`apps/web/node_modules/maplibre-gl/dist/maplibre-gl.mjs`):

```js
addImage(e, t) { if (this.getImage(e)) { this.fire(new H(Error(`An image named "${e}" already exists.`))); return } ... }
```

So the second `rebuild()` run (new selection / theme / basemap while `flow-arrow` is still
registered — a *diffed* `setStyle` can keep images alive) fires an unhandled map error and the
theme glyph silently never updates. The guard at TennesseeMap.tsx ~:1141
(`if (icon) map.addImage(FLOW_ARROW_ICON, icon);` → `if (map.hasImage(id)) map.updateImage(id, icon) else map.addImage(id, icon)`) is the right fix.

**Unit framework/placement is NOT unclear:** apps/web uses **vitest** (`"test": "vitest run"`,
`apps/web/vitest.config.ts`), tests live in `apps/web/test/*.test.ts(x)`. I can't create files
outside `e2e/fieldwork/`, so the proposed file is given here in full. Recommend extraction
(testing the guard directly with a plain mock, no WebGL/jsdom map needed):

**Proposed: `apps/web/test/flow-arrow-icon-guard.test.ts`**

```ts
import { describe, expect, it, vi } from 'vitest';
import { FLOW_ARROW_ICON, registerFlowArrowIcon } from '../src/features/map/flowArrows';

// flowArrows.ts gains:
//   export function registerFlowArrowIcon(
//     map: { hasImage(id: string): boolean; updateImage(id: string, image: unknown): unknown; addImage(id: string, image: unknown): unknown },
//     icon: { width: number; height: number; data: Uint8ClampedArray },
//   ): void {
//     if (map.hasImage(FLOW_ARROW_ICON)) map.updateImage(FLOW_ARROW_ICON, icon);
//     else map.addImage(FLOW_ARROW_ICON, icon);
//   }
// and TennesseeMap's rebuild() calls registerFlowArrowIcon(map, icon) when icon !== null.

const ICON = { width: 56, height: 56, data: new Uint8ClampedArray(56 * 56 * 4) };

function mockMap(hasImage: boolean) {
  return { hasImage: vi.fn(() => hasImage), updateImage: vi.fn(), addImage: vi.fn() };
}

describe('flow-arrow icon registration (addImage/updateImage guard)', () => {
  it('adds the icon when the map does not have it', () => {
    const map = mockMap(false);
    registerFlowArrowIcon(map, ICON);
    expect(map.addImage).toHaveBeenCalledWith(FLOW_ARROW_ICON, ICON);
    expect(map.updateImage).not.toHaveBeenCalled();
  });

  it('updates instead of re-adding when the icon already exists (maplibre 6 addImage would fire an error event, not replace)', () => {
    const map = mockMap(true);
    registerFlowArrowIcon(map, ICON);
    expect(map.updateImage).toHaveBeenCalledWith(FLOW_ARROW_ICON, ICON);
    expect(map.addImage).not.toHaveBeenCalled();
  });
});
```

Alternative without extraction: `vi.mock('maplibre-gl')` with a fake `Map` class and render
`<TennesseeMap … />` (pattern exists in `apps/web/test/fieldwork.test.tsx`), asserting the fake
received `updateImage` on the second `rebuild()` — heavier, brittle against the full Map API
surface; extraction is preferred. (Note: a vitest file must NOT live in `e2e/fieldwork/` — the
e2e tsconfig/playwright `testMatch` would pick it up.)
