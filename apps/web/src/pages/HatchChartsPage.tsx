import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Chip } from '@trout/ui';
import { currentMonth } from '../lib/time';
import { monthName, monthShort, REGIONS, regionBlurb } from '../data/regions';

/** Hatch charts browse (scope 3): region × month grid into chart details. */
export function HatchChartsPage() {
  const [regionId, setRegionId] = useState(REGIONS[0]?.id ?? '');
  const region = REGIONS.find((r) => r.id === regionId);
  const now = currentMonth();

  return (
    <main className="page">
      <h1 className="page-title">Hatch Charts</h1>
      <p className="page-subtitle">What comes off the water, month by month. Cached for offline use.</p>

      <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Region">
        {REGIONS.map((r) => (
          <button
            key={r.id}
            type="button"
            role="tab"
            aria-selected={r.id === regionId}
            className={`option-card focus-ring min-h-[48px] w-auto flex-1 basis-40 text-sm ${r.id === regionId ? 'is-selected' : ''}`}
            onClick={() => setRegionId(r.id)}
          >
            {r.name}
          </button>
        ))}
      </div>

      {region && (
        <p className="page-subtitle mt-3">{regionBlurb(region.id)}</p>
      )}

      <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
          <Link
            key={m}
            to={`/charts/${regionId}/${m}`}
            className="option-card focus-ring min-h-[64px] flex-col py-2"
          >
            <span className="text-sm font-extrabold">{monthShort(m)}</span>
            {m === now && <Chip tone="accent">now</Chip>}
          </Link>
        ))}
      </div>

      <Card className="mt-6">
        <p className="text-sm">
          Charts summarize regional hatch timing from the content pack. Abundance is a 1–5 guide, not
          a guarantee — always verify conditions on the water.
        </p>
      </Card>
      <p className="page-subtitle mt-3">Currently viewing: {monthName(now)} is pre-marked.</p>
    </main>
  );
}
