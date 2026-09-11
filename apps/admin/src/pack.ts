// OWNER: ROLE 4. Loads the built content pack (@trout/content dist/pack) at build time so the
// composer's stream + hot-pattern pickers work offline-statically — no extra API endpoints needed.
// Run `pnpm --filter @trout/content build` if these imports fail during `pnpm -r build`.
import streamsJson from '@trout/content/pack/streams.json';
import patternsJson from '@trout/content/pack/patterns.json';
import type { FlyPattern, Stream } from '@trout/contracts';

export interface Catalog {
  streams: Stream[];
  patterns: FlyPattern[];
}

export const catalog: Catalog = {
  // The pack is generated from the same YAML the validate gate checks; trust its shape here.
  streams: (streamsJson as { streams: Stream[] }).streams,
  patterns: (patternsJson as { patterns: FlyPattern[] }).patterns,
};
