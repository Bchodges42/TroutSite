import { describe, expect, it } from 'vitest';
import { stampCurrentAges } from '../src/lib/fishability';
import type { FishabilitySnapshot } from '@trout/contracts';

/**
 * F04 (2026-09-29 audit): a snapshot served from the device cache keeps its
 * generation-time `ageMinutes` forever — a month-old assessed-90 comfort still
 * claimed "observed 30 minutes ago". The data boundary (the fishability hooks)
 * stamps every comfort's freshness with `currentAgeMinutes` — the observation's
 * age NOW, acquired at the boundary so the pure consumers downstream
 * (waterDecision, contracts) never need a clock.
 */

const SNAPSHOT: FishabilitySnapshot = {
  streamId: 'w',
  fetchedAt: '2026-09-29T12:00:00Z',
  pressureContext: {
    direction: 'falling',
    deltaHpa: -2.4,
    station: 'KCSV',
    confidence: 'derived',
    evidenceUrl: 'https://api.weather.gov/stations/KCSV/observations',
    observedAt: '2026-09-29T10:00:00Z',
    label: 'Area pressure falling -2.4 hPa over about 3 hours',
  },
  bySpecies: {
    'largemouth-bass': {
      comfort: {
        species: 'largemouth-bass',
        value: 90,
        reasons: ['Water temperature 24°C is in the optimal range for largemouth bass.'],
        assessed: true,
        freshness: { observedAt: '2026-08-29T10:00:00Z', ageMinutes: 30 },
      },
      activity: { total: 50, components: [] },
    },
    bluegill: {
      comfort: {
        species: 'bluegill',
        value: 0,
        reasons: [],
        assessed: false,
        freshness: null,
      },
      activity: { total: 0, components: [] },
    },
  },
};

describe('stampCurrentAges — F04 cache provenance stamp', () => {
  it('stamps each comfort freshness with the observation age at the injected now', () => {
    const nowMs = Date.parse('2026-09-29T12:00:00Z');
    const stamped = stampCurrentAges(SNAPSHOT, nowMs);
    expect(stamped.bySpecies['largemouth-bass'].comfort.freshness?.currentAgeMinutes).toBe(
      31 * 24 * 60 + 120, // Aug 29 10:00 → Sep 29 12:00 (31 days 2 hours)
    );
    // The generation-time age the payload carried is left untouched.
    expect(stamped.bySpecies['largemouth-bass'].comfort.freshness?.ageMinutes).toBe(30);
    // Unassessed comforts (freshness null) stamp cleanly.
    expect(stamped.bySpecies.bluegill.comfort.freshness).toBeNull();
  });

  it('never mutates the input snapshot', () => {
    const nowMs = Date.parse('2026-09-29T12:00:00Z');
    stampCurrentAges(SNAPSHOT, nowMs);
    expect(SNAPSHOT.bySpecies['largemouth-bass'].comfort.freshness).toEqual({
      observedAt: '2026-08-29T10:00:00Z',
      ageMinutes: 30,
    });
  });

  it('floors partial minutes and clamps clocks that appear to precede the observation', () => {
    const justAfter = stampCurrentAges(SNAPSHOT, Date.parse('2026-08-29T10:00:30.500Z'));
    expect(justAfter.bySpecies['largemouth-bass'].comfort.freshness?.currentAgeMinutes).toBe(0);
    const skewed = stampCurrentAges(SNAPSHOT, Date.parse('2026-08-29T09:00:00Z'));
    expect(skewed.bySpecies['largemouth-bass'].comfort.freshness?.currentAgeMinutes).toBe(0);
  });
});
