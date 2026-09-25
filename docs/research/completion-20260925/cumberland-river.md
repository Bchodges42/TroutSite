# cumberland-river.md — Cumberland River, Davidson County (Old Hickory Dam downstream through Nashville; Cheatham Reservoir pool)

Ledger verdict under test: `warmwater-focus`.
Research pass: 2026-09-25 (retrieval dates 2026-09-25 unless noted). Internal classification research only.

## 1. Identity / reach / coordinates
- Reach: Cumberland River main stem from **Old Hickory Dam** (rivermile ~216, Davidson/Sumner line) downstream through Nashville to Cheatham Lock & Dam (Ashland City) — i.e., the entire Nashville main-stem lies in **Cheatham Reservoir pool**, a 7,450-acre riverine impoundment (USACE dam completed 1952; full pool 385 ft MSL) that "meanders through Nashville and downstream to Ashland City" (TWRA). TWRA regs note for this pool: "Includes Stones River up to J. Percy Priest Dam."
- No trout destination exists on this main-stem reach in any TWRA trout dataset (see §2.2). The reach hosts the stocked **Stones River tailwater** at its head (below J. Percy Priest Dam, where the Stones joins the Cumberland) — that is a separate ledger water (`stones-river.md`).

## 2. Source-by-source evidence

### 2.1 TWRA "Cheatham Reservoir" where-to-fish page — agency, HIGH (the key source for this reach)
- URL: https://www.tn.gov/twra/fishing/where-to-fish/middle-tennessee-r2/cheatham-reservoir.html ; retrieved 2026-09-25 via Wayback capture 20260421 (local `completion/r2lake/cheatham-reservoir.html`; body text references "harvestable crappie starting in late summer and fall, 2021" — content refreshed ~2020-21).
- "The best fishing opportunities are for: **Largemouth Bass, White Crappie, Sauger, Walleye, Catfish, White Bass, Rainbow Trout**."
- **Sauger/Walleye section:** "The TWRA stocks both species in Cheatham Reservoir to provide a really good fishery. The upper section of Cheatham Reservoir, **particularly below Old Hickory Dam, is a prime location from November through March**… public boat access areas at Old Hickory Dam, Peeler Park and Heartland Recreation Area." (Winter sauger/walleye stocking + fishery at exactly the ledger reach.)
- **Regulations:** black bass 5 combo (LMB 14", SMB 18"), crappie 30 @10", **Striped Bass or Hybrid Striped Bass: 2/day @15"**, white bass 15, walleye 5 @16", sauger 10 @15" — no trout row in the regs table.
- **The wrinkle (contradiction handled):** the page's **Rainbow Trout** section reads: "Beginning on the first Friday in December, the Dale Hollow National Fish Hatchery stocks catchable-size Rainbow Trout **below J. Percy Priest Dam**. Stockings occur in January and February, as well, with 2,000 trout released at each event… the opportunity to catch trout in Metro Nashville. Anglers are encouraged to harvest… will not survive the warm summer water temperatures… creel limit is 7 per day… supplemental trout license (type 022)." "Below J. Percy Priest Dam" is the **Stones River tailwater** (cheatham-pool tributary), not the Cumberland main stem below Old Hickory Dam. Every detail (Dec-first-Friday start, Jan/Feb, ~2,000/event, ~12-14k/season) matches the Stones tailwater program (GIS OBJECTID 660: 14,000 rainbow, Winter; sibling log). So the trout line on this page is a pool-level summary that credits the tributary tailwater — it does NOT evidence a main-stem Cumberland trout program. (The sibling `stones-river.md` documents the identical program.)
- Establishes: warmwater identity of the Nashville main stem (sauger/walleye stocked Nov–Mar; striper/hybrid/catfish/white bass/crappie/largemouth), with the trout attribution belonging to the tributary tailwater.

