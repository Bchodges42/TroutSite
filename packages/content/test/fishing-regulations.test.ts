import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FishingInformationSchema } from '@trout/contracts';
import { loadContent } from '../scripts/lib.js';

const fishing = FishingInformationSchema.parse(JSON.parse(readFileSync(
  join(import.meta.dirname, '..', 'data', 'fishing-information.json'), 'utf8',
)));
const items = fishing.sections.find((section) => section.id === 'special-regulations')!.items;
const forWater = (id: string) => items.filter((item) => item.appliesTo?.includes(id));

describe('published water-specific regulations', () => {
  it('attaches every special rule to an existing catalog water', () => {
    const { streams } = loadContent();
    for (const item of items) {
      expect(item.appliesTo?.length, item.title).toBeGreaterThan(0);
      for (const id of item.appliesTo ?? []) expect(streams.has(id), `${item.title}: ${id}`).toBe(true);
    }
  });

  it('keeps both Paint Creek reaches and their different restrictions visible', () => {
    const rules = forWater('paint-creek-greene');
    const upper = rules.find((item) => item.title.includes('wild-trout'));
    const lower = rules.find((item) => item.title.includes('delayed harvest'));
    expect(upper?.text).toMatch(/campground upstream.*Munday Gap/);
    expect(upper?.text).toMatch(/5 trout\/day.*single-hook.*possession of bait.*dropper fly/);
    expect(lower?.text).toMatch(/Campground downstream.*French Broad River/);
    expect(lower?.text).toContain('October 1 - February 28');
    expect(lower?.text).toMatch(/harvest or possession is prohibited/);
    expect(lower?.text).toMatch(/use or possession of bait is prohibited/);
  });

  it('uses the 2026-27 Big Soddy November start and limits the rule to above Back Valley Road', () => {
    const rules = forWater('big-soddy-creek');
    expect(rules).toHaveLength(1);
    expect(rules[0].text).toContain('upstream of Back Valley Road');
    expect(rules[0].text).toContain('November 1 - February 28');
    expect(rules[0].text).toMatch(/harvest or possession is prohibited/);
    expect(rules[0].text).toMatch(/use or possession of bait is prohibited/);
  });

  it('keeps the Fort Patrick Henry Reservoir rule on the Boone Dam reach', () => {
    expect(forWater('boone-tailwater').some((item) => item.title === 'Fort Patrick Henry special regulation')).toBe(true);
    expect(forWater('ft-patrick-henry-tailwater').some((item) => item.title === 'Fort Patrick Henry special regulation')).toBe(false);
  });
});
