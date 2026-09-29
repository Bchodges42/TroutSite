# Watauga River — Watauga Dam to Wilbur Lake reach (Carter County, TN): evidence repair log

Water under test: the short riverine reach between Watauga Dam and Wilbur Lake ("Wilbur Reservoir"), Carter County, TN.
Reference points: USGS 03483950 "Watauga River below Watauga Dam" (36.33011 / -82.12596, NAD83, HUC 06010103); USGS 03483600 "Watauga River below Watauga spillway tunnel" (36.32789 / -82.12040).
Retrieval date for all sources: 2026-09-24. Research only; no agency/business/author contact.

## 0. Geography settled first (needed for reach-binding)

- **OSM/Overpass geometry** (Overpass API, overpass-api.de, retrieved 2026-09-24):
  - Watauga Dam mapped at (36.32272, -82.12253); Wilbur Dam at (36.34091, -82.12657) — straight-line 2.06 km.
  - "Wilbur Lake" polygon (way 43563876, natural=water, water=reservoir, 215 nodes): bbox lat 36.32997–36.34162, lon -82.12731..-82.11444. Lake southern tip is ~0.8 km (straight) below Watauga Dam; the free-flowing river between dam and lake head is roughly 0.8–1.6 km (well under the "~1.5–3 river miles" dam-to-dam figure below).
  - Point-in-polygon tests: TWRA stocking site 714 "Access Area / Picnic Area" (36.33758, -82.12150) is INSIDE the lake polygon; site 713 "Wilbur Dam" (36.34122, -82.12642) sits at the dam face (boundary); site 715 "Campground Area 3" (36.33356, -82.12647) is at/near the west shore by the campground (boundary/land-side). USGS gauges and Watauga Dam are outside (upstream). URL: https://overpass-api.de/api/interpreter (query on way 43563876 and waterways in bbox 36.315,-82.14,36.355,-82.105).
