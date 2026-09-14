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

## Per-water source/parameter coverage matrix (148 rows)

Legend: `Q`=discharge (cfs) · `S`=stage/elevation (ft) · `T`=water temperature · `level`=reservoir
elevation. Every "verified/live" claim is a parent-run probe stamped 2026-09-13T23:49Z–09-14T00:30Z;
values age — observation timestamps are in the station inventory. The matrix covers the SOURCE
dimension only; species/season applicability belongs to Session C. `— no defensible source found as
of 2026-09-14T00:30Z` is a finding, not a placeholder. Stocking (TWRA grids re-verified live 00:06Z)
is context per the 2026-09-04 coverage doc; alias-level re-verification was out of window scope.

Verdict counts (source dimension): **LIVE flow+temp 10 · PARTIAL (flow/stage, no live temp) 26 ·
LEVEL-only (lake) 15 · NO GAUGE WIRING 97.** NWS area pressure (region-level, never per-water)
applies to every row via the region mapping and is omitted per-row. Release-schedule column shows
the NEW verified TVA `generation-releases/{id}` capability for TVA dams + Barkley + Cordell Hull
(COHT1); USACE Nashville dams have no reachable public schedule (CWMS 500, lrn web TLS-broken).

| waterId | type | flow/stage | temperature | level | release schedule | source verdict | notes |
|---|---|---|---|---|---|---|---|
| `barren-fork-river` | river | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `beaverdam-creek` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `beech-lake` | lake | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `big-rock-creek` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `boiling-fork-creek` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `boone-lake` | lake | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING | USGS 03486810: DEAD (ABSENT) |
| `boone-tailwater` | tailrace | TVA BOOT1: Q hourly | — none as of 2026-09-14T00:30Z | — | TVA gen-releases/BOOT1 verified (Generators, today+tomorrow) | PARTIAL (flow/stage, no live temp) | USGS 03486810: DEAD (ABSENT) TVA BOOT1: stage/discharge only, no tailwater temperature |
| `bradley-creek` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `brush-creek-cocke` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `buffalo-creek-grainger` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `buffalo-river` | river | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `calderwood-lake` | lake | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `calfkiller-river` | river | USGS 03419530: Q+S (no temp series) | — none as of 2026-09-14T00:30Z | — | — | PARTIAL (flow/stage, no live temp) |  |
| `cameron-brown-lake` | lake | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `cane-creek` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `caney-fork-river` | tailrace | USGS 03424860: Q+S (no temp series; 00045 precip live); TVA CEHT1: Q hourly; USACE CETT1: Q hourly (A2W live to 23:30Z) | USACE CETT1: tailwater T 30-min (A2W live to 23:30Z) | — | TVA gen-releases/CEHT1 verified (Generators, today+tomorrow) | LIVE flow+temp | USGS 03424010: DEAD (ABSENT from IV catalog) TVA CEHT1: stage/discharge only, no tailwater temperature repo Elev-Tail TSIDs ALSO live (CETT1/DHTT1 47 vals to 23:30Z; JPPT1 30-min variant to 23:00Z) though absent from the /locations catalog listing |
| `caney-fork-upper` | river | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `center-hill-lake` | lake | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | TVA CEHT1: level+Q hourly (rows to 09-13 PM) | TVA gen-releases/CEHT1 verified | LEVEL only (lake) | NO lake temperature from TVA monitor |
| `charles-creek` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `cherokee-lake` | lake | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | TVA CRKT1: level+Q hourly (rows to 09-13 PM) | — | LEVEL only (lake) | NO lake temperature from TVA monitor |
| `chickamauga-lake` | lake | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | TVA CKDT1: level+Q hourly (rows to 09-13 PM) | — | LEVEL only (lake) | NO lake temperature from TVA monitor |
| `chilhowee-lake` | lake | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `citico-creek` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `clear-creek-obed` | creek | USGS 03539778: Q+S+T@09-10 (temp/DO last 2026-09-10) | USGS 03539778: T@09-10 | — | — | LIVE flow+temp |  |
| `clear-fork` | creek | USGS 03409500: Q+S+T | USGS 03409500: T | — | — | LIVE flow+temp |  |
| `clinch-river` | tailrace | TVA NRST1: Q hourly | — none as of 2026-09-14T00:30Z | — | TVA gen-releases/NRST1 verified (Generators, today+tomorrow) | PARTIAL (flow/stage, no live temp) | USGS 03533000: DEAD (ABSENT) TVA NRST1: stage/discharge only, no tailwater temperature |
| `collins-river` | river | USGS 03421000: Q+S (temp dead 2005; 00045 precip live) | — none as of 2026-09-14T00:30Z | — | — | PARTIAL (flow/stage, no live temp) |  |
| `cosby-creek` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `covington-fbc-pond` | pond | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `cumberland-river` | river | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING | USACE CORT1 flow+tail-T+DO live (A2W 23:30Z) but USACE-id scope: Cordell Hull TW, upstream of this reach; TVA knows this dam as COHT1 (CORT1 returns [] on TVA endpoints) VERIFIED CANDIDATES for reach coverage: USACE ASHT1-CHEATHAM TW flow+tail-elev (A2W catalog 00:14Z, 15-min); TVA COHT1 Cordell Hull level+Q+gen-schedule+forecast (00:16Z; TVA id COHT1, not CORT1); USGS 03418420 Cumberland below Cordell Hull T+S+DO (00:17Z) is UPSTREAM of this reach; Nashville-pool DO: 03431091/03431514 (00:17Z); 03430200 Stones@Donelson T is a tributary-mouth proxy. No reach-representative live temperature in the mainstem pool itself. |
| `daddys-creek` | creek | USGS 03539600: Q+S+T (DO 9.2 live) | USGS 03539600: T | — | — | LIVE flow+temp |  |
| `dale-hollow-lake` | lake | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | TVA DLHT1: level+Q hourly (rows to 09-13 PM) | TVA gen-releases/DLHT1 verified | LEVEL only (lake) | NO lake temperature from TVA monitor |
| `doe-creek-johnson` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `doe-river` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING | USGS 03485500: S (stage only; Q invalid all week (P,Rat); temp dead 1988) |
| `douglas-lake` | lake | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | TVA DUGT1: level+Q hourly (rows to 09-13 PM) | — | LEVEL only (lake) | USGS 03468510: DEAD (ABSENT) NO lake temperature from TVA monitor |
| `duck-river-lower` | river | USGS 03597860: Q+S (temp dead 2012); USGS 03598000: Q+S (temp dead 2009); USGS 03599500: Q+S (temp dead 2005) | — none as of 2026-09-14T00:30Z | — | — | PARTIAL (flow/stage, no live temp) | USACE CLAT1 (Cumberland at Celina) is a DIFFERENT basin — not a Duck source; no new candidates verified. |
| `duck-river-tailwater` | tailrace | USGS 03597860: Q+S (temp dead 2012); TVA NRMT1: Q hourly | — none as of 2026-09-14T00:30Z | — | TVA gen-releases/NRMT1 verified (Generators, today+tomorrow) | PARTIAL (flow/stage, no live temp) | TVA NRMT1: stage/discharge only, no tailwater temperature |
| `east-fork-shoal-creek` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `east-fork-stones-river` | river | USGS 03427500: Q+S (temp dead 2005; 00045 precip live) | — none as of 2026-09-14T00:30Z | — | — | PARTIAL (flow/stage, no live temp) |  |
| `edmund-orgill-lake` | lake | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `elk-river-lower` | river | USGS 03584600: Q+S (temp dead 2020-10) | — none as of 2026-09-14T00:30Z | — | — | PARTIAL (flow/stage, no live temp) |  |
| `elk-river` | tailrace | USGS 03578000: Q+S (temp dead 2005; 00045 precip live); TVA TMFT1: Q hourly | — none as of 2026-09-14T00:30Z | — | TVA gen-releases/TMFT1 verified (Generators, today+tomorrow) | PARTIAL (flow/stage, no live temp) | USGS 03580750: DEAD (ABSENT) TVA TMFT1: stage/discharge only, no tailwater temperature |
| `emory-river` | river | USGS 03540500: Q+S (temp dead 2007) | — none as of 2026-09-14T00:30Z | — | — | PARTIAL (flow/stage, no live temp) |  |
| `fletchers-fork` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `forge-creek-johnson` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `fort-loudoun-lake` | lake | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | TVA FLDT1: level+Q hourly (rows to 09-13 PM) | — | LEVEL only (lake) | NO lake temperature from TVA monitor |
| `fort-patrick-henry-lake` | lake | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING | USGS 03487010: DEAD (ABSENT) |
| `french-broad-river` | tailrace | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING | USGS 03468510: DEAD (ABSENT) USGS 03469000: DEAD (ABSENT) |
| `ft-patrick-henry-tailwater` | tailrace | TVA FPHT1: Q hourly | — none as of 2026-09-14T00:30Z | — | TVA gen-releases/FPHT1 verified (Generators, today+tomorrow) | PARTIAL (flow/stage, no live temp) | USGS 03487010: DEAD (ABSENT) TVA FPHT1: stage/discharge only, no tailwater temperature |
| `gap-creek-claiborne` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `goforth-creek` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `greasy-creek-polk` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `great-falls-lake` | lake | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `gulf-fork-big-creek` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `harpeth-river` | river | USGS 03432350: Q+S (temp dead 2014-10; 00045 precip live); USGS 03433500: Q+S+T (DO 7.9 live; 00045 precip live) | USGS 03433500: T | — | — | LIVE flow+temp | DO chain live on the Harpeth: 03433500 7.9, 034324146 7.2, 0343233905 7.8, 03432100 1.2 mg/L (hypolimnetic-release stress signal) @ 00:17Z. |
| `hatchie-river` | river | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `hiwassee-river` | tailrace | TVA HADT1: Q hourly | USGS 03556590: T | — | TVA gen-releases/HADT1 verified (Generators, today+tomorrow) | LIVE flow+temp | USGS 03566000: DEAD (historical-only (2018)) TVA HADT1: stage/discharge only, no tailwater temperature |
| `holston-river` | river | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `horse-creek-greene` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `hurricane-creek` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `indian-creek-claiborne` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `j-percy-priest-lake` | lake | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | TVA JPHT1: level+Q hourly (rows to 09-13 PM) | — | LEVEL only (lake) | NO lake temperature from TVA monitor |
| `johnson-park-lake` | lake | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `kentucky-lake` | lake | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | TVA KYDK2: level+Q hourly (rows to 09-13 PM) | — | LEVEL only (lake) | NO lake temperature from TVA monitor |
| `lake-barkley` | lake | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | TVA BARK2: level+Q hourly (rows to 09-13 PM) | TVA gen-releases/BARK2 verified | LEVEL only (lake) | NO lake temperature from TVA monitor |
| `lake-graham` | lake | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `laurel-creek-johnson` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `laurel-fork-carter` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `leconte-creek` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `little-buffalo-river` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `little-pigeon-river` | river | USGS 03470000: Q+S (temp dead 1988) | — none as of 2026-09-14T00:30Z | — | — | PARTIAL (flow/stage, no live temp) |  |
| `little-river` | creek | USGS 03497300: Q+S+T; USGS 03498500: Q+S (temp dead 2007) | USGS 03497300: T | — | — | LIVE flow+temp |  |
| `little-sequatchie-river` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `little-tennessee-river` | river | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `little-west-fork-creek` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `martin-city-pond` | pond | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `mccutcheon-creek` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `melton-hill-lake` | lake | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `middle-prong-little-pigeon` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `milan-city-pond` | pond | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `mill-creek-overton` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `mississippi-river` | river | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `mossy-creek-jefferson` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `new-river` | river | USGS 03408500: Q+S+T | USGS 03408500: T | — | — | LIVE flow+temp |  |
| `nickajack-lake` | lake | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `nolichucky-river` | river | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING | USGS 03465500: S (stage only; Q invalid all week (P,Rat -999999)) |
| `normandy-lake` | lake | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `norris-lake` | lake | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | TVA NRST1: level+Q hourly (rows to 09-13 PM) | TVA gen-releases/NRST1 verified | LEVEL only (lake) | USGS 03533000: DEAD (ABSENT) NO lake temperature from TVA monitor |
| `north-chickamauga-creek` | creek | USGS 03566535: Q+S (temp dead 2002; Q read 0.00 09-13; 00045 precip live) | — none as of 2026-09-14T00:30Z | — | — | PARTIAL (flow/stage, no live temp) |  |
| `north-fork-holston-river` | river | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `north-prong-barren-fork` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `obed-river` | river | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING | USGS 03539800: DEAD (died 2026-08 (flow 08-22, stage 07-26)) VERIFIED CANDIDATE: USGS 03538830 Obed R at Adams Bridge — Q+S+T+DO all live (00:17Z), upper-Obed reach; replaces dead 03539800 with spatial qualification (headwaters side, ~20 river-mi upstream of theEmory junction). |
| `obey-river` | tailrace | TVA DLHT1: Q hourly; USACE DHTT1: Q hourly (A2W live to 23:30Z) | USACE DHTT1: tailwater T 30-min (A2W live to 23:30Z) | — | TVA gen-releases/DLHT1 verified (Generators, today+tomorrow) | LIVE flow+temp | USGS 03417000: DEAD (ABSENT from IV catalog) TVA DLHT1: stage/discharge only, no tailwater temperature repo Elev-Tail TSIDs ALSO live (CETT1/DHTT1 47 vals to 23:30Z; JPPT1 30-min variant to 23:00Z) though absent from the /locations catalog listing |
| `obion-river` | river | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `ocoee-number-three-lake` | lake | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `ocoee-river` | river | USGS 03559500: Q+S (temp dead 1965); TVA OCBT1: Q hourly | — none as of 2026-09-14T00:30Z | — | TVA gen-releases/OCBT1 verified (Generators, today+tomorrow) | PARTIAL (flow/stage, no live temp) | TVA OCBT1: stage/discharge only, no tailwater temperature |
| `old-hickory-lake` | lake | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | TVA OHHT1: level+Q hourly (rows to 09-13 PM) | — | LEVEL only (lake) | NO lake temperature from TVA monitor |
| `paris-city-park-lake` | lake | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `parksville-lake` | lake | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING | USGS 03564500: DEAD (historical-only (1994)) |
| `parksville-tailwater` | tailrace | TVA OCAT1: Q hourly | — none as of 2026-09-14T00:30Z | — | TVA gen-releases/OCAT1 verified (Generators, today+tomorrow) | PARTIAL (flow/stage, no live temp) | USGS 03564500: DEAD (historical-only (1994)) TVA OCAT1: stage/discharge only, no tailwater temperature |
| `pickwick-lake` | lake | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | TVA PICT1: level+Q hourly (rows to 09-13 PM) | — | LEVEL only (lake) | NO lake temperature from TVA monitor |
| `pigeon-river` | river | USGS 03461500: Q+S (temp dead 2007) | — none as of 2026-09-14T00:30Z | — | — | PARTIAL (flow/stage, no live temp) |  |
| `pine-creek-dekalb` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `piney-river-rhea` | river | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `powell-river` | river | USGS 03532000: Q+S (temp dead 2007; 00045 precip live) | — none as of 2026-09-14T00:30Z | — | — | PARTIAL (flow/stage, no live temp) |  |
| `puncheon-camp-creek` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `red-river-clarksville` | river | USGS 03436100: Q+S (temp dead 2005; 00045 precip live) | — none as of 2026-09-14T00:30Z | — | — | PARTIAL (flow/stage, no live temp) |  |
| `reedy-creek` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING | USGS 03487602: DEAD (ABSENT) |
| `reelfoot-lake` | lake | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `richardson-byrd-creek` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `roaring-fork` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `rocky-river` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `salt-lick-creek` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `sequatchie-river` | river | USGS 03571000: Q+S (temp dead 2005) | — none as of 2026-09-14T00:30Z | — | — | PARTIAL (flow/stage, no live temp) |  |
| `shelby-farms-lake` | lake | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `shoal-creek` | river | USGS 03588500: Q+S (temp dead 2005) | — none as of 2026-09-14T00:30Z | — | — | PARTIAL (flow/stage, no live temp) |  |
| `sinking-creek-wilson` | spring | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `south-fork-cumberland` | river | USGS 03410210: Q+S (temp dead 2017) | — none as of 2026-09-14T00:30Z | — | — | PARTIAL (flow/stage, no live temp) |  |
| `south-holston-lake` | lake | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | TVA SHDT1: level+Q hourly (rows to 09-13 PM) | TVA gen-releases/SHDT1 verified | LEVEL only (lake) | USGS 03476500: DEAD (ABSENT) NO lake temperature from TVA monitor |
| `south-holston-river` | tailrace | TVA SHDT1: Q hourly | — none as of 2026-09-14T00:30Z | — | TVA gen-releases/SHDT1 verified (Generators, today+tomorrow) | PARTIAL (flow/stage, no live temp) | USGS 03476500: DEAD (ABSENT) TVA SHDT1: stage/discharge only, no tailwater temperature |
| `spring-creek-polk` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `standing-rock-creek` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `station-creek` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `stones-river` | river | USGS 03430200: Q INVALID(-168)+S+T (Q=-168 cfs invalid 09-13; DO 6.0 live); USACE JPPT1: Q hourly (A2W live to 23:30Z) | USGS 03430200: T; USACE JPPT1: tailwater T 30-min (A2W live to 23:30Z) | — | — | LIVE flow+temp | F4 negative-discharge guard needed repo Elev-Tail TSIDs ALSO live (CETT1/DHTT1 47 vals to 23:30Z; JPPT1 30-min variant to 23:00Z) though absent from the /locations catalog listing |
| `stoney-creek-carter` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `sulfur-fork-creek` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `tellico-lake` | lake | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `tellico-river` | river | USGS 03518500: Q+S (temp dead 2004) | — none as of 2026-09-14T00:30Z | — | — | PARTIAL (flow/stage, no live temp) |  |
| `tennessee-river` | river | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `tims-ford-lake` | lake | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | TVA TMFT1: level+Q hourly (rows to 09-13 PM) | TVA gen-releases/TMFT1 verified | LEVEL only (lake) | NO lake temperature from TVA monitor |
| `trail-fork-big-creek` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `tumbling-creek` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `union-city-reelfoot-pond` | pond | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `upper-hills-creek` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `upper-roan-creek` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `valentine-park-pond` | pond | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `watauga-lake` | lake | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `watauga-river-wilbur-reach` | river | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `watauga-river` | tailrace | USGS 03486000: Q+S (temp dead 1981); TVA WL: Q hourly | — none as of 2026-09-14T00:30Z | — | TVA gen-releases/WL verified (Generators, today+tomorrow) | PARTIAL (flow/stage, no live temp) | USGS 03483980: DEAD (ABSENT) USGS 03484000: DEAD (ABSENT) TVA WL: stage/discharge only, no tailwater temperature |
| `watts-bar-lake` | lake | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | TVA WBOT1: level+Q hourly (rows to 09-13 PM) | — | LEVEL only (lake) | NO lake temperature from TVA monitor |
| `west-fork-stones-river` | river | USGS 03428200: Q+S (temp dead 2013) | — none as of 2026-09-14T00:30Z | — | — | PARTIAL (flow/stage, no live temp) |  |
| `west-prong-little-pigeon` | creek | USGS 03469251: Q+S (no temp series) | — none as of 2026-09-14T00:30Z | — | — | PARTIAL (flow/stage, no live temp) |  |
| `white-oak-creek` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `wilbur-lake` | lake | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING | USGS 03484000: DEAD (ABSENT) USGS 03483980: DEAD (ABSENT) |
| `wolf-river-fentress` | creek | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `wolf-river-west-tennessee` | river | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING | VERIFIED CANDIDATE: USGS 07031650 Wolf R at Germantown Q+S live (00:17Z); 07030600 near Collierville stage-only. Basin DO/precip sites also live (07032200 Nonconnah Q+S). |
| `woods-reservoir` | lake | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |
| `yale-road-park-lake` | lake | — no defensible source found as of 2026-09-14T00:30Z | — none as of 2026-09-14T00:30Z | — | — | NO GAUGE WIRING |  |

