import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SettingsProvider } from '../src/lib/settings';
import { WaterOverviewCard } from '../src/features/waters/WaterOverviewCard';
import { buildSurfaceOverview } from '../src/features/waters/buildSurfaceOverview';
import { isSaved } from '../src/lib/savedWaters';
import { listEntries } from '../src/lib/logbook';
import type { ConditionSnapshot, GaugeReading, Stream } from '@trout/contracts';

/**
 * WaterOverviewCard (ADR 0013): ONE composed overview rendered verbatim from
 * a built WaterOverview. The fixtures below go through buildSurfaceOverview —
 * the same toWaterDecisionView + buildWaterOverview composition the drawer
 * and detail page use — never a hand-rolled model.
 */

let seq = 0;

function makeStream(overrides: Partial<Stream> = {}): Stream {
  const id = `overview-w-${++seq}`;
  return {
    id,
    name: 'Caney Fork River (Center Hill Dam)',
    stateId: 'TN',
    waterbodyType: 'tailrace',
    regionId: 'r0',
    hydroIdentity: { counties: ['Putnam', 'Smith'], gnisIds: [], huc8s: [] },
    gaugeIds: ['g0'],
    stockingProgram: true,
    idealFlow: [],
    species: 'trout',
    officialSources: [
      { label: 'USGS', url: 'https://waterdata.usgs.gov' },
      { label: 'TWRA', url: 'https://www.tn.gov/twra' },
    ],
    // ADR 0010 authored opportunity block — the catalog decides the headline.
    opportunity: { trout: 'year-round-trout', evidenceState: 'documented', caveats: [] },
    ...overrides,
    // Keep the generated id unless the override pins one explicitly.
    ...(overrides.id ? {} : { id }),
  } as unknown as Stream;
}

function makeSnapshot(stream: Stream, readings: GaugeReading[]): ConditionSnapshot {
  return {
    streamId: stream.id,
    fetchedAt: new Date().toISOString(),
    nextExpectedUpdate: new Date().toISOString(),
    score: { value: 72, assessed: true, reasons: ['Within the ideal range.'] },
    readings,
  } as unknown as ConditionSnapshot;
}

function renderCard(
  stream: Stream,
  snapshot: ConditionSnapshot | null,
  variant: 'full' | 'compact' = 'full',
) {
  const surface = buildSurfaceOverview({
    stream,
    snapshot,
    status: snapshot ? 'good' : 'no-data',
    score: snapshot ? snapshot.score.value : null,
    species: stream.species,
    mode: 'trout',
    month: 9,
    live: true,
    nowMs: Date.now(),
  });
  render(
    <MemoryRouter>
      <SettingsProvider>
        <WaterOverviewCard
          overview={surface.overview}
          variant={variant}
          decisionContext={surface.decisionContext}
        />
      </SettingsProvider>
    </MemoryRouter>,
  );
  return surface;
}

function mixedFreshnessReadings(): GaugeReading[] {
  const now = Date.now();
  // Gauges report discharge and temperature on independent cadences: the flow
  // is minutes old, the temperature is four hours old. The SNAPSHOT is 'live'
  // (its newest reading is fresh) while the temp metric stays visibly aged —
  // a fresh flow never refreshes an old temperature.
  return [
    { gaugeId: '03940000', timestamp: new Date(now - 5 * 60_000).toISOString(), cfs: 240 } as GaugeReading,
    { gaugeId: '03940010', timestamp: new Date(now - 240 * 60_000).toISOString(), tempC: 17 } as GaugeReading,
  ];
}

function allStaleReadings(): GaugeReading[] {
  const now = Date.now();
  return [
    { gaugeId: '03940000', timestamp: new Date(now - 240 * 60_000).toISOString(), cfs: 240 } as GaugeReading,
    { gaugeId: '03940010', timestamp: new Date(now - 300 * 60_000).toISOString(), tempC: 17 } as GaugeReading,
  ];
}

afterEach(() => {
  cleanup();
});

