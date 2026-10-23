import type { BountySyndicateDto } from '../dto/worldstate-missions.js';

/**
 * 赏金地图筛选（按联盟 Tag）。
 */
export type BountyMapFilter = {
  /** 命中的上游 Tag 列表（如 `CetusSyndicate`） */
  tags: string[];
};

/**
 * 地图别名 → 上游 Syndicate Tag。
 * 键均为小写；中文词直接收录。
 */
const MAP_ALIAS_TO_TAG: Record<string, string> = {
  // 平原 / Cetus
  平原: 'CetusSyndicate',
  希图斯: 'CetusSyndicate',
  希图斯平原: 'CetusSyndicate',
  cetus: 'CetusSyndicate',
  eidolon: 'CetusSyndicate',
  plains: 'CetusSyndicate',
  // 金星 / Vallis
  金星: 'SolarisSyndicate',
  山谷: 'SolarisSyndicate',
  奥布: 'SolarisSyndicate',
  奥布山谷: 'SolarisSyndicate',
  福尔图娜: 'SolarisSyndicate',
  vallis: 'SolarisSyndicate',
  fortuna: 'SolarisSyndicate',
  solaris: 'SolarisSyndicate',
  // 火卫二 / Deimos
  火卫二: 'EntratiSyndicate',
  魔胎: 'EntratiSyndicate',
  魔胎之境: 'EntratiSyndicate',
  deimos: 'EntratiSyndicate',
  entrati: 'EntratiSyndicate',
  cambion: 'EntratiSyndicate',
  // 扎里曼
  扎里曼: 'ZarimanSyndicate',
  zariman: 'ZarimanSyndicate',
};

/**
 * 将命令行词元解析为赏金地图筛选。
 * 未识别的词忽略；可多选（并集）。
 *
 * @param tokens - `/赏金` 后的词元
 * @returns 筛选对象（`tags` 可为空）
 */
export function parseBountyMapTokens(tokens: readonly string[]): BountyMapFilter {
  const tags = new Set<string>();
  for (const raw of tokens) {
    const key = raw.trim().toLowerCase();
    if (!key) {
      continue;
    }
    const tag = MAP_ALIAS_TO_TAG[key] ?? MAP_ALIAS_TO_TAG[raw.trim()];
    if (tag) {
      tags.add(tag);
    }
  }
  return { tags: [...tags] };
}

/**
 * 筛选是否含有效地图条件。
 *
 * @param filter - 解析后的筛选
 * @returns 有 Tag 时为 true
 */
export function isBountyMapFilterActive(filter: BountyMapFilter): boolean {
  return filter.tags.length > 0;
}

/**
 * 按地图 Tag 过滤赏金联盟列表。
 *
 * @param bounties - 完整赏金切片
 * @param filter - 地图筛选
 * @returns 过滤后的列表；无有效 Tag 时原样返回
 */
export function applyBountyMapFilter(
  bounties: readonly BountySyndicateDto[],
  filter: BountyMapFilter,
): BountySyndicateDto[] {
  if (!isBountyMapFilterActive(filter)) {
    return [...bounties];
  }
  const allow = new Set(filter.tags);
  return bounties.filter((row) => allow.has(row.tag));
}
