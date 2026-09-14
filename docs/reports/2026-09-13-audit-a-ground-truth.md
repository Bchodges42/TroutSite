# Session A — Ground-Truth Audit · 2026-09-13

Base `b44b4fe09af3b47a35f63afdb547475e1ccf0fe7` · UTC audit window 2026-09-13T23:44Z → 2026-09-14T01:10Z · branch `campaign-a` · clone `/Users/ben/Downloads/TroutSite-a`

---

## Status

Audit complete. Every count below was recomputed from the audited tree with reproducible
commands; every code claim carries a `path:line`. The orchestrator brief's leads
(2026-09-13 @ `b44b4fe`) were re-verified against the tree itself; two were found
**stale or not reproducible** (species-mode propagation is much wider than claimed;
no `realTimeIV` flag exists in content YAML — it lives in a static verification
artifact), the rest reproduced exactly. Nothing was modified except this report.
Three findings are NEW (stopped-sensor scoring window, orphaned USACE fetch, empty
lakes layer still mounted); the full reconciliation against `docs/KNOWN-ISSUES.md`
IDs and OA-01…OA-10 is in §8.

---

## Findings

### 1. Audited revision, method, commands, limitations

**Remote-main proof** (run 2026-09-13T23:43Z):

```
$ git ls-remote origin main
b44b4fe09af3b47a35f63afdb547475e1ccf0fe7	refs/heads/main
$ git rev-parse HEAD            # fresh clone, branch campaign-a off origin/main
b44b4fe09af3b47a35f63afdb547475e1ccf0fe7
```

Audited HEAD = current `origin/main` = campaign baseline. Last commit on main:
`docs: accuracy-audit orchestrator prompt — data-source research, water curation,
three session briefs` (2026-09-13T17:28:57-05:00). No unattributed changes were
encountered anywhere in the tree (AGENTS.md rule 6 check: `git status` clean after
clone; all files attributable to the branch history).

**Repo shape**: pnpm monorepo — `packages/contracts` (Zod schemas + scorers),
`packages/content` (YAML pack), `apps/web` (React PWA), `apps/api` (Fastify ingest +
snapshots), `apps/marketing` (Astro), `e2e` (Playwright). Product data lives in
committed YAML + committed generated artifacts (`apps/web/public/atlas/*`,
`apps/web/src/features/map/riverIndex.json`); the `/v1` + `/content` runtime
snapshots are **gitignored** (generated on the server) and could NOT be inspected.

**Commands run** (all read-only; no dependency install, per audit guardrails):

| Purpose | Command |
|---|---|
| Key census / counts | `ruby -ryaml -e '…'` walks of `packages/content/streams/tn/*.yaml` (148 files) |
| ID-set identity | ruby joins of `streams/tn/*.yaml` ↔ `apps/web/public/atlas/rivers.geojson` ↔ `apps/web/src/features/map/riverIndex.json` ↔ `docs/data-source-coverage.json` |
| Title tiers | ruby extent computation from `riverIndex.json` `bounds` (max of width/height, degrees) |
| Species bands | ruby walk of `packages/content/species/species-reference.yaml` |
| Code reading | Read of every file cited below; `git log --follow` for `bradley-creek.yaml` |

**Tests were inventoried but NOT executed.** Running the vitest/e2e suites requires
`pnpm install`, which writes `node_modules` trees — outside this audit's read-only
guardrail (only this report may be created/modified). Exact commands are listed in §7.

**Limitations:**
1. No live data: scores, gauge health, and feed contents are wiring-level facts, not
   today's reality (§5 states this explicitly). Which sensors report *right now*, and
   which species a water actually holds, are external questions — see
   "Open questions for the planner".
2. Runtime snapshots (`apps/web/public/v1`, `/content`) are gitignored; marketing
   fixture-vs-real behavior was verified in code (`apps/marketing/src/data/load.ts`),
   not by building the site.
3. Subagent note: of the three mandated read-only subagents (catalog / scoring /
   surfaces), only the scoring/pipeline one completed; the other two were killed by
   upstream API rate limits mid-task. Their scopes were covered by direct parent
   investigation; the completed subagent's leads were independently re-verified before
   inclusion (two were corrected: see §3.5, §8 OA-05/OA-08). Model selection was not an
   available parameter on this harness; subagents ran on the session default model.
4. `docs/reports/2026-09-13-orchestrator-audit.md` does **not exist** in the audited
   tree — the orchestrator leads exist only in the session brief.

---
