# Composite TWRA classification - the 190 catalog waters (2026-09-17)

**Conclusion per water: TWRA's own program class - Spring / Tailwater / Winter / Reservoir** (+ Delayed Harvest / Weekly modifiers), from three sources: the official stocking-schedule workbook (S1, authoritative), the live ArcGIS stocking-sites layer (S2, fresh pull), and the warmwater stockings workbook (S3, context). The Jev system-classifier eval on `feat/jev-system-classification` rides along as the fishery-identity cross-check.

**Distribution:** None (warmwater fishery) 80, Spring 59, Winter 24, Tailwater 14, Reservoir 7, UNRESOLVED 3, Wild (no TWRA stocking program) 3

**Confidence:** conflict 4, high 84, medium 102

**Class logic:** schedule types map Seasonal->Spring, Weekly->Spring (weekly modifier), Tailwater->Tailwater, Winter->Winter, Reservoir->Reservoir; the feed's StockingProgram already uses Spring/Tailwater/Winter/Reservoir. Delayed Harvest / Weekly are recorded as modifiers, never as a Spring disagreement. Primary class precedence Tailwater > Reservoir > Winter > Spring. Schedule alone, or schedule + agreeing feed: high. Feed-only: medium. Feed claims a program the schedule lacks, or Jev contradicts the record: **conflict (owner box)**. Waters TWRA doesn't stock with trout resolve through the Jev identity to 'Wild' (trout-stream system, no stocking program) or 'None (warmwater fishery)'.


## Tailwater (14 waters)

| Water | Program(s) | Season months | S1 schedule | S2 feed | S3 warmwater | Jev | Flags |
|---|---|---|---|---|---|---|---|
| Boone Tailwater (South Fork Holston River) (`boone-tailwater`) | Tailwater | [3, 4, 11, 12] | ['Tailwater'] | ['Tailwater'] (1 pts) | - | trout-yr |  |
| Caney Fork River (Center Hill tailwater) (`caney-fork-river`) | Tailwater | [3, 4, 5, 6, 7, 8, 9, 10, 11, 12] | ['Tailwater'] | ['Tailwater'] (5 pts) | - | trout-yr |  |
| Clinch River (Norris tailwater) (`clinch-river`) | Tailwater | [3, 4, 5, 6, 7, 8, 9] | ['Tailwater'] | ['Tailwater'] (4 pts) | - | trout-yr |  |
| Duck River (Normandy tailwater) (`duck-river-tailwater`) | Tailwater | [1, 2, 3, 11, 12] | ['Tailwater'] | ['Tailwater'] (4 pts) | - | trout-yr |  |
| Elk River (Prospect to state line) (`elk-river-lower`) | Tailwater,Winter | - | - | ['Tailwater', 'Winter'] (3 pts) | - | ww-winter |  |
| Elk River (Tims Ford tailwater) (`elk-river`) | Tailwater | [3, 4, 5, 6, 7, 8, 9, 10, 11, 12] | ['Tailwater'] | - | - | trout-yr |  |
| Fort Patrick Henry Tailwater (South Fork Holston River) (`ft-patrick-henry-tailwater`) | Tailwater | [3, 4, 12] | ['Tailwater'] | ['Tailwater'] (3 pts) | - | trout-yr | sibling-water redirect: sibling-water redirect OUT: 'Ft. Patrick Henry Reservoir' -> fort-patrick-henry-lake: feed 'Ft. Patrick Henry Reservoir' auto-matched the TAILWATER via the 'ft' spelling; the Reservoir-program event belongs to the LAKE |
| Hiwassee River (Appalachia tailwater / Reliance) (`hiwassee-river`) | Tailwater +Delayed Harvest | [2, 3, 4, 5, 6, 7, 8, 10, 11] | ['Tailwater', 'Delayed Harvest'] | ['Tailwater'] (9 pts) | - | trout-yr |  |
| Holston River (`holston-river`) | Spring,Tailwater | [1, 2, 3, 4, 11, 12] | ['Tailwater'] | ['Spring', 'Tailwater'] (6 pts) | - | ww-winter | feed claims program(s) ['Spring'] the official schedule does not (feed points by program: {'Spring': 2, 'Tailwater': 4}) - owner box |
| Obey River (Dale Hollow tailwater) (`obey-river`) | Tailwater | [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] | ['Tailwater'] | ['Tailwater'] (1 pts) | - | trout-yr |  |
| Parksville Lake Tailwater (Ocoee No. 1 reach) (`parksville-tailwater`) | Tailwater | [3, 4, 5] | ['Tailwater'] | ['Tailwater'] (1 pts) | - | trout-yr | sibling-water redirect: sibling-water redirect OUT: 'Parksville Reservoir' -> parksville-lake: feed 'Parksville Reservoir' auto-matched the TAILWATER; the event belongs to the LAKE (Parksville Lake) |
| South Fork Holston River (South Holston tailwater) (`south-holston-river`) | Tailwater | [3, 4, 5, 6, 7, 8, 9] | ['Tailwater'] | ['Tailwater'] (11 pts) | - | trout-yr | sibling-water redirect: sibling-water redirect OUT: 'South Holston Reservoir' -> south-holston-lake: feed 'South Holston Reservoir' (Sullivan Co rows - the reservoir straddles Sullivan/Washington) auto-matched the TAILWATER river slug; belongs to the LAKE |
| Watauga River (Wilbur tailwater) (`watauga-river`) | Tailwater | - | ['Tailwater'] | ['Tailwater'] (12 pts) | - | trout-yr | schedule rows resolved via composite alias: self-describing compound the lane resolver missed: 'Wilbur Tailwater / Watauga River' (Carter/Washington) is the catalog 'Watauga River (Wilbur tailwater)' |
| Wilbur Lake (`wilbur-lake`) | Tailwater | - | - | ['Tailwater'] (3 pts) | - | trout-yr |  |

