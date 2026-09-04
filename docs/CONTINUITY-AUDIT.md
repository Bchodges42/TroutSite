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

Script: `apps/web/scripts/audit-river-continuity.mjs` — CI mode exits non-zero when a
non-allowlisted line river has more than one chunk. Run with `--write` to regenerate
this file. The baseline ("before") column is frozen at
`.atlas-src/out/continuity-before.json` on first write.

## Allowlist (documented exceptions)

- **cane-creek** — Deliberate (docs/GEO-AUDIT.md "Not correctable" section): ONE catalog id intentionally covers two same-named Cane Creeks — the Bledsoe/Van Buren water and the Hickman/Perry water (~2.3 deg apart). Splitting the id is a catalog change owned by the content lane.

## Per-stream results (before -> after)

`before` = GEO-lane HEAD `db2555b` baseline; `after` = this lane's result.
Only streams with >1 chunk in either run are listed individually; all other
65 line rivers are single-chunk in both runs (1 chunk / 1 chunk).

| id | parts before | chunks before | parts after | chunks after | status |
|---|---|---|---|---|---|
| elk-river | 114 | 9 | 114 | 9 | STILL FRAGMENTED |
| barren-fork-river | 31 | 5 | 31 | 5 | STILL FRAGMENTED |
| harpeth-river | 21 | 5 | 21 | 5 | STILL FRAGMENTED |
| cane-creek | 33 | 4 | 33 | 4 | ALLOWLISTED |
| sulfur-fork-creek | 10 | 4 | 10 | 4 | STILL FRAGMENTED |
| clear-fork | 15 | 3 | 15 | 3 | STILL FRAGMENTED |
| collins-river | 14 | 3 | 14 | 3 | STILL FRAGMENTED |
| duck-river-tailwater | 30 | 3 | 30 | 3 | STILL FRAGMENTED |
| fletchers-fork | 4 | 3 | 4 | 3 | STILL FRAGMENTED |
| horse-creek-greene | 5 | 3 | 5 | 3 | STILL FRAGMENTED |
| hurricane-creek | 10 | 3 | 10 | 3 | STILL FRAGMENTED |
| sinking-creek-wilson | 7 | 3 | 7 | 3 | STILL FRAGMENTED |
| daddys-creek | 9 | 2 | 9 | 2 | STILL FRAGMENTED |
| east-fork-shoal-creek | 2 | 2 | 2 | 2 | STILL FRAGMENTED |
| emory-river | 15 | 2 | 15 | 2 | STILL FRAGMENTED |
| french-broad-river | 243 | 2 | 243 | 2 | STILL FRAGMENTED |
| indian-creek-claiborne | 4 | 2 | 4 | 2 | STILL FRAGMENTED |
| laurel-creek-johnson | 3 | 2 | 3 | 2 | STILL FRAGMENTED |
| mill-creek-overton | 55 | 2 | 55 | 2 | STILL FRAGMENTED |
| new-river | 15 | 2 | 15 | 2 | STILL FRAGMENTED |
| north-chickamauga-creek | 13 | 2 | 13 | 2 | STILL FRAGMENTED |
| obed-river | 8 | 2 | 8 | 2 | STILL FRAGMENTED |
| piney-river-rhea | 76 | 2 | 76 | 2 | STILL FRAGMENTED |
| powell-river | 5 | 2 | 5 | 2 | STILL FRAGMENTED |
| richardson-byrd-creek | 41 | 2 | 41 | 2 | STILL FRAGMENTED |
| sequatchie-river | 4 | 2 | 4 | 2 | STILL FRAGMENTED |
| watauga-river | 99 | 2 | 99 | 2 | STILL FRAGMENTED |

## Multi-chunk detail (current run)

### elk-river — 9 chunks / 114 parts

chunk sizes (parts per chunk): 102, 5, 1, 1, 1, 1, 1, 1, 1; largest inter-chunk gaps:
- 59.8 km at -86.3253,35.1485 -> -86.9597,35.0077
- 57.5 km at -86.3455,35.1307 -> -86.9597,35.0077
- 55.5 km at -86.3671,35.1255 -> -86.9597,35.0077
- 54.1 km at -86.3253,35.1485 -> -86.8979,35.0157
- 51.9 km at -86.3455,35.1307 -> -86.8979,35.0157
- 50.7 km at -86.9597,35.0077 -> -86.4249,35.1344
- 49.8 km at -86.3671,35.1255 -> -86.8979,35.0157
- 45.0 km at -86.8979,35.0157 -> -86.4249,35.1344

### barren-fork-river — 5 chunks / 31 parts

