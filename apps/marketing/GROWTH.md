# GROWTH — scaffolding status & go-live plan (ROLE 5)

v1 ships the growth scaffolding **reserved but inert**: every network-touching
surface either makes zero calls or posts to a documented stub. Nothing here may
start sending data without going through §13 of 00-SHARED-CONTEXT.

## 1. Affiliate links — `partners.yaml` + `<AffiliateLink/>`

- **v1 status: inert.** Every registry entry has `enabled: false`; the component
  renders a plain-text fallback and no `<a>` is emitted.
- **Go-live (v2, §13.2):**
  1. Vet partners (fly shops via direct programs; big-box gear via AvantLink/REI
     Co-op partner/Trident frameworks per §13).
  2. Set `enabled: true` per partner after verifying tracking URLs by hand.
  3. The component already emits `rel="sponsored nofollow"` — keep it.
  4. Disclose on-page (FTC) — add a one-line "we may earn a commission" note to
     any page using `<AffiliateLink/>`.
  5. Only on **marketing content pages** (blog, guides) — never on data pages
     (stocking/streams/hatch stay commercial-free except reserved ad slots).

## 2. Ad slots — `<AdSlot/>`

- **v1 status: inert placeholder.** Reserves 90px layout height, prints a label,
  makes zero network calls, never shifts layout (CLS-safe by construction).
- **Go-live (v2, §13.2):** AdSense on marketing **content pages only** (blog,
  keyword pages' lower half) — never inside data tables. Keep slots out of the
  PWA entirely.

## 3. Newsletter — `<NewsletterForm/>` stub endpoint

- **v1 status: stub.** The form POSTs to `/api/newsletter` (documented path).
  Nothing serves that route in v1, so the client script handles the 404 with an
  explicit demo-mode message. No email is ever sent or stored.
- **Go-live (v2, §13.1):**
  1. Serve `POST /v1/portal/newsletter` from the Fastify app (laptop) behind the
     Cloudflare tunnel — same-origin path via tunnel routing, add an
     `/_routes.json`-style mapping only if we move to an edge function.
  2. Sending via **Resend free tier** (3k emails/mo) triggered by a weekly cron
     that composes the digest from the snapshot DB (stocking diff + conditions).
  3. Double opt-in (Resend audience + confirmation mail), unsubscribe header,
     and a public "what we store" note on the privacy page (email address only).
  4. `pnpm -r build` + privacy spec must stay green: the digest send is
     server-side; the client still only ever POSTs the address.

## 4. Alerts (post-v1 roadmap, §13.1)

Web-push (self-hosted VAPID) + weekly email digest gate a future **Pro
$24.99/yr** tier (Paddle payment links). Out of scope for v1; noted here so the
scaffolding decisions above don't preclude it.

## What would violate the plan (do not do)

- Any third-party script on v1 properties (analytics, ads, fonts, widgets).
- Sending an email in v1 or storing an address without the v2 opt-in flow.
- Sponsored links rendered from the registry while `enabled: false`.