## Reservoir (7 waters)

| Water | Program(s) | Season months | S1 schedule | S2 feed | S3 warmwater | Jev | Flags |
|---|---|---|---|---|---|---|---|
| Calderwood Lake (`calderwood-lake`) | Reservoir | [11, 12] | ['Reservoir'] | ['Reservoir'] (2 pts) | - | ww-winter |  |
| Chilhowee Lake (`chilhowee-lake`) | Reservoir | [2, 11, 12] | ['Reservoir'] | ['Reservoir'] (4 pts) | ['Walleye'] | ww-winter | dual fishery: trout program AND warmwater stocking events at this water |
| Dale Hollow Lake (`dale-hollow-lake`) | Reservoir | [4] | ['Reservoir'] | ['Reservoir'] (1 pts) | ['Walleye'] | ww-no | Jev category warmwater-no-trout but program evidence ['Reservoir'] exists; dual fishery: trout program AND warmwater stocking events at this water |
| Fort Patrick Henry Lake (`fort-patrick-henry-lake`) | Reservoir | - | - | ['Reservoir'] (2 pts) | - | trout-yr | sibling-water redirect: feed 'Ft. Patrick Henry Reservoir' auto-matched the TAILWATER via the 'ft' spelling; the Reservoir-program event belongs to the LAKE |
| South Holston Lake (`south-holston-lake`) | Reservoir | - | - | ['Reservoir'] (3 pts) | - | ww-no | sibling-water redirect: feed 'South Holston Reservoir' (Sullivan Co rows - the reservoir straddles Sullivan/Washington) auto-matched the TAILWATER river slug; belongs to the LAKE; Jev category warmwater-no-trout but program evidence ['Reservoir'] exists |
| Tellico Lake (`tellico-lake`) | Reservoir | - | - | ['Reservoir'] (3 pts) | ['Walleye'] | ww-winter | dual fishery: trout program AND warmwater stocking events at this water |
| Watauga Lake (`watauga-lake`) | Reservoir | - | - | ['Reservoir'] (4 pts) | ['Walleye'] | ww-winter | dual fishery: trout program AND warmwater stocking events at this water |

## Winter (24 waters)

| Water | Program(s) | Season months | S1 schedule | S2 feed | S3 warmwater | Jev | Flags |
|---|---|---|---|---|---|---|---|
| Beech Lake (`beech-lake`) | Winter | [1, 12] | ['Winter'] | ['Winter'] (1 pts) | - | ww-winter |  |
| Big Rock Creek (`big-rock-creek`) | Winter | - | - | ['Winter'] (1 pts) | - | ww-winter |  |
| Boiling Fork Creek (`boiling-fork-creek`) | Winter | - | - | ['Winter'] (1 pts) | - | ww-winter |  |
| Cameron Brown Lake (`cameron-brown-lake`) | Winter | [1, 12] | ['Winter'] | ['Winter'] (1 pts) | ['Channel Catfish'] | ww-winter | dual fishery: trout program AND warmwater stocking events at this water |
| Covington First Baptist Church Pond (`covington-fbc-pond`) | Winter | [1, 12] | ['Winter'] | ['Winter'] (1 pts) | - | ww-winter |  |
| Cumberland River (`cumberland-river`) | Winter | - | ['Winter'] | - | - | ww-winter | schedule rows resolved via composite alias: lane candidateAdd 'shelby bottoms\|davidson' (access-point-on, medium): the winter program fishes the Cumberland at Shelby Bottoms greenway, Nashville; catalog stockingProgram=false but program evidence ['Winter'] exists |
| Edmund-Orgill Park (`edmund-orgill-lake`) | Winter | [1, 12] | ['Winter'] | ['Winter'] (1 pts) | - | ww-winter |  |
| Harpeth River (Williamson County reaches) (`harpeth-river`) | Winter | [1, 2, 12] | ['Winter'] | ['Winter'] (1 pts) | - | ww-winter |  |
| Johnson Park Lake (`johnson-park-lake`) | Winter | [1, 12] | ['Winter'] | ['Winter'] (1 pts) | - | ww-winter | medium-confidence alias used: wc johnson park lake\|shelby |
| Lake Graham (`lake-graham`) | Winter | [1, 12] | ['Winter'] | ['Winter'] (1 pts) | - | ww-winter |  |
| Martin City Pond (`martin-city-pond`) | Winter | [1, 12] | ['Winter'] | ['Winter'] (1 pts) | - | ww-winter |  |
| McCutcheon Creek (`mccutcheon-creek`) | Winter | [1, 2, 12] | ['Winter'] | ['Winter'] (1 pts) | - | ww-winter |  |
| Milan City Pond (`milan-city-pond`) | Winter | [1, 12] | ['Winter'] | ['Winter'] (1 pts) | - | ww-winter |  |
| Mossy Creek (Jefferson County) (`mossy-creek-jefferson`) | Winter | [1, 11, 12] | ['Winter'] | ['Winter'] (3 pts) | - | ww-winter |  |
| Paris City Park (`paris-city-park-lake`) | Winter | [1, 12] | ['Winter'] | ['Winter'] (1 pts) | - | ww-winter |  |
| Red River (Montgomery County) (`red-river-clarksville`) | Winter | - | - | ['Winter'] (1 pts) | - | ww-winter | catalog stockingProgram=false but program evidence ['Winter'] exists |
| Shelby Farms (`shelby-farms-lake`) | Winter | [1, 12] | ['Winter'] | ['Winter'] (1 pts) | - | ww-winter |  |
| Sinking Creek (Wilson County) (`sinking-creek-wilson`) | Winter | - | - | ['Winter'] (1 pts) | - | ww-winter |  |
| Stones River (Davidson County) (`stones-river`) | Winter | [1, 2, 12] | ['Winter'] | ['Winter'] (1 pts) | - | ww-winter |  |
| Sulfur Fork Creek (`sulfur-fork-creek`) | Winter | - | - | ['Winter'] (2 pts) | - | ww-winter |  |
| Union City Reelfoot Packing Site (`union-city-reelfoot-pond`) | Winter | [1, 12] | ['Winter'] | ['Winter'] (1 pts) | - | ww-winter |  |
| Valentine Park (`valentine-park-pond`) | Winter | [1, 12] | ['Winter'] | - | - | ww-winter |  |
| West Fork Stones River (`west-fork-stones-river`) | Winter | [1, 2, 12] | ['Winter'] | ['Winter'] (2 pts) | - | ww-winter |  |
| Yale Road Park (`yale-road-park-lake`) | Winter | [1, 12] | ['Winter'] | ['Winter'] (1 pts) | - | ww-winter |  |