VERDICT COUNTS: {'NO GAUGE WIRING': 97, 'PARTIAL (flow/stage, no live temp)': 26, 'LIVE flow+temp': 10, 'LEVEL only (lake)': 15}

## Station inventory (provider-keyed, parent-verified timestamps)

### USGS NWIS — 50 configured site numbers

Live columns as of the 23:49:27Z series catalog + 23:51/23:59Z value batches (times are gauge-local
US/Central or US/Eastern as returned; all values provisional `P`):

- **Live Q+S+T (5):** 03408500 New R (17.7 cfs/1.81 ft/26.5 °C @19:30), 03409500 Clear Fork
  (8.60/1.22/27.4 @19:30), 03430200 Stones@Donelson (Q **−168 INVALID**, 3.40 ft, 27.9 °C @18:00–18:30),
  03433500 Harpeth@Bellevue (37.8/1.14/29.7 @18:30), 03497300 Little R@Townsend (102/1.60/22.1 @18:45),
  03539600 Daddys Cr (4.02/0.85/25.8 @18:00). **(6 sites — incl. the anomalous 03430200.)**
- **Live T only (2):** 03556590 Hiwassee@Reliance (21.5 @19:15); 03539778 Clear Creek@Lilly Bridge
  (Q+S live 4.37/3.77 @19:45; T + DO last 2026-09-10T22:00 — 70 h stale).
