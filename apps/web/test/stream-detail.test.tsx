import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StreamDetailPage } from '../src/pages/StreamDetailPage';
import { statusForScore } from '../src/features/map/riverMapSelectors';
import { SettingsProvider } from '../src/lib/settings';
import type { Stream, ConditionSnapshot } from '@trout/contracts';

/**
 * Stage-1 regression tests for the stream detail page (T1-9, T1-13, T1-14,
 * T1-15). The detail page must tell the same story as the map and the
 * conditions list: waterDecision/statusForScore are the only classification
 * authorities, and trout-model language never appears on non-trout water.
 */

function makeStream(overrides: Partial<Stream> = {}): Stream {
  return {
    id: 'test-water',
    name: 'Test Water',
    stateId: 'TN',
    waterbodyType: 'tailrace',
    regionId: 'r0',
    gaugeIds: ['g0'],
    stockingProgram: true,
    idealFlow: [{ min: 100, max: 400, unit: 'cfs' }],
    species: 'trout',
    officialSources: [],
    ...overrides,
  } as unknown as Stream;
}

function makeSnapshot(overrides: Partial<ConditionSnapshot> = {}): ConditionSnapshot {
  return {
    streamId: 'test-water',
    fetchedAt: new Date().toISOString(),
    nextExpectedUpdate: new Date().toISOString(),
    score: { value: 82, assessed: true, reasons: ['Within the ideal range.'] },
    readings: [
      { gaugeId: 'g0', timestamp: new Date(Date.now() - 600_000).toISOString(), cfs: 200, tempC: 12 },
    ],
    ...overrides,
  } as unknown as ConditionSnapshot;
}

