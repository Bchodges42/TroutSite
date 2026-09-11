# GEO-CONTINUITY-AUDIT — geometry lane results

Lane: GEOMETRY (hydrography, geometry provenance, generated map indexes) ·
Repo: `trout-geometry` (clone of `trout-fieldwork-20260904`) ·
Base: `5648ccc` ("docs: B15 resolved — all 42 reference waterbodies delivered and merged") ·
Date: 2026-09-04.

Subagent audits were unavailable in this session (model provider not
configured), so the lane lead ran all three audits (Stones, Sinking,
statewide) directly with read-only analysis scripts.

## Sources and provenance

| Source | Use | Access |
| --- | --- | --- |
| USGS NHDPlus HR, `https://hydro.nationalmap.gov/arcgis/rest/services/NHDPlus_HR/MapServer/3/query` (flowlines; `gnis_name`, `gnis_id`, `nhdplusid`, `reachcode`, `fcode`) | centerline geometry and reach identity | cached per-corridor fetches 2026-09-04 (`.atlas-src/nhd/`, same-day); 20 Stones-corridor `nhdplusid`s plus Sinking/Clear-Creek/Obed corroboration queries re-verified **live** 2026-09-04 |
| TWRA Boating and Fishing Interactive Map (the Tennessee waterways ArcGIS experience, item `f736acdf47ea44028420c5611291db5f`, owner `TWRA_GIS`) and its layer `TWRA_Trout_Stocking_Locations/FeatureServer/0` at `services3.arcgis.com` | first-party visual/contextual cross-check | 2026-09-04 |
| Census TIGER/Line 2024 (committed geometry provenance, unchanged) | pre-existing base lines | n/a (no new TIGER fetch) |

No rendered basemap tiles were scraped or traced. All coordinates are
EPSG:4326 `[longitude, latitude]`. All additions are real NHDPlus HR reaches
(whole-part, never clipped mid-reach); nothing was synthesized, and no
connector was drawn across a gap.

## Method

- **Chunk analysis** — a feature's parts are stitched when any endpoint pair
  lies within 1.0 km (haversine), matching
  `apps/web/scripts/audit-river-continuity.mjs`. Chunks separated by real
  gaps are what the map renders as broken water. Multipart is not
  automatically an error; only accidental gaps were treated as defects.
- **Contract validation** — every feature checked for: unique kebab-case ids,
  contract-legal `waterbodyType` (river/creek/stream/tailrace/lake/pond/
  reservoir), `approximate` boolean, `source` tokens, finite coordinates in
  Tennessee, `bounds` containing every coordinate, `labelAnchor` on/inside
  the feature, valid GeoJSON nesting depth (MultiLineString 3, MultiPolygon
  4), exact-duplicate parts (within and across features), intra-part jumps
  > 3 km, and `riverIndex.json` parity.
- **Line–lake adjacency** — every line endpoint within 1.5 km of an
  interactive lake polygon boundary was tabled and judged expected
  (tributary ending at its reservoir) vs suspect.

The permanent, test-enforced version of these checks now lives in
`apps/web/test/geometry-continuity.test.ts`; the audit is also reproducible
via `node apps/web/scripts/audit-river-continuity.mjs` (CI mode) and
`node scripts/fix-stones-sinking-continuity.mjs` (one-shot fix record,
applied to base `5648ccc`).

## 1. Stones River / J. Percy Priest system

**Anatomy of the gap.** The `stones-river` reach gate stopped the feature at
J. Percy Priest Dam (minLat 36.153), so no centerline continued from the dam
through the reservoir corridor to the East/West Fork meeting point. The
committed forks already ended exactly at the true confluence
(`-86.4587, 35.9859` — East and West Fork share that node to 4 decimals);
what was missing was everything north of it: NHDPlus HR models the main stem
through the pool as fcode-55800 artificial-path reaches named "Stones River"
(from the confluence at lat 35.986 up to the dam at lat ~36.155). 20 of
those corridor `nhdplusid`s were re-verified live against the service on
2026-09-04. The committed tailwater already touched the lake's north tip
(0.01 km).

