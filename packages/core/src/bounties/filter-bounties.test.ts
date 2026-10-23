import { describe, expect, it } from 'vitest';

import type { BountySyndicateDto } from '../dto/worldstate-missions.js';
import {
  applyBountyMapFilter,
  isBountyMapFilterActive,
  parseBountyMapTokens,
} from './filter-bounties.js';

/**
 * 构造最小赏金联盟夹具。
 *
 * @param tag - 上游 Tag
 * @returns 单联盟 DTO
 */
function syndicate(tag: string): BountySyndicateDto {
  return { tag, jobs: [] };
}

describe('parseBountyMapTokens', () => {
  it('maps zh and en aliases to syndicate tags', () => {
    expect(parseBountyMapTokens(['平原'])).toEqual({ tags: ['CetusSyndicate'] });
    expect(parseBountyMapTokens(['金星', 'vallis'])).toEqual({
      tags: ['SolarisSyndicate'],
    });
    expect(parseBountyMapTokens(['火卫二', 'deimos', 'cetus'])).toEqual({
      tags: ['EntratiSyndicate', 'CetusSyndicate'],
    });
  });

  it('ignores unknown tokens', () => {
    expect(parseBountyMapTokens(['未知地图', 'xyz'])).toEqual({ tags: [] });
    expect(isBountyMapFilterActive(parseBountyMapTokens([]))).toBe(false);
  });
});

describe('applyBountyMapFilter', () => {
  const sample = [
    syndicate('CetusSyndicate'),
    syndicate('SolarisSyndicate'),
    syndicate('EntratiSyndicate'),
  ];

  it('returns all when filter inactive', () => {
    expect(applyBountyMapFilter(sample, { tags: [] })).toHaveLength(3);
  });

  it('filters by tag', () => {
    const filtered = applyBountyMapFilter(sample, { tags: ['CetusSyndicate'] });
    expect(filtered.map((row) => row.tag)).toEqual(['CetusSyndicate']);
  });
});
