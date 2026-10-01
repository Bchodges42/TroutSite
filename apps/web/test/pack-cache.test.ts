import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../src/theme/ThemeProvider';
import { SettingsProvider } from '../src/lib/settings';
import { db } from '../src/lib/db';
import {
  PACK_CACHE_NAME,
  planWaterPack,
  toManifestInput,
} from '../src/lib/packBuilder';
import type { TopoTileInfo } from '../src/lib/packBuilder';
import {
  computePackReadiness,
  getManifest,
  listManifests,
  putManifest,
  waterManifestId,
} from '../src/lib/downloadManifests';
import { PACK_OWNED_CACHES, pin, remove, verify } from '../src/lib/packCache';
import { DownloadButton } from '../src/features/downloads/DownloadButton';
import { SettingsPage } from '../src/pages/SettingsPage';
import type { Stream } from '@trout/contracts';
import type { DownloadManifestRecord } from '../src/lib/db';

/**
 * Pack cache tests (ADR 0012 decisions 3–5): Cache Storage is stood in by a
 * small Map-backed stub (jsdom has none), fetch is stubbed per URL, and Dexie
 * runs on fake-indexeddb (auto-enabled in test setup) — the same stores the
 * app uses. The personal-data-safety test proves a pack removal never opens
 * any personal record.
 */

const TOPO: TopoTileInfo = { pattern: 'hillshade/{z}/{x}/{y}.webp', minZoom: 7, maxZoom: 11 };

function makeStream(overrides: Partial<Stream> = {}): Stream {
  return {
    id: 'caney-fork-river',
    name: 'Caney Fork River',
    stateId: 'TN',
    waterbodyType: 'tailrace',
    regionId: 'tn-east-clinch',
    hydroIdentity: { gnisIds: ['00000001'], huc8s: ['06010201'] },
    gaugeIds: ['03424010'],
    stockingProgram: true,
    idealFlow: [{ min: 100, max: 400, unit: 'cfs' }],
    species: 'trout',
    targetSpecies: ['rainbow', 'brown'],
    fishery: 'tailwater',
    officialSources: [],
    ...overrides,
  } as unknown as Stream;
}

// ── Cache Storage stub (Map-backed) ─────────────────────────────────────────

const stores = new Map<string, Map<string, Response>>();
let fetchCalls: string[] = [];
/** Per-URL overrides: a function returning a Response, or an Error to throw. */
const handlers = new Map<string, () => Response | Promise<Response>>();

function storeFor(name: string): Map<string, Response> {
  let s = stores.get(name);
  if (!s) {
    s = new Map();
    stores.set(name, s);
  }
  return s;
}

function urlOf(req: Request | string): string {
  return typeof req === 'string' ? req : req.url;
}

function installCaches(): void {
  vi.stubGlobal('caches', {
    open: async (name: string) => ({
      put: async (req: Request | string, res: Response) => void storeFor(name).set(urlOf(req), res),
      match: async (req: Request | string) => storeFor(name).get(urlOf(req)),
      delete: async (req: Request | string) => storeFor(name).delete(urlOf(req)),
    }),
    delete: async (name: string) => stores.delete(name),
    match: async (req: Request | string) => {
      for (const s of stores.values()) {
        const hit = s.get(urlOf(req));
        if (hit) return hit;
      }
      return undefined;
    },
  });
}

function installFetch(): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      fetchCalls.push(url);
      const handler = handlers.get(url);
      if (handler) return handler();
      throw new Error(`no fetch stub for ${url}`);
    }) as unknown as typeof fetch,
  );
}

function jsonResponse(url: string, body = '{}'): Response {
  return new Response(body, {
    status: 200,
    headers: { 'content-type': /\.(webp|png)$/.test(url) ? 'image/webp' : 'application/json', 'content-length': String(body.length) },
  });
}

/** Serve every URL the standard plan pins. */
function serveStandardPlan(): void {
  const plan = standardPlan();
  for (const url of plan.assetUrls) {
    handlers.set(url, () => jsonResponse(url, `{"url":"${url}"}`));
  }
}

