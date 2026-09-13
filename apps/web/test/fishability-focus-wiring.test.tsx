import { describe, expect, it, vi, afterEach } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FishabilityCard } from '../src/components/FishabilityCard';
import { SettingsProvider } from '../src/lib/settings';
import { db } from '../src/lib/db';

/**
 * Focus-wiring hotfix: the FishabilityCard must render in all-fish mode
 * WITHOUT any ?focus= URL param (default: the first species the snapshot
 * carries), offer a picker when the water has several species, persist the
 * choice to settings.speciesFocus, and honor the ?focus= URL override.
 */

function snapshotFor(streamId: string) {
  return {
    streamId,
    fetchedAt: '2026-09-14T12:00:00Z',
    bySpecies: {
      'largemouth-bass': {
        comfort: {
          species: 'largemouth-bass',
          value: 84,
          reasons: ['Optimal range'],
          assessed: true,
          freshness: { observedAt: '2026-09-14T10:00:00Z', ageMinutes: 30 },
        },
        activity: { total: 0, components: [] },
      },
      bluegill: {
        comfort: {
          species: 'bluegill',
          value: 62,
          reasons: ['Just below optimal'],
          assessed: true,
          freshness: { observedAt: '2026-09-14T10:00:00Z', ageMinutes: 30 },
        },
        activity: { total: 0, components: [] },
      },
    },
  };
}

async function seedMode(mode: 'trout' | 'all', focus = '') {
  await db.settings.put({
    key: 'app',
    value: { tempUnit: 'F', speciesMode: mode, speciesFocus: focus, reduceMotion: false },
  });
}

function renderCard(streamId = 'w', route?: string) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const body = url.includes(streamId) ? snapshotFor(streamId) : [];
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }) as unknown as typeof fetch,
  );
  const client = new QueryClient({
    defaultOptions: { queries: { networkMode: 'offlineFirst', retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <SettingsProvider>
        <MemoryRouter initialEntries={[route ?? `/conditions/${streamId}`]}>
          <Routes>
            <Route path="conditions/:streamId" element={<FishabilityCard streamId={streamId} />} />
            <Route path="*" element={<FishabilityCard streamId={streamId} />} />
          </Routes>
        </MemoryRouter>
      </SettingsProvider>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('FishabilityCard focus wiring (hotfix)', () => {
  it('renders with NO URL param in all-fish mode, defaulting to the first species', async () => {
    await seedMode('all');
    renderCard('w');
    const heading = await screen.findByRole('heading', { name: 'Largemouth bass' });
    expect(heading).toBeInTheDocument();
    // The picker lists every species the snapshot carries.
    const picker = screen.getByTestId('fishability-species-picker');
    expect(picker).toContainElement(screen.getByRole('option', { name: 'Bluegill' }));
  });

  it('renders nothing in trout mode even with snapshot data', async () => {
    await seedMode('trout');
    renderCard('w');
    await vi.waitFor(() => {
      expect(screen.queryByRole('heading', { name: /bass/i })).toBeNull();
      expect(screen.queryByTestId('fishability-species-picker')).toBeNull();
    });
  });

  it('switching the picker swaps the species shown and persists the choice', async () => {
    await seedMode('all');
    const user = userEvent.setup();
    renderCard('w');
    const picker = await screen.findByTestId('fishability-species-picker');
    await user.selectOptions(picker, 'bluegill');
    const heading = await screen.findByRole('heading', { name: 'Bluegill' });
    expect(heading).toBeInTheDocument();
    await vi.waitFor(async () => {
      const row = await db.settings.get('app');
      expect(row?.value).toMatchObject({ speciesFocus: 'bluegill' });
    });
  });

  it('the ?focus= URL override wins over the persisted setting', async () => {
    await seedMode('all', 'bluegill');
    renderCard('w', '/conditions/w?focus=largemouth-bass');
    const heading = await screen.findByRole('heading', { name: 'Largemouth bass' });
    expect(heading).toBeInTheDocument();
  });

  it('a persisted focus for a species this water lacks falls back to a carried species', async () => {
    await seedMode('all', 'channel-catfish');
    renderCard('w');
    // 'channel-catfish' is not in the snapshot — the card falls back to the
    // first carried species instead of rendering nothing.
    expect(await screen.findByRole('heading', { name: 'Largemouth bass' })).toBeInTheDocument();
  });
});
