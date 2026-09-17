# Tennessee species database

This is the working guide for the static fish occurrence layer used by Trout.
The canonical snapshot is [`packages/content/data/species-occurrences.json`](../packages/content/data/species-occurrences.json); it is emitted by the content build and served offline at `/content/species-occurrences.json`.

## What we collect

The database is a waterway-by-species evidence index, not a claim that every
fish in a water has been enumerated. Each row carries the water id, species id,
evidence type, confidence, seasonal qualifier when documented, and a dated HTTPS
source. The UI calls the result “Recorded fish species” and treats no row as an
evidence gap rather than an empty fishery.

Evidence types mean:

- `agency-fishery-list` — an agency water page or reviewed fishery description
  names the species;
- `stocking-record` — a stocking program or record names the species;
- `wild-population` — a source explicitly describes a wild/native population;
- `regulation` — the water’s reviewed rules mention the species. This is useful
  management context but is not a survey count or abundance claim.

## Source policy

Allowed sources are public, attributable agency or scientific references such as
TWRA, NPS, USFS, USGS, TDEC, TVA, and public university material. We do not
scrape Fishbrain, reuse restricted user-generated observations, or run a live
species pipeline. Collection is a deliberate research pass: capture the source
URL and retrieval date, write a concise curator basis, validate the catalog, and
commit the snapshot for review.

The current seed normalizes the reviewed water records already in this
repository. It includes agency-backed bass/panfish/catfish lists on selected
reservoirs and rivers, explicitly named rainbow/brown/brook trout records, and
regulation-only records for species such as walleye, sauger, muskellunge,
rock bass, white bass, paddlefish, and redear sunfish. It does not infer a
species from a waterbody type or from a generic “trout water” flag.

## Updating the snapshot

1. Re-read the official source and record its current URL and retrieval date.
2. Add or revise the source-backed group in
   `packages/content/data/species-occurrences.json`.
3. Run `pnpm --filter @trout/contracts build` and
   `pnpm --filter @trout/content validate`.
4. Run `pnpm --filter @trout/content build` so the served content pack contains
   the reviewed snapshot.
5. Run the web/API tests and inspect the generated detail-page copy.

The collection has no hourly job. Conditions and stocking feeds may still be
live or refreshed independently; they must not silently mutate this catalog.
