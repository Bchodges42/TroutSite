import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AccessSection, directionsUrl } from '../src/features/waters/AccessSection';
import { db } from '../src/lib/db';

/**
 * AccessSection — verified access honesty (ADR 0019):
 * a record renders with every field (kind, coordinates + copy + directions
 * link, fee/hours/closure, official source, review date) and its uncertainty
 * is prominent; "Open directions" is a plain link the visitor clicks (never
 * auto-opened); an empty pack renders the honest empty state naming stocking
 * markers; a failed load never masquerades as "no access".
 *
 * fetchSnapshot is exercised for real against a stubbed global fetch and the
 * fake-indexeddb snapshot cache (same pattern as test/releases-panel.test.tsx).
 */

const WATER = 'caney-fork-river';

const FULL_RECORD = {
  id: 'test-upper-ramp',
  waterId: WATER,
  reach: 'Upper river, below the dam',
  kind: 'boat-ramp',
  coordinates: { lat: 35.83, lng: -85.51 },
  fee: { amount: '$6 per vehicle', notes: 'Payable at the gate kiosk; cash only.' },
  hours: 'Sunrise to sunset',
  closure: { window: 'Dec 1 – Mar 15', notes: 'Ramp closed for the seasonal drawdown.' },
  officialSource: {
    url: 'https://www.tn.gov/twra/fishing/fishing-access.html',
    publisher: 'Tennessee Wildlife Resources Agency',
    retrievedAt: '2026-09-28',
  },
  reviewDate: '2026-09-28',
  uncertainty: 'Ramp condition at low pool not confirmed in the field.',
  notes: 'Two-lane concrete ramp with a floating dock; gravel lot holds roughly 20 trucks.',
};

function packBody(records: Array<{ waterId: string; access: unknown[] }>) {
  return { records };
}

function renderSection(waterId = WATER) {
  const client = new QueryClient({
    defaultOptions: { queries: { networkMode: 'offlineFirst', retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <AccessSection waterId={waterId} />
    </QueryClientProvider>,
  );
}

function stubFetch(body: unknown, status = 200) {
  return vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response(JSON.stringify(body), {
          status,
          headers: { 'content-type': 'application/json' },
        }),
    ) as unknown as typeof fetch,
  );
}

// The snapshot cache persists across tests in this file (fake-indexeddb), and
// fetchSnapshot serves the last known copy when the network fails — each test
// starts from a clean device.
beforeEach(async () => {
  await db.snapshots.clear();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('AccessSection', () => {
  it('renders a full record: kind, coordinates, copy, directions, fee/hours/closure, source, review date', async () => {
    stubFetch(packBody([{ waterId: WATER, access: [FULL_RECORD] }]));
    renderSection();

    expect(await screen.findByTestId('access-record')).toBeInTheDocument();
    expect(screen.getByText('Boat ramp')).toBeInTheDocument();
    expect(screen.getByText('Upper river, below the dam')).toBeInTheDocument();
    expect(screen.getByText('35.83, -85.51')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy coordinates' })).toBeInTheDocument();

    // Directions are a plain anchor the visitor clicks — never auto-opened.
    const directions = screen.getByRole('link', { name: 'Open directions ↗' });
    expect(directions).toHaveAttribute(
      'href',
      directionsUrl({ lat: 35.83, lng: -85.51 }),
    );
    expect(directions).toHaveAttribute('href', 'https://www.google.com/maps/dir/?api=1&destination=35.83,-85.51');
    expect(directions).toHaveAttribute('target', '_blank');

    expect(screen.getByText(/Fee: \$6 per vehicle — Payable at the gate kiosk/)).toBeInTheDocument();
    expect(screen.getByText('Hours: Sunrise to sunset')).toBeInTheDocument();
    expect(screen.getByText(/Closure: Dec 1 – Mar 15 — Ramp closed for the seasonal drawdown/)).toBeInTheDocument();

    // Provenance: named publisher + review date, always visible.
    const verify = screen.getByRole('link', { name: 'Verify with Tennessee Wildlife Resources Agency ↗' });
    expect(verify).toHaveAttribute('href', 'https://www.tn.gov/twra/fishing/fishing-access.html');
    expect(screen.getByText(/Reviewed 2026-09-28/)).toBeInTheDocument();
  });

  it('shows uncertainty prominently (note role), not as fine print', async () => {
    stubFetch(packBody([{ waterId: WATER, access: [FULL_RECORD] }]));
    renderSection();

    const note = await screen.findByTestId('access-uncertainty');
    expect(note).toHaveAttribute('role', 'note');
    expect(note).toHaveTextContent('Uncertainty');
    expect(note).toHaveTextContent('Ramp condition at low pool not confirmed in the field.');
  });

  it('copies coordinates only on click (clipboard write with the exact text)', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    const original = Object.getOwnPropertyDescriptor(window.navigator, 'clipboard');
    Object.defineProperty(window.navigator, 'clipboard', { value: { writeText }, configurable: true });
    stubFetch(packBody([{ waterId: WATER, access: [FULL_RECORD] }]));
    renderSection();

    try {
      await user.click(await screen.findByRole('button', { name: 'Copy coordinates' }));
      expect(writeText).toHaveBeenCalledWith('35.83, -85.51');
      expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument();
    } finally {
      if (original) Object.defineProperty(window.navigator, 'clipboard', original);
      else delete (window.navigator as { clipboard?: unknown }).clipboard;
    }
  });

  it('omits directions/copy for a record without coordinates and still states the uncertainty', async () => {
    stubFetch(
      packBody([
        {
          waterId: WATER,
          access: [
            {
              ...FULL_RECORD,
              id: 'test-unmarked-walk-in',
              kind: 'walk-in',
              coordinates: undefined,
              uncertainty: 'Unmarked pull-off 0.4 mi past the bridge, east side; no survey marker.',
            },
          ],
        },
      ]),
    );
    renderSection();

    expect(await screen.findByTestId('access-record')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Open directions/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Copy coordinates/ })).not.toBeInTheDocument();
    expect(screen.getByText('Walk-in')).toBeInTheDocument();
    expect(screen.getByTestId('access-uncertainty')).toHaveTextContent(
      'Unmarked pull-off 0.4 mi past the bridge, east side',
    );
  });

  it('renders only the water own records (grouped-by-waterId lookup)', async () => {
    stubFetch(
      packBody([
        { waterId: 'another-water', access: [{ ...FULL_RECORD, id: 'other-water-record' }] },
        { waterId: WATER, access: [FULL_RECORD] },
      ]),
    );
    renderSection();

    await screen.findByTestId('access-record');
    expect(screen.getAllByTestId('access-record')).toHaveLength(1);
    expect(screen.getByText(/Two-lane concrete ramp with a floating dock/)).toBeInTheDocument();
  });

  it('renders the honest empty state when the pack has zero records for the water', async () => {
    stubFetch(packBody([]));
    renderSection();

    expect(
      await screen.findByText('No verified access records for this water yet'),
    ).toBeInTheDocument();
    expect(screen.getByText('Stocking markers are not verified public access points.')).toBeInTheDocument();
    expect(screen.queryByTestId('access-record')).not.toBeInTheDocument();
  });

  it('never renders a failed load as "no access" (error state is its own message)', async () => {
    stubFetch({ error: 'not found' }, 404);
    renderSection();

    // The hook retries once (~1 s backoff) before surfacing the error state.
    expect(
      await screen.findByText('Access information could not be loaded', {}, { timeout: 4000 }),
    ).toBeInTheDocument();
    expect(screen.queryByText('No verified access records for this water yet')).not.toBeInTheDocument();
  });
});
