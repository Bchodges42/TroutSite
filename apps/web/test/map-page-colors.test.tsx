import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, waitFor } from '@testing-library/react';
import { themes } from '../src/theme/themes';
import {
  deferredBody,
  renderMapPage,
  resolveFishability,
  seedSettings,
  stubDesktopMediaQuery,
  stubMapFeeds,
  tnMapRecords,
  type FeedOptions,
} from './map-page-harness';

/**
 * F44 — memoized map colors must invalidate on their REAL inputs. A
 * focus-species fishability response arriving after the initial warmwater
 * paint used to leave featureColors amber (the decision helper already
 * returned good/green) because the memo's dependency key omitted the
 * fishability payload and the focus species; custom map-palette changes
 * inside the same theme.id left the style swap untriggered. The harness
 * renders the REAL RiverMapPage and reads the exact featureColors the page
 * hands the map.
 */

vi.mock('../src/features/map/TennesseeMap', async () => {
  const { createElement } = await import('react');
  globalThis.__tnMapRecords = [];
  return {
    TN_BOUNDS: [
      [-90.6, 34.98],
      [-81.45, 36.75],
    ],
    TennesseeMap: (props: Record<string, unknown>) => {
      globalThis.__tnMapRecords!.push(props);
      return createElement('div', { 'data-testid': 'map-stub' });
    },
  };
});

const WATER = 'beech-lake';

function feedOptions(): FeedOptions {
  return {
    streams: [
      {
        id: WATER,
        name: 'Beech Lake',
        stateId: 'TN',
        waterbodyType: 'lake',
        regionId: 'tn-west',
        gaugeIds: [],
        stockingProgram: true,
        idealFlow: [],
        officialSources: [],
        species: 'warmwater',
        targetSpecies: ['largemouth-bass', 'bluegill'],
      },
    ],
    fishability: new Map([['/v1/fishability/' + WATER + '.json', deferredBody()]]),
  };
}

function fishability90() {
  return {
    streamId: WATER,
      fetchedAt: '2026-09-29T12:00:00Z',
      bySpecies: {
        'largemouth-bass': {
          comfort: {
            species: 'largemouth-bass',
            value: 90,
            reasons: ['Optimal range'],
            assessed: true,
            freshness: { observedAt: '2026-09-29T10:00:00Z', ageMinutes: 30 },
          },
          activity: { total: 0, components: [] },
        },
      },
  };
}

function colorFor(records: Array<Record<string, unknown>>, id: string): string | undefined {
  const last = records.at(-1) as { featureColors?: Map<string, string> } | undefined;
  return last?.featureColors?.get(id);
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  localStorage.removeItem('trout:theme-overrides');
});

describe('map colors invalidate on their real decision inputs (F44)', () => {
  it('a delayed fishability response recolors the water from amber to good', async () => {
    stubDesktopMediaQuery();
    await seedSettings({ speciesMode: 'all', speciesFocus: 'largemouth-bass' });
    const feeds = feedOptions();
    vi.stubGlobal('fetch', stubMapFeeds(feeds));
    renderMapPage('/');

    // Initial paint: the warmwater water wears the honest bronze — the
    // fishability fetch is still in flight.
    await waitFor(() => {
      expect(tnMapRecords().length).toBeGreaterThan(0);
      expect(colorFor(tnMapRecords(), WATER)).toBe(themes.daybreak.map.warmwater);
    });

    // The focus-species fishability-90 response arrives late.
    await resolveFishability(feeds, '/v1/fishability/' + WATER + '.json', fishability90());

    // The decision helper returns good/green — the map paint must follow.
    await waitFor(() => {
      expect(colorFor(tnMapRecords(), WATER)).toBe(themes.daybreak.map.good);
    });
  });

  it('switching the focus species repaints the water for the new assessment', async () => {
    stubDesktopMediaQuery();
    await seedSettings({ speciesMode: 'all', speciesFocus: 'largemouth-bass' });
    const feeds = feedOptions();
    vi.stubGlobal('fetch', stubMapFeeds(feeds));
    renderMapPage('/');

    await waitFor(() => {
      expect(colorFor(tnMapRecords(), WATER)).toBe(themes.daybreak.map.warmwater);
    });
    await resolveFishability(feeds, '/v1/fishability/' + WATER + '.json', fishability90());
    await waitFor(() => {
      expect(colorFor(tnMapRecords(), WATER)).toBe(themes.daybreak.map.good);
    });

    // A fair (45) bluegill file replaces the largemouth assessment: the
    // palette must follow the NEW focus species' comfort band.
    await resolveFishability(feeds, '/v1/fishability/' + WATER + '.json', {
      streamId: WATER,
      fetchedAt: '2026-09-29T12:00:00Z',
      bySpecies: {
        bluegill: {
          comfort: {
            species: 'bluegill',
            value: 45,
            reasons: ['Below optimal'],
            assessed: true,
            freshness: { observedAt: '2026-09-29T10:00:00Z', ageMinutes: 30 },
          },
          activity: { total: 0, components: [] },
        },
      },
    });
    // Focus is a setting; flip it the way the picker does.
    await seedSettings({ speciesMode: 'all', speciesFocus: 'bluegill' });
    await waitFor(
      () => {
        expect(colorFor(tnMapRecords(), WATER)).toBe(themes.daybreak.map.fair);
      },
      { timeout: 4000 },
    );
  });
});
