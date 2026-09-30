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
   * Map of `/v1/fishability/<id>.json` → fixture body, or a deferred()
   * record whose fetch stalls until the test resolves it with the body.
   */
  fishability?: Map<string, Array<Record<string, unknown>> | DeferredBody>;
}

export interface DeferredBody {
  readonly pending: Promise<Record<string, unknown>>;
  resolve: (body: Record<string, unknown>) => void;
}

/**
 * A re-resolvable deferred: every fetch either awaits delivery of the
 * current body or receives the most recently resolved one — so a test can
 * resolve a NEW assessment while a refetch is in flight (the F44 focus
 * switch does exactly that).
 */
export function deferredBody(): DeferredBody {
  const state: {
    body?: Record<string, unknown>;
    waiters: Array<(body: Record<string, unknown>) => void>;
  } = { waiters: [] };
  return {
    get pending() {
      if (state.body) return Promise.resolve(state.body);
      return new Promise<Record<string, unknown>>((r) => state.waiters.push(r));
    },
    resolve(body: Record<string, unknown>) {
      state.body = body;
      const waiters = state.waiters;
      state.waiters = [];
      for (const waiter of waiters) waiter(body);
    },
  };
}

const isDeferred = (entry: unknown): entry is DeferredBody =>
  typeof entry === 'object' && entry !== null && 'pending' in entry;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export function stubMapFeeds(options: FeedOptions) {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes('/v1/fishability/')) {
      // Key from the /v1/ boundary — the fetch URL may carry a fixtures prefix.
      const key = url.slice(url.indexOf('/v1/'));
      const entry = options.fishability?.get(key);
      if (isDeferred(entry)) return entry.pending.then((body) => jsonResponse(body));
      if (entry) return jsonResponse(entry);
      return jsonResponse({ error: 'absent' }, 404);
    }
    if (url.includes('/v1/streams')) {
      return jsonResponse(options.streams);
    }
    if (url.includes('/atlas/places.json')) {
      return jsonResponse({ places: [] });
    }
    if (url.includes('/atlas/topo/manifest.json') || url.includes('/atlas/roads-manifest.json')) {
      return jsonResponse({ error: 'not found' }, 404);
    }
    if (url.includes('/v1/hatch/')) {
      const parts = url.split('/');
      return jsonResponse({
        regionId: parts[3],
        month: Number(parseInt(parts[4]!, 10)),
        entries: [],
      });
    }
    if (url.includes('/v1/')) {
      return jsonResponse([]);
    }
    return jsonResponse({ error: 'not found' }, 404);
  }) as unknown as typeof fetch;
}

export async function resolveFishability(
  options: FeedOptions,
  key: string,
  body: Record<string, unknown>,
): Promise<void> {
  // The fishability query is enabled once settings load from Dexie, so the
  // deferred may not exist yet — wait for the fetch to actually start.
  const map = options.fishability as Map<string, unknown>;
  for (let i = 0; i < 200 && !isDeferred(map.get(key)); i++) {
    await new Promise((r) => setTimeout(r, 20));
  }
  const entry = map.get(key);
  if (!isDeferred(entry)) throw new Error('fishability fetch never started for ' + key);
  entry.resolve(body);
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
