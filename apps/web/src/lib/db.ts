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
  streamId?: string;
  streamName: string;
  /** YYYY-MM-DD */
  date: string;
  notes: string;
  /** Fly pattern names as free text (kept local; no pattern-id coupling needed). */
  flies: string[];
  createdAt: number;
  updatedAt: number;
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

class TroutDb extends Dexie {
  snapshots!: Table<SnapshotRecord, string>;
  logbook!: Table<LogbookEntry, number>;
  settings!: Table<{ key: string; value: unknown }, string>;
  seen!: Table<SeenRecord, string>;

  constructor() {
    super('trout-web');
    this.version(1).stores({
      snapshots: 'url',
      logbook: '++id, date, streamId',
      settings: 'key',
      seen: 'key',
    });
  }
}

export const db = new TroutDb();

/** Drop every cached snapshot (logbook/settings are the visitor's — never touched). */
export async function clearCachedSnapshots(): Promise<void> {
  await db.snapshots.clear();
  await db.seen.clear();
}
