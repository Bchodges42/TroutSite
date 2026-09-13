import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button, Card, Chip, EmptyState } from '@trout/ui';
import { BugObservationSchema, matchHatch, MATCH_HATCH_MAX_SCORE } from '@trout/contracts';
import type { BugObservation, RankedTaxon } from '@trout/contracts';
import { HatchChartSchema } from '@trout/contracts';
import type { BugTaxon } from '@trout/contracts';
import { useContentPack } from '../lib/content';
import { snapshotUrls } from '../lib/endpoints';
import { useSnapshotQuery } from '../lib/useSnapshotQuery';
import { monthName, REGIONS } from '../data/regions';
import { TaxonArt } from '../components/art/TaxonArt';
import { TailsArt, GillsArt, ShapeArt } from '../components/art/DiscriminatorArt';
import { RiverContextBar, useRiverContext, contextUrl } from '../lib/riverContext';

/**
 * Match-the-hatch (hero feature, scope 2): guided attribute key → ranked taxa
 * via the frozen, deterministic matchHatch() — all client-side, all offline.
 */

type Step = 'size' | 'color' | 'tails' | 'gills' | 'shape' | 'context';

const STEP_ORDER: Step[] = ['size', 'color', 'tails', 'gills', 'shape', 'context'];
const STEP_TITLE: Record<Step, string> = {
  size: 'How big was it? (hook size)',
  color: 'What was the body color?',
  tails: 'How many tail filaments?',
  gills: 'What did the gills look like?',
  shape: 'What was the body shape?',
  context: 'Where and when?',
};

const HOOK_SIZES = [8, 10, 12, 14, 16, 18, 20, 22, 24];

/** T2-39: plain-language size hints for beginners. */
const SIZE_HINT: Record<number, string> = {
  8: 'big — stoneflies, hoppers',
  10: 'big — stoneflies, hoppers',
  12: 'medium-large — stoneflies, hoppers',
  14: 'medium — mayflies, caddis',
  16: 'small — mayflies',
  18: 'small — mayflies',
  20: 'tiny — midges, small mayflies',
  22: 'tiny — midges',
  24: 'tiny — midges',
};
const ASSUMED_SIZE = 16;

const COLOR_SWATCH: Record<string, string> = {
  olive: '#6b8e23',
  'olive-brown': '#6b6423',
  gray: '#8a8f98',
  cream: '#f5f0dc',
  'pale-yellow': '#f7e9a0',
  'sulphur-orange': '#f2b263',
  tan: '#d2b48c',
  brown: '#8b5e34',
  'dark-brown': '#4e3b28',
  black: '#1f2429',
  green: '#4caf50',
  'bright-green': '#3fbf4a',
  red: '#c04a3a',
  'golden-brown': '#c9973f',
  yellow: '#f2d24b',
  mottled: '#a58d6f',
  translucent: '#dcdcd4',
  pink: '#e8a7a7',
  mahogany: '#7a3b2e',
};

const GILLS_LABEL: Record<BugObservation['gills'], string> = {
  lamellae: 'Flat plates (lamellae) along the sides',
  filaments: 'Tufts of filaments under the body',
  none: 'No visible gills',
};

const ATTRIBUTE_LABEL: Record<string, string> = {
  size: 'size',
  tails: 'tails',
  gills: 'gills',
  bodyShape: 'shape',
  bodyColor: 'color',
  hatchChart: 'hatching now',
  seasonRecord: 'in season',
};

const CONFIDENCE_TONE: Record<RankedTaxon['confidence'], 'good' | 'fair' | 'poor'> = {
  high: 'good',
  medium: 'fair',
  low: 'poor',
};

interface Draft {
  sizeHook?: number;
  /** T2-39: the size was assumed ("not sure"), not measured off the insect. */
  sizeAssumed?: boolean;
  bodyColor?: string;
  tails?: 2 | 3;
  gills?: BugObservation['gills'];
  bodyShape?: BugObservation['bodyShape'];
  month?: number;
  regionId?: string;
}

