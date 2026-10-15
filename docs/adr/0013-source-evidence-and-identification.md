# ADR 0013 — explicit source evidence and identification uncertainty

Status: implemented on `codex/data-sources-regulations-20261014`, owner review pending.
Contract package: 2.6.0. User authorization: implement the source-audit recommendations.

Preserve existing exports and valid legacy payloads. Widen the tail-filament enum to
0/1/2/3/unknown/not-applicable. Zero is an observed absence; unknown and not-applicable
do not score. Count long insect filaments, not hooks, legs, fins or tail-like gills.
The UI, content pack, observations and ranker migrate together. Existing 2/3 observations
remain valid. Old clients need the matching app update to read the new enum values;
publish regenerated content alongside the new web build using the existing updater.

Add optional gauge-selection, historical-flow and hatch-evidence fields rather than
renaming existing fields or replacing historical data with an opinion. Primary gauges
are chosen per metric and reach; reference-only gauges never silently become local
measurements. Seasonal USGS percentiles are historical context, never ideal/safe fishing
thresholds. Historical temperature samples never enter the live conditions score.

Hatch entries distinguish observed emergence, specimen records and editorial guidance.
An article citation validates only its stated locality, collection dates and life stage.
Existing chart/abundance opinions remain explicitly editorial until evidence supports
each claim. Unknown fishery opportunities remain unresolved until claim-specific sources
justify a change. Government designation supports the named reach only.

Use the documented CWMS API with audited LRN series, explicit units, complete pagination,
quality flags and per-metric freshness. Do not map tailwater elevation into gage height.
Keep Cordell Hull coverage-only for the multi-dam Cumberland catalog water. A2W remains
an explicit rollback adapter; the conditions bridge defaults to CWMS.

Biological source for the tail repair: EPA Publication 800-F-14-011,
https://www.epa.gov/system/files/documents/2024-06/macroinvertebrate-id-tipsheet.pdf.
Unreviewed or life-stage-ambiguous attributes are unknown rather than inferred.
