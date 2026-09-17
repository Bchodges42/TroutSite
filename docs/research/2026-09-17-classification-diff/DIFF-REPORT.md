# CLASSIFICATION DIFF — tiered sourcing decision boxes (report-only)

Generated 2026-09-17 by `packages/content/scripts/classification/pipeline.mjs`.
**Nothing here has been applied to the catalog.** Every box needs owner approval.
Tiers: T1 = stocking feed + USGS facts (automatic) · T2 = official pages for contested calls · T3 = public corroboration. Owner-ruled verdicts are protected and never re-proposed.

## Summary

| Metric | Count |
|---|---|
| Feed rows (points) | 725 |
| Deduped stocking events | 177 |
| Events resolved to a catalog water | 99 (82 waters) |
| Ambiguous joins (QUEUED — multiple same-named waters) | 5 |
| Unmatched events (site not in catalog) | 73 |
| Waters with computed stockedTrout view | 82 |
| …of which window unpinned (Tailwater/Reservoir — T2) | 6 |
| Species proposals (unset waters, T1-only evidence) | 0 |
| stockingProgram flags queued for deprecation | 102 |
| Season windows: events vs audited ledger | 49 |

## Box 1 — species proposals (T1 events, water currently unset)

_none_

## Box 2 — deprecate the hand-set `stockingProgram` flag

The flag is a bare boolean on 102 waters. Ruling: stocking events are the data; the flag is replaced by the computed stockedTrout view. Waters with NO matching T1 events are flagged T2-needed (verify before removing their flag).

<details><summary>All 102 flagged waters</summary>

```
barren-fork-river — T1
beaverdam-creek — T1
beech-lake — T1
big-rock-creek — T1
big-soddy-creek — T1
boiling-fork-creek — T1
boone-tailwater — T1
brush-creek-cocke — T1
buffalo-creek-grainger — T1
calderwood-lake — T2-needed
calfkiller-river — T1
cameron-brown-lake — T2-needed
cane-creek-hickman-perry — T1
cane-creek — T1
caney-fork-river — T1
charles-creek — T1
chilhowee-lake — T2-needed
citico-creek — T1
clinch-river — T2-needed
collins-river — T1
cosby-creek — T1
covington-fbc-pond — T2-needed
dale-hollow-lake — T2-needed
doe-creek-johnson — T1
doe-river — T1
duck-river-tailwater — T2-needed
east-fork-shoal-creek — T1
edmund-orgill-lake — T2-needed
elk-river-lower — T1
elk-river — T2-needed
fletchers-fork — T1
forge-creek-johnson — T1
fort-patrick-henry-lake — T2-needed
ft-patrick-henry-tailwater — T1
gap-creek-claiborne — T1
goforth-creek — T1
greasy-creek-polk — T1
gulf-fork-big-creek — T1
harpeth-river — T1
hiwassee-river — T1
holston-river — T2-needed
horse-creek-greene — T1
hurricane-creek — T1
indian-creek-claiborne — T1
johnson-park-lake — T2-needed
lake-graham — T1
laurel-creek-johnson — T1
laurel-fork-carter — T1
leconte-creek — T1
little-buffalo-river — T1
little-pigeon-river — T2-needed
little-river — T1
little-sequatchie-river — T1
little-tennessee-river — T2-needed
little-west-fork-creek — T1
martin-city-pond — T2-needed
mccutcheon-creek — T1
middle-prong-little-pigeon — T1
milan-city-pond — T2-needed
mill-creek-overton — T1
mossy-creek-jefferson — T1
north-chickamauga-creek — T1
north-prong-barren-fork — T1
obey-river — T1
paint-creek-greene — T1
paris-city-park-lake — T1
parksville-tailwater — T1
pine-creek-dekalb — T1
piney-river-rhea — T1
puncheon-camp-creek — T1
richardson-byrd-creek — T1
roaring-fork — T1
rocky-river — T1
salt-lick-creek — T1
sequatchie-river — T1
shelby-farms-lake — T1
shoal-creek — T1
sinking-creek-wilson — T1
south-holston-lake — T2-needed
south-holston-river — T1
spring-creek-polk — T1
standing-rock-creek — T1
station-creek — T1
stones-river — T1
stoney-creek-carter — T1
sulfur-fork-creek — T1
tellico-lake — T2-needed
tellico-river — T1
trail-fork-big-creek — T1
tumbling-creek — T1
union-city-reelfoot-pond — T1
upper-hills-creek — T1
upper-roan-creek — T1
valentine-park-pond — T2-needed
watauga-lake — T2-needed
watauga-river — T2-needed
west-fork-stones-river — T1
west-prong-little-pigeon — T1
white-oak-creek — T1
wilbur-lake — T2-needed
wolf-river-fentress — T1
yale-road-park-lake — T1
```
</details>

## Box 3 — season windows: T1 events vs audited ledger

