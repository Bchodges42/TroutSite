/* eslint-disable no-undef */
/**
 * Single-source builder for enriched classifier inputs on the habitat lane.
 *
 * Assembles EVERYTHING this project extracted, per water, so the code
 * classifier, the Jev escalation state, and the owner review page all see
 * the same evidence:
 *   - habitat-survival evidence record (research batches, batch1-3.json)
 *   - composite row catalog flags (may be stale; evidence outranks them)
 *   - composite-resolved program union: official schedule months + live
 *     ArcGIS stocking-feed programs + warmwater workbook program presence
 *   - Fishbrain angler-catch discovery (PROVISIONAL - discovery evidence,
 *     never a biological abundance estimate), trout-filtered via the
 *     curated species-occurrences catalog (group: 'trout')
 *
 * No prior-model answers (recommendedClass / jev / confidence / flags)
 * ever enter the input - the leakage guard.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');

export function loadExtracted() {
  const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));
  const composite = read('packages/content/research/CLASSIFICATION-COMPOSITE-2026-09-17.json');
  const std = read('packages/content/research/fishbrain-tn-graphql-standard-discovery.json');
  const occ = read('packages/content/data/species-occurrences.json');
  const troutNames = new Set(
    (occ.species ?? []).filter((s) => s.group === 'trout').map((s) => s.displayName.toLowerCase()),
  );
  const fishbrainBySlug = new Map((std.records ?? []).map((r) => [r.catalogWaterId, r]));
  return { composite, fishbrainBySlug, troutNames };
}

export function buildEnrichedInput(rec, composite, fishbrainBySlug, troutNames) {
  const cw = composite.waters?.[rec.slug] ?? {};
  const sources = cw.sources ?? {};
  const feed = sources.arcgis_feed ?? null;
  const warmwater = sources.warmwater_xlsx ?? null;
  const feedPrograms = [...(feed?.programs ?? []), ...(warmwater?.programs ?? [])];
  const fb = fishbrainBySlug.get(rec.slug) ?? null;
  const species = fb?.species ?? [];
  const troutCatches = species
    .filter((s) => troutNames.has(String(s.displayName ?? '').toLowerCase()))
    .map((s) => ({ name: s.displayName, catches: s.catchesCount ?? 0 }));
  const topSpecies = species
    .slice()
    .sort((a, b) => (b.catchesCount ?? 0) - (a.catchesCount ?? 0))
    .slice(0, 6)
    .map((s) => `${s.displayName} (${s.catchesCount ?? 0})`);
  return {
    evidenceRecord: rec,
    catalogRow: cw.catalog ?? {},
    stockingRow: {
      months: cw.seasonMonths ?? [],
      feedPrograms,
      feedEvents: feed?.events ?? [],
      warmwaterProgram: !!warmwater,
    },
    fishbrain: {
      matchStatus: fb?.matchStatus ?? 'no-record',
      loggedCatches: fb?.fishbrainLoggedCatches ?? null,
      pageUrl: fb?.fishbrainPageUrl ?? null,
      troutCatches,
      topSpecies,
    },
  };
}
