# CONTINUITY-AUDIT — river continuity (chunk) audit

Lane: CONTINUITY · Repo: `trout-geo` · Base: `db2555b` (GEO lane HEAD) · Date: 2026-09-04

## Problem

Users see individual catalog rivers rendering as MULTIPLE disconnected polylines with
visible gaps ("the Harpeth River split into 3 distinct rivers"). Historical baseline:
27 of the 92 line rivers rendered as 2+ chunks. Current trace output contains 147
line rivers; 8 have documented public-source gaps and 139 are single-chunk.

## Method

A **chunk** is a maximal set of a feature's parts stitched end-to-end, where two parts
are stitched when any endpoint of one lies within 1.0 km (haversine) of an
endpoint of the other. Chunks are separated by real coverage gaps in the committed
geometry. This reproduces what the map renders: parts of the same chunk touch (or
nearly touch), parts of different chunks show a visible break.

Implementation note: this endpoint-to-endpoint haversine count is slightly stricter
than the field verification for one stream — elk-river measures 9 chunks here vs 7
in the user-report verification (different distance implementation; the other
confirmed counts, and the 27-stream total, reproduce exactly). The stricter count
is the one CI enforces.

Script: `apps/web/scripts/audit-river-continuity.mjs` — CI mode exits non-zero when a
non-allowlisted line river has more than one chunk. Run with `--write` to regenerate
this file. The baseline ("before") column is frozen at
`.atlas-src/out/continuity-before.json` on first write.

## Allowlist (documented exceptions)

### Deliberate (catalog design)

- **salt-lick-creek** — 2026-09-09 session-2 trace: ONE catalog id covers two same-named Salt Lick Creeks — the Jackson County water and the Putnam County water (~9.2 km apart), each now a 0-seam level-path chain. Splitting the id is a catalog change owned by the content lane.

### Left-open gaps (no public-domain geometry available; not fabricated)

- **big-sandy-river** — Selectable-river expansion (2026-09-15): the exact GNIS 01277382 NHD export has one isolated named reach 13.31 km from the main network; Census TIGER exact-name coverage is more fragmented (4 chunks), so the complete official NHD extent is retained without a synthetic bridge.
- **middle-fork-forked-deer-river** — Selectable-river expansion (2026-09-15): exact GNIS 01293673 NHD coverage has two named networks separated by 12.43 km. TIGER exact-name coverage is still fragmented and can conflate the separate same-name GNIS 01293672, so no unverified connector was added.
- **middle-fork-obion-river** — Selectable-river expansion (2026-09-15): exact GNIS 01269799 NHD coverage has three chunks with a largest 6.68 km gap; Census TIGER exact-name coverage has four chunks. The official NHD extent is retained and the source gaps are left open.
- **beech-river** — Selectable-river expansion (2026-09-16): exact GNIS 01305068 NHD coverage has three source chunks with a largest 5.09 km gap; the official extent is retained as separate parts and no synthetic connector is added.
- **south-fork-forked-deer-river** — West Tennessee hydrography repair (2026-09-16): exact GNIS 01270865 NHD coverage has two source chunks with a 1.29 km gap; the gap is preserved because endpoint topology does not prove continuity.
- **north-fork-obion-river** — Selectable-river expansion (2026-09-15): exact GNIS 01295906 NHD coverage has two chunks separated by 8.61 km; Census TIGER exact-name coverage also remains split. Both sources were audited and no synthetic connector was created.
- **clear-fork** — Un-fillable from public sources: NHDPlus HR "Clear Fork" carries only the middle band (lat 36.287-36.424); TIGER is sparse at both ends. All-fcode corridor probes across both ~15 km holes (36.156->36.292 and 36.424->36.553) found no connectable reach chain (688/804 parts, connected=false). Gaps left open per the no-fabrication rule.
- **horse-creek-greene** — Un-fillable from public sources: NHD "Horse Creek" stops at lon -82.711 while TIGER fragments reach -82.790; the only corridor connection runs through the whole Nolichucky drainage web (1700+ unrelated parts), which is not a same-water bridge. Left open.
- **sinking-creek-wilson** — Un-fillable from public sources: 12.15 km west hole (36.046->36.094) and 3.69 km mid hole; all-fcode corridor probes found no connectable chain (172/113 parts, connected=false). Left open.
- **east-fork-shoal-creek** — Un-fillable from public sources: NHD "East Fork Shoal Creek" covers only lon -87.100..-87.064; the 6.06 km upper-reach hole (35.005->35.015) has no named reach and no connectable unnamed chain (409 corridor parts, connected=false). Left open.
- **hurricane-creek** — Un-fillable from public sources: NHD "Hurricane Creek" (115 reaches, full-extent envelope) splits into 2 chains with a 34.5 km hole; no named reach exists mid-creek and TIGER has 3 fragments that do not bridge it. Left open.
- **indian-creek-claiborne** — Un-fillable from public sources: every source combination (TIGER blend / NHD-only / full union) yields 2 chunks with a 24.66 km hole; no named reach in the corridor. Left open.
- **mill-creek-overton** — Un-fillable from public sources: NHDPlus HR carries NO "Mill Creek" reach at all between lat 36.30 and 36.44 (all-fcode probe of the mid corridor: zero Mill Creek features, no connectable unnamed chain), and TIGER has no segments there. The 18.77 km hole is a genuine NHD discontinuity. Left open.
- **piney-river-rhea** — Un-fillable from public sources: NHD splits the water into "Piney Creek" (upper+lower) and "Piney River" (mid band) and still lacks the 14.5 km reach through the Piney gorge; both names are taken, all combinations remain 2 chunks. Left open.
- **richardson-byrd-creek** — Un-fillable from public sources: 2.48 km gap between the Richardson Creek chain and the NHD "Byrd Creek" chain (-83.1364,36.4913 -> -83.1547,36.4745); the corridor connects only through 450+ unrelated web parts, not a same-water reach. Left open.
- **sulfur-fork-creek** — Un-fillable from public sources: both NHD names taken ("Sulphur Fork Creek" + "Sulphur Fork Red River", 106 reaches, full-extent envelope) and the result is still 2 chunks with a 32.99 km hole. Left open.

