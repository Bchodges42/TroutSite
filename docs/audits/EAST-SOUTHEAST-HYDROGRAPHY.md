# EAST-SOUTHEAST-HYDROGRAPHY — East & Southeast Tennessee audit and repair

Lane: Session E-S (lead hydrographic data engineer, East/Southeast TN) · Base: `main` · Date: 2026-09-05

## Scope and method

Replacement geometry and catalog corrections for every mapped East/Southeast
Tennessee lake, reservoir, river, fork, inlet, outlet, confluence, and tailwater:
the Tennessee Valley main stem, the Holston/Watauga system, the Clinch system,
and the Hiwassee/Ocoee system. Deliverables are
`apps/web/atlas-sources/verified/east-southeast.geojson` (28 features),
`apps/web/atlas-sources/verified/east-southeast.topology.json` (28 connection
records, schema `trout/east-southeast-topology/1`, matching the west-middle
lane's format), catalog YAML records, East/SE-only fetch/build/validate scripts,
and `apps/web/test/east-southeast-atlas.test.ts`. The canonical combined sources
(`rivers.geojson`, `lakes.geojson`, `riverIndex.json`) were **not** edited.

Extraction discipline:

- **Watershed/authoritative-ID based, never county-clipped.** NHDPlus HR
  waterbodies are keyed by `GNIS_ID`/`Permanent_Identifier` and fetched
  whole-part per region window; delivered polygons keep cross-state and
  cross-county extents. Census TIGER/Line 2024 AREAWATER is used only where
  NHDPlus HR demonstrably lacks the pool (Norris), assembled by a documented
  pool-membership rule across the seven reservoir counties — not by
  name-only matching, which was the shipped defect.
- **Reach gates** follow `apps/web/scripts/atlas-reach-gates.mjs` conventions
  (whole-part windows; every bound cited to a USGS site or a pool edge).
- **No fabricated coordinates.** No connectors across unexplained gaps; the two
  documented dam-complex tolerances are listed under "Documented tolerances".

### Authoritative sources (all retrieved 2026-09-05)

| Source | Service / layer | Used for |
| --- | --- | --- |
| USGS NHDPlus HR | `hydro.nationalmap.gov/arcgis/rest/services/NHDPlus_HR/MapServer` — layers 3 (NetworkNHDFlowline), 4 (NonNetworkNHDFlowline), 8 (NHDArea), 9 (NHDWaterbody) | lake polygons, river centerlines, dam-pool connectors; fcode 46006/46003/55800, geometryPrecision 6 |
| USGS NHD (medium res) | `hydro.nationalmap.gov/arcgis/rest/services/nhd/MapServer` — layer 12 | independent geometry cross-check for Norris Lake (GNIS 01269832) |
| USGS WBD | `hydro.nationalmap.gov/arcgis/rest/services/wbd/MapServer` — layer 4 (HUC8) | watershed windows and HUC8 attribution (e.g. 06010201 "Watts Bar Lake") |
| USGS NWIS | `waterservices.usgs.gov/nwis/site/?format=rdb` (NAD83 `dec_lat_va`/`dec_long_va`) | dam anchors ("… AT/BELOW … DAM (TW)" gauges + TVA river-mile sites); 297 sites cached |
| TWRA | `services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/RiversReservoirs/FeatureServer` layers 0/1 — the layers behind the Tennessee waterways ArcGIS experience (`experience.arcgis.com/experience/f736acdf47ea44028420c5611291db5f`) | reservoir identity/extent second source; delivery geometry for Nickajack Lake |
| Census TIGER/Line 2024 | AREAWATER (H2030) shapefiles, 95 TN counties (cached in `.atlas-src/awshp/`); states 5m for the NC cut | Norris pool assembly; state-boundary verification |
| NID | `nid.sec.usgs.gov` — **unreachable from this environment** (DNS-blocked); dam coordinates therefore come from USGS NWIS dam gauges + pool-footprint edges, per priority source 3 | documented |

Raw caches and provenance (`fetched.json` with per-file URLs and retrieval
dates) live in git-ignored `apps/web/.atlas-src/east-southeast/`. Reproduce with
the commands at the end.

## Root causes found

1. **County/state clipping.** The shipped lake polygons (Census AREAWATER,
   promoted per-county) were split into 5–30 fragments at county seams and, for
   South Holston, at the state line (18.2 of 30.3 km² delivered). Norris held 30
   fragments; Chickamauga 15; Fort Loudoun 6; Douglas 6.
2. **Name-only pool matching.** Norris Lake exists in Census AREAWATER mostly as
   pieces named "Norris Lk" (69.4 km²) plus pool arms named "Clinch Riv"
   (3.8 km²) and "Powell Riv" (11.5 km²); the name-only match dropped every arm
   — the "Norris appears incomplete/fragmented" report.
3. **Truncated reaches.** clinch-river began ~2 km below Norris Dam (gate
   `maxLon -84.06` vs dam `-84.0821`); holston-river stopped short of both the
   Kingsport confluence and Fort Loudoun Lake; watts-bar-lake stopped ~9 km
   short of Fort Loudoun Dam; chickamauga-lake missed both dam ends and its
   upper arm (49.9 of ~123.5 km²).
4. **Unrepresented waters.** Boone, Watauga, Tellico, Parksville, and Nickajack
   Lakes existed only as passive polygons (or, for Nickajack, a 28-of-42 km²
   fragment); Wilbur Lake, Fort Patrick Henry Lake, Melton Hill Lake,
   Chilhowee Lake, Calderwood Lake, and Ocoee Number Three Lake had no feature
   at all; the North Fork Holston River and the Little Tennessee River main
   stem were absent from the catalog.
5. **Misidentification risk resolved.** The unidentified lake near the
   Parksville tailwater is **Ocoee Number Three Lake** (GNIS 01296232; TVA Ocoee
   Dam No. 3 impoundment). TWRA's reservoir layer lists it under the historical
   name **"Hiwassee Lake"** (443 ac, bb −84.47..−84.37 × 35.01..35.04) — it is
   *not* the Hiwassee Lake in North Carolina and *not* a second Parksville.

## Connection chains (verified, dam coordinates = USGS NWIS NAD83)

**Northeast system**

```
South Fork Holston River (VA; free-flowing reach lies wholly in Virginia)
→ South Holston Lake (NHD 01327073, 30.3 km², incl. VA portion)
→ South Holston Dam (03476500, 36.52356/−82.09726)
→ south-holston-river (SF Holston tailwater)
→ Boone Lake (NHD 01326910; SF arm) + Watauga arm:
   Watauga Lake (NHD 01273873) → Watauga Dam (03483950, 36.33011/−82.12596)
   → watauga-river-wilbur-reach → Wilbur Lake (NHD 01327381)
   → Wilbur Dam (03484000, 36.34411/−82.12956) → watauga-river (Wilbur tailwater)
→ Boone Dam (03486810, 36.44066/−82.43792)
→ boone-tailwater → Fort Patrick Henry Lake (NHD 01284672)
→ Fort Patrick Henry Dam (03487010, 36.49816/−82.50904)
→ ft-patrick-henry-tailwater + North Fork Holston River (north-fork-holston-river)
→ HOLSTON RIVER MAIN STEM begins at the Kingsport confluence
→ holston-river → Cherokee Lake (NHD 01280322, mid-stem pool)
→ Cherokee Dam (03493510, 36.16620/−83.49934) → Holston Cherokee tailwater
→ Fort Loudoun Lake (NHD 01307966)
```

The order of reservoirs, the fork combination, and which named reach begins at
each dam were verified against NHDPlus HR flowlines, the TWRA rivers layer
(`FENAME`: "North Fork Holston River", "South Fork Holston River", "South
Holston River", "Holston River", "Watauga River"), and the NWIS dam gauges. The
free-flowing South Fork Holston lies entirely in Virginia between the state line
and the South Holston pool, so the Tennessee product carries it through the
tailwater reach `south-holston-river` (TWRA's own naming); no separate
`south-fork-holston-river` feature is delivered.

**Tennessee main stem (East/Southeast)**

```
Holston River + French Broad River confluence (Knoxville)
→ Fort Loudoun Lake (Fort Loudoun Dam, 03499510, 35.79174/−84.24325, RM 602.3)
   ← Little Tennessee River (little-tennessee-river) via Tellico Lake/Tellico Dam canal
   ← Clinch arm: Watts Bar Lake → Melton Hill Lake (Melton Hill Dam, 03535912, RM 23.1)
                ← clinch-river (Norris tailwater) ← Norris Lake ← Powell River
→ Watts Bar Lake (Watts Bar Dam, 03543005, 35.62035/−84.78328, RM 529.9)
→ tennessee-river (Watts Bar tailwater) → Chickamauga Lake
   ← Hiwassee River (hiwassee-river, from NC below Apalachia Dam)
→ Chickamauga Dam (03566510, 35.10313/−85.22968) → Nickajack Lake
→ Nickajack Dam (03570525, 35.00258/−85.62108) → tennessee-river toward Guntersville (AL)
```

**Ocoee system**

```
Ocoee River (Copperhill reach; ocoee-river)
→ Ocoee Number Three Lake (NHD 01296232; Ocoee Dam No. 3 at the pool's west end)
→ Ocoee River → Parksville Lake (NHD 01304751 "Lake Ocoee"; Parksville Dam =
  Ocoee No. 1, at the pool's west edge by USGS 03564500)
→ parksville-tailwater (Ocoee No. 1 tailwater; TWRA "Ocoee River" water polygons
  flank this reach) → Hiwassee River → Chickamauga Lake
```

## Feature results

Common columns: previous state = geometry in `rivers.geojson`/`lakes.geojson` at
base; sources as listed above (retrieved 2026-09-05); catalog = YAML record.
Chain checks are the validator's nearest-endpoint tests (tolerances in
"Documented tolerances"). Confidence: **high** = two independent authoritative
sources agree on identity and extent; **medium-high** = single geometry source
with attribute cross-checks.

### Lakes and reservoirs (18)

| Feature | Previous state | Source (IDs) | Geometry action | Inlet / outlet verification | Dam | Source→delivered km² (parts) | Catalog | Confidence | Verdict |
|---|---|---|---|---|---|---|---|---|---|
| norris-lake | 30 county fragments, 79.4 km², never reached the dam; Powell/Clinch arm pieces dropped by name-only match | Census AREAWATER 2024 pool rule (Norris Lk + Clinch Riv + Powell Riv + Lost Crk + unnamed ≥0.05 km², window −84.35..−83.20 × 36.15..36.66; exclusions: Big Ridge/Fern/Cove/Corbin/Lea Lk); xchecks NHD-med GNIS 01269832 (95.5), TWRA (36,149 ac), TVA (33,840 ac) | Rebuilt by pool-membership rule, 45 m DP + crossing repair | Clinch + Powell arms end at flowline termini; tailwater meets Norris Dam | Norris Dam 36.21563/−84.08214 (03533000); pool reaches the dam; tailwater restarts at it | 85.5→85.8 (48) | updated (gaugeIds +03533000, verified notes) | high | **PASS** |
| cherokee-lake | 9 fragments, 99.5 km², dam gap | NHD HR GNIS 01280322; xchecks TWRA 27,029 ac, TVA 30,300 ac | Rebuilt, single unclipped pool | Holston arm to NHD pool head; holston-river line enters/exits | Cherokee Dam 36.16620/−83.49934 (03493510 + 03494000) | 119.1→122.8 (1) | updated | high | **PASS** |
| chickamauga-lake | 15 fragments, 49.9 km², missing both dam ends + upper arm | NHD HR GNIS 01312639 ("Dallas Lake" = GNIS name of the Chickamauga impoundment) + 01289869 (Judd Slough); xcheck TWRA 33,973 ac, TVA 35,400 ac | Rebuilt, 2 parts | Watts Bar tailwater enters at RM 529.9 end; Hiwassee arm to Judd Slough; dam end at −85.23 | Chickamauga Dam 35.10313/−85.22968 (03566510) | 123.5→123.9 (2) | updated | high | **PASS** |
| douglas-lake | 6 fragments, 64.6 km² | NHD HR GNIS 01282739; xchecks TWRA 28,738 ac, TVA 28,420 ac | Rebuilt, single pool | French Broad + Pigeon arms to pool heads; Douglas tailwater exits | Douglas Dam 35.96120/−83.53878 (03468510/03469000) | 118.3→121.7 (1) | updated | high | **PASS** |
| fort-loudoun-lake | 6 fragments, 12.5 km², dam + arms missing | NHD HR GNIS 01307966; xchecks TWRA 18,727 ac, TVA 14,600 ac | Rebuilt | Holston + French Broad + Little T (canal) inlets; discharges to Watts Bar | Fort Loudoun Dam 35.79174/−84.24325 (03499510; RM 602.3 site) | 55.7→56.9 (1) | updated (regionId tn-se-hiwassee→tn-east-clinch) | high | **PASS** |
| watts-bar-lake | 8 fragments, 120.3 km², 9 km short of Fort Loudoun Dam | NHD HR GNIS 01304421; xchecks TWRA 37,884 ac, TVA 39,090 ac | Rebuilt, single pool dam-to-dam incl. Clinch arm | FL Dam inlet; Melton Hill arm; Emory arm remains NHD river-area (documented) | Watts Bar Dam 35.62035/−84.78328 (03543005; RM 529.9 site) | 135.3→137.8 (1) | updated | high | **PASS** |
| south-holston-lake | 1 state-clipped part, 18.2 km² (VA portion dropped) | NHD HR GNIS 01327073; xchecks TWRA 6,019 ac (TN only), TVA 7,580 ac (full) | Rebuilt unclipped across the state line | SF Holston (VA) inlet; south-holston-river exits at the dam | South Holston Dam 36.52356/−82.09726 (03476500) | 30.3→31.3 (1) | updated | high | **PASS** |
| boone-lake | passive only (lakes.geojson); unselectable | NHD HR GNIS 01326910 (2 parts); xchecks TWRA 5,055 ac, TVA 4,400 ac | Promoted + rebuilt | SF arm receives south-holston-river; Watauga arm receives watauga-river; boone-tailwater exits | Boone Dam 36.44066/−82.43792 (03486810) | 17.1→17.5 (2) | **new** | high | **PASS** |
| watauga-lake | passive only | NHD HR GNIS 01273873; xcheck TWRA 6,350 ac (= TVA 6,430 ac) | Promoted + rebuilt; reaches the dam | Watauga River headwaters (NC) inlet; wilbur-reach exits at the dam | Watauga Dam 36.33011/−82.12596 (03483950/03483450) | 25.7→26.3 (1) | **new** | high | **PASS** |
| wilbur-lake | absent | NHD HR GNIS 01327381; xcheck TWRA 72 ac | New interactive feature | wilbur-reach inlet; watauga-river (tailwater) outlet at Wilbur Dam | Wilbur Dam 36.34411/−82.12956 (03484000 + tailrace gauges 03483970/80) | 0.23→0.22 (1) | **new** | high | **PASS** |
| fort-patrick-henry-lake | absent (visible unselectable) | NHD HR GNIS 01284672; xcheck TWRA 860 ac | New interactive feature | boone-tailwater inlet; ft-patrick-henry-tailwater outlet | Fort Patrick Henry Dam 36.49816/−82.50904 (03487010) | 3.44→3.48 (1) | **new** | high | **PASS** |
| tellico-lake | passive; stopped short of Tellico Dam | NHD HR GNIS 01327191 + 01304036; xchecks TWRA 15,788 ac, TVA 15,540 ac | Promoted + rebuilt | Little T + Tellico River + Citico inlets; canal/tailwater to Fort Loudoun Lake | Tellico Dam ≈35.7877/−84.2545 (pool extremum, NHD+TWRA agree; no NWIS dam gauge) | 61.4→62.1 (2) | **new** | high | **PASS** |
| melton-hill-lake | absent (visible unnamed pool) | NHD HR GNIS 01293571; xchecks TWRA 6,035 ac, TVA 5,470 ac | New interactive feature | clinch-river runs the pool (line-over-polygon by design); discharges to Watts Bar Clinch arm | Melton Hill Dam 35.88536/−84.30076 (03535912; Clinch RM 23.1) | 23.3→23.8 (1) | **new** | high | **PASS** |
| chilhowee-lake | absent (represented on waterways map) | NHD HR GNIS 01280464; xcheck TWRA "Chilhowee Reservoir" 1,738 ac | New interactive feature | Little T from Calderwood inlet; discharges to Tellico Lake | Chilhowee Dam ≈35.5623/−84.0252 (pool extremum) | 6.8→6.8 (1) | **new** | medium-high | **PASS** |
| calderwood-lake | absent | NHD HR GNIS 00982412; xcheck TWRA "Little Calderwood Reservoir" 458 ac (naming alias) | New interactive feature | Little T from Fontana (NC) inlet; discharges to Chilhowee Lake | Calderwood Dam ≈35.4987/−83.9418 (pool extremum) | 2.25→2.26 (1) | **new** | medium-high | **PASS** |
| parksville-lake | passive only | NHD HR GNIS 01304751 ("Lake Ocoee"); xcheck TWRA "Ocoee Lake" 2,112 ac | Promoted + rebuilt; aliases recorded | ocoee-river inlet at the east end; parksville-tailwater exits at the dam (west edge −84.655, by 03564500) | Parksville Dam (Ocoee No. 1) 35.0908/−84.6552 (03564500 + pool edge) | 7.48→7.56 (1) | **new** | high | **PASS** |
| ocoee-number-three-lake | absent — the "unidentified lake near the Parksville tailwater" | NHD HR GNIS 01296232; xcheck TWRA "Hiwassee Lake" 443 ac (alias) | New interactive feature | ocoee-river in/out at both ends (reach threads the pool) | Ocoee Dam No. 3 35.0371/−84.4699 (pool west extremum; TVA) | 2.2→2.23 (1) | **new** | high | **PASS** |
| nickajack-lake | passive sliver near the dam (28 km² fragment in NHD terms) | TWRA tn_reservoirs (10,470 ac — complete pool); xcheck NHD HR GNIS 01295741 (28.0 km², western gorge only), TVA 10,700 ac | Promoted + rebuilt from TWRA (the waterways-map source), 22 m DP | tennessee-river in at Chickamauga Dam, out at Nickajack Dam toward AL | Nickajack Dam 35.00258/−85.62108 (03570525 + 03570510) | 42.0→41.9 (20) | **new** | high | **PASS** |

### Rivers, forks, and tailwaters (10 delivered; existing verified reaches unchanged)

| Feature | Previous state | Source | Geometry action | Upstream / downstream terminals | Dam | Parts / islands / max gap | Catalog | Confidence | Verdict |
|---|---|---|---|---|---|---|---|---|---|
| tennessee-river | 3 sparse parts | NHD HR flowlines (east + west envelopes) | Rebuilt at precision 6 through all main-stem pools (artificial paths; no tailwater scoring inside pools) | AL line (RM 424, Shellmound) → Knoxville forks; Pickwick → KY line (state legitimately leaves TN between) | — (runs through 6 pools; dam anchors recorded) | 876 / 7 / 290 km (the state gap) | updated notes | high | **PASS** |
| holston-river | 1 part, stopped short of both ends | NHD HR GNIS "Holston River" | Rebuilt | Kingsport confluence → Fort Loudoun Lake (through Cherokee Lake by artificial path) | — (Cherokee Dam mid-stem: 03493510) | 336 / 1 / 0 m | updated notes | high | **PASS** |
| north-fork-holston-river | absent | NHD HR GNIS "North Fork Holston River", state-line cut (Census 2024 states) | New (TN reach; fork forms the state line) | VA line → Kingsport confluence (meets holston-river ≤0.7 km) | — | 24 / 4 / 1.0 km | **new** (warmwater) | high | **PASS** |
| clinch-river | began ~2 km below Norris Dam | NHD HR GNIS "Clinch River" + dam-pool connectors (layer 4, ≤1.5 km of the dam) | Rebuilt | Norris Dam → Clinch mouth at Kingston (Watts Bar Clinch arm) | Norris Dam 36.21563/−84.08214 (03533000) | 181 / 4 / 1.2 km | existing (geometry replaced) | high | **PASS** |
| south-holston-river | verified 2026-09-04; endpoints re-verified | NHD HR GNIS "South Fork Holston River" (lower take) | Rebuilt precision 6 | South Holston Dam → Boone Lake SF arm | South Holston Dam 03476500 | 59 / 7 / 1.8 km | existing (gauge kept) | high | **PASS** |
| boone-tailwater | verified 2026-09-04; slackwater strands now evidenced | NHD HR GNIS "South Fork Holston River" + dam connectors | Rebuilt precision 6 | Boone Dam → Fort Patrick Henry Lake | Boone Dam 03486810 | 23 / 8 / 4.8 km (strands inside FPH pool) | existing | high | **PASS** |
| ft-patrick-henry-tailwater | verified 2026-09-04 | NHD HR GNIS "South Fork Holston River" | Rebuilt precision 6 | Fort Patrick Henry Dam → Kingsport confluence (meets holston-river) | Fort Patrick Henry Dam 03487010 | 18 / 1 / 0 m | existing | high | **PASS** |
| watauga-river | verified 2026-09-04; shared dam-cluster parts de-duplicated | NHD HR GNIS "Watauga River" | Rebuilt precision 6 | Wilbur Dam (weir complex ≤0.7 km) → Boone Lake Watauga arm | Wilbur Dam 03484000 | 101 / 7 / 6.9 km (strands inside Boone pool) | existing | high | **PASS** |
| watauga-river-wilbur-reach | absent (gap between Watauga Lake and Wilbur Lake) | NHD HR GNIS "Watauga River" between the dams | New reach closing the chain | Watauga Dam → Wilbur Lake | Watauga Dam 03483950 | 5 / 1 / 0 m | **new** | high | **PASS** |
| little-tennessee-river | absent (main stem missing entirely) | NHD HR GNIS "Little Tennessee River"; NC cut at the state line (Census 2024 states) | New | TN line below Fontana → Fort Loudoun Lake via Calderwood/Chilhowee/Tellico pools (lakes carry pool continuity) | — (Tellico Dam at the downstream pool) | 187 / 3 / 18.7 km (pool crossings) | **new** | high | **PASS** |

### Existing reaches verified against the new pools (unchanged, PASS)

french-broad-river (Douglas inlet + tailwater terminus at the Holston confluence
confirmed), pigeon-river (Douglas inlet), little-pigeon-river, nolichucky-river,
doe-river (Watauga confluence), tellico-river (distinct from Tellico Lake; mouth
in the pool confirmed), citico-creek (Tellico pool), hiwassee-river (NC border
start below Apalachia Dam; mouth in the Chickamauga Hiwassee arm),
ocoee-river (threads Ocoee No. 3 pool; ends at the Parksville pool head),
parksville-tailwater (starts at Parksville Dam; meets the Hiwassee),
little-sequatchie-river, north-chickamauga-creek (Chickamauga pool),
sequatchie-river (Nickajack pool at South Pittsburg), emory-river (Watts Bar
arm), powell-river (ends inside the Norris Powell arm), little-river,
west/middle-prong-little-pigeon. These remain the canonical features from the
2026-09-04 GEO lane; this lane re-verified their terminals against the rebuilt
pool geometry (visual QA pages `ctx-*.png`).

## Documented tolerances (not hidden gaps)

1. **Wilbur Dam complex (watauga-river, 0.7 km; wilbur-reach → Watauga Lake, 1.0 km):**
   NHD splits the tailrace–weir–pool complex below Watauga and Wilbur dams into
   connector strands; delivered lines + lake fragments span the complex
   (`qa/watauga-dams-local.png` shows visual continuity). Dam-cluster parts are
   assigned to the more specific reach (`excludeSharedWith`), never duplicated.
2. **Tellico Dam canal (little-tennessee-river → Fort Loudoun Lake, 1.1 km):**
   NHD's named flowline stops at the dam; the Tellico canal / Fort Loudoun pool
   edge is carried by the two lake polygons (`qa/knoxville-system.png`).
3. **Slackwater strand islands:** boone-tailwater (4.8 km), watauga-river
   (7.9 km), little-tennessee-river (18.7 km across three pools) report
   line-island hops where NHD models upper impoundment arms as lake polygons
   rather than river lines — the pool polygons carry the continuity by design,
   and the reaches declare `throughLakeIds` for their verified pool crossings
   (tennessee-river: Nickajack/Chickamauga/Watts Bar/Fort Loudoun/Pickwick/
   Kentucky; holston-river: Cherokee; clinch-river: Melton Hill + Watts Bar;
   boone-tailwater and ft-patrick-henry-tailwater: Fort Patrick Henry;
   little-tennessee-river: Calderwood/Chilhowee/Tellico/Watts Bar).
4. **Watts Bar Emory arm:** NHD models the Emory River embayment as river area,
   not lake polygon; the arm is continuous in the delivered main-stem line.
5. **South Holston tailwater and Watauga tailwater are trimmed at the Boone
   Lake pool edge** (`trimInsideLakeIds`): NHD carries the upper slackwater
   strands as lake; the delivered lines end at the pool boundary instead of
   duplicating water the polygon already renders.

## UNRESOLVED / considered and not delivered

- **Appalachia Lake (GNIS 01008755):** present in NHD (4.3 km² at the TN/NC
  line) but **not represented by TWRA's reservoir layer** (the waterways map),
  the catalog, or either map source — per "where represented", no feature is
  delivered. The hiwassee-river reach begins at the TN line below Apalachia
  Dam. If the product later wants it, the GNIS ID and TVA dam are documented.
- **Whiteoak Lake (GNIS 01274439, 9.2 km², Oak Ridge/DOE):** named NHD
  waterbody, absent from TWRA/catalog/map. Left passive; not a trout fishery.
- **French Broad NC-side braid cluster** (Hot Springs area): the pre-existing
  feature carries TIGER braid fragments inside North Carolina; TN-side geometry
  is the product scope and verifies clean.
- **Hiwassee Lake (NC)** and **Blue Ridge Lake (GA)**: out-of-state waters;
  excluded. TWRA's "Hiwassee Lake" label is an alias of Ocoee Number Three Lake
  (see above) — search terms should map there.
- **woods-reservoir / great-falls-lake / normandy-lake / reelfoot-lake YAMLs:**
  untracked working-tree files from another lane currently failing the content
  schema (`waterbodyType: reservoir`, array `species`). Not this lane's files;
  not modified. My catalog subset validates clean (`pnpm --filter @trout/content
  validate` reports only those four).
- **Norris upper-arm extent:** delivered 85.8 km² vs TVA full-pool 137 km²;
  NHD-med (95.5) and Census (85.5) agree with the delivery, and the TWRA pool
  outline (146 km²) over-extends along the Clinch channel into Virginia (its
  polygon traces free-flowing water, verified and excluded). Residual
  uncertainty is pool-stage, not geometry error.

## Validation

`node apps/web/scripts/validate-east-southeast.mjs` — **PASS**: 28 features
(18 lakes, 10 reaches), 0 errors, 3 documented warnings. Checks: duplicate ids,
required properties, ring closure, self-crossing (crossing-repair verified),
swapped/degenerate coordinates, bounds vs geometry, label anchors (in-polygon /
on-line), duplicate overlapping reaches (shared dam-cluster parts de-duplicated
by signature), catalog/geometry parity (all 28 ids have YAML rows), priority
lakes present, passive named lakes promoted, South Holston VA retention,
16 chain endpoint checks, topology record completeness.

`pnpm --filter @trout/web test -- --run test/east-southeast-atlas.test.ts` —
**9/9 PASS** (structure, priority lakes, no point placeholders, ring validity,
VA retention, both chains, two-source verification).

Visual QA: `node apps/web/scripts/render-east-southeast-qa.mjs` renders the
delivered features over Census 2024 state/county context at statewide,
regional, and dam-local zooms into `.atlas-src/east-southeast/qa/*.png`
(13 pages, all inspected; context pages overlay the existing canonical reaches
to verify joins).

### Integration dry-run (cross-lane)

`node apps/web/scripts/integrate-verified-atlas.mjs --dry-run` (the shared
merge gate) reports **zero contract violations originating in
east-southeast.geojson geometry**, and the remaining flagged lines involving
east/Southeast ids are cross-lane items, not geometry defects:

1. `tennessee-river: duplicate staged id across staging files` — the
   west-middle staging also delivers the shared main-stem id (inventory rule:
   one id for the whole river). **Recommendation: keep the east-southeast
   feature** — it covers both Tennessee reaches (AL line → Knoxville and
   Pickwick → KY line) at NHD precision 6 with state-line cuts, a superset of
   the west-only take (whose staging also carries a bounds-rounding error at
   lat 35.6066 and three strand endpoints south of the Pickwick state line at
   ≈34.95, both on the west-middle copy).
2. `staged geometry has no matching catalog record` for the 14 newly registered
   waters — the integration gate reads the built content pack
   (`packages/content/dist/pack/streams.json`), which cannot rebuild until the
   four untracked YAMLs from another lane (`woods-reservoir`, `great-falls-lake`,
   `normandy-lake`, `reelfoot-lake` — invalid `waterbodyType: reservoir` /
   array `species`) are repaired. All 28 east-southeast ids have valid catalog
   YAML rows (verified directly against `packages/content/streams/tn/*.yaml`),
   so these clear on the next content-pack build.
3. Provenance warnings (`no permanentId`): NHDPlus HR's service returns numeric
   Permanent_Identifiers in this region, not the UUID-form ids the gate
   requires, so no `permanentId` property is shipped; full provenance
   (GNIS id, Permanent_Identifier, NHDPlusID, reachcode, fcode) is carried in
   each feature's `sourceIds` and in the topology records.

## Reproduce

```bash
node apps/web/scripts/fetch-east-southeast-hydro.mjs all      # authoritative caches (idempotent)
node apps/web/scripts/build-east-southeast-atlas.mjs          # -> atlas-sources/verified/*.json
node apps/web/scripts/validate-east-southeast.mjs             # must PASS
node apps/web/scripts/render-east-southeast-qa.mjs            # visual QA renders
pnpm --filter @trout/web test -- --run test/east-southeast-atlas.test.ts
```

## Merge notes (for the integrating session)

- Replace the 28 ids in `apps/web/public/atlas/rivers.geojson` with the delivered
  features (same `promoteId: "id"` contract); remove `boone-lake`, `watauga-lake`,
  `tellico-lake`, `parksville-lake`, `nickajack-lake` from passive
  `lakes.geojson` once promoted.
- Regenerate `riverIndex.json` from the merged interactive source.
- `waterbodyType` uses `lake`/`river`/`tailrace` per the catalog enum (the
  geometry contract's `reservoir` value is not in the Stream schema enum; TVA
  pools are cataloged as `lake`, matching the shipped reference lakes).
- Rebuild the content pack and snapshots after merging all lanes (four untracked
  YAMLs from another lane currently fail the schema).
