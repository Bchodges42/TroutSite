// OWNER: ROLE 4. Shared content-pack loading + validation logic (CLI gate in validate.ts,
// Vitest suite in test/, pack builder in build.ts all sit on this).
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';
import {
  BugTaxonSchema,
  FlyPatternSchema,
  StreamSchema,
  ShopSchema,
  HatchChartSchema,
  type BugTaxon,
  type FlyPattern,
  type Stream,
  type Shop,
  type HatchChart,
} from '@trout/contracts';
import { REGION_IDS } from './regions.js';

export interface Issue {
  file: string;
  message: string;
}

export interface LoadedContent {
  bugs: Map<string, BugTaxon & { illustration: string; stages: string[] }>;
  patterns: Map<string, FlyPattern>;
  streams: Map<string, Stream>;
  shops: Map<string, Shop>;
  /** regionId -> month -> HatchChart-shaped month payload */
  hatch: Map<string, HatchChart[]>;
  /** raw SVG markup per taxon id (bugs/illustrations/<id>.svg) */
  illustrations: Map<string, string>;
  issues: Issue[];
  warnings: Issue[];
}

const CONTENT_ROOT = resolve(import.meta.dirname, '..');

function collectYamlFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...collectYamlFiles(p));
    else if (entry.endsWith('.yaml') || entry.endsWith('.yml')) out.push(p);
  }
  return out.sort();
}

function readYaml(file: string): unknown {
  return parse(readFileSync(file, 'utf8'));
}

/**
 * Minimal XML well-formedness check for our own generated line art: balanced open/close tags
 * (self-closing allowed), quoted attributes, and an <svg> root. Deliberately dependency-free.
 */
export function isWellFormedSvg(markup: string): boolean {
  const s = markup.trim();
  if (!s.startsWith('<svg') || !s.endsWith('</svg>')) return false;
  const stack: string[] = [];
  let i = 0;
  while (i < s.length) {
    if (s[i] !== '<') {
      i += 1;
      continue;
    }
    if (s.startsWith('<!--', i)) {
      const end = s.indexOf('-->', i);
      if (end === -1) return false;
      i = end + 3;
      continue;
    }
    const closing = s[i + 1] === '/';
    let j = closing ? i + 2 : i + 1;
    let name = '';
    while (j < s.length && /[A-Za-z0-9:-]/.test(s[j] as string)) {
      name += s[j];
      j += 1;
    }
    if (!name) return false;
    let inQuote: string | null = null;
    let selfClosing = false;
    while (j < s.length) {
      const ch = s[j] as string;
      if (inQuote) {
        if (ch === inQuote) inQuote = null;
      } else if (ch === '"' || ch === "'") {
        inQuote = ch;
      } else if (ch === '>') {
        break;
      } else if (ch === '/' && s[j + 1] === '>') {
        selfClosing = true;
        break;
      }
      j += 1;
    }
    if (j >= s.length) return false; // unterminated tag
    if (inQuote) return false; // unterminated attribute value
    if (closing) {
      if (stack.pop() !== name) return false;
    } else if (!selfClosing) {
      stack.push(name);
    }
    i = j + 1;
  }
  return stack.length === 0;
}

const GAUGE_ID_RE = /^\d{8}(\.\d+)?$/;

interface VerifiedGauges {
  comment: string;
  sourceUrl: string;
  gauges: Record<string, { name: string; realTimeIV: boolean }>;
}

export function loadVerifiedGauges(): VerifiedGauges {
  const file = join(CONTENT_ROOT, 'data', 'verified-gauges.json');
  return JSON.parse(readFileSync(file, 'utf8')) as VerifiedGauges;
}

