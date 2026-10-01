# Authoring verified access records (`packages/content/access/tn/`)

This is the field-by-field guide for adding **sourced public access** records — parking,
boat ramps, public entries, accessible facilities, walk-ins — to a water's page. Read
[ADR 0019](adr/0019-verified-access-records.md) for the binding rules; this document is the
how-to.

> Every record must state how it was reviewed. `verificationMethod: official-source`
> means a fresh read of the land manager's page; `field-visit` requires an actual
> on-site visit. Never describe source review as field verification. The initial
> [two-record pilot](research/access-pilot-2026-10-01.md) uses official NPS pages
> and explicitly identifies unverified coordinates, bank routes and current conditions.

## The one rule everything else serves

**Every claim carries an official source, a water association, a review date, and — where
reality is messier than the schema — an explicit uncertainty.** A record you could not defend
to the land manager does not ship.

And the special case worth memorizing: **a stocking marker is never a verified access point.**
TWRA stocking schedules name where fish are *put in the water*. They say nothing about where
you may lawfully park, stand, or launch. Never cite a stocking schedule as a record's
`officialSource`, and never author an "access point" whose evidence is a stocking table.

## Where records live

- Directory: `packages/content/access/tn/` — one YAML file per record.
- Filename: `<record-id>.yaml` (e.g. `caney-fork-ramp-center-hill-dam.yaml`).
- The CI gate (`pnpm --filter @trout/content validate`) and the pack build both run the same
  loader; a rejected record fails the build, so a bad record cannot slip into `dist/pack/access.json`.

## Field-by-field

| field | required | rules |
|---|---|---|
| `id` | yes | lowercase slug (`a-z`, `0-9`, dashes). Stable forever — it is the record's identity. The `example-` prefix is **reserved** for the test fixture and never ships. |
| `waterId` | yes | Must be a real id from `packages/content/streams/tn/`. The loader cross-checks; a typo fails the gate. |
| `name` | recommended | Official place name, used by the card and trip selection. |
| `verificationMethod` | yes for new records | `official-source` or `field-visit`. Older rows without it are displayed conservatively as source review. |
| `reach` | no | Named reach for big waters (`Below the dam`, `Mile 7 riffle`) so one water carries several records. |
| `kind` | yes | Exactly one of: `parking`, `boat-ramp`, `public-entry`, `accessible-facility`, `walk-in`. Fees/hours/closures are **fields**, not kinds. |
| `coordinates` | no | `{lat, lng}` decimal degrees inside the TN box (lat 33–37, lng −91 to −81). Only if you actually have them from the field or the official source. |
| `fee` | no | `{amount, notes?}` — e.g. `amount: $5 per vehicle`, `notes: Honor box, exact change.` |
| `hours` | no | As the managing agency states it (`Daylight hours only`). |
| `closure` | no | `{window, notes?}` — e.g. `window: Dec 1 – last day of Feb`, `notes: Vehicle gate closed; walk-in access remains open.` |
| `officialSource` | **yes** | `{url, publisher, retrievedAt}`. URL must be **https** and the *access-relevant* official page (agency access table, WMA unit map, land manager, municipal parks). `retrievedAt` is the day YOU read it. |
| `reviewDate` | **yes** | YYYY-MM-DD — the day a human last confirmed this record against reality (field visit or a fresh read of the official page). |
| `uncertainty` | conditional | **REQUIRED when `coordinates` is absent, and REQUIRED for `kind: walk-in`.** Free text: say exactly what is unconfirmed. |
| `notes` | **yes** | Visitor-facing copy: what a person needs to know on the ground. |

## Worked example — GOOD

