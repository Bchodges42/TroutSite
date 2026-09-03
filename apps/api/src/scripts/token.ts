// Mint a shop portal token (operator tool; format of record: apps/admin/TOKENS.md):
//   pnpm --filter api token -- --shop=<shopId> [--days=<1-366>]
// The token is signed with PORTAL_SECRET (env or apps/api/.env) — nothing is stored server-side.
// stdout = token only (script-safe); stderr = human-readable metadata.
import { parseArgs } from 'node:util';
import { loadEnv } from '../env.js';
import { mintShopToken } from '../portal/tokens.js';

const { values } = parseArgs({
  options: {
    shop: { type: 'string' },
    days: { type: 'string', default: '30' },
  },
  strict: true,
});

if (!values.shop) {
  console.error('[token] usage: pnpm --filter api token -- --shop=<shopId> [--days=<1-366>]');
  process.exit(2);
}

const days = Number(values.days);
if (!Number.isFinite(days) || days < 1 || days > 366) {
  console.error('[token] --days must be between 1 and 366');
  process.exit(2);
}

const env = loadEnv();
if (!env.PORTAL_SECRET) {
  console.error('[token] PORTAL_SECRET is not set — add it to apps/api/.env or the environment first');
  process.exit(2);
}

const issuedAt = Date.now();
const expiresAt = issuedAt + Math.round(days * 24 * 60 * 60 * 1000);
console.error(`[token] shop=${values.shop} ttl=${days}d issued=${new Date(issuedAt).toISOString()} expires=${new Date(expiresAt).toISOString()}`);
console.log(mintShopToken(env.PORTAL_SECRET, values.shop, days));
