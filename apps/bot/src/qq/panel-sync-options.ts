import type { SyncQqCommandPanelsOptions } from '@lanius/qq-official';
import type { AccessTokenCache } from '@lanius/qq-official';

import type { BotConfig } from '../config.js';
import { buildQqPanelItems } from './build-panel-items.js';

/**
 * 组装同步指令面板所需的 OpenAPI 选项（含已知 panel_id 与本地持久化路径）。
 *
 * @param config - Bot 配置
 * @param cache - 与发信共用的 token 缓存
 * @returns `syncQqCommandPanels` / `ensureQqGroupCommandPanel` 公共字段
 */
export function buildQqPanelSyncOptions(
  config: BotConfig,
  cache: { current?: AccessTokenCache },
): Omit<SyncQqCommandPanelsOptions, 'groupOpenid'> {
  const storePath =
    config.bot.panelIdStorePath?.trim() ||
    process.env.LANIUS_PANEL_ID_STORE?.trim() ||
    undefined;
  return {
    appId: config.qq.appId,
    appSecret: config.qq.appSecret,
    cache,
    items: buildQqPanelItems(),
    knownPanelIds: {
      c2c: config.qq.panelIds?.c2c?.trim() || undefined,
      group: config.qq.panelIds?.group?.trim() || undefined,
    },
    panelIdStorePath: storePath,
  };
}
