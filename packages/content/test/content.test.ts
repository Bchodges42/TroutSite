// OWNER: ROLE 4. The CI content gate as a Vitest suite (same loader as scripts/validate.ts).
// Covers: schema validity, orphan references, gauge-ID lint, SVG well-formedness,
// hatch-chart month coverage, and the CHAT-4 Definition-of-Done floors.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  loadContent,
  loadSpeciesReference,
  loadVerifiedGauges,
  checkSpeciesDoc,
  isWellFormedSvg,
  FLOORS,
  type SpeciesReference,
} from '../scripts/lib.js';
import { REGIONS } from '../scripts/regions.js';

const { bugs, patterns, streams, shops, hatch, illustrations, issues, warnings } = loadContent();
const { species, issues: speciesIssues } = loadSpeciesReference();

describe('content pack validation (CI gate)', () => {
  it('has no validation issues', () => {
    expect(issues, issues.map((i) => `${i.file}: ${i.message}`).join('\n')).toEqual([]);
  });

  it('validates every bug taxon against BugTaxonSchema with cited sources', () => {
    expect(bugs.size).toBeGreaterThan(0);
    for (const [id, taxon] of bugs) {
      expect(taxon.sources.length, `${id} must cite sources`).toBeGreaterThanOrEqual(1);
      expect(taxon.notes.length, `${id} needs original notes`).toBeGreaterThan(20);
    }
  });

  it('ships one well-formed SVG illustration per taxon', () => {
    for (const [id, taxon] of bugs) {
      const svg = illustrations.get(`${id}.svg`);
      expect(svg, `missing SVG for ${id} (${taxon.illustration})`).toBeTruthy();
      expect(isWellFormedSvg(svg as string), `malformed SVG for ${id}`).toBe(true);
      expect((svg as string).length, `SVG for ${id} suspiciously large`).toBeLessThan(10_000);
    }
    expect(illustrations.size).toBe(bugs.size);
  });

  it('has no orphan pattern → taxon references', () => {
    for (const [id, pattern] of patterns) {
      for (const taxonId of pattern.imitates) {
        expect(bugs.has(taxonId), `patterns/${id}.yaml → unknown taxon ${taxonId}`).toBe(true);
      }
    }
  });

  it('has no orphan hatch chart references', () => {
    for (const [rid, charts] of hatch) {
      for (const chart of charts) {
        for (const entry of chart.entries) {
          expect(bugs.has(entry.taxonId), `hatch/${rid} month ${chart.month} → unknown taxon ${entry.taxonId}`).toBe(true);
          for (const pid of entry.patterns) {
            expect(patterns.has(pid), `hatch/${rid} month ${chart.month} → unknown pattern ${pid}`).toBe(true);
          }
        }
      }
    }
  });

  it('covers all 12 months for every launch region', () => {
    expect(hatch.size).toBe(REGIONS.length);
    for (const region of REGIONS) {
      const charts = hatch.get(region.id);
      expect(charts, `no hatch file for ${region.id}`).toBeDefined();
      expect(charts?.map((c) => c.month).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    }
  });

  it('lints every gaugeId against the USGS-verified fixture', () => {
    const verified = loadVerifiedGauges();
    expect(Object.keys(verified.gauges).length).toBeGreaterThan(0);
    for (const stream of streams.values()) {
      for (const gaugeId of stream.gaugeIds) {
        // Non-USGS conditions gauges are namespaced (tva:{LocationID} / usace:{station});
        // their registries + live-capture audits live in apps/api, not in this fixture.
        if (/^(tva|usace):[A-Za-z0-9]{1,10}$/.test(gaugeId)) continue;
        expect(gaugeId).toMatch(/^\d{8}(\.\d+)?$/);
        expect(verified.gauges[gaugeId], `stream ${stream.id}: gauge ${gaugeId} not verified on USGS`).toBeDefined();
      }
    }
  });

  it('cites official sources on every stream and shop', () => {
    for (const stream of streams.values()) {
      expect(stream.officialSources.length, `${stream.id} needs officialSources`).toBeGreaterThanOrEqual(1);
    }
    for (const shop of shops.values()) {
      expect(shop.websiteUrl).toMatch(/^https:\/\//);
      expect(shop.reportsEnabled, 'shops ship un-onboarded').toBe(false);
    }
  });

  it('describes the Fentress Wolf River as a Dale Hollow arm, not Memphis-bound (T1-7)', () => {
    const wolf = streams.get('wolf-river-fentress');
    expect(wolf, 'wolf-river-fentress must stay in the catalog').toBeDefined();
    const notes = String(wolf!.notes);
    expect(notes).not.toMatch(/Memphis-bound/);
    expect(notes).toMatch(/Dale Hollow/);
    expect(wolf!.officialSources.some((s) => s.url.includes('dale-hollow-reservoir')), 'must cite TWRA Dale Hollow').toBe(true);
  });
});

describe('species reference — F2 citation gate', () => {
  it('loads all seven species with zero citation issues', () => {
    expect([...species.keys()].sort()).toEqual([
      'bluegill',
      'channel-catfish',
      'crappie',
      'largemouth-bass',
      'smallmouth-bass',
      'spotted-bass',
      'striped-bass',
    ]);
    expect(speciesIssues, speciesIssues.map((i) => `${i.file}: ${i.message}`).join('\n')).toEqual([]);
    for (const [id, ref] of species) {
      expect(ref.comfort, `${id} needs a comfort block`).toBeDefined();
      expect(ref.comfort.avoidanceC, `${id} needs an avoidance ceiling`).toBeDefined();
    }
  });

  it('FAILS an uncited numeric value (needs-source is the only uncited escape)', () => {
    const bad: Record<string, SpeciesReference> = {
      'test-species': {
        comfort: {
          avoidanceC: { value: 30, basis: 'chronic-mwat' }, // no sources
        },
      },
    };
    const out: { file: string; message: string }[] = [];
    checkSpeciesDoc('fixture.yaml', bad, out);
    expect(out.some((i) => i.message.includes('no source URL'))).toBe(true);
  });

  it('FAILS an all-null band that is not flagged needs-source', () => {
    const out: { file: string; message: string }[] = [];
    checkSpeciesDoc('fixture.yaml', {
      'test-species': { comfort: { lethalC: {} } },
    }, out);
    expect(out.some((i) => i.message.includes('citationStatus: needs-source'))).toBe(true);
  });

  it('FAILS a needs-source band that carries values anyway', () => {
    const out: { file: string; message: string }[] = [];
    checkSpeciesDoc('fixture.yaml', {
      'test-species': {
        comfort: {
          optimalC: { min: 10, max: 20, citationStatus: 'needs-source', sources: ['https://example.gov/x.pdf'] },
        },
      },
    }, out);
    expect(out.some((i) => i.message.includes('needs-source — either cite'))).toBe(true);
  });

  it('FAILS a non-https source URL', () => {
    const out: { file: string; message: string }[] = [];
    checkSpeciesDoc('fixture.yaml', {
      'test-species': { comfort: { avoidanceC: { value: 30, sources: ['http://insecure.example/x'] } } },
    }, out);
    expect(out.some((i) => i.message.includes('not an https URL'))).toBe(true);
  });
});

describe('catalog targetSpecies — F3 evidence trail', () => {
  // F3 rule (ADR 0007): targetSpecies records which of the seven contract game
  // species the water is managed FOR, authored from evidence — never guessed.
  // Every authored water must carry the evidence in its own catalog note or in
  // a special-regulations item that applies to it (the two sanctioned evidence
  // sources from the 2026-09-08 TWRA capture).
  const KEY_EVIDENCE_RE: Record<string, RegExp> = {
    'largemouth-bass': /largemouth/i,
    'smallmouth-bass': /smallmouth/i,
    'spotted-bass': /spotted bass|spotted\b/i,
    crappie: /crappie/i,
    bluegill: /bluegill|bream/i,
    'channel-catfish': /channel catfish|catfish/i,
    'striped-bass': /striped bass|striper|rockfish/i,
  };

  function regsEvidenceFor(streamId: string): string {
    const doc = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'data', 'fishing-information.json'), 'utf8'));
    const fishing = doc.fishing ?? doc;
    const texts: string[] = [];
    for (const section of fishing.sections ?? []) {
      for (const item of section.items ?? []) {
        if ((item.appliesTo ?? []).includes(streamId)) texts.push(String(item.text ?? ''));
      }
    }
    return texts.join(' ');
  }

  it('every targetSpecies water carries note-or-regulation evidence per key', () => {
    for (const [id, stream] of streams) {
      const target = (stream as { targetSpecies?: string[] }).targetSpecies;
      if (!target) continue;
      const note = String(stream.notes ?? '');
      const regs = regsEvidenceFor(id);
      for (const key of target) {
        const re = KEY_EVIDENCE_RE[key];
        expect(re, `${id}: ${key} needs a KEY_EVIDENCE_RE entry`).toBeDefined();
        const inNote = re.test(note);
        const inRegs = re.test(regs);
        expect(inNote || inRegs, `${id}: targetSpecies ${key} has no evidence trail — its note and applied regulations never mention the species (never guessed)`).toBe(true);
      }
    }
  });

  it('targetSpecies keys stay inside the frozen contract enum (schema-validated) and the program species field is untouched', () => {
    const ALLOWED = new Set([
      'largemouth-bass',
      'smallmouth-bass',
      'spotted-bass',
      'crappie',
      'bluegill',
      'channel-catfish',
      'striped-bass',
    ]);
    for (const [, stream] of streams) {
      const target = (stream as { targetSpecies?: string[] }).targetSpecies ?? [];
      for (const key of target) expect(ALLOWED.has(key), `unknown species key ${key}`).toBe(true);
      if (target.length > 0) {
        // targetSpecies never replaces the program-type field.
        expect(['trout', 'warmwater', undefined]).toContain((stream as { species?: string }).species);
      }
    }
  });
});

