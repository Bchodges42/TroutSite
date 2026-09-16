# Exhaustive Tennessee water-data source research — paste-ready prompt

**How to use:** paste everything below the cut line into a fresh, capable research
session in this repository. The session researches and documents; it does not change
product code, content YAML, contracts, geometry, or production data. Its report is the
input to a later implementation session.

---

You are the DATA-SOURCE RESEARCH LEAD for Trout, an offline-first Tennessee fishing
atlas. Find authoritative, usable data sources for every missing or weak fact in the
water catalog: rivers, creeks, tailwaters, reservoirs, lakes, and ponds. Treat this as
an exhaustive gap-closing exercise, not a general web search.

## 1. Required reading and setup

Read these before researching:

- `AGENTS.md` — binding branch, provenance, and safety rules
- `README.md` and `docs/INDEX.md` — product and document map
- `docs/KNOWN-ISSUES.md` — current worklist; do not rediscover resolved items
- `docs/REFERENCE-WATERBODY-INVENTORY.md` and `docs/waterbody-inventory.json` — named reference waters and geometry gaps
- `docs/DATA-SOURCE-COVERAGE.md` and `docs/data-source-coverage.json` — current per-water evidence coverage
- `docs/TN-DATA-SOURCES.md`, `docs/atlas-sources.md`, and
  `apps/web/atlas-sources/verified/*.topology.json` — source decisions, rules, and pinned evidence
- `packages/content/streams/tn/*.yaml` — authored catalog truth and citations
- `apps/web/src/features/map/riverIndex.json` and the final `rivers.geojson` — rendered geometry and labels
- `apps/api/src/evidence/`, `apps/api/src/ingest/`, and `apps/api/src/snapshots/` — currently wired providers and output fields
- `packages/contracts/src/schemas/` — exact contract fields; do not invent incompatible fields

Work from `origin/main` in a fresh research branch according to `AGENTS.md`. Keep the
working tree free of unrelated edits. Do not read or quote secrets, tokens, or private
files.

## 2. Define the complete research universe

Build the research ledger from files, not memory. It must include:

1. Every current stream/catalog ID in the content pack and `riverIndex.json`.
2. Every named water in `waterbody-inventory.json`, including items not yet in the
   catalog or atlas geometry.
3. Every `missing-line`, `missing-polygon`, point-placeholder, fragmented, or
   approximate geometry item in the reference/inventory docs.
4. Every water in `docs/data-source-coverage.json` with a missing flow, temperature,
   level, stocking, species, regulation, access, or source citation.
5. Every unmatched TWRA stocking name/alias and every named-water candidate from the
   NHD/network overlay. Preserve the raw name and county so ambiguous names cannot be
   silently merged.
6. Any reservoir, tailwater, dam, river reach, or lake mentioned by an existing
   official source but absent from the catalog.

Known seed gaps to verify rather than blindly trust include Mississippi, Obion,
Hatchie, Wolf, Tennessee, Cumberland, Buffalo, and Holston rivers; Pickwick Lake;
the West Tennessee point-anchored lakes/ponds; and any missing upper/lower/reach
siblings surfaced by the inventory. Derive the final list programmatically and report
the exact count and IDs.

For each water, distinguish these separate questions:

- Does authoritative geometry exist, and can it be joined to the correct reach?
- Does an authoritative identity record exist (GNIS/NHD ComID, HUC, county, dam/pool,
  or agency water ID)?
- Is the water actually a fishery for trout, warmwater species, or unknown?
- Is there a current flow, release, level, and/or temperature observation?
- Is there historical or seasonal evidence when no live feed exists?
- Is there official stocking, regulation, access, closure, or advisory information?
- Can the source be reused lawfully and politely in this product?

Never treat a missing value as evidence that the water does not exist. Never merge
same-name waters without county, coordinates, reach, or agency-ID evidence. Pay special
attention to Wolf River (West Tennessee vs Fentress), Buffalo River vs Little Buffalo,
main Cumberland vs South Fork Cumberland, Duck/Elk reaches, Holston forks, and lakes vs
their tailwaters.

## 3. Source families to exhaustively investigate

Research each family below and add credible Tennessee-specific sources discovered along
the way. Existing sources are not automatically sufficient: verify their actual
coverage and identify the uncovered waters.

### Water identity and geometry

- USGS National Hydrography Dataset / The National Map staged products
- NHDPlus HR value-added attributes, flow direction, stream order, and catchments
- GNIS names and feature IDs
- USGS 3DEP and Census/TIGER/AREAWATER where they help validate boundaries
- Tennessee state GIS, TDEC watershed layers, and agency waterbody inventories
- TVA, USACE, TWRA, NPS, Cherokee National Forest, and reservoir operator GIS

For each geometry source, record download/API URLs, feature identifiers, name fields,
coordinate reference system, refresh cadence, licensing, simplification limits, and
the exact catalog gaps it can fill. State whether the output is suitable for
selectable geometry, background-only network linework, a polygon, or a point anchor.

### Flow, releases, levels, and temperature

- USGS NWIS stations and Water Services APIs, including temperature-only and lake
  stations not currently wired
- TVA reservoir, dam, generation, release, elevation, forebay, and tailwater data
- USACE Corps Water Management System / CDA and district reservoir pages
- TDEC, EPA Water Quality Portal, WQX, and other periodic temperature observations
- NOAA/NDBC buoys or lake observations where applicable
- NWS observations and nearby weather/air-temperature context as a documented fallback
- Dam, utility, municipal, and reservoir-owner feeds with explicit reuse terms

For each candidate, find the closest usable Tennessee station/feed for every featured
river and reservoir-connected water. Capture parameter codes, units, timestamps,
timezone, sampling/cadence, historical depth, rate limits, outage behavior, and
whether it can feed a live score, a seasonal baseline, or only a source link.

