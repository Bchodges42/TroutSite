import { scoreBand } from '../lib/conditions';

export interface ScorePillProps {
  score: number;
  /** Show the big variant on stream detail; default is compact. */
  size?: 'sm' | 'lg';
  className?: string;
}

const BAND_COLOR: Record<string, string> = {
  good: 'var(--trout-status-good)',
  fair: 'var(--trout-status-fair)',
  poor: 'var(--trout-status-poor)',
};

/** Supplied condition score 0–100 as a colored pill with a plain-English band. */
export function ScorePill({ score, size = 'sm', className }: ScorePillProps) {
  const band = scoreBand(score);
  const color = BAND_COLOR[band];
  const label = band === 'good' ? 'Good' : band === 'fair' ? 'Fair' : 'Poor';
  if (size === 'lg') {
    return (
      <span
        className={`inline-flex min-w-[92px] flex-col items-center rounded-xl px-4 py-2 ${className ?? ''}`}
        style={{ background: 'var(--trout-color-surface)', border: `2px solid ${color}` }}
        aria-label={`Condition score ${score} out of 100 — ${label}`}
      >
        <span className="text-3xl font-extrabold leading-none" style={{ color }}>
          {score}
        </span>
        <span className="mt-1 text-xs font-bold uppercase tracking-wide" style={{ color }}>
          {label}
        </span>
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-extrabold ${className ?? ''}`}
      style={{ background: 'var(--trout-slate-100)', color, border: `1px solid ${color}` }}
      aria-label={`Condition score ${score} out of 100 — ${label}`}
    >
      {score}
      <span className="text-[10px] font-bold uppercase tracking-wide opacity-80">{label}</span>
    </span>
  );
}