chunk sizes (parts per chunk): 22, 4, 3, 1, 1; largest inter-chunk gaps:
- 5.1 km at -85.9630,35.6729 -> -85.9068,35.6742
- 4.3 km at -85.9630,35.6729 -> -85.9187,35.6589
- 3.4 km at -85.9630,35.6729 -> -85.9254,35.6712
- 2.4 km at -85.9358,35.6759 -> -85.9187,35.6589
- 2.0 km at -85.9630,35.6729 -> -85.9426,35.6807
- 2.0 km at -85.9187,35.6589 -> -85.9068,35.6742
- 1.8 km at -85.8894,35.6834 -> -85.9066,35.6749
- 1.5 km at -85.9233,35.6710 -> -85.9068,35.6742

### harpeth-river — 5 chunks / 21 parts

chunk sizes (parts per chunk): 14, 3, 2, 1, 1; largest inter-chunk gaps:
- 33.0 km at -87.1250,36.1687 -> -86.8854,35.9440
- 30.4 km at -87.1250,36.1687 -> -86.9438,35.9378
- 30.3 km at -87.1250,36.1355 -> -86.8854,35.9440
- 27.4 km at -87.1250,36.1355 -> -86.9438,35.9378
- 12.4 km at -86.9197,36.0518 -> -86.8854,35.9440
- 12.3 km at -86.9364,36.0482 -> -86.9438,35.9378
- 5.4 km at -87.0986,36.1250 -> -87.1250,36.1687
- 5.3 km at -86.8854,35.9440 -> -86.9438,35.9378

### cane-creek — 4 chunks / 33 parts (ALLOWLISTED)

chunk sizes (parts per chunk): 16, 15, 1, 1; largest inter-chunk gaps:
- 207.3 km at -85.3862,35.7254 -> -87.6800,35.6595
- 203.0 km at -85.4390,35.8149 -> -87.6800,35.6595
- 201.3 km at -87.6105,35.6199 -> -85.3862,35.7254
- 197.2 km at -85.4390,35.8149 -> -87.6105,35.6199
- 6.0 km at -87.6230,35.6328 -> -87.6800,35.6595
- 1.6 km at -85.3829,35.7110 -> -85.3862,35.7254
- exception: Deliberate (docs/GEO-AUDIT.md "Not correctable" section): ONE catalog id intentionally covers two same-named Cane Creeks — the Bledsoe/Van Buren water and the Hickman/Perry water (~2.3 deg apart). Splitting the id is a catalog change owned by the content lane.

### sulfur-fork-creek — 4 chunks / 10 parts

chunk sizes (parts per chunk): 6, 2, 1, 1; largest inter-chunk gaps:
- 43.9 km at -86.8749,36.5197 -> -86.4114,36.6509
- 39.8 km at -86.8749,36.5197 -> -86.4307,36.5469
- 33.0 km at -86.6946,36.4281 -> -86.3645,36.5608
- 27.0 km at -86.6946,36.4281 -> -86.4307,36.5469
- 5.1 km at -86.3645,36.5608 -> -86.4138,36.5380
- 1.0 km at -86.8749,36.5197 -> -86.8664,36.5134

### clear-fork — 3 chunks / 15 parts

chunk sizes (parts per chunk): 11, 3, 1; largest inter-chunk gaps:
- 52.6 km at -84.6983,36.0910 -> -84.5733,36.5530
- 15.7 km at -84.9078,36.1563 -> -84.8592,36.2922
- 15.1 km at -84.6237,36.4239 -> -84.5733,36.5530

### collins-river — 3 chunks / 14 parts

chunk sizes (parts per chunk): 12, 1, 1; largest inter-chunk gaps:
- 11.7 km at -85.6249,35.4566 -> -85.7163,35.5307
- 3.4 km at -85.6491,35.4797 -> -85.6249,35.4566
- 1.8 km at -85.6966,35.5298 -> -85.7163,35.5307

### duck-river-tailwater — 3 chunks / 30 parts

chunk sizes (parts per chunk): 28, 1, 1; largest inter-chunk gaps:
- 5.6 km at -86.2646,35.4710 -> -86.3252,35.4799
- 3.8 km at -86.3252,35.4799 -> -86.2830,35.4772
- 1.7 km at -86.2646,35.4710 -> -86.2801,35.4798

### fletchers-fork — 3 chunks / 4 parts

chunk sizes (parts per chunk): 2, 1, 1; largest inter-chunk gaps:
- 5.5 km at -87.4323,36.5993 -> -87.4870,36.5775
- 3.2 km at -87.4657,36.5886 -> -87.4323,36.5993
- 1.1 km at -87.4785,36.5849 -> -87.4870,36.5775

