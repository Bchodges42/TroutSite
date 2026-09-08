import { Link, useParams, useSearchParams } from 'react-router-dom';
import { RiverContextBar, contextUrl } from '../lib/riverContext';
import { Card, Chip, EmptyState } from '@trout/ui';
import type { BugTaxon, FlyPattern } from '@trout/contracts';
import { patternsForTaxon, useContentPack } from '../lib/content';
import { taxonPhoto } from '../lib/taxonImages';
import { TaxonArt } from '../components/art/TaxonArt';
import { monthShort, REGIONS } from '../data/regions';

/** Taxon detail (scope 2): art, key attributes, season table, sources, patterns. */
export function TaxonDetailPage() {
  const { taxonId } = useParams();
  const [params] = useSearchParams();
  const pack = useContentPack();

  if (pack.isLoading) {
    return (
      <main className="page">
        <p className="page-subtitle" role="status">
          Loading bug reference…
        </p>
      </main>
    );
  }

  const taxon = pack.data?.taxa.find((t) => t.id === taxonId);
  if (!taxon) {
    return (
      <main className="page">
        <EmptyState
          icon="🪰"
          title="Unknown insect"
          heading="h1"
          description="That taxon is not in the bundled content pack."
          action={
            <Link to={contextUrl('/hatch-key', params)} className="focus-ring font-bold underline">
              Back to the Hatch Key
            </Link>
          }
        />
      </main>
    );
  }

  const patterns = pack.data ? patternsForTaxon(pack.data.patterns, taxon.id) : [];

  return (
    <main className="page">
      <RiverContextBar />
      <Link
        to={contextUrl('/hatch-key', params)}
        className="focus-ring text-sm font-bold underline"
      >
        ← Hatch Key
      </Link>
      <div className="reference-heading mt-3 flex items-start gap-4">
        <div className="shrink-0" style={{ color: 'var(--trout-color-primary)' }}>
          <TaxonArt taxon={taxon} size={132} />
        </div>
        <div className="min-w-0">
          <h1 className="page-title">{taxon.commonName}</h1>
          <p className="text-sm italic" style={{ color: 'var(--trout-color-text-muted)' }}>
            {taxon.sciName}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Chip tone="accent">{taxon.order}</Chip>
            <Chip>{taxon.family}</Chip>
            <Chip>
              hooks #{taxon.sizeRange[0]}–#{taxon.sizeRange[1]}
            </Chip>
          </div>
        </div>
      </div>

      <TaxonPhotoCard taxon={taxon} />

      <h2 className="section-title">Key attributes</h2>
      <Card>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
          <Row label="Tails" value={String(taxon.keyAttributes.tails)} />
          <Row label="Gills" value={taxon.keyAttributes.gills} />
          <Row label="Body shape" value={taxon.keyAttributes.bodyShape} />
          <Row label="Body colors" value={taxon.keyAttributes.bodyColor.join(', ')} />
          <Row label="Mouthparts" value={taxon.keyAttributes.mouthparts} />
          <Row label="Habitat" value={taxon.habitat.join(', ')} />
        </dl>
      </Card>

      <h2 className="section-title">Active months by region</h2>
      <div className="flex flex-col gap-3">
        {REGIONS.filter((r) => taxon.monthsActiveByRegion[r.id]?.length).map((r) => (
          <Card key={r.id} className="!py-3">
            <h3 className="text-sm font-bold">{r.name}</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                const active = (taxon.monthsActiveByRegion[r.id] ?? []).includes(m);
                return (
                  <span
                    key={m}
                    role="img"
                    className="inline-flex h-8 w-10 items-center justify-center rounded-md text-xs font-bold"
                    style={{
                      background: active ? 'var(--trout-green-100)' : 'var(--trout-slate-100)',
                      color: active ? 'var(--trout-green-900)' : 'var(--ui-muted)',
                    }}
                    aria-label={`${monthShort(m)}: ${active ? 'active' : 'not active'}`}
                  >
                    {monthShort(m)}
                  </span>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      <h2 className="section-title">Fly patterns that imitate it</h2>
      {patterns.length === 0 ? (
        <EmptyState
          title="No patterns listed"
          description="The content pack has no pattern tied to this insect yet."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {patterns.map((p) => (
            <PatternRow key={p.id} pattern={p} />
          ))}
        </ul>
      )}

      <h2 className="section-title">Notes</h2>
      <Card>
        <p>{taxon.notes}</p>
      </Card>

      <h2 className="section-title">Sources</h2>
      <Card>
        <ul className="list-disc pl-5 text-sm">
          {taxon.sources.map((s) => (
            <li key={s}>
              {s}{' '}
              <span style={{ color: 'var(--trout-color-text-muted)' }}>(verify officially)</span>
            </li>
          ))}
        </ul>
      </Card>
    </main>
  );
}

/** Approved field photo for this insect's group, with its license credit. */
function TaxonPhotoCard({ taxon }: { taxon: BugTaxon }) {
  const photo = taxonPhoto(taxon);
  if (!photo) return null;
  return (
    <figure className="taxon-photo mt-4">
      <img
        src={photo.src}
        alt={`Field photograph of a ${taxon.commonName.toLowerCase()}`}
        loading="lazy"
        className="w-full rounded-xl"
        style={{ border: '1px solid var(--trout-color-border)', maxHeight: '360px', objectFit: 'cover' }}
      />
      <figcaption className="mt-1 text-xs" style={{ color: 'var(--trout-color-text-muted)' }}>
        {photo.credit} · {photo.license} ·{' '}
        <a
          className="focus-ring underline"
          href={photo.sourceUrl}
          target="_blank"
          rel="noreferrer noopener"
        >
          source
        </a>
      </figcaption>
    </figure>
  );
}

function Row({ label, value }: { label: string; value: string }) {  return (
    <div>
      <dt
        className="text-xs font-bold uppercase tracking-wide"
        style={{ color: 'var(--trout-color-text-muted)' }}
      >
        {label}
      </dt>
      <dd className="font-semibold capitalize">{value}</dd>
    </div>
  );
}

function PatternRow({ pattern }: { pattern: FlyPattern }) {
  const [params] = useSearchParams();
  return (
    <li>
      <Link
        to={contextUrl(`/patterns/${pattern.id}`, params)}
        className="list-row focus-ring"
        style={{ borderRadius: 'var(--trout-radius-lg)' }}
      >
        <span className="min-w-0">
          <span className="block font-extrabold">{pattern.name}</span>
          <span className="text-sm capitalize" style={{ color: 'var(--trout-color-text-muted)' }}>
            {pattern.type} · hooks #{pattern.hookSizes.join(', #')}
          </span>
        </span>
        <span className="text-sm font-bold" style={{ color: 'var(--trout-color-primary)' }}>
          Details →
        </span>
      </Link>
    </li>
  );
}
