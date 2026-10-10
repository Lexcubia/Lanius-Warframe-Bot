import type { LabelOverride, LabelsConfig, LocalizedName } from '@lanius/core';

/**
 * 进程内 labels 覆盖表（启动时从 config/default+local 注入）。
 */
let overrides: LabelsConfig = {
  factions: {},
  nodes: {},
  paths: {},
};

/**
 * 注入运行时 labels 覆盖（重启进程后由入口再次调用）。
 *
 * @param next - 合并后的 LabelsConfig
 * @returns 无返回值
 */
export function setLabelOverrides(next: LabelsConfig): void {
  overrides = {
    factions: { ...next.factions },
    nodes: { ...next.nodes },
    paths: { ...next.paths },
  };
}

/**
 * 读取当前 labels 覆盖快照（测试用）。
 *
 * @returns 当前覆盖表浅拷贝
 */
export function getLabelOverrides(): LabelsConfig {
  return {
    factions: { ...overrides.factions },
    nodes: { ...overrides.nodes },
    paths: { ...overrides.paths },
  };
}

/**
 * 将覆盖条目应用到已有 LocalizedName（覆盖非空字段）。
 *
 * @param base - WFCD / 回退后的基础名
 * @param override - 可选配置覆盖
 * @returns 应用覆盖后的显示名
 */
export function applyLabelOverride(
  base: LocalizedName,
  override: LabelOverride | undefined,
): LocalizedName {
  if (!override) {
    return base;
  }
  return {
    zh: override.zh?.trim() ? override.zh.trim() : base.zh,
    en: override.en?.trim() ? override.en.trim() : base.en,
  };
}

/**
 * 按表名取覆盖条目。
 *
 * @param table - `factions` | `nodes` | `paths`
 * @param key - 官方内部键
 * @returns 覆盖条目或 undefined
 */
export function lookupLabelOverride(
  table: 'factions' | 'nodes' | 'paths',
  key: string,
): LabelOverride | undefined {
  return overrides[table][key];
}
