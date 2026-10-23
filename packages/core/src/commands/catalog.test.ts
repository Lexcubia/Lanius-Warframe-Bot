import { describe, expect, it } from 'vitest';

import { buildHelpDto, findCommandByRoot } from './catalog.js';

describe('command catalog', () => {
  it('resolves independent roots without a global prefix', () => {
    expect(findCommandByRoot('世界状态')?.id).toBe('worldstate');
    expect(findCommandByRoot('WS')?.id).toBe('worldstate');
    expect(findCommandByRoot('裂隙')?.id).toBe('fissures');
    expect(findCommandByRoot('fissures')?.id).toBe('fissures');
    expect(findCommandByRoot('模式')?.id).toBe('mode');
    expect(findCommandByRoot('皮肤')?.id).toBe('skin');
    expect(findCommandByRoot('亮色')?.id).toBe('skin');
    expect(findCommandByRoot('help')?.id).toBe('help');
    expect(findCommandByRoot('wm')?.id).toBe('market');
    expect(findCommandByRoot('zk')?.id).toBe('riven');
    expect(findCommandByRoot('wf')).toBeUndefined();
  });

  it('builds help dto with params for mode command', () => {
    const help = buildHelpDto();
    expect(help.intro.zh.length).toBeGreaterThan(0);
    const mode = help.lines.find((line) => line.id === 'mode');
    expect(mode?.params[0]?.choices).toContain('图片');
    expect(mode?.usage.zh).toContain('文本');
  });

  it('builds help dto with optional skin params', () => {
    const help = buildHelpDto();
    const skin = help.lines.find((line) => line.id === 'skin');
    expect(skin?.params[0]?.required).toBe(false);
    expect(skin?.params[0]?.choices).toContain('亮色');
    expect(skin?.examples).toContain('/皮肤');
  });
});
