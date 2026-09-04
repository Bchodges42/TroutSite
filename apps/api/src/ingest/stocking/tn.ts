import { StockingEventSchema } from '@trout/contracts';
import type { StockingEvent } from '@trout/contracts';
import { deterministicId } from '../../lib/ids.js';
import { fetchWithRetry } from '../../lib/retry.js';
import type { FetchCtx, NormalizeCtx, NormalizeResult, RawArtifact, RawFetch, StateAdapter } from './types.js';

/**
 * Adapter: Tennessee Wildlife Resources Agency (TWRA) trout stocking schedule.
 *
 * Source researched 2026-09-02: https://www.tn.gov/twra/fishing/trout-information-stockings.html
 * The page renders a DataTables grid whose rows live in a separate "excel-driven" JSON
 * file (a tn.gov CMS pattern) referenced from the page's data-config attribute:
 *   {..., "ajax": "/twra/fishing/trout-information-stockings/_jcr_content/
 *        contentFullWidth/tn_complex_datatable_<id>.exceldriven.json"}
 * The <id> changes on CMS redeploys, so the adapter NEVER hardcodes it — it re-resolves
 * the JSON URL from the page HTML on every fetch, falling back to inline <table> parsing.
 *
 * Row shape: { REGION, COUNTY, LOCATION, TYPE, "STOCKING DAY", "STOCKING WEEK",
 *              "STOCKING MONTHS", SPECIES }
 *  - STOCKING DAY: "1/14/2026" (exact) or "TBD 12/2026" (month precision) or ""
 *  - STOCKING WEEK: Sunday "week of" date, e.g. "6/7/2026" — event occurs within 5 days after
 *  - STOCKING MONTHS: month initials "J, F, M" (no year) — recurring monthly windows
 * Mapping to StockingEvent: date = exact day > week-of > first-of-month (TBD/months,
 * months expand to their next occurrence after ctx.now); one event per species listed.
 */

export const TWRA_PAGE_URL = 'https://www.tn.gov/twra/fishing/trout-information-stockings.html';

interface TwraRow {
  REGION?: string;
  COUNTY?: string;
  LOCATION?: string;
  TYPE?: string;
  'STOCKING DAY'?: string;
  'STOCKING WEEK'?: string;
  'STOCKING MONTHS'?: string;
  SPECIES?: string;
}

interface TwraJson {
  data?: TwraRow[];
}

/** Calendar-month candidates for each TWRA month initial (J: Jan/Jun/Jul, M: Mar/May, A: Apr/Aug). */
const INITIAL_CANDIDATES: Record<string, number[]> = {
  J: [1, 6, 7],
  F: [2],
  M: [3, 5],
  A: [4, 8],
  S: [9],
  O: [10],
  N: [11],
  D: [12],
};

/**
 * "J, F, M, A, M, J, J, A, S, O, N, D" — initials are ambiguous, so walk the list in
 * calendar order: each token takes the smallest unused month > the previous one that
 * its initial can represent (TWRA lists months in calendar order).
 */
export function parseMonthInitials(s: string): number[] {
  const tokens = s
    .split(/[,\s]+/)
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean);
  const months: number[] = [];
  let cursor = 0;
  for (const t of tokens) {
    const candidates = INITIAL_CANDIDATES[t];
    if (!candidates) continue;
    const month = candidates.find((m) => m > cursor);
    if (month === undefined) continue;
    months.push(month);
    cursor = month;
  }
  return months;
}

/** "Rainbow, Brown Trout" → ['rainbow', 'brown']; unknown words → 'other'. */
function parseSpecies(s: string): StockingEvent['species'][] {
  const lower = s.toLowerCase();
  const out: StockingEvent['species'][] = [];
  const push = (k: StockingEvent['species']): void => {
    if (!out.includes(k)) out.push(k);
  };
  if (lower.includes('rainbow') && lower.includes('cutthroat')) push('cutbow');
  else if (lower.includes('cutbow')) push('cutbow');
  else if (lower.includes('cutthroat')) push('cutbow');
  if (lower.includes('rainbow')) push('rainbow');
  if (lower.includes('brown')) push('brown');
  if (lower.includes('brook')) push('brook');
  if (out.length === 0) push('other');
  return out;
}

