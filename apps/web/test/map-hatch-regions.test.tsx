import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useRiverMapData } from '../src/features/map/useRiverMapData';
import { REGIONS } from '../src/data/regions';

/**
 * F40 — the map must request hatch charts for EVERY region in the registry.
 * The old hardcoded 11-region array missed tn-west, so West-TN waters
 * (beech-lake et al.) never received chart entries or hatch halos even though
 * the regional calendar data ships and /v1/hatch/tn-west/<month>.json serves
 * it. The requested set must be DERIVED from the same registry the hatch
 * calendar pages use — never a separately maintained array.
 */

const hatchRequests: string[] = [];

function requestedHatchRegions(): Set<string> {
  // /v1/hatch/<regionId>/<month>.json
  return new Set(
    hatchRequests.map((url) => url.split('/')[3] ?? ''),
  );
}

function catalogFixture() {
  return [
    {
      id: 'beech-lake',
      name: 'Beech Lake',
      stateId: 'TN',
      waterbodyType: 'lake',
      regionId: 'tn-west',
      gaugeIds: [],
      stockingProgram: true,
      idealFlow: [],
      officialSources: [],
    },
    {
      id: 'caney-fork-river',
      name: 'Caney Fork River',
      stateId: 'TN',
      waterbodyType: 'river',
      regionId: 'tn-middle-caney-fork',
      hydroIdentity: { gnisIds: ['00173456'], huc8s: ['05130108'] },
      gaugeIds: ['g-12345'],
      stockingProgram: true,
      idealFlow: [],
      officialSources: [],
    },
  ];
}

function stubFeeds() {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes('/v1/hatch/')) {
      hatchRequests.push(url);
      const parts = url.split('/');
      return new Response(
        JSON.stringify({ regionId: parts[3], month: Number(parseInt(parts[4]!, 10)), entries: [] }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }
    if (url.includes('/v1/streams')) {
      return new Response(JSON.stringify(catalogFixture()), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (url.includes('/v1/')) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ error: 'not found' }), { status: 404 });
  });
}

function renderDataHook() {
  const client = new QueryClient({
    defaultOptions: { queries: { networkMode: 'offlineFirst', retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return renderHook(() => useRiverMapData({ month: 9 }), { wrapper });
}

afterEach(() => {
  cleanup();
  hatchRequests.length = 0;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('map hatch chart requests (F40)', () => {
  it('requests exactly the registry regions — including tn-west', async () => {
    vi.stubGlobal('fetch', stubFeeds() as unknown as typeof fetch);
    const { result } = renderDataHook();

    await waitFor(() => {
      expect(result.current.hatchMap.size).toBeGreaterThan(0);
    });
    expect(requestedHatchRegions()).toEqual(new Set(REGIONS.map((r) => r.id)));
  });

  it('a west-TN water receives its regional chart entry and halo source', async () => {
    vi.stubGlobal('fetch', stubFeeds() as unknown as typeof fetch);
    const { result } = renderDataHook();

    const beech = await waitFor(() => {
      const feature = result.current.features.find((f) => f.stream.id === 'beech-lake');
      if (!feature?.hatchChart) throw new Error('beech-lake has no hatch chart yet');
      return feature;
    });
    expect(beech.hatchChart).toMatchObject({ regionId: 'tn-west', month: 9 });
    expect(result.current.hatchMap.get('tn-west')).toBeDefined();
  });
});
