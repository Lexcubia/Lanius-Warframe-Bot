import { z } from 'zod';

/**
 * 单条显示名覆盖（zh/en 均可选）。
 */
export const LabelOverrideSchema = z.object({
  zh: z.string().optional(),
  en: z.string().optional(),
});

/**
 * 显示名覆盖条目。
 */
export type LabelOverride = z.infer<typeof LabelOverrideSchema>;

/**
 * 运行时 labels 配置（派系 / 节点 / 路径等覆盖表）。
 */
export const LabelsConfigSchema = z.object({
  factions: z.record(LabelOverrideSchema).default({}),
  nodes: z.record(LabelOverrideSchema).default({}),
  paths: z.record(LabelOverrideSchema).default({}),
});

/**
 * Labels 配置 DTO。
 */
export type LabelsConfig = z.infer<typeof LabelsConfigSchema>;
