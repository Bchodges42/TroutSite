import type { BugTaxon } from '@trout/contracts';

/**
 * SVG line art (text + SVG only — payload budget §2). One stylized drawing per
 * insect group, picked from order/family. Decorative: real identification comes
 * from the attribute key, never from the art.
 */
export function TaxonArt({ taxon, size = 96 }: { taxon: BugTaxon; size?: number }) {
  const Art = artFor(taxon);
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
      aria-label={`Line drawing of a ${taxon.commonName}`}
      style={{ color: 'var(--trout-color-primary)' }}
    >
      {Art}
    </svg>
  );
}

function artFor(taxon: BugTaxon) {
  const order = taxon.order.toLowerCase();
  if (order === 'ephemeroptera') return <MayflyNymph tails={taxon.keyAttributes.tails} />;
  if (order === 'trichoptera') return <CaddisLarva />;
  if (order === 'plecoptera') return <Stonefly />;
  if (order === 'diptera') {
    return taxon.family.toLowerCase() === 'tipulidae' ? <CraneflyLarva /> : <MidgeLarva />;
  }
  if (order === 'amphipoda') return <Scud />;
  if (order === 'isopoda') return <Sowbug />;
  return <GenericBug />;
}

function MayflyNymph({ tails }: { tails: 2 | 3 }) {
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
      {/* plate gills suggestion */}
      <path d="M46 39c2 5 4 5 6 0M56 38c2 5 4 5 6 0M66 37c2 5 4 5 6 0" />
      {tails === 3 ? (
        <path d="M30 40 12 32M30 40 10 42M30 40 14 52" />
      ) : (
        <path d="M30 40 12 33M30 40 12 49" />
      )}
    </>
  );
}

function CaddisLarva() {
  return (
    <>
      <path d="M22 44c6-8 18-12 32-11 12 1 22 6 28 12" />
      <path d="M34 50c8-5 20-7 32-5 6 1 12 3 16 6" />
      <circle cx="90" cy="38" r="6" />
      <path d="M94 33c3-3 7-4 10-4" />
      {/* case-less larva legs + hooks */}
      <path d="M50 52l-4 8M64 51l-2 9M78 50l1 8" />
      <path d="M26 42c-4-2-6-6-6-10" />
      {/* net-spinning hint */}
      <path d="M18 30c6-2 12-2 18 0M16 36c8-3 16-3 24 0" />
    </>
  );
}

function Stonefly() {
  return (
    <>
      <path d="M28 40c8-6 20-8 32-5 8 2 16 2 26-2" />
      <path d="M40 33c10-4 22-4 32 0" />
      <circle cx="92" cy="32" r="6" />
      <path d="M96 27c6-5 12-8 18-9M96 29c6-3 12-4 18-4" />
      {/* filament gills tufts */}
      <path d="M48 38c-2 6-2 10 0 14M60 36c-2 6-2 10 0 14M74 36c-1 6-1 10 0 12" />
      <path d="M44 40l-9 11M58 39l-6 13M74 38l-3 13" />
      <path d="M28 40 10 34M28 40 10 46" />
    </>
  );
}

function MidgeLarva() {
  return (
    <>
      <path d="M20 40c10-8 22-10 34-7 10 2.5 20 2.5 30-1" />
      <path d="M34 38c8-4 18-5 26-3" />
      <circle cx="92" cy="34" r="4.5" />
      {/* prolegs */}
      <path d="M46 41c1 4 3 4 4 0M62 39c1 4 3 4 4 0M78 37c1 4 3 4 4 0" />
      <path d="M20 40c-4-1-7-4-8-8M20 40c-4 1-7 4-8 8" />
    </>
  );
}

function Scud() {
  return (
    <>
      <path d="M24 48C24 30 40 18 58 18c16 0 26 8 32 18 4 7 4 14-2 18-8 6-20 8-32 6-16-2-32-4-32-12Z" />
      <path d="M34 46c8 2 18 3 28 2M40 52c8 2 16 2 24 1" />
      {/* swimming legs */}
      <path d="M44 56l-2 8M54 58l-1 8M64 58v8M74 57l1 8M84 54l3 7" />
      <circle cx="86" cy="30" r="2.5" fill="currentColor" stroke="none" />
      <path d="M88 26c4-6 10-9 16-9M90 30c5-3 10-4 15-3" />
    </>
  );
}

function Sowbug() {
  return (
    <>
      <path d="M22 40c2-10 12-18 26-20 16-2 32 0 42 6 6 4 8 10 6 14-3 6-14 10-28 10-18 0-44 2-46-10Z" />
      {/* segment plates */}
      <path d="M44 22c-2 10-2 22 0 30M56 20c-2 11-2 24 0 32M68 21c-2 10-2 22 0 30M80 24c-1 8-1 16 0 24" />
      <path d="M36 56l-2 6M48 58l-1 6M60 58v6M72 56l1 6" />
      <circle cx="92" cy="36" r="2.5" fill="currentColor" stroke="none" />
      <path d="M94 32c4-3 8-4 12-3M94 38c4 1 8 1 12 0" />
    </>
  );
}

function CraneflyLarva() {
  return (
    <>
      <path d="M18 42c4-8 14-14 26-15 12-1 24 1 34 6 6 3 10 7 10 11 0 5-6 9-16 10-14 2-34 2-46-2-6-2-10-6-8-10Z" />
      <path d="M32 33c-2 9-2 18 0 24M46 30c-2 11-2 22 0 30M60 30c-1 11-1 22 0 30M74 33c-1 9-1 17 0 24" />
      {/* spiracular lobes (the "two tails") */}
      <path d="M20 44c-4 0-7 2-9 6M20 46c-4 2-6 5-6 9" />
      <path d="M88 52c3 3 4 7 4 11" />
    </>
  );
}

function GenericBug() {
  return (
    <>
      <ellipse cx="58" cy="40" rx="34" ry="16" />
      <path d="M40 27c-2 9-2 17 0 26M58 25c-2 10-2 20 0 30M76 27c-2 9-2 17 0 26" />
      <circle cx="97" cy="36" r="5" />
      <path d="M40 54l-5 8M56 56l-2 8M72 55l1 8" />
    </>
  );
}