## What the CONTINUITY lane changed (2026-09-04)

1. **18 new per-stream corridor fetch targets** in `fetch-nhd-targets.mjs`
(harpeth, collins, clear-fork, sulfur-fork, emory, hurricane-houston, sinking-wilson,
daddys, efork-shoal, indian-claiborne, laurel-johnson, new-river-scott,
n-chickamauga, obed, sequatchie, fletchers, horse-greene, plus the name-less
`fbb-braid` corridor of unnamed French Broad braid channels) — all USGS NHDPlus HR,
fetched with retry/backoff on 2026-09-04 after earlier 504s.
2. **NHD takes** in `merge-rivers.mjs` for the new files plus previously fetched but
unused coverage: `powell.geojson` "Powell River", `byrd-creek.geojson` "Byrd Creek",
"Piney River" (lower Piney main stem), and both "Sulphur Fork Creek" /
"Sulphur Fork Red River" spellings.
3. **Continuity-aware source selection** in `merge-rivers.mjs`: per stream the
pipeline now picks the most continuous REAL source set — TIGER+NHD blend (base),
TIGER+NHD undeduplicated full union, NHD-only, or TIGER-only — switching only for
a strictly lower chunk count while still covering the base extent (0.05 deg per
side), so no switch can truncate a stream (logged as `sel:...` in the source tag).
4. **watauga-river reach gate** widened (maxLon -82.125 -> -82.11) with provenance:
the old edge rejected the two NHD dam-pool connectors at Wilbur Dam and split the
tailwater in two.
5. **`close-residual-gaps.mjs`** (new pipeline step) joins chunk endpoints across
residual gaps of at most 1 km; this run logged **0 joins** — every residual gap is
> 1 km and was documented instead of bridged.

Streams made fully continuous with real NHD geometry: none in this topology-only
rebuild; the remaining source gaps are preserved as separate parts.

## Per-stream results (before -> after)

`before` = GEO-lane HEAD `db2555b` baseline; `after` = this lane's result.
Only streams with >1 chunk in the current run are listed individually; all other
139 line rivers are single-chunk (1 chunk / 1 chunk).

