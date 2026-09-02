import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';

// jsdom lacks matchMedia; some components read it on mount.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = ((query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList) as never;
}
