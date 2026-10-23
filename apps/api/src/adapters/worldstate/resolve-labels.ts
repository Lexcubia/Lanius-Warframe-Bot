import type { FissureEra, LocalizedName } from '@lanius/core';
import {
  faction as resolveFactionEn,
  languageDesc,
  languageString,
  missionType as resolveMissionType,
  node as resolveNodeEn,
  nodeMissionType,
  sortieBoss as resolveSortieBoss,
  sortieModifier as resolveSortieModifier,
} from 'warframe-worldstate-data/utilities';

import { toHuijiZh } from './huiji-zh.js';
import { applyLabelOverride, lookupLabelOverride } from './label-overrides.js';

/**
 * 产品侧简体中文任务类型覆盖（WFCD zh 表多为繁体或英文）。
 * 键可为 `MT_*` 或星图英文 type（如 Skirmish）。
 */
const MISSION_TYPE_ZH: Record<string, string> = {
  MT_SURVIVAL: '生存',
  Survival: '生存',
  MT_DEFENSE: '防御',
  Defense: '防御',
  MT_EXTERMINATION: '歼灭',
  Extermination: '歼灭',
  MT_INTEL: '间谍',
  Spy: '间谍',
  Skirmish: '前哨战',
  Volatile: '爆发',
  MT_RESCUE: '救援',
  Rescue: '救援',
  MT_TERRITORY: '拦截',
  Interception: '拦截',
  MT_SABOTAGE: '破坏',
  Sabotage: '破坏',
  MT_MOBILE_DEFENSE: '移动防御',
  'Mobile Defense': '移动防御',
  MT_DISRUPTION: '中断',
  MT_ARTIFACT: '中断',
  Disruption: '中断',
  MT_ASSAULT: '强袭',
  Assault: '强袭',
  MT_ASSASSINATION: '刺杀',
  Assassination: '刺杀',
  MT_EXCAVATE: '挖掘',
  Excavation: '挖掘',
  MT_CORRUPTION: '虚空洪流',
  'Void Flood': '虚空洪流',
  MT_VOID_CASCADE: '虚空覆涌',
  'Void Cascade': '虚空覆涌',
  'Conjunction Survival': '联结生存',
};

/**
 * 纪元固定双语（与官方 VoidT1–T6 / 产品文案对齐）。
 */
const ERA_LABELS: Record<FissureEra, LocalizedName> = {
  lith: { zh: '古纪', en: 'Lith' },
  meso: { zh: '前纪', en: 'Meso' },
  neo: { zh: '中纪', en: 'Neo' },
  axi: { zh: '后纪', en: 'Axi' },
  requiem: { zh: '安魂', en: 'Requiem' },
  omnia: { zh: '全能', en: 'Omnia' },
};

/**
 * 将内部键解析为双语显示名；未知键时中英均回退为原键。
 *
 * @param zh - 中文显示名（可为空）
 * @param en - 英文显示名（可为空）
 * @param fallback - 解析失败时使用的内部键
 * @returns 规范化的 `LocalizedName`
 */
function localized(
  zh: string | undefined,
  en: string | undefined,
  fallback: string,
): LocalizedName {
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
  const zhRaw = safeCall(() => resolveNodeEn(nodeKey, 'zh'));
  const zh = zhRaw ? toHuijiZh(zhRaw) : undefined;
  const base = localized(zh, en, nodeKey);
  return applyLabelOverride(base, lookupLabelOverride('nodes', nodeKey));
}

/**
 * 解析阵营代码（如 `FC_GRINEER`）为可读阵营名。
 * 先取 WFCD，再套 labels.yaml（默认对齐灰机 wiki）。
 *
 * @param factionKey - 上游 AttackerMissionInfo.faction 或 DefenderMissionInfo.faction
 * @returns 中英阵营显示名；未知时回退为原键
 */
