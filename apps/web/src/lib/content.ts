import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { z } from 'zod';
import { FlyPatternSchema, BugTaxonSchema } from '@trout/contracts';
import type { BugTaxon, FlyPattern } from '@trout/contracts';
import { CONTENT_URLS } from './endpoints';
import { fetchSnapshot } from './snapshots';

/**
 * The bundled content pack (§7): taxa + fly patterns, precached by the service
 * worker so the match-the-hatch flow works on a brand-new offline install.
 * Taxa/patterns have no /v1 endpoint (frozen surface); the pack is built by
 * packages/content and copied to /content/*.json at deploy time.
 */
export interface ContentPack {
  taxa: BugTaxon[];
  patterns: FlyPattern[];
}

const CONTENT_TTL_MIN = 7 * 24 * 60; // content is static between content-pack builds

const taxaListSchema = z.array(BugTaxonSchema);
const patternListSchema = z.array(FlyPatternSchema);

export function useContentPack(): UseQueryResult<ContentPack> {
  return useQuery({
    queryKey: ['content-pack'],
    queryFn: async (): Promise<ContentPack> => {
      const [taxa, patterns] = await Promise.all([
        fetchSnapshot(CONTENT_URLS.taxa, taxaListSchema, CONTENT_TTL_MIN),
        fetchSnapshot(CONTENT_URLS.patterns, patternListSchema, CONTENT_TTL_MIN),
      ]);
      return { taxa: taxa.data, patterns: patterns.data };
    },
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
    networkMode: 'offlineFirst',
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

/** Patterns that imitate a taxon, in name order. */
export function patternsForTaxon(patterns: FlyPattern[], taxonId: string): FlyPattern[] {
  return patterns
    .filter((p) => p.imitates.includes(taxonId))
    .sort((a, b) => a.name.localeCompare(b.name));
}
