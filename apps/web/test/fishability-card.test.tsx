import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FishabilityCard } from '../src/components/FishabilityCard';
import { SettingsProvider } from '../src/lib/settings';
import { db } from '../src/lib/db';

/**
 * F6 TASK 2/3 — the FishabilityCard: comfort-only presentation (the activity
 * breakdown is Stage 4), honest No data, and strict mode scoping (renders
 * nothing outside all-fish + focus).
 */

const SNAPSHOT = {
  streamId: 'w',
  fetchedAt: '2026-09-14T12:00:00Z',
  bySpecies: {
    'largemouth-bass': {
      comfort: {
        species: 'largemouth-bass',
        value: 84,
        reasons: ['Temperature is in the optimal range for largemouth bass'],
        assessed: true,
        freshness: { observedAt: '2026-09-14T10:00:00Z', ageMinutes: 30 },
      },
      activity: { total: 0, components: [] },
    },
    bluegill: {
      comfort: {
        species: 'bluegill',
        value: 0,
        reasons: [],
        assessed: false,
        freshness: null,
      },
      activity: { total: 0, components: [] },
    },
  },
};

async function seedSettings(speciesMode: 'trout' | 'all') {
  await db.settings.put({
    key: 'app',
    value: { tempUnit: 'F', speciesMode, speciesFocus: '', reduceMotion: false },
  });
}

function renderCard(route: string) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      new Response(JSON.stringify(SNAPSHOT), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    ) as unknown as typeof fetch,
  );
  const client = new QueryClient({
    defaultOptions: { queries: { networkMode: 'offlineFirst', retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <SettingsProvider>
        <MemoryRouter initialEntries={[route]}>
          <FishabilityCard streamId="w" />
        </MemoryRouter>
      </SettingsProvider>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('FishabilityCard', () => {
  it('renders the focus species comfort pill and reasons in all-fish + focus', async () => {
    await seedSettings('all');
    renderCard('/?focus=largemouth-bass');
    expect(await screen.findByText('Largemouth bass')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Largemouth bass fishability 84 out of 100 — Good'),
    ).toBeInTheDocument();
    expect(screen.getByText(/optimal range/i)).toBeInTheDocument();
    // Comfort only: no activity breakdown anywhere (Stage 4).
    expect(screen.queryByText(/activity/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/component/i)).not.toBeInTheDocument();
  });

  it('renders honest No data when the species carried no assessment', async () => {
    await seedSettings('all');
    renderCard('/?focus=bluegill');
    expect(await screen.findByText('Bluegill')).toBeInTheDocument();
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('renders nothing in trout mode, without focus, or for an uncataloged species', async () => {
    await seedSettings('trout');
    const c1 = renderCard('/?focus=largemouth-bass');
    expect(c1.container.querySelector('.fishability-card')).toBeNull();
    cleanup();
    await seedSettings('all');
    const c2 = renderCard('/');
    expect(c2.container.querySelector('.fishability-card')).toBeNull();
  });
});
