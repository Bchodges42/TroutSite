import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FishabilityCard, pressureAgeText } from '../src/components/FishabilityCard';
import { SettingsProvider } from '../src/lib/settings';
import { db } from '../src/lib/db';
import type { PressureContext } from '@trout/contracts';

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
const NORRIS = {
  streamId: 'norris-lake',
  fetchedAt: '2026-09-14T12:00:00Z',
  bySpecies: {
    crappie: {
      comfort: {
        species: 'crappie',
        value: 54,
        reasons: ['Temperature sits between the optimal and avoidance bands for crappie'],
        assessed: true,
        freshness: { observedAt: '2026-09-14T10:00:00Z', ageMinutes: 45 },
      },
      activity: {
        total: 54,
        components: [
          {
            factor: 'water-temperature',
            value: 54,
            contribution: 2.4,
            weight: 0.6,
            evidenceUrl: 'https://waterdata.usgs.gov/monitoring-location/03477200',
            confidence: 'measured',
            label: 'Water temperature',
          },
          {
            factor: 'pressure-trend',
            value: 58,
            contribution: 3.2,
            weight: 0.4,
            evidenceUrl: 'https://api.weather.gov/stations/KTPA/observations/latest',
            confidence: 'derived',
            label: 'Area pressure steady',
          },
        ],
      },
    },
  },
};
const SNAPSHOT = {
  streamId: 'w',
  fetchedAt: '2026-09-14T12:00:00Z',
  pressureContext: {
    direction: 'falling',
    deltaHpa: -2.4,
    station: 'KCSV',
    confidence: 'derived',
    evidenceUrl: 'https://api.weather.gov/stations/KCSV/observations',
    observedAt: '2026-09-14T10:00:00Z',
    label: 'Area pressure falling -2.4 hPa over about 3 hours',
  },
  rainContext: {
    precipitationMm: 4.2,
    confidence: 'measured',
    evidenceUrl: 'https://waterdata.usgs.gov/monitoring-location/03434500',
    observedAt: '2026-09-14T10:00:00Z',
    label: 'Recent rain: 4.2 mm at the gauge',
  },
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

function renderCard(route: string, streamId = 'w') {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const body =
        url.includes('norris-lake')
          ? NORRIS
          : SNAPSHOT;
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
        <MemoryRouter initialEntries={[route]}>
          <FishabilityCard streamId={streamId} />
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
    expect(
      await screen.findByRole('heading', { name: 'Largemouth bass' }),
    ).toBeInTheDocument();
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

  it('F12 — shows measured rain context separately from the score', async () => {
    renderCard('/?focus=largemouth-bass');
    expect(await screen.findByRole('note', { name: 'Weather context' })).toHaveTextContent(
      /Recent rain: 4.2 mm at the gauge — expect stain and rising water/i,
    );
    expect(screen.getByText('Measured gauge context only, not part of the score.')).toBeInTheDocument();
  });

  it('F12 — hides the rain note when area pressure is not falling', async () => {
    // Norris crappie's fixture pressure is steady/rising (58 > 45 threshold).
    renderCard('/?focus=crappie', 'norris-lake');
    expect(await screen.findByText('Crappie')).toBeInTheDocument();
    expect(screen.queryByRole('note', { name: 'Weather context' })).toBeNull();
  });

  it('renders honest no-activity-data when the outlook is empty — never a zero score', async () => {
    renderCard('/?focus=bluegill');
    expect(
      await screen.findByRole('heading', { name: 'Bluegill' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/No activity data yet/i)).toBeInTheDocument();
    expect(screen.queryByText(/Activity outlook:/)).not.toBeInTheDocument();
  });

  it('renders honest No data when the species carried no assessment', async () => {
    await seedSettings('all');
    renderCard('/?focus=bluegill');
    expect(
      await screen.findByRole('heading', { name: 'Bluegill' }),
    ).toBeInTheDocument();
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

/**
 * F04 — cached assessments must not read as current forever, and F48 — the
 * pressure context shows its observation age. Fixtures build observedAt
 * relative to the real clock (the hooks stamp the payload at the data
 * boundary), so ages are deterministic without fake timers.
 */
const minutesAgoIso = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

function snapshotForAges(options: {
  comfortAgeMinutes?: number | null;
  comfortFrozenAgeMinutes?: number;
  pressureAgeMinutes?: number | null;
}) {
  const comfortFresh =
    options.comfortAgeMinutes == null
      ? null
      : {
          observedAt: minutesAgoIso(options.comfortAgeMinutes),
          ageMinutes: options.comfortFrozenAgeMinutes ?? 30,
        };
  const pressureContext = {
    direction: 'falling',
    deltaHpa: -2.4,
    station: 'KCSV',
    confidence: 'derived',
    evidenceUrl: 'https://api.weather.gov/stations/KCSV/observations',
    observedAt: minutesAgoIso(options.pressureAgeMinutes ?? 0),
    label: 'Area pressure falling -2.4 hPa over about 3 hours',
  };
  return {
    streamId: 'aged',
    fetchedAt: minutesAgoIso(5),
    pressureContext,
    bySpecies: {
      'largemouth-bass': {
        comfort: {
          species: 'largemouth-bass',
          value: 84,
          reasons: ['Temperature is in the optimal range for largemouth bass'],
          assessed: true,
          freshness: comfortFresh,
        },
        activity: { total: 0, components: [] },
      },
    },
  };
}

function renderAgedCard(snapshot: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      new Response(JSON.stringify(snapshot), {
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
        <MemoryRouter initialEntries={['/?focus=largemouth-bass']}>
          <FishabilityCard streamId="aged" />
        </MemoryRouter>
      </SettingsProvider>
    </QueryClientProvider>,
  );
}

describe('FishabilityCard — F04 historical framing and F48 pressure age', () => {
  it('F48 — shows the pressure observation age alongside the station', async () => {
    await seedSettings('all');
    renderAgedCard(snapshotForAges({ comfortAgeMinutes: 30, pressureAgeMinutes: 120 }));
    const note = await screen.findByRole('note', { name: 'Weather context' });
    expect(note).toHaveTextContent(/observed 2 hours ago/i);
    expect(note).toHaveTextContent(/KCSV/);
  });

  it('F48 — renders no age claim when observedAt is absent or unreadable (never fabricated)', () => {
    // The contract schema demands observedAt, so the hook path cannot deliver
    // a context row without one — the no-claim branch is defense in depth for
    // additive/legacy payload shapes and is tested at its decision point (the
    // pure helper, clock injected).
    const withoutObservedAt = {
      direction: 'falling',
      deltaHpa: -2.4,
      station: 'KCSV',
      confidence: 'derived',
      evidenceUrl: 'https://api.weather.gov/stations/KCSV/observations',
      label: 'Area pressure falling -2.4 hPa over about 3 hours',
    } as unknown as PressureContext;
    expect(pressureAgeText(withoutObservedAt, Date.parse('2026-09-29T12:00:00Z'))).toBeNull();
    const unreadable = { ...withoutObservedAt, observedAt: 'not-a-timestamp' } as unknown as PressureContext;
    expect(pressureAgeText(unreadable, Date.parse('2026-09-29T12:00:00Z'))).toBeNull();
    const present = { ...withoutObservedAt, observedAt: '2026-09-29T10:00:00Z' } as unknown as PressureContext;
    expect(pressureAgeText(present, Date.parse('2026-09-29T12:00:00Z'))).toBe('2 hours ago');
  });

  it('F04 — a month-old cached assessment reads as historical, not current', async () => {
    await seedSettings('all');
    renderAgedCard(
      snapshotForAges({ comfortAgeMinutes: 30 * 24 * 60, comfortFrozenAgeMinutes: 30 }),
    );
    expect(
      await screen.findByText(/Historical assessment — observed .*not current conditions/i),
    ).toBeInTheDocument();
    // The score is kept and honestly framed, not silently dropped…
    expect(
      screen.getByLabelText('Largemouth bass fishability 84 out of 100 — Good'),
    ).toBeInTheDocument();
    // …and a visible historical chip guards the header pill.
    expect(screen.getByText('Historical')).toBeInTheDocument();
  });

  it('F04 — a fresh assessment keeps the plain observed line with no historical label', async () => {
    await seedSettings('all');
    renderAgedCard(snapshotForAges({ comfortAgeMinutes: 30 }));
    expect(await screen.findByText(/^Observed /)).toBeInTheDocument();
    expect(screen.queryByText('Historical')).toBeNull();
    expect(screen.queryByText(/not current conditions/)).toBeNull();
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