- **Live Q+S, no T (24):** 03410210 (80.0/4.46), 03419530 (29.9/3.87), 03421000 (116/1.55),
  03424860 (351/6.07), 03427500 (19.9/2.85), 03428200 (48.2/2.42), 03432350 (9.14/3.86),
  03436100 (212/4.38), 03461500 (242/2.84), 03469251 (24.7/2.77), 03470000 (146/1.61),
  03486000 (378/2.99), 03498500 (186/5.65), 03518500 (77.3/0.84), 03532000 (266/2.39),
  03540500 (24.2/1.67), 03559500 (259/2.50), 03566535 (0.00/0.99 — zero-flow reading; verify sensor),
  03571000 (74.0/0.78), 03578000 (12.6/1.64), 03584600 (340/0.79), 03588500 (99.6/1.75),
  03597860 (178/10.11 — stage suspect vs neighbors), 03598000 (167/2.60), 03599500 (151/1.39).
- **S only, Q invalid all week (2):** 03465500 Nolichucky@Embreeville (1.10 ft; 00060 `P,Rat`
  −999999 ×671), 03485500 Doe R@Elizabethton (1.38 ft; same failure mode ×670).
- **Dormant/dying (1):** 03539800 Obed@Lancing — last flow 2026-08-22, last stage 2026-07-26.
- **Historical-only (2):** 03564500 (→1994-12-31), 03566000 (→2018-06-05).
- **Absent from the IV catalog (12):** 03417000, 03424010, 03468510, 03469000, 03476500, 03483980,
  03484000, 03486810, 03487010, 03487602, 03533000, 03580750 (all exist as USGS sites; the dam
  tailwaters among them are TVA/USACE-published instead).
