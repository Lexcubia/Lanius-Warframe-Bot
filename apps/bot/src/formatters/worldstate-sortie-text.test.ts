import type { WorldstateDto } from '@lanius/core';
import { EMPTY_WORLDSTATE_MISSION_SLICES } from '@lanius/core';
import { describe, expect, it } from 'vitest';

import { formatArchonText, formatSortieText } from './worldstate-text.js';

/**
 * 构造含突击 / 执行官切片的最小 worldstate。
 *
 * @param overrides - 覆盖字段
 * @returns WorldstateDto
 */
function sampleWorldstate(
  overrides: Partial<Pick<WorldstateDto, 'sortie' | 'archon'>> = {},
): WorldstateDto {
  return {
    realm: 'international',
    fetchedAt: '2026-10-10T12:00:00.000Z',
    cycles: [],
    fissures: [],
    invasions: [],
    nightwave: null,
    ...EMPTY_WORLDSTATE_MISSION_SLICES,
    sortie: {
      id: 'sortie-1',
      bossKey: 'SORTIE_BOSS_CORRUPTED_VOR',
      boss: { zh: '堕落的 Vor', en: 'Corrupted Vor' },
      expiry: '2099-01-01T00:00:00.000Z',
      missions: [
        {
          missionTypeKey: 'MT_EXTERMINATION',
          missionType: { zh: '歼灭', en: 'Extermination' },
          modifierKey: 'SORTIE_MODIFIER_SLASH',
          modifier: { zh: '敌人物理强化（切割）', en: 'Enemy Physical Enhancement: Slash' },
          nodeKey: 'SolNode412',
          node: { zh: 'Ukko（虚空）', en: 'Ukko (Void)' },
        },
      ],
    },
    archon: {
      id: 'archon-1',
      bossKey: 'SORTIE_BOSS_AMAR',
      boss: { zh: '欺谋狼主', en: 'Archon Amar' },
      missions: [
        {
          missionTypeKey: 'MT_RESCUE',
          missionType: { zh: '救援', en: 'Rescue' },
          node: { zh: 'Tessera（金星）', en: 'Tessera (Venus)' },
        },
      ],
    },
    ...overrides,
  };
}

describe('formatSortieText / formatArchonText', () => {
  it('formats sortie boss and mission chain in zh', () => {
    const text = formatSortieText(sampleWorldstate(), 'zh');
    expect(text).toContain('突击');
    expect(text).toContain('堕落的 Vor');
    expect(text).toContain('歼灭');
    expect(text).toContain('切割');
  });

  it('formats archon hunt in en and empty states', () => {
    const text = formatArchonText(sampleWorldstate(), 'en');
    expect(text).toContain('Archon Hunt');
    expect(text).toContain('Archon Amar');
    expect(text).toContain('Rescue');

    const empty = formatSortieText(sampleWorldstate({ sortie: null }), 'zh');
    expect(empty).toContain('暂无突击数据');
  });
});
