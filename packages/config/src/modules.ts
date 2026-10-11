import {
  LabelsConfigSchema,
  SiteDtoSchema,
  type LabelsConfig,
  type SiteDto,
} from '@lanius/core';
import { z } from 'zod';

/**
 * 配置模块 id（与 `config/default/<id>.yaml` 文件名一致）。
 */
export const ConfigModuleIdSchema = z.enum([
  'api',
  'bot',
  'qq',
  'admin',
  'redis',
  'database',
  'defaults',
  'web',
  'site',
  'labels',
  'github',
]);

/**
 * 配置模块 id。
 */
export type ConfigModuleId = z.infer<typeof ConfigModuleIdSchema>;

/**
 * 全部模块 id 列表。
 */
export const CONFIG_MODULE_IDS = ConfigModuleIdSchema.options;

/**
 * API 进程监听与上游。
 */
export const ApiModuleSchema = z.object({
  host: z.string().default('127.0.0.1'),
  port: z.number().int().positive().default(8787),
  adminToken: z.string().optional(),
  upstream: z
    .object({
      worldstateUrl: z
        .string()
        .url()
        .default('https://api.warframe.com/cdn/worldState.php'),
      warframeMarketUrl: z
        .string()
        .url()
        .default('https://api.warframe.market/v1'),
      timeoutMs: z.number().int().positive().default(8000),
    })
    .default({}),
});

/**
 * Bot 进程配置。
 */
export const BotModuleSchema = z.object({
  host: z.string().default('127.0.0.1'),
  port: z.number().int().positive().default(8788),
  apiBaseUrl: z.string().url().default('http://127.0.0.1:8787'),
  defaultReplyMode: z.enum(['text', 'image']).default('image'),
  dryRun: z.boolean().default(true),
  publicSiteBaseUrl: z.string().url().optional(),
  panelIdStorePath: z.string().optional(),
  pushIntervalMs: z.number().int().nonnegative().default(60_000),
  commandPrefix: z.string().default('/'),
  commandPrefixPolicy: z
    .enum(['optional', 'required', 'bare'])
    .default('optional'),
  image: z
    .object({
      maxPerUserPerMinute: z.number().int().positive().default(5),
      renderTimeoutMs: z.number().int().positive().default(4000),
    })
    .default({}),
});

/**
 * QQ 官方凭据。
 */
export const QqModuleSchema = z.object({
  appId: z.string().default('YOUR_QQ_APP_ID'),
  appSecret: z.string().default('YOUR_QQ_APP_SECRET'),
  callbackPath: z.string().default('/qq/callback'),
  panelIds: z
    .object({
      c2c: z.string().optional(),
      group: z.string().optional(),
    })
    .default({}),
});

/**
 * 管理后台口令与会话。
 */
export const AdminModuleSchema = z.object({
  username: z.string().default('admin'),
  passwordHash: z.string().optional(),
  sessionSecret: z.string().optional(),
});

/**
 * Redis 连接。
 */
export const RedisModuleSchema = z.object({
  url: z.string().default('redis://127.0.0.1:6379'),
});

/**
 * SQLite 路径。
 */
export const DatabaseModuleSchema = z.object({
  sqlitePath: z.string().default('data/lanius.sqlite'),
});

/**
 * 产品默认 realm/locale。
 */
export const DefaultsModuleSchema = z.object({
  realm: z.enum(['international', 'china']).default('international'),
  locale: z.enum(['zh', 'en']).default('zh'),
  qqReplyMode: z.enum(['text', 'image']).default('text'),
});

/**
 * Web 宿主配置。
 */
export const WebModuleSchema = z.object({
  apiBaseUrl: z.string().url().default('http://127.0.0.1:8787'),
});

/**
 * GitHub 版本列表（Admin 选版）；token 可选提高限额。
 */
export const GithubModuleSchema = z.object({
  owner: z.string().default('Lexcubia'),
  repo: z.string().default('Lanius-Warframe-Bot'),
  token: z.string().optional(),
  /** compose 工程目录（容器内或宿主机路径，供 update 脚本） */
  deployDir: z.string().default('/opt/lanius/repo/deploy'),
  composeFile: z.string().default('docker-compose.app.yml'),
});

/**
 * 模块 schema 映射。
 */
export const MODULE_SCHEMAS = {
  api: ApiModuleSchema,
  bot: BotModuleSchema,
  qq: QqModuleSchema,
  admin: AdminModuleSchema,
  redis: RedisModuleSchema,
  database: DatabaseModuleSchema,
  defaults: DefaultsModuleSchema,
  web: WebModuleSchema,
  site: SiteDtoSchema,
  labels: LabelsConfigSchema,
  github: GithubModuleSchema,
} as const;

/**
 * 各模块解析后的类型。
 */
export type ModuleConfigMap = {
  api: z.infer<typeof ApiModuleSchema>;
  bot: z.infer<typeof BotModuleSchema>;
  qq: z.infer<typeof QqModuleSchema>;
  admin: z.infer<typeof AdminModuleSchema>;
  redis: z.infer<typeof RedisModuleSchema>;
  database: z.infer<typeof DatabaseModuleSchema>;
  defaults: z.infer<typeof DefaultsModuleSchema>;
  web: z.infer<typeof WebModuleSchema>;
  site: SiteDto;
  labels: LabelsConfig;
  github: z.infer<typeof GithubModuleSchema>;
};

/**
 * 字段元数据：密钥 / 需进程重启。
 */
export type FieldMeta = {
  secret?: boolean;
  restartRequired?: boolean;
  description?: string;
};

/**
 * 各模块字段元数据（点分路径）。
 */
export const MODULE_FIELD_META: Record<
  ConfigModuleId,
  Record<string, FieldMeta>
> = {
  api: {
    host: { restartRequired: true, description: '监听地址' },
    port: { restartRequired: true, description: '监听端口' },
    adminToken: { secret: true, description: '内部 Bearer token' },
    'upstream.worldstateUrl': { description: '官方 worldState URL' },
    'upstream.warframeMarketUrl': { description: 'Warframe Market API' },
    'upstream.timeoutMs': { description: '上游超时毫秒' },
  },
  bot: {
    host: { restartRequired: true },
    port: { restartRequired: true },
    apiBaseUrl: { description: 'Lanius API 基址' },
    dryRun: { description: '是否跳过真实 QQ 下行' },
    pushIntervalMs: { description: '推送轮询间隔' },
    commandPrefix: { description: '指令前导符' },
    commandPrefixPolicy: { description: '前导策略 optional|required|bare' },
  },
  qq: {
    appId: { secret: true },
    appSecret: { secret: true },
    callbackPath: {},
  },
  admin: {
    username: {},
    passwordHash: { secret: true },
    sessionSecret: { secret: true },
  },
  redis: {
    url: { restartRequired: true, secret: true, description: '空串=内存缓存' },
  },
  database: {
    sqlitePath: { restartRequired: true },
  },
  defaults: {
    realm: {},
    locale: {},
    qqReplyMode: {},
  },
  web: {
    apiBaseUrl: {},
  },
  site: {},
  labels: {},
  github: {
    token: { secret: true, description: '可选 PAT，提高 API 限额' },
    owner: {},
    repo: {},
    deployDir: { description: '宿主机 deploy 目录' },
    composeFile: {},
  },
};

/**
 * 掩码占位符（读接口展示；写时空串或此值表示保持原值）。
 */
export const SECRET_MASK = '********';
