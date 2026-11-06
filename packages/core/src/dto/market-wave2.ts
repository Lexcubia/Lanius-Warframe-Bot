import { z } from 'zod';

import { LocalizedNameSchema } from './worldstate.js';
import { MARKET_ORDERS_PAGE_SIZE } from './market.js';

/**
 * 杜卡德垃圾档位（金/银/铜对应 WM ducats 面值）。
 */
export const DucatTierSchema = z.enum(['gold', 'silver', 'bronze']);

/**
 * 杜卡德垃圾档位。
 */
export type DucatTier = z.infer<typeof DucatTierSchema>;

/**
 * 档位 → 杜卡德面值集合（与 SDJK / WM 网页一致）。
 */
export const DUCAT_TIER_VALUES: Readonly<Record<DucatTier, readonly number[]>> = {
  gold: [100],
  silver: [65, 45],
  bronze: [25, 15],
};

/**
 * 杜卡德垃圾榜单行。
 */
export const DucatJunkRowSchema = z.object({
  urlName: z.string().min(1),
  name: LocalizedNameSchema,
  ducats: z.number().int().nonnegative(),
  /** 杜卡德/白金（按最低价） */
  ducatsPerPlatinum: z.number().nonnegative(),
  /** 加权均价白金 */
  waPrice: z.number().nonnegative(),
  median: z.number().nonnegative(),
  volume: z.number().int().nonnegative(),
});

/**
 * 杜卡德垃圾行。
 */
export type DucatJunkRow = z.infer<typeof DucatJunkRowSchema>;

/**
 * `GET /v1/market/ducats` 结果。
 */
export const DucatJunkDtoSchema = z.object({
  tier: DucatTierSchema,
  page: z.number().int().positive(),
  pageSize: z.number().int().positive().max(MARKET_ORDERS_PAGE_SIZE),
  total: z.number().int().nonnegative(),
  rows: z.array(DucatJunkRowSchema),
  updatedAt: z.string().datetime(),
});

/**
 * 杜卡德垃圾 DTO。
 */
export type DucatJunkDto = z.infer<typeof DucatJunkDtoSchema>;

/**
 * 杜卡德查询参数。
 */
export const DucatJunkQuerySchema = z.object({
  tier: DucatTierSchema.default('gold'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(MARKET_ORDERS_PAGE_SIZE)
    .default(MARKET_ORDERS_PAGE_SIZE),
});

/**
 * 价格趋势摘要。
 */
export const MarketTrendSummarySchema = z.object({
  vol48: z.number().nonnegative(),
  vol90: z.number().nonnegative(),
  median48: z.number().nullable(),
  median90: z.number().nullable(),
  last: z.number().nullable(),
  base: z.number().nullable(),
  baseSpan: z.enum(['48h', '90d']),
  /** 相对基线涨跌百分比；无基线时 null */
  changePct: z.number().nullable(),
});

/**
 * 趋势点。
 */
export const MarketTrendPointSchema = z.object({
  t: z.string(),
  volume: z.number().nonnegative(),
  median: z.number().nullable(),
  avg: z.number().nullable(),
  min: z.number().nullable(),
  max: z.number().nullable(),
  modRank: z.number().int().nonnegative().nullable(),
});

/**
 * `GET /v1/market/trend` 结果。
 */
export const MarketTrendDtoSchema = z.object({
  query: z.string(),
  resolved: z.object({
    urlName: z.string().min(1),
    name: LocalizedNameSchema,
    iconUrl: z.string().url().optional(),
  }),
  h48: z.array(MarketTrendPointSchema),
  d90: z.array(MarketTrendPointSchema),
  summary: MarketTrendSummarySchema,
  updatedAt: z.string().datetime(),
});

/**
 * 价格趋势 DTO。
 */
export type MarketTrendDto = z.infer<typeof MarketTrendDtoSchema>;

/**
 * 趋势查询参数。
 */
export const MarketTrendQuerySchema = z.object({
  q: z.string().trim().min(1),
});

/**
 * 市场排行分类。
 */
export const MarketRankCategorySchema = z.enum([
  'all',
  'warframe',
  'primary',
  'secondary',
  'melee',
  'mod',
  'arcane',
  'part',
  'relic',
]);

/**
 * 市场排行分类。
 */
export type MarketRankCategory = z.infer<typeof MarketRankCategorySchema>;

/**
 * 排行榜行。
 */
export const MarketRankRowSchema = z.object({
  urlName: z.string().min(1),
  name: LocalizedNameSchema,
  median48: z.number().nonnegative(),
  min48: z.number().nullable(),
  max48: z.number().nullable(),
  vol48: z.number().nonnegative(),
  vol90: z.number().nonnegative(),
});

/**
 * `GET /v1/market/rank` 结果。
 */
export const MarketRankDtoSchema = z.object({
  category: MarketRankCategorySchema,
  page: z.number().int().positive(),
  pageSize: z.number().int().positive().max(MARKET_ORDERS_PAGE_SIZE),
  total: z.number().int().nonnegative(),
  rows: z.array(MarketRankRowSchema),
  /** 是否为抽样缓存（非全站爬取） */
  sampled: z.boolean(),
  updatedAt: z.string().datetime(),
});

/**
 * 市场排行 DTO。
 */
export type MarketRankDto = z.infer<typeof MarketRankDtoSchema>;

/**
 * 排行查询参数。
 */
export const MarketRankQuerySchema = z.object({
  category: MarketRankCategorySchema.default('all'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(MARKET_ORDERS_PAGE_SIZE)
    .default(MARKET_ORDERS_PAGE_SIZE),
});
