// OWNER: ROLE 4. Browser-side MSW worker for `pnpm --filter @trout/admin dev` so the portal is
// fully clickable before Role 3's real API lands. Enabled when VITE_ENABLE_MSW !== 'false'
// (default on in dev). The production build never imports this module.
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers.js';

export const worker = setupWorker(...handlers);
