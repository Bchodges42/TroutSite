import { EvidenceStockingEventSchema } from '@trout/contracts';
import type { EvidenceStockingEvent } from '@trout/contracts';
import { fetchWithRetry } from '../lib/retry.js';
import {
  classifyTwraGrid,
  extractDatatableJsonPaths,
  parseDatatableJson,
  parseInlineTable,
  resolveDate,
  TWRA_PAGE_URL,
} from '../ingest/stocking/tn.js';
import type { TwraGridKind, TwraRow } from '../ingest/stocking/tn.js';

// Grid classification is defined once in the TWRA stocking adapter (single source
// of truth, no import cycle); re-exported here for the evidence layer.
export { classifyTwraGrid };
export type { TwraGridKind };

/**
 * TWRA stockings page → evidence stocking events (data-sources lane).
 *
 * The page carries TWO exceldriven DataTables whose JSON paths are re-resolved from
 * the HTML on every fetch (the CMS path id changes on redeploys):
 *   1. "Trout Stocking Schedule" — REGION/COUNTY/LOCATION/TYPE/STOCKING DAY/
 *      STOCKING WEEK/STOCKING MONTHS/SPECIES. Forward-looking. Week-of dates are
 *      Sundays and the event happens within 5 days after; TWRA explicitly caveats
 *      postponement/cancellation. → status 'scheduled' — never proof of completion.
 *   2. "Recent Stocking Locations Report" — Region/Destination/Stocking Date.
 *      Rolling ~12-row window of where adult trout were recently stocked, updated
 *      bi-weekly. → status 'reported-complete' (TWRA's own statement, no counts).
 * Grid identity comes from the COLUMN SIGNATURE, not the URL or page position.
 */

/** Published species text → verbatim lowercase list (never inferred from names). */
export function parseTwraSpeciesList(raw: string | undefined): string[] | undefined {
  if (raw === undefined) return undefined;
  const items = raw
    .split(/[,&/]/)
    .map((s) => s.replace(/\s+/g, ' ').trim().toLowerCase())
    .filter((s) => s.length > 0 && s !== 'trout');
  return items.length > 0 ? [...new Set(items)] : undefined;
}

export interface TwraEvidenceOptions {
  /** Injected "now" for date resolution (deterministic tests; defaults to real clock). */
  now?: Date;
}

/** Schedule rows → 'scheduled' events with the source's own date precision. */
export function scheduleRowsToEvidenceEvents(
  rows: TwraRow[],
  pageUrl: string,
  opts: TwraEvidenceOptions = {},
): { rows: { event: EvidenceStockingEvent; location: string; county?: string }[]; skipped: number; warnings: string[] } {
  const now = opts.now ?? new Date();
  const out: { event: EvidenceStockingEvent; location: string; county?: string }[] = [];
  const warnings: string[] = [];
  let skipped = 0;
  for (const row of rows) {
    const location = row.LOCATION?.replace(/\s+/g, ' ').trim();
    if (!location) {
      skipped += 1;
      continue;
    }
    const { date, precision } = resolveDate(row, now);
    if (!date || !precision) {
      skipped += 1;
      warnings.push(`schedule row "${location}" has no usable date (kept out of evidence)`);
      continue;
    }
    const species = parseTwraSpeciesList(row.SPECIES);
    const candidate = EvidenceStockingEventSchema.safeParse({
      sourceId: 'twra-stockings',
      sourceUrl: pageUrl,
      date,
      datePrecision: precision,
      // A published schedule is NOT proof a stocking occurred — even when the
      // date has passed, all we know is TWRA scheduled it.
      status: 'scheduled',
      ...(species ? { species } : {}),
    });
    if (candidate.success) out.push({ event: candidate.data, location, ...(row.COUNTY ? { county: row.COUNTY } : {}) });
    else {
      skipped += 1;
      warnings.push(`schedule row "${location}" failed validation: ${candidate.error.issues[0]?.message ?? '?'}`);
    }
  }
  return { rows: out, skipped, warnings };
}

