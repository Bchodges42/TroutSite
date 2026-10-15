# ADR 0012. Stocking event status (`scheduled` vs `reported`)

## Status

Proposed — 2026-10-14 (data-integrity lane, `claude/data-integrity-20261014`).
Takes effect when the owner merges the branch.

## Context

The 2026-10-14 data-integrity audit (§2) found that TWRA's stocking page carries
two grids: the 2026 stocking **schedule** (plans: exact days, "week of" dates,
month windows) and the **Trout Stocking Locations Report** of completed
stockings (74 rows, Aug 4 – Oct 9 on 2026-10-14). The ingest read only the
schedule, and the PWA labelled every past-dated schedule row "Reported
completed" / "Week of · reported" — a completion claim TWRA never made — while
the real completion report was never shown.

## Decision

`StockingEvent` gains an optional `status: 'scheduled' | 'reported'`.
Schedule rows carry `scheduled`; report rows carry `reported` (always
`datePrecision: 'day'`). Consumers present only `reported` rows as stocked; a
past `scheduled` row is "scheduled date passed", never "completed". Absent
status (older snapshots) means `scheduled`. Contracts advance 2.4.0 → 2.5.0;
storage gains `stocking_events.status` (migration 018).

## Consequences

Additive: older consumers ignore the field. The ingest replaces a state's
`scheduled` rows on every successful fetch (no ghost rows from postponed or
deleted schedule entries), while `reported` rows accumulate as history because
TWRA's report is a rolling window of facts that do not change once published.
