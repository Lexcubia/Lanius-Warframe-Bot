import { z } from 'zod';

/**
 * 双语显示名（与 worldstate 中 LocalizedName 同形，避免循环依赖）。
 */
const ItemNameSchema = z.object({
  zh: z.string(),
  en: z.string(),
});

/**
 * 带官方图标的可展示物品引用（商人货架、入侵奖励等共用）。
 * `iconUrl` 指向 `content.warframe.com/PublicExport` 官方 CDN。
 */
export const CatalogItemDtoSchema = z.object({
  name: ItemNameSchema,
  /** 上游 ItemType / uniqueName，如 `/Lotus/Types/...` */
  uniqueName: z.string().min(1).optional(),
  /** PublicExport 图标相对路径（不含 CDN 主机与 contentHash） */
  iconPath: z.string().min(1).optional(),
  /** 官方 CDN 完整图标 URL */
  iconUrl: z.string().url().optional(),
  /**
   * 堆叠数量（如入侵奖励 `ItemCount`）。
   * 缺省或 `1` 时客户端可只显示名称；大于 1 时应展示数量。
   */
  quantity: z.number().int().positive().optional(),
});

/**
 * 带官方图标的物品引用。
 */
export type CatalogItemDto = z.infer<typeof CatalogItemDtoSchema>;
