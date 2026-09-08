// Coverage builder (data-sources lane):
//   tsx src/scripts/build-coverage.ts [--live]
// Reads the catalog YAMLs, the committed USGS IV audit fixture, the TVA monitor map,
// the alias resolver and the fishing-information content, and writes
// docs/data-source-coverage.json — one record per catalog water with monitors,
// available metrics, stocking/regulation sources, most-recent known rows,
// unresolved aliases, confidence and provenance.
//
// Offline (default): everything is derived from committed fixtures and maps —
// deterministic, CI-safe. "Most recent" fields come from the audit (ivEnd) and are
// marked source: 'audit'.
// --live: additionally fetches USGS IV + TVA observed-data + the TWRA grids to stamp
// the most-recent observation/stocking rows from the live sources (source: 'live').
import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { fetchUsgsObservations } from '../evidence/usgs-provider.js';
import { fetchTvaObservations } from '../evidence/tva-provider.js';
import { fetchTwraArtifacts, parseTwraEvidence } from '../evidence/twra-evidence.js';
import { resolveWaterAlias } from '../evidence/aliases.js';
import type { CatalogWaterName } from '../evidence/aliases.js';
import { TVA_MONITORS } from '../evidence/monitors.js';
import { regulationsFromFishingInfo } from '../evidence/assemble.js';
import type { FishingInfoDocument } from '../evidence/assemble.js';
import { staleScheduledEvents } from '../evidence/stale.js';

// src/scripts → apps/api
const API_ROOT = resolve(import.meta.dirname, '../..');
const REPO_ROOT = resolve(API_ROOT, '../..');
const OUT_PATH = join(REPO_ROOT, 'docs', 'data-source-coverage.json');

const USGS_PARAM_METRIC: Record<string, string> = {
  '00060': 'discharge-cfs',
  '00065': 'stage-ft',
  '00010': 'temperature-c',
};

interface CatalogWater {
  waterId: string;
  name: string;
  waterbodyType: string;
  regionId: string;
  gaugeIds: string[];
  stockingProgram: boolean;
  officialSources: { label: string; url: string }[];
}

function loadCatalog(): CatalogWater[] {
  const dir = join(REPO_ROOT, 'packages', 'content', 'streams', 'tn');
  const out: CatalogWater[] = [];
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.yaml'))) {
    const yaml = parseYaml(readFileSync(join(dir, f), 'utf8')) as Record<string, unknown>;
    out.push({
      waterId: String(yaml.id ?? f.replace(/\.yaml$/, '')),
      name: String(yaml.name ?? ''),
      waterbodyType: String(yaml.waterbodyType ?? ''),
      regionId: String(yaml.regionId ?? ''),
      gaugeIds: (yaml.gaugeIds as string[] | undefined) ?? [],
      stockingProgram: yaml.stockingProgram === true,
      officialSources: (yaml.officialSources as CatalogWater['officialSources'] | undefined) ?? [],
    });
  }
  return out.sort((a, b) => a.waterId.localeCompare(b.waterId));
}

interface UsgsAudit {
  retrievedAt: string;
  sites: Record<string, { ivEnd?: string; params?: string[]; absentFromCatalog?: boolean }>;
}

function loadUsgsAudit(): UsgsAudit {
  return JSON.parse(readFileSync(join(API_ROOT, 'fixtures', 'USGS-SITE', 'site-iv-catalog-2026-09-04.json'), 'utf8')) as UsgsAudit;
}

function loadFishingInfo(): FishingInfoDocument {
  return JSON.parse(readFileSync(join(REPO_ROOT, 'packages', 'content', 'data', 'fishing-information.json'), 'utf8')) as FishingInfoDocument;
}

