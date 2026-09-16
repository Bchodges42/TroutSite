#!/usr/bin/env node
/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * Batch C — Regulations: notes prefixes (import plan D4 prose path).
 *
 * For every roster water whose ledger carries a documented special regulation
 * (diff.json hasSpecialRegs) and whose notes lack a `Regulations:` prefix,
 * append a condensed lead from the ledger's Regulations line: metadata tails
 * (| Source / | Accessed / | Obs) stripped, sentence-bounded, ≤ 260 chars.
 * Verified-negative waters ("statewide rules only") get nothing — silence is
 * the honest default; only documented rules ship.
 *
 *   node packages/content/scripts/wave-ledgers/apply-regs-notes.mjs [--dry-run]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, stringify } from 'yaml';

const dryRun = process.argv.includes('--dry-run');
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const ledgerDir = join(root, 'docs', 'research', '2026-09-15-wave-ledgers');
const catalogDir = join(root, 'packages', 'content', 'streams', 'tn');

const { rows } = JSON.parse(readFileSync(join(ledgerDir, 'ledger', 'diff.json'), 'utf8'));
const { waters } = JSON.parse(readFileSync(join(ledgerDir, 'ledger', 'waters.json'), 'utf8'));

function condense(line) {
  let t = line
    .replace(/\|\s*Source:.*$/i, '')
    .replace(/\|\s*(Accessed|Obs|Endpoint|Period|Status):.*$/gi, '')
    .replace(/\((?:see )?officialSources\)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (t.length <= 260) return t;
  const cut = t.slice(0, 260);
  const stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('; '));
  t = stop > 80 ? cut.slice(0, stop + 1) : `${cut.trimEnd()}…`;
  return t.trim();
}

let applied = 0;
let skipped = 0;
for (const row of rows) {
  if (!row.hasSpecialRegs) continue;
  const path = join(catalogDir, `${row.slug}.yaml`);
  const doc = parse(readFileSync(path, 'utf8'));
  const notes = typeof doc.notes === 'string' ? doc.notes : '';
  if (/Regulations:/i.test(notes)) {
    skipped += 1;
    continue;
  }
  // pull the full lead line from the ledger block (the diff row only stores a
  // 140-char preview)
  const b = waters.find((w) => w.slug === row.slug);
  const lead = (b?.slots.Regulations ?? []).find((s) => !s.noneFound && !/statewide trout (rules|regulations|creel)|no special|no [a-z]+-specific|general trout regs|absent from twra/i.test(s.value));
  if (!lead) continue;
  const text = condense(lead.value);
  if (text.length < 20) continue;
  const out = notes.trimEnd() ? `${notes.trimEnd()}\n\nRegulations: ${text} (retrieved 2026-09-14; verify current rules with TWRA before you go).` : `Regulations: ${text} (retrieved 2026-09-14; verify current rules with TWRA before you go).`;
  doc.notes = out;
  console.log(`  ${row.slug}: ${text.slice(0, 90)}`);
  applied += 1;
  if (!dryRun) writeFileSync(path, stringify(doc, { lineWidth: 110 }));
}
console.log(`[regs] ${dryRun ? 'dry run —' : ''} applied ${applied}, skipped (already prefixed) ${skipped}`);
