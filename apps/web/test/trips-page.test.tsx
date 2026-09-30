import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ConditionSnapshot, Stream } from '@trout/contracts';
import { TripsPage } from '../src/pages/TripsPage';
import { db } from '../src/lib/db';
import { completeTrip, createTrip, listTrips } from '../src/lib/trips';
import { putManifest, tripManifestId } from '../src/lib/downloadManifests';

/**
 * Trips page tests (ADR 0012). Real Dexie via fake-indexeddb (auto-enabled in
 * test setup), seeded through the same lib/trips helpers the page uses. The
 * catalog + conditions feeds are stubbed at `fetch` on the same frozen /v1/*
 * endpoints every surface speaks — one shared statewide conditions request
 * feeds every water line, exactly as in the app.
 */

const NOW = Date.now();

/** Local calendar day offset from today, YYYY-MM-DD (never hardcode dates — the clock moves). */
function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function makeStream(overrides: Partial<Stream> = {}): Stream {
  return {
    id: 'clinch-river',
    name: 'Clinch River',
    stateId: 'TN',
    waterbodyType: 'tailrace',
    regionId: 'tn-east-clinch',
    hydroIdentity: { gnisIds: ['00000001'], huc8s: ['06010201'] },
    gaugeIds: ['g0'],
    stockingProgram: true,
    idealFlow: [{ min: 100, max: 400, unit: 'cfs' }],
    species: 'trout',
    officialSources: [],
    ...overrides,
  } as unknown as Stream;
}

function makeSnapshot(streamId: string, overrides: Partial<ConditionSnapshot> = {}): ConditionSnapshot {
  return {
    streamId,
    fetchedAt: new Date(NOW - 5 * 60_000).toISOString(),
    nextExpectedUpdate: new Date(NOW + 55 * 60_000).toISOString(),
    score: { value: 82, assessed: true, reasons: ['Within the ideal range.'] },
    readings: [
      { gaugeId: 'g0', timestamp: new Date(NOW - 10 * 60_000).toISOString(), cfs: 200, tempC: 12 },
    ],
    ...overrides,
  } as unknown as ConditionSnapshot;
}

let streams: Stream[];
let conditions: ConditionSnapshot[];

function stubFeeds() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: unknown) => {
      const u = String(url);
      let body: unknown = [];
      if (u.includes('conditions/latest')) body = conditions;
      else if (u.includes('content-pack')) body = { streams };
      else if (u.includes('streams')) body = streams;
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }) as unknown as typeof fetch,
  );
}