- **DO (00300) live at 6 configured sites:** 03408500 6.3, 03409500 6.1, 03430200 6.0,
  03433500 7.9, 03539600 9.2, 03539778 8.1(09-10) mg/L. Statewide: 14 sites with values in 2 d
  (00:17Z scan) incl. 03418420 Cumberland below Cordell Hull 7.1, Harpeth chain (03432100 reads
  **1.2 mg/L** — hypolimnetic-release stress), 03538830 Obed@Adams Br 7.2.
- **Precip (00045) live at 44 TN sites** incl. 9 configured gauges (03421000, 03424860, 03427500,
  03432350, 03433500, 03436100, 03532000, 03566535, 03578000) — a per-water rain signal already on
  wired gauges; unused by the pipeline.
- Coordinates/reach mapping: see `officialSources` per YAML; no mislocations found vs names.

### TVA `RestApi` — 22 configured location IDs + catalog

- Catalog `GET /RestApi/locations` → **43 locations**, fields LocationID/Name/Lat/Long/River/
  Ownership/DamType/TopOfGatesFt/RiverMile (00:16:21Z, parent-verified). **Ownership=Cumberland
  (USACE projects): BARK2, CEHT1, CHPT1 (Cheatham), COHT1 (Cordell Hull), DLHT1, JPHT1, OHHT1,
  WLCK2 (Wolf Creek).** Note the TVA/USACE ID-space mismatch: TVA COHT1 = USACE CORT1;
  TVA CHPT1 = USACE ASHT1.
