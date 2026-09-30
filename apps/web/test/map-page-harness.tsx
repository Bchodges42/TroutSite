import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { RiverMapPage } from '../src/features/map/RiverMapPage';
import { SettingsProvider } from '../src/lib/settings';
import { ThemeProvider } from '../src/theme/ThemeProvider';
import { DEFAULT_SETTINGS } from '../src/lib/settings';
import { db } from '../src/lib/db';

/**
 * Component-level harness for RiverMapPage (F43/F44). The map canvas is
 * mocked at the module boundary: TennesseeMap records every props object it
 * receives on `globalThis.__tnMapRecords` so tests can observe the exact
 * featureColors / visibleIds the page computes, without a WebGL context.
 * The router location is mirrored to `globalThis.__mapPageSearch` so tests
 * can assert URL-param writes.
 */

export interface MapPageHarness {
  records: () => Array<Record<string, unknown>>;
  lastRecord: () => Record<string, unknown>;
  search: () => string;
}

declare global {
  // eslint-disable-next-line no-var
  var __tnMapRecords: Array<Record<string, unknown>> | undefined;
  // eslint-disable-next-line no-var
  var __mapPageSearch: string | undefined;
}

// Desktop layout: the species Segmented control renders above 900px only.
export function stubDesktopMediaQuery() {
  window.matchMedia = ((query: string) =>
    ({
      matches: /min-width:\s*901px/.test(query),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList) as never;
}

export function tnMapRecords(): Array<Record<string, unknown>> {
  return globalThis.__tnMapRecords ?? [];
}

function LocationProbe() {
  const location = useLocation();
  globalThis.__mapPageSearch = location.search;
  return null;
}

export async function seedSettings(patch: Partial<typeof DEFAULT_SETTINGS>) {
  await db.settings.put({ key: 'app', value: { ...DEFAULT_SETTINGS, ...patch } });
}

export interface FeedOptions {
  /** Stream catalog rows served from /v1/streams. */
  streams: Array<Record<string, unknown>>;
  /**
   * Map of `/v1/fishability/<id>.json` → deferred resolver. When a URL has a
   * deferred, the fetch stalls until the test resolves it with the JSON body;
   * otherwise the fixture map value is served immediately.
   */
  fishability?: Map<string, Array<Record<string, unknown>>>;
}

export function stubMapFeeds(options: FeedOptions) {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes('/v1/fishability/')) {
      const key = '/' + url.split('/').slice(3).join('/');
      const deferred = options.fishability?.get(key);
      if (deferred) {
        return new Promise((resolve) => {
          (options.fishability as Map<unknown, unknown>).set(key + ':resolve', resolve);
        }).then(
          (body) =>
            new Response(JSON.stringify(body), {
              status: 200,
              headers: { 'content-type': 'application/json' },
            }),
        );
      }
      const body = options.fishability?.get(key) ?? { error: 'absent' };
      return new Response(JSON.stringify(body), {
        status: options.fishability?.has(key) ? 200 : 404,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (url.includes('/v1/streams')) {
      return new Response(JSON.stringify(options.streams), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (url.includes('/atlas/places.json')) {
      return new Response(JSON.stringify({ places: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (url.includes('/atlas/topo/manifest.json') || url.includes('/atlas/roads-manifest.json')) {
      return new Response(JSON.stringify({ error: 'not found' }), { status: 404 });
    }
    if (url.includes('/v1/hatch/')) {
      const parts = url.split('/');
      return new Response(
        JSON.stringify({ regionId: parts[3], month: Number(parseInt(parts[4]!, 10)), entries: [] }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }
    if (url.includes('/v1/')) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ error: 'not found' }), { status: 404 });
  }) as unknown as typeof fetch;
}

export function resolveFishability(options: FeedOptions, key: string, body: Array<Record<string, unknown>>) {
  const resolve = (options.fishability as Map<string, unknown>).get(key + ':resolve') as
    | ((body: Array<Record<string, unknown>>) => void)
    | undefined;
  if (!resolve) throw new Error('no deferred fishability fetch for ' + key);
  resolve(body);
}

export function renderMapPage(route = '/'): void {
  const client = new QueryClient({
    defaultOptions: { queries: { networkMode: 'offlineFirst', retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <SettingsProvider>
          <MemoryRouter initialEntries={[route]}>
            <Routes>
              <Route
                path="*"
                element={
                  <>
                    <RiverMapPage />
                    <LocationProbe />
                  </>
                }
              />
            </Routes>
          </MemoryRouter>
        </SettingsProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

export function harness(children: ReactNode) {
  return children;
}
