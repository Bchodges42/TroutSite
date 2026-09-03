// OWNER: ROLE 4. Dev/test fixtures for the portal API mock. Every fixture is parsed with the
// FROZEN @trout/contracts schemas at module load — if the pack and the contract drift, this
// file throws instead of silently serving wrong data (CHAT-4: "MSW fixtures matching
// @trout/contracts exactly").
import { ShopSchema, ShopReportSchema, type Shop, type ShopReport } from '@trout/contracts';

export const FIXTURE_SHOP: Shop = ShopSchema.parse({
  id: 'little-river-outfitters',
  name: 'Little River Outfitters',
  stateId: 'TN',
  town: 'Townsend',
  websiteUrl: 'https://littleriveroutfitters.com',
  reportsEnabled: true,
});

export const FIXTURE_SHOP_REPORTS: ShopReport[] = [
  ShopReportSchema.parse({
    id: 'rep-lro-2026-08-17',
    shopId: FIXTURE_SHOP.id,
    shopName: FIXTURE_SHOP.name,
    streamId: 'little-river',
    date: '2026-08-17',
    body:
      'Sulphurs showed up around 8pm in the Townsend stretch. Size 16 parachutes got fish rising steadily for about an hour; the pools near the park held better fish on a tan beetle in the shade.',
    hotPatterns: [
      { patternId: 'sulphur-parachute', hookSize: 16 },
      { patternId: 'foam-beetle', hookSize: 14 },
    ],
    attributionUrl: FIXTURE_SHOP.websiteUrl,
    publishedAt: '2026-08-18T02:10:00Z',
  }),
  ShopReportSchema.parse({
    id: 'rep-lro-2026-08-24',
    shopId: FIXTURE_SHOP.id,
    shopName: FIXTURE_SHOP.name,
    date: '2026-08-24',
    body: 'Little River came up Friday night and is still off-color today. Better bet is West Prong — clear and low, fish on a size 18 tan caddis.',
    hotPatterns: [{ patternId: 'elk-hair-caddis-tan', hookSize: 18 }],
    attributionUrl: FIXTURE_SHOP.websiteUrl,
    publishedAt: '2026-08-24T20:45:00Z',
  }),
];

/** Reports published by OTHER shops (used to test that the portal filters to your own). */
export const FIXTURE_OTHER_SHOP_REPORT: ShopReport = ShopReportSchema.parse({
  id: 'rep-tellico-2026-08-20',
  shopId: 'tellico-outfitters',
  shopName: 'Tellico Outfitters',
  streamId: 'tellico-river',
  date: '2026-08-20',
  body: 'Delayed harvest season ahead — fish are spread through the trophy section, best early morning on hoppers.',
  hotPatterns: [{ patternId: 'daves-hopper', hookSize: 8 }],
  attributionUrl: 'https://tellicooutfitters.com',
  publishedAt: '2026-08-20T21:00:00Z',
});
