import { LabelsConfigSchema, SiteDtoSchema, type LabelsConfig, type SiteDto } from '@lanius/core';
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
      worldstateUrl: z.string().url().default('https://api.warframe.com/cdn/worldState.php'),
      warframeMarketUrl: z.string().url().default('https://api.warframe.market/v2'),
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
  commandPrefixPolicy: z.enum(['optional', 'required', 'bare']).default('optional'),
  image: z
    .object({
      maxPerUserPerMinute: z.number().int().positive().default(5),
      renderTimeoutMs: z.number().int().positive().default(4000),
    })
    .default({}),
  /**
   * 裂隙回复的 Markdown 嵌图开关（默认关）。
   * 开启且配置 COS 时，卡片图经 COS 转公网 URL，
   * 以单条 Markdown（嵌图 + 底部按钮）发送；关闭则退回「图片 + Markdown 按钮」两条。
   * 后续其他功能模块可复用同一 Markdown 嵌图通道。
   * TODO: QQ markdown 嵌图在气泡中仍被裁切/不渲染（桌面端只显示局部、移动端显示 [img]），
   *       待排查官方对自定义 content 嵌图的支持细节后再开启。
   */
  markdownImage: z.boolean().default(false),
  /**
   * 腾讯云 COS（卡片图公网托管，供 Markdown 内嵌图片）。
   * 缺省时 Markdown 嵌图降级为纯文本。
   */
  cos: z
    .object({
      secretId: z.string().min(1),
      secretKey: z.string().min(1),
      /** 桶名，含 APPID，如 `xxx-1257961979` */
      bucket: z.string().min(1),
      /** 地域，如 `ap-shanghai` */
      region: z.string().min(1),
      /** 自定义 CDN/域名（缺省用桶默认域名） */
      domain: z.string().optional(),
      /** 对象键前缀，如 `lanius/cards/` */
      prefix: z.string().default('lanius/cards/'),
    })
    .optional(),
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
 * 生产默认 `deployMode=node`（git + pnpm build + systemd）；`docker` 为可选镜像路径。
 */
export const GithubModuleSchema = z.object({
  owner: z.string().default('Lexcubia'),
  repo: z.string().default('Lanius-Warframe-Bot'),
  token: z.string().optional(),
  /** 升级脚本所在目录（宿主机 `deploy/`） */
  deployDir: z.string().default('/opt/lanius/repo/deploy'),
  /** 仓库根（Node 升级脚本 `LANIUS_REPO`；默认由 deployDir 上一级推断） */
  repoRoot: z.string().default('/opt/lanius/repo'),
  /**
   * 选版执行路径：`node` → update-node.sh；`docker` → update-image.sh。
   */
  deployMode: z.enum(['node', 'docker']).default('node'),
  /** 仅 docker 模式使用的 compose 文件名 */
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
export const MODULE_FIELD_META: Record<ConfigModuleId, Record<string, FieldMeta>> = {
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
    markdownImage: { description: '裂隙 Markdown 嵌图开关（默认开）' },
    'cos.secretId': { secret: true, description: 'COS SecretId' },
    'cos.secretKey': { secret: true, description: 'COS SecretKey' },
    'cos.bucket': { description: 'COS 桶名（含 APPID）' },
    'cos.region': { description: 'COS 地域' },
    'cos.domain': { description: 'COS 自定义域名' },
    'cos.prefix': { description: 'COS 对象键前缀' },
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
    repoRoot: { description: '仓库根（Node 升级用）' },
    deployMode: { description: 'node | docker（生产默认 node）' },
    composeFile: { description: '仅 docker 模式的 compose 文件' },
  },
};

/**
 * 掩码占位符（读接口展示；写时空串或此值表示保持原值）。
 */
export const SECRET_MASK = '********';
