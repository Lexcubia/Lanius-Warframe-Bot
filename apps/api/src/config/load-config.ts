import { assembleApiConfig, getConfigDriver, findRepoRoot } from '@lanius/config';

import type { AppConfig } from './schema.js';

/**
 * 通过配置驱动加载 API 配置（兼容旧 `loadAppConfig` 调用点）。
 *
 * @param cwd - 工作目录
 * @returns AppConfig
 */
export function loadAppConfig(cwd: string = process.cwd()): AppConfig {
  const driver = getConfigDriver({ repoRoot: findRepoRoot(cwd) });
  return assembleApiConfig(driver);
}

/**
 * @deprecated 使用 LANIUS_CONFIG_ROOT；保留符号以免外部脚本断裂
 */
export const DEFAULT_LOCAL_CONFIG = 'config/local';

/**
 * @deprecated
 */
export const DEFAULT_EXAMPLE_CONFIG = 'config/default';

/**
 * @param cwd - cwd
 * @returns 配置根（实际为仓库根下 config，经驱动解析）
 */
export function resolveConfigPath(cwd: string = process.cwd()): string {
  return getConfigDriver({ repoRoot: findRepoRoot(cwd) }).configRoot;
}
