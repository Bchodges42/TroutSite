# Trout data integrity and source verification — October 14, 2026

**Result:** the Paint Creek and Big Soddy regulation gaps are repaired and pushed.
The prior ten audit commits, including Fort Patrick Henry correction `8fb7674`, are
preserved on `codex/data-sources-regulations-20261014`. Better sources were found and
tested. Editorial flows, hatch timing and the insect key remain unresolved; this work
does not turn them into verified biological or fishing guidance. Changes reach users
after the owner merges the branch.

## What is verified, and how

The [earlier live-feed audit](2026-10-14-data-integrity-audit.md) documents the original
USGS/TVA/TWRA comparisons, parser fixes and operational guardrails. The owner's handoff
reports all 50 catalog USGS stations verified against their watersheds and all 18
existing water-specific regulation items checked against TWRA, apart from Piney's
conflicting official pages. This continuation preserves those findings and distinguishes
them from fresh checks below; it did not repeat every live publication comparison.

Fresh checks included the current TWRA trout page, the regulations changes page,
raw catalog counts, the identification schemas/scorer, and 29 targeted source API
requests. The [evidence directory](../research/2026-10-14-source-audit/README.md) contains
request timestamps, hashes, 25 compact response captures, and a machine-readable catalog
inventory. UTC timestamps dated October 15 correspond to October 14 in Chicago.

| Area | Finding and remaining limitation |
|---|---|
| Live USGS, TVA and TWRA stocking feeds | Earlier audit verified agreement after fixes. The daily truth check is wired into `refresh-data.sh` after a verified refresh and compares published snapshots with upstream values. It depends on the merged code and working production schedule; it does not verify editorial claims or regulations. |
| USGS station identities | 50 distinct numeric IDs in this checkout, matching the handoff. Correct watershed is necessary but does not establish that a gauge measures the fished reach. |
| Water-specific rules | 18 existing entries become **21** with two Paint Creek entries and one Big Soddy entry. The earlier Fort Patrick Henry association correction is preserved and tested. |
| Ideal flows | **94** waters have a nonempty range; all 94 are marked `idealFlowSource: editorial`. No measured optimum has been established. |
| Hatch charts | **12** regional charts, each covering 12 months; no chart-level source fields or citations. Finding relevant literature does not validate the existing month/abundance values. |
| Identification | Both taxon and observation schemas permit only 2 or 3 tails. **63 taxa outside mayflies/stoneflies** carry 2, including ants, caddis, midges and sculpin. `matchHatch` awards an attribute-match point for this value. |
| Fishery evidence | **156/190** waters have `opportunity.sources`; **34** have none. All 34 already have an unresolved trout opportunity. All 190 have general `officialSources`, which can be generic hydrography or agency links rather than fishery evidence. A source's presence does not establish that its claim is supported. |

## Regulation repairs

