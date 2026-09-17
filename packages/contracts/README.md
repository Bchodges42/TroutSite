# @trout/contracts

**Frozen at tag `contracts-v2.3.0`. OWNER: ROLE 1.** Every other role consumes this package; only
Role 1 may change it, and only additively with an ADR in `docs/adr/` plus a tag bump. Never
rename or remove an export.

## What it provides

1. **Zod schemas + inferred TypeScript types** for every §6 data contract:
   `StreamSchema/Stream`, `GaugeReadingSchema/GaugeReading`, `ConditionSnapshotSchema/ConditionSnapshot`,
   `StockingEventSchema/StockingEvent`, `BugTaxonSchema/BugTaxon`, `FlyPatternSchema/FlyPattern`,
   `HatchChartSchema/HatchChart`, `ShopSchema/Shop`, `ShopReportSchema/ShopReport`,
   `BugObservationSchema/BugObservation`, plus shared primitives (`StateIdSchema`, `IsoDateSchema`,
   `IsoDateTimeSchema`, `WaterbodyTypeSchema`, `IdealFlowSchema`, `OfficialSourceSchema`,
   `HydroIdentitySchema`, enum schemas). Line waters carry stable GNIS/HUC identity;
   still-water records may omit it.
2. **`ENDPOINTS`** — the frozen endpoint map (see `src/endpoints.ts`). GET routes are
   snapshot-served JSON; `POST /v1/portal/reports` is the only live route.
3. **Pure client-side logic** — deterministic, no clock, no network, no randomness:
   - `scoreConditions(stream, readings): ConditionScore` — 0–100 fishability score + plain-English reasons.
   - `matchHatch(observation, charts, taxa): RankedTaxon[]` — transparent attribute-match ranking
     (attribute match count + hatch-chart boost + month/region record). See module headers for the
     exact frozen scoring model and edge-case semantics (empty readings, foreign gauges, unknown
     taxa, month boundaries).

## Usage

```ts
import { StreamSchema, ENDPOINTS, scoreConditions, matchHatch } from '@trout/contracts';

const stream = StreamSchema.parse(yamlOrJson); // throws ZodError on contract violation
const score = scoreConditions(stream, readings); // { value: 0-100, reasons: string[] }
const ranked = matchHatch(observation, hatchCharts, taxa); // highest score first
```

The PWA imports this to run scoring and hatch matching **on the visitor's device** (offline-safe);
the API imports it to validate ingestion and to serve snapshots that already conform.

## Build/test

- Build first (`pnpm --filter @trout/contracts build`) — consumers resolve `dist/` at runtime.
- `pnpm --filter @trout/contracts test` runs Vitest with an enforced **≥90% coverage** gate on `src/`.
