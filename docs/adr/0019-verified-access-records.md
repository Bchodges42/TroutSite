# 0019. Verified access records: a reviewed pipeline that ships empty until the field work is real

- **Status:** accepted (pipeline + UI built; record content owned by the editor/owner authoring flow)
- **Date:** 2026-09-30
- **Decider:** ACCESS lane (feat/site-improvement-20260930), per the verified-access plan feature

## Context

The PWA tells anglers where access is — parking, boat ramps, public entries, accessible
facilities, walk-ins — but the catalog currently carries no reviewed access information at all.
Two failure modes are unacceptable here, and both are common in fishing apps:

1. **Invented access.** A plausible-sounding "public boat ramp" that no one confirmed, which
   sends a visitor to a locked gate or a private bank. This project's honesty policy
   (provenance-first content, cited sources, explicit uncertainty — ADRs 0007/0010) forbids it.
2. **Stocking-marker conflation.** TWRA stocking schedules name points where fish are *put in
   the water*. Those markers say nothing about where the public may lawfully park, stand, or
   launch — and treating them as access points is a private-property incident waiting to happen.

So this feature ships the **schema, pipeline, gate, and UI for reviewed access records with a
corpus of ZERO records**. The water-page section renders an honest empty state until field-
reviewed records are authored through the normal YAML → PR → review pipeline
(docs/access-AUTHORING.md). Absence of verified access is *stated*, never implied.

## Decision

### 1. Record model (binding)

One record = one access point at one water (or named reach). Files live in
`packages/content/access/tn/*.yaml`, one record per file. Fields:

| field | rule |
|---|---|
| `id` | required, lowercase slug; **`example-` prefix is reserved for test fixtures** (§6) |
| `waterId` | required; must exist in the `streams/` catalog (loader cross-checks) — every claim carries a water association |
| `reach` | optional named reach, so big waters carry several distinct entries |
| `kind` | required enum: `parking \| boat-ramp \| public-entry \| accessible-facility \| walk-in` |
| `coordinates` | optional `{lat, lng}` inside the TN plausibility box (lat 33–37, lng −91 to −81) |
| `fee` | optional `{amount, notes?}` — fees are a FIELD, not a record |
| `hours` | optional free text, as the managing agency states it |
| `closure` | optional `{window, notes?}` — closures are a FIELD, not a record |
| `officialSource` | **required** `{url (https-only), publisher, retrievedAt (YYYY-MM-DD)}` — a source-less record cannot pass the gate |
| `reviewDate` | **required** YYYY-MM-DD — when a human last confirmed the claim against reality |
| `uncertainty` | optional free text; **REQUIRED when `coordinates` is absent or `kind` is `walk-in`** |
| `notes` | required, visitor-facing |

Schema: `packages/content/scripts/access/schema.ts` (zod); loader/cross-checks:
`packages/content/scripts/access/load.ts`; wired into the CI gate (`scripts/validate.ts`) and
the pack build (`scripts/build.ts`) so the gate and the build can never disagree.

### 2. Official source is not optional

Every record cites exactly one official source — an agency access page, land-manager page, WMA
unit map, or municipal parks page — with the publisher named and the retrieval date recorded.
The validator rejects source-less records and non-https URLs (same policy as stream
`officialSources`). The UI renders it as "Verify with \<publisher\>" so the visitor can always
check the primary source. A secondhand source (forum post, blog, trot-line comment section) is
not an official source and must never be cited in this field.

### 3. A stocking marker is NEVER a verified access point

TWRA stocking schedules (and any future stocking feed) name release points. Those coordinates
describe where fish entered the water; they carry **no** information about ownership, parking,
legal entry, or safety. An access record's `officialSource` must be an access-relevant source —
never a stocking schedule alone. A record whose only citation is a stocking table is invalid on
its face; reviewers must reject it, and authors must not file it. This is a review-policy rule
(the schema cannot detect intent) and it is binding; docs/access-AUTHORING.md restates it with
worked examples.

### 4. Review and uncertainty discipline

`reviewDate` is the record's honesty clock: the day a human last verified the claim on the
ground or against the managing agency's current page. `uncertainty` is first-class, not an
apology: any record without coordinates MUST say how the entry is found in words, and walk-in
records MUST say what is unconfirmed (trail state, landowner signs, seasonal gates). The UI
renders uncertainty prominently, above the fold of the record card. Records are re-reviewed when
a reporter challenges them (corrections pipeline, ADR 0015) or when the source page changes.

### 5. Pack emission — honest empty, stable shape

`pnpm --filter @trout/content build` emits `dist/pack/access.json`, grouped by waterId:

```json
{ "records": [ { "waterId": "barren-fork-river", "access": [ /* AccessRecord[] */ ] } ] }
```

An empty corpus still emits `{ "records": [] }` — the file always exists and the shape never
changes, so the client cannot confuse "no verified access" with "missing file". The pack
travels the same precached `/content/*.json` path as taxa/patterns (precache glob
`content/**/*.json` in vite.shared.ts), so the section works offline; an empty 20-byte file
keeps the pack budget trivially green (1.48 MB / 20 MB at this writing).

### 6. Example-record isolation — id prefix, not a manifest (documented choice)

The corpus includes exactly ONE example record,
`packages/content/access/tn/example-boat-ramp-parking.yaml`, marked as a fixture. Isolation
mechanism: **the `example-` id prefix**. A record whose id starts with `example-` is
schema-validated like any record but (a) must use the reserved `waterId: example-water-id`
(which is deliberately not a real catalog water), (b) is exempt from the catalog cross-check,
and (c) is excluded from `dist/pack/access.json` (enforced in the loader and again, as a last
line of defense, in `toAccessPack`).

Chosen over a manifest file because the convention survives renames/moves with nothing to keep
in sync, and it fails safe in both directions: a real record accidentally prefixed
`example-` stops shipping (a missing record is noticed in review), while an example record can
never ship. The validator additionally rejects a *non-example* record that uses the reserved
`example-water-id`.

### 7. UI — user-controlled external actions

`apps/web/src/features/waters/AccessSection.tsx` fetches `/content/access.json` through the
existing `fetchSnapshot` offline-first pattern (Dexie → service-worker-cache recovery tiers) and
renders the water's records as cards: kind label, coordinates with a **Copy coordinates**
button (clipboard, explicit click), an **"Open directions" link to a maps URL built
client-side** — rendered as a plain anchor the visitor clicks, never auto-opened — plus
fee/hours/closure fields, "Verify with \<publisher\>" source link, review date, and prominent
uncertainty. With zero records for a water it renders, verbatim:

> No verified access records for this water yet — stocking markers are not verified public
> access points.

Integration: the coordinator inserts `<AccessSection waterId={id} />` below `ReleasesPanel` on
StreamDetailPage (that file is owned by another lane this wave; this ADR records the intent).

## Consequences

- The gate (validate + build + tests) enforces the record contract mechanically; review policy
  (stocking markers, source quality, field work) is enforced by humans per
  docs/access-AUTHORING.md, and the corpus ships empty until that work genuinely happens.
- Growing the corpus is additive YAML — no contract change, no client change; the pack budget
  absorbs records at ~200 bytes each against a 20 MB ceiling.
- Future work (not built): staleness surfacing (aging `reviewDate` as a warning chip), a
  per-reach map, and an "Suggest a correction" deep link from each card into the ADR 0015 flow.
