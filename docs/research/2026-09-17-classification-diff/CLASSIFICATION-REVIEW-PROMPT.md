# HANDOFF: independent review of the Jev water-classification system

You are an independent reviewer with fresh eyes. Your job is to review how
this AI-assisted water-classification system is built — the question design,
the criteria wording, the evidence it receives, the data quality, and the
evaluation process — and find ways to improve it. You are NOT bound by any
prior session's conclusions, hypotheses, or wording choices. Disagree with
anything, including the category schema's framing, if you have a reason.

Tone and independence rules:
- The "prior observations" section at the bottom records what earlier
  sessions saw. Treat it as unverified field notes, not findings. Form your
  own view first; only then compare.
- Do not tune anything to match the prior sessions' expectations. If you
  believe a different category schema, different question design, or
  different evidence weighting is better, propose it with reasoning.

## The product (context)

TroutSite — a Tennessee fishing atlas (React/TS monorepo, pnpm). Each of
190 catalog waters has a fishery classification that drives real user-facing
behavior: whether the water appears in "trout mode," what identity label it
wears, and which condition score applies. The classification is produced by
TypeSafe's Jev (a decision-native model: POST https://api.typesafe.ai/v1/systemone,
Bearer key, Choice/Score/Noul questions returning typed answers with
probabilities + confidence; docs at docs.typesafe.ai/api).

The owner's three categories are DEFINITIVE — keep these three labels
exactly as written (keys in parentheses are the stable API identifiers):

1. "Year Round - Trout Stream (tailwaters, wild trout waters)"
   (key: trout-stream-year-round) — trout present year-round: cold
   controlled water (tailwater releases) or wild/self-sustaining population.
   The test is habitat survival, not stocking cadence. A cold headwater
   stocked every spring whose trout hold over between stockings ALSO
   qualifies — regular stocking strengthens the case.
2. "Warm Water - Seasonal/Winter Stocking Program"
   (key: warmwater-yearly-stocked-winter-trout) — water too warm to hold
   trout year-round; trout present around a recurring stocking program
   (winter put-and-take, spring put-and-take, Delayed Harvest).
3. "Warm Water - No Trout" (key: warmwater-no-trout) — no trout program, no
   year-round trout presence. (Not a claim that zero trout species exist —
   e.g. a reservoir with lake trout can still be this when it is not a trout
   fishery.)

Each water also gets 12 month-level answers (trout present in January…December)
that must stay consistent with the category but are stored separately.

Everything ELSE is open to change with justification: criteria wording,
question design, instructions, evidence structure, data, evaluation process.
Do not treat the prior sessions' criteria text as fixed — it is exactly the
kind of thing under review.

## Where to work

- Repo: github.com/BChodges42/TroutSite (note the C in BChodges42).
  Branch with all current work: `feat/jev-system-classification`.
  Do not commit to main. Create your own branch, e.g.
  `review/jev-classification-<yourname>`, and push it when done.
- A working clone already exists with the API key set up (gitignored .env —
  NEVER commit, copy, log, or display it):
  `C:\Users\Benjamin\Projects\trout-classify`
  Either work there on a new branch, or clone fresh and copy the key file:
  `cp /c/Users/Benjamin/Projects/trout-classify/.env <yourdir>/.env`
- Install: `pnpm install`, then `pnpm --filter @trout/contracts build &&
  pnpm --filter @trout/ui build && pnpm --filter @trout/content build`

## Files to read first

- packages/content/scripts/classification/jev-classify.mjs — evidence-state
  builder + the Choice/Score/Noul question definitions (the core artifact)
- packages/content/scripts/classification/validate-jev-classification.mjs —
  the 190-water runner/scorer (--dry-run for offline inspection)
- packages/content/scripts/classification/judge.mjs — model seam + key handling
- packages/content/scripts/classification/lib.mjs — entity resolution +
  data loaders
- packages/content/scripts/classification/stocking-schedule.mjs — official
  TWRA schedule ingest (month-letter windows, program types)
- packages/content/test/jev-classify.test.ts — current test expectations
- docs/research/2026-09-17-classification-diff/ — prior eval outputs
  (jev-classification-eval.json + .pre-composite.json + .pre-schedule.json)
  and FAILURES-AUDIT.md from the last review pass
