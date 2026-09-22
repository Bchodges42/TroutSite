# Source acceptance and coverage audit — Tennessee fishing waters

Started September 22, 2026. Research only; no product implementation. This extends [the evidence-methods audit](2026-09-21-evidence-methods-audit.md).

## Read this first

Use a **portfolio of sources matched to specific claims**, rather than an official/unofficial whitelist. TWRA's scoped assessments and stocking records are the backbone; dated guide reports and reviewed community observations fill real gaps. Government hosting does not guarantee currency or consistency.

- **Fishbrain matters:** both existing files cover 190 catalog rows, with 147 mapped rows across 138 pages. They contain aggregate species/catch totals, not dated individual catches. Thirty-nine rows already need segment review; an unrelated Wolf River pair shares a page. Production reuse permission is unresolved under Fishbrain's published terms.
- **Best local-report candidates found:** Little River Outfitters, Tellico Outfitters, The Fly Box, South Holston River Fly Shop, and selected Orvis reports. Evaluate each entry/field; fresh pages can contain stale or conflicting boilerplate.
- **New structured observation route:** iNaturalist supplies dated community observations; GBIF can index the same records, so deduplicate. Review identity, locality/obscuring, and record-specific licences.
- **Historical and regional evidence:** university specimens and conservation assessments are useful, but neither should silently become a current reach-level trout label.
- **Directory cleanup is needed later:** all 23 shop URLs were screened; some are stale, inaccessible, generic retail pages, or geographically mismatched. No catalog edits made.

The detailed checkpoints preserve the evidence and exact links. The acceptance matrix, source portfolio, and owner requests at the end are ready for the sourcing discussion.

## Question and scope

Which sources are accessible and useful for distinguishing year-round trout habitat, seasonal trout opportunity, and warmwater fisheries at the correct reach? Include agency observations, fishing shops/guides, community observations, and the project's existing Fishbrain data. Acceptance must depend on the claim, date, geographic resolution, and how the observation was made—not simply the publisher's category. An official page may be stale or incomplete. A guide's firsthand observation can be useful without becoming a biological survey.

This is a running research log. Findings below are provisional until their verification is recorded. No outreach, private-data access, or implementation is authorized by this audit.

## Checkpoint 1 — existing data and source inventory

- The existing Fishbrain standard-tier file describes unauthenticated GraphQL aggregate discovery collected September 17, 2026. Its declared scope is 152 catalog waters, with 109 mapped records, 108 distinct Fishbrain pages, 1,899 species rows, 25 segment-review flags, and 43 not found. These are file-declared counts; independent recalculation follows.
- The stored query returns species names and aggregate catchesCount; the collection timestamp is not a catch timestamp. Need inspect both discovery files before judging coverage or seasonal usefulness.
- The main-based audit checkout contains 23 shop catalog records, all with reportsEnabled: false. This proves the integration flag state, not that those shops lack public reports.
- Audit baseline: commit 8894f94 in the dedicated audit clone, branch codex/evidence-methods-audit-20260921. Fishbrain research is inspected in the previously captured evidence/habitat-batch6 snapshot; main does not contain those discovery files.

## Evidence capture

Public responses are saved outside the product repository in trout-evidence-audit-materials-20260921/sources with retrieval time, final URL, HTTP status, and SHA-256 metadata. Repository changes are limited to this report.

## Checkpoint 2 — Fishbrain is valuable, but the existing extraction is narrower than catch records

Independently recalculated with an external audit script, not the file summaries:

| Stored extract | Catalog rows | Mapped rows | Distinct pages within file | Species rows | Segment review required | Not found |
|---|---:|---:|---:|---:|---:|---:|
| Featured | 38 | 38 | 34 | 1,621 | 14 | 0 |
| Standard | 152 | 109 | 108 | 1,899 | 25 | 43 |
| Combined | 190 | 147 | 138 across both files | 3,520 | 39 | 43 |

The remaining 108 mapped rows are labelled candidate, not verified. The records contain no individual catch timestamps, coordinates, photos, observer counts, fishing effort, or identification-review fields. September 17 is the extraction date. Existing aggregate species/catch counts cannot support monthly seasonality, summer survival, abundance, or probability of catching a fish. They **can** identify reported species worth investigating and prioritize mismatches against agency information. Zero reports and no matching page are not absence evidence.

Shared pages require particular attention:

