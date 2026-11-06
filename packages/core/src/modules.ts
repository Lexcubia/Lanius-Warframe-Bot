import { z } from 'zod';

/**
 * Lanius 功能模块稳定 id（开关 / ACL / 帮助 / 审计 / 订阅共用）。
 *
 * Wave 0 起：除已上线指令外，预留 SDJK 复刻后续波次的 ModuleId（见 `RESERVED_MODULE_IDS`）。
 * 预留 id **不进** `LANIUS_COMMAND_CATALOG`，避免无 handler 的空路由；实现后再迁入门禁并挂目录。
 * Wave1 / Wave2 / Wave3 均已上线（并从 RESERVED 移除）。
 * Wave4：推送可订阅集见 `SubscribableModuleIdSchema` / `SDJK_PUSH_EVENT_MAP`（指令仍为 `/订阅`）。
 */
export const ModuleIdSchema = z.enum([
  // —— 已上线 ——
  'worldstate',
  'fissures',
  'invasions',
  'nightwave',
  'sortie',
  'archon',
  'circuit',
  'bounties',
  'arbitration',
  'alerts',
  'archimedea',
  'market',
  'riven',
  'voidTrader',
  'varzia',
  'tenetRotation',
  'codaRotation',
  'subscribe',
  'help',
  // —— Wave1：worldstate / 日常缺口（已上线）——
  'timers',
  'dailyDeals',
  'news',
  'kuva',
  'synthTargets',
  'construction',
  'voidStorms',
  'events',
  'conclave',
  'clanRewards',
  'flashSales',
  'arbTable',
  'calendar1999',
  'steelPath',
  'sliverShop',
  'descendia',
  'incursions',
  'incarnon',
  'acrithis',
  // —— Wave2：市场 / 紫卡 / 遗物（已上线）——
  'marketRank',
  'marketTrend',
  'ducats',
  'rivenAnalysis',
  'rivenRanges',
  'rivenSplice',
  'disposition',
  'lichAuctions',
  'relic',
  'parts',
  'openRelic',
  // —— Wave3：wiki / 翻译 / valence（已上线）——
  'wiki',
  'translate',
  'valence',
]);

/**
 * 功能模块 id。
 */
export type ModuleId = z.infer<typeof ModuleIdSchema>;

/**
 * SDJK→Lanius 复刻预留 ModuleId（尚无 Bot 目录 / handler）。
 * Wave1 / Wave2 / Wave3 均已迁出并挂 catalog；当前无未用预留 stub。
 */
export const RESERVED_MODULE_IDS = [] as const satisfies readonly ModuleId[];

/**
 * 默认可被 ACL / 开关管控的模块（仅已上线、有指令目录的模块）。
 * 回复模式与卡片皮肤由后台 `bot.defaultReplyMode` / `bot.defaultCardSkin` 配置，不作为用户指令模块。
 * 预留 id 见 `RESERVED_MODULE_IDS`，实现 handler 后再迁入本列表并挂 catalog。
 */
export const GATED_MODULE_IDS = [
  'worldstate',
  'fissures',
  'invasions',
  'nightwave',
  'sortie',
  'archon',
  'circuit',
  'bounties',
  'arbitration',
  'alerts',
  'archimedea',
  'market',
  'riven',
  'marketRank',
  'marketTrend',
  'ducats',
  'rivenAnalysis',
  'rivenRanges',
  'rivenSplice',
  'disposition',
  'lichAuctions',
  'relic',
  'parts',
  'openRelic',
  'voidTrader',
  'varzia',
  'tenetRotation',
  'codaRotation',
  'subscribe',
  'help',
  // SDJK Wave1
  'timers',
  'dailyDeals',
  'news',
  'kuva',
  'synthTargets',
  'construction',
  'voidStorms',
  'events',
  'conclave',
  'clanRewards',
  'flashSales',
  'arbTable',
  'calendar1999',
  'steelPath',
  'sliverShop',
  'descendia',
  'incursions',
  'incarnon',
  'acrithis',
  // SDJK Wave3
  'wiki',
  'translate',
  'valence',
] as const satisfies readonly ModuleId[];