- All 22 configured IDs observed 00:00–00:16Z, HTTP 200, ~8 hourly rows each (rolling window
  ~noon→7 PM local), fields exactly {Day, Time ("7 PM EDT"/"6 PM CDT"), ReservoirElevation,
  TailwaterElevation, AverageHourlyDischarge} — **no temperature anywhere in the union of fields
  across all 43 locations**. Samples (last row, ft / ft / cfs): NRST1 1,011.54/827.15/6,724;
  CRKT1 1,060.22/927.71/11,124; DUGT1 983.19/876.63/18,089; WBOT1 740.78/682.60/25,405;
  FLDT1 812.71/741.84/20,165; CKDT1 681.93/636.55/31,988; OHHT1 444.79/388.75/12,800;
  JPHT1 489.85/387.15/30; TMFT1 887.61/743.60/245; CEHT1 633.69/475.89/250; DLHT1 641.61/513.61/3,405;
  KYDK2 355.93/303.70/34,147; BARK2 356.10/303.10/15,700; SHDT1 1,721.89/1,488.98/2,224;
  PICT1 413.57/360.40/45,137; WL 1,644.82/1,585.78/1,675; BOOT1 1,380.13/1,264.75/6,879;
  FPHT1 1,261.21/1,195.84/6,696; HADT1 1,278.34/841.07/2,882; OCBT1 1,098.16/842.78/1,657;
  OCAT1 827.93/715.90/1,288; NRMT1 872.46/789.99/166.
- `generation-releases/{id}` verified (parent) for NRST1, CEHT1, BARK2, COHT1 00:06–00:16Z:
  today+tomorrow generator blocks ("1 AM - 5 AM EDT" / "Generators":"0|1|2 or more"); per-dam
  CDT/EDT. Empty `[]` observed for at least one location (NRMT1 in the parallel probe set) —
  empty schedule is a valid state for some dams.
- `predicted-data/{id}` verified (parent) NRST1 + COHT1: ~3 daily rows {Day, AverageInflow,
  MidnightElevation (number), AverageOutflow (comma-string)} — a forecast surface the pipeline
  has never had.

