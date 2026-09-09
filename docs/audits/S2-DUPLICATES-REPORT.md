# DUPLICATES AUDIT — pre-fix state at base 6d0befe (Session 2, 2026-09-08)

Statewide audit of canonical `apps/web/public/atlas/rivers.geojson` before the Session 2 geometry fixes.
Working scripts were in apps/web/.atlas-src/audit-s2/ (gitignored). Coordinates lat,lon.

# Duplicate river-corridor audit — statewide (trout-s2)

Date: 2026-09-08 · Data: `apps/web/public/atlas/rivers.geojson` (canonical, working tree == HEAD) · Region sources: `apps/web/atlas-sources/verified/{west-middle,east-southeast}.geojson`

Detector: `apps/web/.atlas-src/audit-s2/detect-duplicates.cjs` (+ `geo.cjs`, `test-detector.cjs`, `collins-defect.cjs`, `collins-deep-dive.cjs`, `collins-history.cjs`, `make-report.cjs`).

## 1. Method

For every named line feature, **all pairs of its own parts** are compared (features with ≥ 2 parts), plus **all part pairs across feature pairs whose bboxes intersect** (a superset of the same-base-name grouping, so e.g. `duck-river-lower` vs `duck-river-tailwater` is covered; each cross pair is tagged same-base-name / different-name).

A pair (A, B) is a **duplicate corridor** when, in at least one direction:

- samples along A every ~200 m fall within 150 m of B for ≥ 70% of samples, **and**
- arc-length overlap ≥ 2 km, **and**
- the longest *contiguous* overlapped run is ≥ 2 km (sustained overlap — this rejects confluence touches and crossings).

Distances are exact point-to-segment in a local equirectangular frame, computed on a 60 m-densified, grid-indexed polyline. Pairs failing the 70% bar but with a ≥ 2 km run are recorded as "partial".

### Detector validation (synthetic injections into collins-river part 0)

| test | expected | result |
|---|---|---|
| exact duplicate of part 0 | flag | PASS (frac 100%, run 34.56 km) |
| part 0 + 10 m offset copy | flag | PASS (frac 100%, run 34.56 km) |
| part 0 + 50 m offset copy | flag | PASS (frac 100%, run 34.56 km) |
| part 0 + 120 m offset copy | flag | PASS (frac 100%, run 34.56 km) |
| part 0 + 400 m offset copy (too far apart) | pass | PASS (frac 38%, run 1.59 km) |
| short tributary touching part 0 (confluence) | pass | PASS (frac 60%, run 0.60 km) |
| fork diverging after ~1.6 km (legit fork) | pass | PASS (frac 38%, run 1.59 km) |
| partial 20% (~6.9 km) duplicated reach | flag | PASS (frac 100%, run 7.55 km) |
| end-to-end poisoned-file scan | flag | PASS |

Exact duplicates and "slightly different" copies (10–120 m offsets, the Collins defect class) flag; a >150 m-separated path, a short tributary touch, and a fork diverging after ~1.6 km pass clean. A partial duplicate (~6.9 km piece inside a longer part) flags per the directional rule — correct, it would render as a double line.

## 2. Statewide result

- Line features: 104 MultiLineString, **91 with ≥ 2 parts** · part pairs considered: 167,021 · cross-feature feature-pairs with intersecting bbox: 202 · scan time < 1 s.
- **Flagged duplicate-corridor pairs: 9**, concentrated in 3 feature groups (clear-creek-obed intra-feature; duck-river-tailwater ↔ duck-river-lower; elk-river ↔ elk-river-lower).
- Partial (sub-70%) findings: 0.
- All other multi-part rivers are clean at the audit thresholds. A wider 600 m-tolerance sweep (§6.1) surfaces only near-parallel side channels / slivers, whose offsets are an order of magnitude above the true duplicates.

Sum of overlapped length across the 9 flagged pairs: **59.4 km** of double-drawn river.

