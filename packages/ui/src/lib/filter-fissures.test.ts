import { describe, expect, it } from 'vitest';

import type { FissureDto } from '@lanius/core';

import {
  emptyFissureFilter,
  filterFissures,
  isFissureFilterActive,
} from './filter-fissures.js';

/**
 * 构造测试用裂隙行。
 *
 * @param partial - 覆盖字段
 * @returns 完整 FissureDto
 */
function row(
  partial: Partial<FissureDto> &
    Pick<FissureDto, 'id' | 'era' | 'path' | 'missionTypeKey'>,
): FissureDto {
  return {
    eraLabel: { zh: partial.era, en: partial.era },
    missionType: { zh: partial.missionTypeKey, en: partial.missionTypeKey },
    node: { zh: '节点', en: 'Node' },
    pathLabel: { zh: partial.path, en: partial.path },
    iconPath: '/x.png',
    iconUrl: 'https://example.com/x.png',
    expiry: '2099-01-01T00:00:00.000Z',
    remainingMs: 60_000,
    ...partial,
  };
}

describe('filterFissures (ui re-export)', () => {
  it('委托 @lanius/core 实现', () => {
    const sample = [
      row({ id: '1', era: 'lith', path: 'normal', missionTypeKey: 'MT_EXTERMINATION' }),
    ];
    expect(filterFissures(sample, emptyFissureFilter())).toHaveLength(1);
    expect(isFissureFilterActive(emptyFissureFilter())).toBe(false);
  });
});
