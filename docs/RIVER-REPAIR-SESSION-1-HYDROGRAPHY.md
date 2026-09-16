# Session 1 prompt — authoritative hydrography and water identity

Give this entire file to one GPT-5.6 Luna session.

## Mission

Replace the unsafe September selectable-river repair with deterministic, source-traceable NHD geometry and an explicit identity model. Split the two stocked Cane Creeks. Repair the Forked Deer and Obion systems. Do not redesign map rendering; Session 2 owns that.

## Required reading and rules

Read completely before editing:

1. `AGENTS.md`
2. `docs/ENGINEERING-GUIDE.md`
3. `docs/INDEX.md`
4. `docs/KNOWN-ISSUES.md`
5. `docs/NHD-CONVENTIONS.md`
6. `docs/atlas-sources.md`
7. `docs/atlas-validation.md`
8. `docs/flow-orientation.md`

Binding task rules:

- Work in a fresh clone and your own branch from current `origin/main`.
- Never edit the shared `C:\Users\Benjamin\Projects\trout` checkout.
- Record the starting SHA and baseline results.
- A name is not an identity. Use GNIS, HUC, exact NHD reach identifiers, and directed topology.
- Never draw a straight connector across missing source coverage.
- Never select all same-name segments inside an envelope and assume they form one river.
- Never copy old provenance onto replacement geometry.
- Preserve a truthful source gap if no directed NHD path proves continuity.
- Push after each meaningful commit. Do not merge or deploy.

If blocked on one bounded question, you may ask one GPT-5.6 Sol subagent at a time for a read-only reach-chain analysis or an isolated test file. You own all edits, review, validation, and Git operations.

## Fresh-clone setup

```powershell
Set-Location C:\Users\Benjamin\Projects
git clone git@github.com:Bchodges42/TroutSite.git trout-luna-hydro-identity
Set-Location C:\Users\Benjamin\Projects\trout-luna-hydro-identity
git fetch origin
git switch -c luna/river-hydro-identity origin/main
git config --global user.name "Bhodges42"
git status --short --branch
git rev-parse HEAD
pnpm install --frozen-lockfile
```

If the clone path exists or is claimed by another session, choose a different new directory.

## Baseline

Run and record:

```powershell
pnpm docs:check
pnpm validate:content
pnpm --filter @trout/web test
node apps/web/scripts/validate-atlas.mjs
node apps/web/scripts/audit-river-continuity.mjs
pnpm --filter @trout/web build
```

Do not treat a green baseline as proof that geometry is correct; the present validators do not detect every synthetic connector or identity collision.

## Verified starting defects

- `packages/content/scripts/wave-ledgers/stitch-geometry.mjs` uses `bridgeChains(..., maxBridgeKm = 30)` and inserts direct coordinate connections that are not NHD reaches.
- The same script matches lowercased name plus envelope and can combine branches or unrelated same-name features.
- It can retain `sourceIds` from the geometry it replaced.
- `middle-fork-forked-deer-river` and `north-fork-forked-deer-river` currently have `bridgedSegments: 1`.
- The catalog says `cane-creek` covers Bledsoe/Van Buren and Hickman/Perry, while current atlas geometry covers only the eastern Caney Fork-system creek.
- Eastern Cane Creek: GNIS `01279516`, HUC8 `05130108`.
- Hickman/Perry Cane Creek: GNIS `01307376`, HUC8 `06040004`. Verify its downstream receiving water before final naming; the expected basin is Buffalo River.

## Deliverable A — one catalog identity model

Add optional `hydroIdentity` to `StreamSchema`:

```ts
{
  gnisIds: string[];
  huc8s: string[];
  counties?: string[];
  receivingWater?: string;
}
```

Requirements:

- GNIS and HUC values are strings so leading zeroes survive.
- Present arrays are non-empty and reject duplicates.
- Require `hydroIdentity` for selectable line waters after this migration; do not require it for point ponds or genuinely unnamed waterbodies.
- Require counties for a repeated-name or stocking-ambiguous water.
- Persist the field through the content pack, SQLite migration/seed, `/v1/streams`, and bundled fallback snapshots.
- Add contract, validation, seed, migration, and snapshot tests.

The YAML catalog is the single source of truth for GNIS/HUC/counties/receiver. Do not duplicate those fields in an atlas recipe.

## Deliverable B — one reviewed trace recipe

Create `apps/web/atlas-sources/selectable-water-traces.json`. It contains geometry-selection instructions only:

```json
{
  "id": "catalog-water-id",
  "seedPermanentIdentifiers": ["source-reach-id"],
  "upstreamBoundary": "headwater or reviewed boundary",
  "downstreamBoundary": "mouth or reviewed boundary",
  "allowedNameTransitions": [],
  "allowedSharedReachIds": [],
  "reviewNote": "why these reaches are one product water"
}
```

Rules:

- One record per selectable line water.
- Do not repeat catalog identity metadata here.
- `allowedNameTransitions` permits traversal only when NHD topology proves the next reach.
- Shared reach ownership is empty by default. Any exception names both catalog IDs and explains the managed-reach handoff.
- Sort records and arrays for deterministic output.

## Deliverable C — topology-driven canonical builder

Retire `stitch-geometry.mjs`: delete it after relocating valid sanitization, or make it exit as deprecated. No active command may call `bridgeChains`.

Build or consolidate one selectable-line generator. Reuse the current NHD graph/trace helpers instead of adding another stitch implementation.

The builder must:

