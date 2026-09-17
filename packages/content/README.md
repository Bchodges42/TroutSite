# @trout/content

YAML content pack for the trout PWA — **OWNER: ROLE 4** (Role 1 created the shell;
all corpus, scripts, and tests here are Role 4's).

## Layout

```
bugs/{taxon-id}.yaml            # 103 taxa — mayflies, caddisflies, stoneflies, midges,
                                #   terrestrials, scuds/sowbugs, crayfish, baitfish;
                                #   each with keyAttributes, habitat, months-active by
                                #   region, sources, + an SVG line-art illustration
patterns/{pattern-id}.yaml      # 155 fly patterns (classics preferred; attributed where
                                #   licensed to a designer — see license/attribution fields)
hatch/{stateId}/{regionId}.yaml # 12-month hatch chart per region; one file per region with
                                #   months[] (contract HatchChart shape unchanged)
streams/{stateId}/{stream-id}.yaml  # 188 Tennessee waters (48 carry verified gaugeIds;
                                #   documented ungauged waters → validator WARN)
data/species-occurrences.json       # static, source-backed fish/water associations; no live scraper
research/fishbrain-tn-discovery.json # research-only aggregate candidates; never emitted to the app
research/fishbrain-tn-graphql-discovery.json # research-only full species/catch snapshot; never emitted to the app
research/fishbrain-tn-graphql-standard-discovery.json # research-only full snapshot for remaining standard waters; never emitted to the app
shops/{stateId}/{shop-id}.yaml  # 23 real TN fly/tackle shops, all reportsEnabled: false
                                #   until individually onboarded via the shop portal
data/verified-gauges.json       # USGS gauge-ID verification fixture (51 IDs, 2026-09-02)
scripts/                        # see below
test/                           # validation suite (11 tests, CI gate)
```

## Launch regions (Tennessee)

Registry of record: `scripts/regions.ts` (`REGIONS`). Eleven regions cover the shared
context's launch set — East TN tailwaters (South Holston, Watauga), the Hiwassee system
(SE TN), and Middle TN tailwaters (Caney Fork, Elk/Duck) plus the Clinch/Norris, Smokies,
Cumberland Plateau, and both Upper Cumberland/Nashville winter-trout waters. Each region
has a full 12-month hatch chart.

## Scripts (pnpm --filter @trout/content <script>)

| script | what it does |
|---|---|
| `validate` | **CI gate**: every YAML file parses against the frozen `@trout/contracts` schemas; orphan-reference checks (pattern → unknown taxon, chart → unknown pattern/stream/taxon, stream → unknown gauge/region); gauge-ID lint against `data/verified-gauges.json` (unknown ID = FAIL, verified-ungauged = WARN); SVG well-formedness + single-`<svg>` root check |
| `build` | compiles the compact bundled JSON content pack into `dist/pack/` (≤ 20 MB budget; currently ~1 MB) and emits hatch months in the `/v1/hatch/{regionId}/{month}.json` snapshot shape. **Must run before any consumer builds** (`apps/admin` imports `@trout/content/pack/*.json`) |
| `report` | counts by state/type — run for the handoff summary |
| `test` | vitest validation suite (schema round-trips, orphans, pack shape) |

## Rules (non-negotiable, from the role brief)

- Facts + original writing only. **Every file has `sources:`** with real URLs/works.
  Never reproduce hatch-chart prose from fly shops or paywalled guides.
- Schemas live in `@trout/contracts` (frozen at contracts-v1.0.0) — validate, never edit.
- `idealFlow` on streams is justified in `notes` (tailrace vs freestone vs spring creek)
  with `officialSources`; uncertain ranges are conservative and say so.
- Gauge IDs must exist on USGS (`waterdata.usgs.gov`) — 51 IDs live-verified 2026-09-02
  (`data/verified-gauges.json`); TVA dam gauges verified via the USGS Instantaneous Values
  service individually. The 41 gauged streams reference only verified IDs.
