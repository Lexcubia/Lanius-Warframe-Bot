import { z } from 'zod';

import { LocalizedNameSchema } from './worldstate.js';
import { ValenceElementSchema } from './traders.js';

/**
 * 灰机维基深链 / 短简介 DTO（**非**全文百科镜像）。
 */
export const WikiDtoSchema = z.object({
  /** 用户原始查询 */
  query: z.string().min(1),
  /** 是否命中可拼页面名（否则为搜索页） */
  found: z.boolean(),
  /** 展示用页面标题 */
  pageName: z.string().min(1),
  /** 可点击的灰机维基 URL（深链或搜索） */
  pageUrl: z.string().url(),
  /** 短简介行（属性摘要 / 名称对照等；无知识库时可为名称行） */
  lines: z.array(z.string()),
  /** 同类候选展示名 */
  alts: z.array(z.string()).default([]),
  /** 易混淆澄清（可选） */
  note: z.string().optional(),
  /** `page`=条目深链；`search`=搜索页兜底 */
  mode: z.enum(['page', 'search']),
});

/**
 * Wiki 深链 DTO。
 */
export type WikiDto = z.infer<typeof WikiDtoSchema>;

/**
 * 翻译查询中的单条双语对。
 */
export const TranslatePairSchema = z.object({
  en: z.string().min(1),
  zh: z.string().min(1),
});

/**
 * 中英名称翻译 DTO（PublicExport / 捆绑官方 language 同键对）。
 */
export const TranslateDtoSchema = z.object({
  query: z.string().min(1),
  direction: z.enum(['zh_to_en', 'en_to_zh']),
  hits: z.array(TranslatePairSchema),
  candidates: z.array(TranslatePairSchema),
});

/**
 * 翻译 DTO。
 */
export type TranslateDto = z.infer<typeof TranslateDtoSchema>;

/**
 * 效价融合一侧材料。
 */
export const ValenceMaterialDtoSchema = z.object({
  element: ValenceElementSchema.optional(),
  elementLabel: LocalizedNameSchema.optional(),
  percent: z.number().positive().max(100),
});

/**
 * 效价融合 / 规划 DTO（数学对齐 SDJK；元素图标走本地资产）。
 */
export const ValenceFusionDtoSchema = z.object({
  /** fusion=两把融合；plan=单值到满值轨迹；usage=用法说明 */
  mode: z.enum(['fusion', 'plan', 'usage']),
  /** 融合结果加成（fusion） */
  percent: z.number().nonnegative().max(100).optional(),
  /** 可选元素列表 */
  options: z
    .array(
      z.object({
        element: ValenceElementSchema,
        label: LocalizedNameSchema,
      }),
    )
    .default([]),
  /** 说明：同元素 / 二选一等 */
  note: z.string().optional(),
  /** 公式短文 */
  formula: z.string().optional(),
  /** 输入材料（fusion 时最多 2 侧） */
  materials: z.array(ValenceMaterialDtoSchema).default([]),
  /** plan 轨迹百分比 */
  steps: z.array(z.number()).default([]),
  /** 文本/卡面共用行 */
  lines: z.array(z.string()),
});

/**
 * 效价融合 DTO。
 */
export type ValenceFusionDto = z.infer<typeof ValenceFusionDtoSchema>;
