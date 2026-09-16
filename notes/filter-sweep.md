# MapLibre filter sweep — apps/web/src (fix/map-hit-selection @ 07d83bb, unfixed origin/main)

Scope: every MapLibre `filter:` property, `setFilter()` call, and dynamic filter array under
`apps/web/src`. maplibre-gl version: `^6.7.0` (`apps/web/package.json:27`). Under maplibre v6 /
@maplibre/maplibre-gl-style-spec 26.4.1, any filter containing an expression operator compiles as a
pure expression; legacy `$type`/`$id` tokens are then evaluated as ordinary property lookups
(`"$type"` property does not exist) and yield `undefined`/false.

## 1. MIXED filters — BROKEN, fix these (ranked)

There is exactly **one mixed construction** (one `setFilter` call site). It breaks **4 layers**
(the entire pointer hit surface of the map).

### TennesseeMap.tsx:446 — `setFilter(['all', baseFilter, tierFilter])`

Verbatim (`apps/web/src/features/map/TennesseeMap.tsx:431-456`):

```ts
const tierHitLayers: Array<[string, ['==', '$type', 'LineString' | 'Polygon' | 'Point']]> = [
  ['rivers-hit', ['==', '$type', 'LineString']],
  ['rivers-water-hit', ['==', '$type', 'Polygon']],
  ['rivers-water-hit-outline', ['==', '$type', 'Polygon']],
  ['rivers-point-hit', ['==', '$type', 'Point']],
];
let lastHitTier: 0 | 1 | 2 | null = null;
const updateTierHitFilters = (fromZoom = false) => {
  const z = map.getZoom();
  const tier: 0 | 1 | 2 =
    z >= MAP_ZOOM_TIERS.reference.start ? 2 : z >= MAP_ZOOM_TIERS.standard.start ? 1 : 0;
  if (lastHitTier === tier) return;
  lastHitTier = tier;
  const tierFilter = catalogTierFilter(z);
  for (const [layer, baseFilter] of tierHitLayers) {
    if (map.getLayer(layer)) map.setFilter(layer, ['all', baseFilter, tierFilter] as never);
  }
```

Payload traced end-to-end:

- `baseFilter` = legacy fragment from `tierHitLayers` (lines 431-436), e.g. `['==', '$type', 'LineString']`.
- `tierFilter` = `catalogTierFilter(z)` from `apps/web/src/features/map/mapStyle.ts:152-166`:

```ts
return [
  'any',
  ['!', ['has', 'displayTier']],
  ['match', ['get', 'displayTier'], tiers, true, false],
] as unknown as FilterSpecification;
```

  with `tiers` = `['featured','standard','reference']` at zoom >= 9.0 (`MAP_ZOOM_TIERS.reference.start`),
  `['featured','standard']` at zoom >= 7.2, else `['featured']`.

Why broken: the compound contains expression operators (`all`, `any`, `!`, `has`, `match`, `get`),
so maplibre skips the legacy→expression conversion and compiles the whole array as one expression.
`'$type'` becomes a literal property-key string; `['==', '$type', 'LineString']` evaluates
`feature.properties["$type"] === "LineString"` → always false. Result: every `['all', ...]`
evaluates false → all four hit layers match zero features.

Blast radius: these are the ONLY layers queried by `hit()` (TennesseeMap.tsx:483-515, layer list at
492-497), which drives `mousemove` hover (710-725), `touchend` selection (728-740), and `click`
selection (744-770). All map clicks, hover, and touch selection are dead. The `rivers-hit` guard at
484 (`if (!map.getLayer('rivers-hit')) return null;`) passes — the layer exists, its filter just
never matches.

Proposed fix — convert the four base fragments to expression form so the compound is pure
expression (lines 431-436; the `['all', ...]` at 446 then needs no change):

