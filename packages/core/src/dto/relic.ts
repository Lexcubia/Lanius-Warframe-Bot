import { z } from 'zod';

import { LocalizedNameSchema } from './worldstate.js';
import { MARKET_ORDERS_PAGE_SIZE } from './market.js';

/**
 * 遗物奖励稀有度。
 */
export const RelicRaritySchema = z.enum(['common', 'uncommon', 'rare']);

/**
 * 遗物奖励稀有度。
 */
export type RelicRarity = z.infer<typeof RelicRaritySchema>;

/**
 * 遗物奖励槽。
 */
export const RelicRewardSlotSchema = z.object({
  rarity: RelicRaritySchema,
  itemName: z.string().min(1),
});

/**
 * 遗物详情 / 列表条目。
 */
export const RelicDtoSchema = z.object({
  key: z.string().min(1),
  name: LocalizedNameSchema,
  era: z.string().optional(),
  rewards: z.array(RelicRewardSlotSchema).optional(),
});

/**
 * `GET /v1/relic` 结果（单遗物或纪元列表）。
 */
export const RelicQueryDtoSchema = z.object({
  query: z.string(),
  mode: z.enum(['relic', 'tierList', 'help']),
  relic: RelicDtoSchema.optional(),
  list: z.array(RelicDtoSchema).optional(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive().max(MARKET_ORDERS_PAGE_SIZE),
  total: z.number().int().nonnegative(),
  updatedAt: z.string().datetime(),
});

/**
 * 遗物查询 DTO。
 */
export type RelicQueryDto = z.infer<typeof RelicQueryDtoSchema>;

/**
 * 部件来源行。
 */
export const PartSourceRowSchema = z.object({
  relicKey: z.string(),
  relicName: LocalizedNameSchema,
  rarity: RelicRaritySchema,
});

/**
 * `GET /v1/parts` 结果。
 */
export const PartsDtoSchema = z.object({
  query: z.string(),
  partName: z.string(),
  sources: z.array(PartSourceRowSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive().max(MARKET_ORDERS_PAGE_SIZE),
  total: z.number().int().nonnegative(),
  updatedAt: z.string().datetime(),
});

/**
 * 部件来源 DTO。
 */
export type PartsDto = z.infer<typeof PartsDtoSchema>;

/**
 * 开核桃推荐行。
 */
export const OpenRelicRowSchema = z.object({
  era: z.string(),
  eraZh: z.string(),
  fissureCount: z.number().int().nonnegative(),
  /** 速刷裂隙数（歼灭/捕获等） */
  fastCount: z.number().int().nonnegative(),
  sampleNodes: z.array(z.string()),
});

/**
 * `GET /v1/open-relic` 结果。
 */
export const OpenRelicDtoSchema = z.object({
  rows: z.array(OpenRelicRowSchema),
  note: z.string(),
  updatedAt: z.string().datetime(),
});

/**
 * 开核桃 DTO。
 */
export type OpenRelicDto = z.infer<typeof OpenRelicDtoSchema>;
