/* eslint-disable no-undef -- Node script run directly */
/**
 * One-off repair (integration 2026-09-08): the east rebuild's dam-joint weld
 * stamped several topology dam.name fields with the verbose
 * "<Dam> — <gauge anchor>" fallback instead of the short dam convention used
 * by the builder config and pinned by test/east-southeast-atlas.test.ts
 * ('Norris Dam', 'Boone Dam', 'Fort Patrick Henry Dam', ...). Normalize every
 * dam.name to the text before the first " — " separator.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = new URL('../atlas-sources/verified/east-southeast.topology.json', import.meta.url);

const topology = JSON.parse(readFileSync(FILE, 'utf8'));
const changes = [];
const fix = (dam) => {
  if (typeof dam?.name === 'string' && dam.name.includes(' — ')) {
    const short = dam.name.split(' — ')[0].trim();
    changes.push(`${dam.name} -> ${short}`);
    dam.name = short;
  }
};
for (const rec of topology.records ?? []) fix(rec?.dam);
if (changes.length === 0) throw new Error('no verbose dam names found — nothing to fix');
writeFileSync(FILE, JSON.stringify(topology, null, 1) + '\n');
console.log(`fix-dam-names: normalized ${changes.length} record(s):`);
for (const c of changes) console.log(`  ${c}`);