```ts
const tierHitLayers: Array<[string, ['==', ['geometry-type'], 'LineString' | 'Polygon' | 'Point']]> = [
  ['rivers-hit', ['==', ['geometry-type'], 'LineString']],
  ['rivers-water-hit', ['==', ['geometry-type'], 'Polygon']],
  ['rivers-water-hit-outline', ['==', ['geometry-type'], 'Polygon']],
  ['rivers-point-hit', ['==', ['geometry-type'], 'Point']],
];
```

`['geometry-type']` returns `'Point'` for MultiPoint, `'LineString'` for MultiLineString,
`'Polygon'` for MultiPolygon — identical semantics to legacy `$type` (see the existing comment at
mapStyle.ts:33-34 that "in MapLibre $type, 'Point' also covers MultiPoint").

Call sites that install this broken payload (all go through line 446):
- `map.on('load', ...)` → `updateTierHitFilters()` — TennesseeMap.tsx:465
- `map.on('style.load', ...)` → `lastHitTier = null; updateTierHitFilters()` — TennesseeMap.tsx:476-480
- `map.on('zoomend', () => updateTierHitFilters(true))` — TennesseeMap.tsx:482

## 2. LEGACY-but-safe standalone filters — leave alone (inventory so the fixer does not touch them)

Defined once in `apps/web/src/features/map/mapStyle.ts` (each is a complete filter in pure legacy
form — a single `['==','$type',X]` comparison, no expression operators — so maplibre's legacy
conversion path handles them cleanly; NOT broken):

- mapStyle.ts:31 — `const LINES_ONLY = ['==', '$type', 'LineString'] as unknown as FilterSpecification;`
- mapStyle.ts:32 — `const POLYS_ONLY = ['==', '$type', 'Polygon'] as unknown as FilterSpecification;`
- mapStyle.ts:35 — `const POINTS_ONLY = ['==', '$type', 'Point'] as unknown as FilterSpecification;`

All 18 static usages (`filter:` in layer configs inside `atlasStyle()`):

| Line | Layer id | Constant |
|---|---|---|
| mapStyle.ts:294 | `rivers-water-base` (fill) | POLYS_ONLY |
| mapStyle.ts:313 | `rivers-water` (fill) | POLYS_ONLY |
| mapStyle.ts:343 | `rivers-water-shore` (line) | POLYS_ONLY |
| mapStyle.ts:380 | `rivers-hatch-wash` (fill) | POLYS_ONLY |
| mapStyle.ts:410 | `rivers-casing` (line) | LINES_ONLY |
| mapStyle.ts:456 | `rivers-base` (line) | LINES_ONLY |
| mapStyle.ts:492 | `rivers-class-outline` (line) | LINES_ONLY |
| mapStyle.ts:532 | `rivers-interior` (line) | LINES_ONLY |
| mapStyle.ts:570 | `rivers-unassessed` (line) | LINES_ONLY |
| mapStyle.ts:597 | `rivers-selection` (line) | LINES_ONLY |
| mapStyle.ts:622 | `rivers-hatch-halo` (line) | LINES_ONLY |
| mapStyle.ts:676 | `rivers-hit` (line) | LINES_ONLY |
| mapStyle.ts:687 | `rivers-water-hit` (fill) | POLYS_ONLY |
| mapStyle.ts:694 | `rivers-water-hit-outline` (line) | POLYS_ONLY |
| mapStyle.ts:704 | `rivers-point-halo` (circle) | POINTS_ONLY |
| mapStyle.ts:732 | `rivers-point` (circle) | POINTS_ONLY |
| mapStyle.ts:797 | `rivers-point-center` (circle) | POINTS_ONLY |
| mapStyle.ts:817 | `rivers-point-hit` (circle) | POINTS_ONLY |

Test pin (do not break silently): `apps/web/test/fieldwork.test.tsx:89-92` asserts

```ts
expect(layers.find((layer) => layer.id === 'rivers-water-hit')).toMatchObject({
  type: 'fill',
  filter: ['==', '$type', 'Polygon'],
});
```

