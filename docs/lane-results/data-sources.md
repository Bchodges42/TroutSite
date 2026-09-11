# Lane results — data-sources (external data & fishing information)

**Lane:** provenance-first evidence layer + fishing-information content
**Repo:** `C:\Users\Benjamin\Projects\trout-datasources` (clone of the integrated branch `codex/trout-fieldwork-20260904`)
**Base SHA:** `5648ccca5c2b6f6fb1cba95b8ae2d421a1e07c9e` ("docs: B15 resolved — all 42 reference waterbodies delivered and merged")
**Head SHA:** `1f33f375f665e91364df7bd30b56c7fb69d2c71b`
**Ownership honored:** `apps/api/**`, `packages/contracts/**`, `packages/content/**`, new tests under `apps/api/test/`, the four docs files below. **No files outside the ownership list changed** (verified with `git diff --name-only 5648ccc..HEAD` — see final verification).

## Delivered

### 1. Evidence contract (`packages/contracts`, additive)
- `schemas/waterEvidence.ts`: `WaterEvidenceSchema` exactly per the brief —
  `waterId / retrievedAt / observations[] (sourceId, sourceUrl, observedAt, metric, value, qualifier?) /
  stockingEvents[] (sourceId, sourceUrl, date, datePrecision day|week|month, status scheduled|reported-complete|unknown, species?) /
  regulations[] (authority, sourceUrl, title, effectiveFrom?, effectiveThrough?, summary?) /
  errors[] (sourceId, code, message)`. Metric enum: `temperature-c | discharge-cfs | stage-ft | reservoir-level-ft`.
- `schemas/fishingInformation.ts`: structured, sourced fishing-information content with
  statewide-vs-water-specific separation (`appliesTo`), per-item authority + official URL + effective dates.
- `ENDPOINTS.evidenceWaters = '/v1/evidence/waters.json'` (additive; existing endpoints untouched).
- Contract tests (`packages/contracts/test/waterEvidence.test.ts`, `readingFreshness.test.ts`); fixed the
  pre-existing stale `waterbodyType: 'lake'` assertion (schema intentionally grew lake/pond in da80558).

### 2. Evidence providers + job (`apps/api/src/evidence/`)
- **USGS** (`usgs-provider.ts`): NWIS instant-values parser emitting per-(site, metric) observations,
  zero preserved as a value, sentinels dropped, per-point `P` qualifiers verbatim, per-series
  timestamps preserved (offsets untouched). Same-gauge ordering by the series' own dateTime.
- **TVA** (`tva-provider.ts`): observed-data parser for the verified `tva.com/RestApi` hourly rows —
  ReservoirElevation → reservoir-level-ft, TailwaterElevation → stage-ft, AverageHourlyDischarge →
  discharge-cfs; "1,012.93"→1012.93; "2 PM EDT"→ISO with the published offset; zero discharge kept
  (no generation), impossible zero elevations dropped; no qualifiers invented (TVA publishes none).
- **TWRA** (`twra-evidence.ts`): parses BOTH exceldriven grids on the stockings page, classified by
  **column signature** (REGION/LOCATION → schedule; Destination/Stocking Date → recent report):
  schedule rows → `status:'scheduled'` (never completed, even when the window passed), recent rows →
  `'reported-complete'`; date precision preserved (day / week-of / TBD-month / month-initials).
- **Alias resolution** (`aliases.ts` + `alias-data.ts`): explicit full-string alias table (55 entries
  audited against the real 132 schedule locations) → county-keyed aliases for colliding bare names
  (Wolf/Duck/Elk River) → exact normalized name match (full + parenthetical-stripped base) with a
  **county guard**. No first-word matching, no substring matching; collisions reported `ambiguous`;
  county contradictions refuse the match (TWRA "Mill Creek"=Hickman vs catalog Overton).
- **Staleness** (`stale.ts`): metric-aware observation max ages; precision-aware schedule slack
  (day+14d, week+21d, month+45d). Stale rows are flagged, never deleted, never auto-completed.
- **Assembly** (`assemble.ts`): pure; regulations from the fishing-information content (statewide +
  `appliesTo`), errors per source per water, contract-validated.
