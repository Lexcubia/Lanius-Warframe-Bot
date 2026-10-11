import type { ConfigDriver } from './driver.js';
import type { ModuleConfigMap } from './modules.js';

/**
 * API 进程聚合视图（兼容旧 AppConfig 形状）。
 */
export type AssembledApiConfig = {
  qq: ModuleConfigMap['qq'];
  admin: ModuleConfigMap['admin'];
  api: ModuleConfigMap['api'];
  redis: ModuleConfigMap['redis'];
  database: ModuleConfigMap['database'];
  defaults: ModuleConfigMap['defaults'];
};

/**
 * Bot 进程聚合视图（兼容旧 BotConfig 形状）。
 */
export type AssembledBotConfig = {
  qq: ModuleConfigMap['qq'];
  api: { adminToken?: string };
  bot: ModuleConfigMap['bot'];
  defaults: Pick<ModuleConfigMap['defaults'], 'realm' | 'locale'>;
};

/**
 * 从驱动组装 API 侧配置。
 *
 * @param driver - 配置驱动
 * @returns 聚合配置
 */
export function assembleApiConfig(driver: ConfigDriver): AssembledApiConfig {
  return {
    qq: driver.get('qq'),
    admin: driver.get('admin'),
    api: driver.get('api'),
    redis: driver.get('redis'),
    database: driver.get('database'),
    defaults: driver.get('defaults'),
  };
}

/**
 * 从驱动组装 Bot 侧配置，并应用非密钥环境覆盖。
 *
 * @param driver - 配置驱动
 * @returns 聚合配置
 */
export function assembleBotConfig(driver: ConfigDriver): AssembledBotConfig {
  const bot = { ...driver.get('bot') };
  const apiBase = process.env.LANIUS_API_BASE?.trim();
  const siteBase = process.env.PUBLIC_SITE_BASE_URL?.trim();
  const panelStore = process.env.LANIUS_PANEL_ID_STORE?.trim();
  if (apiBase) bot.apiBaseUrl = apiBase;
  if (siteBase) bot.publicSiteBaseUrl = siteBase;
  if (panelStore) bot.panelIdStorePath = panelStore;

  const defaults = driver.get('defaults');
  return {
    qq: driver.get('qq'),
    api: { adminToken: driver.get('api').adminToken },
    bot,
    defaults: { realm: defaults.realm, locale: defaults.locale },
  };
}