1. Load raw flowlines by `permanent_identifier` and join VAA by the same key.
2. Read GNIS/HUC identity from the catalog and seed/boundary policy from the trace recipe.
3. Traverse `hydroseq`/downstream topology when populated.
4. Fall back to source endpoint topology when VAA is unavailable. Ordinary weld tolerance is at most 15 m.
5. Treat a documented dam/pool topology link separately from output geometry. It may relate two parts, but it must not draw a connector with no source reach.
6. Include unnamed/artificial or differently named reaches only when they are the directed path between reviewed reaches.
7. Follow the reviewed main level path for a main-stem feature. Do not concatenate side branches end-to-end. Legitimate braids remain separate parts.
8. Orient source reaches before simplification and preserve endpoints.
9. Emit separate `nhdPermanentIds` and `nhdPlusIds` fields when available. Do not mix identifier types.
10. Recompute bounds, length, part count, vertex count, GNIS/HUC summary, and trace metadata from the delivered geometry.
11. Refuse partial output on validation failure.
12. Produce byte-identical output on a second run.

NHD/NHDPlus HR is canonical for selectable river/creek lines and the detailed context network. NHD waterbody polygons remain canonical for lakes/reservoirs. Point ponds remain points. TIGER may remain only as a per-feature documented exception after proving NHD is inadequate.

Inventory all line features, then rebuild at least:

- all 40 selectable-river expansion additions;
- every Forked Deer and Obion feature listed below;
- every feature carrying `bridgedSegments` or `nhd-network-stitch`;
- every line without exact NHD permanent-reach provenance;
- every line failing connectivity, source-conformance, self-crossing, or duplicate-ownership checks;
- every TIGER line for which adequate NHD geometry exists.

Do not rewrite already correct NHD geometry merely to make every file look new.

## Deliverable D — West Tennessee repair

Review as connected systems:

- `forked-deer-river`
- `north-fork-forked-deer-river`
- `middle-fork-forked-deer-river`
- `south-fork-forked-deer-river`
- `obion-river`
- `north-fork-obion-river`
- `middle-fork-obion-river`
- `south-fork-obion-river`
- `rutherford-fork-obion-river`

For each feature, pin the GNIS identity and outlet/main-path seed. Trace through the NHD graph. Specifically prove:

- North Fork Forked Deer has no backward walk, cross-country chord, repeated reach, or side branch appended to the main stem.
- Middle Fork Forked Deer no longer uses the 12.4 km direct bridge.
- Rutherford Fork is a directed path rather than hundreds of unstitched source fragments.
- Obion remains selectable independently of its forks.

If source coverage has a real gap, preserve separate parts and document it. Do not report source discontinuity as repaired continuity.

## Deliverable E — split Cane Creek

Keep `cane-creek` as the backward-compatible ID for the eastern water:

- name: `Cane Creek (Caney Fork system — Bledsoe/Van Buren)`;
- GNIS `01279516`;
- HUC8 `05130108`;
- notes and aliases describe only this water.

Add `cane-creek-hickman-perry`:

- name: `Cane Creek (Buffalo River system — Hickman/Perry)` only after the directed downstream trace confirms Buffalo River; otherwise use the verified receiver;
- GNIS `01307376`;
- HUC8 `06040004`;
- region `tn-middle-duck-elk`, unless current region definitions provide a more accurate existing choice;
- its own geometry, index entry, deep link, search result, and metadata.

Update all aliases, stocking/evidence matching, calendars, fixtures, and generated snapshots:

- Hickman and Perry rows resolve to `cane-creek-hickman-perry`.
- Bledsoe and Van Buren rows resolve to `cane-creek`.
- County-less `Cane Creek` remains ambiguous and unresolved.
- Search for `Cane Creek` returns two qualified results.

The final catalog count is the starting count plus one; derive the number instead of hard-coding 190.

## Deliverable F — identity and geometry audit

Create `apps/web/scripts/audit-water-identities.mjs` and wire it into a normal validation command.

It must fail for:

- missing catalog identity or trace recipe for a selectable line;
- catalog GNIS/HUC inconsistent with the source reaches used;
- emitted reach ID absent from committed raw NHD input;
- a reach owned by two catalog waters without an explicit exception;
- unrelated disconnected GNIS identities inside one catalog feature;
- any `bridgedSegments`, synthetic connector, or `nhd-network-stitch` output;
- a weld over 15 m in ordinary flowline assembly;
- a non-finite/out-of-bounds coordinate;
- delivered geometry outside the documented simplification tolerance of its source reaches;
- non-deterministic generated output.

Repeated NHD names outside the catalog should be reported for review, not automatically promoted to selectable waters.

## Tests and validation

Add focused regression tests for:

- both Cane Creek identities, bounds, reach ownership, search results, and county matching;
- county-less Cane Creek ambiguity;
- each West Tennessee target’s directed source chain;
- no synthetic connectors and no reach-ID mismatch;
- no duplicated reach ownership;
- generator idempotence.

Run:

```powershell
pnpm docs:check
pnpm validate:content
pnpm --filter @trout/contracts test
pnpm --filter @trout/api test
pnpm --filter @trout/web test
node apps/web/scripts/audit-water-identities.mjs
node apps/web/scripts/validate-atlas.mjs
node apps/web/scripts/audit-river-continuity.mjs
node apps/web/scripts/integrate-verified-atlas.mjs --dry-run
pnpm --filter @trout/web build
```

Run every relevant generator twice and confirm the second run leaves no diff.

## Commit and handoff

Use focused commits: identity contract/persistence; trace builder/audit; West Tennessee regeneration; Cane Creek split; documentation/tests. Push after each.

Your final report must include:

- starting and ending SHA;
- pushed branch;
- exact waters rebuilt and exact exceptions retained;
- before/after parts, length, source-reach count, and largest unexplained gap for each West Tennessee target;
- the two Cane Creek receiver traces;
- test commands and results;
- deterministic second-run result;
- clean `git status --short`;
- residual uncertainty stated plainly.

Do not claim all Tennessee rivers are correct. Claim only the invariants you measured.
