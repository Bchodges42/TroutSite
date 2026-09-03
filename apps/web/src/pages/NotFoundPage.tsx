import { Link } from 'react-router-dom';
import { EmptyState } from '@trout/ui';

export function NotFoundPage() {
  return (
    <main className="page">
      <div className="mt-8">
        <EmptyState
          icon="🐟"
          title="That pool is empty"
          description="The page you're after doesn't exist."
          action={
            <Link to="/" className="focus-ring font-bold underline">
              Back home
            </Link>
          }
        />
      </div>
    </main>
  );
}
