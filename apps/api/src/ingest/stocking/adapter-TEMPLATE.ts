// adapter-TEMPLATE.ts — how to add state #2 in under a day (non-negotiable #3 style guide).
//
// DO NOT ship this file as a working adapter. Copy it, rename it, fill the CAPS
// placeholders, register it in stocking/index.ts getAdapters(), record fixtures, test.
//
// ── Checklist (from 00-SHARED-CONTEXT §8 + Role-3 non-negotiables) ──────────────
//  1. RESEARCH the official page(s). Prefer structured data (tables, JSON, calendar
//     feeds) over prose. Note in a comment: page URL, researched date, layout pattern.
//  2. fetchLatest(ctx): fetch with ctx.userAgent (realistic UA), AbortSignal.timeout,
//     check res.ok, return RawFetch { artifacts, fetchedAt }. EVERY byte the parse
//     depends on goes into artifacts (page HTML + each JSON/table file).
//  3. normalize(raw, ctx): PURE. No fetch, no Date.now (use ctx.now), no randomness.
//     Skip rows you cannot map, collect `warnings` instead of throwing. A redesign
//     must yield { events: [...maybe stale...], warnings } — never an exception.
//  4. Map into StockingEvent (packages/contracts): id via deterministicId('<ST>',
//     ...all keys of the row) so re-scrapes upsert; date = YYYY-MM-DD; species enum;
//     sourceUrl = the official page; fetchedAt = raw.fetchedAt.
//  5. FIXTURES: apps/api/fixtures/<ST>/ — real captured page + payload, plus a
//     redesign/truncated case. Tests: normalize happy path, soft-fail path,
//     id determinism, schema validation.
//  6. Register in getAdapters() and add the state to the dry-run + snapshot wiring.
// ─────────────────────────────────────────────────────────────────────────────────

import { StockingEventSchema } from '@trout/contracts';
import type { StockingEvent } from '@trout/contracts';
import { deterministicId } from '../../lib/ids.js';
import type { FetchCtx, NormalizeCtx, NormalizeResult, RawFetch, StateAdapter } from './types.js';

const STATE_PAGE_URL = 'https://example.state.gov/<STATE>/stocking';

export const templateAdapter: StateAdapter = {
  stateId: 'XX',
  sourceUrl: STATE_PAGE_URL,

  async fetchLatest(ctx: FetchCtx): Promise<RawFetch> {
    const res = await ctx.fetchImpl(STATE_PAGE_URL, {
      headers: { 'User-Agent': ctx.userAgent, Accept: 'text/html' },
      signal: AbortSignal.timeout(ctx.timeoutMs ?? 30_000),
    });
    if (!res.ok) throw new Error(`<STATE> page fetch failed: HTTP ${res.status}`);
    const html = await res.text();
    // If the data lives in a secondary JSON/CSV file, extract its URL from the page
    // (like tn.ts does with the data-config attribute) and push it as another artifact.
    return { artifacts: [{ suffix: 'html', content: html, url: STATE_PAGE_URL }], fetchedAt: ctx.now.toISOString() };
  },

  normalize(raw: RawFetch, _ctx: NormalizeCtx): NormalizeResult {
    const warnings: string[] = [];
    const page = raw.artifacts.find((a) => a.suffix === 'html');
    if (!page) {
      warnings.push('no html artifact captured');
      return { events: [], warnings };
    }

    // Parse `page.content` tolerantly here. Skip + warn per unusable row.
    const rows: { streamName: string; date: string; species: StockingEvent['species'] }[] = [];
    void rows;

    const events: StockingEvent[] = rows.map((r) =>
      StockingEventSchema.parse({
        id: deterministicId('XX', r.streamName, r.species, r.date),
        stateId: 'XX',
        streamName: r.streamName,
        species: r.species,
        date: r.date,
        sourceUrl: STATE_PAGE_URL,
        fetchedAt: raw.fetchedAt,
      }),
    );
    return { events, warnings };
  },
};
