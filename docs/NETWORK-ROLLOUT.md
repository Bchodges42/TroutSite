# NETWORK-ROLLOUT — statewide NHD named-network, verification evidence (GEOQA)

Date: 2026-09-11 · Branch: `geoqa/statewide-verify` (integration of
`geonet/statewide-build` + `geomap/statewide-network`) · Environment:
`DEV_FIXTURES=1 pnpm --filter @trout/web dev`, Chromium 1440×900, zoom 11.5
per cluster (MapLibre `jumpTo` on a rendered network vertex nearest the cluster
centroid), state-zoom check at z 6.34.

## Verdict

**23/23 clusters GREEN.** Every cluster: manifest-driven on-demand fetch,
`network-minor-<id>` layer added, rendered feature count > 0, hover tooltip
populates with the real NHD creek name under the pointer, and **0** network
features render at state zoom (minzoom 9.6 gate holds statewide). All 23 files
fetched exactly once per page session (`__troutNetwork.fetchedOnce === true`).
Catalog rivers render at state zoom (1,252 features in viewport) and share the
viewport with network creeks in trout country (e.g. 0601aa Kingsport, 0602a
Hiwassee screenshots) — catalog paints on top as designed.

## Two integration defects found and fixed by this sweep

The two lanes had never run against each other's real artifacts (GEOMAP
developed against an untracked 2-cluster mock), so the statewide feature was
**silently dead** on the merged branch — fail-closed, no console error, no
render. Both fixes carry regression tests; both are cross-lane patches with
reasons recorded per the merge policy:

1. **Manifest field mismatch** — GEONET ships cluster extents as `bbox`;
   `parseNetworkManifest` required `bounds` → parse returned null → feature
   disabled. Fix: accept both (commit `geoqa(fix): parseNetworkManifest ...`).
2. **Cluster file path mismatch** — GEONET's manifest `file` is
   `network/<id>.geojson` (atlas-root relative); the loader prefixed
   `/atlas/network/`, so every fetch 404'd (`/atlas/network/network/...`).
   Fix: `clusterFileUrl` resolves the basename (commit `geoqa(fix): cluster file
URL ...`).

Sweep method note: the first 0601baa attempt placed the camera at the raw bbox
centroid — 22 km from the nearest named line (Smokies backcountry inside the
two-unit bbox) — and correctly rendered 0. The sweep center was moved onto the
network vertex nearest each centroid; the loader itself behaved identically.

## Per-cluster evidence

`rendered` = `queryRenderedFeatures` count on `network-minor-<id>` at z 11.5.
`hover` = tooltip text captured at a rendered creek coordinate (element
`[data-proof="network-hover"]`). Screenshots: `docs/reports/network-sweep/<id>.png`
with the tooltip visible on the map.

