import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Visual-hierarchy lane gates (source + token level, no DOM):
 *
 *  1. index.css codifies the ONE-meaning-per-status-color rule and ships the
 *     shared `.data-value` / `.data-unit` / `.reserve-*` / `.panel-line`
 *     utilities (token-only — no hardcoded colors).
 *  2. The three data surfaces (WaterOverviewCard, ComparePage,
 *     SavedWaterCard) actually opt into those utilities, and the status
 *     semantics they render follow the codified rule (stale = amber, never
 *     red; absence = gray).
 *  3. Reduced-motion guards exist in BOTH token layers.
 *  4. Fraunces / IBM Plex Sans @font-face declarations are untouched.
 *
 * Same style as the bundle-splitting gate: read the sources, assert the
 * contract, so a regression fails fast without a browser.
 */

const webRoot = process.cwd();
const read = (...parts: string[]) => readFileSync(join(webRoot, ...parts), 'utf8');

const indexCss = read('src', 'index.css');
const tokensCss = read('..', '..', 'packages', 'ui', 'tokens.css');
const overviewCard = read('src', 'features', 'waters', 'WaterOverviewCard.tsx');
const comparePage = read('src', 'pages', 'ComparePage.tsx');
const savedCard = read('src', 'features', 'myWaters', 'SavedWaterCard.tsx');
const lastUpdatedChip = read('..', '..', 'packages', 'ui', 'src', 'LastUpdatedChip.tsx');

describe('status color semantics', () => {
  it('index.css codifies the one-meaning rule for every status tone', () => {
    expect(indexCss).toMatch(/STATUS COLOR SEMANTICS/);
    // The rule names all four tones and their meanings.
    expect(indexCss).toMatch(/usable now/);
    expect(indexCss).toMatch(/usable with caveats/);
    expect(indexCss).toMatch(/unsafe or failed/);
    expect(indexCss).toMatch(/no data/);
  });

  it('@trout/ui tokens.css carries the same rule next to the status tokens', () => {
    expect(tokensCss).toMatch(/STATUS COLOR SEMANTICS/);
    expect(tokensCss).toMatch(/--trout-status-fair: var\(--trout-amber-500\)/);
    expect(tokensCss).toMatch(/--trout-status-unknown: var\(--trout-slate-400\)/);
  });

  it('stale data reads amber — never red, never no-data gray — in owned surfaces', () => {
    // LastUpdatedChip (primitive): stale is "usable with caveats" (fair).
    expect(lastUpdatedChip).toMatch(/tone=\{stale \? 'fair' : 'good'\}/);
    expect(lastUpdatedChip).not.toMatch(/'poor'/);
    // SavedWaterCard: source-warning notices are amber, not the danger red.
    expect(savedCard).toMatch(/var\(--trout-status-fair\)/);
    expect(savedCard).not.toMatch(/--trout-color-danger/);
    // ComparePage: stale cells map to the fair token, not muted gray.
    expect(comparePage).toMatch(/'stale'\)\s*return 'var\(--trout-status-fair\)'/);
    expect(comparePage).toMatch(/var\(--trout-status-good\)|var\(--trout-status-fair\)|var\(--trout-status-poor\)/);
  });
});

describe('data alignment + placeholder utilities', () => {
  it('defines .data-value / .data-unit with tabular numerals and token-only color', () => {
    expect(indexCss).toMatch(/\.data-value\s*\{[^}]*font-variant-numeric:\s*tabular-nums/s);
    expect(indexCss).toMatch(/\.data-unit\s*\{[^}]*var\(--ui-muted\)/s);
  });

  it('defines .reserve-* min-height placeholders for late-arriving data', () => {
    expect(indexCss).toMatch(/\.reserve-metrics\s*\{[^}]*min-height/s);
    expect(indexCss).toMatch(/\.reserve-assessment\s*\{[^}]*min-height/s);
  });

  it('defines .panel-line as the single token-based surface edge', () => {
    expect(indexCss).toMatch(/\.panel-line\s*\{[^}]*var\(--ui-border\)/s);
  });

  it('WaterOverviewCard uses the shared data + reserve utilities', () => {
    expect(overviewCard).toMatch(/data-value/);
    expect(overviewCard).toMatch(/data-unit/);
    expect(overviewCard).toMatch(/reserve-metrics/);
    expect(overviewCard).toMatch(/reserve-assessment/);
  });

  it('ComparePage aligns cells on .data-value and reserves row slots', () => {
    expect(comparePage).toMatch(/data-value/);
    expect(comparePage).toMatch(/reserve-metrics/);
    // The mobile card carries its one edge via the token class, not an
    // ad-hoc inline border.
    expect(comparePage).toMatch(/panel-line/);
    expect(comparePage).not.toMatch(/style=\{\{ border:/);
  });

  it('SavedWaterCard aligns metric readouts and reserves the metric slot', () => {
    expect(savedCard).toMatch(/data-value/);
    expect(savedCard).toMatch(/data-unit/);
    expect(savedCard).toMatch(/reserve-metrics/);
  });
});

describe('motion + typography guards', () => {
  it('both token layers honor prefers-reduced-motion', () => {
    expect(indexCss).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
    expect(tokensCss).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
    // The primitives' feedback-only color transitions go still too.
    expect(tokensCss).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.trout-btn[\s\S]*?transition: none !important/,
    );
  });

  it('keeps the Fraunces / IBM Plex Sans font stack untouched', () => {
    expect(indexCss).toMatch(/font-family:\s*'Fraunces'/);
    const plexFaces = indexCss.match(/font-family:\s*'IBM Plex Sans'/g) ?? [];
    expect(plexFaces.length).toBeGreaterThanOrEqual(3);
    // The display/body font tokens stay wired to the loaded families.
    expect(indexCss).toMatch(/--trout-font-display/);
    expect(tokensCss).toMatch(/--trout-font-body/);
  });
});
