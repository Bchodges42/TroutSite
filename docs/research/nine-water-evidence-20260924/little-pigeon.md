> CORRECTION (lead session, 2026-09-24): the TRACE handle for Doosey 2001 is utk_gradthes/6568 (the 42904 id below 404s). The bitstream URL was downloaded and text-verified; the concurrent session reports it matches the repository's published MD5 c81eedbdb7aaa1106437c661c3c7e5b4.

# Little Pigeon River MAIN STEM (Sevierville → French Broad / Douglas Lake) — Trout Evidence Research Log

Researcher: ZCode subagent. Retrieval date for all sources: 2026-09-24.
Reach discipline: MAIN STEM ONLY = from the West Prong / upper-main confluence at Sevierville (~35.870 N, -83.570 W) downstream (north) to the French Broad River / Douglas Lake backwater (~35.93 N, -83.585 W). Hydrology note: Doosey (2001) defines "LPR proper" as beginning at the Middle Prong / East Fork confluence ~5 river miles EAST of Sevierville; Sevierville sits at RM 5.0 near the West Prong mouth; mouth at French Broad RM 26.3. The user's "main stem" = Doosey's LPR proper RM ~0–5. Evidence from W. Prong (WPLPR), M. Prong (MPLPR), E. Fork (EFLPR) is flagged PRONG and not counted for the main stem.

Bottom line up front: NO TWRA stocking destination and NO fish-survey record places trout in the main stem below Sevierville. Every broad survey (Doosey 1999–2001; GBIF/museum aggregates; iNaturalist; USFWS 2025 incidental) shows a warmwater community (smallmouth bass, redhorse, sunfish, minnows) with trout recorded only at/above the reach boundary. TWRA's own 2026 schedule, recently-stocked feed, stocking-points GIS, and 2017–2027 Trout Management Plan all omit the main stem. Classification recommendation: WARMWATER-FOCUS.

---

## Lane 1 — Agencies / datasets

### 1.1 TWRA live trout stocking page (planned + recently stocked)
- Title/URL: "Trout Information & Stockings", https://www.tn.gov/twra/fishing/trout-information-stockings.html (retrieved 2026-09-24)
- Underlying data files (fetched directly):
  - Recently-stocked table JSON (Region, Destination, Stocking Date; 10 rows, Aug–Sep 2026): https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable.exceldriven.json — only Pigeon entry: `{"Region":"4","Destination":"West Prong Little Pigeon River (Gatlinburg)","Stocking Date":"09/17/2026"}`. No main-stem destination.
  - Tentative 2026 schedule JSON (columns REGION, COUNTY, LOCATION, TYPE, STOCKING DAY, STOCKING WEEK, STOCKING MONTHS, SPECIES; 616 rows): https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json
  - Sevier County rows (72 total): "Gatlinburg Streams" (Weekly/Delayed Harvest, rainbow, year-round dates), "Mid. Prong Little Pigeon River" (Seasonal rainbow: weeks of 2/15, 3/1, 3/15, 3/29, 4/12, 4/26, 5/10, 5/24, 10/25, 11/8/2026), "W. Prong Little Pigeon R. (Pigeon Forge)" (same seasonal rainbow dates plus 1/4/2026).
  - ZERO rows naming plain "Little Pigeon River" / "LPR" / a Sevierville main-stem destination. (PRONG evidence for W. Prong and M. Prong; main-stem omission is planned-schedule evidence against a main-stem put-and-take fishery.)
- Source type: agency stocking schedule (planned ≠ completed). Confidence: high for what it names/omits. Supports: TWRA does not plan main-stem trout stocking. Does NOT establish: absence of trout.

### 1.2 TWRA Tennessee Trout Management Plan 2017–2027 (PDF)
- URL: https://www.tn.gov/content/dam/tn/twra/documents/fishing/Tennessee-Trout-Management-Plan-2017-2027.pdf (retrieved 2026-09-24; 60 pp.)
- Full-text search: "Pigeon" — zero hits. "Gatlinburg" hits (pp. 11, 20–21) concern the City of Gatlinburg trout farm / delayed-harvest program on Gatlinburg (West Prong) streams; production "Gatlinburg (6,600)" (p. 21). No main-stem program, survey, or management mention.
- Source type: agency management plan. Confidence: high. Supports: no TWRA trout management role on the main stem.

