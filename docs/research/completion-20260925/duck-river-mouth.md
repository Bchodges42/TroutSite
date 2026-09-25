# Duck River Mouth (Maury / Hickman / Humphreys) — warmwater main-stem classification log

Water: Duck River main stem, lower reach — Columbia (Maury Co.) through Centerville (Hickman Co.) to the Kentucky Lake / Tennessee River confluence (Humphreys Co.). Warmwater-focus row.
Research date (retrieval date for all sources): 2026-09-25. Internal classification research only; no contacts made.

## VERDICT UP FRONT
Warmwater CONFIRMED (agency fishery page, federal-fish IBI vouchers, official advisories naming warmwater sportfish, TVA/Kentucky-Lake embayment context). Zero trout program confirmed (same 2026 schedule + ArcGIS evidence as upstream — no stocking sites below Bedford Co.). Trout occurrence claims in the lower basin tested: three single historic museum vouchers in adjacent/possibly-adjacent drainages, none of which evidences a trout fishery.

---

## SOURCES

### S1. TWRA 2026 Trout Stocking Schedule (JSON, 616 rows) — shared evidence
- Org: TWRA; retrieved 2026-09-25 (browser-context JSON; cached verified copy `tmp/research/completion/schedule2026-jina.txt`).
- Result: only Duck row statewide = "Normandy TW / Duck River" (Coffee/Bedford, Tailwater, Rainbow). ZERO rows in Hickman Co., Humphreys Co., or any lower-Duck main-stem location. (Adjacent Humphreys waters in schedule: none for streams.)
- Type: primary agency dataset. Confidence: high. Establishes: no trout program in this reach.

### S2. TWRA ArcGIS stocking layer (730 features) — shared evidence
- Retrieved 2026-09-25 from verified cache `tmp/research/completion/arcgis_all.json`. 4 Duck River sites exist, ALL Bedford Co. tailwater sites ~5 km below Normandy Dam; none in Maury/Hickman/Humphreys.
- Type: primary agency GIS. Confidence: high. Establishes: zero trout program downstream of Bedford.

