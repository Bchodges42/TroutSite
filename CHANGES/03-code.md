# Code changes — what changed and why

19 non-content files changed (+822/−36 outside the catalog and research
artifacts). Everything is additive unless marked; no gates were weakened.

## 1. Contracts — the `opportunity` block (ADR 0010)

**`packages/contracts/src/schemas/stream.ts`** (+111)
**`packages/contracts/package.json`** — version `2.2.0` → `2.3.0` (additive
change per the contracts rules: ADR + tag bump)

New exported schemas:

| Schema | What it expresses |
|---|---|
| `OpportunityHeadlineSchema` | `year-round-trout` · `seasonal-stocked-trout` · `warmwater-focus` · `mixed` · `unresolved` — angling OPPORTUNITY at a stated reach, never a biological census |
| `EvidenceStateSchema` | `documented` · `limited` · `historical` · `conflicting` · `unresolved` — evidence quality, kept separate from the headline; no confidence percentages |
| `OpportunitySourceSchema` | one claim-specific source: `label`, `url`, `kind` (10 kinds, e.g. `agency-assessment`, `schedule-table`, `completed-release-report`, `legal-designation`), `observationPeriod`, `publicationDate`, `retrieved` (YYYY-MM-DD, required), `pinpoint` |
| `OpportunitySchema` | the block itself + refinements: an **unresolved** headline MUST state `unresolvedQuestion` (the missing proposition); any **positive** headline MUST carry ≥1 source; `warmwater-focus` cannot rest on unresolved evidence |

`StreamSchema` gains one optional field: `opportunity` — absent = not yet
adjudicated, which every consumer treats exactly like unresolved, never as a
negative.

**`packages/contracts/test/schemas.test.ts`** (+86) — 7 new tests: documented
round-trip, unresolved-with-proposition, missing-proposition rejection,
sources-required rejection, warmwater-focus/unresolved rejection, malformed
retrieved date rejection, reach-scoped headline.

## 2. Decision model — `apps/web/src/features/map/waterDecision.ts`

The single classification authority. Four changes:

1. **The generic Nov–Mar fallback is REMOVED.** Before: every
   `yearRound: false` row without authored months was silently given a
   synthetic `[11,12,1,2,3]` window and could read
   `seasonal-likely-absent` in July — the audited hazard that turned an
   unevidenced season into "likely no fish" for ~80 catalog rows. After:
   seasonal applicability comes only from authored `seasonMonths`.
   ```ts
   // before
   const seasonMonths = feature.stream.seasonMonths ?? (feature.stream.yearRound === false ? [11, 12, 1, 2, 3] : undefined);
   // after
   const seasonMonths = feature.stream.seasonMonths ?? undefined; // NO fallback synthesis
   ```

2. **On a `yearRound: true` water the authored window is its STOCKING
   calendar, not a presence window.** Before: Boone Tailwater
   (year-round + stocking months [12,3,4]) read "PROGRAMMATIC — out of
   season … stocked trout are unlikely to be present" in September — a
   self-contradiction the visual judge caught. After: presence is always
   open on a year-round fishery (`inSeason` ORs with `yearRoundFishery`);
   the window still shows as stocking context.
   ```ts
   const yearRoundFishery = feature.stream.yearRound === true;
   const inSeason = yearRoundFishery || month === undefined || seasonMonths === undefined || seasonMonths.includes(month);
   ```

3. **The catalog's adjudicated `opportunity` block is consumed** and carried
   into `WaterDecisionView.opportunity` (headline, evidenceState, statement,
   reachScope, asOf, caveats, unresolvedQuestion). It refines unauthored
   species fields: documented headlines earn the class outline; unresolved
   earns nothing (no outline = unassessed, never a negative);
   `warmwater-focus` behaves like plain warmwater in trout mode (excluded
   unless a documented trout program keeps it visible, then de-emphasized).

