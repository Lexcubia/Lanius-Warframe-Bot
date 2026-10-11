import type { FissureDto, FissureEra, FissurePath } from '../dto/worldstate.js';

/**
 * 虚空裂隙三维筛选条件。
 * 某一维为空数组时表示该维不过滤（全部）。
 */
export type FissureFilterState = {
  /** 选中的遗物纪元；空 = 全部 */
  eras: FissureEra[];
  /** 选中的任务类型键（`missionTypeKey`）；空 = 全部 */
  missionTypeKeys: string[];
  /** 选中的路径档；空 = 全部 */
  paths: FissurePath[];
};

/**
 * Bot / 命令行解析出的裂隙筛选（任务类型先以提示词保存，待列表到达后再解析）。
 */
export type FissureQueryFilter = {
  eras: FissureEra[];
  paths: FissurePath[];
  /** 用户输入的任务类型词（中英短名或 missionTypeKey） */
  missionHints: string[];
};

/**
 * 遗物纪元展示顺序（古纪 → 全能）。
 */
export const FISSURE_ERA_ORDER: FissureEra[] = [
  'lith',
  'meso',
  'neo',
  'axi',
  'requiem',
  'omnia',
];

/**
 * 路径档展示顺序（普通 → 钢铁 → 九重天）。
 */
export const FISSURE_PATH_ORDER: FissurePath[] = [
  'normal',
  'steelPath',
  'empyrean',
];

/**
 * 纪元别名（小写键）。
 */
const ERA_ALIASES: Record<string, FissureEra> = {
  古纪: 'lith',
  lith: 'lith',
  前纪: 'meso',
  meso: 'meso',
  中纪: 'neo',
  neo: 'neo',
  后纪: 'axi',
  axi: 'axi',
  安魂: 'requiem',
  requiem: 'requiem',
  全能: 'omnia',
  omnia: 'omnia',
};

/**
 * 路径档别名（小写键）。
 */
const PATH_ALIASES: Record<string, FissurePath> = {
  普通: 'normal',
  normal: 'normal',
  钢铁: 'steelPath',
  钢铁之路: 'steelPath',
  steel: 'steelPath',
  steelpath: 'steelPath',
  sp: 'steelPath',
  九重天: 'empyrean',
  empyrean: 'empyrean',
  railjack: 'empyrean',
  rj: 'empyrean',
};

/**
 * 常见任务类型别名 → 上游 `missionTypeKey`（仍会与列表标签做模糊匹配）。
 */
const MISSION_KEY_ALIASES: Record<string, string> = {
  生存: 'MT_SURVIVAL',
  survival: 'MT_SURVIVAL',
  防御: 'MT_DEFENSE',
  defense: 'MT_DEFENSE',
  defence: 'MT_DEFENSE',
  歼灭: 'MT_EXTERMINATION',
  exterminate: 'MT_EXTERMINATION',
  extermination: 'MT_EXTERMINATION',
  捕获: 'MT_CAPTURE',
  capture: 'MT_CAPTURE',
  救援: 'MT_RESCUE',
  rescue: 'MT_RESCUE',
  破坏: 'MT_SABOTAGE',
  sabotage: 'MT_SABOTAGE',
  间谍: 'MT_INTEL',
  spy: 'MT_INTEL',
  intel: 'MT_INTEL',
  拦截: 'MT_TERRITORY',
  interception: 'MT_TERRITORY',
  移动防御: 'MT_MOBILE_DEFENSE',
  mobiledefense: 'MT_MOBILE_DEFENSE',
  'mobile defense': 'MT_MOBILE_DEFENSE',
  挖掘: 'MT_EXCAVATE',
  excavation: 'MT_EXCAVATE',
  前哨战: 'Skirmish',
  skirmish: 'Skirmish',
  爆发: 'MT_ARTIFACT',
  disruption: 'MT_ARTIFACT',
  遗物: 'MT_ARTIFACT',
};

/**
 * 空筛选状态（三维均不过滤）。
 *
 * @returns 可复用的初始筛选对象
 */
export function emptyFissureFilter(): FissureFilterState {
  return { eras: [], missionTypeKeys: [], paths: [] };
}

