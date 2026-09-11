# FANOUT-REPORT — SESSION GEOFANOUT-1 (2026-09-11)

Mission: convert **every HU8 unit intersecting Tennessee** to the frozen intermediate
format of [`docs/NHD-CONVENTIONS.md`](docs/NHD-CONVENTIONS.md) (§4 files, §5 graph) and
build the per-unit trace graphs, plus `data/nhd/hu8/index.json` and the cross-unit water
list for the integration lane.

- **Lane:** `geoconv/nhd-fanout` · clone `/Users/ben/Downloads/TroutSite-nhdfanout1`
- **Base commit:** `1300194` (same as GEOCONV-0); conventions doc + engine branch
  `geoconv/nhd-engine` merged as first act (merge commit `4596764`)
- **Scope held:** `data/nhd/**`, `FANOUT-REPORT.md`, `PROGRESS.md` only. No engine or app
  changes; §6 (anchors/tracing/validate) intentionally NOT run — that is per-water work for
  the consuming lanes; no cross-unit merging attempted.
- **Push status:** no origin remote exists on this host (TroutSite-main is a snapshot without
  `.git`; `git remote get-url origin` fails in every clone) — **owner push required** (§7).

## Result in one line

**58 of 59 TN-intersecting HU8 units converted, graph-built, and independently re-validated
(ok)**; the 59th (08010206 Forked Deer) is blocked by a **defective upstream USGS product**
(§6 below). Statewide intermediates: **196,108 named flowlines**, **18,548 distinct GNIS
waters**, 694.6 MB across all artifacts. One engine defect found (zero-named-waterbodies
crash path) — **proposed to GEOCONV-0's owner, not patched** (§7).

## 1. Unit enumeration (authoritative, deterministic)

USGS Watershed Boundary Dataset HU2 geodatabases **05, 06, 08** (the only 2-digit regions
Tennessee touches), layer `WBDHU8`, filter `states LIKE '%TN%'` (USGS-maintained per-unit
state list) → **59 units**. Method is re-derivable in minutes; the WBD GDBs themselves are
not committed. Full unit list with names is in `data/nhd/hu8/index.json` (`wbdName` per
code). Sanity anchors: 06010207 Lower Clinch present; all four TN basin groups covered
(Cumberland 0513, Tennessee 0601–0604, West Tennessee 0801, plus border units 05050001
Upper New and 08030204 Coldwater).

Note: the conventions doc's §2 pointer ("Tennessee-basin HU8 codes enumerate as 0601xxxx")
covers only the Upper-Tennessee subregion; the STATE of Tennessee spans 05/06/08, so the
prefix-scan alone would have missed 43 of the 59 units. Recorded here as an integration note,
not a doc defect.

## 2. Execution method

Three waves × 4 concurrent subagents (12 workers, one small group of units each), each given
`docs/NHD-CONVENTIONS.md` verbatim plus the mandated template, the exact per-unit transcript
(conventions §10: deterministic S3 URL → `scripts/nhd_convert_gdb.sh` →
`node scripts/nhd_build_graph.mjs`), validation checks, and hard guardrails (write only
`data/nhd/**`, no git, no engine changes, escalate failures). One worker was lost to an API
rate limit after doing (but not reporting) its 5 units — the main session re-validated every
one of those units from disk before accepting them. After all waves, the **main session ran
an independent full-tree validation pass over every committed unit** (schema, single-part
geometry, gnis/ftype/bbox/precision, meta-vs-actual counts, graph edge endpoint integrity,
edges == flowlines, zero-length edges, duplicate node coords, dam-bridge distances): **zero
problems in all 58 ok units**.

## 3. Per-unit results

`flowlines` = named flowline features; `waters` = distinct GNIS ids; `nodes/edges` = graph;
`cmp` = components; `bridges` = dam bridges (max dist); `MB` = total artifact size;
`j/v/g MB` = jsonl / vaa / graph sizes. Every ok unit: single-part geometry only,
gnis_name non-empty, ftype ∈ {460, 558}, coords in-bounds ≤ 6 dp, meta counts match,
all edge endpoints resolve, 0 zero-length edges, 0 duplicate node coords, all bridges ≤ 100 m.