export function HatchKeyPage() {
  const context = useRiverContext();
  const [step, setStep] = useState<Step>('size');
  const [draft, setDraft] = useState<Draft>({
    month: context.month,
    regionId: REGIONS.some((r) => r.id === context.region)
      ? (context.region ?? undefined)
      : REGIONS[0]?.id,
  });
  useEffect(() => {
    if (context.stream) setDraft((d) => ({ ...d, regionId: context.stream!.regionId }));
  }, [context.stream?.id]);
  const [finished, setFinished] = useState(false);
  useEffect(() => {
    if (step === 'size' && !finished) return;
    document
      .getElementById(finished ? 'hatch-results-heading' : 'hatch-step-heading')
      ?.focus({ preventScroll: true });
  }, [step, finished]);

  const pack = useContentPack();
  const chartQuery = useSnapshotQuery(
    draft.regionId && draft.month ? snapshotUrls.hatch(draft.regionId, draft.month) : '',
    HatchChartSchema,
    60 * 24 * 30,
    Boolean(draft.regionId && draft.month),
  );

  const observation: BugObservation | null = useMemo(() => {
    const candidate = {
      sizeHook: draft.sizeHook,
      bodyColor: draft.bodyColor,
      tails: draft.tails,
      gills: draft.gills,
      bodyShape: draft.bodyShape,
      month: draft.month,
      regionId: draft.regionId,
    };
    const parsed = BugObservationSchema.safeParse(candidate);
    return parsed.success ? parsed.data : null;
  }, [draft]);

  // T2-43: a missing region-month chart must be VISIBLE — ranking silently
  // drops the +2 "hatching now" signal, so say the results are key+season only.
  const chartMissing =
    Boolean(draft.regionId && draft.month) && !chartQuery.isLoading && !chartQuery.data;
  const ranked: RankedTaxon[] = useMemo(() => {
    if (!observation || !pack.data) return [];
    const charts = chartQuery.data ? [chartQuery.data.data] : [];
    return matchHatch(observation, charts, pack.data.taxa);
  }, [observation, pack.data, chartQuery.data]);

  const stepIndex = STEP_ORDER.indexOf(step);
  const complete = observation !== null;

  const pick = <K extends keyof Draft>(key: K, value: NonNullable<Draft[K]>) => {
    setDraft((d) => ({ ...d, [key]: value, sizeAssumed: key === 'sizeHook' ? false : d.sizeAssumed }));
    const i = STEP_ORDER.indexOf(step);
    if (i < STEP_ORDER.length - 1) setStep(STEP_ORDER[i + 1]!);
    else setFinished(true);
  };

  const back = () => {
    const i = STEP_ORDER.indexOf(step);
    if (i > 0) setStep(STEP_ORDER[i - 1]!);
  };

  const startOver = () => {
    setDraft({ month: context.month, regionId: context.stream?.regionId ?? REGIONS[0]?.id });
    setFinished(false);
    setStep('size');
  };

  if (!pack.isLoading && pack.isError) {
    return (
      <main className="page">
        <h1 className="page-title">Hatch Key</h1>
        <div className="mt-6">
          <EmptyState
            icon="🪰"
            title="Bug reference not on this device yet"
            description="Open the app once while online so the content pack precaches — after that the whole hatch key works in airplane mode."
          />
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <RiverContextBar />
      <p className="eyebrow mb-3">The riverside insect key</p>
      <h1 className="page-title">Match the hatch.</h1>
      <p className="page-subtitle">
        Answer a few questions about the bug you found — the matches are ranked on your device,
        fully offline.
      </p>
      {chartMissing && (
        <p
          className="mt-3 rounded-lg px-3 py-2 text-sm"
          style={{ background: 'var(--trout-slate-100)', border: '1px solid var(--ui-border)' }}
          role="note"
          aria-label="Chart not cached notice"
        >
          The hatch chart for this region and month isn&apos;t on this device — matching by key
          features and season only.
        </p>
      )}

      {!finished && (
        <>
          <div className="mt-4 flex items-center gap-2" aria-hidden="true">
            {STEP_ORDER.map((s, i) => (
              <div
                key={s}
                className="h-2 flex-1 rounded-full"
                style={{
                  background:
                    i <= stepIndex ? 'var(--trout-color-primary)' : 'var(--trout-slate-200)',
                }}
              />
            ))}
          </div>
          <p className="mb-1 text-sm font-bold" role="status">
            Step {stepIndex + 1} of {STEP_ORDER.length} — {STEP_TITLE[step]}
          </p>

          <Card className="mt-4">
            <h2 id="hatch-step-heading" tabIndex={-1} className="text-lg font-bold">
              {STEP_TITLE[step]}
            </h2>
            <div className="mt-4">
              {step === 'size' && (
                <>
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                    {HOOK_SIZES.map((size) => (
                      <button
                        key={size}
                        type="button"
                        className="option-card focus-ring flex-col items-center gap-1"
                        aria-pressed={draft.sizeHook === size && !draft.sizeAssumed}
                        onClick={() => pick('sizeHook', size)}
                      >
                        <span className="text-lg font-bold">#{size}</span>
                        <span className="text-center text-[11px] leading-tight" style={{ color: 'var(--trout-color-text-muted)' }}>
                          {SIZE_HINT[size]}
                        </span>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="text-action mt-3"
                    onClick={() => {
                      setDraft((d) => ({ ...d, sizeHook: ASSUMED_SIZE, sizeAssumed: true }));
                      const i = STEP_ORDER.indexOf('size');
                      setStep(STEP_ORDER[i + 1]!);
                    }}
                  >
                    Not sure — start me with a #16 (the most common size)
                  </button>
                </>
              )}

              {step === 'color' && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {Object.keys(COLOR_SWATCH).map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`option-card focus-ring justify-start text-left text-sm ${draft.bodyColor === color ? 'is-selected' : ''}`}
                      aria-pressed={draft.bodyColor === color}
                      onClick={() => pick('bodyColor', color)}
                    >
                      <span
                        className="h-6 w-6 shrink-0 rounded-full border"
                        style={{
                          background: COLOR_SWATCH[color],
                          borderColor: 'var(--trout-color-border)',
                        }}
                        aria-hidden="true"
                      />
                      {color.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              )}

              {step === 'tails' && (
                <div className="grid grid-cols-2 gap-3">
                  {([2, 3] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`option-card focus-ring flex-col gap-2 ${draft.tails === t ? 'is-selected' : ''}`}
                      aria-pressed={draft.tails === t}
                      onClick={() => pick('tails', t)}
                    >
                      <span aria-hidden="true"><TailsArt tails={t} size={110} /></span>
                      <span className="font-bold">{t} tails</span>
                      <span className="text-xs" style={{ color: 'var(--trout-color-text-muted)' }}>
                        {t === 2 ? 'Count the filaments — a pair' : 'Three separate filaments fanned out'}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {step === 'gills' && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {(Object.keys(GILLS_LABEL) as BugObservation['gills'][]).map((g) => (
                    <button
                      key={g}
                      type="button"
                      className={`option-card focus-ring flex-col gap-2 text-center ${draft.gills === g ? 'is-selected' : ''}`}
                      aria-pressed={draft.gills === g}
                      onClick={() => pick('gills', g)}
                    >
                      <span aria-hidden="true"><GillsArt gills={g} size={110} /></span>
                      {GILLS_LABEL[g]}
                    </button>
                  ))}
                </div>
              )}

              {step === 'shape' && (
                <div className="grid grid-cols-2 gap-3">
                  {(['slender', 'robust'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`option-card focus-ring flex-col gap-2 ${draft.bodyShape === s ? 'is-selected' : ''}`}
                      aria-pressed={draft.bodyShape === s}
                      onClick={() => pick('bodyShape', s)}
                    >
                      <span aria-hidden="true"><ShapeArt shape={s} size={110} /></span>
                      <span className="font-bold capitalize">{s}</span>
                      <span className="text-xs" style={{ color: 'var(--trout-color-text-muted)' }}>
                        {s === 'slender' ? 'Long and thin, like a twig' : 'Stout and hump-backed'}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {step === 'context' && (
                <div className="flex flex-col gap-4">
                  <label className="block">
                    <span className="mb-1 block text-sm font-bold">Region</span>
                    <select
                      className="focus-ring min-h-[48px] w-full rounded-lg border px-3"
                      style={{ borderColor: 'var(--trout-color-border)' }}
                      value={draft.regionId ?? ''}
                      onChange={(e) => setDraft((d) => ({ ...d, regionId: e.target.value }))}
                    >
                      {REGIONS.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-bold">Month</span>
                    <select
                      className="focus-ring min-h-[48px] w-full rounded-lg border px-3"
                      style={{ borderColor: 'var(--trout-color-border)' }}
                      value={draft.month ?? ''}
                      onChange={(e) => setDraft((d) => ({ ...d, month: Number(e.target.value) }))}
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <option key={m} value={m}>
                          {monthName(m)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Button
                    size="lg"
                    disabled={!complete}
                    onClick={() => setFinished(true)}
                    className="focus-ring"
                  >
                    See matches
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-5 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={back}
                disabled={step === 'size'}
                className="focus-ring"
              >
                ← Back
              </Button>
              <Button variant="ghost" size="sm" onClick={startOver}>
                Start over
              </Button>
            </div>
          </Card>
        </>
      )}

      {finished && observation && (
        <section className="mt-4" aria-label="Matched insects">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {draft.sizeAssumed && (
              <p
                className="mt-2 rounded-lg px-3 py-2 text-sm"
                style={{ background: 'var(--trout-slate-100)', border: '1px solid var(--ui-border)' }}
                role="note"
              >
                The size was assumed (#{draft.sizeHook}) because you were not sure. If the matches
                look wrong, go back and re-check the size.
              </p>
            )}
            <h2 id="hatch-results-heading" tabIndex={-1} className="text-lg font-bold">
              Top matches · {monthName(observation.month)} ·{' '}
              {REGIONS.find((r) => r.id === observation.regionId)?.name}
            </h2>
            <Button variant="ghost" size="sm" onClick={startOver}>
              Start over
            </Button>
          </div>
          <p className="page-subtitle mt-1">
            Transparent scoring: attribute matches (0–5) + hatching now (+2) + in-season record
            (+1).
          </p>

          {chartQuery.data && (
            <p className="mt-1 text-xs" style={{ color: 'var(--trout-color-text-muted)' }}>
              Using the hatch chart for this region &amp; month, cached on your device.
            </p>
          )}

          {ranked.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                icon="🤷"
                title="No confident matches"
                description="Every attribute missed. Re-check tails, gills, and size — those separate the big groups."
                action={
                  <Button variant="secondary" onClick={startOver}>
                    Try again
                  </Button>
                }
              />
            </div>
          ) : (
            <ol className="mt-4 flex flex-col gap-3">
              {ranked.map((r, i) => (
                <li
                  key={r.taxon.id}
                  className="stagger-in"
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  <MatchRow ranked={r} month={observation.month} region={observation.regionId} />
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {finished && !observation && (
        <div className="mt-6">
          <EmptyState
            title="Something went wrong"
            description="Your answers did not form a complete observation."
            action={<Button onClick={startOver}>Start over</Button>}
          />
        </div>
      )}
    </main>
  );
}

function MatchRow({
  ranked,
  month,
  region,
}: {
  ranked: RankedTaxon;
  month: number;
  region: string;
}) {
  const [params] = useSearchParams();
  const t: BugTaxon = ranked.taxon;
  return (
    <Link
      to={contextUrl(`/taxa/${t.id}`, params, { month: String(month), region })}
      className="list-row focus-ring !items-start hover:!border-[var(--trout-color-primary)]"
      style={{ borderRadius: 'var(--trout-radius-lg)' }}
    >
      <span className="mt-1 shrink-0" style={{ color: 'var(--trout-color-primary)' }}>
        <TaxonArt taxon={t} size={72} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-extrabold">{t.commonName}</h3>
          <Chip tone={CONFIDENCE_TONE[ranked.confidence]}>{ranked.confidence} confidence</Chip>
          {ranked.inHatchChart && <Chip tone="accent">hatching now</Chip>}
        </span>
        <span className="block text-sm italic" style={{ color: 'var(--trout-color-text-muted)' }}>
          {t.sciName} · {t.order}
        </span>
        <span className="mt-2 block">
          <span className="score-track">
            <span
              className="score-fill"
              style={{
                transform: `scaleX(${ranked.score / MATCH_HATCH_MAX_SCORE})`,
                background: 'var(--trout-color-primary)',
              }}
            />
          </span>
        </span>
        <span className="mt-2 flex flex-wrap gap-1.5">
          {ranked.matchedAttributes.map((a) => (
            <Chip key={a}>{ATTRIBUTE_LABEL[a] ?? a}</Chip>
          ))}
          <span
            className="ml-auto text-sm font-extrabold"
            style={{ color: 'var(--trout-color-primary)' }}
          >
            {ranked.score}/{ranked.maxScore}
          </span>
        </span>
      </span>
    </Link>
  );
}