/**
 * 判断筛选条件是否生效（任一维非空）。
 *
 * @param filter - 当前筛选状态
 * @returns 是否有活动筛选
 */
export function isFissureFilterActive(filter: FissureFilterState): boolean {
  return (
    filter.eras.length > 0 ||
    filter.missionTypeKeys.length > 0 ||
    filter.paths.length > 0
  );
}

/**
 * 按三维条件过滤裂隙列表。
 *
 * @param fissures - 原始裂隙行
 * @param filter - 遗物类型 / 任务类型 / 路径档；空维表示不过滤
 * @returns 同时满足各活动维度的裂隙行（保持原顺序）
 */
export function filterFissures(
  fissures: readonly FissureDto[],
  filter: FissureFilterState,
): FissureDto[] {
  const eraSet =
    filter.eras.length > 0 ? new Set<FissureEra>(filter.eras) : null;
  const missionSet =
    filter.missionTypeKeys.length > 0
      ? new Set(filter.missionTypeKeys)
      : null;
  const pathSet =
    filter.paths.length > 0 ? new Set<FissurePath>(filter.paths) : null;

  return fissures.filter((row) => {
    if (eraSet && !eraSet.has(row.era)) {
      return false;
    }
    if (missionSet && !missionTypeMatchesFilter(row, missionSet)) {
      return false;
    }
    if (pathSet && !pathSet.has(row.path)) {
      return false;
    }
    return true;
  });
}

/**
 * 任务类型筛选项（从当前裂隙列表去重）。
 */
export type FissureMissionOption = {
  /**
   * 筛选键：优先英文显示名（跨路径合并）；
   * 亦兼容上游 `MT_*` / 节点键。
   */
  key: string;
  label: { zh: string; en: string };
};

/**
 * 任务类型筛选的规范键（按英文显示名合并普通 / 钢铁 / 九重天同源类型）。
 *
 * @param row - 裂隙行
 * @returns 规范键
 */
export function canonicalMissionFilterKey(row: FissureDto): string {
  const en = row.missionType.en.trim();
  if (en.length > 0) {
    return en;
  }
  const zh = row.missionType.zh.trim();
  if (zh.length > 0) {
    return zh;
  }
  return row.missionTypeKey;
}

/**
 * 判断裂隙是否命中已选任务类型（键可为英文名 / 中文名 / missionTypeKey）。
 *
 * @param row - 裂隙行
 * @param selected - 已选键集合
 * @returns 是否匹配
 */
function missionTypeMatchesFilter(
  row: FissureDto,
  selected: ReadonlySet<string>,
): boolean {
  if (selected.has(row.missionTypeKey) || selected.has(canonicalMissionFilterKey(row))) {
    return true;
  }
  const en = row.missionType.en.trim();
  const zh = row.missionType.zh.trim();
  if (selected.has(en) || selected.has(zh)) {
    return true;
  }
  for (const raw of selected) {
    const key = raw.trim().toLowerCase();
    if (!key) {
      continue;
    }
    if (
      row.missionTypeKey.toLowerCase() === key ||
      en.toLowerCase() === key ||
      zh.toLowerCase() === key
    ) {
      return true;
    }
  }
  return false;
}

/**
 * 从裂隙列表收集可选任务类型（按显示名去重，避免九重天节点键与 MT_* 重复 chip）。
 *
 * @param fissures - 当前活跃裂隙
 * @param locale - 排序用 locale
 * @returns 去重后的任务类型选项
 */
export function collectMissionTypeOptions(
  fissures: readonly FissureDto[],
  locale: 'zh' | 'en',
): FissureMissionOption[] {
  const byCanon = new Map<string, FissureMissionOption>();
  for (const row of fissures) {
    const canon = canonicalMissionFilterKey(row);
    if (!byCanon.has(canon)) {
      byCanon.set(canon, {
        key: canon,
        label: row.missionType,
      });
    }
  }
  return [...byCanon.values()].sort((a, b) =>
    a.label[locale].localeCompare(b.label[locale], locale),
  );
}

/**
 * 在数组中切换某一项的选中状态（多选 chip 用）。
 *
 * @param selected - 当前已选列表
 * @param value - 要切换的值
 * @returns 新的已选列表（不修改入参）
 */
