import { readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseFlowNormals, runFlowHistoryJob } from '../src/evidence/flow-history.js';
import { makeEnv } from './helpers.js';

const captured = () => JSON.parse(readFileSync(resolve(import.meta.dirname, '../fixtures/USGS-STATISTICS/03538830-monthly-2026-10-14.json'), 'utf8'));
const now = new Date('2026-10-15T00:30:00Z');

describe('historical flow stays separate from live conditions', () => {
  it('parses all twelve approved months from a real USGS response', () => {
    const rows = parseFlowNormals(captured(), ['03538830'], now.toISOString());
    expect(rows).toHaveLength(12);
    expect(rows[0]).toMatchObject({ gaugeId: '03538830', month: 1, p25: 152.75, median: 204.5, p75: 293.25 });
  });
  it('withholds nan/empty/null percentiles and ignores wrong parameters, units, approvals and sites', () => {
    const d = captured();
    const values = d.features[0].properties.data[0].values;
    values[0].values[2] = 'nan'; values[1].values[2] = ''; values[2].values[2] = null;
    values[3].approval_status = 'provisional'; values[4].time_of_year_type = 'day_of_year';
    expect(parseFlowNormals(d, ['03538830'], now.toISOString())).toHaveLength(7);
    expect(parseFlowNormals(d, ['99999999'], now.toISOString())).toEqual([]);
    d.features[0].properties.data[0].unit_of_measure = 'cms';
    expect(parseFlowNormals(d, ['03538830'], now.toISOString())).toEqual([]);
  });
  it('stores complete historical results without manufacturing live readings and preserves them on failure', async () => {
    const env = makeEnv();
    try {
      env.db.prepare('UPDATE streams SET gauge_ids = ?').run('["03538830"]');
      const fetchImpl = (async () => Response.json(captured())) as typeof fetch;
      const result = await runFlowHistoryJob(env.db, { userAgent: 'test', now, force: true, fetchImpl });
      expect(result.items).toBe(12);
      expect(env.db.prepare('SELECT COUNT(*) n FROM gauge_readings_raw').get()).toEqual({ n: 0 });
      await expect(runFlowHistoryJob(env.db, { userAgent: 'test', now, force: true,
        fetchImpl: (async () => new Response('', { status: 503 })) as typeof fetch })).rejects.toThrow(/503/);
      expect(env.db.prepare('SELECT COUNT(*) n FROM flow_normals').get()).toEqual({ n: 12 });
    } finally { env.db.close(); rmSync(env.dir, { recursive: true, force: true }); }
  });
  it('refuses a cross-origin continuation before forwarding credentials or writing partial data', async () => {
    const env = makeEnv(); let calls = 0;
    try {
      env.db.prepare('UPDATE streams SET gauge_ids = ?').run('["03538830"]');
      const fetchImpl = (async () => { calls++; return Response.json({ ...captured(), next: 'https://example.com/leak' }); }) as typeof fetch;
      await expect(runFlowHistoryJob(env.db, { userAgent: 'test', apiKey: 'fake-test-key', now, force: true, fetchImpl })).rejects.toThrow(/pagination/);
      expect(calls).toBe(1);
      expect(env.db.prepare('SELECT COUNT(*) n FROM flow_normals').get()).toEqual({ n: 0 });
    } finally { env.db.close(); rmSync(env.dir, { recursive: true, force: true }); }
  });
});
