# Coordination — two-lane rebuild of the Trout app

**Date:** 2026-09-04 (updated evening) · **Base for all lanes:** `51f8803` ("Redesign: dark Tailwater identity, species toggle, full river atlas data") on `C:\Users\Benjamin\Projects\trout` (frozen reference — do not touch).

## Lane status

| Lane | Repo | Status |
|---|---|---|
| UI / UX design | `trout-fieldwork-20260904` (branch `codex/trout-fieldwork-20260904`) | **Codex run FINISHED.** +4,310/−1,842 across 24 files, UI-only (verified byte-identical elsewhere). Its own suites: 62 unit + 20 browser tests, typecheck + build green. **Uncommitted — integration lane commits it first.** Handoff: `docs/FIELDWORK.md`, `docs/THEMES.md`, `BACKEND-ISSUES.md` (14 issues, per-issue backend status now annotated). |
| Backend / data / infra | `trout-backend` (branch `main`) | **All actionable issues fixed.** 8 commits on top of `51f8803`: `866a7a8` (B02+B03), `ba28b05` (B04), `7363324` (B01), `75c5d18` (B05+B06), `d0997a7` (B07), `fd23f57` (B10), `419baed` (B09+B11), `da80558` (West TN waters). 74 unit tests, typecheck, build + size budget green. |
| Parallel sessions | `trout-geo`, `trout-species`, `trout-topo` (to be cloned) | Briefs in [`SESSIONS.md`](SESSIONS.md) — B13 geometry audit, B08 species catalog, B14 topo assets. Start each in a fresh ZCode session by pasting its brief. |

## What the backend lane delivered

- **B02** assessed-flag: a real clamped-0 (lethal temp) renders Poor; cannot-assess renders No data. Fixtures regenerated.
- **B03** freshness keyed to newest reading age (`Live · observed` / `Stale · observed` / `Offline`), not fetch success.
- **B04** same-gauge flow/temp trends; zero cfs is a value.
- **B01** frozen `/v1/streams` resolves on static-server + vite dev/preview; honest 404s; no-store.
- **B05+B06** canonical stocking matching (aliases from the real TWRA schedule; ties unmatched) + feeds activated with per-feed status.
- **B07** concurrent month-keyed hatch charts (no prior-month substitution).
- **B10** SW snapshot-cache regex unanchored (was dead), fonts precached, offline short-circuit + 8s timeout.
- **B09+B11** stocking `datePrecision`; unconditional fixture-build provenance flag (`lib/provenance.ts`).
- **West TN blank map** root-caused (catalog scope, not rendering) and fixed: 13 real TWRA winter put-and-take waters, `tn-west` region, lake/pond types, sourced Point anchors (8 OSM / 5 explicit approx), point map layers + touch targets, fixtures now 105 waters.

## Open work

- **INTEGRATION (critical path, single-threaded):** commit Codex UI → merge backend `main` → conflicts resolve to Codex's UI with data hooks re-attached (assessed, newestReadingAt freshness, stockingMatch, feeds, point layers) → regenerate served v1 snapshots → full suites + e2e + 390/768/1440 screenshot pass.
- **B13** geometry audit, **B08** species catalog, **B14** topo assets — parallel session briefs in [`SESSIONS.md`](SESSIONS.md).
- **B12** roads — deferred pending Benjamin's licensing/source decision.
- Follow-up noted in BACKEND-ISSUES B03: service-worker-returned responses should preserve original fetch age (recommendation).

## Merge order

Integration first; then TOPO → GEO → SPECIES rebases onto the integrated result (disjoint scopes keep conflicts near zero: topo assets / river geometry + anchors / content YAML respectively). Codex's `riverIndex.json` regenerates from approved geometry after GEO lands.