describe('WaterOverviewCard', () => {
  it('renders identity, opportunity headline, status, and availability from a built overview (full)', async () => {
    const stream = makeStream();
    renderCard(stream, makeSnapshot(stream, mixedFreshnessReadings()));
    expect(await screen.findByText('Caney Fork River')).toBeInTheDocument();
    expect(screen.getByText(/Center Hill Dam · Tailwater · Putnam · Smith/)).toBeInTheDocument();
    expect(screen.getByText('Year-round trout opportunity')).toBeInTheDocument();
    // decisionStatusText vocabulary — a band word, never a score.
    expect(screen.getByText('Good')).toBeInTheDocument();
    expect(screen.queryByText(/out of 100/i)).not.toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  it('compact variant renders the same story with counties held for the details disclosure', async () => {
    const stream = makeStream();
    renderCard(stream, makeSnapshot(stream, mixedFreshnessReadings()), 'compact');
    expect(await screen.findByText('Caney Fork River')).toBeInTheDocument();
    expect(screen.getByText(/Center Hill Dam · Tailwater/)).toBeInTheDocument();
    expect(screen.queryByText(/Putnam · Smith/)).not.toBeInTheDocument();
    // Details still carries the counties without expanding the summary first.
    const details = screen.getByText('Details').closest('details')!;
    expect(within(details).getByText(/Counties: Putnam, Smith/)).toBeInTheDocument();
  });

  it('each metric carries its own observation age — fresh flow never refreshes stale temp', async () => {
    const stream = makeStream();
    renderCard(stream, makeSnapshot(stream, mixedFreshnessReadings()));
    expect(await screen.findByText('240 cfs')).toBeInTheDocument();
    // The metric ROW carries the ages; Details repeats them with gauge ids.
    const metricsRegion = screen.getByTestId('overview-metrics');
    const flowAge = within(metricsRegion).getByText(/observed 5 minutes? ago/);
    const tempAge = within(metricsRegion).getByText(/observed 4 hours? ago/);
    // The stale metric is visibly aged (warning chip); the fresh one is not.
    expect(flowAge.closest('.trout-chip--fair')).toBeNull();
    expect(tempAge.closest('.trout-chip--fair')).not.toBeNull();
    // Gauge ids live behind Details, per metric.
    const details = screen.getByText('Details').closest('details')!;
    expect(within(details).getByText(/Flow 240 cfs · gauge 03940000/)).toBeInTheDocument();
    expect(within(details).getByText(/gauge 03940010/)).toBeInTheDocument();
  });

  it('unassessed waters render the honest label and No data — never a borrowed verdict', async () => {
    const stream = makeStream({ opportunity: undefined, stockingProgram: false });
    renderCard(stream, null);
    expect(await screen.findByText('Not assessed')).toBeInTheDocument();
    expect(screen.getByText('No data')).toBeInTheDocument();
    expect(screen.getByText(/No gauge readings reported/)).toBeInTheDocument();
    expect(screen.queryByText(/Good|Fair|Poor/)).not.toBeInTheDocument();
  });

  it('save toggle writes the My Waters store and reflects the saved state', async () => {
    const user = userEvent.setup();
    const stream = makeStream();
    renderCard(stream, makeSnapshot(stream, mixedFreshnessReadings()));
    const save = await screen.findByRole('button', { name: 'Save' });
    await user.click(save);
    await waitFor(async () => {
      expect(await isSaved(stream.id)).toBe(true);
    });
    expect(await screen.findByRole('button', { name: 'Saved' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await user.click(screen.getByRole('button', { name: 'Saved' }));
    expect(await isSaved(stream.id)).toBe(false);
  });

  it('match hatch is contextual — hidden when no trout-opportunity signal applies', async () => {
    const user = userEvent.setup();
    // stockingProgram:false, no targetSpecies, no fishery → actions.matchHatch false.
    const stream = makeStream({ stockingProgram: false });
    renderCard(stream, makeSnapshot(stream, mixedFreshnessReadings()));
    expect(await screen.findByText('Caney Fork River')).toBeInTheDocument();
    expect(screen.queryByText('Match hatch')).not.toBeInTheDocument();
    // And present when the signal exists (default fixture carries a program).
    cleanup();
    const withProgram = makeStream();
    renderCard(withProgram, makeSnapshot(withProgram, mixedFreshnessReadings()));
    const hatch = await screen.findByText('Match hatch');
    expect(hatch).toHaveAttribute('href', '/hatch-key');
    // Compare points at the shared comparison surface.
    expect(screen.getByText('Compare')).toHaveAttribute(
      'href',
      `/compare?waters=${withProgram.id}`,
    );
    // Quick log deep-links to full editing.
    await user.click(screen.getByRole('button', { name: 'Log trip' }));
    expect(screen.getByText('Edit in logbook')).toHaveAttribute(
      'href',
      `/logbook?stream=${withProgram.id}`,
    );
  });

  it('quick log stores an entry with stream and date prefilled', async () => {
    const user = userEvent.setup();
    const stream = makeStream();
    renderCard(stream, makeSnapshot(stream, mixedFreshnessReadings()));
    await user.click(await screen.findByRole('button', { name: 'Log trip' }));
    const form = screen.getByTestId('quick-log-form');
    const date = within(form).getByLabelText(/Date/) as HTMLInputElement;
    expect(date.value).toBe(new Date().toISOString().slice(0, 10));
    await user.type(within(form).getByLabelText('Log notes'), 'Midges in the seam.');
    await user.click(within(form).getByRole('button', { name: 'Save entry' }));
    expect(await screen.findByRole('status')).toHaveTextContent(/Entry saved/);
    const entries = await listEntries();
    const entry = entries.find((e) => e.streamId === stream.id);
    expect(entry).toBeTruthy();
    expect(entry!.streamName).toBe('Caney Fork River');
    expect(entry!.notes).toBe('Midges in the seam.');
  });

  it('source notices render near the metrics they describe', async () => {
    // A fully stale snapshot carries the stale-source warning; availability
    // reads "Last known" — the stale state is never hidden behind an age.
    const stream = makeStream();
    renderCard(stream, makeSnapshot(stream, allStaleReadings()));
    await screen.findByText('240 cfs');
    expect(screen.getByText('Last known')).toBeInTheDocument();
    const metricsRegion = screen.getByTestId('overview-metrics');
    expect(within(metricsRegion).getByText(/Latest reading is about \d+ hours? old/)).toBeInTheDocument();
  });
});
