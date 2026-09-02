import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Stateless shop portal tokens: `t1.<b64url(shopId)>.<b64url(HMAC-SHA256(secret, shopId))>`.
 * No token table, no session state (privacy: the server stores nothing about the
 * requester) — verification is a constant-time HMAC check against PORTAL_SECRET.
 */

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

export function signShopToken(secret: string, shopId: string): string {
  const sig = createHmac('sha256', secret).update(shopId).digest();
  return `t1.${b64url(shopId)}.${b64url(sig)}`;
}

/** Returns the shopId for a valid token, or null for any malformed/forged token. */
export function verifyShopToken(secret: string, token: string): string | null {
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 't1') return null;
  const [, idB64, sigB64] = parts as [string, string, string];
  let shopId: string;
  let given: Buffer;
  try {
    shopId = Buffer.from(idB64, 'base64url').toString('utf8');
    given = Buffer.from(sigB64, 'base64url');
  } catch {
    return null;
  }
  if (shopId.length === 0 || shopId.length > 80 || given.length === 0) return null;
  const expected = createHmac('sha256', secret).update(shopId).digest();
  if (given.length !== expected.length) return null;
  return timingSafeEqual(given, expected) ? shopId : null;
}

/** Extract a Bearer token from an Authorization header value. */
export function bearerToken(header: string | undefined): string | null {
  if (!header) return null;
  const m = /^Bearer\s+(\S+)$/i.exec(header.trim());
  return m?.[1] ?? null;
}
