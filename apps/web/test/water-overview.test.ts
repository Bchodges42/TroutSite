import { describe, expect, it } from 'vitest';
import type { ConditionSnapshot, GaugeReading, Stream } from '@trout/contracts';
import { buildWaterOverview, type WaterOverviewInput } from '../src/lib/waterOverview';

const NOW = Date.parse('2026-09-30T15:00:00Z');
const MIN = 60_000;

function makeStream(overrides: Partial<Stream> = {}): Stream {
  return {
    id: 'harpeth-river',
    name: 'Harpeth River (Franklin reach)',
    waterbodyType: 'river',
    regionId: 'mid-state',
    stockingProgram: false,
    idealFlow: [],
    ...overrides,
  } as unknown as Stream;
}

function reading(overrides: Partial<GaugeReading>): GaugeReading {
  return { gaugeId: '03432350', timestamp: new Date(NOW - 10 * MIN).toISOString(), ...overrides };
}

function makeSnapshot(readings: GaugeReading[]): ConditionSnapshot {
  return {
    streamId: 'harpeth-river',
    readings,
    score: { value: 62, reasons: [], assessed: true },
    fetchedAt: new Date(NOW - MIN).toISOString(),
    nextExpectedUpdate: new Date(NOW + 55 * MIN).toISOString(),
  };
}

function overview(overrides: Partial<WaterOverviewInput> = {}) {
  return buildWaterOverview({
    stream: makeStream(),
    nowMs: NOW,
    ...overrides,
  });
}

describe('buildWaterOverview', () => {
  it('keeps each metric’s own observation age — fresh flow never refreshes old temperature', () => {
    const o = overview({
      conditions: makeSnapshot([
        reading({ cfs: 128 }),
        reading({ timestamp: new Date(NOW - 6 * 60 * MIN).toISOString(), tempC: 19.4 }),
      ]),
    });

    const flow = o.metrics.find((m) => m.key === 'flow');
    const temp = o.metrics.find((m) => m.key === 'temperature');
    expect(flow).toBeDefined();
    expect(temp).toBeDefined();
    expect(flow!.stale).toBe(false);
    expect(flow!.ageMinutes).not.toBeNull();
    expect(flow!.ageMinutes!).toBeLessThan(15);
    expect(temp!.stale).toBe(true);
    expect(temp!.ageMinutes!).toBeGreaterThan(350);
    // Feed-level availability keys on the newest reading (the feed is healthy);
    // the old temperature's age shows on the metric itself, never on the feed.
    expect(o.availability.conditions).toBe('live');
  });

  it('reports unavailable with an honest notice when there are no readings — not a negative claim', () => {
    const o = overview({ conditions: makeSnapshot([]) });
    expect(o.availability.conditions).toBe('unavailable');
    expect(o.notices.some((n) => n.kind === 'source' && n.text.includes('says nothing about whether the water holds fish'))).toBe(true);
    expect(o.metrics).toEqual([]);
  });

  it('warns with a rounded age when readings are stale', () => {
    const o = overview({ conditions: makeSnapshot([reading({ timestamp: new Date(NOW - 5 * 60 * MIN).toISOString(), cfs: 90 })]) });
    expect(o.availability.conditions).toBe('stale');
    const notice = o.notices.find((n) => n.severity === 'warning');
    expect(notice?.text).toContain('5 hours old');
  });

  it('reports live when readings are fresh, carrying the snapshot promise', () => {
    const o = overview({ conditions: makeSnapshot([reading({ cfs: 128, tempC: 18 })]) });
    expect(o.availability.conditions).toBe('live');
    expect(o.availability.nextExpectedUpdate).toBe(makeSnapshot([reading()]).nextExpectedUpdate);
    expect(o.notices).toEqual([]);
  });

  it('flags release schedules only for dam-release waters', () => {
    expect(overview().releases.applicable).toBe(false);
    expect(overview({ stream: makeStream({ waterbodyType: 'tailrace', name: 'South Holston River (tailwater)' }) }).releases.applicable).toBe(true);
    expect(overview({ stream: makeStream({ fishery: 'tailwater' }) }).releases.applicable).toBe(true);
  });

  it('scopes match-the-hatch to trout-opportunity waters', () => {
    expect(overview().actions.matchHatch).toBe(false);
    expect(overview({ stream: makeStream({ targetSpecies: ['rainbow' as never] }) }).actions.matchHatch).toBe(true);
    expect(overview({ stream: makeStream({ stockingProgram: true }) }).actions.matchHatch).toBe(true);
  });

  it('splits catalog identity into name/reach and preserves counties and type label', () => {
    const o = overview({
      stream: makeStream({
        waterbodyType: 'tailrace',
        hydroIdentity: { counties: ['Williamson'], huc8s: ['05130204'] },
      } as Partial<Stream>),
    });
    expect(o.identity.name).toBe('Harpeth River');
    expect(o.identity.reach).toBe('Franklin reach');
    expect(o.identity.typeLabel).toBe('Tailwater');
    expect(o.identity.counties).toEqual(['Williamson']);
  });

  it('carries stocking program, last event, offline state, sources, and the decision view untouched', () => {
    const decision = { unknown: true } as never;
    const last = { date: '2026-09-18', precision: 'week' as const, species: 'rainbow' };
    const o = overview({
      decision,
      offlineSaved: true,
      lastStockingEvent: last,
      sourcesCount: 3,
      stream: makeStream({ stockingProgram: true, yearRound: false }),
    });
    expect(o.assessment).toBe(decision);
    expect(o.stocking).toEqual({ program: true, lastEvent: last });
    expect(o.availability.offlineSaved).toBe(true);
    expect(o.sources.count).toBe(3);
    expect(o.opportunity.yearRound).toBe(false);
  });
});