/** Alias-resolution inputs from the committed TWRA capture (deterministic offline). */
function twraRowsFromFixtures(): { schedule: { location: string; county?: string; date: string; datePrecision: string }[]; recent: { destination: string; date: string }[] } {
  const fixturesDir = join(API_ROOT, 'fixtures', 'TN');
  const pageFile = readdirSync(fixturesDir).find((f) => f.includes('stockings-page'));
  const jsonFiles = readdirSync(fixturesDir).filter((f) => f.includes('exceldriven') && f >= '2026-09-04');
  if (!pageFile || jsonFiles.length === 0) return { schedule: [], recent: [] };
  const artifacts = [
    { suffix: 'html', content: readFileSync(join(fixturesDir, pageFile), 'utf8'), url: 'https://www.tn.gov/twra/fishing/trout-information-stockings.html' },
    ...jsonFiles.map((f) => ({ suffix: 'exceldriven.json', content: readFileSync(join(fixturesDir, f), 'utf8'), url: 'https://www.tn.gov/twra/fishing/trout-information-stockings.html' })),
  ];
  const parsed = parseTwraEvidence(artifacts, { now: new Date() });
  return {
    schedule: parsed.scheduleRows.map((r) => ({ location: r.location, county: r.county, date: r.event.date, datePrecision: r.event.datePrecision })),
    recent: parsed.recentRows.map((r) => ({ destination: r.destination, date: r.event.date })),
  };
}

interface CoverageWater {
  waterId: string;
  name: string;
  waterbodyType: string;
  regionId: string;
  monitors: {
    usgsGauges: { id: string; ivStatus: 'live' | 'no-current-iv' | 'historical-only' | 'absent'; ivEnd?: string; params?: string[] }[];
    tva: { locationId: string; role: string }[];
  };
  availableMetrics: string[];
  metricsProvenance: string;
  stockingSources: string[];
  regulationsSources: { authority: string; sourceUrl: string; title: string }[];
  mostRecentObservation: { metric: string; observedAt: string; sourceId: string; sourceUrl: string; value: number; qualifier?: string; provenance: string } | null;
  mostRecentStockingRow: { date: string; datePrecision: string; status: string; sourceId: string } | null;
  unresolvedAliases: { name: string; county?: string; reason: string; kind: 'candidate' | 'observed' }[];
  confidence: 'high' | 'medium' | 'low';
  confidenceReason: string;
}