| # | feature A #part | feature B #part | relation | overlap | coverage | run | mean/max offset | exact copy? |
|---|---|---|---|---|---|---|---|---|
| 1 | clear-creek-obed#4 (18.81 km) | clear-creek-obed#10 (18.81 km) | intra | 18.81 km | 100% | 18.81 km | 0 / 13 m | yes (byte-identical) |
| 2 | duck-river-lower#25 (8.09 km) | duck-river-tailwater#10 (8.09 km) | cross | 8.09 km | 100% | 8.09 km | 0 / 7 m | yes (byte-identical) |
| 3 | duck-river-lower#21 (6.72 km) | duck-river-tailwater#7 (6.72 km) | cross | 6.72 km | 100% | 6.72 km | 0 / 1 m | yes (byte-identical) |
| 4 | elk-river#4 (6.55 km) | elk-river-lower#3 (6.98 km) | cross | 6.36 km | 97% | 6.36 km | 0 / 0 m | near |
| 5 | elk-river#1 (34.66 km) | elk-river-lower#1 (4.59 km) | cross | 4.59 km | 100% | 4.59 km | 1 / 15 m | near |
| 6 | clear-creek-obed#5 (4.48 km) | clear-creek-obed#14 (4.48 km) | intra | 4.48 km | 100% | 4.48 km | 0 / 1 m | yes (byte-identical) |
| 7 | clear-creek-obed#0 (3.99 km) | clear-creek-obed#8 (3.99 km) | intra | 3.99 km | 100% | 3.99 km | 0 / 1 m | yes (byte-identical) |
| 8 | elk-river#23 (3.48 km) | elk-river-lower#9 (3.48 km) | cross | 3.48 km | 100% | 3.48 km | 0 / 3 m | yes (byte-identical) |
| 9 | duck-river-lower#19 (2.86 km) | duck-river-tailwater#4 (2.86 km) | cross | 2.86 km | 100% | 2.86 km | 0 / 0 m | yes (byte-identical) |

## 3. Per-pair detail and traces

Each trace lists 5 points along the flagged part (A), the nearest point on its twin (B), and the offset. Traces confirm every flagged pair is a parallel re-draw of the same channel, not a fork or braid (forks/braids diverge; these pairs re-join and track within meters).

### clear-creek-obed#4 ↔ clear-creek-obed#10 — 18.81 km overlap

- relation: intra-feature; part A 18.81 km / 167 v, part B 18.81 km / 167 v
- overlap 18.81 km · coverage 100.0% (reverse 100.0%) · longest run 18.81 km
- offset mean 0 m, max 13 m at -84.98724, 36.16072
- overlap bbox (w,s,e,n): -85.08317, 36.13279, -84.98724, 36.17015

  | along km | A (lon, lat) | B nearest (lon, lat) | offset m |
  |---|---|---|---|
  | 0 | -85.08165, 36.13279 | -85.08165, 36.13279 | 0 |
  | 4.8 | -85.05492, 36.15115 | -85.05492, 36.15115 | 0 |
  | 9.4 | -85.03461, 36.16505 | -85.03461, 36.16505 | 0 |
  | 14.21 | -85.01277, 36.1606 | -85.01277, 36.1606 | 0 |
  | 18.81 | -84.98724, 36.16072 | -84.98739, 36.1607 | 13 |

### duck-river-lower#25 ↔ duck-river-tailwater#10 — 8.09 km overlap

- relation: cross-feature same-base-name; part A 8.09 km / 27 v, part B 8.09 km / 27 v
- overlap 8.09 km · coverage 100.0% (reverse 100.0%) · longest run 8.09 km
- offset mean 0 m, max 7 m at -86.48461, 35.4656
- overlap bbox (w,s,e,n): -86.48836, 35.4656, -86.46256, 35.48347

  | along km | A (lon, lat) | B nearest (lon, lat) | offset m |
  |---|---|---|---|
  | 0 | -86.46422, 35.48347 | -86.46422, 35.48347 | 0 |
  | 2.02 | -86.46395, 35.47732 | -86.46395, 35.47732 | 0 |
  | 4.05 | -86.47158, 35.47574 | -86.47158, 35.47574 | 0 |
  | 6.07 | -86.48452, 35.47778 | -86.48452, 35.47778 | 0 |
  | 8.09 | -86.48461, 35.4656 | -86.48464, 35.46565 | 7 |

### duck-river-lower#21 ↔ duck-river-tailwater#7 — 6.72 km overlap

- relation: cross-feature same-base-name; part A 6.72 km / 22 v, part B 6.72 km / 22 v
- overlap 6.72 km · coverage 100.0% (reverse 100.0%) · longest run 6.72 km
- offset mean 0 m, max 1 m at -86.44817, 35.46011
- overlap bbox (w,s,e,n): -86.45743, 35.45492, -86.44183, 35.47408

  | along km | A (lon, lat) | B nearest (lon, lat) | offset m |
  |---|---|---|---|
  | 0 | -86.4433, 35.47325 | -86.4433, 35.47325 | 0 |
  | 1.78 | -86.44951, 35.46802 | -86.44951, 35.46802 | 0 |
  | 3.36 | -86.45222, 35.45702 | -86.45222, 35.45702 | 0 |
  | 5.14 | -86.45608, 35.4599 | -86.45608, 35.4599 | 0 |
  | 6.72 | -86.44817, 35.46011 | -86.44816, 35.4601 | 1 |

