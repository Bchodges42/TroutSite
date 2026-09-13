# Stage 3 — Session C report (fishability UI, F6)

Base SHA: 877cd39dd521034fe83942eb624e8fb340f51999 (origin/main)
Branch: session-c-stage3 · pushed after each task (see git log).

## Status

**DONE.** All four tasks implemented with tests; full gates green:
web typecheck + 284 unit tests (29 files) + `pnpm -r build` clean +
**full e2e 91/91 across all four projects** (87 prior + 4 new fishability
specs). The fishability UI runs on fixture species data now and consumes
Session B's real F3 data at the checkpoint without further changes — the data
layer reads the frozen `/v1/fishability/<id>.json` contract and the catalog's
`targetSpecies`.

## Per-item evidence

### TASK 1 — site-wide species mode

- `SettingsRecord.speciesMode: 'trout' | 'all'` (Dexie-persisted, default
  **trout**), surfaced in Settings ("Waters" card) and as a compact header
  `SpeciesModeToggle` visible on every route.
- The toggle clears the map's `?species=` URL override when used on the map —
  otherwise the override would mask the just-chosen setting.
- The map's `?species=` param now READS the setting when absent; a URL value
  still overrides for shareable links.
- Every surface passes the effective mode into the decision calls:
  conditions rows/sections, browse rows, map (filter/visibility/colors/rows).
- Stocking's species filter is trout-type-level (rainbow/brown/…) and already
  defaults to "all" — the mode has nothing to change there (noted, no code).
- Tests: `species-mode.test.tsx` (default + Dexie persistence + override
  clearing).

### TASK 3 — decision model feeds on real snapshot data (done before TASK 2, which consumes it)

- `waterDecision.toWaterDecisionView(feature, mode, month?, fishability?)`:
  in all-fish mode, a water whose snapshot carries an **assessed** comfort
  score for the focus species wears `displayMetric: 'fishability'`;
  `decisionStatusText` maps the comfort value through the same Good/Fair/Poor
  ladder; `decisionColorToken` returns the band token — including for
  warmwater waters (previously always bronze). Unknown-species waters stay
  honestly classified and trout mode is behaviorally untouched.
- Data layer `lib/fishability.ts`: `useFishabilityForWater` (single water,
  drawer/detail) and `useFishabilityIndex` (all-fish map/list surfaces —
  bounded pool of 6 over per-water files, one retry pass, Dexie-cached via the
  shared offline-first `fetchSnapshot`). `catalogFocusSpecies` + the frozen
  `SPECIES_LABELS` power the picker.
- Tests: 6 fishability cases in `water-decision.test.tsx` (wear/bands/colors,
  unassessed honesty, unknown-species, trout-mode invariance).

### TASK 2 — species focus picker (all-fish mode)

- The map filter row gains a species `<select>` (options = the catalog's
  `targetSpecies` union) shown only in all-fish mode; it writes the shareable
  `?focus=` param AND persists `speciesFocus` so conditions/browse honor the
  same species. The map URL override wins when present.
- The focus flows through `useRiverMapData` (`focusSpecies` option) into every
  feature; map colors, legend help, index rows ("84 / 100" + band), drawer and
  detail all reflect THAT species' comfort score from the snapshots.
- New `FishabilityCard` component (drawer WaterTab + detail page): species
  name, comfort pill (aria "… fishability N out of 100 — band"), reasons, and
  the observation timestamp. Honest "No data" when the species is cataloged
  but not assessable; renders nothing outside all-fish + focus or when the
  water carries no score for the species.
- Fixture species data (my lane per the brief): fixture-catalog warmwater
  waters carry `targetSpecies`; six schema-validated
  `fixtures/data/v1/fishability/<id>.json` snapshots (Good/Fair/Poor/No-data
  cases). The e2e spec route-serves the fixture catalog because the static
  server resolves `/v1/streams` to the generated `public/v1/streams.json`
  (gitignored; gains `targetSpecies` when Session B's F3 lands).
- Tests: `fishability-card.test.tsx` (pill + reasons, honest No data, strict
  scoping) + `e2e/web/fishability.spec.ts` (map rows, picker persistence,
  detail card, drawer card — 4 specs).

### TASK 4 — honest presentation sweep

- All-fish mode: warmwater waters wearing the focus species' fishability show
  that species' band/pill — never trout language; waters without it keep the
  honest "Warmwater"/"Unverified" labels. Trout waters keep trout-condition.
- Legend title per mode already landed in Stage 2 ("Trout conditions" /
  "Water guide"); the map help now names the focused species ("Colors show
  Largemouth bass fishability from the latest snapshots…").
- Comfort ONLY: no activity total/breakdown anywhere — the FishabilityCard and
  the e2e spec assert its absence (F10 is Stage 4).

## Verification

- `pnpm --filter @trout/web typecheck` — **PASS**
- `pnpm --filter @trout/web test` — **PASS** (29 files / 284 tests)
- `pnpm -r build` — **PASS** (incl. size-budget OK)
- Full e2e (`playwright test`, all projects) — **91/91 passed**; the
  fishability specs also pass in isolation repeatedly.
- Web lint: src/test clean (pre-existing `apps/web/scripts/**` errors remain —
  Session B's slice, flagged in Stage 2).

## Blockers

None. Notes for the checkpoint / other sessions:

- **Checkpoint (Session B's F3):** when real content-pack `targetSpecies` and
  pipeline fishability files land, the UI needs no changes — the fixture
  files live under `apps/web/fixtures/data/` (test lane) and the e2e spec
  route-serves only the catalog. If F3's real waters use species keys beyond
  the frozen seven, the picker/pills pick them up automatically.
- `sirv` (vite preview) resolves the extensionless `/v1/streams` to
  `streams.json` when both exist — worth knowing for future fixture work.
- Stage-4 reminders: activity breakdown (F10) renders nothing today by
  design; `ActivityOutlook` is already carried in the fetched snapshots.
