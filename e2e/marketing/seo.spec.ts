/**
 * marketing/seo.spec.ts — ROLE 5 (§4 deliverable: every generated page gets a
 * unique title/description, canonical URL, sitemap presence + content checks
 * that enforce non-negotiable #1: pages must answer their query with real data).
 */
import { expect, test } from '@playwright/test';

test.describe('sitemap & robots', () => {
  test('sitemap.xml lists all generated pages and every URL is live', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.status()).toBe(200);
    const xml = await res.text();

    const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
    expect(locs.length).toBeGreaterThanOrEqual(14);

    // Sitemap entries carry the PRODUCTION origin (SITE_URL); compare pathnames.
    const paths = locs.map((loc) => new URL(loc).pathname);

    // Key programmatic templates are present.
    for (const path of [
      '/stocking/tn/',
      '/streams/tn/',
      '/streams/tn/south-holston-river/',
      '/hatch/tn/east-holston-tailwaters/',
      '/hatch/tn/southeast-hiwassee/',
      '/hatch/tn/caney-fork/',
      '/when-does-tennessee-stock-trout/',
    ]) {
      expect(paths, `sitemap should list ${path}`).toContain(path);
    }

    // Every sitemap URL answers 200 on the test server (no dead entries).
    for (const path of paths) {
      const page = await request.get(path);
      expect(page.status(), `${path} should be 200`).toBe(200);
    }
  });

  test('robots.txt exists and points at the sitemap', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toMatch(/^Sitemap: .+\/sitemap\.xml$/m);
    expect(body).toContain('User-agent: *');
  });
});

test.describe('per-page SEO hygiene', () => {
  interface PageSeo {
    path: string;
    title: string;
    description: string;
    canonical: string;
  }

  async function collectSeo(request: import('@playwright/test').APIRequestContext, path: string) {
    const res = await request.get(path);
    expect(res.status(), `${path} should be 200`).toBe(200);
    const html = await res.text();
    const title = html.match(/<title>([^<]*)<\/title>/)?.[1];
    const description = html
      .match(/<meta name="description" content="([^"]*)"/)?.[1]
      .replace(/&amp;/g, '&');
    const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
    expect(title, `${path} has a title`).toBeTruthy();
    expect(description?.length, `${path} has a meta description`).toBeGreaterThan(30);
    expect(canonical, `${path} has a canonical`).toBeTruthy();
    return { path, title: title!, description: description!, canonical: canonical! };
  }

  test('every site page has unique title, unique description, self-canonical', async ({
    request,
  }) => {
    const sitemap = await (await request.get('/sitemap.xml')).text();
    const paths = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)]
      .map((m) => m[1])
      .map((loc) => new URL(loc).pathname);
    // The production origin the sitemap publishes (canonicals must use it too).
    const sitemapOrigin = new URL(sitemap.match(/<loc>(.*?)<\/loc>/)![1]).origin;

    const pages: PageSeo[] = [];
    for (const path of paths) pages.push(await collectSeo(request, path));

    const titles = new Set(pages.map((p) => p.title));
    expect(titles.size, 'titles must be unique').toBe(pages.length);
    const descriptions = new Set(pages.map((p) => p.description));
    expect(descriptions.size, 'descriptions must be unique').toBe(pages.length);

    for (const p of pages) {
      // Canonical carries the production origin; it must be this page's exact
      // path under the same origin the sitemap publishes.
      expect(new URL(p.canonical).pathname, `${p.path} canonical must be self`).toBe(p.path);
      expect(p.canonical, 'canonical must be absolute').toMatch(/^https:\/\//);
      expect(new URL(p.canonical).origin, 'canonical origin matches sitemap origin').toBe(
        sitemapOrigin,
      );
    }
  });

  test('zero third-party scripts or stylesheets on any page (no trackers)', async ({
    request,
    baseURL,
  }) => {
    const BASE = baseURL!;
    const sitemap = await (await request.get('/sitemap.xml')).text();
    const paths = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => new URL(m[1]).pathname);

    for (const path of paths) {
      const html = await (await request.get(path)).text();
      const remoteRefs = [
        ...[...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]),
        ...[...html.matchAll(/<link[^>]+href="([^"]+)"[^>]*>/g)]
          .filter((m) => /rel="(stylesheet|preconnect|preload|dns-prefetch)"/.test(m[0]))
          .map((m) => m[1]),
      ].filter((ref) => /^https?:\/\//i.test(ref) && !ref.startsWith(BASE));
      expect(remoteRefs, `${path} must load zero remote scripts/styles`).toEqual([]);
    }
  });

  test('all internal links resolve (no dead ends from templates)', async ({ request }) => {
    const sitemap = await (await request.get('/sitemap.xml')).text();
    const paths = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => new URL(m[1]).pathname);

    const internal = new Set<string>();
    for (const path of paths) {
      const html = await (await request.get(path)).text();
      for (const href of [...html.matchAll(/href="(\/[^"]*)"/g)].map((m) => m[1])) {
        if (!href.startsWith('/api/')) internal.add(href.split('#')[0]);
      }
    }
    for (const href of internal) {
      const res = await request.get(href);
      expect(res.status(), `internal link ${href} (linked from the site) should be 200`).toBe(200);
    }
  });
});

