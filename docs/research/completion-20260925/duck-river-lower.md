# Duck River Lower (Bedford / Marshall / Maury) — warmwater main-stem classification log

Water: Duck River main stem, middle reach — Normandy Dam/Shelbyville (Bedford Co.) through Marshall Co. to Columbia (Maury Co.). Warmwater-focus row.
Research date (retrieval date for all sources): 2026-09-25. Internal classification research only; no contacts made.

## VERDICT UP FRONT
Warmwater CONFIRMED (well documented, multiple dated agency + academic + voucher sources). Zero trout program on the main stem confirmed. The only trout content on the entire Duck is the Normandy Dam tailwater sibling (Bedford Co., dam to Three Forks Bridge), already classified separately. No credible modern trout occurrence found anywhere in this reach (GBIF: 0; iNaturalist: 0).

---

## SOURCES

### S1. TWRA 2026 Trout Stocking Schedule (JSON, 616 rows)
- Org: Tennessee Wildlife Resources Agency (tn.gov)
- Publication: 2026 season schedule; retrieved 2026-09-25 (browser-context; tn.gov blocks plain curl). Cached copy used from prior verified pass: `tmp/research/completion/schedule2026-jina.txt` (616 rows parsed).
- Direct URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json
- Fields checked: REGION / COUNTY / LOCATION / TYPE / STOCKING DAY/WEEK/MONTHS / SPECIES for all 616 rows; case-insensitive grep for "Duck".
- Result: exactly ONE Duck row in the whole state schedule: `REGION 2 | Coffee/Bedford | "Normandy TW / Duck River" | TYPE=Tailwater | months J,F,M,N,D | Rainbow Trout`. This is the sibling tailwater (Normandy Dam), NOT the free-flowing main-stem reach. ZERO stocking rows for Marshall Co., Maury Co., or any main-stem (non-tailwater) Duck location.
- Type: primary agency dataset. Confidence: high.
- Establishes: absence of a trout stocking program on the middle/lower main stem (2026 schedule). Not contradicted.

### S2. TWRA ArcGIS trout stocking layer (cached full layer, 730 features)
- Org: TWRA stocking sites feature layer; retrieved 2026-09-25 from cache `tmp/research/completion/arcgis_all.json` (prior verified pass).
- Result: 4 features with StreamName "Duck River", ALL Bedford Co., ALL StockingProgram="Tailwater", species=rainbow: Normandy Dam (35.4638,-86.2465), Second Bridge (35.4577,-86.2575), Dement Bridge (35.4665,-86.2947), Three Forks Bridge (35.4800,-86.3250). All within ~5 km below Normandy Dam. Zero sites in Marshall or Maury; zero main-stem sites anywhere on the Duck.
- Type: primary agency GIS data. Confidence: high.
- Establishes: the trout program is confined to the Normandy TW sibling segment.

### S3. TWRA trout storymap — "Normandy Tailwater (Duck River)"
- Org: TWRA; cached JSON `tmp/research/completion/storymap_data.json` (prior verified pass); retrieved 2026-09-25.
- Quotes: "The Duck River below Normandy Dam... only suitable for trout 8 months out of the year"; "1.5 miles of river bank between the two bridges"; "Several hundred trout are stocked here"; regs = statewide trout rules (7/day).
- Type: agency narrative. Confidence: high.
- Establishes: trout suitability of the Duck is limited to the cold tailwater reach below Normandy Dam during the Nov–Jun stocking window; main stem is a summer-warm river (summers >70 F per TWRA R2 page, S4).

