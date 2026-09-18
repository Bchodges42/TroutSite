# TARGET ARCHITECTURE (owner-approved direction, 2026-09-17/18): code decides, Jev arbitrates the residue, live data drives conditions

Owner question that produced this: "eventually the live data, with Jev, and the
other data we have should be what's making the decisions live, not this?" and
"could we architect a system to rival it with just code?" then: "any of the low
confidence decisions from the code are handed over to Jev to rate as well —
that way we can cut down on costs."

## Three layers

1. **Curated (slow) layer** — catalog YAML + habitat-survival evidence records
   (this folder) + TWRA stocking workbook. Citation-backed, batch-produced,
   changes on year-to-decade timescales. This is the ONLY layer a model
   produces; the cost is amortized per research batch, not per decision.
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

## Decision flow (replaces the model-per-run loop)

    evidence record + catalog + workbook
      → CODE CLASSIFIER (pure function)
          ├─ high/structural confidence → ACCEPT (provenance recorded)
          └─ low/structural confidence  → ESCALATE TO JEV (the only model call)
                ├─ Jev agrees with code  → ACCEPT
                └─ Jev disagrees         → OWNER BOX (automatic)

Rules:

- **The confidence gate is structural** — computed from the record: facets
  present, source tiers, recency, explicit conflict flags. Not model vibes.
  The escalation must be reproducible and auditable.
- **Disagreement between code and Jev auto-escalates to the owner box.**
  Disagreement is itself evidence of thin data; the owner arbitrates exactly
  the waters that need a human.
- **Golden tests gate site wiring**: owner-approved verdicts (composite run
  boxes + future approvals) are fixtures. A rule change that would silently
  flip a golden verdict fails the build and surfaces for review.
- **Model budget**: batch evidence gathering + escalation residue only.
  (Measured owner spend to date: $0.26 total across all requests.) Jev
  involvement per water is itself a thin-evidence signal, reported.

## What Jev's model run is FOR after this

Reading new unstructured sources (fresh TWRA PDFs, changed regulation pages)
into evidence records; summarizing conflicts for owner boxes. The provenance
envelope (per-field sources) is plain data structure and stays regardless.