export function resolveFactionLabel(factionKey: string): LocalizedName {
  const en = safeCall(() => resolveFactionEn(factionKey, 'en')) ?? factionKey;
  const zhRaw = safeCall(() => resolveFactionEn(factionKey, 'zh'));
  const zh = zhRaw ? toHuijiZh(zhRaw) : undefined;
  const base = localized(zh, en, factionKey);
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
  const zhRaw = safeCall(() => languageString(uniqueName, 'zh'));
  const zh = zhRaw ? toHuijiZh(zhRaw) : undefined;
  const fallback = uniqueName.includes('/')
    ? (uniqueName.split('/').pop() ?? uniqueName)
    : uniqueName;
  const base = localized(zh, en, fallback);
  return applyLabelOverride(base, lookupLabelOverride('paths', uniqueName));
}

/**
 * 解析午夜电波（Nightwave）挑战路径为标题 + 可选描述。
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
  const zhDescRaw = safeCall(() => languageDesc(challengePath, 'zh'));
  const zhDesc = zhDescRaw ? toHuijiZh(zhDescRaw) : undefined;
  if (!enDesc && !zhDesc) {
    return { title };
  }
  return {
    title,
    description: localized(zhDesc, enDesc, title.en),
  };
}

/**
 * 解析裂隙纪元显示名。
 *
 * @param era - Lanius 纪元枚举
 * @returns 中英纪元名
 */
export function resolveFissureEraLabel(era: FissureEra): LocalizedName {
  return ERA_LABELS[era];
}

/**
 * 解析任务类型键为双语显示名。
 * `fromNode` 时先把节点键解析为星图英文 type（Skirmish 等），再套中英表。
 *
 * @param key - `MT_*` 或节点键 / 英文 type
 * @param options - `fromNode`：key 为 SolNode / CrewBattleNode
 * @returns 中英任务类型名
 */
export function resolveMissionTypeLabel(
  key: string,
  options: { fromNode?: boolean } = {},
): LocalizedName {
  let typeKey = key;
  if (options.fromNode) {
    const fromNode = safeCall(() => nodeMissionType(key, 'en'));
    if (fromNode) {
      typeKey = fromNode;
    }
  }

  const enFromMt = typeKey.startsWith('MT_')
    ? safeCall(() => resolveMissionType(typeKey, 'en'))
    : undefined;
  const zhFromMt = typeKey.startsWith('MT_')
    ? safeCall(() => resolveMissionType(typeKey, 'zh'))
    : undefined;

  const en = enFromMt ?? (typeKey.startsWith('MT_') ? typeKey : typeKey);
  const zhOverride = MISSION_TYPE_ZH[typeKey] ?? MISSION_TYPE_ZH[en];
  const zh = zhOverride ?? zhFromMt ?? en;

  return localized(zh, en, typeKey);
}

/**
 * 产品侧简体 Boss 覆盖（WFCD zh 常为繁体或旧译）。
 */
const SORTIE_BOSS_ZH: Record<string, string> = {
  SORTIE_BOSS_CORRUPTED_VOR: '堕落的 Vor',
  SORTIE_BOSS_KRIL: '中尉 Lech Kril',
  SORTIE_BOSS_TYL: 'Tyl Regor',
  SORTIE_BOSS_JACKAL: '豺狼',
  SORTIE_BOSS_HYENA: '鬣狗群',
  SORTIE_BOSS_AMAR: '欺谋狼主',
  SORTIE_BOSS_NIRA: '诡诈蛇主',
  SORTIE_BOSS_BOREAL: '猎杀鸟主',
};

/**
 * 产品侧简体突击修正覆盖。
 */
