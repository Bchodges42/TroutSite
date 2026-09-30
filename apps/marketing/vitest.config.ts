import { getViteConfig } from 'astro/config';

// Marketing unit tests: pure label/date helpers plus Astro Container render
// checks for the score/stocking components (audit F07/F08/F27 verification).
export default getViteConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