/** M/D/YYYY or M/D/YY → {y, m, d}; null when not an exact date. */
function parseExactDate(s: string): string | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(s.trim());
  if (!m) return null;
  const month = Number(m[1]);
  const day = Number(m[2]);
  let year = Number(m[3]);
  if (year < 100) year += 2000;
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 2020 || year > 2100) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** "TBD 12/2026" | "12/2026" | "TBD December 2026" → year+month; null otherwise. */
function parseTbdMonth(s: string): { year: number; month: number } | null {
  const m = /(\d{1,2})\s*\/\s*(\d{4})/.exec(s);
  if (m) {
    const month = Number(m[1]);
    const year = Number(m[2]);
    if (month >= 1 && month <= 12) return { year, month };
  }
  return null;
}

/** Next occurrence of calendar month `month` strictly at/after `from`'s month. */
function nextMonthDate(month: number, from: Date): string {
  const y = from.getUTCFullYear();
  const m0 = from.getUTCMonth() + 1;
  const year = month < m0 ? y + 1 : y;
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

function cleanWhitespace(s: string | undefined): string | undefined {
  if (s === undefined) return undefined;
  const v = s.replace(/\s+/g, ' ').trim();
  return v.length > 0 ? v : undefined;
}

function resolveDate(row: TwraRow, now: Date): {
  date: string | null;
  /** How precise the published source date is ('day' | 'week' | 'month'). */
  precision: 'day' | 'week' | 'month' | null;
  warnings: string[];
} {
  const day = cleanWhitespace(row['STOCKING DAY']);
  const week = cleanWhitespace(row['STOCKING WEEK']);
  const months = cleanWhitespace(row['STOCKING MONTHS']);

  if (day) {
    const exact = parseExactDate(day);
    if (exact) return { date: exact, precision: 'day', warnings: [] };
    const tbd = parseTbdMonth(day);
    if (tbd) {
      return {
        date: `${tbd.year}-${String(tbd.month).padStart(2, '0')}-01`,
        precision: 'month',
        warnings: [],
      };
    }
    const weekDate = week ? parseExactDate(week) : null;
    if (weekDate) {
      return {
        date: weekDate,
        precision: 'week',
        warnings: [`unparseable STOCKING DAY "${day}", used STOCKING WEEK`],
      };
    }
  } else if (week) {
    const weekDate = parseExactDate(week);
    if (weekDate) return { date: weekDate, precision: 'week', warnings: [] };
  }

  if (months) {
    const list = parseMonthInitials(months);
    const first = list[0];
    if (first !== undefined) {
      return { date: nextMonthDate(first, now), precision: 'month', warnings: [] };
    }
  }
  return { date: null, precision: null, warnings: [] };
}

/** Decode the tn.gov CMS data-config attribute and pull every excel-driven JSON path. */
export function extractDatatableJsonPaths(pageHtml: string): string[] {
  const paths = new Set<string>();
  const configRe = /data-config='([^']*)'/g;
  for (const m of pageHtml.matchAll(configRe)) {
    const raw = m[1];
    if (raw === undefined) continue;
    const decoded = raw
      .replace(/&#34;|&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&');
    try {
      const cfg = JSON.parse(decoded) as { ajax?: unknown };
      if (typeof cfg.ajax === 'string' && cfg.ajax.includes('.json')) paths.add(cfg.ajax);
    } catch {
      // malformed config — skip; other config blocks or the table fallback may still work
    }
  }
  // Belt-and-braces regex for non-standard encodings of the same attribute.
  const loose = /ajax(?:&#34;|&quot;|")\s*:\s*(?:&#34;|&quot;|")([^&#"']+\.exceldriven\.json)/g;
  for (const m of pageHtml.matchAll(loose)) {
    if (m[1]) paths.add(m[1]);
  }
  return [...paths];
}

function toAbsoluteUrl(pathOrUrl: string, pageUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return new URL(pathOrUrl, pageUrl).toString();
}

/** Parse the excel-driven JSON payload (pure). */
export function parseDatatableJson(jsonText: string): { rows: TwraRow[]; warnings: string[] } {
  let parsed: TwraJson;
  try {
    parsed = JSON.parse(jsonText) as TwraJson;
  } catch (err) {
    return { rows: [], warnings: [`datatable JSON unparseable: ${(err as Error).message}`] };
  }
  if (!Array.isArray(parsed?.data)) {
    return { rows: [], warnings: ['datatable JSON has no data array'] };
  }
  return { rows: parsed.data, warnings: [] };
}

/**
 * Tolerant fallback: parse an inline <table class="dataTable"> (used when the CMS
 * redesign drops the excel-driven JSON but still ships a plain table).
 */
export function parseInlineTable(html: string): { rows: TwraRow[]; warnings: string[] } {
  const warnings: string[] = [];
  const tableMatch = /<table[^>]*class="[^"]*dataTable[^"]*"[^>]*>([\s\S]*?)<\/table>/i.exec(html);
  const table = tableMatch?.[1];
  if (!tableMatch || !table) return { rows: [], warnings: [] };

  const headers = [...table.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)].map((m) =>
    (m[1] ?? '').replace(/<[^>]*>/g, '').trim().toUpperCase(),
  );
  if (headers.length === 0 || !table.includes('<tbody')) {
    warnings.push('inline dataTable present but has no header/body to parse');
    return { rows: [], warnings };
  }
  const rows: TwraRow[] = [];
  const body = /<tbody[^>]*>([\s\S]*?)<\/tbody>/i.exec(table);
  for (const trMatch of (body?.[1] ?? '').matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...(trMatch[1] ?? '').matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) =>
      (m[1] ?? '').replace(/<[^>]*>/g, '').replace(/&#?\w+;/g, ' ').replace(/\s+/g, ' ').trim(),
    );
    if (cells.length === 0) continue;
    const row: TwraRow = {};
    headers.forEach((h, i) => {
      row[h as keyof TwraRow] = cells[i];
    });
    rows.push(row);
  }
  if (rows.length === 0) warnings.push('inline dataTable parsed to zero rows');
  return { rows, warnings };
}

