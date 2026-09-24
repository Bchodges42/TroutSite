# Catalog changes — 190 opportunity blocks authored

Every catalog YAML in `packages/content/streams/tn/` gained an `opportunity:` block (ADR 0010) authored from the adjudicated ledger. 190 files changed; 13 also received a `yearRound` consistency correction with an in-file reason line. No IDs, geometries, names, or gauge wiring were touched.

## The block shape (example: boone-tailwater)

```yaml
opportunity:
  trout: year-round-trout
  evidenceState: documented
  statement: >-
    TWRA's 2026 trout forecast calls the Boone Tailwater Tennessee's smallest
    year-round trout-fishing tailwater...
  reachScope: >-
    South Fork Holston River below Boone Dam (Boone Tailwater), Sullivan County...
  asOf: '2026'
  sources:
    - label: TWRA trout forecast — Boone Tailwater (n-Q2FuhI)
      url: https://www.arcgis.com/sharing/rest/content/items/dbb92bdf718f4fd7839bf4b08fb82747/data?f=json
      kind: agency-assessment
      observationPeriod: March 2026 electrofishing
      retrieved: '2026-09-22'
  caveats:
    - >-
      Published stocking calendars disagree (schedule Mar/Apr/Nov+Dec · static
      page Mar/Apr/Dec · forecast Mar/Apr/Jun+Dec) — check the latest report.
```

## yearRound consistency corrections (13, applied with in-file reason lines)

- buffalo-creek-grainger (yearRound → false, headline Seasonal stocked)
- calderwood-lake (yearRound → true, headline Year-round trout)
- chilhowee-lake (yearRound → true, headline Year-round trout)
- cosby-creek (yearRound → true, headline Year-round trout)
- duck-river-tailwater (yearRound → false, headline Seasonal stocked)
- fort-patrick-henry-lake (yearRound → true, headline Year-round trout)
- holston-river (yearRound → true, headline Year-round trout)
- little-river (yearRound → true, headline Year-round trout)
- middle-prong-little-pigeon (yearRound → true, headline Year-round trout)
- paint-creek-greene (yearRound → true, headline Year-round trout)
- piney-river-rhea (yearRound → false, headline Seasonal stocked)
- tellico-lake (yearRound → true, headline Year-round trout)
- watauga-lake (yearRound → true, headline Year-round trout)

## Per-water matrix (190 waters)


### creek (78)

