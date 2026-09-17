#!/usr/bin/env node
/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * TWRA official stocking-schedule ingest — the program CALENDAR.
 *
 * The map feed (twra-stocking.geojson) answers "which waters got stocked"
 * (points, coverage). The official schedule workbook answers "which waters
 * are PROGRAM waters, of what kind, in which months, stocked when" — exact
 * dates and TWRA's own program typology:
 *   Winter          cold-month put-and-take on a warm water (not a trout stream)
 *   Seasonal        the trout-season stocking program on a trout stream
 *   Tailwater       year-round tailwater program
 *   Delayed Harvest fall-to-spring C&R window on a designated section
 *   Weekly          weekly (year-round) small-water program
 *   Reservoir       reservoir stocking row
 *
 * That typology is also the plain-English answer to "seasonal vs winter":
 * they differ in the WATER they run on, not just the month — Winter is
 * cold-month recruitment on water too warm to hold trout otherwise;
 * Seasonal is the scheduled trout-season program on managed trout water.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT, normalizeName, normCounty } from './lib.mjs';

export const SCHEDULE_PATH = join(REPO_ROOT, 'packages', 'content', 'data', 'twra-stocking-schedule.json');

const MONTH_INITIALS = ['j', 'f', 'm', 'a', 'm', 'j', 'j', 'a', 's', 'o', 'n', 'd'];

/**
 * TWRA writes stocking windows as ordered month initials, e.g.
 * "M, A, M, J, J, A, S" = Mar–Sep. Reconstruct by walking the calendar
 * forward (wrapping past December) and consuming each initial in sequence:
 * 'J, F, M, N, D' → Jan, Feb, Mar, Nov, Dec.
 * Returns sorted month numbers, or null when the row has no window.
 */
export function parseMonthLetters(raw) {
  const text = String(raw ?? '').trim();
  if (!text) return null;
  const letters = text.toLowerCase().split(/[\s,;/]+/).filter(Boolean);
  if (!letters.length) return null;
  const months = [];
  let pointer = 0; // 0-based index into MONTH_INITIALS
  for (const letter of letters) {
    let steps = 0;
    while (MONTH_INITIALS[pointer] !== letter && steps < 12) {
      pointer = (pointer + 1) % 12;
      steps += 1;
    }
    if (steps >= 12) return null; // initial not in calendar — unparseable row
    months.push(pointer + 1);
    pointer = (pointer + 1) % 12;
  }
  return [...new Set(months)].sort((a, b) => a - b);
}

/** '1/14/2026' → '2026-01-14'. 'TBD 12/2026' → { tbd: '2026-12' }. */
export function parseScheduleDate(raw) {
  const text = String(raw ?? '').trim();
  if (!text) return null;
  const tbd = text.match(/^TBD\s+(\d{1,2})\/(\d{4})$/i);
  if (tbd) return { tbd: `${tbd[2]}-${String(Number(tbd[1])).padStart(2, '0')}` };
  const m = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    return `${m[3]}-${String(Number(m[1])).padStart(2, '0')}-${String(Number(m[2])).padStart(2, '0')}`;
  }
  return { unparsed: text };
}

const TYPE_MEANING = {
  Winter: 'winter put-and-take on a warm water (cold-month recruitment program)',
  Seasonal: 'scheduled trout-season program on managed trout water',
  Tailwater: 'year-round tailwater program',
  'Delayed Harvest': 'delayed-harvest window (fall stocking, C&R, spring harvest)',
  Weekly: 'weekly year-round program',
  Reservoir: 'reservoir stocking row',
};

export function programMeaning(type) {
  return TYPE_MEANING[type] ?? null;
}

function parseSpecies(raw) {
  return String(raw ?? '')
    .split(/[,/]/)
    .map((x) => x.trim().toLowerCase().replace(/\s+trout$/i, ' trout'))
    .filter(Boolean);
}

export function loadSchedule() {
  if (!existsSync(SCHEDULE_PATH)) return { schema: null, rows: [] };
  return JSON.parse(readFileSync(SCHEDULE_PATH, 'utf8'));
}

