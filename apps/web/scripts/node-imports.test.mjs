import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

// Link-check the built-in imports without executing atlas builders/fetchers:
// those entrypoints mutate real assets or contact upstream services. A lint
// cleanup renamed unused exports to nonexistent names and broke ten commands.
test('atlas helper named node:fs imports are real exports', () => {
  const errors = [];
  let checked = 0;
  const visit = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) visit(path);
      if (!entry.isFile() || !entry.name.endsWith('.mjs')) continue;
      const source = fs.readFileSync(path, 'utf8');
      for (const match of source.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]node:fs['"]/g)) {
        checked++;
        for (const binding of match[1].split(',')) {
          const exported = binding.trim().split(/\s+as\s+/)[0];
          if (exported && !Object.hasOwn(fs, exported)) errors.push(`${path}: ${exported}`);
        }
      }
    }
  };
  visit(import.meta.dirname);
  assert.ok(checked > 10, 'check the source helpers, not an empty directory');
  assert.deepEqual(errors, [], 'Node rejects invalid named imports before the command can run');
});