function standardPlan() {
  return planWaterPack(makeStream(), { month: 9, includeTerrain: true, topo: TOPO });
}

function setOnline(online: boolean): void {
  Object.defineProperty(window.navigator, 'onLine', { value: online, configurable: true });
}

async function seedPersonalData(): Promise<void> {
  await db.logbook.add({
    streamName: 'Clinch River',
    date: '2026-09-30',
    notes: 'personal notes',
    flies: [],
    createdAt: 1,
    updatedAt: 1,
  });
  await db.savedWaters.put({
    waterId: 'clinch-river',
    nameSnapshot: 'Clinch River',
    savedAt: 1,
    groupIds: [],
  });
  await db.trips.put({
    id: 'trip-1',
    title: 'Personal trip',
    waterIds: ['clinch-river'],
    checklist: [],
    createdAt: 1,
    updatedAt: 1,
  });
  await db.photos.put({
    id: 'photo-1',
    blob: new Blob(['pixels']),
    mime: 'image/jpeg',
    bytes: 6,
    createdAt: 1,
  });
  await db.settings.put({ key: 'app', value: { tempUnit: 'F' } });
}

async function personalDataSnapshot() {
  return {
    logbook: await db.logbook.toArray(),
    savedWaters: await db.savedWaters.toArray(),
    trips: await db.trips.toArray(),
    photos: await db.photos.toArray(),
    settings: await db.settings.toArray(),
  };
}

beforeEach(async () => {
  stores.clear();
  fetchCalls = [];
  handlers.clear();
  localStorage.clear();
  await Promise.all([
    db.downloadManifests.clear(),
    db.logbook.clear(),
    db.savedWaters.clear(),
    db.trips.clear(),
    db.photos.clear(),
    db.settings.clear(),
    db.snapshots.clear(),
  ]);
  installCaches();
  installFetch();
  serveStandardPlan();
});

