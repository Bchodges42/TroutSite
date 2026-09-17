#!/usr/bin/env node
/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * Official TWRA stocking-schedule report — the program CALENDAR as decision
 * boxes. Report-only; never writes catalog YAML.
 *
 *   node packages/content/scripts/classification/schedule-report.mjs [--write]
 *
 * Produces, per resolved catalog water: program types (Winter / Seasonal /
 * Tailwater / Delayed Harvest / Weekly / Reservoir), month windows, exact
 * stocking dates — then:
 *   Box A  calendar gaps: schedule program months vs catalog seasonMonths
 *   Box B  stockingProgram flags the schedule can now replace
 *   Box C  stocked waters with no catalog water (candidate adds — the
 *          known "McKenzie City Park" class of gaps)
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadCatalog, ALIASES, resolveEvent, REPO_ROOT, DIFF_OUT_DIR } from './lib.mjs';
import { loadSchedule, buildSchedulePrograms } from './stocking-schedule.mjs';

const write = process.argv.includes('--write');
const catalog = loadCatalog();
const { bySlug, unmatched } = buildSchedulePrograms(catalog, loadSchedule().rows, resolveEvent, ALIASES);

const waters = [];
for (const { slug, doc } of catalog) {
  const program = bySlug.get(slug);
  if (!program) continue;
  waters.push({
    slug,
    catalog: { seasonMonths: doc.seasonMonths ?? null, stockingProgram: doc.stockingProgram === true ? true : undefined, yearRound: doc.yearRound ?? null },
    schedule: {
      types: program.types,
      meaning: program.meaning,
      months: program.months,
      windowPinned: program.months !== null,
      lastStockedDay: program.lastStockedDay,
      nextScheduledDay: program.nextTbd,
      rowCount: program.rowCount,
    },
  });
}

const calendarGaps = waters.filter((w) => w.schedule.months && w.catalog.seasonMonths
  && JSON.stringify(w.schedule.months) !== JSON.stringify([...w.catalog.seasonMonths].sort((a, b) => a - b)));
const flagReplacements = waters.filter((w) => w.catalog.stockingProgram);
const uniqueUnmatched = [...new Map(unmatched.map((u) => [`${u.location}|${u.county}`, u])).values()];

const summary = {
  scheduleRows: loadSchedule().rowCount,
  resolvedWaters: waters.length,
  unmatchedRows: unmatched.length,
  uniqueUnmatchedLocations: uniqueUnmatched.length,
  calendarGaps: calendarGaps.length,
  flagReplacements: flagReplacements.length,
  watersWithPinnedWindows: waters.filter((w) => w.schedule.windowPinned).length,
  watersWithExactDates: waters.filter((w) => w.schedule.lastStockedDay).length,
};

if (write) {
  mkdirSync(DIFF_OUT_DIR, { recursive: true });
  writeFileSync(join(DIFF_OUT_DIR, 'schedule-report.json'), JSON.stringify({ generated: new Date().toISOString(), summary, waters, unmatched: uniqueUnmatched }, null, 2));
}

console.log(JSON.stringify(summary, null, 2));
if (write) {
  const rel = (p) => p.slice(REPO_ROOT.length + 1);
  const report = `# TWRA STOCKING SCHEDULE — program calendar decision boxes (report-only)

Generated ${new Date().toISOString().slice(0, 10)} from the official TWRA schedule workbook
(\`${rel(join('packages', 'content', 'research', 'twra-stockings-2026.xlsx'))}\`, ${summary.scheduleRows} rows).
The schedule is the authoritative program CALENDAR (types, month windows, exact dates);
the map feed remains the coverage source. Nothing here is applied to the catalog.

## Summary

| Metric | Count |
|---|---|
| Catalog waters with a resolved schedule program | ${summary.resolvedWaters} |
| …with pinned month windows | ${summary.watersWithPinnedWindows} |
| …with exact stocking dates (recency!) | ${summary.watersWithExactDates} |
| Calendar gaps (schedule months ≠ catalog seasonMonths) | ${summary.calendarGaps} |
| stockingProgram flags replaceable from the schedule | ${summary.flagReplacements} |
| Schedule locations with no catalog water (candidate adds) | ${summary.uniqueUnmatchedLocations} (of ${summary.unmatchedRows} rows) |

## Program types, in plain English

- **Winter** — cold-month put-and-take on a water too warm for trout most of the year. The water stays warmwater; trout are seasonal visitors.
- **Seasonal** — the scheduled trout-season program on managed trout water; the water IS trout water, stocked in its season.
- **Tailwater / Weekly** — year-round programs (cold releases / repeated stocking).
- **Delayed Harvest** — fall stocking, catch-and-release through winter, spring harvest.

## Box A — calendar gaps (schedule vs catalog seasonMonths)

${calendarGaps.length ? calendarGaps.map((w) => `- **${w.slug}**: schedule ${JSON.stringify(w.schedule.months)} (${w.schedule.types.join('/')}) vs catalog ${JSON.stringify(w.catalog.seasonMonths)}`).join('\n') : '_none_'}

## Box B — hand-set stockingProgram flags the schedule can replace

${flagReplacements.length} waters still carry the deprecated boolean; ${waters.filter((w) => w.catalog.stockingProgram).filter((w) => w.schedule).length} of them now have a schedule-backed program view.

## Box C — stocked waters missing from the catalog (candidate adds)

<details><summary>${uniqueUnmatched.length} locations (owner: some are access points for catalog waters; some are true gaps like McKenzie City Park)</summary>

\`\`\`
${uniqueUnmatched.map((u) => `${u.location} (${u.county}) — ${u.type}`).join('\n')}
\`\`\`
</details>

Machine-readable: \`${rel(DIFF_OUT_DIR)}/schedule-report.json\`.
`;
  writeFileSync(join(DIFF_OUT_DIR, 'SCHEDULE-REPORT.md'), report);
  console.log(`wrote ${join(DIFF_OUT_DIR, 'SCHEDULE-REPORT.md')}`);
}
