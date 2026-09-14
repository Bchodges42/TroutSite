// OWNER: ROLE 4. CI content gate (00-SHARED-CONTEXT §7): schema validation against the frozen
// @trout/contracts schemas + orphan references + gauge-ID lint (offline via the USGS-verified
// fixture) + SVG well-formedness + Definition-of-Done floors. Exit 1 on any issue.
import { loadContent, loadSpeciesReference, FLOORS } from './lib.js';

const { bugs, patterns, streams, shops, hatch, issues, warnings } = loadContent();
const { species, issues: speciesIssues } = loadSpeciesReference();
issues.push(...speciesIssues);

for (const [id, stream] of streams) {
  if (/cherokee\s+bass/i.test(JSON.stringify(stream))) {
    issues.push({ file: `streams/${id}.yaml`, message: 'Cherokee bass must remain an untyped hybrid label; never tokenize it as spotted-bass or striped-bass' });
  }
  for (const source of stream.officialSources) {
    if (!source.url.startsWith('https://')) {
      issues.push({ file: `streams/${id}.yaml`, message: `official source URL must use https://: ${source.url}` });
    }
  }
  for (const evidence of stream.speciesEvidence ?? []) {
    if (!evidence.url.startsWith('https://')) {
      issues.push({ file: `streams/${id}.yaml`, message: `species evidence URL must use https://: ${evidence.url}` });
    }
  }
}

// Species-reference coherence gate (F2): where bands are present they must be
// monotone — optimal at or below the avoidance ceiling, avoidance below lethal;
// spawn onset <= end.
const num = (v: { value?: number | null; min?: number | null; max?: number | null } | undefined, key: 'value' | 'min' | 'max') =>
  v && typeof v[key] === 'number' ? (v[key] as number) : undefined;
for (const [id, ref] of species) {
  const optimalMax = num(ref.comfort?.optimalC, 'max');
  const avoidance = num(ref.comfort?.avoidanceC, 'value');
  const lethal = num(ref.comfort?.lethalC, 'value');
  if (optimalMax !== undefined && avoidance !== undefined && optimalMax > avoidance) {
    issues.push({ file: 'species/', message: `${id}: optimal max ${optimalMax}°C is above the avoidance ceiling ${avoidance}°C` });
  }
  if (avoidance !== undefined && lethal !== undefined && avoidance >= lethal) {
    issues.push({ file: 'species/', message: `${id}: avoidance ${avoidance}°C is not below lethal ${lethal}°C` });
  }
  const onset = num(ref.spawn?.onsetC, 'value');
  const end = num(ref.spawn?.endC, 'value');
  if (onset !== undefined && end !== undefined && onset > end) {
    issues.push({ file: 'species/', message: `${id}: spawn onset ${onset}°C is above spawn end ${end}°C` });
  }
}

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
    `${patterns.size} patterns, ${hatch.size} regions × 12 months, ${streams.size} streams, ${shops.size} shops, ` +
    `${species.size} species references. Warnings: ${warnings.length}.`,
);

// Session-1 fishery/yearRound catalog coverage line (advisory; unset = evidence has not reached).
const streamList = [...streams.values()];
const fisheryByValue = streamList.reduce<Record<string, number>>((acc, s) => {
  if (s.fishery) acc[s.fishery] = (acc[s.fishery] ?? 0) + 1;
  return acc;
}, {});
const fisheryCount = streamList.filter((s) => s.fishery).length;
const yearRoundCount = streamList.filter((s) => s.yearRound !== undefined).length;
const breakdown = (Object.keys(fisheryByValue) as Array<keyof typeof fisheryByValue>)
  .sort()
  .map((k) => `${k} ${fisheryByValue[k]}`)
  .join(', ');
console.log(
  `[content] fishery set on ${fisheryCount}/${streams.size}${breakdown ? ` (${breakdown})` : ''}, ` +
    `yearRound on ${yearRoundCount}/${streams.size}.`,
);
