import { afterAll, describe, expect, it } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import type { ConditionSnapshot, StockingEvent } from '@trout/contracts';
import ScoreBadge from './ScoreBadge.astro';
import ConditionsEmbed from './ConditionsEmbed.astro';
import StockingTable from './StockingTable.astro';

const container = await AstroContainer.create();
const rendered = new Set<string>();
async function renderOnce(
  component: Parameters<typeof container.renderToString>[0],
  props: Record<string, unknown>,
  key: string,
): Promise<string> {
  if (!rendered.has(key)) {
    rendered.add(key);
    (renderCache[key] = container.renderToString(component, { props })) as Promise<string>;
  }
  return renderCache[key];
}
const renderCache: Record<string, Promise<string>> = {};
afterAll(async () => {
  // Wait for all in-flight renders so the test process exits cleanly.
  await Promise.all(Object.values(renderCache));
});

function stockingEvent(overrides: Partial<StockingEvent>): StockingEvent {
  return {
    id: 'tn-test-1',
    stateId: 'TN',
    streamName: 'Test Water',
    species: 'rainbow',
    date: '2026-12-01',
    sourceUrl: 'https://www.tn.gov/twra/fishing.html',
    fetchedAt: '2026-08-20T13:00:00Z',
    ...overrides,
  } as StockingEvent;
}

function snapshot(score: { value: number; assessed?: boolean; reasons?: string[] }): ConditionSnapshot {
  return {
    streamId: 'test-water',
    readings: [
      { gaugeId: '03400000', cfs: 120, tempC: 18, timestamp: '2026-09-28T14:00:00Z' },
    ],
    score: {
      value: score.value,
      reasons: score.reasons ?? ['Flow 120 cfs is within the ideal range (100–500 cfs).'],
      ...(score.assessed === undefined ? {} : { assessed: score.assessed }),
    },
    fetchedAt: '2026-09-28T14:05:00Z',
    nextExpectedUpdate: '2026-09-28T15:05:00Z',
  } as ConditionSnapshot;
}

/** F07 (2026-09-29 audit): ScoreBadge must honor `assessed`, share the PWA's
 *  70/40 bands, and render an assessed zero as Poor — never as "No data". */
describe('ScoreBadge render (F07)', () => {
  it('shows Poor for an assessed zero — the lethal-clamp verdict, not "No data"', async () => {
    const html = await renderOnce(ScoreBadge, { value: 0, assessed: true }, 'sb-0-true');
    expect(html).toContain('Poor');
    expect(html).not.toContain('No data');
  });

  it('shows the honest unavailable state for unassessed data — never a verdict', async () => {
    const html = await renderOnce(ScoreBadge, { value: 10, assessed: false }, 'sb-10-false');
    expect(html).toContain('No data');
    expect(html).not.toContain('Poor');
    // An unassessed 0–100 figure is a fake score; it must not render.
    expect(html).not.toContain('/100');
    expect(html).not.toContain('>10<');
  });

  it('keeps the assessed numeric score for real assessments', async () => {
    const html = await renderOnce(ScoreBadge, { value: 85, assessed: true }, 'sb-85-true');
    expect(html).toContain('85');
    expect(html).toContain('Good');
  });

  it('uses the PWA/contract 70/40 band boundaries', async () => {
    expect(await renderOnce(ScoreBadge, { value: 72, assessed: true }, 'sb-72-true')).toContain('Good');
    expect(await renderOnce(ScoreBadge, { value: 69, assessed: true }, 'sb-69-true')).toContain('Fair');
    expect(await renderOnce(ScoreBadge, { value: 45, assessed: true }, 'sb-45-true')).toContain('Fair');
    expect(await renderOnce(ScoreBadge, { value: 39, assessed: true }, 'sb-39-true')).toContain('Poor');
  });

  it('renders legacy snapshots (no assessed flag) with a nonzero score as a real assessment', async () => {
    const html = await renderOnce(ScoreBadge, { value: 85 }, 'sb-85-legacy');
    expect(html).toContain('Good');
    expect(html).not.toContain('No data');
  });

  it('renders legacy zero as the unavailable state, not a fabricated verdict', async () => {
    const html = await renderOnce(ScoreBadge, { value: 0 }, 'sb-0-legacy');
    expect(html).toContain('No data');
    expect(html).not.toContain('Poor');
  });
});

/** F07: the embed must forward `assessed` into the badge. */
describe('ConditionsEmbed render (F07)', () => {
  it('renders the assessed-zero probe as Poor', async () => {
    const html = await renderOnce(
      ConditionsEmbed,
      {
        snapshot: snapshot({ value: 0, assessed: true, reasons: ['Water temperature 25.4°C is lethally warm — avoid stressing trout.'] }),
        streamName: 'Test Water',
        gaugeIds: ['03400000'],
      },
      'ce-0-true',
    );
    expect(html).toContain('Poor');
    expect(html).not.toContain('No data');
    expect(html).toContain('lethally warm');
  });

  it('renders the unassessed probe as unavailable, not "Poor"', async () => {
    const html = await renderOnce(
      ConditionsEmbed,
      {
        snapshot: snapshot({ value: 10, assessed: false, reasons: ['The gauge returned no usable flow or stage data.'] }),
        streamName: 'Test Water',
        gaugeIds: ['03400000'],
      },
      'ce-10-false',
    );
    expect(html).toContain('No data');
    expect(html).not.toContain('Poor');
  });
});

/** F08 (2026-09-29 audit): the table must preserve datePrecision and never
 *  dress a schedule entry up as a completed TWRA release. */
describe('StockingTable render (F08)', () => {
  const PINNED_TODAY = '2026-09-29';

  it('renders a month-window row as "December 2026" with its scheduled state', async () => {
    const html = await renderOnce(
      StockingTable,
      {
        events: [stockingEvent({ date: '2026-12-01', datePrecision: 'month' })],
        todayIso: PINNED_TODAY,
      },
      'st-month',
    );
    expect(html).toContain('December 2026');
    expect(html).not.toContain('Dec 1, 2026');
    expect(html).toContain('Month window · scheduled');
    expect(html).not.toMatch(/reported|released|completed/i);
  });

  it('renders a past-dated exact-day plan as Past-scheduled, never "Reported completed"', async () => {
    const html = await renderOnce(
      StockingTable,
      {
        events: [stockingEvent({ date: '2026-08-28', datePrecision: 'day' })],
        todayIso: PINNED_TODAY,
      },
      'st-past',
    );
    expect(html).toContain('Past-scheduled');
    expect(html).not.toMatch(/reported|released|completed/i);
  });

  it('renders a future exact-day plan as Scheduled', async () => {
    const html = await renderOnce(
      StockingTable,
      {
        events: [stockingEvent({ date: '2026-12-16', datePrecision: 'day' })],
        todayIso: PINNED_TODAY,
      },
      'st-future',
    );
    expect(html).toContain('Scheduled');
    expect(html).not.toMatch(/reported|released|completed/i);
  });

  it('keeps a Status header column so plans read as plans', async () => {
    const html = await renderOnce(
      StockingTable,
      {
        events: [stockingEvent({ date: '2026-12-01', datePrecision: 'month' })],
        todayIso: PINNED_TODAY,
      },
      'st-status-col',
    );
    expect(html).toContain('Status');
  });

  it('defaults to the build date for the scheduled/past-scheduled split', async () => {
    const html = await renderOnce(
      StockingTable,
      { events: [stockingEvent({ date: '2099-01-01', datePrecision: 'day' })] },
      'st-default-today',
    );
    expect(html).toContain('Scheduled');
  });
});