### 1.3 TWRA stocking locations ArcGIS FeatureServer / 2023 Pigeon Forge announcement / archived feed
- Already in hand from prior pass (not re-verified here beyond consistency with 1.1): ~25 GIS stocking points on W. Prong, ~16 on M. Prong, zero on main stem; 2024 archived feed shows only prong destinations. Consistent with everything fetched fresh today (1.1). No new evidence.

### 1.4 Water Quality Portal (WQP/STORET/NWIS) — stations on the main stem
- Query: https://www.waterqualitydata.us/data/Station/search?huc=06010107&streamName=Little%20Pigeon%20River&mimeType=csv (retrieved 2026-09-24; 781 stations returned, filtered to main-stem bbox 35.84–36.01 N, -83.63 to -83.33 W)
- Main-stem TDEC stations found (org TDECWPC / TDECWR_WQX), codes "LPIGE" = river miles upstream of mouth:
  - LPIGE000.7SV (35.9287, -83.5850), LPIGE002.2SV (35.9092, -83.5836), LPIGE002.6SV (35.9011, -83.5832), LPIGE004.5SV (35.8747, -83.5747, just below the confluence), LPIGE006.6SV (35.8682, -83.5490), LPIGE010.0SV (35.8600, -83.5036)
  - Legacy USGS-type stations: 03470000 "Little Pigeon River at Sevierville" (35.8784, -83.5777, main stem proper); 03469200 "L Pigeon R ab W Prong nr Sevierville"; 03469000+ are French Broad/Douglas (different water).
- Fish-relevant results: Result queries at the six LPIGE stations returned ZERO rows (characteristicType=Biological; and unrestricted query at LPIGE004.5SV returned 0 rows) — i.e., WQP holds chemistry/none for these stations, no fish assemblage data. Narrow value: shows who samples where, not species.
- Confidence: high (dataset-level). Supports: TDEC has monitored the main stem at 6 stations but WQP carries no fish data for them.

### 1.5 USGS NAS (nonindigenous aquatic species), Sevier County TN
- Query: https://nas.er.usgs.gov/api/v1/occurrence/search?state=TN&county=Sevier&limit=200 (retrieved 2026-09-24; 47 records)
- Trout records in Sevier County: Oncorhynchus mykiss at (a) 1939 "river or creek … just north of Little River (Tomahawke Prong?)" [HUC12 Upper West Prong — outside basin/PRONG-adjacent], (b) GSMNP stocked-status records 1996–2008 (Ash Camp Branch, Le Conte Creek, Lynn Camp Prong, Mannis Branch, Sams Creek — park headwaters), (c) no-locality 2017/2021/2024 records in HUC12s "Upper West Prong Little Pigeon River" and "Goshen Prong-Little River". Salmo trutta 2018 no-locality, HUC12 Goshen Prong-Little River.
- Main-stem HUC12 "Lower Little Pigeon River" records — ZERO trout; instead: Lepomis auritus 1984 "Little Pigeon River; At 200 m Below Dam at Gravel Co, Sevierville, South East End" (established); Corbicula fluminea 1988 "Little Pigeon River, ca. 4 miles W. Sevierville (Along Rt. 66)" (main-stem crossing); Cyprinus carpio 1997–2000; Noturus insignis 1964 "East Fork … just above conjunction with Little Pigeon River below dam at Sevierville".
- Source type: government database aggregation (museum + agency). Confidence: high for absence of trout records, moderate for completeness. Supports: no trout occurrence record on the main stem in the national archive; community = warmwater.

### 1.6 USGS gauges
- 03470000 "Little Pigeon River at Sevierville, TN" (35.8784, -83.5777) and 03469130 "Little Pigeon R nr Sevierville" exist in NWIS via WQP station dump (1.4). Gauge lane adds no fish data; not pursued further (time-boxed).

