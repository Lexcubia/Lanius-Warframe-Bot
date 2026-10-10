import { describe, expect, it } from 'vitest';

import { pickLocalized } from './localized.js';

describe('pickLocalized', () => {
  it('selects en or zh by locale', () => {
    const name = { zh: 'Naga（赛德娜）', en: 'Naga (Sedna)' };
    expect(pickLocalized(name, 'en')).toBe('Naga (Sedna)');
    expect(pickLocalized(name, 'zh')).toBe('Naga（赛德娜）');
  });
});
