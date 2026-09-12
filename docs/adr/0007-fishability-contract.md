# ADR 0007. Fishability contract v2: per-species comfort + transparent activity outlook

- **Status:** accepted
- **Date:** 2026-09-12
- **Decider:** Session A (server & operations) under the Stage 2 program delegation; consumed by F2/F3 (Session B) and F6 (Session C)

## Context

The site's only score today (`ConditionScore`, `scoreConditions`) is trout-shaped: it
scores a STREAM (flow against the stream's `idealFlow`, temperature as an adjustment)
and is deliberately computed for `species: 'trout'` waters only. Warmwater waters are
listed but never scored (T1-16-era copy says so honestly). The fishability program
(F1–F12) adds per-species comfort scoring (bass, crappie, bluegill, catfish, stripers —
species whose comfort is driven by water temperature, not by a trout flow window), an
activity outlook assembled from transparent components (temperature now; flow trend,
area pressure, spawn state in Stage 3), and a site-wide Trout/All-fish setting.

Constraints carried over from 00-SHARED-CONTEXT §6: deterministic scoring (no clocks
inside scorers, no network, no randomness, no AI), client-side computable, offline-first
read path (snapshot files), additive-only contract changes, and the data-honesty rules
that came out of the Stage 1 fixes (a clamped 0 is a REAL assessment; only
`assessed: false` means "no data"; staleness keys off each observation's own timestamp —
T1-6 — never off fetch success).

Sessions B (F2 band authoring, F3 catalog) and C (F6 UI) are blocked on this shape, so
it is settled first and pushed alone.

## Decision

### Species keys (frozen, v2)

`'largemouth-bass' | 'smallmouth-bass' | 'spotted-bass' | 'crappie' | 'bluegill' |
'channel-catfish' | 'striped-bass'` — ratifies the Stage 2 brief list verbatim
(kebab-case, English common names, lowercase). Adding a species later is additive:
new enum value + new bands authored under F2's citation rules.

`StreamSchema` gains `targetSpecies?: SpeciesKey[]` (additive, optional). Existing
`species: 'trout' | 'warmwater'` is UNCHANGED — it remains the water's fisheries
program type; `targetSpecies` records which of the seven game species the water is
managed for. Absent = not cataloged (F3), never guessed.

### Comfort bands (authored by F2, consumed by F4)

`SpeciesComfortBands` — one species' thermal comfort ladder in °C, six ordered
boundaries forming five contiguous zones:

```
lethalLow < avoidanceLow < optimalLow <= optimalHigh < avoidanceHigh < lethalHigh
             (avoidance boundaries ARE the lower/upper ACTIVE limits)
```

Zones and what they mean to an angler: `lethal` (no actively feeding fish),
`avoidance` (fish alive but largely inactive — poor), `optimal` (the sweet spot).
Temperature is the comfort metric because thermal tolerance is what actually
DIFFERS between these species; flow suitability stays where it already lives
(per-stream `idealFlow`, `scoreConditions`), so comfort does not duplicate it.

### `FishabilityScore` (same shape family as `ConditionScore`)

`{ species, value: 0–100 int, reasons: string[], assessed: boolean, freshness }` where
`freshness` is `{ observedAt: ISO datetime, ageMinutes: int >= 0 } | null` — the age of
the observation that produced the score, or null when nothing fresh enough was
available. Honesty semantics mirror `scoreConditions` exactly:

- value 0 with `assessed: true` = a REAL assessment that landed on lethal (renders as
  Poor, never "No data").
- `assessed: false` = cannot assess (no non-stale temperature for the species) — value
  0 + explanatory reason, renders as "No data".
- Freshness is per-metric: the temperature reading's OWN timestamp is the only truth
  about when it was observed (T1-6); a metric whose observation is older than
  `READING_STALE_MINUTES` (3 h) does not score.

Scorer purity: `scoreFishability(readings, species, bands, nowMs)`. The brief's
3-parameter signature gains the required `nowMs` because freshness is part of the
emitted shape and contracts already own the caller-passed-clock pattern
(`readingFreshness` takes `nowMs`; `scoreConditions` is clock-free only because it
emits no freshness). Same-inputs-same-output holds.

### `ActivityOutlook` (transparent, deterministic, no AI)

```
ActivityOutlook   = { total: 0–100 int, components: ActivityComponent[] }
ActivityComponent = { factor, value, contribution, weight, evidenceUrl, confidence, label }
factor            = 'water-temperature' | 'flow-trend' | 'pressure-trend' | 'spawn-state'
value             = 0–100 normalized factor score (the factor's own scale, normalized)
weight            = 0–1 share of the outlook; components' weights sum to 1 (± 0.01)
contribution      = −50…+50 points this factor contributes to the total (= weight × (value − 50), tolerance 1.5)
evidenceUrl       = URL of the source behind the value
confidence        = 'measured' (direct reading) | 'derived' (computed from measurements, e.g. a trend) | 'heuristic' (authored preference)
label             = plain-language component name shown in the UI
```

`components` is ordered descending by `Math.abs(contribution)` (stable: equal
contributions keep authoring order — the scorer sorts a copy with an explicit index
tie-break). Empty `components` = no activity data (total 0; consumers render honest
unavailability, the T1-8 pattern). `total = clamp(0, 100, round(50 + Σ contribution))`
— 50 is a neutral outlook, each factor visibly moves it. The linear
`contribution = weight × (value − 50)` model holds for every factor because `value` is
where factor-specific nonlinearity (spawn thresholds, trend sensitivity) is absorbed.

`scoreActivity(components)` computes exactly that total and returns the ordered
component list; it never mutates its input.

### Endpoints + version (additive only)

`ENDPOINTS.fishabilityForWater: (streamId) => '/v1/fishability/${streamId}.json'` —
F5 (Stage 3) emits a species-keyed map `{ [species]: { comfort: FishabilityScore,
activity: ActivityOutlook } }` per monitored water. No existing route changes.

Package version bumps `1.0.1 → 2.0.0`: v2 is additive (new schemas, new optional
`targetSpecies`, new endpoint), so no consumer breaks, but the program tags the
fishability spine as contract v2 and the activity/factor enums are closed sets whose
extension follows the ADR process.

### Coverage gate

The ≥90% contracts coverage gate (statements/branches/functions/lines) applies; schema
reject paths and scorer boundaries are tested explicitly.

## Consequences

- F2 (Session B) can author bands + profiles against `SpeciesComfortBands` and the
  frozen species keys; F3 fills `targetSpecies` from TWRA evidence; F6 (Session C) can
  build the Trout/All-fish setting and the activity breakdown UI against the emitted
  snapshot shape.
- The scorer stays deterministic and client-side: the PWA can recompute comfort from
  cached readings + bundled bands offline; no new runtime dependency.
- `scoreConditions` and trout presentation are untouched — no migration of existing
  snapshots; fishability snapshots simply do not exist until F5 (Stage 3) emits them.
- Weight-sum and contribution-consistency refinements push validation cost onto
  authors, not consumers: a snapshot that passes validation has an arithmetically
  coherent outlook the UI can render without re-deriving anything.
- Later species (e.g. sauger, sunfish variants) = additive enum value + authored bands;
  later factors (e.g. water clarity) = additive enum value under the same linear model.

## Alternatives considered

- Reusing `ConditionScore` with a species field — rejected: its flow-dominant model is
  trout-specific (idealFlow is per-stream trout data), and bolting species onto it
  would silently mis-score warmwater species; comfort's metric (temperature) and its
  ladder are genuinely different.
- Continuous (interpolated) comfort curve instead of zones — rejected for v1 of the
  contract: zones map to plain-language reasons an angler can act on and match
  `scoreConditions`' discrete-band style; interpolation can arrive additively as a
  scoring change without a schema change.
- Free-form `factor: string` — rejected: a closed enum keeps the UI's factor rows and
  the weight-sum validation meaningful; new factors go through the ADR process.
- Per-metric timestamps on `GaugeReading` (to carry freshness per metric in the shape)
  — rejected for v2: it would break the frozen gauge schema for every existing
  snapshot; per-metric age is achieved the way `scoreConditions` does it (the timestamp
  of the reading that supplied each metric) plus the T1-6 ingest-side staleness filter.
- `nowMs` optional / freshness omitted when absent — rejected: two output shapes for
  one function invites consumers to forget the freshness contract; a required clock
  argument keeps every output complete and deterministic.
