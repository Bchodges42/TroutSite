# Stage 2 — Session B report (build & content)

Base SHA: `3c329601e22facb755fdbbe0fd786d07579c3617` (origin/main; branch `session-b-stage2`)

## Status

- [x] SETUP — branch/report/push
- [x] TASK 1 — T2-55: catalog-pid exclusion in nhd-network-build.mjs + regenerate
- [x] TASK 2 — F2 finish: sourced per-species reference data + validator gate
- [x] TASK 3 — F3 prep: 148-water species mapping + unresolvedAlias fold-in (draft only)

## Per-item evidence

### SETUP

- Branch `session-b-stage2` cut from `origin/main` @ `3c32960` (Session A's T2-46
  untracking of the node_modules symlinks is in this base — my clone's local
  deletion state was restored before switching). Report scaffold pushed.

### TASK 1 — T2-55: statewide catalog-pid exclusion

- `scripts/nhd_lib.mjs`: new shared `catalogPidsFromAsset(assetPath)` (collects
  every `properties.sourceIds` pid from rivers.geojson — 9,995 unique pids).
- `scripts/nhd-network-build.mjs`: excludes any named flowline whose
  `permanent_identifier` is a catalog pid (same mechanism as d51f307's
  region proof, now statewide); per-unit `excludedCatalog` count; coverage
  reconciliation extended to `emitted + degenerate + catalog-excluded = source`;
  manifest gains additive `catalogExcluded {asset, pids, lines}` provenance.
- Gates/validator kept reconciled: `nhd-network-gates.mjs` G8 now treats catalog
  pids as must-be-absent (leak check) and skips them in source-parity; G9's
  pipeline re-run counts exclusions separately. `nhd-network-validate.mjs`
  U3/U4 mirror both (new `--asset` / `catalogAsset` input, fixture tests unaffected
  via default empty set).
- Build evidence (58 units): **186,800 emitted + 0 degenerate + 9,308
  catalog-excluded = 196,108 source lines** — full reconciliation, 0 MISMATCH.
- Gates + validator: `ALL GATES PASS`; `NETWORK VALIDATION PASS`
  (23 clusters, 105,540 km; report at data/nhd/derived/validate/network-report.json).
- **Spot-check (Barren Fork / Collins River):** clusters covering the region
  (0513ab, 0513b, 0602b, 0604a; 30,149 lines scanned) → **0 excluded-pid leaks**.
  53 lines still carry the names "Barren Fork"/"Collins River" — they are
  different NHD segments (Middle Prong Collins tributary, short braids/stubs
  0.08–3.08 km, e.g. pids 44693547, 44693183, 51184593) that the catalog never
  traced (not in sourceIds), so they are legitimate network additions, not
  shadow duplicates of catalog linework.
- Full build after regeneration: green (install-time 10.8 MB; the excluded lines
  shrank on-demand atlas bytes).

### TASK 2 — F2: per-species reference data + validator gate

- Canonical data: `packages/content/species/species-reference.yaml`
  (schema `trout/species-reference/1`), 7 species. New research this session:
  NDEP per-species thermal tolerance analyses (agency-published, Brungs & Jones
  methodology) for all seven species — chronic MWAT (avoidance ceiling) and
  acute MDMT (lethal ceiling):
  | species | avoidance (chronic) | lethal (acute) |
  |---|---|---|
  | largemouth | 32°C | 34°C |
  | smallmouth | 29°C | 31°C |
  | spotted | 32°C | — (NDEP recommends none) |
  | crappie | 28°C | 31°C |
  | bluegill | 32°C | 35°C |
  | channel catfish | 32°C | 35°C |
  | striped bass | 30°C | 32°C |
  plus preferred/occupied values (largemouth preferred 26.7–30.0°C; smallmouth
  field-activity 20.0–26.7°C via Little River Outfitters; striped bass occupied
  14.6–22.0°C via Coutant et al. 1984 in the NDEP analysis) and spawn windows
  (largemouth FishUSA 15.6–23.9; smallmouth LRO 12.8–21.1; spotted TPWD 13.9–23.3;
  crappie TWRA Watts Bar 15.6–20.0; bluegill MU Extension onset 23.3; catfish
  CatfishNow 21.1–29.4). Every shipped value carries its https source list.
- Honestly unsourced → `citationStatus: needs-source` with null values (the only
  uncited escape the gate allows): all lower-active bands, spotted optimal,
  spotted lethal, crappie/bluegill/catfish optimal, bluegill spawn end, striped
  bass spawn window, and ALL flow-trend + pressure-trend preferences (heuristic
  grade — flagged, never guessed).
- Citation gate: `loadSpeciesReference()` in `scripts/lib.ts` +
  `checkSpeciesDoc()` (exported for negative tests). validate:content FAILS on:
  any numeric value without sources, any non-https source, any all-null band
  missing the needs-source flag, any needs-source band carrying values, plus
  coherence failures (optimal > avoidance, avoidance ≥ lethal, spawn onset >
  end). Emitted to the pack as `species.json` (152 files, 1.05 MB).
- Tests: content suite 17/17 (7 new: full-load + 4 negative gate cases +
  structure). Full build green.

### TASK 3 — F3 prep: species mapping (gated draft)

- New generator `packages/content/scripts/f3-species-mapping.mjs` (rerunnable;
  reads streams YAML + the shipped evidence feed + an `--unresolved` JSON from
  the ingest log). Writes `packages/content/research/f3-species-mapping.yaml`
  (schema `draft/f3-species-mapping/0`). **No stream YAML species field touched**
  — the file is explicitly gated on Session A's F1 species enum.
- Result over the 148 catalog waters:
  - **80 evidenced** — proposed species = the exact trout species in resolved
    TWRA stocking rows (each carrying event counts + the TWRA source URL);
  - **11 inferred (review-flagged)** — tailwaters with no resolved rows yet get
    the documented rainbow+brown program inference (carries the T1-7 caveat:
    the unresolved "South Holston TW"-style rows are why the evidence is
    missing), plus warmwater-marker waters typed largemouth+bluegill pending
    per-lake confirmation;
  - **57 needs-evidence** — no TWRA evidence in the capture: species stays
    unknown (F3 rule: unknown stays unknown).
- UnresolvedAliasRows folded in: captured 264 rows from a fresh ingest run,
  deduped by name+county to **58 candidate waters** (top: Gatlinburg Streams ×52,
  Green Cove Pond ×29, Paint Creek ×13 …) shipped inside the mapping file as
  `candidateWatersFromUnresolvedAliases` — the T3-52 expansion worklist with
  counties, ready for F3 catalog authoring once the enum lands.
- Gates: validate:content OK (research/ is inert to the loader), content 17/17,
  `pnpm -r build` green.

## Verification

- TASK 1: gates + validator PASS (evidence above); content 12/12 at push time;
  `pnpm -r build` green.
- TASK 2: validate:content OK (incl. 7 species references); content tests 17/17;
  `pnpm -r build` green (size-budget OK; species.json adds ~11 KB on-demand).
- TASK 3: draft generator + mapping committed; all cadence gates green;
  final cadence re-run after TASK 3: content 17/17, build green.

## Blockers

(none yet)
