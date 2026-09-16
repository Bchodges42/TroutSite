import { describe, expect, it, vi, afterEach } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StreamDetailPage } from '../src/pages/StreamDetailPage';
import { BrowsePage } from '../src/features/map/BrowsePage';
import { SettingsProvider } from '../src/lib/settings';

/** T2-37/38 — mobile decision header, gauge disclosure, dense browse rows. */
vi.stubGlobal(
  'fetch',
  vi.fn(async (url: string) => {
    let body: unknown = [];
    if (url.includes('/v1/streams')) {
      body = [
        {
          id: 'harpeth-river',
          name: 'Harpeth River',
          stateId: 'TN',
          waterbodyType: 'river',
          regionId: 'tn-west',
          hydroIdentity: { gnisIds: ['00000004'], huc8s: ['00000004'] },
          gaugeIds: ['g1'],
          stockingProgram: false,
          species: 'warmwater',
          idealFlow: [],
          officialSources: [],
          targetSpecies: ['largemouth-bass'],
        },
      ];
    } else if (url.includes('/v1/fishability')) {
      body = { streamId: 'harpeth-river', fetchedAt: '2026-09-14T12:00:00Z', bySpecies: {} };
    } else if (url.includes('/v1/conditions')) {
      body = [
        {
          streamId: 'harpeth-river',
          readings: [
            { gaugeId: 'g1', timestamp: new Date().toISOString(), cfs: 120, tempC: 14 },
          ],
          score: { value: 77, assessed: true, reasons: ['Within the ideal range.'] },
          fetchedAt: new Date().toISOString(),
          nextExpectedUpdate: new Date().toISOString(),
        },
      ];
    }
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }) as unknown as typeof fetch,
);

function page(ui: React.ReactNode, initialEntry = '/') {
  const client = new QueryClient({
    defaultOptions: { queries: { networkMode: 'offlineFirst', retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <SettingsProvider>
        <MemoryRouter initialEntries={[initialEntry]}>{ui}</MemoryRouter>
      </SettingsProvider>
    </QueryClientProvider>,
  );
}

function DetailRoutes() {
  return (
    <Routes>
      <Route path="conditions/:streamId" element={<StreamDetailPage />} />
    </Routes>
  );
}

afterEach(cleanup);

describe('T2-37/38 — mobile-first water detail and dense browse rows', () => {
  it('mobile decision header leads with state, age, flow, temp, and one action', { timeout: 20_000 }, async () => {
    page(<DetailRoutes />, '/conditions/harpeth-river');
    const header = await screen.findByTestId('mobile-decision-header');
    expect(header.textContent).toContain('Now');
    expect(header.textContent).toContain('Warmwater');
    expect(header.textContent).toContain('Flow');
    expect(header.textContent).toContain('Temp');
    const action = header.querySelector('a.mobile-next-action');
    expect(action).not.toBeNull();
    expect(action?.getAttribute('href')).toContain('hatch-key');
  });

  it('gauge history renders in a mobile disclosure and a desktop table block', { timeout: 20_000 }, async () => {
    page(<DetailRoutes />, '/conditions/harpeth-river');
    await screen.findByText('Harpeth River');
    // Both the mobile disclosure and the desktop block render in the DOM
    // (CSS hides one) — wait on the live table, not on ambiguous text.
    await screen.findByText('Harpeth River', {}, { timeout: 12_000 });
    const disclosure = await waitFor(
        () => {
          const el = document.querySelector('details.gauge-disclosure');
          expect(el?.querySelector('table')).not.toBeNull();
          return el!;
        },
        { timeout: 12_000 },
      );
    expect(disclosure.querySelector('summary')?.textContent).toContain('Gauge readings');
    expect(document.querySelector('.desktop-only table')).not.toBeNull();
    expect(document.querySelector('details.gauge-disclosure.mobile-only')).not.toBeNull();
    expect(document.querySelector('.desktop-only')).not.toBeNull();
  });

  it('browse rows render dense: name, region, and status in one row', async () => {
    page(<BrowsePage />);
    const row = await screen.findByText('Harpeth River');
    const rowLink = row.closest('a');
    expect(rowLink).toHaveClass('browse-row-dense');
    expect(rowLink?.textContent).toContain('West TN');
  });
});
