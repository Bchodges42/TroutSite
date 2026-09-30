/* global console, process */
/**
 * SEO prerender (post-vite-build). Reads the frozen /v1 + /content snapshots
 * and emits per-route HTML shells into dist/ so crawlers and first-time
 * visitors get real <title>/meta description/canonical/JSON-LD plus visible
 * crawlable content, while the SPA keeps booting normally afterwards:
 *
 *   - dist/<route>/index.html for every SEO route (pretty URLs);
 *   - injected <title>, meta description, canonical, og:, JSON-LD in <head>;
 *   - a #prerender block of static HTML inside <div id="root"> (React's
 *     createRoot clears it on boot — no hydrateRoot, no mismatch warnings);
 *   - dist/sitemap.xml + dist/robots.txt for the web app origin.
 *
 * PWA: runs AFTER `vite build`, so these files are generated after workbox
 * wrote the precache manifest — they are intentionally NOT precached (the
 * offline path keeps using the precached shell via navigateFallback).
 *
 *   node scripts/prerender.mjs            # after vite build (real snapshots only)
 *   node scripts/prerender.mjs --allow-fixtures   # fixture flavor (e2e/preview)
 *   pnpm --filter @trout/web prerender
 *
 * Factual pages must never publish fixture data as real (T1-8): if the
 * public/v1 + public/content snapshots are absent, the script fails loudly
 * unless --allow-fixtures is passed — and even then the generated copy says
 * "sample data", never "reported releases", and carries each row's
 * datePrecision (scheduled week/month vs released day).
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { stripPrerenderedRoot } from './prerender-shell.mjs';

const webRoot = dirname(fileURLToPath(import.meta.url)); // apps/web/scripts
const appRoot = dirname(webRoot); // apps/web
const distDir = join(appRoot, 'dist');
const shellPath = join(distDir, 'index.html');

// Canonical origin for the web app (canonical URLs, sitemap, robots).
// SITE_URL mirrors apps/marketing/astro.config.mjs.
const ORIGIN = (process.env.SITE_URL ?? 'https://trout.tntechclimb.com').replace(/\/+$/, '');

if (!existsSync(shellPath)) {
  console.error('prerender: dist/index.html not found — run `vite build` first.');
  process.exit(1);
}

/* ---------------------------------------------------------------- helpers */

const escapeHtml = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// Safe JSON-LD: escape `<` so `</script>` inside data can't break out.
const jsonLd = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;

const truncate = (s, n) => (s.length <= n ? s : `${s.slice(0, n - 1).replace(/\s+\S*$/, '')}…`);

const slugOk = (s) => /^[a-z0-9][a-z0-9-]*$/.test(s);

const longMonth = new Intl.DateTimeFormat('en-US', { month: 'long' });
const monthName = (m) => longMonth.format(new Date(2000, m - 1, 1));

/** First existing candidate wins; production snapshots (public/v1) beat fixtures. */
const ALLOW_FIXTURES = process.argv.includes('--allow-fixtures');
const fixtureFeeds = new Set();

function readJson(candidates, fallback = null, label = '') {
  for (const rel of candidates) {
    const p = join(appRoot, rel);
    if (existsSync(p)) {
      try {
        if (rel.startsWith('fixtures/') && label) fixtureFeeds.add(label);
        return JSON.parse(readFileSync(p, 'utf8'));
      } catch (err) {
        console.warn(`prerender: could not parse ${rel}: ${err.message}`);
      }
    }
  }
  return fallback;
}

function readJsonArray(candidates, label) {
  const v = readJson(candidates, [], label);
  if (!Array.isArray(v)) {
    console.warn(`prerender: ${label} missing or malformed — skipping dependent pages.`);
    return [];
  }
  return v;
}

/* ------------------------------------------------------------------- data */

const streams = readJsonArray(
  ['public/v1/streams', 'public/v1/streams.json', 'fixtures/data/v1/streams'],
  'streams',
);
const conditions = readJsonArray(
  ['public/v1/conditions/latest.json', 'fixtures/data/v1/conditions/latest.json'],
  'conditions',
);
const stocking = readJsonArray(['public/v1/stocking/TN.json', 'fixtures/data/v1/stocking/TN.json'], 'stocking');
const taxa = readJsonArray(['public/content/taxa.json', 'fixtures/data/content/taxa.json'], 'taxa');
const patterns = readJsonArray(['public/content/patterns.json', 'fixtures/data/content/patterns.json'], 'patterns');
// The fishing-information document (statewide + per-water special regulations)
// — the per-water rules are real, keyword-relevant content for the regs pages.
const fishing = readJson(['public/content/fishing.json', 'fixtures/data/content/fishing.json'], null, 'fishing');

