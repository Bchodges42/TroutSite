# NHD-CONVENTIONS — USGS NHD trace engine: frozen conventions (GEOCONV-0)

> Status: **frozen by session GEOCONV-0 (2026-09-11)** for consumption by
> GEOFANOUT-1 (fan-out to all Tennessee HU8s) and GEOVALID-2 (audit/regression).
> This document is the contract. A stranger session must be able to convert a
> new watershed end-to-end using nothing but this file. Nothing in this lane
> ships to production; production integration (replacing
> `apps/web/public/atlas/rivers.geojson` geometry) is a later, separately
> approved step.

Lane: `geoconv/nhd-engine` · Clone: `TroutSite-nhdconv0` · Base: snapshot
commit `1300194` (no remote — push deferred, see PROGRESS.md).

---

## 1. Mission and non-goals

Replace TIGER-derived catalog river geometry with **USGS NHD traced reaches**:
one connected, flow-directed trace per named water, from terminus to terminus
(dam → mouth for tailwaters), produced by a deterministic engine whose inputs
are committed JSONL files — never a live GDAL call.

Non-goals here: no changes to `apps/web/**`, `packages/contracts/**`; no
multi-HU8 assembly; no catalog/YAML edits; no production deploy.

## 2. Source data (USGS NHD, public domain)

- Product: **USGS National Hydrography Dataset Best Resolution for HU8,
  FileGDB** (1:24,000-scale NHD with high-resolution flowlines).
- Index (open S3, verified 2026-09-11):
  `https://prd-tnm.s3.amazonaws.com/index.html?prefix=StagedProducts/Hydrography/NHD/HU8/GDB/`
- Per-watershed object (deterministic URL, no scraping needed):
  `https://prd-tnm.s3.amazonaws.com/StagedProducts/Hydrography/NHD/HU8/GDB/NHD_H_<hu8code>_HU8_GDB.zip`
- Tennessee-basin HU8 codes enumerate as `0601xxxx` (prefix-scan
  `.../GDB/NHD_H_0601` lists all 16 Upper-Tennessee units). The reference
  watershed for this lane is **`06010207` "Lower Clinch"** (contains Norris
  Lake, Norris Dam, the Clinch tailwater, Melton Hill Lake, and the Clinch
  mouth at Kingston).
