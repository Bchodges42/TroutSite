import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StockingPage } from '../src/pages/StockingPage';
import { SettingsProvider } from '../src/lib/settings';
import type { StockingEvent } from '@trout/contracts';

function event(overrides: Partial<StockingEvent> & { id: string }): StockingEvent {
  return {
    stateId: 'TN',
    streamName: 'Test Water',
    species: 'rainbow',
    date: '2026-08-01',
    datePrecision: 'day',
    sourceUrl: 'https://www.tn.gov/twra/fishing/trout-information-stockings.html',
    fetchedAt: '2026-09-04T20:00:00Z',
    ...overrides,
  } as StockingEvent;
}

const EVENTS: StockingEvent[] = [
  event({ id: 'e1', streamName: 'Clinch River', date: '2026-08-28', datePrecision: 'day', species: 'rainbow', count: 4200, county: 'Anderson' }),
  event({ id: 'e2', streamName: 'Caney Fork River', date: '2026-08-25', datePrecision: 'week', species: 'brown', count: 5200, county: 'Warren' }),
  event({ id: 'e3', streamName: 'Hiwassee River', date: '2026-08-20', datePrecision: 'month', species: 'rainbow', county: 'Polk' }),
  event({ id: 'e4', streamName: 'Duck River', date: '2027-03-01', datePrecision: 'week', species: 'brown', county: 'Marshall' }),
  event({ id: 'e5', streamName: 'Elk River', date: '2026-08-10', datePrecision: 'day', species: 'brown', count: 900, county: 'Franklin' }),
  event({ id: 'e6', streamName: 'Watauga River', date: '2026-08-05', datePrecision: 'day', species: 'rainbow', count: 3100, county: 'Carter' }),
  event({ id: 'e7', streamName: 'South Fork Holston River', date: '2026-07-30', datePrecision: 'day', species: 'brown', county: 'Sullivan' }),
  event({ id: 'e8', streamName: 'Obey River', date: '2026-07-22', datePrecision: 'week', species: 'rainbow', count: 2500, county: 'Clay' }),
  event({ id: 'e9', streamName: 'Tellico River', date: '2026-07-15', datePrecision: 'month', species: 'brook', county: 'Monroe' }),
  event({ id: 'e10', streamName: 'Harpeth River', date: '2026-07-02', datePrecision: 'day', species: 'rainbow', count: 1400, county: 'Williamson' }),
];

function renderPage(initialEntry = '/stocking') {
  const fetchMock = vi.fn(async (url: string) =>
    new Response(url.includes('stocking') ? JSON.stringify(EVENTS) : '[]', {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  );
  vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);
  const client = new QueryClient({
    defaultOptions: { queries: { networkMode: 'offlineFirst', retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <SettingsProvider>
        <MemoryRouter initialEntries={[initialEntry]}>
          <StockingPage />
        </MemoryRouter>
      </SettingsProvider>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('Stocking discovery — progressive disclosure with honest data states', () => {
  it('opens with a search field and a small preview, never the entire schedule', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Stocking' })).toBeInTheDocument();
    expect(
      screen.getByRole('searchbox', { name: /Search stocking entries/ }),
    ).toBeInTheDocument();
    await screen.findByText('Latest published');
    expect(screen.getAllByRole('listitem')).toHaveLength(6);
    expect(screen.queryByText('Harpeth River')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Browse the full schedule — 10 entries/ }),
    ).toBeInTheDocument();
  });

  it('distinguishes reported completions, schedules, and date precision', async () => {
    renderPage();
    await screen.findByText('Latest published');
    expect(screen.getAllByText('Reported completed').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Week of · reported/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Month window · reported/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/not field-verified/i).length).toBeGreaterThan(0);
  });

  it('shows scheduled future entries as plans, not completed stockings', async () => {
    renderPage('/stocking?q=Duck');
    await screen.findByText('Duck River');
    expect(screen.getByText('Week of · scheduled')).toBeInTheDocument();
    expect(screen.queryByText('Reported completed')).not.toBeInTheDocument();
  });

  it('opens the full catalog only through the explicit control', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Latest published');
    await user.click(screen.getByRole('button', { name: /Browse the full schedule/ }));
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(10));
    expect(screen.getByText('Harpeth River')).toBeInTheDocument();
  });

  it('searches and filters without auto-expanding everything', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Latest published');
    await user.type(screen.getByRole('searchbox', { name: /Search stocking entries/ }), 'brown');
    await waitFor(() => expect(screen.getByText(/of 4 matching entries/)).toBeInTheDocument());
    expect(screen.getByText('Caney Fork River')).toBeInTheDocument();
    expect(screen.queryByText('Tellico River')).not.toBeInTheDocument();
  });

  it('verifies at the official source on every row', async () => {
    renderPage();
    await screen.findByText('Latest published');
    const links = screen.getAllByRole('link', { name: /Verify at TWRA/ });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link).toHaveAttribute('href', expect.stringContaining('tn.gov'));
      expect(link).toHaveAttribute('target', '_blank');
    }
  });
});
