// OWNER: ROLE 4. Vitest setup: MSW node server intercepts every request in component tests.
import { transferableAbortController } from 'node:util';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { server } from './mswNode.js';

beforeAll(() => {
  // jsdom supplies DOM signals, but MSW's Node Request/fetch requires the Node
  // signal brand. Match that realm so tests exercise real cancellation options.
  const nodeController = transferableAbortController();
  vi.stubGlobal('AbortController', nodeController.constructor);
  vi.stubGlobal('AbortSignal', nodeController.signal.constructor);
  server.listen({ onUnhandledRequest: 'error' });
});
afterEach(() => server.resetHandlers());
afterAll(() => {
  server.close();
  vi.unstubAllGlobals();
});
