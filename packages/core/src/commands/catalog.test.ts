import { describe, expect, it } from 'vitest';

import { buildHelpDto, findCommandByRoot } from './catalog.js';

describe('command catalog', () => {
  it('resolves independent roots without a global prefix', () => {
    expect(findCommandByRoot('世界状态')?.id).toBe('worldstate');
    expect(findCommandByRoot('WS')?.id).toBe('worldstate');
    expect(findCommandByRoot('裂隙')?.id).toBe('fissures');
    expect(findCommandByRoot('fissures')?.id).toBe('fissures');
    expect(findCommandByRoot('help')?.id).toBe('help');
    expect(findCommandByRoot('wm')?.id).toBe('market');
    expect(findCommandByRoot('zk')?.id).toBe('riven');
    expect(findCommandByRoot('wf')).toBeUndefined();
  });

  it('does not expose mode or skin as user commands', () => {
    expect(findCommandByRoot('模式')).toBeUndefined();
    expect(findCommandByRoot('mode')).toBeUndefined();
    expect(findCommandByRoot('皮肤')).toBeUndefined();
    expect(findCommandByRoot('skin')).toBeUndefined();
    expect(findCommandByRoot('亮色')).toBeUndefined();
    expect(findCommandByRoot('暗色')).toBeUndefined();
    const help = buildHelpDto();
    expect(help.lines.some((line) => line.id === 'mode')).toBe(false);
    expect(help.lines.some((line) => line.id === 'skin')).toBe(false);
  });

  it('builds help dto with overview intro', () => {
    const help = buildHelpDto();
    expect(help.intro.zh.length).toBeGreaterThan(0);
    expect(help.lines.some((line) => line.id === 'help')).toBe(true);
  });
});
