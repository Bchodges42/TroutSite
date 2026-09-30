import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ComparePage } from '../src/pages/ComparePage';
import { SettingsProvider } from '../src/lib/settings';
import {
  buildCompareColumn,
  COMPARE_ROW_KEYS,
  MAX_COMPARE_WATERS,
  parseCompareParams,
  serializeCompareParams,
  type CompareColumnCells,
} from '../src/features/compare/compareModel';
import { buildWaterOverview } from '../src/lib/waterOverview';
import { flowTrend } from '../src/lib/conditions';
import { statusForScore } from '../src/features/map/riverMapSelectors';
import { toWaterDecisionView } from '../src/features/map/waterDecision';
import type { ConditionSnapshot, GaugeReading, Stream } from '@trout/contracts';

/**
 * Lane COMPARE tests: pure compareModel (URL round-trip, aligned row building
 * from 2–3 streams, per-metric ages, unassessed-stays-unassessed) plus a
 * render test of ComparePage over seeded catalog data — same fetch-mocking
 * pattern as stream-detail.test.tsx, fake-indexeddb auto-enabled in setup.
 */

const NOW = Date.parse('2026-09-30T15:00:00Z');
const MIN = 60_000;

function makeStream(overrides: Partial<Stream> = {}): Stream {
  return {
    id: 'caney-fork-river',
    name: 'Caney Fork River (Center Hill tailwater)',
    stateId: 'TN',
    waterbodyType: 'tailrace',
    regionId: 'tn-middle-caney-fork',
    hydroIdentity: { gnisIds: ['00000003'], huc8s: ['05130108'], counties: ['Warren', 'DeKalb'] },
    gaugeIds: ['g1'],
    stockingProgram: true,
    idealFlow: [{ min: 200, max: 600, unit: 'cfs' }],
    species: 'trout',
    officialSources: [],
    ...overrides,
  } as unknown as Stream;
}

const caneyStream = makeStream();
const elkStream = makeStream({
  id: 'elk-river',
  name: 'Elk River (Tims Ford tailwater)',
  gaugeIds: ['g2'],
  hydroIdentity: { gnisIds: ['00000004'], huc8s: ['06030004'], counties: ['Lincoln'] },
  opportunity: {
    trout: 'year-round-trout',
    evidenceState: 'documented',
    asOf: '2026',
    statement: 'Documented year-round trout fishery below Tims Ford Dam.',
    // Non-unresolved headlines require claim-specific sources (StreamSchema).
    sources: [
      {
        label: 'TWRA region 3 fishing report',
        url: 'https://www.tn.gov/twra/fishing.html',
        kind: 'agency-assessment',
        retrieved: '2026-03-15',
      },
    ],
  },
} as Partial<Stream>);
const somesStream = makeStream({
  id: 'somes-creek',
  name: 'Somes Creek (Greenbrier)',
  waterbodyType: 'creek',
  regionId: 'tn-east-smokies',
  stockingProgram: false,
  gaugeIds: ['g3'],
  hydroIdentity: { gnisIds: ['00000005'], huc8s: ['06010105'], counties: ['Sevier'] },
});

function reading(overrides: Partial<GaugeReading>): GaugeReading {
  return { gaugeId: 'g1', timestamp: new Date(NOW - 10 * MIN).toISOString(), ...overrides };
}

function makeSnapshot(
  streamId: string,
  readings: GaugeReading[],
  score: { value: number; assessed: boolean; reasons?: string[] },
): ConditionSnapshot {
  return {
    streamId,
    readings,
    score: { ...score, reasons: score.reasons ?? [] },
    fetchedAt: new Date(NOW - MIN).toISOString(),
    nextExpectedUpdate: new Date(NOW + 55 * MIN).toISOString(),
  } as unknown as ConditionSnapshot;
}

const caneySnapshot = makeSnapshot(
  'caney-fork-river',
  [
    reading({ cfs: 240, tempC: 12 }),
    reading({ timestamp: new Date(NOW - 70 * MIN).toISOString(), cfs: 220 }),
  ],
  { value: 82, assessed: true, reasons: ['Within the ideal range.'] },
);
const elkSnapshot = makeSnapshot(
  'elk-river',
  [
    reading({ gaugeId: 'g2', cfs: 155 }),
    // Temperature rides its OWN cadence on this gauge — 8 hours old while flow is 15 minutes old.
    reading({ gaugeId: 'g2', timestamp: new Date(NOW - 480 * MIN).toISOString(), tempC: 18.5 }),
  ],
  { value: 55, assessed: true, reasons: ['Flow a little below the ideal range.'] },
);
const somesSnapshot = makeSnapshot('somes-creek', [], { value: 0, assessed: false });

