# Completion Log — French Broad River (Douglas Dam tailwater), Sevier County, TN

- Ledger verdict under test: `warmwater-focus`
- Retrieval date (all sources): 2026-09-25
- Mode: research only. No agency/business/author contact. No repo edits (only this log written).

## Scope note
The reach under classification is the French Broad River **below Douglas Dam** (Sevier/Cocke/Jefferson county line area, ~35.79N 83.55W) running northwest to the Holston River confluence near Knoxville. TN province, Region 4 (TWRA).

## Sources opened and evidence

### S1. TWRA — "Statewide Fishing Regulation Exceptions" (2026-27 season regs)
- Title/author/org: "Statewide Fishing Regulation Exceptions", Tennessee Wildlife Resources Agency (tn.gov)
- Publication date: current 2026-27 regulation cycle (undated page; live state regulations); retrieval 2026-09-25
- Observation date: n/a (regulatory text)
- URL: https://www.tn.gov/twra/fishing-regs/fishing-regulation-exceptions.html
- Fields: County Sevier/Jefferson; water "French Broad River Hwy. 168 to Douglas Dam"
- Quote (verbatim): "French Broad River Hwy. 168 to Douglas Dam. • Smallmouth bass: Five (5) fish limit, 18-inch minimum length limit."
- Warmwater evidence: TWRA writes a tailwater-specific rule for **smallmouth bass** — a warmwater gamefish — for the exact reach below Douglas Dam. No trout-season/creel entry exists for this reach anywhere on the page.
- Type: agency regulation; Confidence: high
- Establishes: warmwater/coolwater regulatory treatment of the tailwater reach. Does not by itself state release temperature.

### S2. TWRA — "Trout Fishing & Stockings in Tennessee"
- Title/author/org: "Trout Fishing & Stockings in Tennessee", TWRA
- Publication date: 2026 stocking cycle; retrieval 2026-09-25
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings.html
- Quote (verbatim): "Tailwater Trout Stocking Information — TWRA stocks fingerling and adult trout into **coldwater tailwaters below dams** to provide fishing opportunities."
- Tailwaters enumerated on the page: Dale Hollow TW/Obey, Normandy TW/Duck, Center Hill TW/Caney Fork, Tims Ford TW/Elk, S. Holston TW, Wilbur TW/Watauga, Boone TW/S. Fork Holston, Ft. Patrick Henry TW, Cherokee TW/Holston, Norris TW/Clinch, Apalachia TW/Hiwassee, J. Percy Priest TW/Stones. Reservoir trout list: Dale Hollow, Parksville, Calderwood, Chilhowee, Fort Patrick Henry, South Holston, Tellico (Upper), Watauga.
- **Douglas TW / French Broad appears in neither list.**
- Warmwater evidence: agency program statement that trout go only into coldwater tailwaters, with the Douglas/French Broad tailwater excluded from both the tailwater and reservoir stocking programs (i.e., releases not managed/used as coldwater trout habitat).
- Type: agency program description; Confidence: high
- Establishes: zero trout stocking; programmatic warmwater classification. Does not include a numeric release-temperature sentence.

### S3. TWRA — 2026 Trout Stocking Schedule dataset (616 rows)
- Title/author/org: "2026 Trout Stocking Schedule" datatable JSON, TWRA
- Publication date: 2026 schedule; retrieval 2026-09-25
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json
- Fields per row: REGION, COUNTY, LOCATION, TYPE, STOCKING DAY, STOCKING WEEK, STOCKING MONTHS, SPECIES
- Check: downloaded full JSON (108,620 bytes); `grep -ic douglas` = **0**; `grep -ic "french broad"` = **0**; 616 SPECIES rows total; only Sevier County rows are "Gatlinburg Streams" (Delayed Harvest, Rainbow). Note: closest tailwater entry is "Cherokee TW / Holston River" (Cherokee's release is cold enough for trout; Douglas's is not stocked).
- Type: agency stocking dataset (dated); Confidence: high
- Establishes: zero trout stocking, 2026, both waters.

### S4. TWRA — Douglas Reservoir page (covers French Broad arm/runs)
- Title/author/org: "Douglas Reservoir in Tennessee | Bank and Boat Fishing Opportunities", TWRA
- Publication date: undated TWRA page; live page retrieved 2026-09-25 byte-identical (70,332 bytes) to the repo capture docs/research/2026-09-22-fishery-opportunities/captures/twra-fishery-douglas-lake.html (captured 2026-09-22)
- URL: https://www.tn.gov/twra/fishing/where-to-fish/east-tennessee-r4/douglas-reservoir.html
- Quotes (verbatim):
  - "Sauger and Walleye provide a seasonal fishery and each spring, both species make spawning runs **up the French Broad River**."
  - "White bass makes a spawning run **up the French Broad River** in the late winter... Leadvale area is a good place to fish."
  - "Restrictions on Walleye and Sauger or Sauger/Walleye hybrids also include Pigeon and French Broad Rivers upstream of Douglas Dam to the North Carolina state line."
- Trout mentions in page body: 0 (2 occurrences are navigation menu only)
- Warmwater evidence: the fishery TWRA describes on the French Broad arm is white bass + sauger + walleye (coolwater) spawning runs; no trout fishery described.
- Type: agency fishery description; Confidence: high
- Establishes: tailwater/upper-river species composition per agency. Observation dates: seasonal (late-winter/spring runs) as described.

