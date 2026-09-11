# Reference waterbody inventory

This is the judgment pass for `Tennessee-Lakes-Rivers-Map.jpg`. The machine-readable source of truth is [`waterbody-inventory.json`](./waterbody-inventory.json). It contains 29 distinct named waterbodies from the reference plus the 13 explicitly requested `twra-winter-ponds` point-to-polygon upgrades.

## How the reference was resolved

- Repeated labels are one feature. The Tennessee River appears in both East and West Tennessee and receives one ID.
- Abbreviations are normalized (`R` → `River`, `L` → `Lake`, `S Holston` → `South Holston`). Display-name punctuation does not leak into IDs.
- The isolated `R` in the south-central corridor belongs to the Duck River line and is not a new feature.
- The partially rendered `River` at the Center Hill outlet is resolved to Caney Fork River from its location. This is the only medium-confidence name judgment; its existing catalog and geometry corroborate the location.
- `wolf-river-fentress`, `little-buffalo-river`, and `south-fork-cumberland` are different waters from the West Tennessee Wolf River, Buffalo River, and main Cumberland River. They are not aliases.
- Existing managed reaches remain distinct where the product already distinguishes them. The reference's Duck and Elk labels map to `duck-river-lower` and `elk-river`; tailwater/lower-reach siblings are not duplicated.

Cross-check columns below are `S` = `public/v1/streams.json`, `Y` = `packages/content/streams/tn/*.yaml`, `R` = interactive `rivers.geojson`, and `L` = passive `lakes.geojson`.

## Named reference waters

| Normalized waterbody | Type  | County / region                          | Approximate location                      | Stable feature ID           | S/Y/R/L | Geometry verdict |
| -------------------- | ----- | ---------------------------------------- | ----------------------------------------- | --------------------------- | ------- | ---------------- |
| Mississippi River    | river | West boundary; Shelby–Lake counties      | western state line, −90.05 / 35.40        | `mississippi-river`         | –/–/–/– | missing-line     |
| Obion River          | river | Northwest; Obion, Dyer, Lake             | northwestern river, −89.15 / 36.20        | `obion-river`               | –/–/–/– | missing-line     |
| Hatchie River        | river | West; Hardeman–Lauderdale                | Hatchie corridor, −89.15 / 35.55          | `hatchie-river`             | –/–/–/– | missing-line     |
| Wolf River           | river | Southwest; Fayette, Shelby               | Memphis corridor, −89.75 / 35.10          | `wolf-river-west-tennessee` | –/–/–/– | missing-line     |
| Tennessee River      | river | Chattanooga-to-Kentucky Lake corridor    | statewide main stem, −87.95 / 35.60       | `tennessee-river`           | –/–/–/– | missing-line     |
| Cumberland River     | river | Middle/Northwest; Davidson–Stewart       | Nashville to Lake Barkley, −87.05 / 36.20 | `cumberland-river`          | –/–/–/– | missing-line     |
| Duck River           | river | South-central/West; Bedford–Humphreys    | lower Duck, −86.4740 / 35.4754            | `duck-river-lower`          | ✓/✓/✓/– | fragmented       |
| Buffalo River        | river | West Middle; Lewis, Perry, Humphreys     | Duck tributary, −87.65 / 35.55            | `buffalo-river`             | –/–/–/– | missing-line     |
| Caney Fork River     | river | Middle; DeKalb, Smith                    | Center Hill outlet, −85.7264 / 35.9783    | `caney-fork-river`          | ✓/✓/✓/– | fragmented       |
| Elk River            | river | South Middle; Franklin, Lincoln, Giles   | Tims Ford tailwater, −86.7640 / 35.1001   | `elk-river`                 | ✓/✓/✓/– | fragmented       |
| Sequatchie River     | river | Sequatchie Valley                        | headwater anchor, −85.0178 / 35.7655      | `sequatchie-river`          | ✓/✓/✓/– | fragmented       |
| Hiwassee River       | river | Southeast; Polk–Meigs                    | Reliance corridor, −84.4479 / 35.1897     | `hiwassee-river`            | ✓/✓/✓/– | fragmented       |
| Clinch River         | river | East; Anderson, Campbell, Knox           | Norris tailwater, −84.0702 / 36.2321      | `clinch-river`              | ✓/✓/✓/– | fragmented       |
| Holston River        | river | Northeast/East; Hawkins–Knox             | main stem, −83.35 / 36.20                 | `holston-river`             | –/–/–/– | missing-line     |
| Lake Barkley         | lake  | Northwest Middle; Stewart, Montgomery    | −87.8972 / 36.5674                        | `lake-barkley`              | –/–/–/✓ | exists-ok        |
| Kentucky Lake        | lake  | West; Hardin–Stewart                     | −87.9442 / 36.1258                        | `kentucky-lake`             | –/–/–/✓ | exists-ok        |
| Old Hickory Lake     | lake  | Middle; Davidson–Trousdale               | −86.6340 / 36.2621                        | `old-hickory-lake`          | –/–/–/✓ | exists-ok        |
| J. Percy Priest Lake | lake  | Middle; Davidson, Rutherford, Wilson     | −86.5786 / 36.1083                        | `j-percy-priest-lake`       | –/–/–/✓ | exists-ok        |
| Tims Ford Lake       | lake  | South Middle; Franklin, Moore            | −86.1926 / 35.2280                        | `tims-ford-lake`            | –/–/–/✓ | exists-ok        |
| Pickwick Lake        | lake  | Southwest; Hardin                        | Pickwick Landing, −88.25 / 35.05          | `pickwick-lake`             | –/–/–/– | missing-polygon  |
| Center Hill Lake     | lake  | Middle; DeKalb–Warren                    | −85.8124 / 36.0451                        | `center-hill-lake`          | –/–/–/✓ | exists-ok        |
| Dale Hollow Lake     | lake  | Upper Cumberland; Clay, Pickett, Overton | −85.3784 / 36.5727                        | `dale-hollow-lake`          | –/–/–/✓ | exists-ok        |
| Watts Bar Lake       | lake  | East; Roane–Loudon                       | −84.6151 / 35.8110                        | `watts-bar-lake`            | –/–/–/✓ | exists-ok        |
| Chickamauga Lake     | lake  | Southeast; Hamilton–Rhea                 | −84.9350 / 35.4110                        | `chickamauga-lake`          | –/–/–/✓ | exists-ok        |
| Norris Lake          | lake  | East; Anderson–Union                     | −83.9242 / 36.2748                        | `norris-lake`               | –/–/–/✓ | exists-ok        |
| Fort Loudoun Lake    | lake  | East; Knox, Blount, Loudon               | −84.0599 / 35.8485                        | `fort-loudoun-lake`         | –/–/–/✓ | exists-ok        |
| Cherokee Lake        | lake  | East; Grainger–Jefferson                 | −83.3249 / 36.3000                        | `cherokee-lake`             | –/–/–/✓ | exists-ok        |
| Douglas Lake         | lake  | East; Cocke–Hamblen                      | −83.3564 / 36.0121                        | `douglas-lake`              | –/–/–/✓ | exists-ok        |
| South Holston Lake   | lake  | Northeast; Sullivan / Virginia           | −82.0576 / 36.5242                        | `south-holston-lake`        | –/–/–/✓ | exists-ok        |

