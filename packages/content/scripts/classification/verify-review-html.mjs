#!/usr/bin/env node
/* eslint-disable no-undef */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const html = readFileSync(join(root, 'docs', 'research', '2026-09-17-classification-diff', 'JEV-REVIEW.html'), 'utf8');

const start = html.indexOf('const DATA = ') + 'const DATA = '.length;
const end = html.indexOf('\nvar CATS');
const s = html.slice(start, end).trimEnd().replace(/;$/, '');
const data = JSON.parse(s);

let ok = true;
const check = (label, cond) => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}`); if (!cond) ok = false; };

check(`190 result rows (${data.results.length})`, data.results.length === 190);
check(`0 error rows (${data.results.filter((r) => r.error).length})`, data.results.every((r) => !r.error));
check(`8 pre-existing labels (${Object.keys(data.existingLabels).length})`, Object.keys(data.existingLabels).length === 8);
check(`190 evidence entries (${Object.keys(data.evidence).length})`, Object.keys(data.evidence).length === 190);
const bt = data.evidence['boone-tailwater'];
check(`boone-tailwater featured/needs-segment-review/1 event`, bt.tier === 'featured' && bt.matchStatus === 'needs-segment-review' && bt.stockingEvents === 1);
check(`every row has confidence + rawChoice`, data.results.every((r) => typeof r.confidence === 'number' && !!r.rawChoice));
const nf = Object.values(data.evidence).filter((e) => e.matchStatus === 'not-found').length;
check(`43 not-found evidence rows (${nf})`, nf === 43);
check('no ownerReview key anywhere in payload', !s.includes('ownerReview'));
check('no unresolved template literals in page JS', !html.slice(html.indexOf('<script>')).includes('${'));
console.log(ok ? '\nREVIEW PAGE PAYLOAD OK' : '\nPAYLOAD PROBLEMS');
process.exit(ok ? 0 : 1);