const caneyStockingEvent = {
  id: 'e1',
  stateId: 'TN',
  streamName: 'Center Hill TW / Caney Fork River',
  species: 'rainbow',
  count: 2500,
  date: '2026-09-18',
  datePrecision: 'week',
  sourceUrl: 'https://www.tnwildlife.net/stocking',
  fetchedAt: new Date(NOW).toISOString(),
} as never;

function columnFor(
  stream: Stream,
  snap: ConditionSnapshot | null,
  opts: { tempUnit?: 'C' | 'F'; lastEvent?: { date: string; precision?: 'day' | 'week' | 'month'; species?: string } } = {},
): CompareColumnCells {
  const score = snap?.score?.value ?? null;
  const status = statusForScore(score, !!snap, snap?.score?.assessed);
  const decision = toWaterDecisionView(
    { stream, status, score, snapshot: snap ?? undefined, species: stream.species },
    'trout',
    9,
  );
  const overview = buildWaterOverview({
    stream,
    decision,
    conditions: snap,
    nowMs: NOW,
    lastStockingEvent: opts.lastEvent,
  });
  return buildCompareColumn(
    stream.id,
    { overview, flowTrend: snap ? flowTrend(snap.readings) : 'unknown', status, species: stream.species },
    { tempUnit: opts.tempUnit ?? 'F', nowMs: NOW },
  );
}

describe('compareModel — URL params', () => {
  it('round-trips three waters plus a species focus through the query string', () => {
    const qs = serializeCompareParams(['caney-fork-river', 'elk-river', 'somes-creek'], 'smallmouth-bass');
    const parsed = parseCompareParams(new URLSearchParams(qs));
    expect(parsed.waterIds).toEqual(['caney-fork-river', 'elk-river', 'somes-creek']);
    expect(parsed.species).toBe('smallmouth-bass');
    expect(parsed.overCap).toEqual([]);
  });

  it('caps at three waters and reports the overflow instead of mixing it in', () => {
    const parsed = parseCompareParams(new URLSearchParams('waters=a,b,c,d,e'));
    expect(parsed.waterIds).toEqual(['a', 'b', 'c']);
    expect(parsed.overCap).toEqual(['d', 'e']);
    expect(MAX_COMPARE_WATERS).toBe(3);
  });

  it('trims whitespace, drops empties, and de-duplicates while preserving order', () => {
    const parsed = parseCompareParams(new URLSearchParams('waters= a ,, b , a '));
    expect(parsed.waterIds).toEqual(['a', 'b']);
  });

  it('treats a missing or empty param as no waters and no species', () => {
    expect(parseCompareParams(new URLSearchParams(''))).toEqual({ waterIds: [], species: null, overCap: [] });
    expect(parseCompareParams(new URLSearchParams('waters=&species='))).toEqual({
      waterIds: [],
      species: null,
      overCap: [],
    });
  });

  it('omits the species param when null and caps serialize at three', () => {
    expect(serializeCompareParams([], null)).toBe('');
    expect(serializeCompareParams(['a', 'b'], null)).toBe('waters=a,b');
    const qs = serializeCompareParams(['a', 'b', 'c', 'd'], null);
    expect(parseCompareParams(new URLSearchParams(qs)).waterIds).toEqual(['a', 'b', 'c']);
  });
});

