/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  /** True in `vite dev` when started with DEV_FIXTURES=1 (fixture wiring). */
  readonly DEV_FIXTURES: boolean;
  /** True when the bundle was produced by vite.fixtures.config (synthetic demo data). */
  readonly FIXTURE_BUILD: boolean;
}
