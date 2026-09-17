# TWRA STOCKING SCHEDULE — program calendar decision boxes (report-only)

Generated 2026-09-17 from the official TWRA schedule workbook
(`026.xlsx`, 616 rows).
The schedule is the authoritative program CALENDAR (types, month windows, exact dates);
the map feed remains the coverage source. Nothing here is applied to the catalog.

## Summary

| Metric | Count |
|---|---|
| Catalog waters with a resolved schedule program | 83 |
| …with pinned month windows | 83 |
| …with exact stocking dates (recency!) | 19 |
| Calendar gaps (schedule months ≠ catalog seasonMonths) | 44 |
| stockingProgram flags replaceable from the schedule | 83 |
| Schedule locations with no catalog water (candidate adds) | 47 (of 176 rows) |

## Program types, in plain English

- **Winter** — cold-month put-and-take on a water too warm for trout most of the year. The water stays warmwater; trout are seasonal visitors.
- **Seasonal** — the scheduled trout-season program on managed trout water; the water IS trout water, stocked in its season.
- **Tailwater / Weekly** — year-round programs (cold releases / repeated stocking).
- **Delayed Harvest** — fall stocking, catch-and-release through winter, spring harvest.

## Box A — calendar gaps (schedule vs catalog seasonMonths)

- **beech-lake**: schedule [1,12] (Winter) vs catalog [11,12,1,2,3]
- **boone-tailwater**: schedule [3,4,11,12] (Tailwater) vs catalog [12,3,4]
- **brush-creek-cocke**: schedule [3,4,5] (Seasonal) vs catalog [12,1,2]
- **buffalo-creek-grainger**: schedule [2,3,4,5,6,7,8,10] (Seasonal/Delayed Harvest) vs catalog [12,1,2]
- **cameron-brown-lake**: schedule [1,12] (Winter) vs catalog [11,12,1,2,3]
- **clinch-river**: schedule [3,4,5,6,7,8,9] (Tailwater) vs catalog [3,4,5,6,7,8]
- **covington-fbc-pond**: schedule [1,12] (Winter) vs catalog [11,12,1,2,3]
- **doe-creek-johnson**: schedule [3,4,5] (Seasonal) vs catalog [12,1,2]
- **doe-river**: schedule [3,4,5,6,10] (Seasonal/Delayed Harvest) vs catalog [12,1,2]
- **duck-river-tailwater**: schedule [1,2,3,11,12] (Tailwater) vs catalog [11,12,1,2,3,4,5,6]
- **east-fork-shoal-creek**: schedule [2,3,5] (Seasonal) vs catalog [12,1,2]
- **edmund-orgill-lake**: schedule [1,12] (Winter) vs catalog [11,12,1,2,3]
- **fletchers-fork**: schedule [2,4,5,6,7,8] (Seasonal) vs catalog [12,1,2]
- **forge-creek-johnson**: schedule [3,4,5] (Seasonal) vs catalog [12,1,2]
- **ft-patrick-henry-tailwater**: schedule [3,4,12] (Tailwater) vs catalog [3,4]
- **goforth-creek**: schedule [3,4] (Seasonal) vs catalog [12,1,2]
- **greasy-creek-polk**: schedule [3,4] (Seasonal) vs catalog [12,1,2]
- **hiwassee-river**: schedule [2,3,4,5,6,7,8,10,11] (Tailwater/Delayed Harvest) vs catalog [10,11,12,1,2,3,4,5,6,7]
- **hurricane-creek**: schedule [2,3] (Seasonal) vs catalog [12,1,2]
- **indian-creek-claiborne**: schedule [2,3,4] (Seasonal) vs catalog [12,1,2]
- **johnson-park-lake**: schedule [1,12] (Winter) vs catalog [11,12,1,2,3]
- **lake-graham**: schedule [1,12] (Winter) vs catalog [11,12,1,2,3]
- **laurel-creek-johnson**: schedule [3,4,5,6] (Seasonal) vs catalog [12,1,2]
- **little-buffalo-river**: schedule [3,5] (Seasonal) vs catalog [12,1,2]
- **little-sequatchie-river**: schedule [3,5] (Seasonal) vs catalog [12,1,2]
- **martin-city-pond**: schedule [1,12] (Winter) vs catalog [11,12,1,2,3]
- **milan-city-pond**: schedule [1,12] (Winter) vs catalog [11,12,1,2,3]
- **mossy-creek-jefferson**: schedule [1,11,12] (Winter) vs catalog [12,1,2]
- **paris-city-park-lake**: schedule [1,12] (Winter) vs catalog [11,12,1,2,3]
- **puncheon-camp-creek**: schedule [2,3,4] (Seasonal) vs catalog [12,1,2]
- **richardson-byrd-creek**: schedule [2,3,4] (Seasonal) vs catalog [12,1,2]
- **salt-lick-creek**: schedule [3] (Seasonal) vs catalog [12,1,2]
- **shelby-farms-lake**: schedule [1,12] (Winter) vs catalog [11,12,1,2,3]
- **spring-creek-polk**: schedule [2,3,4,11] (Seasonal) vs catalog [12,1,2]
- **standing-rock-creek**: schedule [2,3] (Seasonal) vs catalog [12,1,2]
- **station-creek**: schedule [2,3,4] (Seasonal) vs catalog [12,1,2]
- **stones-river**: schedule [1,2,12] (Winter) vs catalog [12,1,2,3]
- **tumbling-creek**: schedule [3,4] (Seasonal) vs catalog [12,1,2]
- **union-city-reelfoot-pond**: schedule [1,12] (Winter) vs catalog [11,12,1,2,3]
- **upper-hills-creek**: schedule [3] (Seasonal) vs catalog [12,1,2]
- **upper-roan-creek**: schedule [3,4,5,6] (Seasonal) vs catalog [12,1,2]
- **valentine-park-pond**: schedule [1,12] (Winter) vs catalog [11,12,1,2,3]
- **west-fork-stones-river**: schedule [1,2,12] (Winter) vs catalog [12,1,2,3]
- **yale-road-park-lake**: schedule [1,12] (Winter) vs catalog [11,12,1,2,3]

