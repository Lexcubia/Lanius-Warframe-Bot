import { describe, expect, it } from 'vitest';

import { truncateWeightedChars } from '@lanius/qq-official';

import { buildQqPanelItems } from './build-panel-items.js';

/**
 * 计算开放平台加权长度（中文 2、其余 1），与 `truncateWeightedChars` 一致。
 *
 * @param value - 待测文案
 * @returns 加权长度
 */
function weightedLength(value: string): number {
  let weight = 0;
  for (const ch of value) {
    weight += /[\u4e00-\u9fff]/.test(ch) ? 2 : 1;
  }
  return weight;
}

describe('buildQqPanelItems', () => {
  it('keeps every panel desc within QQ weighted limit of 30', () => {
    const items = buildQqPanelItems();
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(weightedLength(item.desc)).toBeLessThanOrEqual(30);
      expect(weightedLength(item.name)).toBeLessThanOrEqual(14);
      // 再经官方同步路径截断后仍应原样（源文案已合规）
      expect(truncateWeightedChars(item.desc, 30)).toBe(item.desc);
    }
  });

  it('uses short panel copy instead of long help summaries', () => {
    const worldstate = buildQqPanelItems().find((row) => row.name === '世界状态');
    expect(worldstate?.desc).toBe('开放世界周期与节点');
    expect(worldstate?.desc.includes('扎里曼')).toBe(false);
  });
});
