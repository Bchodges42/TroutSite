import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FishabilityCard } from '../src/components/FishabilityCard';
import { EmptyStateNote } from '../src/components/EmptyStateNote';
import { StreamDetailPage } from '../src/pages/StreamDetailPage';
import { SettingsProvider } from '../src/lib/settings';
import { db } from '../src/lib/db';
import type {
  ActivityComponent,
  FlowTrendContext,
  PressureContext,
  RainContext,
} from '@trout/contracts';
// OpportunityView is the waterDecision view type (not a contracts export) —
// the same source the shared note reads it from.
import type { OpportunityView } from '../src/features/map/waterDecision';

/**
 * Polish wave 2026-09-30 — assessment explanations (polish 6) and honest
 * empty states (polish 5):
 *  - every contribution renders its ActivityConfidence label (measured /
 *    derived / heuristic — the contract enum vocabulary, verbatim);
 *  - each factor carries its observed value + the reading's OWN age
 *    (per-metric age discipline — a fresh flow never refreshes old temp);
 *  - an unavailable assessment renders the plain-language sentence, and
 *    absence is never "no fish";
 *  - pressure/rain context stays OUT of the scored activity factors (pinned);
 *  - the three named empty states render with the one action that helps in
 *    each: offline-unsaved (reopen while connected), unresolved-claim
 *    (suggest a correction), unsupported-metric (verify with the official
 *    source).
 */

const minutesAgoIso = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

const COMPONENTS: ActivityComponent[] = [
  {
    factor: 'water-temperature',
    value: 62,
    contribution: 7.2,
    weight: 0.6,
    evidenceUrl: 'https://waterdata.usgs.gov/monitoring-location/03434500',
    confidence: 'measured',
    label: 'Water temperature 16.7°C at the gauge',
  },
  {
    factor: 'pressure-trend',
    value: 42,
    contribution: -2,
    weight: 0.25,
    evidenceUrl: 'https://api.weather.gov/stations/KCSV/observations/latest',
    confidence: 'derived',
    label: 'Area pressure falling 2.1 hPa over 3 h',
  },
  {
    factor: 'spawn-state',
    value: 55,
    contribution: 0.75,
    weight: 0.15,
    evidenceUrl: 'https://waterdata.usgs.gov/monitoring-location/03434500',
    confidence: 'heuristic',
    label: 'Spawn state from observed water temperature',
  },
];