| id | parts before | chunks before | parts after | chunks after | status |
|---|---|---|---|---|---|
| richardson-byrd-creek | 7 | 4 | 7 | 4 | LEFT-OPEN (documented source gap) |
| beech-river | 6 | 3 | 6 | 3 | LEFT-OPEN (documented source gap) |
| middle-fork-obion-river | 3 | 3 | 3 | 3 | LEFT-OPEN (documented source gap) |
| sinking-creek-wilson | 3 | 3 | 3 | 3 | LEFT-OPEN (documented source gap) |
| big-sandy-river | 3 | 2 | 3 | 2 | LEFT-OPEN (documented source gap) |
| middle-fork-forked-deer-river | 2 | 2 | 2 | 2 | LEFT-OPEN (documented source gap) |
| north-fork-obion-river | 2 | 2 | 2 | 2 | LEFT-OPEN (documented source gap) |
| south-fork-forked-deer-river | 2 | 2 | 2 | 2 | LEFT-OPEN (documented source gap) |

## Multi-chunk detail (current run)

### richardson-byrd-creek — 4 chunks / 7 parts (ALLOWLISTED)

chunk sizes (parts per chunk): 4, 1, 1, 1; largest inter-chunk gaps:
- 5.9 km at -83.0992,36.4699 -> -83.1646,36.4726
- 3.7 km at -83.0992,36.4699 -> -83.1224,36.4970
- 3.4 km at -83.1347,36.4604 -> -83.1364,36.4913
- 3.3 km at -83.1646,36.4726 -> -83.1364,36.4913
- 2.8 km at -83.0992,36.4699 -> -83.1237,36.4549
- 2.1 km at -83.1859,36.4645 -> -83.1649,36.4724
- exception: Un-fillable from public sources: 2.48 km gap between the Richardson Creek chain and the NHD "Byrd Creek" chain (-83.1364,36.4913 -> -83.1547,36.4745); the corridor connects only through 450+ unrelated web parts, not a same-water reach. Left open.

### beech-river — 3 chunks / 6 parts (ALLOWLISTED)

chunk sizes (parts per chunk): 3, 2, 1; largest inter-chunk gaps:
- 5.1 km at -88.3989,35.6251 -> -88.3472,35.6071
- 1.8 km at -88.3580,35.6210 -> -88.3472,35.6071
- 1.0 km at -88.3989,35.6251 -> -88.3877,35.6251
- exception: Selectable-river expansion (2026-09-16): exact GNIS 01305068 NHD coverage has three source chunks with a largest 5.09 km gap; the official extent is retained as separate parts and no synthetic connector is added.

### middle-fork-obion-river — 3 chunks / 3 parts (ALLOWLISTED)

chunk sizes (parts per chunk): 1, 1, 1; largest inter-chunk gaps:
- 6.7 km at -88.4265,36.2769 -> -88.5001,36.2677
- 5.6 km at -88.4386,36.2773 -> -88.5001,36.2677
- 1.1 km at -88.4265,36.2769 -> -88.4383,36.2774
- exception: Selectable-river expansion (2026-09-15): exact GNIS 01269799 NHD coverage has three chunks with a largest 6.68 km gap; Census TIGER exact-name coverage has four chunks. The official NHD extent is retained and the source gaps are left open.

### sinking-creek-wilson — 3 chunks / 3 parts (ALLOWLISTED)

chunk sizes (parts per chunk): 1, 1, 1; largest inter-chunk gaps:
- 21.1 km at -86.3018,36.1247 -> -86.5269,36.0709
- 9.2 km at -86.4347,36.1063 -> -86.5269,36.0709
- 3.7 km at -86.3018,36.1247 -> -86.3416,36.1334
- exception: Un-fillable from public sources: 12.15 km west hole (36.046->36.094) and 3.69 km mid hole; all-fcode corridor probes found no connectable chain (172/113 parts, connected=false). Left open.

### big-sandy-river — 2 chunks / 3 parts (ALLOWLISTED)

chunk sizes (parts per chunk): 2, 1; largest inter-chunk gaps:
- 13.3 km at -88.3482,35.8441 -> -88.4093,35.7352
- exception: Selectable-river expansion (2026-09-15): the exact GNIS 01277382 NHD export has one isolated named reach 13.31 km from the main network; Census TIGER exact-name coverage is more fragmented (4 chunks), so the complete official NHD extent is retained without a synthetic bridge.

### middle-fork-forked-deer-river — 2 chunks / 2 parts (ALLOWLISTED)

chunk sizes (parts per chunk): 1, 1; largest inter-chunk gaps:
- 12.4 km at -88.7478,35.7527 -> -88.6287,35.8088
- exception: Selectable-river expansion (2026-09-15): exact GNIS 01293673 NHD coverage has two named networks separated by 12.43 km. TIGER exact-name coverage is still fragmented and can conflate the separate same-name GNIS 01293672, so no unverified connector was added.

