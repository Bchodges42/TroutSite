// Mint a shop portal token (Role 3 operator tool; the admin SPA asks its operator to run
// this):  pnpm --filter api token -- --shop=<shopId>
// The token is derived from PORTAL_SECRET (env or .env) — nothing is stored server-side.
import { parseArgs } from 'node:util';
import { loadEnv } from '../env.js';
import { signShopToken } from '../portal/tokens.js';

const { values } = parseArgs({
  options: { shop: { type: 'string' } },
  strict: true,
});

if (!values.shop) {
  console.error('[token] usage: pnpm --filter api token -- --shop=<shopId>');
  process.exit(2);
}

const env = loadEnv();
if (!env.PORTAL_SECRET) {
  console.error('[token] PORTAL_SECRET is not set — add it to .env first');
  process.exit(2);
}

console.log(signShopToken(env.PORTAL_SECRET, values.shop));
