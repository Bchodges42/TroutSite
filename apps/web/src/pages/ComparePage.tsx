import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { ConditionSnapshotSchema, StockingEventSchema } from '@trout/contracts';
import type { ConditionSnapshot, SpeciesKey, StockingEvent, Stream } from '@trout/contracts';
import { EmptyState } from '@trout/ui';
import { useStreamsCatalog } from '../lib/useStreamsCatalog';
import { useSnapshotQuery } from '../lib/useSnapshotQuery';
import { snapshotUrls } from '../lib/endpoints';
import { matchStocking } from '../lib/stockingMatch';
import { flowTrend } from '../lib/conditions';
import { buildWaterOverview } from '../lib/waterOverview';
import { useSettingsContext } from '../lib/settings';
import { currentMonth } from '../lib/time';
import { SPECIES_LABELS, useFishabilityIndex } from '../lib/fishability';
import { statusForScore, type ConditionStatus } from '../features/map/riverMapSelectors';
import { toWaterDecisionView } from '../features/map/waterDecision';
import { RiverSearch } from '../features/map/RiverSearch';
import {
  buildCompareColumn,
  COMPARE_HONESTY_NOTE,
  COMPARE_ROW_KEYS,
  COMPARE_ROW_LABELS,
  MAX_COMPARE_WATERS,
  parseCompareParams,
  serializeCompareParams,
  speciesKeyLabel,
  type CompareCell,
  type CompareCellTone,
  type CompareColumnInput,
  type CompareRowKey,
} from '../features/compare/compareModel';

/**
 * /compare — side-by-side comparison of up to THREE waters, driven entirely by
 * the URL (?waters=<id1,id2,id3>&species=<optional focus>) so a comparison is
 * shareable and bookmarkable. Private notes and any other on-device state
 * NEVER enter the URL — only water ids and the shared species context.
 *
 * Every column is built from the ONE composed WaterOverview per water
 * (buildWaterOverview, ADR 0013) — this page recomputes nothing: no scores,
 * no freshness, no classification. It aligns rows and keeps honesty rules:
 * no overall winner, unassessed stays unassessed, missing data reads
 * "No data", and each metric keeps its own observation age.
 */

const ConditionsSchema = z.array(ConditionSnapshotSchema);
const StockingSchema = z.array(StockingEventSchema);

const BAND_COLOR: Record<string, string> = {
  good: 'var(--trout-status-good)',
  fair: 'var(--trout-status-fair)',
  poor: 'var(--trout-status-poor)',
};

// Status semantics (see the STATUS COLOR SEMANTICS block in index.css): a
// stale reading is still usable — amber, not gray (gray is reserved for
// "no data") and never red. Band tones carry their band word as text; color
// only reinforces.
function toneColor(tone: CompareCellTone): string | undefined {
  if (tone === 'good' || tone === 'fair' || tone === 'poor') return BAND_COLOR[tone];
  if (tone === 'stale') return 'var(--trout-status-fair)';
  return undefined;
}

/** One rendered column: aligned cells plus the identity text used for labels. */
interface CompareColumnView {
  waterId: string;
  name: string;
  cells: Record<CompareRowKey, CompareCell>;
}

function CellValue({ cell, strong = true }: { cell: CompareCell; strong?: boolean }) {
  const color = toneColor(cell.tone);
  return (
    // Reserve: rows gain their detail line when the late snapshot lands — the
    // reserved min-height keeps rows below from shifting mid-tap.
    <span className="reserve-metrics flex flex-col gap-0.5">
      <span className={strong ? 'data-value' : ''} style={color ? { color } : undefined}>
        {cell.text}
      </span>
      {cell.detail && <span className="muted text-xs">{cell.detail}</span>}
    </span>
  );
}

