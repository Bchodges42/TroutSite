// OWNER: ROLE 4. Node-side MSW server for Vitest.
import { setupServer } from 'msw/node';
import { handlers } from '../src/msw/handlers.js';

export const server = setupServer(...handlers);