### north-fork-obion-river — 2 chunks / 2 parts (ALLOWLISTED)

chunk sizes (parts per chunk): 1, 1; largest inter-chunk gaps:
- 8.6 km at -88.4612,36.4363 -> -88.3750,36.4019
- exception: Selectable-river expansion (2026-09-15): exact GNIS 01295906 NHD coverage has two chunks separated by 8.61 km; Census TIGER exact-name coverage also remains split. Both sources were audited and no synthetic connector was created.

### south-fork-forked-deer-river — 2 chunks / 2 parts (ALLOWLISTED)

chunk sizes (parts per chunk): 1, 1; largest inter-chunk gaps:
- 1.3 km at -88.6134,35.4363 -> -88.6251,35.4296
- exception: West Tennessee hydrography repair (2026-09-16): exact GNIS 01270865 NHD coverage has two source chunks with a 1.29 km gap; the gap is preserved because endpoint topology does not prove continuity.

## Residual endpoint joins applied (<= 1 km, logged per pipeline rule)

Joins are produced by `apps/web/scripts/close-residual-gaps.mjs` and consumed from
`.atlas-src/out/residual-joins.json`. Only endpoint pairs with NO intermediate
NHD/TIGER segment available are bridged, and only up to 1 km.

_(none — every residual gap was filled with real NHD/TIGER geometry or left open)_

## Gaps left open (> 1 km, no public-domain geometry found)

| id | gap | where | reason |
|---|---|---|---|
| richardson-byrd-creek | 5.9 km | -83.0992,36.4699 -> -83.1646,36.4726 | Un-fillable from public sources: 2.48 km gap between the Richardson Creek chain and the NHD "Byrd Creek" chain (-83.1364,36.4913 -> -83.1547,36.4745); the corridor connects only through 450+ unrelated web parts, not a same-water reach. Left open. |
| beech-river | 5.1 km | -88.3989,35.6251 -> -88.3472,35.6071 | Selectable-river expansion (2026-09-16): exact GNIS 01305068 NHD coverage has three source chunks with a largest 5.09 km gap; the official extent is retained as separate parts and no synthetic connector is added. |
| middle-fork-obion-river | 6.7 km | -88.4265,36.2769 -> -88.5001,36.2677 | Selectable-river expansion (2026-09-15): exact GNIS 01269799 NHD coverage has three chunks with a largest 6.68 km gap; Census TIGER exact-name coverage has four chunks. The official NHD extent is retained and the source gaps are left open. |
| sinking-creek-wilson | 21.1 km | -86.3018,36.1247 -> -86.5269,36.0709 | Un-fillable from public sources: 12.15 km west hole (36.046->36.094) and 3.69 km mid hole; all-fcode corridor probes found no connectable chain (172/113 parts, connected=false). Left open. |
| big-sandy-river | 13.3 km | -88.3482,35.8441 -> -88.4093,35.7352 | Selectable-river expansion (2026-09-15): the exact GNIS 01277382 NHD export has one isolated named reach 13.31 km from the main network; Census TIGER exact-name coverage is more fragmented (4 chunks), so the complete official NHD extent is retained without a synthetic bridge. |
| middle-fork-forked-deer-river | 12.4 km | -88.7478,35.7527 -> -88.6287,35.8088 | Selectable-river expansion (2026-09-15): exact GNIS 01293673 NHD coverage has two named networks separated by 12.43 km. TIGER exact-name coverage is still fragmented and can conflate the separate same-name GNIS 01293672, so no unverified connector was added. |
| north-fork-obion-river | 8.6 km | -88.4612,36.4363 -> -88.3750,36.4019 | Selectable-river expansion (2026-09-15): exact GNIS 01295906 NHD coverage has two chunks separated by 8.61 km; Census TIGER exact-name coverage also remains split. Both sources were audited and no synthetic connector was created. |
| south-fork-forked-deer-river | 1.3 km | -88.6134,35.4363 -> -88.6251,35.4296 | West Tennessee hydrography repair (2026-09-16): exact GNIS 01270865 NHD coverage has two source chunks with a 1.29 km gap; the gap is preserved because endpoint topology does not prove continuity. |

## Reproduce

```bash
node apps/web/scripts/audit-river-continuity.mjs            # CI check (exit code)
node apps/web/scripts/audit-river-continuity.mjs --write    # regenerate this doc
```
