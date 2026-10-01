import { describe, expect, it } from 'vitest';
import {
  DIGEST_THRESHOLD,
  bundleNotices,
  evaluateRules,
  inQuietHours,
  normalizeWaterName,
  waterLocalHHMM,
  type EvidenceView,
  type Notice,
} from '../src/push/evaluate.js';
import type { WatchRuleRow } from '../src/push/service.js';

/**
 * ALERTS lane — the PURE evaluation matrix (ADR 0016 §5). No clock, no I/O:
 * every decision is a function of (rule, evidence, now). The matrix pins the
 * honest-outage posture: a condition rule with no or stale evidence NEVER
 * fires, a hysteresis transition must cross the full dead band both ways,
 * cooldown and water-local quiet hours block, and a notice storm collapses
 * into one digest.
 */

const NOW = Date.parse('2026-09-30T15:00:00Z'); // 10:00 America/Chicago (CDT)
const FRESH = NOW - 5 * 60_000; // observed 5 minutes ago
const STALE = NOW - 4 * 3_600_000; // observed 4 hours ago (> 180 min horizon)

let nextId = 1;
function rule(overrides: Partial<WatchRuleRow> = {}): WatchRuleRow {
  return {
    id: nextId++,
    subscription_id: 'subAAAAAAAAAAAAAAAAAAAAA',
    water_id: 'watauga-river',
    kind: 'condition',
    metric: 'tempC',
    threshold_op: 'above',
    threshold: 20,
    arm_state: null,
    cooldown_minutes: 240,
    quiet_hours_start: null,
    quiet_hours_end: null,
    hysteresis: 1,
    created_at: new Date(NOW - 7 * 86_400_000).toISOString(),
    last_notified_at: null,
    ...overrides,
  };
}

function evidence(
  condition: { value: number; observedAt: number } | null,
  stocking: { date: string } | null = null,
  report: { date: string; publishedAt: string } | null = null,
): EvidenceView {
  return {
    condition: () => condition,
    stocking: () => stocking,
    report: () => report,
  };
}

function one(decisions: ReturnType<typeof evaluateRules>) {
  expect(decisions).toHaveLength(1);
  return decisions[0]!;
}

describe('condition rules — transition + hysteresis, both directions', () => {
  it('arms on the first decisive reading WITHOUT firing (no baseline, no deploy-time storm)', () => {
    const d = one(
      evaluateRules([rule()], evidence({ value: 21.5, observedAt: FRESH }), { now: NOW }),
    );
    expect(d.fired).toBe(false);
    expect(d.reason).toBe('armed');
    expect(d.armState).toBe('above');
  });

  it('fires crossed-above only after the FULL dead band (20+1), both directions', () => {
    const armed = rule({ arm_state: 'below' });
    // Inside the band (20.5 ≤ 21) → waiting, no fire, arm holds.
    const inside = one(
      evaluateRules([armed], evidence({ value: 20.5, observedAt: FRESH }), { now: NOW }),
    );
    expect(inside.fired).toBe(false);
    expect(inside.reason).toBe('waiting-dead-band');
    expect(inside.armState).toBe('below');
    // Just inside the upper edge (exactly threshold + hysteresis is NOT decisive).
    const edge = one(
      evaluateRules([armed], evidence({ value: 21, observedAt: FRESH }), { now: NOW }),
    );
    expect(edge.fired).toBe(false);
    expect(edge.reason).toBe('waiting-dead-band');
    // Beyond the band → crossed-above fires.
    const crossed = one(
      evaluateRules([armed], evidence({ value: 21.1, observedAt: FRESH }), { now: NOW }),
    );
    expect(crossed.fired).toBe(true);
    expect(crossed.reason).toBe('crossed-above');
    expect(crossed.armState).toBe('above');
  });

  it('fires crossed-below symmetrically (hysteresis satisfied the other way)', () => {
    const armed = rule({ arm_state: 'above' });
    const notYet = one(
      evaluateRules([armed], evidence({ value: 19.2, observedAt: FRESH }), { now: NOW }),
    );
    expect(notYet.fired).toBe(false);
    expect(notYet.reason).toBe('waiting-dead-band');
    const crossed = one(
      evaluateRules([armed], evidence({ value: 18.9, observedAt: FRESH }), { now: NOW }),
    );
    expect(crossed.fired).toBe(true);
    expect(crossed.reason).toBe('crossed-below');
    expect(crossed.armState).toBe('below');
  });

  it('stays silent when the reading sits on the already-armed side (no repeats)', () => {
    const d = one(
      evaluateRules(
        [rule({ arm_state: 'above' })],
        evidence({ value: 24, observedAt: FRESH }),
        { now: NOW },
      ),
    );
    expect(d.fired).toBe(false);
    expect(d.reason).toBe('no-change');
  });

  it('runs the full cycle: below-armed → above → back below → above again', () => {
    let r = rule({ arm_state: 'below' });
    const step = (value: number) => {
      const d = one(evaluateRules([r], evidence({ value, observedAt: FRESH }), { now: NOW }));
      if (d.armState !== undefined && d.armState !== null) r = { ...r, arm_state: d.armState };
      return d;
    };
    expect(step(21.5).reason).toBe('crossed-above');
    expect(step(24).reason).toBe('no-change');
    expect(step(18.5).reason).toBe('crossed-below');
    expect(step(15).reason).toBe('no-change');
    expect(step(21.5).reason).toBe('crossed-above');
  });
});