All three new summaries link to [TWRA's current trout regulations](https://www.tn.gov/twra/fishing-regs/trout-regulations.html)
and carry exact catalog associations. The text differentiates the reaches rather than
applying one rule to an entire creek.

| Water and reach | Rule encoded |
|---|---|
| Paint Creek, Greene County: USFS campground upstream to the USFS boundary south of Highway 70 near Munday Gap, including tributaries | Five trout daily, no minimum length, single-hook artificial lures; no bait or multiple-hook lures in use or possession, with one separated single-hook dropper lure permitted. |
| Paint Creek: campground downstream to the French Broad River mouth | Catch-and-release October 1–February 28; no trout harvest or possession, artificial lures only, no bait in use or possession during that season. |
| Big Soddy Creek: upstream of Back Valley Road | Catch-and-release November 1–February 28 with the same seasonal no-harvest/no-possession/artificial-lure/no-bait restrictions. TWRA's detailed page and [2026–27 changes page](https://www.tn.gov/twra/fishing-regs.html) agree on November 1. |

Paint Creek's catalog caveat had incorrectly directed upstream anglers to statewide
rules; it now states the wild-trout restrictions. Big Soddy's obsolete October-versus-
November uncertainty is removed. Regulation commit: **`aa0a8a7`**.

The Fort Patrick Henry Reservoir rule governs the reach below **Boone Dam** to Louis
Milhorn Bridge, so its association remains `boone-tailwater`, not the water below Fort
Patrick Henry Dam. New tests preserve this correction from `8fb7674`.

Piney River remains inconsistent: TWRA's changes page says delayed harvest was removed,
while its detailed trout page still lists it. The existing warning remains. Slickrock
Creek, Acorn Lake, Dillards Ponds and several named wild-trout streams remain outside
the catalog. The whole fishing-information document's `verifiedAt` was not advanced:
this targeted pass did not recheck all license prices and other sections.

## Gauges: identity versus usefulness

The handoff identified four downstream stations in neighboring counties:

| Catalog water | Station | Practical limitation |
|---|---|---|
| Caney Fork tailwater | [03424860, Stonewall](https://waterdata.usgs.gov/monitoring-location/USGS-03424860/) | Downstream flow includes water entering below the principal fishing reach. |
| Harpeth, Williamson reaches | [03433500, Bellevue](https://waterdata.usgs.gov/monitoring-location/USGS-03433500/) | Downstream of the catalog's Williamson County focus; should not silently replace Franklin's reading. |
| Hiwassee, Reliance/Appalachia reach | [03566000, Charleston](https://waterdata.usgs.gov/monitoring-location/USGS-03566000/) | Downstream; the handoff found discharge last reported in 2018. A station's existence does not make its flow current. |
| Wolf River, Fentress headwaters | [03416000, Byrdstown](https://waterdata.usgs.gov/monitoring-location/USGS-03416000/) | Measures the downstream river rather than the headwater reach. |

The earlier audit also flags reach limitations at Little River, Ocoee and Pigeon.
These require a primary/reference-gauge policy, reach labeling, and per-metric freshness.
No station IDs or gauge preference logic were changed in this continuation.

## Better sources found and tested

### 1. Corps of Engineers: documented CWMS Data API

The [USACE discovery guide](https://github.com/USACE/cwms-data-api/wiki/Finding-Data)
and [live OpenAPI specification](https://cwms-data.usace.army.mil/cwms-data/swagger-docs)
provide a documented alternative to the app's A2W reporting endpoint. Catalog discovery
for `office=LRN`, `like=CETT1*` returned 21 series. Direct series requests over
October 12 00:00 UTC–October 15 00:00 UTC returned:

| Station / catalog association | Flow values, cfs | Tailwater temperature values, °C |
|---|---:|---:|
| CETT1, Center Hill / Caney Fork | 73 | 145 |
| DHTT1, Dale Hollow / Obey | 73 | 145 |
| JPPT1, J. Percy Priest / Stones | 72 | 145 |
| CORT1, Cordell Hull / Cumberland | 73 | 145 |

Example: [Center Hill outflow query](https://cwms-data.usace.army.mil/cwms-data/timeseries?office=LRN&name=CETT1-CENTER_HILL.Flow.Ave.1Hour.1Hour.man-rev&begin=2026-10-12T00%3A00%3A00Z&end=2026-10-15T00%3A00%3A00Z&unit=cfs).
The catalog's reported extents ended around September 14 even though the value endpoint
returned October observations. Catalog freshness is therefore not a reliable substitute
for checking observation times.

**Recommendation:** build a separate CWMS adapter with explicit units, pagination,
quality codes, freshness gates and audited station/reach mappings. It is not a URL-only
replacement: CWMS uses `units` and timestamp/value/quality tuples, while the existing
parser expects A2W's `unit` and ISO-time/value pairs. Request Celsius explicitly; do not
reuse the A2W Fahrenheit assumption. Preserve the source series and observation times.
No provider replacement or automatic fuzzy series selection was implemented here.

### 2. USGS: seasonal historical flow percentiles

The modern [USGS Statistics API](https://api.waterdata.usgs.gov/statistics/v0/docs)
returned approved day-of-year discharge percentiles for actual catalog stations.
The [USGS methodology](https://waterdata.usgs.gov/statistics-documentation/) describes
the use of approved daily values; these describe historical hydrology, not fishing safety.

| Gauge, October 14 | P25 | P50 | P75 | Approved samples for that day |
|---|---:|---:|---:|---:|
| 03538830, Obed near Crossville | 4.73 cfs | 22.5 cfs | 52.8 cfs | 15 |
| 03532000, Powell | 117.5 cfs | 161 cfs | 269.5 cfs | 93 |

For example, the [Obed query](https://api.waterdata.usgs.gov/statistics/v0/observationNormals?monitoring_location_id=USGS-03538830&parameter_code=00060&computation_type=percentile&normal_type=DOY&start_date=10-14&end_date=10-14)
shows why the catalog's year-round 100–800 cfs band needs investigation. Its P5 and P95
values were the string `nan`; a parser must treat those as unavailable. An additional
Obed/Lancing station was tested for comparison and is explicitly distinct from the
catalog's Crossville station in the captured request IDs.

**Recommendation:** add labeled seasonal historical context, keeping parameter, daily
statistic, gauge, sample count, retrieval time and calculation IDs. Monthly normals
(`MOY`) are another documented option. Do not rename P25–P75 an ideal fishing or wading
range. Generation pulses, tributary inputs and channel geometry need separate treatment.
No ideal-flow values were overwritten.

### 3. TWRA GIS: useful geometry, incomplete regulation coverage

The [TWRA GIS portal](https://www.tn.gov/twra/gis-maps.html) leads to the public ArcGIS
organization already used by this repository. Its
[Tailwater_Trout layer](https://services3.arcgis.com/PWXNAH2YKmZY7lBq/ArcGIS/rest/services/Tailwater_Trout/FeatureServer/0)
contains **13** polyline features with name, species, season and dam fields. Its last
data-edit timestamp is March 28, 2017. The separate
[TNMap TWRA service](https://tnmap.tn.gov/arcgis/rest/services/ENVIRONMENTAL/TWRA/MapServer)
contains hatcheries, access sites, lakes and lands, not a current regulated-trout-reach
layer.

**Recommendation:** use these as candidate geometry/reference leads, with current
agency text controlling rules. This search did not establish a current, comprehensive,
public TWRA wild-trout or regulated-reach API. That is a search limit, not proof that no
such dataset exists. Do not import an old stocked-tailwater layer as legal boundaries.

### 4. Temperature: real historical data, limited live coverage

The [Water Quality Portal API](https://www.waterqualitydata.us/webservices_documentation/)
returned **3,985** TDEC temperature records at **1,129** distinct monitoring IDs for
calendar 2024. Actual sample dates span January 2–December 26, and units are `deg C`.
The [exact filtered request](https://www.waterqualitydata.us/data/Result/search?organization=TDECWR_WQX&statecode=US%3A47&characteristicName=Temperature%2C%20water&startDateLo=01-01-2024&startDateHi=12-31-2024&mimeType=csv&zip=no)
is reproducible. A first trial at a single Clinch site returned only a CSV header;
site existence alone did not establish temperature coverage.

TWRA also publishes [Brook Trout Temperature Data](https://services3.arcgis.com/PWXNAH2YKmZY7lBq/ArcGIS/rest/services/Brook_Trout_Temperature_Data/FeatureServer/0):
**2,284** records with stream/date/average/maximum fields. Sampled rows refer to June–July
2022; the layer was last edited March 31, 2025. Its item has no description/license
statement, and the field metadata does not specify temperature units or averaging
methods. Those details must be confirmed before interpreting or republishing its numbers.

[TVA describes rotational water-quality monitoring](https://www.tva.com/environment/environmental-stewardship/water-quality),
which establishes a monitoring program but not an accessible current per-water
temperature feed. The Corps temperature series above are the strongest newly tested
continuous source for the four Corps tailwaters. Existing fresh USGS temperature sensors
remain appropriate where available.

**Recommendation:** use WQP and validated logger data for historical thermal evidence,
with site/reach/date/depth/method qualifiers. Do not carry historical sample temperatures
into the current conditions score. No new general TVA temperature API was verified.

### 5. Entomology: primary studies for a narrower, cited chart

Primary research located:

- [DeWalt & Heinold (2005), Abrams Creek adult emergence survey](https://experts.illinois.edu/en/publications/summer-emerging-ephemeroptera-plecoptera-and-trichoptera-of-abram/):
  sampled nine reaches during summer 2001. [BioStor lists the scanned article](https://biostor.org/reference/55351).
- [DeWalt, Jacobus & McCafferty (2007), southwestern Smokies EPT inventory](https://experts.illinois.edu/en/publications/summer-ephemeroptera-plecoptera-and-trichoptera-from-southwestern/):
  sampled May/June 2003 and early July 2004 across fifteen reaches.
- [Parker et al., Smokies EPT/Megaloptera synthesis](https://www.eaglehill.us/SENAonline/articles/SENA-sp-1/20-Parker.shtml):
  a regional taxonomic baseline, rather than a ready-made twelve-month fishing calendar.

The accessible institutional abstracts and publication records establish study scope;
the full collection tables were not verified in this continuation. Attempts to fetch
some scans were blocked or timed out. These sources support a further Smokies review;
they do not establish Middle/West Tennessee timing, tailwater emergence, abundance
ratings, or all-year activity. No citations were attached to existing chart values
merely because the papers were topically relevant.

**Recommendation:** review collection tables taxon by taxon, recording locality,
elevation, dates, life stage and sampling effort. Distinguish observed emergence from
nymph availability and angling inference. Store citations and uncertainty per chart
entry. Keep the other regions editorial until equivalent evidence exists.

## Work remaining, in practical order

1. Merge the reviewed feed and regulation fixes, with the prior report's operational
   prerequisites addressed. The continuation branch includes the earlier work; avoid
   applying duplicate copies of those commits. Main remains owner-controlled.
2. Repair the identification contract and observation/UI flow. Distinguish zero tails,
   unknown and not applicable, review life-stage anatomy, and test ranking with caddis,
   midges, terrestrials and fish. This needs a compatible schema migration, not just YAML edits.
3. Establish primary/reference gauge semantics and honestly label editorial flow bands.
   Add USGS historical context separately; validate fishing thresholds against reach evidence.
4. Introduce the documented CWMS adapter with capture-based parity and stale/partial-data tests.
5. Build cited hatch entries and fill catalog/regulation coverage gaps. Continue fishery
   research on the 34 unresolved waters rather than changing their classifications from
   generic agency links, coordinates, or temperature suitability alone.

The 34 fishery gaps are fully listed in `catalog-inventory.json`: 31 have unresolved
evidence state, two conflicting (Shoal Creek and South Fork Cumberland), and one limited
(Paris City Park Lake). This is an evidence backlog, not a finding that all 34 currently
assert a verified trout fishery.

## Validation

- Contracts build passed; content build passed and emitted the fishing-information pack
  plus all 144 region/month hatch files.
- Content validation, capture/ledger verification and water-identity audit passed;
  existing ungauged-water warnings remain expected.
- Content tests: **23 passed**, including four new regulation-association/reach/date tests.
- The new test file passes targeted ESLint. Package-wide content lint still reports
  seven pre-existing unused-variable errors and one warning in untouched scripts.
- Contracts: **198 passed**; API: **281 passed**; web: **381 passed, 1 skipped**;
  infrastructure: **13 passed**. Along with content, **896 tests passed**. The first
  broad run selected Windows' WSL `bash.exe`, which has no installed distribution;
  rerunning shell-dependent tests with Git Bash on PATH passed without code changes.

The live application was not deployed by this work. The new source APIs were researched
and sampled, not integrated into production. Earlier live-feed comparisons are documented
as earlier evidence, not represented as a new comprehensive live run.
