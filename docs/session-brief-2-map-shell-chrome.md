# Session Brief 2 — Map Shell & Chrome (fullscreen, hamburger, legend)

_Role: frontend. **Wave 1 — runs concurrently with Sessions 1 and 3** (disjoint
files). Details live in `docs/remaining-changes-implementation-guide.md` (the
"master guide"); read its §0 (Ground rules) first, then this brief's Wave-1
protocol._

## Mission

The map opens as the only view — edge-to-edge on every viewport — with one
hamburger drawer for all navigation, a docked legend, and the badge fix. Per
the owner: "full screen, polished, expensive."

## Wave-1 protocol (all three Wave-1 sessions share one workspace)

- **Never run `pnpm build`, `pm2`, or any Playwright command** during Wave 1 —
  three sessions share `apps/web/dist`, the preview server, and pm2; a build
  here can compile another session's half-finished edits and fail confusingly.
  Full builds and e2e belong to Sessions 5 and 6.
- Manual visual checks: start YOUR OWN dev server on your assigned port —
  `DEV_FIXTURES=1 pnpm --filter @trout/web dev -- --host 127.0.0.1 --port 5173 --strictPort`
  → use `http://127.0.0.1:5173` (Session 3 is assigned 5174; never touch its
  server or pm2's 8787). Stop it when done.
- Browser use: you (the main agent) may drive Browser Use yourself for these
  checks. Your subagents cannot — visual verification is always yours.
- Gate = typecheck + unit tests + manual dev-server checks only.

## Critical rules

- Never reset/checkout/stash/discard the working tree; Sessions 1 and 3 are
  editing it right now — `git status` will show their files. Touch only your
  ownership list.
- `apps/web/public/**` and `apps/web/fixtures/**` are frozen.
- Do not commit (gated in Session 6).
- **No basemap UI in this session** — no variant prop, no switcher button,
  nothing touching `mapStyle.ts`/`TennesseeMap.tsx`/`mapTokens.ts`. The
  complete basemap feature (Ink + Topo, UI included) is Session 4, after this
  session hands off `RiverMapPage.tsx`.

## Scope — master guide tasks, in order

| # | Task | One-liner | Files |
|---|---|---|---|
| 1 | **6c** | Fullscreen shell: remove header-on-map/sidebar/bottom-tabs everywhere; hamburger in the map top bar via `useShell()`; `h-dvh` root; new `shell.spec.ts`; one-line drawer-open insertion in `offline-cold-start.spec.ts` | `AppShell.tsx`, `RiverMapPage.tsx`, new `e2e/web/shell.spec.ts`, `e2e/web/offline-cold-start.spec.ts` |
| 2 | **6d** | Legend docked bottom-left, collapsible, persisted | `RiverMapPage.tsx`, `MapLegend.tsx` |
| 3 | **6** | `whitespace-nowrap` on the freshness badge | `RiverMapPage.tsx` |

## File ownership (hard boundary)

**May touch:** `apps/web/src/components/layout/AppShell.tsx`,
`apps/web/src/features/map/RiverMapPage.tsx`,
`apps/web/src/features/map/MapLegend.tsx`, `apps/web/src/index.css`,
`apps/web/src/components/icons.tsx` (only if an import is unexpectedly missing),
`e2e/web/shell.spec.ts` (new), `e2e/web/offline-cold-start.spec.ts` (the single
insertion from Step 6c.4).

**Must NOT touch:** `TennesseeMap.tsx`, `mapStyle.ts`, `mapTokens.ts`,
`riverMapSelectors.ts`, `RiverDrawer.tsx` (Session 3, concurrent);
`apps/web/scripts/**`, `docs/atlas-*.md`, `public/atlas/**` (Session 1,
concurrent); `e2e/web/atlas-verify.spec.ts`, `e2e/playwright.config.ts`, root
`package.json` (Sessions 5).

## Working style — subagents (glm-5.3-flash)

Small fixes stay in the main chat: Task 6 is one line and all of Task 6d is
compact — just do them. The one big task goes to a subagent:

- **You (main chat):** Task 6 (badge), Task 6d (legend reposition + card
  redesign), the manual visual checks, and the review of the subagent's diff.
- **Subagent — Task 6c:** the whole fullscreen-shell rework — AppShell
  surgery, `h-dvh` root, `useShell()` wiring, hamburger/brand in the map top
  bar, `shell.spec.ts`, and the offline-cold-start insertion. Give it the
  master-guide task, this brief's ownership list, and the gate lines; it's
  the same model as you — let it investigate the current code and implement.
  Don't pre-chew the steps.

Review the returned diff (typecheck after), then run the session gate.

## Session gate

```bash
cd /c/Users/Benjamin/Projects/trout
pnpm --filter @trout/web typecheck     # silent, exit 0
pnpm --filter @trout/web test          # 7 files / 47 tests green
git status --short                     # only ownership-list files
```

Manual (dev server, 1440×900 and 390×844): map fills the window — no header,
sidebar, or tab bar; hamburger + brand chip in the top bar; drawer opens with
all seven links, Tab cycles inside, Escape closes, focus returns; `/charts`
and `/logbook` keep their normal header; legend docked bottom-left, collapses,
persists across reload; document overflow exactly 0 (evaluate
`scrollHeight - clientHeight`); badge renders as a pill.

Write `shell.spec.ts` but do not run it — Session 5 runs the suite.

## Handoff

Report to Session 4: `RiverMapPage.tsx` top-bar layout is stable (where the
basemap control will slot in, after `MapModeControl` per master guide Step A4);
`index.css` legend/drawer classes in place. Report to Session 6: shell spec
count (3) so the expected web e2e total is 25 + 3 = 28.

## Stop conditions

- master-guide quoted code diverges materially from the files you find → stop,
  report the divergence.
- `h-dvh` leaves residual page scroll at 390×844 → stop with measurements; do
  not hide it with body overflow tricks.
- Any change appears to require a file outside your ownership list → stop and
  report rather than editing it.
