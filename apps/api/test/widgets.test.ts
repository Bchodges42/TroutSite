import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  ConditionSnapshotSchema,
  FishabilitySnapshotSchema,
  GaugeReadingSchema,
  StockingEventSchema,
  StreamSchema,
  type ConditionSnapshot,
  type FishabilitySnapshot,
  type GaugeReading,
  type StockingEvent,
  type Stream,
} from '@trout/contracts';
import { buildSnapshots } from '../src/snapshots/build.js';
import { CONDITIONS_EMBED_ARTIFACT, renderConditionsEmbedHtml } from '../src/widgets/embed.js';
import {
  WIDGET_SEMANTICS,
  assembleWaterRows,
  bandStatusLabel,
  buildConditionsWidgetModel,
  buildReadingRows,
  buildStockingText,
  buildWaterModel,
  formatDetailUrl,
  matchStockingEvents,
  parseWatersParam,
  scoreBand,
  speciesDisplayName,
  waterTypeLabel,
  type WidgetSemantics,
} from '../src/widgets/plan.js';
import { makeEnv, type TestEnv } from './helpers.js';

const NOW = new Date('2026-09-02T17:00:00Z');
const NOW_MS = NOW.getTime();

function iso(minutesAgo: number): string {
  return new Date(NOW_MS - minutesAgo * 60_000).toISOString();
}

function makeStream(overrides: Record<string, unknown> = {}): Stream {
  return StreamSchema.parse({
    id: 'watauga-river',
    name: 'Watauga River (Tailwater)',
    stateId: 'TN',
    waterbodyType: 'tailrace',
    regionId: 'tn-east-tailwaters',
    gaugeIds: ['03486000'],
    hydroIdentity: { gnisIds: ['01327321'], huc8s: ['06010103'] },
    stockingProgram: true,
    species: 'trout',
    idealFlow: [{ min: 100, max: 500, unit: 'cfs' }],
    officialSources: [{ label: 'TWRA trout stocking information', url: 'https://www.tn.gov/twra/fishing' }],
    ...overrides,
  });
}

function makeConditions(
  score: { value: number; reasons?: string[]; assessed?: boolean },
  readings: GaugeReading[] = [],
  streamId = 'watauga-river',
): ConditionSnapshot {
  return ConditionSnapshotSchema.parse({
    streamId,
    readings,
    score: { reasons: [], ...score },
    fetchedAt: NOW.toISOString(),
    nextExpectedUpdate: NOW.toISOString(),
  });
}

function makeReading(fields: Record<string, unknown>): GaugeReading {
  return GaugeReadingSchema.parse({ gaugeId: '03486000', timestamp: iso(30), ...fields });
}

function makeWaterInput(overrides: {
  stream?: Stream;
  conditions?: ConditionSnapshot;
  fishability?: FishabilitySnapshot | null;
  stocking?: StockingEvent[] | null;
  siteUrl?: string;
}) {
  return {
    stream: overrides.stream ?? makeStream(),
    conditions: overrides.conditions ?? makeConditions({ value: 90, assessed: true }),
    fishability: overrides.fishability === undefined ? null : overrides.fishability,
    stocking: overrides.stocking === undefined ? null : overrides.stocking,
    siteUrl: overrides.siteUrl ?? '',
  };
}

function makeFishability(comforts: { species: string; value: number; assessed: boolean }[]): FishabilitySnapshot {
  const bySpecies: Record<string, unknown> = {};
  for (const c of comforts) {
    bySpecies[c.species] = {
      comfort: {
        species: c.species,
        value: c.value,
        reasons: [c.assessed ? 'assessed' : 'cannot assess'],
        assessed: c.assessed,
        freshness: c.assessed ? { observedAt: iso(30), ageMinutes: 30 } : null,
      },
      activity: { total: 50, components: [] },
    };
  }
  return FishabilitySnapshotSchema.parse({
    streamId: 'watauga-river',
    fetchedAt: NOW.toISOString(),
    bySpecies,
  });
}

