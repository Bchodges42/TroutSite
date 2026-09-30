import type { StockingEvent } from '@trout/contracts';

/** A raw artifact captured on every fetch — the dispute-resolution audit trail (§8). */
export interface RawArtifact {
  /** File suffix, e.g. `html` or `exceldriven.json` → saved as {date}.{suffix}. */
  suffix: string;
  content: string;
  url: string;
  /**
   * Stable capture identity for the saved filename (F36): which grid/kind the
   * artifact is (e.g. TWRA 'schedule' | 'recent'). Distinct captureKind values
   * keep one fetched artifact from overwriting another that shares a suffix.
   */
  captureKind?: string;
}

/** What an adapter's fetchLatest() hands to normalize(). */
export interface RawFetch {
  artifacts: RawArtifact[];
  fetchedAt: string;
}

export interface FetchCtx {
  fetchImpl: typeof fetch;
  userAgent: string;
  /** Directory for raw snapshots: {rawDir}/{stateId}/{date}.{suffix} */
  rawDir: string;
  now: Date;
  timeoutMs?: number;
}

export interface NormalizeCtx {
  now: Date;
}

export interface NormalizeResult {
  events: StockingEvent[];
  warnings: string[];
}

/**
 * One adapter per state (§8). fetchLatest does network + raw snapshot capture;
 * normalize is PURE (no network, no clock beyond the passed ctx) so it is fully
 * fixture-testable and a redesign can never crash the pipeline.
 */
export interface StateAdapter {
  stateId: string;
  /** Official page the data was scraped from — becomes StockingEvent.sourceUrl. */
  sourceUrl: string;
  fetchLatest(ctx: FetchCtx): Promise<RawFetch>;
  normalize(raw: RawFetch, ctx: NormalizeCtx): NormalizeResult;
}
