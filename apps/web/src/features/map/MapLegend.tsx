import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useTheme } from '../../theme/ThemeProvider';
import { SPRING } from '../../components/motion/atlas-motion';
import { FISHERY_TYPE_LABELS, type FisheryType, type FisheryTypeCounts } from './fisheryType';

const OPEN_KEY = 'trout:legendOpen';

/** Row order for the water-class grouping: named classes first, residual last. */
const FISHERY_ROW_ORDER: FisheryType[] = ['tailwater', 'wild', 'stocked', 'other', 'unknown'];

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} aria-hidden /> {label}
    </span>
  );
}

/**
 * Glyphs for the water-class grouping. These rows describe water CLASSES, not
 * condition colors — and they use the SAME hues the map paints: trout-class
 * corridors carry the ice-blue class halo, warmwater the amber one (see
 * rivers-class-outline). A neutral gray row that matched nothing on the canvas
 * read as nonsense.
 */
function CorridorGlyph({ color }: { color: string }) {
  return (
    <span
      className="inline-block h-[3px] w-[17px] rounded-full"
      style={{ background: color }}
      aria-hidden
    />
  );
}

function StillWaterGlyph({ color }: { color: string }) {
  return (
    <span
      className="inline-block h-2.5 w-2.5 rounded-full border-2"
      style={{ borderColor: color, background: 'transparent' }}
      aria-hidden
    />
  );
}

/**
 * MapLegend — collapses to a corner chip by default and expands into a
 * compact glass panel on demand. Pure overlay: it never occupies layout
 * space, and its open/closed choice persists per device.
 *
 * Conditions mode has two honest states, derived from the loaded conditions
 * data (`hasAssessedConditions` — assessedIds.size > 0 for the current mode,
 * never hardcoded): with live assessments it keeps the Good/Fair/Poor
 * rating rows; when the feed carries no assessments it swaps them for a
 * water-class grouping derived from catalog truth (fisheryType.ts). Hatch
 * mode keeps its own halo rows.
 */
