# 0016. Angler watchlist alerts: pseudonymous push subscriptions, the one server-side exception

- **Status:** accepted (built by the ALERTS lane; nothing deploys until VAPID keys exist in production)
- **Date:** 2026-09-30
- **Decider:** ALERTS lane

## Context

The product is local-first by construction: preferences, logbook, saved waters, and trips never
leave the browser. But a condition watch has an irreducible server component — a notice must be
composed and delivered while the angler is **not** visiting the site, from data (gauge readings,
stocking feeds) that only the server refreshes. This ADR admits exactly **one** deliberate
server-side exception and fences it:

- pseudonymous by construction (no account, no email, no cookies; the credential is a random id);
- **narrow rules only** — a water id, a threshold, and timing parameters. Never logs, never
  location, and logbook data is never collected (the API has no field for it anywhere);
- fail-closed when unconfigured: without VAPID keys the server **refuses to collect** push
  endpoint tokens it could never honor (mirroring the corrections lane's 503 posture, ADR 0015);
- evaluation reads the **same static snapshot files the web reads** (`v1/conditions/latest.json`,
  `v1/stocking/TN-recent.json`, `v1/reports/recent.json`) — it never hits upstream providers, so
  the alert path cannot multiply upstream traffic or behave differently from the site.

Threat model: an anonymous write surface (the third, after portal reports and corrections), so
abuse controls are the corrections hardening — strict same-origin, JSON-only bodies, per-IP
sliding windows in front of body parsing, tight body caps, zod re-validation.

## Decision

### 1. Storage (migration `021_watchlists.sql`)

**`push_subscriptions`** — one row per browser grant:

| column | note |
|---|---|
| `subscription_id` | **random** 128-bit CSPRNG, base64url (22 chars). Never derived from the endpoint, device, or anything else. Knowing the id IS the credential. |
| `endpoint` / `endpoint_hash` | the push-service URL (needed to deliver) + its SHA-256, which is the UNIQUE upsert key — no query path correlates by raw endpoint |
| `p256dh`, `auth` | WebPush client keys, replaced on re-subscribe |
| `user_agent` | the one diagnostic string the client volunteered; stored, never logged |
| `created_at`, `last_seen_at` | retention clock (below) |

**`watch_rules`** — `subscription_id` FK, `water_id` (resolved against the catalog at insert),
`kind ∈ {condition, stocking, report}`, and for condition rules `metric ∈ {tempC, cfs}`,
`threshold_op ∈ {above, below}`, `threshold`, plus `hysteresis` (dead band, both directions),
`cooldown_minutes` (default 240), `quiet_hours_start/end` (water-local HH:MM, nullable, paired),
`arm_state` (the hysteresis memory: last decisive side, NULL until armed), `created_at`,
`last_notified_at`. Hard cap: 50 rules per subscription (bounded storage per pseudonymous id).

There is **no notices table**. Delivery evidence lives in an in-memory ring (StubNotifier, capped
at 100) or nowhere; the only durable trace of a send is the rule's own `last_notified_at`.

### 2. Routes (`src/push/routes.ts`; registered unconditionally in `app.ts`)

| route | behavior |
|---|---|
| `GET /v1/watches/config` | **always 200, honest**: `{ pushSupported, publicKey, maxRulesPerSubscription }`. Never fails closed — the web needs the truth to pick its fallback. |
| `POST /v1/watches/subscribe` | **503 without VAPID** (fail-closed: refuse push material we cannot honor). With VAPID: zod-validated `{endpoint, keys, userAgent?}`, 4 KiB cap, upsert by `endpoint_hash` → `201 {subscriptionId}`. Re-subscribing keeps the id **and its rules** (a service-worker re-grant never wipes a watchlist). |
| `POST /v1/watches/rules` | `201 {rule}`; 422 per-field errors; unknown subscription 404; unknown water 422 (catalog check); per-subscription cap 422. Works regardless of notifier health. |
| `GET /v1/watches/rules?subscriptionId=` | that subscription's rules only, `no-store`. |
| `DELETE /v1/watches/rules/:id?subscriptionId=` | 204; **possession of the subscription id is required with the (enumerable, sequential) rule id** — a wrong/unknown pair is the same 404. |
| `DELETE /v1/watches/subscriptions/:id` | unsubscribe + **explicit cascade** (rules then subscription; SQLite FK enforcement is off in this process, so the cascade is transactional application code). |

Hardening (mirrors ADR 0015 §5): strict same-origin (`Origin`/`Referer` against `SITE_URL`;
present-but-foreign = 403; no Origin + no Referer = server-to-server, allowed), JSON-only content
type (415), route body caps (4 KiB, under the global 128 KiB), and `SlidingWindowRateLimiter`
**imported from the corrections lane** (`src/corrections/routes.ts` — it is exported; the JSON
content-type check is module-private there and is duplicated as a 6-line guard, noted). Windows:
subscribe 10/h + 30/d, rule writes 60/h, reads 120/h. Request IPs live only inside the limiter's
bounded map and are never persisted or logged.

**Pseudonymous-access tradeoff (deliberate):** GET/DELETE keyed by `subscriptionId` with no
further auth means whoever reads the id from a browser's localStorage controls that watchlist.
This is the same trust level as the receipt code in ADR 0015, accepted because the exposed data
is exactly "which waters are watched with which thresholds" — no identity can be derived from it,
and the id is 128 bits of CSPRNG, not enumerable.

### 3. VAPID + notifier (`src/push/notifier.ts`)

Env: `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` (all optional; subject falls back
to a `mailto:` built from `SITE_URL`). Config exists only when **both** keys are present, and
`vapidConfigFromEnv` is the single source used by both `app.ts` and `cron.ts`, so the API and the
cron can never disagree about whether push is on.

`Notifier` is the seam: `StubNotifier` (records into the capped in-memory ring, `canPush:false`)
is the default; `WebPushNotifier` (sets VAPID details, JSON payloads, TTL 1 h) is used when keys
exist. `web-push` is loaded via **dynamic import with a variable specifier**, so the dependency
is optional at runtime AND at typecheck time; any load failure degrades to stub + warn — a push
problem never crashes the cron. (`web-push@^3.6.7` added to `apps/api/package.json` dependencies.)

Send statuses: `sent` / `failed` / `gone`. A `gone` (HTTP 404/410 — the browser dropped the
subscription) deletes the subscription **with its rules immediately**, rather than letting the
retention clock wind down on a dead watchlist.

### 4. Evaluation (`src/push/evaluate.ts` — pure; `src/push/job.ts` — orchestration)

The engine takes `(rules, EvidenceView, {now})` and returns a **decisions array**
`{ruleId, subscriptionId, waterId, kind, fired, reason, armState?, feedDate?}` — every
transition is testable and traceable. Checks, in order:

1. **Evidence gate.** Condition rules need a reading for their metric from the conditions
   snapshot, using the **per-metric observation time** (`metricTimes`, F01) — another metric's
   timestamp cannot renew a stopped sensor. No reading → `no-evidence`; older than the contracts
   freshness horizon (180 min) → `stale-evidence`. **Source outages never fire condition notices;
   outage notices are NOT in v1** — a data gap must not invent a fishing signal.
2. **Quiet hours** — the **water's** local time. Every v1 water is Tennessee, so the zone is
   `America/Chicago` statewide (a per-water zone list would be fabrication, not precision).
   Windows may wrap midnight; `start === end` reads as all-day quiet.
3. **Cooldown** — `last_notified_at + cooldown_minutes` blocks repeats.
4. **Meaningful transition.** Condition rules: the reading must land decisively OUTSIDE
   `threshold ± hysteresis` on the side OPPOSITE to `arm_state` (full dead-band crossing both
   ways). A first decisive reading **arms without firing** (no baseline → no deploy-time storm);
   inside the band → `waiting-dead-band`; same side → `no-change`. Feed rules: the newest
   stocking row / shop report must be newer than `last_notified_at ?? created_at`.

Stocking matching is deliberately conservative: normalized exact name match against the catalog's
`name` + `aliases` (the same normalization shape as the web's matcher, minus containment tiers) —
the evaluator would rather stay silent than attribute a stocking to the wrong reach.
`readEvidenceFromSnapshots` (the one impure corner) reads the snapshot files defensively; a
missing/unreadable file yields "no evidence" and silence.

**Digest bundling** (pure `bundleNotices`): more than 3 fired rules for one subscription in a
single run collapse into ONE `{kind:'watch-digest'}` payload — one buzz, not six.

Persistence happens **after** delivery attempts: `fired` → `last_notified_at` + `arm_state`;
`armed` → `arm_state` only. A failed send still consumed the transition (retrying would
double-notify worse than one lost notice).

### 5. Cron (`src/cron.ts`, `*/15 * * * *`)

`watchlists` is an explicit scheduled job with its own single-flight flag (decoupled from the
pipeline's `JobName` union) and writes a `jobs_log` row **every run** via `startJob` inside
`runWatchlistsJob` (same discipline as the pipeline runners — direct tests can assert the row).
Each run also prunes subscriptions whose `last_seen_at` is older than **180 days** — an inactive
watchlist forgets itself. Its errored runs surface in `/healthz` `degraded` automatically
(jobs_log scan); it is deliberately NOT added to `EXPECTED_JOBS` (not this lane's file), so a
never-run watchlists job does not degrade a deployment that never configured it.

### 6. Web (`apps/web/src/features/watches/`)

- **`WatchButton`** on `StreamDetailPage` (below the overview card): bell toggle. ON creates the
  **fixed default rule** — "water temp drops below 21 °C", 1 °C hysteresis, 240 min cooldown —
  stated in the button's own copy so the one-tap flow hides no behavior. Flow: `GET config` →
  `Notification.requestPermission` → `pushManager.subscribe` under the active service worker →
  `POST subscribe` → `POST rules`. The subscription id is stored in localStorage — the browser's
  ONLY secret. Permission-denied saves nothing and says so; transport failure says "nothing was
  saved".
- **Honest fallback:** when `config.pushSupported` is false or the browser lacks Web Push, the
  tap stores a device-only rule in **localStorage** (never Dexie — `db.ts` is another lane's
  file) labeled "Reminder saved on this device — it only works while the site is open."
- **`WatchesSettings`** in `SettingsPage`: server rules (fetched by the stored subscriptionId)
  with per-rule Remove and an **Unsubscribe from all watches** cascade button; device-only rules
  under their own honest label; the privacy line everywhere:
  *"Watches are pseudonymous — no name, no location, no logbook data is ever collected."*
- The web hardcodes the four `/v1/watches/*` paths (like the corrections client); `@trout/contracts`
  is untouched.

## Consequences

- The read path stays pure local-first; the server gains exactly one stateful exception, whose
  every column is defensible per the privacy floor above. A DB leak yields water ids and
  thresholds — nothing that identifies anyone.
- Ops must set the three `VAPID_*` env vars (and keep them stable — rotating keys strands
  subscriptions) before the feature exists in production; until then every deployment honestly
  reports `pushSupported:false` and the web runs device-only.
- `web-push` joins the dependency tree (installed by the coordinator; dynamically imported).
- The 15-min evaluation adds a light, file-only cron cadence — no upstream calls, one jobs_log
  row per run.
- Retention is automatic (180-day inactivity prune + immediate 410 prune); there is no export,
  no moderation surface, and nothing worth GDPR-requesting.

## Alternatives considered

- **FCM/APNs-specific integrations or a third-party push service** — a second vendor dependency
  and an account; Web Push (VAPID) is the standard, browser-native path.
- **Email/SMS alerts** — require identity by definition; the opposite of the posture.
- **Storing notices in a table for history/retry** — another retention surface for zero user
  value; `last_notified_at` + the stub ring cover cooldown and tests.
- **Dexie for the fallback list** — the natural home, but `db.ts` is owned by another lane and
  mixing device-only reminders into the offline cache muddies what "syncs" (nothing does).
- **Per-water timezones** — all v1 waters are in Tennessee; a zone column today would be
  fabricated precision. Revisit only if another state ships (contract-additive then).
- **Porting the full tiered stocking matcher** — over-fires across similarly-named reaches;
  conservative exact+alias matching is the honest default for a push.
