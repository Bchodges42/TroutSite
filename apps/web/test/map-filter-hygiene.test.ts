import { describe, expect, it } from 'vitest';
import {
  atlasStyle,
  catalogTierFilter,
  TIER_HIT_LAYERS,
  MAP_ZOOM_TIERS,
  type BasemapVariant,
} from '../src/features/map/mapStyle';
import { themes } from '../src/theme/themes';

/**
 * Filter hygiene (fix/map-hit-selection).
 *
 * maplibre-gl 6 (style-spec ≥25) compiles ANY filter that mixes legacy
 * tokens ('$type'/'$id') with expression operators as a PURE EXPRESSION —
 * legacy conversion is skipped, so '$type' evaluates as a literal property
 * lookup and is always false. That exact bug made every hit layer match zero
 * features and killed all map clicks/hover while the suite stayed green.
 * Policy after the fix: legacy comparisons are allowed ONLY as standalone
 * filters; compounds ('all'/'any'/'!'/'case'/'match') must be expression-form.
 */

const COMPOUND_OPS = new Set(['all', 'any', '!', 'case', 'match']);
const LEGACY_COMPARISONS = new Set(['==', '!=', '>', '>=', '<', '<=', 'in', '!in']);
const LEGACY_KEYS = new Set(['$type', '$id']);

/** Paths of legacy '$type'/'$id' keys sitting inside a compound filter. */
function legacyKeysInsideCompound(node: unknown, path = 'filter', inside = false): string[] {
  if (!Array.isArray(node)) return [];
  const [op, ...children] = node;
  const nowInside = inside || COMPOUND_OPS.has(op as string);
  const violations: string[] = [];
  if (
    LEGACY_COMPARISONS.has(op as string) &&
    LEGACY_KEYS.has(children[0] as string) &&
    nowInside
  ) {
    violations.push(`${path}[${op} ${String(children[0])}]`);
  }
  children.forEach((child, i) => {
    violations.push(...legacyKeysInsideCompound(child, `${path}[${i}]`, nowInside));
  });
  return violations;
}

function collectStyleFilters(): Map<string, unknown> {
  const filters = new Map<string, unknown>();
  const variants: BasemapVariant[] = ['paper', 'ink', 'topo'];
  for (const variant of variants) {
    for (const theme of Object.values(themes)) {
      for (const options of [
        undefined,
        { roads: { files: [{ file: 'roads-major.geojson', lod: 'major' }] } },
        { reducedMotion: true },
      ] as const) {
        for (const layer of atlasStyle(variant, theme.map, { ...options }).layers) {
          if ('filter' in layer) filters.set(`${variant}/${layer.id}`, layer.filter);
        }
      }
    }
  }
  return filters;
}

describe('map style filter hygiene', () => {
  it('keeps every static style layer filter free of legacy keys inside compounds', () => {
    const violations: string[] = [];
    for (const [where, filter] of collectStyleFilters()) {
      violations.push(...legacyKeysInsideCompound(filter, `${where} ${filter}`));
    }
    expect(violations).toEqual([]);
  });

  it('builds the hit-layer geometry predicates in expression form, never legacy $type', () => {
    expect(TIER_HIT_LAYERS.map(([id]) => id)).toEqual([
      'rivers-hit',
      'rivers-water-hit',
      'rivers-water-hit-outline',
      'rivers-point-hit',
    ]);
    for (const [, baseFilter] of TIER_HIT_LAYERS) {
      expect(JSON.stringify(baseFilter)).not.toContain('$type');
      expect(JSON.stringify(baseFilter)).not.toContain('$id');
      expect(baseFilter[1]).toEqual(['geometry-type']);
    }
  });

  it('keeps every setFilter payload the hit layers can receive free of mixed forms', () => {
    // updateTierHitFilters sets exactly ['all', baseFilter, tierFilter] —
    // sweep the whole zoom range so every tier branch is covered.
    const violations: string[] = [];
    for (const [layerId, baseFilter] of TIER_HIT_LAYERS) {
      for (let z = 0; z <= 16; z += 0.25) {
        const tierFilter = catalogTierFilter(z);
        const payload = ['all', baseFilter, tierFilter];
        violations.push(
          ...legacyKeysInsideCompound(payload, `${layerId}@z${z} ${JSON.stringify(payload)}`),
        );
      }
    }
    expect(violations).toEqual([]);
  });

  it('keeps catalogTierFilter pure expression across the zoom range', () => {
    const json = JSON.stringify(
      Array.from({ length: 65 }, (_, i) => catalogTierFilter(i * 0.25)),
    );
    expect(json).not.toContain('$type');
    expect(json).not.toContain('$id');
    expect(catalogTierFilter(MAP_ZOOM_TIERS.reference.start)[0]).toBe('any');
  });
});
