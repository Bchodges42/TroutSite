# Tennessee Trout Waterways — In-Depth Research Report

**Lane:** trout-research · **Date:** 2026-09-09 · **Branch:** `research/trout-waterways`
**Companion deliverables:** [`SPECIES-CLASSIFICATION.md`](./SPECIES-CLASSIFICATION.md) (all 165 waters) · [`proposed-waters-2026-09.yaml`](./proposed-waters-2026-09.yaml) (machine-readable proposal) · [`_notes/`](./_notes/) (6 research scopes with per-claim citations)

Every claim below cites its source; access date for all URLs is **2026-09-09** unless marked
otherwise. Source hierarchy: **tn.gov/twra** (trout regulations, stocking schedule + tailwater/
reservoir tables, Trout Management Plan 2017–2027, news releases) → **NPS / USFS / TVA / USFWS /
TWRA where-to-fish pages** → **TU chapters / city & park pages** → aggregators (**corroboration
only**). The TWRA ArcGIS storymap (`storymaps.arcgis.com/stories/4c150fb3e0444ed6b55adede0c1b23e2`)
was fetched and read; internal text indicates student authorship — treated as **unofficial,
corroboration-only**. Confidence: **high** = 2+ independent sources or one explicit fetched official
statement; **medium** = single source; **low** = inference.

---

## 1. Executive summary — headline findings

1. **Tennessee's trout water is small, eastern, and almost entirely managed.** TWRA's Trout
   Management Plan 2017–2027 puts wild trout habitat at **600+ miles of Blue Ridge streams
   (~70% inside the 625,000-acre Cherokee NF) plus another 245 miles in the Tennessee portion of
   GSMNP** — the rest of the state has no wild trout streams. TWRA designates only **10 wild
   trout streams**, every one of them in East Tennessee (Monroe ×4, Carter ×2, Johnson, Greene,
   Greene/Unicoi, + Little Stony Creek) — [tn.gov/twra trout regs, fetched].
2. **Everything else is a stocking program, and TWRA runs four:** (a) **12 tailwaters / 127 miles**
   receiving ~1 million trout/year; (b) **9 trout reservoirs** (~215,000 9-inch rainbows/year,
   winter-stocked); (c) **seasonal "hatchery-supported" streams** (spring/fall put-and-take);
   (d) the **winter put-and-take program** — 42 waters in 2026, 70,000+ ~10-inch rainbows,
   concentrated in West + Middle TN (31 of 42). All four are rainbow-led; brook/brown/cutthroat
   are program-specific — [stockings page + schedule JSON + Plan, all fetched].
3. **Cutthroat trout are now real in Tennessee.** Introduced 2021, they appear on TWRA's live
   tailwater stocking table for **Caney Fork, Elk, Hiwassee, and Boone** tailwaters, and the state
   record (6 lb 9 oz, 2024) came from the Fort Patrick Henry/Boone tailwater — [stockings page +
   records page, fetched]. The schedule JSON's species field ("Rainbow, Brown") is abbreviated
   and understates Caney/Elk — the tailwater page is authoritative.
4. **Lake trout exist in exactly two lakes**: South Holston and Watauga reservoirs (~150,000
   six-inch fish/yr per the Plan; live list: "Lake and Rainbow"); state record 22 lb 2 oz, Watauga
   2008. Max 2 lake trout in the statewide creel — [Plan + stockings list + records, fetched].
