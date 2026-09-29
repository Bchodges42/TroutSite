# old-hickory-lake.md — Old Hickory Lake / Old Hickory Reservoir (Sumner/Davidson/Wilson/Smith counties)

Ledger verdict under test: `warmwater-focus`.
Research pass: 2026-09-25 (retrieval dates 2026-09-25 unless noted). Internal classification research only.

## 1. Identity / coordinates
- Old Hickory Reservoir: 22,500-acre USACE impoundment on the **Cumberland River** in northern Middle Tennessee (dam completed 1954; full pool 445 ft MSL). Spans Sumner, Davidson, Wilson, Smith (and touches Trousdale) counties; upstream neighbor of Cordell Hull Reservoir, downstream of the Nashville (Cheatham-pool) reach.
- No trout destination exists on this reservoir in any TWRA trout dataset (see §2.2).

## 2. Source-by-source evidence

### 2.1 TWRA "Old Hickory Reservoir" where-to-fish page — agency, HIGH
- URL: https://www.tn.gov/twra/fishing/where-to-fish/middle-tennessee-r2/old-hickory-reservoir.html ; retrieved 2026-09-25 via Wayback capture 20260421054609 (local `completion/r2lake/old-hickory-reservoir.html`; body text references 2019 spring electrofishing and "catches of harvestable crappie starting in late summer and fall, 2021", i.e., content last refreshed ~2020-21).
- Species/effort statements: "What you can catch" = Largemouth Bass (40% of targeted effort), **Crappie** ("Crappie fishing accounts for 10 percent… White crappies are the most abundant"), **Striped Bass** ("Old Hickory Reservoir provides a **world class trophy striped bass fishery with regular catches exceeding 50 pounds**. May is a great month…"), **Sauger** ("prime location from January through March" — upper reservoir Hunter's Point→Cordell Hull reach; regs 10/day @15"), **Walleye** ("stocked in Old Hickory… The **All-Tackle World Record Walleye was caught from Old Hickory in 1960 weighing 25 pounds**" = Mabry Harper, 25 lb 0 oz, Aug 2, 1960; corroborated 2026-09-25 via search), White Bass, catfish. Regulations table (LMB 14", SMB 18", crappie 30 @10", striper/hybrid 2 @15", walleye 5 @16", sauger 10 @15", paddlefish Apr 24–May 31) contains **no trout row**. The ONLY "trout" text in the fishery body is bait: stripers drifted "with planer boards" on "live skipjack herring, gizzard shad **or rainbow trout**" — i.e., rainbow trout appear solely as striper bait, the inverse of a trout fishery. Remaining "trout" strings are site-navigation links.
- Establishes: agency-defined warmwater/tailrace identity; zero trout fishery on the reservoir.

### 2.2 TWRA trout stocking program — negative, agency, HIGH
- 2026 schedule JSON (616 rows; retrieved 2026-09-25; local `completion/trout_2026_live.json`): no Old Hickory row of any type.
- Winter schedules 2018-19→2024-25 (local PDFs) and annual spring grids 2010–2025: no Old Hickory row. Nearest winter-program sites are **shoreline-adjacent parks on separate waters**, not the reservoir: Don Fox Community Park / Sinking Creek, Lebanon (Wilson Co; OBJECTID 697) and Cedar Hill Park Pond, Madison (Davidson; OBJECTID 698).
- TWRA Trout Stocking Locations GIS layer (730 features; local `completion/arcgis_all.json`, queried 2026-09-25): **zero** site rows with "Old Hickory" in any field and zero trout sites on the reservoir or its shoreline in Sumner/Wilson/Smith counties (only Caney Fork tailwater sites in Smith — a different ledger water).
- Establishes: zero trout program on Old Hickory Lake.

### 2.3 Dated corroboration
- eRegulations Tennessee 2026-27 (guide dated Sep 11, 2026; surfaced via search 2026-09-25): "Old Hickory Reservoir is number one for Sauger…" in TWRA's top-waters framing.
- World-record walleye: Mabry Harper, 25 lb 0 oz, Old Hickory Lake, Aug 2, 1960 (reinstated after challenge; still the official IGFA all-tackle record) — multiple 2026-09-25 search corroborations; also stated on the TWRA page above.
- TDEC 305(b)/posted-waters listings: consumption advisories on this Cumberland reach (catfish/striped bass/hybrid do-not-eat; precautionary sauger/white bass/carp) — agency recognition of the warmwater game community (retrieved via search 2026-09-25).
- Angler/report layer (LOW-MED, aggregator): winter sauger run below the dam Jan–Feb; striper/hybrid/crappie guides operating since ~2004 (fishingstatus.com, staynashville.co 2026 guide, TNDeer forums).

## 3. Contradictions / caveats
- None material. Search noise: "Old Hickory" trout hits in articles conflate the nearby Caney Fork and Stones tailwaters; the "cold underflows support trout" phrasing seen in some angler content refers to downstream tailwaters, not this reservoir. Reach discipline: the dam's tailwater is the Davidson-county Cumberland main stem (sibling water `cumberland-river.md`), which also has no trout program.

## 4. Searches run (5+)
(1) "Percy Priest" OR "Old Hickory" lake trout stocking Tennessee; (2) "Old Hickory" tailwater "Old Hickory Dam" striped bass sauger fishing Nashville Cumberland; (3) "Old Hickory Lake" crappie striped bass fishing Tennessee walleye 1960 world record; (4) "Old Hickory" lake OR tailwater fishing report crappie sauger 2025 2026 (with sub-queries); (5) Cheatham/Old Hickory dam-tailrace queries within the Cumberland pass. Plus TWRA page fetch and GIS-layer query.

## 5. Recommendation
- Keep `warmwater-focus`. Trophy striped bass (50 lb+ class) + sauger (Jan–Mar) + walleye (stocked; world-record water) + crappie + black bass; TWRA stocks walleye/hybrid/striper — never trout. Zero trout rows in every TWRA trout dataset 2010–2026. No trout classification on this water.