- Record in each `<hu8>.meta.json`: source URL/object, zip SHA-256, published
  date (from the GDB's metadata XML), GDAL version, filter, counts. Raw GDB/zip
  are **never committed**; they are re-downloadable and checksummed.

## 3. GDAL policy (hard rule)

`ogr2ogr` is a **maintainer tool only**, used exactly once per watershed via
`scripts/nhd_convert_gdb.sh`. GDAL must never appear in `package.json`, build
steps, tests, or CI. The derived JSONL (§4) is the only interface everything
else consumes. Install once with `brew install gdal` (macOS) or the
winget/conda equivalent (Windows).

## 4. File conventions (committed per HU8)

```
data/nhd/hu8/<hu8>.jsonl                 # named flowlines (the primary interface)
data/nhd/hu8/<hu8>.vaa.jsonl             # VAA table (join by permanent_identifier)
data/nhd/hu8/<hu8>.waterbodies.jsonl     # named waterbodies, geometry: null
data/nhd/hu8/<hu8>.meta.json             # provenance + counts (written by converter)
data/nhd/graphs/<hu8>.graph.json         # trace graph (built from the above)
data/nhd/derived/<hu8>.anchors.json      # per-HU8 anchor snap report
data/nhd/derived/reach-<water-id>.geojson      # traced reach (asset-shaped)
data/nhd/derived/reach-<water-id>.audit.json   # per-edge trace audit
data/nhd/derived/reach-<water-id>.validate.json # B13 validation report
```

GeoJSONL = one GeoJSON `Feature` per line (GeoJSONSeq with `RS=no`).
Coordinate precision in committed JSONL: **6 decimals** (~0.11 m), `EPSG:4326`
(source is NAD83/EPSG:4269; the transform is applied once at convert time).
`coordinateOrder` is always `longitude,latitude`.

Byte budgets (enforced by review; converter prints sizes):

| file | budget (per HU8) | 06010207 actual |
|---|---|---|
| `<hu8>.jsonl` | ≤ 4 MB | 2.2 MB (1,840 features) |
| `<hu8>.vaa.jsonl` | ≤ 3 MB | 2.4 MB (5,981 rows) |
| `<hu8>.waterbodies.jsonl` | ≤ 100 KB | 2.4 KB (15 rows) |
| `<hu8>.graph.json` | ≤ 6 MB | 2.76 MB (1,810 nodes / 1,840 edges) |
| `reach-<water>.geojson` | ≤ 80 KB (hard-enforced) | 15.6 KB (clinch-river) |

### 4.1 Flowline filter (frozen)

`ftype IN (460, 558) AND gnis_name IS NOT NULL` — named Stream/River (460,
FCode 46006 perennial / 46003 intermittent) plus named Artificial Path (558 —
hi-res NHD's reservoir/impoundment channel; **not** 336, which is Canal/Ditch
in this product). Connectors (334) and unnamed features are excluded by
design; confluence connectivity is restored by endpoint snapping (§5).
Multipart flowlines are rejected at build time (measured 0 in 06010207); if a
future product ships multiparts, explode collections **in the converter**, not
downstream.

Kept fields: `permanent_identifier, gnis_id, gnis_name, ftype, fcode,
reachcode, flowdir, lengthkm, mainpath, innetwork,
wbarea_permanent_identifier`. VAA keeps the full attribute list (§5.2).
Waterbodies keep `permanent_identifier, gnis_id, gnis_name, ftype, fcode` and
`geometry: null` (their only job is resolving `wbarea → name/type`; keeping
polygon geometry blew the file to 3.6 MB for 15 rows).

## 5. Graph conventions (`nhd_build_graph.mjs`)

### 5.1 Nodes and snapping

- Node identity = **endpoint snap at `--tolerance-m 12`** (union-find over a
  spatial hash; 3×3 neighborhood, conservative lon cell
  `tolM / (111320·cos(lat))`). Representative node coordinate = member average,
  except dam bridges (§5.3) which use the non-lake side so the node sits on the
  tailwater line.
- Node ids are **deterministic**: `n<index>` by sorted representative
  coordinate — same input bytes ⇒ same graph file (later lanes can diff).
- Measured merge quality in 06010207 at 12 m: 1,831 exact merges, 39 merges in
  (0, 12 m], zero evidence of false merges (all small components are genuine
  boundary fragments: Wallace Creek, Hinds Creek, Roaring Creek, West Branch
  Bullrun Creek, Grassy Creek, Massengill Spring Branch — tributaries that
  continue in neighboring HU8s). **Keep 12 m** unless a new watershed shows
  measurable confluence gaps > 12 m; then raise only with a merge-diff review.

### 5.2 Direction and VAA

- Edges are stored **downstream-first**. `flowdir == 1` (digitized direction is
  downstream) keeps orientation; `flowdir == 2` reverses; anything else keeps
  digitized order and increments `meta.counts.nonStandardFlowdir`. All 1,840
  named features in 06010207 are `flowdir == 1`.
- The GDB ships a `NHDFlowlineVAA` table (fromnode/tonode/hydroseq/
  levelpathid/divergenceflag/arbolatesumkm/…) joined by
  `permanent_identifier`. **In the current Best Resolution product every VAA
  attribute is NULL** (the table exists, the values are not populated). The
  builder therefore records `vaa` (null or object) per edge and
  `meta.vaaPopulated`, but topology/direction/divergence DO NOT depend on VAA.
  If a future product populates VAA: fromnode/tonode may override snapping
  (with measured-gap recording) and `divergenceflag`/`hydroseq` take priority
  in the fork rule (§6.3) — that is a conventions **v2** change, not a silent
  behavior switch.

### 5.3 Dam-junction bridge (the one deliberate topology exception)

NHD leaves the physical dam unmapped: a reservoir's artificial path ends
10–100 m short of the tailwater's first flowline (measured: Norris Dam gap
**43.4 m**). After the primary snap, the builder merges an endpoint pair ONLY
when:

1. one endpoint belongs to an **artificial path (ftype 558) whose `wbarea`
   resolves to a named LakePond/Reservoir waterbody (ftype 390/436)**, and
2. the other endpoint is within `--dam-gap-m 100` and belongs to a different
   waterbody, and
3. they are the nearest such pair (deterministic scan order).

Streams can never merge through this rule — it only fires at impoundment
boundaries. Every bridge is recorded in `meta.damBridges`
(`{lakePid, joinedPid, distM, coord}`; 28 bridges in 06010207). Review this
list when adopting a new watershed.

## 6. Anchors, tracing, output (`nhd_snap_anchors.mjs`, `nhd_trace.mjs`)

### 6.1 Anchor snapping

Gauge anchors come from `apps/web/src/data/streams-geo.json` (**read-only**
for this lane). Each anchor inside the HU8 bbox (+5 km margin) is projected to
the nearest edge; the report records `distM`, snapped point, edge pid/name.
Status: `ok` ≤ **250 m**, `far` > 250 m (reviewable — in 06010207, `emory-river`
is `far` because its gauge sits in neighboring HU8 06010208), `out-of-hu8`
otherwise. A `far` snap must be explained, never silently accepted.

### 6.2 Trace CLI (frozen interface)

