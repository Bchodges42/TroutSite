# Source acceptance and coverage audit — Tennessee fishing waters

Started September 22, 2026. Research only; no product implementation. This extends [the evidence-methods audit](2026-09-21-evidence-methods-audit.md).

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