## Spring (59 waters)

| Water | Program(s) | Season months | S1 schedule | S2 feed | S3 warmwater | Jev | Flags |
|---|---|---|---|---|---|---|---|
| Barren Fork River (`barren-fork-river`) | Spring | [3, 5] | ['Seasonal'] | ['Spring'] (1 pts) | - | trout-yr |  |
| Beaverdam Creek (`beaverdam-creek`) | Spring | [3, 4, 5, 6] | ['Seasonal'] | ['Spring'] (20 pts) | - | trout-yr | low-confidence alias used: goose creek town creek\|johnson |
| Big Soddy Creek (`big-soddy-creek`) | Spring +Delayed Harvest | [2, 3, 4, 10, 11] | ['Delayed Harvest', 'Seasonal'] | ['Spring'] (5 pts) | - | trout-yr |  |
| Brush Creek (Cocke County) (`brush-creek-cocke`) | Spring | [3, 4, 5] | ['Seasonal'] | ['Spring'] (12 pts) | - | trout-yr |  |
| Buffalo Creek (Grainger County) (`buffalo-creek-grainger`) | Spring +Delayed Harvest | [2, 3, 4, 5, 6, 7, 8, 10] | ['Seasonal', 'Delayed Harvest'] | ['Spring'] (7 pts) | - | trout-yr |  |
| Calfkiller River (`calfkiller-river`) | Spring | [3] | ['Seasonal'] | ['Spring'] (1 pts) | - | ww-winter |  |
| Cane Creek (Buffalo River system — Hickman/Perry) (`cane-creek-hickman-perry`) | Spring | [2, 3, 4] | ['Seasonal'] | ['Spring'] (4 pts) | - | trout-yr |  |
| Cane Creek (Caney Fork system — Bledsoe/Van Buren) (`cane-creek`) | Spring | [2, 3, 4, 5, 10] | ['Seasonal'] | ['Spring'] (5 pts) | - | trout-yr | medium-confidence alias used: upper cane creek\|bledsoe; medium-confidence alias used: upper cane creek\|vanburen |
| Charles Creek (`charles-creek`) | Spring | [3, 5] | ['Seasonal'] | ['Spring'] (1 pts) | - | trout-yr |  |
| Citico Creek (`citico-creek`) | Spring | [2, 3, 4, 5, 6, 7] | ['Seasonal'] | ['Spring'] (16 pts) | - | trout-yr |  |
| Collins River (`collins-river`) | Spring | [3, 5] | ['Seasonal'] | ['Spring'] (2 pts) | - | trout-yr |  |
| Cosby Creek (`cosby-creek`) | Spring | [3, 4, 5, 6] | ['Seasonal'] | ['Spring'] (12 pts) | - | trout-yr |  |
| Doe Creek (Johnson County) (`doe-creek-johnson`) | Spring | [3, 4, 5] | ['Seasonal'] | ['Spring'] (11 pts) | - | trout-yr |  |
| Doe River (`doe-river`) | Spring +Delayed Harvest | [3, 4, 5, 6, 10] | ['Seasonal', 'Delayed Harvest'] | ['Spring'] (24 pts) | - | trout-yr |  |
| East Fork Shoal Creek (`east-fork-shoal-creek`) | Spring | [2, 3, 5] | ['Seasonal'] | ['Spring'] (2 pts) | - | trout-yr |  |
| Fletchers Fork (`fletchers-fork`) | Spring | [2, 4, 5, 6, 7, 8] | ['Seasonal'] | ['Spring'] (1 pts) | - | ww-winter |  |
| Forge Creek (Johnson County) (`forge-creek-johnson`) | Spring | [3, 4, 5] | ['Seasonal'] | ['Spring'] (10 pts) | - | trout-yr |  |
| Gap Creek (Claiborne County) (`gap-creek-claiborne`) | Spring | [2, 3, 4] | ['Seasonal'] | ['Spring'] (11 pts) | - | ww-winter |  |
| Goforth Creek (`goforth-creek`) | Spring | [3, 4] | ['Seasonal'] | ['Spring'] (3 pts) | - | trout-yr |  |
| Greasy Creek (Polk County) (`greasy-creek-polk`) | Spring | [3, 4] | ['Seasonal'] | ['Spring'] (4 pts) | - | trout-yr |  |
| Gulf Fork Big Creek (`gulf-fork-big-creek`) | Spring | [2, 3, 4, 5] | ['Seasonal'] | ['Spring'] (7 pts) | - | trout-yr |  |
| Horse Creek (Greene County) (`horse-creek-greene`) | Spring | [3, 4, 5, 6] | ['Seasonal'] | ['Spring'] (17 pts) | - | trout-yr |  |
| Hurricane Creek (`hurricane-creek`) | Spring | [2, 3] | ['Seasonal'] | ['Spring'] (4 pts) | - | ww-winter |  |
| Indian Creek (Claiborne County) (`indian-creek-claiborne`) | Spring | [2, 3, 4] | ['Seasonal'] | ['Spring'] (3 pts) | - | ww-winter |  |
| Laurel Creek (Johnson County) (`laurel-creek-johnson`) | Spring | [3, 4, 5, 6] | ['Seasonal'] | ['Spring'] (12 pts) | - | trout-yr |  |
| Laurel Fork (Carter County) (`laurel-fork-carter`) | Spring | [3, 4, 5, 6] | ['Seasonal'] | ['Spring'] (5 pts) | - | trout-yr |  |
| LeConte Creek (`leconte-creek`) | Spring | - | - | ['Spring'] (1 pts) | - | trout-yr |  |
| Little Buffalo River (`little-buffalo-river`) | Spring | [3, 5] | ['Seasonal'] | ['Spring'] (4 pts) | - | trout-yr |  |
| Little River (Smokies / Blount County) (`little-river`) | Spring | [2, 3, 4, 5, 10, 11] | ['Seasonal'] | ['Spring'] (12 pts) | - | trout-yr |  |
| Little Sequatchie River (`little-sequatchie-river`) | Spring | [3, 5] | ['Seasonal'] | ['Spring'] (1 pts) | - | trout-yr |  |
| Little West Fork Creek (`little-west-fork-creek`) | Spring | - | - | ['Spring'] (4 pts) | - | ww-winter |  |
| Middle Prong Little Pigeon River (Tremont) (`middle-prong-little-pigeon`) | Spring | [2, 3, 4, 5, 10, 11] | ['Seasonal'] | ['Spring'] (15 pts) | - | trout-yr |  |
| Mill Creek (Overton County) (`mill-creek-overton`) | Spring | [3, 4] | ['Seasonal'] | ['Spring'] (3 pts) | - | trout-yr |  |
| North Chickamauga Creek (`north-chickamauga-creek`) | Spring | [2, 3, 4, 11] | ['Seasonal'] | ['Spring'] (1 pts) | - | ww-winter |  |
| North Prong Barren Fork River (`north-prong-barren-fork`) | Spring | - | - | ['Spring'] (1 pts) | - | ww-winter |  |
| Paint Creek (Greene County) (`paint-creek-greene`) | Spring +Delayed Harvest | [3, 4, 5, 6, 10] | ['Seasonal', 'Delayed Harvest'] | ['Spring'] (25 pts) | - | trout-yr |  |
| Parksville Lake (`parksville-lake`) | Spring | - | - | ['Spring'] (2 pts) | ['Walleye'] | ww-no | sibling-water redirect: feed 'Parksville Reservoir' auto-matched the TAILWATER; the event belongs to the LAKE (Parksville Lake); catalog stockingProgram=false but program evidence ['Spring'] exists; Jev category warmwater-no-trout but program evidence ['Spring'] exists; dual fishery: trout program AND warmwater stocking events at this water |
| Pine Creek (DeKalb County) (`pine-creek-dekalb`) | Spring | [2, 3] | ['Seasonal'] | ['Spring'] (2 pts) | - | trout-yr |  |
| Piney River (Rhea County) (`piney-river-rhea`) | Spring +Delayed Harvest | [2, 3, 4, 10] | ['Seasonal', 'Delayed Harvest'] | ['Spring'] (3 pts) | - | trout-yr |  |
| Puncheon Camp Creek (`puncheon-camp-creek`) | Spring | [2, 3, 4] | ['Seasonal'] | ['Spring'] (7 pts) | - | trout-yr |  |
| Reedy Creek (`reedy-creek`) | Spring | - | - | ['Spring'] (1 pts) | - | ww-no | catalog stockingProgram=false but program evidence ['Spring'] exists; Jev category warmwater-no-trout but program evidence ['Spring'] exists |
| Richardson “Byrd” Creek (`richardson-byrd-creek`) | Spring | [2, 3, 4] | ['Seasonal'] | ['Spring'] (8 pts) | - | trout-yr |  |
| Roaring Fork (`roaring-fork`) | Spring | - | - | ['Spring'] (1 pts) | - | trout-yr |  |
| Rocky River (`rocky-river`) | Spring | [3, 4, 5] | ['Seasonal'] | ['Spring'] (1 pts) | - | trout-yr |  |
| Salt Lick Creek (`salt-lick-creek`) | Spring | [3] | ['Seasonal'] | ['Spring'] (2 pts) | - | ww-winter |  |
| Sequatchie River (headwaters) (`sequatchie-river`) | Spring | [3, 5] | ['Seasonal'] | ['Spring'] (4 pts) | - | ww-no | Jev category warmwater-no-trout but program evidence ['Spring'] exists |
| Shoal Creek (`shoal-creek`) | Spring | - | - | ['Spring'] (1 pts) | - | ww-no | Jev category warmwater-no-trout but program evidence ['Spring'] exists |
| Spring Creek (Polk County) (`spring-creek-polk`) | Spring | [2, 3, 4, 11] | ['Seasonal'] | ['Spring'] (6 pts) | - | ww-winter |  |
| Standing Rock Creek (`standing-rock-creek`) | Spring | [2, 3] | ['Seasonal'] | ['Spring'] (1 pts) | - | ww-winter |  |
| Station Creek (`station-creek`) | Spring | [2, 3, 4] | ['Seasonal'] | ['Spring'] (6 pts) | - | trout-yr |  |
| Stoney Creek (Carter County) (`stoney-creek-carter`) | Spring | [3, 4, 5] | ['Seasonal'] | ['Spring'] (24 pts) | - | trout-yr |  |
| Tellico River (`tellico-river`) | Spring +Delayed Harvest | [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] | ['Delayed Harvest', 'Seasonal'] | ['Spring'] (95 pts) | - | trout-yr |  |
| Trail Fork (Big Creek tributary) (`trail-fork-big-creek`) | Spring | [2, 3, 4, 5] | ['Seasonal'] | ['Spring'] (6 pts) | - | trout-yr |  |
| Tumbling Creek (`tumbling-creek`) | Spring | [3, 4] | ['Seasonal'] | ['Spring'] (3 pts) | - | ww-winter |  |
| Upper Hills Creek (`upper-hills-creek`) | Spring | [3] | ['Seasonal'] | ['Spring'] (2 pts) | - | ww-winter |  |
| Upper Roan Creek (`upper-roan-creek`) | Spring | [3, 4, 5, 6] | ['Seasonal'] | ['Spring'] (9 pts) | - | trout-yr |  |
| West Prong Little Pigeon River (`west-prong-little-pigeon`) | Spring +Delayed Harvest,Weekly | [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] | ['Delayed Harvest', 'Weekly', 'Seasonal'] | ['Spring'] (21 pts) | - | trout-yr |  |
| White Oak Creek (`white-oak-creek`) | Spring | - | - | ['Spring'] (1 pts) | - | ww-winter |  |
| Wolf River (Fentress County headwaters) (`wolf-river-fentress`) | Spring | [3, 4, 5] | ['Seasonal'] | ['Spring'] (3 pts) | - | ww-winter |  |

