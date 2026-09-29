# South Mouse Creek — Trout Evidence Research Log
Water: South Mouse Creek, Bradley County (Cleveland), TN; Hiwassee River basin (HUC 06020002); companion to but CONFLUENT-WITH-NO-ONE: it has its own embayment mouth and does not join North Mouse Creek (which enters the same Hiwassee arm ~2 km away). Not Fishbrain's "Mouse Creek" (Grandview, Missouri); not "Mouse Creek" the McMinn County community; Little South Mouse Creek is a distinct named tributary.
Research date: 2026-09-24. Internal classification research only; no agency/business/author/angler contact. Retrievals by ZCode.

## Reach definition
- **Flow path**: rises in South Cleveland (USGS-03566030 "South Mouse Creek at South Cleveland", 35.1492, -84.8888, DA 4.22 sq mi), flows NNE through the Cleveland core — Inman St (USGS-03566032), a trib below Inman St, 20th St (USGS-03566036, DA 7.31), below the sewage plant (USGS-03566039), Hwy 60 / above Cleveland (USGS-03566044/-045, DA ~9), Cleveland (USGS-03566050, DA 15.6), below school (USGS-03566055) — then NE past Henegar Church (USGS-03566106, 35.2626, -84.8149, DA 25.2; USGS-03566112, DA 35.1) and above Monk Br (USGS-03566113) toward Charleston (USGS-03566114, 35.3045, -84.8008, DA 38.9). Main tributary: Little South Mouse Creek (USGS-03566111, 5.58 sq mi; TDECWPC-LSMOU000.6BR off Walker Valley Rd).
- **Greenway corridor**: the Cleveland/Bradley County Greenway (3.94 mi, Willow St ↔ Mohawk Dr through N Cleveland; Phases 1–6) "follows South Mouse Creek and crosses the waterway in five locations" (Visit Cleveland TN greenways page, retrieved 2026-09-24). So the Greenway fishing chatter = this creek.
- **Mouth**: South Mouse Creek Embayment, Chickamauga Reservoir (Hiwassee arm) just S of Charleston — TDECWPC-SMOUS001.2BR station description reads verbatim "SOUTH MOUSE CREEK EMBAYMENT IN CHICKAMAUGA LAKE" (35.3083, -84.7978); TDECWR_WQX-TNW000005851 at 35.3049, -84.8018 is typed MonitoringLocationTypeName = "Reservoir" (the embayment backwater).
- **TDEC monitoring stations on the creek**: TDECWPC-SMOUS001.2BR (embayment), SMOUS003.5BR (Hwy 308, 35.2842, -84.8008), SMOUS010.6BR (Seminole Rd, 35.2140, -84.8515), SMOUS012.7BR (Raider, 35.1920, -84.8650) — ".BR" biorecon-program stations; plus TDECWR_WQX-TNW000003889, -TNW000005850…5855, -TNW000007351…7365, -TNW000008298/-8401.

## Sources

### S1. TWRA Trout Stocking Locations (ArcGIS FeatureServer, current full layer)
- Org: TWRA, services3.arcgis.com/PWXNAH2YKmZY7lBq.
- Retrieval: 2026-09-24, `StreamName/Site_Name like %MOUSE%` → **zero features**; county queries → zero Bradley features.
- Type + confidence: Programmatic absence, high.
- Establishes: No South Mouse Creek stocking site; no trout program anywhere in Bradley County.

### S2. TWRA 2026 Trout Stocking Schedule JSON (616 rows)
- Org: TWRA tn.gov data table (browser-context fetch; plain curl blocked).
- Retrieval: 2026-09-24.
- Findings: **No "Mouse" or "Bradley" rows.** Nearest stocked waters (for attribution of any local trout chatter): McMinn's Athens City Park Pond (Winter rainbow, a pond); Hamilton Co — Big Soddy Creek (delayed harvest/seasonal), Dickert Pond/Camp Jordan + Lake Junior (winter ponds), N. Chickamauga Creek (seasonal); Polk Co — Hiwassee tailwater. None in this basin.
- Type + confidence: Programmatic absence, high.
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json

### S3. USGS NAS — Bradley County export (15 records)
- Retrieval: 2026-09-24, https://nas.er.usgs.gov/api/v2/occurrence/search?state=TN&county=Bradley.
- Findings: **No Salmonidae; zero South Mouse Creek records.** Records are Conasauga-drainage fish, Corbicula clam surveys (incl. Candies Creek 1969/1988), and two roadside fish records elsewhere. The closest NAS water is the Hiwassee arm at Calhoun/Charleston (clams 1988/1998).
- Type + confidence: Coverage gap + weak negative, moderate.

