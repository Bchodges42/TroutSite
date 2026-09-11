import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { FishingInformationSchema } from '@trout/contracts';
import type { FishingInformation, FishingInfoItem } from '@trout/contracts';
import { fetchSnapshot, type SnapshotResult } from './snapshots';

/**
 * The fishing-information pack file (fishing.json): statewide answers plus
 * per-water special regulations, every item citing its authority and the
 * official page it was verified against. Served alongside the rest of the
 * content pack at /content/fishing.json; cached offline like every snapshot.
 */
const FISHING_TTL_MIN = 7 * 24 * 60; // static between content-pack builds

export const FISHING_INFO_URL = '/content/fishing.json';

export function useFishingInfo(): UseQueryResult<SnapshotResult<FishingInformation>> {
  return useQuery({
    queryKey: ['snapshot', FISHING_INFO_URL],
    queryFn: () => fetchSnapshot(FISHING_INFO_URL, FishingInformationSchema, FISHING_TTL_MIN),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
    networkMode: 'offlineFirst',
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

/** Items of a section that apply to a specific water (appliesTo lists exact ids). */
export function itemsForWater(
  info: FishingInformation | null | undefined,
  sectionId: string,
  waterId: string,
): FishingInfoItem[] {
  const section = info?.sections.find((s) => s.id === sectionId);
  if (!section) return [];
  return section.items.filter((item) => item.appliesTo?.includes(waterId) ?? false);
}

/** All per-water special-regulation items across the document, keyed A→Z by title. */
export function waterRegulationItems(info: FishingInformation | null | undefined): FishingInfoItem[] {
  const section = info?.sections.find((s) => s.id === 'special-regulations');
  if (!section) return [];
  return section.items
    .filter((item) => (item.appliesTo?.length ?? 0) > 0)
    .sort((a, b) => a.title.localeCompare(b.title));
}

/** The single canonical license-purchase destination (the one outbound CTA). */
export const LICENSE_URL = 'https://license.gooutdoorstennessee.com/';
