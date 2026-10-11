import {
  assembleBotConfig,
  getConfigDriver,
  type AssembledBotConfig,
} from '@lanius/config';
import { resolve } from 'node:path';

/**
 * Bot 配置（由 `@lanius/config` 组装）。
 */
export type BotConfig = AssembledBotConfig;

/**
 * 从配置驱动加载 Bot 配置。
 *
 * @param cwd - 工作目录（用于探测仓库根）
 * @returns Bot 配置
 */
export function loadBotConfig(cwd: string = process.cwd()): BotConfig {
  const repoRoot = resolveRepoRoot(cwd);
  const driver = getConfigDriver({ repoRoot });
  return assembleBotConfig(driver);
}

/**
 * 非密钥环境覆盖（Docker 服务发现）。
 *
 * @param config - 已组装配置
 * @returns 覆盖后配置
 */
export function applyBotEnvOverrides(config: BotConfig): BotConfig {
  const apiBase = process.env.LANIUS_API_BASE?.trim();
  const siteBase = process.env.PUBLIC_SITE_BASE_URL?.trim();
  const panelStore = process.env.LANIUS_PANEL_ID_STORE?.trim();
  if (!apiBase && !siteBase && !panelStore) {
    return config;
  }
  return {
    ...config,
    bot: {
      ...config.bot,
      ...(apiBase ? { apiBaseUrl: apiBase } : {}),
      ...(siteBase ? { publicSiteBaseUrl: siteBase } : {}),
      ...(panelStore ? { panelIdStorePath: panelStore } : {}),
    },
  };
}

/**
 * 当进程 cwd 为 `apps/bot` 时解析 monorepo 根目录。
 *
 * @param cwd - 当前工作目录
 * @returns 仓库根目录绝对路径
 */
export function resolveRepoRoot(cwd: string = process.cwd()): string {
  if (cwd.replace(/\\/g, '/').endsWith('/apps/bot')) {
    return resolve(cwd, '../..');
  }
  return cwd;
}
