# Statewide river coverage — displayed vs selectable (2026-09-15)

Method: the enhanced-zoom map draws the NHD network (`public/atlas/network/*.geojson`,
186800 minor-water features, 0 unnamed)
as NON-SELECTABLE context. A river is only tappable when a catalog water covers it. This
report aggregates every NAMED network river by waterbody (length summed across HUCs and
segments), subtracts rivers the catalog already makes selectable, and applies a
fishable-size verdict on aggregate mapped length:

**corridor** ≥100 km (SHOULD be a catalog water) · **solid** 40–100 km (candidate) ·
**small** 15–40 km (only with a fishery reason — active gauge, stocking, public water) ·
**context** <15 km (tiny/seasonal — correctly stays unselectable network context).

Catalog coverage: 149 waters. Named network rivers: 7589 (7442 NOT selectable).

## SHOULD be catalog waters — displayed major corridors you cannot tap (4)

| river                        | mapped length | HUC-8                                                                          | active gauge               |
| ---------------------------- | ------------- | ------------------------------------------------------------------------------ | -------------------------- |
| Cypress Creek                | 151 km        | 08010202, 08010204, 08010205, 08010207, 08010208, 08010209, 08010210, 08010211 | yes (03605078, 27.3 sq mi) |
| North Fork Forked Deer River | 120 km        | 08010204, 08010205                                                             | no                         |
| Richland Creek               | 117 km        | 06030004                                                                       | yes (03584045, 375 sq mi)  |
| South Fork Forked Deer River | 117 km        | 08010205                                                                       | yes (07027720, 718 sq mi)  |

## Generic-name corridors — NEED PER-INSTANCE REVIEW (3)

These sum ≥100 km under one name, but the name is generic (Dry/Lick/Bear/...): the total
is almost certainly several unrelated creeks sharing a name across sub-basins. Each
instance needs a look at its actual watershed before it can be a catalog water — do NOT
author from this table alone.

| river      | mapped length | HUC-8                                            | active gauge |
| ---------- | ------------- | ------------------------------------------------ | ------------ |
| Lick Creek | 117 km        | 06040001, 06040002, 06040003, 06040005           | no           |
| Lick Creek | 112 km        | 06010103, 06010108                               | no           |
| Bear Creek | 108 km        | 08010203, 08010204, 08010205, 08010208, 08010209 | no           |

## Solid candidates (105)

