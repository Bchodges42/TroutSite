# CENTER HILL LAKE (DeKalb / Putnam / White / Warren counties) — warmwater evidence log

Ledger water: `warmwater-focus`. Sibling discipline: caney-fork-river.md (Center Hill TW / Caney Fork tailwater, below the dam) and caney-fork-upper.md (river above the lake) are DIFFERENT waters. This log covers the 18,220-acre USACE reservoir itself. All retrievals: 2026-09-25. Research only.

## A. Verdict summary (recommendation)

- **Classification: WARMWATER (confirmed). Confidence: HIGH.**
- Species (TWRA's own reservoir page): black bass (largemouth, smallmouth, spotted), crappie (black/blacknose dominant, white crappie upper end), bluegill, catfish, walleye — plus musky per tributary contexts and rock bass/redear sunfish in the regs table. A TWRA warmwater stocking program exists on the lake (blacknose crappie since 1990; walleye fingerlings annually) — warmwater programs, not trout.
- **Zero lake-trout program VERIFIED: Center Hill Lake is NOT on TWRA's live "Reservoir Trout Stocking" list** (the only lake-trout list TWRA publishes). No trout schedule row, no trout stocking site, no salmonid record in any dataset.

## B. Identity (dated sources)

1. **TWRA "Center Hill Reservoir" page** — https://www.tn.gov/twra/fishing/where-to-fish/cumberland-plateau-r3/center-hill-reservoir.html (retrieved 2026-09-25; text internally dates to ~2019–2021 drawdown era): "created in 1948 by the completion of Center Hill Dam on the Caney Fork River... lies within DeKalb, Putnam, Warren, and White counties... 18,220 surface acres... home to several gamefish such as black bass, crappie, walleye, bluegill, and catfish." Species sections (with survey dates/methods): Largemouth (spring electrofishing biannually; roving creel), Smallmouth ("above average in density" spring electrofishing; float-n-fly winter fishery), Spotted (ex-host of state record 5 lb 8 oz), Crappie blacknose ("annual stocking program of black and black nose crappie (BNC) fingerlings by TWRA... initiated... in 1990, the first crappie project of its kind in Tennessee"), Bluegill, Walleye ("annual stocking program of walleye fingerlings... spawning run mid-March on the upper end... Blue Hole area... near Rock Island State Park"; mean harvested weight 2.75 lb).
2. **USACE Nashville District lake page** (archived 2025-03-05, cached `wb_usace_centerhill.html`; live content notes the 2023 recreation season): "Center Hill Lake is located in the Cumberland River Basin, on the Caney Fork River, and covers parts of DeKalb, Putman, White, and Warren Counties... drainage area of 2,174 square miles"; recreation list includes fishing.
3. **Wikipedia "Center Hill Lake"** (fetched 2026-09-25): USACE dam built 1948; 260 ft high; "one of four major flood control reservoirs for the Cumberland" (with Percy Priest, Dale Hollow, Lake Cumberland).
4. **TWRA 2026-27 guide regs table** (`reg26TNAB.pdf`, effective Aug 1 2026): Center Hill column — black bass 5/day, SMB 18-in, LMB 15-in, crappie 15/day 10-in, catfish 34-in rule, walleye 5/day 16-in, musky 1/day 50-in, rock bass 20/day, paddlefish season Apr 24–May 31; special single-hook restriction Jan 1–Apr 30 from Rock Island SP ramp upstream to Great Falls Dam. (Paddlefish + musky = classic warmwater management; zero trout lines.)

## C. Zero lake-trout program — verified absence (dated)

1. **TWRA live "Reservoir Trout Stocking Information" list** (tn.gov/twra/fishing/trout-information-stockings, retrieved 2026-09-25 via r.jina.ai; cached `jina_twra_troutinfo.txt`): "TWRA stocks the following reservoirs with trout to provide year-round trout fishing opportunities:" — **Dale Hollow (R2, rainbow); Parksville (R2, rainbow); Calderwood (R4, brook/brown/rainbow); Chilhowee (R4, rainbow); Fort Patrick Henry (R4, brown/rainbow); South Holston (R4, lake/rainbow); Tellico Upper (R4, rainbow); Watauga (R4, lake/rainbow)**. **Center Hill is absent** — the current list TWRA publishes has 8 entries (the "nine-reservoir" framing in the ledger does not match today's list; count today = 8, Center Hill not among them in any case).
2. **2026 schedule JSON (616 rows)**: the only Center Hill row is "Center Hill TW / Caney Fork River", TYPE **Tailwater**, county DeKalb/Smith — the tailwater sibling, NOT the lake. No "Center Hill Lake"/"Center Hill Res." row exists.
3. **Historical schedules/feeds**: zero "Center Hill (lake)" rows in sched03–15 grids, complete_2018–2025 schedules, completed/committed destination feeds (only "Center Hill TW" rows); 2012-13 winter trout city-pond list (`stockedtrout 2012-13`, updated 1-8-2013) has no Center Hill; Coldwater quarterly lists 2021–2024: none.
4. **GIS**: no trout-stocking site named "Center Hill" in the 730-feature stocking layer; the "Center Hill Res. (Bluehole)" entries in `data/records.html` are TWRA angler-recognition citation locations (Bluehole = tailwater gorge below the dam).
5. **Citizen science**: iNaturalist Salmonidae in lake bbox 35.85–36.12N / −85.75 to −85.42W: **0 records** (queried 2026-09-25). GBIF Salmonidae same bbox: **count 0**. (Trout self-sustaining occurrence would be impossible below the dam's cold releases anyway; the lake is a warmwater/walleye system.)

## D. Contradictions and traps

1. "Center Hill TW / Caney Fork River" schedule rows and "Center Hill Res. (Bluehole)" angler-recognition entries refer to the TAILWATER/gorge, not the lake — keep the sibling's trout attribution off the lake.
2. The lake DOES have a TWRA fish STOCKING program — blacknose crappie (since 1990) and walleye fingerlings (annual). These are warmwater stockings; do not let "stocked reservoir" phrasing imply trout.
3. USACE page spells "Putman" (typo for Putnam); identity unaffected.
4. Search-fallback text once suggested "trout regs ... tributaries" for the Caney — the actual regs text (`ereg_troutregs_2026.html`) applies special trout regs only "Center Hill Dam to Cumberland River."

## E. Searches run (2026-09-25; rate-limits noted)

1. WebSearch: "Caney Fork River above Center Hill Lake smallmouth fishing Putnam White county" (429 x4; fallback text).
2. WebSearch: "Center Hill Lake" fishing walleye crappie TWRA report (429 x2, then success) — surfaced TWRA tn.gov bank-fishing snippet ("black bass, crappie, walleye, bluegill, and catfish... Region 3 Office"), onwaterapp, whatsbitingtoday (crappie 10-in/30-day regs), lakesideresort.uchra.com (walleye March–May), tennessee-glamping.
3. WebSearch: TWRA "Center Hill" reservoir fishery report black bass crappie walleye tn.gov (429 x3 + 1 partial).
4. URL discovery mirrors: Mojeek (blocked), Google-via-jina (consent wall), DDG html (challenge), Bing (JS-walled) — then tn.gov sitemap via r.jina.ai located the official reservoir pages.
5. r.jina.ai fetches: TWRA trout-information-stockings (reservoir list extracted), TWRA center-hill-reservoir page, TWRA sitemap.
6. Wayback: USACE Center Hill Lake page (2025-03-05 snapshot; Internet Archive went temporarily offline later in the session).
7. API: iNaturalist + GBIF salmonid bbox checks (zero).
8. Local corpus: greps across all schedule/feed/GIS/regs caches (sections C–D); `peer_centerhill.pdf` (TCWN/PEER "Last Gasp," Aug 2005) — dam/tailwater DO report, confirms lake identity (64-mi reservoir, 2,092,000 ac-ft) and that trout concerns attach to the tailwater only.

## F. Recommendation

Classify **warmwater** (high confidence): TWRA-managed black bass / crappie / bluegill / catfish / walleye (with BNC-crappie and walleye stocking programs); NOT on TWRA's reservoir-trout list (verified against the live list 2026-09-25); no trout schedule/site/record ever located for the lake itself. Keep all trout attribution on the "Center Hill TW / Caney Fork River" sibling water.
