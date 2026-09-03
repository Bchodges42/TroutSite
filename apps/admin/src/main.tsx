import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@trout/ui/tokens.css';
import './index.css';
import { App } from './App';

// Dev-only API mock: MSW stands in for Role 3's real portal API so the portal is fully
// clickable before the backend lands. Disable with VITE_ENABLE_MSW=false.
async function bootstrap() {
  if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_MSW !== 'false') {
    const { worker } = await import('./msw/browser.js');
    await worker.start({ onUnhandledRequest: 'bypass', quiet: true });
  }
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void bootstrap();