- **beaverdam-creek**: events [3,4,5] vs ledger [3,6] (catalog null)
- **beech-lake**: events [1,2,12] vs ledger [1,2] (catalog [11,12,1,2,3])
- **buffalo-creek-grainger**: events [3,4,5] vs ledger [1,10] (catalog [12,1,2])
- **calfkiller-river**: events [3,4,5] vs ledger [9] (catalog null)
- **cane-creek**: events [3,4,5] vs ledger [2,3,4,5,10] (catalog null)
- **charles-creek**: events [3,4,5] vs ledger [3,5] (catalog null)
- **citico-creek**: events [3,4,5] vs ledger [2,7,11] (catalog null)
- **collins-river**: events [3,4,5] vs ledger [4] (catalog null)
- **doe-creek-johnson**: events [3,4,5] vs ledger [3,5] (catalog [12,1,2])
- **doe-river**: events [3,4,5] vs ledger [3,6,10] (catalog [12,1,2])
- **east-fork-shoal-creek**: events [3,4,5] vs ledger [2,3,5] (catalog [12,1,2])
- **elk-river-lower**: events [1,2,12] vs ledger [3,4,5,6,7,8,9,10,11,12] (catalog null)
- **fletchers-fork**: events [3,4,5] vs ledger [2,4,5,6,7,8] (catalog [12,1,2])
- **forge-creek-johnson**: events [3,4,5] vs ledger [3,5] (catalog [12,1,2])
- **gap-creek-claiborne**: events [3,4,5] vs ledger [2,3,4] (catalog null)
- **goforth-creek**: events [3,4,5] vs ledger [5] (catalog [12,1,2])
- **harpeth-river**: events [1,2,12] vs ledger [11] (catalog [12,1,2])
- **horse-creek-greene**: events [3,4,5] vs ledger [3,6] (catalog null)
- **hurricane-creek**: events [3,4,5] vs ledger [2,3] (catalog [12,1,2])
- **indian-creek-claiborne**: events [3,4,5] vs ledger [2,4] (catalog [12,1,2])
- **lake-graham**: events [1,2,12] vs ledger [5] (catalog [11,12,1,2,3])
- **laurel-creek-johnson**: events [3,4,5] vs ledger [3,6] (catalog [12,1,2])
- **laurel-fork-carter**: events [3,4,5] vs ledger [3,6] (catalog null)
- **little-buffalo-river**: events [3,4,5] vs ledger [3,5] (catalog [12,1,2])
- **little-river**: events [3,4,5] vs ledger [2,3,4,5,10,11] (catalog null)
- **little-sequatchie-river**: events [3,4,5] vs ledger [3,5] (catalog [12,1,2])
- **little-west-fork-creek**: events [3,4,5] vs ledger [2,4,5,6,7,8] (catalog [12,1,2])
- **mccutcheon-creek**: events [1,2,12] vs ledger [1,2,11,12] (catalog [12,1,2])
- **mill-creek-overton**: events [3,4,5] vs ledger [3,4] (catalog null)
- **mossy-creek-jefferson**: events [1,2,12] vs ledger [1,11,12] (catalog [12,1,2])
- **north-chickamauga-creek**: events [3,4,5] vs ledger [2,3,4,11] (catalog null)
- **north-prong-barren-fork**: events [3,4,5] vs ledger [3,4] (catalog [12,1,2])
- **paris-city-park-lake**: events [1,2,12] vs ledger [1,12] (catalog [11,12,1,2,3])
- **parksville-tailwater**: events [3,4,5] vs ledger [3,4,5,6,7,8,9,10,11,12] (catalog [3,4,5])
- **pine-creek-dekalb**: events [3,4,5] vs ledger [2,3] (catalog null)
- **richardson-byrd-creek**: events [3,4,5] vs ledger [2,3,4] (catalog [12,1,2])
- **salt-lick-creek**: events [3,4,5] vs ledger [1,3] (catalog [12,1,2])
- **standing-rock-creek**: events [3,4,5] vs ledger [2,3] (catalog [12,1,2])
- **station-creek**: events [3,4,5] vs ledger [2,3,4] (catalog [12,1,2])
- **stones-river**: events [1,2,12] vs ledger [1,2,3,12] (catalog [12,1,2,3])
- **sulfur-fork-creek**: events [1,2,12] vs ledger [2,12] (catalog [12,1,2])
- **tellico-river**: events [3,4,5] vs ledger [9] (catalog null)
- **tumbling-creek**: events [3,4,5] vs ledger [3,4] (catalog [12,1,2])
- **union-city-reelfoot-pond**: events [1,2,12] vs ledger [1,2,3,11,12] (catalog [11,12,1,2,3])
- **upper-hills-creek**: events [3,4,5] vs ledger [3] (catalog [12,1,2])
- **upper-roan-creek**: events [3,4,5] vs ledger [3,6] (catalog [12,1,2])
- **west-fork-stones-river**: events [1,2,12] vs ledger [1,2,3,12] (catalog [12,1,2,3])
- **white-oak-creek**: events [3,4,5] vs ledger [2,3,4] (catalog [12,1,2])
- **wolf-river-fentress**: events [3,4,5] vs ledger [2,3,4,5,6,7,8,9,10] (catalog null)

