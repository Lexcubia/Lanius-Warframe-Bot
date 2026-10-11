import { z } from 'zod';

import { LocalizedNameSchema } from './worldstate.js';

/**
 * Warframe Market 物品行情摘要（经 Lanius 规范化）。
 */
export const MarketItemDtoSchema = z.object({
  urlName: z.string().min(1),
  name: LocalizedNameSchema,
  /** 在售最低白金价；无卖单时为 null */
  lowestSell: z.number().nonnegative().nullable(),
  /** 求购最高白金价；无买单时为 null */
  highestBuy: z.number().nonnegative().nullable(),
  volume: z.number().int().nonnegative().optional(),
  updatedAt: z.string().datetime(),
});

/**
 * 市场物品 DTO。
 */
export type MarketItemDto = z.infer<typeof MarketItemDtoSchema>;

/**
 * `GET /v1/market/items` 查询结果。
 */
export const MarketSearchDtoSchema = z.object({
  query: z.string(),
  items: z.array(MarketItemDtoSchema),
});

/**
 * 市场搜索 DTO。
 */
export type MarketSearchDto = z.infer<typeof MarketSearchDtoSchema>;

/**
 * 紫卡价位摘要（WFM auctions / 统计简化）。
 */
export const RivenSummaryDtoSchema = z.object({
  weaponUrlName: z.string().min(1),
  weaponName: LocalizedNameSchema,
  /** 样本中位白金；无数据时 null */
  medianPlatinum: z.number().nonnegative().nullable(),
  /** 样本最低白金 */
  minPlatinum: z.number().nonnegative().nullable(),
  /** 样本最高白金 */
  maxPlatinum: z.number().nonnegative().nullable(),
  sampleCount: z.number().int().nonnegative(),
  updatedAt: z.string().datetime(),
});

/**
 * 紫卡摘要 DTO。
 */
export type RivenSummaryDto = z.infer<typeof RivenSummaryDtoSchema>;

/**
 * `GET /v1/riven` 查询结果。
 */
export const RivenSearchDtoSchema = z.object({
  query: z.string(),
  results: z.array(RivenSummaryDtoSchema),
});

/**
 * 紫卡搜索 DTO。
 */
export type RivenSearchDto = z.infer<typeof RivenSearchDtoSchema>;