**Fix.** `stones-river` was extended with 19 TIGER-unduplicated NHD corridor
reaches (confluence → pool → dam). The reach gate was widened (minLat
36.153 → 35.985) with provenance in `atlas-reach-gates.mjs` so a pipeline
re-run reproduces the same feature. Result: 9 parts → 28 parts, 1 stitched
chunk, corridor end 0.00 km from the fork confluence, 91 of 196 vertices
inside the `j-percy-priest-lake` polygon, north end at the dam. The Davidson
County tailwater semantics (USGS 03430200, TWRA winter program) are
preserved — this is one continuous named water, not a new reach.

The separately managed `east-fork-stones-river` / `west-fork-stones-river`
geometries were verified correct (both terminate at the confluence; no
coordinate changes). "Middle Fork Stones River" (42 NHD reaches in the
cache) is a real distinct water joining the West Fork upstream; it is not
modeled in the catalog and was never merged into either fork.

## 2. Sinking Creek (Wilson County)

**Finding — one id, three different waters.** The committed
`sinking-creek-wilson` fused three disconnected chunks that are three
distinct GNIS waters:

| Chunk | Parts | Extent | Identity |
| --- | --- | --- | --- |
| A | 11 | lon −86.312..−86.286, lat 36.125..36.221 | **"Sinking Creek" GNIS 01270380** — through west Lebanon; 10/11 parts coordinate-exact NHD reaches |
| B | 14 | lon −86.413..−86.342, lat 36.095..36.133 | **"Sinking Creek" GNIS 01303641** — a *different* rural creek SW of Lebanon (Round Lick drainage), 3–5 km from A |
| C | 1 | lon −86.541..−86.534, lat 36.033..36.047 | a third Sinking Creek in **Rutherford County**, ending at the J. Percy Priest west shore (0.02 km), 12.15 km from B |

The prior CONTINUITY lane's "12.15 km west hole (36.046→36.094) and 3.69 km
mid hole" were the distances *between these different waters*, not holes in
one creek.

**First-party cross-check.** TWRA's trout-stocking layer (queried
2026-09-04) pins the winter-program water: Site "Don Fox Community Park",
StreamName "Sinking Creek", County WILSON, City Lebanon, at
(36.21886, −86.30841) — inside chunk A's bounds, 0.1 km from its north
reach. Chunk A's creek flows north through west Lebanon and joins **Bartons
Creek** (GNIS 01304981, NHD live query at the terminus), thence to the
Cumberland.

**Fix.** Chunks B and C were **removed, not connected** (same
evidence-based approach as the Harpeth correction: real reaches only, and
unrelated fragments are dropped rather than bridged). Kept: chunk A
(GNIS 01270380), 11 parts, 1 stitched chunk, max component separation 0.
`waterbodyType` "spring" → "creek" (the geometry contract enum has no
"spring"; the UI reads type from the catalog, so nothing downstream
changes). `labelAnchor` recomputed onto the stocked reach near Don Fox Park.
Source token now `["nhd-hr"]` (the kept geometry is NHD GNIS 01270380).

Regression numbers (enforced by `test/geometry-continuity.test.ts`):
component count **1**, max component separation **0**, all vertices within
lon −86.315..−86.285.

## 3. Statewide catalog audit

`audit-river-continuity.mjs` (CI mode): **PASS, 0 unexpected multi-chunk
streams.** 13 line rivers remain allowlisted multi-chunk (deliberate catalog
design or documented public-source gaps — see `docs/CONTINUITY-AUDIT.md`,
owned by the prior lane; its regenerated table will show `clear-fork`
dropping from 3 to 2 chunks after this lane's dedupe below, and
`sinking-creek-wilson` leaving the list entirely). The stale
`sinking-creek-wilson` LEFT-OPEN allowlist entry was removed from the script.

### Duplicate segments (double-drawn identical geometry)