// Region metadata lives in TS (src/data/regions.ts). Node ≥ 23.6 strips types
// natively; older Node (the deploy host runs 20 LTS) falls back to a regex
// read of the same file — the table is regular enough to parse verbatim.
let REGIONS = [];
try {
  ({ REGIONS } = await import(pathToFileURL(join(appRoot, 'src', 'data', 'regions.ts')).href));
} catch {
  try {
    const text = readFileSync(join(appRoot, 'src', 'data', 'regions.ts'), 'utf8');
    REGIONS = [...text.matchAll(/id:\s*'([^']+)',\s*\n\s*name:\s*'([^']+)'/g)].map((m) => ({
      id: m[1],
      name: m[2],
    }));
    if (REGIONS.length === 0) throw new Error('no id/name pairs matched');
  } catch (err2) {
    console.warn(`prerender: could not load regions.ts (${err2.message}) — deriving names from ids.`);
  }
}
const regionName = (id) => REGIONS.find((r) => r.id === id)?.name ?? id;

// Hatch chart regions/months: whatever actually exists in the snapshots.
const hatchRoots = ['public/v1/hatch', 'fixtures/data/v1/hatch'].map((r) => join(appRoot, r));
const hatchRoot = hatchRoots.find(existsSync);
if (hatchRoot === hatchRoots[1]) fixtureFeeds.add('hatch charts');
const hatch = { regionIds: [], monthsByRegion: new Map() };
if (hatchRoot) {
  for (const dir of readdirSync(hatchRoot, { withFileTypes: true }).filter((d) => d.isDirectory())) {
    const months = readdirSync(join(hatchRoot, dir.name))
      .map((f) => /^(\d{1,2})\.json$/.exec(f)?.[1])
      .filter(Boolean)
      .map(Number)
      .sort((a, b) => a - b);
    if (months.length > 0) {
      hatch.regionIds.push(dir.name);
      hatch.monthsByRegion.set(dir.name, months);
    }
  }
}

const conditionsByStream = new Map(conditions.map((c) => [c.streamId, c]));
const stockingByStream = new Map();
for (const row of stocking) {
  if (!stockingByStream.has(row.streamName)) stockingByStream.set(row.streamName, []);
  stockingByStream.get(row.streamName).push(row);
}
const taxaById = new Map(taxa.map((t) => [t.id, t]));

// T1-8: fixture data may never silently stand in for real snapshots on factual
// pages. Without --allow-fixtures (the e2e/preview escape hatch), using any
// fixture feed is a hard error naming what is missing and where it should be.
if (fixtureFeeds.size > 0 && !ALLOW_FIXTURES) {
  console.error(
    `prerender: FAILED — real public/ snapshots are missing, refusing to publish fixture data as factual pages.\n` +
      `  Feeds that would fall back to fixtures: ${[...fixtureFeeds].sort().join(', ')}.\n` +
      `  Generate the snapshots first (pnpm --filter api seed && pnpm --filter api ingest && pnpm --filter api snapshots),\n` +
      `  or pass --allow-fixtures explicitly for fixture-flavor builds (e2e global-setup).`,
  );
  process.exit(1);
}
if (fixtureFeeds.size > 0) {
  console.warn(
    `prerender: WARN — --allow-fixtures in effect; the following pages use fixture data and say so: ${[...fixtureFeeds].sort().join(', ')}.`,
  );
}
const stockingFromFixtures = fixtureFeeds.has('stocking');

/**
 * Evidence-aware stocking wording (F08, 2026-09-29 audit). Every row in the
 * feed is a PUBLISHED SCHEDULE entry — StockingEvent carries no completed-
 * release status, so no row is ever worded as a TWRA release record: an
 * exact-day row whose date has passed is "past-scheduled", NOT "reported
 * released" (a date — past or future — is not a release report). Week/month
 * windows keep their published precision. Vocabulary mirrors StockingPage
 * `stockingEventState` and the marketing site's stockingStatusLabel — change
 * all three together.
 */
