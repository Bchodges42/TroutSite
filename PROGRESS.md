9182429284852fc918d8f18ec2f4f951ba6d0604 (base: trout-backend@9182429)

# SPECIES lane progress (B08: species applicability in real catalog)

## Status log
- [x] Setup: pnpm install; @trout/contracts build; @trout/ui build — green
- [x] Inventory: 105 tn YAMLs (13 West TN ponds already `species: trout`, untouched); fixture
      hypothesis = WARMWATER_IDS (20 ids) + warmwater EXTRA_NOTES in apps/web/scripts/generate-fixtures.mjs
- [x] Cross-check: all 20 warmwater-hypothesis ids have trout-affirming catalog notes —
      14 overridden to trout, 6 unset; 1 more unset from the default-trout set (ocoee-river)
- [x] Author: 85 YAMLs set `species: trout`; 7 left UNSET (harpeth-river, duck-river-lower,
      nolichucky-river, little-pigeon-river, emory-river, clear-fork, ocoee-river); 0 warmwater
      (real catalog refuted the hypothesis; details in docs/SPECIES-REVIEW.md)
- [x] docs/SPECIES-REVIEW.md: per-entry evidence quotes, judgment calls, thin-evidence list
- [x] Validation: all 105 parse vs StreamSchema, 0 failures; TWRA source URL on every entry
- [x] fixtures:generate — clean run, contract validation passed; fixture species UNCHANGED
      (generator reads no YAML — drift documented for integration lane); timestamp-only fixture
      churn reverted, v1/streams byte-identical
- [x] pnpm --filter @trout/web typecheck — green; test — 74/74; build + size budget — green
      (4.97 MB / 25 MB)
- Known pre-existing (not this lane): @trout/content validate/test fail at base 9182429 with
  "no hatch chart file for region tn-west" (da80558 gap) — verified identical after stashing.

## Counts (catalog, 105 total)
- species: trout — 98 (85 authored + 13 pre-existing)
- species: warmwater — 0 (hypothesis refuted by sourced notes; see SPECIES-REVIEW)
- unset (thin/conflict) — 7

## Commits
- (see git log; all tagged "species: ...")
