import { Link, useSearchParams } from 'react-router-dom';
import { Card, Chip } from '@trout/ui';
import { currentMonth } from '../lib/time';
import { monthName, monthShort, REGIONS, regionBlurb } from '../data/regions';
import { RiverContextBar, contextUrl } from '../lib/riverContext';

/** Hatch charts browse (scope 3): region × month grid into chart details. */
export function HatchChartsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  // Selected region lives in the URL so a region view is shareable and survives reload.
  const regionId = searchParams.get('region') ?? REGIONS[0]?.id ?? '';
  const setRegionId = (id: string) =>
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (id !== regionId) next.delete('river');
        next.set('region', id);
        return next;
      },
      { replace: true },
    );
  const region = REGIONS.find((r) => r.id === regionId);
  const now = currentMonth();

  return (
    <main className="page">
      <RiverContextBar />
      <p className="eyebrow mb-3">A season on the water</p>
      <h1 className="page-title">Hatch calendar.</h1>
      <p className="page-subtitle">
        What comes off the water, month by month. Cached for offline use.
      </p>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Region">
        {REGIONS.map((r) => (
          <button
            key={r.id}
            type="button"
            aria-pressed={r.id === regionId}
            className={`option-card focus-ring min-h-[48px] w-auto flex-1 basis-40 text-sm ${r.id === regionId ? 'is-selected' : ''}`}
            onClick={() => setRegionId(r.id)}
          >
            {r.name}
          </button>
        ))}
      </div>

      {region && <p className="page-subtitle mt-3">{regionBlurb(region.id)}</p>}

      <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
          <Link
            key={m}
            to={contextUrl(`/charts/${regionId}/${m}`, searchParams, {
              region: regionId,
              month: String(m),
            })}
            className="option-card focus-ring min-h-[64px] flex-col py-2"
          >
            <span className="text-sm font-extrabold">{monthShort(m)}</span>
            {m === now && <Chip tone="accent">now</Chip>}
          </Link>
        ))}
      </div>

      <Card className="mt-6">
        <p className="text-sm">
          Charts summarize regional hatch timing from the content pack — expected activity, not a
          guarantee. Something hatches year-round in Tennessee: every month lists what is moving,
          from light to peak. Always verify conditions on the water.
        </p>
      </Card>
      <p className="page-subtitle mt-3">Viewing the {monthName(now)} chart is one tap away.</p>
    </main>
  );
}