```yaml
# packages/content/access/tn/caney-fork-upper-ramp.yaml  (illustrative)
id: caney-fork-upper-ramp
waterId: caney-fork-river
reach: Upper river, below the dam
kind: boat-ramp
coordinates:
  lat: 35.83
  lng: -85.51
fee:
  amount: $6 per vehicle
  notes: Payable at the gate kiosk; cash only.
hours: Sunrise to sunset
closure:
  window: Dec 1 – Mar 15
  notes: Ramp closed for the seasonal drawdown; bank access remains open.
officialSource:
  url: https://www.tn.gov/twra/fishing/fishing-access.html
  publisher: Tennessee Wildlife Resources Agency
  retrievedAt: 2026-09-28
reviewDate: 2026-09-28
uncertainty: Ramp condition at low pool not confirmed in the field; official page lists the
  closure window but not launch condition.
notes: Two-lane concrete ramp with a floating dock; gravel lot holds roughly 20 trucks.
```

Why it passes: real catalog `waterId`; one https official source with a named publisher and
retrieval date; same-day `reviewDate`; coordinates inside the TN box; and an `uncertainty`
that says precisely what was *not* verified instead of implying precision.

## Worked examples — BAD (the gate or review rejects each)

**1. Source-less record (gate rejects — every record cites an official source):**

```yaml
id: mystery-landing
waterId: caney-fork-river
kind: parking
reviewDate: 2026-09-28
notes: "Everyone puts in here."   # ← no officialSource: fails `pnpm validate`
```

**2. Stocking marker posing as access (review rejects — binding rule):**

```yaml
id: wolf-river-stock-point
waterId: wolf-river-fentress
kind: public-entry
officialSource:
  url: https://www.tn.gov/twra/fishing/trout-information-stockings.html
  publisher: TWRA
  retrievedAt: 2026-09-28
reviewDate: 2026-09-28
notes: Stocked here per the 2026 schedule.   # ← a release point, not a public entry;
                                              #    no evidence the public may enter here
```

**3. Invented coordinates (gate rejects — outside the TN plausibility box; also a review
reject if the box had allowed them):**

```yaml
coordinates:
  lat: 45.12   # ← Montana. Fails: "lat above the TN plausibility box (37)"
  lng: -110.4
```

**4. Walk-in with no uncertainty (gate rejects):**

```yaml
id: steep-creek-walk-in
waterId: steep-creek
kind: walk-in
coordinates: { lat: 35.9, lng: -84.2 }
# ← missing `uncertainty`: REQUIRED for walk-in records
```

**5. Typo'd waterId (gate rejects):**

```yaml
waterId: caney fork river   # ← spaces/typos fail; must match streams/tn/*.yaml exactly
```

## Review checklist (PR reviewer + author)

1. `waterId` exists in `packages/content/streams/tn/` and matches the water identified by the official source or actual visit.
2. `officialSource` is the access-relevant official page — not a stocking schedule, not a forum.
3. You opened the source URL on `retrievedAt` and it says what the record says.
4. `reviewDate` reflects real confirmation (field visit or current official page), not hope.
5. Coordinates came from your GPS or the official source — never guessed from a map eyeball.
   If you have none, `uncertainty` explains how to find the entry in words.
6. `kind: walk-in` ⇒ `uncertainty` present and specific.
7. Fee/hours/closure text matches the agency's current wording; note the season you verified.
8. Filename equals `<id>.yaml`; id does not start with `example-`.
9. `pnpm --filter @trout/content validate && pnpm --filter @trout/content test` pass locally.

## How records reach the app

`pnpm --filter @trout/content build` groups shippable records by `waterId` into
`dist/pack/access.json` (precached with the rest of the content pack). The water page's
"Sourced access" section renders them with their review method; a water with no records shows:
*"No sourced access records for this water yet — stocking markers are not verified public
access points."* The single fixture, `access/tn/example-boat-ramp-parking.yaml`
(id prefixed `example-`, `waterId: example-water-id`), is a schema test fixture that the
validator validates but never ships.

Trips can select individual published IDs for their chosen waters. Selections
are private Dexie data and use the same offline access pack. If a record is
retired or no longer belongs to the trip's waters, its saved ID is retained and
labelled unavailable until the visitor removes it. That label does not establish
a closure. These IDs are excluded from the minimal copied public trip plan.