## Wild (no TWRA stocking program) (3 waters)

| Water | Program(s) | Season months | S1 schedule | S2 feed | S3 warmwater | Jev | Flags |
|---|---|---|---|---|---|---|---|
| Powell River (`powell-river`) | Wild (no TWRA stocking program) | - | - | - | - | trout-yr |  |
| South Fork Cumberland River (`south-fork-cumberland`) | Wild (no TWRA stocking program) | - | - | - | - | trout-yr | jev: trout-stream-year-round but every month answered below 0.5 — unusual for a designated trout system; verify evidence |
| Watauga River (Watauga Dam to Wilbur Lake) (`watauga-river-wilbur-reach`) | Wild (no TWRA stocking program) | - | - | - | - | trout-yr |  |

## None (warmwater fishery) (80 waters)

| Water | Program(s) | Season months | S1 schedule | S2 feed | S3 warmwater | Jev | Flags |
|---|---|---|---|---|---|---|---|
| Beech River (`beech-river`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Big Bigby Creek (`big-bigby-creek`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Big Sandy River (`big-sandy-river`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Big Sewee Creek (`big-sewee-creek`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Big Swan Creek (`big-swan-creek`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Blackburn Fork (`blackburn-fork`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Boone Lake (`boone-lake`) | None (warmwater fishery) | - | - | - | ['Striped Bass', 'White Bass X Striped Bass Hybrid'] | ww-no | warmwater stocking events confirm active warmwater program; jev: trout-stream-year-round but every month answered below 0.5 — unusual for a designated trout system; verify evidence |
| Bradley Creek (`bradley-creek`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Brimstone Creek (`brimstone-creek`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Buffalo River (`buffalo-river`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Bullrun Creek (`bullrun-creek`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Candies Creek (`candies-creek`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Caney Fork River (above Center Hill Lake) (`caney-fork-upper`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Center Hill Lake (`center-hill-lake`) | None (warmwater fishery) | - | - | - | ['Walleye'] | ww-no | warmwater stocking events confirm active warmwater program |
| Cherokee Lake (`cherokee-lake`) | None (warmwater fishery) | - | - | - | ['Sauger X Walleye Hybrid', 'Striped Bass', 'Walleye', 'White Bass X Striped Bass Hybrid'] | ww-no | warmwater stocking events confirm active warmwater program |
| Chestuee Creek (`chestuee-creek`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Chickamauga Lake (`chickamauga-lake`) | None (warmwater fishery) | - | - | - | ['Florida Largemouth Bass', 'Striped Bass', 'Walleye'] | ww-no | warmwater stocking events confirm active warmwater program |
| Clear Creek (Obed system) (`clear-creek-obed`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Clear Fork (`clear-fork`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Conasauga River (`conasauga-river`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Crab Orchard Creek (`crab-orchard-creek`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Daddy’s Creek (`daddys-creek`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Douglas Lake (`douglas-lake`) | None (warmwater fishery) | - | - | - | ['Sauger', 'Walleye'] | ww-no | warmwater stocking events confirm active warmwater program |
| Duck River (Columbia to the mouth) (`duck-river-mouth`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Duck River (Shelbyville to Columbia) (`duck-river-lower`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Dumplin Creek (`dumplin-creek`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| East Fork Obey River (`east-fork-obey-river`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Emory River (`emory-river`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Falling Water River (`falling-water-river`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Forked Deer River (`forked-deer-river`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Fort Loudoun Lake (`fort-loudoun-lake`) | None (warmwater fishery) | - | - | - | ['Florida Largemouth Bass'] | ww-no | warmwater stocking events confirm active warmwater program |
| French Broad River (Douglas tailwater) (`french-broad-river`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Great Falls Lake (`great-falls-lake`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Hatchie River (`hatchie-river`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| J. Percy Priest Lake (`j-percy-priest-lake`) | None (warmwater fishery) | - | - | - | ['Striped Bass', 'White Bass X Striped Bass Hybrid'] | ww-no | warmwater stocking events confirm active warmwater program |
| Kentucky Lake (`kentucky-lake`) | None (warmwater fishery) | - | - | - | ['Florida Largemouth Bass', 'Walleye'] | ww-no | warmwater stocking events confirm active warmwater program |
| Lake Barkley (`lake-barkley`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Little Chuckey Creek (`little-chuckey-creek`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Little Harpeth River (`little-harpeth-river`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Little Pigeon River (Sevierville reach) (`little-pigeon-river`) | None (warmwater fishery) | - | - | - | - | ww-no | catalog stockingProgram=true but NO schedule/feed program resolved |
| Loosahatchie River (`loosahatchie-river`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Melton Hill Lake (`melton-hill-lake`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Middle Fork Forked Deer River (`middle-fork-forked-deer-river`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Middle Fork Obion River (`middle-fork-obion-river`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Mississippi River (`mississippi-river`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| New River (`new-river`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Nickajack Lake (`nickajack-lake`) | None (warmwater fishery) | - | - | - | ['Florida Largemouth Bass', 'Walleye'] | ww-no | warmwater stocking events confirm active warmwater program |
| Nolichucky River (`nolichucky-river`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Nonconnah Creek (`nonconnah-creek`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Normandy Lake (`normandy-lake`) | None (warmwater fishery) | - | - | - | ['Walleye'] | ww-no | warmwater stocking events confirm active warmwater program |
| Norris Lake (`norris-lake`) | None (warmwater fishery) | - | - | - | ['Black Crappie', 'Striped Bass', 'Walleye'] | ww-no | warmwater stocking events confirm active warmwater program |
| North Fork Forked Deer River (`north-fork-forked-deer-river`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| North Fork Holston River (`north-fork-holston-river`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| North Fork Obion River (`north-fork-obion-river`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| North Mouse Creek (`north-mouse-creek`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Obed River (`obed-river`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Obion River (`obion-river`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Ocoee Number Three Lake (`ocoee-number-three-lake`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Ocoee River (upper, Copperhill reach) (`ocoee-river`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Old Hickory Lake (`old-hickory-lake`) | None (warmwater fishery) | - | - | - | ['Sauger', 'Striped Bass', 'Walleye'] | ww-no | warmwater stocking events confirm active warmwater program |
| Oostanaula Creek (`oostanaula-creek`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Pickwick Lake (`pickwick-lake`) | None (warmwater fishery) | - | - | - | ['Florida Largemouth Bass'] | ww-no | warmwater stocking events confirm active warmwater program |
| Pigeon River (Hartford corridor) (`pigeon-river`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Piney River (Hickman County) (`piney-river-hickman`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Reelfoot Lake (`reelfoot-lake`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Richland Creek (Maury/Giles Counties) (`richland-creek-maury`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Roaring River (`roaring-river`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Rutherford Fork Obion River (`rutherford-fork-obion-river`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Sale Creek (`sale-creek`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| South Chickamauga Creek (`south-chickamauga-creek`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| South Fork Forked Deer River (`south-fork-forked-deer-river`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| South Fork Obion River (`south-fork-obion-river`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| South Mouse Creek (`south-mouse-creek`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Tennessee River (`tennessee-river`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Tims Ford Lake (`tims-ford-lake`) | None (warmwater fishery) | - | - | - | ['Striped Bass', 'Walleye', 'White Bass X Striped Bass Hybrid'] | ww-no | warmwater stocking events confirm active warmwater program |
| Watts Bar Lake (`watts-bar-lake`) | None (warmwater fishery) | - | - | - | ['Florida Largemouth Bass', 'Striped Bass', 'Walleye'] | ww-no | warmwater stocking events confirm active warmwater program |
| West Fork Obey River (`west-fork-obey-river`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| West Harpeth River (`west-harpeth-river`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Woods Reservoir (`woods-reservoir`) | None (warmwater fishery) | - | - | - | - | ww-no |  |
| Yellow Creek (Houston/Dickson Counties) (`yellow-creek-houston`) | None (warmwater fishery) | - | - | - | - | ww-no |  |

## UNRESOLVED (3 waters)

| Water | Program(s) | Season months | S1 schedule | S2 feed | S3 warmwater | Jev | Flags |
|---|---|---|---|---|---|---|---|
| East Fork Stones River (`east-fork-stones-river`) | UNRESOLVED | - | - | - | - | ww-winter | Jev says recurring winter program but NO schedule/feed record resolved - owner box |
| Little Tennessee River (`little-tennessee-river`) | UNRESOLVED | - | - | - | - | ww-winter | Jev says recurring winter program but NO schedule/feed record resolved - owner box; catalog stockingProgram=true but NO schedule/feed program resolved |
| Wolf River (`wolf-river-west-tennessee`) | UNRESOLVED | - | - | - | - | ww-winter | Jev says recurring winter program but NO schedule/feed record resolved - owner box |

## Coverage gaps (83 stocked waters NOT in the 190)

TWRA stocks these; they have no catalog entry (deduped across the feed and the warmwater workbook). 'Likely queued' = the classification lane's `schedule-location-aliases.json` candidateAdds already covers it; **NEW** gaps are ones only this composite found (warmwater workbook mostly, plus the feed's small waters).

| Stocked water | County | Program | Class / species | Feed pts | Source | Lane queue? |
|---|---|---|---|---|---|---|
| Barren Fork Reservoir | - | warmwater | Channel Catfish | 0 | warmwater_xlsx | **NEW** |
| Bedford Lake | - | warmwater | Channel Catfish | 0 | warmwater_xlsx | **NEW** |
| Bill Dance Lake | - | warmwater | Blue Catfish | 0 | warmwater_xlsx | **NEW** |
| Blue Cat Lake (Williamsport) | - | warmwater | Blue Catfish,Channel Catfish | 0 | warmwater_xlsx | **NEW** |
| Bridgestone/Firestone WMA | - | warmwater | Channel Catfish | 0 | warmwater_xlsx | **NEW** |
| Browns Creek Lake | - | warmwater | Blue Catfish,Bluegill / Coppernose,Channel Catfish,Golden Shiner | 0 | warmwater_xlsx | **NEW** |
| Carroll Lake | - | warmwater | Blue Catfish | 0 | warmwater_xlsx | **NEW** |
| Cheatham | - | warmwater | Sauger,Striped Bass,Walleye | 0 | warmwater_xlsx | **NEW** |
| Clark Creek | UNICOI | Spring | stream | 10 | arcgis | **NEW** |
| Cordell Hull | - | warmwater | Channel Catfish,Striped Bass,Walleye | 0 | warmwater_xlsx | **NEW** |
| Davies Plantation Park Lake | SHELBY | Winter | pond | 1 | arcgis | **NEW** |
| Davy Crockett Lake | - | warmwater | Black Crappie,Blue Catfish,Bluegill,Walleye | 0 | warmwater_xlsx | **NEW** |
| Dillon Pond | - | warmwater | Channel Catfish | 0 | warmwater_xlsx | **NEW** |
| Fall Creek Falls | - | warmwater | Bluegill / Coppernose,Channel Catfish,Golden Shiner | 0 | warmwater_xlsx | **NEW** |
| Flat Fork | - | Spring | stream | 2 | arcgis | **NEW** |
| Garrett Lake | - | warmwater | Blue Catfish | 0 | warmwater_xlsx | **NEW** |
| Gibson Co. Lake | - | warmwater | Black Crappie,Blue Catfish | 0 | warmwater_xlsx | **NEW** |
| Glenn Springs Lake | - | warmwater | Blue Catfish | 0 | warmwater_xlsx | **NEW** |
| Green Cove Pond | MONROE | Spring | pond | 1 | arcgis | **NEW** |
| Hanging Limb Pond | - | warmwater | Channel Catfish | 0 | warmwater_xlsx | **NEW** |
| Herb Parsons Lake | - | warmwater | Bluegill / Coppernose | 0 | warmwater_xlsx | **NEW** |
| Indian Boundary Lake | - | warmwater | Channel Catfish | 0 | warmwater_xlsx | **NEW** |
| Kefauver Park Lake | - | warmwater | Channel Catfish | 0 | warmwater_xlsx | **NEW** |
| Kinzer Pond | MONTGOMERY | Spring | stream | 1 | arcgis | **NEW** |
| Lake Halford | - | warmwater | Blue Catfish,Bluegill / Coppernose,Channel Catfish,Threadfin Shad | 0 | warmwater_xlsx | **NEW** |
| Lakesite Pond | - | warmwater | Channel Catfish | 0 | warmwater_xlsx | **NEW** |
| Laurel Hill Lake | - | warmwater | Blue Catfish,Channel Catfish | 0 | warmwater_xlsx | **NEW** |
| Livingston City Lake | - | warmwater | Channel Catfish | 0 | warmwater_xlsx | **NEW** |
| Maples Creek Lake | - | warmwater | Blue Catfish | 0 | warmwater_xlsx | **NEW** |
| McKamey Lake | - | warmwater | Channel Catfish,Largemouth Bass | 0 | warmwater_xlsx | **NEW** |
| Meadow Park Lake | - | warmwater | Channel Catfish | 0 | warmwater_xlsx | **NEW** |
| N Indian Creek | UNICOI | Spring | stream | 21 | arcgis | **NEW** |
| New City Lake | DICKSON | Winter | pond | 1 | arcgis | **NEW** |
| Ooltewah Youth Association Pond | - | warmwater | Channel Catfish | 0 | warmwater_xlsx | **NEW** |
| Parkers Branch | - | warmwater | Blue Catfish | 0 | warmwater_xlsx | **NEW** |
| Pea Ridge WMA Pond | - | warmwater | Channel Catfish | 0 | warmwater_xlsx | **NEW** |
| Pickett Lake | PICKETT | Spring | reservoir | 1 | arcgis | **NEW** |
| Pickett State Park | - | warmwater | Channel Catfish,Grass Carp | 0 | warmwater_xlsx | **NEW** |
| Pin Oak Lake | - | warmwater | Threadfin Shad | 0 | warmwater_xlsx | **NEW** |
| Rocky Fork | UNICOI | Spring | stream | 8 | arcgis | **NEW** |
| S Indian Creek | UNICOI | Spring | stream | 22 | arcgis | **NEW** |
| Sevier Lake | DAVIDSON | Winter | pond | 1 | arcgis | **NEW** |
| Shellcracker Lake (Williamsport) | - | warmwater | Channel Catfish | 0 | warmwater_xlsx | **NEW** |
| Spivey Creek | UNICOI | Spring | stream | 8 | arcgis | **NEW** |
| The George Hole | VANBUREN | Spring | pond | 1 | arcgis | **NEW** |
| VFW Lake | - | warmwater | Blue Catfish,Channel Catfish | 0 | warmwater_xlsx | **NEW** |
| Whippoorwill Lake (Williamsport) | - | warmwater | Blue Catfish,Channel Catfish | 0 | warmwater_xlsx | **NEW** |
| Whiteville Lake | - | warmwater | Blue Catfish | 0 | warmwater_xlsx | **NEW** |
| Acorn Lake | DICKSON | Spring | pond | 1 | arcgis | likely: acorn lake (montgomery bell sp)|dickson |
| Alexander Creek | HAWKINS | Spring | stream | 8 | arcgis | likely: alexander creek|hawkins |
| Athens Rec. Park Lake | MCMINN | Winter | pond | 1 | arcgis | likely: athens city park pond|mcminn |
| Athens Regional Park Pond | - | warmwater | Channel Catfish | 0 | warmwater_xlsx | likely: athens city park pond|mcminn |
| Big Creek | HAWKINS | Spring | stream | 4 | arcgis | likely: big creek|hawkins |
| Byrd Lake | CUMBERLAND | Winter | pond | 1 | arcgis | likely: cumberland mountain state park|cumberland (the park's Byrd Lake) |
| Cane Creek Lake | PUTNAM | Winter | pond | 1 | arcgis | likely: cane creek park|putnam |
| Cedar Hill Park Pond | DAVIDSON | Winter | pond | 1 | arcgis | likely: cedar hill park pond|davidson |
| Coops Creek | SEQUATCHIE | Spring | stream | 4 | arcgis | likely: coops creek|sequatchie |
| Dickert Pond | - | warmwater | Channel Catfish | 0 | warmwater_xlsx | likely: dickert pond / camp jordan|hamilton |
| Dillard Ponds (Horse Creek) | GREENE | Spring | pond,stream | 4 | arcgis | likely: dillard ponds|greene |
| Fishery Park Pond | UNICOI | Spring | pond | 1 | arcgis | likely: fishery park pond|unicoi |
| Flat Fork Creek | MORGAN | Spring | stream | 1 | arcgis | likely: sulphur fork creek|robertson |
| Fountain City Park | KNOX | Winter | pond | 1 | arcgis | likely: fountain city lake|knox |
| Grundy Lakes | Grundy | Winter | pond | 1 | arcgis | likely: grundy lake #4 / fiery gizzard sp|grundy |
| Grundy Lakes State Park | - | warmwater | Channel Catfish | 0 | warmwater_xlsx | likely: grundy lake #4 / fiery gizzard sp|grundy |
| Jack Dickert Pond | HAMILTON | Winter | pond | 1 | arcgis | likely: dickert pond / camp jordan|hamilton |
| L.L. Burns Park Pond | CHEATHAM | Winter | pond | 1 | arcgis | likely: ll. burns park|cheatham |
| Lafayette City Park Lake | MACON | Winter | pond | 1 | arcgis | likely: lafayette city park|macon |
| Lake Junior | HAMILTON | Winter,warmwater | pond | 1 | arcgis,warmwater_xlsx | likely: lake junior|hamilton |
| Laurel Creek | VANBUREN | Spring | stream | 1 | arcgis | likely: laurel creek|van buren |
| Laurel Fork | CAMPBELL | Spring | stream | 1 | arcgis | likely: laurel fork|campbell |
| Mantooth Pond | HANCOCK | Spring | pond | 1 | arcgis | likely: mantooth pond|hancock |
| Marrowbone Lake | DAVIDSON | Winter,warmwater | pond | 1 | arcgis,warmwater_xlsx | likely: marrowbone lake|davidson |
| Mccamy Lake | POLK | Spring | pond | 1 | arcgis | likely: mckamy lake|polk (spelling variant McCamy/McKamy) |
| Mckenzie City Park Lake | CARROLL | Winter | pond | 1 | arcgis | likely: mckenzie city park|carroll |
| Mill Creek | HICKMAN | Spring | stream | 1 | arcgis | likely: mill creek|hickman |
| Mundford City Park Pond | TIPTON | Winter | pond | 1 | arcgis | likely: NONE - likely 'Munford City Park Pond' (Tipton Co), lane has no entry |
| Oneida City Park Lake | SCOTT | Winter | pond | 1 | arcgis | likely: oneida city park lake|scott |
| Panther Creek | HAMBLEN | Spring | stream | 6 | arcgis | likely: panther creek|hamblen |
| Pistol Creek | BLOUNT | Winter | pond,stream | 8 | arcgis | likely: pistol creek/greenbelt lake|blount |
| Pocket Creek | MARION | Spring |  | 1 | arcgis | likely: pocket creek|marion |
| Ralph Stout Park | JOHNSON | Winter | pond | 1 | arcgis | likely: ralph stout park pond|johnson |
| Stone Bridge Park Pond | LINCOLN | Winter | pond | 1 | arcgis | likely: stone bridge park|lincoln |
| Tackett Creek | CAMPBELL/CLAIBORNE | Spring | stream | 7 | arcgis | likely: tackett creek|campbell |

## Owner boxes (4 unresolved conflicts)

- **East Fork Stones River** (`east-fork-stones-river`): Jev says recurring winter program but NO schedule/feed record resolved - owner box
- **Holston River** (`holston-river`): feed claims program(s) ['Spring'] the official schedule does not (feed points by program: {'Spring': 2, 'Tailwater': 4}) - owner box
- **Little Tennessee River** (`little-tennessee-river`): Jev says recurring winter program but NO schedule/feed record resolved - owner box; catalog stockingProgram=true but NO schedule/feed program resolved
- **Wolf River** (`wolf-river-west-tennessee`): Jev says recurring winter program but NO schedule/feed record resolved - owner box
