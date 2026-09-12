import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { matchStocking, normalizeWaterName } from '../src/lib/stockingMatch';
import type { StockingEvent } from '@trout/contracts';

const event = (streamName: string, id = streamName): StockingEvent => ({
  id,
  stateId: 'TN',
  streamName,
  species: 'rainbow',
  count: 500,
  date: '2026-03-01',
  sourceUrl: 'https://www.tn.gov/twra/fishing/trout-information-stockings.html',
  fetchedAt: '2026-09-01T00:00:00Z',
});

const streams = [
  { id: 'caney-fork-river', name: 'Caney Fork River (Center Hill tailwater)' },
  { id: 'duck-river-tailwater', name: 'Duck River (Normandy tailwater)' },
  { id: 'duck-river-lower', name: 'Duck River (Shelbyville to Columbia)' },
  { id: 'shoal-creek', name: 'Shoal Creek' },
  { id: 'east-fork-shoal-creek', name: 'East Fork Shoal Creek' },
  { id: 'sequatchie-river', name: 'Sequatchie River (headwaters)' },
  { id: 'little-sequatchie-river', name: 'Little Sequatchie River' },
  { id: 'elk-river', name: 'Elk River (Tims Ford tailwater)' },
  { id: 'elk-river-lower', name: 'Elk River (Prospect to state line)' },
];

describe('normalizeWaterName', () => {
  it('expands TWRA abbreviations and strips decoration', () => {
    expect(normalizeWaterName('Center Hill TW / Caney Fork River')).toBe('center hill tailwater caney fork river');
    expect(normalizeWaterName('Apalachia TW / Hiwassee River*')).toBe('apalachia tailwater hiwassee river');
    expect(normalizeWaterName('Mossy Creek (NEW)')).toBe('mossy creek');
  });
});

describe('matchStocking', () => {
  it('resolves tailwater compounds through the alias table, not substrings', () => {
    const { byStream } = matchStocking(streams, [
      event('Center Hill TW / Caney Fork River'),
      event('Normandy TW / Duck River'),
      event('Tims Ford TW / Elk River'),
    ]);
    expect(byStream.get('caney-fork-river')).toHaveLength(1);
    expect(byStream.get('duck-river-tailwater')).toHaveLength(1);
    expect(byStream.get('elk-river')).toHaveLength(1);
    expect(byStream.get('duck-river-lower')).toBeUndefined();
    expect(byStream.get('elk-river-lower')).toBeUndefined();
  });

  it('matches exact catalog names directly', () => {
    const { byStream } = matchStocking(streams, [event('Shoal Creek')]);
    expect(byStream.get('shoal-creek')).toHaveLength(1);
    expect(byStream.get('east-fork-shoal-creek')).toBeUndefined();
  });

  it('leaves ambiguous containments unmatched (Sequatchie vs Little Sequatchie)', () => {
    const { byStream, unmatched } = matchStocking(streams, [event('Sequatchie River')]);
    expect(byStream.get('sequatchie-river')).toBeUndefined();
    expect(byStream.get('little-sequatchie-river')).toBeUndefined();
    expect(unmatched).toBe(1);
  });

  it('does not let one water\'s events leak into a first-word sibling', () => {
    const { byStream } = matchStocking(streams, [event('East Fork Shoal Creek')]);
    expect(byStream.get('east-fork-shoal-creek')).toHaveLength(1);
    expect(byStream.get('shoal-creek')).toBeUndefined();
  });

  it('sorts each stream\'s events newest-first', () => {
    const { byStream } = matchStocking(streams, [
      { ...event('Shoal Creek', 'a'), date: '2026-01-15' },
      { ...event('Shoal Creek', 'b'), date: '2026-04-02' },
    ]);
    expect(byStream.get('shoal-creek')?.map((e) => e.id)).toEqual(['b', 'a']);
  });

  it('counts urban program waters as unmatched, not mis-assigned', () => {
    const { byStream, unmatched } = matchStocking(streams, [
      event('Shelby Farms'),
      event('Beech Lake'),
      event('Shoal Creek'),
    ]);
    expect(unmatched).toBe(2);
    expect(byStream.size).toBe(1);
  });
});

