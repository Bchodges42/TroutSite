// OWNER: ROLE 4. MSW request handlers mocking the (Role 3) portal API for dev + tests.
// Shapes and status codes mirror the contract surface: GET /v1/portal/me (additive, Role 4),
// POST /v1/portal/reports (the only live write route), GET /v1/reports/recent.json (snapshot).
import { HttpResponse, http } from 'msw';
import { ShopReportSchema, type ShopReport } from '@trout/contracts';
import { PORTAL_ME, ShopReportInputSchema } from '../api/client.js';
import { FIXTURE_OTHER_SHOP_REPORT, FIXTURE_SHOP, FIXTURE_SHOP_REPORTS } from './fixtures.js';

let reportCounter = 0;

// F15/F02: the dev mock mirrors the real API's idempotency contract — the first
// acceptance of an Idempotency-Key returns 201; replaying the SAME key returns
// 200 { report, idempotentReplay: true } without creating a second report.
const acceptedKeys = new Map<string, ShopReport>();
/** Every Idempotency-Key observed on POST /v1/portal/reports, in order (test aid). */
export const recordedIdempotencyKeys: string[] = [];

export const handlers = [
  // Token → shop identity
  http.get(`*${PORTAL_ME}`, ({ request }) => {
    const auth = request.headers.get('Authorization') ?? '';
    const token = auth.replace(/^Bearer\s+/i, '');
    // Dev mock: the fixtures token encodes the fixture shop id. Anything else is unauthorized.
    if (!token.startsWith(`v1.${FIXTURE_SHOP.id}.`)) {
      return HttpResponse.json({ error: 'invalid token' }, { status: 401 });
    }
    return HttpResponse.json({ shop: FIXTURE_SHOP });
  }),

  // The only live write route (00-SHARED-CONTEXT §6)
  http.post('*/v1/portal/reports', async ({ request }) => {
    const auth = request.headers.get('Authorization') ?? '';
    const token = auth.replace(/^Bearer\s+/i, '');
    if (!token.startsWith(`v1.${FIXTURE_SHOP.id}.`)) {
      return HttpResponse.json({ error: 'invalid token' }, { status: 401 });
    }
    const idempotencyKey = request.headers.get('Idempotency-Key') ?? undefined;
    if (idempotencyKey) recordedIdempotencyKeys.push(idempotencyKey);
    const replay = idempotencyKey ? acceptedKeys.get(idempotencyKey) : undefined;
    if (replay) {
      // Real API contract: 200 replay of the stored report — NOT a second report.
      return HttpResponse.json({ report: replay, idempotentReplay: true }, { status: 200 });
    }
    const raw = await request.json();
    const parsed = ShopReportInputSchema.safeParse(raw);
    if (!parsed.success) {
      return HttpResponse.json({ error: 'invalid report', issues: parsed.error.issues }, { status: 422 });
    }
    reportCounter += 1;
    const report = ShopReportSchema.parse({
      id: `rep-mock-${reportCounter}`,
      shopId: FIXTURE_SHOP.id,
      shopName: FIXTURE_SHOP.name,
      ...parsed.data,
      // Server-side attribution: always the shop's own site, per §1.5 attribution culture.
      attributionUrl: FIXTURE_SHOP.websiteUrl,
      publishedAt: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
    });
    FIXTURE_SHOP_REPORTS.unshift(report);
    if (idempotencyKey) acceptedKeys.set(idempotencyKey, report);
    // Real API wire format (Role 3): the 201 body wraps the report.
    return HttpResponse.json({ report }, { status: 201 });
  }),

  // Public snapshot — the portal filters this to the signed-in shop
  http.get('*/v1/reports/recent.json', () =>
    HttpResponse.json([FIXTURE_OTHER_SHOP_REPORT, ...FIXTURE_SHOP_REPORTS]),
  ),
];
