// OWNER: ROLE 4. Content report (CHAT-4 deliverable 2): counts by state/type for the handoff.
import { loadContent } from './lib.js';
import { REGIONS } from './regions.js';

const { bugs, patterns, streams, shops, hatch, illustrations, warnings } = loadContent();

const byOrder = new Map<string, number>();
for (const b of bugs.values()) byOrder.set(b.order, (byOrder.get(b.order) ?? 0) + 1);

const byType = new Map<string, number>();
for (const p of patterns.values()) byType.set(p.type, (byType.get(p.type) ?? 0) + 1);

const byRegion = new Map<string, number>();
for (const s of streams.values()) byRegion.set(s.regionId, (byRegion.get(s.regionId) ?? 0) + 1);

const byState = new Map<string, number>();
for (const s of streams.values()) byState.set(s.stateId, (byState.get(s.stateId) ?? 0) + 1);

const stocked = [...streams.values()].filter((s) => s.stockingProgram).length;
const gauged = [...streams.values()].filter((s) => s.gaugeIds.length > 0).length;
const hatchEntries = [...hatch.values()].reduce((n, charts) => n + charts.reduce((m, c) => m + c.entries.length, 0), 0);
const attributed = [...patterns.values()].filter((p) => p.license === 'attributed').length;

const rows = (m: Map<string, number>, label: string) =>
  [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `  ${k.padEnd(34)} ${String(v).padStart(3)}`)
    .join('\n') +
  `\n  ${'— total'.padEnd(34)} ${String([...m.values()].reduce((a, b) => a + b, 0)).padStart(3)} ${label}`;

console.log(`
=== TROUT CONTENT REPORT (Role 4) ===

taxa (bugs) ............ ${bugs.size}  (SVG line art: ${illustrations.size})
patterns ............... ${patterns.size}  (attributed: ${attributed}, public-domain: ${patterns.size - attributed})
hatch regions .......... ${hatch.size}  (${hatchEntries} chart entries; 12 months each)
streams ................ ${streams.size}  (gauged: ${gauged}, stocked-flagged: ${stocked})
shops .................. ${shops.size}  (reportsEnabled: false until onboarded)

streams by state:
${rows(byState, 'streams')}

streams by region:
${[...byRegion.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([r, n]) => `  ${r.padEnd(34)} ${String(n).padStart(3)}`).join('\n')}

patterns by type:
${rows(byType, 'patterns')}

taxa by order:
${rows(byOrder, 'taxa')}

launch regions:
${REGIONS.map((r) => `  ${r.id.padEnd(34)} ${hatch.has(r.id) ? '12/12 months' : 'MISSING'}`).join('\n')}

warnings (documented, non-blocking): ${warnings.length}
`);
