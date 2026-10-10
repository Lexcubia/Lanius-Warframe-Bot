import type { LocalizedName } from '@lanius/core';
import {
  faction as resolveFactionEn,
  languageDesc,
  languageString,
  node as resolveNodeEn,
} from 'warframe-worldstate-data/utilities';

import { applyLabelOverride, lookupLabelOverride } from './label-overrides.js';

/**
 * 将内部键解析为双语显示名；未知键时中英均回退为原键。
 *
 * @param zh - 中文显示名（可为空）
 * @param en - 英文显示名（可为空）
 * @param fallback - 解析失败时使用的内部键
 * @returns 规范化的 `LocalizedName`
 */
function localized(zh: string | undefined, en: string | undefined, fallback: string): LocalizedName {
  const enLabel = en && en.trim().length > 0 ? en.trim() : fallback;
  const zhLabel = zh && zh.trim().length > 0 ? zh.trim() : enLabel;
  return { zh: zhLabel, en: enLabel };
}

/**
 * 解析星图节点内部键（如 `SolNode189`）为可读节点名。
 *
 * @param nodeKey - 官方 worldState 中的 `Node` 字段
 * @returns 中英节点显示名；未知时回退为原键
 */
export function resolveNodeLabel(nodeKey: string): LocalizedName {
  const en = safeCall(() => resolveNodeEn(nodeKey, 'en'));
  const zh = safeCall(() => resolveNodeEn(nodeKey, 'zh'));
  const base = localized(zh, en, nodeKey);
  return applyLabelOverride(base, lookupLabelOverride('nodes', nodeKey));
}

/**
 * 解析阵营代码（如 `FC_GRINEER`）为可读阵营名。
 * 优先 labels.yaml 中 factions 覆盖，再回退 WFCD。
 *
 * @param factionKey - 上游 AttackerMissionInfo.faction 或 DefenderMissionInfo.faction
 * @returns 中英阵营显示名；未知时回退为原键
 */
export function resolveFactionLabel(factionKey: string): LocalizedName {
  const en = safeCall(() => resolveFactionEn(factionKey, 'en')) ?? factionKey;
  const base = localized(undefined, en, factionKey);
  return applyLabelOverride(base, lookupLabelOverride('factions', factionKey));
}

/**
 * 解析 Lotus 路径（挑战 / 奖励物品等）为标题型显示名。
 *
 * @param uniqueName - 上游 uniqueName 或 ItemType 路径
 * @returns 中英显示名；未知时回退为原路径末段或全路径
 */
export function resolvePathLabel(uniqueName: string): LocalizedName {
  const en = safeCall(() => languageString(uniqueName, 'en'));
  const zh = safeCall(() => languageString(uniqueName, 'zh'));
  const fallback = uniqueName.includes('/')
    ? (uniqueName.split('/').pop() ?? uniqueName)
    : uniqueName;
  const base = localized(zh, en, fallback);
  return applyLabelOverride(base, lookupLabelOverride('paths', uniqueName));
}

/**
 * 解析夜浪挑战路径为标题 + 可选描述。
 *
 * @param challengePath - `ActiveChallenges[].Challenge` 路径
 * @returns `title` 与可选 `description` 双语字段
 */
export function resolveChallengeLabels(challengePath: string): {
  title: LocalizedName;
  description?: LocalizedName;
} {
  const title = resolvePathLabel(challengePath);
  const enDesc = safeCall(() => languageDesc(challengePath, 'en'));
  const zhDesc = safeCall(() => languageDesc(challengePath, 'zh'));
  if (!enDesc && !zhDesc) {
    return { title };
  }
  return {
    title,
    description: localized(zhDesc, enDesc, title.en),
  };
}

/**
 * 调用 WFCD 工具并吞掉解析异常（缺表项时工具可能抛错或返回空）。
 *
 * @param fn - 无参解析函数
 * @returns 非空字符串，或 `undefined`
 */
function safeCall(fn: () => string): string | undefined {
  try {
    const value = fn();
    if (typeof value !== 'string') {
      return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  } catch {
    return undefined;
  }
}
