// OWNER: ROLE 4. Token wire format (isomorphic — no node:crypto here, so the browser bundle
// stays clean). Signing/verification lives in src/lib/tokenNode.ts + scripts/mint-token.ts.
//
//   token  = "v1." + shopId + "." + iatMs + "." + expMs + "." + base64url(HMAC-SHA256(secret, payload))
//   payload = "v1." + shopId + "." + iatMs + "." + expMs
//
// Role 3's API verifies by recomputing the HMAC over the payload with PORTAL_SECRET —
// see apps/admin/TOKENS.md for the exact algorithm and lifecycle.

export const TOKEN_PREFIX = 'v1';

export interface ParsedToken {
  shopId: string;
  issuedAtMs: number;
  expiresAtMs: number;
  signature: string;
}

export function payloadFor(shopId: string, issuedAtMs: number, expiresAtMs: number): string {
  return `${TOKEN_PREFIX}.${shopId}.${issuedAtMs}.${expiresAtMs}`;
}

export function base64UrlDecode(input: string): string {
  const b64 = input.replaceAll('-', '+').replaceAll('_', '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  // atob is available in browsers and happy-dom; keep this module isomorphic.
  return atob(padded);
}

/** Structural parse only — does NOT verify the HMAC (that requires the server secret). */
export function parseToken(token: string): ParsedToken | null {
  const parts = token.trim().split('.');
  if (parts.length !== 5 || parts[0] !== TOKEN_PREFIX) return null;
  const [, shopId, iat, exp, signature] = parts as [string, string, string, string, string];
  if (!shopId || !/^\d+$/.test(iat) || !/^\d+$/.test(exp) || !signature) return null;
  const issuedAtMs = Number(iat);
  const expiresAtMs = Number(exp);
  if (!Number.isFinite(issuedAtMs) || !Number.isFinite(expiresAtMs) || expiresAtMs <= issuedAtMs) return null;
  return { shopId, issuedAtMs, expiresAtMs, signature };
}

export function tokenExpired(token: ParsedToken, nowMs = Date.now()): boolean {
  return nowMs >= token.expiresAtMs;
}
