// OWNER: ROLE 4. Stub created by ROLE 1 (Phase 0) so the CI "content-validate" gate exists.
// ROLE 4: replace with the full gate from 00-SHARED-CONTEXT §7 —
// schema validation + orphan references + gauge-ID lint + SVG well-formedness.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';

const CONTENT_ROOT = resolve(process.cwd());
const ENTITY_DIRS = ['bugs', 'patterns', 'hatch', 'streams', 'shops'];

function collectYamlFiles(dir: string, out: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out; // entity dir not created yet — fine while the pack is empty
  }
  for (const entry of entries) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) collectYamlFiles(p, out);
    else if (entry.endsWith('.yaml') || entry.endsWith('.yml')) out.push(p);
  }
  return out;
}

const files = ENTITY_DIRS.flatMap((d) => collectYamlFiles(join(CONTENT_ROOT, d)));

if (files.length === 0) {
  console.log('[content] no YAML files yet — content pack is empty, validation skipped (OK)');
  process.exit(0);
}

let errors = 0;
for (const file of files) {
  try {
    parse(readFileSync(file, 'utf8'));
  } catch (err) {
    errors += 1;
    console.error(`[content] invalid YAML: ${file}: ${(err as Error).message}`);
  }
}

if (errors > 0) {
  console.error(`[content] FAILED: ${errors} invalid file(s)`);
  process.exit(1);
}
console.log(`[content] parsed ${files.length} YAML file(s) — no syntax errors (schema gate lands with ROLE 4)`);