function renderPage(initialEntry = '/trips') {
  const client = new QueryClient({
    defaultOptions: { queries: { networkMode: 'offlineFirst', retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="trips" element={<TripsPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

async function tripsList(): Promise<HTMLElement> {
  return screen.findByRole('list', { name: 'Trips' });
}

async function openDetails(title: string): Promise<HTMLElement> {
  const user = userEvent.setup();
  const row = await screen.findByText(title);
  const li = row.closest('li')!;
  await user.click(within(li).getByRole('button', { name: 'Trip details' }));
  return li;
}

beforeEach(async () => {
  await Promise.all([db.trips.clear(), db.downloadManifests.clear(), db.snapshots.clear()]);
  streams = [
    makeStream({ yearRound: true }),
    makeStream({
      id: 'holston-river',
      name: 'Holston River',
      regionId: 'tn-east-holston',
      stockingProgram: false,
    }),
  ];
  // Only the Clinch carries readings — the shared feed is not uniform.
  conditions = [makeSnapshot('clinch-river')];
  stubFeeds();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('Trips page', () => {
  it('empty state explains what trips are for and links to /browse and /compare', async () => {
    renderPage();
    expect(await screen.findByText('No trips planned yet')).toBeInTheDocument();
    expect(screen.getByText(/local-only, no account/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse waters' })).toHaveAttribute('href', '/browse');
    expect(screen.getByRole('link', { name: 'Compare waters' })).toHaveAttribute('href', '/compare');
  });

  it('lists planned trips before recorded ones, soonest date first, with counts', async () => {
    await createTrip({ title: 'Later float', date: dateOffset(3), waterIds: ['holston-river'] });
    await createTrip({ title: 'Sooner wade', date: dateOffset(1) });
    const done = await createTrip({ title: 'Finished trip', date: dateOffset(-2) });
    await completeTrip(done.id);

    renderPage();
    const list = await screen.findByRole('list', { name: 'Trips' });
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(within(items[0]!).getByText('Sooner wade')).toBeInTheDocument();
    expect(within(items[1]!).getByText('Later float')).toBeInTheDocument();
    expect(within(items[2]!).getByText('Finished trip')).toBeInTheDocument();
    expect(screen.getByText('2 planned · 1 recorded')).toBeInTheDocument();
  });

  it('creates a trip from the URL handoff (?waters=&title=&date=)', async () => {
    const user = userEvent.setup();
    const when = dateOffset(10);
    renderPage(`/trips?waters=clinch-river,holston-river&title=Clinch+weekend&date=${when}`);

    // The form opens pre-filled from the shortlist.
    const nameInput = await screen.findByLabelText('Trip name');
    expect(nameInput).toHaveValue('Clinch weekend');
    expect(screen.getByLabelText('Trip date')).toHaveValue(when);
    expect(screen.getByLabelText('Waters (comma-separated catalog ids)')).toHaveValue(
      'clinch-river, holston-river',
    );

    await user.click(screen.getByRole('button', { name: 'Create trip' }));

    await waitFor(async () => expect(await db.trips.count()).toBe(1));
    const trip = (await listTrips())[0]!;
    expect(trip.title).toBe('Clinch weekend');
    expect(trip.date).toBe(when);
    expect(trip.waterIds).toEqual(['clinch-river', 'holston-river']);
    // The starter checklist arrived with it.
    expect(trip.checklist.map((c) => c.label)).toContain('Verify latest conditions before leaving');
    expect(await within(await tripsList()).findByText('Clinch weekend')).toBeInTheDocument();
  });

  it('creates a trip from the plain form', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Plan a trip' }));
    await user.type(screen.getByLabelText('Trip name'), 'Duck day');
    await user.type(screen.getByLabelText('Waters (comma-separated catalog ids)'), 'holston-river');
    await user.click(screen.getByRole('button', { name: 'Create trip' }));

    await waitFor(async () => expect(await db.trips.count()).toBe(1));
    const trip = (await listTrips())[0]!;
    expect(trip.title).toBe('Duck day');
    expect(trip.waterIds).toEqual(['holston-river']);
    expect(await within(await tripsList()).findByText('Duck day')).toBeInTheDocument();
  });

  it('checklist toggles, additions, and removals persist to the store', async () => {
    const trip = await createTrip({ title: 'Checklist trip', waterIds: ['clinch-river'] });
    renderPage();
    await openDetails('Checklist trip');

    const starter = screen.getByRole('checkbox', { name: 'Verify latest conditions before leaving' });
    const user = userEvent.setup();
    await user.click(starter);
    await waitFor(() =>
      expect(
        db.trips
          .get(trip.id)
          .then(
            (t) =>
              t?.checklist.find((c) => c.label === 'Verify latest conditions before leaving')?.done,
          ),
      ).resolves.toBe(true),
    );

    await user.type(screen.getByLabelText('New checklist item'), 'Buy license');
    await user.click(screen.getByRole('button', { name: 'Add item' }));
    await waitFor(() =>
      expect(
        db.trips.get(trip.id).then((t) => t?.checklist.some((c) => c.label === 'Buy license')),
      ).resolves.toBe(true),
    );

    const addedRow = screen.getByText('Buy license').closest('li')!;
    await user.click(within(addedRow).getByRole('button', { name: 'Remove' }));
    await user.click(within(addedRow).getByRole('button', { name: 'Really remove Buy license' }));
    await waitFor(() =>
      expect(
        db.trips.get(trip.id).then((t) => t?.checklist.some((c) => c.label === 'Buy license')),
      ).resolves.toBe(false),
    );
  });

  it('Record trip stamps completedAt and offers the logbook prefill link', async () => {
    const trip = await createTrip({ title: 'Recordable', date: dateOffset(0), waterIds: ['clinch-river'] });
    renderPage();
    await openDetails('Recordable');

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Record trip' }));

    await waitFor(() =>
      expect(db.trips.get(trip.id).then((t) => t?.completedAt ?? 0)).resolves.toBeGreaterThan(0),
    );
    // Carried context is untouched — only the stamp was added.
    expect(await db.trips.get(trip.id).then((t) => t?.waterIds)).toEqual(['clinch-river']);
    expect(await screen.findByRole('link', { name: 'Log it' })).toHaveAttribute(
      'href',
      '/logbook?stream=clinch-river',
    );
  });

  it('pack readiness chips read honestly: no manifest / partial / ready', async () => {
    await createTrip({ title: 'Bare trip' });
    const partial = await createTrip({ title: 'Partial trip' });
    const ready = await createTrip({ title: 'Ready trip' });

    // Partial: one optional section verified, a required one still missing.
    await putManifest({
      id: tripManifestId(partial.id),
      kind: 'trip',
      label: 'Partial pack',
      manifestVersion: 1,
      sections: [
        { key: 'catalog', label: 'Water + regs', required: true, ready: false },
        { key: 'map', label: 'Offline map', required: false, ready: true },
      ],
      assetUrls: [],
    });
    await putManifest({
      id: tripManifestId(ready.id),
      kind: 'trip',
      label: 'Ready pack',
      manifestVersion: 1,
      sections: [{ key: 'catalog', label: 'Water + regs', required: true, ready: true }],
      assetUrls: [],
    });

    renderPage();
    const list = await tripsList();
    expect(await within(list).findByText('Pack ready')).toBeInTheDocument();
    expect(within(screen.getByText('Bare trip').closest('li')!).getByText('No offline pack yet')).toBeInTheDocument();
    expect(within(screen.getByText('Partial trip').closest('li')!).getByText('Pack partial')).toBeInTheDocument();
    expect(within(screen.getByText('Ready trip').closest('li')!).getByText('Pack ready')).toBeInTheDocument();

    // Detail honesty: the partial pack's per-section state is spelled out
    // (the label sits in a <strong>, so match the segment after it).
    await openDetails('Partial trip');
    expect(
      await screen.findByText(/Partial — required sections not downloaded yet/),
    ).toBeInTheDocument();
  });

  it('future-dated trips show seasonal flags only — never current conditions', async () => {
    await createTrip({ title: 'Next month', date: dateOffset(30), waterIds: ['clinch-river'] });
    renderPage();
    const row = await openDetails('Next month');

    // The water HAS live readings in the feed — they must not appear.
    expect(within(row).queryByText(/Current conditions/i)).not.toBeInTheDocument();
    expect(within(row).queryByText(/200 cfs/)).not.toBeInTheDocument();
    // Expected seasonal guidance comes from the catalog flags instead.
    expect(within(row).getByText('Stocking program')).toBeInTheDocument();
    expect(within(row).getByText('Year-round fishery')).toBeInTheDocument();
    expect(within(row).getByText(/seasonal outlook only/i)).toBeInTheDocument();
    // Waters still link to their conditions page for the pre-departure check.
    expect(within(row).getByRole('link', { name: 'Clinch River' })).toHaveAttribute(
      'href',
      '/conditions/clinch-river',
    );
  });

  it('today-dated trips label the conditions line as current', async () => {
    await createTrip({ title: 'Right now', date: dateOffset(0), waterIds: ['clinch-river'] });
    renderPage();
    const row = await openDetails('Right now');

    expect(await within(row).findByText(/Current conditions: gauge data is current/)).toBeInTheDocument();
  });

  it('Copy plan shares waters + date only — never notes or checklist', async () => {
    await createTrip({
      title: 'Shareable',
      date: dateOffset(5),
      waterIds: ['clinch-river', 'holston-river'],
      notes: 'SECRET-ACCESS-NOTES gate code 1234',
    });
    renderPage();
    const row = await openDetails('Shareable');
    const user = userEvent.setup();

    // The explicit privacy note sits beside the action.
    expect(within(row).getByText(/Notes and the checklist stay on this device/)).toBeInTheDocument();
    await user.click(within(row).getByRole('button', { name: 'Copy plan' }));

    // user-event's setup() stubs navigator.clipboard; read the copy back from it.
    let copied = '';
    await waitFor(async () => {
      copied = await navigator.clipboard.readText();
      expect(copied).toContain('clinch-river');
    });
    expect(copied).toContain('holston-river');
    expect(copied).toContain(dateOffset(5));
    expect(copied).not.toContain('SECRET-ACCESS-NOTES');
    expect(copied).not.toContain('Pack tackle and flies');
  });

  it('edits date, species, and notes in place', async () => {
    const trip = await createTrip({ title: 'Editable', waterIds: ['clinch-river'] });
    renderPage();
    await openDetails('Editable');

    const user = userEvent.setup();
    fireEvent.change(screen.getByLabelText('Trip date'), { target: { value: dateOffset(14) } });
    await user.type(screen.getByLabelText('Species (comma separated)'), 'Rainbow, brown');
    await user.type(screen.getByLabelText('Trip notes (private)'), 'Medio beat below the bridge.');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(db.trips.get(trip.id).then((t) => t?.notes)).resolves.toBe(
        'Medio beat below the bridge.',
      ),
    );
    const saved = (await db.trips.get(trip.id))!;
    expect(saved.date).toBe(dateOffset(14));
    expect(saved.species).toEqual(['Rainbow', 'brown']);
  });

  it('deletes a trip through the two-phase confirm', async () => {
    const trip = await createTrip({ title: 'Doomed plan' });
    renderPage();
    expect(await within(await tripsList()).findByText('Doomed plan')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Delete Doomed plan' }));
    await user.click(screen.getByRole('button', { name: 'Really delete Doomed plan' }));

    await waitFor(() => expect(db.trips.get(trip.id)).resolves.toBeUndefined());
    // With the only trip gone the page falls back to its empty state.
    expect(await screen.findByText('No trips planned yet')).toBeInTheDocument();
  });
});