async function main(): Promise<void> {
  const live = process.argv.includes('--live');
  const catalog = loadCatalog();
  const audit = loadUsgsAudit();
  const fishing = loadFishingInfo();
  const regs = regulationsFromFishingInfo(fishing);
  const catalogNames: CatalogWaterName[] = catalog.map((w) => ({ waterId: w.waterId, name: w.name }));
  const twra = twraRowsFromFixtures();

  // Resolve TWRA names once; keep per-water stocking info + the global unresolved list.
  const stockingByWater = new Map<string, { date: string; datePrecision: string; status: string; sourceId: string }[]>();
  const stockingSourcesByWater = new Map<string, Set<string>>();
  const unresolvedGlobal: { name: string; county?: string; reason: string }[] = [];
  const staleScheduleCount = staleScheduledEvents(
    twra.schedule.map((r) => ({ sourceId: 'twra-stockings', sourceUrl: '', date: r.date, datePrecision: r.datePrecision as 'day' | 'week' | 'month', status: 'scheduled' as const })),
    new Date(),
  ).length;
  for (const row of twra.schedule) {
    const r = resolveWaterAlias(row.location, row.county, catalogNames);
    if (r.kind !== 'resolved') {
      unresolvedGlobal.push({ name: row.location, ...(row.county ? { county: row.county } : {}), reason: r.kind === 'ambiguous' ? `ambiguous: ${r.candidates.join(', ')}` : r.kind === 'county-mismatch' ? `county mismatch (TWRA ${r.rowCounty} vs catalog ${r.catalogCounties.join('/')})` : r.kind === 'county-required' ? `catalog county-qualified (${r.catalogCounties.join('/')}) and row has no county` : 'no catalog water matches' });
      continue;
    }
    const sources = stockingSourcesByWater.get(r.waterId) ?? new Set<string>();
    sources.add('twra-stockings');
    stockingSourcesByWater.set(r.waterId, sources);
    const list = stockingByWater.get(r.waterId) ?? [];
    if (!list.some((e) => e.date === row.date)) list.push({ date: row.date, datePrecision: row.datePrecision, status: 'scheduled', sourceId: 'twra-stockings' });
    stockingByWater.set(r.waterId, list);
  }
  for (const row of twra.recent) {
    const r = resolveWaterAlias(row.destination, undefined, catalogNames);
    if (r.kind !== 'resolved') {
      unresolvedGlobal.push({ name: row.destination, reason: r.kind === 'ambiguous' ? `ambiguous: ${r.candidates.join(', ')}` : 'no catalog water matches' });
      continue;
    }
    const sources = stockingSourcesByWater.get(r.waterId) ?? new Set<string>();
    sources.add('twra-recent-stockings');
    stockingSourcesByWater.set(r.waterId, sources);
    const list = stockingByWater.get(r.waterId) ?? [];
    if (!list.some((e) => e.date === row.date && e.status === 'reported-complete')) list.push({ date: row.date, datePrecision: 'day', status: 'reported-complete', sourceId: 'twra-recent-stockings' });
    stockingByWater.set(r.waterId, list);
  }

  // Optional live most-recent observations.
  interface LiveObs {
    metric: string;
    observedAt: string;
    sourceId: string;
    sourceUrl: string;
    value: number;
    qualifier?: string;
  }
  const liveObservations = new Map<string, LiveObs[]>();
  const liveErrors: string[] = [];
  if (live) {
    const ua = process.env.USGS_USER_AGENT ?? 'trout-lane-coverage/0.1 (data-sources lane)';
    const browserUa = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
    const allGauges = [...new Set(catalog.flatMap((w) => w.gaugeIds))];
    try {
      const obs = await fetchUsgsObservations(allGauges, { userAgent: ua });
      const gaugeToWaters = new Map<string, string[]>();
      for (const w of catalog) for (const g of w.gaugeIds) gaugeToWaters.set(g, [...(gaugeToWaters.get(g) ?? []), w.waterId]);
      for (const o of obs) {
        const site = /monitoring-location\/(\d+)\//.exec(o.sourceUrl)?.[1];
        if (!site) continue;
        for (const waterId of gaugeToWaters.get(site) ?? []) {
          liveObservations.set(waterId, [...(liveObservations.get(waterId) ?? []), { metric: o.metric, observedAt: o.observedAt, sourceId: o.sourceId, sourceUrl: o.sourceUrl, value: o.value, qualifier: o.qualifier }]);
        }
      }
    } catch (err) {
      liveErrors.push(`USGS: ${(err as Error).message}`);
    }
    for (const [waterId, monitor] of Object.entries(TVA_MONITORS)) {
      try {
        const obs = await fetchTvaObservations(monitor.locationId, { userAgent: browserUa });
        liveObservations.set(waterId, [...(liveObservations.get(waterId) ?? []), ...obs.map((o) => ({ metric: o.metric, observedAt: o.observedAt, sourceId: o.sourceId, sourceUrl: o.sourceUrl, value: o.value, qualifier: o.qualifier }))]);
        await new Promise((r) => setTimeout(r, 300));
      } catch (err) {
        liveErrors.push(`TVA ${monitor.locationId}: ${(err as Error).message}`);
      }
    }
    try {
      const artifacts = await fetchTwraArtifacts({ userAgent: ua });
      const parsed = parseTwraEvidence(artifacts, { now: new Date() });
      for (const row of parsed.scheduleRows) {
        const r = resolveWaterAlias(row.location, row.county, catalogNames);
        if (r.kind === 'resolved') {
          const list = stockingByWater.get(r.waterId) ?? [];
          if (!list.some((e) => e.date === row.event.date && e.status === 'scheduled')) list.push({ date: row.event.date, datePrecision: row.event.datePrecision, status: 'scheduled', sourceId: 'twra-stockings' });
          stockingByWater.set(r.waterId, list);
        }
      }
      for (const row of parsed.recentRows) {
        const r = resolveWaterAlias(row.destination, undefined, catalogNames);
        if (r.kind === 'resolved') {
          const list = stockingByWater.get(r.waterId) ?? [];
          if (!list.some((e) => e.date === row.event.date && e.status === 'reported-complete')) list.push({ date: row.event.date, datePrecision: 'day', status: 'reported-complete', sourceId: 'twra-recent-stockings' });
          stockingByWater.set(r.waterId, list);
        }
      }
    } catch (err) {
      liveErrors.push(`TWRA: ${(err as Error).message}`);
    }
  }

  // Candidate-unresolved mapping: known TWRA names we could not resolve, attached to
  // the catalog water they most plausibly belong to (explicitly labeled candidate).
  const CANDIDATE_UNRESOLVED: Record<string, { name: string; reason: string }[]> = {
    'cherokee-lake': [{ name: 'Cherokee TW / Holston River', reason: 'TWRA stocks the Cherokee Dam tailwater; the catalog has the lake only' }],
  };

  const waters: CoverageWater[] = catalog.map((w) => {
    const gauges = w.gaugeIds.map((g) => {
      const a = audit.sites[g] ?? {};
      const ivStatus: 'live' | 'no-current-iv' | 'historical-only' | 'absent' =
        a.absentFromCatalog ? 'absent' : !a.ivEnd ? 'absent' : a.ivEnd >= '2026-08-01' ? 'live' : a.ivEnd >= '2025-01-01' ? 'historical-only' : 'no-current-iv';
      return { id: g, ivStatus, ...(a.ivEnd ? { ivEnd: a.ivEnd } : {}), ...(a.params && a.params.length > 0 ? { params: a.params } : {}) };
    });
    const tvaMonitor = TVA_MONITORS[w.waterId];
    const tvaMonitors = tvaMonitor ? [{ locationId: tvaMonitor.locationId, role: tvaMonitor.role }] : [];
    const metrics = new Set<string>();
    let metricsProvenance = '';
    for (const g of gauges) {
      for (const p of g.params ?? []) {
        const m = USGS_PARAM_METRIC[p];
        if (m) metrics.add(m);
      }
    }
    if (gauges.length > 0) metricsProvenance = `USGS IV audit ${audit.retrievedAt}`;
    if (tvaMonitors.length > 0) {
      for (const t of tvaMonitors) {
        if (t.role === 'reservoir') metrics.add('reservoir-level-ft');
        if (t.role === 'reservoir') metrics.add('discharge-cfs');
        if (t.role === 'tailwater') metrics.add('stage-ft');
        if (t.role === 'tailwater') metrics.add('discharge-cfs');
      }
      metricsProvenance = metricsProvenance ? `${metricsProvenance}; TVA monitor map (2026-09-04)` : 'TVA monitor map (2026-09-04)';
    }

    const liveObs = liveObservations.get(w.waterId) ?? [];
    const newest = [...liveObs].sort((a, b) => b.observedAt.localeCompare(a.observedAt))[0];
    const mostRecent = newest
      ? { ...newest, provenance: live ? 'live fetch (coverage run)' : 'n/a' }
      : null;

    const stockingRows = (stockingByWater.get(w.waterId) ?? []).sort((a, b) => b.date.localeCompare(a.date));
    const stockingSources = w.stockingProgram || stockingSourcesByWater.has(w.waterId)
      ? [...(stockingSourcesByWater.get(w.waterId) ?? new Set(['twra-stockings']))].sort()
      : [];
    const waterRegs = [
      ...regs.statewide.map((r) => ({ authority: r.authority, sourceUrl: r.sourceUrl, title: r.title })),
      ...(regs.byWater.get(w.waterId) ?? []).map((r) => ({ authority: r.authority, sourceUrl: r.sourceUrl, title: r.title })),
    ];

    const unresolved: CoverageWater['unresolvedAliases'] = (CANDIDATE_UNRESOLVED[w.waterId] ?? []).map((u) => ({ ...u, kind: 'candidate' as const }));

    const hasMonitor = gauges.some((g) => g.ivStatus === 'live') || tvaMonitors.length > 0;
    const hasStocking = stockingSources.length > 0;
    let confidence: 'high' | 'medium' | 'low';
    let confidenceReason: string;
    if (hasMonitor && hasStocking) {
      confidence = 'high';
      confidenceReason = 'live monitor(s) + resolved TWRA stocking alias + regulations';
    } else if (hasMonitor || hasStocking) {
      confidence = 'medium';
      confidenceReason = hasMonitor
        ? 'live monitor(s) but no resolved TWRA stocking alias'
        : 'resolved TWRA stocking alias but no live monitor';
    } else {
      confidence = 'low';
      confidenceReason = 'no live monitor and no resolved TWRA stocking alias (unresolved aliases, if any, are listed)';
    }

    return {
      waterId: w.waterId,
      name: w.name,
      waterbodyType: w.waterbodyType,
      regionId: w.regionId,
      monitors: { usgsGauges: gauges, tva: tvaMonitors },
      availableMetrics: [...metrics].sort(),
      metricsProvenance,
      stockingSources,
      regulationsSources: waterRegs,
      mostRecentObservation: mostRecent,
      mostRecentStockingRow: stockingRows[0] ?? null,
      unresolvedAliases: unresolved,
      confidence,
      confidenceReason,
    };
  });

  const resolvedCount = stockingSourcesByWater.size;
  const out = {
    meta: {
      generatedAt: new Date().toISOString(),
      lane: 'data-sources',
      baseSha: '5648ccca5c2b6f6fb1cba95b8ae2d421a1e07c9e',
      live: live || liveErrors.length > 0 ? (live ? 'fetched for most-recent rows' : 'attempted, failed') : 'offline (fixtures + audit only)',
      liveErrors,
      provenance: {
        usgsAudit: { retrievedAt: audit.retrievedAt, sourceUrl: 'https://waterservices.usgs.gov/nwis/site/', fixture: 'apps/api/fixtures/USGS/site-iv-catalog-2026-09-04.json' },
        tvaMonitorMap: { verifiedAt: '2026-09-04', fixture: 'apps/api/fixtures/TVA/locations-2026-09-04.json', note: 'TVA /RestApi/locations — 43 locations; undocumented endpoint, verified live' },
        twraCapture: { retrievedAt: '2026-09-04', fixtures: ['apps/api/fixtures/TN/2026-09-04-stockings-page.html', 'apps/api/fixtures/TN/2026-09-04-schedule.exceldriven.json', 'apps/api/fixtures/TN/2026-09-04-recent.exceldriven.json'], note: 'two grids: schedule (616 rows) + recent report (12-row rolling window)' },
        regulations: { verifiedAt: fishing.verifiedAt, source: 'packages/content/data/fishing-information.json' },
        usace: { note: 'CWMS CDA reachable but TSID catalog 501s — not usable; USACE Cumberland lakes covered via TVA Ownership:"Cumberland" monitors', verifiedAt: '2026-09-04' },
      },
      totals: {
        waters: waters.length,
        withLiveMonitor: waters.filter((w) => w.monitors.usgsGauges.some((g) => g.ivStatus === 'live') || w.monitors.tva.length > 0).length,
        withUsgsGauges: waters.filter((w) => w.monitors.usgsGauges.length > 0).length,
        withTvaMonitor: waters.filter((w) => w.monitors.tva.length > 0).length,
        withResolvedStockingAlias: resolvedCount,
        withStockingSources: waters.filter((w) => w.stockingSources.length > 0).length,
        unresolvedTwraNames: unresolvedGlobal.length,
        unresolvedTwraNamesDistinct: new Set(unresolvedGlobal.map((u) => `${u.name}|${u.county ?? ''}`)).size,
        staleScheduleRows: staleScheduleCount,
        confidenceHigh: waters.filter((w) => w.confidence === 'high').length,
        confidenceMedium: waters.filter((w) => w.confidence === 'medium').length,
        confidenceLow: waters.filter((w) => w.confidence === 'low').length,
      },
      unresolvedTwraNames: (() => { const seen = new Set<string>(); return unresolvedGlobal
          .map((u) => ({ ...u, key: `${u.name}|${u.county ?? ''}|${u.reason}` }))
          .filter((u) => (seen.has(u.key) ? false : (seen.add(u.key), true)))
          .sort((a, b) => a.name.localeCompare(b.name)); })(),
    },
    waters,
  };

  mkdirSync(join(REPO_ROOT, 'docs'), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(out, null, 2) + '\n');
  console.log(`[coverage] wrote ${OUT_PATH} (${waters.length} waters, live=${live})`);
  if (!existsSync(OUT_PATH)) process.exit(1);
}

void main();