| HU8      | WBD name                                | flowlines | waters | nodes/edges     | cmp | bridges      | MB   | j/v/g MB       | status                                  |
| -------- | --------------------------------------- | --------- | ------ | --------------- | --- | ------------ | ---- | -------------- | --------------------------------------- |
| 05050001 | Upper New                               | 6,166     | 553    | 6,053 / 6,166   | 8   | 9 (76.3 m)   | 23.4 | 7.0/7.6/8.7    | ok                                      |
| 05110002 | Barren                                  | 2,790     | 225    | 2,732 / 2,790   | 15  | 5 (59 m)     | 16.4 | 6.0/3.6/6.7    | ok                                      |
| 05130101 | Upper Cumberland                        | 6,566     | 1,191  | 6,406 / 6,566   | 19  | 19 (99.5 m)  | 19.9 | 6.7/5.1/8.2    | ok                                      |
| 05130103 | Upper Cumberland-Lake Cumberland        | 3,303     | 438    | 3,245 / 3,303   | 20  | 25 (88.9 m)  | 10.5 | 3.5/2.8/4.2    | ok                                      |
| 05130104 | South Fork Cumberland                   | 3,675     | 579    | 3,598 / 3,675   | 25  | 4 (78.3 m)   | 13.9 | 4.9/3.0/6.0    | ok                                      |
| 05130105 | Obey                                    | 1,574     | 215    | 1,515 / 1,574   | 12  | 16 (94.7 m)  | 5.6  | 2.0/1.3/2.4    | ok                                      |
| 05130106 | Upper Cumberland-Cordell Hull Reservoir | 1,561     | 159    | 1,497 / 1,561   | 4   | 33 (99.2 m)  | 6.2  | 2.2/1.9/2.1    | ok                                      |
| 05130107 | Collins                                 | 1,222     | 128    | 1,222 / 1,222   | 11  | 3 (95.3 m)   | 3.6  | 1.0/1.2/1.4    | ok                                      |
| 05130108 | Caney                                   | 2,853     | 343    | 2,792 / 2,853   | 16  | 12 (95.5 m)  | 11.4 | 4.2/3.0/4.1    | ok                                      |
| 05130201 | Lower Cumberland-Old Hickory Lake       | 1,342     | 168    | 1,329 / 1,342   | 16  | 0 (0 m)      | 5.1  | 1.8/1.5/1.8    | ok                                      |
| 05130202 | Lower Cumberland-Sycamore               | 1,031     | 112    | 1,004 / 1,031   | 5   | 9 (94.4 m)   | 3.1  | 0.8/1.1/1.1    | ok                                      |
| 05130203 | Stones                                  | 1,103     | 98     | 1,097 / 1,103   | 9   | 5 (75.1 m)   | 3.5  | 0.9/1.3/1.3    | ok                                      |
| 05130204 | Harpeth                                 | 2,057     | 237    | 1,989 / 2,057   | 10  | 7 (89.5 m)   | 7.2  | 2.1/2.4/2.7    | ok                                      |
| 05130205 | Lower Cumberland                        | 4,311     | 372    | 4,226 / 4,311   | 22  | 55 (99.5 m)  | 14.5 | 4.1/5.1/5.3    | ok                                      |
| 05130206 | Red                                     | 1,258     | 91     | 1,225 / 1,258   | 12  | 3 (53.4 m)   | 5.8  | 1.8/1.8/2.2    | ok                                      |
| 06010101 | North Fork Holston                      | 2,348     | 184    | 2,308 / 2,348   | 11  | 3 (72.4 m)   | 8.2  | 2.0/3.4/2.7    | ok                                      |
| 06010102 | South Fork Holston                      | 3,178     | 363    | 3,128 / 3,178   | 30  | 28 (97.3 m)  | 11.9 | 3.6/3.8/4.5    | ok                                      |
| 06010103 | Watauga, North Carolina, Tennessee      | 3,498     | 438    | 3,467 / 3,498   | 17  | 18 (99.5 m)  | 11.3 | 3.2/3.7/4.3    | ok                                      |
| 06010104 | Holston                                 | 2,577     | 189    | 2,486 / 2,577   | 6   | 49 (98.2 m)  | 9.2  | 2.8/3.9/2.6    | ok                                      |
| 06010105 | Upper French Broad                      | 24,601    | 970    | 23,831 / 24,601 | 157 | 147 (99.1 m) | 94.5 | 22.3/48.8/23.4 | ok                                      |
| 06010106 | Pigeon                                  | 3,854     | 392    | 3,704 / 3,854   | 6   | 13 (98.2 m)  | 12.9 | 4.0/5.2/3.8    | ok                                      |
| 06010107 | Lower French Broad                      | 3,403     | 331    | 3,308 / 3,403   | 13  | 26 (94 m)    | 13.3 | 3.9/4.7/4.6    | ok                                      |
| 06010108 | Nolichucky                              | 7,327     | 724    | 7,153 / 7,327   | 12  | 12 (90.2 m)  | 23.2 | 6.9/9.9/6.4    | ok                                      |
| 06010201 | Watts Bar Lake                          | 4,281     | 468    | 4,134 / 4,281   | 12  | 50 (99 m)    | 15.1 | 5.1/5.2/4.9    | ok                                      |
| 06010202 | Upper Little Tennessee                  | 2,890     | 627    | 2,806 / 2,890   | 11  | 42 (99.8 m)  | 15.3 | 6.2/2.1/7.0    | ok                                      |
| 06010203 | Tuckasegee                              | 3,431     | 455    | 3,361 / 3,431   | 8   | 13 (98 m)    | 16.9 | 6.3/3.7/6.8    | ok                                      |
| 06010204 | Lower Little Tennessee                  | 4,102     | 564    | 3,960 / 4,102   | 9   | 52 (99 m)    | 18.1 | 6.5/4.1/7.5    | ok                                      |
| 06010205 | Upper Clinch, Tennessee, Virginia       | 4,706     | 488    | 4,622 / 4,706   | 15  | 19 (90.9 m)  | 16.1 | 4.6/5.6/5.9    | ok                                      |
| 06010206 | Powell                                  | 1,908     | 200    | 1,884 / 1,908   | 11  | 2 (51.2 m)   | 6.6  | 1.9/2.3/2.4    | ok                                      |
| 06010207 | Lower Clinch (reference)                | 1,840     | 147    | 1,782 / 1,840   | 8   | 28 (96.9 m)  | 6.6  | 2.2/2.4/2.0    | ok (from GEOCONV-0)                     |
| 06010208 | Emory                                   | 2,962     | 366    | 2,907 / 2,962   | 4   | 10 (83.1 m)  | 7.8  | 2.5/3.0/2.3    | ok                                      |
| 06020001 | Middle Tennessee-Chickamauga            | 4,135     | 419    | 4,057 / 4,135   | 18  | 30 (93.2 m)  | 14.1 | 4.0/6.4/3.8    | ok                                      |
| 06020002 | Hiwassee                                | 6,605     | 997    | 6,449 / 6,605   | 26  | 50 (96.9 m)  | 18.9 | 6.5/6.3/6.1    | ok                                      |
| 06020003 | Ocoee                                   | 1,674     | 299    | 1,656 / 1,674   | 9   | 12 (67.9 m)  | 5.3  | 2.0/1.4/1.9    | ok                                      |
| 06020004 | Sequatchie                              | 1,189     | 164    | 1,156 / 1,189   | 4   | 2 (98.6 m)   | 3.5  | 1.0/1.2/1.3    | ok                                      |
| 06030001 | Guntersville Lake                       | 3,838     | 362    | 3,787 / 3,838   | 36  | 19 (98.9 m)  | 12.6 | 3.9/4.9/3.7    | ok                                      |
| 06030002 | Wheeler Lake                            | 5,185     | 435    | 5,103 / 5,185   | 27  | 26 (95.9 m)  | 18.4 | 5.0/6.8/6.5    | ok                                      |
| 06030003 | Upper Elk                               | 2,508     | 241    | 2,473 / 2,508   | 26  | 8 (74.2 m)   | 9.4  | 3.2/3.1/3.1    | ok                                      |
| 06030004 | Lower Elk                               | 2,602     | 230    | 2,573 / 2,602   | 9   | 10 (98.5 m)  | 8.4  | 2.7/3.0/2.6    | ok                                      |
| 06030005 | Pickwick Lake                           | 6,145     | 469    | 6,028 / 6,145   | 49  | 39 (93.7 m)  | 20.9 | 5.5/8.4/7.0    | ok                                      |
| 06040001 | Lower Tennessee-Beech                   | 5,312     | 641    | 5,236 / 5,312   | 90  | 46 (99.3 m)  | 15.5 | 5.0/5.9/4.6    | ok                                      |
| 06040002 | Upper Duck                              | 2,478     | 235    | 2,421 / 2,478   | 8   | 12 (88.6 m)  | 9.9  | 3.6/2.8/3.5    | ok                                      |
| 06040003 | Lower Duck                              | 4,841     | 421    | 4,771 / 4,841   | 25  | 16 (94.1 m)  | 16.1 | 5.3/5.8/5.0    | ok                                      |
| 06040004 | Buffalo                                 | 2,479     | 201    | 2,415 / 2,479   | 7   | 17 (93.5 m)  | 7.7  | 2.6/2.7/2.5    | ok                                      |
| 06040005 | Kentucky Lake                           | 4,649     | 411    | 4,629 / 4,649   | 60  | 2 (32.5 m)   | 13.2 | 3.4/5.1/4.6    | ok                                      |
| 06040006 | Lower Tennessee                         | 2,056     | 147    | 2,046 / 2,056   | 28  | 2 (46.8 m)   | 5.8  | 1.5/2.4/1.9    | ok                                      |
| 08010100 | Lower Mississippi-Memphis               | 686       | 57     | 711 / 686       | 33  | 4 (91.8 m)   | 2.5  | 0.6/1.3/0.6    | ok                                      |
| 08010201 | Bayou De Chien-Mayfield                 | 2,308     | 88     | 2,279 / 2,308   | 19  | 3 (34.4 m)   | 7.4  | 1.4/4.2/1.8    | ok                                      |
| 08010202 | Obion                                   | 1,132     | 89     | 1,155 / 1,132   | 44  | 1 (25.6 m)   | 4.8  | 0.8/3.0/1.1    | ok                                      |
| 08010203 | South Fork Obion                        | 1,727     | 132    | 1,696 / 1,727   | 36  | 7 (72.5 m)   | 5.8  | 1.4/3.0/1.3    | ok                                      |
| 08010204 | North Fork Forked Deer                  | 1,283     | 79     | 1,269 / 1,283   | 12  | 0 (0 m)      | 4.1  | 0.9/2.3/0.9    | ok                                      |
| 08010205 | South Fork Forked Deer                  | 1,389     | 85     | 1,360 / 1,389   | 16  | 0 (0 m)      | 4.8  | 1.1/2.6/1.1    | ok                                      |
| 08010206 | Forked Deer                             | —         | —      | —               | —   | —            | —    | —              | **FAIL (defective source product; §6)** |
| 08010207 | Upper Hatchie                           | 4,701     | 219    | 4,632 / 4,701   | 60  | 7 (68.7 m)   | 18.2 | 4.2/10.1/3.9   | ok                                      |
| 08010208 | Lower Hatchie                           | 2,425     | 120    | 2,409 / 2,425   | 31  | 12 (93.5 m)  | 9.3  | 2.3/4.8/2.1    | ok                                      |
| 08010209 | Loosahatchie                            | 724       | 47     | 723 / 724       | 21  | 2 (43.5 m)   | 3.7  | 0.7/2.4/0.6    | ok                                      |
| 08010210 | Wolf                                    | 1,690     | 57     | 1,666 / 1,690   | 29  | 5 (90.8 m)   | 7.9  | 1.6/4.7/1.5    | ok                                      |
| 08010211 | Horn Lake-Nonconnah                     | 499       | 25     | 505 / 499       | 20  | 0 (0 m)      | 2.9  | 0.4/2.2/0.4    | ok                                      |
| 08030204 | Coldwater                               | 4,130     | 122    | 4,162 / 4,130   | 109 | 5 (48.2 m)   | 6.2  | 3.2/0.0/3.0    | ok                                      |

