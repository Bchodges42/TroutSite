import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it } from 'vitest';
import { PublicationPreviewView } from '../src/features/owner/PublicationPreview.js';
import type { PublicationPreview } from '../src/features/owner/ownerClient.js';
afterEach(cleanup);
const publication: NonNullable<PublicationPreview['publication']> = {
  id: 'a'.repeat(24), preparedAt: '2026-10-01T15:00:00Z', publishedAt: null,
  baseHash: 'b'.repeat(64), candidateHash: 'c'.repeat(64), fileChanges: 3, affectedWaters: 2, omittedWaters: 1,
  waters: [{ id: 'little-river', name: 'Little River', beforeWording: ['Trout status unresolved'], afterWording: ['Year-round trout opportunity'],
    changes: [{ field: 'opportunity', before: 'Old cited assessment', after: 'New cited assessment', truncated: true }] }],
};
it('renders actual old/new wording, omitted/truncated notices and no publication action', async () => {
  render(<PublicationPreviewView preview={{ state: 'ready', publication }} />);
  await userEvent.click(screen.getByText('Little River · 1 changed claim areas'));
  expect(screen.getByText('Trout status unresolved')).toBeTruthy();
  expect(screen.getByText('Year-round trout opportunity')).toBeTruthy();
  expect(screen.getByText(/1 additional affected waters are omitted/)).toBeTruthy();
  expect(screen.getByText(/opportunity \(abbreviated/)).toBeTruthy();
  expect(screen.queryByRole('button', { name: /publish|approve/i })).toBeNull();
});
it('makes expired and unprepared candidates explicit', () => {
  const { rerender } = render(<PublicationPreviewView preview={{ state: 'expired', publication }} />);
  expect(screen.getByRole('status').textContent).toContain('more than an hour old');
  rerender(<PublicationPreviewView preview={{ state: 'not-prepared', publication: null }} />);
  expect(screen.getByText(/No candidate has been prepared/)).toBeTruthy();
});
