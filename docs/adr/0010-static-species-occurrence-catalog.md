# ADR 0010 — Static, source-backed species occurrence catalog

- Status: Accepted
- Date: 2026-09-17
- Owners: Role 1 (contracts), Role 4 (content), Role 2 (web)

## Context

The stream catalog has a `targetSpecies` field for the seven species supported by
the fishability scorer. That field answers “what is this water managed for?” but
does not provide a general fish inventory, species-level trout composition, or a
way to distinguish a regulation mention from a wild-population record.

The product needs better Tennessee water accuracy without depending on Fishbrain
or another restricted user-generated platform. A live species scraper would also
make provenance, change review, and offline behavior harder to reason about.

## Decision

Add `SpeciesOccurrenceCatalog` as a separate additive contract. Its checked-in
source is `packages/content/data/species-occurrences.json`; content builds emit
it as `species-occurrences.json`, and the API serves it at
`/content/species-occurrences.json`.

Each association records:

- stable fish taxonomy metadata (common and scientific names);
- one or more exact catalog water ids;
- `evidenceType`: agency fishery list, stocking record, wild population, or
  regulation context;
- high/medium/low evidence confidence and optional seasonal months; and
- a dated HTTPS source record with a curator basis.

The first snapshot is a static normalization of already-reviewed TWRA, NPS,
USGS, and other agency references in the repository. It does not scrape
Fishbrain, copy private/user-generated observations, claim survey counts, or make
runtime network requests. A new snapshot requires a human-reviewed commit.

`targetSpecies` remains the fishability scorer's managed-species input. The new
catalog is additive and descriptive; regulation-only rows are never treated as
proof of abundance.

## Consequences

The stream detail page can show richer fish context while keeping an honest
“recorded” label and a visible evidence gap for waters without a collected row.
The static file is cached by the existing offline snapshot layer. Future
collection work can add TWRA survey tables, NPS/USFS material, and public
agency datasets without changing the runtime read path.

The initial snapshot covers 17 fish taxa, 314 unique water/species associations,
and 79 of the 190 currently cataloged Tennessee waters. The remaining waters are
deliberately left unclassified until a source-backed record is reviewed.
