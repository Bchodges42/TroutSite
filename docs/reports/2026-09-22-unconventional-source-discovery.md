# Unconventional source discovery — Tennessee trout and warmwater fisheries

Started September 22, 2026. Research only. Extends [source acceptance](2026-09-22-source-acceptance-and-coverage-audit.md) and [evidence methods](2026-09-21-evidence-methods-audit.md). No implementation or outreach.

## Search objective

Find evidence outside the fishing-page/shop/community sources already audited. Prioritize direct observations, reach definitions, seasonal survival, habitat constraints, and data with usable dates and provenance. Search targets include dam operating/monitoring records, environmental permitting surveys, biological monitoring repositories, university theses, conservation completion reports, and structured national sampling programs.

This is an incremental log. A discovered title or search snippet is a lead, not a verified source. Record whether the underlying document/data was actually retrieved, what it contains, and what it cannot establish. Old but detailed evidence may explain a fishery; it does not establish present conditions without corroboration.

## Capture method

Public-source responses are archived outside the product repository, alongside previous audit captures, with URL, timestamp, status and SHA-256 metadata. Browser-only checks are identified explicitly. This report will be pushed to the audit branch for phone access at checkpoints.

## Checkpoint 1 — national field surveys and dam operations

### EPA National Rivers and Streams Assessment: actual fish-count files retrieved

