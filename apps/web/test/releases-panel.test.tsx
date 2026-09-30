import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReleaseSchedule } from '@trout/contracts';
import { ReleasesPanel } from '../src/features/waters/ReleasesPanel';
import { db } from '../src/lib/db';

/**
 * ReleasesPanel — dam release schedule honesty:
 * blocks render in the DAM's time zone (incl. the America/New_York DST
 * fall-back on Nov 1 2026), the next block is highlighted, provenance
 * (retrieved time + verify link) is visible, an all-past cached schedule says
 * so explicitly, a missing schedule is an explicit empty state, and the
 * observed gauge discharge renders as its own series.
 *
 * fetchSnapshot is exercised for real against a stubbed global fetch and the
 * fake-indexeddb snapshot cache (same pattern as test/fishability-card.test.tsx).
 */

const WATER = 'south-holston-river';
const SOURCE_URL = 'https://www.tva.com/environment/lake-levels';
const ZONE = 'America/New_York';

/** Valid per packages/contracts/src/schemas/releaseSchedule.ts. */
function scheduleFixture(overrides: Partial<ReleaseSchedule> = {}): ReleaseSchedule {
  return {
    waterId: WATER,
    locationId: 'SSHOD',
    retrievedAt: '2026-10-31T14:00:00Z',
    sourceUrl: SOURCE_URL,
    status: 'available',
    releases: [
      // Sat Oct 31 2026, still on EDT (UTC-4).
      { date: '2026-10-31', startTime: '9 AM', endTime: '12 PM', timeZone: 'EDT', generators: '1' },
      // Sun Nov 1 2026 — DST has ended; TVA relabels to EST (UTC-5). Same wall
      // clock hour on a 25-hour day: the DST-crossing case.
      { date: '2026-11-01', startTime: '10 AM', endTime: '2 PM', timeZone: 'EST', generators: '1-2' },
    ],
    forecasts: [],
    ...overrides,
  };
}

// Expected strings are computed with the SAME Intl options the panel uses, so
// the assertions hold on any host locale while still pinning the dam's zone.
const clockFmt = new Intl.DateTimeFormat([], { hour: 'numeric', minute: '2-digit', timeZone: ZONE });
const dayFmt = new Intl.DateTimeFormat([], { weekday: 'long', month: 'long', day: 'numeric', timeZone: ZONE });
const stampFmt = new Intl.DateTimeFormat([], {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});
const numFmt = new Intl.NumberFormat([], { maximumFractionDigits: 1 });

const OCT31_START = Date.parse('2026-10-31T09:00:00-04:00');
const OCT31_END = Date.parse('2026-10-31T12:00:00-04:00');
const NOV1_START = Date.parse('2026-11-01T10:00:00-05:00');
const NOV1_END = Date.parse('2026-11-01T14:00:00-05:00');
const RETRIEVED = Date.parse('2026-10-31T14:00:00Z');

function pinNow(iso: string) {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(Date.parse(iso));
}

interface RenderOptions {
  body?: unknown;
  status?: number;
  latestFlow?: { valueCfs: number; observedAt: string };
}