describe('condition rules — evidence freshness (source-outage suppression)', () => {
  it('never fires on a stale reading (4 h old > 180 min freshness window)', () => {
    const d = one(
      evaluateRules(
        [rule({ arm_state: 'below' })],
        evidence({ value: 30, observedAt: STALE }),
        { now: NOW },
      ),
    );
    expect(d.fired).toBe(false);
    expect(d.reason).toBe('stale-evidence');
  });

  it('never fires when there is no reading at all (outage notices are NOT in v1)', () => {
    const d = one(evaluateRules([rule({ arm_state: 'below' })], evidence(null), { now: NOW }));
    expect(d.fired).toBe(false);
    expect(d.reason).toBe('no-evidence');
  });
});

describe('cooldown + quiet hours', () => {
  it('blocks a crossed rule inside the cooldown window (and fires after it)', () => {
    const cooling = rule({ arm_state: 'below', last_notified_at: new Date(NOW - 60 * 60_000).toISOString() });
    const blocked = one(
      evaluateRules([cooling], evidence({ value: 25, observedAt: FRESH }), { now: NOW }),
    );
    expect(blocked.fired).toBe(false);
    expect(blocked.reason).toBe('cooldown');
    // Cooldown elapsed (5 h > 240 min) → the same evidence fires.
    const cooled = rule({
      arm_state: 'below',
      last_notified_at: new Date(NOW - 5 * 3_600_000).toISOString(),
    });
    const fired = one(evaluateRules([cooled], evidence({ value: 25, observedAt: FRESH }), { now: NOW }));
    expect(fired.fired).toBe(true);
  });

  it('blocks during water-local quiet hours (America/Chicago, tested via the injected clock)', () => {
    const quiet = rule({ quiet_hours_start: '21:00', quiet_hours_end: '07:00', arm_state: 'below' });
    const d = one(
      evaluateRules([quiet], evidence({ value: 25, observedAt: FRESH }), {
        now: NOW,
        localHHMM: () => '22:30',
      }),
    );
    expect(d.fired).toBe(false);
    expect(d.reason).toBe('quiet-hours');
    // Same instant, no quiet window → fires.
    const loud = one(
      evaluateRules([rule({ arm_state: 'below' })], evidence({ value: 25, observedAt: FRESH }), { now: NOW }),
    );
    expect(loud.fired).toBe(true);
  });

  it('handles quiet windows that wrap midnight', () => {
    expect(inQuietHours('23:00', '21:00', '07:00')).toBe(true);
    expect(inQuietHours('03:00', '21:00', '07:00')).toBe(true);
    expect(inQuietHours('12:00', '21:00', '07:00')).toBe(false);
    // start === end degenerate window: the only safe reading is all-day quiet.
    expect(inQuietHours('12:00', '09:00', '09:00')).toBe(true);
  });

  it('derives the water-local wall clock from America/Chicago (TN statewide)', () => {
    // 15:00Z in September = 10:00 CDT.
    expect(waterLocalHHMM(NOW)).toBe('10:00');
    // 07:00Z = 02:00 CDT.
    expect(waterLocalHHMM(Date.parse('2026-09-30T07:00:00Z'))).toBe('02:00');
  });
});

