import { Link, useParams } from 'react-router-dom';
import { Card, Chip, EmptyState } from '@trout/ui';
import { useContentPack } from '../lib/content';
import type { FlyPattern } from '@trout/contracts';

const TYPE_TONE: Record<FlyPattern['type'], 'neutral' | 'accent' | 'good' | 'fair' | 'poor'> = {
  dry: 'accent', nymph: 'good', emerger: 'fair', spinner: 'fair', streamer: 'poor', wet: 'neutral', terrestrial: 'neutral',
};

/** Fly pattern detail (scope 2): recipe, difficulty, attribution/license. */
export function PatternDetailPage() {
  const { patternId } = useParams();
  const pack = useContentPack();

  if (pack.isLoading) {
    return (
      <main className="page">
        <p className="page-subtitle" role="status">Loading pattern reference…</p>
      </main>
    );
  }

  const pattern = pack.data?.patterns.find((p) => p.id === patternId);
  if (!pattern) {
    return (
      <main className="page">
        <EmptyState
          icon="🪝"
          title="Unknown pattern"
          description="That fly is not in the bundled content pack."
          action={<Link to="/hatch-key" className="focus-ring font-bold underline">Back to the Hatch Key</Link>}
        />
      </main>
    );
  }

  const imitates = pack.data?.taxa.filter((t) => pattern.imitates.includes(t.id)) ?? [];

  return (
    <main className="page">
      <Link to="/hatch-key" className="focus-ring text-sm font-bold underline">
        ← Hatch Key
      </Link>
      <h1 className="page-title mt-3">{pattern.name}</h1>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Chip tone={TYPE_TONE[pattern.type]}>{pattern.type}</Chip>
        <Chip>hooks #{pattern.hookSizes.join(', #')}</Chip>
        <Chip>difficulty {pattern.difficulty}/5</Chip>
      </div>

      <h2 className="section-title">Materials</h2>
      <Card>
        <ul className="list-disc pl-5">
          {pattern.materials.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      </Card>

      <h2 className="section-title">Imitates</h2>
      {imitates.length === 0 ? (
        <p className="page-subtitle">Generalist / attractor — not tied to one insect in the pack.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {imitates.map((t) => (
            <li key={t.id}>
              <Link to={`/taxa/${t.id}`} className="list-row focus-ring" style={{ borderRadius: 'var(--trout-radius-lg)' }}>
                <span className="font-extrabold">{t.commonName}</span>
                <span className="text-sm font-bold" style={{ color: 'var(--trout-color-primary)' }}>
                  Details →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <h2 className="section-title">Notes</h2>
      <Card>
        <p>{pattern.notes}</p>
      </Card>

      {pattern.license === 'attributed' && (
        <Card className="mt-3">
          <p className="text-sm font-bold" style={{ color: 'var(--trout-amber-600)' }}>
            Attribution
          </p>
          <p className="text-sm">{pattern.attribution}</p>
        </Card>
      )}
      <p className="page-subtitle mt-3">
        License: {pattern.license === 'public-domain' ? 'public domain pattern' : 'attributed pattern'}.
      </p>
    </main>
  );
}