function renderPanel({ body = scheduleFixture(), status = 200, latestFlow }: RenderOptions = {}) {
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response(JSON.stringify(body), {
          status,
          headers: { 'content-type': 'application/json' },
        }),
    ) as unknown as typeof fetch,
  );
  const client = new QueryClient({
    defaultOptions: { queries: { networkMode: 'offlineFirst', retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ReleasesPanel streamId={WATER} latestFlow={latestFlow ?? null} />
    </QueryClientProvider>,
  );
}

// The snapshot cache persists across tests in this file (fake-indexeddb), and
// fetchSnapshot is DESIGNED to serve the last known copy when the network
// fails — so a 404 test would silently inherit an earlier test's schedule
// unless each test starts from a clean device.
beforeEach(async () => {
  await db.snapshots.clear();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('ReleasesPanel', () => {
  it('renders blocks in the dam zone across the Nov 1 2026 DST fall-back', async () => {
    // Sanity: the fixture instants really do render differently across the
    // fall-back in America/New_York — the assertions below are not vacuous.
    expect(clockFmt.format(Date.parse('2026-11-01T10:00:00-04:00'))).not.toEqual(
      clockFmt.format(NOV1_START),
    );

    pinNow('2026-10-31T14:00:00Z'); // 10 AM EDT Oct 31 — first block in progress
    renderPanel();

    // Day headers follow the dam's calendar, not the device.
    expect(
      await screen.findByText(dayFmt.format(new Date('2026-10-31T16:00:00Z'))),
    ).toBeInTheDocument(); // Saturday, October 31
    expect(screen.getByText(dayFmt.format(new Date('2026-11-01T17:00:00Z')))).toBeInTheDocument(); // Sunday, November 1

    // Wall-clock times reproduce exactly what TVA published in each label
    // (EDT block before the fall-back, EST block after it).
    const edtRow = screen.getByText('Generators: 1').closest('li')!;
    expect(edtRow).toHaveTextContent(clockFmt.format(OCT31_START)); // 9:00 AM
    expect(edtRow).toHaveTextContent(clockFmt.format(OCT31_END)); // 12:00 PM
    expect(edtRow).toHaveTextContent('EDT');

    const estRow = screen.getByText('Generators: 1-2').closest('li')!;
    expect(estRow).toHaveTextContent(clockFmt.format(NOV1_START)); // 10:00 AM
    expect(estRow).toHaveTextContent(clockFmt.format(NOV1_END)); // 2:00 PM
    expect(estRow).toHaveTextContent('EST');
  });

  it('highlights the next scheduled release once earlier blocks have passed', async () => {
    pinNow('2026-10-31T18:30:00Z'); // 2:30 PM EDT — Oct 31 block over, Nov 1 upcoming
    renderPanel();

    const nextChip = await screen.findByText('Next');
    const row = nextChip.closest('li')!;
    expect(row).toHaveAttribute('data-next', 'true');
    expect(row).toHaveTextContent('10:00 AM');

    expect(screen.getByText('Past')).toBeInTheDocument();
    expect(screen.getByText('Past').closest('li')).toHaveTextContent('9:00 AM');
  });

  it('marks the in-progress block and keeps the following one as Next', async () => {
    pinNow('2026-10-31T14:00:00Z'); // 10 AM EDT, inside 9 AM – 12 PM EDT
    renderPanel();

    const chip = await screen.findByText('In progress');
    const row = chip.closest('li')!;
    expect(row).toHaveAttribute('data-next', 'true');
    expect(row).toHaveTextContent('9:00 AM');
    expect(screen.getByText('Next').closest('li')).toHaveTextContent('10:00 AM');
  });

  it('shows the retrieved time and the official verify link', async () => {
    pinNow('2026-10-31T14:00:00Z');
    renderPanel();

    const provenance = await screen.findByText(/Schedule retrieved/);
    expect(provenance.textContent).toContain(stampFmt.format(RETRIEVED));

    const verify = screen.getByRole('link', { name: /Verify with TVA\/USACE/ });
    expect(verify).toHaveAttribute('href', SOURCE_URL);
  });

  it('says so explicitly when every block of the cached schedule has passed', async () => {
    pinNow('2026-11-02T12:00:00Z'); // after the whole weekend's plan
    renderPanel();

    const note = await screen.findByTestId('releases-all-past');
    expect(note).toHaveTextContent(/already passed/i);
    expect(note.textContent).toContain(stampFmt.format(RETRIEVED));
    expect(screen.queryByText('Next')).not.toBeInTheDocument();
    // The historical blocks still render, muted, as the record they are.
    expect(screen.getByText('Generators: 1')).toBeInTheDocument();
  });

  it('shows the explicit unavailable state when no schedule file exists', async () => {
    pinNow('2026-10-31T14:00:00Z');
    renderPanel({
      status: 404,
      latestFlow: { valueCfs: 1240, observedAt: '2026-10-31T14:30:00Z' },
    });

    // Hook retry: 1 → allow the real-timer retry delay to elapse.
    expect(
      await screen.findByRole(
        'heading',
        { name: 'No published release schedule for this water' },
        { timeout: 5000 },
      ),
    ).toBeInTheDocument();
    const verify = screen.getByRole('link', { name: /Verify with TVA\/USACE/ });
    expect(verify).toHaveAttribute('href', 'https://www.tva.com/environment/lake-levels');
    // The gauge value the caller already had still renders — never silence.
    expect(screen.getByRole('note', { name: 'Observed discharge' })).toBeInTheDocument();
  });

  it('shows the explicit unavailable state for an empty published schedule', async () => {
    renderPanel({ body: scheduleFixture({ status: 'empty', releases: [] }) });

    expect(
      await screen.findByRole('heading', { name: 'No published release schedule for this water' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Verify with TVA\/USACE/ })).toHaveAttribute(
      'href',
      SOURCE_URL,
    );
  });

  it('relays the upstream error when the schedule source is unavailable', async () => {
    renderPanel({
      body: scheduleFixture({ status: 'unavailable', error: 'TVA returned HTTP 503' }),
    });

    expect(
      await screen.findByText(/upstream source reported: TVA returned HTTP 503/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'No published release schedule for this water' }),
    ).toBeInTheDocument();
  });

  it('renders observed discharge as its own series, separate from scheduled blocks', async () => {
    pinNow('2026-10-31T14:00:00Z');
    renderPanel({ latestFlow: { valueCfs: 1240, observedAt: '2026-10-31T14:30:00Z' } });

    // Wait for the schedule query itself before asserting the separation —
    // the observed note renders immediately, the timeline only after the fetch.
    await screen.findByText('Generators: 1');

    const note = screen.getByRole('note', { name: 'Observed discharge' });
    expect(note).toHaveAttribute('data-series', 'observed');
    expect(note).toHaveTextContent(`${numFmt.format(1240)} cfs`); // 1,240 cfs
    expect(note.textContent).toContain(
      stampFmt.format(Date.parse('2026-10-31T14:30:00Z')),
    );
    expect(note).toHaveTextContent(/separate series/i);

    // The observed value never merges into the scheduled timeline rows.
    const scheduled = screen.getAllByText(/Generators:/);
    for (const row of scheduled) {
      expect(row.closest('li')).not.toHaveTextContent('1,240');
    }
    expect(within(note).queryAllByText(/Generators:/)).toHaveLength(0);
  });

  it('never renders safety or downstream-arrival claims', async () => {
    pinNow('2026-10-31T14:00:00Z');
    const { container } = renderPanel({
      latestFlow: { valueCfs: 1240, observedAt: '2026-10-31T14:30:00Z' },
    });

    await screen.findByText('In progress');
    const text = container.textContent ?? '';
    expect(text).not.toMatch(/safe to wade|wading|arrives at|arrival time|reach you in/i);
  });
});
