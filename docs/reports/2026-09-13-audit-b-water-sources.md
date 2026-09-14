# 2026-09-13 audit — Session B: external water-data-source coverage

**Base revision:** `b44b4fe09af3b47a35f63afdb547475e1ccf0fe7` = `origin/main` at clone time
(proof: `git ls-remote origin main` → `b44b4fe09af3b47a35f63afdb547475e1ccf0fe7`, equal to
local `git rev-parse HEAD`; `git fetch --prune origin` run first). Campaign baseline
matched exactly; no drift.
**Research window (UTC):** opened 2026-09-13T23:45Z; primary probe block ran
2026-09-13T23:45Z–2026-09-14T00:10Z; every live claim in this report carries its own
retrieval timestamp.
**Branch:** `campaign-b` · push target `git@github.com:Bhodges42/TroutSite.git`.
Read-only audit: the only file this session creates or modifies is this report.

## Status

Sections landing incrementally (commit+push after each): methods → source registry →
station inventory → coverage matrix → lake findings → modernization → scrape recipes →
do-not-implement register → gaps. Live work continues until all providers are re-probed.

## Methods, limitations, source-quality rubric

**Catalog recount (mine, not inherited):** `packages/content/streams/tn/*.yaml` contains
**148 water files** (matches the "~148" doc claim exactly). **48 waters carry `gaugeIds`**
with any content; **100 carry none**. Distinct configured IDs: **63** = 50 USGS 8-digit
site numbers + 10 `tva:` monitors + 3 `usace:` TSIDs. (The 2026-09-04 coverage doc said
"51 catalog gauge ids"; the current catalog has 50 numeric USGS IDs — the doc's number is
one high against today's tree.)

**Wiring ground truth read from code (not docs):**
`apps/api/src/evidence/monitors.ts` (26 TVA mappings: 15 reservoir + 11 tailwater;
4 USACE stations incl. coverage-only CORT1; `USGS_GAUGE_HEALTH` ledger),
`apps/api/src/evidence/usace-provider.ts` (12 hardcoded TSIDs:
`{CETT1,DHTT1,JPPT1,CORT1}-{dam}.{Flow.Ave.1Hour.1Hour.man-rev | Elev-Tail.Inst.30Minutes.0.dcp-rev | Temp-Water-Tail.Inst.30Minutes.0.dcp-rev}`),
`apps/api/src/evidence/sources.ts` (7-entry registry — note `usace-a2w` is a live wired
provider but has NO entry in `SOURCES`), `apps/api/src/evidence/nws-provider.ts`
(12 regions → 10 ASOS stations: KNQA KBNA KSYI KMOR KCSV KTRI KTYS KGKT KMRN KCHA).

**Methods:** every provider claim below was re-probed live by this session during the
research window with `curl` (identified User-Agent; 1.5–5 s spacing; no auth; no
access-control bypass; browser-side scraping excluded). Three read-only subagents ran in
parallel (federal gauges / other authorities / scrape recipes); **their leads were only
written into this report after an independent parent probe reproduced them** — items not
yet re-probed are marked `[lead — parent re-probe pending]`.

**Limitations:** (1) snapshot audit — values age hourly; per-metric observation times are
recorded so the planner can judge. (2) Subagent model selection was not available in this
harness, so subagents ran on the harness default model, not a designated `glm-5.3-flash`;
their outputs were treated as leads, verified as above. (3) Cloudflare- and TLS-blocked
hosts were recorded, not circumvented. (4) Offline fixture analysis of the existing
pipeline (scoreInputs, ingest internals beyond providers) is Session A's lane; this report
covers external sources only. (5) Species/season/threshold interpretation is Session C's
lane and is deliberately absent.

**Source-quality rubric** (used in the matrix `quality` column):

| Grade | Meaning |
|---|---|
| **A** | Official primary authority, documented/public-domain, keyless, machine-readable (JSON/RDB), ≤60 min cadence, live-verified today |
| **B** | Official primary, machine-readable but undocumented OR fixed-English-units OR UA-header-sensitive OR ≤3 h lag, live-verified today |
| **C** | Official primary, machine-readable but fragile (CMS path churn, challenge-gated family, empty-body ambiguity), live-verified today |
| **D** | Periodic/manual (PDF, weekly grid, bi-weekly rolling window) — baseline/schedule value only, never live scoring |
| **E** | Dead, blocked, or unverifiable as of this window — must not be implemented as fact |

## Findings

(F1–F14 below are cross-referenced by the registry/matrix.)

- **F1 — Catalog:** 148 waters; 100 (68%) have no gauge id at all; 48 are wired.
- **F2 — USGS parameter health is far worse than "gauge exists":** of 50 configured
  numeric sites, **12 are absent from the current IV site-service catalog**
  (03417000, 03424010, 03468510, 03469000, 03476500, 03483980, 03484000, 03486810,
  03487010, 03487602, 03533000, 03580750), 2 are historical-only (03564500 →1994,
  03566000 →2018), 1 died weeks ago (03539800 Obed: flow ended 2026-08-22, stage
  2026-07-26), and only **34 of 50 return current flow/stage** in a 7-day window.
- **F3 — USGS live temperature exists at just 8 of 50 sites today** (03408500, 03409500,
  03430200, 03433500, 03497300, 03539600, 03539778 — last temp stamp 2026-09-10 — and
  03556590). Every other configured site's temp series ended years ago (2004–2017). For
  most named rivers the only live temperature on the wire is TVA/USACE dam sensors.
- **F4 — Confirmed anomaly the score must not trust:** `03430200` (Stones River @
  Donelson) published **discharge = −168 cfs** (qualified P) on 2026-09-13T18:00−04:00
  while stage/temp read normal — negative discharge is physically invalid and needs a
  validation rule (≤0 → unusable) before it can reach `scoreConditions`.
- **F5 — TVA is healthier than documented and does MORE than the repo uses:** all 13
  probed monitors returned 200; payload shape confirmed (ReservoirElevation /
  TailwaterElevation / AverageHourlyDischarge; **no temperature**; comma-string numbers;
  "Noon"-style text times with per-dam EST/EDT/CST/CDT embedded). **Two undocumented
  siblings verified live:** `GET /RestApi/generation-releases/{LocationID}` (official
  generator blocks for today+tomorrow — the release schedule without scraping HTML) and
  `GET /RestApi/predicted-data/{LocationID}` (3-day forecast: AverageInflow,
  MidnightElevation, AverageOutflow). Neither is in `sources.ts`.
- **F6 — TVA operational header requirement (parent-verified):** `observed-data` requires
  a browser User-Agent **and** `Accept: application/json`; without the Accept header the
  same URL returns a ~20 KB `text/html` snapshot page (my probes: 1,042–1,090 B JSON with
  the header vs 20,759–20,791 B HTML without, same URLs, same window).
- **F7 — USACE A2W (provider lrn) fully healthy:** all 12 hardcoded TSIDs returned 200
  with clean ISO-Z timestamps and declared units (Flow=cfs, Temp=°F) for Center Hill,
  Dale Hollow, J. Percy Priest, Cordell Hull; tailwater temps 52.6–81.1 °F live. CWMS
  Data API remains unusable: `cwms-data.usace.army.mil/cwms-data/locations?office=NASHVILLE`
  → HTTP 500 `{"message":"failed to process request"}` (2026-09-14T00:00:13Z) — different
  failure than the 501 recorded 2026-09-04, still dead.
- **F8 — USACE public web is broken host-side:** `www.lrn.usace.army.mil` serves an
  Akamai certificate whose SAN omits the LRN hostname (curl error 60, verified by
  subagent, consistent with the 2026-09-08 TLS-block note); `rivergages.com` now serves
  `CN=*.turbifysites.com` — the classic USACE stage site is effectively gone. Neither may
  be worked around with `-k`; both stay dead until Army/Akamai fixes them.
- **F9 — TWRA ingest survives:** both exceldriven JSON grids re-verified live
  (scheduled grid 616 rows; recent grid 13 rows; 2026-09-14T00:06Z); the 2026-09-08
  connection-reset did NOT reproduce. CDN serves multi-day `Age` (~3.4 d observed) —
  freshness must come from `Last-Modified`/ETag, not fetch time.
- **F10 — TDEC fishing advisories:** single 590 KB PDF behind the HTML page
  (`last-modified: 2026-08-25`, CDN `Age` ~19 d) — a D-grade periodic source; recipe in
  the registry. No machine-readable advisory feed found.
- **F11 — NWS pressure:** wired 10-station ASOS mapping verified `[lead — parent re-probe
  pending]` (subagent probing; parent spot-checks before final push).
- **F12 — Lakes have NO live temperature from any current wired source.** TVA reservoir
  monitors carry level+discharge only; USGS has no TN reservoir-elevation IV sites (no
  configured lake carries any temperature today). Depth-profile/DO sources investigated
  in the lake section.
- **F13 — Reservoir-representativeness rule holds:** tailwater sensors (USACE
  Temp-Water-**Tail**; TVA TailwaterElevation) measure the release stream, not the lake;
  forebay/mid-depth data exists only in periodic TVA/EPA sampling (lake section).
- **F14 — Coverage totals (source dimension):** 48/148 waters have a live flow-ish
  source; ~30/148 have any live temperature path; **100/148 have zero gauge wiring**, of
  which ~35 could plausibly gain a source (adjacent-station or new provider) and the rest
  are small ponds/urban creeks with **no defensible source** (per-water verdicts in the
  matrix).

## Source registry (stable IDs, operational recipes)

Existing `sourceId`s in `sources.ts` are contract identifiers (never rename); new IDs are
proposed here for the planner. All entries live-verified this window unless graded E/D.

### `usgs-nwis-iv` — A (flow/stage), B (temperature) · live-verified 23:49–23:59Z
- Endpoint: `https://waterservices.usgs.gov/nwis/iv/?format=json&sites={1-50 sites}&parameterCd=00060,00065,00010&period=P7D`
  (P7D — NOT PTxD; `PT2D` is rejected malformed, verified 23:50Z). Site catalog:
  `.../nwis/site/?format=rdb&sites={sites}&seriesCatalogOutput=true&hasDataTypeCd=iv`.
- Units: 00060 ft³/s, 00065 ft, 00010 °C; timestamps ISO-8601 with local-gauge UTC offset
  (TN = −05:00/−04:00 per site). Provisional qualifier `P` passes through — preserve.
- Sentinels/errors: `-999999` = missing; `Ice/Eqp/Ssn/Bkw/Flt` qualifiers = invalid;
  transient 503s node-level (`server=[caas01]` observed 23:51–23:55Z, cleared on retry);
  HTTP 400 carries the parse error in HTML. **Site absent from catalog → zero timeSeries
  in the IV response (silent)** — hence per-parameter health must come from the series
  catalog or non-empty-value checks, never from HTTP status alone.
- Freshness: 15–60 min; validation: reject value ≤ 0 for 00060 (F4), reject |z|>10σ
  jumps; fixture: today's `/tmp/usgs-iv-{a,b}.json` shapes; monitoring: series-catalog
  diff monthly + per-run empty-series warning.
- License: USGS public domain; etiquette: identify client, ≤50 sites/batch (per docs and
  the repo's own notes).
- **Modernization exposure: see §USGS-modernization.**

### `tva-restapi` — B · live-verified 23:58–00:01Z (parent) + catalog enumeration `[lead — re-probe pending]`
- Observed: `GET https://www.tva.com/RestApi/observed-data/{LocationID}` — headers
  REQUIRED: browser User-Agent + `Accept: application/json` (else 20 KB HTML snapshot,
  F6). Returns array of hourly rows
  `{Day:"09/13/2026", Time:"Noon EDT", ReservoirElevation:"1,011.57", TailwaterElevation:"821.58", AverageHourlyDischarge:"20"}`
  — thousands-comma strings; per-dam US-Eastern tz label embedded in `Time` (also
  "Noon"/"Midnight" words). **No temperature.** `cache-control: private`, Cloudflare
  dynamic (not edge-cached). Unknown id → 404.
- **NEW `generation-releases/{LocationID}`** (verified NRST1, CEHT1 @ 00:06:44Z): array of
  `{Day, Time:"1 AM - 5 AM EDT", Generators:"0|1|2 or more"}` for today+tomorrow — the
  official release schedule as JSON; per-dam CDT/EDT; CEHT1 returned only 6 blocks (full
  day), NRST1 15+ blocks. Cadence: TVA posts daily (late-afternoon for next day is their
  published behavior — not verifiable from one probe).
- **NEW `predicted-data/{LocationID}`** (verified via NRST1 payload): array
  `{Day, AverageInflow:"572", MidnightElevation:1011.49, AverageOutflow:"1,962"}` ~3 days
  forward; note mixed string/number typing.
- Also exists (probe returned non-empty `[]`/404-shaped bodies; value varies by dam):
  `rainfall/{id}`, `stream-flows/{id}`, `operating-guides/{id}` — `[lead — parent
  re-probe pending]`, do not build on these until re-verified.
- License: public information, undocumented API; etiquette: browser UA, 1 station per
  30–60 min; fixture: NRST1 JSON (comma-stripping test); monitoring: content-type!=json →
  challenge migration alarm.

### `usace-a2w` — A− (B+ for temp) · live-verified 23:58–23:59Z, all 12 TSIDs
- Endpoint: `GET https://water.usace.army.mil/cda/reporting/providers/lrn/timeseries?name={TSID}&begin={ISO-Z}&end={ISO-Z}`;
  headers: any UA + `Accept: application/json`; no auth; no CORS (server-side only).
- TSID scheme (hardcoded, never runtime-discovered):
  `{STATION}-{DAM}.Flow.Ave.1Hour.1Hour.man-rev` (cfs, hourly),
  `{STATION}-{DAM}.Elev-Tail.Inst.30Minutes.0.dcp-rev` (ft, NGVD29),
  `{STATION}-{DAM}.Temp-Water-Tail.Inst.30Minutes.0.dcp-rev` (°F, 30-min).
  Stations: CETT1-CENTER_HILL, DHTT1-DALE_HOLLOW, JPPT1-J_PERCY_PRIEST,
  CORT1-CORDELL_HULL. **Tailwater temp is the release stream (F13)** — coldest,
  best-oxygenated water; not lake-representative.
- Response: `{"key","parameter","unit","unit_long_name","vertical_datum","values":[[ISO-Z,number],...]}`
  — clean typing, UTC ISO-Z. Unknown TSID → HTTP 200 EMPTY body (a warning, not an
  error) — validation must be body-length, not status. Series lag up to ~7 h observed
  historically; today's window showed current-hour values.
- Missing from `sources.ts` registry — planner should add it (contract identifiers are
  stable; this is an additive registry entry, no rename).
- License: US Government public information; etiquette: 4 stations × 3 series, 1 fetch
  cycle/hour is ample. Fixture: today's 8 JSON files (flow+temp per dam).

### `nws-api` — A (pressure), `[precip lead pending]`
- `GET https://api.weather.gov/stations/{ICAO}/observations?limit=N`; User-Agent REQUIRED
  by NWS policy (no key). `barometricPressure` Pa; station elevation-independent
  processing already in `nws-provider.ts`. Region mapping: 12 catalog regions → KNQA,
  KBNA, KSYI, KMOR, KCSV (×2 regions), KTRI (×2), KTYS, KGKT, KMRN, KCHA.
- License: US public domain; API policy requires declared UA; cadence: hourly METAR
  (some 5-min). Parent spot re-probe of ≥3 stations before final push.

### `twra-stockings` / `twra-recent-stockings` — D (periodic by nature) · re-verified 00:06Z
- Page `https://www.tn.gov/twra/fishing/trout-information-stockings.html`; discovery
  regex over `data-config='...{"ajax":"<path>.exceldriven.json"}'`; resolve against
  tn.gov; NEVER hardcode the `tn_complex_datatable_{hash}` segment (changes on CMS
  redeploys). Verified live today: scheduled grid 616 rows
  (`REGION,COUNTY,LOCATION,TYPE,STOCKING DAY,STOCKING WEEK,STOCKING MONTHS,SPECIES`),
  recent grid 13 rows (`Destination Region,Destination,Stocking Date`). robots: allow
  all. CDN `Age` up to days — trust `Last-Modified`/ETag (scheduled JSON
  `last-modified: 2026-09-10T13:44:51Z` observed). "TBD 12/2026"-style prose dates +
  TWRA's own typos ("Caroll") must pass through unmangled.
- Schedules remain plans (`scheduled` ≠ completed); recent report is a ~12-row rolling
  window with no archive.

### `tdec-advisories` — D · verified 23:56Z (subagent) + page structure `[lead pending parent]`
- HTML page → one PDF (`/content/dam/tn/environment/water/watershed-planning/wr_wq_fish-advisories.pdf`,
  590,047 B, `last-modified: 2026-08-25`, CDN `Age` ~19 d). Recipe: GET page, extract
  href, HEAD for ETag/Last-Modified change, download + text-extract + diff. Months-scale
  cadence; weekly check is generous. Provides "do not eat"/precautionary advisories —
  a *safety overlay*, not a scored metric.

### `usace-cwms` — E (dead) · HTTP 500 on catalog query 00:00:13Z; 501 on 2026-09-04
- `https://cwms-data.usace.army.mil/cwms-data/...` — unusable; keep unwired; recheck
  quarterly.

### `usace-lrn-web` / `rivergages` — E (TLS-broken host-side) — F8; never bypass with `-k`.

### `usgs-nwis-iv` state scan (TN-wide, for candidate expansion) — `[lead — parent re-probe
pending]`: statewide queries for 62614/63158 (elevation), 00300 (DO) were requested of
the federal-gauges subagent; parent will re-probe before asserting in the lake section.

(Per-water matrix, lake findings, modernization, scrape recipes, and the do-not-implement
register land in the next commits.)

## Verification summary

Parent-run live probes this window (all curl, identified UA):
| Probe | UTC | Result |
|---|---|---|
| USGS series catalog, 50 sites (`seriesCatalogOutput=true`) | 23:49:27Z | 200; 38 sites present, 12 absent |
| USGS IV batch A (18 sites × 00060/65/10, P7D) | 23:51:23Z | 200; per-site×param values parsed |
| USGS IV batch B (17 sites) | 23:59:58Z | 200 (after 4× 503 on `caas01`) |
| TVA observed-data NRST1/CEHT1/WL (Accept: json) | 23:58:27–32Z | 200 JSON ~1 KB each |
| TVA observed-data BOOT1/HADT1/OCAT1/NRMT1/KYDK2 (no Accept) | 00:00:01–11Z | 200 HTML ~20.7 KB each (F6 differential) |
| TVA generation-releases NRST1 + CEHT1 | 00:06:44/47Z | 200 JSON schedules today+tomorrow |
| USACE A2W 12 TSIDs (flow+temp × 4 dams) | 23:58:52–23:59:11Z | all 200, live values, units declared |
| USACE CWMS locations?office=NASHVILLE | 00:00:13Z | HTTP 500 "failed to process request" |
| TWRA exceldriven scheduled + recent grids | 00:06:12/15Z | 200; 616 rows / 13 rows |
| TDEC advisories page/PDF headers | 23:56Z | 200 (subagent, parent re-probe pending) |

## Inputs the implementation planner may treat as verified

(forthcoming — compiled at final push)

## Blockers

(forthcoming)
