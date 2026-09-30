import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { WaterEvidenceSetSchema } from '@trout/contracts';
import type { EvidenceStockingEvent, EvidenceError, WaterObservation } from '@trout/contracts';
import type { Db } from '../db.js';
import { startJob, type JobDetail } from '../jobs/run.js';
import { saveRawCaptures } from '../ingest/stockingJob.js';
import { fetchUsgsObservations } from './usgs-provider.js';
import { fetchTvaObservations } from './tva-provider.js';
import { fetchTwraArtifacts, parseTwraEvidence } from './twra-evidence.js';
import { resolveWaterAlias } from './aliases.js';
import type { CatalogWaterName } from './aliases.js';
import { TVA_MONITORS } from './monitors.js';
import { staleScheduledEvents } from './stale.js';
import { regulationsFromFishingInfo, assembleWaterEvidence } from './assemble.js';
import type { FishingInfoDocument } from './assemble.js';

/**
 * Evidence job (data-sources lane): fetch every upstream source, resolve TWRA names
 * to catalog waters through explicit aliases with ambiguity rejection, assemble the
 * per-water WaterEvidence set, and store it (audit trail + snapshot source).
 *
 * Soft-fail by source: a failing upstream becomes per-water error entries in the
 * payload — the run itself only hard-fails on a crash (DB etc.), mirroring the
 * stocking job discipline.
 */

export interface EvidenceJobResult extends JobDetail {
  waters: number;
  observations: number;
  scheduled: number;
  reportedComplete: number;
  staleScheduled: number;
  unresolvedAliases: number;
  errors: number;
  warnings: string[];
  unresolvedAliasRows: { name: string; county?: string; reason: string }[];
}

export interface RunEvidenceOptions {
  now?: Date;
  userAgent?: string;
  tvUserAgent?: string;
  fetchImpl?: typeof fetch;
  /** Test seam: skip individual providers. */
  providers?: { usgs?: boolean; tva?: boolean; twra?: boolean };
}

interface WaterRow {
  id: string;
  name: string;
  gauge_ids: string;
}

const TVA_BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

function errorCode(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const m = /HTTP (\d{3})/.exec(msg);
  if (m) return `upstream-http-${m[1]}`;
  if (/timeout|abort/i.test(msg)) return 'upstream-timeout';
  return 'upstream-error';
}

function loadFishingInfo(contentPackDir: string): { doc: FishingInfoDocument | null; warning?: string } {
  const p = join(contentPackDir, 'fishing.json');
  try {
    const parsed = JSON.parse(readFileSync(p, 'utf8')) as { fishing?: FishingInfoDocument };
    if (parsed.fishing) return { doc: parsed.fishing };
    return { doc: null, warning: 'content pack fishing.json has no fishing document' };
  } catch {
    return { doc: null, warning: 'content pack fishing.json not found — regulations evidence will be empty' };
  }
}

