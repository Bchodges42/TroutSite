# Session Brief 6 — Final Verification & Gated Ship

_Role: release engineer. **Wave 3 — after Sessions 4 AND 5** (order: Wave 1 →
5 → 4 → 6, or Wave 1 → 4 → 5 → 6; either is valid, this session just needs
both done). Details live in `docs/remaining-changes-implementation-guide.md`
(the "master guide"); read §0 (Ground rules) first._

## Mission

One full verification pass across everything Sessions 1–5 landed — data
pipeline, rendering, shell, basemap, hardened e2e — then the gated commit.
Until the user explicitly asks to commit, completing verification and
reporting IS a complete session.

## Critical rules

- Never reset/checkout/stash/discard the working tree — by now it holds all
  five sessions' work plus the original remediation.
- `rivers.geojson` byte-identical; EFS values render (37 · Poor · 19.3 cfs ·
  50–400 cfs · temperature unavailable).
- **The commit (Task 10) is GATED on the user explicitly asking.** The public
  site must never be described as fixed until deployed and read back.

## Scope — master guide tasks

| # | Task | One-liner |
|---|---|---|
| 1 | **9** | Full pass: typecheck → unit → build → validate-atlas (+ validate-topo if present) → `pnpm e2e:web` → Step 9.6 visual spot checks at 1440×900 / 1024×768 / 390×844 → Step 9.7 diff hygiene |
| 2 | *(bookkeeping)* | Replace Appendix A's e2e-total placeholder with the verified number (28 expected) |
| 3 | **10** | GATED commit + optional deploy (message text in the master guide; extend with session realities if needed) |

## File ownership

**May touch:** `docs/remaining-changes-implementation-guide.md` (Appendix A
number only), `.gitignore` (only if the commit review reveals generated
artifacts that should be ignored).

**Must NOT touch:** everything else — any failure belongs to the owning
session; report it back instead of fixing it here. You are the auditor, not
the author.

## Working style — subagents (glm-5.3-flash)

All edits in this session are small (an Appendix number, maybe one
`.gitignore` line) — main chat does them directly. Use an agent only for the
long command batches:

- **You (main chat):** every Step 9.6 visual inspection — look at each
  screenshot yourself; the Appendix A update; the commit protocol; every
  retry/stop decision.
- **Subagent — gate runner:** run the Task 9 command sequence and paste full
  output plus a screenshot inventory (filenames + timestamps). Long
  wall-clock, zero judgment. The Step 9.6
  visual inspection that follows is yours alone: drive Browser Use yourself
  (main agent only — subagents cannot use it) or Read the PNGs directly.

## Session gate — the master guide's Task 9, executed in full

```bash
cd /c/Users/Benjamin/Projects/trout
pnpm --filter @trout/web typecheck          # silent
pnpm --filter @trout/web test               # 7 files / 47 tests
pnpm --filter @trout/web build              # precache ~153 entries; separate topo
                                           # line if Session 4 ran; 25 MB gate OK
node apps/web/scripts/validate-atlas.mjs    # 92/92 + PASS
node apps/web/scripts/validate-topo.mjs     # PASS (if Session 4 ran)
pnpm e2e:web                                # 28 passed
```

**Step 9.6 spot checks** (screenshots + live at `:8787` after
`pm2 reload trout-api --update-env`): all viewports render — no failure
banner; EFS values intact; wide water is wash + shore in **all three basemap
variants** (Paper/Ink/Topo); shell is edge-to-edge with document overflow
exactly 0; legend docked and collapsible; basemap round-trip persists; a
no-reading river shows "No data".

**Step 9.7:** `git status --short` shows only files the six briefs own;
`git diff --stat apps/web/public/atlas/rivers.geojson` is empty.

## Commit protocol (only when the user explicitly says to commit)

1. `git add -A` → `git status` → review the ENTIRE staged list against the
   briefs' ownership lists; anything unexpected → stop and report.
2. Confirm nothing under `apps/web/.atlas-src/` is staged (broken ignore rule
   → stop and report).
3. Commit with the master guide's Task 10 message (it already includes
   Session 1–4 bullet points).
4. Deploy only if asked: build + `pm2 reload trout-api --update-env`, read the
   public site back before describing anything as fixed.

## Handoff / done

Report the full gate table (command → result), screenshot inventory, topo
bytes, and — if committed — the commit hash and what remains before public
deployment is truthful.

## Stop conditions

- Any gate line fails → identify the owning session, capture evidence
  (output/trace/screenshot), stop and route it back. No cross-session fixes.
- Overflow ≠ 0 at any viewport, or any screenshot shows the failure banner →
  stop; these are hard acceptance criteria, not tunings.
