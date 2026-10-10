import { z } from 'zod';

/**
 * Zod schema for the YAML config file consumed by `apps/api`.
 * Secrets belong in `config.local.yaml`; this schema only validates shape.
 */
export const AppConfigSchema = z.object({
  qq: z
    .object({
      appId: z.string().optional(),
      appSecret: z.string().optional(),
    })
    .optional(),
  admin: z
    .object({
      username: z.string().optional(),
      passwordHash: z.string().optional(),
      sessionSecret: z.string().optional(),
    })
    .optional(),
  api: z.object({
    host: z.string().default('127.0.0.1'),
    port: z.number().int().positive().default(8787),
    adminToken: z.string().optional(),
    upstream: z
      .object({
        worldstateUrl: z
          .string()
          .url()
          .default('https://content.warframe.com/dynamic/worldState.php'),
        timeoutMs: z.number().int().positive().default(8000),
      })
      .default({}),
  }),
  defaults: z
    .object({
      realm: z.enum(['international', 'china']).default('international'),
      locale: z.enum(['zh', 'en']).default('zh'),
      qqReplyMode: z.enum(['text', 'image']).default('text'),
      commandPrefix: z.string().default('wf'),
    })
    .default({}),
});

/**
 * Parsed application configuration used by the API process.
 */
export type AppConfig = z.infer<typeof AppConfigSchema>;
