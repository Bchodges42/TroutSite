# Completion Log — Douglas Lake (Douglas Reservoir), Jefferson/Sevier/Cocke/Hamblen Counties, TN

- Ledger verdict under test: `warmwater-focus`
- Retrieval date (all sources): 2026-09-25
- Mode: research only. No agency/business/author contact. No repo edits (only this log written).

## Sources opened and evidence

### S1. TWRA — "Douglas Reservoir in Tennessee | Bank and Boat Fishing Opportunities" (reservoir page)
- Title/author/org: TWRA, Region 4 "Where to Fish" reservoir page
- Publication date: undated TWRA page. Two retrievals: committed repo capture (captured 2026-09-22, docs/research/2026-09-22-fishery-opportunities/captures/twra-fishery-douglas-lake.html, 70,332 bytes) and live fetch 2026-09-25 — live page byte-identical (70,332 bytes); og:url/canonical = same URL.
- URL: https://www.tn.gov/twra/fishing/where-to-fish/east-tennessee-r4/douglas-reservoir.html
- Quotes (verbatim):
  - "Largemouth bass, crappie, bluegill, and catfish are the most popular game fish for Douglas anglers. Sauger, walleye, and white bass also provide excellent fishing opportunities when they make their late-winter spawning runs to the headwaters."
  - "White bass makes a spawning run up the French Broad River in the late winter."
  - "Sauger and Walleye provide a seasonal fishery and each spring, both species make spawning runs up the French Broad River."
  - Regulations text: black bass 5/day with 16-inch seasonal cap; crappie 15/day, 10-inch min; walleye/sauger 5/day combination.
- Trout mentions in page body: 0 (2 occurrences are navigation menu only)
- Warmwater evidence: entire described fishery is warmwater/coolwater; thermocline-oriented summer tips ("depths of less than 10 feet (above the thermocline)") indicate a warm, productive reservoir.
- Type: agency fishery description; Confidence: high
- Establishes: warmwater species composition per the managing agency. Not a temperature statement per se.

