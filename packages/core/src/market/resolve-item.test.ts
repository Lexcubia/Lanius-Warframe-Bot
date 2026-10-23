import { describe, expect, it } from 'vitest';

import { expandQueryCandidates, resolveBestItem, scoreItemMatch } from './resolve-item.js';

const MARKET_INDEX = [
  { urlName: 'nova_prime_blueprint', itemName: 'Nova Prime 蓝图' },
  { urlName: 'nova_prime_set', itemName: 'Nova Prime 一套' },
  { urlName: 'nova_prime_neuroptics', itemName: 'Nova Prime 头部神经光元' },
  { urlName: 'axi_a1_relic', itemName: 'Axi A1 遗物' },
  { urlName: 'primed_continuity', itemName: '持久力 Prime' },
  { urlName: 'latron_prime_set', itemName: '拉特昂 Prime 一套' },
  { urlName: 'latron_prime_barrel', itemName: '拉特昂 Prime 枪管' },
  { urlName: 'latron_wraith_set', itemName: '拉特昂·亡魂 一套' },
  { urlName: 'latron_wraith_barrel', itemName: '拉特昂·亡魂 枪管' },
] as const;

const RIVEN_INDEX = [
  { urlName: 'latron', itemName: '拉特昂' },
  { urlName: 'latron_prime', itemName: '拉特昂Prime' },
  { urlName: 'lanka', itemName: '兰卡' },
] as const;

describe('expandQueryCandidates', () => {
  it('expands 拉特龙 / 拉特昂 aliases', () => {
    expect(expandQueryCandidates('拉特龙')).toEqual(
      expect.arrayContaining(['拉特龙', '拉特昂', 'latron']),
    );
    expect(expandQueryCandidates('拉特昂')).toEqual(
      expect.arrayContaining(['拉特昂', '拉特龙', 'latron']),
    );
  });
});

describe('scoreItemMatch', () => {
  it('scores exact name highest', () => {
    const exact = scoreItemMatch('拉特昂', RIVEN_INDEX[0]!);
    const prime = scoreItemMatch('拉特昂', RIVEN_INDEX[1]!);
    expect(exact).toBeGreaterThan(prime);
  });

  it('prefers set over part when query is set-like', () => {
    const setScore = scoreItemMatch('nova prime', MARKET_INDEX[1]!);
    const bpScore = scoreItemMatch('nova prime', MARKET_INDEX[0]!);
    expect(setScore).toBeGreaterThan(bpScore);
  });
});

describe('resolveBestItem', () => {
  it('locks a single best set for chinese/english fuzzy query', () => {
    const hit = resolveBestItem('nova prime', MARKET_INDEX);
    expect(hit?.urlName).toBe('nova_prime_set');
  });

  it('locks latron riven weapon for 拉特昂 and community alias 拉特龙', () => {
    expect(resolveBestItem('拉特昂', RIVEN_INDEX)?.urlName).toBe('latron');
    expect(resolveBestItem('拉特龙', RIVEN_INDEX)?.urlName).toBe('latron');
    expect(resolveBestItem('latron', RIVEN_INDEX)?.urlName).toBe('latron');
  });

  it('locks latron prime set on market index for 拉特昂 / 拉特龙', () => {
    expect(resolveBestItem('拉特昂', MARKET_INDEX)?.urlName).toBe('latron_prime_set');
    expect(resolveBestItem('拉特龙', MARKET_INDEX)?.urlName).toBe('latron_prime_set');
  });

  it('locks wraith set when query names the variant', () => {
    expect(resolveBestItem('拉特昂 亡魂', MARKET_INDEX)?.urlName).toBe('latron_wraith_set');
  });

  it('returns null when nothing matches', () => {
    expect(resolveBestItem('不存在的物品xyz', MARKET_INDEX)).toBeNull();
  });

  it('matches compact chinese without spaces', () => {
    const hit = resolveBestItem('拉特昂prime一套', MARKET_INDEX);
    expect(hit?.urlName).toBe('latron_prime_set');
  });
});
