# Research Completion Log — North Fork Holston River, Sullivan County, TN

- Ledger verdict under test: `warmwater-focus` (verify/strengthen)
- Reach scope (ledger): "State line downstream to the South Fork Holston River confluence at Kingsport (Sullivan County)". Note for the record: the fork's lower miles FORM the TN/VA state line, so the Tennessee reach is ~6 miles of river (TDEC counts RM 0.0–6.2, mouth at the confluence). It does NOT enter Fort Patrick Henry Lake — FPH Dam sits on the SOUTH Fork Holston ~2 river-miles from the confluence; the two waters are distinct in every source below.
- Research date (retrieval): 2026-09-25 (all retrievals this date unless noted)
- Mode: internal classification research, owner's map; no agencies/businesses/authors contacted; no edits outside this notes file
- Sibling discipline: SF Holston tailwater rows (Boone TW, FPH TW, S. Holston TW), FPH Lake, and the Holston main stem kept separate in every grep ("Holston" hits are ambiguous by default)

## 1. Reach / coordinates

- Catalog waterId `north-fork-holston-river`; GNIS 01487063; HUC8s 06010101/06010102/06010104; county Sullivan (ledger streams.json).
- Tennessee reach: from the state line (the river forms the line for its final miles) downstream to the NF/SF Holston confluence at Kingsport, where the Holston River main stem (`holston-river`) begins. Virginia water upstream is out of scope.
- Monitoring station cited in ledger: USGS-03490090 (North Fork Holston) and TDECWPC-NFHOL004.6SU.

## 2. Source-by-source evidence

### S1. TWRA statewide fishing regulation exceptions (LIVE, re-verified)
- Title/org: "Fishing Regulation Exceptions", TWRA (tn.gov). Publication: 2026 regs cycle. Retrieval 2026-09-25 (via r.jina.ai mirror; tn.gov resets plain curl).
- URL: https://www.tn.gov/twra/fishing-regs/fishing-regulation-exceptions.html
- Verbatim: "North Fork Holston River — Confluence with the South Fork Holston River upstream to the state line: Black Bass: Five (5) per day in combination; 13–17 inch PLR for Smallmouth bass, only one (1) Smallmouth bass over 17 inches per day." (Also on the same page: the identical smallmouth rule for the Holston main stem "John Sevier Dam upstream to the North Fork Holston River", and for the SF Holston "confluence with the North Fork upstream to Fort Patrick Henry Dam".)
- Type: agency regulation (current). Confidence: high. Establishes: TWRA manages the named TN reach as a SMALLMOUTH (black bass) water — a warmwater management entry keyed to the exact reach; no trout rule of any kind is attached to this river.

### S2. TWRA "Where to Fish" — negative result (LIVE)
- Retrieval 2026-09-25 (r.jina.ai mirror). URL: https://www.tn.gov/twra/fishing/where-to-fish/east-tennessee-r4.html
- The Region 4 where-to-fish index lists ONLY reservoirs (Calderwood, Boone, Cherokee, Chilhowee, Douglas, Ft. Loudoun, Ft. Patrick Henry, Melton Hill, Norris, South Holston, Tellico, Watauga). There is NO North Fork Holston River page — TWRA's reservoir-fishery publication layer does not cover this river.
- Type: agency site structure (negative). Confidence: high. Establishes: no agency trout-fishery narrative exists for the NF Holston; the river is absent from TWRA's where-to-fish product entirely.

### S3. TWRA 2026 trout stocking schedule JSON (616 rows, LIVE) — zero-stocking check
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json (fetched with browser User-Agent; retrieved 2026-09-25)
- Greps: "HOLSTON" → exactly 4 rows, ALL South Fork tailwaters: "Cherokee TW / Holston River" (Jefferson/Grainger), "Ft. Patrick Henry TW / S. Fork Holston River" (Sullivan), "S. Holston TW / S. Fork Holston River" (Sullivan), "Boone TW / S. Fork Holston River" (Sullivan/Washington). "FORK" grep catches no North Fork row. ZERO rows for the North Fork Holston River, any type, any month.
- Type: agency plan (planned, 2026). Confidence: high. Establishes: no planned trout stocking on the NF Holston in 2026; the adjacent SF Holston tailwater programs do not touch this river.

### S4. Water temperature — WQP re-verification of the ledger's prior lead (LIVE)
- URL: https://www.waterqualitydata.us/data/Result/search?siteid=USGS-03490090&siteid=TDECWPC-NFHOL004.6SU&characteristicName=Temperature,%20water&mimeType=csv
- Orgs: USGS Tennessee WSC (NAWQA) + TDEC Division of Water Pollution Control. Observation period 1995–2009 (35 rows); retrieved 2026-09-25.
- July grabs (deg C): 1995-07-31 = 29.5 (USGS, equal-width-increment, "stable, low stage"); 1998-07-14 = 26.6; 2001-07-17 = 24.59; 2003-07-15 = 22.69; 2004-07-28 = 22.84; 2005-07-06 = 22.86; 2006-07-11 = 24.61; 2007-07-10 = 27.14; 2008-07-22 = 25.88. (Feb 2000 reference grab: 7.19.)
- Type: agency monitoring (observed). Confidence: high. Establishes: July water 22.7–29.5 °C across 14 years — above the ~21 °C stress threshold for stocked trout EVERY July sampled; a warmwater thermal regime, re-confirming the ledger's prior lead.