### 2.2 TWRA trout stocking program — negative for the main stem, agency, HIGH
- TWRA Trout Stocking Locations GIS layer (730 features; local `completion/arcgis_all.json`, queried 2026-09-25): **zero** trout sites with StreamName "Cumberland River" statewide; the only Davidson County sites are **Sevier Lake at Shelby Bottoms Park** (OBJECTID 655, Winter, pond, 4,500 rainbow — a City park pond in East Nashville, StreamName "Sevier Lake", NOT the river), Marrowbone Lake (658, Joelton pond), Cedar Hill Park Pond (698, Madison pond), and the J. Percy Priest Tailwater / Stones River (660). No main-stem stocking site.
- 2026 schedule JSON (616 rows; retrieved 2026-09-25): no "Cumberland River" row of any TYPE in any county (the word does not appear in the LOCATION field at all). Winter schedules 2012-13→2024-25 and annual spring grids 2010–2025: Davidson winter entries are Shelby Bottoms Park, Marrowbone Lake, Cedar Hill Park Pond, J. Percy Priest Tailwater only.

### 2.3 Dated corroboration (warmwater)
- TDEC 305(b)/posted-waters (retrieved via search 2026-09-25): for the **Cumberland River below Old Hickory Dam**, catfish, striped bass and striped bass hybrids carry do-not-eat advisories, with precautionary advisories for sauger, white bass and carp — agency recognition of the resident warmwater game community on the exact reach.
- USACE Cheatham Lake Master Plan / Cumberland Basin report (retrieved via search 2026-09-25): Cheatham Lake extends 67.5 miles up the Cumberland; key species striped bass, largemouth, white crappie, white bass, bluegill, walleye, sauger; fishing is the lake's #1 recreation.
- eRegulations Tennessee 2026-27 (guide dated Sep 11, 2026): "Old Hickory Reservoir is number one for Sauger…" and the Cheatham-pool regs above.
- Angler layer (LOW-MED, aggregator/forum): striper fishery below Old Hickory Dam (kentuckyhunting.net, Feb 8, 2023: "Cumberland River below both Old Hickory and Cordell Hull dam"; one poster's "stripers and trout" aside refers to below CHEATHAM Dam / other tailwaters — unverified, no agency trout program below Cheatham Dam exists in any TWRA dataset); late-winter sauger runs below Old Hickory Dam Jan–Feb (staynashville.co 2026 guide).
- Adjacent winter-park program: Tennessean (Mar 16, 2016) reported a winter trout stocking EVENT at Shelby Bottoms Park (Mar 17-18, 2016, with a fly-fishing club) — that is the Sevier Lake pond destination (GIS 655), city-park water adjacent to the greenway, not a main-stem stocking; listed here only to preempt misclassification.

## 3. Contradictions / caveats
- TWRA's Cheatham page lists "Rainbow Trout" among best-fishing opportunities — resolved in §2.1: the supporting paragraph and all quantitative data attribute it to below J. Percy Priest Dam (Stones tailwater; sibling ledger water). Any naive scrape of this page will over-assign trout to the Cumberland main stem.
- Forum chatter of "trout" below Cheatham Dam is unverified and contradicted by the absence of any stocking site/row.
- Do not conflate this reach with the Caney Fork or Stones tailwaters (the actual Middle-Tennessee trout tailwaters).

## 4. Searches run (5+)
(1) "Old Hickory" tailwater "Old Hickory Dam" striped bass sauger fishing Nashville Cumberland (surfaced TDEC 305(b) advisories); (2) Cumberland River "below Old Hickory Dam" striped bass fishing Nashville; (3) "Cumberland River" Nashville trout stocking OR trout Shelby Bottoms winter (surfaced Tennessean 2016 + Shelby Park/Sevier Lake note); (4) Cheatham Lake striped bass sauger Cumberland River fishing Nashville (surfaced USACE Master Plan, advisories, forum); (5) TWRA guide/eregulations check via the Sep 11, 2026 dated guide. Plus TWRA Cheatham page fetch, GIS-layer query, eRegulations cache grep.

## 5. Recommendation
- Keep `warmwater-focus` for the Cumberland River (Davidson County) reach. Winter sauger/walleye stocking (Nov–Mar, below Old Hickory Dam), trophy striped bass/hybrid fishery, catfish/white bass/crappie/largemouth; creel regs contain no trout row and no trout dataset (schedules 2010-2026, GIS 730 features) contains a main-stem site. The only trout on this pool are (a) the sibling Stones River tailwater below J. Percy Priest Dam (TWRA's own trout paragraph on the Cheatham page refers THERE) and (b) city park ponds (Sevier Lake/Shelby Bottoms) — both separate destinations.
