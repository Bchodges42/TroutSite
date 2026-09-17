import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { SpeciesOccurrenceCatalogSchema } from '@trout/contracts';
import type { SpeciesOccurrenceCatalog } from '@trout/contracts';
import { fetchSnapshot, type SnapshotResult } from './snapshots';

/** Static between content builds; it is not a live species feed. */
const SPECIES_OCCURRENCES_TTL_MIN = 30 * 24 * 60;
export const SPECIES_OCCURRENCES_URL = '/content/species-occurrences.json';

export function useSpeciesOccurrences(): UseQueryResult<SnapshotResult<SpeciesOccurrenceCatalog>> {
  return useQuery({
    queryKey: ['snapshot', SPECIES_OCCURRENCES_URL],
    queryFn: () => fetchSnapshot(SPECIES_OCCURRENCES_URL, SpeciesOccurrenceCatalogSchema, SPECIES_OCCURRENCES_TTL_MIN),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
    networkMode: 'offlineFirst',
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
