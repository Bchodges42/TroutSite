// OWNER: ROLE 4. Vitest setup: MSW node server intercepts every request in component tests.
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './mswNode.js';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
