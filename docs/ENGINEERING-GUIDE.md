# Engineering guide

This document is the durable implementation standard for Trout. `AGENTS.md` contains binding repository and production rules. This guide explains the engineering judgment those rules are meant to produce.

Task-specific plans may narrow scope or add acceptance checks. They may not weaken these principles.

## 1. Establish authority before editing

Use this order when sources disagree:

1. Current runtime behavior and reproducible observations.
2. Validated source data and generated artifacts.
3. Current contracts, ADRs, and source-specific reference documents.
4. `docs/KNOWN-ISSUES.md` and the active implementation plan.
5. Dated audits, research notes, screenshots, and Git history.

Dated evidence explains what was observed at one revision. It is never an instruction to restore that revision. A completion report is a claim to verify, not a source of truth.

Before changing anything:

- fetch `origin/main` and record the starting SHA;
- inspect `git status`, recent commits, the relevant tests, and the code that generates the affected artifact;
- reproduce the defect or write down why it cannot be reproduced locally;
- identify the single authoritative input and every generated projection of it.

## 2. Model identity explicitly

Human-readable names are labels, not primary keys. This matters especially for rivers, gauges, counties, shops, and external feeds.

- Use stable source identifiers when they exist.
- Use topology and containment to establish relationships; do not use proximity alone.
- Treat aliases as lookup aids, never as proof that two records are the same object.
- Reject ambiguity instead of choosing the nearest or first match.
- Keep source identifier types distinct. For example, an NHD permanent identifier and an NHDPlus identifier must not share one undocumented field.

If two real objects share a name, give them separate internal IDs and qualified user-facing identities. Never invent `River 1` and `River 2` when a basin, receiving water, county, or official identifier can distinguish them.

## 3. Preserve source truth

Generated output must be traceable to immutable or captured inputs.

- Prefer authoritative public data over hand-drawn replacements.
- Never fabricate geometry, readings, dates, citations, or continuity to make a display look complete.
- A documented source gap is better than a convincing false line.
- If an output combines source records, record exactly which records were used.
- When output geometry changes, regenerate its provenance. Never copy old source IDs onto new coordinates.
- Keep raw captures and reviewed selection recipes separate from generated delivery artifacts.
- A fallback source must be labeled as a fallback and justified per feature.

For hydrography, `docs/NHD-CONVENTIONS.md` defines the trace-engine data format. The active river-repair briefs add stricter product rules: no synthetic output connector and no name-plus-envelope identity matching.

## 4. Prefer one source of truth

Do not maintain the same fact manually in several files.

- Author a fact once and generate indexes, snapshots, and public projections from it.
- If two files must contain related data, make one a reviewed input and the other a deterministic output.
- Avoid hard-coded catalog counts in prose and tests when the count can be derived.
- Do not introduce a second visibility, scoring, identity, or matching policy beside an existing authority.
- Add a schema field only when it represents durable domain data, not a temporary implementation detail.

## 5. Make invalid states fail clearly

Silent partial success is dangerous in a factual product.

- Validate at the boundary where bad data enters.
- Fail closed when a missing field would cause a false factual claim.
- Error messages must name the record, expected invariant, and actual value.
- A generator must not write partial output after a failed validation.
- A UI may degrade gracefully, but it must describe unavailable or uncertain data honestly.

Warnings are appropriate only for conditions the product can safely ship. If a warning can create a wrong river, wrong stocking match, or false freshness claim, it is an error.

## 6. Build deterministic pipelines

A generator is complete only when it is reproducible.

- Pin or commit its inputs where licensing permits.
- Sort records and identifiers before serialization.
- Avoid timestamps in generated files unless retrieval time is domain data.
- Run the generator twice; the second run must produce no diff.
- Validate generated output before replacing the last-known-good artifact.
- Keep network fetching separate from deterministic assembly whenever possible.

Small pure helpers are preferable to large mutation scripts. Reuse one graph, geometry, matching, or scoring implementation rather than creating lane-specific variants.

## 7. Change the smallest coherent surface

Small does not mean superficial. The right change includes every projection needed to preserve the invariant and excludes unrelated cleanup.

- Trace the data flow before editing.
- Keep migrations additive unless a deliberate breaking change has been approved.
- Preserve stable public IDs and routes when possible.
- When an ID must change, provide an explicit migration or redirect.
- Do not solve a data defect with styling, or a rendering defect by corrupting data.
- Remove superseded code and documentation when the replacement is established; do not leave two plausible paths.

## 8. Separate work by dependency

Parallel work is useful only when ownership is disjoint and the dependency graph permits it.

- One session uses one clone, one branch, and one push target.
- A downstream session starts from the reviewed output of its prerequisite session.
- Do not assign two sessions to edit the same generated artifact or central file.
- A subagent receives one bounded question or isolated file set. The parent reviews the answer and reruns verification.
- Integration responsibility stays with the primary session.

When a data correction determines UI behavior, fix and validate the data first. Do not let the UI session guess the intended geometry or identity.

## 9. Test the failure mode

A green broad suite does not prove the reported defect is fixed.

For each change:

1. Capture a regression case that fails for the old behavior.
2. Add the narrowest deterministic unit or data-integrity test.
3. Run the package tests for the changed surface.
4. Run cross-package checks for contracts and generated artifacts.
5. Verify in a real browser when rendering, interaction, accessibility, offline behavior, or performance is involved.

For generated spatial data, validate identity, source membership, connectivity, coordinate finiteness, duplicate ownership, and reproducibility. Screenshots are supporting evidence, not geometry proof.

## 10. Measure performance at the mutation boundary

Performance work begins with a mechanism and a budget.

- Count fetches, source/layer additions, feature-state writes, and stale work.
- Coalesce repeated events and make asynchronous viewport work latest-request-wins.
- Cache immutable bytes once per page session.
- Use hysteresis or a bounded cache to avoid add/remove churn.
- Prefer style expressions or one layer filter over per-feature work on every animation event.
- Keep instrumentation development-only unless it is an intentional operational metric.

Avoid timing assertions that depend on a fast workstation. Test bounded work and use generous end-to-end timeouts only as a final hang detector.

## 11. Design for recovery

Before mutating an important artifact, know how the last-known-good version is preserved.

- Build and validate before switching served output.
- Use explicit targets for deletion and migration.
- Do not rewrite unrelated user changes.
- Never claim rollback succeeded until the restored state has been verified.
- Production changes follow `infra/RUNBOOK.md`; development convenience is not production architecture.

## 12. Keep documentation authoritative

Documentation has three roles:

- **Canon:** current rules and architecture.
- **Reference:** current data contracts and provenance.
- **Evidence:** dated observations and research.

Every document must make its role obvious. Active plans must name their prerequisite revision and retirement condition. When a plan finishes, remove it from the active index; Git history is the archive.

Do not:

- keep completed session briefs as canonical guidance;
- copy mutable counts into several documents;
- leave a stale checklist beside the generated source of truth;
- turn handoff commentary into permanent architecture;
- cite an old screenshot as proof of current behavior.

Run `pnpm docs:check` after adding, moving, or deleting documentation.

## 13. Report completion with evidence

A useful completion report states:

- starting and ending commit;
- exact scope changed;
- tests and commands actually run;
- before/after evidence for the reported defect;
- generated-artifact reproducibility result;
- remaining uncertainty or documented exceptions;
- pushed branch and clean working-tree status.

Avoid “everything is fixed,” “fully verified,” or “production ready” unless each part has a named acceptance check and evidence. Honest residual uncertainty is part of the product quality bar.