| Water | Headline | Evidence | Scope | Field fix |
|---|---|---|---|---|
| beaverdam-creek | Year-round trout | Documented | reach-scoped | — |
| big-bigby-creek | Unresolved | Unresolved | whole feature | — |
| big-rock-creek | Seasonal stocked | Documented | reach-scoped | — |
| big-sewee-creek | Unresolved | Unresolved | whole feature | — |
| big-soddy-creek | Seasonal stocked | Documented | whole feature | — |
| big-swan-creek | Unresolved | Unresolved | whole feature | — |
| boiling-fork-creek | Seasonal stocked | Documented | reach-scoped | — |
| bradley-creek | Unresolved | Unresolved | whole feature | — |
| brimstone-creek | Unresolved | Unresolved | whole feature | — |
| brush-creek-cocke | Seasonal stocked | Documented | whole feature | — |
| buffalo-creek-grainger | Seasonal stocked | Documented | reach-scoped | yearRound → false |
| bullrun-creek | Unresolved | Unresolved | whole feature | — |
| candies-creek | Unresolved | Unresolved | whole feature | — |
| cane-creek | Seasonal stocked | Documented | whole feature | — |
| cane-creek-hickman-perry | Seasonal stocked | Documented | whole feature | — |
| charles-creek | Seasonal stocked | Documented | whole feature | — |
| chestuee-creek | Unresolved | Unresolved | whole feature | — |
| citico-creek | Seasonal stocked | Documented | reach-scoped | — |
| clear-creek-obed | Warmwater focus | Documented | reach-scoped | — |
| clear-fork | Unresolved | Unresolved | whole feature | — |
| cosby-creek | Year-round trout | Documented | reach-scoped | yearRound → true |
| crab-orchard-creek | Unresolved | Unresolved | whole feature | — |
| daddys-creek | Warmwater focus | Documented | reach-scoped | — |
| doe-creek-johnson | Seasonal stocked | Documented | whole feature | — |
| doe-river | Year-round trout | Documented | reach-scoped | — |
| dumplin-creek | Unresolved | Unresolved | whole feature | — |
| east-fork-shoal-creek | Seasonal stocked | Documented | reach-scoped | — |
| fletchers-fork | Seasonal stocked | Documented | whole feature | — |
| forge-creek-johnson | Seasonal stocked | Documented | whole feature | — |
| gap-creek-claiborne | Seasonal stocked | Documented | whole feature | — |
| goforth-creek | Seasonal stocked | Documented | whole feature | — |
| greasy-creek-polk | Seasonal stocked | Documented | whole feature | — |
| gulf-fork-big-creek | Seasonal stocked | Documented | reach-scoped | — |
| horse-creek-greene | Seasonal stocked | Documented | reach-scoped | — |
| hurricane-creek | Seasonal stocked | Documented | reach-scoped | — |
| indian-creek-claiborne | Seasonal stocked | Documented | whole feature | — |
| laurel-creek-johnson | Seasonal stocked | Documented | whole feature | — |
| laurel-fork-carter | Year-round trout | Documented | reach-scoped | — |
| leconte-creek | Year-round trout | Documented | reach-scoped | — |
| little-buffalo-river | Seasonal stocked | Documented | reach-scoped | — |
| little-chuckey-creek | Unresolved | Unresolved | whole feature | — |
| little-river | Year-round trout | Documented | reach-scoped | yearRound → true |
| little-sequatchie-river | Seasonal stocked | Documented | reach-scoped | — |
| little-west-fork-creek | Seasonal stocked | Documented | reach-scoped | — |
| mccutcheon-creek | Mixed fishery | Documented | reach-scoped | — |
| middle-prong-little-pigeon | Year-round trout | Documented | reach-scoped | yearRound → true |
| mill-creek-overton | Seasonal stocked | Documented | reach-scoped | — |
| mossy-creek-jefferson | Mixed fishery | Documented | reach-scoped | — |
| nonconnah-creek | Unresolved | Unresolved | whole feature | — |
| north-chickamauga-creek | Mixed fishery | Documented | reach-scoped | — |
| north-mouse-creek | Unresolved | Unresolved | whole feature | — |
| north-prong-barren-fork | Seasonal stocked | Limited | reach-scoped | — |
| oostanaula-creek | Unresolved | Unresolved | whole feature | — |
| paint-creek-greene | Year-round trout | Documented | reach-scoped | yearRound → true |
| pine-creek-dekalb | Seasonal stocked | Documented | reach-scoped | — |
| puncheon-camp-creek | Seasonal stocked | Documented | reach-scoped | — |
| reedy-creek | Unresolved | Unresolved | whole feature | — |
| richardson-byrd-creek | Seasonal stocked | Documented | reach-scoped | — |
| richland-creek-maury | Unresolved | Unresolved | whole feature | — |
| roaring-fork | Year-round trout | Documented | reach-scoped | — |
| rocky-river | Seasonal stocked | Documented | reach-scoped | — |
| sale-creek | Unresolved | Unresolved | whole feature | — |
| salt-lick-creek | Seasonal stocked | Documented | reach-scoped | — |
| south-chickamauga-creek | Unresolved | Unresolved | whole feature | — |
| south-mouse-creek | Unresolved | Unresolved | whole feature | — |
| spring-creek-polk | Seasonal stocked | Documented | reach-scoped | — |
| standing-rock-creek | Seasonal stocked | Documented | reach-scoped | — |
| station-creek | Seasonal stocked | Documented | reach-scoped | — |
| stoney-creek-carter | Seasonal stocked | Documented | reach-scoped | — |
| sulfur-fork-creek | Seasonal stocked | Documented | reach-scoped | — |
| trail-fork-big-creek | Seasonal stocked | Documented | reach-scoped | — |
| tumbling-creek | Seasonal stocked | Documented | reach-scoped | — |
| upper-hills-creek | Seasonal stocked | Documented | reach-scoped | — |
| upper-roan-creek | Seasonal stocked | Documented | reach-scoped | — |
| west-prong-little-pigeon | Year-round trout | Documented | reach-scoped | — |
| white-oak-creek | Seasonal stocked | Documented | reach-scoped | — |
| wolf-river-fentress | Mixed fishery | Documented | reach-scoped | — |
| yellow-creek-houston | Unresolved | Unresolved | whole feature | — |

### lake (38)

