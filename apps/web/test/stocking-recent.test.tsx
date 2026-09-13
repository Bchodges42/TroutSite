import { describe, expect, it, vi, afterEach } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SettingsProvider } from '../src/lib/settings';
import { StockingPage } from '../src/pages/StockingPage';

/**
 * T2-26 — the stocking page's default window reads the small rolling file
 * (-recent.json); the full history file is fetched only for "All dates" /
 * show-history. Which files the page fetches is observable via the fetch mock.
 */

function makeEvents(n: number) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const month = Math.max(1, (i % 12) + 1);
    out.push({
      id: 'e' + i,
      stateId: 'TN',
      streamName: 'Test Water ' + i,
      species: i % 2 === 0 ? 'rainbow' : 'brown',
      date: `2026-${String(month).padStart(2, '0')}-15`,
      sourceUrl: 'https://www.tn.gov/twra/fishing/trout-information-stockings.html',
      fetchedAt: '2026-09-14T00:00:00Z',
    });
  }
  return out;
}

const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
  const u = typeof input === 'string' ? input : input.toString();
  let body: unknown = [];
  if (u.includes('stocking/TN-recent.json')) body = makeEvents(90);
  else if (u.includes('stocking/TN.json')) body = makeEvents(623);
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
});
vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

function requestedUrls(): string[] {
  return fetchMock.mock.calls.map((c) => String(c[0]));
}

function renderStocking(search: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { networkMode: 'offlineFirst', retry: false } },
  });
  return render(
    <SettingsProvider>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[search]}>
          <StockingPage />
        </MemoryRouter>
      </QueryClientProvider>
    </SettingsProvider>,
  );
}

afterEach(() => {
  cleanup();
  fetchMock.mockClear();
});

describe('T2-26 — stocking default view consumes the rolling file', () => {
  it('default 90-day window fetches the -recent file, never the full history', async () => {
    renderStocking('/stocking');
    await vi.waitFor(
      () => {
        if (!requestedUrls().join(' ').includes('stocking/TN-recent.json'))
          throw new Error('recent file not fetched yet');
      },
      { timeout: 5000 },
    );
    expect(requestedUrls().join(' ')).not.toContain('stocking/TN.json');
  });

  it('show-history (All dates) fetches the full file', async () => {
    renderStocking('/stocking?days=3650');
    await vi.waitFor(
      () => {
        if (!requestedUrls().join(' ').includes('stocking/TN.json'))
          throw new Error('full file not fetched yet');
      },
      { timeout: 5000 },
    );
    expect(requestedUrls().join(' ')).not.toContain('-recent.json');
  });
});