describe('compareModel — aligned rows from buildWaterOverview', () => {
  it('keeps the fixed row order so columns and cards stay alignable', () => {
    expect([...COMPARE_ROW_KEYS]).toEqual([
      'identity',
      'opportunity',
      'assessment',
      'temperature',
      'flow',
      'stocking',
      'releases',
      'hatch',
    ]);
  });

  it('builds identity, opportunity, assessment, temp, flow, stocking, releases and hatch for a stocked tailwater', () => {
    const col = columnFor(caneyStream, caneySnapshot, {
      lastEvent: { date: '2026-09-18', precision: 'week', species: 'rainbow' },
    });
    expect(col.inCatalog).toBe(true);
    expect(col.cells.identity.text).toBe('Caney Fork River — Center Hill tailwater');
    expect(col.cells.identity.detail).toBe('Tailwater · Warren, DeKalb');
    // No adjudicated opportunity block → the fishery class is the honest fallback.
    expect(col.cells.opportunity.text).toBe('Trout water');
    // Real assessment wears its real band — never a clamped zero.
    expect(col.cells.assessment.text).toBe('Good');
    expect(col.cells.assessment.tone).toBe('good');
    expect(col.cells.assessment.detail).toBe('Within the ideal range.');
    // Flow + its own trend, from the water's own readings at one gauge.
    expect(col.cells.flow.text).toBe('240 cfs ↑ rising');
    expect(col.cells.temperature.text).toBe('53.6°F');
    expect(col.cells.stocking.text).toBe('TWRA stocking program');
    expect(col.cells.stocking.detail).toMatch(/^Week of .+ \(published schedule\)$/);
    expect(col.cells.releases.text).toBe('Release schedule applies');
    expect(col.cells.hatch.text).toBe('Applies to this water');
  });

  it('leads with the adjudicated opportunity headline when the catalog authored one', () => {
    const col = columnFor(elkStream, elkSnapshot);
    expect(col.cells.opportunity.text).toBe('Year-round trout opportunity');
    expect(col.cells.opportunity.detail).toBeNull();
    expect(col.cells.assessment.text).toBe('Fair');
  });

  it('carries each metric’s OWN age — a fresh flow never makes an old temperature look fresh', () => {
    const col = columnFor(elkStream, elkSnapshot);
    expect(col.cells.flow.tone).toBe('live');
    expect(col.cells.flow.detail).toMatch(/^Observed 10 minutes ago$/);
    expect(col.cells.temperature.tone).toBe('stale');
    expect(col.cells.temperature.detail).toMatch(/^Stale — observed 8 hours ago$/);
  });

  it('keeps an unassessed water unassessed — no score, no band, never zero', () => {
    const col = columnFor(somesStream, somesSnapshot);
    expect(col.cells.assessment.text).toBe('Unassessed');
    expect(col.cells.assessment.tone).toBe('neutral');
    // Adjudicated-but-unassessed: no invented reason, no borrowed score.
    expect(col.cells.assessment.detail).toBeNull();
    expect(col.cells.assessment.text).not.toContain('0');
  });

  it('marks a water with no decision at all as honestly unassessed', () => {
    const overview = buildWaterOverview({ stream: somesStream, decision: null, nowMs: NOW });
    const col = buildCompareColumn(
      somesStream.id,
      { overview, flowTrend: 'unknown', status: 'no-data', species: somesStream.species },
      { tempUnit: 'F', nowMs: NOW },
    );
    expect(col.cells.assessment.text).toBe('Unassessed');
    expect(col.cells.assessment.detail).toMatch(/never ranked as zero/);
  });

  it('reads missing metrics as "No data" — never zero, never a negative claim', () => {
    const col = columnFor(somesStream, somesSnapshot);
    expect(col.cells.temperature.text).toBe('No data');
    expect(col.cells.flow.text).toBe('No data');
    expect(col.cells.temperature.tone).toBe('neutral');
    // Facts of applicability stay factual, not bad.
    expect(col.cells.stocking.text).toBe('No listed stocking program');
    expect(col.cells.releases.text).toBe('Not a dam-release water');
    expect(col.cells.hatch.text).toBe('No trout-opportunity signals');
  });

  it('honors the °C tempUnit setting', () => {
    const col = columnFor(caneyStream, caneySnapshot, { tempUnit: 'C' });
    expect(col.cells.temperature.text).toBe('12°C');
  });

  it('renders an id outside the catalog as an honest all-"No data" column', () => {
    const col = buildCompareColumn('ghost-water', null, { tempUnit: 'F', nowMs: NOW });
    expect(col.inCatalog).toBe(false);
    expect(col.cells.identity.text).toBe('ghost-water');
    expect(col.cells.identity.detail).toMatch(/Not in the water catalog/);
    for (const key of COMPARE_ROW_KEYS.slice(1)) {
      expect(col.cells[key].text).toBe('No data');
    }
  });
});

