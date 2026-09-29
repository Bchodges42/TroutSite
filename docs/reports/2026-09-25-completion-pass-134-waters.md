# Completion pass — the remaining 134 ledger waters — 2026-09-25

Internal research only. Nothing has been applied to the ledger, catalog, or product; every recommendation below is owner-input. This closes the evidence sweep begun with the nine-water pass (2026-09-24) and the 47-water low-confidence pass (2026-09-24): **all 190 ledger waters now have a deep evidence pass with a per-water research log.**

## Scope and method

- **Set:** the 134 `documented`-state waters not covered by the two earlier passes (190 − 9 nine-water − 47 low-confidence).
- **Method:** 48 research agents in 8 waves (solo for the six crown-jewel year-round tailwaters; pairs/triples/quads grouped by drainage elsewhere; five lanes each — agency datasets, academic/museum, occurrence repositories, local/community, historical/physical), plus the same standards used throughout: broad method-documented full-list surveys omitting trout = weighted negative evidence; schedules ≠ completed releases ≠ holdover; single catches = leads (one-catch rule); regulatory labels ≠ presence; reach and same-name discipline enforced per water.
- **Verification:** month-by-month stocking calendars were rebuilt from 21–24 annual TWRA schedule grids per water where possible (2003–2025 archived PDFs decoded by PDF-glyph coordinates — `pdftotext -layout` columns are provably unreliable), the live 616-row 2026 schedule JSON, the TWRA ArcGIS layers (`TWRA_Trout_Stocking_Locations`, `Tailwater_Trout`, youth events, the 2016 historical copy), and completed-release feeds (committed 2024-06-07 archive + the live Sept-2026 window). Agent source texts and PDFs are preserved under `docs/research/completion-20260925/` (131 per-water logs; a few supporting notes).
- **Environment notes:** tn.gov TLS-blocks plain curl (browser-context fetching required); the 2021–25 `Trout-Stocking-Schedule-Complete.pdf` Wayback captures are byte-identical replays of the 2020 file (md5 everything); 2016–17 schedule grids were never archived (a bounded gap on ~30 waters); tailwater rows are excluded from the small-stream schedule grids by program scope.

## The year-round test results (28 `year-round-trout` waters)