### S4. WQP — monitoring history on the creek
- Org: USGS + TDEC (TDECWPC legacy, TDECWR_WQX).
- Retrieval: 2026-09-24, HUC station pull + Result searches by siteid.
- Findings:
  - 16 USGS stations bracket the reach (4.22 → 38.9 sq mi drainage); older gages carry no WQP results.
  - TDECWPC ".BR" stations: SMOUS001.2BR (116 results, 1999), SMOUS003.5BR (293, 1999–2008), SMOUS010.6BR (147, 2003–2008), SMOUS012.7BR (30, 2003). Combined 586 rows across the four — **water chemistry only (temp, DO, conductance, pH, ammonia, metals, E. coli); zero taxa rows, zero fish, zero tissue.**
  - County-wide tissue pull (3,612 rows Bradley+McMinn): every tissue station is on the Hiwassee River/Chickamauga Reservoir (e.g., TNW000002958 Hiwassee 35.3271, -84.8264), taxa = catfish/largemouth bass/carp/paddlefish/etc. — **no South Mouse tissue station; reservoir assemblage is warmwater.**
- Method/count: method-documented biorecon-station monitoring 1999–2008 across the whole reach incl. the embayment; no fish assemblage data in the portal.
- Type + confidence: Method-documented monitoring omitting fish = limited negative evidence, moderate weight.

### S5. GBIF / iNaturalist
- Retrieval: 2026-09-24. GBIF Actinopterygii in bbox 35.10,35.60/-84.95,-84.55 → **0**; Salmonidae in wider box 35.0,35.7/-85.0,-84.4 → **0**. iNat Salmonidae in same wider box → **0**; iNat q="Mouse Creek" + Actinopterygii → **0**.
- Type + confidence: Coverage gap (GBIF) + weighted negative (iNat), moderate.

### S6. Fishbrain water page "South Mouse Creek" (Cleveland, TN)
- URL: https://fishbrain.com/fishing-waters/Hv7yrj2Z/south-mouse-creek (retrieved 2026-09-24; SSR HTML in _work/fb_south-mouse-creek.html).
- Fields: Cleveland TN; centroid 35.2328, -84.8417 (Greenway reach); water-specific species anchor list leads with **Redeye bass** (species id 1lMWh49a), with Largemouth bass, Smallmouth bass, Bluegill anchors in the content; **no public dated catch reports (zero caughtAt records)**. Redeye bass is a native Hiwassee-basin warmwater gamefish — a genuinely local signal, not boilerplate.
- Control note: the page also carries Fishbrain's site-wide 20-species index (incl. Brown/Rainbow trout and Red drum) identical to an unrelated Missouri water — boilerplate, excluded as evidence.
- Type + confidence: Community-app warmwater list, moderate-low confidence (undated aggregation).

### S7. Cleveland/Bradley County Greenway (official tourism page)
- URL: https://visitclevelandtn.com/things-to-see-and-do/scenic-adventures/greenways/ (retrieved 2026-09-24).
- Fields: 3.94 mi greenway "follows South Mouse Creek and crosses the waterway in five locations"; Willow St→Mohawk Dr; proposed Willow St→Inman St phase and eventual link "to the Hiwassee River in Charleston"; parks: Tinsley Park, Fletcher Park (separate fishing POND).
- Findings: **No mention of fishing, fish species, or trout on the greenway itself.** The page's fishing references are site-nav only.
- Type: dated infrastructure documentation establishing the greenway-creek pairing; NOT a fishery doc.

