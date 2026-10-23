import { describe, expect, it } from 'vitest';

import {
  formatMarketPriceQuantity,
  formatMarketWhisper,
  formatSellerStatusLabel,
  resolveWfmAssetUrl,
} from './display.js';

describe('resolveWfmAssetUrl', () => {
  it('prefixes relative thumbs', () => {
    expect(resolveWfmAssetUrl('items/images/en/thumbs/x.png')).toBe(
      'https://warframe.market/static/assets/items/images/en/thumbs/x.png',
    );
  });

  it('keeps absolute urls', () => {
    expect(resolveWfmAssetUrl('https://cdn.example/a.png')).toBe('https://cdn.example/a.png');
  });
});

describe('formatSellerStatusLabel', () => {
  it('localizes zh and keeps en', () => {
    expect(formatSellerStatusLabel('ingame', 'zh')).toBe('游戏中');
    expect(formatSellerStatusLabel('online', 'zh')).toBe('在线');
    expect(formatSellerStatusLabel('ingame', 'en')).toBe('ingame');
    expect(formatSellerStatusLabel('online', 'en')).toBe('online');
  });
});

describe('formatMarketPriceQuantity', () => {
  it('separates price and quantity', () => {
    expect(formatMarketPriceQuantity(69, 20, 'zh')).toBe('69 白金 · ×20');
    expect(formatMarketPriceQuantity(69, 20, 'en')).toBe('69p · ×20');
  });
});

describe('formatMarketWhisper', () => {
  it('builds WFM-style whisper lines within QQ cmd-input limit', () => {
    const en = formatMarketWhisper({
      seller: 'SellerA',
      itemName: 'Latron Prime Set',
      platinum: 69,
      locale: 'en',
    });
    const zh = formatMarketWhisper({
      seller: 'SellerA',
      itemName: '拉特昂 Prime 一套',
      platinum: 69,
      locale: 'zh',
    });
    expect(en.startsWith('/w SellerA')).toBe(true);
    expect(en).toContain('69');
    expect(zh.startsWith('/w SellerA')).toBe(true);
    expect(zh).toContain('69');
    expect(Array.from(en).length).toBeLessThanOrEqual(100);
    expect(Array.from(zh).length).toBeLessThanOrEqual(100);
  });
});