afterEach(() => {
  setOnline(true);
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ── Pin ─────────────────────────────────────────────────────────────────────

describe('pin', () => {
  it('cancels a stalled fetch without retrying it or fetching later sections', async () => {
    const controller = new AbortController();
    const fetcher = vi.fn((_url: string, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('Canceled', 'AbortError')), { once: true });
    }));
    vi.stubGlobal('fetch', fetcher);
    const pending = pin(standardPlan(), undefined, controller.signal);
    await waitFor(() => expect(fetcher).toHaveBeenCalled());
    controller.abort();
    const result = await pending;
    expect(result.cancelled).toBe(true);
    expect(result.ok).toBe(false);
    expect(result.manifest?.sections.some((section) => section.ready)).toBe(false);
    expect(fetcher.mock.calls.length).toBeLessThanOrEqual(4);
  });

  it('keeps an existing pack intact when canceled before starting', async () => {
    const plan = standardPlan();
    const first = await pin(plan);
    const controller = new AbortController();
    controller.abort();
    const result = await pin(plan, undefined, controller.signal);
    expect(result.cancelled).toBe(true);
    expect(result.manifest).toEqual(first.manifest);
  });

  it('marks a section ready only after its URLs are stored, and records real byte sizes', async () => {
    const plan = standardPlan();
    // Gate the LAST section's first tile so earlier sections finish first.
    const terrainCenter = plan.assetUrls.find((u) => /hillshade\/11\//.test(u))!;
    let releaseTerrain: () => void = () => {};
    const terrainGate = new Promise<void>((resolve) => {
      releaseTerrain = resolve;
    });
    handlers.set(terrainCenter, async () => {
      await terrainGate;
      return jsonResponse(terrainCenter);
    });

    const done = pin(plan);
    const midPin = await waitFor(async () => {
      const manifest = await getManifest(plan.id);
      expect(manifest).toBeDefined();
      // Every required section (catalog…geometry) finished before terrain.
      expect(manifest!.sections.filter((s) => s.required).every((s) => s.ready)).toBe(true);
      return manifest!;
    });
    expect(midPin.sections.find((s) => s.key === 'terrain')!.ready).toBe(false);
    expect([...stores.get(PACK_CACHE_NAME)!.keys()].filter((url) => url.includes('/atlas/topo/'))).toHaveLength(17); // all tiles but the gated one

    releaseTerrain();
    const result = await done;
    expect(result.ok).toBe(true);
    const manifest = (await getManifest(plan.id))!;
    expect(manifest.sections.every((s) => s.ready)).toBe(true);
    // Bytes came from real Content-Length headers, never invented.
    const catalog = manifest.sections.find((s) => s.key === 'catalog')!;
    expect(catalog.bytes).toBe(catalogUrls().reduce((n, u) => n + u.length + 10, 0));

    // Every URL actually landed in the cache it belongs to.
    for (const url of plan.assetUrls) {
      const name = PACK_CACHE_NAME;
      expect(stores.get(name)!.has(url)).toBe(true);
    }
  });

  it('records a failed fetch as an honestly partial pack — never ready', async () => {
    const plan = standardPlan();
    handlers.set('/v1/hatch/tn-east-clinch/9.json', () => {
      throw new Error('HTTP 503 for /v1/hatch/tn-east-clinch/9.json');
    });

    const result = await pin(plan);
    expect(result.ok).toBe(false);
    expect(result.failures[0]!.url).toBe('/v1/hatch/tn-east-clinch/9.json');
    const readiness = computePackReadiness((await getManifest(plan.id))!.sections);
    expect(readiness.requiredReady).toBe(false);
    expect(readiness.missingRequired).toContain('hatch');
    // The rest of the pack still landed.
    expect(readiness.anyReady).toBe(true);
  });

  it('retries once before failing a URL', async () => {
    const plan = planWaterPack(makeStream(), { month: 9 });
    let attempts = 0;
    handlers.set('/v1/conditions/latest.json', () => {
      attempts += 1;
      if (attempts === 1) throw new Error('flaky');
      return jsonResponse('/v1/conditions/latest.json');
    });
    const result = await pin(plan);
    expect(attempts).toBe(2);
    expect(result.ok).toBe(true);
  });

  it('refuses to pin while offline and leaves the manifest honestly not-ready', async () => {
    setOnline(false);
    const plan = standardPlan();
    const result = await pin(plan);
    expect(result.offline).toBe(true);
    expect(fetchCalls).toHaveLength(0);
    expect(await getManifest(plan.id)).toBeUndefined();
  });

  it('reports a quota failure and never promotes the pack to ready', async () => {
    const plan = standardPlan();
    // Every put explodes with a quota error.
    vi.stubGlobal(
      'caches',
      (() => {
        const quota = new DOMException('storage full', 'QuotaExceededError');
        return {
          open: async (_name: string) => ({
            put: async () => {
              throw quota;
            },
            match: async () => undefined,
            delete: async () => false,
          }),
        };
      })(),
    );
    const result = await pin(plan);
    expect(result.quota).toBe(true);
    expect(result.ok).toBe(false);
    const manifest = (await getManifest(plan.id))!;
    expect(manifest.sections.every((s) => !s.ready)).toBe(true);
  });
});

function catalogUrls(): string[] {
  return [
    '/v1/streams',
    '/content/fishing.json',
    '/content/taxa.json',
    '/content/patterns.json',
    '/v1/stocking/TN.json',
    '/content/access.json',
    '/v1/reports/recent.json',
  ];
}

// ── Verify ──────────────────────────────────────────────────────────────────

