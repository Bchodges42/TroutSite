# TARGET ARCHITECTURE (owner-approved direction, 2026-09-17/18): code decides, Jev arbitrates the residue, live data drives conditions

Owner question that produced this: "eventually the live data, with Jev, and the
other data we have should be what's making the decisions live, not this?" and
"could we architect a system to rival it with just code?" then: "any of the low
confidence decisions from the code are handed over to Jev to rate as well —
that way we can cut down on costs."

## Three layers

1. **Curated (slow) layer** — catalog YAML + habitat-survival evidence records
   (this folder) + TWRA stocking workbook. Citation-backed, batch-produced,
   changes on year-to-decade timescales. This is the only layer
   text-generation models (research sessions) produce; the cost is amortized
   per research batch, not per decision.
2. **Periodic (decision) layer** — a deterministic classifier: pure function
   over (evidence record, catalog row, stocking row) →
   {label, confidence, reasons[], provenance}. Zero marginal cost, re-runnable
   on every deploy (files-on-disk/pm2 architecture). Encodes
   OWNER-POLICY-year-round.md as explicit facet-precedence rules.
3. **Live (conditions) layer** — gauges, TVA releases, calendar. Drives trout
   mode, species-relative temp scoring, "good day" verdicts. NEVER flips a
   classification label; weather is noise, programs are structure. Gauge
   CLIMATOLOGY (e.g. July maxima) belongs to layer 1 as evidence; TODAY'S
   reading belongs here.

## Decision flow (replaces classifying all 190 waters through Jev every run)

    evidence record + catalog + workbook
      → CODE CLASSIFIER (pure function)
          ├─ high/structural confidence → ACCEPT (provenance recorded)
          └─ low/structural confidence  → ESCALATE TO JEV (one cheap call)
                ├─ Jev agrees with code  → ACCEPT
                └─ Jev disagrees         → OWNER BOX (automatic)

WHAT JEV IS (ground truth, don't confuse it with an LLM): Jev (TypeSafe) is a
structured-decision model — a "System One" model, not a text generator. It
evaluates typed questions against a state composed in code and returns typed
values with probability distributions and confidence. Primitives: Choice
(pick from a list → choice, probabilities, confidence), Score (score state
against a rubric), Noul (statement truth, 0-1). Questions run in parallel
against the same state and mix in one API call. Repo integration:
packages/content/scripts/classification/jev-classify.mjs (MODEL 'jev-latest',
strict-whitelist state, no answer leakage). Jev never reads PDFs and never
writes prose — unstructured sources are the research sessions' job (layer 1).

The escalation maps directly onto those primitives: compose the state from
the evidence record + catalog row + stocking row + policy rules, then ask the
narrow Choice question over the three canonical labels plus companion Noul
questions (e.g. "trout survive year-round in this reach") and a Score for
evidence strength — one call, answers branched on in code.

Rules:

- **The confidence gate is structural** — computed from the record: facets
  present, source tiers, recency, explicit conflict flags. The escalation
  must be reproducible and auditable.
- **The escalation state is whitelist evidence-only — NO answer leakage.**
  The state composed for Jev carries the evidence record, catalog row,
  stocking row, and policy rules. It must NOT contain the code classifier's
  tentative label, any prior Jev answer (recommendedClass/confidence/flags),
  or anything derived from either. jev-classify.mjs already documents this
  trap for the composite; the 2026-09-17 review caught a real leak of exactly
  this kind (composite fields reintroducing prior Jev answers, contaminating
  an 8/8 result down to an honest 5/8). Inherit the guard.
- **Disagreement between code and Jev auto-escalates to the owner box.**
  Disagreement is itself evidence of thin data; the owner arbitrates exactly
  the waters that need a human.
- **Golden tests gate site wiring**: owner-approved verdicts (composite run
  boxes + future approvals) are fixtures. A rule change that would silently
  flip a golden verdict fails the build and surfaces for review.
- **Budget**: Jev cost = one cheap call per escalated water (owner's measured
  spend to date: $0.26 total). Text-generation model spend = research batches
  only (layer 1). Neither sits in the per-decision path except Jev-on-
  escalation. Jev involvement per water is itself a thin-evidence signal,
  reported.

## Division of labor after this

- Research sessions (text-generation models, batch, amortized): read new
  unstructured sources (TWRA PDFs, regulation pages) into evidence records;
  summarize conflicts for owner boxes.
- Jev: rate escalated classifications over composed states — typed answers,
  no prose.
- Code: decide, gate, branch, prove (golden tests). The provenance envelope
  (per-field sources) is plain data structure and stays regardless.
