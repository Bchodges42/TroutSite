import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { WaterEvidenceSetSchema } from '@trout/contracts';
import { buildSnapshots } from '../src/snapshots/build.js';
import { runEvidenceJob } from '../src/evidence/evidenceJob.js';
import { makeEnv, fixturesDir, type TestEnv } from './helpers.js';

const NOW = new Date('2026-09-04T12:00:00Z');

/** Minimal fishing.json pack stub (a real build emits this from packages/content). */
const fishingPack = {
  fishing: {
    scope: 'statewide-tn',
    verifiedAt: '2026-09-04',
    disclaimer: 'Informational only.',
    sections: [
      {
        id: 'statewide-rules',
        title: 'Statewide',
        items: [
          {
            title: 'Statewide trout limits',
            text: 'Seven per day, any combination.',
            authority: 'TWRA',
            sourceUrl: 'https://www.tn.gov/twra/fishing-regs/trout-regulations.html',
          },
        ],
      },
    ],
  },
};

function hijackedFetch(): typeof fetch {
  const usgs = {
    value: {
      timeSeries: [
        {
          sourceInfo: { siteCode: [{ value: '03486000' }] },
          variable: { variableCode: [{ value: '00060' }] },
          values: [{ value: [{ value: '0', dateTime: '2026-09-04T07:00:00.000-04:00', qualifiers: ['P'] }] }],
        },
      ],
    },
  };
  const page =
    "<html><div data-config='{&#34;ajax&#34;:&#34;/twra/x/tn_complex_datatable_1.exceldriven.json&#34;}'></div></html>";
  return (async (input: Parameters<typeof fetch>[0]): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url.includes('waterservices.usgs.gov')) return new Response(JSON.stringify(usgs), { status: 200 });
    if (url.endsWith('.json')) {
      return new Response(
        JSON.stringify({
          data: [
            {
              REGION: '1', COUNTY: 'Carter', LOCATION: 'Wilbur Tailwater / Watauga River', TYPE: 'Winter',
              'STOCKING DAY': '1/14/2026', 'STOCKING WEEK': '', 'STOCKING MONTHS': '', SPECIES: 'Rainbow Trout',
            },
          ],
        }),
        { status: 200 },
      );
    }
    if (url.includes('tn.gov')) return new Response(page, { status: 200 });
    return new Response('[]', { status: 200 });
  }) as typeof fetch;
}

describe('buildSnapshots: evidence + fishing emission (additive, backward compatible)', () => {
  let env: TestEnv;
  let packDir: string;

  beforeEach(() => {
    env = makeEnv();
    packDir = join(env.dir, 'pack');
    mkdirSync(packDir, { recursive: true });
    // The content-pack branch gates on bugs.json; the stub satisfies it.
    writeFileSync(join(packDir, 'bugs.json'), JSON.stringify({ taxa: [] }));
    writeFileSync(join(packDir, 'patterns.json'), JSON.stringify({ patterns: [] }));
    mkdirSync(join(packDir, 'hatch'), { recursive: true });
    writeFileSync(join(packDir, 'fishing.json'), JSON.stringify(fishingPack));
  });

  afterEach(() => {
    env.db.close();
    rmSync(env.dir, { recursive: true, force: true });
  });

  it('emits /v1/evidence/waters.json only after the evidence job has run', async () => {
    const before = buildSnapshots({ db: env.db, snapshotsDir: env.snapshotsDir, contentPackDir: packDir, now: NOW });
    expect(before.evidenceWaters).toBeNull();
    expect(existsSync(join(env.snapshotsDir, 'v1', 'evidence', 'waters.json'))).toBe(false);
    expect(before.warnings.some((w) => w.includes('no evidence_runs yet'))).toBe(true);
    // Existing endpoints are untouched by evidence being absent.
    expect(before.streams).toBe(2);
    expect(before.conditions).toBe(2);

    await runEvidenceJob(env.db, { contentPackDir: packDir, rawDir: env.rawDir, userAgent: 'test' }, {
      now: NOW,
      fetchImpl: hijackedFetch(),
      providers: { tva: false },
    });
    const after = buildSnapshots({ db: env.db, snapshotsDir: env.snapshotsDir, contentPackDir: packDir, now: NOW });
    expect(after.evidenceWaters).toBe(2);
    const payload = JSON.parse(readFileSync(join(env.snapshotsDir, 'v1', 'evidence', 'waters.json'), 'utf8')) as unknown[];
    const parsed = WaterEvidenceSetSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
    const watauga = payload.find((e) => (e as { waterId: string }).waterId === 'watauga-river') as {
      observations: { value: number; metric: string }[];
      stockingEvents: { status: string }[];
    };
    // Zero discharge preserved end-to-end (the fixture publishes 0 cfs).
    expect(watauga.observations[0]?.value).toBe(0);
    expect(watauga.observations[0]?.metric).toBe('discharge-cfs');
    expect(watauga.stockingEvents[0]?.status).toBe('scheduled');
  });

  it('emits /content/fishing.json from the pack and warns when the pack lacks it', () => {
    const withPack = buildSnapshots({ db: env.db, snapshotsDir: env.snapshotsDir, contentPackDir: packDir, now: NOW });
    expect(withPack.files.some((f) => f.endsWith(join('content', 'fishing.json')))).toBe(true);
    const served = JSON.parse(readFileSync(join(env.snapshotsDir, 'content', 'fishing.json'), 'utf8')) as {
      scope: string;
      sections: { items: { sourceUrl: string }[] }[];
    };
    expect(served.scope).toBe('statewide-tn');
    expect(served.sections[0]?.items[0]?.sourceUrl).toContain('tn.gov');

    rmSync(join(env.snapshotsDir, 'content', 'fishing.json'));
    // A pack without fishing.json (everything else present) warns specifically.
    const noPack = join(env.dir, 'pack-no-fishing');
    mkdirSync(join(noPack, 'hatch'), { recursive: true });
    writeFileSync(join(noPack, 'bugs.json'), JSON.stringify({ taxa: [] }));
    writeFileSync(join(noPack, 'patterns.json'), JSON.stringify({ patterns: [] }));
    const without = buildSnapshots({ db: env.db, snapshotsDir: env.snapshotsDir, contentPackDir: noPack, now: NOW });
    expect(without.warnings.some((w) => w.includes('no fishing.json'))).toBe(true);
  });
});