describe('ComparePage (render)', () => {
  function renderPage(url: string) {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        let body: unknown = [];
        if (url.includes('conditions')) {
          body = [caneySnapshot, elkSnapshot, somesSnapshot];
        } else if (url.includes('stocking')) {
          body = [caneyStockingEvent];
        } else if (url.includes('streams')) {
          body = [caneyStream, elkStream, somesStream];
        }
        return new Response(JSON.stringify(body), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }) as unknown as typeof fetch,
    );
    const client = new QueryClient({
      defaultOptions: { queries: { networkMode: 'offlineFirst', retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <SettingsProvider>
          <MemoryRouter initialEntries={[url]}>
            <Routes>
              <Route path="compare" element={<ComparePage />} />
            </Routes>
          </MemoryRouter>
        </SettingsProvider>
      </QueryClientProvider>,
    );
  }

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('renders three aligned columns from shared URL params', async () => {
    renderPage('/compare?waters=caney-fork-river,elk-river,somes-creek');
    // Wait for conditions to land before scoping to the board — cells read
    // "No data" while the feed is in flight.
    await screen.findAllByText('240 cfs ↑ rising');
    const desktop = screen.getByTestId('compare-board-desktop');
    // One synchronized table: each water's identity, flow, temp, assessment align by row.
    expect(within(desktop).getAllByText(/Caney Fork River/).length).toBeGreaterThan(0);
    expect(within(desktop).getAllByText(/Elk River/).length).toBeGreaterThan(0);
    expect(within(desktop).getAllByText(/Somes Creek/).length).toBeGreaterThan(0);
    expect(within(desktop).getAllByText('240 cfs ↑ rising').length).toBeGreaterThan(0);
    expect(within(desktop).getAllByText('53.6°F').length).toBeGreaterThan(0);
    // The unassessed creek stays unassessed on the page, never ranked as zero.
    expect(within(desktop).getAllByText('Unassessed').length).toBeGreaterThan(0);
    // Applicability facts render for both tailwaters.
    expect(within(desktop).getAllByText('Release schedule applies')).toHaveLength(2);
    // Honesty note + default species-context wording.
    expect(screen.getAllByText(/no overall winner is computed/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/No species focus selected/i).length).toBeGreaterThan(0);
  });

  it('shows the ?species= focus as the single shared context', async () => {
    renderPage('/compare?waters=caney-fork-river&species=smallmouth-bass');
    await screen.findByTestId('compare-board-desktop');
    expect(screen.getAllByText('Smallmouth bass').length).toBeGreaterThan(0);
  });

  it('removes a column from the URL and the board', async () => {
    const user = userEvent.setup();
    renderPage('/compare?waters=caney-fork-river,elk-river');
    const desktop = await screen.findByTestId('compare-board-desktop');
    await user.click((await within(desktop).findAllByLabelText(/Remove Elk River/))[0]!);
    await waitFor(() => {
      expect(screen.queryAllByText(/Elk River/)).toHaveLength(0);
    });
    // The remaining column is untouched.
    expect(within(desktop).getAllByText(/Caney Fork River/).length).toBeGreaterThan(0);
    // At one water the picker (not the cap note) is offered.
    expect(screen.queryByTestId('compare-cap-note')).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Search rivers' })).toBeInTheDocument();
  });

  it('offers the empty state with a path to /browse when no waters are selected', async () => {
    renderPage('/compare');
    expect(await screen.findByText('Nothing to compare yet')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Browse waters' });
    expect(link).toHaveAttribute('href', '/browse');
  });

  it('holds the three-water cap honestly for over-long shared links', async () => {
    renderPage('/compare?waters=a,b,c,d');
    const capNote = await screen.findByTestId('compare-cap-note');
    expect(capNote.textContent).toMatch(/Three waters is the comparison limit/);
    expect(screen.getByTestId('compare-overcap-note').textContent).toMatch(/left out/);
    const desktop = screen.getByTestId('compare-board-desktop');
    // Only the first three ids become columns; the fourth is reported, not rendered.
    expect(within(desktop).getAllByText('a').length).toBeGreaterThan(0);
    expect(within(desktop).getAllByText('c').length).toBeGreaterThan(0);
    expect(within(desktop).queryByText('d')).not.toBeInTheDocument();
  });

  it('keeps a retired id as an honest "not in the catalog" column', async () => {
    renderPage('/compare?waters=caney-fork-river,ghost-water');
    await screen.findByTestId('compare-board-desktop');
    expect(screen.getAllByText(/Not in the water catalog/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('No data').length).toBeGreaterThan(0);
  });
});
