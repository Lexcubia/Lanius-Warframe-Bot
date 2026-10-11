import { z } from 'zod';

import { CatalogItemDtoSchema } from './item.js';
import { LocalizedNameSchema } from './worldstate.js';

/**
 * 商人货架单品（含官方图标字段）。
 */
export const TraderItemDtoSchema = CatalogItemDtoSchema.extend({
  ducats: z.number().int().nonnegative().optional(),
  credits: z.number().int().nonnegative().optional(),
});

/**
 * 商人货架单品。
 */
export type TraderItemDto = z.infer<typeof TraderItemDtoSchema>;

/**
 * 虚空商人（Baro）快照。
 */
export const VoidTraderDtoSchema = z.object({
  character: LocalizedNameSchema,
  node: LocalizedNameSchema,
  active: z.boolean(),
  activation: z.string().datetime(),
  expiry: z.string().datetime(),
  remainingMs: z.number().int().nonnegative(),
  inventory: z.array(TraderItemDtoSchema),
  fetchedAt: z.string().datetime(),
});

/**
 * 虚空商人 DTO。
 */
export type VoidTraderDto = z.infer<typeof VoidTraderDtoSchema>;

/**
 * 瓦奇娅（Prime Vault）快照。
 */
export const VarziaDtoSchema = z.object({
  character: LocalizedNameSchema,
  active: z.boolean(),
  activation: z.string().datetime().optional(),
  expiry: z.string().datetime().optional(),
  remainingMs: z.number().int().nonnegative().optional(),
  inventory: z.array(TraderItemDtoSchema),
  fetchedAt: z.string().datetime(),
});

/**
 * 瓦奇娅 DTO。
 */
export type VarziaDto = z.infer<typeof VarziaDtoSchema>;

/**
 * 信条 / 终幕商店常见 Valence 元素键（与游戏 progenitor 表对齐）。
 */
export const ValenceElementSchema = z.enum([
  'impact',
  'heat',
  'cold',
  'electricity',
  'toxin',
  'magnetic',
  'radiation',
]);

/**
 * Valence 元素键。
 */
export type ValenceElement = z.infer<typeof ValenceElementSchema>;

/**
 * 轮换档中的单把武器（图标 + 可选 Valence 元素/百分比）。
 */
export const RotationWeaponDtoSchema = CatalogItemDtoSchema.extend({
  /** Valence 元素键；缺省表示轮换表未配置 */
  element: ValenceElementSchema.optional(),
  /** Valence 元素双语名 */
  elementLabel: LocalizedNameSchema.optional(),
  /**
   * 可选元素图标 URL（一般由客户端按 `element` 使用本地资产；
   * 武器图标请用 CatalogItem 的 `iconUrl` 官方 PublicExport CDN）。
   */
  elementIconUrl: z.string().min(1).optional(),
  /** Valence 加成百分比（通常 25–60，一位小数） */
  bonusPct: z.number().nonnegative().max(100).optional(),
});

/**
 * 轮换武器条目。
 */
export type RotationWeaponDto = z.infer<typeof RotationWeaponDtoSchema>;

/**
 * Valence 加成百分比上限（游戏内商店随机区间上沿，进度条按此归一）。
 */
export const VALENCE_BONUS_MAX_PCT = 60;

/**
 * 武器轮换档（信条 / 终幕商店货架）。
 * `offerings` 为当前档全部武器（平级，无「当前/后续」主次）。
 */
export const WeaponRotationDtoSchema = z.object({
  kind: z.enum(['tenet', 'coda']),
  /** 当前档货架（Ergo Glast / Eleanor 当期全部可购武器） */
  offerings: z.array(RotationWeaponDtoSchema).min(1),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  remainingMs: z.number().int().nonnegative(),
  fetchedAt: z.string().datetime(),
});

/**
 * 武器轮换 DTO。
 */
export type WeaponRotationDto = z.infer<typeof WeaponRotationDtoSchema>;
