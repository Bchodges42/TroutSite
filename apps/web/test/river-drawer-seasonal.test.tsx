import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RiverDrawer } from '../src/features/map/RiverDrawer';
import { SettingsProvider } from '../src/lib/settings';
import type { RiverMapFeature } from '../src/features/map/riverMapSelectors';
import type { ConditionSnapshot, HatchChart } from '@trout/contracts';

/**
 * T1-17/T1-18/19 drawer regression: the trout hatch outlook and its
 * "Match the hatch"/"Match this water" CTAs render ONLY where the decision
 * model applies the trout metric; seasonal waters surface the winter-program
 * state instead.
 */

const CHART = {
  regionId: 'tn-test',
  month: 7,
  entries: [
    {
      taxonId: 'midge-x',
      stage: 'adult',
      timeOfDay: 'midday',
      abundance: 3,
      patterns: ['pat-1'],
    },
  ],
} as unknown as HatchChart;

function feature(overrides: {
  species?: 'trout' | 'warmwater' | undefined;
  score?: number | null;
  yearRound?: boolean;
  name?: string;
}): RiverMapFeature {
  const species = 'species' in overrides ? overrides.species : ('trout' as const);
  const snapshot = {
    streamId: 'w',
    fetchedAt: new Date().toISOString(),
    nextExpectedUpdate: new Date().toISOString(),
    score:
      overrides.score == null
        ? { value: 0, assessed: false, reasons: [] }
        : { value: overrides.score, assessed: true, reasons: ['Within the ideal range.'] },
    readings: [{ gaugeId: 'g', timestamp: new Date().toISOString(), cfs: 100, tempC: 10 }],
  } as unknown as ConditionSnapshot;
  return {
    stream: {
      id: 'w',
      name: overrides.name ?? 'Test Water',
      regionId: 'tn-test',
      waterbodyType: 'lake',
      stockingProgram: true,
      idealFlow: [],
      officialSources: [],
      yearRound: overrides.yearRound,
      // ADR 0010: an out-of-season verdict needs an AUTHORED window — the
      // Nov–Mar fallback for bare yearRound:false rows was removed. The
      // winter-program fixture therefore carries the documented window.
      ...(overrides.yearRound === false
        ? { seasonMonths: [11, 12, 1, 2, 3], seasonKind: 'programmatic' as const }
        : {}),
    },
    status: overrides.score == null ? 'no-data' : 'good',
    score: overrides.score ?? null,
    snapshot,
    species,
    hatchChart: CHART,
    hatchDominant: {
      taxonId: 'midge-x',
      timeOfDay: 'midday',
      stage: 'adult',
      abundance: 3,
    },
    stocking: null,
    stockingCount: 0,
    report: null,
  } as unknown as RiverMapFeature;
}

function renderDrawer(f: RiverMapFeature, tab: 'Water' | 'Hatch' | 'Stocking' = 'Water') {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      let body: unknown = [];
      if (url.includes('fishing.json')) {
        body = {
          scope: 'statewide-tn',
          verifiedAt: '2026-09-01',
          disclaimer: 'test',
          sections: [
            { id: 's', title: 'Section', items: [{ id: 'i', title: 'Item', text: 'Text', authority: 'TWRA', sourceUrl: 'https://www.tn.gov/twra' }] },
          ],
        };
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
        <MemoryRouter>
          <RiverDrawer
            feature={f}
            tab={tab}
            onTab={() => {}}
            onClose={() => {}}
            modeMonth={7}
            live={false}
            fetchedAt={null}
            layout="panel"
            loading={false}
          />
        </MemoryRouter>
      </SettingsProvider>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('RiverDrawer — T1-17/T1-18/19 trout-metric gating', () => {
  it('an in-season confirmed trout water shows the hatch outlook and the match CTA', async () => {
    renderDrawer(feature({ species: 'trout', score: 82 }));
    expect(await screen.findByText(/hatch outlook/i)).toBeInTheDocument();
    expect(screen.getByText(/Match the hatch/)).toBeInTheDocument();
    expect(screen.getByText('Good conditions')).toBeInTheDocument();
    expect(screen.queryByText(/Winter program/)).not.toBeInTheDocument();
  });

  it('a warmwater water gets no hatch outlook, no match CTA, and warmwater framing', async () => {
    renderDrawer(feature({ species: 'warmwater', score: null, yearRound: undefined }));
    expect(await screen.findByText('Warmwater fishery')).toBeInTheDocument();
    expect(screen.queryByText(/hatch outlook/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Match the hatch/)).not.toBeInTheDocument();
    // The Hatch tab equally refuses the trout key CTA.
    cleanup();
    renderDrawer(feature({ species: 'warmwater', score: null, yearRound: undefined }), 'Hatch');
    expect(await screen.findByText(/trout hatch model does not apply/i)).toBeInTheDocument();
    expect(screen.queryByText('Match this water')).not.toBeInTheDocument();
  });

  it('a yearRound:false water out of season shows the winter-program chip and no trout outlook', async () => {
    renderDrawer(feature({ species: 'trout', score: 82, yearRound: false }));
    // The seasonal state renders at BOTH the title chip and the assessment
    // headline — that duplication is the design (T2-21).
    expect((await screen.findAllByText('PROGRAMMATIC — out of season')).length).toBeGreaterThan(0);
    expect(screen.queryByText(/hatch outlook/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Match the hatch/)).not.toBeInTheDocument();
    expect(screen.queryByText('Good conditions')).not.toBeInTheDocument();
  });

  it('the Hatch tab on an out-of-season water shows the seasonal state, not the trout key CTA', async () => {
    renderDrawer(feature({ species: 'trout', score: 82, yearRound: false }), 'Hatch');
    expect((await screen.findAllByText(/PROGRAMMATIC/)).length).toBeGreaterThan(0);
    expect(screen.queryByText('Match this water')).not.toBeInTheDocument();
  });
});
