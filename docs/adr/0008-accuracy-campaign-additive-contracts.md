# ADR 0008. Accuracy campaign additive contracts

## Status

Accepted — 2026-09-13

## Context

The accuracy campaign adds authored stream metadata, dissolved-oxygen constraint
context, flow-trend context, and a static release-schedule endpoint. Existing
snapshot consumers must continue to parse every previous payload.

## Decision

Add only optional stream/reading/context fields and the additive
`GET /v1/release-schedule/{waterId}.json` endpoint. Release schedules carry TVA's
published generator block precision and forecasts are presentation-only; neither
is an activity-score factor. Dissolved oxygen is retained for constraint warnings
and is never a positive score input. The contracts package advances from 2.0.0 to
2.1.0. Existing exports and endpoint shapes remain compatible.

## Consequences

Consumers may ignore the new fields safely. Producers must continue to validate
all snapshots before writing them. A missing or unavailable upstream schedule is
represented explicitly rather than as an invented release.
