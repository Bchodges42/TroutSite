# Session Brief 1 — Atlas Pipeline & Provenance

_Role: data engineer. **Wave 1 — runs concurrently with Sessions 2 and 3**
(disjoint files). One working session. Details live in
`docs/remaining-changes-implementation-guide.md` (the "master guide") — this
brief defines scope, boundaries, and the gate. Read master guide §0 (Ground
rules) before starting._

## Mission

Make the atlas context files (boundary, counties, states, places) reproducible
from official sources with checked-in scripts, and fix the documentation that
lies about the current data. **No application code changes in this session.**

## Critical rules (repeated from master guide §0 — non-negotiable)

- Never reset, checkout, stash, or discard anything in the working tree.
- `apps/web/public/atlas/rivers.geojson` must stay **byte-identical** — check
  `git diff --stat apps/web/public/atlas/rivers.geojson` is empty at the end.
- `apps/web/fixtures/data/v1/` is untouchable.
- Do not commit (commits are gated in Session 3).

## Scope — master guide tasks, in order

| Task (master guide) | One-liner | Files touched |
|---|---|---|
| **Task 1** | Correct white-oak-creek "91/92, absent" → "92/92, resolved" in atlas-sources.md | `docs/atlas-sources.md` |
| **Task 2** | Point context downloads at the real GENZ cb_ series; fix extraction skip-stems; extract the three missing `.shp` | `apps/web/scripts/fetch-atlas-sources.mjs` |
| **Task 3** | New deterministic generator for the 4 context intermediates (kills the mapshaper dependency) | new `apps/web/scripts/build-atlas-context-sources.mjs`; outputs `public/atlas/{places.json,tn-boundary,tn-counties,states-context}.geojson`; docs edits in `docs/atlas-sources.md` |
| **Task 4** | Replace the SyntaxError-exiting retired generator with a clean tombstone | `apps/web/scripts/build-atlas.mjs` |

## File ownership (hard boundary — parallel session safety)

**May touch:** `docs/atlas-sources.md`, `apps/web/scripts/fetch-atlas-sources.mjs`,
`apps/web/scripts/build-atlas-context-sources.mjs` (new),
`apps/web/scripts/build-atlas.mjs`, `apps/web/.atlas-src/**` (git-ignored cache),
and the four published context outputs named above (as pipeline *outputs*).

**Must NOT touch:** `apps/web/src/**`, `e2e/**`, `apps/web/public/atlas/rivers.geojson`,
root or app `package.json`, `e2e/playwright.config.ts`, `apps/web/fixtures/**`.
(Sessions 2 and 3 are concurrently editing app code and e2e specs.)

## Wave-1 protocol (all three Wave-1 sessions share one workspace)

- **Do not run `pnpm build`, `pm2`, or Playwright during Wave 1** — a build
  compiles other sessions' in-flight edits; the first full build belongs to
  Session 5. (Your scripts don't compile app code, so this costs you nothing.)
- Replace the `pnpm typecheck && pnpm test && pnpm build` regression line in
  the gate below with `node --check` on your three scripts (syntax gate);
  the full build/test regression runs in Session 5/6 over the merged tree.
- No dev server or browser needed in this session — your work is scripts and
  data, verified by running them. (Sessions 2 and 3 own the Wave-1 dev
  servers on 5173/5174; don't start either.)

## Working style — subagents (glm-5.3-flash)

Do the small fixes yourself in the main chat — Tasks 1, 2, and 4 are a few
lines each; an agent costs more than the edit. The one big task goes to a
subagent:

- **You (main chat):** Task 1 (doc correction + greps), Task 2 (URL/stem
  fixes, both runs), Task 4 (tombstone), the Task 3 Step 3.3 diff review
  (judgment), and the session gate.
- **Subagent — Task 3:** the whole generator task: create
  `build-atlas-context-sources.mjs` from the master guide (keep the code
  verbatim — it was validated against the real Census data; that's a
  constraint, not a style preference), run it plus `build-atlas-context.mjs`,
  run the Step 3.4 sanity check, report outputs. Same model as you — hand it
  the task and the gate lines and let it work.

Review the returned diff, then run the session gate.

## Session gate (all must pass before handoff)

```bash
cd /c/Users/Benjamin/Projects/trout
node apps/web/scripts/validate-atlas.mjs        # "features: 92 unique ids: 92" + PASS
cd apps/web
node scripts/fetch-atlas-sources.mjs            # second run: NO unzip lines (idempotent)
node scripts/build-atlas-context-sources.mjs    # boundary 1, neighbors 8, counties 95, places 71 (6 cities)
node scripts/build-atlas-context.mjs            # 4 context files published
node scripts/build-atlas.mjs ; echo $?          # RETIRED message, exit 1 (NOT a SyntaxError)
node --check scripts/fetch-atlas-sources.mjs \
  && node --check scripts/build-atlas-context-sources.mjs \
  && node --check scripts/build-atlas.mjs      # syntax gate (full build = Session 5)
cd ../..
git diff --stat apps/web/public/atlas/rivers.geojson   # EMPTY
grep -c "91/92" docs/atlas-sources.md           # 0
```

Manual: the Task 3 Step 3.3 diff review and Step 3.4 places sanity check.

## Handoff to Sessions 5 and 6

Report: scripts added/changed, whether `places.json` coordinates shifted (they
should, slightly — the acceptance note in master guide Task 3 covers this), any
Census source surprises. Known ripple: none blocking — label *text* is
unchanged, so the `Nashville` e2e assertion still matches. Session 5's first
full build compiles your tree together with Sessions 2–3's; Session 6 audits
everything.

## Stop conditions

- GENZ download URLs wrong after one verified correction → stop, report the URL
  that worked.
- Places count ≠ 71 after fixing an obvious name-table typo → stop, report the
  actual NAMEs diff; do not adjust expected counts.
