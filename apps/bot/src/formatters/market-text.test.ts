import { describe, expect, it } from 'vitest';

import { formatMarketText, formatWhisperCmdInputLine } from './market-text.js';

describe('formatWhisperCmdInputLine', () => {
  it('emits qqbot-cmd-input chips without @', () => {
    const line = formatWhisperCmdInputLine(['/w A buy x 1p'], 'zh');
    expect(line).toContain('<qqbot-cmd-input');
    expect(line).toContain(encodeURIComponent('/w A buy x 1p'));
    expect(line).toContain(encodeURIComponent('私聊1'));
    expect(line).not.toMatch(/@/);
  });
});

describe('formatMarketText', () => {
  it('appends whisper cmd-input tags', () => {
    const text = formatMarketText(
      {
        query: '拉特昂',
        resolved: {
          urlName: 'latron_prime_set',
          name: { zh: '拉特昂 Prime 一套', en: 'Latron Prime Set' },
        },
        page: 1,
        pageSize: 10,
        total: 1,
        orders: [
          {
            platinum: 69,
            quantity: 20,
            modRank: null,
            seller: 'SellerA',
            sellerReputation: 42,
            status: 'ingame',
            updatedAt: new Date().toISOString(),
          },
        ],
        statusFilter: 'online|ingame',
        sort: 'price_asc',
        modRank: null,
        updatedAt: new Date().toISOString(),
      },
      'zh',
    );
    expect(text).toContain('69 白金 · 数量 20');
    expect(text).not.toMatch(/白金\s*[×xX]/);
    expect(text).toContain('声誉 42');
    expect(text).toContain('游戏中');
    expect(text).toContain('<qqbot-cmd-input');
    expect(text).toContain(encodeURIComponent('私聊1'));
  });

  it('lists set components and ducats', () => {
    const text = formatMarketText(
      {
        query: '拉特昂',
        resolved: {
          urlName: 'latron_prime_set',
          name: { zh: '拉特昂 Prime 一套', en: 'Latron Prime Set' },
          ducats: 60,
          isSet: true,
          components: [
            {
              urlName: 'latron_prime_barrel',
              name: { zh: '拉特昂 Prime 枪管', en: 'Latron Prime Barrel' },
              ducats: 15,
              quantityInSet: 1,
            },
          ],
        },
        page: 1,
        pageSize: 10,
        total: 0,
        orders: [],
        statusFilter: 'online|ingame',
        sort: 'price_asc',
        modRank: null,
        updatedAt: new Date().toISOString(),
      },
      'zh',
    );
    expect(text).toContain('杜卡德 60');
    expect(text).toContain('套装部件：');
    expect(text).toContain('拉特昂 Prime 枪管');
    expect(text).toContain('杜卡德 15');
  });
});
