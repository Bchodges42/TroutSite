# ADR 0018. Shop conditions embed widget (`/v1/widgets/conditions-embed.html`)

- **Status:** Accepted — 2026-09-30
- **Decider:** Widget lane ("broader improvement" plan); app.ts exception lands via the coordinator.

## Context

Shops want to show our water conditions on their own sites (a shop page that says
"click here for conditions" links out today). The product's honesty rules — real
assessments vs "No data", per-metric freshness, band vocabulary, agency
attribution — must hold on ANY surface that presents our data, including a
surface we do not control. Constraints that shape this:

- **Offline-first static serving** (ADR 0004/0005): snapshots are pre-built files
  refreshed by cron; there is no per-request query API to embed against.
- **Privacy posture** (site-wide): no visitor location, no ad/analytics scripts,
  no cross-site tracking — the widget cannot become the exception that breaks it.
- **`X-Frame-Options: DENY` on every response** (`apps/api/src/app.ts` onSend
  hook): today nothing we serve may be framed. Framing must be a deliberate,
  narrow exception, and app.ts is owned by another lane — the artifact must work
  the moment (and only if) that exception lands, and document the requirement.

## Decision

### One static artifact, one URL

`GET /v1/widgets/conditions-embed.html` — a single self-contained HTML document
(inline CSS, inline vanilla JS) emitted by the snapshot builder's hourly pass
exactly like every other served file: staged, promoted atomically, pruned when
retired, listed in the generation manifest (`SnapshotResult.widgetArtifacts`).

**There are no per-shop files in v1.** Per-shop selection rides the query at
runtime: the shop iframes

```
<iframe src="https://<site>/v1/widgets/conditions-embed.html?waters=watauga-river,south-holston-stone" ...></iframe>
```

- `?waters=id1,id2` — up to **4** water ids (trimmed, deduped, capped);
- `?theme=light|dark` — optional palette override; default follows
  `prefers-color-scheme`. Compact (≤ 420 px friendly).

The inline script fetches only same-origin public snapshots the site already
serves (`/v1/streams.json`, `/v1/conditions/latest.json`, optionally
`/v1/fishability/{id}.json` and `/v1/stocking/{state}-recent.json` — 404s are
honestly tolerated), rebuilds the model on every view, and renders through
`textContent` only. Because the artifact is fully static and contains zero
catalog data, a shop can never display (or inject) anything except what the
public snapshots themselves publish at view time.

### Presentation semantics = the product's

`apps/api/src/widgets/plan.ts` is the widget's single semantic authority:
band vocabulary identical to the product's `scoreBand` (good ≥ 70 / fair ≥ 40;
parity values pinned by test), `assessed: false` → **"No data", never zero**
(a REAL 0 renders Poor), per-metric age via each reading's OWN
`metricTimes[metric] ?? timestamp` (the `readingFreshness` discipline —
`READING_STALE_MINUTES` imported from `@trout/contracts`), stale rows shown
WITH their age, agency attribution ("Data: USGS/TVA — verify with the agency"),
and an **"Open in Trout"** link to `/conditions/{id}` (relative by default —
correct inside the iframe, whose document origin IS the site; `SITE_URL` may be
passed to the builder later to bake absolute links).

To make "same semantics" mechanical rather than aspirational, the plan functions
are written serialization-safe (bodies reference only parameters and locals) and
`embed.ts` embeds their compiled source into the artifact via
`Function.prototype.toString()`. The parity test evaluates the emitted artifact
bytes in Node and requires `deep-equal` model output with plan.ts on the same
inputs — the widget cannot drift from the product's presentation rules without
failing a test.

### The app.ts exception (REQUIRED — owned by the coordinator)

The artifact is inert until `app.ts` grants exactly one path permission to be
framed. In the `onSend` hook (`apps/api/src/app.ts`, the hook that currently
does `reply.header('X-Frame-Options', 'DENY')` for every response):

```ts
app.addHook('onSend', async (_req, reply, payload) => {
  reply.header('Strict-Transport-Security', 'max-age=63072000');
  reply.header('X-Content-Type-Options', 'nosniff');
  const path = (_req.raw.url ?? '').split('?')[0] ?? '';
  if (path === '/v1/widgets/conditions-embed.html') {
    // ADR 0018: the shop conditions widget is MEANT to be framed cross-origin.
    // XFO must be REMOVED (it cannot be overridden by CSP)…
    reply.removeHeader('X-Frame-Options');
    // …and framing is allowed through CSP instead (exact-path scope in v1).
    reply.header('Content-Security-Policy', 'frame-ancestors *');
  } else {
    reply.header('X-Frame-Options', 'DENY');
  }
  reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  reply.header('Permissions-Policy', 'geolocation=(self), camera=(), microphone=()');
  return payload;
});
```

Two details that are easy to get wrong:

1. **`removeHeader`, not overwrite.** `X-Frame-Options: DENY` plus
   `CSP: frame-ancestors *` together means the browser applies BOTH — the XFO
   wins and the widget still cannot be framed. The header must be absent on
   this one path.
2. **Exact path match** (`=== '/v1/widgets/conditions-embed.html'`), not a
   prefix: nothing else under `/v1/` gains frameability.

**Scope decision — wildcard `frame-ancestors *` in v1.** The widget publishes
only what is already public, carries no tracking surface, and an exact
shop-allowlist (`frame-ancestors https://shop1.example https://shop2.example;`
env-driven) changes per deployment and needs a deployment task. Wildcard now,
upgrade path documented: when the first paying/pilot shops exist, switch the
header to an allowlist sourced from env (the artifact and tests do not change;
the embed instructions shops hold do not change).

### Caching

The artifact inherits the platform's global static rule: every `/v1/*` response
is `Cache-Control: no-store` (the `noStore` setHeaders on the `/v1` static
mount). That is correct here too: the file is ~10 KB, shops' browsers refetch it
per view, and no-store guarantees a shop never frames a half-updated artifact
across a generation promotion. If shop traffic ever makes revalidation a real
cost, the upgrade is a content-hash filename + long cache for the ASSET with a
tiny always-fresh pointer page — a documented future decision, not a v1 need.

### No-tracking rules (binding for any change to the widget)

- No cookies, no localStorage/sessionStorage, no analytics, no beacons,
  no third-party requests of ANY kind — the only network calls are same-origin
  `fetch()`es of `/v1/*.json`.
- No visitor location (no geolocation API; `Permissions-Policy` on the page
  forbids it anyway inside a cross-origin frame).
- `<meta name="referrer" content="no-referrer">` in the artifact and
  `rel="noopener noreferrer"` + `target="_blank"` on the outbound link: shops'
  visitors are not tracked back to the site by the widget, and the site does not
  learn the shop's page URL from widget clicks.
- No payment code and no placement semantics: paid placement is NOT this lane's
  concern and MUST NOT alter the model — assessments come only from
  `plan.ts` over public snapshots. A paid pilot can change WHICH shops we give
  the embed URL to, never WHAT the widget says.
- Rendering is `textContent`-only (the tests assert no `innerHTML` /
  `document.write` / `insertAdjacentHTML` and no external `src`/`url()`): catalog
  text (water names come from the catalog and eventually from portals) can never
  inject markup into a shop's page context.

### What a pilot looks like

1. Owner picks 1–3 partner shops; each gets the iframe snippet + a note that the
   widget shows official gauge data with an "Open in Trout" link.
2. Watch: referrer-less inbound traffic from the widget link (no per-shop
   tracking exists — by design the pilot measures via the shops' own feedback and
   aggregate link clicks on the site, not via the widget).
3. Success → add the allowlist upgrade (env-driven `frame-ancestors`), wire
   `SITE_URL` into the builder pass for absolute links, and consider
   `?waters=` presets documented per shop. Failure → the artifact is pruned like
   any retired file and the app.ts exception is deleted; nothing else changes.

## Consequences

- Shops embed live, honest conditions with zero integration beyond an iframe;
  the artifact appears (and updates) with the regular hourly snapshot cadence,
  and disappears cleanly if the emitter is retired.
- One more managed file per generation (~10 KB) and one more builder seam
  (`emitWidgetArtifacts`); promotion/prune guarantees apply unchanged.
- The `app.ts` exception is load-bearing for this feature: until it lands,
  shops' browsers refuse to frame the URL (the artifact itself remains correct
  and directly viewable). It widens the framed surface by exactly one static
  file with no data of its own — the blast radius is the file's bytes.
- The serialization discipline in `plan.ts` is a constraint on future edits
  (no module-level references inside embedded function bodies) — enforced
  mechanically by the parity test, which evaluates the shipped bytes.
- `scoreBand` remains web-owned; the widget's copy (thresholds in
  `WIDGET_SEMANTICS`, pinned 70/40 by test) must be updated if the product ever
  changes its band boundaries — the ADR 0013/0007 band vocabulary governs both.

## Alternatives considered

- **Per-shop HTML files** (baking waters/site URLs at build time) — rejected:
  unbounded file growth keyed by shops we do not control, per-shop cache/prune
  complexity, and zero benefit over a query param.
- **A JS loader script shops paste into their page** (`<script src=…>`) —
  rejected: it executes in the SHOP's page context, dragging our code into
  third-party DOM/CSS and tempting analytics; an iframe isolates both directions.
- **A live API route rendering the fragment per request** — rejected: breaks the
  static-serving model (ADR 0004), adds a per-request render/cache path, and
  gives shops no more than the static artifact already gives.
- **Serve the widget from the web app origin with per-shop build steps** —
  rejected: it would couple the widget to web rebuilds; the snapshot pass is the
  one writer that refreshes served files hourly without a web deploy.
