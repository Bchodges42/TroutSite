import { Button, Card } from '@trout/ui';

/** Phase-0 shell only. ROLE 4 replaces this with the token-login shop portal. */
export function App() {
  return (
    <main className="mx-auto max-w-xl p-6" style={{ fontFamily: 'var(--trout-font-body)' }}>
      <Card>
        <h1 style={{ color: 'var(--trout-color-primary)' }}>Trout Shop Portal</h1>
        <p style={{ color: 'var(--trout-color-text-muted)' }}>
          Online-only SPA for attributed shop reports. Skeleton — owned by ROLE 4.
        </p>
        <Button variant="primary" size="sm">
          Sign in with shop token
        </Button>
      </Card>
    </main>
  );
}