/** Recent-report rows → 'reported-complete' events (day precision, no species). */
export function recentRowsToEvidenceEvents(
  rows: Record<string, unknown>[],
  pageUrl: string,
): { rows: { event: EvidenceStockingEvent; destination: string }[]; skipped: number; warnings: string[] } {
  const out: { event: EvidenceStockingEvent; destination: string }[] = [];
  const warnings: string[] = [];
  let skipped = 0;
  for (const row of rows) {
    const destination = typeof row.Destination === 'string' ? row.Destination.replace(/\s+/g, ' ').trim() : '';
    const dateRaw = typeof row['Stocking Date'] === 'string' ? row['Stocking Date'].trim() : '';
    if (!destination || !dateRaw) {
      skipped += 1;
      continue;
    }
    const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(dateRaw);
    if (!m?.[1] || !m[2] || !m[3]) {
      skipped += 1;
      warnings.push(`recent row "${destination}" has unparseable date "${dateRaw}"`);
      continue;
    }
    const date = `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
    const candidate = EvidenceStockingEventSchema.safeParse({
      sourceId: 'twra-recent-stockings',
      sourceUrl: pageUrl,
      date,
      datePrecision: 'day',
      status: 'reported-complete',
    });
    if (candidate.success) out.push({ event: candidate.data, destination });
    else skipped += 1;
  }
  return { rows: out, skipped, warnings };
}

export interface TwraEvidenceResult {
  /** Scheduled events WITH the originating row name/county (for alias resolution). */
  scheduleRows: { event: EvidenceStockingEvent; location: string; county?: string }[];
  /** Completed events WITH the originating destination name. */
  recentRows: { event: EvidenceStockingEvent; destination: string }[];
  warnings: string[];
}

/**
 * Parse captured TWRA artifacts (page HTML + every datatable JSON found) into the
 * two event classes. Tolerates a missing/changed grid: whatever parses, parses —
 * the caller records upstream errors from fetch failures separately.
 */
export function parseTwraEvidence(artifacts: { suffix: string; content: string; url: string }[], opts: TwraEvidenceOptions = {}): TwraEvidenceResult {
  const warnings: string[] = [];
  const scheduleRows: TwraEvidenceResult['scheduleRows'] = [];
  const recentRows: TwraEvidenceResult['recentRows'] = [];

  const jsons = artifacts.filter((a) => a.suffix.endsWith('.json'));
  // Multiple html artifacts can exist in a capture set (fixtures, archived pages):
  // the real stockings page is the largest one, and a tn.gov URL wins ties.
  const pages = artifacts.filter((a) => a.suffix === 'html' || a.suffix.endsWith('.html'));
  const page =
    pages.filter((a) => /tn\.gov|twra/i.test(a.url)).sort((a, b) => b.content.length - a.content.length)[0] ??
    pages.sort((a, b) => b.content.length - a.content.length)[0];
  const pageUrl = page?.url ?? TWRA_PAGE_URL;
  if (page && jsons.length === 0) {
    const paths = extractDatatableJsonPaths(page.content);
    if (paths.length > 0) warnings.push(`${paths.length} datatable URL(s) found in page but content not captured`);
  }

  let sawSchedule = false;
  let sawRecent = false;
  for (const json of jsons) {
    const { rows, warnings: w } = parseDatatableJson(json.content);
    warnings.push(...w);
    const kind = classifyTwraGrid(rows as Record<string, unknown>[]);
    if (kind === 'schedule') {
      sawSchedule = true;
      const r = scheduleRowsToEvidenceEvents(rows, pageUrl, opts);
      scheduleRows.push(...r.rows);
      warnings.push(...r.warnings);
    } else if (kind === 'recent') {
      sawRecent = true;
      const r = recentRowsToEvidenceEvents(rows as Record<string, unknown>[], pageUrl);
      recentRows.push(...r.rows);
      warnings.push(...r.warnings);
    } else if (rows.length > 0) {
      warnings.push('datatable with unrecognized column signature skipped');
    }
  }

  // Fallback: inline <table> if the CMS dropped the excel-driven JSONs.
  if (!sawSchedule && page) {
    const inline = parseInlineTable(page.content);
    if (inline.rows.length > 0) {
      warnings.push('used inline-table fallback for schedule grid');
      const r = scheduleRowsToEvidenceEvents(inline.rows, pageUrl, opts);
      scheduleRows.push(...r.rows);
      warnings.push(...r.warnings);
      sawSchedule = true;
    }
  }
  if (!sawSchedule) warnings.push('schedule grid not found (layout change or failed capture)');
  if (!sawRecent) warnings.push('recent-report grid not found (layout change or failed capture)');

  return { scheduleRows, recentRows, warnings };
}

export interface TwraFetchOptions {
  userAgent: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

/** Fetch the page + every datatable JSON it references (artifacts for parseTwraEvidence). */
export async function fetchTwraArtifacts(opts: TwraFetchOptions): Promise<
  { suffix: string; content: string; url: string; captureKind?: string }[]
> {
  const doFetch = opts.fetchImpl ?? fetch;
  const pageRes = await fetchWithRetry(() =>
    doFetch(TWRA_PAGE_URL, {
      headers: { 'User-Agent': opts.userAgent, Accept: 'text/html,application/xhtml+xml' },
      signal: AbortSignal.timeout(opts.timeoutMs ?? 30_000),
    }),
  );
  if (!pageRes.ok) throw new Error(`TWRA page fetch failed: HTTP ${pageRes.status}`);
  const html = await pageRes.text();
  const artifacts: { suffix: string; content: string; url: string }[] = [
    { suffix: 'html', content: html, url: TWRA_PAGE_URL },
  ];
  for (const path of extractDatatableJsonPaths(html)) {
    const url = /^https?:\/\//i.test(path) ? path : new URL(path, TWRA_PAGE_URL).toString();
    const jres = await fetchWithRetry(() =>
      doFetch(url, {
        headers: { 'User-Agent': opts.userAgent, Accept: 'application/json' },
        signal: AbortSignal.timeout(opts.timeoutMs ?? 30_000),
      }),
    );
    if (!jres.ok) throw new Error(`TWRA datatable fetch failed: HTTP ${jres.status} (${url})`);
    // F36: tag each grid by column-signature kind so the raw capture names (and
    // any consumer) can tell the schedule grid from the recent-report grid — the
    // shared 'exceldriven.json' suffix alone collides one onto the other.
    const content = await jres.text();
    const kind = classifyTwraGrid(parseDatatableJson(content).rows as Record<string, unknown>[]);
    artifacts.push({
      suffix: path.endsWith('.json') ? 'exceldriven.json' : path.slice(path.lastIndexOf('.') + 1),
      content,
      url,
      ...(kind === 'schedule' || kind === 'recent' ? { captureKind: kind } : {}),
    });
  }
  return artifacts;
}
