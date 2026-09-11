/**
 * Data provenance (B11): the bundle must know, structurally, whether it is
 * looking at live-served snapshots or synthetic demo data. The flag is set by
 * the build configs themselves — vite.fixtures.config stamps FIXTURE_BUILD
 * unconditionally (that config IS the demo build), and DEV_FIXTURES covers
 * `DEV_FIXTURES=1 vite dev`. A fixture build can therefore never masquerade
 * as production data by forgetting an env var.
 *
 * UI surfaces (demonstration banner, colophon lines) read this module; do not
 * guess provenance from URLs.
 */
export const isDemoData: boolean =
  import.meta.env.FIXTURE_BUILD === true || import.meta.env.DEV_FIXTURES === true;

export function provenanceLabel(): string | null {
  return isDemoData ? 'Demonstration data — synthetic snapshots, not live conditions' : null;
}
