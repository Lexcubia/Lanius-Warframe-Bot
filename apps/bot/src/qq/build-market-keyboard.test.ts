import { describe, expect, it } from 'vitest';

import { buildMarketPageKeyboard, marketPageMarkdownHint } from './build-market-keyboard.js';
import { buildRivenPageKeyboard, rivenPageMarkdownHint } from './build-riven-keyboard.js';

describe('buildMarketPageKeyboard', () => {
  it('replays filters with p= on next page and whisper buttons', () => {
    const kb = buildMarketPageKeyboard({
      locale: 'zh',
      enter: true,
      botAppId: '1',
      args: { query: '红晶', modRank: 5 },
      page: 1,
      totalPages: 3,
      orderCount: 2,
    });
    expect(kb?.rows[0]?.buttons).toHaveLength(2);
    expect(kb?.rows[0]?.buttons[0]?.data).toBe('wm 红晶 等级=5 私聊=1');
    expect(kb?.rows[0]?.buttons[1]?.data).toBe('wm 红晶 等级=5 私聊=2');
    expect(kb?.rows[1]?.buttons[0]?.data).toBe('wm 红晶 等级=5 p=2');
    expect(kb?.rows[1]?.buttons[0]?.enter).toBe(true);
  });

  it('omits keyboard when only one page and no orders', () => {
    expect(
      buildMarketPageKeyboard({
        locale: 'en',
        enter: false,
        botAppId: '1',
        args: { query: 'axiom' },
        page: 1,
        totalPages: 1,
        orderCount: 0,
      }),
    ).toBeNull();
  });

  it('builds whisper-only keyboard on a single page with orders', () => {
    const kb = buildMarketPageKeyboard({
      locale: 'zh',
      enter: false,
      botAppId: '1',
      args: { query: '拉特昂' },
      page: 1,
      totalPages: 1,
      orderCount: 1,
    });
    expect(kb?.rows).toHaveLength(1);
    expect(kb?.rows[0]?.buttons[0]?.data).toBe('wm 拉特昂 私聊=1');
  });

  it('builds prev without p= when going to page 1', () => {
    const kb = buildMarketPageKeyboard({
      locale: 'zh',
      enter: false,
      botAppId: '9',
      args: { query: '红晶', modRank: 5 },
      page: 2,
      totalPages: 3,
      orderCount: 0,
    });
    expect(kb?.rows[0]?.buttons.map((b) => b.data)).toEqual([
      'wm 红晶 等级=5',
      'wm 红晶 等级=5 p=3',
    ]);
  });
});

describe('buildRivenPageKeyboard', () => {
  it('replays riven filters with whisper buttons', () => {
    const kb = buildRivenPageKeyboard({
      locale: 'zh',
      enter: false,
      botAppId: '1',
      args: {
        query: '拉特昂',
        rank: 0,
        mastery: 8,
        minRerolls: 2,
        maxRerolls: 2,
      },
      page: 1,
      totalPages: 2,
      orderCount: 1,
    });
    expect(kb?.rows[0]?.buttons[0]?.data).toBe('zk 拉特昂 等级=0 段位=8 循环=2 私聊=1');
    expect(kb?.rows[1]?.buttons[0]?.data).toBe('zk 拉特昂 等级=0 段位=8 循环=2 p=2');
  });
});

describe('page hints', () => {
  it('localizes hints', () => {
    expect(marketPageMarkdownHint('zh', 2, 5, true)).toContain('私聊');
    expect(rivenPageMarkdownHint('en', 1, 2, true)).toContain('Whisper');
  });
});
