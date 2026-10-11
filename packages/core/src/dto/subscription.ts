import { z } from 'zod';

import { ModuleIdSchema } from '../modules.js';

/**
 * 推送频率：变更时 / 每小时 / 每天 / 每周。
 */
export const PushFrequencySchema = z.enum([
  'on_change',
  'hourly',
  'daily',
  'weekly',
]);

/**
 * 推送频率。
 */
export type PushFrequency = z.infer<typeof PushFrequencySchema>;

/**
 * 可订阅推送的模块（查询模块的子集）。
 */
export const SubscribableModuleIdSchema = z.enum([
  'fissures',
  'voidTrader',
  'varzia',
  'tenetRotation',
  'codaRotation',
]);

/**
 * 可订阅模块 id。
 */
export type SubscribableModuleId = z.infer<typeof SubscribableModuleIdSchema>;

/**
 * 单条订阅。
 */
export const SubscriptionDtoSchema = z.object({
  id: z.number().int().positive(),
  scene: z.enum(['group', 'c2c']),
  targetId: z.string().min(1),
  moduleId: SubscribableModuleIdSchema,
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