| river                             | mapped length | HUC-8                                                                | active gauge               |
| --------------------------------- | ------------- | -------------------------------------------------------------------- | -------------------------- |
| Dry Creek                         | 99 km         | 06030001, 06030002, 06030003, 06030004, 06030005                     | yes (03426470, 7.64 sq mi) |
| Dry Creek                         | 93 km         | 05130104, 05130105, 05130106, 05130107, 05130108                     | yes (03426470, 7.64 sq mi) |
| Dry Creek                         | 89 km         | 06040001, 06040002, 06040003, 06040005, 06040006                     | yes (03426470, 7.64 sq mi) |
| Flat Creek                        | 87 km         | 06010104, 06010107, 06010108                                         | yes (03495005, 67.2 sq mi) |
| Chestuee Creek                    | 87 km         | 06020002                                                             | no                         |
| Rutherford Fork Obion River       | 87 km         | 08010203                                                             | no                         |
| Middle Fork Forked Deer River     | 87 km         | 08010204                                                             | yes (07028960, 211 sq mi)  |
| Turkey Creek                      | 86 km         | 06040001, 06040003, 06040005                                         | no                         |
| Dry Branch                        | 82 km         | 08010203, 08010204, 08010205, 08010207, 08010208, 08010209           | no                         |
| Big Sandy River                   | 81 km         | 06040005                                                             | yes (03606500, 205 sq mi)  |
| North Fork Obion River            | 79 km         | 08010202                                                             | yes (07025400, 372 sq mi)  |
| Mud Creek                         | 77 km         | 08010201, 08010203, 08010204, 08010205                               | no                         |
| Hickory Creek                     | 75 km         | 05130101, 05130107                                                   | no                         |
| Falling Water River               | 74 km         | 05130108                                                             | yes (03423000, 67 sq mi)   |
| East Fork Obey River              | 73 km         | 05130105                                                             | no                         |
| Oostanaula Creek                  | 71 km         | 06020002                                                             | yes (03565500, 57 sq mi)   |
| Beaver Creek                      | 70 km         | 06010207                                                             | yes (03535400, 86.8 sq mi) |
| Bartons Creek                     | 69 km         | 05130201, 05130205                                                   | no                         |
| Dry Branch                        | 69 km         | 06040001, 06040002, 06040003, 06040004, 06040005                     | no                         |
| Bullrun Creek                     | 67 km         | 06010207                                                             | yes (03535000, 68.5 sq mi) |
| Conasauga Creek                   | 67 km         | 06020002                                                             | no                         |
| Dry Branch                        | 66 km         | 06010102, 06010103, 06010104, 06010105, 06010106, 06010107, 06010108 | no                         |
| Bear Creek                        | 66 km         | 06040001, 06040002, 06040003, 06040005                               | no                         |
| Poplar Creek                      | 64 km         | 06010207                                                             | no                         |
| Trace Creek                       | 64 km         | 06040003, 06040004, 06040005                                         | no                         |
| Dry Fork                          | 63 km         | 05130104, 05130106, 05130108                                         | no                         |
| Smith Fork Creek                  | 63 km         | 05130108                                                             | no                         |
| Candies Creek                     | 62 km         | 06020002                                                             | no                         |
| North Mouse Creek                 | 62 km         | 06020002                                                             | no                         |
| Long Branch                       | 61 km         | 05130104, 05130105, 05130106, 05130107, 05130108                     | no                         |
| Loosahatchie River Canal          | 61 km         | 08010209                                                             | no                         |
| Meadow Creek                      | 60 km         | 05130101, 05130105, 05130107, 05130108                               | no                         |
| Roaring River                     | 60 km         | 05130106                                                             | yes (03418000, 78.7 sq mi) |
| Dry Creek                         | 60 km         | 08010202, 08010203, 08010204, 08010208                               | yes (03426470, 7.64 sq mi) |
| Richland Creek                    | 59 km         | 06010104, 06010108                                                   | yes (03584045, 375 sq mi)  |
| Dry Fork                          | 57 km         | 05130201, 05130202, 05130203                                         | no                         |
| Eagle Creek                       | 57 km         | 06040001, 06040005                                                   | no                         |
| Beech River                       | 56 km         | 06040001                                                             | no                         |
| Rock Creek                        | 55 km         | 05130101, 05130104, 05130107                                         | no                         |
| Yellow Creek                      | 55 km         | 05130205                                                             | yes (03436690, 103 sq mi)  |
| Beans Creek                       | 54 km         | 06030003                                                             | no                         |
| Big Swan Creek                    | 54 km         | 06040003                                                             | no                         |
| Running Reelfoot Bayou            | 54 km         | 08010202                                                             | no                         |
| Middle Fork Obion River           | 54 km         | 08010203                                                             | no                         |
| Caney Creek                       | 53 km         | 06010104, 06010106, 06010107, 06010108                               | no                         |
| Sugar Creek                       | 53 km         | 08010204, 08010205, 08010208                                         | no                         |
| Piney Creek                       | 51 km         | 05130105, 05130107, 05130108                                         | no                         |
| Cypress Creek                     | 51 km         | 06040001, 06040005                                                   | yes (03605078, 27.3 sq mi) |
| Sugar Creek                       | 51 km         | 06040002, 06040003, 06040005                                         | no                         |
| Fall Creek                        | 50 km         | 05130201, 05130203, 05130205                                         | no                         |
| Rutherford Creek                  | 50 km         | 06040003                                                             | no                         |
| Dry Branch                        | 49 km         | 05130201, 05130203, 05130204, 05130205                               | no                         |
| Big Creek                         | 49 km         | 06010204, 06010205                                                   | yes (03491000, 47.3 sq mi) |
| Mud Creek                         | 49 km         | 06040001, 06040002, 06040003, 06040005                               | no                         |
| Dry Fork Creek                    | 48 km         | 05130201, 05130202, 05130203, 05130205, 05130206                     | no                         |
| Pond Creek                        | 48 km         | 08010204, 08010205                                                   | no                         |
| West Fork Obey River              | 47 km         | 05130105                                                             | yes (03415000, 115 sq mi)  |
| Jones Creek                       | 47 km         | 05130204                                                             | no                         |
| Cedar Creek                       | 47 km         | 06010102, 06010104, 06010108                                         | no                         |
| South Fork Obion River            | 47 km         | 08010203                                                             | yes (07024500, 383 sq mi)  |
| Nonconnah Creek                   | 47 km         | 08010211                                                             | yes (07032200, 68.2 sq mi) |
| Cedar Creek                       | 46 km         | 05130201, 05130205                                                   | no                         |
| Cold Creek                        | 46 km         | 08010100                                                             | no                         |
| Muddy Creek                       | 45 km         | 08010207, 08010208                                                   | no                         |
| Cove Creek                        | 44 km         | 06010103, 06010104, 06010107, 06010108                               | no                         |
| North White Oak Creek             | 43 km         | 05130104                                                             | no                         |
| Laurel Branch                     | 43 km         | 06010102, 06010103, 06010104, 06010105, 06010106, 06010107, 06010108 | no                         |
| Whites Creek                      | 43 km         | 06010201                                                             | yes (03431599, 51.3 sq mi) |
| Sweetwater Creek                  | 43 km         | 06010201                                                             | no                         |
| Davis Creek                       | 43 km         | 06010204, 06010206                                                   | no                         |
| Brimstone Creek                   | 42 km         | 05130104, 05130105, 05130106                                         | no                         |
| Laurel Branch                     | 42 km         | 06010201, 06010204, 06010205, 06010207, 06010208                     | no                         |
| Abrams Creek                      | 42 km         | 06010204                                                             | no                         |
| Loosahatchie River Drainage Canal | 42 km         | 08010209                                                             | no                         |
| Knob Creek                        | 41 km         | 06010103, 06010107, 06010108                                         | no                         |
| Fork Creek                        | 41 km         | 06010201, 06010204                                                   | no                         |
| Cove Creek                        | 41 km         | 06010205                                                             | no                         |
| Big Bigby Creek                   | 41 km         | 06040003                                                             | no                         |
| Jones Creek                       | 41 km         | 08010204, 08010205, 08010209                                         | no                         |
| Hinds Creek                       | 40 km         | 06010207                                                             | no                         |
| Goose Creek                       | 39 km         | 05130201, 05130203, 05130204                                         | yes (03425290, 64 sq mi)   |
| Sycamore Creek                    | 39 km         | 05130202                                                             | yes (03431800, 97.2 sq mi) |
| Flat Creek                        | 38 km         | 06040001, 06040002                                                   | yes (03495005, 67.2 sq mi) |
| Big Creek                         | 37 km         | 06010102, 06010104                                                   | yes (03491000, 47.3 sq mi) |
| Richland Creek                    | 37 km         | 08010202, 08010208                                                   | yes (03584045, 375 sq mi)  |
| Big Creek                         | 36 km         | 05130104, 05130107                                                   | yes (03491000, 47.3 sq mi) |
| Bledsoe Creek                     | 36 km         | 05130201                                                             | yes (03425622, 55.8 sq mi) |
| Beaver Creek                      | 36 km         | 06010102, 06010104                                                   | yes (03535400, 86.8 sq mi) |
| Jennings Creek                    | 35 km         | 05130101, 05130106                                                   | yes (03418224, 67.4 sq mi) |
| South Chickamauga Creek           | 27 km         | 06020001                                                             | yes (03567500, 428 sq mi)  |
| Flat Creek                        | 25 km         | 05130104, 05130106, 05130108                                         | yes (03495005, 67.2 sq mi) |
| Beaver Creek                      | 22 km         | 08010203, 08010209                                                   | yes (03535400, 86.8 sq mi) |
| Whites Creek                      | 21 km         | 06040001                                                             | yes (03431599, 51.3 sq mi) |
| Whites Creek                      | 20 km         | 05130202                                                             | yes (03431599, 51.3 sq mi) |
| Big Limestone Creek               | 20 km         | 06010108                                                             | yes (03466208, 79 sq mi)   |
| Wartrace Creek                    | 19 km         | 06040002                                                             | yes (03597590, 35.7 sq mi) |
| Goose Creek                       | 19 km         | 06040002                                                             | yes (03425290, 64 sq mi)   |
| Richland Creek                    | 18 km         | 05130202                                                             | yes (03584045, 375 sq mi)  |
| Sewee Creek                       | 18 km         | 06020001                                                             | yes (03543500, 117 sq mi)  |
| Fletcher Creek                    | 18 km         | 08010210                                                             | yes (07031692, 30.5 sq mi) |
| Big Creek                         | 17 km         | 06030004                                                             | yes (03491000, 47.3 sq mi) |
| Yellow Creek                      | 16 km         | 06010208                                                             | yes (03436690, 103 sq mi)  |
| Cypress Creek                     | 16 km         | 06030005                                                             | yes (03605078, 27.3 sq mi) |
| Smith Fork                        | 16 km         | 06040001                                                             | yes (03424730, 214 sq mi)  |
| Big Creek                         | 16 km         | 08010209                                                             | yes (03491000, 47.3 sq mi) |

