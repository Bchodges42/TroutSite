import type { PackPlan } from './packBuilder';
import { PACK_CACHE_NAME } from './packBuilder';
import { resolveUrl } from './endpoints';
import { storageEstimate } from './packCache';

export interface PackSizeEstimate {
  bytes: number;
  knownAssets: number;
  unknownAssets: number;
  cachedAssets: number;
  freeBytes: number | null;
}

/** Same unique working set as pinning. HEAD probes never download/pin the pack. */
export async function estimatePackSize(plan: PackPlan, signal?: AbortSignal): Promise<PackSizeEstimate> {
  const urls = [...new Set(plan.assetUrls)];
  let cursor = 0;
  let bytes = 0;
  let knownAssets = 0;
  let cachedAssets = 0;
  const cache = typeof caches === 'undefined' ? null : await caches.open(PACK_CACHE_NAME).catch(() => null);
  const workers = Array.from({ length: Math.min(4, urls.length) }, async () => {
    while (cursor < urls.length && !signal?.aborted) {
      const url = urls[cursor++]!;
      try {
        const cached = await cache?.match(url);
        if (cached?.ok && /(?:json|^image\/)/i.test(cached.headers.get('content-type') ?? '')) {
          const length = (await cached.clone().arrayBuffer()).byteLength;
          bytes += length;
          knownAssets++; cachedAssets++;
          continue;
        }
        const controller = new AbortController();
        const cancel = () => controller.abort();
        const timer = setTimeout(cancel, 8_000);
        signal?.addEventListener('abort', cancel, { once: true });
        if (signal?.aborted) cancel();
        try {
          const response = await fetch(resolveUrl(url), { method: 'HEAD', cache: 'no-store', signal: controller.signal });
          const uncompressed = response.headers.get('x-trout-asset-bytes');
          const raw = uncompressed ?? response.headers.get('content-length');
          const size = raw !== null && /^\d+$/.test(raw) ? Number(raw) : Number.NaN;
          const type = response.headers.get('content-type') ?? '';
          const encoding = response.headers.get('content-encoding');
          // A compressed length is not the bytes Cache Storage will retain.
          if (response.ok && Number.isSafeInteger(size) && size >= 0
            && (uncompressed !== null || !encoding || encoding === 'identity') && /(?:json|^image\/)/i.test(type)) {
            bytes += size; knownAssets++;
          }
        } finally {
          clearTimeout(timer); signal?.removeEventListener('abort', cancel);
        }
      } catch { /* unavailable metadata stays explicitly unknown */ }
    }
  });
  await Promise.all(workers);
  if (signal?.aborted) throw new DOMException('Size check cancelled', 'AbortError');
  const storage = await storageEstimate();
  return { bytes, knownAssets, unknownAssets: urls.length - knownAssets, cachedAssets,
    freeBytes: storage ? Math.max(0, storage.quota - storage.usage) : null };
}

export function sizeEstimateText(estimate: PackSizeEstimate): string {
  const mb = (estimate.bytes / 1_000_000).toFixed(2);
  return estimate.unknownAssets
    ? `At least ${mb} MB; ${estimate.unknownAssets} file sizes unavailable`
    : `Approximately ${mb} MB for the complete pack`;
}