### S4. TWRA "Duck River" Where-to-Fish page (Region 2 / Middle TN)
- Org: TWRA. Publication date: undated live page; retrieved 2026-09-25.
- Direct URL: https://www.tn.gov/twra/fishing/where-to-fish/middle-tennessee-r2/duck-river.html
- Fields: 284-mile river; "most biologically diverse river in North America"; 151 fish species, 50+ mussels; gamefish = largemouth/smallmouth/spotted bass (smallmouth to 20"), rock bass (more common upstream of Columbia), channel/blue/flathead catfish, walleye (occasional below Normandy), panfish; trout listed ONLY as "stocked" in the Normandy tailwater (dam to Three Forks Bridge, Nov–Jun, water >70 F unsuitable in summer).
- Reach-relevant electrofishing numbers cited: Duck stands out for channel catfish (~29/hr average Middle TN; 25.6/hr, 18" avg below Henry Horton SP; Columbia-to-Centerville 53.2/hr — the highest cited).
- Type: agency fishery description. Confidence: high.
- Establishes: TWRA frames the ENTIRE main stem as a warmwater bass/rock bass/catfish/walleye river; trout content belongs exclusively to the tailwater sibling. Warmwater documentation, dated only by retrieval (live page).

### S5. Wells, W.G. & Mattingly, H.T. (2020) — benthic fish community of the Duck River (TVA IBI vouchers)
- Title: "Evaluation of Benthic Fish Communities in the Clinch and Duck rivers as Habitat Indicators for the Endangered Pygmy Madtom, Noturus stanauli." Southeastern Fishes Council Proceedings No. 59 (published August 2020). DOI 10.7290/sfcp59aucu. PDF opened (local cache `_work/madtom2020.pdf`).
- Observation dates: TVA Index of Biotic Integrity sampling June 1990 – July 2014, 18 events at 4 Duck sites (Table 1): Interstate 40 bridge (35.8807,-87.6949; Nov 1993, Pygmy Madtom present), Barren Hollow Rd (35.8705,-87.7061; Nov 1993, present), TN-230 bridge (35.7778,-87.3181; Aug 2002 + Aug 2007, present), Hite Ford (35.9278,-87.8036; June 2008, present; 13 events 1990–2014). Note: all four sites are lower-Duck (relevant to the mouth water; the main-stem-in-Maury lower boundary at Columbia is just upstream of TN-230).
- Key finding: "TVA biologists recorded a much more speciose benthic fish community in the Duck River (n = 26) than we encountered in the Clinch River (n = 9)."
- Type: peer-reviewed paper built on agency IBI vouchers. Confidence: high.
- Establishes: dated, voucher-backed warmwater benthic community incl. federally endangered Pygmy Madtom in the Duck main stem; sampled only in warmwater habitat. No trout appears anywhere in the study.

### S6. Abernathy, A. & Mattingly, H.T. (2011) — Striated Darter, Duck River
- Title: "Population Status and Environmental Associations of the Rare Striated Darter, Etheostoma striatulum." Southeastern Fishes Council Proceedings No. 53. DOI 10.7290/sfcp53hukj (metadata via Crossref API, retrieved 2026-09-25).
- Reach: middle-to-upper Duck watershed (Bedford/Marshall/Maury) — endemism evidence for the middle reach.
- Type: peer-reviewed. Confidence: high (metadata verified; full text not re-opened).
- Establishes: dated academic survey presence of a rare warmwater endemic darter in the middle Duck; strengthens "species-rich warmwater" classification.

### S7. Bajo-Walker, A.L., Wheeler, K. & Hurt, C.R. (2024) — eDNA survey of the middle Duck
- Title: "eDNA Illuminates Broader-Than-Expected Distribution of an Imperiled Freshwater Darter Species (Percidae: Etheostoma striatulum) in the Duck River, Tennessee." Southeastern Naturalist 23(2), published 2024-07-02. DOI 10.1656/058.023.0211 (metadata via Crossref API, retrieved 2026-09-25).
- Reach: Duck River (middle-to-upper; striated darter habitat). Field dates not extracted (paywalled); publication 2024.
- Type: peer-reviewed eDNA survey. Confidence: high.
- Establishes: current (2020s) detection of an imperiled warmwater endemic in the middle Duck; supports continued high-diversity warmwater status.

### S8. GBIF corridor census — voucher-backed fish list for the middle reach (retrieved 2026-09-25)
- Method: GBIF occurrence API (api.gbif.org/v1), 21 fish-order taxon keys, polygon corridor ±0.04 deg along the Shelbyville→Columbia Duck path; 1,653 occurrences, ~93 named fish taxa, collection/observation years 1937–2026. Datasets: Auburn University Museum Fish Collection, Univ. of Alabama Ichthyology Collection, NCSM, NMNH, iNaturalist research-grade.
- Representative taxa: Micropterus dolomieu (smallmouth), M. punctulatus (spotted), Micropterus/Lepomis spp. (5 sunfish taxa), 15+ Etheostoma/Nothonotus darters incl. E. striatulum, E. obama, E. planasaxatile, Nothonotus aquali, Noturus madtoms (N. flavus, miurus, elegans, exilis, fasciatus), Cottus carolinae, redhorse (Moxostoma spp.), gar (Lepisosteus osseus), white bass/ striped-bass family (Morone mississippiensis), plus invasive silver carp Hypophthalmichthys molitrix (Maury 2016 — classic warmwater big-river invader).
- Salmonidae in corridor: 0.
- Type: aggregated museum/citizen-science vouchers. Confidence: medium-high (corridor polygon includes tributary mouths; species-level IDs mostly research-grade).
- Establishes: broad, dated warmwater species documentation for the exact middle reach. Caveat: not a published agency list; counts as documentation of richness, supplement to S4–S7.

### S9. "151 fish species" biodiversity figure (corroborated claims)
- TNC Duck River place page, nature.org, page dated 2026-04-10 (fetched 2026-09-25): 151 fish species, 60+ mussels, 22 snails; "one of the richest rivers in the United States"; USGS global fish/mussel diversity hotspot. https://www.nature.org/en-us/get-involved/how-to-help/places-we-protect/duck-river/
- TDEC ARAP public notice NRS22.201 (Duck River Utility Commission withdrawal), Dec 2023: states Duck River supports 151 fish, 22 snail, 56 mussel (16 federally endangered) species (surfaced in search results; dataviewers.tdec.tn.gov — direct doc not opened).
- News of TDEC decision, Apr 5 2022 (News from the States syndication): same 151/56/22 figures in the Marshall County withdrawal-appeal context.
- National Rivers Project (nationalriversproject.com): "151 species of fish."
- Type: agency/NGO biodiversity claims. Confidence: high for the number's currency; the figures trace to TDEC/USGS assessments (observation basis not exposed).
- Establishes: standing species-richness documentation for the whole river incl. the middle reach. Not a trout claim.

### S10. Trout-claim tests (all negative for this reach)
- GBIF Salmonidae (key 8615) bbox lat 35.3–36.2, lon -88.1…-85.9: 46 records, NONE on the Duck main stem in Bedford/Marshall/Maury. Nearest: Caney Fork tailwater (Smith Co., 2000-2008), Harpeth/Franklin and Spring Hill cluster (2016-2026, Williamson Co. neighborhood-release pattern — many same-day obs 2020-12-19 and 2021-01-23), Buffalo River headwaters (Lawrence Co. 2016-2017). GBIF record 5103665455 (APSU preserved specimen, Oncorhynchus mykiss, Mar 1987, "just outside of Bucksnort, TN", Hickman Co.) is the only potentially main-stem voucher anywhere near the basin — belongs to the mouth-water reach (see duck-river-mouth.md); treated as a 38-year-old single stray lead, NOT a fishery.
- iNaturalist (api.inaturalist.org, taxon 47520 Salmonidae): same-region bbox = 31 obs, zero georeferenced on the Duck in Bedford/Marshall/Maury (reach boxes Normandy/Shelbyville, Marshall, Columbia all = 0). Text search "Duck River"+Salmonidae globally = 1 obs, a Wisconsin river.
- USGS NAS: county factsheet pages (nas.er.usgs.gov/queries/factsheet.aspx?State=TN&County=…) returned empty/blocked responses on 2026-09-25 (query path unavailable); NAS lane inconclusive from this environment — covered by GBIF/iNat negatives.
- Type: absence-of-evidence checks across two independent occurrence databases. Confidence: high for "no contemporary main-stem trout occurrences recorded."

## CONTRADICTIONS FOUND
- None material. TWRA's own main-stem page lists trout only under the tailwater sibling. The one GBIF trout voucher within the basin bbox (APSU 1987 Bucksnort specimen) sits in the lower-reach segment and is decades old with fuzzy georeference — logged, not class-changing.

## SEARCHES RUN (Duck Lower lane; all 2026-09-25)
1. WebSearch: Duck River Tennessee fish species diversity "150 species"/"most biologically" study
2. WebSearch: Duck River fish assemblage species list survey Maury Marshall County academic
3. WebSearch: TDEC "Duck River" ARAP "151 fish species" Duck River Utility Commission 2023
4. WebSearch: "Striated Darter" "Duck River" 2024 Southeastern Fishes Council
5. Semantic Scholar API: "striated darter Duck River habitat"; "Duck River Tennessee fish assemblage"
6. DDG: "Evaluation of Benthic Fish Communities" pygmy madtom Duck river pdf (PDF opened)
7. Crossref API: 10.1656/058.023.0211; 10.7290/sfcp53hukj; 10.7290/sfcp59aucu
8. Schedule JSON parse (616 rows) + grep "duck"
9. ArcGIS layer parse (730 features) + grep Duck
10. GBIF API: species/match x25, Salmonidae bbox, 21-order corridor census (middle + lower), occurrence detail pulls
11. iNaturalist API: taxa resolve, Salmonidae bbox + per-reach boxes, "Duck River" text search, fish-taxa count (Columbia box: 55 RG fish obs)
12. USGS NAS factsheet fetch (returned empty — logged)
13. WebFetch: TWRA R2 Duck River page; TNC Duck River page
14. DDG: TDEC ARAP NRS22.201 pdf (blocked)

## RECOMMENDATION
Warmwater CONFIRMED — strengthen row with: TWRA 151-fish-species / "most biologically diverse" main-stem page; Wells & Mattingly 2020 (TVA IBI 1990-2014 vouchers); SEAN 2024 eDNA study; ~93-taxa corridor voucher list (1937-2026). Zero-trout-program state stands (2026 schedule + ArcGIS layer: only Normandy TW sibling, Bedford Co., dam→Three Forks Bridge). No trout occurrence claims to carry.