### S2. TWRA — 2026 Trout Stocking Schedule dataset (616 rows) + reservoir stocking list
- Title/author/org: "2026 Trout Stocking Schedule" datatable JSON, TWRA
- Publication date: 2026 schedule; retrieval 2026-09-25
- URL: https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json
- Fields per row: REGION, COUNTY, LOCATION, TYPE, STOCKING DAY, STOCKING WEEK, STOCKING MONTHS, SPECIES
- Check: full JSON downloaded (108,620 bytes); case-insensitive "douglas" count = **0**; "french broad" count = **0**; 616 rows; Sevier County rows are only "Gatlinburg Streams".
- Companion page text (https://www.tn.gov/twra/fishing/trout-information-stockings.html): "Reservoir Trout Stocking Information — TWRA stocks the following reservoirs with trout to provide year-round trout fishing opportunities." List: Dale Hollow, Parksville, Calderwood, Chilhowee, Fort Patrick Henry, South Holston, Tellico (Upper), Watauga. **Douglas not listed.**
- Type: agency stocking dataset (dated) + program list; Confidence: high
- Establishes: zero trout stocking of Douglas Reservoir in 2026 and no reservoir-trout program role.

### S3. TWRA — Weekly Fishing Report page (2026 cycle) with Douglas segment
- Title/author/org: "TWRA Fishing Reports" (weekly report + embedded Tennessee WildCast video feature), TWRA
- Publication date: current 2026 weekly cycle (report imagery/dates on page: 07/01/26, 06/12/26, 02/19/26, 12/19/25); retrieval 2026-09-25
- URL: https://www.tn.gov/twra/fishing/weekly-fishing-report.html
- Quote (verbatim, WildCast feature "Hidden Gems of Jefferson County: Douglas & Cherokee Unleashed"): "fishery improvements on Douglas Lake, the Bill Dance Signature Lakes initiative... From 100-fish days on Douglas to crappie booms, walleye runs, and new access projects..."
- Warmwater evidence: agency-published 2026 feature describing Douglas strictly as a bass/crappie/walleye destination; its trout content on the same page covers only the agency's tailwater trout surveys (separate waters, see French Broad log S5).
- Type: agency report (dated); Confidence: medium-high
- Establishes: current agency portrayal of the lake as a warmwater fishery; not a species census.

### S4. Citizen-science occurrence checks (leads only)
- iNaturalist API (retrieved 2026-09-25), Salmonidae (taxon 47520), lake bbox 35.75-36.10N / -83.62..-83.20W: 17 records, all attributed to Cosby / GSMNP / Pigeon Forge / West Prong Little Pigeon mountain tributaries (e.g., obs 384942134 2026-07-22 Salvelinus fontinalis; obs 364882028 2026-04-29 Oncorhynchus mykiss) — i.e., upstream stocked trout tributaries, none on Douglas Lake proper.
- GBIF occurrence API (retrieved 2026-09-25), Salmonidae (taxon 8615), same bbox: count 5 (2026, 2025, 2024, 2019, 1993) — same tributary attribution (no lake records; the 1993 record is from "reservoirs of the Cumberland plateau", i.e., misattributed/other waters).
- Type: occurrence aggregators; Confidence: n/a — single/uncontextualized catches are leads only; none contradict the warmwater verdict and none place trout in the lake.

## Mirror/retrieval attempts that failed (documented)
- tva.com "Douglas" lake/dam pages: HTTP 403 (Akamai) with browser headers, 404 variants; sitemap.xml 403; web.archive.org availability API: zero snapshots for both candidate TVA URLs. No TVA page text retrievable 2026-09-25.
- DuckDuckGo html/lite: bot challenge; Bing: site: filter ignored. WebSearch intermittently rate-limited (429).
- Tennessee Trout Management Plan 2017-2027 (https://www.tn.gov/content/dam/tn/twra/documents/fishing/Tennessee-Trout-Management-Plan-2017-2027.pdf, retrieved 2026-09-25): "Douglas" mentions = 0 — the statewide trout plan does not manage any Douglas fishery. Consistent absence evidence.

## Searches run (distinct, Douglas Lake)
1. WebSearch: TWRA Douglas Reservoir Tennessee fishing bass crappie walleye sauger (partially rate-limited)
2. WebSearch: Douglas Lake Bill Dance Signature Lake designation Tennessee bass crappie (rate-limited; program mentioned on TWRA page instead)
3. DuckDuckGo lite: TVA Douglas Reservoir site:tva.com (bot-challenged)
4. Bing: TVA "Douglas Reservoir" fishing species site:tva.com (off-target)
5. iNaturalist API bbox query (Salmonidae + Micropterus dolomieu)
6. GBIF API bbox query (Salmonidae)
7. Source-internal searches: 2026 stocking JSON grep; trout-info reservoir list extraction; weekly-report page Douglas/WildCast scan; Trout Mgmt Plan PDF grep; storymap grep ("douglas" = 0)

## Findings vs. chase list
- TWRA reservoir page (bass/crappie/walleye/sauger): confirmed via committed 2026-09-22 capture + live 2026-09-25 re-verification (byte-identical).
- 1-2 dated sources: S2 (2026 stocking schedule dataset; zero Douglas rows) and S3 (2026 TWRA weekly report/WildCast cycle); plus absence evidence in the 2017-2027 Trout Management Plan.
- Zero trout: confirmed three ways — 2026 dataset (0 rows), reservoir trout stocking list (not listed), reservoir page body (0 trout content), plus Trout Mgmt Plan (0 mentions).

## Recommendation
**warmwater confirmed** — keep `warmwater-focus`. The managing agency (TWRA) describes Douglas as a largemouth/crappie/bluegill/catfish lake with sauger/walleye/white bass runs, stocks zero trout (2026 dataset and program lists), and never mentions the lake in its trout management plan. No evidence of any trout fishery was found; citizen-science trout records in the bounding box all trace to upstream mountain tributaries.