### S5. TWRA — Tailwater trout electrofishing survey storymap (ArcGIS StoryMap)
- Title/author/org: TWRA annual tailwater trout electrofishing summaries (linked from the TWRA Weekly Fishing Report as "annual electrofishing surveys on Tennessee's tailwater trout fisheries")
- Publication metadata: datePublished 2021-04-08 (still the linked summaries page in 2026); retrieval 2026-09-25
- URL: https://storymaps.arcgis.com/stories/dbb92bdf718f4fd7839bf4b08fb82747
- Sections (h3): Apalachia TW (Hiwassee), Big Soddy Creek, Boone TW (S. Fork Holston), Center Hill TW (Caney Fork), Cherokee TW (Holston), Dale Hollow TW (Obey), Fort Patrick Henry TW, Gatlinburg Area Streams, Normandy TW (Duck), Norris TW (Clinch), South Holston TW, Tellico River, Tims Ford TW (Elk), Wilbur TW (Watauga).
- Counts: "douglas" 0, "french broad" 0, "cherokee" 9.
- Warmwater evidence: the agency's census of tailwater trout fisheries omits Douglas TW/French Broad while including neighboring Cherokee TW on the Holston.
- Type: agency survey compilation (dated 2021); Confidence: medium-high
- Establishes: absence from the managed tailwater-trout census; not a temperature statement.

### S6. Community/secondary (leads only, not used for verdict)
- fishing-licenses.us Douglas/French Broad rules summary (18-inch smallmouth on Hwy 168→Douglas Dam) — consistent with S1; single-source secondary.
- USLakeLife Douglas Lake page — sauger holding in the deeper French Broad channel in fall/winter, active below 55 F water — lead, not agency.
- Facebook angler report — "water temperature this morning was 62F" at Douglas Dam launch — lead only.
- iNaturalist (api.inaturalist.org, retrieved 2026-09-25): Salmonidae in tight tailwater bbox (35.76-35.99N, -83.88..-83.54W): 6 records, ALL at Pigeon Forge / West Prong Little Pigeon / Sevierville upstream stocked tributaries (e.g., obs 364882028, 203256791, 196562363); none on the French Broad mainstem below the dam. Micropterus dolomieu in same bbox: 34 records incl. Sevierville 2026-03-28 (obs 346302309), 2026-05-11 (obs 360574018), 2026-07-09 (obs 379867458) — warmwater-fauna signal. GBIF Salmonidae in bbox: 4 records, same tributary situation.

## Mirror/retrieval attempts that failed (documented)
- tva.com lake/dam pages (environment/lake-management/douglas-reservoir; energy/power-production/hydroelectric/douglas-dam): HTTP 403 (Akamai) or 404; web.archive.org CDX/availability: no snapshots of those URLs; sitemap.xml 403. No TVA page text could be retrieved on 2026-09-25, so no verbatim TVA release-temperature sentence was obtainable. TVA is therefore cited as attempted-but-unretrievable, and the agency position is carried by TWRA sources S1-S5.
- Old TWRA advisory URL (tn.gov/twra/fishing/fish-consumption-advisories.html): 404 (page moved; current location not found in this pass).
- DuckDuckGo html/lite endpoints: bot-challenge; Bing: ignored site: filter. USGS NWIS: no active IV gage with water temperature on the tailwater reach (nearest IV gage: Little Pigeon R at Sevierville 03470000).
- Tennessee Trout Management Plan 2017-2027 PDF (https://www.tn.gov/content/dam/tn/twra/documents/fishing/Tennessee-Trout-Management-Plan-2017-2027.pdf, retrieved 2026-09-25, 60 pp): "French Broad" appears only re native Brook Trout restoration in mountain headwater streams (GSMNP/Cosby/Big Creek), "Douglas" 0 mentions; states hatchery-supported waters "are primarily warmwater habitats that cannot support trout year round." Consistent, but does not name the tailwater.

## Searches run (distinct, French Broad)
1. WebSearch: TWRA French Broad River Douglas Dam tailwater smallmouth sauger fishing Tennessee
2. WebSearch: TVA Douglas Dam tailwater releases warm water fish species below dam
3. WebSearch: "Douglas Dam" tailwater water temperature trout "too warm" OR "not cold" OR warmwater
4. WebSearch: Tennessee fish consumption advisory French Broad River Douglas Dam smallmouth bass white bass sauger (timed out)
5. DuckDuckGo lite: "douglas dam" tailwater "warm" trout TVA (bot-challenged)
6. DuckDuckGo lite + Bing: TVA Douglas Reservoir site:tva.com (blocked / off-target)
7. Source-internal searches: 2026 stocking JSON grep; trout-info page tailwater list extraction; Trout Mgmt Plan PDF full-text grep; regulation-exceptions page grep; storymap full-text grep; iNat/GBIF bbox queries (counts above)

## Findings vs. chase list
- (a) Agency documentation of warmwater character: TWRA program statement (trout only into "coldwater tailwaters") + exclusion of Douglas/French Broad from every TWRA trout tailwater/reservoir list + smallmouth-specific tailwater regulation. Explicit TVA release-temperature sentence NOT retrievable (TVA blocked, no archive). Best-available agency verification achieved via S1+S2+S5.
- (b) Smallmouth/sauger/white bass fishery: confirmed (S1 smallmouth rule; S4 white bass/sauger/walleye runs up the French Broad; iNat smallmouth records).
- (c) Zero trout stocking: confirmed (S3 dataset; S2 lists).
- (d) Dated source: S3 (2026 schedule), S5 (2021-04-08), TWRA weekly report cycle 2026.

## Recommendation
**warmwater confirmed** — keep `warmwater-focus`. Agency sources consistently treat the Douglas Dam tailwater of the French Broad as a warmwater/coolwater (smallmouth/sauger/walleye/white bass) fishery with zero trout stocking; no evidence of any trout fishery was found. Residual gap: no verbatim agency sentence on release temperature (TVA unretrievable) — noted as a non-blocking gap.
