import { EMPTY_WORLDSTATE_MISSION_SLICES, type WorldstateDto } from '@lanius/core';
import { describe, expect, it } from 'vitest';

import { formatAlertsText } from './worldstate-text.js';

/**
 * 构造仅含警报切片的最小 worldstate。
 *
 * @param alerts - 警报列表
 * @returns WorldstateDto
 */
function base(alerts: WorldstateDto['alerts']): WorldstateDto {
  return {
    realm: 'international',
    fetchedAt: '2026-10-10T12:00:00.000Z',
    cycles: [],
    fissures: [],
    invasions: [],
    nightwave: null,
    ...EMPTY_WORLDSTATE_MISSION_SLICES,
    alerts,
  };
}

describe('formatAlertsText', () => {
  it('shows empty state 当前无警报', () => {
    const text = formatAlertsText(base([]), 'zh');
    expect(text).toContain('警报');
    expect(text).toContain('当前无警报');
  });

  it('shows empty state in English', () => {
    const text = formatAlertsText(base([]), 'en');
    expect(text).toContain('Alerts');
    expect(text).toContain('no active alerts');
  });

  it('lists mission, node, credits and rewards', () => {
    const text = formatAlertsText(
      base([
        {
          id: 'a1',
          node: { zh: '测试节点（地球）', en: 'Test Node (Earth)' },
          missionType: { zh: '移动防御', en: 'Mobile Defense' },
          faction: { zh: 'Infested', en: 'Infested' },
          credits: 17000,
          rewards: [
            {
              name: { zh: '活动资源', en: 'Event Resource' },
              uniqueName: '/Lotus/Types/Gameplay/Events/X',
              quantity: 50,
            },
          ],
          expiry: '2099-01-01T00:00:00.000Z',
        },
      ]),
      'zh',
    );
    expect(text).toContain('移动防御');
    expect(text).toContain('测试节点');
    expect(text).toContain('17000 星币');
    expect(text).toContain('活动资源 ×50');
    expect(text).not.toContain('当前无警报');
  });
});
