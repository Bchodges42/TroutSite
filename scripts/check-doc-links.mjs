#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ignoredDirectories = new Set([
  '.git',
  '.pnpm-store',
  'coverage',
  'dist',
  'node_modules',
  'playwright-report',
  'test-results',
  'audits',
  'reports',
]);

const ignoredFiles = new Set([
  'docs/DATA-SOURCE-COVERAGE.md', // generated evidence table contains bracket notation
]);

function markdownFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name))
        files.push(...markdownFiles(join(directory, entry.name)));
    } else if (entry.isFile() && extname(entry.name).toLowerCase() === '.md') {
      files.push(join(directory, entry.name));
    }
  }
  return files;
}

function localTarget(rawTarget) {
  let target = rawTarget.trim();
  if (target.startsWith('<') && target.endsWith('>')) target = target.slice(1, -1);
  if (!target || target.startsWith('#') || /^[a-z][a-z0-9+.-]*:/i.test(target)) return null;
  target = target.split('#', 1)[0].split('?', 1)[0];
  try {
    return decodeURIComponent(target);
  } catch {
    return target;
  }
}

const missing = [];
for (const file of markdownFiles(repoRoot)) {
  if (ignoredFiles.has(relative(repoRoot, file).replaceAll('\\', '/'))) continue;
  const text = readFileSync(file, 'utf8');
  const links = text.matchAll(/!?(?:\[[^\]]*\])\((<[^>]+>|[^\s)]+)(?:\s+['"][^'"]*['"])?\)/g);
  for (const match of links) {
    const target = localTarget(match[1]);
    if (!target) continue;
    const resolved = resolve(dirname(file), target);
    if (!existsSync(resolved)) {
      const line = text.slice(0, match.index).split(/\r?\n/).length;
      missing.push(`${relative(repoRoot, file)}:${line} -> ${target}`);
    }
  }
}

if (missing.length) {
  console.error(`Broken local Markdown links (${missing.length}):`);
  for (const item of missing) console.error(`- ${item}`);
  process.exitCode = 1;
} else {
  console.log('Documentation links: PASS');
}