**Year-round SURVIVES (16)** — each with the surviving basis stated:
- *Continuous stocking:* **obey-river** (the only Jan–Dec row statewide; completions documented in every season incl. midwinter, 2017–2026); **tellico-river** (Feb–Dec planned 2026, only January dark; DH reach Oct–Feb).
- *Agency-documented holdover/reproduction (stocking window shorter than 12 months):* **south-holston-river** (natural reproduction entirely supports the brown fishery; Mar–Sep stocking; sanctuary closures Nov–Jan); **watauga-river** (plan-level Nov–Dec + Aug–Oct brood stockings 2020+; wild browns/rainbows; zero >21 °C days); **clinch-river** (annual Feb/Mar carry-over electrofishing, winter creel share ~20%; window corrects to Mar–Sep); **caney-fork-river** (Mar–Dec stocking; agency "year-round fishing" statement; winter holdovers; no natural reproduction); **elk-river/Tims Ford TW** (TWRA "24-7-365" statement; brown holdover; one December stocking at Old Dam Ford); **west-prong-little-pigeon**, **leconte-creek**, **roaring-fork** (the Gatlinburg city-reach complex: "Gatlinburg Streams" = 52 weekly rows covering all 12 months 2025–2026; the city trout farm has stocked weekly since 1981; reach = park-boundary downstream only).
- *Winter-stocked two-story reservoirs with agency year-round statements + cold refugia:* **dale-hollow-lake**, **south-holston-lake**, **watauga-lake**, **parksville-lake**, **calderwood-lake**, **chilhowee-lake** (all six on the TMP nine-reservoir list; TWRA's live page states these reservoirs are stocked "to provide year-round trout fishing opportunities"; Parksville's absence from the weekly schedule is a variable-date artifact — the live GIS layer still lists "Parksville Reservoir (Ocoee Lake #1)", Spring, 3,000 rainbow; Calderwood's program is FERC-funded at $10k/yr with NCWRC spring co-stocking).

**Year-round FAILS (12)** — downgrade to seasonal with corrected months:
- **hiwassee-river** → seasonal **Oct–Jul** (September dark in every schedule year; holdover agency-quantified as lowest of any TN tailwater; GIS row stale vs the 2026 plan).
- **holston-river (Cherokee TW)** → seasonal **Nov–Apr** (summer thermal bottleneck agency-documented: "no fish should be stocked during July through October"; managed put-and-take).
- **boone-tailwater** → seasonal **Mar/Apr/Dec** (the GIS January is a stale 2018–21 handbill line; 2026 JSON adds November).
- **ft-patrick-henry-tailwater** → seasonal **Mar–Apr** (core window; the 9/3/2026 completion chased as an off-window supplemental; one event ≠ a season).
- **middle-prong-little-pigeon** → seasonal **Feb–May + Oct–Nov** (2026 TYPE literally "Seasonal"; Dec–Jan dark in every recovered year).
- **little-river (Blount)** → seasonal **Mar–Jun + Oct** on the stocked Townsend–Walland reach; the park reach is a wild NPS fishery (stocking ended 1975).
- **cosby-creek** → seasonal **Mar–Jun** (nine biweekly events, no fall/winter, all years).
- **beaverdam-creek** → seasonal **Mar–Jun** + documented year-round WILD trout presence (a Region 4 wild-trout stream; separate prongs).
- **doe-river** → seasonal **Mar–Jun + Oct DH**; the catalog's [12,1,2] was the RMSP delayed-harvest *fishing season*, not stocking.
- **laurel-fork-carter** → stocking is Mar–Jun (Dennis Cove only; 3,700 rainbows/yr); wild browns dominate upstream — year-round only via the wild clause.
- **duck-river-tailwater** → seasonal **Nov–Jun envelope, shrinking to Nov–Apr (2026: Jan–Mar+Nov–Dec)**; Bettoli's creel (TWRA FR 01-43) recommended "managing as a seasonal rather than year-round trout fishery"; 27 °C acutely lethal by late August.
- **paint-creek-greene** → seasonal **Mar–Jun + Oct DH** (nothing Nov–Feb in 24 years).

## The [12,1,2] epidemic (major catalog finding)

The catalog carries a legacy default winter-months block [12,1,2] on ~25 small waters. This pass found it **wrong on every spring-program creek** and **right only on true winter waters**:
- **Killed → spring/summer months:** doe/forge/laurel creeks (Johnson — Mar–Jun), upper-roan (Mar–Jun), stoney (Mar–Jun), horse (Mar–Jun), gap/station/indian creeks (Claiborne — Feb–Apr), richardson-byrd (Feb–Apr), puncheon-camp (Feb–Apr), standing-rock (Feb–Apr), white-oak (Feb–Apr), hurricane (Feb–Apr), brush/gulf-fork/trail-fork (Cocke — Feb–May), upper-hills (Mar–Apr), beech-river-sibling waters, east-fork-shoal (Feb–May), little-buffalo (Mar–Jun), goforth/greasy/spring/tumbling (Polk — Mar–Apr current, Feb–May norm), north-prong-barren-fork (Mar–May, from yesterday's pass).
- **Confirmed winter waters:** mccutcheon-creek (**Dec–Mar**), boiling-fork (**Dec–Mar**), big-rock-creek (**Dec–Mar**; Marshall Co/Lewisburg greenway, since 2013-14), sinking-creek (**Dec–Feb**; program began 2021-22), sulfur-fork (**Dec–Feb**+Mar tails), red-river-clarksville (**Dec–Feb**, reach-scoped to Billy Dunlop Park), the six West TN ponds (**Dec + Jan only** — the catalog's [11,12,1,2,3] is two months too wide everywhere), Shoal Creek system (**Feb–May** with Jan only 2017–20).

## Identity / county / geography corrections

- **Drainage fixes:** wolf-river-fentress drains to the **Obey/Dale Hollow** system (HUC 05130105), not the Big South Fork basin; buffalo-river is the **Duck River's largest tributary** (drop Hardin/McNairy and "Tennessee River tributary"); little-tennessee-river has no TWRA destination — it is the **Tellico Reservoir upper arm** (merge recommendation; months derive from the reservoir program).
- **County fixes:** puncheon-camp-creek = **Grainger** (not Campbell); standing-rock-creek = **Stewart** (not Pickett/Fentress); upper-hills-creek = **Warren** (not Van Buren/White); white-oak-creek = **Houston Co Whiteoak Creek** (region = Lower Cumberland); collins-river stocked reach = **Grundy**; big-rock-creek = **Marshall** (Lewisburg greenway); mill-creek-overton = Standing Stone State Park program (the 2024 "Region 2 Mill Creek" completion is the Hickman water — do not conflate).
- **Location fixes:** johnson-park-lake = **W.C. Johnson Park, Collierville** (not Jackson); edmund-orgill-lake = **Millington** (not Memphis/Bartlett); valentine-park = Tipton Co (TWRA's "Munford City Park" pin sits inside Valentine Regional Park); shelby-farms stocked water = **Hyde Lake** (no "Jones Pond" exists in OSM — the ledger's warmwater evidence now correctly anchors to Hyde Lake itself); sequatchie-river stocked reach = **Cumberland Co headwaters (Melvine)**; red-river stocked reach = **Billy Dunlop Park on the West Fork Red River** (GIS "Red River" label imprecise); the little-buffalo "Lake" is false (undammed stream); paris-city-park = Eiffel Tower Pond (settled yesterday).
- **Species/program corrections:** chilhowee lake trout historical only (rainbow now); Tellico Lake trout = late-winter/early-spring rainbow (~4,500/yr) with "year-round" being program-purpose phrasing only; Norris Lake is NOT on the nine-reservoir trout list (lake warmwater; all trout assets are the tailwater sibling); Boone/FPH tailwater cutthroat stockings (Dec 2021) produced the July 2023 state-record cutthroat; piney-river-rhea's **Delayed Harvest designation was removed January 2026** (TFWC) — the live feed still labels the Oct row "DH" (stale).

## Systemic findings

1. **Gatlinburg city-reach complex is the only stream-side year-round stocking in the state** (52 weekly rows all 12 months; weekly municipal stockings since 1981). If the ledger treats these as one umbrella destination ("Gatlinburg Streams"), West Prong/LeConte/Roaring Fork inherit it.
2. **TWRA's reservoir trout list has drifted:** the live page lists 8 reservoirs (Dale Hollow, Parksville, Calderwood, Chilhowee, Fort Patrick Henry, South Holston, Tellico Upper, Watauga) vs the TMP's nine (adds Wilbur); species lines have rolled back (South Holston dropped brown; Chilhowee dropped lake trout). Month gaps in any water's calendar should be checked against this drift.
3. **Tailwater windows have shifted year to year** (Caney Mar–Dec → 2018–20 Mar–Jan → 2022–25 Mar–Aug+Nov–Dec → 2026 Mar–Dec; Duck Nov–Jun → Nov–Apr → Jan–Mar+Nov–Dec; Clinch GIS Mar–Aug vs schedule Mar–Sep). The mapped Tailwater_Trout seasons are snapshots, not continuums — the per-year tables in each log are the record.
4. **Fishbrain water-page species indices are boilerplate** (carried over from yesterday's finding — North Mouse Creek's "brown trout" lead is dead); onWater/PaddleWays trout claims are auto-generated noise (Brimstone, Clear Fork, WF Obey).
5. **The completed-release feeds are ~4-week rolling windows** — absence from them is not absence of stocking; the per-year schedule grids + plan PDFs are the continuity record.

## Where the remaining uncertainty sits (records-request targets)

- The **2025 Trail Fork Big Creek survey result** remains unlocatable (Region 4 Coldwater report series publicly ends with the 2022 field season) — TWRA Region 4 (Morristown) holds it.
- **Region-level annual trout reports pre-2018 and 2024–2026** (R2/R3/R4) — needed to close the winter-stocking questions on Caney (Dec–Feb completions), Clinch (Dec–Feb presence quantification), Elk (Jan–Feb), FPH tailwater, and the 2016–17/2020–21 schedule-grid gaps.
- **TVA release-temperature statements** for the French Broad and Ocoee corridors (tva.com blocks non-browser clients).
- **Fort Campbell MWR/KDFWR** cooperative-stocking ledgers (Fletchers Fork, Little West Fork — federal post program).
- TDEC internal **fish biorecon holdings** for the ~16 survey-empty streams (nothing publishes fish data to WQP).

## Bottom line

All 190 waters now carry reach-disciplined, source-verified evidence logs. The completion pass found **program continuity holds** for most documented waters (the seasonal month windows largely reproduce year after year), but it produced **12 year-round downgrades, ~25 month-window corrections, and 15+ identity/county/drainage fixes** — every one documented in the per-water logs with dates, coordinates, and direct URLs. These are research findings for the owner to adjudicate; nothing has been applied to the ledger or product.