```
node scripts/nhd_trace.mjs \
  --graph data/nhd/graphs/<hu8>.graph.json \
  --id <water-id> --name "<display name>" [--gnis "<exact NHD name>"] \
  --waterbody-type <river|creek|tailrace|...> \
  --anchor <lat>,<lng> \
  --up "<termini-spec>" --down "<termini-spec>" \
  --out data/nhd/derived/reach-<water-id>.geojson \
  [--simplify-m 10,25,50] [--budget-bytes 81920] [--round 5]
```

Termini grammar:

| spec | up semantics | down semantics |
|---|---|---|
| `dam:<waterbody gnis_name>` | stop when the next upstream edge is an artificial path resolving to that named waterbody (the dam node). REQUIRED for `waterbodyType: tailrace` waters (matches `packages/content/streams/tn/*.yaml`) — no silent guessing. | n/a |
| `headwater` | walk to a node with no incoming edges | n/a |
| `mouth` | n/a | stop at a node with no outgoing edges **or** at a name change (records the entered names) |
| `confluence:<gnis_name>` | n/a | stop when the next edge is named `<gnis_name>` |
| `point:<lat>,<lng>` | n/a | stop within 150 m of the point |

### 6.3 Walk rules (frozen)

- "down" follows `from → to`; "up" follows `to → from` (edges stored
  downstream-first, §5.2).
- At a fork with `k > 1` open candidates, rank: **(1) same `gnis_name` as the
  current edge** (name continuity through braids and reservoir artificial
  paths), **(2) longest total remaining path** — memoized longest-flow-path DFS
  in km, the stand-in for NHDPlus VAA `arbolatesumkm`/`hydroseq` (§5.2),
  **(3) lowest pid** as deterministic tie-break. Every fork decision is logged
  in the audit (`divergenceLog`: candidates, chosen, rule).
- Output path runs **terminus-first** (upstream terminus → anchor → downstream
  terminus); every edge is pushed in stored orientation. The anchor edge is
  split exactly at the projected anchor point.

### 6.4 Reach output schema

The reach is a single-feature GeoJSON whose properties keep the
`apps/web/public/atlas/rivers.geojson` shape **unchanged** (`id, name,
waterbodyType, throughLakeIds, allowOpenEnds, source, approximate,
labelAnchor, bounds, crs, coordinateOrder, partCount, vertexCount, lengthKm,
sourceIds, sourceRetrieved`) so `apps/web` needs **zero code changes** at
integration. `sourceIds` = the trace's `permanent_identifier` list (matches the
asset's existing NHD pid convention). Additive, documented keys (consumers must
ignore what they don't know — additive-only policy):

- `geometrySource: "nhd"` — trace came from NHD. TIGER-fallback geometry
  (§8) carries `geometrySource: "tiger"`.
- `hu8` — originating watershed.
- `simplification: {toleranceM, verticesBefore, verticesAfter, budgetBytes}`.
- `trace: {anchor{lat,lon,snapDistM}, up{spec,reason,terminus,distKmFromAnchor},
  down{...}, vaaUsed, toleranceM}`.
- `throughLakeIds` is an EXISTING key; the engine fills it from traversed named
  reservoir artificial paths (`clinch-river` → `["melton-hill-lake",
  "whiteoak-lake", "watts-bar-lake"]`) — integration lane should reconcile
  against the catalog YAML before shipping.

### 6.5 Simplification and byte budget (PWA precache)

The simplified reach feeds the PWA precache via `rivers.geojson`, so bytes are
a hard constraint: Douglas-Peucker at `--simplify-m` (ladder **10 → 25 → 50 m**,
first tolerance under budget wins), coordinates rounded to **5 decimals**
(~1.1 m), budget **80,000 bytes per reach** (`--budget-bytes`). Over budget at
50 m ⇒ the CLI **fails loudly**; raise the budget only as an explicit flagged
decision, never silently. Regenerating the full-state `rivers.geojson` (later
lane) must keep the total ≤ **2.0 MB** (current asset 1.83 MB +10 % headroom) —
enforce at integration time.

## 7. Validation (B13 known-bad gate, `nhd_validate.mjs`)

Reference command (regression baseline committed at
`data/nhd/derived/reach-clinch-river.validate.json`, verdict **PASS**):

```
node scripts/nhd_validate.mjs \
  --reach data/nhd/derived/reach-clinch-river.geojson \
  --graph data/nhd/graphs/06010207.graph.json \
  --asset apps/web/public/atlas/rivers.geojson \
  --separate-from boone-tailwater,south-holston-river \
  --expect-up-point 36.2242,-84.0913 --expect-up-radius-m 600 \
  --expect-down-point 35.8809,-84.5085 --expect-down-radius-m 3000
```

Checks (lat,lng for `--expect-*-point`; exit 1 on any failure):

