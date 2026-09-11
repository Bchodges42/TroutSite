# Trout · Fieldwork redesign

## Isolated baseline

- Source (read-only): `C:\Users\Benjamin\Projects\trout`.
- Independent clone: `C:\Users\Benjamin\Projects\trout-fieldwork-20260904`.
- Branch: `codex/trout-fieldwork-20260904`.
- Baseline commit: `51f88033677365ecb354624f942338f5beea18c6`.
- Source status was clean, including untracked files, on both checks at isolation. The brief's substantial uncommitted changes had already been committed before this task began.
- Cloned without hardlinks. Preserved tracked source, fonts, real river geometry, and topo assets. Copied the ignored `apps/web/public/content` and `apps/web/public/v1` snapshots, including the September 4, 2026 15:05 UTC condition snapshot. No source `.env`, database, dependency tree, or build output copied. No writes to source checkout.
- Dependencies and pnpm store are local to this clone. No backend was started. The existing preview browser has a saved catalog; a clean profile depends on the catalog-serving fix in B01 below. Browser settings/logbook are isolated by the dedicated origin.
- Preview: `http://127.0.0.1:5197/`, loopback-only with strict port binding.

## Diagnosis / direction

The baseline's root route is Tennessee, not the older TX/OK/AR documentation scope. Its cartographic assets are substantial and reusable, but controls are hidden, delayed, and low contrast. Vite cannot serve the catalog's frozen extensionless endpoint from the copied `.json` snapshot. The inspector repeats scores, loses context on hatch/logbook actions, invents hatch timing, displays internal IDs, and leaves feed queries disabled. Browser-fetch time is mislabeled as live observation time; cross-gauge comparisons invent flow trends; zero scores conflate unavailable and genuinely poor conditions.

Fieldwork makes the map a working instrument: persistent navigation, a searchable water index beside real cartography, a contextual inspector in the same space, and an expandable mobile sheet. Daybreak and Nightfall share semantic chrome and cartographic tokens. Seasonal hatch guidance is not advertised as observed insect activity. The UI has a distinct unassessed presentation, but faithfully consumes the unchanged selector; genuine zero scores remain an upstream ambiguity (B02).

## Implemented experience

- **Map first:** the state map is full-bleed on first load; the water atlas opens on demand from the map key, Layers, or menu. Search, zoom, filters, and location stay immediately available. Lines, Point fallbacks, and catalog polygons share selection, hover, assessed, unassessed, and generous pointer/touch hit treatment.
- **Contextual decisions:** a desktop inspector and expandable mobile sheet show one supplied assessment, explanation, observations, units, and hatch outlook. Conditions, Hatches, Stocking, Reports, and Log are progressively disclosed. Empty sections do not imply that a disabled feed has been checked.
- **Continuous journeys:** river, region, and month travel through hatch matching, taxon/pattern references, charts, and logbook. Returning to exploration or navigating history preserves selection and camera. The mobile fit uses the resized map dimensions, keeping the chosen river above the sheet.
- **Shared identity:** Fraunces headings, IBM Plex Sans UI, restrained panels, mineral cartography, and warm actions. Two complete palettes style both chrome and map without recreating the map. Supporting consumer routes share the same system.
- **Keyboard and touch:** searchable list alternative, keyboard search shortcuts, roving inspector tabs, menu focus containment, topmost Escape, and focus restoration. Map labels covered by the mobile sheet are removed from keyboard navigation. Reduced motion applies to camera movement and UI transitions.
- **Reported map fixes:** Nightfall no longer displays the opaque pale hillshade; existing contours remain. An inverse fill using the exact existing Tennessee outline masks the rectangular relief/contour acquisition extent outside the state. The true state border remains legible at East Tennessee zoom levels 8 and 9. No source tile, state, or river geometry was edited.

Theme configuration and extension instructions: [THEMES.md](THEMES.md).

## UI-only ownership / remaining limitations

Per Benjamin's process change, backend logic, data semantics, fixtures, tile serving, APIs, offline caching, schemas, and infrastructure are not owned by this branch. Earlier non-UI experiments were reverted. This UI pass leaves the integrated catalog, atlas geometry, topo assets, generated snapshots, and pipeline scripts untouched.

[BACKEND-ISSUES.md](../BACKEND-ISSUES.md) contains the complete reverted-change inventory and fourteen evidence-backed dependencies, including:

- **B01:** `/v1/streams` returns SPA HTML in a clean isolated Vite profile because the copied catalog is `streams.json`. The UI tests supply the unchanged catalog through an explicit test-only route seam. This does not fix production/preview transport. The current warm preview works; clean-profile catalog loading needs ZCode's serving fix.
- **B02–B05, B08:** assessment availability/species, freshness, cross-gauge trends, and stocking associations require upstream contracts or adapters. The UI does not repair or recompute them. A retrieved snapshot is not claimed to be a live observation.
- **B06–B07:** disabled reports/stocking feeds and sequential month-dependent hatch loading remain upstream. Published schedules are not confirmations that stocking occurred.
- **B10–B11:** clean-install offline behavior and demonstration-build provenance need backend/infra verification. Existing local persistence and caching code were preserved; full production offline guarantees are not asserted.
- **B12:** road data is absent pending a first-party licensing/source decision.
- **B15:** the reference inventory identifies passive lake polygons, fragmented main stems, missing geometries, and the 13 Point-to-polygon upgrades. Geometry/catalog production follows the new machine-readable inventory and contract; no geometry is fabricated in UI code.

