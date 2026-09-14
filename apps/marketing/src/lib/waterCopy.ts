import type { Stream } from '@trout/contracts';

/** Marketing copy must describe the cataloged fishery, not assume every water is trout water. */
export function fishingNoun(stream: Pick<Stream, 'species'>): 'fly fishing' | 'fishing' {
  return stream.species === 'trout' ? 'fly fishing' : 'fishing';
}

export function featureClaims(opts: { hasFishability: boolean; hasIdealFlow: boolean }): string[] {
  return [
    opts.hasFishability ? 'a per-species fishability score' : null,
    opts.hasIdealFlow ? 'typical flow ranges' : null,
  ].filter((claim): claim is string => claim !== null);
}

export function waterPageTitle(
  stream: Pick<Stream, 'name' | 'species'>,
  opts: { hasFishability: boolean; hasIdealFlow: boolean },
): string {
  const claims = featureClaims(opts);
  const feature = claims.length > 0 ? ` — ${claims.join(' & ')}` : '';
  return `${stream.name} ${fishingNoun(stream)} — conditions${feature}`;
}

export function waterPageDescription(
  stream: Pick<Stream, 'name' | 'species'>,
  stateName: string,
  opts: { hasFishability: boolean; hasIdealFlow: boolean },
): string {
  const claims = featureClaims(opts);
  const evidence = claims.length > 0 ? `${claims.join(', ')}, ` : '';
  return `${stream.name} (${stateName}): ${evidence}TWRA stocking history, hatch-chart highlights, and official sources to verify. Free fishing guide — no trackers.`;
}
