import Dexie, { type Table } from 'dexie';

/**
 * Local, private, on-device database. ROLE 2 owns this schema.
 *
 * Three kinds of data live here, and none of it ever leaves the device:
 *  - snapshots: /v1/* snapshot JSON fetched from same-origin endpoints, kept with
 *    fetchedAt/expiresAt so every surface can show "Live · 12 min ago" or
 *    "Offline · last known …" and serve stale data in airplane mode.
 *  - logbook: the visitor's personal fishing log. Dexie-only by design (§1 #2).
 *  - settings: units, default state, reduce-motion (§ scope 8).
 *  - seen: per-stream baseline of the last conditions the visitor looked at, so
 *    StreamDetail can render a "what changed since your last visit" card.
 *
 * Version 2 (ADR 0012) adds the personal planning stores — saved waters,
 * groups, trips, download manifests, and photo attachments — plus optional
 * logbook fields. Every v2 field is optional and every store additive, so
 * existing rows and databases migrate untouched. Downloaded shared data is
 * always separable from personal data: clearing caches must never erase
 * saved waters, trips, logs, groups, or photos.
 */
export interface SnapshotRecord {
  /** Exact request URL (e.g. "/v1/conditions/latest.json"). */
  url: string;
  /** Schema-validated payload. */
  data: unknown;
  /** Epoch millis of the successful fetch. */
  fetchedAt: number;
  /** fetchedAt + TTL; advisory — stale entries are still served offline. */
  expiresAt: number;
}

export interface LogbookEntry {
  id?: number;
  /** Originating on-device plan, used to make recording repeat-safe. */
  tripId?: string;
  streamId?: string;
  streamName: string;
  /** YYYY-MM-DD */
  date: string;
  notes: string;
  /** Fly pattern names as free text (kept local; no pattern-id coupling needed). */
  flies: string[];
  createdAt: number;
  updatedAt: number;
  // ── v2 optional fields (ADR 0012) — absent on pre-migration rows. ──
  /** Local time of day, HH:MM. */
  time?: string;
  durationMinutes?: number;
  /** Caught or targeted species as free text (kept local). */
  species?: string[];
  technique?: string;
  caughtCount?: number;
  releasedCount?: number;
  /** Effort recorded with no catch — "no catch" is an observation, not an omission. */
  blankTrip?: boolean;
  /** Photo attachment ids into the `photos` store. */
  photoIds?: string[];
  /** What the site actually showed when the trip was logged; later refreshes never rewrite it. */
  conditionsSnapshot?: unknown;
  /** The captured conditions' own observation time, distinct from createdAt. */
  conditionsObservedAt?: number;
  /** 'personal-observation' rows are the visitor's own readings — never provider data. */
  entryKind?: 'trip-log' | 'personal-observation';
}

export interface SettingsRecord {
  tempUnit: 'C' | 'F';
  /** F6 site-wide species mode: 'trout' (default) shows trout-condition scores
   *  for trout waters; 'all' shows every water and, where the snapshot has it,
   *  the water's cataloged species fishability. The map's ?species= URL param
   *  overrides this per link (shareable views). */
  speciesMode: 'trout' | 'all';
  /** F6 all-fish focus species ('' = no focus — honest labels everywhere;
   *  a SpeciesKey pins the species across map, lists, detail, and drawer). */
  speciesFocus: string;
  /** Map overlay: statewide USGS real-time stream gauges (feat/tn-gauge-layer).
   *  Off by default — catalog waters stay the story; gauges are context. */
  showGauges: boolean;
  /** Map overlay: TWRA trout stocking sites (static registry, off by default). */
  showStockingSites: boolean;
  /** Map overlay: TWRA fish attractor structures in lakes (zoom-gated detail). */
  showAttractors: boolean;
  reduceMotion: boolean;
  // T2-33: `defaultState` removed — the setting silently emptied every
  // state-scoped page when changed. Tennessee is the only served state.
}

export interface SeenRecord {
  /** "stream:<streamId>" */
  key: string;
  /** Previous ConditionSnapshot.readings the visitor was shown. */
  readings: unknown;
  seenAt: number;
}