5. **Native brook trout** (Tennessee's only native trout) survive in **~141 miles across 111
   streams + one high-elevation pond**, extirpated from 57% of their HUC-12 watersheds; >60% of
   remaining populations are of native southern Appalachian heritage. Restoration (TWRA + USFS +
   TU since the 1980s; GSMNP's Lynn Camp Prong is the Southeast's largest project, 11 populations
   / 27.6 stream-miles restored park-wide) is **wild-fish translocation, not hatchery stocking** —
   TWRA's hatchery brook trout go to tailwaters (Norris, Hiwassee, Caney, Obey, Tims Ford, Boone)
   and Calderwood reservoir instead — [Plan + NPS pages + USFS + TU, fetched].
6. **Catalog corrections landed by this research** (owner decisions listed in
   SPECIES-CLASSIFICATION.md §Corrections): Dale Hollow's "famous put-grow-take brown fishery" is
   **rejected** (it is a rainbow winter program; Dale Hollow's fame is the world-record smallmouth);
   **South Holston, Watauga, Fort Patrick Henry, and Wilbur lakes DO receive trout stocking**
   (contradicting the 2026-09-08 warmwater ruling for South Holston); Duck River tailwater is
   **Nov–Jun, not year-round**; Piney River's DH removal (eff. 2026-08-01) invalidates its
   `yearRound: true`; and the catalog's Plateau wild-trout set (Obed system, New River, Clear Fork,
   SF Cumberland, Powell) could **not** be corroborated from primary sources.
7. **Atlas coverage gaps found:** McKenzie City Park (Carroll Co) is the only Region-1 winter
   trout water missing from the atlas; `shoal-creek` has no TWRA row of its own (the scheduled
   water is East Fork Shoal Creek); and the stocked rows for `white-oak-creek`, `hurricane-creek`,
   and `standing-rock-creek` are **Region-1 Tennessee River-bend streams** (Houston/Humphreys/
   Stewart counties), not upper-Cumberland waters — identity check required.

---

## 2. How Tennessee's trout fishery is structured

### 2.1 The three-part structure (wild / stocked / tailwater)

| Layer | Extent | Management | Source |
|---|---|---|---|
| **Wild trout** | 600+ mi Blue Ridge + 245 mi GSMNP (TN portion) — all East TN | 10 designated wild trout streams: 5/day, no length limit, single-hook artificials, bait banned; all other wild water under statewide rules | TWRA trout regs + Trout Plan (both fetched, high) |
| **Hatchery-supported streams** | Seasonal spring (Mar–May) and fall circuits, statewide outside tailwaters | Put-and-take ~10-in rainbows; "survival of stocked trout is usually limited by summer water temperatures, harvest… generally encouraged" | TWRA schedule JSON (616 rows, fetched) + Plan (fetched) |
| **Tailwaters** | 12 tailwaters / 127 mi | ~1M trout/yr; all get 9-in rainbows (~490k/yr); browns ~250k/yr except South Holston + Wilbur (wild-reproducing browns, none stocked); adult brook up to 80k/yr into Norris, Apalachia, Center Hill, Dale Hollow, Tims Ford (+ Boone on the live page) | Plan + tailwater stocking table (fetched, high) |

Regulatory frame (all fetched from tn.gov, high confidence): statewide creel **7 trout/day any
combination, no length limit, max 2 lake trout**; the trout requirement is the **$21 Annual Trout
Supplemental** license (there is no "Type 22"); the **regulation year runs Aug 1 – Jul 31** (the
2026-27 proclamation took effect Aug 1, 2026), while licenses themselves are rolling 365-day.
Eight **delayed-harvest** waters carry artificial-only catch-and-release windows — with two 2026-27
changes: **Piney River's DH was removed** effective 2026-08-01 (news release 2025-12-16 + adopted;
a stale DH row remains in the schedule JSON), and **Big Soddy Creek's DH start moved to Nov 1**.
DH stockings are rainbow, supplemented with retired Erwin NFH brood fish.

### 2.2 The winter put-and-take program (the whole West TN story)

- **Scale:** 70,000+ trout at 40+ locations in 2025-26 (news release 2025-11-26, fetched); the
  2026 schedule JSON carries **42 Winter waters: Region 1 = 14, Region 2 = 17, Region 3 = 6,
  Region 4 = 5** — 31 of 42 in West + Middle TN (fetched, high).
- **Origin:** began December 1999 at the J. Percy Priest tailwater (Stones River) — Plan (fetched).
- **Shape:** one ~10-inch rainbow stocking per water per winter in practice (Region-1 pond dates
  cluster 1/8–1/15/2026 plus "TBD 12/2026"); window announced late November, stockings
  December–February, spring program starts March 1 (news 12/31/2025, fetched). **Rainbow only —
  no browns anywhere in the winter program** (all 42 Winter rows, fetched).
