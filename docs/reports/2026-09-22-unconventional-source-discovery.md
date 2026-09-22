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
