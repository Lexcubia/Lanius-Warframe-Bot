import type { CatalogItemDto, LocalizedName } from '@lanius/core';

import { canonicalizeItemPath } from '../public-export/canonicalize-item-path.js';

/**
 * ExportRewards 单条掉落（PublicExport-plus `ExportRewards.json` 行）。
 */
export type MissionDeckDropEntry = {
  /** 上游 type，多为 `/Lotus/StoreItems/...` */
  type?: string;
  itemCount?: number;
  probability?: number;
};

/**
 * 单张 MissionDeck 奖励表：外层 = rotation / stage，内层 = 该档掉落池。
 */
export type MissionDeckRewardTable = MissionDeckDropEntry[][];

/**
 * uniqueName（MissionDeck 路径）→ 奖励表。
 */
export type MissionDeckCatalog = ReadonlyMap<string, MissionDeckRewardTable>;

/**
 * 将 ExportRewards 原始对象编成可查找目录。
 *
 * @param raw - `ExportRewards.json` 根对象（路径 → 二维掉落数组）
 * @returns MissionDeck 路径 → 奖励表映射
 */
export function buildMissionDeckCatalog(
  raw: Record<string, MissionDeckRewardTable | undefined>,
): MissionDeckCatalog {
  const map = new Map<string, MissionDeckRewardTable>();
  for (const [path, table] of Object.entries(raw)) {
    if (!path || !Array.isArray(table)) {
      continue;
    }
    map.set(path, table);
  }
  return map;
}

/**
 * 将 MissionDeck 奖励表路径解析为去重后的 `CatalogItemDto` 列表。
 * 赏金 Jobs 的 `rewards` 字段、突击奖励表等均可复用。
 *
 * @param tablePath - 上游路径，如 `/Lotus/Types/Game/MissionDecks/.../TierATableCRewards`
 * @param catalog - 已加载的 MissionDeck 目录（缺表时返回空数组，不抛错）
 * @param options - 可选物品名解析；缺省时用路径末段作中英占位名
 * @returns 按首次出现顺序去重后的物品列表（保留 quantity）
 */
export function resolveMissionDeckRewards(
  tablePath: string,
  catalog: MissionDeckCatalog,
  options?: {
    resolveItemName?: (uniqueName: string) => LocalizedName | undefined;
  },
): CatalogItemDto[] {
  const trimmed = tablePath.trim();
  if (!trimmed) {
    return [];
  }

  const table = catalog.get(trimmed);
  if (!table) {
    return [];
  }

  const seen = new Set<string>();
  const items: CatalogItemDto[] = [];

  for (const rotation of table) {
    if (!Array.isArray(rotation)) {
      continue;
    }
    for (const drop of rotation) {
      const rawType = drop?.type?.trim();
      if (!rawType) {
        continue;
      }
      const uniqueName = canonicalizeItemPath(rawType);
      if (seen.has(uniqueName)) {
        continue;
      }
      seen.add(uniqueName);

      const quantity =
        typeof drop.itemCount === 'number' && Number.isFinite(drop.itemCount) && drop.itemCount > 0
          ? Math.floor(drop.itemCount)
          : undefined;

      const name = options?.resolveItemName?.(uniqueName) ?? fallbackNameFromPath(uniqueName);

      items.push({
        name,
        uniqueName,
        ...(quantity !== undefined ? { quantity } : {}),
      });
    }
  }

  return items;
}

/**
 * 无标签表时用路径末段生成占位双语名（Wave 1 应换正式标签解析）。
 *
 * @param uniqueName - 规范化后的物品路径
 * @returns 末段英文作中英占位
 */
function fallbackNameFromPath(uniqueName: string): LocalizedName {
  const segment = uniqueName.split('/').filter(Boolean).pop() ?? uniqueName;
  return { zh: segment, en: segment };
}
