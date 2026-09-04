# CONTINUITY-AUDIT — river continuity (chunk) audit

Lane: CONTINUITY · Repo: `trout-geo` · Base: `db2555b` (GEO lane HEAD) · Date: 2026-09-04

## Problem

Users see individual catalog rivers rendering as MULTIPLE disconnected polylines with
visible gaps ("the Harpeth River split into 3 distinct rivers"). Verified baseline:
27 of the 92 line rivers in `apps/web/public/atlas/rivers.geojson` render as 2+ chunks.

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

- **cane-creek** — Deliberate (docs/GEO-AUDIT.md "Not correctable" section): ONE catalog id intentionally covers two same-named Cane Creeks — the Bledsoe/Van Buren water and the Hickman/Perry water (~2.3 deg apart). Splitting the id is a catalog change owned by the content lane.

### Left-open gaps (no public-domain geometry available; not fabricated)

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

Streams made fully continuous with real NHD geometry: barren-fork-river, collins-river, daddys-creek, duck-river-tailwater, elk-river, emory-river, fletchers-fork, french-broad-river, harpeth-river, laurel-creek-johnson, new-river, north-chickamauga-creek, obed-river, powell-river, sequatchie-river, watauga-river.

## Per-stream results (before -> after)

`before` = GEO-lane HEAD `db2555b` baseline; `after` = this lane's result.
Only streams with >1 chunk in either run are listed individually; all other
65 line rivers are single-chunk in both runs (1 chunk / 1 chunk).

| id | parts before | chunks before | parts after | chunks after | status |
|---|---|---|---|---|---|
| cane-creek | 33 | 4 | 60 | 3 | ALLOWLISTED (deliberate) |
| clear-fork | 15 | 3 | 92 | 3 | LEFT-OPEN (documented source gap) |
| horse-creek-greene | 5 | 3 | 59 | 3 | LEFT-OPEN (documented source gap) |
| sinking-creek-wilson | 7 | 3 | 26 | 3 | LEFT-OPEN (documented source gap) |
| east-fork-shoal-creek | 2 | 2 | 6 | 2 | LEFT-OPEN (documented source gap) |
| hurricane-creek | 10 | 3 | 115 | 2 | LEFT-OPEN (documented source gap) |
| indian-creek-claiborne | 4 | 2 | 26 | 2 | LEFT-OPEN (documented source gap) |
| mill-creek-overton | 55 | 2 | 55 | 2 | LEFT-OPEN (documented source gap) |
| piney-river-rhea | 76 | 2 | 92 | 2 | LEFT-OPEN (documented source gap) |
| richardson-byrd-creek | 41 | 2 | 52 | 2 | LEFT-OPEN (documented source gap) |
| sulfur-fork-creek | 10 | 4 | 85 | 2 | LEFT-OPEN (documented source gap) |
| barren-fork-river | 31 | 5 | 60 | 1 | CONTINUOUS |
| collins-river | 14 | 3 | 77 | 1 | CONTINUOUS |
| daddys-creek | 9 | 2 | 115 | 1 | CONTINUOUS |
| duck-river-tailwater | 30 | 3 | 126 | 1 | CONTINUOUS |
| elk-river | 114 | 9 | 372 | 1 | CONTINUOUS |
| emory-river | 15 | 2 | 78 | 1 | CONTINUOUS |
| fletchers-fork | 4 | 3 | 22 | 1 | CONTINUOUS |
| french-broad-river | 243 | 2 | 378 | 1 | CONTINUOUS |
| harpeth-river | 21 | 5 | 217 | 1 | CONTINUOUS |
| laurel-creek-johnson | 3 | 2 | 18 | 1 | CONTINUOUS |
| new-river | 15 | 2 | 78 | 1 | CONTINUOUS |
| north-chickamauga-creek | 13 | 2 | 17 | 1 | CONTINUOUS |
| obed-river | 8 | 2 | 132 | 1 | CONTINUOUS |
| powell-river | 5 | 2 | 199 | 1 | CONTINUOUS |
| sequatchie-river | 4 | 2 | 20 | 1 | CONTINUOUS |
| watauga-river | 99 | 2 | 106 | 1 | CONTINUOUS |

## Multi-chunk detail (current run)

### cane-creek — 3 chunks / 60 parts (ALLOWLISTED)

chunk sizes (parts per chunk): 43, 16, 1; largest inter-chunk gaps:
- 201.3 km at -87.6105,35.6199 -> -85.3862,35.7254
- 197.2 km at -85.4390,35.8149 -> -87.6105,35.6199
- 1.6 km at -85.3829,35.7110 -> -85.3862,35.7254
- exception: Deliberate (docs/GEO-AUDIT.md "Not correctable" section): ONE catalog id intentionally covers two same-named Cane Creeks — the Bledsoe/Van Buren water and the Hickman/Perry water (~2.3 deg apart). Splitting the id is a catalog change owned by the content lane.

### clear-fork — 3 chunks / 92 parts (ALLOWLISTED)

