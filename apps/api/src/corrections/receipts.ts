import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Receipt codes for user-suggested corrections (ADR 0015 §2).
 *
 * Format `XXXXX-XXXXX-XXXXX`: 15 chars of Crockford base32 (no I/L/O/U — a
 * code read aloud over the phone cannot be misheard into a lookalike), 75 bits
 * straight from a CSPRNG. The code is shown to the reporter EXACTLY ONCE; the
 * database stores only HMAC-SHA256(CORRECTIONS_RECEIPT_PEPPER, normalized) plus
 * the last 4 characters for support triage. A leaked database therefore cannot
 * look up, correlate, or forge any receipt.
 */

/** Crockford base32: digits + uppercase letters minus I, L, O, U. */
export const CROCKFORD_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/** The exact client-side shape check (apps/web CorrectionStatus.tsx). */
export const RECEIPT_CODE_RE = /^[0-9A-HJKMNP-TV-Z]{5}-[0-9A-HJKMNP-TV-Z]{5}-[0-9A-HJKMNP-TV-Z]{5}$/;

/** Bits of CSPRNG entropy per code (15 chars x 5 bits). */
export const RECEIPT_BITS = 75;

/**
 * Normalize typed input exactly like the client (`normalizeReceiptCode`):
 * trim, uppercase, whitespace runs → dash. Every hash is taken over the
 * normalized form so `abcde fghjk mnpqr` resolves the same receipt.
 */
export function normalizeReceiptCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, '-');
}

/**
 * Generate one receipt code: 75 CSPRNG bits from node:crypto, 5 bits per
 * character, dashed into three groups. 2^75 space — enumeration of any single
 * receipt is beyond offline reach, and each online guess is a rate-limited
 * request that can only answer "not found".
 */
export function generateReceiptCode(): string {
  // ceil(75/8) = 10 bytes = 80 bits ≥ 75; the trailing 5 bits are unused.
  const bytes = randomBytes(10);
  const chars: string[] = [];
  let acc = 0;
  let accBits = 0;
  for (const byte of bytes) {
    acc = (acc << 8) | byte;
    accBits += 8;
    while (accBits >= 5 && chars.length < 15) {
      accBits -= 5;
      chars.push(CROCKFORD_ALPHABET.charAt((acc >>> accBits) & 31));
    }
    if (chars.length >= 15) break;
  }
  return `${chars.slice(0, 5).join('')}-${chars.slice(5, 10).join('')}-${chars.slice(10, 15).join('')}`;
}

/**
 * The ONLY persisted form of a receipt: HMAC-SHA256(pepper, normalized code).
 * The pepper (CORRECTIONS_RECEIPT_PEPPER) is a distinct secret — never the
 * portal HMAC, never the watchdog or moderator token (ADR 0015 §5).
 */
export function receiptHash(pepper: string, normalizedCode: string): Buffer {
  return createHmac('sha256', pepper).update(normalizedCode, 'utf8').digest();
}

/** Last 4 characters of the code body — support triage only, never a lookup key. */
export function receiptLast4(normalizedCode: string): string {
  return normalizedCode.replace(/-/g, '').slice(-4);
}

/**
 * Constant-time equality for stored vs computed receipt hashes (and moderator
 * tokens). Mirrors the helper in app.ts; length differences still resolve in
 * constant time per byte pair, and the result additionally requires equal
 * lengths so a padded compare can never widen acceptance.
 */
export function constantTimeEqual(a: string | Buffer, b: string | Buffer): boolean {
  const ab = Buffer.isBuffer(a) ? a : Buffer.from(a, 'utf8');
  const bb = Buffer.isBuffer(b) ? b : Buffer.from(b, 'utf8');
  const length = Math.max(ab.length, bb.length);
  const pa = Buffer.alloc(length);
  const pb = Buffer.alloc(length);
  ab.copy(pa);
  bb.copy(pb);
  return timingSafeEqual(pa, pb) && ab.length === bb.length;
}
