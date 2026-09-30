import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { atlas } from './mapTokens';
import { SPRING } from '../../components/motion/atlas-motion';
import { FISHERY_TYPE_LABELS, type FisheryType, type FisheryTypeCounts } from './fisheryType';

const OPEN_KEY = 'trout:legendOpen';

/**
 * F18: the legend open/closed preference is decoration, so a refused storage
 * read (private mode raises SecurityError on Storage.getItem) must never take
 * the map entry page down with it — the unguarded initializer used to throw and
 * blank the whole home map. Same contract as the theme storage code
 * (themes.ts initialTheme): try storage, fall back to in-memory defaults.
 */
function readLegendOpen(): boolean {
  try {
    return localStorage.getItem(OPEN_KEY) === '1';
  } catch {
    return false; // collapsed chip until the visitor expands it this session
  }
}

function writeLegendOpen(value: boolean): void {
  try {
    localStorage.setItem(OPEN_KEY, value ? '1' : '0');
  } catch {
    /* storage refused the write — the choice simply lasts for this session */
  }
}

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
}: {
  mode: 'conditions' | 'hatches';
  species: 'trout' | 'all';
  /** Whether the current snapshot has any assessed reading in view. */
  hasAssessedConditions: boolean;
  /** Water-class counts across the loaded catalog (fisheryTypeCounts). */
  fisheryCounts?: FisheryTypeCounts;
}) {
  const [open, setOpen] = useState<boolean>(readLegendOpen);
  const toggle = () =>
    setOpen((v) => {
      const next = !v;
      writeLegendOpen(next);
      return next;
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
    // F25: this slot lives in .map-bottom, an absolutely positioned
    // shrink-to-fit container that is as wide as its sibling help paragraph
    // (866px measured in the audit). As a plain relative block it stretched to
    // that width, and `.map-bottom > * { pointer-events: auto }` turned the
    // invisible expanse into a hit area that swallowed clicks meant for the
    // map's bottom-right zoom control. The index.css `.map-bottom >
    // .map-legend-slot` rule (higher specificity, later in the cascade) sizes
    // the slot to its contents and keeps it click-through; only the actual
    // chip/panel re-enable pointer events.
    <div className="map-legend-slot">
      <AnimatePresence initial={false} mode="popLayout">
        {open ? (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={SPRING.snappy}
            className="atlas-glass w-[236px] rounded-2xl px-3.5 py-3 text-xs"
            aria-label={panelLabel}
          >
            <div className="flex items-center gap-2">
              <p className="font-bold text-[color:var(--ui-text)]">{panelTitle}</p>
              <button
                type="button"
                onClick={toggle}
                aria-expanded={open}
                aria-label="Hide legend"
                className="atlas-chip ml-auto h-7 w-7 rounded-full text-[color:var(--ui-muted)]"
              >
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden focusable="false"><path d="m6 9 6 6 6-6" /></svg>
              </button>
            </div>
            {mode === 'hatches' ? (
              <>
                {/* T2-29: the halo marks ANY charted regional guidance (the
                map help says the same) — no "dominant hatch" claim. F20: the
                night-palette hexes read 1.13–2.17:1 on the Daybreak glass
                surface; every text/divider below uses the shared theme
                tokens, which pass 4.5:1 in all five presets (pinned in
                map-legend.test.tsx). */}
                <p className="mt-1 text-[color:var(--ui-muted)]">
                  Amber halo = the water's region has hatch guidance for the selected month
                </p>
                <div className="mt-1.5 flex gap-2">
                  <LegendSwatch color={atlas.sulphur} label="guidance" />
                  <LegendSwatch color={atlas.noData} label="no chart" />
                </div>
              </>
            ) : grouping ? (
              <>
                <p className="mt-1 text-[color:var(--ui-muted)]">
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
                      <span className="text-[color:var(--ui-text)]">{FISHERY_TYPE_LABELS[t]}</span>
                      {fisheryCounts && (
                        <span className="ml-auto text-[color:var(--ui-muted)]">{fisheryCounts[t]}</span>
                      )}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[color:var(--ui-muted)]">
                  Zoom in — regional waters appear around z7½, local creeks alongside the fine
                  stream network near z9½. Only headline waters show statewide.
                </p>
                {species === 'all' && (
                  <p className="mt-2 border-t pt-2 text-[color:var(--ui-muted)]" style={{ borderColor: 'var(--ui-border)' }}>
                    Bass &amp; panfish waters sit under Other fish waters.
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="mt-1 text-[color:var(--ui-muted)]">Flow + temp → 0–100 · Good ≥70 · Fair ≥40</p>
                <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-1">
                  <LegendSwatch color={atlas.good} label="Good" />
                  <LegendSwatch color={atlas.fair} label="Fair" />
                  <LegendSwatch color={atlas.poor} label="Poor" />
                  <LegendSwatch color={atlas.noData} label="No data" />
                </div>
              </>
            )}
            {mode === 'conditions' && hasAssessedConditions && species === 'all' && (
              <div className="mt-2 border-t pt-2" style={{ borderColor: 'var(--ui-border)' }}>
                <LegendSwatch color={atlas.warmwater} label="Warmwater — bass & panfish" />
              </div>
            )}
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
            className="atlas-glass atlas-chip h-10 gap-2 px-3 text-xs font-bold text-[color:var(--ui-text)]"
          >
            <span className="flex gap-1" aria-hidden>
              {grouping ? (
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
