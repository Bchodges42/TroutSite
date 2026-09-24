# Research log — EAST FORK STONES RIVER (Cannon/Rutherford/Wilson Co., TN; Cumberland basin, HUC-8 05130203 "Stones" per WQP station records; the Stones drainage sits inside USGS subbasin 051302)
Retrieval/research date: 2026-09-24. Research only; no catalogs, ledgers, or websites changed; no agency/individual contacted.
Scope discipline: EAST FORK ONLY (Woodbury/Short Mountain headwaters → Readyville → Lascassas → Walter Hill Dam → Murfreesboro greenway → J. Percy Priest Reservoir head). West Fork (Nice Mill, Manson Pike), main Stones, and the Percy Priest tailwater are separate waters; each is flagged where it appears.

## Bottom line
NO trout evidence of any kind was found on the East Fork itself: no stocking program, no angler catch, no collection record, no eDNA detection, no regulatory label — across six decades of ichthyological sampling. Multiple independent full-community datasets (museum collections 1963–2023, 2021 eDNA, iNaturalist 2000s–2026) report warmwater assemblages (50+ species incl. sensitive cyprinids/darters) and omit salmonids entirely.

---

## LANE 1 — Agencies / datasets

### 1.1 WQP station inventory (waterqualitydata.us), Rutherford County (countycode US:47:149)
- Org: EPA/WQP harvest of USGS NWIS, TDEC (TDECWPC, TDECWR_WQX), USACE Nashville (USACOEND).
- Retrieval: 2026-09-24. URL queried: https://www.waterqualitydata.us/data/Station/search?statecode=US%3A47&countycode=US%3A47%3A149&mimeType=csv (683 stations; local copy wqp_rutherford_stations.csv)
- East Fork stations found (all chemistry/biology monitoring sites; none trout-related):
  - USGS gauges: USGS-03426900 (below Readyville, 35.8378,-86.1892), 03426910/22/30/40 (Halls Hill), 03426970 (Sharpsville), 03427200 (at Lascassas), 03427300 (below Lascassas), 03427500 (near Lascassas, 35.9184,-86.3339 — the active gauge), 03427725 (at Walterhill), 03427732/33 (below/near Walterhill).
  - TDECWPC STORET: EFSTO009.8RU (Hwy-231 bridge, 35.9416,-86.3769), EFSTO011.3RU (gas line Xing U/S WALTERHILL DAM, 35.9286,-86.3758), EFSTO015.4RU (Betty Ford Rd, 35.9188,-86.3338), EFSTO026.6RU (Guy James Rd), EFSTO028.0RU (upper, Halls Hill).
  - TDECWR_WQX: TNW000002134–2138, 2139, 2140, 7455, 7729, 7914, 8306, 8452, 8453, 8549 (incl. 2137 = 35.9286,-86.3758, the gas-line crossing u/s Walter Hill Dam; 2138 = Betty Ford Rd; 8462 "Reservoir").
  - USACE: 3JPP10030 (East Fork RM 25.4), 3JPP10031 (RM 18.8), 3JPP20007 (0.6 mi u/s mouth of East Fork, 35.9809,-86.4506).
- Source type: agency dataset. Confidence: high (verbatim station metadata).
- Establishes: monitoring infrastructure is dense on the East Fork; USACE samples the East Fork arm. Does NOT establish species presence/absence by itself.