## 4. Cross-unit waters (for the integration lane — do NOT merge in this lane)

Identity criterion: **shared `gnis_id` across ≥ 2 HU8 units** (GNIS ids are nationally
unique; names are not). **41 waters** qualify. Per conventions §9 these are expected to end
at boundary nodes per-unit; stitching is a separate, explicitly approved step.

| water (gnis_id)                              | HU8 units                                                                      |
| -------------------------------------------- | ------------------------------------------------------------------------------ |
| Tennessee River (00517033)                   | 06010201, 06020001, 06030001, 06030002, 06030005, 06040001, 06040005, 06040006 |
| Cumberland River (00517018)                  | 05130101, 05130103, 05130106, 05130201, 05130202, 05130205                     |
| Clinch River (01307258)                      | 06010201, 06010205, 06010206, 06010207                                         |
| Duck River (01269541)                        | 06040002, 06040003, 06040005                                                   |
| Elk River (00117929)                         | 06030002, 06030003, 06030004                                                   |
| French Broad River (01306463)                | 06010105, 06010107, 06010201                                                   |
| Hatchie River (01306552)                     | 08010100, 08010207, 08010208                                                   |
| Little Tennessee River (01013036)            | 06010201, 06010202, 06010204                                                   |
| Obion River (01296225)                       | 08010100, 08010202, 08010203                                                   |
| Barkley Canal (00486353)                     | 05130205, 06040005                                                             |
| Bayou de Chien (00486489)                    | 08010100, 08010201                                                             |
| Big South Fork Cumberland River (00515542)   | 05130103, 05130104                                                             |
| Buffalo River (01305509)                     | 06040003, 06040004                                                             |
| Cane Creek (00488769)                        | 05110002, 06010204                                                             |
| Caney Fork (01326386)                        | 05130108, 05130201                                                             |
| Collins River (01281015)                     | 05130107, 05130108                                                             |
| Cypress Creek (01281919)                     | 08010100, 08010211                                                             |
| Emory River (01283771)                       | 06010207, 06010208                                                             |
| Harpeth River (01303466)                     | 05130202, 05130204                                                             |
| Hiwassee River (01328447)                    | 06020001, 06020002                                                             |
| Holston River (01303469)                     | 06010104, 06010201                                                             |
| Horn Lake Pass (00690301)                    | 08010100, 08010211                                                             |
| Loosahatchie River Drainage Canal (01269280) | 08010100, 08010209                                                             |
| Mayfield Creek (00497717)                    | 08010100, 08010201                                                             |
| Nolichucky River (01326897)                  | 06010107, 06010108                                                             |
| Nonconnah Creek (01306837)                   | 08010100, 08010211                                                             |
| North Fork Holston River (01487063)          | 06010101, 06010104                                                             |
| Obey River (01306853)                        | 05130105, 05130106                                                             |
| Obion Creek (00499767)                       | 08010100, 08010201                                                             |
| Ocoee River (01326965)                       | 06020002, 06020003                                                             |
| Pigeon River (01014389)                      | 06010106, 06010107                                                             |
| Powell River (01306921)                      | 06010205, 06010206                                                             |
| Red River (00501672)                         | 05130205, 05130206                                                             |
| Rock Chute (01314042)                        | 08010100, 08010211                                                             |
| Sequatchie River (01307239)                  | 06020004, 06030001                                                             |
| South Fork Holston River (01327068)          | 06010102, 06010104                                                             |
| Stones River (01271506)                      | 05130202, 05130203                                                             |
| Tuckasegee River (01016248)                  | 06010202, 06010203                                                             |
| Watauga River (01327321)                     | 06010102, 06010103                                                             |
| Wheeler Branch (00128828)                    | 06030002, 06030005                                                             |
| Wolf River (00695208)                        | 08010100, 08010210                                                             |