| Water | Headline | Evidence | Scope | Field fix |
|---|---|---|---|---|
| beech-lake | Seasonal stocked | Documented | whole feature | — |
| boone-lake | Warmwater focus | Documented | reach-scoped | — |
| calderwood-lake | Year-round trout | Documented | reach-scoped | yearRound → true |
| cameron-brown-lake | Seasonal stocked | Documented | whole feature | — |
| center-hill-lake | Warmwater focus | Documented | reach-scoped | — |
| cherokee-lake | Warmwater focus | Documented | reach-scoped | — |
| chickamauga-lake | Warmwater focus | Documented | reach-scoped | — |
| chilhowee-lake | Year-round trout | Documented | reach-scoped | yearRound → true |
| dale-hollow-lake | Year-round trout | Documented | reach-scoped | — |
| douglas-lake | Warmwater focus | Documented | reach-scoped | — |
| edmund-orgill-lake | Seasonal stocked | Documented | whole feature | — |
| fort-loudoun-lake | Warmwater focus | Documented | reach-scoped | — |
| fort-patrick-henry-lake | Year-round trout | Limited | reach-scoped | yearRound → true |
| great-falls-lake | Warmwater focus | Documented | reach-scoped | — |
| j-percy-priest-lake | Warmwater focus | Documented | reach-scoped | — |
| johnson-park-lake | Seasonal stocked | Documented | whole feature | — |
| kentucky-lake | Warmwater focus | Documented | reach-scoped | — |
| lake-barkley | Warmwater focus | Documented | reach-scoped | — |
| lake-graham | Mixed fishery | Documented | whole feature | — |
| melton-hill-lake | Warmwater focus | Documented | reach-scoped | — |
| nickajack-lake | Warmwater focus | Documented | whole feature | — |
| normandy-lake | Warmwater focus | Documented | reach-scoped | — |
| norris-lake | Warmwater focus | Documented | reach-scoped | — |
| ocoee-number-three-lake | Unresolved | Unresolved | whole feature | — |
| old-hickory-lake | Warmwater focus | Documented | whole feature | — |
| paris-city-park-lake | Unresolved | Limited | whole feature | — |
| parksville-lake | Year-round trout | Documented | reach-scoped | — |
| pickwick-lake | Warmwater focus | Documented | whole feature | — |
| reelfoot-lake | Warmwater focus | Documented | whole feature | — |
| shelby-farms-lake | Mixed fishery | Documented | reach-scoped | — |
| south-holston-lake | Year-round trout | Documented | reach-scoped | — |
| tellico-lake | Year-round trout | Documented | reach-scoped | yearRound → true |
| tims-ford-lake | Warmwater focus | Documented | reach-scoped | — |
| watauga-lake | Year-round trout | Documented | reach-scoped | yearRound → true |
| watts-bar-lake | Warmwater focus | Documented | whole feature | — |
| wilbur-lake | Seasonal stocked | Documented | reach-scoped | — |
| woods-reservoir | Warmwater focus | Documented | whole feature | — |
| yale-road-park-lake | Mixed fishery | Documented | reach-scoped | — |

### pond (5)

| Water | Headline | Evidence | Scope | Field fix |
|---|---|---|---|---|
| covington-fbc-pond | Seasonal stocked | Documented | whole feature | — |
| martin-city-pond | Mixed fishery | Documented | whole feature | — |
| milan-city-pond | Mixed fishery | Documented | whole feature | — |
| union-city-reelfoot-pond | Mixed fishery | Documented | reach-scoped | — |
| valentine-park-pond | Mixed fishery | Documented | reach-scoped | — |

### river (56)