### elk-river#4 ↔ elk-river-lower#3 — 6.36 km overlap

- relation: cross-feature same-base-name; part A 6.55 km / 22 v, part B 6.98 km / 22 v
- overlap 6.36 km · coverage 97.1% (reverse 94.4%) · longest run 6.36 km
- offset mean 0 m, max 0 m at -86.98714, 35.01254
- overlap bbox (w,s,e,n): -86.99546, 35.0043, -86.95062, 35.01414

  | along km | A (lon, lat) | B nearest (lon, lat) | offset m |
  |---|---|---|---|
  | 0 | -86.95197, 35.0082 | -86.95197, 35.0082 | 0 |
  | 1.59 | -86.96493, 35.00528 | -86.96493, 35.00528 | 0 |
  | 3.18 | -86.98134, 35.00635 | -86.98134, 35.00635 | 0 |
  | 4.77 | -86.98714, 35.01254 | -86.98714, 35.01254 | 0 |
  | 6.35 | -86.99546, 35.01401 | -86.99546, 35.01401 | 0 |

### elk-river#1 ↔ elk-river-lower#1 — 4.59 km overlap

- relation: cross-feature same-base-name; part A 34.66 km / 92 v, part B 4.59 km / 12 v
- overlap 4.59 km · coverage 100.0% (reverse 13.2%) · longest run 4.59 km
- offset mean 1 m, max 15 m at -86.90851, 35.01581
- overlap bbox (w,s,e,n): -86.9474, 35.01581, -86.90632, 35.02858

  | along km | A (lon, lat) | B nearest (lon, lat) | offset m |
  |---|---|---|---|
  | 0 | -86.9083, 35.01595 | -86.9083, 35.01595 | 0 |
  | 1.2 | -86.9168, 35.01683 | -86.9168, 35.01683 | 0 |
  | 2.4 | -86.92495, 35.02516 | -86.92495, 35.02516 | 0 |
  | 3.39 | -86.9349, 35.0269 | -86.9349, 35.0269 | 0 |
  | 4.59 | -86.9474, 35.02774 | -86.9474, 35.02774 | 0 |

### clear-creek-obed#5 ↔ clear-creek-obed#14 — 4.48 km overlap

- relation: intra-feature; part A 4.48 km / 29 v, part B 4.48 km / 29 v
- overlap 4.48 km · coverage 100.0% (reverse 100.0%) · longest run 4.48 km
- offset mean 0 m, max 1 m at -84.90776, 36.15629
- overlap bbox (w,s,e,n): -84.90776, 36.13692, -84.87089, 36.15629

  | along km | A (lon, lat) | B nearest (lon, lat) | offset m |
  |---|---|---|---|
  | 0 | -84.87089, 36.13692 | -84.87089, 36.13692 | 0 |
  | 1.22 | -84.88066, 36.14253 | -84.88066, 36.14253 | 0 |
  | 2.24 | -84.89029, 36.14574 | -84.89029, 36.14574 | 0 |
  | 3.46 | -84.9005, 36.15113 | -84.9005, 36.15113 | 0 |
  | 4.48 | -84.90776, 36.15629 | -84.90775, 36.15629 | 1 |

### clear-creek-obed#0 ↔ clear-creek-obed#8 — 3.99 km overlap

- relation: intra-feature; part A 3.99 km / 24 v, part B 3.99 km / 24 v
- overlap 3.99 km · coverage 100.0% (reverse 100.0%) · longest run 3.99 km
- offset mean 0 m, max 1 m at -84.90775, 36.1563
- overlap bbox (w,s,e,n): -84.93702, 36.14633, -84.90775, 36.1563

  | along km | A (lon, lat) | B nearest (lon, lat) | offset m |
  |---|---|---|---|
  | 0 | -84.93702, 36.15487 | -84.93702, 36.15487 | 0 |
  | 1 | -84.9346, 36.14751 | -84.9346, 36.14751 | 0 |
  | 2 | -84.92493, 36.14731 | -84.92493, 36.14731 | 0 |
  | 2.99 | -84.91623, 36.15065 | -84.91623, 36.15065 | 0 |
  | 3.99 | -84.90775, 36.1563 | -84.90775, 36.15629 | 1 |