export async function runEvidenceJob(db: Db, cfg: { contentPackDir: string; rawDir: string; userAgent: string }, opts: RunEvidenceOptions = {}): Promise<EvidenceJobResult> {
  const now = opts.now ?? new Date();
  const handle = startJob(db, 'evidence');
  const warnings: string[] = [];
  const usgs = opts.providers?.usgs ?? true;
  const tva = opts.providers?.tva ?? true;
  const twra = opts.providers?.twra ?? true;
  const usgsUa = opts.userAgent ?? cfg.userAgent;
  const tvaUa = opts.tvUserAgent ?? TVA_BROWSER_UA;
  const fetchImpl = opts.fetchImpl ?? fetch;

  const waters = db.prepare('SELECT id, name, gauge_ids FROM streams ORDER BY id').all() as WaterRow[];
  const catalogNames: CatalogWaterName[] = waters.map((w) => ({ waterId: w.id, name: w.name }));
  const gaugeOwners = new Map<string, string[]>();
  for (const w of waters) {
    for (const g of JSON.parse(w.gauge_ids) as string[]) {
      const owners = gaugeOwners.get(g) ?? [];
      owners.push(w.id);
      gaugeOwners.set(g, owners);
    }
  }

  const observationsByWater = new Map<string, WaterObservation[]>();
  const scheduledByWater = new Map<string, EvidenceStockingEvent[]>();
  const completeByWater = new Map<string, EvidenceStockingEvent[]>();
  const errorsByWater = new Map<string, EvidenceError[]>();
  const unresolvedAliasRows: { name: string; county?: string; reason: string }[] = [];

  const addError = (waterIds: Iterable<string>, sourceId: string, code: string, message: string): void => {
    for (const waterId of waterIds) {
      const list = errorsByWater.get(waterId) ?? [];
      if (!list.some((e) => e.sourceId === sourceId && e.code === code)) {
        list.push({ sourceId, code, message });
        errorsByWater.set(waterId, list);
      }
    }
  };
  const addObservations = (waterId: string, obs: WaterObservation[]): void => {
    if (obs.length === 0) return;
    const list = observationsByWater.get(waterId) ?? [];
    list.push(...obs);
    observationsByWater.set(waterId, list);
  };

  // ── USGS ────────────────────────────────────────────────────────────────────
  const allGauges = [...gaugeOwners.keys()];
  if (usgs && allGauges.length > 0) {
    try {
      const obs = await fetchUsgsObservations(allGauges, { userAgent: usgsUa, fetchImpl });
      const bySite = new Map<string, WaterObservation[]>();
      for (const o of obs) {
        const site = /monitoring-location\/(\d+)\//.exec(o.sourceUrl)?.[1];
        if (!site) continue;
        const list = bySite.get(site) ?? [];
        list.push(o);
        bySite.set(site, list);
      }
      for (const [site, siteObs] of bySite) {
        for (const waterId of gaugeOwners.get(site) ?? []) addObservations(waterId, siteObs);
      }
      if (obs.length === 0) {
        const affected = allGauges.flatMap((g) => gaugeOwners.get(g) ?? []);
        addError(affected, 'usgs-nwis-iv', 'empty-response', 'USGS returned no time series for the catalog gauges');
      }
    } catch (err) {
      const affected = allGauges.flatMap((g) => gaugeOwners.get(g) ?? []);
      addError(affected, 'usgs-nwis-iv', errorCode(err), err instanceof Error ? err.message : String(err));
      warnings.push(`USGS fetch failed: ${(err as Error).message}`);
    }
  }

  // ── TVA ─────────────────────────────────────────────────────────────────────
  if (tva) {
    for (const [waterId, monitor] of Object.entries(TVA_MONITORS)) {
      try {
        const obs = await fetchTvaObservations(monitor.locationId, { userAgent: tvaUa, fetchImpl });
        addObservations(waterId, obs);
        await new Promise((r) => setTimeout(r, 300)); // politeness gap (Cloudflare front)
      } catch (err) {
        addError([waterId], 'tva-restapi', errorCode(err), `TVA ${monitor.locationId}: ${(err as Error).message}`);
        warnings.push(`TVA ${monitor.locationId} failed: ${(err as Error).message}`);
      }
    }
  }

  // ── TWRA stockings ──────────────────────────────────────────────────────────
  let scheduled = 0;
  let reportedComplete = 0;
  let staleScheduled = 0;
  if (twra) {
    try {
      const artifacts = await fetchTwraArtifacts({ userAgent: usgsUa, fetchImpl });
      // Raw audit trail (§8): keep exactly what TWRA published — one collision-proof
      // file per fetched artifact (F36) plus a URL/hash manifest as the commit record.
      saveRawCaptures(join(cfg.rawDir, 'evidence'), now, artifacts);

      const parsed = parseTwraEvidence(artifacts, { now });
      warnings.push(...parsed.warnings.map((w) => `TWRA: ${w}`));

      const scheduleGridMissing = parsed.warnings.some((w) => w.includes('schedule grid not found'));
      const recentGridMissing = parsed.warnings.some((w) => w.includes('recent-report grid not found'));
      if (scheduleGridMissing) {
        addError(waters.map((w) => w.id), 'twra-stockings', 'source-grid-missing', 'TWRA schedule grid was not found in the captured page/JSON');
      }
      if (recentGridMissing) {
        addError(waters.map((w) => w.id), 'twra-recent-stockings', 'source-grid-missing', 'TWRA recent-report grid was not found in the captured page/JSON');
      }

      // Map events back to waters through the alias resolver. TWRA's own date and
      // precision are preserved; 'scheduled' rows stay 'scheduled' even when their
      // window has passed (staleness is counted and reported, never converted).
      for (const row of parsed.scheduleRows) {
        const resolution = resolveWaterAlias(row.location, row.county, catalogNames);
        if (resolution.kind !== 'resolved') {
          recordUnresolved(unresolvedAliasRows, row.location, row.county, resolution);
          continue;
        }
        const list = scheduledByWater.get(resolution.waterId) ?? [];
        list.push(row.event);
        scheduledByWater.set(resolution.waterId, list);
      }
      for (const row of parsed.recentRows) {
        const resolution = resolveWaterAlias(row.destination, undefined, catalogNames);
        if (resolution.kind !== 'resolved') {
          recordUnresolved(unresolvedAliasRows, row.destination, undefined, resolution);
          continue;
        }
        const list = completeByWater.get(resolution.waterId) ?? [];
        list.push(row.event);
        completeByWater.set(resolution.waterId, list);
      }
      scheduled = parsed.scheduleRows.length;
      reportedComplete = parsed.recentRows.length;
      staleScheduled = staleScheduledEvents(
        parsed.scheduleRows.map((r) => r.event),
        now,
      ).length;
    } catch (err) {
      addError(waters.map((w) => w.id), 'twra-stockings', errorCode(err), err instanceof Error ? err.message : String(err));
      addError(waters.map((w) => w.id), 'twra-recent-stockings', errorCode(err), err instanceof Error ? err.message : String(err));
      warnings.push(`TWRA fetch failed: ${(err as Error).message}`);
    }
  }

  // ── Regulations ─────────────────────────────────────────────────────────────
  const fishing = loadFishingInfo(cfg.contentPackDir);
  if (fishing.warning) warnings.push(fishing.warning);
  const regs = fishing.doc ? regulationsFromFishingInfo(fishing.doc) : { statewide: [], byWater: new Map() };

  // ── Assemble + store ────────────────────────────────────────────────────────
  const assembled = assembleWaterEvidence({
    waters: waters.map((w) => ({ waterId: w.id })),
    retrievedAt: now.toISOString(),
    observationsByWater,
    scheduledByWater,
    completeByWater,
    statewideRegulations: regs.statewide,
    waterRegulations: regs.byWater,
    errorsByWater,
  });
  if (assembled.invalid.length > 0) {
    for (const i of assembled.invalid) warnings.push(`invalid evidence for ${i.waterId}: ${i.issues}`);
  }

  const payload = WaterEvidenceSetSchema.parse(assembled.evidence);
  const totalObservations = payload.reduce((n, e) => n + e.observations.length, 0);
  const totalErrors = payload.reduce((n, e) => n + e.errors.length, 0);

  const store = db.transaction((): void => {
    db.prepare('INSERT INTO evidence_runs (retrieved_at, payload, summary) VALUES (?, ?, ?)').run(
      now.toISOString(),
      JSON.stringify(payload),
      JSON.stringify({ waters: payload.length, observations: totalObservations, errors: totalErrors }),
    );
    db.prepare('DELETE FROM evidence_runs WHERE retrieved_at NOT IN (SELECT retrieved_at FROM evidence_runs ORDER BY retrieved_at DESC LIMIT 5)').run();
  });
  store();

  const result: EvidenceJobResult = {
    waters: payload.length,
    observations: totalObservations,
    scheduled,
    reportedComplete,
    staleScheduled,
    unresolvedAliases: unresolvedAliasRows.length,
    errors: totalErrors,
    warnings,
    unresolvedAliasRows,
  };
  handle.ok(result);
  return result;
}

function recordUnresolved(
  rows: { name: string; county?: string; reason: string }[],
  name: string,
  county: string | undefined,
  resolution: ReturnType<typeof resolveWaterAlias>,
): void {
  const reason =
    resolution.kind === 'ambiguous'
      ? `ambiguous: ${resolution.candidates.join(', ')}`
      : resolution.kind === 'county-mismatch'
        ? `county mismatch: TWRA "${resolution.rowCounty}" vs catalog ${resolution.catalogCounties.join('/')}`
        : resolution.kind === 'county-required'
          ? `catalog water is county-qualified (${resolution.catalogCounties.join('/')}) and the row carries no county`
          : 'no catalog water matches this name';
  rows.push({ name, ...(county ? { county } : {}), reason });
}