describe('feed rules — stocking + report', () => {
  it('fires new-stocking-event when the newest event postdates the rule', () => {
    const r = rule({
      kind: 'stocking',
      metric: null,
      threshold_op: null,
      threshold: null,
      created_at: new Date(NOW - 7 * 86_400_000).toISOString(),
    });
    const d = one(
      evaluateRules([r], evidence({ value: 15, observedAt: FRESH }, { date: '2026-09-28' }), { now: NOW }),
    );
    expect(d.fired).toBe(true);
    expect(d.reason).toBe('new-stocking-event');
    expect(d.feedDate).toBe('2026-09-28');
  });

  it('stays silent when the newest stocking predates the rule (no re-announce of old rows)', () => {
    const r = rule({
      kind: 'stocking',
      metric: null,
      threshold_op: null,
      threshold: null,
      created_at: new Date(NOW - 3 * 86_400_000).toISOString(),
    });
    const d = one(
      evaluateRules([r], evidence({ value: 15, observedAt: FRESH }, { date: '2026-09-25' }), { now: NOW }),
    );
    expect(d.fired).toBe(false);
    expect(d.reason).toBe('no-new-feed-item');
  });

  it('uses the report publish instant as the freshness bound for report rules', () => {
    const r = rule({
      kind: 'report',
      metric: null,
      threshold_op: null,
      threshold: null,
      last_notified_at: new Date(NOW - 2 * 86_400_000).toISOString(),
    });
    const old = one(
      evaluateRules(
        [r],
        evidence(
          null,
          null,
          { date: '2026-09-27', publishedAt: new Date(NOW - 3 * 86_400_000).toISOString() },
        ),
        { now: NOW },
      ),
    );
    expect(old.fired).toBe(false);
    const fresh = one(
      evaluateRules(
        [r],
        evidence(
          null,
          null,
          { date: '2026-09-29', publishedAt: new Date(NOW - 1 * 3_600_000).toISOString() },
        ),
        { now: NOW },
      ),
    );
    expect(fresh.fired).toBe(true);
    expect(fresh.reason).toBe('new-report');
  });
});

describe('digest bundling', () => {
  const notice = (ruleId: number, subscriptionId = 'subAAAAAAAAAAAAAAAAAAAAA'): Notice => ({
    subscriptionId,
    ruleId,
    waterId: 'watauga-river',
    kind: 'condition',
    title: `Water ${ruleId}`,
    body: 'crossed',
    url: '/conditions/watauga-river',
  });

  it('collapses >3 notices for one subscription into ONE digest payload', () => {
    const plan = bundleNotices([notice(1), notice(2), notice(3), notice(4)]);
    expect(plan.singles).toHaveLength(0);
    expect(plan.digests).toHaveLength(1);
    expect(plan.digests[0]!.notices).toHaveLength(4);
    expect(plan.digests[0]!.subscriptionId).toBe('subAAAAAAAAAAAAAAAAAAAAA');
  });

  it('keeps groups at or under the threshold as individual notices', () => {
    const plan = bundleNotices([notice(1), notice(2), notice(3)]);
    expect(plan.singles).toHaveLength(3);
    expect(plan.digests).toHaveLength(0);
  });

  it('bundles per subscription, never across subscriptions', () => {
    const plan = bundleNotices([
      notice(1, 'subAAAAAAAAAAAAAAAAAAAAA'),
      notice(2, 'subAAAAAAAAAAAAAAAAAAAAA'),
      notice(3, 'subBBBBBBBBBBBBBBBBBBBBB'),
      notice(4, 'subBBBBBBBBBBBBBBBBBBBBB'),
    ]);
    expect(plan.singles).toHaveLength(4);
    expect(plan.digests).toHaveLength(0);
    expect(DIGEST_THRESHOLD).toBe(3);
  });
});

describe('stocking name normalization', () => {
  it('matches TWRA spellings to catalog names conservatively', () => {
    expect(normalizeWaterName('Watauga River (Tailwater)')).toBe(
      normalizeWaterName('watauga  river tailwater'),
    );
    expect(normalizeWaterName('  South  Fork-Fork ')).toBe('south fork fork');
  });
});
