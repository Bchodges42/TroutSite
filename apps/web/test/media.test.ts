import { describe, expect, it } from 'vitest';
import { firstPartyPhotoUrl } from '../src/lib/media';

describe('firstPartyPhotoUrl', () => {
  it('allows same-origin absolute and relative photo paths', () => {
    expect(firstPartyPhotoUrl('https://trout.example/photos/report.jpg', 'https://trout.example'))
      .toBe('https://trout.example/photos/report.jpg');
    expect(firstPartyPhotoUrl('/photos/report.jpg', 'https://trout.example'))
      .toBe('https://trout.example/photos/report.jpg');
  });

  it('rejects cross-origin photo URLs so rendering cannot trigger third-party requests', () => {
    expect(firstPartyPhotoUrl('https://images.example.com/report.jpg', 'https://trout.example')).toBeNull();
  });
});
