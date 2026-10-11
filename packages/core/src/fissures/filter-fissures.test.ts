import { describe, expect, it } from 'vitest';

import type { FissureDto } from '../dto/worldstate.js';
import {
  applyFissureQueryFilter,
  collectMissionTypeOptions,
  emptyFissureFilter,
  filterFissures,
  isFissureFilterActive,
  parseFissureFilterTokens,
  toggleFilterValue,
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
    missionType: {
      zh: partial.missionTypeKey === 'MT_SURVIVAL' ? '生存' : '歼灭',
      en: partial.missionTypeKey === 'MT_SURVIVAL' ? 'Survival' : 'Exterminate',
    },
    node: { zh: '节点', en: 'Node' },
    pathLabel: { zh: partial.path, en: partial.path },
    iconPath: '/x.png',
    iconUrl: 'https://example.com/x.png',
    expiry: '2099-01-01T00:00:00.000Z',
    remainingMs: 60_000,
    ...partial,
  };
}

describe('filterFissures', () => {
  const sample = [
    row({ id: '1', era: 'lith', path: 'normal', missionTypeKey: 'MT_EXTERMINATION' }),
    row({ id: '2', era: 'axi', path: 'steelPath', missionTypeKey: 'MT_SURVIVAL' }),
    row({ id: '3', era: 'lith', path: 'empyrean', missionTypeKey: 'MT_SURVIVAL' }),
  ];

  it('空筛选返回全部', () => {
    expect(filterFissures(sample, emptyFissureFilter())).toHaveLength(3);
    expect(isFissureFilterActive(emptyFissureFilter())).toBe(false);
  });

  it('按遗物纪元过滤', () => {
    const out = filterFissures(sample, {
      eras: ['lith'],
      missionTypeKeys: [],
      paths: [],
    });
    expect(out.map((r) => r.id)).toEqual(['1', '3']);
  });

  it('三维同时生效', () => {
    const out = filterFissures(sample, {
      eras: ['lith'],
      missionTypeKeys: ['Survival'],
      paths: ['empyrean'],
    });
    expect(out.map((r) => r.id)).toEqual(['3']);
  });

  it('仍兼容以 MT_* 作为筛选键', () => {
    const out = filterFissures(sample, {
      eras: [],
      missionTypeKeys: ['MT_SURVIVAL'],
      paths: [],
    });
    expect(out.map((r) => r.id).sort()).toEqual(['2', '3']);
  });

  it('收集任务类型选项（按显示名去重）', () => {
    const opts = collectMissionTypeOptions(sample, 'en');
    expect(opts.map((o) => o.key).sort()).toEqual(['Exterminate', 'Survival']);
  });

  it('同源显示名的不同 missionTypeKey 合并为一个 chip', () => {
    const mixed = [
      row({
        id: 'a',
        era: 'lith',
        path: 'normal',
        missionTypeKey: 'MT_SURVIVAL',
        missionType: { zh: '生存', en: 'Survival' },
      }),
      row({
        id: 'b',
        era: 'lith',
        path: 'empyrean',
        missionTypeKey: 'CrewBattleNode555',
        missionType: { zh: '生存', en: 'Survival' },
      }),
      row({
        id: 'c',
        era: 'neo',
        path: 'empyrean',
        missionTypeKey: 'CrewBattleNode556',
        missionType: { zh: '生存', en: 'Survival' },
      }),
    ];
    const opts = collectMissionTypeOptions(mixed, 'zh');
    expect(opts).toHaveLength(1);
    expect(opts[0]?.key).toBe('Survival');
    expect(opts[0]?.label.zh).toBe('生存');

    const filtered = filterFissures(mixed, {
      eras: [],
      missionTypeKeys: ['Survival'],
      paths: [],
    });
    expect(filtered.map((r) => r.id).sort()).toEqual(['a', 'b', 'c']);
  });

  it('切换多选值', () => {
    expect(toggleFilterValue(['a'], 'b')).toEqual(['a', 'b']);
    expect(toggleFilterValue(['a', 'b'], 'a')).toEqual(['b']);
  });
});

describe('parseFissureFilterTokens', () => {
  it('解析纪元与路径别名', () => {
    expect(parseFissureFilterTokens(['古纪', '钢铁之路'])).toEqual({
      eras: ['lith'],
      paths: ['steelPath'],
      missionHints: [],
    });
  });

  it('未识别词作为任务类型提示', () => {
    expect(parseFissureFilterTokens(['生存', 'lith'])).toEqual({
      eras: ['lith'],
      paths: [],
      missionHints: ['生存'],
    });
  });

  it('应用到列表', () => {
    const sample = [
      row({ id: '1', era: 'lith', path: 'normal', missionTypeKey: 'MT_EXTERMINATION' }),
      row({ id: '2', era: 'lith', path: 'steelPath', missionTypeKey: 'MT_SURVIVAL' }),
    ];
    const query = parseFissureFilterTokens(['古纪', '钢铁', '生存']);
    const { items } = applyFissureQueryFilter(sample, query);
    expect(items.map((r) => r.id)).toEqual(['2']);
  });
});
