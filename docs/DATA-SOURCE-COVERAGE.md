# Data-source coverage — per-water evidence provenance (data-sources lane)

**Lane:** external-data & fishing-information · **Base:** `5648ccca5c2b6f6fb1cba95b8ae2d421a1e07c9e` · **Machine-readable twin:** [`docs/data-source-coverage.json`](data-source-coverage.json) · **Captured:** 2026-09-04 (USGS gauge audit + TVA location capture + TWRA two-grid capture + live most-recent rows)

This document is the human-readable coverage report for the evidence layer
(`WaterEvidence[]` served at `GET /v1/evidence/waters.json`, contract
`packages/contracts/src/schemas/waterEvidence.ts`). Every number below is
provenance-first: it states what an upstream source published and when —
never what the UI may infer from a water's name.

## What each water's evidence contains

| Field | Meaning |
|---|---|
| `observations[]` | one entry per (source, metric, moment): `temperature-c`, `discharge-cfs`, `stage-ft`, `reservoir-level-ft` with verbatim source qualifiers (USGS `P` provisional passes through) |
| `stockingEvents[]` | TWRA rows with `status: 'scheduled'` (the schedule grid — a plan, **never** proof of completion) or `'reported-complete'` (the bi-weekly Recent Stocking Locations Report) and the source's own `datePrecision` (`day`/`week`/`month`) |
| `regulations[]` | statewide rules (apply to every water) + water-specific special regulations (from the fishing-information content, `appliesTo`) |
| `errors[]` | per-source upstream failures (HTTP, timeout, unparseable, grid-missing) — a failing source is an error, not an empty success |
| `retrievedAt` vs `observedAt` | when WE assembled vs when the source says the measurement was taken |

## Sources (all verified live 2026-09-04)

| sourceId | Authority | Provides | Cadence | Constraints |
|---|---|---|---|---|
| `usgs-nwis-iv` | USGS Waterservices NWIS | temperature-c, discharge-cfs, stage-ft | 15–60 min | Public domain; no key; batch ≤50 sites; **no TN reservoir-elevation IV sites**; two flagship tailwater gauges have no current IV data (below) |
| `tva-restapi` | TVA | reservoir-level-ft, stage-ft (tailwater), discharge-cfs | hourly | Undocumented endpoint behind Cloudflare — browser User-Agent required, can change without notice; **no water temperature**; covers TVA dams AND the USACE Cumberland projects (`Ownership:"Cumberland"`) |
| `twra-stockings` | TWRA | stocking schedules | seasonal grid (616 rows on 2026-09-04) | tn.gov allows all crawlers, CDN caches ~10 h; CMS path ids change on redeploys (re-resolved every fetch); "week of" = Sunday + 5 days, postponable |
| `twra-recent-stockings` | TWRA | reported-complete stockings | bi-weekly, ~12-row rolling window | No counts, no archive — completed history must be self-collected |
| `twra-regulations` / `nps-gsmnp` / `tva-safety` | TWRA / NPS / TVA | regulations, safety | annual / static | Regulation year runs **Aug 1 – Jul 31** (2026-27 effective 2026-08-01); see [FISHING-INFORMATION-SOURCES.md](FISHING-INFORMATION-SOURCES.md) |

USACE CWMS Data API (`cwms-data.usace.army.mil`) is reachable without auth but its
timeseries catalog returns 501 — unusable today; the USACE Cumberland lakes are
covered through TVA's observed-data instead. This is recorded in the coverage
JSON's `meta.provenance.usace`.

## Known gauge-health findings (USGS audit, all 51 catalog gauge ids)

- **Dead for IV (absent from the site service catalog):** 03533000 (Clinch River
  below Norris), 03424010 (Caney Fork at Center Hill Dam), 03486810 (Boone),
  03487010, 03468510, 03469000, 03483980, 03484000, 03487602, 03580750.
  The two flagship ones are backfilled by TVA tailwater monitors (`NRST1`, `CEHT1`).
- **Historical-only IV:** 03539800 (ended 2026-07-26), 03564500 (1994), 03566000 (2018).
- **Parameter gaps:** 03432350 (Harpeth@Franklin) publishes flow/stage only since
  2014; 03556590 is temperature-only.
- The evidence fetcher still asks for every gauge and reports whatever comes back —
  the audit informs *confidence*, never fetch behavior. Missing data stays missing.

## Confidence model