describe('verify', () => {
  it('refuses readiness for an incompatible manifest version even if all files exist', async () => {
    const result = await pin(standardPlan());
    const future = { ...result.manifest!, manifestVersion: 99 };
    await db.downloadManifests.put(future);
    const checked = await verify(future);
    expect(checked.readiness.requiredReady).toBe(false);
    expect(checked.attributionLost).toBe(true);
  });

  it('downgrades a section whose files were evicted from storage', async () => {
    const plan = standardPlan();
    await pin(plan);
    // Browser storage CAN be evicted: drop a terrain tile and a catalog file.
    const tile = [...stores.get(PACK_CACHE_NAME)!.keys()].find((url) => url.includes('/atlas/topo/'))!;
    stores.get(PACK_CACHE_NAME)!.delete(tile);
    stores.get(PACK_CACHE_NAME)!.delete('/content/taxa.json');

    const result = await verify((await getManifest(plan.id))!);
    expect(result.readiness.requiredReady).toBe(false);
    expect(result.readiness.missingRequired).toEqual(['catalog']);
    expect(result.readiness.missingOptional).toEqual(['terrain']);
    const manifest = (await getManifest(plan.id))!;
    expect(manifest.sections.find((s) => s.key === 'terrain')!.ready).toBe(false);
    expect(manifest.sections.find((s) => s.key === 'catalog')!.ready).toBe(false);
    // Untouched sections stay ready — verification never guesses.
    expect(manifest.sections.find((s) => s.key === 'hatch')!.ready).toBe(true);
  });

  it('re-upgrades a section after the files return (re-pin)', async () => {
    const plan = standardPlan();
    const first = await pin(plan);
    stores.get(PACK_CACHE_NAME)!.delete('/content/patterns.json');
    const evicted = await verify(first.manifest!);
    expect(evicted.readiness.requiredReady).toBe(false);
    // Re-download (pin again) and verify: ready once more.
    handlers.clear();
    serveStandardPlan();
    const again = await pin(plan);
    expect(again.ok).toBe(true);
    await verify(again.manifest!);
    const manifest = (await getManifest(plan.id))!;
    expect(manifest.sections.every((s) => s.ready)).toBe(true);
  });

  it('refuses to guess when the plan index was lost — every section reads unverified', async () => {
    const plan = standardPlan();
    const result = await pin(plan);
    localStorage.clear();
    const verified = await verify(result.manifest!);
    expect(verified.attributionLost).toBe(true);
    const manifest = (await getManifest(plan.id))!;
    expect(manifest.sections.every((s) => !s.ready)).toBe(true);
  });
});

// ── Remove ──────────────────────────────────────────────────────────────────

describe('remove', () => {
  async function pinTwoOverlappingPacks() {
    const tailrace = standardPlan(); // caney-fork-river: shared files + own fishability/release/terrain
    const freestone = planWaterPack(
      makeStream({
        id: 'not-in-geo-water',
        name: 'Freestone Creek',
        waterbodyType: 'river',
        fishery: 'wild',
        regionId: 'tn-east-smokies',
        targetSpecies: undefined,
      }),
      { month: 9 },
    );
    for (const url of freestone.assetUrls) handlers.set(url, () => jsonResponse(url, `{"url":"${url}"}`));
    const a = await pin(tailrace);
    const b = await pin(freestone);
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
    return { tailrace, freestone, a, b };
  }

  it('deletes only unshared URLs; other packs keep their files and manifests', async () => {
    const { tailrace, a, b } = await pinTwoOverlappingPacks();

    const result = await remove(a.manifest!);
    const packStore = stores.get(PACK_CACHE_NAME)!;
    const topoStore = stores.get(PACK_CACHE_NAME)!;

    // Shared files survive: the other pack still pins them.
    const missing: string[] = [];
    for (const shared of ['/v1/streams', '/content/fishing.json', '/content/taxa.json', '/content/patterns.json', '/v1/stocking/TN.json', '/v1/conditions/latest.json', '/atlas/rivers.geojson']) {
      if (!packStore.has(shared)) missing.push(shared);
      expect(result.keptSharedUrls).toContain(shared);
    }
    expect(missing).toEqual([]);
    // Water-specific files are gone.
    expect(packStore.has('/v1/fishability/caney-fork-river.json')).toBe(false);
    expect(packStore.has('/v1/release-schedule/caney-fork-river.json')).toBe(false);
    expect(packStore.has('/v1/hatch/tn-east-clinch/9.json')).toBe(false);
    expect([...topoStore.keys()].filter((url) => url.includes('/atlas/topo/'))).toHaveLength(0);

    const manifests = await listManifests();
    expect(manifests.map((m) => m.id)).toEqual([b.manifest!.id]);
    expect((await getManifest(tailrace.id))).toBeUndefined();
  });

  it('removing a pack NEVER touches logs, favorites, trips, photos, or settings', async () => {
    await seedPersonalData();
    const before = await personalDataSnapshot();
    const { a } = await pinTwoOverlappingPacks();

    const openedCaches: string[] = [];
    const realOpen = (globalThis.caches as { open: (n: string) => Promise<unknown> }).open;
    vi.stubGlobal('caches', {
      ...((globalThis as { caches: object }).caches as object),
      open: async (name: string) => {
        openedCaches.push(name);
        return realOpen(name);
      },
    });

    await remove(a.manifest!);

    expect(await personalDataSnapshot()).toEqual(before);
    // The only caches this lane ever opened are its own two.
    for (const name of openedCaches) expect(PACK_OWNED_CACHES).toContain(name);
    // And the Dexie manifest store is the only store it wrote.
    expect(await listManifests()).toHaveLength(1);
  });

  it('is idempotent-safe: removing an already-removed manifest leaves no trace', async () => {
    const plan = standardPlan();
    const { manifest } = await pin(plan);
    await remove(manifest!);
    await remove(manifest!);
    expect(await listManifests()).toHaveLength(0);
  });
});