### 1.7 TVA Douglas Reservoir
- TVA.com "Douglas Reservoir" page bot-blocked (403) on retrieval; TVA monitoring via search summary: forebay French Broad RM 34.5 + mid-reservoir (reservoir-scale ecological health monitoring; fish assemblage monitoring is reservoir-focused). 44-ft seasonal drawdown (summer pool ~990 ft; winter ~946 ft).
- Reach note: at summer pool the Douglas embayment backs up the lower Little Pigeon; TDEC's mile-0.7–2.6 stations (35.90–35.93 N) sit in the alternately riverine/lacustrine zone; the Sevierville reach (RM ~5) is riverine year-round. TVA lane: thin for this specific reach; log as largely unproductive for main-stem fish composition.

### 1.8 USFWS "Searching in Sevierville" (verified; already in hand)
- URL: https://www.fws.gov/story/2025-09/searching-sevierville (published 2025-09-17; survey date August 20, 2025; authors Erwin NFH + Asheville ESFO staff: Jason Mays, fish biologist Emmet Guy; story by Rebekah Ewing)
- Snorkel surveys: West Prong (upstream of US-441 bridge to its mouth) then downstream along the Little Pigeon mainstem below the confluence. Mussels: 5 spp. W. Prong (Pocketbook, Tennessee Pigtoe, Flutedshell pictured) + all W. Prong species plus Purple Lilliput on the mainstem. Fish observed INCIDENTALLY on the mainstem: "redhorses, hogsuckers, bass, sunfish, and a variety of minnow" — no trout noted.
- Source type: federal agency field story (mussel-targeted; incidental fish list — NARROW per standards, not a full community survey). Supports, weakly: 2025 main-stem fish observation = warmwater assemblage, no trout mention.

### 1.9 TDEC 305(b)/303(d)
- TDEC reports page URLs 404'd on 2026-09-24 (https://www.tn.gov/environment/program-areas/wr-water-resources/water-quality-reports--publications.html and variant); direct 303(d) PDF not retrieved — UNPRODUCTIVE lane this pass.
- Indirect (Doosey 2001, quoting Denton et al. 2000 = TDEC 305(b)): "The entire length of the MPLPR from the GSMNP boundary downstream to the confluence with EFLPR and the LPR proper from Sevierville upstream is listed as fully supporting." (i.e., below Sevierville had a different/no full-support designation then; causes elsewhere in the watershed: pathogens, siltation, nutrients, habitat.) Regulatory label ≠ species presence; logged for context.

## Lane 2 — Academic