chunk sizes (parts per chunk): 88, 3, 1; largest inter-chunk gaps:
- 52.6 km at -84.6983,36.0910 -> -84.5733,36.5530
- 15.7 km at -84.9078,36.1563 -> -84.8432,36.2871
- 15.0 km at -84.6236,36.4243 -> -84.5733,36.5530
- exception: Un-fillable from public sources: NHDPlus HR "Clear Fork" carries only the middle band (lat 36.287-36.424); TIGER is sparse at both ends. All-fcode corridor probes across both ~15 km holes (36.156->36.292 and 36.424->36.553) found no connectable reach chain (688/804 parts, connected=false). Gaps left open per the no-fabrication rule.

### horse-creek-greene — 3 chunks / 59 parts (ALLOWLISTED)

chunk sizes (parts per chunk): 34, 24, 1; largest inter-chunk gaps:
- 28.0 km at -82.6597,36.4154 -> -82.6632,36.1633
- 18.5 km at -82.7108,36.1644 -> -82.7862,36.3191
- 15.5 km at -82.6597,36.4154 -> -82.7887,36.3219
- exception: Un-fillable from public sources: NHD "Horse Creek" stops at lon -82.711 while TIGER fragments reach -82.790; the only corridor connection runs through the whole Nolichucky drainage web (1700+ unrelated parts), which is not a same-water bridge. Left open.

### sinking-creek-wilson — 3 chunks / 26 parts (ALLOWLISTED)

chunk sizes (parts per chunk): 14, 11, 1; largest inter-chunk gaps:
- 22.6 km at -86.5342,36.0465 -> -86.3018,36.1247
- 12.2 km at -86.5342,36.0465 -> -86.4127,36.0945
- 3.6 km at -86.3416,36.1334 -> -86.3015,36.1304
- exception: Un-fillable from public sources: 12.15 km west hole (36.046->36.094) and 3.69 km mid hole; all-fcode corridor probes found no connectable chain (172/113 parts, connected=false). Left open.

### east-fork-shoal-creek — 2 chunks / 6 parts (ALLOWLISTED)

chunk sizes (parts per chunk): 5, 1; largest inter-chunk gaps:
- 6.1 km at -87.0992,35.0046 -> -87.1646,35.0148
- exception: Un-fillable from public sources: NHD "East Fork Shoal Creek" covers only lon -87.100..-87.064; the 6.06 km upper-reach hole (35.005->35.015) has no named reach and no connectable unnamed chain (409 corridor parts, connected=false). Left open.

### hurricane-creek — 2 chunks / 115 parts (ALLOWLISTED)

chunk sizes (parts per chunk): 78, 37; largest inter-chunk gaps:
- 34.5 km at -87.8161,36.3472 -> -87.5753,36.1053
- exception: Un-fillable from public sources: NHD "Hurricane Creek" (115 reaches, full-extent envelope) splits into 2 chains with a 34.5 km hole; no named reach exists mid-creek and TIGER has 3 fragments that do not bridge it. Left open.

### indian-creek-claiborne — 2 chunks / 26 parts (ALLOWLISTED)

chunk sizes (parts per chunk): 23, 3; largest inter-chunk gaps:
- 24.7 km at -83.6064,36.5569 -> -83.4459,36.3766
- exception: Un-fillable from public sources: every source combination (TIGER blend / NHD-only / full union) yields 2 chunks with a 24.66 km hole; no named reach in the corridor. Left open.

### mill-creek-overton — 2 chunks / 55 parts (ALLOWLISTED)

chunk sizes (parts per chunk): 42, 13; largest inter-chunk gaps:
- 18.8 km at -85.3524,36.4391 -> -85.4757,36.3026
- exception: Un-fillable from public sources: NHDPlus HR carries NO "Mill Creek" reach at all between lat 36.30 and 36.44 (all-fcode probe of the mid corridor: zero Mill Creek features, no connectable unnamed chain), and TIGER has no segments there. The 18.77 km hole is a genuine NHD discontinuity. Left open.

### piney-river-rhea — 2 chunks / 92 parts (ALLOWLISTED)

chunk sizes (parts per chunk): 57, 35; largest inter-chunk gaps:
- 14.5 km at -84.8538,35.6952 -> -84.7892,35.8146
- exception: Un-fillable from public sources: NHD splits the water into "Piney Creek" (upper+lower) and "Piney River" (mid band) and still lacks the 14.5 km reach through the Piney gorge; both names are taken, all combinations remain 2 chunks. Left open.

### richardson-byrd-creek — 2 chunks / 52 parts (ALLOWLISTED)

chunk sizes (parts per chunk): 26, 26; largest inter-chunk gaps:
- 2.5 km at -83.1364,36.4913 -> -83.1547,36.4745
- exception: Un-fillable from public sources: 2.48 km gap between the Richardson Creek chain and the NHD "Byrd Creek" chain (-83.1364,36.4913 -> -83.1547,36.4745); the corridor connects only through 450+ unrelated web parts, not a same-water reach. Left open.

### sulfur-fork-creek — 2 chunks / 85 parts (ALLOWLISTED)