**Name-collision warning (critical for integration):** **2,177 name strings** appear in
multiple units — the overwhelming majority are DIFFERENT waters that merely share a name
(e.g., Adams Branch: 11 units / 14 distinct gnis ids; Abrams Creek: 2 units / 2 ids; the
T1.3 "two different Mill Creeks" incident generalizes statewide). **Never match waters by
name across units; match by `gnis_id` only.** The 41 rows above are exactly the set where
the gnis_id itself spans units.

## 5. Anomalies and observations (all units listed in index.json)

- **Byte budgets (review-flagged, not failures):** the §4 budgets were calibrated on the
  small reference watershed and are exceeded by large basins — 20 units over the 4 MB jsonl
  budget, 32 over the 3 MB vaa budget, 11 over the 6 MB graph budget. Worst is 06010105
  Upper French Broad (22.3/48.8/23.4 MB — it contains the whole NC/SC headwaters). These are
  intermediates, not shipped assets (the hard 80 KB budget applies to reaches). Needs a
  conventions decision (§7 proposal 4).
- **VAA population varies by product vintage:** some 20231216 products carry NULL VAA
  (as documented); others populate `streamlevel` and a few more fields (up to 16.7k rows,
  e.g. 06030002). Routing attributes (fromnode/tonode/hydroseq) remain NULL everywhere
  observed, so snapping stays the topology source per §5.2 — no behavior change, but
  `meta.vaaPopulated` is not comparable across units.