## Box B — hand-set stockingProgram flags the schedule can replace

83 waters still carry the deprecated boolean; 83 of them now have a schedule-backed program view.

## Box C — stocked waters missing from the catalog (candidate adds)

<details><summary>47 locations (owner: some are access points for catalog waters; some are true gaps like McKenzie City Park)</summary>

```
McKenzie City Park (Caroll) — Winter
Whiteoak Creek (Houston) — Seasonal
L.L. Burns Park (Cheatham) — Winter
Cedar Hill Park Pond (Davidson) — Winter
Marrowbone Lake (Davidson) — Winter
Shelby Bottoms (Davidson) — Winter
Acorn Lake (Montgomery Bell SP) (Dickson) — Delayed Harvest
J.D. Buckner Park (Dickson) — Winter
Cowan City Park (Franklin) — Winter
Mill Creek (Hickman) — Seasonal
Stone Bridge Park (Lincoln) — Winter
Lafayette City Park (Macon) — Winter
Big Rock Greenway (Marshall) — Winter
Billy Dunlop Park (Montgomery) — Winter
Sulphur Fork Creek (Robertson) — Winter
Don Fox Park Community Park (Wilson) — Winter
Cumberland Mountain State Park (Cumberland) — Winter
Grundy Lake #4 / Fiery Gizzard SP (Grundy) — Winter
Dickert Pond / Camp Jordan (Hamilton) — Winter
Lake Junior (Hamilton) — Winter
Pocket Creek (Marion) — Seasonal
Athens City Park Pond (McMinn) — Winter
Green Cove Pond (Monroe) — Seasonal
Flat Fork Creek (Morgan) — Seasonal
Pickett Lake (Pickett) — Seasonal
McKamy Lake (Polk) — Seasonal
Cane Creek Park (Putnam) — Winter
Coops Creek (Sequatchie) — Seasonal
Laurel Creek (Van Buren) — Seasonal
N Barren Fork Creek (Warren) — Seasonal
Pistol Creek/Greenbelt Lake (Blount) — Winter
Laurel Fork (Campbell) — Seasonal
Tackett Creek (Campbell) — Seasonal
Wilbur Tailwater / Watauga River (Carter/Washington) — Tailwater
Dillard Ponds (Greene) — Seasonal
Panther Creek (Hamblen) — Seasonal
Mantooth Pond (Hancock) — Seasonal
Alexander Creek (Hawkins) — Seasonal
Big Creek (Hawkins) — Seasonal
Ralph Stout Park Pond (Johnson) — Winter
Fountain City Lake (Knox) — Winter
Oneida City Park Lake (Scott) — Winter
Clark Creek (Unicoi) — Seasonal
Fishery Park Pond (Unicoi) — Seasonal
North Indian Creek (Unicoi) — Seasonal
Rocky Fork (Unicoi) — Seasonal
South Indian Creek (Unicoi) — Seasonal
```
</details>

Machine-readable: `docs\research\2026-09-17-classification-diff/schedule-report.json`.