| Features | Shared parts | Resolution |
| --- | --- | --- |
| `duck-river-tailwater` ↔ `duck-river-lower` | 14 | reach-gate overlap on [−86.50, −86.42] at Shelbyville; removed from the lower, which stays 1 chunk and now ends at gauge 03598000 (−86.4992). Gate maxLon −86.42 → −86.47 |
| `elk-river` ↔ `elk-river-lower` | 2 | same class at Prospect (gauge 03584600, −86.9947); removed from the lower. Gate maxLon −86.99 → −86.9968 |
| `boone-tailwater` ↔ `ft-patrick-henry-tailwater` | 3 | overlap around Fort Patrick Henry Dam (lon −82.509, USGS 03487010); parts east of the dam kept by the Boone tailwater, pool straddlers kept by the FPH tailwater they start from |
| `clear-fork` ↔ `clear-creek-obed` | 2 (one 15 km) | the shared reach is NHD **"Clear Creek" GNIS 01305953** (live bbox query −84.92..−84.68/36.08..36.17 shows no "Clear Fork" water there); kept by `clear-creek-obed`, removed from `clear-fork` (3 chunks → 2, its own extent intact) |
| self-duplicates inside one MultiLineString | 19 parts across 10 features (`charles-creek`, `clear-creek-obed`, `clear-fork`, `duck-river-tailwater`, `elk-river`, `emory-river`, `obed-river`, `red-river-clarksville`, `rocky-river`, `wolf-river-fentress`) | pure dedup, no coordinate changed |

### Reversed or mismatched reach associations

- `sinking-creek-wilson` chunks B/C (above) — the case.
- `clear-fork` carrying Clear Creek reaches (above) — the case.
- County-qualified ids spot-checked (`horse-creek-greene`, `mill-creek-overton`,
  `indian-creek-claiborne`, `laurel-creek-johnson`, `new-river`,
  `piney-river-rhea`, `wolf-river-fentress`, `red-river-clarksville`):
  geometry plausibly in the named area. No further mismatches found.

### Lines ending immediately before a corresponding lake

27 line→lake pairs within 1.5 km were tabled. All are the expected
tributary-terminates-at-its-reservoir pattern (caney-fork→center-hill,
clinch→norris/watts-bar, emory→watts-bar, french-broad→douglas,
hiwassee→chickamauga, mossy→cherokee, nolichucky→douglas, north-chickamauga→
chickamauga, obey→dale-hollow, piney→watts-bar, powell→norris,
cumberland→barkley, tennessee→pickwick/kentucky, holston & french-broad at
the Knoxville confluence ~1.05 km from Fort Loudoun's tip, plus small
tributaries). The one suspect — `sinking-creek-wilson` ending 0.02 km from
Percy Priest — is resolved by the removal above. `stones-river` now touches
the lake at 0.00 km by design (corridor centerline).

### Geometry contract fixes (all features)

- **8 invalid MultiPolygon nestings**: `shelby-farms-lake`,
  `cameron-brown-lake`, `yale-road-park-lake`, `johnson-park-lake`,
  `valentine-park-pond`, `covington-fbc-pond`, `milan-city-pond`,
  `union-city-reelfoot-pond` were MultiPolygon-typed with Polygon-nested
  coordinates (depth 3). Rings wrapped — zero coordinate changes.
