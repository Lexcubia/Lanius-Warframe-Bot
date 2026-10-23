/**
 * Admin 配置结构化表单：字段元数据与路径读写（对齐 `@lanius/config` MODULE_FIELD_META，
 * 不直接导入 config 驱动，避免把 Node YAML 打进浏览器包）。
 */

/** 密钥掩码占位（与 API 约定一致）。 */
export const ADMIN_SECRET_MASK = '********';

/**
 * 表单控件类型。
 */
export type AdminConfigControl = 'text' | 'password' | 'number' | 'boolean' | 'select' | 'textarea';

/**
 * 单个配置字段描述。
 */
export type AdminConfigFieldDef = {
  /** 点分路径，如 `upstream.timeoutMs` */
  path: string;
  /** 表单标签 */
  label: string;
  /** 控件类型 */
  control: AdminConfigControl;
  /** 说明 */
  description?: string;
  /** 是否密钥（掩码 / 空串保持原值） */
  secret?: boolean;
  /** 是否需进程重启后生效 */
  restartRequired?: boolean;
  /** select 选项 */
  options?: Array<{ label: string; value: string }>;
};

/**
 * 各模块结构化字段（Zod 对齐的常用键；复杂模块可退回高级 JSON）。
 */
export const ADMIN_CONFIG_FIELDS: Record<string, AdminConfigFieldDef[]> = {
  api: [
    {
      path: 'host',
      label: '监听地址',
      control: 'text',
      restartRequired: true,
    },
    {
      path: 'port',
      label: '监听端口',
      control: 'number',
      restartRequired: true,
    },
    {
      path: 'adminToken',
      label: 'Admin Bearer Token',
      control: 'password',
      secret: true,
      description: 'Bot/内部调用；留空或掩码表示保持原值',
    },
    {
      path: 'upstream.worldstateUrl',
      label: 'WorldState URL',
      control: 'text',
    },
    {
      path: 'upstream.warframeMarketUrl',
      label: 'Warframe Market URL',
      control: 'text',
    },
    {
      path: 'upstream.timeoutMs',
      label: '上游超时 (ms)',
      control: 'number',
    },
  ],
  bot: [
    {
      path: 'host',
      label: '监听地址',
      control: 'text',
      restartRequired: true,
    },
    {
      path: 'port',
      label: '监听端口',
      control: 'number',
      restartRequired: true,
    },
    {
      path: 'apiBaseUrl',
      label: 'Lanius API 基址',
      control: 'text',
    },
    {
      path: 'defaultReplyMode',
      label: '默认回复模式',
      control: 'select',
      options: [
        { label: 'text', value: 'text' },
        { label: 'image', value: 'image' },
      ],
    },
    {
      path: 'dryRun',
      label: 'Dry-run（跳过真实 QQ 下行）',
      control: 'boolean',
    },
    {
      path: 'publicSiteBaseUrl',
      label: '公开站基址（导流 URL）',
      control: 'text',
    },
    {
      path: 'pushIntervalMs',
      label: '推送轮询间隔 (ms)',
      control: 'number',
    },
    {
      path: 'commandPrefix',
      label: '指令前导符',
      control: 'text',
    },
    {
      path: 'commandPrefixPolicy',
      label: '前导策略',
      control: 'select',
      options: [
        { label: 'optional', value: 'optional' },
        { label: 'required', value: 'required' },
        { label: 'bare', value: 'bare' },
      ],
    },
    {
      path: 'image.maxPerUserPerMinute',
      label: '每用户每分钟图片上限',
      control: 'number',
    },
    {
      path: 'image.renderTimeoutMs',
      label: '渲染超时 (ms)',
      control: 'number',
    },
    {
      path: 'markdownImage',
      label: 'Markdown 嵌图',
      control: 'boolean',
    },
    {
      path: 'cos.secretId',
      label: 'COS SecretId',
      control: 'password',
      secret: true,
    },
    {
      path: 'cos.secretKey',
      label: 'COS SecretKey',
      control: 'password',
      secret: true,
    },
    {
      path: 'cos.bucket',
      label: 'COS 桶名',
      control: 'text',
    },
    {
      path: 'cos.region',
      label: 'COS 地域',
      control: 'text',
    },
    {
      path: 'cos.domain',
      label: 'COS 自定义域名',
      control: 'text',
    },
    {
      path: 'cos.prefix',
      label: 'COS 对象键前缀',
      control: 'text',
    },
  ],
  qq: [
    {
      path: 'appId',
      label: 'App ID',
      control: 'password',
      secret: true,
    },
    {
      path: 'appSecret',
      label: 'App Secret',
      control: 'password',
      secret: true,
    },
    {
      path: 'callbackPath',
      label: '回调路径',
      control: 'text',
    },
    {
      path: 'panelIds.c2c',
      label: 'C2C 面板 ID',
      control: 'text',
    },
    {
      path: 'panelIds.group',
      label: '群面板 ID',
      control: 'text',
    },
  ],
  admin: [
    {
      path: 'username',
      label: '用户名',
      control: 'text',
    },
    {
      path: 'passwordHash',
      label: '口令哈希',
      control: 'password',
      secret: true,
      description: 'bcrypt 或本地 plain:…；留空/掩码保持原值',
    },
    {
      path: 'sessionSecret',
      label: '会话签名密钥',
      control: 'password',
      secret: true,
    },
  ],
  redis: [
    {
      path: 'url',
      label: 'Redis URL',
      control: 'password',
      secret: true,
      restartRequired: true,
      description: '空串表示进程内缓存',
    },
  ],
  database: [
    {
      path: 'sqlitePath',
      label: 'SQLite 路径',
      control: 'text',
      restartRequired: true,
    },
  ],
  defaults: [
    {
      path: 'realm',
      label: 'Realm',
      control: 'select',
      options: [
        { label: 'international', value: 'international' },
        { label: 'china（预留）', value: 'china' },
      ],
    },
    {
      path: 'locale',
      label: '默认语言',
      control: 'select',
      options: [
        { label: 'zh', value: 'zh' },
        { label: 'en', value: 'en' },
      ],
    },
    {
      path: 'qqReplyMode',
      label: 'QQ 默认回复模式',
      control: 'select',
      options: [
        { label: 'text', value: 'text' },
        { label: 'image', value: 'image' },
      ],
    },
  ],
  web: [
    {
      path: 'apiBaseUrl',
      label: 'Web → API 基址',
      control: 'text',
    },
  ],
  github: [
    {
      path: 'owner',
      label: 'GitHub Owner',
      control: 'text',
    },
    {
      path: 'repo',
      label: '仓库名',
      control: 'text',
    },
    {
      path: 'token',
      label: 'PAT（可选）',
      control: 'password',
      secret: true,
      description: '提高 API 限额；勿提交真实 token',
    },
    {
      path: 'deployDir',
      label: 'deploy 目录',
      control: 'text',
    },
    {
      path: 'repoRoot',
      label: '仓库根',
      control: 'text',
    },
    {
      path: 'deployMode',
      label: '部署模式',
      control: 'select',
      options: [
        { label: 'node', value: 'node' },
        { label: 'docker', value: 'docker' },
      ],
    },
    {
      path: 'composeFile',
      label: 'Compose 文件（docker）',
      control: 'text',
    },
  ],
};

