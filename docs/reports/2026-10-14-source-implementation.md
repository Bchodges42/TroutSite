# Source implementation — October 14, 2026

Implemented on `codex/data-sources-regulations-20261014`; owner merge and production
deployment are pending. This continues the [source audit](2026-10-14-source-verification-followup.md).
ADRs 0012/0013 record the additive contract changes; the contracts package is 2.6.0.

## Completed behavior

| Recommendation | Implementation and limits |
|---|---|
| Documented Corps API | The conditions bridge defaults to CWMS using audited LRN series for Center Hill, Dale Hollow and J. Percy Priest. Validates series/office, requested cfs/Celsius units, column ordering, quality flags and complete cursor pagination. Failed pages withhold that metric, retain healthy other metrics and record degradation. Rejects future/stale/invalid values; keeps real zero. Cordell Hull remains coverage-only for the broad Cumberland catalog water. `usaceProvider: 'a2w'` is the explicit rollback option. |
| Correct local gauges | Thirteen catalog primary/reference policies select by metric and reach. Downstream/reference readings remain separately inspectable and cannot substitute for missing local data. Sensor-specific times survive ingestion, DB payloads, snapshots, scores and display. Latest-row selection uses parsed instants and excludes future rows before ranking. |
| Measured flow context | A separate monthly cache reads approved USGS Statistics month-of-year discharge normals (P25/median/P75, sample count, parent series/computation IDs). Values are historical context and never enter live gauge rows. No automatic conversion into ideal fishing/wading thresholds. Parallel ambiguous series are withheld. A network/page failure retains the prior cache. |
| Honest flow guidance | All 94 existing authored bands remain explicitly editorial. Out-of-band flows cannot become “Good” through a temperature bonus. A measured flow without an authored band returns `assessed:false`; the UI does not color an editorial flow band as a validated favorable measurement. |
| Insect identification | Both observation and taxon schemas accept 0/1/2/3/unknown/not-applicable tail filaments. Updated the key, detail labels and matcher; unknown/NA does not earn a match point. Repaired 64 records, including absent filaments for caddis/midges/ants, NA for fish, one for alderfly larvae, and an explicit gill/filament distinction for damselflies. Eight ambiguous counts remain unknown. |
| Hatch evidence | All twelve calendars disclose that timing and abundance are editorial. Six adult caddis chart entries now cite Abrams Creek specimen records for regional presence only. The methods/Table 2 do not establish species-specific monthly emergence or the app's abundance scale. |
| Regulation gaps | Preserved the Boone/Fort Patrick Henry correction and Paint Creek/Big Soddy repairs. Added ten missing named waters/rules: North River, Bald River, Sycamore Creek (Tellico), Rough Ridge Creek, Rocky Fork (Greene/Unicoi), Left Prong Hampton Creek, Little Stony Creek (Carter), Slickrock boundary reach, Acorn Lake and Dillard Ponds. Total: 200 waters and 31 special rules. |
| Verified map locations | Eight new stream traces use committed USGS graph identities without invented bridge segments. Two still-water markers use official TWRA points and verified counties. All original 190 map feature objects are unchanged. These locations identify the named water, not surveyed legal regulation boundaries. |
| Historical temperature | Added the WQP review/export adapter and `history:temperature` CLI. It requires explicit monitoring IDs/date bounds; retains original values/units, source dates/local times/timezones and available qualifiers/method/depth. It converts explicit Fahrenheit only and withholds missing/unknown-unit results. It has no DB/live-score publishing path. |
| Automated truth checks | Added configured local CWMS gauges to the daily comparison. USGS comparisons include reference readings, missing published metrics and individual metric times. Same-instant differences, unavailable published current metrics, and source lag beyond tolerance are reported. Existing scheduler wiring takes effect after merge/deploy. |

## Source verification

The new adapters were exercised against the public sources at approximately
2026-10-15 04:19–04:20 UTC (October 14 local time), using no production database:

- **Center Hill:** 250.00000007 cfs at 02:00Z; 12.74°C at 03:30Z. The adapter preserved
  the distinct instrument times and unscreened raw quality code 0 without calling it approved.
- **Dale Hollow:** fresh flow and temperature returned without adapter errors.
- **J. Percy Priest:** current temperature returned; flow had no usable value inside
  the three-hour gate and was withheld with a warning. This is recorded degradation,
  not evidence that the river has no flow.
- **USGS Obed gauge 03538830:** all twelve approved monthly normals were cached in a
  disposable DB, with **zero** live gauge rows written. These are month-of-year normals
  derived from the requested parent daily-mean statistic, not a fishing-success study.
- **TDEC WQP site TDECWR_WQX-TNW000003498:** eleven 2024 temperature samples returned
  for the explicit site/year. They are historical discrete samples; no local reach
  mapping or present-day thermal condition is inferred from them.

Normalized results and hashes are archived in
[`research/2026-10-14-source-implementation/`](../research/2026-10-14-source-implementation/).
The earlier raw source audit remains unchanged. Biological references:
[EPA macroinvertebrate tipsheet](https://www.epa.gov/system/files/documents/2024-06/macroinvertebrate-id-tipsheet.pdf)
and [DeWalt & Heinold (2005), Abrams Creek survey](https://www.ephemeroptera-galactica.com/pubs/pub_d/pubdewalte2005p34.pdf),
Table 2 printed pp. 41–42, methods p. 37. Nine sites were sampled across 25 May–22 July
2001 using adult UV collections, among other methods; no species-specific emergence
date is claimed from that combined record.

## Validation and release

Validation covers contracts/coverage, content, API, web, infrastructure, atlas identity,
all workspace production builds and four offline Chromium browser tests. The detailed
final counts are recorded in `research/2026-10-14-source-implementation/validation.json`.
New/modified code lint has zero errors (one existing unused-disable warning).
Package-wide content lint still has the previously identified errors in older scripts.
Production web precache: 12.53 MB against the 25 MB gate; content pack: 1.54 MB.

Deploy the contracts, generated content and web build together: old clients cannot
interpret newly added enum values. Normal application migration/seed/build applies
SQLite migrations 019 (gauge policy/historical normals) and 020 (still-water counties).
Historical flow refresh runs during the gauges pipeline and caches for thirty days;
network failures preserve cached context. To export a reviewed site's temperature:

```sh
pnpm --filter @trout/api history:temperature -- --sites=TDECWR_WQX-TNW000003498 --start=01-01-2024 --end=12-31-2024 --out=temperature-review.json
```

Review branch: <https://github.com/Bchodges42/TroutSite/compare/main...codex/data-sources-regulations-20261014>.
The GitHub integration previously rejected PR creation with HTTP 403; no PR was created.
No merge or production deploy was performed.

## Evidence still required

- The **94 flow bands** remain editorial. Historical percentiles alone cannot establish
  safe wading or productive fishing limits.
- **Twelve hatch calendars' timing/abundance** still need locality, stage and seasonal
  evidence. The six presence citations do not validate their chart months.
- **34 existing waters lack fishery-specific sources** and remain unresolved. The ten
  additions raise source-bearing records to 166/200, while Slickrock/Dillard persistence
  also remains unresolved (36 unresolved trout opportunities total).
- **TWRA temperature logger units/methods and legal reach geometry** need confirmation.
  Its older geometry is useful for discovery, not proof of current regulatory boundaries.
  Historical WQP sites need reviewed spatial/reach joins before any user-facing publication.
- The **Piney River disagreement between TWRA pages** remains prominently disclosed.
- Production DNS, the production USGS API key, remaining source outages and owner review
  remain the separate actions already tracked in `KNOWN-ISSUES.md`.