describe('matchStocking against the real cached TWRA feed', () => {

  // public/v1/** is a gitignored deploy/cron artifact (ADR 0005) — the suite runs
  // wherever the pipeline has generated it and skips honestly on fresh clones.
  const webRoot = path.resolve(__dirname, '..');
  const publishedFeed = path.join(webRoot, 'public/v1/stocking/TN.json');
  const itForPublishedFeed = fs.existsSync(publishedFeed) ? it : it.skip;

  itForPublishedFeed('associates the published tailwater rows with their catalog reaches', () => {
    const events = JSON.parse(fs.readFileSync(publishedFeed, 'utf8')) as StockingEvent[];
    const streams = JSON.parse(fs.readFileSync(path.join(webRoot, 'public/v1/streams.json'), 'utf8')) as Array<{ id: string; name: string }>;
    const { byStream, unmatched } = matchStocking(streams, events);

    expect(events.length).toBeGreaterThan(400);
    expect(byStream.get('caney-fork-river')?.length).toBeGreaterThan(0);
    expect(byStream.get('duck-river-tailwater')?.length).toBeGreaterThan(0);
    // The Normandy rows must not leak into the Shelbyville–Columbia reach.
    const lower = byStream.get('duck-river-lower') ?? [];
    expect(lower.filter((e) => /normandy/i.test(e.streamName))).toHaveLength(0);
    // Multiple distinct reaches receive real rows; the rest of the 623 rows
    // are urban program waters outside the trout catalog — reported, not guessed.
    expect(byStream.size).toBeGreaterThan(3);
    expect(unmatched).toBeGreaterThan(0);
  });
});

describe('T1-7 — county disambiguation against the captured 623-row TWRA feed', () => {

  // Permanent capture of the 2026-09-12 TWRA schedule pull (623 rows) — the
  // regression set for the matcher. Rows are compact; the loader restores the
  // fields every row shares but the schema requires.
  const capture = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, 'fixtures/stocking-tn-2026-09-12.json'), 'utf8'),
  ) as { count: number; events: Array<Partial<StockingEvent>> };
  const capturedEvents: StockingEvent[] = capture.events.map((e) => ({
    stateId: 'TN',
    sourceUrl: 'https://www.tn.gov/twra/fishing/trout-information-stockings.html',
    fetchedAt: '2026-09-12T00:00:00Z',
    ...e,
  })) as StockingEvent[];

  // Real catalog names (packages/content/streams/tn/) for every water the
  // mis-attribution cases and controls touch.
  const catalog = [
    { id: 'wolf-river-fentress', name: 'Wolf River (Fentress County headwaters)' },
    { id: 'wolf-river-west-tennessee', name: 'Wolf River' },
    { id: 'holston-river', name: 'Holston River' },
    { id: 'ft-patrick-henry-tailwater', name: 'Fort Patrick Henry Tailwater (South Fork Holston River)' },
    { id: 'south-holston-river', name: 'South Fork Holston River (South Holston tailwater)' },
    { id: 'boone-tailwater', name: 'Boone Tailwater (South Fork Holston River)' },
    { id: 'caney-fork-river', name: 'Caney Fork River (Center Hill tailwater)' },
    { id: 'duck-river-tailwater', name: 'Duck River (Normandy tailwater)' },
    { id: 'duck-river-lower', name: 'Duck River (Shelbyville to Columbia)' },
  ];

  it('captures the full 623-row review set', () => {
    expect(capture.count).toBe(623);
    expect(capturedEvents).toHaveLength(623);
  });

  it('resolves TWRA "Wolf River" (Fentress) to the Fentress headwaters, not the west-Tennessee Wolf', () => {
    const { byStream } = matchStocking(catalog, capturedEvents);
    const fentress = byStream.get('wolf-river-fentress') ?? [];
    expect(fentress.length).toBeGreaterThan(0);
    expect(fentress.every((e) => e.county === 'Fentress')).toBe(true);
    expect(byStream.get('wolf-river-west-tennessee')).toBeUndefined();
  });

  it('resolves "Ft. Patrick Henry TW / S. Fork Holston River" to its tailwater, not the generic Holston River', () => {
    const { byStream } = matchStocking(catalog, capturedEvents);
    const patrick = byStream.get('ft-patrick-henry-tailwater') ?? [];
    expect(patrick.length).toBeGreaterThan(0);
    expect(patrick.every((e) => /patrick henry/i.test(e.streamName))).toBe(true);
    const holston = byStream.get('holston-river') ?? [];
    expect(
      holston.filter((e) => /patrick henry|boone|holston tw|s\. holston/i.test(e.streamName)),
    ).toHaveLength(0);
  });

  it('keeps the controls correct: Center Hill → Caney Fork, Normandy → Duck tailwater (never the lower reach)', () => {
    const { byStream } = matchStocking(catalog, capturedEvents);
    const caney = byStream.get('caney-fork-river') ?? [];
    expect(caney.length).toBeGreaterThan(0);
    expect(caney.every((e) => /center hill/i.test(e.streamName))).toBe(true);
    const duck = byStream.get('duck-river-tailwater') ?? [];
    expect(duck.length).toBeGreaterThan(0);
    expect(duck.every((e) => /normandy/i.test(e.streamName))).toBe(true);
    expect(byStream.get('duck-river-lower')).toBeUndefined();
  });
});
