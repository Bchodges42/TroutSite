// Keep app/Dexie dependencies out of the worker bundle.
export const PINNED_CACHE = 'trout-packs-v1';
export const isPrivatePath = (path: string): boolean => /^\/v1\/(?:portal|corrections|watches|owner)(?:\/|$)/.test(path);

export async function pinnedResponse(request: Request, origin: string): Promise<Response> {
  const url = new URL(request.url);
  if (request.method !== 'GET' || request.mode === 'navigate' || url.origin !== origin ||
    isPrivatePath(url.pathname) || !/^\/(?:v1|data|content|atlas)\//.test(url.pathname)) return Response.error();
  try {
    const hit = await caches.match(request, { cacheName: PINNED_CACHE, ignoreSearch: true });
    if (hit?.ok) return hit;
  } catch { /* Treat unavailable browser storage as an offline miss. */ }
  return Response.error();
}
