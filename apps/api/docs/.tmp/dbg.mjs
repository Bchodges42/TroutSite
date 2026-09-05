import { readFileSync } from 'node:fs';
import { parseTwraEvidence } from '../../src/evidence/twra-evidence.js';
const arts = [
  { suffix: 'html', content: readFileSync('fixtures/TN/2026-09-04-garbage.html','utf8'), url: 'x' },
  { suffix: 'exceldriven.json', content: readFileSync('fixtures/TN/2026-09-04-schedule.exceldriven.json','utf8'), url: 'y' },
  { suffix: 'exceldriven.json', content: readFileSync('fixtures/TN/2026-09-04-recent.exceldriven.json','utf8'), url: 'z' },
];
const r = parseTwraEvidence(arts, { now: new Date('2026-09-04') });
console.log('schedule rows:', r.scheduleRows.length, 'recent rows:', r.recentRows.length);
console.log(r.warnings.slice(0,5));