test.describe('JSON-LD structured data', () => {
  async function jsonLd(request: import('@playwright/test').APIRequestContext, path: string) {
    const html = await (await request.get(path)).text();
    return [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) =>
      JSON.parse(m[1]),
    );
  }

  test('stocking page publishes Dataset + FAQPage', async ({ request }) => {
    const types = (await jsonLd(request, '/stocking/tn/')).map((d) => d['@type']);
    expect(types).toContain('Dataset');
    expect(types).toContain('FAQPage');
  });

  test('when-does-tennessee-stock-trout publishes FAQPage', async ({ request }) => {
    const types = (await jsonLd(request, '/when-does-tennessee-stock-trout/')).map(
      (d) => d['@type'],
    );
    expect(types).toContain('FAQPage');
  });

  test('stream page publishes Dataset + BreadcrumbList', async ({ request }) => {
    const types = (await jsonLd(request, '/streams/tn/south-holston-river/')).map(
      (d) => d['@type'],
    );
    expect(types).toContain('Dataset');
    expect(types).toContain('BreadcrumbList');
  });
});

test.describe('programmatic pages answer their query with real data', () => {
  test('stocking page renders a real calendar + attributed events + official link', async ({
    request,
  }) => {
    const html = await (await request.get('/stocking/tn/')).text();
    expect(html).toContain('Season calendar');
    expect(html).toContain('Recent stocking events');
    expect((html.match(/official ↗/g) ?? []).length).toBeGreaterThanOrEqual(1);
    expect(html).toMatch(/https:\/\/www\.tn\.gov\/twra/);
    expect(html).toContain('Always verify with TWRA');
  });

  test('stream page renders score, ideal flow, hatch highlight, official sources', async ({
    request,
  }) => {
    const html = await (await request.get('/streams/tn/south-holston-river/')).text();
    expect(html).toMatch(/\/100/); // fishability score
    expect(html).toContain('Ideal flow');
    expect(html).toContain('cfs');
    expect(html).toContain('Stocking history');
    expect(html).toMatch(/waterdata\.usgs\.gov/); // "verify live" official link
    expect(html).toContain('Official sources');
  });

  test('ungauged stream page explains the absence instead of faking data', async ({ request }) => {
    const html = await (await request.get('/streams/tn/west-fork-stones-river/')).text();
    expect(html).toContain('No gauge is monitored for this water');
  });

  test('hatch page renders the full 12-month chart', async ({ request }) => {
    const html = await (await request.get('/hatch/tn/east-holston-tailwaters/')).text();
    const monthRows = (html.match(/scope="row">/g) ?? []).length;
    expect(monthRows, '12 month rows in the hatch table').toBe(12);
    expect(html).toContain('Patterns that cover this region');
  });

  test('when-does page answers with months, waters, species, and the official link', async ({
    request,
  }) => {
    const html = await (await request.get('/when-does-tennessee-stock-trout/')).text();
    expect(html).toContain('When does Tennessee stock trout?');
    expect(html).toContain('TWRA');
    expect(html).toMatch(/https:\/\/www\.tn\.gov\/twra/);
    expect(html).toContain('South Holston River'); // real stocked water, not filler
  });

  test('shop reports render with attribution on stream pages', async ({ request }) => {
    const html = await (await request.get('/streams/tn/south-holston-river/')).text();
    expect(html).toContain('Shop reports');
    expect(html).toMatch(/source ↗/);
    expect(html).toContain('Hot patterns');
  });
});