/** Schedule date values (day or week cells) → observed month number, or null
 * for TBD/unparsed values. Observed months across a water's rows are the
 * program's OPERATING window as actually scheduled. */
export function parseScheduleDateMonth(raw) {
  const parsed = parseScheduleDate(raw);
  if (typeof parsed === 'string') return Number(parsed.slice(5, 7));
  if (parsed?.tbd) return Number(parsed.tbd.slice(5, 7));
  return null;
}

/**
 * Resolve schedule rows onto catalog waters and derive per-water programs.
 * Schedule locations often use compound dam/river notation ("Normandy TW /
 * Duck River", "Dale Hollow TW / Obey River") — each '/' segment is tried
 * (with a bare "TW"/"Dam" tail stripped) and a UNIQUE resolution wins;
 * anything else queues. Returns { bySlug: Map<slug, program>, unmatched }.
 */
export function buildSchedulePrograms(catalog, rows = loadSchedule().rows, resolveEvent, aliases = {}) {
  const bySlug = new Map();
  const unmatched = [];
  const resolveScheduleLocation = (row) => {
    const event = {
      water: row.location,
      site: row.location,
      county: row.county ?? '',
      program: row.type ?? '',
      waterClass: '',
    };
    const direct = resolveEvent(event, catalog, aliases);
    if (direct.slug) return direct;
    const segments = String(row.location ?? '')
      .split('/')
      .map((seg) => seg.replace(/\s*(TW|Tailwater|Dam)\s*$/i, '').trim())
      .filter(Boolean);
    for (const seg of segments) {
      const hit = resolveEvent({ water: seg, site: row.location, county: row.county ?? '', program: row.type ?? '' }, catalog, aliases);
      if (hit.slug) return hit;
    }
    return direct;
  };
  for (const row of rows) {
    const resolution = resolveScheduleLocation(row);
    if (!resolution.slug) {
      unmatched.push({ location: row.location, county: row.county, type: row.type });
      continue;
    }
    const months = parseMonthLetters(row.stockingMonthsRaw);
    const day = parseScheduleDate(row.stockingDay);
    const entry = bySlug.get(resolution.slug) ?? {
      types: [],
      meaning: null,
      months: null, // declared windows (month-letter rows); null = none declared
      observedMonths: null, // months implied by the schedule's own day/week dates
      unpinnedTypes: [],
      lastStockedDay: null,
      nextTbd: null,
      rowCount: 0,
    };
    entry.rowCount += 1;
    for (const type of [row.type ?? 'Unspecified']) {
      if (!entry.types.includes(type)) entry.types.push(type);
    }
    if (months) {
      entry.months = [...new Set([...(entry.months ?? []), ...months])].sort((a, b) => a - b);
    } else if (!entry.months) {
      if (!entry.unpinnedTypes.includes(row.type ?? 'Unspecified')) entry.unpinnedTypes.push(row.type ?? 'Unspecified');
    }
    const observed = parseScheduleDateMonth(row.stockingDay) ?? parseScheduleDateMonth(row.stockingWeek);
    if (observed) {
      entry.observedMonths = [...new Set([...(entry.observedMonths ?? []), observed])].sort((a, b) => a - b);
    }
    if (typeof day === 'string') {
      if (!entry.lastStockedDay || day > entry.lastStockedDay) entry.lastStockedDay = day;
    } else if (day?.tbd && (!entry.nextTbd || day.tbd > entry.nextTbd)) {
      entry.nextTbd = day.tbd;
    }
    bySlug.set(resolution.slug, entry);
  }
  for (const [, entry] of bySlug) {
    entry.meaning = entry.types.map((t) => programMeaning(t) ?? t).join('; ');
    // the water's effective window: declared where TWRA declares one,
    // otherwise observed from its own scheduled dates
    entry.months = entry.months ?? entry.observedMonths;
  }
  return { bySlug, unmatched };
}

/** Normalized schedule location+county key (mirrors lib eventKey). */
export function scheduleKey(row) {
  return `${normalizeName(row.location ?? '')}|${normCounty(row.county ?? '')}`;
}
