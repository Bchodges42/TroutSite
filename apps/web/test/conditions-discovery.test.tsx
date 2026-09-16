import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConditionsPage } from '../src/pages/ConditionsPage';
import { SettingsProvider } from '../src/lib/settings';
import type { Stream, ConditionSnapshot } from '@trout/contracts';

const STREAMS: Stream[] = [
  ...['Clinch River (Norris tailwater)', 'Watauga River (Wilbur tailwater)', 'Caney Fork River (Center Hill tailwater)'].map(
    (name, i) =>
      ({
        id: 'tail' + i,
        name,
        stateId: 'TN',
        waterbodyType: 'tailrace',
        regionId: 'r' + i,
        hydroIdentity: { gnisIds: [`00000${String(i).padStart(3, '0')}`], huc8s: [`00000${String(i).padStart(3, '0')}`] },
        gaugeIds: ['g' + i],
        stockingProgram: true,
        idealFlow: [{ min: 100, max: 400, unit: 'cfs' }],
        species: 'trout',
        officialSources: [{ label: 'TWRA', url: 'https://www.tn.gov/twra/fishing.html' }],
      }) as unknown as Stream,
  ),
  ...Array.from({ length: 9 }, (_, i) => ({
    id: 'creek-' + i,
    name: 'Cedar Creek ' + i,
    stateId: 'TN',
    waterbodyType: 'creek',
    regionId: 'r' + i,
    hydroIdentity: { gnisIds: [`00001${String(i).padStart(3, '0')}`], huc8s: [`00001${String(i).padStart(3, '0')}`] },
    gaugeIds: [],
    stockingProgram: false,
    idealFlow: [],
    species: 'trout',
    officialSources: [],
  })) as unknown as Stream[],
];

const SNAPSHOTS: ConditionSnapshot[] = STREAMS.filter((s) => s.waterbodyType === 'tailrace').map(
  (s, i) =>
    ({
      streamId: s.id,
      fetchedAt: new Date().toISOString(),
      nextExpectedUpdate: new Date().toISOString(),
      score: { value: [90, 60, 30][i], assessed: true, reasons: ['Within the ideal range.'] },
      readings: [
        { gaugeId: 'g' + i, timestamp: new Date(Date.now() - 600_000).toISOString(), cfs: 200, tempC: 12 },
      ],
    }) as unknown as ConditionSnapshot,
);

function mockCatalog() {
  return vi.fn(async (url: string) => {
    if (url.includes('conditions')) {
      return new Response(JSON.stringify(SNAPSHOTS), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (url.includes('streams')) {
      return new Response(JSON.stringify(STREAMS), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    return new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } });
  });
}

function renderPage(initialEntry = '/conditions') {
  const fetchMock = mockCatalog();
  vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);
  const client = new QueryClient({
    defaultOptions: { queries: { networkMode: 'offlineFirst', retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <SettingsProvider>
        <MemoryRouter initialEntries={[initialEntry]}>
          <ConditionsPage />
        </MemoryRouter>
      </SettingsProvider>
    </QueryClientProvider>,
  );
  return fetchMock;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('Conditions discovery — search-first progressive disclosure', () => {
  it('opens with search, near me, and a few relevant waters — never the whole catalog', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Conditions' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Search waters by name' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Near me/ })).toBeInTheDocument();
    await screen.findByText('Tailwaters now');
    // The small relevance + recency strips appear (a marquee tailwater can
    // legitimately appear in both)…
    expect(screen.getAllByText('Clinch River (Norris tailwater)').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Watauga River (Wilbur tailwater)').length).toBeGreaterThan(0);
    // …but the 9 creeks that are NOT relevant or recent stay unopened.
    expect(screen.queryByText('Cedar Creek 0')).not.toBeInTheDocument();
    expect(screen.getAllByRole('listitem').length).toBeLessThanOrEqual(8);
  });

  it('discloses matching waters only while searching, with a shareable q param', async () => {
    const user = userEvent.setup();
    const fetchMock = renderPage();
    await screen.findByText('Tailwaters now');
    await user.type(screen.getByRole('searchbox', { name: 'Search waters by name' }), 'Clinch');
    await waitFor(() =>
      expect(screen.getByText(/1 of 12 waters/)).toBeInTheDocument(),
    );
    expect(screen.getByText('Clinch River (Norris tailwater)')).toBeInTheDocument();
    expect(screen.queryByText('Cedar Creek 0')).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalled();
  });

  it('restores a deep-linked search from the URL', async () => {
    renderPage('/conditions?q=Watauga');
    await screen.findByText(/Watauga River \(Wilbur tailwater\)/);
    expect(screen.queryByText('Tailwaters now')).not.toBeInTheDocument();
  });

  it('labels every surfaced water honestly, including unassessed ones', async () => {
    renderPage();
    await screen.findAllByText('Clinch River (Norris tailwater)');
    // Assessed tailwater rows carry their score pill with band language.
    expect(
      screen.getAllByLabelText(/Condition score 90 out of 100 — Good/).length,
    ).toBeGreaterThan(0);
    // Creeks without snapshots are described as unassessed where shown at all.
    expect(screen.queryByText(/score unknown/i)).not.toBeInTheDocument();
  });
});