- **10 lake labelAnchors outside their polygons** (they were the reference
  inventory's approximate locations): `lake-graham` (on the boundary),
  `center-hill-lake` (0.26 km out), `chickamauga-lake` (1.95 km),
  `douglas-lake`, `fort-loudoun-lake`, `kentucky-lake`, `norris-lake`,
  `old-hickory-lake`, `south-holston-lake`, `tims-ford-lake`. Recomputed as
  max-clearance interior points of the largest member polygon (clearance
  0.17–0.98 km). `riverIndex.json` regenerated from the approved geometry —
  128 entries, exact parity with the GeoJSON, sorted.
- **Implausible jumps**: only `mississippi-river` (up to 4.7 km chords in
  the documented 2-part boundary band, KY-Bend notch) and `tennessee-river`
  (3.0–3.6 km chords in the B15-documented 3-welded-member main stem) exceed
  3 km; both are documented coarse welds, not corrupted joins, and are
  exempted explicitly in the test. Everything else ≤ 3 km.

### Reviewed and deliberately unchanged

- All 13 documented LEFT-OPEN gaps (clear-fork, hurricane-creek,
  indian-creek-claiborne, mill-creek-overton, piney-river-rhea,
  richardson-byrd-creek, sulfur-fork-creek, east-fork-shoal-creek,
  horse-creek-greene, buffalo-river, mississippi-river KY-Bend, cane-creek
  deliberate, tennessee-river Alabama detour) — re-verified as still
  un-fillable from public-domain sources; not fabricated.
- `lakes.geojson` (9 passive lakes): clean; no passive/interactive duplicate
  of any interactive feature.
- No fewer than 92 of the 100 line features are single-chunk; multipart
  features that are naturally branching remain MultiLineString by design.

## Per-feature change table (base `5648ccc` → this lane)

| id | parts/chunks before → after | other property changes |
| --- | --- | --- |
| `stones-river` | 9p/1ch → 28p/1ch | source `["tiger-linear","nhd-hr","nhd-corridor-55800","reach-gated"]`; bounds extend to the confluence |
| `sinking-creek-wilson` | 26p/3ch → 11p/1ch | type spring→creek; source → `["nhd-hr"]`; anchor moved onto the stocked reach |
| `duck-river-lower` | 135p/1ch → 121p/1ch | anchor recomputed; ends at gauge 03598000 |
| `elk-river-lower` | 7p/1ch → 5p/1ch | ends at the Prospect gauge |
| `boone-tailwater` | 22p/1ch → 20p/1ch | — |
| `ft-patrick-henry-tailwater` | 18p/1ch → 17p/1ch | — |
| `clear-fork` | 92p/3ch → 85p/2ch | foreign Clear Creek reaches + self-dups removed |
| `clear-creek-obed` | 15p/1ch → 10p/1ch | self-dups removed |
| `charles-creek` | 14p/1ch → 13p/1ch | self-dup removed |
| `duck-river-tailwater` | 126p/1ch → 125p/1ch | self-dup removed |
| `elk-river` | 372p/1ch → 369p/1ch | self-dups removed |
| `emory-river` | 78p/1ch → 77p/1ch | self-dup removed |
| `obed-river` | 132p/1ch → 131p/1ch | self-dup removed |
| `red-river-clarksville` | 6p/1ch → 5p/1ch | self-dup removed |
| `rocky-river` | 10p/1ch → 9p/1ch | self-dup removed |
| `wolf-river-fentress` | 6p/1ch → 5p/1ch | self-dup removed |
| `shelby-farms-lake`, `cameron-brown-lake`, `yale-road-park-lake`, `johnson-park-lake`, `valentine-park-pond`, `covington-fbc-pond`, `milan-city-pond`, `union-city-reelfoot-pond` | nesting depth 3 → 4 | no coordinate changes |
| `lake-graham`, `center-hill-lake`, `chickamauga-lake`, `douglas-lake`, `fort-loudoun-lake`, `kentucky-lake`, `norris-lake`, `old-hickory-lake`, `south-holston-lake`, `tims-ford-lake` | labelAnchor moved inside the polygon | no coordinate changes |

## UNRESOLVED (flagged, not fabricated)

- **`caney-fork-river` full reference extent** — inventory row still marks
  the reference corridor "fragmented"→extended by earlier lanes; its
  remaining extent question is an inventory/catalog matter (row stays
  PENDING_GEOMETRY in the implementation checklist).
- **Catalog `waterbodyType: spring`** on the `sinking-creek-wilson` YAML
  (`packages/content/streams/tn/sinking-creek-wilson.yaml`) still disagrees
  with the geometry contract enum — content-lane follow-up; the *feature*
  now carries `creek`.
- **`clear-fork` remaining 2-chunk gap** — still un-fillable from public
  sources (NHD carries only the middle band; see CONTINUITY-AUDIT allowlist).
- **`docs/CONTINUITY-AUDIT.md`** is owned by the prior lane and was not
  regenerated; its sinking-creek row and clear-fork chunk count are now
  stale relative to `audit-river-continuity.mjs` output (CI still passes).

## Reproduce

```bash
node apps/web/scripts/audit-river-continuity.mjs      # CI continuity check
node apps/web/scripts/validate-atlas.mjs              # structural validator
pnpm --filter @trout/web test                         # includes geometry-continuity.test.ts
node apps/web/scripts/regenerate-river-index.mjs      # rebuild riverIndex from approved geometry
```
