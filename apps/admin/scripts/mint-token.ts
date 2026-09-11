// OWNER: ROLE 4. Offline shop-token CLI (CHAT-4 deliverable 4). Tokens are HMAC-signed here —
// NOT on the server — so PORTAL_SECRET never has to live in the portal or API request path.
// Usage:  PORTAL_SECRET=<secret> pnpm --filter @trout/admin mint-token --shopId <id> [--days 30]
// Full lifecycle documentation: apps/admin/TOKENS.md
import { mintToken, signToken } from '../src/lib/tokenNode.js';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const secret = process.env.PORTAL_SECRET;
if (!secret) {
  console.error('mint-token: PORTAL_SECRET is not set. Export it for this command only, e.g.');
  console.error('  PORTAL_SECRET=$(openssl rand -hex 32) pnpm --filter @trout/admin mint-token --shopId little-river-outfitters');
  process.exit(1);
}

const shopId = arg('shopId');
if (!shopId || shopId.startsWith('--')) {
  console.error('mint-token: --shopId <shop id from packages/content/shops> is required');
  process.exit(1);
}

const daysArg = arg('days');
const days = daysArg ? Number(daysArg) : 30;
if (!Number.isFinite(days) || days <= 0 || days > 366) {
  console.error('mint-token: --days must be between 1 and 366');
  process.exit(1);
}

// Optional explicit window (for re-issuing with a stable iat): --iat <epoch-ms>
const iatArg = arg('iat');
const iat = iatArg ? Number(iatArg) : Date.now();
const token = Number.isFinite(iat)
  ? signToken(shopId, secret, iat, iat + Math.round(days * 24 * 60 * 60 * 1000))
  : mintToken(shopId, secret, days);

console.log(token);
console.error(`\nshop:     ${shopId}`);
console.error(`issued:   ${new Date(iat).toISOString()}`);
console.error(`expires:  ${new Date(iat + Math.round(days * 24 * 60 * 60 * 1000)).toISOString()}`);
console.error('Hand this token to the shop over a channel you trust. Anyone holding it can post attributed reports as this shop until it expires.');
