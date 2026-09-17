# TWRA STOCKING SCHEDULE — program calendar decision boxes (report-only)

Generated 2026-09-17 from the official TWRA schedule workbook
(`026.xlsx`, 616 rows).
The schedule is the authoritative program CALENDAR (types, month windows, exact dates);
the map feed remains the coverage source. Nothing here is applied to the catalog.

## Summary

| Metric | Count |
|---|---|
| Catalog waters with a resolved schedule program | 67 |
| …with pinned month windows | 5 |
| …with exact stocking dates (recency!) | 16 |
| Calendar gaps (schedule months ≠ catalog seasonMonths) | 2 |
| stockingProgram flags replaceable from the schedule | 67 |
| Schedule locations with no catalog water (candidate adds) | 66 (of 285 rows) |

## Program types, in plain English

- **Winter** — cold-month put-and-take on a water too warm for trout most of the year. The water stays warmwater; trout are seasonal visitors.
- **Seasonal** — the scheduled trout-season program on managed trout water; the water IS trout water, stocked in its season.
- **Tailwater / Weekly** — year-round programs (cold releases / repeated stocking).
- **Delayed Harvest** — fall stocking, catch-and-release through winter, spring harvest.

## Box A — calendar gaps (schedule vs catalog seasonMonths)

- **clinch-river**: schedule [3,4,5,6,7,8,9] (Tailwater) vs catalog [3,4,5,6,7,8]
- **ft-patrick-henry-tailwater**: schedule [3,4,12] (Tailwater) vs catalog [3,4]

## Box B — hand-set stockingProgram flags the schedule can replace

67 waters still carry the deprecated boolean; 67 of them now have a schedule-backed program view.

## Box C — stocked waters missing from the catalog (candidate adds)

<details><summary>66 locations (owner: some are access points for catalog waters; some are true gaps like McKenzie City Park)</summary>

```
McKenzie City Park (Caroll) — Winter
Whiteoak Creek (Houston) — Seasonal
L.L. Burns Park (Cheatham) — Winter
Normandy TW / Duck River (Coffee/Bedford) — Tailwater
Cedar Hill Park Pond (Davidson) — Winter
Marrowbone Lake (Davidson) — Winter
Shelby Bottoms (Davidson) — Winter
Acorn Lake (Montgomery Bell SP) (Dickson) — Delayed Harvest
J.D. Buckner Park (Dickson) — Winter
Cowan City Park (Franklin) — Winter
Tims Ford TW / Elk River (Franklin/Moore) — Tailwater
Mill Creek (Hickman) — Seasonal
Stone Bridge Park (Lincoln) — Winter
Lafayette City Park (Macon) — Winter
Big Rock Greenway (Marshall) — Winter
Billy Dunlop Park (Montgomery) — Winter
Fort Campbell Streams (Montgomery) — Seasonal
Sulphur Fork Creek (Robertson) — Winter
Nice Mill (Rutherford) — Winter
W. Fork Stones River - Manson Pike Trailhead (Rutherford) — Winter
Harpeth River at Eastern Flank Battle Park (Williamson) — Winter
Don Fox Park Community Park (Wilson) — Winter
Dale Hollow Reservoir (Clay) — Reservoir
Cumberland Mountain State Park (Cumberland) — Winter
Center Hill TW / Caney Fork River (DeKalb/Smith) — Tailwater
Grundy Lake #4 / Fiery Gizzard SP (Grundy) — Winter
Dickert Pond / Camp Jordan (Hamilton) — Winter
Lake Junior (Hamilton) — Winter
Pocket Creek (Marion) — Seasonal
Athens City Park Pond (McMinn) — Winter
Green Cove Pond (Monroe) — Seasonal
Flat Fork Creek (Morgan) — Seasonal
Pickett Lake (Pickett) — Seasonal
Apalachia TW / Hiwassee River* (Polk) — Delayed Harvest
McKamy Lake (Polk) — Seasonal
Calfkiller River (Putnam) — Seasonal
Cane Creek Park (Putnam) — Winter
Coops Creek (Sequatchie) — Seasonal
Laurel Creek (Van Buren) — Seasonal
N Barren Fork Creek (Warren) — Seasonal
Pistol Creek/Greenbelt Lake (Blount) — Winter
Calderwood Reservoir (Blount/Monroe) — Reservoir
Chilhowee Reservoir (Blount/Monroe) — Reservoir
Laurel Fork (Campbell) — Seasonal
Tackett Creek (Campbell) — Seasonal
Stony Creek (Carter) — Seasonal
Wilbur Tailwater / Watauga River (Carter/Washington) — Tailwater
Dillard Ponds (Greene) — Seasonal
Panther Creek (Hamblen) — Seasonal
Mantooth Pond (Hancock) — Seasonal
Alexander Creek (Hawkins) — Seasonal
Big Creek (Hawkins) — Seasonal
Cherokee TW / Holston River (Jefferson/Grainger) — Tailwater
Goose Creek / Town Creek (Johnson) — Seasonal
Ralph Stout Park Pond (Johnson) — Winter
Fountain City Lake (Knox) — Winter
Oneida City Park Lake (Scott) — Winter
Gatlinburg Streams (Sevier) — Delayed Harvest
Mid. Prong Little Pigeon River (Sevier) — Seasonal
W. Prong Little Pigeon R. (Pigeon Forge) (Sevier) — Seasonal
Boone TW / S. Fork Holston River (Sullivan/Washington) — Tailwater
Clark Creek (Unicoi) — Seasonal
Fishery Park Pond (Unicoi) — Seasonal
North Indian Creek (Unicoi) — Seasonal
Rocky Fork (Unicoi) — Seasonal
South Indian Creek (Unicoi) — Seasonal
```
</details>

Machine-readable: `docs\research\2026-09-17-classification-diff/schedule-report.json`.
