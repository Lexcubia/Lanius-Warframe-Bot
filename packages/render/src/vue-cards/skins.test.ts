import { describe, expect, it } from 'vitest';

import { DEFAULT_CARD_SKIN, listCardSkinIds, resolveCardSkin } from './skins.js';

describe('resolveCardSkin', () => {
  it('falls back to orokin for empty or unknown ids', () => {
    expect(resolveCardSkin(undefined)).toBe(DEFAULT_CARD_SKIN);
    expect(resolveCardSkin(null)).toBe('orokin');
    expect(resolveCardSkin('')).toBe('orokin');
    expect(resolveCardSkin('neon')).toBe('orokin');
  });

  it('accepts orokin/dark/light and zh aliases', () => {
    expect(resolveCardSkin('orokin')).toBe('orokin');
    expect(resolveCardSkin('奥罗金')).toBe('orokin');
    expect(resolveCardSkin('light')).toBe('light');
    expect(resolveCardSkin('DARK')).toBe('dark');
    expect(resolveCardSkin('暗色')).toBe('dark');
    expect(resolveCardSkin('亮色')).toBe('light');
  });

  it('lists registered skin ids', () => {
    expect(listCardSkinIds()).toEqual(['orokin', 'dark', 'light']);
  });
});