- **08030204 Coldwater:** source `NHDFlowlineVAA` table has 0 features → 0-byte
  `.vaa.jsonl` is legitimate; converter's `meta.counts.vaa = 1` is an empty-file line-count
  artifact (§7 proposal 2).
- **05130201 (Old Hickory Lake): 0 dam bridges** — its artpaths snap within the 12 m
  tolerance, so the §5.3 bridge never fires. Expected behavior variant, not a defect.
- **08010201:** `meta.damBridges` lakePids are GUID-form (`{...}`) in this product, not
  numeric — downstream joins on lakePid must tolerate both forms.
- **Impounded mainstem pattern:** exactly 1 unnamed > 5 km flowline per 0603-unit (the
  Tennessee River channel between reservoirs carries no GNIS name) — excluded by the frozen
  named-only filter by design; trace termini for catalog waters must handle this via
  `dam:` specs, not name continuity.
- **High component counts are boundary fragments, not defects:** 06040001 (90),
  06010105 (157), 08030204 (109 braided Delta + border fragments), 06040005 Kentucky Lake
  (60 impounded arms). Largest-component coverage stays 72–98 % except the lowland/impound
  units, consistent with the reference watershed's pattern of tributaries continuing in
  neighboring HU8s.
- **nonStandardFlowdir:** single digits per affected unit (e.g. 05130204 Windrow Branch
  `flowdir=0`); frozen rule keeps digitized order and counts them. 0 in most units.
