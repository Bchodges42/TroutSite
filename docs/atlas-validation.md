# Atlas validation contract

Atlas validation has three layers. Passing one layer is not proof that the map is
correct.

## 1. Structural validation

`node apps/web/scripts/validate-atlas.mjs` checks parseability, required properties,
coordinate order/ranges, finite coordinates, geometry families, duplicate ids, and
catalog/atlas membership. It catches corrupt files; it cannot prove that a line follows
the right river.

## 2. Hydrographic validation

The canonical builder and audit must additionally fail on:

- any emitted segment without official source reach provenance;
- any ordinary endpoint join greater than 15 m;
- a source id in the wrong identifier namespace or absent from fetched source data;
- an unexplained open end, branch jump, loop, or same-name cross-watershed merge;
- a catalog line water without GNIS/HUC identity;
- a geometry recipe whose pinned identity disagrees with the catalog;
- non-deterministic output from identical inputs.

Continuity is assessed against NHD topology, not simply the number of GeoJSON parts.
Real islands, reservoir transitions, state-boundary exits, and named-source gaps may
produce multiple parts when documented. A straight connector is never an acceptable way
to make a continuity check green.

## 3. Product/browser validation

Focused Playwright scenarios must verify:

- selection opens the intended water when nearby lines compete;
- the Obion and North/Middle/South Fork Forked Deer systems remain distinct and trace
  plausibly at maximum zoom;
- both Cane Creeks are separately searchable and selectable with truthful context;
- catalog lines do not acquire gray duplicate shadows from the context network;
- repeated statewide → regional → local zoom transitions are smooth and do not issue
  work proportional to the entire catalog on every `zoomend`;
- rapid pan/zoom cannot let stale detailed-network results replace the current viewport;
- reduced-motion behavior remains legible.

Record the exact URL/viewport, screenshots, console/network failures, and measured
mutation/request counters. A screenshot is evidence for a named scenario, not a blanket
claim that “the browser was verified.”

## Current status

The 2026-09-15 expansion passed older structural gates while still allowing unsafe
name/envelope selection and synthetic gap connections. Therefore historic “all resolved”
or “no synthetic coordinates” claims are not current acceptance evidence. The active
repair gates and ownership are defined in
[`RIVER-REPAIR-IMPLEMENTATION-PLAN.md`](RIVER-REPAIR-IMPLEMENTATION-PLAN.md).

## Routine commands

```bash
pnpm --filter @trout/content validate
node apps/web/scripts/validate-atlas.mjs
node apps/web/scripts/audit-river-continuity.mjs
node apps/web/scripts/regenerate-river-index.mjs --check
pnpm --filter @trout/web test
pnpm --filter @trout/e2e exec playwright test web/atlas-verify.spec.ts
```

Use the commands actually present on the working branch. If a planned audit command has
not been implemented, report that as incomplete rather than substituting a weaker check.
