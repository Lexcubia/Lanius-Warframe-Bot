import { z } from 'zod';

import { ModuleIdSchema, type ModuleId } from '../modules.js';

/**
 * 推送频率：变更时 / 每小时 / 每天 / 每周。
 */
export const PushFrequencySchema = z.enum(['on_change', 'hourly', 'daily', 'weekly']);

/**
 * 推送频率。
 */
export type PushFrequency = z.infer<typeof PushFrequencySchema>;

/**
 * 当前已开放订阅推送的模块（查询模块的子集）。
 * Wave 4：对齐 SDJK `PUSH_EVENTS` 中已有 Lanius ModuleId 的事件集；
 * 开放世界周期（夜灵/山谷/魔胎/地球/双衍）挂在 `worldstate`，用 `filterArgs` 区分。
 */
export const SubscribableModuleIdSchema = z.enum([
  'fissures',
  'worldstate',
  'voidTrader',
  'sortie',
  'archon',
  'arbitration',
  'incursions',
  'alerts',
  'invasions',
  'news',
  'dailyDeals',
  'events',
  'calendar1999',
  'incarnon',
  'tenetRotation',
  'codaRotation',
  'steelPath',
  'sliverShop',
  'bounties',
  'varzia',
  'nightwave',
]);

/**
 * 可订阅模块 id。
 */
export type SubscribableModuleId = z.infer<typeof SubscribableModuleIdSchema>;

/**
 * Wave 4 已将 SDJK 推送事件集迁入 `SubscribableModuleIdSchema`；本列表清空。
 * 若后续再预留未接线事件，可往此数组追加（须同时是 `ModuleId`）。
 */
export const RESERVED_SUBSCRIBABLE_MODULE_IDS = [] as const satisfies readonly ModuleId[];

/**
 * 开放世界周期筛选键（`worldstate` 订阅的 `filterArgs`）。
 * 对齐 SDJK：夜灵/山谷/魔胎/地球/双衍；扎里曼未进 SDJK PUSH_EVENTS，不作为订阅键。
 */
export const WorldstateCycleFilterSchema = z.enum([
  'cetus',
  'vallis',
  'cambion',
  'earth',
  'duviri',
]);

/**
 * 开放世界周期筛选键。
 */
export type WorldstateCycleFilter = z.infer<typeof WorldstateCycleFilterSchema>;

/**
 * SDJK「蹲」事件中文名 → Lanius `moduleId` + 可选 `filterArgs`。
 * 指令仍为 `/订阅`，不复刻「蹲」语法；本表供解析别名与文档对照。
 */
export const SDJK_PUSH_EVENT_MAP = {
  裂隙: { moduleId: 'fissures', filterArgs: null },
  夜灵: { moduleId: 'worldstate', filterArgs: 'cetus' },
  山谷: { moduleId: 'worldstate', filterArgs: 'vallis' },
  魔胎: { moduleId: 'worldstate', filterArgs: 'cambion' },
  地球: { moduleId: 'worldstate', filterArgs: 'earth' },
  双衍: { moduleId: 'worldstate', filterArgs: 'duviri' },
  奸商: { moduleId: 'voidTrader', filterArgs: null },
  突击: { moduleId: 'sortie', filterArgs: null },
  执刑官: { moduleId: 'archon', filterArgs: null },
  仲裁: { moduleId: 'arbitration', filterArgs: null },
  钢路侵袭: { moduleId: 'incursions', filterArgs: null },
  警报: { moduleId: 'alerts', filterArgs: null },
  入侵: { moduleId: 'invasions', filterArgs: null },
  新闻: { moduleId: 'news', filterArgs: null },
  每日特惠: { moduleId: 'dailyDeals', filterArgs: null },
  活动: { moduleId: 'events', filterArgs: null },
  '1999日历': { moduleId: 'calendar1999', filterArgs: null },
  灵化武器: { moduleId: 'incarnon', filterArgs: null },
  信条: { moduleId: 'tenetRotation', filterArgs: null },
  终幕: { moduleId: 'codaRotation', filterArgs: null },
  钢精兑换: { moduleId: 'steelPath', filterArgs: null },
  碎银兑换: { moduleId: 'sliverShop', filterArgs: null },
  赏金: { moduleId: 'bounties', filterArgs: null },
  阿耶兑换: { moduleId: 'varzia', filterArgs: null },
  电波: { moduleId: 'nightwave', filterArgs: null },
} as const satisfies Record<
  string,
  { moduleId: SubscribableModuleId; filterArgs: WorldstateCycleFilter | null }
>;

/**
 * SDJK 推送事件中文名。
 */
export type SdjkPushEventName = keyof typeof SDJK_PUSH_EVENT_MAP;

/**
 * 单条订阅。
 * `filterArgs`：裂隙/仲裁/赏金等筛选原文，或 `worldstate` 的周期键；无筛选时为 `null`。
 */
export const SubscriptionDtoSchema = z.object({
  id: z.number().int().positive(),
  scene: z.enum(['group', 'c2c']),
  targetId: z.string().min(1),
  moduleId: SubscribableModuleIdSchema,
  /** 可选筛选原文（空串在存储层；对外 DTO 用 null） */
  filterArgs: z.string().min(1).nullable().default(null),
  enabled: z.boolean(),
  frequency: PushFrequencySchema,
  lastPushedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

/**
 * 订阅 DTO。
 */
export type SubscriptionDto = z.infer<typeof SubscriptionDtoSchema>;

/**
 * 推送下行条目（API tick → bot 发送）。
 */
export const PushDispatchDtoSchema = z.object({
  subscriptionId: z.number().int().positive(),
  scene: z.enum(['group', 'c2c']),
  targetId: z.string().min(1),
  moduleId: ModuleIdSchema,
  text: z.string().min(1),
});

/**
 * 推送下行 DTO。
 */
export type PushDispatchDto = z.infer<typeof PushDispatchDtoSchema>;