/**
 * 按点分路径读取对象字段。
 *
 * @param obj - 源对象
 * @param path - 如 `upstream.timeoutMs`
 * @returns 值或 undefined
 */
export function adminGetByPath(obj: unknown, path: string): unknown {
  const parts = path.split('.');
  let cur: unknown = obj;
  for (const part of parts) {
    if (cur === null || typeof cur !== 'object') {
      return undefined;
    }
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

/**
 * 按点分路径写入对象字段（就地修改）。
 *
 * @param obj - 可变对象
 * @param path - 点分路径
 * @param value - 新值
 * @returns 无返回值
 */
export function adminSetByPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.');
  let cur: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i] ?? '';
    const next = cur[key];
    if (next === null || typeof next !== 'object' || Array.isArray(next)) {
      cur[key] = {};
    }
    cur = cur[key] as Record<string, unknown>;
  }
  const last = parts[parts.length - 1];
  if (last) {
    cur[last] = value;
  }
}

/**
 * 深拷贝纯对象（配置草稿用）。
 *
 * @param data - 源数据
 * @returns 可编辑副本
 */
export function cloneConfigData(data: Record<string, unknown>): Record<string, unknown> {
  return structuredClone(data);
}

/**
 * 判断模块是否有预定义结构化字段。
 *
 * @param moduleId - 配置模块 id
 * @returns 是否有字段表
 */
export function hasStructuredConfigFields(moduleId: string): boolean {
  return (ADMIN_CONFIG_FIELDS[moduleId]?.length ?? 0) > 0;
}
