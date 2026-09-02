import { Button, Card, LastUpdatedChip } from '@trout/ui';

/**
 * Phase-0 shell only. ROLE 2 replaces this with the real PWA:
 * hatch key, ID flow, charts, conditions, stocking (see 00-SHARED-CONTEXT §2).
 */
export function App() {
  return (
    <main className="mx-auto max-w-2xl p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--trout-color-primary)' }}>
          Trout
        </h1>
        <p className="text-sm" style={{ color: 'var(--trout-color-text-muted)' }}>
          Match the hatch &amp; stream conditions — offline, no accounts, no tracking.
        </p>
      </header>
      <Card>
        <div className="flex flex-col gap-3">
          <p>
            Phase-0 skeleton. Builds empty but green; the PWA shell is wired with
            vite-plugin-pwa (Workbox), Tailwind, and the <code>@trout/ui</code> primitives.
          </p>
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm">
              Primary
            </Button>
            <Button variant="secondary" size="sm">
              Secondary
            </Button>
            <LastUpdatedChip updatedAt={new Date()} />
          </div>
        </div>
      </Card>
    </main>
  );
}
