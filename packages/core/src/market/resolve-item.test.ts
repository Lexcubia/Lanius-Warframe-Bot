import { describe, expect, it } from 'vitest';

import { resolveBestItem, scoreItemMatch } from './resolve-item.js';

const INDEX = [
  { urlName: 'nova_prime_blueprint', itemName: 'Nova Prime 蓝图' },
  { urlName: 'nova_prime_set', itemName: 'Nova Prime 一套' },
  { urlName: 'nova_prime_neuroptics', itemName: 'Nova Prime 头部神经光元' },
  { urlName: 'axi_a1_relic', itemName: 'Axi A1 遗物' },
  { urlName: 'primed_continuity', itemName: 'Primed Continuity' },
  { urlName: 'latron_prime_set', itemName: '拉特龙Prime一套' },
  { urlName: 'latron', itemName: '拉特龙' },
] as const;

describe('scoreItemMatch', () => {
  it('scores exact name highest', () => {
    const exact = scoreItemMatch('拉特龙', INDEX[6]!);
    const set = scoreItemMatch('拉特龙', INDEX[5]!);
    expect(exact).toBeGreaterThan(set);
  });

  it('prefers set over part when query is set-like', () => {
    const setScore = scoreItemMatch('nova prime', INDEX[1]!);
    const bpScore = scoreItemMatch('nova prime', INDEX[0]!);
    expect(setScore).toBeGreaterThan(bpScore);
  });
});

describe('resolveBestItem', () => {
  it('locks a single best set for chinese/english fuzzy query', () => {
    const hit = resolveBestItem('nova prime', INDEX);
    expect(hit?.urlName).toBe('nova_prime_set');
  });

  it('locks latron weapon over set when query is exact weapon name', () => {
    const hit = resolveBestItem('拉特龙', INDEX);
    expect(hit?.urlName).toBe('latron');
  });

  it('returns null when nothing matches', () => {
    expect(resolveBestItem('不存在的物品xyz', INDEX)).toBeNull();
  });

  it('matches compact chinese without spaces', () => {
    const hit = resolveBestItem('拉特龙prime一套', INDEX);
    expect(hit?.urlName).toBe('latron_prime_set');
  });
});