### horse-creek-greene — 3 chunks / 5 parts

chunk sizes (parts per chunk): 3, 1, 1; largest inter-chunk gaps:
- 28.3 km at -82.6597,36.4154 -> -82.7108,36.1644
- 18.5 km at -82.7108,36.1644 -> -82.7862,36.3191
- 15.5 km at -82.6597,36.4154 -> -82.7887,36.3219

### hurricane-creek — 3 chunks / 10 parts

chunk sizes (parts per chunk): 7, 2, 1; largest inter-chunk gaps:
- 35.0 km at -87.8161,36.3472 -> -87.5646,36.1069
- 31.4 km at -87.7128,36.3627 -> -87.5646,36.1069
- 9.4 km at -87.8161,36.3472 -> -87.7128,36.3627

### sinking-creek-wilson — 3 chunks / 7 parts

chunk sizes (parts per chunk): 5, 1, 1; largest inter-chunk gaps:
- 22.6 km at -86.5342,36.0465 -> -86.3018,36.1252
- 12.2 km at -86.5342,36.0465 -> -86.4127,36.0945
- 3.7 km at -86.3416,36.1334 -> -86.3018,36.1252

### daddys-creek — 2 chunks / 9 parts

chunk sizes (parts per chunk): 7, 2; largest inter-chunk gaps:
- 1.4 km at -85.0629,35.7760 -> -85.0482,35.7725

### east-fork-shoal-creek — 2 chunks / 2 parts

chunk sizes (parts per chunk): 1, 1; largest inter-chunk gaps:
- 6.1 km at -87.0992,35.0046 -> -87.1646,35.0148

### emory-river — 2 chunks / 15 parts

chunk sizes (parts per chunk): 14, 1; largest inter-chunk gaps:
- 10.8 km at -84.5809,36.0312 -> -84.5003,35.9595

### french-broad-river — 2 chunks / 243 parts

chunk sizes (parts per chunk): 242, 1; largest inter-chunk gaps:
- 1.3 km at -82.9195,35.9398 -> -82.9066,35.9450

### indian-creek-claiborne — 2 chunks / 4 parts

chunk sizes (parts per chunk): 3, 1; largest inter-chunk gaps:
- 25.0 km at -83.6064,36.5569 -> -83.4281,36.3833

### laurel-creek-johnson — 2 chunks / 3 parts

chunk sizes (parts per chunk): 2, 1; largest inter-chunk gaps:
- 2.8 km at -81.7617,36.5689 -> -81.7759,36.5469

### mill-creek-overton — 2 chunks / 55 parts

chunk sizes (parts per chunk): 42, 13; largest inter-chunk gaps:
- 18.8 km at -85.3524,36.4391 -> -85.4757,36.3026

### new-river — 2 chunks / 15 parts

chunk sizes (parts per chunk): 9, 6; largest inter-chunk gaps:
- 4.6 km at -84.3211,36.2103 -> -84.3410,36.2488

### north-chickamauga-creek — 2 chunks / 13 parts

chunk sizes (parts per chunk): 10, 3; largest inter-chunk gaps:
- 1.6 km at -85.2389,35.1858 -> -85.2279,35.1749

### obed-river — 2 chunks / 8 parts

chunk sizes (parts per chunk): 7, 1; largest inter-chunk gaps:
- 1.5 km at -85.0585,35.9556 -> -85.0658,35.9434

### piney-river-rhea — 2 chunks / 76 parts

chunk sizes (parts per chunk): 41, 35; largest inter-chunk gaps:
- 14.5 km at -84.8538,35.6952 -> -84.7892,35.8146

### powell-river — 2 chunks / 5 parts

chunk sizes (parts per chunk): 4, 1; largest inter-chunk gaps:
- 1.3 km at -83.6825,36.4997 -> -83.6828,36.4879

### richardson-byrd-creek — 2 chunks / 41 parts

chunk sizes (parts per chunk): 26, 15; largest inter-chunk gaps:
- 2.5 km at -83.1364,36.4913 -> -83.1547,36.4745

### sequatchie-river — 2 chunks / 4 parts

chunk sizes (parts per chunk): 3, 1; largest inter-chunk gaps:
- 1.8 km at -85.0087,35.7929 -> -85.0000,35.8078

### watauga-river — 2 chunks / 99 parts

chunk sizes (parts per chunk): 98, 1; largest inter-chunk gaps:
- 1.1 km at -82.1264,36.3412 -> -82.1267,36.3315

## Residual endpoint joins applied (<= 1 km, logged per pipeline rule)

