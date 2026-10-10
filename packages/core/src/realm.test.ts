import { describe, expect, it } from 'vitest';

import { isRealmAvailable } from './realm.js';

describe('isRealmAvailable', () => {
  it('marks international as available in MVP', () => {
    expect(isRealmAvailable('international')).toBe(true);
  });

  it('marks china as unavailable in MVP', () => {
    expect(isRealmAvailable('china')).toBe(false);
  });
});