export function ComparePage() {
  const [params, setParams] = useSearchParams();
  const { settings } = useSettingsContext();
  // One deterministic clock per mount: overview ages and cell details agree
  // for the whole board instead of drifting between renders.
  const [nowMs] = useState(() => Date.now());
  const month = useMemo(() => currentMonth(new Date(nowMs)), [nowMs]);

  const parsed = useMemo(() => parseCompareParams(params), [params]);

  // Same catalog authority every other surface uses (live feed → Dexie → pack).
  const streamsQ = useStreamsCatalog(60 * 24);
  const streams = useMemo(() => (streamsQ.data?.data ?? []) as Stream[], [streamsQ.data]);
  const conditionsQ = useSnapshotQuery(snapshotUrls.conditionsLatest, ConditionsSchema, 60);
  const stockingQ = useSnapshotQuery(snapshotUrls.stocking('TN'), StockingSchema, 60 * 24);
  const speciesContext = parsed.species ?? (settings.speciesFocus || null);
  const focus = speciesContext && speciesContext in SPECIES_LABELS ? speciesContext as SpeciesKey : null;
  const mode = parsed.species === 'trout' ? 'trout' : focus ? 'all' : settings.speciesMode;
  const selectedStreams = useMemo(() => streams.filter((stream) => parsed.waterIds.includes(stream.id)), [streams, parsed.waterIds]);
  const fishabilityQ = useFishabilityIndex(selectedStreams, focus, mode === 'all');

  const conditionsById = useMemo(() => {
    const m = new Map<string, ConditionSnapshot>();
    for (const snap of conditionsQ.data?.data ?? []) m.set(snap.streamId, snap);
    return m;
  }, [conditionsQ.data]);

  const stockingEvents = useMemo(() => stockingQ.data?.data ?? [], [stockingQ.data]);
  const stockingByStream = useMemo(() => {
    if (!streams.length) return new Map<string, StockingEvent[]>();
    return matchStocking(streams, stockingEvents).byStream;
  }, [streams, stockingEvents]);

  const applyIds = (ids: string[]) => {
    setParams(serializeCompareParams(ids, parsed.species));
  };
  const removeWater = (id: string) => applyIds(parsed.waterIds.filter((w) => w !== id));
  const addWater = (id: string) => {
    if (!parsed.waterIds.includes(id) && parsed.waterIds.length < MAX_COMPARE_WATERS) {
      applyIds([...parsed.waterIds, id]);
    }
  };

  const columns = useMemo<CompareColumnView[]>(() => {
    return parsed.waterIds.map((id) => {
      const stream = streams.find((s) => s.id === id);
      let built: ReturnType<typeof buildCompareColumn>;
      if (!stream) {
        built = buildCompareColumn(id, null, { tempUnit: settings.tempUnit, nowMs });
      } else {
        const snap = conditionsById.get(id) ?? null;
        const score = snap?.score?.value ?? null;
        const status: ConditionStatus = statusForScore(score, !!snap, snap?.score?.assessed);
        const comfort = focus ? fishabilityQ.data?.[id]?.bySpecies[focus]?.comfort : undefined;
        const fishability = focus && comfort ? { species: focus, comfort } : null;
        const decision = toWaterDecisionView(
          { stream, status, score, snapshot: snap ?? undefined, species: stream.species },
          mode,
          month,
          fishability,
        );
        const lastEvent = stockingByStream.get(id)?.[0];
        const overview = buildWaterOverview({
          stream,
          decision,
          conditions: snap,
          offlineSaved: snap != null && !conditionsQ.data?.live,
          nowMs,
          lastStockingEvent: lastEvent
            ? { date: lastEvent.date, precision: lastEvent.datePrecision, species: lastEvent.species }
            : undefined,
        });
        const input: CompareColumnInput = {
          overview,
          flowTrend: snap ? flowTrend(snap.readings) : 'unknown',
          status,
          species: stream.species,
          fishability,
        };
        built = buildCompareColumn(id, input, { tempUnit: settings.tempUnit, nowMs });
      }
      return { waterId: id, name: built.cells.identity.text, cells: built.cells };
    });
  }, [parsed.waterIds, streams, conditionsById, stockingByStream, settings.tempUnit, mode, focus, fishabilityQ.data, conditionsQ.data?.live, month, nowMs]);

  // One species context for ALL columns: the shareable ?species= param, else
  // the site's persisted focus (read-only — the page never rewrites settings).
  const speciesLabel = speciesContext
    ? speciesContext in SPECIES_LABELS
      ? SPECIES_LABELS[speciesContext as SpeciesKey]
      : speciesKeyLabel(speciesContext)
    : null;

  const removeLabel = (col: CompareColumnView) => `Remove ${col.name} from comparison`;

  const pickerStreams = useMemo(
    () =>
      streams
        .filter((s) => !parsed.waterIds.includes(s.id))
        .map((s) => ({ id: s.id, name: s.name, aliases: s.aliases, regionId: s.regionId })),
    [streams, parsed.waterIds],
  );

  const board = (
    <>
      {/* Desktop: one aligned table — label column + one column per water, every row synchronized. */}
      <table className="hidden sm:table w-full border-collapse text-left text-sm" data-testid="compare-board-desktop">
        <caption className="sr-only">
          Side-by-side comparison of {columns.length} water{columns.length === 1 ? '' : 's'}
        </caption>
        <tbody>
          {COMPARE_ROW_KEYS.map((key) => (
            <tr key={key} className="border-b align-top" style={{ borderColor: 'var(--ui-border)' }}>
              <th scope="row" className="py-3 pr-4 font-bold">
                {COMPARE_ROW_LABELS[key]}
              </th>
              {columns.map((col) => (
                <td key={col.waterId} className="py-3 pl-4 pr-4">
                  {key === 'identity' ? (
                    <div className="flex items-start justify-between gap-2">
                      <CellValue cell={col.cells.identity} />
                      <button
                        type="button"
                        className="filter-select text-xs"
                        aria-label={removeLabel(col)}
                        onClick={() => removeWater(col.waterId)}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <CellValue cell={col.cells[key]} />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile: stacked compact cards, sections in the SAME row order so they stay mentally alignable. */}
      <div className="mt-4 grid gap-3 sm:hidden" data-testid="compare-board-mobile">
        {columns.map((col) => (
          <section
            key={col.waterId}
            /* panel-line: the card's ONE token edge — no nested bordered
               boxes inside; rows separate by spacing alone. */
            className="detail-section panel-line rounded-xl p-3"
            aria-label={col.cells.identity.text}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-base font-bold">{col.cells.identity.text}</h2>
                {col.cells.identity.detail && <p className="muted text-xs">{col.cells.identity.detail}</p>}
              </div>
              <button
                type="button"
                className="filter-select text-xs"
                aria-label={removeLabel(col)}
                onClick={() => removeWater(col.waterId)}
              >
                Remove
              </button>
            </div>
            <dl className="mt-3 flex flex-col gap-3">
              {COMPARE_ROW_KEYS.slice(1).map((key) => (
                /* Reserve: keeps each row's slot steady while the snapshot
                   fills in values + detail lines. */
                <div key={key} className="reserve-metrics">
                  <dt className="text-xs font-bold uppercase tracking-wide">{COMPARE_ROW_LABELS[key]}</dt>
                  <dd className="mt-0.5 text-sm">
                    <CellValue cell={col.cells[key]} />
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </>
  );

  return (
    <main className="page compare-page">
      <h1 className="page-title">Compare waters</h1>
      <p className="page-subtitle mt-1">{COMPARE_HONESTY_NOTE}</p>
      <p className="page-subtitle mt-1">
        {speciesLabel ? (
          <>
            Species context: <strong>{speciesLabel}</strong>
            {parsed.species ? '' : ' (from your saved settings)'} — one context for every column.
          </>
        ) : (
          'No species focus selected — each water shows its own catalog opportunity.'
        )}
      </p>

      {streamsQ.isLoading && (
        <p className="page-subtitle mt-6" role="status">
          Loading the water catalog…
        </p>
      )}
      {streamsQ.isError && (
        <div className="mt-6">
          <EmptyState
            title="Water catalog unavailable"
            description="Comparison needs the catalog to identify waters. Check your connection and try again — saved waters still work from their cards."
            action={
              <Link to="/browse" className="nav-link">
                Browse waters
              </Link>
            }
          />
        </div>
      )}

      {!streamsQ.isLoading && !streamsQ.isError && parsed.waterIds.length === 0 && (
        <div className="mt-6">
          <EmptyState
            title="Nothing to compare yet"
            description="Compare up to three waters side by side — opportunity, assessment, flow, temperature, stocking and release applicability, each with its own observation age. Pick waters from the catalog to start."
            action={
              <Link to="/browse" className="nav-link">
                Browse waters
              </Link>
            }
          />
        </div>
      )}

      {!streamsQ.isLoading && !streamsQ.isError && columns.length > 0 && <>
        {board}
        <Link className="secondary-action focus-ring mt-4 inline-flex" to={`/trips?waters=${parsed.waterIds.map(encodeURIComponent).join(',')}&title=Compared%20waters`}>Prepare a trip with these waters</Link>
      </>}

      {conditionsQ.isLoading && columns.length > 0 && !streamsQ.isError && (
        <p className="page-subtitle mt-4" role="status">
          Loading latest conditions…
        </p>
      )}

      {!streamsQ.isLoading && !streamsQ.isError && (
        <div className="mt-6">
          {parsed.waterIds.length >= MAX_COMPARE_WATERS ? (
            <p className="muted text-sm" role="note" data-testid="compare-cap-note">
              Three waters is the comparison limit — remove one to add another.
            </p>
          ) : (
            parsed.waterIds.length > 0 && (
              <div className="max-w-md">
                <span className="eyebrow">Add a water</span>
                <RiverSearch
                  streams={pickerStreams}
                  onSelect={addWater}
                  placeholder="Add a water to compare…"
                  shortcut={false}
                  showShortcut={false}
                />
              </div>
            )
          )}
          {parsed.overCap.length > 0 && (
            <p className="muted text-sm" role="note" data-testid="compare-overcap-note">
              A shared comparison holds {MAX_COMPARE_WATERS} waters — {parsed.overCap.length}{' '}
              more water{parsed.overCap.length === 1 ? ' was' : 's were'} left out of this link.
            </p>
          )}
        </div>
      )}
    </main>
  );
}