Joins are produced by `apps/web/scripts/close-residual-gaps.mjs` and consumed from
`.atlas-src/out/residual-joins.json`. Only endpoint pairs with NO intermediate
NHD/TIGER segment available are bridged, and only up to 1 km.

_(none — every residual gap was filled with real NHD/TIGER geometry or left open)_

## Gaps left open (> 1 km, no public-domain geometry found)

| id | gap | where | reason |
|---|---|---|---|
| elk-river | 59.8 km | -86.3253,35.1485 -> -86.9597,35.0077 | UNEXPECTED — audit fails |
| barren-fork-river | 5.1 km | -85.9630,35.6729 -> -85.9068,35.6742 | UNEXPECTED — audit fails |
| harpeth-river | 33.0 km | -87.1250,36.1687 -> -86.8854,35.9440 | UNEXPECTED — audit fails |
| cane-creek | 207.3 km | -85.3862,35.7254 -> -87.6800,35.6595 | Deliberate (docs/GEO-AUDIT.md "Not correctable" section): ONE catalog id intentionally covers two same-named Cane Creeks — the Bledsoe/Van Buren water and the Hickman/Perry water (~2.3 deg apart). Splitting the id is a catalog change owned by the content lane. |
| sulfur-fork-creek | 43.9 km | -86.8749,36.5197 -> -86.4114,36.6509 | UNEXPECTED — audit fails |
| clear-fork | 52.6 km | -84.6983,36.0910 -> -84.5733,36.5530 | UNEXPECTED — audit fails |
| collins-river | 11.7 km | -85.6249,35.4566 -> -85.7163,35.5307 | UNEXPECTED — audit fails |
| duck-river-tailwater | 5.6 km | -86.2646,35.4710 -> -86.3252,35.4799 | UNEXPECTED — audit fails |
| fletchers-fork | 5.5 km | -87.4323,36.5993 -> -87.4870,36.5775 | UNEXPECTED — audit fails |
| horse-creek-greene | 28.3 km | -82.6597,36.4154 -> -82.7108,36.1644 | UNEXPECTED — audit fails |
| hurricane-creek | 35.0 km | -87.8161,36.3472 -> -87.5646,36.1069 | UNEXPECTED — audit fails |
| sinking-creek-wilson | 22.6 km | -86.5342,36.0465 -> -86.3018,36.1252 | UNEXPECTED — audit fails |
| daddys-creek | 1.4 km | -85.0629,35.7760 -> -85.0482,35.7725 | UNEXPECTED — audit fails |
| east-fork-shoal-creek | 6.1 km | -87.0992,35.0046 -> -87.1646,35.0148 | UNEXPECTED — audit fails |
| emory-river | 10.8 km | -84.5809,36.0312 -> -84.5003,35.9595 | UNEXPECTED — audit fails |
| french-broad-river | 1.3 km | -82.9195,35.9398 -> -82.9066,35.9450 | UNEXPECTED — audit fails |
| indian-creek-claiborne | 25.0 km | -83.6064,36.5569 -> -83.4281,36.3833 | UNEXPECTED — audit fails |
| laurel-creek-johnson | 2.8 km | -81.7617,36.5689 -> -81.7759,36.5469 | UNEXPECTED — audit fails |
| mill-creek-overton | 18.8 km | -85.3524,36.4391 -> -85.4757,36.3026 | UNEXPECTED — audit fails |
| new-river | 4.6 km | -84.3211,36.2103 -> -84.3410,36.2488 | UNEXPECTED — audit fails |
| north-chickamauga-creek | 1.6 km | -85.2389,35.1858 -> -85.2279,35.1749 | UNEXPECTED — audit fails |
| obed-river | 1.5 km | -85.0585,35.9556 -> -85.0658,35.9434 | UNEXPECTED — audit fails |
| piney-river-rhea | 14.5 km | -84.8538,35.6952 -> -84.7892,35.8146 | UNEXPECTED — audit fails |
| powell-river | 1.3 km | -83.6825,36.4997 -> -83.6828,36.4879 | UNEXPECTED — audit fails |
| richardson-byrd-creek | 2.5 km | -83.1364,36.4913 -> -83.1547,36.4745 | UNEXPECTED — audit fails |
| sequatchie-river | 1.8 km | -85.0087,35.7929 -> -85.0000,35.8078 | UNEXPECTED — audit fails |
| watauga-river | 1.1 km | -82.1264,36.3412 -> -82.1267,36.3315 | UNEXPECTED — audit fails |

## Reproduce

```bash
node apps/web/scripts/audit-river-continuity.mjs            # CI check (exit code)
node apps/web/scripts/audit-river-continuity.mjs --write    # regenerate this doc
```