### S3. TWRA "Duck River" Where-to-Fish page (lower-reach portions)
- Org: TWRA; live page, retrieved 2026-09-25. https://www.tn.gov/twra/fishing/where-to-fish/middle-tennessee-r2/duck-river.html
- Lower-reach content: Columbia-to-Centerville channel catfish electrofishing 53.2/hr (highest in Middle TN examples, ~13" avg); Centerville-to-mouth 38.8/hr (~13" avg, few over 17"); "trophy smallmouth and flathead catfish" on heavy tackle Centerville to mouth; confluences with Swan Creek and Piney River; access sites Littlelot, Williamsport (jet boat); 30 public access sites overall. Trout mentioned only for the Normandy TW sibling upstream.
- Type: agency fishery description. Confidence: high. Establishes: TWRA documents the lower reach as a warmwater smallmouth/catfish river. Observation basis: TWRA stream surveys (years not shown on page).

### S4. Wells, W.G. & Mattingly, H.T. (2020) — TVA IBI vouchers at lower-Duck sites
- "Evaluation of Benthic Fish Communities in the Clinch and Duck rivers as Habitat Indicators for the Endangered Pygmy Madtom, Noturus stanauli." SFC Proceedings No. 59, Aug 2020, DOI 10.7290/sfcp59aucu. PDF opened (`_work/madtom2020.pdf`).
- Observation dates/sites (Table 1; all lower Duck): Interstate 40 bridge 35.8807,-87.6949 (Nov 1993, Pygmy Madtom present); Barren Hollow Rd 35.8705,-87.7061 (Nov 1993, present); TN-230 35.7778,-87.3181 (Aug 2002, Aug 2007, present); Hite Ford 35.9278,-87.8036, Humphreys Co. (Jun 2008 present; 13 events Jun 1990–Jul 2014).
- Key finding: 26 benthic species recorded by TVA at these Duck sites (n=18 IBI events, 1990–2014).
- Type: peer-reviewed, agency-voucher backed. Confidence: high.
- Establishes: dated multi-decade warmwater fish-community documentation at four fixed lower-Duck stations, incl. federally endangered Pygmy Madtom. No salmonids anywhere in the study.

### S5. GBIF corridor census — voucher-backed fish list for Columbia→mouth (retrieved 2026-09-25)
- GBIF occurrence API, 21 fish-order keys, ±0.04 deg corridor along Columbia→mouth: 1,017 occurrences, 134 named taxa, years 1937–2026 (Auburn, U. Alabama, NCSM, NMNH, ROM, iNat RG).
- Lower-river character taxa: Cycleptus elongatus, Ictiobus bubalus/niger, Macrhybopsis storeriana/hyostoma, Sander canadensis (sauger!), Morone chrysops, Alosa chrysochloris (skipjack herring — marine-tolerant), Lepisosteus spp., Pylodictis olivaris (flathead), Micropterus dolomieu/punctulatus/salmoides, 12+ darter taxa, Noturus stanauli (Humphreys 1972–1984 NMNH), Noturus nocturnus/fasciatus, Percina apina/vigil/shumardi, Lampetra aepyptera. The big-river/sauger/skipjack fauna is consistent with the Kentucky Lake backwater influence at the downstream end.
- Salmonidae in corridor: 0.
- Type: aggregated vouchers. Confidence: medium-high (includes tributary mouths). Establishes: broad dated warmwater richness documentation for the reach.

### S6. TDEC fish advisories (official posted list, Rev. 2026; advisory news 2026-08-21)
- Org: TDEC Division of Water Resources, "Posted Streams, Rivers & Reservoirs", PDF Rev. 2026 (21 pp), downloaded 2026-09-25: https://www.tn.gov/content/dam/tn/environment/water/watershed-planning/wr_wq_fish-advisories.pdf
- Duck River entry: "Duck River, Humphreys, Hickman — From Cold Branch (River mile 11.5) to Interstate 40 (River mile 31.8) — HUC 06040003 — Mercury, PCB — Precautionary advisory for black bass (largemouth, smallmouth and spotted) for mercury. Precautionary advisory for Catfish for PCB."
- Related: "Buffalo River, Humphreys, Perry — from Duck River to Highway 438 — Mercury — Precautionary advisory for smallmouth bass."
- TDEC press release 2026-08-21 (via Clarksville Online, published 2026-08-21): new catfish/PCB precautionary advisory based on TVA fish-tissue sampling 2015–2023; channel catfish PCB weighted average 0.089 mg/kg vs 0.047 trigger; segment RM 11.5–31.8; black bass mercury advisory already in place "from the Buffalo River to I-40".
- Type: official agency advisory (species-annotated = warmwater fishery evidence). Confidence: high.
- Establishes: (a) warmwater fishery species (black bass, catfish) documented by tissue monitoring; (b) the reach is actively monitored by TVA/TDEC; (c) mercury/PCB advisory context for the mouth water. Observation dates: TVA tissue sampling 2015–2023.

### S7. WQP lane (csv) — tissue records absent from public extract
- waterqualitydata.us Result API queried 2026-09-25 (Hickman + Humphreys; sampleMedia=Biological Tissue; Mercury; also assemblage filters): 0 tissue result rows returned. County fish-assemblage pull returns water-column orgs only (USGS-TN, TDEC, EPA NARS). The TVA tissue data 2015–2023 behind S6 is not in the WQP public extract.
- Type: dataset check. Confidence: high (query returned header-only files, no errors).
- Establishes: WQP adds no trout-relevant or additional tissue evidence here; advisory PDF (S6) is the tissue documentation.

### S8. Kentucky Lake backwater / embayment extent
- TWRA Kentucky Reservoir page (live, retrieved 2026-09-25): "three major river embayments (Duck River, Beech River, and Big Sandy River)"; "Duck River Bottoms" dewatering area (fishing closed 5 days before/during late waterfowl season); "When flows are low, the main river channel near the Duck River can also produce good sauger fishing"; blue/channel/flathead catfish abundant; black bass 15" limits. https://www.tn.gov/twra/fishing/where-to-fish/west-tennessee-r1/kentucky-reservoir.html
- Tennessee Fish & Wildlife Commission minutes, Sept 26, 2016 (publications.tnsosfiles.com; surfaced via search snippet — direct fetch blocked 2026-09-25): "The Duck River embayment from DRM 4.0 upstream to its confluence with Blue Creek at approximate DRM 13.2 is closed year-round to all [fishing]" — i.e., the Kentucky Lake backwater on the Duck is managed as reservoir water at least to ~Duck RM 13.2 (Blue Creek confluence, Humphreys Co.).
- TDEC advisory segment RM 11.5 (Cold Branch)–31.8 (I-40) brackets the transition: below ~RM 11.5–13 is Lake-managed backwater; the river proper runs from ~I-40 upstream.
- USFWS Tennessee National Wildlife Refuge (fws.gov/refuge/tennessee/about-us, retrieved 2026-09-25): created by EO 9670 on 1945-12-28 after Kentucky Dam (1944); three units incl. Duck River Unit along the confluence area; refuge hosts 144 fish species (refuge-wide, Kentucky Lake context).
- Type: agency regs + federal refuge. Confidence: medium-high (DRM 13.2 figure is from a search snippet of TFWC minutes; direct PDF blocked).
- Establishes: the mouth water transitions into Kentucky Lake backwater near Humphreys Co.; lake-style warmwater fishery (sauger, catfish, bass) documented at the embayment.

### S9. Trout-occurrence claims tested (leads, all sub-fishery)
- GBIF 5103665455 — Oncorhynchus mykiss, PRESERVED_SPECIMEN, APSU collection, Mar 1987, locality "just outside of Bucksnort, TN" (Hickman Co.; coord 35.89,-87.86, no uncertainty given, CONTINENT_DERIVED_FROM_COORDINATES issue flag; collector unknown). I-40 crosses the Duck at RM 31.8 (per S6), near Bucksnort (exit 152); the specimen MAY be from the Duck near I-40 or an adjacent tributary. Single voucher, 38 years old, georeference fuzzy. TEST RESULT: unexplained historical stray (possible bait-bucket/early putback); does NOT evidence a trout fishery or program; contradicts nothing (TWRA documents summer temps >70 F on this river).
- GBIF 624096422 — O. mykiss, Oct 1969, "Blue Creek at St Rd 19 bridge, ca 2.5 mi S of Waverly", Humphreys Co. (Kuehne & Barbour, UF specimen). Blue Creek is a Tennessee River/Kentucky Lake tributary east of the Duck — NOT the Duck drainage. Logged as adjacent-drainage single voucher (1969).
- GBIF 624071965 — O. mykiss, Apr 1973, Piney River 5.6 mi SW of Dickson (Dickson Co.) — Piney River (Tennessee River drainage), not the Duck. Adjacent-drainage single voucher.
- iNaturalist Salmonidae (taxon 47520): reach boxes Centerville / lower-Duck-Bucksnort / mouth-embayment = 0 observations (mouth box 0; API 500s on two mid boxes after retries; wide-region query 31 obs with none on the Duck). Text search "Duck River" + Salmonidae = 1 global result, Wisconsin.
- USGS NAS county factsheet pages returned empty/blocked responses on 2026-09-25 — lane inconclusive from this environment; covered by GBIF/iNat negatives.
- Type: claim tests. Confidence: high that no contemporary trout occurrence is recorded in the reach; medium on the 1987 Bucksnort specimen's waterbody.

## CONTRADICTIONS FOUND
- None material. The 1987 APSU Bucksnort specimen is the only trout-relevant record plausibly inside the reach; it is a decades-old single preserved specimen with fuzzy georeference, unsupported by any stocking record (none exists below Bedford Co.) or any modern observation. All agency sources treat the reach as warmwater.

## SEARCHES RUN (Duck Mouth lane; all 2026-09-25)
1. WebSearch: Tennessee fish consumption advisory Duck River mercury TWRA TDEC 2024 2025
2. DDG: Duck River Tennessee fish advisory mercury TWRA (led to TDEC page + Clarksville articles)
3. WebSearch: Tennessee National Wildlife Refuge "Duck River Unit" Humphreys Kentucky Lake backwater
4. WebSearch: TVA Kentucky Reservoir "Duck River" embayment backwater "river mile" land plan Humphreys
5. WebSearch: "Kentucky Reservoir" "Duck River Embayment" TVA (surfaced TFWC 2016 DRM 4.0–13.2)
6. WebSearch: "Duck River embayment" "DRM 13.2"/Blue Creek closure (rate-limited)
7. Bing: site:publications.tnsosfiles.com "Duck River" embayment; TDEC "black bass" "Duck River" advisory year (blocked)
8. DDG-lite: TFWC embayment source; TDEC black bass advisory origin (blocked)
9. Crossref API: 10.7290/sfcp59aucu (opened full PDF)
10. GBIF API: 21-order corridor census Columbia→mouth; occurrence details for 5103665455 / 624071965 / 624096422
11. iNaturalist API: Salmonidae reach boxes; wide-region bbox
12. WQP API: tissue (Mercury) + assemblage pulls for Hickman/Humphreys
13. WebFetch/curl: TWRA Kentucky Reservoir page; USFWS Tennessee NWR page; TDEC advisories page + advisory PDF
14. Shared upstream evidence re-verified: schedule JSON parse, ArcGIS layer parse

## RECOMMENDATION
Warmwater CONFIRMED — strengthen row with: TWRA lower-Duck catfish/smallmouth/flathead documentation; Wells & Mattingly 2020 TVA IBI sites (1990–2014, incl. Pygmy Madtom, 26 benthic species); 134-taxa corridor voucher list (1937–2026); TDEC/TVA mercury+PCB black bass/catfish advisories RM 11.5–31.8 (tissue data 2015–2023) as warmwater-fishery context; Kentucky Lake embayment (DRM 0–~13.2) + Duck River Bottoms dewatering area as the downstream reservoir transition. Zero-trout-program state stands; no trout occurrence claim to carry beyond the logged 1987/1969/1973 single-voucher leads (none in-reach except the fuzzy 1987 specimen).