const monthYear = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const PRERENDER_TODAY = new Date().toISOString().slice(0, 10);
function stockingWhen(r) {
  const [y, m, d] = String(r.date ?? '').split('-').map(Number);
  const day = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const future = day >= PRERENDER_TODAY;
  if (r.datePrecision === 'month') {
    return `${future ? 'scheduled for' : 'past-scheduled for'} ${monthYear.format(new Date(Date.UTC(y, m - 1, 1)))}`;
  }
  if (r.datePrecision === 'week') {
    return `${future ? 'scheduled for the week of' : 'past-scheduled for the week of'} ${day}`;
  }
  return `${future ? 'scheduled for' : 'past-scheduled for'} ${day}`;
}

/* ------------------------------------------------------- shell injection */

// Normalize the shell so re-runs are idempotent: `prerender` overwrites
// dist/index.html (the home page), so on a second run the "shell" already
// contains injected tags. Strip anything this script injects before templating.
const INJECTED_TAGS_RE =
  /[ \t]*(?:<meta name="description"[^>]*>|<link rel="canonical"[^>]*>|<meta property="og:[^>]*>|<script type="application\/ld\+json">[\s\S]*?<\/script>)\n?/g;
const DEFAULT_TITLE = '<title>Trout — Match the Hatch &amp; Stream Conditions</title>';

const shell = readFileSync(shellPath, 'utf8');
const TITLE_RE = /<title>[\s\S]*?<\/title>/;
// F09: normalize the shell back to pristine before templating, so repeated
// runs are byte-stable — the home page overwrote dist/index.html on the
// previous run, carrying injected head tags (whose indentation grew every
// run), blank-line residue, and a filled #root into what this script treats
// as the shell. Consume the title's leading whitespace, collapse whitespace-
// only lines, and restore the empty root (see prerender-shell.mjs).
const pristineShell = stripPrerenderedRoot(
  shell
    .replace(INJECTED_TAGS_RE, '')
    .replace(/[ \t]*<title>[\s\S]*?<\/title>/, DEFAULT_TITLE)
    .replace(/\n[ \t]*(?=\n)/g, ''),
);

/**
 * Build one prerendered page from the built shell:
 *  - swaps <title>, injects meta description/canonical/og + JSON-LD into <head>;
 *  - puts static content HTML inside <div id="root"> (React clears it on boot).
 * `canonical` overrides the canonical URL path — used when one route is an
 * alias of another (/fishing-info → /regulations) so duplicates converge.
 */
function renderPage({ title, description, path, canonical, jsonLdObjs = [], contentHtml = '' }) {
  const _url = `${ORIGIN}${path}`;
  const canonicalUrl = `${ORIGIN}${canonical ?? path}`;
  const head = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`,
    ...jsonLdObjs.map(jsonLd),
  ].join('\n    ');

  let html = pristineShell.replace(TITLE_RE, `${head.replace(/^/, '    ')}\n  `);
  if (html === pristineShell && !TITLE_RE.test(pristineShell)) throw new Error('prerender: <title> not found in shell');
  html = html.replace('<div id="root"></div>', `<div id="root">${contentHtml}</div>`);
  return html;
}

/* ------------------------------------------------------------- page HTML */

const wrapContent = (inner) =>
  `<div id="prerender" data-prerender="true" style="max-width:42rem;margin:0 auto;padding:1.25rem;font-family:system-ui,sans-serif;line-height:1.5">${inner}</div>`;

const WATER_TYPE_LABEL = {
  tailrace: 'tailwater',
  freestone: 'freestone stream',
  spring_creek: 'spring creek',
  lake: 'stillwater',
};

function waterPage(stream) {
  const cond = conditionsByStream.get(stream.id);
  const stockingRows = (stockingByStream.get(stream.name) ?? []).slice(0, 5);
  const flow = stream.idealFlow?.[0];
  const typeLabel = WATER_TYPE_LABEL[stream.waterbodyType] ?? stream.waterbodyType ?? 'trout water';
  const species = typeof stream.species === 'string' ? stream.species : (stream.species ?? []).join(', ');

  const title = `${stream.name} fly fishing — flows, stocking & hatch chart`;
  const note = stream.notes ? truncate(String(stream.notes), 155) : `Trout fishing guide for ${stream.name} in Tennessee.`;
  const description = `${stream.name} (${regionName(stream.regionId)}): ${typeLabel}${species ? ` — ${species}` : ''}. ${note}`;

  const parts = [];
  parts.push(`<h1>${escapeHtml(stream.name)}</h1>`);
  const metaLine = [escapeHtml(regionName(stream.regionId)), escapeHtml(typeLabel), escapeHtml(species)]
    .filter(Boolean)
    .join(' · ');
  parts.push(`<p><strong>${metaLine}</strong>${flow ? ` · ideal flow ${escapeHtml(`${flow.min}–${flow.max} ${flow.unit}`)}` : ''}</p>`);
  if (stream.notes) parts.push(`<p>${escapeHtml(stream.notes)}</p>`);

  const latest = cond?.readings?.[0];
  if (latest) {
    const bits = [];
    if (latest.cfs != null) bits.push(`${latest.cfs} cfs`);
    if (latest.heightFt != null) bits.push(`${latest.heightFt} ft`);
    if (latest.tempC != null) bits.push(`${latest.tempC}°C`);
    if (latest.timestamp) bits.push(`as of ${escapeHtml(String(latest.timestamp).slice(0, 16).replace('T', ' '))}Z`);
    parts.push(`<h2>Current conditions</h2><p>Gauge ${escapeHtml(latest.gaugeId ?? '')}: ${escapeHtml(bits.join(', '))}.</p>`);
  }

  if (stockingRows.length > 0) {
    const items = stockingRows
      .map(
        (r) =>
          `<li>${escapeHtml(stockingWhen(r))} — ${escapeHtml(String(r.count ?? '?').replace(/\B(?=(\d{3})+(?!\d))/g, ','))} ${escapeHtml(r.species ?? 'trout')} (${escapeHtml(r.county ?? '')} County)</li>`,
      )
      .join('');
    parts.push(`<h2>Recent stocking</h2><ul>${items}</ul>`);
  }
  parts.push(
    `<p><em>Open the Trout app for live gauge readings, the full hatch chart for this water, and turn-by-turn access notes — works offline once installed.</em></p>`,
  );

  const ld = [
    {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': `${ORIGIN}/conditions/${stream.id}`,
          name: title,
          description,
        },
        {
          '@type': 'BodyOfWater',
          name: stream.name,
          ...(stream.regionId ? { containedInPlace: { '@type': 'AdministrativeArea', name: regionName(stream.regionId) } } : {}),
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Conditions', item: `${ORIGIN}/conditions` },
            { '@type': 'ListItem', position: 2, name: stream.name },
          ],
        },
      ],
    },
  ];
  return { title, description, path: `/conditions/${stream.id}`, jsonLdObjs: ld, contentHtml: wrapContent(parts.join('\n')) };
}

function chartPage(regionId, month) {
  let chart = null;
  for (const root of hatchRoots) {
    const p = join(root, regionId, `${month}.json`);
    if (existsSync(p)) {
      chart = JSON.parse(readFileSync(p, 'utf8'));
      break;
    }
  }
  const top = (chart?.entries ?? [])
    .slice()
    .sort((a, b) => b.abundance - a.abundance)
    .slice(0, 5);
  const rName = regionName(regionId);
  const title = `${rName} hatch chart — ${monthName(month)}`;
  const topNames = top.map((e) => taxaById.get(e.taxonId)?.commonName ?? e.taxonId);
  const description = `What hatches in ${monthName(month)} on ${rName}: ${topNames.join(', ')} — with matching fly patterns and stages.`;
  const items = top
    .map((e) => {
      const t = taxaById.get(e.taxonId);
      return `<li><strong>${escapeHtml(t?.commonName ?? e.taxonId)}</strong>${t?.sciName ? ` (<em>${escapeHtml(t.sciName)}</em>)` : ''} — ${escapeHtml(e.stage)}${e.timeOfDay ? `, ${escapeHtml(e.timeOfDay)}` : ''}</li>`;
    })
    .join('');
  const content = wrapContent(
    `<h1>${escapeHtml(title)}</h1><p>Hatch activity and matching patterns for ${escapeHtml(rName)} in ${escapeHtml(monthName(month))}.</p><h2>Top hatches</h2><ul>${items}</ul><p><em>The Trout app tracks these hatches against live gauge conditions on your water.</em></p>`,
  );
  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: title,
      description,
      itemListElement: top.map((e, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: `${taxaById.get(e.taxonId)?.commonName ?? e.taxonId} (${e.stage})`,
      })),
    },
  ];
  return { title, description, path: `/charts/${regionId}/${month}`, jsonLdObjs: ld, contentHtml: content };
}

function taxonPage(t) {
  const title = `${t.commonName} (${t.sciName}) — mayfly, caddis & midge hatch guide`.replace(' ()', '');
  const sizes = t.sizeRange ? `hook sizes ${t.sizeRange[0]}–${t.sizeRange.at(-1)}` : '';
  const description = truncate(
    `${t.commonName}${t.sciName ? ` (${t.sciName})` : ''}${t.order ? `, ${t.order}` : ''}${t.family ? ` · ${t.family}` : ''}. ${sizes}. Hatch timing and the fly patterns that imitate it on Tennessee trout water.`,
    158,
  );
  const attrs = t.keyAttributes
    ? Object.entries(t.keyAttributes)
        .map(([k, v]) => `${escapeHtml(k)}: ${escapeHtml(v)}`)
        .join(' · ')
    : '';
  const matched = patterns.filter((p) => (p.imitates ?? []).includes(t.id)).map((p) => p.name);
  const content = wrapContent(
    `<h1>${escapeHtml(t.commonName)}</h1>${t.sciName ? `<p><em>${escapeHtml(t.sciName)}</em></p>` : ''}<p>${escapeHtml([t.order, t.family, sizes].filter(Boolean).join(' · '))}</p>${attrs ? `<p>${attrs}</p>` : ''}${matched.length ? `<h2>Patterns that imitate it</h2><ul>${matched.map((m) => `<li>${escapeHtml(m)}</li>`).join('')}</ul>` : ''}`,
  );
  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'Taxon',
      name: t.commonName,
      ...(t.sciName ? { alternateName: t.sciName } : {}),
      description,
    },
  ];
  return { title, description, path: `/taxa/${t.id}`, jsonLdObjs: ld, contentHtml: content };
}

function patternPage(p) {
  const title = `${p.name} fly pattern — tying & when to fish it`;
  const hooks = p.hookSizes ? `hook sizes ${p.hookSizes.join(', ')}` : '';
  const description = truncate(
    `${p.name}: a ${p.type ?? 'trout'} fly pattern${hooks ? ` in ${hooks}` : ''}. What it imitates, how to tie it, and when to fish it on Tennessee tailwaters and freestones.`,
    158,
  );
  const imitates = (p.imitates ?? []).map((id) => taxaById.get(id)?.commonName ?? id);
  const content = wrapContent(
    `<h1>${escapeHtml(p.name)}</h1><p>Type: ${escapeHtml(p.type ?? 'fly')}${hooks ? ` · ${escapeHtml(hooks)}` : ''}</p>${imitates.length ? `<p>Imitates: ${escapeHtml(imitates.join(', '))}</p>` : ''}${Array.isArray(p.materials) && p.materials.length ? `<h2>Materials</h2><ul>${p.materials.map((m) => `<li>${escapeHtml(typeof m === 'string' ? m : JSON.stringify(m))}</li>`).join('')}</ul>` : ''}`,
  );
  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description,
      about: { '@type': 'Thing', name: p.name },
    },
  ];
  return { title, description, path: `/patterns/${p.id}`, jsonLdObjs: ld, contentHtml: content };
}

function simplePage({ path, canonical, title, description, h1, intro, sections = [] }) {
  const content = wrapContent(
    `<h1>${escapeHtml(h1)}</h1>${intro ? `<p>${intro}</p>` : ''}${sections
      .map(([h, html]) => `<h2>${escapeHtml(h)}</h2>${html}`)
      .join('')}`,
  );
  return { title, description, path, canonical, jsonLdObjs: [], contentHtml: content };
}

/** Per-water special-regulation entries from the fishing-information document. */
function regsContent() {
  const section = (fishing?.sections ?? []).find((s) => s.id === 'special-regulations');
  if (!section) return null;
  const items = section.items
    .filter((i) => (i.appliesTo?.length ?? 0) > 0)
    .sort((a, b) => a.title.localeCompare(b.title));
  if (items.length === 0) return null;
  const list = items
    .map(
      (i) =>
        `<li><strong>${escapeHtml(i.title)}</strong> — ${escapeHtml(i.text)} <em>(per ${escapeHtml(i.authority)}, effective ${escapeHtml(i.effectiveFrom ?? 'the current regulation year')})</em></li>`,
    )
    .join('');
  return `<ul>${list}</ul><p><em>Rules are summarized from the ${escapeHtml(section.items[0]?.authority ?? 'TWRA')} pages in force; the app links every official source and the agency page always wins.</em></p>`;
}

/* ------------------------------------------------------------------ build */

const pages = [];

// Home: shell already has a good title; add description + canonical only.
pages.push({
  title: 'Trout — Match the Hatch & Stream Conditions',
  description:
    'Offline-first trout fishing app for Tennessee: live stream conditions, TWRA stocking schedules, hatch charts and fly patterns. No trackers.',
  path: '/',
  jsonLdObjs: [],
  contentHtml: '',
});

for (const s of streams) {
  if (!slugOk(s.id)) {
    console.warn(`prerender: skipping stream with unexpected id: ${s.id}`);
    continue;
  }
  pages.push(waterPage(s));
}

pages.push(
  simplePage({
    path: '/conditions',
    title: 'Tennessee trout stream conditions — gauges & flows',
    description:
      'Live USGS gauge conditions for Tennessee trout streams: flows, stage and water temperature for tailwaters, freestones and Smokies streams.',
    h1: 'Tennessee trout stream conditions',
    intro: 'Gauge readings for the waters Trout tracks, from the South Holston tailrace to Smokies freestones.',
    sections: [
      [
        'Waters covered',
        `<ul>${streams.slice(0, 50).map((s) => `<li>${escapeHtml(s.name)}</li>`).join('')}</ul>${streams.length > 50 ? `<p>…and ${streams.length - 50} more in the app.</p>` : ''}`,
      ],
    ],
  }),
);

if (stocking.length > 0) {
  const sorted = stocking.slice().sort((a, b) => (a.date < b.date ? 1 : -1));
  const reported = sorted.filter((r) => r.datePrecision === 'day').length;
  const scheduled = sorted.length - reported;
  const rows = sorted
    .slice(0, 10)
    .map(
      (r) =>
        `<li>${escapeHtml(stockingWhen(r))} — ${escapeHtml(r.streamName)} (${escapeHtml(r.county ?? '')} County): ${escapeHtml(String(r.count ?? '?').replace(/\B(?=(\d{3})+(?!\d))/g, ','))} ${escapeHtml(r.species ?? 'trout')}</li>`,
    )
    .join('');
  const counts = [
    `${reported} reported release${reported === 1 ? '' : 's'}`,
    `${scheduled} scheduled event${scheduled === 1 ? '' : 's'}`,
  ].join(' and ');
  pages.push(
    simplePage({
      path: '/stocking',
      title: 'Tennessee trout stocking schedule — TWRA releases & scheduled events',
      description: stockingFromFixtures
        ? `Sample TWRA-style trout stocking data (${sorted.length} sample entries) used for preview builds — not live agency releases.`
        : `Recent TWRA trout stocking across Tennessee waters: ${counts} with dates, counties, species and counts.`,
      h1: 'Tennessee trout stocking schedule',
      intro: stockingFromFixtures
        ? `Preview build from bundled sample data (${sorted.length} sample stocking entries) — this is NOT live TWRA data. The production page lists real releases and scheduled events, newest first.`
        : `The ${counts} Trout tracks across Tennessee waters, newest first. Day-dated rows are reported releases; week/month rows are TWRA-scheduled events.`,
      sections: [['Recent activity', `<ul>${rows}</ul>`]],
    }),
  );
} else {
  // Honest unavailability instead of a silently missing page (T1-8).
  pages.push(
    simplePage({
      path: '/stocking',
      title: 'Tennessee trout stocking schedule — data currently unavailable',
      description:
        'TWRA stocking data is temporarily unavailable. The Trout app resumes its published stocking schedule as soon as the feed returns.',
      h1: 'Tennessee trout stocking schedule',
      intro: 'Stocking data is currently unavailable — this page updates automatically when the TWRA feed returns. The app shows nothing rather than guess.',
    }),
  );
}

// Regulations: /regulations is the canonical entry (matching the redesigned
// in-app page); /fishing-info is the long-standing alias and converges on it.
{
  const regs = regsContent();
  const regsSections = regs ? [['Special regulations by water', regs]] : [];
  const regsDescription =
    'Tennessee fishing regulations in one place: statewide trout rules, per-water special regulations (delayed harvest, quality zones, gear restrictions) and license requirements — every answer citing the TWRA page in force.';
  pages.push(
    simplePage({
      path: '/regulations',
      title: 'Tennessee fishing regulations & trout rules by water',
      description: regsDescription,
      h1: 'Fishing regulations & licenses',
      intro:
        'The rules that matter before you go — statewide limits, water-specific special regulations, and licenses — each with the agency that sets it and the official page it was verified against.',
      sections: regsSections,
    }),
  );
  pages.push(
    simplePage({
      path: '/fishing-info',
      canonical: '/regulations',
      title: 'Tennessee fishing regulations & trout rules by water',
      description: regsDescription,
      h1: 'Fishing regulations & licenses',
      intro:
        'The rules that matter before you go — statewide limits, water-specific special regulations, and licenses — each with the agency that sets it and the official page it was verified against.',
      sections: regsSections,
    }),
  );
}

pages.push(
  simplePage({
    path: '/hatch-key',
    title: 'Match the hatch — mayfly, caddis & midge identification key',
    description:
      'Identify what is hatching on your trout stream: key attributes for mayflies, caddisflies, midges and stoneflies, matched to the fly patterns that imitate them.',
    h1: 'Match the hatch',
    intro: 'A working key to the insects Tennessee trout eat, with the patterns that imitate each one.',
    sections: [
      ['Taxa covered', `<ul>${taxa.map((t) => `<li>${escapeHtml(t.commonName)}${t.sciName ? ` (<em>${escapeHtml(t.sciName)}</em>)` : ''}</li>`).join('')}</ul>`],
    ],
  }),
);

for (const t of taxa) {
  if (!slugOk(t.id)) {
    console.warn(`prerender: skipping taxon with unexpected id: ${t.id}`);
    continue;
  }
  pages.push(taxonPage(t));
}
for (const p of patterns) {
  if (!slugOk(p.id)) {
    console.warn(`prerender: skipping pattern with unexpected id: ${p.id}`);
    continue;
  }
  pages.push(patternPage(p));
}
for (const regionId of hatch.regionIds) {
  for (const month of hatch.monthsByRegion.get(regionId) ?? []) {
    pages.push(chartPage(regionId, month));
  }
}

/* ------------------------------------------------------------------ emit */

const written = [];
function emit(page) {
  const html = renderPage(page);
  // Home overwrites the shell in place; everything else is dist/<route>/index.html.
  const file = page.path === '/' ? shellPath : join(distDir, page.path.replace(/^\//, ''), 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
  written.push(page.path);
}

for (const page of pages) emit(page);

// sitemap.xml + robots.txt (web app origin).
const today = new Date().toISOString().slice(0, 10);
const NOINDEX = ['/logbook', '/settings'];
const sitemapUrls = written
  .map((p) => `  <url><loc>${escapeHtml(`${ORIGIN}${p}`)}</loc><lastmod>${today}</lastmod></url>`)
  .join('\n');
writeFileSync(
  join(distDir, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls}\n</urlset>\n`,
);
writeFileSync(
  join(distDir, 'robots.txt'),
  `# Generated by apps/web/scripts/prerender.mjs — the app is fully public.
User-agent: *
Allow: /
${NOINDEX.map((p) => `Disallow: ${p}`).join('\n')}

Sitemap: ${ORIGIN}/sitemap.xml
`,
);

console.log(
  `prerender: wrote ${written.length} route pages + sitemap.xml + robots.txt to dist (${streams.length} waters, ${hatch.regionIds.length} regions × charts, ${taxa.length} taxa, ${patterns.length} patterns).`,
);