- **06010207 note:** conventions doc table says "1,810 nodes"; the committed reference graph
  has 1,782 (engine evolved slightly after the doc was drafted). Doc-only discrepancy for
  GEOCONV-0 to reconcile (§7 proposal 3).

## 6. Failed unit: 08010206 Forked Deer — defective upstream product

- The only S3 object `StagedProducts/Hydrography/NHD/HU8/GDB/NHD_H_08010206_HU8_GDB.zip`
  is a genuine, complete 2,124,645-byte zip (content-length matched, `unzip -t` clean,
  sha256 `eb9a05726b40e0d8f829479247e40b6dbfcd79d65e9b0b6b583cc0c832a82555`,
  Last-Modified 2023-12-17) — but its contents are implausible for a full HU8: **419 total
  NHDFlowline features** (VAA 418 rows — mutually consistent, so the product was BUILT this
  way, not truncated in transfer; neighbors ship 6k–24k) and **202 NHDWaterbody polygons,
  all unnamed**.
- The converter then crashed in its waterbodies step on the zero-named-rows case
  (`JSON.parse("")`), so `.meta.json`/`.waterbodies.jsonl`/graph were never produced; the
  partial `.jsonl`/`.vaa.jsonl` were removed (commit `43c2eee`) so the unit is absent
  rather than half-present.
