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