| id        | file              |          bytes |       lines | rendered | hover          | tooltip name              |
| --------- | ----------------- | -------------: | ----------: | -------: | -------------- | ------------------------- |
| 0505      | 0505.geojson      |      1,894,036 |       6,166 |      443 | yes            | Chestnut Creek            |
| 0511      | 0511.geojson      |        873,527 |       2,790 |      258 | yes            | Bays Fork                 |
| 0513aaa   | 0513aaa.geojson   |      3,064,026 |       9,869 |      637 | yes            | Little Spruce Creek       |
| 0513aab   | 0513aab.geojson   |      1,611,422 |       5,249 |      379 | yes            | Stewart Creek             |
| 0513ab    | 0513ab.geojson    |      1,762,387 |       5,636 |      254 | yes            | Cedar Creek               |
| 0513b     | 0513b.geojson     |      3,429,874 |      11,102 |      211 | yes            | Big McAdoo Creek          |
| 0601aa    | 0601aa.geojson    |      3,280,076 |      11,601 |      613 | yes            | Stidman Branch            |
| 0601abaaa | 0601abaaa.geojson |      3,242,213 |      12,301 |      879 | yes            | Webb Branch               |
| 0601abaab | 0601abaab.geojson |      3,369,424 |      12,300 |      858 | yes            | Webb Branch               |
| 0601abab  | 0601abab.geojson  |      1,081,998 |       3,854 |    1,546 | yes            | Stevens Creek             |
| 0601abb   | 0601abb.geojson   |      2,980,102 |      10,730 |      413 | yes            | Cove Creek                |
| 0601baa   | 0601baa.geojson   |      2,075,059 |       7,171 |      155 | yes            | Cloyd Creek               |
| 0601bab   | 0601bab.geojson   |      2,182,685 |       7,533 |      383 | yes            | Yellow Creek              |
| 0601bb    | 0601bb.geojson    |      3,330,613 |      11,416 |      586 | yes            | Rhea Branch               |
| 0602a     | 0602a.geojson     |      3,168,845 |      10,740 |      504 | yes            | Horton Branch             |
| 0602b     | 0602b.geojson     |        900,394 |       2,863 |      179 | yes            | Paul Branch               |
| 0603a     | 0603a.geojson     |      3,449,037 |      11,531 |      349 | yes            | Flint River               |
| 0603b     | 0603b.geojson     |      2,509,881 |       8,747 |      629 | yes            | Canerday Branch           |
| 0604a     | 0604a.geojson     |      3,665,248 |      12,631 |      629 | yes            | West Fork Big Bigby Creek |
| 0604b     | 0604b.geojson     |      2,627,378 |       9,184 |      555 | yes            | Halls Valley Branch       |
| 0801a     | 0801a.geojson     |      2,423,544 |       8,525 |      247 | yes            | RoEllen Creek             |
| 0801b     | 0801b.geojson     |      2,844,291 |      10,039 |      261 | yes            | Black Creek               |
| 0803      | 0803.geojson      |      1,137,217 |       4,130 |      551 | yes            | Old Senatobia Canal       |
| **total** | 23 files          | **56,903,277** | **196,108** |          | 23/23 verified |                           |

State-zoom gate: per cluster, `jumpTo(zoom 6)` → 0 network features rendered
across all `network-minor-*` layers (visual gate minzoom 9.6; fade completes
10.8). Statewide catalog check at z 6.34: 1,252 catalog river features rendered,
0 network features — the zoom separation the owner approved.

On-demand behavior: clusters load only when their padded bbox intersects the
viewport at zoom ≥ 9.4 (`networkClusters.ts`), each file fetched once per page
session; the sweep's 23 fetches over a full tour never duplicated a request.

## Known ceilings (unchanged by this rollout — tracked, not fixed here)

- **Cross-unit stitching pending.** `tennessee-river` and `cumberland-river`
  ship their tiger-fallback extents via the extent-regression guard; the named
  network renders per-HU8 lines, so these two catalog corridors are not yet
  stitched end-to-end from NHD.
- **12 dropped throughLake slugs (content lane).** Twelve catalog waters
  reference throughLake entries the current pipeline drops; a content-lane
  decision is required before the network can carry them.
- **Forked Deer 08010206 — defective USGS product.** The source GDB for this
  unit is defective upstream (see FANOUT-REPORT.md); its lines are absent from
  the network until USGS republishes or an alternate source is approved.
- **Engine v2 upstream point/confluence stops** await the GEOCONV-0
  conventions review; until then termini behavior is the frozen v1 contract.

## How to re-run the sweep

```
# statewide data gate (independent QA validator; also wired into the catalog
# suite via: node scripts/nhd-validate.mjs --strict)
node scripts/nhd-network-validate.mjs
# producing-lane gates (cross-check)
node scripts/nhd-network-gates.mjs
# browser sweep: DEV_FIXTURES=1 pnpm --filter @trout/web dev, then per cluster:
# jumpTo(cluster centroid @11.5) → assert network-minor-<id> qRF > 0, hover
# [data-proof="network-hover"] populates, screenshot; jumpTo(z6) → qRF = 0.
# Dev seams: window.__troutMap, window.__troutNetwork (added/fetchedFiles/fetchedOnce).
```

Raw evidence: `docs/reports/network-sweep-results.json` (per-cluster JSON rows,
including zoom, camera, hover coordinates, fetch log).
