# Shop portal tokens — format, minting, verification, lifecycle

OWNER: ROLE 4. This documents the shop-token scheme for the portal (`apps/admin`).
There are **no accounts, passwords, cookies, or sessions** — a shop's only credential
is a short HMAC-signed token, minted offline and delivered by hand.

## Why tokens, and why offline

The portal is the product's only dynamic write path (`POST /v1/portal/reports`), and it
must collect no end-user data (guiding principle §1.2, privacy by architecture). A
stateless HMAC token gives us that:

- **Nothing to store server-side.** Verification is pure recomputation — no sessions,
  no token table, no password hashes to leak.
- **The secret never touches the request path.** Tokens are signed in a terminal via the
  CLI; `PORTAL_SECRET` lives only in your shell (and in the API's env at verify time).
- **The shop's browser stores one localStorage key** (`trout.admin.token`). No cookies
  are set, nothing is sent to third parties, and no analytics run in the portal.

## Wire format

```
token   = "v1." shopId "." iatMs "." expMs "." signature
payload = "v1." shopId "." iatMs "." expMs          (everything before the final ".")
signature = base64url( HMAC-SHA256( PORTAL_SECRET, payload ) )
```

- `shopId` — a shop id from `packages/content/shops/{state}/{shop-id}.yaml`
  (e.g. `little-river-outfitters`). It travels in the clear inside the token; that is
  intentional: the API maps `shopId` → shop identity for attribution.
- `iatMs` / `expMs` — issue and expiry as Unix epoch **milliseconds**; `expMs > iatMs`.
- `signature` — base64url (RFC 4648 §5, `-/` alphabet, no padding) of the raw HMAC digest
  over the exact payload string. No JSON, no canonicalization, no header — the payload is
  signed byte-for-byte as transmitted.

Example token (secret `test-secret`, 30 days):

```
v1.little-river-outfitters.1790000000000.1792592000000.6Df3k0-9xQ1c...
```

## Minting (offline CLI)

```bash
# Generate a strong secret once and keep it in the API env + your password manager.
export PORTAL_SECRET=$(openssl rand -hex 32)

# Mint 30 days for one shop (id must exist in packages/content/shops):
pnpm --filter @trout/admin mint-token --shopId little-river-outfitters --days 30

# Re-issue with a stable issue time (keeps iat fixed, only extends exp):
pnpm --filter @trout/admin mint-token --shopId little-river-outfitters --days 30 --iat 1790000000000
```

Notes:

- `--days` is clamped to 1–366. Default is 30.
- The CLI prints the token on **stdout** and human-readable metadata on **stderr**, so
  `token=$(pnpm --filter @trout/admin mint-token --shopId X)` is safe in scripts.
- The implementation lives in `src/lib/tokenNode.ts` (`signToken` / `mintToken` /
  `verifyToken`) with the isomorphic wire-format parser in `src/lib/tokenFormat.ts`.
  Tests in `test/contracts.test.ts` mint + verify round-trip tokens.

## Verification (Role 3 implements server-side at `POST /v1/portal/reports`)

The frozen contract carries the token in the `Authorization: Bearer <token>` header.
Verification is stateless recomputation — mirror exactly this order:

1. **Structural parse** (`parseToken`): 5 dot-separated parts, prefix `v1`, non-empty
   `shopId`, numeric `iatMs`/`expMs`, `expMs > iatMs`. Fail → `401 malformed`.
2. **Expiry**: `nowMs >= expMs` → `401 expired`. (The portal also pre-checks expiry
   client-side for UX, but the server check is the real gate.)
3. **Signature**: recompute `HMAC-SHA256(PORTAL_SECRET, payload)` and compare with the
   token's signature using a **constant-time comparison** (`crypto.timingSafeEqual`);
   compare raw digests, not strings. Mismatch → `401 bad-signature`.
4. **Lookup**: load the shop by `shopId` from the content snapshot; if it is missing or
   `reportsEnabled: false`, reject (`403`). Attribute the report to that shop.

Reference implementation: `verifyToken()` in `src/lib/tokenNode.ts` — Role 3 can consume
it directly or mirror it in the API package (it is Node-only, no browser deps).

## TTL guidance

- **30 days is the default and the recommendation.** Long enough that shops aren't
  constantly re-onboarded, short enough that a leaked token's blast radius is bounded.
- Re-issue on the shop's cadence (e.g. with each weekly report acknowledgment) rather
  than minting year-long tokens. Max allowed by the CLI is 366 days — avoid it for
  interactive shops; it exists only for low-frequency reporting shops.
- Tokens are date-bounded, not count-bounded: they do not expire on use and carry no
  server-side state.

## Delivery channel

Hand the token to the shop over a **channel you already trust** — a phone call, or an
encrypted/email-verified direct message to the shop's known contact. Anyone holding a
valid token can post attributed reports as that shop until it expires, so treat the
token like a shared password:

- Never send it through public channels or paste it into the reports themselves.
- Never commit a minted token to git (fixtures in `src/msw/fixtures.ts` use a
  throwaway `test-secret` only).

## Revocation & rotation

Tokens are stateless, so there is no per-token kill switch. Revocation works by
**rotating `PORTAL_SECRET`**:

1. Generate a new secret, update the API's `PORTAL_SECRET`, restart the API.
2. Mint fresh tokens for all still-legitimate shops and re-deliver them.
3. Every token signed with the old secret now fails verification (`bad-signature`) —
   including the one you wanted gone.

Because TTLs are ~30 days, a rotation only costs shops one re-paste of a new token.
Rotate immediately if: a shop reports a leaked token, a shop relationship ends, or the
secret may have been exposed on the operator side.

## What tokens deliberately do NOT do

- **No identity beyond attribution.** A token proves "I am this shop" for posting
  reports; it grants no admin powers and exposes no other shops' data.
- **No tracking.** The portal sets no cookies, runs no analytics, and the token is used
  only in the `Authorization` header to `/v1/portal/me` and `/v1/portal/reports`.
- **No PII.** The token contains a shop id and two timestamps — nothing personal.