### 1.2 WQP Result data — TDEC fish records on the East Fork (biological profile, Rutherford County)
- Retrieval: 2026-09-24. URL: https://www.waterqualitydata.us/data/Result/search?statecode=US%3A47&countycode=US%3A47%3A149&dataProfile=biological&mimeType=csv (~54 MB; local copy wqp_bio_rutherford.csv)
- Fields: AssemblageSampledName="Fish/Nekton" (273 rows county-wide), SampleCollectionMethod="Electroshock, other", SampleTissueAnatomyName="Fish Fillet, With Belly Flap".
- East Fork fish events (all TDECWR_WQX):
  - TNW000002137 (u/s Walter Hill Dam): 2018-08-08 Micropterus salmoides; 2018-10-05 Ictalurus punctatus; 2018-12-03 Micropterus dolomieu.
  - TNW000002138 (Betty Ford Rd): 2018-10-02 M. salmoides, M. dolomieu, I. punctatus, Ambloplites rupestris.
  - TNW000007455 (Walter Hill area, 35.958,-86.3885): 2018-10-04 M. salmoides, I. punctatus.
  - TNW000008306 (35.9788,-86.4191): 2018-12-03 M. salmoides.
  - TNW000008453 (35.9433,-86.3756): 2022-08-15 Micropterus punctulatus (spotted bass) + M. salmoides.
  - Non-fish biological programs at East Fork stations: SQKICK benthic macroinvertebrate kicks (88 rows; e.g., TNW000002138 in 2023, 2024, 2025, 2026) and periphyton (MPS).
- Source type: agency dataset. Confidence: high for records; LOW inferential weight vs trout (single-species targeted tissue collections, not inventories).
- Establishes: TDEC's fish work on the East Fork (2018, 2022) targeted bass/catfish for contaminant tissue; warmwater taxa only; no salmonid ever recorded in TDEC WQP data for these stations. Consistent with (and refines) the in-hand 2018 tissue records.
- Does NOT establish: absence of trout from a full assemblage list (lists incomplete by design).

### 1.3 TWRA current trout stocking page (tn.gov)
- Org: TWRA. Page: "Trout Information & Stockings". URL: https://www.tn.gov/twra/fishing/trout-information-stockings.html. Retrieval: 2026-09-24 (local copy twra_trout.html).
- Schedule text (2026 season): Stones-related entries are ONLY (a) "W. Fork Stones River - Manson Pike Trailhead" (Rutherford; 2/13/2026, seasonal) and (b) "J. Percy Priest Dam, Stones River — Rainbow — December through March — Statewide Regulations" (tailwater, Davidson/Cumberland side).
- The ONLY "East Fork" on the page is "East Fork Shoal Creek" (Dickson Co., near Montgomery Bell SP/Acorn Lake) — a DIFFERENT water. Identity trap verified and defused.
- Source type: agency schedule (planned stocking). Confidence: high.
- Establishes: no East Fork Stones River destination in TWRA's current winter program; corroborates in-hand 2026-09-22 ArcGIS capture (zero points on East Fork). Planned ≠ completed; but absence of any destination is the operative fact.

