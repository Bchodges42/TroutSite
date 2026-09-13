import { describe, expect, it, vi, afterEach } from 'vitest';
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
    photoUrl: 'https://images.example.com/report-1.jpg',
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

vi.stubGlobal(
  'fetch',
  vi.fn(async (url: string) => {
    let body: unknown = [];
    if (url.includes('/v1/reports/recent.json')) body = REPORTS;
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }) as unknown as typeof fetch,
);

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

afterEach(cleanup);

describe('T2-27 — shop report photos render with attribution', () => {
  it('renders the report photo next to the attribution block', async () => {
    renderShops();
    const photo = await screen.findByRole('img', {
      name: /Photo from Creek Side Anglers's report/i,
    });
    expect(photo).toHaveAttribute('src', 'https://images.example.com/report-1.jpg');
    // The photo lives inside the same attributed card as the source link.
    const card = photo.closest('li');
    expect(card?.textContent).toContain('view at source ↗');
    expect(card?.textContent).toContain('Creek Side Anglers');
  });

  it('reports without a photo render no image', async () => {
    renderShops();
    const noPhoto = await screen.findByText('No photo report.');
    expect(noPhoto.closest('li')?.querySelector('img.report-photo')).toBeNull();
  });
});