4. **New presentation helpers:** `opportunityHeadlineText`
   ("Year-round trout opportunity", "Warmwater fishing focus", "Trout status
   unresolved"…), `opportunityStatusLabel` (list-row short form), and
   `opportunityEvidenceText` ("Documented · 2026"). `decisionStatusText`
   prefers the adjudicated label over generic fallbacks.

## 3. UI — the Fishery opportunity card

**`apps/web/src/features/map/OpportunityCard.tsx`** (NEW) — shared card
rendering the headline, evidence chip, reach scope ("Documented for: first
~11 miles below Tims Ford Dam"), authored statement, caveat list, the
unresolved question, and up to three source links. Reads ONLY the durable
catalog block (never live conditions). **Renders nothing for unadjudicated
waters.**

**`apps/web/src/features/map/RiverDrawer.tsx`** — card mounted FIRST in the
drawer body (above the conditions assessment).
**`apps/web/src/pages/StreamDetailPage.tsx`** — same card after the title
block, before the mobile decision strip.
**`apps/web/src/index.css`** — `.opportunity-card` styles: same quiet card
family as the season card, left border carries the EVIDENCE STATE (green
documented / amber limited / rust historical+conflicting / gray unresolved),
not a trout verdict; header flex gap fixed (chip no longer collides with the
eyebrow).

**Header responsive fixes** (caught by the visual judge at phone size):
- `.species-mode-toggle button` — `white-space: nowrap; flex-shrink: 0` (the
  "Trout" label clipped to `t` at 390px).
- `.header-actions` — `flex-shrink: 0`; `.header-search` — `min-width: 0`
  (the actions cluster was being squeezed).
- `.privacy-note` — hidden below 1440px (it left-clipped mid-word —
  "…ur device. Out in the wild." — at common laptop widths); `white-space:
  nowrap` when visible.
- `@media (max-width: 640px)` — the header search field is hidden entirely so
  it can never overlap the fish-mode toggle on phones.

## 4. Honest wording — absence claims removed

Work-order rule: *out-of-season wording must not declare "there are no fish"
unless that is actually known.*

| File | Before | After |
|---|---|---|
| `TennesseeMap.tsx` | `', no trout now'` / `' · no trout now'` | `', out of season'` / `' · out of season'` |
| `RiverMapPage.tsx` | "dimmed dashed waters hold no trout right now" | "dimmed dashed waters are out of season" |
| `RiverDrawer.tsx` | calendar `none` chip "Not a trout water" | "No trout program documented" |
| `waterDecision.ts` | presence-absent status "No trout now" | "Out of season" |

## 5. SEO / prerender — `apps/web/scripts/prerender.mjs`

Water pages publish the same opportunity words as the app (label map mirrors
`opportunityHeadlineText`), plus reach scope, statement, and caveat lines. An
**unresolved verdict publishes NO claim** — silence is the honest SEO state
for unadjudicated evidence, never a label.

## 6. API plumbing — the field reaches the client

The snapshot pipeline whitelists stream fields; without this the blocks
existed in YAML but never reached `/v1/streams`.

- **`apps/api/migrations/017_stream_opportunity.sql`** (NEW) —
  `ALTER TABLE streams ADD COLUMN opportunity TEXT;`
- **`apps/api/src/lib/seed.ts`** — stores `JSON.stringify(s.opportunity)` on
  insert/upsert (+ `StreamRow` type).
- **`apps/api/src/snapshots/build.ts`** — emits `opportunity` into
  `streams.json` (+ `StreamRow` type).
- **`apps/api/test/migrations.test.ts`** — migration-count pin 16 → 17.

(The bundled content pack needed no change — it serializes full docs.)

## 7. Tests

**`apps/web/test/water-decision.test.tsx`** — the four T1-18/19 specs that
pinned the Nov–Mar fallback were rewritten to the documented-window shape
(the fixtures now carry authored `seasonMonths`), plus a new explicit
no-fallback regression (yearRound:false with NO window carries no seasonal
verdict, in any month), plus a 7-spec ADR-0010 block: opportunity view
mapping, unadjudicated = unknown (never negative), unresolved stays visible,
warmwater-focus copy neutrality, **lake-vs-tailwater non-inheritance**
(unresolved Center Hill Lake beside a year-round Caney Fork), class-outline
from adjudicated opportunity, reach-scoped seasonal labels.

**`apps/web/test/river-drawer-seasonal.test.tsx`** — fixtures now carry the
authored winter window instead of relying on the removed fallback.

**`packages/contracts/test/schemas.test.ts`** — see §1.

## 8. Repo tooling — `packages/content/scripts/opportunity/` (NEW, 7 scripts)

| Script | Role |
|---|---|
| `lib.mjs` | catalog/atlas loaders, the audited join machinery (normalize, county gate, core-name fallback, coordinate tie-break), schedule/date parsers, forecast scanner, prior-leads + Fishbrain distillers |
| `build-seed.mjs` | emits the seeded ledger: one entry per catalog ID with identity, catalog snapshot, live schedule join, reservoir-list membership, forecast mentions, stocking-point candidates |
| `distill-prior-leads.mjs` | the six habitat-research branches → per-water PRIOR LEADS (explicitly not verdicts) |
| `join-stock-points.mjs` | 730 stocking GIS points → catalog candidates |
| `merge-verdicts.mjs` | folds the 7 adjudication lanes' verdicts into `ledger.json` |
| `apply-opportunity.mjs` | authors the YAML blocks; deterministic yearRound consistency normalization; idempotent; everything else routed to the owner report |
| `verify-ledger.mjs` | the §7 checks (see 06-validation.md) |
| `report-counts.mjs` | the measured count tables |
