import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { WaterEvidenceSchema } from '@trout/contracts';
import { assembleWaterEvidence, regulationsFromFishingInfo } from '../src/evidence/assemble.js';
import type { FishingInfoDocument } from '../src/evidence/assemble.js';
import { runEvidenceJob } from '../src/evidence/evidenceJob.js';
import { makeEnv, fixturesDir, type TestEnv } from './helpers.js';

const fishingDoc: FishingInfoDocument = {
  scope: 'statewide-tn',
  verifiedAt: '2026-09-04',
  disclaimer: 'test',
  sections: [
    {
      id: 'statewide-rules',
      title: 'Statewide',
      items: [
        {
          title: 'Statewide trout limits',
          text: 'Seven per day.',
          authority: 'TWRA',
          sourceUrl: 'https://www.tn.gov/twra/fishing-regs/trout-regulations.html',
        },
      ],
    },
    {
      id: 'special-regulations',
      title: 'Special',
      items: [
        {
          title: 'Clinch PLR',
          text: '14-20 inch protected range.',
          authority: 'TWRA',
          sourceUrl: 'https://www.tn.gov/twra/fishing-regs/trout-regulations.html',
          appliesTo: ['clinch-river'],
        },
      ],
    },
    { id: 'access-safety', title: 'Safety', items: [{ title: 'TVA hazard', text: 'Releases can occur any time.', authority: 'TVA', sourceUrl: 'https://www.tva.com/environment/lake-levels/hazardous-waters' }] },
  ],
};

describe('evidence: assembly rules', () => {

  it('separates statewide rules from water-specific ones and drops non-regulation sections', () => {
    const regs = regulationsFromFishingInfo(fishingDoc);
    expect(regs.statewide).toHaveLength(1);
    expect(regs.byWater.get('clinch-river')).toHaveLength(1);
    expect(regs.byWater.get('other-water')).toBeUndefined();
  });

  it('retrievedAt stays distinct from every observedAt; missing observations stay missing', () => {
    const assembled = assembleWaterEvidence({
      waters: [{ waterId: 'a' }, { waterId: 'b' }],
      retrievedAt: '2026-09-04T12:00:00Z',
      observationsByWater: new Map([
        ['a', [{ sourceId: 'usgs-nwis-iv', sourceUrl: 'https://example.test/', observedAt: '2026-09-04T11:00:00Z', metric: 'discharge-cfs', value: 0 }]],
      ]),
      scheduledByWater: new Map(),
      completeByWater: new Map(),
      statewideRegulations: regulationsFromFishingInfo(fishingDoc).statewide,
      waterRegulations: new Map(),
      errorsByWater: new Map(),
    });
    expect(assembled.invalid).toEqual([]);
    const a = assembled.evidence.find((e) => e.waterId === 'a');
    const b = assembled.evidence.find((e) => e.waterId === 'b');
    // Zero is preserved as a value.
    expect(a?.observations[0]?.value).toBe(0);
    expect(a?.retrievedAt).toBe('2026-09-04T12:00:00Z');
    expect(a?.observations[0]?.observedAt).toBe('2026-09-04T11:00:00Z');
    // Water b has no observations — none are invented.
    expect(b?.observations).toEqual([]);
    expect(b?.regulations.length).toBeGreaterThan(0); // statewide still applies
  });

  it('orders merged observations by PARSED INSTANT across the DST fall-back hour (F34 residue)', () => {
    // 2026-11-01 fall-back: the 1 AM wall-clock hour exists twice. One water
    // merges whole-hour TVA stamps (-05:00/-04:00) with a minute-level USGS
    // Z stamp — text order ranks "T01:00:00-05:00" AFTER "T05:45:00.000Z"
    // even though the USGS instant (05:45Z) is 15 min OLDER than the TVA one
    // (06:00Z). Instant order must win.
    const assembled = assembleWaterEvidence({
      waters: [{ waterId: 'a' }],
      retrievedAt: '2026-11-01T12:00:00Z',
      observationsByWater: new Map([
        [
          'a',
          [
            // Mixed source order on purpose: oldest must sort first anyway.
            { sourceId: 'usgs-nwis-iv', sourceUrl: 'https://example.test/', observedAt: '2026-11-01T05:45:00.000Z', metric: 'discharge-cfs', value: 200 },
            { sourceId: 'tva-restapi', sourceUrl: 'https://example.test/', observedAt: '2026-11-01T01:00:00-05:00', metric: 'temperature-c', value: 12 }, // 06:00Z — newest
            { sourceId: 'tva-restapi', sourceUrl: 'https://example.test/', observedAt: '2026-11-01T01:00:00-04:00', metric: 'stage-ft', value: 3 }, // 05:00Z — oldest
          ],
        ],
      ]),
      scheduledByWater: new Map(),
      completeByWater: new Map(),
      statewideRegulations: regulationsFromFishingInfo(fishingDoc).statewide,
      waterRegulations: new Map(),
      errorsByWater: new Map(),
    });
    expect(assembled.invalid).toEqual([]);
    const a = assembled.evidence.find((e) => e.waterId === 'a');
    expect(a?.observations.map((o) => o.metric)).toEqual(['stage-ft', 'discharge-cfs', 'temperature-c']);
  });
});

