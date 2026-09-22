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

**Potential:** a paired biological/physical time series, including a scientifically monitored warmwater comparison site rather than only famous trout rivers. **Access caveat:** following the inventory's April 2026 data URLs for both sites returned HTTP 403. No fish-count records retrieved yet; actual species/measurements and data quality remain unverified. Do not confuse successful metadata access with successful data access.

### USACE Nashville District: reservoir profiles and inflow/tailwater measurements

[Corps program description, May 5, 2021](https://www.lrd.usace.army.mil/Media/News/Article/3729411/water-management-assesses-water-quality-in-cumberland-river-basin/) verified in the browser (direct HTTP fetch returned 403). It states at least three full sampling trips across ten Cumberland-basin projects to capture spring, summer and fall; profiles include temperature, dissolved oxygen, conductivity and pH, plus sampling at tailwaters, reservoirs, and major tributaries/inflows. It explicitly describes operational responses to low oxygen and names Center Hill, Dale Hollow and Wolf Creek trout tailwaters.

**Why useful:** lake-depth oxygen/temperature overlap and release quality, which a surface gauge or dam-intake description misses. The source confirms an identifiable data holder and monitoring method. **Not yet obtained:** station-level profiles, recent coverage or a working download. The article's linked legacy lrn-wc.usace.army.mil site failed DNS resolution. Route a precise dataset request to the district water-quality team rather than treating the broken portal as no data.