- **Remedies (owner actions):** (a) watch for a USGS republish of this object and re-run the
  §10 transcript for 08010206; (b) until then, catalog waters in that unit stay on TIGER
  fallback per conventions §8 (`geometrySource: "tiger"`); (c) fix the converter's
  zero-row path (§7 proposal 1) before the retry.
- **Note:** the unit is 08010206 (main Forked Deer); the forks (08010204/05) converted fine.

## 7. Engine feedback for GEOCONV-0's owner (proposals only — this lane changed no engine code)

1. **Converter crash on zero named waterbodies** (`nhd_convert_gdb.sh` waterbodies strip
   step): handle the 0-row intermediate (write empty file + proceed) — hit on 08010206.
2. **`meta.counts.vaa` counts 1 for an empty file** (08030204): empty-file line-count
   artifact; should be 0.
3. **Doc/schema wording:** committed JSONL geometry is single-part `MultiLineString`
   (exactly what ogr2ogr GeoJSONSeq emits and what `nhd_build_graph.mjs:94` requires); the
   conventions doc says only "one GeoJSON Feature per line". Suggest freezing the actual
   shape in §4 and reconciling the §4 table's node count (1,810 vs committed 1,782).
4. **Byte budgets need a size-tiered policy:** budgets calibrated on 06010207 are exceeded
   by 20–32 of 58 units (intermediates only, nothing ships). Suggest per-subregion tiers or
   an explicit "intermediates unbounded, reaches bounded" statement.
5. **WBD-based enumeration** (this report §1) is worth adding to conventions §2 as the
   canonical "which HU8s exist for a state" recipe.

## 8. Files changed (scope proof)

- `data/nhd/hu8/<code>.{jsonl,vaa.jsonl,waterbodies.jsonl,meta.json}` × 58 units
- `data/nhd/graphs/<code>.graph.json` × 58 units
- `data/nhd/hu8/index.json` (new; per-unit counts, byte sizes, named-water counts,
  conversion timestamps, provenance, enumeration method, totals)
- `FANOUT-REPORT.md` (this file), `PROGRESS.md` (session log)
- NOT touched: `scripts/**`, `docs/**`, `apps/**`, `packages/**`, `e2e/**`

## 9. Push flag (owner action)

No origin remote exists on this host (`TroutSite-main` is a snapshot without `.git`; all
clones have no remote). Per AGENTS.md rule 3 the push could not be executed. When the owner
supplies the GitHub remote:

```bash
cd /Users/ben/Downloads/TroutSite-nhdfanout1
git remote add origin <OWNER-SUPPLIED-URL>
url="$(git remote get-url origin)" && git push "git@github.com:$(echo "$url" | sed 's#https://github.com/##')" geoconv/nhd-fanout
```