describe('CHAT-4 Definition of Done floors', () => {
  it('meets the content-count floors', () => {
    expect(bugs.size).toBeGreaterThanOrEqual(FLOORS.bugs);
    expect(patterns.size).toBeGreaterThanOrEqual(FLOORS.patterns);
    expect(streams.size).toBeGreaterThanOrEqual(FLOORS.streams);
    expect(shops.size).toBeGreaterThanOrEqual(FLOORS.shops);
  });

  it('documents (does not fail on) ungauged waters', () => {
    // Gauges are never an inclusion requirement: statewide fishing coverage
    // legitimately grows through ungauged rivers, streams, lakes, and ponds.
    // Preserve the verified gauged-water baseline as an absolute floor instead
    // of making every catalog expansion reduce a percentage-based quality gate.
    const ungauged = [...streams.values()].filter((s) => s.gaugeIds.length === 0);
    const gauged = streams.size - ungauged.length;
    expect(warnings.some((w) => w.message.startsWith('no USGS gaugeIds'))).toBe(true);
    expect(gauged).toBeGreaterThanOrEqual(40);
  });

  it('spreads hatch-chart activity across regions and seasons', () => {
    // Guard against a degenerate chart: every region-month must list something, and no
    // region-month may list absurdly many entries (payload/noise budget).
    for (const [rid, charts] of hatch) {
      for (const chart of charts) {
        expect(chart.entries.length, `hatch/${rid} month ${chart.month} is empty`).toBeGreaterThan(0);
        expect(chart.entries.length, `hatch/${rid} month ${chart.month} is bloated`).toBeLessThanOrEqual(130);
      }
    }
  });
});
