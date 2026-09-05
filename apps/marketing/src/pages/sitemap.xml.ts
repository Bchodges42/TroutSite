/**
 * sitemap.xml — ROLE 5 (SEO non-negotiable #4). Hand-rolled (no integration dep)
 * so the page list is exactly what this template set generates.
 */
import { SITE_URL } from '../site-config';
import { LAUNCH_STATES, regionsForState } from '../data/states';
import { getStreams } from '../data/load';
import { POSTS } from '../data/posts';

export function GET() {
  const today = new Date().toISOString().slice(0, 10);
  const urls: { loc: string; priority: string }[] = [
    { loc: '/', priority: '1.0' },
    { loc: '/install/', priority: '0.9' },
    { loc: '/privacy/', priority: '0.5' },
    { loc: '/about/', priority: '0.5' },
    { loc: '/blog/', priority: '0.6' },
  ];
  for (const post of POSTS) urls.push({ loc: `/blog/${post.slug}/`, priority: '0.6' });

  for (const state of LAUNCH_STATES) {
    const st = state.id.toLowerCase();
    urls.push({ loc: `/stocking/${st}/`, priority: '0.9' });
    urls.push({ loc: `/when-does-${state.slug}-stock-trout/`, priority: '0.9' });
    urls.push({ loc: `/fishing/${state.slug}/`, priority: '0.8' });
    urls.push({ loc: `/regulations/${state.slug}/`, priority: '0.8' });
    for (const region of regionsForState(state.id)) {
      urls.push({ loc: `/hatch/${st}/${region.slug}/`, priority: '0.8' });
    }
    urls.push({ loc: `/streams/${st}/`, priority: '0.8' });
    for (const stream of getStreams(state.id)) {
      urls.push({ loc: `/streams/${st}/${stream.id}/`, priority: '0.8' });
    }
  }

  const base = SITE_URL.endsWith('/') ? SITE_URL.slice(0, -1) : SITE_URL;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${base}${u.loc}</loc><lastmod>${today}</lastmod><priority>${u.priority}</priority></url>`,
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  });
}