### USACE A2W (`water.usace.army.mil/cda/reporting/providers/lrn`)

- Discovery (parent-verified 00:14:04Z): `GET .../providers/lrn/locations` → **92 locations**
  (81 SITE + 11 PROJECT) with slug/kind/state/public_name/nidid and a `timeseries[]` array
  (tsid/unit/latest_value/latest_time). **Caveat: the catalog under-reports** — it omits live
  series that still serve data (CETT1/DHTT1 Elev-Tail + Temp-Water are live to 23:30Z but absent
  from their catalog entries; JPPT1 lists the 1Hour man-rev elev but the 30-min dcp-rev variant
  also serves). Catalog = discovery aid, never the parameter-health source; per-series probes are.
- Configured stations, all 12 TSIDs live (23:58Z–00:16Z parent probes, last values 23:00–23:30Z):
  CETT1 Center Hill TW (Q 250; tail-elev 480.09; **T 54.12 °F**), DHTT1 Dale Hollow TW (Q 3,405;
  tail-elev 512.4; **T 52.68 °F**), JPPT1 JPP TW (Q 30; tail-elev 386.92/387.15 both TSID variants),
  CORT1 Cordell Hull TW (Q 16,680; tail-elev 449.88; T 70.63 °F; **DO 7.06 ppm**).
- Notable non-configured stations (parent-verified from catalog + probes): ASHT1 Cheatham TW
  (Q 6,700; tail-elev 356.99 15-min; no temp), CLAT1 Cumberland@Celina (Q 7,413.67; stage 15.45;
  **T 64.13 °F; DO 8.15 ppm; precip bucket**), 03418420 (USGS) Cumberland below Cordell Hull
  (T 21.5 °C/S 449.76/DO 7.1 @18:30).
- LRN parameter census (catalog): Flow 52, Elev 48, Precip 49, Stage 23, Stor 12, Energy 8,
  Conc/DO 2 (CORT1, CLAT1), Temp-Water 2 (CORT1, CLAT1). cwms-data: locations 500, timeseries 501,
  catalog 200-but-empty — dead family, keep unwired.

### NWS api.weather.gov — 10 wired ASOS stations

Parent spot-verified 00:16:23–25Z (KBNA, KTYS): observations current (00:05Z), pressure
`barometricPressure` Pa QC-flagged; **KTYS publishes null pressure (qualityControl `Z`)** —
the region mapping should not assume all 10 stations yield values; KNQA observed 2 h stale in the
parallel probe set. Precip fields: `precipitationLastHour/3Hours/6Hours` (mm) — presence varies
per station; `precipitationLast3Hours` is the consistently present key (values null on the dry
probe day). Forecast path requires following `properties.forecast` from `/points/...` (direct
`/points/../forecast` 404s). Public domain, UA required, no key.

## USGS modernization / migration risk (verified against official USGS pages)

- Official blog, fetched 00:16:47Z: <https://waterdata.usgs.gov/blog/api-waterservices-decom/> —
  "**WaterServices will be decommissioned in the first quarter of 2027**"; decommission process
  "may include intentional service degradation and blackouts, in the second half of 2026. We will
  not begin any intentional degradation of these services before August 2026."
- Replacement: modernized Water Data APIs at `api.waterdata.usgs.gov` (OGC-API-style), e.g.
  `.../ogcapi/v0/collections/continuous` and `/latest-continuous`; migration guide
  <https://api.waterdata.usgs.gov/docs/ogcapi/migration/> (sites → `monitoring_location_id`
  `USGS-03518500` form; `variableCode` → `parameter_code`; `P/A` → `approval_status`; one feature
  per observation; UTC timestamps; **API key required beyond a few queries per hour**, signup at
  api.waterdata.usgs.gov/signup). Support: gs-w_waterdata_support@usgs.gov.
- **At risk:** every `waterservices.usgs.gov` call in `apps/api` (IV fetcher, site catalog,
  state scans) — the app's largest data surface. Degradation (timeouts/blackouts) may begin at any
  time from Aug 2026; hard end Q1 2027. The observed 503s (`caas01`, 23:51–23:55Z) are a taste of
  the retry discipline the migration will demand. TVA/USACE A2W/NWS are unaffected by THIS change.
- Planner implication: the Q1-2027 migration is a **flagged, scheduled rewire of `usgs-provider.ts`
  + `ingest/usgs.ts`** (new client, key management, per-observation parsing, UTC) — start before
  blackouts begin; keep fixtures dual-shaped.


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

## Lake-specific findings (stillwater source dimension)

**Wired lakes today (15):** norris, cherokee, douglas, watts-bar, fort-loudoun, chickamauga,
old-hickory, j-percy-priest, tims-ford, center-hill, dale-hollow, kentucky, barkley, south-holston,
pickwick — every one carries **only level + dam discharge** (TVA monitor; USACE-managed lakes
included via TVA's Cumberland ownership entries). Parent-verified rows to 2026-09-13 evening for
all 15.

1. **No live temperature exists for ANY wired lake.** TVA's observed-data field union (all 43
   locations, parent-verified) contains exactly {Day, Time, ReservoirElevation,
   TailwaterElevation, AverageHourlyDischarge} — no temp. No TN USGS site publishes reservoir
   elevation IV (62614/63158 statewide scan = 0 series, 00:17Z) or lake temp IV. Any lake
   "temperature score" today would be fabricated.