chunk sizes (parts per chunk): 75, 10; largest inter-chunk gaps:
- 33.0 km at -86.6946,36.4281 -> -86.3645,36.5608
- exception: Un-fillable from public sources: both NHD names taken ("Sulphur Fork Creek" + "Sulphur Fork Red River", 106 reaches, full-extent envelope) and the result is still 2 chunks with a 32.99 km hole. Left open.

## Residual endpoint joins applied (<= 1 km, logged per pipeline rule)

Joins are produced by `apps/web/scripts/close-residual-gaps.mjs` and consumed from
`.atlas-src/out/residual-joins.json`. Only endpoint pairs with NO intermediate
NHD/TIGER segment available are bridged, and only up to 1 km.

_(none — every residual gap was filled with real NHD/TIGER geometry or left open)_

## Gaps left open (> 1 km, no public-domain geometry found)

| id | gap | where | reason |
|---|---|---|---|
| cane-creek | 201.3 km | -87.6105,35.6199 -> -85.3862,35.7254 | Deliberate (docs/GEO-AUDIT.md "Not correctable" section): ONE catalog id intentionally covers two same-named Cane Creeks — the Bledsoe/Van Buren water and the Hickman/Perry water (~2.3 deg apart). Splitting the id is a catalog change owned by the content lane. |
| clear-fork | 52.6 km | -84.6983,36.0910 -> -84.5733,36.5530 | Un-fillable from public sources: NHDPlus HR "Clear Fork" carries only the middle band (lat 36.287-36.424); TIGER is sparse at both ends. All-fcode corridor probes across both ~15 km holes (36.156->36.292 and 36.424->36.553) found no connectable reach chain (688/804 parts, connected=false). Gaps left open per the no-fabrication rule. |
| horse-creek-greene | 28.0 km | -82.6597,36.4154 -> -82.6632,36.1633 | Un-fillable from public sources: NHD "Horse Creek" stops at lon -82.711 while TIGER fragments reach -82.790; the only corridor connection runs through the whole Nolichucky drainage web (1700+ unrelated parts), which is not a same-water bridge. Left open. |
| sinking-creek-wilson | 22.6 km | -86.5342,36.0465 -> -86.3018,36.1247 | Un-fillable from public sources: 12.15 km west hole (36.046->36.094) and 3.69 km mid hole; all-fcode corridor probes found no connectable chain (172/113 parts, connected=false). Left open. |
| east-fork-shoal-creek | 6.1 km | -87.0992,35.0046 -> -87.1646,35.0148 | Un-fillable from public sources: NHD "East Fork Shoal Creek" covers only lon -87.100..-87.064; the 6.06 km upper-reach hole (35.005->35.015) has no named reach and no connectable unnamed chain (409 corridor parts, connected=false). Left open. |
| hurricane-creek | 34.5 km | -87.8161,36.3472 -> -87.5753,36.1053 | Un-fillable from public sources: NHD "Hurricane Creek" (115 reaches, full-extent envelope) splits into 2 chains with a 34.5 km hole; no named reach exists mid-creek and TIGER has 3 fragments that do not bridge it. Left open. |
| indian-creek-claiborne | 24.7 km | -83.6064,36.5569 -> -83.4459,36.3766 | Un-fillable from public sources: every source combination (TIGER blend / NHD-only / full union) yields 2 chunks with a 24.66 km hole; no named reach in the corridor. Left open. |
| mill-creek-overton | 18.8 km | -85.3524,36.4391 -> -85.4757,36.3026 | Un-fillable from public sources: NHDPlus HR carries NO "Mill Creek" reach at all between lat 36.30 and 36.44 (all-fcode probe of the mid corridor: zero Mill Creek features, no connectable unnamed chain), and TIGER has no segments there. The 18.77 km hole is a genuine NHD discontinuity. Left open. |
| piney-river-rhea | 14.5 km | -84.8538,35.6952 -> -84.7892,35.8146 | Un-fillable from public sources: NHD splits the water into "Piney Creek" (upper+lower) and "Piney River" (mid band) and still lacks the 14.5 km reach through the Piney gorge; both names are taken, all combinations remain 2 chunks. Left open. |
| richardson-byrd-creek | 2.5 km | -83.1364,36.4913 -> -83.1547,36.4745 | Un-fillable from public sources: 2.48 km gap between the Richardson Creek chain and the NHD "Byrd Creek" chain (-83.1364,36.4913 -> -83.1547,36.4745); the corridor connects only through 450+ unrelated web parts, not a same-water reach. Left open. |
| sulfur-fork-creek | 33.0 km | -86.6946,36.4281 -> -86.3645,36.5608 | Un-fillable from public sources: both NHD names taken ("Sulphur Fork Creek" + "Sulphur Fork Red River", 106 reaches, full-extent envelope) and the result is still 2 chunks with a 32.99 km hole. Left open. |

## Reproduce

```bash
node apps/web/scripts/audit-river-continuity.mjs            # CI check (exit code)
node apps/web/scripts/audit-river-continuity.mjs --write    # regenerate this doc
```
