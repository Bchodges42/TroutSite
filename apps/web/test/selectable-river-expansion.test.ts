import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

type AtlasProperties = {
  id: string;
  name: string;
  waterbodyType: string;
  gnisIds?: string[];
  labelMinZoom?: number;
  bounds: number[];
  displayTier?: string;
  nhdPermanentIds?: string[];
};
type AtlasFeature = { properties: AtlasProperties; geometry: { coordinates: unknown } };
type AtlasDocument = { features: AtlasFeature[] };
type IndexEntry = { id: string; labelMinZoom?: number; nhdPermanentIds?: string[] };
type AdditionManifest = {
  candidates: Array<{ id: string; gnisIds: string[]; labelMinZoom: number }>;
  intentionallyUnresolved: Array<{ gnisId: string }>;
};

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const manifest = JSON.parse(
  readFileSync(join(repo, 'apps/web/atlas-sources/selectable-river-additions.json'), 'utf8'),
) as AdditionManifest;
const atlas = JSON.parse(
  readFileSync(join(repo, 'apps/web/public/atlas/rivers.geojson'), 'utf8'),
) as AtlasDocument;
const riverIndex = JSON.parse(
  readFileSync(join(repo, 'apps/web/src/features/map/riverIndex.json'), 'utf8'),
) as IndexEntry[];

const catalogDir = join(repo, 'packages/content/streams/tn');
const catalogIds = readdirSync(catalogDir)
  .filter((file) => file.endsWith('.yaml'))
  .map((file) =>
    readFileSync(join(catalogDir, file), 'utf8')
      .match(/^id:\s*(.+)$/m)?.[1]
      ?.trim(),
  )
  .filter(Boolean)
  .sort();
const atlasById = new Map(atlas.features.map((feature) => [feature.properties.id, feature]));
const indexById = new Map(riverIndex.map((entry) => [entry.id, entry]));

describe('statewide selectable-river expansion', () => {
  it('keeps the catalog, interactive atlas, and camera index in a one-to-one id join', () => {
    const atlasIds = [...atlasById.keys()].sort();
    const indexIds = [...indexById.keys()].sort();
    expect(new Set(catalogIds).size).toBe(catalogIds.length);
    expect(atlasIds).toEqual(catalogIds);
    expect(indexIds).toEqual(catalogIds);
  });

  it('delivers every curated addition with its exact GNIS identity and label tier', () => {
    expect(manifest.candidates).toHaveLength(40);
    for (const candidate of manifest.candidates) {
      const feature = atlasById.get(candidate.id);
      const entry = indexById.get(candidate.id);
      expect(feature, candidate.id).toBeDefined();
      if (!feature) continue;
      expect(feature.properties.gnisIds, candidate.id).toEqual(candidate.gnisIds);
      expect(feature.properties.labelMinZoom, candidate.id).toBe(candidate.labelMinZoom);
      expect(feature.geometry.coordinates.length, candidate.id).toBeGreaterThan(0);
      expect(entry?.labelMinZoom, candidate.id).toBe(candidate.labelMinZoom);
    }
  });

  it('ships an authored display tier and the same exact PID list in the camera index', () => {
    for (const feature of atlas.features) {
      const entry = indexById.get(feature.properties.id);
      expect(['featured', 'standard', 'reference']).toContain(feature.properties.displayTier);
      expect(entry?.nhdPermanentIds).toEqual(feature.properties.nhdPermanentIds ?? []);
    }
  });

  it('does not collapse the two Tennessee Piney Rivers into one entity', () => {
    const hickman = atlasById.get('piney-river-hickman')!;
    const rhea = atlasById.get('piney-river-rhea')!;
    expect(hickman.properties.gnisIds).toEqual(['01306897']);
    expect(hickman.properties.bounds[2]).toBeLessThan(rhea.properties.bounds[0]);
    expect(hickman.properties.name).toContain('Hickman County');
  });

  it('uses one GNIS identity per addition and records unresolved same-name identities separately', () => {
    const ids = manifest.candidates.flatMap((candidate) => candidate.gnisIds);
    expect(new Set(ids).size).toBe(ids.length);
    expect(manifest.intentionallyUnresolved.map((entry) => entry.gnisId)).toEqual(
      expect.arrayContaining(['01295886', '01293672', '01269280', '01273108']),
    );
  });
});
