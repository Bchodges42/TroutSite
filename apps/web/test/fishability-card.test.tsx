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

const COMPONENTS = [
  {
    factor: 'water-temperature' as const,
    value: 62,
    contribution: 8.4,
    weight: 0.7,
    evidenceUrl: 'https://waterdata.usgs.gov/monitoring-location/03434500',
    confidence: 'measured' as const,
    label: 'Water temperature',
  },
  {
    factor: 'pressure-trend' as const,
    value: 42,
    contribution: -2.4,
    weight: 0.3,
    evidenceUrl: 'https://api.weather.gov/stations/KCSV/observations/latest',
    confidence: 'derived' as const,
    label: 'Area pressure falling 2.1 hPa over 3 h',
  },
];
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
      activity: { total: 56, components: COMPONENTS },
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
    // F10: transparent activity rows — value, contribution, confidence, source.
    expect(screen.getByText(/Activity outlook: 56 \/ 100/)).toBeInTheDocument();
    expect(screen.getByText('Area pressure')).toBeInTheDocument();
    expect(screen.getByText('62 / 100 · +8.4 pts')).toBeInTheDocument();
    expect(screen.getByText('42 / 100 · -2.4 pts')).toBeInTheDocument();
    expect(screen.getByLabelText('Confidence: measured')).toBeInTheDocument();
    expect(screen.getByLabelText('Confidence: derived')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /source/ }).length).toBe(2);
  });

  it('renders honest no-activity-data when the outlook is empty — never a zero score', async () => {
    renderCard('/?focus=bluegill');
    expect(await screen.findByText('Bluegill')).toBeInTheDocument();
    expect(screen.getByText(/No activity data yet/i)).toBeInTheDocument();
    expect(screen.queryByText(/Activity outlook:/)).not.toBeInTheDocument();
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

/** F11 — the solar windows card mounts on the detail surface. */
import { SolarWindowsCard } from '../src/components/SolarWindowsCard';

describe('SolarWindowsCard', () => {
  it('renders today’s dawn and dusk windows for a water with coordinates', () => {
    // caney-fork-river has an anchor in the bundled river index.
    const { container } = render(
      <MemoryRouter>
        <SolarWindowsCard streamId="caney-fork-river" />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Today's windows/i)).toBeInTheDocument();
    expect(container.textContent).toMatch(/Dawn \d/);
    expect(container.textContent).toMatch(/Dusk \d/);
    expect(container.textContent).toMatch(/Heuristic/i);
  });

  it('renders nothing for a water without bundled coordinates', () => {
    const { container } = render(
      <MemoryRouter>
        <SolarWindowsCard streamId="does-not-exist" />
      </MemoryRouter>,
    );
    expect(container.querySelector('.solar-windows')).toBeNull();
  });
});
