import { defineConfig } from 'vite';
import { buildPlugins, fixtureDefine } from './vite.shared';

export default defineConfig({
  plugins: buildPlugins(),
  define: fixtureDefine,
});
