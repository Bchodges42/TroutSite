# Flow-direction arrows — orientation derivation

Feature: when a water is selected (`?river=<id>`), small chevron arrows are
drawn along its line showing **flow direction** (downstream). This document is
the contract for where direction comes from — and what it refuses to do.

## Why a generator at all

Direction must derive from **topology, never from vertex order and never by
hand**. The Duck River's stored vertex order is provably wrong (teleports —
TIGER/NHD merge artifacts), so "as-stored" or "reversed" guesses would
regularly lie. The atlas also has verified hydrologic topology records that
already know which water joins which, and where each dam sits; that is the
authoritative signal.

## The generator

```
node apps/web/scripts/build-flow-orientation.mjs
```

Reads:

- `apps/web/public/atlas/rivers.geojson` — canonical geometry (147 features).
- `apps/web/atlas-sources/verified/west-middle.topology.json`
- `apps/web/atlas-sources/verified/east-southeast.topology.json`

Writes **`apps/web/src/features/map/flowOrientation.json`** — a committed,
source-tracked artifact (same model as `riverIndex.json`):

```json
{
  "generated": "2026-09-08",
  "source": "topology+confluence-graph",
  "derivation": "…full prose contract…",
  "stats": { "lineFeatures": 104, "parts": 1689, "orientedParts": 572,
             "high": 49, "medium": 16, "low": 39, "byMethod": { … } },
  "waters": { "<featureId>": { "parts": [1, -1, 0, …], "confidence": "high" } }
}
```

Per-part flags: `1` = stored coordinate order already flows downstream,
`-1` = reversed order (renderer flips it), `0` = **UNORIENTED**. Per-water
`confidence`: `high` = verified topology / dam / lake-in-out / termini
evidence, `medium` = confluence-graph or chain evidence, `low` = no oriented
parts. Unknown-safe: `0` parts never render as a direction.

Pure logic lives in `apps/web/scripts/flow-orientation-core.mjs`
(unit-tested in `test/flow-orientation.test.ts`; the CLI is a thin I/O
wrapper).

## Derivation (priority order)

1. **Verified topology records** — a record's `upstreamFeatureIds` /
   `downstreamFeatureIds` edge is accepted only when a real endpoint of the
   feature lies within 900 m of the referenced water's geometry (id strings
   are normalized: `"normandy-lake(terminus Columbia; …)"` → `normandy-lake`,
   and references that resolve to no feature — or to the feature itself — are
   dropped). `termini` anchors whose text matches mouth/confluence act the
   same way.
2. **Dam anchors** — every dammed LINE water in the atlas is the reach *below*
   its dam (tailraces, tailwaters, lake outflow reaches), so the endpoint
   within ~1.2 km of the record's dam coordinates is the UPSTREAM end. (Lake
   polygons are the mirror case: their dam is the outlet — used for rule 3,
   never to draw arrows on lakes.)
3. **Lake in/out** — for a line feature with `throughLakeIds`: an endpoint
   INSIDE the lake polygon is where the water joins the pool, so that end is
   DOWNSTREAM (flow exits the water into the lake, toward the dam/outlet
   side). When both ends lie outside, the end nearer the through-lake's dam
   is downstream.
4. **Confluence graph** — endpoint touches (~50 m snap, polygon shores
   included) build a water graph. Verified topology edges (plus dam
   coincidences — a lake and its tailwater share the same works ~100 m apart)
   form a directed network whose downstream termini (no verified outflow:
   the Mississippi itself, terminal lakes) anchor depth 0, depth rising
   upstream. A touched neighbor SHALLOWER than this water is the recipient —
   the endpoint flows INTO it; an unranked (record-less) touch neighbor is
   always treated as the recipient. Touching a dammed lake AT its dam is an
   outflow (tailwater), never an inflow. Cumberland and Tennessee main stems
   anchor to the Mississippi through the verified lake chain recorded in the
   topology files (cumberland-river → lake-barkley → kentucky-lake →
   tennessee-river). Equal-depth ties (braids, head-to-head continuations)
   yield no evidence.
5. **Part-junction chaining** — an oriented part propagates its direction
   across a junction of exactly TWO of its feature's part-ends (water flows
   through the junction: exiting one part means entering the next). Junctions
   of 3+ ends (forks/braids) never propagate — the continuation through a
   fork would risk being oriented backwards.
6. Everything still unexplained stays `0`. **No endpoint ever gets a direction
   from vertex order, coordinate orientation, or "it looks like it should".**

Current run (2026-09-08): 49 high + 16 medium of 104 line waters confident;
572 of 1689 parts oriented; the rest are honestly `0`.

## Rendering

- `mapStyle.ts` declares the empty `flow-arrows` GeoJSON source and the
  `rivers-flow-arrows` symbol layer (`symbol-placement: line`,
  `symbol-spacing: 150` px, runtime-registered chevron icon — the style still
  ships no sprite/glyph URLs). The layer sits above the water rendering and
  below the transparent hit layers; labels are DOM markers, so arrows can
  never cover them.
- `flowArrows.ts` (renderer-side, unit-tested) flips `-1` parts so every
  carrier line runs downstream, drops `0` parts, and skips polygon/point
  waters — **lakes get no flow arrows this iteration**.
- `TennesseeMap.tsx` rebuilds the source when the selection changes and
  re-registers the icon on theme/basemap swaps (per-theme ink + paper halo,
  readable on light and dark). No new network fetches: geometry is read back
  through the already-loaded `rivers` style source (`getRiversData`), cached
  per session.

## Unoriented waters (current run, honest gaps)

39 line waters currently derive no confident direction — mostly record-less
creeks whose endpoints touch nothing inside the catalog, plus
`mississippi-river` (its record's "downstream" ids are actually its Tennessee
tributaries and fail geometric verification, so the sink itself stays
unoriented) and `hatchie-river` (mouth stops ~3.7 km short of the
Mississippi across bottomland). They simply get no arrows.

`beaverdam-creek, boiling-fork-creek, brush-creek-cocke,
buffalo-creek-grainger, cane-creek, citico-creek, clear-creek-obed,
cosby-creek, east-fork-shoal-creek, fletchers-fork, forge-creek-johnson,
gulf-fork-big-creek, hatchie-river, laurel-creek-johnson, laurel-fork-carter,
leconte-creek, little-buffalo-river, little-pigeon-river,
little-west-fork-creek, mccutcheon-creek, middle-prong-little-pigeon,
mississippi-river, mossy-creek-jefferson, north-prong-barren-fork,
parksville-tailwater, puncheon-camp-creek, reedy-creek,
richardson-byrd-creek, roaring-fork, salt-lick-creek, shoal-creek,
spring-creek-polk, station-creek, stoney-creek-carter, tellico-river,
trail-fork-big-creek, tumbling-creek, west-prong-little-pigeon,
wolf-river-fentress`
(as of the last generator run; the JSON header `stats` and the script's
console output list the authoritative set)

## Related: internal QA mode (`?qa=1`)

The same data pipeline powers an internal QA overlay (not advertised in the
normal UI): `features/map/qa/audit.ts` computes dangling ends, isolated
fragments, self-crossings, and duplicate corridors client-side over the
loaded `rivers.geojson`; `?qa=1` shows a subtle QA chip + panel listing
defects per water, each clickable (flies to the first occurrence and selects
the water). Unit-tested in `test/qa-audit.test.ts`.
