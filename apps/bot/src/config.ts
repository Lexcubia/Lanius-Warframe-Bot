import { readFileSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';

import { z } from 'zod';
import { parse as parseYaml } from 'yaml';

/**
 * Bot 相关 YAML 配置的 Zod schema。
 */
export const BotConfigSchema = z.object({
  qq: z.object({
    appId: z.string().default('YOUR_QQ_APP_ID'),
    appSecret: z.string().default('YOUR_QQ_APP_SECRET'),
    callbackPath: z.string().default('/qq/callback'),
  }),
  bot: z
    .object({
      host: z.string().default('127.0.0.1'),
      port: z.number().int().positive().default(8788),
      apiBaseUrl: z.string().url().default('http://127.0.0.1:8787'),
      defaultReplyMode: z.enum(['text', 'image']).default('text'),
      dryRun: z.boolean().default(true),
      publicSiteBaseUrl: z.string().url().optional(),
      image: z
        .object({
          maxPerUserPerMinute: z.number().int().positive().default(5),
          renderTimeoutMs: z.number().int().positive().default(4000),
        })
        .default({}),
    })
    .default({}),
  defaults: z
    .object({
      realm: z.enum(['international', 'china']).default('international'),
      locale: z.enum(['zh', 'en']).default('zh'),
    })
    .default({}),
});

/**
 * 解析后的 Bot 配置。
 */
export type BotConfig = z.infer<typeof BotConfigSchema>;

/**
 * 用非密钥环境变量覆盖 YAML 中的服务发现字段（Docker Compose 内网）。
 * 密钥仍只来自配置文件；此处仅覆盖 `apiBaseUrl` / `publicSiteBaseUrl`。
 *
 * @param config - 已通过 Zod 校验的 Bot 配置
 * @returns 应用环境覆盖后的配置
 */
export function applyBotEnvOverrides(config: BotConfig): BotConfig {
  const apiBase = process.env.LANIUS_API_BASE?.trim();
  const siteBase = process.env.PUBLIC_SITE_BASE_URL?.trim();
  if (!apiBase && !siteBase) {
    return config;
  }
  return {
    ...config,
    bot: {
      ...config.bot,
      ...(apiBase ? { apiBaseUrl: apiBase } : {}),
      ...(siteBase ? { publicSiteBaseUrl: siteBase } : {}),
    },
  };
}

/**
 * 从 YAML 加载 Bot 配置（优先 `config.local.yaml`）。
 *
 * @param cwd - 用于解析相对路径的工作目录
 * @returns 通过校验并经环境变量覆盖后的 Bot 配置
 */
export function loadBotConfig(cwd: string = process.cwd()): BotConfig {
  const override = process.env.LANIUS_CONFIG;
  const candidates = override
    ? [isAbsolute(override) ? override : resolve(cwd, override)]
    : [resolve(cwd, 'config.local.yaml'), resolve(cwd, 'config.example.yaml')];

  for (const path of candidates) {
    try {
      const raw = parseYaml(readFileSync(path, 'utf8'));
      return applyBotEnvOverrides(BotConfigSchema.parse(raw ?? {}));
    } catch {
      // 尝试下一个候选路径
    }
  }

  return applyBotEnvOverrides(BotConfigSchema.parse({}));
}

/**
 * 当进程 cwd 为 `apps/bot` 时解析 monorepo 根目录。
 *
 * @param cwd - 当前工作目录
 * @returns 仓库根目录绝对路径
 */
export function resolveRepoRoot(cwd: string = process.cwd()): string {
  if (cwd.replace(/\\/g, '/').endsWith('/apps/bot')) {
    return resolve(cwd, '../..');
  }
  return cwd;
}
