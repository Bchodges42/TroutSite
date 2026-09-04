# Waterbody geometry contract

This contract is the handoff between the inventory, geometry production, catalog production, and the map UI. The inventory is authoritative for names and IDs; upstream data sources are authoritative for coordinates. Never trace from the small reference artwork.

## Canonical feature model

Every selectable feature is one GeoJSON `Feature` in `apps/web/public/atlas/rivers.geojson`. The filename is historical: it is the interactive waterbody source for lines, polygons, and temporary points.

Required `properties` on every feature:

| Property        | Type                               | Rule                                                                                                                                                                                                       |
| --------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`            | string                             | Unique kebab-case stable ID. Must equal the corresponding stream catalog ID and inventory `proposedFeatureId`.                                                                                             |
| `name`          | string                             | Canonical human display name. Do not encode reach aliases into a new ID.                                                                                                                                   |
| `waterbodyType` | string                             | One of `river`, `creek`, `stream`, `tailrace`, `lake`, `pond`, or `reservoir`.                                                                                                                             |
| `source`        | string                             | Space-delimited provenance tokens, with the primary geometry source first; examples: `nhd-hr`, `tiger-linear`, `usgs-topo-trace`, `twra-winter-ponds`. Never use the reference image as a geometry source. |
| `approximate`   | boolean                            | `false` for a verified authoritative geometry; `true` for a deliberately approximate trace. Omission is not allowed.                                                                                       |
| `labelAnchor`   | `[number, number]`                 | `[longitude, latitude]` in EPSG:4326, inside/on the represented feature and visually useful at the first label zoom.                                                                                       |
| `bounds`        | `[number, number, number, number]` | `[west, south, east, north]` covering every coordinate of the feature.                                                                                                                                     |

Retain existing useful metadata (`regionId`, `gaugeIds`, `crs`, `coordinateOrder`, `partCount`, `vertexCount`) when the pipeline supplies it. Those fields do not replace any required field above.

Geometry requirements:

- Linear water uses `LineString` or `MultiLineString`; connected reaches should not be split merely to simplify files.
- Still water uses `Polygon` or `MultiPolygon`. Rings must be closed, non-self-intersecting, and follow GeoJSON right-hand-rule conventions.
- Coordinates are longitude/latitude in EPSG:4326. No projected coordinates, swapped axes, or screen-space traces.
- The geometry must describe the named waterbody/reach, not its county clip, bounding box, label footprint, or nearby water.
- Simplification must retain recognizable coves and tributary arms at the map's first visible zoom without exceeding the offline budget.
- A Point is only a temporary location fallback. The 13 existing `twra-winter-ponds` Points are replaced in place by polygons under the same IDs.

## File and catalog placement

1. Match or add the canonical record in `packages/content/streams/tn/<id>.yaml`.
2. Ensure `apps/web/public/v1/streams.json` exposes the same `id`, `name`, and `waterbodyType` through the normal build. Do not hand-edit generated snapshots.
3. Put the one selectable geometry in `apps/web/public/atlas/rivers.geojson` with all required properties.
4. If a promoted feature came from `apps/web/public/atlas/lakes.geojson`, remove it from the passive lake build output once the interactive copy is authoritative. The UI supplies the base water fill from the interactive source, so a duplicate is unnecessary.
5. Regenerate `apps/web/src/features/map/riverIndex.json` from the approved interactive geometry. It must carry the same ID, name, label anchor, and bounds used for labels and camera fitting.
6. Update the checklist row with the actual geometry source and verification results.

No label-only feature is permitted. A catalog row with no geometry and a geometry with no catalog row both fail the contract.

## ID and alias rules

- Reuse an existing catalog ID whenever the inventory identifies one.
- Replace the 13 winter-water Points in place; never suffix them with `-polygon`, `-lake-2`, a source name, or a year.
- IDs never change because a better geometry source is found.
- Different named reaches may remain separate IDs when the product already models them separately (`duck-river-tailwater` vs `duck-river-lower`).
- Same-name but different waters receive geographic qualification (`wolf-river-west-tennessee` is not `wolf-river-fentress`).
- Alternate punctuation, abbreviations, reservoir/lake wording, and the reference's truncated labels are aliases on one canonical feature, not duplicate rows.

## UI layer and interaction contract

The interactive source uses `promoteId: "id"`, which makes the same feature-state contract work for every geometry type.

Polygon order is:

1. `rivers-water-base` — quiet water fill that remains legible when unassessed.
2. `rivers-water` — condition/selection/dim wash from feature state.
3. `rivers-water-shore` and `rivers-hatch-wash` — hover/selected shoreline and seasonal treatment.
4. `rivers-water-hit` plus its transparent 18 px edge expansion — full-surface pointer/touch target.
5. Existing HTML waterbody label — same typography and collision system as current lake/pond labels.

Lines retain casing → condition interior → selection/hatch → 28 px hit line. Points retain their temporary still-water ring and 44 px minimum hit target only until polygons replace them.

The selection callback is ID-only. Therefore the ID must resolve through the catalog before a feature can open the shared inspector. Species and assessed-only filters act on that same catalog ID; hidden features stay noninteractive. A river crossing a polygon wins when the pointer is within the line's hit distance, while open polygon water selects the polygon.

All visual layers remain below HTML place/water labels. The base/condition fills are translucent and cannot introduce roads, boundary, place-label, or terrain occlusion.

## Three reference rows

These are the acceptance examples, not permission to invent geometry in this UI branch.

| Case                       | Feature ID           | Current source state                                                    | Crew action                                                                                                      | Acceptance                                                                               |
| -------------------------- | -------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Authoritative lake polygon | `center-hill-lake`   | Passive MultiPolygon exists in `lakes.geojson`; no matching catalog row | Confirm authoritative/NHD provenance, add catalog row, promote once to interactive source                        | Visible base + condition wash, shared label, pointer/touch opens Center Hill fiche       |
| Traced pond                | `cameron-brown-lake` | Cataloged `twra-winter-ponds` Point                                     | Trace from an approved parcel/imagery or hydro source; replace Point under same ID; set `approximate` truthfully | Polygon replaces ring, label remains unchanged, fiche/species behavior remains unchanged |
| Existing creek line        | `beaverdam-creek`    | Catalog + YAML + interactive MultiLineString already agree              | Add the required `waterbodyType` and `approximate` properties during the next geometry build                     | Existing casing, condition, hit target, label, and fiche continue to pass                |

The UI architecture is exercised with a test-only polygon fixture under an existing catalog ID. It proves layer state and selection without shipping fabricated production geometry.

## Crew checklist format

Each inventory row must produce one checklist record:

```json
{
  "featureId": "center-hill-lake",
  "inventoryName": "Center Hill Lake",
  "geometrySource": "nhd-hr",
  "catalogState": "verified",
  "geometryState": "verified",
  "labelState": "verified",
  "pointerState": "verified",
  "touchState": "verified",
  "zoomState": "verified",
  "themeState": "verified",
  "verificationState": "PASS",
  "notes": ""
}
```

Allowed verification states are `PENDING_CATALOG`, `PENDING_GEOMETRY`, `PENDING_QA`, `PASS`, and `UNRESOLVED`. `UNRESOLVED` requires a reason and source search notes; it must never be replaced with guessed coordinates.

## Final acceptance gate

- Every inventory ID occurs exactly once in the stream catalog, YAML content, interactive GeoJSON, river index, and checklist.
- Every line/polygon visually matches its authoritative location at state, regional, and local zooms.
- Every label is readable at its defined first zoom, collision-culls cleanly, and uses existing water typography.
- Pointer and touch select visible geometry, open the same fiche, preserve the species filter, and work with the atlas panel closed.
- Hover, selected, unselected, dimmed, hidden, hatch, and unassessed states are distinguishable in Daybreak and Nightfall.
- No feature layer obscures roads, boundaries, place labels, terrain, or other water.
- No `UNRESOLVED`, label-only, Point-placeholder, or duplicate entries remain at release acceptance.
- Typecheck, build, unit, and complete browser suites pass against the merged production assets.
