# ADR 0012. Local saved waters, trips, pack manifests, and photo attachments

- **Status:** accepted
- **Date:** 2026-09-30
- **Decider:** owner-directed site-improvement plan 2026-09-30 (implementation lane)

## Context

The site's personal state was logbook + settings + a `seen` baseline. The
2026-09-30 improvement plan adds visitor workflows — saved favorites with
private groups, a trip planner, user-managed offline packs, and photo
attachments — plus a richer logbook. All of it must stay local-only, additive,
and separable from downloaded shared data: clearing downloaded information
must never erase personal records. The service-worker/cache layer is under a
separate remediation lease, so this ADR fixes the data model, not the SW
pinning mechanics.

## Decision

1. Dexie `trout-web` moves to **version 2**, purely additive: new stores
   `savedWaters` (pk `waterId`), `waterGroups`, `trips`, `downloadManifests`,
   `photos`; no v1 store, index, or field changes. Old databases migrate in
   place; every new `LogbookEntry` field is optional so pre-migration rows
   stay valid.
2. **Saved waters snapshot identity at save time** (`nameSnapshot`,
   `regionIdSnapshot`): a retired catalog id remains visible as saved history
   instead of silently vanishing. Saving is separate from viewing (`seen`
   stays the recently-viewed baseline).
3. **Download manifests record intent and verified readiness per section**
   (`required` gates "ready"; optional terrain may stay partial). `assetsStillPinnedElsewhere`
   is pure so pack removal can avoid evicting shared assets another pack
   still pins. Removing a manifest never removes personal data.
4. **Photos are re-encoded at capture** (canvas → JPEG ≤1600px, q0.85), which
   strips EXIF/GPS by construction, and live only in IndexedDB. They enter an
   export only in an explicitly chosen full backup.
5. `clearCachedSnapshots()` semantics unchanged: shared caches only. Personal
   stores are never mass-cleared.
6. Logbook export/import gains a versioned migration (export `version: 2`
   carrying the new optional fields; import accepts v1 and v2). Field-level
   additions land with the logbook lane that owns `lib/logbook.ts`.

## Consequences

- Offline trip/favorite features have a stable local schema to build on
  before the SW-lease lane lands pack pinning.
- Pack "ready" is always verified per section; partial readiness is visible,
  never silently promoted.
- Dexie v3-style schema edits later must keep the append-only version chain.
