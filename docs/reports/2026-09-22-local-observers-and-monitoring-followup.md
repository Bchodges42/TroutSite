# Local observers and overlooked monitoring — follow-up audit

September 22, 2026. Research only; no implementation or outreach. Extends [unconventional source discovery](2026-09-22-unconventional-source-discovery.md). Findings are saved incrementally. Sources are evaluated for specific claims, dates, locations and independence, not accepted wholesale because of their owner or domain.

## Checkpoint 1: an overlooked source now yields actual 2025 data

### ORNL / DOE: East Tennessee Technology Park BMAP FY2025

Retrieved the full **27-page report ORNL/SPR-2025/4073**, dated September 2025, from [DOE OSTI](https://www.osti.gov/biblio/3002233), [PDF](https://www.osti.gov/servlets/purl/3002233), [DOI](https://doi.org/10.2172/3002233). Python requests to OSTI reset connections, but normal curl with certificate validation successfully downloaded the public PDF. Text extraction plus rendered-page inspection verified Tables 5 and 6. This upgrades ORNL from a data-holder lead to an acquired primary study.

**Table 6, printed p.15 / PDF p.23:** April 2025 fish-community data for Mitchell Branch sites MIK 0.4 and 0.7 and reference sites Mill Branch MBK 1.6, Ish Creek ISK 1.0, and Scarboro Creek SCK 2.2. Includes named species, density in individuals/m² and biomass in g/m². Reported species richness is respectively **8, 7, 7, 8, 5**. Examples include stonerollers, shiners, dace, creek chub, sunfish, sculpin, darters and spotted bass. No trout row appears in this table. That is a survey result, not proof trout never occur.

**Table 5, printed p.13 / PDF p.21:** Mitchell Branch measurements at four sites on April 4 and August 4, 2025. August water temperatures are **21.8, 23.1, 23.6 and 21.9°C**, and dissolved oxygen **7.3, 6.6, 6.5 and 8.0 mg/L**, for MIK 0.4, 0.7, 0.8 and 1.4. These are spot measurements, not summer maxima or a continuous thermal record. The table also contains discharge, canopy and other measurements with explicit missing-data notes.

**Useful extra evidence:** Section 3.2.1 interprets Mitchell Branch as a stressed small-stream community; the program separates impacted and reference streams. Table 7 reports pond catch per minute with electrofishing effort (180 minutes in March 2025), and explains remediation, piscicide treatment, restocking and fish removals. Do not confuse that deliberately managed pond with a natural stream assemblage. The report also includes fish-tissue monitoring: useful dated species/location evidence, but targeted contaminant sampling is not a complete fish census.

**Acceptance:** strong for the stated survey sites/dates and measured variables; limited geographic relevance. Do not extrapolate an Oak Ridge stream result across Tennessee or treat monitored property as publicly fishable. Station geometry, survey methods and access remain separate checks. FY2024, CY2024 and FY2025 are different reports, not interchangeable versions.

## Checkpoint 1: local firsthand sources and their limits

### David Knapp: guide reports and The Trout Zone personal blog

[July 19, 2021 guide report](https://troutzoneanglers.com/2021/07/19/excellent-summer-fishing-continues-report-for-july-19-2021/) is by David and contains firsthand recent-trip descriptions: Caney Fork rainbows/browns, Clinch catches and smallmouth fishing. It explicitly says Caney Fork summer performance differed from the preceding three years, and discusses moving to higher Smokies elevations because of warmer water. These are attributed angler observations and interpretations, not measured temperature or survival studies. Exact catch dates and reaches are not supplied for every claim.

[The Trout Zone](https://www.thetroutzone.com/) is David Knapp's personal journal, linked from his guide site's links page. At retrieval it contains posts through September 11, 2026. His July 30, 2026 “Benefits of Friends” describes a firsthand Cumberland Plateau smallmouth trip but **does not name the stream**. It therefore cannot support a particular mapped reach. His own text identifies Trout Zone Anglers as his guide service: these two domains are one observer/source family. A 2026 blog update does not refresh a 2021 report.

**Acceptance:** useful attributed observations when a specific water and observation period are stated; good leads for seasonal changes, tributary movement and places needing measurements. Anonymous waters stay unmapped. Catch success, fish size and an angler's warm-water warning must not silently become measured density, wild origin or year-round survival.

### Taylor Joyce: personal East Tennessee creek journal

[Creek archive](https://taylorjoyceflyfishing.com/category/creeks/) retrieved with original dated entries, photographs and first-person accounts:

- [Stoney Creek, March 14, 2015](https://taylorjoyceflyfishing.com/2015/03/14/stoney-creek-elizabethton-tn/): identifies Elizabethton/Watauga context and describes summer fishing and fish moving into the tributary. Summer year/dates are not explicit; winter fly suggestions are advice, not documented winter catches.
- [Hampton Creek Cove, February 4, 2015](https://taylorjoyceflyfishing.com/2015/02/04/hampton-creek-cove-state-natural-area-tennessee/): firsthand brook-trout narrative with images and a distinction involving the artificial barrier. Publication date is not necessarily trip date; image URLs include 2014 directories, which likewise are not verified capture timestamps.
- [Rocky Fork Creek, January 20, 2015](https://taylorjoyceflyfishing.com/2015/01/20/rocky-fork-creek/): distinguishes roadside fishing from upstream water and makes stocked/wild/native claims. Fish appearance and author confidence alone cannot establish stocking origin or genetics. Useful historical leads for reach differences, subject to official survey/management corroboration.

**Acceptance:** historical firsthand narrative, not current classification. Old parking, fence-crossing and access directions are not adopted as legal/current access guidance. Named creeks need county/basin confirmation because names repeat. The archive itself supports familiarity with these waters at the time; current residence was not established.

## Checkpoint 2: a national temperature archive, narrowed to usable Tennessee coverage

Retrieved the [USGS 2024 data release](https://www.usgs.gov/data/compilation-multi-agency-water-temperature-observations-us-streams-1894-2022), [DOI 10.5066/P9EMWZ35](https://doi.org/10.5066/P9EMWZ35), its full `site_metadata.csv` and 224 MB `daily_stream_temperature.zip` from the [ScienceBase catalog](https://www.sciencebase.gov/catalog/item/5f60d95e82ce3550e3c23133). The decompressed daily CSV is about 2.44 GB and contains **27,026,752 national rows**. The release combines NWIS, Water Quality Portal, EcoSHEDS and NorWeST observations through **2022**; it aggregates continuous and discrete measurements to site-days and performs quality checks. Its authors expressly warn that quality issues may remain. This is an historical observation index, not a live thermal service, and recompiled NWIS/WQP rows do not constitute an independent second witness.

I reproduced a Tennessee-specific screen by reading the site's coordinates from the metadata, testing them against Tennessee (`GEOID=47`) in the [Census 2024 1:500,000 state boundary file](https://www2.census.gov/geo/tiger/GENZ2024/shp/cb_2024_us_state_500k.zip), then streaming the entire temperature ZIP and matching site IDs. This is a state-boundary screen, **not a stream/reach match**; simplified borders and station geolocation can affect edge cases. Counts from the acquired files:

| Quantity | Count | Interpretation |
| --- | ---: | --- |
| Tennessee-point metadata rows / unique IDs | 9,203 / 9,173 | Mostly water-quality sampling points, not 9,173 usable streams. |
| Unique IDs with at least one daily record | 8,910 | Even one isolated measurement qualifies. |
| Tennessee-point daily records | 213,467 | 99,353 discrete WQP rows; 114,114 continuous-source rows. |
| IDs with any record in 2018 or later | 2,695 | Recency alone says nothing about seasonal completeness. |
| IDs with continuous-source records in 2018 or later | **20** | An upper-screen for recent logged coverage in this archive, not 20 verified trout reaches. |
| IDs with at least 60 / 90 distinct continuous-source days in June–August 2021 | **14 / 12** | Candidate summer records to inspect individually; June–August has 92 days. |

**Acceptance:** potentially strong for measured temperature at an identified station and period after inspecting flags, sampling frequency, sensor location and reach geometry. It cannot alone classify year-round trout survival, stocking practice, angling access or conditions in 2026. Daily minima/maxima reflect observations on that day; a discrete spot sample is not a true continuous daily extreme. The narrow 20/14/12 counts make a statewide sensor-first classification implausible; the archive is much more useful for targeted checks and explicit coverage gaps.

## Checkpoint 2: conservation groups preserve management history, sometimes primary observations

### Trout Unlimited / TWRA: Trail Fork restoration and monitoring plans

The original [November 16, 2021 Trout Unlimited account](https://www.tu.org/magazine/conservation/from-the-field/brookies-in-tennessee-get-a-new-improved-home/) names **Trail Fork of Big Creek** in Cherokee National Forest. It reports that TWRA, the Forest Service and University of Tennessee students electrofished rainbow trout out of the stretch **above a natural waterfall** over several years, then moved about two dozen brook trout from a nearby creek into it in fall 2021. Rainbows remained below the falls; a culvert was replaced with a bridge to reconnect about a mile of habitat. Local TU volunteers monitored temperature, but the article publishes no readings or time series. The projected robust brook trout fishery was a forecast, not a documented follow-up survey. This is useful evidence for a dated **management intervention and reach boundary**; current self-sustaining status remains unresolved.

Acquired the full [21-slide 2025 Tennessee Coldwater Summit presentation](https://www.tctu.org/uploads/1/1/4/8/114851951/twra_-_2025_coldwater_summit_jwh2.pdf), by **Jim Habera, TWRA Region 4 Fisheries Program Manager**, hosted by Tennessee Council of TU. Text extraction and rendered-slide inspection confirm:

- Slides **3–4** display TWRA historical brook/rainbow trout biomass at *upper Rocky Fork near Ft. Davie Creek* (1991–2016) and *Left Prong Hampton Creek below the barrier* (1994–2016), with flood events annotated. These are original management-chart evidence for those reaches and periods, but the deck does not supply the raw survey table or post-2016 status.
- Slides **9–12** show the Left Prong Hampton Creek fish barrier after Helene, including a January 29, 2025 image and a repair-plan note. Barrier condition can change what fish move between reaches; this is not a current 2026 barrier inspection.
- Slide **17** lists **planned**, not completed, 2025 brook-trout monitoring for Left Prong Hampton, Shell Creek, Right Prong Middle Branch, Briar Creek, Right Prong Rock Creek, Phillips Hollow, Trail Fork Big Creek and Little Paint Creek; other large streams were also planned. Slide **19** mentions temperature-logger volunteer opportunities. The deck supplies no results of those planned 2025 surveys or logger data.

This closes an evidentiary trap: a web-search AI summary described Trail Fork monitoring “during summer 2025” as if completed, but the retrieved TWRA slide says **conduct** monitoring during summer 2025, future tense. The old 2021 TU project story plus the 2025 *plan* do not demonstrate persistence or abundance in 2025/2026. A Tennessee American Fisheries Society search hit similarly appeared under a **2026 upload path**, but its PDF filename was **`TNAFS-Winter-2021-Newsletter.pdf`**; the host returned HTTP 403 to direct retrieval. Treat its indexed stocking snippet as a historical lead, not a verified 2026 report or an acquired primary document.

**Acceptance:** use original restoration descriptions for intervention timing, barriers and named reaches; use the TWRA charts only for their displayed years and the survey list as a route to ask the owner whether later results exist. Conservation-group hosting does not make planned work an observation, and source independence follows the underlying TWRA/TU project, not domain count.

### Another dated personal account: Mark Trew on the Caney Fork

[“Cicada Summer on the Caney Fork”](https://www.localwaters.us/cicada-summer-on-the-caney-fork/) preserves a named first-person June **2011** canoe trip by Mark Frank Trew, from Center Hill Dam toward the Cumberland River, plus the host's photos and later memorial notes. It describes rainbow and brown trout observed/caught on a hot-weather tailwater trip. The author's “near 90 degrees” is **air temperature**; “ice cold” water is a hand-feel description, not a thermometer reading. The long route lacks a dated catch coordinate for each fish. This is credible as attributed historical angler narrative and a useful counterexample to inferring stream temperature from hot summer air, but it cannot settle today's thermal condition, wild origin, continuous trout occupancy or the whole 27-mile reach. Product-store hosting neither invalidates the account nor upgrades it to a scientific survey.

## Synthesis at this stopping point

The newly acquired sources form three distinct evidence classes: **instrumented historical temperatures** (USGS), **dated fish-community and water measurements** (ORNL), and **reach-specific management history** (TWRA/TU). Local journals add dated encounter leads and seasonal context. The missing piece is still often a current reach-matched outcome: e.g., the 2021 Trail Fork reintroduction has no acquired follow-up population estimate, and the 2025 TWRA presentation offers plans rather than completed results. On these facts, a site should retain an explicit “unverified/current status unknown” state rather than turn an old stocking story, isolated catch or sensor value into “year-round trout.”

All acquired source copies and the reproducible USGS stream-count script are in the external audit archive, separate from the website repository. This report is the only repository change; no website implementation or outreach occurred.
