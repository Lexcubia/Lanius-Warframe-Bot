import { EMPTY_WORLDSTATE_MISSION_SLICES, type WorldstateDto } from '@lanius/core';
import { describe, expect, it } from 'vitest';

import { formatCircuitText } from './worldstate-text.js';

/**
 * 构造最小 worldstate 夹具（仅回廊切片有意义）。
 *
 * @param circuit - 回廊切片；`null` 测空态
 * @returns WorldstateDto
 */
function wsWithCircuit(circuit: WorldstateDto['circuit']): WorldstateDto {
  return {
    realm: 'international',
    fetchedAt: '2026-10-23T00:00:00.000Z',
    cycles: [],
    fissures: [],
    invasions: [],
    nightwave: null,
    ...EMPTY_WORLDSTATE_MISSION_SLICES,
    circuit,
  };
}

describe('formatCircuitText', () => {
  it('formats normal warframes and hard Incarnon adapters in zh', () => {
    const text = formatCircuitText(
      wsWithCircuit({
        activation: '2026-10-19T00:00:00.000Z',
        expiry: '2099-01-01T00:00:00.000Z',
        normalChoices: [
          { key: 'Hydroid', name: { zh: '水刑天', en: 'Hydroid' } },
          { key: 'Mirage', name: { zh: '幻影', en: 'Mirage' } },
        ],
        hardChoices: [{ key: 'Dera', name: { zh: '德拉', en: 'Dera' } }],
      }),
      'zh',
    );
    expect(text).toContain('回廊');
    expect(text).toContain('水刑天');
    expect(text).toContain('德拉');
    expect(text).toContain('普通');
    expect(text).toContain('钢路');
  });

  it('shows empty-state when circuit is null', () => {
    const text = formatCircuitText(wsWithCircuit(null), 'zh');
    expect(text).toContain('暂无回廊轮换数据');
  });

  it('formats English title and section headers', () => {
    const text = formatCircuitText(
      wsWithCircuit({
        normalChoices: [{ key: 'Hydroid', name: { zh: '水刑天', en: 'Hydroid' } }],
        hardChoices: [],
      }),
      'en',
    );
    expect(text).toContain('Circuit');
    expect(text).toContain('Warframes');
    expect(text).toContain('Hydroid');
    expect(text).toContain('Incarnon');
  });
});