- Boone tailwater, Fort Patrick Henry tailwater, and South Holston River share one page.
- Upper Caney Fork and Caney Fork tailwater share one page.
- Lower Duck, Duck mouth, and Duck tailwater share one page.
- Upper/lower Elk, Parksville tailwater/Ocoee, and Watauga/Wilbur reach each share a page.
- **Wolf River Fentress and Wolf River West Tennessee share one page**, an especially strong geographic mismatch warning.

Species checks are necessary too: Boone's stored list includes Brown trout 46 and Rainbow trout 25, but also Sea trout 4; the Clinch list includes Spotted seatrout. Preserve raw labels, resolve taxonomy, and investigate unusual records rather than counting any string containing trout. These are suspect labels/mappings, not proof that every Fishbrain record is wrong.

The research builder `packages/content/scripts/classification/habitat-input.mjs` loads only the standard discovery file. Thus its Fishbrain enrichment omits the featured file's 38 catalog records, even though both files exist. No fix made.

Availability checked: the [Boone public page](https://fishbrain.com/fishing-waters/hgpMXh5F/boone-lake-south-fork-holston-river) returned HTTP 200 and showed selected catches/species, with more catches and locations directed to the app. Public-page availability does not establish a supported data feed.

The [Fishbrain terms](https://fishbrain.com/terms-of-service), labelled updated June 3, 2025, explicitly say users will not use a robot/crawler/scraper or other automated means to gather data, and limit use to private personal purposes. The existing extract describes an unauthenticated GraphQL endpoint; that is not evidence of a reuse licence. **Owner decision:** establish whether the project has separate permission or obtain an appropriate agreement before making Fishbrain an automated production source. This is a concrete published restriction, not a generic objection to community data. No additional GraphQL collection was run in this audit. The support site returned HTTP 403; its help claims remain unverified.

## Checkpoint 3 — shop sources vary substantially

Public pages retrieved successfully September 22 UTC (September 21 evening locally):

| Source | Evidence actually found | Usable role / limitation |
|---|---|---|
| [Little River Outfitters daily report](https://littleriveroutfitters.com/pages/fishing/report.htm) | Byron Begley, September 21, 2026; Little River temperature 71.4 F at 6:48 am; flow 60.3 cfs; distinguishes elevations, stocked streams, lowland bass/panfish; links gauges | Excellent current regional context. Trace gauge-derived measurements to their original station; its forecasts are forecasts. Do not count the same gauge value as a second independent observation. |
| [Tellico Outfitters reports](https://www.tellicooutfitters.com/fishing-reports) | Reach-specific temperature discussion: downstream of Bald River, North River–Green Cove, Green Cove–state line; stocked versus wild trout; visible HTML time elements include August 4, 2026 | High-value local boundary and seasonal evidence. Resolve each entry's date separately; the page concatenates multiple reports and temperatures. Shop handling advice is not a universal survival threshold. |
| [South Holston River Fly Shop summer 2026](https://southholstonriverflyshop.com/fishing_report/south-holston-river-report-summer-2026/) | Reports rainbow catches near Osceola Island/Grates, upper/middle/lower sections, Watauga conditions; July/August trip language | Firsthand seasonal catch context, not a September live flow forecast or a quantified population survey. |
| [Smoky Mountain Angler report index](https://www.smokymountainangler.com/new-blog) | Newest displayed entry August 30, 2022 despite “up to date” heading | Historical source; no current-report claim justified from this index. |
| [Reliance Fly & Tackle catalog URL](https://relianceflyshop.blogspot.com/) | Newest displayed post April 14, 2017; mostly shop promotion | Stale blog, not a current Hiwassee conditions feed. Do not infer the business is closed. |
| [3 Rivers Angler catalog URL](https://3riversangler.com/) | “Launching Soon” landing page | No usable report at this URL on this visit. |
| [Fly South](https://www.flysouth.net/) and [The Hatch](https://www.thehatchoutfitters.com/) | Reachable business/guiding pages | Potential partners; current water reports not yet established. |
| [Eastern Fly Outfitters catalog URL](https://easternflyoutfitters.com/) | HTTP 200 but extracted page only a privacy/advertising shell | Cannot accept as a verified fishing source from HTTP success alone. |
| [Tim's Flies and Lies](https://timsfliesandlies.com/) | Legacy frameset; separate frame content required | A simple text scraper would incorrectly treat this as empty. Further inspection needed before source judgement. |

## Checkpoint 4 — dated reports, hidden contradictions, and scientific occurrence sources

- [The Fly Box August report](https://www.theflyboxtn.com/riverreports//august-south-holston-watauga-river-fishing-report), linked from its homepage with a September 2, 2026 publication date, distinguishes upper and lower South Holston fishing and covers Watauga. Useful dated seasonal opportunity evidence. Statements about TVA rainfall/flows remain derivative of TVA; guide observations have a different origin.
- [Trophy Water reports](https://trophywaterguideservice.com/reports/) displayed April 8, 2025 as the report date. A working guide business and a current report feed are separate questions.
- Tellico's newest inspected [individual entry](https://www.tellicooutfitters.com/fishing-reports/2026/8/4/7292026) is titled **7.29.2026**, while HTML publication/update dates say **August 4, 2026**. Store report-period and publication date separately. Do not assign August 4 to every fishing observation in its index.
- Tim's frames resolve to [undated trip descriptions](https://timsfliesandlies.com/trips.html) mentioning Elk and Duck trout water. Useful partner/geographic lead, not current conditions or proof of year-round survival.

### Orvis: useful current guide reports, but field-level contradictions

The [Tennessee index](https://fishingreports.orvis.com/southeast/tennessee) exposes four water links: Hiwassee, South Holston, Holston Proper, and Tellico. Two were sampled directly:

| Report | Dated firsthand guidance | Conflicting or insufficiently scoped field |
|---|---|---|
| [Hiwassee](https://fishingreports.orvis.com/southeast/tennessee/hiwassee-river), Dane Law, September 14, 2026 | Some upper-river afternoon trout fishing; guide trips resume October 15 | Generic “Available Year round” and constant-temperature description. Also states October–March delayed harvest, which must not replace current TWRA's specific dates/reach. |
| [Holston Proper](https://fishingreports.orvis.com/southeast/tennessee/holston-proper), Dane Law, September 21, 2026 | “We have finished trout fishing here for the summer”; now looking for smallmouth | “Available year round” for trout/smallmouth; displayed temperature lacks measurement time/site in inspected text. |

This does not prove no trout remain: a guide's decision to stop trout trips is an **operational observation**, not a population census. It does prove that a page-wide fresh date cannot safely validate all template fields. A source can be acceptable for its dated report and unacceptable for a particular generic claim.

### Official weekly page is a collection of different evidence types

[TWRA weekly fishing report](https://www.tn.gov/twra/fishing/weekly-fishing-report.html) verified in the browser after two direct HTTP connection resets. Displayed regional reports: Cordell Hull August 26, 2026 (Will Schibig, Region III Creel Clerk), Fort Loudoun and Melton Hill August 28, 2026 (Sydney Feistner, Region 4 Creel Clerk). It also hosts public catch photos, invites submissions, and links the annual biological survey StoryMap.

Accept named, dated creel observations as local fishery context; distinguish them from contributor photos and electrofishing surveys. The Cordell Hull text mentions trout **as bait for striped bass**. A keyword extractor must not turn that into trout occurrence evidence. A “weekly” page last showing August reports is not a current September measurement. Browser verification is recorded here; browser file export was unsupported.

### University of Tennessee Etnier collection: verifiable historical specimens

[Collection owner](https://tennfish.utk.edu/) explicitly describes a repository including TVA/TWRA survey holdings. [Catalog](https://tennfish.utk.edu/catalog/) supports taxon, drainage, locality, state, county, collector searches.

Reproduced a useful search failure: genus Salvelinus plus state **Tennessee** returned zero; genus alone returned **48 records** across multiple states/species. Inspected records encode states as TN/NC. Thus a literal state-name search can create false absence. The 48 is not a Tennessee brook-trout count.

- [Record 31.465](https://tennfish.utk.edu/view-record/?ID=130639): Salvelinus fontinalis; collected October 11, 1989; TN, Monroe County; Brookshire Creek; collector TWRA; named determiner and specimen sizes. Strong historical occurrence, not contemporary survival.
- [Record 31.123](https://tennfish.utk.edu/view-record/?ID=16966): September 6, 1989, **NC** Oconaluftee; the displayed longitude is positive despite its North Carolina locality. Demonstrates why drainage-name matching and unvalidated coordinates are insufficient, even for a university collection.

The [Tennessee Tech Stream Fish Ecology Lab research page](https://www.tntechstreamfishecology.org/research) describes stream/spring fish assemblage research around Arnold Air Force Base. This establishes a potential data holder for Middle Tennessee; it does not establish a downloadable trout dataset. Request/export availability remains unverified.

### iNaturalist and GBIF: real observation dates, with specific constraints

The public [iNaturalist query](https://api.inaturalist.org/v1/observations?place_id=45&taxon_name=Salvelinus%20fontinalis&quality_grade=research&per_page=5) returned total_results **138** at capture, with five sampled records. Tennessee place ID 45 was verified with the places autocomplete API. These are query counts, not populations or necessarily distinct streams.

Sampled records contained observed_on dates in July–September 2026, taxon identification, photos, research quality grade, location-accuracy fields, and separate observation/photo licences. Two were obscured; one obscured record still had positional_accuracy 4. Therefore **geoprivacy must be checked independently of the numeric accuracy field**. Never snap an obscured point to the nearest stream. Some licences were CC-BY-NC; others null, and one photo licence differed from the observation licence. Public access does not make all reuse equivalent. Photos/identifications have not been independently reviewed in this audit.

Accept as dated **reported occurrence candidates**, promoting individual observations only after identity, wild/captive status, date, locality, and reuse checks. A summer fish supports presence on that date; it alone proves neither recruitment nor interstock survival. A research-grade label is a community identification status, not a systematic population survey.

The [GBIF query](https://api.gbif.org/v1/occurrence/search?stateProvince=Tennessee&scientificName=Salvelinus%20fontinalis&limit=5) returned count **121**. All five sampled records were HUMAN_OBSERVATION entries whose occurrenceID links to iNaturalist; uncertainty ranged from 4 m to approximately 28.6 km. **GBIF and iNaturalist cannot be counted as independent support for those records.** Different totals may reflect index/filter/publication differences; this audit does not establish the reason. GBIF is a discovery/indexing layer; inspect the original dataset and record basis before assigning evidentiary weight.

### Community forum availability

[East Tennessee Fishing forums](https://www.easttennesseefishing.com/forums/) was publicly readable without login, with water-specific categories and a trout category. The sampled [Caney Fork index](https://www.easttennesseefishing.com/forums/caney-fork.43/) displayed old threads (newest visible activity October 2013). Useful historical leads; not an established current feed. A forum category's existence is not evidence of recent observations. Search snippets for Facebook/TNDeer are discovery leads only; no biological claims were accepted from snippets.

## Checkpoint 5 — completed shop-URL screening and conservation data

All **23 catalog shop URLs** have now been attempted. This is a URL/source screening of the pinned checkout, not a claim to have exhausted each business's social accounts or verified current business operations. The other eleven results complete the earlier twelve-shop coverage:

| Catalog business | Public-source result | Decision |
|---|---|---|
| [Angry Eagle](https://angryeagle.com/) | Site identifies an Alaska/Bristol Bay lodge; repository says Nashville, TN | Geographic mismatch. Do not treat as a Tennessee local-water source. |
| [Toccoa River Outfitters](https://toccoariveroutfitters.com/) | Site identifies Blue Ridge and McCaysville, Georgia; repository says Copperhill, TN | Adjacent-region lead, not automatically Tennessee coverage. [Report](https://toccoariveroutfitters.com/fishing-report) dated September 14, 2026 primarily gives seasonal advice and says to call for today's update; date alone does not make it an observation feed. |
| [Cumberland Transit](https://cumberlandtransit.com/fly-fishing/) | Nashville shop names a fishing adviser; [blog](https://cumberlandtransit.com/blog/) starts with April 24, 2019 climbing content | Local-expertise partner candidate; no current fishing report established. |
| [Harpeth River Outfitters](https://www.harpethriveroutfitters.com/) | Retail apparel/gear homepage | Potential Middle Tennessee contact, no water observations established. |
| [TN Fly Co](https://tnflyco.com/) | Merchandise store, including trout-themed products | Branding/species merchandise is not occurrence evidence. |
| [Orvis Memphis](https://stores.orvis.com/us/tennessee/memphis) | Store address/hours/classes available | Potential West Tennessee partner; store page is not a local catch report. Orvis's separate report service was evaluated above. |
| [Orvis Knoxville catalog URL](https://stores.orvis.com/us/tennessee/44) | HTTP 404 | Broken catalog URL; no claim about store closure. |
| [Orvis Sevierville catalog URL](https://stores.orvis.com/us/tennessee/sevierville) | HTTP 404 | Broken catalog URL; no claim about store closure. |
| [Bink's Lodge catalog URL](https://binkslodge.com/) | TLS certificate hostname mismatch | Not verified; did not disable certificate verification. |
| [Competitive Angler catalog URL](https://competitiveangler.com/) | Connection timeout | Not verified; failure is not proof of no useful source. |
| [Tennessee Traditional Flies](https://tennesseetraditionalflies.com/) | HTTP 403 | Not verified; no access-control workaround attempted. |

**Finding:** a shop belongs in the source registry because of verified waters served and actual observations, not because its name appears in a Tennessee directory. Physical proximity is useful for finding a contact, but it does not establish firsthand knowledge of a particular reach. Guides without storefronts, bait shops, marina operators, park staff, and local conservation survey participants should be discoverable by waters served as well.

### EBTJV: useful regional screening, explicitly unsuitable as a reach classifier

The [Eastern Brook Trout Joint Venture assessment owner page](https://easternbrooktrout.org/science-data/update-to-the-ebtjv-assessment) was read directly. It says the current assessment is timestamped **November 2024 using data through 2023**, covers wild brook/brown/rainbow trout, and incorporates an occupancy model at catchment scale. It explicitly says **“It is not intended to represent stream reach level occupancy.”** It does not handle state stocking locations, and its model does not incorporate culverts (a separate layer can display assessed barriers).

Accept for regional research prioritization and conservation context, retaining source vintage/model status. Do not transfer a catchment classification to every mapped stream. The owner provides a data-request form and routes reach-level questions to agency partners. No form was submitted; download access has not been obtained.

An inspected [Tennessee restoration project page](https://easternbrooktrout.org/projects/2021-projects/improving-connectivity-for-reintroduced-native-brook-trout-in-trail-fork-of-big-creek-cocke-county-tn), under 2021 projects, names TWRA, Cherokee National Forest, TU, and TNC; it distinguishes native brook-trout drainages from a historically extirpated drainage and describes proposed connectivity work. Useful source-holder and historical-status evidence. A proposal describing what a project **will** do is not proof that restoration succeeded; seek completion reports and post-project surveys.

## Findings: what is acceptable for each claim

Acceptability attaches to an individual claim and its evidence, not permanently to an organization. These are recommended editorial rules for the later planning discussion, not implemented policy.

| Claim we want to show | Evidence that can establish/support it | Evidence that cannot establish it alone |
|---|---|---|
| A stocking is planned | Current responsible agency/operator schedule, with published date precision | A past date on the calendar; catch reports |
| A stocking occurred | Responsible operator's completed-release record, with destination/date; verified firsthand delivery report can be separately labelled | Scheduled stocking, hatchery production, stocking-location point |
| Trout was observed here on a date | Survey/specimen or reviewed firsthand catch/photo with defensible identity, date and locality | Generic “trout stream” prose, bait mention, merchandise, map category, a copied report |
| The reach offers year-round trout fishing | Explicit applicable fishery assessment, or a documented body of reach-specific seasonal observations plus management/physical context; qualify unresolved contradictions | Winter stocking alone, an August fish alone, bottom-draw dam alone, a lake-wide aggregate catch total |
| Fish survive between stocking seasons / reproduce | Appropriately designed survey, cohort/tag evidence, recruitment evidence, or an explicit accountable biological assessment | Catch size, “wild-looking” fish, multiple catches without stocking history, a guide offering year-round trips |
| Seasonal stocked trout opportunity | Applicable seasonal-program description plus observations/assessment of the fishing window | Treating stocking months as the exact survival window; assuming all stocking outside summer is winter-only |
| Warmwater fishing focus | Positive warmwater assemblage, fishery management, survey or credible seasonal fishing information for the reach | Failure to find trout, no Fishbrain page, no gauge, absent stocking row |
| Current thermal conditions | Timestamped and located measurement with units, depth where relevant, and quality flags | Report publication timestamp, weather/air temperature, an upstream gauge silently applied downstream |
| Access or legal fishing rules | Current land manager/regulator rules and boundaries | Fish caught there, a shop trip page, crowdsourced map markers |

For **year-round opportunity**, a clear, current, reach-specific TWRA assessment can be sufficient positive evidence; we do not need to invent an impossible requirement for a new field study on every known fishery. Conversely, non-government firsthand evidence should not be permanently barred just because an agency's public inventory is incomplete. Publish it with accurate attribution and scope, and keep “reported opportunity” distinct from verified biological persistence when that distinction matters.

The central product implication remains: **warmwater fishery and seasonal trout use can both be true**. Sources about bass do not need to prove the absence of trout. This removes much of the pressure to manufacture a statewide trout/no-trout answer.

## Practical source portfolio

The first five rows below incorporate the primary-source checks already documented in [the preceding audit](2026-09-21-evidence-methods-audit.md); their counts are from that capture, not a new statewide census.

| Source family / exact entry point | Availability demonstrated | Best contribution | Limit / maintenance requirement |
|---|---|---|---|
| [TWRA live trout information, schedule and release report](https://www.tn.gov/twra/fishing/trout-information-stockings.html) | Public HTML and machine-readable tables; 616 schedule rows, 10 recent-release rows in prior capture | Stocking program, plans and reported releases | Rolling release report is not a complete archive; preserve date precision and contradictions |
| [TWRA annual trout forecast](https://storymaps.arcgis.com/stories/dbb92bdf718f4fd7839bf4b08fb82747) | Public StoryMap and item-data JSON verified | Reach-specific survey interpretation, holdover and seasonal limits | Some 2026 sections describe 2025 sampling or no new survey; data year must be extracted |
| [TWRA brook-trout temperatures](https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/Brook_Trout_Temperature_Data/FeatureServer/0), [genetics](https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/Brook_Trout_Genetics_ArcFormat_2025/FeatureServer/0) | Public queryable layers; prior audit found 2,284 temperature rows/12 stream-name strings and 110 genetics records | Targeted thermal history and biological collection evidence | Limited coverage; units/methods/collection dates/reuse scope need clarification; upload year is not sample year |
| [USGS](https://waterservices.usgs.gov/nwis/iv/?sites=03582000&parameterCd=00010&startDT=2025-07-01&endDT=2025-07-31&format=json), [WQP/TDEC example](https://www.waterqualitydata.us/data/Result/search?siteid=TDECWR_WQX-TNW000000754&characteristicName=Temperature%2C%20water&mimeType=csv) | Actual time series and field observations retrieved | Physical habitat context at stations | Station/reach linkage, gap duration, time of day, provisional status; temperature alone is not occupancy |
| [TDEC use classifications, EPA-hosted edition](https://www.epa.gov/system/files/documents/2024-07/tn_wqs_0012_062024.pdf) | Official dated PDF with river-mile designations | Legal designation and boundary evidence | Legal/protective designation is not a current fish census |
| [TWRA weekly reports](https://www.tn.gov/twra/fishing/weekly-fishing-report.html) | Browser-readable, named contributors and report dates | Current-ish warmwater/trout context and leads | Mixed report types, incomplete statewide coverage, potentially stale “weekly” entries |
| LRO, Tellico Outfitters, Fly Box, South Holston shop, Orvis reports (links above) | Individual public dated reports inspected | Summer observations, local reach transitions, actual angling practice | No standard schema/cadence; promotional selection; per-entry attribution; production reuse permission not yet established |
| Fishbrain existing aggregate discovery | 147 mapped catalog rows; 138 distinct pages | Broad species leads, contradictions, research prioritization | 39 segment flags; no catch dates in extract; reuse permission unresolved; 43 unmatched waters |
| iNaturalist | Public structured query and five individual record schemas inspected | Dated, reviewable community observations | Sampling bias, obscured/inaccurate locality, record/photo rights, identification review |
| GBIF | Public structured query and provenance inspected | Find museum, survey and community datasets | Index of heterogeneous evidence, duplicates and historic records; inspect original dataset |
| UT Etnier collection | Working search and specimen detail pages tested | Vouchered historical distribution, original collectors | Historic observations, inconsistent/geographically ambiguous inputs; bulk export/reuse not established |
| EBTJV / conservation partners | Owner assessment page, scope disclaimer, data-request route, TN project page | Landscape screening, restoration history, identifying actual data holders | Modelled/catchment scope; proposals versus completed work; data download not yet obtained |
| Public forums / social reports | One forum index and one water category read | Leads, historical observations, prompts to investigate anomalies | Current coverage not established; require original post/catch date and exact claim; snippets alone rejected |
| TTU research lab | Research-holder page verified | Potential Middle Tennessee assemblage/spring data | No downloadable dataset or current collection period verified |

**Highest-value additions to the existing search:** current shop/guide reports with reach boundaries; dated community observations instead of totals; original survey/collection records; and targeted requests to the people who hold unpublished data. A new directory of generic fishing pages would add far less.

## Better ways to acquire and evaluate evidence

1. **Start with a missing claim, not a water-name search.** For a seasonal question, search the hottest period and the exact reach. For a wild-trout claim, seek recruitment or a biologist's assessment. For a warmwater label, seek positive assemblage evidence. Stop when the claim is adequately supported; ten derivative pages add no independent evidence.
2. **Maintain source lineage.** Record original observer/dataset separately from the host website. A gauge quoted by a shop, its repost on Facebook, and a TWRA roundup are one observation. The iNaturalist/GBIF duplication is a reproduced example.
3. **Separate five dates.** Observation date, report period, publication date, modification date, and retrieval date can differ. Preserve whichever are actually known. Tellico's July 29/August 4 entry demonstrates this concretely.
4. **Ask local experts bounded factual questions.** “Which reach did you fish in late August, on what dates, what species did you personally see, and where does the summer transition occur?” is more answerable than “Is this river a trout river?” Capture whether temperatures were measured or remembered, where/how measured, and whether statements come from customers.
5. **Use a voluntary observation form as a future acquisition method.** A guide/angler can supply water reach, observation date, species/photo, temperature with time/location, firsthand versus relayed status, and permission to quote. Include effort and no-catch trips if estimating catch trends; do not interpret a blank report as zero fish. This is a proposed source method, not an implemented feature.
6. **Check surprising evidence before discarding it.** A summer trout report outside the official list may reveal a spring refuge, unmapped reach, tributary movement, mistaken identification, recent stocking or wrong location. Preserve the lead and the uncertainty; do not automatically accept or suppress it.
7. **Use geography explicitly.** Resolve county/drainage/dam side and reach endpoints before attaching evidence. Avoid nearest-stream assignment when positional uncertainty crosses catchments or a dam. For reservoirs, keep depth and arm separate from surface/bank conditions.
8. **Track evidence quality separately from access rights.** A high-quality dataset can require an agreement; an openly licensed observation can still be wrong. Give each source distinct states for inspectability, evidentiary fitness, production reuse, and unresolved questions. “Public URL” is not a single acceptance flag.

## Questions routed to the owner / source holders

No outreach was sent. These are concrete unresolved requests, not hidden guesses:

| Route | Request / decision needed | Safe interim role |
|---|---|---|
| Project owner → Fishbrain relationship/permissions | Do we already have a licence or agreement? If not, ask about permitted aggregate exports with species, month/year, reach resolution, suppression rules and attribution | Retain existing extract as a research lead; do not promise an automated production feed |
| Project owner → TWRA regional biologists / GIS data steward | Obtain dated survey/creel exports, station-to-reach definitions, stocking completion history, logger units/protocol/calibration, and current assessment of disputed seasonal boundaries | Use verified public claims within their stated scope |
| Project owner → shops/guides with demonstrated reports | Offer an attributed, permission-based summary or direct submission; request waters served and late-summer firsthand observations | Link to dated reports; do not reproduce entire commercial reports or photos by default |
| Project owner → EBTJV / agency partner | Request permitted data and underlying TN reach-level survey references; clarify survey versus modelled classes | Regional screening only |
| Project owner → UT collection / TTU lab | Ask for export format, dates/effort, coordinate corrections, usage terms, and whether newer surveys exist for priority gaps | Historical records and data-holder leads |
| Project owner / future reviewer | Resolve catalog geography and Fishbrain page collisions; decide initial verified coverage and how attributed community evidence is displayed | Keep unmatched/conflicting reaches unresolved |

## Stopping point and limits

This pass establishes a usable source portfolio and acceptance rules, with all 23 existing shop URLs screened, both Fishbrain files recalculated, selected live reports inspected, two occurrence APIs tested, university specimen retrieval reproduced, and conservation-data scope checked. It is **not** a reclassification of 190 waters, a complete inventory of every Tennessee fishing business, or a negotiated set of data licences.

The evidence supports moving to an owner-reviewed sourcing decision before implementation. The most consequential remaining gaps are rights for Fishbrain production use, incorrect reach matching, summer observations for poorly documented waters, and source-owner confirmation of unpublished/ambiguous data. No product code, catalogs, deployments, or classification outputs were changed.
