import { z } from 'zod';

/**
 * 页脚单行（备案号或附加链接）。
 */
export const SiteFooterLineSchema = z.object({
  text: z.string().min(1),
  href: z.string().url().optional(),
});

/**
 * 页脚行 DTO。
 */
export type SiteFooterLine = z.infer<typeof SiteFooterLineSchema>;

/**
 * 公开站点页脚配置。
 */
export const SiteFooterSchema = z.object({
  copyright: z.string().default(''),
  lines: z.array(SiteFooterLineSchema).default([]),
});

/**
 * 页脚 DTO。
 */
export type SiteFooter = z.infer<typeof SiteFooterSchema>;

/**
 * `GET /v1/site` 公开站点配置（无密钥）。
 */
export const SiteDtoSchema = z.object({
  footer: SiteFooterSchema.default({ copyright: '', lines: [] }),
});

/**
 * 站点配置 DTO。
 */
export type SiteDto = z.infer<typeof SiteDtoSchema>;