### Fishery, stocking, regulation, access, and advisories

- TWRA trout stocking, warmwater regulations, proclamations, public fishing areas,
  boat ramps, and management plans
- NPS/GSMNP rules and access for park waters
- Cherokee National Forest and other USFS recreation/access records
- TVA and USACE recreation/access pages and tailwater safety notices
- TDEC fishing/bacteriological advisories and closure notices
- State parks, municipalities, county parks, reservoirs, and official lake-management
  organizations for smaller lakes and ponds
- OSM/Overpass only as a clearly attributed candidate source for access or names, never
  as authoritative species/regulation truth

For each source, separate current law/safety facts from editorial fishing guidance.
Record effective dates, geographic boundaries, species, reach limits, and whether the
source is suitable for automated ingestion or requires human review.

## 4. Research method

Use official primary sources first. Search engines may discover a page, but a result
snippet, blog, map pin, or forum post is not evidence. Open the underlying source and
record the exact URL, title, section/table/API request, and retrieval date.

For APIs/downloads, make only a few polite Tennessee sample requests per host using a
declared user agent such as:

`Trout-water-source-research/1.0 (contact: hodgeben4@gmail.com)`

Cache responses locally when practical. Stay within robots.txt, terms, rate limits,
and any stated API quotas. Do not log in, solve CAPTCHAs, bypass blocks, or scrape a
source whose reuse terms are unclear. A failed fetch is a finding: record the HTTP
status, failure mode, and a human/manual alternative.

For every provider, verify at least one Tennessee sample response and preferably one
sample from each distinct source shape (river gauge, reservoir, temperature, stocking,
geometry). Do not claim statewide coverage from a single successful sample.

Use a repeatable query recipe for every water:

1. Exact name + county + Tennessee.
2. Name aliases, reach/tailwater/dam/pool terms, and known coordinates.
3. Official agency domain plus the relevant fact (`flow`, `temperature`, `release`,
   `stocking`, `regulation`, `access`, `closure`, or `GIS`).
4. Identity join using GNIS/NHD/HUC, USGS site, TVA/USACE dam, TWRA name, county, and
   coordinates.
5. Conflict check against the existing YAML and coverage ledger.

## 5. Required evidence ledger fields

Produce one row per water × fact category, even when the result is unresolved. At
minimum include:

`waterId`, `waterName`, `aliases`, `waterType`, `counties`, `region`, `factCategory`,
`currentValueOrGap`, `authority`, `sourceTitle`, `sourceUrl`, `endpointOrQuery`,
`agencyIdentifier`, `sampledAt`, `observedAtIfAvailable`, `format`, `units`, `cadence`,
`historicalDepth`, `coverageExtent`, `joinMethod`, `reuseLicenseOrTerms`,
`automationSuitability`, `ingestComplexity`, `scoreUse` (`live`, `baseline`, `context`,
or `not suitable`), `confidence`, `conflicts`, `nextAction`, and `notes`.

Confidence is evidence quality, not fishing importance:

- `high`: primary agency source, exact identity join, current or clearly dated fact
- `medium`: primary source with a documented manual join or stale/periodic cadence
- `low`: secondary/candidate source or unresolved identity
- `unresolved`: no defensible source found after the required search

Every `unresolved` row must include the searches attempted and a concrete next action.
Do not fill gaps with guesses, inferred species, copied competitor data, or a generic
homepage URL that does not support the claimed fact.

## 6. Deliverables

Write these research-only artifacts:

- `docs/reports/2026-09-14-exhaustive-water-source-research.md` — executive summary,
  methodology, source matrix, per-water gap matrix, identity conflicts, licensing/
  etiquette notes, and prioritized implementation recommendations.
- `docs/reports/2026-09-14-exhaustive-water-source-ledger.json` — machine-readable
  ledger with the fields above and retrieval metadata.
- `docs/reports/2026-09-14-exhaustive-water-source-queries.md` — reusable endpoint and
  search recipes, including sample requests and expected response shapes.

The report must include these summary tables:

1. All waters missing canonical line/polygon geometry or still using a point anchor.
2. Every featured/major water lacking live flow, release, level, or temperature.
3. Every catalog water lacking authoritative species/fishery evidence.
4. Every unresolved TWRA stocking alias and proposed disambiguation.
5. Each source with verified sample URL, coverage count/list, cadence, reuse terms,
   ingest effort, and recommended product use.
6. Priorities grouped as `P0 safety/identity`, `P1 featured coverage`, `P2 catalog
   completeness`, and `P3 long-tail enrichment`.

Do not modify product code, YAML, contracts, geometry, generated snapshots, CI, or
production. Do not create implementation branches or claim that a source is wired.
If an existing document is contradicted, record the contradiction in the new report
with URLs and retrieval dates; do not silently rewrite the old provenance record.

## 7. Completion gates

Before finishing, verify:

- The ledger covers the complete derived water universe and states its exact count.
- Every known inventory geometry gap and every coverage gap has a row or an explicit
  documented exclusion.
- Every source claim has a direct URL and retrieval date.
- No source is labeled “official” without identifying the agency and exact page/feed.
- No same-name waters were merged without an auditable identity join.
- Sample requests were polite, minimal, and recorded with status/format.
- The report distinguishes live observations, historical baselines, scheduled releases,
  editorial guidance, and unresolved gaps.
- The final section is a ranked handoff for a later implementation session, including
  which source should fill which water and field, plus the evidence needed to accept it.

Report the branch name, files created, exact water count, source count, unresolved
count, and the highest-priority next actions. Do not present the research as shipped
product functionality.
