import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ShopsPage } from '../src/pages/ShopsPage';
import { QueryClient } from '@tanstack/react-query';
import { SettingsProvider } from '../src/lib/settings';

/**
 * T2-27 — shop report photos render publicly, alongside the attribution
 * block (ADR 0002), on ShopsPage.
 */

const REPORTS = [
  {
    id: 'r1',
    shopId: 's1',
    shopName: 'Creek Side Anglers',
    streamId: 'harpeth-river',
    date: '2026-09-10',
    body: 'Blue-winged olives came off mid-afternoon; fish keyed in on the shimmy.',
    hotPatterns: [{ patternId: 'bw-olive', hookSize: 18 }],
    attributionUrl: 'https://creekside.example.com/reports/1',
    photoUrl: 'https://images.example.com/photos/report-1.jpg',
    publishedAt: '2026-09-11T00:00:00Z',
  },
  {
    id: 'r2',
    shopId: 's1',
    shopName: 'Creek Side Anglers',
    date: '2026-09-08',
    body: 'No photo report.',
    hotPatterns: [],
    attributionUrl: 'https://creekside.example.com/reports/2',
    publishedAt: '2026-09-09T00:00:00Z',
  },
];

function stubReports(reports = REPORTS) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const body = url.includes('/v1/reports/recent.json') ? reports : [];
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }) as unknown as typeof fetch,
  );
}

function renderShops() {
  const _client = new QueryClient({
    defaultOptions: { queries: { networkMode: 'offlineFirst', retry: false } },
  });
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { networkMode: 'offlineFirst', retry: false } } })}>
      <SettingsProvider>
        <MemoryRouter initialEntries={['/shops']}>
          <ShopsPage />
        </MemoryRouter>
      </SettingsProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => stubReports());
afterEach(cleanup);

describe('T2-27 — shop report photos render with attribution', () => {
  it('keeps an external report photo behind an explicit source link', async () => {
    renderShops();
    const source = (await screen.findAllByRole('link', { name: /view at source/i }))[0]!;
    expect(source).toHaveAttribute('href', 'https://images.example.com/photos/report-1.jpg');
    expect(screen.queryByRole('img', { name: /Photo from Creek Side/ })).toBeNull();
    // The explicit photo source lives inside the same attributed card.
    const card = source.closest('li');
    expect(card?.textContent).toContain('view at source ↗');
    expect(card?.textContent).toContain('Creek Side Anglers');
  });

  it('does not fetch an external photo automatically', async () => {
    const external = { ...REPORTS[0]!, photoUrl: 'https://images.example.com/report-1.jpg' };
    stubReports([external]);
    renderShops();
    expect(await screen.findByText(/Photo hosted by the shop/)).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /Photo from Creek Side/ })).toBeNull();
  });

  it('reports without a photo render no image', async () => {
    renderShops();
    const noPhoto = await screen.findByText('No photo report.');
    expect(noPhoto.closest('li')?.querySelector('img.report-photo')).toBeNull();
  });
});