/** Parse + schema-validate + cross-reference the whole corpus. Never throws on bad content; reports issues. */
export function loadContent(): LoadedContent {
  const issues: Issue[] = [];
  const warnings: Issue[] = [];
  const rel = (file: string) => file.slice(CONTENT_ROOT.length + 1).replaceAll('\\', '/');

  const bugs = new Map<string, BugTaxon & { illustration: string; stages: string[] }>();
  const patterns = new Map<string, FlyPattern>();
  const streams = new Map<string, Stream>();
  const shops = new Map<string, Shop>();
  const hatch = new Map<string, HatchChart[]>();
  const illustrations = new Map<string, string>();

  // --- bugs ---
  for (const file of collectYamlFiles(join(CONTENT_ROOT, 'bugs'))) {
    if (file.includes('illustrations')) continue;
    let data: unknown;
    try {
      data = readYaml(file);
    } catch (err) {
      issues.push({ file: rel(file), message: `invalid YAML: ${(err as Error).message}` });
      continue;
    }
    const parsed = BugTaxonSchema.safeParse(data);
    if (!parsed.success) {
      issues.push({ file: rel(file), message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') });
      continue;
    }
    // Additive Role-4 fields (illustration, stages) are stripped by the frozen schema — take them from raw YAML.
    const raw = data as { illustration?: string; stages?: string[] };
    const taxon = { ...parsed.data, illustration: raw.illustration ?? '', stages: raw.stages ?? [] };
    if (bugs.has(taxon.id)) issues.push({ file: rel(file), message: `duplicate taxon id ${taxon.id}` });
    bugs.set(taxon.id, taxon);

    const unknownRegions = Object.keys(taxon.monthsActiveByRegion ?? {}).filter((r) => !REGION_IDS.has(r));
    if (unknownRegions.length) {
      issues.push({ file: rel(file), message: `monthsActiveByRegion references unknown region(s): ${unknownRegions.join(', ')}` });
    }
  }

  // --- illustrations ---
  const illoDir = join(CONTENT_ROOT, 'bugs', 'illustrations');
  for (const file of collectYamlFiles(illoDir).concat(collectSvgFiles(illoDir))) {
    if (!file.endsWith('.svg')) continue;
    const id = file.slice(illoDir.length + 1, -'.svg'.length);
    const markup = readFileSync(file, 'utf8');
    illustrations.set(`${id}.svg`, markup);
    if (!isWellFormedSvg(markup)) {
      issues.push({ file: rel(file), message: 'SVG is not well-formed' });
    }
  }
  for (const [id, taxon] of bugs) {
    if (!taxon.illustration) {
      issues.push({ file: `bugs/${id}.yaml`, message: 'missing illustration reference' });
      continue;
    }
    const expected = `${id}.svg`;
    if (!illustrations.has(expected)) {
      issues.push({ file: `bugs/${id}.yaml`, message: `illustration not found: ${taxon.illustration}` });
    }
  }

  // --- patterns ---
  for (const file of collectYamlFiles(join(CONTENT_ROOT, 'patterns'))) {
    let data: unknown;
    try {
      data = readYaml(file);
    } catch (err) {
      issues.push({ file: rel(file), message: `invalid YAML: ${(err as Error).message}` });
      continue;
    }
    const parsed = FlyPatternSchema.safeParse(data);
    if (!parsed.success) {
      issues.push({ file: rel(file), message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') });
      continue;
    }
    const pattern = parsed.data;
    if (patterns.has(pattern.id)) issues.push({ file: rel(file), message: `duplicate pattern id ${pattern.id}` });
    patterns.set(pattern.id, pattern);
    if (pattern.license === 'attributed' && !pattern.attribution) {
      issues.push({ file: rel(file), message: 'license "attributed" requires an attribution field' });
    }
  }

  // --- streams ---
  for (const file of collectYamlFiles(join(CONTENT_ROOT, 'streams'))) {
    let data: unknown;
    try {
      data = readYaml(file);
    } catch (err) {
      issues.push({ file: rel(file), message: `invalid YAML: ${(err as Error).message}` });
      continue;
    }
    const parsed = StreamSchema.safeParse(data);
    if (!parsed.success) {
      issues.push({ file: rel(file), message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') });
      continue;
    }
    const stream = parsed.data;
    if (streams.has(stream.id)) issues.push({ file: rel(file), message: `duplicate stream id ${stream.id}` });
    streams.set(stream.id, stream);
    if (!REGION_IDS.has(stream.regionId)) {
      issues.push({ file: rel(file), message: `regionId "${stream.regionId}" is not in the launch-region registry` });
    }
    if (!stream.officialSources?.length) {
      issues.push({ file: rel(file), message: 'streams must cite at least one officialSources entry' });
    }
  }

  // --- shops ---
  for (const file of collectYamlFiles(join(CONTENT_ROOT, 'shops'))) {
    let data: unknown;
    try {
      data = readYaml(file);
    } catch (err) {
      issues.push({ file: rel(file), message: `invalid YAML: ${(err as Error).message}` });
      continue;
    }
    const parsed = ShopSchema.safeParse(data);
    if (!parsed.success) {
      issues.push({ file: rel(file), message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') });
      continue;
    }
    const shop = parsed.data;
    if (shops.has(shop.id)) issues.push({ file: rel(file), message: `duplicate shop id ${shop.id}` });
    shops.set(shop.id, shop);
  }

  // --- hatch charts: hatch/{stateId}/{regionId}.yaml holds all 12 months of one region ---
  for (const file of collectYamlFiles(join(CONTENT_ROOT, 'hatch'))) {
    let data: { regionId?: string; months?: { month: number; entries: unknown[] }[] };
    try {
      data = readYaml(file) as typeof data;
    } catch (err) {
      issues.push({ file: rel(file), message: `invalid YAML: ${(err as Error).message}` });
      continue;
    }
    if (!data.regionId || !Array.isArray(data.months)) {
      issues.push({ file: rel(file), message: 'hatch file must have regionId + months[]' });
      continue;
    }
    if (!REGION_IDS.has(data.regionId)) {
      issues.push({ file: rel(file), message: `unknown regionId "${data.regionId}"` });
      continue;
    }
    if (hatch.has(data.regionId)) {
      issues.push({ file: rel(file), message: `duplicate hatch file for region ${data.regionId}` });
      continue;
    }
    const months: HatchChart[] = [];
    const monthNumbers = new Set<number>();
    for (const entry of data.months) {
      const chart = HatchChartSchema.safeParse({ regionId: data.regionId, month: entry.month, entries: entry.entries });
      if (!chart.success) {
        issues.push({ file: rel(file), message: `month ${entry.month}: ${chart.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}` });
        continue;
      }
      monthNumbers.add(chart.data.month);
      months.push(chart.data);
    }
    for (let m = 1; m <= 12; m++) {
      if (!monthNumbers.has(m)) issues.push({ file: rel(file), message: `missing hatch chart for month ${m}` });
    }
    hatch.set(data.regionId, months);
  }
  for (const rid of REGION_IDS) {
    if (!hatch.has(rid)) {
      issues.push({ file: `hatch`, message: `no hatch chart file for region ${rid}` });
    }
  }

  // --- orphan checks ---
  for (const [id, pattern] of patterns) {
    for (const taxonId of pattern.imitates) {
      if (!bugs.has(taxonId)) {
        issues.push({ file: `patterns/${id}.yaml`, message: `imitates unknown taxon "${taxonId}"` });
      }
    }
  }
  for (const [rid, charts] of hatch) {
    for (const chart of charts) {
      for (const entry of chart.entries) {
        if (!bugs.has(entry.taxonId)) {
          issues.push({ file: `hatch/${rid}.yaml`, message: `month ${chart.month}: entry references unknown taxon "${entry.taxonId}"` });
        }
        for (const patternId of entry.patterns) {
          if (!patterns.has(patternId)) {
            issues.push({ file: `hatch/${rid}.yaml`, message: `month ${chart.month} / ${entry.taxonId}: references unknown pattern "${patternId}"` });
          }
        }
      }
    }
  }

  // --- gauge-ID lint (offline via the USGS-verified fixture) ---
  let verified: VerifiedGauges | null = null;
  try {
    verified = loadVerifiedGauges();
  } catch {
    issues.push({ file: 'data/verified-gauges.json', message: 'verified-gauges fixture missing/unreadable' });
  }
  for (const [id, stream] of streams) {
    if (stream.gaugeIds.length === 0) {
      warnings.push({ file: `streams/${id}.yaml`, message: 'no USGS gaugeIds (documented ungauged water)' });
    }
    for (const gaugeId of stream.gaugeIds) {
      if (!GAUGE_ID_RE.test(gaugeId)) {
        issues.push({ file: `streams/${id}.yaml`, message: `gaugeId "${gaugeId}" is not a USGS site number (8 digits, optionally x.y)` });
      } else if (verified && !verified.gauges[gaugeId]) {
        issues.push({ file: `streams/${id}.yaml`, message: `gaugeId "${gaugeId}" is not in the USGS-verified fixture (data/verified-gauges.json)` });
      } else if (verified && !verified.gauges[gaugeId]?.realTimeIV) {
        warnings.push({ file: `streams/${id}.yaml`, message: `gaugeId "${gaugeId}" had no real-time IV data at fixture time` });
      }
    }
  }

  return { bugs, patterns, streams, shops, hatch, illustrations, issues, warnings };
}

function collectSvgFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isFile() && entry.endsWith('.svg')) out.push(p);
  }
  return out;
}

/** Definition-of-Done floors from the role brief (CHAT-4 scope 1 + DoD). */
export const FLOORS = {
  bugs: 100,
  patterns: 150,
  streams: 60,
  shops: 15,
  /** Megabytes — CHAT-4 scope 2: compact bundled JSON content pack (§ shared context: ≤ 25 MB offline). */
  packMaxMb: 20,
} as const;
