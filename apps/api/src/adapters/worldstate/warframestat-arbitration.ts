import type { UpstreamArbitration } from './types.js';

/**
 * WFCD warframestat.us 默认基址（文档化社区源；仅 API 适配层使用）。
 * @see https://docs.warframestat.us/
 */
export const DEFAULT_WARFRAMESTAT_BASE_URL = 'https://api.warframestat.us';

/**
 * 拉取仲裁时使用的平台段（国际服 MVP 对齐 PC）。
 */
export const WARFRAMESTAT_ARBITRATION_PLATFORM = 'pc';

/**
 * 社区源标记，写入 `ArbitrationDto.source`。
 */
export const WARFRAMESTAT_ARBITRATION_SOURCE = 'warframestat';

/**
 * 拉取 warframestat 仲裁的选项。
 */
export type FetchWarframestatArbitrationOptions = {
  /** API 基址，缺省 {@link DEFAULT_WARFRAMESTAT_BASE_URL} */
  baseUrl?: string;
  timeoutMs: number;
  fetchImpl?: typeof fetch;
};

/**
 * 从 WFCD warframestat.us 拉取当前仲裁（`GET /{platform}/arbitration`）。
 * 官方 worldState **无**独立 Arbitrations；本源失败时由调用方降级为 `null`，不得抛穿到 `/v1/worldstate`。
 *
 * @param options - 基址、超时与可选 `fetch`
 * @returns 解析后的上游薄对象；HTTP/超时/非对象时抛错（由服务层吞掉）
 * @throws Error 当 HTTP 非 2xx、超时或响应非 JSON 对象时
 */
export async function fetchWarframestatArbitration(
  options: FetchWarframestatArbitrationOptions,
): Promise<UpstreamArbitration> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const base = (options.baseUrl ?? DEFAULT_WARFRAMESTAT_BASE_URL).replace(/\/$/, '');
  const url = `${base}/${WARFRAMESTAT_ARBITRATION_PLATFORM}/arbitration`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);

  try {
    const response = await fetchImpl(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent':
          'Lanius-Warframe-Bot/0.0.0 (+https://github.com/Lexcubia/Lanius-Warframe-Bot)',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`warframestat arbitration HTTP ${response.status}`);
    }

    const body: unknown = await response.json();
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
      throw new Error('warframestat arbitration response is not a JSON object');
    }

    return normalizeWarframestatArbitration(body as Record<string, unknown>);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 将 warframestat 原始 JSON 规范为 {@link UpstreamArbitration}（容错缺字段）。
 *
 * @param body - 上游 JSON 对象
 * @returns 薄上游仲裁对象
 */
export function normalizeWarframestatArbitration(
  body: Record<string, unknown>,
): UpstreamArbitration {
  const nodeKey = asNonEmptyString(body.nodeKey);
  const node = asNonEmptyString(body.node);
  const typeKey = asNonEmptyString(body.typeKey);
  const type = asNonEmptyString(body.type);
  const enemy = asNonEmptyString(body.enemy);
  const activation = asIsoOrRaw(body.activation);
  const expiry = asIsoOrRaw(body.expiry);
  const expired = typeof body.expired === 'boolean' ? body.expired : undefined;

  return {
    ...(nodeKey ? { nodeKey } : {}),
    ...(node ? { node } : {}),
    ...(typeKey ? { typeKey } : {}),
    ...(type ? { type } : {}),
    ...(enemy ? { enemy } : {}),
    ...(activation ? { activation } : {}),
    ...(expiry ? { expiry } : {}),
    ...(expired !== undefined ? { expired } : {}),
  };
}

/**
 * 读取非空字符串字段。
 *
 * @param value - 未知值
 * @returns 修剪后的非空串，否则 `undefined`
 */
function asNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * 将激活/过期字段尽量规范为 ISO8601；无法解析时保留原串供 mapper 再判。
 *
 * @param value - 上游时间字段（ISO 串或可解析 Date）
 * @returns ISO 串或原串；空则 `undefined`
 */
function asIsoOrRaw(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  const ms = Date.parse(trimmed);
  if (Number.isFinite(ms)) {
    return new Date(ms).toISOString();
  }
  return trimmed;
}
