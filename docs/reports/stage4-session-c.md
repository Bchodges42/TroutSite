# Stage 4 — Session C report (activity layer UI: F10/F11/F12)

Base SHA: 7c6133cffc23c0bfd917b64c1c8b72efdfa582b1 (origin/main)
Branch: session-c-stage4 · pushed after each task (see git log).

## Status

**DONE.** All four tasks implemented with tests. Final gates: web typecheck +
**294 unit tests (30 files)** + web lint clean (src/test; `apps/web/scripts/**`
pre-existing errors remain Session B's) + `pnpm -r build` clean (size-budget
OK) + **full e2e 91/91 across all four projects**, including the Stage-3
fishability specs extended for F10.

## Per-item evidence

### TASK 0 — flaky-spec stabilization

Root cause of the once-failing "search, inspector tabs, Escape hierarchy"
spec: on a cold first visit the header catalog fetch is still in flight when
`select()` pressed Enter — the results listbox still said "catalog is
loading", Enter no-op'd, and the inspector never opened. Fix: `select()` now
waits for the search's match to be VISIBLE in the listbox (20 s) before
pressing Enter — initialization is deterministic before any search
interaction. Three consecutive isolated runs green, plus the full suite.

### TASK 1 — F10 activity breakdown (detail + drawer)

- `FishabilityCard` renders the served `ActivityOutlook` as ordered
  per-factor rows: value (0–100), weighted contribution in points, source
  link (`evidenceUrl`), and a confidence chip (measured / derived /
  heuristic). Wording is "Activity outlook: N / 100" with the neutral-50
  explainer and "context, not a promise" — never "fish will bite".
- Pressure rows read **"Area pressure"** regardless of the pipeline label
  (NWS stations map to REGIONS — never presented per-water).
- Empty outlook renders honest "No activity data yet…", never a zero score.
- Map stays comfort-colored — activity renders only on the detail surfaces.
- Fixtures: harpeth-river carries a schema-valid two-factor outlook
  (temperature measured + NWS pressure derived; contribution = weight ×
  (value − 50) per the contract); norris-lake crappie covers an outlook with
  no pressure factor.
- Tests: card unit tests (rows, contribution formatting, confidence chips,
  source links, honest empty case) + fishability e2e asserting the rendered
  rows on detail.

### TASK 2 — F11 today's windows (client-side, deterministic)

- `lib/solar.ts`: NOAA-spreadsheet solar position (declination + equation of
  time) with an epoch-anchored Julian day; sunrise/sunset at zenith 90.833°;
  windows = ±60 min around each crossing. No API, no location permission.
- `SolarWindowsCard` on the detail page: "Today's windows" dawn/dusk local
  times, labeled **heuristic**, coordinates from the bundled river-index
  anchors; renders nothing when the water has no anchor or the sun does not
  cross (nulls, never fabricated times).
- Tests: `solar.test.ts` cross-checks Nashville (Jun 21) and Memphis
  (Jan 15) sunrise/sunset against canonical NOAA-spreadsheet values within
  ±5 min, plus window structure, determinism, consecutive-day monotonicity,
  and polar-null honesty. (The first cut of `julianDay` was 14 days off —
  caught by exactly these reference tests and replaced with the
  epoch-anchored formula.)

### TASK 3 — F12 rain context note (NWS-driven, context only)

- `RainContextNote` (in FishabilityCard, so detail + drawer): when the water's
  outlook carries an **area-pressure** factor clearly below neutral (≤ 45 of
  100 — falling), it shows "Recent rain is likely in the area — expect stain
  and rising water on rain-fed reaches", attributed "From area pressure
  (NWS) — context only, not part of the score."
- Honesty: falling area pressure is the actual NWS-derived signal the pipeline
  serves today (F8 ingests pressure; no precipitation metric exists in the
  contract, and scoring rain would violate measured-not-guessed per F12's own
  design note). The note never renders from nothing, is excluded from every
  score, and stays hidden until the pipeline carries the factor.
- Fixtures cover falling (harpeth, 42) and steady (norris crappie, 58)
  pressure; unit tests assert both the note and its absence.

## Verification

- `pnpm --filter @trout/web typecheck` — **PASS**
- `pnpm --filter @trout/web test` — **PASS** (30 files / 294 tests)
- `pnpm --filter @trout/web lint` — src/test clean (scripts/** errors remain
  Session B's, flagged in Stage 2)
- `pnpm -r build` — **PASS** (size-budget OK)
- Full e2e (all projects) — **91/91 passed**

## Blockers

None. Notes:

- When Session A's emission joins the pressure-trend factor into live
  fishability rows (their stage-4 work), the note and the Area-pressure row
  light up with no UI change — the fixtures already exercise that shape.
- F10's factor set is rendered generically; spawn-state (F9) rows appear
  automatically with their own labels/links when the pipeline adds them.