### elk-river#23 ↔ elk-river-lower#9 — 3.48 km overlap

- relation: cross-feature same-base-name; part A 3.48 km / 7 v, part B 3.48 km / 7 v
- overlap 3.48 km · coverage 100.0% (reverse 100.0%) · longest run 3.48 km
- offset mean 0 m, max 3 m at -86.93956, 35.01072
- overlap bbox (w,s,e,n): -86.94741, 35.00798, -86.93956, 35.02773

  | along km | A (lon, lat) | B nearest (lon, lat) | offset m |
  |---|---|---|---|
  | 0 | -86.94741, 35.02773 | -86.94741, 35.02773 | 0 |
  | 0.82 | -86.94586, 35.02046 | -86.94586, 35.02046 | 0 |
  | 1.84 | -86.93995, 35.01277 | -86.93995, 35.01277 | 0 |
  | 2.66 | -86.94507, 35.00799 | -86.94507, 35.00799 | 0 |
  | 3.48 | -86.93956, 35.01072 | -86.93959, 35.01071 | 3 |

### duck-river-lower#19 ↔ duck-river-tailwater#4 — 2.86 km overlap

- relation: cross-feature same-base-name; part A 2.86 km / 8 v, part B 2.86 km / 8 v
- overlap 2.86 km · coverage 100.0% (reverse 100.0%) · longest run 2.86 km
- offset mean 0 m, max 0 m at -86.45451, 35.46272
- overlap bbox (w,s,e,n): -86.46368, 35.46272, -86.45432, 35.47082

  | along km | A (lon, lat) | B nearest (lon, lat) | offset m |
  |---|---|---|---|
  | 0 | -86.45432, 35.46278 | -86.45432, 35.46278 | 0 |
  | 0.82 | -86.45899, 35.467 | -86.45899, 35.467 | 0 |
  | 1.43 | -86.46368, 35.47082 | -86.46368, 35.47082 | 0 |
  | 2.25 | -86.45926, 35.46664 | -86.45926, 35.46664 | 0 |
  | 2.86 | -86.45451, 35.46272 | -86.4545, 35.46272 | 0 |

## 4. Recommendations (drop / keep)

### 4.1 clear-creek-obed — drop parts 8, 9, 10, 12, 14 (intra-feature double import)

The middle/lower creek network was imported **twice**: #0↔#8 (3.99 km), #3↔#9 (0.58 km), #4↔#10 (18.81 km), #5↔#14 (4.48 km), #7↔#12 (1.15 km) — five byte-identical part pairs totalling 29.00 km. The two copies are exact coordinate arrays; the later indices (8, 9, 10, 12, 14) are the duplicate import. Keep the first occurrence (0, 3, 4, 5, 7), which chains into the shared unique parts (2, 6, 11, 13). The two shortest pairs (3↔9, 7↔12) are below the 2 km flag threshold but are the same defect.

- Update contract metadata after the drop: `partCount` 15 → 10, `vertexCount` 818 → 585 (−233). The feature carries no `lengthKm`/`sourceIds` contract fields.

### 4.2 duck-river-tailwater ↔ duck-river-lower — drop the Shelbyville-cluster parts from duck-river-tailwater

`duck-river-lower` ("Shelbyville to Columbia") and `duck-river-tailwater` ("Normandy tailwater") both contain the reaches around the Shelbyville handoff. Sixteen tailwater parts (every part of its downstream cluster) are 86–100% duplicated inside duck-river-lower:

| duck-river-tailwater part | length km | duplicated in lower part | coverage |
|---|---|---|---|
| 4 | 2.86 | #19 | 100% |
| 6 | 1.15 | #20 | 100% |
| 7 | 6.72 | #21 | 100% |
| 9 | 0.04 | #22 | 100% |
| 10 | 8.09 | #25 | 100% |
| 12 | 0.90 | #27 | 100% |
| 13 | 0.14 | #25 | 100% |
| 14 | 1.16 | #32 | 86% |
| 17 | 0.85 | #21 | 100% |
| 18 | 0.01 | #22 | 100% |
| 19 | 0.20 | #25 | 100% |
| 20 | 0.04 | #22 | 100% |
| 21 | 0.01 | #21 | 100% |
| 22 | 0.02 | #20 | 100% |
| 23 | 0.01 | #22 | 100% |
| 24 | 0.02 | #19 | 100% |
| 25 | 0.01 | #20 | 100% |

