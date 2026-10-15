import { HistoricalFlowSchema, type HistoricalFlow } from '@trout/contracts';
import type { Db } from '../db.js';
import { startJob } from '../jobs/run.js';

const ENDPOINT = 'https://api.waterdata.usgs.gov/statistics/v0/observationNormals';
export function flowNormalsUrl(ids: string[]) {
  const url = new URL(ENDPOINT);
  for (const id of ids) url.searchParams.append('monitoring_location_id', `USGS-${id}`);
  url.searchParams.set('parameter_code', '00060');
  url.searchParams.set('computation_type', 'percentile');
  url.searchParams.set('normal_type', 'MOY');
  url.searchParams.set('page_size', '1000');
  return url;
}

interface NormalValue {
  time_of_year?: string; time_of_year_type?: string; approval_status?: string;
  computation?: string; computation_id?: string; sample_count?: number;
  values?: unknown[]; percentiles?: string[];
}
interface NormalData {
  parameter_code?: string; unit_of_measure?: string; parent_statistic_id?: string;
  parent_time_series_id?: string; values?: NormalValue[];
}
interface NormalResponse {
  features?: { properties?: { monitoring_location_id?: string; data?: NormalData[] } }[];
  next?: unknown;
}

export function parseFlowNormals(payload: NormalResponse, requested: string[], retrievedAt: string): HistoricalFlow[] {
  if (!Array.isArray(payload.features)) throw new Error('USGS statistics response has no features array');
  const rows: HistoricalFlow[] = [];
  for (const feature of payload.features) {
    const id = feature.properties?.monitoring_location_id?.replace(/^USGS-/, '');
    if (!id || !requested.includes(id)) continue;
    for (const data of feature.properties?.data ?? []) {
      if (data.parameter_code !== '00060' || data.parent_statistic_id !== '00003' ||
          !['ft^3/s', 'cfs'].includes(data.unit_of_measure ?? '')) continue;
      for (const v of data.values ?? []) {
        if (v.time_of_year_type !== 'month_of_year' || v.approval_status !== 'approved' ||
            v.computation !== 'percentile' || !Array.isArray(v.percentiles) || !Array.isArray(v.values)) continue;
        const percentile = (p: string) => {
          const raw = v.values![v.percentiles!.indexOf(p)];
          return (typeof raw === 'string' && raw.trim() !== '') || typeof raw === 'number' ? Number(raw) : NaN;
        };
        const parsed = HistoricalFlowSchema.safeParse({
          gaugeId: id, month: Number(v.time_of_year), p25: percentile('25'),
          median: percentile('50'), p75: percentile('75'), sampleCount: v.sample_count,
          unit: 'cfs', basis: 'USGS approved month-of-year discharge normals',
          retrievedAt, sourceUrl: flowNormalsUrl([id]).toString(),
          parentTimeSeriesId: data.parent_time_series_id, computationId: v.computation_id,
        });
        if (parsed.success) rows.push(parsed.data);
      }
    }
  }
  return rows;
}

/** Monthly cache refresh is independent of current gauge readings. Network/page
 * failures preserve the prior context; historical values never enter raw live data. */
export async function runFlowHistoryJob(db: Db, opts: {
  userAgent: string; apiKey?: string; now?: Date; fetchImpl?: typeof fetch; force?: boolean;
}) {
  const now = opts.now ?? new Date();
  const last = db.prepare("SELECT finished_at FROM jobs_log WHERE job='flow-history' AND status='ok' ORDER BY id DESC LIMIT 1").get() as { finished_at: string } | undefined;
  if (!opts.force && last && now.getTime() - Date.parse(last.finished_at) < 30 * 86400000) return { items: 0, cached: true };
  const handle = startJob(db, 'flow-history');
  try {
    const streams = db.prepare('SELECT gauge_ids FROM streams').all() as { gauge_ids: string }[];
    const ids = [...new Set(streams.flatMap((s) => JSON.parse(s.gauge_ids) as string[]).filter((id) => /^\d{8}$/.test(id)))].sort();
    if (!ids.length) { handle.ok({ items: 0 }); return { items: 0, cached: false }; }
    const gathered: HistoricalFlow[] = [];
    for (let offset = 0; offset < ids.length; offset += 10) {
      const batch = ids.slice(offset, offset + 10);
      let url: URL | undefined = flowNormalsUrl(batch);
      const seen = new Set<string>();
      for (let page = 0; url && page < 30; page++) {
        if (seen.has(url.toString()) || url.origin !== new URL(ENDPOINT).origin || url.pathname !== new URL(ENDPOINT).pathname) throw new Error('invalid statistics pagination URL');
        seen.add(url.toString());
        const res = await (opts.fetchImpl ?? fetch)(url.toString(), {
          headers: { Accept: 'application/json', 'User-Agent': opts.userAgent,
            ...(opts.apiKey ? { 'X-Api-Key': opts.apiKey } : {}) },
          signal: AbortSignal.timeout(30_000),
        });
        if (!res.ok) throw new Error(`USGS statistics HTTP ${res.status}`);
        const payload = await res.json() as NormalResponse;
        gathered.push(...parseFlowNormals(payload, batch, now.toISOString()));
        if (payload.next !== undefined && payload.next !== null && typeof payload.next !== 'string') throw new Error('invalid statistics continuation');
        url = typeof payload.next === 'string' && payload.next ? new URL(payload.next, ENDPOINT) : undefined;
      }
      if (url) throw new Error('USGS statistics pagination limit exceeded');
    }
    // Reject ambiguous parallel time series instead of letting response order select one.
    const groups = new Map<string, HistoricalFlow[]>();
    for (const row of gathered) { const key = `${row.gaugeId}:${row.month}`; groups.set(key, [...(groups.get(key) ?? []), row]); }
    const rows = [...groups.values()].filter((group) => group.length === 1).map((group) => group[0]!);
    db.transaction(() => {
      const remove = db.prepare('DELETE FROM flow_normals WHERE gauge_id = ?');
      for (const id of ids) remove.run(id);
      const insert = db.prepare('INSERT INTO flow_normals(gauge_id,month,payload,retrieved_at) VALUES(?,?,?,?)');
      for (const row of rows) insert.run(row.gaugeId, row.month, JSON.stringify(row), row.retrievedAt);
    })();
    const detail = { items: rows.length, cached: false, warnings: groups.size > rows.length ? ['Ambiguous gauge/month normals withheld'] : [] };
    handle.ok(detail); return detail;
  } catch (error) { handle.fail(error); throw error; }
}