/** An explicitly saved favorite water (ADR 0012). Keyed by stable catalog id. */
export interface SavedWaterRecord {
  /** Stable catalog water id. */
  waterId: string;
  /** Name/region as of the save — a retired catalog id stays visible as saved history. */
  nameSnapshot: string;
  regionIdSnapshot?: string;
  savedAt: number;
  /** Private group ids (order-independent membership). */
  groupIds: string[];
}

/** A private, user-named bucket of saved waters ("Local", "Weekend"). */
export interface WaterGroupRecord {
  id: string;
  name: string;
  createdAt: number;
  sortOrder: number;
}

export interface TripChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

/** A planned or past trip (ADR 0012). Private, on-device only. */
export interface TripRecord {
  id: string;
  title: string;
  /** YYYY-MM-DD, planned or actual. */
  date?: string;
  /** Stable catalog water ids in visit order. */
  waterIds: string[];
  /** Intended species, free text. */
  species?: string[];
  checklist: TripChecklistItem[];
  /** Chosen published access-point ids (verified-access records, when present). */
  accessPointIds?: string[];
  notes?: string;
  /** Offline readiness of the trip's packs, mirrored from its manifests. */
  packStatus?: 'none' | 'partial' | 'ready';
  /** Set when the trip is recorded into the logbook. */
  completedAt?: number;
  createdAt: number;
  updatedAt: number;
}

/** One section of a download pack and its verified readiness. */
export interface DownloadSectionState {
  key: string;
  label: string;
  /** Required sections gate "ready"; optional ones (terrain) may stay partial. */
  required: boolean;
  ready: boolean;
  bytes?: number;
}

/**
 * User-managed offline pack manifest (ADR 0012). The Dexie side tracks what a
 * pack is supposed to contain and what has been verified present; the actual
 * Cache-Storage pinning lives in the service-worker layer.
 */
export interface DownloadManifestRecord {
  /** "water:<id>" or "trip:<tripId>". */
  id: string;
  kind: 'water' | 'trip';
  label: string;
  sections: DownloadSectionState[];
  /** Shared asset URLs this pack pins (dedup across overlapping packs at removal). */
  assetUrls: string[];
  totalBytes?: number;
  createdAt: number;
  updatedAt: number;
  manifestVersion: number;
}

/** A local photo attachment. Blobs are compressed and metadata-stripped at capture. */
export interface PhotoRecord {
  id: string;
  logEntryId?: number;
  blob: Blob;
  thumbBlob?: Blob;
  mime: string;
  bytes: number;
  width?: number;
  height?: number;
  createdAt: number;
}

class TroutDb extends Dexie {
  snapshots!: Table<SnapshotRecord, string>;
  logbook!: Table<LogbookEntry, number>;
  settings!: Table<{ key: string; value: unknown }, string>;
  seen!: Table<SeenRecord, string>;
  savedWaters!: Table<SavedWaterRecord, string>;
  waterGroups!: Table<WaterGroupRecord, string>;
  trips!: Table<TripRecord, string>;
  downloadManifests!: Table<DownloadManifestRecord, string>;
  photos!: Table<PhotoRecord, string>;

  constructor() {
    super('trout-web');
    this.version(1).stores({
      snapshots: 'url',
      logbook: '++id, date, streamId',
      settings: 'key',
      seen: 'key',
    });
    // v2 (ADR 0012): additive personal stores. Never remove an index or a
    // store here — old visitors' databases migrate forward in place.
    this.version(2).stores({
      snapshots: 'url',
      logbook: '++id, date, streamId',
      settings: 'key',
      seen: 'key',
      savedWaters: 'waterId, savedAt, *groupIds',
      waterGroups: 'id, sortOrder',
      trips: 'id, updatedAt',
      downloadManifests: 'id, kind, updatedAt',
      photos: 'id, logEntryId, createdAt',
    });
  }
}

export const db = new TroutDb();

/** Drop every cached snapshot (logbook/settings/saved waters/trips/photos are the visitor's — never touched). */
export async function clearCachedSnapshots(): Promise<void> {
  await db.snapshots.clear();
  await db.seen.clear();
}