This pins the legacy literal. Optional hardening of these constants to
`['==', ['geometry-type'], ...]` is NOT required for the bug fix and would require updating this
assertion in the same commit.

## 3. Pure EXPRESSION filters — safe, no change

- `apps/web/src/features/map/qa/QaPanel.tsx:107` — `filter: ['==', ['get', 'isLine'], true]` (layer `qa-defect-lines`)
- `apps/web/src/features/map/qa/QaPanel.tsx:120` — `filter: ['!=', ['get', 'isLine'], true]` (layer `qa-defect-halo`)
- `apps/web/src/features/map/qa/QaPanel.tsx:131` — `filter: ['!=', ['get', 'isLine'], true]` (layer `qa-defect-points`)
- `mapStyle.ts:152-166` `catalogTierFilter` — `['any', ['!', ['has','displayTier']], ['match', ['get','displayTier'], tiers, true, false]]` — pure expression, correct standalone. Only poisonous when combined with a legacy fragment (section 1).

## 4. All other `$type` / `$id` occurrences under apps/web/src

Grep results (fixed-string, whole `apps/web/src`):

- `$id`: **zero occurrences** anywhere under `apps/web/src`.
- `$type`:
  - mapStyle.ts:30 (comment), 31, 32, 34 (comment), 35 — the LEGACY-safe constants above (standalone-legacy, safe).
  - TennesseeMap.tsx:431, 432, 433, 434, 435 — the legacy fragments that become MIXED at line 446 (broken; fixed by section 1).
- `apps/web/test/fieldwork.test.tsx:91` — standalone-legacy literal inside a test assertion (safe as written; see pin note above).

No other file under `apps/web/src` contains `$type` or `$id`.

## 5. setFilter call sites and payloads, traced end-to-end

MapLibre `setFilter` call sites under `apps/web/src`: exactly **one** — TennesseeMap.tsx:446
(payload fully traced in section 1). (`StockingPage.tsx:142` defines an unrelated React URL-param
setter named `setFilter(key, value)` — not maplibre; ignore.)

Non-`setFilter` filter carriers, for completeness:

- Static style JSON: the 18 `filter:` usages in `atlasStyle()` (section 2) + none anywhere else.
  Layers added at runtime with NO filter at all (nothing to sweep): `rivers-flow-arrows`
  (mapStyle.ts:651-670, source `flow-arrows`), gauges/stocking/attractors layers
  (mapStyle.ts:829-910, visibility toggled via `setLayoutProperty` at TennesseeMap.tsx:1241-1244),
  roads layers (mapStyle.ts:928-946), topo layers (mapStyle.ts:978-1021), network creek layers
  (`clusterLayerSpec`, networkClusters.ts:413-442, added at 493-496), QA reference layers
  (qa/reference.ts:62-84), QA defect layers (QaPanel.tsx:103-138, expression filters above).
- `queryRenderedFeatures` consumers (no filter args, layer-scoped only): TennesseeMap.tsx:486
  (hit layers), 696/751 (overlay hit layers), 807 (network-minor-* tooltip layers).
- Zoom/season/species conditionals: species visibility is feature-state `hidden` (paint expressions
  + `setFeatureState` at TennesseeMap.tsx:224-252), NOT filters. Zoom tiering of hit layers is the
  only filter mutation (line 446).

## Totals

- MIXED (broken): 1 construction — TennesseeMap.tsx:446 — affecting 4 layers
  (`rivers-hit`, `rivers-water-hit`, `rivers-water-hit-outline`, `rivers-point-hit`).
- LEGACY standalone (safe, leave alone): 3 constants (mapStyle.ts:31/32/35) across 18 static layer
  usages; plus 1 test assertion pin (fieldwork.test.tsx:91).
- EXPRESSION (safe): 3 static filters (QaPanel.tsx:107/120/131) + `catalogTierFilter`
  (mapStyle.ts:152-166, safe standalone).
- `$id` occurrences: 0. `$type` occurrences outside the above: 0.