### S5. TDEC fish-consumption advisory (the mercury history) — dated sources
- S5a. TDEC, "Posted Streams, Rivers, and Reservoirs in Tennessee" (posted-waters list, ~21 pp; located via search snippet of the tn.gov document): "Fish from the North Fork Holston and East Fork Poplar Creek are likely to be contaminated with mercury… do not eat the fish." Listing: North Fork Holston, Sullivan County, Mile 0.0–6.2 (i.e., the entire TN reach), HUC 06010101, mercury. (TDEC's fish-advisories web page at the guessed URL is 404; the document circulates as the official posting list — treat pinpoint as document-level.)
- S5b. WJHL (Tri-Cities CBS affiliate), "Where is it not safe to eat fish from in Northeast Tennessee?" (Outdoors Appalachia), posted 2023-04-11, updated 2023-04-12. URL: https://www.wjhl.com/outdoors-appalachia/where-is-it-not-safe-to-eat-fish-from-in-northeast-tennessee (Wayback snapshot 2023-06-06: http://web.archive.org/web/20230606162335/https://www.wjhl.com/outdoors-appalachia/where-is-it-not-safe-to-eat-fish-from-in-northeast-tennessee/). Verbatim: warnings cover "the six miles of the North Fork Holston River that's inside Tennessee, where any consumption of fish is advised against due to mercury levels found in fish there"; "One river has a stricter advisory in place: the North Fork Holston River… From head to Virginia state line for all fish due to mercury." Data source: TDEC's annually updated advisory list (June 2022 data cited in article).
- S5c. WBIR (Knoxville), "Here are the fish consumption advisories in East Tennessee" (Nov 2024 per search-result dating), URL: https://www.wbir.com/article/news/local/fish-consumption-advisories-in-east-tennessee/51-ef16a3ef-f8d6-4e3f-a2c9-4d8a103ef67d — "North Fork Holston River: Fish shouldn't be eaten at all." (Gannett page returns 403 to fetchers; wording and date from search-index metadata — medium confidence on exact date, high on content.)
- S5d. WJHL, "TDEC extends fish consumption advisories on Cherokee Lake, Nolichucky River due to mercury" (Slater Teague, 2020-01-08): attributes the NF Holston mercury to "1960s–70s pollution from the Olin Chlor Alkali plant in Saltville, Virginia"; the Holston above Cherokee "remains an advisory for all fish species."
- Type: state agency advisory + dated news. Confidence: high. Establishes: the river's fishery is documented as a CONSUMPTION-limited warmwater fishery — a "do not eat" mercury advisory covering the entire 6-mile TN reach, continuous across 2020–2024 reporting. NOTE: dated sources attribute the contamination to the Olin Saltville VA chlor-alkali plant — the task-context memory of "fly-ash from the Carbide plant" is NOT what the sources say (no fly-ash/Carbide claim and no PCB claim for the NF Holston was found; the PCB+chlordane catfish/carp precautionary advisory in this area belongs to BOONE LAKE, per TWRA's Boone page).

### S6. Occurrence databases (GBIF / iNaturalist, live APIs, retrieved 2026-09-25)
- Bounding box of the TN reach + state-line segment: 36.47–36.66 N, −82.70 to −82.45 W.
- Smallmouth Bass (Micropterus dolomieu): 5 GBIF museum/agency records 1967–1977 (36.50–36.62, −82.50 to −82.61); 8 research/casual iNat records 2018–2025, incl. 2025-06-22 at 36.5091,−82.6104 "Kingsport, TN" (on the state-line/TN segment; iNat 292190120) and research-grade records immediately upstream on the VA reach (Weber City 2025-08-17 #307157422, 2025-06-08 #290678997; Scott Co 2019, 2020). Warmwater gamefish presence documented on the river 1967–2025.
- Redeye Bass (Micropterus coosae): ZERO GBIF records and ZERO iNat records in the box. The "redeye bass?" hypothesis is NOT supported by any occurrence data — the river's black bass are smallmouth (plus, downstream, the reservoirs' largemouth/spotted).
- Trout: (a) ONE research-grade Rainbow Trout iNat record, 2026-05-02, "North Fork Holston River, Hiltons, VA" (36.6296,−82.4991 ±4 m; iNat 357668097) — on the VIRGINIA reach upstream of the state line; a single angler-photographed fish, no reproduction evidence (single catch = lead, not a fishery); (b) 12 GBIF Brown Trout records 2003–2007 (TWRA fish data via MARIS/BISON, dataset d6cc311c, "stocked" pathway, Jan-1 placeholder dates) at 36.49–36.50, −82.51/−82.52 — those points sit AT Fort Patrick Henry Dam and its tailwater (the FPH TW trout-stocking unit), ~2 river-miles from the NFH confluence, NOT on the NF Holston reach; they document the SIBLING water's stockings. No rainbow/brook trout records on the TN reach at all.
- Type: third-party/agency occurrence data. Confidence: medium. Establishes: smallmouth = the documented bass; redeye = absent; trout = none on the TN reach except one VA-reach photo and mislocated sibling-water stocking records.