// ── Render: DownloadButton states ───────────────────────────────────────────

describe('DownloadButton', () => {
  it('offers a basic pack, explicitly chosen terrain, and cancellation', async () => {
    const download = vi.fn();
    const cancel = vi.fn();
    const user = userEvent.setup();
    const view = render(createElement(DownloadButton, { offline: false, onDownload: download }));
    await user.click(screen.getByRole('button', { name: 'Download', exact: true }));
    expect(download).toHaveBeenLastCalledWith(false);
    await user.click(screen.getByRole('checkbox', { name: 'Include terrain (larger download)' }));
    await user.click(screen.getByRole('button', { name: 'Download', exact: true }));
    expect(download).toHaveBeenLastCalledWith(true);
    view.rerender(createElement(DownloadButton, { offline: false, busy: true, onDownload: download, onCancel: cancel }));
    await user.click(screen.getByRole('button', { name: 'Cancel download' }));
    expect(cancel).toHaveBeenCalledOnce();
  });

  const noop = (): void => undefined;

  it('offers Download, disabled with an honest reason while offline', () => {
    render(createElement(DownloadButton, { offline: true, onDownload: noop }));
    const button = screen.getByTestId('pack-download') as HTMLButtonElement;
    expect(button).toBeDisabled();
    expect(button.title).toMatch(/Pinning needs a network connection/);
  });

  it('reads Ready offline / partial-optional / Partial honestly', () => {
    const manifest: DownloadManifestRecord = {
      ...toManifestInput(planWaterPack(makeStream(), { month: 9, includeTerrain: true, topo: TOPO })),
      createdAt: 1,
      updatedAt: 1,
    };
    // Nothing verified yet.
    const { unmount } = render(
      createElement(DownloadButton, { manifest, offline: false, onDownload: noop }),
    );
    expect(screen.getByTestId('pack-state').textContent).toBe('Not downloaded');
    unmount();

    // All required ready, optional terrain missing → partialOptional wording.
    const partialOptional: DownloadManifestRecord = {
      ...manifest,
      sections: manifest.sections.map((s) => (s.required ? { ...s, ready: true } : s)),
    };
    render(createElement(DownloadButton, { manifest: partialOptional, offline: false, onDownload: noop }));
    expect(screen.getByTestId('pack-state').textContent).toBe(
      'Ready offline — optional sections not downloaded',
    );
    cleanup();

    // A required section missing → Partial, with a Download-again affordance.
    const evicted: DownloadManifestRecord = {
      ...partialOptional,
      sections: partialOptional.sections.map((s) =>
        s.key === 'hatch' ? { ...s, ready: false } : s,
      ),
    };
    render(
      createElement(DownloadButton, {
        manifest: evicted,
        offline: false,
        onDownload: noop,
        onRedownload: noop,
      }),
    );
    expect(screen.getByTestId('pack-state').textContent).toBe('Partial');
    expect(screen.getByTestId('pack-redownload').textContent).toBe('Download again');
    cleanup();

    // Fully ready, nothing optional missing.
    const ready: DownloadManifestRecord = {
      ...manifest,
      sections: manifest.sections.map((s) => ({ ...s, ready: true })),
    };
    render(createElement(DownloadButton, { manifest: ready, offline: false, onDownload: noop }));
    expect(screen.getByTestId('pack-state').textContent).toBe('Ready offline');
  });

  it('shows live per-section progress while pinning', () => {
    render(
      createElement(DownloadButton, {
        offline: false,
        busy: true,
        progress: { manifestId: 'water:x', sectionKey: 'terrain', label: 'Terrain (optional hillshade)', done: 4, total: 18 },
        onDownload: noop,
      }),
    );
    expect(screen.getByRole('status').textContent).toBe(
      'Downloading — Terrain (optional hillshade) (4/18)',
    );
  });
});

