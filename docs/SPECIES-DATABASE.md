# Tennessee species database

This is the working guide for the static fish occurrence layer used by Trout.
The canonical snapshot is [`packages/content/data/species-occurrences.json`](../packages/content/data/species-occurrences.json); it is emitted by the content build and served offline at `/content/species-occurrences.json`.

## What we collect

The database is a waterway-by-species evidence index, not a claim that every
fish in a water has been enumerated. Each row carries the water id, species id,
evidence type, confidence, seasonal qualifier when documented, and a dated HTTPS
source. The UI calls the result “Recorded fish species” and treats no row as an
evidence gap rather than an empty fishery.

Fishbrain discovery work is kept separately in
[`packages/content/research/fishbrain-tn-discovery.json`](../packages/content/research/fishbrain-tn-discovery.json).
That file contains aggregate public water-page summaries only: no angler names,
photos, catch coordinates, or individual catch records. It is research input,
not a shipped catalog and is never loaded by the runtime or content pack.

The full-waterway Fishbrain research pass is in
[`packages/content/research/fishbrain-tn-graphql-discovery.json`](../packages/content/research/fishbrain-tn-graphql-discovery.json).
It covers the project’s 38 `display:featured` waters, mapped to 34 unique public
water pages, and uses the read-only `topSpeciesSummary` result with cursor
pagination to capture every returned species. Its `catchesCount` values are
aggregate logged catches on Fishbrain; they are not unique-angler counts,
biological abundance estimates, or official survey results. Broad or ambiguous
Fishbrain pages remain marked for segment review.

The corresponding pass for the remaining catalog waters is in
[`packages/content/research/fishbrain-tn-graphql-standard-discovery.json`](../packages/content/research/fishbrain-tn-graphql-standard-discovery.json).
It covers all 152 `display:standard` waters, mapping 109 catalog records to 108
unique public pages and capturing 1,899 species rows. Twenty-five mappings are
flagged for segment review and 43 have no unambiguous Tennessee public page in
this pass. The same interpretation applies: `catchesCount` is an aggregate
logged-catch total, and the snapshot is research-only rather than biological
verification or a live application dependency.

Evidence types mean:

- `agency-fishery-list` — an agency water page or reviewed fishery description
  names the species;
- `stocking-record` — a stocking program or record names the species;
- `wild-population` — a source explicitly describes a wild/native population;
- `regulation` — the water’s reviewed rules mention the species. This is useful
  management context but is not a survey count or abundance claim.

## Source policy

Allowed verification sources are public, attributable agency or scientific
references such as TWRA, NPS, USFS, USGS, TDEC, TVA, and public university
material. Fishbrain public water pages may be used as a discovery aid in the
research-only file, but their candidates are not accepted as biological truth
until independently verified. We do not copy restricted user-generated details
or run a live species pipeline. Collection is a deliberate research pass:
capture the page URL and collection date, flag ambiguous water matches, verify
the candidate against reusable sources, write a concise curator basis, and only
then commit it to the canonical catalog.

The current seed normalizes the reviewed water records already in this
repository. It includes agency-backed bass/panfish/catfish lists on selected
reservoirs and rivers, explicitly named rainbow/brown/brook trout records, and
regulation-only records for species such as walleye, sauger, muskellunge,
rock bass, white bass, paddlefish, and redear sunfish. The Fishbrain research
file supplies candidates for the next verification pass; it does not infer a
species from a waterbody type or from a generic “trout water” flag.

## Updating the snapshot

1. Review a candidate in `research/fishbrain-tn-discovery.json` or
   `research/fishbrain-tn-graphql-discovery.json` or
   `research/fishbrain-tn-graphql-standard-discovery.json`, or identify a
   candidate from an agency source, and resolve the exact catalog water segment.
2. Re-read the official source and record its current URL and retrieval date.
3. Add or revise the source-backed group in
   `packages/content/data/species-occurrences.json`.
4. Run `pnpm --filter @trout/contracts build` and
   `pnpm --filter @trout/content validate`.
5. Run `pnpm --filter @trout/content build` so the served content pack contains
   the reviewed snapshot.
6. Run the web/API tests and inspect the generated detail-page copy.

The collection has no hourly job. Conditions and stocking feeds may still be
live or refreshed independently; they must not silently mutate this catalog.