## 3. Warmwater evidence summary
1. Management: TWRA's current regulation exceptions give the named reach a smallmouth-bass PLR (13–17 in, one over 17/day) — a black-bass management rule, no trout rule (S1).
2. Thermal regime: July water 22.7–29.5 °C (1995–2008) — never trout-supporting in summer (S4).
3. Program: zero trout stocking rows 2026; absent from TWRA's trout-facing products entirely (S2, S3); no TWRA where-to-fish page (S2).
4. Public health framing: the river's documented "fishery" story is a warmwater consumption advisory (do-not-eat, mercury, entire reach) in force through 2020–2024 reporting (S5).
5. Occurrences: smallmouth present 1967–2025; redeye absent; trout absent from the TN reach (S6).

## 4. Contradictions / tension points
1. Task-context memory says "redeye bass?" — no occurrence database or agency source shows redeye bass in this river; smallmouth is the documented bass. Do not add redeye to any species list.
2. Task-context memory says "fly-ash from the Carbide plant" — dated sources attribute the mercury to the Olin Chlor Alkali plant (Saltville, VA). No PCB advisory was found for the NF Holston (Boone Lake holds the local PCB/chlordane advisory).
3. The GBIF brown-trout cluster near the reach (2003–2007) belongs to the Fort Patrick Henry tailwater stocking unit ~2 miles away; its points should not be attributed to this river.
4. One 2026 research-grade rainbow photo on the VA reach (Hiltons) is upstream water, outside Tennessee — a lead only.

## 5. Searches run (NF Holston; ≥8)
1. WebSearch: TWRA "North Fork Holston" River Tennessee where to fish smallmouth — ok (R4 page negative; regs + advisory leads)
2. WebSearch: TDEC fish advisory "North Fork Holston" mercury Sullivan Hawkins county — 429 rate-limited (retried as #4)
3. WebSearch: "North Fork Holston River" Tennessee smallmouth bass fishing Kingsport — 429
4. WebSearch: TDEC "posted waters" fish advisory "North Fork Holston" mercury "6.2 miles" — partial (found TDEC Posted Streams doc; WJHL/WBIR/Rogersville leads)
5. WebSearch: WJHL North Fork Holston "do not eat" fish mercury advisory 2023 — ok (WJHL Apr-2023 URL)
6. WebSearch: "redeye bass" OR "Micropterus coosae" Holston River Tennessee Virginia — 429 (answered instead via GBIF/iNat: zero records)
7. WebSearch: wbir 2024 "North Fork Holston" fish should not be eaten mercury — ok (WBIR URL + TDEC-Cherokee WBIR lead)
8. WebSearch: "North Fork Holston" trout stocking Tennessee — ok, and NONE: no source claims trout stocking on the TN reach (search-engine aside claiming "TWRA stocks the TN portion" was unverified chatter, directly contradicted by the 2026 schedule grep — discarded)
Plus direct fetches: TWRA regs exceptions page (mirror); TWRA where-to-fish R4 index (mirror); TDEC advisories page (404) ; WQP temperature CSV (2 siteids); GBIF species-match ×9 + occurrence search ×24 (3 waters); iNat API corridor query ×8 taxa + 2 detail pulls; Wayback availability checks (WBIR 403/no snapshot; WJHL snapshot 2023-06-06).

## 6. RECOMMENDATION

**CONFIRM `warmwater-focus` for North Fork Holston River (TN reach, Sullivan County). Confidence: high.**

- Warmwater is the documented character on every axis: TWRA regulates the reach by name as smallmouth water (13–17 in PLR, current regs page); July temperatures ran 22.7–29.5 °C across 1995–2008 (re-verified live at WQP); smallmouth occurrences span 1967–2025; and the river's public profile is a mercury do-not-eat advisory (TDEC; WJHL 2023, WBIR 2024) covering the entire ~6-mile reach.
- Zero trout: no row of any type in the 2026 schedule (616 rows grepped); no trout rule, page, or narrative in any TWRA product; no trout occurrence on the TN reach (single VA-reach photo = lead; the nearby GBIF brown-trout cluster is the FPH-tailwater unit's data).
- Do not add redeye bass; do not re-attribute the FPH tailwater trout records; keep the SF Holston tailwater rows and FPH Lake separate as now.