- packages/content/research/ — the evidence files: fishbrain-tn-graphql-
  discovery.json (38 featured waters), fishbrain-tn-graphql-standard-
  discovery.json (152 standard; matchStatus not-found = missing evidence,
  NOT a negative), jev-tn-review-labels.json (8 owner-reviewed labels —
  CALIBRATION TRUTH, must never enter the model state),
  CLASSIFICATION-COMPOSITE-2026-09-17.json (three-source reconciliation of
  all 190 waters; its `jev` column is a prior model answer and must never
  enter the state either), schedule-location-aliases.json
- packages/content/streams/tn/*.yaml — the 190 catalog waters (authored
  fields the evidence mirrors)
- docs/research/2026-09-15-wave-ledgers/ — human-audited per-water evidence
  (waters.json, diff.json) and the older known-answer corpus
- apps/web/public/atlas/twra-stocking.geojson — live TWRA stocking-sites feed
- infra/jev-fishability.mjs — a second, separate Jev job (hourly 0-100
  fishability scores); in scope for review but secondary

## Commands

- Full offline state inspection (no API):
  `node packages/content/scripts/classification/validate-jev-classification.mjs --dry-run`
- Full 190-water live run (~5 min, writes results):
  `node packages/content/scripts/classification/validate-jev-classification.mjs --month 9 --write`
- Known-answer suite (the other half of the system, older semantics):
  `node packages/content/scripts/classification/validate-known-answers.mjs`
- Tests: `pnpm --filter @trout/content test`
- Review page (sortable table of decisions for the human owner):
  `node packages/content/scripts/classification/build-review-html.mjs`

## What to review (suggested, not exhaustive)

1. Question design: are the three Choice criteria clear, mutually
   distinguishable, and free of wording that pushes the model toward an
   answer? Does the Score/Noul companion set make sense? Is anything in the
   instructions leading?
2. Evidence state: completeness, ordering, signal-to-noise. Is any strong
   signal missing or buried? Is any weak/misleading signal over-weighted?
3. Data: the Fishbrain datasets, the composite, the schedule ingest — gaps,
   format problems, mismatches with the catalog.
4. Evaluation integrity: the eval must never leak review labels or prior
   model answers into the state; raw vs overridden results must be reported
   separately; the 8 reviewed labels are the only ground truth.
5. Failure patterns in the current results (see prior observations) — find
   the root causes, not just the symptoms.

## Deliverables

1. A findings report: what is weak and why, ranked by impact on real user-
   facing classifications.
2. Proposed improvements: rewritten criteria text, question changes, state
   structure changes, data additions — concrete enough to apply.
3. Any applied changes on your branch, with tests updated/added.
4. A full 190-water live run after your changes, with the before/after
   comparison against the committed eval (jev-classification-eval.json).
5. A short handoff note: what you changed, what you recommend but did not
   change, and any questions only the owner can answer.

## Owner questions currently open (answer or refine if your review bears on them)

- Fort Patrick Henry Lake: Jev's own month answers say trout present 12/12
  months but it classified the lake Winter/Seasonal Stocked. Internal
  contradiction — category error, month error, or genuinely ambiguous?
- Doe River (9/12 months) and Buffalo Creek (9/12) have the same shape.
- Middle Prong Little Pigeon: GSMNP water, ledger 'mixed' (wild + stocked),
  composite documents a Spring stocking program — classified Winter/Seasonal
  Stocked at low confidence. Segment-identity problem (lower reaches are
  smallmouth water) or evidence problem?
- Tellico River: composite shows stocking Feb–Dec, classified Winter/
  Seasonal Stocked ("trout do not survive the summer") — under-called?
- Wilbur Lake, South Fork Cumberland, Red River at Clarksville: flagged in
  FAILURES-AUDIT.md.

## Hard rules

- The review-label file's categories and the composite's `jev` column must
  never appear in any model state. Verify your changes preserve this.
- Report-only by default: catalog YAML and production data are never written
  by classification scripts.
- The API key stays in the gitignored .env. Never print it.
- Trust the owner's three categories; improve everything around them.
