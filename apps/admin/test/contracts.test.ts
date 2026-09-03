// OWNER: ROLE 4. MSW fixture contract tests — the dev mock must satisfy the FROZEN contracts
// exactly, and the token format must round-trip through sign/verify.
import { describe, expect, it } from 'vitest';
import { ShopSchema, ShopReportSchema } from '@trout/contracts';
import { FIXTURE_OTHER_SHOP_REPORT, FIXTURE_SHOP, FIXTURE_SHOP_REPORTS } from '../src/msw/fixtures.js';
import { mintToken, verifyToken } from '../src/lib/tokenNode.js';
import { parseToken, tokenExpired } from '../src/lib/tokenFormat.js';

describe('MSW fixtures match @trout/contracts', () => {
  it('parses the fixture shop with ShopSchema', () => {
    expect(ShopSchema.safeParse(FIXTURE_SHOP).success).toBe(true);
    expect(FIXTURE_SHOP.id).toBe('little-river-outfitters');
  });

  it('parses every fixture report with ShopReportSchema', () => {
    for (const report of [...FIXTURE_SHOP_REPORTS, FIXTURE_OTHER_SHOP_REPORT]) {
      const result = ShopReportSchema.safeParse(report);
      expect(result.success, JSON.stringify(result.error?.issues)).toBe(true);
    }
  });

  it('fixture reports carry proper attribution', () => {
    for (const report of FIXTURE_SHOP_REPORTS) {
      expect(report.attributionUrl).toMatch(/^https:\/\//);
      expect(report.shopId).toBe(FIXTURE_SHOP.id);
      expect(report.shopName).toBe(FIXTURE_SHOP.name);
    }
  });
});

describe('shop token format (v1.shopId.iat.exp.hmac)', () => {
  const secret = 'test-secret';
  const now = 1_750_000_000_000;

  it('mints and verifies a token', () => {
    const token = mintToken('little-river-outfitters', secret, 30, now);
    const result = verifyToken(token, secret, now + 1000);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.parsed.shopId).toBe('little-river-outfitters');
      expect(result.parsed.expiresAtMs).toBe(now + 30 * 24 * 60 * 60 * 1000);
    }
  });

  it('rejects a tampered shopId', () => {
    const token = mintToken('little-river-outfitters', secret, 30, now);
    const tampered = token.replace(`v1.little-river-outfitters.`, 'v1.tellico-outfitters.');
    expect(verifyToken(tampered, secret, now + 1000)).toMatchObject({ ok: false, reason: 'bad-signature' });
  });

  it('rejects an expired token and a wrong secret', () => {
    const token = mintToken('little-river-outfitters', secret, 1, now);
    expect(verifyToken(token, secret, now + 2 * 24 * 60 * 60 * 1000)).toMatchObject({ ok: false, reason: 'expired' });
    expect(verifyToken(token, 'other-secret', now + 1000)).toMatchObject({ ok: false, reason: 'bad-signature' });
  });

  it('parses structurally without the secret (client-side UX only)', () => {
    const token = mintToken('little-river-outfitters', secret, 30, now);
    const parsed = parseToken(token);
    expect(parsed?.shopId).toBe('little-river-outfitters');
    expect(tokenExpired(parsed as NonNullable<ReturnType<typeof parseToken>>, now + 1000)).toBe(false);
    expect(tokenExpired(parsed as NonNullable<ReturnType<typeof parseToken>>, now + 31 * 24 * 60 * 60 * 1000)).toBe(true);
    expect(parseToken('not-a-token')).toBeNull();
    expect(parseToken('v2.shop.1.2.sig')).toBeNull();
  });
});
