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

  it('registers Wave 0 mission module roots', () => {
    expect(findCommandByRoot('突击')?.id).toBe('sortie');
    expect(findCommandByRoot('执行官')?.id).toBe('archon');
    expect(findCommandByRoot('circuit')?.id).toBe('circuit');
    expect(findCommandByRoot('赏金')?.id).toBe('bounties');
    expect(findCommandByRoot('仲裁')?.id).toBe('arbitration');
    expect(findCommandByRoot('警报')?.id).toBe('alerts');
    expect(findCommandByRoot('科研')?.id).toBe('archimedea');
    expect(findCommandByRoot('精英科研')?.id).toBe('archimedea');
    expect(findCommandByRoot('时光科研')?.id).toBe('archimedea');
  });

  it('registers Wave 3 wiki / translate / valence roots', () => {
    expect(findCommandByRoot('wiki')?.id).toBe('wiki');
    expect(findCommandByRoot('维基')?.id).toBe('wiki');
    expect(findCommandByRoot('翻译')?.id).toBe('translate');
    expect(findCommandByRoot('translate')?.id).toBe('translate');
    expect(findCommandByRoot('武器融合')?.id).toBe('valence');
    expect(findCommandByRoot('融合')?.id).toBe('valence');
    expect(findCommandByRoot('valence')?.id).toBe('valence');
  });

  it('registers Wave1 daily and Wave2 market/relic roots', () => {
    expect(findCommandByRoot('时效')?.id).toBe('timers');
    expect(findCommandByRoot('达沃')?.id).toBe('dailyDeals');
    expect(findCommandByRoot('新闻')?.id).toBe('news');
    expect(findCommandByRoot('灵化')?.id).toBe('incarnon');
    expect(findCommandByRoot('金垃圾')?.id).toBe('ducats');
    expect(findCommandByRoot('遗物')?.id).toBe('relic');
    expect(findCommandByRoot('趋势')?.id).toBe('marketTrend');
    expect(findCommandByRoot('紫卡分析')?.id).toBe('rivenAnalysis');
  });

  it('builds overview intro with command coverage count', () => {
    const help = buildHelpDto();
    expect(help.intro.zh).toMatch(/共 \d+ 条指令/);
    expect(help.lines.length).toBeGreaterThanOrEqual(40);
  });
});
