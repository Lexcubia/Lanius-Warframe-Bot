/**
 * 兼容旧导入：深合并与根解析已迁至 `@lanius/config`。
 */
export { deepMerge, resolveConfigRoot as resolveRuntimeConfigRoot } from '@lanius/config';

import { getConfigDriver } from '@lanius/config';
import type { LabelsConfig, SiteDto } from '@lanius/core';

/**
 * 加载站点配置（经配置驱动）。
 *
 * @param _runtimeRoot - 忽略；保留签名兼容旧调用
 * @returns SiteDto
 */
export function loadSiteConfig(_runtimeRoot?: string): SiteDto {
  return getConfigDriver().get('site');
}

/**
 * 加载 labels（经配置驱动）。
 *
 * @param _runtimeRoot - 忽略
 * @returns LabelsConfig
 */
export function loadLabelsConfig(_runtimeRoot?: string): LabelsConfig {
  return getConfigDriver().get('labels');
}
