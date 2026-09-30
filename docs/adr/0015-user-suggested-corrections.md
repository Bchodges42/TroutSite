# 0015. User-suggested water corrections: public write + moderated review handoff

- **Status:** accepted (web side built; transport owned by the API lane)
- **Date:** 2026-09-30
- **Decider:** CORRECTIONS lane (web), handing to the API lane on a leased `apps/api` tree

## Context

The PWA shows reviewed content (catalog, regulations, stocking associations, sources) with a
provenance-first honesty policy, but a visitor who spots a wrong claim has no way to say so. This
ADR ships the complete web side — composer, receipt lookup, page, pure validation — against the
transport specced here. `POST /v1/corrections` becomes **the second public write route** (after
`POST /v1/portal/reports`, ADR 0003) and the **first with no credential at all**, which sets the
threat model: anonymous, rate-limited, spam-resistant, and zero-PII by construction.

Hard constraints: the reporter gets no account and provides no identity; the receipt code is the
only handle they ever hold; approved corrections must never mutate public data directly (content
changes flow through the reviewed YAML/branch/PR pipeline like every other edit); the API must
never fetch reporter-supplied URLs.

The web implementation this hands off to lives in
`apps/web/src/features/corrections/{correctionSchema.ts,CorrectionForm.tsx,CorrectionStatus.tsx}`
and `apps/web/src/pages/CorrectionsPage.tsx`; its wire behavior is frozen by the contract below.

## Decision

### 1. Routes (additive; the API lane implements exactly these)

**`POST /v1/corrections`** — create a correction suggestion.

- Request: `application/json`, UTF-8, **body ≤ 16 KiB** (reject `413` above; the largest legal
  submission is ≈6.5 KiB, so 16 KiB leaves header-free headroom without inviting abuse).
- Response success: `202 Accepted` — *not* 201: nothing is published, the payload is queued for
  moderation. Body: `{ "receiptCode": "ABCDE-FGHJK-MNPQR" }` (format below). The code is shown to
  the reporter exactly once; the API never returns it again (only its status, keyed by it).
- Validation (must mirror `correctionSchema.ts` 1:1 — the client duplicates these checks so errors
  show instantly, but the server re-validates everything; on failure `422` with
  `{ "errors": { <field>: <message> } }`):

  | field | rule |
  |---|---|
  | `waterId` | required, non-empty, no whitespace, ≤ 128 chars; must resolve in the current catalog (else `422`) |
  | `waterName` | optional, ≤ 200 chars; informational only — the id is authoritative |
  | `category` | required enum: `water-identity \| species-or-season \| stocking-association \| gauge-or-source \| access \| regulations \| other` |
  | `field` | optional, ≤ 200 chars — which displayed claim is wrong |
  | `currentValue` | optional, ≤ 2000 chars |
  | `proposedCorrection` | required, 10–2000 chars after trim |
  | `whatAppearsWrong` | optional, ≤ 2000 chars |
  | `sourceUrl` | optional; when present must parse as an **https-only** URL, no userinfo (`user:pass@`), ≤ 2048 chars (same bound as shop-report `photoUrl`, ADR 0002) |
  | `sourcePubDate` | optional `YYYY-MM-DD`, real calendar date, not in the future |
  | `reporterEmail` | optional, ≤ 320 chars, syntax-checked; **the v1 web UI never offers it** — accepted only so a later UI needs no contract change |
  | `honeypot` | must be absent or empty; any content ⇒ `202` + discard (silent drop, no receipt distinction — spammers must not learn they were caught) |
  | `submittedAt` | required epoch-millis number, ≤ 60 s in the server's future; the server stamps its own `receivedAt` regardless |

**`GET /v1/corrections/status/:code`** — receipt lookup, no other credential.

- Response `200`: `{ "code", "status", "waterId"?, "category"?, "updatedAt"?, "note"? }` where
  `status ∈ received | needs-more-evidence | accepted | rejected | resolved` (public vocabulary,
  §4). `note` carries the required rejection reason (`rejected`) or moderator context.
- `404` for an unknown/expunged code — identical shape to a typo'd code; the response must not
  reveal whether a code ever existed beyond that.
- No caching of this route (`cache-control: no-store`): status moves, and a cached "received"
  must never outlive an "accepted".

### 2. Receipt codes: shown once, stored only as a hash

- Format: `XXXXX-XXXXX-XXXXX` — 15 chars of **Crockford base32** (alphabet
  `0123456789ABCDEFGHJKMNPQRSTVWXYZ`, no I/L/O/U) in three dash-separated groups. Human-dictatable
  and mishear-proof; the client validates exactly this shape
  (`RECEIPT_CODE_RE` in `CorrectionStatus.tsx`) before hitting the network.
- Entropy: 75 bits from a CSPRNG (`crypto.randomBytes`/`getRandomValues`) — far beyond offline
  guessing of any single receipt, and the enumeration incentive is nil (each guess is a rate-
  limited request that answers only "not found").