- **Job** (`evidenceJob.ts` + migration `004_evidence_runs.sql`): fetch → resolve → assemble → store
  (SQLite `evidence_runs`, last 5 kept as audit). Soft-fail by source: failures become per-water
  `errors[]` entries (`upstream-http-503`, `upstream-timeout`, `source-grid-missing`, …).
  Wired into `pipeline.ts` (`--job=evidence`, included in `--all`), `cron.ts` (daily 06:20), and
  the dry-run (parses USGS + TVA + two-grid TWRA fixtures, no network).
- **Snapshot emission** (`snapshots/build.ts`): `/v1/evidence/waters.json` only after a real evidence
  run exists (skipped with a warning before that — never synthesized); `/content/fishing.json` from
  the content pack. Both additive; all existing snapshots byte-compatible.

### 3. Fishing-information content (`packages/content`)
- `data/fishing-information.json`: statewide rules (trout limits, Aug 1 regulation year + effective
  dates from TWRA news releases, licenses with verified prices, Free Fishing Day 2026/2027),
  16 water-specific special-regulation items (Clinch/Caney/Elk/Hiwassee/SF Holston/Watauga QTA/
  Fort Patrick Henry/Tellico/Citico/Doe/Buffalo/Piney/Clear Creek/Horse Creek/GSMNP/Gatlinburg),
  stocking terminology, access & tailwater safety, official verification links, standing disclaimer.
- Pack build validates it against `FishingInformationSchema` and ships it as `dist/pack/fishing.json`.

### 4. Coverage (`docs/data-source-coverage.json` + `DATA-SOURCE-COVERAGE.md`)
- One record per catalog water (128): monitors (USGS gauges with IV health + TVA locations),
  available metrics, stocking sources, regulation sources, most-recent known observation (live-stamped
  2026-09-04), most-recent known stocking row, unresolved-alias candidates, confidence + reason,
  full provenance block. Offline (deterministic) or `--live` modes via
  `apps/api/src/scripts/build-coverage.ts`.

### 5. Research artifacts
- Live captures committed as fixtures: TWRA page + schedule grid (616 rows) + recent grid,
  TVA locations (43) + observed-data for Norris and Watauga, USGS site-service IV audit of all
  51 catalog gauge ids (fixtures/USGS-SITE/).

## Source coverage & gaps

- **USGS NWIS IV** — authoritative for temperature/discharge/stage on 39 of 51 catalog gauge ids
  (public domain, no key, 15–60 min cadence). Gaps: 10 ids absent from the IV catalog — including
  flagship tailwaters 03533000 (Clinch below Norris) and 03424010 (Caney Fork at Center Hill Dam);
  3 historical-only (03539800 ended 2026-07-26); 03432350 temperature dead since 2014; 03556590
  temperature-only. **No TN reservoir-elevation IV sites exist** (codes 62614/62620/63158 unused in TN).
- **TVA RestApi** (undocumented but verified live, browser-UA required) — hourly reservoir level +
  tailwater stage + discharge for 27 mapped waters (15 lakes + 12 tailwaters/dams), covering the dead
  USGS tailwater gauges and all USACE Cumberland projects. Gaps: no water temperature; endpoint can
  change without notice; mainstem rivers (tennessee/cumberland/holston/french broad/mississippi/obion/
  hatchie/buffalo) deliberately left monitor-less — no single dam represents them.
- **USACE CWMS CDA** — reachable, no auth, but the timeseries catalog 501s and TSIDs are not
  enumerable; NOT usable today. Documented in coverage provenance; TVA's `Ownership:"Cumberland"`
  monitors are the practical path.
- **TWRA stockings** — two official routes verified: the seasonal schedule grid (schedules;
  "week of" = Sunday+5 days, postponable) and the bi-weekly Recent Stocking Locations Report
  (completed, ~12-row rolling window, no counts, no archive — historical retention must be
  self-collected from successive captures). Bonus route: TWRA ArcGIS FeatureServer
  (730 stocking SITE points — geocoding aid, no dated events). 91 waters carry stocking sources;
  55 distinct TWRA names stay honestly unresolved (city ponds, DH waters outside the catalog,
  plural site groupings) and are listed with reasons.
