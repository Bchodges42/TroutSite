import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ConditionSnapshot, Stream } from '@trout/contracts';
import { MyWatersPage } from '../src/pages/MyWatersPage';
import { SettingsProvider } from '../src/lib/settings';
import { db } from '../src/lib/db';
import { createGroup, saveWater } from '../src/lib/savedWaters';

/**
 * My Waters page tests (ADR 0012). Real Dexie via fake-indexeddb (auto-enabled
 * in test setup), seeded through the same savedWaters helpers the page uses.
 * The catalog + conditions feeds are stubbed at `fetch` on the same frozen
 * /v1/* endpoints every surface speaks — one shared statewide conditions
 * request feeds every card, exactly as in the app.
 */

const NOW = Date.now();

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

function makeSnapshot(
  streamId: string,
  overrides: Partial<ConditionSnapshot> = {},
): ConditionSnapshot {
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

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { networkMode: 'offlineFirst', retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <SettingsProvider>
        <MemoryRouter initialEntries={['/my-waters']}>
          <Routes>
            <Route path="my-waters" element={<MyWatersPage />} />
          </Routes>
        </MemoryRouter>
      </SettingsProvider>
    </QueryClientProvider>,
  );
}

/**
 * Seed through the store helpers, then pin a distinct savedAt — two saves in
 * the same millisecond would make newest-first ordering nondeterministic.
 */
async function seedSaved(entry: {
  waterId: string;
  name: string;
  regionId?: string;
  savedAt: number;
  groupIds?: string[];
}) {
  await saveWater({
    waterId: entry.waterId,
    name: entry.name,
    regionId: entry.regionId,
    groupIds: entry.groupIds,
  });
  const row = await db.savedWaters.get(entry.waterId);
  await db.savedWaters.put({ ...row!, savedAt: entry.savedAt });
}

beforeEach(async () => {
  await Promise.all([
    db.savedWaters.clear(),
    db.waterGroups.clear(),
    db.snapshots.clear(),
    db.settings.clear(),
  ]);
  streams = [
    makeStream(),
    makeStream({ id: 'holston-river', name: 'Holston River', regionId: 'tn-east-holston' }),
  ];
  // Holston is saved but carries no conditions entry — the feed is not
  // uniform, and the card must say so honestly.
  conditions = [makeSnapshot('clinch-river')];
  stubFeeds();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('My Waters page', () => {
  it('renders saved cards from the store, newest save first, with honest availability', async () => {
    await seedSaved({ waterId: 'holston-river', name: 'Holston River', savedAt: NOW - 60_000 });
    await seedSaved({ waterId: 'clinch-river', name: 'Clinch River', savedAt: NOW });

    renderPage();
    const list = await screen.findByRole('list', { name: 'Saved waters' });
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(2);

    // Newest save first.
    expect(
      within(items[0]!).getByRole('link', { name: 'Clinch River' }),
    ).toHaveAttribute('href', '/conditions/clinch-river');
    expect(within(items[1]!).getByText('Holston River')).toBeInTheDocument();

    // Catalog-backed card: live gauge chip (after the shared feed resolves),
    // type label, and the water's own readings.
    expect(await within(items[0]!).findByText(/Gauge live/)).toBeInTheDocument();
    expect(within(items[0]!).getByText('Tailwater')).toBeInTheDocument();
    expect(within(items[0]!).getByText(/Flow 200 cfs/)).toBeInTheDocument();
    expect(
      within(items[0]!).getByLabelText('Condition score 82 out of 100 — Good'),
    ).toBeInTheDocument();

    // Saved-but-unmonitored water: absence of readings is stated as absence,
    // never as a claim about fish.
    expect(
      await within(items[1]!).findByText(/No usable gauge data right now/i),
    ).toBeInTheDocument();
  });

  it('group filter chips narrow the list; All restores it', async () => {
    const user = userEvent.setup();
    const weekend = await createGroup('Weekend');
    await seedSaved({ waterId: 'clinch-river', name: 'Clinch River', savedAt: NOW, groupIds: [weekend] });
    await seedSaved({ waterId: 'holston-river', name: 'Holston River', savedAt: NOW - 1000 });

    renderPage();
    await screen.findByRole('link', { name: 'Clinch River' });
    const filters = screen.getByRole('group', { name: 'Filter saved waters by group' });

    await user.click(within(filters).getByRole('button', { name: 'Weekend' }));
    expect(screen.getByRole('link', { name: 'Clinch River' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Holston River' })).not.toBeInTheDocument();

    await user.click(within(filters).getByRole('button', { name: 'All' }));
    expect(screen.getByRole('link', { name: 'Holston River' })).toBeInTheDocument();
  });

  it('creates a group, assigns a water, and deleting the group visibly keeps the water', async () => {
    const user = userEvent.setup();
    await seedSaved({ waterId: 'clinch-river', name: 'Clinch River', savedAt: NOW });

    renderPage();
    await screen.findByRole('link', { name: 'Clinch River' });

    // Create via the inline manager input.
    await user.click(screen.getByRole('button', { name: 'Manage groups' }));
    await user.type(screen.getByLabelText('New group name'), 'Trip');
    await user.click(screen.getByRole('button', { name: 'Create group' }));
    const filters = screen.getByRole('group', { name: 'Filter saved waters by group' });
    expect(await within(filters).findByRole('button', { name: 'Trip' })).toBeInTheDocument();

    // Assign via the card's group editor.
    await user.click(screen.getByRole('button', { name: 'Edit groups' }));
    const editor = await screen.findByRole('group', { name: 'Groups for Clinch River' });
    await user.click(within(editor).getByRole('checkbox'));
    await waitFor(() => expect(within(editor).getByRole('checkbox')).toBeChecked());
    expect((await db.savedWaters.get('clinch-river'))?.groupIds).toHaveLength(1);

    // Two-phase confirm delete (no window.confirm anywhere).
    await user.click(screen.getByRole('button', { name: 'Delete Trip' }));
    await user.click(screen.getByRole('button', { name: 'Really delete Trip' }));

    const filtersAfter = await screen.findByRole('group', { name: 'Filter saved waters by group' });
    await waitFor(() =>
      expect(within(filtersAfter).queryByRole('button', { name: 'Trip' })).not.toBeInTheDocument(),
    );
    // The water survives the group deletion — visibly and in the store.
    expect(screen.getByRole('link', { name: 'Clinch River' })).toBeInTheDocument();
    expect((await db.savedWaters.get('clinch-river'))?.groupIds).toEqual([]);
  });

  it('empty state explains what saving does and links to /browse', async () => {
    renderPage();
    expect(await screen.findByText('No saved waters yet')).toBeInTheDocument();
    expect(
      screen.getByText(/on this device only, no account/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse waters' })).toHaveAttribute('href', '/browse');
  });

  it('a retired catalog id renders its nameSnapshot with the not-in-catalog treatment', async () => {
    await seedSaved({ waterId: 'old-creek', name: 'Old Creek', savedAt: NOW });

    renderPage();
    expect(await screen.findByRole('heading', { name: 'Old Creek' })).toBeInTheDocument();
    expect(await screen.findByText('No longer in the catalog')).toBeInTheDocument();
    // Saved history stays visible, but never pretends the catalog still backs it.
    expect(screen.queryByRole('link', { name: 'Old Creek' })).not.toBeInTheDocument();
    expect(screen.queryByText(/Gauge live/)).not.toBeInTheDocument();
  });
});