Total: 22.2 km drawn twice. The three ≥ 2 km pairs are in §3 (#4↔#19, #7↔#21, #10↔#25, all byte-identical). Keep `duck-river-lower` whole (it is the continuous 99-part through-route whose scope starts at Shelbyville) and delete the tailwater's downstream cluster (parts 4, 6, 7, 9, 10, 12, 13, 14, 17, 18, 19, 20, 21, 22, 23, 24, 25), leaving the Normandy Dam → Shelbyville route (parts 0–3, 5, 8, 11, 15, 16, 26) — which matches the feature name and its gauge (USGS 03597860 *Duck River at Shelbyville*).

### 4.3 elk-river ↔ elk-river-lower — drop parts 1, 3, 9 (+ fragments) from elk-river-lower

USGS 03584600 *"Elk River at Prospect"* — the feature-namesake handoff point — sits at **-86.99466, 35.01424** (provenance.json). The duplicated reaches (35.004–35.029 N, -86.906…-86.996 W) lie **north-east (upstream) of Prospect**, i.e. inside `elk-river` (Tims Ford tailwater) scope and outside `elk-river-lower` ("Prospect to state line"):

| elk-river-lower part | length km | duplicated in elk-river part | coverage | action |
|---|---|---|---|---|
| 1 | 4.59 | #1 | 100% | drop (flagged pair) |
| 3 | 6.98 | #4 | 94% | drop (flagged pair) |
| 5 | 0.45 | #13 | 100% | drop (fragment of same defect) |
| 6 | 1.05 | #1 | 100% | drop (fragment of same defect) |
| 9 | 3.48 | #23 | 100% | drop (flagged pair) |
| 11 | 0.10 | #4 | 100% | drop (fragment of same defect) |
| 13 | 0.03 | #4 | 100% | drop (fragment of same defect) |
| 20 | 0.84 | #56 | 100% | drop (fragment of same defect) |
| 25 | 0.03 | #1 | 100% | drop (fragment of same defect) |
| 26 | 0.03 | #1 | 100% | drop (fragment of same defect) |
| 27 | 0.04 | #4 | 100% | drop (fragment of same defect) |
| 33 | 0.02 | #4 | 100% | drop (fragment of same defect) |
| 34 | 0.03 | #4 | 100% | drop (fragment of same defect) |
| 35 | 0.03 | #4 | 100% | drop (fragment of same defect) |

Keep `elk-river`'s copies (its 64-part route is continuous there). After the drop, `elk-river-lower` starts at the Prospect gauge reach and runs to the state line as named. Contract metadata (`partCount` 36, `vertexCount` 175, `lengthKm` 47.44) must be recomputed.

### 4.4 collins-river — no fix needed at HEAD (see §5)

## 5. Collins River deep-dive

### 5.1 Current canonical state: the duplicate is NOT present

`collins-river` at HEAD has 28 parts / 453 vertices / 130.79 km. Every part pair was scanned at 150, 300 and 600 m tolerances: no pair reaches 2 km of sustained overlap at any tolerance (best: parts 7↔10 with a 1.92 km run at 600 m — adjacent chain parts sharing a valley bend, not duplicates). The statewide detector likewise flags nothing for collins-river.

The described defect — two overlapping corridors that differ slightly — is real, but it lives in the **defect-era source revision**, and was already eliminated before the canonical merge:

```
6a44063 09-05 geo(west-middle): authoritative NHD rebuild   ← collins 68 parts, DUPLICATE PRESENT
a954d51 09-05 geo(integrate): west-middle staging conformance  ← collins 28 parts, duplicates dropped
30b2c83 09-05 geo(integrate): merge verified west-middle + east-southeast into canonical atlas
2995553/4e23914 09-07 controlled regeneration / G2 split      ← collins 28 parts, clean
```

### 5.2 The defect, reconstructed (west-middle.geojson @ 6a44063)

Defect-era source: `git show 6a44063:apps/web/atlas-sources/verified/west-middle.geojson` (68-part collins-river, the "authoritative NHD rebuild" commit).
A 5.6 km reach of the Collins (Upper Hills Creek area, Warren/Van Buren county line) exists twice — two near-identical digitizations of the same channel. The copies share both junctions, so on the map they render as a thin closed "lens" of double teal lines.

- J1 (downstream junction): -85.69345, 35.55255 — corridor copies start within 2 m of each other
- J2 (upstream junction):   -85.69623, 35.61264 — corridor copies end within 3 m of each other
- Between the three duplicated pieces the two corridors SHARE single-copy connector parts, i.e. the duplication is piece-wise, interleaved with shared parts.

### Corridor membership, length, bbox

| corridor | duplicated parts (downstream -> upstream) | total length | vertices | bbox (w,s,e,n) |
|---|---|---|---|---|
| A | 34 + 23 + 26 | 9.12 km | 36 | -85.70485, 35.55255, -85.68600, 35.61264 |
| B | 66 + 49 + 56 | 9.06 km | 27 | -85.70485, 35.55255, -85.68644, 35.61264 |

Part-level detail:

| part | corridor | verts | length km | start | end |
|---|---|---|---|---|---|
| 34 | A | 18 | 4.53 | -85.69345,35.55255 | -85.70206,35.56961 |
| 23 | A | 8 | 2.20 | -85.70031,35.57061 | -85.69990,35.58738 |
| 26 | A | 10 | 2.40 | -85.70312,35.60095 | -85.69623,35.61264 |
| 66 | B | 14 | 4.50 | -85.69345,35.55255 | -85.70206,35.56961 |
| 49 | B | 6 | 2.18 | -85.70031,35.57061 | -85.69990,35.58738 |
| 56 | B | 7 | 2.38 | -85.70312,35.60095 | -85.69623,35.61264 |

### Deviation between the corridors (piece-pair measurements)

| piece pair (A <-> B) | overlap km | coverage | run km | mean offset m | max offset m | max-offset at (lon,lat) |
|---|---|---|---|---|---|---|
| 34 <-> 66 | 4.53 | 100% | 4.53 | 11 | 47 | -85.69172, 35.55875 |
| 23 <-> 49 | 2.20 | 100% | 2.20 | 8 | 33 | -85.69978, 35.58561 |
| 26 <-> 56 | 2.40 | 100% | 2.40 | 12 | 32 | -85.69424, 35.60387 |

Overall max deviation between the two corridors: 47 m, on piece pair 34<->66, at -85.69172, 35.55875 (nearest point on the twin: -85.69198, 35.55911).
The corridors converge to 0-3 m at J1 and J2 (they diverge gradually downstream-to-upstream and pinch back together at both ends — the classic double-digitization lens).

### 5-point trace, piece 34 (A) vs piece 66 (B)

| along km | A (lon,lat) | B nearest (lon,lat) | offset m |
|---|---|---|---|
| 0 | -85.69345, 35.55255 | -85.69345, 35.55255 | 0 |
| 1.18 | -85.68618, 35.55842 | -85.68649, 35.55842 | 27 |
| 2.36 | -85.6957, 35.55732 | -85.69573, 35.55736 | 6 |
| 3.35 | -85.69797, 35.5635 | -85.69838, 35.56356 | 38 |
| 4.53 | -85.70203, 35.56962 | -85.70206, 35.56961 | 3 |

### 5-point trace, piece 23 (A) vs piece 49 (B)

| along km | A (lon,lat) | B nearest (lon,lat) | offset m |
|---|---|---|---|
| 0 | -85.70031, 35.57061 | -85.70031, 35.57061 | 0 |
| 0.6 | -85.7018, 35.57554 | -85.7018, 35.57554 | 0 |
| 1.2 | -85.70302, 35.57908 | -85.70302, 35.57908 | 0 |
| 1.6 | -85.70065, 35.5821 | -85.70065, 35.5821 | 0 |
| 2.2 | -85.69991, 35.58741 | -85.6999, 35.58738 | 3 |

### 5-point trace, piece 26 (A) vs piece 56 (B)

| along km | A (lon,lat) | B nearest (lon,lat) | offset m |
|---|---|---|---|
| 0 | -85.70312, 35.60095 | -85.70312, 35.60095 | 0 |
| 0.6 | -85.69873, 35.60497 | -85.69862, 35.60489 | 14 |
| 1.2 | -85.69508, 35.60234 | -85.69508, 35.60234 | 0 |
| 1.8 | -85.69449, 35.60746 | -85.69456, 35.60746 | 7 |
| 2.4 | -85.69624, 35.61266 | -85.69623, 35.61264 | 3 |

### Survivor analysis: current canonical (28 parts) vs the two defect-era corridors

- canonical part 6 (20.55 km, 57 v) vs overlapping defect pieces: piece 34(A): cov 2%, mean 70 m; piece 23(A): cov 28%, mean 22 m; piece 26(A): cov 25%, mean 17 m; piece 66(B): cov 2%, mean 70 m; piece 49(B): cov 28%, mean 23 m; piece 56(B): cov 25%, mean 17 m
- canonical part 8 (16.18 km, 53 v) vs overlapping defect pieces: piece 34(A): cov 57%, mean 6 m; piece 66(B): cov 57%, mean 6 m

Read: canonical part 8 tracks defect pieces 34/66 (57% coverage, 6 m mean) and canonical part 6 tracks pieces 23/49 and 26/56 (25-28% coverage, 17-23 m mean) — and it matches corridor A and corridor B EQUALLY in every case. The conformance pass replaced the doubled reach with a single rebuilt centerline; neither raw copy survived verbatim.

### 5.3 Region-file comparison

- `collins-river` bbox is **-85.741953, 35.392741 → -85.580687, 35.805913** — squarely in the west/middle region. Accordingly it appears in **`west-middle.geojson` only**; `east-southeast.geojson` does not contain it (48 features, no collins id).
- The west-middle collins geometry is **byte-identical to canonical**: sha256 of the coordinate JSON = `bc3a08badb826b65…` (10,361 bytes) on both sides; 28 parts / 453 vertices in both. There is no canonical-vs-region drift for this feature.

### 5.4 Collins recommendation

- **At HEAD: nothing to drop.** If the west-middle staging is ever re-merged without the conformance pass, drop corridor B (parts 66, 49, 56 in the 68-part revision; 9.06 km / 27 v) and keep corridor A (34, 23, 26; 9.12 km / 36 v) — A is the denser trace of the same channel (36 vs 27 vertices at equal length), and the current rebuilt canonical centerline matches both at the same 6–23 m level, so either copy is equally consistent with HEAD.
- Incidental finding (not duplicates): parts 4 and 12–27 of the current 28-part feature are seventeen degenerate 2–3 vertex slivers (0.01–0.69 km) — NHD micro-connectors worth cleaning up in a separate pass, but harmless.

## 6. True duplicates vs legitimate multi-part rivers

### 6.1 600 m-tolerance sensitivity sweep (statewide, intra-feature)

Re-running the scan at a 600 m offset band (6,543 bbox-intersecting intra-feature part pairs) surfaces 23 pairs with a ≥ 2 km run that the 150 m threshold rejects. Every one has mean offsets of 116–341 m (max up to 544 m) — an order of magnitude above the true duplicates (≤ 15 m) — i.e. near-parallel channels, not copies. Spot traces of the highest-risk candidates (`buffalo-river#5↔#70`, `cumberland-river#26↔#86/#96`, `white-oak-creek#4↔#20`, `upper-hills-creek#1↔#9/#2↔#7`) show offsets pinching to ≤ 16 m at the run ends while swelling to 140–420 m mid-channel — the signature of island side channels / cut-off loops, which diverge and rejoin, unlike duplicates that track uniformly:

| pair | lens km | run @600m | mean/max offset m | verdict |
|---|---|---|---|---|
| big-rock-creek#2 ↔ #10 | 8.16 / 1.48 | 2.33 km | 116 / 380 | near-parallel channel, not a copy at 150 m |
| buffalo-river#5 ↔ #70 | 5.20 / 2.14 | 2.14 km | 277 / 541 | near-parallel channel, not a copy at 150 m |
| clear-creek-obed#0 ↔ #8 | 3.99 / 3.99 | 3.99 km | 0 / 1 | TRUE DUPLICATE |
| clear-creek-obed#4 ↔ #10 | 18.81 / 18.81 | 18.81 km | 0 / 13 | TRUE DUPLICATE |
| clear-creek-obed#5 ↔ #14 | 4.48 / 4.48 | 4.48 km | 0 / 1 | TRUE DUPLICATE |
| cumberland-river#26 ↔ #86 | 19.49 / 2.08 | 2.08 km | 254 / 506 | near-parallel channel, not a copy at 150 m |
| cumberland-river#26 ↔ #96 | 19.49 / 2.31 | 2.31 km | 140 / 200 | near-parallel channel, not a copy at 150 m |
| duck-river-lower#0 ↔ #1 | 20.42 / 31.03 | 2.58 km | 242 / 533 | near-parallel channel, not a copy at 150 m |
| elk-river#0 ↔ #37 | 12.68 / 0.64 | 2.18 km | 178 / 544 | near-parallel channel, not a copy at 150 m |
| hatchie-river#2 ↔ #5 | 8.56 / 8.20 | 2.14 km | 259 / 507 | near-parallel channel, not a copy at 150 m |
| hatchie-river#7 ↔ #52 | 40.58 / 0.02 | 2.39 km | 275 / 478 | near-parallel channel, not a copy at 150 m |
| hurricane-creek#3 ↔ #25 | 27.76 / 1.47 | 4.76 km | 141 / 355 | near-parallel channel, not a copy at 150 m |
| hurricane-creek#4 ↔ #19 | 9.20 / 0.46 | 3.13 km | 212 / 469 | near-parallel channel, not a copy at 150 m |
| hurricane-creek#4 ↔ #24 | 9.20 / 0.01 | 2.15 km | 277 / 516 | near-parallel channel, not a copy at 150 m |
| little-west-fork-creek#1 ↔ #5 | 19.31 / 1.74 | 2.17 km | 341 / 511 | sub-threshold sustained run, noise |
| little-west-fork-creek#7 ↔ #9 | 2.68 / 1.70 | 2.68 km | 191 / 312 | sub-threshold sustained run, noise |
| obion-river#3 ↔ #14 | 23.18 / 0.03 | 2.38 km | 259 / 510 | near-parallel channel, not a copy at 150 m |
| salt-lick-creek#15 ↔ #16 | 9.33 / 2.15 | 2.33 km | 217 / 464 | near-parallel channel, not a copy at 150 m |
| salt-lick-creek#15 ↔ #19 | 9.33 / 0.01 | 2.14 km | 269 / 529 | near-parallel channel, not a copy at 150 m |
| salt-lick-creek#15 ↔ #20 | 9.33 / 0.01 | 2.14 km | 275 / 506 | near-parallel channel, not a copy at 150 m |
| upper-hills-creek#1 ↔ #9 | 2.02 / 0.51 | 2.02 km | 180 / 293 | small-creek loop vs stub |
| upper-hills-creek#2 ↔ #7 | 2.61 / 0.01 | 2.23 km | 248 / 440 | degenerate 10 m sliver artifact |
| white-oak-creek#4 ↔ #20 | 2.55 / 2.99 | 2.06 km | 251 / 528 | near-parallel channel, not a copy at 150 m |

The three clear-creek-obed rows are the §4.1 duplicates rediscovered at the wider tolerance (mean ≤ 1 m). All remaining rows are natural near-parallel geometry (bottomland side channels, meander-adjacent sequential parts, sliver artifacts) with mean offsets ≥ 116 m; none renders as a doubled corridor at map scale.

### 6.2 Legitimate high-part-count systems (intra-feature clean at audit thresholds)

- **Legit systems correctly not flagged (intra-feature):** barren-fork-river (14 parts — tributary forks that diverge), buffalo-river (103), duck-river-lower (99; its cross-feature issue with the tailwater is §4.2), cumberland-river (161), harpeth-river (69), wolf-river-west-tennessee (60), caney-fork-upper (29), duck-river-tailwater (27; cross-feature issue §4.2), elk-river (64; cross-feature issue §4.3), hatchie-river (57), obion-river (34), salt-lick-creek (51), shoal-creek (51) — all sequential NHD flowline parts or diverging forks; zero intra-feature flags. The contiguous-run rule (≥ 2 km) is what rejects confluence touches/crossings, and the 70% rule rejects forks that share only a short valley.
- **All 9 flagged pairs verified as true duplicates by trace:** 6 of 9 are byte-identical coordinate arrays; the 3 elk pairs differ by 0–15 m (re-digitized boundary reach). Mean offsets are 0–1 m on 8 of 9 pairs — these are copies, not braided channels.

## 7. Reproduce

```
cd apps/web/.atlas-src/audit-s2
node detect-duplicates.cjs        # statewide scan -> findings.json + console table
node test-detector.cjs            # 9 synthetic validation cases
node collins-deep-dive.cjs        # current-state part inventory + 150/300/600 m sensitivity scan + region hashes
node collins-history.cjs          # collins structure in defect-era revisions (hist-tmp/)
node collins-defect.cjs           # corridor reconstruction + survivor analysis
node make-report.cjs              # this report
```

Intermediate artifacts (`findings.json`, `self-test.json`, `collins-*.md`, `hist-tmp/*.geojson`) are kept next to the scripts; `apps/web/.atlas-src/` is git-ignored.
