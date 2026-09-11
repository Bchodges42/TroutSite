import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Stateless shop portal tokens — wire format of record is apps/admin/TOKENS.md (Role 4),
 * adopted at integration (ADR 0003) in place of the earlier `t1.…` scheme:
 *
 *   token     = "v1." shopId "." iatMs "." expMs "." base64url(HMAC-SHA256(secret, payload))
 *   payload   = "v1." shopId "." iatMs "." expMs          (everything before the final ".")
 *
 * No token table, no session state (privacy: the server stores nothing about the
 * requester). Verification order mirrors TOKENS.md exactly: structural parse →
 * expiry → constant-time HMAC compare; the shop lookup stays with the caller.
 */

const TOKEN_PREFIX = 'v1';

export interface ParsedShopToken {
  shopId: string;
  issuedAtMs: number;
  expiresAtMs: number;
}

export function payloadFor(shopId: string, issuedAtMs: number, expiresAtMs: number): string {
  return `${TOKEN_PREFIX}.${shopId}.${issuedAtMs}.${expiresAtMs}`;
}

export function signShopToken(secret: string, shopId: string, issuedAtMs: number, expiresAtMs: number): string {
  const payload = payloadFor(shopId, issuedAtMs, expiresAtMs);
  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

/** Convenience mint: TTL in whole days (1–366), issued now. */
export function mintShopToken(secret: string, shopId: string, ttlDays: number, nowMs = Date.now()): string {
  const ttl = Math.round(Math.min(Math.max(ttlDays, 1), 366) * 24 * 60 * 60 * 1000);
  return signShopToken(secret, shopId, nowMs, nowMs + ttl);
}

export type TokenVerifyFailure = 'malformed' | 'expired' | 'bad-signature';

/**
 * Returns the shopId for a valid, unexpired token, or null for any
 * malformed/expired/forged token. `onFail` (optional) receives the failure reason
 * so callers can log a precise 401 without leaking which part failed to the client.
 */
export function verifyShopToken(
  secret: string,
  token: string,
  nowMs = Date.now(),
  onFail?: (reason: TokenVerifyFailure) => void,
): string | null {
  const parts = token.trim().split('.');
  if (parts.length !== 5) return fail(onFail, 'malformed');
  const [prefix, shopId, iat, exp, signature] = parts as [string, string, string, string, string];
  if (prefix !== TOKEN_PREFIX || !shopId || shopId.length > 80 || !/^\d+$/.test(iat) || !/^\d+$/.test(exp)) {
    return fail(onFail, 'malformed');
  }
  const issuedAtMs = Number(iat);
  const expiresAtMs = Number(exp);
  if (!Number.isFinite(issuedAtMs) || !Number.isFinite(expiresAtMs) || expiresAtMs <= issuedAtMs) {
    return fail(onFail, 'malformed');
  }
  if (nowMs >= expiresAtMs) return fail(onFail, 'expired');
  const expected = createHmac('sha256', secret).update(payloadFor(shopId, issuedAtMs, expiresAtMs)).digest();
  const actual = Buffer.from(signature.replaceAll('-', '+').replaceAll('_', '/'), 'base64');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return fail(onFail, 'bad-signature');
  }
  return shopId;
}

function fail(onFail: ((reason: TokenVerifyFailure) => void) | undefined, reason: TokenVerifyFailure): null {
  onFail?.(reason);
  return null;
}

/** Extract a Bearer token from an Authorization header value. */
export function bearerToken(header: string | undefined): string | null {
  if (!header) return null;
  const m = /^Bearer\s+(\S+)$/i.exec(header.trim());
  return m?.[1] ?? null;
}
