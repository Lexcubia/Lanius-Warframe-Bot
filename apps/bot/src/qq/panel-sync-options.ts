import type { AccessTokenCache, SyncQqCommandPanelsOptions } from '@lanius/qq-official';

import type { BotConfig } from '../config.js';
import { buildQqPanelItems } from './build-panel-items.js';

/**
 * 组装同步指令面板所需的 OpenAPI 选项。
 *
 * @param config - Bot 配置
 * @param cache - 与发信共用的 token 缓存
 * @returns `syncQqCommandPanels` / `ensureQqGroupCommandPanel` 公共字段
 */
export function buildQqPanelSyncOptions(
  config: BotConfig,
  cache: { current?: AccessTokenCache },
): SyncQqCommandPanelsOptions {
  return {
    appId: config.qq.appId,
    appSecret: config.qq.appSecret,
    cache,
    items: buildQqPanelItems(),
  };
}