function makeStockingEvent(fields: Record<string, unknown>): StockingEvent {
  return StockingEventSchema.parse({
    id: 'se-1',
    stateId: 'TN',
    streamName: 'Watauga River (Tailwater)',
    species: 'rainbow',
    date: '2026-08-14',
    sourceUrl: 'https://www.tn.gov/twra/fishing/trout-information-stockings.html',
    fetchedAt: NOW.toISOString(),
    ...fields,
  });
}

describe('widget plan (display model semantics)', () => {
  it('pins the product band vocabulary (scoreBand parity: good >= 70 / fair >= 40)', () => {
    // Source of truth: apps/web/src/lib/conditions.ts scoreBand — the widget MUST
    // speak the same band language. Boundaries are pinned here by value.
    expect(WIDGET_SEMANTICS.bandGoodMin).toBe(70);
    expect(WIDGET_SEMANTICS.bandFairMin).toBe(40);
    expect(scoreBand(100, 70, 40)).toBe('good');
    expect(scoreBand(70, 70, 40)).toBe('good');
    expect(scoreBand(69, 70, 40)).toBe('fair');
    expect(scoreBand(41, 70, 40)).toBe('fair');
    expect(scoreBand(40, 70, 40)).toBe('fair');
    expect(scoreBand(39, 70, 40)).toBe('poor');
    expect(scoreBand(0, 70, 40)).toBe('poor');
    // The stale gate is the CONTRACT's canonical constant, not a widget-local guess.
    expect(WIDGET_SEMANTICS.staleMinutes).toBe(180);
    expect(bandStatusLabel('good', WIDGET_SEMANTICS)).toBe('Good');
    expect(bandStatusLabel('fair', WIDGET_SEMANTICS)).toBe('Fair');
    expect(bandStatusLabel('poor', WIDGET_SEMANTICS)).toBe('Poor');
    expect(bandStatusLabel(null, WIDGET_SEMANTICS)).toBe('No data');
  });

  it('ages each metric by its OWN observation time (metricTimes discipline); stale shown with age', () => {
    const readings = [
      // Fresh flow observed 30 min ago (own time == timestamp).
      makeReading({ cfs: 350, timestamp: iso(30) }),
      // Temperature stamped with the flow's time (a merged reading) but observed
      // 200 min ago per its OWN metricTimes entry — the age must be 200, not 30.
      makeReading({ tempC: 16.5, timestamp: iso(30), metricTimes: { tempC: iso(200) } }),
      // An older cfs row (26 h) must NOT win — the newest per metric wins.
      makeReading({ cfs: 999, timestamp: iso(60 * 26) }),
    ];
    const rows = buildReadingRows(readings, NOW_MS, WIDGET_SEMANTICS);
    expect(rows).toHaveLength(2); // heightFt absent → no row (never fabricated)

    const cfs = rows.find((r) => r.metric === 'cfs')!;
    expect(cfs.valueText).toBe('350 cfs');
    expect(cfs.ageMinutes).toBe(30);
    expect(cfs.stale).toBe(false);
    expect(cfs.ageText).toBe('30 min ago');

    const temp = rows.find((r) => r.metric === 'tempC')!;
    expect(temp.valueText).toBe('16.5°C');
    expect(temp.ageMinutes).toBe(200);
    expect(temp.stale).toBe(true); // past the 180-min gate…
    expect(temp.ageText).toBe('3 h ago'); // …but still SHOWN with its own age
  });

  it('applies the stale boundary exactly at staleMinutes and omits unreadable timestamps', () => {
    const atLimit = buildReadingRows([makeReading({ cfs: 100, timestamp: iso(180) })], NOW_MS, WIDGET_SEMANTICS);
    expect(atLimit[0]!.stale).toBe(false); // 180 == limit → still fresh
    const pastLimit = buildReadingRows([makeReading({ cfs: 100, timestamp: iso(181) })], NOW_MS, WIDGET_SEMANTICS);
    expect(pastLimit[0]!.stale).toBe(true);
    // A metric whose only timestamp is unreadable is unusable → no row (never a
    // fabricated age). Such a row can never pass the published schema, so the
    // model is probed directly with a cast.
    const broken = buildReadingRows(
      [{ gaugeId: '03486000', cfs: 100, timestamp: 'not-a-date' } as unknown as GaugeReading],
      NOW_MS,
      WIDGET_SEMANTICS,
    );
    expect(broken).toHaveLength(0);
  });

  it('unassessed renders "No data" (never zero); a REAL 0 renders Poor', () => {
    const noData = buildWaterModel(
      makeWaterInput({ conditions: makeConditions({ value: 0, assessed: false }) }),
      NOW_MS,
      WIDGET_SEMANTICS,
    );
    expect(noData.band).toBeNull();
    expect(noData.score).toBeNull();
    expect(noData.statusLabel).toBe('No data');

    const realZero = buildWaterModel(
      makeWaterInput({ conditions: makeConditions({ value: 0, assessed: true }) }),
      NOW_MS,
      WIDGET_SEMANTICS,
    );
    expect(realZero.band).toBe('poor');
    expect(realZero.score).toBe(0);
    expect(realZero.statusLabel).toBe('Poor');

    // Snapshots from before `assessed` existed must not silently read as no-data
    // (contracts: missing = cannot distinguish → the value is the display truth).
    const legacy = buildWaterModel(
      makeWaterInput({ conditions: makeConditions({ value: 55 }) }),
      NOW_MS,
      WIDGET_SEMANTICS,
    );
    expect(legacy.statusLabel).toBe('Fair');
    expect(legacy.score).toBe(55);
  });

  it('caps ?waters= at 4, trims, dedupes, and drops empties', () => {
    expect(WIDGET_SEMANTICS.maxWaters).toBe(4);
    expect(parseWatersParam(' a, b ,a,,c,d,e ', 4)).toEqual(['a', 'b', 'c', 'd']);
    expect(parseWatersParam(null, 4)).toEqual([]);
    expect(parseWatersParam(undefined, 4)).toEqual([]);
    expect(parseWatersParam('just-one', 4)).toEqual(['just-one']);
  });

  it('assembles requested waters in request order, skipping unknown ids and duplicates', () => {
    const streams = [makeStream(), makeStream({ id: 'test-tailrace-b', name: 'Test Tailrace B' })];
    const conditions = [
      makeConditions({ value: 90, assessed: true }),
      makeConditions({ value: 50, assessed: true }, [], 'test-tailrace-b'),
    ];
    const rows = assembleWaterRows(streams, conditions, [
      'test-tailrace-b',
      'nope',
      'watauga-river',
      'test-tailrace-b',
    ]);
    expect(rows.map((r) => r.stream.id)).toEqual(['test-tailrace-b', 'watauga-river']);
    // A catalog water with no conditions row is also skipped (never fabricated).
    expect(assembleWaterRows(streams, [conditions[0]!], ['test-tailrace-b'])).toHaveLength(0);
  });

  it('links "Open in Trout" to the water detail route: relative by default, SITE_URL when given', () => {
    expect(formatDetailUrl('', 'watauga-river', WIDGET_SEMANTICS)).toBe('/conditions/watauga-river');
    expect(formatDetailUrl('https://trout.example.com', 'watauga-river', WIDGET_SEMANTICS)).toBe(
      'https://trout.example.com/conditions/watauga-river',
    );
    expect(formatDetailUrl('https://trout.example.com/', 'watauga-river', WIDGET_SEMANTICS)).toBe(
      'https://trout.example.com/conditions/watauga-river',
    );
    // The id is URL-encoded into the path.
    expect(formatDetailUrl('', 'a b/c', WIDGET_SEMANTICS)).toBe('/conditions/a%20b%2Fc');
    const model = buildWaterModel(makeWaterInput({ siteUrl: 'https://trout.example.com' }), NOW_MS, WIDGET_SEMANTICS);
    expect(model.openUrl).toBe('https://trout.example.com/conditions/watauga-river');
  });

  it('matches stocking by name or alias (case-insensitive), newest first, precision-honest phrasing', () => {
    const stream = makeStream({ aliases: ['Watauga Tailwater'] });
    const events = [
      makeStockingEvent({ id: 'a', date: '2026-08-20', datePrecision: 'week', species: 'rainbow' }),
      makeStockingEvent({ id: 'b', date: '2026-09-01', datePrecision: 'day', species: 'brown' }),
      makeStockingEvent({ id: 'c', streamName: 'Watauga Tailwater', date: '2026-07-05', species: 'brook' }),
      makeStockingEvent({ id: 'd', streamName: 'Some Other River', date: '2026-09-02', species: 'rainbow' }),
    ];
    const matched = matchStockingEvents(events, stream);
    expect(matched.map((e) => e.id)).toEqual(['b', 'a', 'c']); // newest first; 'd' is not this water
    expect(buildStockingText(matched)).toBe('Stocked 2026-09-01 — Brown trout');
    // B09: a week/month schedule row must never read as a verified stocking day.
    expect(buildStockingText([matched[1]!])).toBe('Stocked week of 2026-08-20 (scheduled) — Rainbow trout');
    expect(buildStockingText([makeStockingEvent({ datePrecision: 'month', date: '2026-09-01' })])).toBe(
      'Stocking scheduled September 2026 — Rainbow trout',
    );
    expect(buildStockingText([makeStockingEvent({ datePrecision: undefined })])).toBe(
      'Stocking reported 2026-08-14 — Rainbow trout',
    );
    expect(buildStockingText([])).toBeNull();
    // No candidate events → no stocking row at all.
    const model = buildWaterModel(makeWaterInput({ stocking: [] }), NOW_MS, WIDGET_SEMANTICS);
    expect(model.stockingText).toBeNull();
  });

  it('carries per-species comfort rows in the same band vocabulary; absent fishability = no rows', () => {
    const fishability = makeFishability([
      { species: 'smallmouth-bass', value: 90, assessed: true },
      { species: 'crappie', value: 0, assessed: false },
    ]);
    const model = buildWaterModel(makeWaterInput({ fishability }), NOW_MS, WIDGET_SEMANTICS);
    expect(model.speciesRows).toEqual([
      { species: 'Smallmouth Bass', value: 90, band: 'good', statusLabel: 'Good' },
      { species: 'Crappie', value: null, band: null, statusLabel: 'No data' },
    ]);
    expect(buildWaterModel(makeWaterInput({}), NOW_MS, WIDGET_SEMANTICS).speciesRows).toEqual([]);
  });

  it('labels type + applicable species from the catalog (fallbacks honest, never guessed)', () => {
    expect(waterTypeLabel('tailrace')).toBe('Tailwater');
    expect(waterTypeLabel('creek')).toBe('Creek');
    expect(waterTypeLabel('spring')).toBe('Spring creek');
    expect(waterTypeLabel('river')).toBe('River');
    expect(speciesDisplayName('smallmouth-bass')).toBe('Smallmouth Bass');
    const targeted = buildWaterModel(
      makeWaterInput({ stream: makeStream({ targetSpecies: ['smallmouth-bass', 'crappie'] }) }),
      NOW_MS,
      WIDGET_SEMANTICS,
    );
    expect(targeted.species).toEqual(['Smallmouth Bass', 'Crappie']);
    expect(targeted.typeLabel).toBe('Tailwater');
    const warmwater = buildWaterModel(
      makeWaterInput({ stream: makeStream({ species: 'warmwater', waterbodyType: 'river' }) }),
      NOW_MS,
      WIDGET_SEMANTICS,
    );
    expect(warmwater.species).toEqual(['Warmwater']);
    expect(warmwater.typeLabel).toBe('River');
    const unclaimed = buildWaterModel(
      makeWaterInput({ stream: makeStream({ species: undefined }) }),
      NOW_MS,
      WIDGET_SEMANTICS,
    );
    expect(unclaimed.species).toEqual([]);
  });
});

