/**
 * robots.txt — ROLE 5. Generated so the Sitemap line always matches SITE_URL.
 */
import { SITE_URL } from '../site-config';

export function GET() {
  const base = SITE_URL.endsWith('/') ? SITE_URL.slice(0, -1) : SITE_URL;
  const body = `# ROLE 5 — no trackers to disallow; everything public is crawlable.
User-agent: *
Allow: /

# Future gated area (shop portal is a separate app, never crawled here)
Disallow: /api/

Sitemap: ${base}/sitemap.xml
`;
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