- **Rules:** 7/day (5/day at the five Community Lakes Fishing Program waters — Cameron Brown Lake
  Germantown is West TN's only one), no size limit, trout license required. The Plan's framing is
  explicitly put-and-take: urban recruitment waters that cannot hold trout through summer.
- **2025-26 new sites:** Mossy Creek (Jefferson Co) and Covington First Baptist Church pond
  (Tipton Co) — news release (fetched). Former sites no longer listed: Davies Plantation
  (Lakeland) and Eiffel Tower Park pond (Paris) — secondary sources only (medium).

### 2.3 The reservoir trout program (the part most people miss)

TWRA stocks **nine trout reservoirs** — Dale Hollow, Parksville, South Holston, Wilbur, Watauga,
Fort Patrick Henry, Calderwood, Chilhowee, and Tellico (upper arm) — ~62,400 acres, to "provide
year-round trout fishing opportunities," winter-timed to reduce walleye predation (Plan, fetched).
Live reservoir table (fetched): Dale Hollow — Rainbow · Parksville — Rainbow · **Calderwood —
Brook, Brown and Rainbow** · **Chilhowee — Rainbow** · **Fort Patrick Henry — Brown and Rainbow** ·
**South Holston — Lake and Rainbow** · **Tellico (Upper) — Rainbow** (~4,500/yr in the Little
Tennessee arm below Chilhowee Dam) · **Watauga — Lake and Rainbow**. Reservoir trout switch to
piscivory on alewives ~10-in (Bergthold & Bettoli 2009, in Plan) — these are genuinely
self-sustaining *fisheries* once stocked, not put-and-take ponds.

### 2.4 Brood fish and the hatchery backbone

All brown, brook, and lake trout stocked in Tennessee come from **Dale Hollow National Fish
Hatchery** (TWRA contract: 100,000 lb/yr since 1994); **Erwin NFH** runs the national broodstock
program and its retired 2.5–3.5-lb brood fish stock the **Watauga and Nolichucky systems** locally
and DH waters statewide (USFWS, fetched, high). Flintville Hatchery produces winter-program
rainbows (Plan).

---

## 3. Per-species water lists

### 3.1 BROOK TROUT — native restoration vs stocked (the key distinction)

**Native (wild, southern Appalachian strain) — 12 waters in atlas/pending scope:**

| Water | Status | Source |
|---|---|---|
| middle-prong-little-pigeon | **Lynn Camp Prong restoration — flagship of the Southeast** (antimycin 2008–2011, now flourishing; park-wide program: 11 populations / 27.6 mi restored, 13 more mi barrier-ready) | NPS Lynn Camp Prong page (fetched, high) |
| little-river, leconte-creek, west-prong-little-pigeon, roaring-fork, cosby-creek | native brook in GSMNP headwater forks (species splits medium; park regs high) | NPS GSMNP fishing (fetched) |
| laurel-fork-carter | native brook headwaters above the designated-wild reach (AT access from Dennis Cove) | TWRA wild list (fetched) + TU Blue Lines |
| north-river, bald-river (pending-add) | designated wild; "wild trout streams holding brown, rainbow, and brook trout" | TWRA wild list + USFS Tellico page (fetched, high) |
| rocky-fork (pending-add) | native brook headwaters + wild rainbow; designated wild above the park-road junction | TWRA wild list + TN State Parks (search-only) |
| gulf-fork-big-creek | **unique French Broad watershed brook strain** — found nowhere else | EBTJV project pages (fetched, high) |
| trail-fork-big-creek | brookies **reintroduced 2021** (translocation above a natural falls; $300k+ culvert-to-bridge) | TU Magazine (fetched, high) |

Context (not in atlas): Sycamore Creek (1990s USFS/TWRA/TU restoration) and Rough Ridge Creek
(Monroe Co., designated wild). GSMNP stopped stocking in 1975; 2023 USFWS moved brook trout from
GSMNP to Cherokee NF streams for range-wide recovery. Restoration is translocation of wild
native-strain fish — never hatchery stock — [NPS + USFS + TU + USFWS].

**Stocked hatchery brook (put-and-take — a different fishery entirely):** tailwater table
(fetched, high) — **Clinch/Norris, Hiwassee/Apalachia, Caney Fork/Center Hill, Obey/Dale Hollow,
Elk/Tims Ford, Boone/SF Holston** (the Plan's 2017 list omits Boone; the live page adds it), plus
**Calderwood reservoir** (Brook, Brown and Rainbow). Up to 80,000 adult brook/yr. The Obey's
secondary species is genuinely conflicted (brook per the tailwater page + Plan; brown per the
schedule JSON + eRegulations mirror) — the safe assertion is rainbow-only.

**Negative findings:** beaverdam-creek has **no brook evidence** (wild rainbow + brown + stocked
rainbow); GSMNP brook water is headwater-only — browns occupy the lowest elevations, rainbows the
middle. State record brook: 4 lb 12 oz, Caney Fork, 2016 (a stocked-tailwater fish).

### 3.2 RAINBOW TROUT — the backbone species

Rainbows anchor **every** TWRA program: all 42 winter waters; all 12 tailwaters (South Holston
Dam row is *rainbow only* — its browns are wild-reproducing, none stocked); ~490,000 9-in fish/yr
into tailwaters + ~215,000/yr into reservoirs; and the spring/fall seasonal circuit (≈60 atlas
waters from Barren Fork to Sequatchie). Wild rainbow waters: GSMNP mid-elevation reaches, Cherokee
NF streams, Rocky Fork, and — per TVA's 2023 coldwater report (via the unofficial storymap) — the
South Holston tailwater rainbow population may soon sustain itself without fingerlings. State
record: 18 lb 8 oz, Polk Co. pond, 2016.

### 3.3 BROWN TROUT — the wild-reproduction story is in the tailwaters

- **Wild-reproducing brown fisheries (not stocked): South Holston tailwater** (~82% of
  electrofishing catch; the Plan manages it as a wild brown fishery) and **Wilbur/Watauga
  tailwater** (73–74% brown in TVA sampling). Reservoir browns (~25,000/lake) go to Watauga +
  South Holston *lakes* — Plan + storymap-cited TVA data (high/medium).
- **Stocked browns:** ~250,000 7-in/yr into most tailwaters; the Caney Fork's celebrated winter
  "trophy browns" are retired Dale Hollow NFH brood fish (16–21 in, 2.5+ lb) + fingerlings — there
  is **no formally named trophy program** (TWRA Facebook, medium; regs: brown 1/day 24-in on
  Caney). **The common claim that the state-record brown came from the Caney is false — it is the
  Clinch River, 28 lb 12 oz, 1988** (records page, fetched, high).
- **Dale Hollow reservoir rejection:** TWRA's page and lists make it a **rainbow** winter
  program; the single April brown schedule row is a footnote, and the reservoir's real fame is the
  1955 world-record smallmouth (11 lb 15 oz).
- Wild browns in streams: GSMNP lower reaches; NPS Big South Fork brochure: "brown trout are
  limited to tributary streams within the park" — which supports (medium, not high) wild browns in
  the New River/Clear Fork system above the BSF.

### 3.4 CUTTHROAT + LAKE TROUT — the new and the niche

**Cutthroat** (introduced 2021): live tailwater table lists them for **Caney Fork, Elk, Hiwassee,
and Boone**; state record 6 lb 9 oz, Fort Patrick Henry (Boone tailwater), June 2024; populations
remain low relative to rainbow/brown (storymap, corroboration-only). **Lake trout:** South Holston
+ Watauga reservoirs only (live list; the 2017 Plan also named Chilhowee — apparent reduction);
~150,000 6-in/yr; record 22 lb 2 oz, Watauga, 2008; the statewide 2-lake-trout creel exception
exists for this fishery. All from DHNFH. (Plan + tables + records page, fetched, high.)

### 3.5 Multi-species waters (3+ trout species in one water)

**Caney Fork** (RB+BN+BK+C), **Elk** (BK+BN+C+RB), **Boone tailwater** (BK+BN+C+RB),
**Hiwassee** (BK+BN+C+RB), **Clinch** (BK+BN+RB), **Watauga** (RB stocked + wild BN + NC-side
brookies), **Calderwood** (BK+BN+RB), **Tellico River** (RB+BN stocked, BK far upstream), plus the
wild-Smokies gradient waters (little-river, middle-prong, west-prong: BN→RB→BK by elevation).

---

## 4. Basin-by-basin breakdown

### 4.1 West Tennessee (TWRA Region 1; 21 atlas waters)

**No streams, no wild trout, no tailwaters — the trout story is 14 winter ponds.** All 13 atlas
ponds match the 2026 Region-1 Winter list 1:1 (Beech Lake–Henderson, Milan City Pond–Gibson, Paris
City Park–Henry, Lake Graham–Madison, Union City Reelfoot Packing Site–Obion, Cameron Brown–Shelby,
Edmund-Orgill–Shelby, Johnson Park–Shelby [Collierville], Shelby Farms–Shelby [trout go in Jones
Pond], Yale Road–Shelby [Bartlett], Covington FBC–Tipton, Valentine Park–Tipton [Munford], Martin
City Pond–Weakley). **Gap: McKenzie City Park (Carroll Co).** The region's rivers are the warmwater
contrast: Kentucky Lake (crappie/sauger/blue cat), Pickwick (trophy smallmouth), Reelfoot
(bluegill/white crappie), Hatchie/Obion/Forked Deer/Loosahatchie/Big Sandy/Beech River (all warmwater,
zero trout evidence in the fetched 2026 schedule), Mississippi at Memphis (trophy blue catfish).
Two pending-add lakes are warmwater too: **Herb Parsons** (TWRA Family Fishing Lake, Bill Dance
Signature Lake — **no winter trout, none ever**) and **Garrett Lake** (Weakley Co., no permit).
Note the Region-1 "Seasonal" creek rows (Houston/Humphreys/Perry/Stewart) are Tennessee River-bend
waters — relevant to the white-oak/hurricane/standing-rock identity flags.

### 4.2 Middle Tennessee (Regions 2/3; 48 atlas waters + 2 pending)

- **Tailwater quartet:** Caney Fork (4 species Mar–Dec; 5/day, 14–20-in PLR, brown 24-in), Elk
  (4 species Mar–Dec; brown 20-in/1-day), Duck (rainbow Nov–Jun only — **not year-round**), Obey
  (rainbow every month — the only 12-month stocking row in the state; secondary species conflicted).
- **Nashville metro winter program** (Region 2 = 17 waters): Stones River at J. Percy Priest TW
  (the 1999 original), W. Fork Stones (Manson Pike + Nice Mill), Red River (Billy Dunlop Park),
  Sulfur Fork, Big Rock Greenway, McCutcheon Creek (Columbia — **not** Manchester), Sinking Creek
  (Don Fox Park, Lebanon), Cowan City Park (Boiling Fork), Harpeth at Eastern Flank + L.L. Burns,
  plus Fort Campbell's rainbow+brown streams. All Dec–Mar rainbows.
- **Highland Rim spring circuit:** Barren Fork + N Prong, Calfkiller, Cane Creek (Fall Creek Falls
  SP + lower; one late-Oct fall row), Collins (Grundy Co row), Rocky River (Van Buren), Charles
  Creek, Mill Creek (Standing Stone SP), Pine Creek (DeKalb), Upper Hills Creek, E. Fork Shoal
  Creek (Lawrence — longest spring window), Little Buffalo (Lawrence — **is** stocked).
- **Reservoir verdicts:** Center Hill, Tims Ford, Normandy, Woods, Great Falls, Cordell Hull
  (pending), Cheatham (pending) — **all warmwater; the trout water is always the tailwater.**
- **Dale Hollow:** rainbow winter reservoir program (see §3.3).
- **Plateau wild question:** the Obed system (Obed, Daddy's Creek, Clear Creek), New River, Clear
  Fork, SF Cumberland — catalog claims wild trout; primary sources this pass (NPS Obed page lists
  *no* trout; TWRA wild list excludes all; no stocking rows) do not corroborate →
  unknown-need-evidence, re-review. Piney River (Rhea): DH gone, spring stocking remains; Wolf
  River (Fentress): spring-stocked rainbow (not wild-only); Sequatchie headwaters: spring rainbows.

### 4.3 East Tennessee (Region 4; 69 atlas waters + 8 pending)

- **Tailwater row (all fetched-verified):** South Holston (rainbow-only stocking, wild browns,
  16–22 PLR, Nov 1–Jan 31 spawning closures), Watauga QTA (rainbow Mar–Dec + wild browns; 14-in/
  2-day/no bait), Wilbur reach (rainbow Mar–Jul, statewide), Clinch (B/BN/RB Mar–Aug, 14–20 slot,
  80–90% rainbows in the catch, wild reproduction documented), Boone (BK/BN/C/RB Mar/Apr/Dec,
  16–22 PLR + spawning closures), FPH dam tailwater (BN+RB Mar–Apr, statewide — the PLR block
  belongs to the Boone Dam→Louis Milhorn Br reach), Cherokee TW (BN+RB Nov–Apr — the pending-add
  tailwater), Hiwassee (B/BN/C/RB Oct–Jul + DH Oct 1–Feb 28 = a genuine year-round fishery with an
  August thermal caveat per TU).
- **Reservoir trout stocking:** South Holston (RB + lake trout), Watauga (RB + lake trout + BN),
  Wilbur (RB), Fort Patrick Henry (BN+RB), Calderwood (BK+BN+RB), Chilhowee (RB annual),
  Tellico upper arm (RB ~4,500/yr). **Not stocked, warmwater:** Boone, Cherokee, Norris, Melton
  Hill, Fort Loudoun, Watts Bar, Chickamauga, Nickajack, Douglas.
- **Wild trout core:** the 10-stream TWRA wild list + GSMNP (2,900 stream-mi, ~20% support trout;
  only native trout = brook; park open year-round, 5/day, 7-in, single-hook artificials, TN or NC
  license) + the stocked/permit machinery of Tellico-Citico (permit Mar 1–Aug 15, closed Thu/Fri;
  Tellico DH Oct 1–Feb 28) + the DH set (Paint Creek, Doe River, Buffalo Creek) + Horse Creek's
  summer 2/day rule.
- **Gatlinburg city waters** (W. Prong, LeConte, Roaring Fork): city permit, C&R Dec 1–Mar 31,
  5/day Apr 1–Nov 30, closed Thursdays; stocked biweekly from the city trout farm — TWRA's recent-
  stocking report confirms W. Prong loads on 7/16 and 7/23/2026.
- **Big-river verdicts:** Holston main stem warmwater (sauger at the forks); NFK Holston trophy
  smallmouth; Powell warmwater SMB (wild-trout claim uncorroborated); French Broad warmwater (the
  "Douglas fringe trout" reading did not survive); Nolichucky warmwater + episodic Erwin brood
  trout; Pigeon at Hartford — no TWRA row, NC's Hatchery-Supported list ends at Canton (drift-down
  only, medium); Little Tennessee TN reach warmwater with the Chilhowee-release fringe.
- **Pending-add:** cherokee-tailwater (confirmed, Nov–Apr), paint/rocky-fork/bald/north (wild/DH
  mixtures, high), big-soddy (DH Nov 1–Feb 28), green-cove pond (stocked TWRA pond, no permit),
  south-chickamauga + conasauga (warmwater in TN — trout are a GA story).

---

## 5. Corrections & conflicts with current catalog data

Owner decision list — full detail in [SPECIES-CLASSIFICATION.md](./SPECIES-CLASSIFICATION.md)
§Corrections; the machine-readable flags live in `proposed-waters-2026-09.yaml` (`flags:` per row).

| # | Water(s) | Finding | Recommendation |
|---|---|---|---|
| 1 | dale-hollow-lake | "Famous put-grow-take brown fishery" rejected (rainbow winter program; one Apr brown row = footnote) | keep `trout`/stocked; fix note |
| 2 | south-holston-lake | TWRA stocks the lake (rainbow + lake trout) — contradicts 2026-09-08 `warmwater` ruling | FLIP-BACK to `trout-stocked` |
| 3 | watauga-lake / fort-patrick-henry-lake / wilbur-lake | On the reservoir stocking list (fetched) | `trout-stocked` |
| 4 | tellico-lake | Upper-arm-only rainbow fringe (~4,500/yr below Chilhowee Dam) | `trout-stocked`, reach-limited, medium |
| 5 | duck-river-tailwater | TWRA page: stocked Nov–Jun, >70°F summer kill — contradicts owner 2026-09-04 year-round note | `yearRound: false` (re-review) |
| 6 | piney-river-rhea | DH removed eff 2026-08-01 → the `yearRound: true` DH-gate call is invalid | `false` |
| 7 | powell-river | Wild-trout note uncorroborated; documented identity = smallmouth + 20-in SMB reg | `unknown-need-evidence` + re-review |
| 8 | obed system + new-river/clear-fork/sf-cumberland/e-fork-stones | Catalog wild-trout claims lack primary corroboration (NPS lists no trout; none on the wild list; none stocked) | `unknown-need-evidence` + re-review; beware TWRA's own Obed/Obey conflation |
| 9 | french-broad-river, emory-river | Fringe-trout / wild-upper claims not corroborated | `warmwater` |
| 10 | little-buffalo-river | On the spring schedule (Lawrence Co) | `trout-stocked` (not warmwater-only) |
| 11 | mccutcheon-creek | Stocked reach = Columbia/Maury Co, not Manchester | note fix |
| 12 | bradley-creek | Woods Reservoir tributary, not stocked | `warmwater` |
| 13 | white-oak / hurricane / standing-rock | Stocked rows are Region-1 TN River-bend streams, not Plateau waters | IDENTITY CHECK (geometry lane) |
| 14 | wolf-river-fentress | Spring-stocked rainbow (schedule row), not wild-only | `trout-stocked` |
| 15 | beaverdam-creek | No brook evidence | species = rainbow + brown |
| 16 | gulf-fork/trail-fork-big-creek | EBTJV: Cocke Co, atlas metadata says Greene | geometry/label flag (not this lane) |
| 17 | north-chickamauga-creek | No special reg ≠ unstocked — TWRA + Conservancy stock it seasonally | `trout-stocked` (seasonal) |
| 18 | obey-river | Secondary species conflicted (brook vs brown) | assert rainbow; resolve later |
| 19 | caney-fork / elk-river | 4 species each (schedule JSON understates) | add brook + cutthroat |
| 20 | cherokee-tailwater (pending) | Window is continuous Nov 1–Apr 30 | `yearRound: false` |
| 21 | shoal-creek | No TWRA row of its own (scheduled water = East Fork Shoal Creek) | identity check |
| 22 | (atlas gap) | McKenzie City Park (Carroll Co) missing from Region-1 winter set | candidate add |

---

## 6. Method, sources, and what could not be resolved

Research ran as six source-family scopes (TWRA-official; East wild/brook; East tailwaters+TVA;
Middle TN; West TN; contested-waters corroboration), each writing per-claim notes with URL +
access date + fetch status to [`_notes/`](./_notes/). tn.gov rate-limits were worked around with
retries, the stockings datatable JSON (616 rows), Wayback snapshots of exact tn.gov URLs, and
search-verbatim snippets (flagged per claim). TVA.com 403'd both fetch paths — TVA facts cite
TWRA where-to-fish pages instead. **Unresolved, with exactly what's missing:** a TWRA line-item
for the upper Ocoee; Emory/Clear-Fork wild-list entries (they do not exist on the current list);
which NC program (if any) covers the Pigeon at Hartford; the Nolichucky brood-stocking cadence;
current-year Chilhowee reservoir numbers; Hiwassee DH end-date wording (Feb 28 vs Mar 1) for the
2027-28 cycle. The full per-water classification — 148 atlas + 17 pending-add waters, each with
classification, species, yearRound, confidence, and citation — is
[`SPECIES-CLASSIFICATION.md`](./SPECIES-CLASSIFICATION.md); the approvable data is
[`proposed-waters-2026-09.yaml`](./proposed-waters-2026-09.yaml).
