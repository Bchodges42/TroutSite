/** Discrete historical samples for evidence review. This module has no route to
 * gauge_readings_raw or the live conditions scorer. Site-to-water mapping must
 * be reviewed separately; a name or coordinate match does not establish it. */
export interface HistoricalTemperatureSample {
  siteId: string;
  sampleDate: string;
  sampleTime?: string;
  timeZoneCode?: string;
  temperatureC: number;
  originalValue: string;
  originalUnit: string;
  depth?: string;
  depthUnit?: string;
  method?: string;
  qualifier?: string;
  status?: string;
  sourceUrl: string;
  retrievedAt: string;
}

/** Handles quoted commas, escaped quotes and multiline comments in WQP CSV. */
export function parseCsvRows(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let cell = ''; let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (ch === ',' && !quoted) { row.push(cell); cell = ''; }
    else if (ch === '\n' && !quoted) {
      row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = '';
    } else cell += ch;
  }
  if (quoted) throw new Error('Truncated WQP CSV quoted field');
  if (cell.length || row.length) { row.push(cell.replace(/\r$/, '')); rows.push(row); }
  return rows;
}

export function parseTemperatureHistory(csv: string, opts: { siteIds: string[]; sourceUrl: string; retrievedAt: string }) {
  const [header, ...rows] = parseCsvRows(csv.replace(/^\uFEFF/, ''));
  const required = ['MonitoringLocationIdentifier', 'ActivityStartDate', 'CharacteristicName', 'ResultMeasureValue', 'ResultMeasure/MeasureUnitCode'];
  if (!header || required.some((key) => !header.includes(key))) throw new Error('WQP response is missing sample columns');
  const samples: HistoricalTemperatureSample[] = []; let skipped = 0;
  for (const row of rows) {
    const get = (key: string) => row[header.indexOf(key)]?.trim() ?? '';
    const siteId = get('MonitoringLocationIdentifier');
    const originalValue = get('ResultMeasureValue');
    const originalUnit = get('ResultMeasure/MeasureUnitCode');
    const raw = originalValue !== '' ? Number(originalValue) : NaN;
    const temperatureC = originalUnit === 'deg C' ? raw : originalUnit === 'deg F' ? (raw - 32) * 5 / 9 : NaN;
    if (!opts.siteIds.includes(siteId) || get('CharacteristicName') !== 'Temperature, water' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(get('ActivityStartDate')) ||
        !Number.isFinite(temperatureC) || temperatureC < -273.15 || temperatureC > 100 ||
        get('ResultDetectionConditionText') !== '') { skipped++; continue; }
    samples.push({ siteId, sampleDate: get('ActivityStartDate'), temperatureC, originalValue, originalUnit,
      ...(get('ActivityStartTime/Time') ? { sampleTime: get('ActivityStartTime/Time') } : {}),
      ...(get('ActivityStartTime/TimeZoneCode') ? { timeZoneCode: get('ActivityStartTime/TimeZoneCode') } : {}),
      ...(get('ActivityDepthHeightMeasure/MeasureValue') ? { depth: get('ActivityDepthHeightMeasure/MeasureValue'), depthUnit: get('ActivityDepthHeightMeasure/MeasureUnitCode') } : {}),
      ...(get('ResultAnalyticalMethod/MethodName') ? { method: get('ResultAnalyticalMethod/MethodName') } : {}),
      ...(get('MeasureQualifierCode') ? { qualifier: get('MeasureQualifierCode') } : {}),
      ...(get('ResultStatusIdentifier') ? { status: get('ResultStatusIdentifier') } : {}),
      sourceUrl: opts.sourceUrl, retrievedAt: opts.retrievedAt,
    });
  }
  return { samples, skipped };
}

export async function fetchTemperatureHistory(opts: {
  siteIds: string[]; startDate: string; endDate: string; userAgent: string; fetchImpl?: typeof fetch;
}) {
  if (!opts.siteIds.length || opts.siteIds.length > 20) throw new Error('Specify 1–20 reviewed monitoring-site IDs');
  if (![opts.startDate, opts.endDate].every((d) => /^\d{2}-\d{2}-\d{4}$/.test(d))) throw new Error('WQP dates must be MM-DD-YYYY');
  const url = new URL('https://www.waterqualitydata.us/data/Result/search');
  for (const site of opts.siteIds) url.searchParams.append('siteid', site);
  url.searchParams.set('characteristicName', 'Temperature, water');
  url.searchParams.set('startDateLo', opts.startDate); url.searchParams.set('startDateHi', opts.endDate);
  url.searchParams.set('mimeType', 'csv'); url.searchParams.set('zip', 'no');
  const res = await (opts.fetchImpl ?? fetch)(url.toString(), {
    headers: { Accept: 'text/csv', 'User-Agent': opts.userAgent }, signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`WQP HTTP ${res.status}`);
  const retrievedAt = new Date().toISOString();
  return { sourceUrl: url.toString(), retrievedAt,
    ...parseTemperatureHistory(await res.text(), { siteIds: opts.siteIds, sourceUrl: url.toString(), retrievedAt }) };
}
