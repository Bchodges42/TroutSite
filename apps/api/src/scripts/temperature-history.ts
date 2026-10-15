import { parseArgs } from 'node:util';
import { writeFileSync } from 'node:fs';
import { fetchTemperatureHistory } from '../evidence/wqp-temperature-history.js';

const { values } = parseArgs({ args: process.argv.slice(2).filter((v) => v !== '--'), options: {
  sites: { type: 'string' }, start: { type: 'string' }, end: { type: 'string' }, out: { type: 'string' },
} });
if (!values.sites || !values.start || !values.end || !values.out) {
  throw new Error('Use --sites=MONITORING-ID[,ID] --start=MM-DD-YYYY --end=MM-DD-YYYY --out=review.json');
}
const result = await fetchTemperatureHistory({ siteIds: values.sites.split(','), startDate: values.start,
  endDate: values.end, userAgent: 'Trout historical-temperature evidence review' });
writeFileSync(values.out, JSON.stringify({ purpose: 'historical evidence review; not live conditions', ...result }, null, 2) + '\n');
console.log(`Historical temperature review: ${result.samples.length} samples, ${result.skipped} withheld rows. No live data written.`);