2. **Tailwater temperature ≠ lake temperature (F13).** The only live temperatures near dams are
   USACE Temp-Water-**Tail** series (CETT1 54.1 °F, DHTT1 52.7 °F, CORT1 70.6 °F @23:30Z) — the
   cold release stream, useful for the trout tailwater below the dam and useless as a lake-surface
   or lake-mean signal. Never let a tailwater temp back-fill a lake row.
3. **Depth profiles / stratification:** no continuous public depth-profile feed was found in this
   window for any TN reservoir (TVA's monitoring program publishes periodic reports; discrete
   profile data lands in EPA WQP — see below). Stratification state therefore can only be inferred
   (e.g., from season + release depth), which is Session C's science call; on the SOURCE dimension
   the honest entry is: **live=none; periodic/discrete=EPA WQP + agency reports; derived=only with
   explicit `derived` confidence labeling** per the F5 evidence culture.
4. **Forecasts (new):** TVA `predicted-data/{id}` (verified NRST1, COHT1) gives 3-day
   MidnightElevation + AverageOutflow + AverageInflow — the first forward-looking lake signal;
   BARK2 and all TVA dams respond. Note mixed string/number typing and no inflow for COHT1 day 1.
5. **USACE-managed lakes have a second path:** A2W Elev series (e.g., CORT1 tail-elev, CLAT1
   Elev) and ASHT1 tail elevation 15-min; Barkley (BARK2) also has TVA level. No USACE lake SURFACE
   elevation series was probed beyond these; the A2W `/locations` catalog lists Elev series per
   project — a bounded follow-up for the planner (catalog is discovery-unsafe, so per-series probes
   are required).
6. **Small/pond stillwaters (13 winter ponds + reference lakes):** no gauge, no sensor, no satellite
   product of usable cadence verified. Honest verdict: **no defensible source found as of
   2026-09-14T00:30Z** for flow/temp/level/DO; only TWRA stocking schedule (D-grade, verified) and
   NWS area pressure/precip context.
7. **DO for lakes:** only USACE tailwater DO (CORT1 7.06 ppm, CLAT1 8.15 ppm) and USGS river DO
   sites are live. Lake-zone DO (metalimnion/hypolimnion) has no live public feed in this window.
   A hypolimnetic-release *signal* is visible in river DO downstream of dams (Harpeth 03432100 at
   1.2 mg/L, Stones tributaries 4.6–5.5) — riverine evidence, not lake evidence.

## `Do not implement as fact` register

Sources/stations/claims that probes contradict, weaken, or cap — with the contradicting evidence:

| ID / claim | Verdict | Evidence (this window) |
|---|---|---|
| USGS 03465500 discharge (Nolichucky@Embreeville) | **DO NOT SCORE Q** | 00060 = −999999 `P,Rat` ×671/671 pts in 7 d (23:51Z batch); stage fine (1.10 ft @19:30) |
| USGS 03485500 discharge (Doe@Elizabethton) | **DO NOT SCORE Q** | same failure mode ×670/670; stage fine |
| USGS 03430200 discharge (Stones@Donelson) | **DO NOT SCORE Q** until validated | −168 cfs @18:00 (my probe); 557/669 pts negative in 7 d (parallel probe set); T 27.9 + S + DO 6.0 fine |
| USGS 03566535 Q=0.00 | verify before scoring | exactly 0.00 cfs with stage 0.99 @19:00 — could be true drought zero or stopped sensor |
| USGS 03539800 (Obed@Lancing, configured for obed-river) | DEAD | last flow 2026-08-22, stage 07-26; series defined, 0 values in 7 d |
| 12 absent-from-IV-catalog configured IDs (03417000 03424010 03468510 03469000 03476500 03483980 03484000 03486810 03487010 03487602 03533000 03580750) | keep wired-but-expect-nothing | absent from `seriesCatalogOutput` (23:49Z); all exist as USGS sites — tailwaters are published by TVA/USACE instead |
| USGS 03564500 / 03566000 | historical-only (1994 / 2018) | series catalog 23:49Z |
| USGS 03539778 temperature as "live" | STALE 70 h | last T/DO 2026-09-10T22:00 (23:59Z batch) — seasonal-station risk; Q+S current |
| "TVA provides temperature" (any doc implying it) | FALSE | field union across 43 locations, 00:16Z; no temp key |
| TVA `CORT1` id on TVA endpoints | WRONG ID SPACE | `observed-data/CORT1` + `generation-releases/CORT1` = `[]` (00:09Z); TVA catalog codes Cordell Hull as **COHT1** (all three endpoints 200, 00:16Z); USACE A2W uses CORT1 |
| USACE `cwms-data.usace.army.mil` | DEAD family | locations HTTP 500 (00:00:13Z, mine); timeseries 501 + catalog 200-empty (parallel set, 00:07Z) |
| `www.lrn.usace.army.mil` web + `rivergages.com` | TLS-broken host-side | curl(60) cert-SAN mismatch (parallel set 23:5xZ, consistent with 2026-09-08 note); rivergages serves `CN=*.turbifysites.com`. Never bypass with `-k` |
| KTYS as a working pressure station | WEAK | latest obs pressure null, qualityControl `Z` (00:16:25Z mine) |
| KNQA freshness | LAGGING | newest obs 22:50Z vs 23:50Z peers (parallel set) — 2 h lag normal for this station |
| NWS `precipQuantitative` / `precipLastHour` field names | WRONG NAMES | actual: `precipitationLastHour`, `precipitationLast3Hours`, `precipitationLast6Hours` (mm); 3-hour key most consistent (00:16Z mine + parallel set) |
| `api.weather.gov/points/{p}/forecast` direct | 404 | must follow `properties.forecast` link from the points response (parallel set 00:08–00:09Z) |
| USACE hyphen-guess TSIDs (`CETT1-Flow`, `CETT1-Elev`...) | SILENT EMPTY | HTTP 200, 0-byte bodies (parallel set 00:04Z) — body-length validation mandatory |
| A2W `/locations` catalog as parameter inventory | UNDER-REPORTS | omits live CETT1/DHTT1 Elev+Temp (mine, live to 23:30Z vs catalog absent) |
| docs/DATA-SOURCE-COVERAGE.md "51 catalog gauge ids" | OFF BY ONE | current tree: 50 numeric USGS ids (my recount) |
| duck-river-tailwater gauge 03596000 (old coverage doc) | NO LONGER WIRED | current YAML: 03597860 + tva:NRMT1 (grep: 03596000 only in docs/fixtures/geo files) |
| mill-creek-overton gauge evidence | CONFIRMS T3-50 | NWIS name for 03539778 = "Clear Creek at Lilly Bridge near Lancing" — not Mill Creek |
| USGS 03597860 stage 10.11 ft vs neighbor 03598000 2.60 ft | FLAG, don't fail | datum/shift difference plausible; needs a datum check before either is trusted as absolute stage |

