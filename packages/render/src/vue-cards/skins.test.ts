import { describe, expect, it } from 'vitest';

import { DEFAULT_CARD_SKIN, listCardSkinIds, resolveCardSkin } from './skins.js';

describe('resolveCardSkin', () => {
  it('falls back to light for empty or unknown ids', () => {
    expect(resolveCardSkin(undefined)).toBe(DEFAULT_CARD_SKIN);
    expect(resolveCardSkin(null)).toBe('light');
    expect(resolveCardSkin('')).toBe('light');
    expect(resolveCardSkin('neon')).toBe('light');
  });

  it('accepts light/dark and zh aliases', () => {
    expect(resolveCardSkin('light')).toBe('light');
    expect(resolveCardSkin('DARK')).toBe('dark');
    expect(resolveCardSkin('暗色')).toBe('dark');
    expect(resolveCardSkin('亮色')).toBe('light');
  });

  it('lists registered skin ids', () => {
    expect(listCardSkinIds()).toEqual(['light', 'dark']);
  });
});