| Water | Headline | Evidence | Scope | Field fix |
|---|---|---|---|---|
| barren-fork-river | Seasonal stocked | Documented | whole feature | — |
| beech-river | Unresolved | Unresolved | whole feature | — |
| big-sandy-river | Warmwater focus | Limited | reach-scoped | — |
| blackburn-fork | Warmwater focus | Documented | whole feature | — |
| buffalo-river | Warmwater focus | Documented | whole feature | — |
| calfkiller-river | Seasonal stocked | Documented | whole feature | — |
| caney-fork-upper | Warmwater focus | Documented | reach-scoped | — |
| collins-river | Seasonal stocked | Documented | whole feature | — |
| conasauga-river | Warmwater focus | Documented | reach-scoped | — |
| cumberland-river | Warmwater focus | Documented | reach-scoped | — |
| duck-river-lower | Warmwater focus | Documented | reach-scoped | — |
| duck-river-mouth | Warmwater focus | Documented | reach-scoped | — |
| east-fork-obey-river | Warmwater focus | Documented | reach-scoped | — |
| east-fork-stones-river | Unresolved | Conflicting | whole feature | — |
| elk-river-lower | Unresolved | Unresolved | reach-scoped | — |
| emory-river | Warmwater focus | Documented | reach-scoped | — |
| falling-water-river | Warmwater focus | Limited | reach-scoped | — |
| forked-deer-river | Warmwater focus | Limited | reach-scoped | — |
| harpeth-river | Seasonal stocked | Documented | reach-scoped | — |
| hatchie-river | Warmwater focus | Documented | reach-scoped | — |
| holston-river | Year-round trout | Documented | reach-scoped | yearRound → true |
| little-harpeth-river | Unresolved | Unresolved | whole feature | — |
| little-pigeon-river | Warmwater focus | Documented | reach-scoped | — |
| little-tennessee-river | Seasonal stocked | Documented | reach-scoped | — |
| loosahatchie-river | Warmwater focus | Limited | whole feature | — |
| middle-fork-forked-deer-river | Warmwater focus | Limited | whole feature | — |
| middle-fork-obion-river | Warmwater focus | Limited | whole feature | — |
| mississippi-river | Warmwater focus | Limited | reach-scoped | — |
| new-river | Unresolved | Unresolved | whole feature | — |
| nolichucky-river | Warmwater focus | Limited | reach-scoped | — |
| north-fork-forked-deer-river | Warmwater focus | Limited | whole feature | — |
| north-fork-holston-river | Warmwater focus | Documented | reach-scoped | — |
| north-fork-obion-river | Warmwater focus | Limited | whole feature | — |
| obed-river | Warmwater focus | Documented | reach-scoped | — |
| obion-river | Warmwater focus | Documented | reach-scoped | — |
| ocoee-river | Unresolved | Unresolved | whole feature | — |
| pigeon-river | Warmwater focus | Documented | reach-scoped | — |
| piney-river-hickman | Unresolved | Unresolved | whole feature | — |
| piney-river-rhea | Seasonal stocked | Documented | reach-scoped | yearRound → false |
| powell-river | Warmwater focus | Documented | reach-scoped | — |
| red-river-clarksville | Seasonal stocked | Documented | reach-scoped | — |
| roaring-river | Warmwater focus | Limited | whole feature | — |
| rutherford-fork-obion-river | Warmwater focus | Limited | whole feature | — |
| sequatchie-river | Seasonal stocked | Documented | reach-scoped | — |
| shoal-creek | Unresolved | Conflicting | whole feature | — |
| south-fork-cumberland | Unresolved | Conflicting | reach-scoped | — |
| south-fork-forked-deer-river | Warmwater focus | Limited | whole feature | — |
| south-fork-obion-river | Warmwater focus | Limited | whole feature | — |
| stones-river | Mixed fishery | Documented | reach-scoped | — |
| tellico-river | Year-round trout | Documented | reach-scoped | — |
| tennessee-river | Warmwater focus | Documented | reach-scoped | — |
| watauga-river-wilbur-reach | Unresolved | Unresolved | reach-scoped | — |
| west-fork-obey-river | Unresolved | Unresolved | whole feature | — |
| west-fork-stones-river | Mixed fishery | Documented | reach-scoped | — |
| west-harpeth-river | Unresolved | Unresolved | whole feature | — |
| wolf-river-west-tennessee | Warmwater focus | Documented | reach-scoped | — |

### spring (1)

| Water | Headline | Evidence | Scope | Field fix |
|---|---|---|---|---|
| sinking-creek-wilson | Seasonal stocked | Documented | reach-scoped | — |

### tailrace (12)

| Water | Headline | Evidence | Scope | Field fix |
|---|---|---|---|---|
| boone-tailwater | Year-round trout | Documented | reach-scoped | — |
| caney-fork-river | Year-round trout | Documented | reach-scoped | — |
| clinch-river | Year-round trout | Documented | reach-scoped | — |
| duck-river-tailwater | Seasonal stocked | Documented | reach-scoped | yearRound → false |
| elk-river | Year-round trout | Documented | reach-scoped | — |
| french-broad-river | Warmwater focus | Documented | reach-scoped | — |
| ft-patrick-henry-tailwater | Year-round trout | Documented | reach-scoped | — |
| hiwassee-river | Year-round trout | Documented | reach-scoped | — |
| obey-river | Year-round trout | Documented | reach-scoped | — |
| parksville-tailwater | Seasonal stocked | Limited | reach-scoped | — |
| south-holston-river | Year-round trout | Documented | reach-scoped | — |
| watauga-river | Year-round trout | Documented | reach-scoped | — |
