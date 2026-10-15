import { rmSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { StockingEventSchema } from '@trout/contracts';
import { runStockingJob } from '../src/ingest/stockingJob.js';
import { normalizeTwra, scheduleMonthDate, TWRA_PAGE_URL } from '../src/ingest/stocking/tn.js';
import type { RawFetch } from '../src/ingest/stocking/types.js';
import { makeEnv, readFixture, type TestEnv } from './helpers.js';

/**
 * Stocking data integrity (audit 2026-10-14 §2), pinned to the verbatim TWRA
 * page + both datatable grids captured live on 2026-10-14.
 */
const NOW = new Date('2026-10-14T15:00:00Z');
const PAGE = readFixture('TN/2026-10-14-stockings-page.html');
const SCHEDULE = readFixture('TN/2026-10-14-schedule.exceldriven.json');
const REPORT = readFixture('TN/2026-10-14-recent.exceldriven.json');
const SCHEDULE_ROWS = (JSON.parse(SCHEDULE) as { data: unknown[] }).data.length; // 616
// 74 rows, 70 distinct: TWRA lists repeat loads (same water, same day) as identical rows.
const REPORT_ROWS = new Set((JSON.parse(REPORT) as { data: unknown[] }).data.map((r) => JSON.stringify(r))).size;

function liveRaw(): RawFetch {
  return {
    artifacts: [
      { suffix: 'html', content: PAGE, url: TWRA_PAGE_URL },
      { suffix: 'exceldriven.json', content: SCHEDULE, url: TWRA_PAGE_URL },
      { suffix: 'report.exceldriven.json', content: REPORT, url: TWRA_PAGE_URL },
    ],
    fetchedAt: NOW.toISOString(),
  };
}

/** Serves the page and both grids; the schedule grid is the 1990410459 datatable. */
function twraFetch(opts: { schedule?: string; report?: string | null } = {}): typeof fetch {
  return (async (input: Parameters<typeof fetch>[0]) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url === TWRA_PAGE_URL) return new Response(PAGE, { status: 200 });
    if (url.includes('1990410459')) return new Response(opts.schedule ?? SCHEDULE, { status: 200 });
    if (url.includes('.exceldriven.json')) {
      return opts.report === null ? new Response('gone', { status: 404 }) : new Response(opts.report ?? REPORT, { status: 200 });
    }
    return new Response('unexpected', { status: 404 });
  }) as typeof fetch;
}

describe('TWRA normalize — live 2026-10-14 page', () => {
  const result = normalizeTwra(liveRaw(), { now: NOW });
  const scheduled = result.events.filter((e) => e.status === 'scheduled');
  const reported = result.events.filter((e) => e.status === 'reported');

  it('never invents a date outside the "2026 Trout Stocking Schedule" (was 23 events in 2027)', () => {
    expect(result.events.filter((e) => e.date >= '2027-01-01')).toEqual([]);
    for (const e of result.events) expect(StockingEventSchema.safeParse(e).success).toBe(true);
  });

  it('month windows resolve to the current/next listed month inside the schedule year', () => {
    const at = (name: string) => [...new Set(scheduled.filter((e) => e.streamName.startsWith(name)).map((e) => e.date))];
    // "J, F, M, A, M, J, J, A, S, O, N, D" read in October → the October window, not January 2027.
    expect(at('Dale Hollow TW / Obey River')).toEqual(['2026-10-01']);
    // "J, F, M, N, D" → November 2026.
    expect(at('Normandy TW / Duck River')).toEqual(['2026-11-01']);
    // "A" only (April) — already past in October: the past window, not April 2027.
    expect(at('Dale Hollow Reservoir')).toEqual(['2026-04-01']);
    expect(scheduleMonthDate([1, 2, 3], new Date('2027-02-10T00:00:00Z'), 2026)).toBe('2026-03-01');
    expect(scheduleMonthDate([11, 12], new Date('2025-12-20T00:00:00Z'), 2026)).toBe('2026-11-01');
  });

  it('publishes the completed-stockings Locations Report as status "reported"', () => {
    expect(result.complete).toEqual(['scheduled', 'reported']);
    expect(result.scheduleRows).toBe(SCHEDULE_ROWS);
    expect(REPORT_ROWS).toBe(70);
    expect(reported).toHaveLength(REPORT_ROWS);
    expect(reported.every((e) => e.datePrecision === 'day')).toBe(true);
    expect(reported.some((e) => e.streamName === 'HIWASSEE RIVER TW' && e.date === '2026-08-04' && e.county === 'POLK')).toBe(true);
    expect(reported.map((e) => e.date).sort().at(-1)).toBe('2026-10-09');
    expect(scheduled.length).toBeGreaterThan(500);
  });
});