| check | meaning | clinch-river result |
|---|---|---|
| `connectivity` | sourceIds form ONE connected subgraph | PASS (184 edges, 1 component) |
| `continuity` | worst junction gap between consecutive path edges ≤ 50 m | PASS (0 m — all junctions exact) |
| `upstream-span` | first vertex within radius of Norris Dam (geocoded 36.2242,-84.0913) | PASS (112 m) |
| `downstream-span` | last vertex within radius of Kingston city center (mouth proxy) | PASS (2,991 m of 3,000 m; actual mouth -84.5339,35.8635) |
| `separation:*` | reach bbox disjoint from each known-bad water in the shipped asset | PASS (boone-tailwater, south-holston-river) |
| `anchor-on-reach` | anchor snap ≤ 250 m | PASS (91.3 m) |
| `byte-budget` | reach ≤ 80 KB | PASS (15.6 KB) |

Long chords WITHIN an edge are legitimate (reservoir artificial paths are
straight multi-km lines — the Clinch path contains a 1,282 m chord inside
Melton Hill Lake); the junction check, not the vertex-chord scan, is
authoritative. Reach totals: **125 km, 595 vertices, 1 part, bounds
[-84.5339, 35.8632, -84.0752, 36.2239]** — replacing the old two-part,
301 km asset whose bounds wrongly reached -82.89/36.59 (upstream of the dam).

## 8. Fallback policy (frozen)

A water that is **absent or unnamed in NHD** keeps its existing TIGER-derived
linework and is flagged `geometrySource: "tiger"` in the audit output. NHD
traces carry `geometrySource: "nhd"`. **Never silently mix** sources within one
water's geometry, and never drop a catalog water because NHD lacks it — the
fan-out lane's report must list every water with its `geometrySource`.

## 9. Notes for the consuming lanes

- **GEOFANOUT-1 (fan-out):** repeat §2–§6 per HU8; the only per-watershed
  judgment calls are (a) picking the HU8 containing the anchors, (b) reviewing
  `meta.damBridges`, (c) explaining every `far` anchor, (d) termini specs per
  water (dam names come from `packages/content/streams/tn/*.yaml`
  `waterbodyType: tailrace` entries + label notes). Cross-HU8 waters
  (Clinch/Powell/Emory span several) are traced per-HU8; stitching is a
  separate, explicitly approved step — per-HU8 reaches legitimately end at
  boundary nodes (the Clinch ends at the Kingston boundary node with reason
  `terminal-node`).
- **GEOVALID-2 (audit):** run §7 per water; extend `--separate-from` with the
  full known-bad list (cane-creek multi-longitude disconnection is covered by
  the junction check when the water is traced as one path — the historical
  cane-creek defect was two unrelated same-named creeks merged in one feature,
  which the trace engine cannot reproduce because each trace starts from one
  anchor).
- **Integration (not this lane):** merge reach properties into
  `rivers.geojson` (schema unchanged), reconcile `throughLakeIds`/
  `regionId`/`gaugeIds` with the catalog, regenerate `riverIndex.json`, keep
  total ≤ 2.0 MB.
- **VAA:** if a future NHD product populates the VAA table, adopting it is a
  conventions v2 change: snapping keeps 12 m for geometry, VAA fromnode/tonode
  become authoritative node identity, `divergenceflag`/`hydroseq` lead the
  fork rule, and the dam bridge stays (dams are physical gaps, not VAA gaps).

## 10. Reproducibility (reference transcript)

```
# 0) tooling (once): brew install gdal   # maintainer tool only
# 1) source
curl -sS -o /tmp/nhd06010207/NHD_H_06010207_HU8_GDB.zip \
  https://prd-tnm.s3.amazonaws.com/StagedProducts/Hydrography/NHD/HU8/GDB/NHD_H_06010207_HU8_GDB.zip
unzip -q -d /tmp/nhd06010207 /tmp/nhd06010207/NHD_H_06010207_HU8_GDB.zip
# 2) convert (writes data/nhd/hu8/06010207*)
scripts/nhd_convert_gdb.sh 06010207 /tmp/nhd06010207/NHD_H_06010207_HU8_GDB.gdb \
  /tmp/nhd06010207/NHD_H_06010207_HU8_GDB.zip
# 3) graph
node scripts/nhd_build_graph.mjs --hu8 06010207
# 4) anchors
node scripts/nhd_snap_anchors.mjs --hu8 06010207
# 5) trace + validate
node scripts/nhd_trace.mjs --graph data/nhd/graphs/06010207.graph.json \
  --id clinch-river --name "Clinch River" --waterbody-type tailrace \
  --anchor 36.2156,-84.0821 --up "dam:Norris Lake" --down mouth \
  --out data/nhd/derived/reach-clinch-river.geojson
node scripts/nhd_validate.mjs   # see §7
```

Zip SHA-256 (06010207, published 20231216):
`70580f6ac391638529b2a7d860b8cdfd33c567398f28393db11a68a5c26c5af3`
