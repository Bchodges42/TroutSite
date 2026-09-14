# ORCHESTRATOR PROMPT — audit Trout, diagnose, then write the 3 campaign session prompts

Paste everything below this line into the strong model's session, working inside the
Trout repository.

---

You are working inside the **Trout** repository — the offline-first, privacy-first
Tennessee fishing-conditions product live at trout.tntechclimb.com. You are the most
capable model in this workflow, and you're being treated that way: this brief gives you
outcomes and constraints, not method. Where the framing below is wrong or the evidence
points somewhere better, follow the evidence — record the disagreement and design around
it rather than silently replanning.

Your run has two phases, in order:

1. **Audit and diagnose the site yourself** — deeply enough that everything you design
   afterward rests on verified fact, not on what the docs claim.
2. **Design the campaign**: write three independent, paste-ready session prompts that
   other models — each less capable than you, each working with subagents — will execute
   in fresh sessions. The campaign's end product is an implementation plan that gets
   handed, as the implementing model's entire brief, to the implementation model.

## Orientation

You're inside the project; find your own way through it. The entry points: `AGENTS.md`
(binding session/branch/production rules), `README.md` (the product and architecture
invariants), `docs/INDEX.md` (the map of every doc), and `docs/KNOWN-ISSUES.md` — the
consolidated worklist, the owner's 2026-09-12 DECIDED items (per-species fishability
scores; site-wide species mode, default Trout; and the rest), and the sketched
fishability program F1–F12. Those decisions are owner policy: build on them, and if your
audit forces a change to one, flag it as an owner decision rather than overriding it.

Docs can lie; code, YAML, and data are truth. Today is 2026-09-13.

## The owner's goals — what the campaign must deliver in substance

- **Accuracy first.** The campaign sessions' work is only as good as the audit beneath
  it, so the audit must cover the entire site: catalog, map, scoring, data pipeline,
  UI surfaces, content claims.
- **A real score.** Research how fishability should actually be calculated, and the data
  sources that make it possible, then think through the sitewide logic needed to support
  it. Not just trout — freshwater fish generally, with trout as the default lens.
- **Fewer, more defensible waters on the map.** Decide which rivers and creeks are big
  enough to be displayed (selectable). The current river icons/titles must be reduced —
  some are small, some out of season, some entirely warm-water streams.
- **Gauge + temperature for the main rivers** — especially those connected to a
  reservoir. If a source exists but can't be cleanly implemented, scrape it: find it,
  document exactly how we can use it. Look relentlessly for data sources covering as
  many of the major bodies of water (that are decided to display) as possible — rivers
  *and* lakes; we need their data to provide a score in some way.
- **Species honesty.** No unverified species tags left when a water is opened; reduce
  the count of unassessed rivers as much as possible.

## Phase 1 — your audit

Work the site until you can answer, with verified specifics and numbers (counts, not
vibes): what's actually in the catalog and on the map today and why; how waters earn an
icon/title and which ones shouldn't; how scoring works end-to-end and where
"unassessed" comes from; which waters have flow/temperature from which source and which
have nothing; which species tags are backed by evidence and which aren't; where the
product's own decided direction (per-species fishability) collides with data reality.
Cross-reference `KNOWN-ISSUES.md` item IDs instead of rediscovering what's already
tracked — your value is what's *not* yet tracked, and the diagnosis that ties it
together. Use subagents however you see fit; their findings are leads until you've
verified them yourself.

Write your audit and diagnosis to `docs/reports/2026-09-13-orchestrator-audit.md`,
ending with your campaign rationale: why you split the work the way you did, what each
session must nail, and where the failure modes are.

## Phase 2 — the three session prompts

Write the prompts to `docs/reports/2026-09-13-session-prompts.md`, clearly delimited one
per session, with a short usage note (run order/parallelism, and how the handoffs work).
Requirements on the set:

- **Three sessions, multiple subagents each.** The sessions are independent — separate
  fresh sessions with no shared memory — so every prompt must carry its own full
  starting context (repeated verbatim inside it, never "see above") plus direction to
  the MD entry points.
- **Cover the whole campaign.** Ground-truth audit, the relentless external data-source
  hunt, and synthesis into the implementation plan are the load-bearing pieces; if you
  see a better decomposition than that, use it — the constraints are coverage,
  independence, and auditability, not this exact split.
- **Chain via files, not memory.** Sessions hand off only through report files they
  write under `docs/reports/` at deterministic paths your prompts specify, and each
  prompt says what to do if a predecessor's file is missing.
- **The last deliverable is a self-contained implementation plan** — the implementing
  model reads only it and the repo. It must resolve the owner's goals above concretely:
  the display decision per water, per-water data-source assignments (scrapes included,
  with recipes), the scoring design reconciled with the data that actually exists, the
  species-tag verification pipeline, the sitewide logic, phased and file-level, with
  tests and acceptance criteria.
- **Calibrate each prompt to its executor.** State outcomes, guardrails, and
  verification expectations; give method only where a less-capable model would
  otherwise fail. Write the prompts you'd want to receive.
- **Session rules of engagement**, in every prompt: read-only except the session's own
  report files under `docs/reports/`; AGENTS.md binding; never interact with the
  production host; verify claims against the tree; build on DECIDED items and existing
  worklist IDs; commit nothing to `main`.

## Your rules

- You modify nothing except your two report files. No code, content, or config changes;
  no deploys; the production host is off-limits; never read or quote secrets
  (e.g. `backups/push-url.txt`).
- If you commit your reports, it's your own branch off `origin/main`, pushed early
  (AGENTS.md §1–3); docs-only edits may go to `main` per AGENTS.md §4.