- **high** (26): live monitor(s) + a resolved TWRA stocking alias + regulations.
- **medium** (92): monitor without resolved stocking alias, or resolved alias without monitor (typical West TN put-and-take ponds).
- **low** (10): no monitor and no resolved alias — the big mainstems (tennessee, cumberland, holston, french broad, mississippi, obion, hatchie, buffalo) whose flow is governed by multiple dams (no single authoritative monitor — deliberately unmapped rather than misrepresented) plus wolf-river-west-tennessee and obed-river.

## Stocking alias resolution

132 distinct TWRA schedule locations + 12 recent-report destinations resolved
through (in order): explicit alias table → county-keyed alias → exact normalized
name match (full name, then parenthetical-stripped base) with a county guard.
**Never first-word or substring matching** (TWRA "W. Fork Stones River" must never
hit "East Fork Stones River"; "East Fork Shoal Creek" must never hit "Shoal Creek").
Colliding bare names ("Duck River", "Elk River", "Wolf River") resolve only through
county aliases and are otherwise reported ambiguous. County contradictions refuse
the match (TWRA "Mill Creek" is Hickman County; the catalog's is Overton County).

Result: **91 waters carry at least one stocking source; 81 through a resolved alias.**
The unresolved TWRA names (55 distinct) are Twra waters the catalog intentionally
has no equivalent for (city park ponds, delayed-harvest waters outside the catalog,
plural site groupings) — they are listed below and in the coverage JSON, never guessed.

## Schedule staleness

Of the 616 captured schedule rows, **508 have windows that passed by the
precision-aware slack** (`stale.ts`: day +14d, week +21d, month +45d). They remain
in evidence with `status:'scheduled'` — a passed window is not proof a stocking
happened or didn't; it is proof the schedule row aged out. Nothing is deleted,
nothing is converted to "complete", nothing is converted to "live".

## Per-water coverage

`most recent observation` is stamped from a live fetch during this lane's run
(2026-09-04); it will age — `retrievedAt`/`observedAt` in the evidence payload and
the conditions freshness logic govern actual staleness at read time. Gauge ids
carry `[status]` markers when they are NOT live (`[absent]`, `[historical-only]`).

| waterId | USGS gauges | TVA monitors | metrics | stocking sources | most recent observation | most recent stocking row | confidence | unresolved-alias candidates |
|---|---|---|---|---|---|---|---|---|
| barren-fork-river | — | — | — | twra-stockings | — | scheduled week 2026-05-10 | medium | — |
| beaverdam-creek | — | — | — | twra-stockings | — | scheduled week 2026-06-21 | medium | — |
| beech-lake | — | — | — | twra-stockings | — | scheduled month 2026-12-01 | medium | — |
| big-rock-creek | — | — | — | twra-stockings | — | scheduled month 2026-12-01 | medium | — |
| boiling-fork-creek | — | — | — | twra-stockings | — | — | medium | — |
| boone-tailwater | 03486810[absent] | BOOT1(tailwater) | discharge-cfs, stage-ft | twra-stockings | discharge-cfs @ 2026-09-04T23:00:00-04:00 | scheduled month 2027-03-01 | high | — |
| brush-creek-cocke | — | — | — | twra-stockings | — | scheduled week 2026-05-03 | medium | — |
| buffalo-creek-grainger | — | — | — | twra-recent-stockings+twra-stockings | — | scheduled week 2026-10-04 | medium | — |
| buffalo-river | — | — | — | — | — | — | low | — |
| calfkiller-river | 03419530 | — | discharge-cfs, stage-ft | twra-stockings | discharge-cfs @ 2026-09-04T22:00:00.000-05:00 | scheduled week 2026-03-29 | high | — |
| cameron-brown-lake | — | — | — | twra-stockings | — | scheduled month 2026-12-01 | medium | — |
| cane-creek | — | — | — | twra-stockings | — | scheduled week 2026-10-25 | medium | — |
| caney-fork-river | 03424010[absent] 03424860 | CEHT1(tailwater) | discharge-cfs, stage-ft | twra-recent-stockings+twra-stockings | discharge-cfs @ 2026-09-04T21:30:00.000-05:00 | scheduled month 2027-03-01 | high | — |
| center-hill-lake | — | CEHT1(reservoir) | discharge-cfs, reservoir-level-ft | — | discharge-cfs @ 2026-09-04T18:00:00-05:00 | — | medium | — |
| charles-creek | — | — | — | twra-stockings | — | scheduled week 2026-05-10 | medium | — |
| cherokee-lake | — | CRKT1(reservoir) | discharge-cfs, reservoir-level-ft | — | discharge-cfs @ 2026-09-04T23:00:00-04:00 | — | medium | candidate: Cherokee TW / Holston River |
| chickamauga-lake | — | CKDT1(reservoir) | discharge-cfs, reservoir-level-ft | — | discharge-cfs @ 2026-09-04T23:00:00-04:00 | — | medium | — |
| citico-creek | — | — | — | twra-recent-stockings+twra-stockings | — | reported-complete day 2026-07-23 | medium | — |
| clear-creek-obed | 03539778 | — | discharge-cfs, stage-ft, temperature-c | — | discharge-cfs @ 2026-09-04T22:45:00.000-04:00 | — | medium | — |
| clear-fork | 03409500 | — | discharge-cfs, stage-ft, temperature-c | — | discharge-cfs @ 2026-09-04T22:30:00.000-04:00 | — | medium | — |
| clinch-river | 03533000[absent] | NRST1(tailwater) | discharge-cfs, stage-ft | twra-recent-stockings+twra-stockings | discharge-cfs @ 2026-09-04T23:00:00-04:00 | scheduled month 2027-03-01 | high | — |
| collins-river | 03421000 | — | discharge-cfs, stage-ft | twra-stockings | discharge-cfs @ 2026-09-04T22:00:00.000-05:00 | scheduled week 2026-05-10 | high | — |
| cosby-creek | — | — | — | twra-stockings | — | scheduled week 2026-06-21 | medium | — |
| covington-fbc-pond | — | — | — | twra-stockings | — | scheduled month 2026-12-01 | medium | — |
| cumberland-river | — | — | — | — | — | — | low | — |
| daddys-creek | 03539600 | — | discharge-cfs, stage-ft, temperature-c | — | discharge-cfs @ 2026-09-04T22:00:00.000-05:00 | — | medium | — |
| dale-hollow-lake | — | DLHT1(reservoir) | discharge-cfs, reservoir-level-ft | twra-stockings | discharge-cfs @ 2026-09-04T18:00:00-05:00 | scheduled month 2027-04-01 | high | — |
| doe-creek-johnson | — | — | — | twra-stockings | — | scheduled week 2026-05-31 | medium | — |
| doe-river | 03485500 | — | discharge-cfs, stage-ft | twra-stockings | stage-ft @ 2026-09-04T23:15:00.000-04:00 | scheduled week 2026-10-04 | high | — |
| douglas-lake | — | DUGT1(reservoir) | discharge-cfs, reservoir-level-ft | — | discharge-cfs @ 2026-09-04T23:00:00-04:00 | — | medium | — |
| duck-river-lower | 03597860 03598000 03599500 | — | discharge-cfs, stage-ft, temperature-c | — | discharge-cfs @ 2026-09-04T21:30:00.000-05:00 | — | medium | — |
| duck-river-tailwater | 03596000 | NRMT1(tailwater) | discharge-cfs, stage-ft | twra-stockings | discharge-cfs @ 2026-09-04T22:00:00.000-05:00 | scheduled month 2027-01-01 | high | — |
| east-fork-shoal-creek | — | — | — | twra-stockings | — | scheduled week 2026-05-31 | medium | — |
| east-fork-stones-river | 03427500 | — | discharge-cfs, stage-ft | — | discharge-cfs @ 2026-09-04T22:00:00.000-05:00 | — | medium | — |
| edmund-orgill-lake | — | — | — | twra-stockings | — | scheduled month 2026-12-01 | medium | — |
| elk-river | 03580750[absent] 03578000 | TMFT1(tailwater) | discharge-cfs, stage-ft | twra-stockings | discharge-cfs @ 2026-09-04T22:00:00.000-05:00 | scheduled month 2027-03-01 | high | — |
| elk-river-lower | 03584600 | — | discharge-cfs, stage-ft | twra-stockings | discharge-cfs @ 2026-09-04T22:15:00.000-05:00 | — | high | — |
| emory-river | 03540500 | — | discharge-cfs, stage-ft | — | discharge-cfs @ 2026-09-04T23:00:00.000-04:00 | — | medium | — |
| fletchers-fork | — | — | — | twra-stockings | — | — | medium | — |
| forge-creek-johnson | — | — | — | twra-stockings | — | scheduled week 2026-05-31 | medium | — |
| fort-loudoun-lake | — | FLDT1(reservoir) | discharge-cfs, reservoir-level-ft | — | discharge-cfs @ 2026-09-04T23:00:00-04:00 | — | medium | — |
| french-broad-river | 03468510[absent] 03469000[absent] | — | — | — | — | — | low | — |
| ft-patrick-henry-tailwater | 03487010[absent] | FPHT1(tailwater) | discharge-cfs, stage-ft | twra-stockings | discharge-cfs @ 2026-09-04T23:00:00-04:00 | scheduled month 2027-03-01 | high | — |
| gap-creek-claiborne | — | — | — | twra-stockings | — | scheduled week 2026-04-12 | medium | — |
| goforth-creek | — | — | — | twra-stockings | — | scheduled week 2026-04-26 | medium | — |
| greasy-creek-polk | — | — | — | twra-stockings | — | scheduled week 2026-04-26 | medium | — |
| gulf-fork-big-creek | — | — | — | twra-stockings | — | scheduled week 2026-05-17 | medium | — |
| harpeth-river | 03432350 03433500 | — | discharge-cfs, stage-ft, temperature-c | twra-stockings | discharge-cfs @ 2026-09-04T21:30:00.000-05:00 | scheduled month 2026-12-01 | high | — |
| hatchie-river | — | — | — | — | — | — | low | — |
| hiwassee-river | 03556590 03566000[no-current-iv] | HADT1(tailwater) | discharge-cfs, stage-ft, temperature-c | twra-recent-stockings+twra-stockings | discharge-cfs @ 2026-09-04T23:00:00-04:00 | scheduled month 2027-03-01 | high | — |
| holston-river | — | — | — | — | — | — | low | — |
| horse-creek-greene | — | — | — | twra-stockings | — | scheduled week 2026-06-07 | medium | — |
| hurricane-creek | — | — | — | twra-stockings | — | scheduled week 2026-03-29 | medium | — |
| indian-creek-claiborne | — | — | — | twra-stockings | — | scheduled week 2026-04-12 | medium | — |
| j-percy-priest-lake | — | JPHT1(reservoir) | discharge-cfs, reservoir-level-ft | — | discharge-cfs @ 2026-09-04T18:00:00-05:00 | — | medium | — |
| johnson-park-lake | — | — | — | twra-stockings | — | scheduled month 2026-12-01 | medium | — |
| kentucky-lake | — | KYDK2(reservoir) | discharge-cfs, reservoir-level-ft | — | discharge-cfs @ 2026-09-04T22:00:00-05:00 | — | medium | — |
| lake-barkley | — | BARK2(reservoir) | discharge-cfs, reservoir-level-ft | — | discharge-cfs @ 2026-09-04T18:00:00-05:00 | — | medium | — |
| lake-graham | — | — | — | twra-stockings | — | scheduled month 2026-12-01 | medium | — |
| laurel-creek-johnson | — | — | — | twra-stockings | — | scheduled week 2026-06-21 | medium | — |
| laurel-fork-carter | — | — | — | twra-stockings | — | scheduled week 2026-06-07 | medium | — |
| leconte-creek | — | — | — | twra-recent-stockings | — | reported-complete day 2026-07-16 | medium | — |
| little-buffalo-river | — | — | — | twra-stockings | — | scheduled week 2026-05-31 | medium | — |
| little-pigeon-river | 03470000 | — | discharge-cfs, stage-ft | — | discharge-cfs @ 2026-09-04T22:30:00.000-04:00 | — | medium | — |
| little-river | 03497300 03498500 | — | discharge-cfs, stage-ft, temperature-c | twra-stockings | discharge-cfs @ 2026-09-04T22:15:00.000-05:00 | scheduled week 2026-11-08 | high | — |
| little-sequatchie-river | — | — | — | twra-stockings | — | scheduled week 2026-05-10 | medium | — |
| little-west-fork-creek | — | — | — | twra-stockings | — | — | medium | — |
| martin-city-pond | — | — | — | twra-stockings | — | scheduled month 2026-12-01 | medium | — |
| mccutcheon-creek | — | — | — | twra-stockings | — | scheduled month 2026-12-01 | medium | — |
| middle-prong-little-pigeon | — | — | — | twra-stockings | — | scheduled week 2026-11-08 | medium | — |
| milan-city-pond | — | — | — | twra-stockings | — | scheduled month 2026-12-01 | medium | — |
| mill-creek-overton | — | — | — | twra-stockings | — | scheduled week 2026-04-26 | medium | — |
| mississippi-river | — | — | — | — | — | — | low | — |
| mossy-creek-jefferson | — | — | — | twra-stockings | — | scheduled month 2026-12-01 | medium | — |
| new-river | 03408500 | — | discharge-cfs, stage-ft, temperature-c | — | discharge-cfs @ 2026-09-04T22:30:00.000-04:00 | — | medium | — |
| nolichucky-river | 03465500 | — | discharge-cfs, stage-ft | — | stage-ft @ 2026-09-04T22:30:00.000-04:00 | — | medium | — |
| norris-lake | — | NRST1(reservoir) | discharge-cfs, reservoir-level-ft | — | discharge-cfs @ 2026-09-04T23:00:00-04:00 | — | medium | — |
| north-chickamauga-creek | 03566535 | — | discharge-cfs, stage-ft | twra-stockings | discharge-cfs @ 2026-09-04T23:00:00.000-04:00 | scheduled week 2026-11-01 | high | — |
| north-prong-barren-fork | — | — | — | twra-stockings | — | scheduled week 2026-04-26 | medium | — |
| obed-river | 03539800[historical-only] | — | discharge-cfs, stage-ft | — | — | — | low | — |
| obey-river | 03417000[absent] | DLHT1(tailwater) | discharge-cfs, stage-ft | twra-recent-stockings+twra-stockings | discharge-cfs @ 2026-09-04T18:00:00-05:00 | scheduled month 2027-01-01 | high | — |
| obion-river | — | — | — | — | — | — | low | — |
| ocoee-river | 03559500 | OCBT1(tailwater) | discharge-cfs, stage-ft | — | discharge-cfs @ 2026-09-04T23:00:00-04:00 | — | medium | — |
| old-hickory-lake | — | OHHT1(reservoir) | discharge-cfs, reservoir-level-ft | — | discharge-cfs @ 2026-09-04T18:00:00-05:00 | — | medium | — |
| paris-city-park-lake | — | — | — | twra-stockings | — | scheduled month 2026-12-01 | medium | — |
| parksville-tailwater | 03564500[no-current-iv] | OCAT1(tailwater) | discharge-cfs, stage-ft | twra-stockings | discharge-cfs @ 2026-09-04T23:00:00-04:00 | scheduled month 2027-03-01 | high | — |
| pickwick-lake | — | PICT1(reservoir) | discharge-cfs, reservoir-level-ft | — | discharge-cfs @ 2026-09-04T22:00:00-05:00 | — | medium | — |
| pigeon-river | 03461500 | — | discharge-cfs, stage-ft | — | discharge-cfs @ 2026-09-04T23:00:00.000-04:00 | — | medium | — |
| pine-creek-dekalb | — | — | — | twra-stockings | — | scheduled week 2026-03-29 | medium | — |
| piney-river-rhea | — | — | — | twra-stockings | — | scheduled week 2026-10-25 | medium | — |
| powell-river | 03532000 | — | discharge-cfs, stage-ft | — | discharge-cfs @ 2026-09-04T22:15:00.000-04:00 | — | medium | — |
| puncheon-camp-creek | — | — | — | twra-stockings | — | scheduled week 2026-04-12 | medium | — |
| red-river-clarksville | 03436100 | — | discharge-cfs, stage-ft | twra-stockings | discharge-cfs @ 2026-09-04T21:30:00.000-05:00 | — | high | — |
| reedy-creek | 03487602[absent] | — | — | twra-stockings | — | — | medium | — |
| richardson-byrd-creek | — | — | — | twra-stockings | — | scheduled week 2026-04-12 | medium | — |
| roaring-fork | — | — | — | twra-stockings | — | — | medium | — |
| rocky-river | — | — | — | twra-stockings | — | scheduled week 2026-05-17 | medium | — |
| salt-lick-creek | — | — | — | twra-stockings | — | scheduled week 2026-03-22 | medium | — |
| sequatchie-river | 03571000 | — | discharge-cfs, stage-ft | twra-stockings | discharge-cfs @ 2026-09-04T21:15:00.000-05:00 | scheduled week 2026-05-17 | high | — |
| shelby-farms-lake | — | — | — | twra-stockings | — | scheduled month 2026-12-01 | medium | — |
| shoal-creek | 03588500 | — | discharge-cfs, stage-ft | twra-stockings | discharge-cfs @ 2026-09-04T21:30:00.000-05:00 | — | high | — |
| sinking-creek-wilson | — | — | — | twra-stockings | — | — | medium | — |
| south-fork-cumberland | 03410210 | — | discharge-cfs, stage-ft | — | discharge-cfs @ 2026-09-04T22:30:00.000-04:00 | — | medium | — |
| south-holston-lake | — | SHDT1(reservoir) | discharge-cfs, reservoir-level-ft | — | discharge-cfs @ 2026-09-04T23:00:00-04:00 | — | medium | — |
| south-holston-river | 03476500[absent] | SHDT1(tailwater) | discharge-cfs, stage-ft | twra-stockings | discharge-cfs @ 2026-09-04T23:00:00-04:00 | scheduled month 2027-03-01 | high | — |
| spring-creek-polk | — | — | — | twra-stockings | — | scheduled week 2026-11-29 | medium | — |
| standing-rock-creek | — | — | — | twra-stockings | — | scheduled week 2026-03-29 | medium | — |
| station-creek | — | — | — | twra-stockings | — | scheduled week 2026-04-12 | medium | — |
| stones-river | 03430200 | — | discharge-cfs, stage-ft, temperature-c | twra-stockings | discharge-cfs @ 2026-09-04T22:00:00.000-05:00 | scheduled month 2026-12-01 | high | — |
| stoney-creek-carter | — | — | — | twra-stockings | — | scheduled week 2026-05-31 | medium | — |
| sulfur-fork-creek | — | — | — | twra-stockings | — | scheduled month 2026-12-01 | medium | — |
| tellico-river | 03518500 | — | discharge-cfs, stage-ft | twra-recent-stockings+twra-stockings | discharge-cfs @ 2026-09-04T23:00:00.000-04:00 | scheduled week 2026-12-06 | high | — |
| tennessee-river | — | — | — | — | — | — | low | — |
| tims-ford-lake | — | TMFT1(reservoir) | discharge-cfs, reservoir-level-ft | — | discharge-cfs @ 2026-09-04T22:00:00-05:00 | — | medium | — |
| trail-fork-big-creek | — | — | — | twra-stockings | — | — | medium | — |
| tumbling-creek | — | — | — | twra-stockings | — | scheduled week 2026-04-26 | medium | — |
| union-city-reelfoot-pond | — | — | — | twra-stockings | — | scheduled month 2026-12-01 | medium | — |
| upper-hills-creek | — | — | — | twra-stockings | — | scheduled week 2026-03-22 | medium | — |
| upper-roan-creek | — | — | — | twra-stockings | — | scheduled week 2026-06-14 | medium | — |
| valentine-park-pond | — | — | — | twra-stockings | — | scheduled month 2026-12-01 | medium | — |
| watauga-river | 03483980[absent] 03484000[absent] 03486000 | WL(tailwater) | discharge-cfs, stage-ft | twra-stockings | discharge-cfs @ 2026-09-04T23:00:00.000-04:00 | scheduled month 2027-03-01 | high | — |
| watts-bar-lake | — | WBOT1(reservoir) | discharge-cfs, reservoir-level-ft | — | discharge-cfs @ 2026-09-04T23:00:00-04:00 | — | medium | — |
| west-fork-stones-river | 03428200 | — | discharge-cfs, stage-ft | twra-stockings | discharge-cfs @ 2026-09-04T21:00:00.000-05:00 | scheduled month 2026-12-01 | high | — |
| west-prong-little-pigeon | 03469251 | — | discharge-cfs, stage-ft | twra-recent-stockings+twra-stockings | discharge-cfs @ 2026-09-04T23:15:00.000-04:00 | scheduled week 2026-10-25 | high | — |
| white-oak-creek | — | — | — | twra-stockings | — | scheduled week 2026-03-29 | medium | — |
| wolf-river-fentress | — | — | — | twra-stockings | — | scheduled week 2026-05-10 | medium | — |
| wolf-river-west-tennessee | — | — | — | — | — | — | low | — |
| yale-road-park-lake | — | — | — | twra-stockings | — | scheduled month 2026-12-01 | medium | — |
## Regeneration

```bash
# offline (deterministic, CI-safe — fixtures + committed audit only)
pnpm --filter api exec tsx src/scripts/build-coverage.ts
# live (adds most-recent observation/stocking stamps from the real sources)
pnpm --filter api exec tsx src/scripts/build-coverage.ts --live
```

The evidence payload itself is regenerated by `pnpm --filter api ingest --job=evidence`
(daily 06:20 in cron), which stores `WaterEvidence[]` in SQLite; the snapshot builder
emits it at `GET /v1/evidence/waters.json` (additive endpoint, contracts-v1.1.0).

## Unresolved TWRA names (55 distinct, observed on the captured grids)

Observed on the captured grids (name — why it stays unresolved):

- **Acorn Lake (Montgomery Bell SP)** (Dickson) — no catalog water matches
- **Alexander Creek** (Hawkins) — no catalog water matches
- **Athens City Park Pond** (McMinn) — no catalog water matches
- **Big Creek** (Hawkins) — no catalog water matches
- **Big Soddy Creek** (Hamilton) — no catalog water matches
- **Billy Dunlop Park** (Montgomery) — no catalog water matches
- **Calderwood Reservoir** (Blount/Monroe) — no catalog water matches
- **Cane Creek Park** (Putnam) — no catalog water matches
- **Cedar Hill Park Pond** (Davidson) — no catalog water matches
- **Cherokee TW / Holston River** (Jefferson/Grainger) — no catalog water matches
- **Chilhowee Reservoir** (Blount/Monroe) — no catalog water matches
- **Clark Creek** (Unicoi) — no catalog water matches
- **Coops Creek** (Sequatchie) — no catalog water matches
- **Cowan City Park** (Franklin) — no catalog water matches
- **Cumberland Mountain State Park** (Cumberland) — no catalog water matches
- **Dickert Pond / Camp Jordan** (Hamilton) — no catalog water matches
- **Dillard Ponds** (Greene) — no catalog water matches
- **Don Fox Park Community Park** (Wilson) — no catalog water matches
- **Fishery Park Pond** (Unicoi) — no catalog water matches
- **Flat Fork Creek** (Morgan) — no catalog water matches
- **Fort Campbell Streams** (Montgomery) — no catalog water matches
- **Fountain City Lake** (Knox) — no catalog water matches
- **Ft. Campbell** — no catalog water matches
- **Gatlinburg Streams** (Sevier) — no catalog water matches
- **Goose Creek / Town Creek** (Johnson) — no catalog water matches
- **Green Cove Pond** (Monroe) — no catalog water matches
- **Green Cove Pond** — no catalog water matches
- **Grundy Lake #4 / Fiery Gizzard SP** (Grundy) — no catalog water matches
- **J.D. Buckner Park** (Dickson) — no catalog water matches
- **Johnson County Youth Event** — no catalog water matches
- **L.L. Burns Park** (Cheatham) — no catalog water matches
- **Lafayette City Park** (Macon) — no catalog water matches
- **Lake Junior** (Hamilton) — no catalog water matches
- **Laurel Creek** (Van Buren) — county mismatch (TWRA van buren vs catalog johnson)
- **Laurel Fork** (Campbell) — county mismatch (TWRA campbell vs catalog carter)
- **Mantooth Pond** (Hancock) — no catalog water matches
- **Marrowbone Lake** (Davidson) — no catalog water matches
- **McKamy Lake** (Polk) — no catalog water matches
- **McKenzie City Park** (Caroll) — no catalog water matches
- **Mill Creek** (Hickman) — county mismatch (TWRA hickman vs catalog overton)
- **Nice Mill** (Rutherford) — no catalog water matches
- **North Indian Creek** (Unicoi) — no catalog water matches
- **Oneida City Park Lake** (Scott) — no catalog water matches
- **Paint Creek** (Greene) — no catalog water matches
- **Panther Creek** (Hamblen) — no catalog water matches
- **Pickett Lake** (Pickett) — no catalog water matches
- **Pistol Creek/Greenbelt Lake** (Blount) — no catalog water matches
- **Pocket Creek** (Marion) — no catalog water matches
- **Ralph Stout Park Pond** (Johnson) — no catalog water matches
- **Rocky Fork** (Unicoi) — no catalog water matches
- **Shelby Bottoms** (Davidson) — no catalog water matches
- **South Indian Creek** (Unicoi) — no catalog water matches
- **Stone Bridge Park** (Lincoln) — no catalog water matches
- **Tackett Creek** (Campbell) — no catalog water matches
- **Trail Fork Big Creek** (Cocke) — no catalog water matches
