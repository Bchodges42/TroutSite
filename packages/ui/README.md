# @trout/ui

Design tokens (CSS variables) and base React primitives. **Shell owned by ROLE 1**; Roles 2/4/5 may
add files in their own namespaces but must not rename/remove existing exports.

## Tokens

Import once at the app root:

```ts
import '@trout/ui/tokens.css';
```

Provides the tailwater slate/green palette with amber accents as `--trout-*` CSS variables
(colors, radii, shadows, spacing, fonts) plus the `.trout-*` component styles.

## Primitives

`Button`, `Card`, `Chip`, `DataBadge`, `LastUpdatedChip`, `EmptyState` (and the `cx` class joiner).
All are uncontrolled, dependency-free (React only) and styled entirely from the token variables —
they work in the PWA, the admin portal, and any future surface.

```tsx
import { Button, Card, DataBadge, LastUpdatedChip } from '@trout/ui';

<Card>
  <DataBadge label="Flow" value="250 cfs" status="good" />
  <LastUpdatedChip updatedAt="2026-04-01T14:00Z" />
  <Button variant="secondary" size="sm">Details</Button>
</Card>
```