[Owner data catalog](https://www.epa.gov/national-aquatic-resource-surveys/data-national-aquatic-resource-surveys) exposes multiple survey cycles, including **2023–24** files published in June 2026. Retrieved the [fish count CSV](https://www.epa.gov/system/files/other-files/2026-06/nrsa2324_fishcount.csv), [site-information CSV](https://www.epa.gov/system/files/other-files/2026-06/nrsa2324_siteinfo.csv), and [fish-count metadata](https://www.epa.gov/system/files/other-files/2026-06/nrsa2324_fishcount_metadata.csv).

Reproduction: filter fish records to PSTL_CODE = TN; count distinct UID and SITE_ID; join site information on UID. Result: **463 rows, 34 visit/sample UIDs, 29 site IDs**. Rows are taxon/sample records, not 463 fish or waters. There are 432 rows marked YES-SUFFICIENT, 29 marked YES->20 CW SAMPLED,<500 INDIV, and 2 NO-SITE CONDITIONS rows. Failed sampling is explicitly represented and must not become fish absence.

The joined data identifies **Paint Creek, Greene County, June 12, 2024**, sample UID 2023288 / site NRS23_TN_10006, with **2 brook trout and 1 rainbow trout**. These are sampled fish, not an estimate of the stream's entire population. Counts are split into length classes. Site information includes county, water name, HUC, COMID, coordinates and collection date. Some long hydrography identifiers are already rendered in scientific notation in the source CSV; retain raw text and validate identifiers before joining to map geometry.

**Why useful:** positive species assemblages for both trout and warmwater fisheries, with field dates and sampling-status context. Much stronger than inferring warmwater status from missing trout web pages. **Limits:** sparse selected sites, seasonal survey visits, historical to 2023–24, not a statewide inventory and not proof of year-round persistence. A failure to capture trout in one sample is not proof of permanent absence. Mapping and sampling protocol review still required before assigning findings to an app reach.

### NEON: repeated fish sampling plus water quality at two Tennessee streams

The [public NEON site inventory API](https://data.neonscience.org/api/v0/sites) returned structured metadata. Tennessee aquatic sites **LECO (LeConte Creek)** and **WALK (Walker Branch)** advertise product DP1.20107.001, “Fish electrofishing, gill netting, and fyke netting counts,” with available months from October 2016 / March 2016 respectively through April 2026. Both advertise water-quality product DP1.20288.001 through August 2026, and fish DNA-barcode products through 2025. These endpoints indicate available months, not uninterrupted sampling.

**Potential:** a paired biological/physical time series, including a scientifically monitored comparison stream as well as a park stream. No thermal or fishery classification is assigned to WALK here. **Access caveat:** following the inventory's April 2026 data URLs for both sites returned HTTP 403. No fish-count records retrieved yet; actual species/measurements and data quality remain unverified. Do not confuse successful metadata access with successful data access. The [owner's methods page](https://www.neonscience.org/data-collection/fish) describes repeated spring/fall sampling at most wadeable sites, fish identification, measurements, photographs and selected tissue samples; advertised availability still needs a successful file download.

### USACE Nashville District: reservoir profiles and inflow/tailwater measurements

[Corps program description, May 5, 2021](https://www.lrd.usace.army.mil/Media/News/Article/3729411/water-management-assesses-water-quality-in-cumberland-river-basin/) verified in the browser (direct HTTP fetch returned 403). It states at least three full sampling trips across ten Cumberland-basin projects to capture spring, summer and fall; profiles include temperature, dissolved oxygen, conductivity and pH, plus sampling at tailwaters, reservoirs, and major tributaries/inflows. It explicitly describes operational responses to low oxygen and names Center Hill, Dale Hollow and Wolf Creek trout tailwaters.

**Why useful:** lake-depth oxygen/temperature overlap and release quality, which a surface gauge or dam-intake description misses. The source confirms an identifiable data holder and monitoring method. **Not yet obtained:** station-level profiles, recent coverage or a working download. The article's linked legacy lrn-wc.usace.army.mil site failed DNS resolution. Route a precise dataset request to the district water-quality team rather than treating the broken portal as no data.

## Checkpoint 2 — recovered after usage interruption; verified September 22

### NPS fisheries database: historical annual survey workbooks actually downloaded

[Official catalog](https://catalog.data.gov/dataset/great-smoky-mountains-national-park-fisheries-monitoring-database-552e7) links directly to an Access database and two spreadsheets held by NPS IRMA. Retrieved [Data_Summary.xlsx](https://irma.nps.gov/DataStore/DownloadFile/649560?Reference=2279844) and [DataSum2020.xlsx](https://irma.nps.gov/DataStore/DownloadFile/649561?Reference=2279844), both HTTP 200. The combined workbook contains annual sheets labeled 1983 through 2020 plus additional analytical sheets. This is actual accessible survey material, not just a publication abstract.

The catalog describes three-pass depletion electrofishing following the 1992 AFS Southern Division Trout Committee sampling guidelines. Spreadsheet columns include Stream, Species, Date, Site, Area, YOYpop, ADTpop, TOTpop, densities, mean weights and biomass. These are summary outputs; do not label population estimates as raw catch counts. Species-code definitions and units need the database/codebook, not guesses from familiar abbreviations.

**Reproduction and discrepancy:** read both workbooks with openpyxl, select DataSum20, retain rows whose Date cell is a date. Both contain the same **112 data rows, 26 distinct stream-name strings and 48 distinct (Stream, Site) pairs**, dated June 2–August 20, 2020. Extra formatted rows in the standalone workbook are not extra observations. The catalog instead says 49 sites in 25 streams. This may involve naming/grouping or a catalog/file mismatch; the cause is unknown. Ask the NPS dataset owner to reconcile it before publishing coverage totals. The park spans Tennessee and North Carolina: these are park-wide totals, not Tennessee counts.

**Why useful:** repeated site-level observations, historical assemblages, age-class structure and restoration context. These can support evidence of persistence and recruitment once code definitions, stocking/restoration history and reach locations are checked. **Freshness:** the catalog was checked September 10, 2026, but explicitly dates the dataset November 23, 2020. No 2026 fish status can be inferred. Request newer certified exports and station geometry from park fisheries staff; do not discard the time series simply because it is historical.

### Hydropower licensing and certification files: locate studies by legal obligation

[LIHI Smoky Mountain Project record](https://lowimpacthydro.org/lihi-certificate-18-smoky-mountain-project-north-carolina/) identifies Brookfield Smoky Mountain Hydropower LLC and **FERC P-2169**. Its compliance history states the Chilhowee tailwater fish monitoring was completed in **2024**, with agency/FERC approval documentation provided in **2025**. This is primary evidence of LIHI's certification finding; biological observations still require the underlying operator/consultant report. The visible files do **not** include that final 2024 report.

The record links the [license and water-quality certifications](https://lowimpacthydro.org/wp-content/uploads/2023/05/FERCLicense-and-WQCs-Tapoco.pdf), settlement agreement, application and reviews. These are document leads, not documents fully audited here. The page distinguishes dam bypass reaches from tailraces and reservoirs, and describes monitoring for migratory fish, not a trout-only survey. A whole-project species list must not be spread across every mapped reach.

**Why useful:** targeted searches by project number, license article, report title and reporting year can uncover contractually required surveys that never appear on fishing websites. **Next owner request:** final 2024 Chilhowee Tailwater Fish Monitoring Report, appendices with station locations/effort/species counts, and approval letter under P-2169. This is a specific recoverable record, not a generic request for all fishing data. Monitoring designed for migratory species may under-sample trout; check gear and objectives before using non-detections.

### ORNL environmental-compliance monitoring: fish assemblages in impacted AND reference streams

[ORNL BMAP program](https://www.ornl.gov/project/biological-monitoring-and-abatement-program) describes NPDES compliance monitoring, aquatic toxicity, contaminants in water/biota, and fish/invertebrate communities. The [2021 data-series description by the research organization](https://www.ornl.gov/publication/multidecadal-biological-monitoring-and-abatement-program-assessing-human-impacts) explicitly identifies **long-term seasonal fish-assemblage surveys in impacted and reference streams**, beginning in the mid-1980s. Both pages retrieved successfully. No raw fish export retrieved yet.

**Why useful:** warmwater and mixed assemblage evidence in small streams that fishing writers often ignore, paired with environmental measurements. Pollution monitoring can contain the species/location/date evidence we need even when trout fishing is not its purpose. Reference streams are especially valuable comparison candidates. **Limits:** localized reservation coverage, sampling design, historical versus current conditions, and separate questions of public access. A measured fish community does not grant permission to fish a site. Program lead identified on the owner page: Teresa Mathews; a request would specify station metadata, seasonal fish tables, methods and QA flags.

The [Walker Branch long-term dataset description](https://www.ornl.gov/publication/long-term-hydrological-biogeochemical-and-climatological-data-walker-branch-watershed) separately describes historical discharge/chemistry and spring-fed perennial headwaters. That description alone does not establish a trout fishery or summer thermal suitability.

### University projects: find the people measuring survival and movement

[Tennessee Tech's graduate-research page](https://www.tntech.edu/cas/biology/gradstudents.php), retrieved successfully, identifies **Dalton Bonds / advisor Mark Rogers** studying striped-bass seasonal movements and predation on stocked trout in the **lower Caney Fork**, using acoustic telemetry and gastric lavage. The page describes intended research, not completed results, and gives no result date.

**Why useful:** apparent trout disappearance can involve movement and predation as well as temperature. A targeted request for a completed thesis, study-reach map, sampling dates and approved summary may resolve a disputed reach better than accumulating more angler reports. Until results are obtained, do not assign a survival rate or classification from this project description.

## Checkpoint 3 — additional downloadable evidence and practical priorities

### USGS regional brook-trout abundance release: 1,205 Tennessee-labeled sample rows

[USGS release description](https://www.usgs.gov/data/brook-trout-abundance-streams-across-southern-appalachia-1958-2021) and [stable DOI / file catalog](https://doi.org/10.5066/P9DQID6G) provide **SE_BKT_SampleCounts.csv** and a detailed FGDC XML data dictionary. Both files downloaded successfully. The regional release describes 745 sites, 10 contributing institutions and observations spanning 1958–2021. USGS marks the release CC0; metadata lists no access/use constraints and asks users to read limitations.

**Actual reproduction:** the CSV contains 7,939 rows overall. Filtering State exactly equal to Tennessee gives **1,205 sample rows, 71 stream-name strings and 228 distinct coordinate pairs**, dated **December 18, 1979–August 18, 2020**. These are not 1,205 streams or necessarily 228 independently defined stations. Source values break down into 978 Great Smoky Mountain National Park, 225 Tennessee Wildlife Resources Agency and 2 Virginia Department of Wildlife Resources records. The latter two are High Trestle Branch at approximately 36.6104, -81.6509 and have missing COMID. They require state-boundary validation; a Tennessee text filter is not geographic verification. All Tennessee-labeled rows contain latitude values, but present does not mean verified accurate.

Fields include source, state, stream name, coordinates, COMID, sampling date, sampled length/width, number of passes, and **observed juvenile and adult brook-trout counts for each pass**. The XML explicitly defines YOY versus age 1+ adults. Missing pass values are NA, not zero fish. Some sample dimensions and hydrography IDs are missing. Preserve those distinctions.

**Why useful:** a ready-to-download historical series with methods and age classes, particularly useful for repeated occurrence and recruitment questions. **Limits:** brook trout only; historical and selected sampling; not warmwater inventory or current stocking status. Many rows originate with NPS/TWRA. Do not count the USGS compilation and its contributing agency exports as separate corroborating observations. Deduplicate by provenance, location, date and sampling event before calculating support.

CSV SHA-256: `445c57856ab3b07e1c27a26b31f734c7a0542ea3faa0cfe46da4d5891391b1ae`. Reproduce using Python's csv.DictReader; filter State, parse SampleDate as month/day/year, and count distinct StreamName and (Latitude, Longitude). The [catalog JSON](https://www.sciencebase.gov/catalog/item/6439af5dd34ee8d4ade231f8?format=json) exposes the actual file URLs, avoiding brittle guessed download paths.

### NPS/TVA IBI surveys: species assemblages, coordinates and field limitations

[2021 IBI catalog](https://catalog.data.gov/dataset/2021-fisheries-index-of-biotic-integrity-ibi-survey-data-from-great-smoky-mountains-nation) exposes original and updated spreadsheets plus field PDFs. Downloaded [GSMNP_2021_IBI_UPDATED.xlsx](https://irma.nps.gov/DataStore/DownloadFile/699130?Reference=2302250). It contains fish-species counts and IBI metrics. The catalog describes a two-year rotation and five surveyed sites in 2021; the methods target community composition using electrofishing and seines, not complete removal of all fish.

**Verified Tennessee example:** the Fish species sheet's Tennessee rows contain **18 named species totaling 1,097 fish** for **Middle Prong Little Pigeon River**, Sevier County, **July 14, 2021**, stream ID 7091/station 1. One is explicitly named **rainbow trout (Oncorhynchus mykiss), count 1**. Station fields include coordinates, river mile, drainage area and a location description. The metrics sheet says sampling began at the park boundary and worked upstream to bedrock falls. This is a bounded, dated observation; do not extend it across the entire river or infer trout abundance in 2026.

An especially useful feature is the sampling caveats: the Deep Creek/Jenkins Place metrics note that no pool haul seine was performed because of difficult habitat/capture efficacy. This is exactly the evidence needed to avoid turning imperfect detection into absence. The IBI rating itself is an ecological-condition score, **not** a warmwater/coldwater classification. Publication/update date January 2024 is separate from 2021 sampling.

### TVA's larger monitoring network: broad warmwater evidence to request

[TVA Water Quality](https://www.tva.com/environment/environmental-stewardship/water-quality) was verified in the browser; direct HTTP returned 403. TVA says it samples **528 stream sites on a five-year rotation**, plus 69 sites across 31 reservoirs on a two-year rotation, and shares water-quality/aquatic-life data. These are TVA-system figures, not Tennessee-only coverage. The NPS IBI files above independently demonstrate the format of a TVA-associated species-count/metric export; they do not establish that all 528 sites have the same publicly available export.

**Why useful:** this may address the biggest coverage gap: positive evidence of fish assemblages in streams outside prominent trout destinations. Request the stream station inventory and dated species-count/effort tables, with Tennessee locations and data-sharing terms, rather than reservoir health ratings alone. No statewide TVA raw export was acquired in this pass. Do not advertise 528 new mapped waters as an accomplished result.

## What is acceptable, available and useful now?

Accept **claims**, not domains wholesale. A precise old survey can be excellent evidence of historical occurrence and insufficient evidence of today's fishery. A current agency program description can identify a reliable data holder without supplying any observations.

| Source route | Availability verified | Best use for this product | Remaining gate |
|---|---|---|---|
| EPA 2023–24 NRSA | Actual counts, sites and metadata downloaded | Recent dated trout and non-trout assemblages at selected TN sites | Validate reach joins, sampling adequacy and current relevance |
| USGS brook-trout compilation | Actual CSV and data dictionary downloaded | Historical persistence/recruitment evidence and locating overlooked streams | Deduplicate agency sources, validate locations, obtain newer evidence |
| NPS annual fisheries workbooks | Actual 2020 and multiyear workbooks downloaded | Historical site-level trends and age classes | Resolve catalog totals, species codes, station geometry, TN/NC separation |
| NPS/TVA IBI | Actual updated 2021 workbook downloaded | Explicit species counts, exact sites and sampling caveats | Historical observation; obtain recent equivalents |
| TVA broader stream network | Program confirmed; full export not obtained | Potentially substantial non-trout/mixed assemblage coverage | Station/species/effort export and sharing terms |
| NEON | Product/site/time coverage verified; file requests returned 403 | Repeat fish samples paired with physical measurements at two streams | Obtain files through supported access and check actual coverage/QA |
| ORNL BMAP | Methods, program and data holder verified | Small-stream assemblages, reference sites and pollution context | Obtain raw tables/current dates; assess geographic usefulness |
| Hydropower licensing/LIHI | Specific completed study and holder identified | Dam-specific reach boundaries and fisheries effects | Obtain actual 2024 report and methods, not certification summaries |
| Corps water-quality profiles | Monitoring program verified | Seasonal habitat constraints in releases and tailwaters | Recent profiles, station definitions and QA |
| Tennessee Tech targeted research | Specific project and investigators verified | Explain movement/predation and identify unpublished useful studies | Completed approved results, dates and methods |

**First acquisition priorities:** EPA for readily accessible, relatively recent all-species observations; TVA for potential broader warmwater coverage; NPS/USGS for detailed historical trout evidence; NEON for repeat biological/physical observations. The others resolve specific gaps rather than serving as statewide base layers. These priorities are research findings, not an implementation plan.

## Better search methods demonstrated here

1. Search **sampling methods and programs**: fish assemblage, three-pass depletion, IBI, NPDES biological monitoring, tailwater fish monitoring. Fishing-tourism search terms miss these records.
2. Follow **machine-readable catalogs to real files**, then inspect fields and dates. A working landing page or catalog update is not a successful data acquisition.
3. Search **legal/reporting identifiers**: FERC P-2169 and the exact 2024 report title are stronger leads than generic Chilhowee fishing searches.
4. Trace **source lineage**. A USGS compilation, TVA-scored NPS workbook and original agency record may describe the same underlying sampling. More websites do not automatically mean more evidence.
5. Seek the **negative-evidence prerequisites**: gear, passes, habitat sampled, effort and failed-sampling flags. No trout captured is weaker than repeated adequate sampling supporting a non-trout assemblage.
6. Use project/team pages to locate **named data owners** and ask a bounded question. No outreach has been sent. The pending record requests above can be routed by the project owner after deciding which gaps matter most.

For year-round versus seasonal-stocked classification, these sources should supplement current management records with repeated biological observations and seasonal habitat evidence. A summer trout record proves occurrence on that date, not year-round survival; age classes require stocking/restoration context before claiming wild reproduction. A mixed fish community is not inherently a data error. Historical evidence should remain visibly historical, and major disturbance/restoration changes require renewed validation.

## Unresolved searches and stopping point

The eDNA search did not produce a verified Tennessee trout eDNA dataset in this pass; it instead led to the usable USGS abundance release. A targeted search for NPS post-Helene fish-survey results did not retrieve a relevant primary result. Neither failed search establishes that such data do not exist. No post-disturbance fish outcome is asserted here.

The 2024 Chilhowee report, full TVA stream export, NEON counts, current ORNL fish tables and recent Corps profiles remain unacquired. The available files are enough to substantiate the new acquisition routes; they are not enough to label every Tennessee reach. This checkpoint preserves verified downloads, limitations and exact owner requests. Only this research report was changed in the repository; no product implementation, deployment or outreach occurred.
