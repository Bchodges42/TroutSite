# Session Brief 3 — Map Rendering Core (wide water, readiness, honesty)

_Role: frontend (map internals). **Wave 1 — runs concurrently with Sessions 1
and 2** (disjoint files). Details live in
`docs/remaining-changes-implementation-guide.md` (the "master guide"); read its
§0 (Ground rules) first, then this brief's Wave-1 protocol._

## Mission

Fix what renders wrong inside the map canvas: wide-water rivers drawing as boxy
ring outlines (the user-visible defect), publish test-readiness flags, and make
no-data rivers honest ("No data", never "0 · Poor").

## Wave-1 protocol (all three Wave-1 sessions share one workspace)

- **Never run `pnpm build`, `pm2`, or any Playwright command** during Wave 1 —
  a build can compile another session's half-finished edits. Full builds and
  e2e belong to Sessions 5 and 6.
- Manual visual checks: start YOUR OWN dev server on your assigned port —
  `DEV_FIXTURES=1 pnpm --filter @trout/web dev -- --host 127.0.0.1 --port 5174 --strictPort`
  → use `http://127.0.0.1:5174` (Session 2 is assigned 5173; never touch its
  server or pm2's 8787). Rivers/atlas GeoJSON are static public assets, so
  wide-water rendering is fully checkable there; selected-river orange renders
  regardless of condition data. Stop the server when done.
- Browser use: you (the main agent) may drive Browser Use yourself for these
  checks. Your subagents cannot — visual verification is always yours.
- Gate = typecheck + unit tests + manual dev-server checks only.

## Critical rules

- Never reset/checkout/stash/discard the working tree; Sessions 1 and 2 are
  editing it right now. Touch only your ownership list.
- `apps/web/public/atlas/rivers.geojson` must stay **byte-identical** — the
  box-shape fix is style-only; the underlying AREAWATER polygons are correct
  official data.
- East Fork Stones values must keep rendering (37 / 19.3 cfs / 50–400 / no
  temp).
- Do not commit (gated in Session 6).
- **No basemap work here** — no `variant`/`basemap` props, no night palette,
  no `setStyle`. The complete basemap feature is Session 4, which builds on
  your handed-off `mapStyle.ts`/`TennesseeMap.tsx`.

## Scope — master guide tasks, in order

| # | Task | One-liner | Files |
|---|---|---|---|
| 1 | **5** | `data-map-ready` / `data-map-failed` flags on the map container (Session 5's E2E hardening depends on this) | `TennesseeMap.tsx` |
| 2 | **6b** | `$type` filters on all line layers; wide-water wash + hairline shore + interior hatch glow; `mouseleave` on `rivers-water` | `mapStyle.ts`, `TennesseeMap.tsx` |
| 3 | **6f** | No-data rivers render "No data" instead of "0 · Poor" | `riverMapSelectors.ts`, `RiverDrawer.tsx` |

## File ownership (hard boundary)

**May touch:** `apps/web/src/features/map/TennesseeMap.tsx`,
`apps/web/src/features/map/mapStyle.ts`,
`apps/web/src/features/map/riverMapSelectors.ts`,
`apps/web/src/features/map/RiverDrawer.tsx`.

**Must NOT touch:** `RiverMapPage.tsx`, `MapLegend.tsx`, `AppShell.tsx`,
`index.css` (Session 2, concurrent); `mapTokens.ts` (Session 4 — do not add the
night palette); `apps/web/scripts/**`, `docs/**`, `public/**` (Session 1 /
others); all `e2e/**`; both `package.json`s.

## Working style — subagents (glm-5.3-flash)

Small fixes stay in the main chat: Task 5 is three tiny edits and Task 6f is a
small selectors change — do them yourself. The one big task goes to a
subagent:

- **You (main chat):** Task 5 (readiness flags), Task 6f (no-data honesty),
  the manual visual checks, and the review of the subagent's diff.
- **Subagent — Task 6b:** the whole wide-water fix — the `mapStyle.ts` layer
  stack rewrite (every `$type` filter, the wash / shore / hatch-wash layers)
  plus the `TennesseeMap.tsx` hover binding, verified against the manual
  checks it can run itself on the dev server. Hand it the master-guide task,
  this brief's ownership list, and the gate lines; same model as you — let it
  read the current style file and implement. Don't hand it a pre-chewed
  fragment of the layer stack.

Review the returned diff (typecheck after), then run the session gate.

## Session gate

```bash
cd /c/Users/Benjamin/Projects/trout
pnpm --filter @trout/web typecheck     # silent, exit 0
pnpm --filter @trout/web test          # 7 files / 47 tests green (add a tiny
                                       # plainStatus case if 6f wants coverage)
git status --short                     # only the four ownership files
git diff --stat apps/web/public/       # EMPTY
```

Manual (dev server): `/?river=hiwassee-river` → soft orange wash + 2.5 px
shore, no thick ring, no boxy county edges; `/?river=east-fork-stones-river`
→ unchanged line rendering (orange line + halo); Hatches mode → wide-water
interior glow, lines halo as before; click wide-water center → inspector
opens; hover off wide water → cursor resets; a no-reading river → "No data"
gray, EFS still "37 · Poor". Inspect DOM: `data-map-ready` appears on the map
container once idle.

## Handoff

Report to Session 4: `mapStyle.ts` layer stack now uses `LINES_ONLY`/
`POLYS_ONLY` filters — Step A2's parameterization must keep them; readiness
flags live in `TennesseeMap.tsx` (Session 5's Task 7 waits on them). Note any
`setStyle` interaction you foresee with feature-state re-application.

## Stop conditions

- `mapStyle.ts`/`TennesseeMap.tsx` diverge materially from the master guide's
  quotes → stop, report.
- Wide water becomes unclickable after the filter change → the click list must
  keep `rivers-water`; if it still fails, stop and report rather than
  re-adding polygon support to line layers.
- Ink/night or topo anything appears to be needed → it isn't; that's Session
  4. Stop and report instead of starting it.
