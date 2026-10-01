# 0017. Owner dashboard: a read-only, separately-credentialed publication-review surface

- **Status:** accepted (DASHBOARD lane; the API factory is self-contained, app.ts wiring is the coordinator's one line)
- **Date:** 2026-09-30
- **Decider:** DASHBOARD lane on the leased `feat/site-improvement-20260930` tree

## Context

The site has exactly two dynamic surfaces today: the shop portal (shop HMAC tokens, ADR 0003)
and the corrections review queue (moderator shared token, ADR 0015). The site OWNER has no
surface at all: to answer "is the published site healthy, what errored last night, what needs
editorial work?" they would have to log into the server and read `jobs_log`, snapshot files,
and the content pack by hand — or borrow a credential that grants far too much.

The first release of the owner surface is deliberately **READ-ONLY**: it can look at
publication state (pipeline jobs, feed health, queue counts, the editorial research queue),
never touch anything.

## Decision

### 1. Credential boundary — four disjoint secrets

The owner surface gets its OWN credential. The credential spaces are disjoint by design and
must never collapse into one secret or one derivation chain:

| credential | env var | grants |
|---|---|---|
| shop portal | `PORTAL_SECRET` (HMAC mint key) | publish attributed shop reports |
| corrections moderator | `CORRECTIONS_MODERATOR_TOKEN` | review/decide corrections |
| watchdog probe | `WATCHDOG_TOKEN` | read `/healthz` detail |
| **owner dashboard** | **`OWNER_DASHBOARD_TOKEN`** | **read the owner dashboard (nothing else)** |

Consequences enforced in code:

- The owner token is a plain bearer shared secret compared **constant-time**
  (padded `timingSafeEqual`, same discipline as the moderator lane). Every
  `/v1/owner/*` request carries `Authorization: Bearer <OWNER_DASHBOARD_TOKEN>`.
- A structurally valid SHOP token (`v1.<shopId>.<iat>.<exp>.<sig>`) is just another wrong
  string to the owner lane (tested), and vice versa: the shop portal SPA's owner area never
  reads `trout.admin.token`.
- **Fail-closed by absence:** when `OWNER_DASHBOARD_TOKEN` is unset,
  `registerOwnerRoutes` registers NOTHING — `/v1/owner/*` answers 404 rather than a
  503-shaped "exists but off" (contrast: portal/corrections register unconditionally and
  answer 503 because their public/identity surfaces must exist to be honest; the owner
  surface has no public half, so not existing at all is the honest state).
- In the admin SPA the owner token is held **in memory only** (module variable in
  `features/owner/ownerClient.ts`) — never `localStorage`, never sessionStorage, never a
  cookie. A page refresh signs the owner out; this is stated in the UI. The shop token's
  localStorage path (`TOKENS.md`) is untouched and unreachable from the owner code.
- Requests are rate-limited modestly per IP (60/hour, 240/day sliding windows, reusing the
  corrections lane's bounded `SlidingWindowRateLimiter`) **in front of** the auth compare, so
  token guessing is bounded. The limiter is in-memory only; no request metadata is persisted.

**Env contract (coordinator wires):** add to `apps/api/src/env.ts`:

```ts
/** Shared secret for the read-only owner dashboard (/v1/owner/*, ADR 0017).
 *  The factory registers nothing without it. A distinct secret — never the
 *  portal HMAC, never CORRECTIONS_MODERATOR_TOKEN, never WATCHDOG_TOKEN. */
OWNER_DASHBOARD_TOKEN: z.string().min(1).optional(),
```

and one line in `apps/api/src/app.ts` inside `if (options.db)`:

```ts
import { registerOwnerRoutes } from './owner/routes.js';
// ...
registerOwnerRoutes(app, {
  db: options.db,
  snapshotsDir: options.webPublicDir,
  contentDir: options.webPublicDir ? join(options.webPublicDir, 'content-pack') : undefined,
  ownerToken: loadEnv().OWNER_DASHBOARD_TOKEN,
});
```

### 2. Why read-only in v1

Every existing write surface has a story for abuse bounding and attribution: the portal has
HMAC identity + idempotency keys, corrections has moderation + honeypot + retention. An
owner surface that can *act* (re-run a job, edit content, close a correction) has none of
that yet, and an all-powerful token with no audit is the worst possible first move. So v1
ships **GET-only** endpoints and the UI renders an explicit "read-only" note and no action
buttons. Looking is safe; touching is a future decision.

### 3. What future operational actions would require

Any POST/PUT on this surface (job trigger, content edit, queue decision, notification test)
must add, before it ships:

1. **Separate authorization** — owner-token holders are not automatically operators; actions
   need their own scoping (per-action allowlist or a second credential), because "can see
   health" and "can restart the pipeline" are different blast radii.
2. **An audit trail** — who did what, when, with what arguments, persisted server-side (the
   pattern to copy is `corrections_audit`: append-only rows with actor + action + from/to).
3. The same abuse floors the other write lanes have: rate limiting per action, bounded
   payloads, and no new secrets echoed in payloads.

### 4. Payload hygiene — nothing raw leaks

The dashboard aggregates are a narrow, enumerated projection; the raw sources never pass
through:

- **No jobs_log `detail` JSON** leaves the process (it embeds raw upstream error text). Job
  rows carry only: `lastAttemptAt`, `lastSuccessAt`, `lastOutcome` (enumerated
  `ok | error | running | unknown`), `runsLast24h`, `nextExpectedRun`, `neverRun`.
- **Job names** must match `^[a-z0-9][a-z0-9_-]{0,39}$` or they are counted in
  `omittedJobNames` and never echoed.
- No watchdog token, no ntfy topics, no credentials, no receipt hashes/last4, no correction
  audit rows, no push-subscription contents (the watch/push counts are `COUNT(*)` only —
  the push table stores endpoint keys the dashboard must never see).

### 5. Endpoints (all GET, all `no-store`, all behind the owner bearer)

**`GET /v1/owner/dashboard`** — the whole first screen in one payload:

```jsonc
{
  "generatedAt": "…",
  "jobs": [{ "name", "expected", "lastAttemptAt", "lastSuccessAt", "lastOutcome",
              "runsLast24h", "nextExpectedRun", "neverRun" }],
  "omittedJobNames": 0,
  "feeds": [{ "area": "conditions|fishability", "present", "healthy", "reason",
              "fileMtime", "ageMinutes", "extra" }],
  "snapshotFreshness": { "latestFileTimes": { "conditions": "…", "fishability": "…",
                          "streams": "…", "reportsRecent": "…", "contentPackStreams": "…" } },
  "counts": { "correctionsByStatus": {"received": 0, …}, "correctionsOpen": 0,
              "watchRules": 0,          // null = table absent (pre-021 DB)
              "pushSubscriptions": 0 }, // null = table absent
  "unresolvedEvidence": { "byState": {"documented": …}, "researchCount": 4, "waters": [ … ] }
}
```

- Feed verdicts come from the **existing** `src/snapshots/health.ts`
  (`conditionsFeedHealth` / `fishabilityFeedHealth`) — the same code that gates `/healthz` —
  plus file mtimes for build freshness.
- `nextExpectedRun` derives from a schedule table in `src/owner/schema.ts` that **mirrors
  `src/cron.ts`** (gauges hourly :05, pressure hourly :35, stocking daily 06:00, evidence
  daily 06:20, snapshots nightly 04:30; host-local like node-cron). It is a best-effort
  editorial estimate, not a contract. Expected jobs with NO `jobs_log` row at all are
  flagged `neverRun` (the F05 discipline: silence is a finding).
- `unresolvedEvidence` reads the content pack `streams.json` (counting a missing
  opportunity block as unresolved, per ADR 0010's own rule) and is **omitted entirely** when
  no content dir is wired — the endpoint never fails on a missing section.

**`GET /v1/owner/corrections?status=&limit=`** — queue **summary**. Reuses the corrections
SERVICE query (`listCorrectionsForReview`) so the SQL exists once; returns id, status,
category, waterId/waterName, proposedCorrection, riskFlags, timestamps. This is visibility,
not power: the owner token cannot decide anything, and the moderator token remains the only
review-surface credential.

**`GET /v1/owner/research-queue`** — the editorial research queue, data-driven from the
content pack: waters whose `opportunity.evidenceState` is `conflicting | unresolved |
historical`, with names/regions, the unresolved question, and which claim areas
(species / season / access / regulations) have **no authored evidence at all** on the
record. Those buckets are absence heuristics over the YAML-derived pack (no
`targetSpecies` → species; no `seasonMonths`+`seasonKind` → season; no regulations/access
labeled official source or note → regulations/access) — pointers for where to pull sources
first, never claims that evidence does not exist. Missing/unparseable pack → an honest
empty queue.

### 6. Data sources + tolerance

Every reader degrades its own section instead of failing the endpoint:

| source | reader | when absent |
|---|---|---|
| `jobs_log` | SQL aggregates (reuses `latestJobRuns` for latest-outcome) | empty jobs → all expected jobs `neverRun` |
| snapshot files | `conditionsFeedHealth` / `fishabilityFeedHealth` + `stat` mtimes | verdict `present:false`, mtime omitted |
| `corrections` | `listCorrectionsForReview` + GROUP BY status | zeros |
| `watch_rules` / `push_subscriptions` (migration 021) | table-name probe + `COUNT(*)` | **null** ("table not present"), never an error |
| content pack `streams.json` | tolerant structural read (no schema throw) | section omitted / empty queue |

## Consequences

- `apps/api/src/owner/{schema,service,routes}.ts` is a self-contained factory
  (`registerOwnerRoutes(app, deps)`); nothing outside it and the admin owner UI changed on
  the API/SPA structure except the single app.ts line (+ env.ts field) the coordinator owns.
- The admin SPA gains `src/features/owner/**` and an `owner` boot state reached by the
  `#/owner` deep link (a link is rendered under the shop login view). Shop login tests are
  untouched and stay green.
- The dashboard is only as honest as `jobs_log` and the snapshot files; the cron schedule
  table must be updated in lockstep with `src/cron.ts` (comment cross-references both ways).
- Future work (explicitly out of scope): per-action owner authorization + audit trail
  (§3), a snapshot-diff view for publication review, and wiring the corrections summary
  into a moderator handoff (the owner sees WHAT needs attention; the moderator decides).