function renderDetail(stream: Stream, snapshot: ConditionSnapshot | null) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      let body: unknown = [];
      if (url.includes('conditions/latest') || url.includes('conditionsLatest')) {
        body = snapshot ? [snapshot] : [];
      } else if (url.includes('streams')) {
        body = [stream];
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
        <MemoryRouter initialEntries={[`/conditions/${stream.id}`]}>
          <Routes>
            <Route path="conditions/:streamId" element={<StreamDetailPage />} />
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

describe('T1-9 — assessed flag parity across map, conditions list, and detail', () => {
  // The three real callsite expressions, one per surface. They must agree on
  // every snapshot shape — that agreement IS the parity contract.
  const surfaces = {
    map: (snap: ConditionSnapshot | undefined) =>
      statusForScore(snap?.score?.value ?? null, !!snap, snap?.score?.assessed),
    list: (snap: ConditionSnapshot | undefined) =>
      statusForScore(snap?.score?.value ?? null, !!snap?.readings?.length, snap?.score?.assessed),
    detail: (snap: ConditionSnapshot) =>
      statusForScore(snap.score.value, snap.readings.length > 0, snap.score.assessed),
  };

  const cases: Array<{ name: string; snap: ConditionSnapshot; expected: string }> = [
    {
      name: 'assessed clamped-0 lethal score is Poor everywhere',
      snap: makeSnapshot({ score: { value: 0, assessed: true, reasons: ['Dangerously warm.'] } }),
      expected: 'poor',
    },
    {
      name: 'unassessed zero (gauge mismatch) is no-data everywhere',
      snap: makeSnapshot({ score: { value: 0, assessed: false, reasons: [] }, readings: [] }),
      expected: 'no-data',
    },
    {
      name: 'assessed fair score is Fair everywhere',
      snap: makeSnapshot({ score: { value: 55, assessed: true, reasons: [] } }),
      expected: 'fair',
    },
    {
      name: 'readings but no assessed flag stays legacy no-data at zero',
      snap: makeSnapshot({
        score: { value: 0, assessed: undefined, reasons: [] } as never,
      }),
      expected: 'no-data',
    },
  ];

  for (const c of cases) {
    it(`parity: ${c.name}`, () => {
      expect(surfaces.map(c.snap)).toBe(c.expected);
      expect(surfaces.list(c.snap)).toBe(c.expected);
      expect(surfaces.detail(c.snap)).toBe(c.expected);
    });
  }

  it('renders a clamped-0 assessed score as Poor on the detail page, not "Assessment unavailable"', async () => {
    renderDetail(
      makeStream(),
      makeSnapshot({ score: { value: 0, assessed: true, reasons: ['Dangerously warm — avoid stressing trout.'] } }),
    );
    expect(
      await screen.findByLabelText('Condition score 0 out of 100 — Poor'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Assessment unavailable/i)).not.toBeInTheDocument();
    expect(screen.getByText('Trout condition assessment')).toBeInTheDocument();
  });
});

describe('T1-13/T1-14/T1-15 — warmwater water shows zero trout-model output', () => {
  // Beech-lake-style warmwater fixture: high temp (26°C), empty idealFlow,
  // and a snapshot whose reasons/trend are pure trout-model language.
  const warmStream = makeStream({
    id: 'warm-pond',
    name: 'Warm Pond',
    species: 'warmwater',
    idealFlow: [],
    stockingProgram: false,
  });
  const warmSnapshot = makeSnapshot({
    streamId: 'warm-pond',
    score: { value: 0, assessed: true, reasons: ['Dangerously warm — avoid stressing trout.'] },
    readings: [
      { gaugeId: 'g0', timestamp: new Date(Date.now() - 600_000).toISOString(), cfs: 900, tempC: 26 },
    ],
  });

  it('renders no trout-model strings anywhere on the detail output', async () => {
    renderDetail(warmStream, warmSnapshot);
    // The state appears in the mobile decision header AND the assessment
    // headline (T2-37) — multiple matches are correct.
    expect((await screen.findAllByText(/Warmwater/i)).length).toBeGreaterThan(0);
    // No trout score pill, no assessment headline, no trend, no reasons.
    expect(screen.queryByLabelText(/Condition score/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Trout condition assessment/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/rising|falling|steady/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/dangerously warm|avoid stressing/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/ideal range/i)).not.toBeInTheDocument();
    // Raw readings still shown, neutrally framed.
    expect(screen.getByText(/raw readings shown/i)).toBeInTheDocument();
  });

  it('T1-14 — temp and flow badges stay neutral on warmwater water (no trout physiology colors)', async () => {
    renderDetail(warmStream, warmSnapshot);
    // The state appears in the mobile decision header AND the assessment
    // headline (T2-37) — multiple matches are correct.
    expect((await screen.findAllByText(/Warmwater/i)).length).toBeGreaterThan(0);
    // 26°C would be 'poor' and 900 cfs 'poor' under the trout model — both
    // must render without any status tint class.
    const container = document.body;
    expect(container.querySelector('.trout-badge--poor')).toBeNull();
    expect(container.querySelector('.trout-badge--good')).toBeNull();
    expect(container.querySelector('.trout-badge--fair')).toBeNull();
  });

  it('T1-14 — trout waters keep trout-threshold badge coloring', async () => {
    renderDetail(makeStream(), makeSnapshot({ readings: [{ gaugeId: 'g0', timestamp: new Date().toISOString(), cfs: 200, tempC: 12 }] }));
    expect(await screen.findByText('Trout condition assessment')).toBeInTheDocument();
    // 200 cfs inside ideal 100–400 and 12°C inside 6–20: both tinted good.
    expect(document.querySelectorAll('.trout-badge--good').length).toBe(2);
  });

  it('T1-15 — empty idealFlow renders "Not listed", never a bare " cfs" badge', async () => {
    renderDetail(warmStream, warmSnapshot);
    // The state appears in the mobile decision header AND the assessment
    // headline (T2-37) — multiple matches are correct.
    expect((await screen.findAllByText(/Warmwater/i)).length).toBeGreaterThan(0);
    expect(screen.getByText('Not listed')).toBeInTheDocument();
    // The ideal-flow badge value itself must never be a bare unit.
    expect(document.body.textContent).not.toMatch(/Ideal flow\s* cfs/);
    expect(screen.queryByText(' cfs')).not.toBeInTheDocument();
  });
});