const SORTIE_MODIFIER_ZH: Record<string, string> = {
  SORTIE_MODIFIER_SLASH: '敌人物理强化（切割）',
  SORTIE_MODIFIER_IMPACT: '敌人物理强化（冲击）',
  SORTIE_MODIFIER_PUNCTURE: '敌人物理强化（穿刺）',
  SORTIE_MODIFIER_EXIMUS: '卓越者大本营',
  SORTIE_MODIFIER_LOW_ENERGY: '能量削减',
  SORTIE_MODIFIER_HAZARD_RADIATION: '危害：辐射',
  SORTIE_MODIFIER_HAZARD_COLD: '危害：寒冷',
  SORTIE_MODIFIER_HAZARD_FIRE: '危害：火焰',
  SORTIE_MODIFIER_HAZARD_MAGNETIC: '危害：磁力',
  SORTIE_MODIFIER_HAZARD_ICE: '危害：冰冻',
  SORTIE_MODIFIER_HAZARD_FOG: '危害：浓雾',
  SORTIE_MODIFIER_ARMOR: '敌人护甲强化',
  SORTIE_MODIFIER_SHIELDS: '敌人护盾强化',
  SORTIE_MODIFIER_AUGMENTED_ENEMY_ARMOR: '敌人护甲强化',
  SORTIE_MODIFIER_AUGMENTED_ENEMY_SHIELDS: '敌人护盾强化',
};

/**
 * 解析突击 / 执行官 Boss 键为双语显示名。
 *
 * @param bossKey - 上游 `Boss`，如 `SORTIE_BOSS_AMAR`
 * @returns 中英 Boss 名；未知时回退为原键
 */
export function resolveSortieBossLabel(bossKey: string): LocalizedName {
  const en = safeCall(() => resolveSortieBoss(bossKey, 'en'));
  const zhRaw = safeCall(() => resolveSortieBoss(bossKey, 'zh'));
  const zhOverride = SORTIE_BOSS_ZH[bossKey];
  const zh = zhOverride ?? (zhRaw ? toHuijiZh(zhRaw) : undefined);
  const base = localized(zh, en, bossKey);
  return applyLabelOverride(base, lookupLabelOverride('paths', bossKey));
}

/**
 * 解析突击修正键为双语显示名（执行官任务通常无修正）。
 *
 * @param modifierKey - 上游 `modifierType`，如 `SORTIE_MODIFIER_SLASH`
 * @returns 中英修正名；未知时回退为原键
 */
export function resolveSortieModifierLabel(modifierKey: string): LocalizedName {
  const en = safeCall(() => resolveSortieModifier(modifierKey, 'en'));
  const zhRaw = safeCall(() => resolveSortieModifier(modifierKey, 'zh'));
  const zhOverride = SORTIE_MODIFIER_ZH[modifierKey];
  const zh = zhOverride ?? (zhRaw ? toHuijiZh(zhRaw) : undefined);
  const base = localized(zh, en, modifierKey);
  return applyLabelOverride(base, lookupLabelOverride('paths', modifierKey));
}

/**
 * 解析武器显示名（轮换表存英文名）。
 * 有 uniqueName 时先取 languageString，再套 labels.weapons 覆盖（产品中文译名优先）。
 *
 * @param weaponName - 配置/库中的武器英文名，如 `Tenet Arca Plasmor`
 * @param uniqueName - 可选 PublicExport 路径；缺省时仅用英文名 + labels
 * @returns 双语显示名；无覆盖时中英均为原名
 */
export function resolveWeaponLabel(weaponName: string, uniqueName?: string): LocalizedName {
  const trimmed = weaponName.trim();
  const fromPath = uniqueName ? resolvePathLabel(uniqueName) : undefined;
  const pathTail = uniqueName?.includes('/')
    ? (uniqueName.split('/').pop() ?? uniqueName)
    : uniqueName;
  const en = fromPath && fromPath.en !== pathTail ? fromPath.en : trimmed;
  const zh = fromPath && fromPath.zh !== fromPath.en ? fromPath.zh : undefined;
  const base = localized(zh, en, trimmed);
  return applyLabelOverride(base, lookupLabelOverride('weapons', trimmed));
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