describe('runStockingJob — storage integrity', () => {
  let env: TestEnv;
  beforeEach(() => {
    env = makeEnv();
  });
  afterEach(() => {
    env.db.close();
    rmSync(env.dir, { recursive: true, force: true });
  });

  const run = (fetchImpl: typeof fetch, now = NOW) =>
    runStockingJob(env.db, { fetchImpl, userAgent: 'test-agent/1.0', rawDir: env.rawDir, now });
  const count = (where = '1=1') =>
    (env.db.prepare(`SELECT COUNT(*) AS n FROM stocking_events WHERE ${where}`).get() as { n: number }).n;

  it('replaces schedule rows per fetch: a postponed row moves, it does not duplicate', async () => {
    expect((await run(twraFetch())).ok).toBe(true);
    const before = count("status = 'scheduled'");
    const reportedBefore = count("status = 'reported'");
    expect(reportedBefore).toBeGreaterThanOrEqual(REPORT_ROWS);

    const schedule = JSON.parse(SCHEDULE) as { data: Array<Record<string, string>> };
    const row = schedule.data.find((r) => r['STOCKING WEEK'] === '10/18/2026');
    expect(row).toBeDefined();
    row!['STOCKING WEEK'] = '10/25/2026'; // TWRA postpones one stocking a week
    expect((await run(twraFetch({ schedule: JSON.stringify(schedule) }))).ok).toBe(true);

    expect(count("status = 'scheduled'")).toBe(before);
    const loc = row!.LOCATION!.replace(/\s+/g, ' ').trim();
    const dates = env.db
      .prepare("SELECT DISTINCT date FROM stocking_events WHERE stream_name = ? AND status = 'scheduled' AND date_precision = 'week'")
      .all(loc) as { date: string }[];
    expect(dates.map((d) => d.date)).toContain('2026-10-25');
    // Reported (completed) stockings are history: kept across runs.
    expect(count("status = 'reported'")).toBe(reportedBefore);
  });

  it('a failing report grid is a warning; schedule still refreshes and past reports stay', async () => {
    await run(twraFetch());
    const reported = count("status = 'reported'");
    const result = await run(twraFetch({ report: null }));
    expect(result.ok).toBe(true);
    expect(result.warnings.join(' ')).toMatch(/datatable fetch failed: HTTP 404/);
    expect(count("status = 'reported'")).toBe(reported);
  });

  it('fails (and keeps stored rows) when the schedule parses to zero rows', async () => {
    await run(twraFetch());
    const stored = count();
    const result = await run(twraFetch({ schedule: JSON.stringify({ data: [] }) }));
    expect(result.ok).toBe(false);
    expect(result.states[0]?.ok).toBe(false);
    expect(result.warnings.join(' ')).toMatch(/zero events/);
    expect(count()).toBe(stored);
    const job = env.db.prepare("SELECT status FROM jobs_log WHERE job = 'stocking' ORDER BY id DESC LIMIT 1").get() as { status: string };
    expect(job.status).toBe('error');
  });

  it('fails (and keeps stored rows) when the schedule collapses by more than half', async () => {
    await run(twraFetch());
    const stored = count("status = 'scheduled'");
    const schedule = JSON.parse(SCHEDULE) as { data: unknown[] };
    const result = await run(twraFetch({ schedule: JSON.stringify({ data: schedule.data.slice(0, 40) }) }));
    expect(result.ok).toBe(false);
    expect(result.warnings.join(' ')).toMatch(/shrank \d+ → \d+ events/);
    expect(count("status = 'scheduled'")).toBe(stored);
  });

  it('removes legacy ghost rows (pre-status rows left by the upsert-only ingest)', async () => {
    env.db
      .prepare(
        "INSERT INTO stocking_events (id, state_id, stream_name, species, date, date_precision, source_url, fetched_at) VALUES ('ghost', 'TN', 'Norris Tailwater / Clinch River', 'rainbow', '2027-03-01', 'month', ?, '2026-09-30T00:00:00Z')",
      )
      .run(TWRA_PAGE_URL);
    await run(twraFetch());
    expect(count("id = 'ghost'")).toBe(0);
    expect(count("date >= '2027-01-01'")).toBe(0);
  });
});