## Strict coverage totals (source dimension) and highest-value gaps

**Totals (148 waters):** 10 LIVE flow+temp · 26 PARTIAL (flow/stage only) · 15 LEVEL-only lakes ·
97 NO GAUGE WIRING. All 15 wired lakes have level+dam-Q; 0 have any temperature. Release schedules
(new, verified): 11 TVA-dam tailwaters + Barkley + Cordell Hull (COHT1) have official generator
schedules; USACE Nashville dams (Center Hill, Dale Hollow, JPP) have NO reachable schedule source
(A2W has no schedule series; CWMS dead; lrn web TLS-broken) — for a wade-safety product this is
the single sharpest gap on wired waters.

**Highest-value gaps, ranked (source dimension only):**

1. **Temperature on the big-6 tailwaters with zero live temp** — south-holston-river, watauga-river,
   boone-tailwater, ft-patrick-henry-tailwater, elk-river (Tims Ford), duck-river-tailwater. TVA has
   no temp; USACE does not run these dams. No remote public source found this window
   (`no defensible source found as of 2026-09-14T00:30Z`); fishability scoring for these signature
   waters must fall back to flow-only + honest labeling, or Session C's seasonal climatology
   (`derived`), never a fabricated gauge.
2. **USACE dam release schedules** (Center Hill/Dale Hollow/JPP) — blocked upstream (CWMS 500, lrn
   TLS). Owner-level action: request schedule feed from Nashville District water management.
3. **USGS Q1-2027 WaterServices decommission** — every `waterservices.usgs.gov` call needs the
   `api.waterdata.usgs.gov` migration (key required beyond a few queries/hour) before blackouts
   begin; degradation allowed from Aug 2026 onward.
4. **Lake temperature/DO** — no live source anywhere; discrete EPA WQP sampling is the only
   verified periodic source family (see pending subsection); any lake temp score today = fabrication.
5. **The 97 unwired waters** — verified one-station upgrades exist for at least: **buffalo-river**
   (03604000 Q+S+T live), **obed-river** (03538830 Q+S+T+DO live — replaces dead 03539800 with
   upstream spatial qualification), **wolf-river-west-tennessee** (07031650 Q+S), **elk-river-lower**
   (03582000 Q+S+T, upstream-qualified), **cumberland-river** reach signals (ASHT1 flow/tail-elev;
   03431091/03431514 T+S in the Nashville pool; tributary-mouth 03430200 T). All parent-verified
   00:17–00:20Z. Remainder are mostly small ponds/urban creeks — `no defensible source` stands.
6. **Precip on wired gauges** (00045 live at 9 configured sites, 44 statewide) — unused context
   rain signal; trivially additive to the F12 "recent rain" context note.
7. **Stage anomalies** (03597860 10.11 ft; 03566535 Q=0.00) — datum/sensor checks before stage-based
   scoring trusts them.

## Scrape recipes (verified today) — summary

(Planner-grade detail in the registry above; full failure-mode analysis from the recipe lane.)

- **TWRA stocking grids:** page → `data-config='…"ajax":"<path>.exceldriven.json"'` regex → two
  JSONs; verified live 00:06Z (616 + 13 rows). Re-resolve the hash path every fetch; trust
  Last-Modified (CDN Age up to ~3.4 d observed); keep "TBD"-style dates unparsed.
- **TDEC advisories:** page → single PDF href → ETag/Last-Modified watch → download+extract+diff
  (PDF last-modified 2026-08-25). Weekly cadence is generous.
- **TVA HTML pages (release schedules page, lake levels page):** Cloudflare managed challenge —
  DO NOT scrape HTML; the JSON endpoints `generation-releases/{id}` + `observed-data/{id}` +
  `predicted-data/{id}` (browser UA + `Accept: application/json`) deliver the same facts.
- **USACE lrn web / rivergages:** dead (TLS) — no recipe permitted.

## Inputs the implementation planner may treat as verified

(forthcoming — compiled at final push)

## Blockers

(forthcoming)
