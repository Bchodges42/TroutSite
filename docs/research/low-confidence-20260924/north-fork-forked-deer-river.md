# North Fork Forked Deer River (West Tennessee) — Trout-Occurrence Evidence Research Log

Water: North Fork Forked Deer River — principal northern fork of the Forked Deer system, NW Tennessee; runs from the Carroll/Gibson County area through Trenton (Gibson Co) to Dyersburg (Dyer Co), above the junction where North + Middle + South forks form the Forked Deer main stem. Ledger state: limited / warmwater-focus (TWRA West Tennessee crappie rule, "includes tributaries"). FLAG carried into this pass: fishbrain-trout-lead (1 rainbow trout among 4 logged catches) — one-catch rule applied hard; original public context located (see L1).
Research date: 2026-09-24 (all retrieval dates = 2026-09-24).
Researcher constraint: research only; no agency/business/author/angler contact; no git writes; no writes except this file.

## GEOGRAPHY / REACH DEFINITION (Q4)

Verified this pass:
- USGS NWIS site file (waterservices.usgs.gov/nwis/site/?sites=07028500,07029100,...&siteOutput=expanded&format=rdb, retrieved 2026-09-24): 07028500 NORTH FORK FORKED DEER RIVER AT TRENTON, TN — HUC 08010204, Gibson Co (county_cd 053), drainage 73.5 mi², altitude 311.85 ft, 35.9803/−88.9265. 07029100 NORTH FORK FORKED DEER RIVER AT DYERSBURG, TN — HUC 08010204, Dyer Co (045), drainage 939 mi², altitude 244.86 ft, 36.0303/−89.3870. Confidence HIGH (primary federal gauge network). Establishes: fork exists as a named main-stem-scale river through Gibson and Dyer counties; HUC 08010204 = the combined North+Middle Fork HUC (see TDEC below). The 939 mi² at Dyersburg (vs 73.5 mi² at Trenton) shows the "North Fork" name below the Middle Fork confluence carries the combined upper-basin flow.
- TDEC Final Version 2012 303(d) List (web.archive.org/web/20140412195733if_/http://www.tn.gov/environment/water/docs/wpc/2012-final-303d-list.pdf, p. 140 = PDF page 144, text extracted 2026-09-24): "North Fork Forked Deer River — This basin contains the following USGS Hydrologic Unit Codes: 08010204 (North and Middle Forks Forked Deer River)." Segment row: "TN08010204 | 001-1000 | NORTH FORK FORKED DEER RIVER | Gibson, Dyer | 8.34 mi impaired | Phosphorus (M); Loss of biological integrity due to siltation (L) | Nonirrigated Crop Production; Discharges from MS4 area; Channelization | Category 5." Confidence HIGH (official state assessment inventory). Establishes: official reach = NF main stem in Gibson + Dyer counties; TDEC has run aquatic-life (macroinvertebrate-based) assessment on the reach.
- Fishbrain water page anchor (see L1): coordinates 36.023495, −89.167608 — Dyer County between Trenton and Dyersburg; page states "located in Gibson County, Tennessee ... also intersecting with Dyer County."
- Wikipedia: NO article exists for "North Fork Forked Deer River" (fetch returns empty placeholder, 2026-09-24). County course rests on USGS/TDEC/Fishbrain convergence above. Carroll County headwaters from the 2026-09-22 prior batch record were NOT independently re-verified this pass (noted unverified; does not affect any call).

## QUESTION 1 — TROUT STOCKING / OCCURRENCE EVER: NO EVIDENCE; STRONG ABSENCE STACK (+1 non-citable LEAD)

### Agency program evidence (highest weight)
A1. TWRA live 2026 Trout Stocking Schedule JSON (616 rows) — https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json (retrieved 2026-09-24 via curl w/ Chrome UA; fields REGION/COUNTY/LOCATION/TYPE/STOCKING DAY/STOCKING WEEK/STOCKING MONTHS/SPECIES).
  - ZERO rows matching forked / deer / dyersburg / trenton / humboldt / jackson anywhere in the state.
  - Only watershed-county rows: Gibson = "Milan City Pond" (Winter rainbow, 1/14/2026 + TBD 12/2026). No Dyer, Crockett, Carroll, Lauderdale, Haywood, Chester rows at all. (Madison/Henderson/Weakley rows exist but are other basins' waters — see SF log for Madison.)
  - Type: official current-year schedule. Confidence HIGH. Establishes: no 2026 planned trout release on any reach of the NF (or anywhere named Jackson/Dyersburg/Trenton/Milan-reservoir-free). NOT established: pre-2026 history (closed by A2+A6).
A2. TWRA ArcGIS TWRA_Trout_Stocking_Locations feature layer (services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0/query, retrieved 2026-09-24).
  - County IN (GIBSON, DYER, MADISON, CROCKETT, LAUDERDALE, CHESTER, HENDERSON, HAYWOOD, CARROLL) → 4 sites total: Lake Graham (MADISON, reservoir), McKenzie City Park (CARROLL, pond), Beech Lake (HENDERSON, pond), Milan City Park (GIBSON, NumStocked 0 in this layer, 35.9238/−88.7290). ALL are lake/pond impoundments; ZERO on any natural stream reach.
  - Statewide Site_Name/StreamName LIKE '%FORKED%' or '%DEER%' → 0 features. The only "deer"-named trout sites anywhere in TWRA's layer are East TN waters (none relevant).
  - Type: agency master stocking-site layer (drives the TWRA trout map). Confidence HIGH. Establishes: no trout stocking SITE exists on the North Fork (or any Forked Deer water) in the layer of record.
A3. TWRA historical layer StockedTrout2016 (same ArcGIS host, 796 rows dumped, retrieved 2026-09-24): ZERO forked/deer hits statewide; the three Forked-Deer-county rows are Lake Graham (reservoir, rainbow, 3000), McKenzie City Park (pond, 2000), Beech Lake (pond, 1500). Confidence HIGH for the documentation. Establishes: no historical stocking site on the fork in the 2016 layer of record either.
A4. TWRA "Trout Management Plan for Tennessee 2017-2027" (web.archive.org/web/20180803011947if_/https://www.tn.gov/content/dam/tn/twra/documents/fisheries/trout/Trout%20Management%20Plan%20for%20Tennessee%202017-2027.pdf; full text extracted via pymupdf in-memory, retrieved 2026-09-24): ZERO occurrences of "Forked" in the entire plan. Confidence HIGH (official plan). Establishes: the entire Forked Deer system is outside every trout-program category TWRA manages (no wild stream, no stocked water, no put-grow-take water).

### Independent occurrence datasets (weighted negatives)
A5. GBIF occurrence search (api.gbif.org/v1/occurrence/search, retrieved 2026-09-24): taxonKey 8615 (Salmonidae, backbone match EXACT) + decimalLatitude 35.85,36.12 + decimalLongitude −89.45,−88.80 (Trenton→Dyersburg corridor) = **0 occurrences**. Coverage proof in the identical bbox: any-taxon GBIF records = **79,329**. Confidence MEDIUM-HIGH (crowd/museum aggregation; non-detection ≠ literal absence). Note: class-level (Actinopterygii) bbox filtering did not resolve cleanly this pass; the any-taxon count is the coverage statement actually verified.
A6. iNaturalist (api.inaturalist.org/v1/observations, retrieved 2026-09-24): taxon_id 47520 (Salmonidae — verified via /v1/taxa/47520: "Salmonidae, family, Salmons, Trouts, and Whitefishes") in NF bbox (swlat 35.85, swlng −89.45, nelat 36.12, nelng −88.80) = **0 observations**. Coverage: 9,769 research-grade observations of any taxon in the same bbox; Micropterus salmoides = 1 (fish observation coverage exists, thin). Confidence MEDIUM (iNat undersamples angler-caught fish).
A7. USGS NAS (nonindigenous aquatic species) API — UNUSABLE this pass: /api/v2/species/search honored NEITHER county NOR huc8 filters (identical count=811 = the full Fishes group for every Gibson/Dyer/Madison/Crockett/Carroll/Lauderdale query and for huc8=08010203 control; tried states/counties/state+county/huc8 param shapes; retrieved 2026-09-24). NOT evidence either way. Salmonidae records for these counties would have been stocking-adjacent anyway.
A8. WQP (waterqualitydata.us) — Result/search IGNORES ActivityMediaName and sampleFraction params this pass (control: huc=08010205 with/without "Biological Tissue" both = 70,026 rows). Reliable pattern used instead: characteristicName filter + client-side media screening. On HUC 08010204+08010205, "Tissue"-media rows exist ONLY as TDEC fish-tissue collections at the stations in Section C — none is a trout row; the many 1928-1951 "Biological Tissue"-tagged hits are actually legacy USGS water chemistry (filter artifact, not tissue). Confidence HIGH for the documentation itself.

### Community-app lead (one-catch rule applied)
L1. Fishbrain "North Fork Forked Deer River" public water page — https://fishbrain.com/fishing-waters/iW_WdekD/north-fork-forked-deer-river (fetched directly 2026-09-24, HTTP 200, 409 KB HTML; species/report facts from page JSON-LD FAQ):
  - "4 Logged catches"; water anchored 36.023495/−89.167608, "located in Gibson County ... also intersecting with Dyer County."
  - "The most common species in the North Fork Forked Deer River are: Largemouth bass — 1 members reported ...; Rainbow trout — **1 members reported to have caught this fish**; White bullhead — 1 members reported."
  - "The latest ... fishing reports are: @KreifelsFishing reported a nice Rainbow trout. @jlaster3260 reported a nice Largemouth bass. @jlaster3260 reported a nice Largemouth bass." So the entire trout signal = ONE catch by ONE traveling multi-species angler; size shown on catch card "Rainbow trout — 16 in · 1 lb".
  - No catch date is exposed in the public HTML (embedded createdAt timestamps 2018-2024 exist but cannot be tied to the trout row without the app).
  - The page's own trout row is generic injected regulation text ("Rainbow trout — Regulation boundary: Tennessee State Waters — Bag limit 7") — statewide rule text, NOT a stocking or program record.
  - Corroboration search 2026-09-24 (WebSearch "Kreifels"/"Forked Deer" rainbow Tennessee): only this same Fishbrain page plus app/content-farm restatements (OnWater page reprints generic statewide trout-license text; FishAngler holds the SF page). Same conclusion as the 2026-09-22 pass ("only content-farm/app pages restating the same aggregate").
  - Type: community app aggregate. Confidence LOW. Per standing rules: single catch = LEAD only, not citable, never fishery documentation. Plausible benign explanations, in order: mislogged GPS/species; a released pellet-water escapee from the Gibson County winter pond program (Milan City Pond is the Gibson Co trout water); a genuine one-off stray in a 939-mi² warmwater system. A 16-in rainbow in a river whose gaged reach hit 32.0 °C (A9) is not a fishery.
A9. Thermal context (supports absence): WQP/NWIS temperature verification at USGS-07029100 (NF at Dyersburg), retrieved 2026-09-24: n=47 results; max 32.0 °C (1980-07-09), 30.5 °C (1986-07-31), 30.0 °C (1981-07-10); upstream 07028500 Trenton max 24.0 °C (2004-07/2005, n=21, sparse). Matches the prior batch4 record. Confidence HIGH. Establishes: summer temperatures far above trout tolerance at the lower reach; the upper-gage record is too sparse to speak to cold refugia, but no cold-water source (dam/spring) was found on this fork in the prior pass.

## QUESTION 2 — FISH SURVEYS / SPECIES LISTS

B1. TDEC 303(d) 2012 (p. 140, see Geography): NF main-stem segment assessed for aquatic life with "Loss of biological integrity due to siltation" — a macroinvertebrate/IBI-style assessment exists for the reach, but the list publishes NO fish species table. Confidence HIGH (official). 
B2. GBIF museum-voucher lane (TU/SFNRC lot records surfaced via api.gbif.org q-search, retrieved 2026-09-24): dated fish collections across the FORKED DEER SYSTEM, none on the NF main stem specifically: "Forked Deer River, 1 mi above mouth" (Hiodon alosoides, 1973-09-01); Knob Creek "(Forked Deer River system), 1.5 airmi WSW of Nankipoo" (Phenacobius mirabilis, 1974); oxbow slough "between Key Corner & Forked Deer River" (Lepomis humilis, 1973); "NORTH FORKED DEER RIVER" appears only as herp voucher locality (Trachemys scripta, Apalone spinifera, 1970-04, dataset 76dd8f0d). NO Salmonidae in any system record sampled. Confidence MEDIUM-HIGH (museum lots; non-detection ≠ absence). Establishes: a warmwater fish assemblage has been vouchered across the system since 1970 with zero salmonids.
B3. EPA NRSA lane: the only NRSA fish-bearing sites in the two Forked Deer HUCs are on the SF system (Finger Creek, Harris Creek trib — see SF log); no NRSA fish site on the NF located this pass. WQP "Biological" rows on the NF HUC are benthic-macroinvertebrate/legacy-chemistry only — per standing caveat NEVER fish-absence evidence.
B4. USGS NAS — unusable (A7); iDigBio not re-run (unusable in prior passes).

## QUESTION 3 — DATED WARMWATER DOCUMENTATION BEYOND THE CRAPPIE RULE

C1. TDEC fish-tissue field collections ON the NF main stem (WQP Result search, characteristicName=Mercury + ActivityMediaName='Tissue' screened client-side; stations resolved via Station/search, retrieved 2026-09-24):
  - TDECWR_WQX-TNW000004406 "North Fork Forked Deer River", 36.0147/−89.1936, TDEC county 053 (Gibson): Micropterus salmoides (largemouth bass) 0.49 & 0.52 mg/kg, Ictalurus punctatus (channel catfish) 0.36 mg/kg, Cyprinus carpio (common carp) 0.37 mg/kg — 1998-11-18; I. punctatus 0.144, M. salmoides 0.361, Micropterus punctatus (spotted bass) 0.18 — 2007-11-14. (TDECWR_TNW000004406 tissue-adjacent rows span 1998-2022; the 2022 rows on this HUC belong to the Gibson County Lake / Humboldt Lake stations, not the river.)
  - TDECWR_WQX-TNW000004403 "North Fork Forked Deer River", 35.9930/−89.3425, county 045 (Dyer): M. punctulatus 0.131, I. punctatus 0.174 — 2007-10-15; I. punctatus 0.27 — 2014-10-08.
  - Type: official fish-consumption-advisory tissue program (species-level fish COLLECTIONS, dated, on named stations the state labels "North Fork Forked Deer River"). Confidence HIGH. Establishes: TDEC has collected and species-identified largemouth bass, spotted bass, channel catfish, and common carp from the NF main stem itself, 1998-2014 — the strongest riverine fishery documentation found this pass. NOT a complete assemblage list (advisory-target species only).
C2. TWRA West Tennessee crappie rule (carried from ledger; eRegulations/TWRA exceptions, "Forked Deer, Hatchie, Loosahatchie, Obion, and Wolf Rivers (includes tributaries) — Crappie: 30 per day, no length limit", retrieved this pass via the 2026-09-22 ledger citation): managed-warmwater documentation for the fork as a tributary of the named system. Confidence HIGH.
C3. TWRA-developed access ON the water (ArcGIS Boat_Launch_Sites, Waterway LIKE '%FORKED%', retrieved 2026-09-24): "Unionville Bat Ramp" and "Parker Ditch Boat Ramp", both Waterway "Forked Deer River", DYER Co, Region 1. Confidence HIGH (agency layer). Establishes: TWRA develops and signs boating-fishing access on the lower fork/main-stem reach in Dyer County. (The two Dyer ramps are labeled "Forked Deer River"; the NF/main-stem split at Dyersburg is not resolved in the layer.)
C4. Fishbrain aggregate (L1): 4 catches — 2 largemouth (1 angler), 1 rainbow (LEAD), 1 white bullhead. Adjacent-waters panel lists Gibson County Lake (321 catches) and Davy Crockett Lake/Humboldt Lake (259) — corroborating that area anglers log warmwater catches, not river trout.
C5. Angler-aggregator pages (search-surfaced, non-citable): OnWater "North Fork Forked Deer River Fishing in Tennessee" (reprints generic statewide trout license/creel text — an app-template artifact, NOT trout evidence). PiscaMaps/holdovers from prior passes remain LEADs only.
C6. Jackson Sun archive lane: nothing indexed surfaced for the NF (searches 2026-09-24; see search list). Lane exhausted at the searchable index level; paywalled print archive not accessible.

## SAME-NAME / CONTAMINATION CHECKS
- "Forked Deer Creek at Co. Rd. 8060, 2.5 mi ESE of Luray" (GBIF/TU lots) = Luray, HUC context "(Forked Deer River)" — a West TN Forked Deer tributary locality, kept distinct from the NF main stem.
- Obion River / Reelfoot Lake / Rutherford Fork Obion records excluded (adjacent basin).
- NRSA0809-TN033 chlordane tissue station = "Obion River" (Dyer Co) — NOT Forked Deer; excluded.
- Beech Lake (Henderson Co trout site) drains to the Beech River / Kentucky Lake basin, NOT the Forked Deer.
- Middle Fork Bottoms State Park fishing pages name the "Forked Deer River" but the water is the MIDDLE Fork complex (Three Way) — excluded from this fork.

## BOTTOM LINE
No trout occurrence, stocking row, stocking site (current or 2016), plan mention, or independent observation (GBIF/iNat) exists for ANY reach of the North Fork Forked Deer River. The only trout signal in ten Forked Deer watershed counties is winter rainbow releases into Milan City Pond (Gibson Co), a park impoundment. The flagged community lead resolves to exactly ONE rainbow (16 in, 1 lb) by one traveling angler (@KreifelsFishing) on the Fishbrain page — LEAD only under the one-catch rule, unattributable to a reach or date, with pond-escape/mislog as plausible explanations. Against that: documented 32 °C July water at Dyersburg, and species-level TDEC fish collections on the main stem (largemouth, spotted, channel catfish, carp, 1998-2014) plus TWRA crappie rule and Dyer County ramps documenting a managed warmwater river.

## RECOMMENDATION
**warmwater-focus** (evidence state: limited — with the TDEC main-stem tissue species now available as supporting warmwater documentation if the ledger wants to cite it). Trout: no documented occurrence ever; keep fishbrain-trout-lead flagged as a non-citable LEAD. Do NOT add seasonal-stocked: the only stocking is Milan City Pond, a separate impoundment.

## SEARCHES RUN (2026-09-24; incl. unproductive)
1. WebSearch '"North Fork Forked Deer River" trout stocking' — rate-limited (429×4), partial: only Fishbrain/regs boilerplate; no trout evidence.
2. WebSearch '"Kreifels"|"KreifelsFishing" "Forked Deer" rainbow trout Tennessee' — only the same Fishbrain page + OnWater/FishAngler content-farm restatements. UNPRODUCTIVE beyond L1.
3. TWRA 2026 schedule JSON (616 rows) — 0 forked/deer/dyersburg/trenton/humboldt/jackson rows; Gibson = Milan City Pond only.
4. ArcGIS TWRA_Trout_Stocking_Locations: county IN (9 counties) → 4 impoundment sites; statewide LIKE %FORKED%/%DEER% → 0.
5. ArcGIS StockedTrout2016 (796 rows) → 0 forked/deer.
6. TWRA Trout Management Plan 2017-2027 (pymupdf full text) → 0 "Forked".
7. USGS NWIS expanded site records — 07028500/07029100 identities, HUCs, drainages verified.
8. WQP/NWIS temperature at 07028500/07029100 (+ 07027500/07027800) — max temps verified.
9. GBIF bbox NF: Salmonidae 0; any-taxon coverage 79,329. GBIF q-searches (Forked Deer; NF/SF variants) — TU museum warmwater lots; no salmonids.
10. iNat NF bbox: Salmonidae 0; coverage 9,769 research-grade; M. salmoides 1.
11. USGS NAS probes (5 URL shapes) — county/HUC filters not honored (constant 811); UNUSABLE.
12. WQP station search HUC 08010204+08010205 — 1,009 stations, 141 DEER-named.
13. WQP tissue: Mercury/Chlordane + client-side media screen — TDEC NF main-stem stations 4406/4403 species found; ActivityMediaName/sampleFraction params proven non-functional (control test logged).
14. EPA ATTAINS API — "Unauthorized ... api.data.gov key" (incl. DEMO_KEY). UNPRODUCTIVE; 303(d) PDF used instead.
15. TDEC 2012 303(d) List PDF (archive.org, in-memory text extraction) — NF segment row + HUC note.
16. TWRA Boat_Launch_Sites LIKE %FORKED% → 4 rows (incl. 2 Dyer Co ramps).
17. TWRA RiverMiles LIKE %Forked% → 0 rows (schema checked; Forked Deer not mile-mapped by TWRA). Unproductive.
18. Fishbrain NF page direct fetch ×3 (HTTP 200) — JSON-LD extracted; no __NEXT_DATA__; no catch dates exposed.
19. Wikipedia "North Fork Forked Deer River" — no article. Unproductive.
20. services.gis.tn.gov REST root — no response. Unproductive.