## Startup

```powershell
cd C:\Users\Benjamin\Projects\trout-fieldwork-20260904
pnpm install --frozen-lockfile --store-dir .pnpm-store
pnpm --filter @trout/contracts build
pnpm --filter @trout/ui build
pnpm --filter @trout/web dev --host 127.0.0.1 --port 5197 --strictPort
```

Snapshots are frozen baseline data, not a continuously running backend. Their regeneration and serving belong to the backend owner. Do not substitute synthetic fixtures for live observations. The local preview remains running on port 5197; no other agent's server was stopped and nothing was deployed.

## Validation

Run from the isolated checkout, with the preview already running:

```powershell
pnpm --filter @trout/web typecheck
pnpm --filter @trout/web test
pnpm --filter @trout/web build
pnpm --filter @trout/e2e exec playwright test --config fieldwork.config.ts
```

- Current web unit suite: 89 passing tests across nine files.
- Focused browser suite: 24 passing tests covering full-bleed/atlas disclosure, map/label/search selection, pointer and real touch polygon selection, direct line selection, inspector keyboard behavior, both themes and reload, river/month context, deep-link/history camera behavior, 768/390/320 px layouts, reduced motion, missing catalog, unavailable WebGL, offline/unassessed presentation, location success/denial, guided hatch focus, East Tennessee pixels, and desktop/mobile inspector framing.
- TypeScript and the full workspace production build pass. Production web assets are 5.00 MB excluding 24.50 MB of runtime-cached topo assets, under the repository's 25 MB app budget.
- Build warnings retained: large main bundle (approximately 1.67 MB before gzip), existing static/dynamic database-import overlap, and an unmatched Workbox negative glob. No package or lockfile changes were made. Offline cache warnings are recorded in B10 rather than patched here.
- Browser verification uses unchanged source snapshots, not generated condition fixtures. The offline test verifies presentation with already-loaded data, not clean-install production caching. Tests do not create or delete logbook entries.

## Representative captures

All captures are local to this checkout in `artifacts/screenshots/`:

- [Daybreak desktop inspector](../artifacts/screenshots/daybreak-desktop-inspector.png)
- [Nightfall mobile inspector](../artifacts/screenshots/nightfall-mobile-inspector.png)
- [Nightfall expanded mobile inspector](../artifacts/screenshots/nightfall-mobile-expanded.png)
- [East Tennessee — Nightfall, zoom 8](../artifacts/screenshots/nightfall-east-8.png)
- [East Tennessee — Nightfall, zoom 9](../artifacts/screenshots/nightfall-east-9.png)
- [East Tennessee — Daybreak, zoom 9](../artifacts/screenshots/daybreak-east-9.png)

Changes remain uncommitted on `codex/trout-fieldwork-20260904` for review; the baseline is documented above. Generated screenshots, test traces, dependency store, and build output are excluded from Git.

## Backend lane progress (ZCode, 2026-09-04 evening)

Backend/infra lane lives in `C:\Users\Benjamin\Projects\trout-backend` (branch `main`, same base `51f8803`). Per-issue status is annotated inline in [BACKEND-ISSUES.md](../BACKEND-ISSUES.md). Headline:

- **Fixed and committed (8 commits):** B01 (`7363324`), B02+B03 (`866a7a8`), B04 (`ba28b05`), B05+B06 (`75c5d18`), B07 (`d0997a7`), B10 (`fd23f57`), B09+B11 (`419baed`). Web unit suite 50 → 74 passing; typecheck + production build + size budget green.
- **West Tennessee blank map — fixed (`da80558`):** root cause was catalog scope, not rendering — the launch catalog had zero waters west of the Tennessee River and rivers.geojson carries exactly one feature per catalog stream. Added the 13 real TWRA winter put-and-take waters (verbatim schedule names, so stocking matching resolves them), a `tn-west` region, `lake`/`pond` waterbody types, and first-party Point anchors in rivers.geojson (8 OSM-geocoded, 5 explicitly approximate) with map point layers + touch hit targets. Fixtures now carry 105 waters.
- **Integrated data lanes:** the species catalog, 19 corrected stream geometries, clipped/alpha topo assets, backend fixes, regenerated 105-entry river index, and 13 West Tennessee waters are present on this branch.
- **Still open:** B12 (roads — deferred pending licensing/source decision) and B15 (reference-waterbody catalog/geometry production described by the inventory and contract).
- **Coordination:** `trout-backend/COORDINATION.md` (lane split, merge plan) and `trout-backend/SESSIONS.md` (parallel-session briefs).