## Small rivers — candidate only with a fishery reason (463)

| river                                 | mapped length | HUC-8                                            | active gauge               |
| ------------------------------------- | ------------- | ------------------------------------------------ | -------------------------- |
| Crooked Creek                         | 40 km         | 06040001, 06040003, 06040005                     | no                         |
| Fall Creek                            | 39 km         | 05130107, 05130108                               | no                         |
| West Harpeth River                    | 39 km         | 05130204                                         | no                         |
| Dry Creek                             | 39 km         | 06010102, 06010103, 06010108                     | yes (03426470, 7.64 sq mi) |
| Poor Valley Creek                     | 39 km         | 06010104                                         | no                         |
| Middle Creek                          | 39 km         | 06020001, 06020002                               | no                         |
| Round Lick Creek                      | 38 km         | 05130201                                         | no                         |
| Middle Creek                          | 38 km         | 06010106, 06010107, 06010108                     | no                         |
| Rock Creek                            | 38 km         | 06010201, 06010208                               | no                         |
| Baker Creek                           | 38 km         | 06010201, 06010204                               | no                         |
| Dry Branch                            | 38 km         | 06020001, 06020002, 06020004                     | no                         |
| Rock Creek                            | 38 km         | 06020001, 06020002, 06020003                     | no                         |
| Rogers Creek                          | 38 km         | 06020001, 06020002                               | no                         |
| Cub Creek                             | 38 km         | 06040001                                         | no                         |
| East Rock Creek                       | 38 km         | 06040002                                         | no                         |
| Birdsong Creek                        | 38 km         | 06040005                                         | no                         |
| Turkey Creek                          | 38 km         | 08010204, 08010205, 08010207                     | no                         |
| Mountain Creek                        | 37 km         | 05130107                                         | yes (03569190, 5.07 sq mi) |
| Bee Creek                             | 37 km         | 05130108                                         | no                         |
| Stewart Creek                         | 37 km         | 05130203                                         | no                         |
| Bear Creek                            | 37 km         | 05130204, 05130205                               | no                         |
| Beech Creek                           | 37 km         | 06010104                                         | no                         |
| Island Creek                          | 37 km         | 06010204, 06010206, 06010208                     | no                         |
| Big Sycamore Creek                    | 37 km         | 06010205                                         | no                         |
| Beech Creek                           | 37 km         | 06040001, 06040002, 06040003                     | no                         |
| Crooked Creek                         | 36 km         | 05130101, 05130104                               | no                         |
| Lick Branch                           | 36 km         | 05130104, 05130105, 05130106, 05130108           | no                         |
| Dry Branch                            | 36 km         | 05130104, 05130105, 05130106, 05130107, 05130108 | no                         |
| Glade Creek                           | 36 km         | 05130108                                         | no                         |
| Wolftever Creek                       | 36 km         | 06020001                                         | yes (03566420, 18.8 sq mi) |
| Factory Creek                         | 36 km         | 06030004, 06030005                               | no                         |
| Coon Creek                            | 36 km         | 06040001, 06040003, 06040004, 06040005           | no                         |
| Big Branch                            | 35 km         | 05130101, 05130104, 05130105, 05130106, 05130108 | no                         |
| Sink Creek                            | 35 km         | 05130108                                         | no                         |
| Long Creek                            | 35 km         | 05130202, 05130203, 05130205                     | no                         |
| South Fork Red River                  | 35 km         | 05130206                                         | no                         |
| Little Chucky Creek                   | 35 km         | 06010108                                         | no                         |
| Lick Branch                           | 35 km         | 06020001, 06020002, 06020004                     | no                         |
| Hardin Creek                          | 35 km         | 06040001                                         | no                         |
| Garrison Fork                         | 35 km         | 06040002                                         | no                         |
| Fountain Creek                        | 35 km         | 06040002                                         | no                         |
| Sandy Creek                           | 35 km         | 08010205, 08010207, 08010208, 08010210           | no                         |
| North Prong Clear Fork                | 34 km         | 05130104                                         | no                         |
| Buchanan Creek                        | 34 km         | 06030003, 06030004                               | no                         |
| Poplar Creek                          | 34 km         | 08010204, 08010208                               | no                         |
| Stinking Creek                        | 33 km         | 05130101                                         | no                         |
| Possum Creek                          | 33 km         | 06010101, 06010102, 06010108                     | no                         |
| Long Branch                           | 33 km         | 06010201, 06010204, 06010205, 06010207, 06010208 | no                         |
| Big Brush Creek                       | 33 km         | 06020004                                         | no                         |
| Second Creek                          | 33 km         | 06030002, 06030005                               | no                         |
| Rushing Creek                         | 33 km         | 06040001, 06040005                               | no                         |
| Snake Creek                           | 33 km         | 06040001, 06040002, 06040003                     | no                         |
| Green River                           | 33 km         | 06040004                                         | no                         |
| Overall Creek                         | 32 km         | 05130202, 05130203                               | no                         |
| Long Creek                            | 32 km         | 06010105, 06010108                               | no                         |
| Turkey Creek                          | 32 km         | 06010201, 06010204, 06010205, 06010208           | no                         |
| Ninemile Creek                        | 32 km         | 06010204                                         | no                         |
| Crab Orchard Creek                    | 32 km         | 06010208                                         | no                         |
| Crooked Fork                          | 32 km         | 06010208                                         | no                         |
| Lost Creek                            | 32 km         | 06040001, 06040004, 06040005                     | no                         |
| Blue Creek                            | 32 km         | 06040001, 06040003                               | no                         |
| Short Creek                           | 32 km         | 06040001, 06040003, 06040004, 06040005           | no                         |
| Little Muddy Creek                    | 32 km         | 08010207, 08010208                               | no                         |
| Little Hatchie Creek                  | 32 km         | 08010207                                         | no                         |
| Lagoon Creek                          | 32 km         | 08010208                                         | no                         |
| Shaws Creek                           | 32 km         | 08010210                                         | no                         |
| North Fork Wolf River                 | 32 km         | 08010210                                         | no                         |
| Dry Creek                             | 31 km         | 05130202, 05130203                               | yes (03426470, 7.64 sq mi) |
| Middle Fork Stones River              | 31 km         | 05130203                                         | no                         |
| Muddy Creek                           | 31 km         | 06010102, 06010107                               | no                         |
| Dunn Creek                            | 31 km         | 06010107                                         | no                         |
| Panther Creek                         | 31 km         | 06010201, 06010204, 06010205, 06010208           | no                         |
| Bat Creek                             | 31 km         | 06010204                                         | no                         |
| Mill Branch                           | 31 km         | 06010204, 06010205, 06010206, 06010207, 06010208 | no                         |
| Soddy Creek                           | 31 km         | 06020001                                         | no                         |
| South Mouse Creek                     | 31 km         | 06020002                                         | no                         |
| Battle Creek                          | 31 km         | 06030001                                         | no                         |
| East Fork Mulberry Creek              | 31 km         | 06030003                                         | no                         |
| Bradshaw Creek                        | 31 km         | 06030003                                         | no                         |
| Chisholm Creek                        | 31 km         | 06030005                                         | no                         |
| Wolf Creek                            | 31 km         | 06040001, 06040002, 06040003, 06040005           | no                         |
| Little Bigby Creek                    | 31 km         | 06040003                                         | no                         |
| Johnson Creek                         | 31 km         | 08010204, 08010205                               | no                         |
| Tackett Creek                         | 30 km         | 05130101                                         | no                         |
| Dumplin Creek                         | 30 km         | 06010107                                         | no                         |
| Notchy Creek                          | 30 km         | 06010204, 06010205                               | no                         |
| Sale Creek                            | 30 km         | 06020001                                         | no                         |
| Caney Branch                          | 30 km         | 06040001, 06040005                               | no                         |
| North Fork Creek                      | 30 km         | 06040002                                         | no                         |
| Rockhouse Creek                       | 30 km         | 06040004                                         | no                         |
| Big Richland Creek                    | 30 km         | 06040005                                         | no                         |
| Mill Branch                           | 29 km         | 05130101, 05130104, 05130106, 05130108           | no                         |
| Martin Creek                          | 29 km         | 05130106, 05130107                               | no                         |
| Carr Creek                            | 29 km         | 05130201, 05130206                               | no                         |
| Station Camp Creek                    | 29 km         | 05130201                                         | no                         |
| Marrowbone Creek                      | 29 km         | 05130202                                         | no                         |
| Long Branch                           | 29 km         | 06010105, 06010107, 06010108                     | no                         |
| Pond Creek                            | 29 km         | 06010201                                         | no                         |
| Thompson Creek                        | 29 km         | 08010203, 08010208                               | no                         |
| Mosses Creek                          | 29 km         | 08010207                                         | no                         |
| Long Fork                             | 28 km         | 05110002                                         | no                         |
| Hickman Creek                         | 28 km         | 05130108                                         | no                         |
| Spencer Creek                         | 28 km         | 05130201, 05130204                               | no                         |
| Drakes Creek                          | 28 km         | 05130201                                         | no                         |
| Lytle Creek                           | 28 km         | 05130203                                         | no                         |
| Mud Creek                             | 28 km         | 06010108                                         | no                         |
| Big War Creek                         | 28 km         | 06010205                                         | no                         |
| Rogers Branch                         | 28 km         | 06020001, 06020003, 06020004                     | no                         |
| Robertson Fork Creek                  | 28 km         | 06030004                                         | no                         |
| Porters Creek                         | 28 km         | 08010208                                         | no                         |
| West Fork Drakes Creek                | 27 km         | 05110002                                         | no                         |
| Little Indian Creek                   | 27 km         | 05130105, 05130106, 05130108                     | no                         |
| Little Laurel Creek                   | 27 km         | 05130105, 05130108                               | no                         |
| Flynn Creek                           | 27 km         | 05130106, 05130108                               | no                         |
| Suggs Creek                           | 27 km         | 05130203                                         | no                         |
| Piney Fork                            | 27 km         | 05130206                                         | no                         |
| Paint Creek                           | 27 km         | 06010105                                         | no                         |
| Blackwater Creek                      | 27 km         | 06010205                                         | no                         |
| Byrd Creek                            | 27 km         | 06010205, 06010208                               | no                         |
| Roaring Creek                         | 27 km         | 06020001                                         | no                         |
| South Chestuee Creek                  | 27 km         | 06020002                                         | no                         |
| Big Fiery Gizzard Creek               | 27 km         | 06030001                                         | no                         |
| Buck Branch                           | 27 km         | 06040001, 06040003, 06040004, 06040005           | no                         |
| Leipers Creek                         | 27 km         | 06040003                                         | no                         |
| Fortyeight Creek                      | 27 km         | 06040004                                         | no                         |
| Cub Creek                             | 27 km         | 08010205, 08010208                               | no                         |
| Nixon Creek                           | 27 km         | 08010205                                         | no                         |
| Cypress Creek Ditch                   | 27 km         | 08010207                                         | no                         |
| Clover Creek                          | 27 km         | 08010208                                         | no                         |
| Mine Lick Creek                       | 26 km         | 05130108                                         | no                         |
| Peyton Creek                          | 26 km         | 05130201                                         | no                         |
| Sullivan Branch                       | 26 km         | 05130201, 05130204, 05130205                     | no                         |
| Little Harpeth River                  | 26 km         | 05130204                                         | no                         |
| Tuckahoe Creek                        | 26 km         | 06010107                                         | no                         |
| North Indian Creek                    | 26 km         | 06010108                                         | no                         |
| Piney Creek                           | 26 km         | 06010201                                         | no                         |
| Buck Creek                            | 26 km         | 06010201, 06010208                               | no                         |
| Coal Creek                            | 26 km         | 06010201, 06010207                               | no                         |
| Otter Creek                           | 26 km         | 06010201, 06010208                               | no                         |
| Fourmile Creek                        | 26 km         | 06010204, 06010206                               | no                         |
| Big Sewee Creek                       | 26 km         | 06020001                                         | no                         |
| Dry Creek                             | 26 km         | 06020001, 06020002                               | yes (03426470, 7.64 sq mi) |
| East Fork Sugar Creek                 | 26 km         | 06030004                                         | no                         |
| Bluewater Creek                       | 26 km         | 06030005                                         | no                         |
| Black Creek                           | 26 km         | 08010205, 08010209                               | no                         |
| Big Muddy Canal                       | 26 km         | 08010208                                         | no                         |
| Straight Fork                         | 25 km         | 05130104                                         | no                         |
| Blackburn Fork                        | 25 km         | 05130106                                         | no                         |
| Town Creek                            | 25 km         | 05130106, 05130107, 05130108                     | no                         |
| Cripple Creek                         | 25 km         | 05130203                                         | no                         |
| Fall Branch                           | 25 km         | 06010102, 06010103, 06010105, 06010107, 06010108 | no                         |
| Little Limestone Creek                | 25 km         | 06010108                                         | no                         |
| Pistol Creek                          | 25 km         | 06010201                                         | no                         |
| Fall Creek                            | 25 km         | 06010201, 06010205                               | no                         |
| Mulberry Creek                        | 25 km         | 06010204, 06010206                               | no                         |
| Bear Creek                            | 25 km         | 06010205, 06010207, 06010208                     | no                         |
| East Fork Poplar Creek                | 25 km         | 06010207                                         | no                         |
| Coker Creek                           | 25 km         | 06020002                                         | no                         |
| Turkey Creek                          | 25 km         | 06030002, 06030003, 06030004                     | no                         |
| Norris Creek                          | 25 km         | 06030003                                         | no                         |
| West Fork Mulberry Creek              | 25 km         | 06030003                                         | no                         |
| West Fork Sugar Creek                 | 25 km         | 06030004                                         | no                         |
| Weatherford Creek                     | 25 km         | 06040001                                         | no                         |
| Little Hurricane Creek                | 25 km         | 06040001, 06040002, 06040003                     | no                         |
| Johns Creek                           | 25 km         | 08010203, 08010211                               | no                         |
| Jacks Creek                           | 25 km         | 08010205                                         | no                         |
| Elk Fork Creek                        | 24 km         | 05130101                                         | no                         |
| West Fork Hickory Creek               | 24 km         | 05130107                                         | no                         |
| Leatherwood Creek                     | 24 km         | 05130204, 05130205                               | no                         |
| East Fork Yellow Creek                | 24 km         | 05130205                                         | no                         |
| Half Pone Creek                       | 24 km         | 05130205                                         | no                         |
| Big Branch                            | 24 km         | 06010103, 06010104, 06010106, 06010107, 06010108 | no                         |
| Boyds Creek                           | 24 km         | 06010107                                         | no                         |
| Crooked Creek                         | 24 km         | 06010201, 06010205                               | no                         |
| Wolf Creek                            | 24 km         | 06010201, 06010207                               | no                         |
| Ballplay Creek                        | 24 km         | 06010204                                         | no                         |
| Swan Creek                            | 24 km         | 06030003                                         | no                         |
| Rock Creek                            | 24 km         | 06030003                                         | no                         |
| Panther Creek                         | 24 km         | 06040001, 06040005                               | no                         |
| Smith Branch                          | 24 km         | 06040001, 06040002, 06040003, 06040005           | no                         |
| Morgan Creek                          | 24 km         | 06040001, 06040003                               | no                         |
| Thompson Creek                        | 24 km         | 06040002, 06040005                               | no                         |
| Town Creek                            | 24 km         | 08010202, 08010208                               | no                         |
| Piney Creek                           | 24 km         | 08010208                                         | no                         |
| Little Creek                          | 23 km         | 05130104, 05130106                               | no                         |
| Stoners Creek                         | 23 km         | 05130203                                         | no                         |
| South Harpeth River                   | 23 km         | 05130204                                         | no                         |
| Little Bartons Creek                  | 23 km         | 05130205                                         | no                         |
| Lick Branch                           | 23 km         | 06010102, 06010103, 06010104, 06010107, 06010108 | no                         |
| Town Creek                            | 23 km         | 06010201                                         | no                         |
| Paint Rock Creek                      | 23 km         | 06010201                                         | no                         |
| Caney Creek                           | 23 km         | 06010201, 06010207                               | no                         |
| Little Creek                          | 23 km         | 06010206, 06010208                               | no                         |
| Rocky Branch                          | 23 km         | 06020001, 06020002, 06020004                     | no                         |
| Bell Branch                           | 23 km         | 06040001, 06040003, 06040004                     | no                         |
| Tanyard Branch                        | 23 km         | 06040001, 06040003, 06040004                     | no                         |
| Turnbo Creek                          | 23 km         | 06040001                                         | no                         |
| Cedar Creek                           | 23 km         | 06040001, 06040002                               | no                         |
| Garner Creek                          | 23 km         | 06040003                                         | no                         |
| Chief Creek                           | 23 km         | 06040004                                         | no                         |
| Lick Creek                            | 23 km         | 08010203, 08010210                               | no                         |
| Lick Creek                            | 22 km         | 05130101, 05130104, 05130105, 05130107           | no                         |
| Big Eagle Creek                       | 22 km         | 05130105                                         | no                         |
| Turnbull Creek                        | 22 km         | 05130204                                         | no                         |
| Honey Run                             | 22 km         | 05130206                                         | no                         |
| Waldens Creek                         | 22 km         | 06010107                                         | no                         |
| Lick Branch                           | 22 km         | 06010201, 06010204, 06010205, 06010207, 06010208 | no                         |
| Sixmile Creek                         | 22 km         | 06010204                                         | no                         |
| Turtletown Creek                      | 22 km         | 06020002                                         | no                         |
| Towee Creek                           | 22 km         | 06020002                                         | no                         |
| Long Branch                           | 22 km         | 06020002, 06020003, 06020004                     | no                         |
| Harmon Creek                          | 22 km         | 06040001, 06040005                               | no                         |
| Rocky Branch                          | 22 km         | 06040001, 06040003, 06040005                     | no                         |
| Stewman Creek                         | 22 km         | 06040001                                         | no                         |
| Camp Branch                           | 22 km         | 06040001, 06040003, 06040004, 06040005           | no                         |
| Knob Creek                            | 22 km         | 06040002, 06040003                               | no                         |
| Little Richland Creek                 | 22 km         | 06040005                                         | yes (03544611, 0 sq mi)    |
| Guins Creek                           | 22 km         | 08010203                                         | no                         |
| Buck Creek                            | 22 km         | 08010204                                         | no                         |
| Williams Creek                        | 21 km         | 05130104, 05130105                               | no                         |
| Lick Creek                            | 21 km         | 05130201, 05130205                               | no                         |
| East Camp Creek                       | 21 km         | 05130201                                         | no                         |
| Brawleys Fork                         | 21 km         | 05130203                                         | no                         |
| Big McAdoo Creek                      | 21 km         | 05130205                                         | no                         |
| West Fork Red River                   | 21 km         | 05130206                                         | no                         |
| Miller Branch                         | 21 km         | 06010102, 06010103, 06010104, 06010106           | no                         |
| Stout Branch                          | 21 km         | 06010103                                         | no                         |
| South Indian Creek                    | 21 km         | 06010108                                         | no                         |
| Muddy Creek                           | 21 km         | 06010201                                         | no                         |
| Hesse Creek                           | 21 km         | 06010201                                         | no                         |
| Mammys Creek                          | 21 km         | 06010201                                         | no                         |
| Possum Creek                          | 21 km         | 06020001, 06020002                               | no                         |
| Little Chestuee Creek                 | 21 km         | 06020002                                         | no                         |
| Holly Creek                           | 21 km         | 06030005                                         | no                         |
| Chalk Creek                           | 21 km         | 06040001, 06040004                               | no                         |
| Sulphur Fork Cub Creek                | 21 km         | 06040001                                         | no                         |
| Opossum Creek                         | 21 km         | 06040001, 06040002                               | no                         |
| Simmons Branch                        | 21 km         | 06040001, 06040002, 06040003, 06040004, 06040005 | no                         |
| Big Spring Creek                      | 21 km         | 06040003                                         | no                         |
| Sandy Branch                          | 21 km         | 08010202, 08010203, 08010210                     | no                         |
| Camp Creek                            | 21 km         | 08010203, 08010208                               | no                         |
| Long Creek                            | 20 km         | 05110002                                         | no                         |
| Davis Creek                           | 20 km         | 05130101, 05130104                               | no                         |
| Jellico Creek                         | 20 km         | 05130101                                         | no                         |
| Capuchin Creek                        | 20 km         | 05130101                                         | no                         |
| Bone Camp Creek                       | 20 km         | 05130104                                         | no                         |
| Black Wolf Creek                      | 20 km         | 05130104                                         | no                         |
| Caney Branch                          | 20 km         | 05130104, 05130107, 05130108                     | no                         |
| Big Laurel Creek                      | 20 km         | 05130105, 05130108                               | no                         |
| Turkey Creek                          | 20 km         | 05130106, 05130108                               | no                         |
| Smith Branch                          | 20 km         | 05130201, 05130203, 05130204, 05130206           | no                         |
| McCrory Creek                         | 20 km         | 05130203, 05130204                               | no                         |
| Johnson Creek                         | 20 km         | 05130205                                         | no                         |
| Fall Creek                            | 20 km         | 06010102, 06010104                               | no                         |
| Cherokee Creek                        | 20 km         | 06010103, 06010108                               | no                         |
| Gists Creek                           | 20 km         | 06010107                                         | no                         |
| Moccasin Creek                        | 20 km         | 06010201                                         | no                         |
| Big Branch                            | 20 km         | 06010204, 06010206, 06010208                     | no                         |
| White Creek                           | 20 km         | 06010205, 06010208                               | no                         |
| Clifty Creek                          | 20 km         | 06010208                                         | no                         |
| Long Savannah Creek                   | 20 km         | 06020001                                         | no                         |
| Johnson Branch                        | 20 km         | 06020001, 06020002, 06020003, 06020004           | no                         |
| Ten Mile Creek                        | 20 km         | 06020001                                         | no                         |
| Chatata Creek                         | 20 km         | 06020002                                         | no                         |
| Dog Branch                            | 20 km         | 06030003, 06030004                               | no                         |
| West Fork Shoal Creek                 | 20 km         | 06030004                                         | no                         |
| Owl Creek                             | 20 km         | 06040001                                         | no                         |
| Haley Creek                           | 20 km         | 06040001, 06040003                               | no                         |
| Crumpton Creek                        | 20 km         | 06040002                                         | no                         |
| Pumpkin Creek                         | 20 km         | 06040002, 06040003                               | no                         |
| Carters Creek                         | 20 km         | 06040003                                         | no                         |
| Catheys Creek                         | 20 km         | 06040003                                         | no                         |
| Harris Fork Creek                     | 20 km         | 08010202                                         | no                         |
| Lewis Creek                           | 20 km         | 08010204                                         | no                         |
| Crooked Creek                         | 20 km         | 08010204, 08010207, 08010209                     | no                         |
| Line Creek                            | 19 km         | 05110002                                         | no                         |
| Walker Branch                         | 19 km         | 05130201, 05130204, 05130205                     | no                         |
| Big Turnbull Creek                    | 19 km         | 05130204                                         | no                         |
| Kendrick Creek                        | 19 km         | 06010102                                         | no                         |
| Back Creek                            | 19 km         | 06010102, 06010108                               | no                         |
| Rocky Branch                          | 19 km         | 06010102, 06010103, 06010104, 06010108           | no                         |
| Bear Branch                           | 19 km         | 06010102, 06010103, 06010105, 06010107           | no                         |
| Honeycutt Creek                       | 19 km         | 06010104                                         | no                         |
| Rock Creek                            | 19 km         | 06010105, 06010106, 06010108                     | no                         |
| Pigeon Creek                          | 19 km         | 06010108                                         | no                         |
| Bent Creek                            | 19 km         | 06010108                                         | no                         |
| Riley Creek                           | 19 km         | 06010201                                         | no                         |
| Dry Branch                            | 19 km         | 06010201, 06010205, 06010206, 06010208           | no                         |
| Mud Creek                             | 19 km         | 06010201, 06010208                               | no                         |
| Fox Creek                             | 19 km         | 06010205, 06010208                               | no                         |
| Poe Branch                            | 19 km         | 06020001                                         | no                         |
| Dry Fork                              | 19 km         | 06020001                                         | no                         |
| Hall Creek                            | 19 km         | 06020001, 06020002, 06020004                     | no                         |
| Crow Creek                            | 19 km         | 06030001                                         | no                         |
| Sweden Creek                          | 19 km         | 06030001                                         | no                         |
| Little Gizzard Creek                  | 19 km         | 06030001                                         | no                         |
| Flint River                           | 19 km         | 06030002                                         | no                         |
| Chambers Creek                        | 19 km         | 06040001                                         | no                         |
| Browns Creek                          | 19 km         | 06040001                                         | yes (03431300, 11.8 sq mi) |
| North Fork Lick Creek                 | 19 km         | 06040001, 06040003                               | no                         |
| Wright Branch                         | 19 km         | 06040001, 06040002, 06040003, 06040004           | no                         |
| Silver Creek                          | 19 km         | 06040002                                         | no                         |
| Snow Creek                            | 19 km         | 06040003                                         | no                         |
| Black Branch                          | 19 km         | 06040003, 06040004, 06040005                     | no                         |
| Cain Creek                            | 19 km         | 08010204                                         | no                         |
| Grays Creek                           | 19 km         | 08010208, 08010210                               | no                         |
| Mathis Creek                          | 19 km         | 08010208                                         | no                         |
| Pleasant Run                          | 19 km         | 08010208                                         | no                         |
| Smoky Creek                           | 18 km         | 05130104                                         | no                         |
| Thompson Creek                        | 18 km         | 05130104, 05130108                               | no                         |
| Buffalo Branch                        | 18 km         | 05130105, 05130106, 05130108                     | no                         |
| Little Hurricane Creek                | 18 km         | 05130105, 05130108                               | no                         |
| Taylor Creek                          | 18 km         | 05130107, 05130108                               | no                         |
| Savage Creek                          | 18 km         | 05130107                                         | no                         |
| Saline Creek                          | 18 km         | 05130205                                         | no                         |
| Dyers Creek                           | 18 km         | 05130205                                         | no                         |
| North Cross Creek                     | 18 km         | 05130205                                         | no                         |
| Summers Branch                        | 18 km         | 05130206                                         | no                         |
| Roaring Creek                         | 18 km         | 06010103, 06010108                               | no                         |
| Little Flat Creek                     | 18 km         | 06010104                                         | no                         |
| Moore Branch                          | 18 km         | 06010104, 06010107, 06010108                     | no                         |
| Turkey Creek                          | 18 km         | 06010104, 06010108                               | no                         |
| Dry Fork                              | 18 km         | 06010105, 06010107                               | no                         |
| Grassy Creek                          | 18 km         | 06010108                                         | no                         |
| Stock Creek                           | 18 km         | 06010201                                         | no                         |
| Cedar Creek                           | 18 km         | 06010201, 06010206                               | no                         |
| Davis Branch                          | 18 km         | 06010201, 06010204, 06010205, 06010208           | no                         |
| Fall Branch                           | 18 km         | 06010201, 06010204, 06010205                     | no                         |
| Williams Creek                        | 18 km         | 06010201, 06010205, 06010208                     | no                         |
| Bald River                            | 18 km         | 06010204                                         | no                         |
| Ollis Creek                           | 18 km         | 06010205                                         | no                         |
| Lick Creek                            | 18 km         | 06010207, 06010208                               | no                         |
| Cooper Creek                          | 18 km         | 06020001                                         | no                         |
| Laurel Branch                         | 18 km         | 06020001, 06020002, 06020003                     | no                         |
| Gimlet Creek                          | 18 km         | 06030003, 06030004                               | no                         |
| Pigeon Roost Creek                    | 18 km         | 06030004                                         | no                         |
| Crowson Creek                         | 18 km         | 06030005                                         | no                         |
| Knob Creek                            | 18 km         | 06030005                                         | no                         |
| Little Shoal Creek                    | 18 km         | 06030005                                         | no                         |
| Little Spring Creek                   | 18 km         | 06040001, 06040003                               | no                         |
| Mill Branch                           | 18 km         | 06040001, 06040003, 06040004, 06040005           | no                         |
| Hog Creek                             | 18 km         | 06040001                                         | no                         |
| Roan Creek                            | 18 km         | 06040001, 06040005                               | no                         |
| Wilson Creek                          | 18 km         | 06040002                                         | no                         |
| Fall Creek                            | 18 km         | 06040002                                         | no                         |
| Spencer Creek                         | 18 km         | 08010205                                         | no                         |
| Middle Fork Drakes Creek              | 17 km         | 05110002                                         | no                         |
| Bear Creek                            | 17 km         | 05130101, 05130104, 05130106                     | no                         |
| Mulherrin Creek                       | 17 km         | 05130108                                         | no                         |
| Clear Fork Creek                      | 17 km         | 05130108                                         | no                         |
| Little Creek                          | 17 km         | 05130201, 05130202, 05130206                     | no                         |
| Dixon Creek                           | 17 km         | 05130201                                         | no                         |
| Sulphur Branch                        | 17 km         | 05130201, 05130202, 05130205                     | no                         |
| Carson Fork                           | 17 km         | 05130203                                         | no                         |
| Wells Creek                           | 17 km         | 05130205                                         | no                         |
| Passenger Creek                       | 17 km         | 05130206                                         | no                         |
| Boones Creek                          | 17 km         | 06010103                                         | no                         |
| Jones Branch                          | 17 km         | 06010103, 06010106, 06010107, 06010108           | no                         |
| Lost Creek                            | 17 km         | 06010104                                         | no                         |
| Dodson Creek                          | 17 km         | 06010104                                         | no                         |
| Robertson Creek                       | 17 km         | 06010104                                         | no                         |
| East Fork Little Pigeon River         | 17 km         | 06010107                                         | no                         |
| Happy Creek                           | 17 km         | 06010107                                         | no                         |
| Higgins Creek                         | 17 km         | 06010108                                         | no                         |
| Stamp Creek                           | 17 km         | 06010201                                         | no                         |
| Ellejoy Creek                         | 17 km         | 06010201                                         | no                         |
| Nails Creek                           | 17 km         | 06010201                                         | no                         |
| Bear Branch                           | 17 km         | 06010201, 06010204, 06010205, 06010208           | no                         |
| Rocky Branch                          | 17 km         | 06010201, 06010204, 06010208                     | no                         |
| Left Prong Upper Prong Sinkhole Creek | 17 km         | 06010204                                         | no                         |
| Little Sycamore Creek                 | 17 km         | 06010205                                         | no                         |
| Whiteoak Creek                        | 17 km         | 06010207, 06010208                               | no                         |
| Henderson Creek                       | 17 km         | 06020001                                         | no                         |
| Lick Creek                            | 17 km         | 06020002                                         | no                         |
| Anderson Creek                        | 17 km         | 06030004                                         | no                         |
| Shannon Creek                         | 17 km         | 06030004                                         | no                         |
| Little Lick Creek                     | 17 km         | 06040001                                         | no                         |
| Lick Creek Canal                      | 17 km         | 06040001                                         | no                         |
| Little Creek                          | 17 km         | 06040001                                         | no                         |
| Beason Creek                          | 17 km         | 06040001                                         | no                         |
| Taylor Branch                         | 17 km         | 06040002, 06040004                               | no                         |
| South Fork Cane Creek                 | 17 km         | 06040004, 06040005                               | no                         |
| Hoosier Creek                         | 17 km         | 08010202                                         | no                         |
| Cane Branch                           | 17 km         | 08010203, 08010208                               | no                         |
| Brier Creek                           | 17 km         | 08010203                                         | no                         |
| Harris Creek                          | 17 km         | 08010204, 08010205                               | no                         |
| Nash Creek                            | 17 km         | 08010204                                         | no                         |
| Halls Creek                           | 17 km         | 08010205                                         | no                         |
| Tuscumbia River                       | 17 km         | 08010207                                         | no                         |
| Big Black Creek                       | 17 km         | 08010208                                         | no                         |
| Hatfield Creek                        | 16 km         | 05130101, 05130104                               | no                         |
| Paint Rock Creek                      | 16 km         | 05130104                                         | no                         |
| Buck Creek                            | 16 km         | 05130104, 05130107, 05130108                     | no                         |
| Ranger Creek                          | 16 km         | 05130107                                         | no                         |
| Saunders Fork                         | 16 km         | 05130108                                         | no                         |
| Sulphur Creek                         | 16 km         | 05130202, 05130204                               | no                         |
| Mansker Creek                         | 16 km         | 05130202                                         | yes (03426387, 4.97 sq mi) |
| Town Branch                           | 16 km         | 05130204, 05130205                               | no                         |
| South Cross Creek                     | 16 km         | 05130205                                         | no                         |
| Guices Creek                          | 16 km         | 05130205                                         | no                         |
| Robinson Creek                        | 16 km         | 06010102, 06010106, 06010108                     | no                         |
| Cobb Creek                            | 16 km         | 06010103                                         | no                         |
| Patterson Branch                      | 16 km         | 06010104, 06010107                               | no                         |
| Roseberry Creek                       | 16 km         | 06010104                                         | no                         |
| German Creek                          | 16 km         | 06010104                                         | no                         |
| Wolf Creek                            | 16 km         | 06010105, 06010108                               | no                         |
| Camp Creek                            | 16 km         | 06010108                                         | no                         |
| Sandy Creek                           | 16 km         | 06010201                                         | no                         |
| First Creek                           | 16 km         | 06010201, 06010204                               | no                         |
| War Creek                             | 16 km         | 06010205                                         | no                         |
| Old Town Creek                        | 16 km         | 06010206                                         | no                         |
| Meadow Creek                          | 16 km         | 06010207, 06010208                               | no                         |
| Brushy Fork                           | 16 km         | 06010207                                         | no                         |
| Little Clear Creek                    | 16 km         | 06010208                                         | no                         |
| McGill Creek                          | 16 km         | 06020001                                         | no                         |
| Sawmill Creek                         | 16 km         | 06020001, 06020004                               | no                         |
| Chicken Creek                         | 16 km         | 06030003, 06030004                               | no                         |
| Robinson Creek                        | 16 km         | 06030003                                         | no                         |
| Coldwater Creek                       | 16 km         | 06030003                                         | no                         |
| Long Branch                           | 16 km         | 06030003, 06030004, 06030005                     | no                         |
| Little Cypress Creek                  | 16 km         | 06030005                                         | no                         |
| Marsh Creek                           | 16 km         | 06040001                                         | no                         |
| Pinhook Branch                        | 16 km         | 06040001, 06040004, 06040005                     | no                         |
| Dog Creek                             | 16 km         | 06040001, 06040003, 06040004                     | no                         |
| Alexander Creek                       | 16 km         | 06040002                                         | no                         |
| Noah Fork                             | 16 km         | 06040002                                         | no                         |
| Caney Creek                           | 16 km         | 06040002                                         | no                         |
| Dog Branch                            | 16 km         | 06040003                                         | no                         |
| East Piney River                      | 16 km         | 06040003                                         | no                         |
| Sulphur Fork                          | 16 km         | 06040003                                         | no                         |
| Walnut Fork Creek                     | 16 km         | 08010202                                         | no                         |
| Bethel Branch                         | 16 km         | 08010204                                         | no                         |
| Tar Creek                             | 16 km         | 08010205                                         | no                         |
| Meridian Creek                        | 16 km         | 08010205                                         | no                         |
| Lost Creek                            | 16 km         | 08010205                                         | no                         |
| Kise Creek                            | 16 km         | 08010207                                         | no                         |
| Mud Creek                             | 15 km         | 05130104, 05130107                               | no                         |
| Rocky Branch                          | 15 km         | 05130105, 05130108                               | no                         |
| Defeated Creek                        | 15 km         | 05130106                                         | no                         |
| Sams Creek                            | 15 km         | 05130202                                         | no                         |
| Murfrees Fork                         | 15 km         | 05130204                                         | no                         |
| Big Elk Creek                         | 15 km         | 05130205                                         | no                         |
| Meadow Creek                          | 15 km         | 06010108                                         | no                         |
| Brown Creek                           | 15 km         | 06010201, 06010207, 06010208                     | no                         |
| Cox Creek                             | 15 km         | 06010201, 06010206, 06010207                     | no                         |
| Richardson Creek                      | 15 km         | 06010205                                         | no                         |
| Big Barren Creek                      | 15 km         | 06010205                                         | no                         |
| No Business Creek                     | 15 km         | 06010208                                         | no                         |
| Little Sewee Creek                    | 15 km         | 06020001                                         | no                         |
| Mullens Creek                         | 15 km         | 06020001                                         | no                         |
| Woodcock Creek                        | 15 km         | 06020004                                         | no                         |
| Dry Branch                            | 15 km         | 06030002, 06030005                               | no                         |
| Butler Creek                          | 15 km         | 06030005                                         | no                         |
| Patterson Branch                      | 15 km         | 06040001, 06040003, 06040004, 06040005           | no                         |
| Weakly Creek                          | 15 km         | 06040002                                         | no                         |
| Muddy Branch                          | 15 km         | 06040002, 06040003                               | no                         |
| Hurricane Branch                      | 15 km         | 06040002, 06040003, 06040004, 06040005           | no                         |
| Greenlick Creek                       | 15 km         | 06040003                                         | no                         |
| West Piney River                      | 15 km         | 06040003                                         | no                         |
| Black Bayou                           | 15 km         | 08010202, 08010211                               | no                         |
| Doakville Creek                       | 15 km         | 08010204                                         | no                         |
| Saulsbury Creek                       | 15 km         | 08010208                                         | no                         |
| Marys Creek                           | 15 km         | 08010210                                         | no                         |

## Context-only (<15 km mapped; correctly unselectable) — 6867 rivers, 32648 km total

Summarized, not enumerated: these are the headwater and tributary segments the zoom map
shows for orientation. They stay as-is unless a specific fishery reason emerges (TWRA
stocking site on them — cross-check the stocking overlay — or a management plan).

## Already selectable (network name matches a catalog water) — 147 rivers

These render as tappable catalog water; their network geometry is redundant context that
the catalog corridor covers. No action.

> Cross-reference: `docs/GAUGE-CATALOG-GAPS.md` (gauge-based view of the same question,
> with drainage areas) and the 17-water add worklist (atlas coverage gaps). The SHOULD list
> above + those two = the statewide authoring queue. Every addition needs the wave-ledger
> sourcing treatment before it ships.
