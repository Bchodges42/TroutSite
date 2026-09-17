/* eslint-disable no-undef -- Node test run directly (node --test) */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { bandFor, levelIndexTo100, inputHash, collectInputs } from './jev-fishability.mjs';

describe('jev-fishability bands', () => {
  it('maps the owner-fixed 10-point ranges', () => {
    assert.deepEqual(bandFor(100), { band: '91-100', word: 'prime' });
    assert.deepEqual(bandFor(91), { band: '91-100', word: 'prime' });
    assert.deepEqual(bandFor(90), { band: '81-90', word: 'excellent' });
    assert.deepEqual(bandFor(81), { band: '81-90', word: 'excellent' });
    assert.deepEqual(bandFor(45), { band: '41-50', word: 'marginal' });
    assert.deepEqual(bandFor(0), { band: '0-10', word: 'skip-it' });
    assert.deepEqual(bandFor(1042), { band: '91-100', word: 'prime' }); // clamped
    assert.deepEqual(bandFor(-3), { band: '0-10', word: 'skip-it' });
  });

  it('converts TypeSafe level indexes (0-9, fractional) to the 0-100 scale', () => {
    assert.equal(levelIndexTo100(9), 95); // level 9 = the 91-100 band, midpoint ~95
    assert.equal(levelIndexTo100(0), 5);
    assert.equal(levelIndexTo100(6), 65);
    assert.equal(levelIndexTo100(1.6), 21);
    assert.equal(levelIndexTo100(undefined), null);
  });

  it('hashes inputs stably and distinctively', () => {
    const a = { month: 9, flowCfs: 245 };
    assert.equal(inputHash(a), inputHash({ flowCfs: 245, month: 9 }));
    assert.notEqual(inputHash(a), inputHash({ month: 9, flowCfs: 246 }));
  });
});

describe('collectInputs', () => {
  const streams = [
    { id: 'boone-tailwater', name: 'Boone Tailwater', species: 'trout', seasonMonths: [3, 4, 11, 12], idealFlow: [{ min: 100, max: 500 }] },
    { id: 'harpeth-river', name: 'Harpeth River', species: 'warmwater', idealFlow: [] },
  ];
  const conditions = [
    { streamId: 'boone-tailwater', readings: [{ gaugeId: 'tva:BOOT1', timestamp: '2026-09-17T10:00Z', cfs: 300, tempC: 12, precipitationMm: 0.4 }, { gaugeId: 'tva:BOOT1', timestamp: '2026-09-17T09:00Z', cfs: 280 }] },
    { streamId: 'harpeth-river', readings: [{ gaugeId: '03432350', timestamp: '2026-09-17T10:00Z', cfs: 80, tempC: 22 }] },
  ];
  const stockingEvents = [{ stream_name: 'Boone Tailwater', date: '2026-09-14' }];
  const calendar = { waters: { 'harpeth-river': { classification: 'warmwater' } } };

  it('gathers month, recency, flow trend, temp, and rain per water', () => {
    const out = collectInputs({ streams, conditions, stockingEvents, calendar, now: new Date('2026-09-17T12:00:00Z') });
    const boone = out.find((x) => x.slug === 'boone-tailwater');
    assert.equal(boone.inputs.month, 9);
    assert.equal(boone.inputs.stockedRecently, 3);
    assert.equal(boone.inputs.flowCfs, 300);
    assert.equal(boone.inputs.flowTrend, 'rising');
    assert.equal(boone.inputs.waterTempC, 12);
    assert.equal(boone.inputs.rainMmLastReading, 0.4);
    const harpeth = out.find((x) => x.slug === 'harpeth-river');
    assert.equal(harpeth.inputs.stockedRecently, null);
    assert.equal(harpeth.inputs.classification, 'warmwater');
  });
});
