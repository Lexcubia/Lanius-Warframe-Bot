import type { AccessTokenCache } from './access-token.js';
import { getAppAccessToken } from './access-token.js';

/** 指令面板生效场景。 */
export type QqPanelScope = 'c2c' | 'group' | 'channel' | 'dm';

/**
 * 同步到开放平台的一条面板指令项。
 */
export type QqPanelCommandItem = {
  /** 点击后填入输入框的文本（≤14 字符）。 */
  name: string;
  /** 面板展示说明（≤30 字符）。 */
  desc: string;
};

/**
 * 同步指令面板的选项。
 */
export type SyncQqCommandPanelsOptions = {
  appId: string;
  appSecret: string;
  fetchImpl?: typeof fetch;
  apiBaseUrl?: string;
  cache?: { current?: AccessTokenCache };
  /** 需要确保存在的场景列表，默认 group + channel + c2c。 */
  scopes?: readonly QqPanelScope[];
  /** 面板指令项；调用方从 Lanius 指令目录映射。 */
  items: readonly QqPanelCommandItem[];
  /** 写入 panel.remark，用于识别本产品面板以便更新。 */
  remark?: string;
};

/**
 * 单场景同步结果。
 */
export type SyncQqCommandPanelResult = {
  scope: QqPanelScope;
  panelId: string;
  action: 'created' | 'updated' | 'skipped';
  detail?: string;
};

const DEFAULT_SCOPES: readonly QqPanelScope[] = ['group', 'channel', 'c2c'];
const DEFAULT_REMARK = 'lanius-mvp-commands';

/**
 * 将 Lanius 指令同步为官方「指令面板」（创建或按 remark 更新）。
 * 用户可在 QQ 输入框旁看到预设指令；点击后把 `name` 填入输入框。
 *
 * @param options - 凭据、场景与指令项
 * @returns 各场景同步结果列表
 */
export async function syncQqCommandPanels(
  options: SyncQqCommandPanelsOptions,
): Promise<SyncQqCommandPanelResult[]> {
  const scopes = options.scopes ?? DEFAULT_SCOPES;
  const remark = options.remark ?? DEFAULT_REMARK;
  const items = options.items.map((item) => ({
    type: 'command' as const,
    name: truncateChars(item.name, 14),
    desc: truncateChars(item.desc, 30),
    only_admin: false,
  }));

  const results: SyncQqCommandPanelResult[] = [];
  for (const scope of scopes) {
    results.push(await syncOneScope(options, scope, items, remark));
  }
  return results;
}

/**
 * 同步单个场景的指令面板。
 *
 * @param options - 全局同步选项
 * @param scope - 场景
 * @param items - 已截断的面板元素
 * @param remark - 用于识别本产品面板的备注
 * @returns 该场景的同步结果
 */
async function syncOneScope(
  options: SyncQqCommandPanelsOptions,
  scope: QqPanelScope,
  items: Array<{
    type: 'command';
    name: string;
    desc: string;
    only_admin: boolean;
  }>,
  remark: string,
): Promise<SyncQqCommandPanelResult> {
  const existing = await listPanels(options, scope);
  const ours = existing.find((row) => row.panel?.remark === remark);

  if (ours?.panel_id) {
    await openApiJson(options, 'PUT', `/v2/panels/${ours.panel_id}`, {
      panel: { items, remark, version: (ours.version ?? 0) + 1 },
    });
    return { scope, panelId: ours.panel_id, action: 'updated' };
  }

  const created = await openApiJson<{ panel_id?: string }>(
    options,
    'POST',
    '/v2/panels',
    {
      scope,
      target_type: 'all',
      panel: { items, remark },
    },
  );
  if (!created.panel_id) {
    return {
      scope,
      panelId: '',
      action: 'skipped',
      detail: 'create response missing panel_id',
    };
  }
  return { scope, panelId: created.panel_id, action: 'created' };
}

/**
 * 拉取某场景下已有面板列表（首页，足够定位本产品 remark）。
 *
 * @param options - 凭据与 fetch
 * @param scope - 场景
 * @returns 面板摘要列表
 */
async function listPanels(
  options: SyncQqCommandPanelsOptions,
  scope: QqPanelScope,
): Promise<
  Array<{
    panel_id?: string;
    version?: number;
    panel?: { remark?: string };
  }>
> {
  const data = await openApiJson<{
    records?: Array<{
      panel_id?: string;
      version?: number;
      panel?: { remark?: string };
    }>;
  }>(options, 'GET', `/v2/panels?scope=${encodeURIComponent(scope)}&limit=50`);
  return data.records ?? [];
}

/**
 * 带 QQBot Authorization 的 JSON OpenAPI 调用。
 *
 * @param options - 凭据
 * @param method - HTTP 方法
 * @param path - 以 `/` 开头的路径（可含 query）
 * @param body - JSON 请求体；GET 时忽略
 * @returns 解析后的 JSON 对象
 * @throws Error 当 HTTP 非 2xx 或业务码失败
 */
async function openApiJson<T>(
  options: SyncQqCommandPanelsOptions,
  method: 'GET' | 'POST' | 'PUT',
  path: string,
  body?: unknown,
): Promise<T> {
  const apiBase = (options.apiBaseUrl ?? 'https://api.bot.qq.com').replace(/\/$/, '');
  const token = await getAppAccessToken({
    appId: options.appId,
    clientSecret: options.appSecret,
    fetchImpl: options.fetchImpl,
    apiBaseUrl: options.apiBaseUrl,
    cache: options.cache,
  });
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(`${apiBase}${path}`, {
    method,
    headers: {
      Authorization: `QQBot ${token}`,
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let parsed: T & { code?: number; message?: string };
  try {
    parsed = JSON.parse(text) as T & { code?: number; message?: string };
  } catch {
    throw new Error(`QQ OpenAPI ${method} ${path} non-json: HTTP ${response.status}`);
  }
  if (!response.ok || parsed.code != null) {
    throw new Error(
      `QQ OpenAPI ${method} ${path} failed: HTTP ${response.status} code=${parsed.code ?? 'n/a'} message=${parsed.message ?? text.slice(0, 200)}`,
    );
  }
  return parsed;
}

/**
 * 按 Unicode 码位截断字符串（官方按字符计长度）。
 *
 * @param value - 原始文案
 * @param maxChars - 最大字符数
 * @returns 截断后的字符串
 */
function truncateChars(value: string, maxChars: number): string {
  const chars = Array.from(value);
  if (chars.length <= maxChars) {
    return value;
  }
  return chars.slice(0, maxChars).join('');
}