## Box 4 — ambiguous name joins (queued, never guessed)

- **Mill Creek** (Hickman Co, Spring) → candidates: mill-creek-overton
- **** (Campbell Co, Spring) → candidates: laurel-fork-carter
- **Bone Cave Rd. Bridge Crossing (S1)** (Vanburen Co, Spring) → candidates: laurel-creek-johnson
- **Dement Bridge** (Bedford Co, Tailwater) → candidates: duck-river-lower, duck-river-mouth, duck-river-tailwater
- **Long Branch Recreation Area** (Dekalb Co, Tailwater) → candidates: caney-fork-river, caney-fork-upper

## Box 5 — feed sites with no catalog water (candidate adds / out-of-scope)

<details><summary>73 unmatched sites</summary>

```
Kinzer Pond (Montgomery Co, Spring)
SITE # 1 (Unicoi Co, Spring)
Sandy Bottom S1 (Unicoi Co, Spring)
Small 5 Ton Bridge S1 (Unicoi Co, Spring)
Site # 6 ( Co, Spring)
First Sharp Curve At Gravel Pull Off S1 (Unicoi Co, Spring)
Wilson Rd Bridge S1 (Unicoi Co, Spring)
Alexander Creek #1 (Hawkins Co, Spring)
Big Creek #2 (Hawkins Co, Spring)
 (Campbell Co, Spring)
 (Claiborne Co, Spring)
SITE #11 (Carter Co, Spring)
Pond #1 S1 (Greene Co, Spring)
Pond #2 S2 (Greene Co, Spring)
Panther Creek #6 - End (Hamblen Co, Spring)
Wooden Bridge (S2) (Morgan Co, Spring)
Pickett State Park (Pickett Co, Spring)
Green Cove Pond (Monroe Co, Spring)
 ( Co, Spring)
Chilhowee Recreation Area (Polk Co, Spring)
Hwy 284 Bridge Crossing (Bledsoe Co, Spring)
Walking Trail (Sequatchie Co, Spring)
Fishery Park Pond (Unicoi Co, Spring)
Village Camp Rd. Bridge (Vanburen Co, Spring)
Mantooth Pond (Hancock Co, Spring)
 ( Co, Spring)
 ( Co, Spring)
 ( Co, Spring)
 ( Co, Spring)
Acorn Lake (Dickson Co, Spring)
Goose Creek/ Town Creek (Johnson Co, Spring)
Bridge Creek Rd (Marion Co, Spring)
The George Hole (Vanburen Co, Spring)
 ( Co, Spring)
Shelby Bottoms Park (Davidson Co, Winter)
Marrowbone Lake (Davidson Co, Winter)
J.D. Buckner Park (Dickson Co, Winter)
L.L. Burns Park (Cheatham Co, Winter)
Stone Bridge Park (Lincoln Co, Winter)
Lafayette City Park (Macon Co, Winter)
Oneida City Park (Scott Co, Winter)
Munford City Park (Tipton Co, Winter)
Cameron Brown Park (Shelby Co, Winter)
Wc Johnson Park (Shelby Co, Winter)
Mckenzie City Park (Carroll Co, Winter)
Martin City Park (Weakley Co, Winter)
Edmund-Orgill Park (Shelby Co, Winter)
Davies Plantation Park (Shelby Co, Winter)
Milan City Park (Gibson Co, Winter)
Cane Creek Park (Putnam Co, Winter)
Cumberland Mountain State Park (Cumberland Co, Winter)
Athens Rec. Park (Mcminn Co, Winter)
Lake Junior (Hamilton Co, Winter)
Fountain City Park (Knox Co, Winter)
Greenbelt Lake (Blount Co, Winter)
Pistol Creek (Blount Co, Winter)
Pistol Creek ( Co, Winter)
Camp Jordan Park (Hamilton Co, Winter)
Cedar Hill Park (Davidson Co, Winter)
Ralph Stout Park (Johnson Co, Winter)
Grundy Lake #4 (Grundy Co, Winter)
First Baptist Church Covington (Tipton Co, Winter)
Wilbur Dam (Carter Co, Tailwater)
Nance Ferry (Grainger Co, Tailwater)
Hwy. 92 / Cherokee Dam (Jefferson Co, Tailwater)
Massengill Bridge (Anderson Co, Tailwater)
Siam Bridge (Carter Co, Tailwater)
 (Blount Co, Reservoir)
Lakeshore Marina (Carter Co, Reservoir)
 (Blount Co, Reservoir)
 (Washington Co, Reservoir)
 (Blount Co, Reservoir)
Tellico (upper) ( Co, Reservoir)
```
</details>

## Machine-readable

- `docs\research\2026-09-17-classification-diff/classification-output.json` — per-water derived views (species proposal, stockedTrout, protection flags)
- `docs\research\2026-09-17-classification-diff/resolution.json` — every event → match/ambiguous/unmatched
