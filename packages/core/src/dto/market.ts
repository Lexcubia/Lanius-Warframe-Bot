import { z } from 'zod';

import { LocalizedNameSchema } from './worldstate.js';

/**
 * 卖家在线状态过滤（行情排行榜固定保留项）。
 */
export const MarketSellerStatusSchema = z.enum(['online', 'ingame']);

/**
 * 卖家在线状态。
 */
export type MarketSellerStatus = z.infer<typeof MarketSellerStatusSchema>;

/**
 * 模糊锁定后的物品 / 武器目标。
 */
export const MarketResolvedTargetSchema = z.object({
  urlName: z.string().min(1),
  name: LocalizedNameSchema,
});

/**
 * 锁定目标 DTO。
 */
export type MarketResolvedTarget = z.infer<typeof MarketResolvedTargetSchema>;

/**
 * 单条市场卖单（在线/游戏中）。
 */
export const MarketListingDtoSchema = z.object({
  /** 白金单价 */
  platinum: z.number().nonnegative(),
  /** 数量 */
  quantity: z.number().int().positive(),
  /** 模组等级；非模组物品为 null */
  modRank: z.number().int().nonnegative().nullable(),
  /** 卖家游戏内名 */
  seller: z.string().min(1),
  /** 卖家状态（已过滤为 online|ingame） */
  status: MarketSellerStatusSchema,
  /** 订单更新时间（ISO）；上游缺失时用生成时刻 */
  updatedAt: z.string().datetime(),
});

/**
 * 市场卖单行 DTO。
 */
export type MarketListingDto = z.infer<typeof MarketListingDtoSchema>;

/**
 * `GET /v1/market/items` 单目标卖单分页结果。
 */
export const MarketOrdersDtoSchema = z.object({
  /** 原始查询串 */
  query: z.string(),
  /** 模糊锁定的唯一目标 */
  resolved: MarketResolvedTargetSchema,
  /** 当前页（从 1 起） */
  page: z.number().int().positive(),
  /** 每页条数（固定 ≤10） */
  pageSize: z.number().int().positive().max(10),
  /** 过滤后卖单总数 */
  total: z.number().int().nonnegative(),
  /** 本页卖单 */
  orders: z.array(MarketListingDtoSchema),
  /** 固定状态过滤说明 */
  statusFilter: z.literal('online|ingame'),
  /** 固定排序说明 */
  sort: z.literal('price_asc'),
  /** 可选模组等级过滤；未指定为 null */
  modRank: z.number().int().nonnegative().nullable(),
  updatedAt: z.string().datetime(),
});

/**
 * 市场卖单分页 DTO。
 */
export type MarketOrdersDto = z.infer<typeof MarketOrdersDtoSchema>;

/**
 * 紫卡属性一行（正/负词条）。
 */
export const RivenAttributeDtoSchema = z.object({
  /** 属性 url_name（如 critical_chance） */
  urlName: z.string().min(1),
  /** 展示名（优先中文索引；否则 url_name） */
  name: LocalizedNameSchema,
  /** 数值 */
  value: z.number(),
  /** 是否正向词条 */
  positive: z.boolean(),
});

/**
 * 紫卡属性 DTO。
 */
export type RivenAttributeDto = z.infer<typeof RivenAttributeDtoSchema>;

/**
 * 单条在线紫卡拍卖。
 */
export const RivenListingDtoSchema = z.object({
  /** 白金价（买断优先，否则起拍/最高出价） */
  platinum: z.number().nonnegative(),
  /** 词条列表 */
  attributes: z.array(RivenAttributeDtoSchema),
  /** 段位需求 */
  mastery: z.number().int().nonnegative(),
  /** 紫卡等级 */
  rank: z.number().int().nonnegative(),
  /** 循环次数 */
  rerolls: z.number().int().nonnegative(),
  /** 极性 url_name（可空） */
  polarity: z.string().nullable(),
  /** 卖家游戏内名 */
  seller: z.string().min(1),
  /** 卖家状态 */
  status: MarketSellerStatusSchema,
  updatedAt: z.string().datetime(),
});

/**
 * 紫卡拍卖行 DTO。
 */
export type RivenListingDto = z.infer<typeof RivenListingDtoSchema>;

/**
 * `GET /v1/riven` 单武器拍卖分页结果。
 */
export const RivenOrdersDtoSchema = z.object({
  query: z.string(),
  resolved: MarketResolvedTargetSchema,
  page: z.number().int().positive(),
  pageSize: z.number().int().positive().max(10),
  total: z.number().int().nonnegative(),
  orders: z.array(RivenListingDtoSchema),
  statusFilter: z.literal('online|ingame'),
  sort: z.literal('price_asc'),
  /** 可选紫卡等级过滤 */
  rank: z.number().int().nonnegative().nullable(),
  /** 可选段位过滤 */
  mastery: z.number().int().nonnegative().nullable(),
  /** 可选最小循环 */
  minRerolls: z.number().int().nonnegative().nullable(),
  /** 可选最大循环 */
  maxRerolls: z.number().int().nonnegative().nullable(),
  updatedAt: z.string().datetime(),
});

/**
 * 紫卡拍卖分页 DTO。
 */
export type RivenOrdersDto = z.infer<typeof RivenOrdersDtoSchema>;

/**
 * 行情排行榜默认每页条数（亦为上限）。
 */
export const MARKET_ORDERS_PAGE_SIZE = 10;

/**
 * `GET /v1/market/items` 查询参数（路由层 coerce）。
 */
export const MarketOrdersQuerySchema = z.object({
  q: z.string().trim().min(1),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(MARKET_ORDERS_PAGE_SIZE)
    .default(MARKET_ORDERS_PAGE_SIZE),
  modRank: z.coerce.number().int().min(0).optional(),
});

/**
 * 市场卖单查询参数。
 */
export type MarketOrdersQuery = z.infer<typeof MarketOrdersQuerySchema>;

/**
 * `GET /v1/riven` 查询参数。
 */
export const RivenOrdersQuerySchema = z.object({
  q: z.string().trim().min(1),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(MARKET_ORDERS_PAGE_SIZE)
    .default(MARKET_ORDERS_PAGE_SIZE),
  rank: z.coerce.number().int().min(0).optional(),
  mastery: z.coerce.number().int().min(0).optional(),
  minRerolls: z.coerce.number().int().min(0).optional(),
  maxRerolls: z.coerce.number().int().min(0).optional(),
});

/**
 * 紫卡拍卖查询参数。
 */
export type RivenOrdersQuery = z.infer<typeof RivenOrdersQuerySchema>;

/**
 * @deprecated 旧多物品摘要；请改用 {@link MarketOrdersDtoSchema}。
 * 保留 schema 名别名以免外部草稿引用瞬间断裂（同结构已切换为订单页）。
 */
export const MarketSearchDtoSchema = MarketOrdersDtoSchema;

/**
 * @deprecated 使用 {@link MarketOrdersDto}。
 */
export type MarketSearchDto = MarketOrdersDto;

/**
 * @deprecated 使用 {@link RivenOrdersDtoSchema}。
 */
export const RivenSearchDtoSchema = RivenOrdersDtoSchema;

/**
 * @deprecated 使用 {@link RivenOrdersDto}。
 */
export type RivenSearchDto = RivenOrdersDto;