- **Regulations** — regulation year Aug 1–Jul 31 (2026-27 effective 2026-08-01, per TWRA news
  releases); verified negatives: no statewide 14″ trout minimum, no "Type 22" license, no
  year-round-season sentence to quote.

## Rate limits / licensing / credentials / freshness

| Source | License | Credentials | Limits & freshness |
|---|---|---|---|
| USGS NWIS | Public domain | none | etiquette: contact User-Agent; ≤50 sites/request; hourly job cadence |
| TVA RestApi | Public info; undocumented | none (browser UA) | hourly data; ~300 ms politeness gap; may change without notice |
| tn.gov TWRA | Public info | none | robots allows all; CDN ~10.7 h; path ids unstable (re-resolved per fetch) |
| ArcGIS (TWRA org) | Public info | none | hosted-service fair use |
| Regs pages | Public info | none | annual cycle; dates only via news releases |

## Tests

- **contracts:** 96/96 green incl. coverage thresholds (added WaterEvidence + FishingInformation
  schema tests; fixed stale `lake` rejection test; covered previously-untested `readingFreshness`).
- **api:** 110/110 green across 16 files, incl. 36 new data-source tests:
  `evidence-usgs` (fixture parsing, zero preservation, sentinel drop, same-gauge timestamp
  ordering, partial responses, qualifier passthrough), `evidence-tva` (recorded fixtures, number/
  timestamp parsing, zero-discharge preservation, no invented qualifiers), `evidence-twra` (grid
  classification on the real capture, date precision, scheduled-vs-completed, species verbatim),
  `evidence-aliases` (ambiguity rejection, county guard, no first-word/substring matching),
  `evidence-stale`, `evidence-assemble` (assembly rules + end-to-end job with injected fetch:
  upstream failure → per-source error entries, partial response isolation, contract round-trip),
  `evidence-snapshot` (additive emission + backward compatibility).
- **typecheck/build:** `tsc --noEmit` clean for contracts + api (incl. one pre-existing test-file
  error fixed); api build + content pack build green; dry-run parses all fixtures offline.

## Files changed (full list)

Run `git diff --name-only 5648ccc..HEAD` — every path is inside: `packages/contracts/**`,
`apps/api/**` (src/evidence, migrations/004, pipeline/cron/CLI wiring, snapshots builder, fixtures),
`packages/content/**` (data + build script), and the four lane docs
(`docs/DATA-SOURCE-COVERAGE.md`, `docs/data-source-coverage.json`,
`docs/FISHING-INFORMATION-SOURCES.md`, `docs/lane-results/data-sources.md`).
Map geometry, map presentation, fishability rules, UI components: **untouched**.

## Notes for Session 3 (fishability / applicability)

- Read `/v1/evidence/waters.json` for per-water observations/stocking/regulations with provenance;
  `/content/fishing.json` for statewide fishing information. Treat `status:'scheduled'` rows as
  plans only; check `datePrecision` before rendering dates; respect `errors[]` (a missing source is
  an error, not zero); species on stocking rows is verbatim TWRA text — never infer species from
  the water's name.
- Confidence fields in `docs/data-source-coverage.json` (high 26 / medium 92 / low 10) are per-water
  provenance summaries, not fishability scores.

## Commits (this lane, in order)

- `32d12bd` data-sources(contracts): WaterEvidence + FishingInformation schemas; evidence endpoint (additive); fix stale waterbodyType test, cover readingFreshness
- `fe5ba18` data-sources(api+content): evidence providers (USGS/TVA/TWRA two-grid), alias resolution w/ ambiguity rejection, stale detection, evidence job + /v1/evidence snapshot, fishing-information content in pack; fixtures captured live 2026-09-04; 36 new data-source tests
- `1f33f37` data-sources(docs): per-water coverage JSON+MD, fishing-information sources doc, lane report; USGS IV audit fixture; coverage generator
- End-to-end live verification after the commits: seed (128 streams) → evidence job (163 observations, 616+12 stocking rows, 508 stale-scheduled flagged, 0 errors) → snapshots 141 files incl. /v1/evidence/waters.json + /content/fishing.json → web typecheck/test 89/89 + build + size budget OK.