- Storage: **only a keyed hash of the normalized code** (`HMAC-SHA256(CORRECTIONS_RECEIPT_PEPPER,
  normalized-uppercase-code)`, constant-time compare on lookup). The plaintext code is never
  persisted, never logged, and appears in no export — a database leak cannot let anyone look up or
  correlate receipts. `CORRECTIONS_RECEIPT_PEPPER` is a distinct secret from `PORTAL_SECRET`,
  `WATCHDOG_TOKEN`, and the moderator credential (§5).
- Normalization before hashing: trim, uppercase, whitespace → dash (the client does the same in
  `normalizeReceiptCode`).

### 3. Moderation queue + retention

SQLite (same store as the portal tables), additive migration:

```sql
CREATE TABLE corrections (
  id            INTEGER PRIMARY KEY,          -- internal, never exposed
  receipt_hash  BLOB NOT NULL UNIQUE,         -- HMAC(pepper, code); NO plaintext column
  received_at   TEXT NOT NULL,                -- server clock, ISO-8601
  water_id      TEXT NOT NULL,
  water_name    TEXT,                         -- as reported; informational
  category      TEXT NOT NULL,                -- §1 enum
  field         TEXT, currentValue TEXT,
  proposed      TEXT NOT NULL,
  why_wrong     TEXT,
  source_url    TEXT,                         -- stored opaque; NEVER fetched (§6)
  source_pub_date TEXT,
  reporter_email TEXT,                        -- present only if a future UI sends it
  status        TEXT NOT NULL DEFAULT 'received',
  review_note   TEXT,                         -- required when status='rejected'
  duplicate_of  INTEGER REFERENCES corrections(id),  -- cluster parent (§7)
  risk_flags    TEXT NOT NULL DEFAULT '',     -- honeypot-hit, rate-limit-hit, dup-cluster size
  reviewed_by   TEXT, reviewed_at TEXT,       -- moderator credential id (§5), audit trail
  updated_at    TEXT NOT NULL
);
```

Retention (enforced by a periodic job, same scheduler as the snapshot crons):

- Submission **content**: kept while `status ∈ received|needs-more-evidence`, then **90 days**
  after reaching a terminal state (`accepted|rejected|resolved`), then row-deleted (the content
  change, if any, lives on in the YAML/PR history — the queue is not an archive).
- **Request metadata** (IP, user agent): never in the `corrections` table. Kept at most **30 days**
  in a separate abuse-ledger table (rate-limit counters + hash), then purged. Logs rotate per the
  existing host policy; corrections routes must not log bodies or receipt codes.
- Expunged receipts answer `404` forever after — a closed suggestion leaves no trace.

### 4. Review states (public vocabulary; web already renders all of them)

`received → needs-more-evidence | accepted | rejected | resolved`, with these exact meanings:

- **received** — queued, unreviewed.
- **needs-more-evidence** — seen, but a source or specific detail is missing; reporter may
  resubmit (a fresh submission that clusters into the same duplicate family reopens nothing).
- **accepted** — approved; per §6 this triggers a *content-change proposal*, not a publish.
- **rejected** — checked against sources, current content stands; `review_note` (the
  rejected-with-reason) is mandatory and is what `GET status/:code` returns in `note`.
- **resolved** — closed without its own content change, typically a duplicate (with
  `duplicate_of` set) or out-of-scope report.

No SLA dates anywhere in the API responses or the UI copy — the vocabulary promises review, never
a timeline.

### 5. Credentials and transport hardening

- **Moderator credential is separate**: `CORRECTIONS_MODERATOR_TOKEN` (new env, fail-closed 503
  when unset, same discipline as `PORTAL_SECRET`) authorizes the internal review surface
  (`/v1/corrections/review/*`). It must **never** be accepted by, derived from, or shared with the
  shop-portal HMAC (`PORTAL_SECRET`, ADR 0003) or `WATCHDOG_TOKEN`, and vice versa — one leaked
  credential must not unlock another lane. Review actions are attributed to the credential id in
  `reviewed_by`.
- **Strict origin checks** on the public POST/GET: `Origin`/`Referer` (when present) must match the
  deployed origin allowlist; `Host` pinned; `content-type` must be exactly `application/json`;
  no cookies are read (the flow is credential-free) and no `CSRF` token is needed *because* the
  route accepts no ambient authority. Requests failing origin checks get `403`, counted in the
  abuse ledger.
- **Rate limits per IP** (token bucket, in front of body parsing): **5 submissions/hour/IP** and
  **20/day/IP**; status lookups 30/hour/IP. Over-limit ⇒ `429` + `retry-after`; repeated 429s set a
  `rate-limit-hit` risk flag for moderators. Per-`waterId` burst cap (10 open per water) blunts
  targeted flooding of one page.
- **Body ≤ 16 KiB** hard-enforced before JSON parsing (§1).

### 6. No server-side URL fetching, ever