### 2.1 Doosey, Michael H. 2001. "Fishes of the Little Pigeon River system, Sevier County, Tennessee." Master's thesis, University of Tennessee, Knoxville (December 2001). — THE ANCHOR SOURCE
- Landing: TRACE handle 20.500.14382/42904 (https://trace.tennessee.edu/utk_gradthes/42904/ via DSpace API uuid eb2cf317-17e7-47b2-a904-ec3df68843cf). PDF (29.5 MB): https://trace.tennessee.edu/server/api/core/bitstreams/ccbaf563-f235-4d25-8e78-e19653557629/content (retrieved 2026-09-24).
- Scope/method: system-wide census 1932–2001; new field work May 1999–October 2001; 410 total collections compiled; 125 new collections, 78 species collected; seines (multiple mesh), backpack electrofishing, BOAT ELECTROFISHING ("boat shocking"), angling, occasional snorkeling; "stream segments were sampled in all habitats until no new taxa were captured"; larger streams sampled "by up to 20 collectors or with boat shocking equipment". Vouchered museum material; annotated species list + per-species locality maps (Figs A1–A55) + occurrence by watershed (Table 1, columns WP / MP / EF / LPR).
- Reach match: EXCELLENT for main stem. "The fourth section, referred to as LPR proper, is the main channel … begins at the confluence of MPLPR and EFLPR and ends at its confluence with the French Broad River." Sevierville at RM 5.0; Gists Creek mouth RM 1.0; Middle Creek RM 5.5. Main channel of the LPR explicitly named an under-collected priority area that received new 1999–2001 effort.
- Main-stem sampling documented by species accounts: Pylodictis olivaris (flathead) "taken from the lower portion of LPR near RM 2.0 first in 1997 and again in 2000 and 2001 … only collected during boat shocking efforts"; Lepisosteus oculatus (spotted gar) "known from the LPR downstream of the mouth of WPLPR … collected by boat shocking on 5 July 2000 and again in 2001"; Ichthyomyzon castaneus at LPR RM 3.0 (2000) and RM 8.2 (2001); smallmouth bass "wide ranging and abundant in the LPR system."
- TROUT FINDINGS (per species accounts):
  - Oncorhynchus mykiss (rainbow; introduced; NPS stocking in GSMNP ended 1974): "In the MPLPR, TWRA still stocks rainbow trout from Pittman Center downstream to about the mouth of Bird Creek (TWRA 1999)" — PRONG stocking. "The furthest downstream record of O. mykiss is from LPR proper just east of Sevierville." — i.e., at/above the TOP of the user's main-stem reach (RM ~5–7, upstream/east of the West Prong confluence); NO record below Sevierville. Table 1 marks O. mykiss X in WP, MP, EF, and LPR (the LPR X = that east-of-Sevierville record).
  - Salmo trutta (brown): "very rare in the LPR system … only been collected from MPLPR and Webb Creek" (Webb Creek = MPLPR tributary); first collected 1994. Table 1: single X in MP. NOT in main stem.
  - Salvelinus fontinalis (brook; only native salmonid): "currently restricted to the headwater streams within and around the GSMNP" (largest populations Road and Walker Camp prongs = WPLPR headwaters). Table 1: X in WP, MP, EF; NOT LPR.
- Limits: 1999–2001 data — not current; non-detection in lower main stem came from habitat-targeted community sampling, not trout-targeted counts; "just east of Sevierville" rainbow record sits exactly at the reach boundary (if classified downstream of the confluence zone it would be a single, top-of-reach occurrence, plausibly coldwater-influenced by the EFLPR/MPLPR, not the put-and-take main stem).
- Confidence: HIGH. Supports: broad, method-documented community surveys of the main stem (1997–2001, boat electrofishing on the lower reach) that produced a 92-species system list with ZERO trout recorded below Sevierville. Meaningful evidence AGAINST a main-stem trout population in that period. Also the only explicit TWRA-stocking citation for the system names the MIDDLE PRONG (Pittman Center → Bird Creek mouth).

### 2.2 Other academic leads
- Crossref / Semantic Scholar (rate-limited) / WorldCat: no additional Little Pigeon fish-assemblage papers surfaced this pass. Etnier & Starnes (1993) The Fishes of Tennessee French Broad drainage accounts — not separately retrieved; Doosey supersedes for system-level detail (he cites Etnier 1997, Etnier & Starnes 1993). Keck 2009 UT dissertation (Nothonotus darters) surfaced in the same TRACE search — darter systematics, no main-stem trout relevance.
- J. Tennessee Academy of Science / Southeastern Fishes Council: not searched to depth this pass (time-boxed); Doosey's bibliography (in PDF) is the gateway. Logged as partially covered.

## Lane 3 — Collections / occurrences

### 3.1 GBIF occurrence aggregates
- Query A: https://api.gbif.org/v1/occurrence/search?q=%22Little%20Pigeon%22&country=US&class=Actinopterygii (fields: species, waterBody, lat/lon, year, datasetName; ~50+ fish records retrieved 2026-09-24)
  - Fish taxa at "Little Pigeon" waterbody: Campostoma anomalum, Semotilus atromaculatus, Luxilus coccogenis, Nocomis micropogon, Notropis leuciodus, N. rubricroceus, N. micropteryx, N. telescopus, Rhinichthys atratulus, R. cataractae, Hypentelium nigricans, Etheostoma flabellare, E. rufilineatum, Cyprinella spiloptera, Percina evides, etc. — ALL warmwater/coolidge-warmwater species.
  - Only trout records: 2 × Oncorhynchus mykiss, 1960, waterbody "Little pigeon river", locality "FIGHTING CREEK (TRIBUTARY OF WEST PRONG …) AT ROUTE 73 … SOUTHWEST OF GATLINBURG" and "FIGHTING CREEK, 2.1 MILES SW OF GATLINBURG BEHIND PARK HEADQUARTERS" — PRONG (West Prong tributary, GSMNP HQ), NOT main stem.
  - Museum-georeferenced Sevier sites: NCSM 1976 "Little Pigeon R." 35.831, -83.476 (West Prong corridor between Pigeon Forge and Sevierville — PRONG); 2003 records 35.7435, -83.4158 (Greenbrier/Middle Prong area — PRONG); NCSM 1975 Micropterus dolomieu "Middle Prong … ca. 14.1 km E center Gatlinburg" (PRONG).
- Query B: trout taxa (Salvelinus fontinalis, Salmo trutta, Oncorhynchus mykiss), county=Sevier, state=TN (125+ records inspected; list at C:\Users\Benjamin\.zcode\cli\exec\...\call_f90394977b974814a34aecaf-stdout.log): ZERO trout records inside main-stem bbox (35.84–36.01 N, -83.63 to -83.33 W). Brook trout cluster at GSMNP elevations; rainbow/brown at park/Pigeon Forge latitudes.
- Query C: Micropterus dolomieu county=Sevier: 2 records (2026, iNaturalist) inside main-stem bbox (35.881/-83.578; 35.9091/-83.5821) — warmwater community present on the reach per the same datasets that contain no trout there.
- Source type: aggregated museum/citizen-science occurrences (coverage check passed: the same queries DO return fish for the reach). Confidence: moderate-high. Supports: no trout occurrence record on the main stem from 1939–2026 in GBIF; smallmouth present.

### 3.2 iNaturalist
- Smallmouth bass within 10 km of 35.90, -83.57 (API query, retrieved 2026-09-24): 14 research-grade observations 2020–2026, multiple placed ON the main stem: obs 73654943 (2021-04-11) "Little Pigeon River, Sevierville" (-83.5678, 35.8703); obs 44781278 (2020-05-03) "Little Pigeon River, Sevierville" (-83.5506, 35.8700); obs 62419199 (2020-10-12, -83.5798, 35.9380 — lower reach); obs 360574018 (2026-05-11 Old Knoxville Hwy); obs 379867458 (2026-07-09 North Pkwy); etc.
- Trout within the same radius: Oncorhynchus mykiss 0; Salmo trutta 0; Salmonidae (any) 0.
- Source type: citizen-science occurrence platform (opportunistic — imperfect detection). Confidence: moderate. Supports: active main-stem warmwater (smallmouth) fishery documentation 2020–2026 with zero salmonid records in the same area/period.

### 3.3 Fishbrain / VertNet / FishNet2 / eDNA
- Fishbrain public pages are JS-rendered (no species content server-side; two URL patterns attempted) — UNPRODUCTIVE this pass. Prior-pass summary "top species smallmouth bass, rainbow trout" cannot be reach-resolved; rainbow-trout entries likely reflect the stocked prongs/gatlinburg — treat as LEAD only.
- VertNet/iDigBio/FishNet2 not separately queried (GBIF aggregates these); eDNA searches: none found for this reach (no hits in web searches run). Logged as unproductive/not-productive lanes.

## Lane 4 — Local / community

### 4.1 Visit Sevierville (official tourism)
- Page: "World-Class Fishing in Sevierville, Tennessee", visitsevierville.com (exact blog URL 404 on direct fetch; quote via search snippet retrieved 2026-09-24): "The Little Pigeon River is considered a trophy smallmouth bass fishery. It is at lower elevation and gets a tad too warm to sustain trout during the warmer [months]."
- Source type: local tourism authority (non-government, but the county's official marketing body — reach-general "Little Pigeon River" at Sevierville = main stem). Confidence: moderate (snippet-level quote; page not re-opened). Supports: local-official fishery identity = warmwater; thermal barrier named.

### 4.2 Sevierville Smallmouth King tournament
- TourneyX listing "Sevierville's Smallmouth King 2026" (June 6–7, 2026), hosted by the Sevierville Chamber of Commerce. Annual main-stem-oriented smallmouth tournament. Supports: established warmwater-fishery identity. (URL: tourneyx.com listing; retrieved via search 2026-09-24.)

### 4.3 YouTube (dates; exact reach where stated)
- "Smallmouth | Fly Fishing Little Pigeon River Sevierville" — SJ Outdoors, May 4, 2018, https://www.youtube.com/watch?v=1pkU0oCoDJs. Title fixes reach (Sevierville) and species (smallmouth). Supports main-stem warmwater fly fishing.
- "Trout Fishing on the Little Pigeon River in Tennessee" — The Sellers Life, May 7, 2017, https://www.youtube.com/watch?v=Kjwq_LztZ9Y. Description: "Fishing today in the little pigeon river for smallmouth and rainbow trout." — LEAD ONLY: reach NOT stated; "Little Pigeon" colloquially covers the Gatlinburg/Pigeon Forge prongs (stocked weekly). Cannot be attributed to the main stem; could also be a washdown/holdover. No corroboration found.
- "Heavy fishing pressure on the Little Pigeon river. Surprise fish caught!" — Farm Living, Sep 25, 2022, https://www.youtube.com/watch?v=uSOPWQtbGY4. No description; species/reach unverified. LEAD ONLY, no corroboration.
- Source type: community video (firsthand detail available only in video bodies, not reviewed frame-by-frame this pass). Never dismissed for being non-government; simply reach-unresolved.

### 4.4 Guides / shops / forums / Facebook
- Coastal Angler Magazine (Oct 31, 2018) "World Class Smallmouth on the West Prong of the Little Pigeon" — PRONG-reach guide report; smallmouth abundant/large; prime April–early June. Confirms guides market the SYSTEM as smallmouth water.
- Smoky Mountain River Rat (Aug 7, 2016) smallmouth guiding on "the Pigeon" — different river (Pigeon River proper) mostly; flagged, not used.
- No fly shop/club report found that names a stocked or wild trout fishery on the Sevierville main stem. Logged: shops lane unproductive for positive trout evidence.

## Lane 5 — Historical / physical

### 5.1 Wayback Machine — TWRA stocking pages
- CDX query (retrieved 2026-09-24): captures of tn.gov/twra/fishing/trout-information-stockings.html 2018-01→2026-08.
- Capture 2024-06-07 (https://web.archive.org/web/20240607134309/https://www.tn.gov/twra/fishing/trout-information-stockings.html): recently-stocked entry "Little Pigeon River (Pigeon Forge) 05/15/2024 05/20/2024" = W. Prong (Pigeon Forge qualifier); regulatory text mentions ("Little Pigeon River from Park Boundary to Gnatty Branch…", "North Park Lane Bridge (Herbert Holt Park) downstream…") = Gatlinburg West Prong city-water definitions. No plain main-stem destination in 2024 capture. (Wayback of the underlying datatable JSON URL itself 404'd; page-level HTML used instead.)
- Older (pre-2010) TWRA lists: not retrievable this pass (older page formats); Doosey's citation "TWRA 1999" is the earliest direct stocking-destination documentation found, and it names the MIDDLE PRONG (Pittman Center to mouth of Bird Creek).

### 5.2 Douglas Lake backwater limits / riverine extent
- TVA: Douglas varies ~44 ft summer-to-winter (summer pool ~990 ft). Geometry from station network: full-pool embayment reaches up the Little Pigeon past the mile-0.7–2.6 stations (~35.90–35.93 N); the Sevierville reach (RM ~5, 35.87 N) is riverine year-round; winter drawdown re-exposes the lower reach as riverine. Doosey: LPR empties into French Broad at French Broad RM 26.3 (4 mi downstream of Douglas Dam); mouth-area species (flathead, gar, drum, gizzard shad) confirm the lower main stem's warm, slack-to-moderate character with reservoir interchange.
- Implication: any "trout" in the extreme lower reach could also be Douglas tailwater/reservoir-origin fish moving in — but no records show any.

### 5.3 Temperature context
- Doosey/TDEC: main stem is in the Ridge and Valley at lower elevation (Sevierville ~850 ft), warmwater-dominated community to the mouth; Visit Sevierville states summer temperatures exclude trout. USFWS (Aug 2025) noted mainstem water "cooler" than West Prong at the confluence zone but still a mussel/redhorse assemblage. Quantified temperature series not retrieved (unproductive this pass).

---

## Searches / queries run (35+ distinct; unproductive marked)

Web searches: (1) TWRA stocking "Little Pigeon" Sevierville main stem; (2) "Little Pigeon River" Sevierville fish survey species list; (3) trace.tennessee.edu Doosey thesis; (4) TDEC French Broad biorecon IBI [RATE-LIMITED, unproductive]; (5) TDEC 303(d) 2024 Little Pigeon segment [PDF not retrievable, partially productive → TDEC WQX site ref]; (6) TVA Douglas "Little Pigeon" embayment [thin]; (7) Fishbrain Sevierville [rate-limited]; (8) Visit Sevierville smallmouth "too warm" (productive); (9) visitsevierville exact-phrase re-search (partial).
Direct fetches/datasets: (10) TWRA stocking page + recently-stocked JSON + 2026 tentative-schedule JSON; (11) Wayback 2018–2026 CDX + 2024-06-07 page capture; (12) TWRA Trout Mgmt Plan PDF full-text; (13) WQP station search HUC 06010107 "Little Pigeon River"; (14) WQP biological results @ 6 LPIGE stations [EMPTY]; (15) WQP all results @ LPIGE004.5SV [EMPTY]; (16) USGS NAS Sevier County API; (17) GBIF waterbody query; (18) GBIF q="Little Pigeon" US; (19) GBIF fish-taxa roll-up; (20–22) GBIF trout taxa per-species Sevier + bbox filters; (23) GBIF Micropterus/Lepomis/Actinopterygii bbox; (24) iNaturalist smallmouth API near 35.9/-83.57; (25–27) iNaturalist rainbow/brown/Salmonidae API same radius [ZERO]; (28) TRACE DSpace API discovery; (29) Doosey PDF + TEXT bitstreams; (30) Doosey text greps (trout accounts, methods, Table 1, RM descriptions); (31) USFWS story fetch; (32) YouTube search + 3 video-detail fetches; (33) Fishbrain public pages [JS-blocked, unproductive]; (34) Crossref/WorldCat/Semantic Scholar/Tulane [unproductive for thesis]; (35) DuckDuckGo/Bing/Google HTML [blocked]; (36) TVA Douglas page [403]; (37) TDEC reports pages [404]. Additional search-engine retry loop covered rate-limited queries.

## Recommendation

**WARMWATER-FOCUS** (smallmouth bass), with a cool-season caveat, not "seasonal-stocked," and not "unresolved."

Reasoning: (a) TWRA's complete 2026 stocking schedule, its recently-stocked feed, its stocking-point GIS, the 2017–2027 Trout Management Plan, and archived 2024 captures all name ONLY the prongs (W. Prong Pigeon Forge/Gatlinburg, M. Prong Pittman Center) — zero main-stem destinations across every planning artifact; Doosey's cited 1999 TWRA report likewise stocks only the Middle Prong. (b) The one broad, method-documented, vouchered fish census that intensively sampled the main stem (Doosey 2001: 1997–2001 boat electrofishing at RM 2–3, 410 collections system-wide) recorded NO trout below Sevierville and put the system's furthest-downstream rainbow at the reach's upper boundary ("LPR proper just east of Sevierville"); browns only Middle Prong/Webb Creek, brooks only park headwaters. (c) GBIF, NAS, and iNaturalist all contain warmwater records for the reach and zero trout records within it (2003–2026). (d) The county's own tourism authority and an annual chamber smallmouth tournament define the reach as a trophy smallmouth fishery that "gets too warm to sustain trout." Caveat for the map: washdown/holdover trout from the two heavily stocked prongs can appear below the Sevierville confluence, especially late winter–spring, and the Douglas embayment can interchange fish at the mouth; a single angler video claims rainbows alongside smallmouth on "the Little Pigeon" (reach unstated). Those justify a caveat note, not a stocked-trout classification.

Key remaining gap: a modern (post-2001) TWRA or TDEC fish-community sample of the Sevierville–Douglas reach would settle "current conditions." TWRA Region 4 aquatic-resources staff (boat-electrofishing programs) most likely hold any settling record; TDEC's six LPIGE main-stem stations (chemistry-only in WQP) are the second custodian. A records request is out of scope here (no-contact rule).