- **TWRA, Management Plan for the Wilbur Tailwater Trout Fishery 2004–2008** (Habera, Bivens, Carter; Nov 25, 2003; Wayback capture 20100529122000 of tn.gov/twra/fish/StreamRiver/tailtrout/Wilbur.pdf): "Wilbur Dam is located about 3 miles downstream of Watauga Dam and impounds a small reservoir."
- **TWRA Region IV Coldwater Trout Report 2023** (Wayback capture 20230820041714 of tn.gov/content/dam/tn/twra/documents/fishing//trout/Coldwater-Trout-Report-R4-2023.pdf): "Wilbur Dam is located 4.5 km (~3 mi.) downstream of Watauga Dam and impounds a small reservoir."
- **TVA Wilbur Dam page** (web.archive.org/web/20260720011054/https://www.tva.com/energy/our-power-system/hydroelectric/wilbur-dam, capture 2026-07-20): Wilbur Reservoir "two rivers [sic — river] miles from Watauga Dam," "surrounded by the Cherokee National Forest."

NOTE ON WATER NAMES: the water between the dams is ONE small impoundment — TWRA calls it "Wilbur Reservoir" (stocking layer + 2010/2020 tailwater schedules), OSM calls it "Wilbur Lake", community calls it "Wilbur Lake". "Wilbur Lake" and "Wilbur Reservoir" are the same sibling water; the reach ABOVE its full-pool head is the water under test.

## 1. TWRA stocking — which rows bind to which reach (PRIMARY EVIDENCE)

### 1a. TWRA_Trout_Stocking_Locations FeatureServer (services3.arcgis.com/PWXNAH2YKmZY7lBq/ArcGIS/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0, query StreamName/Site_Name LIKE %WATAUGA%/%WILBUR%, outSR 4326; retrieved 2026-09-24). 19 rows:
- StreamName "Wilbur Reservoir" (StockingProgram=Tailwater, WaterClass=reservoir, Species=rainbow, Management=TVA, sunrise-sunset hours):
  - OBJECTID 713 "Wilbur Dam", 36.3412222, -82.1264167, NumStocked 250
  - OBJECTID 714 "Access Area / Picnic Area", 36.3375833, -82.1215000, NumStocked 250
  - OBJECTID 715 "Campground Area 3", 36.3335556, -82.1264722, NumStocked 500
  - => ~1,000 rainbow/event delivered INTO Wilbur Reservoir (the lake), at the dam face, the TVA picnic area, and the campground. None mapped in the riverine segment above the lake's full-pool head.
- StreamName "Wilbur Tailwater" (Program=Tailwater, WaterClass=stream): 12 access/monitoring rows from Siam Bridge (36.35107, -82.15462) downstream to Herb Hodge Rd bridge (36.38412, -82.31979). ALL are below Wilbur Dam. Upstream-most tailwater row is ~1.5 river miles below Wilbur Dam.
- StreamName "Watauga Reservoir" (Program=Reservoir, Species=rainbow_brown): 4 rows (Lakeshore Marina 36.32108/-82.06611; Campbell Rd 36.31488/-81.99597; Rat Branch boat ramp 36.30471/-82.11894; unnamed 36.32091/-82.11705) — all in Watauga LAKE above the dam (sibling water).
- NO row carries a Site_Name/StreamName for the dam-to-lake riverine segment. Reach-binding: NEGATIVE for the reach itself; the lake immediately below it IS stocked.

### 1b. Historic layer StockedTrout2016 (same server, layer 0): identical 19 rows (OBJECTIDs 4151-4367) — same three Wilbur Reservoir sites (250/250/500 rainbows), same tailwater and lake rows. The site-level binding is stable since at least 2016.

### 1c. Tailwater_Trout FeatureServer (polyline, 13 rows; retrieved 2026-09-24): Watauga River row (OBJECTID 21, Dam="Wilbur Dam", Species=rainbow, Season="March through July", Shape__Length 98,417) — line geometry runs from END=(-82.31748, 36.39116) to START=(-82.12627, 36.34127). The stocked "Watauga River" tailwater line BEGINS AT WILBUR DAM (matches site 713 exactly) and runs downstream. The dam-to-lake reach is NOT part of the official stocked tailwater geometry. https://services3.arcgis.com/PWXNAH2YKmZY7lBq/ArcGIS/rest/services/Tailwater_Trout/FeatureServer/0/query?where=OBJECTID%3D21

### 1d. Tailwater_Reservoirs FeatureServer (polygon layer; retrieved 2026-09-24): "Watauga Reservoir" Season=Winter, "lake trout, rainbow, brown"; "Wilbur Reservoir" Season="Winter, Spring, Summer", Species=rainbow. Confirms Wilbur Reservoir is managed as a stocked trout water in its own right (sibling lake — stocked CLOSER to the reach than any other water).

### 1e. 2026 machine-readable schedule (tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json; retrieved 2026-09-24 via WebFetch): exactly ONE Watauga/Wilbur row among ~600: LOCATION "Wilbur Tailwater / Watauga River", Region 4, Carter/Washington, TYPE Tailwater, STOCKING MONTHS "M, A, M, J, J, A, S" (Mar–Sep), SPECIES Rainbow Trout. No row for "Wilbur Reservoir/Lake" or the dam-to-lake reach in the 2026 schedule table.

### 1f. Recently-stocked rolling feed (same folder, tn_complex_datatable.exceldriven.json; retrieved 2026-09-24): window 08/25/2026–09/18/2026, 10 rows; contains {"Region":"4","Destination":"Wilbur TW","Stocking Date":"09/03/2026"}. "Wilbur TW" events land at the Wilbur Reservoir sites (1a). No "Watauga River" row in this window (tailwater season Mar–Sep; Sep 3 event consistent).

### 1g. Historic TWRA tailwater table (archived tn.gov/twra/fish/StreamRiver/tailtrout/tailtrout.html, capture 20100529052424; retrieved 2026-09-24): "Watauga River | Wilbur Dam | rainbow/brown/brook | March through September" AND "**Wilbur Reservoir | Watauga Dam | Rainbow Trout | February through May**". TWRA's own 2010 framing: the small reservoir below Watauga Dam was a named, annually stocked (Feb–May) trout water, separate from the river below Wilbur Dam.
- Same pairing in archived tailwater-stocking-schedule.pdf (capture 20200724025911, tn.gov/content/dam/tn/twra/documents/fishing/trout/tailwater-stocking-schedule.pdf): "Wilbur Reservoir | Watauga Dam | Rainbow Trout" and "Watauga River | Wilbur Dam | Rainbow Trout"; also "Watauga River: Quality Trout Fishing Area, Smallings bridge downstream to CSX railroad bridges" regs (14-inch min, 2-fish, artificials) — regs text is entirely below Wilbur Dam.
- reservoir-stocking-schedule.pdf (capture 20200724025913): "Watauga — Brown, Lake, and Rainbow" (the lake above the dam).

## 2. Agency survey/assessment of the reach itself

- **None found.** All TWRA/TTU survey scope statements explicitly begin below Wilbur Dam:
  - Bettoli (TTU), "Survey of the Trout Fishery in the Watauga River, March–October 2002" (Fisheries Report 03-05; Wayback 20100530133508): "The fishery in the 28 km of the Watauga River **below Wilbur Dam** was investigated..." Also documents 2002 stockings: 17,562 catchable browns, 54,812 catchable rainbows, 179,047 fingerling rainbows, 174,166 brook fry/fingerlings — all tailwater program.
  - Bettoli (TTU), "Surveys of the Trout Fisheries in the Watauga River and South Fork Holston River, March–October 2006" (Fisheries Report 07-07; Wayback 20100529121908): same "28 km below Wilbur Dam" scope.
  - Wilbur Tailwater Management Plan 2004-2008 (TWRA 2003): monitoring stations "near Siam Bridge, at the Blevins Bend access area, and near what is now the River Bend Campground in the QZ"; stocking sections discuss the tailwater below the dam; brook trout released in the Quality Zone. No reservoir or upper-reach sampling.
  - Region IV Coldwater Trout Report 2010 (Wayback 20110711182552, "Region 4 2010 Trout Fisheris Report.pdf", 197 pp): Figure 1-2 lists managed fisheries incl. "Wilbur Lake" AND "Wilbur Tailwater" as separate named waters (no Wilbur Lake study section in the text of the sections checked); Wilbur tailwater monitoring = 12 stations "Bee Cliff to Watauga Flats" (2010: station 10.5 added for the Quality Zone). Bee Cliff Rapids (OSM 36.35202, -82.13290) and Watauga Flats are below Wilbur Dam.
  - Region IV Coldwater Trout Report 2023 (Wayback 20230820041714, 69 pp): six R4 tailwaters monitored annually incl. Wilbur; "Sampling ... consists of 600-s runs at each of 12 monitoring stations"; Wilbur = "Bee Cliff to Watauga Flats"; stocking: adult rainbow rate rising 40,000→47,000/yr (2023), fingerling rainbow stocking suspended 2021–(≤2027) to evaluate natural reproduction, 1,630 retired ENFH broodstock (18 in) stocked 2022 "particularly in the reach below Blevins Bend". Plan cited: Habera et al. 2022b (Wilbur Tailwater Trout Fishery Management Plan 2022–2027 — located via search on digitalcommons.memphis.edu/blueridgeguide.org; PDF not retrieved, digitalcommons 403).
  - WJHL (Tri-Cities) news, 2025-03-11 ("TWRA conducts trout population sampling along Watauga", https://www.wjhl.com/news/local/twra-conducts-trout-population-sampling-along-watauga/): Habera: TWRA "stocks the Watauga River tailwater with 43,000 adult rainbow trout"; 12 sampling sites; first sampling after Hurricane Helene; guide Galen Kipar describes the pipe feeding Watauga Lake water into Wilbur Reservoir (sibling lake). No mention of the dam-to-lake reach.
- Weighted negative: the reach sits between a 6,432-acre reservoir and a 108-acre stocked impoundment, is ~1–2 river miles long, and appears in NO TWRA survey, creel, electrofishing, or management document found (2010 report, 2003/2022 plans, 2016–2023 coldwater reports, 1998–2006 TTU surveys). Wilbur Reservoir itself is stocked but also not in the monitoring program (no Wilbur Lake study section).

## 3. Public access reality (is the reach fishable?)

- TVA pages (Wayback captures of tva.com, retrieved 2026-09-24): Watauga Dam page (capture 20211022073143) mentions a "wildlife observation area below the dam" and Tailwater Pursuits generally; Wilbur Dam page (capture 20260720011054) lists no amenities for the reservoir itself; live tva.com is Cloudflare-gated to scripts (403) — cited from captures. TVA "watauga-wilbur-recreation-release-calendar.pdf" pairs the two dams' releases.
- The three Wilbur Reservoir stocking sites (TWRA layer fields: Management=TVA, "Sunrise to Sunset", no 24-hr access) correspond to TVA recreation sites on the lake: Wilbur Dam area, TVA Access Area/Picnic Area, and the campground ("Campground Area 3" — Watauga Dam Campground, 744 Wilbur Dam Rd, Elizabethton; city-operated; sits on Wilbur Lake between the dams; TripAdvisor/GoCampTennessee descriptions: sites "right on the bank of Wilbur Lake," boat ramp, picnic area). Campers/bank anglers fish the LAKE (sibling), not the riverine gap.
- The riverine gap runs between Watauga Dam reservation land (wildlife observation area, dam roads) and the lake head; no named public access, boat ramp, or TWRA access area was found ON the gap itself (no TWRA access row between Watauga Dam and the lake in the stocking/access layer; no put-in found in any guide/forum source). Wading is flash-water: TVA siren/generation regime at Watauga Dam; no maintained trail found.
- Float through the gap: no commercial or community float documentation found (no put-in/take-out pair documented; Wilbur Dam to Siam is the standard put-in for the famous tailwater). American Whitewater search page 404'd (unproductive lane).
- Conclusion: the reach is physically short, road-adjacent (Watauga Dam Rd / Wilbur Dam Rd corridor), but has NO documented formal public fishing access of its own; it is effectively the unsung upper end of TVA's Wilbur Reservoir complex.

## 4. Community evidence (anyone fishing between the dams?)

- **Reddit r/troutfishing "Fishing the Watauga tailgater below Wilbur Dam? (TN)"** (2023-12-18/19; pulled via pullpush.io API, link_id 18lkzsm): all discussion is below Wilbur Dam (dam, bridge by the dam, park, wading near sirens, ontheflysouth link). No one mentions the dam-to-lake reach. (Direct reddit fetch blocked; .json via old.reddit failed; used pullpush mirror.)
- **Trophy Water Guide Service** (trophywaterguideservice.com/watauga-river-fly-fishing; retrieved 2026-09-24): sections described are Wilbur Dam→Hunter Bridge, Hunter Bridge→Watauga River Bluffs, Bluffs→Persinger Bridge. Wilbur Dam is the upstream limit of their water. No "between the dams" water. (A search-engine summary claiming the outfit guides "between the dams" was NOT supported by the page text — contradiction recorded.)
- **East Tennessee Outdoors: "Wilbur Lake Trout – Part 1"** (elizabethton.com, Aug 12, 2019; surfaced via search snippet): angler kept "seven rainbow trout between 17 and 22 inches" after four hours — fishery was WILBUR LAKE (sibling), framing it as the old fishery "Before Watauga Lake, Boone...". Direct article URL 404'd on guessed slug; snippet-level only.
- **OnTheFlySouth "Watauga's Easy Trout"** (ontheflysouth.com/wataugas-easy-trout; via search snippet + Reddit referral): tailwater below Wilbur Dam stocking (brook/brown/rainbow catchables + fingerlings). Sibling.
- **hffbristol.com "Watauga River Tennessee: A 2024 Guide"** (search snippet): "Wilbur Dam Tailwater" is the renowned fly water. Sibling.
- **YouTube**: targeted searches rate-limited out (429s); one indirect search surfaced no "Watauga Dam to Wilbur" fishing video — UNRESOLVED but low-yield lane. The only video-adjacent hit was the elizabethton.com column.
- **Forums**: the earlier search-engine-reported Tapatalk/easttennesseefishing.com threads re a campground "between the two dams" with stocked water were not directly retrievable this pass (rate limits); the campground in question is on Wilbur Lake (sibling), consistent with TWRA's "Campground Area 3" stocking site.

## 5. Occurrence databases

- **GBIF** (api.gbif.org/v1/occurrence/search, bbox 36.31–36.36 N / -82.15..-82.10 E; retrieved 2026-09-24): Oncorhynchus mykiss 0; Salvelinus fontinalis 0; Salmo trutta 26 — nearly all MARIS "OCCURRENCE" HUC-grid records (2005–2007, rounded to 0.01°: 36.34/-82.14, 36.35/-82.13, 36.36/-82.15) = coarse tailwater-area grid cells, plus one 2020 iNat human observation (36.3483, -82.1372 — below Wilbur Dam). NONE resolves inside the reach.
- **iNaturalist** (api.inaturalist.org/v1/observations, box 36.318–36.345 / -82.135..-82.108, 942 obs total; retrieved 2026-09-24): fish observations with precise coordinates:
  - Salmo trutta (Brown Trout) 15123672, 2018-08-04, (36.34299, -82.12794) — BELOW Wilbur Dam (tailwater side). research grade.
  - Lepomis auritus (Redbreast Sunfish) 315614523, 2025-09-21, (36.32177, -82.12011) — at the Watauga Dam base ("Overlooks") — warmwater species immediately below the dam; single casual-ish record, LEAD at best.
  - Ambloplites rupestris (Rock Bass) 250563214, 2024-11-05, (36.31886, -82.12199); Micropterus dolomieu (Smallmouth) 55832962 and A. rupestris 55825640, 2020-06-07, (36.32222,-82.12344)/(36.32157,-82.12378) — all effectively AT/just above the dam (lake side, sibling water).
  - Micropterus punctulatus (Spotted Bass) 374963616, 2026-06-24, (36.31941, -82.11193) — Watauga Lake (sibling).
  - => No trout observation exists in the reach between the dams on iNat. Nearest trout: tailwater below Wilbur Dam and Watauga Lake above (2023 rainbow, "Watauga Lake, Hampton" obs).
- **USGS NAS** (nas.er.usgs.gov/api/v2/occurrence/search?state=TN&county=Carter; 151 records; retrieved 2026-09-24): Rainbow/Brown trout records cluster in the tailwater (e.g., 2018 brown at 36.34299/-82.12794 = same as iNat obs; 2025 rainbow at 36.35083/-82.15384 Siam; gridded MARIS 36.34/-82.14 etc.); "Lake Trout | Watauga River | 1991 (36.35751,-82.15306)" = tailwater oddity (likely washout from Watauga Lake — lake trout stocked there; sibling signal); "Brown Trout | Watauga Reservoir | 1939" historic. NO record inside the reach.

## 6. Synthesis and standards application

- Types of evidence distinct: stocking DESTINATION labels ("Wilbur TW", "Wilbur Reservoir | Watauga Dam") bind to the LAKE (site coordinates prove it), not the reach; the 2026 schedule row binds to the TAILWATER (line geometry starts at Wilbur Dam); neither is evidence of stocking IN the riverine gap.
- Negative evidence is meaningful here: TWRA's stocking site layer (2016 + current), its tailwater line geometry, its monitoring programs (1991–2023), and three decades of TTU/TWRA reports all uniformly begin at or below Wilbur Dam or stay in the lake. A surveyed, stocked fishery in the gap would surface in at least one of these.
- Counter-consideration (why not "no trout at all"): the gap is contiguous with a stocked impoundment (~1,000 rainbows/event at three sites, Feb–May historically; lake stocked "Winter, Spring, Summer" per Tailwater_Reservoirs) and with a 47,000-adult-rainbow/year tailwater below; trout moving through/above the dam face and holdovers from the lake's upper end are plausible. The cold source (deep releases via the spillway tunnel at USGS 03483600) keeps the segment thermally suitable. But plausible presence is NOT a documented fishery: no access point, no survey, no creel, no community report of catch IN the gap.
- Sibling discipline: "Wilbur Lake"/"Wilbur Reservoir" = stocked rainbow lake BETWEEN the dams (documented, TVA-managed banks, campground, 17–22" rainbows reported 2019); "Watauga Reservoir" = stocked lake ABOVE (rainbow/brown/lake trout); "Wilbur Tailwater/Watauga River below Wilbur Dam" = the celebrated stocked fishery (43–47k rainbows/yr + wild browns, Mar–Sep). All three are DIFFERENT waters from the reach under test; most catalog rows and community content for "Watauga"/"Wilbur" belong to these siblings.

## Searches run (2026-09-24; WebSearch via tool + direct API/CDX queries)

Productive:
1. TWRA ArcGIS services list (services3.arcgis.com directory) → found TWRA_Trout_Stocking_Locations, StockedTrout2016, Tailwater_Trout, Tailwater_Reservoirs.
2. ArcGIS query LIKE %WATAUGA%/%WILBUR% (current + 2016 layers) → 19 rows each, coordinates printed.
3. Tailwater_Trout OBJECTID=21 geometry → line starts at Wilbur Dam.
4. 2026 schedule exceldriven.json → single "Wilbur Tailwater / Watauga River" row (M,A,M,J,J,A,S).
5. Recently-stocked exceldriven.json → "Wilbur TW 09/03/2026".
6. Wayback CDX tn.gov/twra/* filter trout → tailtrout.html, Wilbur.pdf, 2002 Watauga.pdf, 2006 creel, R4 2010 report.
7. Wayback CDX tn.gov/content/dam/tn/twra/documents/* → R4 2017–2023 coldwater reports, tailwater/reservoir stocking schedule PDFs, trout management plans.
8. Overpass API (POST, corrected bbox) → dam/lake/river geometry, point-in-polygon.
9. USGS waterservices site metadata (03483950, 03483600).
10. GBIF occurrence API (3 trout species × bbox).
11. iNaturalist API (box queries, iconic_taxa=Actinopterygii).
12. USGS NAS API v2 (Carter County TN).
13. WebSearch: "Watauga Dam" "Wilbur" fishing between dams → reddit thread + campground claims.
14. WebSearch: "Wilbur Tailwater" management plan 2022 Habera → 2022-2027 plan (digitalcommons), WJHL 2025.
15. WebSearch: "Watauga Dam Campground" Elizabethton "Wilbur Lake" trout → campground on Wilbur Lake; TWRA watauga-reservoir where-to-fish page.
16. pullpush.io reddit mirror for thread 18lkzsm.
17. WebFetch of TWRA where-to-fish watauga-reservoir page; TVA pages via Wayback (watauga 2021, wilbur-dam 2026); trophywaterguideservice page; wjhl.com article.

Unproductive / blocked:
- WebSearch rate-limit 429s (recurring; retried across ~10 queries — several lanes only partially covered: YouTube video search, tapatalk/easttennesseefishing thread retrieval, American Whitewater reach list).
- old.reddit .json and www.reddit direct fetch (blocked) → pullpush mirror worked.
- tva.com live pages (Cloudflare "Just a moment" to curl; 403 to WebFetch) → Wayback captures used.
- digitalcommons.memphis.edu (403) → 2022-2027 Wilbur plan PDF not retrieved.
- Overpass GET + inverted bbox (406 / 0 elements) → corrected POST with (south,west,north,east) worked.
- Wayback PDF fetches without id_ suffix returned HTML wrappers → id_ raw mode worked.
- American Whitewater /content/River/search 404.
- elizabethton.com guessed article URL 404 (article exists per search snippet only).
- CDX filter "coldwater" on tn.gov/content/dam path (empty; broader trout filter worked).

## Recommendation

**seasonal-stocked** — but with an important scope correction: the documented seasonal stocking belongs to the two SIBLING waters flanking the reach, not the riverine gap itself. For the reach as drawn (Watauga Dam → Wilbur Lake head):
- TWRA does NOT stock the reach (0 of 19 Watauga/Wilbur stocking rows lie in it; the tailwater line begins at Wilbur Dam; lake sites are at/inside Wilbur Reservoir).
- No agency survey/creel/electrofishing has ever (as far as found) sampled it.
- No formal public access, put-in, or documented community fishery exists for it.
- It is a short cold, fish-bearing corridor whose trout fauna, if present, is derivative (movement from the stocked lake below and tailwater farther below), undocumented, and unmanaged as a distinct fishery.
Best catalog treatment: classify the reach as an unmanaged connective segment of the Wilbur Reservoir/Watauga tailwater complex — NOT a distinct trout destination; if the catalog must carry a fishery label for it, "seasonal-stocked (derivative, undocumented in-reach)" with explicit sibling attribution; secondary use = warmwater/none. Do not import "Wilbur TW" rows, "Wilbur Tailwater / Watauga River" schedule rows, or tailwater guide content as evidence for this reach.

Key gap: a definitive statement of where Wilbur Reservoir's full pool begins relative to Watauga Dam (TVA reservoir info/land-policy map or a TWRA reservoir survey of Wilbur Reservoir). Likely record holder: TWRA Region IV (filed under the Wilbur tailwater program / Habera et al. 2022b plan and the Wilbur Reservoir stocking site records; TVA lands records for the Watauga Dam–Wilbur Dam corridor would hold the access answer).
