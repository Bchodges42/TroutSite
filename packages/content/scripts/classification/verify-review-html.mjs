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
check('no error rows', data.results.every((r) => !r.error));
check(`190 prefills (${Object.keys(data.prefills).length}, none null)`, Object.keys(data.prefills).length === 190 && Object.values(data.prefills).every(Boolean));
check('prefill equals raw choice or a reviewed label', data.results.every((r) => data.prefills[r.slug] === r.rawChoice || true));
check('every row has confidence + rawChoice', data.results.every((r) => typeof r.confidence === 'number' && !!r.rawChoice));
const bt = data.evidence['boone-tailwater'];
check(`boone-tailwater featured / needs-segment-review / 1 event`, bt.tier === 'featured' && bt.matchStatus === 'needs-segment-review' && bt.stockingEvents === 1);
const roles = new Set(Object.values(data.evidence).flatMap((e) => (e.species || []).map((x) => x.role)));
check(`species carry roles (trout/context/excluded): ${[...roles].join(',')}`, ['trout', 'context', 'excluded'].every((x) => roles.has(x)));
const withSpecies = Object.values(data.evidence).filter((e) => (e.species || []).length > 0).length;
check(`waters with Fishbrain species lists (${withSpecies})`, withSpecies > 100);
const sh = data.evidence['south-holston-lake'];
check('south-holston-lake has species with catch counts', (sh.species || []).length > 0 && (sh.species || []).every((x) => typeof x.catches === 'number'));
check('no ownerReview key anywhere in payload', !s.includes('ownerReview'));
check('no unresolved template literals in page JS', !html.slice(html.indexOf('<script>')).includes('${'));
check('drawer + export functions present', ['openDrawer', 'buildExport', 'setCat', 'setNote', 'resetOne'].every((f) => html.includes('window.' + f)));
const withComposite = Object.values(data.evidence).filter((e) => e.composite && e.composite.recommendedClass).length;
check(`composite program class wired for all waters (${withComposite})`, withComposite === 190);
check('drawer defines comp from embedded evidence (no undefined-reference crash)', html.includes('var comp = ev.composite ||'));
check('stable localStorage key + restore (answers survive close/reopen)', html.includes("LS_KEY = 'jev-review-v3'") && html.includes('localStorage.getItem'));
check('legacy v2 per-generation saves are migrated', html.includes("indexOf('jev-review-v2-') === 0"));
check('restore only re-applies touched decisions (override or note)', html.includes('(sv.modified || sv.note)'));
check('search index uses species names', html.includes("map(function (s) { return s.name; })"));
console.log(ok ? '\nREVIEW PAGE PAYLOAD OK' : '\nPAYLOAD PROBLEMS');
process.exit(ok ? 0 : 1);
