// OWNER: ROLE 4. Token signing/verification (Node-only — uses node:crypto). Used by the
// mint-token CLI and by tests so the CLI and any future server verifier share one implementation.
import { createHmac, timingSafeEqual } from 'node:crypto';
import { payloadFor, type ParsedToken } from './tokenFormat.js';

export function base64UrlEncode(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64url');
}

export function signToken(shopId: string, secret: string, issuedAtMs: number, expiresAtMs: number): string {
  const payload = payloadFor(shopId, issuedAtMs, expiresAtMs);
  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function mintToken(shopId: string, secret: string, ttlDays: number, nowMs = Date.now()): string {
  const issuedAtMs = nowMs;
  const expiresAtMs = nowMs + Math.round(ttlDays * 24 * 60 * 60 * 1000);
  return signToken(shopId, secret, issuedAtMs, expiresAtMs);
}

/**
 * Recompute the HMAC for a token — Role 3 mirrors this server-side for portal auth
 * (exact algorithm documented in apps/admin/TOKENS.md).
 */
export function verifyToken(token: string, secret: string, nowMs = Date.now()):
  | { ok: true; parsed: ParsedToken }
  | { ok: false; reason: 'malformed' | 'expired' | 'bad-signature' } {
  const parts = token.trim().split('.');
  if (parts.length !== 5) return { ok: false, reason: 'malformed' };
  const [prefix, shopId, iat, exp, signature] = parts as [string, string, string, string, string];
  if (prefix !== 'v1' || !shopId || !/^\d+$/.test(iat) || !/^\d+$/.test(exp)) return { ok: false, reason: 'malformed' };
  const issuedAtMs = Number(iat);
  const expiresAtMs = Number(exp);
  if (!Number.isFinite(issuedAtMs) || !Number.isFinite(expiresAtMs) || expiresAtMs <= issuedAtMs) {
    return { ok: false, reason: 'malformed' };
  }
  if (nowMs >= expiresAtMs) return { ok: false, reason: 'expired' };
  const expected = createHmac('sha256', secret).update(payloadFor(shopId, issuedAtMs, expiresAtMs)).digest();
  const actual = Buffer.from(signature.replaceAll('-', '+').replaceAll('_', '/'), 'base64');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return { ok: false, reason: 'bad-signature' };
  }
  return { ok: true, parsed: { shopId, issuedAtMs, expiresAtMs, signature } };
}