### S8. Chattanooga Fishing Forum thread "Mouse Creek" (dated community doc)
- Org: chattanoogafishingforum.com; thread dated **Jun 13, 2012** (surfaced via WebSearch snippet, retrieved 2026-09-24; direct thread URL not exposed by the site's search/DDG within timebox).
- Quote: "Anybody ever fish Mouse Creek in Cleveland? The creek that runs along the Greenway? Is it any good/fun? Is it okay to keep stuff or is…"
- Type: DATED (2012) community warmwater fishing interest on this exact creek; no species named; establishes angler use, not occurrence. LEAD-grade for any species, and no trout implied.

### S9. Auto-generated app/report shells (weak)
- fishbox.com https://fishbox.com/spot/united-states/tennessee/south-mouse-creek-1642784 — template shell, no species content (client-rendered; retrieved 2026-09-24).
- fishingproreport.com https://www.fishingproreport.com/tennessee/bradley-county/south-mouse-creek-at-cleveland-tenn-fishing-report-U23530356605078.html — "updated each and everyday", auto-template, **no species** (retrieved 2026-09-24).
- fishangler.com https://www.fishangler.com/fishing-waters/us/tennessee/south-mouse-creek/35160475 and onwaterapp.com https://www.onwaterapp.com/us/tennessee/water/south-mouse-creek-w1 — app-generated pages, no verifiable dated catches retrieved.
- Type: LEAD-grade template content, very low confidence.

### S10. Civic documentation
- City of Cleveland TN stormwater page (clevelandtn.gov, surfaced via WebSearch 2026-09-24): references stream cleanups along South Mouse Creek. Civic stewardship of the creek; no species content.

### S11. Same-name / confusion controls
- Fishbrain "Mouse Creek" = Grandview, MO (38.889, -94.454) — different state.
- North Mouse Creek = separate water, own mouth ~2 km away near Charleston; NOT the Greenway creek (Greenway follows South Mouse per S7).
- Little South Mouse Creek (Walker Valley Rd area) = tributary.
- Anyplace America GNIS page https://www.anyplaceamerica.com/directory/tn/bradley-county-47011/streams/south-mouse-creek-1270901/ (JS-gated on retrieval) confirms distinct GNIS stream entry in Bradley Co.

## Searches run (incl. unproductive)
1. WebSearch Cleveland Greenway "Mouse Creek" fishing — productive (forum thread Jun 13 2012 snippet; greenway page; note AI filler claimed "occasional stocked trout" — see Contradictions).
2. WebFetch visitclevelandtn.com greenways — productive (S7).
3. DDG lite cleveland greenway "south mouse" — productive (fishbox, fishbrain, fishangler, fishingproreport, onwater, anyplaceamerica URLs).
4. DDG lite chattanoogafishingforum mouse creek greenway — forum homepage only; direct thread URL not surfaced (unproductive; cited via search snippet).
5. curl fishbox south mouse — template shell, unproductive for species.
6. curl fishingproreport south mouse — template shell, unproductive for species.
7. curl onwaterapp south-mouse-creek-w1 — 200 but client-rendered, no static species. Unproductive.
8. WebFetch fishbrain guessed slug /us/tn/south-mouse-creek — 404 (real page is ID-keyed Hv7yrj2Z).
9. GBIF/iNat bbox + name queries — 0 results (negative).
10. WQP HUC pull + SMOUS result pulls + tissue pull — productive negatives.
11. USGS NAS Bradley — productive negative.
12. TWRA ArcGIS Mouse/Bradley queries + 2026 schedule JSON — productive negatives.
13. Wayback CDX for TDEC Hiwassee watershed plan (biorecon scores) — empty; lane exhausted (same as candies-creek and north-mouse passes).
14. WebSearch TDEC "Mouse Creek" biorecon/305(b) — partial only (framework pages, Cleveland stormwater); no creek-specific biorecon score online-retrievable within timebox.
15. curl anyplaceamerica GNIS page — JS/ad gate, content not retrievable (control only).

## Contradictions
- WebSearch AI filler claimed South Mouse/greenway creek has "occasional stocked trout in cooler months" — DISPROVEN by S1/S2 (no Bradley County trout program exists at all; nearest winter program is Hamilton Co ponds). Resolved in favor of primary data.
- Ledger's "warmwater bass/panfish community reports only" is CONFIRMED and sharpened: the only water-specific named species is Redeye bass (S6) plus generic largemouth/smallmouth/bluegill anchors; no trout claim in any public context other than the site-wide Fishbrain boilerplate index.

## Recommendation: WARMWATER-FOCUS
Reasoning: (a) Zero TWRA trout stocking — no "Mouse" site in the current stocking layer, no Bradley County water in the 2026 schedule at all, so no seasonal program to inherit; (b) the mouth is the warm South Mouse Creek embayment of Chickamauga Reservoir (Hiwassee arm) and the whole 15-mi reach is low-gradient urban/valley creek — thermally incompatible with trout; (c) zero salmonid records across USGS NAS (county), GBIF, and iNat, and 10 years (1999–2008) of TDEC biorecon-station monitoring with no fish data suggesting any coldwater program; (d) the dated angler documentation (2012 forum thread) and the Fishbrain page (redeye bass first) are warmwater; (e) any Cleveland-area trout report is attributable to Hamilton Co ponds/creeks (Camp Jordan, Lake Junior, Big Soddy, N Chickamauga) or McMinn's Athens City Park Pond, none in this basin. Not "trout"; not "seasonal-stocked". Residual uncertainty: no method-documented fish-community survey with a full species list was located for the creek itself (WQP chemistry-only; TDEC biorecon fish results not portal-hosted; GBIF gap; forum species-less) — so the warmwater classification rests on programmatic absence + thermal grounds + weak community signal rather than a positive species list; Greenway-reach water quality (urban runoff, historical WWTP discharge at 03566039) is a separate fishery-quality caveat, not a trout question.
