import type { AccessTokenCache } from './access-token.js';
import { getAppAccessToken } from './access-token.js';

/**
 * 官方 OpenAPI JSON 调用的公共选项。
 */
export type QqOpenApiOptions = {
  appId: string;
  appSecret: string;
  fetchImpl?: typeof fetch;
  apiBaseUrl?: string;
  cache?: { current?: AccessTokenCache };
};

/**
 * 带 `QQBot` Authorization 的 JSON OpenAPI 调用。
 * 官方成功体可能带 `code: 0`；仅非 0 的 code 视为业务失败。
 *
 * @param options - 凭据与 fetch
 * @param method - HTTP 方法
 * @param path - 以 `/` 开头的路径（可含 query）
 * @param body - JSON 请求体；GET 时忽略
 * @returns 解析后的 JSON 对象
 * @throws Error 当 HTTP 非 2xx 或业务码非 0
 */
export async function qqOpenApiJson<T>(
  options: QqOpenApiOptions,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
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
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let parsed: T & { code?: number; message?: string; msg?: string };
  try {
    parsed = (text ? JSON.parse(text) : {}) as T & {
      code?: number;
      message?: string;
      msg?: string;
    };
  } catch {
    throw new Error(`QQ OpenAPI ${method} ${path} non-json: HTTP ${response.status}`);
  }

  const businessCode = parsed.code;
  const businessFailed = businessCode != null && Number(businessCode) !== 0;
  if (!response.ok || businessFailed) {
    const limit =
      typeof (parsed as { limit?: unknown }).limit !== 'undefined'
        ? ` limit=${String((parsed as { limit?: unknown }).limit)}`
        : '';
    throw new Error(
      `QQ OpenAPI ${method} ${path} failed: HTTP ${response.status} code=${businessCode ?? 'n/a'} message=${parsed.message ?? parsed.msg ?? ''}${limit} body=${text.slice(0, 300)}`,
    );
  }
  return parsed;
}

/**
 * 按「中文算 2、其余算 1」截断（自定义菜单 name 规则）。
 *
 * @param value - 原始文案
 * @param maxWeighted - 加权最大长度
 * @returns 截断后的字符串
 */
export function truncateWeightedChars(value: string, maxWeighted: number): string {
  let weight = 0;
  const out: string[] = [];
  for (const ch of value) {
    const w = /[\u4e00-\u9fff]/.test(ch) ? 2 : 1;
    if (weight + w > maxWeighted) {
      break;
    }
    out.push(ch);
    weight += w;
  }
  return out.join('');
}

/**
 * 按 Unicode 码位截断（指令面板 name/desc 近似规则）。
 *
 * @param value - 原始文案
 * @param maxChars - 最大码位数
 * @returns 截断后的字符串
 */
export function truncateChars(value: string, maxChars: number): string {
  const chars = Array.from(value);
  if (chars.length <= maxChars) {
    return value;
  }
  return chars.slice(0, maxChars).join('');
}