`sourceUrl` is stored as opaque text and rendered (in the moderator UI) as inert text/copyable
link only. The API must never fetch, resolve DNS for, screenshot, or HEAD-check it: a public,
credential-free write route that fetches URLs is an SSRF pivot and a content-injection channel,
and moderation can open links by hand with normal browser caution. This also means no link
"validation" beyond the §1 syntax check.

### 7. Honeypot + duplicate clustering

- **Honeypot** (field name on the wire: `honeypot`; the form labels it "Leave this field empty" and
  hides it from humans): content ⇒ accept-and-discard per §1, flagged `honeypot-hit`.
- **Duplicate clustering**: on insert, normalize (`waterId` + `category` + lowercase stemmed first
  80 chars of `proposed`) and match against open (`received|needs-more-evidence`) rows of the last
  180 days. Matches link the new row via `duplicate_of` to the oldest open parent (transitive to
  the cluster root) and increment the parent's cluster size. Clustering is advisory metadata for
  moderators, not an auto-close: 3+ identical reports about one water is itself a signal the claim
  may be wrong. `resolved`-as-duplicate keeps the parent's receipt authoritative; children's
  status lookups report `resolved` with the parent referenced in `note`.

### 8. Approval never writes public data directly

An `accepted` correction produces **a source-cited content change through the normal pipeline**:
the API (or its operator CLI) opens a branch + PR against the content YAML that owns the claim —
the same reviewed flow as every accuracy-campaign edit (ADR 0008) — with the correction id, the
reporter's `proposedCorrection`, and the cited `sourceUrl`/`sourcePubDate` in the PR body, and the
provenance ledger entry pointing at the official source. Only when that PR is reviewed and merged
does public content change; the correction row then records `accepted` + the PR link. This keeps
"who approved what" auditable in exactly one place (git + the review table) and preserves the
site's core promise that no unpublished write path can alter what visitors read.

### 9. Privacy: the collection floor

The flow collects **no account, no location, no device data, no logbook data — ever**. No
localStorage/IndexedDB draft persistence on the web side (a closed tab loses the draft; the
unavailable-state copy offers a copyable text block instead). `reporterEmail` exists in the
contract but the v1 UI never renders a field for it; if a future UI enables it, it inherits the
content-retention clock (§3) and must be purgeable with the row. The receipt code is the only
reporter-held identifier and only its hash is stored (§2). Status lookup answers carry no fields
that could identify anyone.

### 10. Review surface requirements (API/UI lane scope, not built here)

The moderator view (admin-lane UI + `/v1/corrections/review/*` endpoints) must provide:

- **Filters**: by `waterId`, `category`, received-date range, duplicate-cluster parent, and risk
  flags (`honeypot-hit`, `rate-limit-hit`, cluster size ≥ 3) — the working order is
  high-risk/clustered first, oldest first within a filter.
- **Audit trail**: every state transition appends (actor credential id, timestamp, from→to, note)
  to a `corrections_audit` table; the row's current state is derivable but history is immutable.
  Audit rows expire with the content-retention clock (§3).
- Actions: `needs-more-evidence` (with note), `reject` (reason mandatory), `accept` (creates the
  §6/§8 content PR and stores its link), `resolve-duplicate` (with parent), plus cluster collapse.

## Consequences

- The web side is complete and honest today: with no endpoint deployed, submissions validate
  locally and render the explicit "opens when the review service ships" state with the composed
  text kept copyable — nothing claims to have been sent. Deploying the API lane's routes lights the
  feature up with **no web change** (the form already POSTs the frozen contract).
- `CorrectionsPage` needs route registration in `App.tsx` (`/corrections`) — coordinator-owned file,
  deliberately untouched here.
- The API lane gains one public unauthenticated surface; the §5 controls (rate limits, origin
  checks, size cap, hashed receipts, silent honeypot) are the price of admission and are not
  optional.
- The queue grows unbounded only between moderation passes; retention jobs (§3) bound it.
- Contract impact: none on `@trout/contracts` — both routes are additive and intentionally absent
  from the frozen `ENDPOINTS` map until they exist (the web seam hardcodes `/v1/corrections*` per
  this ADR); a later additive ENDPOINTS entry may follow once the routes ship.

## Alternatives considered

- **Authenticated accounts / email-verified reporting** — rejected: an identity requirement kills
  the drive-by "this sign is wrong" report, adds PII the site explicitly refuses to hold, and
  moderation already filters quality.
- **Publish approved corrections immediately to the served JSON** — rejected: an unreviewed write
  path into public content breaks the provenance-first contract every other feature obeys; §8's
  PR flow keeps one review authority.
- **Persisting drafts in localStorage** — rejected (privacy-simpler): durable drafts mean durable
  reporter-authored text on the device with no account to delete it from; the copyable-text
  fallback gives the same practical outcome with zero storage.
- **Server-side link prefetch/validation of `sourceUrl`** — rejected: SSRF + content-injection
  surface for zero moderator benefit (§6).
- **Returning the receipt code from `status/:code` lookups keyed by water/category** — rejected:
  any lookup that answers without the code would let third parties enumerate others' submissions;
  the code is the sole credential (§2).
