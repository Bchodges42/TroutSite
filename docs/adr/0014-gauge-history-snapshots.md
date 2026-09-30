# ADR 0014. Gauge history snapshot endpoint

## Status

Accepted — 2026-09-30. **Spec handoff to the API lane**: the web side ships in this
changeset (feature-gated to self-enable on first 200); the `/v1/gauge-history/*`
emission described here does NOT exist yet and is the API lane's remaining 10%.

## Context

The water detail page shows only the newest reading per gauge
(`v1/conditions/latest.json`). Anglers need the recent shape of a river — was it
rising, falling, or steady; how cold is the trend — without leaving the app.

The raw material already exists: the gauges job stores every USGS instant-values
row in `gauge_readings_raw` (one row per gauge per fetch, with `observed_at`,
`cfs`, `height_ft`, `temp_c`, `dissolved_oxygen_mg_l`, `precipitation_mm`) and
prunes rows older than 90 days (`RAW_RETENTION_DAYS`, `apps/api/src/ingest/usgs.ts`).
Nothing serves that history today.

Constraints that shape the endpoint:

- **Offline-first static serving** (ADR 0004/0005): snapshots are pre-built JSON
  at frozen URLs, refreshed by cron, cached by Cloudflare and the service worker.
  No per-request query API.
- **Honesty rules** (site-wide): no fabricated data, no interpolation between
  sparse samples, absence is absence. Gauge coverage started when the ingest
  started — there is no pre-launch history and none may be invented.
- **Additive contracts only** (ADR 0008): existing payloads and consumers are
  untouched.

## Decision

### Endpoint

`GET /v1/gauge-history/{gaugeId}.json` — one static file per gauge, additive to
the existing snapshot builder (`apps/api/src/snapshots/build.ts`), emitted from
`gauge_readings_raw` in the same cron pass. `{gaugeId}` is the gauge id exactly as
it appears in `stream.gaugeIds` (today only numeric USGS ids qualify — `tva:`/
`usace:`-prefixed ids belong to the conditions bridge and get NO file).

**A gauge with no raw rows emits no file. The 404 is the honest "we have no
history for this gauge" signal — never emit an empty-shell payload.** The web
panel is hidden on 404.

### Payload shape (zod)

```ts
export const GaugeHistorySchema = z.object({
  gaugeId: z.string().min(1),
  /** Which metrics this gauge actually reports — only metrics present in the samples. */
  metrics: z.array(z.enum(['cfs', 'tempC', 'heightFt'])).min(1),
  /** One row per timestamp, ascending; deduplicated per timestamp (see rules). */
  samples: z
    .array(
      z.object({
        timestamp: IsoDateTimeSchema,
        cfs: z.number().optional(),
        tempC: z.number().optional(),
        heightFt: z.number().optional(),
      }),
    )
    .min(1),
  /** Free-text cadence statement from the source, e.g. "hourly where reported". */
  samplingCadenceNote: z.string().min(1).optional(),
  /** When the builder produced the file (staleness anchor for consumers). */
  retrievedAt: IsoDateTimeSchema,
  /** Official source for the "verify" link (USGS site page for the gauge). */
  sourceUrl: z.string().url(),
});
export type GaugeHistory = z.infer<typeof GaugeHistorySchema>;
```

Today's emission covers `cfs`, `tempC`, `heightFt` (the three history-chart
metrics). `reservoirLevelFt` / `dissolvedOxygenMgL` / `precipitationMm` may be
added later purely additively (new enum members + optional sample fields; old
consumers keep parsing).

### Emission rules (binding for the API lane)

1. **Source query.** `SELECT * FROM gauge_readings_raw WHERE gauge_id = ? AND
   observed_at IS NOT NULL AND observed_at >= ? ORDER BY observed_at ASC` with the
   cutoff at now − 90 days. The 90-day raw retention is a **floor**, never a
   promise: whatever the table holds is what the file holds, and completeness is
   never implied anywhere in the payload or the UI.
2. **No fabricated pre-launch history.** The file begins at the oldest retained
   row. No backfill from archived USGS services, no synthetic samples, no
   placeholder zeros.
3. **No interpolation.** Samples are measurements only. A missing metric at a
   timestamp is simply absent from that sample (and from `metrics` if absent from
   every sample). Gaps in time are carried AS GAPS — consecutive samples farther
   apart than the gauge's cadence are the consumer's cue to draw a break.
4. **Deduplication.** One sample per timestamp. When the table holds several rows
   for the same gauge+metric+timestamp, the NEWEST `fetched_at` row wins, per
   metric; metrics from different rows at the same timestamp merge into one
   sample. (The web model re-deduplicates defensively with identical semantics.)
5. **Sparse/dirty rows.** Drop rows where every history metric is null. Round
   nothing, smooth nothing — emit the measured values as ingested.
6. **Metrics field.** Exactly the set of metrics present on at least one sample.
7. **TTL / staleness.** Regenerate the files in the same snapshot pass as
   `conditions/latest.json` (hourly cadence, §5). Consumers treat the payload as
   fresh for 60 minutes (`GAUGE_HISTORY_TTL_MIN`); after that they may show a
   cached copy labeled "last known". `retrievedAt` is displayed as provenance. A
   stale file is still a truthful record of the past — it is never presented as
   current.
8. **Pruning.** When a gauge loses all raw rows (or is removed from every
   stream's `gaugeIds`), delete its file in the same pass (the build's existing
   `pruneJsonFiles` lifecycle).
9. **Additivity.** New endpoint only; no change to any existing snapshot. The
   payload validates with the schema above BEFORE writing (`writeJsonAtomic`),
   same discipline as every other snapshot.

### Contract home

The schema above ships FIRST in the web feature at
`apps/web/src/features/waters/gaugeHistory.ts` (local zod schema + pure model +
`gaugeHistoryUrl(gaugeId)` → `/v1/gauge-history/{encoded gaugeId}.json`). When the
API lane lands emission, move `GaugeHistorySchema` to
`packages/contracts/src/schemas/gaugeHistory.ts`, export it (and a
`gaugeHistory: (gaugeId: string) => string` entry in the frozen `ENDPOINTS` map)
from `@trout/contracts`, and re-point the web imports — a contracts minor bump,
additive per ADR 0008.

## Consequences

- The water detail page gains a per-gauge history panel (24 h / 7 d / 30 d,
  one chart per metric, gaps drawn as breaks, tabular equivalent, "verify with
  USGS" link) that is completely invisible until the first 200 arrives — the
  site's "90% now, the other lane finishes" pattern.
- Every water whose gauges have no history stays exactly as today (404 → panel
  hidden), so pre-landing traffic is one small 404 per gauge per visit.
- Consumers must respect the gap semantics: a gap is a >3× cadence interval;
  drawing lines across it, or averaging over it, violates the no-interpolation
  rule on both sides of the contract.

## Alternatives considered

- **Serve history from the live API on request** — rejected: breaks the
  offline-first static-serving model (ADR 0004) and adds a per-request source.
- **One merged per-stream file** — rejected: gauges disagree (units, cadence,
  coverage); per-gauge files keep the same-gauge discipline and match the
  per-water file pattern (`fishability`, `release-schedule`).
- **Backfill long-term history from USGS archives** — rejected for this ADR: a
  separate, explicitly-labeled decision; mixing archived and live-ingested rows
  would blur provenance and invite completeness claims.