export function toggleFilterValue<T>(selected: readonly T[], value: T): T[] {
  const index = selected.indexOf(value);
  if (index >= 0) {
    return selected.filter((_, i) => i !== index);
  }
  return [...selected, value];
}

/**
 * 规范化别名查找键（去空白、小写；中文保留原形另查一次）。
 *
 * @param token - 原始词元
 * @returns 查找用键列表
 */
function aliasKeys(token: string): string[] {
  const trimmed = token.trim();
  if (!trimmed) {
    return [];
  }
  const lower = trimmed.toLowerCase();
  const compact = lower.replace(/\s+/g, '');
  return [...new Set([trimmed, lower, compact])];
}

/**
 * 将命令子参数解析为裂隙筛选查询。
 * 支持：`/裂隙 古纪`、`/裂隙 钢铁之路`、`/裂隙 生存`、`/裂隙 古纪 钢铁` 等。
 *
 * @param tokens - 根命令后的词元
 * @returns 查询筛选（任务类型以 hints 形式保留）
 */
export function parseFissureFilterTokens(tokens: readonly string[]): FissureQueryFilter {
  const eras: FissureEra[] = [];
  const paths: FissurePath[] = [];
  const missionHints: string[] = [];

  for (const raw of tokens) {
    const keys = aliasKeys(raw);
    let matched = false;
    for (const key of keys) {
      const era = ERA_ALIASES[key];
      if (era && !eras.includes(era)) {
        eras.push(era);
        matched = true;
        break;
      }
      const path = PATH_ALIASES[key];
      if (path && !paths.includes(path)) {
        paths.push(path);
        matched = true;
        break;
      }
    }
    if (!matched && raw.trim()) {
      missionHints.push(raw.trim());
    }
  }

  return { eras, paths, missionHints };
}

/**
 * 将任务类型提示词解析为当前列表中的 `missionTypeKey`。
 *
 * @param fissures - 活跃裂隙
 * @param hints - 用户任务类型词
 * @returns 去重后的 missionTypeKey 列表
 */
export function resolveMissionTypeKeys(
  fissures: readonly FissureDto[],
  hints: readonly string[],
): string[] {
  if (hints.length === 0) {
    return [];
  }
  const keys = new Set<string>();
  for (const hint of hints) {
    for (const key of aliasKeys(hint)) {
      const aliased = MISSION_KEY_ALIASES[key];
      if (aliased) {
        keys.add(aliased);
      }
    }
    const hintLower = hint.trim().toLowerCase();
    for (const row of fissures) {
      const typeKey = row.missionTypeKey.toLowerCase();
      const zh = row.missionType.zh.toLowerCase();
      const en = row.missionType.en.toLowerCase();
      if (
        typeKey === hintLower ||
        typeKey.includes(hintLower) ||
        zh === hintLower ||
        zh.includes(hintLower) ||
        en === hintLower ||
        en.includes(hintLower)
      ) {
        // 写入规范键，使筛选同时命中 MT_* 与九重天节点键同源类型
        keys.add(canonicalMissionFilterKey(row));
      }
    }
  }
  return [...keys];
}

/**
 * 将命令行查询转为可执行的三维筛选，并过滤列表。
 *
 * @param fissures - 原始裂隙
 * @param query - 解析后的查询
 * @returns 筛选状态与过滤结果
 */
export function applyFissureQueryFilter(
  fissures: readonly FissureDto[],
  query: FissureQueryFilter,
): { filter: FissureFilterState; items: FissureDto[] } {
  const filter: FissureFilterState = {
    eras: [...query.eras],
    paths: [...query.paths],
    missionTypeKeys: resolveMissionTypeKeys(fissures, query.missionHints),
  };
  return { filter, items: filterFissures(fissures, filter) };
}

/**
 * 查询是否带有任一筛选条件。
 *
 * @param query - 命令行查询
 * @returns 是否非空查询
 */
export function isFissureQueryActive(query: FissureQueryFilter): boolean {
  return (
    query.eras.length > 0 ||
    query.paths.length > 0 ||
    query.missionHints.length > 0
  );
}