// ── Render: SettingsPage Downloads section ──────────────────────────────────

describe('SettingsPage — Downloaded packs', () => {
  function renderSettings() {
    render(
      createElement(
        ThemeProvider,
        null,
        createElement(
          SettingsProvider,
          null,
          createElement(MemoryRouter, null, createElement(SettingsPage)),
        ),
      ),
    );
  }

  it('lists manifests with per-section readiness, optional terrain visibly partial', async () => {
    const plan = standardPlan();
    const input = toManifestInput(plan);
    await putManifest({
      ...input,
      sections: input.sections.map((s) => (s.required ? { ...s, ready: true } : s)),
    });

    renderSettings();
    expect(await screen.findByText('Caney Fork River')).toBeInTheDocument();
    expect(screen.getByText('Water pack')).toBeInTheDocument();
    // PackStatus readiness line, matched by testid (DownloadButton carries the
    // same wording, so a bare getByText would be ambiguous).
    expect(screen.getByTestId('pack-readiness').textContent).toBe(
      'Ready offline — optional sections not downloaded',
    );
    expect(screen.getAllByText('Optional — not downloaded').length).toBeGreaterThan(0);
    expect(screen.getByText('Verify')).toBeInTheDocument();
    // Honest storage line only when the browser exposes an estimate.
    expect(screen.queryByText(/No packs downloaded yet/)).not.toBeInTheDocument();
  });

  it('verify re-checks against the caches and flips the readiness line', async () => {
    const plan = standardPlan();
    const input = toManifestInput(plan);
    await putManifest({
      ...input,
      sections: input.sections.map((s) => (s.required ? { ...s, ready: true } : s)),
    });
    // Simulate eviction: none of the URLs actually live in the stub caches.
    stores.clear();

    renderSettings();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Verify' }));

    await waitFor(() =>
      expect(screen.getByTestId('pack-readiness').textContent).toMatch(/Nothing downloaded yet/),
    );
    expect((await getManifest(waterManifestId('caney-fork-river')))!.sections.every((s) => !s.ready)).toBe(true);
  });

  it('remove deletes the manifest and the cached files — personal stores untouched', async () => {
    await seedPersonalData();
    const before = await personalDataSnapshot();
    const plan = standardPlan();
    await pin(plan);
    renderSettings();

    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Remove pack' }));
    await user.click(await screen.findByRole('button', { name: 'Really remove this pack' }));

    await waitFor(async () => expect(await listManifests()).toHaveLength(0));
    expect((await personalDataSnapshot())).toEqual(before);
    expect(await screen.findByText(/No packs downloaded yet/)).toBeInTheDocument();
  });
});