### 1.4 TWRA / news on Nice Mill stocking
- WKRN, 2025-01-17, "Nice Mill stocked with rainbow trout in Rutherford County" (via search summary; https://www.wkrn.com). Nice Mill is on the WEST Fork at Smyrna. Williamson Source 2025-11-27: 2025-26 winter program begins, list at tnwildlife.org.
- Establishes: the Rutherford County trout fishery the public sees is West Fork. Does NOT touch the East Fork.

### 1.5 USACE Percy Priest
- WQP USACOEND East Fork arm stations (see 1.1). Draft EA "J. Percy Priest Water Control" (USACE Nashville, July 2026; lrd.usace.army.mil). "Percy Priest Dam and Lake Pre-Impoundment" PDF listed on USACE Nashville historical page (https://www.lrd.usace.army.mil) — NOT retrieved; likely history/photos.
- No USACE fish survey with species list for the East Fork arm found via search. Reservoir-limnology reports exist (ERDC library; Percy Priest Lake Master Plan 1986/2007/2013 at usace.contentdm.oclc.org) — not examined; reach is the reservoir, not the East Fork stream.
- Source type: agency (unexamined leads). Confidence: n/a.

### 1.6 USGS
- Gauge 03427500 East Fork Stones River near Lascassas (active; also used by kayakers as flow reference). Gauges carry no fish data. NAS (nas.er.usgs.gov) API returned HTTP 403 (blocked) — UNPRODUCTIVE; GBIF-based species checks (below) substitute for NAS occurrence checking.

### 1.7 TDEC fish consumption advisory (regulatory context, warmwater-focused)
- TDEC press release 2019-03-14/15: precautionary fish consumption advisory for BASS species, mercury, "portion of the East Fork Stones River" from mouth at upper J. Percy Priest upstream to Betty Ford Road bridge (Rutherford Co.). Reported by WGNS Radio (2019-03-14, "Mercury in Local Fish from the East Fork Stones River"), FOX 17 Nashville (2019-03-14), Main Street Media; TDEC "Posted Streams, Rivers, and Reservoirs in Tennessee" (tn.gov).
- Reach: lower East Fork (exactly the segment with the 2018/2022 tissue sampling).
- Establishes: state management attention on the East Fork is a warmwater contaminant issue; the station geography (2138 = Betty Ford Rd) matches. Does NOT address trout either way. No "trout water" designation exists for the East Fork.

---

## LANE 2 — Academic

### 2.1 Williams, Jacqueline (2022). "Assessing the Linkage Between Aquatic Biodiversity and Water Chemistry in the Stones River Watershed." MTSU thesis. (KEY SOURCE)
- Retrieval: 2026-09-24. DSpace: https://jewlscholar.mtsu.edu/handle/mtsu/6850 (issued 2022-05; item uuid 850033fc-b0fc-4663-983b-2998cb009aae). PDF: WILLIAMS_Jacqueline_S22ThesisFinal.pdf, 40 pp (local copy williams_2022_mtsu_thesis.pdf).
- Method: eDNA metabarcoding (12S/mt; eukaryotic ASVs) + water chemistry; 14 watershed sites, sampled twice, Aug–Nov 2021 (field sampling text says August 2021–November 2021; abstract "June to November" per earlier metadata excerpt — PDF p.11 Table text says "August 2021 to November 2021"; minor internal inconsistency).
- East Fork sites (Table 1, p.11): Goochie Ford GF (35°50'18.0"N 86°11'20.9"W), Walter Hill Dam WH (35°56'31.5"N 86°22'38.6"W), Woodberry Bridge WB (35°49'23.9"N 86°05'24.4"W, near Woodbury).
- Results (pp.17, 24, 31, 33–34): 150 ASVs in class Actinopterygii; 13 families, 33 genera; most prevalent genera Campostoma, Lepomis (all 15 sites), Etheostoma, Pimephales, Hypentelium, Moxostoma; East Fork sites richest (322–372 median ASVs; Walter Hill highest), East Fork > West Fork richness; fish richness ANOVA P=0.003; no trout genus (Oncorhynchus, Salmo, Salvelinus) appears anywhere in the document (keyword-extracted full text; "trout/salmon" appears only in a cited-literature title about spawning-salmon eDNA).
- Source type: peer-reviewed-committee thesis, method-documented, multi-site, full-community (eDNA). Confidence: HIGH for 2021.
- Establishes: MEANINGFUL EVIDENCE AGAINST trout in the East Fork in 2021 — eDNA is sensitive to salmonids, sites span headwater (Woodbury) to Walter Hill, community-rich fish signal at all three sites. Limits: text reports top genera only (full 33-genus list not enumerated in extracted text); eDNA ≠ literal absence; year-specific.

### 2.2 Mullen, D. (2006). "Fish Inventory at Stones River National Battlefield" (incl. notes on natural communities and rare species). NPS published report, ~88 pp.
- Located via npshistory.com citation trail and NPS IRMA DataStore mention; full PDF NOT retrievable this pass (npshistory search empty; IRMA API non-JSON). Search summaries quote: 46 fish species documented (=73% of potential for the West Fork Stones River area); cites an MTSU thesis surveying fish communities of "the entire Stones River System."
- REACH DISCIPLINE: Stones River NB is on the WEST Fork / main Stones at Murfreesboro — ADJACENT, NOT East Fork. Logged for context only: its 46-species warmwater list and cited whole-system thesis contain no trout claims for the system.

### 2.3 MTSU-derived water-quality literature on the East Fork
- "Human Pharmaceuticals in the Surface Water of East Fork Stones River" (journal article cited in Williams 2022 reference list, p.38) — chemistry, not fish. Supports urban-impact characterization; no species data.
- MTSU News (June 2021, mtsunews.com): $6,500 stipend for Stones River eDNA diversity mapping — the project behind Williams 2022. Context only.

### 2.4 Journals
- Southeastern Fishes Council Proceedings (voljournals.utk.edu archive, issues through #67/2026): no East Fork Stones River item surfaced via search. Unproductive this pass.
- Etnier & Starnes (1993) The Fishes of Tennessee: not directly consulted (print); drainage accounts would describe Stones River fishes; museum data below reflects that fauna.

---

## LANE 3 — Collections / repositories (STRONGEST EVIDENCE LINE)

### 3.1 GBIF occurrence search, corridor bbox (35.75–36.05N, -86.55 to -86.05W), retrieved 2026-09-24
- Method: https://api.gbif.org/v1/occurrence/search with decimalLatitude/decimalLongitude ranges; class-level taxonKey filters fail in current GBIF index, so per-dataset + per-species queries were used; localities filtered on "east fork".
- TRT-CHECK (species-level keys): Oncorhynchus mykiss — 4 records in bbox: 1 iNat 2021-08-29 at (-86.46417, 35.94076) = WEST FORK, Smyrna (place_guess "West Fork Stones River, Smyrna, TN"); 3 museum records are Clinch River (Anderson Co.) and French Broad River (Cocke Co.) — bbox-edge artifacts outside the Stones basin. Salmo trutta — 1 record, locality "state non-specific" (1980), unusable. Salvelinus fontinalis — 0. Salmo salar — 0.
- ESTABLISHES: no vouchered salmonid from the East Fork corridor in GBIF.

### 3.2 East Fork fish assemblage from museum collections (locality text "East Fork Stones River…"), by dataset
- NCSM Ichthyology Collection (2a79f202-3f3a-4d54-88fa-09aa8de1ac73): 46 East Fork rows; years 1967, 2000, 2009. Species incl. Erimystax insignis, E. dissimilis, Notropis ariommus, N. leuciodus, N. buchanani, Fundulus catenatus, Hybopsis amblops, Etheostoma atripinne/rufilineatum/caeruleum/blennioides/flabellare, Nothonotus microlepidus, Nocomis effusus, Lythrurus fasciolaris, Cottus carolinae, Micropterus dolomieu, Lepomis spp., Cyprinella spiloptera, Labidesthes sicculus, Gambusia affinis, Percina caprodes.
- University of Alabama Ichthyology Collection UAIC (e90a588b-0eed-4077-8a4f-7e61da35b3f8): 133 East Fork rows; years 1963, 1968, 1970, 1987, 1990, 1991, 1996. Adds Etheostoma camurum (1970), E. tippecanoe (1968), E. simoterum, E. stigmaeum, E. smithi, Micropterus punctulatus/salmoides, Moxostoma duquesnii/erythrurum, Lepisosteus osseus, Dorosoma cepedianum, Hypentelium nigricans, Campostoma oligolepis/anomalum, Cyprinella whipplei, Notropis micropteryx/volucellus/boops, Noturus miurus, Pimephales spp., Luxilus chrysocephalus, Fundulus olivaceus. Dated examples: UAIC 09865.05 (1990-05-24, "East Fork Stones River at US Hwy 231/TN Hwy 10, just below dam"); UAIC 11582.04 (1996-12-05, "East Fork Stones River at TN Hwy 96, 1 mi SW of Lascassas", B.R. Kuhajda/D.A. Neely/R.M. Strange).
- Bell Museum fishes (93c707dc-4708-47fc-93d8-424702116442; Simons et al. UMich material): 102 East Fork rows; years 1999, 2001, 2002, 2006, 2007. Dated/locality examples: "at US Highway 231 in Walterhill State Park, ca. 11 km N of Murfreesboro" (2006-08-12, 2007-06-20; e.g., catalog 45658 Percina caprodes), "at US Highway 231, 6 miles N of Murfreesboro" (2001-03-25), "at Walter Hill Dam" (1999-08-21), Guy James Road (2001). Adds Pylodictis olivaris, Dorosoma petenense (reservoir-run), Fundulus notatus, Noturus flavus, Nocomis effusus, Cottus carolinae.
- Auburn University Fish Collection (d499aef2-b1d9-4890-aeb3-5f0d1237b513): 1975 records (26 rows) incl. Erimystax insignis, Nothonotus microlepidus, Noturus flavus, Fundulus catenatus, Pomoxis annularis, Moxostoma erythrurum.
- Ohio State OSUM (813b435e-f762-11e1-a439-00145eb45e9a): 1964/1986 records (8 rows) incl. Erimystax insignis, Fundulus catenatus, Nothonotus microlepidus.
- Austin Peay State University Fish (Arctos) (caff29b9-5038-40ae-b373-b454cc89be19): 47 East Fork rows; 1982 and 2016. Notable: APSU:Fish:6108, 2016-05-13, "East Fork Stones River just below Walter Hill Dam near Rte. 231 bridge", collectors Josh Stonecipher, Rebecca …; 26 spp. incl. Hybopsis amblops, Erimystax insignis, Etheostoma smithi, E. occidentale, Noturus miurus/flavus, Nothonotus microlepidus.
- Yale Peabody YPM ICH (96419bea-f762-11e1-a439-00145eb45e9a): 50 East Fork rows; 2007 and 2023 (2023 = recent academic sampling; cf. YPM ICH 038063, 2024-03-15, Daemin Kim/Julia E. Wood, Auburntown area — that one is an unnamed tributary to Saunders Fork: EAST FORK TRIBUTARY, flagged).
- Aggregate: ~50–55 species, 1963–2023, at >=8 distinct East Fork access points spanning the full reach (Woodbury-area to below Walter Hill Dam + US231 + TN96 Lascassas + Guy James Rd + Betty Ford area). SALMONIDS: ZERO across all datasets/decades. Sensitive, clear-water species (Hybopsis amblops bigeye chub, Erimystax insignis blotched chub, Fundulus catenatus southern studfish, Etheostoma camurum bluebreast darter, Nothonotus microlepidus Cumberland snubnose darter, Etheostoma smithi) persist through 2016–2023.
- Source type: vouchered museum collections (PRESERVED_SPECIMEN; standard ichthyological collection methods — seining/electrofishing; samplingProtocol not digitized in GBIF fields checked). Confidence: HIGH. Per the binding standard, each dataset is a method-documented survey of specific reaches whose complete lists omit trout — together they weigh strongly AGAINST trout 1963–2023.
- Limits: collection effort clusters at access bridges (esp. Walter Hill/US231); non-detection ≠ literal absence; most recent collections 2016/2023.

### 3.3 iNaturalist (research-grade + verifiable), corridor bbox, retrieved 2026-09-24
- Query: api.inaturalist.org/v1/observations?taxon_id=47178 (Actinopterygii), bbox 35.82–35.99N, -86.46 to -86.19W: 544 observations, ~57 taxa, ALL warmwater: Gambusia affinis (16), Etheostoma caeruleum (14), Nothonotus rufilineatus (13), E. crossopterum (12), E. atripinne (12), Pimephales notatus (11), Lepomis spp., Campostoma oligolepis (9), Fundulus cryptocatenatus (6), Nothonotus microlepidus (6), Lythrurus fasciolaris (6), Micropterus (dolomieu/punctulatus/nigricans/salmoides), Cyprinus carpio, Ctenopharyngodon idella, Moxostoma breviceps, Noturus eleutherus, etc. TROUT: NONE.
- Dated East Fork anchors: alleghenywaterboy 2025-04-17 at Walterhill (35.9415,-86.3790) — 5 darter/sunfish species; nisturtevant 2026-09-13 Campostoma (-86.4233,35.8883, East Fork greenway reach); kaitstanton 2026-09-13 Central Valley Rd (-86.3906,35.9467); johnnyallnatural83 2026-07-11 Luxilus (-86.3477,35.8971); bichir 2026-06-29 multi-site East Fork series; keepinitreel 2023-10-13 darters (-86.3805,35.8524, Murfreesboro greenway/East Fork confluence area).
- REACH FLAG: the only rainbow trout observation in the bbox is the 2021-08-29 West Fork/Smyrna record (see 3.1); one 2026-07-03 Nothonotus obs is labeled "West Fork Stones River, Murfreesboro" — excluded.
- Source type: community/photo-vouchered (non-government — weighed per instructions, not dismissed). Confidence: medium individually, HIGH in aggregate.

### 3.4 Other museum (non-fish, corroborates long-term biological documentation of the East Fork reach)
- GBIF: FMNH Elimia 1976-08-09 at Walterhill Dam/US231; NCSM mussels (Tritogonia verrucosa, Ptychobranchus fasciolaris, Lasmigona costata, Cyclonaias tuberculata, Villosa taeniata, Epioblasma walkeri 1911 Walterhill); UAIC gastropods 1967-10-02 "Stones River at Waterhill, East Fork"; NCSM crayfish 2017-08-11 Cannon Co (Cambarus clivosus etc.); Faxonius rusticus 2000-06-05 at US231. Narrow evidence (not fish), logged as context.

---

## LANE 4 — Local / community

### 4.1 Fishbrain (search snippets only; direct page 404/blocked — INTERNAL RESEARCH ONLY)
- Search snippet (retrieved 2026-09-24, via fishbrain.com "Best fishing spots in Greenvale, TN" and earlier result): East Fork Stones River "most popular for … Smallmouth bass, Rock bass … Largemouth bass 11 in · 1 lb recently logged." Earlier search result: "East Fork Stones River fishing reports — largemouth bass, smallmouth bass, rock bass."
- Source type: club/angler platform. One-catch rule respected: these are aggregate species pages, not single-catch claims. Establishes: the community catch record is warmwater; no trout reports surfaced for the East Fork in any snippet. Does NOT establish absence.

### 4.2 Realistic Fishing (blog) — 2023-07-22, "Fishing Below Walter Hill Dam!"
- URL: https://realisticfishing.com/2023/07/fishing-below-walter-hill-dam/ (read 2026-09-24). Reach: below Walter Hill Dam spillway, East Fork. Species caught: longear sunfish, bluegill, green sunfish ("easily catch a bunch of long ear sunfish… also catch a bluegill and even a green sunfish"). Method: float rig. Trout: none mentioned.
- Source type: first-hand angler blog. Confidence: medium. Supports warmwater.

### 4.3 biologistsoup (blog) — 2026-09-08, "Trip Report: East Fork of the Stones River, TN"
- URL: https://biologistsoup.wordpress.com (post dated 2026-09-08; trip 2026-09-05 Labor Day weekend; read 2026-09-24). Reach: Walter Hill Park put-in, ~3 km down/up-stream; gauge at Lascassas 2.9 ft ("minimum paddleable"). Observation: "saw a large number and diversity of fish," water "like paddling in an aquarium" (credits mussels); notes "This river is under a fish consumption advisory due to mercury." No species named; no trout mention; author is a biologist.
- Source type: first-hand expert observation. Confidence: medium. Supports a healthy, diverse warmwater community seen in ideal viewing conditions with no trout noted.

### 4.4 TripAdvisor — Walter Hill Hydroelectric Station reviews
- Angler review: "5 fish small mouth stringers of 20lbs plus in the spring"; floats on East Fork popular. Lead-grade (undated anecdotes). Supports smallmouth fishery below the dam.

### 4.5 Greenway / paddling infrastructure
- Murfreesboro (official, murfreesborotn.gov): greenway system with 2 launches on West Fork and 1 on EAST Fork Stones River; North Murfreesboro Greenway runs along the East Fork (boropulse.com; traillink.com). PaddleWays: 8.71-mi Walter Hill Dam → East Fork boat ramp run. stonesriverkayaking.com: outfitter runs Walter Hill Dam → Mona. paddling.com: Hoovers Mill Rd → Readyville Dam logs (upper East Fork). No trout content anywhere in these; reaches are actively used and observed.
- tngunowners.com forum (2012): Walter Hill Dam mentioned as a fishing spot (poaching concerns noted by a user). No species detail.

### 4.6 Walter Hill Dam itself
- rutherfordtnhistory.org / historic-structures.com: built 1912 as hydro station; damaged 1918 flood; power production ceased 1941; on NRHP. No FERC exemption/relicense docket found (not searched in eLibrary directly — logged as residual gap, low value since the dam no longer operates). No fish survey/fish-passage documents found for the dam.

---

## LANE 5 — Historical

### 5.1 Wayback Machine
- CDX: https://www.tn.gov/twra/fishing.html capture exists (2018-01-12 19:36:35). Domain-wide CDX filter for tn.gov/twra/*trout* timed out twice (504) — UNPRODUCTIVE this pass; no archived TWRA stocking page naming an East Fork Stones destination was found in any lane (current page 1.3, news 1.4, ArcGIS in-hand all agree: West Fork + Percy Priest TW only).
- Old TDEC Stones River Watershed Water Quality Management Plan (state.tn.us PDFs): no archived snapshot located (wayback availability empty for tested URLs) — UNPRODUCTIVE; TDEC biorecon fish tables for the East Fork would live there, residual gap.

### 5.2 USACE pre-impoundment
- "Percy Priest Dam and Lake Pre-Impoundment" PDF exists on lrd.usace.army.mil (lead, not retrieved). Note: lower East Fork was impounded by Percy Priest (1967–68); the 1963–1970 UAIC records (3.2) partially represent the pre-/early-impoundment East Fork. No trout in those records.

### 5.3 USGS topo names
- Lascassas, Walter Hill, Solitude, Readyville anchors all resolved to stations/collections above; no separate historic fish sources found. (HUC note: WQP station records place the East Fork in HUC 05130203; the task brief's "HUC 05130202" label likely refers to the older 8-digit naming — logged as a metadata quirk, not evidence.)

---

## Searches run (WebSearch queries, with repeats/retries deduplicated; * = unproductive)
1. "East Fork Stones River" fish survey TDEC biorecon → led to WQP/TNFederation/USGS leads
2. TDEC "Stones River watershed" biological monitoring fish IBI report PDF → * (no report found; led to TDEC hub)
3. "East Fork Stones River" trout → * no trout association anywhere
4. MTSU thesis "Stones River" fish assemblage East Fork → Williams 2022 + Mullen 2006 leads
5. Mullen 2006 "Fish Inventory" Stones River NB npshistory (x2 wordings) → citation confirmed, PDF not retrieved*
6. Williams 2022 jewlscholar MTSU thesis (x2) → exact item found
7. TDEC fish consumption advisory "East Fork Stones River" bass → 2019 mercury advisory
8. Advisory segment/river-mile (x2 wordings) → mouth→Betty Ford Road segment
9. "Walter Hill Dam" fishing fish survey → community leads
10. "Walter Hill" hydroelectric FERC exemption (x2) → no docket found*
11. fishbrain "East Fork Stones River" fishing report species → warmwater species
12. site:fishbrain.com "East Fork Stones" → catch snippets
13. TWRA winter trout stocking schedule "Nice Mill" history → current program pages
14. eregulations.com TN tentative trout schedule → page moved (404 via fetch)*
15. USACE "Percy Priest" East Fork arm fish sampling → no East Fork stream survey*
16. TWRA "Percy Priest" black bass electrofishing report East Fork arm → * (rate-limited/no hit)
17. TDEC "Stones River Watershed" water quality management plan 305(b) PDF (x2) → hub only*
18. Murfreesboro greenway "Stones River" fishing East Fork trailhead species → launches, warmwater
19. "Stones River" "Southeastern Fishes Council" Erimystax Hybopsis → no East Fork item*
20. "East Fork Stones River" float OR kayak OR fishing youtube → biologistsoup, PaddleWays, outfitters
21. "Percy Priest" pre-impoundment fish survey USACE → lead only (unretrieved PDF)

Direct dataset/API queries (curl/python): WQP station search (Rutherford Co); WQP biological profile (~54MB) parsed; GBIF free-text (invalid), bbox fish aggregation across 7 datasets; GBIF dataset metadata; GBIF species-match + occurrence for 4 salmonids + Micropterus dolomieu + Hybopsis amblops; iDigBio full-text (fish-free result); iNaturalist taxa + observations (trout check; Actinopterygii corridor pull); DSpace/jewlscholar search + item + bitstream download; Wayback CDX (twra domain filter x2 timed out; fishing.html availability); wayback availability (old TDEC plan URLs); FERC page fetch; TWRA page fetches. USGS NAS API — 403 blocked*. onwaterapp.com — 403*. fishbrain direct — 404*.

## Contradictions / traps logged
- MTFF "Stones River - Nice's Mill" rainbow claim (in-hand): Nice Mill is WEST Fork — conflation trap, unchanged.
- TWRA page's only "East Fork" is East Fork Shoal Creek (Dickson Co.) — name trap, defused.
- iNat's only corridor trout is West Fork/Smyrna 2021 — reach trap, defused.
- Williams thesis internal date inconsistency (Aug–Nov vs June–Nov 2021) — minor, does not affect results.
- TDEC "Fish/Nekton + Electroshock" rows could be misread as full surveys — they are targeted tissue collections (tissue anatomy = fillet), NOT inventories.

## RECOMMENDATION: WARMWATER-FOCUS
Reasoning: (1) Six decades of vouchered museum collections (1963–2023) at >=8 East Fork sites report a complete warmwater assemblage (~50+ species, incl. cold-clearwater-sensitive darters/chubs) and never a salmonid; (2) 2021 eDNA across three East Fork sites (headwaters to Walter Hill) detected 33 fish genera — no trout genus; (3) 544 iNaturalist fish observations incl. 2025–2026 — no trout; (4) TWRA's stocking program (current schedule, ArcGIS layer, news archives) has ZERO East Fork Stones destinations — the county's trout fishery is the West Fork (Nice Mill, Manson Pike) and the Percy Priest tailwater; (5) every community/guide source (Fishbrain, blogs, outfitters, forums) is warmwater (smallmouth/largemouth/rock bass/sunfish); (6) TDEC's regulatory attention is a mercury-in-bass advisory — a warmwater management frame. Seasonal-stocked is rejected: no stocking schedule, no stocking event, no holdover report, and no catch record exists for the East Fork; a put-and-take fishery leaves exactly the angler/collection footprint that is absent. Residual caveats: non-detection ≠ literal absence; TSAS (login-gated, 1990–2016 stocking export) and TWRA Region 2 stream-survey files unverified; old TDEC watershed-plan biorecon tables unretrieved.
Remaining gap + likely holder of the settling record: TWRA Region 2 (Nashville) fisheries biologists hold the TSAS stocking-event export and any stream-survey cards for the East Fork; a single data request to TWRA would settle "no stocking, 1990–2016" definitively. Secondary: MTSU Albert Gore Research Center (print MTSU thesis behind Mullen 2006 surveying the whole Stones system) and the USACE pre-impoundment PDF.
