import { z } from 'zod';

import { LocalizedNameSchema } from './worldstate.js';
import { MARKET_ORDERS_PAGE_SIZE, MarketSellerStatusSchema } from './market.js';

/**
 * 紫卡词条分析行。
 */
export const RivenStatAnalysisDtoSchema = z.object({
  id: z.string().min(1),
  name: LocalizedNameSchema,
  value: z.number(),
  positive: z.boolean(),
  lo: z.number(),
  hi: z.number(),
  deviationPct: z.number(),
  positionPct: z.number(),
});

/**
 * 紫卡分析结果。
 */
export const RivenAnalysisDtoSchema = z.object({
  query: z.string(),
  weapon: z
    .object({
      urlName: z.string().optional(),
      name: LocalizedNameSchema,
      cls: z.enum(['rifle', 'shotgun', 'pistol', 'archgun', 'melee']),
      disposition: z.number().positive(),
      /** 表内旧倾向；仅展示 */
      legacyDisposition: z.number().positive().nullable().optional(),
    })
    .optional(),
  dispositionUsed: z.number().positive(),
  stats: z.array(RivenStatAnalysisDtoSchema),
  notes: z.array(z.string()),
  /** 输入来源：text / lines（识图 OCR 行） */
  source: z.enum(['text', 'lines']),
  updatedAt: z.string().datetime(),
});

/**
 * 紫卡分析 DTO。
 */
export type RivenAnalysisDto = z.infer<typeof RivenAnalysisDtoSchema>;

/**
 * 紫卡分析请求体 / 查询。
 */
export const RivenAnalysisQuerySchema = z.object({
  /** 自由文本（武器 + 词条数值） */
  text: z.string().trim().optional(),
  /** OCR / 分行词条（每行一条） */
  lines: z.array(z.string()).optional(),
  /** 可选覆盖倾向 */
  disposition: z.coerce.number().positive().optional(),
  /** 可选武器类覆盖 */
  cls: z.enum(['rifle', 'shotgun', 'pistol', 'archgun', 'melee']).optional(),
});

/**
 * 词条范围 DTO。
 */
export const RivenRangesDtoSchema = z.object({
  query: z.string(),
  weapon: z
    .object({
      urlName: z.string().optional(),
      name: LocalizedNameSchema,
      cls: z.enum(['rifle', 'shotgun', 'pistol', 'archgun', 'melee']),
    })
    .optional(),
  cls: z.enum(['rifle', 'shotgun', 'pistol', 'archgun', 'melee']),
  disposition: z.number().positive(),
  positives: z.array(RivenStatAnalysisDtoSchema),
  negatives: z.array(RivenStatAnalysisDtoSchema),
  updatedAt: z.string().datetime(),
});

/**
 * 词条范围 DTO。
 */
export type RivenRangesDto = z.infer<typeof RivenRangesDtoSchema>;

/**
 * 融合配方行。
 */
export const RivenSpliceRecipeDtoSchema = z.object({
  a: LocalizedNameSchema,
  b: LocalizedNameSchema,
  result: LocalizedNameSchema,
  aId: z.string(),
  bId: z.string(),
  resultId: z.string(),
  classes: z.array(z.string()),
});

/**
 * 紫卡融合 DTO。
 */
export const RivenSpliceDtoSchema = z.object({
  query: z.string(),
  cls: z.enum(['rifle', 'shotgun', 'pistol', 'archgun', 'melee']).nullable(),
  recipes: z.array(RivenSpliceRecipeDtoSchema),
  updatedAt: z.string().datetime(),
});

/**
 * 紫卡融合 DTO。
 */
export type RivenSpliceDto = z.infer<typeof RivenSpliceDtoSchema>;

/**
 * 倾向查询行。
 */
export const DispositionRowSchema = z.object({
  urlName: z.string(),
  name: LocalizedNameSchema,
  /** 旧倾向（表内） */
  legacyDisposition: z.number().positive(),
  /** 现期统一倾向 */
  unifiedDisposition: z.literal(1.2),
  /** 缩放倍数 1.2/旧 */
  scale: z.number().positive(),
  cls: z.string().optional(),
});

/**
 * 倾向 DTO。
 */
export const DispositionDtoSchema = z.object({
  query: z.string(),
  rows: z.array(DispositionRowSchema),
  note: z.string(),
  updatedAt: z.string().datetime(),
});

/**
 * 倾向 DTO。
 */
export type DispositionDto = z.infer<typeof DispositionDtoSchema>;

/**
 * 玄骸拍卖行。
 */
export const LichListingDtoSchema = z.object({
  platinum: z.number().nonnegative(),
  element: z.string().nullable(),
  damage: z.number().nullable(),
  havingEphemera: z.boolean(),
  seller: z.string().min(1),
  sellerReputation: z.number().int().nonnegative(),
  status: MarketSellerStatusSchema,
  updatedAt: z.string().datetime(),
});

/**
 * 玄骸拍卖 DTO。
 */
export const LichAuctionsDtoSchema = z.object({
  query: z.string(),
  resolved: z.object({
    urlName: z.string(),
    name: LocalizedNameSchema,
    kind: z.enum(['lich', 'sister', 'coda']),
    /** WM 是否有该类目 */
    marketSupported: z.boolean(),
  }),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive().max(MARKET_ORDERS_PAGE_SIZE),
  total: z.number().int().nonnegative(),
  orders: z.array(LichListingDtoSchema),
  element: z.string().nullable(),
  damageMax: z.number().nullable(),
  updatedAt: z.string().datetime(),
});

/**
 * 玄骸拍卖 DTO。
 */
export type LichAuctionsDto = z.infer<typeof LichAuctionsDtoSchema>;

/**
 * 玄骸查询参数。
 */
export const LichAuctionsQuerySchema = z.object({
  q: z.string().trim().min(1),
  element: z.string().trim().optional(),
  damageMax: z.coerce.number().positive().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(MARKET_ORDERS_PAGE_SIZE)
    .default(MARKET_ORDERS_PAGE_SIZE),
});
