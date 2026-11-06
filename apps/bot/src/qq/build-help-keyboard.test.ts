import { describe, expect, it } from 'vitest';

import { buildHelpShortcutKeyboard } from './build-help-keyboard.js';

describe('buildHelpShortcutKeyboard', () => {
  it('includes Wave1–3 shortcuts beyond legacy worldstate/traders rows', () => {
    const kb = buildHelpShortcutKeyboard({
      locale: 'zh',
      enter: true,
      botAppId: 'test-app',
    });
    expect(kb.rows.length).toBeGreaterThanOrEqual(6);
    const labels = kb.rows.flatMap((row) => row.buttons.map((btn) => btn.label));
    expect(labels).toEqual(
      expect.arrayContaining([
        '世界状态',
        '裂隙',
        '突击',
        '执行官',
        '回廊',
        '仲裁',
        '时效',
        '达沃',
        '赏金',
        '灵化',
        '虚空商人',
        '金垃圾',
        '遗物',
        'wiki',
        '翻译',
        '融合',
        '订阅',
      ]),
    );
  });

  it('builds English labels for en locale', () => {
    const kb = buildHelpShortcutKeyboard({
      locale: 'en',
      enter: false,
      botAppId: 'test-app',
    });
    const labels = kb.rows.flatMap((row) => row.buttons.map((btn) => btn.label));
    expect(labels).toEqual(
      expect.arrayContaining(['Sortie', 'Timers', 'Ducats', 'Wiki', 'Valence', 'Subscribe']),
    );
  });
});