## Required in-place point upgrades

These are not labels in the supplied reference image. They are included because the implementation brief explicitly requires every current `twra-winter-ponds` anchor to become a polygon without changing its ID.

| Waterbody                             | Type | County / locality    | Existing ID                | Current geometry | Required verdict |
| ------------------------------------- | ---- | -------------------- | -------------------------- | ---------------- | ---------------- |
| Shelby Farms Lake                     | lake | Memphis, Shelby      | `shelby-farms-lake`        | Point            | missing-polygon  |
| Cameron Brown Lake                    | lake | Germantown, Shelby   | `cameron-brown-lake`       | Point            | missing-polygon  |
| Edmund-Orgill Park Lake               | lake | Millington, Shelby   | `edmund-orgill-lake`       | Point            | missing-polygon  |
| Yale Road Park Lake                   | lake | Bartlett, Shelby     | `yale-road-park-lake`      | Point            | missing-polygon  |
| Johnson Park Lake                     | lake | Memphis, Shelby      | `johnson-park-lake`        | Point            | missing-polygon  |
| Valentine Park Pond                   | pond | Munford, Tipton      | `valentine-park-pond`      | Point            | missing-polygon  |
| Covington First Baptist Church Pond   | pond | Covington, Tipton    | `covington-fbc-pond`       | Point            | missing-polygon  |
| Martin City Pond                      | pond | Martin, Weakley      | `martin-city-pond`         | Point            | missing-polygon  |
| Milan City Pond                       | pond | Milan, Gibson        | `milan-city-pond`          | Point            | missing-polygon  |
| Paris City Park Lake                  | lake | Paris, Henry         | `paris-city-park-lake`     | Point            | missing-polygon  |
| Beech Lake                            | lake | Lexington, Henderson | `beech-lake`               | Point            | missing-polygon  |
| Lake Graham                           | lake | Jackson, Madison     | `lake-graham`              | Point            | missing-polygon  |
| Union City Reelfoot Packing Site Pond | pond | Union City, Obion    | `union-city-reelfoot-pond` | Point            | missing-polygon  |

All 13 rows already match the stream JSON, one YAML record, and one Point feature in `rivers.geojson`. They must be geometry replacements, never additions with new IDs.

## Inventory verdict

- 14 reference lake polygons exist as passive context geometry.
- 6 catalog rivers exist only as shorter managed reaches than the reference depicts.
- 8 named main-stem rivers have no canonical catalog line.
- Pickwick Lake has no polygon; Kentucky Lake must not be stretched or aliased to cover it.
- 13 cataloged West Tennessee still waters remain point placeholders pending polygon delivery.
- No item is `UNRESOLVED`. Caney Fork is medium-confidence only at the label-reading step, and its location/catalog match resolves the actual waterbody confidently.

`exists-ok` means geometry exists, not that the feature is already interactive. A passive lake still needs a canonical catalog row and promotion into the interactive atlas source under the geometry contract.