function rowToEvents(row: TwraRow, pageUrl: string, fetchedAt: string, now: Date): {
  events: StockingEvent[];
  warning?: string;
} {
  const location = cleanWhitespace(row.LOCATION);
  if (!location) return { events: [], warning: 'row without LOCATION skipped' };

  const { date, precision, warnings } = resolveDate(row, now);
  if (!date) {
    return { events: [], warning: `no usable date for "${location}" (${row['STOCKING DAY'] ?? ''} / ${row['STOCKING WEEK'] ?? ''} / ${row['STOCKING MONTHS'] ?? ''})` };
  }
  const county = cleanWhitespace(row.COUNTY);
  const type = cleanWhitespace(row.TYPE);
  const species = parseSpecies(row.SPECIES ?? '');

  const events: StockingEvent[] = [];
  for (const sp of species) {
    const candidate = StockingEventSchema.safeParse({
      id: deterministicId('TN', location, county ?? '', sp, date, type ?? ''),
      stateId: 'TN',
      streamName: location,
      ...(county ? { county } : {}),
      species: sp,
      date,
      // B09: 'date' normalizes week/month windows to their first day — the
      // precision tier tells the UI to say "published schedule", never
      // "stocked today", unless the source published an exact day.
      ...(precision ? { datePrecision: precision } : {}),
      sourceUrl: pageUrl,
      fetchedAt,
    });
    if (candidate.success) events.push(candidate.data);
    else warnings.push(`row "${location}" (${sp}) failed contract validation: ${candidate.error.issues[0]?.message ?? 'unknown'}`);
  }
  return { events, warning: warnings.length > 0 ? warnings.join('; ') : undefined };
}