describe('evidence: job end-to-end (injected fetch, temp DB)', () => {
  let env: TestEnv;

  beforeEach(() => {
    env = makeEnv();
  });

  afterEach(() => {
    env.db.close();
    rmSync(env.dir, { recursive: true, force: true });
  });

  const USGS_OK = {
    value: {
      timeSeries: [
        {
          sourceInfo: { siteCode: [{ value: '03486000' }] },
          variable: { variableCode: [{ value: '00060' }] },
          values: [{ value: [{ value: '312', dateTime: '2026-09-04T07:00:00.000-04:00', qualifiers: ['P'] }] }],
        },
        {
          sourceInfo: { siteCode: [{ value: '03486000' }] },
          variable: { variableCode: [{ value: '00010' }] },
          values: [{ value: [{ value: '17.4', dateTime: '2026-09-04T07:00:00.000-04:00', qualifiers: ['P'] }] }],
        },
      ],
    },
  };

  function tvBody(url: string): string {
    if (url.includes('/observed-data/')) return JSON.stringify([{ Day: '09/04/2026', Time: '2 PM EDT', ReservoirElevation: '1,950.53', TailwaterElevation: '1,648.97', AverageHourlyDischarge: '1,390' }]);
    return '[]';
  }

  function twraPage(): string {
    return "<html><div data-config='{&#34;ajax&#34;:&#34;/twra/fishing/trout-information-stockings/_jcr_content/tn_complex_datatable_1.exceldriven.json&#34;}'></div></html>";
  }

  function twraBody(): string {
    return JSON.stringify({ data: [{ REGION: '1', COUNTY: 'Carter', LOCATION: 'Wilbur Tailwater / Watauga River', TYPE: 'Winter', 'STOCKING DAY': '3/14/2027', 'STOCKING WEEK': '', 'STOCKING MONTHS': '', SPECIES: 'Rainbow Trout' }] });
  }

  function hijackedFetch(opts: { failUSGS?: boolean; failTVA?: boolean; failTWRA?: boolean }): typeof fetch {
    return (async (input: Parameters<typeof fetch>[0]): Promise<Response> => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('waterservices.usgs.gov')) {
        if (opts.failUSGS) return new Response('nope', { status: 503 });
        return new Response(JSON.stringify(USGS_OK), { status: 200 });
      }
      if (url.includes('tva.com')) {
        if (opts.failTVA) return new Response('cloudflare', { status: 403 });
        return new Response(tvBody(url), { status: 200 });
      }
      if (url.includes('tn.gov')) {
        if (opts.failTWRA) return new Response('nope', { status: 500 });
        // First fetch is the page; the adapter re-resolves the datatable JSON path
        // from the data-config attribute and fetches it separately.
        if (url.endsWith('.json')) return new Response(twraBody(), { status: 200 });
        return new Response(twraPage(), { status: 200 });
      }
      return new Response('[]', { status: 200 });
    }) as typeof fetch;
  }

  function jobCfg() {
    return {
      contentPackDir: join(fixturesDir(), 'content-pack-stub'),
      rawDir: env.rawDir,
      userAgent: 'trout-test/0.0',
    };
  }

  it('assembles observations, alias-mapped stocking rows and regulations into valid evidence', async () => {
    // A minimal fishing.json pack stub so regulations exist.
    const packDir = jobCfg().contentPackDir;
    mkdtempSync(packDir.slice(0, packDir.lastIndexOf('pack')));
    rmSync(packDir, { recursive: true, force: true });
    const { mkdirSync, writeFileSync } = await import('node:fs');
    mkdirSync(packDir, { recursive: true });
    writeFileSync(join(packDir, 'fishing.json'), JSON.stringify({ fishing: fishingDoc }));

    const result = await runEvidenceJob(env.db, jobCfg(), {
      now: new Date('2026-09-04T12:00:00Z'),
      fetchImpl: hijackedFetch({}),
      providers: { tva: false }, // seeded catalog has no TVA monitors on test waters
    });
    expect(result.waters).toBe(2);
    expect(result.observations).toBe(2); // flow + temp for 03486000 (watauga-river)

    const row = env.db.prepare('SELECT payload FROM evidence_runs ORDER BY id DESC LIMIT 1').get() as { payload: string };
    const set = JSON.parse(row.payload) as { waterId: string; observations: { metric: string; observedAt: string; value: number; qualifier?: string }[]; stockingEvents: { status: string; date: string; datePrecision: string }[]; regulations: unknown[] }[];
    const watauga = set.find((e) => e.waterId === 'watauga-river');
    expect(watauga?.observations).toHaveLength(2);
    expect(watauga?.observations[0]?.qualifier).toBe('P');
    // The Wilbur Tailwater alias resolved the TWRA row onto watauga-river, scheduled status.
    expect(watauga?.stockingEvents).toHaveLength(1);
    expect(watauga?.stockingEvents[0]?.status).toBe('scheduled');
    expect(watauga?.stockingEvents[0]?.datePrecision).toBe('day');
    expect(watauga?.regulations.length).toBeGreaterThan(0);
    // The other seeded water has no observations and no stocking — and that's what it shows.
    const other = set.find((e) => e.waterId === 'test-tailrace-b');
    expect(other?.observations).toEqual([]);
    expect(other?.stockingEvents).toEqual([]);
    // Raw TWRA artifacts captured for the audit trail.
    expect(existsSync(join(env.rawDir, 'evidence'))).toBe(true);
    rmSync(packDir, { recursive: true, force: true });
  });

  it('turns upstream failures into per-source error entries (never empty success)', async () => {
    const result = await runEvidenceJob(env.db, jobCfg(), {
      now: new Date('2026-09-04T12:00:00Z'),
      fetchImpl: hijackedFetch({ failUSGS: true, failTWRA: true }),
      providers: { tva: false },
    });
    expect(result.errors).toBeGreaterThan(0);
    const row = env.db.prepare('SELECT payload FROM evidence_runs ORDER BY id DESC LIMIT 1').get() as { payload: string };
    const set = JSON.parse(row.payload) as { waterId: string; errors: { sourceId: string; code: string }[] }[];
    const watauga = set.find((e) => e.waterId === 'watauga-river');
    const codes = watauga?.errors.map((e) => e.code) ?? [];
    expect(codes).toContain('upstream-http-503'); // USGS
    expect(codes).toContain('upstream-http-500'); // TWRA
  });

  it('records a complete observation-source failure as a FAILED run and carries last-good observations forward (F33)', async () => {
    const packDir = jobCfg().contentPackDir;
    const { mkdirSync, writeFileSync } = await import('node:fs');
    mkdirSync(packDir, { recursive: true });
    writeFileSync(join(packDir, 'fishing.json'), JSON.stringify({ fishing: fishingDoc }));
    try {
      // Run 1 is healthy: watauga-river gets two fresh USGS observations.
      const first = await runEvidenceJob(env.db, jobCfg(), {
        now: new Date('2026-09-04T12:00:00Z'),
        fetchImpl: hijackedFetch({}),
        providers: { tva: false },
      });
      expect(first.outcome).toBe('ok');

      // Run 2: the only enabled observation source fails. The run must be
      // recorded as jobs_log 'error' — never a healthy ok — and the newest
      // public payload must keep run 1's observations with provenance
      // instead of replacing them with an empty list.
      const second = await runEvidenceJob(env.db, jobCfg(), {
        now: new Date('2026-09-04T14:00:00Z'),
        fetchImpl: hijackedFetch({ failUSGS: true }),
        providers: { tva: false },
      });
      expect(second.outcome).toBe('failed');
      expect(second.lastGoodWaters).toBe(1);
      const statusRow = env.db
        .prepare("SELECT status FROM jobs_log WHERE job = 'evidence' ORDER BY id DESC LIMIT 1")
        .get() as { status: string };
      expect(statusRow.status).toBe('error');

      const row = env.db.prepare('SELECT payload FROM evidence_runs ORDER BY id DESC LIMIT 1').get() as { payload: string };
      const set = JSON.parse(row.payload) as {
        waterId: string;
        observations: { observedAt: string; value: number }[];
        errors: { code: string; message: string }[];
      }[];
      const watauga = set.find((e) => e.waterId === 'watauga-river');
      expect(watauga?.observations).toHaveLength(2); // carried forward, not blanked
      expect(watauga?.observations[0]?.observedAt).toBe('2026-09-04T07:00:00.000-04:00');
      const carry = watauga?.errors.find((e) => e.code === 'stale-last-good');
      expect(carry?.message).toMatch(/carried forward from the 2026-09-04T12:00:00\.000Z run \(~2h old/);
      expect(carry?.message).toMatch(/refresh error: /);
      // The other water had no prior observations — none are invented.
      const other = set.find((e) => e.waterId === 'test-tailrace-b');
      expect(other?.observations).toEqual([]);
      expect(other?.errors.some((e) => e.code === 'stale-last-good')).toBe(false);
    } finally {
      rmSync(packDir, { recursive: true, force: true });
    }
  });

  it('keeps a partial source failure a soft-failed ok run with outcome degraded (F33)', async () => {
    const packDir = jobCfg().contentPackDir;
    const { mkdirSync, writeFileSync } = await import('node:fs');
    mkdirSync(packDir, { recursive: true });
    writeFileSync(join(packDir, 'fishing.json'), JSON.stringify({ fishing: fishingDoc }));
    try {
      const result = await runEvidenceJob(env.db, jobCfg(), {
        now: new Date('2026-09-04T12:00:00Z'),
        fetchImpl: hijackedFetch({ failTWRA: true }), // stocking source fails, observations succeed
        providers: { tva: false },
      });
      expect(result.outcome).toBe('degraded');
      expect(result.observations).toBe(2);
      const statusRow = env.db
        .prepare("SELECT status FROM jobs_log WHERE job = 'evidence' ORDER BY id DESC LIMIT 1")
        .get() as { status: string };
      expect(statusRow.status).toBe('ok');
    } finally {
      rmSync(packDir, { recursive: true, force: true });
    }
  });

  it('records partial-response behavior: a TVA 403 on one monitor only errors that water', async () => {
    const { mkdirSync, writeFileSync } = await import('node:fs');
    const packDir = jobCfg().contentPackDir;
    mkdirSync(packDir, { recursive: true });
    writeFileSync(join(packDir, 'fishing.json'), JSON.stringify({ fishing: fishingDoc }));
    // Wire the seeded watauga-river to a TVA monitor, then 403 it.
    env.db.prepare("UPDATE streams SET gauge_ids = '[]' WHERE id = 'watauga-river'").run();
    const { TVA_MONITORS } = await import('../src/evidence/monitors.js');
    (TVA_MONITORS as Record<string, { locationId: string; role: string }>)['watauga-river'] = { locationId: 'WL', role: 'tailwater' };
    try {
      const result = await runEvidenceJob(env.db, jobCfg(), {
        now: new Date('2026-09-04T12:00:00Z'),
        fetchImpl: hijackedFetch({ failTVA: true }),
        providers: { usgs: false, twra: false },
      });
      const row = env.db.prepare('SELECT payload FROM evidence_runs ORDER BY id DESC LIMIT 1').get() as { payload: string };
      const set = JSON.parse(row.payload) as { waterId: string; errors: { sourceId: string }[] }[];
      const watauga = set.find((e) => e.waterId === 'watauga-river');
      expect(watauga?.errors.some((e) => e.sourceId === 'tva-restapi')).toBe(true);
      const other = set.find((e) => e.waterId === 'test-tailrace-b');
      expect(other?.errors ?? []).toEqual([]); // the failure did not leak to other waters
      expect(result.warnings.some((w) => w.includes('TVA WL failed'))).toBe(true);
    } finally {
      delete (TVA_MONITORS as Record<string, unknown>)['watauga-river'];
      rmSync(packDir, { recursive: true, force: true });
    }
  });

  it('the stored payload round-trips through the contract schema', async () => {
    const { mkdirSync, writeFileSync } = await import('node:fs');
    const packDir = jobCfg().contentPackDir;
    mkdirSync(packDir, { recursive: true });
    writeFileSync(join(packDir, 'fishing.json'), JSON.stringify({ fishing: fishingDoc }));
    await runEvidenceJob(env.db, jobCfg(), {
      now: new Date('2026-09-04T12:00:00Z'),
      fetchImpl: hijackedFetch({}),
      providers: { tva: false },
    });
    const row = env.db.prepare('SELECT payload FROM evidence_runs ORDER BY id DESC LIMIT 1').get() as { payload: string };
    const parsed = WaterEvidenceSchema.safeParse(JSON.parse(row.payload)[0]);
    expect(parsed.success).toBe(true);
    rmSync(packDir, { recursive: true, force: true });
  });
});
