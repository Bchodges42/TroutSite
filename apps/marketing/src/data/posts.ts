/** Launch-notes/blog registry — ROLE 5. v1 ships the index + first post. */
export interface Post {
  slug: string;
  title: string;
  date: string;
  description: string;
}

export const POSTS: Post[] = [
  {
    slug: 'why-offline-first',
    title: 'Why an offline-first fishing app is also the privacy answer',
    date: '2026-09-02',
    description:
      'Airplane mode is the honest test: if the core features work with the radio off, the app cannot be shipping your location anywhere. Notes on how Trout is built.',
  },
];
