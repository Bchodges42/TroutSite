/**
 * Riverside-key discriminator art: one drawing per answer at the steps where
 * the question is visual (tails, gills, body shape). Same stroke style and
 * 120×72 viewBox as TaxonArt — text + SVG only (payload budget §2). The
 * drawings teach the discriminator; identification still comes from the key.
 */

type Props = { size?: number };

function Frame({
  size = 96,
  label,
  children,
}: Props & { label: string; children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size * 0.6}
      viewBox="0 0 120 72"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      style={{ color: 'var(--trout-color-primary)' }}
    >
      {children}
    </svg>
  );
}

/** Shared nymph silhouette so the only difference is the discriminator. */
function NymphBody({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* body segments */}
      <path d="M30 40c8-6 18-7 28-4 8 2.4 14 2.4 22-2 3-1.6 6-1.6 10 0" />
      <path d="M42 34c8-4 18-4 26-1" />
      {/* head */}
      <circle cx="88" cy="33" r="6" />
      <path d="M92 28c4-4 8-6 12-6M92 30c4-2 8-2 12 0" />
      {/* legs */}
      <path d="M44 40l-8 12M56 39l-5 13M70 38l-3 13M82 36l1 12" />
      {children}
    </>
  );
}

export function TailsArt({ tails, size = 96 }: Props & { tails: 2 | 3 }) {
  return (
    <Frame
      size={size}
      label={`Line drawing of a mayfly nymph with ${tails} tail filaments`}
    >
      <NymphBody>
        {tails === 3 ? (
          <path d="M30 40 12 32M30 40 10 42M30 40 14 52" strokeWidth={2.6} />
        ) : (
          <path d="M30 40 12 33M30 40 12 49" strokeWidth={2.6} />
        )}
      </NymphBody>
    </Frame>
  );
}

export function GillsArt({ gills, size = 96 }: Props & { gills: 'lamellae' | 'filaments' | 'none' }) {
  const label =
    gills === 'lamellae'
      ? 'Line drawing: flat plate gills along the sides of the abdomen'
      : gills === 'filaments'
        ? 'Line drawing: tufts of filament gills under the body'
        : 'Line drawing: a smooth segmented body with no visible gills';
  return (
    <Frame size={size} label={label}>
      <NymphBody>
        {gills === 'lamellae' && (
          <path d="M46 39c2 5 4 5 6 0M56 38c2 5 4 5 6 0M66 37c2 5 4 5 6 0" strokeWidth={2.4} />
        )}
        {gills === 'filaments' && (
          <path d="M48 40c-3 4-3 8 0 12M58 39c-3 4-3 8 0 12M68 38c-3 4-3 8 0 12M78 37c-3 4-3 7 0 10" strokeWidth={2.4} />
        )}
      </NymphBody>
    </Frame>
  );
}

export function ShapeArt({ shape, size = 96 }: Props & { shape: 'slender' | 'robust' }) {
  return (
    <Frame
      size={size}
      label={`Line drawing of a ${shape === 'slender' ? 'long, thin' : 'stout, hump-backed'} insect body`}
    >
      {shape === 'slender' ? (
        <>
          {/* long thin abdomen */}
          <path d="M22 42c10-4 22-5 34-3 10 1.8 18 1.8 26-1" />
          <path d="M30 45c10-3 22-3 32-1" />
          <circle cx="90" cy="38" r="5" />
          <path d="M94 34c4-3 8-5 12-5" />
          <path d="M46 46l-7 10M60 45l-5 11M74 43l-2 11" />
          <path d="M22 42 8 38M22 42 10 48" />
        </>
      ) : (
        <>
          {/* stout, humped body */}
          <path d="M28 46c4-14 16-24 32-24 14 0 24 8 28 18 2 6 0 10-6 12-10 4-26 5-40 3-10-1.4-15-4-14-9Z" />
          <circle cx="92" cy="34" r="6" />
          <path d="M96 29c4-4 8-5 12-5" />
          <path d="M44 52l-6 9M60 54l-4 9M76 52l-1 9" />
          <path d="M28 46 14 42M28 46 16 52" />
        </>
      )}
    </Frame>
  );
}
