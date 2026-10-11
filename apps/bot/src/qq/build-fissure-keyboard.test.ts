import { describe, expect, it } from 'vitest';

import {
  buildFissureShortcutKeyboard,
  fissureShortcutMarkdownHint,
} from './build-fissure-keyboard.js';

describe('buildFissureShortcutKeyboard', () => {
  it('builds zh path + era command rows', () => {
    const kb = buildFissureShortcutKeyboard({
      locale: 'zh',
      enter: false,
      botAppId: '99',
    });
    expect(kb.botAppId).toBe('99');
    expect(kb.rows).toHaveLength(3);
    expect(kb.rows[0]?.buttons.map((b) => b.data)).toEqual([
      '裂隙',
      '裂隙 普通',
      '裂隙 钢铁',
      '裂隙 九重天',
    ]);
    expect(kb.rows[1]?.buttons.map((b) => b.label)).toEqual([
      '古纪',
      '前纪',
      '中纪',
      '后纪',
      '安魂',
    ]);
    expect(kb.rows[2]?.buttons[0]?.data).toBe('裂隙 全能');
    expect(kb.rows[0]?.buttons.every((b) => b.actionType === 2)).toBe(true);
    expect(kb.rows[0]?.buttons.every((b) => b.enter === false)).toBe(true);
  });

  it('builds en commands with enter for c2c', () => {
    const kb = buildFissureShortcutKeyboard({
      locale: 'en',
      enter: true,
      botAppId: '1',
    });
    expect(kb.rows[0]?.buttons.map((b) => b.data)).toEqual([
      'fissures',
      'fissures normal',
      'fissures steel',
      'fissures empyrean',
    ]);
    expect(kb.rows[0]?.buttons[0]?.enter).toBe(true);
  });
});

describe('fissureShortcutMarkdownHint', () => {
  it('returns locale tip', () => {
    expect(fissureShortcutMarkdownHint('zh')).toContain('裂隙');
    expect(fissureShortcutMarkdownHint('en')).toContain('Fissure');
  });
});
