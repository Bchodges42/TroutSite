import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useRiverMapData } from '../src/features/map/useRiverMapData';
import { db } from '../src/lib/db';
import type { Stream } from '@trout/contracts';

/**
 * Live-catalog resilience (2026-09-09 incident): the host's snapshot tree went
 * away (GET /v1/streams → 503) and every visitor without a Dexie cache saw the
 * hard "Catalog unavailable" error. The hook must degrade — live feed → last
 * Dexie snapshot (inside fetchSnapshot) → bundled content-pack catalog — and a
 * conditions outage alone must never take the catalog down.
 */

const PACK_STREAMS: Stream[] = [
  {
    id: 'pack-creek',
    name: 'Pack Creek',
    stateId: 'TN',
    waterbodyType: 'creek',
    regionId: 'tn-east-holston',
    gaugeIds: [],
    stockingProgram: false,
    idealFlow: [{ min: 10, max: 80, unit: 'cfs' }],
    species: 'trout',
    officialSources: [],
  },
  {
    id: 'pack-run',
    name: 'Pack Run',
    stateId: 'TN',
    waterbodyType: 'creek',
    regionId: 'tn-se-hiwassee',
    gaugeIds: [],
    stockingProgram: false,
    idealFlow: [],
    species: undefined,
    officialSources: [],
  },
] as unknown as Stream[];

const LIVE_STREAMS: Stream[] = [
  { ...PACK_STREAMS[0], id: 'live-creek', name: 'Live Creek' },
] as unknown as Stream[];

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

type MockMap = Record<string, { status: number; body?: unknown }>;

/** Route a stubbed global fetch by URL substring; unmatched URLs → 404. */
function stubFetch(map: MockMap) {
  const fn = vi.fn(async (url: string) => {
    for (const [needle, res] of Object.entries(map)) {
      if (url.includes(needle)) return jsonResponse(res.body ?? [], res.status);
    }
    return jsonResponse({ error: 'not found' }, 404);
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

function Harness({ onState }: { onState: (s: ReturnType<typeof useRiverMapData>) => void }) {
  onState(useRiverMapData());
  return null;
}

describe('useRiverMapData catalog fallback', () => {
  let queryClient: QueryClient;

  beforeEach(async () => {
    queryClient = new QueryClient();
    // Dexie persists across tests in this file (fake-indexeddb is global) — a
    // leftover snapshot would satisfy fetchSnapshot's cache fallback and mask
    // the pack path under test.
    await db.snapshots.clear();
    await db.logbook.clear();
  });

  afterEach(() => {
    cleanup();
    queryClient.clear();
    vi.unstubAllGlobals();
  });

  it('renders the bundled pack catalog when the live streams feed is down', async () => {
    stubFetch({
      '/v1/streams': { status: 503, body: { error: 'streams snapshot not generated yet' } },
      '/content-pack/streams.json': { status: 200, body: { streams: PACK_STREAMS } },
    });

    let state: ReturnType<typeof useRiverMapData> | undefined;
    render(
      createElement(QueryClientProvider, { client: queryClient },
        createElement(Harness, { onState: (s) => { state = s; } })),
    );

    // Queries retry once with TanStack's 1 s default retry delay, so the
    // settled state (error → pack fetch → resolve) lands after ~2 s.
    const settled = { timeout: 6000, interval: 50 } as const;
    await vi.waitFor(() => {
      expect(state?.isError).toBe(false);
      expect(state?.isLoading).toBe(false);
    }, settled);
    expect(state?.features.map((f) => f.stream.id)).toEqual(['pack-creek', 'pack-run']);
    expect(state?.streams).toHaveLength(2);
    // Honest provenance: fallback data is never "live" and carries no fetch time.
    expect(state?.live).toBe(false);
    expect(state?.fetchedAt).toBeNull();
  });

  it('a conditions outage alone is not a catalog error', async () => {
    stubFetch({
      '/v1/streams': { status: 200, body: LIVE_STREAMS },
      '/v1/conditions': { status: 404, body: { error: 'not found' } },
    });

    let state: ReturnType<typeof useRiverMapData> | undefined;
    render(
      createElement(QueryClientProvider, { client: queryClient },
        createElement(Harness, { onState: (s) => { state = s; } })),
    );

    const settled = { timeout: 6000, interval: 50 } as const;
    await vi.waitFor(() => {
      expect(state?.isLoading).toBe(false);
      expect(state?.features).toHaveLength(1);
    }, settled);
    expect(state?.isError).toBe(false);
    expect(state?.conditionsUnavailable).toBe(true);
    expect(state?.live).toBe(false);
  });

  it('feed AND pack both failing is still a hard catalog error', async () => {
    stubFetch({
      '/v1/streams': { status: 503, body: { error: 'streams snapshot not generated yet' } },
      '/content-pack/streams.json': { status: 404, body: { error: 'not found' } },
    });

    let state: ReturnType<typeof useRiverMapData> | undefined;
    render(
      createElement(QueryClientProvider, { client: queryClient },
        createElement(Harness, { onState: (s) => { state = s; } })),
    );

    await vi.waitFor(() => expect(state?.isError).toBe(true), { timeout: 6000, interval: 50 });
    expect(state?.features).toHaveLength(0);
  });

  it('healthy feeds keep the live path (fallback never fires)', async () => {
    const fetchFn = stubFetch({
      '/v1/streams': { status: 200, body: LIVE_STREAMS },
      '/v1/conditions': {
        status: 200,
        body: [
          {
            streamId: 'live-creek',
            fetchedAt: new Date().toISOString(),
            nextExpectedUpdate: new Date(Date.now() + 3_600_000).toISOString(),
            score: { value: 82, assessed: true, reasons: ['Within the ideal range.'] },
            readings: [
              { gaugeId: 'g1', timestamp: new Date().toISOString(), cfs: 42, tempC: 14 },
            ],
          },
        ],
      },
    });

    let state: ReturnType<typeof useRiverMapData> | undefined;
    render(
      createElement(QueryClientProvider, { client: queryClient },
        createElement(Harness, { onState: (s) => { state = s; } })),
    );

    const settled = { timeout: 6000, interval: 50 } as const;
    await vi.waitFor(() => {
      expect(state?.isLoading).toBe(false);
      expect(state?.live).toBe(true);
    }, settled);
    expect(state?.isError).toBe(false);
    expect(state?.features[0]?.score).toBe(82);
    expect(fetchFn.mock.calls.filter(([u]) => String(u).includes('/content-pack/'))).toHaveLength(0);
  });
});