/** The artifact's inline script, evaluated WITHOUT a DOM (the runtime bootstrap
 *  is guarded by `typeof document`). Returns the SHIPPED model functions + SEM —
 *  this is how parity with plan.ts is pinned on the exact emitted bytes. */
interface ArtifactModelApi {
  SEM: WidgetSemantics;
  parseWatersParam: typeof parseWatersParam;
  scoreBand: typeof scoreBand;
  buildReadingRows: typeof buildReadingRows;
  buildConditionsWidgetModel: typeof buildConditionsWidgetModel;
}

function artifactModelApi(html: string): ArtifactModelApi {
  const match = /<script>\n([\s\S]*?)\n<\/script>/.exec(html);
  expect(match).toBeTruthy();
  const source = match![1]!;
  const factory = new Function(
    `${source}\n;return { SEM: SEM, parseWatersParam: parseWatersParam, scoreBand: scoreBand, buildReadingRows: buildReadingRows, buildConditionsWidgetModel: buildConditionsWidgetModel };`,
  );
  return factory() as ArtifactModelApi;
}

describe('conditions-embed artifact (static HTML)', () => {
  const html = renderConditionsEmbedHtml();

  it('is a valid, self-contained HTML document with exactly one inline script', () => {
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html.trimEnd().endsWith('</html>')).toBe(true);
    expect(html).toContain('<meta charset="utf-8">');
    expect(html).toContain('<meta name="viewport" content="width=device-width, initial-scale=1">');
    expect(html).toContain('<title>');
    expect(html.match(/<script>/g)).toHaveLength(1);
    expect(html).not.toMatch(/<script[^>]+src=/i);
    expect(html).not.toMatch(/<link\s/i);
    expect(html).toContain('<noscript>');
  });

  it('makes no external requests: the only runtime URLs are same-origin /v1/ snapshots', () => {
    const script = /<script>\n([\s\S]*?)\n<\/script>/.exec(html)![1]!;
    expect(script).not.toMatch(/https?:\/\//); // no absolute URLs in code
    expect(html).not.toMatch(/@import/);
    expect(html).not.toMatch(/url\(/); // no CSS-referenced resources either
    const sem = JSON.parse(/var SEM = (\{.*?\});\n/.exec(script)![1]!) as WidgetSemantics;
    expect(sem.streamsUrl.startsWith('/v1/')).toBe(true);
    expect(sem.conditionsUrl.startsWith('/v1/')).toBe(true);
    expect(sem.fishabilityUrlTemplate.startsWith('/v1/')).toBe(true);
    expect(sem.stockingUrlTemplate.startsWith('/v1/')).toBe(true);
    expect(sem.detailPathTemplate).toBe('/conditions/{id}');
    // Attribution is binding, and the no-referrer discipline is in the document.
    expect(sem.sourceAttribution).toBe('Data: USGS/TVA — verify with the agency');
    expect(html).toContain('<meta name="referrer" content="no-referrer">');
  });

  it('supports light + dark via prefers-color-scheme with an optional ?theme= override', () => {
    expect(html).toContain('@media (prefers-color-scheme: dark)');
    expect(html).toContain(":root[data-theme='light']");
    expect(html).toContain(":root[data-theme='dark']");
    // Both palettes carry the full token set (light values in :root, dark in the media block).
    expect(html).toContain('--tw-good: #1a7f4b'); // light good
    expect(html).toContain('--tw-good: #4cc38a'); // dark good
    expect(html).toContain('--tw-bg: #f4f6f3'); // light bg
    expect(html).toContain('--tw-bg: #10161a'); // dark bg
  });

  it('keeps catalog data OUT of the static bytes and renders data only via textContent', () => {
    // The artifact is fully static: nothing derived from the catalog/DB is baked in.
    expect(html).not.toContain('Watauga');
    expect(html).not.toContain('03486000');
    // Injection discipline: no HTML-constructing sinks anywhere in the script.
    expect(html).not.toMatch(/\binnerHTML\b/);
    expect(html).not.toMatch(/document\.write/);
    expect(html).not.toMatch(/insertAdjacentHTML/);
    // A hostile catalog name flows through the SHIPPED model unchanged — the DOM
    // layer (textContent-only) is what neutralizes it.
    const hostile = 'Creek <script>alert("xss")</script> & Co';
    const api = artifactModelApi(html);
    const model = api.buildConditionsWidgetModel(
      {
        watersParam: 'hostile-creek',
        streams: [makeStream({ id: 'hostile-creek', name: hostile, waterbodyType: 'creek' })],
        conditions: [makeConditions({ value: 90, assessed: true }, [], 'hostile-creek')],
        nowMs: NOW_MS,
        siteUrl: '',
      },
      api.SEM,
    );
    expect(model.waters).toHaveLength(1);
    expect(model.waters[0]!.name).toBe(hostile); // raw string — rendered as inert text
  });

  it('ships the exact plan.ts semantics (model parity on the emitted bytes)', () => {
    const api = artifactModelApi(html);
    expect(api.SEM).toEqual(WIDGET_SEMANTICS);
    expect(api.scoreBand(69, 70, 40)).toBe('fair');
    expect(api.scoreBand(70, 70, 40)).toBe('good');

    const args = {
      // 6 ids requested: dup dropped, unknown dropped later, cap 4 bites.
      watersParam: 'watauga-river, test-tailrace-b, nope, extra-2, extra-1, watauga-river',
      streams: [
        makeStream(),
        makeStream({ id: 'test-tailrace-b', name: 'Test Tailrace B', species: 'warmwater', waterbodyType: 'river' }),
        makeStream({ id: 'extra-1', name: 'Extra One' }),
        makeStream({ id: 'extra-2', name: 'Extra Two' }),
      ],
      conditions: [
        makeConditions({ value: 90, assessed: true }, [
          makeReading({ cfs: 350, timestamp: iso(30) }),
          makeReading({ tempC: 16.5, timestamp: iso(30), metricTimes: { tempC: iso(200) } }),
        ]),
        makeConditions({ value: 20, assessed: true }, [], 'test-tailrace-b'),
        makeConditions({ value: 70, assessed: true }, [], 'extra-1'),
        makeConditions({ value: 0, assessed: false }, [], 'extra-2'),
      ],
      fishabilityByWater: {
        'watauga-river': makeFishability([{ species: 'smallmouth-bass', value: 90, assessed: true }]),
      },
      stockingByWater: {
        'watauga-river': [makeStockingEvent({ date: '2026-09-01', datePrecision: 'day', species: 'brown' })],
      },
      nowMs: NOW_MS,
      siteUrl: 'https://trout.example.com',
    };
    const fromPlan = buildConditionsWidgetModel(args, WIDGET_SEMANTICS);
    const fromArtifact = api.buildConditionsWidgetModel(args, api.SEM);
    expect(fromArtifact).toEqual(fromPlan);
    // And the shared model itself carries the product semantics we expect:
    expect(fromPlan.waters).toHaveLength(3); // cap 4 → nope dropped, extra-1 fell outside the cap
    expect(fromPlan.waters[0]!.statusLabel).toBe('Good');
    expect(fromPlan.waters[0]!.stockingText).toBe('Stocked 2026-09-01 — Brown trout');
    expect(fromPlan.waters[0]!.openUrl).toBe('https://trout.example.com/conditions/watauga-river');
    expect(fromPlan.waters[2]!.statusLabel).toBe('No data'); // extra-2: unassessed, never zero
  });
});

/** Snapshot builder integration: the artifact is emitted (and pruned) by the
 *  hourly pass like every other managed file, seeded through the real fixtures. */
describe('buildSnapshots widget emission (ADR 0018)', () => {
  let env: TestEnv;

  beforeEach(() => {
    env = makeEnv();
  });

  afterEach(() => {
    env.db.close();
    rmSync(env.dir, { recursive: true, force: true });
  });

  function insertReading(reading: { gaugeId: string; cfs?: number; tempC?: number; timestamp: string }): void {
    env.db
      .prepare(
        `INSERT INTO gauge_readings_raw (gauge_id, fetched_at, payload, cfs, height_ft, temp_c, observed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        reading.gaugeId,
        reading.timestamp,
        JSON.stringify(reading),
        reading.cfs ?? null,
        null,
        reading.tempC ?? null,
        reading.timestamp,
      );
  }

  it('emits the artifact each pass, lists it in the manifest, and stays byte-stable', () => {
    insertReading({ gaugeId: '03486000', cfs: 350, tempC: 16.5, timestamp: '2026-09-02T16:30:00.000Z' });
    const result = buildSnapshots({ db: env.db, snapshotsDir: env.snapshotsDir, now: NOW });

    const artifact = join(env.snapshotsDir, 'v1', 'widgets', CONDITIONS_EMBED_ARTIFACT);
    expect(existsSync(artifact)).toBe(true);
    expect(result.files).toContain(artifact);
    expect(result.widgetArtifacts).toBe(1);
    expect(readFileSync(artifact, 'utf8')).toBe(renderConditionsEmbedHtml());

    // A later pass regenerates the SAME bytes (no build-time clock in the artifact).
    const later = new Date(NOW.getTime() + 3_600_000);
    const again = buildSnapshots({ db: env.db, snapshotsDir: env.snapshotsDir, now: later });
    expect(readFileSync(artifact, 'utf8')).toBe(renderConditionsEmbedHtml());
    expect(again.files).toContain(artifact);
    expect(again.widgetArtifacts).toBe(1);
  });

  it('prunes stale widget files the emitter no longer produces', () => {
    const stale = join(env.snapshotsDir, 'v1', 'widgets', 'old-shop-panel.html');
    mkdirSync(dirname(stale), { recursive: true });
    writeFileSync(stale, '<html>stale</html>');

    const result = buildSnapshots({ db: env.db, snapshotsDir: env.snapshotsDir, now: NOW });

    expect(existsSync(stale)).toBe(false);
    expect(result.files.some((f) => f.endsWith(join('widgets', 'old-shop-panel.html') + ' (removed)'))).toBe(true);
    expect(existsSync(join(env.snapshotsDir, 'v1', 'widgets', CONDITIONS_EMBED_ARTIFACT))).toBe(true);
  });

  it('serves the widget end-to-end: shipped model over the emitted v1 snapshots', () => {
    // 350 cfs sits inside Watauga's 100–500 ideal range; 16.5°C is ideal → 90 (Good).
    insertReading({ gaugeId: '03486000', cfs: 350, tempC: 16.5, timestamp: '2026-09-02T16:30:00.000Z' });
    buildSnapshots({ db: env.db, snapshotsDir: env.snapshotsDir, now: NOW });

    const streams = JSON.parse(
      readFileSync(join(env.snapshotsDir, 'v1', 'streams.json'), 'utf8'),
    ) as unknown as Stream[];
    const conditions = JSON.parse(
      readFileSync(join(env.snapshotsDir, 'v1', 'conditions', 'latest.json'), 'utf8'),
    ) as unknown as ConditionSnapshot[];

    const api = artifactModelApi(renderConditionsEmbedHtml());
    const model = api.buildConditionsWidgetModel(
      { watersParam: 'watauga-river,nope', streams, conditions, nowMs: NOW.getTime(), siteUrl: '' },
      api.SEM,
    );
    expect(model.waters).toHaveLength(1);
    const water = model.waters[0]!;
    expect(water.id).toBe('watauga-river');
    expect(water.name).toContain('Watauga');
    expect(water.statusLabel).toBe('Good');
    expect(water.openUrl).toBe('/conditions/watauga-river');
    expect(
      water.readings.some((r: { metric: string; valueText: string }) => r.metric === 'cfs' && r.valueText === '350 cfs'),
    ).toBe(true);
    expect(water.readings.every((r: { stale: boolean }) => r.stale === false)).toBe(true);
  });
});
