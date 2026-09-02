// OWNER: ROLE 4. CI content gate (00-SHARED-CONTEXT §7): schema validation against the frozen
// @trout/contracts schemas + orphan references + gauge-ID lint (offline via the USGS-verified
// fixture) + SVG well-formedness + Definition-of-Done floors. Exit 1 on any issue.
import { loadContent, FLOORS } from './lib.js';

const { bugs, patterns, streams, shops, hatch, issues, warnings } = loadContent();

for (const w of warnings) console.warn(`[content] WARN ${w.file}: ${w.message}`);

if (issues.length > 0) {
  for (const i of issues) console.error(`[content] FAIL ${i.file}: ${i.message}`);
  console.error(`[content] FAILED: ${issues.length} issue(s)`);
  process.exit(1);
}

const floorFails: string[] = [];
if (bugs.size < FLOORS.bugs) floorFails.push(`bugs ${bugs.size} < ${FLOORS.bugs}`);
if (patterns.size < FLOORS.patterns) floorFails.push(`patterns ${patterns.size} < ${FLOORS.patterns}`);
if (streams.size < FLOORS.streams) floorFails.push(`streams ${streams.size} < ${FLOORS.streams}`);
if (shops.size < FLOORS.shops) floorFails.push(`shops ${shops.size} < ${FLOORS.shops}`);
if (hatch.size === 0) floorFails.push('no hatch charts');
if (floorFails.length > 0) {
  for (const f of floorFails) console.error(`[content] FAIL floor: ${f}`);
  process.exit(1);
}

console.log(
  `[content] OK — ${bugs.size} taxa (+${[...bugs.values()].filter((b) => b.illustration).length} SVGs), ` +
    `${patterns.size} patterns, ${hatch.size} regions × 12 months, ${streams.size} streams, ${shops.size} shops. ` +
    `Warnings: ${warnings.length}.`,
);
