# River repair implementation plan

Status: active  
Created: 2026-09-16  
Execution: two sequential sessions

This plan replaces the superseded September geometry-repair claims and the earlier combined brief. Give each linked session file to a separate GPT-5.6 Luna session. The files are self-contained.

## Why the sessions are sequential

Session 1 establishes water identity and authoritative geometry. Session 2 consumes the reach identifiers and display metadata emitted by Session 1. Running them in parallel would force the map session to guess the data contract and would recreate the coordination failures documented in `AGENTS.md`.

1. Run [Session 1 — hydrography and identity](RIVER-REPAIR-SESSION-1-HYDROGRAPHY.md).
2. Review and merge Session 1, or explicitly provide its pushed ending commit as the base.
3. Run [Session 2 — map quality and performance](RIVER-REPAIR-SESSION-2-MAP-QUALITY.md).

Both sessions must follow [Engineering guide](ENGINEERING-GUIDE.md) and `AGENTS.md`.

## Required outcome

- Selectable line waters use source-traceable NHD/NHDPlus HR geometry, with documented exceptions only where NHD is inadequate.
- No straight synthetic connector is used to disguise missing source coverage.
- Forked Deer and Obion waters are directed, continuous where the source is continuous, and independently selectable.
- The two stocked Cane Creeks are different catalog records, NHD identities, geometries, deep links, search results, and stocking destinations.
- Context-network deduplication uses exact reach identity, not a shared human name.
- Statewide, regional, and local display tiers reveal smoothly without rewriting feature state for every catalog water on each zoom.
- Detailed-network loading is cached, bounded, and latest-request-wins.
- Completion claims are backed by data-integrity tests, browser interaction tests, measurements, and a clean pushed branch.

## Verified defects the implementation must remove

- `packages/content/scripts/wave-ledgers/stitch-geometry.mjs` directly connects disconnected chains across gaps up to 30 km.
- The script selects reaches by name plus envelope and may join unrelated branches.
- Replacement geometry can retain old `sourceIds` that do not describe the new coordinates.
- `middle-fork-forked-deer-river` and `north-fork-forked-deer-river` contain `bridgedSegments` output.
- `cane-creek` combines two fisheries in content while its current geometry represents only the Caney Fork-system water.
- Context-network deduplication deletes by lowercased name, hiding unrelated same-name streams.
- Zoom reveal loops over the full catalog on `zoomend`.
- Network loading serializes every `moveend`, allowing stale viewport work to queue.

## Shared acceptance gates

- No `bridgedSegments`, 30 km bridge routine, or `nhd-network-stitch` output remains.
- Every delivered line has exact NHD permanent-reach provenance or an explicit reviewed exception.
- Catalog, atlas, and river index maintain a one-to-one ID join.
- Generators are deterministic on a second run.
- Content, contract, API, web, atlas, continuity, build, and focused browser checks pass.
- Both branches are pushed and clean.

## Retirement condition

After both sessions are merged and their acceptance evidence is recorded, remove these three active plan files from `docs/INDEX.md` and archive the result in one dated report. Git history remains the plan archive.