/** Pure normalization of captured TWRA artifacts into StockingEvents. */
export function normalizeTwra(raw: RawFetch, ctx: NormalizeCtx): NormalizeResult {
  const warnings: string[] = [];
  const page = raw.artifacts.find((a) => a.suffix === 'html');
  const jsonArtifact = raw.artifacts.find((a) => a.suffix.endsWith('.json'));

  let rows: TwraRow[] = [];
  if (jsonArtifact) {
    const parsed = parseDatatableJson(jsonArtifact.content);
    rows = parsed.rows;
    warnings.push(...parsed.warnings);
  }
  if (rows.length === 0 && page) {
    const jsonPaths = extractDatatableJsonPaths(page.content);
    if (jsonArtifact === undefined && jsonPaths.length > 0) {
      warnings.push(`${jsonPaths.length} datatable JSON URL(s) found in page but content not captured`);
    }
    const inline = parseInlineTable(page.content);
    rows = inline.rows;
    warnings.push(...inline.warnings);
    if (rows.length > 0) warnings.push('used inline-table fallback');
  }
  if (rows.length === 0) {
    warnings.push('no stocking rows parsed — site layout may have changed (soft-fail, stale data kept)');
    return { events: [], warnings };
  }

  const fetchedAt = raw.fetchedAt;
  const events: StockingEvent[] = [];
  let skipped = 0;
  for (const row of rows) {
    const { events: evts, warning } = rowToEvents(row, page?.url ?? TWRA_PAGE_URL, fetchedAt, ctx.now);
    if (warning) warnings.push(warning);
    if (evts.length === 0) skipped += 1;
    events.push(...evts);
  }
  if (skipped > 0) warnings.push(`${skipped} of ${rows.length} rows produced no event`);

  // Dedupe (same row can produce identical ids when month tokens repeat) and sort.
  const byId = new Map(events.map((e) => [e.id, e]));
  return {
    events: [...byId.values()].sort((a, b) => a.date.localeCompare(b.date) || a.streamName.localeCompare(b.streamName)),
    warnings,
  };
}

export const tnAdapter: StateAdapter = {
  stateId: 'TN',
  sourceUrl: TWRA_PAGE_URL,
  async fetchLatest(ctx: FetchCtx): Promise<RawFetch> {
    const pageUrl = TWRA_PAGE_URL;
    const res = await fetchWithRetry(() =>
      ctx.fetchImpl(pageUrl, {
        headers: {
          // Realistic browser User-Agent (non-negotiable #2); no cookies, no tracking.
          'User-Agent': ctx.userAgent,
          Accept: 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout(ctx.timeoutMs ?? 30_000),
      }),
    );
    if (!res.ok) throw new Error(`TWRA page fetch failed: HTTP ${res.status} (${pageUrl})`);
    const html = await res.text();

    const artifacts: RawArtifact[] = [{ suffix: 'html', content: html, url: pageUrl }];
    for (const path of extractDatatableJsonPaths(html)) {
      const url = toAbsoluteUrl(path, pageUrl);
      const jres = await fetchWithRetry(() =>
        ctx.fetchImpl(url, {
          headers: { 'User-Agent': ctx.userAgent, Accept: 'application/json' },
          signal: AbortSignal.timeout(ctx.timeoutMs ?? 30_000),
        }),
      );
      if (!jres.ok) {
        throw new Error(`TWRA datatable fetch failed: HTTP ${jres.status} (${url})`);
      }
      artifacts.push({ suffix: 'exceldriven.json', content: await jres.text(), url });
    }
    return { artifacts, fetchedAt: ctx.now.toISOString() };
  },
  normalize: normalizeTwra,
};
