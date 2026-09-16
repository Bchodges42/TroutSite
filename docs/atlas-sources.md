# Atlas geometry sources and rules

This is the durable source policy for the Tennessee atlas. It describes what is
acceptable, not a claim that every current feature already complies. Known selectable-river
violations are tracked in
[`KNOWN-ISSUES.md`](KNOWN-ISSUES.md) and repaired by
[`RIVER-REPAIR-IMPLEMENTATION-PLAN.md`](RIVER-REPAIR-IMPLEMENTATION-PLAN.md).

## Source authority

1. **USGS NHD / NHDPlus HR** is the canonical source for stream and river paths,
   topology, permanent identifiers, GNIS identity, and watershed membership.
2. **USGS NHD waterbodies** are canonical for lakes and reservoirs when an identity can
   be pinned to an official identifier.
3. **Census TIGER/Line** is an explicit fallback when NHD is absent or demonstrably
   unusable for a bounded reach. Record why the fallback was chosen.
4. Agency pages and USGS monitoring locations may define managed-reach endpoints, dam
   locations, names, and fishing relevance. They do not replace hydrography.

All source data is baked into static artifacts. The browser must not call these services.

## Identity and geometry are separate

The selectable-water catalog in `packages/content/streams/tn/*.yaml` owns the product id,
display name, waterbody type, fishery metadata, sources, and hydrographic identity. A
water's identity must be strong enough to distinguish repeated names: GNIS id(s), HUC8,
and counties or receiving water where needed.

Geometry recipes own only how that identity is traced: start/end anchors, topology
termini, accepted name transitions, reservoir traversal, and explicitly reviewed source
exceptions. Do not duplicate identity metadata in a second manifest.

## Geometry rules

- Preserve official vertices and network topology. Join adjacent reaches by shared NHD
  nodes or a measured endpoint tolerance no greater than 15 m.
- A dam/pool adjacency may connect graph nodes when the source documents that
  relationship. It must not emit a straight, source-less segment across the dam or pool.
- Never draw a direct line merely to make a feature continuous. A visible gap is more
  honest than fabricated water.
- Never select a same-name reach by name plus a broad bounding box alone. Pin the
  identity and prove connectivity.
- Preserve provenance for every contributing reach. Keep NHD permanent identifiers and
  NHDPlus identifiers in separate fields; do not silently reuse one namespace for the
  other.
- Reject malformed/non-finite coordinates and invalid geometry before publishing.
- Simplification may remove redundant vertices but must preserve topology, endpoints,
  and recognizable river shape. It cannot be used to conceal a gap.
- Generation must be deterministic: identical inputs produce byte-stable or
  semantically identical output and an audit report explaining each selection.

The retired `apps/web/scripts/build-atlas.mjs` synthetic generator must never be run.
The current `stitch-geometry.mjs` path includes an unsafe legacy connector and is not a
model for new work; Session 1 replaces it.

## Published artifacts

- `apps/web/public/atlas/rivers.geojson`: selectable river/stream geometry keyed by
  catalog id.
- `apps/web/src/features/map/riverIndex.json`: generated camera, bounds, anchor, and
  display-tier index derived from the published atlas.
- `apps/web/public/atlas/stream-network/`: detailed NHD context network, not a second
  selectable-water catalog.
- `apps/web/atlas-sources/verified/*.topology.json`: pinned waterbody/topology evidence.
- `data/nhd/`: staged source graphs and derived audit artifacts.

Do not hard-code feature totals in prose. Count the catalog and generated artifacts in a
validation command so additions cannot make documentation false.

## Required validation

At minimum, a geometry build must run:

```bash
pnpm --filter @trout/content validate
node apps/web/scripts/validate-atlas.mjs
node apps/web/scripts/audit-river-continuity.mjs
node apps/web/scripts/regenerate-river-index.mjs --check
```

The structural validator is necessary but not sufficient. The build must also audit
identity coverage, provenance, synthetic connectors, source-id validity, topology, and
the named acceptance waters in the active implementation plan. See
[`atlas-validation.md`](atlas-validation.md).

## External authority

The catalog's `officialSources` URLs remain authoritative for regulations, flow,
stocking, and fishery claims. Atlas geometry does not imply access, legal fishing status,
or current conditions.
