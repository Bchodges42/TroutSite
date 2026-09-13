import { useSearchParams } from 'react-router-dom';
import { scoreBand } from '../lib/conditions';
import { SPECIES_LABELS, useFishabilityForWater } from '../lib/fishability';
import { useSettingsContext } from '../lib/settings';
import type { SpeciesKey } from '@trout/contracts';

const BAND_COLOR: Record<string, string> = {
  good: 'var(--trout-status-good)',
  fair: 'var(--trout-status-fair)',
  poor: 'var(--trout-status-poor)',
};

/**
 * F6 (TASK 2/3): one water's focus-species fishability — the comfort score
 * with its own reasons, honest "No data" when the snapshot carried the
 * species but could not assess. Comfort ONLY this stage: the activity
 * breakdown is Stage 4 (F10) and stays out of the UI.
 * Renders nothing outside all-fish mode, without a focus species, or when
 * the water has no snapshot/score for the focus species.
 */
export function FishabilityCard({ streamId, compact = false }: { streamId: string; compact?: boolean }) {
  const { settings } = useSettingsContext();
  const [params] = useSearchParams();
  const focus = params.get('focus') as SpeciesKey | null;
  const query = useFishabilityForWater(streamId);
  const snap = query.data?.data;

  // Same override rule as the map: the shareable ?species= URL param wins.
  const mode = params.get('species') === 'all' || params.get('species') === 'trout'
    ? params.get('species')
    : settings.speciesMode;
  if (mode !== 'all' || !focus || !snap) return null;
  const scored = snap.bySpecies[focus];
  if (!scored) return null;

  const label = SPECIES_LABELS[focus];
  const band = scoreBand(scored.comfort.value);
  const color = BAND_COLOR[band];
  const bandLabel = band === 'good' ? 'Good' : band === 'fair' ? 'Fair' : 'Poor';

  return (
    <div
      className="detail-section fishability-card"
      data-status={scored.comfort.assessed ? band : 'no-data'}
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <span className="eyebrow">Fishability</span>
          <h3 className={compact ? 'text-base font-bold' : 'text-lg font-bold'}>
            {label}
          </h3>
        </div>
        {scored.comfort.assessed ? (
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-extrabold"
            style={{ background: 'var(--trout-slate-100)', color, border: `1px solid ${color}` }}
            aria-label={`${label} fishability ${scored.comfort.value} out of 100 — ${bandLabel}`}
          >
            {scored.comfort.value}
            <span className="text-[10px] font-bold uppercase tracking-wide opacity-80">
              {bandLabel}
            </span>
          </span>
        ) : (
          <span
            className="text-sm font-bold"
            style={{ color: 'var(--trout-color-text-muted)' }}
          >
            No data
          </span>
        )}
      </div>
      {scored.comfort.assessed ? (
        <ul className="mt-2 list-disc pl-5 text-sm">
          {scored.comfort.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm" style={{ color: 'var(--trout-color-text-muted)' }}>
          No fresh enough temperature was available to score this species on this water.
        </p>
      )}
      {scored.comfort.freshness && (
        <p className="muted mt-1 text-xs">
          Observed {new Date(scored.comfort.freshness.observedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}
