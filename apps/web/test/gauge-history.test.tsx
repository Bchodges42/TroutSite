import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GaugeHistorySection } from '../src/features/waters/GaugeHistoryChart';
import { gaugeHistoryUrl } from '../src/features/waters/gaugeHistory';
import {
  FIXTURE_GAUGE_ID,
  FIXTURE_NOW_MS,
  denseHistoryFixture,
  sparseHistoryFixture,
} from '../src/features/waters/gaugeHistoryFixtures';
import { db } from '../src/lib/db';
import { SettingsProvider } from '../src/lib/settings';

/**
 * GaugeHistorySection render behavior (ADR 0014):
 * - metric charts render SEPARATELY (one per metric, never dual-axis);
 * - sparse windows render as scatter; the outage renders as a visible break
 *   ([data-gap]) — never a smoothed bridge;
 * - a keyboard-accessible <details> data table doubles as the chart fallback;
 * - 404 / absent history → the section renders NOTHING (honest absence);
 * - window tabs switch (24h / 7d / 30d);
 * - the offline Dexie copy renders with explicit "last known" wording.
 *
 * fetchSnapshot is exercised for real against a stubbed global fetch and the
 * fake-indexeddb snapshot cache (same pattern as test/releases-panel.test.tsx).
 */

function pinNowToFixture() {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(FIXTURE_NOW_MS);
}

interface RenderOptions {
  body?: unknown;
  status?: number;
  gaugeIds?: string[];
}

function renderSection({
  body = denseHistoryFixture(),
  status = 200,
  gaugeIds = [FIXTURE_GAUGE_ID],
}: RenderOptions = {}) {
  const fetchMock = vi.fn(async () =>
    new Response(JSON.stringify(body), {
      status,
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
        <GaugeHistorySection streamId="test-water" gaugeIds={gaugeIds} />
      </SettingsProvider>
    </QueryClientProvider>,
  );
  return fetchMock;
}

// The snapshot cache persists across tests in this file (fake-indexeddb) and
// fetchSnapshot is designed to serve the last known copy on failure — each
// test must start from a clean device.
beforeEach(async () => {
  pinNowToFixture();
  await db.snapshots.clear();
});

afterEach(async () => {
  cleanup();
  await db.snapshots.clear();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('GaugeHistorySection', () => {
  it('renders one chart block per reported metric — never a dual axis', async () => {
    renderSection(); // dense fixture reports cfs + tempC

    await screen.findByText(/Water temperature \(°F\)/);
    expect(screen.getByText(/Discharge \(cfs\)/)).toBeInTheDocument();

    const cfsBlock = document.querySelector('[data-metric="cfs"]')!;
    const tempBlock = document.querySelector('[data-metric="tempC"]')!;
    expect(cfsBlock).not.toBeNull();
    expect(tempBlock).not.toBeNull();
    // Each block holds exactly one SVG figure with its own aria description.
    expect(cfsBlock.querySelectorAll('figure[role="img"] svg')).toHaveLength(1);
    expect(tempBlock.querySelectorAll('figure[role="img"] svg')).toHaveLength(1);
    expect(
      (cfsBlock.querySelector('figure')!.getAttribute('aria-label') ?? '').startsWith('Discharge'),
    ).toBe(true);
    expect(
      (tempBlock.querySelector('figure')!.getAttribute('aria-label') ?? '').startsWith(
        'Water temperature',
      ),
    ).toBe(true);
  });

  it('renders sparse windows as scatter, and the outage as a visible break after switching to 7 days', async () => {
    renderSection({ body: sparseHistoryFixture() });

    // 24h window: 5 stage samples / 3 discharge samples — sparse → dots, no
    // fabricated line continuity, and the outage lies outside this window.
    const cfsBlock = await waitFor(() => {
      const el = document.querySelector('[data-metric="cfs"]');
      expect(el).not.toBeNull();
      return el!;
    });
    expect(cfsBlock.getAttribute('data-render-mode')).toBe('scatter');
    expect(cfsBlock.querySelectorAll('circle.gauge-history-dot').length).toBeGreaterThan(0);
    expect(document.querySelectorAll('[data-gap="true"]')).toHaveLength(0);

    // 7d window: the 36-hour outage (cadence 6h × 3 = 18h < 36h) must appear
    // as a dashed break marker — one per metric chart, never bridged.
    fireEvent.click(screen.getByRole('button', { name: '7 days' }));
    await waitFor(() => {
      expect(document.querySelectorAll('.gauge-history-gap[data-gap="true"]')).toHaveLength(2);
    });
  });

  it('provides the keyboard-accessible tabular equivalent', async () => {
    renderSection(); // dense fixture, 24h → 25 observations

    const summary = await screen.findByText(/View as a data table \(25 observations\)/);
    const table = summary.closest('details')!.querySelector('table')!;
    expect(table).not.toBeNull();
    expect(table.querySelector('th')?.textContent).toContain('Observed');
    expect(Array.from(table.querySelectorAll('th')).map((th) => th.textContent)).toEqual(
      expect.arrayContaining(['Discharge', 'Water temperature']),
    );
    // One row per observation in the window (plus the header row).
    expect(table.querySelectorAll('tbody tr')).toHaveLength(25);
  });

  it('renders NOTHING when the history file is absent (404 = honest absence)', async () => {
    const fetchMock = renderSection({ status: 404 });

    // The query ran and failed — and the section never appeared at all.
    await waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThan(0));
    await waitFor(() => {
      expect(screen.queryByTestId('gauge-history')).not.toBeInTheDocument();
    });
    expect(document.querySelector('.gauge-history')).toBeNull();
  });

  it('switches between 24h / 7d / 30d windows, honestly reporting an empty window', async () => {
    // Record ended ~4 days ago: nothing inside 24h, plenty inside 30d.
    const oldFixture = denseHistoryFixture();
    oldFixture.samples = oldFixture.samples.filter(
      (s) => Date.parse(s.timestamp) < FIXTURE_NOW_MS - 96 * 3_600_000,
    );
    renderSection({ body: oldFixture });

    const note = await screen.findByTestId('gauge-history-empty-window');
    expect(note.textContent).toContain('No observations inside the last 24 hours');

    fireEvent.click(screen.getByRole('button', { name: '30 days' }));
    await waitFor(() => {
      expect(screen.queryByTestId('gauge-history-empty-window')).not.toBeInTheDocument();
    });
    expect(screen.getByText(/View as a data table \(/)).toBeInTheDocument();
    // The selected window is announced to assistive tech.
    expect(screen.getByRole('button', { name: '30 days' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '24 hours' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('serves the offline Dexie copy with explicit last-known wording', async () => {
    const fixture = denseHistoryFixture();
    await db.snapshots.put({
      url: gaugeHistoryUrl(FIXTURE_GAUGE_ID),
      data: fixture,
      fetchedAt: FIXTURE_NOW_MS - 30 * 60_000,
      expiresAt: FIXTURE_NOW_MS + 30 * 60_000,
    });
    // The network is gone (404) — the stored copy must still render, labeled.
    renderSection({ status: 404 });

    const section = await screen.findByTestId('gauge-history');
    expect(section.textContent).toContain('offline — showing the last copy saved on this device');
    expect(screen.getByRole('link', { name: /Verify with USGS/ })).toHaveAttribute(
      'href',
      fixture.sourceUrl,
    );
  });
});