export function MapLegend({
  mode,
  species,
  hasAssessedConditions,
  fisheryCounts,
  focusLabel,
  footer,
}: {
  mode: 'conditions' | 'hatches';
  species: 'trout' | 'all';
  /** Whether the current snapshot has any assessed reading in view. */
  hasAssessedConditions: boolean;
  /** Water-class counts across the loaded catalog (fisheryTypeCounts). */
  fisheryCounts?: FisheryTypeCounts;
  /** All-fish mode with a focus species: names whose fishability the colors show. */
  focusLabel?: string | null;
  /** Sources link row (router-aware link supplied by the map page). */
  footer?: ReactNode;
}) {
  // Swatches read the ACTIVE theme's map palette — the legend used to show
  // Nightfall swatches on the Daybreak map (design audit 2026-10-04, P1-1).
  const atlas = useTheme().theme.map;
  const [open, setOpen] = useState<boolean>(() => localStorage.getItem(OPEN_KEY) === '1');
  const toggle = () =>
    setOpen((v) => {
      localStorage.setItem(OPEN_KEY, v ? '0' : '1');
      return !v;
    });

  const grouping = mode === 'conditions' && !hasAssessedConditions;
  // With counts, a class only earns a row when at least one water is in it
  // (and "Unclassified" only appears when the catalog truly has gaps).
  const fisheryRows = FISHERY_ROW_ORDER.filter((t) =>
    fisheryCounts ? (fisheryCounts[t] ?? 0) > 0 : t !== 'unknown',
  );
  // T1-16: the conditions title names the metric that actually exists —
  // "Trout conditions" in trout mode, "Water guide" in all-fish mode. The
  // word "Fishability" returns only when a real per-species metric ships (F6).
  const panelLabel =
    mode === 'hatches'
      ? 'Hatch legend'
      : grouping || species === 'all'
        ? 'Water guide legend'
        : 'Trout conditions legend';
  const panelTitle =
    mode === 'hatches'
      ? 'Hatch activity'
      : grouping || species === 'all'
        ? 'Water guide'
        : 'Trout conditions';

  return (
    <div className="relative">
      <AnimatePresence initial={false} mode="popLayout">
        {open ? (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={SPRING.snappy}
            className="atlas-glass legend-panel"
            aria-label={panelLabel}
          >
            <div className="flex items-center gap-2">
              <p className="legend-title">{panelTitle}</p>
              <button
                type="button"
                onClick={toggle}
                aria-expanded={open}
                aria-label="Hide legend"
                className="atlas-chip legend-collapse ml-auto"
              >
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden focusable="false"><path d="m6 9 6 6 6-6" /></svg>
              </button>
            </div>
            {mode === 'hatches' ? (
              <>
                {/* T2-29: the halo marks ANY charted regional guidance — no
                "dominant hatch" claim. */}
                <p className="legend-note mt-1">
                  Amber halo = the water's region has hatch guidance for the selected month
                </p>
                <div className="mt-1.5 flex gap-2">
                  <LegendSwatch color={atlas.sulphur} label="guidance" />
                  <LegendSwatch color={atlas.noData} label="no chart" />
                </div>
              </>
            ) : grouping ? (
              <>
                <p className="legend-note mt-1">
                  Every mapped water, by fishery class. Blue halo = trout-class water, amber = warmwater.
                </p>
                <ul className="mt-1.5 space-y-1" aria-label="Water classes">
                  {fisheryRows.map((t) => (
                    <li key={t} className="flex items-center gap-1.5">
                      {t === 'other' || t === 'unknown' ? (
                        <StillWaterGlyph color={atlas.warmOutline} />
                      ) : (
                        <CorridorGlyph color={atlas.troutOutline} />
                      )}
                      <span className="legend-label">{FISHERY_TYPE_LABELS[t]}</span>
                      {fisheryCounts && (
                        <span className="legend-note ml-auto">{fisheryCounts[t]}</span>
                      )}
                    </li>
                  ))}
                </ul>
                <p className="legend-note mt-2">
                  Zoom in — regional waters appear around z7½, local creeks alongside the fine
                  stream network near z9½. Only headline waters show statewide.
                </p>
                {species === 'all' && (
                  <p className="legend-note legend-divider mt-2 pt-2">
                    Bass &amp; panfish waters sit under Other fish waters.
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="legend-note mt-1">
                  {focusLabel
                    ? `${focusLabel} fishability, 0–100 · Good ≥70 · Fair ≥40`
                    : 'Flow + temp → 0–100 · Good ≥70 · Fair ≥40'}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-1">
                  <LegendSwatch color={atlas.good} label="Good" />
                  <LegendSwatch color={atlas.fair} label="Fair" />
                  <LegendSwatch color={atlas.poor} label="Poor" />
                  <LegendSwatch color={atlas.noData} label="No data" />
                </div>
                <p className="legend-note mt-1.5">Dimmed dashed line = closed season</p>
              </>
            )}
            {mode === 'conditions' && hasAssessedConditions && species === 'all' && (
              <div className="legend-divider mt-2 pt-2">
                <LegendSwatch color={atlas.warmwater} label="Warmwater — bass & panfish" />
              </div>
            )}
            {footer && <div className="legend-divider legend-footer mt-2 pt-2">{footer}</div>}
          </motion.div>
        ) : (
          <motion.button
            key="chip"
            type="button"
            onClick={toggle}
            aria-expanded={false}
            aria-label="Show legend"
            title="Show legend"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={SPRING.snappy}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            className="atlas-glass atlas-chip legend-chip h-10 gap-2 px-3"
          >
            <span className="flex gap-1" aria-hidden>
              {mode === 'hatches' ? (
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: atlas.sulphur }} />
              ) : grouping ? (
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full border-2"
                  style={{ borderColor: atlas.noData }}
                />
              ) : (
                <>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: atlas.good }} />
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: atlas.fair }} />
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: atlas.poor }} />
                </>
              )}
            </span>
            Legend
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