const SNAPSHOT = {
  streamId: 'w',
  fetchedAt: minutesAgoIso(5),
  pressureContext: {
    direction: 'falling',
    deltaHpa: -2.4,
    station: 'KCSV',
    confidence: 'derived',
    evidenceUrl: 'https://api.weather.gov/stations/KCSV/observations',
    observedAt: minutesAgoIso(120),
    label: 'Area pressure falling -2.4 hPa over about 3 hours',
  } as PressureContext,
  rainContext: {
    precipitationMm: 4.2,
    confidence: 'measured',
    evidenceUrl: 'https://waterdata.usgs.gov/monitoring-location/03434500',
    observedAt: minutesAgoIso(30),
    label: 'Recent rain: 4.2 mm at the gauge',
  } as RainContext,
  bySpecies: {
    'largemouth-bass': {
      comfort: {
        species: 'largemouth-bass',
        value: 84,
        reasons: ['Temperature is in the optimal range for largemouth bass'],
        assessed: true,
        freshness: { observedAt: minutesAgoIso(45), ageMinutes: 45 },
      },
      activity: {
        total: 56,
        components: COMPONENTS,
        flowTrend: {
          direction: 'rising',
          magnitude: 120,
          confidence: 'derived',
          evidenceUrl: 'https://waterdata.usgs.gov/monitoring-location/03434500',
          observedAt: minutesAgoIso(15),
          label: 'Flow rising',
        } as FlowTrendContext,
      },
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

const UNRESOLVED_OPPORTUNITY: OpportunityView = {
  trout: 'unresolved',
  evidenceState: 'unresolved',
  statement: 'Published reports disagree on whether this reach holds trout.',
  unresolvedQuestion: 'Which agency survey covers this reach?',
  caveats: ['No survey newer than 2019 was found.'],
  asOf: '2026',
};

async function seedSettings(speciesMode: 'trout' | 'all') {
  await db.settings.put({
    key: 'app',
    value: { tempUnit: 'F', speciesMode, speciesFocus: '', reduceMotion: false },
  });
}

function renderCard(streamId = 'w', snapshot: unknown = SNAPSHOT, route = '/?focus=largemouth-bass') {
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
  // Restore the connectivity the offline test flips, so no other test in the
  // file (or the suite) inherits an offline react-query online manager.
  act(() => {
    window.dispatchEvent(new Event('online'));
  });
});

describe('polish 6 — assessment explanations', () => {
  it('labels every contribution with its contract confidence (measured / derived / heuristic)', async () => {
    await seedSettings('all');
    renderCard();
    expect(
      await screen.findByRole('heading', { name: 'Largemouth bass' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Confidence: measured')).toBeInTheDocument();
    expect(screen.getByLabelText('Confidence: derived')).toBeInTheDocument();
    expect(screen.getByLabelText('Confidence: heuristic')).toBeInTheDocument();
    // The exact contract vocabulary, as small persistent labels — visible text,
    // not just an aria label.
    expect(screen.getByText('measured')).toBeInTheDocument();
    expect(screen.getByText('derived')).toBeInTheDocument();
    expect(screen.getByText('heuristic')).toBeInTheDocument();
  });

  it('shows each factor with its own reading age — comfort, rain, pressure, and flow trend are timed independently', async () => {
    await seedSettings('all');
    renderCard();
    // The comfort score's own observation age (45 min — never borrowed from
    // the fresher flow trend at 15 min).
    expect(await screen.findByText(/^Observed .+ · 45 minutes ago$/)).toBeInTheDocument();
    // The weather context rows carry each reading's own age.
    const note = await screen.findByRole('note', { name: 'Weather context' });
    expect(note).toHaveTextContent(/observed 30 minutes ago/); // rain
    expect(note).toHaveTextContent(/observed 2 hours ago/); // pressure
    // The flow-trend context row too.
    expect(
      screen.getByText(/Derived gauge context · observed 15 minutes ago — not part of the activity score\./),
    ).toBeInTheDocument();
  });

  it('renders the plain-language sentence when the assessment is unavailable — absence is not "no fish"', async () => {
    await seedSettings('all');
    renderCard('w', SNAPSHOT, '/?focus=bluegill');
    expect(
      await screen.findByText(
        /No usable temperature or flow reading for this water right now/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/nothing here should be read as .no fish./),
    ).toBeInTheDocument();
    expect(screen.getByRole('note', { name: 'Assessment unavailable' })).toBeInTheDocument();
    // The overview vocabulary for unavailability stays "No data".
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('pins context factors OUT of the scored activity factors', async () => {
    await seedSettings('all');
    renderCard();
    await screen.findByRole('heading', { name: 'Largemouth bass' });
    const outlook = screen.getByRole('list', { name: 'Activity factors' });
    // The rain CONTEXT (4.2 mm) never appears as an activity factor row…
    expect(within(outlook).queryByText(/Recent rain/)).toBeNull();
    // …and both context blocks stay explicitly labeled as non-score.
    const note = screen.getByRole('note', { name: 'Weather context' });
    expect(note).toHaveTextContent('Measured gauge context only, not part of the score.');
    expect(note).toHaveTextContent(/not part of the score/);
    const flowNote = screen.getByText(/Derived gauge context/);
    expect(flowNote).toHaveTextContent(/not part of the activity score/);
  });

  it('attributes the gauge(s) behind the assessment with a verify-with-USGS link', async () => {
    await seedSettings('all');
    renderCard();
    const attribution = await screen.findByRole('note', { name: 'Assessment sources' });
    expect(attribution).toHaveTextContent(/Scored from USGS gauge 03434500/);
    const verify = within(attribution).getByRole('link', { name: 'verify with USGS ↗' });
    expect(verify).toHaveAttribute(
      'href',
      'https://waterdata.usgs.gov/monitoring-location/03434500',
    );
  });
});

describe('polish 5 — the three named empty states', () => {
  it('offline with nothing saved: the shared note renders with its reopen-while-connected action', async () => {
    await seedSettings('all');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }) as unknown as typeof fetch,
    );
    const client = new QueryClient({
      defaultOptions: { queries: { networkMode: 'offlineFirst', retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <SettingsProvider>
          <MemoryRouter initialEntries={['/']}>
            {/* A water no earlier test cached — the offline-without-a-saved-copy
            state, not the offline-with-a-saved-copy one (the Dexie snapshot
            cache is shared across this file). */}
            <FishabilityCard streamId="never-cached-water" />
          </MemoryRouter>
        </SettingsProvider>
      </QueryClientProvider>,
    );
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    // The FreshnessChip wording, reused verbatim by the shared note.
    expect(
      await screen.findByText('Offline · nothing saved yet', {}, { timeout: 4000 }),
    ).toBeInTheDocument();
    const note = screen.getByRole('note', { name: 'Offline — nothing saved yet' });
    expect(note).toHaveTextContent(/once you open this water while connected/i);
    expect(note).toHaveTextContent(/says nothing about whether the water holds fish/i);
  });

  it('unresolved fishery claim: the shared note renders the unresolved verdict with its evidence wording and a correction action', () => {
    render(
      <MemoryRouter>
        <EmptyStateNote
          variant="unresolved-claim"
          opportunity={UNRESOLVED_OPPORTUNITY}
          waterId="w"
        />
      </MemoryRouter>,
    );
    const note = screen.getByRole('note', { name: 'Unresolved fishery claim' });
    // decisionStatusText/opportunityHeadlineText vocabulary — unresolved stays
    // visible as unresolved, never a hidden negative.
    expect(note).toHaveTextContent('Trout status unresolved');
    expect(note).toHaveTextContent('Unresolved · 2026');
    expect(note).toHaveTextContent('Which agency survey covers this reach?');
    // The one action that helps in THIS state: supply the missing evidence.
    expect(screen.getByRole('link', { name: 'Suggest a correction' })).toHaveAttribute(
      'href',
      '/corrections?water=w',
    );
  });

  it('unsupported metric: the detail page names a reported-but-unassessed metric instead of dropping it', async () => {
    const stream = {
      id: 'test-water',
      name: 'Test Water',
      stateId: 'TN',
      waterbodyType: 'tailrace',
      regionId: 'r0',
      hydroIdentity: { gnisIds: ['00000003'], huc8s: ['00000003'] },
      gaugeIds: ['g0'],
      stockingProgram: false,
      idealFlow: [{ min: 100, max: 400, unit: 'cfs' }],
      species: 'trout',
      officialSources: [
        { label: 'USGS', url: 'https://waterdata.usgs.gov/monitoring-location/03434500' },
      ],
    } as unknown as import('@trout/contracts').Stream;
    const snapshot = {
      streamId: 'test-water',
      fetchedAt: minutesAgoIso(5),
      nextExpectedUpdate: minutesAgoIso(-55),
      score: { value: 82, assessed: true, reasons: ['Within the ideal range.'] },
      readings: [
        {
          gaugeId: 'g0',
          timestamp: minutesAgoIso(10),
          cfs: 200,
          tempC: 12,
          reservoirLevelFt: 505.3,
        },
      ],
    } as unknown as import('@trout/contracts').ConditionSnapshot;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        let body: unknown = [];
        if (url.includes('conditions/latest') || url.includes('conditionsLatest')) {
          body = [snapshot];
        } else if (url.includes('streams')) {
          body = [stream];
        } else if (url.includes('fishability')) {
          body = { streamId: 'test-water', fetchedAt: minutesAgoIso(5), bySpecies: {} };
        }
        return new Response(JSON.stringify(body), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }) as unknown as typeof fetch,
    );
    const client = new QueryClient({
      defaultOptions: { queries: { networkMode: 'offlineFirst', retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <SettingsProvider>
          <MemoryRouter initialEntries={['/conditions/test-water']}>
            <Routes>
              <Route path="conditions/:streamId" element={<StreamDetailPage />} />
            </Routes>
          </MemoryRouter>
        </SettingsProvider>
      </QueryClientProvider>,
    );
    const note = await screen.findByRole(
      'note',
      { name: 'Not assessed for reservoir level' },
      { timeout: 4000 },
    );
    expect(note).toHaveTextContent(/Not assessed for reservoir level/);
    expect(note).toHaveTextContent(/do not score it/);
    // The paired action for THIS state: the official reading source.
    expect(
      within(note).getByRole('link', { name: 'Verify with the official source ↗' }),
    ).toHaveAttribute('href', 'https://waterdata.usgs.gov/monitoring-location/03434500');
  });

  it('unsupported metric: renders honestly even without a known official URL — never a dash implying zero', () => {
    render(<EmptyStateNote variant="unsupported-metric" metric="dissolved oxygen" />);
    const note = screen.getByRole('note', { name: 'Not assessed for dissolved oxygen' });
    expect(note).toHaveTextContent(/Verify with the official source before relying on it\./);
  });
});
